/**
 * ParentDashboardPage.ts
 *
 * Page Object for /parent → ParentOverview
 * Parents see their linked child's attendance, results, alerts, and AI risk score.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ParentDashboardPage {
  readonly page: Page;

  // ── Section locators ──────────────────────────────────────────────────────
  readonly pageTitle:           Locator;
  readonly attendanceSection:   Locator;
  readonly resultsSection:      Locator;
  readonly alertsSection:       Locator;
  readonly riskScoreSection:    Locator;
  readonly spinner:             Locator;

  // ── Specific data ─────────────────────────────────────────────────────────
  readonly attendancePercentage: Locator;
  readonly riskBadge:           Locator;    // Low / Medium / High
  readonly activeAlerts:        Locator;

  // ── Nav ───────────────────────────────────────────────────────────────────
  readonly navMyChild: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle         = page.getByRole('heading', { name: /parent portal|my child|child's academic/i }).first();
    this.attendanceSection = page.getByText(/average attendance/i).first();
    this.resultsSection    = page.getByText(/current gpa/i).first();
    this.alertsSection     = page.getByText(/alert|warning|reminder|backlog/i).first();
    this.riskScoreSection  = page.getByText(/ai risk level/i).first();
    this.spinner           = page.getByText(/loading/i);

    this.attendancePercentage = page.getByText(/%/).first();
    this.riskBadge            = page.getByText(/\b(low|medium|high)\b/i).first();
    this.activeAlerts         = page.getByText(/attendance warning|fee reminder/i);

    this.navMyChild = page.getByRole('link', { name: /my child/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/parent');
    await this.page.waitForLoadState('networkidle');
    // Parent portal requires entering a student ID before data renders
    const input = this.page.getByPlaceholder(/student id/i);
    if (await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await input.fill('00000000-0000-0000-0000-000000000003');
      await this.page.getByRole('button', { name: /view/i }).click();
      await this.spinner.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    } else {
      await this.spinner.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnParentDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/parent$/);
    await this.spinner.waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
  }

  async expectAttendanceSectionVisible(): Promise<void> {
    await expect(this.attendanceSection).toBeVisible({ timeout: 10_000 });
  }

  async expectAttendancePercentageVisible(): Promise<void> {
    await expect(this.attendancePercentage).toBeVisible({ timeout: 10_000 });
  }

  async expectResultsSectionVisible(): Promise<void> {
    await expect(this.resultsSection).toBeVisible({ timeout: 10_000 });
  }

  async expectRiskScoreVisible(): Promise<void> {
    await expect(this.riskScoreSection).toBeVisible({ timeout: 10_000 });
  }

  async expectRiskBadgeValue(level: 'Low' | 'Medium' | 'High'): Promise<void> {
    await expect(this.page.getByText(new RegExp(`\\b${level}\\b`, 'i'))).toBeVisible({ timeout: 10_000 });
  }

  async expectAlertsVisible(): Promise<void> {
    await expect(this.alertsSection).toBeVisible({ timeout: 10_000 });
  }

  async expectNoActiveAlerts(): Promise<void> {
    await expect(this.activeAlerts).toHaveCount(0);
  }

  async expectNavPresent(): Promise<void> {
    await expect(this.navMyChild).toBeVisible();
  }

  async expectDashboardLoaded(): Promise<void> {
    // Dashboard is considered loaded when at least one data section is visible
    await expect(
      this.attendanceSection.or(this.resultsSection).or(this.riskScoreSection)
    ).toBeVisible({ timeout: 15_000 });
  }
}
