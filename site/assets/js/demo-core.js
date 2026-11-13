/* Shaffof demo: the pure logic behind main.js (strings, number formatting, amount parsing, tree layout,
   proof wording). No DOM access here, so the Node tests can load it.
   Works as a classic script (sets globalThis.ShaffofDemo) and as a CommonJS module. */
(function (root) {
  'use strict';
  var STRINGS = {
    uz: {
      cat: { donation: 'Xayriya tushumi', food: 'Oziq-ovqat toʻplami', medicine: 'Dori-darmon', school: 'Oʻquv qurollari', fee: 'Bank komissiyasi' },
      match: 'Eʼlon qilingan ildizga mos', mismatch: 'Mos emas: hisobot eʼlon qilingandan keyin oʻzgargan',
      changed: function (n) { return n + ' ta yozuv oʻzgardi'; },
      plainEdited: 'Raqam oʻzgardi. Hech qanday iz qolmadi.', plainSame: 'Oddiy PDF yoki jadval',
      shOk: 'Eʼlon qilingan ildizga mos', shBad: 'Ildiz mos emas: oʻzgarish darhol koʻrinadi',
      leaf: 'Yozuv hashi', sib: { L: 'chapdagi qoʻshni bilan', R: 'oʻngdagi qoʻshni bilan' }, got: 'natija',
      computed: 'Hisoblangan ildiz', proofOk: 'Bor. Bu yozuv eʼlon qilingan ildizga matematik bogʻlangan.',
      proofBad: 'Isbot mos kelmadi: hisobot eʼlon qilinganidan farq qiladi.',
      theme: { dark: 'Yorugʻ mavzuga oʻtish', light: 'Qorongʻi mavzuga oʻtish' }, nocrypto: 'Bu brauzer WebCrypto’ni qoʻllamaydi, demo ishlamaydi.'
    },
    en: {
      cat: { donation: 'Donation received', food: 'Food parcels', medicine: 'Medicine', school: 'School supplies', fee: 'Bank fee' },
      match: 'Matches the published root', mismatch: 'Mismatch: the report changed after it was published',
      changed: function (n) { return n + (n === 1 ? ' entry changed' : ' entries changed'); },
      plainEdited: 'A number changed. No trace left.', plainSame: 'A plain PDF or spreadsheet',
      shOk: 'Matches the published root', shBad: 'Root mismatch: the change shows at once',
      leaf: 'Entry hash', sib: { L: 'with the left sibling', R: 'with the right sibling' }, got: 'gives',
      computed: 'Computed root', proofOk: 'Included. This entry is bound to the published root by the math.',
      proofBad: 'Proof failed: the report differs from the one that was published.',
      theme: { dark: 'Switch to light theme', light: 'Switch to dark theme' }, nocrypto: 'This browser lacks WebCrypto, so the demo cannot run.'
    },
    ru: {
      cat: { donation: 'Пожертвование', food: 'Продуктовые наборы', medicine: 'Лекарства', school: 'Школьные принадлежности', fee: 'Комиссия банка' },
      match: 'Совпадает с опубликованным корнем', mismatch: 'Не совпадает: отчёт изменили после публикации',
      changed: function (n) { return 'Изменено записей: ' + n; },
      plainEdited: 'Число изменили. Следов не осталось.', plainSame: 'Обычный PDF или таблица',
      shOk: 'Совпадает с опубликованным корнем', shBad: 'Корень не совпадает: изменение видно сразу',
      leaf: 'Хеш записи', sib: { L: 'с левым соседом', R: 'с правым соседом' }, got: 'даёт',
      computed: 'Вычисленный корень', proofOk: 'Есть. Запись математически связана с опубликованным корнем.',
      proofBad: 'Доказательство не сошлось: отчёт отличается от опубликованного.',
      theme: { dark: 'Включить светлую тему', light: 'Включить тёмную тему' }, nocrypto: 'Браузер не поддерживает WebCrypto, демо не работает.'
    }
  };
  var MAX_DIGITS = 12;

  /* Page language from the <html lang> value: first two letters, uz when missing. */
  function pageLang(attr) { return (attr || 'uz').slice(0, 2); }
  /* Own-property lookup only, so "constructor" or "__proto__" never resolve to something. */
  function strings(lang) { return Object.prototype.hasOwnProperty.call(STRINGS, lang) ? STRINGS[lang] : null; }
  function locale(lang) { return lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'uz-UZ'; }
  function formatter(lang) { return new Intl.NumberFormat(locale(lang)); }

  /* What the amount field keeps of what was typed: digits only, at most 12 (always a safe integer). */
  function parseAmount(raw) {
    var digits = String(raw == null ? '' : raw).replace(/[^0-9]/g, '').slice(0, MAX_DIGITS);
    return { digits: digits, value: digits === '' ? 0 : parseInt(digits, 10) };
  }

  /* Node hashes per level for the drawn tree: [leaves, ..., [root]] for a perfect tree of 8 leaves. */
  function levels(tree, hex) {
    var out = [[], [], [], []];
    (function walk(n, d) { out[3 - d].push(hex(n.hash)); if (!n.leaf) { walk(n.left, d + 1); walk(n.right, d + 1); } })(tree.root, 0);
    return out;
  }
  function nodeText(level, h) { return level === 3 ? h.slice(0, 16) : h.slice(0, 8); }

  /* Indices of the nodes to light up for leaf idx: path nodes per level and, below the root, their siblings. */
  function highlight(idx, depth) {
    var out = [], id = idx;
    for (var l = 0; l <= depth; l++) { out.push({ level: l, node: id, sibling: l < depth ? id ^ 1 : -1 }); id >>= 1; }
    return out;
  }
  function changedCount(cur, orig) {
    var n = 0;
    for (var i = 0; i < cur.length; i++) if (cur[i].amount !== orig[i].amount) n++;
    return n;
  }

  /* The proof steps as [bold label, plain text] pairs; main.js turns them into <li><b>…</b> …</li>
     with textContent only, so no string here is ever parsed as HTML. */
  function proofLines(res, T) {
    var lines = res.steps.map(function (s, i) {
      if (i === 0) return [T.leaf, ' ' + s.hash.slice(0, 24) + '…'];
      return [i + '.', ' ' + T.sib[s.side] + ' ' + s.sibling.slice(0, 12) + '… ' + T.got + ' ' + s.hash.slice(0, 16) + '…'];
    });
    lines.push([T.computed, ' ' + res.root.slice(0, 24) + '…']);
    return lines;
  }

  var api = {
    STRINGS: STRINGS, MAX_DIGITS: MAX_DIGITS,
    pageLang: pageLang, strings: strings, locale: locale, formatter: formatter, parseAmount: parseAmount,
    levels: levels, nodeText: nodeText, highlight: highlight, changedCount: changedCount, proofLines: proofLines
  };
  root.ShaffofDemo = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
