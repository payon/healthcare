// biogram-mini SW v3 — freshness-first.
// - Navigations (HTML): network-first, cache fallback (offline) → admin edits
//   and deploys reach the kiosk immediately; stale HTML (old CSP headers /
//   rotated /_next chunk hashes) can never stick.
// - /_next/static/* (content-hashed, immutable): cache-first.
// - /api/* and /admin/*: network only, never cached (fresh data, no PII at rest).
// - kiosk images and other GET: stale-while-revalidate.
const CACHE_NAME = 'biogram-mini-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/kiosk-images/equipment.png',
  '/kiosk-images/location.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

function isNavigation(request) {
  return request.mode === 'navigate';
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  // Never cache admin UI (shared kiosk PII leakage + stale content)
  if (url.pathname.startsWith('/admin')) return;

  // HTML navigations: network-first
  if (isNavigation(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Hashed build assets: cache-first (immutable by URL)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else (images, manifest): stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
