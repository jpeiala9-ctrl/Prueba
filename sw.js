// ==================== sw.js - Service Worker RI5 ====================
// Versión: 2.24 - Bump de caché (v98 -> v99): el botón "Ver perfil" de
//                las dos modales de "me gusta" (muro y perfil) era
//                demasiado grande y provocaba desplazamiento horizontal en
//                la tarjeta en pantallas estrechas. Se reduce su padding y
//                tamaño de letra, y se recorta un poco el gap entre
//                avatar/nombre/botón para dejar más margen.
// Versión: 2.23 - Bump de caché (v97 -> v98): en el splash, "RI5" (y el
//                separador "|") se pintan siempre en dorado desde que
//                entran -- ya no cogen color de nivel. Solo las 10 letras
//                de "Running LAB" (sin contar el espacio) usan la escala
//                de niveles 1-10 mientras entran, de izquierda a derecha,
//                y viran a dorado al final junto con el resto.
// Versión: 2.22 - Bump de caché (v96 -> v97): el borde de la foto de
//                perfil pasa a ser del color de nivel de cada usuario en
//                TODOS los sitios donde aparece (amigos, solicitudes,
//                buscador, explorar usuarios, muro global -- con el nivel
//                de cada autor, no el de quien mira --, "mis últimos
//                entrenamientos" en Perfil, listas de "me gusta" del muro
//                y de Perfil, y lista de chats). De paso se corrigen dos
//                fallos en las listas de "me gusta": la foto salía ovalada
//                (el avatar, al ser hijo de un contenedor flex sin
//                flex-shrink:0, se comprimía en horizontal cuando el
//                nombre de usuario era largo) y el botón "Ver perfil"
//                cambiaba de tamaño según lo largo del nombre por el mismo
//                motivo -- ahora avatar y botón llevan flex-shrink:0 y el
//                nombre usa ellipsis en vez de forzar overflow.
// Versión: 2.21 - Bump de caché (v95 -> v96) por fallos en la animación
//                del splash de index.html: 1) se quita del todo el cursor
//                parpadeante (::after) que sobraba de la antigua animación
//                de "escribir letra a letra" y que ahora se veía como una
//                barra vertical suelta a la derecha; 2) se corrige que la
//                primera letra (a veces varias) apareciera de golpe sin
//                transición -- se programaba con setTimeout(fn, 0), que
//                podía ejecutarse antes de que el navegador pintara el
//                estado inicial (opacity:0), dejándolo sin "punto de
//                partida" del que animar; ahora se fuerza un doble
//                requestAnimationFrame antes de arrancar la secuencia;
//                3) se ralentiza el ritmo de entrada de las letras.
// Versión: 2.20 - Bump de caché (v94 -> v95) por cambios en index.html
//                (animación del splash "RI5 | Running LAB": entrada letra
//                a letra de izquierda a derecha con los colores de nivel
//                1-10, virando a dorado al terminar; borde del avatar del
//                dashboard con el color de nivel del usuario) y en
//                auth.js (checkSavedSession ahora espera -- await -- a que
//                termine de cargar TODO el dashboard antes de llamar a
//                Utils.hideLoading(), para que no se vea rellenarse de
//                datos delante del usuario al recargar con sesión en
//                caché).
// Versión: 2.19 - Bump de caché (v93 -> v94) por index.html: el fix
//                anterior (top/left/width/height en vez de "inset:0") no
//                era suficiente -- el problema real es que en un
//                documento tan grande como este, el navegador puede
//                pintar el landing (visible por defecto hasta que el JS
//                de más abajo decide qué tocar) en un frame antes de que
//                el splash "gane" por z-index, dando ese parpadeo.
//                Solución a prueba de balas: mientras el <body> tiene la
//                clase 'ri5-booting' (puesta desde el primer HTML, antes
//                de pintar nada), un CSS crítico -- el primerísimo del
//                <head>, antes incluso de las hojas de fuentes/iconos --
//                oculta con display:none TODO lo que no sea el splash. No
//                depende de z-index ni de timing de pintado: display:none
//                saca el resto del árbol de render por completo, así que
//                no hay nada que parpadear pase lo que pase.
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

const CACHE_NAME = 'ri5-v99';

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
  './share-card.js',
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
  console.log('[SW] Instalando RI5 v99...');
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
    .then(() => {
      // Avisa a todas las pestañas/clientes abiertos de que se acaba de
      // activar una versión nueva. app.js puede escuchar este mensaje
      // (navigator.serviceWorker.addEventListener('message', ...)) para,
      // por ejemplo, mostrar un modal de "novedades de esta versión" la
      // próxima vez que el usuario entre. De momento solo se envía el
      // aviso; el modal en sí se implementará en app.js más adelante.
      return self.clients.matchAll({ type: 'window' }).then(clientsList => {
        clientsList.forEach(client => {
          client.postMessage({ type: 'RI5_NEW_VERSION', version: CACHE_NAME });
        });
      });
    })
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
