import 'dotenv/config';
import express from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { Pool } from 'pg';
import axios from 'axios';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3003;
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(morgan('combined'));

const FacultySchema = z.object({
  facultyCode: z.string(), fullName: z.string(), email: z.string().email(),
  institutionId: z.string().uuid(), departmentId: z.string().uuid().optional(),
  designation: z.string().optional(), phone: z.string().optional(),
});

// GET / — list faculty
app.get('/api/faculty', async (req, res, next) => {
  try {
    const institutionId = req.headers['x-institution-id'] as string;
    const { dept, page = '1', limit = '50' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = `SELECT id, faculty_code, full_name, email, department_id, designation, employment_status
             FROM faculty WHERE institution_id=$1 AND employment_status='active'`;
    const params: unknown[] = [institutionId];
    if (dept) { params.push(dept); q += ` AND department_id=$${params.length}`; }
    q += ` ORDER BY full_name LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit), offset);
    const { rows } = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST / — create faculty
app.post('/api/faculty', async (req, res, next) => {
  try {
    const body = FacultySchema.parse(req.body);
    const { rows } = await db.query(
      `INSERT INTO faculty (institution_id, faculty_code, full_name, email, phone, department_id, designation)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, faculty_code`,
      [body.institutionId, body.facultyCode, body.fullName, body.email, body.phone ?? null, body.departmentId ?? null, body.designation ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /internal — create faculty with explicit id (service-to-service)
app.post('/api/faculty/internal', async (req, res, next) => {
  try {
    if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SERVICE_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized: invalid internal secret' });
      return;
    }
    const { id, institutionId, facultyCode, fullName, email, phone, departmentId, designation } = req.body;
    if (!id || !institutionId || !facultyCode || !fullName || !email) {
      res.status(400).json({ success: false, message: 'Missing required fields: id, institutionId, facultyCode, fullName, email' });
      return;
    }
    const { rows } = await db.query(
      `INSERT INTO faculty (id, institution_id, faculty_code, full_name, email, phone, department_id, designation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, faculty_code`,
      [id, institutionId, facultyCode, fullName, email, phone ?? null, departmentId ?? null, designation ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /:id
app.get('/api/faculty/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM faculty WHERE id=$1`, [req.params.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Faculty not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /:id
app.put('/api/faculty/:id', async (req, res, next) => {
  try {
    const { fullName, phone, designation, employmentStatus, departmentId } = req.body;
    const { rows } = await db.query(
      `UPDATE faculty SET full_name=COALESCE($1,full_name), phone=COALESCE($2,phone),
       designation=COALESCE($3,designation), employment_status=COALESCE($4,employment_status),
       department_id=COALESCE($5,department_id), updated_at=now() WHERE id=$6 RETURNING *`,
      [fullName, phone, designation, employmentStatus, departmentId, req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /:id/subjects — assign subject, notify faculty
app.post('/api/faculty/:id/subjects', async (req, res, next) => {
  try {
    const { subjectCode, subjectName, courseId, semester } = req.body;
    const { rows } = await db.query(
      `INSERT INTO faculty_subject_assignments (faculty_id, subject_code, subject_name, course_id, semester, effective_from)
       VALUES ($1,$2,$3,$4,$5,now()) RETURNING *`,
      [req.params.id, subjectCode, subjectName, courseId ?? null, semester ?? null]
    );
    // Notify faculty (fire-and-forget)
    const { rows: faculty } = await db.query(`SELECT email FROM faculty WHERE id=$1`, [req.params.id]);
    if (faculty.length && process.env.NOTIFICATION_SERVICE_URL) {
      axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
        userId: req.params.id, eventType: 'subject_assigned', channel: 'email',
        subject: 'New Subject Assigned', message: `You have been assigned: ${subjectName} (${subjectCode})`
      }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});
    }
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /:id/subjects
app.get('/api/faculty/:id/subjects', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM faculty_subject_assignments WHERE faculty_id=$1 AND is_active=true`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'faculty-service' }));
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : 'Internal server error' });
});
app.listen(PORT, () => console.log(`Faculty service on port ${PORT}`));
