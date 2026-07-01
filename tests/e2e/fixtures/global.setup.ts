/**
 * global.setup.ts
 *
 * Runs ONCE before the entire test suite.
 * Ensures the .playwright-auth directory exists so auth state files can be saved.
 * Does NOT run any browser — that is handled by auth.setup.ts (the 'setup' project).
 */
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), '.playwright-auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`[global.setup] Created auth state directory: ${authDir}`);
  }
}
