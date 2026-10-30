// ==================== consent.js ====================
// Versión: 1.0 - Consentimiento explícito versionado (RGPD).
//  · Registro nuevo: las 3 casillas del formulario se guardan al verificar el correo.
//  · Usuarios existentes: se les pide UNA vez (y cada vez que suba VERSION).
//  · Prueba de aceptación: usersPrivate/{uid}.consent = { version, acceptedAt (servidor), health, age14 }.
// A PRUEBA DE FALLOS: si no se puede leer o guardar (sin red, reglas aún sin desplegar...) NUNCA bloquea la app.
const Consent = {
  VERSION: '2026-10-30',      // ← súbela cuando cambies de forma relevante el texto legal
  _mostrando: false,
  _comprobado: null,          // uid ya comprobado en esta carga de la página

  _claveLocal(uid) { return 'ri5_consent_ok_' + uid + '_' + this.VERSION; },
  _clavePend(uid)  { return 'ri5_consent_pendiente_' + uid; },

  // Lo llama registerUser() justo tras crear la cuenta (el usuario marcó las 3 casillas).
  guardarPendienteRegistro(uid) {
    try { localStorage.setItem(this._clavePend(uid), JSON.stringify({ version: this.VERSION })); } catch (_) {}
  },

  async _guardar(uid, email) {
    const fs = window.firebaseServices;
    const mail = email || (fs.auth.currentUser && fs.auth.currentUser.email) || null;
    if (!mail) throw new Error('sin email');
    await fs.db.collection('usersPrivate').doc(uid).set({
      uid,
      email: mail,
      consent: { version: this.VERSION, acceptedAt: fs.FieldValue.serverTimestamp(), health: true, age14: true }
    }, { merge: true });
    try { localStorage.setItem(this._claveLocal(uid), '1'); localStorage.removeItem(this._clavePend(uid)); } catch (_) {}
  },

  async check(uid, email) {
    try {
      const fs = window.firebaseServices;
      if (!uid || !fs || this._mostrando || this._comprobado === uid) return;
      let data = null;
      try {
        const snap = await fs.db.collection('usersPrivate').doc(uid).get();
        data = snap.exists ? snap.data() : null;
      } catch (e) { console.warn('Consent: no se pudo leer; no se bloquea la app', e); return; }

      this._comprobado = uid;
      if (data && data.consent && data.consent.version === this.VERSION) return;   // ya aceptado

      let local = false, pend = false;
      try { local = localStorage.getItem(this._claveLocal(uid)) === '1'; pend = !!localStorage.getItem(this._clavePend(uid)); } catch (_) {}
      if (local || pend) {   // aceptado en este dispositivo y aún sin guardar en servidor: reintento silencioso
        try { await this._guardar(uid, email); } catch (e) { console.warn('Consent: se reintentará en el próximo acceso', e); }
        return;
      }
      this._mostrar(uid, email);
    } catch (e) { console.warn('Consent.check no bloquea la app:', e); }
  },

  _mostrar(uid, email) {
    if (document.getElementById('consentOverlay')) return;
    this._mostrando = true;
    const ov = document.createElement('div');
    ov.id = 'consentOverlay';
    ov.style.cssText = 'position:fixed; inset:0; z-index:2147483000; background:rgba(0,0,0,0.88); display:flex; align-items:center; justify-content:center; padding:16px; overflow-y:auto;';
    const lab = 'display:flex; align-items:flex-start; gap:10px; font-size:13px; line-height:1.4; color:var(--text-secondary); cursor:pointer; text-align:left; margin-bottom:12px;';
    const chk = 'margin-top:2px; width:18px; height:18px; flex-shrink:0; cursor:pointer;';
    ov.innerHTML = `
      <div role="dialog" aria-modal="true" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:16px; padding:22px; max-width:520px; width:100%; max-height:92vh; overflow-y:auto; box-shadow:var(--shadow-lg); font-family:inherit;">
        <h3 style="margin:0 0 10px; text-align:center; color:var(--gold);">🔒 ACTUALIZAMOS NUESTRA PRIVACIDAD</h3>
        <p style="font-size:14px; line-height:1.55; color:var(--text-secondary); margin:0 0 14px;">
          Hemos actualizado las condiciones de uso y la política de privacidad de RI5 para explicarte con claridad qué datos usamos y quién puede verlos. Para seguir usando la app necesitamos que lo confirmes.
        </p>
        <a href="privacidad.html" target="_blank" rel="noopener" style="display:inline-block; margin:0 0 16px; font-size:13px; color:var(--gold); text-decoration:underline;">📄 Leer condiciones y privacidad</a>
        <label style="${lab}"><input type="checkbox" id="consentT" style="${chk}"><span>He leído y acepto las condiciones de uso y la política de privacidad.</span></label>
        <label style="${lab}"><input type="checkbox" id="consentH" style="${chk}"><span>Doy mi consentimiento explícito para que RI5 trate mis datos de salud y entrenamiento (frecuencia cardíaca, peso, altura, rutas GPS) para ofrecerme la app. Puedo retirarlo eliminando mi cuenta.</span></label>
        <label style="${lab}"><input type="checkbox" id="consentE" style="${chk}"><span>Tengo 14 años o más.</span></label>
        <div id="consentErr" style="display:none; color:var(--st-red); font-size:12px; margin:0 0 8px;"></div>
        <button class="button-main" id="consentOk" disabled style="margin-top:6px;">ACEPTAR Y CONTINUAR</button>
        <button class="action-button" id="consentNo" style="margin-top:10px;">NO ACEPTO · CERRAR SESIÓN</button>
      </div>`;
    document.body.appendChild(ov);

    const t = ov.querySelector('#consentT'), h = ov.querySelector('#consentH'), e = ov.querySelector('#consentE');
    const ok = ov.querySelector('#consentOk'), no = ov.querySelector('#consentNo'), err = ov.querySelector('#consentErr');
    const sync = () => { ok.disabled = !(t.checked && h.checked && e.checked); };
    [t, h, e].forEach(c => c.addEventListener('change', sync));

    ok.addEventListener('click', async () => {
      if (ok.disabled) return;
      ok.disabled = true;
      try {
        await this._guardar(uid, email);
      } catch (ex) {
        // No dejamos a nadie atrapado: se recuerda en este dispositivo y se reintenta guardar en el próximo acceso.
        console.warn('Consent: no se pudo guardar ahora', ex);
        try { localStorage.setItem(this._claveLocal(uid), '1'); } catch (_) {}
      }
      ov.remove();
      this._mostrando = false;
    });

    no.addEventListener('click', async () => {
      try { await window.firebaseServices.auth.signOut(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}
      location.reload();
    });
  }
};
window.Consent = Consent;

// Se comprueba al restaurar la sesión y tras verificar el correo / iniciar sesión.
(function () {
  try {
    firebaseServices.auth.onAuthStateChanged(user => {
      if (user && user.emailVerified) setTimeout(() => Consent.check(user.uid, user.email), 2500);
    });
  } catch (e) { console.warn('Consent: sin listener de sesión', e); }

  const instalarHook = () => {
    try {
      if (typeof Auth === 'undefined' || Auth.__consentHook || typeof Auth._cargarDatosYMostrarApp !== 'function') return;
      const orig = Auth._cargarDatosYMostrarApp;
      Auth._cargarDatosYMostrarApp = async function (uid, email) {
        const r = await orig.apply(this, arguments);
        setTimeout(() => Consent.check(uid, email), 1500);
        return r;
      };
      Auth.__consentHook = true;
    } catch (e) { console.warn('Consent: sin hook de login', e); }
  };
  instalarHook();
})();
console.log('✅ Consent v1.0 (versión de consentimiento ' + Consent.VERSION + ')');
