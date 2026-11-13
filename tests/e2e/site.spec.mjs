// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// End-to-end tests for the Shaffof home page in a real Chromium, under the production CSP.
import { test, expect } from './fixtures.mjs';

const PAGES = [
  { path: '/', lang: 'uz', ok: 'Bor.', bad: 'Isbot mos kelmadi' },
  { path: '/en/', lang: 'en', ok: 'Included.', bad: 'Proof failed' },
  { path: '/ru/', lang: 'ru', ok: 'Есть.', bad: 'Доказательство не сошлось' },
];
const HEX64 = /^[0-9a-f]{64}$/;

// Collects console errors, uncaught page errors and any request that leaves the origin.
function watch(page) {
  const seen = { console: [], page: [], foreign: [] };
  page.on('console', (m) => { if (m.type() === 'error') seen.console.push(m.text()); });
  page.on('pageerror', (e) => seen.page.push(String(e)));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['http:', 'https:'].includes(u.protocol)) return;
    if (u.origin !== new URL(page.url() === 'about:blank' ? r.url() : page.url()).origin) seen.foreign.push(r.url());
  });
  return seen;
}
const expectClean = (seen) => {
  expect(seen.console, 'console errors').toEqual([]);
  expect(seen.page, 'page errors').toEqual([]);
  expect(seen.foreign, 'third-party requests').toEqual([]);
};
const rootNow = (page) => page.locator('#root-now');
const rootPub = (page) => page.locator('#root-pub');
async function demoReady(page) {
  await expect(rootPub(page)).toHaveText(HEX64);
  await expect(rootNow(page)).toHaveText(HEX64);
}

// Share of canvas pixels that are not fully transparent, and a fingerprint of the frame.
async function canvasStats(page) {
  return page.locator('#stage').evaluate((cv) => {
    const { width: w, height: h } = cv;
    if (!w || !h) return { w, h, inked: 0, sig: '' };
    const d = cv.getContext('2d').getImageData(0, 0, w, h).data;
    let inked = 0, sum = 0;
    for (let i = 3; i < d.length; i += 4) { if (d[i]) inked++; sum = (sum * 31 + d[i - 3] + d[i - 2] * 7 + d[i - 1] * 13 + d[i]) % 2147483647; }
    return { w, h, inked: inked / (w * h), sig: String(sum) };
  });
}

for (const p of PAGES) {
  test.describe(`page ${p.path}`, () => {
    test('loads with no console errors, no page errors, no third-party requests', async ({ page }) => {
      const seen = watch(page);
      const res = await page.goto(p.path);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-security-policy']).toContain("script-src 'self'");
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
      await demoReady(page);
      await expect(page.locator('#sh-pub')).not.toHaveText('…');
      // Scroll everything into view so the reveal and observer code runs too.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      expectClean(seen);
    });

    test('demo: changing an amount changes the root, restoring it restores the root', async ({ page }) => {
      const seen = watch(page);
      await page.goto(p.path);
      await demoReady(page);
      const pub = await rootPub(page).textContent();
      await expect(rootNow(page)).toHaveText(pub);
      await expect(page.locator('#demo-status .chip')).toHaveClass(/chip-good/);

      const input = page.locator('#ledger-rows tr').nth(2).locator('input');
      const original = await input.inputValue();
      await input.fill('940000');
      await expect(rootNow(page)).not.toHaveText(pub);
      await expect(rootNow(page)).toHaveText(HEX64);
      await expect(rootPub(page)).toHaveText(pub);
      await expect(page.locator('#demo-status .chip')).toHaveClass(/chip-bad/);
      await expect(page.locator('#ledger-rows tr').nth(2)).toHaveClass(/changed/);
      await expect(page.locator('#tree .node.root')).toHaveClass(/bad/);

      await input.fill(original);
      await expect(rootNow(page)).toHaveText(pub);
      await expect(page.locator('#demo-status .chip')).toHaveClass(/chip-good/);
      await expect(page.locator('#ledger-rows tr.changed')).toHaveCount(0);
      expectClean(seen);
    });

    test('demo: the inclusion check says included for a real entry and not included for a fake', async ({ page }) => {
      const seen = watch(page);
      await page.goto(p.path);
      await demoReady(page);
      const receipt = page.locator('#receipt');
      await expect(receipt.locator('option')).toHaveText(['K-0001', 'K-0002', 'K-0003', 'K-0004']);

      for (const id of ['K-0001', 'K-0004']) {
        await receipt.selectOption({ label: id });
        await page.locator('#check').click();
        await expect(page.locator('#proof-result .chip')).toHaveClass(/chip-good/);
        await expect(page.locator('#proof-result .chip')).toContainText(p.ok);
      }
      // Leaf hash, three sibling steps, computed root.
      await expect(page.locator('#proof-steps li')).toHaveCount(5);
      await expect(page.locator('#proof-steps li b').first()).not.toBeEmpty();
      await expect(page.locator('#tree .node.path')).toHaveCount(4);
      await expect(page.locator('#tree .node.sib')).toHaveCount(3);

      // A fake receipt: K-0002 with an amount that was never published.
      await receipt.selectOption({ label: 'K-0002' });
      const row = page.locator('#ledger-rows tr').nth(1).locator('input');
      await row.fill('9999999');
      await expect(rootNow(page)).not.toHaveText(await rootPub(page).textContent());
      await page.locator('#check').click();
      await expect(page.locator('#proof-result .chip')).toHaveClass(/chip-bad/);
      await expect(page.locator('#proof-result .chip')).toContainText(p.bad);

      await page.locator('#reset').click();
      await expect(row).toHaveValue('1200000');
      await expect(page.locator('#proof-result .chip')).toHaveClass(/chip-good/);
      expectClean(seen);
    });
  });
}

test('demo: the amount field keeps digits only, so markup never reaches the page', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/en/');
  await demoReady(page);
  const input = page.locator('#ledger-rows tr').first().locator('input');
  await input.fill('');
  await input.pressSequentially('<img src=x onerror=alert(1)>12');
  await expect(input).toHaveValue('112');
  await expect(page.locator('#demo img')).toHaveCount(0);
  await input.fill('9'.repeat(20));
  await expect(input).toHaveValue('9'.repeat(12));
  await expect(rootNow(page)).toHaveText(HEX64);
  expectClean(seen);
});

test('hero canvas renders and animates', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/en/');
  await expect.poll(async () => (await canvasStats(page)).inked, { timeout: 10_000 }).toBeGreaterThan(0.02);
  const a = await canvasStats(page);
  expect(a.w).toBeGreaterThan(0);
  await expect.poll(async () => (await canvasStats(page)).sig, { timeout: 5_000 }).not.toBe(a.sig);
  expectClean(seen);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('hero canvas shows one finished still frame', async ({ page }) => {
    const seen = watch(page);
    await page.goto('/');
    await expect.poll(async () => (await canvasStats(page)).inked, { timeout: 10_000 }).toBeGreaterThan(0.02);
    const a = await canvasStats(page);
    await page.waitForTimeout(1200);
    const b = await canvasStats(page);
    expect(b.sig).toBe(a.sig);
    // Reveals are shown at once instead of animated in.
    await expect(page.locator('.rv').first()).toHaveClass(/\bin\b/);
    expectClean(seen);
  });
});

test('theme toggle switches, updates its label and persists across reloads', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/en/');
  const html = page.locator('html');
  const btn = page.locator('#theme');
  const first = await html.getAttribute('data-theme');
  expect(['light', 'dark']).toContain(first);
  const label = await btn.getAttribute('aria-label');
  await btn.click();
  const second = first === 'dark' ? 'light' : 'dark';
  await expect(html).toHaveAttribute('data-theme', second);
  await expect(btn).not.toHaveAttribute('aria-label', label);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', second);
  await btn.click();
  await expect(html).toHaveAttribute('data-theme', first);
  expectClean(seen);
});

test('stored theme values other than light/dark are ignored', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => localStorage.setItem('shaffof-theme', '"><img src=x>'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
});

test('language links move between uz, en and ru', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/');
  const langs = page.locator('nav.langs');
  await expect(langs.locator('a[aria-current="page"]')).toHaveText('UZ');
  await langs.getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(langs.locator('a[aria-current="page"]')).toHaveText('EN');
  await langs.getByRole('link', { name: 'RU' }).click();
  await expect(page).toHaveURL(/\/ru\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await langs.getByRole('link', { name: 'UZ' }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uz');
  expectClean(seen);
});

test('unknown paths get the 404 page with links home', async ({ page }) => {
  const seen = watch(page);
  const res = await page.goto('/this-page-does-not-exist/');
  expect(res.status()).toBe(404);
  expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  await expect(page).toHaveTitle(/topilmadi/);
  await expect(page.locator('h1')).toBeVisible();
  // Chromium reports the 404 status of the document itself; nothing else may fail.
  seen.console = seen.console.filter((t) => !/status of 404/.test(t));
  expectClean(seen);
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await demoReady(page);
});

test('demo: changing the receipt after a check re-runs the proof for the new entry', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/en/');
  await demoReady(page);
  await page.locator('#receipt').selectOption({ label: 'K-0001' });
  await page.locator('#check').click();
  await expect(page.locator('#ledger-rows tr.proving')).toHaveCount(1);
  await expect(page.locator('#ledger-rows tr').nth(0)).toHaveClass(/proving/);
  // No second click: the open proof follows the selection.
  await page.locator('#receipt').selectOption({ label: 'K-0003' });
  await expect(page.locator('#ledger-rows tr').nth(3)).toHaveClass(/proving/);
  await expect(page.locator('#ledger-rows tr.proving')).toHaveCount(1);
  await expect(page.locator('#proof-result .chip')).toHaveClass(/chip-good/);
  expectClean(seen);
});

test('two reports: the silent edit plays in turn while the illustration is on screen', async ({ page }) => {
  const seen = watch(page);
  await page.clock.install();
  await page.goto('/en/');
  const plain = page.locator('#plain-state'), chip = page.locator('#sh-state');
  await expect(page.locator('#sh-pub')).toHaveText(/^[0-9a-f]{16}…$/);
  await expect(plain).toHaveText('A plain PDF or spreadsheet');
  await page.locator('#compare').scrollIntoViewIfNeeded();
  await page.clock.runFor(3700);
  await expect(plain).toHaveText('A number changed. No trace left.');
  await expect(chip).toHaveClass(/chip-bad/);
  await expect(page.locator('#compare .report-row.edited')).toHaveCount(2);
  await page.clock.runFor(3600);
  await expect(plain).toHaveText('A plain PDF or spreadsheet');
  await expect(chip).toHaveClass(/chip-good/);
  expectClean(seen);
});

test('hero canvas: every phase of the animation draws, through the seal and the proof paths', async ({ page }) => {
  const seen = watch(page);
  await page.clock.install();
  await page.goto('/en/');
  await page.clock.runFor(1000); // past the font wait
  const sigs = new Set();
  // About 16 s of animation in steps: leaves, edges, seal and its ripple, then the proof traveller.
  for (let i = 0; i < 8; i++) {
    await page.clock.runFor(2000);
    const s = await canvasStats(page);
    expect(s.inked).toBeGreaterThan(0.02);
    sigs.add(s.sig);
  }
  expect(sigs.size).toBeGreaterThan(6);
  expectClean(seen);
});

test('hero canvas follows the pointer and the viewport size', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/en/');
  await expect.poll(async () => (await canvasStats(page)).inked, { timeout: 10_000 }).toBeGreaterThan(0.02);
  // Pointer in the water: glow and ripples are drawn without errors.
  const box = await page.locator('#stage').boundingBox();
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(box.x + box.width * (0.3 + i * 0.08), box.y + box.height * 0.75);
    await page.waitForTimeout(250);
  }
  await page.mouse.move(0, 0);
  // A new viewport resizes the backing store.
  const before = (await canvasStats(page)).w;
  await page.setViewportSize({ width: 700, height: 900 });
  await expect.poll(async () => (await canvasStats(page)).w).not.toBe(before);
  expectClean(seen);
});

test.describe('reduced motion, theme switch', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the still frame is redrawn in the new theme colours, and the two reports show the edit at once', async ({ page }) => {
    const seen = watch(page);
    await page.goto('/en/');
    await expect(page.locator('#plain-state')).toHaveText('A number changed. No trace left.');
    await expect(page.locator('#sh-state')).toHaveClass(/chip-bad/);
    await expect.poll(async () => (await canvasStats(page)).inked, { timeout: 10_000 }).toBeGreaterThan(0.02);
    // The still frame waits for the tree hashes; poll until it settles.
    let a = await canvasStats(page);
    await expect.poll(async () => { const b = await canvasStats(page); const same = b.sig === a.sig; a = b; return same; }).toBe(true);
    await page.locator('#theme').click();
    await expect.poll(async () => (await canvasStats(page)).sig).not.toBe(a.sig);
    expectClean(seen);
  });
});

test('without WebCrypto the demo explains why it cannot run, and the page still works', async ({ page }) => {
  const seen = watch(page);
  await page.addInitScript(() => Object.defineProperty(window.crypto, 'subtle', { value: undefined }));
  await page.goto('/en/');
  const note = page.locator('[data-nocrypto]').first();
  await expect(note).toBeVisible();
  await expect(note).toHaveText('This browser lacks WebCrypto, so the demo cannot run.');
  await expect(page.locator('#root-now')).not.toHaveText(HEX64);
  await expect.poll(async () => (await canvasStats(page)).inked, { timeout: 10_000 }).toBeGreaterThan(0.02);
  await page.locator('#theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
  expectClean(seen);
});
