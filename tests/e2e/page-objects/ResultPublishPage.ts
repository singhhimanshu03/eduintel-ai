/**
 * ResultPublishPage.ts
 *
 * Page Object for /exam/results (ResultPublish.tsx)
 * Covers marks entry form, the publish results action, and the marks table.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ResultPublishPage {
  readonly page: Page;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly pageTitle: Locator;

  // ── Marks entry form ──────────────────────────────────────────────────────
  readonly studentIdInput:     Locator;
  readonly subjectCodeInput:   Locator;
  readonly semesterInput:      Locator;
  readonly academicYearInput:  Locator;
  readonly internalMarksInput: Locator;
  readonly semesterMarksInput: Locator;
  readonly saveMarksBtn:       Locator;
  readonly marksSuccessMsg:    Locator;
  readonly marksErrorMsg:      Locator;

  // ── Publish results form ──────────────────────────────────────────────────
  readonly publishSemesterInput:     Locator;
  readonly publishAcademicYearInput: Locator;
  readonly publishBtn:               Locator;
  readonly publishSuccessMsg:        Locator;
  readonly publishErrorMsg:          Locator;

  // ── Results table (existing marks) ───────────────────────────────────────
  readonly marksTable:    Locator;
  readonly marksRows:     Locator;

  // ── Loading ───────────────────────────────────────────────────────────────
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /publish results|result|marks/i }).first();

    // Marks entry — use label-based selectors where possible
    this.studentIdInput     = page.getByLabel(/student id/i).or(page.getByPlaceholder(/student.*id|uuid/i).first());
    this.subjectCodeInput   = page.getByLabel(/subject code/i).or(page.getByPlaceholder(/CS\d+|subject code/i).first());
    this.semesterInput      = page.getByLabel(/^semester$/i).or(page.locator('input[type="number"]').first());
    this.academicYearInput  = page.getByLabel(/academic year/i).or(page.getByPlaceholder(/2024-25/));
    this.internalMarksInput = page.getByLabel(/internal marks/i).or(page.getByPlaceholder(/internal/i));
    this.semesterMarksInput = page.getByLabel(/semester marks/i).or(page.getByPlaceholder(/semester marks/i));
    this.saveMarksBtn       = page.getByRole('button', { name: /save marks|submit marks/i });
    this.marksSuccessMsg    = page.getByText(/marks saved|submitted successfully/i);
    this.marksErrorMsg      = page.getByText(/marks.*failed|exceed.*bound/i);

    // Publish form
    this.publishSemesterInput     = page.getByLabel(/semester.*publish|publish.*semester/i).or(
      page.locator('input[type="number"]').nth(1)
    );
    this.publishAcademicYearInput = page.getByLabel(/academic year.*publish|publish.*academic/i).or(
      page.getByPlaceholder(/2024-25/).last()
    );
    this.publishBtn        = page.getByRole('button', { name: /publish results/i });
    this.publishSuccessMsg = page.getByText(/results published/i);
    this.publishErrorMsg   = page.getByText(/publish.*failed/i);

    this.marksTable = page.getByRole('table');
    this.marksRows  = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });

    this.spinner = page.getByText(/loading/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/exam/results');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  // ── Actions ───────────────────────────────────────────────────────────────

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
    await this.saveMarksBtn.click();
  }

  async publishResults(semester: number, academicYear: string): Promise<void> {
    await this.publishSemesterInput.fill(String(semester));
    await this.publishAcademicYearInput.fill(academicYear);
    await this.publishBtn.click();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/exam\/results/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectMarksSaved(): Promise<void> {
    await expect(this.marksSuccessMsg).toBeVisible({ timeout: 10_000 });
  }

  async expectMarksError(partialText?: string): Promise<void> {
    await expect(this.marksErrorMsg).toBeVisible({ timeout: 8_000 });
    if (partialText) await expect(this.marksErrorMsg).toContainText(partialText);
  }

  async expectResultsPublished(): Promise<void> {
    await expect(this.publishSuccessMsg).toBeVisible({ timeout: 10_000 });
  }

  async expectPublishError(): Promise<void> {
    await expect(this.publishErrorMsg).toBeVisible({ timeout: 8_000 });
  }

  async expectMarksTableVisible(): Promise<void> {
    await expect(this.marksTable).toBeVisible({ timeout: 8_000 });
  }

  async expectMarksRowCount(count: number): Promise<void> {
    await expect(this.marksRows).toHaveCount(count, { timeout: 8_000 });
  }

  async expectStudentMarksVisible(studentId: string): Promise<void> {
    await expect(this.marksRows.filter({ hasText: studentId })).toBeVisible({ timeout: 8_000 });
  }
}
