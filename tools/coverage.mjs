// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// Combined coverage of every script under site/: runs the Node unit tests with V8 coverage on, runs the
// Playwright end-to-end tests (tests/e2e/fixtures.mjs records Chromium's V8 coverage of each page), merges
// both with monocart-coverage-reports and fails below the gate. Files no test loads count as 0 %.
//   node tools/coverage.mjs            -> report in .coverage/report/ (index.html, lcov.info, summary)
//   node tools/coverage.mjs --merge    -> only merge what .coverage/ already holds
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CoverageReport } from 'monocart-coverage-reports';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SITE = join(ROOT, 'site') + sep;
const COV = join(ROOT, '.coverage');
const NODE_DIR = join(COV, 'node');
const E2E_DIR = join(COV, 'e2e');
// Gate on the combined numbers (OpenSSF Best Practices gold: 90 % statements, 80 % branches).
export const GATE = { statements: 90, lines: 90, branches: 80 };

function run(args, env) {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!process.argv.includes('--merge')) {
  rmSync(COV, { recursive: true, force: true });
  run(['--test', 'tests/unit/*.test.mjs'], { NODE_V8_COVERAGE: NODE_DIR });
  run([join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js'), 'test']);
}

const inSite = (url) => url.startsWith('file:') && fileURLToPath(url).startsWith(SITE) && url.endsWith('.js');
const mcr = new CoverageReport({
  name: 'Shaffof site JavaScript (unit + end-to-end)',
  outputDir: join(COV, 'report'),
  reports: [['console-details'], ['v8'], ['lcovonly'], ['json-summary']],
  entryFilter: (e) => inSite(e.url),
  sourcePath: (p) => p.split('\\').join('/'),
  all: { dir: ['site'], filter: { '**/*.js': true } },
  cleanCache: true,
});

// Node: every file NODE_V8_COVERAGE wrote. The site scripts are read from disk.
if (existsSync(NODE_DIR)) {
  for (const f of readdirSync(NODE_DIR)) {
    const list = JSON.parse(readFileSync(join(NODE_DIR, f), 'utf8')).result.filter((e) => inSite(e.url));
    for (const e of list) e.source = readFileSync(fileURLToPath(e.url), 'utf8');
    if (list.length) await mcr.add(list);
  }
}
// Chromium: http://host/assets/js/x.js is site/assets/js/x.js, served byte for byte, so it maps onto the
// same file URL as the Node entries and both merge into one file.
let pages = 0;
if (existsSync(E2E_DIR)) {
  for (const f of readdirSync(E2E_DIR)) {
    const list = JSON.parse(readFileSync(join(E2E_DIR, f), 'utf8')).map((e) => {
      const file = join(SITE, decodeURIComponent(new URL(e.url).pathname));
      return { ...e, url: pathToFileURL(file).href };
    });
    pages++;
    await mcr.add(list);
  }
}
if (!pages) { console.error('coverage: no end-to-end coverage in .coverage/e2e'); process.exit(1); }

const res = await mcr.generate();
const fail = [];
for (const [k, min] of Object.entries(GATE)) {
  const pct = res.summary[k].pct;
  if (pct === '' || pct < min) fail.push(`${k} ${pct}% < ${min}%`);
}
console.log(`coverage: ${pages} page runs, ${res.files.length} files under site/ ` +
  `(${res.files.map((f) => relative(ROOT, f.sourcePath) || f.sourcePath).join(', ')})`);
if (fail.length) { console.error('coverage gate failed: ' + fail.join(', ')); process.exit(1); }
console.log(`coverage gate ok: statements >= ${GATE.statements}%, lines >= ${GATE.lines}%, branches >= ${GATE.branches}%`);
