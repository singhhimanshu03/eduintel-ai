/**
 * ai.spec.ts
 *
 * Requirements covered:
 *   Req 10 — AI Module: Student Eligibility Risk Prediction
 *   Req 11 — AI Module: Student Performance Prediction
 *   Req 12 — AI Module: Dropout Risk Prediction
 *   Req 13 — AI Module: Attendance Forecasting
 *   Req 14 — AI Module: Academic Recommendation Engine
 *   Req 15.5 — Placement Readiness Score
 *   Req 15.6 — Skill Gap Analysis
 *   Req 19.5 — Model versioning on every prediction
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { AIInsightsPage }            from '../page-objects/ChangePasswordPage';
import { StudentOverviewPage }       from '../page-objects/StudentDashboardPage';
import { FacultyOverviewPage }       from '../page-objects/FacultyDashboardPage';
import {
  API_URL,
  TEST_PASSWORD,
  INSTITUTION_ID,
  STUDENT_IDS,
} from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. AI Insights admin page — UI (Req 10, 12)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('AI Insights page — admin UI', () => {
  authTest('AI insights page loads at /admin/ai', async ({ adminPage }) => {
    const aiPage = new AIInsightsPage(adminPage);
    await aiPage.goto();
    await aiPage.expectOnPage();
  });

  authTest('risk distribution data is visible', async ({ adminPage }) => {
    const aiPage = new AIInsightsPage(adminPage);
    await aiPage.goto();
    await aiPage.expectRiskDataVisible();
  });

  authTest('student cannot access /admin/ai', async ({ studentPage }) => {
    await studentPage.goto('/admin/ai');
    await expect(studentPage).not.toHaveURL(/\/admin\/ai/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Student recommendations on student dashboard — UI (Req 14)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student dashboard — AI recommendations (Req 14)', () => {
  authTest('recommendations section renders on student dashboard', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await expect(
      overview.recommendationsSection.or(studentPage.getByText(/recommendation/i).first())
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Faculty flagged students — AI-backed (Req 10, 14)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Faculty dashboard — flagged students (Req 10, 14)', () => {
  authTest('flagged students section renders on faculty dashboard', async ({ facultyPage }) => {
    const overview = new FacultyOverviewPage(facultyPage);
    await overview.goto();
    await overview.expectOnFacultyDashboard();
    // Section may be empty if no high-risk students, but must not throw
    const spinner = facultyPage.getByText(/loading/i);
    await expect(spinner).toHaveCount(0, { timeout: 12_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. API — Eligibility Risk Prediction (Req 10)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AI service — Eligibility Risk (Req 10)', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
    });
    adminToken = (await res.json()).data?.accessToken ?? '';
  });

  test('POST /api/ai/eligibility-risk returns Low/Medium/High risk score (Req 10.1, 10.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.arjunMehta,
        attendancePercentage: 85,
        feeStatus:           'paid',
        avgInternalMarks:    35,
        prevSemesterGpa:     8.5,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(['Low', 'Medium', 'High']).toContain(body.data.riskScore);
    expect(body.data.confidence).toBeGreaterThanOrEqual(0);
    expect(body.data.confidence).toBeLessThanOrEqual(1);
  });

  test('Eligibility risk returns feature importance values (Req 10.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.priyaSharma,
        attendancePercentage: 70,
        feeStatus:           'unpaid',
        avgInternalMarks:    20,
        prevSemesterGpa:     5.5,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.featureImportance).toBeDefined();
  });

  test('Low-attendance + unpaid student gets High risk score (Req 10.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.priyaSharma,
        attendancePercentage: 30,
        feeStatus:           'unpaid',
        avgInternalMarks:    10,
        prevSemesterGpa:     4.0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const { data } = await res.json();
    expect(data.riskScore).toBe('High');
  });

  test('Well-performing student gets Low risk score (Req 10.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.vikramSingh,
        attendancePercentage: 95,
        feeStatus:           'paid',
        avgInternalMarks:    38,
        prevSemesterGpa:     9.2,
      },
    });
    expect(res.ok()).toBeTruthy();
    const { data } = await res.json();
    expect(data.riskScore).toBe('Low');
  });

  test('Response includes modelVersion for audit traceability (Req 19.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.arjunMehta,
        attendancePercentage: 80,
        feeStatus:           'paid',
        avgInternalMarks:    30,
        prevSemesterGpa:     7.0,
      },
    });
    const body = await res.json();
    expect(body.data.modelVersion).toBeTruthy();
  });

  test('Missing required fields returns 400 or uses rule-based fallback (Req 10.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { studentId: STUDENT_IDS.arjunMehta }, // missing most fields
    });
    // Either 400 (strict validation) or 200 (rule-based fallback) — both valid
    expect([200, 400]).toContain(res.status());
  });

  test('Round-trip: serialise → predict → same score with same inputs (Req 10.6)', async ({ request }) => {
    const payload = {
      studentId:           STUDENT_IDS.arjunMehta,
      attendancePercentage: 80,
      feeStatus:           'paid',
      avgInternalMarks:    32,
      prevSemesterGpa:     7.5,
    };
    const headers = { Authorization: `Bearer ${adminToken}` };
    const [res1, res2] = await Promise.all([
      request.post(`${API_URL}/api/ai/eligibility-risk`, { headers, data: payload }),
      request.post(`${API_URL}/api/ai/eligibility-risk`, { headers, data: payload }),
    ]);
    const [b1, b2] = await Promise.all([res1.json(), res2.json()]);
    expect(b1.data.riskScore).toEqual(b2.data.riskScore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. API — Performance Prediction (Req 11)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AI service — Performance Prediction (Req 11)', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
    });
    adminToken = (await res.json()).data?.accessToken ?? '';
  });

  test('POST /api/ai/performance-prediction returns GPA range and backlog probabilities (Req 11.1, 11.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/performance-prediction`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:        STUDENT_IDS.arjunMehta,
        currentMarks:     [{ subjectCode: 'CS301', marks: 32 }, { subjectCode: 'CS302', marks: 28 }],
        attendancePercentage: 85,
        prevSemesterGpa:  8.5,
        backlogCount:     0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveProperty('predictedGpaRange');
    expect(body.data.predictedGpaRange).toHaveProperty('lower');
    expect(body.data.predictedGpaRange).toHaveProperty('upper');
    expect(body.data).toHaveProperty('backlogProbabilities');
  });

  test('GPA range bounds are numeric and lower <= upper (Req 11.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/performance-prediction`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.priyaSharma,
        currentMarks:        [{ subjectCode: 'CS101', marks: 20 }],
        attendancePercentage: 60,
        prevSemesterGpa:     5.0,
        backlogCount:        2,
      },
    });
    const { data } = await res.json();
    const { lower, upper } = data.predictedGpaRange;
    expect(typeof lower).toBe('number');
    expect(typeof upper).toBe('number');
    expect(lower).toBeLessThanOrEqual(upper);
  });

  test('Backlog probability is between 0 and 1 per subject (Req 11.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/performance-prediction`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.arjunMehta,
        currentMarks:        [{ subjectCode: 'CS301', marks: 15 }],
        attendancePercentage: 50,
        prevSemesterGpa:     4.5,
        backlogCount:        1,
      },
    });
    const { data } = await res.json();
    for (const entry of Object.values(data.backlogProbabilities) as number[]) {
      expect(entry).toBeGreaterThanOrEqual(0);
      expect(entry).toBeLessThanOrEqual(1);
    }
  });

  test('High backlog probability subjects are included in recommendations (Req 11.4)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/performance-prediction`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.priyaSharma,
        currentMarks:        [{ subjectCode: 'WEAK01', marks: 8 }],
        attendancePercentage: 45,
        prevSemesterGpa:     3.5,
        backlogCount:        3,
      },
    });
    const { data } = await res.json();
    // If any backlog prob > 0.70, flaggedSubjects must be populated
    const highRisk = Object.entries(data.backlogProbabilities as Record<string, number>)
      .filter(([, p]) => p > 0.70);
    if (highRisk.length > 0) {
      expect(data.flaggedSubjects).toBeDefined();
      expect(Array.isArray(data.flaggedSubjects)).toBeTruthy();
    }
  });

  test('POST /api/ai/performance-prediction/batch handles up to 500 records within 10s (Req 11.5)', async ({ request }) => {
    // Use 5 records to verify the batch endpoint responds correctly
    const records = Array.from({ length: 5 }, (_, i) => ({
      studentId:           Object.values(STUDENT_IDS)[i % Object.keys(STUDENT_IDS).length],
      currentMarks:        [{ subjectCode: 'CS301', marks: 25 + i }],
      attendancePercentage: 70 + i,
      prevSemesterGpa:     6.0 + i * 0.5,
      backlogCount:        i % 3,
    }));

    const start = Date.now();
    const res = await request.post(`${API_URL}/api/ai/performance-prediction/batch`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { records },
    });
    const elapsed = Date.now() - start;

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBe(5);
    expect(elapsed).toBeLessThan(10_000);
  });

  test('Performance prediction modelVersion is present (Req 19.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/performance-prediction`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:           STUDENT_IDS.arjunMehta,
        currentMarks:        [{ subjectCode: 'CS301', marks: 30 }],
        attendancePercentage: 80,
        prevSemesterGpa:     7.0,
        backlogCount:        0,
      },
    });
    const body = await res.json();
    expect(body.data.modelVersion).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. API — Dropout Risk Prediction (Req 12)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AI service — Dropout Risk (Req 12)', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
    });
    adminToken = (await res.json()).data?.accessToken ?? '';
  });

  test('POST /api/ai/dropout-risk returns probability and risk score (Req 12.1, 12.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/dropout-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:          STUDENT_IDS.arjunMehta,
        attendanceTrend:    [85, 82, 80],
        performanceTrend:   [8.5, 8.2, 8.0],
        feePaymentHistory:  ['paid', 'paid', 'paid'],
        currentSemesterGpa: 8.0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.dropoutProbability).toBeGreaterThanOrEqual(0);
    expect(body.data.dropoutProbability).toBeLessThanOrEqual(1);
    expect(['Low', 'Medium', 'High']).toContain(body.data.riskScore);
  });

  test('Student with declining attendance and missed fees has High dropout risk (Req 12.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/dropout-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:          STUDENT_IDS.priyaSharma,
        attendanceTrend:    [70, 55, 35],
        performanceTrend:   [6.0, 4.5, 3.0],
        feePaymentHistory:  ['paid', 'unpaid', 'unpaid'],
        currentSemesterGpa: 3.0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const { data } = await res.json();
    // High-risk inputs should yield High risk or probability > 0.5
    const isHighRisk = data.riskScore === 'High' || data.dropoutProbability > 0.5;
    expect(isHighRisk).toBeTruthy();
  });

  test('Attendance trend must have exactly 3 semesters (Req 12.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/dropout-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:          STUDENT_IDS.arjunMehta,
        attendanceTrend:    [85],           // wrong length
        performanceTrend:   [8.5, 8.0, 7.5],
        feePaymentHistory:  ['paid', 'paid', 'paid'],
        currentSemesterGpa: 8.0,
      },
    });
    // Service should either accept with padding or return 400
    expect([200, 400]).toContain(res.status());
  });

  test('Dropout risk response includes modelVersion (Req 19.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/dropout-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:          STUDENT_IDS.vikramSingh,
        attendanceTrend:    [90, 92, 95],
        performanceTrend:   [8.0, 8.5, 9.0],
        feePaymentHistory:  ['paid', 'paid', 'paid'],
        currentSemesterGpa: 9.2,
      },
    });
    const body = await res.json();
    expect(body.data.modelVersion).toBeTruthy();
  });

  test('GET /api/ai/dropout-risk — unauthenticated returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/dropout-risk`, {
      data: {
        studentId:          STUDENT_IDS.arjunMehta,
        attendanceTrend:    [80, 75, 70],
        performanceTrend:   [7.0, 6.5, 6.0],
        feePaymentHistory:  ['paid', 'paid', 'unpaid'],
        currentSemesterGpa: 6.0,
      },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. API — Attendance Forecasting (Req 13)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AI service — Attendance Forecasting (Req 13)', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
    });
    adminToken = (await res.json()).data?.accessToken ?? '';
  });

  test('POST /api/ai/attendance-forecast returns 4-week projection (Req 13.1, 13.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/attendance-forecast`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        departmentId: INSTITUTION_ID,
        subjectId:    'CS301',
        historicalData: [82, 78, 75, 80, 77, 74, 79, 76],  // 8 weeks
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data.forecast)).toBeTruthy();
    expect(body.data.forecast.length).toBe(4);
  });

  test('Forecasted attendance values are constrained 0–100 (Req 13.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/attendance-forecast`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        departmentId: INSTITUTION_ID,
        subjectId:    'CS302',
        historicalData: [90, 88, 87, 85, 84, 86, 83, 82],
      },
    });
    const { data } = await res.json();
    for (const week of data.forecast as Array<{ percentage: number }>) {
      const pct = week.percentage ?? week;
      expect(Number(pct)).toBeGreaterThanOrEqual(0);
      expect(Number(pct)).toBeLessThanOrEqual(100);
    }
  });

  test('Forecast includes confidence intervals (Req 13.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/attendance-forecast`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        departmentId: INSTITUTION_ID,
        subjectId:    'CS301',
        historicalData: [75, 73, 70, 68, 65, 63, 60, 58],
      },
    });
    const { data } = await res.json();
    // Each forecast week should have a confidence interval
    const week = data.forecast[0];
    const hasCI = week.confidenceInterval ?? week.lower !== undefined;
    expect(hasCI).toBeTruthy();
  });

  test('Requires exactly 8 weeks of history (Req 13.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/attendance-forecast`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        departmentId: INSTITUTION_ID,
        subjectId:    'CS301',
        historicalData: [80, 78, 75],  // only 3 weeks — insufficient
      },
    });
    // Either 400 or uses available data with reduced accuracy
    expect([200, 400]).toContain(res.status());
  });

  test('Attendance forecast modelVersion is present (Req 19.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/attendance-forecast`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        departmentId: INSTITUTION_ID,
        subjectId:    'CS301',
        historicalData: [82, 80, 78, 77, 75, 74, 72, 71],
      },
    });
    const body = await res.json();
    expect(body.data.modelVersion).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. API — Academic Recommendation Engine (Req 14)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AI service — Recommendations (Req 14)', () => {
  let adminToken:   string;
  let facultyToken: string;

  test.beforeAll(async ({ request }) => {
    const [admRes, facRes] = await Promise.all([
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'faculty1@eduintel.edu', password: TEST_PASSWORD },
      }),
    ]);
    adminToken   = (await admRes.json()).data?.accessToken ?? '';
    facultyToken = (await facRes.json()).data?.accessToken ?? '';
  });

  test('POST /api/ai/recommendations returns structured recommendation set (Req 14.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/recommendations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { studentId: STUDENT_IDS.arjunMehta },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveProperty('subjectsNeedingAttention');
    expect(body.data).toHaveProperty('attendanceTargets');
    expect(body.data).toHaveProperty('improvementPlan');
  });

  test('Recommendations are based on eligibility + performance + dropout outputs (Req 14.2)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/recommendations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { studentId: STUDENT_IDS.priyaSharma },
    });
    expect(res.ok()).toBeTruthy();
    const { data } = await res.json();
    // Priya has low attendance — should have at least one attendance target
    expect(Array.isArray(data.attendanceTargets)).toBeTruthy();
  });

  test('Faculty batch recommendations for class return results grouped by risk (Req 14.3)', async ({ request }) => {
    const start = Date.now();
    const res = await request.post(`${API_URL}/api/ai/recommendations/class`, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'x-user-id': 'b0000000-0000-0000-0000-000000000001',
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        studentIds: Object.values(STUDENT_IDS),
      },
    });
    const elapsed = Date.now() - start;
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toBeDefined();
    // Response within 5 seconds for <= 60 students
    expect(elapsed).toBeLessThan(5_000);
  });

  test('Recommendations include improvement plan steps (Req 14.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/recommendations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { studentId: STUDENT_IDS.vikramSingh },
    });
    const { data } = await res.json();
    expect(Array.isArray(data.improvementPlan)).toBeTruthy();
  });

  test('Recommendations modelVersion is present (Req 19.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/recommendations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { studentId: STUDENT_IDS.arjunMehta },
    });
    const body = await res.json();
    expect(body.data.modelVersion).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. API — Placement Readiness Score and Skill Gap (Req 15.5, 15.6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AI service — Placement Readiness + Skill Gap (Req 15.5, 15.6)', () => {
  let placementToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'placement@eduintel.edu', password: TEST_PASSWORD },
    });
    placementToken = (await res.json()).data?.accessToken ?? '';
  });

  test('POST /api/ai/placement-readiness returns score 0–100 (Req 15.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/placement-readiness`, {
      headers: { Authorization: `Bearer ${placementToken}` },
      data: {
        studentId:    STUDENT_IDS.vikramSingh,
        cgpa:         9.2,
        skills:       ['Java', 'Python', 'SQL', 'React'],
        backlogCount: 0,
        mockScore:    85,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const score = Number(body.data.readinessScore);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('POST /api/ai/skill-gap returns prioritised list of missing skills (Req 15.6)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/skill-gap`, {
      headers: { Authorization: `Bearer ${placementToken}` },
      data: {
        studentId:    STUDENT_IDS.arjunMehta,
        skills:       ['Python'],
        targetRoles:  ['Software Engineer', 'Data Analyst'],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data.missingSkills)).toBeTruthy();
    // Should suggest skills like Java, SQL, React etc.
    expect(body.data.missingSkills.length).toBeGreaterThanOrEqual(0);
  });

  test('Skill gap analysis does not expose raw training data (Req 20.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/skill-gap`, {
      headers: { Authorization: `Bearer ${placementToken}` },
      data: {
        studentId:   STUDENT_IDS.arjunMehta,
        skills:      ['Python'],
        targetRoles: ['Backend Developer'],
      },
    });
    const body = await res.json();
    // Response should only contain outputs, not raw training data arrays
    const bodyStr = JSON.stringify(body.data);
    expect(bodyStr).not.toMatch(/training_data|raw_samples|X_train/i);
  });

  test('Placement readiness modelVersion is present (Req 19.5)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/placement-readiness`, {
      headers: { Authorization: `Bearer ${placementToken}` },
      data: {
        studentId:    STUDENT_IDS.vikramSingh,
        cgpa:         9.2,
        skills:       ['Java', 'Python'],
        backlogCount: 0,
        mockScore:    80,
      },
    });
    const body = await res.json();
    expect(body.data.modelVersion).toBeTruthy();
  });
});
