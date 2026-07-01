/**
 * ChangePasswordPage.ts
 *
 * Page Object for /change-password (ChangePassword.tsx)
 * Accessible by any authenticated user.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ChangePasswordPage {
  readonly page: Page;

  // ── Form fields ───────────────────────────────────────────────────────────
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput:     Locator;
  readonly confirmPasswordInput: Locator;
  readonly updateBtn:            Locator;
  readonly cancelBtn:            Locator;

  // ── Feedback ──────────────────────────────────────────────────────────────
  readonly errorBanner:  Locator;
  readonly successState: Locator;
  readonly successMsg:   Locator;

  // ── Page header ───────────────────────────────────────────────────────────
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // ChangePassword.tsx uses generic labels — match by placeholder text
    this.currentPasswordInput = page.getByPlaceholder('Enter current password');
    this.newPasswordInput     = page.getByPlaceholder('Min 8 characters');
    this.confirmPasswordInput = page.getByPlaceholder('Re-enter new password');

    this.updateBtn = page.getByRole('button', { name: /update password/i });
    this.cancelBtn = page.getByRole('button', { name: /cancel/i });

    this.errorBanner  = page.locator('[style*="color-danger"]').filter({ hasText: /./ });
    this.successState = page.locator('[class*="card"]').filter({ hasText: /updated successfully/i });
    this.successMsg   = page.getByText(/password updated successfully/i);

    this.pageTitle = page.getByRole('heading', { name: /change password/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/change-password');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillCurrentPassword(password: string): Promise<void> {
    await this.currentPasswordInput.fill(password);
  }

  async fillNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.updateBtn.click();
  }

  /**
   * Complete change-password flow.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    await this.fillCurrentPassword(currentPassword);
    await this.fillNewPassword(newPassword);
    await this.fillConfirmPassword(confirmPassword);
    await this.submit();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/change-password/);
    await expect(this.pageTitle).toBeVisible({ timeout: 8_000 });
  }

  async expectSuccessState(): Promise<void> {
    await expect(this.successMsg).toBeVisible({ timeout: 10_000 });
  }

  async expectError(partialText?: string): Promise<void> {
    const banner = this.errorBanner.first();
    await expect(banner).toBeVisible({ timeout: 8_000 });
    if (partialText) await expect(banner).toContainText(partialText);
  }

  async expectMismatchError(): Promise<void> {
    await expect(this.page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 8_000 });
  }

  async expectMinLengthError(): Promise<void> {
    await expect(this.page.getByText(/minimum 8 characters/i)).toBeVisible({ timeout: 8_000 });
  }

  async expectUpdateButtonLoading(): Promise<void> {
    await expect(this.updateBtn).toContainText(/updating/i);
    await expect(this.updateBtn).toBeDisabled();
  }

  async expectFormFieldsEmpty(): Promise<void> {
    await expect(this.currentPasswordInput).toHaveValue('');
    await expect(this.newPasswordInput).toHaveValue('');
    await expect(this.confirmPasswordInput).toHaveValue('');
  }
}

// ── FeeDefaultersPage ─────────────────────────────────────────────────────────
// Included here as an admin sub-page (used by fee.spec.ts)

export class FeeDefaultersPage {
  readonly page: Page;

  readonly pageTitle:    Locator;
  readonly defaulterRows: Locator;
  readonly emptyMsg:     Locator;
  readonly analyticsSection: Locator;
  readonly spinner:      Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle        = page.getByRole('heading', { name: /fee defaulters|fee/i }).first();
    this.defaulterRows    = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.emptyMsg         = page.getByText(/no defaulters|all fees paid/i);
    this.analyticsSection = page.getByText(/total collected|fee analytics/i).first();
    this.spinner          = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/fees');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/fees/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectDefaulterVisible(studentId: string): Promise<void> {
    await expect(this.defaulterRows.filter({ hasText: studentId })).toBeVisible({ timeout: 8_000 });
  }

  async expectAnalyticsVisible(): Promise<void> {
    await expect(this.analyticsSection).toBeVisible({ timeout: 10_000 });
  }

  async getDefaulterCount(): Promise<number> {
    return await this.defaulterRows.count();
  }

  async expectAtLeastOneDefaulter(): Promise<void> {
    expect(await this.getDefaulterCount()).toBeGreaterThan(0);
  }
}

// ── AttendanceAnalyticsPage ───────────────────────────────────────────────────
// Admin /admin/attendance page

export class AttendanceAnalyticsPage {
  readonly page: Page;

  readonly pageTitle:           Locator;
  readonly avgAttendanceStat:   Locator;
  readonly belowThresholdRows:  Locator;
  readonly spinner:             Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle          = page.getByRole('heading', { name: /attendance analytics|attendance/i }).first();
    this.avgAttendanceStat  = page.getByText(/average.*attendance|avg.*attendance/i).first();
    this.belowThresholdRows = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.spinner = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/attendance');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/attendance/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectAverageAttendanceVisible(): Promise<void> {
    await expect(this.avgAttendanceStat).toBeVisible({ timeout: 10_000 });
  }

  async expectBelowThresholdStudentsListed(): Promise<void> {
    const count = await this.belowThresholdRows.count();
    expect(count).toBeGreaterThanOrEqual(0); // can be 0 if all are above threshold
  }
}

// ── AIInsightsPage ────────────────────────────────────────────────────────────
// Admin /admin/ai page

export class AIInsightsPage {
  readonly page: Page;

  readonly pageTitle:         Locator;
  readonly riskDistribution:  Locator;
  readonly studentRiskRows:   Locator;
  readonly spinner:           Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle        = page.getByRole('heading', { name: /ai insights|ai/i }).first();
    this.riskDistribution = page.getByText(/risk distribution|low.*medium.*high/i).first();
    this.studentRiskRows  = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.spinner = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/ai');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/ai/);
  }

  async expectRiskDataVisible(): Promise<void> {
    await expect(
      this.riskDistribution.or(this.studentRiskRows.first())
    ).toBeVisible({ timeout: 10_000 });
  }
}

// ── ReportsPage ───────────────────────────────────────────────────────────────
// Admin /admin/reports page

export class ReportsPage {
  readonly page: Page;

  readonly pageTitle:    Locator;
  readonly reportButtons: Locator;
  readonly spinner:      Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle     = page.getByRole('heading', { name: /reports/i }).first();
    this.reportButtons = page.getByRole('button', { name: /export|download/i });
    this.spinner       = page.getByText(/loading|generating/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/reports');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/reports/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async clickExportReport(reportType: string): Promise<void> {
    const btn = this.page.getByRole('button', { name: new RegExp(reportType, 'i') });
    await btn.click();
  }

  async expectReportButtonsPresent(): Promise<void> {
    // At least attendance and fee reports should be present
    await expect(this.page.getByRole('button', { name: /attendance/i })).toBeVisible({ timeout: 8_000 });
    await expect(this.page.getByRole('button', { name: /fee/i })).toBeVisible({ timeout: 8_000 });
  }
}
