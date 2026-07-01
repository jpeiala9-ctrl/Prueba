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
  
  async getUserByUsername(username) { 
    if (!username) return null; 
    try { 
      const snapshot = await firebaseServices.db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get(); 
      if (snapshot.empty) return null; 
      const doc = snapshot.docs[0]; 
      return { uid: doc.id, ...doc.data() }; 
    } catch (error) { 
      console.error('Error getting user by username:', error); 
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
  
  async createUser(uid, userData) { 
    if (!uid || !userData) return false; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).set(userData); 
      return true; 
    } catch (error) { 
      console.error('Error creating user:', error); 
      Utils.showToast('Error al crear usuario', 'error'); 
      return false; 
    } 
  },
  
  async updateUser(uid, userData) { 
    if (!uid || !userData) return false; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).update(userData); 
      return true; 
    } catch (error) { 
      console.error('Error updating user:', error); 
      Utils.showToast('Error al actualizar usuario', 'error'); 
      return false; 
    } 
  },
  
  async deleteUser(uid) { 
    if (!uid) return false; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).delete(); 
      return true; 
    } catch (error) { 
      console.error('Error deleting user:', error); 
      Utils.showToast('Error al eliminar usuario', 'error'); 
      return false; 
    } 
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
  
  async getUltimoPlan(uid) { 
    const result = await this.getSubcollection(uid, 'planes', { orderBy: 'fechaCreacion', direction: 'desc', limit: 1 }); 
    return result.items[0] || null; 
  },
  
  async setUltimoPlan(uid, plan) { 
    if (!uid || !plan) return; 
    try { 
      const planId = await this.addPlan(uid, { ...plan, esUltimo: true, fechaCreacion: new Date().toISOString() }); 
      await firebaseServices.db.collection('users').doc(uid).update({ ultimoPlanId: planId }); 
    } catch (error) { 
      console.error('Error setting ultimo plan:', error); 
    } 
  },
  
  async removeUltimoPlan(uid) { 
    if (!uid) return; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).update({ ultimoPlanId: null }); 
    } catch (error) { 
      console.error('Error removing ultimo plan:', error); 
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
  
  async savePlanCompleto(uid, planId, planData) { 
    if (!uid || !planId || !planData) return; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).set(planData, { merge: true }); 
    } catch (error) { 
      console.error('Error saving plan completo:', error); 
      Utils.showToast('Error al guardar plan', 'error'); 
    } 
  },
  
  async getSesionesRealizadas(uid, planId) { 
    if (!uid || !planId) return {}; 
    try { 
      const snapshot = await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).collection('sesiones').get(); 
      const realizadas = {}; 
      snapshot.forEach(doc => realizadas[doc.id] = doc.data().realizado); 
      return realizadas; 
    } catch (error) { 
      console.error('Error getting sesiones:', error); 
      return {}; 
    } 
  },
  
  async marcarSesionRealizada(uid, planId, diaIndex, realizado) { 
    if (!uid || !planId || !diaIndex) return; 
    try { 
      await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).collection('sesiones').doc(diaIndex.toString()).set({ 
        realizado, 
        fecha: new Date().toISOString(), 
        timestamp: firebaseServices.Timestamp.now() 
      }); 
    } catch (error) { 
      console.error('Error marking session:', error); 
      Utils.showToast('Error al marcar sesión', 'error'); 
    } 
  },
  
  // ==================== FUNCIONES ANTIGUAS DE MENSAJES (se mantienen por compatibilidad) ====================
  async getMensajesUsuario(uid) { 
    if (!uid) return []; 
    try { 
      const doc = await firebaseServices.db.collection('mensajes').doc(uid).get(); 
      const data = doc.data(); 
      return data && Array.isArray(data.mensajes) ? data.mensajes : []; 
    } catch (error) { 
      console.error('Error getting mensajes usuario:', error); 
      return []; 
    } 
  },
  
  async enviarMensajeUsuario(usuario, texto) { 
    if (!usuario || !texto) return false; 
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(usuario).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const username = userData?.username || 'Usuario';
      const usernameLower = userData?.username_lowercase || username.toLowerCase();
      
      const adminKey = "admin_" + usuario; 
      const docRef = firebaseServices.db.collection('mensajes').doc(adminKey); 
      const doc = await docRef.get(); 
      let mensajes = []; 
      if (doc.exists) { 
        const data = doc.data(); 
        mensajes = Array.isArray(data.mensajes) ? data.mensajes : []; 
      } 
      mensajes.push({ 
        fecha: new Date().toLocaleString(), 
        texto, 
        leido: false, 
        esUsuario: true,
        username: username,
        username_lowercase: usernameLower,
        timestamp: firebaseServices.Timestamp.now() 
      }); 
      await docRef.set({ mensajes }); 
      return true; 
    } catch (error) { 
      console.error('Error detallado en enviarMensajeUsuario:', error); 
      throw error; 
    } 
  },
  
  async enviarMensajeAdminAUsuario(usuario, texto) { 
    if (!usuario || !texto) return false; 
    try { 
      const userDoc = await firebaseServices.db.collection('users').doc(usuario).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const toUsername = userData?.username || 'Usuario';
      
      const docRef = firebaseServices.db.collection('mensajes').doc(usuario); 
      const doc = await docRef.get(); 
      let mensajes = []; 
      if (doc.exists) { 
        const data = doc.data(); 
        mensajes = Array.isArray(data.mensajes) ? data.mensajes : []; 
      } 
      mensajes.push({ 
        fecha: new Date().toLocaleString(), 
        texto, 
        leido: false, 
        esAdmin: true,
        toUsername: toUsername,
        timestamp: firebaseServices.Timestamp.now() 
      }); 
      await docRef.set({ mensajes }); 
      return true; 
    } catch (error) { 
      console.error('Error detallado en enviarMensajeAdminAUsuario:', error); 
      Utils.showToast('Error al enviar mensaje: ' + error.message, 'error'); 
      return false; 
    } 
  },
  
  async getMensajesEnviadosUsuario(uid) { 
    if (!uid) return []; 
    try { 
      const adminKey = "admin_" + uid; 
      const doc = await firebaseServices.db.collection('mensajes').doc(adminKey).get(); 
      const data = doc.data(); 
      return data && Array.isArray(data.mensajes) ? data.mensajes : []; 
    } catch (error) { 
      console.error('Error getting mensajes enviados:', error); 
      return []; 
    } 
  },
  
  async borrarMensajeUsuario(uid, idx) { 
    if (!uid || idx === undefined) return; 
    try { 
      const docRef = firebaseServices.db.collection('mensajes').doc(uid); 
      const doc = await docRef.get(); 
      if (doc.exists) { 
        const data = doc.data(); 
        let mensajes = Array.isArray(data.mensajes) ? data.mensajes : []; 
        if (idx >= 0 && idx < mensajes.length) { 
          mensajes.splice(idx, 1); 
          await docRef.set({ mensajes }); 
        } 
      } 
    } catch (error) { 
      console.error('Error deleting mensaje:', error); 
      Utils.showToast('Error al eliminar mensaje', 'error'); 
    } 
  },

  async borrarMensajeEnviadoUsuario(uid, idx) { 
    if (!uid || idx === undefined) return; 
    try { 
      const docRef = firebaseServices.db.collection('mensajes').doc('admin_' + uid); 
      const doc = await docRef.get(); 
      if (doc.exists) { 
        const data = doc.data(); 
        let mensajes = Array.isArray(data.mensajes) ? data.mensajes : []; 
        if (idx >= 0 && idx < mensajes.length) { 
          mensajes.splice(idx, 1); 
          await docRef.set({ mensajes }); 
        } 
      } 
    } catch (error) { 
      console.error('Error deleting sent message:', error); 
      Utils.showToast('Error al eliminar mensaje enviado', 'error'); 
    } 
  },
  
  async marcarLeido(uid, index) { 
    if (!uid || index === undefined) return; 
    try { 
      const docRef = firebaseServices.db.collection('mensajes').doc(uid); 
      const doc = await docRef.get(); 
      if (doc.exists) { 
        const data = doc.data(); 
        let mensajes = Array.isArray(data.mensajes) ? data.mensajes : []; 
        if (mensajes[index]) { 
          mensajes[index].leido = true; 
          await docRef.update({ mensajes }); 
        } 
      } 
    } catch (error) { 
      console.error('Error marking mensaje as read:', error); 
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
      return calculoDoc.exists ? calculoDoc.data() : null; 
    } catch (error) { 
      console.error('Error getting ultimo calculo:', error); 
      return null; 
    } 
  },
  
  async setUltimoCalculo(uid, calculo) { 
    if (!uid || !calculo) return; 
    try { 
      const calculoId = firebaseServices.db.collection('_').doc().id; 
      await firebaseServices.db.collection('users').doc(uid).collection('calculos').doc(calculoId).set({ ...calculo, timestamp: firebaseServices.Timestamp.now() }); 
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
      const batch = firebaseServices.db.batch(); 
      const requestRef = firebaseServices.db.collection('friendRequests').doc(requestId); 
      batch.update(requestRef, { status: 'accepted' }); 
      const fromRef = firebaseServices.db.collection('users').doc(fromUid); 
      const toRef = firebaseServices.db.collection('users').doc(toUid); 
      batch.update(fromRef, { 
        friendIds: firebaseServices.FieldValue.arrayUnion(toUid), 
        friendsCount: firebaseServices.FieldValue.increment(1) 
      }); 
      batch.update(toRef, { 
        friendIds: firebaseServices.FieldValue.arrayUnion(fromUid), 
        friendsCount: firebaseServices.FieldValue.increment(1) 
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
      const batch = firebaseServices.db.batch(); 
      const userRef = firebaseServices.db.collection('users').doc(uid); 
      const friendRef = firebaseServices.db.collection('users').doc(friendUid); 
      batch.update(userRef, { 
        friendIds: firebaseServices.FieldValue.arrayRemove(friendUid), 
        friendsCount: firebaseServices.FieldValue.increment(-1) 
      }); 
      batch.update(friendRef, { 
        friendIds: firebaseServices.FieldValue.arrayRemove(uid), 
        friendsCount: firebaseServices.FieldValue.increment(-1) 
      }); 
      await batch.commit(); 
      return true; 
    } catch (error) { 
      console.error('Error removing friend:', error); 
      Utils.showToast('Error al eliminar amigo', 'error'); 
      return false; 
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
  async enviarMensajeSoporte(fromUid, toUid, texto) {
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
   * Marca un mensaje de soporte como leído (en la subcolección del usuario).
   */
  async marcarMensajeSoporteLeido(mensajeId, usuarioUid) {
    if (!mensajeId || !usuarioUid) return;
    try {
      // Buscar el mensaje en la subcolección del usuario
      const snapshot = await firebaseServices.db
        .collection('users')
        .doc(usuarioUid)
        .collection('mensajes')
        .where('id', '==', mensajeId)
        .get();
      
      const batch = firebaseServices.db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { leido: true });
      });
      await batch.commit();
      
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
   * Elimina un mensaje de la subcolección de un usuario.
   */
  async eliminarMensajeSoporteUsuario(usuarioUid, mensajeId) {
    if (!usuarioUid || !mensajeId) return false;
    try {
      await firebaseServices.db
        .collection('users')
        .doc(usuarioUid)
        .collection('mensajes')
        .doc(mensajeId)
        .delete();
      console.log(`🗑️ Mensaje ${mensajeId} eliminado de la subcolección de ${usuarioUid}`);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando mensaje de la subcolección:', error);
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
  },

  async contarSesionesHoy() {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    try {
      const snapshot = await firebaseServices.db.collection('globalFeed')
        .where('timestamp', '>=', firebaseServices.Timestamp.fromDate(hoy))
        .where('timestamp', '<', firebaseServices.Timestamp.fromDate(manana))
        .count().get();
      return snapshot.data().count;
    } catch (e) {
      console.warn('Fallback para contar sesiones de hoy:', e);
      const snapshot = await firebaseServices.db.collection('globalFeed')
        .where('timestamp', '>=', firebaseServices.Timestamp.fromDate(hoy))
        .where('timestamp', '<', firebaseServices.Timestamp.fromDate(manana)).get();
      return snapshot.size;
    }
  }
};

window.Storage = Storage;