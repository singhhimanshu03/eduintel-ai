import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * EduIntel AI — Playwright configuration
 *
 * Targets the running Docker Compose stack (frontend on :3000, API gateway on :80).
 * Run with:
 *   npx playwright test               — full suite
 *   npx playwright test --project=chromium
 *   npx playwright test tests/e2e/specs/auth.spec.ts
 */

// Auth state files — one per role, stored in .playwright-auth/ (git-ignored)
export const AUTH_DIR = path.join(__dirname, '.playwright-auth');

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────────────────
  testDir: './tests/e2e/specs',
  testMatch: '**/*.spec.ts',

  // ── Global settings ─────────────────────────────────────────────────────────
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  // ── Reporters ────────────────────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  // ── Shared browser context defaults ─────────────────────────────────────────
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',

    // Always capture on failure
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',

    // Consistent viewport
    viewport: { width: 1280, height: 800 },

    // Don't slow-mo in CI; 50ms locally makes it watchable
    launchOptions: {
      slowMo: process.env.CI ? 0 : 0,
      // Use system Chrome when the Playwright-managed Chromium binary is absent
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        || (() => {
          const sysPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          ];
          const fs = require('fs') as typeof import('fs');
          return sysPaths.find(p => fs.existsSync(p)) ?? undefined;
        })(),
    },

    // Inject base API URL into every page via env var
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // ── Output ───────────────────────────────────────────────────────────────────
  outputDir: 'test-results',

  // ── Projects ─────────────────────────────────────────────────────────────────
  projects: [
    // ── Setup project: creates stored auth state for every role ────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Main browsers — each reuses the stored auth states ─────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },

    // ── Mobile viewports ────────────────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },

    // ── API-only project (no browser) for direct service tests ─────────────────
    {
      name: 'api',
      testMatch: '**/api/*.spec.ts',
      use: {
        baseURL: process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:80',
      },
    },
  ],

  // ── Global setup / teardown ─────────────────────────────────────────────────
  globalSetup: './tests/e2e/fixtures/global.setup.ts',
  globalTeardown: './tests/e2e/fixtures/global.teardown.ts',

  // ── Web server (optional — comment out if stack is already running) ──────────
  // webServer: {
  //   command: 'docker compose up -d --wait',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
});
