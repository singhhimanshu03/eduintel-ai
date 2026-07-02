/**
 * Diagnostic: what happens when an authenticated user navigates to /login?
 */
const { chromium } = require('@playwright/test');

(async () => {
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: Log in
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('you@institution.edu').fill('admin@eduintel.edu');
  await page.getByPlaceholder('••••••••').fill('Admin@1234');
  // Check "Remember me" first
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect to /admin
  await page.waitForURL(/\/admin/, { timeout: 15000 });
  console.log('After login URL:', page.url());

  // Step 2: Navigate to /login as authenticated user
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Collect evidence
  const url        = page.url();
  const title      = await page.title();
  const bodyText   = await page.evaluate(() => document.body.textContent?.substring(0, 1000) ?? '');
  const emailInput = await page.evaluate(() => !!document.querySelector('input[type="email"]'));
  const reduxAuth  = await page.evaluate(() => {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  });

  console.log('\n1. Current URL:', url);
  console.log('2. document.body.textContent (first 1000):', bodyText.trim().substring(0, 500));
  console.log('3. document.title:', title);
  console.log('4. email input exists:', emailInput);
  console.log('5. URL diverged from /login (BrowserRouter redirected):', !url.includes('/login'));
  console.log('6. isAuthenticated in Redux:', reduxAuth?.isAuthenticated ?? 'no auth key');
  console.log('7. /login hidden because isAuthenticated = true:', !emailInput && reduxAuth?.isAuthenticated === true);

  await browser.close();
})();
