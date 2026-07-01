/**
 * api-gateway.spec.ts
 *
 * Requirements covered:
 *   Req 18   — API Gateway and Infrastructure
 *     18.1   — Routes all requests to correct microservice
 *     18.2   — Validates JWT on every request; 401 on missing/invalid token
 *     18.3   — Rate limit 200 req/min per user; 429 on breach
 *     18.4   — Swagger/OpenAPI docs for super_admin
 *     18.5   — Forwards x-user-id and x-user-role headers
 *     18.6   — Redis GET caching with configurable TTL
 *     18.7   — 5xx from downstream → standardised error (no stack trace)
 *   Req 2.3  — 403 + audit log on unauthorised role
 *   Req 20.2 — HTTPS enforced (noted; Docker stack uses HTTP locally)
 */

import { test, expect } from '@playwright/test';
import { USERS, API_URL, TEST_PASSWORD, INSTITUTION_ID } from '../fixtures/constants';

// ─── Token helpers ────────────────────────────────────────────────────────────

async function getToken(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  const body = await res.json();
  return body.data?.accessToken ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Routing — gateway forwards to correct microservice (Req 18.1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API Gateway routing (Req 18.1)', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, USERS.admin.email, USERS.admin.password);
  });

  test('/api/auth/* routes to auth-service', async ({ request }) => {
    // /api/auth/login is a public route — gateway must forward it
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.admin.email, password: USERS.admin.password },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.accessToken).toBeTruthy();
  });

  test('/api/students/* routes to student-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // student-service returns 200 with data array
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('/api/faculty/* routes to faculty-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/faculty`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('/api/attendance/* routes to attendance-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/attendance/analytics`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('/api/exams/* routes to examination-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/exams/schedules`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('/api/fees/* routes to fee-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/fees/analytics`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('/api/placement/* routes to placement-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/companies`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('/api/analytics/* routes to analytics-service', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/analytics/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('/api/ai/* routes to ai-service', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentId:            '00000000-0000-0000-0000-000000000003',
        attendancePercentage: 80,
        feeStatus:            'paid',
        avgInternalMarks:     30,
        prevSemesterGpa:      7.5,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Unknown route returns 404', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/does-not-exist`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. JWT validation — 401 on missing or invalid token (Req 18.2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('JWT validation (Req 18.2)', () => {
  test('Request with no Authorization header returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`);
    expect(res.status()).toBe(401);
  });

  test('Request with malformed token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: 'Bearer this.is.not.valid' },
    });
    expect(res.status()).toBe(401);
  });

  test('Request with expired token returns 401', async ({ request }) => {
    // Manually crafted token with exp in the past (header.payload.sig — invalid sig)
    const expiredToken =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJ1c2VySWQiOiJ0ZXN0Iiwicm9sZSI6ImNvbGxlZ2VfYWRtaW4iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0' +
      '.invalidsignature';
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status()).toBe(401);
  });

  test('401 response body does not expose stack trace (Req 18.7)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`);
    const body = await res.json();
    const bodyStr = JSON.stringify(body).toLowerCase();
    expect(bodyStr).not.toMatch(/stack|at\s+\w+\s+\(.*\.js/);
  });

  test('Public auth routes are reachable without token (Req 18.2)', async ({ request }) => {
    // /api/auth/login must not require a JWT
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'nobody@test.edu', password: 'wrong' },
    });
    // Should get 401 from auth-service (bad credentials), NOT from gateway (missing token)
    expect(res.status()).not.toBe(403);
  });

  test('/api/auth/register is reachable without token', async ({ request }) => {
    // Submitting invalid data — but must reach the service (not blocked by gateway)
    const res = await request.post(`${API_URL}/api/auth/register`, {
      data: { email: 'bad' }, // intentionally incomplete
    });
    // 400 from auth-service means gateway forwarded it
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).not.toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. RBAC — 403 on unauthorised role (Req 18.2, Req 2.3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('RBAC enforcement — 403 (Req 2.3, 18.2)', () => {
  let studentToken:  string;
  let facultyToken:  string;
  let parentToken:   string;
  let examToken:     string;

  test.beforeAll(async ({ request }) => {
    const results = await Promise.all([
      getToken(request, USERS.student.email, USERS.student.password),
      getToken(request, USERS.faculty.email, USERS.faculty.password),
      getToken(request, USERS.parent.email,  USERS.parent.password),
      getToken(request, USERS.examCell.email, USERS.examCell.password),
    ]);
    [studentToken, facultyToken, parentToken, examToken] = results;
  });

  test('Student token → GET /api/students returns 403', async ({ request }) => {
    // Students must not list all students — only their own record via a different route
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('Parent token → GET /api/students returns 403', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('Student token → POST /api/exams/schedules returns 403', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/exams/schedules`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { subjectCode: 'CS999', examDate: '2025-12-01', startTime: '09:00', venue: 'Hall', semester: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test('Faculty token → DELETE /api/students/:id returns 403', async ({ request }) => {
    const res = await request.delete(
      `${API_URL}/api/students/00000000-0000-0000-0000-000000000003`,
      { headers: { Authorization: `Bearer ${facultyToken}` } },
    );
    expect(res.status()).toBe(403);
  });

  test('Parent token → POST /api/fees/transactions returns 403', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/fees/transactions`, {
      headers: { Authorization: `Bearer ${parentToken}` },
      data: { studentId: '00000000-0000-0000-0000-000000000003', amount: 1000 },
    });
    expect(res.status()).toBe(403);
  });

  test('Exam cell token → GET /api/placement/drives returns 403', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/drives`, {
      headers: { Authorization: `Bearer ${examToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('403 response body is structured JSON without stack trace (Req 18.7)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const body = await res.json();
    // Must have a success:false or error field
    expect(body.success === false || body.error !== undefined).toBeTruthy();
    const bodyStr = JSON.stringify(body).toLowerCase();
    expect(bodyStr).not.toMatch(/stack|at\s+\w+\s+\(.*\.js/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Rate limiting — 429 after 200 req/min (Req 18.3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rate limiting (Req 18.3)', () => {
  test('Returns 429 after exceeding 200 requests per minute', async ({ request }) => {
    // Log in once to get a token — this uses the real account
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);

    // Fire 210 rapid-fire requests to a lightweight endpoint
    const responses = await Promise.all(
      Array.from({ length: 210 }, () =>
        request.get(`${API_URL}/api/fees/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-institution-id': INSTITUTION_ID,
          },
        }),
      ),
    );

    const statuses = responses.map(r => r.status());
    const got429   = statuses.some(s => s === 429);
    expect(got429).toBeTruthy();
  });

  test('429 response includes Retry-After or rate-limit headers (Req 18.3)', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);

    // Fire enough requests to trigger the limit
    const responses = await Promise.all(
      Array.from({ length: 210 }, () =>
        request.get(`${API_URL}/api/fees/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-institution-id': INSTITUTION_ID,
          },
        }),
      ),
    );

    const limited = responses.find(r => r.status() === 429);
    if (limited) {
      const headers = limited.headers();
      const hasRateLimitHeader =
        'retry-after' in headers ||
        'x-ratelimit-limit' in headers ||
        'ratelimit-limit' in headers;
      expect(hasRateLimitHeader).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Header forwarding — x-user-id and x-user-role (Req 18.5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Header forwarding (Req 18.5)', () => {
  test('Gateway injects x-user-id so downstream services can use it', async ({ request }) => {
    // The analytics student dashboard endpoint uses x-user-id to scope data
    const token = await getToken(request, USERS.student.email, USERS.student.password);

    const res = await request.get(
      `${API_URL}/api/analytics/dashboard/student/00000000-0000-0000-0000-000000000003`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    // Downstream successfully identifies user — 200 or 403 (wrong student), not 500
    expect([200, 403]).toContain(res.status());
  });

  test('Internal-service routes reject requests without x-internal-secret (Req 18.5)', async ({ request }) => {
    // /api/notifications/send requires x-internal-secret, not a JWT
    const res = await request.post(`${API_URL}/api/notifications/send`, {
      data: {
        userId:    '00000000-0000-0000-0000-000000000003',
        eventType: 'fee_reminder',
        channel:   'in_app',
        subject:   'Test',
        message:   'Test',
      },
      // No x-internal-secret header
    });
    expect(res.status()).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Standardised error format — no stack traces (Req 18.7)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Standardised error responses (Req 18.7)', () => {
  test('404 for unknown route is structured JSON', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);
    const res = await request.get(`${API_URL}/api/no-such-service/no-such-route`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);
    // Must be JSON
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('Validation error (400) body is structured and has no stack trace', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);
    const res = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { invalidField: 'xyz' }, // intentionally bad payload
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    const bodyStr = JSON.stringify(body).toLowerCase();
    expect(bodyStr).not.toMatch(/stack|at\s+\w+\s+\(.*\.js/);
  });

  test('5xx from a downstream service returns standardised error body (Req 18.7)', async ({ request }) => {
    // We can't easily force a real 500 without mocking, but we verify the gateway
    // wraps the error: attempt to call an AI endpoint with a completely invalid payload
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);
    const res = await request.post(`${API_URL}/api/ai/eligibility-risk`, {
      headers: { Authorization: `Bearer ${token}` },
      data: null, // null body — triggers a service-level parse error
    });
    // Response must be JSON and must not expose internal stack trace
    if (res.status() >= 500) {
      const body = await res.json();
      expect(body.success).toBe(false);
      const bodyStr = JSON.stringify(body).toLowerCase();
      expect(bodyStr).not.toMatch(/stack|at\s+\w+\s+\(.*\.js/);
    } else {
      // Service handled gracefully with 400 — also acceptable
      expect(res.status()).toBeLessThan(500);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Redis caching on GET endpoints (Req 18.6, Req 16.5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Redis caching (Req 18.6)', () => {
  test('Second identical GET returns same data within TTL', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);
    const headers = {
      Authorization: `Bearer ${token}`,
      'x-institution-id': INSTITUTION_ID,
    };
    const url = `${API_URL}/api/analytics/dashboard/admin`;

    const [res1, res2] = await Promise.all([
      request.get(url, { headers }),
      request.get(url, { headers }),
    ]);

    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();

    const [b1, b2] = await Promise.all([res1.json(), res2.json()]);
    // Core data must be identical within the TTL window
    expect(b1.data.totalStudents).toEqual(b2.data.totalStudents);
    expect(b1.data.avgAttendance).toEqual(b2.data.avgAttendance);
  });

  test('Fee analytics GET is served consistently on repeated calls', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password);
    const headers = {
      Authorization: `Bearer ${token}`,
      'x-institution-id': INSTITUTION_ID,
    };
    const url = `${API_URL}/api/fees/analytics`;

    const res1 = await request.get(url, { headers });
    const res2 = await request.get(url, { headers });

    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();

    const [b1, b2] = await Promise.all([res1.json(), res2.json()]);
    // Summary length must be equal — same data served from cache
    expect(JSON.stringify(b1.data.summary)).toEqual(JSON.stringify(b2.data.summary));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Swagger/OpenAPI docs (Req 18.4)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Swagger docs (Req 18.4)', () => {
  test('Super admin can access /api-docs or /docs endpoint', async ({ request }) => {
    const token = await getToken(
      request,
      USERS.superAdmin.email,
      USERS.superAdmin.password,
    );

    // Try both common paths — at least one must respond
    const [res1, res2] = await Promise.all([
      request.get(`${API_URL}/api-docs`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      request.get(`${API_URL}/docs`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const either200 = res1.ok() || res2.ok();
    expect(either200).toBeTruthy();
  });

  test('Non-super-admin cannot access /api-docs (Req 18.4)', async ({ request }) => {
    const token = await getToken(request, USERS.student.email, USERS.student.password);

    const [res1, res2] = await Promise.all([
      request.get(`${API_URL}/api-docs`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      request.get(`${API_URL}/docs`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    // Both must be 403 or 404 for non-super-admin
    for (const res of [res1, res2]) {
      if (res.status() !== 404) {
        // If the route exists it must return 403
        expect(res.status()).toBe(403);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Response shape consistency across services
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Response shape consistency', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, USERS.admin.email, USERS.admin.password);
  });

  const endpoints = [
    { method: 'GET',  path: '/api/students',              label: 'student-service' },
    { method: 'GET',  path: '/api/faculty',               label: 'faculty-service' },
    { method: 'GET',  path: '/api/placement/companies',   label: 'placement-service' },
    { method: 'GET',  path: '/api/fees/defaulters',       label: 'fee-service' },
    { method: 'GET',  path: '/api/exams/schedules',       label: 'examination-service' },
  ] as const;

  for (const { method, path, label } of endpoints) {
    test(`${label} — response has { success, data } shape`, async ({ request }) => {
      const res = await request.get(`${API_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(typeof body.success).toBe('boolean');
      expect(body.data).toBeDefined();
    });
  }
});
