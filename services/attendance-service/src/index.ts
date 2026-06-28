import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { Pool } from 'pg'; import axios from 'axios'; import PDFDocument from 'pdfkit';

const app = express();
const PORT = process.env.PORT || 3004;
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
const THRESHOLD = parseFloat(process.env.DEFAULT_ELIGIBILITY_THRESHOLD || '75');

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(morgan('combined'));

// ─── POST /classes — create class session ─────────────────────────────────────
app.post('/api/attendance/classes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectCode, sessionDate, timeSlot, courseId, semester } = req.body;
    const facultyId = req.headers['x-user-id'] as string;
    const institutionId = req.headers['x-institution-id'] as string;
    const { rows } = await db.query(
      `INSERT INTO class_sessions (faculty_id, subject_code, course_id, semester, session_date, time_slot, institution_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [facultyId, subjectCode, courseId ?? null, semester ?? null, sessionDate, timeSlot ?? null, institutionId]
    );
    res.status(201).json({ success: true, data: { classSessionId: rows[0].id } });
  } catch (err) { next(err); }
});

// ─── POST /classes/:id/mark — mark attendance ─────────────────────────────────
app.post('/api/attendance/classes/:id/mark', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { records } = req.body as { records: Array<{ studentId: string; status: 'present' | 'absent' | 'excused' }> };
    const markedBy = req.headers['x-user-id'] as string;
    const sessionId = req.params.id;

    // Fetch session info for subject/semester
    const { rows: session } = await db.query(`SELECT * FROM class_sessions WHERE id=$1`, [sessionId]);
    if (!session.length) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    for (const rec of records) {
      await db.query(
        `INSERT INTO attendance_records (class_session_id, student_id, status, marked_by) VALUES ($1,$2,$3,$4)
         ON CONFLICT DO NOTHING`,
        [sessionId, rec.studentId, rec.status, markedBy]
      );
      // Upsert summary
      await db.query(
        `INSERT INTO attendance_summary (student_id, subject_code, semester, total_classes, attended_classes, attendance_percentage)
         VALUES ($1,$2,$3,1,$4,$4*100)
         ON CONFLICT (student_id, subject_code, semester) DO UPDATE SET
           total_classes = attendance_summary.total_classes + 1,
           attended_classes = attendance_summary.attended_classes + $4,
           attendance_percentage = ROUND(((attendance_summary.attended_classes + $4)::decimal / (attendance_summary.total_classes + 1))*100, 2),
           last_updated = now()`,
        [rec.studentId, session[0].subject_code, session[0].semester ?? 1, rec.status === 'present' ? 1 : 0]
      );
    }

    // Check threshold and send warnings
    for (const rec of records) {
      const { rows: summary } = await db.query(
        `SELECT attendance_percentage FROM attendance_summary WHERE student_id=$1 AND subject_code=$2 AND semester=$3`,
        [rec.studentId, session[0].subject_code, session[0].semester ?? 1]
      );
      if (summary.length && parseFloat(summary[0].attendance_percentage) < THRESHOLD) {
        axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
          userId: rec.studentId, eventType: 'attendance_warning', channel: 'in_app',
          subject: 'Attendance Warning',
          message: `Your attendance in ${session[0].subject_code} is ${summary[0].attendance_percentage}% — below the ${THRESHOLD}% threshold.`
        }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});
      }
    }

    res.json({ success: true, message: `Attendance marked for ${records.length} students` });
  } catch (err) { next(err); }
});

// ─── PUT /classes/:id/edit — edit attendance ──────────────────────────────────
app.put('/api/attendance/classes/:id/edit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { updates } = req.body as { updates: Array<{ recordId: string; newStatus: string; reason: string }> };
    const editorId = req.headers['x-user-id'] as string;
    for (const u of updates) {
      const { rows: orig } = await db.query(`SELECT status FROM attendance_records WHERE id=$1`, [u.recordId]);
      if (!orig.length) continue;
      // Write audit log
      await db.query(
        `INSERT INTO attendance_edit_log (attendance_record_id, original_status, edited_by, reason)
         VALUES ($1,$2,$3,$4)`,
        [u.recordId, orig[0].status, editorId, u.reason]
      );
      await db.query(
        `UPDATE attendance_records SET status=$1, edited=true, edit_reason=$2 WHERE id=$3`,
        [u.newStatus, u.reason, u.recordId]
      );
    }
    res.json({ success: true, message: 'Attendance updated' });
  } catch (err) { next(err); }
});

// ─── GET /students/:id — attendance report ────────────────────────────────────
app.get('/api/attendance/students/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT subject_code, semester, total_classes, attended_classes, attendance_percentage
       FROM attendance_summary WHERE student_id=$1 ORDER BY semester, subject_code`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─── GET /students/:id/pdf — download PDF ────────────────────────────────────
app.get('/api/attendance/students/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT subject_code, semester, total_classes, attended_classes, attendance_percentage
       FROM attendance_summary WHERE student_id=$1 ORDER BY semester, subject_code`,
      [req.params.id]
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${req.params.id}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('EduIntel AI — Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Student ID: ${req.params.id}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    rows.forEach(r => {
      doc.text(
        `${r.subject_code} (Sem ${r.semester}): ${r.attended_classes}/${r.total_classes} classes — ${r.attendance_percentage}%`
      );
    });
    doc.end();
  } catch (err) { next(err); }
});

// ─── GET /analytics — admin analytics ────────────────────────────────────────
app.get('/api/attendance/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dept, semester } = req.query as Record<string, string>;
    const { rows: avg } = await db.query(
      `SELECT AVG(attendance_percentage) as avg_attendance FROM attendance_summary
       WHERE ($1::int IS NULL OR semester=$1)`,
      [semester ? parseInt(semester) : null]
    );
    const { rows: low } = await db.query(
      `SELECT student_id, subject_code, attendance_percentage FROM attendance_summary
       WHERE attendance_percentage < $1 AND ($2::int IS NULL OR semester=$2)
       ORDER BY attendance_percentage LIMIT 50`,
      [THRESHOLD, semester ? parseInt(semester) : null]
    );
    const { rows: subjects } = await db.query(
      `SELECT subject_code, AVG(attendance_percentage) as avg_att FROM attendance_summary
       WHERE ($1::int IS NULL OR semester=$1) GROUP BY subject_code ORDER BY avg_att LIMIT 10`,
      [semester ? parseInt(semester) : null]
    );
    res.json({ success: true, data: { averageAttendance: avg[0]?.avg_attendance, studentsBelowThreshold: low, lowestSubjects: subjects } });
  } catch (err) { next(err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'attendance-service' }));
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : 'Internal server error' });
});
app.listen(PORT, () => console.log(`Attendance service on port ${PORT}`));
