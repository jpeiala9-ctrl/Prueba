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
            // Si ya había un wrapper de "Mis últimos entrenamientos" con
            // mapas GPS ya cargados (p.ej. simplemente saliste y volviste
            // a la pestaña Perfil), lo preservamos: sin esto, cada cambio
            // de pestaña destruía y recreaba los 5 mini-mapas desde cero.
            const wrapperCacheRapida = document.getElementById('misEntrenamientosWrapper');
            if (wrapperCacheRapida) wrapperCacheRapida.remove();
            container.innerHTML = html;
            const slotCacheRapida = document.getElementById('misEntrenamientosWrapper');
            if (wrapperCacheRapida && slotCacheRapida) {
              slotCacheRapida.replaceWith(wrapperCacheRapida);
            }
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
      const height = profile.height ? Utils.escapeHTML((profile.height / 100).toFixed(2) + ' m') : '—';

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
        // Reparación puntual (una vez por sesión de la app): si el usuario
        // tiene una sesión con GPS pero nunca se le concedió la insignia
        // FIRST_GPS (bug ya corregido en calendar.js para sesiones
        // nuevas), se concede aquí sin tocar XP/distancia/sesiones.
        if (!gamificationData.firstGPSEver && !Gamification._gpsBadgeChecked) {
          Gamification._gpsBadgeChecked = true;
          try {
            const reparado = await Gamification.repararBadgeGPS(AppState.currentUserId);
            if (reparado) {
              gamificationData = await Gamification.getData(AppState.currentUserId);
              Utils.showToast('📍 Insignia "GPS activado" desbloqueada', 'success', 4000);
            }
          } catch (e) { console.warn('Error reparando insignia GPS:', e); }
        }

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

      // MIS ÚLTIMOS ENTRENAMIENTOS: el contenido real (incluidos los
      // mini-mapas Leaflet ya cargados) NO va dentro de este `html` que se
      // vuelca entero en el contenedor. En su lugar dejamos aquí solo un
      // hueco vacío con id fijo; el contenido de verdad se gestiona aparte
      // en _actualizarMisEntrenamientos(), que solo toca en el DOM las
      // entradas que de verdad cambian (nuevas / caídas del top-5). Así,
      // cambiar la bio, la zapatilla, la foto o el nivel (cosas que antes
      // forzaban `cargarPerfil(true)` y por tanto un `innerHTML` completo)
      // ya no destruye ni recarga los mapas GPS de sesiones que no han
      // cambiado.
      html += '<div id="misEntrenamientosWrapper"></div>';

      // Si ya existía un wrapper con mapas ya inicializados, lo guardamos
      // para reinsertarlo tal cual (sin pasar por innerHTML) después de
      // repintar el resto del perfil.
      const wrapperPrevio = document.getElementById('misEntrenamientosWrapper');

      // Si ya se pintó desde caché (forceRefresh=false) y el HTML recién
      // obtenido de Firestore es idéntico, no se vuelve a escribir el DOM.
      // Antes se sobreescribía SIEMPRE, destruyendo y recreando el <img>
      // del avatar en cada entrada a la pestaña Perfil, lo que causaba el
      // parpadeo de la foto aunque la imagen fuera exactamente la misma.
      const sinCambios = htmlCache !== null && htmlCache === html;
      if (!sinCambios) {
        // Si había un wrapper de entrenamientos con mapas ya inicializados,
        // lo sacamos del DOM ANTES del innerHTML (que si no, lo destruiría
        // junto con los mapas Leaflet que contiene) y lo guardamos para
        // reinsertarlo tal cual justo después.
        if (wrapperPrevio) wrapperPrevio.remove();
        container.innerHTML = html;
        const nuevoSlot = document.getElementById('misEntrenamientosWrapper');
        if (wrapperPrevio && nuevoSlot) {
          nuevoSlot.replaceWith(wrapperPrevio);
        }
      }
      console.timeEnd('cargarPerfil');

      localStorage.setItem(cacheKey, JSON.stringify({ html, timestamp: Date.now() }));

      // Reconciliación de "Mis últimos entrenamientos": SIEMPRE se ejecuta
      // (cambie o no el resto del perfil), pero solo toca en el DOM las
      // entradas que de verdad han cambiado. Las que siguen en el top-5 se
      // quedan exactamente como estaban -> su mini-mapa GPS, una vez
      // cargado tras finalizar la sesión, no se vuelve a tocar ni recargar
      // hasta que 5 sesiones más nuevas la saquen de la lista.
      this._actualizarMisEntrenamientos().catch(e => console.warn('Error actualizando mis entrenamientos:', e));

      // Los listeners se enganchan SIEMPRE, cambie o no el HTML: si no
      // cambia, el contenido pintado al instante desde caché (más arriba,
      // forceRefresh=false) nunca había tenido listeners enganchados, así
      // que saltárselo aquí dejaba los botones muertos (cambiar zapatilla,
      // historial, dar/ver "me gusta", abrir el mapa GPS...).
      setTimeout(() => {
        // Un solo listener delegado en el contenedor estable, enganchado
        // UNA SOLA VEZ (guardado con un flag), en vez de un listener por
        // cada botón cada vez que se repinta. El patrón anterior
        // (removeEventListener(fn) + addEventListener(fn.bind(this))) no
        // funcionaba de verdad: bind() crea una función nueva cada vez, así
        // que removeEventListener nunca encontraba nada que quitar y los
        // listeners se iban acumulando en los mismos botones cada vez que
        // se volvía a Perfil sin que cambiaran los datos (por el atajo de
        // "sin cambios" que evita repintar el HTML). Con varios listeners
        // apilados, un solo toque podía disparar el mismo borrado o "me
        // gusta" varias veces seguidas.
        if (!container.dataset.delegatedListenersBound) {
          container.dataset.delegatedListenersBound = '1';
          container.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.wall-delete-btn-profile');
            if (deleteBtn) { this._handleDeleteClickProfile(deleteBtn, e); return; }
            const likeBtn = e.target.closest('.wall-like-btn');
            if (likeBtn) { this._handleLikeClickProfile(likeBtn, e); return; }
            const badgeIcon = e.target.closest('.badge-icon');
            if (badgeIcon) { this._mostrarModalInsignias(); return; }
            const wallItem = e.target.closest('.wall-item');
            if (wallItem) { this._handleItemClickProfile(wallItem, e); return; }
          });
        }
        const changeBtn = document.getElementById('changeShoeBtn');
        if (changeBtn) changeBtn.onclick = () => this._mostrarModalCambiarZapatilla();
        const historyBtn = document.getElementById('historyShoeBtn');
        if (historyBtn) historyBtn.onclick = () => this._mostrarModalHistorial();
      }, 0);

    } catch (error) {
      console.error('Error cargando perfil:', error);
      if (container && !htmlCache) container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error al cargar perfil</p>';
    }
  },

  // Construye el HTML de UNA sola entrada de "Mis últimos entrenamientos"
  // (con su mini-mapa GPS si tiene). Extraído a su propia función para
  // poder reutilizarlo tanto en el primer pintado como al añadir una
  // entrada nueva sin tocar las demás.
  _renderEntrenamientoItemHTML(entryId, entry) {
    let fecha = '—', hora = '';
    try {
      if (entry.timestamp) {
        let dateObj = entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
        fecha = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        hora = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (_) {}

    const likeCount = Number(entry.likeCount) || 0;

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
      ? `<span style="font-size:10px; font-weight:600; letter-spacing:1px; color:var(--gold); background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.3); border-radius:20px; padding:2px 8px; margin-left:6px;">📍 GPS</span>`
      : '';

    let miniMapHTML = '';
    if (entry.hasGPS && Array.isArray(entry.trackPoints) && entry.trackPoints.length >= 2) {
      const tapId = `miniMapTapProfile_${entryId}`;
      const distReal = entry.gpsDistanceKm ? Number(entry.gpsDistanceKm).toFixed(2) + ' km' : '';
      // Miniatura del recorrido: se lee DIRECTAMENTE de localStorage (se
      // generó y se guardó una sola vez al finalizar la sesión, en
      // gps-tracker.js). Sin Leaflet, sin red, sin esperas: o está en
      // caché y se pinta al instante, o (solo como red de seguridad, p.ej.
      // una sesión antigua o sincronizada desde otro dispositivo) se
      // genera aquí mismo al vuelo con los mismos trackPoints, igual de
      // instantáneo porque tampoco depende de ninguna librería externa.
      let svgRuta = null;
      try { svgRuta = localStorage.getItem(`mapaEstatico_${entryId}`); } catch (e) {}
      if (!svgRuta && window.GPSTracker && typeof GPSTracker.renderTrackSVG === 'function') {
        svgRuta = GPSTracker.renderTrackSVG(entry.trackPoints, 400, 130);
        if (svgRuta) { try { localStorage.setItem(`mapaEstatico_${entryId}`, svgRuta); } catch (e) {} }
      }
      miniMapHTML = `
        <div style="margin-top:10px; border-radius:10px; overflow:hidden; border:1px solid var(--border-color); position:relative; height:130px;">
          <div class="gps-minimap-static" data-entry-id="${entryId}" style="height:100%; width:100%; background:var(--stat-bg);">${svgRuta || ''}</div>
          <div id="${tapId}" style="position:absolute; inset:0; z-index:5; cursor:pointer; background:transparent;"></div>
          <div style="position:absolute; bottom:0; left:0; right:0; display:flex; justify-content:center; padding-bottom:10px; pointer-events:none;">
            <div style="background:rgba(0,0,0,0.72); color:var(--gold); font-size:10px; letter-spacing:1.5px; padding:5px 14px; border-radius:20px; border:1px solid rgba(192,160,96,0.35); font-family:'Courier New',monospace;">
              🗺 VER RECORRIDO${distReal ? ' · 📍 ' + distReal : ''}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="wall-item" data-entry-id="${entryId}" style="margin-bottom:16px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${avatarHTML}
            <div>
              <div class="wall-username">${Utils.escapeHTML(usernameFormatted)}</div>
              <div class="wall-fecha">${fecha} · ${hora}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <button class="wall-like-btn" data-entry-id="${entryId}" style="background:transparent; border:none; padding:6px 12px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-size:14px; color:var(--text-secondary); transition:all 0.2s ease;">
              ❤️ <span class="like-count">${likeCount}</span>
            </button>
            <button class="wall-delete-btn-profile" data-entry-id="${entryId}" title="Eliminar entrenamiento" style="background:transparent; border:none; padding:6px 8px; border-radius:20px; cursor:pointer; font-size:14px; color:var(--text-secondary); transition:all 0.2s ease;">
              🗑️
            </button>
          </div>
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
  },

  // La miniatura del recorrido ya viene pintada como parte del HTML de la
  // entrada (SVG estático leído de localStorage o generado al vuelo desde
  // trackPoints, ver _renderEntrenamientoItemHTML): no hay ningún mapa
  // Leaflet que crear ni esperar aquí. Lo único que sigue haciendo falta
  // es enganchar el toque para abrir el visor interactivo real
  // (GPSTrackViewer), que sigue usando Leaflet pero solo se carga bajo
  // demanda cuando el usuario realmente lo abre, no al ver el perfil.
  _vincularToqueEntrada(entryId, entry) {
    if (!entry || !entry.hasGPS || !Array.isArray(entry.trackPoints) || entry.trackPoints.length < 2) return;
    const tapId = `miniMapTapProfile_${entryId}`;
    const tapOverlay = document.getElementById(tapId);
    if (tapOverlay && !tapOverlay.dataset.bound) {
      tapOverlay.dataset.bound = '1';
      Utils.bindTap(tapOverlay, () => {
        if (window.GPSTrackViewer) GPSTrackViewer.open(entry);
      });
    }
  },

  _vincularToqueTodasLasEntradas() {
    Object.keys(this._gpsEntries || {}).forEach(entryId => {
      this._vincularToqueEntrada(entryId, this._gpsEntries[entryId]);
    });
  },


  // Reconciliación por entrada de "Mis últimos entrenamientos": trae el
  // top-5 real de Firestore y actualiza el DOM tocando SOLO lo que cambió.
  // - Entradas nuevas (sesión recién completada): se crean y se insertan
  //   arriba del todo.
  // - Entradas que ya no están en el top-5 (las desplazó una más nueva):
  //   se eliminan.
  // - Entradas que siguen en el top-5: NO SE TOCAN (su <div> y su mapa
  //   Leaflet ya inicializado se quedan exactamente como estaban); solo se
  //   actualiza el contador de "me gusta" con un parche puntual de texto,
  //   sin recrear nada más. Así el mapa, una vez cargado al finalizar la
  //   sesión, no se vuelve a recargar nunca hasta que la propia entrada
  //   desaparezca de la lista.
  async _actualizarMisEntrenamientos() {
    const wrapper = document.getElementById('misEntrenamientosWrapper');
    if (!wrapper || !AppState.currentUserId) return;

    let snapshot;
    try {
      snapshot = await firebaseServices.db
        .collection('globalFeed')
        .where('userId', '==', AppState.currentUserId)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();
    } catch (error) {
      console.warn('Error cargando mis últimos entrenamientos:', error);
      return;
    }

    if (snapshot.empty) {
      if (!wrapper.dataset.vacio) {
        wrapper.dataset.vacio = '1';
        delete wrapper.dataset.inicializado;
        wrapper.innerHTML = `<div style="margin-top:24px; margin-bottom:24px; background:var(--bg-secondary); border-radius:16px; padding:16px; text-align:center;">
          <h3 style="margin-top:0; margin-bottom:8px;">📋 MIS ÚLTIMOS ENTRENAMIENTOS</h3>
          <p style="font-size:14px;">Aún no has compartido ningún entrenamiento.<br>Completa sesiones en la pestaña PLAN y márcalas como realizadas.</p>
        </div>`;
      }
      this._gpsEntries = {};
      return;
    }
    wrapper.dataset.vacio = '';

    const entriesNuevas = {};
    const ordenNuevo = [];
    snapshot.docs.forEach(doc => {
      const entry = doc.data();
      entriesNuevas[doc.id] = entry;
      ordenNuevo.push(doc.id);
      if (entry.hasGPS && entry.trackPoints) this._gpsEntries[doc.id] = { ...entry, id: doc.id };
    });

    // Primera vez que hay datos: construir la estructura (título + lista)
    // desde cero.
    if (!wrapper.dataset.inicializado) {
      wrapper.dataset.inicializado = '1';
      let itemsHTML = '';
      ordenNuevo.forEach(entryId => {
        itemsHTML += this._renderEntrenamientoItemHTML(entryId, entriesNuevas[entryId]);
      });
      wrapper.innerHTML = `
        <div class="mis-entrenamentos-section" style="margin-top:24px; margin-bottom:24px; background:var(--bg-secondary); border-radius:16px; padding:16px;">
          <h3 style="margin-top:0; margin-bottom:16px; text-align:left; font-size:18px;">📋 MIS ÚLTIMOS ENTRENAMIENTOS</h3>
          <div id="listaMisEntrenamientos"></div>
        </div>
      `;
      const lista = document.getElementById('listaMisEntrenamientos');
      lista.innerHTML = itemsHTML;
      this._vincularToqueTodasLasEntradas();
      return;
    }

    // Reconciliación incremental sobre la lista ya existente.
    const lista = document.getElementById('listaMisEntrenamientos');
    if (!lista) return;
    const existentes = Array.from(lista.children).map(el => el.dataset.entryId);

    // 1) Quitar las que ya no están en el top-5 (las desplazaron otras
    //    más nuevas). También se borra su miniatura cacheada: ya no hace
    //    falta y así localStorage no crece sin límite con el tiempo.
    existentes.forEach(entryId => {
      if (!ordenNuevo.includes(entryId)) {
        const el = lista.querySelector(`[data-entry-id="${entryId}"]`);
        if (el) el.remove();
        delete this._gpsEntries[entryId];
        try { localStorage.removeItem(`mapaEstatico_${entryId}`); } catch (e) {}
      }
    });

    // 2) Insertar las nuevas (sesión recién finalizada) arriba del todo,
    //    en el mismo orden en que vienen del servidor (más reciente primero).
    const nuevas = ordenNuevo.filter(id => !existentes.includes(id));
    nuevas.slice().reverse().forEach(entryId => {
      const div = document.createElement('div');
      div.innerHTML = this._renderEntrenamientoItemHTML(entryId, entriesNuevas[entryId]).trim();
      const nodo = div.firstElementChild;
      lista.insertBefore(nodo, lista.firstChild);
    });

    // 3) Las que ya estaban y siguen estando: NO se tocan. Solo se
    //    refresca el contador de "me gusta" con un parche de texto puntual
    //    (esto no afecta a la miniatura ni a ningún otro nodo de la entrada).
    existentes.forEach(entryId => {
      if (!ordenNuevo.includes(entryId)) return;
      const entry = entriesNuevas[entryId];
      const el = lista.querySelector(`[data-entry-id="${entryId}"]`);
      if (!el || !entry) return;
      const likeSpan = el.querySelector('.like-count');
      const likeCountNuevo = String(Number(entry.likeCount) || 0);
      if (likeSpan && likeSpan.textContent !== likeCountNuevo) {
        likeSpan.textContent = likeCountNuevo;
      }
    });

    // Solo hace falta enganchar el toque de las entradas nuevas; las que
    // ya estaban no necesitan nada más (su miniatura ya está pintada).
    this._vincularToqueTodasLasEntradas();
  },

  _handleItemClickProfile(item, e) {
    if (e.target.closest('.wall-like-btn') || e.target.closest('.wall-delete-btn-profile')) return;
    const entryId = item.dataset.entryId;
    if (entryId) this._mostrarLikesDeEntrenamiento(entryId);
  },

  _handleLikeClickProfile(btn, e) {
    e.stopPropagation();
    const entryId = btn.dataset.entryId;
    if (entryId) this._mostrarLikesDeEntrenamiento(entryId);
  },

  async _handleDeleteClickProfile(btn, e) {
    e.stopPropagation();
    const entryId = btn.dataset.entryId;
    if (!entryId || !AppState.currentUserId) return;
    if (!confirm('¿Eliminar este entrenamiento de tu perfil y del muro? Se desmarcará también como "realizada" en tu plan. No se puede deshacer.')) return;
    try {
      // Leer el documento ANTES de borrarlo: necesitamos planId/sesionIndex
      // para poder limpiar también la referencia en el plan (wallEntryId) y
      // desmarcar la sesión como realizada. Antes esto no se hacía, así que
      // el plan se quedaba apuntando a una entrada ya borrada y la sesión
      // seguía figurando como "hecha" en el calendario, sin datos reales
      // detrás — un estado inconsistente.
      const entryDoc = await firebaseServices.db.collection('globalFeed').doc(entryId).get();
      const entryData = entryDoc.exists ? entryDoc.data() : null;

      await firebaseServices.db.collection('globalFeed').doc(entryId).delete();

      // Quitarlo del DOM y avisar YA MISMO: lo que de verdad importa (el
      // borrado) ya ha ocurrido. Antes el aviso esperaba a que terminara
      // también todo lo de abajo (desmarcar en el plan, buscar la sesión
      // anterior para "última sesión", revertir gamificación...), una
      // cadena de varias llamadas a la nube una detrás de otra, y eso
      // hacía que el aviso tardase en aparecer mucho más de lo que
      // realmente hacía falta.
      const item = document.querySelector(`.wall-item[data-entry-id="${entryId}"]`);
      if (item) item.remove();
      delete this._gpsEntries[entryId];
      try { localStorage.removeItem(`mapaEstatico_${entryId}`); } catch (e) {}
      if (AppState.currentUserId) {
        localStorage.removeItem(`perfil_${AppState.currentUserId}`);
      }
      Utils.showToast('🗑️ Entrenamiento eliminado', 'success');

      if (entryData && entryData.planId && entryData.sesionIndex !== undefined && entryData.sesionIndex !== null) {
        try {
          const planRef = firebaseServices.db
            .collection('users').doc(AppState.currentUserId)
            .collection('planes').doc(entryData.planId);
          await planRef.update({
            [`wallEntryId.${entryData.sesionIndex}`]: firebaseServices.FieldValue.delete(),
            [`sesionesRealizadas.${entryData.sesionIndex}`]: firebaseServices.FieldValue.delete()
          });
          // Si es el plan que se está viendo ahora mismo, refrescar también
          // el estado en memoria para que el calendario lo refleje al
          // instante si el usuario va a la pestaña Plan.
          if (AppState.planActualId === entryData.planId && AppState.sesionesRealizadas) {
            delete AppState.sesionesRealizadas[entryData.sesionIndex];
            // Antes solo se actualizaba el dato en memoria, pero nadie le
            // decía a la cuadrícula del calendario que se volviera a
            // dibujar -- así que si tenías el Plan abierto (o volvías a él
            // sin recargar la app entera), el día seguía viéndose en verde
            // como "realizado" aunque ya no lo estuviera.
            if (window.PlanGenerator && typeof PlanGenerator.renderizarMes === 'function') {
              PlanGenerator.renderizarMes();
            }
          }
        } catch (planErr) {
          console.warn('No se pudo desmarcar la sesión en el plan (el entrenamiento sí se borró):', planErr);
        }
      }

      // Si la entrada borrada era justo la que estaba guardada como
      // "última sesión" (Inicio), hay que actualizarla: o bien a la
      // siguiente más reciente que quede, o a "ninguna" si no queda
      // ninguna. Antes se quedaba apuntando para siempre a algo ya
      // borrado -- por eso "última sesión" no cambiaba al borrar aunque
      // los km de la semana sí se descontaran bien.
      try {
        const eraUltimaSesion = AppState.currentUserData?.ultimaSesion?.entryId === entryId;
        if (eraUltimaSesion) {
          let nuevaUltima = null;
          try {
            let siguienteSnap;
            try {
              siguienteSnap = await firebaseServices.db
                .collection('globalFeed')
                .where('userId', '==', AppState.currentUserId)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();
            } catch (indexErr) {
              // Respaldo si falta el índice compuesto userId+timestamp:
              // traer varias y quedarse con la más reciente en el navegador.
              const fallbackSnap = await firebaseServices.db
                .collection('globalFeed')
                .where('userId', '==', AppState.currentUserId)
                .limit(20)
                .get();
              let masReciente = null, fechaMasReciente = null;
              fallbackSnap.forEach(doc => {
                const d = doc.data();
                const fecha = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
                if (!fechaMasReciente || fecha > fechaMasReciente) {
                  fechaMasReciente = fecha;
                  masReciente = doc;
                }
              });
              siguienteSnap = { empty: !masReciente, docs: masReciente ? [masReciente] : [] };
            }
            if (!siguienteSnap.empty) {
              const doc = siguienteSnap.docs[0];
              nuevaUltima = { ...doc.data(), entryId: doc.id };
            }
          } catch (queryErr) {
            console.warn('No se pudo buscar la sesión anterior para "última sesión":', queryErr);
          }
          await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
            ultimaSesion: nuevaUltima || firebaseServices.FieldValue.delete()
          });
          if (AppState.currentUserData) {
            AppState.currentUserData.ultimaSesion = nuevaUltima || null;
          }
          if (typeof window.actualizarUltimaSesionDashboard === 'function') {
            if (!nuevaUltima) {
              const ultEl = document.getElementById('dashboardUltimaSesionContent');
              if (ultEl) ultEl.innerHTML = 'Sin sesiones registradas aún.';
            } else {
              window.actualizarUltimaSesionDashboard();
            }
          }
        }
      } catch (ultimaErr) {
        console.warn('No se pudo sincronizar "última sesión" (el entrenamiento sí se borró):', ultimaErr);
      }
      if (typeof window.actualizarEstaSemanaDashboard === 'function') {
        window.actualizarEstaSemanaDashboard();
      }

      // Revertir la gamificación (XP, distancia total, nº de sesiones...)
      // ganada por este entrenamiento. Antes solo se revertía si desmarcabas
      // la sesión desde el propio calendario del plan; borrar desde el
      // perfil dejaba esos puntos "de más" para siempre.
      if (window.Gamification && entryData) {
        try {
          const distanciaRevertir = parseFloat(entryData.gpsDistanceKm || entryData.distancia || 0) || 0;
          const sesionParaRevertir = {
            tipo: entryData.trainingType || 'rodaje',
            duracion: entryData.duration || Math.round((entryData.gpsDurationMs || 0) / 60000) || 0
          };
          const metricasRevertir = { distanciaTotal: distanciaRevertir, tssTotal: 0 };
          await Gamification.removeSession(AppState.currentUserId, sesionParaRevertir, metricasRevertir, entryData.sesionIndex);
        } catch (gamErr) {
          console.warn('No se pudo revertir la gamificación (el entrenamiento sí se borró):', gamErr);
        }
      }

      // Recarga el perfil para reflejar de inmediato la gamificación
      // revertida (XP, nivel, distancia total...), no solo en la próxima
      // visita a la pestaña.
      await this.cargarPerfil(true);
    } catch (error) {
      console.error('Error eliminando entrenamiento:', error);
      Utils.showToast('No se pudo eliminar el entrenamiento', 'error');
    }
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
      div.addEventListener('click', async (e) => { if (!e.target.classList.contains('view-profile-btn-profile')) { await Friends?.abrirModalAmigo(user.uid); this._closeLikesModal(); } });
      div.querySelector('.view-profile-btn-profile')?.addEventListener('click', async (e) => { e.stopPropagation(); await Friends?.abrirModalAmigo(user.uid); this._closeLikesModal(); });
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
      if (heightInput) heightInput.value = profile.height ? (profile.height / 100).toFixed(2) : '';
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
      const alturaMetros = parseFloat(document.getElementById('editHeight')?.value) || null;

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

      // Validación de altura en metros (antes decía "cm" en el mensaje de
      // error aunque el campo, mal etiquetado, mezclaba las dos unidades).
      if (alturaMetros !== null && (alturaMetros < 1.00 || alturaMetros > 2.50)) {
        Utils.showToast('⚠️ La altura debe estar entre 1.00 y 2.50 m', 'error');
        Utils.hideLoading();
        return;
      }
      // Se guarda en cm por dentro (compatible con los datos ya guardados
      // de otros usuarios, que el resto de la app ya divide entre 100 para
      // mostrar en metros), pero se introduce y valida siempre en metros.
      const height = alturaMetros !== null ? Math.round(alturaMetros * 100) : null;

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