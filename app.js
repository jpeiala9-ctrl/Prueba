// ==================== app.js - VERSIÓN COMPLETA (TIEMPO REAL TOTAL) CON PRECARGA ====================
// VERSIÓN: 4.24 - Badge de comunidad unificado (solicitudes + mensajes)
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

  safeInnerHTML(element, html) {
    if (!element) return;
    element.innerHTML = html;
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

  isOnline() {
    return navigator.onLine;
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
  isPremium: false,
  emailVerified: false,
  premiumExpiryDate: null,
  calculosMes: 0,
  mesActual: '',
  trimestreActual: 0,
  unsubscribeMensajes: null,
  isAdmin: false,

  solicitudesPendientesCount: 0,
  mensajesAmigosNoLeidos: 0,

  unsubscribeFriendRequests: null,
  unsubscribeConversations: null,
  unsubscribeMensajesSoporte: null,

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

  // ===== NUEVA FUNCIÓN PARA BADGE DE COMUNIDAD =====
  _actualizarBadgeComunidad() {
    const badge = document.getElementById('comunidadBadge');
    if (!badge) return;
    const total = (this.solicitudesPendientesCount || 0) + (this.mensajesAmigosNoLeidos || 0);
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
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

    const t = document.getElementById('ri5Title'); 
    if(t) { 
      if(this.isPremium && this.premiumExpiryDate && new Date() <= this.premiumExpiryDate) {
        t.classList.add('premium'); 
      } else {
        t.classList.remove('premium'); 
      }
    }

    if (this.currentUser) {
      const nameField = document.getElementById('name');
      if(nameField) nameField.value = this.currentUser;
    }

    this.actualizarInterfazPremium();
    this.verificarExpiracionPremium();

    const adminTab = document.getElementById('adminTabButton');
    if (adminTab) {
      adminTab.style.display = this.isAdmin ? 'inline-block' : 'none';
    }

    this.actualizarBotonCalcular();

    if (uid) {
      this.iniciarListeners();
      this.precargarDatos();
      if (window.UI) UI.restaurarEstado();
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

    const cargarBtn = document.getElementById('cargarPlanBtn');
    if (cargarBtn) cargarBtn.disabled = false;

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

  iniciarListeners() {
    this.detenerListeners();
    if (!this.currentUserId) return;

    this.unsubscribeFriendRequests = firebaseServices.db
      .collection('friendRequests')
      .where('to', '==', this.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const count = snapshot.size;
        if (this.solicitudesPendientesCount !== count) {
          this.solicitudesPendientesCount = count;
          this.actualizarBadgeSolicitudes();
          const activeTab = document.querySelector('.tab-button.active')?.textContent.toLowerCase();
          if (activeTab === 'amigos') {
            const activeAmigosTab = document.querySelector('.amigos-tab.active')?.textContent.toLowerCase();
            if (activeAmigosTab === 'solicitudes') {
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
      .collection('mensajes')
      .doc(this.currentUserId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          const mensajes = data.mensajes || [];
          const noLeidos = mensajes.filter(m => !m.leido && m.esAdmin).length;
          if (this.mensajesNoLeidos !== noLeidos) {
            this.mensajesNoLeidos = noLeidos;
            if (window.UI) UI.actualizarBadgeMensajes();
          }
        }
      }, (error) => {
        console.error('Error en listener de mensajes de soporte:', error);
      });
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
        listaTab.style.color = '#E67E22';
        listaTab.style.fontWeight = '600';
      } else {
        listaTab.style.color = '';
        listaTab.style.fontWeight = '';
      }
    }
    this._actualizarBadgeComunidad();
  }
};

// ==================== MÓDULO ADMIN (FASE 1 MEJORADO) ====================
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

  // Caché para perfiles (por 30 segundos)
  _profileCache: {},

  // --- Estadísticas ---
  async cargarEstadisticas() {
    try {
      const [totalUsers, premiumUsers, newUsers, sessionsToday] = await Promise.all([
        Storage.contarUsuarios(),
        Storage.contarUsuariosPremium(),
        Storage.contarUsuariosNuevos(7),
        Storage.contarSesionesHoy()
      ]);
      const elTotal = document.getElementById('statTotalUsers');
      const elPremium = document.getElementById('statPremiumUsers');
      const elNew = document.getElementById('statNewUsers');
      const elSessions = document.getElementById('statSessionsToday');
      if (elTotal) elTotal.textContent = totalUsers;
      if (elPremium) elPremium.textContent = premiumUsers;
      if (elNew) elNew.textContent = newUsers;
      if (elSessions) elSessions.textContent = sessionsToday;
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    }
  },

  // --- Filtros y ordenación ---
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
      let query = firebaseServices.db.collection('users')
        .orderBy('username_lowercase')
        .limit(20);

      if (this.usersPagination.searchTerm) {
        query = query.where('username_lowercase', '>=', this.usersPagination.searchTerm)
                     .where('username_lowercase', '<=', this.usersPagination.searchTerm + '\uf8ff');
      }

      if (this.usersPagination.lastDoc && !reset) {
        query = query.startAfter(this.usersPagination.lastDoc);
      }

      const snapshot = await query.get();

      if (reset) container.innerHTML = '';

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

      const usuariosVistos = JSON.parse(localStorage.getItem('admin_usuarios_vistos') || '[]');
      let usersData = snapshot.docs.map(doc => {
        const user = doc.data();
        const uid = doc.id;
        const username = Utils.capitalizeUsername(user.username) || '?';
        const email = Utils.escapeHTML(user.email || '?');
        const premium = user.premium ? 'SÍ' : 'NO';
        const expires = user.expires ? new Date(user.expires).toLocaleDateString() : '-';
        const calculos = user.calculosMes || 0;
        const created = user.created ? new Date(user.created).toLocaleDateString() : '-';
        const esNuevo = !usuariosVistos.includes(uid) && 
                       (user.created && new Date(user.created) > new Date(Date.now() - 7*24*60*60*1000));
        return { uid, username, email, premium, expires, calculos, created, esNuevo, user };
      });

      if (this.filtrosActuales.premium !== 'all') {
        const isPremium = this.filtrosActuales.premium === 'true';
        usersData = usersData.filter(u => u.user.premium === isPremium);
      }

      if (this.filtrosActuales.from) {
        const fromDate = new Date(this.filtrosActuales.from);
        fromDate.setHours(0,0,0,0);
        usersData = usersData.filter(u => {
          if (!u.user.created) return false;
          return new Date(u.user.created) >= fromDate;
        });
      }
      if (this.filtrosActuales.to) {
        const toDate = new Date(this.filtrosActuales.to);
        toDate.setHours(23,59,59,999);
        usersData = usersData.filter(u => {
          if (!u.user.created) return false;
          return new Date(u.user.created) <= toDate;
        });
      }

      if (this.filtrosActuales.sort === 'created') {
        usersData.sort((a, b) => new Date(b.user.created) - new Date(a.user.created));
      } else if (this.filtrosActuales.sort === 'premium') {
        usersData.sort((a, b) => (b.user.premium ? 1 : 0) - (a.user.premium ? 1 : 0));
      } else {
        usersData.sort((a, b) => a.username.localeCompare(b.username));
      }

      this.renderUsersList(usersData);

      if (!reset) {
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
    
    container.querySelectorAll('.usuario-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const item = header.closest('.usuario-item');
        if (item) {
          Admin.toggleUsuario(item, item.dataset.uid);
        }
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

  // --- Modal de detalle de usuario (OPTIMIZADO: consultas en paralelo y caché, SIN MENSAJE DE CARGA) ---
  async verPerfil(uid) {
    if (!AppState.isAdmin || !uid) return;
    try {
      const modal = document.getElementById('adminUserModal');
      const content = document.getElementById('adminModalContent');
      const title = document.getElementById('adminModalTitle');

      // Abrir el modal directamente (sin mensaje de carga)
      if (modal) modal.classList.add('active');
      if (title) title.textContent = '👤 Cargando...';

      // Verificar caché (30 segundos)
      const cacheKey = `profile_${uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30000) {
            // Usar caché
            this._renderProfile(uid, data.userData, data.gam, data.entrenos);
            return;
          }
        } catch (e) {}
      }

      // Consultas en paralelo
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
        modal.classList.remove('active');
        return;
      }

      const userData = userDoc.data();
      const entrenos = entrenosSnapshot;

      // Guardar en caché
      const cacheData = {
        userData,
        gam,
        entrenos: entrenos.docs.map(d => ({ id: d.id, ...d.data() }))
      };
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: cacheData, timestamp: Date.now() }));

      // Renderizar
      this._renderProfile(uid, userData, gam, entrenos);

    } catch (error) {
      console.error('Error viendo perfil:', error);
      Utils.showToast('Error al cargar perfil', 'error');
      document.getElementById('adminUserModal').classList.remove('active');
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
  },

  cerrarModalUsuario() {
    document.getElementById('adminUserModal').classList.remove('active');
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
          const premium = user.premium ? '⭐' : '';
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

    } catch (error) {
      console.error('Error al cargar lista de usuarios:', error);
      content.innerHTML = '<p style="text-align:center; padding:20px; color:var(--zone-5);">Error al cargar la lista</p>';
    } finally {
      Utils.hideLoading();
    }
  },

  cerrarListModal() {
    document.getElementById('adminListModal').style.display = 'none';
  },

  // --- Resto de funciones de admin (sin cambios) ---
  abrirMensajeUsuario(uid, username) {
    const texto = prompt(`Escribe el mensaje para ${username}:`);
    if (texto && texto.trim()) this.enviarMensajeUsuario(uid, texto.trim());
  },

  async enviarMensajeUsuario(uid, texto) {
    if (!AppState.isAdmin || !uid || !texto) return;
    Utils.showLoading();
    try {
      await Storage.enviarMensajeAdminAUsuario(uid, texto);
      Utils.showToast(`✅ Mensaje enviado a usuario`, 'success');
    } catch (error) { console.error('Error enviando mensaje:', error); Utils.showToast('Error al enviar mensaje', 'error'); }
    finally { Utils.hideLoading(); }
  },

  async eliminarUsuario(uid, username) {
    if (!AppState.isAdmin || !uid) return;
    const confirmado = await Utils.confirm(
      'ELIMINAR USUARIO',
      `¿Estás seguro de eliminar permanentemente a "${username}"?\n\nSe borrarán todos sus datos (perfil, historial, planes, mensajes).\nLa cuenta de acceso seguirá existiendo pero sin datos.`
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
      for (const planDoc of planesSnapshot.docs) {
        const sesionesSnapshot = await planDoc.ref.collection('sesiones').get();
        const batch2 = firebaseServices.db.batch();
        sesionesSnapshot.docs.forEach(doc => batch2.delete(doc.ref));
        await batch2.commit();
        await planDoc.ref.delete();
      }

      const calculosSnapshot = await userRef.collection('calculos').get();
      const batch3 = firebaseServices.db.batch();
      calculosSnapshot.docs.forEach(doc => batch3.delete(doc.ref));
      await batch3.commit();

      await firebaseServices.db.collection('mensajes').doc(uid).delete();
      await firebaseServices.db.collection('mensajes').doc('admin_' + uid).delete();
      await userRef.delete();

      Utils.showToast(`✅ Usuario ${username} eliminado (datos borrados)`, 'success');
      this.cargarUsuarios(true);
      this.cargarEstadisticas();
    } catch (error) { console.error('Error eliminando usuario:', error); Utils.showToast('Error al eliminar usuario: ' + error.message, 'error'); }
    finally { Utils.hideLoading(); }
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
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
  },

  cerrarModalPremium() {
    const modal = document.getElementById('premiumManageModal');
    const overlay = document.getElementById('premiumManageOverlay');
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
    } catch (error) { console.error('Error actualizando premium:', error); Utils.showToast('Error: ' + error.message, 'error'); }
    finally { Utils.hideLoading(); }
  },

  // --- Mensajes de usuarios ---
  async borrarMensajeUsuario(uid, idx) {
    if (!AppState.isAdmin) return;

    const confirmed = await Utils.confirm('ELIMINAR MENSAJE', '¿Eliminar este mensaje permanentemente?');
    if (!confirmed) return;

    Utils.showLoading();

    try {
      const docRef = firebaseServices.db.collection('mensajes').doc('admin_' + uid);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        let mensajes = Array.isArray(data.mensajes) ? data.mensajes : [];
        
        if (idx >= 0 && idx < mensajes.length) {
          mensajes.splice(idx, 1);
          await docRef.set({ mensajes });
          
          Utils.showToast('✅ Mensaje eliminado', 'success');
          await this.cargarMensajesUsuarios(true);
        } else {
          Utils.showToast('❌ Mensaje no encontrado', 'error');
        }
      }
    } catch (error) {
      console.error('Error borrando mensaje:', error);
      Utils.showToast('Error al eliminar mensaje: ' + error.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async cargarMensajesUsuarios(reset = false) {
    if (!AppState.isAdmin) return;
    if (this.messagesPagination.loading) return;

    this.messagesPagination.loading = true;
    const container = document.getElementById('adminMessagesList');
    if (!container) return;

    if (reset) {
      container.innerHTML = '<div style="text-align:center; padding:40px; color: var(--text-secondary);">⏳ Cargando mensajes...</div>';
      this.messagesPagination.lastDoc = null;
      this.messagesPagination.hasMore = true;
      this.messagesPagination.allMessagesCache = [];
    }

    try {
      const limit = 10;
      const { docs, lastDoc } = await Storage.getAdminMessagesPaginated(limit, this.messagesPagination.lastDoc);
      
      this.messagesPagination.lastDoc = lastDoc;
      this.messagesPagination.hasMore = docs.length === limit;
      
      let allMessages = [];
      const mensajesVistos = JSON.parse(sessionStorage.getItem('admin_mensajes_vistos') || '[]');
      
      for (const doc of docs) {
        const uid = doc.id.replace('admin_', '');
        const mensajes = doc.data().mensajes || [];
        
        mensajes.forEach((msg, idx) => {
          const username = msg.username || 'Usuario';
          const mensajeId = `${uid}_${idx}`;
          allMessages.push({
            ...msg,
            fromUid: uid,
            username: Utils.capitalizeUsername(username),
            mensajeIdx: idx,
            mensajeId,
            docId: doc.id,
            esNuevo: !msg.leido && !mensajesVistos.includes(mensajeId),
            texto: Utils.escapeHTML(msg.texto)
          });
        });
      }
      
      allMessages.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      if (reset) {
        this.messagesPagination.allMessagesCache = allMessages;
      } else {
        this.messagesPagination.allMessagesCache = [...this.messagesPagination.allMessagesCache, ...allMessages];
      }
      
      this.renderMessagesList(this.messagesPagination.allMessagesCache);
      
      const loadMoreBtn = document.getElementById('loadMoreMessagesBtn');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = this.messagesPagination.hasMore ? 'block' : 'none';
        if (!this.messagesPagination.hasMore && this.messagesPagination.allMessagesCache.length === 0) {
          container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes de usuarios</p>';
        }
      }
      
    } catch (error) {
      console.error('Error cargando mensajes de usuarios:', error);
      container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--zone-5);">Error al cargar mensajes</p>';
    } finally {
      this.messagesPagination.loading = false;
    }
  },
  
  renderMessagesList(messages) {
    const container = document.getElementById('adminMessagesList');
    if (!container) return;
    
    if (messages.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes de usuarios</p>';
      return;
    }
    
    let html = '';
    for (const msg of messages) {
      const nuevoClass = msg.esNuevo ? 'nuevo' : '';
      html += `
        <div class="mensaje-item ${nuevoClass}" data-mensaje-id="${msg.mensajeId}" data-uid="${msg.fromUid}" data-msg-idx="${msg.mensajeIdx}">
          <div class="mensaje-header" data-mensaje-id="${msg.mensajeId}">
            <span class="mensaje-fecha">📨 ${msg.fecha}</span>
            <span class="mensaje-remitente">${Utils.escapeHTML(msg.username)}</span>
            ${msg.esNuevo ? '<span class="nuevo-badge">NUEVO</span>' : ''}
          </div>
          <div class="mensaje-contenido">
            <p>${msg.texto}</p>
          </div>
          <div class="mensaje-botones">
            <button class="responder" data-uid="${msg.fromUid}" data-username="${Utils.escapeHTML(msg.username)}">✉️ RESPONDER</button>
            <button class="eliminar" data-uid="${msg.fromUid}" data-msg-idx="${msg.mensajeIdx}">🗑️ ELIMINAR</button>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('.responder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Admin.responderMensaje(btn.dataset.uid, btn.dataset.username);
      });
    });
    container.querySelectorAll('.eliminar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Admin.borrarMensajeUsuario(btn.dataset.uid, parseInt(btn.dataset.msgIdx));
      });
    });
    container.querySelectorAll('.mensaje-item').forEach(item => {
      const header = item.querySelector('.mensaje-header');
      if (header) {
        header.addEventListener('click', () => Admin.toggleMensaje(item, item.dataset.mensajeId));
      } else {
        item.addEventListener('click', () => Admin.toggleMensaje(item, item.dataset.mensajeId));
      }
    });
  },
  
  cargarMasMensajesAdmin() {
    if (this.messagesPagination.hasMore && !this.messagesPagination.loading) {
      this.cargarMensajesUsuarios(false);
    }
  },

  toggleMensaje(element, mensajeId) {
    if (!element) return;
    element.classList.toggle('abierto');
    if (element.classList.contains('nuevo')) {
      const mensajesVistos = JSON.parse(sessionStorage.getItem('admin_mensajes_vistos') || '[]');
      if (!mensajesVistos.includes(mensajeId)) {
        mensajesVistos.push(mensajeId);
        sessionStorage.setItem('admin_mensajes_vistos', JSON.stringify(mensajesVistos));
      }
      element.classList.remove('nuevo');
      const badge = element.querySelector('.nuevo-badge');
      if (badge) badge.remove();
    }
  },

  responderMensaje(uid, username) { this.abrirMensajeUsuario(uid, username); },

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
      let enviados = 0, errores = 0;

      const lotes = [];
      for (let i = 0; i < users.length; i += 10) {
        const lote = users.slice(i, i + 10).map(async (userDoc) => {
          try { await Storage.enviarMensajeAdminAUsuario(userDoc.id, texto); enviados++; }
          catch (e) { console.error(`Error enviando a ${userDoc.id}:`, e); errores++; }
        });
        lotes.push(Promise.all(lote));
      }
      await Promise.all(lotes);
      Utils.showToast(`✅ Mensajes enviados: ${enviados} correctos, ${errores} errores`, errores === 0 ? 'success' : 'warning');
      if (broadcastEl) broadcastEl.value = '';
    } catch (error) { console.error('Error en envío masivo:', error); Utils.showToast('Error al enviar mensajes: ' + error.message, 'error'); }
    finally { Utils.hideLoading(); }
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
    if (window.Chat && window.Chat.closeChat) {
      window.Chat.closeChat();
    }

    if (tab !== 'muro' && window.Wall) {
      Wall.detenerListener();
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
        await this.cargarHistorialCompleto(true);
      }
      if(tab === 'plan') {
        await this.cargarHistorialPlanes();
      }
      if(tab === 'soporte') { 
        await this.cargarMensajesRecibidos(); 
        await this.cargarMensajesEnviados(); 
      }
      if(tab === 'perfil') {
        if (window.Profile) await Profile.cargarPerfil();
      }
      if(tab === 'amigos') {
        if (window.Friends) {
          await Friends.actualizarBadgeSolicitudes();
          const activeAmigosTab = document.querySelector('.amigos-tab.active');
          if (activeAmigosTab) {
            const tabText = activeAmigosTab.textContent.toLowerCase();
            if (tabText.includes('buscar')) {
              if (!Friends.todosUsuariosPagination.lastDoc) {
                await Friends.cargarTodosUsuarios(true);
              }
            } else if (tabText.includes('solicitudes')) {
              await Friends.cargarSolicitudesRecibidas();
            } else if (tabText.includes('mis amigos')) {
              await Friends.cargarListaAmigos();
            }
          } else {
            await Friends.cargarTodosUsuarios(true);
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
        await Admin.cargarUsuarios(true);
        await Admin.cargarEstadisticas();
        await Admin.cargarMensajesUsuarios(true);
      }
    } catch (error) {
      console.error(`Error cargando pestaña ${tab}:`, error);
      Utils.showToast('Error al cargar contenido', 'error');
    }

    this.guardarEstado();
  },

  renderMessageList(container, mensajes, tipo, onToggleCallback) {
    if (!container) return;
    if (!mensajes.length) { container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes</p>'; return; }
    const mensajesVistos = JSON.parse(sessionStorage.getItem(`user_mensajes_vistos_${tipo}`) || '[]');
    let html = '';
    mensajes.forEach((msg, i) => {
      const mensajeId = `${tipo}_${i}`;
      const esNuevo = !msg.leido && !mensajesVistos.includes(mensajeId);
      const nuevoClass = esNuevo ? 'nuevo' : '';
      const fecha = msg.fecha;
      const remitente = msg.esAdmin ? 'Admin' : (msg.esUsuario ? 'Tú' : 'Soporte');
      const icono = msg.esAdmin ? '📨' : (msg.esUsuario ? '📤' : '💬');
      html += `<div class="mensaje-item ${nuevoClass}" data-mensaje-id="${mensajeId}" data-msg-index="${i}" data-tipo="${tipo}"> <div class="mensaje-header" data-msg-index="${i}" data-tipo="${tipo}"> <span class="mensaje-fecha">${icono} ${fecha}</span> <span class="mensaje-remitente">${Utils.escapeHTML(remitente)}</span> ${esNuevo ? '<span class="nuevo-badge">NUEVO</span>' : ''} </div> <div class="mensaje-contenido"> <p>${Utils.escapeHTML(msg.texto)}</p> </div> <div class="mensaje-botones"> ${onToggleCallback ?`<button class="responder" data-msg-index="${i}" data-tipo="${tipo}">✉️ RESPONDER</button>`: ''} <button class="eliminar" data-msg-index="${i}" data-tipo="${tipo}">🗑️ ELIMINAR</button> </div> </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.mensaje-item').forEach(el => {
      const header = el.querySelector('.mensaje-header');
      if (header) {
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(el.dataset.msgIndex);
          const tipoMsg = el.dataset.tipo;
          const mensajeId = el.dataset.mensajeId;
          el.classList.toggle('abierto');
          if (!el.classList.contains('nuevo') && AppState.currentUserId) {
            Storage.marcarLeido(AppState.currentUserId, idx);
          }
          if (el.classList.contains('nuevo')) {
            const vistos = JSON.parse(sessionStorage.getItem(`user_mensajes_vistos_${tipoMsg}`) || '[]');
            if (!vistos.includes(mensajeId)) {
              vistos.push(mensajeId);
              sessionStorage.setItem(`user_mensajes_vistos_${tipoMsg}`, JSON.stringify(vistos));
            }
            el.classList.remove('nuevo');
            const badge = el.querySelector('.nuevo-badge');
            if (badge) badge.remove();
            Storage.getMensajesUsuario(AppState.currentUserId).then(msgs => {
              AppState.mensajesNoLeidos = msgs.filter(m => !m.leido).length;
              this.actualizarBadgeMensajes();
            });
          }
        });
      } else {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.eliminar') || e.target.closest('.responder')) return;
          const idx = parseInt(el.dataset.msgIndex);
          const tipoMsg = el.dataset.tipo;
          const mensajeId = el.dataset.mensajeId;
          el.classList.toggle('abierto');
          if (!el.classList.contains('nuevo') && AppState.currentUserId) {
            Storage.marcarLeido(AppState.currentUserId, idx);
          }
          if (el.classList.contains('nuevo')) {
            const vistos = JSON.parse(sessionStorage.getItem(`user_mensajes_vistos_${tipoMsg}`) || '[]');
            if (!vistos.includes(mensajeId)) {
              vistos.push(mensajeId);
              sessionStorage.setItem(`user_mensajes_vistos_${tipoMsg}`, JSON.stringify(vistos));
            }
            el.classList.remove('nuevo');
            const badge = el.querySelector('.nuevo-badge');
            if (badge) badge.remove();
            Storage.getMensajesUsuario(AppState.currentUserId).then(msgs => {
              AppState.mensajesNoLeidos = msgs.filter(m => !m.leido).length;
              this.actualizarBadgeMensajes();
            });
          }
        });
      }
      const responderBtn = el.querySelector('.responder');
      if (responderBtn) {
        responderBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = responderBtn.dataset.msgIndex;
          const tipoMsg = responderBtn.dataset.tipo;
          if (onToggleCallback) {
            eval(onToggleCallback);
          }
        });
      }
      const eliminarBtn = el.querySelector('.eliminar');
      if (eliminarBtn) {
        eliminarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(eliminarBtn.dataset.msgIndex);
          const tipoMsg = eliminarBtn.dataset.tipo;
          UI.borrarMensajeUsuario(idx, tipoMsg);
        });
      }
    });
  },

  async cargarMensajesRecibidos() {
    const container = document.getElementById('listaMensajesRecibidos');
    if (!container || !AppState.currentUserId) return;
    const msgs = await Storage.getMensajesUsuario(AppState.currentUserId);
    this.renderMessageList(container, msgs, 'recibido', null);
    this.actualizarBadgeMensajes();
  },

  async cargarMensajesEnviados() {
    const container = document.getElementById('listaMensajesEnviados');
    if (!container || !AppState.currentUserId) return;
    const msgs = await Storage.getMensajesEnviadosUsuario(AppState.currentUserId);
    this.renderMessageList(container, msgs, 'enviado', null);
  },

  async borrarMensajeUsuario(i, tipo) {
    if(!AppState || !AppState.currentUserId) return;
    const confirmed = await Utils.confirm('Eliminar mensaje', '¿Eliminar?');
    if(!confirmed) return;
    try {
      if (tipo === 'enviado') {
        await Storage.borrarMensajeEnviadoUsuario(AppState.currentUserId, i);
        await this.cargarMensajesEnviados();
      } else {
        await Storage.borrarMensajeUsuario(AppState.currentUserId, i);
        await this.cargarMensajesRecibidos();
      }
      Utils.showToast('✅ Eliminado', 'success');
    }
    catch (error) { console.error('Error borrando mensaje:', error); Utils.showToast('Error al eliminar', 'error'); }
  },

  async enviarMensajeUsuario() {
    if(!AppState || !AppState.currentUserId) return;
    const t = document.getElementById('mensajeUsuario')?.value.trim();
    if(!t) { Utils.showToast('Escribe un mensaje', 'warning'); return; }
    try { await Storage.enviarMensajeUsuario(AppState.currentUserId, t); if (document.getElementById('mensajeUsuario')) document.getElementById('mensajeUsuario').value = ''; Utils.showToast('✅ Mensaje enviado', 'success'); await this.cargarMensajesEnviados(); }
    catch (error) { console.error('Error enviando mensaje:', error); Utils.showToast('Error al enviar', 'error'); }
  },

  cambiarSoporteTab(tab) {
    const soporteTabs = document.querySelectorAll('#tab-soporte .soporte-tab');
    const soportePanels = document.querySelectorAll('#tab-soporte .soporte-panel');
    soporteTabs.forEach(t => t.classList.remove('active'));
    soportePanels.forEach(p => p.classList.remove('active'));
    if(tab === 'recibidos') {
      if (soporteTabs[0]) soporteTabs[0].classList.add('active');
      const recibidos = document.getElementById('soporte-recibidos');
      if (recibidos) recibidos.classList.add('active');
    } else {
      if (soporteTabs[1]) soporteTabs[1].classList.add('active');
      const enviados = document.getElementById('soporte-enviados');
      if (enviados) enviados.classList.add('active');
    }
  },

  actualizarBadgeMensajes() {
    const t = document.getElementById('soporteTabButton');
    if(t && AppState) {
      if(AppState.mensajesNoLeidos > 0) t.classList.add('soporte-unread');
      else t.classList.remove('soporte-unread');
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
    const activeTab = document.querySelector('.tab-button.active')?.textContent.toLowerCase() || 'entreno';
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
            const activeTab = document.querySelector('.tab-button.active')?.textContent.toLowerCase();
            if (activeTab !== 'plan') {
              await this.switchTab('plan');
            } else {
              this.guardarEstado();
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Error restaurando plan desde localStorage:', e);
      }
    }
    const estadoStr = sessionStorage.getItem('ri5_estado');
    if (!estadoStr) return;
    try {
      const estado = JSON.parse(estadoStr);
      if (estado.activeTab) {
        const tabMap = { 'entreno': 'entreno', 'plan': 'plan', 'historial': 'historial', 'soporte': 'soporte', 'perfil': 'perfil', 'amigos': 'amigos', 'muro': 'muro', 'admin': 'admin' };
        const tab = tabMap[estado.activeTab] || 'entreno';
        await this.switchTab(tab);
      }
      if (estado.planVisible && estado.planId && AppState && AppState.currentUserId) {
        const planExiste = await Storage.getPlanCompleto(AppState.currentUserId, estado.planId);
        if (planExiste && planExiste.sesiones && planExiste.sesiones.length > 0) {
          if (AppState) {
            AppState.trimestreActual = estado.trimestre || 0;
            AppState.planActualId = estado.planId;
            AppState.sesionesRealizadas = planExiste.sesionesRealizadas || {};
            AppState.feedbackSesiones = planExiste.feedback || {};
            AppState.planGeneradoActual = planExiste.params;
          }
          await this.cargarPlanDesdeHistorial(estado.planId);
        }
      }
    } catch (e) { console.warn('Error restaurando estado', e); }
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

  async cargarHistorial() { await this.cargarHistorialCompleto(true); },
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
        html += `<div class="plan-card" data-plan-id="${plan.id}"> <div class="plan-info" onclick="cargarPlanDesdeHistorial('${plan.id}')"> <div class="plan-fecha">📅 ${Utils.escapeHTML(fecha)}</div> <div class="plan-resumen">${Utils.escapeHTML(distancia)} · ${Utils.escapeHTML(params.diasPorSemana || '?')} días · ${Utils.escapeHTML(params.nivel || '')}</div> </div> <button class="delete-plan" onclick="event.stopPropagation(); eliminarPlanHistorial('${plan.id}')">🗑️</button> </div>`;
      });
      container.innerHTML = html;
    } catch (error) { console.error('Error cargando historial de planes:', error); section.style.display = 'none'; }
  },

  async guardarPlanEnHistorial(planParams, planCompleto) {
    if (!AppState || !AppState.currentUserId || !AppState.isPremium) return;
    if (!planCompleto || !planCompleto.sesiones || !Array.isArray(planCompleto.sesiones) || planCompleto.sesiones.length === 0) { console.error('❌ Plan inválido, no se guarda en historial'); return; }
    try {
      const mapaDist = { "2k":"2 km", "5k":"5 km", "10k":"10 km", "medio":"MEDIA", "maraton":"MARATÓN" };
      const resumen = `${mapaDist[planParams.distancia] || planParams.distancia} · ${planParams.diasPorSemana} días · ${planParams.nivel}`;
      const planExistente = await Storage.getPlanCompleto(AppState.currentUserId, planParams.planId);
      if (planExistente) { console.log('📌 Plan ya existe, no se duplica'); return; }
      await Storage.savePlanCompleto(AppState.currentUserId, planParams.planId, planCompleto);
      await this.cargarHistorialPlanes();
      console.log('✅ Plan guardado en historial correctamente');
    } catch (error) { console.error('Error guardando plan en historial:', error); }
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
    try { await Storage.deletePlan(AppState.currentUserId, planId); await this.cargarHistorialPlanes(); if (document.getElementById('tab-historial')?.classList.contains('active')) { if (AppState) AppState.resetHistorialPagination(); await this.cargarHistorialCompleto(true); } Utils.showToast('✅ Plan eliminado', 'success'); }
    catch (error) { console.error('Error eliminando plan:', error); Utils.showToast('Error al eliminar', 'error'); }
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
    if('serviceWorker' in navigator) {
      const sw = `const CACHE='ri5-cache-v1'; const urls=['.','https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js']; self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(urls)))); self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))); self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>k!==CACHE?caches.delete(k):null)))));`;
      const b = new Blob([sw], {type:'application/javascript'});
      navigator.serviceWorker.register(URL.createObjectURL(b)).catch(console.log);
    }
  }
};

// ==================== MÓDULO DE TEMA ====================
window.toggleTheme = function(btn) {
  if (!btn) return;
  btn.classList.add('ripple');
  setTimeout(() => btn.classList.remove('ripple'), 600);
  if (document.body.classList.contains('manual-light')) {
    document.body.classList.remove('manual-light');
    document.body.classList.add('manual-dark');
    localStorage.setItem('ri5_theme', 'dark');
  } else if (document.body.classList.contains('manual-dark')) {
    document.body.classList.remove('manual-dark');
    document.body.classList.add('manual-light');
    localStorage.setItem('ri5_theme', 'light');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.body.classList.add('manual-light');
      localStorage.setItem('ri5_theme', 'light');
    } else {
      document.body.classList.add('manual-dark');
      localStorage.setItem('ri5_theme', 'dark');
    }
  }
  Utils.vibrate(30);
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
window.borrarMensajeUsuario = async function(i, tipo) { if (UI && UI.borrarMensajeUsuario) await UI.borrarMensajeUsuario(i, tipo); };
window.cambiarSoporteTab = function(tab) { if (UI && UI.cambiarSoporteTab) UI.cambiarSoporteTab(tab); };
window.cargarPlanDesdeHistorial = async function(planId) { if (UI && UI.cargarPlanDesdeHistorial) await UI.cargarPlanDesdeHistorial(planId); };
window.eliminarPlanHistorial = async function(planId) { if (UI && UI.eliminarPlanHistorial) await UI.eliminarPlanHistorial(planId); };
window.cerrarPlan = function() { if (UI && UI.cerrarPlan) UI.cerrarPlan(); };
window.cerrarModalPremium = function() {
  const modal = document.getElementById('premiumManageModal');
  const overlay = document.getElementById('premiumManageOverlay');
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (Admin) Admin.currentEditUserId = null;
};
window.cerrarModalSesion = function() {
  document.getElementById("detalleSesion")?.classList.remove("visible");
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

window.cargarMasMensajesAdmin = () => Admin.cargarMasMensajesAdmin();

const ResetPassword = {
  abrirModal() {
    const overlay = document.getElementById('resetOverlay');
    const modal = document.getElementById('resetModal');
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'block';
    const email = document.getElementById('resetEmail');
    if (email) email.value = '';
    const error = document.getElementById('resetError');
    if (error) error.classList.remove('visible');
  },
  cerrarModal() {
    const overlay = document.getElementById('resetOverlay');
    const modal = document.getElementById('resetModal');
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

// ==================== INICIALIZACIÓN CORRECTA (ESPERANDO A AUTH) ====================
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

  if(!localStorage.getItem('ri5_info_visto')) {
    setTimeout(() => {
      const banner = document.getElementById('infoBanner');
      if (banner) banner.style.display = 'block';
    }, 1000);
  }

  if (!window.firebaseServices) {
    console.error('❌ Firebase no está configurado');
    Utils.showToast('Error de configuración', 'error');
    return;
  }

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

  document.addEventListener('click', function(e) {
    let target = e.target;
    let premiumElement = null;
    
    if (target.innerText === 'PREMIUM') {
      premiumElement = target;
    } else if (target.parentElement && target.parentElement.innerText === 'PREMIUM') {
      premiumElement = target.parentElement;
    } else if (target.closest && target.closest('[class*="premium"]')) {
      premiumElement = target.closest('[class*="premium"]');
    }
    
    if (premiumElement) {
      const perfilTab = document.getElementById('tab-perfil');
      if (perfilTab && perfilTab.classList.contains('active')) {
        e.preventDefault();
        e.stopPropagation();
        Utils.showToast('📱 Para actualizar a Premium, contacta con el administrador', 'info', 4000);
        Utils.confirm(
          'Contactar con Administrador',
          '¿Quieres contactar con el administrador para obtener Premium?\n\nAceptar te llevará a Instagram (@coachjoaquinpeinado)'
        ).then((resultado) => {
          if (resultado) {
            window.open('https://www.instagram.com/coachjoaquinpeinado', '_blank');
          }
        }).catch(() => {});
      }
    }
  });

  const savedUid = localStorage.getItem('ri5_current_user');
  if (!savedUid) {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainContent").style.display = "none";
  } else {
    Utils.showLoading();
  }

  if (window.Training && Training._loadFromLocalStorage) {
    const savedCalc = Training._loadFromLocalStorage();
    if (savedCalc && AppState && !AppState.zonasCalculadas) {
      AppState.setLastCalc(savedCalc);
      if (document.getElementById('tab-entreno') && document.getElementById('tab-entreno').classList.contains('active')) {
        Training.mostrarResultados(savedCalc);
      } else {
        console.log('📦 Cálculo restaurado en segundo plano desde localStorage');
      }
    }
  }

  console.log('✅ RI5 inicializado correctamente');
});

window.toggleUsuario = (element, uid) => Admin.toggleUsuario(element, uid);
window.toggleMensaje = (element, mensajeId) => Admin.toggleMensaje(element, mensajeId);
window.UI = UI;

window.instalarPWA = () => PWA.instalarPWA();
window.cerrarBannerPWA = () => PWA.cerrarBannerPWA();
window.changeDailyTip = () => UI.changeDailyTip();
window.changeConsejo = () => UI.changeConsejo();
window.cerrarPremiumModal = () => {
  document.getElementById('premiumOverlay')?.classList.remove('active');
  document.getElementById('premiumModal')?.classList.remove('active');
};
window.contactarAdmin = () => {
  window.open('https://www.instagram.com/coachjoaquinpeinado', '_blank');
};
window.cerrarInfoBanner = () => {
  const noMostrar = document.getElementById('infoBannerDontShow')?.checked;
  if (noMostrar) {
    localStorage.setItem('ri5_info_visto', 'true');
  }
  document.getElementById('infoBanner').style.display = 'none';
  document.getElementById('infoBannerOverlay').style.display = 'none';
};
window.cerrarWelcomeModal = () => {
  document.getElementById('welcomeOverlay')?.classList.remove('active');
  document.getElementById('welcomeModal')?.classList.remove('active');
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