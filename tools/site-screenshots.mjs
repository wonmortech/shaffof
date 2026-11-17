// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// README screenshots from the concept demo: builds it, serves it under the production CSP, visits every
// screen (with a dialog-like state open where it matters) and writes 1440x900 JPEGs plus one phone shot to
// docs/screenshots/. Run again whenever the demo UI changes:  npm run site:screenshots
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build } from './build-demo.mjs';
import { start, BASE } from './serve-demo.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIR = join(ROOT, 'docs', 'screenshots');
mkdirSync(DIR, { recursive: true });
build();
const server = await start(4175);
const url = `http://127.0.0.1:4175${BASE}`;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });

async function shot(name, hash, act, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: opts.phone ? 2 : 1, colorScheme: opts.dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url + '#' + hash);
  await page.waitForSelector('html[data-ready="1"]');
  await page.waitForTimeout(150);
  if (act) await act(page);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(DIR, name + '.jpg'), type: 'jpeg', quality: 78 });
  if (errors.length) throw new Error(name + ': ' + errors.join('; '));
  console.log('shot', name);
  await ctx.close();
}

try {
  await shot('overview', '/');
  await shot('funds', '/funds');
  await shot('fund', '/funds/mehr');
  await shot('report', '/r/umid-nuri/' + monthsAgo(2), async (p) => { await p.click('#check'); await p.waitForSelector('.verdict.ok'); });
  await shot('report-tampered', '/r/umid-nuri/' + monthsAgo(2), async (p) => {
    await p.click('#tamper');
    const first = p.locator('tbody input').nth(2);
    await first.fill('9900000');
    await p.waitForSelector('.verdict.bad');
    await p.locator('#tamper').scrollIntoViewIfNeeded();
  });
  await shot('verify', '/verify', async (p) => { await p.locator('.hint a.chip').first().click(); await p.waitForSelector('.path li'); });
  await shot('audit', '/verify', async (p) => {
    await p.locator('.hint a.chip').nth(1).click(); await p.waitForSelector('.path li');
    await p.click('#audit'); await p.waitForSelector('.card .verdict.ok');
    await p.locator('#audit-json').scrollIntoViewIfNeeded();
  });
  await shot('console', '/console', async (p) => {
    await p.click('#login-form button[type=submit]');
    await p.fill('#entry-form input[name=amount]', '1250000');
    await p.click('#entry-form button[type=submit]');
    await p.click('#seal'); await p.waitForSelector('#confirm');
  });
  await shot('zakat', '/zakat');
  await shot('overview-dark', '/', null, { dark: true });
  await shot('phone', '/verify', async (p) => { await p.locator('.hint a.chip').first().click(); await p.waitForSelector('.path li'); }, { phone: true });
} finally {
  await browser.close();
  server.close();
}

function monthsAgo(n) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
