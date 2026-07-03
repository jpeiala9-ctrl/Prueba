// ==================== profile.js ====================
// Versión: 11.0 - ARQUITECTURA DE RENDERIZADO SEGURO
//                 - Event delegation UNICO en contenedor
//                 - Botones con onclick en HTML
//                 - Renderizado con bloqueo de concurrencia
//                 - Modal de likes independiente
// ====================

const Profile = {
  _gpsEntries: {},
  _renderLock: false,
  _lastHtml: null,

  async cargarPerfil(forceRefresh = true) {
    // Evitar renders simultáneos
    if (this._renderLock) {
      console.log('⏳ Render en curso, esperando...');
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!this._renderLock) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
    }

    this._renderLock = true;

    try {
      const container = document.getElementById('perfilContainer');
      if (!container || !AppState.currentUserId) {
        console.warn('⚠️ cargarPerfil: contenedor no encontrado');
        this._renderLock = false;
        return;
      }

      // --- 1. OBTENER DATOS ---
      console.time('cargarPerfil');
      
      const userRef = firebaseServices.db.collection('users').doc(AppState.currentUserId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Limpiar amigos huérfanos
      let friendIds = userData.friendIds || [];
      const amigosValidos = [];
      for (let i = 0; i < friendIds.length; i += 10) {
        const chunk = friendIds.slice(i, i + 10);
        const snapshot = await firebaseServices.db.collection('users')
          .where('__name__', 'in', chunk)
          .get();
        snapshot.forEach(doc => amigosValidos.push(doc.id));
      }
      if (amigosValidos.length !== friendIds.length) {
        await userRef.update({ friendIds: amigosValidos, friendsCount: amigosValidos.length });
        userData.friendIds = amigosValidos;
      }

      const profile = userData.profile || {};
      const amigosReales = amigosValidos.length;

      // Gamificación
      let gamificationData = await Gamification.getData(AppState.currentUserId);
      if (!gamificationData) {
        gamificationData = Gamification.getDefaultData();
        await firebaseServices.db.collection('gamification').doc(AppState.currentUserId).set(gamificationData);
      }

      const shoe = await Gamification.getCurrentShoe(AppState.currentUserId);
      
      // Últimos entrenamientos
      const entrenamientosSnapshot = await firebaseServices.db
        .collection('globalFeed')
        .where('userId', '==', AppState.currentUserId)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

      // --- 2. CONSTRUIR HTML ---
      const html = this._buildProfileHTML(userData, profile, amigosReales, gamificationData, shoe, entrenamientosSnapshot);
      
      // --- 3. RENDERIZAR SOLO SI CAMBIO ---
      if (forceRefresh || html !== this._lastHtml) {
        container.innerHTML = html;
        this._lastHtml = html;
        console.log('✅ Perfil renderizado');

        // Guardar en caché
        try {
          localStorage.setItem(`perfil_${AppState.currentUserId}`, JSON.stringify({
            html: html,
            timestamp: Date.now()
          }));
        } catch (e) {}
      } else {
        console.log('📦 Perfil sin cambios, usando caché');
      }

      // --- 4. UN SOLO DELEGADO DE EVENTOS ---
      // Limpiar listeners anteriores y añadir uno único
      container.removeEventListener('click', this._handleContainerClick);
      container.addEventListener('click', this._handleContainerClick.bind(this));

      console.timeEnd('cargarPerfil');

    } catch (error) {
      console.error('Error cargando perfil:', error);
      const container = document.getElementById('perfilContainer');
      if (container) {
        container.innerHTML = '<p style="text-align:center; color:var(--zone-5); padding:40px;">Error al cargar perfil. Recarga la página.</p>';
      }
    } finally {
      this._renderLock = false;
    }
  },

  // ================================================================
  //  CONSTRUCCIÓN DEL HTML
  // ================================================================
  _buildProfileHTML(userData, profile, amigosReales, gamificationData, shoe, entrenamientosSnapshot) {
    const photoHTML = profile.photoURL
      ? `<img src="${Utils.escapeHTML(profile.photoURL)}" class="perfil-avatar" style="object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
      : `<div class="perfil-avatar-placeholder">👤</div>`;

    // --- Gamificación ---
    let gamHTML = '';
    if (gamificationData) {
      const levelColor = Gamification.getColorByLevel(gamificationData.level);
      const progress = Gamification.getProgressToNextLevel(gamificationData.totalDistance);
      const nextLevel = Gamification.LEVELS_KM.find(l => l.level === gamificationData.level + 1);
      const nextKm = nextLevel ? nextLevel.kmNeeded : gamificationData.totalDistance;
      
      const shoeName = (shoe && shoe.name) ? shoe.name : 'Zapatilla actual';
      const shoeKm = (shoe && shoe.km) ? shoe.km.toFixed(1) : '0.0';

      const badgesIcons = (gamificationData.badges || []).map(badgeId => {
        const badge = Gamification.BADGES[badgeId];
        if (!badge) return '';
        return `<span class="badge-icon" data-badge-id="${badgeId}" style="display:inline-block; font-size:28px; margin:0 6px; cursor:pointer;" title="${badge.name} - ${badge.description} (+${badge.xp} XP)">${badge.icon}</span>`;
      }).filter(b => b).join('');

      gamHTML = `
        <div class="passport-card" style="margin-top:24px; border:2px solid ${levelColor}; border-radius:24px; background:rgba(0,0,0,0.05); overflow:hidden;">
          <div style="padding:16px 20px 0 20px; text-align:center; border-bottom:1px solid ${levelColor}40;">
            <span style="font-size:16px; font-weight:500; letter-spacing:1px; color:${levelColor};">${Utils.escapeHTML(Utils.capitalizeUsername(userData.username))}</span>
          </div>
          <div style="padding:16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="flex:1; text-align: center;">
                <div style="font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--text-secondary);">Nivel</div>
                <strong style="font-size:36px; font-weight:300; color:${levelColor};">${gamificationData.level}</strong>
              </div>
              <div style="flex:1; text-align: right;">
                <div style="font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--text-secondary);">Zapatilla actual</div>
                <strong style="font-size:14px;">${Utils.escapeHTML(shoeName)}</strong>
                <div style="font-size:12px; opacity:0.8;">${shoeKm} km</div>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="background:var(--border-color); height:3px; border-radius:3px; overflow:hidden;">
                <div style="width: ${progress}%; background: ${levelColor}; height:3px;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:4px;">
                <span style="font-size:8px;">0 km</span>
                <span style="font-size:8px;">${gamificationData.totalDistance.toFixed(0)} km</span>
                <span style="font-size:8px;">${nextKm} km</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; text-align: center;">
              <div style="flex:1;">
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">📏 DISTANCIA</div>
                <strong style="font-size:18px;">${gamificationData.totalDistance.toFixed(1)}</strong>
                <span style="font-size:11px;"> km</span>
              </div>
              <div style="flex:1;">
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">🎯 SESIONES</div>
                <strong style="font-size:18px;">${gamificationData.totalSessions}</strong>
              </div>
              <div style="flex:1;">
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">✨ XP</div>
                <strong style="font-size:18px;">${gamificationData.totalXP}</strong>
              </div>
            </div>
            ${badgesIcons ? `<div style="border-top:1px solid ${levelColor}40; padding-top:16px; margin-bottom:16px;">
              <div style="font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">🏅 Sellos de progreso</div>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${badgesIcons}</div>
            </div>` : '<p style="text-align:center; font-size:11px; margin-bottom:16px;">Completa entrenamientos para desbloquear sellos</p>'}
            <div style="display: flex; justify-content: center; gap: 12px; margin-top:8px;">
              <button onclick="Profile._mostrarModalCambiarZapatilla()" style="background:transparent; border:1px solid ${levelColor}; color:${levelColor}; padding:2px 10px; border-radius:30px; font-size:10px; letter-spacing:0.5px; cursor:pointer;">👟 Cambiar</button>
              <button onclick="Profile._mostrarModalHistorial()" style="background:transparent; border:1px solid ${levelColor}; color:${levelColor}; padding:2px 10px; border-radius:30px; font-size:10px; letter-spacing:0.5px; cursor:pointer;">📜 Historial</button>
            </div>
          </div>
        </div>
      `;
    }

    // --- Últimos entrenamientos ---
    let entrenamientosHTML = '';
    if (entrenamientosSnapshot && !entrenamientosSnapshot.empty) {
      entrenamientosHTML = `
        <div class="mis-entrenamentos-section" style="margin-top:24px; margin-bottom:24px; background:var(--bg-secondary); border-radius:16px; padding:16px;">
          <h3 style="margin-top:0; margin-bottom:16px; text-align:left; font-size:18px;">📋 MIS ÚLTIMOS ENTRENAMIENTOS</h3>
      `;
      
      for (const doc of entrenamientosSnapshot.docs) {
        const entry = doc.data();
        const entryId = doc.id;
        
        let fecha = '—', hora = '';
        if (entry.timestamp) {
          const dateObj = entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
          fecha = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          hora = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const likeCount = Number(entry.likeCount) || 0;
        const tipoEmoji = { rodaje: '🏃‍♂️', tempo: '⚡', series: '🔁', largo: '📏', strength: '💪' }[entry.trainingType] || '🏃';
        const tipoMostrado = (entry.trainingName || entry.trainingType || 'ENTRENO').toUpperCase();
        const distancia = isFinite(Number(entry.distancia)) ? Number(entry.distancia).toFixed(2) : '0.00';
        const duracion = Number(entry.duration) || 0;
        const tss = Number(entry.tss) || 0;
        const zone = entry.zone || '';
        const gpsBadge = entry.hasGPS ? `<span style="font-size:10px; font-weight:600; letter-spacing:1px; color:#c0a060; background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.3); border-radius:20px; padding:2px 8px; margin-left:6px;">📍 GPS</span>` : '';

        let miniMapHTML = '';
        if (entry.hasGPS && Array.isArray(entry.trackPoints) && entry.trackPoints.length >= 2) {
          const mapSVG = (window.GPSTracker && typeof GPSTracker.renderTrackSVG === 'function')
            ? GPSTracker.renderTrackSVG(entry.trackPoints, 320, 130)
            : '';
          if (mapSVG) {
            const distReal = entry.gpsDistanceKm ? Number(entry.gpsDistanceKm).toFixed(2) + ' km' : '';
            miniMapHTML = `
              <div class="gps-minimap-tap-profile" data-entry-id="${entryId}"
                style="margin-top:10px;border-radius:10px;overflow:hidden; border:1px solid #2a2a2a; cursor:pointer; position:relative;">
                ${mapSVG}
                <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom:10px; pointer-events:none;">
                  <div style="background:rgba(0,0,0,0.72); color:#c0a060; font-size:10px; letter-spacing:1.5px; padding:5px 14px; border-radius:20px; border:1px solid rgba(192,160,96,0.35); font-family:'Courier New',monospace;">
                    🗺 VER RECORRIDO${distReal ? ' · 📍 ' + distReal : ''}
                  </div>
                </div>
              </div>
            `;
            // Guardar para el visor
            this._gpsEntries[entryId] = { ...entry, id: entryId };
          }
        }

        entrenamientosHTML += `
          <div class="perfil-sesion-item" data-entry-id="${entryId}" style="margin-bottom:16px; background:var(--bg-primary); border-radius:12px; padding:12px; border:1px solid var(--border-color);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:24px;">${tipoEmoji}</div>
                <div>
                  <div style="font-weight:500; color:var(--accent-blue);">${Utils.escapeHTML(tipoMostrado)}</div>
                  <div style="font-size:11px; color:var(--text-secondary);">${fecha} · ${hora}</div>
                </div>
              </div>
              <button class="perfil-like-btn" data-entry-id="${entryId}" style="background:transparent; border:none; padding:6px 12px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-size:14px; color:var(--text-secondary); transition:all 0.2s ease;">
                ❤️ <span class="like-count">${likeCount}</span>
              </button>
            </div>
            <div style="display:flex; justify-content:space-around; align-items:center; gap:8px; color:var(--text-secondary); font-size:13px; margin-bottom:6px; flex-wrap:wrap;">
              <span>⏱️ ${duracion}'</span>
              <span>📏 ${distancia} km</span>
              <span>⚡ ${tss} TSS</span>
              ${zone ? `<span style="color:var(--zone-${zone.replace('Z','')});">🔥 ${Utils.escapeHTML(zone)}</span>` : ''}
              ${gpsBadge}
            </div>
            ${miniMapHTML}
          </div>
        `;
      }
      
      entrenamientosHTML += `</div>`;
    } else {
      entrenamientosHTML = `
        <div style="margin-top:24px; margin-bottom:24px; background:var(--bg-secondary); border-radius:16px; padding:16px; text-align:center;">
          <h3 style="margin-top:0; margin-bottom:8px;">📋 MIS ÚLTIMOS ENTRENAMIENTOS</h3>
          <p style="font-size:14px;">Aún no has compartido ningún entrenamiento.<br>Completa sesiones en la pestaña PLAN y márcalas como realizadas.</p>
        </div>
      `;
    }

    // --- HTML COMPLETO ---
    return `
      <div class="perfil-header">
        ${photoHTML}
        <div class="perfil-info">
          <div class="perfil-nombre">${Utils.escapeHTML(Utils.capitalizeUsername(userData.username))}</div>
          <div class="perfil-username">@${Utils.escapeHTML(userData.username)}</div>
          <div class="perfil-stats">
            <div class="perfil-stat"><span>${amigosReales}</span><label>Amigos</label></div>
            <div class="perfil-stat"><span>${userData.calculosMes || 0}</span><label>Cálculos/mes</label></div>
            <div class="perfil-stat"><span>${userData.premium ? 'PREMIUM' : 'GRATIS'}</span><label>Plan</label></div>
          </div>
        </div>
      </div>
      <div class="perfil-detalle-grid" style="grid-template-columns: repeat(2, 1fr) !important;">
        <div class="perfil-detalle-item"><span class="label">BIO</span><span class="value">${Utils.escapeHTML(profile.bio || '—')}</span></div>
        <div class="perfil-detalle-item"><span class="label">CIUDAD</span><span class="value">${Utils.escapeHTML(profile.city || '—')}</span></div>
        <div class="perfil-detalle-item"><span class="label">EDAD</span><span class="value">${profile.age ? Utils.escapeHTML(profile.age + ' años') : '—'}</span></div>
        <div class="perfil-detalle-item"><span class="label">GÉNERO</span><span class="value">${profile.gender === 'male' ? 'Hombre' : profile.gender === 'female' ? 'Mujer' : profile.gender === 'other' ? 'Otro' : '—'}</span></div>
        <div class="perfil-detalle-item"><span class="label">PESO</span><span class="value">${profile.weight ? Utils.escapeHTML(profile.weight + ' kg') : '—'}</span></div>
        <div class="perfil-detalle-item"><span class="label">ALTURA</span><span class="value">${profile.height ? Utils.escapeHTML(profile.height + ' cm') : '—'}</span></div>
        <div class="perfil-detalle-item" style="grid-column: span 2;">
          <span class="label">EMAIL</span>
          <span class="value">${Utils.escapeHTML(userData.email)}</span>
        </div>
      </div>
      ${gamHTML}
      ${entrenamientosHTML}
    `;
  },

  // ================================================================
  //  EVENT DELEGATION UNICO
  // ================================================================
  _handleContainerClick(e) {
    const target = e.target;
    
    // --- 1. BOTONES DE ZAPATILLA ---
    // Detectamos por texto o por función onclick
    if (target.tagName === 'BUTTON') {
      const text = target.textContent.trim();
      if (text === '👟 Cambiar' || text === 'Cambiar') {
        e.preventDefault();
        e.stopPropagation();
        this._mostrarModalCambiarZapatilla();
        return;
      }
      if (text === '📜 Historial' || text === 'Historial') {
        e.preventDefault();
        e.stopPropagation();
        this._mostrarModalHistorial();
        return;
      }
    }

    // --- 2. BADGES ---
    if (target.classList.contains('badge-icon')) {
      e.preventDefault();
      e.stopPropagation();
      this._mostrarModalInsignias();
      return;
    }

    // --- 3. BOTONES DE LIKE ---
    const likeBtn = target.closest('.perfil-like-btn');
    if (likeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const entryId = likeBtn.dataset.entryId;
      if (entryId) {
        this._mostrarLikesDeEntrenamiento(entryId);
      }
      return;
    }

    // --- 4. MINI MAPA (GPS) ---
    const mapElement = target.closest('.gps-minimap-tap-profile');
    if (mapElement) {
      e.preventDefault();
      e.stopPropagation();
      const entryId = mapElement.dataset.entryId;
      const entry = this._gpsEntries[entryId];
      if (entry && window.GPSTrackViewer) {
        GPSTrackViewer.open(entry);
      }
      return;
    }

    // --- 5. SESIÓN COMPLETA (click en cualquier parte de la tarjeta) ---
    const sessionItem = target.closest('.perfil-sesion-item');
    if (sessionItem) {
      // Si el click fue en un botón de like o en el mapa, ya lo manejamos arriba
      if (target.closest('.perfil-like-btn')) return;
      if (target.closest('.gps-minimap-tap-profile')) return;
      
      e.preventDefault();
      e.stopPropagation();
      const entryId = sessionItem.dataset.entryId;
      if (entryId) {
        this._mostrarLikesDeEntrenamiento(entryId);
      }
      return;
    }
  },

  // ================================================================
  //  MOSTRAR LIKES (INDEPENDIENTE DE WALL)
  // ================================================================
  async _mostrarLikesDeEntrenamiento(entryId) {
    if (!entryId) return;
    
    Utils.showLoading();
    try {
      const doc = await firebaseServices.db.collection('globalFeed').doc(entryId).get();
      if (!doc.exists) {
        Utils.hideLoading();
        Utils.showToast('La publicación ya no existe', 'error');
        return;
      }
      
      const data = doc.data();
      const likes = data.likes || [];
      
      if (likes.length === 0) {
        Utils.hideLoading();
        Utils.showToast('Nadie ha dado like a esta publicación aún', 'info');
        return;
      }

      const usersData = [];
      for (const uid of likes) {
        const userData = await Storage.getUser(uid);
        usersData.push(userData ? { uid, ...userData } : { uid, username: 'Usuario desconocido', profile: {} });
      }
      
      Utils.hideLoading();
      this._crearModalLikes(usersData);
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Error cargando likes:', error);
      Utils.showToast('Error al cargar los likes', 'error');
    }
  },

  _crearModalLikes(users) {
    // Eliminar modales anteriores
    document.getElementById('likesModalProfile')?.remove();
    document.getElementById('likesModalOverlayProfile')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'likesModalOverlayProfile';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.8); backdrop-filter:blur(4px);
      z-index:20000; display:flex; align-items:center; justify-content:center;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'likesModalProfile';
    modal.style.cssText = `
      background:var(--bg-card); border-radius:20px; max-width:500px;
      width:90%; max-height:80vh; overflow-y:auto; padding:20px;
      box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid var(--border-color);
      animation: slideUp 0.3s ease;
    `;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border-color);">
        <h3 style="margin:0; color:var(--accent-yellow); font-size:18px;">❤️ Me gusta (${users.length})</h3>
        <button id="closeLikesModalProfileBtn" style="background:transparent; border:none; font-size:28px; cursor:pointer; color:var(--text-secondary); line-height:1;">&times;</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
    `;

    for (const user of users) {
      const photoURL = user.profile?.photoURL;
      const username = Utils.capitalizeUsername(user.username);
      const avatarHTML = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">`
        : `<div style="width:48px; height:48px; background:var(--bg-secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px;">👤</div>`;

      html += `
        <div class="like-user-item" data-uid="${user.uid}" style="display:flex; align-items:center; gap:12px; padding:8px 12px; border-radius:12px; background:var(--bg-secondary); cursor:pointer; transition:background 0.2s;">
          ${avatarHTML}
          <div style="flex:1;">
            <div style="font-weight:500; color:var(--accent-yellow);">${Utils.escapeHTML(username)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">@${Utils.escapeHTML(user.username)}</div>
          </div>
          <button class="ver-perfil-desde-like" data-uid="${user.uid}" style="background:var(--zone-2); border:none; padding:4px 12px; border-radius:20px; color:var(--bg-primary); cursor:pointer; font-size:12px; font-weight:500;">Ver perfil</button>
        </div>
      `;
    }

    html += `</div>`;
    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos
    document.getElementById('closeLikesModalProfileBtn')?.addEventListener('click', () => this._cerrarModalLikes());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._cerrarModalLikes(); });

    // Clic en usuario
    modal.querySelectorAll('.like-user-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.ver-perfil-desde-like')) return;
        const uid = item.dataset.uid;
        if (uid && window.Friends) {
          Friends.abrirModalAmigo(uid);
          this._cerrarModalLikes();
        }
      });
    });

    // Botón "Ver perfil"
    modal.querySelectorAll('.ver-perfil-desde-like').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        if (uid && window.Friends) {
          Friends.abrirModalAmigo(uid);
          this._cerrarModalLikes();
        }
      });
    });
  },

  _cerrarModalLikes() {
    document.getElementById('likesModalProfile')?.remove();
    document.getElementById('likesModalOverlayProfile')?.remove();
  },

  // ================================================================
  //  MODAL DE INSIGNIAS
  // ================================================================
  async _mostrarModalInsignias() {
    const gamificationData = await Gamification.getData(AppState.currentUserId);
    if (!gamificationData) return;
    
    const earnedBadgesIds = gamificationData.badges || [];
    const allBadges = Object.values(Gamification.BADGES);
    
    const earned = allBadges.filter(b => earnedBadgesIds.includes(b.id));
    const upcoming = allBadges.filter(b => !earnedBadgesIds.includes(b.id));
    
    earned.sort((a,b) => a.xp - b.xp);
    upcoming.sort((a,b) => a.xp - b.xp);

    document.getElementById('badgesModal')?.remove();
    document.getElementById('badgesModalOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'badgesModalOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(5px);
      z-index:30000; display:flex; align-items:center; justify-content:center;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'badgesModal';
    modal.style.cssText = `
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:20px; max-width:600px; width:90%;
      max-height:80%; overflow-y:auto; padding:20px;
      box-shadow:0 10px 30px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    `;

    let content = `<h3 style="margin:0 0 16px 0; text-align:center; color:var(--accent-yellow);">🏅 INSIGNIAS</h3>`;
    
    content += `<div style="margin-bottom:20px;">
      <div style="font-size:13px; font-weight:600; color:var(--accent-blue); margin-bottom:12px;">✓ Conseguidas (${earned.length})</div>
      <div style="display:flex; flex-wrap:wrap; gap:10px;">`;
    for (const badge of earned) {
      content += `
        <div style="flex:1; min-width:140px; background:var(--bg-secondary); border-radius:16px; padding:10px; text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:32px;">${badge.icon}</div>
          <div style="font-weight:600; font-size:13px; color:var(--text-primary);">${badge.name}</div>
          <div style="font-size:10px; color:var(--text-secondary);">${badge.description}</div>
        </div>
      `;
    }
    content += `</div></div>`;
    
    if (upcoming.length > 0) {
      content += `<div>
        <div style="font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:12px;">🔜 Próximas</div>
        <div style="display:flex; flex-wrap:wrap; gap:10px;">`;
      for (const badge of upcoming.slice(0, 12)) {
        content += `
          <div style="flex:1; min-width:140px; background:var(--bg-secondary); border-radius:16px; padding:10px; text-align:center; opacity:0.7; border:1px solid var(--border-color);">
            <div style="font-size:32px; filter:grayscale(0.3);">${badge.icon}</div>
            <div style="font-weight:600; font-size:13px; color:var(--text-secondary);">${badge.name}</div>
            <div style="font-size:10px; color:var(--text-secondary);">${badge.description}</div>
          </div>
        `;
      }
      content += `</div></div>`;
    }
    
    content += `<div style="display:flex; justify-content:center; margin-top:20px;">
      <button id="closeBadgesModalBtn" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); padding:8px 24px; border-radius:30px; cursor:pointer;">CERRAR</button>
    </div>`;
    
    modal.innerHTML = content;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    document.getElementById('closeBadgesModalBtn')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  // ================================================================
  //  MODAL CAMBIAR ZAPATILLA
  // ================================================================
  _mostrarModalCambiarZapatilla() {
    document.getElementById('changeShoeModal')?.remove();
    document.getElementById('changeShoeOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'changeShoeOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(5px);
      z-index:30000; display:flex; align-items:center; justify-content:center;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'changeShoeModal';
    modal.style.cssText = `
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:20px; max-width:400px; width:90%;
      padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.3);
      text-align:center; animation: slideUp 0.3s ease;
    `;

    modal.innerHTML = `
      <h3 style="margin:0 0 16px 0; color:var(--accent-yellow);">👟 CAMBIAR ZAPATILLA</h3>
      <div style="margin-bottom:16px;">
        <label style="display:block; text-align:left; font-size:12px; color:var(--text-secondary); margin-bottom:4px;">Marca</label>
        <input type="text" id="newShoeBrand" placeholder="Ej. Nike" style="width:100%; padding:10px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); height:48px; box-sizing:border-box;">
      </div>
      <div style="margin-bottom:24px;">
        <label style="display:block; text-align:left; font-size:12px; color:var(--text-secondary); margin-bottom:4px;">Modelo</label>
        <input type="text" id="newShoeModel" placeholder="Ej. Pegasus 40" style="width:100%; padding:10px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); height:48px; box-sizing:border-box;">
      </div>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button id="confirmChangeShoe" style="background:var(--accent-blue); border:none; color:var(--bg-primary); padding:8px 24px; border-radius:30px; cursor:pointer; font-weight:600;">CAMBIAR</button>
        <button id="cancelChangeShoe" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); padding:8px 24px; border-radius:30px; cursor:pointer;">CANCELAR</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    document.getElementById('confirmChangeShoe')?.addEventListener('click', async () => {
      const brand = document.getElementById('newShoeBrand')?.value.trim() || '';
      const model = document.getElementById('newShoeModel')?.value.trim() || '';
      if (!brand && !model) {
        Utils.showToast('Escribe al menos la marca o el modelo', 'warning');
        return;
      }
      const newName = `${brand} ${model}`.trim();
      if (newName) {
        await Gamification.setCurrentShoe(AppState.currentUserId, newName);
        Utils.showToast('✅ Zapatilla actualizada', 'success');
        closeModal();
        // Recargar perfil sin forzar (para mantener la caché)
        this.cargarPerfil(true);
      }
    });

    document.getElementById('cancelChangeShoe')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  },

  // ================================================================
  //  MODAL HISTORIAL ZAPATILLAS
  // ================================================================
  async _mostrarModalHistorial() {
    const history = await Gamification.getShoeHistory(AppState.currentUserId);
    if (!history || history.length === 0) {
      Utils.showToast('No hay historial de zapatillas aún', 'info');
      return;
    }

    document.getElementById('shoeHistoryModal')?.remove();
    document.getElementById('shoeHistoryOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'shoeHistoryOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(5px);
      z-index:30000; display:flex; align-items:center; justify-content:center;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'shoeHistoryModal';
    modal.style.cssText = `
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:20px; max-width:400px; width:90%;
      max-height:80%; overflow-y:auto; padding:20px;
      box-shadow:0 10px 30px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    `;

    let html = `
      <h3 style="margin:0 0 16px 0; text-align:center; color:var(--accent-yellow);">📜 HISTORIAL DE ZAPATILLAS</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
    `;
    
    [...history].reverse().forEach(entry => {
      const date = new Date(entry.changedAt).toLocaleDateString();
      html += `
        <div style="background:var(--bg-secondary); border-radius:16px; padding:12px; border:1px solid var(--border-color);">
          <div style="font-weight:600; color:var(--accent-blue);">${Utils.escapeHTML(entry.name)}</div>
          <div style="font-size:12px; color:var(--text-secondary);">📊 ${entry.km.toFixed(1)} km acumulados</div>
          <div style="font-size:11px; color:var(--text-secondary);">🔄 Cambio: ${date}</div>
        </div>
      `;
    });
    
    html += `
      </div>
      <div style="display:flex; justify-content:center; margin-top:20px;">
        <button id="closeHistoryModalBtn" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); padding:8px 24px; border-radius:30px; cursor:pointer;">CERRAR</button>
      </div>
    `;

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('closeHistoryModalBtn')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  // ================================================================
  //  EDITAR PERFIL (MODALES)
  // ================================================================
  abrirModal() {
    this.cargarDatosEnModal();
    this.cargarFotoActual();
    document.getElementById('modalEditarPerfilOverlay').style.display = 'block';
    document.getElementById('modalEditarPerfil').style.display = 'block';
    document.body.classList.add('modal-open');
  },

  cerrarModal() {
    document.getElementById('modalEditarPerfilOverlay').style.display = 'none';
    document.getElementById('modalEditarPerfil').style.display = 'none';
    document.body.classList.remove('modal-open');
  },

  async cargarDatosEnModal() {
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      const profile = userDoc.data().profile || {};
      document.getElementById('editBio').value = profile.bio || '';
      document.getElementById('editCity').value = profile.city || '';
      document.getElementById('editAge').value = profile.age || '';
      document.getElementById('editGender').value = profile.gender || '';
      document.getElementById('editWeight').value = profile.weight || '';
      document.getElementById('editHeight').value = profile.height || '';
    } catch (error) {
      console.error('Error cargando datos en modal:', error);
    }
  },

  async cargarFotoActual() {
    const container = document.getElementById('currentPhotoPreview');
    if (!container) return;
    const url = await Storage.getProfilePictureURL(AppState.currentUserId);
    container.innerHTML = url
      ? `<img src="${Utils.escapeHTML(url)}" style="width:100px; height:100px; border-radius:50%; object-fit:cover;">`
      : `<div style="width:100px; height:100px; background:var(--bg-secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:40px;">👤</div>`;
  },

  async seleccionarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      Utils.showLoading();
      try {
        const compressedFile = await this.compressImageToTarget(file, 1920, 5 * 1024 * 1024);
        const url = await Storage.uploadProfilePicture(AppState.currentUserId, compressedFile);
        if (url) {
          Utils.showToast('✅ Foto actualizada', 'success');
          this.cargarFotoActual();
          this.cargarPerfil(true);
          if (window.Friends) Friends.cargarListaAmigos();
          if (window.Chat) Chat.updateUnreadBadge();
        }
      } catch (err) {
        console.error(err);
        Utils.showToast('Error al procesar la imagen', 'error');
      } finally {
        Utils.hideLoading();
      }
    };
    input.click();
  },

  async compressImageToTarget(file, maxDimension, maxSizeBytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          let resizedBlob = await this._resizeImage(img, maxDimension, 0.92);
          if (resizedBlob.size <= maxSizeBytes) {
            resolve(new File([resizedBlob], 'avatar.jpg', { type: 'image/jpeg' }));
            return;
          }
          const qualities = [0.85, 0.8, 0.75, 0.7];
          for (const q of qualities) {
            resizedBlob = await this._resizeImage(img, maxDimension, q);
            if (resizedBlob.size <= maxSizeBytes) {
              resolve(new File([resizedBlob], 'avatar.jpg', { type: 'image/jpeg' }));
              return;
            }
          }
          resolve(new File([await this._resizeImage(img, 1600, 0.7)], 'avatar.jpg', { type: 'image/jpeg' }));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  _resizeImage(img, maxDimension, quality) {
    return new Promise((resolve) => {
      let width = img.width, height = img.height;
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
  },

  async eliminarFoto() {
    const confirm = await Utils.confirm('Eliminar foto', '¿Eliminar tu foto de perfil?');
    if (!confirm) return;
    Utils.showLoading();
    const ok = await Storage.deleteProfilePicture(AppState.currentUserId);
    Utils.hideLoading();
    if (ok) {
      Utils.showToast('✅ Foto eliminada', 'success');
      this.cargarFotoActual();
      this.cargarPerfil(true);
      if (window.Friends) Friends.cargarListaAmigos();
      if (window.Chat) Chat.updateUnreadBadge();
    } else {
      Utils.showToast('Error al eliminar foto', 'error');
    }
  },

  async guardarPerfil() {
    Utils.showLoading();
    try {
      const bio = document.getElementById('editBio')?.value.trim() || '';
      const city = document.getElementById('editCity')?.value.trim() || '';
      const age = parseInt(document.getElementById('editAge')?.value) || null;
      const gender = document.getElementById('editGender')?.value || '';
      const weight = parseFloat(document.getElementById('editWeight')?.value) || null;
      const height = parseFloat(document.getElementById('editHeight')?.value) || null;

      if (age !== null && (age < 14 || age > 85)) {
        Utils.showToast('⚠️ La edad debe estar entre 14 y 85 años', 'error');
        Utils.hideLoading();
        return;
      }
      if (weight !== null && (weight < 30 || weight > 250)) {
        Utils.showToast('⚠️ El peso debe estar entre 30 y 250 kg', 'error');
        Utils.hideLoading();
        return;
      }
      if (height !== null && (height < 100 || height > 250)) {
        Utils.showToast('⚠️ La altura debe estar entre 100 y 250 cm', 'error');
        Utils.hideLoading();
        return;
      }

      await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
        'profile.bio': bio,
        'profile.city': city,
        'profile.age': age,
        'profile.gender': gender,
        'profile.weight': weight,
        'profile.height': height
      });

      if (AppState.currentUserData) {
        AppState.currentUserData.profile = { ...AppState.currentUserData.profile, bio, city, age, gender, weight, height };
      }

      Utils.showToast('✅ Perfil actualizado', 'success');
      this.cerrarModal();
      this.cargarPerfil(true);
      
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Utils.showToast('Error al guardar perfil', 'error');
    } finally {
      Utils.hideLoading();
    }
  }
};

// ================================================================
//  INYECTAR ESTILOS PARA ANIMACIONES
// ================================================================
if (!document.getElementById('profileModalStyles')) {
  const style = document.createElement('style');
  style.id = 'profileModalStyles';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .perfil-sesion-item {
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .perfil-sesion-item:hover {
      border-color: var(--accent-blue);
      transform: translateY(-2px);
    }
    .like-user-item:hover {
      background: var(--bg-primary) !important;
    }
  `;
  document.head.appendChild(style);
}

window.Profile = Profile;
console.log('✅ profile.js v11.0 - Arquitectura de renderizado seguro con event delegation');