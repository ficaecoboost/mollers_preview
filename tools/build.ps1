<#
  Möller's Srbija - build.ps1
  -------------------------------------------------------------------------
  Pokretanje: dupli klik na tools/build.bat (ili u terminalu: powershell -ExecutionPolicy Bypass -File tools\build.ps1)

  Šta radi:
  1. Iz data/products.json + proizvodi/_sablon.html pravi 10 stranica u proizvodi/
  2. Popunjava generisane blokove (kartice proizvoda, linije, povezani proizvodi)
  3. U SVE .html stranice ubacuje delove iz partials/ između oznaka
       <!-- START: header -->  ...  <!-- END: header -->
     i sam podešava putanje (../ za stranice u podfolderima)
  4. Proverava da nema dugih crta i da svi linkovi ka shopu imaju UTM

  Ništa se ne instalira - koristi samo PowerShell koji je već na Windows-u.
#>

$ErrorActionPreference = 'Stop'

# --- PODEŠAVANJA -----------------------------------------------------------
$Root            = Split-Path -Parent $PSScriptRoot
$SiteUrl         = 'https://www.mollers.co.rs'      # TODO: potvrditi www ili bez www
$ShopCategoryUrl = 'https://focusimcshop.rs/mollers/prodavnica/category-mollers/'
$UtmBase         = 'utm_source=mollers.co.rs&utm_medium=referral&utm_campaign=mollers_brand_site'
$Partials        = @('gtm-head', 'gtm-body', 'head-assets', 'header', 'footer', 'cookie-banner', 'scripts')

$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

# --- POMOĆNE FUNKCIJE ------------------------------------------------------
function Read-Text([string]$Path) { [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8) }
function Write-Text([string]$Path, [string]$Text) { [IO.File]::WriteAllText($Path, $Text, $Utf8NoBom) }

# Link ka shopu sa UTM parametrima. $Content = slug proizvoda ili pozicija (header, footer...)
function Get-ShopLink([string]$Url, [string]$Content) {
  $sep = if ($Url.Contains('?')) { '&' } else { '?' }
  return ($Url + $sep + $UtmBase + '&utm_content=' + $Content) -replace '&', '&amp;'
}

# Bezbedan tekst za HTML (samo & < > ")
function ConvertTo-HtmlText([string]$Text) {
  if ($null -eq $Text) { return '' }
  return $Text.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}

# Tekst iz JSON-a u HTML: **podebljano** -> <strong>, novi red -> <br>
function Format-Text([string]$Text) {
  $t = ConvertTo-HtmlText $Text
  $t = [regex]::Replace($t, '\*\*(.+?)\*\*', '<strong>$1</strong>')
  return $t.Replace("`n", '<br>')
}

# Čist tekst (bez **) za meta opise i schema
function Get-PlainText([string]$Text) { return ($Text -replace '\*\*', '' -replace "`n", ' ') }

# Zamena sadržaja između <!-- START: ime --> i <!-- END: ime -->
function Set-Block([string]$Html, [string]$Name, [string]$Content) {
  $pattern = '(?s)(<!-- START: ' + [regex]::Escape($Name) + ' -->).*?(<!-- END: ' + [regex]::Escape($Name) + ' -->)'
  $evaluator = [System.Text.RegularExpressions.MatchEvaluator] { param($m) $m.Groups[1].Value + "`n" + $Content.TrimEnd() + "`n" + $m.Groups[2].Value }
  return [regex]::Replace($Html, $pattern, $evaluator)
}

# Oznake u partial-ima: {{ROOT}} i {{SHOP:pozicija}}
function Resolve-Tokens([string]$Html, [string]$RootPrefix) {
  $Html = $Html.Replace('{{ROOT}}', $RootPrefix)
  $evaluator = [System.Text.RegularExpressions.MatchEvaluator] { param($m) Get-ShopLink $ShopCategoryUrl $m.Groups[1].Value }
  return [regex]::Replace($Html, '\{\{SHOP:([a-z0-9-]+)\}\}', $evaluator)
}

# --- PODACI ------------------------------------------------------------------
$data = (Read-Text (Join-Path $Root 'data\products.json')) | ConvertFrom-Json
$products = @($data.products)
$lines = @{}
foreach ($l in $data.lines) { $lines[$l.id] = $l }

$arrowIcon = '<svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/></svg>'

# Kartica jednog proizvoda (koristi se na Proizvodi, Početnoj i u "Iz iste linije")
function New-ProductCard($p, [string]$RootPrefix, [string]$ColClass) {
  $line = $lines[$p.line]
  $page = "$($RootPrefix)proizvodi/$($p.slug).html"
  $name = ConvertTo-HtmlText $p.name
  $meta = if ($p.line -eq 'kapsule') { $p.package } else { "$($p.flavor) · $($p.package)" }
  $shop = Get-ShopLink $p.shopUrl $p.slug
  return @"
<div class="$ColClass product-grid-item reveal" data-line="$($p.line)">
  <article class="product-card" style="--accent: $($p.accent);">
    <a class="product-card-media" href="$page" tabindex="-1" aria-hidden="true">
      <img src="$RootPrefix$($p.image)" alt="$name" width="679" height="702" loading="lazy">
    </a>
    <div class="product-card-body">
      <span class="product-card-line"><span class="dot" aria-hidden="true"></span>$(ConvertTo-HtmlText $line.label)</span>
      <h3><a href="$page">$(ConvertTo-HtmlText $p.cardName)</a></h3>
      <p class="product-card-meta">$(ConvertTo-HtmlText $meta)</p>
      <div class="product-card-actions">
        <a class="btn-outline-brand btn-sm-brand" href="$page" aria-label="Detaljnije: $name">Detaljnije</a>
        <a class="btn-brand btn-sm-brand" href="$shop" target="_blank" rel="noopener" aria-label="Naruči: $name (otvara focusimcshop.rs)" data-track="naruci" data-product-name="$name" data-product-line="$($p.line)">Naruči</a>
      </div>
    </div>
  </article>
</div>
"@
}

# Kartica linije proizvoda (početna)
function New-LineCard($line, [int]$Index) {
  $items = @($products | Where-Object { $_.line -eq $line.id })
  $flavors = ($items | ForEach-Object {
    $label = if ($line.id -eq 'kapsule') { $_.cardName } else { $_.flavor -replace '^ukus ', '' }
    "      <li><a href=`"proizvodi/$($_.slug).html`" style=`"--accent: $($_.accent);`"><span class=`"dot`" aria-hidden=`"true`"></span>$(ConvertTo-HtmlText $label)</a></li>"
  }) -join "`n"
  # InvariantCulture: CSS traži decimalnu tačku (srpski format bi dao zarez)
  $delay = ($Index * 0.25).ToString('0.0#', [Globalization.CultureInfo]::InvariantCulture) + 's'
  return @"
<div class="col-md-6 col-lg-4">
  <article class="line-card reveal" style="--reveal-delay: $delay;">
    <div class="line-card-media">
      <img src="$($line.image)" alt="Möller's $(ConvertTo-HtmlText $line.label)" width="679" height="702" loading="lazy">
      <span class="line-card-count">$($items.Count) $(if ($items.Count -eq 1) { 'proizvod' } else { 'proizvoda' })</span>
    </div>
    <h3>$(ConvertTo-HtmlText $line.label)</h3>
    <p>$(ConvertTo-HtmlText $line.intro)</p>
    <ul class="line-card-flavors" aria-label="Proizvodi u liniji">
$flavors
    </ul>
    <a class="link-arrow stretched-link" href="proizvodi.html#$($line.id)">Pogledaj liniju $arrowIcon</a>
  </article>
</div>
"@
}

# Tabela nutritivnih vrednosti
function New-NutritionHtml($p) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($table in @($p.nutrition)) {
    [void]$sb.Append('<div class="table-scroll"><table class="nutrition-table"><thead><tr>')
    foreach ($h in @($table.head)) { [void]$sb.Append('<th scope="col">' + (Format-Text $h) + '</th>') }
    [void]$sb.Append('</tr></thead><tbody>')
    foreach ($row in @($table.rows)) {
      [void]$sb.Append('<tr>')
      $i = 0
      foreach ($cell in @($row)) {
        $tag = if ($i -eq 0) { 'th scope="row"' } else { 'td' }
        $close = if ($i -eq 0) { 'th' } else { 'td' }
        [void]$sb.Append("<$tag>" + (Format-Text $cell) + "</$close>")
        $i++
      }
      [void]$sb.Append('</tr>')
    }
    [void]$sb.Append('</tbody></table></div>')
  }
  [void]$sb.Append('<p class="nutrition-note">' + (Format-Text $p.nutritionNote) + '</p>')
  return $sb.ToString()
}

function New-ParagraphsHtml($items) { return (@($items) | ForEach-Object { '<p>' + (Format-Text $_) + '</p>' }) -join '' }

# --- 1. STRANICE PROIZVODA -----------------------------------------------------
$template = Read-Text (Join-Path $Root 'proizvodi\_sablon.html')
$generated = @()

foreach ($p in $products) {
  $line = $lines[$p.line]
  $canonical = "$SiteUrl/proizvodi/$($p.slug).html"
  $plainName = $p.name

  # Meta title i description (može se pregaziti poljem metaTitle / metaDescription u JSON-u)
  $metaTitle = if ($p.metaTitle) { $p.metaTitle }
               elseif ($p.line -eq 'kapsule') { "$($p.name), $($p.package)" }
               else { "$($p.cardName), $($p.flavor) | Möller's" }
  $metaDesc = if ($p.metaDescription) { $p.metaDescription } else { "$($p.shortDescription) Sastav, način upotrebe i poručivanje." }
  if ($metaDesc.Length -gt 155) { $metaDesc = $p.shortDescription }

  # Schema.org: Product + BreadcrumbList (bez cena i ocena)
  $schema = [ordered]@{
    '@context' = 'https://schema.org'
    '@graph'   = @(
      [ordered]@{
        '@type'       = 'Product'
        'name'        = $plainName
        'description' = Get-PlainText $p.description
        'image'       = "$SiteUrl/$($p.image)"
        'brand'       = [ordered]@{ '@type' = 'Brand'; 'name' = "Möller's" }
        'manufacturer'= [ordered]@{ '@type' = 'Organization'; 'name' = 'Orkla Health AS' }
        'category'    = $line.label
        'url'         = $p.shopUrl
      },
      [ordered]@{
        '@type' = 'BreadcrumbList'
        'itemListElement' = @(
          [ordered]@{ '@type' = 'ListItem'; 'position' = 1; 'name' = 'Početna'; 'item' = "$SiteUrl/" },
          [ordered]@{ '@type' = 'ListItem'; 'position' = 2; 'name' = 'Proizvodi'; 'item' = "$SiteUrl/proizvodi.html" },
          [ordered]@{ '@type' = 'ListItem'; 'position' = 3; 'name' = $plainName; 'item' = $canonical }
        )
      }
    )
  }
  $jsonLd = ($schema | ConvertTo-Json -Depth 8)

  $usage = '<ul class="usage-list">' + ((@($p.usage) | ForEach-Object { '<li>' + (Format-Text $_) + '</li>' }) -join '') + '</ul>'

  $tokens = [ordered]@{
    '{{META_TITLE}}'        = ConvertTo-HtmlText $metaTitle
    '{{META_DESCRIPTION}}'  = ConvertTo-HtmlText $metaDesc
    '{{CANONICAL}}'         = $canonical
    '{{OG_IMAGE}}'          = "$SiteUrl/$($p.image)"
    '{{JSONLD}}'            = $jsonLd
    '{{ACCENT}}'            = $p.accent
    '{{LINE_ID}}'           = $p.line
    '{{LINE_LABEL}}'        = ConvertTo-HtmlText $line.label
    '{{NAME}}'              = ConvertTo-HtmlText $p.name
    '{{PACKAGE}}'           = ConvertTo-HtmlText $p.package
    '{{FLAVOR}}'            = ConvertTo-HtmlText $p.flavor
    '{{SHORT_DESCRIPTION}}' = Format-Text $p.shortDescription
    '{{DESCRIPTION}}'       = Format-Text $p.description
    '{{HEALTH_INFO}}'       = New-ParagraphsHtml $p.healthInfo
    '{{INGREDIENTS}}'       = New-ParagraphsHtml $p.ingredients
    '{{NUTRITION}}'         = New-NutritionHtml $p
    '{{USAGE}}'             = $usage
    '{{WARNINGS}}'          = Format-Text $p.warnings
    '{{IMAGE}}'             = $p.image
    '{{IMAGE_ALT}}'         = ConvertTo-HtmlText "$($p.name), pakovanje $($p.package)"
    '{{SHOP_URL}}'          = Get-ShopLink $p.shopUrl $p.slug
  }

  # Ukloni komentar sa uputstvom sa vrha šablona
  $html = [regex]::Replace($template, '(?s)<!--\s*\r?\n\s*ŠABLON STRANICE PROIZVODA.*?-->\r?\n', '')
  $html = "<!-- GENERISANO iz proizvodi/_sablon.html i data/products.json. Ne menjati ručno - pokreni tools/build.ps1. -->`n" + $html
  foreach ($k in $tokens.Keys) { $html = $html.Replace($k, [string]$tokens[$k]) }
  $html = $html.Replace('{{ROOT}}', '../')

  # Povezani proizvodi iz iste linije
  $related = @($products | Where-Object { $_.line -eq $p.line -and $_.slug -ne $p.slug })
  $relatedHtml = ($related | ForEach-Object { New-ProductCard $_ '../' 'col-sm-6 col-lg-4' }) -join "`n"
  $html = Set-Block $html 'related-products' $relatedHtml

  $out = Join-Path $Root "proizvodi\$($p.slug).html"
  Write-Text $out $html
  $generated += "proizvodi\$($p.slug).html"
}
Write-Host "Stranice proizvoda: $($generated.Count)" -ForegroundColor Green

# --- 2 + 3. GENERISANI BLOKOVI I PARTIAL-I U SVIM STRANICAMA -------------------
$partialHtml = @{}
foreach ($name in $Partials) { $partialHtml[$name] = Read-Text (Join-Path $Root "partials\$name.html") }

$pages = Get-ChildItem -Path $Root -Filter *.html -Recurse |
  Where-Object { $_.FullName -notmatch '\\(partials|brand|tools|content|assets)\\' -and $_.Name -notlike '_*' }

foreach ($file in $pages) {
  $relative = $file.FullName.Substring($Root.Length + 1)
  $depth = ($relative.ToCharArray() | Where-Object { $_ -eq '\' }).Count
  $prefix = '../' * $depth
  # 404 se na serveru prikazuje na bilo kojoj adresi, pa koristi apsolutne putanje
  if ($relative -eq '404.html') { $prefix = '/' }

  $html = Read-Text $file.FullName
  $original = $html

  if ($html.Contains('<!-- START: products-grid -->')) {
    $grid = ($products | ForEach-Object { New-ProductCard $_ $prefix 'col-sm-6 col-lg-4 col-xl-3' }) -join "`n"
    $html = Set-Block $html 'products-grid' $grid
  }
  # Proizvodi jedne linije: <!-- START: products-ulje --> (ili products-jelly-fish, products-kapsule)
  foreach ($l in $data.lines) {
    $blockName = "products-$($l.id)"
    if ($html.Contains("<!-- START: $blockName -->")) {
      $lineCards = ($products | Where-Object { $_.line -eq $l.id } | ForEach-Object { New-ProductCard $_ $prefix 'col-sm-6 col-lg-4' }) -join "`n"
      $html = Set-Block $html $blockName $lineCards
    }
  }
  if ($html.Contains('<!-- START: product-lines -->')) {
    $cardList = @()
    for ($i = 0; $i -lt @($data.lines).Count; $i++) { $cardList += New-LineCard $data.lines[$i] $i }
    $cards = $cardList -join "`n"
    $html = Set-Block $html 'product-lines' $cards
  }
  if ($html.Contains('<!-- START: filter-buttons -->')) {
    $btns = @('<button type="button" class="filter-btn" data-filter="sve" aria-pressed="true">Svi proizvodi</button>')
    foreach ($l in $data.lines) { $btns += "<button type=`"button`" class=`"filter-btn`" data-filter=`"$($l.id)`" aria-pressed=`"false`">$(ConvertTo-HtmlText $l.filterLabel)</button>" }
    $html = Set-Block $html 'filter-buttons' ($btns -join "`n")
  }

  # Opšti "Naruči" linkovi u stranici: <a href="" data-shop="pozicija"> dobijaju UTM link ka Möller's kategoriji
  $shopEvaluator = [System.Text.RegularExpressions.MatchEvaluator] { param($m) 'href="' + (Get-ShopLink $ShopCategoryUrl $m.Groups[1].Value) + '"' }
  $html = [regex]::Replace($html, 'href="[^"]*"(?=[^>]*\bdata-shop="([a-z0-9-]+)")', $shopEvaluator)

  foreach ($name in $Partials) {
    if ($html.Contains("<!-- START: $name -->")) {
      $html = Set-Block $html $name (Resolve-Tokens $partialHtml[$name] $prefix)
    }
  }

  if ($html -ne $original) { Write-Text $file.FullName $html; Write-Host "  azurirano: $relative" }
}

# --- SITEMAP ---------------------------------------------------------------------
# Sve stranice osim 404, šablona i stranica sa <meta name="robots" content="noindex...">
$urls = @()
foreach ($file in ($pages | Sort-Object FullName)) {
  $relative = $file.FullName.Substring($Root.Length + 1)
  if ($relative -eq '404.html') { continue }
  $pageHtml = Read-Text $file.FullName
  if ($pageHtml -match '<meta name="robots" content="noindex') { continue }
  # Stranice čiji canonical vodi na drugi sajt (blog -> focusimcshop.rs) ne idu u sitemap
  if ($pageHtml -match '<link rel="canonical" href="([^"]+)"' -and -not $Matches[1].StartsWith($SiteUrl)) { continue }
  $path = $relative.Replace('\', '/')
  $loc = if ($path -eq 'index.html') { "$SiteUrl/" } else { "$SiteUrl/$path" }
  $priority = if ($path -eq 'index.html') { '1.0' } elseif ($path -like 'proizvodi*') { '0.8' } else { '0.6' }
  $urls += "  <url><loc>$loc</loc><lastmod>$($file.LastWriteTime.ToString('yyyy-MM-dd'))</lastmod><priority>$priority</priority></url>"
}
$sitemap = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n<!-- GENERISANO skriptom tools/build.ps1 - ne menjati ručno -->`n<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`">`n" + ($urls -join "`n") + "`n</urlset>`n"
Write-Text (Join-Path $Root 'sitemap.xml') $sitemap
Write-Host "sitemap.xml: $($urls.Count) adresa"

# --- 4. PROVERE ------------------------------------------------------------------
$problems = 0
foreach ($file in (Get-ChildItem -Path $Root -Filter *.html -Recurse | Where-Object { $_.FullName -notmatch '\\(partials|brand|tools|assets)\\' })) {
  $html = Read-Text $file.FullName
  $rel = $file.FullName.Substring($Root.Length + 1)
  # Duge crte (— i –) nisu dozvoljene u tekstu
  if ($html -match "[–—]") { Write-Host "  UPOZORENJE: duga crta u $rel" -ForegroundColor Yellow; $problems++ }
  # Svaki link za kupovinu (proizvod ili prodavnica na focusimcshop.rs) mora imati UTM.
  # Canonical i linkovi ka originalnim blog člancima se ne proveravaju.
  foreach ($m in [regex]::Matches($html, '<a [^>]*href="(https://focusimcshop\.rs/(?:proizvod|mollers/prodavnica)[^"]*)"')) {
    if ($m.Groups[1].Value -notmatch 'utm_source=mollers\.co\.rs') { Write-Host "  UPOZORENJE: shop link bez UTM u $rel -> $($m.Groups[1].Value)" -ForegroundColor Yellow; $problems++ }
  }
  # Zaostale oznake iz šablona
  if ($file.Name -notlike '_*' -and $html -match '\{\{[A-Z_:a-z-]+\}\}') { Write-Host "  UPOZORENJE: nepopunjena oznaka u $rel" -ForegroundColor Yellow; $problems++ }
}

if ($problems -eq 0) { Write-Host "Gotovo. Provere prosle bez upozorenja." -ForegroundColor Green }
else { Write-Host "Gotovo, ali ima $problems upozorenja (vidi iznad)." -ForegroundColor Yellow }
