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

  _eur(n) { return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'; },
  _esc(t) { return (window.Utils && Utils.escapeHTML) ? Utils.escapeHTML(String(t == null ? '' : t)) : String(t == null ? '' : t); },

  // ---------------- USUARIO ----------------
  async renderUsuario() {
    const box = document.getElementById('referidosCard');
    const uid = window.AppState && AppState.currentUserId;
    if (!box || !uid) return;
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
      const dias = u.created ? (Date.now() - new Date(u.created).getTime()) / 86400000 : 0;
      const mostrarInput = !miRef.exists && !(dias > this.DIAS_PARA_CODIGO);
      if (!codigo && !mostrarInput) { box.style.display = 'none'; box.innerHTML = ''; return; }

      let pend = 0, cobr = 0;
      comSnap.forEach(d => { const c = d.data(); if (c.pagada) cobr += c.importe || 0; else pend += c.importe || 0; });

      let html = '<div class="stat-card" style="margin-bottom:16px; cursor:default;">';
      if (codigo) {
        html += '<h4 style="color:var(--accent-yellow); margin:0 0 6px;">INVITA Y GANA</h4>'
          + '<div style="font-size:26px; font-weight:700; letter-spacing:3px; margin:6px 0;">' + this._esc(codigo) + '</div>'
          + '<p style="font-size:12px; color:var(--text-secondary); line-height:1.5; margin:0 0 12px;">Pásale este código a quien quieras invitar. Por cada invitado que pague premium ganas '
          + this._eur(this.IMPORTE) + ' al mes durante ' + this.MAX_PAGOS + ' meses.</p>'
          + '<div style="font-size:13px; color:var(--text-secondary);">Invitados: <b>' + invSnap.size + '</b> · Pendiente: <b>' + this._eur(pend) + '</b> · Cobrado: <b>' + this._eur(cobr) + '</b></div>';
      }
      if (mostrarInput) {
        html += '<div style="' + (codigo ? 'margin-top:14px; border-top:1px solid var(--border-color); padding-top:12px;' : '') + '">'
          + '<p style="font-size:13px; margin:0 0 8px;">¿Te invitó alguien?</p>'
          + '<input type="text" id="referidosCodigoInput" placeholder="Código de invitación" maxlength="12" autocapitalize="characters" autocomplete="off" style="text-align:center; text-transform:uppercase;">'
          + '<button class="action-button" onclick="Referidos.usarCodigo()">USAR CÓDIGO</button></div>';
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
    Utils.showLoading();
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
      Utils.hideLoading();
    }
    this.renderUsuario();
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

  _fecha(ts) {
    try { return ts.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return ''; }
  },

  async cargarAdmin() {
    const list = document.getElementById('adminReferidosList');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Cargando…</p>';
    try {
      const col = firebaseServices.db.collection('comisiones');
      const [pend, pag] = await Promise.all([
        col.where('pagada', '==', false).get(),
        col.where('pagada', '==', true).get()
      ]);

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

      // ---- Historial: cada pago hecho (una persona + un día) ----
      const lotes = {};
      pag.forEach(d => {
        const c = d.data();
        const seg = (c.pagadaEn && c.pagadaEn.seconds) || 0;
        const k = c.referidor + '|' + seg;
        const l = lotes[k] || (lotes[k] = { nombre: c.referidorNombre || '(sin nombre)', seg: seg, ts: c.pagadaEn, n: 0, total: 0, invitados: {} });
        l.n++; l.total += c.importe || 0;
        if (c.invitadoNombre) l.invitados[c.invitadoNombre] = 1;
      });
      const claves = Object.keys(lotes).sort((a, b) => lotes[b].seg - lotes[a].seg);
      if (claves.length) {
        let totalPagado = 0;
        claves.forEach(k => { totalPagado += lotes[k].total; });
        html += '<h4 style="color:var(--accent-yellow); text-align:center; margin:28px 0 6px;">HISTORIAL DE PAGOS</h4>'
          + '<p style="text-align:center; margin:0 0 14px;">Total pagado: <b>' + this._eur(totalPagado) + '</b></p>';
        claves.slice(0, 50).forEach(k => {
          const l = lotes[k];
          const inv = Object.keys(l.invitados).join(', ');
          html += '<div class="stat-card" style="margin-bottom:10px; text-align:left; cursor:default;">'
            + '<div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline;">'
            + '<span style="font-weight:600; overflow-wrap:anywhere;">' + this._esc(l.nombre) + '</span>'
            + '<span style="font-size:12px; color:var(--text-secondary); flex-shrink:0;">' + this._esc(this._fecha(l.ts)) + '</span></div>'
            + '<div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">' + l.n + ' × ' + this._eur(this.IMPORTE) + ' = <b>' + this._eur(l.total) + '</b></div>'
            + (inv ? '<div style="font-size:12px; color:var(--text-secondary); margin-top:4px; overflow-wrap:anywhere;">Por: ' + this._esc(inv) + '</div>' : '')
            + '</div>';
        });
        if (claves.length > 50) html += '<p style="text-align:center; font-size:12px; color:var(--text-secondary);">Se muestran los 50 pagos más recientes.</p>';
      }
      list.innerHTML = html;
    } catch (e) {
      console.error('Referidos: cargarAdmin', e);
      list.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No se pudo cargar: ' + this._esc(e.message) + '</p>';
    }
  },

  async marcarPagado(uidReferidor) {
    const ok = await Utils.confirm('MARCAR COMO PAGADO', 'Confirma que ya has enviado el Bizum con todas las comisiones pendientes de este usuario.');
    if (!ok) return;
    Utils.showLoading();
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
    } finally {
      Utils.hideLoading();
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
