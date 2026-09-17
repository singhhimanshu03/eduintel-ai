import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { Pool } from 'pg'; import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3008;
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(morgan('combined'));

// GET /students/:id/profile
app.get('/api/placement/students/:id/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(`SELECT * FROM placement_profiles WHERE student_id=$1`, [req.params.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Profile not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /students/:id/profile
app.put('/api/placement/students/:id/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cgpa, backlogCount, skillTags, resumeUrl, isEligible, placementStatus } = req.body;
    const { rows } = await db.query(
      `INSERT INTO placement_profiles (student_id, cgpa, backlog_count, skill_tags, resume_url, is_eligible, placement_status, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,now())
       ON CONFLICT (student_id) DO UPDATE SET
         cgpa=COALESCE($2,placement_profiles.cgpa),
         backlog_count=COALESCE($3,placement_profiles.backlog_count),
         skill_tags=COALESCE($4,placement_profiles.skill_tags),
         resume_url=COALESCE($5,placement_profiles.resume_url),
         is_eligible=COALESCE($6,placement_profiles.is_eligible),
         placement_status=COALESCE($7,placement_profiles.placement_status),
         updated_at=now()
       RETURNING *`,
      [req.params.id, cgpa, backlogCount, skillTags, resumeUrl, isEligible, placementStatus]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /companies
app.post('/api/placement/companies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, industry, ctcMin, ctcMax, role } = req.body;
    const institutionId = req.headers['x-institution-id'] as string;
    const { rows } = await db.query(
      `INSERT INTO companies (institution_id, company_name, industry, ctc_min, ctc_max, role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [institutionId, companyName, industry, ctcMin, ctcMax, role]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /companies
app.get('/api/placement/companies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.headers['x-institution-id'] as string;
    const { rows } = await db.query(
      `SELECT * FROM companies WHERE institution_id=$1 AND is_active=true ORDER BY company_name`, [institutionId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /drives
app.get('/api/placement/drives', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT rd.*, c.company_name
       FROM recruitment_drives rd
       LEFT JOIN companies c ON c.id = rd.company_id
       ORDER BY rd.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /drives
app.post('/api/placement/drives', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, minCgpa, maxBacklogs, graduationYear, interviewDate, venue } = req.body;
    const { rows } = await db.query(
      `INSERT INTO recruitment_drives (company_id, min_cgpa, max_backlogs, graduation_year, interview_date, venue)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [companyId, minCgpa, maxBacklogs ?? 0, graduationYear, interviewDate, venue]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /drives/:id/eligible  (canonical — used by tests and frontend)
// GET /drives/:id/eligible-students  (alias for backwards compatibility)
async function eligibleStudentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows: drive } = await db.query(`SELECT * FROM recruitment_drives WHERE id=$1`, [req.params.id]);
    if (!drive.length) { res.status(404).json({ success: false, message: 'Drive not found' }); return; }
    const d = drive[0];
    const { rows } = await db.query(
      `SELECT * FROM placement_profiles WHERE
         is_eligible=true
         AND ($1::decimal IS NULL OR cgpa >= $1)
         AND ($2::int IS NULL OR backlog_count <= $2)`,
      [d.min_cgpa, d.max_backlogs]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}
app.get('/api/placement/drives/:id/eligible',          eligibleStudentsHandler);
app.get('/api/placement/drives/:id/eligible-students', eligibleStudentsHandler);

// GET /profiles  — list all placement profiles
app.get('/api/placement/profiles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(`SELECT * FROM placement_profiles ORDER BY updated_at DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /profiles/:studentId — single profile with readiness score
app.get('/api/placement/profiles/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM placement_profiles WHERE student_id=$1`,
      [req.params.studentId]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Profile not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /interviews
app.post('/api/placement/interviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driveId, studentId, interviewDate, interviewTime, venue } = req.body;
    const { rows } = await db.query(
      `INSERT INTO interview_schedules (drive_id, student_id, interview_date, interview_time, venue)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [driveId, studentId, interviewDate, interviewTime, venue]
    );
    // Notify (non-blocking)
    const { rows: company } = await db.query(
      `SELECT c.company_name FROM recruitment_drives rd JOIN companies c ON c.id=rd.company_id WHERE rd.id=$1`, [driveId]
    );
    axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      userId: studentId, eventType: 'placement_update', channel: 'in_app',
      subject: 'Interview Scheduled',
      message: `Interview with ${company[0]?.company_name} on ${interviewDate} at ${interviewTime} — ${venue}`
    }, { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }).catch(() => {});
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /analytics
app.get('/api/placement/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: placed } = await db.query(`SELECT COUNT(*) FROM placement_profiles WHERE placement_status='placed'`);
    const { rows: byStatus } = await db.query(`SELECT placement_status, COUNT(*) FROM placement_profiles GROUP BY placement_status`);
    const { rows: avgScore } = await db.query(`SELECT AVG(readiness_score) as avg_score FROM placement_profiles`);
    res.json({ success: true, data: { totalPlaced: placed[0].count, byStatus, avgReadinessScore: avgScore[0].avg_score } });
  } catch (err) { next(err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'placement-service' }));
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: 'Internal server error' });
});
app.listen(PORT, () => console.log(`Placement service on port ${PORT}`));
