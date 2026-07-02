/**
 * Shared test constants — credentials, IDs, and URLs derived from
 * the development seed data (db/init/11_seed_data.sql).
 *
 * Passwords are the ones registered via the app's /register flow on top
 * of the seed users (the seed SQL uses PLACEHOLDER hashes; tests use the
 * TEST_PASSWORD environment variable, defaulting to the value below).
 */

// ── Base URLs ─────────────────────────────────────────────────────────────────
export const BASE_URL  = process.env.PLAYWRIGHT_BASE_URL  ?? 'http://localhost:3000';
export const API_URL   = process.env.PLAYWRIGHT_API_URL   ?? 'http://localhost:80';

// ── Default test password (used when registering/seeding test accounts) ───────
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin@1234';

// ── Institution ───────────────────────────────────────────────────────────────
export const INSTITUTION_ID = '10000000-0000-0000-0000-000000000001';

// ── Seed user accounts ────────────────────────────────────────────────────────
export const USERS = {
  superAdmin: {
    email:       'superadmin@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'super_admin',
    homeRoute:   '/admin',
  },
  admin: {
    email:       'admin@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'college_admin',
    homeRoute:   '/admin',
    institutionId: INSTITUTION_ID,
  },
  faculty: {
    email:       'faculty1@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'faculty',
    homeRoute:   '/faculty',
    institutionId: INSTITUTION_ID,
  },
  student: {
    email:       'student1@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'student',
    homeRoute:   '/student',
    institutionId: INSTITUTION_ID,
  },
  parent: {
    email:       'parent1@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'parent',
    homeRoute:   '/parent',
    institutionId: INSTITUTION_ID,
  },
  examCell: {
    email:       'exam@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'examination_cell',
    homeRoute:   '/exam',
    institutionId: INSTITUTION_ID,
  },
  placementCell: {
    email:       'placement@eduintel.edu',
    password:    TEST_PASSWORD,
    role:        'placement_cell',
    homeRoute:   '/placement',
    institutionId: INSTITUTION_ID,
  },
} as const;

export type UserKey = keyof typeof USERS;

// ── Auth state file paths — one per role ─────────────────────────────────────
import * as path from 'path';
const AUTH_DIR = path.join(process.cwd(), '.playwright-auth');

export const AUTH_STATE = {
  superAdmin:    path.join(AUTH_DIR, 'super_admin.json'),
  admin:         path.join(AUTH_DIR, 'college_admin.json'),
  faculty:       path.join(AUTH_DIR, 'faculty.json'),
  student:       path.join(AUTH_DIR, 'student.json'),
  parent:        path.join(AUTH_DIR, 'parent.json'),
  examCell:      path.join(AUTH_DIR, 'examination_cell.json'),
  placementCell: path.join(AUTH_DIR, 'placement_cell.json'),
} as const;

// ── Known seed student IDs (from 11_seed_data.sql) ────────────────────────────
export const STUDENT_IDS = {
  arjunMehta:  '00000000-0000-0000-0000-000000000003',
  priyaSharma: '00000000-0000-0000-0000-000000000004',
  rahulGupta:  'a0000000-0000-0000-0000-000000000003',
  snehaPatel:  'a0000000-0000-0000-0000-000000000004',
  vikramSingh: 'a0000000-0000-0000-0000-000000000005',
} as const;

// ── Known seed company IDs (from 11_seed_data.sql) ───────────────────────────
export const COMPANY_IDS = {
  infosys: 'd0000000-0000-0000-0000-000000000001',
  tcs:     'd0000000-0000-0000-0000-000000000002',
  google:  'd0000000-0000-0000-0000-000000000003',
  wipro:   'd0000000-0000-0000-0000-000000000004',
  zoho:    'd0000000-0000-0000-0000-000000000005',
} as const;

// ── Timeouts ─────────────────────────────────────────────────────────────────
export const TIMEOUTS = {
  navigation: 15_000,
  api:         8_000,
  animation:   1_000,
  toast:       5_000,
} as const;
