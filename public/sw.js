// Cache hors ligne de Prof d'anglais. Les appels /api/ ne sont jamais mis en cache.
const CACHE = 'prof-danglais-v23';
// Chemins relatifs au service worker : l'app marche à la racine d'un site
// comme dans un sous-dossier (ex. : GitHub Pages, /prof-danglais/).
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'fusion.js',
  'compte.js',
  'magasin.js',
  'abonnement.js',
  'firebase-config.js',
  'legal-config.js',
  'conditions.html',
  'confidentialite.html',
  'legal.css',
  'legal.js',
  'fonts/fonts.css',
  'fonts/atkinson-400-latin.woff2',
  'fonts/atkinson-400-latin-ext.woff2',
  'fonts/atkinson-400-italic-latin.woff2',
  'fonts/atkinson-400-italic-latin-ext.woff2',
  'fonts/atkinson-700-latin.woff2',
  'fonts/atkinson-700-latin-ext.woff2',
  'fonts/bricolage-var-latin.woff2',
  'fonts/bricolage-var-latin-ext.woff2',
  'vendor/firebase/firebase-app-compat.js',
  'vendor/firebase/firebase-auth-compat.js',
  'vendor/firebase/firebase-firestore-compat.js',
  'vendor/firebase/firebase-functions-compat.js',
  'manifest.webmanifest',
  'curriculum.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/api/')) return;
    // Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || (request.mode === 'navigate' ? caches.match('index.html') : Response.error()))
        )
    );
  }
});
