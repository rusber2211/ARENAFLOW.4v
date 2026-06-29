const CACHE_NAME = 'vila-da-barra-v2';

const ARQUIVOS_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

// INSTALAÇÃO
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

// ATIVAÇÃO (limpa cache antigo e assume controle)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => {
      return Promise.all(
        chaves
          .filter((c) => c !== CACHE_NAME)
          .map((c) => caches.delete(c))
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH (offline inteligente)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).catch(() => {
        // fallback básico para não “travar” app
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});