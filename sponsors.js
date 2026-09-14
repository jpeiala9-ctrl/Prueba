// ==================== sponsors.js ====================
// NUEVO MÓDULO. Gestiona las "tiendas patrocinadoras" que aparecen como
// banner en el Dashboard (Inicio) y dentro del aviso de kilometraje de
// zapatillas, a cambio de material/descuentos para los usuarios de RI5.
//
// Versión: 1.0
// - Colección Firestore 'sponsors': cada documento es una tienda
//   patrocinadora (nombre, descripción, descuento, enlace, imagen, activo,
//   orden, clics). Se permite crear una tienda SIN enlace todavía (queda
//   forzada a activo:false hasta que se rellene un enlace real) para poder
//   montar toda la ficha ahora y activarla en cuanto llegue la URL.
// - Reutiliza el sistema de zapatilla YA EXISTENTE en gamification.js
//   (currentShoe.km, ver Gamification.getCurrentShoe) en vez de duplicar
//   el cálculo de distancia -- así no se toca la lógica delicada de
//   reconciliación de km de gamification.js. El seguimiento de "a qué
//   umbral ya se avisó" vive por completo aquí, en el propio documento
//   'gamification/{uid}' pero en campos NUEVOS y separados
//   (zapatillaAlertaKm / zapatillaAlertaNombre) para no interferir con
//   nada que ya existiera.
// - El contador de clics es un único campo 'clics' por tienda (se
//   incrementa tanto desde el banner del Dashboard como desde el aviso de
//   zapatillas -- son el mismo botón, la misma tienda).
//
// IMPORTANTE (pendiente de configurar fuera de este archivo):
// - Reglas de Firestore: hay que permitir lectura de 'sponsors' a
//   cualquier usuario autenticado y escritura solo a administradores,
//   igual que ya se hace con el resto de datos de admin en tu
//   firestore.rules. Este archivo no puede tocar esas reglas.
// - Reglas de Storage: si se sube una foto de tienda, se guarda en
//   'sponsor_images/{sponsorId}.jpg' -- añade una regla equivalente a la
//   de 'profile_pictures' pero restringiendo la escritura a admin.
// ======================================================================

const Sponsors = {
  COLECCION: 'sponsors',

  // A partir de este kilometraje se considera razonable empezar a pensar
  // en cambiar de zapatillas, y a partir de ahí se recuerda otra vez cada
  // INTERVALO_KM (500, 600, 700...). Son constantes fáciles de ajustar si
  // alguna vez quieres mover el umbral.
  UMBRAL_INICIAL_KM: 500,
  INTERVALO_KM: 100,

  // Caché en memoria (no persistida) de las últimas tiendas cargadas,
  // indexadas por id -- así los botones "Ver oferta" solo necesitan el id
  // (evita tener que escapar la URL entera dentro de un atributo onclick).
  _mapaSponsors: {},
  _ultimaListaAdmin: {},
  _imagenPendiente: null,
  _editandoId: null,

  // ================== LECTURA / BANNER PÚBLICO ==================

  async getActivos() {
    try {
      const snap = await firebaseServices.db.collection(this.COLECCION)
        .where('activo', '==', true)
        .get();
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Orden en el cliente (no en la query) a propósito: así no hace
      // falta crear ningún índice compuesto en Firestore para esto.
      lista.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      lista.forEach(sp => { this._mapaSponsors[sp.id] = sp; });
      return lista;
    } catch (error) {
      console.error('Error cargando tiendas patrocinadoras:', error);
      return [];
    }
  },

  async getTodos() {
    try {
      const snap = await firebaseServices.db.collection(this.COLECCION).get();
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lista.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      return lista;
    } catch (error) {
      console.error('Error cargando lista completa de tiendas:', error);
      return [];
    }
  },

  // Se llama desde el botón "Ir a la tienda", tanto en el banner del
  // Dashboard como dentro del aviso de zapatillas. Busca la tienda en la
  // caché de la última carga (getActivos ya la rellenó) para no depender
  // de escapar el enlace dentro del HTML.
  abrir(id) {
    const sp = this._mapaSponsors[id];
    if (!sp) return;
    const enlace = (sp.enlace || '').trim();
    if (!/^https?:\/\//i.test(enlace)) {
      Utils.showToast('El enlace de esta tienda todavía no está configurado', 'info');
      return;
    }
    window.open(enlace, '_blank');
    firebaseServices.db.collection(this.COLECCION).doc(sp.id)
      .update({ clics: firebaseServices.FieldValue.increment(1) })
      .catch(err => console.warn('No se pudo registrar el clic:', err));
  },

  // Construye la tarjeta (imagen/emoji + nombre + descuento + botón).
  // 'compacta' se usa dentro del aviso de zapatillas, donde hay menos
  // espacio disponible que en el banner grande del Dashboard.
  _tarjetaHTML(sp, compacta = false) {
    const nombre = Utils.escapeHTML(sp.nombre || 'Tienda colaboradora');
    const descripcion = sp.descripcion ? Utils.escapeHTML(sp.descripcion) : '';
    const descuento = sp.descuento ? Utils.escapeHTML(sp.descuento) : '';
    const imagen = sp.imagenUrl
      ? `<img src="${Utils.escapeHTML(sp.imagenUrl)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='🏬';">`
      : `<span style="font-size:${compacta ? '26px' : '30px'};">🏬</span>`;
    const tamañoImg = compacta ? 56 : 68;

    const pillDescuento = descuento
      ? `<div style="display:inline-flex; align-items:center; padding:5px 12px; background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.35); border-radius:20px; font-size:11px; color:var(--gold); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">🏷️ ${descuento}</div>`
      : `<span></span>`;

    return `
      <div style="display:flex; align-items:flex-start; gap:${compacta ? '12px' : '14px'};">
        <div style="width:${tamañoImg}px; height:${tamañoImg}px; flex-shrink:0; border-radius:14px; overflow:hidden; background:var(--bg-primary); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center;">
          ${imagen}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:9px; letter-spacing:1px; color:var(--gold); text-transform:uppercase; margin-bottom:3px;">🤝 Tienda colaboradora</div>
          <div style="font-size:${compacta ? '14px' : '15px'}; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${nombre}</div>
          ${descripcion ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:2px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical;">${descripcion}</div>` : ''}
        </div>
      </div>
      <div style="display:flex; align-items:center; justify-content:${descuento ? 'space-between' : 'flex-end'}; gap:10px; margin-top:14px; max-width:100%;">
        ${pillDescuento}
        <button onclick="Sponsors.abrir('${sp.id}')" style="flex-shrink:0; box-sizing:border-box; max-width:100%; padding:${compacta ? '9px 16px' : '11px 20px'}; border-radius:10px; background:var(--gold); color:#0a0a0a; font-weight:700; font-size:${compacta ? '11px' : '12px'}; line-height:1.2; letter-spacing:0.3px; border:none; cursor:pointer; white-space:nowrap; -webkit-text-size-adjust:100%; text-size-adjust:100%;">IR A LA TIENDA</button>
      </div>
    `;
  },

  // Se llama al cargar/refrescar el Dashboard. No bloquea nada del resto
  // de la carga: si falla o no hay tiendas activas, simplemente oculta la
  // tarjeta sin mostrar ningún error al usuario.
  async renderBannerInicio() {
    const container = document.getElementById('dashboardSponsorCard');
    if (!container) return;
    try {
      const activos = await this.getActivos();
      if (!activos.length) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      const sp = activos[0];
      container.innerHTML = this._tarjetaHTML(sp, false);
      container.style.display = 'block';
    } catch (error) {
      console.error('Error pintando el banner de tienda:', error);
      container.style.display = 'none';
    }
  },

  // ================== AVISO DE KILOMETRAJE DE ZAPATILLAS ==================

  // Se llama justo después de marcar una sesión como completada (ver
  // calendar.js). No debe interrumpir ni ralentizar ese flujo si algo
  // falla aquí -- por eso quien llama la envuelve en try/catch.
  async comprobarUmbralZapatilla(uid) {
    if (!uid || !window.Gamification) return;
    const shoe = await Gamification.getCurrentShoe(uid);
    if (!shoe || !isFinite(shoe.km)) return;

    const ref = firebaseServices.db.collection('gamification').doc(uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};

    let alertaKmPrevia = data.zapatillaAlertaKm || 0;
    const alertaNombrePrevio = data.zapatillaAlertaNombre || null;

    // Si ha cambiado de zapatilla desde el último aviso (o es la primera
    // vez), el seguimiento se reinicia: los km de la zapatilla nueva
    // empiezan desde 0, así que no tendría sentido conservar el umbral
    // de la anterior.
    if (alertaNombrePrevio !== shoe.name) {
      alertaKmPrevia = 0;
    }

    const umbralCruzado = this._calcularUmbralCruzado(alertaKmPrevia, shoe.km);

    if (umbralCruzado) {
      await ref.set({ zapatillaAlertaKm: umbralCruzado, zapatillaAlertaNombre: shoe.name }, { merge: true });
      await this.mostrarAlertaZapatillas(shoe, umbralCruzado);
    } else if (alertaNombrePrevio !== shoe.name) {
      // Solo hubo cambio de zapatilla, sin llegar todavía a cruzar el
      // primer umbral: se guarda igualmente el reinicio para que la
      // próxima comprobación parta de 0, no del valor de la zapatilla
      // anterior.
      await ref.set({ zapatillaAlertaKm: 0, zapatillaAlertaNombre: shoe.name }, { merge: true });
    }
  },

  // Devuelve el escalón (500, 600, 700...) que se ha cruzado por primera
  // vez entre 'previo' y 'actual', o null si no se ha cruzado ninguno
  // nuevo todavía.
  _calcularUmbralCruzado(previo, actual) {
    if (actual < this.UMBRAL_INICIAL_KM) return null;
    const pasos = Math.floor((actual - this.UMBRAL_INICIAL_KM) / this.INTERVALO_KM);
    const umbralActual = this.UMBRAL_INICIAL_KM + pasos * this.INTERVALO_KM;
    return umbralActual > previo ? umbralActual : null;
  },

  async mostrarAlertaZapatillas(shoe, umbral) {
    const overlay = document.getElementById('zapatillaAlertaOverlay');
    const modal = document.getElementById('zapatillaAlertaModal');
    const contenido = document.getElementById('zapatillaAlertaContenido');
    if (!overlay || !modal || !contenido) return;

    const nombre = Utils.escapeHTML(shoe.name || 'tu zapatilla actual');
    let promoHTML = '';
    try {
      const activos = await this.getActivos();
      if (activos.length) {
        promoHTML = `
          <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--border-color);">
            ${this._tarjetaHTML(activos[0], true)}
          </div>
        `;
      }
    } catch (e) { /* si falla la promo, se muestra igualmente el aviso */ }

    contenido.innerHTML = `
      <div style="text-align:center; font-size:40px; margin-bottom:8px;">👟</div>
      <h3 style="margin:0 0 10px; text-align:center; color:var(--gold);">HORA DE PENSAR EN UNAS ZAPATILLAS NUEVAS</h3>
      <p style="text-align:center; color:var(--text-secondary); font-size:13px; line-height:1.5; margin:0;">
        <strong style="color:var(--text-primary);">${nombre}</strong> ya lleva <strong style="color:var(--gold);">${umbral} km</strong>.
        A partir de aquí la amortiguación empieza a perder efectividad y aumenta el riesgo de lesión.
      </p>
      ${promoHTML}
    `;

    overlay.style.display = 'block';
    modal.style.display = 'block';
  },

  cerrarAlertaZapatillas() {
    const overlay = document.getElementById('zapatillaAlertaOverlay');
    const modal = document.getElementById('zapatillaAlertaModal');
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
  },

  // ================== PANEL DE ADMINISTRACIÓN ==================

  async cargarAdminLista() {
    if (!AppState.isAdmin) return;
    const container = document.getElementById('adminPatrocinadoresList');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:20px; font-size:13px;">Cargando...</div>';

    const lista = await this.getTodos();
    this._ultimaListaAdmin = {};
    lista.forEach(sp => { this._ultimaListaAdmin[sp.id] = sp; });

    if (!lista.length) {
      container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:20px; font-size:13px;">Todavía no has añadido ninguna tienda.</div>';
      return;
    }

    container.innerHTML = lista.map(sp => {
      const nombre = Utils.escapeHTML(sp.nombre || '(sin nombre)');
      const sinEnlace = !/^https?:\/\//i.test(sp.enlace || '');
      const activo = !!sp.activo;
      const imagen = sp.imagenUrl
        ? `<img src="${Utils.escapeHTML(sp.imagenUrl)}" style="width:100%; height:100%; object-fit:cover;">`
        : `<span style="font-size:20px;">🏬</span>`;
      return `
        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:14px; padding:12px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:12px; max-width:100%;">
            <div style="width:44px; height:44px; flex-shrink:0; border-radius:10px; overflow:hidden; background:var(--bg-primary); display:flex; align-items:center; justify-content:center;">${imagen}</div>
            <div style="flex:1; min-width:0; font-weight:600; font-size:14px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${nombre}</div>
            <button onclick="Sponsors.toggleActivo('${sp.id}')" style="flex-shrink:0; box-sizing:border-box; max-width:45%; border:1px solid ${activo ? 'var(--gold)' : 'var(--border-color)'}; background:${activo ? 'rgba(192,160,96,0.12)' : 'transparent'}; color:${activo ? 'var(--gold)' : 'var(--text-secondary)'}; border-radius:20px; padding:5px 10px; font-size:11px; line-height:1.2; cursor:pointer; white-space:nowrap; -webkit-text-size-adjust:100%; text-size-adjust:100%;">${activo ? '✅ ACTIVA' : '⛔ INACTIVA'}</button>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border-color);">
            <div style="font-size:11px; color:var(--text-secondary); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              👆 ${sp.clics || 0} clics${sinEnlace ? ' · <span style="color:#c99ba5;">sin enlace todavía</span>' : ''}
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button onclick="Sponsors.abrirFormulario('${sp.id}')" style="border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); border-radius:10px; padding:6px 10px; cursor:pointer;">✏️</button>
              <button onclick="Sponsors.eliminar('${sp.id}')" style="border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); border-radius:10px; padding:6px 10px; cursor:pointer;">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async toggleActivo(id) {
    const sp = this._ultimaListaAdmin[id];
    if (!sp) return;
    const nuevoEstado = !sp.activo;
    if (nuevoEstado && !/^https?:\/\//i.test(sp.enlace || '')) {
      Utils.showToast('Añade primero un enlace válido antes de activarla', 'error');
      return;
    }
    try {
      await firebaseServices.db.collection(this.COLECCION).doc(id).update({ activo: nuevoEstado });
      sp.activo = nuevoEstado;
      Utils.showToast(nuevoEstado ? '✅ Tienda activada' : 'Tienda desactivada', 'success');
      this.cargarAdminLista();
      this.renderBannerInicio();
    } catch (error) {
      console.error('Error cambiando estado de la tienda:', error);
      Utils.showToast('Error: ' + error.message, 'error');
    }
  },

  abrirFormulario(id = null) {
    const overlay = document.getElementById('sponsorFormOverlay');
    const modal = document.getElementById('sponsorFormModal');
    if (!overlay || !modal) return;

    this._editandoId = id;
    this._imagenPendiente = null;

    const sp = id ? this._ultimaListaAdmin[id] : null;
    document.getElementById('sponsorFormTitulo').textContent = id ? 'EDITAR TIENDA' : 'NUEVA TIENDA';
    document.getElementById('sponsorFormNombre').value = sp?.nombre || '';
    document.getElementById('sponsorFormDescripcion').value = sp?.descripcion || '';
    document.getElementById('sponsorFormDescuento').value = sp?.descuento || '';
    document.getElementById('sponsorFormEnlace').value = sp?.enlace || '';
    document.getElementById('sponsorFormActivo').checked = !!sp?.activo;
    this._pintarPreviewImagen(sp?.imagenUrl || null);

    overlay.style.display = 'block';
    modal.style.display = 'block';
  },

  cerrarFormulario() {
    const overlay = document.getElementById('sponsorFormOverlay');
    const modal = document.getElementById('sponsorFormModal');
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
    this._editandoId = null;
    this._imagenPendiente = null;
  },

  _pintarPreviewImagen(url) {
    const preview = document.getElementById('sponsorFormImagenPreview');
    if (!preview) return;
    preview.innerHTML = url
      ? `<img src="${Utils.escapeHTML(url)}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`
      : `<span style="font-size:24px;">🏬</span>`;
  },

  seleccionarImagen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const comprimida = (window.Profile && Profile.compressImageToTarget)
          ? await Profile.compressImageToTarget(file, 1200, 1.5 * 1024 * 1024)
          : file;
        this._imagenPendiente = comprimida;
        const urlLocal = URL.createObjectURL(comprimida);
        this._pintarPreviewImagen(urlLocal);
      } catch (error) {
        console.error('Error procesando la imagen de la tienda:', error);
        Utils.showToast('Error al procesar la imagen', 'error');
      }
    };
    input.click();
  },

  async guardar() {
    if (!AppState.isAdmin) return;
    const nombre = document.getElementById('sponsorFormNombre').value.trim();
    if (!nombre) {
      Utils.showToast('Ponle un nombre a la tienda', 'error');
      return;
    }
    const descripcion = document.getElementById('sponsorFormDescripcion').value.trim();
    const descuento = document.getElementById('sponsorFormDescuento').value.trim();
    let enlace = document.getElementById('sponsorFormEnlace').value.trim();
    if (enlace && !/^https?:\/\//i.test(enlace)) enlace = 'https://' + enlace;
    let activo = document.getElementById('sponsorFormActivo').checked;

    if (activo && !enlace) {
      activo = false;
      Utils.showToast('Se guarda como inactiva: todavía no tiene enlace', 'info');
    }

    Utils.showLoading();
    try {
      const ref = this._editandoId
        ? firebaseServices.db.collection(this.COLECCION).doc(this._editandoId)
        : firebaseServices.db.collection(this.COLECCION).doc();

      const datos = {
        nombre, descripcion, descuento, enlace, activo,
        actualizadoEn: firebaseServices.Timestamp.now()
      };
      if (!this._editandoId) {
        datos.orden = 0;
        datos.clics = 0;
        datos.creadoEn = firebaseServices.Timestamp.now();
      }
      await ref.set(datos, { merge: true });

      if (this._imagenPendiente) {
        const storageRef = firebaseServices.storage.ref(`sponsor_images/${ref.id}.jpg`);
        await storageRef.put(this._imagenPendiente);
        const imagenUrl = await storageRef.getDownloadURL();
        await ref.update({ imagenUrl });
      }

      Utils.hideLoading();
      Utils.showToast('✅ Tienda guardada', 'success');
      this.cerrarFormulario();
      this.cargarAdminLista();
      this.renderBannerInicio();
    } catch (error) {
      Utils.hideLoading();
      console.error('Error guardando la tienda:', error);
      Utils.showToast('Error: ' + error.message, 'error');
    }
  },

  async eliminar(id) {
    const sp = this._ultimaListaAdmin[id];
    const confirmado = await Utils.confirm(
      'ELIMINAR TIENDA',
      `¿Eliminar "${sp?.nombre || 'esta tienda'}" de forma permanente? Se perderá también su contador de clics.`
    );
    if (!confirmado) return;

    Utils.showLoading();
    try {
      await firebaseServices.db.collection(this.COLECCION).doc(id).delete();
      try { await firebaseServices.storage.ref(`sponsor_images/${id}.jpg`).delete(); } catch (e) { /* puede no tener imagen */ }
      Utils.hideLoading();
      Utils.showToast('Tienda eliminada', 'success');
      this.cargarAdminLista();
      this.renderBannerInicio();
    } catch (error) {
      Utils.hideLoading();
      console.error('Error eliminando la tienda:', error);
      Utils.showToast('Error: ' + error.message, 'error');
    }
  }
};

window.Sponsors = Sponsors;
console.log('✅ sponsors.js v1.0 listo (banner + aviso de zapatillas + panel admin)');
