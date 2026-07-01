/**
 * HallTicketManagementPage.ts
 *
 * Page Object for /exam/hall-tickets (HallTicketManagement.tsx)
 * Covers eligibility check + hall ticket generation.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class HallTicketManagementPage {
  readonly page: Page;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly pageTitle: Locator;

  // ── Input form ────────────────────────────────────────────────────────────
  readonly studentIdInput:  Locator;
  readonly examCycleInput:  Locator;
  readonly generateBtn:     Locator;

  // ── Results list ──────────────────────────────────────────────────────────
  readonly resultCards:     Locator;
  readonly eligibleCards:   Locator;
  readonly blockedCards:    Locator;

  // ── Loading ───────────────────────────────────────────────────────────────
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /hall ticket management/i });

    this.studentIdInput = page.getByPlaceholder('UUID');
    this.examCycleInput = page.getByPlaceholder('Nov-2024');
    this.generateBtn    = page.getByRole('button', { name: /generate/i });

    this.resultCards   = page.locator('[class*="rounded-xl"][class*="border"]').filter({ hasText: /eligible|blocked/i });
    this.eligibleCards = page.locator('[class*="bg-green"]').filter({ hasText: /✓ eligible/i });
    this.blockedCards  = page.locator('[class*="bg-red"]').filter({ hasText: /✗ blocked/i });

    this.spinner = page.getByText(/checking/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/exam/hall-tickets');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillStudentId(studentId: string): Promise<void> {
    await this.studentIdInput.fill(studentId);
  }

  async fillExamCycle(cycle: string): Promise<void> {
    await this.examCycleInput.fill(cycle);
  }

  async generate(): Promise<void> {
    await this.generateBtn.click();
    // Wait for spinner to appear then disappear
    await this.spinner.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
    await this.spinner.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  async generateHallTicket(studentId: string, examCycle: string): Promise<void> {
    await this.fillStudentId(studentId);
    await this.fillExamCycle(examCycle);
    await this.generate();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/exam\/hall-tickets/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectEligibleResult(studentId: string): Promise<void> {
    const card = this.resultCards.filter({ hasText: studentId }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText(/✓ eligible/i)).toBeVisible();
  }

  async expectBlockedResult(studentId: string): Promise<void> {
    const card = this.resultCards.filter({ hasText: studentId }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText(/✗ blocked/i)).toBeVisible();
  }

  async expectBlockReason(reason: string | RegExp): Promise<void> {
    await expect(this.page.getByText(reason)).toBeVisible({ timeout: 8_000 });
  }

  async expectAttendanceBlockReason(): Promise<void> {
    await expect(this.page.getByText(/attendance below/i)).toBeVisible({ timeout: 8_000 });
  }

  async expectFeeBlockReason(): Promise<void> {
    await expect(this.page.getByText(/outstanding fee/i)).toBeVisible({ timeout: 8_000 });
  }

  async expectGenerateButtonDisabledWhenEmpty(): Promise<void> {
    await this.studentIdInput.fill('');
    await this.examCycleInput.fill('');
    await expect(this.generateBtn).toBeDisabled();
  }

  async getResultCount(): Promise<number> {
    return await this.resultCards.count();
  }

  async expectResultsHeadingVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /results/i })).toBeVisible({ timeout: 8_000 });
  }
}
