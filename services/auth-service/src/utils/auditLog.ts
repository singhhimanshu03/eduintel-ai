import { db } from '../config/db';

export async function writeAuditLog(params: {
  userId?: string;
  action: string;
  ipAddress?: string;
  outcome: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, outcome, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.userId ?? null,
        params.action,
        params.ipAddress ?? null,
        params.outcome,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  } catch (err) {
    // Audit log failures must never break the main flow
    console.error('Audit log write failed:', err);
  }
}
