/**
 * auth.spec.ts
 *
 * Requirements covered:
 *   Req 1 — User Authentication and Session Management
 *   Req 2 — Role-Based Access Control
 *   Req 20 — Security (lockout, password hashing not tested at UI level)
 *
 * Test groups:
 *   1. Login page UI
 *   2. Successful login + role-based redirect (all 7 roles)
 *   3. Login validation errors
 *   4. Account lockout (5 bad attempts)
 *   5. RBAC — unauthorised role cannot access protected routes
 *   6. Logout
 *   7. Forgot password flow
 *   8. Register page UI
 *   9. Token refresh (via API)
 *   10. Change password (authenticated)
 */

import { test, expect } from '@playwright/test';
import { LoginPage }         from '../page-objects/LoginPage';
import { RegisterPage }      from '../page-objects/RegisterPage';
import { ForgotPasswordPage } from '../page-objects/ForgotPasswordPage';
import { ChangePasswordPage } from '../page-objects/ChangePasswordPage';
import { test as authTest }  from '../fixtures/auth.fixture';
import { USERS, API_URL, TEST_PASSWORD, AUTH_STATE } from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Login page UI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login page — UI', () => {
  test('displays logo, form, and links', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.expectLogoVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('password is hidden by default, revealed on toggle', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.expectPasswordHidden();
    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordVisible();
    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordHidden();
  });

  test('shows validation error for invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('somepassword');
    await loginPage.submit();

    await loginPage.expectEmailValidationError();
  });

  test('shows validation error when password is too short', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillEmail('user@test.edu');
    await loginPage.fillPassword('short');
    await loginPage.submit();

    await loginPage.expectPasswordValidationError();
  });

  test('submit button is enabled only when form has values', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill valid data — button should be enabled
    await loginPage.fillEmail(USERS.admin.email);
    await loginPage.fillPassword(USERS.admin.password);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('remember-me pre-fills email on next visit', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.checkRememberMe();
    await loginPage.fillEmail(USERS.admin.email);
    await loginPage.fillPassword(USERS.admin.password);
    await loginPage.submit();
    await loginPage.expectRedirectedTo('/admin');

    // Navigate back to login in same browser context
    await page.goto('/login');
    await expect(loginPage.emailInput).toHaveValue(USERS.admin.email);
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const html = page.locator('html');
    const initialClass = await html.getAttribute('class') ?? '';

    await loginPage.toggleTheme();

    const newClass = await html.getAttribute('class') ?? '';
    expect(newClass).not.toEqual(initialClass);
  });

  test('register link navigates to /register', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickRegister();
    await expect(page).toHaveURL(/\/register/);
  });

  test('forgot-password link navigates to /forgot-password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Successful login — role-based redirects (Req 1.1, Req 2.2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Successful login — role redirects', () => {
  for (const [key, user] of Object.entries(USERS)) {
    test(`${user.role} → redirected to ${user.homeRoute}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
      await loginPage.expectRedirectedTo(user.homeRoute);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Login failures (Req 1.3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login failures', () => {
  test('wrong password shows error banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectFailure(USERS.admin.email, 'WrongPassword99!');
    await loginPage.expectErrorVisible();
  });

  test('non-existent email shows error banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectFailure('ghost@nowhere.edu', 'SomePassword1!');
    await loginPage.expectErrorVisible();
  });

  test('stays on /login after failed attempt', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectFailure(USERS.admin.email, 'BadPass123!');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Account lockout after 5 failed attempts (Req 1.4)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Account lockout', () => {
  // Use a unique email per test run to avoid polluting other tests
  const LOCKOUT_EMAIL = `lockout_${Date.now()}@test.edu`;

  test.beforeAll(async ({ request }) => {
    // Register the lockout test account via API
    await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email:         LOCKOUT_EMAIL,
        password:      TEST_PASSWORD,
        role:          'student',
        institutionId: undefined,
      },
    });
  });

  test('account is locked after 5 consecutive bad passwords (Req 1.4)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // 5 bad attempts
    for (let i = 0; i < 5; i++) {
      await loginPage.fillEmail(LOCKOUT_EMAIL);
      await loginPage.fillPassword(`WrongPass${i}!`);
      await loginPage.submit();
      await loginPage.errorBanner.first().waitFor({ state: 'visible', timeout: 8_000 });
    }

    // 6th attempt — should show locked message
    await loginPage.fillEmail(LOCKOUT_EMAIL);
    await loginPage.fillPassword(`WrongPass6!`);
    await loginPage.submit();
    await loginPage.expectErrorVisible('locked');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. RBAC — unauthorised role redirected or denied (Req 2.2, 2.3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('RBAC — role guards', () => {
  test('student cannot access /admin — redirected to /unauthorized or /login', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUTH_STATE.student });
    const page = await ctx.newPage();

    await page.goto('/admin');
    // Should be bounced away from /admin
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 8_000 });
    await ctx.close();
  });

  test('faculty cannot access /admin', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUTH_STATE.faculty });
    const page = await ctx.newPage();

    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 8_000 });
    await ctx.close();
  });

  test('student cannot access /exam', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUTH_STATE.student });
    const page = await ctx.newPage();

    await page.goto('/exam');
    await expect(page).not.toHaveURL(/\/exam$/, { timeout: 8_000 });
    await ctx.close();
  });

  test('parent cannot access /placement', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUTH_STATE.parent });
    const page = await ctx.newPage();

    await page.goto('/placement');
    await expect(page).not.toHaveURL(/\/placement$/, { timeout: 8_000 });
    await ctx.close();
  });

  test('unauthenticated user accessing /admin is redirected to /login', async ({ page }) => {
    // No auth state — fresh context
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('unauthenticated user accessing /student is redirected to /login', async ({ page }) => {
    await page.goto('/student');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('authenticated admin accessing / is redirected to /admin', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUTH_STATE.admin });
    const page = await ctx.newPage();

    await page.goto('/');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await ctx.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Logout (Req 1.2 — refresh token revoked)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout clears session and redirects to /login', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUTH_STATE.admin });
    const page = await ctx.newPage();

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);

    // Find and click logout — typically in the topbar
    const logoutBtn = page.getByRole('button', { name: /log ?out|sign ?out/i });
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // After logout, navigating to /admin should redirect back to /login
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await ctx.close();
  });

  test('logout via API revokes refresh token (Req 1.2)', async ({ request }) => {
    // Get tokens via API login
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.admin.email, password: USERS.admin.password },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { data } = await loginRes.json();

    // Logout
    const logoutRes = await request.post(`${API_URL}/api/auth/logout`, {
      data: { refreshToken: data.refreshToken },
    });
    expect(logoutRes.ok()).toBeTruthy();

    // Attempt to refresh — should fail
    const refreshRes = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken: data.refreshToken },
    });
    expect(refreshRes.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Forgot password flow (Req 1.5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Forgot password', () => {
  test('submitting a valid email shows confirmation message (Req 1.5)', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.requestReset(USERS.admin.email);
    await fp.expectSuccessMessage();
  });

  test('submitting unknown email still shows confirmation (no user enumeration)', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.requestReset('ghost@nowhere.edu');
    await fp.expectSuccessMessage();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Register page UI (Req 1.7)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Register page', () => {
  test('displays all required fields', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.roleSelect).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test('all 6 non-super-admin roles available in dropdown', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.expectAllRolesAvailable();
  });

  test('shows email validation error for invalid email', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillEmail('not-valid');
    await registerPage.fillPassword(TEST_PASSWORD);
    await registerPage.selectRole('student');
    await registerPage.submit();

    await registerPage.expectEmailValidationError();
  });

  test('shows password length validation error', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillEmail('new@test.edu');
    await registerPage.fillPassword('short');
    await registerPage.selectRole('student');
    await registerPage.submit();

    await registerPage.expectPasswordValidationError();
  });

  test('shows institution UUID validation error for malformed UUID', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillEmail('new@test.edu');
    await registerPage.fillPassword(TEST_PASSWORD);
    await registerPage.selectRole('college_admin');
    await registerPage.fillInstitutionId('not-a-uuid');
    await registerPage.submit();

    await registerPage.expectInstitutionValidationError();
  });

  test('successful registration shows email verification prompt (Req 1.7)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    const uniqueEmail = `register_test_${Date.now()}@test.edu`;
    await registerPage.register(uniqueEmail, TEST_PASSWORD, 'student');
    await registerPage.expectSuccessState();
  });

  test('sign-in link navigates to /login', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.clickSignIn();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Token refresh (Req 1.2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Token refresh — API', () => {
  test('valid refresh token returns new access token (Req 1.2)', async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.admin.email, password: USERS.admin.password },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { data } = await loginRes.json();

    const refreshRes = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken: data.refreshToken },
    });
    expect(refreshRes.ok()).toBeTruthy();
    const refreshBody = await refreshRes.json();
    expect(refreshBody.data.accessToken).toBeTruthy();
    expect(refreshBody.data.accessToken).not.toEqual(data.accessToken);
  });

  test('expired / invalid refresh token returns 401 (Req 1.3)', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken: 'invalid-token-00000000' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Change password (Req 1.6 — authenticated user)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Change password', () => {
  authTest('change-password page is accessible when authenticated', async ({ adminPage }) => {
    const cpPage = new ChangePasswordPage(adminPage);
    await cpPage.goto();
    await cpPage.expectOnPage();
  });

  authTest('shows mismatch error when confirm password differs', async ({ adminPage }) => {
    const cpPage = new ChangePasswordPage(adminPage);
    await cpPage.goto();

    await cpPage.fillCurrentPassword(TEST_PASSWORD);
    await cpPage.fillNewPassword('NewPassword@1');
    await cpPage.fillConfirmPassword('DifferentPassword@2');
    await cpPage.submit();

    await cpPage.expectMismatchError();
  });

  authTest('shows min-length error for short new password', async ({ adminPage }) => {
    const cpPage = new ChangePasswordPage(adminPage);
    await cpPage.goto();

    await cpPage.fillCurrentPassword(TEST_PASSWORD);
    await cpPage.fillNewPassword('short');
    await cpPage.fillConfirmPassword('short');
    await cpPage.submit();

    await cpPage.expectMinLengthError();
  });

  authTest('shows error when current password is wrong', async ({ adminPage }) => {
    const cpPage = new ChangePasswordPage(adminPage);
    await cpPage.goto();

    await cpPage.changePassword('WrongCurrent@99', 'NewPassword@1', 'NewPassword@1');
    await cpPage.expectError();
  });

  authTest('cancel button navigates back', async ({ adminPage }) => {
    const cpPage = new ChangePasswordPage(adminPage);
    await adminPage.goto('/admin');
    await adminPage.goto('/change-password');
    await cpPage.cancel();
    // Should navigate back (to previous page or root)
    await expect(adminPage).not.toHaveURL(/\/change-password/, { timeout: 8_000 });
  });
});
