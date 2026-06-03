/* ============================================================
   E&D Herbs — interacciones
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tweaks (host-persisted) ---------- */
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "tickerSpeed": 42,
    "motion": 50
  }/*EDITMODE-END*/;

  function applyTweaks() {
    document.documentElement.style.setProperty('--mo', (TWEAKS.motion / 100 * 1.2).toFixed(3));
    ticker.base = TWEAKS.tickerSpeed;
  }

  /* ---------- Rewrite external-svg masks -> data-uri vars ---------- */
  // External .svg files don't apply as CSS masks in this environment; icons.css
  // exposes each as a data-uri var. Swap any inline --m:url(...) to the var.
  $$('[style*="--m:url(assets/illus/"]').forEach(el => {
    const mt = el.getAttribute('style').match(/--m:url\(assets\/illus\/([a-z]+)\.svg\)/);
    if (mt) el.style.setProperty('--m', `var(--svg-${mt[1]})`);
  });

  /* ============================================================
     NAV
     ============================================================ */
  const navWrap = $('#nav');
  const shell = $('#navShell');
  const drawer = $('#navDrawer');
  const scrim = $('#navScrim');
  const burger = $('#burger');
  const mobileMenuBack = $('#mobileMenuBack');
  let activeMenu = null;
  const isMobileNav = () => matchMedia('(max-width: 860px)').matches;

  function openMenu(name) {
    activeMenu = name;
    $$('.mega', drawer).forEach(m => m.classList.toggle('show', m.dataset.panel === name));
    $$('.nav-link[data-menu]').forEach(b => b.classList.toggle('active', b.dataset.menu === name));
    shell.classList.add('open');
    shell.classList.add('submenu-open');
    navWrap.classList.add('open');
  }
  function closeSubmenu() {
    activeMenu = null;
    shell.classList.remove('submenu-open');
    $$('.mega', drawer).forEach(m => m.classList.remove('show'));
    $$('.nav-link[data-menu]').forEach(b => b.classList.remove('active'));
  }
  function closeMenu() {
    closeSubmenu();
    shell.classList.remove('open');
    navWrap.classList.remove('open');
  }
  $$('.nav-link[data-menu]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (isMobileNav()) {
        openMenu(btn.dataset.menu);
        return;
      }
      const name = btn.dataset.menu;
      if (activeMenu === name && shell.classList.contains('open')) closeMenu();
      else openMenu(name);
    });
  });
  // mobile burger
  burger.addEventListener('click', e => {
    e.stopPropagation();
    if (shell.classList.contains('open')) closeMenu();
    else { shell.classList.add('open'); navWrap.classList.add('open'); }
  });
  if (mobileMenuBack) mobileMenuBack.addEventListener('click', e => {
    e.stopPropagation();
    closeSubmenu();
  });
  scrim.addEventListener('click', closeMenu);
  document.addEventListener('click', e => {
    if (shell.classList.contains('open') && !shell.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  // close drawer when following a link inside
  $$('.mega a, .nav-shell .nav-links a').forEach(a => a.addEventListener('click', () => setTimeout(closeMenu, 60)));

  // scrolled state
  const onScroll = () => {
    shell.classList.toggle('scrolled', scrollY > 24);
    // hero parallax
    if (heroPhoto && !reduce) {
      const y = Math.min(scrollY, innerHeight);
      heroPhoto.style.transform = `scale(1.06) translateY(${y * 0.18}px)`;
    }
  };
  const heroPhoto = $('#heroPhoto');
  addEventListener('scroll', onScroll, { passive: true });

  /* ============================================================
     REVEAL (appears tipo framer motion)
     ============================================================ */
  // split words for headline-style reveals
  $$('[data-rv-words]').forEach(el => {
    const html = el.innerHTML;
    // wrap text nodes' words while preserving inline tags
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok => {
            if (/^\s+$/.test(tok) || tok === '') { frag.appendChild(document.createTextNode(tok)); }
            else { const s = document.createElement('span'); s.className = 'rv-word'; s.textContent = tok; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(el);
  });

  const isCustomReveal = el => el.matches('[data-hero-rv], [data-rv-scroll], [data-after-scroll-text]');
  const autoRevealEls = $$('[data-rv]').filter(el => !isCustomReveal(el));
  const scrollRevealEls = $$('[data-rv-scroll]');
  const afterScrollTextEls = $$('[data-after-scroll-text]');
  let afterScrollTextRevealed = false;

  // stagger: per-parent index
  const groups = new Map();
  autoRevealEls.forEach(el => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, 0);
    const i = groups.get(p);
    el.style.setProperty('--rv-d', (i * 95) + 'ms');
    groups.set(p, i + 1);
  });

  if (reduce) {
    $$('[data-rv]').forEach(el => el.classList.add('is-in'));
    $$('.rv-word').forEach(el => el.classList.add('is-in'));
  } else {
    $$('[data-hero-rv]').forEach((el, i) => {
      el.style.setProperty('--rv-d', (i === 0 ? 120 : 360) + 'ms');
      requestAnimationFrame(() => el.classList.add('is-in'));
    });

    scrollRevealEls.forEach(el => {
      el.classList.add('is-in');
      $$('.rv-word', el).forEach(w => w.classList.remove('is-in'));
    });
    afterScrollTextEls.forEach((el, i) => el.style.setProperty('--rv-d', (i * 95) + 'ms'));

    const revealAfterScrollText = () => {
      if (afterScrollTextRevealed) return;
      afterScrollTextRevealed = true;
      afterScrollTextEls.forEach(el => el.classList.add('is-in'));
    };

    const updateScrollReveals = () => {
      const vh = innerHeight;
      scrollRevealEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const words = $$('.rv-word', el);
        const start = vh * 0.82;
        const end = vh * 0.28;
        const progress = Math.max(0, Math.min(1, (start - r.top) / (start - end)));
        const visibleWords = Math.round(progress * words.length);
        words.forEach((w, i) => {
          w.style.setProperty('--rv-d', '0ms');
          w.classList.toggle('is-in', i < visibleWords);
        });
        if (progress >= 1) revealAfterScrollText();
      });
    };

    // Position-based reveal driven by rAF — fires reliably with any scroll
    // method (incl. programmatic), unlike IntersectionObserver in some hosts.
    let pending = autoRevealEls;
    const reveal = el => {
      const words = $$('.rv-word', el);
      words.forEach((w, i) => { w.style.setProperty('--rv-d', (i * 28) + 'ms'); w.classList.add('is-in'); });
      el.classList.add('is-in');
    };
    const check = () => {
      const vh = innerHeight;
      pending = pending.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > vh * 0.02) { reveal(el); return false; }
        return true;
      });
      if (pending.length) requestAnimationFrame(check);
    };
    addEventListener('scroll', () => { updateScrollReveals(); if (pending.length) check(); }, { passive: true });
    addEventListener('resize', () => { updateScrollReveals(); if (pending.length) check(); });
    requestAnimationFrame(() => { updateScrollReveals(); check(); });
  }

  /* ============================================================
     TICKER de ilustraciones — ralentiza al hover, crece+color
     ============================================================ */
  const BOTANICALS = [
    { v: '--svg-moringa', c: '#F7CFFA' },
    { v: '--svg-hibiscus', c: '#FBB49C' },
    { v: '--svg-canela', c: '#64A990' },
    { v: '--svg-finca', c: '#F7EDEE' },
    { v: '--svg-suelo', c: '#BAD3FF' },
  ];
  const track = $('#tickerTrack');
  const tickEl = $('#ticker');
  const ticker = { base: 42, cur: 42, target: 42, x: 0, setW: 0, raf: 0, last: 0 };

  function buildTicker() {
    const set = [];
    for (let r = 0; r < 3; r++) {
      BOTANICALS.forEach(b => {
        const el = document.createElement('span');
        el.className = 'bot';
        el.style.setProperty('--m', `var(${b.v})`);
        el.style.setProperty('--bot-c', b.c);
        el.setAttribute('role', 'img');
        set.push(el);
      });
    }
    // two copies for seamless loop
    set.forEach(el => track.appendChild(el));
    set.forEach(el => track.appendChild(el.cloneNode(true)));
    requestAnimationFrame(() => { ticker.setW = track.scrollWidth / 2; });
  }
  buildTicker();

  // slow on hover (eased)
  tickEl.addEventListener('pointerenter', () => { ticker.target = ticker.base * 0.16; });
  tickEl.addEventListener('pointerleave', () => { ticker.target = ticker.base; });

  function tickFrame(t) {
    if (!ticker.last) ticker.last = t;
    const dt = Math.min((t - ticker.last) / 1000, 0.05);
    ticker.last = t;
    // ease current speed toward target
    ticker.cur += (ticker.target - ticker.cur) * Math.min(dt * 6, 1);
    ticker.x -= ticker.cur * dt;
    if (ticker.setW && ticker.x <= -ticker.setW) ticker.x += ticker.setW;
    track.style.transform = `translate3d(${ticker.x}px,0,0)`;
    ticker.raf = requestAnimationFrame(tickFrame);
  }
  if (!reduce) ticker.raf = requestAnimationFrame(tickFrame);

  /* ============================================================
     NEWSLETTER
     ============================================================ */
  const nl = $('#newsletter');
  if (nl) nl.addEventListener('submit', e => {
    e.preventDefault();
    const btn = nl.querySelector('button');
    btn.innerHTML = '¡GRACIAS! <span class="arrow"></span>';
    nl.querySelector('input').value = '';
    setTimeout(() => { btn.innerHTML = 'SUSCRÍBETE <span class="arrow"></span>'; }, 2600);
  });

  /* ============================================================
     TWEAKS PANEL (vanilla host protocol)
     ============================================================ */
  function buildTweaks() {
    const panel = document.createElement('div');
    panel.id = 'tw-panel';
    panel.innerHTML = `
      <div class="tw-head">
        <span class="tw-title">Tweaks</span>
        <button class="tw-close" id="twClose" aria-label="Cerrar">✕</button>
      </div>
      <div class="tw-row">
        <div class="tw-label"><span>Velocidad ticker</span><span id="twTickV">${TWEAKS.tickerSpeed}</span></div>
        <input type="range" id="twTick" min="8" max="120" step="2" value="${TWEAKS.tickerSpeed}">
      </div>
      <div class="tw-row">
        <div class="tw-label"><span>Intensidad animación</span><span id="twMotV">${TWEAKS.motion}</span></div>
        <input type="range" id="twMot" min="0" max="100" step="5" value="${TWEAKS.motion}">
      </div>`;
    document.body.appendChild(panel);

    const post = (edits) => { try { parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*'); } catch (e) {} };

    $('#twTick', panel).addEventListener('input', e => {
      TWEAKS.tickerSpeed = +e.target.value;
      $('#twTickV').textContent = e.target.value;
      ticker.base = TWEAKS.tickerSpeed; ticker.target = TWEAKS.tickerSpeed;
      post({ tickerSpeed: TWEAKS.tickerSpeed });
    });
    $('#twMot', panel).addEventListener('input', e => {
      TWEAKS.motion = +e.target.value;
      $('#twMotV').textContent = e.target.value;
      document.documentElement.style.setProperty('--mo', (TWEAKS.motion / 100 * 1.2).toFixed(3));
      post({ motion: TWEAKS.motion });
    });
    $('#twClose', panel).addEventListener('click', () => {
      panel.classList.remove('show');
      try { parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
    });

    addEventListener('message', e => {
      const ty = e.data && e.data.type;
      if (ty === '__activate_edit_mode') panel.classList.add('show');
      else if (ty === '__deactivate_edit_mode') panel.classList.remove('show');
    });
    try { parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }
  buildTweaks();

  applyTweaks();
  onScroll();
})();
