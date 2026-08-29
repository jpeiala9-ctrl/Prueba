// ==================== storage.js - Módulo de almacenamiento completo + GAMIFICACIÓN ====================
// Versión: 3.27 - Mensajes de soporte: eliminación sincronizada + permisos para usuarios
// ====================

const Storage = {
  async getUser(uid) { 
    if (!uid) return null; 
    try { 
      const doc = await firebaseServices.db.collection('users').doc(uid).get(); 
      return doc.exists ? doc.data() : null; 
    } catch (error) { 
      console.error('Error getting user:', error); 
      return null; 
    } 
  },
  
  async searchUsersByUsername(searchTerm, limit = 20, startAfter = null) {
    if (!searchTerm || searchTerm.length < 2) return { items: [], lastDoc: null };
    try {
      let query = firebaseServices.db.collection('users')
        .orderBy('username_lowercase')
        .startAt(searchTerm.toLowerCase())
        .endAt(searchTerm.toLowerCase() + '\uf8ff')
        .limit(limit);
      if (startAfter) query = query.startAfter(startAfter);
      let snapshot = await query.get();
      if (snapshot.empty) { 
        query = firebaseServices.db.collection('users')
          .orderBy('username')
          .startAt(searchTerm)
          .endAt(searchTerm + '\uf8ff')
          .limit(limit);
        if (startAfter) query = query.startAfter(startAfter);
        snapshot = await query.get(); 
      }
      const items = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      return { items, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) { 
      console.error('Error searching users:', error); 
      throw error; 
    } 
  },
  
  async getAllUsers(limit = 20, startAfter = null) { 
    let query = firebaseServices.db.collection('users')
      .orderBy('username')
      .limit(limit); 
    if (startAfter) query = query.startAfter(startAfter); 
    const snapshot = await query.get(); 
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })); 
    return { users, lastDoc: snapshot.docs[snapshot.docs.length - 1] }; 
  },
  
  async getSubcollection(uid, subcol, options = { orderBy: 'timestamp', direction: 'desc', limit: 25, startAfter: null }) {
    if (!uid) return { items: [], lastDoc: null };
    try {
      let query = firebaseServices.db.collection('users').doc(uid).collection(subcol)
        .orderBy(options.orderBy, options.direction)
        .limit(options.limit);
      if (options.startAfter) query = query.startAfter(options.startAfter);
      const snapshot = await query.get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { items, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) { 
      console.error(`Error getting ${subcol}:`, error); 
      if (error.code === 'failed-precondition') 
        Utils.showToast('Error de índice. Contacta al administrador.', 'error');
      else 
        Utils.showToast('Error al cargar', 'error');
      return { items: [], lastDoc: null }; 
    }
  },

  async getHistorial(uid, limit = 25, startAfter = null) { 
    return this.getSubcollection(uid, 'historial', { orderBy: 'timestamp', direction: 'desc', limit, startAfter }); 
  },
  
  async addHistorialEntry(uid, entry) { 
    if (!uid || !entry) return; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).collection('historial').add({ ...entry, timestamp: firebaseServices.Timestamp.now() }); 
    } catch (error) { 
      console.error('Error adding historial entry:', error); 
      Utils.showToast('Error al guardar en historial', 'error'); 
    } 
  },
  
  async deleteHistorialEntry(uid, entryId) { 
    if (!uid || !entryId) return; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).collection('historial').doc(entryId).delete(); 
    } catch (error) { 
      console.error('Error deleting historial entry:', error); 
      Utils.showToast('Error al eliminar entrada', 'error'); 
    } 
  },
  
  async getHistorialPlanes(uid, limit = 5, startAfter = null) { 
    const result = await this.getSubcollection(uid, 'planes', { orderBy: 'fechaCreacion', direction: 'desc', limit, startAfter }); 
    return result.items; 
  },
  
  async addPlan(uid, plan) { 
    if (!uid || !plan) return null; 
    try { 
      const planId = plan.id || firebaseServices.db.collection('_').doc().id; 
      await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).set(plan); 
      return planId; 
    } catch (error) { 
      console.error('Error adding plan:', error); 
      Utils.showToast('Error al guardar plan', 'error'); 
      return null; 
    } 
  },
  
  async deletePlan(uid, planId) { 
    if (!uid || !planId) return; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).delete(); 
    } catch (error) { 
      console.error('Error deleting plan:', error); 
      Utils.showToast('Error al eliminar plan', 'error'); 
    } 
  },
  
  async getPlanCompleto(uid, planId) { 
    if (!uid || !planId) return null; 
    try { 
      const doc = await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).get(); 
      return doc.exists ? doc.data() : null; 
    } catch (error) { 
      console.error('Error getting plan completo:', error); 
      return null; 
    } 
  },
  
  async getUltimoCalculo(uid) { 
    if (!uid) return null; 
    try { 
      const userDoc = await firebaseServices.db.collection('users').doc(uid).get(); 
      if (!userDoc.exists) return null; 
      const ultimoCalculoId = userDoc.data().ultimoCalculoId; 
      if (!ultimoCalculoId) return null; 
      const calculoDoc = await firebaseServices.db.collection('users').doc(uid).collection('calculos').doc(ultimoCalculoId).get(); 
      if (!calculoDoc.exists) return null;
      const data = calculoDoc.data();
      // Las zonas se guardan como objetos (ver nota en setUltimoCalculo)
      // porque Firestore no admite arrays anidados. Se reconstruyen aquí
      // como tuplas [código, etiqueta, fcMinPct, fcMaxPct, factorPace,
      // cssClass, html] para que el resto de la app (que usa z[0], z[4]...)
      // no tenga que cambiar nada.
      if (Array.isArray(data.zones) && data.zones.length && data.zones[0] && typeof data.zones[0] === 'object' && !Array.isArray(data.zones[0])) {
        data.zones = data.zones.map(z => [z.codigo, z.etiqueta, z.fcMinPct, z.fcMaxPct, z.factorPace, z.cssClass, z.html]);
      }
      return data;
    } catch (error) { 
      console.error('Error getting ultimo calculo:', error); 
      return null; 
    } 
  },
  
  async setUltimoCalculo(uid, calculo) { 
    if (!uid || !calculo) return; 
    try { 
      const calculoId = firebaseServices.db.collection('_').doc().id; 
      // 🔧 BUG CORREGIDO: calculo.zones es un array de arrays (cada zona
      // es una tupla ["Z1","RECUPERACIÓN",0.75,0.80,1.35,"z1","<p>...</p>"]).
      // Cloud Firestore NO permite que un array contenga directamente a
      // otro array como elemento -- este .set() fallaba SIEMPRE (para
      // cualquier usuario) y solo quedaba registrado con un
      // console.error más abajo, así que ultimoCalculoId nunca llegaba a
      // guardarse. Como un array SÍ puede contener objetos, cada zona se
      // convierte a un objeto antes de guardar; getUltimoCalculo() de
      // arriba la reconstruye como tupla al leerla, así que ningún otro
      // sitio de la app necesita cambiar.
      const calculoParaGuardar = {
        ...calculo,
        zones: Array.isArray(calculo.zones) ? calculo.zones.map(z => ({
          codigo: z[0], etiqueta: z[1], fcMinPct: z[2], fcMaxPct: z[3],
          factorPace: z[4], cssClass: z[5], html: z[6]
        })) : calculo.zones
      };
      await firebaseServices.db.collection('users').doc(uid).collection('calculos').doc(calculoId).set({ ...calculoParaGuardar, timestamp: firebaseServices.Timestamp.now() }); 
      await firebaseServices.db.collection('users').doc(uid).update({ ultimoCalculoId: calculoId }); 
    } catch (error) { 
      console.error('Error setting ultimo calculo:', error); 
    } 
  },
  
  async sendFriendRequest(fromUid, toUid) { 
    if (!fromUid || !toUid) return false; 
    try { 
      const fromUser = await this.getUser(fromUid); 
      const toUser = await this.getUser(toUid); 
      if (!fromUser || !toUser) return false; 
      const requestId = `${fromUid}_${toUid}`; 
      await firebaseServices.db.collection('friendRequests').doc(requestId).set({ 
        from: fromUid, 
        to: toUid, 
        fromUsername: fromUser.username, 
        toUsername: toUser.username, 
        status: 'pending', 
        timestamp: firebaseServices.Timestamp.now() 
      }); 
      return true; 
    } catch (error) { 
      console.error('Error sending friend request:', error); 
      Utils.showToast('Error al enviar solicitud', 'error'); 
      return false; 
    } 
  },
  
  async acceptFriendRequest(requestId, fromUid, toUid) { 
    if (!requestId || !fromUid || !toUid) return false; 
    try { 
      // BUG CORREGIDO (encontrado simulando aceptaciones concurrentes):
      // antes se leía friendIds, se reconstruía el array en memoria con el
      // nuevo amigo añadido, y se escribía ese array completo. Si dos
      // aceptaciones llegaban casi a la vez al MISMO usuario (p.ej. acepta
      // dos solicitudes seguidas sin esperar a que la primera termine de
      // guardarse), la segunda escritura podía pisar a la primera con una
      // copia del array ya desactualizada -- perdiendo una amistad entera
      // en silencio. arrayUnion es la operación atómica que Firestore
      // ofrece justo para esto: combina las escrituras concurrentes de
      // forma segura en vez de que la última gane. friendsCount sigue
      // estimándose por adelantado (como antes) porque arrayUnion no
      // informa el tamaño resultante; si ese conteo queda desajustado por
      // una carrera muy concreta, es solo un número que se autocorrige
      // más adelante -- nunca se pierde la amistad en sí.
      const [fromDoc, toDoc] = await Promise.all([
        firebaseServices.db.collection('users').doc(fromUid).get(),
        firebaseServices.db.collection('users').doc(toUid).get()
      ]);
      const fromFriendIds = fromDoc.data()?.friendIds || [];
      const toFriendIds = toDoc.data()?.friendIds || [];
      const estimadoFromCount = fromFriendIds.includes(toUid) ? fromFriendIds.length : fromFriendIds.length + 1;
      const estimadoToCount = toFriendIds.includes(fromUid) ? toFriendIds.length : toFriendIds.length + 1;

      const batch = firebaseServices.db.batch(); 
      const requestRef = firebaseServices.db.collection('friendRequests').doc(requestId); 
      batch.update(requestRef, { status: 'accepted' }); 
      const fromRef = firebaseServices.db.collection('users').doc(fromUid); 
      const toRef = firebaseServices.db.collection('users').doc(toUid); 
      batch.update(fromRef, { 
        friendIds: firebaseServices.FieldValue.arrayUnion(toUid), 
        friendsCount: estimadoFromCount 
      }); 
      batch.update(toRef, { 
        friendIds: firebaseServices.FieldValue.arrayUnion(fromUid), 
        friendsCount: estimadoToCount 
      }); 
      await batch.commit(); 
      return true; 
    } catch (error) { 
      console.error('Error accepting friend request:', error); 
      Utils.showToast('Error al aceptar solicitud', 'error'); 
      return false; 
    } 
  },
  
  async rejectFriendRequest(requestId) { 
    if (!requestId) return false; 
    try { 
      await firebaseServices.db.collection('friendRequests').doc(requestId).update({ status: 'rejected' }); 
      return true; 
    } catch (error) { 
      console.error('Error rejecting friend request:', error); 
      Utils.showToast('Error al rechazar solicitud', 'error'); 
      return false; 
    } 
  },
  
  async getFriendRequests(uid) { 
    if (!uid) return []; 
    try { 
      const snapshot = await firebaseServices.db.collection('friendRequests')
        .where('to', '==', uid)
        .where('status', '==', 'pending')
        .orderBy('timestamp', 'desc')
        .get(); 
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
    } catch (error) { 
      console.error('Error getting friend requests:', error); 
      throw error; 
    } 
  },
  
  async getFriends(uid) { 
    if (!uid) return []; 
    try { 
      const userDoc = await firebaseServices.db.collection('users').doc(uid).get(); 
      const friendIds = userDoc.data()?.friendIds || []; 
      if (friendIds.length === 0) return []; 
      const friendPromises = friendIds.map(fid => firebaseServices.db.collection('users').doc(fid).get()); 
      const snapshots = await Promise.all(friendPromises); 
      const friends = snapshots.filter(doc => doc.exists).map(doc => ({ uid: doc.id, ...doc.data() })); 
      return friends; 
    } catch (error) { 
      console.error('Error getting friends:', error); 
      return []; 
    } 
  },
  
  async removeFriend(uid, friendUid) { 
    if (!uid || !friendUid) return false; 
    try { 
      // BUG CORREGIDO (mismo caso que acceptFriendRequest): si un usuario
      // elimina a dos amigos distintos casi a la vez, la reconstrucción
      // manual del array podía hacer que la segunda escritura pisara a la
      // primera con una copia ya desactualizada -- dejando a uno de los
      // dos amigos eliminados "reaparecer" en la lista. arrayRemove es la
      // operación atómica de Firestore para esto: quita el valor exacto
      // sea cual sea el estado real del array en ese instante, sin
      // importar el orden de llegada de las escrituras. friendsCount se
      // sigue estimando por adelantado, con el mismo margen de auto-
      // corrección ya explicado ahí.
      const [userDoc, friendDoc] = await Promise.all([
        firebaseServices.db.collection('users').doc(uid).get(),
        firebaseServices.db.collection('users').doc(friendUid).get()
      ]);
      const estimadoUserCount = Math.max(0, (userDoc.data()?.friendIds || []).filter(id => id !== friendUid).length);
      const estimadoFriendCount = Math.max(0, (friendDoc.data()?.friendIds || []).filter(id => id !== uid).length);

      const batch = firebaseServices.db.batch(); 
      const userRef = firebaseServices.db.collection('users').doc(uid); 
      const friendRef = firebaseServices.db.collection('users').doc(friendUid); 
      batch.update(userRef, { 
        friendIds: firebaseServices.FieldValue.arrayRemove(friendUid), 
        friendsCount: estimadoUserCount 
      }); 
      batch.update(friendRef, { 
        friendIds: firebaseServices.FieldValue.arrayRemove(uid), 
        friendsCount: estimadoFriendCount 
      }); 
      await batch.commit(); 
      return true; 
    } catch (error) { 
      console.error('Error removing friend:', error); 
      Utils.showToast('Error al eliminar amigo', 'error'); 
      return false; 
    } 
  },
  
  // ==================================================================
  //  SINCRONIZACIÓN RETROACTIVA DE photoURL (muro + chats)
  // ==================================================================
  // El photoURL se guarda DUPLICADO (denormalizado) en varios sitios para
  // no tener que hacer una lectura extra por cada entrada al pintar el
  // muro o la lista de chats:
  //   - globalFeed/{entryId}.photoURL                            (posts del muro)
  //   - conversations/{convId}.participantsData.{uid}.photoURL   (lista de chats)
  // Si cambias tu foto de perfil, esas copias no se actualizan solas.
  // autoSyncPhotoURL() arregla las dos, y se llama automáticamente cada
  // vez que inicias sesión (ver AppState.setCurrentUser en app.js) SIN
  // que el usuario tenga que volver a tocar su foto. Para no repetir el
  // trabajo (ni gastar lecturas) si no ha cambiado nada desde la última
  // vez, se guarda una marca en localStorage con la última foto ya
  // sincronizada y se compara antes de consultar Firestore.
  async autoSyncPhotoURL(uid, photoURL, { force = false } = {}) {
    if (!uid) return;
    photoURL = photoURL || null;
    const marcaKey = `ri5_photo_sync_${uid}`;

    if (!force) {
      try {
        // JSON.stringify para poder distinguir "ya sincronizado a null"
        // de "todavía no se ha comprobado nunca" (localStorage siempre
        // devuelve string o null, nunca undefined).
        if (localStorage.getItem(marcaKey) === JSON.stringify(photoURL)) return;
      } catch (e) { /* localStorage no disponible: seguimos igualmente */ }
    }

    try {
      await Promise.all([
        this._syncPhotoURLGlobalFeed(uid, photoURL),
        this._syncPhotoURLConversaciones(uid, photoURL)
      ]);
      try { localStorage.setItem(marcaKey, JSON.stringify(photoURL)); } catch (e) {}
    } catch (error) {
      // No guardamos la marca si algo falló, así se reintenta solo en el
      // próximo inicio de sesión en vez de darse por sincronizado.
      console.error('Error en autoSyncPhotoURL:', error);
    }
  },

  async _syncPhotoURLGlobalFeed(uid, photoURL) {
    const snapshot = await firebaseServices.db.collection('globalFeed')
      .where('userId', '==', uid)
      .get();
    if (snapshot.empty) return;

    // Solo tocamos los documentos que de verdad estén desactualizados,
    // para no generar escrituras (ni facturación) innecesarias.
    const desactualizados = snapshot.docs.filter(doc => (doc.data().photoURL || null) !== photoURL);
    if (desactualizados.length === 0) return;

    const CHUNK = 450; // límite de 500 operaciones por batch de Firestore
    for (let i = 0; i < desactualizados.length; i += CHUNK) {
      const batch = firebaseServices.db.batch();
      desactualizados.slice(i, i + CHUNK).forEach(doc => {
        batch.update(doc.ref, { photoURL: photoURL });
      });
      await batch.commit();
    }
  },

  async _syncPhotoURLConversaciones(uid, photoURL) {
    const snapshot = await firebaseServices.db.collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();
    if (snapshot.empty) return;

    const desactualizados = snapshot.docs.filter(doc => {
      const actual = doc.data().participantsData?.[uid]?.photoURL || null;
      return actual !== photoURL;
    });
    if (desactualizados.length === 0) return;

    const CHUNK = 450;
    for (let i = 0; i < desactualizados.length; i += CHUNK) {
      const batch = firebaseServices.db.batch();
      desactualizados.slice(i, i + CHUNK).forEach(doc => {
        // Solo tocamos la clave del propio uid dentro del mapa: las
        // reglas de seguridad exigen exactamente esto (no se puede
        // modificar la entrada del otro participante).
        batch.update(doc.ref, { [`participantsData.${uid}.photoURL`]: photoURL });
      });
      await batch.commit();
    }
  },

  async uploadProfilePicture(uid, file) {
    if (!uid || !file) return null;
    try {
      const ref = firebaseServices.storage.ref(`profile_pictures/${uid}/avatar.jpg`);
      await ref.put(file);
      const downloadURL = await ref.getDownloadURL();
      await firebaseServices.db.collection('users').doc(uid).update({
        'profile.photoURL': downloadURL
      });
      await this.autoSyncPhotoURL(uid, downloadURL, { force: true });
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Utils.showToast('Error al subir la foto', 'error');
      return null;
    }
  },
  
  async deleteProfilePicture(uid) {
    if (!uid) return false;
    try {
      const ref = firebaseServices.storage.ref(`profile_pictures/${uid}/avatar.jpg`);
      await ref.delete();
      await firebaseServices.db.collection('users').doc(uid).update({
        'profile.photoURL': null
      });
      await this.autoSyncPhotoURL(uid, null, { force: true });
      return true;
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }
  },
  
  async getProfilePictureURL(uid) {
    if (!uid) return null;
    try {
      const ref = firebaseServices.storage.ref(`profile_pictures/${uid}/avatar.jpg`);
      return await ref.getDownloadURL();
    } catch (error) {
      return null;
    }
  },
  
  async procesarCalculosPendientes() { 
    if (!navigator.onLine) return; 
    const pendientes = JSON.parse(localStorage.getItem('ri5_calculos_pendientes') || '[]'); 
    if (pendientes.length === 0) return; 
    const nuevosPendientes = []; 
    for (const calc of pendientes) { 
      try { 
        await this.addHistorialEntry(AppState.currentUserId, calc); 
        await this.setUltimoCalculo(AppState.currentUserId, calc); 
      } catch (error) { 
        console.warn('Error subiendo cálculo pendiente, se queda en cola:', error); 
        nuevosPendientes.push(calc); 
      } 
    } 
    localStorage.setItem('ri5_calculos_pendientes', JSON.stringify(nuevosPendientes)); 
    if (nuevosPendientes.length === 0) 
      Utils.showToast('✅ Cálculos pendientes sincronizados', 'success'); 
    else 
      Utils.showToast(`⚠️ ${nuevosPendientes.length} cálculos pendientes no pudieron sincronizarse`, 'warning'); 
  },
  
  // ==================== NUEVO SISTEMA DE SOPORTE ====================
  
  /**
   * Envía un mensaje de soporte.
   * - Guarda en la colección global 'soporteMensajes' para el administrador.
   * - Guarda en la subcolección 'mensajes' del usuario destinatario (si no es admin).
   * - Guarda en la subcolección 'mensajes' del usuario remitente (si no es admin).
   */
  async enviarMensajeSoporte(fromUid, toUid, texto, broadcastId = null) {
    if (!fromUid || !toUid || !texto) return false;
    try {
      const timestamp = firebaseServices.Timestamp.now();
      const mensaje = {
        fromUid: fromUid,
        toUid: toUid,
        texto: texto,
        timestamp: timestamp,
        leido: false,
        fecha: new Date().toLocaleString()
      };
      if (broadcastId) mensaje.broadcastId = broadcastId;

      // 1. Guardar en la colección global (para el administrador)
      await firebaseServices.db.collection('soporteMensajes').add({ ...mensaje });
      
      // 2. Guardar en la subcolección del destinatario (si no es admin)
      const adminUid = await this.getAdminUid();
      if (toUid !== adminUid) {
        await firebaseServices.db
          .collection('users')
          .doc(toUid)
          .collection('mensajes')
          .add({ ...mensaje, esParaUsuario: true });
        console.log(`📨 Mensaje guardado en subcolección de ${toUid}`);
      }
      
      // 3. Guardar en la subcolección del remitente (si no es admin)
      if (fromUid !== adminUid) {
        await firebaseServices.db
          .collection('users')
          .doc(fromUid)
          .collection('mensajes')
          .add({ ...mensaje, esParaUsuario: true });
        console.log(`📨 Mensaje guardado en subcolección de ${fromUid}`);
      }
      
      console.log(`✅ Mensaje enviado de ${fromUid} a ${toUid}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando mensaje de soporte:', error);
      return false;
    }
  },

  /**
   * Obtiene todos los mensajes de soporte de un usuario (desde su subcolección privada).
   */
  async getMensajesSoporteUsuario(uid) {
    if (!uid) return [];
    try {
      const snapshot = await firebaseServices.db
        .collection('users')
        .doc(uid)
        .collection('mensajes')
        .orderBy('timestamp', 'desc')
        .get();
      
      const mensajes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`📬 ${mensajes.length} mensajes cargados para usuario ${uid}`);
      return mensajes;
    } catch (error) {
      console.error('❌ Error obteniendo mensajes de soporte del usuario:', error);
      return [];
    }
  },

  /**
   * Obtiene todos los mensajes de soporte para el administrador (desde la colección global).
   */
  async getMensajesSoporteAdmin() {
    try {
      const snapshot = await firebaseServices.db
        .collection('soporteMensajes')
        .orderBy('timestamp', 'desc')
        .get();
      const mensajes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`📬 ${mensajes.length} mensajes cargados para admin`);
      return mensajes;
    } catch (error) {
      console.error('❌ Error obteniendo mensajes de soporte para admin:', error);
      return [];
    }
  },

  /**
   * Elimina POR COMPLETO la conversación de soporte entre el admin y un
   * usuario: todos los mensajes en la colección global 'soporteMensajes'
   * (en ambos sentidos) y toda la subcolección privada 'mensajes' de ese
   * usuario (que, en este sistema, solo contiene su hilo con soporte).
   */
  async eliminarConversacionSoporte(uid) {
    if (!uid) return false;
    try {
      const adminUid = await this.getAdminUid();
      const db = firebaseServices.db;

      const [deUsuarioAAdmin, deAdminAUsuario, subcoleccionUsuario] = await Promise.all([
        db.collection('soporteMensajes').where('fromUid', '==', uid).where('toUid', '==', adminUid).get(),
        db.collection('soporteMensajes').where('fromUid', '==', adminUid).where('toUid', '==', uid).get(),
        db.collection('users').doc(uid).collection('mensajes').get()
      ]);

      const docsABorrar = [
        ...deUsuarioAAdmin.docs,
        ...deAdminAUsuario.docs,
        ...subcoleccionUsuario.docs
      ];

      if (docsABorrar.length === 0) return true;

      // Firestore limita los batch a 500 operaciones: se trocea por si
      // acaso, aunque una conversación de soporte normal no se acerca.
      for (let i = 0; i < docsABorrar.length; i += 450) {
        const batch = db.batch();
        docsABorrar.slice(i, i + 450).forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      console.log(`🗑️ Conversación de soporte con ${uid} eliminada (${docsABorrar.length} mensajes)`);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando conversación de soporte:', error);
      return false;
    }
  },

  /**
   * Marca un mensaje de soporte como leído (en la subcolección del usuario).
   */
  async marcarMensajeSoporteLeido(mensajeId, usuarioUid) {
    if (!mensajeId) return;
    try {
      // Antes esta función buscaba por un campo 'id' que los documentos
      // nunca tienen (where('id','==', mensajeId) no encontraba nada) y
      // solo tocaba la subcolección del usuario, no el mensaje real que ve
      // el admin en 'soporteMensajes'. Ahora se actualiza directamente el
      // documento real por su id de Firestore.
      await firebaseServices.db
        .collection('soporteMensajes')
        .doc(mensajeId)
        .update({ leido: true });

      // Si además existe copia en la subcolección del usuario destinatario,
      // se marca también para mantenerlas sincronizadas.
      if (usuarioUid) {
        const snapshot = await firebaseServices.db
          .collection('users')
          .doc(usuarioUid)
          .collection('mensajes')
          .where('id', '==', mensajeId)
          .get();
        if (!snapshot.empty) {
          const batch = firebaseServices.db.batch();
          snapshot.forEach(doc => batch.update(doc.ref, { leido: true }));
          await batch.commit();
        }
      }
      
      // También marcar en la colección global si existe
      await firebaseServices.db
        .collection('soporteMensajes')
        .doc(mensajeId)
        .update({ leido: true })
        .catch(() => {});
      
      console.log(`✅ Mensaje ${mensajeId} marcado como leído para usuario ${usuarioUid}`);
    } catch (error) {
      console.error('❌ Error marcando mensaje como leído:', error);
    }
  },

  /**
   * Borra un mensaje "a Todos" POR COMPLETO: de la colección global que ve
   * el admin y de la subcolección de mensajes de cada usuario que lo
   * recibió. No queda ni rastro para nadie.
   */
  async eliminarBroadcastCompleto(broadcastId) {
    if (!broadcastId) return false;
    try {
      const snapshot = await firebaseServices.db
        .collection('soporteMensajes')
        .where('broadcastId', '==', broadcastId)
        .get();

      const toUids = [...new Set(snapshot.docs.map(doc => doc.data().toUid).filter(Boolean))];

      // Borrar las copias en la subcolección de cada destinatario (en
      // lotes de escritura, Firestore no permite más de 500 por batch).
      const userDeletions = [];
      for (const uid of toUids) {
        const userSnap = await firebaseServices.db
          .collection('users').doc(uid)
          .collection('mensajes')
          .where('broadcastId', '==', broadcastId)
          .get();
        userSnap.forEach(doc => userDeletions.push(doc.ref));
      }

      const allRefs = [...snapshot.docs.map(doc => doc.ref), ...userDeletions];
      for (let i = 0; i < allRefs.length; i += 450) {
        const batch = firebaseServices.db.batch();
        allRefs.slice(i, i + 450).forEach(ref => batch.delete(ref));
        await batch.commit();
      }
      return true;
    } catch (error) {
      console.error('❌ Error eliminando broadcast completo:', error);
      return false;
    }
  },

  /**
   * Borra un mensaje individual SOLO del panel del admin (la colección
   * global 'soporteMensajes'). La copia en la subcolección del usuario
   * (su bandeja de soporte) se mantiene intacta: el mensaje sigue
   * existiendo para él.
   */
  async eliminarMensajeSoporteSoloAdmin(mensajeId) {
    if (!mensajeId) return false;
    try {
      await firebaseServices.db.collection('soporteMensajes').doc(mensajeId).delete();
      return true;
    } catch (error) {
      console.error('❌ Error eliminando mensaje solo del panel de admin:', error);
      return false;
    }
  },

  async eliminarBroadcastSoloAdmin(broadcastId) {
    if (!broadcastId) return false;
    try {
      const snapshot = await firebaseServices.db
        .collection('soporteMensajes')
        .where('broadcastId', '==', broadcastId)
        .get();
      const refs = snapshot.docs.map(doc => doc.ref);
      for (let i = 0; i < refs.length; i += 450) {
        const batch = firebaseServices.db.batch();
        refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
        await batch.commit();
      }
      return true;
    } catch (error) {
      console.error('❌ Error eliminando broadcast solo del panel de admin:', error);
      return false;
    }
  },

  // Obtener el UID del administrador
  async getAdminUid() {
    try {
      const snapshot = await firebaseServices.db.collection('users')
        .where('isAdmin', '==', true)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      console.warn('⚠️ No se encontró ningún administrador en la base de datos');
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo UID del administrador:', error);
      return null;
    }
  },

  // ==================== GAMIFICATION ====================
  async getGamificationData(uid) {
    if (!uid) return null;
    try {
      const doc = await firebaseServices.db.collection('gamification').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error obteniendo datos de gamificación:', error);
      return null;
    }
  },

  async updateGamificationData(uid, data) {
    if (!uid || !data) return false;
    try {
      await firebaseServices.db.collection('gamification').doc(uid).set(data, { merge: true });
      return true;
    } catch (error) {
      console.error('Error actualizando gamificación:', error);
      return false;
    }
  },

  // ==================== NUEVAS FUNCIONES PARA ADMIN (FASE 1) ====================
  async contarUsuarios() {
    try {
      const snapshot = await firebaseServices.db.collection('users').count().get();
      return snapshot.data().count;
    } catch (e) {
      console.warn('Fallback a método alternativo para contar usuarios:', e);
      const snapshot = await firebaseServices.db.collection('users').get();
      return snapshot.size;
    }
  },

  async contarUsuariosPremium() {
    try {
      const snapshot = await firebaseServices.db.collection('users').where('premium', '==', true).count().get();
      return snapshot.data().count;
    } catch (e) {
      console.warn('Fallback para contar premium:', e);
      const snapshot = await firebaseServices.db.collection('users').where('premium', '==', true).get();
      return snapshot.size;
    }
  },

  async contarUsuariosNuevos(dias = 7) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    const fechaStr = fecha.toISOString();
    try {
      const snapshot = await firebaseServices.db.collection('users')
        .where('created', '>=', fechaStr)
        .count().get();
      return snapshot.data().count;
    } catch (e) {
      console.warn('Fallback para contar nuevos usuarios:', e);
      const snapshot = await firebaseServices.db.collection('users')
        .where('created', '>=', fechaStr).get();
      return snapshot.size;
    }
  }
};

window.Storage = Storage;