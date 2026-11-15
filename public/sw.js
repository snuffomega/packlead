const VERSION = 'packlead-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(VERSION)).put(request, response.clone());
  return response;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(VERSION)).put('/', response.clone());
    return response;
  } catch {
    return (await caches.match('/')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Live data (scores, leaderboards, uploads) always goes to the network and is never cached.
  if (url.origin !== self.location.origin && !isFont(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (isFont(url) || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/products/')) {
    event.respondWith(cacheFirst(request));
  }
});
