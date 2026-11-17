// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

/* Shaffof concept demo: the planned product UI (public reports, receipt proofs, fund console, zakat
   calculator) running entirely in the browser on fictional data. Hash routing, so any static host and
   any sub-path work. Hashing is the real RFC 9162 code of the home page (site/assets/js/merkle.js). */
import { seed, CATS, TYPES, sealState, monthKey } from './data.js';
import { METHODS, SOURCES, NISAB, SAMPLE_PRICES, compute, sampleInput, blank } from './zakat.js';

const M = globalThis.ShaffofMerkle;
const NOW = new Date();
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const NF = new Intl.NumberFormat('en-US');

/* ---------- tiny DOM helpers (no innerHTML, so the strict CSP and escaping are never a concern) ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k.nodeType ? k : String(k));
  return el;
}
const SVG = 'http://www.w3.org/2000/svg';
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const k of kids) if (k != null) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
const som = (n) => NF.format(n).replace(/,/g, ' ') + ' soʻm';
const mln = (n) => (n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace('.', ',') + ' mln';
const monthName = (key) => { const [y, m] = key.split('-'); return MONTHS[Number(m) - 1] + ' ' + y; };
const shortMonth = (key) => MONTHS[Number(key.split('-')[1]) - 1].slice(0, 3);
const dateText = (iso) => { const [y, m, d] = iso.split('-'); return Number(d) + ' ' + MONTHS[Number(m) - 1].toLowerCase() + ' ' + y; };
const short = (hex, n = 10) => hex.slice(0, n) + '…' + hex.slice(-6);
const toBytes = (hex) => new Uint8Array(hex.match(/../g).map((b) => parseInt(b, 16)));
const go = (path) => { location.hash = '#' + path; };
const link = (path, ...kids) => h('a', { href: '#' + path }, ...kids);

/* ---------- world: seed data plus the roots and seal states computed from it ---------- */
const world = seed(NOW);
const byId = new Map(world.funds.map((f) => [f.id, f]));
const receipts = new Map(); // entry id -> {fund, key}
const log = [];
let session = null; // fund console sign-in

async function sealReport(fund, key, state, sealedOn) {
  const entries = fund.ledger[key];
  const tree = await M.build(entries);
  const root = M.hex(tree.root.hash);
  const block = 917000 + Math.abs(parseInt(root.slice(0, 6), 16) % 9000);
  fund.reports[key] = { key, root, tree, state, sealedOn, block, entries };
  for (const e of entries) receipts.set(e.id, { fund, key });
  return fund.reports[key];
}

async function buildWorld() {
  const jobs = [];
  world.funds.forEach((f, fi) => {
    const closed = f.months.filter((k) => k !== world.current);
    closed.forEach((key, mi) => {
      const [y, m] = key.split('-').map(Number);
      const sealedOn = monthKey(new Date(y, m, 1)) + '-0' + (1 + (fi % 3));
      jobs.push(sealReport(f, key, sealState(fi, mi, closed.length), sealedOn));
    });
    for (const e of f.ledger[world.current] || []) receipts.set(e.id, { fund: f, key: world.current });
  });
  await Promise.all(jobs);
  const mehr = byId.get('mehr');
  const acts = [
    ['Oy yopildi va ildiz eʼlon qilindi', 'seal'], ['Yozuv qoʻshildi: oziq-ovqat toʻplami', 'add'], ['Tuzatish: notoʻgʻri summa teskari yozuv bilan', 'fix'],
    ['Bank koʻchirmasi bilan solishtirildi', 'check'], ['Yozuv qoʻshildi: xayriya tushumi', 'add'], ['Kalendar tasdigʻi olindi (Bitcoin bloki)', 'seal'],
    ['Hisobot sahifasi yangilandi', 'check'], ['Yozuv qoʻshildi: dori-darmon', 'add'], ['Ikkinchi imzo: hisobchi tasdiqladi', 'check'],
    ['Yozuv qoʻshildi: kommunal toʻlov', 'add'], ['Kirish: operator (demo)', 'check'], ['Yozuv qoʻshildi: bank komissiyasi', 'add'],
  ];
  acts.forEach(([text, kind], i) => log.push({ at: new Date(NOW.getTime() - (i * 7 + 3) * 3600e3), text, kind, fund: mehr.name }));
}

/* ---------- aggregates ---------- */
function totals(entries) {
  let inn = 0, out = 0;
  for (const e of entries) e.dir === 'in' ? (inn += e.amount) : (out += e.amount);
  return { inn, out, bal: inn - out };
}
function fundSeries(funds) {
  const keys = world.months.slice(0, -1);
  return keys.map((key) => {
    let inn = 0, out = 0;
    for (const f of funds) if (f.ledger[key]) { const t = totals(f.ledger[key]); inn += t.inn; out += t.out; }
    return { key, inn, out };
  });
}
function catBreakdown(funds) {
  const map = {};
  for (const f of funds) for (const key of f.months) if (key !== world.current) for (const e of f.ledger[key]) {
    if (e.dir === 'out' && e.cat !== 'correction') map[e.cat] = (map[e.cat] || 0) + e.amount;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
const allReports = () => world.funds.flatMap((f) => Object.values(f.reports).map((r) => ({ f, r })));

/* ---------- shared widgets ---------- */
const STATE = {
  confirmed: ['ok', 'Muhrlangan', 'Bitcoin bloki bilan tasdiqlangan'],
  calendar: ['wait', 'Kalendarda', 'OpenTimestamps kalendari qabul qildi, Bitcoin tasdigʻi kutilmoqda (odatda bir necha soat)'],
  retry: ['warn', 'Qayta yuborildi', 'Bitta kalendar javob bermadi; ildiz boshqa kalendarga qayta yuborildi'],
  open: ['muted', 'Ochiq oy', 'Oy hali yopilmagan, yozuvlar qoʻshilmoqda'],
};
const FSTATUS = { active: ['ok', 'Faol'], onboarding: ['wait', 'Ulanmoqda'], paused: ['muted', 'Toʻxtatilgan'] };
function badge(kind, text, title) { return h('span', { class: 'badge b-' + kind, title }, text); }
function stateBadge(st) { const [k, t, d] = STATE[st]; return badge(k, t, d); }

function barChart(series, opts = {}) {
  const W = 720, H = opts.h || 220, pad = 34, gap = 6;
  const max = Math.max(1, ...series.flatMap((d) => [d.inn, d.out]));
  const bw = (W - pad - 8) / series.length;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': opts.label || 'Oylik tushum va chiqim' });
  for (let i = 0; i <= 4; i++) {
    const y = 8 + (H - 36) * (1 - i / 4);
    svg.append(s('line', { x1: pad, x2: W, y1: y, y2: y, class: 'grid' }));
    svg.append(s('text', { x: pad - 6, y: y + 4, class: 'axis', 'text-anchor': 'end' }, i === 0 ? '0' : mln(max * i / 4).replace(' mln', '')));
  }
  series.forEach((d, i) => {
    const x = pad + i * bw + gap / 2, w = (bw - gap) / 2;
    const hi = (H - 36) * d.inn / max, ho = (H - 36) * d.out / max;
    const g = s('g', { class: 'bar' });
    g.append(s('rect', { x, y: 8 + (H - 36) - hi, width: w, height: Math.max(1, hi), rx: 3, class: 'in' }));
    g.append(s('rect', { x: x + w, y: 8 + (H - 36) - ho, width: w, height: Math.max(1, ho), rx: 3, class: 'out' }));
    g.append(s('title', {}, `${monthName(d.key)}: tushum ${som(d.inn)}, chiqim ${som(d.out)}`));
    svg.append(g, s('text', { x: x + w, y: H - 10, class: 'axis', 'text-anchor': 'middle' }, shortMonth(d.key)));
  });
  return h('figure', { class: 'chart-wrap' }, svg,
    h('figcaption', { class: 'legend' }, h('span', { class: 'k in' }), 'Tushum', h('span', { class: 'k out' }), 'Chiqim', opts.note ? h('span', { class: 'note' }, opts.note) : null));
}
function catBars(rows) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  const total = rows.reduce((a, r) => a + r[1], 0) || 1;
  return h('ul', { class: 'cats' }, rows.map(([cat, v]) => {
    const fill = h('span', { class: 'fill' });
    fill.style.width = (100 * v / max).toFixed(1) + '%';
    return h('li', null, h('span', { class: 'cl' }, CATS[cat].label), h('span', { class: 'track' }, fill), h('span', { class: 'cv' }, mln(v), h('small', null, ' ' + Math.round(100 * v / total) + '%')));
  }));
}
function kpi(label, value, sub) { return h('div', { class: 'kpi' }, h('span', { class: 'kl' }, label), h('strong', null, value), sub ? h('span', { class: 'ks' }, sub) : null); }
function card(title, ...kids) { return h('section', { class: 'card' }, title ? h('h2', null, title) : null, ...kids); }
function copyBtn(text) {
  const b = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { navigator.clipboard?.writeText(text).catch(() => {}); b.textContent = 'Nusxalandi'; setTimeout(() => { b.textContent = 'Nusxalash'; }, 1400); } }, 'Nusxalash');
  return b;
}
function empty(title, text, action) { return h('div', { class: 'empty' }, h('strong', null, title), h('p', null, text), action || null); }
function crumbs(...parts) { return h('nav', { class: 'crumbs', 'aria-label': 'Yoʻl' }, parts.map((p, i) => [i ? h('span', { 'aria-hidden': 'true' }, '/') : null, p])); }

/* ---------- views ---------- */
function viewHome() {
  const active = world.funds.filter((f) => f.status !== 'onboarding');
  const reps = allReports();
  const entries = reps.reduce((a, x) => a + x.r.entries.length, 0);
  const series = fundSeries(world.funds);
  const yr = series.reduce((a, d) => ({ inn: a.inn + d.inn, out: a.out + d.out }), { inn: 0, out: 0 });
  const recent = reps.filter((x) => x.r.key === world.months[world.months.length - 2]).slice(0, 9);
  const sample = recent[0].r.entries.find((e) => e.dir === 'in');
  const input = h('input', { id: 'quick-receipt', class: 'input mono', value: sample.id, 'aria-label': 'Kvitansiya raqami', spellcheck: 'false' });
  return [
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Ochiq hisobotlar · konsept demo'),
      h('h1', null, 'Xayriya pullari qayerga ketganini ', h('em', null, 'oʻzingiz'), ' tekshiring'),
      h('p', { class: 'lead' }, 'Har oy jamgʻarma yozuvlari Merkle ildiziga yigʻiladi va vaqtga muhrlanadi. Hisobot keyin oʻzgarsa, darhol koʻrinadi. Xayriyachi oʻz kvitansiyasini ism-sharifsiz tekshiradi.')),
    h('div', { class: 'kpis' },
      kpi('Jamgʻarmalar', String(active.length), `${world.funds.length - active.length} tasi ulanmoqda`),
      kpi('Eʼlon qilingan hisobotlar', String(reps.length), 'har biri muhrlangan ildiz bilan'),
      kpi('Tekshiriladigan yozuvlar', NF.format(entries).replace(/,/g, ' '), 'har biri kvitansiya bilan'),
      kpi('12 oylik tushum', mln(yr.inn), `chiqim ${mln(yr.out)}`)),
    h('div', { class: 'grid-2' },
      card('Barcha jamgʻarmalar: 12 oy', barChart(series, { note: 'namuna maʼlumot', h: 330 })),
      card('Kvitansiyani tekshirish',
        h('p', { class: 'muted' }, 'Kvitansiya raqamingizni kiriting. Tekshirish brauzerda, serverimizsiz hisoblanadi.'),
        h('form', { class: 'row', onsubmit: (e) => { e.preventDefault(); go('/verify/' + encodeURIComponent(input.value.trim())); } },
          input, h('button', { class: 'btn', type: 'submit' }, 'Tekshirish')),
        h('p', { class: 'hint' }, 'Namuna: ', recent.slice(1, 4).map((x) => { const e = x.r.entries.find((q) => q.dir === 'in'); return h('a', { href: '#/verify/' + e.id, class: 'chip mono' }, e.id); })),
        h('h3', null, 'Xarajat toifalari'), catBars(catBreakdown(world.funds).slice(0, 6)))),
    card('Soʻnggi muhrlar · ' + monthName(world.months[world.months.length - 2]),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'Jamgʻarma'), h('th', null, 'Yozuvlar'), h('th', { class: 'num' }, 'Tushum'), h('th', { class: 'num' }, 'Chiqim'), h('th', null, 'Ildiz'), h('th', null, 'Muhr'))),
        h('tbody', null, recent.map(({ f, r }) => {
          const t = totals(r.entries);
          return h('tr', { class: 'click', onclick: () => go(`/r/${f.id}/${r.key}`) },
            h('td', null, link(`/r/${f.id}/${r.key}`, f.name), h('div', { class: 'sub' }, TYPES[f.type] + ' · ' + f.district)),
            h('td', null, String(r.entries.length)), h('td', { class: 'num' }, mln(t.inn)), h('td', { class: 'num' }, mln(t.out)),
            h('td', { class: 'mono' }, short(r.root)), h('td', null, stateBadge(r.state)));
        })))),
      h('p', { class: 'foot' }, link('/funds', 'Barcha jamgʻarmalar →'))),
  ];
}

const fundFilter = { q: '', type: 'all' };
function viewFunds() {
  const list = h('div', { class: 'fund-grid' });
  const draw = () => {
    const q = fundFilter.q.toLowerCase();
    const rows = world.funds.filter((f) => (fundFilter.type === 'all' || f.type === fundFilter.type) && (!q || (f.name + f.district + f.about).toLowerCase().includes(q)));
    list.replaceChildren(...(rows.length ? rows.map(fundCard) : [empty('Hech narsa topilmadi', 'Qidiruvni qisqartiring yoki boshqa turni tanlang. Demo 16 ta toʻqima jamgʻarmani oʻz ichiga oladi.',
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { fundFilter.q = ''; fundFilter.type = 'all'; search.value = ''; chips(); draw(); } }, 'Filtrni tozalash'))]));
  };
  const search = h('input', { class: 'input', type: 'search', placeholder: 'Nom, tuman yoki maqsad', value: fundFilter.q, 'aria-label': 'Qidirish', oninput: (e) => { fundFilter.q = e.target.value; draw(); } });
  const chipBox = h('div', { class: 'chips', role: 'group', 'aria-label': 'Tur' });
  const chips = () => chipBox.replaceChildren(...[['all', 'Hammasi'], ...Object.entries(TYPES)].map(([k, t]) =>
    h('button', { type: 'button', class: 'chip' + (fundFilter.type === k ? ' on' : ''), 'aria-pressed': String(fundFilter.type === k), onclick: () => { fundFilter.type = k; chips(); draw(); } }, t)));
  chips(); draw();
  return [
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Katalog'), h('h1', null, 'Jamgʻarmalar'),
      h('p', { class: 'lead' }, 'Har bir jamgʻarma oylik hisobotini muhrlab eʼlon qiladi. Pul har doim jamgʻarmaning oʻz bank hisobida; Shaffof unga tegmaydi.')),
    h('div', { class: 'toolbar' }, search, chipBox), list,
  ];
}
function fundCard(f) {
  const reps = Object.values(f.reports);
  const last = reps[reps.length - 1];
  const [k, t] = FSTATUS[f.status];
  return h('a', { class: 'fund', href: '#/funds/' + f.id },
    h('div', { class: 'fund-top' }, h('span', { class: 'mark', 'aria-hidden': 'true' }, f.name.slice(0, 1)), badge(k, t)),
    h('strong', null, f.name), h('span', { class: 'sub' }, TYPES[f.type] + ' · ' + f.district), h('p', null, f.about),
    h('dl', { class: 'mini' }, h('div', null, h('dt', null, 'Hisobotlar'), h('dd', null, String(reps.length))),
      h('div', null, h('dt', null, 'Soʻnggi ildiz'), h('dd', { class: 'mono' }, last ? last.root.slice(0, 8) : 'hali yoʻq'))));
}

function viewFund(id) {
  const f = byId.get(id);
  if (!f) return notFound();
  const reps = Object.values(f.reports).slice().reverse();
  const open = f.ledger[world.current] || [];
  const t12 = reps.reduce((a, r) => { const t = totals(r.entries); return { inn: a.inn + t.inn, out: a.out + t.out }; }, { inn: 0, out: 0 });
  const [k, t] = FSTATUS[f.status];
  return [
    crumbs(link('/funds', 'Jamgʻarmalar'), h('span', null, f.name)),
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, TYPES[f.type] + ' · ' + f.district), h('h1', null, f.name, ' ', badge(k, t)), h('p', { class: 'lead' }, f.about)),
    f.status === 'paused' ? h('div', { class: 'notice' }, 'Bu tashabbus vaqtincha toʻxtatilgan: eski hisobotlar ochiq va tekshiriladi, yangi oy yozuvlari kamaygan.') : null,
    h('div', { class: 'kpis' }, kpi('Eʼlon qilingan hisobotlar', String(reps.length)), kpi('Jami tushum', mln(t12.inn)), kpi('Jami chiqim', mln(t12.out)),
      kpi('Joriy oy', open.length + ' yozuv', 'hali muhrlanmagan')),
    reps.length ? h('div', { class: 'grid-2' }, card('Oylik tushum va chiqim', barChart(fundSeries([f]).filter((d) => f.ledger[d.key]))), card('Xarajat toifalari', catBars(catBreakdown([f])))) : null,
    card('Oylik hisobotlar', reps.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, h('th', null, 'Oy'), h('th', null, 'Yozuvlar'), h('th', { class: 'num' }, 'Tushum'), h('th', { class: 'num' }, 'Chiqim'), h('th', { class: 'num' }, 'Qoldiq'), h('th', null, 'Ildiz'), h('th', null, 'Muhr'))),
      h('tbody', null,
        open.length && !f.reports[world.current] ? h('tr', null, h('td', null, monthName(world.current)), h('td', null, String(open.length)), h('td', { class: 'num' }, mln(totals(open).inn)), h('td', { class: 'num' }, mln(totals(open).out)), h('td', { class: 'num' }, '…'), h('td', { class: 'muted' }, 'oy oxirida'), h('td', null, stateBadge('open'))) : null,
        reps.map((r) => { const tt = totals(r.entries); return h('tr', { class: 'click', onclick: () => go(`/r/${f.id}/${r.key}`) },
          h('td', null, link(`/r/${f.id}/${r.key}`, monthName(r.key))), h('td', null, String(r.entries.length)), h('td', { class: 'num' }, mln(tt.inn)), h('td', { class: 'num' }, mln(tt.out)),
          h('td', { class: 'num' + (tt.bal < 0 ? ' neg' : '') }, mln(tt.bal)), h('td', { class: 'mono' }, short(r.root)), h('td', null, stateBadge(r.state))); }))))
      : empty('Hali hisobot yoʻq', 'Bu jamgʻarma ulanish bosqichida: birinchi oy oxirida ildiz muhrlanadi va shu yerda paydo boʻladi. Joriy oyda ' + open.length + ' ta yozuv bor.')),
  ];
}

function viewReport(fid, key) {
  const f = byId.get(fid);
  const r = f && f.reports[key];
  if (!r) return notFound();
  const work = r.entries.map((e) => ({ ...e }));
  const t = totals(r.entries);
  const status = h('div', { class: 'verdict', role: 'status', 'aria-live': 'polite' }, 'Tekshirilmagan: “Butunlikni tekshirish” tugmasini bosing.');
  const filter = { dir: 'all', q: '' };
  let tamper = false;
  const tbody = h('tbody');
  const recheck = async () => {
    status.className = 'verdict busy'; status.textContent = 'Hisoblanmoqda…';
    const tree = await M.build(work);
    const got = M.hex(tree.root.hash);
    const changed = work.filter((e, i) => e.amount !== r.entries[i].amount).length;
    const ok = got === r.root;
    status.className = 'verdict ' + (ok ? 'ok' : 'bad');
    status.replaceChildren(h('strong', null, ok ? 'Mos: hisobot eʼlon qilinganidan beri oʻzgarmagan' : 'Mos emas: ' + changed + ' ta yozuv oʻzgargan'),
      h('span', { class: 'mono' }, 'Hisoblangan ildiz ' + short(got, 16)));
  };
  const draw = () => {
    const q = filter.q.toLowerCase();
    tbody.replaceChildren(...work.map((e, i) => ({ e, i })).filter(({ e }) => (filter.dir === 'all' || e.dir === filter.dir) && (!q || e.id.toLowerCase().includes(q) || CATS[e.cat].label.toLowerCase().includes(q))).map(({ e, i }) => {
      const amt = tamper
        ? h('input', { class: 'input sm num mono', value: String(e.amount), inputmode: 'numeric', 'aria-label': 'Summa ' + e.id,
          oninput: (ev) => { const v = parseInt(ev.target.value.replace(/\D/g, '').slice(0, 12) || '0', 10); work[i].amount = v; recheck(); } })
        : h('span', { class: e.dir === 'in' ? 'pos' : '' }, (e.dir === 'in' ? '+' : '−') + som(e.amount));
      return h('tr', { class: work[i].amount !== r.entries[i].amount ? 'changed' : null },
        h('td', { class: 'mono' }, String(e.seq)), h('td', null, dateText(e.date)), h('td', { class: 'mono' }, e.id),
        h('td', null, CATS[e.cat].label, e.fixes ? h('div', { class: 'sub' }, 'tuzatadi: ' + e.fixes) : null), h('td', { class: 'num' }, amt),
        h('td', null, link('/verify/' + e.id, 'Isbot')));
    }));
  };
  const dirChips = h('div', { class: 'chips' });
  const chips = () => dirChips.replaceChildren(...[['all', 'Hammasi'], ['in', 'Tushum'], ['out', 'Chiqim']].map(([k, label]) =>
    h('button', { type: 'button', class: 'chip' + (filter.dir === k ? ' on' : ''), 'aria-pressed': String(filter.dir === k), onclick: () => { filter.dir = k; chips(); draw(); } }, label)));
  chips(); draw();
  const tamperBtn = h('button', { class: 'btn ghost', type: 'button', id: 'tamper', onclick: () => {
    tamper = !tamper; tamperBtn.textContent = tamper ? 'Asl holatga qaytarish' : 'Summani oʻzgartirib koʻring';
    if (!tamper) work.forEach((e, i) => { e.amount = r.entries[i].amount; });
    draw(); recheck();
  } }, 'Summani oʻzgartirib koʻring');
  const exportBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    const blob = new Blob([JSON.stringify({ fund: f.name, month: r.key, root: r.root, rfc: 'RFC 9162 leaf 0x00 / node 0x01', entries: r.entries.map(({ id, date, cat, dir, amount }) => ({ id, date, cat, dir, amount })) }, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `shaffof-${f.id}-${r.key}.json` }); document.body.append(a); a.click(); a.remove();
  } }, 'JSON yuklab olish');
  const [sk, st, sd] = STATE[r.state];
  const steps = [['Oy yopildi', true, dateText(r.sealedOn)], ['Ildiz kalendarga yuborildi', true, r.state === 'retry' ? '1-kalendar javob bermadi, 2-kalendarga qayta' : 'OpenTimestamps'], ['Bitcoin bloki bilan tasdiq', r.state === 'confirmed', r.state === 'confirmed' ? 'blok #' + NF.format(r.block).replace(/,/g, ' ') + ' (namuna)' : 'kutilmoqda']];
  return [
    crumbs(link('/funds', 'Jamgʻarmalar'), link('/funds/' + f.id, f.name), h('span', null, monthName(r.key))),
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Oylik hisobot'), h('h1', null, f.name + ' · ' + monthName(r.key))),
    h('div', { class: 'kpis' }, kpi('Yozuvlar', String(r.entries.length)), kpi('Tushum', som(t.inn)), kpi('Chiqim', som(t.out)), kpi('Qoldiq', som(t.bal))),
    h('div', { class: 'grid-2' },
      card('Eʼlon qilingan ildiz', h('p', { class: 'root mono', id: 'root' }, r.root), h('div', { class: 'row' }, copyBtn(r.root), exportBtn),
        h('p', { class: 'muted' }, 'Ildiz barcha yozuvlarning SHA-256 Merkle daraxtidan hisoblanadi (RFC 9162). Bitta raqam oʻzgarsa, ildiz ham oʻzgaradi.'),
        h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', id: 'check', onclick: recheck }, 'Butunlikni tekshirish'), tamperBtn), status),
      card('Muhr', h('p', null, badge(sk, st), ' ', h('span', { class: 'muted' }, sd)),
        h('ol', { class: 'timeline' }, steps.map(([a, done, b]) => h('li', { class: done ? 'done' : 'todo' }, h('strong', null, a), h('span', null, b)))),
        h('p', { class: 'hint' }, 'Muhr hisobot oʻzgarmaganini isbotlaydi, yozuvlar haqiqatini emas. Haqiqat bank koʻchirmasi bilan solishtiriladi.'))),
    card('Yozuvlar (ismsiz)', h('div', { class: 'toolbar' }, h('input', { class: 'input', type: 'search', placeholder: 'Kvitansiya yoki toifa', 'aria-label': 'Yozuv qidirish', oninput: (e) => { filter.q = e.target.value; draw(); } }), dirChips),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Sana'), h('th', null, 'Kvitansiya'), h('th', null, 'Toifa'), h('th', { class: 'num' }, 'Summa'), h('th', null, ''))), tbody))),
  ];
}

async function proveReceipt(id) {
  const hit = receipts.get(id);
  if (!hit) return { found: false };
  const r = hit.fund.reports[hit.key];
  if (!r) return { found: true, open: true, fund: hit.fund, key: hit.key, entry: hit.fund.ledger[hit.key].find((e) => e.id === id) };
  const idx = r.entries.findIndex((e) => e.id === id);
  const proof = M.path(r.tree.root, idx);
  const res = await M.verify(r.entries[idx], proof, r.root);
  return { found: true, fund: hit.fund, r, entry: r.entries[idx], idx, proof, res };
}
function viewVerify(id) {
  const reps = allReports();
  const samples = [reps[3], reps[40], reps[77], reps[120]].filter(Boolean).map((x) => x.r.entries.find((e) => e.dir === 'in').id);
  const openSample = (world.funds[0].ledger[world.current] || [])[0];
  const input = h('input', { class: 'input mono', id: 'receipt', value: id || '', placeholder: 'K-XXXX-XXXX', 'aria-label': 'Kvitansiya raqami', spellcheck: 'false' });
  const out = h('div', { class: 'proof-out', 'aria-live': 'polite' });
  const audit = h('textarea', { class: 'input mono', rows: '9', id: 'audit-json', spellcheck: 'false', 'aria-label': 'Isbot JSON' });
  const auditOut = h('div', { class: 'verdict', role: 'status' }, 'Isbotni tahrirlab, mustaqil tekshirib koʻring.');
  const run = async () => {
    const v = input.value.trim().toUpperCase();
    if (!v) { out.replaceChildren(empty('Kvitansiya raqamini kiriting', 'Raqam xayriya qilganingizda jamgʻarma bergan kvitansiyada yozilgan. Ism yoki telefon soʻralmaydi.')); return; }
    const p = await proveReceipt(v);
    if (!p.found) { out.replaceChildren(empty('Bunday kvitansiya topilmadi', `“${v}” hech bir eʼlon qilingan hisobotda yoʻq. Raqamni tekshiring yoki jamgʻarmaga murojaat qiling: yozuv hali kiritilmagan boʻlishi mumkin.`)); return; }
    if (p.open) { out.replaceChildren(h('div', { class: 'verdict wait' }, h('strong', null, 'Yozuv bor, lekin oy hali yopilmagan'), h('span', null, `${p.fund.name}, ${monthName(p.key)}. Ildiz oy oxirida muhrlangach isbot shu yerda chiqadi.`))); return; }
    const e = p.entry;
    out.replaceChildren(
      h('div', { class: 'verdict ' + (p.res.ok ? 'ok' : 'bad') }, h('strong', null, p.res.ok ? 'Bor. Bu yozuv eʼlon qilingan ildizga matematik bogʻlangan.' : 'Isbot mos kelmadi'),
        h('span', null, `${p.fund.name} · ${monthName(p.r.key)} · ${p.r.entries.length} yozuvdan ${p.idx + 1}-si`)),
      h('dl', { class: 'facts' }, h('div', null, h('dt', null, 'Kvitansiya'), h('dd', { class: 'mono' }, e.id)), h('div', null, h('dt', null, 'Sana'), h('dd', null, dateText(e.date))),
        h('div', null, h('dt', null, 'Toifa'), h('dd', null, CATS[e.cat].label)), h('div', null, h('dt', null, 'Summa'), h('dd', null, som(e.amount)))),
      h('h3', null, 'Isbot yoʻli: ' + p.proof.length + ' qadam'),
      h('ol', { class: 'path' }, p.res.steps.map((st, i) => h('li', { class: i === 0 ? 'leaf' : '' },
        i === 0 ? [h('strong', null, 'Yozuv hashi'), h('span', { class: 'mono' }, short(st.hash, 20))]
          : [h('strong', null, i + '. ' + (st.side === 'L' ? 'chapdagi' : 'oʻngdagi') + ' qoʻshni bilan'), h('span', { class: 'mono' }, short(st.sibling, 12) + ' → ' + short(st.hash, 14))])),
      h('li', { class: 'rootline' }, h('strong', null, 'Eʼlon qilingan ildiz'), h('span', { class: 'mono' }, short(p.r.root, 20)))),
      h('p', { class: 'foot' }, link(`/r/${p.fund.id}/${p.r.key}`, 'Butun hisobotni ochish →')));
    audit.value = JSON.stringify({ entry: { id: e.id, date: e.date, cat: e.cat, dir: e.dir, amount: e.amount }, proof: p.proof.map((x) => ({ hash: M.hex(x.hash), side: x.side })), root: p.r.root }, null, 1);
    auditOut.className = 'verdict'; auditOut.textContent = 'Isbot tayyor. “Mustaqil tekshirish”ni bosing yoki biror belgini oʻzgartiring.';
  };
  const runAudit = async () => {
    try {
      const j = JSON.parse(audit.value);
      const proof = (j.proof || []).map((x) => ({ hash: /^[0-9a-f]{64}$/i.test(x.hash) ? toBytes(x.hash.toLowerCase()) : null, side: x.side }));
      const res = await M.verify(j.entry, proof, j.root);
      auditOut.className = 'verdict ' + (res.ok ? 'ok' : 'bad');
      auditOut.replaceChildren(h('strong', null, res.ok ? 'Isbot toʻgʻri' : 'Isbot notoʻgʻri: ildiz mos emas'), h('span', { class: 'mono' }, 'Hisoblangan: ' + short(res.root, 16)));
    } catch (err) {
      auditOut.className = 'verdict bad'; auditOut.replaceChildren(h('strong', null, 'Isbot rad etildi'), h('span', null, String(err.message || err)));
    }
  };
  queueMicrotask(run);
  return [
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Xayriyachi uchun'), h('h1', null, 'Kvitansiyani tekshirish'),
      h('p', { class: 'lead' }, 'Yozuvingiz eʼlon qilingan hisobotda borligini isbotlash (inclusion proof, RFC 9162). Hisob brauzeringizda bajariladi.')),
    card(null, h('form', { class: 'row', onsubmit: (e) => { e.preventDefault(); history.replaceState(null, '', '#/verify/' + encodeURIComponent(input.value.trim().toUpperCase())); run(); } }, input, h('button', { class: 'btn', type: 'submit' }, 'Tekshirish')),
      h('p', { class: 'hint' }, 'Namunalar: ', samples.map((x) => h('a', { class: 'chip mono', href: '#/verify/' + x }, x)), openSample ? h('a', { class: 'chip mono', href: '#/verify/' + openSample.id, title: 'joriy oy' }, openSample.id) : null, h('a', { class: 'chip mono', href: '#/verify/K-0000-0000', title: 'mavjud emas' }, 'K-0000-0000')),
      out),
    card('Auditor rejimi: mustaqil tekshirish', h('p', { class: 'muted' }, 'Auditor yoki jurnalist faqat yozuv, qoʻshni hashlar va eʼlon qilingan ildiz bilan tekshiradi. Hashni bir belgiga oʻzgartirsangiz, isbot rad etiladi.'),
      audit, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', id: 'audit', onclick: runAudit }, 'Mustaqil tekshirish')), auditOut),
  ];
}

function viewConsole() {
  if (!session) return viewLogin();
  const f = byId.get(session.fund);
  const open = f.ledger[world.current];
  const sealed = f.reports[world.current];
  const tbody = h('tbody');
  const draw = () => tbody.replaceChildren(...open.slice().reverse().map((e) => h('tr', { class: e.fresh ? 'fresh' : null },
    h('td', { class: 'mono' }, String(e.seq)), h('td', null, dateText(e.date)), h('td', { class: 'mono' }, e.id), h('td', null, CATS[e.cat].label, e.fixes ? h('div', { class: 'sub' }, 'tuzatadi: ' + e.fixes) : null),
    h('td', { class: 'num' }, h('span', { class: e.dir === 'in' ? 'pos' : '' }, (e.dir === 'in' ? '+' : '−') + som(e.amount))),
    h('td', null, sealed || e.cat === 'correction' || open.some((x) => x.fixes === e.id) ? h('span', { class: 'muted' }, '—')
      : h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { addEntry(f, { cat: 'correction', dir: e.dir === 'in' ? 'out' : 'in', amount: e.amount, fixes: e.id }); render(); } }, 'Tuzatish')))));
  draw();
  const amount = h('input', { class: 'input mono', name: 'amount', inputmode: 'numeric', value: '450000', 'aria-label': 'Summa (soʻm)' });
  const cat = h('select', { class: 'input', name: 'cat', 'aria-label': 'Toifa' }, Object.entries(CATS).filter(([k]) => k !== 'correction').map(([k, v]) => h('option', { value: k }, v.label + (v.dir === 'in' ? ' (+)' : ' (−)'))));
  const doc = h('input', { class: 'input mono', name: 'doc', placeholder: 'hujjat hashi (ixtiyoriy)', 'aria-label': 'Hujjat hashi' });
  const t = totals(open);
  return [
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Jamgʻarma kabineti · ' + session.user),
      h('h1', null, f.name + ': ' + monthName(world.current)),
      h('p', { class: 'lead' }, 'Jurnal faqat qoʻshiladi: oʻchirish yoki tahrirlash yoʻq. Xato teskari yozuv bilan tuzatiladi, ikkalasi ham hisobotda koʻrinadi.')),
    h('div', { class: 'kpis' }, kpi('Joriy oy yozuvlari', String(open.length)), kpi('Tushum', mln(t.inn)), kpi('Chiqim', mln(t.out)), kpi('Holat', sealed ? STATE[sealed.state][1] : 'Ochiq')),
    h('div', { class: 'grid-2' },
      card('Yangi yozuv', sealed ? empty('Oy muhrlangan', 'Bu oyga endi yozuv qoʻshilmaydi. Keyingi oy yozuvlari yangi daraxtga tushadi.') :
        h('form', { class: 'form', id: 'entry-form', onsubmit: (e) => {
          e.preventDefault();
          const v = parseInt(amount.value.replace(/\D/g, '').slice(0, 12) || '0', 10);
          if (!v) { amount.setAttribute('aria-invalid', 'true'); amount.focus(); return; }
          addEntry(f, { cat: cat.value, dir: CATS[cat.value].dir, amount: v, doc: doc.value.trim() }); render();
        } }, h('label', null, 'Toifa', cat), h('label', null, 'Summa, soʻm', amount), h('label', null, 'Hujjat hashi', doc),
        h('p', { class: 'hint' }, 'Xayriyachi ismi kiritilmaydi. Tushum uchun kvitansiya raqami avtomatik beriladi.'),
        h('button', { class: 'btn', type: 'submit' }, 'Jurnalga qoʻshish'))),
      card('Oyni yopish va muhrlash', sealed ? h('div', null, h('p', null, stateBadge(sealed.state), ' ', h('span', { class: 'mono' }, short(sealed.root, 16))),
        sealed.state === 'calendar' ? h('button', { class: 'btn ghost', type: 'button', id: 'confirm', onclick: () => { sealed.state = 'confirmed'; log.unshift({ at: new Date(), text: 'Kalendar tasdigʻi olindi (demo: tezlashtirilgan)', kind: 'seal', fund: f.name }); render(); } }, 'Bitcoin tasdigʻini tekshirish') : null,
        h('p', { class: 'foot' }, link(`/r/${f.id}/${world.current}`, 'Eʼlon qilingan hisobotni ochish →')))
        : h('div', null, h('p', { class: 'muted' }, `${open.length} ta yozuv bitta Merkle ildiziga yigʻiladi. Ildiz OpenTimestamps orqali vaqtga bogʻlanadi va ochiq hisobot sahifasida chiqadi.`),
          h('button', { class: 'btn', type: 'button', id: 'seal', onclick: async () => { await sealReport(f, world.current, 'calendar', world.current + '-' + String(NOW.getDate()).padStart(2, '0')); log.unshift({ at: new Date(), text: 'Oy yopildi va ildiz eʼlon qilindi', kind: 'seal', fund: f.name }); render(); } }, 'Oyni yopish va muhrlash'),
          h('p', { class: 'hint' }, 'Demo: muhrlash darhol, tasdiq tugma bilan. Haqiqiy tizimda Bitcoin tasdigʻi bir necha soat oladi.'))),
    ),
    card('Joriy oy jurnali', h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Sana'), h('th', null, 'Raqam'), h('th', null, 'Toifa'), h('th', { class: 'num' }, 'Summa'), h('th', null, ''))), tbody))),
    card('Audit izi', h('ul', { class: 'log' }, log.slice(0, 14).map((l) => h('li', { class: 'k-' + l.kind }, h('span', { class: 'dot', 'aria-hidden': 'true' }), h('strong', null, l.text), h('span', { class: 'sub' }, l.fund + ' · ' + ago(l.at))))),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { session = null; render(); } }, 'Chiqish'))),
  ];
}
function addEntry(f, e) {
  const list = f.ledger[world.current];
  const seq = Math.max(0, ...world.funds.filter((x) => x === f).flatMap((x) => Object.values(x.ledger).flat().map((q) => q.seq))) + 1;
  const id = (e.dir === 'in' && e.cat !== 'correction' ? 'K-' : e.cat === 'correction' ? 'T-' : 'C-') + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const entry = { id, date: monthKey(NOW) + '-' + String(NOW.getDate()).padStart(2, '0'), cat: e.cat, dir: e.dir, amount: e.amount, doc: e.doc || '', fixes: e.fixes, seq, fresh: true };
  list.push(entry); receipts.set(id, { fund: f, key: world.current });
  log.unshift({ at: new Date(), text: e.fixes ? 'Tuzatish: ' + e.fixes + ' teskari yozuv bilan' : 'Yozuv qoʻshildi: ' + CATS[e.cat].label.toLowerCase(), kind: e.fixes ? 'fix' : 'add', fund: f.name });
}
function ago(d) {
  const m = Math.round((NOW.getTime() - d.getTime()) / 60000);
  if (m < 1) return 'hozir'; if (m < 60) return m + ' daqiqa oldin';
  const hh = Math.round(m / 60); return hh < 24 ? hh + ' soat oldin' : Math.round(hh / 24) + ' kun oldin';
}
function viewLogin() {
  const user = h('input', { class: 'input', name: 'user', value: 'demo', autocomplete: 'username', 'aria-label': 'Login' });
  const pass = h('input', { class: 'input', name: 'pass', type: 'password', value: 'demo', autocomplete: 'current-password', 'aria-label': 'Parol' });
  const fund = h('select', { class: 'input', 'aria-label': 'Jamgʻarma' }, world.funds.filter((f) => f.status === 'active').map((f) => h('option', { value: f.id }, f.name)));
  const err = h('p', { class: 'err', role: 'alert' });
  return [h('div', { class: 'login' }, card('Jamgʻarma kabinetiga kirish',
    h('p', { class: 'muted' }, 'Operator va hisobchi uchun. Demo: login ', h('b', { class: 'mono' }, 'demo'), ', parol ', h('b', { class: 'mono' }, 'demo'), '.'),
    h('form', { class: 'form', id: 'login-form', onsubmit: (e) => {
      e.preventDefault();
      if (user.value !== 'demo' || pass.value !== 'demo') { err.textContent = 'Demo uchun login va parol: demo / demo'; return; }
      session = { user: 'demo operator', fund: fund.value }; render();
    } }, h('label', null, 'Login', user), h('label', null, 'Parol', pass), h('label', null, 'Jamgʻarma', fund), err, h('button', { class: 'btn', type: 'submit' }, 'Kirish'))))];
}

const zk = { input: sampleInput(), basis: 'silver', prices: { ...SAMPLE_PRICES } };
function viewZakat() {
  const FIELDS = [['cash', 'Naqd pul', 'soʻm'], ['bank', 'Bank hisoblari va kartalar', 'soʻm'], ['goldGrams', 'Oltin (quyma, tanga)', 'gramm'], ['jewelleryGrams', 'Doimiy taqiladigan oltin zargarlik', 'gramm'],
    ['silverGrams', 'Kumush', 'gramm'], ['trade', 'Savdo moli (sotish uchun tovar)', 'soʻm'], ['receivable', 'Qaytishi kutilayotgan qarzlar', 'soʻm'], ['crypto', 'Kripto-aktivlar qiymati', 'soʻm'], ['debts', 'Yaqin 12 oyda toʻlanadigan qarzlaringiz', 'soʻm']];
  const cols = h('div', { class: 'methods' });
  const draw = () => {
    const res = METHODS.map((m) => ({ m, r: compute(zk.input, m, zk.prices, zk.basis) }));
    const dues = new Set(res.map((x) => x.r.due));
    cols.replaceChildren(...res.map(({ m, r }) => h('article', { class: 'method' + (r.reaches ? '' : ' below') },
      h('h3', null, m.name), h('p', { class: 'due' }, r.reaches ? som(r.due) : 'Nisobga yetmaydi'),
      h('dl', { class: 'mini' }, h('div', null, h('dt', null, 'Aktivlar'), h('dd', null, mln(r.assets))), h('div', null, h('dt', null, 'Ayirilgan qarz'), h('dd', null, mln(r.debts))),
        h('div', null, h('dt', null, 'Sof boylik'), h('dd', null, mln(r.net))), h('div', null, h('dt', null, 'Nisob'), h('dd', null, mln(r.nisab)))),
      h('ul', { class: 'notes' }, m.notes.map((n) => h('li', null, n))))));
    summary.textContent = dues.size > 1 ? `Usullar orasida farq: ${mln(Math.min(...dues))} dan ${mln(Math.max(...dues))} gacha. Qaysi biri sizga toʻgʻri ekanini olimingiz bilan aniqlang.` : 'Bu kiritishda toʻrt usul bir xil natija beradi.';
  };
  const summary = h('p', { class: 'verdict wait', role: 'status' });
  const inputs = FIELDS.map(([k, label, unit]) => h('label', null, h('span', null, label, h('small', null, ' · ' + unit)),
    h('input', { class: 'input mono', inputmode: 'numeric', name: k, value: String(zk.input[k] || ''), placeholder: '0', oninput: (e) => { zk.input[k] = parseInt(e.target.value.replace(/\D/g, '').slice(0, 13) || '0', 10); draw(); } })));
  const form = h('form', { class: 'form zgrid', id: 'zakat-form', onsubmit: (e) => e.preventDefault() }, inputs);
  const basis = h('div', { class: 'chips', role: 'group', 'aria-label': 'Nisob asosi' });
  const drawBasis = () => basis.replaceChildren(...[['silver', `Kumush nisobi (${NISAB.silverGrams} g)`], ['gold', `Oltin nisobi (${NISAB.goldGrams} g)`]].map(([k, t]) =>
    h('button', { type: 'button', class: 'chip' + (zk.basis === k ? ' on' : ''), 'aria-pressed': String(zk.basis === k), onclick: () => { zk.basis = k; drawBasis(); draw(); } }, t)));
  drawBasis(); draw();
  const price = (k, label) => h('label', null, label, h('input', { class: 'input mono', inputmode: 'numeric', value: String(zk.prices[k]), oninput: (e) => { zk.prices[k] = parseInt(e.target.value.replace(/\D/g, '') || '0', 10); draw(); } }));
  return [
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Zakot kalkulyatori · konsept'), h('h1', null, 'Toʻrt usul yonma-yon, har birining manbasi bilan'),
      h('p', { class: 'lead' }, 'Kalkulyator hukm chiqarmaydi. U usullar orasidagi hujjatlashtirilgan farqni koʻrsatadi, tanlov siz va olimingizda. Hech narsa saqlanmaydi.')),
    h('div', { class: 'notice strong' }, h('strong', null, 'Olimlar koʻrigidan oʻtmagan.'), ' Bu faqat konsept. Kalkulyator malakali olimlarning yozma koʻrigidan oʻtmaguncha chiqarilmaydi. Narxlar namuna, haqiqiy kurs emas.'),
    h('div', { class: 'grid-2 z' }, h('div', { class: 'stack' }, card('Mol-mulkingiz', form, h('div', { class: 'row' },
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { zk.input = sampleInput(); render(); } }, 'Namunani toʻldirish'),
      h('button', { class: 'btn ghost sm', type: 'button', id: 'zakat-clear', onclick: () => { zk.input = blank(); render(); } }, 'Tozalash'))),
    card('Nisob va narxlar', basis, h('div', { class: 'form zgrid' }, price('gold', 'Oltin, 1 g (namuna, soʻm)'), price('silver', 'Kumush, 1 g (namuna, soʻm)')),
      h('p', { class: 'hint' }, 'Stavka 2,5% (qamariy yil). Nisob asosini tanlash ham olim bilan aniqlanadigan savol.'))),
    h('div', { class: 'stack' }, summary, cols)),
    card('Manbalar', h('ol', { class: 'sources' }, SOURCES.map((x) => h('li', null, x)))),
  ];
}

function viewAbout() {
  return [
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Demo haqida'), h('h1', null, 'Bu konsept demo'),
      h('p', { class: 'lead' }, 'Shaffof rejalashtirish bosqichida. Bu sahifalar mahsulot qanday ishlashini koʻrsatadi; jamgʻarmalar, summalar va kvitansiyalar toʻqima.')),
    h('div', { class: 'grid-2' },
      card('Qanday ishlaydi', h('ol', { class: 'steps' },
        h('li', null, h('strong', null, 'Yozuv.'), ' Jamgʻarma har tushum va chiqimni ismsiz yozadi: sana, toifa, summa, hujjat hashi.'),
        h('li', null, h('strong', null, 'Daraxt.'), ' Oy oxirida yozuvlar RFC 9162 Merkle daraxtiga yigʻiladi.'),
        h('li', null, h('strong', null, 'Muhr.'), ' Ildiz OpenTimestamps orqali vaqtga bogʻlanadi (Muhr loyihasi yadrosi).'),
        h('li', null, h('strong', null, 'Tekshiruv.'), ' Istalgan odam hisobotni, xayriyachi oʻz kvitansiyasini brauzerda tekshiradi.'))),
      card('Nima emas', h('ul', { class: 'steps' },
        h('li', null, 'Pul yigʻmaydi, saqlamaydi, oʻtkazmaydi: pul jamgʻarmaning bank hisobida.'), h('li', null, 'Token, kripto toʻlov yoʻq.'),
        h('li', null, 'Ochiq hisobotda ism yoʻq, reyting va leaderboard yoʻq.'), h('li', null, 'Fatvo bermaydi.')))),
    card('Demoda nima bor', h('ul', { class: 'steps' },
      h('li', null, '16 ta toʻqima jamgʻarma, 13 oylik jurnal, 150 ta muhrlangan hisobot'), h('li', null, 'Haqiqiy SHA-256 hisob (WebCrypto) va inclusion proof'),
      h('li', null, 'Kabinet: yozuv qoʻshish, teskari yozuv, oyni muhrlash (login demo / demo)'), h('li', null, 'Konsept zakot kalkulyatori: 4 usul yonma-yon'),
      h('li', null, 'Oʻzgarishlar faqat xotirada, qayta yuklanganda tiklanadi')),
      h('p', { class: 'foot' }, h('a', { href: 'https://shaffof.wonmor.io', rel: 'noopener' }, 'Sayt'), ' · ', h('a', { href: 'https://github.com/wonmortech/shaffof', rel: 'noopener' }, 'GitHub'))),
  ];
}
function notFound() { return [empty('Sahifa topilmadi', 'Bu manzil demoda yoʻq.', link('/', 'Bosh sahifaga'))]; }

/* ---------- shell and router ---------- */
const NAV = [['/', 'Umumiy', 'home'], ['/funds', 'Jamgʻarmalar', 'funds'], ['/verify', 'Tekshirish', 'verify'], ['/console', 'Kabinet', 'console'], ['/zakat', 'Zakot', 'zakat'], ['/about', 'Demo haqida', 'about']];
function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b, c] = parts;
  if (!a) return ['home', viewHome()];
  if (a === 'funds' && b) return ['funds', viewFund(b)];
  if (a === 'funds') return ['funds', viewFunds()];
  if (a === 'r') return ['funds', viewReport(b, c)];
  if (a === 'verify') return ['verify', viewVerify(b)];
  if (a === 'console') return ['console', viewConsole()];
  if (a === 'zakat') return ['zakat', viewZakat()];
  if (a === 'about') return ['about', viewAbout()];
  return ['', notFound()];
}
function render() {
  const [active, view] = route();
  document.querySelectorAll('.nav a').forEach((el) => { el.toggleAttribute('aria-current', el.dataset.k === active); if (el.dataset.k === active) el.setAttribute('aria-current', 'page'); });
  const main = document.getElementById('main');
  main.replaceChildren(...[view].flat(Infinity).filter(Boolean));
}
function shell() {
  const root = document.getElementById('app');
  const theme = h('button', { class: 'btn ghost sm', type: 'button', id: 'theme', 'aria-label': 'Mavzuni almashtirish', onclick: () => {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('shaffof-demo-theme', document.documentElement.dataset.theme); } catch (e) { /* storage blocked */ }
  } }, 'Mavzu');
  root.replaceChildren(
    h('header', { class: 'top' }, h('a', { class: 'brand', href: '#/' }, h('img', { src: 'favicon.svg', alt: '', width: '28', height: '28' }), h('span', null, 'Shaffof')),
      h('span', { class: 'concept' }, 'Konsept demo · mahsulot hali chiqarilmagan'), theme),
    h('nav', { class: 'nav', 'aria-label': 'Boʻlimlar' }, NAV.map(([p, t, k]) => h('a', { href: '#' + p, 'data-k': k }, t))),
    h('main', { id: 'main', tabindex: '-1' }),
    h('p', { class: 'demo-pill', role: 'note' }, h('b', null, 'Demo'), ' · namuna maʼlumotlar, qayta yuklanganda tiklanadi'));
}

(async function boot() {
  try { const t = localStorage.getItem('shaffof-demo-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* storage blocked */ }
  shell();
  if (!M || !M.ok) { document.getElementById('main').replaceChildren(empty('WebCrypto yoʻq', 'Bu brauzer SHA-256 hisobini qoʻllamaydi, demo ishlamaydi.')); return; }
  document.getElementById('main').replaceChildren(h('p', { class: 'loading' }, 'Hisobotlar hisoblanmoqda…'));
  await buildWorld();
  addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  render();
  document.documentElement.dataset.ready = '1';
})();
