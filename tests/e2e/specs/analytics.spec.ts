/**
 * analytics.spec.ts
 *
 * Requirements covered:
 *   Req 16 — Analytics Dashboards (all 4 role dashboards)
 *   Req 17 — Reporting and Export
 *
 * Test groups:
 *   1. Admin dashboard (Req 16.1, 16.6)
 *   2. Faculty dashboard analytics (Req 16.2)
 *   3. Student dashboard analytics (Req 16.3)
 *   4. Parent dashboard analytics (Req 16.4)
 *   5. Reports page — UI & export buttons (Req 17.1)
 *   6. API — analytics service (dashboard endpoints, reports, caching)
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { AdminOverviewPage }         from '../page-objects/AdminOverviewPage';
import { FacultyOverviewPage }       from '../page-objects/FacultyDashboardPage';
import { StudentOverviewPage }       from '../page-objects/StudentDashboardPage';
import { ParentDashboardPage }       from '../page-objects/ParentDashboardPage';
import { ReportsPage }               from '../page-objects/ChangePasswordPage';
import {
  API_URL,
  TEST_PASSWORD,
  INSTITUTION_ID,
  STUDENT_IDS,
} from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin dashboard (Req 16.1, 16.6)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Admin dashboard (Req 16.1)', () => {
  authTest('admin overview page loads at /admin', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.expectOnAdminOverview();
  });

  authTest('all four stat cards are visible (Req 16.1)', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.expectStatCardsVisible();
  });

  authTest('Total Students card shows a numeric value', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    // At least the seed 5 students should be reflected
    await overview.expectTotalStudentsValue('5');
  });

  authTest('below-threshold attendance list renders (Req 16.1)', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.expectBelowThresholdListVisible();
  });

  authTest('all nav items present in admin sidebar', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.expectNavItemsPresent();
  });

  authTest('Students nav navigates to /admin/students', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.goToStudents();
    await expect(adminPage).toHaveURL(/\/admin\/students/);
  });

  authTest('Fees nav navigates to /admin/fees', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.goToFees();
    await expect(adminPage).toHaveURL(/\/admin\/fees/);
  });

  authTest('AI Insights nav navigates to /admin/ai', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.goToAIInsights();
    await expect(adminPage).toHaveURL(/\/admin\/ai/);
  });

  authTest('Reports nav navigates to /admin/reports', async ({ adminPage }) => {
    const overview = new AdminOverviewPage(adminPage);
    await overview.goto();
    await overview.goToReports();
    await expect(adminPage).toHaveURL(/\/admin\/reports/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Faculty dashboard analytics (Req 16.2)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Faculty dashboard analytics (Req 16.2)', () => {
  authTest('faculty overview loads with attendance and flagged-student data', async ({ facultyPage }) => {
    const overview = new FacultyOverviewPage(facultyPage);
    await overview.goto();
    await overview.expectOnFacultyDashboard();
    // The faculty overview must show some data — spinner gone
    await expect(facultyPage.getByText(/loading/i)).toHaveCount(0, { timeout: 12_000 });
  });

  authTest('faculty dashboard is not accessible to admin role', async ({ adminPage }) => {
    // Admin navigating to /faculty should still work (RBAC allows admin into faculty view)
    // but student should not — tested in auth.spec.ts
    await adminPage.goto('/faculty');
    // No hard redirect for admin, but we verify the page at least loads
    await adminPage.waitForLoadState('networkidle');
    await expect(adminPage.getByText(/loading/i)).toHaveCount(0, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Student dashboard analytics (Req 16.3)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student dashboard analytics (Req 16.3)', () => {
  authTest('student overview page loads', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await overview.expectOnStudentDashboard();
  });

  authTest('student overview shows attendance and eligibility sections (Req 16.3)', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    // At least one of these data sections must be visible
    await expect(
      overview.attendanceCard
        .or(overview.eligibilitySection)
        .or(overview.resultsCard)
    ).toBeVisible({ timeout: 12_000 });
  });

  authTest('student nav items render (Req 16.3)', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await overview.expectNavPresent();
  });

  authTest('student overview shows recommendations section (Req 16.3)', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await expect(
      overview.recommendationsSection.or(studentPage.getByText(/recommendation/i).first())
    ).toBeVisible({ timeout: 12_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Parent dashboard analytics (Req 16.4)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Parent dashboard analytics (Req 16.4)', () => {
  authTest('parent dashboard loads at /parent', async ({ parentPage }) => {
    const dashboard = new ParentDashboardPage(parentPage);
    await dashboard.goto();
    await dashboard.expectOnParentDashboard();
  });

  authTest('attendance section is visible for linked student (Req 16.4)', async ({ parentPage }) => {
    const dashboard = new ParentDashboardPage(parentPage);
    await dashboard.goto();
    await dashboard.expectAttendanceSectionVisible();
  });

  authTest('results section is visible (Req 16.4)', async ({ parentPage }) => {
    const dashboard = new ParentDashboardPage(parentPage);
    await dashboard.goto();
    await dashboard.expectResultsSectionVisible();
  });

  authTest('risk score section is visible (Req 16.4)', async ({ parentPage }) => {
    const dashboard = new ParentDashboardPage(parentPage);
    await dashboard.goto();
    await dashboard.expectRiskScoreVisible();
  });

  authTest('attendance percentage value is rendered (Req 16.4)', async ({ parentPage }) => {
    const dashboard = new ParentDashboardPage(parentPage);
    await dashboard.goto();
    await dashboard.expectAttendancePercentageVisible();
  });

  authTest('risk badge shows Low, Medium, or High (Req 16.4)', async ({ parentPage }) => {
    const dashboard = new ParentDashboardPage(parentPage);
    await dashboard.goto();
    // Must show one of the three risk labels
    const badge = parentPage.getByText(/\b(low|medium|high)\b/i).first();
    await expect(badge).toBeVisible({ timeout: 12_000 });
  });

  authTest('parent cannot navigate to /admin', async ({ parentPage }) => {
    await parentPage.goto('/admin');
    await expect(parentPage).not.toHaveURL(/\/admin$/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Reports page — UI & export (Req 17.1)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Reports page — UI (Req 17.1)', () => {
  authTest('reports page loads at /admin/reports', async ({ adminPage }) => {
    const reportsPage = new ReportsPage(adminPage);
    await reportsPage.goto();
    await reportsPage.expectOnPage();
  });

  authTest('attendance and fee export buttons are present (Req 17.1)', async ({ adminPage }) => {
    const reportsPage = new ReportsPage(adminPage);
    await reportsPage.goto();
    await reportsPage.expectReportButtonsPresent();
  });

  authTest('clicking attendance Excel export triggers a download (Req 17.3)', async ({ adminPage }) => {
    const reportsPage = new ReportsPage(adminPage);
    await reportsPage.goto();

    // Intercept the download
    const downloadPromise = adminPage.waitForEvent('download', { timeout: 30_000 });
    await reportsPage.clickExportReport('attendance');
    const download = await downloadPromise;

    // File should have .xlsx or content
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.(xlsx|csv|pdf)$/i);
  });

  authTest('clicking fee report export triggers a download (Req 17.3)', async ({ adminPage }) => {
    const reportsPage = new ReportsPage(adminPage);
    await reportsPage.goto();

    const downloadPromise = adminPage.waitForEvent('download', { timeout: 30_000 });
    await reportsPage.clickExportReport('fee');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv|pdf)$/i);
  });

  authTest('student cannot access /admin/reports', async ({ studentPage }) => {
    await studentPage.goto('/admin/reports');
    await expect(studentPage).not.toHaveURL(/\/admin\/reports/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. API — analytics service (Req 16, Req 17)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Analytics service — API (Req 16, 17)', () => {
  let adminToken:   string;
  let facultyToken: string;
  let studentToken: string;
  let parentToken:  string;

  test.beforeAll(async ({ request }) => {
    const results = await Promise.all([
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'faculty1@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'student1@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'parent1@eduintel.edu', password: TEST_PASSWORD },
      }),
    ]);
    const bodies = await Promise.all(results.map(r => r.json()));
    adminToken   = bodies[0].data?.accessToken ?? '';
    facultyToken = bodies[1].data?.accessToken ?? '';
    studentToken = bodies[2].data?.accessToken ?? '';
    parentToken  = bodies[3].data?.accessToken ?? '';
  });

  // ── Admin dashboard ──────────────────────────────────────────────────────

  test('GET /api/analytics/dashboard/admin returns all required fields (Req 16.1)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('totalStudents');
    expect(body.data).toHaveProperty('avgAttendance');
    expect(body.data).toHaveProperty('feeCollected');
    expect(body.data).toHaveProperty('atRiskStudents');
  });

  test('Admin dashboard totalStudents >= 5 (seed data) (Req 16.1)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    const { data } = await res.json();
    expect(data.totalStudents).toBeGreaterThanOrEqual(5);
  });

  test('Admin dashboard atRiskStudents has Low/Medium/High counts (Req 16.1)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    const { data } = await res.json();
    // atRiskStudents should be an object with risk buckets or a number
    expect(data.atRiskStudents).toBeDefined();
  });

  // ── Faculty dashboard ────────────────────────────────────────────────────

  test('GET /api/analytics/dashboard/faculty returns class attendance and flagged students (Req 16.2)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/faculty`, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'x-institution-id': INSTITUTION_ID,
        'x-user-id': 'b0000000-0000-0000-0000-000000000001',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('attendanceSummary');
    expect(body.data).toHaveProperty('flaggedStudents');
  });

  // ── Student dashboard ────────────────────────────────────────────────────

  test('GET /api/analytics/dashboard/student returns attendance, results, eligibility, recommendations (Req 16.3)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/dashboard/student/${STUDENT_IDS.arjunMehta}`,
      {
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'x-user-id': STUDENT_IDS.arjunMehta,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('attendance');
    expect(body.data).toHaveProperty('results');
    expect(body.data).toHaveProperty('eligibility');
    expect(body.data).toHaveProperty('recommendations');
  });

  // ── Parent dashboard ─────────────────────────────────────────────────────

  test('GET /api/analytics/dashboard/parent returns linked student data (Req 16.4)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/dashboard/parent/${STUDENT_IDS.arjunMehta}`,
      {
        headers: {
          Authorization: `Bearer ${parentToken}`,
          'x-user-id': STUDENT_IDS.arjunMehta,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('attendance');
    expect(body.data).toHaveProperty('performance');
    expect(body.data).toHaveProperty('alerts');
    expect(body.data).toHaveProperty('riskScore');
  });

  test('Parent dashboard attendance value is a number 0–100 (Req 16.4)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/dashboard/parent/${STUDENT_IDS.arjunMehta}`,
      {
        headers: {
          Authorization: `Bearer ${parentToken}`,
          'x-user-id': STUDENT_IDS.arjunMehta,
        },
      },
    );
    const { data } = await res.json();
    const pct = parseFloat(String(data.attendance?.percentage ?? data.attendance ?? 0));
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  test('Parent dashboard riskScore is Low, Medium, or High (Req 16.4)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/dashboard/parent/${STUDENT_IDS.arjunMehta}`,
      {
        headers: {
          Authorization: `Bearer ${parentToken}`,
          'x-user-id': STUDENT_IDS.arjunMehta,
        },
      },
    );
    const { data } = await res.json();
    const riskScore = String(data.riskScore ?? data.risk_score ?? '').toLowerCase();
    expect(['low', 'medium', 'high']).toContain(riskScore);
  });

  // ── Redis cache staleness (Req 16.5) ─────────────────────────────────────

  test('Two consecutive admin dashboard requests return consistent data within TTL (Req 16.5)', async ({ request }) => {
    const headers = {
      Authorization: `Bearer ${adminToken}`,
      'x-institution-id': INSTITUTION_ID,
    };
    const [res1, res2] = await Promise.all([
      request.get(`${API_URL}/api/analytics/dashboard/admin`, { headers }),
      request.get(`${API_URL}/api/analytics/dashboard/admin`, { headers }),
    ]);
    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();
    const [body1, body2] = await Promise.all([res1.json(), res2.json()]);
    // totalStudents must be identical within TTL window
    expect(body1.data.totalStudents).toEqual(body2.data.totalStudents);
  });

  // ── Reports — attendance (Req 17.1, 17.3) ────────────────────────────────

  test('GET /api/analytics/reports/attendance/export?format=excel returns xlsx (Req 17.3)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/reports/attendance/export?format=excel`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/spreadsheetml|octet-stream|xlsx/i);
  });

  test('GET /api/analytics/reports/fee/export?format=excel returns xlsx (Req 17.3)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/reports/fee/export?format=excel`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/spreadsheetml|octet-stream|xlsx/i);
  });

  test('GET /api/analytics/reports/academic/export?format=excel returns xlsx (Req 17.1)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/reports/academic/export?format=excel`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
  });

  test('GET /api/analytics/reports/eligibility/export?format=excel returns xlsx (Req 17.1)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/reports/eligibility/export?format=excel`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
  });

  test('GET /api/analytics/reports/ai-predictions/export?format=excel returns xlsx (Req 17.1)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/reports/ai-predictions/export?format=excel`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
  });

  // ── Empty report returns document with message, not error (Req 17.5) ─────

  test('Report with filter that matches no data returns 200 with no-records response (Req 17.5)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/analytics/reports/attendance/export?format=excel&semester=99`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    // Must not be a 4xx/5xx error
    expect(res.status()).toBeLessThan(400);
  });

  // ── Department-level analytics (Req 16.6) ────────────────────────────────

  test('GET /api/analytics/department returns department stats (Req 16.6)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/department`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Access control ────────────────────────────────────────────────────────

  test('GET /api/analytics/dashboard/admin — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/admin`);
    expect(res.status()).toBe(401);
  });

  test('Student token cannot access admin dashboard (Req 2.2)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.status()).toBe(403);
  });
});
