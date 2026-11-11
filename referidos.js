// ============================================================
// referidos.js - Código de invitación y comisiones por invitar
// ============================================================
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

  // ---------------- USUARIO ----------------
  async renderUsuario() {
    const box = document.getElementById('referidosCard');
    const uid = window.AppState && AppState.currentUserId;
    if (!box || !uid) return;
    // El administrador no ve esta tarjeta: gestiona los códigos desde Administración › Invitar.
    if (window.AppState && AppState.isAdmin === true) { box.style.display = 'none'; box.innerHTML = ''; this.precargarCodigo(); return; }
    try {
      const db = firebaseServices.db;
      const [uSnap, miRef, invSnap, comSnap] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('referidos').doc(uid).get(),
        db.collection('referidos').where('referidoPor', '==', uid).get(),
        db.collection('comisiones').where('referidor', '==', uid).get()
      ]);
      const u = uSnap.exists ? uSnap.data() : {};
      const codigo = u.codigoReferido || '';
      this._miCodigo = codigo;
      const dias = u.created ? (Date.now() - new Date(u.created).getTime()) / 86400000 : 0;
      const mostrarInput = !miRef.exists && !(dias > this.DIAS_PARA_CODIGO);
      if (!codigo && !mostrarInput) { box.style.display = 'none'; box.innerHTML = ''; return; }

      let pend = 0, cobr = 0;
      comSnap.forEach(d => { const c = d.data(); if (c.pagada) cobr += c.importe || 0; else pend += c.importe || 0; });

      let html = '<div class="stat-card" style="margin-bottom:12px; cursor:default; text-align:left; padding:12px 14px !important; border:1px solid var(--gold) !important;">';
      if (codigo) {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">'
          + '<span style="font-size:11px; letter-spacing:1.5px; color:var(--gold); font-weight:600;">INVITA Y GANA</span>'
          + '<span style="font-size:20px; font-weight:700; letter-spacing:2px; color:var(--gold);">' + this._esc(codigo) + '</span></div>'
          + '<div style="font-size:11px; color:var(--text-secondary); line-height:1.4; margin-top:6px;">' + this._eur(this.IMPORTE) + ' al mes durante ' + this.MAX_PAGOS + ' meses por cada invitado que pague premium.</div>'
          + '<div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">Invitados <b>' + invSnap.size + '</b> · Pendiente <b>' + this._eur(pend) + '</b> · Cobrado <b>' + this._eur(cobr) + '</b></div>';
      }
      if (mostrarInput) {
        html += '<div style="' + (codigo ? 'margin-top:10px; border-top:1px solid var(--border-color); padding-top:10px;' : '') + '">'
          + '<div style="font-size:11px; letter-spacing:1.5px; color:var(--gold); font-weight:600; margin-bottom:6px;">¿TE INVITÓ ALGUIEN?</div>'
          + '<div style="display:flex; gap:8px; align-items:center;">'
          + '<input type="text" id="referidosCodigoInput" placeholder="Código de invitación" maxlength="12" autocapitalize="characters" autocomplete="off" style="flex:1; min-width:0; height:40px; margin:0; text-align:center; text-transform:uppercase;">'
          + '<button class="action-button" style="width:auto; min-width:0; height:40px; line-height:40px; margin:0 !important; padding:0 16px; font-size:13px; flex-shrink:0;" onclick="Referidos.usarCodigo()">USAR</button>'
          + '</div></div>';
      }
      html += '</div>';
      box.innerHTML = html;
      box.style.display = 'block';
    } catch (e) {
      console.warn('Referidos: no se pudo pintar la tarjeta', e);
      box.style.display = 'none';
    }
  },

  async usarCodigo() {
    const inp = document.getElementById('referidosCodigoInput');
    const uid = window.AppState && AppState.currentUserId;
    if (!inp || !uid) return;
    const codigo = (inp.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!codigo) { Utils.showToast('Escribe el código de invitación', 'error'); return; }
    const box = document.getElementById('referidosCard');
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
      this.renderUsuario();
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

  // ---------------- ADMIN: usuarios con código ----------------
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

  async cargarUsuariosCodigo() {
    const box = document.getElementById('adminReferidosUsuarios');
    if (!box) return;
    this._mostrarCarga(box);
    try {
      const db = firebaseServices.db;
      const [cods, refs, coms] = await Promise.all([
        db.collection('codigosReferido').get(),
        db.collection('referidos').get(),
        db.collection('comisiones').get()
      ]);
      const inv = {};
      refs.forEach(d => { const u = d.data().referidoPor; inv[u] = (inv[u] || 0) + 1; });
      const money = {};
      coms.forEach(d => {
        const c = d.data();
        const m = money[c.referidor] || (money[c.referidor] = { pend: 0, cobr: 0 });
        if (c.pagada) m.cobr += c.importe || 0; else m.pend += c.importe || 0;
      });
      const items = await Promise.all(cods.docs.map(async d => {
        const uid = d.data().uid;
        let nombre = '(usuario eliminado)';
        try { const u = await db.collection('users').doc(uid).get(); if (u.exists && u.data().username) nombre = u.data().username; } catch (_) {}
        return { codigo: d.id, uid: uid, nombre: nombre };
      }));
      await this._esperarCarga();
      if (!items.length) { box.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Todavía no has asignado ningún código.</p>'; return; }
      items.sort((a, b) => ((inv[b.uid] || 0) - (inv[a.uid] || 0)) || a.nombre.localeCompare(b.nombre));
      let html = '<p style="text-align:center; margin:0 0 14px;"><b>' + items.length + '</b> usuario' + (items.length === 1 ? '' : 's') + ' con código</p>';
      items.forEach(it => {
        const m = money[it.uid] || { pend: 0, cobr: 0 };
        html += '<div class="stat-card" style="margin-bottom:10px; text-align:left; cursor:default;">'
          + '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:12px;">'
          + '<span style="font-weight:600; overflow-wrap:anywhere;">' + this._esc(it.nombre) + '</span>'
          + '<span style="font-weight:700; letter-spacing:2px; color:var(--gold); flex-shrink:0;">' + this._esc(it.codigo) + '</span></div>'
          + '<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Invitados <b>' + (inv[it.uid] || 0) + '</b> · Pendiente <b>' + this._eur(m.pend) + '</b> · Cobrado <b>' + this._eur(m.cobr) + '</b></div>'
          + '</div>';
      });
      box.innerHTML = html;
    } catch (e) {
      console.error('Referidos: cargarUsuariosCodigo', e);
      box.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No se pudo cargar: ' + this._esc(e.message) + '</p>';
    }
  },

  _fecha(ts) {
    try { return ts.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return ''; }
  },

  async cargarAdmin() {
    const list = document.getElementById('adminReferidosList');
    if (!list) return;
    this._mostrarCarga(list);
    try {
      const col = firebaseServices.db.collection('comisiones');
      const pend = await this._esperarCarga(col.where('pagada', '==', false).get());

      // ---- Pendientes de pagar, agrupadas por quien invitó ----
      const grupos = {};
      pend.forEach(d => {
        const c = d.data();
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
    } catch (e) {
      console.error('Referidos: cargarAdmin', e);
      list.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No se pudo cargar: ' + this._esc(e.message) + '</p>';
    }
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
    modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-card); border:1px solid var(--gold); border-radius:16px; padding:24px 20px; z-index:20005; max-width:420px; width:88%; height:min(75vh, 560px); display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; box-shadow:var(--shadow-lg); font-family:inherit; animation:ri5AmigoTarjeta 0.16s ease-out both;';
    modal.innerHTML = '<h3 style="margin:0 0 4px; text-align:center; color:var(--text-primary); flex:0 0 auto;">HISTORIAL DE PAGOS</h3>'
      + '<p id="pagosReferidosTotal" style="margin:0 0 14px; text-align:center; font-size:14px; min-height:20px; flex:0 0 auto;"></p>'
      + '<div id="pagosReferidosCuerpo" style="flex:1 1 auto; min-height:0; overflow-y:auto;"></div>'
      + '<button class="action-button" style="margin:14px 0 0; flex:0 0 auto;" onclick="Referidos.cerrarHistorial()">CERRAR</button>';
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    this._mostrarCarga(document.getElementById('pagosReferidosCuerpo'), true);
  },

  // Historial de todos los pagos hechos: a quién, cuándo, cuánto y la suma total.
  async abrirHistorial() {
    if (!document.getElementById('modalPagosReferidos')) this._montarModalHistorial();
    let pag;
    try {
      pag = await this._esperarCarga(firebaseServices.db.collection('comisiones').where('pagada', '==', true).get());
    } catch (e) {
      console.error('Referidos: abrirHistorial', e);
      this.cerrarHistorial();
      Utils.showToast('No se pudo cargar el historial: ' + e.message, 'error');
      return;
    }
    const cuerpoEl = document.getElementById('pagosReferidosCuerpo');
    if (!cuerpoEl) return; // lo cerraron mientras cargaba
    const lotes = {};
    pag.forEach(d => {
      const c = d.data();
      const seg = (c.pagadaEn && c.pagadaEn.seconds) || 0;
      const k = c.referidor + '|' + seg;
      const l = lotes[k] || (lotes[k] = { nombre: c.referidorNombre || '(sin nombre)', seg: seg, ts: c.pagadaEn, n: 0, total: 0, invitados: {}, ids: [] });
      l.n++; l.total += c.importe || 0; l.ids.push(d.id);
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
    this._mostrarCarga(document.getElementById('pagosReferidosCuerpo'), true);
    try {
      const db = firebaseServices.db;
      for (let i = 0; i < l.ids.length; i += 400) {
        const batch = db.batch();
        l.ids.slice(i, i + 400).forEach(id => batch.delete(db.collection('comisiones').doc(id)));
        await batch.commit();
      }
      Utils.showToast('Pago borrado del historial', 'success');
    } catch (e) {
      console.error('Referidos: borrarPago', e);
      Utils.showToast('Error: ' + e.message, 'error');
    }
    this.abrirHistorial();
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
      Utils.showToast('✅ Comisiones marcadas como pagadas', 'success');
    } catch (e) {
      console.error('Referidos: marcarPagado', e);
      Utils.showToast('Error: ' + e.message, 'error');
    }
    this.cargarAdmin();
  }
};
window.Referidos = Referidos;

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
