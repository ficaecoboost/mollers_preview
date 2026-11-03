# Möller's Srbija - priručnik za održavanje

Statički sajt (HTML + Bootstrap 5.3.3 + malo JavaScript-a). Nema baze, nema instalacije. Radi i kad se `index.html` otvori direktno iz foldera.

> Otvorena pitanja i materijal koji čekamo su u `TODO.md`.

## Najvažnije pravilo: build

Posle svake izmene proizvoda, šablona ili zajedničkih delova (header, footer...) pokreni:

**dupli klik na `tools/build.bat`**

Skript:
1. pravi 10 stranica u `proizvodi/` iz `data/products.json` + `proizvodi/_sablon.html`,
2. ubacuje header, footer, GTM i cookie baner iz `partials/` u sve stranice,
3. svim "Naruči" linkovima dodaje UTM parametre,
4. upozori te ako nađe dugu crtu ("–" ili "—") ili link ka shopu bez UTM-a.

Ako se na kraju pojavi "Provere prosle bez upozorenja", sve je u redu.

> Napomena: `build.ps1` mora ostati snimljen kao **UTF-8 sa BOM**. U VS Code-u: dole desno klikni na kodiranje, izaberi "Save with Encoding" i "UTF-8 with BOM". Inače se slova č, ć, ö pokvare.

## Struktura

```
index.html, proizvodi.html     stranice (pišeš ih ručno, osim delova između START/END oznaka)
proizvodi/_sablon.html         šablon stranice proizvoda
proizvodi/<slug>.html          GENERISANO - ne menjaj ručno
data/products.json             JEDINI izvor podataka o proizvodima
partials/                      header, footer, GTM, cookie baner, CSS/JS linkovi
assets/css/style.css           sve boje, fontovi i razmaci su na vrhu fajla
assets/js/main.js              meni, animacije, filter, merenje klikova, kolačići
assets/img/                    slike (products/, content/, blog/, icons/)
content/                       izvorni tekstovi sa focusimcshop.rs (za proveru)
tools/build.ps1 + build.bat    build skript
```

Delovi stranice između `<!-- START: ime -->` i `<!-- END: ime -->` se **prepisuju** pri svakom build-u. Ne menjaj ih u stranici, nego u `partials/ime.html`.

## Kako da...

### Izmeniš proizvod
1. Otvori `data/products.json` i nađi proizvod po `slug`.
2. Izmeni polje (npr. `package`, `usage`, `warnings`).
   - `**tekst**` = podebljano
   - `\n` = novi red (npr. u tabeli)
3. Pokreni `tools/build.bat`.

### Dodaš proizvod
1. Snimi sliku u `assets/img/products/<slug>.png` (vidi "Slike" dole).
2. U `data/products.json` kopiraj ceo blok postojećeg proizvoda iz iste linije i izmeni sva polja. `slug` mora biti jedinstven (mala slova, crtice, bez č/ć/š).
3. `shopUrl` = tačan link proizvoda na focusimcshop.rs (bez UTM-a, build ga dodaje sam).
4. Pokreni `tools/build.bat`. Nova stranica se pojavljuje u `proizvodi/`, kartica na stranici Proizvodi i u svojoj liniji, a adresa u `sitemap.xml`.

### Ukloniš proizvod
1. Obriši njegov blok iz `data/products.json`.
2. Obriši `proizvodi/<slug>.html` i sliku.
3. Pokreni `tools/build.bat` (sitemap se ažurira sam) i dodaj 301 redirekciju u `.htaccess` (ka `proizvodi.html`).

### Promeniš izgled svih stranica proizvoda
Izmeni `proizvodi/_sablon.html` i pokreni build.

### Promeniš header ili footer (meni, linkove, kontakt)
Izmeni `partials/header.html` ili `partials/footer.html` i pokreni build. `{{ROOT}}` ostavi ispred putanja, skript ga zamenjuje sa `../` gde treba.

### Promeniš tekst na stranici
Otvori `.html` fajl i izmeni tekst. Komentari govore koji tekst je doslovno sa focusimcshop.rs (njega ne menjaj bez odobrenja).

### Promeniš title, description ili OG sliku
U `<head>` svake stranice, uvek istim redosledom: `title`, `description`, `canonical`, `og:*`, `twitter:*`. Title do ~60 znakova, description do ~155. Za stranice proizvoda: polja `metaTitle` i `metaDescription` u `products.json` (ako ne postoje, build ih pravi sam).

### Promeniš boju ili font
Na vrhu `assets/css/style.css`, blok "1. DESIGN TOKENI". Na primer `--color-aurora` je boja dugmeta "Naruči".

### Upišeš GTM ID
U `partials/gtm-head.html` zameni `GTM-XXXXXXX` pravim ID-jem. U `partials/gtm-body.html` takođe, i ukloni komentar oko `<noscript>`. Pokreni build.

## Slike

- Packshot proizvoda: PNG ili WebP, 679 x 702 px (ili veći u istoj razmeri), ime = `slug` proizvoda.
- Fotografije: JPG ili WebP, širina do 1920 px, do ~250 KB.
- Imena: mala slova, crtice, bez razmaka i č/ć/š (npr. `jelly-fish-kola.png`).
- WebP: squoosh.app (u browseru, bez instalacije), kvalitet 80.
- Svaka slika mora imati `alt` tekst (opis slike). Dekorativne slike imaju `alt=""`.

## Merenje (dataLayer)

`main.js` šalje događaje u `dataLayer`:

| Događaj | Kada | Podaci |
|---|---|---|
| `naruci_klik` | klik na "Naruči" | `product_name`, `product_line`, `link_url` |
| `social_klik` | klik na Facebook/Instagram | `network`, `link_url` |
| `kontakt_klik` | klik na telefon/email | `contact_type`, `link_url` |
| `consent_update` | izbor u cookie baneru | `consent_statistics`, `consent_marketing` |

Consent Mode v2: sve je podrazumevano `denied` dok korisnik ne prihvati.

## Check lista pre objave izmene

- [ ] Pokrenut `tools/build.bat` bez upozorenja
- [ ] "Naruči" vodi na tačan proizvod na focusimcshop.rs i otvara se u novom tabu
- [ ] Nema dugih crta ("–", "—") u tekstu
- [ ] Mobilni prikaz proveren (F12 u browseru, ikonica telefona)
- [ ] Nema novog teksta sa zdravstvenim tvrdnjama koji nije sa focusimcshop.rs
- [ ] Nova stranica ima jedinstven title/description (u `sitemap.xml` ulazi sama)

## Blog

### Dodaš članak
1. Kopiraj `blog/_sablon.html` u `blog/<slug-clanka>.html`.
2. Prati uputstvo na vrhu šablona: zameni sve u `[UGLASTIM ZAGRADAMA]`, a komentar sa uputstvom obriši.
3. Slika: `assets/img/blog/<slug-clanka>.jpg`, poželjno 1200 x 560 px.
4. U `blog.html` kopiraj jedan blok kartice (`<div class="col-md-6 col-lg-4">...</div>`) na vrh liste i izmeni link, sliku, datum, naslov i uvod.
5. Ako je među 3 najnovija, zameni i karticu na početnoj (`index.html`, sekcija "BLOG").
6. Pokreni `tools/build.bat`.

### Canonical
Članci preuzeti sa focusimcshop.rs imaju canonical ka originalu, pa ih build ne stavlja u `sitemap.xml`. Novi članci, napisani samo za ovaj sajt, imaju canonical `https://www.mollers.co.rs/blog/<slug>.html`.

## Dodaš novu stranicu

1. Kopiraj stranicu sličnog izgleda (npr. `vitamini.html`) pod novim imenom.
2. Izmeni `<head>` (title, description, canonical, og:url, og:image) i sadržaj unutar `<main>`.
3. U `<body data-nav="...">` upiši novu vrednost (npr. `data-nav="faq"`).
4. Dodaj link u meni u `partials/header.html` sa istim `data-nav="faq"` (da se podvuče kad si na toj stranici). Po potrebi dodaj link i u `partials/footer.html`.
5. Pokreni `tools/build.bat`. Header i footer se ubacuju sami, a stranica ulazi u `sitemap.xml` automatski.

Gotovi blokovi koje build popunjava (stavi ih u stranicu i pokreni build):
- `<!-- START: products-ulje --><!-- END: products-ulje -->` kartice jedne linije (`products-jelly-fish`, `products-kapsule`)
- `<!-- START: products-grid --><!-- END: products-grid -->` svi proizvodi
- Opšti "Naruči" link: `<a class="btn-brand" href="" data-shop="pozicija" target="_blank" rel="noopener" data-track="naruci">Naruči</a>`. Build upisuje adresu Möller's kategorije sa UTM-om (`utm_content=pozicija`).

## Objava na hosting (cPanel / FTP)

1. Pokreni `tools/build.bat` (bez upozorenja).
2. Na server prebaci **samo**:
   `index.html` i ostale `.html` stranice iz korena, foldere `proizvodi/`, `blog/`, `assets/`, kao i fajlove `sitemap.xml`, `robots.txt` i `.htaccess`.
   **Ne prebacuj:** `tools/`, `partials/`, `content/`, `brand/`, `data/`, `.md` i `.csv` fajlove. Ne trebaju sajtu, a `.htaccess` ih svakako blokira.
3. U cPanel File Manager-u uključi "Show Hidden Files", da vidiš `.htaccess`.
4. Pre objave napravi rezervnu kopiju starog `public_html` (cPanel -> File Manager -> Compress).

### Provera redirekcija posle objave
Otvori nekoliko starih adresa iz `redirect-map.csv`, npr.:
- `mollers.co.rs/nasi-proizvodi/42/` -> mora otvoriti `www.mollers.co.rs/proizvodi/jelly-fish-kola.html`
- `http://mollers.co.rs/kontakt/` -> mora otvoriti `https://www.mollers.co.rs/kontakt.html`
- `www.mollers.co.rs/nepostojeca-stranica` -> mora prikazati 404 stranicu

Ako se sajt "vrti u krug" (previše preusmeravanja), hosting verovatno radi https preko proxy-ja. Tada u `.htaccess` u delu 1 zameni `RewriteCond %{HTTPS} off` sa `RewriteCond %{HTTP:X-Forwarded-Proto} !https`.

Posle objave: u Google Search Console prijavi `https://www.mollers.co.rs/sitemap.xml`.

## Validacija

- HTML: validator.w3.org/#validate_by_upload (pošalji `.html` fajl)
- Mobilni prikaz: F12 u browseru -> ikonica telefona (Toggle device toolbar)
- Brzina: pagespeed.web.dev (posle objave)

## Izveštaj završne provere (26.10.2026)

| Provera | Rezultat |
|---|---|
| Proizvodi van liste od 10 | nema (10 proizvoda u `products.json`, isti kao na focusimcshop.rs) |
| Drugi brendovi (Turtles, ReFresh, LITOZIN) | ne pojavljuju se ni na jednoj stranici |
| Tekst koji nije sa focusimcshop.rs | samo UI/SEO tekst sa spiska u `TODO.md`, deo 3 |
| "Naruči" -> tačan proizvod + UTM + novi tab | provereno skriptom, svih 10 proizvoda i svi opšti linkovi |
| Duge crte | nema (build proverava pri svakom pokretanju) |
| Jedan `<h1>` po stranici, `alt` na slikama, jedinstveni `id` | provereno skriptom na svih 25 stranica |
| Title do ~60 / description do ~155 znakova | provereno (najduži title 64, blog "Koji su najbolji izvori...") |
| Mobilni prikaz | proveren na 390 px (početna, stranica proizvoda) |
| Kontrast (WCAG AA) | dugme 4.9:1, mali zeleni tekst 6.7:1, beli na zelenom 10.6:1 |
| HTML validacija (W3C) | nije pokrenuta (zahteva slanje fajlova na validator.w3.org), uraditi pre objave |
