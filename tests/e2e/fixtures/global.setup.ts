/**
 * global.setup.ts
 *
 * Runs ONCE before the entire test suite.
 * Ensures the .playwright-auth directory exists so auth state files can be saved.
 * Loads .env into process.env so all worker processes inherit the values.
 * Does NOT run any browser — that is handled by auth.setup.ts (the 'setup' project).
 */
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  // Load .env into process.env — workers are forked after globalSetup and inherit this.
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }

  const authDir = path.join(process.cwd(), '.playwright-auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`[global.setup] Created auth state directory: ${authDir}`);
  }
}
