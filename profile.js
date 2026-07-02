// ==================== profile.js ====================
// Versión: 10.6 - Perfil completo con gamificación v5.6 + creación automática de pasaporte
// ====================

const Profile = {
  _gpsEntries: {},

  async cargarPerfil(forceRefresh = true) {
    const container = document.getElementById('perfilContainer');
    if (!container || !AppState.currentUserId) {
      console.warn('⚠️ cargarPerfil: contenedor no encontrado o usuario no autenticado');
      return;
    }

    const cacheKey = `perfil_${AppState.currentUserId}`;
    let htmlCache = null;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { html, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 60 * 1000) {
            container.innerHTML = html;
            console.log('📦 Perfil cargado desde caché');
            htmlCache = html;
          }
        } catch (e) {}
      }
    } else {
      localStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`gamification_${AppState.currentUserId}`);
      localStorage.removeItem(`gamification_${AppState.currentUserId}`);
      console.log('🔄 Recarga forzada del perfil (sin caché)');
    }

    try {
      console.time('cargarPerfil');
      console.log('🔄 Cargando perfil desde Firestore...');
      const userRef = firebaseServices.db.collection('users').doc(AppState.currentUserId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      let friendIds = userData.friendIds || [];
      const amigosValidos = [];
      const chunks = [];
      for (let i = 0; i < friendIds.length; i += 10) {
        chunks.push(friendIds.slice(i, i + 10));
      }
      for (const chunk of chunks) {
        const snapshot = await firebaseServices.db.collection('users')
          .where('__name__', 'in', chunk)
          .get();
        snapshot.forEach(doc => amigosValidos.push(doc.id));
      }
      if (amigosValidos.length !== friendIds.length) {
        await userRef.update({
          friendIds: amigosValidos,
          friendsCount: amigosValidos.length
        });
        userData.friendIds = amigosValidos;
        userData.friendsCount = amigosValidos.length;
        console.log(`✅ Lista de amigos limpiada. Ahora hay ${amigosValidos.length} amigos reales.`);
      }
      const amigosReales = amigosValidos.length;

      const profile = userData.profile || {
        bio: '', city: '', age: null, gender: '', weight: null, height: null,
        privacySettings: { showTrainings: 'friends', showProfile: 'public' },
        photoURL: null
      };

      // Precargar la foto antes de pintarla para evitar el parpadeo
      // (el navegador ya tendrá la imagen en caché cuando se inserte el <img>)
      if (profile.photoURL) {
        await new Promise(resolve => {
          const preImg = new Image();
          preImg.onload = resolve;
          preImg.onerror = resolve;
          preImg.src = profile.photoURL;
        });
      }

      const photoHTML = profile.photoURL
        ? `<img src="${Utils.escapeHTML(profile.photoURL)}" class="perfil-avatar" style="object-fit:cover;">`
        : `<div class="perfil-avatar-placeholder">👤</div>`;

      const age = profile.age ? Utils.escapeHTML(profile.age + ' años') : '—';
      const gender = profile.gender === 'male' ? 'Hombre' : profile.gender === 'female' ? 'Mujer' : profile.gender === 'other' ? 'Otro' : '—';
      const bio = profile.bio ? Utils.escapeHTML(profile.bio) : '—';
      const city = profile.city ? Utils.escapeHTML(profile.city) : '—';
      const weight = profile.weight ? Utils.escapeHTML(profile.weight + ' kg') : '—';
      const height = profile.height ? Utils.escapeHTML(profile.height + ' cm') : '—';

      let html = `
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
          <div class="perfil-detalle-item"><span class="label">BIO</span><span class="value">${bio}</span></div>
          <div class="perfil-detalle-item"><span class="label">CIUDAD</span><span class="value">${city}</span></div>
          <div class="perfil-detalle-item"><span class="label">EDAD</span><span class="value">${age}</span></div>
          <div class="perfil-detalle-item"><span class="label">GÉNERO</span><span class="value">${gender}</span></div>
          <div class="perfil-detalle-item"><span class="label">PESO</span><span class="value">${weight}</span></div>
          <div class="perfil-detalle-item"><span class="label">ALTURA</span><span class="value">${height}</span></div>
          <div class="perfil-detalle-item" style="grid-column: span 2;">
            <span class="label">EMAIL</span>
            <span class="value">${Utils.escapeHTML(userData.email)}</span>
          </div>
        </div>
      `;

      // ========== GAMIFICACIÓN / PASAPORTE – CON CREACIÓN AUTOMÁTICA ==========
      let gamificationData = null;
      try {
        gamificationData = await Gamification.getData(AppState.currentUserId);
        if (!gamificationData) {
          gamificationData = Gamification.getDefaultData();
          await firebaseServices.db.collection('gamification').doc(AppState.currentUserId).set(gamificationData);
          console.log('🆕 Documento de gamificación creado automáticamente desde perfil');
        }
      } catch (e) {
        console.error('Error cargando gamificación, creando documento...', e);
        gamificationData = Gamification.getDefaultData();
        await firebaseServices.db.collection('gamification').doc(AppState.currentUserId).set(gamificationData).catch(err => console.error('Fallo crítico:', err));
      }

      if (gamificationData) {
        const progress = Gamification.getProgressToNextLevel(gamificationData.totalDistance);
        const levelColor = Gamification.getColorByLevel(gamificationData.level);
        
        let bgColor = levelColor;
        if (levelColor.startsWith('#')) {
          const r = parseInt(levelColor.slice(1,3), 16);
          const g = parseInt(levelColor.slice(3,5), 16);
          const b = parseInt(levelColor.slice(5,7), 16);
          bgColor = `rgba(${r}, ${g}, ${b}, 0.05)`;
        } else if (levelColor.startsWith('rgb')) {
          bgColor = levelColor.replace('rgb', 'rgba').replace(')', ', 0.05)');
        } else {
          bgColor = 'var(--bg-secondary)';
        }
        
        const badgesIcons = (gamificationData.badges || []).map(badgeId => {
          const badge = Gamification.BADGES[badgeId];
          if (!badge) return '';
          return `<span class="badge-icon" data-badge-id="${badgeId}" style="display:inline-block; font-size:28px; margin:0 6px; cursor:pointer;" title="${badge.name} - ${badge.description} (+${badge.xp} XP)">${badge.icon}</span>`;
        }).filter(b => b).join('');
        
        const shoe = await Gamification.getCurrentShoe(AppState.currentUserId);
        const shoeName = (shoe && shoe.name) ? shoe.name : 'Zapatilla actual';
        const shoeKm = (shoe && shoe.km) ? shoe.km.toFixed(1) : '0.0';
        
        const nextLevel = Gamification.LEVELS_KM.find(l => l.level === gamificationData.level + 1);
        const nextKm = nextLevel ? nextLevel.kmNeeded : gamificationData.totalDistance;
        
        const userName = Utils.capitalizeUsername(userData.username);
        
        html += `
          <div class="passport-card" style="margin-top:24px; border:2px solid ${levelColor}; border-radius:24px; background:${bgColor}; box-shadow:0 8px 20px rgba(0,0,0,0.1); overflow:hidden;">
            <div style="padding:16px 20px 0 20px; text-align:center; border-bottom:1px solid ${levelColor}40;">
              <span style="font-size:16px; font-weight:500; letter-spacing:1px; color:${levelColor};">${Utils.escapeHTML(userName)}</span>
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
                <div class="level-progress" style="background:var(--border-color); height:3px; border-radius:3px; overflow:hidden;">
                  <div class="level-progress-fill" style="width: ${progress}%; background: ${levelColor}; height:3px;"></div>
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
              ${badgesIcons ? `<div style="margin-bottom: 16px; border-top:1px solid ${levelColor}40; padding-top:16px;">
                <div style="font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">🏅 Sellos de progreso</div>
                <div class="badges-icons-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${badgesIcons}</div>
              </div>` : '<p style="text-align:center; font-size:11px; margin-bottom:16px;">Completa entrenamientos para desbloquear sellos</p>'}
              <div style="display: flex; justify-content: center; gap: 12px; margin-top:8px;">
                <button id="changeShoeBtn" style="background:transparent; border:1px solid ${levelColor}; color:${levelColor}; padding:2px 10px; border-radius:30px; font-size:10px; letter-spacing:0.5px; cursor:pointer;">👟 Cambiar</button>
                <button id="historyShoeBtn" style="background:transparent; border:1px solid ${levelColor}; color:${levelColor}; padding:2px 10px; border-radius:30px; font-size:10px; letter-spacing:0.5px; cursor:pointer;">📜 Historial</button>
              </div>
            </div>
          </div>
        `;
      } else {
        html += `<div class="warning-message" style="padding:20px; text-align:center; background:rgba(255,0,0,0.1); border-radius:16px; margin-top:20px;">
          ⚠️ Tu pasaporte de corredor no está disponible. 
          <button onclick="Gamification.repairMyProfile()" class="action-button" style="margin-top:10px;">🔧 ACTIVAR AHORA</button>
        </div>`;
      }

      // MIS ÚLTIMOS ENTRENAMIENTOS (sin cambios)
      try {
        const misEntrenamientosSnapshot = await firebaseServices.db
          .collection('globalFeed')
          .where('userId', '==', AppState.currentUserId)
          .orderBy('timestamp', 'desc')
          .limit(5)
          .get();

        if (!misEntrenamientosSnapshot.empty) {
          let entrenamientosHTML = '<div class="mis-entrenamentos-section" style="margin-top:24px; margin-bottom:24px; background:var(--bg-secondary); border-radius:16px; padding:16px;">';
          entrenamientosHTML += '<h3 style="margin-top:0; margin-bottom:16px; text-align:left; font-size:18px;">📋 MIS ÚLTIMOS ENTRENAMIENTOS</h3>';
          
          for (const doc of misEntrenamientosSnapshot.docs) {
            const entry = doc.data();
            const entryId = doc.id;
            
            let fecha = '—', hora = '';
            try {
              if (entry.timestamp) {
                let dateObj = entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                fecha = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                hora = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            } catch (_) {}

            const likeCount = Number(entry.likeCount) || 0;
            const likeClass = '';

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

            const colorZona = (typeof Wall !== 'undefined' && Wall._colorZona) ? Wall._colorZona(zone) : null;

            const gpsBadge = entry.hasGPS
              ? `<span style="font-size:10px; font-weight:600; letter-spacing:1px; color:#c0a060; background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.3); border-radius:20px; padding:2px 8px; margin-left:6px;">📍 GPS</span>`
              : '';

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
              }
            }

            entrenamientosHTML += `
              <div class="wall-item" data-entry-id="${entryId}" style="margin-bottom:16px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    ${avatarHTML}
                    <div>
                      <div class="wall-username">${Utils.escapeHTML(usernameFormatted)}</div>
                      <div class="wall-fecha">${fecha} · ${hora}</div>
                    </div>
                  </div>
                  <button class="wall-like-btn ${likeClass}" data-entry-id="${entryId}" style="background:transparent; border:none; padding:6px 12px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-size:14px; color:var(--text-secondary); transition:all 0.2s ease;">
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
                  ${miniMapHTML}
                </div>
              </div>
            `;

            if (entry.hasGPS && entry.trackPoints) {
              this._gpsEntries[entryId] = { ...entry, id: entryId };
            }
          }
          entrenamientosHTML += '</div>';
          html += entrenamientosHTML;
        } else {
          html += `<div style="margin-top:24px; margin-bottom:24px; background:var(--bg-secondary); border-radius:16px; padding:16px; text-align:center;">
            <h3 style="margin-top:0; margin-bottom:8px;">📋 MIS ÚLTIMOS ENTRENAMIENTOS</h3>
            <p style="font-size:14px;">Aún no has compartido ningún entrenamiento.<br>Completa sesiones en la pestaña PLAN y márcalas como realizadas.</p>
          </div>`;
        }
      } catch (error) { console.warn(error); }

      // Si ya se pintó desde caché (forceRefresh=false) y el HTML recién
      // obtenido de Firestore es idéntico, no se vuelve a escribir el DOM.
      // Antes se sobreescribía SIEMPRE, destruyendo y recreando el <img>
      // del avatar en cada entrada a la pestaña Perfil, lo que causaba el
      // parpadeo de la foto aunque la imagen fuera exactamente la misma.
      const sinCambios = htmlCache !== null && htmlCache === html;
      if (!sinCambios) {
        container.innerHTML = html;
      }
      console.timeEnd('cargarPerfil');

      localStorage.setItem(cacheKey, JSON.stringify({ html, timestamp: Date.now() }));

      if (!sinCambios) {
        setTimeout(() => {
          document.querySelectorAll('.wall-item').forEach(item => {
            item.removeEventListener('click', this._handleItemClickProfile);
            item.addEventListener('click', this._handleItemClickProfile.bind(this));
          });
          document.querySelectorAll('.wall-like-btn').forEach(btn => {
            btn.removeEventListener('click', this._handleLikeClickProfile);
            btn.addEventListener('click', this._handleLikeClickProfile.bind(this));
          });
          document.querySelectorAll('.gps-minimap-tap-profile').forEach(el => {
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              if (!window.GPSTrackViewer) return;
              const entryId = el.dataset.entryId;
              const entry = this._gpsEntries[entryId];
              if (entry) GPSTrackViewer.open(entry);
            });
          });
          document.querySelectorAll('.badge-icon').forEach(icon => {
            icon.removeEventListener('click', this._mostrarModalInsignias);
            icon.addEventListener('click', this._mostrarModalInsignias);
          });
          const changeBtn = document.getElementById('changeShoeBtn');
          if (changeBtn) changeBtn.onclick = () => this._mostrarModalCambiarZapatilla();
          const historyBtn = document.getElementById('historyShoeBtn');
          if (historyBtn) historyBtn.onclick = () => this._mostrarModalHistorial();
        }, 0);
      }

    } catch (error) {
      console.error('Error cargando perfil:', error);
      if (container && !htmlCache) container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error al cargar perfil</p>';
    }
  },

  _handleItemClickProfile(e) {
    if (e.target.closest('.wall-like-btn')) return;
    const item = e.currentTarget;
    const entryId = item.dataset.entryId;
    if (entryId) this._mostrarLikesDeEntrenamiento(entryId);
  },

  _handleLikeClickProfile(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const entryId = btn.dataset.entryId;
    if (entryId) this._mostrarLikesDeEntrenamiento(entryId);
  },

  async _mostrarLikesDeEntrenamiento(entryId) {
    if (!entryId) return;
    try {
      if (typeof Wall !== 'undefined' && Wall.showLikesModal) {
        await Wall.showLikesModal(entryId);
      } else {
        const doc = await firebaseServices.db.collection('globalFeed').doc(entryId).get();
        if (!doc.exists) { Utils.showToast('La publicación ya no existe', 'error'); return; }
        const likes = doc.data().likes || [];
        if (likes.length === 0) { Utils.showToast('Nadie ha dado like a esta publicación aún', 'info'); return; }
        const usersData = [];
        for (const uid of likes) {
          const userData = await Storage.getUser(uid);
          usersData.push(userData ? { uid, ...userData } : { uid, username: 'Usuario desconocido', profile: {} });
        }
        this._createLikesModal(usersData);
      }
    } catch (error) {
      console.error(error);
      Utils.showToast('Error al cargar los likes', 'error');
    }
  },

  _createLikesModal(users) {
    const existingModal = document.getElementById('likesModalProfile');
    const existingOverlay = document.getElementById('likesModalOverlayProfile');
    if (existingModal) existingModal.remove();
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'likesModalOverlayProfile';
    overlay.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:2000; display:flex; align-items:center; justify-content:center;`;
    const modal = document.createElement('div');
    modal.id = 'likesModalProfile';
    modal.style.cssText = `background:var(--bg-primary); border-radius:24px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); border:1px solid var(--border-color);`;
    modal.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:10px; border-bottom:1px solid var(--border-color);"><h3 style="margin:0; color:var(--accent-yellow);">❤️ Me gusta (${users.length})</h3><button id="closeLikesModalProfileBtn" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-secondary);">&times;</button></div><div id="likesListProfile"></div>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const listContainer = modal.querySelector('#likesListProfile');
    listContainer.style.cssText = 'display:flex; flex-direction:column; gap:12px;';
    for (const user of users) {
      const photoURL = user.profile?.photoURL;
      const avatarHTML = photoURL ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">` : `<div style="width:48px; height:48px; background:var(--bg-secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px;">👤</div>`;
      const div = document.createElement('div');
      div.style.cssText = 'display:flex; align-items:center; gap:12px; padding:8px; border-radius:16px; background:var(--bg-secondary); cursor:pointer;';
      div.innerHTML = `${avatarHTML}<div style="flex:1;"><div style="font-weight:bold; color:var(--accent-yellow);">${Utils.escapeHTML(Utils.capitalizeUsername(user.username))}</div><div style="font-size:12px; color:var(--text-secondary);">@${Utils.escapeHTML(user.username)}</div></div><button class="view-profile-btn-profile" data-uid="${user.uid}" style="background:var(--zone-2); border:none; padding:6px 12px; border-radius:20px; color:var(--bg-primary); cursor:pointer;">Ver perfil</button>`;
      div.addEventListener('click', (e) => { if (!e.target.classList.contains('view-profile-btn-profile')) { Friends?.abrirModalAmigo(user.uid); this._closeLikesModal(); } });
      div.querySelector('.view-profile-btn-profile')?.addEventListener('click', (e) => { e.stopPropagation(); Friends?.abrirModalAmigo(user.uid); this._closeLikesModal(); });
      listContainer.appendChild(div);
    }
    document.getElementById('closeLikesModalProfileBtn')?.addEventListener('click', () => this._closeLikesModal());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeLikesModal(); });
  },

  _closeLikesModal() {
    document.getElementById('likesModalProfile')?.remove();
    document.getElementById('likesModalOverlayProfile')?.remove();
  },

  async _mostrarModalInsignias() {
    const gamificationData = await Gamification.getData(AppState.currentUserId);
    if (!gamificationData) return;
    
    const earnedBadgesIds = gamificationData.badges || [];
    const allBadges = Object.values(Gamification.BADGES);
    
    const earned = [];
    const upcoming = [];
    for (const badge of allBadges) {
      if (earnedBadgesIds.includes(badge.id)) earned.push(badge);
      else upcoming.push(badge);
    }
    earned.sort((a,b) => a.xp - b.xp);
    upcoming.sort((a,b) => a.xp - b.xp);
    
    const existingModal = document.getElementById('badgesModal');
    const existingOverlay = document.getElementById('badgesModalOverlay');
    if (existingModal) existingModal.remove();
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'badgesModalOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
      z-index: 30000; display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.id = 'badgesModal';
    modal.style.cssText = `
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      max-width: 600px;
      width: 90%;
      max-height: 80%;
      overflow-y: auto;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    let content = `<h3 style="margin: 0 0 16px 0; text-align: center; color: var(--accent-yellow);">🏅 INSIGNIAS</h3>`;
    
    content += `<div style="margin-bottom: 20px;">
      <div style="font-size: 14px; font-weight: bold; color: var(--accent-blue); margin-bottom: 12px;">✓ Conseguidas (${earned.length})</div>
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">`;
    for (const badge of earned) {
      content += `
        <div style="flex: 1; min-width: 140px; background: var(--bg-secondary); border-radius: 16px; padding: 8px; text-align: center;">
          <div style="font-size: 32px;">${badge.icon}</div>
          <div style="font-weight: bold; font-size: 13px;">${badge.name}</div>
          <div style="font-size: 10px; color: var(--text-secondary);">${badge.description}</div>
        </div>
      `;
    }
    content += `</div></div>`;
    
    if (upcoming.length > 0) {
      content += `<div>
        <div style="font-size: 14px; font-weight: bold; color: var(--accent-blue); margin-bottom: 12px;">🔜 Próximas</div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">`;
      for (const badge of upcoming) {
        content += `
          <div style="flex: 1; min-width: 140px; background: var(--bg-secondary); border-radius: 16px; padding: 8px; text-align: center; opacity: 0.8;">
            <div style="font-size: 32px; filter: grayscale(0.3);">${badge.icon}</div>
            <div style="font-weight: bold; font-size: 13px;">${badge.name}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">${badge.description}</div>
          </div>
        `;
      }
      content += `</div></div>`;
    } else {
      content += `<p style="text-align:center; color: var(--text-secondary);">¡Has conseguido todas las insignias! 🎉</p>`;
    }
    
    content += `<div style="display: flex; justify-content: center; margin-top: 24px;">
      <button id="closeBadgesModalBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 24px; border-radius: 30px; cursor: pointer;">CERRAR</button>
    </div>`;
    
    modal.innerHTML = content;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const closeBtn = document.getElementById('closeBadgesModalBtn');
    const closeModal = () => overlay.remove();
    if (closeBtn) closeBtn.onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  },

  _mostrarModalCambiarZapatilla() {
    const existingModal = document.getElementById('changeShoeModal');
    const existingOverlay = document.getElementById('changeShoeOverlay');
    if (existingModal) existingModal.remove();
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'changeShoeOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
      z-index: 30000; display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.id = 'changeShoeModal';
    modal.style.cssText = `
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      max-width: 400px;
      width: 90%;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      text-align: center;
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: var(--accent-yellow);">👟 CAMBIAR ZAPATILLA</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; text-align: left; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Marca</label>
        <input type="text" id="newShoeBrand" placeholder="Ej. Nike" style="width: 100%; padding: 10px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary);">
      </div>
      <div style="margin-bottom: 24px;">
        <label style="display: block; text-align: left; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Modelo</label>
        <input type="text" id="newShoeModel" placeholder="Ej. Pegasus 40" style="width: 100%; padding: 10px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary);">
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="confirmChangeShoe" style="background: var(--accent-blue); border: none; color: var(--bg-primary); padding: 8px 24px; border-radius: 30px; cursor: pointer;">CAMBIAR</button>
        <button id="cancelChangeShoe" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 24px; border-radius: 30px; cursor: pointer;">CANCELAR</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const confirmBtn = document.getElementById('confirmChangeShoe');
    const cancelBtn = document.getElementById('cancelChangeShoe');
    const brandInput = document.getElementById('newShoeBrand');
    const modelInput = document.getElementById('newShoeModel');

    const closeModal = () => { overlay.remove(); };

    confirmBtn.onclick = async () => {
      const brand = brandInput.value.trim();
      const model = modelInput.value.trim();
      if (!brand && !model) {
        Utils.showToast('Escribe al menos la marca o el modelo', 'warning');
        return;
      }
      const newName = `${brand} ${model}`.trim();
      if (newName) {
        await Gamification.setCurrentShoe(AppState.currentUserId, newName);
        await Profile.cargarPerfil(true);
        Utils.showToast('✅ Zapatilla actualizada', 'success');
        closeModal();
      }
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  },

  async _mostrarModalHistorial() {
    const history = await Gamification.getShoeHistory(AppState.currentUserId);
    if (!history || history.length === 0) {
      Utils.showToast('No hay historial de zapatillas aún', 'info');
      return;
    }

    const existingModal = document.getElementById('shoeHistoryModal');
    const existingOverlay = document.getElementById('shoeHistoryOverlay');
    if (existingModal) existingModal.remove();
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'shoeHistoryOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
      z-index: 30000; display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.id = 'shoeHistoryModal';
    modal.style.cssText = `
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      max-width: 400px;
      width: 90%;
      max-height: 80%;
      overflow-y: auto;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    let historyHtml = '<h3 style="margin: 0 0 16px 0; text-align: center; color: var(--accent-yellow);">📜 HISTORIAL DE ZAPATILLAS</h3><div style="display: flex; flex-direction: column; gap: 12px;">';
    [...history].reverse().forEach(entry => {
      const date = new Date(entry.changedAt).toLocaleDateString();
      historyHtml += `
        <div style="background: var(--bg-secondary); border-radius: 16px; padding: 12px; border: 1px solid var(--border-color);">
          <div style="font-weight: bold; color: var(--accent-blue);">${Utils.escapeHTML(entry.name)}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">📊 ${entry.km} km acumulados</div>
          <div style="font-size: 11px; color: var(--text-secondary);">🔄 Cambio: ${date}</div>
        </div>
      `;
    });
    historyHtml += '</div><div style="display: flex; justify-content: center; margin-top: 20px;"><button id="closeHistoryModalBtn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 24px; border-radius: 30px; cursor: pointer;">CERRAR</button></div>';
    modal.innerHTML = historyHtml;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const closeBtn = document.getElementById('closeHistoryModalBtn');
    const closeModal = () => overlay.remove();
    if (closeBtn) closeBtn.onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  },

  abrirModal() {
    this.cargarDatosEnModal();
    this.cargarFotoActual();
    const overlay = document.getElementById('modalEditarPerfilOverlay');
    const modal = document.getElementById('modalEditarPerfil');
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'block';
    document.body.classList.add('modal-open');
  },

  cerrarModal() {
    const overlay = document.getElementById('modalEditarPerfilOverlay');
    const modal = document.getElementById('modalEditarPerfil');
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  },

  async cargarDatosEnModal() {
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      const profile = userDoc.data().profile || {};

      const bioInput = document.getElementById('editBio');
      const cityInput = document.getElementById('editCity');
      const ageInput = document.getElementById('editAge');
      const genderSelect = document.getElementById('editGender');
      const weightInput = document.getElementById('editWeight');
      const heightInput = document.getElementById('editHeight');

      if (bioInput) bioInput.value = profile.bio || '';
      if (cityInput) cityInput.value = profile.city || '';
      if (ageInput) ageInput.value = profile.age || '';
      if (genderSelect) genderSelect.value = profile.gender || '';
      if (weightInput) weightInput.value = profile.weight || '';
      if (heightInput) heightInput.value = profile.height || '';
    } catch (error) {
      console.error('Error cargando datos en modal:', error);
      Utils.showToast('Error al cargar datos del perfil', 'error');
    }
  },

  async cargarFotoActual() {
    const container = document.getElementById('currentPhotoPreview');
    if (!container) return;
    const uid = AppState.currentUserId;
    const url = await Storage.getProfilePictureURL(uid);
    if (url) {
      container.innerHTML = `<img src="${Utils.escapeHTML(url)}" style="width:100px; height:100px; border-radius:50%; object-fit:cover;">`;
    } else {
      container.innerHTML = `<div style="width:100px; height:100px; background:var(--bg-secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:40px;">👤</div>`;
    }
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
          await Profile.cargarPerfil(true);
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
          let qualities = [0.85, 0.8, 0.75, 0.7];
          for (let q of qualities) {
            resizedBlob = await this._resizeImage(img, maxDimension, q);
            if (resizedBlob.size <= maxSizeBytes) {
              resolve(new File([resizedBlob], 'avatar.jpg', { type: 'image/jpeg' }));
              return;
            }
          }
          const finalBlob = await this._resizeImage(img, 1600, 0.7);
          resolve(new File([finalBlob], 'avatar.jpg', { type: 'image/jpeg' }));
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
      let width = img.width;
      let height = img.height;
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
      await Profile.cargarPerfil(true);
      if (window.Friends) Friends.cargarListaAmigos();
      if (window.Chat) Chat.updateUnreadBadge();
    } else {
      Utils.showToast('Error al eliminar foto', 'error');
    }
  },

  compressImage(file) {
    return this.compressImageToTarget(file, 1920, 5 * 1024 * 1024);
  },

  // ============================================================
  //  🔥 GUARDAR PERFIL CON VALIDACIONES DE PESO Y ALTURA
  // ============================================================
  async guardarPerfil() {
    Utils.showLoading();
    try {
      const bio = document.getElementById('editBio')?.value.trim() || '';
      const city = document.getElementById('editCity')?.value.trim() || '';
      const age = parseInt(document.getElementById('editAge')?.value) || null;
      const gender = document.getElementById('editGender')?.value || '';
      const weight = parseFloat(document.getElementById('editWeight')?.value) || null;
      const height = parseFloat(document.getElementById('editHeight')?.value) || null;

      // Validación de edad
      if (age !== null && (age < 14 || age > 85)) {
        Utils.showToast('⚠️ La edad debe estar entre 14 y 85 años', 'error');
        Utils.hideLoading();
        return;
      }

      // 🔥 NUEVO: Validación de peso (30-250 kg)
      if (weight !== null && (weight < 30 || weight > 250)) {
        Utils.showToast('⚠️ El peso debe estar entre 30 y 250 kg', 'error');
        Utils.hideLoading();
        return;
      }

      // 🔥 NUEVO: Validación de altura (100-250 cm)
      if (height !== null && (height < 100 || height > 250)) {
        Utils.showToast('⚠️ La altura debe estar entre 100 y 250 cm', 'error');
        Utils.hideLoading();
        return;
      }

      const updateData = {
        'profile.bio': bio,
        'profile.city': city,
        'profile.age': age,
        'profile.gender': gender,
        'profile.weight': weight,
        'profile.height': height
      };

      await firebaseServices.db.collection('users').doc(AppState.currentUserId).update(updateData);

      if (AppState.currentUserData) {
        AppState.currentUserData.profile = {
          ...(AppState.currentUserData.profile || {}),
          bio,
          city,
          age,
          gender,
          weight,
          height
        };
      }

      Utils.showToast('✅ Perfil actualizado', 'success');
      await this.cargarPerfil(true);
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Utils.showToast('Error al guardar perfil', 'error');
    } finally {
      Utils.hideLoading();
    }
  }
};

window.Profile = Profile;
console.log('✅ profile.js v10.6 - Validaciones de peso y altura añadidas');