// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// Unit tests for site/assets/js/merkle.js. Expected values come from an independent reference
// implementation built on node:crypto (not WebCrypto) and from published RFC 6962 / RFC 9162 vectors.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import M from '../../site/assets/js/merkle.js';

const sha = (...parts) => createHash('sha256').update(Buffer.concat(parts.map((p) => Buffer.from(p)))).digest();
const refLeaf = (data) => sha([0], data);
const refNode = (l, r) => sha([1], l, r);
// RFC 9162 section 2.1.1 MTH, written from the RFC text.
function refRoot(datas) {
  if (datas.length === 0) return sha([]);
  if (datas.length === 1) return refLeaf(datas[0]);
  let k = 1; while (k * 2 < datas.length) k *= 2;
  return refNode(refRoot(datas.slice(0, k)), refRoot(datas.slice(k)));
}
const refEntry = (e) => Buffer.from(JSON.stringify([e.id, e.date, e.cat, e.dir, e.amount]), 'utf8');
const hex = (b) => Buffer.from(b).toString('hex');

// The RFC 6962 reference test leaves (certificate-transparency merkle_tree_test) and their
// published roots for tree sizes 1..8.
const CT_LEAVES = ['', '00', '10', '2021', '3031', '40414243', '5051525354555657', '606162636465666768696a6b6c6d6e6f']
  .map((h) => new Uint8Array(Buffer.from(h, 'hex')));
const CT_ROOTS = [
  '6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d',
  'fac54203e7cc696cf0dfcb42c92a1d9dbaf70ad9e621f4bd8d98662f00e3c125',
  'aeb6bcfe274b70a14fb067a5e5578264db0fa9b51af5e0ba159158f329e06e77',
  'd37ee418976dd95753c1c73862b9398fa2a2cf9b4ff0fdfe8b30cd95209614b7',
  '4e3bbb1f7b478dcfe71fb631631519a3bca12c9aefca1612bfce4c13a86264d4',
  '76e67dadbcdf1e10e1b74ddc608abd2f98dfb16fbce75277b5232a127f2087ef',
  'ddb89be403809e325750d3d263cd78929c2942b7942a34b77e122c9594a74c8c',
  '5dc9da79a70659a9ad559cb701ded9a2ab9d823aad2f4960cfe370eff4604328',
];
const EMPTY_ROOT = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('module shape', () => {
  test('exposes the same API on globalThis for the browser', () => {
    assert.equal(globalThis.ShaffofMerkle, M);
    assert.equal(M.ok, true);
  });
  test('sample() returns fresh copies of 8 fictional entries', () => {
    const a = M.sample(), b = M.sample();
    assert.equal(a.length, 8);
    a[0].amount = 1;
    assert.notEqual(b[0].amount, 1);
    assert.notEqual(M.sample()[0].amount, 1);
  });
  test('hex() pads every byte to two digits', () => {
    assert.equal(M.hex(new Uint8Array([0, 1, 15, 16, 255])), '00010f10ff');
  });
});

describe('entry encoding', () => {
  test('is the JSON array [id, date, cat, dir, amount]', () => {
    const e = M.sample()[0];
    assert.equal(M.serialize(e), '["K-0001","2026-10-02","donation","in",250000]');
    assert.deepEqual(Buffer.from(M.encode(e)), refEntry(e));
  });
  test('binds the direction: flipping in/out changes the encoding', () => {
    const e = M.sample()[0];
    assert.notEqual(M.serialize(e), M.serialize({ ...e, dir: 'out' }));
  });
  test('is injective where a separator join would collide', () => {
    // With "id|date|cat|amount" these two entries would serialize identically.
    const a = { id: 'A|2026', date: 'x', cat: 'c', dir: 'in', amount: 1 };
    const b = { id: 'A', date: '2026|x', cat: 'c', dir: 'in', amount: 1 };
    assert.notEqual(M.serialize(a), M.serialize(b));
  });
  test('rejects malformed entries', () => {
    const e = M.sample()[0];
    assert.throws(() => M.serialize(null), TypeError);
    assert.throws(() => M.serialize('x'), TypeError);
    assert.throws(() => M.serialize({ ...e, id: 7 }), TypeError);
    assert.throws(() => M.serialize({ ...e, dir: undefined }), TypeError);
    for (const amount of [-1, 1.5, NaN, Infinity, 2 ** 53, '5']) {
      assert.throws(() => M.serialize({ ...e, amount }), RangeError, String(amount));
    }
  });
});

describe('tree hashing (RFC 9162)', () => {
  test('empty tree is SHA-256 of the empty string', async () => {
    const t = await M.buildBytes([]);
    assert.equal(M.hex(t.root.hash), EMPTY_ROOT);
    assert.equal(t.root.empty, true);
    assert.throws(() => M.path(t.root, 0), RangeError);
  });
  test('matches the published RFC 6962 roots for sizes 1..8', async () => {
    for (let n = 1; n <= 8; n++) {
      const t = await M.buildBytes(CT_LEAVES.slice(0, n));
      assert.equal(M.hex(t.root.hash), CT_ROOTS[n - 1], `size ${n}`);
      assert.equal(hex(refRoot(CT_LEAVES.slice(0, n))), CT_ROOTS[n - 1], `reference size ${n}`);
    }
  });
  test('leaf hash is SHA-256(0x00 || data)', async () => {
    const t = await M.buildBytes([CT_LEAVES[3]]);
    assert.equal(M.hex(t.leaves[0]), hex(refLeaf(CT_LEAVES[3])));
    assert.equal(M.hex(t.root.hash), M.hex(t.leaves[0]));
    assert.equal(t.root.leaf, true);
  });
  test('sample ledger root matches the node:crypto reference', async () => {
    const s = M.sample();
    const t = await M.build(s);
    assert.equal(M.hex(t.root.hash), hex(refRoot(s.map(refEntry))));
    assert.equal(M.hex(t.root.hash), 'b1187bdb02bd2eba9838adc5839aebf96cd30b0f85d4fcdde87998998b3e1484');
  });
  test('odd sizes split at the largest power of two below n, never duplicating a leaf', async () => {
    for (let n = 1; n <= 13; n++) {
      const datas = Array.from({ length: n }, (_, i) => new Uint8Array([i]));
      const t = await M.buildBytes(datas);
      assert.equal(M.hex(t.root.hash), hex(refRoot(datas)), `size ${n}`);
    }
  });
  test('CVE-2012-2459 shape: [a,b,c] and [a,b,c,c] have different roots', async () => {
    const [a, b, c] = CT_LEAVES.slice(1, 4);
    const r3 = M.hex((await M.buildBytes([a, b, c])).root.hash);
    const r4 = M.hex((await M.buildBytes([a, b, c, c])).root.hash);
    assert.notEqual(r3, r4);
  });
  test('second preimage: an interior node presented as a leaf does not reproduce the root', async () => {
    const [a, b] = CT_LEAVES.slice(1, 3);
    const two = await M.buildBytes([a, b]);
    // Without domain separation, H(H(a)||H(b)) as a one-leaf tree over H(a)||H(b) would collide.
    const forged = new Uint8Array(Buffer.concat([Buffer.from(two.leaves[0]), Buffer.from(two.leaves[1])]));
    const one = await M.buildBytes([forged]);
    assert.notEqual(M.hex(one.root.hash), M.hex(two.root.hash));
    // Control: with plain SHA-256 and no prefixes the same forgery does reproduce the root.
    const naive = (x) => sha(x);
    const naiveForged = Buffer.concat([naive(a), naive(b)]);
    const naiveRoot = naive(Buffer.concat([naive(a), naive(b)]));
    assert.equal(hex(naive(naiveForged)), hex(naiveRoot), 'the attack works without 0x00/0x01');
  });
  test('build() rejects a bad entry instead of hashing it', async () => {
    await assert.rejects(M.build([{ ...M.sample()[0], amount: -5 }]), RangeError);
  });
});

describe('inclusion proofs', () => {
  test('every leaf of every size 1..9 verifies against the root', async () => {
    for (let n = 1; n <= 9; n++) {
      const s = Array.from({ length: n }, (_, i) => ({ id: 'K-' + i, date: '2026-10-01', cat: 'donation', dir: 'in', amount: i * 1000 }));
      const t = await M.build(s);
      const root = M.hex(t.root.hash);
      for (let m = 0; m < n; m++) {
        const p = M.path(t.root, m);
        const r = await M.verify(s[m], p, root);
        assert.equal(r.ok, true, `size ${n} leaf ${m}`);
        assert.equal(r.root, root);
        assert.equal(r.steps.length, p.length + 1);
        assert.equal(r.steps[0].hash, M.hex(t.leaves[m]));
      }
    }
  });
  test('sample path for leaf 1 is three steps with the expected sides', async () => {
    const t = await M.build(M.sample());
    const p = M.path(t.root, 1);
    assert.deepEqual(p.map((x) => x.side), ['L', 'R', 'R']);
    assert.equal(M.hex(p[0].hash), M.hex(t.leaves[0]));
    assert.equal(M.path(t.root, 7).map((x) => x.side).join(''), 'LLL');
  });
  test('RFC 6962 vector: proof for leaf 0 of the 8-leaf test tree', async () => {
    const t = await M.buildBytes(CT_LEAVES);
    const p = M.path(t.root, 0);
    assert.deepEqual(p.map((x) => M.hex(x.hash)), [
      '96a296d224f285c67bee93c30f8a309157f0daa35dc5b87e410b78630a09cfc7',
      '5f083f0a1a33ca076a95279832580db3e0ef4584bdff1f54c8a360f50de3031e',
      '6b47aaf29ee3c2af9af889bc1fb9254dabd31177f16232dd6aab035ca39bf6e4',
    ]);
    assert.equal((await M.verifyBytes(CT_LEAVES[0], p, CT_ROOTS[7])).ok, true);
  });
  test('an uppercase root is accepted', async () => {
    const s = M.sample();
    const t = await M.build(s);
    assert.equal((await M.verify(s[3], M.path(t.root, 3), M.hex(t.root.hash).toUpperCase())).ok, true);
  });
  test('tampering is detected: amount, direction, sibling, side, wrong leaf, wrong root', async () => {
    const s = M.sample();
    const t = await M.build(s);
    const root = M.hex(t.root.hash);
    const p = M.path(t.root, 1);
    assert.equal((await M.verify({ ...s[1], amount: s[1].amount + 1 }, p, root)).ok, false);
    assert.equal((await M.verify({ ...s[1], dir: 'out' }, p, root)).ok, false);
    assert.equal((await M.verify({ ...s[1], id: 'K-9999' }, p, root)).ok, false);
    const flipped = p.map((x, i) => (i === 1 ? { ...x, side: x.side === 'L' ? 'R' : 'L' } : x));
    assert.equal((await M.verify(s[1], flipped, root)).ok, false);
    const bent = p.map((x, i) => { if (i) return x; const h = new Uint8Array(x.hash); h[0] ^= 1; return { ...x, hash: h }; });
    assert.equal((await M.verify(s[1], bent, root)).ok, false);
    assert.equal((await M.verify(s[2], p, root)).ok, false);
    assert.equal((await M.verify(s[1], p.slice(0, 2), root)).ok, false);
    assert.equal((await M.verify(s[1], p, '0'.repeat(64))).ok, false);
  });
  test('path() rejects out-of-range and non-integer indices', async () => {
    const t = await M.build(M.sample());
    for (const m of [-1, 8, 1.5, NaN, '1']) assert.throws(() => M.path(t.root, m), RangeError, String(m));
    assert.throws(() => M.path(null, 0), RangeError);
  });
  test('malformed proofs and roots are rejected, not half-checked', async () => {
    const s = M.sample();
    const t = await M.build(s);
    const root = M.hex(t.root.hash);
    const p = M.path(t.root, 0);
    await assert.rejects(M.verify(s[0], 'nope', root), TypeError);
    await assert.rejects(M.verify(s[0], [null], root), TypeError);
    await assert.rejects(M.verify(s[0], [{ hash: new Uint8Array(31), side: 'L' }], root), TypeError);
    await assert.rejects(M.verify(s[0], [{ hash: Array.from(p[0].hash), side: 'R' }], root), TypeError);
    await assert.rejects(M.verify(s[0], [{ ...p[0], side: 'X' }], root), TypeError);
    await assert.rejects(M.verify(s[0], p, root.slice(1)), TypeError);
    await assert.rejects(M.verify(s[0], p, 'g'.repeat(64)), TypeError);
    await assert.rejects(M.verify(s[0], p, 42), TypeError);
    await assert.rejects(M.verify({ ...s[0], amount: 'x' }, p, root), RangeError);
  });
});
