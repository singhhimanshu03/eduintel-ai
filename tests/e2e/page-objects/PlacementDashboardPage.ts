/**
 * PlacementDashboardPage.ts
 *
 * Page Objects for the placement_cell role dashboard and its sub-pages:
 *   /placement             → PlacementOverview
 *   /placement/companies   → CompanyManagement
 *   /placement/drives      → RecruitmentDrives
 *   /placement/profile     → PlacementProfile (AI)
 */

import { type Page, type Locator, expect } from '@playwright/test';

// ── PlacementOverviewPage ─────────────────────────────────────────────────────

export class PlacementOverviewPage {
  readonly page: Page;

  readonly pageTitle:        Locator;
  readonly totalPlacedStat:  Locator;
  readonly analyticsSection: Locator;
  readonly spinner:          Locator;

  // Nav
  readonly navCompanies: Locator;
  readonly navDrives:    Locator;
  readonly navProfile:   Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle        = page.getByRole('heading', { name: /placement/i }).first();
    this.totalPlacedStat  = page.getByText(/total placed|placed students/i).first();
    this.analyticsSection = page.getByText(/analytics|by company|by department/i).first();
    this.spinner          = page.getByText(/loading/i);

    this.navCompanies = page.getByRole('link', { name: /^companies$/i });
    this.navDrives    = page.getByRole('link', { name: /^drives$/i });
    this.navProfile   = page.getByRole('link', { name: /ai profile/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/placement');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async goToCompanies(): Promise<void> {
    await this.navCompanies.click();
    await this.page.waitForURL(/\/placement\/companies/);
  }

  async goToDrives(): Promise<void> {
    await this.navDrives.click();
    await this.page.waitForURL(/\/placement\/drives/);
  }

  async goToProfile(): Promise<void> {
    await this.navProfile.click();
    await this.page.waitForURL(/\/placement\/profile/);
  }

  async expectOnPlacementDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/placement$/);
    await this.spinner.waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
  }

  async expectNavPresent(): Promise<void> {
    await expect(this.navCompanies).toBeVisible();
    await expect(this.navDrives).toBeVisible();
    await expect(this.navProfile).toBeVisible();
  }
}

// ── CompanyManagementPage ─────────────────────────────────────────────────────

export interface CompanyFormData {
  companyName: string;
  industry:    string;
  ctcMin:      number;
  ctcMax:      number;
  role:        string;
}

export class CompanyManagementPage {
  readonly page: Page;

  readonly pageTitle:    Locator;
  readonly addBtn:       Locator;
  readonly cancelBtn:    Locator;

  // Form fields
  readonly companyNameInput: Locator;
  readonly industryInput:    Locator;
  readonly ctcMinInput:      Locator;
  readonly ctcMaxInput:      Locator;
  readonly roleInput:        Locator;
  readonly saveBtn:          Locator;
  readonly formError:        Locator;

  // Table
  readonly table:     Locator;
  readonly tableRows: Locator;
  readonly emptyMsg:  Locator;

  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByRole('heading', { name: /company|companies/i }).first();
    this.addBtn    = page.getByRole('button', { name: /\+ add company/i });
    this.cancelBtn = page.getByRole('button', { name: /cancel/i });

    this.companyNameInput = page.getByLabel(/company name/i).or(page.getByPlaceholder(/infosys|company/i));
    this.industryInput    = page.getByLabel(/industry/i).or(page.getByPlaceholder(/IT services|industry/i));
    this.ctcMinInput      = page.getByLabel(/ctc min|minimum ctc/i).or(page.getByPlaceholder(/3\.5|min/i));
    this.ctcMaxInput      = page.getByLabel(/ctc max|maximum ctc/i).or(page.getByPlaceholder(/8\.0|max/i));
    this.roleInput        = page.getByLabel(/^role$/i).or(page.getByPlaceholder(/software engineer|role/i));
    this.saveBtn          = page.getByRole('button', { name: /save company|add company|create/i });
    this.formError        = page.getByText(/failed to|error/i).first();

    this.table     = page.getByRole('table');
    this.tableRows = page.getByRole('table').getByRole('row').filter({
      hasNot: page.getByRole('columnheader'),
    });
    this.emptyMsg = page.getByText(/no companies/i);

    this.spinner = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/placement/companies');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async openAddForm(): Promise<void> {
    await this.addBtn.click();
    await expect(this.saveBtn).toBeVisible({ timeout: 5_000 });
  }

  async fillForm(data: CompanyFormData): Promise<void> {
    await this.companyNameInput.fill(data.companyName);
    await this.industryInput.fill(data.industry);
    await this.ctcMinInput.fill(String(data.ctcMin));
    await this.ctcMaxInput.fill(String(data.ctcMax));
    await this.roleInput.fill(data.role);
  }

  async submitForm(): Promise<void> {
    await this.saveBtn.click();
  }

  async addCompany(data: CompanyFormData): Promise<void> {
    await this.openAddForm();
    await this.fillForm(data);
    await this.submitForm();
    await expect(this.saveBtn).toBeHidden({ timeout: 10_000 });
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/placement\/companies/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectCompanyVisible(name: string): Promise<void> {
    await expect(this.tableRows.filter({ hasText: name })).toBeVisible({ timeout: 10_000 });
  }

  async expectSeedCompaniesLoaded(): Promise<void> {
    // Seed has Infosys, TCS, Google, Wipro, Zoho
    for (const company of ['Infosys', 'TCS', 'Google']) {
      await expect(this.tableRows.filter({ hasText: company })).toBeVisible({ timeout: 10_000 });
    }
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async expectAtLeastOneCompany(): Promise<void> {
    expect(await this.getRowCount()).toBeGreaterThan(0);
  }
}

// ── RecruitmentDrivesPage ─────────────────────────────────────────────────────

export interface DriveFormData {
  companyId:      string;
  minCgpa:        number;
  maxBacklogs:    number;
  graduationYear: number;
  interviewDate:  string; // YYYY-MM-DD
  venue:          string;
}

export class RecruitmentDrivesPage {
  readonly page: Page;

  readonly pageTitle:    Locator;
  readonly addDriveBtn:  Locator;

  // Drive form
  readonly companySelect:       Locator;
  readonly minCgpaInput:        Locator;
  readonly maxBacklogsInput:    Locator;
  readonly graduationYearInput: Locator;
  readonly interviewDateInput:  Locator;
  readonly venueInput:          Locator;
  readonly saveDriveBtn:        Locator;
  readonly formError:           Locator;

  // Eligible students filter
  readonly eligibleStudentsSection: Locator;
  readonly eligibleStudentRows:     Locator;

  // Drives table / cards
  readonly driveCards: Locator;
  readonly emptyMsg:   Locator;

  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle   = page.getByRole('heading', { name: /recruitment drives|drives/i }).first();
    this.addDriveBtn = page.getByRole('button', { name: /\+ add drive|create drive/i });

    this.companySelect       = page.getByLabel(/company/i).or(page.getByRole('combobox').first());
    this.minCgpaInput        = page.getByLabel(/min.*cgpa|cgpa/i).or(page.getByPlaceholder(/6\.0|cgpa/i));
    this.maxBacklogsInput    = page.getByLabel(/max.*backlogs?|backlogs?/i).or(page.getByPlaceholder(/0|backlogs?/i));
    this.graduationYearInput = page.getByLabel(/graduation year/i).or(page.getByPlaceholder(/2025/));
    this.interviewDateInput  = page.locator('input[type="date"]').first();
    this.venueInput          = page.getByLabel(/venue/i).or(page.getByPlaceholder(/auditorium|venue/i));
    this.saveDriveBtn        = page.getByRole('button', { name: /save drive|create drive|add drive/i });
    this.formError           = page.getByText(/failed|error/i).first();

    this.eligibleStudentsSection = page.getByText(/eligible students/i).first();
    this.eligibleStudentRows     = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /cgpa|student/i });

    this.driveCards = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /active|scheduled/i });
    this.emptyMsg   = page.getByText(/no drives|no recruitment/i);

    this.spinner = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/placement/drives');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/placement\/drives/);
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectSeedDrivesVisible(): Promise<void> {
    // Seed has 2 active drives
    const count = await this.driveCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  }

  async expectEligibleStudentsSection(): Promise<void> {
    await expect(this.eligibleStudentsSection).toBeVisible({ timeout: 10_000 });
  }
}

// ── PlacementProfilePage ──────────────────────────────────────────────────────

export class PlacementProfilePage {
  readonly page: Page;

  readonly pageTitle:          Locator;
  readonly readinessScore:     Locator;
  readonly skillGapSection:    Locator;
  readonly missingSkillsList:  Locator;
  readonly recommendationList: Locator;
  readonly spinner:            Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle         = page.getByRole('heading', { name: /placement.*profile|ai.*placement/i }).first();
    this.readinessScore    = page.getByText(/readiness score/i).first();
    this.skillGapSection   = page.getByText(/skill gap/i).first();
    this.missingSkillsList = page.getByText(/missing skills|skill gap/i);
    this.recommendationList = page.getByText(/recommendation/i).first();
    this.spinner            = page.getByText(/loading/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/placement/profile');
    await this.page.waitForLoadState('networkidle');
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/placement\/profile/);
  }

  async expectReadinessScoreVisible(): Promise<void> {
    await expect(this.readinessScore).toBeVisible({ timeout: 10_000 });
  }

  async expectSkillGapVisible(): Promise<void> {
    await expect(this.skillGapSection).toBeVisible({ timeout: 10_000 });
  }
}
