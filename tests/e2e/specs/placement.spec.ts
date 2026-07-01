/**
 * placement.spec.ts
 *
 * Requirements covered:
 *   Req 15 — Placement Cell Module
 *
 * Test groups:
 *   1. Placement overview — UI, nav, RBAC
 *   2. Company management — seed data, add company
 *   3. Recruitment drives — seed data, eligible students
 *   4. Placement profile (AI) — page load
 *   5. API — placement service
 */

import { test as authTest, expect } from '../fixtures/auth.fixture';
import { test }                      from '@playwright/test';
import {
  PlacementOverviewPage,
  CompanyManagementPage,
  RecruitmentDrivesPage,
  PlacementProfilePage,
} from '../page-objects/PlacementDashboardPage';
import { STUDENT_IDS, COMPANY_IDS, API_URL, TEST_PASSWORD, INSTITUTION_ID } from '../fixtures/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Placement overview — UI & nav (Req 15)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Placement overview — UI (Req 15)', () => {
  authTest('page loads on /placement', async ({ placementPage }) => {
    const overview = new PlacementOverviewPage(placementPage);
    await overview.goto();
    await overview.expectOnPlacementDashboard();
  });

  authTest('nav items are all present', async ({ placementPage }) => {
    const overview = new PlacementOverviewPage(placementPage);
    await overview.goto();
    await overview.expectNavPresent();
  });

  authTest('navigates to companies page', async ({ placementPage }) => {
    const overview = new PlacementOverviewPage(placementPage);
    await overview.goto();
    await overview.goToCompanies();
    await expect(placementPage).toHaveURL(/\/placement\/companies/);
  });

  authTest('navigates to drives page', async ({ placementPage }) => {
    const overview = new PlacementOverviewPage(placementPage);
    await overview.goto();
    await overview.goToDrives();
    await expect(placementPage).toHaveURL(/\/placement\/drives/);
  });

  authTest('navigates to AI profile page', async ({ placementPage }) => {
    const overview = new PlacementOverviewPage(placementPage);
    await overview.goto();
    await overview.goToProfile();
    await expect(placementPage).toHaveURL(/\/placement\/profile/);
  });

  authTest('student cannot access /placement', async ({ studentPage }) => {
    await studentPage.goto('/placement');
    await expect(studentPage).not.toHaveURL(/\/placement$/, { timeout: 8_000 });
  });

  authTest('faculty cannot access /placement', async ({ facultyPage }) => {
    await facultyPage.goto('/placement');
    await expect(facultyPage).not.toHaveURL(/\/placement$/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Company management (Req 15.3)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Company management (Req 15.3)', () => {
  authTest('page loads on /placement/companies', async ({ placementPage }) => {
    const companyPage = new CompanyManagementPage(placementPage);
    await companyPage.goto();
    await companyPage.expectOnPage();
  });

  authTest('seed companies are all visible (Req 15.3)', async ({ placementPage }) => {
    const companyPage = new CompanyManagementPage(placementPage);
    await companyPage.goto();
    await companyPage.expectSeedCompaniesLoaded();
  });

  authTest('shows at least 5 seed companies', async ({ placementPage }) => {
    const companyPage = new CompanyManagementPage(placementPage);
    await companyPage.goto();
    const count = await companyPage.getRowCount();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  authTest('Add Company form opens on button click', async ({ placementPage }) => {
    const companyPage = new CompanyManagementPage(placementPage);
    await companyPage.goto();
    await companyPage.openAddForm();
    await expect(companyPage.saveBtn).toBeVisible();
  });

  authTest('adds a new company and it appears in the list (Req 15.3)', async ({ placementPage }) => {
    const companyPage = new CompanyManagementPage(placementPage);
    await companyPage.goto();

    const ts = Date.now();
    await companyPage.addCompany({
      companyName: `E2E Corp ${ts}`,
      industry:    'Fintech',
      ctcMin:      6.0,
      ctcMax:      15.0,
      role:        'Backend Engineer',
    });

    await companyPage.expectCompanyVisible(`E2E Corp ${ts}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Recruitment drives (Req 15.2)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Recruitment drives (Req 15.2)', () => {
  authTest('page loads on /placement/drives', async ({ placementPage }) => {
    const drivesPage = new RecruitmentDrivesPage(placementPage);
    await drivesPage.goto();
    await drivesPage.expectOnPage();
  });

  authTest('seed drives are visible (2 active drives in seed)', async ({ placementPage }) => {
    const drivesPage = new RecruitmentDrivesPage(placementPage);
    await drivesPage.goto();
    await drivesPage.expectSeedDrivesVisible();
  });

  authTest('eligible students section renders (Req 15.2)', async ({ placementPage }) => {
    const drivesPage = new RecruitmentDrivesPage(placementPage);
    await drivesPage.goto();
    await drivesPage.expectEligibleStudentsSection();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Placement profile page (Req 15.5, 15.6)
// ─────────────────────────────────────────────────────────────────────────────

authTest.describe('Placement profile — AI (Req 15.5, 15.6)', () => {
  authTest('page loads on /placement/profile', async ({ placementPage }) => {
    const profilePage = new PlacementProfilePage(placementPage);
    await profilePage.goto();
    await profilePage.expectOnPage();
  });

  authTest('readiness score section is visible (Req 15.5)', async ({ placementPage }) => {
    const profilePage = new PlacementProfilePage(placementPage);
    await profilePage.goto();
    await profilePage.expectReadinessScoreVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. API — placement service (Req 15)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Placement service — API (Req 15)', () => {
  let placementToken: string;
  let adminToken:     string;

  test.beforeAll(async ({ request }) => {
    const [plRes, admRes] = await Promise.all([
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'placement@eduintel.edu', password: TEST_PASSWORD },
      }),
      request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'admin@eduintel.edu', password: TEST_PASSWORD },
      }),
    ]);
    placementToken = (await plRes.json()).data?.accessToken ?? '';
    adminToken     = (await admRes.json()).data?.accessToken ?? '';
  });

  test('GET /api/placement/companies returns seed companies (Req 15.3)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/companies`, {
      headers: {
        Authorization: `Bearer ${placementToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThanOrEqual(5);
    const names = body.data.map((c: { company_name: string }) => c.company_name);
    expect(names).toContain('Infosys');
    expect(names).toContain('Google');
  });

  test('POST /api/placement/companies creates a company (Req 15.3)', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${API_URL}/api/placement/companies`, {
      headers: {
        Authorization: `Bearer ${placementToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
      data: {
        companyName: `API Corp ${ts}`,
        industry:    'Healthcare',
        ctcMin:      8.0,
        ctcMax:      20.0,
        role:        'Data Engineer',
        isActive:    true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.company_name).toBe(`API Corp ${ts}`);
  });

  test('GET /api/placement/drives returns seed drives (Req 15.2)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/drives`, {
      headers: {
        Authorization: `Bearer ${placementToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/placement/drives/:id/eligible returns eligible students (Req 15.2)', async ({ request }) => {
    // Infosys drive — min_cgpa 6.0, max_backlogs 2
    const res = await request.get(
      `${API_URL}/api/placement/drives/e0000000-0000-0000-0000-000000000001/eligible`,
      {
        headers: {
          Authorization: `Bearer ${placementToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    // At least arjunMehta (9.2 cgpa, 0 backlogs) should be eligible
    const ids = body.data.map((s: { student_id: string }) => s.student_id);
    expect(ids).toContain(STUDENT_IDS.vikramSingh);
  });

  test('GET /api/placement/profiles returns placement profiles (Req 15.1)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/profiles`, {
      headers: {
        Authorization: `Bearer ${placementToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThanOrEqual(4);
  });

  test('GET /api/placement/profiles/:studentId returns profile with readiness score (Req 15.1, 15.5)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/placement/profiles/${STUDENT_IDS.vikramSingh}`,
      {
        headers: {
          Authorization: `Bearer ${placementToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveProperty('cgpa');
    expect(body.data).toHaveProperty('readiness_score');
    expect(body.data).toHaveProperty('skill_tags');
    expect(body.data.readiness_score).toBeGreaterThanOrEqual(0);
    expect(body.data.readiness_score).toBeLessThanOrEqual(100);
  });

  test('GET /api/placement/analytics returns stats (Req 15.7)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/analytics`, {
      headers: {
        Authorization: `Bearer ${placementToken}`,
        'x-institution-id': INSTITUTION_ID,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    // Analytics should have some placement stats
    expect(body.data).toBeDefined();
  });

  test('Google drive filters to students with CGPA >= 8.0 (Req 15.2)', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/placement/drives/e0000000-0000-0000-0000-000000000002/eligible`,
      {
        headers: {
          Authorization: `Bearer ${placementToken}`,
          'x-institution-id': INSTITUTION_ID,
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // All returned students must have CGPA >= 8.0
    for (const student of body.data as Array<{ cgpa: number }>) {
      expect(student.cgpa).toBeGreaterThanOrEqual(8.0);
    }
  });

  test('GET /api/placement/companies — unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/placement/companies`);
    expect(res.status()).toBe(401);
  });
});
