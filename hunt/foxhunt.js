// ============================================================
//  Fox Pursuit — Shared Navigation & Utility Functions
//  Include AFTER 0-config-firebase.js on every page
// ============================================================

// ── Text-style helpers (sizes & inline styling) ──────────────
function fhSizeToCss(v){
  if(!v) return '';
  const tiers={xs:'0.8rem',sm:'0.9rem',md:'1rem',lg:'1.25rem',xl:'1.6rem'};
  const k=String(v).toLowerCase().trim();
  if(tiers[k]) return tiers[k];
  if(/^[0-9.]+(rem|em|px|%)$/.test(k)) return k;
  return '';
}
// Inline CSS string from a segment's style fields (sizeKey = "textSize"/"linkSize").
function fhStyleCss(s, sizeKey){
  if(!s||typeof s!=='object') return '';
  let css='';
  const size=fhSizeToCss(sizeKey ? s[sizeKey] : s.size);
  if(size) css+='font-size:'+size+';';
  if(s.color) css+='color:'+s.color+';';
  if(s.bold) css+='font-weight:700;';
  if(s.italic) css+='font-style:italic;';
  if(s.underline) css+='text-decoration:underline;';
  if(s.smallCaps) css+='font-variant:small-caps;';
  return css;
}
// Apply a style object to an element, overriding ONLY the fields given so that
// the element's CSS-class defaults remain for anything left blank.
function fhApplyTextStyle(el, s){
  if(!el || !s || typeof s!=='object') return;
  const size=fhSizeToCss(s.size);
  if(size) el.style.fontSize=size;
  if(s.color) el.style.color=s.color;
  if(s.bold===true) el.style.fontWeight='700';
  if(s.italic===true) el.style.fontStyle='italic';
  if(s.underline===true) el.style.textDecoration='underline';
  if(s.smallCaps===true) el.style.fontVariant='small-caps';
  if(s.smallCaps===false) el.style.fontVariant='normal';
}

// Fill the Home-page hero (brand / tagline / subtitle) from the config.
function applyHomeHero(){
  const C=(typeof FOXHUNT_CONFIG!=='undefined')?FOXHUNT_CONFIG:{};
  const brandEl=document.getElementById('hero-brand');
  if(brandEl) brandEl.textContent=(C.brandName||'FOX PURSUIT');
  const tagEl=document.getElementById('hero-tagline');
  if(tagEl){
    const t=(C.homeTagline||'').trim();
    tagEl.textContent=t;
    tagEl.style.display=t?'':'none';
    fhApplyTextStyle(tagEl, C.homeTaglineStyle);
  }
  const subEl=document.getElementById('hero-subtitle');
  if(subEl){
    const s=(C.homeSubtitle||'').trim();
    subEl.textContent=s;
    subEl.style.display=s?'':'none';
    fhApplyTextStyle(subEl, C.homeSubtitleStyle);
  }
}

// ── Auth guard ───────────────────────────────────────────────
// Call on any page that requires login. Works for both password and no-password modes.
// Firestore read source that avoids a long stall when offline: when the browser
// reports no connection, read straight from the local cache instead of letting the
// SDK try the server first (which can hang for many seconds in airplane mode).
function fhSource() { return navigator.onLine ? 'default' : 'cache'; }

// ── Optional auth (open / help pages) ────────────────────────
// about, contact, getting-started, instructions, troubleshooting and purchase
// are reachable WITHOUT signing in, so someone whose Firebase configuration is
// wrong can still read the help that explains the fault. Never redirects.
// If a session exists the handle and Sign Out appear as usual; if not, the user
// controls become a Sign In link. Call AFTER insertNav().
function fhOptionalAuth() {
  let settled = false;
  function signedOutNav() {
    if (settled === 'done') return;
    settled = 'done';
    document.querySelectorAll('.nav-right').forEach(el => {
      el.innerHTML = '<a class="nav-btn" href="index.html">Sign In</a>';
    });
    document.querySelectorAll('.nav-mobile-menu a').forEach(el => {
      if (/doSignOut/.test(el.getAttribute('onclick') || '')) {
        el.removeAttribute('onclick');
        el.setAttribute('href', 'index.html');
        el.textContent = 'Sign In';
      }
    });
  }
  try {
    auth.onAuthStateChanged(user => {
      if (settled === 'done') return;
      let handle = '';
      try { handle = (localStorage.getItem('fh_handle') || '').toUpperCase(); } catch (e) {}
      if (user && handle) {
        settled = 'done';
        document.querySelectorAll('.nav-username').forEach(el => el.textContent = handle);
      } else signedOutNav();
    });
  } catch (e) { signedOutNav(); return; }
  // A placeholder or invalid Firebase config can leave onAuthStateChanged
  // silent forever. Do not let the nav sit half-rendered waiting for it.
  setTimeout(signedOutNav, 3000);
}

function requireAuth(callback) {
  auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = 'index.html'; return; }

    // Passwordless + persistUsernames:false → the handle lives only in this device's
    // local storage, never in Firestore. Read it from there and skip the users doc.
    if (user.isAnonymous && typeof FOXHUNT_CONFIG !== 'undefined'
        && FOXHUNT_CONFIG.persistUsernames === false) {
      let handle = '';
      try { handle = (localStorage.getItem('fh_handle') || '').toUpperCase(); } catch (e) {}
      if (!handle) { window.location.href = 'index.html'; return; }  // keep the session; re-entry works offline
      document.querySelectorAll('.nav-username').forEach(el => el.textContent = handle);
      callback(user, handle);
      return;
    }

    // Offline this read comes from the Firestore cache, and it may legitimately
    // miss. Never let that cost the user their session: a signed-out anonymous
    // user cannot sign back in without a network, which strands them in the field.
    let snap = null;
    try { snap = await db.collection('users').doc(user.uid).get({ source: fhSource() }); } catch (e) {}

    let cached = '';
    try { cached = (localStorage.getItem('fh_handle') || '').toUpperCase(); } catch (e) {}

    if (!snap || !snap.exists || !snap.data().username) {
      if (cached) {                      // fall back to the handle saved on this device
        document.querySelectorAll('.nav-username').forEach(el => el.textContent = cached);
        callback(user, cached);
        return;
      }
      if (!navigator.onLine) {           // nothing cached and no network — don't sign out
        alert('You appear to be offline and this device has no saved username yet.\n\n'
            + 'Reconnect once to finish signing in. Downloaded maps are unaffected.');
        return;
      }
      // Online and genuinely no handle — send back to index to enter one.
      // (Keep the anonymous session so re-entry works offline too.)
      window.location.href = 'index.html';
      return;
    }

    const username = snap.data().username.toUpperCase();
    // Mirror the handle locally so the fallback above can work next time offline.
    try { localStorage.setItem('fh_handle', username); } catch (e) {}
    document.querySelectorAll('.nav-username').forEach(el => el.textContent = username);
    callback(user, username);
  });
}

// ── Sign out ─────────────────────────────────────────────────
function doSignOut() {
  // Non-destructive sign-out: clear the callsign and current hunt, but KEEP the
  // anonymous device session. The anon uid is just a device token; the user's
  // identity is the callsign they type. Keeping the session lets them sign back in
  // offline (reusing it) instead of being stranded in the field. The login page
  // only auto-forwards when a handle exists, so clearing the handle correctly lands
  // them back on the callsign prompt.
  try { sessionStorage.removeItem('huntId'); } catch (e) {}
  try { localStorage.removeItem('fh_handle'); } catch (e) {}
  window.location.href = 'index.html';
}

// ── Nav hamburger toggle ─────────────────────────────────────
function toggleMobileNav() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// ── Active nav link ───────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.nav-links a, .nav-mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href === path || (path === '' && href === 'home.html'))) {
      a.classList.add('active');
    }
  });
}
document.addEventListener('DOMContentLoaded', setActiveNav);

// ── Copyright year ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.copyright-year').forEach(el => {
    const startYear = 2026;
    const thisYear  = new Date().getFullYear();
    el.textContent  = thisYear > startYear ? `${startYear}–${thisYear}` : `${startYear}`;
  });
});

// ── Blocked username check (fetches blocked-usernames.txt) ────
let _blockedCache = null;
async function isUsernameBlocked(username) {
  if (!_blockedCache) {
    try {
      const resp = await fetch('blocked-usernames.txt?nc=' + Date.now());
      const text = await resp.text();
      _blockedCache = text.split('\n')
        .map(l => l.trim().toLowerCase())
        .filter(l => l && !l.startsWith('#'));
    } catch { _blockedCache = []; }
  }
  const lower = username.toLowerCase();
  return _blockedCache.some(blocked => lower === blocked || lower.includes(blocked));
}

// ── Nav HTML builder ──────────────────────────────────────────
// Call insertNav() in <body> to inject the nav bar
// ── Demo mode (v72.11) ────────────────────────────────────────
// A public demonstration site is a full Team installation that anyone can
// find. demoMode in 0-config-foxhunt.js makes that honest: a banner on every
// page, nothing recorded in analytics, and a cap on open hunts so a prankster
// cannot fill the list. Off (the default) changes nothing.
function fhDemo() {
  return !!(typeof FOXHUNT_CONFIG !== 'undefined' && FOXHUNT_CONFIG.demoMode);
}
function fhInsertDemoBanner(afterEl) {
  if (!fhDemo()) return;
  const text = (typeof FOXHUNT_CONFIG !== 'undefined' && FOXHUNT_CONFIG.demoBannerText)
    ? FOXHUNT_CONFIG.demoBannerText
    : 'DEMO SITE \u2014 hunts here are public and close automatically.';
  const html = '<div class="fh-demo-banner">' + fhEscape(text) + '</div>';
  if (afterEl) afterEl.insertAdjacentHTML('afterend', html);
  else document.body.insertAdjacentHTML('afterbegin', html);
}

// ── Persistent storage (v72.13) ────────────────────────────────
// OFF-09 (2026-09-22, iPhone SE / iOS 26): a home-screen icon left unused for
// 7 days of Safari use had its storage cleared - sign-in, downloaded map areas,
// app shell - unless persistent storage had been granted, in which case it
// survived 10 untouched days intact. So ask for it early (the sign-in tap is a
// user gesture, the best moment for a grant) and keep asking on every dashboard
// load; fhStorageProtected() reports the answer for the offline-ready line.
async function fhRequestPersist() {
  try {
    if (navigator.storage && navigator.storage.persist) return !!(await navigator.storage.persist());
  } catch (e) {}
  return false;
}
async function fhStorageProtected() {
  try {
    if (navigator.storage && navigator.storage.persisted) return !!(await navigator.storage.persisted());
  } catch (e) {}
  return null;   // unknown (API absent)
}

function insertNav(showUserControls = true) {
  const brand = (typeof FOXHUNT_CONFIG !== 'undefined' && FOXHUNT_CONFIG.brandName) ? FOXHUNT_CONFIG.brandName : 'FOX PURSUIT';
  const userSection = showUserControls ? `
    <div class="nav-right">
      <span class="nav-username nav-user"></span>
      <button class="nav-btn danger" onclick="doSignOut()">Sign Out</button>
    </div>` : '';

  const html = `
<nav>
  <div class="nav-inner">
    <a class="nav-logo" href="home.html">
      <img src="favicon.svg" alt="" width="28" height="28"/>
      <span>${fhEscape(brand)}</span>
      <span class="fh-build"></span>
    </a>
    <div class="nav-links">
      <a href="home.html">Home</a>
      <a href="dashboard.html">Hunt</a>
      <a href="getting-started.html">Getting Started</a>
      <a href="about.html">About</a>
      <a href="instructions.html">Instructions</a>
      <a href="contact.html">Contact</a>
      <a href="troubleshooting.html">Troubleshooting</a>
      <a href="purchase.html">Purchase</a>
    </div>
    ${userSection}
    <button class="nav-hamburger" onclick="toggleMobileNav()">☰</button>
  </div>
  <div class="nav-mobile-menu" id="mobile-menu">
    <a href="home.html">Home</a>
    <a href="dashboard.html">🦊 Hunt</a>
    <a href="getting-started.html">Getting Started</a>
    <a href="about.html">About</a>
    <a href="instructions.html">Instructions</a>
    <a href="contact.html">Contact</a>
    <a href="troubleshooting.html">Troubleshooting</a>
    <a href="purchase.html">Purchase</a>
    ${showUserControls ? '<a href="#" onclick="doSignOut()">Sign Out</a>' : ''}
  </div>
</nav>`;
  document.body.insertAdjacentHTML('afterbegin', html);
  fhInsertDemoBanner(document.querySelector('nav'));
  setActiveNav();
  fhStampBuild();
}

// ── Configurable content blocks (Contact / About pages) ──────
// Builds page content from a FOXHUNT_CONFIG array of blocks, each:
//   { subheading, text, linkName, linkUrl }
// Empty fields are skipped; if linkName is blank the URL is shown as the link.
function fhEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function renderContentBlocks(targetId, blocks) {
  const el = document.getElementById(targetId);
  if (!el) return;
  if (!Array.isArray(blocks)) { el.innerHTML = ''; return; }

  // v2026.2 (CON-01): hosts may write addresses as "name (at) domain (dot) com"
  // so they never appear as a harvestable e-mail in this public config file.
  // Decode them here, at page-load, and turn a bare address or phone number in
  // linkUrl into a working mailto:/tel: link.
  // v2026.4 (CON-02): more tokens, so phone numbers with dashes, postal
  // addresses and the like can be hidden the same way. Only these exact
  // parenthesised words are decoded, in any letter case; spaces around a token
  // are dropped and "(space)" puts one back. Anything else in parentheses is
  // left alone.
  const FH_DEOBF = { at: '@', dot: '.', dash: '-', space: ' ', plus: '+', hash: '#', comma: ',' };
  function fhDeobf(s) {
    return (s || '').replace(/\s*\((at|dot|dash|space|plus|hash|comma)\)\s*/gi,
                             (m, t) => FH_DEOBF[t.toLowerCase()]);
  }
  function fhLinkUrl(u) {
    u = fhDeobf(u);
    if (!u || /^[a-z][a-z0-9+.-]*:/i.test(u)) return u;          // already has a scheme
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return 'mailto:' + u; // bare e-mail
    if (/^\+?[\d\s().-]{7,}$/.test(u)) return 'tel:' + u.replace(/[\s().-]/g, ''); // phone
    return u;
  }
  // Render one text+link segment as inline HTML, honoring its size/style fields.
  function segHtml(seg) {
    if (!seg) return '';
    const text = fhDeobf((seg.text || '').trim());
    const name = fhDeobf((seg.linkName || '').trim());
    const url  = fhLinkUrl((seg.linkUrl || '').trim());
    let line = '';
    if (text) {
      const ts = fhStyleCss(seg, 'textSize');
      line += ts ? '<span style="' + ts + '">' + fhEscape(text) + '</span>' : fhEscape(text);
    }
    if (url) {
      const label = name ? fhEscape(name) : fhEscape(url);
      const ls = fhStyleCss(seg, 'linkSize');
      if (line) line += ' ';
      line += '<a href="' + fhEscape(url) + '" target="_blank" rel="noopener"' +
              (ls ? ' style="' + ls + '"' : '') + '>' + label + '</a>';
    }
    return line;
  }

  let html = '';
  blocks.forEach(function (b) {
    if (!b) return;
    const sub = (b.subheading || '').trim();
    if (sub) html += '<div class="content-subheading">' + fhEscape(sub) + '</div>';
    // Use an explicit "segments" array if present; otherwise treat the flat block
    // (subheading/text/linkName/linkUrl) as a single segment — old configs still work.
    const segs = (Array.isArray(b.segments) && b.segments.length) ? b.segments : [b];
    segs.forEach(function (seg) {
      const line = segHtml(seg);
      if (line) html += '<p>' + line + '</p>';
    });
  });
  el.innerHTML = html;
}

// ── Footer HTML builder ───────────────────────────────────────
function insertFooter() {
  const y = new Date().getFullYear();
  const yr = y > 2026 ? `2026–${y}` : '2026';
  document.body.insertAdjacentHTML('beforeend', `
<footer>
  © ${yr} Andrew Lindsay, <a href="https://www.qrz.com/db/WA0MCS" target="_blank" style="color:var(--accent)">WAØMCS</a>
</footer>`);
}

// ── Build version (shown in the top bar; bump on every build) ──
const FH_BUILD = 'v2026.21t';
try { console.info('Fox Pursuit ' + FH_BUILD); } catch(e){}

// Stamp the version into any element with class "fh-build" (nav brand, hunt
// top bar). Idempotent — safe to call from insertNav and on DOMContentLoaded.
function fhStampBuild() {
  document.querySelectorAll('.fh-build').forEach(el => {
    el.textContent = FH_BUILD;   // v2026.2: was 'build ' + FH_BUILD; the prefix cost width on narrow phones
    if (!el.dataset.fhStamped) {
      el.dataset.fhStamped = '1';
      el.style.cssText =
        'font:600 10px/1 monospace;color:var(--muted,#9ab);opacity:0.85;' +
        'margin-left:0.5rem;padding:1px 5px;border:1px solid var(--border,#345);' +
        'border-radius:3px;white-space:nowrap;letter-spacing:0.03em;';
    }
  });
}
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', fhStampBuild);
else fhStampBuild();

// Show a prominent, tap-to-reload banner when an updated version is ready.
function fhShowUpdateBanner() {
  if (document.getElementById('fh-update-banner')) return;
  // Locked to a fixed loud gold (#f0a500) so visibility never depends on the
  // active theme's accent. Full-width, pinned to the very top, above everything.
  if (!document.getElementById('fh-banner-style')) {
    const st = document.createElement('style');
    st.id = 'fh-banner-style';
    st.textContent =
      '@keyframes fhpulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(20,20,20,0.4)}' +
      '50%{transform:scale(1.06);box-shadow:0 0 0 5px rgba(20,20,20,0)}}';
    document.head.appendChild(st);
  }
  const bar = document.createElement('div');
  bar.id = 'fh-update-banner';
  bar.setAttribute('role', 'button');
  bar.setAttribute('tabindex', '0');
  bar.setAttribute('aria-label', 'New version available — tap to reload');
  bar.style.cssText =
    'position:fixed;left:0;right:0;top:0;z-index:100000;' +
    'background:#f0a500;color:#141414;cursor:pointer;' +
    'display:flex;align-items:center;gap:10px;padding:11px 14px;' +
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
    'box-shadow:0 3px 12px rgba(0,0,0,0.5);';
  bar.innerHTML =
    '<span aria-hidden="true" style="font-size:22px;font-weight:700;line-height:1">\u21BB</span>' +
    '<span style="flex:1;text-align:left;line-height:1.2">' +
      '<span style="display:block;font-size:14px;font-weight:700">New version available</span>' +
      '<span style="display:block;font-size:11px;font-weight:500;color:#5a3f00">A newer build is ready</span>' +
    '</span>' +
    '<span aria-hidden="true" style="background:#141414;color:#f0a500;font-size:12px;' +
      'font-weight:700;padding:7px 13px;border-radius:6px;white-space:nowrap;' +
      'animation:fhpulse 1.6s ease-in-out infinite">Reload</span>';
  const go = () => location.reload();
  bar.addEventListener('click', go);
  bar.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  document.body.appendChild(bar);
}

// ── Service Worker registration (app-shell offline support) ──
// Registered from foxhunt.js so it loads on every page. Scope = the folder this
// app is installed in (e.g. /foxhunt/), which is exactly what we want.
if ('serviceWorker' in navigator) {
  // A controller change means a NEW version just activated. Instead of a silent
  // reload, surface a visible "tap to reload" banner so testers/users know a new
  // build is live and refresh on their own terms. Only wired when a controller
  // already exists, so a first-time install doesn't prompt on itself.
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', fhShowUpdateBanner);
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[Fox Pursuit] Service worker registered, scope:', reg.scope))
      .catch(err => console.warn('[Fox Pursuit] Service worker registration failed:', err));
  });
}
