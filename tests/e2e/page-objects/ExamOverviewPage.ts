/**
 * ExamOverviewPage.ts
 *
 * Page Object for /exam (ExamOverview.tsx)
 * Covers exam schedule creation, the schedule table, and the publish action.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export interface ScheduleFormData {
  subjectCode:     string;
  examDate:        string; // YYYY-MM-DD
  startTime:       string; // HH:MM
  venue:           string;
  durationMinutes?: number;
  semester:        number;
}

export class ExamOverviewPage {
  readonly page: Page;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly pageTitle:      Locator;
  readonly scheduleCount:  Locator;   // "X published · Y draft"

  // ── Create form ───────────────────────────────────────────────────────────
  readonly subjectCodeInput:    Locator;
  readonly examDateInput:       Locator;
  readonly startTimeInput:      Locator;
  readonly venueInput:          Locator;
  readonly durationInput:       Locator;
  readonly semesterInput:       Locator;
  readonly createScheduleBtn:   Locator;

  // ── Schedule table ────────────────────────────────────────────────────────
  readonly table:        Locator;
  readonly tableRows:    Locator;
  readonly emptyMsg:     Locator;

  // ── Toast notification ────────────────────────────────────────────────────
  readonly toastSuccess: Locator;
  readonly toastError:   Locator;

  // ── Loading / nav ─────────────────────────────────────────────────────────
  readonly spinner:          Locator;
  readonly navHallTickets:   Locator;
  readonly navPublishResults: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle     = page.getByRole('heading', { name: /exam schedules/i });
    this.scheduleCount = page.getByText(/published.*draft|draft.*published/i);

    // Create form — identified by placeholders from ExamOverview.tsx
    this.subjectCodeInput  = page.getByPlaceholder('CS301');
    this.examDateInput     = page.locator('input[type="date"]').first();
    this.startTimeInput    = page.locator('input[type="time"]').first();
    this.venueInput        = page.getByPlaceholder('Hall A');
    this.durationInput     = page.locator('input[type="number"]').first();
    this.semesterInput     = page.locator('input[type="number"]').last();
    this.createScheduleBtn = page.getByRole('button', { name: /create schedule/i });

    this.table     = page.getByRole('table');
    this.tableRows = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.emptyMsg = page.getByText(/no exam schedules yet/i);

    this.toastSuccess = page.getByText(/schedule created successfully|published successfully/i);
    this.toastError   = page.getByText(/failed to create schedule|failed to publish/i);

    this.spinner           = page.getByText(/loading/i);
    this.navHallTickets    = page.getByRole('link', { name: /hall tickets/i });
    this.navPublishResults = page.getByRole('link', { name: /publish results/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/exam');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async goToHallTickets(): Promise<void> {
    await this.navHallTickets.click();
    await this.page.waitForURL(/\/exam\/hall-tickets/);
  }

  async goToPublishResults(): Promise<void> {
    await this.navPublishResults.click();
    await this.page.waitForURL(/\/exam\/results/);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillScheduleForm(data: ScheduleFormData): Promise<void> {
    await this.subjectCodeInput.fill(data.subjectCode);
    await this.examDateInput.fill(data.examDate);
    await this.startTimeInput.fill(data.startTime);
    await this.venueInput.fill(data.venue);
    if (data.durationMinutes !== undefined) {
      await this.durationInput.fill(String(data.durationMinutes));
    }
    await this.semesterInput.fill(String(data.semester));
  }

  async createSchedule(data: ScheduleFormData): Promise<void> {
    await this.fillScheduleForm(data);
    await this.createScheduleBtn.click();
    await this.toastSuccess.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Click the Publish button for a specific row identified by subject code. */
  async publishSchedule(subjectCode: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: subjectCode });
    const publishBtn = row.getByRole('button', { name: /publish/i });
    await publishBtn.click();
    await this.toastSuccess.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Click Publish on the first draft row. */
  async publishFirstDraft(): Promise<void> {
    const draftRow = this.tableRows.filter({ hasText: /○ draft/i }).first();
    await draftRow.getByRole('button', { name: /publish/i }).click();
    await this.toastSuccess.waitFor({ state: 'visible', timeout: 10_000 });
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnExamOverview(): Promise<void> {
    await expect(this.page).toHaveURL(/\/exam$/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectScheduleVisible(subjectCode: string): Promise<void> {
    await expect(this.tableRows.filter({ hasText: subjectCode })).toBeVisible({ timeout: 10_000 });
  }

  async expectSchedulePublished(subjectCode: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: subjectCode });
    await expect(row.getByText(/✓ published/i)).toBeVisible({ timeout: 10_000 });
  }

  async expectScheduleIsDraft(subjectCode: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: subjectCode });
    await expect(row.getByText(/○ draft/i)).toBeVisible({ timeout: 8_000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyMsg).toBeVisible();
  }

  async expectToastSuccess(): Promise<void> {
    await expect(this.toastSuccess).toBeVisible({ timeout: 10_000 });
  }

  async expectToastError(): Promise<void> {
    await expect(this.toastError).toBeVisible({ timeout: 10_000 });
  }

  async getScheduleCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async expectTableColumnsPresent(): Promise<void> {
    const headers = this.table.getByRole('columnheader');
    await expect(headers.filter({ hasText: /subject/i })).toBeVisible();
    await expect(headers.filter({ hasText: /date/i })).toBeVisible();
    await expect(headers.filter({ hasText: /venue/i })).toBeVisible();
    await expect(headers.filter({ hasText: /status/i })).toBeVisible();
    await expect(headers.filter({ hasText: /action/i })).toBeVisible();
  }

  async expectNavPresent(): Promise<void> {
    await expect(this.navHallTickets).toBeVisible();
    await expect(this.navPublishResults).toBeVisible();
  }
}
