// Unit tests for site/assets/js/demo-core.js: strings, number formatting, amount parsing, tree layout.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import D from '../../site/assets/js/demo-core.js';
import M from '../../site/assets/js/merkle.js';

const LANGS = ['uz', 'en', 'ru'];
const shape = (o) => Object.keys(o).sort().map((k) => (o[k] && typeof o[k] === 'object' ? `${k}{${shape(o[k])}}` : `${k}:${typeof o[k]}`)).join(',');

describe('strings', () => {
  test('exposes the same API on globalThis for the browser', () => {
    assert.equal(globalThis.ShaffofDemo, D);
  });
  test('uz, en and ru have exactly the same keys and value types', () => {
    const ref = shape(D.STRINGS.uz);
    for (const l of LANGS) assert.equal(shape(D.STRINGS[l]), ref, l);
    assert.deepEqual(Object.keys(D.STRINGS).sort(), [...LANGS].sort());
  });
  test('every category the sample ledger uses has a label in every language', () => {
    for (const l of LANGS) for (const e of M.sample()) assert.ok(D.STRINGS[l].cat[e.cat], `${l} ${e.cat}`);
  });
  test('no string is empty or contains markup', () => {
    for (const l of LANGS) {
      (function walk(o) {
        for (const v of Object.values(o)) {
          if (typeof v === 'string') { assert.ok(v.trim(), l); assert.doesNotMatch(v, /[<>]/, l); } else if (typeof v === 'object') walk(v);
        }
      })(D.STRINGS[l]);
    }
  });
  test('changed() counts in each language, with English plurals', () => {
    assert.equal(D.STRINGS.en.changed(1), '1 entry changed');
    assert.equal(D.STRINGS.en.changed(3), '3 entries changed');
    assert.equal(D.STRINGS.uz.changed(2), '2 ta yozuv oʻzgardi');
    assert.equal(D.STRINGS.ru.changed(5), 'Изменено записей: 5');
  });
  test('strings() looks up own languages only', () => {
    for (const l of LANGS) assert.equal(D.strings(l), D.STRINGS[l]);
    for (const l of ['de', '', 'constructor', '__proto__', 'toString', undefined]) assert.equal(D.strings(l), null, String(l));
  });
  test('pageLang() keeps the first two letters and defaults to uz', () => {
    assert.equal(D.pageLang('en-GB'), 'en');
    assert.equal(D.pageLang('ru'), 'ru');
    assert.equal(D.pageLang(''), 'uz');
    assert.equal(D.pageLang(null), 'uz');
  });
});

describe('number formatting', () => {
  test('locale per language, uz-UZ by default', () => {
    assert.equal(D.locale('en'), 'en-US');
    assert.equal(D.locale('ru'), 'ru-RU');
    assert.equal(D.locale('uz'), 'uz-UZ');
    assert.equal(D.locale('xx'), 'uz-UZ');
  });
  test('formats like Intl.NumberFormat for that locale (same as the static pages)', () => {
    for (const l of LANGS) {
      const want = new Intl.NumberFormat(D.locale(l));
      for (const n of [0, 4500, 640000, 1200000, 999999999999]) assert.equal(D.formatter(l).format(n), want.format(n));
    }
    assert.equal(D.formatter('en').format(1200000), '1,200,000');
  });
});

describe('amount parsing', () => {
  test('keeps digits only', () => {
    assert.deepEqual(D.parseAmount('640000'), { digits: '640000', value: 640000 });
    assert.deepEqual(D.parseAmount(' 1 200 000 '), { digits: '1200000', value: 1200000 });
    assert.deepEqual(D.parseAmount('12a3-4.5'), { digits: '12345', value: 12345 });
  });
  test('markup and script text cannot survive into the field', () => {
    assert.deepEqual(D.parseAmount('<img src=x onerror=alert(1)>'), { digits: '1', value: 1 });
    assert.deepEqual(D.parseAmount('"><script>'), { digits: '', value: 0 });
  });
  test('empty or missing input is zero', () => {
    for (const raw of ['', 'abc', null, undefined]) assert.deepEqual(D.parseAmount(raw), { digits: '', value: 0 }, String(raw));
  });
  test('caps at 12 digits, so the value stays a safe integer', () => {
    const a = D.parseAmount('9'.repeat(30));
    assert.equal(a.digits.length, D.MAX_DIGITS);
    assert.equal(a.value, 999999999999);
    assert.ok(Number.isSafeInteger(a.value));
    assert.doesNotThrow(() => M.serialize({ ...M.sample()[0], amount: a.value }));
  });
  test('leading zeros parse as decimal', () => {
    assert.deepEqual(D.parseAmount('0089'), { digits: '0089', value: 89 });
  });
  test('non-ASCII digits are dropped, not reinterpreted', () => {
    assert.deepEqual(D.parseAmount('٣٤5'), { digits: '5', value: 5 });
  });
});

describe('tree layout and proof wording', () => {
  test('levels() lists 8, 4, 2, 1 hashes from leaves to root', async () => {
    const t = await M.build(M.sample());
    const lv = D.levels(t, M.hex);
    assert.deepEqual(lv.map((x) => x.length), [8, 4, 2, 1]);
    assert.equal(lv[3][0], M.hex(t.root.hash));
    assert.deepEqual(lv[0], t.leaves.map(M.hex));
    assert.equal(lv[1][0], M.hex(t.root.left.left.hash));
  });
  test('nodeText() shows 16 characters for the root and 8 elsewhere', () => {
    const h = 'abcdef0123456789'.repeat(4);
    assert.equal(D.nodeText(3, h), h.slice(0, 16));
    for (const l of [0, 1, 2]) assert.equal(D.nodeText(l, h), h.slice(0, 8));
  });
  test('highlight() walks the path upward with siblings below the root', () => {
    assert.deepEqual(D.highlight(5, 3), [
      { level: 0, node: 5, sibling: 4 },
      { level: 1, node: 2, sibling: 3 },
      { level: 2, node: 1, sibling: 0 },
      { level: 3, node: 0, sibling: -1 },
    ]);
  });
  test('highlight() matches the sibling hashes the proof uses', async () => {
    const t = await M.build(M.sample());
    const lv = D.levels(t, M.hex);
    for (let i = 0; i < 8; i++) {
      const p = M.path(t.root, i);
      D.highlight(i, 3).slice(0, 3).forEach((h, k) => assert.equal(lv[h.level][h.sibling], M.hex(p[k].hash), `leaf ${i} step ${k}`));
    }
  });
  test('changedCount() counts amounts that differ', () => {
    const a = M.sample(), b = M.sample();
    assert.equal(D.changedCount(a, b), 0);
    b[2].amount = 1; b[7].amount = 2;
    assert.equal(D.changedCount(b, a), 2);
  });
  test('proofLines() gives label + text pairs for every step and the computed root', async () => {
    const s = M.sample();
    const t = await M.build(s);
    const res = await M.verify(s[1], M.path(t.root, 1), M.hex(t.root.hash));
    const T = D.strings('en');
    const lines = D.proofLines(res, T);
    assert.equal(lines.length, res.steps.length + 1);
    assert.deepEqual(lines[0], ['Entry hash', ' ' + res.steps[0].hash.slice(0, 24) + '…']);
    assert.deepEqual(lines[1], ['1.', ' with the left sibling ' + res.steps[1].sibling.slice(0, 12) + '… gives ' + res.steps[1].hash.slice(0, 16) + '…']);
    assert.match(lines[2][1], /^ with the right sibling /);
    assert.deepEqual(lines.at(-1), ['Computed root', ' ' + res.root.slice(0, 24) + '…']);
  });
});
