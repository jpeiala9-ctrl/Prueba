// ==================== wall.js ====================
// Versión: 4.8 - Mini mapas Leaflet reales (CartoDB) en cada publicación del muro
// ====================

const Wall = {
  refreshInterval: null,
  currentEntries: [],
  container: null,
  isActive: false,
  loading: false,
  maps: [], // para almacenar referencias y destruirlas

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

  init() {
    this.container = document.getElementById('wallContainer');
    if (!this.container) return;
    this.detenerListener();
    this.cargarMuro();
    this.iniciarActualizacionPeriodica();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && document.querySelector('#subtab-muro')?.classList.contains('active')) {
        this.cargarMuro();
      }
    });
  },

  iniciarActualizacionPeriodica() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (document.querySelector('#subtab-muro')?.classList.contains('active')) {
        this.cargarMuro();
      }
    }, 30000);
  },

  detenerListener() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },

  async cargarMuro() {
    if (this.loading) return;
    this.loading = true;
    try {
      // El muro solo muestra publicaciones de hoy y de ayer: una sesión
      // subida el lunes desaparece del muro al llegar la medianoche del
      // martes (pasa a "anteayer"). Esto es solo un filtro de qué se
      // MUESTRA aquí: los documentos no se borran, porque el dashboard
      // (km/sesiones de esta semana) necesita seguir contándolos toda la
      // semana aunque ya no aparezcan en el muro.
      const inicioAyer = new Date();
      inicioAyer.setDate(inicioAyer.getDate() - 1);
      inicioAyer.setHours(0, 0, 0, 0);
      const inicioAyerTimestamp = firebaseServices.Timestamp.fromDate(inicioAyer);

      const snapshot = await firebaseServices.db
        .collection('globalFeed')
        .where('timestamp', '>=', inicioAyerTimestamp)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      this.currentEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Nivel de CADA autor (no el del usuario que mira el muro): se pide en
      // lote, una sola vez por tanda de publicaciones, reutilizando el mismo
      // helper que ya usa Friends para colorear avatares por nivel. Se
      // adjunta a cada entrada como '_nivel' (solo en memoria, no se guarda
      // en Firestore) para que render() pueda pintar el borde del avatar del
      // color de nivel real de quien publicó, no del que está mirando.
      try {
        const uids = [...new Set(this.currentEntries.map(e => e.userId).filter(Boolean))];
        const niveles = (typeof Friends !== 'undefined' && Friends.getNivelesDirectos)
          ? await Friends.getNivelesDirectos(uids)
          : {};
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

  render(entries) {
    if (!this.container) return;
    if (!entries || entries.length === 0) {
      this.container.innerHTML =
        '<p style="text-align:center; padding:40px;">No hay entrenamientos recientes. ¡Sé el primero en compartir!</p>';
      return;
    }

    // Destruir mapas anteriores para liberar memoria
    this._destruirMapas();

    let html = '';
    for (const entry of entries) {
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
        const duracion  = Number(entry.duration) || 0;
        const distancia = isFinite(Number(entry.distancia)) ? Number(entry.distancia).toFixed(2) : '0.00';
        const tss       = Number(entry.tss) || 0;
        const zone      = entry.zone || '';
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

        html += `
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
                <span>📏 ${distancia} km</span>
                <span>⚡ ${tss} TSS</span>
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
      }
    }

    if (!html) {
      this.container.innerHTML = '<p style="text-align:center; padding:40px;">No hay entrenamientos recientes.</p>';
      return;
    }

    this.container.innerHTML = html;

    // Inicializar mini mapas después de insertar el HTML
    for (const entry of entries) {
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
    }

    // Eventos de likes y clics
    this.container.querySelectorAll('.wall-like-btn').forEach(btn => {
      btn.removeEventListener('click', this._handleLikeClick);
      btn.addEventListener('click', this._handleLikeClick.bind(this));
    });
    this.container.querySelectorAll('.wall-item').forEach(item => {
      item.removeEventListener('click', this._handleItemClick);
      item.addEventListener('click', this._handleItemClick.bind(this));
    });
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
  },

  recargar() {
    this.cargarMuro();
  }
};

window.Wall = Wall;
console.log('✅ Wall v4.8 - Mini mapas Leaflet reales (CartoDB) en cada publicación');