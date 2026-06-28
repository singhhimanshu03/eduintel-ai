import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../config/db';
import { redisClient } from '../config/redis';
import { signAccessToken } from '../utils/jwt';
import { writeAuditLog } from '../utils/auditLog';
import { sendEmail } from '../utils/mailer';

const router = Router();
const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || '12');

// ─── Schemas ───────────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    'super_admin','college_admin','faculty','student',
    'parent','examination_cell','placement_cell',
  ]),
  institutionId: z.string().uuid().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ─── POST /register ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 */
router.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role, institution_id)
       VALUES ($1, $2, $3, $4) RETURNING id, email, role`,
      [body.email, passwordHash, body.role, body.institutionId ?? null]
    );
    const user = rows[0];

    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, tokenExpiry]
    );

    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await sendEmail(
      user.email,
      'Verify your EduIntel AI account',
      `<p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`
    ).catch(() => console.warn('Email send failed — continuing'));

    await writeAuditLog({ userId: user.id, action: 'REGISTER', outcome: 'SUCCESS' });
    res.status(201).json({ success: true, data: { userId: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /verify-email ─────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query as { token: string };
    const { rows } = await db.query(
      `SELECT * FROM email_verification_tokens WHERE token=$1 AND used=false AND expires_at > now()`,
      [token]
    );
    if (!rows.length) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    await db.query(`UPDATE users SET is_verified=true WHERE id=$1`, [rows[0].user_id]);
    await db.query(`UPDATE email_verification_tokens SET used=true WHERE id=$1`, [rows[0].id]);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  const ip = req.ip;
  try {
    const body = LoginSchema.parse(req.body);
    const { rows } = await db.query(`SELECT * FROM users WHERE email=$1`, [body.email]);

    if (!rows.length) {
      await writeAuditLog({ action: 'LOGIN', ipAddress: ip, outcome: 'FAIL_NO_USER' });
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const user = rows[0];

    if (user.is_locked && user.lock_until && new Date(user.lock_until) > new Date()) {
      await writeAuditLog({ userId: user.id, action: 'LOGIN', ipAddress: ip, outcome: 'FAIL_LOCKED' });
      res.status(403).json({ success: false, message: 'Account locked. Try again later.' });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_attempts || 0) + 1;
      const lockUpdate = attempts >= 5
        ? { is_locked: true, lock_until: new Date(Date.now() + 30 * 60 * 1000) }
        : {};

      await db.query(
        `UPDATE users SET failed_attempts=$1, is_locked=$2, lock_until=$3 WHERE id=$4`,
        [attempts, attempts >= 5, attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null, user.id]
      );
      if (attempts >= 5) {
        await sendEmail(user.email, 'Account Locked', '<p>Your EduIntel AI account has been locked for 30 minutes due to multiple failed login attempts.</p>').catch(() => {});
      }
      await writeAuditLog({ userId: user.id, action: 'LOGIN', ipAddress: ip, outcome: 'FAIL_BAD_PASSWORD' });
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Reset failed attempts
    await db.query(`UPDATE users SET failed_attempts=0, is_locked=false, lock_until=null WHERE id=$1`, [user.id]);

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, institutionId: user.institution_id });

    const refreshTokenRaw = uuidv4();
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshTokenHash, refreshExpiry]
    );

    await writeAuditLog({ userId: user.id, action: 'LOGIN', ipAddress: ip, outcome: 'SUCCESS' });
    res.json({ success: true, data: { accessToken, refreshToken: refreshTokenRaw, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /refresh ─────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) { res.status(400).json({ success: false, message: 'Refresh token required' }); return; }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { rows } = await db.query(
      `SELECT rt.*, u.email, u.role, u.institution_id
       FROM refresh_tokens rt JOIN users u ON u.id=rt.user_id
       WHERE rt.token_hash=$1 AND rt.revoked=false AND rt.expires_at > now()`,
      [tokenHash]
    );

    if (!rows.length) { res.status(401).json({ success: false, message: 'Invalid or expired refresh token' }); return; }
    const record = rows[0];
    const newAccessToken = signAccessToken({ userId: record.user_id, email: record.email, role: record.role, institutionId: record.institution_id });
    await writeAuditLog({ userId: record.user_id, action: 'TOKEN_REFRESH', outcome: 'SUCCESS' });
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /logout ──────────────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db.query(`UPDATE refresh_tokens SET revoked=true WHERE token_hash=$1`, [tokenHash]);
    }
    await writeAuditLog({ action: 'LOGOUT', outcome: 'SUCCESS' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /forgot-password ─────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body as { email: string };
    const { rows } = await db.query(`SELECT id FROM users WHERE email=$1`, [email]);
    if (rows.length) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 60 min
      await db.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)`,
        [rows[0].id, token, expiry]
      );
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      await sendEmail(email, 'Reset your EduIntel AI password',
        `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 60 minutes.</p>`
      ).catch(() => {});
    }
    // Always return 200 to prevent user enumeration
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /reset-password ──────────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    if (!token || !newPassword || newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Invalid request' }); return;
    }
    const { rows } = await db.query(
      `SELECT * FROM password_reset_tokens WHERE token=$1 AND used=false AND expires_at > now()`,
      [token]
    );
    if (!rows.length) { res.status(400).json({ success: false, message: 'Invalid or expired token' }); return; }

    const hash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await db.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, rows[0].user_id]);
    await db.query(`UPDATE password_reset_tokens SET used=true WHERE id=$1`, [rows[0].id]);
    await db.query(`UPDATE refresh_tokens SET revoked=true WHERE user_id=$1`, [rows[0].user_id]);

    await writeAuditLog({ userId: rows[0].user_id, action: 'PASSWORD_RESET', outcome: 'SUCCESS' });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /audit-logs (Super_Admin only — enforced at gateway) ──────────────────
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    const { rows: countRows } = await db.query(`SELECT COUNT(*) FROM audit_logs`);
    // Log the export itself
    const exporterId = req.headers['x-user-id'] as string;
    await writeAuditLog({ userId: exporterId, action: 'AUDIT_LOG_EXPORT', outcome: 'SUCCESS' });
    res.json({ success: true, data: rows, total: parseInt(countRows[0].count), page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

export default router;
