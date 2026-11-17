// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

/* Concept zakat calculator. It shows how the documented method differences change the result; it gives no
   ruling and has not been reviewed by scholars (docs/PLAN.md, section 6). Prices are sample values. */

export const RATE = 0.025;
export const NISAB = { goldGrams: 85, silverGrams: 595 };
export const SAMPLE_PRICES = { gold: 1690000, silver: 21400 }; // so'm per gram, sample values only

/* The two differences the research notes document with a source (docs/research/legal-and-sharia.md):
   worn jewellery and debts due within 12 months. Everything else is the same in all four columns. */
export const METHODS = [
  { id: 'hanafi', name: 'Hanafiy', jewellery: true, debts: true,
    notes: ['Hamma zargarlik hisoblanadi', 'Yaqin 12 oyda toʻlanadigan qarz ayiriladi'] },
  { id: 'shafii', name: 'Shofeʼiy', jewellery: false, debts: false,
    notes: ['Doimiy taqiladigan zargarlik istisno', 'Qarz ayirilmaydi'] },
  { id: 'maliki', name: 'Molikiy', jewellery: false, debts: true,
    notes: ['Doimiy taqiladigan zargarlik istisno', 'Yaqin 12 oyda toʻlanadigan qarz ayiriladi'] },
  { id: 'hanbali', name: 'Hanbaliy', jewellery: false, debts: true,
    notes: ['Doimiy taqiladigan zargarlik istisno', 'Yaqin 12 oyda toʻlanadigan qarz ayiriladi'] },
];

export const SOURCES = [
  'Nisob: 85 g oltin yoki 595 g kumush (NZF ham 87.48 g / 612.36 g ni keltiradi). docs/research/legal-and-sharia.md, 11-savol.',
  'Zargarlik va qarzlar boʻyicha farq: GiveDirectly zakot kalkulyatori tavsifi, shu hujjatda.',
  'Oʻzbekiston musulmonlari idorasining qarz haqidagi fatvolari (9 va 68) hali olimlar bilan muhokama qilinadi.',
];

export function blank() {
  return { cash: 0, bank: 0, goldGrams: 0, jewelleryGrams: 0, silverGrams: 0, trade: 0, receivable: 0, crypto: 0, debts: 0 };
}
export function sampleInput() {
  return { cash: 6500000, bank: 24800000, goldGrams: 12, jewelleryGrams: 28, silverGrams: 0, trade: 9000000, receivable: 3000000, crypto: 0, debts: 7200000 };
}

/* One column of the comparison. basis is 'gold' or 'silver' (which nisab the user compares against). */
export function compute(input, method, prices = SAMPLE_PRICES, basis = 'silver') {
  const v = (k) => Math.max(0, Number(input[k]) || 0);
  const gold = v('goldGrams') * prices.gold;
  const jewellery = method.jewellery ? v('jewelleryGrams') * prices.gold : 0;
  const silver = v('silverGrams') * prices.silver;
  const assets = v('cash') + v('bank') + gold + jewellery + silver + v('trade') + v('receivable') + v('crypto');
  const debts = method.debts ? Math.min(v('debts'), assets) : 0;
  const net = assets - debts;
  const nisab = basis === 'gold' ? NISAB.goldGrams * prices.gold : NISAB.silverGrams * prices.silver;
  const due = net >= nisab ? Math.round(net * RATE) : 0;
  return { assets, jewellery, debts, net, nisab, reaches: net >= nisab, due };
}
