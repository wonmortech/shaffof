/* Shaffof hero: a glass vessel of clear water. Eight ledger entries rest in it, pairs join upward
   into a Merkle tree, the root rises above the surface and is sealed with a girih star, then one
   entry's inclusion path lights up at a time. Canvas 2D, no dependencies.
   Stops off-screen and in hidden tabs; prefers-reduced-motion gets one finished still frame. */
(function () {
  'use strict';
  var cv = document.getElementById('stage');
  if (!cv) return;
  var ctx = null;
  try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
  if (!ctx) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
  var W = 0, H = 0, G = null, col = {}, levels = null;
  var rootLabel = cv.getAttribute('data-root') || 'Merkle root';
  var visible = true, raf = 0, elapsed = 0, lastNow = 0;
  var pointer = { x: -9999, y: -9999, on: false, spawn: 0 };
  var ripples = [], bubbles = [];
  var PROOF_ORDER = [1, 5, 2, 6, 3, 7, 0, 4];

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function prog(t, a, b) { return clamp((t - a) / (b - a)); }
  function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim().split(/\s+/).join(','); }
    col = { fg: v('--fg'), ink: v('--ink'), ink3: v('--ink-3'), a: v('--water-a'), s: v('--sand-fill'), sd: v('--sand'), panel: v('--panel'),
      dark: cs.getPropertyValue('color-scheme').indexOf('dark') > -1 };
  }

  function layout() {
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var vw = Math.min(W * 0.9, H * 0.7, 560), vh = Math.min(H * 0.92, vw * 1.42);
    var x0 = (W - vw) / 2, y0 = (H - vh) / 2;
    var lw = Math.min(vw / 8 * 0.72, 46);
    var g = { vw: vw, vh: vh, x0: x0, y0: y0, lw: lw, lh: lw * 1.3, surf: y0 + vh * 0.34, rad: Math.min(30, vw * 0.07),
      rows: [y0 + vh * 0.84, y0 + vh * 0.665, y0 + vh * 0.5, y0 + vh * 0.17], nodes: [] };
    var xs = [];
    for (var i = 0; i < 8; i++) xs.push(x0 + vw * (i + 0.5) / 8);
    g.nodes.push(xs);
    while (xs.length > 1) {
      var nx = [];
      for (var j = 0; j < xs.length; j += 2) nx.push((xs[j] + xs[j + 1]) / 2);
      g.nodes.push(nx); xs = nx;
    }
    g.sealR = Math.max(22, Math.min(vw * 0.1, 40));
    G = g;
    bubbles = [];
    for (var b = 0; b < 10; b++) bubbles.push(newBubble(true, b));
  }
  function newBubble(anywhere, seed) {
    var s = Math.sin((seed + 1) * 12.9898 + elapsed) * 43758.5453; s = s - Math.floor(s);
    var s2 = Math.sin((seed + 7) * 78.233 + elapsed) * 12543.13; s2 = s2 - Math.floor(s2);
    return { x: G.x0 + G.vw * (0.08 + s * 0.84), y: anywhere ? G.surf + (G.y0 + G.vh - G.surf) * s2 : G.y0 + G.vh - 8,
      r: 0.8 + s2 * 1.6, v: 6 + s * 9, ph: s2 * 6.28 };
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function surfaceY(x, t) {
    return G.surf + 3.2 * Math.sin(x * 0.017 + t * 0.55) + 1.8 * Math.sin(x * 0.043 - t * 0.8);
  }
  function nodeBox(level) { // level 0 = leaves, 3 = root
    if (level === 0) return { w: G.lw, h: G.lh };
    return { w: Math.min(G.lw * 1.35, 58), h: 18 };
  }
  function nodePos(level, i, t) {
    var x = G.nodes[level][i], y = G.rows[level];
    if (level === 0) y += Math.sin(t * 0.5 + i * 0.8) * 2.2;
    else if (level < 3) y += Math.sin(t * 0.42 + i * 1.3 + level) * 1.4;
    return { x: x, y: y };
  }
  function bez(a, b, u) { // vertical s-curve from child top to parent bottom
    var my = (a.y + b.y) / 2, v = 1 - u;
    return { x: v * v * v * a.x + 3 * v * v * u * a.x + 3 * v * u * u * b.x + u * u * u * b.x,
      y: v * v * v * a.y + 3 * v * v * u * my + 3 * v * u * u * my + u * u * u * b.y };
  }
  function edgeEnds(level, i, t) { // child (level, i) -> parent (level+1, i>>1)
    var c = nodePos(level, i, t), p = nodePos(level + 1, i >> 1, t);
    var cb = nodeBox(level), pb = level + 1 === 3 ? { h: G.sealR * 2 } : nodeBox(level + 1);
    return { a: { x: c.x, y: c.y - cb.h / 2 }, b: { x: p.x, y: p.y + pb.h / 2 } };
  }
  function strokeEdge(e, p) {
    if (p <= 0) return;
    ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y);
    var n = 22, k = Math.max(1, Math.round(n * p));
    for (var s = 1; s <= k; s++) { var q = bez(e.a, e.b, (s / n) * (p * n / k)); ctx.lineTo(q.x, q.y); }
    ctx.stroke();
  }

  function frame(t) {
    var g = G; ctx.clearRect(0, 0, W, H);
    var L = col.dark ? 1 : 0.85;

    // vessel body
    rr(g.x0, g.y0, g.vw, g.vh, g.rad);
    ctx.fillStyle = col.dark ? rgba(col.fg, 0.018) : 'rgba(255,255,255,0.55)'; ctx.fill();
    ctx.save(); rr(g.x0, g.y0, g.vw, g.vh, g.rad); ctx.clip();

    // water body under a moving surface
    ctx.beginPath(); ctx.moveTo(g.x0, surfaceY(g.x0, t));
    for (var x = g.x0; x <= g.x0 + g.vw + 4; x += 6) ctx.lineTo(x, surfaceY(x, t));
    ctx.lineTo(g.x0 + g.vw, g.y0 + g.vh); ctx.lineTo(g.x0, g.y0 + g.vh); ctx.closePath();
    var wg = ctx.createLinearGradient(0, g.surf, 0, g.y0 + g.vh);
    wg.addColorStop(0, rgba(col.a, col.dark ? 0.10 : 0.06)); wg.addColorStop(1, rgba(col.a, col.dark ? 0.24 : 0.17));
    ctx.fillStyle = wg; ctx.fill();

    // light shafts from the surface
    for (var s = 0; s < 3; s++) {
      var cx = g.x0 + g.vw * (0.22 + s * 0.28) + Math.sin(t * 0.13 + s * 2) * g.vw * 0.05, sw = g.vw * 0.07;
      var sg = ctx.createLinearGradient(0, g.surf, 0, g.y0 + g.vh);
      sg.addColorStop(0, rgba(col.dark ? '255,255,255' : col.s, col.dark ? 0.05 : 0.16)); sg.addColorStop(1, rgba(col.a, 0));
      ctx.fillStyle = sg; ctx.beginPath();
      ctx.moveTo(cx - sw, g.surf); ctx.lineTo(cx + sw, g.surf); ctx.lineTo(cx + sw * 2.2 + 18, g.y0 + g.vh); ctx.lineTo(cx - sw * 0.4 + 18, g.y0 + g.vh);
      ctx.closePath(); ctx.fill();
    }
    // caustic lines
    ctx.lineWidth = 1;
    for (var c = 0; c < 7; c++) {
      var by = g.surf + 26 + c * (g.y0 + g.vh - g.surf - 40) / 7;
      ctx.strokeStyle = rgba(col.a, (0.07 + 0.03 * Math.sin(t * 0.3 + c)) * (col.dark ? 1 : 1.4));
      ctx.beginPath();
      for (var xx = g.x0; xx <= g.x0 + g.vw + 6; xx += 8) {
        var yy = by + 5 * Math.sin(xx * 0.022 + t * 0.35 + c * 1.7) + 3 * Math.sin(xx * 0.051 - t * 0.27 + c);
        if (xx === g.x0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    // cursor glow in the water
    if (pointer.on && pointer.y > g.surf) {
      var pg = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 130);
      pg.addColorStop(0, rgba(col.a, col.dark ? 0.16 : 0.12)); pg.addColorStop(1, rgba(col.a, 0));
      ctx.fillStyle = pg; ctx.fillRect(pointer.x - 130, pointer.y - 130, 260, 260);
    }
    // bubbles
    for (var bi = 0; bi < bubbles.length; bi++) {
      var bb = bubbles[bi];
      ctx.beginPath(); ctx.arc(bb.x + Math.sin(t * 1.1 + bb.ph) * 2, bb.y, bb.r, 0, 6.283);
      ctx.strokeStyle = rgba(col.a, 0.45); ctx.lineWidth = 0.8; ctx.stroke();
    }
    // ripples from the cursor
    for (var ri = 0; ri < ripples.length; ri++) {
      var rp = ripples[ri], u = (t - rp.t0) / 2.8;
      if (u < 0 || u > 1) continue;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, 6 + 70 * ease(u), 0, 6.283);
      ctx.strokeStyle = rgba(col.a, 0.28 * (1 - u)); ctx.lineWidth = 1.2; ctx.stroke();
    }
    // seal ripple across the surface
    var sr = prog(t, 6.4, 9.4);
    if (sr > 0 && sr < 1) {
      ctx.beginPath(); ctx.ellipse(g.nodes[3][0], g.surf, 10 + g.vw * 0.62 * ease(sr), 4 + g.vw * 0.05 * ease(sr), 0, 0, 6.283);
      ctx.strokeStyle = rgba(col.s, 0.55 * (1 - sr)); ctx.lineWidth = 1.4; ctx.stroke();
    }
    ctx.restore();

    // surface line
    ctx.beginPath();
    for (var x2 = g.x0; x2 <= g.x0 + g.vw; x2 += 5) { var y2 = surfaceY(x2, t); if (x2 === g.x0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2); }
    ctx.strokeStyle = rgba(col.a, 0.55); ctx.lineWidth = 1.3; ctx.stroke();

    // proof highlight state
    var pt = t - 8.6, period = 5.6, pk = -1, pu = 0;
    if (pt > 0) { pk = PROOF_ORDER[Math.floor(pt / period) % 8]; pu = (pt % period) / period; }
    if (reduce) { pk = 2; pu = 0.5; }
    var pathIdx = [];
    if (pk > -1) { var id = pk; for (var lv = 0; lv < 4; lv++) { pathIdx.push(id); id >>= 1; } }
    var hl = pk > -1 ? Math.min(ease(pu / 0.18), 1 - ease((pu - 0.78) / 0.22)) : 0;

    // edges
    var edgeTimes = [[2.4, 3.7], [3.7, 5.0], [5.0, 6.2]];
    ctx.lineCap = 'round';
    for (var lev = 0; lev < 3; lev++) {
      var ep = ease(prog(t, edgeTimes[lev][0], edgeTimes[lev][1]));
      for (var ei = 0; ei < g.nodes[lev].length; ei++) {
        var onPath = pathIdx[lev] === ei;
        ctx.strokeStyle = rgba(col.fg, col.dark ? 0.26 : 0.22); ctx.lineWidth = 1.2;
        strokeEdge(edgeEnds(lev, ei, t), ep);
        if (onPath && hl > 0) { ctx.strokeStyle = rgba(col.s, 0.95 * hl); ctx.lineWidth = 2.4; strokeEdge(edgeEnds(lev, ei, t), ep); }
      }
    }
    // traveller dot on the proof path
    if (pk > -1 && hl > 0 && !reduce) {
      var tu = clamp((pu - 0.12) / 0.5), seg = Math.min(2, Math.floor(tu * 3)), fu = tu * 3 - seg;
      var e2 = edgeEnds(seg, pathIdx[seg], t), q = bez(e2.a, e2.b, clamp(fu));
      var dg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 14);
      dg.addColorStop(0, rgba(col.s, 0.9 * hl)); dg.addColorStop(1, rgba(col.s, 0));
      ctx.fillStyle = dg; ctx.fillRect(q.x - 14, q.y - 14, 28, 28);
    }

    // leaves: glass tablets, each with one entry
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var li = 0; li < 8; li++) {
      var la = ease(prog(t, 0.2 + li * 0.13, 1.6 + li * 0.13));
      if (la <= 0) continue;
      var lp = nodePos(0, li, t), lb = nodeBox(0), ly = lp.y + (1 - la) * 46;
      var inPath = pathIdx[0] === li && hl > 0, isSib = pk > -1 && (pk ^ 1) === li && hl > 0;
      ctx.globalAlpha = la;
      rr(lp.x - lb.w / 2, ly - lb.h / 2, lb.w, lb.h, 7);
      ctx.fillStyle = rgba(col.panel, col.dark ? 0.5 : 0.82); ctx.fill();
      ctx.strokeStyle = inPath ? rgba(col.s, 0.4 + 0.6 * hl) : rgba(col.fg, col.dark ? 0.22 : 0.18);
      ctx.lineWidth = inPath ? 1.8 : 1;
      if (isSib) ctx.setLineDash([3, 3]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(lp.x, ly - lb.h * 0.18, lb.w * 0.2, 0, 6.283);
      ctx.strokeStyle = rgba(col.s, 0.9); ctx.lineWidth = 1.3; ctx.stroke();
      ctx.fillStyle = rgba(col.fg, col.dark ? 0.2 : 0.16);
      ctx.fillRect(lp.x - lb.w * 0.3, ly + lb.h * 0.14, lb.w * 0.6, 2);
      ctx.fillRect(lp.x - lb.w * 0.3, ly + lb.h * 0.26, lb.w * 0.38, 2);
      ctx.globalAlpha = 1;
    }
    // internal nodes
    var nodeTimes = [3.5, 4.8, 6.0];
    ctx.font = '500 10px "Wm Mono", ui-monospace, monospace';
    for (var nl = 1; nl < 3; nl++) {
      var na = ease(prog(t, nodeTimes[nl - 1], nodeTimes[nl - 1] + 0.7));
      if (na <= 0) continue;
      for (var ni = 0; ni < g.nodes[nl].length; ni++) {
        var np = nodePos(nl, ni, t), nb = nodeBox(nl), onp = pathIdx[nl] === ni && hl > 0;
        var sib = pk > -1 && hl > 0 && (pathIdx[nl] ^ 1) === ni;
        ctx.globalAlpha = na;
        rr(np.x - nb.w / 2, np.y - nb.h / 2, nb.w, nb.h, 6);
        ctx.fillStyle = rgba(col.panel, col.dark ? 0.7 : 0.9); ctx.fill();
        ctx.strokeStyle = onp ? rgba(col.s, 0.4 + 0.6 * hl) : rgba(col.a, 0.6); ctx.lineWidth = onp ? 1.8 : 1;
        if (sib) ctx.setLineDash([3, 3]);
        ctx.stroke(); ctx.setLineDash([]);
        if (levels && nb.w >= 34) {
          ctx.fillStyle = rgba(col.ink, 0.75);
          ctx.fillText(levels[nl][ni].slice(0, nb.w >= 50 ? 6 : 4), np.x, np.y + 0.5);
        }
        ctx.globalAlpha = 1;
      }
    }
    // root and its seal
    var ra = ease(prog(t, 6.1, 7.0));
    if (ra > 0) {
      var rpos = nodePos(3, 0, t), R = g.sealR, st = ease(prog(t, 6.2, 7.5));
      var sc = 1 + 0.18 * (1 - ease(prog(t, 6.9, 7.8)));
      if (reduce) sc = 1;
      ctx.save(); ctx.translate(rpos.x, rpos.y); ctx.scale(sc, sc);
      ctx.globalAlpha = ra;
      var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.2);
      glow.addColorStop(0, rgba(col.s, (col.dark ? 0.22 : 0.28) * (0.8 + 0.2 * Math.sin(t * 0.9)))); glow.addColorStop(1, rgba(col.s, 0));
      ctx.fillStyle = glow; ctx.fillRect(-R * 2.2, -R * 2.2, R * 4.4, R * 4.4);
      ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, 6.283);
      ctx.fillStyle = rgba(col.panel, col.dark ? 0.85 : 0.95); ctx.fill();
      ctx.strokeStyle = rgba(col.a, 0.9); ctx.lineWidth = 1.4; ctx.stroke();
      var per = 4 * R * Math.SQRT2;
      ctx.strokeStyle = rgba(col.s, 0.95); ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
      ctx.rotate(t * 0.02);
      for (var sq = 0; sq < 2; sq++) {
        ctx.save(); ctx.rotate(sq * Math.PI / 4);
        ctx.setLineDash([per * st, per]);
        ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(0, R); ctx.lineTo(-R, 0); ctx.lineTo(0, -R); ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = ra;
      ctx.font = '500 11px "Wm Mono", ui-monospace, monospace'; ctx.fillStyle = rgba(col.ink, 0.85);
      if (levels) {
        var rh = levels[3][0].slice(0, 12), tw = ctx.measureText(rh).width + 14;
        rr(rpos.x - tw / 2, rpos.y + R + 7, tw, 18, 9);
        ctx.fillStyle = rgba(col.panel, col.dark ? 0.92 : 0.96); ctx.fill();
        ctx.strokeStyle = rgba(col.s, 0.5); ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = rgba(col.ink, 0.85); ctx.fillText(rh, rpos.x, rpos.y + R + 16.5);
      }
      ctx.fillStyle = rgba(col.ink3, 1);
      ctx.fillText(rootLabel, rpos.x, rpos.y - R - 14);
      ctx.globalAlpha = 1;
    }

    // glass: rim, reflection, lip
    rr(g.x0, g.y0, g.vw, g.vh, g.rad);
    ctx.strokeStyle = rgba(col.fg, col.dark ? 0.16 : 0.2); ctx.lineWidth = 1.2; ctx.stroke();
    var hg = ctx.createLinearGradient(0, g.y0, 0, g.y0 + g.vh);
    hg.addColorStop(0, 'rgba(255,255,255,' + (col.dark ? 0.12 : 0.9) + ')'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = hg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x0 + 12, g.y0 + g.rad + 6); ctx.lineTo(g.x0 + 12, g.y0 + g.vh * 0.62); ctx.stroke();
  }

  function levelsFrom(tree) {
    var out = [[], [], [], []];
    (function walk(n, d) { out[3 - d].push(Merkle.hex(n.hash)); if (!n.leaf) { walk(n.left, d + 1); walk(n.right, d + 1); } })(tree.root, 0);
    return out;
  }
  var Merkle = window.ShaffofMerkle;
  if (Merkle && Merkle.ok) Merkle.build(Merkle.sample()).then(function (tr) { levels = levelsFrom(tr); if (reduce) draw(); }).catch(function () {});

  function step(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    var dt = Math.min(0.05, (now - (lastNow || now)) / 1000); lastNow = now; elapsed += dt;
    for (var i = 0; i < bubbles.length; i++) {
      bubbles[i].y -= bubbles[i].v * dt;
      if (bubbles[i].y < G.surf + 6) bubbles[i] = newBubble(false, i + Math.floor(elapsed));
    }
    if (ripples.length && elapsed - ripples[0].t0 > 3) ripples.shift();
    frame(elapsed);
    raf = requestAnimationFrame(step);
  }
  var ready = false; // nothing draws until colours and layout exist (observers can fire earlier)
  function play() { if (ready && !raf && !reduce) { lastNow = 0; raf = requestAnimationFrame(step); } }
  function draw() { if (ready) frame(reduce ? 30 : elapsed); }

  function init() {
    if (ready) return;
    readColors(); layout(); ready = true;
    if (reduce) { draw(); return; }
    play();
  }
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('500 10px "Wm Mono"'), new Promise(function (r) { setTimeout(r, 900); })]).then(init, init);
  } else init();

  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (ready) { layout(); draw(); } }, 120); }, { passive: true });
  new MutationObserver(function () { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) play(); }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) play(); });
  cv.parentElement.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || reduce) return;
    var r = cv.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
    if (G && pointer.y > G.surf && pointer.x > G.x0 && pointer.x < G.x0 + G.vw && elapsed - pointer.spawn > 0.7 && ripples.length < 6) {
      ripples.push({ x: pointer.x, y: pointer.y, t0: elapsed }); pointer.spawn = elapsed;
    }
  }, { passive: true });
  cv.parentElement.addEventListener('pointerleave', function () { pointer.on = false; }, { passive: true });
})();
