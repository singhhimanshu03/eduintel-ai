/**
 * global.teardown.ts
 *
 * Runs ONCE after the entire test suite.
 * Cleans up auth state files so stale tokens don't persist between CI runs.
 */
import * as fs from 'fs';
import * as path from 'path';

export default async function globalTeardown() {
  const authDir = path.join(process.cwd(), '.playwright-auth');
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
    console.log('[global.teardown] Removed auth state directory.');
  }
}
