// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

/* Concept demo seed data. Every fund, entry and receipt here is fictional and generated in the browser from a
   fixed seed; dates are relative to today, so the demo never ages. Nothing is fetched or stored. */

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CATS = {
  donation: { label: 'Xayriya tushumi', dir: 'in' },
  zakat: { label: 'Zakot tushumi', dir: 'in' },
  sadaqa: { label: 'Sadaqa qutisi', dir: 'in' },
  food: { label: 'Oziq-ovqat toʻplami', dir: 'out' },
  medicine: { label: 'Dori-darmon', dir: 'out' },
  school: { label: 'Oʻquv qurollari', dir: 'out' },
  utility: { label: 'Kommunal toʻlov (oilalar)', dir: 'out' },
  surgery: { label: 'Operatsiya xarajati', dir: 'out' },
  clothes: { label: 'Qishki kiyim', dir: 'out' },
  fee: { label: 'Bank komissiyasi', dir: 'out' },
  correction: { label: 'Tuzatish (teskari yozuv)', dir: 'out' },
};

export const TYPES = { fund: 'Jamgʻarma', mosque: 'Masjid', mahalla: 'Mahalla qoʻmitasi', initiative: 'Tashabbus guruhi' };

const FUNDS = [
  ['mehr', 'Mehr koʻprigi', 'fund', 'Chilonzor tumani', 'Kam taʼminlangan oilalarga oziq-ovqat va dori.', ['food', 'medicine', 'utility'], 'active'],
  ['nur-chilonzor', 'Nur mahalla qoʻmitasi', 'mahalla', 'Chilonzor tumani', 'Mahalladagi 40 oila uchun qishki yordam.', ['food', 'clothes', 'utility'], 'active'],
  ['saxovat', 'Saxovat masjidi xayriya qutisi', 'mosque', 'Yunusobod tumani', 'Juma kunlari sadaqa qutisi, oylik hisobot.', ['food', 'medicine'], 'active'],
  ['umid-nuri', 'Umid nuri bolalar jamgʻarmasi', 'fund', 'Mirzo Ulugʻbek tumani', 'Bolalar operatsiyasi va reabilitatsiya.', ['surgery', 'medicine'], 'active'],
  ['ilm-yoli', 'Ilm yoʻli tashabbusi', 'initiative', 'Yakkasaroy tumani', 'Maktab oʻquvchilari uchun kitob va formalar.', ['school', 'clothes'], 'active'],
  ['bogishamol', 'Bogʻishamol mahalla xayriya guruhi', 'mahalla', 'Yunusobod tumani', 'Keksalar uchun dori va kommunal toʻlov.', ['medicine', 'utility'], 'active'],
  ['qalb-ovozi', 'Qalb ovozi jamgʻarmasi', 'fund', 'Shayxontohur tumani', 'Nogironligi bor odamlar uchun yordam.', ['medicine', 'utility', 'food'], 'active'],
  ['hilol', 'Hilol masjidi', 'mosque', 'Olmazor tumani', 'Ramazon iftorlari va oziq-ovqat toʻplamlari.', ['food'], 'active'],
  ['yangi-kun', 'Yangi kun tashabbusi', 'initiative', 'Sergeli tumani', 'Yangi uyga koʻchgan oilalarga kiyim va jihoz.', ['clothes', 'utility'], 'active'],
  ['shifo-qoli', 'Shifo qoʻli jamgʻarmasi', 'fund', 'Uchtepa tumani', 'Onkologik bemorlar uchun dori.', ['medicine', 'surgery'], 'active'],
  ['beshyogoch', 'Beshyogʻoch mahalla qoʻmitasi', 'mahalla', 'Yakkasaroy tumani', 'Oʻquvchilar uchun maktab toʻplami.', ['school', 'food'], 'onboarding'],
  ['tongotar', 'Tong otar masjidi', 'mosque', 'Mirobod tumani', 'Juma sadaqasi va bevalar uchun yordam.', ['food', 'utility'], 'active'],
  ['mehrli-qollar', 'Mehrli qoʻllar tashabbusi', 'initiative', 'Bektemir tumani', 'Qishda issiq kiyim yigʻish.', ['clothes'], 'paused'],
  ['oila-tayanchi', 'Oila tayanchi jamgʻarmasi', 'fund', 'Yashnobod tumani', 'Koʻp bolali oilalarga oylik toʻplam.', ['food', 'school', 'utility'], 'active'],
  ['karvon', 'Karvon talabalar guruhi', 'initiative', 'Olmazor tumani', 'Talabalar uchun kontrakt yordami.', ['school'], 'onboarding'],
  ['zarafshon', 'Zarafshon mahalla qoʻmitasi', 'mahalla', 'Mirzo Ulugʻbek tumani', 'Yolgʻiz keksalarga issiq ovqat.', ['food', 'medicine'], 'active'],
];

const RANGES = {
  donation: [50, 4000], zakat: [300, 9000], sadaqa: [20, 900], food: [400, 3800], medicine: [150, 2600],
  school: [200, 2400], utility: [120, 900], surgery: [4000, 18000], clothes: [300, 2800], fee: [3, 15],
};

const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(r, n) { let s = ''; for (let i = 0; i < n; i++) s += B32[Math.floor(r() * B32.length)]; return s; }
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function amount(r, cat) { const [lo, hi] = RANGES[cat]; return Math.round((lo + r() * (hi - lo))) * 1000; }

export function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
export function monthsBack(n, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  return out;
}
function daysIn(key) { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); }

/* Builds the whole fictional world. Returns funds with their monthly ledgers; roots are added later by app.js. */
export function seed(now = new Date()) {
  const r = rng(20261113);
  const months = monthsBack(13, now); // 12 closed months + the open current month
  const current = months[months.length - 1];
  const today = now.getDate();
  const funds = FUNDS.map(([id, name, type, district, about, focus, status], fi) => {
    const joined = status === 'onboarding' ? 12 : fi % 5 === 3 ? 6 : 0; // later joiners have fewer reports
    const size = 0.6 + r() * 1.4;
    const fundMonths = months.slice(joined);
    const ledger = {};
    let seq = 0;
    for (const key of fundMonths) {
      const isOpen = key === current;
      const lastDay = isOpen ? Math.max(1, today) : daysIn(key);
      const n = Math.round((isOpen ? 8 + today * 0.7 : 18 + r() * 26) * (status === 'paused' && !isOpen ? 0.5 : 1));
      const list = [];
      for (let i = 0; i < n; i++) {
        const income = r() < 0.55;
        const cat = income ? (type === 'mosque' && r() < 0.5 ? 'sadaqa' : r() < 0.22 ? 'zakat' : 'donation') : pick(r, focus);
        const day = 1 + Math.floor(r() * lastDay);
        list.push({
          id: (income ? 'K-' : 'C-') + code(r, 4) + '-' + code(r, 4),
          date: key + '-' + String(day).padStart(2, '0'),
          cat, dir: income ? 'in' : 'out',
          amount: Math.round(amount(r, cat) * size / 1000) * 1000 || 1000,
          doc: income ? '' : 'sha256:' + code(r, 6).toLowerCase() + '…',
        });
      }
      list.push({ id: 'C-FEE-' + key.replace('-', ''), date: key + '-' + String(lastDay).padStart(2, '0'), cat: 'fee', dir: 'out', amount: amount(r, 'fee'), doc: '' });
      if (r() < 0.18 && list.length > 4) {
        const orig = list.find((e) => e.dir === 'out' && e.cat !== 'fee');
        if (orig) list.push({ id: 'T-' + code(r, 4) + '-' + code(r, 4), date: orig.date, cat: 'correction', dir: 'in', amount: orig.amount, doc: 'tuzatadi: ' + orig.id, fixes: orig.id });
      }
      list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
      list.forEach((e) => { e.seq = ++seq; });
      ledger[key] = list;
    }
    return { id, name, type, district, about, focus, status, joined, months: fundMonths, ledger, reports: {}, size };
  });
  return { funds, months, current };
}

/* Seal state of a closed month, chosen so that every state shows up somewhere. */
export function sealState(fundIndex, monthIndex, closedCount) {
  if (monthIndex === closedCount - 1) return fundIndex % 4 === 1 ? 'calendar' : fundIndex % 7 === 2 ? 'retry' : 'confirmed';
  return 'confirmed';
}
