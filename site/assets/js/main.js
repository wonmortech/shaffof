/* Shaffof home page: theme switch, reveals, the "two reports" illustration and the live Merkle demo. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var D = window.ShaffofDemo;
  if (!D) return;
  var lang = D.pageLang(doc.getAttribute('lang'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.ShaffofMerkle;

  var T = D.strings(lang);
  if (!T) return;
  var nf = D.formatter(lang);
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
    function levelsOf(t) { return D.levels(t, M.hex); }
    var nodeText = D.nodeText;

    function render() {
      return M.build(cur).then(function (t) {
        tree = t;
        var lv = levelsOf(t);
        if (!pub) pub = lv;
        var nChanged = D.changedCount(cur, orig);
        for (var l = 0; l < 4; l++) for (var i = 0; i < lv[l].length; i++) {
          var g = nodes[l][i], h = lv[l][i], bad = h !== pub[l][i];
          var texts = g.getElementsByTagName('text');
          texts[texts.length - 1].textContent = nodeText(l, h);
          g.classList.toggle('bad', bad);
          if (prev && prev[l][i] !== h && !reduce) { g.classList.remove('pulse'); void g.getBBox(); g.classList.add('pulse'); }
          if (l < 3) edges[l][i].classList.toggle('bad', bad);
        }
        rows.forEach(function (r, i) {
          r.classList.toggle('changed', cur[i].amount !== orig[i].amount);
        });
        prev = lv;
        $('#root-pub').textContent = pub[3][0];
        $('#root-now').textContent = lv[3][0];
        var ok = lv[3][0] === pub[3][0], st = $('#demo-status');
        st.textContent = '';
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
      D.highlight(idx, 3).forEach(function (h) {
        nodes[h.level][h.node].classList.add('path');
        if (h.sibling > -1) { edges[h.level][h.node].classList.add('path'); nodes[h.level][h.sibling].classList.add('sib'); }
      });
      return M.verify(cur[idx], p, pub[3][0]).then(function (res) {
        var ol = $('#proof-steps'); ol.textContent = '';
        D.proofLines(res, T).forEach(function (line) {
          var li = document.createElement('li'), b = document.createElement('b');
          b.textContent = line[0];
          li.appendChild(b);
          li.appendChild(document.createTextNode(line[1]));
          ol.appendChild(li);
        });
        var out = $('#proof-result'); out.textContent = '';
        var c = document.createElement('span'); c.className = 'chip ' + (res.ok ? 'chip-good' : 'chip-bad');
        c.textContent = res.ok ? T.proofOk : T.proofBad; out.appendChild(c);
      });
    }

    rows.forEach(function (r, i) {
      var inp = $('input', r), cat = $('.cat-name', r);
      if (cat) cat.textContent = T.cat[orig[i].cat];
      var t = 0;
      inp.addEventListener('input', function () {
        var a = D.parseAmount(inp.value);
        if (a.digits !== inp.value) inp.value = a.digits;
        cur[i].amount = a.value;
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
