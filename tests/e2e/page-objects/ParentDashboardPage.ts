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

    this.pageTitle         = page.getByRole('heading', { name: /parent portal|my child/i }).first();
    this.attendanceSection = page.getByText(/attendance/i).first();
    this.resultsSection    = page.getByText(/results|performance/i).first();
    this.alertsSection     = page.getByText(/alert|warning|reminder/i).first();
    this.riskScoreSection  = page.getByText(/risk score|eligibility risk/i).first();
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
    await this.spinner.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
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
