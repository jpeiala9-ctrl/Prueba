// ============================================================
// referidos.js - Código de invitación y comisiones por invitar
// ============================================================
// Versión: 1.2 - TIEMPO REAL: como el resto de la app, la tarjeta del usuario (código, invitados, pendiente y cobrado) y las listas del admin
//                (pendientes, usuarios con código, historial de pagos, invitados) se actualizan solas en cuanto Firebase detecta un cambio
//                (onSnapshot), sin salir y volver a entrar. Los listeners se paran al cerrar sesión.
// Versión: 1.1 - Botón RETIRAR DINERO en la tarjeta «Invita y gana»: desactivado (aspecto apagado, avisa del mínimo al pulsarlo) hasta
//                tener 5 € pendientes; activo, pide el teléfono de Bizum y manda la petición al Soporte del administrador.
// Versión: 1.0
//  - Usuario (Configuración > Perfil, tarjeta #referidosCard): ve su código
//    (lo asigna el admin), cuántos invitados lleva y lo que tiene pendiente
//    y cobrado; si le invitó alguien y aún no lo dijo, puede escribir el
//    código de esa persona (una sola vez, solo en los primeros 30 días).
//  - Admin: al guardar Gestionar premium con «Pago Bizum cobrado ahora» se
//    crean las comisiones de quien invitó (2,50 € por mes, máximo 6 por
//    invitado) y la pestaña Invitaciones lista lo pendiente de pagar.
// Colecciones: codigosReferido/{CODIGO}, referidos/{uidInvitado},
// comisiones/{id} (ver reglas.js).
const Referidos = {
  IMPORTE: 2.5,
  MAX_PAGOS: 6,
  DIAS_PARA_CODIGO: 30,
  MIN_RETIRO: 5,   // € pendientes mínimos para poder pedir la retirada

  // Código propio (si el admin se lo ha asignado), guardado de antemano para que «Compartir RI5» no tenga que esperar
  // a Firestore: el móvil exige que compartir ocurra enseguida tras el toque.
  _miCodigo: '',
  async precargarCodigo() {
    const uid = window.AppState && AppState.currentUserId;
    if (!uid) return;
    try {
      const s = await firebaseServices.db.collection('users').doc(uid).get();
      this._miCodigo = (s.exists && s.data().codigoReferido) || '';
    } catch (_) {}
  },

  _eur(n) { return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'; },
  _esc(t) { return (window.Utils && Utils.escapeHTML) ? Utils.escapeHTML(String(t == null ? '' : t)) : String(t == null ? '' : t); },

  // ---------------- USUARIO (tiempo real) ----------------
  // Cuatro listeners (mi usuario, mi referido, mis invitados y mis comisiones) guardan su último estado en this._u; cada cambio
  // repinta la tarjeta sin volver a leer nada. Se arrancan al abrir la app / Perfil y se paran al cerrar sesión.
  _u: null,
  _usuarioOcupado: false,
  _ultimoHtmlUsuario: null,

  _iniciarUsuario(uid) {
    if (this._u && this._u.uid === uid && !this._u.error) return;
    this._detenerUsuario();
    const db = firebaseServices.db;
    const S = this._u = { uid: uid, user: {}, miRef: false, inv: 0, pend: 0, cobr: 0, listo: {}, unsub: [], error: false };
    const falla = (n) => (e) => { console.warn('Referidos: listener ' + n, e); S.error = true; this._pintarUsuario(); };
    S.unsub.push(db.collection('users').doc(uid).onSnapshot(snap => {
      S.user = snap.exists ? snap.data() : {};
      this._miCodigo = S.user.codigoReferido || '';
      S.listo.user = true; this._pintarUsuario();
    }, falla('users')));
    S.unsub.push(db.collection('referidos').doc(uid).onSnapshot(snap => {
      S.miRef = snap.exists;
      S.listo.miRef = true; this._pintarUsuario();
    }, falla('referido')));
    S.unsub.push(db.collection('referidos').where('referidoPor', '==', uid).onSnapshot(snap => {
      S.inv = snap.size;
      S.listo.inv = true; this._pintarUsuario();
    }, falla('invitados')));
    S.unsub.push(db.collection('comisiones').where('referidor', '==', uid).onSnapshot(snap => {
      let p = 0, c = 0;
      snap.forEach(d => { const x = d.data(); if (x.pagada) c += x.importe || 0; else p += x.importe || 0; });
      S.pend = p; S.cobr = c;
      S.listo.com = true; this._pintarUsuario();
    }, falla('comisiones')));
  },

  _detenerUsuario() {
    if (this._u) { this._u.unsub.forEach(f => { try { f(); } catch (_) {} }); }
    this._u = null;
    this._ultimoHtmlUsuario = null;
  },

  // Se llama al arrancar la app y al abrir Configuración: arranca los listeners (si no lo estaban) y pinta lo que haya.
  renderUsuario() {
    const box = document.getElementById('referidosCard');
    const uid = window.AppState && AppState.currentUserId;
    if (!box || !uid) return;
    // El administrador no ve esta tarjeta: gestiona los códigos desde Administración › Invitar.
    if (window.AppState && AppState.isAdmin === true) { this._detenerUsuario(); box.style.display = 'none'; box.innerHTML = ''; this.precargarCodigo(); return; }
    this._iniciarUsuario(uid);
    this._pintarUsuario();
  },

  _pintarUsuario() {
    const box = document.getElementById('referidosCard');
    const S = this._u;
    if (!box || !S || this._usuarioOcupado) return;
    if (window.AppState && AppState.isAdmin === true) { box.style.display = 'none'; return; }
    if (S.error) { box.style.display = 'none'; return; }
    if (!(S.listo.user && S.listo.miRef && S.listo.inv && S.listo.com)) return;   // esperando el primer dato de cada listener

    const u = S.user, pend = S.pend, cobr = S.cobr;
    const codigo = u.codigoReferido || '';
    const dias = u.created ? (Date.now() - new Date(u.created).getTime()) / 86400000 : 0;
    const mostrarInput = !S.miRef && !(dias > this.DIAS_PARA_CODIGO);

    let html = '<div class="stat-card" style="margin-bottom:12px; cursor:default; text-align:left; padding:12px 14px !important; border:1px solid var(--gold) !important;">';
    if (codigo) {
      html += '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">'
        + '<span style="font-size:11px; letter-spacing:1.5px; color:var(--gold); font-weight:600;">INVITA Y GANA</span>'
        + '<span style="font-size:20px; font-weight:700; letter-spacing:2px; color:var(--gold);">' + this._esc(codigo) + '</span></div>'
        + '<div style="font-size:11px; color:var(--text-secondary); line-height:1.4; margin-top:6px;">' + this._eur(this.IMPORTE) + ' al mes durante ' + this.MAX_PAGOS + ' meses por cada invitado que pague premium.</div>'
        + '<div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">Invitados <b>' + S.inv + '</b> · Pendiente <b>' + this._eur(pend) + '</b> · Cobrado <b>' + this._eur(cobr) + '</b></div>';
      // Retirar dinero: siempre pulsable; por debajo del mínimo (o con la petición ya enviada) se ve apagado y solo avisa.
      this._pend = pend;
      const yaPedida = this._retiradaPedida(S.uid, pend);
      const activo = pend >= this.MIN_RETIRO && !yaPedida;
      html += '<button id="referidosRetirarBtn" class="action-button" aria-disabled="' + (!activo) + '" style="width:100%; height:40px; line-height:40px; margin:10px 0 0 !important; padding:0 16px; font-size:13px;' + (activo ? '' : ' opacity:0.45;') + '" onclick="Referidos.retirar()">'
        + (yaPedida ? 'RETIRADA SOLICITADA' : 'RETIRAR DINERO') + '</button>';
    }
    if (!codigo) {
      html += '<div style="font-size:11px; letter-spacing:1.5px; color:var(--gold); font-weight:600;">INVITA Y GANA</div>'
        + '<div style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin-top:6px;">Pide tu código de invitación y gana ' + this._eur(this.IMPORTE) + ' al mes durante ' + this.MAX_PAGOS + ' meses por cada invitado que pague premium.</div>'
        + '<button class="action-button" style="width:100%; height:40px; line-height:40px; margin:10px 0 0 !important; padding:0 16px; font-size:13px;" onclick="switchPerfilSubtab(\'perfil-soporte\')">PEDIR MI CÓDIGO</button>';
    }
    if (mostrarInput) {
      html += '<div style="' + 'margin-top:10px; border-top:1px solid var(--border-color); padding-top:10px;' + '">'
        + '<div style="font-size:11px; letter-spacing:1.5px; color:var(--gold); font-weight:600; margin-bottom:6px;">¿TE INVITÓ ALGUIEN?</div>'
        + '<div style="display:flex; gap:8px; align-items:center;">'
        + '<input type="text" id="referidosCodigoInput" placeholder="Código de invitación" maxlength="12" autocapitalize="characters" autocomplete="off" style="flex:1; min-width:0; height:40px; margin:0; text-align:center; text-transform:uppercase;">'
        + '<button class="action-button" style="width:auto; min-width:0; height:40px; line-height:40px; margin:0 !important; padding:0 16px; font-size:13px; flex-shrink:0;" onclick="Referidos.usarCodigo()">USAR</button>'
        + '</div></div>';
    }
    html += '</div>';

    // Sin cambios reales: no se toca el DOM (así no se pierde el foco ni parpadea nada).
    if (this._ultimoHtmlUsuario === html && box.innerHTML) { box.style.display = 'block'; return; }
    // Si la persona estaba escribiendo un código, se conserva lo escrito aunque llegue un cambio de otro dato.
    const prev = document.getElementById('referidosCodigoInput');
    const escrito = prev ? prev.value : '';
    const teniaFoco = !!prev && document.activeElement === prev;
    box.innerHTML = html;
    box.style.display = 'block';
    this._ultimoHtmlUsuario = html;
    if (escrito) {
      const nuevo = document.getElementById('referidosCodigoInput');
      if (nuevo) { nuevo.value = escrito; if (teniaFoco) { try { nuevo.focus(); } catch (_) {} } }
    }
  },

  async usarCodigo() {
    const inp = document.getElementById('referidosCodigoInput');
    const uid = window.AppState && AppState.currentUserId;
    if (!inp || !uid) return;
    const codigo = (inp.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!codigo) { Utils.showToast('Escribe el código de invitación', 'error'); return; }
    const box = document.getElementById('referidosCard');
    this._usuarioOcupado = true;     // mientras dura el «CARGANDO», los listeners no repintan la tarjeta
    this._mostrarCarga(box);
    try {
      const db = firebaseServices.db;
      const cod = await db.collection('codigosReferido').doc(codigo).get();
      if (!cod.exists || !cod.data().uid || cod.data().uid === uid) {
        Utils.showToast('El código de invitación no es válido', 'error');
        return;
      }
      await db.collection('referidos').doc(uid).set({
        referidoPor: cod.data().uid,
        codigo: codigo,
        creado: firebaseServices.Timestamp.now()
      });
      Utils.showToast('✅ Código aplicado', 'success');
    } catch (e) {
      console.warn('Referidos: usarCodigo', e);
      Utils.showToast('No se pudo aplicar el código', 'error');
    } finally {
      await this._esperarCarga();
      this._usuarioOcupado = false;
      this._ultimoHtmlUsuario = null;
      this.renderUsuario();
    }
  },

  // ---------------- RETIRAR DINERO (usuario) ----------------
  // La petición se guarda en este dispositivo (importe + fecha) para no enviar la misma dos veces: mientras el pendiente
  // siga siendo el mismo importe durante 7 días, el botón queda como «RETIRADA SOLICITADA». Si llegan comisiones nuevas
  // (el importe cambia) o pasa la semana sin cobrarlo, se puede volver a pedir.
  _claveRetirada(uid) { return 'ri5_retirada_' + uid; },
  _retiradaPedida(uid, pend) {
    try {
      const r = JSON.parse(localStorage.getItem(this._claveRetirada(uid)) || 'null');
      return !!(r && Math.abs((r.importe || 0) - pend) < 0.005 && (Date.now() - (r.ts || 0)) < 7 * 86400000);
    } catch (_) { return false; }
  },

  retirar() {
    const uid = window.AppState && AppState.currentUserId;
    if (!uid) return;
    const pend = this._pend || 0;
    if (this._retiradaPedida(uid, pend)) {
      Utils.showToast('Ya has enviado la solicitud. El administrador te enviará el Bizum', 'info', 5000);
      return;
    }
    if (pend < this.MIN_RETIRO) {
      Utils.showToast('El mínimo para retirar es ' + this.MIN_RETIRO + ' €', 'error', 4000);
      return;
    }
    this._abrirRetirada(pend);
  },

  _abrirRetirada(pend) {
    this.cerrarRetirada();
    const overlay = document.createElement('div');
    overlay.id = 'modalRetiradaOverlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:20004; animation:ri5AmigoFondo 0.12s ease-out both;';
    overlay.onclick = () => Referidos.cerrarRetirada();
    const modal = document.createElement('div');
    modal.id = 'modalRetirada';
    modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-card); border:1px solid var(--gold); border-radius:16px; padding:24px 20px; z-index:20005; max-width:380px; width:88%; max-height:90vh; max-height:90dvh; overflow-y:auto; box-sizing:border-box; box-shadow:var(--shadow-lg); font-family:inherit; animation:ri5AmigoTarjeta 0.16s ease-out both;';
    modal.innerHTML = '<h3 style="margin:0 0 6px; text-align:center; color:var(--gold);">RETIRAR DINERO</h3>'
      + '<p style="margin:0 0 4px; text-align:center; font-size:22px; font-weight:700; color:var(--text-primary);">' + this._eur(pend) + '</p>'
      + '<p style="margin:0 0 16px; text-align:center; font-size:12px; line-height:1.4; color:var(--text-secondary);">Te lo enviaremos por Bizum. Escribe el teléfono en el que quieres recibirlo.</p>'
      + '<label for="retiradaTelefono" style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px;">Teléfono de Bizum</label>'
      + '<input id="retiradaTelefono" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="600 123 456" style="width:100%; box-sizing:border-box; height:44px; margin:0 0 6px; text-align:center; font-size:16px;">'
      + '<div id="retiradaError" style="display:none; color:var(--st-red); font-size:12px; margin:0 0 6px; text-align:center;"></div>'
      + '<div style="display:flex; gap:12px; margin-top:12px;">'
      + '<button class="action-button" style="flex:1; margin:0;" onclick="Referidos.cerrarRetirada()">CANCELAR</button>'
      + '<button class="action-button button-main" id="retiradaEnviar" style="flex:1; margin:0;" onclick="Referidos.enviarRetirada()">ENVIAR SOLICITUD</button>'
      + '</div>';
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    const inp = document.getElementById('retiradaTelefono');
    if (inp) {
      inp.addEventListener('input', () => { const e = document.getElementById('retiradaError'); if (e) e.style.display = 'none'; });
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') Referidos.enviarRetirada(); });
      setTimeout(() => { try { inp.focus(); } catch (_) {} }, 150);
    }
  },

  cerrarRetirada() {
    ['modalRetirada', 'modalRetiradaOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  },

  // Móvil español: 9 dígitos que empiezan por 6 o 7 (admite espacios, guiones y el prefijo +34 / 0034).
  _telefonoValido(txt) {
    let t = String(txt || '').replace(/[\s.\-()]/g, '');
    t = t.replace(/^(\+34|0034)/, '');
    return /^[67]\d{8}$/.test(t) ? t : null;
  },

  async enviarRetirada() {
    const uid = window.AppState && AppState.currentUserId;
    const inp = document.getElementById('retiradaTelefono');
    const err = document.getElementById('retiradaError');
    const btn = document.getElementById('retiradaEnviar');
    if (!uid || !inp || (btn && btn.disabled)) return;
    const tel = this._telefonoValido(inp.value);
    if (!tel) {
      if (err) { err.textContent = 'Introduce un teléfono móvil válido (9 dígitos)'; err.style.display = 'block'; }
      return;
    }
    if (btn) btn.disabled = true;
    try {
      // Se vuelve a calcular el pendiente justo ahora (no el de la tarjeta, que pudo quedarse antiguo).
      const snap = await firebaseServices.db.collection('comisiones').where('referidor', '==', uid).where('pagada', '==', false).get();
      let pend = 0;
      snap.forEach(d => { pend += d.data().importe || 0; });
      if (pend < this.MIN_RETIRO) {
        this.cerrarRetirada();
        Utils.showToast('El mínimo para retirar es ' + this.MIN_RETIRO + ' €', 'error', 4000);
        return;
      }
      const adminUid = await Storage.getAdminUid();
      if (!adminUid) throw new Error('No se encontró al administrador');
      const nombre = (AppState.currentUserData && AppState.currentUserData.username) || 'Usuario';
      const ok = await Storage.enviarMensajeSoporte(
        uid,
        adminUid,
        '💶 SOLICITUD DE RETIRADA DE DINERO\nUsuario: ' + nombre
          + (this._miCodigo ? '\nCódigo de invitación: ' + this._miCodigo : '')
          + '\nImporte pendiente: ' + this._eur(pend)
          + '\nTeléfono para Bizum: ' + tel
          + '\n\nEl usuario solicita cobrar sus comisiones por invitar.'
      );
      if (!ok) throw new Error('No se pudo guardar el mensaje');
      try { localStorage.setItem(this._claveRetirada(uid), JSON.stringify({ importe: pend, ts: Date.now() })); } catch (_) {}
      this.cerrarRetirada();
      Utils.showToast('✅ Solicitud de retirada enviada', 'success', 4000);
      this._pintarUsuario();
    } catch (e) {
      console.warn('Referidos: enviarRetirada', e);
      if (btn) btn.disabled = false;
      if (err) { err.textContent = 'No se pudo enviar la solicitud. Inténtalo de nuevo'; err.style.display = 'block'; }
    }
  },

  // ---------------- ADMIN ----------------
  // Se llama desde Gestionar premium al guardar con «Pago Bizum cobrado ahora».
  async registrarPago(uidInvitado, nombreInvitado, meses) {
    try {
      meses = parseInt(meses, 10) || 0;
      if (!meses) return;
      const db = firebaseServices.db;
      const refRef = db.collection('referidos').doc(uidInvitado);
      const refSnap = await refRef.get();
      if (!refSnap.exists) { Utils.showToast('Este usuario no vino invitado: sin comisión', 'info'); return; }
      const r = refSnap.data();
      const hechos = r.pagos || 0;
      const n = Math.min(meses, this.MAX_PAGOS - hechos);
      if (n <= 0) { Utils.showToast('Este invitado ya generó las ' + this.MAX_PAGOS + ' comisiones', 'info'); return; }
      const uRef = await db.collection('users').doc(r.referidoPor).get();
      const nombreRef = uRef.exists ? (uRef.data().username || '') : '';
      const batch = db.batch();
      for (let i = 1; i <= n; i++) {
        batch.set(db.collection('comisiones').doc(), {
          referidor: r.referidoPor,
          referidorNombre: nombreRef,
          invitado: uidInvitado,
          invitadoNombre: nombreInvitado || '',
          importe: this.IMPORTE,
          numero: hechos + i,
          pagada: false,
          creada: firebaseServices.Timestamp.now()
        });
      }
      batch.update(refRef, { pagos: hechos + n });
      await batch.commit();
      Utils.showToast('💶 Comisión: ' + n + ' × ' + this._eur(this.IMPORTE) + ' para ' + (nombreRef || 'quien invitó'), 'success', 5000);
    } catch (e) {
      console.error('Referidos: registrarPago', e);
      Utils.showToast('El premium se guardó, pero no se pudo crear la comisión: ' + e.message, 'error', 6000);
    }
  },

  // ---------------- ADMIN (tiempo real) ----------------
  // Tres listeners (códigos, invitaciones y comisiones: colecciones completas, solo las ve el admin) se arrancan la primera vez que
  // se abre cualquier pantalla de referidos y dejan en this._a el estado al día. Cada cambio repinta lo que esté a la vista:
  // pendientes de pagar, USUARIOS CON CÓDIGO, historial de pagos y la ventana de invitados.
  _a: null,
  _pendPintada: false,
  _usuariosPintados: false,
  _invitadosUid: null,
  _repintoPendiente: false,

  _iniciarAdmin() {
    if (this._a && this._a.promesa) return this._a.promesa;
    const db = firebaseServices.db;
    const A = this._a = { cods: [], refs: [], coms: [], listo: {}, ok: false, unsub: [], nombres: {} };
    A.promesa = new Promise((resolve, reject) => {
      const marca = (k) => {
        A.listo[k] = true;
        if (!A.ok && A.listo.cods && A.listo.refs && A.listo.coms) { A.ok = true; resolve(); }
        else if (A.ok) this._repintarAdmin();
      };
      const falla = (e) => {
        console.error('Referidos: listener admin', e);
        if (!A.ok) { this._detenerAdmin(); reject(e); }
      };
      const docs = (s) => s.docs.map(d => Object.assign({ id: d.id }, d.data()));
      A.unsub.push(db.collection('codigosReferido').onSnapshot(s => { A.cods = docs(s); marca('cods'); }, falla));
      A.unsub.push(db.collection('referidos').onSnapshot(s => { A.refs = docs(s); marca('refs'); }, falla));
      A.unsub.push(db.collection('comisiones').onSnapshot(s => { A.coms = docs(s); marca('coms'); }, falla));
    });
    return A.promesa;
  },

  _detenerAdmin() {
    if (this._a) { this._a.unsub.forEach(f => { try { f(); } catch (_) {} }); }
    this._a = null;
    this._pendPintada = false;
    this._usuariosPintados = false;
    this._invitadosUid = null;
  },

  // Agrupa varios cambios seguidos (p. ej. un lote de comisiones) en un solo repintado.
  _repintarAdmin() {
    if (this._repintoPendiente) return;
    this._repintoPendiente = true;
    setTimeout(() => {
      this._repintoPendiente = false;
      const A = this._a;
      if (!A || !A.ok) return;
      if (this._pendPintada && document.getElementById('adminReferidosList')) this._renderPendientes();
      const pu = document.getElementById('adminReferidosUsuarios');
      if (this._usuariosPintados && pu && pu.style.display !== 'none') this._renderUsuariosCodigo();
      if (document.getElementById('modalPagosReferidos')) this._renderHistorial();
      if (this._invitadosUid && document.getElementById('modalInvitados')) this._renderInvitados(this._invitadosUid, false);
    }, 0);
  },

  // La primera vez espera a los datos y a que acabe la animación de CARGANDO; ya con datos al día, no hace falta esperar nada.
  async _listoAdmin() {
    const ya = !!(this._a && this._a.ok);
    if (ya) return this._iniciarAdmin();
    return this._esperarCarga(this._iniciarAdmin());
  },

  toggleUsuariosCodigo() {
    if (!(window.AppState && AppState.isAdmin)) return;
    const panel = document.getElementById('adminReferidosUsuarios');
    const btn = document.getElementById('btnUsuariosCodigo');
    if (!panel) return;
    const abrir = panel.style.display === 'none';
    panel.style.display = abrir ? 'block' : 'none';
    if (abrir) {
      this.cargarUsuariosCodigo();
      if (btn) {
        btn.style.scrollMarginTop = '110px';
        requestAnimationFrame(() => btn.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    }
  },

  async _cargarNombres(uids) {
    const A = this._a;
    if (!A) return;
    const db = firebaseServices.db;
    await Promise.all(uids.map(async uid => {
      let nombre = '(usuario eliminado)';
      try { const u = await db.collection('users').doc(uid).get(); if (u.exists && u.data().username) nombre = u.data().username; } catch (_) {}
      A.nombres[uid] = nombre;
    }));
  },

  // Al pulsar USUARIOS CON CÓDIGO sale siempre la animación de CARGANDO (letras pequeñas) y, cuando termina entera, aparece la lista ya
  // completa: se espera a los datos, a los nombres de los usuarios y a que acabe la animación ANTES de pintar nada.
  async cargarUsuariosCodigo() {
    const box = document.getElementById('adminReferidosUsuarios');
    if (!box) return;
    this._usuariosPintados = false;   // mientras carga, los cambios en tiempo real no pisan la animación
    this._mostrarCarga(box);
    try {
      const datos = (async () => {
        await this._iniciarAdmin();
        const A = this._a;
        if (!A) return;
        const faltan = A.cods.map(c => c.uid).filter(uid => uid && !(uid in A.nombres));
        if (faltan.length) await this._cargarNombres(Array.from(new Set(faltan)));
      })();
      await this._esperarCarga(datos);
      if (box.style.display === 'none') return;   // lo cerraron mientras cargaba
      this._usuariosPintados = true;
      await this._renderUsuariosCodigo();
    } catch (e) {
      console.error('Referidos: cargarUsuariosCodigo', e);
      box.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No se pudo cargar: ' + this._esc(e.message) + '</p>';
    }
  },

  async _renderUsuariosCodigo() {
    const box = document.getElementById('adminReferidosUsuarios');
    const A = this._a;
    if (!box || !A || !A.ok) return;
    const faltan = A.cods.map(c => c.uid).filter(uid => uid && !(uid in A.nombres));
    if (faltan.length) {
      await this._cargarNombres(Array.from(new Set(faltan)));
      if (this._a !== A || !document.getElementById('adminReferidosUsuarios')) return;
    }
    if (!A.cods.length) { box.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Todavía no has asignado ningún código.</p>'; return; }
    const inv = {};
    A.refs.forEach(r => { inv[r.referidoPor] = (inv[r.referidoPor] || 0) + 1; });
    const money = {};
    A.coms.forEach(c => {
      const m = money[c.referidor] || (money[c.referidor] = { pend: 0, cobr: 0 });
      if (c.pagada) m.cobr += c.importe || 0; else m.pend += c.importe || 0;
    });
    const items = A.cods.map(c => ({ codigo: c.id, uid: c.uid, nombre: A.nombres[c.uid] || '(usuario eliminado)' }));
    items.sort((a, b) => ((inv[b.uid] || 0) - (inv[a.uid] || 0)) || a.nombre.localeCompare(b.nombre));
    this._usuariosCodigo = {};
    items.forEach(it => { this._usuariosCodigo[it.uid] = it; });
    let html = '<p style="text-align:center; margin:0 0 14px;"><b>' + items.length + '</b> usuario' + (items.length === 1 ? '' : 's') + ' con código</p>';
    items.forEach(it => {
      const m = money[it.uid] || { pend: 0, cobr: 0 };
      html += '<div class="stat-card" style="margin-bottom:10px; text-align:left; cursor:pointer;" onclick="Referidos.abrirInvitados(\'' + this._esc(it.uid) + '\')">'
        + '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:12px;">'
        + '<span style="font-weight:600; overflow-wrap:anywhere;">' + this._esc(it.nombre) + '</span>'
        + '<span style="font-weight:700; letter-spacing:2px; color:var(--gold); flex-shrink:0;">' + this._esc(it.codigo) + '</span></div>'
        + '<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Invitados <b>' + (inv[it.uid] || 0) + '</b> · Pendiente <b>' + this._eur(m.pend) + '</b> · Cobrado <b>' + this._eur(m.cobr) + '</b></div>'
        + '</div>';
    });
    box.innerHTML = html;
  },

  _fecha(ts) {
    try { return ts.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return ''; }
  },

  async cargarAdmin() {
    const list = document.getElementById('adminReferidosList');
    if (!list) return;
    if (!(this._a && this._a.ok)) this._mostrarCarga(list);
    try {
      await this._listoAdmin();
      this._pendPintada = true;
      this._renderPendientes();
    } catch (e) {
      console.error('Referidos: cargarAdmin', e);
      list.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No se pudo cargar: ' + this._esc(e.message) + '</p>';
    }
  },

  // ---- Pendientes de pagar, agrupadas por quien invitó ----
  _renderPendientes() {
    const list = document.getElementById('adminReferidosList');
    const A = this._a;
    if (!list || !A || !A.ok) return;
    const grupos = {};
    A.coms.filter(c => !c.pagada).forEach(c => {
      const g = grupos[c.referidor] || (grupos[c.referidor] = { nombre: c.referidorNombre || '(sin nombre)', n: 0, total: 0 });
      g.n++; g.total += c.importe || 0;
    });
    const uids = Object.keys(grupos).sort((a, b) => grupos[b].total - grupos[a].total);
    let html = '';
    if (!uids.length) {
      html += '<p style="text-align:center; color:var(--text-secondary);">No hay comisiones pendientes.</p>';
    } else {
      let total = 0;
      uids.forEach(uid => { total += grupos[uid].total; });
      html += '<p style="text-align:center; margin:0 0 14px;">Total pendiente: <b>' + this._eur(total) + '</b></p>';
      uids.forEach(uid => {
        const g = grupos[uid];
        html += '<div class="stat-card" style="display:grid; grid-template-columns:1fr auto; align-items:center; gap:12px; margin-bottom:12px; text-align:left; cursor:default;">'
          + '<div style="min-width:0;"><div style="font-weight:600; font-size:17px; overflow-wrap:anywhere;">' + this._esc(g.nombre) + '</div>'
          + '<div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">' + g.n + ' × ' + this._eur(this.IMPORTE) + ' = <b>' + this._eur(g.total) + '</b></div></div>'
          + '<div style="justify-self:end;"><button class="button-main" style="margin:0 !important; min-width:0; width:auto; height:44px; line-height:44px; padding:0 22px; font-size:14px;" onclick="Referidos.marcarPagado(\'' + this._esc(uid) + '\')">PAGADO</button></div></div>';
      });
    }
    html += '<button class="action-button" style="margin-top:8px;" onclick="Referidos.abrirHistorial()">HISTORIAL DE PAGOS</button>';
    list.innerHTML = html;
  },

  // «CARGANDO» de la app. Su animación completa dura ~1,7 s: se deja terminar entera antes de enseñar los datos.
  ANIMACION_CARGA_MS: 1750,

  _cargandoHTML(centrado) {
    return '<div style="text-align:center; padding:' + (centrado ? '0' : '12px') + ';' + (centrado ? ' min-height:30vh; display:flex; align-items:center; justify-content:center;' : '') + '">' + Utils.cargandoHTML('CARGANDO') + '</div>';
  },

  _mostrarCarga(el, centrado) {
    if (!el) return;
    el.innerHTML = this._cargandoHTML(centrado);
    this._cargaDesde = Date.now();
  },

  // Espera lo que falte para que la animación de CARGANDO acabe entera (si los datos llegaron antes).
  async _esperarCarga(promesa) {
    const r = await promesa;
    const falta = this.ANIMACION_CARGA_MS - (Date.now() - (this._cargaDesde || 0));
    if (falta > 0) await new Promise(res => setTimeout(res, falta));
    return r;
  },

  // Ventana del historial: tamaño fijo (cabecera y botón quietos, solo se desplaza la lista), así no da saltos
  // al abrirse, al cargar ni al borrar un pago.
  _montarModalHistorial() {
    this.cerrarHistorial();
    const overlay = document.createElement('div');
    overlay.id = 'modalPagosReferidosOverlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:20004; animation:ri5AmigoFondo 0.12s ease-out both;';
    overlay.onclick = () => Referidos.cerrarHistorial();
    const modal = document.createElement('div');
    modal.id = 'modalPagosReferidos';
    modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-card); border:1px solid var(--gold); border-radius:16px; padding:24px 20px; z-index:20005; max-width:420px; width:88%; height:min(75vh, 560px); height:min(calc(var(--ri5-vh, 1vh) * 75), 560px); display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; box-shadow:var(--shadow-lg); font-family:inherit; animation:ri5AmigoTarjeta 0.16s ease-out both;';
    modal.innerHTML = '<h3 style="margin:0 0 4px; text-align:center; color:var(--text-primary); flex:0 0 auto;">HISTORIAL DE PAGOS</h3>'
      + '<p id="pagosReferidosTotal" style="margin:0 0 14px; text-align:center; font-size:14px; min-height:20px; flex:0 0 auto;"></p>'
      + '<div id="pagosReferidosCuerpo" style="flex:1 1 auto; min-height:0; overflow-y:auto;"></div>'
      + '<button class="action-button" style="margin:14px 0 0; flex:0 0 auto;" onclick="Referidos.cerrarHistorial()">CERRAR</button>';
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    this._mostrarCarga(document.getElementById('pagosReferidosCuerpo'), true);
  },

  // Historial de todos los pagos hechos: a quién, cuándo, cuánto y la suma total (en tiempo real).
  async abrirHistorial() {
    if (!document.getElementById('modalPagosReferidos')) this._montarModalHistorial();
    try {
      await this._listoAdmin();
    } catch (e) {
      console.error('Referidos: abrirHistorial', e);
      this.cerrarHistorial();
      Utils.showToast('No se pudo cargar el historial: ' + e.message, 'error');
      return;
    }
    this._renderHistorial();
  },

  _renderHistorial() {
    const cuerpoEl = document.getElementById('pagosReferidosCuerpo');
    const A = this._a;
    if (!cuerpoEl || !A || !A.ok) return;   // lo cerraron mientras cargaba
    const lotes = {};
    A.coms.filter(c => c.pagada).forEach(c => {
      const seg = (c.pagadaEn && c.pagadaEn.seconds) || 0;
      const k = c.referidor + '|' + seg;
      const l = lotes[k] || (lotes[k] = { nombre: c.referidorNombre || '(sin nombre)', seg: seg, ts: c.pagadaEn, n: 0, total: 0, invitados: {}, ids: [] });
      l.n++; l.total += c.importe || 0; l.ids.push(c.id);
      if (c.invitadoNombre) l.invitados[c.invitadoNombre] = 1;
    });
    this._lotesHist = lotes;
    const claves = Object.keys(lotes).sort((a, b) => lotes[b].seg - lotes[a].seg);
    let totalPagado = 0;
    claves.forEach(k => { totalPagado += lotes[k].total; });

    let cuerpo = '';
    if (!claves.length) {
      cuerpo = '<p style="text-align:center; color:var(--text-secondary); font-size:13px;">Todavía no se ha pagado ninguna comisión.</p>';
    } else {
      claves.forEach(k => {
        const l = lotes[k];
        const inv = Object.keys(l.invitados).join(', ');
        cuerpo += '<div class="stat-card" style="display:grid; grid-template-columns:1fr auto; gap:10px; align-items:start; margin-bottom:10px; text-align:left; cursor:default;">'
          + '<div style="min-width:0;">'
          + '<div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline;">'
          + '<span style="font-weight:600; overflow-wrap:anywhere;">' + this._esc(l.nombre) + '</span>'
          + '<span style="font-size:12px; color:var(--text-secondary); flex-shrink:0;">' + this._esc(this._fecha(l.ts)) + '</span></div>'
          + '<div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">' + l.n + ' × ' + this._eur(this.IMPORTE) + ' = <b>' + this._eur(l.total) + '</b></div>'
          + (inv ? '<div style="font-size:12px; color:var(--text-secondary); margin-top:4px; overflow-wrap:anywhere;">Por: ' + this._esc(inv) + '</div>' : '')
          + '</div>'
          + '<button title="Eliminar del historial" onclick="Referidos.borrarPago(\'' + this._esc(k) + '\')">🗑️</button></div>';
      });
    }
    const totEl = document.getElementById('pagosReferidosTotal');
    if (totEl) totEl.innerHTML = 'Total pagado: <b style="color:var(--gold);">' + this._eur(totalPagado) + '</b>';
    cuerpoEl.innerHTML = cuerpo;
  },

  // Borra una entrada del historial (todas las comisiones de ese pago). La confirmación sale por encima del historial.
  async borrarPago(clave) {
    const l = this._lotesHist && this._lotesHist[clave];
    if (!l) return;
    const ok = await Utils.confirm('BORRAR PAGO', 'Se borrará del historial el pago a ' + l.nombre + ' (' + l.n + ' × ' + this._eur(this.IMPORTE) + ' = ' + this._eur(l.total) + '). No se puede deshacer.');
    if (!ok) return;
    try {
      const db = firebaseServices.db;
      for (let i = 0; i < l.ids.length; i += 400) {
        const batch = db.batch();
        l.ids.slice(i, i + 400).forEach(id => batch.delete(db.collection('comisiones').doc(id)));
        await batch.commit();
      }
      Utils.showToast('Pago borrado del historial', 'success');   // el historial se repinta solo (tiempo real)
    } catch (e) {
      console.error('Referidos: borrarPago', e);
      Utils.showToast('Error: ' + e.message, 'error');
    }
  },

  // Ventana con las personas que ha invitado un usuario (se abre al pulsar su tarjeta en USUARIOS CON CÓDIGO).
  _montarModalInvitados(it) {
    this.cerrarInvitados();
    const overlay = document.createElement('div');
    overlay.id = 'modalInvitadosOverlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:20004; animation:ri5AmigoFondo 0.12s ease-out both;';
    overlay.onclick = () => Referidos.cerrarInvitados();
    const modal = document.createElement('div');
    modal.id = 'modalInvitados';
    modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-card); border:1px solid var(--gold); border-radius:16px; padding:24px 20px; z-index:20005; max-width:420px; width:88%; height:min(75vh, 560px); height:min(calc(var(--ri5-vh, 1vh) * 75), 560px); display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; box-shadow:var(--shadow-lg); font-family:inherit; animation:ri5AmigoTarjeta 0.16s ease-out both;';
    modal.innerHTML = '<h3 style="margin:0 0 4px; text-align:center; color:var(--text-primary); flex:0 0 auto; overflow-wrap:anywhere;">' + this._esc(it.nombre) + '</h3>'
      + '<div style="text-align:center; font-size:13px; color:var(--text-secondary); flex:0 0 auto;">Código <b style="color:var(--gold); letter-spacing:2px;">' + this._esc(it.codigo) + '</b></div>'
      + '<p id="invitadosResumen" style="margin:8px 0 14px; text-align:center; font-size:13px; min-height:18px; color:var(--text-secondary); flex:0 0 auto;"></p>'
      + '<div id="invitadosCuerpo" style="flex:1 1 auto; min-height:0; overflow-y:auto;"></div>'
      + '<button class="action-button" style="margin:14px 0 0; flex:0 0 auto;" onclick="Referidos.cerrarInvitados()">CERRAR</button>';
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    this._mostrarCarga(document.getElementById('invitadosCuerpo'), true);
  },

  _premiumTexto(u) {
    if (!u) return 'Sin premium';
    const exp = u.expires && (u.expires.toDate ? u.expires.toDate() : new Date(u.expires));
    const vigente = u.premium === true && (!exp || isNaN(exp.getTime()) || exp.getTime() > Date.now());
    if (!vigente) return 'Sin premium';
    return (exp && !isNaN(exp.getTime())) ? 'Premium hasta ' + exp.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Premium';
  },

  async abrirInvitados(uid) {
    const it = this._usuariosCodigo && this._usuariosCodigo[uid];
    if (!it) return;
    this._montarModalInvitados(it);
    this._invitadosUid = uid;
    try {
      await this._listoAdmin();
    } catch (e) {
      console.error('Referidos: abrirInvitados', e);
      this.cerrarInvitados();
      Utils.showToast('No se pudieron cargar los invitados: ' + e.message, 'error');
      return;
    }
    await this._renderInvitados(uid, true);
  },

  // Invitados de un usuario (en tiempo real). Los nombres y el estado premium de cada invitado se vuelven a leer en cada
  // repintado (son pocos documentos) porque el premium cambia justo cuando llega su comisión.
  async _renderInvitados(uid, primera) {
    const A = this._a;
    if (!A || !A.ok || !document.getElementById('modalInvitados')) return;
    const token = this._tokenInv = (this._tokenInv || 0) + 1;
    const db = firebaseServices.db;
    const refs = A.refs.filter(r => r.referidoPor === uid);
    let users;
    try {
      const leer = Promise.all(refs.map(r => db.collection('users').doc(r.id).get().catch(() => null)));
      users = primera ? await this._esperarCarga(leer) : await leer;
    } catch (e) {
      console.error('Referidos: _renderInvitados', e);
      this.cerrarInvitados();
      Utils.showToast('No se pudieron cargar los invitados: ' + e.message, 'error');
      return;
    }
    if (token !== this._tokenInv) return;   // llegó un cambio más reciente mientras tanto
    const cuerpoEl = document.getElementById('invitadosCuerpo');
    if (!cuerpoEl || this._invitadosUid !== uid) return;   // lo cerraron mientras cargaba
    const dinero = {};
    let pendTotal = 0, cobrTotal = 0;
    A.coms.filter(c => c.referidor === uid).forEach(c => {
      const m = dinero[c.invitado] || (dinero[c.invitado] = { pend: 0, cobr: 0 });
      if (c.pagada) { m.cobr += c.importe || 0; cobrTotal += c.importe || 0; } else { m.pend += c.importe || 0; pendTotal += c.importe || 0; }
    });
    const filas = refs.map((r, i) => {
      const u = users[i] && users[i].exists ? users[i].data() : null;
      return { id: r.id, creado: r.creado, pagos: r.pagos || 0, nombre: u ? (u.username || '(sin nombre)') : '(usuario eliminado)', u: u };
    }).sort((a, b) => ((b.creado && b.creado.seconds) || 0) - ((a.creado && a.creado.seconds) || 0));

    const resEl = document.getElementById('invitadosResumen');
    if (resEl) resEl.innerHTML = 'Invitados <b>' + filas.length + '</b> · Pendiente <b>' + this._eur(pendTotal) + '</b> · Cobrado <b>' + this._eur(cobrTotal) + '</b>';
    if (!filas.length) {
      cuerpoEl.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:13px;">Todavía no ha invitado a nadie.</p>';
      return;
    }
    let html = '';
    filas.forEach(f => {
      const m = dinero[f.id] || { pend: 0, cobr: 0 };
      html += '<div class="stat-card" style="margin-bottom:10px; text-align:left; cursor:default;">'
        + '<div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline;">'
        + '<span style="font-weight:600; overflow-wrap:anywhere;">' + this._esc(f.nombre) + '</span>'
        + '<span style="font-size:12px; color:var(--text-secondary); flex-shrink:0;">' + this._esc(this._fecha(f.creado)) + '</span></div>'
        + '<div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">' + this._esc(this._premiumTexto(f.u)) + '</div>'
        + '<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Pagos ' + f.pagos + '/' + this.MAX_PAGOS + ' · Pendiente <b>' + this._eur(m.pend) + '</b> · Cobrado <b>' + this._eur(m.cobr) + '</b></div>'
        + '</div>';
    });
    cuerpoEl.innerHTML = html;
  },

  cerrarInvitados() {
    this._invitadosUid = null;
    ['modalInvitados', 'modalInvitadosOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  },

  cerrarHistorial() {
    ['modalPagosReferidos', 'modalPagosReferidosOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  },

  async marcarPagado(uidReferidor) {
    const ok = await Utils.confirm('MARCAR COMO PAGADO', 'Confirma que ya has enviado el Bizum con todas las comisiones pendientes de este usuario.');
    if (!ok) return;
    try {
      const db = firebaseServices.db;
      const snap = await db.collection('comisiones').where('referidor', '==', uidReferidor).where('pagada', '==', false).get();
      const docs = snap.docs;
      const ahora = firebaseServices.Timestamp.now(); // mismo instante para todo el pago: así el historial lo agrupa
      for (let i = 0; i < docs.length; i += 400) {
        const batch = db.batch();
        docs.slice(i, i + 400).forEach(d => batch.update(d.ref, { pagada: true, pagadaEn: ahora }));
        await batch.commit();
      }
      Utils.showToast('✅ Comisiones marcadas como pagadas', 'success');   // la lista se repinta sola (tiempo real)
    } catch (e) {
      console.error('Referidos: marcarPagado', e);
      Utils.showToast('Error: ' + e.message, 'error');
    }
  }
};
window.Referidos = Referidos;

// Al cerrar sesión se paran todos los listeners (usuario y admin) y se olvida lo guardado.
try {
  firebaseServices.auth.onAuthStateChanged(user => {
    if (!user) { Referidos._detenerUsuario(); Referidos._detenerAdmin(); Referidos._pend = 0; Referidos._miCodigo = ''; }
  });
} catch (e) { console.warn('Referidos: sin listener de sesión', e); }

// La tarjeta del usuario se actualiza al arrancar la app y al abrir Configuración.
window.addEventListener('ri5:appready', () => Referidos.renderUsuario());
document.addEventListener('click', (e) => {
  if (e.target && e.target.closest && e.target.closest('#navPerfil')) setTimeout(() => Referidos.renderUsuario(), 80);
});

// Enlace con código (?ref=CODIGO), el que envía «Compartir RI5»: se guarda en el móvil y se escribe solo en el campo
// «Código de invitación» del registro (se puede borrar o cambiar). Después se limpia la dirección.
(function () {
  try {
    const m = /[?&]ref=([A-Za-z0-9]{3,12})(&|$)/.exec(location.search);
    if (m) {
      localStorage.setItem('ri5_ref_pendiente', m[1].toUpperCase());
      const u = new URL(location.href);
      u.searchParams.delete('ref');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    const cod = localStorage.getItem('ri5_ref_pendiente');
    const inp = document.getElementById('regCodigoRef');
    if (cod && inp && !inp.value) inp.value = cod;
  } catch (_) {}
})();
