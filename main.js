// ============================================
// Anchor link smooth-scroll with nav offset
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ============================================
// Footer year
// ============================================
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================
// Theme toggle (light / dark), persisted
// ============================================
(() => {
  const btn  = document.getElementById('themeToggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const prefLight = matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefLight ? 'light' : 'dark');
  if (initial === 'light') root.setAttribute('data-theme', 'light');
  btn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (next === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    localStorage.setItem('theme', next);
  });
})();

// ============================================
// Code review panel (hero) — cycles through real-world
// vulnerability snippets. Looks like a static-analysis tool.
// ============================================
(() => {
  const panel = document.getElementById('codePanel');
  if (!panel) return;
  const $code   = document.getElementById('cpCode');
  const $file   = document.getElementById('cpFile');
  const $lang   = document.getElementById('cpLang');
  const $sev    = document.getElementById('cpSev');
  const $rule   = document.getElementById('cpRule');
  const $note   = document.getElementById('cpNote');
  const $find   = document.getElementById('cpFind');
  const $count  = document.getElementById('cpCounter');
  const $dots   = document.getElementById('cpDots');
  const $stage  = panel.querySelector('.cp-stage');
  const $callout = document.getElementById('cpCallout');

  const SAMPLES = [
    {
      file: 'consent.graphql', lang: 'graphql',
      code: [
        'mutation FlipConsent($userId: ID!) {',
        '  updateUserConsent(userId: $userId, marketing: false) {',
        '    user { id }',
        '  }',
        '}',
      ],
      flag: { line: 1, sev: 'critical', rule: 'AUTH-001', note: 'Mutation accepts no auth directive. Public schema, drive-by exfiltration possible.' },
      finding: 'Unauthenticated GraphQL consent mutation',
    },
    {
      file: 'users.ts', lang: 'ts',
      code: [
        'export async function findUser(req: Request) {',
        '  const { email } = req.query;',
        "  const sql = `SELECT * FROM users WHERE email = '${email}'`;",
        '  return db.query(sql);',
        '}',
      ],
      flag: { line: 3, sev: 'high', rule: 'INJECTION-002', note: 'User-supplied input concatenated into SQL. Use parameterised queries (db.query(sql, [email])).' },
      finding: 'SQL injection via unparameterised query',
    },
    {
      file: 'oauth.ts', lang: 'ts',
      code: [
        "app.get('/oauth/callback', (req, res) => {",
        "  const next = String(req.query.next ?? '/');",
        '  res.redirect(next);',
        '});',
      ],
      flag: { line: 3, sev: 'medium', rule: 'WEB-014', note: 'Open redirect. Validate "next" against an allowlist of internal paths before redirecting.' },
      finding: 'Open redirect on OAuth callback',
    },
    {
      file: 'server.ts', lang: 'ts',
      code: [
        'app.use(cors({',
        "  origin: '*',",
        '  credentials: true,',
        '}));',
      ],
      flag: { line: 2, sev: 'medium', rule: 'CORS-003', note: 'Wildcard origin paired with credentials. Browsers reject this combo, but it signals weak posture and breaks per-origin auth.' },
      finding: 'CORS misconfiguration weakens posture',
    },
    {
      file: 'Config.kt', lang: 'kotlin',
      code: [
        'object Config {',
        '  const val FIREBASE_KEY  = "AIzaSyBXg9...live-prod"',
        '  const val SEGMENT_WRITE = "9f3a2b8d4c1e..."',
        '}',
      ],
      flag: { line: 2, sev: 'high', rule: 'MOBILE-009', note: 'Production credentials shipped in the APK strings table. Move to a server-side broker, rotate keys, restrict by SHA-1.' },
      finding: 'Hardcoded provider secrets in mobile binary',
    },
    {
      file: 'agent.py', lang: 'python',
      code: [
        'def assistant(user_query: str):',
        '    response = llm.invoke([',
        '        system("You are a support assistant."),',
        '        human(user_query),',
        '    ])',
        '    return tools.run(response.tool_calls)',
      ],
      flag: { line: 6, sev: 'high', rule: 'LLM-001', note: 'Untrusted user input flows into tool execution. Add output-shape validation and guardrails on tool_calls before run().' },
      finding: 'Prompt injection reaches tool execution',
    },
  ];

  const escapeHtml = (s) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function paint(s) {
    $file.textContent = s.file;
    $lang.textContent = s.lang.toUpperCase();
    $code.innerHTML = s.code.map((line, i) => {
      const n = i + 1;
      const flagged = s.flag.line === n;
      const cls = `cp-row${flagged ? ' is-flag is-' + s.flag.sev : ''}`;
      return `<span class="${cls}"><span class="cp-gutter"><i>${n}</i></span><span class="cp-line">${escapeHtml(line)}</span></span>`;
    }).join('');
    $sev.textContent = s.flag.sev;
    $sev.dataset.sev = s.flag.sev;
    $rule.textContent = s.flag.rule;
    $note.textContent = s.flag.note;
    $find.textContent = s.finding;
    // align callout to flagged line
    const lineH = parseFloat(getComputedStyle($code).lineHeight) || 22;
    $callout.style.top = `${18 + (s.flag.line - 1) * lineH - 8}px`;
  }

  // dots
  SAMPLES.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = 'cp-dot';
    b.type = 'button';
    b.setAttribute('aria-label', `View snippet ${i + 1}`);
    b.dataset.i = i;
    b.addEventListener('click', () => { go(i); reset(); });
    $dots.appendChild(b);
  });

  let idx = 0;
  let timer = null;
  let paused = false;

  function setActiveDot(i) {
    [...$dots.children].forEach((d, k) => d.classList.toggle('is-active', k === i));
    $count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(SAMPLES.length).padStart(2, '0')}`;
  }

  function go(i) {
    idx = (i + SAMPLES.length) % SAMPLES.length;
    $stage.classList.add('is-out');
    $callout.classList.remove('is-show');
    setTimeout(() => {
      paint(SAMPLES[idx]);
      setActiveDot(idx);
      $stage.classList.remove('is-out');
      // delay callout slightly so the flagged line cascade reads first
      setTimeout(() => $callout.classList.add('is-show'), 320);
    }, 300);
  }

  function reset() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => { if (!paused) go(idx + 1); }, 6000);
  }

  // initial
  paint(SAMPLES[0]);
  setActiveDot(0);
  setTimeout(() => $callout.classList.add('is-show'), 600);
  reset();

  // pause on hover or focus
  ['mouseenter', 'focusin'].forEach(ev => panel.addEventListener(ev, () => { paused = true; }));
  ['mouseleave', 'focusout'].forEach(ev => panel.addEventListener(ev, () => { paused = false; }));

  // pause when off-screen
  const visIO = new IntersectionObserver(([entry]) => { paused = !entry.isIntersecting; }, { threshold: 0.2 });
  visIO.observe(panel);

  // subtle parallax tilt
  if (matchMedia('(hover: hover)').matches) {
    const hero = panel.closest('.hero');
    hero?.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      panel.style.transform = `perspective(1500px) rotateY(${(-x * 3.5).toFixed(2)}deg) rotateX(${(y * 2).toFixed(2)}deg) translateZ(0)`;
    });
    hero?.addEventListener('mouseleave', () => { panel.style.transform = ''; });
  }
})();


// ============================================
// Public CVEs (real, sourced from Wordfence Threat Intel)
// ============================================
const CVES = [
  { title: 'Forms by CaptainForm <= 2.5.3',         type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-43459', date: 'Oct 29, 2022' },
  { title: 'Auto Upload Images <= 3.3',             type: 'Authenticated (Admin+) Stored XSS',                       sev: 'medium', score: 5.5, cve: 'CVE-2022-42880', date: 'Oct 24, 2022' },
  { title: 'RD Station <= 5.1.3',                   type: 'CSRF to Plugin Log Deletion',                             sev: 'high',   score: 8.8, cve: 'CVE-2022-38139', date: 'Oct 18, 2022' },
  { title: 'OSM, OpenStreetMap <= 6.0',             type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-30544', date: 'Sep 30, 2022' },
  { title: 'Media Library Folders <= 7.1.1',        type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-41634', date: 'Sep 30, 2022' },
  { title: 'HREFLANG Tags Lite <= 2.0.0',           type: 'Missing Authorization to Data Reset',                     sev: 'medium', score: 5.3, cve: 'CVE-2022-36418', date: 'Sep 29, 2022' },
  { title: 'TH Advance Product Search <= 1.1.4',    type: 'Missing Authz to Plugin Settings Reset',                  sev: 'medium', score: 5.3, cve: 'CVE-2022-38057', date: 'Sep 27, 2022' },
  { title: 'TH Advance Product Search <= 1.1.4',    type: 'Missing Authz to Plugin Settings Change',                 sev: 'medium', score: 6.5, cve: 'CVE-2022-40218', date: 'Sep 27, 2022' },
  { title: 'OceanWP Sticky Header <= 1.0.8',        type: 'CSRF to Plugin Settings Update',                          sev: 'high',   score: 8.8, cve: 'CVE-2022-35730', date: 'Sep 27, 2022' },
  { title: 'Kraken.io Image Optimizer <= 2.6.5',    type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-38454', date: 'Sep 23, 2022' },
  { title: '3D Tag Cloud <= 3.8',                   type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-36417', date: 'Sep 22, 2022' },
  { title: 'RD Station <= 5.2.0',                   type: 'CSRF to Plugin Settings Update',                          sev: 'high',   score: 8.8, cve: 'CVE-2022-38139', date: 'Sep 11, 2022' },
  { title: 'Mega Addons for WPBakery <= 4.2.7',     type: 'CSRF to Settings Update',                                 sev: 'high',   score: 8.8, cve: 'CVE-2022-36798', date: 'Sep 02, 2022' },
  { title: 'CallRail Phone Call Tracking <= 0.4.9', type: 'CSRF to Stored XSS',                                      sev: 'medium', score: 6.1, cve: 'CVE-2022-36796', date: 'Sep 01, 2022' },
  { title: 'Captcha Code <= 2.7',                   type: 'CSRF to Plugin Settings Update',                          sev: 'high',   score: 8.8, cve: 'CVE-2022-37411', date: 'Sep 01, 2022' },
  { title: 'GetResponse <= 5.5.19',                 type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-35277', date: 'Sep 01, 2022' },
  { title: 'MP3 jPlayer <= 2.7.3',                  type: 'Cross-Site Request Forgery',                              sev: 'high',   score: 8.8, cve: 'CVE-2022-36373', date: 'Sep 01, 2022' },
  { title: 'Better Font Awesome <= 2.0.1',          type: 'CSRF to Plugin Settings Update',                          sev: 'high',   score: 8.8, cve: 'CVE-2022-37405', date: 'Aug 25, 2022' },
];

// ============================================
// Rotating CVE card
// ============================================
(() => {
  const card    = document.getElementById('cveCard');
  const deck    = document.getElementById('cveDeck');
  const prevBtn = document.getElementById('cvePrev');
  const nextBtn = document.getElementById('cveNext');
  if (!card) return;

  const $id      = document.getElementById('cId');
  const $sev     = document.getElementById('cSev');
  const $date    = document.getElementById('cDate');
  const $score   = document.getElementById('cScore');
  const $title   = document.getElementById('cTitle');
  const $type    = document.getElementById('cType');
  const $count   = document.getElementById('cCounter');
  const $link    = document.getElementById('cLink');
  const $bar     = document.querySelector('#cProgress > div');

  const TICK_MS = 5000;
  let idx = 0;
  let timer = null;
  let progressStart = 0;
  let rafId = null;
  let paused = false;

  const pad = (n) => String(n).padStart(2, '0');

  // Hacker-style scramble effect on the CVE id (preserves "CVE-YYYY-" prefix)
  const SCRAMBLE_CHARS = '0123456789ABCDEF';
  let scrambleRaf = 0;
  function scrambleTo(el, finalText, duration = 520) {
    cancelAnimationFrame(scrambleRaf);
    const lastDash = finalText.lastIndexOf('-');
    const fixed = lastDash >= 0 ? finalText.slice(0, lastDash + 1) : '';
    const tail  = finalText.slice(fixed.length);
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const settled = Math.floor(p * tail.length);
      let out = '';
      for (let k = 0; k < tail.length; k++) {
        out += k < settled ? tail[k] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = fixed + out;
      if (p < 1) scrambleRaf = requestAnimationFrame(tick);
      else el.textContent = finalText;
    };
    scrambleRaf = requestAnimationFrame(tick);
  }

  // CVSS score count-up
  let scoreRaf = 0;
  function countUp(el, target, duration = 700) {
    cancelAnimationFrame(scoreRaf);
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(1);
      if (p < 1) scoreRaf = requestAnimationFrame(tick);
      else el.textContent = target.toFixed(1);
    };
    scoreRaf = requestAnimationFrame(tick);
  }

  function paint(i, animated = true) {
    const c = CVES[i];
    $sev.textContent    = c.sev;
    $sev.dataset.sev    = c.sev;
    $date.textContent   = c.date;
    $score.dataset.sev  = c.sev;
    $title.textContent  = c.title;
    $type.textContent   = c.type;
    $count.textContent  = `${pad(i + 1)} / ${pad(CVES.length)}`;
    $link.href          = `https://www.cve.org/CVERecord?id=${c.cve}`;

    if (animated) {
      scrambleTo($id, c.cve);
      countUp($score, c.score);
    } else {
      $id.textContent = c.cve;
      $score.textContent = c.score.toFixed(1);
    }
  }

  function transitionTo(newIdx, dir) {
    const outCls = dir === 'next' ? 'is-out-next' : 'is-out-prev';
    const inCls  = dir === 'next' ? 'is-in-next'  : 'is-in-prev';

    // sweep accent passes through the card
    card.classList.remove('is-sweeping');
    void card.offsetWidth;          // force reflow so the animation re-fires
    card.classList.add('is-sweeping');

    card.classList.add(outCls);
    setTimeout(() => {
      paint(newIdx);
      card.classList.remove(outCls);
      card.classList.add(inCls);
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove(inCls)));
    }, 360);
    idx = newIdx;
    resetProgress();
  }

  function resetProgress() {
    progressStart = performance.now();
    cancelAnimationFrame(rafId);
    const tick = (now) => {
      if (paused) { progressStart = now - (Number($bar.style.getPropertyValue('--p') || 0) * TICK_MS / 100); rafId = requestAnimationFrame(tick); return; }
      const pct = Math.min(100, ((now - progressStart) / TICK_MS) * 100);
      $bar.style.width = pct + '%';
      $bar.style.setProperty('--p', pct);
      if (pct < 100) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function next() { transitionTo((idx + 1) % CVES.length, 'next'); }
  function prev() { transitionTo((idx - 1 + CVES.length) % CVES.length, 'prev'); }

  function start() {
    stop();
    timer = setInterval(() => { if (!paused) next(); }, TICK_MS);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // initial paint with sweep + scramble + countup, so the first card feels alive too
  card.classList.add('is-sweeping');
  paint(idx, true);
  resetProgress();
  start();

  // controls
  nextBtn?.addEventListener('click', () => { next(); start(); });
  prevBtn?.addEventListener('click', () => { prev(); start(); });

  // pause on hover or focus
  ['mouseenter', 'focusin'].forEach(ev => deck.addEventListener(ev, () => { paused = true; }));
  ['mouseleave', 'focusout'].forEach(ev => deck.addEventListener(ev, () => { paused = false; progressStart = performance.now() - ((parseFloat($bar.style.width) || 0) / 100) * TICK_MS; }));

  // keyboard
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { next(); start(); }
    if (e.key === 'ArrowLeft')  { prev(); start(); }
  });

  // pause when off-screen to save cycles
  const visIO = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { paused = false; start(); }
    else                      { paused = true;  stop();  }
  }, { threshold: 0.2 });
  visIO.observe(deck);
})();

// ============================================
// Reveal-on-scroll for capability + process cards
// ============================================
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.cap, .proc-steps li, .stat').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 60}ms`;
  io.observe(el);
});

// ============================================
// Animated number counters
// ============================================
const numIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(target * eased);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
    numIO.unobserve(el);
  }
}, { threshold: 0.4 });
document.querySelectorAll('[data-count]').forEach(el => numIO.observe(el));

// ============================================
// Subtle terminal tilt on hover
// ============================================
const t = document.querySelector('.terminal');
if (t && matchMedia('(hover: hover)').matches) {
  const heroSec = document.querySelector('.hero');
  heroSec.addEventListener('mousemove', (e) => {
    const r = heroSec.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    t.style.transform = `perspective(1500px) rotateY(${(-x * 5).toFixed(2)}deg) rotateX(${(y * 3).toFixed(2)}deg) translateZ(0)`;
  });
  heroSec.addEventListener('mouseleave', () => { t.style.transform = ''; });
}

// ============================================
// Nav shadow on scroll
// ============================================
const nav = document.querySelector('.nav');
const setNav = () => {
  if (window.scrollY > 16) nav.style.boxShadow = '0 14px 50px rgba(0,0,0,.35)';
  else nav.style.boxShadow = 'none';
};
setNav();
window.addEventListener('scroll', setNav, { passive: true });
