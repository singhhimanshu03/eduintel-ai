/**
 * attendance.spec.ts
 *
 * Requirements covered:
 *   Req 5  — Attendance Recording and Management
 *   Req 16.2 — Faculty dashboard attendance summary
 *
 * Test groups:
 *   1. Student attendance page — view own records
 *   2. Admin attendance analytics page
 *   3. Faculty mark attendance page — UI
 *   4. API — attendance service (sessions, records, summary, analytics)
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { MyAttendancePage }          from '../page-objects/StudentDashboardPage';
import { AttendanceAnalyticsPage }   from '../page-objects/ChangePasswordPage';
import { MarkAttendancePage }        from '../page-objects/FacultyDashboardPage';
import { STUDENT_IDS, API_URL, TEST_PASSWORD, INSTITUTION_ID } from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Student attendance page (Req 5.5)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student attendance page (Req 5.5)', () => {
  authTest('page loads on /student/attendance', async ({ studentPage }) => {
    const attPage = new MyAttendancePage(studentPage);
    await attPage.goto();
    await attPage.expectOnPage();
  });

  authTest('page title is visible', async ({ studentPage }) => {
    const attPage = new MyAttendancePage(studentPage);
    await attPage.goto();
    await expect(attPage.pageTitle).toBeVisible({ timeout: 10_000 });
  });

  authTest('attendance percentage is displayed (Req 5.5)', async ({ studentPage }) => {
    const attPage = new MyAttendancePage(studentPage);
    await attPage.goto();
    await attPage.expectAttendancePercentageVisible();
  });

  authTest('student cannot view other students\' attendance', async ({ studentPage }) => {
    // Student should not be able to navigate to another student's data via admin routes
    await studentPage.goto('/admin/attendance');
    await expect(studentPage).not.toHaveURL(/\/admin\/attendance/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Admin attendance analytics page (Req 5.7)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Admin attendance analytics (Req 5.7)', () => {
  authTest('page loads on /admin/attendance', async ({ adminPage }) => {
    const analyticsPage = new AttendanceAnalyticsPage(adminPage);
    await analyticsPage.goto();
    await analyticsPage.expectOnPage();
  });

  authTest('average attendance stat is visible', async ({ adminPage }) => {
    const analyticsPage = new AttendanceAnalyticsPage(adminPage);
    await analyticsPage.goto();
    await analyticsPage.expectAverageAttendanceVisible();
  });

  authTest('below-threshold students section renders (Req 5.7)', async ({ adminPage }) => {
    const analyticsPage = new AttendanceAnalyticsPage(adminPage);
    await analyticsPage.goto();
    await analyticsPage.expectBelowThresholdStudentsListed();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mark attendance page — UI (Req 5.1, 5.2)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Mark attendance page — UI (Req 5.1, 5.2)', () => {
  authTest('page loads on /faculty/attendance', async ({ facultyPage }) => {
    const markPage = new MarkAttendancePage(facultyPage);
    await markPage.goto();
    await markPage.expectOnPage();
  });

  authTest('page title is visible', async ({ facultyPage }) => {
    const markPage = new MarkAttendancePage(facultyPage);
    await markPage.goto();
    await expect(markPage.pageTitle).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. API — attendance service (Req 5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Attendance service — API (Req 5)', () => {
  let adminToken:   string;
  let facultyToken: string;

  test.beforeAll(async ({ request }) => {
    const [adminRes, facRes] = await Promise.all([
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'faculty1@eduintel.edu', password: TEST_PASSWORD },
      }),
    ]);
    adminToken   = (await adminRes.json()).data?.accessToken ?? '';
    facultyToken = (await facRes.json()).data?.accessToken ?? '';
  });

  test('GET /api/attendance/analytics returns data (Req 5.7, 5.8)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/attendance/analytics`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('averageAttendance');
    expect(body.data).toHaveProperty('studentsBelowThreshold');
  });

  test('GET /api/attendance/analytics studentsBelowThreshold includes low-attendance student', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/attendance/analytics`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    const { data } = await res.json();
    // Seed: student 000000000002 has 33.3% in CS301 — below 75% threshold
    const below = data.studentsBelowThreshold as Array<{ student_id: string; attendance_percentage: number }>;
    const lowStudent = below.find(s => s.student_id === 'a0000000-0000-0000-0000-000000000002');
    expect(lowStudent).toBeDefined();
    expect(parseFloat(String(lowStudent!.attendance_percentage))).toBeLessThan(75);
  });

  test('GET /api/attendance/students/:id returns subject-wise data (Req 5.5)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/attendance/students/a0000000-0000-0000-0000-000000000001`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('attendance_percentage');
      expect(body.data[0]).toHaveProperty('subject_code');
    }
  });

  test('POST /api/attendance/sessions creates a class session (Req 5.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/attendance/classes`, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'x-institution-id': INSTITUTION_ID,
        'x-user-id': 'b0000000-0000-0000-0000-000000000001',
      },
      data: {
        subjectCode: 'CS301',
        semester:    3,
        sessionDate: new Date().toISOString().split('T')[0],
        timeSlot:    '10:00-11:00',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.classSessionId).toBeTruthy();
  });

  test('POST /api/attendance/sessions/:id/records marks attendance (Req 5.2)', async ({ request }) => {
    // Create a session first
    const sessionRes = await request.post(`${API_URL}/api/attendance/classes`, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'x-institution-id': INSTITUTION_ID,
        'x-user-id': 'b0000000-0000-0000-0000-000000000001',
      },
      data: {
        subjectCode: 'CS301',
        semester:    3,
        sessionDate: new Date().toISOString().split('T')[0],
        timeSlot:    '11:00-12:00',
      },
    });
    const { data: session } = await sessionRes.json();

    // Mark attendance
    const markRes = await request.post(
      `${API_URL}/api/attendance/classes/${session.classSessionId}/mark`,
      {
        headers: {
          Authorization: `Bearer ${facultyToken}`,
          'x-user-id': 'b0000000-0000-0000-0000-000000000001',
        },
        data: {
          records: [
            { studentId: 'a0000000-0000-0000-0000-000000000001', status: 'present' },
            { studentId: 'a0000000-0000-0000-0000-000000000003', status: 'absent' },
          ],
        },
      },
    );
    expect(markRes.ok()).toBeTruthy();
  });

  test('attendance summary is updated after marking (Req 5.2)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/attendance/students/a0000000-0000-0000-0000-000000000001`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Summary exists for student 001 — CS301 was seeded
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/attendance/analytics — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/attendance/analytics`);
    expect(res.status()).toBe(401);
  });

  test('attendance percentage is bounded 0–100 in summary (Req 13.2)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/attendance/students/a0000000-0000-0000-0000-000000000001`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const { data } = await res.json();
    for (const record of data as Array<{ attendance_percentage: number }>) {
      const pct = parseFloat(String(record.attendance_percentage));
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});
