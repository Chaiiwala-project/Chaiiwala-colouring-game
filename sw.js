const CACHE_NAME = 'chaiiwala-v4';

const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './assets/fonts/DancingScript-Bold.woff2',
  './assets/images/backgroundimage2HD.png',
  './assets/images/Chaii Character.png',
  './assets/images/sceneColoured.png',
  './assets/images/sceneBW.png',
  './assets/images/sheet 0007Coloured.png',
  './assets/images/sheet 0007BW.png',
  './assets/images/STICKER SHEET 0001.png',
  './assets/images/STICKER SHEET 0002.png',
  './assets/images/STICKER SHEET 0002BW.png',
  './assets/images/STICKER SHEET 0003 bb.png',
  './assets/images/STICKER SHEET 0003 bbBW.png',
  './assets/images/STICKER SHEET 0005 B.png',
  './assets/images/STICKER SHEET 0005 BBW.png',
  './assets/images/STICKER SHEET 0006 b.png',
  './assets/images/STICKER SHEET 0006 bBW.png',
  './assets/images/image1coloured.jpg',
  './assets/images/blackandwhiteimage1.png',
  './assets/images/image2coloured.jpg',
  './assets/images/blackandwhiteimage2.png',
  './assets/images/image3coloured.jpg',
  './assets/images/blackandwhiteimage3.png'
];

// Install: cache all app assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests (e.g. Google Fonts)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache any new assets fetched while online
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => {
        // Network failed and not in cache — nothing we can do
      });
    })
  );
});
