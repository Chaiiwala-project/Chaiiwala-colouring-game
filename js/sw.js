const CACHE_NAME = 'chai-crayons-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  // Make sure your new backgrounds are in this list!
  '/assets/images/bg-home.png',
  '/assets/images/bg-selection.png', 
  '/assets/images/bg-settings.jpg'
  // (Plus any other images you are using in the game)
];

// Install Service Worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Serve cached files when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});