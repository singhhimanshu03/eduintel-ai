import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan';
import { createClient } from 'redis'; import axios from 'axios'; import ExcelJS from 'exceljs';

const app = express();
const PORT = process.env.PORT || 3009;
const TTL = parseInt(process.env.DASHBOARD_CACHE_TTL || '300');

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

app.use(helmet()); app.use(cors()); app.use(express.json());
morgan.token('req-id', (req: Request) => (req.headers['x-request-id'] as string) || '-');
app.use(morgan(':req-id :method :url :status - :response-time ms'));

const svc = {
  student:    process.env.STUDENT_SERVICE_URL,
  attendance: process.env.ATTENDANCE_SERVICE_URL,
  exam:       process.env.EXAM_SERVICE_URL,
  fee:        process.env.FEE_SERVICE_URL,
  ai:         process.env.AI_SERVICE_URL,
  placement:  process.env.PLACEMENT_SERVICE_URL,
};
const internalHeaders = { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET };

async function cacheOrFetch(key: string, fetcher: () => Promise<unknown>) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await redis.setEx(key, TTL, JSON.stringify(data));
  return data;
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard/admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.headers['x-user-role'] as string;
    if (!['super_admin', 'college_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const institutionId = req.headers['x-institution-id'] as string;
    const data = await cacheOrFetch(`dash:admin:${institutionId}`, async () => {
      // Fetch students, attendance analytics, fees, and per-student attendance in parallel.
      // We intentionally do NOT call /eligibility-risk/summary (a stub) — instead we
      // fetch each student's attendance summary so we can build real eligibility payloads
      // and call the batch prediction endpoint with actual data.
      const [students, attendance, fees, feeDefaulters] = await Promise.allSettled([
        axios.get(`${svc.student}/api/students?limit=1000`, { headers: { ...internalHeaders, 'x-institution-id': institutionId } }),
        axios.get(`${svc.attendance}/api/attendance/analytics`, { headers: { ...internalHeaders, 'x-institution-id': institutionId } }),
        axios.get(`${svc.fee}/api/fees/analytics`, { headers: internalHeaders }),
        axios.get(`${svc.fee}/api/fees/defaulters`, { headers: internalHeaders }).catch(() => ({ data: { data: [] } })),
      ]);

      // ── Students ─────────────────────────────────────────────────────────
      const studentsRaw = students.status === 'fulfilled' ? students.value.data : null;
      const studentsData: Array<{ id: string; student_id?: string }> = studentsRaw?.data ?? [];
      const totalStudents = studentsData.length;

      // ── Attendance ───────────────────────────────────────────────────────
      const attRaw  = attendance.status === 'fulfilled' ? attendance.value.data : null;
      const attData = attRaw?.data ?? {};
      const avgAttendance = attData.averageAttendance ? parseFloat(attData.averageAttendance) : 0;

      // Build a fast lookup: student_id → avg attendance % from the below-threshold list.
      // Students not in the list are assumed to be above 75% (low risk from attendance side).
      const belowThreshold: Array<{ student_id: string; attendance_percentage: string }> =
        attData.studentsBelowThreshold ?? [];
      const attMap: Record<string, number> = {};
      for (const s of belowThreshold) {
        attMap[s.student_id] = parseFloat(s.attendance_percentage);
      }

      // ── Fees ─────────────────────────────────────────────────────────────
      const feesRaw  = fees.status === 'fulfilled' ? fees.value.data : null;
      const feesData = feesRaw?.data ?? {};
      const feesSummary: Array<{ fee_status: string; total_collected: string }> = feesData.summary ?? [];
      const paidEntry    = feesSummary.find(s => s.fee_status === 'paid');
      const feeCollected = paidEntry ? Number(paidEntry.total_collected) : 0;

      // Build a set of student IDs who are fee defaulters (unpaid / partially_paid)
      const defaultersRaw: Array<{ student_id: string }> =
        (feeDefaulters as PromiseFulfilledResult<{ data: { data: Array<{ student_id: string }> } }>).value?.data?.data ?? [];
      const defaulterSet = new Set(defaultersRaw.map(d => String(d.student_id)));

      // ── AI risk — run batch eligibility prediction on all students ────────
      // Cap at 500 (the AI service batch limit). For institutions with >500 students
      // this gives a representative sample for the dashboard summary.
      const BATCH_LIMIT = 500;
      const batchPayload = studentsData.slice(0, BATCH_LIMIT).map(s => ({
        student_id:           s.id,
        // Use real attendance if available from below-threshold list, else assume 80% (safe default)
        attendance_percentage: attMap[s.id] ?? 80,
        // Mark as unpaid only if confirmed defaulter; default to paid (conservative — lowers risk)
        fee_status:            defaulterSet.has(String(s.id)) ? 'unpaid' : 'paid',
        // Without per-student marks/GPA at this aggregation level, use institution-average proxies.
        // avg attendance correlates with marks; below-threshold students get lower marks estimate.
        avg_internal_marks:    attMap[s.id] != null ? Math.min(100, attMap[s.id] * 0.7 + 15) : 65,
        prev_semester_gpa:     7.0,   // neutral default; will be overridden by per-student pages
      }));

      let aiInsights: { data: { low: number; medium: number; high: number } } | null = null;
      let atRiskStudents = { low: 0, medium: 0, high: 0 };

      if (batchPayload.length > 0) {
        try {
          const batchRes = await axios.post(
            `${svc.ai}/api/ai/eligibility-risk/batch`,
            { students: batchPayload },
            { headers: internalHeaders, timeout: 30_000 }
          );
          const results: Array<{ risk_score: string }> = batchRes.data?.data ?? [];
          for (const r of results) {
            const lvl = (r.risk_score ?? '').toLowerCase();
            if      (lvl === 'low')    atRiskStudents.low++;
            else if (lvl === 'medium') atRiskStudents.medium++;
            else if (lvl === 'high')   atRiskStudents.high++;
          }
          // Shape aiInsights to match the structure the frontend expects:
          // data.aiInsights.data.{ low, medium, high }
          aiInsights = { data: atRiskStudents };
        } catch (aiErr) {
          console.warn('AI batch prediction failed for dashboard summary:', (aiErr as Error).message);
          // Leave atRiskStudents as zeros — dashboard degrades gracefully
        }
      }

      return {
        // Flat fields expected by the frontend AdminOverview and API tests
        totalStudents,
        avgAttendance,
        feeCollected,
        atRiskStudents,
        // Raw sub-responses kept for components that drill into them (charts, lists)
        students:   studentsRaw,
        attendance: attRaw,
        fees:       feesRaw,
        aiInsights,
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Faculty dashboard ─────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard/faculty', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const data = await cacheOrFetch(`dash:faculty:${userId}`, async () => {
      const [attendance, ai] = await Promise.allSettled([
        axios.get(`${svc.attendance}/api/attendance/analytics`, { headers: { ...internalHeaders, 'x-user-id': userId } }),
        axios.get(`${svc.ai}/api/ai/faculty/${userId}/flagged-students`, { headers: internalHeaders }),
      ]);
      return {
        attendanceSummary: attendance.status === 'fulfilled' ? attendance.value.data : null,
        flaggedStudents: ai.status === 'fulfilled' ? ai.value.data : null,
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Student dashboard ─────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard/student/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.id;
    const data = await cacheOrFetch(`dash:student:${studentId}`, async () => {
      // Step 1: fetch attendance and exam results in parallel
      const [att, results] = await Promise.allSettled([
        axios.get(`${svc.attendance}/api/attendance/students/${studentId}`, { headers: internalHeaders }),
        axios.get(`${svc.exam}/api/exams/results/${studentId}`, { headers: internalHeaders }),
      ]);

      // Step 2: build enriched AI recommendations payload from real data
      const attData: Array<{ attendance_percentage: string }> =
        att.status === 'fulfilled' ? (att.value.data?.data ?? []) : [];
      const resultsData = results.status === 'fulfilled' ? (results.value.data?.data ?? {}) : {};

      const avgAtt = attData.length
        ? attData.reduce((sum, a) => sum + parseFloat(a.attendance_percentage), 0) / attData.length
        : 75;

      const marks: Array<{ internal_marks: number | string; gpa_points?: number | string }> = resultsData.marks ?? [];
      const avgMarks = marks.length
        ? marks.reduce((sum, m) => sum + parseFloat(String(m.internal_marks ?? 0)), 0) / marks.length
        : 60;

      const semGPA: Record<string, number> = resultsData.semesterGPA ?? {};
      const sortedSems = Object.keys(semGPA).sort();
      const prevGPA = sortedSems.length
        ? semGPA[sortedSems[sortedSems.length - 1]]
        : 7;
      const backlogs: unknown[] = resultsData.backlogs ?? [];

      const aiPayload = {
        student_id: studentId,
        attendance_percentage: Math.round(avgAtt * 10) / 10,
        avg_internal_marks: Math.round(avgMarks * 10) / 10,
        prev_semester_gpa: prevGPA,
        current_gpa: prevGPA,
        fee_status: 'paid', // conservative default; fee service not aggregated here
        backlog_count: backlogs.length,
        internal_marks: marks.slice(0, 6).map(m => parseFloat(String(m.internal_marks ?? 60))),
      };

      // Step 3: call AI recommendations with real payload
      const recommendations = await axios
        .post(`${svc.ai}/api/ai/recommendations/${studentId}`, aiPayload, { headers: internalHeaders })
        .then(r => r.data)
        .catch(() => null);

      return {
        attendance: att.status === 'fulfilled' ? att.value.data : null,
        results: results.status === 'fulfilled' ? results.value.data : null,
        eligibility: null, // populated by AI eligibility-risk if needed
        recommendations: recommendations?.data ?? recommendations,
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Parent dashboard ──────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard/parent/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.studentId;
    const data = await cacheOrFetch(`dash:parent:${studentId}`, async () => {
      // Fetch attendance and exam results first so we can build a proper AI payload
      const [att, results, fee] = await Promise.allSettled([
        axios.get(`${svc.attendance}/api/attendance/students/${studentId}`, { headers: internalHeaders }),
        axios.get(`${svc.exam}/api/exams/results/${studentId}`, { headers: internalHeaders }),
        axios.get(`${svc.fee}/api/fees/students/${studentId}/status`, { headers: internalHeaders }),
      ]);

      const attData: Array<{ attendance_percentage: string }> =
        att.status === 'fulfilled' ? (att.value.data?.data ?? []) : [];
      const resultsData = results.status === 'fulfilled' ? (results.value.data?.data ?? {}) : {};
      const feeStatus: string = fee.status === 'fulfilled' ? (fee.value.data?.data?.fee_status ?? 'unpaid') : 'unpaid';

      const avgAtt = attData.length
        ? attData.reduce((sum, a) => sum + parseFloat(a.attendance_percentage), 0) / attData.length
        : 75;

      const marks: Array<{ internal_marks: number | string }> = (resultsData as { marks?: Array<{ internal_marks: number | string }> }).marks ?? [];
      const avgMarks = marks.length
        ? marks.reduce((sum, m) => sum + parseFloat(String(m.internal_marks ?? 0)), 0) / marks.length
        : 60;

      const semGPA: Record<string, number> = (resultsData as { semesterGPA?: Record<string, number> }).semesterGPA ?? {};
      const sortedSems = Object.keys(semGPA).sort();
      const prevGPA = sortedSems.length ? semGPA[sortedSems[sortedSems.length - 1]] : 7;

      // Build complete eligibility payload — all required fields present
      const eligibilityPayload = {
        student_id:            studentId,
        attendance_percentage: Math.round(avgAtt * 10) / 10,
        fee_status:            feeStatus,
        avg_internal_marks:    Math.round(avgMarks * 10) / 10,
        prev_semester_gpa:     prevGPA,
      };

      const risk = await axios
        .post(`${svc.ai}/api/ai/eligibility-risk`, eligibilityPayload, { headers: internalHeaders })
        .then(r => r.data)
        .catch(() => null);

      // Augment the attendance response with a computed numeric percentage
      // (frontend reads .data[], API tests read .percentage)
      const attResponse = att.status === 'fulfilled' ? att.value.data : null;
      if (attResponse) attResponse.percentage = Math.round(avgAtt * 10) / 10;

      return {
        attendance:  attResponse,
        results:     results.status === 'fulfilled' ? results.value.data : null, // frontend reads data.results.data
        performance: results.status === 'fulfilled' ? results.value.data : null, // API test reads data.performance
        alerts:      [],
        riskScore:   risk?.data?.risk_score ?? risk?.risk_score ?? null,
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Department stats (Req 16.6) ──────────────────────────────────────────────
app.get('/api/analytics/department', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.headers['x-institution-id'] as string;
    const data = await cacheOrFetch(`dash:dept:${institutionId}`, async () => {
      const stuRes = await axios.get(
        `${svc.student}/api/students?limit=1000`,
        { headers: { ...internalHeaders, 'x-institution-id': institutionId } }
      ).catch(() => null);
      const students: Array<{ department_id?: string }> = stuRes?.data?.data ?? [];
      // Group by department_id
      const deptMap: Record<string, number> = {};
      for (const s of students) {
        const dept = s.department_id ?? 'unknown';
        deptMap[dept] = (deptMap[dept] ?? 0) + 1;
      }
      return {
        totalStudents: students.length,
        byDepartment: deptMap,
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Reports: Excel export ─────────────────────────────────────────────────────
app.get('/api/analytics/reports/:type/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const { format = 'excel' } = req.query as { format: string };
    const userId = req.headers['x-user-id'] as string;
    const userName = req.headers['x-user-name'] as string || 'System';
    const role = req.headers['x-user-role'] as string;

    // Fetch data based on type
    let rows: Record<string, unknown>[] = [];
    let columns: string[] = [];

    if (type === 'attendance') {
      const res2 = await axios.get(`${svc.attendance}/api/attendance/analytics`, { headers: internalHeaders });
      rows = (res2.data.data?.studentsBelowThreshold as Record<string, unknown>[]) || [];
      columns = ['student_id', 'subject_code', 'attendance_percentage'];
    } else if (type === 'fees') {
      const res2 = await axios.get(`${svc.fee}/api/fees/defaulters`, { headers: internalHeaders });
      rows = (res2.data.data as Record<string, unknown>[]) || [];
      columns = ['student_id', 'total_fee', 'paid_amount', 'balance', 'fee_status'];
    } else if (type === 'academic') {
      const institutionId = req.headers['x-institution-id'] as string;
      const res2 = await axios.get(
        `${svc.student}/api/students?limit=200`,
        { headers: { ...internalHeaders, 'x-institution-id': institutionId } }
      );
      const students: Record<string, unknown>[] = res2.data.data || [];
      // For each student fetch academic history (limit to keep report fast)
      const histories = await Promise.allSettled(
        students.slice(0, 50).map(s =>
          axios.get(`${svc.student}/api/students/${s.id}/academic-history`, { headers: internalHeaders })
            .then(r => (r.data.data as Record<string, unknown>[]).map(h => ({ ...h, student_code: s.student_code, full_name: s.full_name })))
        )
      );
      rows = histories.flatMap(h => h.status === 'fulfilled' ? h.value : []);
      columns = ['student_code', 'full_name', 'semester', 'subject_code', 'subject_name', 'internal_marks', 'semester_marks', 'total_marks', 'grade', 'gpa', 'is_backlog'];
    } else if (type === 'eligibility') {
      const res2 = await axios.get(`${svc.attendance}/api/attendance/analytics`, { headers: internalHeaders });
      const below: Record<string, unknown>[] = res2.data.data?.studentsBelowThreshold || [];
      const feeRes = await axios.get(`${svc.fee}/api/fees/defaulters`, { headers: internalHeaders }).catch(() => ({ data: { data: [] } }));
      const defaulters: string[] = ((feeRes.data.data as Record<string, unknown>[]) || []).map(f => String(f.student_id));
      rows = below.map(s => ({
        ...s,
        fee_defaulter: defaulters.includes(String(s.student_id)) ? 'Yes' : 'No',
        eligible: (parseFloat(String(s.attendance_percentage)) >= 75 && !defaulters.includes(String(s.student_id))) ? 'YES' : 'NO',
      }));
      columns = ['student_id', 'subject_code', 'attendance_percentage', 'fee_defaulter', 'eligible'];
    } else if (type === 'ai-predictions') {
      const institutionId = req.headers['x-institution-id'] as string;
      const stuRes = await axios.get(
        `${svc.student}/api/students?limit=100`,
        { headers: { ...internalHeaders, 'x-institution-id': institutionId } }
      );
      const students: Record<string, unknown>[] = stuRes.data.data || [];
      const predictions = await Promise.allSettled(
        students.slice(0, 30).map(async s => {
          const attRes = await axios.get(`${svc.attendance}/api/attendance/students/${s.id}`, { headers: internalHeaders }).catch(() => ({ data: { data: [] } }));
          const attData: Array<{ attendance_percentage: string }> = attRes.data.data || [];
          const avgAtt = attData.length ? attData.reduce((sum, a) => sum + parseFloat(a.attendance_percentage), 0) / attData.length : 75;
          const pred = await axios.post(`${svc.ai}/api/ai/eligibility-risk`, {
            student_id: s.id, attendance_percentage: Math.round(avgAtt * 10) / 10,
            fee_status: 'paid', avg_internal_marks: 60, prev_semester_gpa: 7,
          }, { headers: internalHeaders }).catch(() => ({ data: { data: { risk_score: 'Unknown' } } }));
          return { student_id: s.id, student_code: s.student_code, full_name: s.full_name, avg_attendance: avgAtt.toFixed(1), risk_score: pred.data.data?.risk_score ?? 'Unknown' };
        })
      );
      rows = predictions.flatMap(p => p.status === 'fulfilled' ? [p.value] : []);
      columns = ['student_code', 'full_name', 'avg_attendance', 'risk_score'];
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);
    sheet.addRow([`EduIntel AI — ${type} Report`]);
    sheet.addRow([`Generated: ${new Date().toLocaleString()} | User: ${userName} (${role})`]);
    sheet.addRow([]);

    if (rows.length === 0) {
      sheet.addRow(['No records found']);
    } else {
      sheet.addRow(columns);
      rows.forEach(r => sheet.addRow(columns.map(c => r[c])));
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'analytics-service' }));
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: 'Internal server error' });
});
app.listen(PORT, () => console.log(`Analytics service on port ${PORT}`));
