# Design notes - mollers.co.rs

Izvor dizajna: https://focusimcshop.rs/mollers/ (pregledano 26.10.2026). Ovo je privremeni design system dok ne stigne zvanični materijal od principala. Sve vrednosti su CSS varijable na vrhu `assets/css/style.css`.

## Šta je preuzeto sa focusimcshop.rs/mollers

| Element | Na izvoru | Kod nas |
|---|---|---|
| Glavna boja | `#21453A` tamnozelena (naslovi, pozadine) | `--color-forest` |
| Akcent | `#81C241` svetlozelena (dugmad, detalji) | `--color-aurora` |
| Pomoćne zelene | `#479C47`, `#066A36` (boca, logo) | `--color-leaf`, `--color-bottle` |
| Amblem | crvena `#EC1C24` i zlatna iz logoa | `--color-emblem-red`, `--color-gold` (štedljivo) |
| Font naslova | Rubik | Rubik (lokalno, `assets/fonts/`) |
| Font teksta | Inter | Inter (lokalno) |
| Oblici | zaobljeni uglovi 30px, "pill" dugmad 80px | `--radius-lg`, `--radius-pill` |
| Fotografija | polarna svetlost, norveški fjordovi, zelena boca | hero i tamne sekcije |
| Packshot-ovi | proizvod na zelenoj zaobljenoj pločici | kartice proizvoda |

## Kako je "futurizovano"

- **Polarna svetlost kao motiv.** Tamne sekcije imaju meke zelene gradijente koji se veoma sporo pomeraju (kao aurora). Isključeno je za `prefers-reduced-motion`.
- **Glass elementi.** Header i kartice preko tamnih pozadina su poluprozirni, sa zamućenjem (`backdrop-filter`).
- **Veći naslovi, više prostora.** Naslovi do ~4.5rem, sekcije sa velikim razmakom.
- **Packshot kao heroj.** Na stranici proizvoda slika je velika, sa sjajem u boji ukusa (`accent` u `products.json`) i blagim parallax-om.
- **Organski oblici.** Talasasti prelazi između sekcija (more) i oblik "kapi" iza slika.
- **Mikrointerakcije.** Kartice se blago podignu i zasijaju na hover, dugmad imaju strelicu koja se pomeri.

## Šta namerno izbegavamo

Neon boje, crni "gaming" izgled, agresivne animacije. Sajt ostaje topao: krem i svetle ledeno-zelene pozadine smenjuju se sa tamnozelenim.

## Pristupačnost (WCAG 2.1 AA)

- Beli tekst na `--color-forest`: kontrast ~10:1.
- `--color-forest` tekst na `--color-aurora` dugmetu: ~4.9:1.
- Fokus: vidljiv okvir od 3px u `--color-aurora` na svim linkovima i dugmadima.
