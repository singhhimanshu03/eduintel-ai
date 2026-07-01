import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { Pool } from 'pg'; import { createClient } from 'redis'; import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3007;
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(morgan('combined'));

const MAX_RETRIES = 3;
const DELIVERY_SLA_MS = 60000;

async function deliverEmail(to: string, subject: string, message: string, notifId: string) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await mailer.sendMail({ from: process.env.FROM_EMAIL, to, subject, html: `<p>${message}</p>` });
      await db.query(`UPDATE notifications SET delivery_status='delivered', sent_at=now() WHERE id=$1`, [notifId]);
      return;
    } catch {
      await db.query(`UPDATE notifications SET retry_count=$1 WHERE id=$2`, [attempt + 1, notifId]);
      if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  await db.query(`UPDATE notifications SET delivery_status='failed' WHERE id=$1`, [notifId]);
}

// POST /send — internal endpoint
app.post('/api/notifications/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate internal secret
    if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SERVICE_SECRET) {
      res.status(403).json({ success: false, message: 'Forbidden' }); return;
    }
    const { userId, eventType, channel = 'in_app', subject = '', message, broadcast, institutionId } = req.body as {
      userId?: string; eventType: string; channel?: string; subject?: string;
      message: string; broadcast?: boolean; institutionId?: string;
    };

    const now = Date.now();
    const channels: string[] = channel === 'both' ? ['email', 'in_app'] : [channel];

    for (const ch of channels) {
      const { rows } = await db.query(
        `INSERT INTO notifications (user_id, event_type, channel, subject, message, delivery_status)
         VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id`,
        [userId ?? null, eventType, ch, subject, message]
      );
      const notifId = rows[0].id;

      if (ch === 'in_app') {
        await redis.publish(`notifications:${userId}`, JSON.stringify({ eventType, message, subject }));
        await db.query(`UPDATE notifications SET delivery_status='delivered', sent_at=now() WHERE id=$1`, [notifId]);
      }
      if (ch === 'email' && userId) {
        // Look up real email from user service via auth DB if available,
        // fallback to a stored email field in the notification payload itself.
        const recipientEmail = (req.body as { recipientEmail?: string }).recipientEmail;
        if (recipientEmail) {
          setImmediate(() => deliverEmail(recipientEmail, subject, message, notifId));
        } else {
          // No email available — mark as skipped rather than sending to fabricated address
          await db.query(`UPDATE notifications SET delivery_status='skipped' WHERE id=$1`, [notifId]);
        }
      }
    }
    res.json({ success: true, message: 'Notification queued' });
  } catch (err) { next(err); }
});

// GET /user/:id — notification history
app.get('/api/notifications/user/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '30' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await db.query(
      `SELECT id, event_type, channel, subject, message, delivery_status, sent_at, created_at
       FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.params.id, parseInt(limit), offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// PUT /:id/read
app.put('/api/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.query(`UPDATE notifications SET delivery_status='delivered' WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /preferences
app.post('/api/notifications/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailEnabled, inAppEnabled, eventOverrides } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;
    await db.query(
      `INSERT INTO notification_preferences (institution_id, email_enabled, in_app_enabled, event_overrides, updated_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (institution_id) DO UPDATE SET
         email_enabled=$2, in_app_enabled=$3, event_overrides=$4, updated_at=now()`,
      [institutionId, emailEnabled, inAppEnabled, JSON.stringify(eventOverrides ?? {})]
    );
    res.json({ success: true, message: 'Preferences saved' });
  } catch (err) { next(err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: 'Internal server error' });
});
app.listen(PORT, () => console.log(`Notification service on port ${PORT}`));
