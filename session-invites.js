// ==================== session-invites.js ====================
// Módulo "Generar sesión" del panel de administración.
//
// Permite a un admin crear una sesión de entrenamiento completa
// (misma info que el modal de detalle de sesión del calendario, sin
// GPS/marcar/feedback), elegir un día del calendario y enviársela a
// los usuarios que quiera. El usuario la recibe como un modal de
// aceptar/rechazar; si acepta, se sobreescribe la sesión de ese día
// en su plan actual.
//
// Colección Firestore: sessionInvites/{inviteId}
//   { fromUid, fromUsername, toUid, toUsername, status,
//     fecha: 'YYYY-MM-DD', sesion: {tipo, duracion, detalle{...}},
//     createdAt }
// ====================

const SessionInvites = {
  unsubscribe: null,
  _shownIds: new Set(),

  _editable: null,
  _mesCalendario: null,
  _fechaSeleccionada: null,
  _usuariosTodos: null,
  _usuariosSeleccionados: null,

  // ==================================================================
  //  ADMIN: GENERADOR DE SESIÓN (paso 1: tarjeta editable)
  // ==================================================================

  abrirGenerador() {
    this._editable = {
      tipo: 'rodaje',
      duracion: 45,
      detalle: {
        nombre: '',
        objetivo: '',
        porque: '',
        sensacion: '',
        distanciaEstimada: 0,
        tssEstimada: 0,
        zona: 'Z2',
        ritmoObjetivo: '',
        pasosDetallados: [
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '' },
          { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '' },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '' }
        ]
      }
    };
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechaSeleccionada = null;
    this._usuariosSeleccionados = new Set();
    this._renderPaso1();
  },

  _tipoEmoji(tipo) {
    return { rodaje: '🏃‍♂️', tempo: '⚡', series: '🔁', largo: '📏', strength: '💪' }[tipo] || '🏃';
  },

  _crearOverlayModal(id) {
    document.getElementById(id + 'Modal')?.remove();
    document.getElementById(id + 'Overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = id + 'Overlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      z-index:60000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = id + 'Modal';
    modal.style.cssText = `
      background:var(--bg-secondary); border-radius:20px;
      width:92%; max-width:700px; max-height:88vh;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:0 20px 40px rgba(0,0,0,0.5);
      border:1px solid var(--border-color);
      font-family:'Courier New',monospace;
      opacity:0; transition:opacity 0.2s ease;
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });
    return { overlay, modal };
  },

  _cerrarModal(id) {
    const modal = document.getElementById(id + 'Modal');
    const overlay = document.getElementById(id + 'Overlay');
    if (modal) modal.style.opacity = '0';
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
  },

  _renderPaso1() {
    const { modal } = this._crearOverlayModal('sessGen');
    const d = this._editable.detalle;
    const pasosHTML = d.pasosDetallados.map((p, i) => `
      <div class="sessgen-paso" data-idx="${i}" style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; gap:8px; margin-bottom:6px;">
          <input class="sg-paso-icono" data-idx="${i}" value="${Utils.escapeHTML(p.icono || '')}" style="width:44px; text-align:center; padding:8px 4px;" maxlength="4">
          <input class="sg-paso-titulo" data-idx="${i}" value="${Utils.escapeHTML(p.titulo || '')}" placeholder="TÍTULO DEL PASO" style="flex:1;">
          <button onclick="SessionInvites._quitarPaso(${i})" style="background:transparent; border:1px solid var(--border-color); color:var(--text-secondary); border-radius:8px; width:36px; cursor:pointer;">✕</button>
        </div>
        <input class="sg-paso-accion" data-idx="${i}" value="${Utils.escapeHTML(p.accion || '')}" placeholder="Qué hay que hacer" style="width:100%; margin-bottom:6px;">
        <input class="sg-paso-porque" data-idx="${i}" value="${Utils.escapeHTML(p.porque || '')}" placeholder="Por qué (opcional)" style="width:100%;">
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(this._editable.tipo)} NUEVA SESIÓN · PASO 1/3</span>
        <button onclick="SessionInvites._cerrarModal('sessGen')" style="background:transparent; border:none; color:var(--text-secondary); font-size:20px; cursor:pointer;">✕</button>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="font-size:11px; color:var(--text-secondary);">TIPO DE SESIÓN</label>
        <select id="sgTipo" style="width:100%; margin-bottom:10px;">
          <option value="rodaje">🏃‍♂️ Rodaje</option>
          <option value="tempo">⚡ Tempo</option>
          <option value="series">🔁 Series</option>
          <option value="largo">📏 Tirada larga</option>
          <option value="strength">💪 Fuerza</option>
        </select>

        <label style="font-size:11px; color:var(--text-secondary);">NOMBRE DE LA SESIÓN</label>
        <input id="sgNombre" placeholder="Ej: Rodaje aeróbico suave" style="width:100%; margin-bottom:10px;">

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
          <div>
            <label style="font-size:11px; color:var(--text-secondary);">DURACIÓN (min)</label>
            <input id="sgDuracion" type="number" min="0" style="width:100%;">
          </div>
          <div>
            <label style="font-size:11px; color:var(--text-secondary);">DISTANCIA (km)</label>
            <input id="sgDistancia" type="number" step="0.1" min="0" style="width:100%;">
          </div>
          <div>
            <label style="font-size:11px; color:var(--text-secondary);">TSS</label>
            <input id="sgTss" type="number" min="0" style="width:100%;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
          <div>
            <label style="font-size:11px; color:var(--text-secondary);">ZONA</label>
            <input id="sgZona" placeholder="Ej: Z2" style="width:100%;">
          </div>
          <div>
            <label style="font-size:11px; color:var(--text-secondary);">RITMO OBJETIVO</label>
            <input id="sgRitmo" placeholder="Ej: 5:30 min/km" style="width:100%;">
          </div>
        </div>

        <label style="font-size:11px; color:var(--text-secondary);">SENSACIÓN (opcional)</label>
        <input id="sgSensacion" placeholder="Ej: Cómoda, controlada" style="width:100%; margin-bottom:10px;">

        <label style="font-size:11px; color:var(--text-secondary);">🎯 OBJETIVO PRINCIPAL</label>
        <textarea id="sgObjetivo" style="width:100%; min-height:50px; margin-bottom:10px;"></textarea>

        <label style="font-size:11px; color:var(--text-secondary);">POR QUÉ</label>
        <textarea id="sgPorque" style="width:100%; min-height:50px; margin-bottom:16px;"></textarea>

        <label style="font-size:11px; color:var(--text-secondary);">ESTRUCTURA DE LA SESIÓN (pasos)</label>
        <div id="sgPasosContainer" style="margin-top:8px;">${pasosHTML}</div>
        <button onclick="SessionInvites._anadirPaso()" style="width:100%; padding:10px; background:transparent; border:1px dashed var(--border-color-light); color:var(--text-secondary); border-radius:10px; cursor:pointer; margin-top:4px;">➕ AÑADIR PASO</button>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:center;">
        <button id="sgContinuarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">CONTINUAR →</button>
      </div>
    `;

    // Rellenar campos con lo que ya hubiera en this._editable (por si se
    // vuelve del paso 2/3 hacia atrás)
    document.getElementById('sgTipo').value = this._editable.tipo;
    document.getElementById('sgNombre').value = d.nombre || '';
    document.getElementById('sgDuracion').value = this._editable.duracion || '';
    document.getElementById('sgDistancia').value = d.distanciaEstimada || '';
    document.getElementById('sgTss').value = d.tssEstimada || '';
    document.getElementById('sgZona').value = d.zona || '';
    document.getElementById('sgRitmo').value = d.ritmoObjetivo || '';
    document.getElementById('sgSensacion').value = d.sensacion || '';
    document.getElementById('sgObjetivo').value = d.objetivo || '';
    document.getElementById('sgPorque').value = d.porque || '';

    document.getElementById('sgContinuarBtn').addEventListener('click', () => {
      this._leerPaso1();
      if (!this._editable.detalle.nombre.trim()) {
        Utils.showToast('Ponle un nombre a la sesión', 'warning');
        return;
      }
      this._renderPaso2Calendario();
    });
  },

  _anadirPaso() {
    this._leerPasosDelDOM();
    this._editable.detalle.pasosDetallados.push({ icono: '📌', titulo: '', accion: '', porque: '' });
    this._renderPaso1();
  },

  _quitarPaso(idx) {
    this._leerPasosDelDOM();
    this._editable.detalle.pasosDetallados.splice(idx, 1);
    this._renderPaso1();
  },

  _leerPasosDelDOM() {
    const filas = document.querySelectorAll('#sgPasosContainer .sessgen-paso');
    const pasos = [];
    filas.forEach(fila => {
      const idx = fila.dataset.idx;
      pasos.push({
        icono: fila.querySelector('.sg-paso-icono')?.value || '📌',
        titulo: fila.querySelector('.sg-paso-titulo')?.value || '',
        accion: fila.querySelector('.sg-paso-accion')?.value || '',
        porque: fila.querySelector('.sg-paso-porque')?.value || ''
      });
    });
    if (filas.length > 0) this._editable.detalle.pasosDetallados = pasos;
  },

  _leerPaso1() {
    this._editable.tipo = document.getElementById('sgTipo').value;
    this._editable.duracion = parseInt(document.getElementById('sgDuracion').value) || 0;
    const d = this._editable.detalle;
    d.nombre = document.getElementById('sgNombre').value.trim();
    d.distanciaEstimada = parseFloat(document.getElementById('sgDistancia').value) || 0;
    d.tssEstimada = parseInt(document.getElementById('sgTss').value) || 0;
    d.zona = document.getElementById('sgZona').value.trim();
    d.ritmoObjetivo = document.getElementById('sgRitmo').value.trim();
    d.sensacion = document.getElementById('sgSensacion').value.trim();
    d.objetivo = document.getElementById('sgObjetivo').value.trim();
    d.porque = document.getElementById('sgPorque').value.trim();
    this._leerPasosDelDOM();
  },

  // ==================================================================
  //  ADMIN: PASO 2 — ELEGIR DÍA EN EL CALENDARIO
  // ==================================================================

  _renderPaso2Calendario() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">📅 ELIGE EL DÍA · PASO 2/3</span>
        <button onclick="SessionInvites._cerrarModal('sessGen')" style="background:transparent; border:none; color:var(--text-secondary); font-size:20px; cursor:pointer;">✕</button>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <button onclick="SessionInvites._cambiarMes(-1)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; width:36px; height:36px; cursor:pointer;">‹</button>
          <span id="sgMesLabel" style="font-weight:bold; letter-spacing:1px;"></span>
          <button onclick="SessionInvites._cambiarMes(1)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; width:36px; height:36px; cursor:pointer;">›</button>
        </div>
        <div id="sgCalendarioGrid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;"></div>
        <div id="sgFechaElegidaTxt" style="text-align:center; margin-top:16px; color:var(--gold); font-weight:bold;"></div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._renderPaso1()" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgContinuarPaso2Btn" class="action-button" style="width:auto; padding:0 32px; margin:0;" disabled>CONTINUAR →</button>
      </div>
    `;
    this._renderizarMesCalendario();
    document.getElementById('sgContinuarPaso2Btn').addEventListener('click', () => {
      if (!this._fechaSeleccionada) return;
      this._renderPaso3Usuarios();
    });
  },

  _cambiarMes(delta) {
    this._mesCalendario.setMonth(this._mesCalendario.getMonth() + delta);
    this._renderizarMesCalendario();
  },

  _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _renderizarMesCalendario() {
    const grid = document.getElementById('sgCalendarioGrid');
    const label = document.getElementById('sgMesLabel');
    if (!grid || !label) return;

    const year = this._mesCalendario.getFullYear();
    const month = this._mesCalendario.getMonth();
    label.textContent = this._mesCalendario.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    const primerDia = new Date(year, month, 1);
    let offset = primerDia.getDay() - 1; // lunes = 0
    if (offset < 0) offset = 6;
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div style="text-align:center; font-size:10px; color:var(--text-secondary); padding:4px 0;">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) html += '<div></div>';

    const hoyKey = this._dateKey(new Date());
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(year, month, dia);
      const key = this._dateKey(fecha);
      const esHoy = key === hoyKey;
      const esSeleccionado = this._fechaSeleccionada && this._dateKey(this._fechaSeleccionada) === key;
      html += `
        <div onclick="SessionInvites._elegirDia(${year},${month},${dia})" style="
          text-align:center; padding:10px 0; border-radius:8px; cursor:pointer; font-size:13px;
          background:${esSeleccionado ? 'var(--gold)' : 'var(--stat-bg)'};
          color:${esSeleccionado ? '#000' : 'var(--text-primary)'};
          border:1px solid ${esHoy && !esSeleccionado ? 'var(--gold)' : 'var(--border-color)'};
          font-weight:${esHoy ? 'bold' : 'normal'};
        ">${dia}</div>`;
    }
    grid.innerHTML = html;
  },

  _elegirDia(year, month, dia) {
    this._fechaSeleccionada = new Date(year, month, dia);
    this._renderizarMesCalendario();
    const txt = document.getElementById('sgFechaElegidaTxt');
    if (txt) txt.textContent = `Sesión para el ${this._fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    const btn = document.getElementById('sgContinuarPaso2Btn');
    if (btn) btn.disabled = false;
  },

  // ==================================================================
  //  ADMIN: PASO 3 — ELEGIR USUARIOS Y ENVIAR
  // ==================================================================

  async _renderPaso3Usuarios() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">👥 ELIGE USUARIOS · PASO 3/3</span>
        <button onclick="SessionInvites._cerrarModal('sessGen')" style="background:transparent; border:none; color:var(--text-secondary); font-size:20px; cursor:pointer;">✕</button>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <input id="sgUsuariosBuscar" placeholder="> BUSCAR USUARIO_" style="width:100%; margin-bottom:12px;">
        <div id="sgUsuariosList">⏳ Cargando usuarios...</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._renderPaso2Calendario()" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgEnviarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">📤 ENVIAR (<span id="sgCountSeleccionados">0</span>)</button>
      </div>
    `;

    if (!this._usuariosTodos) {
      try {
        const snapshot = await firebaseServices.db.collection('users').orderBy('username_lowercase').get();
        this._usuariosTodos = snapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() }))
          .filter(u => u.uid !== AppState.currentUserId);
      } catch (e) {
        console.error('Error cargando usuarios para invitar:', e);
        this._usuariosTodos = [];
      }
    }

    this._renderizarListaUsuarios(this._usuariosTodos);

    document.getElementById('sgUsuariosBuscar').addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
        (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
      );
      this._renderizarListaUsuarios(filtrados);
    });

    document.getElementById('sgEnviarBtn').addEventListener('click', () => this._confirmarEnvio());
  },

  _renderizarListaUsuarios(usuarios) {
    const container = document.getElementById('sgUsuariosList');
    if (!container) return;
    if (usuarios.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    container.innerHTML = usuarios.map(u => {
      const marcado = this._usuariosSeleccionados.has(u.uid);
      return `
        <div onclick="SessionInvites._toggleUsuario('${u.uid}')" style="
          display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:6px;
          background:${marcado ? 'rgba(192,160,96,0.12)' : 'var(--stat-bg)'};
          border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
          border-radius:10px; cursor:pointer;
        ">
          <span style="font-size:18px;">${marcado ? '☑️' : '⬜'}</span>
          <div style="flex:1;">
            <div style="font-size:14px; color:var(--text-primary);">${Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'))}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${Utils.escapeHTML(u.email || '')}</div>
          </div>
        </div>`;
    }).join('');
  },

  _toggleUsuario(uid) {
    if (this._usuariosSeleccionados.has(uid)) this._usuariosSeleccionados.delete(uid);
    else this._usuariosSeleccionados.add(uid);
    const term = document.getElementById('sgUsuariosBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    );
    this._renderizarListaUsuarios(filtrados);
    const countEl = document.getElementById('sgCountSeleccionados');
    if (countEl) countEl.textContent = this._usuariosSeleccionados.size;
  },

  async _confirmarEnvio() {
    if (this._usuariosSeleccionados.size === 0) {
      Utils.showToast('Elige al menos un usuario', 'warning');
      return;
    }
    const fechaTxt = this._fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const ok = await Utils.confirm(
      'ENVIAR SESIÓN',
      `Vas a enviar "${this._editable.detalle.nombre}" para el ${fechaTxt} a ${this._usuariosSeleccionados.size} usuario(s). ¿Confirmas?`
    );
    if (!ok) return;

    Utils.showLoading();
    try {
      const fromUsername = AppState.currentUserData?.username || AppState.currentUser || 'Admin';
      const fechaKey = this._dateKey(this._fechaSeleccionada);
      const batch = firebaseServices.db.batch();
      const sesionParaEnviar = JSON.parse(JSON.stringify(this._editable));

      this._usuariosSeleccionados.forEach(uid => {
        const usuario = this._usuariosTodos.find(u => u.uid === uid);
        const ref = firebaseServices.db.collection('sessionInvites').doc();
        batch.set(ref, {
          fromUid: AppState.currentUserId,
          fromUsername,
          toUid: uid,
          toUsername: usuario?.username || '',
          status: 'pending',
          fecha: fechaKey,
          sesion: sesionParaEnviar,
          createdAt: firebaseServices.Timestamp.now()
        });
      });

      await batch.commit();
      Utils.hideLoading();
      Utils.showToast(`✅ Sesión enviada a ${this._usuariosSeleccionados.size} usuario(s)`, 'success');
      this._cerrarModal('sessGen');
    } catch (e) {
      console.error('Error enviando sesiones:', e);
      Utils.hideLoading();
      Utils.showToast('Error al enviar la sesión', 'error');
    }
  },

  // ==================================================================
  //  DESTINATARIO: ESCUCHAR SESIONES PENDIENTES Y MOSTRAR MODAL
  // ==================================================================

  iniciarListener() {
    if (!AppState.currentUserId || !window.firebaseServices) return;
    this.detenerListener();
    this.unsubscribe = firebaseServices.db.collection('sessionInvites')
      .where('toUid', '==', AppState.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type !== 'added') return;
          const id = change.doc.id;
          if (this._shownIds.has(id)) return;
          this._shownIds.add(id);
          this._mostrarModalInvite(id, change.doc.data());
        });
      }, (error) => {
        console.error('Error en listener de sessionInvites:', error);
      });
  },

  detenerListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this._shownIds.clear();
  },

  _mostrarModalInvite(id, data) {
    const { modal } = this._crearOverlayModal('sessInvite');
    const sesion = data.sesion || {};
    const detalle = sesion.detalle || {};
    const fecha = new Date(data.fecha + 'T00:00:00');
    const fechaTxt = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const nombreAdmin = Utils.capitalizeUsername ? Utils.capitalizeUsername(data.fromUsername) : (data.fromUsername || 'El entrenador');

    modal.innerHTML = `
      <div style="padding:20px; text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">${this._tipoEmoji(sesion.tipo)}</div>
        <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
          <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
        </div>
        <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>

        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; text-align:left; margin-bottom:20px;">
          <div style="font-weight:bold; color:var(--gold); margin-bottom:6px;">${Utils.escapeHTML(detalle.nombre || sesion.tipo || 'Sesión')}</div>
          <div style="font-size:12px; color:var(--text-secondary); display:flex; gap:14px; flex-wrap:wrap;">
            <span>🕒 ${sesion.duracion || 0} min</span>
            <span>📏 ${(detalle.distanciaEstimada || 0)} km</span>
            ${detalle.zona ? `<span>🔥 ${Utils.escapeHTML(detalle.zona)}</span>` : ''}
          </div>
          ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
        </div>

        <div style="display:flex; gap:12px;">
          <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
          <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
        </div>
      </div>
    `;

    document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id));
    document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data));
  },

  async _rechazar(id) {
    Utils.showLoading();
    try {
      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'rejected' });
      Utils.hideLoading();
      this._cerrarModal('sessInvite');
      Utils.showToast('Sesión rechazada', 'info');
    } catch (e) {
      console.error('Error rechazando sesión:', e);
      Utils.hideLoading();
      Utils.showToast('Error al rechazar la sesión', 'error');
    }
  },

  async _aceptar(id, data) {
    Utils.showLoading();
    try {
      const uid = AppState.currentUserId;
      const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
      const ultimoPlanId = userDoc.data()?.ultimoPlanId;
      if (!ultimoPlanId) {
        Utils.hideLoading();
        Utils.showToast('No tienes ningún plan generado todavía, no se puede añadir la sesión', 'error');
        return;
      }

      const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(ultimoPlanId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) {
        Utils.hideLoading();
        Utils.showToast('Tu plan actual ya no existe, no se puede añadir la sesión', 'error');
        return;
      }
      const plan = planDoc.data();
      const fechaInicioPlan = plan.params?.fechaInicio ? new Date(plan.params.fechaInicio) : null;
      if (!fechaInicioPlan) {
        Utils.hideLoading();
        Utils.showToast('Tu plan no tiene fecha de inicio válida', 'error');
        return;
      }
      fechaInicioPlan.setHours(0, 0, 0, 0);

      const fechaSesion = new Date(data.fecha + 'T00:00:00');
      const diaGlobal = Math.round((fechaSesion - fechaInicioPlan) / 86400000) + 1;
      if (diaGlobal < 1) {
        Utils.hideLoading();
        Utils.showToast('Esa fecha es anterior al inicio de tu plan actual', 'error');
        return;
      }

      let sesiones = Array.isArray(plan.sesiones) ? [...plan.sesiones] : [];
      const idxExistente = sesiones.findIndex(s => s && s.diaGlobal === diaGlobal);
      const faseRef = idxExistente >= 0 ? sesiones[idxExistente].fase
        : (sesiones[sesiones.length - 1]?.fase || 'BASE');
      const nivelRef = idxExistente >= 0 ? sesiones[idxExistente].nivel
        : (sesiones[sesiones.length - 1]?.nivel || 'intermedio');

      const nuevaEntrada = {
        diaGlobal,
        semana: Math.floor((diaGlobal - 1) / 7) + 1,
        diaSemana: ((diaGlobal - 1) % 7) + 1,
        fase: faseRef,
        nivel: nivelRef,
        tipo: data.sesion.tipo,
        color: (window.PlanGenerator ? PlanGenerator.getColor(data.sesion.tipo) : 'sesion-rodaje'),
        letra: (window.PlanGenerator ? PlanGenerator.getLetra(data.sesion.tipo) : '?'),
        tieneFuerza: false,
        duracion: data.sesion.duracion,
        detalle: data.sesion.detalle
      };

      if (idxExistente >= 0) {
        sesiones[idxExistente] = nuevaEntrada;
      } else {
        // Rellena con descanso los días que falten hasta llegar a la
        // fecha elegida, para no dejar huecos en el array del plan.
        const maxDiaGlobal = sesiones.length ? Math.max(...sesiones.map(s => s.diaGlobal || 0)) : 0;
        for (let g = maxDiaGlobal + 1; g < diaGlobal; g++) {
          sesiones.push({
            diaGlobal: g,
            semana: Math.floor((g - 1) / 7) + 1,
            diaSemana: ((g - 1) % 7) + 1,
            fase: faseRef,
            nivel: nivelRef,
            tipo: 'descanso',
            color: (window.PlanGenerator ? PlanGenerator.getColor('descanso') : 'sesion-descanso'),
            letra: (window.PlanGenerator ? PlanGenerator.getLetra('descanso') : 'D'),
            detalle: null,
            tieneFuerza: false
          });
        }
        sesiones.push(nuevaEntrada);
        sesiones.sort((a, b) => a.diaGlobal - b.diaGlobal);
      }

      await planRef.update({ sesiones });
      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'accepted' });

      // Si el usuario tiene el plan cargado en memoria y está viendo esa
      // pestaña, refrescamos el calendario al instante.
      if (window.AppState && AppState.planActualId === ultimoPlanId) {
        AppState.planGeneradoActual = plan.params;
        if (window.PlanGenerator && typeof PlanGenerator.mostrarCalendario === 'function') {
          PlanGenerator.mostrarCalendario(sesiones);
        }
      }

      Utils.hideLoading();
      this._cerrarModal('sessInvite');
      Utils.showToast('✅ Sesión añadida a tu plan', 'success');
    } catch (e) {
      console.error('Error aceptando sesión enviada:', e);
      Utils.hideLoading();
      Utils.showToast('Error al añadir la sesión a tu plan', 'error');
    }
  }
};

window.SessionInvites = SessionInvites;
console.log('✅ SessionInvites listo (Generar sesión / invitaciones de sesión)');
