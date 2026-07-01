/**
 * NotificationsPage.ts
 *
 * Page Objects for two notification views:
 *
 *   NotificationCenterPage  — /admin/notifications (admin/super_admin only)
 *     Admin compose + send form, notification history table.
 *
 *   MyNotificationsPage     — /notifications or /student/notifications etc.
 *     Read-only personal notification list, mark-as-read.
 */

import { type Page, type Locator, expect } from '@playwright/test';

// ── NotificationCenterPage ────────────────────────────────────────────────────

export class NotificationCenterPage {
  readonly page: Page;

  readonly pageTitle: Locator;

  // Compose form
  readonly messageTextarea:  Locator;
  readonly subjectInput:     Locator;
  readonly recipientInput:   Locator;
  readonly channelSelect:    Locator;
  readonly sendBtn:          Locator;
  readonly sendSuccessMsg:   Locator;
  readonly sendErrorMsg:     Locator;

  // History table
  readonly historyTable:     Locator;
  readonly historyRows:      Locator;
  readonly emptyHistoryMsg:  Locator;

  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /notification center|notifications/i }).first();

    this.subjectInput    = page.getByLabel(/subject/i).or(page.getByPlaceholder(/subject/i));
    this.messageTextarea = page.getByLabel(/message/i).or(page.getByPlaceholder(/message/i));
    this.recipientInput  = page.getByLabel(/recipient|user id/i).or(page.getByPlaceholder(/recipient|user/i));
    this.channelSelect   = page.getByLabel(/channel/i).or(page.getByRole('combobox').first());
    this.sendBtn         = page.getByRole('button', { name: /send notification|send/i });
    this.sendSuccessMsg  = page.getByText(/notification.*sent|sent successfully/i);
    this.sendErrorMsg    = page.getByText(/failed to send|send.*failed/i);

    this.historyTable    = page.getByRole('table');
    this.historyRows     = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.emptyHistoryMsg = page.getByText(/no notifications/i);

    this.spinner = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/notifications');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async sendNotification(data: {
    subject:   string;
    message:   string;
    recipient?: string;
    channel?:  'in_app' | 'email';
  }): Promise<void> {
    await this.subjectInput.fill(data.subject);
    await this.messageTextarea.fill(data.message);
    if (data.recipient) await this.recipientInput.fill(data.recipient);
    if (data.channel)   await this.channelSelect.selectOption(data.channel);
    await this.sendBtn.click();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/notifications/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectSendSuccess(): Promise<void> {
    await expect(this.sendSuccessMsg).toBeVisible({ timeout: 10_000 });
  }

  async expectSendError(): Promise<void> {
    await expect(this.sendErrorMsg).toBeVisible({ timeout: 8_000 });
  }

  async expectHistoryRowCount(count: number): Promise<void> {
    await expect(this.historyRows).toHaveCount(count, { timeout: 8_000 });
  }

  async expectHistoryNotEmpty(): Promise<void> {
    expect(await this.historyRows.count()).toBeGreaterThan(0);
  }
}

// ── MyNotificationsPage ───────────────────────────────────────────────────────

export class MyNotificationsPage {
  readonly page: Page;

  readonly pageTitle:       Locator;

  // Notification list
  readonly notificationItems:  Locator;
  readonly unreadBadge:        Locator;
  readonly emptyMsg:           Locator;

  // Bell icon in topbar (for unread count)
  readonly bellIcon:           Locator;
  readonly unreadCount:        Locator;

  // Mark as read
  readonly markReadButtons:    Locator;

  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /my notifications|notifications/i }).first();

    this.notificationItems = page.locator('[class*="notification"], [class*="card"]').filter({
      hasText: /event|message|subject/i,
    });
    this.unreadBadge    = page.locator('[class*="badge"], [class*="unread"]').filter({ hasText: /\d+/ });
    this.emptyMsg       = page.getByText(/no notifications|all caught up/i);

    this.bellIcon    = page.getByRole('button', { name: /notifications/i });
    this.unreadCount = page.locator('[class*="badge"]').filter({ hasText: /\d+/ });

    this.markReadButtons = page.getByRole('button', { name: /mark.*read|read/i });

    this.spinner = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/notifications');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async gotoStudentNotifications(): Promise<void> {
    await this.page.goto('/student/notifications');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async markFirstAsRead(): Promise<void> {
    const btn = this.markReadButtons.first();
    if (await btn.isVisible()) {
      await btn.click();
    }
  }

  async expectOnPage(): Promise<void> {
    await this.spinner.waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
  }

  async expectNotificationsLoaded(): Promise<void> {
    // Either items are visible OR the empty state is shown
    await expect(
      this.notificationItems.first().or(this.emptyMsg)
    ).toBeVisible({ timeout: 10_000 });
  }

  async expectNotificationVisible(partialText: string): Promise<void> {
    await expect(
      this.page.getByText(new RegExp(partialText, 'i'))
    ).toBeVisible({ timeout: 10_000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyMsg).toBeVisible({ timeout: 8_000 });
  }

  async getNotificationCount(): Promise<number> {
    return await this.notificationItems.count();
  }
}
