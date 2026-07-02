/**
 * ForgotPasswordPage.ts
 *
 * Page Object for /forgot-password and /reset-password
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;

  readonly emailInput:   Locator;
  readonly submitButton: Locator;
  readonly successMsg:   Locator;
  readonly backToLogin:  Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput   = page.getByPlaceholder('you@institution.edu');
    this.submitButton = page.getByRole('button', { name: /send reset link/i });
    this.successMsg   = page.getByText(/reset link sent/i);
    this.backToLogin  = page.getByRole('link', { name: /back to login/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/forgot-password');
    await this.page.waitForLoadState('networkidle');
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMsg).toBeVisible({ timeout: 8_000 });
  }
}

// ── Reset Password Page ───────────────────────────────────────────────────────

export class ResetPasswordPage {
  readonly page: Page;

  readonly newPasswordInput:     Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton:         Locator;
  readonly successMsg:           Locator;
  readonly errorMsg:             Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPasswordInput     = page.getByLabel(/new password/i);
    this.confirmPasswordInput = page.getByLabel(/confirm/i);
    this.submitButton         = page.getByRole('button', { name: /reset password/i });
    this.successMsg           = page.getByText(/password reset successfully/i);
    this.errorMsg             = page.locator('[style*="color-danger"]').filter({ hasText: /./ });
  }

  async gotoWithToken(token: string): Promise<void> {
    await this.page.goto(`/reset-password?token=${token}`);
    await this.page.waitForLoadState('networkidle');
  }

  async resetPassword(newPassword: string, confirm: string): Promise<void> {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirm);
    await this.submitButton.click();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMsg).toBeVisible({ timeout: 8_000 });
  }

  async expectErrorVisible(): Promise<void> {
    await expect(this.errorMsg.first()).toBeVisible({ timeout: 8_000 });
  }
}
