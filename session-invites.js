// ==================== session-invites.js ====================
// Módulo "Generar sesión" del panel de administración.
// VERSIÓN FINAL: flujo encadenado sin saltos visuales, con animación
// de "EN PROCESO" completa antes de mostrar la siguiente invitación.
// Y con la funcionalidad de checkbox "Distancia" por paso.
// ====================

const SessionInvites = {
  unsubscribe: null,
  _shownIds: new Set(),
  _colaPendientes: [],
  _modalInviteAbierto: false,
  _dashboardCargado: false,

  _editable: null,
  _mesCalendario: null,
  _fechasSeleccionadas: null,
  _usuariosTodos: null,
  _usuariosSeleccionados: null,

  _ZONAS: [
    { codigo: 'Z1', etiqueta: 'RECUPERACIÓN', factorPace: 1.35 },
    { codigo: 'Z2', etiqueta: 'BASE', factorPace: 1.25 },
    { codigo: 'Z3', etiqueta: 'TEMPO', factorPace: 1.15 },
    { codigo: 'Z4', etiqueta: 'UMBRAL', factorPace: 1.05 },
    { codigo: 'Z5', etiqueta: 'VO₂MÁX', factorPace: 0.95 },
    { codigo: 'Z6', etiqueta: 'VELOCIDAD', factorPace: 0.85 }
  ],

  _zonaInfo(codigo) {
    return this._ZONAS.find(z => z.codigo === codigo) || this._ZONAS[1];
  },

  _calcularTSS(duracionMin, zonaCodigo) {
    const factoresIF = { Z1: 0.6, Z2: 0.7, Z3: 0.85, Z4: 0.95, Z5: 1.05, Z6: 1.15 };
    const ifactor = factoresIF[zonaCodigo] || 0.8;
    return Math.round((duracionMin || 0) * ifactor * ifactor);
  },

  async _obtenerCalculoDestinatario(uid) {
    if (uid === AppState.currentUserId && window.AppState && Array.isArray(AppState.lastZones) && AppState.lastZones.length && AppState.lastRitmoBase) {
      return { zones: AppState.lastZones, ritmoBase: AppState.lastRitmoBase };
    }
    try {
      if (window.Storage && typeof Storage.getUltimoCalculo === 'function') {
        const calc = await Storage.getUltimoCalculo(uid);
        if (calc && Array.isArray(calc.zones) && calc.zones.length && calc.ritmoBase) return calc;
      }
    } catch (e) {
      console.warn('Error obteniendo el cálculo de zonas del destinatario:', e);
    }
    return null;
  },

  async _obtenerPesoUsuario(uid) {
    try {
      const doc = await firebaseServices.db.collection('users').doc(uid).get();
      return doc.exists ? (doc.data()?.profile?.weight || null) : null;
    } catch (e) {
      console.warn('Error obteniendo el peso del destinatario:', e);
      return null;
    }
  },

  // 🔥 MODIFICADO: usa sumaDistancia para decidir qué pasos aportan distancia
  _calcularPersonalizacion(zonaCodigo, parteInput, calculo, peso, pasosDetallados) {
    const duracionTotalMin = (pasosDetallados || []).reduce((sum, p) => sum + (p.duracionMin || 0), 0);
    const pasosCarrera = (pasosDetallados || []).filter(p => p.sumaDistancia !== false);
    let calentamientoMin = 0, enfriamientoMin = 0;
    let pasosPrincipales = [];
    pasosCarrera.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit.includes('CALENTAMIENTO')) calentamientoMin = p.duracionMin || 0;
      else if (tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO')) enfriamientoMin = p.duracionMin || 0;
      else pasosPrincipales.push(p);
    });
    const partePrincipalMin = pasosPrincipales.reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    const resultado = {
      ritmoStr: null, duracionMin: duracionTotalMin,
      tss: null, calorias: null,
      calentamiento: calentamientoMin,
      partePrincipal: partePrincipalMin,
      enfriamiento: enfriamientoMin,
      distanciaPartePrincipal: null,
      distanciaCalentamientoKm: null,
      distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };

    if (calculo && Array.isArray(calculo.zones) && calculo.zones.length && calculo.ritmoBase) {
      const zona = calculo.zones.find(z => z[0] === zonaCodigo);
      if (zona) {
        const paceDecimal = calculo.ritmoBase * zona[4];
        resultado.ritmoStr = Utils.formatR(paceDecimal);

        if (parteInput.modo === 'distancia') {
          resultado.distanciaPartePrincipal = parteInput.valor || 0;
          resultado.partePrincipal = Math.max(1, Math.round(resultado.distanciaPartePrincipal * paceDecimal));
        } else {
          const tiempoDefinido = Math.round(parteInput.valor || 0);
          resultado.partePrincipal = Math.min(tiempoDefinido, partePrincipalMin);
          resultado.distanciaPartePrincipal = paceDecimal > 0 ? (resultado.partePrincipal / paceDecimal) : 0;
        }

        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4];
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;
        resultado.tss = this._calcularTSS(resultado.duracionMin, zonaCodigo);
      }
    }
    if (peso) {
      const distanciaParaCalorias = resultado.distanciaTotal !== null
        ? resultado.distanciaTotal
        : (parteInput.modo === 'distancia' ? parteInput.valor : 0);
      if (distanciaParaCalorias) resultado.calorias = Math.round(peso * distanciaParaCalorias);
    }
    return resultado;
  },

  _calcularPersonalizacionFuerza(pasosDetallados, peso) {
    const duracionMin = (pasosDetallados || []).reduce((s, p) => s + (p.duracionMin || 0), 0);
    let calentamiento = 0, enfriamiento = 0;
    (pasosDetallados || []).forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit.includes('CALENTAMIENTO')) calentamiento = p.duracionMin || 0;
      else if (tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO')) enfriamiento = p.duracionMin || 0;
    });
    return {
      ritmoStr: null, duracionMin, tss: null,
      calorias: peso ? Math.round(peso * duracionMin * 0.0875) : null,
      calentamiento, partePrincipal: Math.max(0, duracionMin - calentamiento - enfriamiento), enfriamiento,
      distanciaPartePrincipal: null, distanciaCalentamientoKm: null, distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };
  },

  // 🔥 MODIFICADO: usa sumaDistancia para decidir qué pasos aportan distancia
  _calcularPersonalizacionSeries(seriesConfig, calculo, peso, pasosDetallados) {
    const duracionPasos = (pasosDetallados || []).reduce((sum, p) => sum + (p.duracionMin || 0), 0);
    const sc = seriesConfig || {};
    const totalReps = Math.max(0, sc.numBloques || 0) * Math.max(0, sc.numSeries || 0);
    const resultado = {
      ritmoStr: null, duracionMin: duracionPasos,
      tss: null, calorias: null,
      calentamiento: 0, partePrincipal: 0, enfriamiento: 0,
      distanciaPartePrincipal: null, distanciaCalentamientoKm: null, distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };

    const pasosCarrera = (pasosDetallados || []).filter(p => p.sumaDistancia !== false);
    let calentamientoMin = 0, enfriamientoMin = 0;
    pasosCarrera.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit.includes('CALENTAMIENTO')) calentamientoMin = p.duracionMin || 0;
      else if (tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO')) enfriamientoMin = p.duracionMin || 0;
    });
    resultado.calentamiento = calentamientoMin;
    resultado.enfriamiento = enfriamientoMin;

    if (calculo && Array.isArray(calculo.zones) && calculo.zones.length && calculo.ritmoBase && totalReps > 0) {
      const zona = calculo.zones.find(z => z[0] === sc.zonaEsfuerzo);
      if (zona) {
        const paceDecimal = calculo.ritmoBase * zona[4];
        resultado.ritmoStr = Utils.formatR(paceDecimal);

        let tiempoRepMin, distRepKm;
        if (sc.modoRep === 'tiempo') {
          tiempoRepMin = Math.max(0, (sc.tiempoRepSeg || 0) / 60);
          distRepKm = paceDecimal > 0 ? (tiempoRepMin / paceDecimal) : 0;
        } else {
          distRepKm = Math.max(0, (sc.distRepM || 0) / 1000);
          tiempoRepMin = distRepKm * paceDecimal;
        }

        const tiempoEsfuerzoMin = tiempoRepMin * totalReps;
        const distanciaEsfuerzoKm = distRepKm * totalReps;
        const tiempoDescansoMin = ((sc.descansoRepSeg || 0) * Math.max(0, (sc.numSeries || 0) - 1) * (sc.numBloques || 0)) / 60
          + (sc.descansoBloqueMin || 0) * Math.max(0, (sc.numBloques || 0) - 1);

        resultado.partePrincipal = Math.round(tiempoEsfuerzoMin + tiempoDescansoMin);
        resultado.distanciaPartePrincipal = distanciaEsfuerzoKm;

        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4];
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;
        resultado.duracionMin = resultado.partePrincipal + calentamientoMin + enfriamientoMin;
        resultado.tss = this._calcularTSS(resultado.duracionMin, sc.zonaEsfuerzo);
        resultado.segundosEsfuerzo = Math.round(tiempoEsfuerzoMin * 60);
      }
    }
    if (peso) {
      const distanciaParaCalorias = resultado.distanciaTotal !== null ? resultado.distanciaTotal : 0;
      if (distanciaParaCalorias) resultado.calorias = Math.round(peso * distanciaParaCalorias);
    }
    return resultado;
  },

  async _getPlanPersonalizado(uid) {
    try {
      const snapshot = await firebaseServices.db
        .collection('users')
        .doc(uid)
        .collection('planes')
        .where('tipo', '==', 'personalizado')
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, data: doc.data() };
      }
      return null;
    } catch (e) {
      console.warn('Error buscando plan personalizado:', e);
      return null;
    }
  },

  async _crearPlanPersonalizado(uid, fechaInicio) {
    const fechaInicioDate = new Date(fechaInicio);
    const año = fechaInicioDate.getFullYear();
    const fechaFin = new Date(año, 11, 31);

    const planData = {
      nombrePlan: "plan de entrenamiento personalizado",
      tipo: "personalizado",
      params: {
        fechaInicio: fechaInicioDate.toISOString(),
        fechaFin: fechaFin.toISOString(),
        modalidad: 'runner',
        distancia: 'personalizado',
        nivel: 'intermedio',
        diasPorSemana: 0,
        objetivo: 'personalizado',
        ritmoBase: AppState.lastRitmoBase || 5,
        fcMax: AppState.lastFC || 180,
        fcUmbral: AppState.lastUL || 160
      },
      sesiones: [],
      sesionesRealizadas: {},
      feedback: {},
      fechaCreacion: new Date().toISOString(),
      resumen: "Plan personalizado con sesiones del entrenador"
    };

    const planRef = await firebaseServices.db
      .collection('users')
      .doc(uid)
      .collection('planes')
      .add(planData);
    
    return { id: planRef.id, data: planData };
  },

  _desplazarClavesDiaGlobal(obj, diffDays) {
    if (!obj || !diffDays) return obj || {};
    const desplazado = {};
    for (const [clave, valor] of Object.entries(obj)) {
      const nuevaClave = parseInt(clave, 10) + diffDays;
      desplazado[nuevaClave] = valor;
    }
    return desplazado;
  },

  _construirDetalleSesion(sesionData, personalizado) {
    const detalleOriginal = sesionData.detalle || {};
    const relleno = this._conValoresPorDefecto(detalleOriginal, personalizado, sesionData.tipo);
    return {
      ...detalleOriginal,
      ...relleno,
      ritmoObjetivo: personalizado.ritmoStr || '',
      tssEstimada: personalizado.tss || 0,
      caloriasEstimadas: personalizado.calorias || null,
      calentamiento: personalizado.calentamiento || 0,
      partePrincipal: personalizado.partePrincipal || 0,
      enfriamiento: personalizado.enfriamiento || 0,
      segundosEsfuerzo: personalizado.segundosEsfuerzo || 0,
      distanciaEstimada: personalizado.distanciaTotal !== null
        ? parseFloat(personalizado.distanciaTotal.toFixed(2))
        : (detalleOriginal.distanciaEstimada || 0)
    };
  },

  abrirGenerador() {
    this._editable = {
      tipo: 'rodaje',
      detalle: {
        nombre: '',
        objetivo: '',
        porque: '',
        sensacion: '',
        modoPartePrincipal: 'distancia',
        distanciaEstimada: 5,
        duracionPartePrincipalMin: 30,
        zona: 'Z2',
        seriesConfig: {
          numBloques: 1, numSeries: 6, modoRep: 'distancia',
          distRepM: 400, tiempoRepSeg: 90, zonaEsfuerzo: 'Z5',
          descansoRepSeg: 60, descansoBloqueMin: 3
        },
        pasosDetallados: [
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10, sumaDistancia: true },
          { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0, sumaDistancia: true },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5, sumaDistancia: true }
        ]
      }
    };
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechasSeleccionadas = new Set();
    this._usuariosSeleccionados = new Set();
    this._renderPaso1();
  },

  _tipoEmoji(tipo) {
    return { rodaje: '🏃‍♂️', tempo: '⚡', series: '🔁', largo: '📏', strength: '💪', descanso: '😴' }[tipo] || '🏃';
  },

  _crearOverlayModal(id) {
    const existente = document.getElementById(id + 'Overlay');
    const modalExistente = document.getElementById(id + 'Modal');
    if (existente && modalExistente) {
      modalExistente.scrollTop = 0;
      return { overlay: existente, modal: modalExistente };
    }
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

  _transicionarPaso(renderFn) {
    const modal = document.getElementById('sessGenModal');
    if (!modal) { renderFn(); return; }
    modal.style.opacity = '0';
    setTimeout(() => {
      renderFn();
      requestAnimationFrame(() => {
        const modalNuevo = document.getElementById('sessGenModal');
        if (modalNuevo) modalNuevo.style.opacity = '1';
      });
    }, 180);
  },

  _renderPaso1() {
    const { modal } = this._crearOverlayModal('sessGen');
    const d = this._editable.detalle;
    const tipoActual = this._editable.tipo;
    const pasosHTML = d.pasosDetallados.map((p, i) => {
      const tit = (p.titulo || '').toUpperCase();
      return `
      <div class="sessgen-paso" data-idx="${i}" style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; gap:8px; margin-bottom:6px; align-items:center; flex-wrap:wrap;">
          <input class="sg-paso-icono" data-idx="${i}" value="${Utils.escapeHTML(p.icono || '')}" style="width:44px; text-align:center; padding:8px 4px;" maxlength="4">
          <input class="sg-paso-titulo" data-idx="${i}" value="${Utils.escapeHTML(p.titulo || '')}" placeholder="TÍTULO DEL PASO" style="flex:1; min-width:80px; text-align:center;">
          <input class="sg-paso-min" data-idx="${i}" type="number" min="0" value="${p.duracionMin || ''}" placeholder="min" title="Minutos" style="width:56px; text-align:center; padding:8px 2px;">
          <label style="display:flex; align-items:center; gap:4px; font-size:10px; color:var(--text-secondary); white-space:nowrap;">
            <input class="sg-paso-distancia" data-idx="${i}" type="checkbox" ${p.sumaDistancia !== false ? 'checked' : ''}>
            🏃 Distancia
          </label>
          <button onclick="SessionInvites._quitarPaso(${i})" style="
            background:transparent;
            border:1px solid #e74c3c;
            color:#e74c3c;
            border-radius:8px;
            width:36px;
            height:38px;
            cursor:pointer;
            flex-shrink:0;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
          ">✕</button>
        </div>
        <input class="sg-paso-accion" data-idx="${i}" value="${Utils.escapeHTML(p.accion || '')}" placeholder="Qué hay que hacer" style="width:100%; margin-bottom:6px; text-align:center;">
        <input class="sg-paso-porque" data-idx="${i}" value="${Utils.escapeHTML(p.porque || '')}" placeholder="Por qué (opcional)" style="width:100%; text-align:center;">
      </div>
    `;
    }).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(this._editable.tipo)} NUEVA SESIÓN · PASO 1/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">TIPO DE SESIÓN</label>
        <select id="sgTipo" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
          <option value="rodaje">🏃‍♂️ Rodaje</option>
          <option value="tempo">⚡ Tempo</option>
          <option value="series">🔁 Series</option>
          <option value="largo">📏 Tirada larga</option>
          <option value="strength">💪 Fuerza</option>
          <option value="descanso">😴 Descanso</option>
        </select>

        <div id="sgDescansoInfo" style="display:none; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:14px; text-align:center; margin-bottom:10px; font-size:12px; color:var(--text-secondary); line-height:1.5;">
          😴 Un día de descanso usa la misma tarjeta que genera el planificador por defecto para
          los días sin entrenar (mismo texto, mismos consejos). No hay nada más que rellenar:
          solo elige a quién enviárselo y para qué día.
        </div>

        <div id="sgCamposComunesWrap">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">NOMBRE DE LA SESIÓN</label>
          <input id="sgNombre" placeholder="Ej: Rodaje aeróbico suave" style="width:100%; margin-bottom:10px; text-align:center;">
        </div>

        <div id="sgParteContinuaWrap">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">CÓMO DEFINES LA PARTE PRINCIPAL</label>
          <select id="sgModoParte" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            <option value="distancia">📏 Por distancia (km)</option>
            <option value="tiempo">⏱️ Por tiempo (minutos)</option>
          </select>

          <div id="sgDistanciaWrap">
            <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">DISTANCIA DE LA PARTE PRINCIPAL (km)</label>
            <input id="sgDistancia" type="number" step="0.1" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>
          <div id="sgTiempoWrap" style="display:none;">
            <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">DURACIÓN DE LA PARTE PRINCIPAL (min)</label>
            <input id="sgDuracionParte" type="number" step="1" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>

          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">ZONA DE ENTRENAMIENTO (parte principal)</label>
          <select id="sgZona" style="width:100%; margin-bottom:6px; text-align:center; text-align-last:center;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}">${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>
          <p id="sgInfoModoParte" style="font-size:11px; color:var(--text-secondary); text-align:center; margin:0 0 10px; line-height:1.4;"></p>
        </div>

        <div id="sgParteSeriesWrap" style="display:none;">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">ESTRUCTURA DE LA SERIE</label>
          <div style="display:flex; gap:8px; margin-bottom:10px;">
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">Nº BLOQUES</label>
              <input id="sgSerBloques" type="number" step="1" min="1" style="width:100%; text-align:center;">
            </div>
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">REPETICIONES / BLOQUE</label>
              <input id="sgSerRepeticiones" type="number" step="1" min="1" style="width:100%; text-align:center;">
            </div>
          </div>

          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">CÓMO DEFINES CADA REPETICIÓN</label>
          <select id="sgSerModoRep" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            <option value="distancia">📏 Por distancia (metros)</option>
            <option value="tiempo">⏱️ Por tiempo (segundos)</option>
          </select>
          <div id="sgSerDistWrap">
            <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">DISTANCIA DE CADA REPETICIÓN (m)</label>
            <input id="sgSerDistM" type="number" step="10" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>
          <div id="sgSerTiempoWrap" style="display:none;">
            <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">TIEMPO DE CADA REPETICIÓN (seg)</label>
            <input id="sgSerTiempoSeg" type="number" step="5" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>

          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">ZONA DE ESFUERZO (cada repetición)</label>
          <select id="sgSerZona" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}">${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>

          <div style="display:flex; gap:8px; margin-bottom:6px;">
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">DESCANSO ENTRE REPETICIONES (seg)</label>
              <input id="sgSerDescansoRep" type="number" step="5" min="0" style="width:100%; text-align:center;">
            </div>
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">DESCANSO ENTRE BLOQUES (min)</label>
              <input id="sgSerDescansoBloque" type="number" step="1" min="0" style="width:100%; text-align:center;">
            </div>
          </div>
          <p style="font-size:11px; color:var(--text-secondary); text-align:center; margin:4px 0 10px; line-height:1.4;">
            ℹ️ El ritmo, el tiempo y la distancia real de cada repetición se calculan para cada corredor con SU ritmo en la zona elegida. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se suman aparte.
          </p>
        </div>

        <div id="sgFuerzaInfo" style="display:none; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:12px; text-align:center; margin-bottom:10px; font-size:11px; color:var(--text-secondary); line-height:1.5;">
          💪 Una sesión de fuerza no usa distancia ni ritmo: pon los minutos de cada paso (calentamiento, ejercicios y estiramientos) ahí abajo, en "ESTRUCTURA DE LA SESIÓN", y describe qué hay que hacer en cada uno. El checkbox "Distancia" no aplica en fuerza.
        </div>

        <div id="sgCamposComunesWrap2">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">SENSACIÓN (opcional)</label>
          <input id="sgSensacion" placeholder="Ej: Cómoda, controlada" style="width:100%; margin-bottom:10px; text-align:center;">

          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">🎯 OBJETIVO PRINCIPAL</label>
          <textarea id="sgObjetivo" style="width:100%; min-height:50px; margin-bottom:10px; text-align:center;"></textarea>

          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">POR QUÉ</label>
          <textarea id="sgPorque" style="width:100%; min-height:50px; margin-bottom:16px; text-align:center;"></textarea>
        </div>

        <div id="sgPasosWrap">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">ESTRUCTURA DE LA SESIÓN (pasos)</label>
          <p id="sgPasosInfoTexto" style="font-size:10px; color:var(--text-secondary); text-align:center; margin:2px 0 8px; line-height:1.4;"></p>
          <div id="sgPasosContainer" style="margin-top:8px;">${pasosHTML}</div>
          <button onclick="SessionInvites._anadirPaso()" style="width:100%; padding:10px; background:transparent; border:1px dashed var(--border-color-light); color:var(--text-secondary); border-radius:10px; cursor:pointer; margin-top:4px;">➕ AÑADIR PASO</button>
        </div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessGen')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgContinuarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">CONTINUAR →</button>
      </div>
    `;

    document.getElementById('sgTipo').value = this._editable.tipo;
    document.getElementById('sgNombre').value = d.nombre || '';
    document.getElementById('sgModoParte').value = d.modoPartePrincipal || 'distancia';
    document.getElementById('sgDistancia').value = d.distanciaEstimada || '';
    document.getElementById('sgDuracionParte').value = d.duracionPartePrincipalMin || '';
    document.getElementById('sgZona').value = (d.zona && d.zona !== null) ? d.zona : 'Z2';
    document.getElementById('sgSensacion').value = d.sensacion || '';
    document.getElementById('sgObjetivo').value = d.objetivo || '';
    document.getElementById('sgPorque').value = d.porque || '';

    const sc = d.seriesConfig || {};
    document.getElementById('sgSerBloques').value = sc.numBloques || 1;
    document.getElementById('sgSerRepeticiones').value = sc.numSeries || 6;
    document.getElementById('sgSerModoRep').value = sc.modoRep || 'distancia';
    document.getElementById('sgSerDistM').value = sc.distRepM || 400;
    document.getElementById('sgSerTiempoSeg').value = sc.tiempoRepSeg || 90;
    document.getElementById('sgSerZona').value = sc.zonaEsfuerzo || 'Z5';
    document.getElementById('sgSerDescansoRep').value = sc.descansoRepSeg || 60;
    document.getElementById('sgSerDescansoBloque').value = sc.descansoBloqueMin || 3;

    this._actualizarModoParte();
    this._actualizarModoRepSerie();
    this._actualizarVisibilidadPorTipo();
    document.getElementById('sgModoParte').addEventListener('change', () => this._actualizarModoParte());
    document.getElementById('sgSerModoRep').addEventListener('change', () => this._actualizarModoRepSerie());
    document.getElementById('sgTipo').addEventListener('change', () => {
      d.nombre = document.getElementById('sgNombre').value;
      d.sensacion = document.getElementById('sgSensacion').value;
      d.objetivo = document.getElementById('sgObjetivo').value;
      d.porque = document.getElementById('sgPorque').value;
      this._leerPasosDelDOM();
      this._editable.tipo = document.getElementById('sgTipo').value;
      this._ajustarPasosPorDefectoSegunTipo();
      this._renderPaso1();
    });

    document.getElementById('sgContinuarBtn').addEventListener('click', () => {
      this._leerPaso1();
      const tipo = this._editable.tipo;
      const det = this._editable.detalle;
      if (tipo !== 'descanso') {
        if (!det.nombre.trim()) {
          Utils.showToast('Ponle un nombre a la sesión', 'warning');
          return;
        }
        if (tipo === 'strength') {
          const totalMin = (det.pasosDetallados || []).reduce((s, p) => s + (p.duracionMin || 0), 0);
          if (!(totalMin > 0)) {
            Utils.showToast('Pon los minutos de cada paso de la sesión de fuerza', 'warning');
            return;
          }
        } else if (tipo === 'series') {
          const sc = det.seriesConfig;
          if (!(sc.numBloques > 0) || !(sc.numSeries > 0)) {
            Utils.showToast('Pon el número de bloques y de repeticiones por bloque', 'warning');
            return;
          }
          if (sc.modoRep === 'distancia' && !(sc.distRepM > 0)) {
            Utils.showToast('Pon la distancia de cada repetición', 'warning');
            return;
          }
          if (sc.modoRep === 'tiempo' && !(sc.tiempoRepSeg > 0)) {
            Utils.showToast('Pon el tiempo de cada repetición', 'warning');
            return;
          }
        } else {
          const modo = det.modoPartePrincipal;
          if (modo === 'distancia' && !(det.distanciaEstimada > 0)) {
            Utils.showToast('Pon la distancia de la parte principal', 'warning');
            return;
          }
          if (modo === 'tiempo' && !(det.duracionPartePrincipalMin > 0)) {
            Utils.showToast('Pon la duración de la parte principal', 'warning');
            return;
          }
        }
      }
      this._transicionarPaso(() => this._renderPaso2Calendario());
    });
  },

  _ajustarPasosPorDefectoSegunTipo() {
    if (this._editable.tipo !== 'strength') return;
    (this._editable.detalle.pasosDetallados || []).forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit === 'ENFRIAMIENTO') p.titulo = 'ESTIRAMIENTOS';
      if (tit === 'PARTE PRINCIPAL' && !p.duracionMin) p.duracionMin = 30;
      if (p.sumaDistancia === undefined) p.sumaDistancia = false;
    });
  },

  _actualizarVisibilidadPorTipo() {
    const tipo = document.getElementById('sgTipo')?.value;
    const esDescanso = tipo === 'descanso';
    const esFuerza = tipo === 'strength';
    const esSeries = tipo === 'series';
    const esContinuo = !esDescanso && !esFuerza && !esSeries;

    const idsComunes = ['sgPasosWrap', 'sgCamposComunesWrap', 'sgCamposComunesWrap2'];
    idsComunes.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = esDescanso ? 'none' : 'block';
    });
    const descansoInfo = document.getElementById('sgDescansoInfo');
    if (descansoInfo) descansoInfo.style.display = esDescanso ? 'block' : 'none';

    const parteContinua = document.getElementById('sgParteContinuaWrap');
    if (parteContinua) parteContinua.style.display = (esContinuo && !esDescanso) ? 'block' : 'none';

    const parteSeries = document.getElementById('sgParteSeriesWrap');
    if (parteSeries) parteSeries.style.display = esSeries ? 'block' : 'none';

    const fuerzaInfo = document.getElementById('sgFuerzaInfo');
    if (fuerzaInfo) fuerzaInfo.style.display = esFuerza ? 'block' : 'none';

    const pasosInfo = document.getElementById('sgPasosInfoTexto');
    if (pasosInfo) {
      pasosInfo.textContent = esFuerza
        ? 'Pon los minutos de CADA paso (calentamiento, ejercicios, estiramientos): en fuerza no hay distancia que convertir, así que todos los pasos llevan su propio tiempo. El checkbox "Distancia" no aplica.'
        : 'Pon los minutos de CADA paso y marca el checkbox "🏃 Distancia" si ese paso forma parte de la carrera (suma km). Si es un bloque extra (gimnasio, estiramientos), desmárcalo para que solo sume tiempo.';
    }
  },

  _actualizarModoParte() {
    const modo = document.getElementById('sgModoParte')?.value || 'distancia';
    const distWrap = document.getElementById('sgDistanciaWrap');
    const tiempoWrap = document.getElementById('sgTiempoWrap');
    const info = document.getElementById('sgInfoModoParte');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (tiempoWrap) tiempoWrap.style.display = modo === 'tiempo' ? 'block' : 'none';
    if (info) {
      info.innerHTML = modo === 'distancia'
        ? 'ℹ️ Esta distancia es SOLO la parte principal. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se convierten a km con el ritmo de Z1 de cada usuario, sumándose a la distancia y al tiempo total de la sesión.'
        : 'ℹ️ Esta duración es SOLO la parte principal, en la zona elegida: la distancia que cubre en ese tiempo se calcula sola, según el ritmo real de cada usuario en esa zona -- así todos entrenan el mismo tiempo a esa intensidad, no la misma distancia. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se suman aparte, en tiempo y en km.';
    }
  },

  _actualizarModoRepSerie() {
    const modo = document.getElementById('sgSerModoRep')?.value || 'distancia';
    const distWrap = document.getElementById('sgSerDistWrap');
    const tiempoWrap = document.getElementById('sgSerTiempoWrap');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (tiempoWrap) tiempoWrap.style.display = modo === 'tiempo' ? 'block' : 'none';
  },

  _anadirPaso() {
    this._leerPasosDelDOM();
    const pasos = this._editable.detalle.pasosDetallados;
    
    let idxEnfriamiento = -1;
    for (let i = 0; i < pasos.length; i++) {
      const titulo = (pasos[i].titulo || '').toUpperCase();
      if (titulo.includes('ENFRIAMIENTO') || titulo.includes('ESTIRAMIENTO')) {
        idxEnfriamiento = i;
        break;
      }
    }
    
    const nuevoPaso = { 
      icono: '📌', 
      titulo: '', 
      accion: '', 
      porque: '', 
      duracionMin: 5,
      sumaDistancia: false
    };
    
    if (idxEnfriamiento !== -1) {
      pasos.splice(idxEnfriamiento, 0, nuevoPaso);
    } else {
      pasos.push(nuevoPaso);
    }
    
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
      const minInput = fila.querySelector('.sg-paso-min');
      const distanciaCheck = fila.querySelector('.sg-paso-distancia');
      pasos.push({
        icono: fila.querySelector('.sg-paso-icono')?.value || '📌',
        titulo: fila.querySelector('.sg-paso-titulo')?.value || '',
        accion: fila.querySelector('.sg-paso-accion')?.value || '',
        porque: fila.querySelector('.sg-paso-porque')?.value || '',
        duracionMin: minInput ? (parseInt(minInput.value) || 0) : undefined,
        sumaDistancia: distanciaCheck ? distanciaCheck.checked : true
      });
    });
    if (filas.length > 0) this._editable.detalle.pasosDetallados = pasos;
  },

  _leerPaso1() {
    this._editable.tipo = document.getElementById('sgTipo').value;
    const d = this._editable.detalle;

    if (this._editable.tipo === 'descanso') {
      d.nombre = 'Descanso';
      d.sensacion = '';
      d.objetivo = '';
      d.porque = '';
      d.modoPartePrincipal = 'distancia';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      d.zona = null;
      d.pasosDetallados = [];
      return;
    }

    d.nombre = document.getElementById('sgNombre').value.trim();
    d.sensacion = document.getElementById('sgSensacion').value.trim();
    d.objetivo = document.getElementById('sgObjetivo').value.trim();
    d.porque = document.getElementById('sgPorque').value.trim();
    this._leerPasosDelDOM();

    d.calentamientoMin = 0;
    d.enfriamientoMin = 0;
    d.pasosDetallados.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit.includes('CALENTAMIENTO')) d.calentamientoMin = p.duracionMin || 0;
      else if (tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO')) d.enfriamientoMin = p.duracionMin || 0;
    });

    if (this._editable.tipo === 'strength') {
      d.modoPartePrincipal = 'tiempo';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      d.zona = null;
      return;
    }

    if (this._editable.tipo === 'series') {
      d.seriesConfig = {
        numBloques: parseInt(document.getElementById('sgSerBloques').value) || 1,
        numSeries: parseInt(document.getElementById('sgSerRepeticiones').value) || 1,
        modoRep: document.getElementById('sgSerModoRep').value,
        distRepM: parseFloat(document.getElementById('sgSerDistM').value) || 0,
        tiempoRepSeg: parseFloat(document.getElementById('sgSerTiempoSeg').value) || 0,
        zonaEsfuerzo: document.getElementById('sgSerZona').value,
        descansoRepSeg: parseFloat(document.getElementById('sgSerDescansoRep').value) || 0,
        descansoBloqueMin: parseFloat(document.getElementById('sgSerDescansoBloque').value) || 0
      };
      d.zona = d.seriesConfig.zonaEsfuerzo;
      d.modoPartePrincipal = 'distancia';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      return;
    }

    d.modoPartePrincipal = document.getElementById('sgModoParte').value;
    d.distanciaEstimada = parseFloat(document.getElementById('sgDistancia').value) || 0;
    d.duracionPartePrincipalMin = parseFloat(document.getElementById('sgDuracionParte').value) || 0;
    d.zona = document.getElementById('sgZona').value;
  },

  _renderPaso2Calendario() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">📅 ELIGE LOS DÍAS · PASO 2/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <p style="font-size:11px; color:var(--text-secondary); text-align:center; margin:0 0 12px; line-height:1.4;">
          Puedes elegir varios días para esta misma sesión (toca para marcar/desmarcar cada uno).
        </p>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <button onclick="SessionInvites._cambiarMes(-1)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; width:36px; height:36px; cursor:pointer;">‹</button>
          <span id="sgMesLabel" style="font-weight:bold; letter-spacing:1px;"></span>
          <button onclick="SessionInvites._cambiarMes(1)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; width:36px; height:36px; cursor:pointer;">›</button>
        </div>
        <div id="sgCalendarioGrid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;"></div>
        <div id="sgFechaElegidaTxt" style="text-align:center; margin-top:16px; color:var(--text-secondary); font-weight:bold; font-size:13px; line-height:1.5; min-height:39px; display:flex; align-items:center; justify-content:center;"></div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso1())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgContinuarPaso2Btn" class="action-button" style="width:auto; padding:0 32px; margin:0;" disabled>CONTINUAR →</button>
      </div>
    `;
    this._renderizarMesCalendario();
    this._actualizarTextoFechas();
    this._precargarUsuarios();
    document.getElementById('sgContinuarPaso2Btn').addEventListener('click', async () => {
      if (!this._fechasSeleccionadas.size) return;
      const btn = document.getElementById('sgContinuarPaso2Btn');
      if (!this._usuariosTodos) {
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Cargando...'; }
        await this._precargarUsuarios();
        if (btn) { btn.disabled = false; btn.textContent = 'CONTINUAR →'; }
      }
      this._transicionarPaso(() => this._renderPaso3Usuarios());
    });
  },

  _precargarUsuarios() {
    if (this._usuariosTodos || this._precargaUsuariosPromise) return this._precargaUsuariosPromise;
    this._precargaUsuariosPromise = firebaseServices.db.collection('users').orderBy('username_lowercase').get()
      .then(snapshot => {
        this._usuariosTodos = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      })
      .catch(e => {
        console.error('Error cargando usuarios para invitar:', e);
        this._usuariosTodos = [];
      })
      .finally(() => { this._precargaUsuariosPromise = null; });
    return this._precargaUsuariosPromise;
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
    let offset = primerDia.getDay() - 1;
    if (offset < 0) offset = 6;
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div style="text-align:center; font-size:10px; color:var(--text-secondary); padding:4px 0;">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) html += '<div></div>';

    const hoyKey = this._dateKey(new Date());
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(year, month, dia);
      const key = this._dateKey(fecha);
      const esHoy = key === hoyKey;
      const esSeleccionado = this._fechasSeleccionadas.has(key);
      html += `
        <div onclick="SessionInvites._elegirDia(${year},${month},${dia})" style="
          text-align:center; padding:10px 0; border-radius:8px; cursor:pointer; font-size:13px;
          background:${esSeleccionado ? 'var(--gold)' : 'var(--stat-bg)'};
          color:${esSeleccionado ? '#000' : 'var(--text-primary)'};
          border:1px solid ${esHoy && !esSeleccionado ? 'var(--gold)' : 'var(--border-color)'};
          font-weight:${esHoy || esSeleccionado ? 'bold' : 'normal'};
        ">${dia}</div>`;
    }
    grid.innerHTML = html;
  },

  _elegirDia(year, month, dia) {
    const fecha = new Date(year, month, dia);
    const key = this._dateKey(fecha);
    if (this._fechasSeleccionadas.has(key)) this._fechasSeleccionadas.delete(key);
    else this._fechasSeleccionadas.add(key);
    this._renderizarMesCalendario();
    this._actualizarTextoFechas();
    const btn = document.getElementById('sgContinuarPaso2Btn');
    if (btn) btn.disabled = this._fechasSeleccionadas.size === 0;
  },

  _actualizarTextoFechas() {
    const txt = document.getElementById('sgFechaElegidaTxt');
    if (!txt) return;
    const n = this._fechasSeleccionadas.size;
    if (n === 0) {
      txt.style.color = 'var(--text-secondary)';
      txt.textContent = 'No has marcado ningún día todavía.';
      return;
    }
    const fechasTxt = Array.from(this._fechasSeleccionadas)
      .sort()
      .map(key => new Date(key + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
    const cabecera = n === 1 ? 'Has seleccionado el día:' : `Has seleccionado estos ${n} días:`;
    txt.style.color = 'var(--gold)';
    txt.innerHTML = `${cabecera}<br>${fechasTxt.join(' · ')}`;
  },

  async _renderPaso3Usuarios() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">👥 ELIGE USUARIOS · PASO 3/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <input id="sgUsuariosBuscar" placeholder="> BUSCAR USUARIO_" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="sgUsuariosList">⏳ Cargando usuarios...</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso2Calendario())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgEnviarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">📤 ENVIAR (<span id="sgCountSeleccionados">0</span>)</button>
      </div>
    `;

    if (!this._usuariosTodos) {
      document.getElementById('sgUsuariosList').innerHTML = '⏳ Cargando usuarios...';
      await this._precargarUsuarios();
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
    if (!this._fechasSeleccionadas.size) {
      Utils.showToast('Elige al menos un día', 'warning');
      return;
    }

    const btn = document.getElementById('sgEnviarBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

    Utils.showLoading();
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      const fromUsername = AppState.currentUserData?.username || AppState.currentUser || 'Admin';
      const fechasKeys = Array.from(this._fechasSeleccionadas);
      const sesionParaEnviar = JSON.parse(JSON.stringify(this._editable));
      const batchId = firebaseServices.utils.createId();
      const createdAt = firebaseServices.Timestamp.now();

      let total = 0;
      const batch = firebaseServices.db.batch();
      this._usuariosSeleccionados.forEach(uid => {
        const usuario = this._usuariosTodos.find(u => u.uid === uid);
        fechasKeys.forEach(fechaKey => {
          const ref = firebaseServices.db.collection('sessionInvites').doc();
          batch.set(ref, {
            fromUid: AppState.currentUserId,
            fromUsername,
            toUid: uid,
            toUsername: usuario?.username || '',
            status: 'pending',
            fecha: fechaKey,
            sesion: sesionParaEnviar,
            batchId,
            createdAt
          });
          total++;
        });
      });

      await batch.commit();
      Utils.hideLoading();
      const txtDias = fechasKeys.length > 1 ? ` para ${fechasKeys.length} días` : '';
      Utils.showToast(`✅ Sesión enviada a ${this._usuariosSeleccionados.size} usuario(s)${txtDias}`, 'success');
      this._cerrarModal('sessGen');
      this._historialCache = null;
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error enviando sesiones:', e);
      Utils.hideLoading();
      Utils.showToast('Error al enviar la sesión', 'error');
      if (btn) { btn.disabled = false; btn.textContent = `📤 ENVIAR (${this._usuariosSeleccionados.size})`; }
    }
  },

  async mostrarHistorial() {
    const container = document.getElementById('adminSesionesEnviadasList');
    if (!container || !AppState.currentUserId) return;

    if (!this._historialCache) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:12px; padding:12px;">⏳ Cargando historial...</p>';
      try {
        const snapshot = await firebaseServices.db.collection('sessionInvites')
          .where('fromUid', '==', AppState.currentUserId)
          .orderBy('createdAt', 'desc')
          .limit(60)
          .get();

        const lotes = new Map();
        snapshot.forEach(doc => {
          const d = doc.data();
          const clave = d.batchId || doc.id;
          if (!lotes.has(clave)) {
            lotes.set(clave, {
              nombre: d.sesion?.detalle?.nombre || d.sesion?.tipo || 'Sesión',
              tipo: d.sesion?.tipo || 'rodaje',
              fechas: new Set(),
              createdAt: d.createdAt,
              sesion: d.sesion || null,
              total: 0, aceptadas: 0, rechazadas: 0, pendientes: 0,
              destinatarios: [],
              docIds: []
            });
          }
          const lote = lotes.get(clave);
          lote.total++;
          lote.docIds.push(doc.id);
          if (d.fecha) lote.fechas.add(d.fecha);
          if (d.status === 'accepted') lote.aceptadas++;
          else if (d.status === 'rejected') lote.rechazadas++;
          else lote.pendientes++;
          lote.destinatarios.push({
            uid: d.toUid,
            username: d.toUsername || '(sin nombre)',
            status: d.status || 'pending',
            fecha: d.fecha || ''
          });
        });

        this._historialCache = Array.from(lotes.values())
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
          .slice(0, 10);
      } catch (e) {
        console.error('Error cargando historial de sesiones enviadas:', e);
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:12px; padding:12px;">No se pudo cargar el historial.</p>';
        return;
      }
    }

    if (!this._historialCache.length) {
      container.innerHTML = '';
      return;
    }

    const filas = this._historialCache.map((lote, idx) => {
      const fechaTxt = this._resumenFechas(lote.fechas);
      const estadoTxt = lote.total > 1
        ? `${lote.aceptadas}✅ ${lote.rechazadas}❌ ${lote.pendientes}⏳ de ${lote.total}`
        : (lote.aceptadas ? '✅ Aceptada' : lote.rechazadas ? '❌ Rechazada' : '⏳ Pendiente');
      return `
        <div onclick="SessionInvites._abrirDetalleHistorial(${idx})" style="display:flex; justify-content:space-between; align-items:center; gap:10px; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; margin-bottom:6px; cursor:pointer;">
          <div style="min-width:0;">
            <div style="font-size:13px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${fechaTxt}${fechaTxt ? ' · ' : ''}${lote.total} envío${lote.total === 1 ? '' : 's'}</div>
          </div>
          <div style="font-size:11px; color:var(--text-secondary); white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:10px;">
            <span>${estadoTxt}</span>
            <button onclick="event.stopPropagation(); SessionInvites._eliminarHistorial(${idx})" title="Eliminar del historial" style="width:auto; height:auto; margin:0; background:transparent; border:none; color:var(--text-secondary); flex-shrink:0; cursor:pointer; font-size:16px; padding:4px;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h4 style="font-size:12px; letter-spacing:1px; color:var(--text-secondary); margin:0 0 10px;">📜 ÚLTIMAS SESIONES CREADAS</h4>
      ${filas}
    `;
  },

  _resumenFechas(fechasSet) {
    if (!fechasSet || !fechasSet.size) return '';
    if (fechasSet.size === 1) return this._formatearFechaCorta(Array.from(fechasSet)[0]);
    return `${fechasSet.size} días`;
  },

  async _eliminarHistorial(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote || !lote.docIds?.length) return;

    const ok = window.confirm(
      `¿Eliminar "${lote.nombre}" del historial?` +
      (lote.pendientes ? `\n\nOjo: ${lote.pendientes} destinatario(s) todavía no la había(n) aceptado ni rechazado -- se les retirará sin avisarles.` : '')
    );
    if (!ok) return;

    Utils.showLoading();
    try {
      const batch = firebaseServices.db.batch();
      lote.docIds.forEach(docId => {
        batch.delete(firebaseServices.db.collection('sessionInvites').doc(docId));
      });
      await batch.commit();
      this._historialCache.splice(idx, 1);
      Utils.hideLoading();
      Utils.showToast('Eliminada del historial', 'success');
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error eliminando lote del historial:', e);
      Utils.hideLoading();
      Utils.showToast('Error al eliminar', 'error');
    }
  },

  _ESTADO_INFO: {
    accepted: { icono: '✅', texto: 'Aceptada', color: '#7CB88A' },
    rejected: { icono: '❌', texto: 'Rechazada', color: '#c07a7a' },
    pending: { icono: '⏳', texto: 'Pendiente', color: 'var(--text-secondary)' }
  },

  _abrirDetalleHistorial(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote) return;
    const { modal } = this._crearOverlayModal('sessHist');

    const fechaTxt = this._resumenFechas(lote.fechas) || '—';
    const variosDias = lote.fechas && lote.fechas.size > 1;
    const filasUsuarios = [...lote.destinatarios]
      .sort((a, b) => a.username.localeCompare(b.username) || a.fecha.localeCompare(b.fecha))
      .map(dest => {
        const info = this._ESTADO_INFO[dest.status] || this._ESTADO_INFO.pending;
        const fechaDest = variosDias && dest.fecha ? `<span style="color:var(--text-secondary); font-size:11px;"> · ${this._formatearFechaCorta(dest.fecha)}</span>` : '';
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border-color);">
            <span style="font-size:13px; color:var(--text-primary);">${Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(dest.username) : dest.username)}${fechaDest}</span>
            <span style="font-size:12px; color:${info.color};">${info.icono} ${info.texto}</span>
          </div>
        `;
      }).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Para el ${fechaTxt} · ${lote.total} envío${lote.total === 1 ? '' : 's'}</div>
        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
          ${filasUsuarios || '<div style="padding:12px; text-align:center; font-size:12px; color:var(--text-secondary);">Sin destinatarios</div>'}
        </div>
        <div style="text-align:center; margin-top:14px;">
          <button onclick="SessionInvites._eliminarHistorial(${idx}); SessionInvites._cerrarModal('sessHist');" style="background:transparent; border:none; color:var(--text-secondary); font-size:12px; text-decoration:underline; cursor:pointer; padding:4px;">🗑️ Eliminar esta sesión del historial</button>
        </div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessHist')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CERRAR</button>
        <button onclick="SessionInvites._reutilizar(${idx})" class="action-button" style="width:auto; padding:0 24px; margin:0;">🔁 REUTILIZAR</button>
      </div>
    `;
  },

  _reutilizar(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote || !lote.sesion) {
      Utils.showToast('No se pudo recuperar esta sesión', 'error');
      return;
    }
    this._editable = JSON.parse(JSON.stringify(lote.sesion));
    if (!this._editable.detalle) this._editable.detalle = {};
    if (!this._editable.detalle.modoPartePrincipal) this._editable.detalle.modoPartePrincipal = 'distancia';
    if (!this._editable.detalle.seriesConfig) {
      this._editable.detalle.seriesConfig = {
        numBloques: 1, numSeries: 6, modoRep: 'distancia',
        distRepM: 400, tiempoRepSeg: 90, zonaEsfuerzo: this._editable.detalle.zona || 'Z5',
        descansoRepSeg: 60, descansoBloqueMin: 3
      };
    }
    if (!Array.isArray(this._editable.detalle.pasosDetallados) || !this._editable.detalle.pasosDetallados.length) {
      this._editable.detalle.pasosDetallados = [
        { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10, sumaDistancia: true },
        { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0, sumaDistancia: true },
        { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5, sumaDistancia: true }
      ];
    }
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechasSeleccionadas = new Set();
    this._usuariosSeleccionados = new Set();

    const overlay = document.getElementById('sessHistOverlay');
    const modal = document.getElementById('sessHistModal');
    if (overlay && modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        overlay.id = 'sessGenOverlay';
        modal.id = 'sessGenModal';
        this._renderPaso1();
        requestAnimationFrame(() => { modal.style.opacity = '1'; });
      }, 180);
    } else {
      this._cerrarModal('sessHist');
      this._renderPaso1();
    }
  },

  _formatearFechaCorta(fechaKey) {
    const [y, m, d] = fechaKey.split('-').map(Number);
    if (!y || !m || !d) return fechaKey;
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  },

  // ========== LISTENER Y COLA DE INVITACIONES ==========

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
          const data = change.doc.data();
          const fecha = data.fecha || '2099-12-31';
          let inserted = false;
          for (let i = 0; i < this._colaPendientes.length; i++) {
            const f = this._colaPendientes[i].data.fecha || '2099-12-31';
            if (fecha < f) {
              this._colaPendientes.splice(i, 0, { id, data });
              inserted = true;
              break;
            }
          }
          if (!inserted) {
            this._colaPendientes.push({ id, data });
          }
        });
        if (this._dashboardCargado) this.comprobarPendientes();
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
    this._colaPendientes = [];
    this._modalInviteAbierto = false;
    this._dashboardCargado = false;
  },

  comprobarPendientes() {
    this._dashboardCargado = true;
    setTimeout(() => this._mostrarSiguienteDeCola(), 1200);
  },

  _mostrarSiguienteDeCola() {
    if (this._modalInviteAbierto) return;
    if (!this._colaPendientes.length) {
      Utils.hideLoading();
      return;
    }
    const novedadesAbierto = document.getElementById('modalNovedades')?.style.display === 'block';
    if (novedadesAbierto) { 
      setTimeout(() => this._mostrarSiguienteDeCola(), 800); 
      return; 
    }
    const siguiente = this._colaPendientes.shift();
    this._modalInviteAbierto = true;
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay || !overlay.classList.contains('active')) {
      Utils.showLoading();
    }
    this._mostrarModalInvite(siguiente.id, siguiente.data);
  },

  // ========== MOSTRAR MODAL DE INVITACIÓN ==========

  async _mostrarModalInvite(id, data) {
    const { modal } = this._crearOverlayModal('sessInvite');
    const sesion = data.sesion || {};
    const detalle = sesion.detalle || {};
    const fecha = new Date(data.fecha + 'T00:00:00');
    const fechaTxt = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const nombreAdmin = Utils.capitalizeUsername ? Utils.capitalizeUsername(data.fromUsername) : (data.fromUsername || 'El entrenador');

    if (sesion.tipo === 'descanso') {
      modal.innerHTML = `
        <div style="padding:20px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">😴</div>
          <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado un día de descanso
          </div>
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; text-align:center; margin-bottom:20px;">
            <div style="font-weight:bold; color:var(--gold); margin-bottom:8px;">Día de descanso</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-bottom:4px;">🎯 Recuperación y asimilación del entrenamiento</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:10px; font-style:italic;">El descanso permite que el cuerpo se recupere y se adapte a las cargas.</div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.8;">
              🧘 Estiramientos suaves &nbsp;·&nbsp; 🌀 Foam roller<br>
              🚶 Paseo activo &nbsp;·&nbsp; 💧 Hidratación adecuada
            </div>
          </div>
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
        </div>
      `;
      document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id, data));
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, {
        ritmoStr: null, duracionMin: 0, tss: null, calorias: null,
        calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null
      }));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Utils.hideLoading();
        });
      });
      return;
    }

    if (sesion.tipo === 'strength') {
      const peso = await this._obtenerPesoUsuario(AppState.currentUserId);
      const personalizado = this._calcularPersonalizacionFuerza(detalle.pasosDetallados, peso);
      if (!document.body.contains(modal)) return;
      const tiempoTxt = personalizado.duracionMin > 60
        ? `${Math.floor(personalizado.duracionMin/60)}h ${personalizado.duracionMin%60}min` : `${personalizado.duracionMin} min`;
      const pasosTxt = (detalle.pasosDetallados || []).map(p => `
        <div style="text-align:left; margin-bottom:8px;">
          <div style="font-weight:bold; color:var(--text-primary); font-size:12px;">${p.icono || '💪'} ${Utils.escapeHTML((p.titulo || '').toUpperCase())}${p.duracionMin ? ` · ${p.duracionMin} min` : ''}</div>
          ${p.accion ? `<div style="font-size:11px; color:var(--text-secondary);">${Utils.escapeHTML(p.accion)}</div>` : ''}
        </div>
      `).join('');
      modal.innerHTML = `
        <div style="padding:20px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">💪</div>
          <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
          </div>
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; margin-bottom:12px;">
            <div style="font-weight:bold; color:var(--gold); margin-bottom:6px; text-align:center;">${Utils.escapeHTML(detalle.nombre || 'Sesión de fuerza')}</div>
            <div style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-bottom:10px;">
              <span>🕒 ${tiempoTxt}</span>
              ${personalizado.calorias !== null ? `<span>🔥 ${personalizado.calorias} kcal</span>` : ''}
            </div>
            ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px; text-align:center;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
            ${pasosTxt}
          </div>
          ${(!peso) ? `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de esta sesión.</div>` : ''}
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
        </div>
      `;
      document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id, data));
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, personalizado));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Utils.hideLoading();
        });
      });
      return;
    }

    modal.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">⏳ Calculando tu ritmo, tiempo y calorías para esta sesión...</div>`;

    const [calculo, peso] = await Promise.all([
      this._obtenerCalculoDestinatario(AppState.currentUserId),
      this._obtenerPesoUsuario(AppState.currentUserId)
    ]);
    let personalizado;
    if (sesion.tipo === 'series' && detalle.seriesConfig) {
      personalizado = this._calcularPersonalizacionSeries(
        detalle.seriesConfig, calculo, peso,
        detalle.pasosDetallados || []
      );
    } else {
      const modoParte = detalle.modoPartePrincipal || 'distancia';
      const parteInput = {
        modo: modoParte,
        valor: modoParte === 'tiempo' ? (detalle.duracionPartePrincipalMin || 0) : (detalle.distanciaEstimada || 0)
      };
      personalizado = this._calcularPersonalizacion(
        detalle.zona, parteInput, calculo, peso,
        detalle.pasosDetallados || []
      );
    }
    const zonaInfo = detalle.zona ? this._zonaInfo(detalle.zona) : null;

    if (!document.body.contains(modal)) return;

    const sinZonasCalculadas = zonaInfo && personalizado.duracionMin === null;
    const tiempoTxt = personalizado.duracionMin !== null
      ? (personalizado.duracionMin > 60 ? `${Math.floor(personalizado.duracionMin/60)}h ${personalizado.duracionMin%60}min` : `${personalizado.duracionMin} min`)
      : '—';
    const distanciaMostrar = personalizado.distanciaTotal !== null
      ? personalizado.distanciaTotal
      : (modoParte === 'distancia' ? parteInput.valor : null);
    const distanciaTxt = distanciaMostrar !== null ? parseFloat(distanciaMostrar.toFixed(2)) : '—';

    modal.innerHTML = `
      <div style="padding:20px; text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">${this._tipoEmoji(sesion.tipo)}</div>
        <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
          <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
        </div>
        <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>

        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; text-align:center; margin-bottom:12px;">
          <div style="font-weight:bold; color:var(--gold); margin-bottom:6px;">${Utils.escapeHTML(detalle.nombre || sesion.tipo || 'Sesión')}</div>
          <div style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-bottom:6px;">
            <span>🕒 ${tiempoTxt}</span>
            <span>📏 ${distanciaTxt} km</span>
            ${personalizado.tss !== null ? `<span>⚡ ${personalizado.tss} TSS</span>` : ''}
            ${personalizado.calorias !== null ? `<span>🔥 ${personalizado.calorias} kcal</span>` : ''}
          </div>
          ${zonaInfo ? `
            <div style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
              <span>📊 ${zonaInfo.codigo} · ${zonaInfo.etiqueta}</span>
              <span>⏱️ ${personalizado.ritmoStr || 'sin calcular'}</span>
            </div>
          ` : ''}
          ${(personalizado.distanciaTotal !== null && (detalle.calentamientoMin || detalle.enfriamientoMin)) ? `
            <div style="font-size:10px; color:var(--text-secondary); margin-top:6px; opacity:0.8;">
              ${parseFloat(personalizado.distanciaPartePrincipal.toFixed(2))} km parte principal
              ${detalle.calentamientoMin ? ` + ${parseFloat(personalizado.distanciaCalentamientoKm.toFixed(2))} km calent.` : ''}
              ${detalle.enfriamientoMin ? ` + ${parseFloat(personalizado.distanciaEnfriamientoKm.toFixed(2))} km enfr.` : ''}
            </div>
          ` : ''}
          ${(sesion.tipo === 'series' && detalle.seriesConfig) ? `
            <div style="font-size:10px; color:var(--text-secondary); margin-top:6px; opacity:0.8;">
              ${detalle.seriesConfig.numBloques} bloque${detalle.seriesConfig.numBloques !== 1 ? 's' : ''} × ${detalle.seriesConfig.numSeries} rep.
              ${detalle.seriesConfig.modoRep === 'tiempo' ? `de ${detalle.seriesConfig.tiempoRepSeg}"` : `de ${detalle.seriesConfig.distRepM}m`}
              · desc. ${detalle.seriesConfig.descansoRepSeg}" entre rep.${detalle.seriesConfig.numBloques > 1 ? ` / ${detalle.seriesConfig.descansoBloqueMin}' entre bloques` : ''}
            </div>
          ` : ''}
          ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
        </div>

        ${sinZonasCalculadas ? `<div style="font-size:11px; color:var(--gold); margin-bottom:12px; line-height:1.4;">⚠️ Todavía no tienes tus zonas de entrenamiento a mano en este dispositivo, así que no podemos calcular tu ritmo/tiempo/TSS. Calcúlalas y podrás volver a esta sesión para aceptarla.</div>` : ''}
        ${(!peso && distanciaMostrar) ? `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de esta sesión.</div>` : ''}

        ${sinZonasCalculadas ? `
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteCalcularBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">🧮 CALCULAR ZONAS</button>
          </div>
        ` : `
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
        `}
      </div>
    `;

    document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id, data));
    if (sinZonasCalculadas) {
      document.getElementById('sessInviteCalcularBtn').addEventListener('click', () => this._irACalcularZonas(id, data));
    } else {
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, personalizado));
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Utils.hideLoading();
      });
    });
  },

  _irACalcularZonas(id, data) {
    this._cerrarModal('sessInvite');
    this._modalInviteAbierto = false;
    this._colaPendientes.unshift({ id, data });
    try {
      if (typeof switchPerfilSubtab === 'function') switchPerfilSubtab('perfil-entreno');
      if (typeof switchTabFromDashboard === 'function') switchTabFromDashboard('perfil');
      else if (typeof switchTab === 'function') switchTab('perfil');
    } catch (e) {
      console.warn('No se pudo navegar a la calculadora de zonas:', e);
    }
    Utils.showToast('Calcula tus zonas y vuelve al Inicio para retomar la sesión', 'info');
    Utils.hideLoading();
  },

  // ========== RECHAZAR ==========
  async _rechazar(id, data) {
    Utils.showLoading();
    this._cerrarModal('sessInvite');
    try {
      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'rejected' });
      this._modalInviteAbierto = false;
      Utils.showToast('Sesión rechazada', 'info');
      this._mostrarSiguienteDeCola();
    } catch (e) {
      console.error('Error rechazando sesión:', e);
      Utils.hideLoading();
      this._modalInviteAbierto = false;
      Utils.showToast('Error al rechazar la sesión', 'error');
      this._colaPendientes.unshift({ id, data });
      this._mostrarSiguienteDeCola();
    }
  },

  // ========== ACEPTAR ==========
  async _aceptar(id, data, personalizado) {
    Utils.showLoading();
    this._cerrarModal('sessInvite');
    try {
      const uid = AppState.currentUserId;

      if (!personalizado) {
        if (data.sesion.tipo === 'descanso') {
          personalizado = {
            ritmoStr: null, duracionMin: 0, tss: null, calorias: null,
            calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null
          };
        } else if (data.sesion.tipo === 'strength') {
          const peso = await this._obtenerPesoUsuario(uid);
          personalizado = this._calcularPersonalizacionFuerza((data.sesion.detalle || {}).pasosDetallados, peso);
        } else {
          const [calculo, peso] = await Promise.all([
            this._obtenerCalculoDestinatario(uid),
            this._obtenerPesoUsuario(uid)
          ]);
          const det = data.sesion.detalle || {};
          if (data.sesion.tipo === 'series' && det.seriesConfig) {
            personalizado = this._calcularPersonalizacionSeries(det.seriesConfig, calculo, peso, det.pasosDetallados || []);
          } else {
            const modoParte = det.modoPartePrincipal || 'distancia';
            const parteInput = {
              modo: modoParte,
              valor: modoParte === 'tiempo' ? (det.duracionPartePrincipalMin || 0) : (det.distanciaEstimada || 0)
            };
            personalizado = this._calcularPersonalizacion(det.zona, parteInput, calculo, peso, det.pasosDetallados || []);
          }
        }
      }

      let planPersonalizado = await this._getPlanPersonalizado(uid);
      let planCreadoAhora = false;
      if (!planPersonalizado) {
        planPersonalizado = await this._crearPlanPersonalizado(uid, data.fecha);
        planCreadoAhora = true;
      }
      const planId = planPersonalizado.id;
      let planData = planPersonalizado.data;

      const fechaInicioActual = new Date(planData.params.fechaInicio);
      const fechaSesion = new Date(data.fecha);
      let diffDays = 0;
      if (!planCreadoAhora && fechaSesion < fechaInicioActual) {
        diffDays = Math.round((fechaInicioActual - fechaSesion) / (1000 * 60 * 60 * 24));
        planData.params.fechaInicio = fechaSesion.toISOString();
        let sesiones = planData.sesiones || [];
        sesiones = sesiones.map(s => {
          if (s.diaGlobal !== undefined) {
            s.diaGlobal += diffDays;
          }
          return s;
        });
        planData.sesiones = sesiones;
      }

      const fechaInicio = new Date(planData.params.fechaInicio);
      const diffTime = fechaSesion - fechaInicio;
      const diaGlobal = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diaGlobal < 1) {
        Utils.hideLoading();
        this._modalInviteAbierto = false;
        Utils.showToast('Error: la fecha de la sesión es anterior al inicio del plan', 'error');
        this._colaPendientes.unshift({ id, data });
        this._mostrarSiguienteDeCola();
        return;
      }

      const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) {
        throw new Error('El plan personalizado no existe');
      }
      const planCompleto = planDoc.data();
      let sesiones = planCompleto.sesiones || [];
      let sesionesRealizadas = planCompleto.sesionesRealizadas || {};
      let feedback = planCompleto.feedback || {};

      if (diffDays > 0) {
        sesiones = planData.sesiones;
        sesionesRealizadas = this._desplazarClavesDiaGlobal(sesionesRealizadas, diffDays);
        feedback = this._desplazarClavesDiaGlobal(feedback, diffDays);
      }

      const detallePersonalizado = this._construirDetalleSesion(data.sesion, personalizado);
      const nuevaSesion = {
        diaGlobal,
        semana: Math.floor((diaGlobal - 1) / 7) + 1,
        diaSemana: ((diaGlobal - 1) % 7) + 1,
        fase: 'PERSONALIZADO',
        nivel: 'intermedio',
        tipo: data.sesion.tipo,
        color: PlanGenerator.getColor(data.sesion.tipo),
        letra: PlanGenerator.getLetra(data.sesion.tipo),
        tieneFuerza: false,
        duracion: personalizado.duracionMin || 0,
        detalle: detallePersonalizado
      };

      const idx = sesiones.findIndex(s => s.diaGlobal === diaGlobal);
      if (idx >= 0) {
        sesiones[idx] = nuevaSesion;
      } else {
        sesiones.push(nuevaSesion);
      }
      sesiones.sort((a, b) => a.diaGlobal - b.diaGlobal);

      const updateData = { sesiones };
      if (diffDays > 0) {
        updateData['params.fechaInicio'] = planData.params.fechaInicio;
        updateData.sesionesRealizadas = sesionesRealizadas;
        updateData.feedback = feedback;
      }
      await planRef.update(updateData);

      AppState.planActualId = planId;
      AppState.planGeneradoActual = planData.params;
      AppState.sesionesRealizadas = sesionesRealizadas;
      AppState.feedbackSesiones = feedback;

      await firebaseServices.db.collection('users').doc(uid).update({ ultimoPlanId: planId });

      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'accepted' });

      const hayMas = this._colaPendientes.length > 0;
      if (!hayMas) {
        Utils.hideLoading();
        this._modalInviteAbierto = false;
        Utils.showToast('✅ Sesión añadida a tu plan personalizado', 'success');
        if (window.PlanGenerator) {
          PlanGenerator.mostrarCalendario(sesiones);
        }
        if (typeof cargarDashboard === 'function') {
          cargarDashboard();
        }
      } else {
        this._modalInviteAbierto = false;
        this._mostrarSiguienteDeCola();
      }

    } catch (e) {
      console.error('Error aceptando sesión enviada:', e);
      Utils.hideLoading();
      this._modalInviteAbierto = false;
      Utils.showToast('Error al añadir la sesión a tu plan personalizado', 'error');
      this._colaPendientes.unshift({ id, data });
      this._mostrarSiguienteDeCola();
    }
  },

  // ========== FUNCIÓN AUXILIAR PARA RELLENAR VALORES POR DEFECTO ==========

  _conValoresPorDefecto(detalleOriginal, personalizado, tipo) {
    const zonaInfo = detalleOriginal.zona ? this._zonaInfo(detalleOriginal.zona) : null;
    if (tipo === 'descanso') {
      return {
        porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
          ? detalleOriginal.porque
          : 'Día de descanso programado por tu entrenador. La recuperación es tan importante como el entrenamiento.',
        sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim()) ? detalleOriginal.sensacion : '',
        pasosDetallados: [],
        tiempoEnZona: null
      };
    }

    if (tipo === 'strength') {
      const ACCION_FUERZA = {
        CALENTAMIENTO: 'Movilidad articular y activación progresiva antes de los ejercicios.',
        'PARTE PRINCIPAL': 'Realiza los ejercicios indicados con buena técnica, priorizando la forma sobre la carga.',
        ESTIRAMIENTOS: 'Estiramientos suaves de la musculatura trabajada.'
      };
      const PORQUE_FUERZA = {
        CALENTAMIENTO: 'Prepara músculos y articulaciones para el trabajo de fuerza.',
        'PARTE PRINCIPAL': 'Es el estímulo clave de esta sesión.',
        ESTIRAMIENTOS: 'Facilita la recuperación y mantiene la movilidad.'
      };
      const pasosFuerza = (detalleOriginal.pasosDetallados || []).map(p => {
        const tit = (p.titulo || '').toUpperCase();
        const clave = tit.includes('CALENTAMIENTO') ? 'CALENTAMIENTO'
          : (tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO')) ? 'ESTIRAMIENTOS'
          : 'PARTE PRINCIPAL';
        return {
          ...p,
          accion: (p.accion && p.accion.trim()) ? p.accion : ACCION_FUERZA[clave],
          porque: (p.porque && p.porque.trim()) ? p.porque : PORQUE_FUERZA[clave]
        };
      });
      return {
        porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
          ? detalleOriginal.porque
          : 'Sesión de fuerza complementaria, programada por tu entrenador.',
        sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim()) ? detalleOriginal.sensacion : 'Exigente pero controlada',
        pasosDetallados: pasosFuerza,
        tiempoEnZona: null
      };
    }

    const SENSACION_POR_ZONA = {
      Z1: 'Suave y relajada', Z2: 'Cómoda, controlada', Z3: 'Exigente pero sostenible',
      Z4: 'Dura, al límite de lo controlable', Z5: 'Máximo esfuerzo, muy intensa', Z6: 'Explosiva, al límite'
    };
    const ACCION_POR_DEFECTO = {
      CALENTAMIENTO: 'Trote suave y progresivo, subiendo el ritmo poco a poco.',
      'PARTE PRINCIPAL': 'Mantén el ritmo objetivo de forma constante durante todo el tramo.',
      ENFRIAMIENTO: 'Trote muy suave para bajar pulsaciones progresivamente.'
    };
    const PORQUE_POR_DEFECTO = {
      CALENTAMIENTO: 'Prepara músculos y sistema cardiovascular para el esfuerzo principal.',
      'PARTE PRINCIPAL': 'Es el estímulo clave de esta sesión.',
      ENFRIAMIENTO: 'Facilita la recuperación activa y baja la frecuencia cardíaca poco a poco.'
    };

    const pasosCompletos = (detalleOriginal.pasosDetallados || []).map(p => {
      const tit = (p.titulo || '').toUpperCase();
      const clave = tit.includes('CALENTAMIENTO') ? 'CALENTAMIENTO'
        : tit.includes('ENFRIAMIENTO') ? 'ENFRIAMIENTO'
        : 'PARTE PRINCIPAL';
      return {
        ...p,
        accion: (p.accion && p.accion.trim()) ? p.accion : ACCION_POR_DEFECTO[clave],
        porque: (p.porque && p.porque.trim()) ? p.porque : PORQUE_POR_DEFECTO[clave]
      };
    });

    return {
      porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
        ? detalleOriginal.porque
        : `Sesión de ${tipo || 'entrenamiento'} en zona ${zonaInfo ? zonaInfo.etiqueta.toLowerCase() : 'objetivo'}, programada por tu entrenador.`,
      sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim())
        ? detalleOriginal.sensacion
        : (zonaInfo ? (SENSACION_POR_ZONA[zonaInfo.codigo] || 'Controlada') : 'Controlada'),
      pasosDetallados: pasosCompletos,
      tiempoEnZona: personalizado.partePrincipal ? Utils.formatR(personalizado.partePrincipal) : (detalleOriginal.tiempoEnZona || null)
    };
  }
};

window.SessionInvites = SessionInvites;
console.log('✅ SessionInvites v8.3 - Checkbox "Distancia" en cada paso');