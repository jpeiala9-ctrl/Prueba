// ==================== wall.js ====================
// Versión: 4.15 - Dos cambios a petición del usuario: (1) las
//                publicaciones del muro pasan de durar "hoy y ayer" (día
//                natural -- una sesión subida a las 23:50 casi
//                desaparecía a los 10 minutos) a durar 24h EXACTAS desde
//                que se publicaron, mediante un nuevo _limite24h()
//                (recalculado en cada consulta) más un timer local
//                (_iniciarPurgaPeriodica, cada 60s) que retira las
//                tarjetas ya caducadas de las que había en pantalla sin
//                gastar lecturas de Firestore -- necesario porque el
//                umbral de una consulta en tiempo real (onSnapshot) ya
//                suscrita no se mueve solo con el reloj. (2) fix de un
//                listener de 'visibilitychange' que se registraba SIN
//                quitar el anterior cada vez que Wall.init() se llamaba
//                (cada visita a la pestaña Muro) -- ahora se engancha una
//                sola vez.
// Versión: 4.14 - El auto-refresco pasa de sondeo periódico (cada 90s,
//                pagando ~20 lecturas SIEMPRE aunque no hubiera nada
//                nuevo) a un listener en tiempo real de Firestore
//                (onSnapshot): ahora solo se factura cuando de verdad
//                cambia algo (publicación nueva o un like en una ya
//                visible), y los cambios aparecen casi al instante en vez
//                de tardar hasta 90s. Se engancha/desengancha exactamente
//                cuando ya se hacía antes (entrar/salir de la pestaña
//                Muro, ver switchTab en app.js), así que no hace falta
//                tocar nada fuera de este archivo salvo quitar el
//                refresco manual redundante en calendar.js.
// Versión: 4.13 - FIX de cuota de lecturas de Firestore (ver capturas de
//                Uso y facturación, lecturas al 86.6% y ya entrando en
//                nivel de pago): cargarMuro()/cargarMas() pedían el nivel
//                de CADA autor otra vez a Firestore en cada llamada,
//                incluidos los mismos autores ya consultados en la vuelta
//                anterior. Con el auto-refresco cada 30s, eso repetía
//                hasta 20 lecturas de 'gamification' sin necesidad la
//                inmensa mayoría de las veces. Ahora se reutiliza
//                Friends._nivelesCache (misma caché persistente que ya
//                usa "Explorar") vía el nuevo Wall._obtenerNivelesConCache
//                -- cada autor solo se lee una vez por sesión. Además, el
//                auto-refresco pasa de 30s a 90s (menos lecturas de
//                'globalFeed' de las páginas ya vistas, sin perder que el
//                muro se sienta "vivo").
// Versión: 4.12 - Nuevo método Wall.centrarPublicacion(entryId): sustituye
//                el setTimeout fijo de 500ms que usaba index.html para
//                centrar la publicación al tocar una notificación de "me
//                gusta" desde Comunidad. Ese tiempo fijo no siempre
//                bastaba (cargarMuro() puede tardar más, ver comentario
//                junto al método), así que ahora se reintenta cada 200ms
//                hasta 4s en vez de comprobar una sola vez y rendirse.
// Versión: 4.11 - Paginación en el Muro: la primera carga sigue trayendo
//                20 publicaciones (dentro de hoy/ayer); si hay más
//                aparece un botón "CARGAR MÁS" al final que trae los 20
//                siguientes y los añade sin rehacer las que ya estaban
//                (no se pierde el scroll ni se reinicializan sus
//                mini-mapas). Extraídos _buildEntryHTML/_bindEntryEvents
//                de render() para poder reutilizarlos por tarjeta. La
//                actualización automática cada 30s se pausa mientras el
//                usuario tiene cargada más de una página, para no
//                interrumpirle el scroll con un reseteo a la primera.
// ====================

const Wall = {
  refreshInterval: null, // 🔥 legado v≤4.13 (sondeo); ya no se usa, se deja
                          // solo por si detenerListener() se llama desde
                          // código en caché de una versión anterior.
  _unsubscribe: null, // función para desengancharse del listener en vivo
  _visibilityHandlerEnganchado: false, // 🔥 v4.15: evita registrar el
                          // listener de 'visibilitychange' más de una vez
                          // (antes: cada Wall.init() -- es decir, cada vez
                          // que se entraba en la pestaña Muro -- añadía OTRO
                          // listener sin quitar los anteriores).
  _purgaIntervalId: null, // 🔥 v4.15: timer que retira en vivo las tarjetas
                          // que van cumpliendo 24h, sin releer Firestore.
  currentEntries: [],
  container: null,
  isActive: false,
  loading: false,
  maps: [], // para almacenar referencias y destruirlas
  _centrarTimeoutId: null,

  // Paginación: el muro carga de 20 en 20 (mismo límite de siempre para
  // la primera carga). "CARGAR MÁS" trae los 20 siguientes y los añade
  // al final sin rehacer los que ya estaban (así no se pierde la
  // posición del scroll ni se reinicializan sus mini-mapas).
  hayMasEntradas: false,
  cargandoMas: false,

  COLOR_ZONA: {
    z1: '#8AA0B0',
    z2: '#9BB5A0',
    z3: '#C9A78B',
    z4: '#C99BA5',
    z5: '#9AA5A5',
    z6: '#8A8A8A'
  },

  _colorZona(zona) {
    if (!zona) return null;
    const simple = zona.split('-')[0].trim().toLowerCase();
    return this.COLOR_ZONA[simple] || null;
  },

  // 🔥 v4.15: las publicaciones del muro ahora duran 24h EXACTAS desde que
  // se publicaron (antes: "hoy y ayer" por día natural -- una sesión
  // subida a las 23:50 casi desaparecía a los 10 minutos al llegar la
  // medianoche, y una subida a las 00:10 duraba casi 48h). Este límite se
  // recalcula cada vez que se llama (nunca se guarda fijo), porque un
  // listener de Firestore no puede "mover solo" el umbral de una consulta
  // ya activa según pasa el tiempo real.
  _limite24h() {
    return firebaseServices.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  },

  init() {
    this.container = document.getElementById('wallContainer');
    if (!this.container) return;
    this.detenerListener();
    this.iniciarListener();
    this._iniciarPurgaPeriodica();

    if (!this._visibilityHandlerEnganchado) {
      this._visibilityHandlerEnganchado = true;
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && document.querySelector('#subtab-muro')?.classList.contains('active') && !this._unsubscribe) {
          // Refresco de seguridad al volver de segundo plano: el listener en
          // tiempo real debería seguir sincronizado solo, pero si el móvil
          // cortó la conexión mientras la app estaba en segundo plano (algo
          // habitual para ahorrar batería), aquí se vuelve a enganchar. Es
          // una única reconexión puntual, no un sondeo repetido -- por eso
          // solo se hace si de verdad no hay listener activo (!this._unsubscribe).
          this.iniciarListener();
        }
      });
    }
  },

  // 🔥 v4.15: como el umbral de 24h de una consulta de Firestore ya
  // suscrita no se mueve solo con el reloj, las tarjetas que ya estaban
  // cargadas en pantalla podrían quedarse ahí más de 24h hasta el próximo
  // recarga/paginación. Este timer (cada 60s) recorre currentEntries y
  // retira del DOM (y del array) las que ya hayan cumplido 24h desde su
  // publicación -- sin gastar ninguna lectura de Firestore, es puramente
  // local con los datos que ya se tenían.
  _iniciarPurgaPeriodica() {
    if (this._purgaIntervalId) return;
    this._purgaIntervalId = setInterval(() => {
      if (!this.currentEntries.length || !this.container) return;
      const limiteMs = Date.now() - 24 * 60 * 60 * 1000;
      const caducadas = this.currentEntries.filter(e => (e.timestamp?.toMillis?.() || 0) < limiteMs);
      if (!caducadas.length) return;
      this.currentEntries = this.currentEntries.filter(e => (e.timestamp?.toMillis?.() || 0) >= limiteMs);
      caducadas.forEach(e => {
        this.container.querySelector(`.wall-item[data-entry-id="${e.id}"]`)?.remove();
      });
      if (!this.currentEntries.length) {
        this.container.innerHTML =
          '<p style="text-align:center; padding:40px;">No hay entrenamientos recientes. ¡Sé el primero en compartir!</p>';
      }
    }, 60 * 1000);
  },

  _detenerPurgaPeriodica() {
    if (this._purgaIntervalId) {
      clearInterval(this._purgaIntervalId);
      this._purgaIntervalId = null;
    }
  },

  // 🔥 v4.14: sustituye el sondeo periódico (antes: cargarMuro() cada 90s,
  // y 30s antes de eso -- ver v4.13) por un listener en tiempo real de
  // Firestore (onSnapshot). Diferencia de fondo en el coste: un .get()
  // paga sus ~20 lecturas SIEMPRE, haya cambiado algo o no; onSnapshot
  // solo factura lecturas cuando Firestore detecta un cambio real en el
  // resultado (una publicación nueva dentro de las últimas 24h, o un
  // like que modifica uno de los documentos ya visibles) -- si nadie
  // publica ni da like durante horas, esas horas no cuestan nada. Y en
  // vez de tardar hasta 90 segundos en aparecer, una publicación o un
  // like nuevos se ven en el Muro casi al instante (más rápido que antes,
  // no más lento).
  iniciarListener() {
    if (this._unsubscribe) return; // ya enganchado, no duplicar

    this._unsubscribe = firebaseServices.db
      .collection('globalFeed')
      .where('timestamp', '>=', this._limite24h())
      .orderBy('timestamp', 'desc')
      .limit(20)
      .onSnapshot(async (snapshot) => {
        // Si el usuario ya ha pedido más páginas (currentEntries > 20), el
        // repintado automático se pausa -- igual que antes con el sondeo --
        // para no perderle la posición del scroll ni lo cargado de más.
        if (this.currentEntries.length > 20) return;
        try {
          this.currentEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          this.hayMasEntradas = snapshot.docs.length === 20;

          const uids = [...new Set(this.currentEntries.map(e => e.userId).filter(Boolean))];
          const niveles = await this._obtenerNivelesConCache(uids);
          this.currentEntries.forEach(e => { e._nivel = niveles[e.userId] || 1; });

          this.render(this.currentEntries);
        } catch (e) {
          console.error('Error procesando actualización del muro:', e);
        }
      }, (error) => {
        console.error('Error en listener del muro:', error);
        if (this.container) this.container.innerHTML =
          '<p style="text-align:center; padding:40px; color:var(--zone-5);">Error al cargar el muro. Intenta recargar la página.</p>';
      });
  },

  detenerListener() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    // Legado del sondeo por si quedara un intervalo vivo de una versión
    // anterior en caché.
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this._detenerPurgaPeriodica();
  },

  // 🔥 v4.12: al tocar la notificación de "me gusta" desde Comunidad, se
  // pedía centrar la publicación con un único setTimeout fijo (500ms)
  // desde index.html, asumiendo que para entonces el Muro ya habría
  // terminado de cargar. Pero cargarMuro() encadena DOS idas y vueltas a
  // Firestore (la consulta de globalFeed y, después, el nivel de cada
  // autor vía Friends.getNivelesDirectos) antes de llamar a render() --
  // en una conexión normal eso puede tardar más de 500ms perfectamente,
  // y como la tarjeta todavía no existía en el DOM, el "centrado" no
  // hacía nada (ni error, ni reintento). Ahora es el propio Wall el que
  // ofrece este método: mira si la tarjeta ya está, y si no, reintenta
  // cada 200ms hasta 4s en vez de rendirse a la primera.
  centrarPublicacion(entryId, intentosRestantes = 20) {
    if (!entryId) return;
    if (this._centrarTimeoutId) {
      clearTimeout(this._centrarTimeoutId);
      this._centrarTimeoutId = null;
    }

    const el = this.container?.querySelector(`.wall-item[data-entry-id="${entryId}"]`)
      || document.querySelector(`#wallContainer .wall-item[data-entry-id="${entryId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 2px var(--gold)';
      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
      return;
    }

    if (intentosRestantes <= 0) {
      console.warn('[Wall] No se pudo centrar la publicación', entryId, '(no apareció en el muro a tiempo)');
      return;
    }
    this._centrarTimeoutId = setTimeout(() => {
      this._centrarTimeoutId = null;
      this.centrarPublicacion(entryId, intentosRestantes - 1);
    }, 200);
  },

  // 🔥 v4.13: FIX de lecturas de Firestore -- se pide un nivel por cada
  // autor DISTINTO que aparece en el muro (Friends.getNivelesDirectos),
  // pero antes se pedían TODOS otra vez en cada refresco, aunque ya se
  // hubieran pedido segundos antes: con el auto-refresco cada 30s, cada
  // vuelta repetía hasta 20 lecturas de 'gamification' que casi siempre
  // eran los MISMOS autores de la vuelta anterior (el muro no cambia de
  // gente cada 30 segundos). Esto, sumado a los años de uso, disparó la
  // cuota de lecturas de Firestore por primera vez a nivel de pago.
  // Ahora se reutiliza Friends._nivelesCache (la misma caché compartida y
  // persistente que ya usa la pantalla "Explorar amigos", ver friends.js)
  // -- solo se pide a Firestore el nivel de un autor la PRIMERA vez que
  // aparece en esta sesión; las siguientes veces (aquí o en Explorar) se
  // sirve de memoria, coste cero. Contrapartida asumida: si alguien sube
  // de nivel a media sesión, su color de avatar en el Muro no se
  // actualiza hasta recargar la app (ya era así en Explorar).
  async _obtenerNivelesConCache(uids) {
    if (!uids.length) return {};
    if (typeof Friends === 'undefined' || !Friends.getNivelesDirectos) return {};
    if (!Friends._nivelesCache) Friends._nivelesCache = {};
    const uidsNuevos = uids.filter(uid => !(uid in Friends._nivelesCache));
    if (uidsNuevos.length) {
      Object.assign(Friends._nivelesCache, await Friends.getNivelesDirectos(uidsNuevos));
    }
    return Friends._nivelesCache;
  },

  async cargarMuro() {
    if (this.loading) return;
    this.loading = true;
    try {
      // 🔥 v4.15: el muro muestra las publicaciones de las últimas 24h
      // EXACTAS desde que se publicaron (antes: "hoy y ayer" por día
      // natural). Esto sigue siendo solo un filtro de qué se MUESTRA
      // aquí: los documentos no se borran, porque el dashboard (km/
      // sesiones de esta semana) necesita seguir contándolos toda la
      // semana aunque ya no aparezcan en el muro.
      const snapshot = await firebaseServices.db
        .collection('globalFeed')
        .where('timestamp', '>=', this._limite24h())
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      this.currentEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Si llegaron 20 (el límite pedido), es probable que haya más --
      // se confirma de verdad al pulsar "CARGAR MÁS" (si esa página
      // siguiente viene vacía, se oculta el botón entonces).
      this.hayMasEntradas = snapshot.docs.length === 20;

      // Nivel de CADA autor (no el del usuario que mira el muro): se pide en
      // lote, una sola vez por tanda de publicaciones, reutilizando el mismo
      // helper que ya usa Friends para colorear avatares por nivel. Se
      // adjunta a cada entrada como '_nivel' (solo en memoria, no se guarda
      // en Firestore) para que render() pueda pintar el borde del avatar del
      // color de nivel real de quien publicó, no del que está mirando.
      try {
        const uids = [...new Set(this.currentEntries.map(e => e.userId).filter(Boolean))];
        const niveles = await this._obtenerNivelesConCache(uids);
        this.currentEntries.forEach(e => { e._nivel = niveles[e.userId] || 1; });
      } catch (e) {
        console.warn('Error obteniendo niveles del muro:', e);
      }

      this.render(this.currentEntries);
    } catch (error) {
      console.error('Error cargando muro:', error);
      if (this.container) this.container.innerHTML =
        '<p style="text-align:center; padding:40px; color:var(--zone-5);">Error al cargar el muro. Intenta recargar la página.</p>';
    } finally {
      this.loading = false;
    }
  },

  _destruirMapas() {
    if (this.maps.length) {
      this.maps.forEach(map => {
        if (map && map.remove) map.remove();
      });
      this.maps = [];
    }
  },

  _cargarLeaflet() {
    return new Promise((resolve) => {
      if (window.L) { resolve(); return; }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  },

  async _crearMiniMapa(containerId, trackPoints, entryId = null, esPropia = false) {
    await this._cargarLeaflet();
    if (!window.L) return null;

    const container = document.getElementById(containerId);
    if (!container) return null;

    // Limpiar interior por si quedaba algo
    container.innerHTML = '';

    // Esperar a que el navegador termine de asentar el layout antes de
    // que Leaflet mida el contenedor. Si el mapa se crea justo después de
    // inyectar el HTML (mismo tick), el contenedor puede no tener aún su
    // tamaño final (0 o incorrecto), y Leaflet calcula mal los mosaicos:
    // eso es lo que se veía como "medio mapa negro". Con un doble
    // requestAnimationFrame nos aseguramos de que ya hubo al menos un
    // pintado completo antes de inicializar.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // El contenedor pudo desaparecer mientras esperábamos (navegación
    // rápida, re-render de la lista, etc.)
    if (!document.body.contains(container)) return null;

    // Centro aproximado (primer punto)
    const center = { lat: trackPoints[0].lat, lng: trackPoints[0].lng };
    const map = window.L.map(container, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      tap: false
    }).setView([center.lat, center.lng], 13);

    // Tile layer de CartoDB (el mismo que GPSTrackViewer). crossOrigin:true
    // es necesario para poder "leer" luego el mapa como imagen (canvas) y
    // cachearlo -- sin esto el navegador bloquea la lectura del canvas por
    // seguridad (CORS), aunque el mapa se vea perfectamente en pantalla.
    const tileLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      crossOrigin: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB'
    }).addTo(map);

    // Dibujar la ruta
    const latlngs = trackPoints.map(p => [p.lat, p.lng]);
    const polyline = window.L.polyline(latlngs, {
      color: '#c0a060',
      weight: 5,
      opacity: 0.9
    }).addTo(map);

    // Forzar a Leaflet a re-medir el contenedor justo antes de encuadrar
    // la ruta (por si el tamaño cambió un pelín entre el rAF y ahora,
    // p.ej. por fuentes/imágenes que aún estaban cargando).
    map.invalidateSize();
    map.fitBounds(polyline.getBounds(), { padding: [10, 10] });

    // Segunda pasada de seguridad: en dispositivos lentos o listas que
    // siguen reflowing (paginación, imágenes de otros elementos
    // cargando debajo), el tamaño puede asentarse un poco más tarde
    // todavía. Esta comprobación extra no cuesta nada si ya estaba bien.
    setTimeout(() => {
      if (!document.body.contains(container)) return;
      map.invalidateSize();
      map.fitBounds(polyline.getBounds(), { padding: [10, 10] });

      // Captura y caché: SOLO para las propias sesiones del usuario (es
      // el único que tiene permiso de escritura en su documento de
      // globalFeed) y solo si todavía no tiene una imagen cacheada. Una
      // vez capturada, tanto el Muro como el Perfil la leen directamente
      // de Firestore como una <img> normal, sin volver a tocar Leaflet
      // -- así se ve exactamente igual en los dos sitios y no depende de
      // reinicializar el mapa (origen de los líos de tamaño/orientación).
      if (esPropia && entryId) {
        tileLayer.once('load', () => {
          setTimeout(() => this._capturarYCachearMiniMapa(map, container, latlngs, entryId), 150);
        });
        // Red de seguridad: si el evento 'load' no llega (todas las
        // teselas ya estaban en caché del navegador y no dispara 'load'
        // de nuevo), se intenta igualmente tras un margen prudente.
        setTimeout(() => this._capturarYCachearMiniMapa(map, container, latlngs, entryId), 900);
      }
    }, 300);

    // Guardar referencia para destruir después
    this.maps.push(map);

    return map;
  },

  // Convierte el mini-mapa Leaflet ya renderizado (teselas + ruta) en una
  // imagen (JPEG en base64) y la guarda en el propio documento de
  // globalFeed. Solo se ejecuta una vez por sesión (se comprueba
  // this._capturaEnCurso para no lanzarla dos veces desde el evento
  // 'load' y la red de seguridad a la vez, y luego el campo mapSnapshot
  // en Firestore hace que nunca se vuelva a intentar en el futuro).
  async _capturarYCachearMiniMapa(map, container, latlngs, entryId) {
    this._capturaEnCurso = this._capturaEnCurso || {};
    if (this._capturaEnCurso[entryId]) return;
    this._capturaEnCurso[entryId] = true;

    try {
      if (!document.body.contains(container) || !map) return;

      const rect = container.getBoundingClientRect();
      const w = Math.round(rect.width), h = Math.round(rect.height);
      if (w < 10 || h < 10) return;

      // Se guarda a un tamaño moderado (máx. 400px de ancho) para que la
      // imagen pese poco en Firestore -- es un documento que se lee muy a
      // menudo (Muro + Perfil), no hace falta resolución de pantalla.
      const escala = Math.min(1, 400 / w);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * escala);
      canvas.height = Math.round(h * escala);
      const ctx = canvas.getContext('2d');

      // 1) Teselas: se dibujan según su posición REAL en pantalla
      //    (getBoundingClientRect), así no depende de cómo las posicione
      //    Leaflet internamente (transforms, translate3d...).
      const tiles = container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile-loaded');
      tiles.forEach(tile => {
        const tr = tile.getBoundingClientRect();
        const x = (tr.left - rect.left) * escala;
        const y = (tr.top - rect.top) * escala;
        const tw = tr.width * escala, th = tr.height * escala;
        try { ctx.drawImage(tile, x, y, tw, th); } catch (e) { /* tesela suelta sin CORS: se ignora */ }
      });

      // 2) Ruta, proyectada con el propio Leaflet (latLngToContainerPoint)
      //    para que coincida exactamente con lo que se ve en pantalla.
      ctx.strokeStyle = '#c0a060';
      ctx.lineWidth = Math.max(2, 5 * escala);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      latlngs.forEach((ll, i) => {
        const p = map.latLngToContainerPoint(ll);
        const x = p.x * escala, y = p.y * escala;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Inicio: círculo blanco hueco
      const pStart = map.latLngToContainerPoint(latlngs[0]);
      ctx.beginPath();
      ctx.arc(pStart.x * escala, pStart.y * escala, Math.max(4, 7 * escala), 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(1.5, 2.5 * escala);
      ctx.stroke();

      // Final: bandera
      const pEnd = map.latLngToContainerPoint(latlngs[latlngs.length - 1]);
      ctx.font = `${Math.max(12, 16 * escala)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏁', pEnd.x * escala, pEnd.y * escala);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      // Si la mayoría de teselas fallaron por CORS, toDataURL puede
      // lanzar (canvas "tainted") -- ya queda cubierto por el try/catch
      // exterior. Si en cambio salió una imagen prácticamente vacía (muy
      // pequeña en bytes, señal de que no se dibujó casi nada), mejor no
      // guardarla y dejar que el mini-mapa en vivo siga funcionando como
      // hasta ahora.
      if (!dataUrl || dataUrl.length < 2000) return;

      await firebaseServices.db.collection('globalFeed').doc(entryId).update({ mapSnapshot: dataUrl });
    } catch (e) {
      console.warn('No se pudo cachear el mini-mapa de', entryId, e);
    }
  },

  // Construye el HTML de UNA tarjeta del muro. Extraído de render() para
  // poder reutilizarlo también al "cargar más" (añadir tarjetas nuevas al
  // final sin rehacer las que ya estaban). Devuelve '' si esa entrada en
  // concreto falla al renderizar (así una entrada corrupta no rompe el
  // resto de la lista, igual que antes).
  _buildEntryHTML(entry) {
    try {
      let fecha = '—', hora = '';
      try {
        if (entry.timestamp) {
          let dateObj = entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
          fecha = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          hora  = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (_) {}

      const likeCount = Number(entry.likeCount) || 0;
      const userLiked = Array.isArray(entry.likes) && entry.likes.includes(AppState.currentUserId);
      const likeClass = userLiked ? 'liked' : '';
      const esMiPublicacion = entry.userId === AppState.currentUserId;
      const likesNuevos = esMiPublicacion ? Math.max(0, likeCount - (Number(entry.likesLeidos) || 0)) : 0;
      const dotNuevoLike = likesNuevos > 0
        ? `<span class="like-new-dot" style="position:absolute; top:2px; right:2px; width:9px; height:9px; border-radius:50%; background:#e74c3c; border:2px solid var(--bg-secondary);"></span>`
        : '';

      // ✅ CORREGIDO: escape de photoURL para evitar XSS
      const colorNivelAutor = Gamification.getColorByLevel(entry._nivel || 1);
      const avatarHTML = entry.photoURL
        ? `<img src="${Utils.escapeHTML(entry.photoURL)}" class="wall-avatar" style="object-fit:cover; border:2px solid ${colorNivelAutor};" onerror="Utils.avatarFallback(this)">`
        : `<div class="wall-avatar" style="background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;border:2px solid ${colorNivelAutor};">👤</div>`;

      let tipoEmoji = '';
      switch (entry.trainingType) {
        case 'rodaje':   tipoEmoji = '🏃‍♂️'; break;
        case 'tempo':    tipoEmoji = '⚡';    break;
        case 'series':   tipoEmoji = '🔁';    break;
        case 'largo':    tipoEmoji = '📏';    break;
        case 'strength': tipoEmoji = '💪';    break;
        default:         tipoEmoji = '🏃';
      }

      const usernameFormatted = Utils.capitalizeUsername(entry.username || 'Usuario');
      const esFuerza = entry.trainingType === 'strength';
      const duracion  = Number(entry.duration) || 0;
      const distancia = isFinite(Number(entry.distancia)) ? Number(entry.distancia).toFixed(2) : '0.00';
      const tss       = Number(entry.tss) || 0;
      const calorias  = Number(entry.calorias) || 0;
      const zone      = esFuerza ? '' : (entry.zone || '');
      const trainingName = entry.trainingName || '';

      const tipoMostrado = trainingName
        ? Utils.escapeHTML(trainingName).toUpperCase()
        : Utils.escapeHTML(String(entry.trainingType || 'ENTRENO')).toUpperCase();

      const colorZona = this._colorZona(zone);

      const gpsBadge = entry.hasGPS
        ? `<span style="font-size:10px; font-weight:600; letter-spacing:1px; color:var(--gold); background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.3); border-radius:20px; padding:2px 8px; margin-left:6px;">📍 GPS</span>`
        : '';

      // Contenedor para el mini mapa (solo si hay GPS)
      let miniMapContainer = '';
      if (entry.hasGPS && Array.isArray(entry.trackPoints) && entry.trackPoints.length >= 2) {
        const mapId = `miniMap_${entry.id}`;
        const tapId = `miniMapTap_${entry.id}`;
        if (entry.mapSnapshot) {
          // Ya hay una imagen cacheada de este mini-mapa (capturada la
          // primera vez que se renderizó con Leaflet, ver
          // _capturarYCachearMiniMapa): se usa directamente como <img>,
          // igual de rápida y fiable en el Muro que en el Perfil, sin
          // volver a inicializar ningún mapa.
          miniMapContainer = `
            <div style="margin-top:10px; border-radius:10px; overflow:hidden; border:1px solid var(--border-color); height:130px; width:100%; position:relative;">
              <img src="${entry.mapSnapshot}" style="height:100%; width:100%; object-fit:cover; display:block; background:var(--stat-bg);">
              <div id="${tapId}" class="gps-minimap-tap" style="position:absolute; inset:0; z-index:5; cursor:pointer; background:transparent;"></div>
            </div>
          `;
        } else {
          // El div del mapa ("mapId") lo controla Leaflet, que a veces
          // consume/absorbe el primer toque para su propia gestión interna
          // de gestos (incluso con dragging/tap desactivados). Para que el
          // primer toque abra el visor SIEMPRE, se pone encima una capa
          // transparente ("tapId") sin ningún manejador de Leaflet, y el
          // clic se engancha ahí, no en el div del mapa.
          miniMapContainer = `
            <div style="margin-top:10px; border-radius:10px; overflow:hidden; border:1px solid var(--border-color); height:130px; width:100%; position:relative;">
              <div id="${mapId}" class="gps-minimap-leaflet" data-entry-id="${entry.id}"
                style="height:100%; width:100%; background:var(--stat-bg);">
              </div>
              <div id="${tapId}" class="gps-minimap-tap" style="position:absolute; inset:0; z-index:5; cursor:pointer; background:transparent;"></div>
            </div>
          `;
        }
      }

      return `
        <div class="wall-item" data-entry-id="${entry.id}">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <div class="wall-user-link" data-user-id="${Utils.escapeHTML(entry.userId || '')}" style="display:flex; align-items:center; gap:12px; cursor:pointer;">
              ${avatarHTML}
              <div>
                <div class="wall-username">${Utils.escapeHTML(usernameFormatted)}</div>
                <div class="wall-fecha">${fecha} · ${hora}</div>
              </div>
            </div>
            <button class="wall-like-btn ${likeClass}" data-entry-id="${entry.id}"
              style="position:relative; background:transparent; border:none; padding:6px 12px; border-radius:14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-size:14px; color:var(--text-secondary); transition:all 0.2s ease;">
              ❤️ <span class="like-count">${likeCount}</span>${dotNuevoLike}
            </button>
          </div>
          <div style="border:1px solid var(--border-color); border-radius:12px; padding:14px; text-align:center; background:var(--bg-primary); margin-top:4px;">
            <div style="font-size:14px; font-weight:500; margin-bottom:10px; display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:4px;">
              ${tipoEmoji} ${tipoMostrado}${gpsBadge}
            </div>
            <div style="display:flex; justify-content:space-around; align-items:center; gap:8px; color:var(--text-secondary); font-size:13px; margin-bottom:6px;">
              <span>⏱️ ${duracion}'</span>
              ${esFuerza
                ? (calorias > 0 ? `<span>🔥 ${calorias} kcal</span>` : '')
                : `<span>📏 ${distancia} km</span><span>⚡ ${tss} TSS</span>`}
            </div>
            <div style="color:var(--text-secondary); font-size:12px; display:flex; justify-content:center; align-items:center; gap:12px; margin-top:4px;">
              ${zone ? `<span style="color:${colorZona}; font-weight:500;">🔥 ${Utils.escapeHTML(zone)}</span>` : ''}
              ${hora ? `<span>🕒 ${hora}</span>` : ''}
            </div>
            ${miniMapContainer}
          </div>
        </div>
      `;
    } catch (err) {
      console.warn('Error renderizando entrada del muro:', err, entry);
      return '';
    }
  },

  // Engancha los listeners (like, clic en la tarjeta, mini-mapa) de UNA
  // tarjeta ya insertada en el DOM. Separado de render() para poder
  // llamarlo solo sobre las tarjetas NUEVAS al "cargar más", sin volver a
  // enganchar (duplicar) los listeners de las que ya estaban.
  _bindEntryEvents(entry) {
    if (entry.hasGPS && Array.isArray(entry.trackPoints) && entry.trackPoints.length >= 2) {
      const mapId = `miniMap_${entry.id}`;
      const tapId = `miniMapTap_${entry.id}`;
      const tapOverlay = document.getElementById(tapId);
      if (tapOverlay) {
        // El clic va en la capa transparente de encima, no en el div de
        // Leaflet (así Leaflet nunca llega a recibir el toque). Se usa un
        // 'click' normal, igual que en el resto de la tarjeta: antes se
        // usaba Utils.bindTap, que en su touchend llama a
        // e.preventDefault(), y eso deja "pegado" el :active de
        // .wall-item (scale 0.96) en móvil justo antes de abrir el
        // modal, dando la sensación de que la tarjeta se encoge y
        // rebota. Con un click normal se abre igual de directo que al
        // pulsar una sesión sin minimapa.
        tapOverlay.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.GPSTrackViewer) GPSTrackViewer.open(entry);
        });
      }
      // Si ya hay imagen cacheada (entry.mapSnapshot) se pintó como
      // <img> directamente en el HTML de arriba -- no hace falta tocar
      // Leaflet para nada. Solo se inicializa el mapa en vivo cuando
      // todavía no existe esa caché.
      if (!entry.mapSnapshot) {
        const mapContainer = document.getElementById(mapId);
        if (mapContainer) {
          const esPropia = entry.userId === AppState.currentUserId;
          this._crearMiniMapa(mapId, entry.trackPoints, entry.id, esPropia);
        }
      }
    }

    const item = this.container?.querySelector(`.wall-item[data-entry-id="${entry.id}"]`);
    if (!item) return;
    const likeBtn = item.querySelector('.wall-like-btn');
    if (likeBtn) likeBtn.addEventListener('click', this._handleLikeClick.bind(this));
    item.addEventListener('click', this._handleItemClick.bind(this));
  },

  // Añade (o quita) el botón "CARGAR MÁS" al final del muro, según si
  // queda algo más por cargar dentro de las últimas 24h.
  _actualizarBotonCargarMas() {
    document.getElementById('wallCargarMasContainer')?.remove();
    if (!this.hayMasEntradas || !this.container) return;
    const div = document.createElement('div');
    div.id = 'wallCargarMasContainer';
    div.style.cssText = 'display:flex; justify-content:center; padding:14px 0 4px;';
    div.innerHTML = `<button id="wallCargarMasBtn" class="action-button" style="width:auto; padding:0 28px; margin:0; background:transparent; border:1.5px solid var(--border-color-light);">CARGAR MÁS</button>`;
    this.container.appendChild(div);
    document.getElementById('wallCargarMasBtn')?.addEventListener('click', () => this.cargarMas());
  },

  // Trae los siguientes 20 (después de la última entrada ya cargada,
  // dentro de la misma ventana de 24h) y los añade al final del muro sin
  // rehacer las tarjetas que ya estaban.
  async cargarMas() {
    if (this.cargandoMas || !this.hayMasEntradas || !this.container) return;
    const ultimaEntrada = this.currentEntries[this.currentEntries.length - 1];
    if (!ultimaEntrada || !ultimaEntrada.timestamp) { this.hayMasEntradas = false; this._actualizarBotonCargarMas(); return; }

    this.cargandoMas = true;
    const btn = document.getElementById('wallCargarMasBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'CARGANDO...'; }

    try {
      const snapshot = await firebaseServices.db
        .collection('globalFeed')
        .where('timestamp', '>=', this._limite24h())
        .orderBy('timestamp', 'desc')
        .startAfter(ultimaEntrada.timestamp)
        .limit(20)
        .get();

      const nuevas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.hayMasEntradas = nuevas.length === 20;

      if (!nuevas.length) { this._actualizarBotonCargarMas(); return; }

      try {
        const uids = [...new Set(nuevas.map(e => e.userId).filter(Boolean))];
        const niveles = await this._obtenerNivelesConCache(uids);
        nuevas.forEach(e => { e._nivel = niveles[e.userId] || 1; });
      } catch (e) {
        console.warn('Error obteniendo niveles del muro (cargar más):', e);
      }

      this.currentEntries = this.currentEntries.concat(nuevas);

      document.getElementById('wallCargarMasContainer')?.remove();
      const html = nuevas.map(entry => this._buildEntryHTML(entry)).join('');
      this.container.insertAdjacentHTML('beforeend', html);
      nuevas.forEach(entry => this._bindEntryEvents(entry));
      this._actualizarBotonCargarMas();
    } catch (error) {
      console.error('Error cargando más del muro:', error);
      Utils.showToast('Error al cargar más publicaciones', 'error');
    } finally {
      this.cargandoMas = false;
    }
  },

  render(entries) {
    if (!this.container) return;
    document.getElementById('wallCargarMasContainer')?.remove();
    if (!entries || entries.length === 0) {
      this.container.innerHTML =
        '<p style="text-align:center; padding:40px;">No hay entrenamientos recientes. ¡Sé el primero en compartir!</p>';
      return;
    }

    // Destruir mapas anteriores para liberar memoria
    this._destruirMapas();

    const html = entries.map(entry => this._buildEntryHTML(entry)).join('');

    if (!html) {
      this.container.innerHTML = '<p style="text-align:center; padding:40px;">No hay entrenamientos recientes.</p>';
      return;
    }

    this.container.innerHTML = html;
    entries.forEach(entry => this._bindEntryEvents(entry));
    this._actualizarBotonCargarMas();
  },

  _handleLikeClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const entryId = btn.dataset.entryId;
    this.toggleLike(entryId, btn);
  },

  _handleItemClick(e) {
    if (e.target.closest('.wall-like-btn')) return;
    if (e.target.closest('.gps-minimap-leaflet')) return; // el mapa ya tiene su evento
    if (e.target.closest('.gps-minimap-tap')) return; // la capa de toque del minimapa ya tiene su evento
    const userLink = e.target.closest('.wall-user-link');
    if (userLink) {
      const userId = userLink.dataset.userId;
      // Se abre el mismo modal de perfil que se usa en el resto de la
      // app (Friends.abrirModalAmigo): si es amigo se ve su perfil
      // completo, y si no lo es, se ve con la opción de agregar como
      // amigo. Si es tu propia publicación, muestra "TU PERFIL".
      if (userId && window.Friends) Friends.abrirModalAmigo(userId);
      return;
    }
    const item = e.currentTarget;
    const entryId = item.dataset.entryId;
    this.showLikesModal(entryId);
  },

  async toggleLike(entryId, btnElement) {
    if (!AppState.currentUserId) {
      Utils.showToast('Inicia sesión para dar like', 'warning');
      return;
    }

    const likeSpan = btnElement.querySelector('.like-count');
    const currentCount = parseInt(likeSpan.textContent, 10) || 0;
    const isLiked = btnElement.classList.contains('liked');

    let newCount = isLiked ? currentCount - 1 : currentCount + 1;
    likeSpan.textContent = newCount;
    isLiked ? btnElement.classList.remove('liked') : btnElement.classList.add('liked');

    const entryRef = firebaseServices.db.collection('globalFeed').doc(entryId);
    try {
      if (isLiked) {
        await entryRef.update({
          likes: firebaseServices.FieldValue.arrayRemove(AppState.currentUserId),
          likeCount: firebaseServices.FieldValue.increment(-1)
        });
      } else {
        await entryRef.update({
          likes: firebaseServices.FieldValue.arrayUnion(AppState.currentUserId),
          likeCount: firebaseServices.FieldValue.increment(1)
        });
      }
      if (typeof Utils.vibrate === 'function') Utils.vibrate(isLiked ? 30 : 50);
    } catch (error) {
      console.error('Error al dar/quitar like:', error);
      likeSpan.textContent = currentCount;
      isLiked ? btnElement.classList.add('liked') : btnElement.classList.remove('liked');
      Utils.showToast('Error al procesar like', 'error');
    }
  },

  async showLikesModal(entryId) {
    if (!entryId) return;
    try {
      // La entrada ya está en memoria (viene del feed cargado en pantalla),
      // así que se lee de ahí en vez de volver a pedirla a Firestore.
      // Antes se hacía SIEMPRE un entryRef.get() aquí, aunque la
      // publicación ya se estuviera viendo en el muro.
      let data = this.currentEntries.find(e => e.id === entryId);
      let entryRef = firebaseServices.db.collection('globalFeed').doc(entryId);
      if (!data) {
        const doc = await entryRef.get();
        if (!doc.exists) { Utils.showToast('La publicación ya no existe', 'error'); return; }
        data = doc.data();
      }
      const likes = data.likes || [];

      // Si es mi propia publicación, al abrir la lista de likes se
      // consideran todos "vistos" (se actualiza el marcador para que
      // desaparezca el aviso de "like nuevo" y baje el contador de la
      // campanita de Comunidad).
      if (data.userId === AppState.currentUserId) {
        const likeCount = Number(data.likeCount) || 0;
        const likesLeidos = Number(data.likesLeidos) || 0;
        if (likeCount > likesLeidos) {
          entryRef.update({ likesLeidos: likeCount }).catch(e => console.warn('Error marcando likes como vistos:', e));
          const dot = document.querySelector(`.wall-item[data-entry-id="${entryId}"] .like-new-dot`);
          if (dot) dot.remove();
        }
      }

      if (likes.length === 0) {
        Utils.showToast('Nadie ha dado like a esta publicación aún', 'info');
        return;
      }

      // Se piden los datos de todos los usuarios EN PARALELO (Promise.all)
      // en vez de uno a uno con await secuencial: antes, con 20 likes,
      // el modal se quedaba varios segundos en blanco esperando a que
      // cada usuario se resolviera antes de pasar al siguiente.
      const usersData = await Promise.all(likes.map(async (uid) => {
        const [userData, nivel] = await Promise.all([
          Storage.getUser(uid),
          Friends.getNivelDirecto(uid)
        ]);
        return userData ? { uid, ...userData, nivel } : { uid, username: 'Usuario desconocido', profile: {}, nivel: 1 };
      }));
      this._createLikesModal(usersData);
    } catch (error) {
      console.error('Error al obtener likes:', error);
      Utils.showToast('Error al cargar los likes', 'error');
    }
  },

  _createLikesModal(users) {
    const existingModal = document.getElementById('likesModal');
    const existingOverlay = document.getElementById('likesModalOverlay');
    if (existingModal) existingModal.remove();
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'likesModalOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);
      z-index:2000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'likesModal';
    modal.className = 'modal';
    modal.style.cssText = `
      background:var(--bg-primary); border-radius:24px; max-width:500px;
      width:90%; max-height:80vh; overflow-y:auto; overflow-x:hidden;
      box-sizing:border-box; padding:20px;
      box-shadow:0 10px 30px rgba(0,0,0,0.3); border:1px solid var(--border-color);
      opacity:0; transition:opacity 0.2s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:10px; border-bottom:1px solid var(--border-color);';
    header.innerHTML = `
      <h3 style="margin:0; color:var(--accent-yellow);">❤️ Me gusta (${users.length})</h3>
      <button id="closeLikesModalBtn" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-secondary);">&times;</button>
    `;

    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'display:flex; flex-direction:column; gap:12px; width:100%; box-sizing:border-box;';

    for (const user of users) {
      const photoURL = user.profile?.photoURL;
      const nivel = user.nivel || 1;
      const colorNivel = Gamification.getColorByLevel(nivel);
      const badgeStyle = `background:${colorNivel}; color:white; text-shadow:0 0 1px black; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; position:absolute; bottom:0; right:0; border:2px solid var(--bg-primary);`;

      const avatarHTML = photoURL
        ? `<div class="resultado-avatar-wrapper" style="position:relative;display:inline-block;flex-shrink:0;width:48px;height:48px;overflow:visible;">
             <img src="${Utils.escapeHTML(photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid ${colorNivel};" onerror="Utils.avatarFallback(this)">
             <div class="nivel-badge" style="${badgeStyle}">${nivel}</div>
           </div>`
        : `<div class="resultado-avatar-wrapper" style="position:relative;display:inline-block;flex-shrink:0;width:48px;height:48px;overflow:visible;">
             <div style="width:48px;height:48px;background:var(--bg-secondary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;border:2px solid ${colorNivel};">👤</div>
             <div class="nivel-badge" style="${badgeStyle}">${nivel}</div>
           </div>`;

      const usernameFormatted = Utils.capitalizeUsername(user.username);
      const userItem = document.createElement('div');
      userItem.style.cssText = 'display:flex; align-items:center; gap:10px; padding:8px; border-radius:16px; background:var(--bg-secondary); cursor:pointer; transition:background 0.2s; width:100%; box-sizing:border-box;';
      userItem.innerHTML = `
        ${avatarHTML}
        <div style="flex:1; min-width:0;">
          <div style="font-weight:bold; color:var(--accent-yellow); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${Utils.escapeHTML(usernameFormatted)}</div>
          <div style="font-size:12px; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">@${Utils.escapeHTML(user.username)}</div>
        </div>
        <div style="flex-shrink:0; width:60px; display:flex; justify-content:center;">
          <button class="view-profile-btn" data-uid="${user.uid}"
            style="background:var(--zone-2); border:none; padding:3px 7px; border-radius:10px; color:var(--bg-primary); cursor:pointer; white-space:nowrap; font-size:9px; line-height:1.4;">
            Ver perfil
          </button>
        </div>
      `;
      userItem.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-profile-btn')) return;
        if (typeof Friends !== 'undefined' && Friends.abrirModalAmigo) {
          await Friends.abrirModalAmigo(user.uid);
          this._closeLikesModal();
        }
      });
      const btn = userItem.querySelector('.view-profile-btn');
      if (btn) {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (typeof Friends !== 'undefined' && Friends.abrirModalAmigo) {
            await Friends.abrirModalAmigo(user.uid);
            this._closeLikesModal();
          }
        });
      }
      listContainer.appendChild(userItem);
    }

    modal.appendChild(header);
    modal.appendChild(listContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

    document.getElementById('closeLikesModalBtn')?.addEventListener('click', () => this._closeLikesModal());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeLikesModal(); });
  },

  _closeLikesModal() {
    document.getElementById('likesModal')?.remove();
    document.getElementById('likesModalOverlay')?.remove();
  }
};

window.Wall = Wall;
console.log('✅ Wall v4.15 - Publicaciones caducan a las 24h exactas de publicarse + fix de listener duplicado');