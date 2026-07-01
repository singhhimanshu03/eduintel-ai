/**
 * FacultyManagementPage.ts
 *
 * Page Object for /admin/faculty (FacultyManagement.tsx)
 */

import { type Page, type Locator, expect } from '@playwright/test';

export interface FacultyFormData {
  facultyCode:  string;
  fullName:     string;
  email:        string;
  phone?:       string;
  designation?: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Lecturer';
}

export class FacultyManagementPage {
  readonly page: Page;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly pageTitle:      Locator;
  readonly facultyCount:   Locator;
  readonly addFacultyBtn:  Locator;
  readonly cancelFormBtn:  Locator;

  // ── Inline form ───────────────────────────────────────────────────────────
  readonly facultyCodeInput:   Locator;
  readonly fullNameInput:      Locator;
  readonly emailInput:         Locator;
  readonly phoneInput:         Locator;
  readonly designationSelect:  Locator;
  readonly createFacultyBtn:   Locator;
  readonly formErrorMsg:       Locator;

  // ── Table ─────────────────────────────────────────────────────────────────
  readonly table:      Locator;
  readonly tableRows:  Locator;
  readonly emptyMsg:   Locator;

  // ── Loading ───────────────────────────────────────────────────────────────
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle     = page.getByRole('heading', { name: /faculty management/i });
    this.facultyCount  = page.getByText(/faculty members/i);
    this.addFacultyBtn = page.getByRole('button', { name: /\+ add faculty/i });
    this.cancelFormBtn = page.getByRole('button', { name: /✕ cancel/i });

    // Inline form fields — only visible when form is open
    this.facultyCodeInput  = page.getByPlaceholder('FAC004');
    this.fullNameInput     = page.getByPlaceholder('Dr. Jane Smith');
    this.emailInput        = page.getByPlaceholder('jane@faculty.edu');
    this.phoneInput        = page.getByPlaceholder('+91 9876543210');
    this.designationSelect = page.getByRole('combobox').filter({
      hasText: /professor|associate|assistant|lecturer/i,
    });
    this.createFacultyBtn = page.getByRole('button', { name: /^create faculty$/i });
    this.formErrorMsg     = page.getByText(/failed to create faculty/i);

    this.table     = page.getByRole('table');
    this.tableRows = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.emptyMsg  = page.getByText(/no faculty added yet/i);

    this.spinner = page.getByText(/loading/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/admin/faculty');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async openAddForm(): Promise<void> {
    await this.addFacultyBtn.click();
    await expect(this.createFacultyBtn).toBeVisible({ timeout: 5_000 });
  }

  async closeAddForm(): Promise<void> {
    await this.cancelFormBtn.click();
    await expect(this.createFacultyBtn).toBeHidden({ timeout: 5_000 });
  }

  async fillForm(data: FacultyFormData): Promise<void> {
    await this.facultyCodeInput.fill(data.facultyCode);
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    if (data.phone)       await this.phoneInput.fill(data.phone);
    if (data.designation) await this.designationSelect.selectOption(data.designation);
  }

  async submitForm(): Promise<void> {
    await this.createFacultyBtn.click();
  }

  /**
   * Open form, fill, submit, wait for form to close (success).
   */
  async addFaculty(data: FacultyFormData): Promise<void> {
    await this.openAddForm();
    await this.fillForm(data);
    await this.submitForm();
    // On success the form closes
    await expect(this.createFacultyBtn).toBeHidden({ timeout: 10_000 });
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnFacultyPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/faculty/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectFacultyVisible(name: string): Promise<void> {
    await expect(this.tableRows.filter({ hasText: name })).toBeVisible({ timeout: 10_000 });
  }

  async expectFacultyCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count, { timeout: 10_000 });
  }

  async expectTableColumnsPresent(): Promise<void> {
    await expect(this.table.getByRole('columnheader', { name: /code/i })).toBeVisible();
    await expect(this.table.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(this.table.getByRole('columnheader', { name: /email/i })).toBeVisible();
    await expect(this.table.getByRole('columnheader', { name: /designation/i })).toBeVisible();
    await expect(this.table.getByRole('columnheader', { name: /status/i })).toBeVisible();
  }

  async expectFormError(): Promise<void> {
    await expect(this.formErrorMsg).toBeVisible({ timeout: 8_000 });
  }

  async expectEmptyMessage(): Promise<void> {
    await expect(this.emptyMsg).toBeVisible();
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async expectAtLeastOneFaculty(): Promise<void> {
    const count = await this.getRowCount();
    expect(count).toBeGreaterThan(0);
  }

  async expectStatusBadge(name: string, status: 'active' | 'inactive'): Promise<void> {
    const row = this.tableRows.filter({ hasText: name });
    await expect(row.getByText(status)).toBeVisible();
  }
}
