// ==================== friends.js - Versión definitiva con todas las protecciones ====================
// Versión: 3.53 - 🔥 A petición del usuario: la página 1 de "Explorar
//                usuarios" (Storage.getAllUsers, 20 usuarios) ya NO se
//                vuelve a pedir a Firestore cada vez que se abre esta
//                pantalla, se pulsa "Amigos", o se envía/cancela/acepta/
//                rechaza una solicitud -- eso eran 20 lecturas (más hasta
//                20 más de "gamification" para los niveles) TIRADAS cada
//                vez, aunque la lista de usuarios casi nunca cambia entre
//                una apertura y la siguiente. Ahora esos 20 usuarios se
//                sirven desde un listener onSnapshot que se abre UNA sola
//                vez por sesión (_iniciarListenerExplorar): la primera
//                vez sí cuesta esas lecturas (inevitable), pero a partir
//                de ahí Firestore solo manda datos nuevos cuando de
//                verdad cambia algo en esos 20 primeros usuarios por
//                username -- típicamente, cuando se registra alguien que
//                entra alfabéticamente ahí. Los niveles (colección
//                gamification) también se cachean ahora en _nivelesCache,
//                compartida entre "Explorar" y "Buscar", en vez de
//                reconstruirse desde cero cada vez que se reinicia
//                _usuariosState. Buscar por nombre (Storage.
//                searchUsersByUsername) NO cambia: sigue costando una
//                lectura real por búsqueda (con su debounce de 400ms) --
//                tal cual se pidió, solo se "gasta" Firestore cuando el
//                usuario busca algo de verdad. Páginas siguientes de
//                "Explorar" (botón CARGAR MÁS) tampoco cambian: se siguen
//                pidiendo bajo demanda, ya que se visitan poco y no
//                compensa mantenerlas todas en vivo.
// Versión: 3.52 - 🔥 A petición del usuario: "Explorar/Buscar usuarios"
//                deja de cargar TODOS los usuarios de golpe (v3.51, hasta
//                5000 lecturas de Firestore de una sola vez cada vez que
//                se abría esta pantalla -- carísimo en el plan Blaze).
//                Vuelve la paginación real: "Explorar" trae de 20 en 20
//                con el botón CARGAR MÁS (Storage.getAllUsers). Escribir
//                2+ letras en el buscador cambia a modo "Buscar" y
//                consulta Firestore por ese término directamente
//                (Storage.searchUsersByUsername), con debounce de 400ms
//                para no lanzar una consulta por cada tecla. Al borrar el
//                texto (0-1 letras) se vuelve a "Explorar" desde la
//                primera página.
// Versión: 3.51 - A petición del usuario, "Buscar" y "Explorar usuarios"
//                se unifican en una sola lista: al entrar a Comunidad >
//                Amigos > Buscar, si no había caché se ve la animación de
//                "CARGANDO" y, al terminar, aparecen TODOS los usuarios ya
//                cargados de golpe (sin "cargar más" por tandas de 20).
//                Si ya estaban en caché sin cambios, aparecen al instante,
//                sin animación. Escribir en el buscador ya NO lanza una
//                consulta a Firestore por cada letra (antes con su propia
//                animación de "CARGANDO" y caché por término) -- ahora
//                filtra EN EL CLIENTE la lista ya cargada, al instante,
//                según lo que se va escribiendo; al borrar el texto,
//                vuelve a verse la lista completa. cargarTodosUsuarios()
//                ahora trae TODOS los usuarios (tandas de 200 encadenadas)
//                en vez de solo una página de 20.
// Versión: 3.50 - Se sustituye el esqueleto pulsando de la v3.49 (no
//                convenció) por la MISMA animación de "CARGANDO" con
//                letras de colores que ya usa el panel de soporte del
//                admin (Utils._animarTextoDorado). Y, siguiendo ese mismo
//                patrón, los resultados de "Buscar" (por nombre y
//                "Explorar usuarios") se guardan en memoria y se
//                reutilizan tal cual -- sin volver a pedir nada a
//                Firestore -- hasta que hay un cambio real (se envía,
//                cancela, acepta o rechaza una solicitud); ya no depende
//                de un tiempo fijo como el sessionStorage de 30s de antes.
// Versión: 3.49 - "Buscar" (búsqueda por nombre y "Explorar usuarios")
//                carga ahora con el mismo lenguaje visual que ya usa
//                "Últimas sesiones creadas" en el panel de admin: tarjetas
//                esqueleto pulsando desde el primer instante en vez de un
//                hueco en blanco (o el texto fijo "Cargando usuarios...")
//                mientras responde Firestore, y fundido (riFadeInUp) al
//                llegar los resultados reales. De paso, la búsqueda por
//                nombre (que no tenía debounce y lanza una consulta en
//                cada pulsación) usa un token para que la respuesta de una
//                búsqueda vieja que llega tarde no pise el resultado de la
//                más reciente si el usuario ha seguido escribiendo.
// Versión: 3.48 - La tarjeta de pasaporte (tuya y la de un amigo) ya no
//                pinta TODAS las insignias -- con muchas, la tarjeta
//                crecía tanto que tapaba el nombre por arriba y se salía
//                de la pantalla. Ahora se enseñan solo las 5 más
//                recientes (_renderBadgesStamps admite un límite, y
//                ordena de más nueva a más antigua invirtiendo el array,
//                ya que gamification.js añade cada insignia nueva al
//                final). Si hay más de 5, aparece "Ver todas (N) →" y el
//                bloque entero es pulsable: abre abrirModalTodasInsignias(),
//                un modal aparte con el listado completo, mismo orden.
// Versión: 3.47 - El pasaporte de un amigo ahora enseña también su bio,
//                edad y ciudad (colección perfilSocial, ver profile.js
//                v10.11) justo debajo del nombre. Solo se pide si
//                esAmigo es true, igual que la gamificación -- para un
//                no-amigo el modal sigue sin pedir ni enseñar nada de
//                esto (candado + "añade a este usuario").
// Versión: 3.46 - Mejora en perfil de no amigos: mensaje de privacidad en lugar de pasaporte vacío
// ====================

const Friends = {
  // 🔥 v3.51: "Buscar" y "Explorar usuarios" eran dos listas separadas (una
  // con búsqueda contra Firestore letra a letra, otra paginada de 20 en
  // 20 con "CARGAR MÁS"). El usuario pidió simplificarlo: una única lista,
  // se carga COMPLETA una sola vez (con la animación de "CARGANDO" solo si
  // no estaba en caché) y a partir de ahí escribir en el buscador filtra
  // esa lista ya cargada EN EL CLIENTE, al instante, sin volver a tocar
  // Firestore ni repetir la animación -- y al borrar lo escrito, vuelve a
  // enseñar la lista completa. Ya no hace falta paginación.
  _cargandoTodosUsuarios: false,

  // 🔥 v3.53: la invalidación real de la página 1 de "Explorar" ya no la
  // dispara el cliente -- la hace Firestore solo, a través del listener
  // de _iniciarListenerExplorar (ver más abajo), que manda datos nuevos
  // en cuanto cambia algo de verdad en esos 20 usuarios. Se deja como
  // no-op para no tener que tocar las llamadas existentes tras
  // enviar/cancelar/aceptar/rechazar una solicitud.
  _invalidarCacheUsuarios() {},

  // 🔥 v3.53: caché en tiempo real de la página 1 de "Explorar usuarios".
  // _exploreCache guarda los últimos 20 usuarios (por username) que ha
  // mandado Firestore; _exploreListenerUnsub es la función para cerrar
  // ese listener (logout). _nivelesCache es la caché de niveles
  // (colección gamification) compartida entre "Explorar" y "Buscar", para
  // no volver a pedir el nivel de un usuario que ya se consultó en esta
  // sesión.
  _exploreCache: null,
  _exploreListenerUnsub: null,
  _exploreListenerResolvers: [],
  _nivelesCache: {},

  // Abre el listener en tiempo real de la página 1 de "Explorar" si no
  // había uno ya corriendo (idempotente: puede llamarse en cada apertura
  // de la pantalla sin miedo a abrir listeners duplicados). La primera
  // vez que se llama en la sesión cuesta una lectura real por usuario (20
  // como mucho); a partir de ahí, Firestore solo vuelve a mandar algo
  // cuando cambia de verdad el contenido de esos 20 primeros usuarios.
  _iniciarListenerExplorar() {
    if (this._exploreListenerUnsub) return;
    this._exploreCache = { users: [], lastDoc: null, cargando: true };
    this._exploreListenerUnsub = firebaseServices.db.collection('users')
      .orderBy('username')
      .limit(20)
      .onSnapshot(async (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        this._exploreCache.users = users;
        this._exploreCache.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        this._exploreCache.cargando = false;

        const uidsNuevos = users.map(u => u.uid).filter(uid => !(uid in this._nivelesCache));
        if (uidsNuevos.length) {
          Object.assign(this._nivelesCache, await this.getNivelesDirectos(uidsNuevos));
        }

        // Si la pantalla ya está mostrando "Explorar" en su primera
        // página, repintamos con el dato fresco al momento -- sin que
        // haga falta reabrir nada para ver, por ejemplo, a alguien recién
        // registrado.
        const st = this._usuariosState;
        if (st && st.modo === 'explorar' && st.paginaActual === 1) {
          st.users = users;
          st.lastDoc = this._exploreCache.lastDoc;
          st.agotado = users.length < 20;
          this._renderExplorarUsuarios(st);
        }

        const resolvers = this._exploreListenerResolvers;
        this._exploreListenerResolvers = [];
        resolvers.forEach(resolve => resolve());
      }, (error) => {
        console.error('Error en listener de Explorar usuarios:', error);
        if (this._exploreCache) this._exploreCache.cargando = false;
        const resolvers = this._exploreListenerResolvers;
        this._exploreListenerResolvers = [];
        resolvers.forEach(resolve => resolve());
      });
  },

  // Se resuelve en cuanto llega el primer snapshot del listener de
  // Explorar (o al instante si ya había uno con datos). Permite que
  // _cargarPaginaUsuarios "espere" la primera carga sin tener que lanzar
  // su propio .get() a Firestore.
  _esperarPrimeraExplorar() {
    if (!this._exploreCache || !this._exploreCache.cargando) return Promise.resolve();
    return new Promise(resolve => this._exploreListenerResolvers.push(resolve));
  },

  // Cierra el listener de Explorar (logout): evita dejarlo abierto
  // facturando lecturas de una sesión que ya ha terminado.
  detenerListenerExplorar() {
    if (this._exploreListenerUnsub) {
      this._exploreListenerUnsub();
      this._exploreListenerUnsub = null;
    }
    this._exploreCache = null;
    this._exploreListenerResolvers = [];
  },

  // Pinta "CARGANDO" letra a letra (mismos colores de nivel que el resto
  // de la app) dentro de `container`, y devuelve una función que hay que
  // esperar justo antes de sustituir ese HTML por el resultado real --
  // así, si Firestore responde muy rápido, no se corta la animación a
  // medias (mismo arreglo que ya tiene Admin.cargarMensajesUsuarios).
  _mostrarCargando(container, spanId) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span id="${spanId}" style="font-size:15px; font-weight:bold; letter-spacing:1px;"></span></div>`;
    const el = document.getElementById(spanId);
    const inicio = Date.now();
    const duracion = el ? Utils._animarTextoDorado(el, 'CARGANDO') : 0;
    return async () => {
      const restante = duracion - (Date.now() - inicio);
      if (restante > 0) await new Promise(resolve => setTimeout(resolve, restante));
    };
  },

  // uid del perfil actualmente abierto en #modalAmigo (null si está cerrado).
  // Lo usa el listener en tiempo real de app.js para saber si tiene que
  // refrescar el modal cuando cambia la relación de amistad mientras el
  // usuario lo tiene abierto en pantalla.
  _modalAmigoUidActual: null,
  // Evita que un doble-tap sobre "eliminar amigo" antes de que llegue el
  // refresco en tiempo real dispare dos llamadas de red concurrentes para
  // la misma amistad.
  _eliminandoAmigoEnCurso: new Set(),

  // Caché en memoria (uid -> {gamData, timestamp}) de los datos de
  // gamificación de cada amigo, rellenada por precargarPerfilesAmigos()
  // justo después de iniciar sesión. Permite que Friends.abrirModalAmigo
  // pinte el pasaporte de un amigo al instante, sin esperar a Firestore,
  // y solo refresque en segundo plano.
  _perfilCache: {},

  // Construye el HTML de las "estampas" de insignias para el pasaporte de
  // un perfil (antes este bloque estaba repetido, letra por letra, en
  // abrirModalAmigo() para el caso "tu perfil" y para el caso "perfil de
  // un amigo").
  // 'limit' (opcional): si se da, solo se devuelven las 'limit' más
  // recientes -- lo usa la tarjeta del pasaporte, para no crecer sin
  // límite y tapar el nombre en pantallas pequeñas. Sin 'limit' se
  // devuelven todas (lo usa el modal "todas las insignias").
  // Orden: más reciente arriba. Las insignias se añaden al FINAL del
  // array según se van consiguiendo (ver gamification.js: newBadges.push
  // cuando se desbloquea una nueva), así que se invierte el array para
  // que la última conseguida quede primero.
  _renderBadgesStamps(badges, limit = null) {
    const ordenadas = [...badges].reverse();
    const aRenderizar = limit ? ordenadas.slice(0, limit) : ordenadas;
    return aRenderizar.map(badgeId => {
      const badge = Gamification.BADGES[badgeId];
      if (!badge) return '';
      return `<span class="badge" data-badge-id="${badgeId}" title="${badge.description}" style="display:inline-flex; align-items:center; gap:4px; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:30px; padding:4px 10px; font-size:12px; margin:0 4px;">${badge.icon} ${badge.name}</span>`;
    }).filter(b => b).join('');
  },

  // Modal de detalle de UNA insignia (icono + nombre + explicación de cómo
  // se ha ganado), al pulsar una "estampa" del pasaporte de un amigo.
  // Antes esto se hacía con un alert() nativo del navegador -- un
  // recuadro blanco que no encajaba nada con el resto de la app, ni
  // respetaba el tema claro/oscuro. Mismo lenguaje visual que el modal de
  // "todas las insignias" de aquí arriba.
  abrirModalDetalleInsignia(badgeId) {
    const badge = Gamification.BADGES[badgeId];
    if (!badge) return;
    this.cerrarModalDetalleInsignia();

    const overlay = document.createElement('div');
    overlay.id = 'detalleInsigniaOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.8); z-index:20020;
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.cerrarModalDetalleInsignia(); });

    const modal = document.createElement('div');
    modal.id = 'detalleInsigniaModal';
    modal.style.cssText = `
      background:var(--bg-card, var(--bg-secondary)); border:1px solid var(--border-color);
      border-radius:16px; padding:24px; max-width:340px; width:85%;
      text-align:center; box-shadow:var(--shadow-lg);
      opacity:0; transform:scale(0.9);
      transition:transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.2s ease;
    `;

    modal.innerHTML = `
      <div style="font-size:48px; margin-bottom:12px;">${badge.icon}</div>
      <div style="font-weight:bold; font-size:16px; color:var(--accent-yellow); letter-spacing:0.5px; margin-bottom:8px;">${Utils.escapeHTML(badge.name)}</div>
      <div style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin-bottom:16px;">${Utils.escapeHTML(badge.description || '')}</div>
      ${badge.xp ? `<div style="font-size:12px; color:var(--text-primary); margin-bottom:16px;">+${badge.xp} XP</div>` : ''}
      <div style="display:flex; justify-content:center;">
        <button class="action-button" style="width:auto; padding:0 24px; margin:0;" onclick="Friends.cerrarModalDetalleInsignia()">CERRAR</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    });
  },

  cerrarModalDetalleInsignia() {
    const modal = document.getElementById('detalleInsigniaModal');
    const overlay = document.getElementById('detalleInsigniaOverlay');
    if (modal) { modal.style.opacity = '0'; modal.style.transform = 'scale(0.9)'; }
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
  },

  // Modal con el listado completo de insignias de un perfil (más reciente
  // arriba), para cuando hay más de las 5 que caben en la tarjeta del
  // pasaporte sin que esta crezca demasiado y tape el nombre por arriba.
  // Se lee de this._badgesModalData, que abrirModalAmigo() rellena justo
  // antes de pintar la tarjeta (evita tener que serializar el array
  // dentro de un atributo onclick).
  abrirModalTodasInsignias() {
    const badges = this._badgesModalData || [];
    this.cerrarModalTodasInsignias();

    const overlay = document.createElement('div');
    overlay.id = 'todasInsigniasOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.8); z-index:20010;
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.cerrarModalTodasInsignias(); });

    const modal = document.createElement('div');
    modal.id = 'todasInsigniasModal';
    modal.style.cssText = `
      background:var(--bg-card, var(--bg-secondary)); border:1px solid var(--border-color);
      border-radius:16px; padding:20px; max-width:420px; width:90%;
      max-height:80vh; overflow-y:auto; box-shadow:var(--shadow-lg);
      opacity:0; transform:scale(0.9);
      transition:transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.2s ease;
    `;

    const ordenadas = [...badges].reverse();
    const filas = ordenadas.map(badgeId => {
      const badge = Gamification.BADGES[badgeId];
      if (!badge) return '';
      return `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
          <span style="font-size:24px; flex-shrink:0;">${badge.icon}</span>
          <div>
            <div style="font-weight:bold; font-size:14px;">${Utils.escapeHTML(badge.name)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${Utils.escapeHTML(badge.description || '')}</div>
          </div>
        </div>
      `;
    }).filter(f => f).join('');

    modal.innerHTML = `
      <h3 style="margin:0 0 16px 0; text-align:center; color:var(--accent-yellow); font-size:18px; letter-spacing:1px; font-weight:400;">🏅 INSIGNIAS (${badges.length})</h3>
      <div>${filas || '<p style="text-align:center; color:var(--text-secondary); font-size:13px;">Todavía no hay insignias.</p>'}</div>
      <div style="display:flex; justify-content:center; margin-top:16px;">
        <button class="action-button" style="width:auto; padding:0 24px; margin:0;" onclick="Friends.cerrarModalTodasInsignias()">CERRAR</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    });
  },

  cerrarModalTodasInsignias() {
    const modal = document.getElementById('todasInsigniasModal');
    const overlay = document.getElementById('todasInsigniasOverlay');
    if (modal) { modal.style.opacity = '0'; modal.style.transform = 'scale(0.9)'; }
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
  },

  // Se llama una vez al entrar en la app (justo tras el login), en
  // segundo plano y sin bloquear nada. Pide de golpe (en paralelo) los
  // datos de gamificación de todos los amigos, para que luego, al pulsar
  // la tarjeta de cualquiera de ellos, el modal se pinte ya con datos
  // reales en vez de mostrar un hueco de carga.
  async precargarPerfilesAmigos() {
    try {
      const friendIds = AppState.currentUserData?.friendIds || [];
      if (!friendIds.length) return;
      await Promise.all(friendIds.map(async (uid) => {
        try {
          const gamData = await Gamification.getData(uid);
          this._perfilCache[uid] = { gamData, timestamp: Date.now() };
        } catch (e) {
          // Un fallo puntual con un amigo no debe impedir precargar el resto
        }
      }));
    } catch (e) {
      console.warn('Error precargando perfiles de amigos:', e);
    }
  },

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
    // 🔥 FIX: si la consulta de un chunk falla (red, permisos, lo que sea),
    // antes eso NO se distinguía de "estos amigos ya no existen" -- el
    // resultado (validIds más corto que friendIds) hacía que más abajo se
    // sobrescribiera friendIds en Firestore con una lista incompleta,
    // borrando amigos de verdad por un fallo puntual de red. Ahora, si
    // cualquier chunk falla, se aborta la limpieza entera sin tocar nada:
    // mejor dejar algún huérfano sin limpiar hasta la próxima vez que
    // arriesgarse a borrar amigos reales.
    try {
      for (const chunk of chunks) {
        const snapshot = await firebaseServices.db.collection('users')
          // FieldPath.documentId() en vez del string suelto '__name__',
          // que no es la forma oficial documentada de filtrar por ID en
          // el SDK cliente de Firebase (ver app.js > Sesiones hoy).
          .where(firebaseServices.FieldPath.documentId(), 'in', chunk)
          .get();
        snapshot.forEach(doc => validIds.push(doc.id));
      }
    } catch (error) {
      console.warn('No se pudo comprobar amigos huérfanos (se deja la lista tal cual):', error);
      return { validIds: friendIds, changed: false };
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
          ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover; border:2px solid ${colorNivel};" onerror="Utils.avatarFallback(this)"><div class="nivel-badge" style="background: ${colorNivel}; color: white; text-shadow: 0 0 1px black;">${nivel}</div></div>`
          : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; border:2px solid ${colorNivel};">👤</div><div class="nivel-badge" style="background: ${colorNivel}; color: white; text-shadow: 0 0 1px black;">${nivel}</div></div>`;
        let botones = '';
        if (tipo === 'recibidas') {
          botones = `<button class="btn-amigo" data-friend-action="aceptar" data-request-id="${sol.id}" data-uid="${sol.from}" data-username="${Utils.escapeHTML(usernameFormatted)}" style="background:var(--zone-2); border-color:var(--zone-2); color:var(--bg-primary);">✓ Aceptar</button>
                     <button class="btn-amigo eliminar" data-friend-action="rechazar" data-request-id="${sol.id}" data-uid="${sol.from}">✗ Rechazar</button>`;
        } else {
          botones = `<button class="btn-amigo eliminar" data-friend-action="cancelar" data-request-id="${sol.id}" data-uid="${sol.to}">✖️ Cancelar</button>`;
        }
        const colorNombre = tipo === 'enviadas' ? 'var(--gold)' : colorNivel;
        html += `
          <div class="solicitud-item" data-uid="${otroUid}" onclick="if(!event.target.closest('button')) Friends.abrirModalAmigo('${otroUid}')">
            <div class="resultado-info">
              ${avatarHTML}
              <div>
                <div class="resultado-nombre" style="color:${colorNombre};">${Utils.escapeHTML(usernameFormatted)}</div>
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
    // 🔥 FIX toasts contradictorios ("✅ enviada" y luego "❌ error" de
    // golpe): antes el refresco de listas iba en el MISMO try que el
    // envío -- si ese refresco fallaba (aunque la solicitud ya se hubiera
    // mandado bien), saltaba el catch y se veía un error encima del
    // éxito. Ahora la acción principal y su refresco posterior van en
    // tries separados: solo un fallo de verdad al enviar muestra el rojo.
    let ok;
    try {
      ok = await Storage.sendFriendRequest(AppState.currentUserId, toUid);
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      Utils.showToast('Error al enviar solicitud', 'error');
      return;
    }
    if (!ok) { Utils.showToast('No se pudo enviar la solicitud', 'error'); return; }
    Utils.showToast('✅ Solicitud enviada', 'success');
    try {
      this._invalidarCacheUsuarios();
      await this.cargarTodosUsuarios(true);
      await this.cargarSolicitudesEnviadas();
    } catch (error) {
      console.error('Error refrescando listas tras enviar solicitud:', error);
    }
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
    // 🔥 FIX toasts contradictorios (verde "aceptada" seguido de rojo
    // "error al aceptar"): antes TODO el trabajo posterior a aceptar
    // (crear la conversación de chat si no existía, refrescar listas de
    // amigos/solicitudes, actualizar el badge) iba en el MISMO try que la
    // aceptación -- si cualquiera de esos pasos fallaba (un hipo de red
    // al crear la conversación, por ejemplo), saltaba el catch y se veía
    // "Error al aceptar" aunque la solicitud SÍ se hubiera aceptado de
    // verdad. Ahora solo un fallo real al aceptar muestra el rojo; los
    // pasos de después van en su propio try y, si fallan, se quedan en
    // consola -- las listas se autocorrigen en el siguiente refresco.
    try {
      await Storage.acceptFriendRequest(requestId, fromUid, toUid);
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
      Utils.showToast('Error al aceptar', 'error');
      return;
    }
    Utils.showToast('✅ Solicitud aceptada', 'success');
    try {
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
      this._invalidarCacheUsuarios();
      await this.cargarTodosUsuarios(true);
      await this.actualizarBadgeSolicitudes();
    } catch (error) {
      console.error('Error tras aceptar solicitud (creando conversación / refrescando listas):', error);
    }
  },

  async rechazarSolicitud(requestId) {
    try {
      await Storage.rejectFriendRequest(requestId);
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      Utils.showToast('Error al rechazar', 'error');
      return;
    }
    Utils.showToast('Solicitud rechazada', 'info');
    try {
      await this.cargarSolicitudesRecibidas();
      this._invalidarCacheUsuarios();
      await this.cargarTodosUsuarios(true);
      await this.actualizarBadgeSolicitudes();
    } catch (error) {
      console.error('Error refrescando listas tras rechazar solicitud:', error);
    }
  },

  async cancelarSolicitud(requestId) {
    const confirmed = await Utils.confirm('Cancelar solicitud', '¿Cancelar esta solicitud de amistad?');
    if (!confirmed) return;
    let yaNoExiste = false;
    try {
      await firebaseServices.db.collection('friendRequests').doc(requestId).update({ status: 'cancelled' });
    } catch (error) {
      console.error('Error cancelando solicitud:', error);
      if (error.code === 'not-found') {
        yaNoExiste = true;
      } else {
        Utils.showToast('Error al cancelar: ' + (error.message || 'desconocido'), 'error');
        return;
      }
    }
    Utils.showToast(yaNoExiste ? 'La solicitud ya no existe' : '✅ Solicitud cancelada', yaNoExiste ? 'info' : 'success');
    try {
      this._invalidarCacheUsuarios();
      await this.cargarTodosUsuarios(true);
      await this.actualizarBadgeSolicitudes();
      await this.cargarSolicitudesEnviadas();
    } catch (error) {
      console.error('Error refrescando listas tras cancelar solicitud:', error);
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
      const photoURL = amigo.profile?.photoURL;
      const avatarHTML = photoURL
        ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover; border:2px solid ${color};" onerror="Utils.avatarFallback(this)"><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`
        : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; border:2px solid ${color};">👤</div><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`;
      const usernameFormatted = Utils.capitalizeUsername(amigo.username);
      html += `
        <div class="resultado-busqueda" style="justify-content:space-between;" data-uid="${amigo.uid}" onclick="if(!event.target.closest('button')) Friends.abrirModalAmigo('${amigo.uid}')">
          <div class="resultado-info">
            ${avatarHTML}
            <div>
              <div class="resultado-nombre">${Utils.escapeHTML(usernameFormatted)}</div>
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
    // Si por una lista desactualizada en pantalla se pulsa "eliminar" dos
    // veces (p.ej. el listener en tiempo real aún no había repintado la
    // lista), evitamos un segundo borrado sobre una amistad que ya no
    // existe: eso descuadraba friendsCount (restaba de más) y no hacía
    // falta ninguna llamada de red adicional.
    const friendIdsActuales = AppState.currentUserData?.friendIds || [];
    if (!friendIdsActuales.includes(friendUid)) {
      await this._refreshCurrentUserData();
      await this.cargarListaAmigos(true);
      return;
    }
    if (this._eliminandoAmigoEnCurso.has(friendUid)) return;
    const confirmed = await Utils.confirm('Eliminar amigo', '¿Eliminar este amigo?');
    if (!confirmed) return;
    if (this._eliminandoAmigoEnCurso.has(friendUid)) return;
    this._eliminandoAmigoEnCurso.add(friendUid);
    try {
      await Storage.removeFriend(AppState.currentUserId, friendUid);
    } catch (error) {
      console.error('Error eliminando amigo:', error);
      Utils.showToast('Error al eliminar', 'error');
      this._eliminandoAmigoEnCurso.delete(friendUid);
      return;
    }
    Utils.showToast('✅ Amigo eliminado', 'success');
    try {
      await this._refreshCurrentUserData();
      await this.cargarListaAmigos(true);
      await this.cargarTodosUsuarios(true);
      sessionStorage.removeItem(`amigos_lista_${AppState.currentUserId}`);
    } catch (error) {
      console.error('Error refrescando listas tras eliminar amigo:', error);
    } finally { this._eliminandoAmigoEnCurso.delete(friendUid); }
  },

  // ============================================================
  //  MODAL DE PERFIL DE USUARIO (PASAPORTE CON PRIVACIDAD)
  // ============================================================
  async abrirModalAmigo(uid) {
    this._modalAmigoUidActual = uid;
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
      
      const gamificationData = Gamification.getCached(uid) || await Gamification.getData(uid);
      const shoe = gamificationData?.currentShoe || { name: 'Zapatilla actual', km: 0 };
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
      
      this._badgesModalData = badges;
      const badgesStamps = this._renderBadgesStamps(badges, 5);
      
      const userName = Utils.capitalizeUsername(userData.username || 'Usuario');
      const photoURL = userData.profile?.photoURL;
      const avatarHTML = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid ${levelColor};" onerror="Utils.avatarFallback(this)">`
        : `<div style="width:60px; height:60px; border-radius:50%; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:30px; border:2px solid ${levelColor};">👤</div>`;
      
      const botonAccion = `<span style="font-size:14px; color:var(--zone-2);">✨ Este eres tú</span>`;
      
      const contenido = `
        <div style="background:var(--bg-card); border-radius:16px; border:2px solid ${levelColor}; overflow:hidden;">
          <div style="padding:20px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
              ${avatarHTML}
              <div>
                <div style="font-size:18px; font-weight:500; color:${levelColor};">${Utils.escapeHTML(userName)}</div>
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
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">Insignias</span>
                ${badges.length > 5 ? `<span onclick="Friends.abrirModalTodasInsignias()" style="font-size:11px; color:var(--accent-yellow); cursor:pointer;">Ver todas (${badges.length}) →</span>` : ''}
              </div>
              <div ${badges.length > 5 ? 'onclick="Friends.abrirModalTodasInsignias()" style="cursor:pointer; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;"' : 'style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;"'}>${badgesStamps}</div>
            </div>` : '<p style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Aún no tienes insignias. ¡Completa entrenamientos!</p>'}
            <div style="display: flex; justify-content: center;">
              ${botonAccion}
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('modalAmigoContenido').innerHTML = contenido;
      document.getElementById('modalAmigoOverlay').style.display = 'block';
      const modalAmigoEl = document.getElementById('modalAmigo');
      if (modalAmigoEl) { modalAmigoEl.style.display = 'block'; modalAmigoEl.scrollTop = 0; }
      return;
    }

    // ============================================================
    //  CASO NORMAL: OTRO USUARIO
    // ============================================================
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        Utils.showToast('Usuario no encontrado', 'error');
        this._modalAmigoUidActual = null;
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
      let perfilSocialData = null;

      // Si es amigo, intentamos obtener los datos reales. Primero se mira
      // la caché precargada en segundo plano al entrar en la app
      // (Friends.precargarPerfilesAmigos, disparada tras el login) para
      // pintar al instante sin esperar a Firestore; si esa caché no
      // existe todavía (amigo añadido hace muy poco, o la precarga aún
      // no terminó) se cae de vuelta a pedirlo en el momento. También se
      // evita el antiguo doble viaje a Firestore (uno para los datos de
      // gamificación y otro aparte solo para la zapatilla): la zapatilla
      // ya viene incluida dentro del mismo documento de gamificación.
      if (esAmigo) {
        const cacheEntry = this._perfilCache[uid];
        if (cacheEntry) {
          gamificationData = cacheEntry.gamData;
        } else {
          try {
            gamificationData = await Gamification.getData(uid);
            this._perfilCache[uid] = { gamData: gamificationData, timestamp: Date.now() };
          } catch(e) {
            console.warn('Error obteniendo gamificación del amigo:', e);
          }
        }
        if (gamificationData && gamificationData.currentShoe) {
          shoe = gamificationData.currentShoe;
        }
        // Bio/edad/ciudad: viven en perfilSocial/{uid}, no en
        // users/{uid}.profile (que ya tenemos cargado arriba, pero esos
        // campos ahí no se enseñan -- perfilSocial es la copia protegida
        // por reglas "solo amigos" que sí se puede mostrar). Se pide solo
        // aquí, dentro de esAmigo, igual que la gamificación.
        try {
          const perfilSocialDoc = await firebaseServices.db.collection('perfilSocial').doc(uid).get();
          if (perfilSocialDoc.exists) perfilSocialData = perfilSocialDoc.data();
        } catch(e) {
          console.warn('Error obteniendo perfilSocial del amigo:', e);
        }
        // Refresco en segundo plano: si se pintó desde caché, se pide la
        // versión fresca sin bloquear el modal, y si sigue abierto para
        // este mismo amigo cuando llegue, se actualizan solo el nivel y
        // la zapatilla en el DOM (sin volver a construir todo el modal).
        if (cacheEntry) {
          Gamification.getData(uid).then(freshData => {
            this._perfilCache[uid] = { gamData: freshData, timestamp: Date.now() };
            if (this._modalAmigoUidActual !== uid) return;
            const modalVisible = document.getElementById('modalAmigo')?.style.display === 'block';
            if (!modalVisible) return;
            const nivelEl = document.querySelector('#modalAmigoContenido [data-role="nivel-valor"]');
            if (nivelEl && freshData.level !== undefined) nivelEl.textContent = freshData.level;
          }).catch(() => {});
        }
      }

      const photoURL = userData.profile?.photoURL;
      const userName = Utils.capitalizeUsername(userData.username);

      // Color de nivel: igual que en el pasaporte real del perfil (border,
      // nombre, etc.). Si no es amigo no conocemos su nivel real (no se
      // consulta gamificación por privacidad), así que se usa un color
      // neutro en vez de inventar un nivel.
      const levelColor = esAmigo ? Gamification.getColorByLevel(gamificationData?.level || 1) : 'var(--border-color)';

      // Avatar HTML (común para ambos casos)
      const avatarHTML = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid ${levelColor};" onerror="Utils.avatarFallback(this)">`
        : `<div style="width:60px; height:60px; border-radius:50%; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:30px; border:2px solid ${levelColor};">👤</div>`;

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
        <div style="background:var(--bg-card); border-radius:16px; border:2px solid ${levelColor}; overflow:hidden;">
          <div style="padding:20px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
              ${avatarHTML}
              <div>
                <div style="font-size:18px; font-weight:500; color:${levelColor};">${Utils.escapeHTML(userName)}</div>
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

        this._badgesModalData = badges;
        const badgesStamps = this._renderBadgesStamps(badges, 5);

        // ===== SOBRE MÍ (bio, edad, ciudad -- perfilSocial) =====
        const bioSocial = (perfilSocialData?.bio || '').trim();
        const ageSocial = perfilSocialData?.age || null;
        const citySocial = (perfilSocialData?.city || '').trim();
        const sobreMiHTML = (bioSocial || ageSocial || citySocial) ? `
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:16px;">
            ${bioSocial ? `<p style="font-size:13px; line-height:1.5; margin:0 0 10px 0;">${Utils.escapeHTML(bioSocial)}</p>` : ''}
            ${(ageSocial || citySocial) ? `
              <div style="display:flex; gap:16px; font-size:12px; color:var(--text-secondary);">
                ${ageSocial ? `<span>🎂 ${ageSocial} años</span>` : ''}
                ${citySocial ? `<span>📍 ${Utils.escapeHTML(citySocial)}</span>` : ''}
              </div>
            ` : ''}
          </div>
        ` : '';

        contenido += sobreMiHTML + `
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <div style="font-size:12px; color:var(--text-secondary);">Nivel</div>
                <div data-role="nivel-valor" style="font-size:32px; font-weight:400; color:${levelColor};">${level}</div>
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
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:10px; text-transform:uppercase; color:var(--text-secondary);">Insignias</span>
                ${badges.length > 5 ? `<span onclick="Friends.abrirModalTodasInsignias()" style="font-size:11px; color:var(--accent-yellow); cursor:pointer;">Ver todas (${badges.length}) →</span>` : ''}
              </div>
              <div ${badges.length > 5 ? 'onclick="Friends.abrirModalTodasInsignias()" style="cursor:pointer; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;"' : 'style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;"'}>${badgesStamps}</div>
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
      const modalAmigoEl = document.getElementById('modalAmigo');
      if (modalAmigoEl) { modalAmigoEl.style.display = 'block'; modalAmigoEl.scrollTop = 0; }

      setTimeout(() => {
        document.querySelectorAll('#modalAmigo [data-friend-action]').forEach(btn => {
          btn.removeEventListener('click', this._handleFriendAction);
          btn.addEventListener('click', this._handleFriendAction);
        });
        document.querySelectorAll('#modalAmigo .badge').forEach(badge => {
          badge.onclick = (e) => {
            e.stopPropagation();
            const badgeId = badge.getAttribute('data-badge-id');
            if (badgeId) this.abrirModalDetalleInsignia(badgeId);
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
    this._modalAmigoUidActual = null;
    const modalAmigoEl = document.getElementById('modalAmigo');
    if (modalAmigoEl) modalAmigoEl.scrollTop = 0;
    document.getElementById('modalAmigoOverlay').style.display = 'none';
    if (modalAmigoEl) modalAmigoEl.style.display = 'none';
  },

  // 🔥 v3.52: vuelta a paginación real (20 en 20) en vez de cargar TODOS
  // los usuarios de golpe (v3.51) -- eso costaba 1 lectura de Firestore
  // por cada usuario de la app CADA VEZ que alguien abría esta pantalla,
  // aunque solo se fueran a ver 20. Ahora:
  //  - Sin texto en el buscador: "Explorar" pagina de 20 en 20 con el
  //    botón CARGAR MÁS (Storage.getAllUsers).
  //  - Con 2+ letras en el buscador: se cambia a modo "Buscar" y se
  //    consulta directamente a Firestore por ese término
  //    (Storage.searchUsersByUsername), con su propio CARGAR MÁS si hay
  //    más de 20 resultados. Con debounce de 400ms para no lanzar una
  //    consulta por cada letra tecleada.
  // Al borrar el texto (o dejarlo en 0-1 letras) se vuelve a "Explorar"
  // desde la primera página.
  _usuariosState: null,

  async cargarTodosUsuarios(reset = false) {
    const container = document.getElementById('todosUsuariosList');
    if (!container) return;

    if (reset || !this._usuariosState) {
      if (!AppState.currentUserData?.friendIds) await this._refreshCurrentUserData();
      const { enviadas, recibidas } = await this.obtenerSolicitudesPendientes();
      this._usuariosState = {
        modo: 'explorar', term: '',
        users: [], lastDoc: null, agotado: false, paginaActual: 0,
        friendIds: AppState.currentUserData?.friendIds || [],
        enviadas, recibidas,
        niveles: this._nivelesCache // 🔥 v3.53: compartida y persistente, ya no se reinicia en cada reset
      };
      const inputEl = document.getElementById('buscarAmigosInput');
      if (inputEl) inputEl.value = '';
    }
    await this._cargarPaginaUsuarios(true);
  },

  async cargarMasTodosUsuarios() {
    if (!this._usuariosState || this._usuariosState.agotado) return;
    await this._cargarPaginaUsuarios(false);
  },

  async _cargarPaginaUsuarios(esPrimera) {
    const st = this._usuariosState;
    const container = document.getElementById('todosUsuariosList');
    if (!st || !container) return;
    if (this._cargandoTodosUsuarios) return;
    this._cargandoTodosUsuarios = true;

    // 🔥 v3.53: si es la página 1 de "Explorar" y el listener en tiempo
    // real ya tiene datos de esta sesión, nos ahorramos hasta la
    // animación de "CARGANDO" -- se repinta al instante con lo que ya
    // había en caché, igual que el resto de listas cacheadas de la app.
    const yaHayCacheExplorar = esPrimera && st.modo === 'explorar' && this._exploreCache && !this._exploreCache.cargando;

    const esperarFinAnimacion = (esPrimera && !yaHayCacheExplorar)
      ? this._mostrarCargando(container, 'explorarUsuariosLoadingText')
      : (async () => {})();
    if (!esPrimera) {
      const btn = document.getElementById('cargarMasUsuariosBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'CARGANDO...'; }
    }

    try {
      let batch, lastDoc;
      if (st.modo === 'busqueda') {
        const result = await Storage.searchUsersByUsername(st.term, 20, esPrimera ? null : st.lastDoc);
        batch = result.items; lastDoc = result.lastDoc;
      } else if (esPrimera) {
        // 🔥 v3.53: la página 1 de "Explorar" ya no se pide con .get() --
        // viene del listener en tiempo real (ver _iniciarListenerExplorar),
        // que se abre una sola vez por sesión. Reabrir esta pantalla,
        // aceptar/enviar/cancelar una solicitud, etc. ya no cuesta ninguna
        // lectura nueva de Firestore; solo se lee de verdad cuando cambia
        // algo real en esos 20 usuarios (p.ej. un registro nuevo).
        this._iniciarListenerExplorar();
        await this._esperarPrimeraExplorar();
        batch = this._exploreCache.users;
        lastDoc = this._exploreCache.lastDoc;
      } else {
        const result = await Storage.getAllUsers(20, st.lastDoc);
        batch = result.users; lastDoc = result.lastDoc;
      }

      const uidsNuevos = batch.map(u => u.uid).filter(uid => !(uid in st.niveles));
      if (uidsNuevos.length) {
        const nivelesNuevos = await this.getNivelesDirectos(uidsNuevos);
        Object.assign(st.niveles, nivelesNuevos);
      }

      st.users = esPrimera ? batch : st.users.concat(batch);
      st.lastDoc = lastDoc || st.lastDoc;
      st.agotado = batch.length < 20;
      st.paginaActual = esPrimera ? 1 : (st.paginaActual || 1) + 1;

      if (esPrimera && !yaHayCacheExplorar) await esperarFinAnimacion();
      this._renderExplorarUsuarios(st);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      if (esPrimera) {
        await esperarFinAnimacion();
        container.innerHTML = '<p style="text-align:center; color:var(--zone-5);">Error al cargar</p>';
      } else {
        Utils.showToast('Error al cargar más usuarios', 'error');
      }
    } finally {
      this._cargandoTodosUsuarios = false;
      const btn = document.getElementById('cargarMasUsuariosBtn');
      if (btn) { btn.disabled = false; btn.textContent = 'CARGAR MÁS'; }
    }
  },

  // oninput del buscador: con debounce (400ms) para no consultar
  // Firestore en cada pulsación de tecla.
  filtrarUsuarios() {
    clearTimeout(this._debounceBusquedaTimer);
    this._debounceBusquedaTimer = setTimeout(() => this._aplicarModoBusqueda(), 400);
  },

  async _aplicarModoBusqueda() {
    const st = this._usuariosState;
    if (!st) return;
    const term = (document.getElementById('buscarAmigosInput')?.value || '').trim();

    if (term.length >= 2) {
      if (st.modo === 'busqueda' && st.term === term) return; // sin cambios
      st.modo = 'busqueda'; st.term = term; st.users = []; st.lastDoc = null; st.agotado = false;
      await this._cargarPaginaUsuarios(true);
    } else if (st.modo !== 'explorar') {
      st.modo = 'explorar'; st.term = ''; st.users = []; st.lastDoc = null; st.agotado = false;
      await this._cargarPaginaUsuarios(true);
    }
  },

  _renderExplorarUsuarios(st) {
    const { users, niveles, friendIds, enviadas, recibidas } = st;
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
      const avatarHTML = photoURL
        ? `<div class="resultado-avatar-wrapper"><img src="${Utils.escapeHTML(photoURL)}" class="resultado-avatar" style="object-fit:cover; border:2px solid ${color};" onerror="Utils.avatarFallback(this)"><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`
        : `<div class="resultado-avatar-wrapper"><div class="resultado-avatar" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; border:2px solid ${color};">👤</div><div class="nivel-badge" style="${badgeStyle}">${nivel}</div></div>`;
      const usernameFormatted = Utils.capitalizeUsername(user.username);
      let boton = '';
      if (solicitudPendiente) {
        if (solicitudEnviada) boton = `<button class="btn-amigo" data-friend-action="cancelar" data-request-id="${solicitudId}" data-uid="${user.uid}">✖️ Cancelar</button>`;
        else boton = `<button class="btn-amigo" data-friend-action="aceptar" data-request-id="${solicitudId}" data-uid="${user.uid}" data-username="${usernameFormatted}" style="background:var(--zone-2); border-color:var(--zone-2); color:var(--bg-primary);">✓ Aceptar</button>
                      <button class="btn-amigo eliminar" data-friend-action="rechazar" data-request-id="${solicitudId}" data-uid="${user.uid}">✗ Rechazar</button>`;
      } else boton = `<button class="btn-amigo" data-friend-action="agregar" data-uid="${user.uid}" data-username="${usernameFormatted}">➕ Agregar</button>`;
      html += `
        <div class="resultado-busqueda" data-uid="${user.uid}" onclick="if(!event.target.closest('button')) Friends.abrirModalAmigo('${user.uid}')">
          <div class="resultado-info">
            ${avatarHTML}
            <div>
              <div class="resultado-nombre">${Utils.escapeHTML(usernameFormatted)}</div>
              <div class="resultado-username">@${Utils.escapeHTML(user.username)}</div>
            </div>
          </div>
          <div>${boton}</div>
        </div>
      `;
    }
    container.innerHTML = html || '<p style="text-align:center; padding:20px;">No se encontraron usuarios</p>';
    const btnExistente = document.getElementById('cargarMasUsuariosBtn');
    if (btnExistente) btnExistente.remove();
    if (!st.agotado && users.length > 0) {
      const btn = document.createElement('button');
      btn.id = 'cargarMasUsuariosBtn';
      btn.className = 'action-button';
      btn.style.cssText = 'width:100%; max-width:100%; margin-top:10px;';
      btn.textContent = 'CARGAR MÁS';
      btn.onclick = () => this.cargarMasTodosUsuarios();
      container.parentElement.appendChild(btn);
    }
  },

  async actualizarBadgeSolicitudes() {
    if (!AppState.currentUserId) return;
    try {
      const { recibidas } = await this.obtenerSolicitudesPendientes();
      const count = recibidas.length;
      AppState.solicitudesPendientesCount = count;
      AppState.actualizarBadgeSolicitudes();
    } catch (error) { console.error('Error actualizando badge solicitudes:', error); }
  }
};

document.addEventListener('DOMContentLoaded', () => { Friends.initEventListeners(); });
window.Friends = Friends;
console.log('✅ friends.js v3.53 - Página 1 de "Explorar usuarios" servida desde un listener en tiempo real (caché real + niveles cacheados) en vez de volver a pedirla en cada apertura o acción de amistad -- Buscar por nombre sigue costando una lectura real por búsqueda, como se pidió');

