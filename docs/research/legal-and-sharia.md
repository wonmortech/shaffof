# Huquqiy va shariat chegaralari

> **Sana:** 2026-11-13. **Bu yuridik yoki diniy maslahat emas.** Quyidagi hamma narsa bizning qonun matnlarini oʻqishimizga asoslangan tahlil. **Yurist yoki olim tasdiqlashi shart.** Manbalar 2026-11-13 da ochilgan, toʻliq roʻyxat [references.md](references.md) da.

## 1. Shaffof qanday ishlaydi (huquqiy nuqtai nazardan)

- **Pul faqat jamgʻarmaning oʻz bank hisobi orqali yuradi.** Shaffof pulni qabul qilmaydi, saqlamaydi, oʻtkazmaydi va toʻlov sahifasiga yoʻnaltirmaydi.
- Jamgʻarma Shaffofga **yozuv** kiritadi: sana, summa, toifa (masalan, zakot, sadaqa, vaqf) va hujjat hashi. Ism, telefon va karta raqami kiritilmaydi.
- Har oy yozuvlardan Merkle root hisoblanadi va Muhr orqali OpenTimestamps bilan muhrlanadi. Bunda **hech qanday kripto-aktiv sotib olinmaydi va ishlatilmaydi**: Bitcoin tranzaksiyasini ochiq kalendar serverlari yozadi.
- Xayriyachi oʻz kvitansiya ID va tuzini (salt) faqat oʻzida saqlaydi va inclusion proofni brauzerda tekshiradi.
- Zakot kalkulyatori brauzerda ishlaydi va maʼlumot saqlamaydi. U fatvo bermaydi, usullarni manbasi bilan koʻrsatadi.

## 2. Tegishli qonunlar (qisqa)

| Mavzu | Hujjat | Shaffof uchun maʼnosi |
|---|---|---|
| Kripto toʻlov | PP-3832, 6-band "v" kichik bandi (PP-359 bilan tahrirlangan), https://lex.uz/docs/3806048 | Kripto-aktivni toʻlov vositasi yoki toʻlov qabul qilish uchun ishlatish taqiqlangan (qonunda nazarda tutilgan holatlardan tashqari). Shaffof kriptoda xayriya qabul qilmaydi va bunday imkoniyat ham bermaydi |
| Kripto javobgarligi | ZRU-899 (2024-01-19), NAPP xabari: https://napp.uz/en/news/o-zbekiston-respublikasi-fuqarolari-diqqatiga | Noqonuniy kripto aylanmasi uchun maʼmuriy va jinoiy javobgarlik bor. Shu sabab anchoring uchun studiyaning oʻzi BTC sotib olmaydi, faqat ochiq kalendarlardan foydalanadi |
| Homiylik (xayriya) | "Homiylik toʻgʻrisida", OʻRQ-96, https://lex.uz/docs/-1183667 | Hisob va eʼlon majburiyati **jamgʻarmaning** zimmasida: olingan xayriyalar 10 kun ichida (5-1-modda), yigʻim summasi yigʻim tugagach 1 kun ichida (5-2-modda), yillik hisobot ochiq (16-modda). Xayriyachi maqsadli foydalanish haqida hisobot talab qila oladi (16-modda). Shaffof jamgʻarmaga shu eʼlonlarni tekshiriladigan qilib chiqarishda yordam beradi |
| 2025 oʻzgartirishlar | OʻRQ-1083 (2025-08-21), https://lex.uz/uz/docs/-7696348 | Yigʻimdan oldin bank hisobi, maqsad, muddat va summani eʼlon qilish. Xayriya qutisi qoidalari: ochishda guvohlar va video, pul shu kuni yoki keyingi ish kuni bankka topshiriladi. Jismoniy shaxs yigʻimi cheklangan. MJtK 239²-modda boʻyicha javobgarlik. **Shaffof foydalanuvchi uchun yigʻim ochish funksiyasini bermaydi** |
| NNT | "Nodavlat notijorat tashkilotlari toʻgʻrisida", 763-I, https://lex.uz/docs/-11360 | Mablagʻ manbalari haqida maʼlumot ochiqligi (8-modda), jamoat fondining yillik hisoboti (12-modda), hisobotlar adliya, soliq va statistika organlariga (33-modda). Shaffof bu rasmiy hisobotlarning **oʻrnini bosmaydi** |
| Jamoat fondlari | "Jamoat fondlari toʻgʻrisida", 527-II, https://lex.uz/docs/-42231 (qidiruv orqali tasdiqlangan) | Pilot jamgʻarmaning huquqiy shakli shu boʻlishi mumkin. Ustav va vasiylik kengashi qoidalarini yurist bilan tekshirish kerak |
| Shaxsiy maʼlumot | "Shaxsga doir maʼlumotlar toʻgʻrisida", OʻRQ-547, https://lex.uz/docs/-4396419; oʻzgartirish OʻRQ-1125 (2026-03-26), https://lex.uz/uz/docs/-8099215 (qidiruv orqali tasdiqlangan) | Rozilik (21-modda), egasizlantirish (16-modda), lokalizatsiya (27¹-modda). Shaffof ochiq qismda shaxsiy maʼlumot saqlamaydi; jamgʻarmaning ichki bazasi uning oʻz zimmasida |

**Muhim:** alohida "Xayriya toʻgʻrisida" nomli amaldagi qonun lex.uzʼda topilmadi. Baʼzi yangiliklar (masalan, Anhor, 2025-04-30) "Xayriya faoliyati toʻgʻrisida"gi qonun deb yozgan, lekin lex.uzʼdagi OʻRQ-1083 matni faqat "Homiylik toʻgʻrisida" nomini keltiradi. **Yurist tasdiqlashi shart.**

## 3. Mumkin / mumkin emas / kulrang zona

| Mumkin (bizning tahlil) | Mumkin emas | Kulrang zona |
|---|---|---|
| Ochiq kodli zakot kalkulyatori: brauzerda, maʼlumot saqlamaydi, fatvo bermaydi | Xayriya pulini qabul qilish, saqlash yoki oʻtkazish (bu jamgʻarma va bank ishi) | Jamgʻarmaga pullik xizmat sifatida hisob dasturini taqdim etish: oddiy dasturiy xizmatmi yoki qoʻshimcha talab bormi (yurist savoli 6) |
| Jamgʻarma kiritgan anonim yozuvlardan hisob kitobi va Merkle root hisoblash | Toʻlov sahifasi, karta maʼlumotini yigʻish, toʻlov tizimi bilan integratsiya | Ochiq hisobotdagi yozuvlarni jamgʻarmaning qonuniy eʼloni (5-1, 5-2-moddalar) sifatida hisoblash mumkinmi, yoki u faqat qoʻshimcha vositami |
| Hash va rootʼni ochiq OpenTimestamps kalendarlari orqali muhrlash (studiya kripto sotib olmaydi) | Kripto-aktivda xayriya qabul qilish yoki bunday imkon berish (PP-3832, 6-band) | OpenTimestamps orqali muhrlash PP-3832 yoki ZRU-899 maʼnosida "kripto-aktiv aylanmasi" hisoblanmasligi (bizningcha hisoblanmaydi, yurist tasdiqlashi shart) |
| Xayriyachiga brauzerda inclusion proofni tekshirish imkonini berish | Shaffof nomidan pul yigʻish yoki yigʻim kampaniyasini ochish (OʻRQ-1083 qoidalari) | Kvitansiya ID va summa birgalikda kichik jamgʻarmada xayriyachini aniqlashga imkon beradimi, yaʼni bu "shaxsga doir maʼlumot" boʻlib qoladimi |
| Ochiq kod (Apache-2.0), tadqiqot, demo maʼlumot "demo" belgisi bilan | Xayriyachi ismi, reytingi va leaderboardini chop etish | Xorijiy xayriyachi yoki xorijiy jamgʻarma yozuvlari (NNT qonuni, 8-modda, xorijiy mablagʻlar haqida chorak eʼloni) |
| Jamgʻarmaga qonuniy hisobotini tekshiriladigan qilishda yordam | Fatvo berish yoki "zakotingiz qabul boʻldi" deb daʼvo qilish | Diniy tashkilotlar uchun alohida tartib (OʻRQ-1083 xayriya qutisi qoidalarida diniy tashkilotlarga istisno bor koʻrinadi; matnni yurist tekshirsin) |

## 4. Yurist uchun ochiq savol (asosiy tadqiqotdagi 6-savol)

> **6.** Xayriya jamgʻarmasi uchun pulni ushlamasdan hisob yuritadigan va ochiq hisobot chiqaradigan dastur qanday talablarga tushadi?

Uni quyidagi aniq savollarga boʻlib yuboramiz:

- 6a. Shaffof (dasturiy taʼminot va hosting) jamgʻarmaga nisbatan shaxsga doir maʼlumotlar operatori yoki uchinchi shaxs hisoblanadimi, agar ochiq qismda shaxsiy maʼlumot boʻlmasa?
- 6b. Shaffofdagi oylik hisobot "Homiylik toʻgʻrisida"gi Qonunning 5-1, 5-2 va 16-moddalaridagi eʼlon majburiyatini bajarish usuli boʻla oladimi, yoki faqat qoʻshimcha vositami?
- 6c. Hash va Merkle rootʼni ochiq OpenTimestamps kalendarlari orqali Bitcoinʼga muhrlash, studiya ham, jamgʻarma ham kripto-aktiv sotib olmasa, PP-3832 va ZRU-899 boʻyicha ruxsat etilganmi?
- 6d. Serverlar qayerda boʻlishi kerak (OʻRQ-547, 27¹-modda, OʻRQ-1125 tahriridan keyin), agar serverda faqat anonim yozuvlar va hashlar boʻlsa?
- 6e. Jamgʻarmalar uchun pullik B2B obuna oddiy dasturiy xizmat hisoblanadimi va IT Park faoliyat roʻyxatiga kiradimi?

## 5. Olim uchun ochiq savollar (asosiy tadqiqotdagi 11- va 12-savollar)

> **11.** Zakot kalkulyatoridagi usullar manbalari toʻgʻrimi, ayniqsa kripto-aktivlar, savdo moli va qarzlar boʻyicha? Qaysi mazhab variantlarini koʻrsatish kerak?

Biz bilgan farqlar (har biri manbali, **olim tasdiqlashi shart**):
- **Nisob gramm qiymatlari:** NZF 87.48 g / 612.36 g va 85 g / 595 g ni keltiradi. Oʻzbekiston musulmonlari idorasining 2026-yil eʼloni ≈ 85 g 585 probali oltindan hisoblaydi. Idora fatvolarida kumush 200 dirham, 1 dirham 3.17 g deb berilgan. Qaysi qiymatlar koʻrsatilsin va qaysi biri birinchi turadi?
- **Oltin yoki kumush asos:** NZF va Islamic Relief kumushni tavsiya qiladi, Oʻzbekiston eʼloni oltinga asoslanadi. Kalkulyator ikkalasini yonma-yon koʻrsatsinmi?
- **Qarzlar:** idora fatvolarida qarz zakotga toʻsqinlik qilmaydi (9-fatvo), lekin talab qilinayotgan qarz boshqacha (68-fatvo). GiveDirectly kalkulyatori Shofeʼiyda qarz ayirilmaydi, boshqa uch mazhabda 12 oy ichida toʻlanadigan qarz ayiriladi deb koʻrsatadi. Zakat Foundation of America faqat qisqa muddatli qarzlarni ayiradi.
- **Zargarlik:** GiveDirectly kalkulyatoriga koʻra Hanafiy mazhabida hamma zargarlik hisoblanadi, boshqalarida doimiy taqiladigani istisno.
- **Savdo moli:** idora fatvolariga koʻra tijorat uchun saqlangan narsa (hatto qimmatbaho tosh) zakotga kiradi (52-fatvo).
- **Kripto-aktivlar:** Shariyah Review Bureau (2023) zakotni aktiv turi va ushlab turish maqsadiga bogʻlaydi. Oʻzbekiston musulmonlari idorasi 2024-iyunda kripto fatvosini chiqarib, ertasi kuni qaytarib olgan va fatvo ilmiy tadqiqot tugagach qayta eʼlon qilinishini aytgan (Kun.uz, 2024-06-04: https://kun.uz/en/news/2024/06/04/uzbekistans-fatwa-center-refutes-statement-about-inadmissibility-of-cryptocurrency-trading, qidiruv orqali tasdiqlangan; RFE/RL sahifasi 2026-11-13 da ochilmadi). Qayta eʼlon qilingan fatvo topilmadi. Kalkulyator kripto-aktivni faqat "qiymat" sifatida koʻrsatsinmi yoki bu boʻlimni olim javobigacha yopib turish kerakmi?
- **Yil:** hijriy yoki milodiy yil (Shariyah Review Bureau milodiy yil uchun 2.577% stavkani keltiradi, qidiruv parchasi boʻyicha).

> **12.** Xayriyaning ochiq hisobotda koʻrinishi, anonim boʻlsa ham, riyo xavfini tugʻdiradimi? Qanday cheklov kerak?

Manbalar: Baqara 2:271 (oshkora berish yaxshi, yashirin berish yanada yaxshi), Buxoriy 1423 (oʻng qoʻl bergani chap qoʻlga bilinmaydigan yashirin sadaqa). Qidiruvda topilgan tafsirlardan biri farz sadaqani oshkora berishni afzal koʻradi (qarang [references.md](references.md), §3). Savollar:
- Ismsiz, faqat summa va sana koʻrinadigan yozuv riyoga sabab boʻladimi?
- Xayriyachi oʻz kvitansiyasini tekshirishi (faqat oʻzi koʻradi) ruxsat etilganmi?
- Zakot (farz) va sadaqa (nafl) yozuvlarini ochiq hisobotda turlicha koʻrsatish kerakmi?

## 6. Xavfni kamaytirish choralari

| Xavf | Chora |
|---|---|
| Shaffof toʻlov yoki yigʻim xizmati deb qabul qilinishi | Kod va interfeysda toʻlov tugmasi, karta maydoni va bank integratsiyasi yoʻq. Har sahifada "Shaffof pulni ushlamaydi" qatori. Jamgʻarma bank rekvizitlarini Shaffof orqali yigʻim sifatida tarqatmaydi |
| Kripto bilan bogʻliqlik | Studiya BTC sotib olmaydi va saqlamaydi, faqat ochiq OpenTimestamps kalendarlaridan foydalanadi. Kripto-aktiv qabul qilish funksiyasi yoʻq. Yurist javobi (6c) kelguncha anchoring "tajriba" deb belgilanadi |
| Xayriyachini aniqlab qolish | Ochiq yozuvda ism yoʻq. Bargda tuzlangan hash bor, tuzni faqat xayriyachi biladi (Vitalik sxemasi). Kichik summalar va kam yozuvli oylar guruhlab koʻrsatiladi (aniq chegara yurist va olim bilan belgilanadi). Kvitansiyani tekshirish brauzerda, serverga soʻrov yuborilmaydi |
| Shaxsiy maʼlumot qonuni | Jamgʻarmaning ichki bazasi Shaffofga kirmaydi. Shaffof faqat egasizlantirilgan yozuvlarni oladi (OʻRQ-547, 16-modda). Server joylashuvi yurist javobidan keyin (6d) |
| Diniy notoʻgʻrilik | Kalkulyator olim yozma koʻrigidan oldin chiqarilmaydi. Har qator manbasi bilan, "bu fatvo emas" bloki bilan. Usullar alohida ochiq faylda versiyalanadi |
| Riyo va raqobat | Reyting, leaderboard, "eng koʻp bergan", badge va ball yoʻq. Ochiq hisobotda faqat jami va toifa. Olim javobidan (12) keyin qoʻshimcha cheklovlar |
| Jamgʻarma oʻz qonuniy hisobotini Shaffof bilan almashtirib qoʻyishi | Hujjatlarda va interfeysda: "Shaffof qonuniy hisobotingiz oʻrnini bosmaydi" degan ogohlantirish |
| OpenTimestamps maqomini oshirib aytish | Peter Todd ogohlantirishi soʻzma-soʻz: tamgʻa maʼlumot shu vaqtdan oldin mavjud boʻlganini isbotlaydi, toʻgʻriligini emas. Rasmiy notarius yoki RFC 3161 vaqt tamgʻasi oʻrnida koʻrsatilmaydi |

**Yakuniy eslatma:** yuqoridagi barcha "mumkin" ustunlari bizning taxminimiz. Ishga tushirishdan oldin **yuristning yozma javobi (6a–6e)** va **malakali olimning yozma koʻrigi (11, 12)** olinishi shart.
