const CACHE_NAME = 'juara-tolak-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // We try to cache what we can, but don't fail if external resources fail immediately
        return cache.addAll(URLS_TO_CACHE).catch(err => console.error('Caching error:', err));
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Ignore non-http requests (like chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        }).catch(() => {
             // Network failed, nothing to do if cache missed too
             return null;
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
  );
});