// ==================== app.js - VERSIÓN COMPLETA CON HILOS DE CONVERSACIÓN DE SOPORTE ====================
// VERSIÓN: 4.49 - Lista de conversaciones de soporte (admin) con caché en
//                 memoria: solo se recarga de Firestore (mostrando la
//                 animación de letras "CARGANDO") si se envió, se borró o
//                 llegó un mensaje nuevo desde la última vez; si no, se
//                 reutiliza la lista ya calculada al instante.
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
      if (touchFired) { e.stopPropagation(); return; }
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

  _animarTextoDorado(elemento, texto, colorFinal) {
    if (!elemento) return 0;
    const VELOCIDAD_MS = 90;
    const ENTRADA_MS = 320;
    const PAUSA_MS = 200;
    const COLOR_MS = 550;
    const GOLD = '#c0a060';
    const LEVEL_COLORS = ['#9e9e9e', '#7fa1c9', '#6bb3ae', '#7fb37a', '#a9bd6a', '#cbb15f', '#cf9760', '#c97b5f', '#bd6688', '#9270c9'];
    const colorFinalReal = colorFinal || GOLD;

    elemento.innerHTML = '';
    const letras = texto.split('');
    const spans = letras.map((ch, i) => {
      const span = document.createElement('span');
      span.textContent = (ch === ' ') ? '\u00A0' : ch;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateX(-10px)';
      span.style.color = (ch === ' ') ? colorFinalReal : LEVEL_COLORS[i % LEVEL_COLORS.length];
      span.style.transition = `opacity ${ENTRADA_MS}ms ease, transform ${ENTRADA_MS}ms ease, color ${COLOR_MS}ms ease`;
      elemento.appendChild(span);
      return span;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        spans.forEach((span, i) => {
          setTimeout(() => {
            span.style.opacity = '1';
            span.style.transform = 'translateX(0)';
          }, i * VELOCIDAD_MS);
        });
        const finEntrada = (letras.length - 1) * VELOCIDAD_MS + ENTRADA_MS;
        setTimeout(() => {
          spans.forEach(span => { span.style.color = colorFinalReal; });
        }, finEntrada + PAUSA_MS);
      });
    });

    const finEntrada = (letras.length - 1) * VELOCIDAD_MS + ENTRADA_MS;
    return finEntrada + PAUSA_MS + COLOR_MS;
  },

  showLoading(texto) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
    const textoEl = document.getElementById('loadingOverlayText');
    const duracionAnimacion = textoEl ? this._animarTextoDorado(textoEl, (texto || 'EN PROCESO').toUpperCase()) : 0;
    this._loadingToken = (this._loadingToken || 0) + 1;
    this._loadingShownAt = Date.now();
    this._loadingMinDuration = duracionAnimacion + 150;
  },

  hideLoading() {
    const miToken = this._loadingToken;
    const transcurrido = Date.now() - (this._loadingShownAt || 0);
    const restante = (this._loadingMinDuration || 0) - transcurrido;
    return new Promise(resolve => {
      const ocultarYa = () => {
        if (this._loadingToken !== miToken) { resolve(); return; }
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
        if (typeof window._ri5MarcarAppLista === 'function') window._ri5MarcarAppLista();
        resolve();
      };
      if (restante > 0) { setTimeout(ocultarYa, restante); return; }
      ocultarYa();
    });
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
    return /^[^\s@]+@[^\s@]+$/.test(email);
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

    if (uid && userData) {
      localStorage.setItem('ri5_user_data', JSON.stringify(userData));
    } else {
      localStorage.removeItem('ri5_user_data');
    }

    if (uid) {
      this.iniciarListeners();
      this.precargarDatos();
      if (window.UI) UI.restaurarEstado();

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

        this.currentUserData = { ...this.currentUserData, ...nuevaData };
        this._friendIdsPrevios = friendIdsNuevos;

        if (nuevosAmigos.length === 0 && amigosEliminados.length === 0) return;

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

          // Un usuario nos ha mandado un mensaje nuevo (o uno ha pasado a
          // leído desde otro sitio): la lista de conversaciones cacheada
          // ya no está actualizada. Se invalida para que la próxima vez
          // que se entre en la pestaña de soporte se recargue de verdad
          // (mostrando "CARGANDO") en vez de reutilizar la caché.
          const hayCambios = snapshot.docChanges()
            .some(change => change.type === 'added' || change.type === 'removed');
          if (hayCambios && window.Admin) {
            Admin._cacheSoporteVigente = false;
            const soportePanel = document.getElementById('adminSoportePanel');
            if (soportePanel && soportePanel.style.display === 'block') {
              Admin.cargarMensajesUsuarios(true);
            }
          }
        }, (error) => {
          console.error('Error en listener de soporte admin:', error);
        });
    }

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
  _conversacionAbierta: null,

  _esPremiumReal(user) {
    if (!user || user.premium !== true) return false;
    if (user.expires && new Date(user.expires) < new Date()) return false;
    return true;
  },

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
      this.iniciarEscuchaSesionesHoy();
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    }
  },

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

  async verPerfil(uid) {
    if (!AppState.isAdmin || !uid) return;
    try {
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
    const contenido = modal.querySelector('.admin-modal-content');
    if (contenido) contenido.scrollTop = 0;
  },

  cerrarModalUsuario() {
    const modal = document.getElementById('adminUserModal');
    const contenido = modal?.querySelector('.admin-modal-content');
    if (contenido) contenido.scrollTop = 0;
    modal?.classList.remove('active');
  },

  async mostrarUsuariosPorFiltro(tipo) {
    const modal = document.getElementById('adminListModal');
    const title = document.getElementById('adminListModalTitle');
    const content = document.getElementById('adminListModalContent');
    if (!modal || !title || !content) return;

    let usuarios = [];
    let titulo = '';
    let htmlContent = '';

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
          await Utils.hideLoading();
          return;
      }

      if (usuarios.length === 0) {
        htmlContent = '<p style="text-align:center; padding:20px; color:var(--text-secondary);">No hay usuarios en este grupo</p>';
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
        htmlContent = html;
      }

    } catch (error) {
      console.error('Error al cargar lista de usuarios:', error);
      htmlContent = '<p style="text-align:center; padding:20px; color:var(--zone-5);">Error al cargar la lista</p>';
      titulo = titulo || '⚠️ Error';
    }

    await Utils.hideLoading();

    content.innerHTML = htmlContent;
    title.textContent = titulo;
    modal.style.display = 'flex';
    modal.style.zIndex = '100001';
    content.scrollTop = 0;
  },

  cerrarListModal() {
    const content = document.getElementById('adminListModalContent');
    if (content) content.scrollTop = 0;
    document.getElementById('adminListModal').style.display = 'none';
  },

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

      const planesSnapshot = await userRef.collection('planes').get();
      const batchPlanes = firebaseServices.db.batch();
      planesSnapshot.docs.forEach(doc => batchPlanes.delete(doc.ref));
      await batchPlanes.commit();

      const calculosSnapshot = await userRef.collection('calculos').get();
      const batch3 = firebaseServices.db.batch();
      calculosSnapshot.docs.forEach(doc => batch3.delete(doc.ref));
      await batch3.commit();

      const gpsTracksSnapshot = await userRef.collection('gps_tracks').get();
      const batchGps = firebaseServices.db.batch();
      gpsTracksSnapshot.docs.forEach(doc => batchGps.delete(doc.ref));
      await batchGps.commit();

      try {
        await firebaseServices.db.collection('gamification').doc(uid).delete();
      } catch (e) { console.warn('No se pudo borrar el documento de gamificación:', e); }

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

  cambiarSubtab(subtab) {
    document.querySelectorAll('.admin-subpanel').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-subtab').forEach(el => el.classList.remove('active'));

    if (subtab === 'control') {
      document.getElementById('adminControlPanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="control"]').classList.add('active');
    } else if (subtab === 'soporte') {
      document.getElementById('adminSoportePanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="soporte"]').classList.add('active');
      // Sin forzar: si la caché sigue vigente se reutiliza al instante;
      // si no, se recarga mostrando la animación "CARGANDO".
      this.cargarMensajesUsuarios();
    } else if (subtab === 'generar') {
      document.getElementById('adminGenerarPanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="generar"]').classList.add('active');
      if (window.SessionInvites) SessionInvites.mostrarHistorial();
    }
  },

  // ============================================================
  // NUEVO SISTEMA DE HILOS DE CONVERSACIÓN DE SOPORTE (VERSIÓN CON CARGA ESTÁNDAR)
  // ============================================================

  // Caché en memoria de la lista de conversaciones de soporte del admin.
  // _cacheSoporteVigente se pone a false (desde el listener de arriba, o
  // al forzar recarga) cada vez que hay un mensaje nuevo, uno enviado o
  // uno borrado; mientras siga en true se reutiliza la lista ya calculada
  // y no se vuelve a pedir nada a Firestore ni se muestra "CARGANDO".
  _cacheSoporteUsuarios: null,
  _cacheSoporteVigente: false,

  async cargarMensajesUsuarios(forzarRecarga = false) {
    if (!AppState.isAdmin) return;
    const container = document.getElementById('adminMessagesList');
    if (!container) return;

    if (!forzarRecarga && this._cacheSoporteVigente && this._cacheSoporteUsuarios) {
      this._renderizarListaSoporte(this._cacheSoporteUsuarios, container);
      return;
    }

    // Misma animación estándar de letras doradas que usa el resto de la
    // app ("EN PROCESO"), aquí con el texto "CARGANDO".
    container.innerHTML = '<div style="text-align:center; padding:40px;"><span id="adminSoporteLoadingText" style="font-size:15px; font-weight:bold; letter-spacing:1px;"></span></div>';
    const loadingTextEl = document.getElementById('adminSoporteLoadingText');
    if (loadingTextEl) Utils._animarTextoDorado(loadingTextEl, 'CARGANDO');

    try {
      const adminUid = AppState.currentUserId;
      const mensajes = await Storage.getMensajesSoporteAdmin();
      
      if (!mensajes || mensajes.length === 0) {
        this._cacheSoporteUsuarios = [];
        this._cacheSoporteVigente = true;
        container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes de soporte</p>';
        return;
      }

      // Agrupar por usuario (el que no es admin)
      const usuariosMap = new Map();
      for (const msg of mensajes) {
        const uid = msg.fromUid === adminUid ? msg.toUid : msg.fromUid;
        if (!uid || uid === adminUid) continue;

        if (!usuariosMap.has(uid)) {
          let userData = null;
          try {
            userData = await Storage.getUser(uid);
          } catch (e) {
            console.warn('Error obteniendo datos de usuario', uid, e);
          }
          usuariosMap.set(uid, {
            uid,
            username: userData?.username || 'Usuario',
            photoURL: userData?.profile?.photoURL || null,
            mensajes: [],
            ultimoMensaje: null,
            noLeidos: 0
          });
        }
        const entry = usuariosMap.get(uid);
        entry.mensajes.push(msg);
        if (!entry.ultimoMensaje || (msg.timestamp?.toMillis?.() || 0) > (entry.ultimoMensaje.timestamp?.toMillis?.() || 0)) {
          entry.ultimoMensaje = msg;
        }
        if (!msg.leido && msg.toUid === adminUid) {
          entry.noLeidos++;
        }
      }

      const usuarios = Array.from(usuariosMap.values());
      usuarios.sort((a, b) => {
        const tsA = a.ultimoMensaje?.timestamp?.toMillis?.() || 0;
        const tsB = b.ultimoMensaje?.timestamp?.toMillis?.() || 0;
        return tsB - tsA;
      });

      this._cacheSoporteUsuarios = usuarios;
      this._cacheSoporteVigente = true;

      this._renderizarListaSoporte(usuarios, container);

    } catch (error) {
      console.error('Error cargando mensajes de soporte:', error);
      container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--zone-5);">Error al cargar mensajes</p>';
    }
  },

  // Pinta la lista de conversaciones en el contenedor a partir de un
  // array de usuarios ya calculado (de Firestore o de la caché).
  _renderizarListaSoporte(usuarios, container) {
    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay conversaciones con usuarios.</p>';
      return;
    }

    let html = '';
    for (const user of usuarios) {
      const fecha = user.ultimoMensaje?.timestamp?.toDate ? user.ultimoMensaje.timestamp.toDate().toLocaleString() : '—';
      const textoPreview = user.ultimoMensaje?.texto ? Utils.escapeHTML(user.ultimoMensaje.texto.substring(0, 60)) : '';
      const badgeNoLeidos = user.noLeidos > 0 ? `<span class="nuevo-badge-mini">${user.noLeidos} nuevo${user.noLeidos > 1 ? 's' : ''}</span>` : '';
      const avatar = user.photoURL ? `<img src="${Utils.escapeHTML(user.photoURL)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` : `<div style="width:36px;height:36px;border-radius:50%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;">👤</div>`;
      html += `
        <div class="usuario-soporte-item" data-uid="${user.uid}" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:background 0.2s;">
          ${avatar}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-weight:600;color:var(--accent-yellow);">${Utils.escapeHTML(Utils.capitalizeUsername(user.username))}</span>
              <span style="font-size:11px;color:var(--text-secondary);">${fecha}</span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${textoPreview}</div>
          </div>
          ${badgeNoLeidos}
          <span style="font-size:11px;color:var(--accent-blue);background:var(--bg-primary);padding:2px 8px;border-radius:12px;">VER</span>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.usuario-soporte-item').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.dataset.uid;
        this.abrirConversacionSoporte(uid);
      });
    });
  },

  async abrirConversacionSoporte(uid) {
    // Mostrar la animación de carga estándar de la app
    Utils.showLoading();

    try {
      // Cargar los mensajes (ahora devuelve los datos)
      const mensajes = await this._cargarMensajesConversacion(uid);

      // Una vez cargados, crear el modal
      this._mostrarModalConversacion(uid, mensajes);
    } catch (error) {
      console.error('Error cargando conversación:', error);
      Utils.showToast('Error al cargar la conversación', 'error');
    } finally {
      // Ocultar la animación de carga
      Utils.hideLoading();
    }
  },

  // Función que carga los mensajes y los devuelve (no modifica el DOM)
  async _cargarMensajesConversacion(uid) {
    const adminUid = AppState.currentUserId;
    
    const snapshot1 = await firebaseServices.db.collection('soporteMensajes')
      .where('fromUid', '==', uid)
      .where('toUid', '==', adminUid)
      .get();
    
    const snapshot2 = await firebaseServices.db.collection('soporteMensajes')
      .where('fromUid', '==', adminUid)
      .where('toUid', '==', uid)
      .get();

    const todos = [...snapshot1.docs, ...snapshot2.docs]
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const tsA = a.timestamp?.toMillis?.() || 0;
        const tsB = b.timestamp?.toMillis?.() || 0;
        return tsA - tsB;
      });

    // Marcar mensajes como leídos
    const noLeidos = todos.filter(msg => !msg.leido && msg.toUid === adminUid);
    for (const msg of noLeidos) {
      try {
        await firebaseServices.db.collection('soporteMensajes').doc(msg.id).update({ leido: true });
      } catch (e) {
        console.warn('Error marcando mensaje como leído:', e);
      }
    }

    if (noLeidos.length > 0) {
      const unreadSnap = await firebaseServices.db.collection('soporteMensajes')
        .where('toUid', '==', adminUid)
        .where('leido', '==', false)
        .get();
      AppState.mensajesSoporteAdminNoLeidos = unreadSnap.size;
      AppState.actualizarBadgeSoporteAdmin();
      this.cargarMensajesUsuarios(true);
    }

    return todos;
  },

  // Función que crea y muestra el modal con los mensajes ya cargados
  _mostrarModalConversacion(uid, mensajes) {
    // Cerrar modal anterior si existe
    document.getElementById('conversacionSoporteModal')?.remove();
    document.getElementById('conversacionSoporteOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'conversacionSoporteOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      z-index:20000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.cerrarConversacionSoporte();
    });

    const modal = document.createElement('div');
    modal.id = 'conversacionSoporteModal';
    modal.style.cssText = `
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:16px; max-width:600px; width:90%;
      height:65vh; max-height:80vh;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:var(--shadow-lg); opacity:0; transition:opacity 0.2s ease;
    `;

    // Cabecera centrada
    const header = document.createElement('div');
    header.style.cssText = `
      display:flex; justify-content:center; align-items:center;
      padding:16px 20px; border-bottom:1px solid var(--border-color);
      background:var(--bg-primary); flex-shrink:0;
      position:relative;
    `;
    // Obtener nombre del usuario
    let nombreUsuario = 'Usuario';
    Storage.getUser(uid).then(userData => {
      if (userData?.username) nombreUsuario = Utils.capitalizeUsername(userData.username);
      const nombreEl = document.getElementById('conversacionNombre');
      if (nombreEl) nombreEl.textContent = nombreUsuario;
    }).catch(() => {});
    header.innerHTML = `
      <span style="font-size:16px; font-weight:bold; color:var(--accent-yellow); text-align:center;">
        💬 Soporte con <span id="conversacionNombre">${nombreUsuario}</span>
      </span>
    `;
    modal.appendChild(header);

    // Contenedor de mensajes
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'conversacionMensajes';
    messagesContainer.style.cssText = `
      flex:1; overflow-y:auto; padding:16px;
      display:flex; flex-direction:column; gap:8px;
      background:var(--bg-secondary);
      min-height:0;
    `;

    // Renderizar mensajes
    if (mensajes.length === 0) {
      messagesContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">No hay mensajes en esta conversación</p>';
    } else {
      const adminUid = AppState.currentUserId;
      for (const msg of mensajes) {
        const esAdmin = msg.fromUid === adminUid;
        const div = document.createElement('div');
        div.style.cssText = `
          max-width:75%; padding:8px 12px; border-radius:12px;
          ${esAdmin
            ? 'align-self:flex-end; background:var(--accent-blue); color:var(--bg-primary);'
            : 'align-self:flex-start; background:var(--bg-primary); color:var(--text-primary); border:1px solid var(--border-color);'
          }
          word-wrap:break-word;
        `;
        div.textContent = msg.texto;
        
        const time = document.createElement('div');
        time.style.cssText = `
          font-size:10px; margin-top:4px; text-align:right;
          ${esAdmin ? 'color:rgba(255,255,255,0.7);' : 'color:var(--text-secondary);'}
        `;
        const fecha = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : '';
        time.textContent = fecha;
        div.appendChild(time);
        messagesContainer.appendChild(div);
      }
      // Scroll al final
      setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 50);
    }
    modal.appendChild(messagesContainer);

    // Pie fijo: input + botón enviar
    const footer = document.createElement('div');
    footer.style.cssText = `
      display:flex; gap:8px; padding:12px 16px;
      border-top:1px solid var(--border-color);
      background:var(--bg-primary); flex-shrink:0;
      align-items:center;
    `;
    footer.innerHTML = `
      <input type="text" id="conversacionInput" placeholder="Escribe tu respuesta..." style="
        flex:1; margin:0; padding:0 12px; height:44px;
        border-radius:10px; background:var(--bg-secondary);
        border:1px solid var(--border-color); color:var(--text-primary);
        font-size:15px;
      ">
      <button id="conversacionEnviarBtn" class="action-button" style="
        width:auto; padding:0 24px; margin:0; height:44px; border-radius:10px;
        background:var(--accent-blue); color:var(--bg-primary); border:none;
        font-weight:bold; cursor:pointer; font-size:15px;
      ">ENVIAR</button>
    `;
    modal.appendChild(footer);

    // Botón cerrar abajo centrado
    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.style.cssText = `
      padding:12px 16px;
      border-top:1px solid var(--border-color);
      background:var(--bg-primary);
      display:flex; justify-content:center;
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'action-button';
    closeBtn.style.cssText = `
      width:auto; padding:0 24px; margin:0; border-radius:10px;
      background:transparent; border:1px solid var(--border-color-light);
      color:var(--text-primary); cursor:pointer; font-size:15px;
      height:44px;
    `;
    closeBtn.textContent = 'CERRAR';
    closeBtn.onclick = () => this.cerrarConversacionSoporte();
    closeButtonContainer.appendChild(closeBtn);
    modal.appendChild(closeButtonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

    // Eventos de envío
    const input = document.getElementById('conversacionInput');
    const sendBtn = document.getElementById('conversacionEnviarBtn');
    const enviar = () => {
      const texto = input.value.trim();
      if (!texto) return;
      this._enviarMensajeSoporte(uid, texto, messagesContainer);
      input.value = '';
    };
    sendBtn.addEventListener('click', enviar);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviar(); });

    this._conversacionAbierta = { uid, messagesContainer };
  },

  async _enviarMensajeSoporte(uid, texto, container) {
    const ok = await Storage.enviarMensajeSoporte(AppState.currentUserId, uid, texto);
    if (ok) {
      const div = document.createElement('div');
      div.style.cssText = `
        max-width:75%; padding:8px 12px; border-radius:12px;
        align-self:flex-end; background:var(--accent-blue); color:var(--bg-primary);
        word-wrap:break-word;
      `;
      div.textContent = texto;
      const time = document.createElement('div');
      time.style.cssText = 'font-size:10px; color:rgba(255,255,255,0.7); margin-top:4px; text-align:right;';
      time.textContent = new Date().toLocaleString();
      div.appendChild(time);
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      
      this.cargarMensajesUsuarios(true);
      Utils.showToast('✅ Mensaje enviado', 'success');
    } else {
      Utils.showToast('Error al enviar mensaje', 'error');
    }
  },

  cerrarConversacionSoporte() {
    const overlay = document.getElementById('conversacionSoporteOverlay');
    const modal = document.getElementById('conversacionSoporteModal');
    if (modal) modal.style.opacity = '0';
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        modal?.remove();
        overlay?.remove();
      }, 200);
    }
    this._conversacionAbierta = null;
  },

  // Funciones existentes de eliminación de mensajes (sin cambios)
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
      const fromName = tipo === 'recibido' ? otherName : miNombre;
      const toName = tipo === 'recibido' ? miNombre : otherName;
      const remitente = `De ${fromName} a ${toName}`;
      const icono = tipo === 'recibido' ? '📨' : '📤';
      html += `<div class="mensaje-item ${nuevoClass}" data-mensaje-id="${mensajeId}" data-doc-id="${msg.id || ''}" data-msg-index="${i}" data-tipo="${tipo}"> <div class="mensaje-header" data-msg-index="${i}" data-tipo="${tipo}"> <span class="mensaje-fecha">${icono} ${fecha}</span> <span class="mensaje-remitente">${Utils.escapeHTML(remitente)}</span> ${esNuevo ? '<span class="nuevo-badge">NUEVO</span>' : ''} </div> <div class="mensaje-contenido"> <p>${Utils.escapeHTML(msg.texto)}</p> </div> <div class="mensaje-botones"> <button class="eliminar" data-msg-index="${i}" data-tipo="${tipo}" onclick="UI.borrarMensajeUsuario(${i}, '${tipo}')">🗑️ ELIMINAR DE MI BANDEJA</button> </div> </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.mensaje-item').forEach(el => {
      const marcarLeidoSiCorresponde = () => {
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
      if (AppState) {
        AppState.planGeneradoActual = planCompleto.params;
        AppState.planActualId = planId;
        AppState.sesionesRealizadas = planCompleto.sesionesRealizadas || {};
        AppState.feedbackSesiones = planCompleto.feedback || {};
        AppState.trimestreActual = 0;
      }
      const calendario = document.getElementById("calendarioEntreno");
      const cuestionario = document.getElementById("cuestionarioEntreno");
      if (calendario) calendario.style.display = "block";
      if (cuestionario) cuestionario.style.display = "none";
      if (window.PlanGenerator) PlanGenerator.mostrarCalendario(planCompleto.sesiones);
      const resumen = document.getElementById("resumenObjetivo");
      if (resumen) resumen.innerText = planCompleto.resumen || 'Plan cargado';
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planCompleto.nombrePlan || 'Mi plan';

      if (typeof cargarDashboard === 'function') {
        cargarDashboard();
      }

      await window.switchTab('plan');
      this.guardarEstado();
      Utils.scrollToElement('calendarioEntreno', -20);
      Utils.hideLoading();
    } catch (e) {
      console.error('Error cargando plan:', e);
      Utils.hideLoading();
      Utils.showToast('Error al cargar el plan', 'error');
    }
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
    const teniaControllerAlRegistrar = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        console.log('✅ Service Worker (sw.js) registrado:', reg.scope);
        const comprobarActualizacion = () => reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') comprobarActualizacion();
        });
        window.addEventListener('online', comprobarActualizacion);
        setInterval(comprobarActualizacion, 60 * 60 * 1000);
      })
      .catch(err => console.warn('Error registrando Service Worker:', err));

    let recargando = false;
    const recargarSiProcede = (version) => {
      if (recargando) return;
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

  applyTheme();
};

window.addEventListener('storage', (e) => {
  if (e.key !== 'ri5_theme') return;
  document.body.classList.remove('manual-light', 'manual-dark');
  if (e.newValue === 'light') document.body.classList.add('manual-light');
  else if (e.newValue === 'dark') document.body.classList.add('manual-dark');
});

window.abrirGuiaModal = function() {
  const overlay = document.getElementById('guiaModalOverlay');
  const frame = document.getElementById('guiaModalFrame');
  if (!overlay || !frame) return;
  if (!frame.dataset.loaded) {
    frame.src = 'guia.html';
    frame.dataset.loaded = '1';
  } else {
    try { frame.contentWindow.scrollTo(0, 0); } catch (e) {}
  }
  overlay.style.display = 'block';
};

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

  const savedUid = localStorage.getItem('ri5_current_user');
  if (!savedUid) {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainContent").style.display = "none";
    if (typeof window._ri5MarcarAppLista === 'function') window._ri5MarcarAppLista();
  } else {
    Utils.showLoading();
    Auth.checkSavedSession();
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