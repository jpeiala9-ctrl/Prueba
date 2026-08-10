// ==================== sw.js - Service Worker RI5 ====================
// Versión: 2.49 - Bump de caché (v129 -> v130): guia.html, los botones
//                (índice, cerrar, volver) pasan a usar el mismo fondo
//                plano, borde --rim-color y sombra --shadow-md que
//                .action-button en el resto de la app (antes tenían
//                degradado y una sombra más fuerte que se veía
//                "flotante" de más). Corregida también una franja negra
//                en la zona segura inferior del móvil: el fondo ahora
//                cubre min-height:100dvh y el padding inferior respeta
//                env(safe-area-inset-bottom).
// Versión: 2.48 - Bump de caché (v128 -> v129): guia.html rehecha por
//                completo: ya no son tarjetas plegables en la portada.
//                La portada solo tiene los botones del índice; al
//                pulsar uno se abre su propia página a pantalla
//                completa, con los bloques apareciendo al bajar
//                (mismo mecanismo .reveal + IntersectionObserver que
//                la página de introducción de index.html).
// Versión: 2.47 - Bump de caché (v127 -> v128): guia.html, miniaturas
//                (mini-card: ACWR, niveles, récords) reducidas a un
//                único título centrado, sin punto de color ni línea de
//                descripción aparte; el color pasa a ser un tinte de
//                fondo de la propia tarjeta.
// Versión: 2.46 - Bump de caché (v126 -> v127): guia.html, segunda pasada
//                de diseño: tarjetas de sección sin números ni flechas,
//                el resumen solo muestra el título centrado; tipografía
//                Inter (la misma que index.html) en vez de DM Sans;
//                tarjetas con fondo en degradado y sombra más marcada
//                (efecto flotante); apertura con una pequeña animación
//                de aparición.
// Versión: 2.45 - Bump de caché (v125 -> v126): rediseño de guia.html
//                (tarjetas con profundidad y tinte de color por sección,
//                textos centrados, sin emojis, cabecera fija sustituida
//                por espacio superior + logo "RI5 | Running LAB" que
//                alterna claro/oscuro al pulsarlo, botón cerrar centrado
//                abajo, pie de página con la misma marca).
// Versión: 2.44 - Bump de caché (v124 -> v125): guia.html ahora respeta
//                el modo claro/oscuro guardado en localStorage
//                ('ri5_theme', igual que el resto de la app) y muestra
//                el logo "RI5 | Running LAB" con los colores de nivel,
//                igual que el splash de entrada de index.html.
// Versión: 2.43 - Bump de caché (v123 -> v124): añadida guia.html
//                (nueva página de ayuda de la app, con botón de acceso
//                desde Perfil) al precache para que esté disponible
//                también sin conexión.
// Versión: 2.42 - Bump de caché (v122 -> v123): auth.js cierra el registro
//                de nuevas cuentas automáticamente al llegar a 500
//                usuarios (límite del plan gratuito de Firebase), con
//                aviso y contacto de Instagram en index.html.
// Versión: 2.41 - Bump de caché (v115 -> v116): últimas 3 píldoras de la
//                app pasadas a radio 14px, tras confirmar con el usuario
//                que quería uniformidad total (no solo en modales):
//                chips "👟 Cambiar" / "📜 Historial" de zapatilla
//                (profile.js), botones ❤️ like y 🗑️ borrar del muro
//                (profile.js y wall.js) y el botón verde "Compartir RI5"
//                por WhatsApp (index.html). Con esto, NINGÚN botón de la
//                app queda con radio de píldora (>=18px) -- comprobado
//                con barrido completo sobre todos los archivos.
// Versión: 2.40 - Bump de caché (v114 -> v115): consistencia visual de
//                botones/modales + arreglos en el visor de rutas GPS.
//                1) Botones "píldora" (radio 30px/50px) unificados al
//                   radio rectangular de .action-button (14px), que ya
//                   era el estándar de facto en la mayoría de la app:
//                   .refresh-users-btn del panel de admin (Aplicar /
//                   Limpiar / Recargar -- el sitio donde más se notaba),
//                   CONFIRMAR/CANCELAR del prompt genérico (app.js),
//                   CERRAR de insignias e historial de zapatillas,
//                   CAMBIAR/CANCELAR de cambio de zapatilla (profile.js),
//                   DESBLOQUEAR de GPS premium (gps-tracker.js) y CERRAR
//                   del visor de rutas GPS (gps-track-viewer.js, ahora
//                   con la clase .action-button en vez de estilo propio).
//                   Se han dejado sin tocar, a propósito, los chips
//                   pequeños "Cambiar/Historial" de zapatilla (son
//                   etiquetas de alternancia, no CTAs de modal) y el
//                   botón verde de compartir por WhatsApp (marca propia
//                   de WhatsApp) -- avisar si también se quieren
//                   unificar.
//                2) profile.js: quitada la píldora "🗺 VER RECORRIDO"
//                   superpuesta sobre la miniatura del track en "Mis
//                   últimos entrenamientos". La capa de toque ya cubría
//                   toda la ventana del mapa (abre GPSTrackViewer al
//                   tocar en cualquier punto); la píldora era puramente
//                   decorativa y sobraba.
//                3) gps-track-viewer.js: arreglado el parpadeo raro al
//                   abrir el modal. Tenía dos causas: (a) la animación de
//                   apertura usaba un cubic-bezier con rebote (pasaba de
//                   escala 1 a más de 1 y volvía), que se percibía como
//                   un "salto"; ahora es una transición simple sin
//                   rebote. (b) el contenedor del mapa tenía un fondo
//                   gris claro fijo (#eaeaea) mientras cargaban las
//                   teselas, que en tema oscuro se veía como un flash
//                   blanco; ahora usa var(--stat-bg), coherente con el
//                   tema activo.
// Versión: 2.39 - Bump de caché (v113 -> v114): tarjeta de compartir
//                zonas/métricas (training.js) -- se quita el avatar
//                circular (foto de perfil / emoji 👤 por defecto) y todo
//                lo relacionado (fetch de photoURL, _cargarImagen(),
//                anillo de color de nivel alrededor del círculo). El
//                resto se mantiene: tema claro/oscuro real, @username en
//                el color de nivel, altura de canvas dinámica y pie de
//                página "RI5 | Running LAB".
// Versión: 2.38 - Bump de caché (v112 -> v113): tarjeta de compartir
//                zonas/métricas (training.js). 1) Pie de página cambiado
//                de "RI5 · Running Intelligence" a "RI5 | Running LAB".
//                2) Diagnóstico añadido en _cargarImagen(): si la foto de
//                perfil no se puede dibujar en el canvas (típicamente por
//                falta de configuración CORS en el bucket de Storage), se
//                deja un console.warn explícito en vez de fallar en
//                silencio -- así se puede distinguir "sin foto subida" de
//                "foto bloqueada por CORS" desde las DevTools. El arreglo
//                real de ese bloqueo es de infraestructura (gsutil cors
//                set sobre el bucket), no de este archivo.
// Versión: 2.37 - Bump de caché (v111 -> v112): tarjeta de compartir
//                zonas/métricas (training.js), dos arreglos de
//                maquetación. 1) Había solo ~10px entre el borde del
//                avatar y el logo "RI5" (quedaba todo pegado) -- ahora
//                90px de aire tanto tras el avatar como tras los
//                puntitos decorativos. 2) El pie de página ("RI5 ·
//                Running Intelligence") se dibujaba en una coordenada
//                fija sobre un canvas de alto fijo (2100px): con
//                bastantes predicciones/zonas se solapaba con el cartel
//                "CALCULA LAS TUYAS EN RI5". Ahora el alto del canvas se
//                calcula a partir del contenido real (pase de medición
//                antes de crear el canvas) y el pie se coloca siempre a
//                una distancia fija y limpia del final del contenido.
// Versión: 2.36 - Bump de caché (v110 -> v111): la tarjeta de compartir
//                zonas/métricas (training.js) añade el @username del
//                usuario bajo su nombre/edad, en el color de su nivel
//                (mismo criterio que el resto de la app). No se añade
//                QR: se descarta a propósito por ahora.
// Versión: 2.35 - Bump de caché (v109 -> v110): 1) tarjeta de "compartir
//                zonas/métricas" (training.js): ya no usa colores del
//                tema oscuro escritos a fuego -- ahora lee el tema real
//                del usuario (claro/oscuro) y dibuja su foto de perfil
//                con el anillo del color de su nivel. Antes salía siempre
//                negra sin importar el tema activo. 2) eliminada la
//                referencia muerta a 'share-card.js' en index.html y de
//                este precache: ese archivo ya no existe (su lógica vive
//                dentro de training.js), así que cargarlo solo producía
//                un 404 silencioso en cada arranque.
// NOTA: este bump NO toca el modal de "novedades de esta versión"
//       (RI5_VERSION_NOVEDADES en index.html) -- ese identificador es
//       independiente del CACHE_NAME y se deja tal cual a propósito, así
//       que el popup no vuelve a aparecer con esta subida.
// Versión: 2.34 - Bump de caché (v108 -> v109): dos arreglos más en la
//                generación de planes (calendar.js). 1) Espaciado de
//                sesiones de calidad (series/tempo): con 3 o más días
//                duros seguidos en la semana (más probable en niveles
//                altos con muchos días de entreno), el algoritmo que los
//                separa podía perder la cuenta a partir del tercer día y
//                dejar dos sesiones duras seguidas sin corregir --
//                reescrito para recalcular el estado real en cada pasada
//                en vez de arrastrar una lista que se quedaba
//                desactualizada; probado con 5 casos, incluido uno que
//                un primer intento de arreglo dejaba peor que antes.
//                2) Estructura de pirámide de series: en sesiones largas
//                de verdad (avanzado + maratón en fase específica, hasta
//                120' de serie) la pirámide entera se repetía tantas
//                veces como cupiera sin ningún límite -- hasta 7 veces
//                seguidas, 49 intervalos en una sola sesión. Ahora el
//                tope es 3 pirámides completas.
// Versión: 2.33 - Bump de caché (v107 -> v108): varios modales se abrían
//                mostrando un "Cargando…"/"Calculando…" que desaparecía
//                casi al instante al llegar los datos reales -- el modal
//                de récords del perfil y el de "carga y recuperación" del
//                dashboard (calculan varias lecturas de Firestore) los
//                recalculaban SIEMPRE de cero cada vez que se abrían, sin
//                usar ninguna caché. Ahora ambos: 1) se pintan al
//                instante con los últimos datos en caché (sessionStorage)
//                si ya existen -- sin placeholder de carga -- y 2) esa
//                caché se precarga sola al entrar en la app (login,
//                sesión guardada) y se refresca en segundo plano cada vez
//                que se marca o desmarca una sesión, así que casi nunca
//                se abren "en blanco". Solo se ve un breve "Cargando…" la
//                primerísima vez que se abre un modal tras instalar la
//                app, antes de que exista ninguna caché todavía. La
//                caché de gamificación (récords, nivel, insignias) ya
//                existía a medias -- se escribía en sessionStorage desde
//                hace tiempo pero nada la leía nunca -- así que aquí
//                también se ha conectado esa lectura que faltaba.
// Versión: 2.32 - Bump de caché (v106 -> v107): dos correcciones más en el
//                mismo área (calendar.js). 1) La pantalla de detalle de
//                sesión y el registro de una sesión marcada SIN GPS
//                recalculaban el TSS/distancia llamando a
//                calcularMetricasSesion(sesion) sin el segundo argumento,
//                así que -- igual que el bug de la v106 -- volvían a
//                caer en factorIntensidad=1.0 y podían mostrar/guardar un
//                TSS distinto del que el plan había estimado para esa
//                misma sesión (p.ej. en una semana de descarga). Ahora
//                ambos sitios reutilizan sesion.detalle.tssEstimada /
//                distanciaEstimada, ya calculados correctamente al
//                generar el plan. 2) Verificada la base de datos de
//                869 sesiones (entrenamientos.js): 434 sesiones runner +
//                435 trail revisadas una a una (nombre, duración, zona
//                válida) sin errores.
// Versión: 2.31 - Bump de caché (v105 -> v106): corregido un segundo bug
//                más serio en el mismo área. El factor de intensidad de
//                cada semana (onda de periodización + ajuste por ACWR +
//                ajuste por feedback del usuario) viajaba correctamente
//                por toda la cadena de funciones
//                (generarCalendarioEntreno -> crearSesionDesdeMatriz ->
//                crearSesionBasica/crearSesionAvanzadaSeries) pero se
//                perdía en el último paso: _buildSesionDetalle llamaba a
//                calcularMetricasSesion(sesion, factorIntensidad = 1.0)
//                metiendo el factor DENTRO del objeto de sesión en vez de
//                pasarlo como segundo argumento (que es donde la función
//                realmente lo lee), así que TODAS las sesiones generadas
//                -- de cualquier semana, dura o de descarga -- calculaban
//                su TSS y distancia estimada como si factorIntensidad
//                fuera siempre 1.0. Esto también significaba que el aviso
//                "moderamos la intensidad" al detectar ACWR alto no tenía
//                ningún efecto real en el TSS calculado. Ahora el factor
//                de intensidad de cada semana sí se aplica de verdad.
// Versión: 2.30 - Bump de caché (v104 -> v105): corregida la generación de
//                planes de entrenamiento (calendar.js / PlanGenerator).
//                La "semana de descarga" del patrón ondulatorio de 4
//                semanas (ONDULACION_PATRONES) reducía el volumen
//                (duración) un 15% pero al mismo tiempo SUBÍA el factor
//                de intensidad un 15%, y como el TSS = duración × factor
//                de intensidad, los dos efectos se cancelaban casi del
//                todo (0.85 × 1.15 ≈ 0.98): la semana de "descarga" no
//                bajaba realmente la carga entrenada, solo tenía menos
//                minutos en el papel. Ahora la semana 4 de cada bloque de
//                4 semanas es una descarga real: intensidad y volumen
//                bajan juntos (no se compensan), con un patrón 3:1
//                clásico de periodización (3 semanas de progresión +
//                1 semana de descarga con caída real de TSS).
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
// Estrategia:
//   - App shell (HTML + JS propios) → Cache First
//   - Firebase / APIs externas → Network First (nunca se cachean)
//   - Leaflet, fuentes, iconos → Cache First
// =====================================================================

const CACHE_NAME = 'ri5-v130';

// Archivos del app shell que se precargan al instalar el SW
const PRECACHE_URLS = [
  './',
  './index.html',
  './guia.html',
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
  console.log('[SW] Instalando RI5 v111...');
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
