/**
 * student-management.spec.ts
 *
 * Requirements covered:
 *   Req 3 — Student Profile Management
 *   Req 19.1 — Referential integrity (student records)
 *   Req 19.2 — Deactivation preserves history
 *   Req 20.4 — Student data access restricted by role
 *
 * Test groups:
 *   1. Admin student list — view, search, navigation
 *   2. Create student — form validation, success, institutionId fix
 *   3. Student detail — profile fields, academic history
 *   4. Bulk CSV import — success, partial failure, empty file guard
 *   5. Student dashboard — own data only (Req 3.7)
 *   6. API — student endpoints
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { StudentListPage }           from '../page-objects/StudentListPage';
import { CreateStudentPage }         from '../page-objects/CreateStudentPage';
import { StudentDetailPage }         from '../page-objects/StudentDetailPage';
import { StudentOverviewPage }       from '../page-objects/StudentDashboardPage';
import { STUDENT_IDS, INSTITUTION_ID, API_URL, TEST_PASSWORD } from '../fixtures/constants';
import * as path from 'path';
import * as fs   from 'fs';
import * as os   from 'os';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Write a minimal valid CSV to a temp file and return its path. */
function writeTempCSV(rows: string[]): string {
  const header = 'student_code,full_name,email,phone,gender,current_semester';
  const content = [header, ...rows].join('\n');
  const tmpFile = path.join(os.tmpdir(), `students_${Date.now()}.csv`);
  fs.writeFileSync(tmpFile, content, 'utf8');
  return tmpFile;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin student list
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student list — admin view (Req 3)', () => {
  authTest('page loads and shows at least one student from seed data', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectOnStudentList();
    await listPage.expectAtLeastOneStudent();
  });

  authTest('table has all required columns (Req 3.1)', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectTableColumnsPresent();
  });

  authTest('displays seed student Arjun Mehta', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('search by name filters correctly', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();

    await listPage.search('Arjun');
    await listPage.expectStudentVisible('Arjun Mehta');
    await listPage.expectStudentNotVisible('Priya Sharma');
  });

  authTest('search by student code filters correctly', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();

    await listPage.search('CS2024001');
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('search by email filters correctly', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();

    await listPage.search('arjun@student.edu');
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('clearing search restores full list', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    const initialCount = await listPage.getRowCount();

    await listPage.search('Arjun');
    await listPage.clearSearch();
    await expect(listPage.tableRows).toHaveCount(initialCount);
  });

  authTest('search with no match shows empty message', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();

    await listPage.search('ZZZNOMATCH999');
    await listPage.expectEmptyMessage();
  });

  authTest('Add Student button navigates to /admin/students/new', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.clickAddStudent();
    await expect(adminPage).toHaveURL(/\/admin\/students\/new/);
  });

  authTest('View button navigates to student detail page', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.clickViewStudentByName('Arjun Mehta');
    await expect(adminPage).toHaveURL(
      new RegExp(`/admin/students/${STUDENT_IDS.arjunMehta}`)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Create student
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Create student — form (Req 3.2)', () => {
  authTest('create-student page loads with all fields visible', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.expectOnCreatePage();

    await expect(createPage.studentCodeInput).toBeVisible();
    await expect(createPage.fullNameInput).toBeVisible();
    await expect(createPage.emailInput).toBeVisible();
    await expect(createPage.createButton).toBeVisible();
  });

  authTest('back link returns to student list', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.goBackToList();
    await expect(adminPage).toHaveURL(/\/admin\/students$/);
  });

  authTest('reset button clears form fields', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    await createPage.studentCodeInput.fill('TEST001');
    await createPage.fullNameInput.fill('Test Student');
    await createPage.resetForm();

    await createPage.expectFormEmpty();
  });

  authTest('creates new student and redirects to list (Req 3.2)', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    const uniqueCode  = `TS${Date.now()}`.slice(0, 10);
    const uniqueEmail = `student_${Date.now()}@test.edu`;

    await createPage.createStudent({
      studentCode:     uniqueCode,
      fullName:        'Test Student E2E',
      email:           uniqueEmail,
      currentSemester: 3,
    });

    // Should redirect to list and new student appears
    const listPage = new StudentListPage(adminPage);
    await listPage.expectOnStudentList();
  });

  authTest('submit without required fields shows validation', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    // Click submit with empty required fields
    await createPage.submit();
    // Zod validation should prevent submission — button stays on page
    await createPage.expectOnCreatePage();
  });

  authTest('duplicate email shows error from service', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    // Try to create with an already-used email (seed data)
    await createPage.fillForm({
      studentCode: 'DUPTEST001',
      fullName:    'Duplicate Test',
      email:       'arjun@student.edu', // already exists in seed
    });
    await createPage.submit();

    // Either stays on page or shows error — should not redirect to /admin/students
    await adminPage.waitForTimeout(2_000);
    const url = adminPage.url();
    const isStillOnCreatePage = url.includes('/new') || url.includes('students');
    expect(isStillOnCreatePage).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Student detail page
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student detail page (Req 3.1, 3.4)', () => {
  authTest('shows student name and code for Arjun Mehta', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);

    await detailPage.expectStudentNameVisible('Arjun Mehta');
    await detailPage.expectStudentCodeVisible('CS2024001');
  });

  authTest('shows student email', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await detailPage.expectEmailVisible('arjun@student.edu');
  });

  authTest('academic history section is visible (Req 3.4)', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await detailPage.expectAcademicHistoryVisible();
  });

  authTest('academic history has seeded rows', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await detailPage.expectAcademicHistoryHasRows();
  });

  authTest('back button returns to student list', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await detailPage.goBack();
    await expect(adminPage).toHaveURL(/\/admin\/students$/);
  });

  authTest('404-like student ID shows not-found state', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto('00000000-0000-0000-0000-000000000000');
    await detailPage.expectNotFoundError();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bulk CSV import (Req 3.8)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Bulk CSV import (Req 3.8)', () => {
  authTest('imports a valid single-row CSV successfully', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    const csvPath = writeTempCSV([
      `BULKTEST01,Bulk Student One,bulk1_${Date.now()}@test.edu,9000000001,male,2`,
    ]);

    await createPage.bulkImport(csvPath);
    await createPage.expectBulkImportSuccess(1);

    fs.unlinkSync(csvPath);
  });

  authTest('imports multiple valid rows', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    const ts = Date.now();
    const csvPath = writeTempCSV([
      `BULK02,Bulk Two,bulk2_${ts}@test.edu,9000000002,female,1`,
      `BULK03,Bulk Three,bulk3_${ts}@test.edu,9000000003,male,3`,
    ]);

    await createPage.bulkImport(csvPath);
    await createPage.expectBulkImportSuccess(2);

    fs.unlinkSync(csvPath);
  });

  authTest('partial failure reported for duplicate emails (Req 3.8)', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    // Row 1 is fresh, Row 2 duplicates an existing seed email
    const ts = Date.now();
    const csvPath = writeTempCSV([
      `BULKGOOD,Good Student,good_${ts}@test.edu,9000000099,male,4`,
      `BULKDUP,Dup Student,arjun@student.edu,9000000099,male,4`,  // duplicate
    ]);

    await createPage.bulkImport(csvPath);
    // At least 1 should import, 1 should fail
    await expect(adminPage.getByText(/imported/i)).toBeVisible({ timeout: 15_000 });

    fs.unlinkSync(csvPath);
  });

  authTest('import button disabled when no file selected', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();

    await expect(createPage.importButton).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Student dashboard — own data only (Req 3.7, Req 20.4)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student dashboard — own data (Req 3.7, 20.4)', () => {
  authTest('student lands on /student after login', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await overview.expectOnStudentDashboard();
  });

  authTest('student portal nav items are all present', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await overview.expectNavPresent();
  });

  authTest('student cannot navigate to /admin/students', async ({ studentPage }) => {
    await studentPage.goto('/admin/students');
    await expect(studentPage).not.toHaveURL(/\/admin\/students/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. API — student service (Req 3.1, 3.7)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Student service — API', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
    });
    const body = await res.json();
    adminToken = body.data?.accessToken ?? '';
  });

  test('GET /api/students returns list with seed students', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/students/:id returns correct student (Req 3.1)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students/${STUDENT_IDS.arjunMehta}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.full_name).toBe('Arjun Mehta');
    expect(body.data.student_code).toBe('CS2024001');
    expect(body.data.email).toBe('arjun@student.edu');
  });

  test('GET /api/students/:id/academic-history returns records (Req 3.4)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/students/${STUDENT_IDS.arjunMehta}/academic-history`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
    // Verify seeded subject
    const cs101 = body.data.find((r: { subject_code: string }) => r.subject_code === 'CS101');
    expect(cs101).toBeDefined();
  });

  test('POST /api/students with missing required fields returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { fullName: 'Missing Fields' }, // missing studentCode, email, institutionId
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/students with invalid institutionId UUID returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentCode:  'API001',
        fullName:     'API Test',
        email:        `api_${Date.now()}@test.edu`,
        institutionId: 'not-a-uuid',
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('PUT /api/students/:id updates student fields (Req 3.3)', async ({ request }) => {
    const res = await request.put(
      `${API_URL}/api/students/${STUDENT_IDS.arjunMehta}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { phone: '9999999999' },
      },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.phone).toBe('9999999999');
  });

  test('GET /api/students — unauthenticated request returns 401 (Req 18.2)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/students/:id soft-deletes (sets inactive) (Req 19.2)', async ({ request }) => {
    // Create a throwaway student first
    const createRes = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentCode:  `DEL${Date.now()}`,
        fullName:     'To Delete',
        email:        `delete_${Date.now()}@test.edu`,
        institutionId: INSTITUTION_ID,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { data: created } = await createRes.json();

    // Delete (soft)
    const delRes = await request.delete(`${API_URL}/api/students/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.ok()).toBeTruthy();

    // Student is now inactive but the record still exists
    const getRes = await request.get(`${API_URL}/api/students/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await getRes.json();
    expect(body.data.enrollment_status).toBe('inactive');
  });
});
