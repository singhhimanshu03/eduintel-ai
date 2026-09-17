import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { z } from 'zod';
import { db } from '../config/db';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const INTERNAL_SECRET = () => process.env.INTERNAL_SERVICE_SECRET || '';

// ─── Internal secret guard ────────────────────────────────────────────────────
function requireInternalSecret(req: Request, res: Response): boolean {
  if (req.headers['x-internal-secret'] !== INTERNAL_SECRET()) {
    res.status(401).json({ success: false, message: 'Unauthorized: invalid internal secret' });
    return false;
  }
  return true;
}

const StudentSchema = z.object({
  studentCode: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  institutionId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

// ─── GET / — list students (Admin/Faculty) ────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const institutionId = req.headers['x-institution-id'] as string;
    const { dept, course, semester, page = '1', limit = '50' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // super_admin has no institution_id — return all active students across the platform
    const isSuperAdmin = role === 'super_admin';

    let query = `SELECT id, student_code, full_name, email, department_id, course_id,
                        current_semester, enrollment_status, profile_photo_url
                 FROM students WHERE 1=1`;
    const params: unknown[] = [];

    if (!isSuperAdmin) {
      params.push(institutionId);
      query += ` AND institution_id=$${params.length}`;
    }

    if (dept)     { params.push(dept);              query += ` AND department_id=$${params.length}`; }
    if (course)   { params.push(course);             query += ` AND course_id=$${params.length}`; }
    if (semester) { params.push(parseInt(semester)); query += ` AND current_semester=$${params.length}`; }

    query += ` AND enrollment_status != 'inactive' ORDER BY full_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─── POST / — create student ──────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = StudentSchema.parse(req.body);
    const { rows } = await db.query(
      `INSERT INTO students (institution_id, student_code, full_name, email, phone, gender,
        date_of_birth, department_id, course_id, current_semester, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, student_code`,
      [body.institutionId, body.studentCode, body.fullName, body.email, body.phone ?? null,
       body.gender ?? null, body.dateOfBirth ?? null, body.departmentId ?? null,
       body.courseId ?? null, body.currentSemester ?? null, body.parentId ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /internal — create student with explicit id (service-to-service) ────
router.post('/internal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!requireInternalSecret(req, res)) return;
    const { id, institutionId, studentCode, fullName, email, phone, gender,
            dateOfBirth, departmentId, courseId, currentSemester } = req.body;
    if (!id || !institutionId || !studentCode || !fullName || !email) {
      res.status(400).json({ success: false, message: 'Missing required fields: id, institutionId, studentCode, fullName, email' });
      return;
    }
    const { rows } = await db.query(
      `INSERT INTO students (id, institution_id, student_code, full_name, email, phone, gender,
        date_of_birth, department_id, course_id, current_semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, student_code`,
      [id, institutionId, studentCode, fullName, email, phone ?? null,
       gender ?? null, dateOfBirth ?? null, departmentId ?? null,
       courseId ?? null, currentSemester ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ─── PATCH /internal/:id/parent — set parent_id (service-to-service) ──────────
router.patch('/internal/:id/parent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!requireInternalSecret(req, res)) return;
    const { parentId } = req.body;
    if (!parentId) {
      res.status(400).json({ success: false, message: 'parentId is required' });
      return;
    }
    const { rowCount } = await db.query(
      `UPDATE students SET parent_id=$1, updated_at=now() WHERE id=$2`,
      [parentId, req.params.id]
    );
    if (!rowCount) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }
    res.json({ success: true, message: 'Parent linked' });
  } catch (err) { next(err); }
});

// ─── GET /:id — get student ────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    // Students can only view their own profile (student.id === auth user.id)
    if (role === 'student' && userId !== id) {
      res.status(403).json({ success: false, message: 'Forbidden: you can only view your own profile' });
      return;
    }

    const { rows } = await db.query(`SELECT * FROM students WHERE id=$1`, [id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ─── PUT /:id — update student ────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rows: existing } = await db.query(`SELECT * FROM students WHERE id=$1`, [id]);
    if (!existing.length) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    const { fullName, phone, gender, currentSemester, enrollmentStatus, profilePhotoUrl, departmentId } = req.body;
    const { rows } = await db.query(
      `UPDATE students SET
        full_name=COALESCE($1, full_name), phone=COALESCE($2, phone),
        gender=COALESCE($3, gender), current_semester=COALESCE($4, current_semester),
        enrollment_status=COALESCE($5, enrollment_status),
        profile_photo_url=COALESCE($6, profile_photo_url),
        department_id=COALESCE($7, department_id),
        updated_at=now()
       WHERE id=$8 RETURNING *`,
      [fullName, phone, gender, currentSemester, enrollmentStatus, profilePhotoUrl, departmentId, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ─── GET /:id/academic-history ────────────────────────────────────────────────
router.get('/:id/academic-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM academic_history WHERE student_id=$1 ORDER BY semester, subject_code`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─── POST /:id/documents — upload document ────────────────────────────────────
router.post('/:id/documents', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const { documentType } = req.body as { documentType: string };
    const fileUrl = `/uploads/${req.params.id}/${Date.now()}_${req.file.originalname}`;

    const { rows } = await db.query(
      `INSERT INTO student_documents (student_id, document_type, file_url, file_size_bytes)
       VALUES ($1,$2,$3,$4) RETURNING id, document_type, file_url`,
      [req.params.id, documentType, fileUrl, req.file.size]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ─── GET /:id/documents ───────────────────────────────────────────────────────
router.get('/:id/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(`SELECT * FROM student_documents WHERE student_id=$1`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ─── POST /bulk-import ────────────────────────────────────────────────────────
router.post('/bulk-import', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'CSV file required' }); return; }
    const institutionId = req.headers['x-institution-id'] as string;

    const results: Array<{ row: number; status: string; error?: string }> = [];
    const records: Record<string, string>[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(req.file!.buffer.toString());
      stream.pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => records.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const parsed = StudentSchema.parse({
          studentCode: row.student_code,
          fullName: row.full_name,
          email: row.email,
          institutionId: institutionId || row.institution_id,
          phone: row.phone,
          gender: row.gender,
          currentSemester: row.current_semester ? parseInt(row.current_semester) : undefined,
        });
        await db.query(
          `INSERT INTO students (institution_id, student_code, full_name, email, phone, gender, current_semester)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (email) DO NOTHING`,
          [parsed.institutionId, parsed.studentCode, parsed.fullName, parsed.email, parsed.phone ?? null, parsed.gender ?? null, parsed.currentSemester ?? null]
        );
        results.push({ row: i + 2, status: 'success' });
      } catch (err: unknown) {
        results.push({ row: i + 2, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    const imported = results.filter(r => r.status === 'success').length;
    const failed   = results.filter(r => r.status === 'error').length;
    res.json({ success: true, data: { imported, failed, details: results } });
  } catch (err) { next(err); }
});

// ─── DELETE /:id — soft delete (deactivate) ───────────────────────────────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.query(
      `UPDATE students SET enrollment_status='inactive', updated_at=now() WHERE id=$1`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) { next(err); }
});

export default router;
