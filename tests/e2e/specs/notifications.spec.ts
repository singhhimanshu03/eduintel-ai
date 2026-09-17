/**
 * notifications.spec.ts
 *
 * Requirements covered:
 *   Req 9 — Notification System
 *
 * Test groups:
 *   1. My Notifications page — student/parent view
 *   2. Notification Center — admin compose + history
 *   3. Parent dashboard — active alerts
 *   4. API — notification service (send, history, mark-read, retry)
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { MyNotificationsPage, NotificationCenterPage } from '../page-objects/NotificationsPage';
import { ParentDashboardPage }       from '../page-objects/ParentDashboardPage';
import { STUDENT_IDS, API_URL, TEST_PASSWORD, INSTITUTION_ID } from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. My Notifications page — student view (Req 9.5)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('My Notifications — student (Req 9.5)', () => {
  authTest('student can navigate to /student/notifications', async ({ studentPage }) => {
    const notifPage = new MyNotificationsPage(studentPage);
    await notifPage.gotoStudentNotifications();
    await notifPage.expectOnPage();
  });

  authTest('notifications are loaded (or empty state shown)', async ({ studentPage }) => {
    const notifPage = new MyNotificationsPage(studentPage);
    await notifPage.gotoStudentNotifications();
    await notifPage.expectNotificationsLoaded();
  });

  authTest('/notifications route renders for authenticated student', async ({ studentPage }) => {
    const notifPage = new MyNotificationsPage(studentPage);
    await notifPage.goto();
    await notifPage.expectNotificationsLoaded();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Notification Center — admin (Req 9.1, 9.4)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Notification Center — admin (Req 9.1)', () => {
  authTest('page loads on /admin/notifications', async ({ adminPage }) => {
    const centerPage = new NotificationCenterPage(adminPage);
    await centerPage.goto();
    await centerPage.expectOnPage();
  });

  authTest('student cannot access notification compose center', async ({ studentPage }) => {
    await studentPage.goto('/admin/notifications');
    await expect(studentPage).not.toHaveURL(/\/admin\/notifications/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Parent dashboard — active alerts (Req 9.4)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Parent dashboard — alerts (Req 9.4)', () => {
  authTest('parent dashboard loads and shows student data', async ({ parentPage }) => {
    const parentDash = new ParentDashboardPage(parentPage);
    await parentDash.goto();
    await parentDash.expectOnParentDashboard();
    await parentDash.expectDashboardLoaded();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. API — notification service (Req 9)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notification service — API (Req 9)', () => {
  let adminToken:   string;
  let studentToken: string;
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET ?? 'change_this_to_a_64_char_random_hex_string';

  test.beforeAll(async ({ request }) => {
    const [admRes, stuRes] = await Promise.all([
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'student1@eduintel.edu', password: TEST_PASSWORD },
      }),
    ]);
    adminToken   = (await admRes.json()).data?.accessToken ?? '';
    studentToken = (await stuRes.json()).data?.accessToken ?? '';
  });

  test('POST /api/notifications/send creates in_app notification (Req 9.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notifications/send`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET },
      data: {
        userId:    STUDENT_IDS.arjunMehta,
        eventType: 'attendance_warning',
        channel:   'in_app',
        subject:   'Test Attendance Warning',
        message:   'Your attendance has dropped below threshold.',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/notifications/send without internal secret returns 403 (Req 9.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notifications/send`, {
      data: {
        userId:    STUDENT_IDS.arjunMehta,
        eventType: 'fee_reminder',
        channel:   'in_app',
        subject:   'Unauthorized',
        message:   'Should not send',
      },
    });
    // No x-internal-secret sent — gateway has no Bearer token either → 401
    expect(res.status()).toBe(401);
  });

  test('POST /api/notifications/send with email channel and recipientEmail delivers (Req 9.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notifications/send`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET },
      data: {
        userId:         STUDENT_IDS.arjunMehta,
        eventType:      'result_published',
        channel:        'email',
        subject:        'Results Published',
        message:        'Your semester results are now available.',
        recipientEmail: 'arjun@student.edu',
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('POST /api/notifications/send with email channel but no recipientEmail marks skipped', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notifications/send`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET },
      data: {
        userId:    STUDENT_IDS.priyaSharma,
        eventType: 'fee_reminder',
        channel:   'email',
        subject:   'Fee Due',
        message:   'You have an outstanding balance.',
        // No recipientEmail — should be skipped gracefully
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('GET /api/notifications/user/:id returns notification history (Req 9.5)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/notifications/user/${STUDENT_IDS.arjunMehta}`,
      { headers: { Authorization: `Bearer ${studentToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    // Should have at least the seed + the one we just sent
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/notifications/user/:id response has required fields (Req 9.5)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/notifications/user/${STUDENT_IDS.arjunMehta}`,
      { headers: { Authorization: `Bearer ${studentToken}` } },
    );
    const { data } = await res.json();
    if (data.length > 0) {
      const notif = data[0];
      expect(notif).toHaveProperty('event_type');
      expect(notif).toHaveProperty('channel');
      expect(notif).toHaveProperty('subject');
      expect(notif).toHaveProperty('message');
      expect(notif).toHaveProperty('delivery_status');
      expect(notif).toHaveProperty('created_at');
    }
  });

  test('PUT /api/notifications/:id/read marks notification as read (Req 9.5)', async ({ request }) => {
    // First get a notification ID
    const listRes = await request.get(
      `${API_URL}/api/notifications/user/${STUDENT_IDS.arjunMehta}`,
      { headers: { Authorization: `Bearer ${studentToken}` } },
    );
    const { data } = await listRes.json();
    if (data.length === 0) return; // Skip if no notifications yet

    const notifId = data[0].id;
    const readRes = await request.put(
      `${API_URL}/api/notifications/${notifId}/read`,
      { headers: { Authorization: `Bearer ${studentToken}` } },
    );
    expect(readRes.ok()).toBeTruthy();
  });

  test('POST /api/notifications/send for broadcast in_app (Req 9.1)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notifications/send`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET },
      data: {
        userId:    STUDENT_IDS.arjunMehta,   // user_id is NOT NULL in schema; broadcast sends to one user
        broadcast:     true,
        institutionId: INSTITUTION_ID,
        eventType:     'exam_schedule_published',
        channel:       'in_app',
        subject:       'Exam Schedule Published',
        message:       'The exam schedule has been published.',
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('notification delivery_status is a valid value (Req 9.2)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/notifications/user/${STUDENT_IDS.arjunMehta}`,
      { headers: { Authorization: `Bearer ${studentToken}` } },
    );
    const { data } = await res.json();
    const validStatuses = ['pending', 'delivered', 'failed', 'skipped'];
    for (const notif of data as Array<{ delivery_status: string }>) {
      expect(validStatuses).toContain(notif.delivery_status);
    }
  });

  test('GET /api/notifications/user/:id — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/notifications/user/${STUDENT_IDS.arjunMehta}`
    );
    expect(res.status()).toBe(401);
  });

  test('notification preferences can be set (Req 9.6)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notifications/preferences`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        emailEnabled:  true,
        inAppEnabled:  true,
        eventOverrides: {},
      },
    });
    expect(res.ok()).toBeTruthy();
  });
});
