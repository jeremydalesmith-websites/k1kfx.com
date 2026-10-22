// ============================================================
//  Fox Pursuit — Service Worker
//  Offline support for the APP SHELL only (HTML/JS/CSS + CDN libs).
//
//  Map data is NOT cached here. Since v60 the basemap is a vector
//  .pmtiles archive fetched with HTTP range requests, and its
//  offline cache lives in IndexedDB (see foxhunt-map.js). The SW
//  must NOT intercept .pmtiles: a cached 200 response would break
//  the Range/206 semantics the map depends on.
//
//  Firebase / Google API traffic is deliberately NOT touched —
//  Firestore has its own offline persistence layer, and caching
//  auth/data responses would break real-time sync and login.
// ============================================================

const APP_CACHE  = 'foxpursuit-team-v2026.21'; // bump version to force app-shell refresh

// App-shell files (resolved relative to this SW's scope, e.g. /foxhunt/).
const APP_SHELL = [
  './',
  './index.html',
  './home.html',
  './getting-started.html',
  './dashboard.html',
  './hunt.html',
  './about.html',
  './instructions.html',
  './contact.html',
  './setup.html',
  './repair.html',
  './admin.html',
  './troubleshooting.html',
  './purchase.html',
  './foxhunt.css',
  './foxhunt.js',
  './0-config-foxhunt.js',
  './foxhunt-theme.js',
  './foxhunt-map.js',
  './pmtiles.js',
  './protomaps-leaflet.js',
  './0-config-firebase.js',
  './0-config-license.js',
  './foxhunt-license.js',
  './favicon.svg',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './blocked-usernames.txt'
];

// Static third-party assets the app shell needs (CDN). Cached best-effort so a
// single failure (or an opaque/no-cors response) never aborts installation.
const CDN_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;500;700&display=swap'
];

// ── Install: pre-cache the app shell ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);

    // Same-origin shell: add all (any 404 here is a real packaging error,
    // but we still don't want it to wedge the SW, so catch per-file).
    await Promise.allSettled(
      APP_SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })))
    );

    // CDN assets: fetch each individually; tolerate no-cors / opaque / failure.
    await Promise.allSettled(CDN_ASSETS.map(async url => {
      try {
        const resp = await fetch(url, { mode: 'cors' });
        if (resp && (resp.ok || resp.type === 'opaque')) { await cache.put(url, resp.clone()); return; }
      } catch (e) { /* try no-cors fallback */ }
      try {
        const resp = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, resp.clone());
      } catch (e) { /* leave uncached — runtime fetch will handle it */ }
    }));

    await self.skipWaiting();
  })());
});

// ── Activate: clean up old app-shell versions, take control ──
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => {
      // Keep the current app cache; drop stale app-shell versions.
      // NOTE: a pre-v60 'foxhunt-tiles-*' raster cache is NOT deleted here —
      // it is merely never written to again. See the review notes: dropping it
      // would reclaim space for upgraders, but that is a behaviour change.
      if (name === APP_CACHE) return Promise.resolve();
      // v2026.8: the cache family was renamed foxhunt-app-* -> foxpursuit-team-*.
      // Delete both families, or every upgrading phone keeps an orphaned
      // foxhunt-app-v2026.7 cache (wasted storage, which matters on iOS).
      if (name.startsWith('foxpursuit-team-') || name.startsWith('foxhunt-app-')) return caches.delete(name);
      return Promise.resolve();
    }));
    await self.clients.claim();
  })());
});

// ── Helpers ──────────────────────────────────────────────────

// True for Firebase / Google API + auth + data endpoints we must NOT intercept.
// (Static SDK scripts on gstatic / fonts are handled by the app-shell cache.)
function isFirebaseOrGoogleApi(url) {
  const h = url.hostname;
  return /\.googleapis\.com$/i.test(h)            // firestore / identitytoolkit / securetoken / etc.
      || /(^|\.)google\.com$/i.test(h)            // Firestore transport keep-alive pings (cleardot.gif)
      || /(^|\.)firebaseio\.com$/i.test(h)
      || /(^|\.)firebaseapp\.com$/i.test(h)
      || /(^|\.)firebasedatabase\.app$/i.test(h)
      || /(^|\.)cloudfunctions\.net$/i.test(h)
      || /(^|\.)firebaseinstallations\.googleapis\.com$/i.test(h)
      || /(^|\.)google-analytics\.com$/i.test(h)
      || /(^|\.)analytics\.google\.com$/i.test(h)
      || /(^|\.)firebaselogging/i.test(h);
}

// ── Fetch: Firebase/.pmtiles bypass, network-first app code, cache-first rest ──
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET; never cache POST/PUT/etc.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // 1) Firebase / Google APIs — do not intercept at all (let the network +
  //    Firestore's own offline layer handle it).
  if (isFirebaseOrGoogleApi(url)) return;

  // 2) Map data (.pmtiles) — never intercept. These are RANGE requests; caching
  //    them here would return a full-body 200 where the map expects a 206.
  if (url.pathname.endsWith('.pmtiles')) return;

  // 2.5) Firebase config — network-first so credential changes always reach
  //      users right away and a stale/placeholder config can never get stuck
  //      in the cache. Falls back to cache only when offline.
  if (url.origin === self.location.origin && /(^|\/)0-config-[a-z]+\.js$/.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req, { cache: 'no-store' });
        if (resp && resp.ok) {
          const cache = await caches.open(APP_CACHE);
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw e;
      }
    })());
    return;
  }

  // 2.6) App HTML pages — network-first so a new deploy reaches users on a
  //      simple refresh (no cache-version bump needed for HTML). Falls back to
  //      the cached copy when offline.
  if (url.origin === self.location.origin &&
      (req.mode === 'navigate' || /\.html$/i.test(url.pathname))) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) {
          const cache = await caches.open(APP_CACHE);
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // hunt.html?id=<id> is precached only as ./hunt.html (no query), so an exact
        // match misses for any specific hunt. Match by path so ANY hunt page resolves
        // to the cached shell offline; the app reads the id and loads it from cache.
        const shell = await caches.match(req, { ignoreSearch: true });
        if (shell) return shell;
        const fallback = await caches.match('./home.html') || await caches.match('./index.html');
        if (fallback) return fallback;
        throw e;
      }
    })());
    return;
  }

  // 2.7) Core app JS/CSS (foxhunt.js, foxhunt.css, 0-config-foxhunt.js, etc.) —
  //      network-first so a new deploy's logic, styles, and config reach users on
  //      a simple refresh, with no cache-version bump or manual cache clearing.
  //      Falls back to the cached copy when offline. (0-config-firebase.js is
  //      handled above; cross-origin CDN libs stay cache-first below.)
  if (url.origin === self.location.origin && /\.(js|css)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) {
          const cache = await caches.open(APP_CACHE);
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw e;
      }
    })());
    return;
  }

  // 3) Everything else (app shell + cached CDN): cache-first, fall back to network.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      // Opportunistically cache same-origin successful GETs (e.g. files added later).
      if (resp && resp.ok && url.origin === self.location.origin) {
        const cache = await caches.open(APP_CACHE);
        cache.put(req, resp.clone());
      }
      return resp;
    } catch (e) {
      // Last resort for navigations: serve the cached shell if present. Match by
      // path first so hunt.html?id=<id> resolves to the cached ./hunt.html.
      if (req.mode === 'navigate') {
        const shell = await caches.match(req, { ignoreSearch: true });
        if (shell) return shell;
        const fallback = await caches.match('./home.html') || await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});

// ── Messages ─────────────────────────────────────────────────
// The v60 tile-cache messages (precache / clear / size) are gone along with the
// raster cache. SKIP_WAITING is kept: it is the standard hook for telling a
// waiting SW to activate immediately.
self.addEventListener('message', event => {
  const data = event.data || {};
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

