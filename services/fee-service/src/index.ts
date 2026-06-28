import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { Pool } from 'pg'; import axios from 'axios'; import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3006;
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(morgan('combined'));

// POST /structures
app.post('/api/fees/structures', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, semester, academicYear, totalAmount, dueDate } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;
    const { rows } = await db.query(
      `INSERT INTO fee_structures (institution_id, course_id, semester, academic_year, total_amount, due_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [institutionId, courseId, semester, academicYear, totalAmount, dueDate]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /students/:id/status
app.get('/api/fees/students/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM student_fee_ledger WHERE student_id=$1`, [req.params.id]
    );
    if (!rows.length) {
      res.json({ success: true, data: { student_id: req.params.id, fee_status: 'unpaid', balance: 0, paid_amount: 0, total_fee: 0 } });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /transactions
app.post('/api/fees/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, amount, paymentMode, receiptNumber, paymentStatus = 'completed' } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;

    // Duplicate receipt check
    const { rows: dup } = await db.query(
      `SELECT id FROM fee_transactions WHERE receipt_number=$1 AND institution_id=$2`,
      [receiptNumber, institutionId]
    );
    if (dup.length) { res.status(409).json({ success: false, message: 'Duplicate receipt number' }); return; }

    await db.query(
      `INSERT INTO fee_transactions (student_id, institution_id, amount, payment_mode, receipt_number, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [studentId, institutionId, amount, paymentMode, receiptNumber, paymentStatus]
    );

    // Upsert ledger
    if (paymentStatus === 'completed') {
      await db.query(
        `INSERT INTO student_fee_ledger (student_id, paid_amount, total_fee, balance, fee_status, last_payment_date)
         VALUES ($1,$2,0,-$2,'paid',now())
         ON CONFLICT (student_id) DO UPDATE SET
           paid_amount = student_fee_ledger.paid_amount + $2,
           balance = student_fee_ledger.total_fee - (student_fee_ledger.paid_amount + $2),
           fee_status = CASE
             WHEN student_fee_ledger.total_fee <= (student_fee_ledger.paid_amount + $2) THEN 'paid'
             WHEN (student_fee_ledger.paid_amount + $2) > 0 THEN 'partially_paid'
             ELSE 'unpaid' END,
           last_payment_date = now(), updated_at = now()`,
        [studentId, amount]
      );
    }
    res.status(201).json({ success: true, message: 'Transaction recorded' });
  } catch (err) { next(err); }
});

// GET /defaulters
app.get('/api/fees/defaulters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await db.query(
      `SELECT * FROM student_fee_ledger WHERE fee_status != 'paid' ORDER BY balance DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /analytics
app.get('/api/fees/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: summary } = await db.query(
      `SELECT fee_status, COUNT(*) as count, SUM(balance) as total_balance,
              SUM(paid_amount) as total_collected
       FROM student_fee_ledger GROUP BY fee_status`
    );
    const { rows: recent } = await db.query(
      `SELECT DATE(transaction_date) as date, SUM(amount) as daily_collection
       FROM fee_transactions WHERE payment_status='completed'
         AND transaction_date > now() - INTERVAL '30 days'
       GROUP BY DATE(transaction_date) ORDER BY date`
    );
    res.json({ success: true, data: { summary, dailyCollection: recent } });
  } catch (err) { next(err); }
});

// Cron: daily fee due reminders
cron.schedule('0 8 * * *', async () => {
  try {
    const { rows } = await db.query(
      `SELECT sfl.student_id FROM student_fee_ledger sfl
       JOIN fee_structures fs ON true
       WHERE sfl.fee_status != 'paid' AND fs.due_date < now()`
    );
    for (const row of rows) {
      axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
        userId: row.student_id, eventType: 'fee_reminder', channel: 'in_app',
        subject: 'Fee Due Reminder', message: 'You have an outstanding fee balance. Please pay immediately.'
      }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});
    }
  } catch (err) { console.error('Fee reminder cron error:', err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'fee-service' }));
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : 'Internal server error' });
});
app.listen(PORT, () => console.log(`Fee service on port ${PORT}`));
