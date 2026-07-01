/**
 * auth.setup.ts
 *
 * Runs once as the 'setup' Playwright project (see playwright.config.ts).
 * For every role it:
 *   1. Calls the auth API directly (faster than UI — no JS bundle needed)
 *   2. Decodes the returned JWT to extract userId + institutionId
 *   3. Writes a storageState JSON file that subsequent test projects reuse
 *
 * If a seed user doesn't have a real password hash yet (first run), this
 * setup will attempt to register the account first, then log in.
 */

import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { USERS, AUTH_STATE, API_URL, TEST_PASSWORD, INSTITUTION_ID, type UserKey } from '../fixtures/constants';
import { apiLogin, buildAuthStorage } from '../fixtures/auth.fixture';

const AUTH_DIR = path.join(process.cwd(), '.playwright-auth');

// ── Helper: decode JWT payload (no verification needed in test context) ───────
function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

// ── Helper: register a user if they don't have a valid password hash ──────────
async function ensureRegistered(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  role: string,
  institutionId?: string,
): Promise<void> {
  const res = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      email,
      password: TEST_PASSWORD,
      role,
      institutionId: institutionId ?? undefined,
    },
  });
  // 201 = registered, 409/400 with duplicate = already exists — both are fine
  if (!res.ok() && res.status() !== 409 && res.status() !== 400) {
    const body = await res.text();
    // Only fail if the error is NOT a duplicate-email conflict
    if (!body.includes('duplicate') && !body.includes('already') && !body.includes('unique')) {
      console.warn(`[auth.setup] register ${email}: ${res.status()} ${body}`);
    }
  }
}

// ── Helper: write auth state for one role ────────────────────────────────────
async function setupRole(
  request: import('@playwright/test').APIRequestContext,
  key: UserKey,
): Promise<void> {
  const user = USERS[key];
  const stateFile = AUTH_STATE[key];

  // 1. Ensure the account exists with the test password
  await ensureRegistered(
    request,
    user.email,
    user.role,
    'institutionId' in user ? (user as { institutionId: string }).institutionId : undefined,
  );

  // 2. Log in via API
  let tokens: { accessToken: string; refreshToken: string; role: string };
  try {
    tokens = await apiLogin(user.email, user.password);
  } catch (err) {
    console.error(`[auth.setup] Login failed for ${user.email}:`, err);
    throw err;
  }

  // 3. Extract claims from JWT
  const claims = decodeJwt(tokens.accessToken);

  // 4. Build and persist the storage state
  const storage = buildAuthStorage(
    tokens.accessToken,
    tokens.refreshToken,
    tokens.role,
    claims.userId as string | undefined,
    claims.institutionId as string | undefined,
  );

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(storage, null, 2), 'utf8');
  console.log(`[auth.setup] ✓ ${key} (${user.email}) → ${path.basename(stateFile)}`);
}

// ── Setup tests — one per role, run in parallel ──────────────────────────────

setup('authenticate as college_admin', async ({ request }) => {
  await setupRole(request, 'admin');
});

setup('authenticate as super_admin', async ({ request }) => {
  await setupRole(request, 'superAdmin');
});

setup('authenticate as faculty', async ({ request }) => {
  await setupRole(request, 'faculty');
});

setup('authenticate as student', async ({ request }) => {
  await setupRole(request, 'student');
});

setup('authenticate as parent', async ({ request }) => {
  await setupRole(request, 'parent');
});

setup('authenticate as examination_cell', async ({ request }) => {
  await setupRole(request, 'examCell');
});

setup('authenticate as placement_cell', async ({ request }) => {
  await setupRole(request, 'placementCell');
});
