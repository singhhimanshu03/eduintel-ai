import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { db } from '../config/db';
import { redisClient } from '../config/redis';
import { signAccessToken } from '../utils/jwt';
import { writeAuditLog } from '../utils/auditLog';
import { sendEmail } from '../utils/mailer';

const router = Router();
const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || '12');

// ─── Schemas ───────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['student', 'faculty', 'parent', 'examination_cell', 'placement_cell']),
  institutionId: z.string().uuid(),
  // Role-specific fields (validated per-role below)
  studentCode: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  departmentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  facultyCode: z.string().optional(),
  designation: z.string().optional(),
  studentId: z.string().uuid().optional(), // for parent role
});

const ADMIN_ROLES = ['college_admin', 'super_admin'];
const INTERNAL_SECRET = () => process.env.INTERNAL_SERVICE_SECRET || '';
const STUDENT_SERVICE_URL = () => process.env.STUDENT_SERVICE_URL || 'http://student-service:3002';
const FACULTY_SERVICE_URL = () => process.env.FACULTY_SERVICE_URL || 'http://faculty-service:3003';

// ─── POST /admin/create-user (admin-only) ─────────────────────────────────────
router.post('/admin/create-user', async (req, res, next) => {
  try {
    const callerRole = req.headers['x-user-role'] as string;
    if (!ADMIN_ROLES.includes(callerRole)) {
      res.status(403).json({ success: false, message: 'Forbidden: admin role required' });
      return;
    }

    const body = CreateUserSchema.parse(req.body);

    // Role-specific field validation
    if (body.role === 'student' && !body.studentCode) {
      res.status(400).json({ success: false, message: 'studentCode is required for student role' });
      return;
    }
    if (body.role === 'faculty' && !body.facultyCode) {
      res.status(400).json({ success: false, message: 'facultyCode is required for faculty role' });
      return;
    }
    if (body.role === 'parent' && !body.studentId) {
      res.status(400).json({ success: false, message: 'studentId is required for parent role' });
      return;
    }

    // Generate a crypto-random password (never disclosed, not even to admin)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_COST);

    // Insert user into auth_db with is_verified = false
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role, institution_id, is_verified)
       VALUES ($1, $2, $3, $4, false) RETURNING id, email, role`,
      [body.email, passwordHash, body.role, body.institutionId]
    );
    const newUser = rows[0];

    // Branch on role — call downstream service to create linked profile
    try {
      if (body.role === 'student') {
        await axios.post(`${STUDENT_SERVICE_URL()}/api/students/internal`, {
          id: newUser.id,
          institutionId: body.institutionId,
          studentCode: body.studentCode,
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          gender: body.gender,
          dateOfBirth: body.dateOfBirth,
          currentSemester: body.currentSemester,
          departmentId: body.departmentId,
          courseId: body.courseId,
        }, { headers: { 'x-internal-secret': INTERNAL_SECRET() }, timeout: 10000 });

      } else if (body.role === 'faculty') {
        await axios.post(`${FACULTY_SERVICE_URL()}/api/faculty/internal`, {
          id: newUser.id,
          institutionId: body.institutionId,
          facultyCode: body.facultyCode,
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          departmentId: body.departmentId,
          designation: body.designation,
        }, { headers: { 'x-internal-secret': INTERNAL_SECRET() }, timeout: 10000 });

      } else if (body.role === 'parent') {
        await axios.patch(
          `${STUDENT_SERVICE_URL()}/api/students/internal/${body.studentId}/parent`,
          { parentId: newUser.id },
          { headers: { 'x-internal-secret': INTERNAL_SECRET() }, timeout: 10000 }
        );
      }
      // examination_cell / placement_cell — no downstream call needed
    } catch (downstreamErr) {
      // Rollback: delete the just-created users row so no orphan remains
      await db.query(`DELETE FROM users WHERE id=$1`, [newUser.id]);
      console.error('Downstream service call failed during user creation:', downstreamErr);
      res.status(500).json({
        success: false,
        message: 'Failed to create profile in downstream service. User creation rolled back.',
      });
      return;
    }

    // Create invite token (reusing password_reset_tokens table).
    // Store the SHA-256 hash in the DB; send the raw token in the email link
    // so a DB dump never yields a usable token.
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [newUser.id, inviteTokenHash, tokenExpiry]
    );

    // Send invite email (fail-soft — do NOT roll back account if email fails)
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${inviteToken}`;
    await sendEmail(
      body.email,
      'You\'re invited to EduIntel AI',
      `<p>Hi ${body.fullName},</p>
       <p>An account has been created for you on EduIntel AI as <strong>${body.role.replace('_', ' ')}</strong>.</p>
       <p>Click <a href="${inviteUrl}">here</a> to set your password and activate your account.</p>
       <p>This link expires in 24 hours.</p>`
    ).catch(() => console.warn(`Invite email to ${body.email} failed — account created, invite can be resent`));

    await writeAuditLog({
      userId: req.headers['x-user-id'] as string,
      action: 'ADMIN_CREATE_USER',
      outcome: 'SUCCESS',
      metadata: { createdUserId: newUser.id, role: body.role, email: body.email },
    });

    res.status(201).json({ success: true, data: { userId: newUser.id } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/resend-invite/:userId (admin-only) ───────────────────────────
router.post('/admin/resend-invite/:userId', async (req, res, next) => {
  try {
    const callerRole = req.headers['x-user-role'] as string;
    if (!ADMIN_ROLES.includes(callerRole)) {
      res.status(403).json({ success: false, message: 'Forbidden: admin role required' });
      return;
    }

    const { userId } = req.params;

    // Verify the target user exists
    const { rows: userRows } = await db.query(`SELECT id, email, role FROM users WHERE id=$1`, [userId]);
    if (!userRows.length) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const targetUser = userRows[0];

    // Check for existing unused, unexpired token.
    // Tokens are stored as SHA-256 hashes so we can't recover the raw value —
    // always issue a fresh token on resend.
    let token: string;
    const { rows: tokenRows } = await db.query(
      `SELECT id FROM password_reset_tokens WHERE user_id=$1 AND used=false AND expires_at > now() ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (tokenRows.length) {
      // Invalidate the existing token and issue a fresh one so each resend
      // produces a single valid link (prevents token accumulation).
      await db.query(`UPDATE password_reset_tokens SET used=true WHERE id=$1`, [tokenRows[0].id]);
    }

    // Create fresh raw token, store its hash
    token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiry]
    );

    const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendEmail(
      targetUser.email,
      'EduIntel AI — Set Your Password',
      `<p>Click <a href="${inviteUrl}">here</a> to set your password and activate your account.</p>
       <p>This link expires in 24 hours.</p>`
    ).catch(() => console.warn(`Resend invite email to ${targetUser.email} failed`));

    await writeAuditLog({
      userId: req.headers['x-user-id'] as string,
      action: 'ADMIN_RESEND_INVITE',
      outcome: 'SUCCESS',
      metadata: { targetUserId: userId },
    });

    res.json({ success: true, message: 'Invite resent' });
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

    // ── NEW: Block unverified accounts (invited users who haven't set their password) ──
    if (!user.is_verified) {
      await writeAuditLog({ userId: user.id, action: 'LOGIN', ipAddress: ip, outcome: 'FAIL_NOT_VERIFIED' });
      res.status(403).json({
        success: false,
        message: 'Account not yet activated. Please use your invite link to set your password.',
      });
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
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenRaw,
        role: user.role,
        userId: user.id,
        institutionId: user.institution_id ?? null,
      },
    });
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
      const tokenRaw = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 60 min
      await db.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)`,
        [rows[0].id, tokenHash, expiry]
      );
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${tokenRaw}`;
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
    // Hash the raw token from the URL before looking it up in the DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await db.query(
      `SELECT * FROM password_reset_tokens WHERE token=$1 AND used=false AND expires_at > now()`,
      [tokenHash]
    );
    if (!rows.length) { res.status(400).json({ success: false, message: 'Invalid or expired token' }); return; }

    const hash = await bcrypt.hash(newPassword, BCRYPT_COST);
    // Also flip is_verified to true — this activates invited accounts on first password set
    await db.query(`UPDATE users SET password_hash=$1, is_verified=true WHERE id=$2`, [hash, rows[0].user_id]);
    await db.query(`UPDATE password_reset_tokens SET used=true WHERE id=$1`, [rows[0].id]);
    await db.query(`UPDATE refresh_tokens SET revoked=true WHERE user_id=$1`, [rows[0].user_id]);

    await writeAuditLog({ userId: rows[0].user_id, action: 'PASSWORD_RESET', outcome: 'SUCCESS' });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /change-password (authenticated) ────────────────────────────────────
router.post('/change-password', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Invalid request — new password must be at least 8 characters' });
      return;
    }

    const { rows } = await db.query(`SELECT * FROM users WHERE id=$1`, [userId]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) { res.status(401).json({ success: false, message: 'Current password is incorrect' }); return; }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await db.query(`UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2`, [newHash, userId]);

    // Revoke all existing refresh tokens to force re-login on other devices
    await db.query(`UPDATE refresh_tokens SET revoked=true WHERE user_id=$1`, [userId]);

    await writeAuditLog({ userId, action: 'PASSWORD_CHANGE', outcome: 'SUCCESS' });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
});
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
