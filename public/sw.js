const STATIC_CACHE = 'iweos-static-v1';
const PAGE_CACHE = 'iweos-pages-v1';
const CORE_PAGES = ['/', '/product', '/grading', '/results', '/pricing', '/guide'];
const STATIC_PATH_PREFIXES = ['/icons/', '/images/', '/_next/static/'];
const SAFE_PUBLIC_PATHS = new Set([...CORE_PAGES, '/manifest.webmanifest', '/icon', '/apple-icon']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(CORE_PAGES)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    url.pathname.startsWith('/app') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/sign-in') ||
    url.pathname.startsWith('/sign-up') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/onboarding') ||
    url.pathname.startsWith('/pay')
  ) {
    return;
  }

  if (request.mode === 'navigate' && SAFE_PUBLIC_PATHS.has(url.pathname)) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/');
      if (fallback) {
        return fallback;
      }
    }
    throw new Error('Offline and no cached copy is available.');
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    return cached;
  }

  return networkPromise.then((response) => response || fetch(request));
}
