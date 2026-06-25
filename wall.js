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
      if (!document.hidden && document.querySelector('#tab-muro').classList.contains('active')) {
        this.cargarMuro();
      }
    });
  },

  iniciarActualizacionPeriodica() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (document.querySelector('#tab-muro').classList.contains('active')) {
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
      const snapshot = await firebaseServices.db
        .collection('globalFeed')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      this.currentEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  async _crearMiniMapa(containerId, trackPoints) {
    await this._cargarLeaflet();
    if (!window.L) return null;

    const container = document.getElementById(containerId);
    if (!container) return null;

    // Limpiar interior por si quedaba algo
    container.innerHTML = '';

    // Centro aproximado (primer punto)
    const center = { lat: trackPoints[0].lat, lng: trackPoints[0].lng };
    const map = window.L.map(container, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false
    }).setView([center.lat, center.lng], 13);

    // Tile layer de CartoDB (el mismo que GPSTrackViewer)
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB'
    }).addTo(map);

    // Dibujar la ruta
    const latlngs = trackPoints.map(p => [p.lat, p.lng]);
    const polyline = window.L.polyline(latlngs, {
      color: '#c0a060',
      weight: 5,
      opacity: 0.9
    }).addTo(map);

    // Ajustar el zoom para que quepa toda la ruta
    map.fitBounds(polyline.getBounds(), { padding: [10, 10] });

    // Guardar referencia para destruir después
    this.maps.push(map);

    return map;
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

        // ✅ CORREGIDO: escape de photoURL para evitar XSS
        const avatarHTML = entry.photoURL
          ? `<img src="${Utils.escapeHTML(entry.photoURL)}" class="wall-avatar" style="object-fit:cover;">`
          : `<div class="wall-avatar" style="background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;">👤</div>`;

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
          ? `<span style="font-size:10px; font-weight:600; letter-spacing:1px; color:#c0a060; background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.3); border-radius:20px; padding:2px 8px; margin-left:6px;">📍 GPS</span>`
          : '';

        // Contenedor para el mini mapa (solo si hay GPS)
        let miniMapContainer = '';
        if (entry.hasGPS && Array.isArray(entry.trackPoints) && entry.trackPoints.length >= 2) {
          const mapId = `miniMap_${entry.id}`;
          miniMapContainer = `
            <div id="${mapId}" class="gps-minimap-leaflet" data-entry-id="${entry.id}"
              style="margin-top:10px; border-radius:10px; overflow:hidden; border:1px solid #2a2a2a; cursor:pointer; height:130px; width:100%; background:#1a1a1a;">
            </div>
          `;
        }

        html += `
          <div class="wall-item" data-entry-id="${entry.id}">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                ${avatarHTML}
                <div>
                  <div class="wall-username">${Utils.escapeHTML(usernameFormatted)}</div>
                  <div class="wall-fecha">${fecha} · ${hora}</div>
                </div>
              </div>
              <button class="wall-like-btn ${likeClass}" data-entry-id="${entry.id}"
                style="background:transparent; border:none; padding:6px 12px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-size:14px; color:var(--text-secondary); transition:all 0.2s ease;">
                ❤️ <span class="like-count">${likeCount}</span>
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
        const container = document.getElementById(mapId);
        if (container) {
          this._crearMiniMapa(mapId, entry.trackPoints).then(map => {
            if (map) {
              // Al hacer clic en el mapa, abrir el visor completo
              container.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.GPSTrackViewer) GPSTrackViewer.open(entry);
              });
            }
          });
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
      const entryRef = firebaseServices.db.collection('globalFeed').doc(entryId);
      const doc = await entryRef.get();
      if (!doc.exists) { Utils.showToast('La publicación ya no existe', 'error'); return; }
      const data = doc.data();
      const likes = data.likes || [];
      if (likes.length === 0) {
        Utils.showToast('Nadie ha dado like a esta publicación aún', 'info');
        return;
      }
      const usersData = [];
      for (const uid of likes) {
        const userData = await Storage.getUser(uid);
        const nivel = await Friends.getNivelDirecto(uid);
        usersData.push(userData ? { uid, ...userData, nivel } : { uid, username: 'Usuario desconocido', profile: {}, nivel: 1 });
      }
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
    `;

    const modal = document.createElement('div');
    modal.id = 'likesModal';
    modal.className = 'modal';
    modal.style.cssText = `
      background:var(--bg-primary); border-radius:24px; max-width:500px;
      width:90%; max-height:80vh; overflow-y:auto; padding:20px;
      box-shadow:0 10px 30px rgba(0,0,0,0.3); border:1px solid var(--border-color);
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:10px; border-bottom:1px solid var(--border-color);';
    header.innerHTML = `
      <h3 style="margin:0; color:var(--accent-yellow);">❤️ Me gusta (${users.length})</h3>
      <button id="closeLikesModalBtn" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-secondary);">&times;</button>
    `;

    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'display:flex; flex-direction:column; gap:12px;';

    for (const user of users) {
      const photoURL = user.profile?.photoURL;
      const nivel = user.nivel || 1;
      const colorNivel = Gamification.getColorByLevel(nivel);
      const badgeStyle = `background:${colorNivel}; color:white; text-shadow:0 0 1px black; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; position:absolute; bottom:0; right:0; border:2px solid var(--bg-primary);`;

      const avatarHTML = photoURL
        ? `<div class="resultado-avatar-wrapper" style="position:relative;display:inline-block;width:48px;height:48px;overflow:visible;">
             <img src="${Utils.escapeHTML(photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
             <div class="nivel-badge" style="${badgeStyle}">${nivel}</div>
           </div>`
        : `<div class="resultado-avatar-wrapper" style="position:relative;display:inline-block;width:48px;height:48px;overflow:visible;">
             <div style="width:48px;height:48px;background:var(--bg-secondary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>
             <div class="nivel-badge" style="${badgeStyle}">${nivel}</div>
           </div>`;

      const usernameFormatted = Utils.capitalizeUsername(user.username);
      const userItem = document.createElement('div');
      userItem.style.cssText = 'display:flex; align-items:center; gap:12px; padding:8px; border-radius:16px; background:var(--bg-secondary); cursor:pointer; transition:background 0.2s;';
      userItem.innerHTML = `
        ${avatarHTML}
        <div style="flex:1;">
          <div style="font-weight:bold; color:var(--accent-yellow);">${Utils.escapeHTML(usernameFormatted)}</div>
          <div style="font-size:12px; color:var(--text-secondary);">@${Utils.escapeHTML(user.username)}</div>
        </div>
        <button class="view-profile-btn" data-uid="${user.uid}"
          style="background:var(--zone-2); border:none; padding:6px 12px; border-radius:20px; color:var(--bg-primary); cursor:pointer;">
          Ver perfil
        </button>
      `;
      userItem.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-profile-btn')) return;
        if (typeof Friends !== 'undefined' && Friends.abrirModalAmigo) {
          Friends.abrirModalAmigo(user.uid);
          this._closeLikesModal();
        }
      });
      const btn = userItem.querySelector('.view-profile-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof Friends !== 'undefined' && Friends.abrirModalAmigo) {
            Friends.abrirModalAmigo(user.uid);
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