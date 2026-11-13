// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// The Playwright `test` used by the end-to-end specs. It records Chromium's V8 JavaScript coverage for
// every script the page loads from /assets/js/ and writes it to .coverage/e2e/, where tools/coverage.mjs
// merges it with the Node unit-test coverage. Recording is always on; it costs little and changes nothing
// the page can observe.
import { test as base, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../../.coverage/e2e/', import.meta.url));

export const test = base.extend({
  page: async ({ page, browserName }, use) => {
    const on = browserName === 'chromium';
    if (on) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    if (!on) return;
    const entries = (await page.coverage.stopJSCoverage()).filter((e) => {
      try { return new URL(e.url).pathname.startsWith('/assets/js/'); } catch { return false; }
    });
    if (!entries.length) return;
    mkdirSync(OUT, { recursive: true });
    writeFileSync(OUT + randomUUID() + '.json', JSON.stringify(entries));
  },
});
export { expect };
