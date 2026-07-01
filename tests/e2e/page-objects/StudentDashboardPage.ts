/**
 * StudentDashboardPage.ts
 *
 * Page Objects for the student role dashboard and all its sub-pages:
 *   /student             → StudentOverview
 *   /student/attendance  → MyAttendance
 *   /student/results     → MyResults
 *   /student/fees        → FeeStatus
 *   /student/hall-ticket → HallTicket
 *   /student/notifications → MyNotifications
 */

import { type Page, type Locator, expect } from '@playwright/test';

// ── StudentOverviewPage ───────────────────────────────────────────────────────

export class StudentOverviewPage {
  readonly page: Page;

  readonly pageTitle:          Locator;
  readonly attendanceCard:     Locator;
  readonly resultsCard:        Locator;
  readonly eligibilitySection: Locator;
  readonly recommendationsSection: Locator;
  readonly spinner:            Locator;

  // Nav
  readonly navAttendance:    Locator;
  readonly navResults:       Locator;
  readonly navFees:          Locator;
  readonly navHallTicket:    Locator;
  readonly navNotifications: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle           = page.getByRole('heading', { name: /student portal|overview/i }).first();
    this.attendanceCard      = page.getByText(/attendance/i).first();
    this.resultsCard         = page.getByText(/results|performance/i).first();
    this.eligibilitySection  = page.getByText(/eligibility/i).first();
    this.recommendationsSection = page.getByText(/recommendation/i).first();
    this.spinner             = page.getByText(/loading/i);

    this.navAttendance    = page.getByRole('link', { name: /^attendance$/i });
    this.navResults       = page.getByRole('link', { name: /^results$/i });
    this.navFees          = page.getByRole('link', { name: /fee status/i });
    this.navHallTicket    = page.getByRole('link', { name: /hall ticket/i });
    this.navNotifications = page.getByRole('link', { name: /notifications/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/student');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async goToAttendance(): Promise<void> {
    await this.navAttendance.click();
    await this.page.waitForURL(/\/student\/attendance/);
  }

  async goToResults(): Promise<void> {
    await this.navResults.click();
    await this.page.waitForURL(/\/student\/results/);
  }

  async goToFees(): Promise<void> {
    await this.navFees.click();
    await this.page.waitForURL(/\/student\/fees/);
  }

  async goToHallTicket(): Promise<void> {
    await this.navHallTicket.click();
    await this.page.waitForURL(/\/student\/hall-ticket/);
  }

  async expectOnStudentDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/student$/);
    await this.spinner.waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
  }

  async expectNavPresent(): Promise<void> {
    for (const nav of [this.navAttendance, this.navResults, this.navFees, this.navHallTicket]) {
      await expect(nav).toBeVisible();
    }
  }
}

// ── MyAttendancePage ──────────────────────────────────────────────────────────

export class MyAttendancePage {
  readonly page: Page;

  readonly pageTitle:       Locator;
  readonly attendanceTable: Locator;
  readonly attendanceRows:  Locator;
  readonly noDataMsg:       Locator;
  readonly downloadBtn:     Locator;
  readonly spinner:         Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle       = page.getByRole('heading', { name: /attendance/i });
    this.attendanceTable = page.getByRole('table');
    this.attendanceRows  = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.noDataMsg   = page.getByText(/no attendance|no data/i);
    this.downloadBtn = page.getByRole('button', { name: /download|export/i });
    this.spinner     = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/student/attendance');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/student\/attendance/);
  }

  async expectSubjectVisible(subjectCode: string): Promise<void> {
    await expect(this.attendanceRows.filter({ hasText: subjectCode })).toBeVisible({ timeout: 8_000 });
  }

  async expectAttendancePercentageVisible(): Promise<void> {
    await expect(this.page.getByText(/%/)).toBeVisible({ timeout: 8_000 });
  }

  async getRowCount(): Promise<number> {
    return await this.attendanceRows.count();
  }
}

// ── MyResultsPage ─────────────────────────────────────────────────────────────

export class MyResultsPage {
  readonly page: Page;

  readonly pageTitle:     Locator;
  readonly semesterCards: Locator;
  readonly backlogBadge:  Locator;
  readonly noResultsMsg:  Locator;
  readonly spinner:       Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle     = page.getByRole('heading', { name: /results|marks/i });
    this.semesterCards = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /semester/i });
    this.backlogBadge  = page.getByText(/backlog/i);
    this.noResultsMsg  = page.getByText(/no results|not published/i);
    this.spinner       = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/student/results');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/student\/results/);
  }

  async expectSubjectGradeVisible(subjectCode: string): Promise<void> {
    await expect(this.page.getByText(subjectCode)).toBeVisible({ timeout: 8_000 });
  }

  async expectGpaVisible(): Promise<void> {
    await expect(this.page.getByText(/gpa/i)).toBeVisible({ timeout: 8_000 });
  }
}

// ── FeeStatusPage ─────────────────────────────────────────────────────────────

export class FeeStatusPage {
  readonly page: Page;

  readonly pageTitle:     Locator;
  readonly feeStatusText: Locator;
  readonly paidAmount:    Locator;
  readonly balanceAmount: Locator;
  readonly spinner:       Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle     = page.getByRole('heading', { name: /fee status/i });
    this.feeStatusText = page.getByText(/paid|partially_paid|unpaid/i).first();
    this.paidAmount    = page.getByText(/paid amount/i);
    this.balanceAmount = page.getByText(/balance/i);
    this.spinner       = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/student/fees');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/student\/fees/);
  }

  async expectFeeStatusVisible(): Promise<void> {
    await expect(this.feeStatusText).toBeVisible({ timeout: 8_000 });
  }
}

// ── HallTicketPage ────────────────────────────────────────────────────────────

export class HallTicketPage {
  readonly page: Page;

  readonly pageTitle:       Locator;
  readonly downloadBtn:     Locator;
  readonly blockedMsg:      Locator;
  readonly blockReasonList: Locator;
  readonly eligibleMsg:     Locator;
  readonly spinner:         Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle       = page.getByRole('heading', { name: /hall ticket/i });
    this.downloadBtn     = page.getByRole('button', { name: /download/i });
    this.blockedMsg      = page.getByText(/blocked|not eligible/i);
    this.blockReasonList = page.getByText(/attendance below|outstanding fee/i);
    this.eligibleMsg     = page.getByText(/eligible/i);
    this.spinner         = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/student/hall-ticket');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/student\/hall-ticket/);
  }

  async expectDownloadAvailable(): Promise<void> {
    await expect(this.downloadBtn).toBeVisible({ timeout: 8_000 });
  }

  async expectBlockedWithReasons(): Promise<void> {
    await expect(this.blockedMsg).toBeVisible({ timeout: 8_000 });
    await expect(this.blockReasonList).toBeVisible();
  }
}
