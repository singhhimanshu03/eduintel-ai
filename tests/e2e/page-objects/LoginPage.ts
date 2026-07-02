/**
 * LoginPage.ts
 *
 * Page Object for /login
 * Mirrors Login.tsx selectors exactly.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly emailInput:      Locator;
  readonly passwordInput:   Locator;
  readonly submitButton:    Locator;
  readonly errorBanner:     Locator;
  readonly themeToggle:     Locator;
  readonly showPasswordBtn: Locator;
  readonly rememberMeCheck: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink:    Locator;
  readonly capsLockWarning: Locator;

  constructor(page: Page) {
    this.page = page;

    // Login.tsx uses plain <input> without for/id linking — match by placeholder
    this.emailInput      = page.getByPlaceholder('you@institution.edu');
    this.passwordInput   = page.getByPlaceholder('••••••••');
    this.submitButton    = page.getByRole('button', { name: /sign in/i });
    // Error banner: the error div has class card-elevated and appears only on API error
    this.errorBanner     = page.locator('.card-elevated[style]').filter({ hasText: /./  });
    this.themeToggle     = page.getByRole('button', { name: /toggle theme/i });
    this.showPasswordBtn = page.getByRole('button', { name: /show password|hide password/i });
    this.rememberMeCheck = page.getByRole('checkbox');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.registerLink    = page.getByRole('link', { name: /register here/i });
    this.capsLockWarning = page.getByText(/caps lock is on/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Full login flow. Waits for navigation away from /login.
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15_000,
    });
  }

  /**
   * Attempt login that is expected to fail (stays on /login).
   */
  async loginExpectFailure(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    // Wait for error banner to appear
    await this.errorBanner.first().waitFor({ state: 'visible', timeout: 8_000 });
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordBtn.click();
  }

  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheck.check();
  }

  async uncheckRememberMe(): Promise<void> {
    await this.rememberMeCheck.uncheck();
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async clickRegister(): Promise<void> {
    await this.registerLink.click();
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.submitButton).toBeVisible();
  }

  async expectErrorVisible(partialText?: string): Promise<void> {
    const banner = this.errorBanner.first();
    await expect(banner).toBeVisible({ timeout: 8_000 });
    if (partialText) {
      await expect(banner).toContainText(partialText);
    }
  }

  async expectRedirectedTo(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path), { timeout: 15_000 });
  }

  async expectPasswordVisible(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
  }

  async expectPasswordHidden(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async expectSubmitLoading(): Promise<void> {
    await expect(this.submitButton).toContainText(/signing in/i);
    await expect(this.submitButton).toBeDisabled();
  }

  async expectEmailValidationError(): Promise<void> {
    await expect(this.page.getByText(/invalid email/i)).toBeVisible();
  }

  async expectPasswordValidationError(): Promise<void> {
    await expect(this.page.getByText(/at least 8 characters/i)).toBeVisible();
  }

  async expectLogoVisible(): Promise<void> {
    await expect(this.page.getByText('EduIntel AI')).toBeVisible();
  }
}
