/**
 * auth.fixture.ts
 *
 * Extends Playwright's base `test` with role-scoped page fixtures.
 * Every role fixture restores a saved browser storage state so tests
 * start already authenticated — no repeated login round-trips.
 *
 * Usage in a spec file:
 *   import { test } from '../fixtures/auth.fixture';
 *
 *   test('admin sees students', async ({ adminPage }) => {
 *     await adminPage.goto('/admin/students');
 *     ...
 *   });
 */

import { test as base, type Page, type BrowserContext, request } from '@playwright/test';
import { AUTH_STATE, USERS, API_URL, type UserKey } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthFixtures = {
  /** Authenticated as college_admin */
  adminPage: Page;
  /** Authenticated as super_admin */
  superAdminPage: Page;
  /** Authenticated as faculty */
  facultyPage: Page;
  /** Authenticated as student */
  studentPage: Page;
  /** Authenticated as parent */
  parentPage: Page;
  /** Authenticated as examination_cell */
  examPage: Page;
  /** Authenticated as placement_cell */
  placementPage: Page;
  /** Convenience: raw API request context with admin JWT pre-set */
  adminApi: ReturnType<typeof request.newContext> extends Promise<infer T> ? T : never;
};

// ── Helper: restore a stored auth state into a fresh page ────────────────────

async function pageForRole(
  context: BrowserContext,
  stateFile: string,
): Promise<Page> {
  // storageState is set on the context at project level via the setup project;
  // here we simply open a new page on that context.
  const page = await context.newPage();
  return page;
}

// ── Extended test object ─────────────────────────────────────────────────────

export const test = base.extend<AuthFixtures>({

  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.admin });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  superAdminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.superAdmin });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  facultyPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.faculty });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  studentPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.student });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  parentPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.parent });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  examPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.examCell });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  placementPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.placementCell });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  adminApi: async ({}, use) => {
    // Read the stored admin token from localStorage saved in auth state
    const apiContext = await request.newContext({
      baseURL: API_URL,
    });
    await use(apiContext);
    await apiContext.dispose();
  },
});

export { expect } from '@playwright/test';

// ── Utility: perform a UI login and return the page ──────────────────────────
// Used by auth.setup.ts and any test that needs a fresh unauthenticated page.

export async function uiLogin(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait until we've left the login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

// ── Utility: perform a direct API login and return tokens ────────────────────
// Faster than UI login; used in setup + API-heavy fixtures.

export async function apiLogin(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; role: string }> {
  const ctx = await request.newContext({ baseURL: API_URL });
  const res = await ctx.post('/api/auth/login', {
    data: { email, password },
  });

  // Read the body BEFORE disposing the context — disposing invalidates res.
  const status = res.status();
  const bodyText = await res.text();
  await ctx.dispose();

  if (status < 200 || status >= 300) {
    throw new Error(`apiLogin failed for ${email}: ${status} ${bodyText}`);
  }

  const body = JSON.parse(bodyText);
  return body.data as { accessToken: string; refreshToken: string; role: string };
}

// ── Utility: build localStorage auth payload from a JWT ─────────────────────
// Mirrors what Login.tsx does after a successful login.

export function buildAuthStorage(
  accessToken: string,
  refreshToken: string,
  role: string,
  userId?: string,
  institutionId?: string,
): Record<string, unknown> {
  return {
    cookies: [],
    origins: [
      {
        origin: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
        localStorage: [
          {
            name: 'auth',
            value: JSON.stringify({
              accessToken,
              refreshToken,
              role,
              userId:        userId        ?? null,
              institutionId: institutionId ?? null,
              isAuthenticated: true,
            }),
          },
        ],
      },
    ],
  };
}
