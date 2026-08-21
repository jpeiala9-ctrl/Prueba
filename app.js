// ==================== app.js - VERSIÓN COMPLETA CON CACHÉ PARA RECARGA RÁPIDA ====================
// VERSIÓN: 4.41 - Añadida caché de userData en localStorage para recarga instantánea
// ====================

// ==================== CONFIGURACIÓN INICIAL ====================
if(!localStorage.getItem('ri5_initialized')) {
  const keysToRemove = [];
  for(let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if(key && (key.startsWith('ri5_') || key.startsWith('historial_') || key.startsWith('ultimoCalculo_') || key.startsWith('ultimoPlan_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.setItem('ri5_initialized', 'true');
}

// ==================== UTILS ====================
const Utils = {
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Sustituye una <img> de avatar que no ha cargado (foto de perfil
  // antigua/caducada, p. ej. tras cambiar la foto: entradas viejas del
  // muro, historial o chat guardan la URL de aquel momento y puede dejar
  // de servir la imagen) por un placeholder 👤, en vez de dejar el icono
  // de foto rota del navegador.
  avatarFallback(imgEl) {
    if (!imgEl || !imgEl.parentNode) return;
    const placeholder = document.createElement('div');
    placeholder.className = imgEl.className;
    const h = imgEl.offsetHeight || parseInt(imgEl.style.height) || 40;
    placeholder.style.cssText = imgEl.style.cssText +
      ';display:flex;align-items:center;justify-content:center;' +
      'background:var(--bg-secondary);font-size:' + Math.round(h * 0.5) + 'px;';
    placeholder.textContent = '👤';
    imgEl.replaceWith(placeholder);
  },

  // Engancha un "toque" de forma fiable en un elemento, sin depender solo
  // del evento 'click'. Se usa para los mini-mapas de Leaflet: en móvil,
  // cuando hay un mapa (aunque esté con drag/zoom desactivados) de por
  // medio, el 'click' nativo a veces no llega a la primera pulsación y
  // hace falta tocar dos veces. Con touchend (comprobando que no ha habido
  // arrastre) se evita depender de esa reconstrucción del click.
  bindTap(el, callback) {
    if (!el) return;
    let startX = 0, startY = 0, moved = false, touchFired = false;
    el.addEventListener('touchstart', (e) => {
      moved = false;
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 10 || dy > 10) moved = true;
      }
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (!moved) {
        touchFired = true;
        e.preventDefault();
        e.stopPropagation();
        callback(e);
        setTimeout(() => { touchFired = false; }, 600);
      }
    }, { passive: false });
    el.addEventListener('click', (e) => {
      if (touchFired) { e.stopPropagation(); return; } // evita disparo doble en dispositivos táctiles
      e.stopPropagation();
      callback(e);
    });
  },

  parseTime(t) {
    if (!t || typeof t !== 'string') return NaN;
    t = t.trim().replace(',', ':').replace('.', ':');

    if (!t.includes(':')) {
      let minutos = parseFloat(t);
      if (isNaN(minutos)) return NaN;
      if (minutos >= 10 && minutos <= 120) {
        return minutos;
      } else {
        return NaN;
      }
    }

    const parts = t.split(':');
    let m = parseInt(parts[0]);
    let s = parts[1] ? parseInt(parts[1]) : 0;
    if (isNaN(m) || isNaN(s) || s > 59 || m > 120 || m < 10) return NaN;
    return m + s/60; 
  },

  // Auto-formatea el campo "6km · última marca" mientras se escribe, para
  // no depender de que el usuario teclee los dos puntos a mano (en el
  // teclado numérico del móvil ni siquiera están disponibles). En cuanto
  // se completan los 2 primeros dígitos (los minutos) se añaden
  // automáticamente ":00" y se deja esa parte SELECCIONADA, así que si el
  // usuario sigue escribiendo (p.ej. "30" para los segundos) el propio
  // navegador sobreescribe los ceros de golpe sin que haga falta borrar
  // nada -- y si no escribe nada más y pulsa CALCULAR, se queda tal cual
  // en :00. No se toca nada de esto mientras el usuario está BORRANDO
  // (backspace/delete), para no pelearse con él a media edición.
  autoFormatearTiempo(e) {
    const input = e.target;
    const inputType = e.inputType || '';
    const borrando = inputType.indexOf('delete') === 0;

    let digitos = input.value.replace(/\D/g, '').slice(0, 4);
    let formateado = digitos;

    if (digitos.length > 2) {
      formateado = digitos.slice(0, 2) + ':' + digitos.slice(2);
    } else if (digitos.length === 2 && !borrando) {
      formateado = digitos + ':00';
    }

    input.value = formateado;

    if (digitos.length === 2 && !borrando) {
      // Selecciona los "00" recién añadidos para que se sobreescriban
      // directamente al seguir escribiendo.
      input.setSelectionRange(3, 5);
    } else {
      const pos = formateado.length;
      input.setSelectionRange(pos, pos);
    }
  },

  formatR(r) {
    if(!isFinite(r)||r<=0) return "--:--";
    let m = Math.floor(r), s = Math.round((r-m)*60);
    if(s===60){ m++; s=0; }
    return m+":"+(s<10?'0':'')+s;
  },

  formatTime(secondsOrMs, isMs = false) {
    let totalSecs = isMs ? Math.floor(secondsOrMs / 1000) : Math.floor(secondsOrMs);
    if (totalSecs < 0) totalSecs = 0;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },

  showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
  },

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
    // La pantalla real (dashboard, login o verificación, la que toque) ya
    // está resuelta en cuanto se llama a hideLoading() en cualquiera de
    // sus caminos (checkSavedSession / onAuthStateChanged); es el momento
    // de avisar al splash de entrada para que se retire.
    if (typeof window._ri5MarcarAppLista === 'function') window._ri5MarcarAppLista();
  },

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  confirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('confirmOverlay');
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const yesBtn = document.getElementById('confirmYes');
      const noBtn = document.getElementById('confirmNo');

      if (!overlay || !modal || !msgEl || !yesBtn || !noBtn) {
        resolve(false);
        return;
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      overlay.classList.add('active');
      modal.classList.add('active');

      const onYes = () => {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
        resolve(true);
      };
      const onNo = () => {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
        resolve(false);
      };

      yesBtn.addEventListener('click', onYes);
      noBtn.addEventListener('click', onNo);
    });
  },

  // Sustituye a los prompt() nativos del navegador (feos y sin estilo) por
  // un modal con la misma apariencia que el resto de la app (mismo patrón
  // que el modal de "cambiar zapatilla": tarjeta redondeada, título en
  // dorado, input con el estilo de la app, botones CONFIRMAR/CANCELAR).
  // Devuelve una Promise que resuelve con el texto (recortado) o null si
  // se cancela / se deja vacío.
  promptModal(titulo, { label = '', placeholder = '', valorInicial = '', textarea = false, maxLength = 500 } = {}) {
    return new Promise((resolve) => {
      document.getElementById('utilsPromptModal')?.remove();
      document.getElementById('utilsPromptOverlay')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'utilsPromptOverlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
        z-index: 100010; display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.id = 'utilsPromptModal';
      modal.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        max-width: 400px;
        width: 90%;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;

      const fieldHTML = textarea
        ? `<textarea id="utilsPromptInput" maxlength="${maxLength}" placeholder="${placeholder}" style="width: 100%; min-height: 90px; padding: 10px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); font-family: inherit; resize: vertical;"></textarea>`
        : `<input type="text" id="utilsPromptInput" maxlength="${maxLength}" placeholder="${placeholder}" style="width: 100%; padding: 10px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary);">`;

      modal.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: var(--accent-yellow);">${titulo}</h3>
        <div style="margin-bottom: 24px;">
          ${label ? `<label style="display: block; text-align: left; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${label}</label>` : ''}
          ${fieldHTML}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="utilsPromptCancel" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 24px; border-radius: 14px; cursor: pointer;">CANCELAR</button>
          <button id="utilsPromptConfirm" style="background: var(--accent-blue); border: none; color: var(--bg-primary); padding: 8px 24px; border-radius: 14px; cursor: pointer;">CONFIRMAR</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

      const input = document.getElementById('utilsPromptInput');
      input.value = valorInicial || '';
      input.focus();
      if (!textarea) input.select();

      const cerrar = (valor) => { overlay.remove(); resolve(valor); };

      document.getElementById('utilsPromptConfirm').onclick = () => {
        const val = input.value.trim();
        cerrar(val ? val : null);
      };
      document.getElementById('utilsPromptCancel').onclick = () => cerrar(null);
      overlay.onclick = (e) => { if (e.target === overlay) cerrar(null); };
      if (!textarea) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') document.getElementById('utilsPromptConfirm').click();
        });
      }
    });
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  vibrate(pattern) {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  },

  playSound(type) {
    if (!window.audioEnabled) return;
    if (!window.audioContext) {
      try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    const osc = window.audioContext.createOscillator();
    const gainNode = window.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = type === 'success' ? 800 : 400;
    gainNode.gain.value = 0.1;
    gainNode.gain.exponentialRampToValueAtTime(0.00001, window.audioContext.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(window.audioContext.destination);
    osc.start();
    osc.stop(window.audioContext.currentTime + 0.2);
  },

  scrollToElement(elementId, offset = 0) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  },

  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 5 + 2,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        color: `hsl(${Math.random() * 60 + 300}, 70%, 60%)`
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let still = false;
      for (let p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < canvas.height) still = true;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      if (still) {
        requestAnimationFrame(draw);
      } else {
        canvas.style.display = 'none';
      }
    }
    draw();
  },

  handleFirebaseError(error) {
    console.error('Firebase Error:', error);
    let message = '';

    switch(error.code) {
      case 'auth/email-already-in-use':
        message = 'Este correo ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Correo electrónico no válido';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Usuario o contraseña incorrectos';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Comprueba tu red';
        break;
      case 'auth/requires-recent-login':
        message = 'Esta operación requiere autenticación reciente. Vuelve a iniciar sesión';
        break;
      case 'permission-denied':
        message = 'No tienes permisos para esta acción';
        break;
      case 'unavailable':
        message = 'Servicio no disponible. Intenta más tarde';
        break;
      default:
        message = 'Error inesperado. Inténtalo de nuevo más tarde';
    }

    if (message) {
      this.showToast(message, 'error');
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  capitalizeUsername(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
};

// ==================== ESTADO GLOBAL ====================
const AppState = {
  zonasCalculadas: false,
  lastName: "", lastAge: 0, lastFC: 0, lastUL: 0,
  lastZones: [], lastPred: [], lastRitmoBase: 0,
  ultimoPlanParams: null,
  planGeneradoActual: null,
  planActualId: null,
  sesionesRealizadas: {},
  feedbackSesiones: {},
  camposTocados: { name: false, age: false, time: false },
  currentUser: null,
  currentUserId: null,
  currentUserEmail: null,
  currentUserData: null,
  currentSesionDetalle: null,
  deferredPrompt: null,
  mensajesNoLeidos: 0,
  mensajesSoporteAdminNoLeidos: 0,
  isPremium: false,
  emailVerified: false,
  premiumExpiryDate: null,
  calculosMes: 0,
  mesActual: '',
  trimestreActual: 0,
  calendarioMesActual: null,
  unsubscribeMensajes: null,
  isAdmin: false,

  solicitudesPendientesCount: 0,
  mensajesAmigosNoLeidos: 0,
  likesNuevosCount: 0,

  unsubscribeFriendRequests: null,
  unsubscribeConversations: null,
  unsubscribeMensajesSoporte: null,
  unsubscribeMisDatos: null,
  unsubscribeSolicitudesEnviadas: null,
  _friendIdsPrevios: [],

  historialPagination: {
    lastDoc: null,
    hasMore: true,
    loading: false
  },

  setLastCalc(d) {
    if (!d) return;
    this.lastName = d.name || "";
    this.lastAge = d.age || 0;
    this.lastFC = d.fcMax || 0;
    this.lastUL = d.ul || 0;
    this.lastZones = d.zones || [];
    this.lastPred = d.pred || [];
    this.lastRitmoBase = d.ritmoBase || 0;
    this.zonasCalculadas = true;
  },

  clearLastCalc() {
    this.zonasCalculadas = false;
    this.lastName = "";
    this.lastAge = 0;
    this.lastFC = 0;
    this.lastUL = 0;
    this.lastZones = [];
    this.lastPred = [];
    this.lastRitmoBase = 0;
  },

  _actualizarBadgeComunidad() {
    const badge = document.getElementById('comunidadBadge');
    if (!badge) return;
    const total = (this.solicitudesPendientesCount || 0) + (this.mensajesAmigosNoLeidos || 0) + (this.likesNuevosCount || 0);
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  // Antes esta función añadía la clase CSS "premium" (dorado, con
  // !important) sobre el logo "RI5" (#appLogoText) cuando el usuario
  // tenía premium activo, pisando el color de nivel que le pone el
  // dashboard (Gamification.getColorByLevel, ver index.html). Ahora se
  // ha pedido justo lo contrario: el logo debe mostrar SIEMPRE el color
  // de nivel del usuario, sea o no premium. Se deja de aplicar esa
  // clase; se conserva la llamada a remove() por si algún usuario
  // todavía la tiene en el DOM de una sesión anterior en caché.
  actualizarBadgePremium() {
    const t = document.getElementById('appLogoText');
    if (!t) return;
    t.classList.remove('premium');
  },

  async setCurrentUser(uid, email, userData = null) {
    this.currentUserId = uid;
    this.currentUserEmail = email;
    this.currentUserData = userData;
    this.currentUser = userData?.username ? Utils.capitalizeUsername(userData.username) : (email ? email.split('@')[0] : null);

    if (userData && !userData.username_lowercase && userData.username) {
      const newLowercase = userData.username.toLowerCase();
      firebaseServices.db.collection('users').doc(uid).update({
        username_lowercase: newLowercase
      }).catch(e => console.warn('Error actualizando username_lowercase:', e));
      userData.username_lowercase = newLowercase;
      this.currentUserData = userData;
    }

    this.isPremium = userData?.premium || false;
    this.premiumExpiryDate = userData?.expires ? new Date(userData.expires) : null;
    this.emailVerified = userData?.emailVerified || false;
    this.calculosMes = userData?.calculosMes || 0;
    this.mesActual = userData?.mesActual || '';
    this.isAdmin = userData?.isAdmin || false;

    this.limpiarDatosPlan();

    if (uid) {
      localStorage.setItem('ri5_current_user', uid);
      localStorage.setItem('ri5_user_email', email || '');
      if (this.isAdmin) {
        localStorage.setItem('ri5_is_admin', 'true');
      } else {
        localStorage.removeItem('ri5_is_admin');
      }
    } else {
      localStorage.removeItem('ri5_current_user');
      localStorage.removeItem('ri5_user_email');
      localStorage.removeItem('ri5_is_admin');
      if (window.Wall) {
        Wall.detenerListener();
      }
    }

    this.actualizarBadgePremium();

    if (this.currentUser) {
      const nameField = document.getElementById('name');
      if(nameField) nameField.value = this.currentUser;
    }

    const soporteTab = document.getElementById('perfilSoporteTab');
    if (soporteTab) {
      soporteTab.innerHTML = this.isAdmin ? '🛠️ Administración' : '💬 Soporte';
    }

    this.actualizarInterfazPremium();
    this.verificarExpiracionPremium();

    this.actualizarBotonCalcular();

    // ===== NUEVA LÍNEA AÑADIDA: guardar en caché local para recarga instantánea =====
    if (uid && userData) {
      localStorage.setItem('ri5_user_data', JSON.stringify(userData));
    } else {
      localStorage.removeItem('ri5_user_data');
    }
    // =======================================================================

    if (uid) {
      this.iniciarListeners();
      this.precargarDatos();
      if (window.UI) UI.restaurarEstado();

      // Auto-repara, en segundo plano, cualquier copia antigua de la foto
      // de perfil que haya quedado desactualizada en el muro o en los
      // chats (por ejemplo, si el usuario cambió su foto antes de que
      // existiera esta sincronización). No se espera (sin await) para no
      // retrasar el arranque de la app, y no molesta si falla: se
      // reintentará solo en el próximo inicio de sesión.
      if (window.Storage) {
        Storage.autoSyncPhotoURL(uid, userData?.profile?.photoURL || null)
          .catch(e => console.warn('Auto-sync de photoURL falló:', e));
      }
    } else {
      this.detenerListeners();
    }
  },

  precargarDatos() {
    if (!this.currentUserId) return;
    console.log('🔄 Precargando datos en segundo plano...');
    if (window.Profile) {
      Profile.cargarPerfil().catch(e => console.warn('Error precargando perfil:', e));
    }
    if (window.Friends) {
      Friends.cargarListaAmigos().catch(e => console.warn('Error precargando amigos:', e));
      if (document.getElementById('todosUsuariosList')) {
        Friends.cargarTodosUsuarios(true).catch(e => console.warn('Error precargando explorar:', e));
      }
      // Precarga los datos de gamificación de cada amigo (nivel, XP,
      // zapatilla…) para que el modal de perfil de amigo se pinte al
      // instante al pulsar su tarjeta, en vez de esperar a Firestore.
      if (Friends.precargarPerfilesAmigos) {
        Friends.precargarPerfilesAmigos().catch(e => console.warn('Error precargando perfiles de amigos:', e));
      }
    }
    if (window.UI && UI.cargarMensajesRecibidos) {
      UI.cargarMensajesRecibidos().catch(e => console.warn('Error precargando mensajes:', e));
    }
  },

  limpiarDatosPlan() {
    this.planGeneradoActual = null;
    this.planActualId = null;
    this.sesionesRealizadas = {};
    this.feedbackSesiones = {};
    this.trimestreActual = 0;
  },

  actualizarInterfazPremium() {
    // "nuevoPlanBtn" y "generarPlanBtn" vuelven a deshabilitarse para
    // usuarios gratis: SOLO premium puede generar un plan nuevo. Ver el
    // calendario de un plan que ya existía (generado mientras se era
    // premium) sigue funcionando siempre, sin depender de esto — eso lo
    // gestiona mostrarUltimoPlanGuardado()/mostrarCalendario() en
    // calendar.js, que no comprueban premium. Lo único bloqueado tras el
    // modal premium es el detalle de cada día (abrirDetalleSesion).
    // "borrarPlanBtn" no existe en el HTML actual (el botón se quitó), se
    // deja en la lista sin efecto por si se reintroduce.
    const planBtns = ['nuevoPlanBtn', 'borrarPlanBtn', 'generarPlanBtn'];
    const isPremiumActive = (this.isPremium && this.premiumExpiryDate && new Date() <= this.premiumExpiryDate);

    planBtns.forEach(id => {
      const btn = document.getElementById(id);
      if(btn) btn.disabled = !isPremiumActive;
    });

    const counterDiv = document.getElementById('calculoCounter');
    if(counterDiv) {
      counterDiv.style.display = 'block';
      const restantes = this.isPremium ? 'Ilimitado' : (10 - this.calculosMes);
      counterDiv.innerHTML = `📊 Cálculos este mes: ${this.calculosMes} (restan ${restantes} gratis)`;
    }

    this.actualizarBotonCalcular();
  },

  verificarExpiracionPremium() {
    const banner = document.getElementById('premium-expiry-banner');
    const message = document.getElementById('expiry-message');

    if (this.premiumExpiryDate) {
      const ahora = new Date();
      const diasRestantes = Math.ceil((this.premiumExpiryDate - ahora) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes <= 7 && diasRestantes > 0) {
        if (banner) {
          banner.style.display = 'block';
          if (message) message.innerText = `⚠️ Tu premium expira en ${diasRestantes} días`;
        }
      } else if (diasRestantes <= 0) {
        if (banner) {
          banner.style.display = 'block';
          if (message) message.innerText = `⚠️ Tu premium ha expirado`;
        }
        this.isPremium = false;
        this.actualizarInterfazPremium();
      } else {
        if (banner) banner.style.display = 'none';
      }
    }
  },

  puedeVerDetalleSesion() {
    if (this.isPremium && this.premiumExpiryDate && new Date() <= this.premiumExpiryDate) {
      return true;
    }
    return false;
  },

  async incrementarCalculo() {
    if(!this.currentUserId) return false;

    const ahora = new Date();
    const mesActualKey = `${ahora.getFullYear()}-${ahora.getMonth() + 1}`;

    if(this.mesActual !== mesActualKey) {
      this.calculosMes = 0;
      this.mesActual = mesActualKey;
    }

    const limite = this.isPremium ? Infinity : 10;
    if (this.calculosMes >= limite) {
      Utils.showToast('⚠️ Límite de 10 cálculos mensuales alcanzado. Actualiza a premium para más.', 'warning');
      return false;
    }

    try {
      await firebaseServices.db.collection('users').doc(this.currentUserId).update({
        calculosMes: firebaseServices.FieldValue.increment(1)
      });
      this.calculosMes++;
    } catch (error) {
      console.error('Error incrementando calculosMes:', error);
      if (error.code === 'permission-denied') {
        Utils.showToast('⚠️ Has alcanzado el límite de cálculos mensuales. Hazte premium para seguir usando la calculadora.', 'warning');
      } else {
        Utils.showToast('Error al registrar cálculo. Intenta de nuevo.', 'error');
      }
      return false;
    }

    this.actualizarInterfazPremium();
    return true;
  },

  actualizarBotonCalcular() {
    const btn = document.getElementById("calcBtn");
    if (!btn) return;
    const ageValid = document.getElementById('age') && document.getElementById('age').value && !isNaN(parseInt(document.getElementById('age').value));
    const timeValid = document.getElementById('time') && document.getElementById('time').value && !isNaN(Utils.parseTime(document.getElementById('time').value));
    const hayCampos = ageValid && timeValid;
    if (this.isPremium || (this.calculosMes < 10)) {
      btn.disabled = !hayCampos;
      if (!hayCampos) btn.title = "Completa edad y tiempo";
      else btn.title = "";
    } else {
      btn.disabled = true;
      btn.title = "Límite de 10 cálculos mensuales alcanzado. Actualiza a premium.";
    }
  },

  resetHistorialPagination() {
    this.historialPagination = {
      lastDoc: null,
      hasMore: true,
      loading: false
    };
  },

  // Comprueba si el panel {nombre} ('buscar'|'solicitudes'|'lista') de la
  // pestaña Comunidad > Amigos está realmente visible en pantalla ahora
  // mismo. OJO: la clase '.tab-button' ya no existe en el HTML (se sustituyó
  // por '.bottom-nav-item' + '.subtab-button' + estos paneles con id propio
  // '#amigos-buscar' / '#amigos-solicitudes' / '#amigos-lista'). Comprobar
  // '.tab-button.active' siempre devolvía null, así que las refrescadas en
  // tiempo real de la lista de amigos y de la búsqueda nunca llegaban a
  // dispararse aunque el badge sí se actualizara.
  _panelAmigosActivo(nombre) {
    const comunidadActiva = document.getElementById('tab-comunidad')?.classList.contains('active');
    if (!comunidadActiva) return false;
    const amigosSubtabActiva = document.getElementById('subtab-amigos')?.classList.contains('active');
    if (!amigosSubtabActiva) return false;
    return !!document.getElementById(`amigos-${nombre}`)?.classList.contains('active');
  },

  _solicitudesEnviadasVisibles() {
    if (!this._panelAmigosActivo('solicitudes')) return false;
    return document.querySelector('.solicitudes-tab.active')?.dataset.tab === 'enviadas';
  },

  iniciarListeners() {
    this.detenerListeners();
    if (!this.currentUserId) return;

    // === MIS PROPIOS DATOS EN TIEMPO REAL (friendIds, premium, etc.) ===
    // Antes 'friendIds' solo se refrescaba manualmente (al aceptar/eliminar
    // amigo desde el propio dispositivo). Esto dejaba a la OTRA persona
    // implicada (quien envió la solicitud, o quien es eliminado como amigo)
    // sin ningún aviso hasta que recargaba o volvía a entrar en la pestaña.
    // Con este listener, en cuanto Firestore confirma el cambio (batch de
    // aceptarSolicitud o de eliminarAmigo), ambos lados se enteran al
    // instante, sin recargar nada.
    this._friendIdsPrevios = [...(this.currentUserData?.friendIds || [])];
    this.unsubscribeMisDatos = firebaseServices.db
      .collection('users')
      .doc(this.currentUserId)
      .onSnapshot(async (doc) => {
        if (!doc.exists) return;
        const nuevaData = doc.data();
        const friendIdsNuevos = nuevaData.friendIds || [];
        const friendIdsAnteriores = this._friendIdsPrevios || [];

        const nuevosAmigos = friendIdsNuevos.filter(id => !friendIdsAnteriores.includes(id));
        const amigosEliminados = friendIdsAnteriores.filter(id => !friendIdsNuevos.includes(id));

        // Mantenemos currentUserData sincronizado con lo que hay en Firestore
        this.currentUserData = { ...this.currentUserData, ...nuevaData };
        this._friendIdsPrevios = friendIdsNuevos;

        if (nuevosAmigos.length === 0 && amigosEliminados.length === 0) return;

        // Invalidar cachés locales que dependen de la lista de amigos
        if (this.currentUserId) {
          sessionStorage.removeItem(`amigos_lista_${this.currentUserId}`);
          sessionStorage.removeItem(`explorar_usuarios_${this.currentUserId}`);
        }

        if (window.Friends) {
          for (const uidNuevoAmigo of nuevosAmigos) {
            try {
              const otroUsuario = await Storage.getUser(uidNuevoAmigo);
              const nombre = Utils.capitalizeUsername(otroUsuario?.username || 'Usuario');
              Utils.showToast(`🎉 Ahora eres amigo de ${nombre}`, 'success');
            } catch (e) { /* si falla el nombre, seguimos sin bloquear el resto */ }
            if (Friends._modalAmigoUidActual === uidNuevoAmigo) {
              Friends.abrirModalAmigo(uidNuevoAmigo);
            }
          }
          for (const uidEliminado of amigosEliminados) {
            if (Friends._modalAmigoUidActual === uidEliminado) {
              Friends.abrirModalAmigo(uidEliminado);
            }
          }

          // Refrescar las vistas de amigos que puedan estar abiertas ahora mismo
          if (this._panelAmigosActivo('lista')) {
            Friends.cargarListaAmigos(true);
          }
          if (this._panelAmigosActivo('buscar')) {
            Friends.cargarTodosUsuarios(true);
            const term = document.getElementById('buscarAmigosInput')?.value.trim();
            if (term && term.length >= 2) Friends.buscarUsuarios();
          }
        }
      }, (error) => {
        console.error('Error en listener de mis datos (friendIds):', error);
      });

    // === SOLICITUDES QUE YO ENVIÉ: AVISO EN TIEMPO REAL SI ME RESPONDEN ===
    // El listener de abajo (unsubscribeFriendRequests) solo vigila las
    // solicitudes que ME LLEGAN ('to' == yo). Sin este segundo listener,
    // quien ENVÍA la solicitud nunca se enteraba en tiempo real de que
    // fue aceptada o rechazada: tenía que recargar la pestaña de
    // "Enviadas" a mano.
    this.unsubscribeSolicitudesEnviadas = firebaseServices.db
      .collection('friendRequests')
      .where('from', '==', this.currentUserId)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type !== 'modified') return;
          const data = change.doc.data();
          if (data.status === 'rejected') {
            const otroUsuario = await Storage.getUser(data.to).catch(() => null);
            const nombre = Utils.capitalizeUsername(otroUsuario?.username || data.toUsername || 'El usuario');
            Utils.showToast(`${nombre} rechazó tu solicitud de amistad`, 'info');
          }
          // Si status === 'accepted', el propio listener de friendIds ya
          // dispara el toast de "ahora eres amigo de..."; aquí solo
          // refrescamos la pestaña de solicitudes enviadas si está abierta.
          if (window.Friends) {
            if (this._solicitudesEnviadasVisibles()) Friends.cargarSolicitudesEnviadas();
          }
        });
      }, (error) => {
        console.error('Error en listener de solicitudes enviadas:', error);
      });

    this.unsubscribeFriendRequests = firebaseServices.db
      .collection('friendRequests')
      .where('to', '==', this.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const count = snapshot.size;
        if (this.solicitudesPendientesCount !== count) {
          this.solicitudesPendientesCount = count;
          this.actualizarBadgeSolicitudes();
          if (this._panelAmigosActivo('solicitudes')) {
            const solicitudesSubtab = document.querySelector('.solicitudes-tab.active')?.dataset.tab;
            if (!solicitudesSubtab || solicitudesSubtab === 'recibidas') {
              if (window.Friends) Friends.cargarSolicitudesRecibidas();
            }
          }
        }
      }, (error) => {
        console.error('Error en listener de solicitudes:', error);
      });

    this.unsubscribeConversations = firebaseServices.db
      .collection('conversations')
      .where('participants', 'array-contains', this.currentUserId)
      .onSnapshot(async () => {
        if (window.Chat) {
          await Chat.updateUnreadBadge();
        }
        this.actualizarBadgeChat();
      }, (error) => {
        console.error('Error en listener de conversaciones:', error);
      });

    this.unsubscribeMensajesSoporte = firebaseServices.db
      .collection('users')
      .doc(this.currentUserId)
      .collection('mensajes')
      .onSnapshot(async (snapshot) => {
        let noLeidos = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.leido && data.toUid === this.currentUserId) {
            noLeidos++;
          }
        });
        if (this.mensajesNoLeidos !== noLeidos) {
          this.mensajesNoLeidos = noLeidos;
          if (window.UI) UI.actualizarBadgeMensajes();
        }
        // Solo se vuelve a pintar la lista si de verdad llegó/desapareció
        // un mensaje ('added'/'removed'). Antes se repintaba también con
        // cambios de tipo 'modified' -> al abrir un mensaje se escribía
        // leido:true, este mismo listener lo detectaba al instante y
        // reconstruía la lista entera, cerrando la tarjeta que el usuario
        // acababa de abrir un instante antes (parecía que se abría y se
        // cerraba solo con el primer toque).
        const hayNuevosOEliminados = snapshot.docChanges()
          .some(change => change.type === 'added' || change.type === 'removed');
        const soporteTab = document.getElementById('subtab-perfil-soporte');
        if (hayNuevosOEliminados && soporteTab && soporteTab.classList.contains('active')) {
          if (window.UI) {
            UI.cargarMensajesRecibidos();
            UI.cargarMensajesEnviados();
          }
        }
      }, (error) => {
        console.error('Error en listener de mensajes de soporte:', error);
      });

    // === NOTIFICACIÓN DE SOPORTE PARA EL ADMIN ===
    // Los mensajes de soporte dirigidos al admin NO se copian en su
    // subcolección personal 'users/{uid}/mensajes' (enviarMensajeSoporte los
    // deja solo en la colección global 'soporteMensajes'), así que el admin
    // necesita su propio listener para saber si tiene mensajes sin leer.
    if (this.isAdmin) {
      this.unsubscribeSoporteAdmin = firebaseServices.db
        .collection('soporteMensajes')
        .where('toUid', '==', this.currentUserId)
        .where('leido', '==', false)
        .onSnapshot((snapshot) => {
          const count = snapshot.size;
          if (this.mensajesSoporteAdminNoLeidos !== count) {
            this.mensajesSoporteAdminNoLeidos = count;
            this.actualizarBadgeSoporteAdmin();
          }
        }, (error) => {
          console.error('Error en listener de soporte admin:', error);
        });
    }

    // === LIKES NUEVOS EN MIS PROPIAS SESIONES ===
    // Un like se considera "nuevo" mientras likeCount > likesLeidos en el
    // propio documento de globalFeed (likesLeidos se actualiza a
    // likeCount cuando el autor abre la lista de likes, ver wall.js).
    // No hace falta ninguna colección ni regla nueva: solo se consultan
    // los documentos donde userId == myUid(), ya permitido por las
    // reglas actuales de globalFeed.
    this.unsubscribeLikesPropios = firebaseServices.db
      .collection('globalFeed')
      .where('userId', '==', this.currentUserId)
      .onSnapshot((snapshot) => {
        let nuevos = 0;
        snapshot.forEach(doc => {
          const d = doc.data();
          const likeCount = Number(d.likeCount) || 0;
          const likesLeidos = Number(d.likesLeidos) || 0;
          if (likeCount > likesLeidos) nuevos += (likeCount - likesLeidos);
        });
        if (this.likesNuevosCount !== nuevos) {
          this.likesNuevosCount = nuevos;
          this.actualizarBadgeLikes();
        }
      }, (error) => {
        console.error('Error en listener de likes:', error);
      });

    // === SESIONES QUE ME HA ENVIADO EL ADMIN (Generar sesión) ===
    // Muestra un modal de aceptar/rechazar en cuanto llega una sesión
    // nueva pendiente, tanto si la app ya estaba abierta como si se
    // acaba de iniciar sesión.
    if (window.SessionInvites) SessionInvites.iniciarListener();
  },

  detenerListeners() {
    if (this.unsubscribeFriendRequests) {
      this.unsubscribeFriendRequests();
      this.unsubscribeFriendRequests = null;
    }
    if (this.unsubscribeConversations) {
      this.unsubscribeConversations();
      this.unsubscribeConversations = null;
    }
    if (this.unsubscribeMensajesSoporte) {
      this.unsubscribeMensajesSoporte();
      this.unsubscribeMensajesSoporte = null;
    }
    if (this.unsubscribeSoporteAdmin) {
      this.unsubscribeSoporteAdmin();
      this.unsubscribeSoporteAdmin = null;
    }
    if (this.unsubscribeLikesPropios) {
      this.unsubscribeLikesPropios();
      this.unsubscribeLikesPropios = null;
    }
    if (window.SessionInvites) SessionInvites.detenerListener();
    if (this.unsubscribeMisDatos) {
      this.unsubscribeMisDatos();
      this.unsubscribeMisDatos = null;
    }
    if (this.unsubscribeSolicitudesEnviadas) {
      this.unsubscribeSolicitudesEnviadas();
      this.unsubscribeSolicitudesEnviadas = null;
    }
  },

  actualizarBadgeSoporteAdmin() {
    const badge = document.getElementById('adminSoporteBadge');
    if (!badge) return;
    const count = this.mensajesSoporteAdminNoLeidos || 0;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  actualizarBadgeSolicitudes() {
    const tab = document.querySelector('.tab-button[onclick="switchTab(\'amigos\')"]');
    if (tab) {
      if (this.solicitudesPendientesCount > 0) {
        tab.classList.add('amigos-solicitudes-unread');
        tab.setAttribute('data-count', this.solicitudesPendientesCount);
      } else {
        tab.classList.remove('amigos-solicitudes-unread');
        tab.removeAttribute('data-count');
      }
    }
    const solicitudesTab = document.querySelector('.amigos-tab[onclick*="solicitudes"]');
    if (solicitudesTab) {
      if (this.solicitudesPendientesCount > 0) {
        solicitudesTab.style.color = 'var(--accent-blue)';
        solicitudesTab.style.fontWeight = '500';
      } else {
        solicitudesTab.style.color = '';
        solicitudesTab.style.fontWeight = '';
      }
    }
    this._actualizarBadgeComunidad();
  },

  actualizarBadgeLikes() {
    const badge = document.getElementById('muroBadge');
    const count = this.likesNuevosCount || 0;
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    this._actualizarBadgeComunidad();
  },

  actualizarBadgeChat() {
    const tab = document.querySelector('.tab-button[onclick="switchTab(\'amigos\')"]');
    if (tab) {
      if (this.mensajesAmigosNoLeidos > 0) {
        tab.classList.add('chat-unread');
        tab.setAttribute('data-chat-count', this.mensajesAmigosNoLeidos);
      } else {
        tab.classList.remove('chat-unread');
        tab.removeAttribute('data-chat-count');
      }
    }
    const listaTab = document.querySelector('.amigos-tab[onclick*="lista"]');
    if (listaTab) {
      if (this.mensajesAmigosNoLeidos > 0) {
        listaTab.style.color = 'var(--notification-color)';
        listaTab.style.fontWeight = '600';
      } else {
        listaTab.style.color = '';
        listaTab.style.fontWeight = '';
      }
    }
    this._actualizarBadgeComunidad();
  }
};

// ==================== MÓDULO ADMIN ====================
const Admin = {
  usersPagination: {
    lastDoc: null,
    hasMore: true,
    loading: false,
    searchTerm: ''
  },
  currentEditUserId: null,
  filtrosActuales: { premium: 'all', from: '', to: '', sort: 'username' },
  
  messagesPagination: {
    lastDoc: null,
    hasMore: true,
    loading: false,
    allMessagesCache: []
  },

  _unsubscribeMensajes: null,
  _unsubscribeSesionesHoy: null,
  _profileCache: {},

  // El campo user.premium guardado en Firestore puede quedar desactualizado
  // (a "true") entre que caduca y la próxima vez que ese usuario abre la
  // app -- auth.js corrige su PROPIO premium caducado en cada login, pero
  // nadie corrige el de un usuario que no ha vuelto a entrar. Antes había
  // un job que recorría TODA la colección de usuarios cada hora desde el
  // navegador de cualquier persona para mantenerlo al día; se ha quitado
  // por el coste que suponía a escala, así que el panel de admin calcula
  // aquí el estado real a partir de expires, sin tocar nada guardado.
  _esPremiumReal(user) {
    if (!user || user.premium !== true) return false;
    if (user.expires && new Date(user.expires) < new Date()) return false;
    return true;
  },

  // --- Estadísticas ---
  async cargarEstadisticas() {
    try {
      const [totalUsers, premiumUsers, newUsers] = await Promise.all([
        Storage.contarUsuarios(),
        Storage.contarUsuariosPremium(),
        Storage.contarUsuariosNuevos(7)
      ]);
      const elTotal = document.getElementById('statTotalUsers');
      const elPremium = document.getElementById('statPremiumUsers');
      const elNew = document.getElementById('statNewUsers');
      if (elTotal) elTotal.textContent = totalUsers;
      if (elPremium) elPremium.textContent = premiumUsers;
      if (elNew) elNew.textContent = newUsers;
      // "Sesiones hoy" se mantiene actualizado en tiempo real por
      // iniciarEscuchaSesionesHoy() (ver switchTab), así que aquí ya no
      // se hace una lectura puntual que luego se queda obsoleta.
      this.iniciarEscuchaSesionesHoy();
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    }
  },

  // Suscripción en tiempo real al número de sesiones (entradas del muro
  // global) de hoy, para que el contador del panel de admin se actualice
  // solo en cuanto alguien añade o borra una sesión, sin esperar a un
  // refresco manual.
  iniciarEscuchaSesionesHoy() {
    if (!AppState.isAdmin) return;
    this.detenerEscuchaSesionesHoy();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    this._unsubscribeSesionesHoy = firebaseServices.db.collection('globalFeed')
      .where('timestamp', '>=', firebaseServices.Timestamp.fromDate(hoy))
      .where('timestamp', '<', firebaseServices.Timestamp.fromDate(manana))
      .onSnapshot(snapshot => {
        const el = document.getElementById('statSessionsToday');
        if (el) el.textContent = snapshot.size;
      }, error => {
        console.warn('Error escuchando sesiones de hoy en tiempo real:', error);
      });
  },

  detenerEscuchaSesionesHoy() {
    if (this._unsubscribeSesionesHoy) {
      this._unsubscribeSesionesHoy();
      this._unsubscribeSesionesHoy = null;
    }
  },

  aplicarFiltros() {
    const premium = document.getElementById('adminFilterPremium')?.value || 'all';
    const from = document.getElementById('adminFilterDateFrom')?.value || '';
    const to = document.getElementById('adminFilterDateTo')?.value || '';
    const sort = document.getElementById('adminSortBy')?.value || 'username';
    this.filtrosActuales = { premium, from, to, sort };
    this.usersPagination.lastDoc = null;
    this.usersPagination.hasMore = true;
    this.cargarUsuarios(true);
  },

  limpiarFiltros() {
    const elPremium = document.getElementById('adminFilterPremium');
    const elFrom = document.getElementById('adminFilterDateFrom');
    const elTo = document.getElementById('adminFilterDateTo');
    const elSort = document.getElementById('adminSortBy');
    const elSearch = document.getElementById('adminUserSearch');
    const elSearch2 = document.getElementById('adminUserSearch2');
    if (elPremium) elPremium.value = 'all';
    if (elFrom) elFrom.value = '';
    if (elTo) elTo.value = '';
    if (elSort) elSort.value = 'username';
    if (elSearch) elSearch.value = '';
    if (elSearch2) elSearch2.value = '';
    this.filtrosActuales = { premium: 'all', from: '', to: '', sort: 'username' };
    this.usersPagination.searchTerm = '';
    this.usersPagination.lastDoc = null;
    this.usersPagination.hasMore = true;
    this.cargarUsuarios(true);
  },

  // --- Cargar usuarios con filtros y orden ---
  async cargarUsuarios(reset = false) {
    if (!AppState.isAdmin) return;
    if (this.usersPagination.loading) return;

    const container = document.getElementById('adminUsersList');
    if (!container) {
      this.usersPagination.loading = false;
      return;
    }

    if (reset) {
      container.innerHTML = '<div style="text-align:center; padding:40px; color: var(--text-secondary);">⏳ Cargando usuarios...</div>';
      this.usersPagination.lastDoc = null;
      this.usersPagination.hasMore = true;
      const searchEl = document.getElementById('adminUserSearch');
      const searchEl2 = document.getElementById('adminUserSearch2');
      this.usersPagination.searchTerm = (searchEl ? searchEl.value : '') || (searchEl2 ? searchEl2.value : '');
    }

    this.usersPagination.loading = true;

    try {
      const searchTerm = this.usersPagination.searchTerm;
      let usersData = [];
      let hasMore = false;

      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        let query1 = firebaseServices.db.collection('users')
          .orderBy('username_lowercase')
          .startAt(termLower)
          .endAt(termLower + '\uf8ff')
          .limit(50);
        let query2 = firebaseServices.db.collection('users')
          .orderBy('username')
          .startAt(searchTerm)
          .endAt(searchTerm + '\uf8ff')
          .limit(50);

        const [snapshot1, snapshot2] = await Promise.all([query1.get(), query2.get()]);

        const usersMap = new Map();
        snapshot1.forEach(doc => {
          const user = doc.data();
          usersMap.set(doc.id, { uid: doc.id, ...user });
        });
        snapshot2.forEach(doc => {
          const user = doc.data();
          if (!usersMap.has(doc.id)) {
            usersMap.set(doc.id, { uid: doc.id, ...user });
          }
        });

        usersData = Array.from(usersMap.values());
        usersData.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
        hasMore = false;

        if (usersData.length === 0) {
          container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay usuarios que coincidan con la búsqueda</p>';
          this.usersPagination.loading = false;
          this._actualizarBotonCargarMas();
          return;
        }

      } else {
        let query = firebaseServices.db.collection('users')
          .orderBy('username_lowercase')
          .limit(20);

        if (this.usersPagination.lastDoc && !reset) {
          query = query.startAfter(this.usersPagination.lastDoc);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
          if (reset) {
            container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay usuarios</p>';
          } else {
            this.usersPagination.hasMore = false;
            if (container.innerHTML && !container.innerHTML.includes('No hay más usuarios')) {
              container.innerHTML += '<p style="text-align:center; padding:20px; color: var(--text-secondary);">No hay más usuarios</p>';
            }
          }
          this.usersPagination.loading = false;
          this._actualizarBotonCargarMas();
          return;
        }

        this.usersPagination.lastDoc = snapshot.docs[snapshot.docs.length - 1];
        this.usersPagination.hasMore = snapshot.docs.length === 20;
        hasMore = this.usersPagination.hasMore;

        usersData = snapshot.docs.map(doc => {
          const user = doc.data();
          return { uid: doc.id, ...user };
        });
      }

      const usuariosVistos = JSON.parse(localStorage.getItem('admin_usuarios_vistos') || '[]');
      let usersDataProcessed = usersData.map(u => {
        const user = u;
        const uid = u.uid;
        const username = Utils.capitalizeUsername(user.username) || '?';
        const email = Utils.escapeHTML(user.email || '?');
        const premium = this._esPremiumReal(user) ? 'SÍ' : 'NO';
        const expires = user.expires ? new Date(user.expires).toLocaleDateString() : '-';
        const calculos = user.calculosMes || 0;
        const created = user.created ? new Date(user.created).toLocaleDateString() : '-';
        const esNuevo = !usuariosVistos.includes(uid) && 
                       (user.created && new Date(user.created) > new Date(Date.now() - 7*24*60*60*1000));
        return { uid, username, email, premium, expires, calculos, created, esNuevo, user };
      });

      if (this.filtrosActuales.premium !== 'all') {
        const isPremium = this.filtrosActuales.premium === 'true';
        usersDataProcessed = usersDataProcessed.filter(u => this._esPremiumReal(u.user) === isPremium);
      }

      if (this.filtrosActuales.from) {
        const fromDate = new Date(this.filtrosActuales.from);
        fromDate.setHours(0,0,0,0);
        usersDataProcessed = usersDataProcessed.filter(u => {
          if (!u.user.created) return false;
          return new Date(u.user.created) >= fromDate;
        });
      }
      if (this.filtrosActuales.to) {
        const toDate = new Date(this.filtrosActuales.to);
        toDate.setHours(23,59,59,999);
        usersDataProcessed = usersDataProcessed.filter(u => {
          if (!u.user.created) return false;
          return new Date(u.user.created) <= toDate;
        });
      }

      if (this.filtrosActuales.sort === 'created') {
        usersDataProcessed.sort((a, b) => new Date(b.user.created) - new Date(a.user.created));
      } else if (this.filtrosActuales.sort === 'premium') {
        usersDataProcessed.sort((a, b) => (this._esPremiumReal(b.user) ? 1 : 0) - (this._esPremiumReal(a.user) ? 1 : 0));
      } else {
        usersDataProcessed.sort((a, b) => a.username.localeCompare(b.username));
      }

      this.renderUsersList(usersDataProcessed);

      if (searchTerm) {
        this.usersPagination.hasMore = false;
      } else {
        this.usersPagination.hasMore = hasMore;
      }

      if (!reset && !searchTerm) {
        const listContainer = document.getElementById('adminUsersList');
        if (listContainer) {
          listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

    } catch (error) {
      console.error('Error cargando usuarios:', error);
      if (reset) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--zone-5);">Error al cargar usuarios. Revisa la consola.</p>';
      } else {
        if (container.innerHTML && !container.innerHTML.includes('Error al cargar más')) {
          container.innerHTML += '<p style="text-align:center; padding:20px; color: var(--zone-5);">Error al cargar más usuarios.</p>';
        }
      }
    } finally {
      this.usersPagination.loading = false;
      this._actualizarBotonCargarMas();
    }
  },

  _actualizarBotonCargarMas() {
    const loadMoreBtn = document.getElementById('loadMoreUsersBtn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = this.usersPagination.hasMore ? 'block' : 'none';
    }
  },

  renderUsersList(usersData) {
    const container = document.getElementById('adminUsersList');
    if (!container) return;
    
    let html = '';
    for (const u of usersData) {
      const premiumBadge = u.premium === 'SÍ' 
        ? '<span class="usuario-premium-badge">PREMIUM</span>' 
        : '<span class="usuario-premium-badge normal">GRATIS</span>';
      html += `
        <div class="usuario-item ${u.esNuevo ? 'nuevo' : ''}" data-uid="${u.uid}">
          <div class="usuario-header" data-uid="${u.uid}">
            <span class="usuario-nombre">${Utils.escapeHTML(u.username)}</span>
            <span class="usuario-email">${u.email}</span>
            ${u.esNuevo ? '<span class="usuario-badge">NUEVO</span>' : ''}
          </div>
          <div style="margin:4px 0 6px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            ${premiumBadge}
            <span style="font-size:11px; color:var(--text-secondary);">📅 ${u.created}</span>
            <span style="font-size:11px; color:var(--text-secondary);">📊 ${u.calculos} calc</span>
          </div>
          <div class="usuario-detalle">
            <div class="usuario-info">
              <div class="info-item"><span class="info-label">Premium</span><span class="info-value">${u.premium}</span></div>
              <div class="info-item"><span class="info-label">Expira</span><span class="info-value">${u.expires}</span></div>
              <div class="info-item"><span class="info-label">Cálculos</span><span class="info-value">${u.calculos}</span></div>
              <div class="info-item"><span class="info-label">Registro</span><span class="info-value">${u.created}</span></div>
            </div>
            <div class="usuario-acciones">
              <button class="ver-perfil-btn" data-uid="${u.uid}">VER</button>
              <button class="mensaje-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}">MENSAJE</button>
              <button class="premium-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}" data-premium="${u.user.premium}" data-expires="${u.user.expires || ''}">PREMIUM</button>
              <button class="eliminar-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}">ELIMINAR</button>
            </div>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('.ver-perfil-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        Admin.verPerfil(uid);
      });
    });
    container.querySelectorAll('.mensaje-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        Admin.abrirMensajeUsuario(uid, username);
      });
    });
    container.querySelectorAll('.premium-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        const esPremium = btn.dataset.premium === 'true';
        const expires = btn.dataset.expires;
        Admin.abrirModalPremium(uid, username, esPremium, expires);
      });
    });
    container.querySelectorAll('.eliminar-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        Admin.eliminarUsuario(uid, username);
      });
    });
    
    // Toda la tarjeta es clicable (antes solo respondía la cabecera, en el
    // centro de la tarjeta). Los botones de acción llevan su propio
    // listener con stopPropagation, así que no disparan el toggle.
    container.querySelectorAll('.usuario-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        Admin.toggleUsuario(item, item.dataset.uid);
      });
    });
    
    this._actualizarBotonCargarMas();
  },

  toggleUsuario(element, uid) {
    if (!element) return;
    element.classList.toggle('abierto');

    if (element.classList.contains('nuevo')) {
      const usuariosVistos = JSON.parse(localStorage.getItem('admin_usuarios_vistos') || '[]');
      if (!usuariosVistos.includes(uid)) {
        usuariosVistos.push(uid);
        localStorage.setItem('admin_usuarios_vistos', JSON.stringify(usuariosVistos));
      }
      element.classList.remove('nuevo');
      const badge = element.querySelector('.usuario-badge');
      if (badge) badge.remove();
    }
  },

  cargarMasUsuarios() {
    if (this.usersPagination.hasMore && !this.usersPagination.loading) {
      this.cargarUsuarios(false);
    } else if (!this.usersPagination.hasMore) {
      Utils.showToast('No hay más usuarios para cargar', 'info');
    }
  },

  buscarUsuarios: Utils.debounce(function() { 
    const searchEl = document.getElementById('adminUserSearch2');
    if (searchEl) {
      document.getElementById('adminUserSearch').value = searchEl.value;
    }
    Admin.usersPagination.lastDoc = null;
    Admin.usersPagination.hasMore = true;
    Admin.cargarUsuarios(true); 
  }, 300),

  // --- Modal de detalle de usuario ---
  async verPerfil(uid) {
    if (!AppState.isAdmin || !uid) return;
    try {
      // Los datos se cargan ANTES de tocar el modal (ya sea desde caché o
      // desde Firestore). Antes se abría el modal al instante con un
      // "Cargando..." y se rellenaba después: eso se veía como un
      // parpadeo/modal de carga previo a los datos reales. Ahora el modal
      // solo se muestra (con classList.add('active')) una vez que ya
      // tenemos todo listo para pintar, así que aparece directamente con
      // sus datos cargados.
      const cacheKey = `profile_${uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30000) {
            this._renderProfile(uid, data.userData, data.gam, data.entrenos);
            return;
          }
        } catch (e) {}
      }

      const [userDoc, gam, entrenosSnapshot] = await Promise.all([
        firebaseServices.db.collection('users').doc(uid).get(),
        Gamification.getData(uid),
        firebaseServices.db.collection('globalFeed')
          .where('userId', '==', uid)
          .orderBy('timestamp', 'desc')
          .limit(5)
          .get()
      ]);

      if (!userDoc.exists) {
        Utils.showToast('Usuario no encontrado', 'error');
        return;
      }

      const userData = userDoc.data();
      const entrenos = entrenosSnapshot;

      const cacheData = {
        userData,
        gam,
        entrenos: entrenos.docs.map(d => ({ id: d.id, ...d.data() }))
      };
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: cacheData, timestamp: Date.now() }));

      this._renderProfile(uid, userData, gam, entrenos);

    } catch (error) {
      console.error('Error viendo perfil:', error);
      Utils.showToast('Error al cargar perfil', 'error');
    }
  },

  _renderProfile(uid, data, gam, entrenos) {
    const html = `
      <div class="admin-modal-grid">
        <div class="item"><div class="label">Usuario</div><div class="value">${Utils.escapeHTML(data.username)}</div></div>
        <div class="item"><div class="label">Email</div><div class="value" style="font-size:13px;">${Utils.escapeHTML(data.email)}</div></div>
        <div class="item"><div class="label">Premium</div><div class="value">${data.premium ? '✅ Sí' : '❌ No'}</div></div>
        <div class="item"><div class="label">Expira</div><div class="value">${data.expires ? new Date(data.expires).toLocaleDateString() : '-'}</div></div>
        <div class="item"><div class="label">Registro</div><div class="value">${data.created ? new Date(data.created).toLocaleDateString() : '-'}</div></div>
        <div class="item"><div class="label">Último login</div><div class="value">${data.lastLogin ? new Date(data.lastLogin.toDate()).toLocaleString() : '-'}</div></div>
        <div class="item"><div class="label">Nivel</div><div class="value">${gam?.level || 1}</div></div>
        <div class="item"><div class="label">Distancia total</div><div class="value">${gam?.totalDistance?.toFixed(1) || '0'} km</div></div>
      </div>
      <div class="admin-modal-entrenos">
        <h4>📋 Últimos entrenamientos</h4>
        ${entrenos.empty ? '<p style="color:var(--text-secondary);">Sin entrenamientos</p>' : 
          entrenos.docs.map(d => `
            <div class="entreno-item">${d.data().trainingType || 'Sesión'} · ${d.data().distancia?.toFixed(2) || '0'} km · ${d.data().duration || '?'} min</div>
          `).join('')}
      </div>
    `;
    document.getElementById('adminModalContent').innerHTML = html;
    document.getElementById('adminModalTitle').textContent = `👤 ${Utils.capitalizeUsername(data.username)}`;
    const modal = document.getElementById('adminUserModal');
    modal.classList.add('active');
    modal.style.zIndex = '100002';
    // El scroll real vive en .admin-modal-content (max-height:80vh;
    // overflow-y:auto), no en el modal en sí -- sin esto, ver varios
    // usuarios seguidos desde la lista de administración reabría cada
    // perfil en el punto de scroll del usuario anterior.
    const contenido = modal.querySelector('.admin-modal-content');
    if (contenido) contenido.scrollTop = 0;
  },

  cerrarModalUsuario() {
    const modal = document.getElementById('adminUserModal');
    const contenido = modal?.querySelector('.admin-modal-content');
    if (contenido) contenido.scrollTop = 0;
    modal?.classList.remove('active');
  },

  // --- Mostrar lista de usuarios por filtro ---
  async mostrarUsuariosPorFiltro(tipo) {
    const modal = document.getElementById('adminListModal');
    const title = document.getElementById('adminListModalTitle');
    const content = document.getElementById('adminListModalContent');
    if (!modal || !title || !content) return;

    let usuarios = [];
    let titulo = '';

    Utils.showLoading();

    try {
      switch (tipo) {
        case 'total':
          titulo = '👥 Todos los usuarios';
          const totalSnap = await firebaseServices.db.collection('users')
            .orderBy('username_lowercase')
            .limit(100)
            .get();
          usuarios = totalSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          break;

        case 'premium':
          titulo = '⭐ Usuarios Premium';
          const premiumSnap = await firebaseServices.db.collection('users')
            .where('premium', '==', true)
            .orderBy('username_lowercase')
            .limit(100)
            .get();
          usuarios = premiumSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          break;

        case 'new':
          titulo = '🆕 Usuarios nuevos (últimos 7 días)';
          const fecha = new Date();
          fecha.setDate(fecha.getDate() - 7);
          const fechaStr = fecha.toISOString();
          const newSnap = await firebaseServices.db.collection('users')
            .where('created', '>=', fechaStr)
            .orderBy('created', 'desc')
            .limit(100)
            .get();
          usuarios = newSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          break;

        case 'sessions':
          titulo = '🏃 Usuarios con sesiones hoy';
          const hoy = new Date();
          hoy.setHours(0,0,0,0);
          const manana = new Date(hoy);
          manana.setDate(manana.getDate() + 1);
          const sessionsSnap = await firebaseServices.db.collection('globalFeed')
            .where('timestamp', '>=', firebaseServices.Timestamp.fromDate(hoy))
            .where('timestamp', '<', firebaseServices.Timestamp.fromDate(manana))
            .select('userId')
            .get();
          const userIds = [...new Set(sessionsSnap.docs.map(doc => doc.data().userId))];
          if (userIds.length === 0) {
            usuarios = [];
          } else {
            const userPromises = [];
            for (let i = 0; i < userIds.length; i += 10) {
              const batch = userIds.slice(i, i + 10);
              userPromises.push(
                firebaseServices.db.collection('users')
                  .where('__name__', 'in', batch)
                  .get()
              );
            }
            const userSnaps = await Promise.all(userPromises);
            usuarios = userSnaps.flatMap(snap => snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
          }
          break;

        default:
          Utils.showToast('Filtro no válido', 'error');
          Utils.hideLoading();
          return;
      }

      if (usuarios.length === 0) {
        content.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-secondary);">No hay usuarios en este grupo</p>';
      } else {
        let html = '<div style="display:flex; flex-direction:column; gap:8px;" onclick="event.stopPropagation();">';
        for (const user of usuarios) {
          const username = Utils.capitalizeUsername(user.username) || 'Usuario';
          const email = Utils.escapeHTML(user.email || '');
          const premium = this._esPremiumReal(user) ? '⭐' : '';
          html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-secondary); border-radius:10px; cursor:pointer; border:1px solid var(--border-color);" onclick="event.stopPropagation(); Admin.verPerfil('${user.uid}')">
              <div>
                <div style="font-weight:500; color:var(--accent-yellow);">${Utils.escapeHTML(username)} ${premium}</div>
                <div style="font-size:12px; color:var(--text-secondary);">${email}</div>
              </div>
              <span style="font-size:11px; color:var(--accent-blue); font-weight:500; background:var(--bg-primary); padding:2px 10px; border-radius:12px; border:1px solid var(--border-color);">VER</span>
            </div>
          `;
        }
        html += '</div>';
        content.innerHTML = html;
      }

      title.textContent = titulo;
      modal.style.display = 'flex';
      modal.style.zIndex = '100001';
      content.scrollTop = 0;

    } catch (error) {
      console.error('Error al cargar lista de usuarios:', error);
      content.innerHTML = '<p style="text-align:center; padding:20px; color:var(--zone-5);">Error al cargar la lista</p>';
    } finally {
      Utils.hideLoading();
    }
  },

  cerrarListModal() {
    const content = document.getElementById('adminListModalContent');
    if (content) content.scrollTop = 0;
    document.getElementById('adminListModal').style.display = 'none';
  },

  // --- Resto de funciones de admin ---
  async abrirMensajeUsuario(uid, username) {
    const texto = await Utils.promptModal(`✉️ MENSAJE PARA ${username.toUpperCase()}`, {
      label: 'Mensaje', placeholder: 'Escribe tu mensaje…', textarea: true, maxLength: 1000
    });
    if (texto && texto.trim()) {
      this.enviarMensajeSoporteAdmin(uid, texto.trim());
    }
  },

  async eliminarUsuario(uid, username) {
    if (!AppState.isAdmin || !uid) return;
    const confirmado = await Utils.confirm(
      'ELIMINAR USUARIO',
      `¿Estás seguro de eliminar permanentemente a "${username}"?\n\nSe borrarán todos sus datos (perfil, historial, planes, entrenamientos GPS, pasaporte de gamificación, publicaciones del muro y mensajes).\nLa cuenta de acceso seguirá existiendo pero sin datos.`
    );
    if (!confirmado) return;

    Utils.showLoading();
    try {
      const userRef = firebaseServices.db.collection('users').doc(uid);

      const historialSnapshot = await userRef.collection('historial').get();
      const batch1 = firebaseServices.db.batch();
      historialSnapshot.docs.forEach(doc => batch1.delete(doc.ref));
      await batch1.commit();

      // ANTES: aquí se intentaba borrar una subcolección 'sesiones' dentro
      // de cada plan (planDoc.ref.collection('sesiones')), de un sistema
      // antiguo que ya no se usa (ahora las sesiones realizadas se guardan
      // como un campo dentro del propio documento del plan). Esa ruta no
      // tiene ninguna regla de Firestore que la permita, así que la lectura
      // se rechazaba con "permission-denied" y TODA la función se
      // interrumpía a mitad — el usuario quedaba borrado a medias (sin
      // planes, cálculos, mensajes ni cuenta). Se quita esa lectura muerta;
      // borrar el propio documento del plan ya es suficiente, incluye todo.
      const planesSnapshot = await userRef.collection('planes').get();
      const batchPlanes = firebaseServices.db.batch();
      planesSnapshot.docs.forEach(doc => batchPlanes.delete(doc.ref));
      await batchPlanes.commit();

      const calculosSnapshot = await userRef.collection('calculos').get();
      const batch3 = firebaseServices.db.batch();
      calculosSnapshot.docs.forEach(doc => batch3.delete(doc.ref));
      await batch3.commit();

      // Entrenamientos GPS guardados y pasaporte de gamificación: antes no
      // se borraban, quedaban huérfanos aunque el diálogo de confirmación
      // dijera "se borrarán todos sus datos".
      const gpsTracksSnapshot = await userRef.collection('gps_tracks').get();
      const batchGps = firebaseServices.db.batch();
      gpsTracksSnapshot.docs.forEach(doc => batchGps.delete(doc.ref));
      await batchGps.commit();

      try {
        await firebaseServices.db.collection('gamification').doc(uid).delete();
      } catch (e) { console.warn('No se pudo borrar el documento de gamificación:', e); }

      // Publicaciones del muro de este usuario
      try {
        const globalFeedSnapshot = await firebaseServices.db.collection('globalFeed').where('userId', '==', uid).get();
        const batchFeed = firebaseServices.db.batch();
        globalFeedSnapshot.docs.forEach(doc => batchFeed.delete(doc.ref));
        await batchFeed.commit();
      } catch (e) { console.warn('No se pudieron borrar las publicaciones del muro:', e); }

      await firebaseServices.db.collection('mensajes').doc(uid).delete();
      await firebaseServices.db.collection('mensajes').doc('admin_' + uid).delete();
      await userRef.delete();

      Utils.showToast(`✅ Usuario ${username} eliminado (datos borrados)`, 'success');
      this.cargarUsuarios(true);
      this.cargarEstadisticas();
    } catch (error) { 
      console.error('Error eliminando usuario:', error); 
      Utils.showToast('Error al eliminar usuario: ' + error.message, 'error'); 
    } finally { 
      Utils.hideLoading(); 
    }
  },

  abrirModalPremium(uid, username, esPremium, expires) {
    this.currentEditUserId = uid;
    const userEl = document.getElementById('premiumManageUser');
    if (userEl) userEl.innerText = `Editando premium de: ${username}`;

    const statusEl = document.getElementById('premiumManageStatus');
    if (statusEl) statusEl.value = esPremium ? 'true' : 'false';

    const expiryEl = document.getElementById('premiumManageExpiry');
    if (expiryEl) {
      if (expires && expires !== '-') {
        const d = new Date(expires);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        expiryEl.value = `${year}-${month}-${day}`;
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        expiryEl.value = `${year}-${month}-${day}`;
      }
    }

    const modal = document.getElementById('premiumManageModal');
    const overlay = document.getElementById('premiumManageOverlay');
    if (modal) { modal.style.display = 'block'; modal.scrollTop = 0; }
    if (overlay) overlay.style.display = 'block';
  },

  cerrarModalPremium() {
    const modal = document.getElementById('premiumManageModal');
    const overlay = document.getElementById('premiumManageOverlay');
    if (modal) modal.scrollTop = 0;
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    this.currentEditUserId = null;
  },

  async guardarPremium() {
    if (!this.currentEditUserId) return;

    const statusEl = document.getElementById('premiumManageStatus');
    const expiryEl = document.getElementById('premiumManageExpiry');
    const status = statusEl ? statusEl.value === 'true' : false;
    let expiry = expiryEl ? expiryEl.value : '';

    if (!expiry) {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      expiry = d.toISOString();
    } else {
      expiry = new Date(expiry + 'T23:59:59').toISOString();
    }

    Utils.showLoading();
    try {
      await firebaseServices.db.collection('users').doc(this.currentEditUserId).update({ premium: status, expires: expiry });
      Utils.showToast('✅ Estado premium actualizado', 'success');
      this.cerrarModalPremium();
      this.cargarUsuarios(true);
      this.cargarEstadisticas();
    } catch (error) { 
      console.error('Error actualizando premium:', error); 
      Utils.showToast('Error: ' + error.message, 'error'); 
    } finally { 
      Utils.hideLoading(); 
    }
  },

  // --- MENSAJES DE SOPORTE (INDEPENDIENTE) ---

  cambiarSubtab(subtab) {
    document.querySelectorAll('.admin-subpanel').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-subtab').forEach(el => el.classList.remove('active'));

    if (subtab === 'control') {
      document.getElementById('adminControlPanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="control"]').classList.add('active');
    } else if (subtab === 'soporte') {
      document.getElementById('adminSoportePanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="soporte"]').classList.add('active');
      this.cargarMensajesUsuarios(true);
    } else if (subtab === 'generar') {
      document.getElementById('adminGenerarPanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="generar"]').classList.add('active');
      if (window.SessionInvites) SessionInvites.mostrarHistorial();
    }
  },

  async eliminarMensajeSoporte(mensajeId) {
    if (!AppState.isAdmin || !mensajeId) return;
    
    const confirmado = await Utils.confirm('ELIMINAR PARA LOS 2', '¿Eliminar este mensaje permanentemente? Se borrará tanto de tu panel como de la bandeja de soporte del usuario.');
    if (!confirmado) return;

    Utils.showLoading();
    try {
      const doc = await firebaseServices.db.collection('soporteMensajes').doc(mensajeId).get();
      if (!doc.exists) {
        Utils.showToast('El mensaje ya no existe', 'warning');
        Utils.hideLoading();
        return;
      }
      const data = doc.data();
      const fromUid = data.fromUid;
      const toUid = data.toUid;
      const adminUid = await Storage.getAdminUid();

      await firebaseServices.db.collection('soporteMensajes').doc(mensajeId).delete();

      if (fromUid && fromUid !== adminUid) {
        const snapshot = await firebaseServices.db
          .collection('users')
          .doc(fromUid)
          .collection('mensajes')
          .where('timestamp', '==', data.timestamp)
          .where('texto', '==', data.texto)
          .get();
        const batch = firebaseServices.db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      if (toUid && toUid !== adminUid) {
        const snapshot = await firebaseServices.db
          .collection('users')
          .doc(toUid)
          .collection('mensajes')
          .where('timestamp', '==', data.timestamp)
          .where('texto', '==', data.texto)
          .get();
        const batch = firebaseServices.db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      Utils.showToast('✅ Mensaje eliminado', 'success');
      this.cargarMensajesUsuarios(true);
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      Utils.showToast('Error al eliminar mensaje', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async cargarMensajesUsuarios(reset = false) {
    if (!AppState.isAdmin) return;
    const container = document.getElementById('adminMessagesList');
    if (!container) return;

    if (reset) {
      container.innerHTML = '<div style="text-align:center; padding:40px; color: var(--text-secondary);">⏳ Cargando mensajes...</div>';
    }

    try {
      const mensajes = await Storage.getMensajesSoporteAdmin();
      
      if (!mensajes || mensajes.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes de soporte</p>';
        return;
      }

      const adminUid = await Storage.getAdminUid();

      // Agrupar: los envíos "a Todos" comparten broadcastId y se
      // muestran como UN solo bloque, en vez de una fila por usuario.
      // Todo lo demás (mensajes de un usuario al admin, o respuestas
      // individuales del admin a un usuario) se muestra como antes.
      const bloques = [];
      const broadcastsVistos = new Map();
      for (const msg of mensajes) {
        if (msg.fromUid === adminUid && msg.broadcastId) {
          if (broadcastsVistos.has(msg.broadcastId)) {
            broadcastsVistos.get(msg.broadcastId).destinatarios++;
            continue;
          }
          const bloque = { tipo: 'broadcast', msg, destinatarios: 1 };
          broadcastsVistos.set(msg.broadcastId, bloque);
          bloques.push(bloque);
        } else {
          bloques.push({ tipo: 'individual', msg });
        }
      }

      let html = '';
      for (const bloque of bloques) {
        const msg = bloque.msg;
        const fecha = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : 'Fecha desconocida';
        const leido = msg.leido || false;
        const badge = !leido ? `<span class="nuevo-badge-mini">Nuevo</span>` : '';
        const textoCompleto = Utils.escapeHTML(msg.texto || '');
        const preview = textoCompleto.length > 60 ? textoCompleto.substring(0, 60) + '…' : textoCompleto;
        const esLargo = textoCompleto.length > 60;

        let etiqueta, acciones;
        if (bloque.tipo === 'broadcast') {
          etiqueta = `📢 A Todos <span style="color:var(--text-secondary); font-weight:400;">(${bloque.destinatarios} destinatarios)</span>`;
          acciones = `
              <button class="responder" data-broadcast-solo="${msg.broadcastId}">Solo mi panel</button>
              <button class="eliminar" data-broadcast-todos="${msg.broadcastId}">Borrar todos</button>
          `;
        } else if (msg.fromUid === adminUid) {
          const destinatario = await Storage.getUser(msg.toUid);
          const nombreDest = destinatario?.username ? Utils.capitalizeUsername(destinatario.username) : 'Usuario';
          etiqueta = `De ${Utils.escapeHTML(AppState.currentUser || 'Admin')} a ${Utils.escapeHTML(nombreDest)}`;
          acciones = `
              <button class="responder" data-solo-panel="${msg.id}">Solo mi panel</button>
              <button class="eliminar" data-id="${msg.id}">Eliminar para los 2</button>
          `;
        } else {
          const usuario = await Storage.getUser(msg.fromUid);
          const nombre = usuario?.username ? Utils.capitalizeUsername(usuario.username) : 'Usuario desconocido';
          etiqueta = `De ${Utils.escapeHTML(nombre)} a ${Utils.escapeHTML(AppState.currentUser || 'Admin')} ${badge}`;
          acciones = `
              <button class="responder" data-uid="${msg.fromUid}" data-username="${Utils.escapeHTML(nombre)}">Responder</button>
              <button class="responder" data-solo-panel="${msg.id}">Solo mi panel</button>
              <button class="eliminar" data-id="${msg.id}">Eliminar para los 2</button>
          `;
        }

        html += `
          <div class="mensaje-soporte-item ${!leido ? 'no-leido' : ''}" data-id="${msg.id}" data-from-uid="${msg.fromUid}">
            <div class="mensaje-soporte-header">
              <span class="mensaje-soporte-usuario">${etiqueta}</span>
              <span class="mensaje-soporte-fecha">${fecha}</span>
            </div>
            <div class="mensaje-soporte-texto">
              <span class="preview">${preview}</span>
              ${esLargo ? `<span class="completo">${textoCompleto}</span>` : ''}
            </div>
            <div class="mensaje-soporte-acciones">
              ${acciones}
            </div>
          </div>
        `;
      }

      container.innerHTML = html;

      container.querySelectorAll('.mensaje-soporte-item').forEach(el => {
        el.addEventListener('click', async (e) => {
          if (e.target.closest('.responder') || e.target.closest('.eliminar')) return;
          el.classList.toggle('expandido');
          const id = el.dataset.id;
          const fromUid = el.dataset.fromUid;
          if (id && el.classList.contains('no-leido')) {
            await Storage.marcarMensajeSoporteLeido(id, fromUid);
            el.classList.remove('no-leido');
            const badgeEl = el.querySelector('.nuevo-badge-mini');
            if (badgeEl) badgeEl.remove();
          }
        });
      });

      // Responder a un mensaje individual de un usuario
      container.querySelectorAll('.responder[data-uid]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const uid = btn.dataset.uid;
          const username = btn.dataset.username;
          const respuesta = await Utils.promptModal(`✉️ RESPONDER A ${(username || '').toUpperCase()}`, {
            label: 'Mensaje', placeholder: 'Escribe tu respuesta…', textarea: true, maxLength: 1000
          });
          if (respuesta && respuesta.trim()) {
            this.enviarMensajeSoporteAdmin(uid, respuesta.trim());
          }
        });
      });

      // Borrar mensaje individual (de un usuario, o una respuesta
      // individual del admin)
      container.querySelectorAll('.eliminar[data-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          if (id) {
            this.eliminarMensajeSoporte(id);
          }
        });
      });

      // Mensaje individual: borrar SOLO de mi panel de admin (el mensaje
      // sigue existiendo en la bandeja de soporte del usuario)
      container.querySelectorAll('.responder[data-solo-panel]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.soloPanel;
          if (id) this.eliminarMensajeSoloAdmin(id);
        });
      });

      // Bloque "A Todos": borrar solo del panel de admin (el mensaje
      // sigue existiendo para cada usuario)
      container.querySelectorAll('.responder[data-broadcast-solo]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const broadcastId = btn.dataset.broadcastSolo;
          if (broadcastId) this.eliminarBroadcastSoloAdmin(broadcastId);
        });
      });

      // Bloque "A Todos": borrar para todos (desaparece también de la
      // bandeja de cada usuario)
      container.querySelectorAll('.eliminar[data-broadcast-todos]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const broadcastId = btn.dataset.broadcastTodos;
          if (broadcastId) this.eliminarBroadcastCompleto(broadcastId);
        });
      });

    } catch (error) {
      console.error('Error cargando mensajes de soporte:', error);
      container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--zone-5);">Error al cargar mensajes</p>';
    }
  },

  // Borra un mensaje individual SOLO de mi panel de admin (la colección
  // global 'soporteMensajes'). La copia en la bandeja de soporte del
  // usuario se mantiene intacta.
  async eliminarMensajeSoloAdmin(mensajeId) {
    if (!AppState.isAdmin || !mensajeId) return;
    const confirmado = await Utils.confirm('BORRAR SOLO DE MI PANEL', 'Este mensaje desaparecerá de tu panel de admin, pero seguirá existiendo en la bandeja de soporte del usuario. ¿Continuar?');
    if (!confirmado) return;
    Utils.showLoading();
    try {
      const ok = await Storage.eliminarMensajeSoporteSoloAdmin(mensajeId);
      Utils.showToast(ok ? '✅ Mensaje borrado de tu panel' : 'Error al borrar', ok ? 'success' : 'error');
      this.cargarMensajesUsuarios(true);
    } finally {
      Utils.hideLoading();
    }
  },

  async eliminarBroadcastSoloAdmin(broadcastId) {
    if (!AppState.isAdmin || !broadcastId) return;
    const confirmado = await Utils.confirm('BORRAR SOLO DE MI PANEL', 'Este mensaje desaparecerá de tu panel de admin, pero seguirá existiendo en la bandeja de cada usuario que lo recibió. ¿Continuar?');
    if (!confirmado) return;
    Utils.showLoading();
    try {
      const ok = await Storage.eliminarBroadcastSoloAdmin(broadcastId);
      Utils.showToast(ok ? '✅ Bloque borrado de tu panel' : 'Error al borrar', ok ? 'success' : 'error');
      this.cargarMensajesUsuarios(true);
    } finally {
      Utils.hideLoading();
    }
  },

  async eliminarBroadcastCompleto(broadcastId) {
    if (!AppState.isAdmin || !broadcastId) return;
    const confirmado = await Utils.confirm('BORRAR PARA TODOS', 'Este mensaje se eliminará también de la bandeja de TODOS los usuarios que lo recibieron. Esta acción no se puede deshacer. ¿Continuar?');
    if (!confirmado) return;
    Utils.showLoading();
    try {
      const ok = await Storage.eliminarBroadcastCompleto(broadcastId);
      Utils.showToast(ok ? '✅ Mensaje borrado para todos' : 'Error al borrar', ok ? 'success' : 'error');
      this.cargarMensajesUsuarios(true);
    } finally {
      Utils.hideLoading();
    }
  },

  async enviarMensajeSoporteAdmin(usuarioUid, texto) {
    if (!AppState.isAdmin || !usuarioUid || !texto) return;
    const ok = await Storage.enviarMensajeSoporte(AppState.currentUserId, usuarioUid, texto);
    if (ok) {
      Utils.showToast('✅ Mensaje enviado', 'success');
      this.cargarMensajesUsuarios(true);
    } else {
      Utils.showToast('Error al enviar mensaje', 'error');
    }
  },

  async enviarMensajeATodos() {
    if (!AppState.isAdmin) return;
    const broadcastEl = document.getElementById('adminBroadcastText');
    const texto = broadcastEl ? broadcastEl.value.trim() : '';
    if (!texto) { Utils.showToast('Escribe un mensaje', 'warning'); return; }

    const confirmado = await Utils.confirm('ENVÍO MASIVO', `¿Enviar este mensaje a TODOS los usuarios? (puede tardar unos segundos)`);
    if (!confirmado) return;

    Utils.showLoading();
    try {
      const snapshot = await firebaseServices.db.collection('users').get();
      const users = snapshot.docs;
      // Un mismo broadcastId para todas las copias de este envío masivo:
      // así, en el panel de admin, se agrupan y se muestran como UN solo
      // bloque ("📢 A Todos") en vez de una fila por cada usuario, y se
      // pueden borrar todas juntas (o solo del panel) de una vez.
      const broadcastId = firebaseServices.utils.createId();
      let enviados = 0, errores = 0;

      for (const userDoc of users) {
        try {
          await Storage.enviarMensajeSoporte(AppState.currentUserId, userDoc.id, texto, broadcastId);
          enviados++;
        } catch (e) {
          console.error(`Error enviando a ${userDoc.id}:`, e);
          errores++;
        }
      }
      Utils.showToast(`✅ Mensajes enviados: ${enviados} correctos, ${errores} errores`, errores === 0 ? 'success' : 'warning');
      if (broadcastEl) broadcastEl.value = '';
      this.cargarMensajesUsuarios(true);
    } catch (error) { 
      console.error('Error en envío masivo:', error); 
      Utils.showToast('Error al enviar mensajes: ' + error.message, 'error'); 
    } finally { 
      Utils.hideLoading(); 
    }
  }
};

window.Admin = Admin;

// ==================== MÓDULO UI ====================
const UI = {
  consejos: [
    "La constancia vence al talento cuando el talento no entrena.",
    "El descanso no es pérdida de forma, es cuando el cuerpo se reconstruye.",
    "Confía en el proceso, no en la prisa.",
    "La Z2 (aeróbica) construye la base de todo corredor.",
    "Incluye fuerza 2 veces por semana; es el seguro de vida de tus articulaciones.",
    "Aumenta el kilometraje semanal no más de un 10% para evitar lesiones.",
    "El umbral de lactato es el mejor predictor de tu rendimiento en carrera.",
    "Las tiradas largas se hacen a ritmo de conversación, no de competición.",
    "Los días de series, la calidad importa más que la cantidad.",
    "El calentamiento y la vuelta a la calma no son opcionales, son parte del entreno.",
    "Dormir 8 horas es tan importante como la sesión de calidad.",
    "La hidratación empieza días antes de la carrera, no en el avituallamiento.",
    "Escucha a tu cuerpo: el dolor punzante es señal de parar, las agujetas son normales.",
    "Un masaje con rodillo de espuma puede ser tu mejor amigo (o tu peor enemigo, pero útil).",
    "Alterna zapatillas para dar tiempo a que la espuma recupere su forma.",
    "La nutrición post-entreno (ventana metabólica) acelera la recuperación.",
    "Divide la carrera en segmentos pequeños; el cerebro gestiona mejor metas cortas.",
    "Visualiza la carrera antes de correrla; el cerebro no distingue lo imaginado de lo real.",
    "Crea un mantra mental para los momentos duros. Repítelo.",
    "No salgas más rápido de lo planeado; el subidón inicial pasa factura al final.",
    "Cada entrenamiento tiene un propósito. Si no sabes cuál es, pregúntate por qué lo haces.",
    "Compara tu yo de hoy con tu yo de ayer, no con el de los demás.",
    "Los geles no se prueban el día de la carrera; entrena también tu estómago.",
    "El café 45 minutos antes de correr puede mejorar tu rendimiento (si lo toleras).",
    "No experimentes con comidas nuevas la noche antes de una competición.",
    "La cadencia ideal ronda los 180 pasos por minuto; contar durante 30 segundos y multiplicar por dos.",
    "Correr descalzo sobre césped de vez en cuando fortalece la musculatura del pie.",
    "Revisa tu pisada en una tienda especializada; unas zapatillas inadecuadas pueden causar lesiones.",
    "El éxito no se construye con un solo entrenamiento, sino con la suma de todos ellos."
  ],

  consejoIndex: 0,
  dailyInterval: null,
  consejoInterval: null,
  historialCargando: false,

  updateTip(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = '<span>> ' + this.consejos[this.consejoIndex] + '</span><small>// pulsa para otro</small>';
      this.consejoIndex = (this.consejoIndex + 1) % this.consejos.length;
    }
  },

  changeDailyTip() { this.updateTip('dailyTip'); },
  changeConsejo() { this.updateTip('curiosity'); },

  startConsejoAutoChange() {
    if(this.dailyInterval) clearInterval(this.dailyInterval);
    if(this.consejoInterval) clearInterval(this.consejoInterval);
    this.dailyInterval = setInterval(() => { if(document.getElementById("loginPage")?.style.display !== "none") this.updateTip('dailyTip'); }, 8000);
    this.consejoInterval = setInterval(() => { if(document.getElementById("mainContent")?.style.display !== "none") this.updateTip('curiosity'); }, 8000);
  },

  marcarCampoTocado(c) {
    if (!AppState) return;
    AppState.camposTocados[c] = true;
    this.validarCampo(c);
    this.validarTodo();
  },

  validarCampo(c) {
    const el = document.getElementById(c);
    const err = document.getElementById(c + 'Error');
    if (!el || !err) return true;
    if(c === 'name') return true;
    if(!AppState || !AppState.camposTocados[c]) {
      err.classList.remove('visible');
      el.classList.remove('error');
      return true;
    }
    let ok = true;
    if(c === 'age') {
      const a = parseInt(el.value);
      ok = !isNaN(a) && a >= 14 && a <= 85;
    }
    else if(c === 'time') {
      const t = Utils.parseTime(el.value);
      ok = !isNaN(t) && t >= 10 && t <= 90;
    }
    if(!ok) {
      err.innerText = c === 'age' ? 'Edad 14-85' : 'Formato MM:SS o solo minutos (ej. 27)';
      err.classList.add('visible');
      el.classList.add('error');
    }
    else {
      err.classList.remove('visible');
      el.classList.remove('error');
    }
    return ok;
  },

  validarTodo() {
    const a = this.validarCampo('age'), t = this.validarCampo('time');
    const btn = document.getElementById("calcBtn");
    if(btn) btn.disabled = !(a && t);
    AppState.actualizarBotonCalcular();
  },

  async switchTab(tab) {
    // Cualquier pestaña que se abre debe verse siempre desde arriba, nunca
    // dejar al usuario en el punto de scroll donde estaba en la pestaña
    // anterior. window.forzarScrollTop (definido en index.html) hace esto
    // de forma robusta; si por lo que sea aún no está definido (orden de
    // carga), se cae a un scrollTo(0,0) normal.
    if (typeof window.forzarScrollTop === 'function') window.forzarScrollTop();
    else window.scrollTo(0, 0);

    if (window.Chat && window.Chat.closeChat) {
      window.Chat.closeChat();
    }

    if (tab !== 'muro' && window.Wall) {
      Wall.detenerListener();
    }

    if (tab !== 'admin' && tab !== 'perfil' && window.Admin) {
      Admin.detenerEscuchaSesionesHoy();
    }

    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    for(let b of tabs) {
      if(b.textContent.includes(tab === 'entreno' ? 'ENTRENO' : 
                               tab === 'plan' ? 'PLAN' : 
                               tab === 'historial' ? 'HISTORIAL' : 
                               tab === 'soporte' ? 'SOPORTE' : 
                               tab === 'perfil' ? 'PERFIL' : 
                               tab === 'amigos' ? 'AMIGOS' : 
                               tab === 'muro' ? 'MURO' : 'ADMIN')) { 
        b.classList.add('active'); 
        break; 
      }
    }

    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');

    try {
      if(tab === 'historial') {
        if (AppState) AppState.resetHistorialPagination();
        this.cargarHistorialCompleto(true).catch(e => console.warn('Error cargando historial:', e));
      }
      if(tab === 'plan') {
        this.cargarHistorialPlanes().catch(e => console.warn('Error cargando planes:', e));
        // Si al entrar en la pestaña Plan no hay ningún plan cargado en
        // memoria (p.ej. usuario que generó su plan siendo premium, su
        // premium caducó después, y abre la app en un dispositivo/sesión
        // donde no quedó nada en localStorage), se recupera de Firestore
        // en silencio. Así su plan y calendario siguen ahí sin tener que
        // generar uno nuevo; solo el detalle de cada sesión queda
        // bloqueado tras el modal premium si ya no es premium.
        if (!AppState.planActualId && window.PlanGenerator) {
          PlanGenerator.mostrarUltimoPlanGuardado(true).catch(e => console.warn('Error auto-cargando último plan:', e));
        }
      }
      if(tab === 'soporte') { 
        this.cargarMensajesRecibidos().catch(e => console.warn('Error cargando mensajes recibidos:', e));
        this.cargarMensajesEnviados().catch(e => console.warn('Error cargando mensajes enviados:', e));
      }
      if(tab === 'perfil') {
        if (window.Profile) {
          // FIX parpadeo de foto: antes se llamaba sin argumento, lo que
          // fuerza (forceRefresh=true) borrar la caché y volver a pedir
          // todo a Firestore CADA VEZ que se entra a la pestaña, sustituyendo
          // de golpe todo el perfilContainer (incluida la foto) tras el
          // retraso de red. Con forceRefresh=false se usa la caché local de
          // 60s ya existente en Profile.cargarPerfil() y el perfil se pinta
          // al instante si no ha pasado ese tiempo, sin reconstruir el DOM.
          //
          // Las miniaturas de "Mis últimos entrenamientos" SÍ necesitan un
          // reintento aquí: son mapas Leaflet reales (igual que en el
          // Muro), y Profile.cargarPerfil() se precarga en segundo plano
          // nada más iniciar sesión, antes de que esta pestaña esté
          // realmente visible -- un mapa creado con el contenedor oculto
          // (0×0) se pinta a medias. _vincularToqueTodasLasEntradas() ya
          // tiene la guarda para no tocar los mapas que ya se crearon
          // bien; esto solo repesca los que se quedaron pendientes por
          // estar ocultos la primera vez.
          Profile.cargarPerfil(false).catch(e => console.warn('Error cargando perfil:', e));
          setTimeout(() => {
            if (Profile._vincularToqueTodasLasEntradas) Profile._vincularToqueTodasLasEntradas();
          }, 50);
        }
        if (AppState.isAdmin) {
          setTimeout(() => {
            if (document.getElementById('soporte-admin-panel')) {
              Admin.cambiarSubtab('control');
            }
          }, 100);
        }
      }
      if(tab === 'amigos') {
        if (window.Friends) {
          Friends.actualizarBadgeSolicitudes().catch(e => console.warn('Error actualizando badge:', e));
          const activeAmigosTab = document.querySelector('.amigos-tab.active');
          if (activeAmigosTab) {
            const tabText = activeAmigosTab.textContent.toLowerCase();
            if (tabText.includes('buscar')) {
              if (!Friends.todosUsuariosPagination.lastDoc) {
                Friends.cargarTodosUsuarios(true).catch(e => console.warn('Error cargando usuarios:', e));
              }
            } else if (tabText.includes('solicitudes')) {
              Friends.cargarSolicitudesRecibidas().catch(e => console.warn('Error cargando solicitudes:', e));
            } else if (tabText.includes('mis amigos')) {
              Friends.cargarListaAmigos().catch(e => console.warn('Error cargando amigos:', e));
            }
          } else {
            Friends.cargarTodosUsuarios(true).catch(e => console.warn('Error cargando usuarios:', e));
          }
        }
      }
      if(tab === 'muro') {
        if (window.Wall) {
          Wall.detenerListener();
          Wall.init();
        }
      }
      if(tab === 'admin' && AppState && AppState.isAdmin) {
        Admin.cargarUsuarios(true).catch(e => console.warn('Error cargando usuarios admin:', e));
        Admin.cargarEstadisticas().catch(e => console.warn('Error cargando estadísticas:', e));
      }
    } catch (error) {
      console.error(`Error cargando pestaña ${tab}:`, error);
      Utils.showToast('Error al cargar contenido', 'error');
    }

    this.guardarEstado();
  },

  renderMessageList(container, mensajes, tipo, otherName = 'Soporte') {
    if (!container) return;
    if (!mensajes.length) { container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes</p>'; return; }
    const mensajesVistos = JSON.parse(sessionStorage.getItem(`user_mensajes_vistos_${tipo}`) || '[]');
    const miNombre = AppState.currentUser || 'Tú';
    let html = '';
    mensajes.forEach((msg, i) => {
      const mensajeId = `${tipo}_${i}`;
      const esNuevo = !msg.leido && !mensajesVistos.includes(mensajeId);
      const nuevoClass = esNuevo ? 'nuevo' : '';
      const fecha = msg.fecha;
      // "De X a Y" con nombres reales, en vez de las etiquetas genéricas
      // Admin/Tú/Soporte de antes.
      const fromName = tipo === 'recibido' ? otherName : miNombre;
      const toName = tipo === 'recibido' ? miNombre : otherName;
      const remitente = `De ${fromName} a ${toName}`;
      const icono = tipo === 'recibido' ? '📨' : '📤';
      html += `<div class="mensaje-item ${nuevoClass}" data-mensaje-id="${mensajeId}" data-doc-id="${msg.id || ''}" data-msg-index="${i}" data-tipo="${tipo}"> <div class="mensaje-header" data-msg-index="${i}" data-tipo="${tipo}"> <span class="mensaje-fecha">${icono} ${fecha}</span> <span class="mensaje-remitente">${Utils.escapeHTML(remitente)}</span> ${esNuevo ? '<span class="nuevo-badge">NUEVO</span>' : ''} </div> <div class="mensaje-contenido"> <p>${Utils.escapeHTML(msg.texto)}</p> </div> <div class="mensaje-botones"> <button class="eliminar" data-msg-index="${i}" data-tipo="${tipo}" onclick="UI.borrarMensajeUsuario(${i}, '${tipo}')">🗑️ ELIMINAR DE MI BANDEJA</button> </div> </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.mensaje-item').forEach(el => {
      const marcarLeidoSiCorresponde = () => {
        // Antes esta condición estaba invertida (se marcaba leído lo que YA
        // no era nuevo) y además escribía en una colección antigua que no
        // es la que alimenta el contador de no leídos. Ahora: si el mensaje
        // es nuevo (no leído) y es uno recibido, se marca leído en el sitio
        // correcto -> users/{uid}/mensajes/{docId}.
        if (el.classList.contains('nuevo') && tipo === 'recibido' && AppState.currentUserId) {
          const docId = el.dataset.docId;
          if (docId) {
            firebaseServices.db
              .collection('users').doc(AppState.currentUserId)
              .collection('mensajes').doc(docId)
              .update({ leido: true })
              .catch(e => console.warn('Error marcando mensaje como leído:', e));
          }
        }
      };
      const header = el.querySelector('.mensaje-header');
      if (header) {
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          const tipoMsg = el.dataset.tipo;
          const mensajeId = el.dataset.mensajeId;
          el.classList.toggle('abierto');
          marcarLeidoSiCorresponde();
          if (el.classList.contains('nuevo')) {
            const vistos = JSON.parse(sessionStorage.getItem(`user_mensajes_vistos_${tipoMsg}`) || '[]');
            if (!vistos.includes(mensajeId)) {
              vistos.push(mensajeId);
              sessionStorage.setItem(`user_mensajes_vistos_${tipoMsg}`, JSON.stringify(vistos));
            }
            el.classList.remove('nuevo');
            const badge = el.querySelector('.nuevo-badge');
            if (badge) badge.remove();
            this.actualizarBadgeMensajes();
          }
        });
      } else {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.eliminar') || e.target.closest('.responder')) return;
          const tipoMsg = el.dataset.tipo;
          const mensajeId = el.dataset.mensajeId;
          el.classList.toggle('abierto');
          marcarLeidoSiCorresponde();
          if (el.classList.contains('nuevo')) {
            const vistos = JSON.parse(sessionStorage.getItem(`user_mensajes_vistos_${tipoMsg}`) || '[]');
            if (!vistos.includes(mensajeId)) {
              vistos.push(mensajeId);
              sessionStorage.setItem(`user_mensajes_vistos_${tipoMsg}`, JSON.stringify(vistos));
            }
            el.classList.remove('nuevo');
            const badge = el.querySelector('.nuevo-badge');
            if (badge) badge.remove();
            this.actualizarBadgeMensajes();
          }
        });
      }
    });
  },

  // === SOPORTE INDEPENDIENTE (USUARIO) ===

  async cargarMensajesRecibidos() {
    const container = document.getElementById('listaMensajesRecibidos');
    if (!container || !AppState.currentUserId) return;

    const mensajes = await Storage.getMensajesSoporteUsuario(AppState.currentUserId);
    const recibidos = mensajes.filter(m => m.toUid === AppState.currentUserId);
    const adminNombre = await this._nombreAdminSoporte();
    console.log(`📥 Mensajes recibidos: ${recibidos.length}`);
    this.renderMessageList(container, recibidos, 'recibido', adminNombre);
    this.actualizarBadgeMensajes();
  },

  async cargarMensajesEnviados() {
    const container = document.getElementById('listaMensajesEnviados');
    if (!container || !AppState.currentUserId) return;

    const mensajes = await Storage.getMensajesSoporteUsuario(AppState.currentUserId);
    const enviados = mensajes.filter(m => m.fromUid === AppState.currentUserId);
    const adminNombre = await this._nombreAdminSoporte();
    console.log(`📤 Mensajes enviados: ${enviados.length}`);
    this.renderMessageList(container, enviados, 'enviado', adminNombre);
  },

  // Nombre del administrador de soporte, cacheado para no consultar
  // Firestore por cada mensaje al pintar la lista.
  async _nombreAdminSoporte() {
    if (this._adminSoporteNombreCache) return this._adminSoporteNombreCache;
    try {
      const adminUid = await Storage.getAdminUid();
      const admin = adminUid ? await Storage.getUser(adminUid) : null;
      this._adminSoporteNombreCache = admin?.username ? Utils.capitalizeUsername(admin.username) : 'Soporte';
    } catch (e) {
      this._adminSoporteNombreCache = 'Soporte';
    }
    return this._adminSoporteNombreCache;
  },

  async borrarMensajeUsuario(idx, tipo) {
    if (!AppState.currentUserId) return;
    const mensajes = await Storage.getMensajesSoporteUsuario(AppState.currentUserId);
    const mensaje = mensajes.filter(m => tipo === 'recibido' ? m.toUid === AppState.currentUserId : m.fromUid === AppState.currentUserId)[idx];
    if (!mensaje) {
      Utils.showToast('Mensaje no encontrado', 'error');
      return;
    }
    const confirmed = await Utils.confirm('Eliminar mensaje', '¿Eliminar este mensaje permanentemente?');
    if (!confirmed) return;
    Utils.showLoading();
    try {
      await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('mensajes')
        .doc(mensaje.id)
        .delete();
      Utils.showToast('✅ Mensaje eliminado', 'success');
      await this.cargarMensajesRecibidos();
      await this.cargarMensajesEnviados();
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      Utils.showToast('Error al eliminar mensaje', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async enviarMensajeUsuario() {
    if (!AppState || !AppState.currentUserId) return;
    const texto = document.getElementById('mensajeUsuario')?.value.trim();
    if (!texto) { 
      Utils.showToast('Escribe un mensaje', 'warning'); 
      return; 
    }

    const adminUid = await Storage.getAdminUid();
    if (!adminUid) {
      Utils.showToast('No se pudo encontrar al administrador', 'error');
      return;
    }

    const ok = await Storage.enviarMensajeSoporte(AppState.currentUserId, adminUid, texto);
    if (ok) {
      document.getElementById('mensajeUsuario').value = '';
      Utils.showToast('✅ Mensaje enviado a soporte', 'success');
      await this.cargarMensajesEnviados();
      await this.cargarMensajesRecibidos();
    } else {
      Utils.showToast('Error al enviar mensaje', 'error');
    }
  },

  actualizarBadgeMensajes() {
    const badge = document.getElementById('soporteBadge');
    if (badge) {
      const count = AppState.mensajesNoLeidos || 0;
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    const tab = document.querySelector('.subtab-button[data-subtab="perfil-soporte"]');
    if (tab) {
      if (AppState.mensajesNoLeidos > 0) {
        tab.classList.add('soporte-unread');
      } else {
        tab.classList.remove('soporte-unread');
      }
    }
  },

  // === OTRAS FUNCIONES (historial, planes, etc.) ===

  cerrarPlan() {
    const calendario = document.getElementById("calendarioEntreno");
    const cuestionario = document.getElementById("cuestionarioEntreno");
    if (calendario) calendario.style.display = "none";
    if (cuestionario) cuestionario.style.display = "block";
    if (AppState) AppState.limpiarDatosPlan();
    this.guardarEstado();
  },

  initDiasCheckboxes() {
    const c = document.getElementById('diasSemanaContainer');
    if (!c) return;
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    let h = '';
    for(let i = 0; i < 7; i++) {
      const n = i + 1;
      const checked = (n <= 5) ? 'checked' : '';
      h += `<div class="dia-checkbox"> <input type="checkbox" id="dia${n}" value="${n}" ${checked}> <label for="dia${n}">${dias[i]}</label> </div>`;
    }
    c.innerHTML = h;
  },

  guardarEstado() {
    if (!AppState || !AppState.currentUserId) return;
    const uid = AppState.currentUserId;
    // La navegación actual usa la barra inferior (.bottom-nav-item), no
    // .tab-button (esa clase ya no existe en el HTML). Antes esto siempre
    // devolvía null y caía al valor por defecto 'entreno', una pestaña
    // oculta/muerta -> por eso al recargar desde cualquier pestaña que no
    // fuera Inicio, la app intentaba restaurar 'entreno' y se quedaba en
    // blanco.
    const activeTab = document.querySelector('.bottom-nav-item.active')?.dataset.tab || 'inicio';
    const calendario = document.getElementById('calendarioEntreno');
    const planVisible = calendario ? calendario.style.display === 'block' : false;
    const estado = {
      activeTab: activeTab,
      planVisible: planVisible,
      planId: AppState.planActualId,
      trimestre: AppState.trimestreActual
    };
    sessionStorage.setItem('ri5_estado', JSON.stringify(estado));
    if (planVisible && AppState.planActualId) {
      const estadoPlan = {
        planId: AppState.planActualId,
        trimestre: AppState.trimestreActual,
        visible: true
      };
      localStorage.setItem(`ri5_plan_${uid}`, JSON.stringify(estadoPlan));
    } else {
      localStorage.removeItem(`ri5_plan_${uid}`);
    }
  },

  async restaurarEstado() {
    if (!AppState || !AppState.currentUserId) return;
    const uid = AppState.currentUserId;

    // Un plan visible se restaura primero (si lo había), como antes.
    const storedPlan = localStorage.getItem(`ri5_plan_${uid}`);
    if (storedPlan) {
      try {
        const { planId, trimestre, visible } = JSON.parse(storedPlan);
        if (visible && planId) {
          const planExiste = await Storage.getPlanCompleto(uid, planId);
          if (planExiste && planExiste.sesiones && planExiste.sesiones.length > 0) {
            console.log(`🔄 Restaurando plan ${planId} desde localStorage`);
            if (AppState) {
              AppState.planActualId = planId;
              AppState.trimestreActual = trimestre || 0;
              AppState.sesionesRealizadas = planExiste.sesionesRealizadas || {};
              AppState.feedbackSesiones = planExiste.feedback || {};
              AppState.planGeneradoActual = planExiste.params;
            }
            const calendario = document.getElementById("calendarioEntreno");
            const cuestionario = document.getElementById("cuestionarioEntreno");
            if (calendario) calendario.style.display = "block";
            if (cuestionario) cuestionario.style.display = "none";
            if (window.PlanGenerator) PlanGenerator.mostrarCalendario(planExiste.sesiones);
            const resumen = document.getElementById("resumenObjetivo");
            if (resumen) resumen.innerText = planExiste.resumen || 'Plan cargado';
            const nombrePlanEl = document.getElementById('nombrePlanTexto');
            if (nombrePlanEl) nombrePlanEl.textContent = planExiste.nombrePlan || 'Mi plan';
          }
        }
      } catch (e) {
        console.warn('Error restaurando plan desde localStorage:', e);
      }
    }

    // Pestaña activa: YA NO se restaura la última pestaña vista. Se
    // decidió a propósito que, tanto al cerrar sesión y volver a entrar
    // como al cerrar y reabrir la app, SIEMPRE se aterrice en Inicio (que
    // además es la pestaña que ya viene "active" por defecto en el HTML,
    // así que aquí no hace falta tocar nada).
    //
    // Antes esto se decidía mirando si existía sessionStorage['ri5_estado']:
    // la idea era que sessionStorage se borra solo al cerrar de verdad la
    // pestaña/app, así que su ausencia significaría "app recién abierta".
    // En la práctica, en móvil (PWA / apps instaladas) el sistema operativo
    // a menudo mantiene el proceso en segundo plano en vez de matarlo del
    // todo cuando el usuario "cierra" la app, así que sessionStorage seguía
    // vivo y la app reaparecía en la última pestaña en vez de en Inicio,
    // justo lo contrario de lo pedido. Al quitar este bloque, el resultado
    // es siempre determinista.
  },

  async cargarHistorialCompleto(reset = false) {
    const container = document.getElementById("historialContainer");
    if(!container) return;
    if(!AppState || !AppState.currentUserId) { container.innerHTML = '<p style="text-align:center; padding:20px;">Sin historial</p>'; return; }
    if (!AppState.historialPagination) AppState.historialPagination = { lastDoc: null, hasMore: true, loading: false };
    if (AppState.historialPagination.loading) return;
    AppState.historialPagination.loading = true;
    if (reset) { container.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Cargando…</div>'; AppState.historialPagination.lastDoc = null; AppState.historialPagination.hasMore = true; }
    try {
      const limitSelect = document.getElementById('historialLimit');
      const limit = limitSelect ? parseInt(limitSelect.value) : 10;
      const result = await Storage.getHistorial(AppState.currentUserId, limit, reset ? null : AppState.historialPagination.lastDoc);
      if (reset) container.innerHTML = '';
      if (result.items.length === 0) { if (reset) container.innerHTML = '<p style="text-align:center; padding:20px;">Sin cálculos guardados</p>'; AppState.historialPagination.hasMore = false; AppState.historialPagination.loading = false; return; }
      AppState.historialPagination.lastDoc = result.lastDoc;
      AppState.historialPagination.hasMore = result.items.length === limit;
      let html = container.innerHTML;
      result.items.forEach((it) => {
        let zonas = '';
        if(it.zonasResumen && Array.isArray(it.zonasResumen)) {
          zonas = '<div class="zonas-pastillas">';
          it.zonasResumen.forEach(z => {
            if (z.max === "MÁX") zonas += `<span class="zona-pastilla ${z.zona.toLowerCase()}"><span></span> ${z.zona}: >${z.min}</span>`;
            else zonas += `<span class="zona-pastilla ${z.zona.toLowerCase()}"><span></span> ${z.zona}: ${z.min}-${z.max}</span>`;
          });
          zonas += '</div>';
        }
        const pred = it.predicciones ? `<div class="predicciones">📊 ${Utils.escapeHTML(it.predicciones)}</div>` : '';
        const hora = it.hora ? `<div class="hora-detalle">🕒 ${Utils.escapeHTML(it.hora)}</div>` : '';
        const resumen = it.resumen ? Utils.escapeHTML(it.resumen) : (it.nombre + ' · ' + it.edad + ' años');
        html += `<div class="historial-item" onclick="toggleHistorialDetalle(this)"> <div class="fecha">📅 ${it.date || ''}</div> <div class="resumen">${resumen}</div> <button class="delete-icon" onclick="event.stopPropagation(); borrarEntradaHistorial('${it.id}')">🗑️</button> <div class="detalle">${hora}${pred}${zonas}${it.fcMax ? `<div>❤️ FC Máx: ${it.fcMax} lpm</div>`: ''}${it.umbral ?`<div>⚡ Umbral: ${it.umbral} lpm</div>` : ''}</div> </div>`;
      });
      if (AppState.historialPagination.hasMore) html += `<div style="text-align:center; margin-top:20px;"><button class="action-button" onclick="cargarMasHistorial()" style="width:auto; padding:10px 20px;">CARGAR MÁS</button></div>`;
      container.innerHTML = html;
    } catch (error) { console.error('Error cargando historial:', error); if (reset) container.innerHTML = '<p style="text-align:center; padding:20px;">Error al cargar</p>'; }
    finally { if (AppState && AppState.historialPagination) AppState.historialPagination.loading = false; }
  },

  toggleHistorialDetalle(el) { if(el) el.classList.toggle('abierto'); },

  async borrarEntradaHistorial(entryId) {
    if(!AppState || !AppState.currentUserId || !entryId) return;
    const confirmed = await Utils.confirm('Eliminar entrada', '¿Eliminar esta entrada?');
    if(!confirmed) return;
    try { await Storage.deleteHistorialEntry(AppState.currentUserId, entryId); if (AppState) AppState.resetHistorialPagination(); await this.cargarHistorialCompleto(true); Utils.showToast('✅ Entrada eliminada', 'success'); }
    catch (error) { console.error('Error borrando entrada:', error); Utils.showToast('Error al eliminar', 'error'); }
  },

  async borrarHistorial() {
    if(!AppState || !AppState.currentUserId) return;
    const confirmed = await Utils.confirm('Limpiar historial', '¿Eliminar todo el historial?');
    if(!confirmed) return;
    Utils.showLoading();
    try {
      const snapshot = await firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('historial').get();
      const batch = firebaseServices.db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      if (AppState) AppState.resetHistorialPagination();
      await this.cargarHistorialCompleto(true);
      Utils.showToast('✅ Historial limpio', 'success');
    } catch (error) { console.error('Error borrando historial:', error); Utils.showToast('Error al limpiar', 'error'); }
    finally { Utils.hideLoading(); }
  },

  async cargarHistorialPlanes() {
    const container = document.getElementById('planesHistorialContainer');
    const section = document.getElementById('planesHistorial');
    if (!container || !section) return;
    if (!AppState || !AppState.currentUserId || !AppState.isPremium) { section.style.display = 'none'; return; }
    try {
      const planes = await Storage.getHistorialPlanes(AppState.currentUserId, 5);
      if (!planes || planes.length === 0) { section.style.display = 'none'; return; }
      section.style.display = 'block';
      let html = '';
      planes.forEach((plan) => {
        const fecha = plan.fechaCreacion ? new Date(plan.fechaCreacion).toLocaleDateString() : '';
        const params = plan.params || {};
        const distancia = params.distancia ? (params.distancia === '2k' ? '2K' : params.distancia === '5k' ? '5K' : params.distancia === '10k' ? '10K' : params.distancia === 'medio' ? 'MEDIA' : 'MARATÓN') : '';
        const nombrePlan = plan.nombrePlan || 'Mi plan';
        html += `<div class="plan-card" data-plan-id="${plan.id}" onclick="if(!event.target.closest('button')) cargarPlanDesdeHistorial('${plan.id}')"> <div class="plan-info"> <div class="plan-titulo">${Utils.escapeHTML(nombrePlan)}</div> <div class="plan-fecha">📅 ${Utils.escapeHTML(fecha)}</div> <div class="plan-resumen">${Utils.escapeHTML(distancia)} · ${Utils.escapeHTML(params.diasPorSemana || '?')} días · ${Utils.escapeHTML(params.nivel || '')}</div> </div> <button class="delete-plan" onclick="event.stopPropagation(); eliminarPlanHistorial('${plan.id}')">🗑️</button> </div>`;
      });
      container.innerHTML = html;
    } catch (error) { console.error('Error cargando historial de planes:', error); section.style.display = 'none'; }
  },

  async cargarPlanDesdeHistorial(planId) {
    if (!AppState || !AppState.currentUserId || !planId) return;
    try {
      Utils.showLoading();
      const planCompleto = await Storage.getPlanCompleto(AppState.currentUserId, planId);
      if (!planCompleto) { Utils.hideLoading(); Utils.showToast('El plan ya no existe', 'error'); return; }
      if (!planCompleto.sesiones || planCompleto.sesiones.length === 0) { Utils.hideLoading(); Utils.showToast('El plan está corrupto', 'error'); return; }
      if (AppState) { AppState.planGeneradoActual = planCompleto.params; AppState.planActualId = planId; AppState.sesionesRealizadas = planCompleto.sesionesRealizadas || {}; AppState.feedbackSesiones = planCompleto.feedback || {}; AppState.trimestreActual = 0; }
      const calendario = document.getElementById("calendarioEntreno");
      const cuestionario = document.getElementById("cuestionarioEntreno");
      if (calendario) calendario.style.display = "block";
      if (cuestionario) cuestionario.style.display = "none";
      if (window.PlanGenerator) PlanGenerator.mostrarCalendario(planCompleto.sesiones);
      const resumen = document.getElementById("resumenObjetivo");
      if (resumen) resumen.innerText = planCompleto.resumen || 'Plan cargado';
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planCompleto.nombrePlan || 'Mi plan';
      await window.switchTab('plan');
      this.guardarEstado();
      Utils.scrollToElement('calendarioEntreno', -20);
      Utils.hideLoading();
    } catch (e) { console.error('Error cargando plan:', e); Utils.hideLoading(); Utils.showToast('Error al cargar el plan', 'error'); }
  },

  async eliminarPlanHistorial(planId) {
    if (!AppState || !AppState.currentUserId || !planId) return;
    const confirmed = await Utils.confirm('Eliminar plan', '¿Eliminar este plan?');
    if (!confirmed) return;
    try { await Storage.deletePlan(AppState.currentUserId, planId); await this.cargarHistorialPlanes(); if (document.getElementById('historialContent')?.classList.contains('abierto')) { if (AppState) AppState.resetHistorialPagination(); await this.cargarHistorialCompleto(true); } Utils.showToast('✅ Plan eliminado', 'success'); }
    catch (error) { console.error('Error eliminando plan:', error); Utils.showToast('Error al eliminar', 'error'); }
  },

  cambiarSoporteTab(tab) {
    const soporteTabs = document.querySelectorAll('#tab-perfil .soporte-tab');
    const soportePanels = document.querySelectorAll('#tab-perfil .soporte-panel');
    soporteTabs.forEach(t => t.classList.remove('active'));
    soportePanels.forEach(p => p.classList.remove('active'));
    if(tab === 'recibidos') {
      if (soporteTabs[0]) soporteTabs[0].classList.add('active');
      const recibidos = document.getElementById('soporte-recibidos');
      if (recibidos) recibidos.classList.add('active');
      this.cargarMensajesRecibidos();
    } else {
      if (soporteTabs[1]) soporteTabs[1].classList.add('active');
      const enviados = document.getElementById('soporte-enviados');
      if (enviados) enviados.classList.add('active');
      this.cargarMensajesEnviados();
    }
  }
};

// ==================== MÓDULO PWA ====================
const PWA = {
  init() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); AppState.deferredPrompt = e; if(localStorage.getItem('pwa_installed') !== 'true') { const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'flex'; } });
    window.addEventListener('appinstalled', () => { const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'none'; AppState.deferredPrompt = null; localStorage.setItem('pwa_installed', 'true'); Utils.showToast('✅ App instalada', 'success'); });
  },

  async instalarPWA() {
    if(!AppState.deferredPrompt) { Utils.showToast('Para instalar: menú del navegador → "Añadir a pantalla de inicio"', 'info'); return; }
    try { AppState.deferredPrompt.prompt(); const choiceResult = await AppState.deferredPrompt.userChoice; if(choiceResult.outcome === 'accepted') { localStorage.setItem('pwa_installed', 'true'); Utils.showToast('✅ Instalando…', 'success'); } AppState.deferredPrompt = null; const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'none'; } catch (error) { console.error('Error instalando PWA:', error); Utils.showToast('Error al instalar', 'error'); }
  },

  cerrarBannerPWA() { const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'none'; localStorage.setItem('pwa_banner_closed', 'true'); },

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Bug real: aquí nunca se registraba el propio 'sw.js' del proyecto
    // (con su lista de precarga, sus dominios de red-siempre para
    // Firebase y su aviso de versión nueva). En su lugar se registraba un
    // Service Worker minúsculo, distinto, metido a mano en un Blob, con
    // un nombre de caché fijo ('ri5-cache-v1') que nunca cambiaba: así,
    // por mucho que se subiera código nuevo y se bumpeara CACHE_NAME en
    // sw.js, ese archivo real nunca llegaba a ejecutarse -- todo el
    // control de versión y actualización automática era papel mojado.
    //
    // OTRO BUG CORREGIDO: 'navigator.serviceWorker.controller' indica si
    // YA había un Service Worker controlando esta pestaña ANTES de este
    // registro. La primera vez que alguien visita la app (o entra desde
    // un dispositivo nuevo) no hay ningún controller todavío: el SW se
    // instala y activa por primera vez, y sw.js manda igualmente el
    // mensaje 'RI5_NEW_VERSION' -- pero eso NO es una actualización real,
    // es solo el arranque inicial. Antes se recargaba la página igualmente
    // en ese caso, lo que producía un location.reload() a los pocos
    // instantes de haber cargado por primera vez: se veía como un "salto"
    // o parpadeo (el splash "RI5 | Running LAB" empezaba a animarse y, de
    // golpe, la página se recargaba entera y la animación volvía a
    // arrancar desde el principio). Ahora solo se recarga si YA había un
    // controller previo (es decir, si de verdad se está reemplazando una
    // versión anterior que estaba sirviendo la página).
    const teniaControllerAlRegistrar = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ Service Worker (sw.js) registrado:', reg.scope);

        // El navegador, por defecto, solo comprueba si sw.js ha cambiado
        // en momentos muy concretos (sobre todo al navegar/recargar la
        // página) y como mucho una vez cada 24h aunque se recargue más a
        // menudo. Si la PWA se queda abierta en segundo plano (o
        // simplemente el móvil no se reinicia ni se recarga a mano), una
        // versión nueva podía tardar mucho en detectarse -- "actualizarse
        // sola" no funcionaba de verdad salvo que el usuario cerrara y
        // reabriera la app. Con reg.update() se le pide al navegador
        // explícitamente que vuelva a comprobar sw.js: al activarse la
        // pestaña/app (volver de segundo plano), al recuperar conexión, y
        // además cada 60 minutos mientras la app siga abierta. Si hay una
        // versión nueva, esto dispara su instalación -> activate ->
        // mensaje 'RI5_NEW_VERSION' -> recarga automática, tal como ya
        // hace el resto de este flujo.
        const comprobarActualizacion = () => reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') comprobarActualizacion();
        });
        window.addEventListener('online', comprobarActualizacion);
        setInterval(comprobarActualizacion, 60 * 60 * 1000);
      })
      .catch(err => console.warn('Error registrando Service Worker:', err));

    // sw.js avisa con este mensaje en cuanto activa una versión nueva
    // (evento 'activate'). Antes nadie escuchaba este aviso: aunque el SW
    // nuevo ya estuviera activo y sirviendo los archivos actualizados
    // desde caché, la pestaña ya abierta seguía ejecutando en memoria el
    // JS viejo con el que se cargó, hasta que el usuario cerraba y volvía
    // a abrir la app a mano. Con este listener la recarga es automática
    // -- salvo que haya una sesión GPS en marcha, para no cortarla a
    // media carrera: en ese caso se reintenta cada 30s hasta que termine.
    let recargando = false;
    const recargarSiProcede = (version) => {
      if (recargando) return;
      // Ver comentario de arriba: si no había ningún SW controlando la
      // página antes de este registro, este aviso es solo el primer
      // arranque, no una actualización -- no hay nada que recargar.
      if (!teniaControllerAlRegistrar) {
        console.log('ℹ️ Service Worker instalado por primera vez (sin recarga):', version);
        return;
      }
      if (window.GPSTracker && GPSTracker.isRunning) {
        console.log('⏳ Nueva versión lista, se aplicará al terminar la sesión GPS en curso...');
        setTimeout(() => recargarSiProcede(version), 30000);
        return;
      }
      recargando = true;
      console.log('🔄 Nueva versión detectada, recargando...', version);
      location.reload();
    };
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'RI5_NEW_VERSION') recargarSiProcede(event.data.version);
    });
  }
};

// ==================== MÓDULO DE TEMA ====================
window.toggleTheme = function(btn) {
  if (!btn || window._themeTransitioning) return;
  btn.classList.add('ripple');
  setTimeout(() => btn.classList.remove('ripple'), 600);
  Utils.vibrate(30);

  let newTheme;
  if (document.body.classList.contains('manual-light')) {
    newTheme = 'dark';
  } else if (document.body.classList.contains('manual-dark')) {
    newTheme = 'light';
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    newTheme = isDark ? 'light' : 'dark';
  }

  const applyTheme = () => {
    document.body.classList.remove('manual-light', 'manual-dark');
    document.body.classList.add(newTheme === 'light' ? 'manual-light' : 'manual-dark');
    localStorage.setItem('ri5_theme', newTheme);
  };

  // Sin animación: el tema cambia al instante, como en la versión
  // original de la app antes de añadir ninguna ola/transición.
  applyTheme();
};

// ── Sincronización en vivo con la guía (guia.html), que ahora vive en un
// iframe dentro de esta misma página (ver #guiaModalOverlay): sigue
// siendo un "contexto de navegación" aparte para localStorage, así que un
// cambio de tema hecho dentro del iframe solo llega aquí vía el evento
// 'storage' -- sin esto, la app se quedaba con el tema antiguo hasta
// recargar. ──
window.addEventListener('storage', (e) => {
  if (e.key !== 'ri5_theme') return;
  document.body.classList.remove('manual-light', 'manual-dark');
  if (e.newValue === 'light') document.body.classList.add('manual-light');
  else if (e.newValue === 'dark') document.body.classList.add('manual-dark');
});

// ── Modal de la guía de la app: overlay + iframe sobre la propia app, no
// una navegación a guia.html. index.html nunca se descarga, así que abrir
// es instantáneo y "Cerrar" deja al usuario exactamente donde estaba (sin
// repetir el splash de entrada ni perder la pestaña/scroll en la que
// estaba). El iframe solo carga guia.html la primera vez que se abre
// (data-loaded); las siguientes aperturas reutilizan el mismo documento
// ya cargado, así que ni siquiera hay una segunda carga de red. ──
window.abrirGuiaModal = function() {
  const overlay = document.getElementById('guiaModalOverlay');
  const frame = document.getElementById('guiaModalFrame');
  if (!overlay || !frame) return;
  if (!frame.dataset.loaded) {
    frame.src = 'guia.html';
    frame.dataset.loaded = '1';
  } else {
    // Reaperturas: el iframe ya tenía el documento cargado de la vez
    // anterior y conserva el scroll donde el usuario lo dejó. Se vuelve
    // a poner arriba del todo para que la guía se abra siempre desde el
    // principio, igual que el resto de pestañas/modales de la app.
    try { frame.contentWindow.scrollTo(0, 0); } catch (e) {}
  }
  overlay.style.display = 'block';
};

// Precarga en segundo plano de la guía: antes solo se cargaba (frame.src)
// la primera vez que el usuario pulsaba el botón, así que esa primera
// apertura mostraba el iframe en blanco un instante mientras guia.html
// (43KB + su propio CSS) terminaba de pintar -- el "parpadeo brusco" que
// las siguientes aperturas no tenían, porque ya reutilizaban el documento
// cargado. Cargándola aquí, en cuanto la app está lista (mismo aviso
// 'ri5:appready' que retira el splash de entrada) y con el overlay
// todavía oculto (display:none, invisible para el usuario), la guía ya
// está pintada de antemano la primera vez que se pulsa el botón --
// tan instantánea como el resto de aperturas.
window.addEventListener('ri5:appready', function precargarGuia() {
  window.removeEventListener('ri5:appready', precargarGuia);
  const frame = document.getElementById('guiaModalFrame');
  if (frame && !frame.dataset.loaded) {
    frame.src = 'guia.html';
    frame.dataset.loaded = '1';
  }
});

window.cerrarGuiaModal = function() {
  const overlay = document.getElementById('guiaModalOverlay');
  const frame = document.getElementById('guiaModalFrame');
  if (frame && frame.dataset.loaded) {
    try { frame.contentWindow.scrollTo(0, 0); } catch (e) {}
  }
  if (overlay) overlay.style.display = 'none';
};

window.togglePassword = function(inputId, element) {
  let input = null;
  if (inputId) input = document.getElementById(inputId);
  if (!input) { const wrapper = element?.closest('.password-wrapper'); input = wrapper?.querySelector('input'); }
  if (!input) { const form = element?.closest('form, .auth-form, div'); input = form?.querySelector('input[type="password"], input[type="text"]'); }
  if (input) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    element.textContent = isPassword ? 'ocultar' : 'ver';
  } else {
    console.error('No se pudo encontrar el input');
    Utils.showToast('Error al mostrar/ocultar', 'error');
  }
};

window.switchTab = async function(tab) { if (UI && UI.switchTab) await UI.switchTab(tab); };
window.toggleCuestionario = function() { if (window.PlanGenerator) PlanGenerator.toggleCuestionario(); else Utils.showToast('Cargando…', 'info'); };
window.mostrarUltimoPlanGuardado = function() { if (window.PlanGenerator) PlanGenerator.mostrarUltimoPlanGuardado(); else Utils.showToast('Cargando…', 'info'); };
window.borrarPlanGuardado = function() { if (window.PlanGenerator) PlanGenerator.borrarPlanGuardado(); else Utils.showToast('Cargando…', 'info'); };
window.generarCalendarioEntreno = function() { if (window.PlanGenerator) PlanGenerator.generarCalendarioEntreno(); else Utils.showToast('Cargando…', 'info'); };
window.validarOpcionesPlan = function() { if (window.PlanGenerator) PlanGenerator.validarOpcionesPlan(); };
window.cargarHistorial = async function() { if (UI && UI.cargarHistorialCompleto) await UI.cargarHistorialCompleto(true); };
window.cargarMasHistorial = async function() { if (UI && UI.cargarHistorialCompleto) await UI.cargarHistorialCompleto(false); };
window.borrarHistorial = async function() { if (UI && UI.borrarHistorial) await UI.borrarHistorial(); };
window.borrarEntradaHistorial = async function(entryId) { if (UI && UI.borrarEntradaHistorial) await UI.borrarEntradaHistorial(entryId); };
window.toggleHistorialDetalle = function(el) { if (UI && UI.toggleHistorialDetalle) UI.toggleHistorialDetalle(el); };
window.enviarMensajeUsuario = async function() { if (UI && UI.enviarMensajeUsuario) await UI.enviarMensajeUsuario(); };
window.cambiarSoporteTab = function(tab) { if (UI && UI.cambiarSoporteTab) UI.cambiarSoporteTab(tab); };
window.cargarPlanDesdeHistorial = async function(planId) { if (UI && UI.cargarPlanDesdeHistorial) await UI.cargarPlanDesdeHistorial(planId); };
window.eliminarPlanHistorial = async function(planId) { if (UI && UI.eliminarPlanHistorial) await UI.eliminarPlanHistorial(planId); };
window.cerrarPlan = function() { if (UI && UI.cerrarPlan) UI.cerrarPlan(); };
window.cerrarModalPremium = function() {
  const modal = document.getElementById('premiumManageModal');
  const overlay = document.getElementById('premiumManageOverlay');
  if (modal) modal.scrollTop = 0;
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (Admin) Admin.currentEditUserId = null;
};
window.cerrarModalSesion = function() {
  // Reset de scroll al cerrar (mientras el modal aún es visible, para que
  // el navegador sí lo aplique) -- así la próxima apertura ya nace arriba
  // del todo. NOTA: esta es la definición que realmente gana en tiempo de
  // ejecución (app.js se carga después de calendar.js y sobrescribe
  // window.cerrarModalSesion), por eso el arreglo tiene que estar aquí.
  // Se resetean los DOS contenedores con scroll propio: el modal exterior
  // (#detalleSesion) Y su wrapper interno (#modalColorWrapper), que es el
  // que realmente scrollea en la práctica -- antes solo se reseteaba el
  // exterior y por eso el modal seguía reabriéndose donde se había dejado.
  const modalSesionEl = document.getElementById("detalleSesion");
  const wrapperEl = document.getElementById("modalColorWrapper");
  if (modalSesionEl) modalSesionEl.scrollTop = 0;
  if (wrapperEl) wrapperEl.scrollTop = 0;
  modalSesionEl?.classList.remove("visible");
  document.getElementById("modalOverlay")?.classList.remove("visible");
  if (AppState) AppState.currentSesionDetalle = null;
};
window.cambiarAmigosTab = function(tab) {
  const amigosTabs = document.querySelectorAll('.amigos-tab');
  const amigosPanels = document.querySelectorAll('.amigos-panel');
  amigosTabs.forEach(t => t.classList.remove('active'));
  amigosPanels.forEach(p => p.classList.remove('active'));
  const tabMap = { 'buscar': 0, 'solicitudes': 1, 'lista': 2 };
  const idx = tabMap[tab];
  if (idx !== undefined) {
    if (amigosTabs[idx]) amigosTabs[idx].classList.add('active');
    const panel = document.getElementById(`amigos-${tab}`);
    if (panel) panel.classList.add('active');
  }
  if (tab === 'solicitudes' && window.Friends) Friends.cargarSolicitudesRecibidas();
  if (tab === 'lista' && window.Friends) Friends.cargarListaAmigos();
};

const ResetPassword = {
  abrirModal() {
    const overlay = document.getElementById('resetOverlay');
    const modal = document.getElementById('resetModal');
    if (overlay) overlay.style.display = 'block';
    if (modal) { modal.style.display = 'block'; modal.scrollTop = 0; }
    const email = document.getElementById('resetEmail');
    if (email) email.value = '';
    const error = document.getElementById('resetError');
    if (error) error.classList.remove('visible');
  },
  cerrarModal() {
    const overlay = document.getElementById('resetOverlay');
    const modal = document.getElementById('resetModal');
    if (modal) modal.scrollTop = 0;
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
  },
  async enviarEmailRecuperacion() {
    const email = document.getElementById('resetEmail')?.value.trim();
    const errorEl = document.getElementById('resetError');
    if (!email) {
      if (errorEl) { errorEl.textContent = 'Introduce tu correo electrónico'; errorEl.classList.add('visible'); }
      return;
    }
    if (!Utils.isValidEmail(email)) {
      if (errorEl) { errorEl.textContent = 'Correo electrónico no válido'; errorEl.classList.add('visible'); }
      return;
    }
    Utils.showLoading();
    try {
      await firebaseServices.auth.sendPasswordResetEmail(email);
      Utils.hideLoading();
      this.cerrarModal();
      Utils.showToast('📧 Revisa tu correo para restablecer la contraseña', 'success');
    } catch (error) {
      Utils.hideLoading();
      if (error.code === 'auth/user-not-found') {
        Utils.showToast('Si el correo existe, recibirás instrucciones', 'info');
        this.cerrarModal();
      } else {
        Utils.handleFirebaseError(error);
      }
    }
  }
};

// ==================== INICIALIZACIÓN CORRECTA ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log('🚀 Iniciando RI5…');

  setTimeout(() => {
    document.querySelectorAll('.password-toggle').forEach(button => {
      if (!button.getAttribute('onclick')) {
        const wrapper = button.closest('.password-wrapper');
        const input = wrapper?.querySelector('input');
        if (input && input.id) {
          button.setAttribute('onclick', `togglePassword('${input.id}', this)`);
        }
      }
    });
  }, 500);

  if (!window.firebaseServices) {
    console.error('❌ Firebase no está configurado');
    Utils.showToast('Error de configuración', 'error');
    return;
  }

  // Las tarjetas de "consejo" (login y pestaña de cálculo) ya tenían la
  // lógica de auto-rotado lista (startConsejoAutoChange), pero nunca se
  // llamaba, así que solo cambiaban al pulsarlas. Se arranca aquí una
  // vez, al iniciar la app.
  UI.startConsejoAutoChange();

  const ageInput = document.getElementById("age");
  const timeInput = document.getElementById("time");

  if (ageInput) {
    ageInput.addEventListener("blur", () => UI.marcarCampoTocado('age'));
    ageInput.addEventListener("input", () => {
      if(AppState && AppState.camposTocados.age) UI.validarCampo('age');
      UI.validarTodo();
    });
  }

  if (timeInput) {
    timeInput.addEventListener("input", (e) => Utils.autoFormatearTiempo(e));
    timeInput.addEventListener("blur", () => UI.marcarCampoTocado('time'));
    timeInput.addEventListener("input", () => {
      if(AppState && AppState.camposTocados.time) UI.validarCampo('time');
      UI.validarTodo();
    });
  }

  UI.validarTodo();
  UI.initDiasCheckboxes();

  if(localStorage.getItem('pwa_installed') === 'true' || localStorage.getItem('pwa_banner_closed') === 'true') {
    const pwaBanner = document.getElementById('pwa-banner');
    if (pwaBanner) pwaBanner.style.display = 'none';
  }

  PWA.init();
  PWA.registerServiceWorker();

  setTimeout(() => {
    if(AppState && AppState.deferredPrompt &&
      localStorage.getItem('pwa_installed') !== 'true' &&
      localStorage.getItem('pwa_banner_closed') !== 'true') {
      const pwaBanner = document.getElementById('pwa-banner');
      if (pwaBanner) pwaBanner.style.display = 'flex';
    }
  }, 3000);

  const savedTheme = localStorage.getItem('ri5_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.body.classList.add(`manual-${savedTheme}`);
  }

  document.addEventListener('click', function enableAudio() {
    window.audioEnabled = true;
    document.removeEventListener('click', enableAudio);
  }, { once: true });

  window.addEventListener('online', () => {
    Storage.procesarCalculosPendientes();
  });

  // NOTA: Antes había aquí un listener global de "click" que abría un
  // aviso de "contacta con el administrador" al pulsar cualquier elemento
  // con una clase que contuviera "premium" mientras la pestaña Perfil
  // estaba activa. El problema: la cabecera "RI5" (#appLogoText) recibe
  // la clase CSS "premium" cuando el usuario es premium (para el brillo
  // dorado), así que ese selector tan amplio también la capturaba a
  // ELLA -- resultado: pulsar "RI5" en Perfil para cambiar de tema abría
  // además este aviso por error. Se elimina: el único punto de entrada al
  // modal premium ahora es el texto PREMIUM/GRATIS del perfil, mediante
  // showPremiumBenefits() (ver profile.js), y el modal de beneficios al
  // pulsar un día del calendario sin ser premium (ver calendar.js).

  const savedUid = localStorage.getItem('ri5_current_user');
  if (!savedUid) {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainContent").style.display = "none";
    // Sin sesión guardada: la pantalla de login ya está resuelta, sin
    // esperar a red ni a Firebase. Avisamos al splash de entrada para que
    // se retire y la deje ver.
    if (typeof window._ri5MarcarAppLista === 'function') window._ri5MarcarAppLista();
  } else {
    Utils.showLoading();

    // Bug real: aquí solo se mostraba el círculo de carga y se dejaba que
    // el listener global de Firebase (onAuthStateChanged, en auth.js) se
    // encargara de decidir qué pantalla mostrar. Ese listener es
    // asíncrono y puede tardar en resolver el estado real de
    // 'emailVerified' -- mientras tanto, si evaluaba momentáneamente el
    // correo como no verificado, mostraba de refilón la pantalla de
    // verificación (con el círculo de carga encima) antes de corregirse
    // solo al dashboard. Auth.checkSavedSession() estaba escrita
    // precisamente para evitar esto (restaura el dashboard al INSTANTE
    // desde los datos ya guardados en localStorage, sin esperar a la red
    // ni a Firebase) pero nunca se llamaba desde ningún sitio: se
    // quedaba como código muerto. Llamándola aquí, lo primero que se ve
    // al entrar es directamente el dashboard.
    Auth.checkSavedSession();

    // Aviso de diagnóstico (no intrusivo): si tras 15s el overlay sigue
    // activo, lo dejamos en consola para detectar fallos de red/Firebase.
    // No fuerza ningún cambio de pantalla: hideLoading() ya se llama en
    // todos los caminos de onAuthStateChanged / checkSavedSession.
    setTimeout(() => {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay && overlay.classList.contains('active')) {
        console.warn('⚠️ El overlay de carga lleva más de 15s activo. Revisa la conexión o el estado de Firebase Auth.');
      }
    }, 15000);
  }

  if (window.Training && Training._loadFromLocalStorage) {
    const savedCalc = Training._loadFromLocalStorage();
    if (savedCalc && AppState && !AppState.zonasCalculadas) {
      AppState.setLastCalc(savedCalc);
      // "tab-entreno" es una pestaña antigua que ya no se usa (ahora
      // "Entreno" vive como subpestaña dentro de Perfil); comprobar esa
      // pestaña muerta significaba que esta condición nunca era cierta, y
      // por tanto las tarjetas nunca se pintaban solas al cargar la app.
      const subtabEntreno = document.getElementById('subtab-perfil-entreno');
      if (subtabEntreno && subtabEntreno.classList.contains('active')) {
        Training.mostrarResultados(savedCalc);
      } else {
        console.log('📦 Cálculo restaurado en segundo plano desde localStorage');
      }
    }
  }

  console.log('✅ RI5 inicializado correctamente');
});

window.toggleUsuario = (element, uid) => Admin.toggleUsuario(element, uid);
window.UI = UI;

window.instalarPWA = () => PWA.instalarPWA();
window.cerrarBannerPWA = () => PWA.cerrarBannerPWA();
window.changeDailyTip = () => UI.changeDailyTip();
window.changeConsejo = () => UI.changeConsejo();
window.cerrarPremiumModal = () => {
  document.getElementById('premiumOverlay')?.classList.remove('active');
  const modal = document.getElementById('premiumModal');
  // Reset mientras el modal aún es visible (igual que en el resto de la
  // app): el que realmente scrollea es .modal-scroll-body, no el modal.
  const scrollBody = modal?.querySelector('.modal-scroll-body');
  if (scrollBody) scrollBody.scrollTop = 0;
  modal?.classList.remove('active');
};
window.contactarAdmin = () => {
  window.open('https://www.instagram.com/joaquinpeinando?igsh=Y2ZzMHpwOWUwOTRx&igsi=Y2ZzMHpwOWUwOTRx&utm_source=qr', '_blank');
};
window.cerrarWelcomeModal = () => {
  document.getElementById('welcomeOverlay')?.classList.remove('active');
  const modal = document.getElementById('welcomeModal');
  const scrollBody = modal?.querySelector('.modal-scroll-body');
  if (scrollBody) scrollBody.scrollTop = 0;
  modal?.classList.remove('active');
};

window.abrirResetModal = () => ResetPassword.abrirModal();
window.cerrarResetModal = () => ResetPassword.cerrarModal();
window.enviarEmailRecuperacion = () => ResetPassword.enviarEmailRecuperacion();

if (typeof PlanGenerator !== 'undefined') {
  window.cambiarTrimestre = async (delta) => { await PlanGenerator.cambiarTrimestre(delta); };
} else {
  window.cambiarTrimestre = async (delta) => {
    console.warn('PlanGenerator no disponible aún');
    Utils.showToast('Cargando planificador...', 'info');
  };
}