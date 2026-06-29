// ==================== auth.js - VERIFICACIÓN OBLIGATORIA (SESIÓN PERSISTENTE) ====================
// Versión: 5.7 - Restauración del plan tras login
// ====================

const Auth = {
  intentosLogin: 0,
  ultimoIntento: 0,

  _manejarErrorFirebase(error) {
    switch (error?.code) {
      case 'auth/invalid-email':
        return '📧 El correo electrónico no es válido.';
      case 'auth/user-disabled':
        return '🚫 Esta cuenta ha sido deshabilitada. Contacta con soporte.';
      case 'auth/user-not-found':
        return '❌ No existe ninguna cuenta con este correo.';
      case 'auth/wrong-password':
        return '🔑 Contraseña incorrecta. Inténtalo de nuevo.';
      case 'auth/email-already-in-use':
        return '📧 Este correo ya está registrado. Inicia sesión o usa otro.';
      case 'auth/weak-password':
        return '🔒 La contraseña debe tener al menos 6 caracteres.';
      case 'auth/network-request-failed':
        return '🌐 Error de conexión. Comprueba tu internet.';
      case 'auth/too-many-requests':
        return '⏳ Demasiados intentos. Espera un momento y vuelve a intentarlo.';
      case 'auth/requires-recent-login':
        return '⚠️ Por seguridad, debes volver a iniciar sesión antes de eliminar la cuenta.';
      case 'permission-denied':
        return '🔒 Error de permisos. Si persiste, contacta con soporte.';
      default:
        return '⚠️ Error al iniciar sesión. Revisa tus credenciales.';
    }
  },

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
      document.querySelector('.auth-tab').classList.add('active');
      document.getElementById('loginForm').classList.add('active');
    } else {
      document.querySelectorAll('.auth-tab')[1].classList.add('active');
      document.getElementById('registerForm').classList.add('active');
    }

    document.getElementById('loginError')?.classList.remove('visible');
    document.getElementById('registerError')?.classList.remove('visible');
  },

  _normalizeString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n");
  },

  async createUserDocument(userId, email, username, extraData = {}) {
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    const mesActual = `${now.getFullYear()}-${now.getMonth() + 1}`;

    const userData = {
      username,
      username_lowercase: this._normalizeString(username),
      email,
      created: now.toISOString(),
      expires: expiry.toISOString(),
      premium: true,
      isAdmin: false,
      emailVerified: true,
      calculosMes: 0,
      mesActual,
      uid: userId,
      lastLogin: firebaseServices.Timestamp.now(),
      profile: {
        bio: '',
        city: '',
        age: null,
        gender: '',
        weight: null,
        height: null,
        privacySettings: { showTrainings: 'friends', showProfile: 'public' }
      },
      friendIds: [],
      friendsCount: 0,
      ...extraData
    };

    console.log('📝 Creando documento de usuario en Firestore...');
    await firebaseServices.db.collection('users').doc(userId).set(userData);
    console.log('✅ Documento de usuario creado');

    const mensajesRef = firebaseServices.db.collection('mensajes').doc(userId);
    const mensajesDoc = await mensajesRef.get();
    if (!mensajesDoc.exists) {
      const mensajeBienvenida = {
        fecha: new Date().toLocaleString(),
        texto: "👋 ¡Bienvenido a RI5! Este es tu espacio de soporte directo con el administrador (@coachjoaquinpeinado). Aquí recibirás notificaciones importantes y puedes enviar tus consultas. ¡Disfruta de la app! 🏃",
        leido: false,
        esAdmin: true,
        timestamp: firebaseServices.Timestamp.now()
      };
      await mensajesRef.set({ mensajes: [mensajeBienvenida] });
      console.log('✅ Mensaje de bienvenida creado');
    }

    try {
      const gamificationDefault = {
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        totalDistance: 0,
        totalSessions: 0,
        lastSessionDate: null,
        lastUpdate: firebaseServices.Timestamp.now()
      };
      await firebaseServices.db.collection('gamification').doc(userId).set(gamificationDefault);
      console.log('✅ Documento de gamificación creado');
    } catch (e) {
      console.warn('Error creando documento de gamificación:', e);
    }

    return userData;
  },

  showVerificationScreen(email) {
    console.log('🛑 Mostrando pantalla de verificación para:', email);
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("verificationPage").style.display = "flex";
    const emailDisplay = document.getElementById("verificationEmailDisplay");
    if (emailDisplay) emailDisplay.textContent = email;
    Utils.hideLoading();
  },

  async reenviarVerificacion() {
    const user = firebaseServices.auth.currentUser;
    if (!user) {
      Utils.showToast('No hay sesión activa', 'error');
      return;
    }
    try {
      await user.sendEmailVerification();
      Utils.showToast('📧 Correo de verificación reenviado. Revisa tu bandeja de entrada (y spam).', 'success');
    } catch (error) {
      console.error('Error reenviando verificación:', error);
      Utils.handleFirebaseError(error);
    }
  },

  async verificarAhora() {
    const user = firebaseServices.auth.currentUser;
    if (!user) {
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("loginPage").style.display = "flex";
      Utils.hideLoading();
      return;
    }
    
    Utils.showLoading();
    try {
      await user.reload();
      console.log('🔄 Usuario recargado, emailVerified =', user.emailVerified);
      
      if (user.emailVerified) {
        let userDoc = await firebaseServices.db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
          const username = localStorage.getItem('temp_username') || user.email.split('@')[0];
          
          const usernameDoc = await firebaseServices.db.collection('usernames').doc(username).get();
          let finalUsername = username;
          if (usernameDoc.exists) {
            finalUsername = username + '_' + Math.random().toString(36).substr(2, 5);
          }
          
          await firebaseServices.db.collection('usernames').doc(finalUsername).set({
            uid: user.uid,
            createdAt: firebaseServices.Timestamp.now()
          });
          
          await this.createUserDocument(user.uid, user.email, finalUsername);
          localStorage.removeItem('temp_username');
          
          userDoc = await firebaseServices.db.collection('users').doc(user.uid).get();
        } else {
          await firebaseServices.db.collection('users').doc(user.uid).update({ emailVerified: true });
          userDoc = await firebaseServices.db.collection('users').doc(user.uid).get();
        }
        
        const userData = userDoc.data();
        await AppState.setCurrentUser(user.uid, user.email, userData);
        
        document.getElementById("verificationPage").style.display = "none";
        document.getElementById("mainContent").style.display = "flex";
        
        const welcomeEl = document.getElementById("userWelcome");
        if (welcomeEl) {
          welcomeEl.innerText = `> BIENVENIDO, ${userData.username.toUpperCase()} · ${userData.premium ? 'PREMIUM' : 'ACCESO'} HASTA ${new Date(userData.expires).toLocaleDateString()}`;
        }
        
        if (document.getElementById('perfilContainer')) {
          console.log('🔄 Actualizando perfil...');
          await Profile.cargarPerfil();
        }
        
        Utils.showToast('✅ Correo verificado correctamente', 'success');
        if (window.UI) UI.startConsejoAutoChange();
        // Restaurar el plan guardado
        if (window.UI) UI.restaurarEstado();
      } else {
        Utils.showToast('❌ El correo aún no está verificado. Revisa tu bandeja de entrada.', 'warning');
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      Utils.showToast('Error al comprobar verificación', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async registerUser() {
    console.log('📝 Iniciando registro...');
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');

    errorEl.classList.remove('visible');
    errorEl.innerText = '';

    if (!username || !email || !password) {
      errorEl.innerText = "⚠️ Completa todos los campos.";
      errorEl.classList.add('visible');
      return;
    }
    if (username.length < 3) {
      errorEl.innerText = "⚠️ El nombre de usuario debe tener al menos 3 caracteres.";
      errorEl.classList.add('visible');
      return;
    }
    if (password.length < 6) {
      errorEl.innerText = "⚠️ La contraseña debe tener al menos 6 caracteres.";
      errorEl.classList.add('visible');
      return;
    }
    if (!Utils.isValidEmail(email)) {
      errorEl.innerText = "⚠️ El correo electrónico no es válido.";
      errorEl.classList.add('visible');
      return;
    }
    
    if (!/^[\p{L}\p{N}_]+$/u.test(username)) {
      errorEl.innerText = "⚠️ Solo se permiten letras (incluyendo Ñ, acentos), números y guión bajo en el usuario.";
      errorEl.classList.add('visible');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'REGISTRANDO...';

    try {
      const usernameDoc = await firebaseServices.db.collection('usernames').doc(username).get();
      if (usernameDoc.exists) {
        errorEl.innerText = "⚠️ El nombre de usuario ya está en uso. Elige otro.";
        errorEl.classList.add('visible');
        btn.disabled = false;
        btn.textContent = '[ REGISTRARSE ]';
        return;
      }

      const methods = await firebaseServices.auth.fetchSignInMethodsForEmail(email);
      if (methods.length > 0) {
        errorEl.innerText = "⚠️ El correo ya está registrado. Inicia sesión.";
        errorEl.classList.add('visible');
        btn.disabled = false;
        btn.textContent = '[ REGISTRARSE ]';
        return;
      }

      const userCredential = await firebaseServices.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('✅ Usuario creado en Auth, emailVerified =', user.emailVerified);

      await user.sendEmailVerification();
      console.log('📧 Correo de verificación enviado');

      localStorage.setItem('temp_username', username);
      
      this.showVerificationScreen(email);
      
      Utils.showToast('📧 Registro exitoso. Verifica tu correo para continuar.', 'success', 5000);

    } catch (error) {
      console.error('❌ Error en registro:', error);
      const errorMsg = this._manejarErrorFirebase(error);
      errorEl.innerText = errorMsg;
      errorEl.classList.add('visible');
      document.getElementById('regPassword').value = '';
      Utils.hideLoading();
    } finally {
      btn.disabled = false;
      btn.textContent = '[ REGISTRARSE ]';
    }
  },

  async loginUser() {
    console.log('🔐 Iniciando login...');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errorEl.classList.remove('visible');
    errorEl.innerText = '';

    if (!email || !password) {
      errorEl.innerText = "⚠️ Introduce correo y contraseña.";
      errorEl.classList.add('visible');
      return;
    }

    if (!Utils.isValidEmail(email)) {
      errorEl.innerText = "⚠️ El correo electrónico no es válido.";
      errorEl.classList.add('visible');
      return;
    }

    const ahora = Date.now();
    if (ahora - this.ultimoIntento < 2000) {
      errorEl.innerText = "⏳ Espera 2 segundos antes de reintentar.";
      errorEl.classList.add('visible');
      return;
    }

    this.intentosLogin++;
    this.ultimoIntento = ahora;

    if (this.intentosLogin > 5) {
      errorEl.innerText = "⏳ Demasiados intentos. Espera 1 minuto.";
      errorEl.classList.add('visible');
      setTimeout(() => { this.intentosLogin = 0; }, 60000);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'ACCEDIENDO...';

    try {
      const userCredential = await firebaseServices.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('🔑 Usuario autenticado, emailVerified =', user.emailVerified);

      if (!user.emailVerified) {
        console.warn('⛔ Acceso denegado: email no verificado');
        this.showVerificationScreen(user.email);
        Utils.showToast('⚠️ Debes verificar tu correo antes de continuar', 'warning');
        btn.disabled = false;
        btn.textContent = '[ ACCEDER ]';
        return;
      }

      console.log('✅ Email verificado, continuando con login...');

      const userDoc = await firebaseServices.db.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        console.log('⚠️ Usuario verificado sin documento en Firestore, forzando verificación...');
        await user.sendEmailVerification();
        this.showVerificationScreen(user.email);
        Utils.showToast('⚠️ Completa la verificación de tu cuenta', 'warning');
        btn.disabled = false;
        btn.textContent = '[ ACCEDER ]';
        return;
      }

      const userData = userDoc.data();
      
      let isPremiumValid = userData.premium === true;
      if (isPremiumValid && userData.expires) {
        const expiryDate = new Date(userData.expires);
        const ahora = new Date();
        if (expiryDate <= ahora) {
          console.log('Premium expirado durante login, actualizando...');
          await firebaseServices.db.collection('users').doc(user.uid).update({
            premium: false
          }).catch(e => console.warn('Error actualizando premium expirado:', e));
          userData.premium = false;
        }
      }
      
      await AppState.setCurrentUser(user.uid, email, userData);

      const ahora2 = new Date();
      const mesActual = `${ahora2.getFullYear()}-${ahora2.getMonth() + 1}`;
      const updates = { lastLogin: firebaseServices.Timestamp.now() };
      if (AppState.currentUserData.mesActual !== mesActual) {
        updates.calculosMes = 0;
        updates.mesActual = mesActual;
        AppState.currentUserData.calculosMes = 0;
        AppState.currentUserData.mesActual = mesActual;
      }
      await firebaseServices.db.collection('users').doc(user.uid).update(updates);

      await this._enablePersistence();

      const msgs = await Storage.getMensajesUsuario(user.uid);
      AppState.mensajesNoLeidos = msgs.filter(m => !m.leido && m.esAdmin).length;
      if (window.UI) UI.actualizarBadgeMensajes();

      Utils.showToast(`✅ Bienvenido, ${AppState.currentUserData.username}`, 'success');

      this.intentosLogin = 0;

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("mainContent").style.display = "flex";

      const welcomeEl = document.getElementById("userWelcome");
      if (welcomeEl) {
        const expiry = new Date(AppState.currentUserData.expires);
        welcomeEl.innerText = `> BIENVENIDO, ${AppState.currentUserData.username.toUpperCase()} · ${AppState.currentUserData.premium ? 'PREMIUM' : 'ACCESO'} HASTA ${expiry.toLocaleDateString()}`;
      }

      const nameField = document.getElementById('name');
      if (nameField) nameField.value = AppState.currentUserData.username;

      if (window.UI) {
        UI.changeDailyTip();
        UI.startConsejoAutoChange();
        await UI.cargarMensajesRecibidos();
        await UI.cargarMensajesEnviados();
      }

      const calc = await Storage.getUltimoCalculo(user.uid);
      if (calc) {
        AppState.setLastCalc(calc);
        if (window.UI) UI.mostrarResultadosGuardados(calc);
      }
      
      // Restaurar el plan guardado para este usuario
      if (window.UI) UI.restaurarEstado();

      console.log('✅ Login completado exitosamente');

    } catch (error) {
      console.error('❌ Error en login:', error);
      const errorMsg = this._manejarErrorFirebase(error);
      errorEl.innerText = errorMsg;
      errorEl.classList.add('visible');
      document.getElementById('loginPassword').value = '';
      Utils.hideLoading();
    } finally {
      btn.disabled = false;
      btn.textContent = '[ ACCEDER ]';
    }
  },

  async _enablePersistence() {
    try {
      await firebaseServices.db.enablePersistence({ synchronizeTabs: true });
      console.log('✅ Persistencia offline habilitada');
    } catch (err) {
      console.warn('⚠️ Persistencia no disponible:', err);
    }
  },

  async eliminarMiCuenta() {
    const currentUser = firebaseServices.auth.currentUser;
    if (!currentUser) {
      Utils.showToast('❌ No hay sesión activa.', 'error');
      return;
    }

    const email = currentUser.email;
    const uid = currentUser.uid;

    let username = 'Usuario';
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
      if (userDoc.exists) username = userDoc.data().username || 'Usuario';
    } catch (e) {
      console.warn('No se pudo obtener el username', e);
    }

    const confirmed = await Utils.confirm(
      'SOLICITAR ELIMINACIÓN DE CUENTA',
      `¿SOLICITAR la eliminación de la cuenta "${email}"?\n\nSe enviará una notificación al administrador y se cerrará tu sesión.\n\nEl administrador procesará tu solicitud manualmente.`
    );
    if (!confirmed) return;

    Utils.showLoading();

    try {
      const adminMsgRef = firebaseServices.db.collection('mensajes').doc('admin_solicitudes');
      const newMessage = {
        fecha: new Date().toLocaleString(),
        texto: `📢 SOLICITUD DE ELIMINACIÓN DE CUENTA\nUsuario: ${username}\nEmail: ${email}\nUID: ${uid}\n\nEl usuario solicita la eliminación de su cuenta.`,
        leido: false,
        esUsuario: true,
        timestamp: firebaseServices.Timestamp.now()
      };
      await adminMsgRef.set({
        mensajes: firebaseServices.FieldValue.arrayUnion(newMessage)
      }, { merge: true });

      await firebaseServices.auth.signOut();
      await AppState.setCurrentUser(null, null);
      AppState.limpiarDatosPlan();

      document.getElementById("mainContent").style.display = "none";
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("loginPage").style.display = "flex";

      Utils.showToast('✅ Solicitud enviada al administrador. Tu sesión se ha cerrado.', 'success');
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      Utils.showToast(`❌ No se pudo enviar la solicitud. Error: ${error.message}`, 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async logoutUser() {
    const ok = await Utils.confirm('CERRAR SESIÓN', '> ¿CERRAR SESIÓN?_');
    if (!ok) return;

    Utils.showLoading();

    try {
      await firebaseServices.auth.signOut();
      await AppState.setCurrentUser(null, null);
      AppState.limpiarDatosPlan();

      document.getElementById("mainContent").style.display = "none";
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("loginPage").style.display = "flex";
      document.getElementById("loginEmail").value = '';
      document.getElementById("loginPassword").value = '';
      document.getElementById("results").innerHTML = '';
      document.getElementById("calendarioEntreno").style.display = "none";
      AppState.clearLastCalc();
      sessionStorage.removeItem('ri5_estado');
      // No borramos el localStorage del plan específico del usuario para que pueda restaurarse al volver
      // Solo borramos las claves generales de sesión
      localStorage.removeItem('ri5_current_user');
      localStorage.removeItem('ri5_user_email');
      localStorage.removeItem('ri5_is_admin');
      localStorage.removeItem('ri5_user_data');
      localStorage.removeItem('temp_username');
      localStorage.removeItem('ri5_last_calculation');

      Utils.showToast('✅ Sesión cerrada', 'success');
    } catch (error) {
      console.error('Error en logout:', error);
      Utils.showToast('Error al cerrar sesión', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async checkSavedSession() {
    const uid = localStorage.getItem('ri5_current_user');
    if (!uid) {
      Utils.hideLoading();
      return false;
    }

    try {
      console.log('🔍 Verificando sesión guardada:', uid);

      if (!navigator.onLine) {
        console.log('⚠️ Sin conexión, no se puede verificar sesión.');
        localStorage.removeItem('ri5_current_user');
        Utils.hideLoading();
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
        return false;
      }

      let user = firebaseServices.auth.currentUser;
      if (!user) {
        console.log('⏳ Esperando inicialización de Firebase Auth...');
        user = await new Promise((resolve) => {
          const unsubscribe = firebaseServices.auth.onAuthStateChanged((u) => {
            unsubscribe();
            resolve(u);
          });
          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 2000);
        });
      }

      if (!user) {
        console.log('❌ No hay usuario en Auth después de esperar');
        localStorage.removeItem('ri5_current_user');
        Utils.hideLoading();
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
        return false;
      }

      if (user.uid !== uid) {
        console.log('❌ UID no coincide con Auth');
        localStorage.removeItem('ri5_current_user');
        Utils.hideLoading();
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
        return false;
      }

      console.log('👤 Usuario encontrado, emailVerified =', user.emailVerified);
      if (!user.emailVerified) {
        console.warn('⛔ Sesión restaurada pero email NO verificado. Mostrando pantalla de verificación.');
        this.showVerificationScreen(user.email);
        return false;
      }

      const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        console.log('❌ Usuario no encontrado en Firestore');
        await firebaseServices.auth.signOut();
        localStorage.removeItem('ri5_current_user');
        Utils.hideLoading();
        document.getElementById("verificationPage").style.display = "none";
        document.getElementById("loginPage").style.display = "flex";
        return false;
      }

      const userData = userDoc.data();

      const now = new Date();
      const expiry = new Date(userData.expires);
      let isPremiumValid = userData.premium === true;

      if (isPremiumValid && expiry <= now) {
        console.log('⚠️ Premium expirado durante verificación de sesión');
        await firebaseServices.db.collection('users').doc(uid).update({
          premium: false
        }).catch(e => console.warn('Error actualizando premium expirado:', e));
        userData.premium = false;
        isPremiumValid = false;
      }

      localStorage.setItem('ri5_user_email', userData.email || '');
      if (userData.isAdmin) {
        localStorage.setItem('ri5_is_admin', 'true');
      } else {
        localStorage.removeItem('ri5_is_admin');
      }

      console.log('✅ Sesión válida para:', userData.username);

      await AppState.setCurrentUser(uid, userData.email, userData);

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("mainContent").style.display = "flex";

      const welcomeEl = document.getElementById("userWelcome");
      if (welcomeEl) {
        welcomeEl.innerText = `> BIENVENIDO, ${userData.username.toUpperCase()} · ${userData.premium ? 'PREMIUM' : 'ACCESO'} HASTA ${expiry.toLocaleDateString()}`;
      }

      const nameField = document.getElementById('name');
      if (nameField) nameField.value = userData.username;

      if (window.UI) {
        UI.changeDailyTip();
        UI.startConsejoAutoChange();
      }

      AppState.actualizarInterfazPremium();

      const calc = await Storage.getUltimoCalculo(uid);
      if (calc) {
        AppState.setLastCalc(calc);
        if (window.UI) UI.mostrarResultadosGuardados(calc);
      }

      await this._enablePersistence();

      try {
        await firebaseServices.db.collection('users').doc(uid).update({
          lastLogin: firebaseServices.Timestamp.now()
        });
      } catch (e) {
        console.warn('Error actualizando lastLogin:', e);
      }

      // Restaurar el plan guardado
      if (window.UI) UI.restaurarEstado();

      Utils.hideLoading();
      return true;

    } catch (error) {
      console.error('Error en checkSavedSession:', error);
      localStorage.removeItem('ri5_current_user');
      localStorage.removeItem('ri5_user_data');
      Utils.hideLoading();
      document.getElementById("loginPage").style.display = "flex";
      document.getElementById("mainContent").style.display = "none";
      return false;
    }
  },

  showPremiumBenefits() {
    document.getElementById('premiumOverlay').classList.add('active');
    document.getElementById('premiumModal').classList.add('active');
  }
};

firebaseServices.auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log('👤 onAuthStateChanged: usuario autenticado, emailVerified =', user.emailVerified);
    
    if (user.emailVerified) {
      const uid = user.uid;
      const savedUid = localStorage.getItem('ri5_current_user');
      
      if (savedUid === uid || document.getElementById("mainContent").style.display !== "flex") {
        console.log('🔄 Restaurando sesión automáticamente desde onAuthStateChanged...');
        
        const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          await AppState.setCurrentUser(uid, user.email, userData);
          
          document.getElementById("loginPage").style.display = "none";
          document.getElementById("verificationPage").style.display = "none";
          document.getElementById("mainContent").style.display = "flex";
          
          const welcomeEl = document.getElementById("userWelcome");
          if (welcomeEl) {
            welcomeEl.innerText = `> BIENVENIDO, ${userData.username.toUpperCase()} · ${userData.premium ? 'PREMIUM' : 'ACCESO'} HASTA ${new Date(userData.expires).toLocaleDateString()}`;
          }
          
          if (window.UI) UI.startConsejoAutoChange();
          // Restaurar el plan
          if (window.UI) UI.restaurarEstado();
          Utils.hideLoading();
        } else {
          Auth.showVerificationScreen(user.email);
        }
      }
    } else {
      const verificationPage = document.getElementById("verificationPage");
      if (verificationPage && verificationPage.style.display !== "flex") {
        Auth.showVerificationScreen(user.email);
      }
    }
  } else {
    if (document.getElementById("mainContent").style.display === "flex") {
      document.getElementById("mainContent").style.display = "none";
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("loginPage").style.display = "flex";
    }
    Utils.hideLoading();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  if (loginEmail) loginEmail.addEventListener('input', () => document.getElementById('loginError')?.classList.remove('visible'));
  if (loginPassword) loginPassword.addEventListener('input', () => document.getElementById('loginError')?.classList.remove('visible'));
  
  const regUsername = document.getElementById('regUsername');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  if (regUsername) regUsername.addEventListener('input', () => document.getElementById('registerError')?.classList.remove('visible'));
  if (regEmail) regEmail.addEventListener('input', () => document.getElementById('registerError')?.classList.remove('visible'));
  if (regPassword) regPassword.addEventListener('input', () => document.getElementById('registerError')?.classList.remove('visible'));
});

window.switchAuthTab = Auth.switchAuthTab.bind(Auth);
window.registerUser = Auth.registerUser.bind(Auth);
window.loginUser = Auth.loginUser.bind(Auth);
window.logoutUser = Auth.logoutUser.bind(Auth);
window.showPremiumBenefits = Auth.showPremiumBenefits;
window.eliminarMiCuenta = Auth.eliminarMiCuenta.bind(Auth);
window.verificarAhora = Auth.verificarAhora.bind(Auth);
window.reenviarVerificacion = Auth.reenviarVerificacion.bind(Auth);