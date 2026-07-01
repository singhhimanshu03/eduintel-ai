import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { Pool } from 'pg'; import axios from 'axios'; import PDFDocument from 'pdfkit';

const app = express();
const PORT = process.env.PORT || 3005;
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(morgan('combined'));

function calcGrade(percentage: number): { grade: string; gpaPoints: number } {
  if (percentage >= 90) return { grade: 'O',  gpaPoints: 10 };
  if (percentage >= 80) return { grade: 'A+', gpaPoints: 9 };
  if (percentage >= 70) return { grade: 'A',  gpaPoints: 8 };
  if (percentage >= 60) return { grade: 'B+', gpaPoints: 7 };
  if (percentage >= 50) return { grade: 'B',  gpaPoints: 6 };
  if (percentage >= 40) return { grade: 'C',  gpaPoints: 5 };
  return { grade: 'F', gpaPoints: 0 };
}

// POST /schedules
app.post('/api/exams/schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectCode, examDate, startTime, venue, durationMinutes, semester, academicYear } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;
    const { rows } = await db.query(
      `INSERT INTO exam_schedules (institution_id, subject_code, exam_date, start_time, venue, duration_minutes, semester, academic_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [institutionId, subjectCode, examDate, startTime, venue, durationMinutes, semester, academicYear]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /schedules
// examination_cell and admin see ALL schedules (draft + published)
// students and parents see only published schedules
app.get('/api/exams/schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.headers['x-institution-id'] as string;
    const role           = req.headers['x-user-role'] as string;
    const showAll        = ['examination_cell', 'college_admin', 'super_admin'].includes(role);

    const query = showAll
      ? `SELECT * FROM exam_schedules WHERE institution_id=$1 ORDER BY exam_date`
      : `SELECT * FROM exam_schedules WHERE institution_id=$1 AND is_published=true ORDER BY exam_date`;

    const { rows } = await db.query(query, [institutionId]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// PUT /schedules/:id/publish  — draft → published transition
app.put('/api/exams/schedules/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const institutionId = req.headers['x-institution-id'] as string;

    // Fetch schedule — ensure it belongs to this institution
    const { rows: existing } = await db.query(
      `SELECT * FROM exam_schedules WHERE id=$1 AND institution_id=$2`,
      [id, institutionId]
    );
    if (!existing.length) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }
    if (existing[0].is_published) {
      res.status(409).json({ success: false, message: 'Schedule is already published' });
      return;
    }

    const { rows } = await db.query(
      `UPDATE exam_schedules SET is_published=true WHERE id=$1 RETURNING *`,
      [id]
    );

    // Notify institution — fire-and-forget
    axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      broadcast: true,
      institutionId,
      eventType: 'custom',
      channel: 'in_app',
      subject: 'Exam Schedule Published',
      message: `Exam schedule for ${existing[0].subject_code} on ${existing[0].exam_date?.toISOString?.()?.split('T')[0] ?? existing[0].exam_date} has been published.`,
    }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});

    res.json({ success: true, data: rows[0], message: 'Schedule published successfully' });
  } catch (err) { next(err); }
});

// POST /marks
app.post('/api/exams/marks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, subjectCode, semester, academicYear, internalMarks, semesterMarks } = req.body;
    // Validate bounds
    const { rows: bounds } = await db.query(
      `SELECT * FROM marks_bounds WHERE subject_code=$1`, [subjectCode]
    );
    if (bounds.length) {
      if (bounds[0].internal_max < 0 || bounds[0].semester_max < 0) {
        res.status(422).json({ success: false, message: 'Marks bounds configuration invalid for this subject' }); return;
      }
      if (internalMarks > bounds[0].internal_max || semesterMarks > bounds[0].semester_max) {
        res.status(400).json({ success: false, message: 'Marks exceed configured maximum bounds' }); return;
      }
    }
    const total = (internalMarks || 0) + (semesterMarks || 0);
    const maxTotal = bounds.length ? (bounds[0].internal_max + bounds[0].semester_max) : 100;
    const pct = (total / maxTotal) * 100;
    const { grade, gpaPoints } = calcGrade(pct);
    const isBacklog = grade === 'F';

    const { rows } = await db.query(
      `INSERT INTO marks (student_id, subject_code, semester, academic_year, internal_marks, semester_marks, total_marks, grade, gpa_points, is_backlog)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (student_id, subject_code, semester, academic_year) DO UPDATE SET
         internal_marks=$5, semester_marks=$6, total_marks=$7, grade=$8, gpa_points=$9, is_backlog=$10
       RETURNING *`,
      [studentId, subjectCode, semester, academicYear, internalMarks, semesterMarks, total, grade, gpaPoints, isBacklog]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /results/publish
app.post('/api/exams/results/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { semester, academicYear } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;
    await db.query(
      `UPDATE marks SET published=true WHERE semester=$1 AND academic_year=$2`, [semester, academicYear]
    );
    // Notify students (fire-and-forget)
    axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      broadcast: true, institutionId, eventType: 'result_published', channel: 'in_app',
      subject: 'Results Published', message: `Semester ${semester} results are now available.`
    }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});
    res.json({ success: true, message: 'Results published' });
  } catch (err) { next(err); }
});

// GET /results/:studentId
app.get('/api/exams/results/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM marks WHERE student_id=$1 AND published=true ORDER BY semester, subject_code`,
      [req.params.studentId]
    );
    const backlogs = rows.filter(r => r.is_backlog);
    // Calculate semester GPA
    const semMap: Record<number, number[]> = {};
    rows.forEach(r => {
      if (!semMap[r.semester]) semMap[r.semester] = [];
      semMap[r.semester].push(parseFloat(r.gpa_points));
    });
    const semGPA: Record<number, number> = {};
    for (const sem in semMap) {
      const pts = semMap[sem];
      semGPA[sem] = parseFloat((pts.reduce((a, b) => a + b, 0) / pts.length).toFixed(2));
    }
    res.json({ success: true, data: { marks: rows, semesterGPA: semGPA, backlogs } });
  } catch (err) { next(err); }
});

// POST /hall-tickets/generate
app.post('/api/exams/hall-tickets/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, examCycle } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;

    // Get eligibility config
    const { rows: config } = await db.query(
      `SELECT * FROM eligibility_config WHERE institution_id=$1`, [institutionId]
    );
    const threshold = config.length ? parseFloat(config[0].attendance_threshold) : 75;

    // Check attendance
    const attRes = await axios.get(
      `${process.env.ATTENDANCE_SERVICE_URL}/api/attendance/students/${studentId}`,
      { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }
    );
    const attData: Array<{ attendance_percentage: string }> = attRes.data.data ?? [];

    // Guard: if no attendance records exist yet, treat as 0% (blocked)
    const minAtt = attData.length > 0
      ? Math.min(...attData.map(a => parseFloat(a.attendance_percentage)))
      : 0;

    // Check fee
    const feeRes = await axios.get(
      `${process.env.FEE_SERVICE_URL}/api/fees/students/${studentId}/status`,
      { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }
    );
    const feeStatus: string = feeRes.data.data.fee_status;

    const blockReasons: string[] = [];
    if (minAtt < threshold) blockReasons.push(`Attendance below required threshold: ${minAtt.toFixed(1)}% / ${threshold}%`);
    if (feeStatus !== 'paid') blockReasons.push(`Outstanding fee balance. Fee status: ${feeStatus}`);

    if (blockReasons.length) {
      await db.query(
        `INSERT INTO hall_tickets (student_id, exam_cycle, is_blocked, block_reasons) VALUES ($1,$2,true,$3)`,
        [studentId, examCycle, JSON.stringify(blockReasons)]
      );
      res.status(403).json({ success: false, message: 'Hall ticket blocked', reasons: blockReasons }); return;
    }

    const pdfUrl = `/hall-tickets/${studentId}_${examCycle}.pdf`;
    await db.query(
      `INSERT INTO hall_tickets (student_id, exam_cycle, is_blocked, pdf_url) VALUES ($1,$2,false,$3)
       ON CONFLICT DO NOTHING`,
      [studentId, examCycle, pdfUrl]
    );
    axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      userId: studentId, eventType: 'hall_ticket_available', channel: 'in_app',
      subject: 'Hall Ticket Available', message: 'Your hall ticket for upcoming exams is ready.'
    }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});
    res.json({ success: true, data: { pdfUrl } });
  } catch (err) { next(err); }
});

// GET /hall-tickets/:studentId/pdf
app.get('/api/exams/hall-tickets/:studentId/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM hall_tickets WHERE student_id=$1 AND is_blocked=false ORDER BY generated_at DESC LIMIT 1`,
      [req.params.studentId]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'No eligible hall ticket found' }); return; }

    // Extract variables needed for PDF generation
    const studentId   = req.params.studentId;
    const examCycle   = rows[0].exam_cycle as string;
    const institutionId = req.headers['x-institution-id'] as string;

    // Fetch student profile for enriched PDF
    let studentName = studentId;
    // examCycle is already available from rows[0].exam_cycle above
    try {
      const stuRes = await axios.get(
        `${process.env.ATTENDANCE_SERVICE_URL?.replace('attendance-service:3004', 'student-service:3002')}/api/students/${studentId}`,
        { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }
      );
      studentName = stuRes.data.data?.full_name ?? studentId;
    } catch { /* fallback to ID */ }

    // Fetch upcoming exam schedules
    let schedules: Array<{ subject_code: string; exam_date: string; venue: string }> = [];
    try {
      const schedRes = await axios.get(
        `${process.env.ATTENDANCE_SERVICE_URL?.replace('attendance-service:3004', 'examination-service:3005')}/api/exams/schedules`,
        { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET, 'x-institution-id': institutionId } }
      );
      schedules = schedRes.data.data ?? [];
    } catch { /* skip schedules */ }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="hall_ticket_${req.params.studentId}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('EduIntel AI', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Examination Hall Ticket', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Student details
    doc.fontSize(11).font('Helvetica-Bold').text('Student Details', { underline: true });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Student ID   : ${req.params.studentId}`);
    doc.text(`Student Name : ${studentName}`);
    doc.text(`Exam Cycle   : ${rows[0].exam_cycle}`);
    doc.text(`Generated    : ${new Date(rows[0].generated_at).toLocaleString()}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Eligibility Status: ').font('Helvetica').text(
      '✓ ELIGIBLE TO APPEAR', { continued: false }
    );
    doc.moveDown(0.8);

    // Exam schedule table
    if (schedules.length > 0) {
      doc.font('Helvetica-Bold').fontSize(11).text('Examination Schedule', { underline: true });
      doc.moveDown(0.3);
      // Table header
      const col = [50, 150, 280, 400];
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('#',            col[0], doc.y, { width: 90 });
      doc.text('Subject Code', col[1], doc.y - 10, { width: 130 });
      doc.text('Date',         col[2], doc.y - 10, { width: 120 });
      doc.text('Venue',        col[3], doc.y - 10, { width: 130 });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(10);
      schedules.forEach((s, i) => {
        const y = doc.y;
        doc.text(String(i + 1),                              col[0], y, { width: 90 });
        doc.text(s.subject_code,                             col[1], y, { width: 130 });
        doc.text(s.exam_date?.split('T')[0] ?? '—',          col[2], y, { width: 120 });
        doc.text(s.venue ?? '—',                             col[3], y, { width: 130 });
        doc.moveDown(0.5);
      });
    } else {
      doc.font('Helvetica').fontSize(10).text('Exam schedule will be announced separately.');
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('grey').text(
      'This is a computer-generated document. No signature required.',
      { align: 'center' }
    );
    doc.end();
  } catch (err) { next(err); }
});

// PUT /eligibility-threshold
app.put('/api/exams/eligibility-threshold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threshold } = req.body as { threshold: number };
    const institutionId = req.headers['x-institution-id'] as string;
    const updatedBy = req.headers['x-user-id'] as string;
    await db.query(
      `INSERT INTO eligibility_config (institution_id, attendance_threshold, updated_by, updated_at)
       VALUES ($1,$2,$3,now())
       ON CONFLICT (institution_id) DO UPDATE SET attendance_threshold=$2, updated_by=$3, updated_at=now()`,
      [institutionId, threshold, updatedBy]
    );
    res.json({ success: true, message: 'Threshold updated' });
  } catch (err) { next(err); }
});

// POST /hall-tickets/:id/override
app.post('/api/exams/hall-tickets/:id/override', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body as { reason: string };
    const overrideBy = req.headers['x-user-id'] as string;
    await db.query(
      `UPDATE hall_tickets SET is_blocked=false, override_by=$1, override_reason=$2 WHERE id=$3`,
      [overrideBy, reason, req.params.id]
    );
    res.json({ success: true, message: 'Hall ticket unblocked (override recorded)' });
  } catch (err) { next(err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'examination-service' }));
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : 'Internal server error' });
});
app.listen(PORT, () => console.log(`Examination service on port ${PORT}`));
