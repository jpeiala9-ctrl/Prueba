// ==================== sw.js - Service Worker RI5 ====================
// Versión: 2.0 - Bump de caché para forzar actualización de app.js/auth.js/
//                storage.js/profile.js/index.html tras corregir varios bugs.
//                IMPORTANTE: cada vez que se suban nuevos JS/HTML hay que
//                cambiar CACHE_NAME, si no el Service Worker seguirá
//                sirviendo los archivos antiguos desde caché (estrategia
//                Cache First) y los cambios no se verán reflejados de forma
//                fiable (parecerá que "a veces funciona, a veces no").
// Estrategia:
//   - App shell (HTML + JS propios) → Cache First
//   - Firebase / APIs externas → Network First (nunca se cachean)
//   - Leaflet, fuentes, iconos → Cache First
// =====================================================================

const CACHE_NAME = 'ri5-v7';

// Archivos del app shell que se precargan al instalar el SW
const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './auth.js',
  './storage.js',
  './training.js',
  './entrenamientos.js',
  './calendar.js',
  './friends.js',
  './wall.js',
  './profile.js',
  './gamification.js',
  './gps-tracker.js',
  './gps-track-viewer.js',
  './firebase-config.js'
];

// Dominios que NUNCA se cachean (siempre red)
const NETWORK_ONLY_DOMAINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseio.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'nominatim.openstreetmap.org'
];

// ── INSTALL: precarga el app shell ──────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando RI5 v7...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        // Si algún archivo falla no bloqueamos la instalación
        console.warn('[SW] Algunos archivos no se pudieron precargar:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpia caches antiguas ────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando cache antigua:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: lógica de red ─────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Peticiones POST/non-GET → siempre red
  if (event.request.method !== 'GET') return;

  // 2. Firebase y APIs externas sensibles → siempre red
  if (NETWORK_ONLY_DOMAINS.some(domain => url.hostname.includes(domain))) return;

  // 3. Chrome extensions → ignorar
  if (url.protocol === 'chrome-extension:') return;

  // 4. Todo lo demás → Cache First con fallback a red
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Solo cachear respuestas válidas de nuestro origen o CDNs conocidas
        if (
          response.ok &&
          (url.origin === self.location.origin ||
           url.hostname.includes('unpkg.com') ||
           url.hostname.includes('googleapis.com') ||  // solo fuentes/maps, no firebase
           url.hostname.includes('cdnjs.cloudflare.com') ||
           url.hostname.includes('basemaps.cartocdn.com'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: devolver página offline si es navegación HTML
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── PUSH NOTIFICATIONS (preparado para el futuro) ───────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'RI5', {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] sw.js cargado correctamente');
