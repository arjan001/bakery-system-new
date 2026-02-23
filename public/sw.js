// Snackoh Bakers Admin — Service Worker
// Only caches /admin routes. Network-first strategy with app shell caching.

const CACHE_NAME = 'snackoh-admin-v2';

const APP_SHELL_URLS = [
  '/admin',
  '/company-logo.jpeg',
  '/manifest.json',
];

// ── Install: pre-cache the admin app shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('snackoh-admin-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── Fetch: network-first for /admin routes, ignore everything else ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle requests scoped to /admin paths and same-origin static assets
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isAppShellAsset =
    url.origin === self.location.origin &&
    APP_SHELL_URLS.includes(url.pathname);

  if (!isAdminRoute && !isAppShellAsset) {
    return; // Let the browser handle non-admin requests normally
  }

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache if available
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests (HTML pages), return the cached admin shell
          if (event.request.mode === 'navigate') {
            return caches.match('/admin');
          }
          // Nothing in cache — return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});
