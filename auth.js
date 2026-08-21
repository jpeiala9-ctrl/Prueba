// ==================== auth.js - VERSIÓN DEFINITIVA ====================
// Versión: 5.18 - Cierre automático de registro a partir de 500 usuarios
//                (límite del plan gratuito de Firebase): al pulsar "Crear
//                cuenta" se comprueba Storage.contarUsuarios() (cacheado
//                5 min) y, si se ha superado el límite, se muestra un
//                aviso con contacto de Instagram en vez del formulario.
//                Comprobación repetida en registerUser() como defensa en
//                profundidad.
// Versión: 5.17 - Carga completa antes de mostrar la app. Caché local para recarga instantánea.
// ====================

const Auth = {
  intentosLogin: 0,
  ultimoIntento: 0,

  _manejarErrorFirebase(error) {
    const errores = {
      'auth/invalid-email': '📧 El correo electrónico no es válido.',
      'auth/user-disabled': '🚫 Esta cuenta ha sido deshabilitada. Contacta con soporte.',
      'auth/user-not-found': '❌ No existe ninguna cuenta con este correo.',
      'auth/wrong-password': '🔑 Contraseña incorrecta. Inténtalo de nuevo.',
      'auth/email-already-in-use': '📧 Este correo ya está registrado. Inicia sesión o usa otro.',
      'auth/weak-password': '🔒 La contraseña debe tener al menos 6 caracteres.',
      'auth/network-request-failed': '🌐 Error de conexión. Comprueba tu internet.',
      'auth/too-many-requests': '⏳ Demasiados intentos. Espera un momento y vuelve a intentarlo.',
      'auth/requires-recent-login': '⚠️ Por seguridad, debes volver a iniciar sesión antes de eliminar la cuenta.',
      'permission-denied': '🔒 Error de permisos. Si persiste, contacta con soporte.'
    };
    return errores[error?.code] || '⚠️ Error al iniciar sesión. Revisa tus credenciales.';
  },

  // Límite máximo de usuarios registrados a partir del cual se cierra el
  // alta de nuevas cuentas (plan gratuito de Firebase). Por encima de este
  // número habría que pasar a un plan de pago.
  LIMITE_USUARIOS_REGISTRO: 500,

  // Caché en memoria del último recuento de usuarios, para no lanzar una
  // consulta a Firestore cada vez que alguien pulsa la pestaña "Crear
  // cuenta". Se refresca como mucho cada 5 minutos; de sobra para este
  // uso (el límite no cambia de un minuto a otro) y evita gasto de cuota
  // si varias personas entran a la vez a la pantalla de login.
  _cacheRecuentoUsuarios: { count: null, timestamp: 0 },
  CACHE_RECUENTO_MS: 5 * 60 * 1000,

  async _registroDisponible() {
    const ahora = Date.now();
    const cache = this._cacheRecuentoUsuarios;
    if (cache.count !== null && (ahora - cache.timestamp) < this.CACHE_RECUENTO_MS) {
      return cache.count < this.LIMITE_USUARIOS_REGISTRO;
    }
    try {
      const total = await Storage.contarUsuarios();
      this._cacheRecuentoUsuarios = { count: total, timestamp: ahora };
      return total < this.LIMITE_USUARIOS_REGISTRO;
    } catch (e) {
      console.warn('No se pudo comprobar el límite de registro, se permite por defecto:', e);
      // Si falla la comprobación (p. ej. sin conexión) no bloqueamos el
      // registro: es preferible dejar pasar alguna alta de más a dejar a
      // la gente sin poder registrarse por un fallo de red.
      return true;
    }
  },

  async switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
      document.querySelector('.auth-tab').classList.add('active');
      document.getElementById('loginForm').classList.add('active');
    } else {
      document.querySelectorAll('.auth-tab')[1].classList.add('active');
      // Muestra el formulario de registro al instante (evita esperar a la
      // consulta de red para reaccionar al toque) y, si al comprobar el
      // límite resulta que está superado, lo sustituye por el aviso.
      document.getElementById('registerForm').classList.add('active');
      const disponible = await this._registroDisponible();
      if (!disponible) {
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('registroCerradoBox').classList.add('active');
      }
    }
    document.getElementById('loginError')?.classList.remove('visible');
    document.getElementById('registerError')?.classList.remove('visible');
  },

  // Habilita el botón de REGISTRARSE solo cuando la casilla de protección
  // de datos está marcada. Es el complemento en el cliente de la
  // comprobación real (defensa en profundidad) que hace registerUser():
  // esto es solo para que el botón responda al instante al marcar/
  // desmarcar la casilla; la validación que de verdad bloquea el registro
  // vive en registerUser(), por si esta casilla se saltara de algún modo
  // (DevTools, autocompletado raro del navegador, etc.).
  actualizarBotonRegistro() {
    const checkbox = document.getElementById('regAceptaPrivacidad');
    const btn = document.getElementById('registerBtn');
    if (checkbox && btn) btn.disabled = !checkbox.checked;
  },

  mostrarPoliticaPrivacidad() {
    const modal = document.getElementById('modalPrivacidad');
    document.getElementById('modalPrivacidadOverlay').style.display = 'block';
    if (modal) { modal.style.display = 'block'; modal.scrollTop = 0; }
  },

  cerrarPoliticaPrivacidad() {
    const modal = document.getElementById('modalPrivacidad');
    if (modal) modal.scrollTop = 0;
    document.getElementById('modalPrivacidadOverlay').style.display = 'none';
    if (modal) modal.style.display = 'none';
  },

  _normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n");
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
      // El texto se genera a partir de userData.premium/userData.expires
      // (ya fusionados con extraData) y no de las variables locales
      // premium/expiry sueltas, por si alguna vez se crea una cuenta con
      // otros valores por defecto (p.ej. de forma manual desde el panel de
      // admin) -- así el mensaje siempre refleja el plan real que se le ha
      // dado al usuario, no el que se calculó al principio de la función.
      const fechaExpiraStr = userData.expires
        ? new Date(userData.expires).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;
      const textoPeriodoGratis = (userData.premium && fechaExpiraStr)
        ? ` Tienes acceso Premium gratuito activado hasta el ${fechaExpiraStr} — disfruta de todas las funciones sin restricciones durante este periodo.`
        : '';
      const mensajeBienvenida = {
        fecha: new Date().toLocaleString(),
        texto: `👋 ¡Bienvenido a RI5, ${username}! Este es tu espacio de soporte directo con el administrador (@joaquin). Aquí recibirás notificaciones importantes y puedes enviar tus consultas.${textoPeriodoGratis} ¡Disfruta de la app! 🏃`,
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
      return;
    }
    
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
        await this._cargarDatosYMostrarApp(user.uid, user.email, userData);
        Utils.showToast('✅ Correo verificado correctamente', 'success');
        if (window.UI) UI.startConsejoAutoChange();

      } else {
        Utils.showToast('❌ El correo aún no está verificado. Revisa tu bandeja de entrada.', 'warning');
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      Utils.showToast('Error al comprobar verificación', 'error');
    }
  },

  // Bloque compartido por _cargarDatosYMostrarApp() y la ruta de caché de
  // checkSavedSession(): revela mainContent y rellena el mensaje de
  // bienvenida + el campo #name. Antes este bloque estaba repetido letra
  // por letra en los dos sitios; ahora recibe userData como parámetro
  // explícito para que ambos sitios sigan pasando exactamente los mismos
  // datos que ya pasaban antes de extraerlo.
  _mostrarAppYBienvenida(userData) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("verificationPage").style.display = "none";
    const mainContent = document.getElementById("mainContent");
    mainContent.style.display = "flex";
    mainContent.style.visibility = "visible";
    mainContent.style.opacity = "1";
    mainContent.style.transition = "none";

    const welcomeEl = document.getElementById("userWelcome");
    if (welcomeEl) {
      const expiry = new Date(userData.expires);
      welcomeEl.innerText = `> BIENVENIDO, ${userData.username.toUpperCase()} · ${userData.premium ? 'PREMIUM' : 'ACCESO'} HASTA ${expiry.toLocaleDateString()}`;
    }
    const nameField = document.getElementById('name');
    if (nameField) nameField.value = userData.username;
  },

  // === CARGA COMPLETA ANTES DE MOSTRAR LA APP ===
  async _cargarDatosYMostrarApp(uid, email, userData) {
    console.log('⏳ Cargando datos esenciales para mostrar la app...');
    
    // 1. Guardar en AppState y en caché local
    await AppState.setCurrentUser(uid, email, userData);
    localStorage.setItem('ri5_user_data', JSON.stringify(userData));
    
    // 2. Cargar TODOS los datos necesarios de forma secuencial (con await)
    //    para asegurar que la UI tenga contenido antes de mostrarse.
    try {
      // Perfil
      if (!localStorage.getItem(`perfil_${uid}`)) {
        await Profile.cargarPerfil(true);
      } else {
        await Profile.cargarPerfil(false);
      }
    } catch (e) { console.warn('Error cargando perfil:', e); }

    try {
      // Gamificación
      const gamData = await Gamification.getData(uid);
      if (gamData) {
        sessionStorage.setItem(`gamification_${uid}`, JSON.stringify(gamData));
      }
    } catch (e) { console.warn('Error cargando gamificación:', e); }

    try {
      // Último cálculo
      const calc = await Storage.getUltimoCalculo(uid);
      if (calc) {
        AppState.setLastCalc(calc);
        localStorage.setItem('ri5_last_calculation', JSON.stringify(calc));
        if (window.Training) Training.mostrarResultadosGuardados(calc);
      }
    } catch (e) { console.warn('Error cargando último cálculo:', e); }

    try {
      // Mensajes de soporte
      await UI.cargarMensajesRecibidos();
      await UI.cargarMensajesEnviados();
    } catch (e) { console.warn('Error cargando mensajes:', e); }

    try {
      // Restaurar estado (pestañas, plan, etc.)
      await UI.restaurarEstado();
    } catch (e) { console.warn('Error restaurando estado:', e); }

    console.log('✅ Todos los datos esenciales cargados. Mostrando app...');

    // 3. AHORA sí, mostrar la app
    this._mostrarAppYBienvenida(AppState.currentUserData);

    if (window.UI) UI.actualizarBadgeMensajes();

    // 4. Dashboard: se carga DESPUÉS de que mainContent sea visible.
    //    Los gráficos Chart.js (km/semana, zonas usadas) se dibujan con el
    //    tamaño del contenedor en el momento de crearse; si se crean con el
    //    panel en display:none, el canvas queda a 0px y no se redibuja solo
    //    al hacerse visible, dejando la pestaña Inicio "en negro".
    try {
      if (typeof cargarDashboard === 'function') {
        await cargarDashboard();
      }
    } catch (e) { console.warn('Error cargando dashboard:', e); }

    Utils.hideLoading();

    // 5. Precarga en segundo plano (sin bloquear la app, ya visible) del
    //    modal "Carga y recuperación": calcula el TSS/ACWR del plan activo
    //    y lo deja listo en sessionStorage. Así, cuando el usuario toque
    //    esa tarjeta del dashboard, el modal se abre relleno al instante en
    //    vez de mostrar "Calculando…" durante uno o dos segundos. No se
    //    espera (no hay await) para no retrasar la aparición de la app.
    if (typeof window.precargarCargaPlan === 'function') {
      window.precargarCargaPlan().catch(e => console.warn('Error precargando carga del plan:', e));
    }
  },

  // === CARGA EN SEGUNDO PLANO (para recarga con caché) ===
  async _cargarDatosEnBackground(uid) {
    // No esperamos a que terminen, solo los lanzamos
    const promises = [];
    promises.push(Profile.cargarPerfil(false).catch(e => console.warn('Error cargando perfil en background:', e)));
    promises.push(Gamification.getData(uid).then(data => {
      if (data) sessionStorage.setItem(`gamification_${uid}`, JSON.stringify(data));
    }).catch(e => console.warn('Error cargando gamificación en background:', e)));
    promises.push(Storage.getUltimoCalculo(uid).then(calc => {
      if (calc) {
        AppState.setLastCalc(calc);
        localStorage.setItem('ri5_last_calculation', JSON.stringify(calc));
        if (window.Training) Training.mostrarResultadosGuardados(calc);
      }
    }).catch(e => console.warn('Error cargando último cálculo en background:', e)));
    promises.push(UI.cargarMensajesRecibidos().catch(e => console.warn('Error cargando mensajes en background:', e)));
    promises.push(UI.cargarMensajesEnviados().catch(e => console.warn('Error cargando mensajes enviados en background:', e)));
    promises.push(UI.restaurarEstado().catch(e => console.warn('Error restaurando estado en background:', e)));
    if (typeof cargarDashboard === 'function') {
      // Encadenado (no en paralelo) para que AppState.planActualId ya esté
      // fijado por cargarDashboard() cuando arranca la precarga del modal
      // de "Carga y recuperación" -- evita una consulta duplicada del plan
      // activo si ambas se lanzaran a la vez.
      promises.push(
        cargarDashboard()
          .catch(e => console.warn('Error cargando dashboard en background:', e))
          .then(() => {
            if (typeof window.precargarCargaPlan === 'function') {
              return window.precargarCargaPlan().catch(e => console.warn('Error precargando carga del plan en background:', e));
            }
          })
      );
    }
    await Promise.allSettled(promises);
    console.log('✅ Datos en segundo plano cargados');
  },

  async registerUser() {
    console.log('📝 Iniciando registro...');
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');
    const aceptaPrivacidad = document.getElementById('regAceptaPrivacidad');

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
    // Comprobación real de la casilla de protección de datos: aunque el
    // botón ya viene deshabilitado en el HTML hasta que se marca (ver
    // actualizarBotonRegistro), esta comprobación es la que de verdad
    // impide crear la cuenta si por lo que sea el botón se hubiera
    // podido pulsar sin marcarla.
    if (!aceptaPrivacidad || !aceptaPrivacidad.checked) {
      errorEl.innerText = "⚠️ Debes aceptar la protección de datos para registrarte.";
      errorEl.classList.add('visible');
      return;
    }
    // Defensa en profundidad: repite la comprobación del límite de
    // usuarios por si se alcanzó justo mientras esta persona tenía el
    // formulario abierto (switchAuthTab ya la comprobó al entrar, pero
    // pudo pasar tiempo desde entonces).
    if (!(await this._registroDisponible())) {
      document.getElementById('registerForm').classList.remove('active');
      document.getElementById('registroCerradoBox').classList.add('active');
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
      Utils.showToast('📧 Registro exitoso. Verifica tu correo para continuar (revisa también la carpeta de spam).', 'success', 6000);

    } catch (error) {
      console.error('❌ Error en registro:', error);
      const errorMsg = this._manejarErrorFirebase(error);
      errorEl.innerText = errorMsg;
      errorEl.classList.add('visible');
      document.getElementById('regPassword').value = '';
    } finally {
      // No reactivar el botón a ciegas: si la casilla de protección de
      // datos ya no está marcada (o nunca lo estuvo), debe seguir
      // deshabilitado igual que al cargar la página.
      btn.disabled = !(aceptaPrivacidad && aceptaPrivacidad.checked);
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
    btn.classList.add('pulse');

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
        btn.classList.remove('pulse');
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
        btn.classList.remove('pulse');
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
      
      const ahora2 = new Date();
      const mesActual = `${ahora2.getFullYear()}-${ahora2.getMonth() + 1}`;
      const updates = { lastLogin: firebaseServices.Timestamp.now() };
      if (userData.mesActual !== mesActual) {
        updates.calculosMes = 0;
        updates.mesActual = mesActual;
        userData.calculosMes = 0;
        userData.mesActual = mesActual;
      }
      await firebaseServices.db.collection('users').doc(user.uid).update(updates);

      await this._enablePersistence();

      // === AQUÍ ESTÁ LA CLAVE: esperamos a que los datos se carguen ===
      await this._cargarDatosYMostrarApp(user.uid, email, userData);

      this.intentosLogin = 0;
      btn.disabled = false;
      btn.textContent = '[ ACCEDER ]';
      btn.classList.remove('pulse');

      Utils.showToast(`✅ Bienvenido, ${AppState.currentUserData.username}`, 'success');
      console.log('✅ Login completado exitosamente');

    } catch (error) {
      console.error('❌ Error en login:', error);
      const errorMsg = this._manejarErrorFirebase(error);
      errorEl.innerText = errorMsg;
      errorEl.classList.add('visible');
      document.getElementById('loginPassword').value = '';
      btn.disabled = false;
      btn.textContent = '[ ACCEDER ]';
      btn.classList.remove('pulse');
      document.getElementById("loginPage").style.display = "flex";
      document.getElementById("mainContent").style.display = "none";
      Utils.hideLoading();
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
    }
  },

  async logoutUser() {
    const ok = await Utils.confirm('CERRAR SESIÓN', '> ¿CERRAR SESIÓN?_');
    if (!ok) return;

    try {
      await firebaseServices.auth.signOut();
      await AppState.setCurrentUser(null, null);
      AppState.limpiarDatosPlan();

      document.getElementById("mainContent").style.display = "none";
      document.getElementById("verificationPage").style.display = "none";
      document.getElementById("loginPage").style.display = "flex";
      document.getElementById("loginEmail").value = '';
      document.getElementById("loginPassword").value = '';
      document.getElementById("calendarioEntreno").style.display = "none";
      // NOTA: antes aquí se borraban las zonas calculadas (results.innerHTML,
      // AppState.clearLastCalc() y el localStorage de la última calculadora),
      // así que si volvías a entrar veías todo en blanco un instante aunque
      // ya las tuvieras calculadas. Ahora se dejan intactas: al volver a
      // entrar (con la misma cuenta) se restauran igual desde Firestore,
      // pero además no desaparecen de golpe al cerrar sesión.
      sessionStorage.removeItem('ri5_estado');
      localStorage.removeItem('ri5_current_user');
      localStorage.removeItem('ri5_user_email');
      localStorage.removeItem('ri5_is_admin');
      localStorage.removeItem('ri5_user_data');
      localStorage.removeItem('temp_username');

      Utils.showToast('✅ Sesión cerrada', 'success');
    } catch (error) {
      console.error('Error en logout:', error);
      Utils.showToast('Error al cerrar sesión', 'error');
    }
  },

  async checkSavedSession() {
    const uid = localStorage.getItem('ri5_current_user');
    if (!uid) {
      document.getElementById("loginPage").style.display = "flex";
      document.getElementById("mainContent").style.display = "none";
      Utils.hideLoading();
      return false;
    }

    if (AppState.currentUserId === uid) {
      console.log('ℹ️ Sesión ya restaurada, omitiendo checkSavedSession');
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("mainContent").style.display = "flex";
      Utils.hideLoading();
      return true;
    }

    try {
      console.log('🔍 Verificando sesión guardada:', uid);

      // 1. INTENTAR CON CACHÉ LOCAL (más rápido)
      const cachedUserData = localStorage.getItem('ri5_user_data');
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          await AppState.setCurrentUser(uid, userData.email, userData);
          
          // Mostrar app inmediatamente con datos en caché
          this._mostrarAppYBienvenida(userData);
          
          // Cargar/refrescar datos (perfil, gamificación, dashboard...).
          // OJO: aunque mainContent ya está en display:flex aquí arriba, el
          // <body> sigue con la clase 'ri5-booting' -- el CSS crítico del
          // splash (ver <head> de index.html) oculta con display:none TODO
          // lo que no sea el splash mientras esa clase siga puesta. Así que
          // aunque a partir de aquí SÍ esperamos (await) a que termine esta
          // carga, el usuario no ve nada de eso: sigue mirando el splash.
          // Antes esto se lanzaba sin esperar y se llamaba a hideLoading()
          // justo después, así que el splash se quitaba ya, y el usuario
          // veía el dashboard rellenarse de datos delante de sus ojos
          // (nombre, foto, km de la semana...) aunque fuera rápido. Ahora
          // el dashboard llega siempre ya completo la primera vez que se ve.
          await this._cargarDatosEnBackground(uid);
          
          console.log('✅ Sesión restaurada desde caché local (dashboard completo)');
          Utils.hideLoading();
          return true;
        } catch (e) {
          console.warn('Caché de usuario corrupto, recargando desde Firestore', e);
        }
      }

      // 2. SIN CACHÉ O CORRUPTO: cargar desde Firestore y esperar
      if (!navigator.onLine) {
        console.log('⚠️ Sin conexión, no se puede verificar sesión.');
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
        Utils.hideLoading();
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
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
        Utils.hideLoading();
        return false;
      }

      if (user.uid !== uid) {
        console.log('❌ UID no coincide con Auth');
        localStorage.removeItem('ri5_current_user');
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("mainContent").style.display = "none";
        Utils.hideLoading();
        return false;
      }

      console.log('👤 Usuario encontrado, emailVerified =', user.emailVerified);
      if (!user.emailVerified) {
        console.warn('⛔ Sesión restaurada pero email NO verificado. Mostrando pantalla de verificación.');
        this.showVerificationScreen(user.email);
        Utils.hideLoading();
        return false;
      }

      const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        console.log('❌ Usuario no encontrado en Firestore');
        await firebaseServices.auth.signOut();
        localStorage.removeItem('ri5_current_user');
        document.getElementById("verificationPage").style.display = "none";
        document.getElementById("loginPage").style.display = "flex";
        Utils.hideLoading();
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

      localStorage.setItem('ri5_user_data', JSON.stringify(userData));

      console.log('✅ Sesión válida para:', userData.username);

      // === CARGAR DATOS Y MOSTRAR APP (esperando a que terminen) ===
      await this._cargarDatosYMostrarApp(uid, userData.email, userData);

      await this._enablePersistence();

      try {
        await firebaseServices.db.collection('users').doc(uid).update({
          lastLogin: firebaseServices.Timestamp.now()
        });
      } catch (e) {
        console.warn('Error actualizando lastLogin:', e);
      }

      Utils.hideLoading();
      return true;

    } catch (error) {
      console.error('Error en checkSavedSession:', error);
      localStorage.removeItem('ri5_current_user');
      localStorage.removeItem('ri5_user_data');
      document.getElementById("loginPage").style.display = "flex";
      document.getElementById("mainContent").style.display = "none";
      Utils.hideLoading();
      return false;
    }
  },

  showPremiumBenefits() {
    document.getElementById('premiumOverlay').classList.add('active');
    const modal = document.getElementById('premiumModal');
    modal.classList.add('active');
    // El contenido real con scroll propio es .modal-scroll-body (ver CSS
    // "#premiumModal .modal-scroll-body"), no el modal en sí -- sin este
    // reset, reabrir el modal (p.ej. un usuario gratis pulsando varios
    // días del calendario seguidos) lo dejaba en el punto de scroll de la
    // vez anterior en vez de empezar arriba.
    const scrollBody = modal.querySelector('.modal-scroll-body');
    if (scrollBody) scrollBody.scrollTop = 0;
  }
};

// === MANEJO DE SESIÓN AL RECARGAR ===
firebaseServices.auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log('👤 onAuthStateChanged: usuario autenticado, emailVerified =', user.emailVerified);
    
    if (user.emailVerified) {
      const uid = user.uid;
      const savedUid = localStorage.getItem('ri5_current_user');
      
      if (AppState.currentUserId === uid) {
        console.log('ℹ️ Usuario ya restaurado, omitiendo onAuthStateChanged');
        return;
      }
      
      if (savedUid === uid || !savedUid) {
        console.log('🔄 Restaurando sesión automáticamente desde onAuthStateChanged...');
        
        try {
          const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            await Auth._cargarDatosYMostrarApp(uid, user.email, userData);
          } else {
            Auth.showVerificationScreen(user.email);
          }
        } catch (error) {
          console.error('Error restaurando sesión:', error);
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
    } else if (document.getElementById("verificationPage").style.display !== "flex") {
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

  // Sincroniza el botón de REGISTRARSE con el estado real de la casilla
  // al cargar la página (por si el navegador recuerda el checkbox marcado
  // de un formulario anterior, autocompletado, etc.).
  Auth.actualizarBotonRegistro();
});

window.switchAuthTab = Auth.switchAuthTab.bind(Auth);
window.actualizarBotonRegistro = Auth.actualizarBotonRegistro.bind(Auth);
window.mostrarPoliticaPrivacidad = Auth.mostrarPoliticaPrivacidad.bind(Auth);
window.cerrarPoliticaPrivacidad = Auth.cerrarPoliticaPrivacidad.bind(Auth);
window.registerUser = Auth.registerUser.bind(Auth);
window.loginUser = Auth.loginUser.bind(Auth);
window.logoutUser = Auth.logoutUser.bind(Auth);
window.showPremiumBenefits = Auth.showPremiumBenefits;
window.eliminarMiCuenta = Auth.eliminarMiCuenta.bind(Auth);
window.verificarAhora = Auth.verificarAhora.bind(Auth);
window.reenviarVerificacion = Auth.reenviarVerificacion.bind(Auth);