/**
 * RegisterPage.ts
 *
 * Page Object for /register
 * Mirrors Register.tsx selectors exactly.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export type RegisterRole =
  | 'college_admin'
  | 'faculty'
  | 'student'
  | 'parent'
  | 'examination_cell'
  | 'placement_cell';

export class RegisterPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly emailInput:       Locator;
  readonly passwordInput:    Locator;
  readonly roleSelect:       Locator;
  readonly institutionInput: Locator;
  readonly submitButton:     Locator;
  readonly errorBanner:      Locator;
  readonly themeToggle:      Locator;
  readonly signInLink:       Locator;

  // Success state
  readonly successHeading:   Locator;
  readonly backToLoginBtn:   Locator;

  constructor(page: Page) {
    this.page = page;

    // Register.tsx uses plain <input> without for/id linking — match by placeholder
    this.emailInput       = page.getByPlaceholder('you@institution.edu');
    this.passwordInput    = page.getByPlaceholder('Min 8 characters');
    // Role select has no id — use nth combobox (first one on the page)
    this.roleSelect       = page.locator('select').first();
    this.institutionInput = page.getByPlaceholder('UUID of your institution');
    this.submitButton     = page.getByRole('button', { name: /create account/i });
    this.errorBanner      = page.locator('[style*="color-danger"]').filter({ hasText: /./ });
    this.themeToggle      = page.getByRole('button', { name: /toggle theme/i });
    this.signInLink       = page.getByRole('link', { name: /sign in/i });

    this.successHeading   = page.getByRole('heading', { name: /check your email/i });
    this.backToLoginBtn   = page.getByRole('link', { name: /back to login/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async selectRole(role: RegisterRole): Promise<void> {
    await this.roleSelect.selectOption(role);
  }

  async fillInstitutionId(id: string): Promise<void> {
    await this.institutionInput.fill(id);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow.
   */
  async register(
    email: string,
    password: string,
    role: RegisterRole,
    institutionId?: string,
  ): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.selectRole(role);
    if (institutionId) {
      await this.fillInstitutionId(institutionId);
    }
    await this.submit();
  }

  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnRegisterPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/register/);
    await expect(this.submitButton).toBeVisible();
  }

  async expectSuccessState(): Promise<void> {
    await expect(this.successHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.backToLoginBtn).toBeVisible();
  }

  async expectErrorVisible(partialText?: string): Promise<void> {
    const banner = this.errorBanner.first();
    await expect(banner).toBeVisible({ timeout: 8_000 });
    if (partialText) {
      await expect(banner).toContainText(partialText);
    }
  }

  async expectEmailValidationError(): Promise<void> {
    await expect(this.page.getByText(/invalid email/i)).toBeVisible();
  }

  async expectPasswordValidationError(): Promise<void> {
    await expect(this.page.getByText(/minimum 8 characters/i)).toBeVisible();
  }

  async expectRoleValidationError(): Promise<void> {
    await expect(this.page.getByText(/select your role/i)).toBeVisible();
  }

  async expectInstitutionValidationError(): Promise<void> {
    await expect(this.page.getByText(/valid uuid/i)).toBeVisible();
  }

  async expectSubmitLoading(): Promise<void> {
    await expect(this.submitButton).toContainText(/creating account/i);
    await expect(this.submitButton).toBeDisabled();
  }

  async expectAllRolesAvailable(): Promise<void> {
    const options = this.roleSelect.locator('option');
    await expect(options.filter({ hasText: /college admin/i })).toBeAttached();
    await expect(options.filter({ hasText: /faculty/i })).toBeAttached();
    await expect(options.filter({ hasText: /student/i })).toBeAttached();
    await expect(options.filter({ hasText: /parent/i })).toBeAttached();
    await expect(options.filter({ hasText: /examination cell/i })).toBeAttached();
    await expect(options.filter({ hasText: /placement cell/i })).toBeAttached();
  }
}
