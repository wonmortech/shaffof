/* Shaffof home page: theme switch, reveals, the "two reports" illustration and the live Merkle demo. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var lang = (doc.getAttribute('lang') || 'uz').slice(0, 2);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.ShaffofMerkle;

  var T = {
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
  }[lang] || null;
  if (!T) return;
  var nf = new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'uz-UZ');
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* theme */
  var tbtn = $('#theme');
  function syncTheme() { if (tbtn) tbtn.setAttribute('aria-label', T.theme[doc.getAttribute('data-theme') === 'dark' ? 'dark' : 'light']); }
  if (tbtn) {
    syncTheme();
    tbtn.addEventListener('click', function () {
      var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('shaffof-theme', next); } catch (e) { /* storage may be blocked */ }
      syncTheme();
    });
  }

  /* intro + reveals */
  requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('ready'); }); });
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  if (!M || !M.ok) { $$('[data-nocrypto]').forEach(function (el) { el.hidden = false; el.textContent = T.nocrypto; }); return; }

  /* 01: two reports, the same silent edit */
  (function () {
    var box = $('#compare'); if (!box) return;
    var base = M.sample().filter(function (e) { return e.id === 'K-0002' || e.id === 'C-0001' || e.id === 'C-0002'; });
    var edited = base.map(function (e) { var c = Object.assign({}, e); if (c.id === 'C-0001') c.amount = 940000; return c; });
    var pubRoot = '', editRoot = '', on = false, timer = 0;
    $$('.report-row', box).forEach(function (row) {
      var e = base.filter(function (x) { return x.id === row.getAttribute('data-id'); })[0];
      $('.amt', row).textContent = nf.format(e.amount);
    });
    function paint() {
      $$('.report-row[data-id="C-0001"]', box).forEach(function (row) {
        row.classList.toggle('edited', on);
        $('.amt', row).textContent = nf.format(on ? 940000 : 640000);
      });
      $('#plain-state').textContent = on ? T.plainEdited : T.plainSame;
      var r = on ? editRoot : pubRoot;
      $('#sh-root').textContent = r.slice(0, 16) + '…';
      var chip = $('#sh-state');
      chip.textContent = on ? T.shBad : T.shOk;
      chip.className = 'chip ' + (on ? 'chip-bad' : 'chip-good');
    }
    Promise.all([M.build(base), M.build(edited)]).then(function (rs) {
      pubRoot = M.hex(rs[0].root.hash); editRoot = M.hex(rs[1].root.hash);
      $('#sh-pub').textContent = pubRoot.slice(0, 16) + '…';
      if (reduce) { on = true; paint(); return; }
      paint();
      var vis = false;
      new IntersectionObserver(function (es) {
        vis = es[0].isIntersecting;
        clearInterval(timer);
        if (vis) timer = setInterval(function () { if (!document.hidden) { on = !on; paint(); } }, 3600);
      }).observe(box);
    });
  })();

  /* 03: live demo */
  (function () {
    var root = $('#demo'); if (!root) return;
    var orig = M.sample(), cur = M.sample(), pub = null, prev = null, tree = null, proofIdx = -1;
    var svg = $('#tree', root), rows = $$('#ledger-rows tr', root);
    var NS = 'http://www.w3.org/2000/svg';
    var X = function (lv, i) { var n = 8 >> lv; return 40 + (i + 0.5) * (560 / n); };
    var Y = [262, 186, 112, 40];
    var BW = [68, 74, 84, 150], BH = [34, 22, 22, 34];
    var nodes = [[], [], [], []], edges = [[], [], []];

    function el(name, attrs, parent) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    (function draw() {
      for (var lv = 0; lv < 3; lv++) for (var i = 0; i < (8 >> lv); i++) {
        var x1 = X(lv, i), y1 = Y[lv] - BH[lv] / 2, x2 = X(lv + 1, i >> 1), y2 = Y[lv + 1] + BH[lv + 1] / 2, my = (y1 + y2) / 2;
        edges[lv].push(el('path', { 'class': 'edge', d: 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2 }, svg));
      }
      for (var l = 0; l < 4; l++) for (var j = 0; j < (8 >> l); j++) {
        var g = el('g', { 'class': 'node' + (l === 3 ? ' root' : '') }, svg);
        el('rect', { x: X(l, j) - BW[l] / 2, y: Y[l] - BH[l] / 2, width: BW[l], height: BH[l], rx: l === 0 ? 8 : 6 }, g);
        if (l === 0) {
          var a = el('text', { x: X(l, j), y: Y[l] - 4, 'text-anchor': 'middle', 'class': 'lbl' }, g); a.textContent = orig[j].id;
          el('text', { x: X(l, j), y: Y[l] + 10, 'text-anchor': 'middle' }, g);
        } else if (l === 3) {
          var b = el('text', { x: X(l, j), y: Y[l] - 5, 'text-anchor': 'middle', 'class': 'lbl' }, g); b.textContent = 'root';
          el('text', { x: X(l, j), y: Y[l] + 10, 'text-anchor': 'middle' }, g);
        } else el('text', { x: X(l, j), y: Y[l] + 4, 'text-anchor': 'middle' }, g);
        nodes[l].push(g);
      }
      var seal = el('g', { 'class': 'seal', transform: 'translate(' + (X(3, 0) + 98) + ' ' + Y[3] + ')' }, svg);
      el('path', { d: 'M12 0 L0 12 L-12 0 L0 -12 Z' }, seal);
      el('path', { d: 'M8.5 8.5 L-8.5 8.5 L-8.5 -8.5 L8.5 -8.5 Z' }, seal);
    })();
    function levelsOf(t) {
      var out = [[], [], [], []];
      (function walk(n, d) { out[3 - d].push(M.hex(n.hash)); if (!n.leaf) { walk(n.left, d + 1); walk(n.right, d + 1); } })(t.root, 0);
      return out;
    }
    function nodeText(l, h) { return l === 3 ? h.slice(0, 16) : h.slice(0, l === 0 ? 8 : 8); }

    function render() {
      return M.build(cur).then(function (t) {
        tree = t;
        var lv = levelsOf(t);
        if (!pub) pub = lv;
        var nChanged = 0;
        for (var l = 0; l < 4; l++) for (var i = 0; i < lv[l].length; i++) {
          var g = nodes[l][i], h = lv[l][i], bad = h !== pub[l][i];
          var texts = g.getElementsByTagName('text');
          texts[texts.length - 1].textContent = nodeText(l, h);
          g.classList.toggle('bad', bad);
          if (prev && prev[l][i] !== h && !reduce) { g.classList.remove('pulse'); void g.getBBox(); g.classList.add('pulse'); }
          if (l < 3) edges[l][i].classList.toggle('bad', bad);
        }
        rows.forEach(function (r, i) {
          var ch = cur[i].amount !== orig[i].amount; r.classList.toggle('changed', ch); if (ch) nChanged++;
        });
        prev = lv;
        $('#root-pub').textContent = pub[3][0];
        $('#root-now').textContent = lv[3][0];
        var ok = lv[3][0] === pub[3][0], st = $('#demo-status');
        st.innerHTML = '';
        var chip = document.createElement('span');
        chip.className = 'chip ' + (ok ? 'chip-good' : 'chip-bad'); chip.textContent = ok ? T.match : T.mismatch;
        st.appendChild(chip);
        if (nChanged) { var s = document.createElement('span'); s.textContent = T.changed(nChanged); st.appendChild(s); }
        if (proofIdx > -1) check();
      });
    }
    function clearProof() {
      $$('.node, .edge', svg).forEach(function (n) { n.classList.remove('path', 'sib'); });
      rows.forEach(function (r) { r.classList.remove('proving'); });
    }
    function check() {
      var idx = +$('#receipt').value; proofIdx = idx;
      var p = M.path(tree.root, idx);
      clearProof();
      rows[idx].classList.add('proving');
      var id = idx;
      for (var l = 0; l < 4; l++) {
        nodes[l][id].classList.add('path');
        if (l < 3) { edges[l][id].classList.add('path'); nodes[l][id ^ 1].classList.add('sib'); }
        id >>= 1;
      }
      return M.verify(cur[idx], p, pub[3][0]).then(function (res) {
        var ol = $('#proof-steps'); ol.innerHTML = '';
        res.steps.forEach(function (s, i) {
          var li = document.createElement('li');
          if (i === 0) li.innerHTML = '<b>' + T.leaf + '</b> ' + s.hash.slice(0, 24) + '…';
          else li.innerHTML = '<b>' + i + '.</b> ' + T.sib[s.side] + ' ' + s.sibling.slice(0, 12) + '… ' + T.got + ' ' + s.hash.slice(0, 16) + '…';
          ol.appendChild(li);
        });
        var last = document.createElement('li');
        last.innerHTML = '<b>' + T.computed + '</b> ' + res.root.slice(0, 24) + '…';
        ol.appendChild(last);
        var out = $('#proof-result'); out.innerHTML = '';
        var c = document.createElement('span'); c.className = 'chip ' + (res.ok ? 'chip-good' : 'chip-bad');
        c.textContent = res.ok ? T.proofOk : T.proofBad; out.appendChild(c);
      });
    }

    rows.forEach(function (r, i) {
      var inp = $('input', r), cat = $('.cat-name', r);
      if (cat) cat.textContent = T.cat[orig[i].cat];
      var t = 0;
      inp.addEventListener('input', function () {
        var digits = inp.value.replace(/[^0-9]/g, '').slice(0, 12);
        if (digits !== inp.value) inp.value = digits;
        cur[i].amount = digits === '' ? 0 : parseInt(digits, 10);
        clearTimeout(t); t = setTimeout(render, 140);
      });
    });
    $('#reset').addEventListener('click', function () {
      cur = M.sample();
      rows.forEach(function (r, i) { $('input', r).value = String(orig[i].amount); });
      render();
    });
    $('#check').addEventListener('click', function () { check(); });
    $('#receipt').addEventListener('change', function () { if (proofIdx > -1) check(); });
    render();
  })();
})();
