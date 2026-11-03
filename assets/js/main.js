/* ==========================================================================
   Möller's Srbija - main.js
   Sav sadržaj (proizvodi, linkovi, UTM) se pravi unapred skriptom
   tools/build.ps1, pa ovaj fajl radi samo ponašanje stranice:
   1. Header (senka pri skrolu) i mobilni meni
   2. Aktivna stavka menija
   3. Animacije pri skrolu (reveal) i blagi parallax
   4. Filter proizvoda (proizvodi.html)
   5. Lepljivo dugme "Naruči" na mobilnom (stranica proizvoda)
   6. Merenje klikova (dataLayer)
   7. Cookie saglasnost (Consent Mode v2)
   8. Hero: naslov reč po reč + nalet vetra i magle pri učitavanju
   9. Uvodna animacija (uklanjanje posle 1 s)
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.dataLayer = window.dataLayer || [];

  /* 1. HEADER I MOBILNI MENI ---------------------------------------------- */
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('main-nav');
  var navToggle = document.querySelector('.nav-toggle');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    navToggle.querySelector('.icon-open').hidden = open;
    navToggle.querySelector('.icon-close').hidden = !open;
    if (open && header) header.classList.add('is-scrolled');
    else onScroll();
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); navToggle.focus(); }
    });
  }

  /* 2. AKTIVNA STAVKA MENIJA ---------------------------------------------
     Svaka stranica ima <body data-nav="proizvodi"> (ili omega-3, vitamini...).
     Link u meniju sa istim data-nav dobija aria-current="page". */
  var current = document.body.getAttribute('data-nav');
  if (current) {
    document.querySelectorAll('.main-nav a[data-nav="' + current + '"]').forEach(function (a) {
      a.setAttribute('aria-current', 'page');
    });
  }

  /* 3. REVEAL I PARALLAX --------------------------------------------------- */
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(function (el) { io.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Blagi parallax: elementi sa data-parallax="0.08" se pomeraju sporije od skrola
  var parallaxItems = document.querySelectorAll('[data-parallax]');
  if (parallaxItems.length && !reduceMotion) {
    var ticking = false;
    var updateParallax = function () {
      var vh = window.innerHeight;
      parallaxItems.forEach(function (el) {
        var rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.08;
        var offset = (rect.top + rect.height / 2 - vh / 2) * speed;
        // scale(1.08) daje 4% rezerve sa svake strane - ne pomeramo više od toga
        var limit = rect.height * 0.035;
        offset = Math.max(-limit, Math.min(limit, offset));
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.08)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* 4. FILTER PROIZVODA ----------------------------------------------------
     Dugmad: <button class="filter-btn" data-filter="ulje">
     Kartice: <div class="product-grid-item" data-line="ulje">
     Radi i link sa početne: proizvodi.html#jelly-fish */
  var filterButtons = document.querySelectorAll('.filter-btn');
  if (filterButtons.length) {
    var applyFilter = function (line) {
      filterButtons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-filter') === line));
      });
      document.querySelectorAll('.product-grid-item').forEach(function (item) {
        item.classList.toggle('is-hidden', line !== 'sve' && item.getAttribute('data-line') !== line);
      });
    };
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var line = btn.getAttribute('data-filter');
        applyFilter(line);
        if (history.replaceState) history.replaceState(null, '', line === 'sve' ? location.pathname : '#' + line);
      });
    });
    var hash = location.hash.replace('#', '');
    var valid = Array.prototype.some.call(filterButtons, function (b) { return b.getAttribute('data-filter') === hash; });
    applyFilter(valid ? hash : 'sve');
  }

  /* 5. LEPLJIVO DUGME "NARUČI" (MOBILNI) ---------------------------------- */
  var stickyOrder = document.querySelector('.sticky-order');
  var mainOrder = document.querySelector('.order-box');
  if (stickyOrder && mainOrder && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var box = entries[0];
      // Prikaži kad je glavno dugme iznad ekrana (korisnik je skrolovao ispod njega)
      stickyOrder.classList.toggle('is-visible', !box.isIntersecting && box.boundingClientRect.top < 0);
    }).observe(mainOrder);
  }

  /* 6. MERENJE KLIKOVA (dataLayer) -----------------------------------------
     Linkovi imaju data-track atribut:
     - data-track="naruci"  + data-product-name + data-product-line  -> event: naruci_klik
     - data-track="social"  + data-network                           -> event: social_klik
     - data-track="kontakt" + data-contact-type (telefon / email)     -> event: kontakt_klik */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-track]');
    if (!link) return;
    var type = link.getAttribute('data-track');
    var url = link.href || '';
    if (type === 'naruci') {
      window.dataLayer.push({
        event: 'naruci_klik',
        product_name: link.getAttribute('data-product-name') || 'opste',
        product_line: link.getAttribute('data-product-line') || 'sve',
        link_url: url
      });
    } else if (type === 'social') {
      window.dataLayer.push({ event: 'social_klik', network: link.getAttribute('data-network'), link_url: url });
    } else if (type === 'kontakt') {
      window.dataLayer.push({ event: 'kontakt_klik', contact_type: link.getAttribute('data-contact-type'), link_url: url });
    }
  });

  /* 7. COOKIE SAGLASNOST ---------------------------------------------------
     Podrazumevano je sve osim neophodnog odbijeno (vidi partials/gtm-head.html).
     Izbor se čuva u localStorage pod ključem "mollers_consent". */
  var CONSENT_KEY = 'mollers_consent';
  var banner = document.getElementById('cookie-banner');

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (err) { return null; }
  }

  function applyConsent(c) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: c.statistics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
    window.dataLayer.push({ event: 'consent_update', consent_statistics: c.statistics, consent_marketing: c.marketing });
  }

  function saveConsent(statistics, marketing) {
    var c = { necessary: true, statistics: !!statistics, marketing: !!marketing, date: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (err) { /* privatni režim - nastavljamo bez čuvanja */ }
    applyConsent(c);
    if (banner) banner.hidden = true;
  }

  if (banner) {
    var stored = readConsent();
    if (stored) applyConsent(stored);
    else banner.hidden = false;

    var options = banner.querySelector('.cookie-options');
    var statsBox = banner.querySelector('#consent-statistics');
    var marketingBox = banner.querySelector('#consent-marketing');

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var action = btn.getAttribute('data-consent');
      if (action === 'all') saveConsent(true, true);
      else if (action === 'necessary') saveConsent(false, false);
      else if (action === 'settings') {
        options.hidden = !options.hidden;
        btn.setAttribute('aria-expanded', String(!options.hidden));
      } else if (action === 'save') saveConsent(statsBox.checked, marketingBox.checked);
    });

    // Link "Podešavanja kolačića" u footeru ponovo otvara baner
    document.querySelectorAll('[data-open-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function () {
        var c = readConsent();
        if (c) { statsBox.checked = c.statistics; marketingBox.checked = c.marketing; }
        options.hidden = false;
        banner.hidden = false;
        banner.querySelector('h2').focus();
      });
    });
  }

  /* 8a. NASLOV REČ PO REČ --------------------------------------------------
     <h1 data-split-words data-split-delay="0.45"> - svaka reč se otkriva
     odozdo, iz zamućenja. Elementi unutar naslova (npr. <span class="text-nowrap">)
     ostaju celi i animiraju se kao jedna reč. */
  if (!reduceMotion) {
    document.querySelectorAll('[data-split-words]').forEach(function (el) {
      var base = parseFloat(el.getAttribute('data-split-delay')) || 0;
      var step = 0.09;
      var index = 0;
      var wrap = function (inner) {
        var outer = document.createElement('span');
        outer.className = 'split-word';
        inner.classList.add('split-inner');
        inner.style.setProperty('--word-delay', (base + index * step).toFixed(2) + 's');
        index++;
        outer.appendChild(inner);
        return outer;
      };
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var span = document.createElement('span');
            span.textContent = part;
            frag.appendChild(wrap(span));
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          var placeholder = document.createTextNode('');
          el.replaceChild(placeholder, node);
          el.replaceChild(wrap(node), placeholder);
        }
      });
    });
  }

  /* 8b. NALET VETRA I MAGLE ------------------------------------------------
     <canvas class="hero-wind" data-bottles='[...]'> u hero sekciji.
     Jednom pri učitavanju magla u bojama polarne svetlosti prođe sleva
     nadesno, iza boca (obrisi iz data-bottles) i delom ispred njih,
     a zatim nestane. Traje oko 5 sekundi. */
  var wind = document.querySelector('.hero-wind');
  if (wind && wind.getContext && !reduceMotion) {
    var wctx = wind.getContext('2d');
    var wImg = wind.parentElement.querySelector('.hero-media img');
    var bottles = JSON.parse(wind.getAttribute('data-bottles') || '[]');
    var srcW = +wind.getAttribute('data-image-width') || 1920;
    var srcH = +wind.getAttribute('data-image-height') || 767;
    var wdpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, m = { s: 1, ox: 0, oy: 0 };
    var DURATION = 4.6;   // trajanje naleta u sekundama
    var DENSITY = 0.33;   // gustina magle (0-1); veće = gušća magla

    // Teksture magle: meki "oblaci" od mnogo prozirnih krugova, u bojama sa pozadine
    var makeSprite = function (rgb, seed) {
      var c = document.createElement('canvas');
      c.width = c.height = 256;
      var g = c.getContext('2d');
      var rand = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (var i = 0; i < 26; i++) {
        var x = 60 + rand() * 136, y = 70 + rand() * 116, r = 30 + rand() * 70;
        var grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(' + rgb + ',' + (0.07 + rand() * 0.07) + ')');
        grad.addColorStop(1, 'rgba(' + rgb + ',0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 256);
      }
      return c;
    };
    var sprites = [
      makeSprite('225, 246, 238', 11),  // bela magla
      makeSprite('190, 236, 214', 37),  // mint
      makeSprite('140, 214, 160', 73),  // aurora zelena
      makeSprite('235, 250, 245', 101)
    ];

    var puffs = [], streaks = [];
    var build = function () {
      puffs = []; streaks = [];
      var count = W < 768 ? 26 : 46;
      for (var i = 0; i < count; i++) {
        var size = (0.22 + Math.random() * 0.35) * Math.max(W, 700);
        puffs.push({
          sprite: sprites[i % sprites.length],
          size: size,
          x: -size * 0.8 - Math.random() * W * 0.9,      // kreće van ekrana, levo
          y: H * (0.15 + Math.random() * 0.8),
          vx: W * (0.42 + Math.random() * 0.28),          // brzina vetra (px/s)
          wobble: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.25,
          alpha: 0.35 + Math.random() * 0.45,
          front: Math.random() < 0.3                      // 30% magle prolazi ispred boca
        });
      }
      for (var k = 0; k < (W < 768 ? 8 : 16); k++) {
        streaks.push({
          x: -Math.random() * W, y: H * (0.1 + Math.random() * 0.85),
          len: W * (0.12 + Math.random() * 0.25), vx: W * (0.75 + Math.random() * 0.4),
          alpha: 0.12 + Math.random() * 0.18, wobble: Math.random() * 6
        });
      }
    };

    var resizeWind = function () {
      W = wind.clientWidth; H = wind.clientHeight;
      wind.width = Math.round(W * wdpr); wind.height = Math.round(H * wdpr);
      var s = Math.max(W / srcW, H / srcH);
      var pos = getComputedStyle(wImg).objectPosition.split(' ');
      m = { s: s, ox: (W - srcW * s) * (parseFloat(pos[0]) / 100), oy: (H - srcH * s) * (parseFloat(pos[1] || '50%') / 100) };
    };

    // Putanja svih boca (za "rupu" u magli). Prati i CSS zoom slike pri ulazu (hero-clear).
    var bottlePath = function () {
      var tr = getComputedStyle(wImg).transform;
      var k = tr && tr !== 'none' ? parseFloat(tr.split('(')[1]) || 1 : 1;
      bottles.forEach(function (poly) {
        poly.forEach(function (p, i) {
          var x = W / 2 + (m.ox + p[0] * m.s - W / 2) * k;
          var y = H / 2 + (m.oy + p[1] * m.s - H / 2) * k;
          if (i === 0) wctx.moveTo(x, y); else wctx.lineTo(x, y);
        });
        wctx.closePath();
      });
    };

    var drawPuff = function (p, t, env, alphaScale) {
      var y = p.y + Math.sin(t * 1.3 + p.wobble) * p.size * 0.06;
      var w = p.size * 1.9, h = p.size;   // razvučeno u pravcu vetra
      // Preko kolone sa tekstom (leva polovina na desktopu) magla je ređa, da se tekst čita
      var textZone = W >= 992 && p.x < W * 0.5 ? 0.45 : 1;
      wctx.save();
      wctx.globalAlpha = p.alpha * env * alphaScale * textZone * DENSITY;
      wctx.translate(p.x, y);
      wctx.rotate(p.spin * t);
      wctx.drawImage(p.sprite, -w / 2, -h / 2, w, h);
      wctx.restore();
    };

    var t0 = 0, last = 0;
    var tick = function (now) {
      if (!t0) { t0 = now; last = now; }
      var t = (now - t0) / 1000;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // ulaz 0,5 s, izlaz poslednjih 1,4 s
      var fadeFrom = DURATION - 1.4;
      var env = Math.min(1, t / 0.5) * (t > fadeFrom ? Math.max(0, 1 - (t - fadeFrom) / 1.4) : 1);

      wctx.setTransform(wdpr, 0, 0, wdpr, 0, 0);
      wctx.clearRect(0, 0, W, H);
      puffs.forEach(function (p) { p.x += p.vx * dt * (1 + 0.15 * Math.sin(t * 2 + p.wobble)); });
      streaks.forEach(function (s) { s.x += s.vx * dt; });

      // Sloj iza boca: sve van obrisa boca
      wctx.save();
      if (bottles.length) {
        wctx.beginPath();
        wctx.rect(0, 0, W, H);
        bottlePath();
        wctx.clip('evenodd');
      }
      wctx.globalCompositeOperation = 'screen';
      puffs.forEach(function (p) { if (!p.front) drawPuff(p, t, env, 1); });
      streaks.forEach(function (s) {
        var y = s.y + Math.sin(t * 3 + s.wobble) * 6;
        var g = wctx.createLinearGradient(s.x - s.len, y, s.x, y);
        g.addColorStop(0, 'rgba(230, 255, 245, 0)');
        g.addColorStop(0.7, 'rgba(230, 255, 245,' + (s.alpha * env) + ')');
        g.addColorStop(1, 'rgba(230, 255, 245, 0)');
        wctx.strokeStyle = g;
        wctx.lineWidth = 1.2;
        wctx.beginPath();
        wctx.moveTo(s.x - s.len, y);
        wctx.quadraticCurveTo(s.x - s.len / 2, y - 10, s.x, y);
        wctx.stroke();
      });
      wctx.restore();

      // Sloj ispred boca: ređa, prozirnija magla koja ih "obavija"
      wctx.save();
      wctx.globalCompositeOperation = 'screen';
      puffs.forEach(function (p) { if (p.front) drawPuff(p, t, env, 0.45); });
      wctx.restore();

      if (t < DURATION) window.requestAnimationFrame(tick);
      else { wind.classList.add('is-done'); wctx.clearRect(0, 0, W, H); }
    };

    var startWind = function () {
      resizeWind();
      build();
      window.requestAnimationFrame(tick);
    };
    // Ako ide uvodna animacija, magla kreće tek kad se zavesa skloni
    var introDelay = document.documentElement.classList.contains('has-intro') ? 850 : 0;
    var startLater = function () { window.setTimeout(startWind, introDelay); };
    if (wImg && !wImg.complete) wImg.addEventListener('load', startLater); else startLater();
  }

  /* 9. UVODNA ANIMACIJA ----------------------------------------------------
     Animaciju radi CSS (deo 15 u style.css); ovde se samo uklanja iz stranice kad završi. */
  // Klik na link unutar sajta: sledeća stranica preskače uvod (vidi partials/head-assets.html)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/i.test(href)) return;
    try { sessionStorage.setItem('mollers_nav', '1'); } catch (err) {}
  });

  var intro = document.querySelector('.intro');
  if (intro) {
    if (document.documentElement.classList.contains('has-intro')) {
      window.setTimeout(function () { intro.remove(); }, 1200);
    } else {
      intro.remove();
    }
  }

  /* 10. VIDEO KOJI SE PUŠTA JEDNOM -----------------------------------------
     <video data-play-once data-src="..."> se učitava tek kad je bar pola videa na ekranu,
     pusti se jednom i ostane na poslednjem kadru. Na telefonu (ispod 768px) i uz
     "smanji animacije" video se ne učitava - vidi se samo poster (prvi kadar). */
  var onceVideos = document.querySelectorAll('video[data-play-once]');
  if (onceVideos.length && 'IntersectionObserver' in window && !reduceMotion &&
      window.matchMedia('(min-width: 768px)').matches) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var video = entry.target;
        videoObserver.unobserve(video);
        video.src = video.getAttribute('data-src');
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      });
    }, { threshold: 0.5 });
    onceVideos.forEach(function (video) { videoObserver.observe(video); });
  }
})();
