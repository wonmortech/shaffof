// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// Property-based tests (fast-check): Merkle proofs and amount parsing on random ledgers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fc from 'fast-check';

const req = createRequire(import.meta.url);
const M = req('../../site/assets/js/merkle.js');
const D = req('../../site/assets/js/demo-core.js');

const entry = fc.record({
  id: fc.string({ maxLength: 12 }), date: fc.string({ maxLength: 10 }), cat: fc.string({ maxLength: 16 }),
  dir: fc.constantFrom('in', 'out'), amount: fc.nat({ max: Number.MAX_SAFE_INTEGER - 1 }),
});
const ledger = fc.array(entry, { minLength: 1, maxLength: 24 });

test('every entry of any ledger verifies against the root', async () => {
  await fc.assert(fc.asyncProperty(ledger, fc.nat(), async (L, k) => {
    const t = await M.build(L);
    const i = k % L.length;
    const r = await M.verify(L[i], M.path(t.root, i), M.hex(t.root.hash));
    assert.equal(r.ok, true);
  }), { numRuns: 150 });
});

test('changing the amount or the direction of an entry breaks its proof', async () => {
  await fc.assert(fc.asyncProperty(ledger, fc.nat(), fc.boolean(), async (L, k, flipDir) => {
    const t = await M.build(L);
    const i = k % L.length;
    const e = L[i];
    const forged = flipDir ? { ...e, dir: e.dir === 'in' ? 'out' : 'in' } : { ...e, amount: e.amount + 1 };
    const r = await M.verify(forged, M.path(t.root, i), M.hex(t.root.hash));
    assert.equal(r.ok, false);
  }), { numRuns: 150 });
});

test('the root changes when any entry changes', async () => {
  await fc.assert(fc.asyncProperty(ledger, fc.nat(), async (L, k) => {
    const i = k % L.length;
    const L2 = L.map((e, j) => (j === i ? { ...e, amount: e.amount + 1 } : e));
    const [a, b] = await Promise.all([M.build(L), M.build(L2)]);
    assert.notEqual(M.hex(a.root.hash), M.hex(b.root.hash));
  }), { numRuns: 150 });
});

test('parseAmount keeps only digits, at most 12, and always a safe integer', () => {
  fc.assert(fc.property(fc.anything(), (x) => {
    const p = D.parseAmount(typeof x === 'symbol' ? '' : x);
    assert.match(p.digits, /^[0-9]{0,12}$/);
    assert.ok(Number.isSafeInteger(p.value) && p.value >= 0);
  }), { numRuns: 300 });
});

test('parseAmount treats a value with no text form as empty', () => {
  assert.deepEqual(D.parseAmount([[[{ toString: false }]]]), { digits: '', value: 0 });
});
