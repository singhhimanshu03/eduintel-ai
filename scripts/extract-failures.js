/**
 * extract-failures.js
 * Opens each large trace zip in playwright-report/data/ and extracts
 * the test title and error message from the trace.
 */
var fs      = require('fs');
var path    = require('path');
var zlib    = require('zlib');
var AdmZip  = null;

// Try to use AdmZip, fall back to manual zip parsing
try { AdmZip = require('adm-zip'); } catch (e) {}

var dataDir = 'playwright-report/data';
var files   = fs.readdirSync(dataDir)
               .filter(function(f) { return f.endsWith('.zip'); })
               .map(function(f) {
                 return { name: f, size: fs.statSync(path.join(dataDir, f)).size };
               })
               .sort(function(a, b) { return a.size - b.size; });

var passing = files.filter(function(f) { return f.size < 4000; });
var failing = files.filter(function(f) { return f.size >= 4000; });

console.log('=== SUMMARY ===');
console.log('Total  :', files.length);
console.log('Passed :', passing.length, '(trace <4KB)');
console.log('Failed :', failing.length, '(trace >=4KB)');
console.log('');

if (!AdmZip) {
  console.log('adm-zip not available. Install with: npm install --save-dev adm-zip');
  console.log('');
  console.log('Showing file sizes for failed tests:');
  failing.forEach(function(f, i) {
    console.log('[' + (i+1) + '] ' + f.name + ' (' + f.size + ' bytes)');
  });
  process.exit(0);
}

// Use adm-zip to read trace content
var failureTitles = [];
failing.forEach(function(f, i) {
  try {
    var zip  = new AdmZip(path.join(dataDir, f.name));
    var entries = zip.getEntries();
    var titleEntry = entries.find(function(e) { return e.name === 'title.txt' || e.name.endsWith('.txt'); });
    var traceJson  = entries.find(function(e) { return e.name.endsWith('.trace'); });

    var title = titleEntry ? zip.readAsText(titleEntry) : f.name;
    var err   = '';
    if (traceJson) {
      var lines = zip.readAsText(traceJson).split('\n').filter(Boolean);
      for (var l = 0; l < lines.length; l++) {
        try {
          var ev = JSON.parse(lines[l]);
          if (ev.type === 'testEnd' || ev.type === 'test_result') {
            title = ev.title || title;
            err   = (ev.error && ev.error.message) || err;
          }
        } catch (je) {}
      }
    }
    failureTitles.push({ title: title.trim(), err: err, file: f.name });
    console.log('[' + (i+1) + '] ' + title.trim());
    if (err) console.log('    ERR: ' + err.replace(/\n/g,' ').substring(0, 200));
  } catch (ex) {
    console.log('[' + (i+1) + '] ERROR reading ' + f.name + ': ' + ex.message);
  }
});
