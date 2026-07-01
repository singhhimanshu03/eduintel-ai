/**
 * StudentDetailPage.ts
 *
 * Page Object for /admin/students/:id (StudentDetail.tsx)
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class StudentDetailPage {
  readonly page: Page;

  // ── Profile section ───────────────────────────────────────────────────────
  readonly studentName:     Locator;
  readonly studentCode:     Locator;
  readonly studentEmail:    Locator;
  readonly enrollmentStatus: Locator;

  // ── Academic history section ──────────────────────────────────────────────
  readonly academicHistorySection: Locator;
  readonly academicHistoryRows:    Locator;

  // ── Back navigation ───────────────────────────────────────────────────────
  readonly backBtn: Locator;

  // ── Loading / error ───────────────────────────────────────────────────────
  readonly spinner:   Locator;
  readonly errorText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.studentName      = page.getByRole('heading').first();
    this.studentCode      = page.getByText(/CS\d{7}/);
    this.studentEmail     = page.getByText(/@/);
    this.enrollmentStatus = page.getByText(/active|inactive/i).first();

    this.academicHistorySection = page.getByText(/academic history/i).locator('..').locator('..');
    this.academicHistoryRows    = page.getByRole('table').last().getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });

    this.backBtn = page.getByRole('button', { name: /← back/i });

    this.spinner   = page.getByText(/loading/i);
    this.errorText = page.getByText(/not found/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(studentId: string): Promise<void> {
    await this.page.goto(`/admin/students/${studentId}`);
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async goBack(): Promise<void> {
    await this.backBtn.click();
    await this.page.waitForURL(/\/admin\/students$/);
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectStudentNameVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10_000 });
  }

  async expectStudentCodeVisible(code: string): Promise<void> {
    await expect(this.page.getByText(code)).toBeVisible({ timeout: 10_000 });
  }

  async expectEmailVisible(email: string): Promise<void> {
    await expect(this.page.getByText(email)).toBeVisible({ timeout: 10_000 });
  }

  async expectAcademicHistoryVisible(): Promise<void> {
    await expect(this.academicHistorySection).toBeVisible({ timeout: 10_000 });
  }

  async expectAcademicHistoryHasRows(): Promise<void> {
    const count = await this.academicHistoryRows.count();
    expect(count).toBeGreaterThan(0);
  }

  async expectNotFoundError(): Promise<void> {
    await expect(this.errorText).toBeVisible({ timeout: 8_000 });
  }
}
