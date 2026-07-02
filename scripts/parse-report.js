/**
 * parse-report.js
 * Reads the Playwright HTML report and extracts summary stats + failure details.
 * Run: node scripts/parse-report.js
 */
var fs   = require('fs');
var path = require('path');
var zlib = require('zlib');

var reportHtml = fs.readFileSync('playwright-report/index.html', 'utf8');
var dataDir    = 'playwright-report/data';

// --- Try to find the embedded data blob ---
var reportJson = null;

// Playwright 1.44 embeds: window.playwrightReportBase64="<base64-encoded-gzip>"
var b64Re = /window\.playwrightReportBase64\s*=\s*"([A-Za-z0-9+/=]{100,})"/;
var b64m  = reportHtml.match(b64Re);
if (b64m) {
  var buf = Buffer.from(b64m[1], 'base64');
  try { reportJson = JSON.parse(zlib.gunzipSync(buf).toString('utf8')); }
  catch (e1) {
    try { reportJson = JSON.parse(buf.toString('utf8')); }
    catch (e2) { console.log('Failed to decode base64 blob:', e2.message.substring(0,80)); }
  }
}

if (!reportJson) {
  console.log('Could not extract embedded JSON. Falling back to trace file heuristic.\n');
  var files  = fs.readdirSync(dataDir).filter(function(f) { return f.endsWith('.zip'); });
  var passed = 0;
  var failed = 0;
  files.forEach(function(f) {
    var size = fs.statSync(path.join(dataDir, f)).size;
    if (size < 4000) { passed++; } else { failed++; }
  });
  console.log('=== HEURISTIC SUMMARY ===');
  console.log('Total  :', files.length);
  console.log('Passed :', passed, '(small traces <4KB)');
  console.log('Failed :', failed, '(large traces >=4KB — contain screenshots/videos)');
  process.exit(0);
}

// --- Parse the report JSON ---
var stats = reportJson.stats || {};
var total   = stats.total   || (stats.expected + stats.unexpected + (stats.flaky || 0) + (stats.skipped || 0));
var passed  = stats.expected   || stats.passed  || 0;
var failedC = stats.unexpected || stats.failed  || 0;
var flaky   = stats.flaky   || 0;
var skipped = stats.skipped || 0;

console.log('=== SUMMARY ===');
console.log('Total  :', total   || (passed + failedC + flaky + skipped));
console.log('Passed :', passed);
console.log('Failed :', failedC);
console.log('Flaky  :', flaky);
console.log('Skipped:', skipped);
console.log('');

// Walk the test tree collecting failures
var failures = [];

function walkSuite(suite) {
  if (!suite) return;
  var subs = suite.suites || suite.specs || [];
  subs.forEach(function(s) { walkSuite(s); });
  var tests = suite.tests || [];
  tests.forEach(function(t) {
    var results = t.results || [];
    var failResult = null;
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.status === 'failed' || r.status === 'unexpected') { failResult = r; break; }
    }
    if (!failResult) return;
    var title = '';
    if (t.titlePath) { title = t.titlePath.join(' › '); }
    else {
      title = (suite.title ? suite.title + ' › ' : '') + (t.title || '');
    }
    var errMsg = '';
    var errors = failResult.errors || [];
    if (errors.length) { errMsg = (errors[0].message || '').replace(/\n/g,' ').substring(0, 250); }
    failures.push({ title: title, error: errMsg });
  });
}

var topSuites = reportJson.suites || reportJson.files || [];
topSuites.forEach(function(s) { walkSuite(s); });

console.log('=== FAILURES (' + failures.length + ') ===');
failures.forEach(function(f, i) {
  console.log('\n[' + (i+1) + '] ' + f.title);
  if (f.error) console.log('    ERR: ' + f.error);
});
