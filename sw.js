// ==================== sw.js - Service Worker RI5 ====================
// Versión: 2.29 - Bump de caché (v103 -> v104): estilo de modal unificado.
//                El modal de récords personales del perfil (profile.js)
//                y el visor de rutas GPS (gps-track-viewer.js) usaban un
//                botón circular "✕" en la esquina superior derecha para
//                cerrar; el resto de modales (insignias, historial) usan
//                un botón "CERRAR" centrado debajo del contenido. Ahora
//                los cuatro siguen el mismo patrón visual. También se
//                elimina el texto "Ver detalle ›" de la tarjeta de
//                récords del perfil (la tarjeta entera ya era clicable
//                para abrir el modal, así que el texto era redundante).
// Versión: 2.28 - Bump de caché (v102 -> v103): reescrito por completo el
//                modal de récords personales del perfil (profile.js:
//                abrirModalRecords/cerrarModalRecords). Se veía en negro
//                sin modal visible porque el código anterior insertaba el
//                modal dentro del overlay (overlay.appendChild(modal)) y
//                LUEGO otra vez directamente en <body>
//                (document.body.appendChild(modal)) -- un nodo solo puede
//                tener un padre, así que ese segundo appendChild sacaba el
//                modal de dentro del overlay y lo dejaba como hijo suelto
//                de <body>, sin position:fixed ni z-index propios, pintado
//                por detrás del overlay a pantalla completa. Ahora solo
//                hay un único árbol (modal -> overlay -> body) y además se
//                añaden animación de apertura/cierre (fade + scale, mismo
//                patrón que el visor de mapas GPS) y un botón ✕ en la
//                cabecera en vez del botón "CERRAR" de ancho completo.
// Versión: 2.27 - Bump de caché (v101 -> v102): corregido el modal de
//                récords del perfil, que se veía completamente negro (el
//                contenido se movía por error fuera del overlay y quedaba
//                detrás de él); y corregido el "salto"/recarga automática
//                al entrar en la app: antes se recargaba la página también
//                en la primerísima instalación del Service Worker (no solo
//                en actualizaciones reales), lo que reiniciaba de golpe la
//                animación del splash "RI5 | Running LAB" a medio hacer.
// Versión: 2.26 - Bump de caché (v100 -> v101): 1) tarjeta de récords del
//                perfil ahora muestra solo la marca más reciente, y toda
//                la tarjeta abre un modal con el desglose completo por
//                distancia; 2) gestión científica de la fatiga: al marcar
//                una sesión nueva se avisa si el % de recuperación
//                (mismo cálculo que la tarjeta "Carga y recuperación" del
//                dashboard) es menor del 100%, dejando decidir al usuario
//                si quiere entrenar igualmente; 3) nuevo modal de
//                "novedades de esta versión" que se muestra una única vez
//                al entrar al Dashboard tras actualizar (se recuerda con
//                localStorage 'ri5_novedades_vistas').
// Versión: 2.25 - Bump de caché (v99 -> v100): la píldora "Ver perfil" de
//                las dos modales de "me gusta" se reduce aproximadamente a
//                la mitad (padding y letra más pequeños) y ahora vive
//                dentro de una casilla de ancho fijo con
//                justify-content:center, así queda centrada en su columna
//                en vez de pegada a un lado. Además el modal (y cada fila)
//                llevan overflow-x:hidden y box-sizing:border-box, para
//                que nunca haya desplazamiento lateral aunque haya muchos
//                "me gusta" -- solo desplazamiento vertical si hace falta.
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

const CACHE_NAME = 'ri5-v104';

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
  console.log('[SW] Instalando RI5 v104...');
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
      // activar una versión nueva. app.js escucha este mensaje
      // (navigator.serviceWorker.addEventListener('message', ...)) para
      // recargar la pestaña automáticamente; el modal de "novedades de
      // esta versión" en sí NO depende de este mensaje (se controla por
      // separado con localStorage en index.html, ver
      // mostrarModalNovedadesSiProcede), así que se muestra igual aunque
      // la recarga automática tarde o no llegue a producirse.
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
