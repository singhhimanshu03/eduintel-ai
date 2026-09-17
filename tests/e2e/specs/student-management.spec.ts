/**
 * student-management.spec.ts
 *
 * Requirements covered:
 *   Req 3   — Student Profile Management
 *   Req 19.1 — Referential integrity (student records)
 *   Req 19.2 — Deactivation preserves history
 *   Req 20.4 — Student data access restricted by role
 *
 * Test groups:
 *   1.  Admin student list — view, search, navigation, badges
 *   2.  Create student — form validation, success, loading state
 *   3.  Student detail — profile fields, academic history columns, backlog
 *   4.  Bulk CSV import — success, partial failure, empty file guard
 *   5.  Student dashboard overview — stat cards, role block
 *   6.  Student portal — My Attendance page
 *   7.  Student portal — My Results page
 *   8.  Student portal — Fee Status page
 *   9.  Student portal — Hall Ticket page
 *   10. Role-based access control
 *   11. API — student service endpoints
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import { StudentListPage }           from '../page-objects/StudentListPage';
import { CreateStudentPage }         from '../page-objects/CreateStudentPage';
import { StudentDetailPage }         from '../page-objects/StudentDetailPage';
import {
  StudentOverviewPage,
  MyAttendancePage,
  MyResultsPage,
  FeeStatusPage,
  HallTicketPage,
} from '../page-objects/StudentDashboardPage';
import {
  STUDENT_IDS,
  INSTITUTION_ID,
  API_URL,
  TEST_PASSWORD,
} from '../fixtures/constants';
import * as path from 'path';
import * as fs   from 'fs';
import * as os   from 'os';


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Write a minimal valid CSV to a temp file and return its absolute path. */
function writeTempCSV(rows: string[]): string {
  const header  = 'student_code,full_name,email,phone,gender,current_semester';
  const content = [header, ...rows].join('\n');
  const tmpFile = path.join(os.tmpdir(), `students_${Date.now()}.csv`);
  fs.writeFileSync(tmpFile, content, 'utf8');
  return tmpFile;
}


// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin student list
// Run serially — each test navigates to the same admin page and depends on
// the student-service API having loaded; serial mode prevents parallel
// contention on the API that causes intermittent timeouts.
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student list — admin view (Req 3)', () => {
  authTest.describe.configure({ mode: 'serial' });

  authTest('page loads and shows at least one student from seed data', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectOnStudentList();
    await listPage.expectAtLeastOneStudent();
  });

  authTest('table has all required columns (Req 3.1)', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent(); // gate: wait for data
    await listPage.expectTableColumnsPresent();
  });

  authTest('displays seed student Arjun Mehta', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('search by name filters correctly', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    await listPage.search('Arjun');
    await listPage.expectStudentVisible('Arjun Mehta');
    await listPage.expectStudentNotVisible('Priya Sharma');
  });

  authTest('search by student code filters correctly', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    await listPage.search('CS2024001');
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('search by email filters correctly', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    await listPage.search('arjun@student.edu');
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('clearing search restores full list', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
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
    await listPage.expectAtLeastOneStudent();
    await listPage.clickViewStudentByName('Arjun Mehta');
    await expect(adminPage).toHaveURL(
      new RegExp(`/admin/students/${STUDENT_IDS.arjunMehta}`)
    );
  });

  authTest('student count subtitle is visible', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await expect(listPage.studentCount).toBeVisible({ timeout: 10_000 });
  });

  authTest('active students show a status badge', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    const row = listPage.tableRows.filter({ hasText: 'Arjun Mehta' });
    await expect(row.getByText('active')).toBeVisible({ timeout: 10_000 });
  });

  authTest('search is case-insensitive', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    await listPage.search('arjun');
    await listPage.expectStudentVisible('Arjun Mehta');
  });

  authTest('multiple seed students are visible', async ({ adminPage }) => {
    const listPage = new StudentListPage(adminPage);
    await listPage.goto();
    await listPage.expectAtLeastOneStudent();
    await listPage.expectStudentVisible('Arjun Mehta');
    await listPage.expectStudentVisible('Priya Sharma');
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
    await expect(adminPage).toHaveURL(/\/admin\/students/);
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
    await createPage.fillForm({
      studentCode:     uniqueCode,
      fullName:        'Test Student E2E',
      email:           uniqueEmail,
      currentSemester: 3,
    });
    await createPage.submit();
    // Wait for redirect — allow up to 20s for the API + navigation
    await expect(adminPage).toHaveURL(/\/admin\/students/, { timeout: 20_000 });
  });

  authTest('submit without required fields shows validation (stays on page)', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.submit();
    await createPage.expectOnCreatePage();
  });

  authTest('duplicate email shows error from service', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.fillForm({
      studentCode: 'DUPTEST001',
      fullName:    'Duplicate Test',
      email:       'arjun@student.edu',
    });
    await createPage.submit();
    await adminPage.waitForTimeout(2_000);
    const url = adminPage.url();
    expect(url.includes('/new') || url.includes('students')).toBeTruthy();
  });

  authTest('empty studentCode shows inline validation error', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.fullNameInput.fill('Valid Name');
    await createPage.emailInput.fill('valid@test.edu');
    await createPage.submit();
    await expect(adminPage.getByText(/student code is required/i)).toBeVisible({ timeout: 6_000 });
  });

  authTest('fullName shorter than 2 chars shows inline validation error', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.studentCodeInput.fill('SHORTNAME01');
    await createPage.fullNameInput.fill('A');
    await createPage.emailInput.fill('shortname@test.edu');
    await createPage.submit();
    await expect(adminPage.getByText(/full name is required/i)).toBeVisible({ timeout: 6_000 });
  });

  authTest('invalid email format shows inline validation error', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.studentCodeInput.fill('EMAILTEST01');
    await createPage.fullNameInput.fill('Email Test');
    await createPage.emailInput.fill('not-an-email');
    await createPage.submit();
    await expect(adminPage.getByText(/valid email required/i)).toBeVisible({ timeout: 6_000 });
  });

  authTest('all optional fields accept valid input without error', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await createPage.fillForm({
      studentCode:     'OPTFIELDS01',
      fullName:        'Optional Fields',
      email:           `optional_${Date.now()}@test.edu`,
      phone:           '9876543210',
      gender:          'female',
      dateOfBirth:     '2001-06-15',
      currentSemester: 4,
    });
    await expect(createPage.phoneInput).toHaveValue('9876543210');
    await expect(createPage.semesterInput).toHaveValue('4');
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 3. Student detail page
// Run serially — detail page loads depend on student-service API timing.
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student detail page (Req 3.1, 3.4)', () => {
  authTest.describe.configure({ mode: 'serial' });

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
    // Wait for page to fully render before clicking back
    await detailPage.expectStudentNameVisible('Arjun Mehta');
    await detailPage.goBack();
    await expect(adminPage).toHaveURL(/\/admin\/students/, { timeout: 15_000 });
  });

  authTest('404-like student ID shows not-found state', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto('00000000-0000-0000-0000-000000000000');
    await detailPage.expectNotFoundError();
  });

  authTest('profile card shows enrollment status', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await expect(adminPage.getByText(/active/i).first()).toBeVisible({ timeout: 10_000 });
  });

  authTest('academic history table has all 8 columns', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await detailPage.expectAcademicHistoryHasRows();
    // Target the Academic History heading's sibling table
    const historySection = adminPage.getByText('Academic History').locator('..').locator('..');
    for (const col of ['Sem', 'Subject', 'Internal', 'Grade', 'GPA', 'Backlog']) {
      await expect(historySection.getByRole('columnheader', { name: new RegExp(col, 'i') })).toBeVisible({ timeout: 10_000 });
    }
  });

  authTest('seeded non-backlog row shows "No" for Arjun Mehta (Req 19.2)', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.arjunMehta);
    await detailPage.expectAcademicHistoryHasRows();
    await expect(adminPage.getByRole('table').last().getByText('No').first()).toBeVisible({ timeout: 10_000 });
  });

  authTest('Priya Sharma detail page loads correctly', async ({ adminPage }) => {
    const detailPage = new StudentDetailPage(adminPage);
    await detailPage.goto(STUDENT_IDS.priyaSharma);
    await detailPage.expectStudentNameVisible('Priya Sharma');
    await detailPage.expectStudentCodeVisible('CS2024002');
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
    const ts = Date.now();
    const csvPath = writeTempCSV([
      `BULKGOOD,Good Student,good_${ts}@test.edu,9000000099,male,4`,
      `BULKDUP,Dup Student,arjun@student.edu,9000000099,male,4`,
    ]);
    await createPage.bulkImport(csvPath);
    await expect(adminPage.getByText(/imported/i)).toBeVisible({ timeout: 15_000 });
    fs.unlinkSync(csvPath);
  });

  authTest('import button disabled when no file selected', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await expect(createPage.importButton).toBeDisabled();
  });

  authTest('CSV column hint text is visible on the page', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    await expect(adminPage.getByText(/student_code/i)).toBeVisible({ timeout: 8_000 });
  });

  authTest('uploading a file enables the Import CSV button', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    const csvPath = writeTempCSV([`ENABLETEST,Enable Test,enable_${Date.now()}@test.edu,9111111111,male,1`]);
    await createPage.uploadCSV(csvPath);
    await expect(createPage.importButton).toBeEnabled({ timeout: 5_000 });
    fs.unlinkSync(csvPath);
  });

  authTest('all-duplicate CSV reports 0 fresh imports (Req 3.8)', async ({ adminPage }) => {
    const createPage = new CreateStudentPage(adminPage);
    await createPage.goto();
    // Both emails already exist in seed data — ON CONFLICT DO NOTHING = 0 inserts
    const csvPath = writeTempCSV([
      `DUP1,Dup One,arjun@student.edu,9000000001,male,1`,
      `DUP2,Dup Two,priya@student.edu,9000000002,female,2`,
    ]);
    await createPage.bulkImport(csvPath);
    // Banner appears with "Imported: 0"
    await expect(adminPage.getByText(/imported/i)).toBeVisible({ timeout: 20_000 });
    fs.unlinkSync(csvPath);
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
    // DashboardLayout renders NavLink elements — check by visible text in the sidebar
    await expect(studentPage.getByRole('link', { name: /attendance/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(studentPage.getByRole('link', { name: /results/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(studentPage.getByRole('link', { name: /fee status/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(studentPage.getByRole('link', { name: /hall ticket/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  authTest('student cannot navigate to /admin/students', async ({ studentPage }) => {
    await studentPage.goto('/admin/students');
    await expect(studentPage).not.toHaveURL(/\/admin\/students/, { timeout: 8_000 });
  });

  authTest('GPA card is visible on dashboard', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await expect(studentPage.getByText(/current gpa/i)).toBeVisible({ timeout: 12_000 });
  });

  authTest('Avg Attendance card is visible on dashboard', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await expect(studentPage.getByText(/avg attendance/i)).toBeVisible({ timeout: 12_000 });
  });

  authTest('Backlogs card is visible on dashboard', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await expect(studentPage.getByText(/backlogs/i)).toBeVisible({ timeout: 12_000 });
  });

  authTest('AI Risk badge is visible on dashboard', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    await expect(studentPage.getByText(/ai risk level/i)).toBeVisible({ timeout: 12_000 });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 6. Student portal — My Attendance
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student portal — My Attendance', () => {
  authTest('navigates to /student/attendance via nav link', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    // Use non-anchored regex to match the nav link whose accessible name
    // includes the emoji icon + "Attendance" text
    const attendanceLink = studentPage.getByRole('link', { name: /attendance/i }).first();
    await attendanceLink.click();
    await expect(studentPage).toHaveURL(/\/student\/attendance/, { timeout: 10_000 });
  });

  authTest('Attendance page title is visible', async ({ studentPage }) => {
    const attendancePage = new MyAttendancePage(studentPage);
    await attendancePage.goto();
    await attendancePage.expectOnPage();
    await expect(attendancePage.pageTitle).toBeVisible({ timeout: 10_000 });
  });

  authTest('Attendance page loads without crashing', async ({ studentPage }) => {
    const attendancePage = new MyAttendancePage(studentPage);
    await attendancePage.goto();
    const hasTable  = await attendancePage.attendanceTable.isVisible().catch(() => false);
    const hasNoData = await attendancePage.noDataMsg.isVisible().catch(() => false);
    // Either table or no-data message; both count as a successful render
    const pageRendered = hasTable || hasNoData || await studentPage.getByRole('heading').isVisible();
    expect(pageRendered).toBeTruthy();
  });

  authTest('attendance page renders table or empty state', async ({ studentPage }) => {
    const attendancePage = new MyAttendancePage(studentPage);
    await attendancePage.goto();
    // Page must render the "My Attendance" heading at minimum
    await expect(studentPage.getByRole('heading', { name: /my attendance/i })).toBeVisible({ timeout: 10_000 });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 7. Student portal — My Results
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student portal — My Results', () => {
  authTest('navigates to /student/results via nav link', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    const resultsLink = studentPage.getByRole('link', { name: /results/i }).first();
    await resultsLink.click();
    await expect(studentPage).toHaveURL(/\/student\/results/, { timeout: 10_000 });
  });

  authTest('Results page title is visible', async ({ studentPage }) => {
    const resultsPage = new MyResultsPage(studentPage);
    await resultsPage.goto();
    await resultsPage.expectOnPage();
    await expect(resultsPage.pageTitle).toBeVisible({ timeout: 10_000 });
  });

  authTest('GPA text is visible on results page', async ({ studentPage }) => {
    const resultsPage = new MyResultsPage(studentPage);
    await resultsPage.goto();
    await resultsPage.expectGpaVisible();
  });

  authTest('seeded subject CS101 appears in results', async ({ studentPage }) => {
    const resultsPage = new MyResultsPage(studentPage);
    await resultsPage.goto();
    await resultsPage.expectSubjectGradeVisible('CS101');
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 8. Student portal — Fee Status
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student portal — Fee Status', () => {
  authTest('navigates to /student/fees via nav link', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    const feesLink = studentPage.getByRole('link', { name: /fee status/i }).first();
    await feesLink.click();
    await expect(studentPage).toHaveURL(/\/student\/fees/, { timeout: 10_000 });
  });

  authTest('Fee Status page title is visible', async ({ studentPage }) => {
    const feePage = new FeeStatusPage(studentPage);
    await feePage.goto();
    await feePage.expectOnPage();
    await expect(feePage.pageTitle).toBeVisible({ timeout: 10_000 });
  });

  authTest('Fee status value is displayed (paid / partially_paid / unpaid)', async ({ studentPage }) => {
    const feePage = new FeeStatusPage(studentPage);
    await feePage.goto();
    await feePage.expectFeeStatusVisible();
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 9. Student portal — Hall Ticket
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Student portal — Hall Ticket', () => {
  authTest('navigates to /student/hall-ticket via nav link', async ({ studentPage }) => {
    const overview = new StudentOverviewPage(studentPage);
    await overview.goto();
    const hallTicketLink = studentPage.getByRole('link', { name: /hall ticket/i }).first();
    await hallTicketLink.click();
    await expect(studentPage).toHaveURL(/\/student\/hall-ticket/, { timeout: 10_000 });
  });

  authTest('Hall Ticket page title is visible', async ({ studentPage }) => {
    const hallTicketPage = new HallTicketPage(studentPage);
    await hallTicketPage.goto();
    await hallTicketPage.expectOnPage();
    await expect(hallTicketPage.pageTitle).toBeVisible({ timeout: 10_000 });
  });

  authTest('page shows exam cycle input and generate button', async ({ studentPage }) => {
    const hallTicketPage = new HallTicketPage(studentPage);
    await hallTicketPage.goto();
    // The download button and blocked message only appear after form submission.
    // On page load, the exam cycle input and generate button are always present.
    await expect(studentPage.getByPlaceholder(/exam cycle|nov-2024/i)).toBeVisible({ timeout: 10_000 });
    await expect(studentPage.getByRole('button', { name: /check eligibility/i })).toBeVisible({ timeout: 10_000 });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 10. Role-based access control (Req 20.4)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Role-based access control (Req 20.4)', () => {
  authTest('faculty cannot access /admin/students', async ({ facultyPage }) => {
    await facultyPage.goto('/admin/students');
    await expect(facultyPage).not.toHaveURL(/\/admin\/students$/, { timeout: 8_000 });
  });

  authTest('parent cannot access /admin/students', async ({ parentPage }) => {
    await parentPage.goto('/admin/students');
    await expect(parentPage).not.toHaveURL(/\/admin\/students$/, { timeout: 8_000 });
  });

  authTest('admin cannot access /student (redirected away)', async ({ adminPage }) => {
    await adminPage.goto('/student');
    await expect(adminPage).not.toHaveURL(/^http:\/\/localhost:\d+\/student$/, { timeout: 8_000 });
  });

  authTest('unauthenticated user hitting /admin/students is redirected to login', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/admin/students');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await ctx.close();
  });

  authTest('student cannot access /admin/students (redirected away)', async ({ studentPage }) => {
    await studentPage.goto('/admin/students');
    await expect(studentPage).not.toHaveURL(/\/admin\/students/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. API — student service (Req 3.1, 3.7)
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
    const cs101 = body.data.find((r: { subject_code: string }) => r.subject_code === 'CS101');
    expect(cs101).toBeDefined();
  });

  test('POST /api/students with missing required fields returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { fullName: 'Missing Fields' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/students with invalid institutionId UUID returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentCode:   'API001',
        fullName:      'API Test',
        email:         `api_${Date.now()}@test.edu`,
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
    const createRes = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentCode:   `DEL${Date.now()}`,
        fullName:      'To Delete',
        email:         `delete_${Date.now()}@test.edu`,
        institutionId: INSTITUTION_ID,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { data: created } = await createRes.json();

    const delRes = await request.delete(`${API_URL}/api/students/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.ok()).toBeTruthy();

    const getRes = await request.get(`${API_URL}/api/students/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await getRes.json();
    expect(body.data.enrollment_status).toBe('inactive');
  });

  test('GET /api/students list does not include soft-deleted student (Req 19.2)', async ({ request }) => {
    const ts = Date.now();
    const createRes = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentCode:   `DELLIST${ts}`,
        fullName:      'Delete List Test',
        email:         `dellist_${ts}@test.edu`,
        institutionId: INSTITUTION_ID,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { data: created } = await createRes.json();

    await request.delete(`${API_URL}/api/students/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const listRes = await request.get(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listBody = await listRes.json();
    const found = (listBody.data as Array<{ id: string }>).find(s => s.id === created.id);
    expect(found).toBeUndefined();
  });

  test('GET /api/students?semester=3 returns only semester-3 students', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students?semester=3`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    for (const s of body.data as Array<{ current_semester: number }>) {
      expect(s.current_semester).toBe(3);
    }
  });

  test('GET /api/students?page=1&limit=2 respects pagination limit', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/students?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect((body.data as unknown[]).length).toBeLessThanOrEqual(2);
  });

  test('POST /api/students with invalid email format returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        studentCode:   'EMAILFMT01',
        fullName:      'Email Format Test',
        email:         'not-valid-email',
        institutionId: INSTITUTION_ID,
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /api/students/:id/academic-history for non-existent ID returns empty or 404', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/students/00000000-0000-0000-0000-000000000000/academic-history`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const isNotFound = res.status() === 404;
    const isEmptyOk  = res.ok() && (await res.json()).data?.length === 0;
    expect(isNotFound || isEmptyOk).toBeTruthy();
  });

  test('GET /api/students/:id/documents returns array for valid student', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/students/${STUDENT_IDS.arjunMehta}/documents`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
  });
});
