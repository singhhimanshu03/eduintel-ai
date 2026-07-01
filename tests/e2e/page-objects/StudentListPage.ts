/**
 * StudentListPage.ts
 *
 * Page Object for /admin/students (StudentList.tsx)
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class StudentListPage {
  readonly page: Page;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly pageTitle:       Locator;
  readonly studentCount:    Locator;
  readonly addStudentBtn:   Locator;

  // ── Search ────────────────────────────────────────────────────────────────
  readonly searchInput: Locator;

  // ── Table ─────────────────────────────────────────────────────────────────
  readonly table:       Locator;
  readonly tableRows:   Locator;
  readonly emptyMsg:    Locator;

  // ── Loading ───────────────────────────────────────────────────────────────
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle     = page.getByRole('heading', { name: /^students$/i });
    this.studentCount  = page.getByText(/enrolled students/i);
    this.addStudentBtn = page.getByRole('button', { name: /\+ add student/i });

    this.searchInput = page.getByPlaceholder(/search by name, code, or email/i);

    this.table     = page.getByRole('table');
    this.tableRows = page.getByRole('table').getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    this.emptyMsg  = page.getByText(/no students found/i);

    this.spinner = page.getByText(/loading/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/admin/students');
    await this.page.waitForLoadState('networkidle');
    // Wait for spinner to disappear
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Debounce — wait a tick for filter to apply
    await this.page.waitForTimeout(300);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async clickAddStudent(): Promise<void> {
    await this.addStudentBtn.click();
    await this.page.waitForURL(/\/admin\/students\/new/);
  }

  async clickViewStudent(rowIndex = 0): Promise<void> {
    const viewBtn = this.tableRows.nth(rowIndex).getByRole('button', { name: /view/i });
    await viewBtn.click();
    await this.page.waitForURL(/\/admin\/students\/[0-9a-f-]+$/i);
  }

  async clickViewStudentByName(name: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: name });
    await row.getByRole('button', { name: /view/i }).click();
    await this.page.waitForURL(/\/admin\/students\/[0-9a-f-]+$/i);
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnStudentList(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/students$/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectStudentCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count, { timeout: 10_000 });
  }

  async expectStudentVisible(name: string): Promise<void> {
    await expect(this.tableRows.filter({ hasText: name })).toBeVisible({ timeout: 10_000 });
  }

  async expectStudentNotVisible(name: string): Promise<void> {
    await expect(this.tableRows.filter({ hasText: name })).toHaveCount(0);
  }

  async expectEmptyMessage(): Promise<void> {
    await expect(this.emptyMsg).toBeVisible();
  }

  async expectTableColumnsPresent(): Promise<void> {
    const header = this.table.getByRole('columnheader');
    await expect(header.filter({ hasText: /code/i })).toBeVisible();
    await expect(header.filter({ hasText: /name/i })).toBeVisible();
    await expect(header.filter({ hasText: /email/i })).toBeVisible();
    await expect(header.filter({ hasText: /semester/i })).toBeVisible();
    await expect(header.filter({ hasText: /status/i })).toBeVisible();
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async expectAtLeastOneStudent(): Promise<void> {
    const count = await this.getRowCount();
    expect(count).toBeGreaterThan(0);
  }

  async expectSearchFilters(query: string, expectedName: string): Promise<void> {
    await this.search(query);
    await this.expectStudentVisible(expectedName);
  }
}
