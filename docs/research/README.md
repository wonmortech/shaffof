# Shaffof: tadqiqot

> **Sana:** 2026-11-13 · **Loyiha:** Shaffof (Wonmor studiyasi, `wonmortech/shaffof`, Apache-2.0)
> **Bu yuridik yoki diniy maslahat emas.** Huquqiy va shariat boʻyicha har bir xulosa yurist yoki malakali olim tasdiqlashi shart.
> Barcha havolalar 2026-11-13 da ochib tekshirilgan. Faqat qidiruv natijasi orqali tasdiqlanganlari "(qidiruv orqali tasdiqlangan)", tasdiqlanmaganlari "(tasdiqlanmagan)" deb belgilangan.

## Shaffof nima

1. **Zakot kalkulyatori.** Bir nechta mazhab usulini yonma-yon, har qadamni manbasi bilan koʻrsatadi. Fatvo bermaydi. Malakali olimlar koʻrib chiqmaguncha chiqarilmaydi.
2. **Xayriya jamgʻarmalari uchun ochiq hisob kitobi.** Har oy Merkle root bilan muhrlanadi va Muhr orqali OpenTimestamps bilan Bitcoinʼga bogʻlanadi. Shu tufayli istalgan odam chop etilgan hisobot keyin oʻzgartirilmaganini tekshira oladi. Xayriyachi ham oʻz kvitansiyasi hisobotga kirganini tekshiradi (inclusion proof).

Shaffof pulni ushlamaydi, yigʻmaydi va oʻtkazmaydi. Kripto toʻlovlarga tegmaydi. Xayriyachilar reytingi yoʻq, ochiq hisobotda xayriyachi ismi hech qachon chiqmaydi.

## Qisqa xulosa

- **Zakot usullari haqiqatan farq qiladi va buni manba bilan koʻrsatsa boʻladi.** NZF nisobni 87.48 g oltin / 612.36 g kumush deb oladi va 85 g / 595 g ni "boshqa fikr" deb keltiradi. Oʻzbekiston musulmonlari idorasining Fatvo markazi 2026-yil uchun nisobni "≈ 85 gramm 585 probali tilla" qiymatidan hisoblagan. Idora fatvolarida kumush nisobi 200 dirham, 1 dirham 3.17 g deb berilgan. Batafsil: [references.md](references.md).
- **Eng yaqin raqobatchi kalkulyator mazhab tanlashni allaqachon taklif qiladi.** GiveDirectly sahifasidagi kalkulyator Hanafiy, Shofeʼiy, Molikiy va Hanbaliy usullarini beradi. Lekin unda manbalar qadam-baqadam koʻrsatilmaydi va kod ochiq emas. Ochiq kodli kalkulyatorlar bor, lekin ular kichik va mazhabni manba bilan koʻrsatmaydi. Batafsil: [competitors.md](competitors.md).
- **Hech bir xayriya platformasi kriptografik tekshiriladigan hisobot bermaydi.** Hammasi "bizga ishoning" modelida: audit, reyting, foto, PDF. Open Collective ochiq jurnal chop etadi, lekin xayriyachi nomlari ochiq koʻrinadi va jurnal muhrlanmagan. Shaffofning boʻshligʻi aynan shu.
- **Oʻzbekiston qonuni hisobot ochiqligini allaqachon talab qiladi.** "Homiylik toʻgʻrisida"gi Qonun (OʻRQ-96) yigʻilgan summani eʼlon qilishni va xayriyachiga maqsadli foydalanish haqida hisobot berishni talab qiladi. 2025-yil avgustdagi OʻRQ-1083 bu talablarni kuchaytirgan. Shaffof jamgʻarmaga shu majburiyatni bajarishda yordam beradigan vosita boʻla oladi, lekin uning oʻrnini bosmaydi. Batafsil: [legal-and-sharia.md](legal-and-sharia.md).
- **Alohida "Xayriya toʻgʻrisida" qonuni lex.uzʼda topilmadi.** Xayriya faoliyati asosan "Homiylik toʻgʻrisida", "Nodavlat notijorat tashkilotlari toʻgʻrisida" va "Jamoat fondlari toʻgʻrisida"gi qonunlar bilan tartibga solinadi. Baʼzi yangiliklar "Xayriya faoliyati toʻgʻrisida"gi qonun deb yozadi, lekin lex.uzʼdagi oʻzgartirish qonuni (OʻRQ-1083) faqat "Homiylik toʻgʻrisida" nomini keltiradi.

## Fayllar

| Fayl | Mazmuni |
|---|---|
| [competitors.md](competitors.md) | Zakot kalkulyatorlari, xayriya shaffofligi platformalari, ochiq kodli loyihalar, Oʻzbekiston jamgʻarmalarining hisobotlari. Nimani olamiz, qayerda farq qilamiz |
| [references.md](references.md) | AAOIFI SS 35, nisob manbalari, Oʻzbekiston musulmonlari idorasi, RFC 9162/6962, OpenTimestamps, Merkle, proof of solvency, Rekor, Oʻzbekiston qonunlari, WebCrypto |
| [inspiration.md](inspiration.md) | Sokin, ishonchli dizayn namunalari (moliya, din, tekshiriladigan jurnallar) va har biridan nima olish |
| [legal-and-sharia.md](legal-and-sharia.md) | Oʻzbekistonda nima mumkin, nima mumkin emas va kulrang zona. Yurist va olim uchun ochiq savollar, xavfni kamaytirish choralari |

## Bogʻliq loyihalar

- **Muhr:** hash va Merkle rootʼlarni OpenTimestamps orqali muhrlaydigan Wonmor loyihasi. Shaffof anchoring uchun shundan foydalanadi.
- **Sanad:** Wonmorʼning tekshiriladigan hujjatlar (Verifiable Credentials) loyihasi. Kalit va jurnal yadrosi umumiy.
