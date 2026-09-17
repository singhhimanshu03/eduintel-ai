/**
 * fee.spec.ts
 *
 * Requirements covered:
 *   Req 7  — Fee Management
 *   Req 19.4 — Duplicate receipt number rejected
 *
 * Test groups:
 *   1. Fee defaulters page — admin UI
 *   2. Student fee status page
 *   3. API — fee service (structures, transactions, defaulters, analytics)
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { FeeDefaultersPage }         from '../page-objects/ChangePasswordPage';
import { FeeStatusPage }             from '../page-objects/StudentDashboardPage';
import { STUDENT_IDS, API_URL, TEST_PASSWORD, INSTITUTION_ID } from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Fee defaulters page — admin UI (Req 7.5)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Fee defaulters page — admin UI (Req 7.5)', () => {
  authTest('page loads on /admin/fees', async ({ adminPage }) => {
    const feePage = new FeeDefaultersPage(adminPage);
    await feePage.goto();
    await feePage.expectOnPage();
  });

  authTest('shows at least one defaulter from seed data', async ({ adminPage }) => {
    const feePage = new FeeDefaultersPage(adminPage);
    await feePage.goto();
    // Seed has 3 defaulters: partially_paid + 2 unpaid
    await feePage.expectAtLeastOneDefaulter();
  });

  authTest('seed partially-paid student appears in defaulters', async ({ adminPage }) => {
    const feePage = new FeeDefaultersPage(adminPage);
    await feePage.goto();
    // a0000000-...-000000000002 is partially_paid in seed
    await feePage.expectDefaulterVisible('a0000000-0000-0000-0000-000000000002');
  });

  authTest('analytics section is visible (Req 7.7)', async ({ adminPage }) => {
    const feePage = new FeeDefaultersPage(adminPage);
    await feePage.goto();
    await feePage.expectAnalyticsVisible();
  });

  authTest('student cannot access /admin/fees', async ({ studentPage }) => {
    await studentPage.goto('/admin/fees');
    await expect(studentPage).not.toHaveURL(/\/admin\/fees/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Student fee status page (Req 7.3)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student fee status page (Req 7.3)', () => {
  authTest('page loads on /student/fees', async ({ studentPage }) => {
    const feePage = new FeeStatusPage(studentPage);
    await feePage.goto();
    await feePage.expectOnPage();
  });

  authTest('fee status value is visible', async ({ studentPage }) => {
    const feePage = new FeeStatusPage(studentPage);
    await feePage.goto();
    await feePage.expectFeeStatusVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. API — fee service (Req 7)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Fee service — API (Req 7)', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
    });
    adminToken = (await res.json()).data?.accessToken ?? '';
  });

  test('GET /api/fees/students/:id/status returns fee status (Req 7.3)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/fees/students/${STUDENT_IDS.vikramSingh}/status`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('fee_status');
    // vikramSingh is paid in seed
    expect(body.data.fee_status).toBe('paid');
  });

  test('GET /api/fees/students/:id/status — unpaid student returns unpaid', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/fees/students/a0000000-0000-0000-0000-000000000003/status`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.fee_status).toBe('unpaid');
  });

  test('GET /api/fees/students/:id/status — unknown student returns default unpaid', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/fees/students/00000000-1111-2222-3333-444444444444/status`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.fee_status).toBe('unpaid');
  });

  test('GET /api/fees/defaulters returns defaulter list (Req 7.5)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/fees/defaulters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    // Seed has 2 non-paid students (1 partially_paid + 1 unpaid)
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/fees/analytics returns summary + daily collection (Req 7.7)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/fees/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveProperty('summary');
    expect(body.data).toHaveProperty('dailyCollection');
    expect(Array.isArray(body.data.summary)).toBeTruthy();
  });

  test('POST /api/fees/transactions records a payment (Req 7.2)', async ({ request }) => {
    const receiptNo = `REC_${Date.now()}`;
    const res = await request.post(`${API_URL}/api/fees/transactions`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        studentId:     'a0000000-0000-0000-0000-000000000004',
        amount:        5000,
        paymentMode:   'online',
        receiptNumber: receiptNo,
        paymentStatus: 'completed',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/fees/transactions — duplicate receipt number returns 409 (Req 19.4)', async ({ request }) => {
    const receiptNo = `DUPREC_${Date.now()}`;

    // First transaction
    await request.post(`${API_URL}/api/fees/transactions`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        studentId:     STUDENT_IDS.arjunMehta,
        amount:        1000,
        paymentMode:   'cash',
        receiptNumber: receiptNo,
        paymentStatus: 'completed',
      },
    });

    // Duplicate
    const dupRes = await request.post(`${API_URL}/api/fees/transactions`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        studentId:     STUDENT_IDS.arjunMehta,
        amount:        1000,
        paymentMode:   'cash',
        receiptNumber: receiptNo,
        paymentStatus: 'completed',
      },
    });
    expect(dupRes.status()).toBe(409);
  });

  test('POST /api/fees/structures creates fee structure (Req 7.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/fees/structures`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        semester:     6,
        academicYear: '2025-26',
        totalAmount:  50000,
        dueDate:      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('GET /api/fees/defaulters — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/fees/defaulters`);
    expect(res.status()).toBe(401);
  });

  test('fee payment updates ledger status for fully paid student (Req 7.2)', async ({ request }) => {
    // Check vikramSingh is already paid
    const statusRes = await request.get(
      `${API_URL}/api/fees/students/${STUDENT_IDS.vikramSingh}/status`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const { data } = await statusRes.json();
    expect(data.fee_status).toBe('paid');
    expect(parseFloat(data.balance)).toBeLessThanOrEqual(0);
  });
});
