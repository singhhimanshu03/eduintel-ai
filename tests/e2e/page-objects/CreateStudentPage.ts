/**
 * CreateStudentPage.ts
 *
 * Page Object for /admin/students/new (CreateStudent.tsx)
 * Covers both single-student form and bulk CSV import.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import * as path from 'path';

export interface StudentFormData {
  studentCode:     string;
  fullName:        string;
  email:           string;
  phone?:          string;
  gender?:         'male' | 'female' | 'other';
  dateOfBirth?:    string; // YYYY-MM-DD
  currentSemester?: number;
  departmentId?:   string;
}

export class CreateStudentPage {
  readonly page: Page;

  // ── Single student form ───────────────────────────────────────────────────
  readonly studentCodeInput:     Locator;
  readonly fullNameInput:        Locator;
  readonly emailInput:           Locator;
  readonly phoneInput:           Locator;
  readonly genderSelect:         Locator;
  readonly dobInput:             Locator;
  readonly semesterInput:        Locator;
  readonly departmentInput:      Locator;
  readonly createButton:         Locator;
  readonly resetButton:          Locator;
  readonly errorMsg:             Locator;
  readonly backLink:             Locator;

  // ── Bulk import ───────────────────────────────────────────────────────────
  readonly csvFileInput:         Locator;
  readonly importButton:         Locator;
  readonly bulkResultBanner:     Locator;

  // ── Page header ───────────────────────────────────────────────────────────
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.studentCodeInput = page.getByPlaceholder('CS2024001');
    this.fullNameInput    = page.getByPlaceholder('Riya Sharma');
    this.emailInput       = page.getByPlaceholder('riya@college.edu');
    this.phoneInput       = page.getByPlaceholder(/\+91/);
    this.genderSelect     = page.getByRole('combobox').filter({ hasText: /select|male|female|other/i }).first();
    this.dobInput         = page.locator('input[type="date"]');
    this.semesterInput    = page.locator('input[type="number"]').first();
    this.departmentInput  = page.getByPlaceholder('uuid');

    this.createButton = page.getByRole('button', { name: /^create student$/i });
    this.resetButton  = page.getByRole('button', { name: /^reset$/i });
    this.errorMsg     = page.getByText(/failed to create student/i);
    this.backLink     = page.getByRole('button', { name: /← back to list/i });

    this.csvFileInput     = page.locator('input[type="file"][accept=".csv"]');
    this.importButton     = page.getByRole('button', { name: /import csv/i });
    this.bulkResultBanner = page.locator('[class*="bg-green-"], [class*="bg-yellow-"]').filter({ hasText: /imported/i });

    this.pageTitle = page.getByRole('heading', { name: /add student/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/admin/students/new');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillForm(data: StudentFormData): Promise<void> {
    await this.studentCodeInput.fill(data.studentCode);
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);

    if (data.phone)          await this.phoneInput.fill(data.phone);
    if (data.gender)         await this.genderSelect.selectOption(data.gender);
    if (data.dateOfBirth)    await this.dobInput.fill(data.dateOfBirth);
    if (data.currentSemester !== undefined)
                             await this.semesterInput.fill(String(data.currentSemester));
    if (data.departmentId)   await this.departmentInput.fill(data.departmentId);
  }

  async submit(): Promise<void> {
    await this.createButton.click();
  }

  /**
   * Fill form and submit, then wait for redirect to student list.
   */
  async createStudent(data: StudentFormData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
    await this.page.waitForURL(/\/admin\/students$/, { timeout: 15_000 });
  }

  async resetForm(): Promise<void> {
    await this.resetButton.click();
  }

  async goBackToList(): Promise<void> {
    await this.backLink.click();
    await this.page.waitForURL(/\/admin\/students$/);
  }

  /**
   * Upload a CSV file for bulk import.
   * @param csvPath absolute path to a .csv file
   */
  async uploadCSV(csvPath: string): Promise<void> {
    await this.csvFileInput.setInputFiles(csvPath);
  }

  async clickImport(): Promise<void> {
    await this.importButton.click();
  }

  async bulkImport(csvPath: string): Promise<void> {
    await this.uploadCSV(csvPath);
    await this.clickImport();
    await this.bulkResultBanner.waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnCreatePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/students\/new/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectCreateButtonLoading(): Promise<void> {
    await expect(this.createButton).toContainText(/creating/i);
    await expect(this.createButton).toBeDisabled();
  }

  async expectError(partialText?: string): Promise<void> {
    await expect(this.errorMsg).toBeVisible({ timeout: 8_000 });
    if (partialText) await expect(this.errorMsg).toContainText(partialText);
  }

  async expectBulkImportSuccess(importedCount: number): Promise<void> {
    await expect(this.bulkResultBanner).toBeVisible({ timeout: 15_000 });
    await expect(this.bulkResultBanner).toContainText(String(importedCount));
  }

  async expectBulkImportPartialFailure(): Promise<void> {
    const failBanner = this.page.locator('[class*="bg-yellow-"]').filter({ hasText: /failed/i });
    await expect(failBanner).toBeVisible({ timeout: 15_000 });
  }

  async expectFormEmpty(): Promise<void> {
    await expect(this.studentCodeInput).toHaveValue('');
    await expect(this.fullNameInput).toHaveValue('');
    await expect(this.emailInput).toHaveValue('');
  }
}
