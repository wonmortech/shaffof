// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// Every screen of the concept demo renders real content, shows the demo note and logs no errors.
import { test, expect } from '@playwright/test';

const prev = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })();
const ROUTES = [
  ['/', 'Xayriya pullari'], ['/funds', 'Jamgʻarmalar'], ['/funds/mehr', 'Mehr koʻprigi'], ['/funds/beshyogoch', 'Hali hisobot yoʻq'],
  [`/r/mehr/${prev}`, 'Eʼlon qilingan ildiz'], ['/verify', 'Kvitansiyani tekshirish'], ['/verify/K-0000-0000', 'Bunday kvitansiya topilmadi'],
  ['/console', 'Jamgʻarma kabinetiga kirish'], ['/zakat', 'Toʻrt usul'], ['/about', 'Bu konsept demo'], ['/no-such-page', 'Sahifa topilmadi'],
];

function watch(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

for (const [route, text] of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const errors = watch(page);
    await page.goto('./#' + route);
    await expect(page.locator('html[data-ready="1"]')).toHaveCount(1);
    await expect(page.locator('main')).toContainText(text);
    await expect(page.locator('.demo-pill')).toContainText('qayta yuklanganda tiklanadi');
    expect(errors).toEqual([]);
  });
}

test('report integrity check and tamper', async ({ page }) => {
  const errors = watch(page);
  await page.goto(`./#/r/mehr/${prev}`);
  await page.click('#check');
  await expect(page.locator('.verdict.ok')).toContainText('oʻzgarmagan');
  await page.click('#tamper');
  await page.locator('tbody input').first().fill('1');
  await expect(page.locator('.verdict.bad')).toContainText('1 ta yozuv');
  await page.click('#tamper');
  await expect(page.locator('.verdict.ok')).toBeVisible();
  expect(errors).toEqual([]);
});

test('receipt proof and auditor check', async ({ page }) => {
  await page.goto('./#/verify');
  await page.locator('.hint a.chip').first().click();
  await expect(page.locator('.verdict.ok').first()).toContainText('Bor');
  await page.click('#audit');
  await expect(page.locator('.card .verdict.ok').last()).toContainText('Isbot toʻgʻri');
  const json = await page.locator('#audit-json').inputValue();
  await page.locator('#audit-json').fill(json.replace(/"amount": (\d+)/, (m, n) => `"amount": ${Number(n) + 1}`));
  await page.click('#audit');
  await expect(page.locator('.card .verdict.bad')).toContainText('notoʻgʻri');
});

test('console: sign in, add, correct, seal', async ({ page }) => {
  const errors = watch(page);
  await page.goto('./#/console');
  await page.click('#login-form button[type=submit]');
  const rows = page.locator('tbody tr');
  const before = await rows.count();
  await page.fill('#entry-form input[name=amount]', '777000');
  await page.click('#entry-form button[type=submit]');
  await expect(rows).toHaveCount(before + 1);
  await rows.first().getByRole('button', { name: 'Tuzatish' }).click();
  await expect(rows).toHaveCount(before + 2);
  await page.click('#seal');
  await page.click('#confirm');
  await expect(page.locator('main')).toContainText('Muhrlangan');
  expect(errors).toEqual([]);
});

test('zakat columns differ and clear to below nisab', async ({ page }) => {
  await page.goto('./#/zakat');
  await expect(page.locator('.method')).toHaveCount(4);
  await expect(page.locator('main')).toContainText('Usullar orasida farq');
  await page.click('#zakat-clear');
  await expect(page.locator('.method.below')).toHaveCount(4);
});
