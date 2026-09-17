/**
 * AdminOverviewPage.ts
 *
 * Page Object for /admin (AdminOverview.tsx)
 * Covers the stat cards, risk distribution chart, fee chart,
 * and the attendance-below-threshold list.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class AdminOverviewPage {
  readonly page: Page;

  // ── Stat cards ────────────────────────────────────────────────────────────
  readonly totalStudentsCard:   Locator;
  readonly avgAttendanceCard:   Locator;
  readonly feeCollectedCard:    Locator;
  readonly highRiskStudentsCard: Locator;

  // ── Charts ────────────────────────────────────────────────────────────────
  readonly riskDistributionChart: Locator;
  readonly feeCollectionChart:    Locator;

  // ── Below-threshold table ─────────────────────────────────────────────────
  readonly belowThresholdSection: Locator;
  readonly belowThresholdRows:    Locator;
  readonly noThresholdMsg:        Locator;

  // ── Nav items ─────────────────────────────────────────────────────────────
  readonly navStudents:      Locator;
  readonly navFaculty:       Locator;
  readonly navAttendance:    Locator;
  readonly navFees:          Locator;
  readonly navAI:            Locator;
  readonly navNotifications: Locator;
  readonly navReports:       Locator;

  // ── Page header ───────────────────────────────────────────────────────────
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.totalStudentsCard    = page.getByText('Total Students').locator('..').locator('..');
    this.avgAttendanceCard    = page.getByText('Avg Attendance').locator('..').locator('..');
    this.feeCollectedCard     = page.getByText('Fee Collected').locator('..').locator('..');
    this.highRiskStudentsCard = page.getByText('High-Risk Students').locator('..').locator('..');

    this.riskDistributionChart = page.locator('[data-testid="risk-chart"], .recharts-wrapper').first();
    this.feeCollectionChart    = page.locator('[data-testid="fee-chart"], .recharts-wrapper').last();

    this.belowThresholdSection = page.getByText(/students below attendance threshold/i).locator('..').locator('..');
    this.belowThresholdRows    = page.locator('.divide-y > div');
    this.noThresholdMsg        = page.getByText(/all students are above the threshold/i);

    this.navStudents      = page.getByRole('link', { name: /students/i });
    this.navFaculty       = page.getByRole('link', { name: /faculty/i });
    this.navAttendance    = page.getByRole('link', { name: /attendance/i });
    this.navFees          = page.getByRole('link', { name: /fees/i });
    this.navAI            = page.getByRole('link', { name: /ai insights/i });
    this.navNotifications = page.getByRole('link', { name: /notifications/i });
    this.navReports       = page.getByRole('link', { name: /reports/i });

    this.pageTitle = page.getByRole('heading', { name: /platform overview/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async goToStudents(): Promise<void> {
    await this.navStudents.click();
    await this.page.waitForURL(/\/admin\/students/);
  }

  async goToFaculty(): Promise<void> {
    await this.navFaculty.click();
    await this.page.waitForURL(/\/admin\/faculty/);
  }

  async goToAttendance(): Promise<void> {
    await this.navAttendance.click();
    await this.page.waitForURL(/\/admin\/attendance/);
  }

  async goToFees(): Promise<void> {
    await this.navFees.click();
    await this.page.waitForURL(/\/admin\/fees/);
  }

  async goToAIInsights(): Promise<void> {
    await this.navAI.click();
    await this.page.waitForURL(/\/admin\/ai/);
  }

  async goToReports(): Promise<void> {
    await this.navReports.click();
    await this.page.waitForURL(/\/admin\/reports/);
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnAdminOverview(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin$/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectStatCardsVisible(): Promise<void> {
    await expect(this.page.getByText('Total Students')).toBeVisible();
    await expect(this.page.getByText('Avg Attendance')).toBeVisible();
    await expect(this.page.getByText('Fee Collected')).toBeVisible();
    await expect(this.page.getByText('High-Risk Students')).toBeVisible();
  }

  async expectTotalStudentsValue(value: string | number): Promise<void> {
    // Scope to the Total Students stat card and check the value <p> directly
    const card = this.page.getByText('Total Students').locator('..');
    await expect(card.locator('p').last()).toContainText(String(value), { timeout: 10_000 });
  }

  async expectTotalStudentsNumeric(): Promise<void> {
    // Verify the card shows a real number, not the '—' fallback
    const card = this.page.getByText('Total Students').locator('..');
    const valueText = await card.locator('p').last().textContent({ timeout: 10_000 });
    const num = parseInt(valueText?.trim() ?? '', 10);
    expect(num).toBeGreaterThanOrEqual(1);
  }

  async expectBelowThresholdListVisible(): Promise<void> {
    await expect(this.belowThresholdSection).toBeVisible();
  }

  async getBelowThresholdCount(): Promise<number> {
    return await this.belowThresholdRows.count();
  }

  async expectNavItemsPresent(): Promise<void> {
    for (const nav of [
      this.navStudents, this.navFaculty, this.navAttendance,
      this.navFees, this.navAI, this.navReports,
    ]) {
      await expect(nav).toBeVisible();
    }
  }
}
