/**
 * Captures the exact outerHTML of every element rendered at the moment
 * the login error appears — by polling the DOM immediately after the 401 response.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();

  // Capture the 401 response, then immediately dump the DOM
  let errorDumpDone = false;

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth/login') && response.status() === 401 && !errorDumpDone) {
      errorDumpDone = true;
      // Small wait for React to commit the state update
      await page.waitForTimeout(500);

      const dump = await page.evaluate(() => {
        const results = [];
        // Every element that has "Invalid credentials" or "Login failed" in its text
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent || '';
          if (text.includes('Invalid credentials') || text.includes('Login failed')) {
            results.push({
              tag: node.tagName,
              className: node.className,
              style: node.getAttribute('style'),
              outerHTML: node.outerHTML.substring(0, 500),
            });
          }
        }
        return results;
      });

      console.log('=== DOM AT 200ms AFTER 401 ===');
      if (dump.length === 0) {
        console.log('NO ELEMENTS FOUND with error text at 200ms');
      } else {
        dump.forEach((el, i) => {
          console.log(`\n[${i}] tag=${el.tag} class="${el.className}" style="${el.style}"`);
          console.log(`    outerHTML: ${el.outerHTML}`);
        });
      }

      // Also try at 50ms
      await page.waitForTimeout(50);
      const dump50 = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('*').forEach(el => {
          const t = el.textContent || '';
          if (t.trim() === 'Invalid credentials' || t.trim() === 'Login failed. Please check your credentials.') {
            results.push({ tag: el.tagName, class: el.className, style: el.getAttribute('style'), html: el.outerHTML.substring(0, 500) });
          }
        });
        return results;
      });
      console.log('\n=== EXACT TEXT MATCHES AT 250ms AFTER 401 ===');
      dump50.forEach((el, i) => console.log(`[${i}]`, JSON.stringify(el)));
    }
  });

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('you@institution.edu').fill('admin@eduintel.edu');
  await page.getByPlaceholder('••••••••').fill('WrongPassword99!');

  // Wait for the 401 response in the main flow
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 401),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  console.log('=== 401 received ===');

  // Poll DOM at increasing intervals
  for (const ms of [50, 100, 200, 300, 500, 800, 1200]) {
    await page.waitForTimeout(ms === 50 ? 50 : ms - [50,100,200,300,500,800][([50,100,200,300,500,800].indexOf(ms-1)||0)]);
    const found = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('*').forEach(el => {
        const t = (el.textContent || '').trim();
        if (t === 'Invalid credentials' || t === 'Login failed. Please check your credentials.' || t.includes('Invalid credentials')) {
          if (el.children.length === 0 || el.tagName === 'DIV') { // leaf or div
            results.push({ tag: el.tagName, class: el.className, style: el.getAttribute('style'), text: t.substring(0,100), html: el.outerHTML.substring(0,400) });
          }
        }
      });
      return results;
    });
    if (found.length > 0) {
      console.log(`\n=== ERROR ELEMENT FOUND at cumulative ~${ms}ms ===`);
      found.forEach((el, i) => console.log(`[${i}]`, JSON.stringify(el)));
      break;
    } else {
      console.log(`at ~${ms}ms: nothing yet`);
    }
  }

  // Final full-body dump to confirm what's visible at 2s
  const finalDump = await page.evaluate(() => {
    return { url: location.href, bodyText: document.body.innerText.substring(0, 300) };
  });
  console.log('\n=== AT 2s: url =', finalDump.url);
  console.log('=== AT 2s: bodyText =', finalDump.bodyText);

  await browser.close();
})();
