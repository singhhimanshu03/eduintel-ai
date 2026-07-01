/**
 * FacultyDashboardPage.ts
 *
 * Page Objects for the faculty role dashboard and its sub-pages:
 *   /faculty             → FacultyOverview
 *   /faculty/attendance  → MarkAttendance
 *   /faculty/marks       → MarksEntry
 */

import { type Page, type Locator, expect } from '@playwright/test';

// ── FacultyOverviewPage ───────────────────────────────────────────────────────

export class FacultyOverviewPage {
  readonly page: Page;

  readonly pageTitle:          Locator;
  readonly classAttendanceCard: Locator;
  readonly flaggedStudentsSection: Locator;
  readonly flaggedStudentRows: Locator;
  readonly spinner:            Locator;

  // Nav
  readonly navAttendance: Locator;
  readonly navMarks:      Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle              = page.getByRole('heading', { name: /faculty dashboard|overview/i }).first();
    this.classAttendanceCard    = page.getByText(/class attendance|attendance summary/i).first();
    this.flaggedStudentsSection = page.getByText(/flagged students|at.risk/i).first();
    this.flaggedStudentRows     = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /risk|flagged/i });
    this.spinner                = page.getByText(/loading/i);

    this.navAttendance = page.getByRole('link', { name: /mark attendance/i });
    this.navMarks      = page.getByRole('link', { name: /marks entry/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/faculty');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async goToMarkAttendance(): Promise<void> {
    await this.navAttendance.click();
    await this.page.waitForURL(/\/faculty\/attendance/);
  }

  async goToMarksEntry(): Promise<void> {
    await this.navMarks.click();
    await this.page.waitForURL(/\/faculty\/marks/);
  }

  async expectOnFacultyDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/faculty$/);
    await this.spinner.waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
  }

  async expectNavPresent(): Promise<void> {
    await expect(this.navAttendance).toBeVisible();
    await expect(this.navMarks).toBeVisible();
  }
}

// ── MarkAttendancePage ────────────────────────────────────────────────────────

export class MarkAttendancePage {
  readonly page: Page;

  readonly pageTitle:       Locator;

  // Session creation form
  readonly subjectCodeInput: Locator;
  readonly semesterInput:    Locator;
  readonly timeslotInput:    Locator;
  readonly createSessionBtn: Locator;
  readonly sessionCreatedMsg: Locator;

  // Attendance marking
  readonly studentRows:     Locator;
  readonly submitBtn:       Locator;
  readonly successMsg:      Locator;
  readonly errorMsg:        Locator;
  readonly spinner:         Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /mark attendance|attendance/i });

    this.subjectCodeInput = page.getByPlaceholder(/subject code|CS\d+/i);
    this.semesterInput    = page.getByPlaceholder(/semester/i).or(
      page.locator('input[type="number"]').first()
    );
    this.timeslotInput    = page.getByPlaceholder(/time slot|09:00/i);
    this.createSessionBtn = page.getByRole('button', { name: /create session/i });
    this.sessionCreatedMsg = page.getByText(/session created|class created/i);

    this.studentRows  = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.submitBtn    = page.getByRole('button', { name: /submit attendance|save/i });
    this.successMsg   = page.getByText(/attendance saved|submitted/i);
    this.errorMsg     = page.getByText(/failed|error/i).first();
    this.spinner      = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/faculty/attendance');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/faculty\/attendance/);
  }

  async markAllPresent(): Promise<void> {
    const presentBtns = this.page.getByRole('button', { name: /present/i });
    const count = await presentBtns.count();
    for (let i = 0; i < count; i++) {
      await presentBtns.nth(i).click();
    }
  }

  async markAllAbsent(): Promise<void> {
    const absentBtns = this.page.getByRole('button', { name: /absent/i });
    const count = await absentBtns.count();
    for (let i = 0; i < count; i++) {
      await absentBtns.nth(i).click();
    }
  }

  async submitAttendance(): Promise<void> {
    await this.submitBtn.click();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMsg).toBeVisible({ timeout: 8_000 });
  }
}

// ── MarksEntryPage ────────────────────────────────────────────────────────────

export class MarksEntryPage {
  readonly page: Page;

  readonly pageTitle:       Locator;

  // Form fields
  readonly studentIdInput:    Locator;
  readonly subjectCodeInput:  Locator;
  readonly semesterInput:     Locator;
  readonly academicYearInput: Locator;
  readonly internalMarksInput: Locator;
  readonly semesterMarksInput: Locator;
  readonly submitBtn:         Locator;
  readonly successMsg:        Locator;
  readonly errorMsg:          Locator;
  readonly spinner:           Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /marks entry|enter marks/i });

    this.studentIdInput     = page.getByLabel(/student id/i).or(page.getByPlaceholder(/student id|uuid/i).first());
    this.subjectCodeInput   = page.getByLabel(/subject code/i).or(page.getByPlaceholder(/CS\d+|subject code/i));
    this.semesterInput      = page.getByLabel(/semester/i).or(page.locator('input[type="number"]').first());
    this.academicYearInput  = page.getByLabel(/academic year/i).or(page.getByPlaceholder(/2024-25/));
    this.internalMarksInput = page.getByLabel(/internal marks/i).or(page.getByPlaceholder(/internal/i));
    this.semesterMarksInput = page.getByLabel(/semester marks/i).or(page.getByPlaceholder(/semester marks/i));
    this.submitBtn          = page.getByRole('button', { name: /submit marks|save marks/i });
    this.successMsg         = page.getByText(/marks saved|submitted|success/i);
    this.errorMsg           = page.getByText(/failed|error|exceed/i).first();
    this.spinner            = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/faculty/marks');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/faculty\/marks/);
  }

  async enterMarks(data: {
    studentId:    string;
    subjectCode:  string;
    semester:     number;
    academicYear: string;
    internal:     number;
    semMarks:     number;
  }): Promise<void> {
    await this.studentIdInput.fill(data.studentId);
    await this.subjectCodeInput.fill(data.subjectCode);
    await this.semesterInput.fill(String(data.semester));
    await this.academicYearInput.fill(data.academicYear);
    await this.internalMarksInput.fill(String(data.internal));
    await this.semesterMarksInput.fill(String(data.semMarks));
  }

  async submit(): Promise<void> {
    await this.submitBtn.click();
  }

  async expectSuccess(): Promise<void> {
    await expect(this.successMsg).toBeVisible({ timeout: 8_000 });
  }

  async expectError(partialText?: string): Promise<void> {
    await expect(this.errorMsg).toBeVisible({ timeout: 8_000 });
    if (partialText) await expect(this.errorMsg).toContainText(partialText);
  }
}
