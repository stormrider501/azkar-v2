// Azkar — Service Worker
// Caches the app shell for full offline use after first visit.
//
// IMPORTANT: this file must be registered with a relative path
// (e.g. navigator.serviceWorker.register('sw.js')) so its scope
// is correctly anchored under a GitHub Pages project subpath
// like /azkar-/ instead of the domain root.

const CACHE_NAME = 'azkar-v3';

// Resolve every precache URL relative to this service worker's own
// location, so it works whether the site is hosted at the domain root
// (Netlify) or under a subpath (GitHub Pages project sites like /azkar-/).
const PRECACHE_URLS = [
  '',                 // the directory index itself (./)
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
].map((p) => new URL(p, self.location.href).toString());

// Install: pre-cache the app shell. Cache each file independently so a
// single missing/failed asset does NOT abort caching of everything else.
// (cache.addAll() is all-or-nothing and was the root cause of "works
// online, fails offline" — one 404 in the list killed the whole install.)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res && res.ok) return cache.put(url, res);
              console.warn('[SW] precache skipped (bad response):', url, res && res.status);
            })
            .catch((err) => {
              console.warn('[SW] precache failed:', url, err);
            })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean up old cache versions, take control of open tabs immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Cross-origin requests (Google Fonts etc.): network first, no caching required for offline.
// - Same-origin navigations (the page itself): try cache first so the app
//   shell loads instantly offline; fall back to network; fall back to the
//   cached index.html if nothing else matches (so a fresh nav while offline
//   still opens the app instead of showing the browser's offline error page).
// - Same-origin assets (icons, manifest): cache-first, refresh in background.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cross-origin (e.g. Google Fonts) — let it hit network, don't block offline behavior on it
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Page navigations — most important path for "open the app while offline"
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then((cached) =>
            cached || caches.match(new URL('index.html', self.location.href).toString())
          )
        )
    );
    return;
  }

  // Other same-origin assets — cache-first, refresh in background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
