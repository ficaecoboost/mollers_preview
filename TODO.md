# TODO - mollers.co.rs

Stanje: 26.10.2026. Sve stranice su napravljene. Čekamo materijal i odluke ispod.

## 1. Otvoreno za tim / klijenta

- [ ] **Regulatorna provera tekstova.** Po dogovoru, tekstovi su preneti kao na focusimcshop.rs, a proveru radimo kasnije sa ostatkom tima. Mesta koja treba pogledati:
  - Omega-3: "može značajno doprineti prevenciji hroničnih bolesti", spisak simptoma nedostatka
  - Početna: "Za dobar vid i poboljšanu oštrinu vida", "Doprinosi jačanju imuniteta"
  - Omega-3 ikonice (natpis je deo slike): "Snaže imuni sistem", "Jačaju kosti, mišiće i zglobove", "Čuvaju srce", "Doprinose razvoju mozga", "Čuvaju oči i vid"
  - Vitamini: "sprečava osteoporozu kod starijih", deo o lečenju rahitisa
  - Blog "5 razloga...": deo o depresiji i trudnoći
  - Blog "Kako pripremiti kožu za sunce?": "može poboljšati elastičnost kože", "fotoprotektivni efekat"
  - Blog "Koji su najbolji izvori...": "smanjuju rizik za nastanak aritmija..."
- [ ] **FORTE Omega-3** ima dva pakovanja na shopu (112 i 30 kapsula). "Naruči" vodi na stranicu 112 kapsula, gde se bira pakovanje. OK?
- [ ] **Stari sajt ima stranicu "Uslovi korišćenja"**, a novi nema (preusmerena je na politiku privatnosti). Treba li nam ta stranica?
- [ ] **Stari sajt odaje putanje servera.** Adrese na trenutnom mollers.co.rs ispisuju PHP greške sa putanjom `/home/mollersc/public_html/_go.php`. Rešava se objavom novog sajta. Do tada bi bilo dobro da administrator isključi prikaz grešaka.
- [ ] **Blog canonical** trenutno vodi ka focusimcshop.rs (dogovoreno). Ako se kasnije promeni: izmeniti `<link rel="canonical">` u 5 fajlova u `blog/`, pa pokrenuti build (članci tada sami ulaze u sitemap).

## 2. Materijal koji čekamo (`brand/`)

- [ ] **Packshot-ovi** svih 10 proizvoda, PNG na providnoj pozadini. Sada su privremeno slike sa focusimcshop.rs. Na nekima je strano pakovanje (npr. Jelly Fish jagoda i Total imaju rumunski tekst).
- [ ] **Logo** u SVG (svetla i tamna verzija). Sada je privremeno logo sa focusimcshop.rs (beli natpis, radi samo na tamnoj pozadini).
- [ ] **Hero video ili KV.** Sada je slika sa focusimcshop.rs. Uputstvo za video je u komentaru u `index.html`.
- [ ] **Blog slike u većoj rezoluciji.** Sa shopa su samo 433x203 px.
- [ ] **Fontovi iz Jelly Fish kampanje** + licenca za web. Do tada: Rubik i Inter (OFL licenca, hostovano lokalno).
- [ ] **GTM, GA4 i Facebook pixel ID.** Upisuju se u `partials/gtm-head.html` i `partials/gtm-body.html`, pa build.
- [ ] **Politika privatnosti i politika kolačića** (pravni tekst). Stranice postoje sa placeholderom i oznakom `noindex`. Kad tekst stigne, ukloni `<meta name="robots" content="noindex, follow">`.
- [ ] **OG slika** 1200x630 px i favicon od zvaničnog logoa (sada privremeni `favicon.svg`).
- [ ] **WebP verzije slika** (squoosh.app) kad stignu finalne slike.
- [ ] **Pristup hostingu** (cPanel/FTP) za objavu.

## 3. Naš tekst (nije sa focusimcshop.rs) - za odobrenje

Bez zdravstvenih i nutritivnih tvrdnji. Sav ostali tekst je sa focusimcshop.rs.

- **Početna:** "Iz Norveške, od 1854.", oznake "1854. godina osnivanja / Norveška zemlja porekla / 3 linije ulje, ribice, kapsule", "Pogledaj proizvode", "Tri linije, jedna tradicija", "Izaberite oblik koji vašoj porodici najviše odgovara.", "Pronađite svoj Möller's", "Svi Möller's proizvodi se poručuju na focusimcshop.rs, webshopu distributera Focus IMC.", "Saznajte više o omega-3 i vitaminima"
- **Linije** (`products.json` -> `lines[].intro`): "Prepoznatljiva zelena boca. Möller's ulje jetre bakalara iz Norveške, u tri ukusa." / "Möller's omega-3 u obliku gumenih ribica, u četiri ukusa." / "FORTE Omega-3, OMEGACORE i Total. Möller's u obliku kapsula."
- **Proizvodi:** `shortDescription` za svaki proizvod (uvod na stranici proizvoda), "Iz iste linije", "Detaljnije"
- **Stranica Proizvodi:** "Möller's ponuda", "Ulje jetre bakalara, Jelly Fish gumene ribice i kapsule. Izaberite proizvod i poručite ga na focusimcshop.rs."
- **Omega-3:** nadnaslovi "ALA, EPA i DHA", "Omega-3 i zdravlje"
- **Vitamini:** naslov "Zdrave navike za ceo život" (fraza sa početne strane focusimcshop.rs/mollers)
- **Möller's priča:** "Möller's kroz vreme"
- **Kontakt:** "Pozovite nas ili nam pišite i odgovorićemo vam u najkraćem roku." (na izvoru: "Popunite formu ili nas pozovite...", ali ovaj sajt nema formu), "Pratite Möller's Srbija", "Möller's Srbija je na Facebooku i Instagramu."
- **Blog:** "Članak je originalno objavljen na focusimcshop.rs."
- **404:** "Stranica nije pronađena", "Stranica koju tražite ne postoji ili je premeštena."
- **Footer:** "Möller's proizvodi se poručuju na focusimcshop.rs", "© Möller's Srbija. Distributer: Focus IMC d.o.o."
- **Cookie baner:** ceo tekst (uskladiti sa politikom kolačića kad stigne)
- **SEO:** svi `<title>` i `meta description`

## 4. Urađeno / odlučeno

- [x] Lista od 10 proizvoda proverena na focusimcshop.rs (poklapa se)
- [x] Kontakt: podaci sa focusimcshop.rs (0800 15 15 16, office@focusimc.com, Bulevar Zorana Đinđića 125)
- [x] Domen: `https://www.mollers.co.rs` (sa www), `.htaccess` preusmerava sve na https + www
- [x] Greške u kucanju u izvornim tekstovima ispravljene ("prepodučuje", "vitaminaD", "Omega-3ulje", "baklara", "elovanje", "sunčenovoj", "ulje ulje", "salizorida", "Moller's" -> "Möller's" i dr.)
- [x] Duge crte ("–") iz izvornih tekstova pretvorene u obične crtice ("-")
- [x] Blog: preneto 5 Möller's članaka. Članci drugih brendova sa blog liste shopa nisu preneti. U Möller's člancima nema drugih brendova.
- [x] Redirekcije: stari sajt popisan preko Wayback Machine arhive (55 adresa), vidi `redirect-map.csv` i `.htaccess`. Stara vest o brendu LITOZIN i ostale vesti vode na Blog.
