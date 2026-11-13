// Renders site/index.html, site/en/index.html and site/ru/index.html from one template and one
// string table, so the three languages never drift. The output is plain static HTML (no build step
// is needed to serve the site); run `node tools/render-pages.mjs` after editing strings.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const ORIGIN = 'https://shaffof.wonmor.io';
const GH = 'https://github.com/wonmortech/shaffof';
const LINKS = {
  repo: GH,
  docs: `${GH}/blob/main/docs/PLAN.md`,
  research: `${GH}/tree/main/docs/research`,
  issues: `${GH}/issues`,
  wonmor: 'https://wonmor.io',
  muhr: 'https://muhr.wonmor.io',
  sanad: 'https://sanad.wonmor.io',
};

const I = {
  mark: `<svg viewBox="0 0 32 32" aria-hidden="true"><path class="mark-line" d="M16 3 29 16 16 29 3 16Z"/><path class="mark-line" d="M6.8 6.8h18.4v18.4H6.8Z"/><circle class="mark-line mark-ring" cx="16" cy="16" r="6.2"/><circle class="mark-dot" cx="16" cy="16" r="2.4"/></svg>`,
  gh: `<svg viewBox="0 0 16 16" aria-hidden="true"><path class="gh" d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`,
  moon: `<svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>`,
  sun: `<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>`,
  bank: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>`,
  entry: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7Z"/><path d="M14 3v4h4M10 12h5M10 15.5h5M10 8.5h1.5"/></svg>`,
  seal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 21.5 12 12 21.5 2.5 12Z"/><path d="M5.3 5.3h13.4v13.4H5.3Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  verify: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.8 10.6l1.9 1.9 3.6-3.6"/></svg>`,
  fund: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 20 24 9l16 11"/><path d="M11 20v17h26V20"/><path d="M8 40h32M19 37V27h10v10"/><circle cx="24" cy="19.5" r="2.5"/></svg>`,
  arch: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 40V24c0-8 6-13 14-16 8 3 14 8 14 16v16"/><path d="M18 40V29a6 6 0 0 1 12 0v11M6 40h36M24 8V4"/></svg>`,
  receipt: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 6h24v36l-4-3-4 3-4-3-4 3-4-3-4 3Z"/><path d="M18 15h12M18 21h12M18 27h7"/><path d="m27 31 2.5 2.5L34 29"/></svg>`,
  nomoney: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9 9.5h4.5a2 2 0 0 1 0 4H10.5a2 2 0 0 0 0 4H15M12 7.5v1.8M12 17.5v-1.8M5 19 19 5"/></svg>`,
  notoken: `<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M4 21 20 3"/></svg>`,
  privacy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.3-6 9-6c1.6 0 3 .5 4.2 1.1M21 12s-3.3 6-9 6c-1.6 0-3-.5-4.2-1.1"/><path d="M9.5 12a2.5 2.5 0 0 1 4.2-1.8M4 20 20 4"/></svg>`,
  norank: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-6M10 20V9M15 20v-8M20 20V5M3 21 21 3"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5Z"/><path d="M12 6v13.5"/></svg>`,
  code: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/></svg>`,
};

const S = {
  uz: {
    locale: 'uz_UZ', path: '', base: '',
    title: 'Shaffof — tekshirsa boʻladigan xayriya hisoboti',
    desc: 'Xayriya jamgʻarmalari uchun ochiq hisob kitobi: yozuvlar Merkle ildiziga muhrlanadi, xayriyachi oʻz yozuvini oʻzi tekshiradi. Pulni ushlamaydi. Zakot kalkulyatori olimlar tekshiruvidan keyin.',
    ogAlt: 'Shaffof: shisha idishdagi tiniq suv ichida yozuvlar Merkle daraxtiga yigʻilib, ildizi muhrlanadi.',
    skip: 'Asosiy matnga oʻtish', navLabel: 'Boʻlimlar', langs: 'Til', ghLabel: 'Shaffof GitHubʼda', home: 'Shaffof bosh sahifa',
    nav: ['Muammo', 'Qanday ishlaydi', 'Demo', 'Zakot', 'Tamoyillar', 'Reja'],
    heroChip: 'Rejalashtirilmoqda · hali hech narsa chiqarilmagan',
    h1: ['Har bir yozuv koʻrinadi.', 'Hech biri <em>jimgina</em> oʻzgarmaydi.'],
    lead: 'Shaffof — xayriya jamgʻarmalari uchun ochiq hisob kitobi. Yozuvlar Merkle ildiziga muhrlanadi, xayriyachi esa oʻz xayriyasi hisobotda borligini oʻzi tekshiradi.',
    cta1: 'Demoni sinab koʻring', cta2: 'GitHubʼda kuzatish',
    heroFoot: ['Pulni ushlamaydi', 'Token yoʻq', 'Fatvo bermaydi'],
    stageAria: 'Shisha idishdagi tiniq suv: sakkizta yozuv juft-juft birlashib Merkle daraxtiga aylanadi, ildiz suv yuzasidan koʻtarilib muhrlanadi, keyin bitta yozuvning ildizgacha yoʻli yonadi.',
    stageCap: '8 ta namuna yozuv → 1 muhrlangan ildiz', rootLabel: 'Merkle ildizi',
    p: { tag: '01 · Muammo', h: 'PDF hisobotni kim tekshiradi?',
      lead: 'Bugun jamgʻarma hisobot eʼlon qiladi va unga ishonish kerak. Keyin bitta raqam jimgina oʻzgartirilsa, buni hech kim bilmaydi.',
      plain: 'Oddiy hisobot', sh: 'Shaffof hisoboti', sample: 'Namuna',
      rows: { 'K-0002': 'Xayriya tushumi', 'C-0001': 'Oziq-ovqat toʻplami', 'C-0002': 'Dori-darmon' },
      plainState: 'Oddiy PDF yoki jadval', pub: 'eʼlon qilingan', now: 'hozirgi', shState: 'Eʼlon qilingan ildizga mos',
      note: 'Bu chizma namuna. Oʻzbekistonda xayriya hisobotiga ishonch muammosi qanchalik keng ekanini hali oʻrganmadik: birinchi qadam jamgʻarmalar bilan suhbat.' },
    how: { tag: '02 · Qanday ishlaydi', h: 'Toʻrt qadam, bitta ildiz.',
      lead: 'Pul odatdagidek bank orqali yuradi. Shaffof faqat hisobni yuritadi va uni jimgina oʻzgartirib boʻlmaydigan qiladi.',
      steps: [
        ['bank', 'Pul bankda qoladi', 'Tushum va chiqim jamgʻarmaning bank hisobi orqali yuradi. Shaffof pulga tegmaydi.'],
        ['entry', 'Yozuv anonim', 'Sana, summa, toifa va hujjat hashi. Xayriyachining ismi yozilmaydi.'],
        ['seal', 'Oy oxirida muhr', 'Yozuvlar Merkle daraxtiga yigʻiladi, ildiz OpenTimestamps orqali vaqtga bogʻlanadi.'],
        ['verify', 'Xayriyachi tekshiradi', 'Kvitansiya raqami bilan: yozuvim shu ildizdami? Javob ishonch emas, isbot.'],
      ] },
    demo: { tag: '03 · Demo', h: 'Oʻzingiz sinab koʻring.', chip: 'Demo · toʻqima maʼlumot',
      lead: 'Bu toʻqima jamgʻarmaning namuna hisobi. Hash brauzeringizda WebCrypto bilan hisoblanadi, hech narsa yuborilmaydi. Bitta summani oʻzgartiring va ildizga qarang.',
      ledgerH: 'Namuna hisob', ledgerS: 'Summani tahrirlang', th: ['Raqam', 'Toifa · sana', 'Summa, soʻm'],
      dirIn: 'kirim', dirOut: 'chiqim', amountLabel: 'summa, soʻm', reset: 'Asliga qaytarish',
      treeH: 'Merkle daraxti', treeS: 'RFC 9162 uslubida, SHA-256', rootPub: 'Eʼlon qilingan ildiz', rootNow: 'Hozirgi ildiz',
      proofH: 'Mening xayriyam hisobotda bormi?', receipt: 'Kvitansiya raqami', check: 'Isbotni tekshirish',
      note: 'Soddalashtirilgan namuna: haqiqiy hisobda ikki tomonlama yozuv, hujjat hashlari va oylik muhr boʻladi. Barcha nom va summalar toʻqima.',
      nojs: 'Demo uchun JavaScript kerak.' },
    cat: { donation: 'Xayriya tushumi', food: 'Oziq-ovqat toʻplami', medicine: 'Dori-darmon', school: 'Oʻquv qurollari', fee: 'Bank komissiyasi' },
    zk: { tag: '04 · Zakot', h: 'Zakot: usullar yonma-yon, har birining manbasi bilan.', chip: 'Tez kunda — olimlar tekshiruvidan keyin',
      lead: 'Kalkulyator hukm chiqarmaydi: u mazhablar usulini manbasi bilan koʻrsatadi. Malakali olimlar yozma koʻrib chiqmaguncha uni chiqarmaymiz.',
      inputs: ['Naqd pul va hisoblar', 'Oltin va kumush', 'Savdo moli', 'Qarzlar'],
      methods: ['Hanafiy', 'Shofiʼiy', 'Molikiy', 'Hanbaliy'], src: 'Manba: koʻrib chiqilmoqda',
      nisab: 'Nisob: oltin yoki kumush narxi sanasi va manbasi bilan koʻrsatiladi.',
      lock: 'Hisob faqat brauzeringizda boʻladi, maʼlumot saqlanmaydi. Bu maket: raqamlar ataylab koʻrsatilmagan.', mock: 'Kalkulyator maketi' },
    who: { tag: '05 · Kim uchun', h: 'Ishonchni isbot bilan koʻrsatmoqchi boʻlganlar uchun.',
      tiles: [
        ['fund', 'Xayriya jamgʻarmalari', 'Hisobotni eʼlon qiling va ildizini muhrlang. Ishonch soʻramang, isbot bering.'],
        ['arch', 'Masjid va mahalla xayriya qoʻmitalari', 'Kichik hisob, oddiy sahifa: kirim, chiqim va oylik muhr.'],
        ['receipt', 'Xayriyachilar', 'Kvitansiya raqami bilan oʻz yozuvingizni toping. Ismingiz hech qayerda chiqmaydi.'],
      ] },
    pr: { tag: '06 · Tamoyillar', h: 'Nima qilmasligimizni avval aytamiz.',
      items: [
        ['nomoney', 'Pulga tegmaymiz', 'Shaffof pul yigʻmaydi, saqlamaydi va oʻtkazmaydi. Toʻlovlar jamgʻarmaning bank hisobi orqali yuradi.'],
        ['notoken', 'Token va kripto toʻlov yoʻq', 'Muhr faqat hashni vaqtga bogʻlaydi. Hech kim kripto-aktiv sotib olmaydi.'],
        ['privacy', 'Xayriyachi maxfiyligi', 'Ochiq hisobotda ism yoʻq: faqat sana, summa, toifa va hash.'],
        ['norank', 'Reyting yoʻq', 'Xayriyachilar roʻyxati, “eng saxiy” jadvali va ball boʻlmaydi. Riyo xavfini olimlar bilan muhokama qilamiz.'],
        ['book', 'Fatvo bermaymiz', 'Usullar manbasi bilan beriladi. Chiqarishdan oldin malakali olimlar yozma koʻrib chiqadi.'],
        ['code', 'Ochiq kod', 'Apache-2.0. Kodni oʻqing, keyin ishoning, bizga ham.'],
      ] },
    road: { tag: '07 · Reja', h: 'Qayerdamiz va qayerga boramiz.',
      lead: 'Shaffof kalit, Merkle jurnal va muhrlash yadrosini Muhr va Sanad bilan baham koʻradi. Navbatda u uchinchi: avval Muhr, keyin Sanad.',
      now: 'Hozir', soon: 'Tez kunda', after: 'Olimlardan keyin',
      items: [
        ['now', 'Tadqiqot va reja', 'Raqobatchilar, manbalar, huquqiy cheklovlar va olimlar uchun savollar.'],
        ['soon', 'Usullar hujjati olimlarga', 'Har usul manbasi bilan, yozma koʻrik uchun.'],
        ['soon', 'Jamgʻarmalar bilan suhbat', 'Muammo haqiqatan bormi, avval shuni bilamiz.'],
        ['soon', 'Hisob sxemasi va invariantlar', 'Faqat qoʻshiladigan, ikki tomonlama yozuv; tuzatish teskari yozuv bilan.'],
        ['soon', 'Oylik Merkle ildiz va muhr', 'Muhr yadrosi orqali OpenTimestamps.'],
        ['soon', 'Ochiq hisobot va kvitansiya isboti', 'Xayriyachi uchun inclusion proof sahifasi.'],
        ['soon', 'Telegram bot', '/zakot va kvitansiyani tekshirish.'],
        ['after', 'Zakot kalkulyatori', 'Faqat olimlar koʻrigi ijobiy boʻlsa.'],
      ] },
    st: { tag: '08 · Holat', h: 'Halol holat: hali hech narsa chiqarilmagan.',
      p: 'Bu sahifa reja va ishlaydigan demo. Kod, savollar va tanqidni GitHubʼda kutamiz. Zakot boʻyicha har qanday hukm malakali olimlar tomonidan tasdiqlanishi shart.',
      links: ['GitHub repozitoriy', 'Reja va tadqiqot', 'Savol yoki taklif yozish'] },
    ft: { by: 'Shaffof — <a href="https://wonmor.io">Wonmor</a> loyihasi. Litsenziya: Apache-2.0.',
      fam: 'Wonmor loyihalari', muhr: 'Muhr — hujjat muhri', sanad: 'Sanad — tekshiriladigan sertifikat', wonmor: 'Wonmor studiyasi',
      links: 'Havolalar', gh: 'GitHub', docs: 'Reja', issues: 'Savollar',
      disc: 'Zakot boʻyicha hukmlar malakali olimlar tomonidan tasdiqlanishi shart. Bu sayt yuridik yoki diniy maslahat emas.' },
  },
  en: {
    locale: 'en_US', path: 'en/', base: '../',
    title: 'Shaffof — verifiable charity reports',
    desc: 'An open ledger for charity funds: entries are sealed into a Merkle root and any donor can check their own gift is included. Never holds money. A sourced zakat calculator follows after scholar review.',
    ogAlt: 'Shaffof: ledger entries inside clear water in a glass vessel fold up into a Merkle tree whose root is sealed.',
    skip: 'Skip to content', navLabel: 'Sections', langs: 'Language', ghLabel: 'Shaffof on GitHub', home: 'Shaffof home',
    nav: ['Problem', 'How it works', 'Demo', 'Zakat', 'Principles', 'Roadmap'],
    heroChip: 'Planning · nothing released yet',
    h1: ['Every entry visible.', 'None <em>quietly</em> changed.'],
    lead: 'Shaffof is an open ledger for charity funds. Entries are sealed into a Merkle root, and any donor can check for themselves that their gift is in the report.',
    cta1: 'Try the demo', cta2: 'Follow on GitHub',
    heroFoot: ['Never holds money', 'No token', 'No fatwas'],
    stageAria: 'Clear water in a glass vessel: eight entries join in pairs into a Merkle tree, the root rises above the surface and is sealed, then one entry’s path to the root lights up.',
    stageCap: '8 sample entries → 1 sealed root', rootLabel: 'Merkle root',
    p: { tag: '01 · Problem', h: 'Who checks the PDF report?',
      lead: 'Today a fund publishes a report and you have to trust it. If one number is quietly changed later, nobody can tell.',
      plain: 'Plain report', sh: 'Shaffof report', sample: 'Sample',
      rows: { 'K-0002': 'Donation received', 'C-0001': 'Food parcels', 'C-0002': 'Medicine' },
      plainState: 'A plain PDF or spreadsheet', pub: 'published', now: 'current', shState: 'Matches the published root',
      note: 'This is an illustration. We have not yet measured how widespread distrust of charity reports is in Uzbekistan: the first step is talking to funds.' },
    how: { tag: '02 · How it works', h: 'Four steps, one root.',
      lead: 'Money moves through the bank as usual. Shaffof only keeps the ledger and makes it impossible to change quietly.',
      steps: [
        ['bank', 'Money stays in the bank', 'Income and spending go through the fund’s own bank account. Shaffof never touches money.'],
        ['entry', 'Entries are anonymous', 'Date, amount, category and a document hash. No donor names.'],
        ['seal', 'Sealed every month', 'Entries fold into a Merkle tree; the root is timestamped with OpenTimestamps.'],
        ['verify', 'Donors verify', 'With a receipt number: is my entry under this root? The answer is a proof, not trust.'],
      ] },
    demo: { tag: '03 · Demo', h: 'Try it yourself.', chip: 'Demo · fictional data',
      lead: 'A sample ledger of a fictional fund. Hashes are computed in your browser with WebCrypto; nothing is sent. Change one amount and watch the root.',
      ledgerH: 'Sample ledger', ledgerS: 'Edit an amount', th: ['No.', 'Category · date', 'Amount, so‘m'],
      dirIn: 'income', dirOut: 'spending', amountLabel: 'amount, so‘m', reset: 'Reset',
      treeH: 'Merkle tree', treeS: 'RFC 9162 style, SHA-256', rootPub: 'Published root', rootNow: 'Current root',
      proofH: 'Is my donation in the report?', receipt: 'Receipt number', check: 'Check the proof',
      note: 'Simplified: a real ledger has double entries, document hashes and a monthly seal. All names and amounts are fictional.',
      nojs: 'The demo needs JavaScript.' },
    cat: { donation: 'Donation received', food: 'Food parcels', medicine: 'Medicine', school: 'School supplies', fee: 'Bank fee' },
    zk: { tag: '04 · Zakat', h: 'Zakat: methods side by side, each with its source.', chip: 'Soon, after scholar review',
      lead: 'The calculator gives no rulings: it shows each madhhab’s method with its source. We will not release it until qualified scholars have reviewed it in writing.',
      inputs: ['Cash and accounts', 'Gold and silver', 'Trade goods', 'Debts'],
      methods: ['Hanafi', 'Shafi‘i', 'Maliki', 'Hanbali'], src: 'Source: under review',
      nisab: 'Nisab: the gold or silver price will be shown with its date and source.',
      lock: 'The calculation stays in your browser and nothing is stored. This is a mock-up: figures are deliberately not shown.', mock: 'Calculator mock-up' },
    who: { tag: '05 · Who it is for', h: 'For those who want to show trust with proof.',
      tiles: [
        ['fund', 'Charity funds', 'Publish the report and seal its root. Don’t ask for trust, give proof.'],
        ['arch', 'Mosque and mahalla charity committees', 'A small ledger and a simple page: income, spending and a monthly seal.'],
        ['receipt', 'Donors', 'Find your own entry by receipt number. Your name never appears anywhere.'],
      ] },
    pr: { tag: '06 · Principles', h: 'What we will not do, said first.',
      items: [
        ['nomoney', 'We never touch money', 'Shaffof does not collect, hold or move funds. Payments go through the fund’s bank account.'],
        ['notoken', 'No token, no crypto payments', 'The seal only ties a hash to a time. Nobody buys any crypto-asset.'],
        ['privacy', 'Donor privacy', 'No names in the public report: only date, amount, category and hash.'],
        ['norank', 'No rankings', 'No donor lists, no “most generous” tables, no points. We are discussing the risk of riya (showing off) with scholars.'],
        ['book', 'No fatwas', 'Methods come with their sources. Qualified scholars review them in writing before release.'],
        ['code', 'Open source', 'Apache-2.0. Read the code before trusting anyone, including us.'],
      ] },
    road: { tag: '07 · Roadmap', h: 'Where we are and where we are going.',
      lead: 'Shaffof shares its key, Merkle log and sealing core with Muhr and Sanad. It comes third: Muhr first, then Sanad.',
      now: 'Now', soon: 'Soon', after: 'After scholar review',
      items: [
        ['now', 'Research and plan', 'Competitors, sources, legal limits and questions for scholars.'],
        ['soon', 'Methods paper for scholars', 'Each method with its source, for written review.'],
        ['soon', 'Interviews with funds', 'First we learn whether the problem is real.'],
        ['soon', 'Ledger schema and invariants', 'Append-only double entry; corrections only by reversing entries.'],
        ['soon', 'Monthly Merkle root and seal', 'OpenTimestamps through the Muhr core.'],
        ['soon', 'Public report and receipt proof', 'An inclusion-proof page for donors.'],
        ['soon', 'Telegram bot', '/zakat and receipt checks.'],
        ['after', 'Zakat calculator', 'Only if the scholars’ review is positive.'],
      ] },
    st: { tag: '08 · Status', h: 'Honest status: nothing is released yet.',
      p: 'This page is a plan and a working demo. We welcome code, questions and criticism on GitHub. Any zakat ruling must be confirmed by qualified scholars.',
      links: ['GitHub repository', 'Plan and research', 'Ask a question'] },
    ft: { by: 'Shaffof is a <a href="https://wonmor.io">Wonmor</a> project. Licence: Apache-2.0.',
      fam: 'Wonmor projects', muhr: 'Muhr — document seal', sanad: 'Sanad — verifiable certificates', wonmor: 'Wonmor studio',
      links: 'Links', gh: 'GitHub', docs: 'Plan', issues: 'Questions',
      disc: 'Zakat rulings must be confirmed by qualified scholars. This site is not legal or religious advice.' },
  },
  ru: {
    locale: 'ru_RU', path: 'ru/', base: '../',
    title: 'Shaffof — проверяемые отчёты благотворительных фондов',
    desc: 'Открытая книга учёта для благотворительных фондов: записи запечатываются в корень дерева Меркла, и каждый жертвователь сам проверяет свою запись. Не держит деньги. Калькулятор закята — после проверки учёными.',
    ogAlt: 'Shaffof: записи в прозрачной воде стеклянного сосуда складываются в дерево Меркла, его корень запечатан.',
    skip: 'Перейти к содержимому', navLabel: 'Разделы', langs: 'Язык', ghLabel: 'Shaffof на GitHub', home: 'Shaffof, главная',
    nav: ['Проблема', 'Как работает', 'Демо', 'Закят', 'Принципы', 'План'],
    heroChip: 'Планирование · пока ничего не выпущено',
    h1: ['Каждая запись видна.', 'Ни одна не изменится <em>тихо</em>.'],
    lead: 'Shaffof — открытая книга учёта для благотворительных фондов. Записи запечатываются в корень дерева Меркла, и каждый жертвователь сам проверяет, что его пожертвование есть в отчёте.',
    cta1: 'Попробовать демо', cta2: 'Следить на GitHub',
    heroFoot: ['Не держит деньги', 'Без токенов', 'Не выносит фетв'],
    stageAria: 'Прозрачная вода в стеклянном сосуде: восемь записей попарно складываются в дерево Меркла, корень поднимается над водой и запечатывается, затем подсвечивается путь одной записи к корню.',
    stageCap: '8 примерных записей → 1 запечатанный корень', rootLabel: 'Корень Меркла',
    p: { tag: '01 · Проблема', h: 'Кто проверяет отчёт в PDF?',
      lead: 'Сегодня фонд публикует отчёт, и ему остаётся только верить. Если позже тихо поменять одно число, никто не узнает.',
      plain: 'Обычный отчёт', sh: 'Отчёт Shaffof', sample: 'Пример',
      rows: { 'K-0002': 'Пожертвование', 'C-0001': 'Продуктовые наборы', 'C-0002': 'Лекарства' },
      plainState: 'Обычный PDF или таблица', pub: 'опубликован', now: 'сейчас', shState: 'Совпадает с опубликованным корнем',
      note: 'Это иллюстрация. Насколько широко в Узбекистане недоверие к отчётам фондов, мы ещё не изучили: первый шаг — разговоры с фондами.' },
    how: { tag: '02 · Как работает', h: 'Четыре шага, один корень.',
      lead: 'Деньги, как обычно, идут через банк. Shaffof только ведёт учёт и делает так, что его нельзя тихо изменить.',
      steps: [
        ['bank', 'Деньги остаются в банке', 'Поступления и расходы идут через счёт фонда в банке. Shaffof к деньгам не прикасается.'],
        ['entry', 'Записи анонимны', 'Дата, сумма, категория и хеш документа. Имён жертвователей нет.'],
        ['seal', 'Печать каждый месяц', 'Записи складываются в дерево Меркла, корень фиксируется во времени через OpenTimestamps.'],
        ['verify', 'Жертвователь проверяет', 'По номеру квитанции: есть ли моя запись под этим корнем? Ответ — доказательство, а не доверие.'],
      ] },
    demo: { tag: '03 · Демо', h: 'Проверьте сами.', chip: 'Демо · вымышленные данные',
      lead: 'Учёт вымышленного фонда. Хеши считаются в вашем браузере через WebCrypto, ничего не отправляется. Измените одну сумму и посмотрите на корень.',
      ledgerH: 'Пример учёта', ledgerS: 'Измените сумму', th: ['№', 'Категория · дата', 'Сум'],
      dirIn: 'приход', dirOut: 'расход', amountLabel: 'сумма, сум', reset: 'Вернуть как было',
      treeH: 'Дерево Меркла', treeS: 'в стиле RFC 9162, SHA-256', rootPub: 'Опубликованный корень', rootNow: 'Текущий корень',
      proofH: 'Есть ли моё пожертвование в отчёте?', receipt: 'Номер квитанции', check: 'Проверить доказательство',
      note: 'Упрощённый пример: в настоящем учёте двойная запись, хеши документов и ежемесячная печать. Все названия и суммы вымышлены.',
      nojs: 'Для демо нужен JavaScript.' },
    cat: { donation: 'Пожертвование', food: 'Продуктовые наборы', medicine: 'Лекарства', school: 'Школьные принадлежности', fee: 'Комиссия банка' },
    zk: { tag: '04 · Закят', h: 'Закят: методы рядом, у каждого — источник.', chip: 'Скоро, после проверки учёными',
      lead: 'Калькулятор не выносит решений: он показывает метод каждого мазхаба с источником. Мы не выпустим его, пока квалифицированные учёные не проверят его письменно.',
      inputs: ['Наличные и счета', 'Золото и серебро', 'Товары для торговли', 'Долги'],
      methods: ['Ханафитский', 'Шафиитский', 'Маликитский', 'Ханбалитский'], src: 'Источник: на проверке',
      nisab: 'Нисаб: цена золота или серебра будет показана с датой и источником.',
      lock: 'Расчёт остаётся в вашем браузере, ничего не сохраняется. Это макет: цифры намеренно не показаны.', mock: 'Макет калькулятора' },
    who: { tag: '05 · Для кого', h: 'Для тех, кто хочет подтверждать доверие доказательством.',
      tiles: [
        ['fund', 'Благотворительные фонды', 'Опубликуйте отчёт и запечатайте его корень. Не просите доверия — дайте доказательство.'],
        ['arch', 'Благотворительные комитеты мечетей и махалли', 'Небольшой учёт и простая страница: приход, расход и ежемесячная печать.'],
        ['receipt', 'Жертвователи', 'Найдите свою запись по номеру квитанции. Ваше имя нигде не появляется.'],
      ] },
    pr: { tag: '06 · Принципы', h: 'Сначала о том, чего мы делать не будем.',
      items: [
        ['nomoney', 'Не касаемся денег', 'Shaffof не собирает, не хранит и не переводит средства. Платежи идут через банковский счёт фонда.'],
        ['notoken', 'Без токенов и криптоплатежей', 'Печать только связывает хеш со временем. Никто не покупает криптоактивы.'],
        ['privacy', 'Приватность жертвователей', 'В открытом отчёте нет имён: только дата, сумма, категория и хеш.'],
        ['norank', 'Без рейтингов', 'Ни списков жертвователей, ни таблиц «самых щедрых», ни баллов. Риск рии (показного дарения) обсуждаем с учёными.'],
        ['book', 'Не выносим фетв', 'Методы даются с источниками. До выпуска их письменно проверяют квалифицированные учёные.'],
        ['code', 'Открытый код', 'Apache-2.0. Прочитайте код, прежде чем доверять кому-либо, в том числе нам.'],
      ] },
    road: { tag: '07 · План', h: 'Где мы и куда идём.',
      lead: 'Shaffof использует общее с Muhr и Sanad ядро: ключи, журнал Меркла и печать. Он идёт третьим: сначала Muhr, потом Sanad.',
      now: 'Сейчас', soon: 'Скоро', after: 'После учёных',
      items: [
        ['now', 'Исследование и план', 'Конкуренты, источники, правовые ограничения и вопросы для учёных.'],
        ['soon', 'Документ о методах для учёных', 'Каждый метод с источником, для письменной проверки.'],
        ['soon', 'Интервью с фондами', 'Сначала выясняем, реальна ли проблема.'],
        ['soon', 'Схема учёта и инварианты', 'Только добавление, двойная запись; исправления — сторнирующей записью.'],
        ['soon', 'Ежемесячный корень и печать', 'OpenTimestamps через ядро Muhr.'],
        ['soon', 'Открытый отчёт и доказательство по квитанции', 'Страница inclusion proof для жертвователей.'],
        ['soon', 'Telegram-бот', '/zakat и проверка квитанций.'],
        ['after', 'Калькулятор закята', 'Только если проверка учёных будет положительной.'],
      ] },
    st: { tag: '08 · Статус', h: 'Честно: пока ничего не выпущено.',
      p: 'Эта страница — план и работающее демо. Ждём код, вопросы и критику на GitHub. Любое решение о закяте должны подтвердить квалифицированные учёные.',
      links: ['Репозиторий на GitHub', 'План и исследование', 'Задать вопрос'] },
    ft: { by: 'Shaffof — проект <a href="https://wonmor.io">Wonmor</a>. Лицензия: Apache-2.0.',
      fam: 'Проекты Wonmor', muhr: 'Muhr — печать документов', sanad: 'Sanad — проверяемые сертификаты', wonmor: 'Студия Wonmor',
      links: 'Ссылки', gh: 'GitHub', docs: 'План', issues: 'Вопросы',
      disc: 'Решения о закяте должны подтверждать квалифицированные учёные. Этот сайт — не юридическая и не религиозная консультация.' },
  },
};

const LEDGER = [
  ['K-0001', '2026-10-02', 'donation', 'in', 250000], ['K-0002', '2026-10-05', 'donation', 'in', 1200000],
  ['C-0001', '2026-10-08', 'food', 'out', 640000], ['K-0003', '2026-10-12', 'donation', 'in', 75000],
  ['C-0002', '2026-10-15', 'medicine', 'out', 410000], ['K-0004', '2026-10-19', 'donation', 'in', 500000],
  ['C-0003', '2026-10-24', 'school', 'out', 330000], ['C-0004', '2026-10-31', 'fee', 'out', 4500],
];
const IDS = ['problem', 'how', 'demo', 'zakat', 'principles', 'roadmap'];
const fmt = (lang, n) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'uz-UZ').format(n);

function page(lang) {
  const t = S[lang], b = t.base;
  const url = ORIGIN + '/' + t.path;
  const alt = (l) => `${ORIGIN}/${S[l].path}`;
  const langLink = (l, label) => `<a href="${b}${S[l].path || './'}"${l === lang ? ' aria-current="page"' : ''} hreflang="${l}" lang="${l}">${label}</a>`;
  const sec = (id, inner) => `<section class="sec" id="${id}" aria-labelledby="${id}-h">\n<div class="wrap">${inner}</div>\n</section>`;
  const head = (o) => `<div class="sec-head rv"><span class="tag">${o.tag}</span><h2 id="${o.id}-h">${o.h}</h2>${o.extra || ''}${o.lead ? `<p class="lead">${o.lead}</p>` : ''}</div>`;
  const chipKind = { now: 'chip-accent', soon: '', after: '' };
  const roadHalf = (items) => `<ol class="road">${items.map(([k, h, p]) => `<li class="${k === 'now' ? 'now' : ''}"><div class="rd"><h3>${h}</h3><span class="chip ${chipKind[k]}">${t.road[k]}</span></div><p>${p}</p></li>`).join('')}</ol>`;

  return `<!doctype html>
<html lang="${lang}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t.title}</title>
<meta name="description" content="${t.desc}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="uz" href="${alt('uz')}">
<link rel="alternate" hreflang="en" href="${alt('en')}">
<link rel="alternate" hreflang="ru" href="${alt('ru')}">
<link rel="alternate" hreflang="x-default" href="${alt('uz')}">
<meta name="theme-color" content="#f5f1e8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#090e0c" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Shaffof">
<meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${t.title}">
<meta property="og:description" content="${t.desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/og-${lang}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${t.ogAlt}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${b}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${b}fonts/${lang === 'ru' ? 'serif-cyrillic' : 'serif-latin'}.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${b}assets/css/site.css">
<script src="${b}assets/js/theme.js"></script>
<script src="${b}assets/js/merkle.js" defer></script>
<script src="${b}assets/js/stage.js" defer></script>
<script src="${b}assets/js/main.js" defer></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="top">
<div class="wrap">
<a class="brand mark-anim" href="${b}${t.path || './'}" aria-label="${t.home}">${I.mark}<span>Shaffof</span></a>
<nav class="nav" aria-label="${t.navLabel}">${IDS.map((id, i) => `<a href="#${id}">${t.nav[i]}</a>`).join('')}</nav>
<div class="top-tools">
<nav class="langs" aria-label="${t.langs}">${langLink('uz', 'UZ')}${langLink('en', 'EN')}${langLink('ru', 'RU')}</nav>
<button class="icon-btn" id="theme" type="button" aria-label="Theme">${I.moon}${I.sun}</button>
<a class="icon-btn" href="${LINKS.repo}" aria-label="${t.ghLabel}">${I.gh}</a>
</div>
</div>
</header>
<main id="main">
<section class="hero" aria-labelledby="hero-h">
<div class="wrap">
<div class="hero-copy">
<div><span class="chip">${t.heroChip}</span></div>
<h1 id="hero-h">${t.h1.map((l) => `<span class="line">${l}</span>`).join('')}</h1>
<p class="lead">${t.lead}</p>
<div class="hero-cta"><a class="btn btn-primary" href="#demo">${t.cta1}${I.arrow}</a><a class="btn btn-ghost" href="${LINKS.repo}">${I.gh.replace('<svg', '<svg width="18" height="18"')}${t.cta2}</a></div>
</div>
<div class="stage"><canvas id="stage" role="img" aria-label="${t.stageAria}" data-root="${t.rootLabel}"></canvas><span class="stage-cap" aria-hidden="true">${t.stageCap}</span></div>
<p class="hero-foot">${t.heroFoot.map((x) => `<span>${I.check}${x}</span>`).join('')}</p>
</div>
</section>

${sec('problem', `${head({ ...t.p, id: 'problem' })}
<div class="compare rv" id="compare">
<article class="card report" aria-label="${t.p.plain}">
<div class="report-top"><h3>${t.p.plain}</h3><span class="chip">${t.p.sample}</span></div>
<div class="report-rows">${['K-0002', 'C-0001', 'C-0002'].map((id) => `<div class="report-row" data-id="${id}"><span>${t.p.rows[id]}</span><span class="amt">${fmt(lang, LEDGER.find((r) => r[0] === id)[4])}</span></div>`).join('')}</div>
<p class="report-foot" id="plain-state" aria-live="polite">${t.p.plainState}</p>
</article>
<article class="card report" aria-label="${t.p.sh}">
<div class="report-top"><h3>${t.p.sh}</h3><span class="chip">${t.p.sample}</span></div>
<div class="report-rows">${['K-0002', 'C-0001', 'C-0002'].map((id) => `<div class="report-row" data-id="${id}"><span>${t.p.rows[id]}</span><span class="amt">${fmt(lang, LEDGER.find((r) => r[0] === id)[4])}</span></div>`).join('')}</div>
<div class="roots"><p class="root-line"><b>${t.p.pub}</b> <span id="sh-pub">…</span></p><p class="root-line"><b>${t.p.now}</b> <span id="sh-root">…</span></p></div>
<p class="report-foot" aria-live="polite"><span class="chip chip-good" id="sh-state">${t.p.shState}</span></p>
</article>
</div>
<p class="note">${t.p.note}</p>`)}

${sec('how', `${head({ ...t.how, id: 'how' })}
<div class="steps rv">
<svg class="flow-line" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true"><path d="M0 1H100"/></svg>
${t.how.steps.map(([ic, h, p], i) => `<div class="card step"><div class="step-ico">${I[ic]}</div><span class="step-n">0${i + 1}</span><h3>${h}</h3><p>${p}</p></div>`).join('\n')}
</div>`)}

${sec('demo', `${head({ ...t.demo, id: 'demo', extra: `<div class="row"><span class="chip">${t.demo.chip}</span></div>` })}
<noscript><p class="note">${t.demo.nojs}</p></noscript>
<p class="note" data-nocrypto hidden></p>
<div class="demo" id="demo-app">
<div class="card panel">
<div class="panel-h"><h3>${t.demo.ledgerH}</h3><small>${t.demo.ledgerS}</small></div>
<table class="ledger">
<thead><tr><th scope="col">${t.demo.th[0]}</th><th scope="col">${t.demo.th[1]}</th><th scope="col">${t.demo.th[2]}</th></tr></thead>
<tbody id="ledger-rows">
${LEDGER.map(([id, date, cat, dir, amt]) => `<tr><td class="id">${id}</td><td class="cat"><span class="dir dir-${dir}" aria-hidden="true">${dir === 'in' ? '+' : '−'}</span><span class="sr-only">${dir === 'in' ? t.demo.dirIn : t.demo.dirOut}: </span><span class="cat-name">${t.cat[cat]}</span><small>${date}</small></td><td><input class="amount" type="text" inputmode="numeric" autocomplete="off" value="${amt}" aria-label="${id}, ${t.demo.amountLabel}"></td></tr>`).join('\n')}
</tbody>
</table>
<div class="panel-actions"><button class="btn btn-ghost btn-sm" id="reset" type="button">${t.demo.reset}</button></div>
</div>
<div class="card panel">
<div class="panel-h"><h3>${t.demo.treeH}</h3><small>${t.demo.treeS}</small></div>
<div class="tree-wrap" tabindex="0" role="region" aria-label="${t.demo.treeH}"><svg class="tree" id="tree" viewBox="0 0 640 290" aria-hidden="true"></svg></div>
<div class="roots">
<p class="root-line"><b>${t.demo.rootPub}</b> <span class="mono" id="root-pub">…</span></p>
<p class="root-line"><b>${t.demo.rootNow}</b> <span class="mono" id="root-now">…</span></p>
</div>
<div class="status" id="demo-status" aria-live="polite"></div>
<div class="proof">
<h3>${t.demo.proofH}</h3>
<div class="proof-form">
<label class="field">${t.demo.receipt}<select class="select" id="receipt">${LEDGER.map((r, i) => r[0].startsWith('K-') ? `<option value="${i}">${r[0]}</option>` : '').join('')}</select></label>
<button class="btn btn-primary btn-sm" id="check" type="button">${t.demo.check}</button>
</div>
<div id="proof-result" aria-live="polite"></div>
<ol class="proof-steps" id="proof-steps"></ol>
</div>
</div>
</div>
<p class="demo-note">${t.demo.note}</p>`.replace('id="demo-app"', 'id="demo-app"'))}

${sec('zakat', `${head({ ...t.zk, id: 'zakat', extra: `<div class="row"><span class="chip">${t.zk.chip}</span></div>` })}
<div class="card zakat rv" role="group" aria-label="${t.zk.mock}">
<div class="zakat-grid">
<div><div class="zk-inputs">${t.zk.inputs.map((x) => `<div class="zk-input"><span>${x}</span><span>—</span></div>`).join('')}</div>
<p class="zk-nisab">${t.zk.nisab}</p></div>
<div class="zk-methods">${t.zk.methods.map((m) => `<div class="zk-m"><h3>${m}</h3><div class="zk-bar" aria-hidden="true"><i></i></div><span class="zk-val">—</span><p>${t.zk.src}</p></div>`).join('')}</div>
</div>
<p class="zk-lock">${I.lock}<span>${t.zk.lock}</span></p>
</div>`)}

${sec('who', `${head({ ...t.who, id: 'who' })}
<div class="who rv">${t.who.tiles.map(([ic, h, p]) => `<div class="card who-t">${I[ic]}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div>`)}

${sec('principles', `${head({ ...t.pr, id: 'principles' })}
<div class="principles rv">${t.pr.items.map(([ic, h, p]) => `<div class="pr">${I[ic]}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div>`)}

${sec('roadmap', `${head({ ...t.road, id: 'roadmap' })}
<div class="road-wrap rv">${roadHalf(t.road.items.slice(0, 4))}${roadHalf(t.road.items.slice(4))}</div>`)}

${sec('status', `<div class="card status-card rv"><span class="tag">${t.st.tag}</span><h2 id="status-h">${t.st.h}</h2><p>${t.st.p}</p>
<div class="links"><a class="btn btn-primary" href="${LINKS.repo}">${I.gh.replace('<svg', '<svg width="18" height="18"')}${t.st.links[0]}</a><a class="btn btn-ghost" href="${LINKS.docs}">${t.st.links[1]}</a><a class="btn btn-ghost" href="${LINKS.issues}">${t.st.links[2]}</a></div></div>`)}
</main>
<footer class="foot">
<div class="wrap">
<div><a class="brand" href="${b}${t.path || './'}" aria-label="${t.home}">${I.mark}<span>Shaffof</span></a><p class="disc" style="margin-top:14px">${t.ft.by}</p><p class="disc" style="margin-top:10px">${t.ft.disc}</p></div>
<div><h2>${t.ft.fam}</h2><ul><li><a href="${LINKS.wonmor}">${t.ft.wonmor}</a></li><li><a href="${LINKS.muhr}">${t.ft.muhr}</a></li><li><a href="${LINKS.sanad}">${t.ft.sanad}</a></li></ul></div>
<div><h2>${t.ft.links}</h2><ul><li><a href="${LINKS.repo}">${t.ft.gh}</a></li><li><a href="${LINKS.docs}">${t.ft.docs}</a></li><li><a href="${LINKS.research}">${t.st.links[1]}</a></li><li><a href="${LINKS.issues}">${t.ft.issues}</a></li></ul></div>
</div>
</footer>
</body>
</html>
`;
}

for (const lang of Object.keys(S)) {
  const out = join(SITE, S[lang].path, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(lang));
  console.log('wrote', out);
}
