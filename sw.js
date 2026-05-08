const CACHE_NAME = 'al-raed-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/store.js',
  '/js/ai-assistant.js',
  '/js/chat.js',
  '/js/tasks.js',
  '/js/team.js',
  '/js/finance.js',
  '/js/calendar.js',
  '/js/admin.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
