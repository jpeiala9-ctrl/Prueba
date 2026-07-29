// ==================== friends.js - Versión definitiva con todas las protecciones ====================
// Versión: 3.46 - Mejora en perfil de no amigos: mensaje de privacidad en lugar de pasaporte vacío
// ====================

const Friends = {
  todosUsuariosPagination: { lastDoc: null, hasMore: true, loading: false },

  async getNivelDirecto(uid) {
    try {
      const doc = await firebaseServices.db.collection('gamification').doc(uid).get();
      return doc.exists ? (doc.data().level || 1) : 1;
    } catch (e) {
      console.warn('Error obteniendo nivel de', uid, e);
      return 1;
    }
  },

  async getNivelesDirectos(uids) {
    const niveles = {};
    for (let i = 0; i < uids.length; i += 10) {
      const batch = uids.slice(i, i + 10);
      const promises = batch.map(uid => this.getNivelDirecto(uid));
      const resultados = await Promise.all(promises);
      batch.forEach((uid, idx) => {
        niveles[uid] = resultados[idx];
      });
    }
    return niveles;
  },

  async _limpiarAmigosHuérfanos(userId, friendIds) {
    if (!friendIds || friendIds.length === 0) return { validIds: [], changed: false };
    const validIds = [];
    const chunks = [];
    for (let i = 0; i < friendIds.length; i += 10) {
      chunks.push(friendIds.slice(i, i + 10));
    }
    for (const chunk of chunks) {
      const snapshot = await firebaseServices.db.collection('users')
        .where('__name__', 'in', chunk)
        .get();
      snapshot.forEach(doc => validIds.push(doc.id));
    }
    const changed = validIds.length !== friendIds.length;
    if (changed) {
      await firebaseServices.db.collection('users').doc(userId).update({
        friendIds: validIds,
        friendsCount: validIds.length
      });
      if (AppState.currentUserData) {
        AppState.currentUserData.friendIds = validIds;
        AppState.currentUserData.friendsCount = validIds.length;
      }
    }
    return { validIds, changed };
  },

  initEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-friend-action]');
      if (!target) return;
      const action = target.getAttribute('data-friend-action');
      const uid = target.getAttribute('data-uid');
      const username = target.getAttribute('data-username');
      const requestId = target.getAttribute('data-request-id');
      if (action === 'agregar' && uid && username) this.enviarSolicitud(uid, username);
      else if (action === 'aceptar' && uid && requestId) this.aceptarSolicitud(requestId, uid, AppState.currentUserId);
      else if (action === 'rechazar' && uid && requestId) this.rechazarSolicitud(requestId);
      else if (action === 'cancelar' && requestId) this.cancelarSolicitud(requestId);
    });

    document.addEventListener('click', (e) => {
      const chatBtn = e.target.closest('.chat-btn');
      if (chatBtn && chatBtn.dataset.uid && chatBtn.dataset.username) {
        e.stopPropagation();
        Chat.startChatWithFriend(chatBtn.dataset.uid, chatBtn.dataset.username);
        return;
      }
      const deleteBtn = e.target.closest('.delete-friend-btn');
      if (deleteBtn && deleteBtn.dataset.uid) {
        e.stopPropagation();
        this.eliminarAmigo(deleteBtn.dataset.uid);
        return;
      }
    });
  },

  async obtenerSolicitudesPendientes() {
    if (!AppState.currentUserId) return { enviadas: [], recibidas: [] };
    try {
      const [enviadasSnap, recibidasSnap] = await Promise.all([
        firebaseServices.db.collection('friendRequests').where('from', '==', AppState.currentUserId).where('status', '==', 'pending').get(),
        firebaseServices.db.collection('friendRequests').where('to', '==', AppState.currentUserId).where('status', '==', 'pending').get()
      ]);
      const enviadas = enviadasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const recibidas = recibidasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { enviadas, recibidas };
    } catch (error) { 
      console.error('Error obteniendo solicitudes pendientes:', error); 
      return { enviadas: [], recibidas: [] }; 
    }
  },

  async cargarSolicitudes(tipo) {
    const containerId = tipo === 'recibidas' ? 'listaSolicitudesRecibidas' : 'listaSolicitudesEnviadas';
    const container = document.getElementById(containerId);
    if (!container || !AppState.currentUserId) return;
    try {
      const { recibidas, enviadas } = await this.obtenerSolicitudesPendientes();
      const solicitudes = tipo === 'recibidas' ? recibidas : enviadas;
      if (solicitudes.length === 0) { 
        container.innerHTML = `<p style="text-align:center; padding:20px;">No tienes solicitudes ${tipo === 'recibidas' ? 'pendientes' : 'enviadas'}</p>`; 
        return; 
      }
      let html = '';
      for (const sol of solicitudes) {
        const otroUid = tipo === 'recibidas' ? sol.from : sol.to;
        const otroUser = await Storage.getUser(otroUid);
        const usernameFormatted = Utils.capitalizeUsername(otroUser?.username || 'Usuario');
        const userTag = otroUser?.username ? `@${Utils.escapeHTML(otroUser.username)}` : 'cuenta no disponible';
        const photoURL = otroUser?.profile?.photoURL;
        const nivel = await this.getNivelDirecto(otroUid);
        const colorNivel = Gamification.getColorByLevel(nivel);
        const avatarHTML = photoURL
          ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover;"><div class="nivel-badge" style="background: ${colorNivel}; color: white; text-shadow: 0 0 1px black;">${nivel}</div></div>`
          : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center;">👤</div><div class="nivel-badge" style="background: ${colorNivel}; color: white; text-shadow: 0 0 1px black;">${nivel}</div></div>`;
        let botones = '';
        if (tipo === 'recibidas') {
          botones = `<button class="btn-amigo" data-friend-action="aceptar" data-request-id="${sol.id}" data-uid="${sol.from}" data-username="${Utils.escapeHTML(usernameFormatted)}" style="background:var(--zone-2); border-color:var(--zone-2); color:var(--bg-primary);">✓ Aceptar</button>
                     <button class="btn-amigo eliminar" data-friend-action="rechazar" data-request-id="${sol.id}" data-uid="${sol.from}">✗ Rechazar</button>`;
        } else {
          botones = `<button class="btn-amigo eliminar" data-friend-action="cancelar" data-request-id="${sol.id}" data-uid="${sol.to}">✖️ Cancelar</button>`;
        }
        html += `
          <div class="solicitud-item">
            <div class="resultado-info" data-uid="${otroUid}" onclick="Friends.abrirModalAmigo('${otroUid}')">
              ${avatarHTML}
              <div>
                <div class="resultado-nombre">${Utils.escapeHTML(usernameFormatted)}</div>
                <div class="resultado-username">${Utils.escapeHTML(userTag)}</div>
              </div>
            </div>
            <div class="solicitud-botones">${botones}</div>
          </div>
        `;
      }
      container.innerHTML = html;
    } catch (error) { 
      console.error(`Error cargando solicitudes ${tipo}:`, error); 
      container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error al cargar solicitudes. Inténtalo de nuevo.</p>'; 
    }
  },

  cargarSolicitudesRecibidas() { this.cargarSolicitudes('recibidas'); },
  cargarSolicitudesEnviadas() { this.cargarSolicitudes('enviadas'); },

  async enviarSolicitud(toUid, toUsername) {
    if (!AppState.currentUserId) return;
    if (toUid === AppState.currentUserId) {
      Utils.showToast('No puedes enviarte una solicitud a ti mismo', 'error');
      return;
    }
    const confirmed = await Utils.confirm('Enviar solicitud', `¿Enviar solicitud de amistad a ${Utils.escapeHTML(toUsername)}?`);
    if (!confirmed) return;
    try {
      const ok = await Storage.sendFriendRequest(AppState.currentUserId, toUid);
      if (ok) {
        Utils.showToast('✅ Solicitud enviada', 'success');
        await this.cargarTodosUsuarios(true);
        await this.cargarSolicitudesEnviadas();
        const term = document.getElementById('buscarAmigosInput')?.value.trim();
        if (term && term.length >= 2) await this.buscarUsuarios();
      } else Utils.showToast('No se pudo enviar la solicitud', 'error');
    } catch (error) { console.error('Error enviando solicitud:', error); Utils.showToast('Error al enviar solicitud', 'error'); }
  },

  async _refreshCurrentUserData() {
    if (!AppState.currentUserId) return;
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      if (userDoc.exists) {
        AppState.currentUserData = userDoc.data();
        const { recibidas } = await this.obtenerSolicitudesPendientes();
        AppState.solicitudesPendientesCount = recibidas.length;
        AppState.actualizarBadgeSolicitudes();
      }
    } catch (error) { console.error('Error refrescando datos de usuario:', error); }
  },

  async aceptarSolicitud(requestId, fromUid, toUid) {
    if (AppState.currentUserId !== toUid) {
      Utils.showToast('No puedes aceptar esta solicitud', 'error');
      return;
    }
    try {
      await Storage.acceptFriendRequest(requestId, fromUid, toUid);
      Utils.showToast('✅ Solicitud aceptada', 'success');
      const conversationId = [fromUid, toUid].sort().join('_');
      const convRef = firebaseServices.db.collection('conversations').doc(conversationId);
      const convDoc = await convRef.get();
      if (!convDoc.exists) {
        const [userData, friendData] = await Promise.all([
          Storage.getUser(fromUid).catch(() => ({ username: 'Usuario', profile: {} })),
          Storage.getUser(toUid).catch(() => ({ username: 'Amigo', profile: {} }))
        ]);
        const participantsData = {
          [fromUid]: { username: userData.username || 'Usuario', photoURL: userData.profile?.photoURL || null },
          [toUid]: { username: friendData.username || 'Amigo', photoURL: friendData.profile?.photoURL || null }
        };
        await convRef.set({
          participants: [fromUid, toUid],
          participantsData,
          lastMessage: '',
          lastUpdated: firebaseServices.Timestamp.now(),
          created: firebaseServices.Timestamp.now()
        });
      }
      await this._refreshCurrentUserData();
      await this.cargarSolicitudesRecibidas();
      await this.cargarListaAmigos();
      await this.cargarTodosUsuarios(true);
      await this.actualizarBadgeSolicitudes();
    } catch (error) { console.error('Error aceptando solicitud:', error); Utils.showToast('Error al aceptar', 'error'); }
  },

  async rechazarSolicitud(requestId) {
    try {
      await Storage.rejectFriendRequest(requestId);
      Utils.showToast('Solicitud rechazada', 'info');
      await this.cargarSolicitudesRecibidas();
      await this.cargarTodosUsuarios(true);
      await this.actualizarBadgeSolicitudes();
    } catch (error) { console.error('Error rechazando solicitud:', error); Utils.showToast('Error al rechazar', 'error'); }
  },

  async cancelarSolicitud(requestId) {
    const confirmed = await Utils.confirm('Cancelar solicitud', '¿Cancelar esta solicitud de amistad?');
    if (!confirmed) return;
    try {
      await firebaseServices.db.collection('friendRequests').doc(requestId).update({ status: 'cancelled' });
      Utils.showToast('✅ Solicitud cancelada', 'success');
      await this.cargarTodosUsuarios(true);
      await this.actualizarBadgeSolicitudes();
      await this.cargarSolicitudesEnviadas();
      const term = document.getElementById('buscarAmigosInput')?.value.trim();
      if (term && term.length >= 2) await this.buscarUsuarios();
    } catch (error) { 
      console.error('Error cancelando solicitud:', error); 
      if (error.code === 'not-found') { 
        Utils.showToast('La solicitud ya no existe', 'info'); 
        await this.cargarTodosUsuarios(true); 
        await this.actualizarBadgeSolicitudes();
        await this.cargarSolicitudesEnviadas();
      } else Utils.showToast('Error al cancelar: ' + (error.message || 'desconocido'), 'error'); 
    }
  },

  async cargarListaAmigos(forceRefresh = false) {
    const container = document.getElementById('listaAmigos');
    if (!container || !AppState.currentUserId) return;

    const cacheKey = `amigos_lista_${AppState.currentUserId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (!forceRefresh && cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 1000) {
          this._renderListaAmigos(data);
          return;
        }
      } catch (e) {}
    }

    try {
      const userRef = firebaseServices.db.collection('users').doc(AppState.currentUserId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      let friendIds = userData.friendIds || [];
      const { validIds, changed } = await this._limpiarAmigosHuérfanos(AppState.currentUserId, friendIds);
      if (changed) friendIds = validIds;
      if (friendIds.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Aún no tienes amigos. ¡Busca y añade!</p>';
        sessionStorage.removeItem(cacheKey);
        return;
      }
      const amigosData = [];
      for (let i = 0; i < friendIds.length; i += 10) {
        const batch = friendIds.slice(i, i + 10);
        const snapshots = await Promise.all(batch.map(fid => firebaseServices.db.collection('users').doc(fid).get()));
        snapshots.forEach(doc => {
          if (doc.exists) amigosData.push({ uid: doc.id, ...doc.data() });
        });
      }
      const niveles = await this.getNivelesDirectos(amigosData.map(a => a.uid));
      const dataToCache = { amigos: amigosData, niveles };
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: dataToCache, timestamp: Date.now() }));
      this._renderListaAmigos(dataToCache);
    } catch (error) {
      console.error('Error cargando lista de amigos:', error);
      container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error al cargar amigos</p>';
    }
  },

  _renderListaAmigos({ amigos, niveles }) {
    const container = document.getElementById('listaAmigos');
    if (!container) return;
    if (!amigos || amigos.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:20px;">Aún no tienes amigos. ¡Busca y añade!</p>';
      return;
    }
    let html = '';
    for (const amigo of amigos) {
      const nivel = niveles[amigo.uid] || 1;
      const color = Gamification.getColorByLevel(nivel);
      const badgeStyle = `background: ${color}; color: white; text-shadow: 0 0 1px black;`;
      const textStyle = `color: ${color}; font-weight: bold;`;
      const photoURL = amigo.profile?.photoURL;
      const avatarHTML = photoURL
        ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover;"><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`
        : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center;">👤</div><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`;
      const usernameFormatted = Utils.capitalizeUsername(amigo.username);
      html += `
        <div class="resultado-busqueda" style="justify-content:space-between;">
          <div class="resultado-info" data-uid="${amigo.uid}" onclick="Friends.abrirModalAmigo('${amigo.uid}')">
            ${avatarHTML}
            <div>
              <div class="resultado-nombre">${Utils.escapeHTML(usernameFormatted)} <span style="font-size:10px; ${textStyle}">(Nv. ${nivel})</span></div>
              <div class="resultado-username">@${Utils.escapeHTML(amigo.username)}</div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-amigo chat-btn" data-uid="${amigo.uid}" data-username="${Utils.escapeHTML(usernameFormatted)}">💬 CHAT</button>
            <button class="btn-amigo eliminar delete-friend-btn" data-uid="${amigo.uid}">✕</button>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  },

  async eliminarAmigo(friendUid) {
    const confirmed = await Utils.confirm('Eliminar amigo', '¿Eliminar este amigo?');
    if (!confirmed) return;
    try {
      await Storage.removeFriend(AppState.currentUserId, friendUid);
      Utils.showToast('✅ Amigo eliminado', 'success');
      await this._refreshCurrentUserData();
      await this.cargarListaAmigos(true);
      await this.cargarTodosUsuarios(true);
      sessionStorage.removeItem(`amigos_lista_${AppState.currentUserId}`);
    } catch (error) { console.error('Error eliminando amigo:', error); Utils.showToast('Error al eliminar', 'error'); }
  },

  // ============================================================
  //  MODAL DE PERFIL DE USUARIO (PASAPORTE CON PRIVACIDAD)
  // ============================================================
  async abrirModalAmigo(uid) {
    // Si es el propio usuario, mostrar modal especial (sin cambios)
    if (uid === AppState.currentUserId) {
      const userData = AppState.currentUserData;
      if (!userData) {
        Utils.showToast('No se pudo cargar tu perfil', 'error');
        return;
      }
      const modalTitle = document.querySelector('#modalAmigo h3');
      if (modalTitle) {
        modalTitle.textContent = 'TU PERFIL';
        modalTitle.style.display = 'block';
        modalTitle.style.margin = '0 0 16px 0';
        modalTitle.style.color = 'var(--accent-yellow)';
      }
      
      const gamificationData = await Gamification.getData(uid);
      const shoe = await Gamification.getCurrentShoe(uid);
      const shoeName = (shoe && shoe.name) ? shoe.name : 'Zapatilla actual';
      const shoeKm = (shoe && shoe.km) ? shoe.km.toFixed(1) : '0.0';
      
      const level = gamificationData?.level || 1;
      const levelColor = Gamification.getColorByLevel(level);
      const totalDistance = gamificationData?.totalDistance || 0;
      const totalSessions = gamificationData?.totalSessions || 0;
      const totalXP = gamificationData?.totalXP || 0;
      const badges = gamificationData?.badges || [];
      
      const progress = Gamification.getProgressToNextLevel(totalDistance);
      const nextLevel = Gamification.LEVELS_KM.find(l => l.level === level + 1);
      const nextKm = nextLevel ? nextLevel.kmNeeded : totalDistance;
      
      const badgesStamps = badges.map(badgeId => {
        const badge = Gamification.BADGES[badgeId];
        if (!badge) return '';
        return `<span class="badge" title="${badge.description}" style="display:inline-flex; align-items:center; gap:4px; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:30px; padding:4px 10px; font-size:12px; margin:0 4px;">${badge.icon} ${badge.name}</span>`;
      }).filter(b => b).join('');
      
      const userName = Utils.capitalizeUsername(userData.username || 'Usuario');
      const photoURL = userData.profile?.photoURL;
      const avatarHTML = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid ${levelColor};">`
        : `<div style="width:60px; height:60px; border-radius:50%; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:30px; border:2px solid ${levelColor};">👤</div>`;
      
      const botonAccion = `<span style="font-size:14px; color:var(--zone-2);">✨ Este eres tú</span>`;
      
      const contenido = `
        <div style="background:var(--bg-card); border-radius:16px; border:1px solid var(--border-color); overflow:hidden;">
          <div style="padding:20px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
              ${avatarHTML}
              <div>
                <div style="font-size:18px; font-weight:500; color:var(--accent-yellow);">${Utils.escapeHTML(userName)}</div>
                <div style="font-size:12px; color:var(--text-secondary);">@${Utils.escapeHTML(userData.username || '')}</div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <div style="font-size:12px; color:var(--text-secondary);">Nivel</div>
                <div style="font-size:32px; font-weight:400; color:${levelColor};">${level}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px; color:var(--text-secondary);">Zapatilla actual</div>
                <div><strong>${Utils.escapeHTML(shoeName)}</strong></div>
                <div style="font-size:12px; color:var(--text-secondary);">${shoeKm} km</div>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="background:var(--bg-secondary); height:4px; border-radius:4px; overflow:hidden;">
                <div style="width: ${progress}%; background: ${levelColor}; height:4px;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:8px;">
                <span style="font-size:10px; color:var(--text-secondary);">0 km</span>
                <span style="font-size:10px; color:var(--text-secondary);">${totalDistance.toFixed(0)} km</span>
                <span style="font-size:10px; color:var(--text-secondary);">${nextKm} km</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 20px;">
              <div>
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">Distancia</div>
                <strong style="font-size:16px;">${totalDistance.toFixed(1)}</strong>
                <span style="font-size:10px;"> km</span>
              </div>
              <div>
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">Sesiones</div>
                <strong style="font-size:16px;">${totalSessions}</strong>
              </div>
              <div>
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">XP</div>
                <strong style="font-size:16px;">${totalXP}</strong>
              </div>
            </div>
            ${badgesStamps ? `<div style="border-top:1px solid var(--border-color); padding-top:16px; margin-bottom:16px;">
              <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">Insignias</div>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${badgesStamps}</div>
            </div>` : '<p style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Aún no tienes insignias. ¡Completa entrenamientos!</p>'}
            <div style="display: flex; justify-content: center;">
              ${botonAccion}
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('modalAmigoContenido').innerHTML = contenido;
      document.getElementById('modalAmigoOverlay').style.display = 'block';
      document.getElementById('modalAmigo').style.display = 'block';
      return;
    }

    // ============================================================
    //  CASO NORMAL: OTRO USUARIO
    // ============================================================
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        Utils.showToast('Usuario no encontrado', 'error');
        return;
      }
      let userData = userDoc.data();

      // Saneamiento de datos
      if (!userData.username || typeof userData.username !== 'string') {
        userData.username = 'Usuario';
      }
      if (!userData.profile || typeof userData.profile !== 'object') {
        userData.profile = {};
      }
      if (userData.profile.photoURL && typeof userData.profile.photoURL !== 'string') {
        userData.profile.photoURL = null;
      }
      if (userData.profile.age !== undefined && typeof userData.profile.age !== 'number') {
        userData.profile.age = null;
      }
      if (userData.profile.weight !== undefined && typeof userData.profile.weight !== 'number') {
        userData.profile.weight = null;
      }
      if (userData.profile.height !== undefined && typeof userData.profile.height !== 'number') {
        userData.profile.height = null;
      }

      const modalTitle = document.querySelector('#modalAmigo h3');
      if (modalTitle) {
        modalTitle.textContent = Utils.capitalizeUsername(userData.username);
        modalTitle.style.display = 'block';
        modalTitle.style.margin = '0 0 16px 0';
        modalTitle.style.color = 'var(--accent-yellow)';
      }

      const friendIds = AppState.currentUserData?.friendIds || [];
      const esAmigo = friendIds.includes(uid);

      let gamificationData = null;
      let shoe = { name: 'Zapatilla actual', km: 0 };

      // Si es amigo, intentamos obtener los datos reales
      if (esAmigo) {
        try {
          gamificationData = await Gamification.getData(uid);
        } catch(e) {
          console.warn('Error obteniendo gamificación del amigo:', e);
        }
        try {
          const fetchedShoe = await Gamification.getCurrentShoe(uid);
          if (fetchedShoe && typeof fetchedShoe === 'object') {
            shoe = fetchedShoe;
          }
        } catch(e) {
          console.warn('Error obteniendo zapatilla del amigo:', e);
        }
      }

      const photoURL = userData.profile?.photoURL;
      const userName = Utils.capitalizeUsername(userData.username);
      
      // Avatar HTML (común para ambos casos)
      const avatarHTML = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-blue);">`
        : `<div style="width:60px; height:60px; border-radius:50%; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:30px; border:2px solid var(--accent-blue);">👤</div>`;

      // Construir botones de acción (igual que antes)
      let botonAccion = '';
      const { enviadas, recibidas } = await this.obtenerSolicitudesPendientes();
      
      if (esAmigo) {
        botonAccion = `<span style="font-size:14px; color:var(--zone-2);">✓ Ya son amigos</span>`;
      } else {
        const solicitudEnviada = enviadas.some(s => s.to === uid);
        const solicitudRecibida = recibidas.some(s => s.from === uid);
        if (solicitudEnviada) {
          const reqId = enviadas.find(s => s.to === uid).id;
          botonAccion = `<button class="btn-amigo" data-friend-action="cancelar" data-request-id="${reqId}" data-uid="${uid}">✖️ Cancelar solicitud</button>`;
        } else if (solicitudRecibida) {
          const reqId = recibidas.find(s => s.from === uid).id;
          botonAccion = `
            <div style="display:flex; gap:10px; justify-content:center;">
              <button class="btn-amigo" data-friend-action="aceptar" data-request-id="${reqId}" data-uid="${uid}" data-username="${Utils.escapeHTML(userName)}" style="background:var(--zone-2); border-color:var(--zone-2); color:var(--bg-primary);">✓ Aceptar</button>
              <button class="btn-amigo eliminar" data-friend-action="rechazar" data-request-id="${reqId}" data-uid="${uid}">✗ Rechazar</button>
            </div>
          `;
        } else {
          botonAccion = `<button class="btn-amigo" data-friend-action="agregar" data-uid="${uid}" data-username="${Utils.escapeHTML(userName)}">➕ Agregar amigo</button>`;
        }
      }

      // ============================================================
      //  CONTENIDO DEL MODAL (condicional según esAmigo)
      // ============================================================
      let contenido = `
        <div style="background:var(--bg-card); border-radius:16px; border:1px solid var(--border-color); overflow:hidden;">
          <div style="padding:20px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
              ${avatarHTML}
              <div>
                <div style="font-size:18px; font-weight:500; color:var(--accent-yellow);">${Utils.escapeHTML(userName)}</div>
                <div style="font-size:12px; color:var(--text-secondary);">@${Utils.escapeHTML(userData.username)}</div>
              </div>
            </div>
      `;

      if (esAmigo) {
        // ===== PASAPORTE COMPLETO (AMIGO) =====
        const level = gamificationData?.level || 1;
        const levelColor = Gamification.getColorByLevel(level);
        const totalDistance = gamificationData?.totalDistance || 0;
        const totalSessions = gamificationData?.totalSessions || 0;
        const totalXP = gamificationData?.totalXP || 0;
        const badges = gamificationData?.badges || [];
        const progress = Gamification.getProgressToNextLevel(totalDistance);
        const nextLevel = Gamification.LEVELS_KM.find(l => l.level === level + 1);
        const nextKm = nextLevel ? nextLevel.kmNeeded : totalDistance;
        const shoeName = (shoe && shoe.name) ? shoe.name : 'Zapatilla actual';
        const shoeKm = (shoe && shoe.km) ? shoe.km.toFixed(1) : '0.0';

        const badgesStamps = badges.map(badgeId => {
          const badge = Gamification.BADGES[badgeId];
          if (!badge) return '';
          return `<span class="badge" title="${badge.description}" style="display:inline-flex; align-items:center; gap:4px; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:30px; padding:4px 10px; font-size:12px; margin:0 4px;">${badge.icon} ${badge.name}</span>`;
        }).filter(b => b).join('');

        contenido += `
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <div style="font-size:12px; color:var(--text-secondary);">Nivel</div>
                <div style="font-size:32px; font-weight:400; color:${levelColor};">${level}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px; color:var(--text-secondary);">Zapatilla actual</div>
                <div><strong>${Utils.escapeHTML(shoeName)}</strong></div>
                <div style="font-size:12px; color:var(--text-secondary);">${shoeKm} km</div>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="background:var(--bg-secondary); height:4px; border-radius:4px; overflow:hidden;">
                <div style="width: ${progress}%; background: ${levelColor}; height:4px;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:8px;">
                <span style="font-size:10px; color:var(--text-secondary);">0 km</span>
                <span style="font-size:10px; color:var(--text-secondary);">${totalDistance.toFixed(0)} km</span>
                <span style="font-size:10px; color:var(--text-secondary);">${nextKm} km</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 20px;">
              <div>
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">Distancia</div>
                <strong style="font-size:16px;">${totalDistance.toFixed(1)}</strong>
                <span style="font-size:10px;"> km</span>
              </div>
              <div>
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">Sesiones</div>
                <strong style="font-size:16px;">${totalSessions}</strong>
              </div>
              <div>
                <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">XP</div>
                <strong style="font-size:16px;">${totalXP}</strong>
              </div>
            </div>
            ${badgesStamps ? `<div style="border-top:1px solid var(--border-color); padding-top:16px; margin-bottom:16px;">
              <div style="font-size:10px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:12px;">Insignias</div>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${badgesStamps}</div>
            </div>` : '<p style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Este corredor aún no tiene insignias</p>'}
          </div>
        `;
      } else {
        // ===== MENSAJE DE PRIVACIDAD (NO AMIGO) =====
        contenido += `
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:16px; text-align:center;">
            <div style="font-size:48px; margin-bottom:12px;">🔒</div>
            <div style="font-size:16px; font-weight:500; color:var(--text-secondary);">Añade a este usuario como amigo</div>
            <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">para ver su progreso, nivel e insignias</div>
          </div>
        `;
      }

      // Botón de acción (se añade siempre)
      contenido += `
            <div style="display: flex; justify-content: center; margin-top:16px;">
              ${botonAccion}
            </div>
          </div>
        </div>
      `;

      document.getElementById('modalAmigoContenido').innerHTML = contenido;
      document.getElementById('modalAmigoOverlay').style.display = 'block';
      document.getElementById('modalAmigo').style.display = 'block';

      setTimeout(() => {
        document.querySelectorAll('#modalAmigo [data-friend-action]').forEach(btn => {
          btn.removeEventListener('click', this._handleFriendAction);
          btn.addEventListener('click', this._handleFriendAction);
        });
        document.querySelectorAll('#modalAmigo .badge').forEach(badge => {
          badge.onclick = (e) => {
            e.stopPropagation();
            const title = badge.getAttribute('title');
            if (title) alert(title);
          };
        });
      }, 100);

    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
      Utils.showToast('Error al cargar perfil: ' + (error.message || error), 'error');
    }
  },

  _handleFriendAction(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const action = btn.getAttribute('data-friend-action');
    const uid = btn.getAttribute('data-uid');
    const username = btn.getAttribute('data-username');
    const requestId = btn.getAttribute('data-request-id');
    if (action === 'agregar' && uid && username) {
      Friends.enviarSolicitud(uid, username);
      Friends.cerrarModalAmigo();
    } else if (action === 'aceptar' && uid && requestId) {
      Friends.aceptarSolicitud(requestId, uid, AppState.currentUserId);
      Friends.cerrarModalAmigo();
    } else if (action === 'rechazar' && uid && requestId) {
      Friends.rechazarSolicitud(requestId);
      Friends.cerrarModalAmigo();
    } else if (action === 'cancelar' && requestId) {
      Friends.cancelarSolicitud(requestId);
      Friends.cerrarModalAmigo();
    }
  },

  cerrarModalAmigo() {
    document.getElementById('modalAmigoOverlay').style.display = 'none';
    document.getElementById('modalAmigo').style.display = 'none';
  },

  async cargarTodosUsuarios(reset = false) {
    const container = document.getElementById('todosUsuariosList');
    if (!container) return;
    if (this.todosUsuariosPagination.loading) return;

    const cacheKey = `explorar_usuarios_${AppState.currentUserId || 'anon'}`;
    if (reset) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30 * 1000) {
            this._renderExplorarUsuarios(data);
            return;
          }
        } catch(e) {}
      }
    }

    this.todosUsuariosPagination.loading = true;
    if (reset) { 
      container.innerHTML = '<div style="text-align:center; padding:20px;">Cargando usuarios...</div>'; 
      this.todosUsuariosPagination.lastDoc = null; 
      this.todosUsuariosPagination.hasMore = true; 
    }
    try {
      if (!AppState.currentUserData?.friendIds) await this._refreshCurrentUserData();
      const friendIds = AppState.currentUserData?.friendIds || [];
      const { enviadas, recibidas } = await this.obtenerSolicitudesPendientes();
      const result = await Storage.getAllUsers(20, reset ? null : this.todosUsuariosPagination.lastDoc);
      if (reset) container.innerHTML = '';
      if (result.users.length === 0) { 
        if (reset) container.innerHTML = '<p style="text-align:center; padding:20px;">No hay más usuarios</p>'; 
        this.todosUsuariosPagination.hasMore = false; 
        this.todosUsuariosPagination.loading = false; 
        const loadMoreBtn = document.getElementById('cargarMasUsuariosBtn'); 
        if (loadMoreBtn) loadMoreBtn.style.display = 'none'; 
        return; 
      }
      this.todosUsuariosPagination.lastDoc = result.lastDoc;
      this.todosUsuariosPagination.hasMore = result.users.length === 20;
      const uids = result.users.map(u => u.uid);
      const niveles = await this.getNivelesDirectos(uids);
      const dataToCache = { users: result.users, niveles, friendIds, enviadas, recibidas };
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: dataToCache, timestamp: Date.now() }));
      this._renderExplorarUsuarios(dataToCache);
    } catch (error) { 
      console.error('Error cargando todos los usuarios:', error); 
      if (reset) container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error al cargar</p>'; 
    } finally { this.todosUsuariosPagination.loading = false; }
  },

  _renderExplorarUsuarios({ users, niveles, friendIds, enviadas, recibidas }) {
    const container = document.getElementById('todosUsuariosList');
    if (!container) return;
    let html = '';
    for (const user of users) {
      if (user.uid === AppState.currentUserId) continue;
      if (friendIds.includes(user.uid)) continue;
      const solicitudEnviada = enviadas.some(s => s.to === user.uid);
      const solicitudRecibida = recibidas.some(s => s.from === user.uid);
      const solicitudPendiente = solicitudEnviada || solicitudRecibida;
      let solicitudId = null;
      if (solicitudEnviada) solicitudId = enviadas.find(s => s.to === user.uid)?.id;
      if (solicitudRecibida) solicitudId = recibidas.find(s => s.from === user.uid)?.id;
      const photoURL = user.profile?.photoURL;
      const nivel = niveles[user.uid] || 1;
      const color = Gamification.getColorByLevel(nivel);
      const badgeStyle = `background: ${color}; color: white; text-shadow: 0 0 1px black;`;
      const textStyle = `color: ${color}; font-weight: bold;`;
      const avatarHTML = photoURL
        ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover;"><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`
        : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center;">👤</div><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`;
      const usernameFormatted = Utils.capitalizeUsername(user.username);
      let boton = '';
      if (solicitudPendiente) {
        if (solicitudEnviada) boton = `<button class="btn-amigo" data-friend-action="cancelar" data-request-id="${solicitudId}" data-uid="${user.uid}">✖️ Cancelar</button>`;
        else boton = `<button class="btn-amigo" data-friend-action="aceptar" data-request-id="${solicitudId}" data-uid="${user.uid}" data-username="${usernameFormatted}" style="background:var(--zone-2); border-color:var(--zone-2); color:var(--bg-primary);">✓ Aceptar</button>
                      <button class="btn-amigo eliminar" data-friend-action="rechazar" data-request-id="${solicitudId}" data-uid="${user.uid}">✗ Rechazar</button>`;
      } else boton = `<button class="btn-amigo" data-friend-action="agregar" data-uid="${user.uid}" data-username="${usernameFormatted}">➕ Agregar</button>`;
      html += `
        <div class="resultado-busqueda">
          <div class="resultado-info" data-uid="${user.uid}" onclick="Friends.abrirModalAmigo('${user.uid}')">
            ${avatarHTML}
            <div>
              <div class="resultado-nombre">${Utils.escapeHTML(usernameFormatted)} <span style="font-size:10px; ${textStyle}">(Nv. ${nivel})</span></div>
              <div class="resultado-username">@${Utils.escapeHTML(user.username)}</div>
            </div>
          </div>
          <div>${boton}</div>
        </div>
      `;
    }
    container.innerHTML = (container.innerHTML === '<div style="text-align:center; padding:20px;">Cargando usuarios...</div>' ? '' : container.innerHTML) + html;
    const loadMoreBtn = document.getElementById('cargarMasUsuariosBtn');
    if (loadMoreBtn) loadMoreBtn.style.display = this.todosUsuariosPagination.hasMore ? 'block' : 'none';
  },

  cargarMasTodosUsuarios() { this.cargarTodosUsuarios(false); },

  async actualizarBadgeSolicitudes() {
    if (!AppState.currentUserId) return;
    try {
      const { recibidas } = await this.obtenerSolicitudesPendientes();
      const count = recibidas.length;
      AppState.solicitudesPendientesCount = count;
      AppState.actualizarBadgeSolicitudes();
    } catch (error) { console.error('Error actualizando badge solicitudes:', error); }
  },

  async buscarUsuarios() {
    const term = document.getElementById('buscarAmigosInput')?.value.trim();
    const container = document.getElementById('resultadosBusqueda');
    if (!container) return;
    if (term.length < 2) { container.innerHTML = ''; return; }
    try {
      if (!AppState.currentUserData?.friendIds) await this._refreshCurrentUserData();
      const friendIds = AppState.currentUserData?.friendIds || [];
      const result = await Storage.searchUsersByUsername(term, 10);
      if (result.items.length === 0) { container.innerHTML = '<p style="text-align:center; padding:20px;">No se encontraron usuarios</p>'; return; }
      const { enviadas, recibidas } = await this.obtenerSolicitudesPendientes();
      const uids = result.items.map(u => u.uid);
      const niveles = await this.getNivelesDirectos(uids);
      let html = '';
      for (const user of result.items) {
        if (user.uid === AppState.currentUserId) continue;
        const esAmigo = friendIds.includes(user.uid);
        const solicitudEnviada = enviadas.some(s => s.to === user.uid);
        const solicitudRecibida = recibidas.some(s => s.from === user.uid);
        const solicitudPendiente = solicitudEnviada || solicitudRecibida;
        let solicitudId = null;
        if (solicitudEnviada) solicitudId = enviadas.find(s => s.to === user.uid)?.id;
        if (solicitudRecibida) solicitudId = recibidas.find(s => s.from === user.uid)?.id;
        const photoURL = user.profile?.photoURL;
        const nivel = niveles[user.uid] || 1;
        const color = Gamification.getColorByLevel(nivel);
        const badgeStyle = `background: ${color}; color: white; text-shadow: 0 0 1px black;`;
        const textStyle = `color: ${color}; font-weight: bold;`;
        const avatarHTML = photoURL
          ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover;"><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`
          : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center;">👤</div><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`;
        const usernameFormatted = Utils.capitalizeUsername(user.username);
        let boton = '';
        if (esAmigo) boton = '<span style="color:var(--zone-2);">✓ Amigo</span>';
        else if (solicitudPendiente) {
          if (solicitudEnviada) boton = `<button class="btn-amigo" data-friend-action="cancelar" data-request-id="${solicitudId}" data-uid="${user.uid}">✖️ Cancelar</button>`;
          else boton = `<button class="btn-amigo" data-friend-action="aceptar" data-request-id="${solicitudId}" data-uid="${user.uid}" data-username="${usernameFormatted}" style="background:var(--zone-2); border-color:var(--zone-2); color:var(--bg-primary);">✓ Aceptar</button>
                       <button class="btn-amigo eliminar" data-friend-action="rechazar" data-request-id="${solicitudId}" data-uid="${user.uid}">✗ Rechazar</button>`;
        } else boton = `<button class="btn-amigo" data-friend-action="agregar" data-uid="${user.uid}" data-username="${usernameFormatted}">➕ Agregar</button>`;
        html += `
          <div class="resultado-busqueda">
            <div class="resultado-info" data-uid="${user.uid}" onclick="Friends.abrirModalAmigo('${user.uid}')">
              ${avatarHTML}
              <div>
                <div class="resultado-nombre">${Utils.escapeHTML(usernameFormatted)} <span style="font-size:10px; ${textStyle}">(Nv. ${nivel})</span></div>
                <div class="resultado-username">@${Utils.escapeHTML(user.username)}</div>
              </div>
            </div>
            <div>${boton}</div>
          </div>
        `;
      }
      container.innerHTML = html;
    } catch (error) { console.error('Error buscando usuarios:', error); container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error en la búsqueda. Inténtalo de nuevo.</p>'; }
  }
};

document.addEventListener('DOMContentLoaded', () => { Friends.initEventListeners(); });
window.Friends = Friends;
console.log('✅ friends.js v3.46 - Mejora de privacidad en perfiles de no amigos');