// ==================== calendar.js - VERSIÓN COMPLETA CORREGIDA ====================
// Versión: 2.67 - Fix GRAVE (continuación de v2.66): quedaban DOS sitios más
//                con el mismo antipatrón (usar diaGlobal/diaIndex como
//                ÍNDICE de array en vez de buscar por su VALOR real), que en
//                un plan personalizado con huecos en la secuencia de
//                diaGlobal seguían dando la sesión equivocada:
//                1) el estilo "perdida" al desmarcar una sesión (cosmético)
//                2) _marcarSesionRealizadaInterno: al marcar una sesión como
//                   hecha, se leían y PUBLICABAN las métricas (distancia,
//                   TSS, calorías, zona, récords) de OTRA sesión distinta a
//                   la que realmente se acababa de completar -- este era el
//                   más grave de los dos.
// ============================================================================

const PlanGenerator = {
  ENTRENAMIENTOS: window.ENTRENAMIENTOS_DB || {},

  FASES: {
    BASE: { nombre: 'Base', color: '#8AA0B0', intensidad: 0.7, volumenBase: 1.0 },
    CONSTRUCCION: { nombre: 'Construcción', color: '#9BB5A0', intensidad: 0.85, volumenBase: 1.15 },
    ESPECIFICA: { nombre: 'Específica', color: '#C9A78B', intensidad: 0.95, volumenBase: 1.2 },
    PICO: { nombre: 'Pico', color: '#C99BA5', intensidad: 1.0, volumenBase: 1.1 },
    TAPER: { nombre: 'Taper', color: '#9AA5A5', intensidad: 0.6, volumenBase: 0.7 }
  },

  ONDULACION_PATRONES: [
    { intensidad: 1.00, volumen: 1.05 },
    { intensidad: 1.05, volumen: 1.15 },
    { intensidad: 0.80, volumen: 0.60 },
    { intensidad: 0.95, volumen: 0.90 }
  ],

  DISTRIBUCION_TIPOS: {
    principiante: {
      base: { rodaje: 0.72, tempo: 0.1, series: 0.0, largo: 0.18 },
      construccion: { rodaje: 0.62, tempo: 0.15, series: 0.05, largo: 0.18 },
      especifica: { rodaje: 0.52, tempo: 0.2, series: 0.1, largo: 0.18 },
      pico: { rodaje: 0.42, tempo: 0.25, series: 0.15, largo: 0.18 },
      taper: { rodaje: 0.76, tempo: 0.1, series: 0.0, largo: 0.14 }
    },
    intermedio: {
      base: { rodaje: 0.61, tempo: 0.15, series: 0.05, largo: 0.19 },
      construccion: { rodaje: 0.49, tempo: 0.2, series: 0.1, largo: 0.21 },
      especifica: { rodaje: 0.37, tempo: 0.2, series: 0.2, largo: 0.23 },
      pico: { rodaje: 0.25, tempo: 0.25, series: 0.25, largo: 0.25 },
      taper: { rodaje: 0.65, tempo: 0.15, series: 0.05, largo: 0.15 }
    },
    avanzado: {
      base: { rodaje: 0.51, tempo: 0.2, series: 0.1, largo: 0.19 },
      construccion: { rodaje: 0.39, tempo: 0.2, series: 0.2, largo: 0.21 },
      especifica: { rodaje: 0.24, tempo: 0.19, series: 0.29, largo: 0.28 },
      pico: { rodaje: 0.13, tempo: 0.22, series: 0.33, largo: 0.32 },
      taper: { rodaje: 0.56, tempo: 0.2, series: 0.1, largo: 0.14 }
    }
  },

  PROGRESION_NIVEL: {
    principiante: { intermedio: 8, avanzado: 16 },
    intermedio: { avanzado: 12 }
  },

  DURACION_FUERZA: 40,
  DESCRIPCIONES_FUERZA: [
    { nombre: "Fuerza funcional", ejercicios: "sentadillas, zancadas, plancha, puente de glúteos, trabajo de core", objetivo: "Mejorar estabilidad y potencia en carrera." },
    { nombre: "Fuerza explosiva", ejercicios: "saltos al cajón, skipping, multisaltos, sentadillas con salto", objetivo: "Aumentar la reactividad y la capacidad de aceleración." },
    { nombre: "Fuerza de resistencia", ejercicios: "circuito de 8 ejercicios: sentadillas, zancadas, burpees, plancha, escaladores, etc.", objetivo: "Mejorar la capacidad de mantener la fuerza durante largos periodos." },
    { nombre: "Fuerza preventiva", ejercicios: "ejercicios de propiocepción, trabajo de tobillos, rotadores externos de cadera, fortalecimiento de isquiotibiales", objetivo: "Reducir riesgo de lesiones típicas del corredor." },
    { nombre: "Fuerza en el tren inferior", ejercicios: "peso muerto, sentadilla búlgara, máquina de prensa, curl femoral", objetivo: "Potenciar la musculatura principal del running." }
  ],

  ultimaSesionPorTipo: {},
  bolsaPorTipo: {},

  _redondearDistancia(distanciaMetros) {
    if (distanciaMetros < 50) return 50;
    const redondeado = Math.round(distanciaMetros / 50) * 50;
    return Math.min(redondeado, 2000);
  },

  _redondearTiempo(segundos) {
    if (segundos < 10) return 10;
    let redondeado = Math.round(segundos / 5) * 5;
    if (segundos > 60) redondeado = Math.round(segundos / 15) * 15;
    return redondeado;
  },

  _redondearDuracionPartePrincipal(segundos) {
    return Math.round(segundos / 15) * 15;
  },

  _ritmoToSeg(ritmoStr) {
    const [min, seg] = ritmoStr.split(':').map(Number);
    return min * 60 + (seg || 0);
  },

  obtenerRitmoParaZona(zonaNombre) {
    const zonas = AppState.lastZones;
    if (!zonas || zonas.length === 0) {
      console.warn('Zonas no disponibles, usando ritmo base como fallback');
      const ritmoBase = AppState.lastRitmoBase || 5;
      return Utils.formatR(ritmoBase);
    }
    const zona = zonas.find(z => z[0] === zonaNombre);
    if (!zona) {
      console.warn(`Zona ${zonaNombre} no encontrada, usando ritmo base`);
      const ritmoBase = AppState.lastRitmoBase || 5;
      return Utils.formatR(ritmoBase);
    }
    const factorPace = zona[4];
    const ritmoBase = AppState.lastRitmoBase;
    if (!ritmoBase) return '--:--';
    const pace = ritmoBase * factorPace;
    return Utils.formatR(pace);
  },

  _detectarZonaPorRitmo(paceMinPerKm) {
    const zonas = AppState.lastZones;
    const ritmoBase = AppState.lastRitmoBase;
    if (!zonas || !zonas.length || !ritmoBase || !paceMinPerKm || !isFinite(paceMinPerKm)) return null;
    let mejor = null, mejorDiff = Infinity;
    zonas.forEach(z => {
      const paceZona = ritmoBase * z[4];
      const diff = Math.abs(paceZona - paceMinPerKm);
      if (diff < mejorDiff) { mejorDiff = diff; mejor = z; }
    });
    return mejor;
  },

  _estimarRitmoParteEfectiva(sesion, totalMin, totalKm) {
    const desglose = this._desglosarSesion(sesion, totalMin, totalKm);
    const pp = desglose.partePrincipal;
    if (pp && pp.km > 0) return pp.min / pp.km;
    return (totalKm > 0) ? totalMin / totalKm : NaN;
  },

  _detectarZonaParteEfectiva(sesion, totalMin, totalKm) {
    const desglose = this._desglosarSesion(sesion, totalMin, totalKm);
    const pp = desglose.partePrincipal;
    if (pp && pp.zona) {
      const zonaDirecta = (AppState.lastZones || []).find(z => z[0] === pp.zona);
      if (zonaDirecta) return zonaDirecta;
    }
    const pace = (pp && pp.km > 0) ? pp.min / pp.km : ((totalKm > 0) ? totalMin / totalKm : NaN);
    return this._detectarZonaPorRitmo(pace);
  },

  _desglosarSesion(sesion, totalMin, totalKm) {
    const zonaMedia = (totalKm > 0) ? this._detectarZonaPorRitmo(totalMin / totalKm) : null;
    const soloPartePrincipal = {
      calentamiento: null,
      partePrincipal: { min: totalMin, km: totalKm, zona: zonaMedia ? zonaMedia[0] : (sesion?.detalle?.zona || '') },
      recuperacion: null,
      enfriamiento: null
    };

    const det = sesion?.detalle;
    const duracionPlan = sesion?.duracion || 0;
    if (!det || duracionPlan <= 0 || (!det.calentamiento && !det.enfriamiento) || totalMin <= 0 || totalKm <= 0) {
      return soloPartePrincipal;
    }

    const proporcion = totalMin / duracionPlan;
    const calMin = (det.calentamiento || 0) * proporcion;
    const enfMin = (det.enfriamiento || 0) * proporcion;
    const mainMin = totalMin - calMin - enfMin;
    if (mainMin <= 0) return soloPartePrincipal;

    const ritmoZ1MinPerKm = this._ritmoToSeg(this.obtenerRitmoParaZona('Z1')) / 60;
    if (!ritmoZ1MinPerKm || !isFinite(ritmoZ1MinPerKm)) return soloPartePrincipal;

    const calKm = calMin / ritmoZ1MinPerKm;
    const enfKm = enfMin / ritmoZ1MinPerKm;
    const mainKm = totalKm - calKm - enfKm;
    if (mainKm <= 0) return soloPartePrincipal;

    const paceMain = mainMin / mainKm;
    const paceMedia = totalMin / totalKm;
    const esSerieConDatos = sesion?.tipo === 'series' && det.segundosEsfuerzo > 0 && duracionPlan > 0;
    if (!esSerieConDatos && paceMain > paceMedia * 1.001) return soloPartePrincipal;

    const zonaPrincipal = this._detectarZonaPorRitmo(paceMain);
    const resultado = {
      calentamiento: calMin > 0 ? { min: calMin, km: calKm, zona: 'Z1' } : null,
      partePrincipal: { min: mainMin, km: mainKm, zona: zonaPrincipal ? zonaPrincipal[0] : (sesion?.detalle?.zona || '') },
      recuperacion: null,
      enfriamiento: enfMin > 0 ? { min: enfMin, km: enfKm, zona: 'Z1' } : null
    };

    if (esSerieConDatos) {
      const plannedMainSec = (det.partePrincipal || 0) * 60;
      const plannedRecSec = plannedMainSec - det.segundosEsfuerzo;
      if (plannedMainSec > 0 && plannedRecSec > 0) {
        const proporcionMain = mainMin / (plannedMainSec / 60);
        const recMin = (plannedRecSec / 60) * proporcionMain;
        if (recMin > 0 && recMin < mainMin) {
          const esfuerzoMin = mainMin - recMin;
          const recKm = mainKm * (recMin / mainMin);
          const esfuerzoKm = mainKm - recKm;
          const zonaPlanEsfuerzo = (det.zona || 'Z4-Z5').split('-').pop().trim();
          resultado.partePrincipal = { min: esfuerzoMin, km: esfuerzoKm, zona: zonaPlanEsfuerzo || 'Z4' };
          resultado.recuperacion = { min: recMin, km: recKm, zona: 'Z2' };
        }
      }
    }

    return resultado;
  },

  _sumarMinutosPorZona(desglose, zonaObjetivo) {
    if (!desglose) return 0;
    let minutos = 0;
    ['calentamiento', 'partePrincipal', 'recuperacion', 'enfriamiento'].forEach(tramo => {
      const seg = desglose[tramo];
      if (seg && seg.zona === zonaObjetivo && isFinite(seg.min)) minutos += seg.min;
    });
    return minutos;
  },

  abrirModalDatosReales(sesion) {
    return new Promise((resolve) => {
      document.getElementById('datosRealesModal')?.remove();
      document.getElementById('datosRealesOverlay')?.remove();

      const distanciaDefecto = sesion?.detalle?.distanciaEstimada || 0;
      const duracionDefecto = sesion?.duracion || 0;

      const overlay = document.createElement('div');
      overlay.id = 'datosRealesOverlay';
      overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(5px);
        z-index:100050; display:flex; align-items:flex-start; justify-content:center;
        overflow-y:auto; box-sizing:border-box;
        padding:max(24px, env(safe-area-inset-top) + 16px) 16px 24px;
        opacity:0; transition:opacity 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.id = 'datosRealesModal';
      modal.style.cssText = `
        background:var(--bg-card); border:1px solid var(--border-color);
        border-radius:20px; max-width:380px; width:90%; padding:20px;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center;
        max-height:90vh; overflow-y:auto; box-sizing:border-box;
        opacity:0; transition:opacity 0.2s ease;
      `;

      const infoTipoOriginal = this._infoTipo(sesion?.tipo);
      const nombreCabecera = sesion?.detalle?.nombre || infoTipoOriginal.label;
      const opcionesTipo = this._tiposDisponiblesEnPlan();

      modal.innerHTML = `
        <h3 style="margin:0 0 6px 0; color:var(--accent-yellow);">📝 DATOS DE LA SESIÓN</h3>
        <p style="margin:0 0 14px 0; font-size:12px; color:var(--text-secondary);">Confirma o corrige lo que has hecho de verdad. Si has entrenado distinto a lo planificado, actualízalo aquí.</p>
        <div id="datosRealesTipoBox" style="cursor:pointer; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:12px; padding:10px 12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span id="datosRealesTipoIcono" style="font-size:16px;">${infoTipoOriginal.icono}</span>
          <strong id="datosRealesTipoTexto" style="font-size:14px; color:var(--text-primary);">${Utils.escapeHTML(nombreCabecera)}</strong>
        </div>
        <p id="datosRealesTipoNota" style="display:none; margin:0 0 14px 0; font-size:11px; color:var(--text-secondary);">Se guardará como <strong id="datosRealesTipoNotaTexto"></strong> en vez de lo planificado.</p>
        <div style="text-align:left; margin-bottom:12px; max-width:200px; margin-left:auto; margin-right:auto;">
          <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">📏 Kilómetros</label>
          <input type="number" id="datosRealesKm" inputmode="decimal" step="0.01" min="0" value="${distanciaDefecto ? distanciaDefecto.toFixed(2) : ''}" style="width:100%; padding:8px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
        </div>
        <div style="display:flex; gap:10px; margin-bottom:14px;">
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">⏱️ Minutos</label>
            <input type="number" id="datosRealesMin" inputmode="numeric" min="0" value="${Math.floor(duracionDefecto)}" style="width:100%; padding:8px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
          </div>
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">Segundos</label>
            <input type="number" id="datosRealesSeg" inputmode="numeric" min="0" max="59" value="0" style="width:100%; padding:8px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
          </div>
        </div>
        <div id="datosRealesZonaBox" style="background:var(--bg-primary); border:1px solid var(--border-color); border-left:4px solid transparent; border-radius:12px; padding:12px; margin-bottom:18px; transition:border-color .2s ease;">
          <div style="font-size:12px; color:var(--text-secondary); margin-bottom:2px;">Ritmo medio</div>
          <div id="datosRealesRitmo" style="font-size:22px; font-weight:bold; color:var(--gold);">--:--</div>
          <div id="datosRealesZona" style="font-size:12px; color:var(--text-secondary); margin-top:4px;">&nbsp;</div>
        </div>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="datosRealesCancel" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); padding:10px 24px; border-radius:14px; cursor:pointer;">CANCELAR</button>
          <button id="datosRealesConfirm" style="background:var(--accent-blue); border:none; color:var(--bg-primary); padding:10px 24px; border-radius:14px; cursor:pointer; font-weight:bold;">ACEPTAR</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

      const kmInput = document.getElementById('datosRealesKm');
      const minInput = document.getElementById('datosRealesMin');
      const segInput = document.getElementById('datosRealesSeg');
      const ritmoEl = document.getElementById('datosRealesRitmo');
      const zonaEl = document.getElementById('datosRealesZona');
      const zonaBoxEl = document.getElementById('datosRealesZonaBox');

      let tipoSeleccionado = null;
      const tipoBox = document.getElementById('datosRealesTipoBox');
      const tipoIconoEl = document.getElementById('datosRealesTipoIcono');
      const tipoTextoEl = document.getElementById('datosRealesTipoTexto');
      const tipoNotaEl = document.getElementById('datosRealesTipoNota');
      const tipoNotaTextoEl = document.getElementById('datosRealesTipoNotaTexto');

      const abrirSelectorTipo = () => {
        document.getElementById('datosRealesTipoPopupOverlay')?.remove();
        const popupOverlay = document.createElement('div');
        popupOverlay.id = 'datosRealesTipoPopupOverlay';
        popupOverlay.style.cssText = `
          position:fixed; top:0; left:0; width:100%; height:100%;
          background:rgba(0,0,0,0.55); z-index:100060; display:flex;
          align-items:center; justify-content:center; padding:20px; box-sizing:border-box;
          opacity:0; transition:opacity 0.2s ease;
        `;
        const popup = document.createElement('div');
        popup.style.cssText = `
          background:var(--bg-card); border:1px solid var(--border-color);
          border-radius:16px; padding:16px; max-width:300px; width:100%;
          box-shadow:0 10px 30px rgba(0,0,0,0.4);
          opacity:0; transition:opacity 0.2s ease;
        `;
        popup.innerHTML = `
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; text-align:center;">¿Qué tipo de sesión hiciste?</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${opcionesTipo.map(o => `
              <button type="button" class="datos-reales-tipo-opcion" data-tipo="${o.tipo}" style="background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); padding:16px 12px; border-radius:12px; cursor:pointer; font-size:13px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <span style="font-size:20px;">${o.icono}</span>
                <span>${o.label}</span>
              </button>
            `).join('')}
          </div>
        `;
        popupOverlay.appendChild(popup);
        document.body.appendChild(popupOverlay);
        requestAnimationFrame(() => { popupOverlay.style.opacity = '1'; popup.style.opacity = '1'; });
        popupOverlay.onclick = (e) => { if (e.target === popupOverlay) popupOverlay.remove(); };
        popup.querySelectorAll('.datos-reales-tipo-opcion').forEach(btn => {
          btn.addEventListener('click', () => {
            const nuevoTipo = btn.getAttribute('data-tipo');
            const info = this._infoTipo(nuevoTipo);
            tipoIconoEl.textContent = info.icono;
            tipoTextoEl.textContent = info.label;
            popupOverlay.remove();
            if (nuevoTipo === sesion?.tipo) {
              tipoSeleccionado = null;
              tipoNotaEl.style.display = 'none';
            } else {
              tipoSeleccionado = nuevoTipo;
              tipoNotaTextoEl.textContent = info.label;
              tipoNotaEl.style.display = 'block';
            }
          });
        });
      };
      tipoBox.addEventListener('click', abrirSelectorTipo);

      const recalcular = () => {
        const km = parseFloat(kmInput.value) || 0;
        const min = parseFloat(minInput.value) || 0;
        const seg = parseFloat(segInput.value) || 0;
        const totalMin = min + seg / 60;
        if (km > 0 && totalMin > 0) {
          const paceMinPerKm = totalMin / km;
          ritmoEl.textContent = `${Utils.formatR(paceMinPerKm)} /km`;
          const zona = this._detectarZonaParteEfectiva(sesion, totalMin, km);
          if (zona) {
            zonaEl.innerHTML = `Zona de trabajo: <strong>${Utils.escapeHTML(zona[0])}</strong> · ${Utils.escapeHTML(zona[1])}`;
            const numZona = (zona[5] || '').replace('z', '');
            zonaBoxEl.style.borderLeftColor = numZona ? `var(--zone-${numZona})` : 'transparent';
          } else {
            zonaEl.innerHTML = '&nbsp;';
            zonaBoxEl.style.borderLeftColor = 'transparent';
          }
        } else {
          ritmoEl.textContent = '--:--';
          zonaEl.innerHTML = '&nbsp;';
          zonaBoxEl.style.borderLeftColor = 'transparent';
        }
      };
      [kmInput, minInput, segInput].forEach(inp => inp.addEventListener('input', recalcular));
      recalcular();

      const cerrar = (valor) => { document.getElementById('datosRealesTipoPopupOverlay')?.remove(); overlay.remove(); resolve(valor); };

      document.getElementById('datosRealesConfirm').onclick = () => {
        const km = parseFloat(kmInput.value);
        const min = parseFloat(minInput.value) || 0;
        const seg = parseFloat(segInput.value) || 0;
        const ms = (min * 60 + seg) * 1000;
        if (!km || km <= 0 || ms <= 0) {
          Utils.showToast('Introduce kilómetros y tiempo válidos', 'error');
          return;
        }
        cerrar({ km, ms, tipoCorregido: tipoSeleccionado });
      };
      document.getElementById('datosRealesCancel').onclick = () => cerrar(null);
      overlay.onclick = (e) => { if (e.target === overlay) cerrar(null); };
    });
  },

  _calcularCalentamientoEnfriamiento(duracion) {
    let calentamiento = Math.round(duracion * 0.15);
    let enfriamiento = Math.round(duracion * 0.1);
    calentamiento = Math.max(10, calentamiento);
    enfriamiento = Math.max(5, enfriamiento);
    let partePrincipal = duracion - calentamiento - enfriamiento;
    if (partePrincipal < 5) {
      calentamiento = Math.floor(duracion * 0.4);
      enfriamiento = Math.floor(duracion * 0.2);
      partePrincipal = duracion - calentamiento - enfriamiento;
    }
    return { calentamiento, enfriamiento, partePrincipal };
  },

  _pasosBasicos(calentamiento, partePrincipal, enfriamiento, accionPrincipal, porquePrincipal) {
    return [
      { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' de trote suave (Z1) + ejercicios de movilidad`, porque: 'Preparar músculos, articulaciones y sistema cardiovascular.' },
      { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: accionPrincipal, porque: porquePrincipal },
      { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' de trote suave + estiramientos suaves`, porque: 'Reducir frecuencia cardíaca, eliminar lactato y acelerar recuperación.' }
    ];
  },

  _buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados, metricasExtra = {}, factorIntensidad = 1.0) {
    const { calentamiento, partePrincipal, enfriamiento, ritmoObjetivo, fcObjetivo, duracion, zonaPrincipal, sensacion, objetivo, porque, nombre, descripcion, estructura } = datosBasicos;
    const detalle = {
      nombre: Utils.escapeHTML(nombre),
      descripcion: Utils.escapeHTML(descripcion),
      estructura: Utils.escapeHTML(estructura),
      sensacion: Utils.escapeHTML(sensacion),
      zona: zonaPrincipal,
      duracion,
      ritmoObjetivo,
      fcObjetivo,
      calentamiento,
      partePrincipal,
      enfriamiento,
      objetivo: Utils.escapeHTML(objetivo),
      porque: Utils.escapeHTML(porque),
      pasosDetallados,
      ...metricasExtra
    };
    const metricas = this.calcularMetricasSesion({ tipo, duracion, detalle }, factorIntensidad);
    detalle.distanciaEstimada = metricas.distanciaTotal;
    detalle.tssEstimada = metricas.tssTotal;
    return { tipo, duracion, detalle };
  },

  obtenerObjetivoTexto(tipo, fase) {
    const objetivos = {
      rodaje: {
        BASE: 'Construir base aeróbica',
        CONSTRUCCION: 'Mantener volumen con calidad',
        ESPECIFICA: 'Preparar para ritmos de competición',
        PICO: 'Mantener forma sin fatiga',
        TAPER: 'Recuperación activa'
      },
      tempo: {
        BASE: 'Introducir ritmos sostenidos',
        CONSTRUCCION: 'Mejorar umbral de lactato',
        ESPECIFICA: 'Simular ritmos de competición',
        PICO: 'Ajustar ritmos objetivo',
        TAPER: 'Mantener agilidad'
      },
      series: {
        BASE: 'Desarrollar velocidad básica',
        CONSTRUCCION: 'Aumentar tolerancia al lactato',
        ESPECIFICA: 'Estimular VO2max',
        PICO: 'Afinar velocidad específica',
        TAPER: 'Mantener explosividad'
      },
      largo: {
        BASE: 'Aumentar capacidad aeróbica',
        CONSTRUCCION: 'Mejorar resistencia específica',
        ESPECIFICA: 'Simular condiciones de carrera',
        PICO: 'Mantener confianza',
        TAPER: 'Cargar glucógeno'
      }
    };
    return objetivos[tipo]?.[fase] || `Sesión de ${tipo}`;
  },

  obtenerPorque(tipo, fase) {
    const porqueMap = {
      rodaje: {
        BASE: 'Construir la base aeróbica, fundamental para soportar volúmenes mayores.',
        CONSTRUCCION: 'Mantener el volumen mientras se introduce calidad.',
        ESPECIFICA: 'Preparar el cuerpo para los ritmos de competición.',
        PICO: 'Mantener la forma sin generar fatiga adicional.',
        TAPER: 'Activar la circulación y mantener la frescura muscular.'
      },
      tempo: {
        BASE: 'Introducir el cuerpo a ritmos sostenidos por encima del aeróbico.',
        CONSTRUCCION: 'Elevar el umbral de lactato para poder mantener ritmos más rápidos.',
        ESPECIFICA: 'Simular los ritmos de carrera y acostumbrar al cuerpo a la fatiga.',
        PICO: 'Ajustar el ritmo objetivo y ganar confianza.',
        TAPER: 'Mantener la agilidad sin acumular ácido láctico.'
      },
      series: {
        BASE: 'Desarrollar velocidad básica y eficiencia neuromuscular.',
        CONSTRUCCION: 'Aumentar la tolerancia al lactato y la capacidad de eliminar desechos.',
        ESPECIFICA: 'Estimular el VO2máx y mejorar la potencia aeróbica.',
        PICO: 'Afinar la velocidad específica para la distancia objetivo.',
        TAPER: 'Mantener la explosividad sin fatiga.'
      },
      largo: {
        BASE: 'Aumentar la capacidad aeróbica y la resistencia general.',
        CONSTRUCCION: 'Mejorar la resistencia específica para la distancia objetivo.',
        ESPECIFICA: 'Simular las condiciones de carrera (ritmo, nutrición, hidratación).',
        PICO: 'Mantener la confianza y la resistencia sin llegar al agotamiento.',
        TAPER: 'Cargar los depósitos de glucógeno y mantener la motivación.'
      }
    };
    return porqueMap[tipo]?.[fase] || 'Sesión clave para el desarrollo del plan.';
  },

  obtenerSensacion(tipo, fase) {
    const sensaciones = {
      rodaje: { BASE: 'Cómodo', CONSTRUCCION: 'Controlado', ESPECIFICA: 'Activo', PICO: 'Exigente', TAPER: 'Muy suave' },
      tempo: { BASE: 'Fuerte', CONSTRUCCION: 'Exigente', ESPECIFICA: 'Muy exigente', PICO: 'Límite', TAPER: 'Suave' },
      series: { BASE: 'Rápidas', CONSTRUCCION: 'Intensas', ESPECIFICA: 'Muy intensas', PICO: 'Máximas', TAPER: 'Suaves' },
      largo: { BASE: 'Resistencia', CONSTRUCCION: 'Fondo', ESPECIFICA: 'Calidad', PICO: 'Simulación', TAPER: 'Ligero' }
    };
    return sensaciones[tipo]?.[fase] || 'Controlado';
  },

  TIPOS_INFO: {
    rodaje: { icono: '🏃‍♂️', label: 'Rodaje' },
    tempo:  { icono: '⚡', label: 'Tempo' },
    series: { icono: '🔁', label: 'Series' },
    largo:  { icono: '📏', label: 'Tirada larga' }
  },

  _infoTipo(tipo) {
    return this.TIPOS_INFO[tipo] || { icono: '🏃', label: (tipo || 'Sesión').toUpperCase() };
  },

  _tiposDisponiblesEnPlan() {
    return Object.keys(this.TIPOS_INFO).map(tipo => ({ tipo, ...this._infoTipo(tipo) }));
  },

  _barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  _sacarSesionDeLaBolsa(dbTipo, tipo, modalidad, distancia, nivel) {
    const key = `${modalidad}|${distancia}|${nivel}|${tipo}`;
    let bolsa = this.bolsaPorTipo[key];
    if (!bolsa || bolsa.length === 0) {
      bolsa = this._barajar([...dbTipo]);
      const ultima = this.ultimaSesionPorTipo[tipo];
      if (ultima && bolsa.length > 1 && bolsa[0].nombre === ultima) {
        [bolsa[0], bolsa[1]] = [bolsa[1], bolsa[0]];
      }
      this.bolsaPorTipo[key] = bolsa;
    }
    const sesion = bolsa.shift();
    this.ultimaSesionPorTipo[tipo] = sesion.nombre;
    return sesion;
  },

  _minimoDuracionSesion(nivel, esDescargaOTaper) {
    const normal = { principiante: 45, intermedio: 50, avanzado: 55 }[nivel] || 45;
    return esDescargaOTaper ? normal - 10 : normal;
  },

  async crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null, esRecuperacion = false, maximoForzado = null) {
    const { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo } = datos;
    const dbTipo = this.ENTRENAMIENTOS[modalidad]?.[distancia]?.[nivel]?.[tipo];
    let sesionMatriz = null;
    if (dbTipo?.length) {
      sesionMatriz = this._sacarSesionDeLaBolsa(dbTipo, tipo, modalidad, distancia, nivel);
    }
    if (!sesionMatriz) {
      let nombreBase = '', duracionBase = 45;
      switch(tipo) {
        case 'rodaje': nombreBase = 'Rodaje aeróbico'; duracionBase = 45; break;
        case 'tempo': nombreBase = 'Entrenamiento de tempo'; duracionBase = 45; break;
        case 'series': nombreBase = 'Trabajo de series'; duracionBase = 50; break;
        case 'largo': nombreBase = 'Tirada larga'; duracionBase = 60; break;
      }
      sesionMatriz = { nombre: nombreBase, desc: '', duracion: duracionBase };
    }
    let duracion;
    if (duracionExacta !== null) {
      duracion = duracionExacta;
      const max = maximoForzado != null ? maximoForzado : this.getMaximosPorTipo(tipo, nivel, fase, distancia);
      if (max) duracion = Math.min(duracion, max);
      const min = this._minimoDuracionSesion(nivel, semanaEnFase % 4 === 0 || fase === 'TAPER');
      if (duracion < min) {
        duracion = min + Math.floor(Math.random() * 12);
        if (max) duracion = Math.min(duracion, max);
      }
    } else {
      duracion = sesionMatriz.duracion || 45;
      duracion = Math.round(duracion * factorVolumen);
      const max = maximoForzado != null ? maximoForzado : this.getMaximosPorTipo(tipo, nivel, fase, distancia);
      if (max) duracion = Math.min(duracion, max);
      const min = this._minimoDuracionSesion(nivel, semanaEnFase % 4 === 0 || fase === 'TAPER');
      if (duracion < min) {
        duracion = min + Math.floor(Math.random() * 12);
        if (max) duracion = Math.min(duracion, max);
      }
    }

    if (esRecuperacion && tipo === 'rodaje') {
      duracion = 25;
    }

    const { calentamiento, enfriamiento, partePrincipal } = this._calcularCalentamientoEnfriamiento(duracion);
    let accionPrincipal = '', porquePrincipal = '';
    const incluirRitmoObjetivo = (tipo === 'largo' && (fase === 'ESPECIFICA' || fase === 'PICO') && (datos.distancia === 'medio' || datos.distancia === 'maraton') && semanaEnFase > 2 && partePrincipal >= 30);
    if (incluirRitmoObjetivo) {
      const bloqueRitmo = Math.min(Math.round(partePrincipal * 0.4), 45);
      const parteZ2 = partePrincipal - bloqueRitmo;
      accionPrincipal = `${parteZ2}' Z2 + ${bloqueRitmo}' a ritmo objetivo (Z4)`;
      porquePrincipal = 'Simular las exigencias de la carrera y ganar confianza en el ritmo objetivo.';
    } else {
      switch(tipo) {
        case 'rodaje':
          if (esRecuperacion) {
            accionPrincipal = `${partePrincipal}' rodaje muy suave Z1-Z2`;
            porquePrincipal = 'Recuperación activa después de la tirada larga.';
          } else {
            accionPrincipal = `${partePrincipal}' rodaje continuo Z2`;
            porquePrincipal = 'Desarrollar base aeróbica, mejorar eficiencia y quemar grasas.';
          }
          break;
        case 'tempo':
          accionPrincipal = `${partePrincipal}' tempo Z3-Z4`;
          porquePrincipal = 'Elevar umbral de lactato, mejorar resistencia a ritmos exigentes.';
          break;
        case 'largo':
          accionPrincipal = `${partePrincipal}' tirada larga Z2`;
          porquePrincipal = 'Aumentar capacidad aeróbica, resistencia específica y confianza.';
          break;
        default:
          accionPrincipal = `${partePrincipal}' trabajo principal`;
          porquePrincipal = 'Mejorar condición física general y adaptaciones específicas.';
      }
    }
    const pasosDetallados = this._pasosBasicos(calentamiento, partePrincipal, enfriamiento, accionPrincipal, porquePrincipal);
    const estructuraDetallada = `${calentamiento}' calentamiento Z1 + ${accionPrincipal} + ${enfriamiento}' enfriamiento Z1`;
    let zonaPrincipal = 'Z2';
    const zonaMatch = accionPrincipal.match(/Z([1-6])/);
    if (zonaMatch) zonaPrincipal = `Z${zonaMatch[1]}`;
    else if (tipo === 'tempo') zonaPrincipal = 'Z3';
    else if (tipo === 'series') zonaPrincipal = 'Z4';
    else if (esRecuperacion) zonaPrincipal = 'Z1';

    let ritmoObjetivo = '';
    if (tipo === 'rodaje') ritmoObjetivo = this.obtenerRitmoParaZona(esRecuperacion ? 'Z1' : 'Z2');
    else if (tipo === 'tempo') ritmoObjetivo = this.obtenerRitmoParaZona('Z3');
    else if (tipo === 'series') ritmoObjetivo = this.obtenerRitmoParaZona('Z5');
    else if (tipo === 'largo') ritmoObjetivo = this.obtenerRitmoParaZona('Z2');

    let fcObjetivo = '';

    let metricasExtraSeries = {};
    if (tipo === 'series') {
      const repSerie = sesionMatriz?.repeticiones;
      const distSerie = sesionMatriz?.distanciaSerie;
      if (repSerie > 0 && distSerie > 0) {
        const zonaSerieDb = (sesionMatriz.zona || 'Z4').split('-').pop().trim();
        const ritmoSerieSeg = this._ritmoToSeg(this.obtenerRitmoParaZona(zonaSerieDb));
        if (ritmoSerieSeg && isFinite(ritmoSerieSeg)) {
          const segundosEsfuerzo = repSerie * (distSerie / 1000) * ritmoSerieSeg;
          metricasExtraSeries = { segundosEsfuerzo, tiempoEnZona: Utils.formatR(segundosEsfuerzo / 60) };
        }
      } else {
        const nombreLower = ((sesionMatriz && sesionMatriz.nombre) || '').toLowerCase();
        let fraccionEsfuerzo = 0.55;
        if (nombreLower.includes('cuesta')) fraccionEsfuerzo = 0.4;
        else if (nombreLower.includes('fartlek')) fraccionEsfuerzo = 0.4;
        else if (nombreLower.includes('pirámide') || nombreLower.includes('piramide')) fraccionEsfuerzo = 0.65;
        const segundosEsfuerzo = partePrincipal * 60 * fraccionEsfuerzo;
        metricasExtraSeries = { segundosEsfuerzo, tiempoEnZona: Utils.formatR(segundosEsfuerzo / 60) };
      }
    }

    const sensacion = this.obtenerSensacion(tipo, fase);
    const objetivoTexto = this.obtenerObjetivoTexto(tipo, fase);
    const porqueTexto = this.obtenerPorque(tipo, fase);
    const datosBasicos = {
      nombre: (sesionMatriz ? sesionMatriz.nombre : `${tipo}: ${fase.toLowerCase()}`) || `${tipo}: ${fase.toLowerCase()}`,
      descripcion: (sesionMatriz ? sesionMatriz.desc : `Sesión de ${tipo} en fase ${fase}`) || `Sesión de ${tipo} en fase ${fase}`,
      estructura: estructuraDetallada,
      sensacion: sensacion,
      zonaPrincipal: zonaPrincipal,
      duracion: duracion,
      ritmoObjetivo: ritmoObjetivo,
      fcObjetivo: fcObjetivo,
      calentamiento, partePrincipal, enfriamiento,
      objetivo: objetivoTexto,
      porque: porqueTexto
    };
    return this._buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados, metricasExtraSeries, factorIntensidad);
  },

  async crearSesionAvanzadaSeries(estructura, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta) {
    const { modalidad, distancia, ritmoBase, fcUmbral } = datos;
    let duracion = duracionExacta || 50;
    const maxSeries = this.getMaximosPorTipo('series', nivel, fase, distancia);
    duracion = Math.min(duracion, maxSeries);
    const minSeries = this._minimoDuracionSesion(nivel, fase === 'TAPER');
    if (duracion < minSeries) {
      duracion = minSeries + Math.floor(Math.random() * 12);
      duracion = Math.min(duracion, maxSeries);
    }
    const { calentamiento, enfriamiento } = this._calcularCalentamientoEnfriamiento(duracion);
    let partePrincipalSeg = Math.max(20, duracion - calentamiento - enfriamiento) * 60;

    const ritmoRapidoSeg = this._ritmoToSeg(this.obtenerRitmoParaZona('Z5'));
    const ritmoModeradoSeg = this._ritmoToSeg(this.obtenerRitmoParaZona('Z2'));

    let nombre = '', descripcion = '', accion = '', porque = '', zona = 'Z4-Z5';
    let pasosDetallados = [];
    let metricasExtra = {};

    switch(estructura) {
      case 'piramide': {
        nombre = 'Pirámide de series';
        descripcion = 'Estructura en pirámide ascendente y descendente, adaptada al tiempo disponible.';
        const baseDistancias = [200, 400, 600, 800, 600, 400, 200];
        const calcularTotalPiramide = (dists) => {
          let tSeries = 0, tRec = 0;
          dists.forEach((d, idx) => {
            tSeries += (d / 1000) * ritmoRapidoSeg;
            if (idx < dists.length - 1) tRec += Math.min(120, Math.max(40, d / 10));
          });
          return tSeries + tRec;
        };
        const totalBase1x = calcularTotalPiramide(baseDistancias);
        const factor = partePrincipalSeg / totalBase1x;

        let distancias;
        if (factor < 0.55) distancias = [200, 400, 200];
        else if (factor < 0.75) distancias = [200, 400, 400, 200];
        else if (factor < 1.3) distancias = [...baseDistancias];
        else {
          distancias = [...baseDistancias];
          while (true) {
            const candidato = [...distancias, ...baseDistancias];
            if (calcularTotalPiramide(candidato) > partePrincipalSeg * 1.2) break;
            distancias = candidato;
          }
        }
        distancias = distancias.map(d => this._redondearDistancia(d));
        const recuperaciones = distancias.map((d, i) => {
          if (i === distancias.length - 1) return 0;
          let rec = Math.min(120, Math.max(40, d / 10));
          return this._redondearTiempo(rec);
        });
        let tiempoSeries = 0, tiempoRec = 0;
        distancias.forEach((d, idx) => {
          tiempoSeries += (d / 1000) * ritmoRapidoSeg;
          if (idx < distancias.length - 1) tiempoRec += recuperaciones[idx];
        });
        let totalPartePrincipal = tiempoSeries + tiempoRec;
        totalPartePrincipal = this._redondearDuracionPartePrincipal(totalPartePrincipal);
        partePrincipalSeg = totalPartePrincipal;
        let textoDistancias = '';
        distancias.forEach((d, i) => {
          textoDistancias += `${d}m`;
          if (i < distancias.length - 1) textoDistancias += ` (rec ${Math.round(recuperaciones[i])}") `;
        });
        accion = `Parte principal: ${Math.floor(totalPartePrincipal / 60)}:${Math.round(totalPartePrincipal % 60).toString().padStart(2,'0')} minutos. Pirámide: ${textoDistancias}. Realiza cada repetición a ritmo rápido – Z4-Z5 – recuperando caminando o trotando suave – Z2.`;
        porque = 'Mejora la capacidad de cambiar de ritmo, la potencia aeróbica y la tolerancia al lactato.';
        pasosDetallados = this._pasosBasicos(calentamiento, Math.floor(totalPartePrincipal / 60), enfriamiento, accion, porque);
        metricasExtra = { tipoEstructura: 'piramide', distancias, ritmoSerie: this.obtenerRitmoParaZona('Z5'), ritmoRecuperacion: this.obtenerRitmoParaZona('Z2'), recuperaciones, tiempoEnZona: Utils.formatR(tiempoSeries / 60), segundosEsfuerzo: tiempoSeries };
        break;
      }
      case 'rotas': {
        nombre = 'Series rotas (broken sets)';
        descripcion = 'Bloques de series con recuperación parcial entre bloques. Adaptado a la duración disponible.';
        let distanciaSerie = distancia === '2k' || distancia === '5k' ? 400 : (distancia === '10k' ? 800 : 1000);
        let recIntra = distanciaSerie <= 400 ? 60 : (distanciaSerie <= 800 ? 90 : 120);
        const recEntreBloques = 180;
        let repPorBloque = 4;
        let bloques = 2;

        const calcularTotal = () => {
          const tiempoPorSerie = (distanciaSerie / 1000) * ritmoRapidoSeg;
          const tSeries = repPorBloque * bloques * tiempoPorSerie;
          const tRecIntra = (repPorBloque - 1) * recIntra * bloques;
          const tRecEntre = recEntreBloques * (bloques - 1);
          return tSeries + tRecIntra + tRecEntre;
        };

        let total = calcularTotal();
        let factor = partePrincipalSeg / total;

        if (factor > 1.2) {
          while (bloques < 4) {
            const bloquesPrueba = bloques + 1;
            const tiempoPorSerie = (distanciaSerie / 1000) * ritmoRapidoSeg;
            const totalPrueba = repPorBloque * bloquesPrueba * tiempoPorSerie
              + (repPorBloque - 1) * recIntra * bloquesPrueba
              + recEntreBloques * (bloquesPrueba - 1);
            if (totalPrueba > partePrincipalSeg * 1.2) break;
            bloques = bloquesPrueba;
          }
          total = calcularTotal();
          factor = partePrincipalSeg / total;
        }

        let intentos = 0;
        while (factor < 0.8 && intentos < 10) {
          if (distanciaSerie > 200) {
            distanciaSerie = Math.max(200, distanciaSerie - 200);
            recIntra = distanciaSerie <= 400 ? 60 : (distanciaSerie <= 800 ? 90 : 120);
          } else if (repPorBloque > 2) {
            repPorBloque -= 1;
          } else if (bloques > 1) {
            bloques -= 1;
          } else {
            break;
          }
          total = calcularTotal();
          factor = partePrincipalSeg / total;
          intentos++;
        }

        distanciaSerie = this._redondearDistancia(distanciaSerie);
        recIntra = this._redondearTiempo(recIntra);
        let totalPartePrincipalReal = this._redondearDuracionPartePrincipal(calcularTotal());
        partePrincipalSeg = totalPartePrincipalReal;

        const minutosPP = Math.floor(totalPartePrincipalReal / 60);
        const segundosPP = Math.round(totalPartePrincipalReal % 60);
        const duracionPartePrincipalR = `${minutosPP}:${segundosPP.toString().padStart(2, '0')}`;
        const tiempoPorSerieReal = (distanciaSerie / 1000) * ritmoRapidoSeg;
        const tiempoSeriesReal = repPorBloque * bloques * tiempoPorSerieReal;

        accion = `Parte principal (${duracionPartePrincipalR} minutos): ${bloques} bloques de ${repPorBloque}x${distanciaSerie}m a ritmo rápido – Z4-Z5 – con recuperación de ${recIntra}" entre series y ${Math.floor(recEntreBloques/60)}' entre bloques (recuperación activa Z2).`;
        porque = 'Aumenta la capacidad de mantener el ritmo rápido bajo fatiga.';
        pasosDetallados = this._pasosBasicos(calentamiento, minutosPP, enfriamiento, accion, porque);
        metricasExtra = {
          tipoEstructura: 'rotas', distanciaSerie, repeticionesPorBloque: repPorBloque, bloques, recIntra, recEntreBloques,
          ritmoSerie: this.obtenerRitmoParaZona('Z5'), ritmoRecuperacion: this.obtenerRitmoParaZona('Z2'),
          tiempoEnZona: Utils.formatR(tiempoSeriesReal / 60), segundosEsfuerzo: tiempoSeriesReal
        };
        break;
      }
      case 'fartlek': {
        nombre = 'Fartlek estructurado';
        descripcion = 'Cambios de ritmo sin parar. Adaptado al tiempo disponible.';
        let tiempoFuerte = 60;
        let tiempoSuave = 90;
        let repeticiones = Math.floor(partePrincipalSeg / (tiempoFuerte + tiempoSuave));
        let sobrante = partePrincipalSeg - repeticiones * (tiempoFuerte + tiempoSuave);
        if (repeticiones < 2) {
          tiempoFuerte = Math.floor(partePrincipalSeg * 0.4);
          tiempoSuave = partePrincipalSeg - tiempoFuerte;
          repeticiones = 1;
          sobrante = 0;
        }
        tiempoFuerte = this._redondearTiempo(tiempoFuerte);
        tiempoSuave = this._redondearTiempo(tiempoSuave);
        const segundosFuertes = repeticiones * tiempoFuerte;
        const segundosSuaves = repeticiones * tiempoSuave + sobrante;
        const totalSegundos = segundosFuertes + segundosSuaves;
        partePrincipalSeg = totalSegundos;
        const minutosPP = Math.floor(totalSegundos / 60);
        accion = `Parte principal: ${minutosPP}:${(totalSegundos % 60).toString().padStart(2,'0')} minutos. ${repeticiones} ciclos de ${tiempoFuerte}" fuerte + ${tiempoSuave}" suave${sobrante ? ` + ${sobrante}" suave final` : ''}. Realiza el fuerte a ritmo rápido – Z4-Z5 – y el suave a ritmo aeróbico – Z2. El cambio de ritmo debe ser continuo, sin detenerte.`;
        porque = 'Mejora la capacidad de cambiar de ritmo, la economía de carrera y la resistencia a ritmos variables.';
        pasosDetallados = this._pasosBasicos(calentamiento, minutosPP, enfriamiento, accion, porque);
        metricasExtra = {
          tipoEstructura: 'fartlek', segundosFuertes, segundosSuaves,
          ritmoFuerte: this.obtenerRitmoParaZona('Z5'), ritmoSuave: this.obtenerRitmoParaZona('Z2'),
          tiempoEnZona: Utils.formatR(segundosFuertes / 60), segundosEsfuerzo: segundosFuertes
        };
        break;
      }
      case 'cuestas': {
        nombre = 'Repeticiones en cuesta';
        descripcion = 'Trabajo de potencia en pendiente. Adaptado al tiempo disponible.';
        let duracionCuesta = 60;
        let recCuesta = 90;
        let numCuestas = Math.floor(partePrincipalSeg / (duracionCuesta + recCuesta));
        if (numCuestas < 3) {
          duracionCuesta = Math.min(45, Math.floor(partePrincipalSeg * 0.6));
          recCuesta = partePrincipalSeg - duracionCuesta;
          numCuestas = 1;
        }
        duracionCuesta = this._redondearTiempo(duracionCuesta);
        recCuesta = this._redondearTiempo(recCuesta);
        const totalSegundos = numCuestas * (duracionCuesta + recCuesta);
        partePrincipalSeg = totalSegundos;
        const minutosPP = Math.floor(totalSegundos / 60);
        accion = `Parte principal: ${minutosPP}:${(totalSegundos % 60).toString().padStart(2,'0')} minutos. ${numCuestas} repeticiones de ${duracionCuesta}" en cuesta con desnivel moderado, recuperando trotando suave ${recCuesta}" – Z2. Esfuerzo máximo (Z5) en la subida.`;
        porque = 'Desarrolla fuerza específica, potencia y mejora la técnica de carrera.';
        pasosDetallados = [
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' trote suave + ejercicios de movilidad + 2 progresiones en cuesta`, porque: 'Preparar el cuerpo.' },
          { icono: '⛰️', titulo: 'CUESTAS', accion: accion, porque: porque },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' trote suave + estiramientos`, porque: 'Recuperación.' }
        ];
        metricasExtra = {
          tipoEstructura: 'cuestas', numRepeticiones: numCuestas, duracionRepeticion: duracionCuesta,
          ritmoRepeticion: this.obtenerRitmoParaZona('Z5'), tiempoEnZona: Utils.formatR((numCuestas * duracionCuesta) / 60), segundosEsfuerzo: numCuestas * duracionCuesta
        };
        break;
      }
      default:
        return this.crearSesionBasica('series', fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta);
    }

    const partePrincipalFinal = Math.floor(partePrincipalSeg / 60);
    const duracionReal = calentamiento + partePrincipalFinal + enfriamiento;
    const estructuraDetallada = `${calentamiento}' calentamiento + ${accion} + ${enfriamiento}' enfriamiento`;
    const datosBasicos = {
      nombre, descripcion, estructura: estructuraDetallada, sensacion: 'Muy intenso', zonaPrincipal: zona, duracion: duracionReal,
      ritmoObjetivo: this.obtenerRitmoParaZona('Z5'), fcObjetivo: '',
      calentamiento, partePrincipal: partePrincipalFinal, enfriamiento, objetivo: nombre, porque
    };
    return this._buildSesionDetalle('series', fase, datosBasicos, pasosDetallados, metricasExtra, factorIntensidad);
  },

  async crearSesionDesdeMatriz(sesionBase, esActivo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null, maximoForzado = null) {
    const { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo } = datos;
    const tipo = sesionBase.tipo;
    const esSimulacion = sesionBase.esSimulacion || false;
    const esRecuperacion = sesionBase.esRecuperacion || false;

    if (esSimulacion && tipo === 'largo' && (fase === 'ESPECIFICA' || fase === 'PICO')) {
      return this.crearSesionSimulacion(fase, semanaEnFase, nivel, datos, duracionExacta, maximoForzado);
    }

    if (tipo === 'series' && (nivel !== 'principiante' || fase !== 'BASE')) {
      const estructuras = ['piramide', 'rotas', 'fartlek', 'cuestas'];
      let estructura = estructuras[Math.floor(Math.random() * estructuras.length)];
      if (modalidad === 'trail' && Math.random() < 0.5) estructura = 'cuestas';
      return this.crearSesionAvanzadaSeries(estructura, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta);
    }

    return this.crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta, esRecuperacion, maximoForzado);
  },

  crearSesionSimulacion(fase, semanaEnFase, nivel, datos, duracionExacta, maximoForzado = null) {
    const { distancia, ritmoBase, fcUmbral, modalidad } = datos;
    let duracion = duracionExacta || 90;
    const maxLargo = maximoForzado != null ? maximoForzado : this.getMaximosPorTipo('largo', nivel, fase, distancia);
    duracion = Math.min(duracion, maxLargo);

    const calentamiento = Math.max(15, Math.floor(duracion * 0.15));
    const enfriamiento = Math.max(10, Math.floor(duracion * 0.1));
    let partePrincipal = duracion - calentamiento - enfriamiento;

    const bloqueRitmo = Math.min(20, Math.max(10, Math.floor(partePrincipal / 3)));
    const numBloques = Math.floor(partePrincipal / bloqueRitmo);
    const recuperacion = Math.min(5, Math.floor(bloqueRitmo * 0.3));
    let accionBloques = '';
    if (numBloques >= 2) {
      accionBloques = `${numBloques} repeticiones de ${bloqueRitmo}' a ritmo de competición (Z4), con ${recuperacion}' de recuperación activa entre series.`;
    } else {
      accionBloques = `${partePrincipal}' continuos a ritmo de competición (Z4).`;
    }

    const estructuraDetallada = `${calentamiento}' calentamiento Z1 + ${accionBloques} + ${enfriamiento}' enfriamiento Z1`;

    const pasosDetallados = [
      { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' de trote suave (Z1) + ejercicios de movilidad + 3 progresiones a ritmo objetivo`, porque: 'Preparar el cuerpo para el esfuerzo específico y activar el sistema neuromuscular.' },
      { icono: '🏁', titulo: 'SIMULACIÓN DE COMPETICIÓN', accion: accionBloques, porque: `Aclimatar al cuerpo al ritmo de carrera, practicar la estrategia de nutrición e hidratación, y ganar confianza.` },
      { icono: '🍽️', titulo: 'NUTRICIÓN E HIDRATACIÓN', accion: `Realizar una toma de gel o bebida isotónica cada 30 minutos. Probar la estrategia que usarás el día de la carrera.`, porque: 'Entrenar el estómago y evitar sorpresas el día de la competición.' },
      { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' de trote suave + estiramientos suaves`, porque: 'Reducir frecuencia cardíaca, eliminar lactato y acelerar recuperación.' }
    ];

    const detalle = {
      nombre: `Simulación de ${distancia === '10k' ? '10K' : distancia === 'medio' ? 'Media Maratón' : 'Maratón'}`,
      descripcion: `Sesión que replica las condiciones de la carrera: ritmo, nutrición y estrategia.`,
      estructura: estructuraDetallada,
      sensacion: 'Exigente pero controlado',
      zona: 'Z4 (ritmo de carrera)',
      duracion: duracion,
      ritmoObjetivo: this.obtenerRitmoParaZona('Z4'),
      fcObjetivo: '',
      calentamiento: calentamiento,
      partePrincipal: partePrincipal,
      enfriamiento: enfriamiento,
      objetivo: `Simular la competición de ${distancia === '10k' ? '10 km' : distancia === 'medio' ? '21 km' : '42 km'}`,
      porque: 'Ensaya el ritmo, la estrategia y la nutrición para maximizar el rendimiento el día de la carrera.',
      pasosDetallados: pasosDetallados
    };

    const metricas = this.calcularMetricasSesion({ tipo: 'largo', duracion, detalle }, 1.0);
    detalle.distanciaEstimada = metricas.distanciaTotal;
    detalle.tssEstimada = metricas.tssTotal;

    return { tipo: 'largo', duracion, detalle };
  },

  _distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad) {
    const ritmoSuaveSegGen = ritmoBase * 1.35 * 60;
    const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
    const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
    const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
    const zona = detalle.zona?.split('-')[0] || 'Z4';
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
    const ifactor = factoresIF[zona] || 0.9;
    const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
    return { distanciaTotal, tssTotal };
  },

  calcularMetricasSesion(sesion, factorIntensidad = 1.0) {
    if (!sesion.detalle) return { distanciaTotal: 0, tssTotal: 0 };

    const ritmoBase = AppState.planGeneradoActual?.ritmoBase || AppState.lastRitmoBase;
    const fcUmbral = AppState.planGeneradoActual?.fcUmbral || AppState.lastUL;
    if (!ritmoBase || !fcUmbral) return { distanciaTotal: 0, tssTotal: 0 };
    if (sesion.tipo === 'strength') return { distanciaTotal: 0, tssTotal: 0 };

    const detalle = sesion.detalle;

    if (detalle.tipoEstructura === 'fartlek' && detalle.segundosFuertes !== undefined && detalle.segundosSuaves !== undefined) {
      const ritmoFuerteSeg = this._ritmoToSeg(detalle.ritmoFuerte);
      const ritmoSuaveSeg = this._ritmoToSeg(detalle.ritmoSuave);
      const distanciaFuerte = (detalle.segundosFuertes / ritmoFuerteSeg);
      const distanciaSuave = (detalle.segundosSuaves / ritmoSuaveSeg);
      const distanciaPartePrincipal = distanciaFuerte + distanciaSuave;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }
    
    if (detalle.tipoEstructura === 'piramide' && detalle.distancias && detalle.ritmoSerie) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoSerie);
      let distanciaSeries = 0;
      detalle.distancias.forEach(d => distanciaSeries += d / 1000);
      const distanciaPartePrincipal = distanciaSeries;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }

    if (detalle.tipoEstructura === 'rotas' && detalle.distanciaSerie && detalle.repeticionesPorBloque && detalle.bloques) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoSerie);
      const distanciaPorSerie = detalle.distanciaSerie / 1000;
      const totalSeries = detalle.repeticionesPorBloque * detalle.bloques;
      const distanciaPartePrincipal = distanciaPorSerie * totalSeries;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }

    if (detalle.tipoEstructura === 'cuestas' && detalle.numRepeticiones) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoRepeticion);
      const tiempoTotalCuestas = detalle.numRepeticiones * detalle.duracionRepeticion;
      const distanciaPartePrincipal = tiempoTotalCuestas / ritmoSerieSeg;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }

    const zona = detalle.zona?.split('-')[0] || 'Z2';
    const factoresRitmo = { 'Z1': 1.35, 'Z2': 1.25, 'Z3': 1.15, 'Z4': 1.05, 'Z5': 0.95 };
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
    const factorRitmo = factoresRitmo[zona] || 1.25;

    const { calentamiento, enfriamiento, partePrincipal } = this._calcularCalentamientoEnfriamiento(sesion.duracion);
    const ritmoSuaveMin = ritmoBase * factoresRitmo['Z1'];
    const ritmoMin = ritmoBase * factorRitmo;
    const distanciaCalentamiento = calentamiento / ritmoSuaveMin;
    const distanciaEnfriamiento = enfriamiento / ritmoSuaveMin;
    const distanciaPartePrincipal = partePrincipal / ritmoMin;
    const distanciaTotal = distanciaCalentamiento + distanciaPartePrincipal + distanciaEnfriamiento;

    const ifactor = factoresIF[zona] || 0.7;
    const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
    return { distanciaTotal, tssTotal };
  },

  getOndulatoryFactor(semanaEnFase, fase) {
    if (fase === 'TAPER') return { intensidad: 0.6, volumen: 0.7 };
    const ciclo = (semanaEnFase + 2) % 4;
    const patron = this.ONDULACION_PATRONES[ciclo] || { intensidad: 1.0, volumen: 1.0 };
    const factorFase = this.FASES[fase];
    return {
      intensidad: patron.intensidad * factorFase.intensidad,
      volumen: patron.volumen * factorFase.volumenBase
    };
  },

  getMaximosPorTipo(tipo, nivel, fase, distancia) {
    const maxBase = {
      rodaje: { principiante: 60, intermedio: 75, avanzado: 90 },
      tempo: 75,
      series: 90,
      largo: 210
    };
    const factorFase = {
      BASE: 0.8,
      CONSTRUCCION: 0.9,
      ESPECIFICA: 1.0,
      PICO: 1.0,
      TAPER: 0.7
    };
    let max;
    if (tipo === 'rodaje') {
      max = maxBase.rodaje[nivel] || 75;
    } else {
      max = maxBase[tipo] || 90;
    }
    max = Math.round(max * factorFase[fase]);
    if (distancia === '2k') {
      if (tipo === 'largo') max = Math.min(max, 60);
      if (tipo === 'series') max = Math.min(max, 60);
      if (tipo === 'tempo') max = Math.min(max, 60);
      if (tipo === 'rodaje') max = Math.min(max, 60);
    } else if (distancia === '5k') {
      if (tipo === 'largo') max = Math.min(max, 90);
      if (tipo === 'series') max = Math.min(max, 75);
    } else if (distancia === '10k') {
      if (tipo === 'largo') max = Math.min(max, 120);
      if (tipo === 'series') max = Math.min(max, 90);
    } else if (distancia === 'medio') {
      if (tipo === 'largo') max = Math.min(max, 130);
      if (tipo === 'series') max = Math.min(max, 80);
    } else {
      if (tipo === 'largo') max = Math.min(max, 210);
      if (tipo === 'series') max = Math.min(max, 120);
    }
    return max;
  },

  ajustarDistribucionPorDistancia(baseDistribucion, distancia) {
    const nueva = JSON.parse(JSON.stringify(baseDistribucion));
    const factorSeries = distancia === '2k' || distancia === '5k' ? 1.5 : (distancia === '10k' ? 1.2 : (distancia === 'medio' ? 1.1 : 1.05));
    const factorTempo = distancia === '10k' ? 1.3 : (distancia === 'medio' ? 1.2 : (distancia === 'maraton' ? 1.15 : 1.0));
    const factorLargo = distancia === 'medio' || distancia === 'maraton' ? 1.4 : 1.0;
    const factorRodaje = distancia === 'maraton' ? 0.85 : 1.0;
    for (let nivel in nueva) {
      for (let fase in nueva[nivel]) {
        let d = nueva[nivel][fase];
        let sum = d.rodaje + d.tempo + d.series + d.largo;
        d.rodaje = (d.rodaje * factorRodaje) / sum;
        d.tempo = (d.tempo * factorTempo) / sum;
        d.series = (d.series * factorSeries) / sum;
        d.largo = (d.largo * factorLargo) / sum;
        sum = d.rodaje + d.tempo + d.series + d.largo;
        d.rodaje /= sum;
        d.tempo /= sum;
        d.series /= sum;
        d.largo /= sum;
      }
    }
    return nueva;
  },

  calcularVolumenSemanal(nivel, experiencia, objetivo, distancia) {
    const base = { principiante: 210, intermedio: 360, avanzado: 430 };
    let volumen = base[nivel] || 300;
    if (distancia === '2k') volumen = Math.round(volumen * 0.7);
    else if (distancia === '5k') volumen = Math.round(volumen * 0.85);
    if (objetivo === 'acabar') volumen = Math.round(volumen * 0.85);
    if (objetivo === 'competir') volumen = Math.round(volumen * 1.15);
    if (distancia === 'medio') volumen = Math.round(volumen * 1.1);
    if (distancia === 'maraton') volumen = Math.round(volumen * 1.2);
    if (experiencia === 'no') volumen = Math.round(volumen * 0.9);
    return Math.min(720, Math.max(120, volumen));
  },

  obtenerDiasSeleccionados() {
    const dias = [];
    for (let i = 1; i <= 7; i++) {
      const cb = document.getElementById(`dia${i}`);
      if (cb?.checked) dias.push(i);
    }
    return dias;
  },

  obtenerDiasMinimos(distancia) {
    if (distancia === 'maraton') return 4;
    if (distancia === 'medio') return 3;
    return 2;
  },

  elegirDiaLargoOptimo(diasEntreno) {
    if (diasEntreno.includes(6)) return 6;
    if (diasEntreno.includes(7)) return 7;
    return Math.max(...diasEntreno);
  },

  getColor(tipo) {
    const colores = {
      rodaje: 'sesion-rodaje',
      tempo: 'sesion-tempo',
      series: 'sesion-series',
      largo: 'sesion-largo',
      descanso: 'sesion-descanso',
      strength: 'sesion-strength'
    };
    return colores[tipo] || 'sesion-descanso';
  },

  getLetra(tipo) {
    const letras = {
      rodaje: 'R',
      tempo: 'T',
      series: 'S',
      largo: 'L',
      descanso: 'D',
      strength: 'F'
    };
    return letras[tipo] || '?';
  },

  generarFases(semanasTotales, objetivo, distancia) {
    const fases = [];
    let semanaInicio = 1;
    let duracionBase = Math.round(semanasTotales * 0.4);
    let duracionConstruccion = Math.round(semanasTotales * 0.3);
    let duracionEspecifica = Math.round(semanasTotales * 0.2);
    let duracionPico = Math.round(semanasTotales * 0.05);
    let duracionTaper = semanasTotales - duracionBase - duracionConstruccion - duracionEspecifica - duracionPico;
    if (objetivo === 'acabar') {
      duracionBase += 2;
      duracionEspecifica -= 2;
    }
    if (objetivo === 'competir') {
      duracionBase -= 2;
      duracionEspecifica += 1;
      duracionPico += 1;
    }
    const suma = duracionBase + duracionConstruccion + duracionEspecifica + duracionPico + duracionTaper;
    if (suma > semanasTotales) duracionTaper -= (suma - semanasTotales);
    else if (suma < semanasTotales) duracionEspecifica += (semanasTotales - suma);

    if (semanasTotales >= 5) {
      const taperMinimo = (objetivo === 'competir' && (distancia === 'medio' || distancia === 'maraton')) ? 2 : 1;
      let faltan = taperMinimo - duracionTaper;
      if (faltan > 0) {
        const dePico = Math.min(faltan, duracionPico);
        duracionPico -= dePico;
        faltan -= dePico;
        if (faltan > 0) {
          const deEspecifica = Math.min(faltan, Math.max(0, duracionEspecifica - 1));
          duracionEspecifica -= deEspecifica;
          faltan -= deEspecifica;
        }
        duracionTaper = taperMinimo - faltan;
      }
    }

    if (duracionBase > 0) fases.push({ nombre: 'BASE', inicio: semanaInicio, duracion: duracionBase });
    semanaInicio += duracionBase;
    if (duracionConstruccion > 0) fases.push({ nombre: 'CONSTRUCCION', inicio: semanaInicio, duracion: duracionConstruccion });
    semanaInicio += duracionConstruccion;
    if (duracionEspecifica > 0) fases.push({ nombre: 'ESPECIFICA', inicio: semanaInicio, duracion: duracionEspecifica });
    semanaInicio += duracionEspecifica;
    if (duracionPico > 0) fases.push({ nombre: 'PICO', inicio: semanaInicio, duracion: duracionPico });
    semanaInicio += duracionPico;
    if (duracionTaper > 0) fases.push({ nombre: 'TAPER', inicio: semanaInicio, duracion: duracionTaper });
    return fases;
  },

  obtenerFaseSemana(fases, semanaGlobal) {
    for (const fase of fases) {
      if (semanaGlobal >= fase.inicio && semanaGlobal < fase.inicio + fase.duracion) {
        return { fase: fase.nombre, semanaEnFase: semanaGlobal - fase.inicio + 1, duracionFase: fase.duracion };
      }
    }
    const ultimaFase = fases[fases.length - 1];
    return { fase: ultimaFase?.nombre || 'BASE', semanaEnFase: 1, duracionFase: ultimaFase?.duracion || 1 };
  },

  calcularNivelSemana(semanaGlobal, nivelInicial, semanasTotales) {
    if (nivelInicial === 'principiante') {
      if (semanaGlobal >= this.PROGRESION_NIVEL.principiante.avanzado) return 'avanzado';
      if (semanaGlobal >= this.PROGRESION_NIVEL.principiante.intermedio) return 'intermedio';
      return 'principiante';
    }
    if (nivelInicial === 'intermedio') {
      if (semanaGlobal >= this.PROGRESION_NIVEL.intermedio.avanzado) return 'avanzado';
      return 'intermedio';
    }
    return 'avanzado';
  },

  calcularNivelSemanaConFase(semanaGlobal, nivelInicial, semanasTotales, fase, nivelCongelado) {
    if (fase === 'TAPER' && nivelCongelado) return nivelCongelado;
    return this.calcularNivelSemana(semanaGlobal, nivelInicial, semanasTotales);
  },

  debeHacerSimulacion(fase, semanaGlobal, semanasTotales, distancia, nivel, objetivo) {
    if (fase !== 'ESPECIFICA' && fase !== 'PICO') return false;
    if (!['10k', 'medio', 'maraton'].includes(distancia)) return false;
    if (nivel === 'principiante') return false;
    const semanaEnFase = semanaGlobal - this.obtenerInicioFase(fase, distancia, semanasTotales, objetivo);
    return semanaEnFase % 3 === 0 && semanaEnFase >= 2 && semanaEnFase <= (fase === 'ESPECIFICA' ? 6 : 4);
  },

  obtenerInicioFase(fase, distancia, semanasTotales, objetivo) {
    const fases = this.generarFases(semanasTotales, objetivo, distancia);
    for (let f of fases) {
      if (f.nombre === fase) return f.inicio;
    }
    return 1;
  },

  seleccionarDiasFuerza(tiposPorDia, diaLargo) {
    const candidatos = [];
    for (let dia = 1; dia <= 7; dia++) {
      const sesion = tiposPorDia[dia];
      if (sesion && sesion.tipo === 'rodaje' && dia !== diaLargo) candidatos.push(dia);
    }
    if (candidatos.length < 2) {
      for (let dia = 1; dia <= 7; dia++) {
        const sesion = tiposPorDia[dia];
        if (sesion && (sesion.tipo === 'tempo' || sesion.tipo === 'series') && dia !== diaLargo) {
          if (!candidatos.includes(dia)) candidatos.push(dia);
        }
      }
    }
    if (candidatos.length < 2) {
      for (let dia = 1; dia <= 7; dia++) {
        const sesion = tiposPorDia[dia];
        if (sesion && sesion.tipo !== 'largo' && dia !== diaLargo) {
          if (!candidatos.includes(dia)) candidatos.push(dia);
        }
      }
    }
    return candidatos.slice(0, 2);
  },

  agregarFuerzaASesion(sesion) {
    if (!sesion.detalle) return;
    const fuerzaMinutos = this.DURACION_FUERZA;
    const descripcion = this.DESCRIPCIONES_FUERZA[Math.floor(Math.random() * this.DESCRIPCIONES_FUERZA.length)];
    sesion.detalle.estructura += ` + ${fuerzaMinutos}' fuerza complementaria (${descripcion.nombre})`;
    const pasoFuerza = {
      icono: '🏋️',
      titulo: `FUERZA COMPLEMENTARIA: ${descripcion.nombre}`,
      accion: `${fuerzaMinutos}' de ejercicios de fuerza: ${descripcion.ejercicios}`,
      porque: descripcion.objetivo
    };
    sesion.detalle.pasosDetallados.push(pasoFuerza);
    sesion.tieneFuerza = true;
  },

  _ajustarDiaPostLargo(tiposPorDia, diaLargo, diasEntreno) {
    const diaSiguiente = diaLargo === 7 ? 1 : diaLargo + 1;
    if (diasEntreno.includes(diaSiguiente) && tiposPorDia[diaSiguiente]) {
      const sesion = tiposPorDia[diaSiguiente];
      if (sesion.tipo !== 'descanso') {
        sesion.tipo = 'rodaje';
        sesion.minutos = 25;
        sesion.esRecuperacion = true;
      }
    }
  },

  _calcularDuracionLargoFinal(minutosPlanificados, duracionesOtrasSesiones, nivel, fase, distancia) {
    const maxOtras = duracionesOtrasSesiones.length ? Math.max(...duracionesOtrasSesiones) : 0;
    let duracion = Math.max(minutosPlanificados, maxOtras > 0 ? maxOtras + 5 : 0);
    const maxLargoNormal = this.getMaximosPorTipo('largo', nivel, fase, distancia);
    const techoSeguridad = Math.round(maxLargoNormal * 1.15);
    return Math.min(duracion, techoSeguridad);
  },

  _mejorarDistribucionCalidad(tiposPorDia, diasEntreno, diaLargo) {
    const diasCalidad = [];
    for (let dia of diasEntreno) {
      const sesion = tiposPorDia[dia];
      if (sesion && (sesion.tipo === 'tempo' || sesion.tipo === 'series')) {
        diasCalidad.push({ dia, tipo: sesion.tipo, minutos: sesion.minutos });
      }
    }
    
    for (let i = 0; i < diasCalidad.length - 1; i++) {
      const actual = diasCalidad[i].dia;
      const siguiente = diasCalidad[i+1].dia;
      if (siguiente === actual + 1 || (actual === 7 && siguiente === 1)) {
        let nuevoDia = null;
        for (let d = actual + 1; d <= diaLargo; d++) {
          if (!tiposPorDia[d] && diasEntreno.includes(d)) {
            nuevoDia = d;
            break;
          }
        }
        if (nuevoDia) {
          tiposPorDia[nuevoDia] = tiposPorDia[siguiente];
          delete tiposPorDia[siguiente];
        } else {
          tiposPorDia[siguiente].tipo = 'rodaje';
          tiposPorDia[siguiente].minutos = 30;
        }
      }
    }
    
    for (let diaCalidad of diasCalidad) {
      if (diaCalidad.dia > diaLargo) {
        let nuevoDia = null;
        for (let d = 1; d < diaLargo; d++) {
          if (!tiposPorDia[d] && diasEntreno.includes(d)) {
            nuevoDia = d;
            break;
          }
        }
        if (nuevoDia) {
          tiposPorDia[nuevoDia] = tiposPorDia[diaCalidad.dia];
          delete tiposPorDia[diaCalidad.dia];
        }
      }
    }
  },

  _diaDescanso(diaGlobal, semanaGlobal, diaSemana, fase, nivel) {
    return {
      diaGlobal, semana: semanaGlobal, diaSemana, fase, nivel,
      tipo: 'descanso',
      color: this.getColor('descanso'),
      letra: this.getLetra('descanso'),
      detalle: null,
      tieneFuerza: false
    };
  },

  DURACION_NATIVA_REFERENCIA: {
    largo:  { '2k': 40, '5k': 60, '10k': 80, medio: 95, maraton: 140 },
    tempo:  { '2k': 30, '5k': 40, '10k': 48, medio: 52, maraton: 60 },
    series: { '2k': 32, '5k': 42, '10k': 48, medio: 52, maraton: 58 }
  },
  DURACION_NATIVA_FACTOR_NIVEL: {
    principiante: 0.78,
    intermedio: 1.00,
    avanzado: 1.18
  },

  _duracionNativaPorDistancia(tipo, nivel, distancia, volumenOnd) {
    const tabla = this.DURACION_NATIVA_REFERENCIA[tipo];
    const base = tabla[distancia] ?? tabla.medio;
    const factorNivel = this.DURACION_NATIVA_FACTOR_NIVEL[nivel] ?? 1;
    let ondaAmortiguada = 1 + (volumenOnd - 1) * 0.5;
    ondaAmortiguada = Math.max(0.65, Math.min(1.3, ondaAmortiguada));
    return Math.round(base * factorNivel * ondaAmortiguada);
  },

  async generarCalendarioEntreno() {
    if (!AppState.zonasCalculadas) {
      Utils.showToast("> PRIMERO CALCULA TUS ZONAS_", 'error');
      return;
    }
    if (!AppState.isPremium) {
      Utils.showToast("> SOLO USUARIOS PREMIUM_", 'error');
      return;
    }
    try {
      Utils.showLoading('GENERANDO');
      AppState.feedbackSesiones = {};

      const modalidad = document.getElementById("modalidad").value;
      const distancia = document.getElementById("distObjetivo").value;
      const meses = parseInt(document.getElementById("duracionPlan").value);
      let nivel = document.getElementById("nivel").value;
      const experiencia = document.getElementById("experienciaDistancia").value;
      const objetivo = document.getElementById("objetivoPrincipal").value;

      const diasEntreno = this.obtenerDiasSeleccionados();
      let diaLargo = parseInt(document.getElementById("diaLargo").value);
      if (isNaN(diaLargo) || document.getElementById("diaLargo").value === 'auto') {
        diaLargo = this.elegirDiaLargoOptimo(diasEntreno);
      }
      if (!diasEntreno.includes(diaLargo)) {
        Utils.showToast(`⚠️ El día de tirada larga (${["", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"][diaLargo]}) no está marcado como día de entrenamiento.`, 'error');
        Utils.hideLoading();
        return;
      }
      if (nivel === 'avanzado' && diasEntreno.length < 5) {
        Utils.showToast("> NIVEL AVANZADO REQUIERE MÍNIMO 5 DÍAS DE ENTRENO_", 'error');
        Utils.hideLoading();
        return;
      }
      if (diasEntreno.length === 0) {
        Utils.showToast("> SELECCIONA AL MENOS UN DÍA_", 'error');
        Utils.hideLoading();
        return;
      }
      const diasMinimos = this.obtenerDiasMinimos(distancia);
      if (diasEntreno.length < diasMinimos) {
        const etiquetaDistancia = {
          '2k': '2KM', '5k': '5KM', '10k': '10KM',
          'medio': 'MEDIA MARATÓN', 'maraton': 'MARATÓN'
        }[distancia] || distancia.toUpperCase();
        Utils.showToast(`> PARA ${etiquetaDistancia} NECESITAS MÍNIMO ${diasMinimos} DÍAS_`, 'error');
        Utils.hideLoading();
        return;
      }
      if (meses === 1 && !['2k', '5k', '10k'].includes(distancia)) {
        Utils.showToast("> PLAN DE 1 MES SOLO PARA 2KM, 5KM Y 10KM_", 'error');
        Utils.hideLoading();
        return;
      }
      if (['medio', 'maraton'].includes(distancia) && meses === 3 && experiencia === 'no') {
        Utils.showToast("> PARA MEDIA O MARATÓN EN 3 MESES NECESITAS EXPERIENCIA_", 'error');
        Utils.hideLoading();
        return;
      }

      const semanasTotales = meses * 4;
      const fases = this.generarFases(semanasTotales, objetivo, distancia);
      const ritmoBase = AppState.lastRitmoBase;
      const fcUmbral = AppState.lastUL;

      const ahora = new Date();
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() + 1);
      fechaInicio.setHours(0, 0, 0, 0);
      const diaInicioSemana = ((fechaInicio.getDay() + 6) % 7) + 1;

      const distribucionPersonalizada = this.ajustarDistribucionPorDistancia(this.DISTRIBUCION_TIPOS, distancia);

      const planCompleto = [];
      let diaGlobalCounter = 1;

      let ajusteVolumen = 1.0;
      let ajusteIntensidad = 1.0;
      if (AppState.planActualId) {
        const ajustes = await this.analizarFeedbackAdaptativo();
        ajusteVolumen = ajustes.volumen;
        ajusteIntensidad = ajustes.intensidad;
      }

      try {
        const carga = await this.calcularCargaEntrenamiento(AppState.currentUserId);
        if (carga && carga.datosSuficientes && carga.acwr !== null) {
          if (carga.acwr > 1.5) {
            ajusteVolumen *= 0.85;
            ajusteIntensidad *= 0.9;
            Utils.showToast(`⚠️ Carga aguda:crónica alta (ACWR ${carga.acwr.toFixed(2)}) — moderamos las próximas semanas para reducir el riesgo de lesión.`, 'warning', 4500);
          } else if (carga.acwr > 1.3) {
            ajusteVolumen *= 0.95;
            ajusteIntensidad *= 0.97;
          } else if (carga.acwr < 0.8) {
            ajusteVolumen *= 1.05;
          }
        }
      } catch (e) {
        console.warn('No se pudo calcular ACWR para ajustar el plan (se sigue solo con el feedback):', e);
      }

      this.ultimaSesionPorTipo = {};
      this.bolsaPorTipo = {};
      let nivelAntesDeTaper = null;

      for (let semanaGlobal = 1; semanaGlobal <= semanasTotales; semanaGlobal++) {
        const faseInfo = this.obtenerFaseSemana(fases, semanaGlobal);
        const { fase, semanaEnFase, duracionFase } = faseInfo;
        const nivelActual = this.calcularNivelSemanaConFase(semanaGlobal, nivel, semanasTotales, fase, nivelAntesDeTaper);
        if (fase !== 'TAPER') nivelAntesDeTaper = nivelActual;

        const { intensidad: intensidadOnd, volumen: volumenOnd } = this.getOndulatoryFactor(semanaEnFase, fase);
        const volumenSemanaPuro = this.calcularVolumenSemanal(nivelActual, experiencia, objetivo, distancia);
        let volumenSemanaBase = Math.round(volumenSemanaPuro * volumenOnd * ajusteVolumen);
        let volumenSemana = Math.round(volumenSemanaBase);
        const TECHO_SUAVE = 650;
        const TECHO_DURO = 780;
        if (volumenSemana > TECHO_SUAVE) {
          volumenSemana = Math.round(TECHO_SUAVE + (volumenSemana - TECHO_SUAVE) * 0.35);
        }
        const pisoMinimo = Math.max(90, Math.round(volumenSemanaPuro * 0.35));
        volumenSemana = Math.min(TECHO_DURO, Math.max(pisoMinimo, volumenSemana));

        const intensidadTotal = ajusteIntensidad * intensidadOnd;

        const distribucion = distribucionPersonalizada[nivelActual][fase.toLowerCase()];
        let minutosPorTipo = {
          rodaje: 0,
          tempo: distribucion.tempo > 0 ? this._duracionNativaPorDistancia('tempo', nivelActual, distancia, volumenOnd) : 0,
          series: distribucion.series > 0 ? this._duracionNativaPorDistancia('series', nivelActual, distancia, volumenOnd) : 0,
          largo: distribucion.largo > 0 ? this._duracionNativaPorDistancia('largo', nivelActual, distancia, volumenOnd) : 0
        };
        const presupuestoCalidadYLargo = Math.round(volumenSemana * 0.75);
        const sumaCalidadYLargo = minutosPorTipo.tempo + minutosPorTipo.series + minutosPorTipo.largo;
        if (sumaCalidadYLargo > presupuestoCalidadYLargo && sumaCalidadYLargo > 0) {
          const factorAjuste = presupuestoCalidadYLargo / sumaCalidadYLargo;
          minutosPorTipo.tempo = Math.round(minutosPorTipo.tempo * factorAjuste);
          minutosPorTipo.series = Math.round(minutosPorTipo.series * factorAjuste);
          minutosPorTipo.largo = Math.round(minutosPorTipo.largo * factorAjuste);
        }

        const LIMITE_DURO_8020 = 0.22;
        const presupuestoDuro = Math.round(volumenSemana * LIMITE_DURO_8020);
        const sumaDura = minutosPorTipo.tempo + minutosPorTipo.series;
        if (sumaDura > presupuestoDuro && sumaDura > 0) {
          const minSesionCalidad = this._minimoDuracionSesion(nivelActual, fase === 'TAPER');
          const factor8020 = presupuestoDuro / sumaDura;
          if (minutosPorTipo.tempo > 0) {
            minutosPorTipo.tempo = Math.max(minSesionCalidad, Math.round(minutosPorTipo.tempo * factor8020));
          }
          if (minutosPorTipo.series > 0) {
            minutosPorTipo.series = Math.max(minSesionCalidad, Math.round(minutosPorTipo.series * factor8020));
          }
        }

        minutosPorTipo.rodaje = Math.max(0, volumenSemana - minutosPorTipo.tempo - minutosPorTipo.series - minutosPorTipo.largo);

        let suma = minutosPorTipo.rodaje + minutosPorTipo.tempo + minutosPorTipo.series + minutosPorTipo.largo;
        if (suma !== volumenSemana) {
          const diff = volumenSemana - suma;
          minutosPorTipo.rodaje = Math.max(0, minutosPorTipo.rodaje + diff);
        }

        const minSeries = this._minimoDuracionSesion(nivelActual, fase === 'TAPER');
        if (minutosPorTipo.series < minSeries && minutosPorTipo.series > 0) {
          const deficit = minSeries - minutosPorTipo.series;
          minutosPorTipo.series = minSeries;
          minutosPorTipo.rodaje = Math.max(0, minutosPorTipo.rodaje - deficit);
        }

        const tiposPorDia = {};
        const diasDisponibles = [...diasEntreno];
        
        if (minutosPorTipo.largo > 0) {
          let largoMinimo = 45;
          if (fase === 'CONSTRUCCION') largoMinimo = 60;
          if (fase === 'ESPECIFICA' || fase === 'PICO') largoMinimo = 90;
          if (minutosPorTipo.largo < largoMinimo) minutosPorTipo.largo = largoMinimo;
          const maxLargo = this.getMaximosPorTipo('largo', nivelActual, fase, distancia);
          minutosPorTipo.largo = Math.min(minutosPorTipo.largo, maxLargo);
          const esSimulacion = this.debeHacerSimulacion(fase, semanaGlobal, semanasTotales, distancia, nivelActual, objetivo);
          tiposPorDia[diaLargo] = { tipo: 'largo', minutos: minutosPorTipo.largo, esSimulacion };
          const index = diasDisponibles.indexOf(diaLargo);
          if (index > -1) diasDisponibles.splice(index, 1);
        }

        const FASES_ORDEN = { BASE: 0, CONSTRUCCION: 1, ESPECIFICA: 2, PICO: 3, TAPER: 4 };
        const indiceFase = FASES_ORDEN[fase] ?? 0;
        const alternarOrdenCalidad = indiceFase % 2 === 1;
        const tiposCalidad = [];
        if (alternarOrdenCalidad) {
          if (minutosPorTipo.series > 0) tiposCalidad.push({ tipo: 'series', minutos: minutosPorTipo.series });
          if (minutosPorTipo.tempo > 0) tiposCalidad.push({ tipo: 'tempo', minutos: minutosPorTipo.tempo });
        } else {
          if (minutosPorTipo.tempo > 0) tiposCalidad.push({ tipo: 'tempo', minutos: minutosPorTipo.tempo });
          if (minutosPorTipo.series > 0) tiposCalidad.push({ tipo: 'series', minutos: minutosPorTipo.series });
        }
        
        let diasLibres = [...diasDisponibles];
        let ajusteJitterCalidad = 0;
        if (diasLibres.length > 1) {
          const offsetFase = indiceFase % diasLibres.length;
          diasLibres = [...diasLibres.slice(offsetFase), ...diasLibres.slice(0, offsetFase)];
        }
        if (tiposCalidad.length > 0 && diasLibres.length > 0) {
          const numCalidad = Math.min(tiposCalidad.length, diasLibres.length);
          let step = Math.floor(diasLibres.length / numCalidad);
          if (step < 1) step = 1;
          let indicesAsignados = [];
          for (let i = 0; i < numCalidad; i++) {
            let idx = Math.min(i * step, diasLibres.length - 1);
            if (i > 0 && idx === indicesAsignados[i-1] + 1 && diasLibres.length > numCalidad) {
              idx = Math.min(idx + 1, diasLibres.length - 1);
            }
            indicesAsignados.push(idx);
          }
          indicesAsignados.sort((a,b) => a - b);
          for (let i = 0; i < numCalidad; i++) {
            const dia = diasLibres[indicesAsignados[i]];
            const calidad = tiposCalidad[i];
            const max = this.getMaximosPorTipo(calidad.tipo, nivelActual, fase, distancia);
            const minutosBase = Math.min(calidad.minutos, max);
            const variacionCalidad = 0.92 + Math.random() * 0.16;
            let minutosDia = Math.round(minutosBase * variacionCalidad);
            minutosDia = (minutosDia > max)
              ? Math.round(max * (0.93 + Math.random() * 0.07))
              : Math.max(20, minutosDia);
            tiposPorDia[dia] = { tipo: calidad.tipo, minutos: minutosDia };
            ajusteJitterCalidad += (minutosDia - minutosBase);
            calidad.minutos -= minutosBase;
          }
          diasLibres = diasLibres.filter((_, idx) => !indicesAsignados.includes(idx));
        }

        let minutosRodajeTotal = minutosPorTipo.rodaje - ajusteJitterCalidad;
        tiposCalidad.forEach(q => { if (q.minutos > 0) minutosRodajeTotal += q.minutos; });
        const numDiasRodaje = diasLibres.length;
        if (numDiasRodaje > 0 && minutosRodajeTotal > 0) {
          const maxRodaje = this.getMaximosPorTipo('rodaje', nivelActual, fase, distancia);
          const minRodaje = 35;
          const numDias = diasLibres.length;
          const techosSuaves = Array.from({ length: numDias }, () => Math.round(maxRodaje * (0.93 + Math.random() * 0.07)));
          let valores = [];
          let sumaValores = 0;
          let valorBase = minutosRodajeTotal / numDias;
          for (let i = 0; i < numDias; i++) {
            let variacion = 0.9 + Math.random() * 0.2;
            let valor = Math.round(valorBase * variacion);
            valor = Math.max(minRodaje, Math.min(techosSuaves[i], valor));
            valores.push(valor);
            sumaValores += valor;
          }
          if (sumaValores !== minutosRodajeTotal) {
            const diff = minutosRodajeTotal - sumaValores;
            const signo = Math.sign(diff);
            for (let i = 0; i < Math.abs(diff); i++) {
              let idx = i % valores.length;
              const nuevoValor = valores[idx] + signo;
              if (signo > 0 && nuevoValor > techosSuaves[idx]) continue;
              valores[idx] = Math.max(minRodaje, Math.min(techosSuaves[idx], nuevoValor));
            }
          }
          for (let i = 0; i < numDias; i++) {
            const dia = diasLibres[i];
            tiposPorDia[dia] = { tipo: 'rodaje', minutos: valores[i] };
          }
        } else {
          for (let i = 0; i < numDiasRodaje; i++) {
            const dia = diasLibres[i];
            tiposPorDia[dia] = { tipo: 'rodaje', minutos: 35 };
          }
        }

        for (let dia of diasLibres) {
          if (!tiposPorDia[dia]) {
            tiposPorDia[dia] = { tipo: 'rodaje', minutos: 35 };
          }
        }

        this._ajustarDiaPostLargo(tiposPorDia, diaLargo, diasEntreno);
        this._mejorarDistribucionCalidad(tiposPorDia, diasEntreno, diaLargo);

        const diasFuerza = this.seleccionarDiasFuerza(tiposPorDia, diaLargo);

        const sesionesPorDia = {};
        for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
          if (diaSemana === diaLargo) continue;
          if (!diasEntreno.includes(diaSemana) || !tiposPorDia[diaSemana]) {
            sesionesPorDia[diaSemana] = { esDescanso: true };
            continue;
          }
          const { tipo, minutos, esSimulacion, esRecuperacion } = tiposPorDia[diaSemana];
          const sesion = await this.crearSesionDesdeMatriz(
            { tipo, esSimulacion: esSimulacion || false, esRecuperacion: esRecuperacion || false },
            true,
            fase,
            semanaEnFase,
            nivelActual,
            { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo },
            ajusteVolumen,
            intensidadTotal,
            minutos
          );
          sesionesPorDia[diaSemana] = {
            diaSemana, fase, tipo,
            color: this.getColor(tipo),
            letra: this.getLetra(tipo),
            tieneFuerza: false,
            ...sesion
          };
        }

        const infoLargo = tiposPorDia[diaLargo];
        if (infoLargo) {
          const duracionesOtrasSesiones = Object.values(sesionesPorDia)
            .filter(s => !s.esDescanso && s.duracion)
            .map(s => s.duracion);
          const duracionFinalLargo = this._calcularDuracionLargoFinal(
            infoLargo.minutos, duracionesOtrasSesiones, nivelActual, fase, distancia
          );
          const sesionLargo = await this.crearSesionDesdeMatriz(
            { tipo: 'largo', esSimulacion: infoLargo.esSimulacion || false, esRecuperacion: false },
            true,
            fase,
            semanaEnFase,
            nivelActual,
            { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo },
            ajusteVolumen,
            intensidadTotal,
            duracionFinalLargo,
            duracionFinalLargo
          );
          sesionesPorDia[diaLargo] = {
            diaSemana: diaLargo, fase, tipo: 'largo',
            color: this.getColor('largo'),
            letra: this.getLetra('largo'),
            tieneFuerza: false,
            ...sesionLargo
          };
        } else {
          sesionesPorDia[diaLargo] = { esDescanso: true };
        }

        const semana = [];
        for (let i = 0; i < 7; i++) {
          const diaSemana = ((diaInicioSemana - 1 + i) % 7) + 1;
          const s = sesionesPorDia[diaSemana];
          if (s.esDescanso) {
            semana.push(this._diaDescanso(diaGlobalCounter++, semanaGlobal, diaSemana, fase, nivelActual));
          } else {
            semana.push({ diaGlobal: diaGlobalCounter++, semana: semanaGlobal, nivel: nivelActual, ...s });
          }
        }

        for (const dia of diasFuerza) {
          const sesion = semana.find(s => s.diaSemana === dia && s.tipo !== 'descanso');
          if (sesion && sesion.detalle) {
            this.agregarFuerzaASesion(sesion);
          }
        }

        planCompleto.push(...semana);
      }

      const planId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const mapaDist = { "2k": "2 km", "5k": "5 km", "10k": "10 km", "medio": "MEDIA", "maraton": "MARATÓN" };

      const planParaGuardar = {
        params: {
          modalidad, distancia, duracion: meses,
          diasPorSemana: diasEntreno.length,
          nivel, experiencia, objetivo, diaLargo,
          diasEntreno, planId,
          ritmoBase: AppState.lastRitmoBase,
          fcMax: AppState.lastFC,
          fcUmbral: AppState.lastUL,
          fechaInicio: fechaInicio.toISOString()
        },
        sesiones: planCompleto,
        feedback: {},
        ajustes: {},
        nombrePlan: mapaDist[distancia] || 'Mi plan',
        resumen: `${mapaDist[distancia] || distancia} · ${diasEntreno.length} días · Nivel ${nivel}`,
        fechaCreacion: new Date().toISOString()
      };

      await this.guardarPlanEnFirebase(planId, planParaGuardar);

      AppState.planGeneradoActual = planParaGuardar.params;
      AppState.planActualId = planId;
      AppState.sesionesRealizadas = {};
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;

      const nombreDiaLargo = ["", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][diaLargo];
      const nombreDiaInicio = ["", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][diaInicioSemana];
      const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      document.getElementById("resumenObjetivo").innerHTML = `
        <strong>${mapaDist[distancia]}</strong> · ${diasEntreno.length} DÍAS/SEMANA<br>
        <span style="color: var(--text-secondary); font-size: 13px;">
          ${nivel.toUpperCase()} · OBJ: ${objetivo.toUpperCase()} · 
          🏆 TIRADA LARGA: <strong>${nombreDiaLargo}</strong>
        </span>
        <div style="margin-top: 8px; font-size: 12px; color: var(--accent-yellow);">
          📅 El plan comienza el <strong>${fechaInicioFormateada}</strong> (${nombreDiaInicio})
        </div>
      `;
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planParaGuardar.nombrePlan;

      document.getElementById("calendarioEntreno").style.display = "block";
      document.getElementById("cuestionarioEntreno").style.display = "none";

      this.mostrarCalendario(planCompleto);
      Utils.scrollToElement('calendarioEntreno', -20);
      Utils.showToast('✅ PLAN GENERADO', 'success');

    } catch (error) {
      console.error('Error:', error);
      Utils.showToast(error.message || 'Error al generar plan', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async guardarPlanEnFirebase(planId, planData) {
    if (!AppState.currentUserId) return;
    try {
      const dataToSave = { ...planData, sesionesRealizadas: {} };
      await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(planId)
        .set(dataToSave);
      await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .update({ ultimoPlanId: planId });
    } catch (error) {
      console.error('Error guardando plan:', error);
      Utils.showToast('Error al guardar el plan', 'error');
    }
  },

  async recalcularDistanciasPlanActual(silencioso = false) {
    if (!AppState.currentUserId || !AppState.planActualId) {
      if (!silencioso) Utils.showToast('No hay un plan activo que recalcular', 'info');
      return;
    }
    try {
      if (!silencioso) Utils.showLoading('Comprobando distancias del plan...');
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) { if (!silencioso) Utils.hideLoading(); return; }

      const planData = planDoc.data();
      const sesiones = planData.sesiones || [];
      let cambios = 0;
      sesiones.forEach(s => {
        if (!s || s.tipo === 'descanso' || !s.detalle) return;
        const metricas = this.calcularMetricasSesion({ tipo: s.tipo, duracion: s.duracion, detalle: s.detalle }, 1.0);
        const distNueva = Math.round((metricas.distanciaTotal || 0) * 100) / 100;
        if (Math.abs(distNueva - (s.detalle.distanciaEstimada || 0)) > 0.005) {
          s.detalle.distanciaEstimada = distNueva;
          cambios++;
        }
      });

      if (cambios > 0) await planRef.update({ sesiones });
      if (!silencioso) {
        Utils.hideLoading();
        Utils.showToast(cambios > 0 ? `✅ ${cambios} sesiones actualizadas` : 'Tu plan ya estaba al día', 'success');
      }

      if (cambios > 0 && typeof this.mostrarCalendario === 'function') {
        this.mostrarCalendario(sesiones);
      }
    } catch (error) {
      console.error('Error recalculando distancias del plan:', error);
      if (!silencioso) {
        Utils.hideLoading();
        Utils.showToast('Error al recalcular el plan', 'error');
      }
    }
  },

  // ==================== FUNCIÓN MODIFICADA: mostrarCalendario ====================
  // Asegura que sesiones esté ordenado por diaGlobal para que el índice coincida.
  mostrarCalendario(sesiones) {
    const grid = document.getElementById("calendarioGrid");
    const navegacion = document.getElementById("calendarioNavegacion");
    if (!grid) return;

    // 🔥 ORDENAR SESIONES POR DIA GLOBAL
    if (sesiones && sesiones.length > 0) {
      sesiones = sesiones.slice().sort((a, b) => (a.diaGlobal || 0) - (b.diaGlobal || 0));
    }

    const fechaInicioStr = AppState.planGeneradoActual?.fechaInicio;
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    this._fechaInicioPlan = fechaInicio;
    this._sesionesActuales = sesiones;

    this._sesionesPorFecha = {};
    this._sesionesPorDiaGlobal = {};
    let ultimoDiaGlobal = 0;
    sesiones.forEach(s => {
      if (!s || !s.diaGlobal) return;
      const f = new Date(fechaInicio);
      f.setDate(f.getDate() + (s.diaGlobal - 1));
      this._sesionesPorFecha[this._dateKey(f)] = s;
      this._sesionesPorDiaGlobal[s.diaGlobal] = s;
      if (s.diaGlobal > ultimoDiaGlobal) ultimoDiaGlobal = s.diaGlobal;
    });
    const fechaFinPlan = new Date(fechaInicio);
    fechaFinPlan.setDate(fechaFinPlan.getDate() + Math.max(ultimoDiaGlobal - 1, 0));
    this._fechaFinPlan = fechaFinPlan;

    if (!AppState.calendarioMesActual) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const dentroDelPlan = hoy >= fechaInicio && hoy <= fechaFinPlan;
      const base = dentroDelPlan ? hoy : fechaInicio;
      AppState.calendarioMesActual = new Date(base.getFullYear(), base.getMonth(), 1).toISOString();
    }

    navegacion.style.display = 'flex';
    this.renderizarMes();
    this.renderizarWidgetCarga().catch(err => console.warn('Error mostrando carga de entrenamiento:', err));

    const msgAnterior = document.querySelector('.premium-expired-message');
    if (msgAnterior) msgAnterior.remove();
  },

  _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // ==================== FUNCIÓN MODIFICADA: renderizarMes ====================
  // Recorre this._sesionesActuales (ordenado) para pintar el mes; la
  // búsqueda de sesión por celda usa _sesionesPorFecha/_sesionesPorDiaGlobal
  // (por VALOR de diaGlobal), nunca por posición dentro del array.
  renderizarMes() {
    const grid = document.getElementById("calendarioGrid");
    if (!grid || !AppState.calendarioMesActual) return;
    const mes = new Date(AppState.calendarioMesActual);
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7;
    const totalDiasMes = ultimoDiaMes.getDate();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const sesiones = this._sesionesActuales || [];

    let html = '';
    for (let i = 0; i < primerDiaSemana; i++) {
      html += '<div class="calendario-dia calendario-dia-vacio"></div>';
    }
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const fecha = new Date(year, month, dia);
      const key = this._dateKey(fecha);
      const sesion = this._sesionesPorFecha[key];
      const esHoy = fecha.getTime() === hoy.getTime() ? ' hoy' : '';

      if (!sesion) {
        const dentroDelPlan = this._fechaInicioPlan && this._fechaFinPlan
          && fecha >= this._fechaInicioPlan && fecha <= this._fechaFinPlan;
        html += `<div class="calendario-dia calendario-dia-vacio${dentroDelPlan ? ' sesion-descanso' : ''}${esHoy}"><div class="dia-numero">${dia}</div></div>`;
        continue;
      }

      const yaRealizada = !!AppState.sesionesRealizadas?.[sesion.diaGlobal];
      const esPerdida = !yaRealizada && sesion.tipo !== 'descanso' && fecha < hoy;
      const realizada = yaRealizada ? 'realizado' : (esPerdida ? 'perdida' : '');
      let faseColor = '';
      if (sesion.fase && this.FASES[sesion.fase]) faseColor = this.FASES[sesion.fase].color;
      const faseIndicator = faseColor ? ` style="border-top: 4px solid ${faseColor};"` : '';
      let contenidoHtml = `<div class="dia-numero">${dia}</div>`;
      if (sesion.tipo !== 'descanso' && sesion.detalle) {
        const tiempo = sesion.duracion || '?';
        let letra = sesion.letra;
        if (sesion.tieneFuerza) letra += '+F';
        contenidoHtml += `<strong>${Utils.escapeHTML(letra)}</strong><div>${tiempo}'</div>`;
      } else {
        contenidoHtml += `<strong>D</strong><div>—</div>`;
      }
      html += `<div class="calendario-dia ${sesion.color} ${realizada}${esHoy}" data-dia-global="${sesion.diaGlobal}"${faseIndicator}>${contenidoHtml}</div>`;
    }

    grid.innerHTML = html;
    this.agregarLeyendaFases();

    const tituloEl = document.getElementById('calendarioMesTitulo');
    if (tituloEl) {
      const nombreMes = mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      tituloEl.textContent = nombreMes.toUpperCase();
    }
    const anteriorBtn = document.getElementById('calendarioAnterior');
    const siguienteBtn = document.getElementById('calendarioSiguiente');
    const paginaSpan = document.getElementById('calendarioPagina');
    if (paginaSpan) paginaSpan.style.display = 'none';
    if (anteriorBtn && this._fechaInicioPlan) {
      const limiteAnterior = new Date(this._fechaInicioPlan.getFullYear(), this._fechaInicioPlan.getMonth(), 1);
      anteriorBtn.disabled = primerDiaMes <= limiteAnterior;
    }
    if (siguienteBtn && this._fechaFinPlan) {
      const limiteSiguiente = new Date(this._fechaFinPlan.getFullYear(), this._fechaFinPlan.getMonth(), 1);
      siguienteBtn.disabled = primerDiaMes >= limiteSiguiente;
    }

    // 🔥 LISTENER CORREGIDO (v2.66): busca la sesión por su diaGlobal real
    // (this._sesionesPorDiaGlobal), NO por posición dentro del array
    // this._sesionesActuales. Usar "diaGlobal - 1" como índice de array
    // asumía que diaGlobal iba siempre correlativo sin huecos (1,2,3,4,5...),
    // lo cual es cierto en un plan generado por el propio PlanGenerator,
    // pero NO en un plan personalizado construido a partir de invitaciones
    // sueltas del admin (session-invites.js): si algún día de la semana no
    // se envía (o llega en otro orden), el array queda con huecos en la
    // secuencia de diaGlobal y la posición deja de coincidir con el valor
    // -- por eso al pulsar una sesión (ej. series del miércoles) se abría
    // el modal de OTRA sesión distinta (ej. el descanso del jueves).
    document.querySelectorAll('.calendario-dia[data-dia-global]').forEach(diaEl => {
      diaEl.addEventListener('click', (e) => {
        const diaGlobal = parseInt(e.currentTarget.dataset.diaGlobal);
        const sesion = this._sesionesPorDiaGlobal[diaGlobal];
        if (sesion) this.abrirDetalleSesion(sesion, diaGlobal);
        else console.warn('No se encontró sesión para el día', diaGlobal);
      });
    });
  },

  agregarLeyendaFases() {
    const contenedor = document.querySelector('.calendario-navegacion');
    if (!contenedor) return;
    if (document.getElementById('leyenda-fases')) return;
    const leyenda = document.createElement('div');
    leyenda.id = 'leyenda-fases';
    leyenda.style.cssText = 'display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 11px; flex-wrap: wrap;';
    for (const [fase, datos] of Object.entries(this.FASES)) {
      const item = document.createElement('span');
      item.innerHTML = `<span style="display:inline-block; width:12px; height:12px; background-color:${datos.color}; margin-right:4px;"></span> ${datos.nombre}`;
      leyenda.appendChild(item);
    }
    contenedor.parentNode.insertBefore(leyenda, contenedor.nextSibling);
  },

  async cambiarTrimestre(delta) {
    if (!AppState.calendarioMesActual) return;
    const actual = new Date(AppState.calendarioMesActual);
    const nuevo = new Date(actual.getFullYear(), actual.getMonth() + delta, 1);
    AppState.calendarioMesActual = nuevo.toISOString();
    this.renderizarMes();
    if (window.UI) UI.guardarEstado();
  },

  // ==================== FUNCIÓN abrirDetalleSesion ====================
  abrirDetalleSesion(sesion, diaIndex) {
    console.log('abrirDetalleSesion llamado', sesion, diaIndex);
    if (!sesion) {
      console.error('Sesión no encontrada para índice', diaIndex);
      return;
    }
    if (!AppState.puedeVerDetalleSesion()) {
      if (window.showPremiumBenefits) showPremiumBenefits();
      else Utils.showToast('⭐ Premium necesario para ver detalles de sesiones', 'warning');
      return;
    }
    AppState.currentSesionDetalle = { sesion, diaIndex, planId: AppState.planActualId };
    const modal = document.getElementById("detalleSesion");
    const overlay = document.getElementById("modalOverlay");
    const wrapper = document.getElementById("modalColorWrapper");
    const titulo = document.getElementById("tituloSesion");
    const descripcion = document.getElementById("descripcionSesion");
    const checkboxContainer = document.getElementById("sesionCheckboxContainer");
    const checkbox = document.getElementById("sesionRealizada");
    const feedbackContainer = document.getElementById("sesionFeedbackContainer");
    if (modal) modal.scrollTop = 0;
    if (wrapper) wrapper.scrollTop = 0;
    wrapper.className = "modal-content";

    if (sesion.tipo !== 'descanso' && sesion.detalle) {
      wrapper.classList.add(sesion.color);
      let icono = "";
      if (sesion.tipo === 'rodaje') icono = "🏃‍♂️";
      else if (sesion.tipo === 'tempo') icono = "⚡";
      else if (sesion.tipo === 'series') icono = "🔁";
      else if (sesion.tipo === 'largo') icono = "📏";
      else if (sesion.tipo === 'strength') icono = "💪";
      const faseTexto = sesion.fase ? ` · ${this.FASES[sesion.fase]?.nombre || sesion.fase}` : '';
      titulo.innerText = `${icono} ${sesion.tipo.toUpperCase()}${faseTexto}: ${sesion.detalle.nombre}`;

      const metricas = {
        distanciaTotal: sesion.detalle.distanciaEstimada ?? this.calcularMetricasSesion(sesion).distanciaTotal,
        tssTotal: sesion.detalle.tssEstimada ?? this.calcularMetricasSesion(sesion).tssTotal
      };
      const tiempoTotal = this.formatearTiempo(sesion.duracion);
      
      let headerHTML;
      if (sesion.tipo === 'strength') {
        const calorias = sesion.detalle.caloriasEstimadas || '—';
        headerHTML = `
          <div class="sesion-resumen-horizontal">
            <div class="resumen-item"><span>🕒</span> ${tiempoTotal}</div>
            <div class="resumen-item"><span>🔥</span> ${calorias} kcal</div>
          </div>
        `;
      } else {
        const zonaMostrada = sesion.detalle.zona || '—';
        const tiempoEnZonaMostrado = sesion.detalle.tiempoEnZona ? `${sesion.detalle.tiempoEnZona} min` : '—';
        headerHTML = `
          <div class="sesion-resumen-horizontal">
            <div class="resumen-item"><span>🕒</span> ${tiempoTotal}</div>
            <div class="resumen-item"><span>📏</span> ${metricas.distanciaTotal.toFixed(2)} km</div>
            <div class="resumen-item"><span>⚡</span> ${metricas.tssTotal} TSS</div>
            <div class="resumen-item"><span>🔥 ${zonaMostrada}</span> ${tiempoEnZonaMostrado}</div>
          </div>
        `;
      }

      const objetivoHTML = `
        <div class="sesion-objetivo-principal">
          <h4>🎯 OBJETIVO PRINCIPAL</h4>
          <p><strong>${Utils.escapeHTML(sesion.detalle.objetivo || 'Sesión de calidad')}</strong></p>
          <p class="porque">${Utils.escapeHTML(sesion.detalle.porque || '')}</p>
        </div>
      `;

      let zonasHTML = '';
      if (sesion.tipo !== 'strength') {
        zonasHTML = `
          <div class="sesion-zonas">
            <div class="zona-item"><span>⏱️ Ritmo</span><strong>${Utils.escapeHTML(sesion.detalle.ritmoObjetivo)}</strong></div>
            <div class="zona-item"><span>😌 Sensación</span><strong>${Utils.escapeHTML(sesion.detalle.sensacion)}</strong></div>
            <div class="zona-item"><span>📊 Zona</span><strong>${Utils.escapeHTML(sesion.detalle.zona)}</strong></div>
          </div>
        `;
      }

      let pasosHTML = '<div class="sesion-estructura-detallada">';
      if (sesion.detalle.pasosDetallados && sesion.detalle.pasosDetallados.length > 0) {
        sesion.detalle.pasosDetallados.forEach(paso => {
          pasosHTML += `
            <div class="paso-detalle-sesion">
              <div class="paso-header"><span>${paso.icono}</span><strong>${Utils.escapeHTML(paso.titulo)}</strong></div>
              <p class="paso-accion">${Utils.escapeHTML(paso.accion)}</p>
              <p class="paso-porque"><em>${Utils.escapeHTML(paso.porque)}</em></p>
            </div>
          `;
        });
      } else if (sesion.detalle.estructura) {
        const partes = sesion.detalle.estructura.split('+').map(p => p.trim());
        partes.forEach((parte, index) => {
          let iconoPaso = '', tituloPaso = '';
          if (parte.toLowerCase().includes('calentamiento')) {
            iconoPaso = '🔥';
            tituloPaso = 'CALENTAMIENTO';
          } else if (parte.toLowerCase().includes('enfriamiento')) {
            iconoPaso = '🧘';
            tituloPaso = 'ENFRIAMIENTO';
          } else {
            iconoPaso = '💪';
            tituloPaso = 'PARTE PRINCIPAL';
          }
          pasosHTML += `
            <div class="paso-detalle-sesion">
              <div class="paso-header"><span>${iconoPaso}</span><strong>${tituloPaso}</strong></div>
              <p class="paso-accion">${Utils.escapeHTML(parte)}</p>
            </div>
          `;
        });
      }
      pasosHTML += '</div>';
      descripcion.innerHTML = headerHTML + objetivoHTML + zonasHTML + pasosHTML;
      
      if (window.GPSTracker && sesion.tipo !== 'strength') {
        const gpsBtn = document.createElement('button');
        gpsBtn.id = 'gpsStartBtn';
        gpsBtn.style.cssText = [
          'margin-top:18px', 'width:100%', 'height:54px',
          'background:linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
          'border:2px solid var(--gold)', 'color:var(--gold)',
          'font-size:15px', 'font-weight:bold', 'letter-spacing:1px',
          'border-radius:14px', 'cursor:pointer',
          "font-family:'Courier New',monospace",
          'display:flex', 'align-items:center',
          'justify-content:center', 'gap:10px',
          'transition:all 0.2s ease'
        ].join(';');
        gpsBtn.innerHTML = '📍 INICIAR SESIÓN CON GPS';
        gpsBtn.addEventListener('mouseenter', () => {
          gpsBtn.style.background = 'var(--gold)';
          gpsBtn.style.color = '#0a0a0a';
        });
        gpsBtn.addEventListener('mouseleave', () => {
          gpsBtn.style.background = 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))';
          gpsBtn.style.color = 'var(--gold)';
        });
        
        let sesionLimpia = { ...sesion };
        if (sesion.tieneFuerza && sesion.detalle && sesion.detalle.pasosDetallados) {
          sesionLimpia.detalle = {
            ...sesion.detalle,
            pasosDetallados: sesion.detalle.pasosDetallados.filter(p => {
              const tit = (p.titulo || '').toUpperCase();
              return !tit.includes('FUERZA') && p.icono !== '🏋️';
            })
          };
          const duracionSinFuerza = (sesionLimpia.detalle.calentamiento || 0) +
                                     (sesionLimpia.detalle.partePrincipal || 0) +
                                     (sesionLimpia.detalle.enfriamiento || 0);
          sesionLimpia.duracion = duracionSinFuerza;
        }
        
        gpsBtn.addEventListener('click', async () => {
          const continuar = await this.comprobarFatigaAntesDeSesion();
          if (!continuar) return;
          GPSTracker.iniciar(sesionLimpia, diaIndex);
        });
        descripcion.appendChild(gpsBtn);
      }
      
      checkboxContainer.style.display = 'flex';
      checkbox.checked = AppState.sesionesRealizadas?.[diaIndex] || false;
      checkbox.onchange = async (e) => {
        const marcando = e.target.checked;
        if (marcando && sesion && sesion.tipo !== 'descanso' && sesion.tipo !== 'strength') {
          const datos = await this.abrirModalDatosReales(sesion);
          if (!datos) {
            checkbox.checked = false;
            return;
          }
          await this.marcarSesionRealizada(diaIndex, true, datos.km, datos.ms, null, false, false, datos.tipoCorregido);
        } else {
          await this.marcarSesionRealizada(diaIndex, marcando);
        }
      };
      feedbackContainer.style.display = 'block';
      this.mostrarFeedbackExistente(diaIndex);
      const feedbackButtons = feedbackContainer.querySelectorAll('.feedback-btn');
      feedbackButtons.forEach(btn => {
        btn.onclick = async (e) => {
          const valor = e.target.getAttribute('data-value');
          await this.guardarFeedback(diaIndex, valor);
        };
      });
    } else {
      wrapper.classList.add('sesion-descanso');
      titulo.innerText = "😴 DESCANSO";
      const objetivoDescanso = this.obtenerObjetivoDescanso(sesion);
      const porqueDescanso = this.obtenerPorqueDescanso(sesion);
      descripcion.innerHTML = `
        <div class="descanso-container">
          <div class="descanso-icono">😴</div>
          <p class="descanso-texto">Día de descanso</p>
          <div class="descanso-objetivo">
            <h4>🎯 OBJETIVO</h4>
            <p>${Utils.escapeHTML(objetivoDescanso)}</p>
            <p class="porque">${Utils.escapeHTML(porqueDescanso)}</p>
          </div>
          <ul class="descanso-recomendaciones">
            <li>🧘 Estiramientos suaves</li>
            <li>🌀 Foam roller</li>
            <li>🚶 Paseo activo</li>
            <li>💧 Hidratación adecuada</li>
          </ul>
        </div>
      `;
      checkboxContainer.style.display = 'none';
      feedbackContainer.style.display = 'none';
    }
    modal.classList.add("visible");
    overlay.classList.add("visible");
  },

  async guardarFeedback(diaIndex, valor) {
    if (!AppState.currentUserId || !AppState.planActualId) return;
    try {
      if (!AppState.feedbackSesiones) AppState.feedbackSesiones = {};
      AppState.feedbackSesiones[diaIndex] = valor;
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      await planRef.update({ [`feedback.${diaIndex}`]: valor });
      const feedbackContainer = document.getElementById("sesionFeedbackContainer");
      if (feedbackContainer) {
        const buttons = feedbackContainer.querySelectorAll('.feedback-btn');
        buttons.forEach(btn => {
          if (btn.getAttribute('data-value') === valor) {
            btn.style.background = 'var(--accent-blue)';
            btn.style.color = 'var(--bg-primary)';
          } else {
            btn.style.background = '';
            btn.style.color = '';
          }
        });
      }
      Utils.showToast('✅ Feedback guardado', 'success');
    } catch (error) {
      console.error('Error guardando feedback:', error);
      Utils.showToast('Error al guardar feedback', 'error');
    }
  },

  mostrarFeedbackExistente(diaIndex) {
    const feedbackContainer = document.getElementById("sesionFeedbackContainer");
    if (!feedbackContainer) return;
    const valor = AppState.feedbackSesiones?.[diaIndex];
    if (!valor) return;
    const buttons = feedbackContainer.querySelectorAll('.feedback-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-value') === valor) {
        btn.style.background = 'var(--accent-blue)';
        btn.style.color = 'var(--bg-primary)';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    });
  },

  obtenerObjetivoDescanso(sesion) {
    const fase = sesion.fase || 'BASE';
    const objetivosDescanso = {
      BASE: 'Recuperación activa tras el volumen de base',
      CONSTRUCCION: 'Asimilar las cargas de construcción',
      ESPECIFICA: 'Prepararse para las sesiones específicas',
      PICO: 'Descargar antes del pico de forma',
      TAPER: 'Máxima recuperación antes de la competición'
    };
    return objetivosDescanso[fase] || 'Recuperación y asimilación del entrenamiento';
  },

  obtenerPorqueDescanso(sesion) {
    const fase = sesion.fase || 'BASE';
    const porqueDescanso = {
      BASE: 'El descanso permite que el sistema cardiovascular se adapte al volumen.',
      CONSTRUCCION: 'Los días de descanso evitan la acumulación de fatiga y previenen lesiones.',
      ESPECIFICA: 'Las sesiones de calidad requieren días de descanso para llegar en óptimas condiciones.',
      PICO: 'El descanso es clave para alcanzar el pico de forma.',
      TAPER: 'Durante el taper, el descanso permite la supercompensación.'
    };
    return porqueDescanso[fase] || 'El descanso es parte fundamental del entrenamiento.';
  },

  async limpiarMuroGlobal() {
    return;
  },

  async comprobarFatigaAntesDeSesion() {
    const estado = this.calcularEstadoRecuperacionActual();
    if (estado && estado.pct < 100) {
      const horasStr = estado.horasRestantes >= 24
        ? `${Math.ceil(estado.horasRestantes / 24)} día(s)`
        : `${estado.horasRestantes} h`;
      const continuar = await Utils.confirm(
        '⚠️ Aún no estás recuperado al 100%',
        `Tu recuperación está al ${estado.pct}% (última sesión: ${estado.tss} TSS, tipo ${estado.tipo}). Faltan ~${horasStr} para la recuperación completa. Entrenar ahora aumenta el riesgo de fatiga acumulada y lesión. ¿Quieres continuar igualmente?`
      );
      if (!continuar) {
        Utils.showToast('Sesión no iniciada — sigue recuperándote 💤', 'info');
        return false;
      }
      this._ultimaSesionForzadaSinRecuperar = { pct: estado.pct, tss: estado.tss };
      return true;
    }
    this._ultimaSesionForzadaSinRecuperar = null;
    return true;
  },

  _marcandoEnCurso: {},

  async marcarSesionRealizada(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null, esGPS = false, saltarComprobacionFatiga = false, tipoCorregido = null) {
    if (!AppState.currentUserId || !AppState.planActualId) return;

    const enCurso = this._marcandoEnCurso[diaIndex];
    if (enCurso) {
      try { await enCurso; } catch (e) {}
    }
    let resolverEnCurso;
    this._marcandoEnCurso[diaIndex] = new Promise(res => { resolverEnCurso = res; });

    try {
      await this._marcarSesionRealizadaInterno(diaIndex, realizada, realDistance, realDurationMs, realMaxSpeedKmh, esGPS, saltarComprobacionFatiga, tipoCorregido);
    } finally {
      resolverEnCurso();
      if (this._marcandoEnCurso[diaIndex]) delete this._marcandoEnCurso[diaIndex];
    }
  },

  async _marcarSesionRealizadaInterno(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null, esGPS = false, saltarComprobacionFatiga = false, tipoCorregido = null) {
    if (realizada && !saltarComprobacionFatiga) {
      const continuar = await this.comprobarFatigaAntesDeSesion();
      if (!continuar) {
        const checkboxRevert = document.getElementById('sesionRealizada');
        if (checkboxRevert) checkboxRevert.checked = false;
        return;
      }
    }

    try {
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      await planRef.update({ [`sesionesRealizadas.${diaIndex}`]: realizada });
      
      if (!AppState.sesionesRealizadas) AppState.sesionesRealizadas = {};
      AppState.sesionesRealizadas[diaIndex] = realizada;
      
      const celda = document.querySelector(`.calendario-dia[data-dia-global="${diaIndex}"]`);
      if (celda) {
        if (realizada) {
          celda.classList.add('realizado');
          celda.classList.remove('perdida');
        } else {
          celda.classList.remove('realizado');
          // FIX (misma familia de bug que el táctil del calendario): buscar
          // la sesión de esta celda por su diaGlobal REAL (no por posición
          // de array), ya que en un plan personalizado puede haber huecos
          // en la secuencia de diaGlobal.
          const sesionCelda = this._sesionesPorDiaGlobal ? this._sesionesPorDiaGlobal[diaIndex] : null;
          if (sesionCelda && this._fechaInicioPlan && sesionCelda.tipo !== 'descanso') {
            const fechaSesionCelda = new Date(this._fechaInicioPlan);
            fechaSesionCelda.setDate(fechaSesionCelda.getDate() + (diaIndex - 1));
            const hoyCelda = new Date(); hoyCelda.setHours(0, 0, 0, 0);
            if (fechaSesionCelda < hoyCelda) celda.classList.add('perdida');
            else celda.classList.remove('perdida');
          } else {
            celda.classList.remove('perdida');
          }
        }
      }

      Utils.showToast(realizada ? '✅ Sesión marcada' : '📝 Sesión desmarcada (actualizada)', 'success');

      try {
      const planDoc = await planRef.get();
      const planCompleto = planDoc.data();
      // FIX GRAVE: buscar la sesión por su diaGlobal REAL en vez de usar
      // diaIndex-1 como posición de array. Con huecos en la secuencia de
      // diaGlobal (plan personalizado por invitaciones sueltas del admin),
      // el índice de array podía apuntar a OTRA sesión distinta -- al
      // marcar una sesión como hecha se calculaban y publicaban las
      // métricas (distancia/TSS/calorías/zona) de la sesión equivocada.
      const sesion = (planCompleto.sesiones || []).find(s => s.diaGlobal === diaIndex);
      
      if (realizada) {
        await this.limpiarMuroGlobal();
        if (sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          let metricas;
          let distanciaUsada;
          let duracionUsadaMs;
          
          if (sesion.tipo === 'strength') {
            duracionUsadaMs = (sesion.duracion || 0) * 60 * 1000;
            distanciaUsada = 0;
            const pesoUsuario = AppState.currentUserData?.profile?.weight || null;
            metricas = {
              distanciaTotal: 0,
              tssTotal: 0,
              desglose: null,
              calorias: sesion.detalle.caloriasEstimadas
                || (pesoUsuario ? Math.round(pesoUsuario * (sesion.duracion || 0) * 0.0875) : null)
            };
          } else if (realDistance !== null && realDurationMs !== null) {
            distanciaUsada = realDistance;
            duracionUsadaMs = realDurationMs;
            const desgloseReal = this._desglosarSesion(sesion, realDurationMs / 60000, realDistance);
            metricas = {
              distanciaTotal: realDistance,
              tssTotal: this.calcularTSSdesdeReal(realDistance, realDurationMs, sesion, desgloseReal),
              gpsUsed: !!esGPS,
              maxSpeed: esGPS ? (realMaxSpeedKmh || 0) : 0,
              desglose: desgloseReal,
              zone4Minutes: this._sumarMinutosPorZona(desgloseReal, 'Z4'),
              zone5Minutes: this._sumarMinutosPorZona(desgloseReal, 'Z5')
            };
          } else {
            metricas = {
              distanciaTotal: sesion.detalle.distanciaEstimada || 0,
              tssTotal: sesion.detalle.tssEstimada || 0,
              desglose: this._desglosarSesion(sesion, sesion.duracion, sesion.detalle.distanciaEstimada || 0)
            };
            distanciaUsada = metricas.distanciaTotal;
            duracionUsadaMs = sesion.duracion * 60 * 1000;
          }

          if (distanciaUsada > 0 && duracionUsadaMs > 0) {
            metricas.bestPace = (duracionUsadaMs / 60000) / distanciaUsada;
          }
          metricas.durationMs = duracionUsadaMs;
          const userData = AppState.currentUserData;
          const distancia = isFinite(distanciaUsada) ? distanciaUsada : 0;
          const tss = isFinite(metricas.tssTotal) ? metricas.tssTotal : 0;

          const zonaFinal = metricas.desglose?.partePrincipal?.zona || sesion.detalle.zona || '';

          const tipoFinal = tipoCorregido || sesion.tipo;
          const nombreFinal = tipoCorregido
            ? this._infoTipo(tipoCorregido).label
            : (sesion.detalle.nombre || '');

          const fechaInicioPlan = AppState.planGeneradoActual?.fechaInicio
            ? new Date(AppState.planGeneradoActual.fechaInicio)
            : null;
          let fechaSesionReal = null;
          if (fechaInicioPlan) {
            fechaSesionReal = new Date(fechaInicioPlan);
            fechaSesionReal.setDate(fechaSesionReal.getDate() + (diaIndex - 1));
          }

          const entry = {
            userId: AppState.currentUserId,
            username: userData.username,
            photoURL: userData.profile?.photoURL || null,
            trainingType: tipoFinal,
            duration: Math.floor(duracionUsadaMs / 60000),
            distancia: distancia,
            tss: tss,
            timestamp: firebaseServices.Timestamp.now(),
            fechaSesion: fechaSesionReal ? firebaseServices.Timestamp.fromDate(fechaSesionReal) : firebaseServices.Timestamp.now(),
            planId: AppState.planActualId,
            sesionIndex: diaIndex,
            likes: [],
            likeCount: 0,
            likesLeidos: 0,
            zone: zonaFinal,
            fase: sesion.fase || 'BASE',
            trainingName: nombreFinal,
            desglose: metricas.desglose || null,
            calorias: metricas.calorias || null
          };

          if (sesion.tipo === 'strength' && Array.isArray(sesion.detalle.pasosDetallados)) {
            entry.pasosDetallados = sesion.detalle.pasosDetallados;
          }

          if (this._ultimaSesionForzadaSinRecuperar) {
            entry.recuperacionPctAlMarcar = this._ultimaSesionForzadaSinRecuperar.pct;
            this._ultimaSesionForzadaSinRecuperar = null;
          }

          if (realDistance !== null && realDurationMs !== null && esGPS) {
            entry.hasGPS = true;
          } else {
            entry.hasGPS = false;
          }
          
          try {
            const globalRef = await firebaseServices.db.collection('globalFeed').add(entry);
            await planRef.update({ [`wallEntryId.${diaIndex}`]: globalRef.id });
            entry.entryId = globalRef.id;
            await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
              ultimaSesion: entry
            });
            if (AppState.currentUserData) {
              AppState.currentUserData.ultimaSesion = entry;
            }
            if (typeof window.actualizarUltimaSesionDashboard === 'function') {
              window.actualizarUltimaSesionDashboard();
            }
            if (typeof window.actualizarEstaSemanaDashboard === 'function') {
              window.actualizarEstaSemanaDashboard(AppState.currentUserData?.profile?.weight || null);
            }
            if (typeof window.actualizarCargaRecuperacionDashboard === 'function') {
              window.actualizarCargaRecuperacionDashboard();
            }
            if (typeof window.precargarCargaPlan === 'function') {
              window.precargarCargaPlan();
            }
          } catch (err) {
            console.error('Error al guardar en muro:', err);
            Utils.showToast('Error al publicar en el muro', 'error');
          }
          
          if (window.Gamification) {
            try {
              const oldData = await Gamification.getData(AppState.currentUserId);
              const oldLevel = oldData.level;
              metricas.fechaSesionReal = fechaSesionReal;
              const gamResult = await Gamification.updateAfterSession(AppState.currentUserId, sesion, metricas);
              if (entry.entryId && gamResult?.gainedBadges?.length) {
                try {
                  await firebaseServices.db.collection('globalFeed').doc(entry.entryId).update({
                    badgesGanadas: gamResult.gainedBadges
                  });
                } catch (e) { console.warn('No se pudo guardar badgesGanadas en el muro:', e); }
              }
              const newData = await Gamification.getData(AppState.currentUserId);
              const newLevel = newData.level;
              if (newLevel !== oldLevel) {
                console.log(`🎉 Nivel cambiado de ${oldLevel} a ${newLevel}. Refrescando UI...`);
                if (Gamification.clearCache) await Gamification.clearCache(AppState.currentUserId);
                if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
                if (document.getElementById('subtab-amigos')?.classList.contains('active') && window.Friends) {
                  await Friends.cargarListaAmigos(true);
                  const activeAmigosTab = document.querySelector('.amigos-tab.active');
                  if (activeAmigosTab && activeAmigosTab.textContent.includes('BUSCAR')) await Friends.cargarTodosUsuarios(true);
                }
                if (document.getElementById('subtab-muro')?.classList.contains('active') && window.Wall) Wall.cargarMuro();
              }
            } catch (e) { console.error('Error actualizando gamificación:', e); }
          }
        }
      } else {
        const planData = planDoc.data();
        const wallEntryId = planData?.wallEntryId?.[diaIndex];
        let distanciaReal = null;
        let badgesGanadasSesion = [];
        let zone4MinutesRemovidos = 0;
        let zone5MinutesRemovidos = 0;
        
        if (wallEntryId) {
          try {
            const wallDoc = await firebaseServices.db.collection('globalFeed').doc(wallEntryId).get();
            if (wallDoc.exists) {
              const wallData = wallDoc.data();
              distanciaReal = wallData.distancia;
              badgesGanadasSesion = wallData.badgesGanadas || [];
              zone4MinutesRemovidos = this._sumarMinutosPorZona(wallData.desglose, 'Z4');
              zone5MinutesRemovidos = this._sumarMinutosPorZona(wallData.desglose, 'Z5');
              console.log(`📖 Distancia real obtenida del muro: ${distanciaReal} km`);
            }
          } catch (err) { console.warn('Error leyendo entrada del muro:', err); }
        }
        
        if (wallEntryId) {
          try {
            await firebaseServices.db.collection('globalFeed').doc(wallEntryId).delete();
            await planRef.update({ [`wallEntryId.${diaIndex}`]: firebaseServices.FieldValue.delete() });
          } catch (err) { console.error('Error al eliminar del muro:', err); }

          try {
            if (AppState.currentUserData?.ultimaSesion?.entryId === wallEntryId) {
              let nuevaUltima = null;
              try {
                let siguienteSnap;
                try {
                  siguienteSnap = await firebaseServices.db
                    .collection('globalFeed')
                    .where('userId', '==', AppState.currentUserId)
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .get();
                } catch (indexErr) {
                  const fallbackSnap = await firebaseServices.db
                    .collection('globalFeed')
                    .where('userId', '==', AppState.currentUserId)
                    .limit(20)
                    .get();
                  let masReciente = null, fechaMasReciente = null;
                  fallbackSnap.forEach(doc => {
                    const d = doc.data();
                    const fecha = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
                    if (!fechaMasReciente || fecha > fechaMasReciente) { fechaMasReciente = fecha; masReciente = doc; }
                  });
                  siguienteSnap = { empty: !masReciente, docs: masReciente ? [masReciente] : [] };
                }
                if (!siguienteSnap.empty) {
                  const doc = siguienteSnap.docs[0];
                  nuevaUltima = { ...doc.data(), entryId: doc.id };
                }
              } catch (queryErr) {
                console.warn('No se pudo buscar la sesión anterior para "última sesión":', queryErr);
              }
              await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
                ultimaSesion: nuevaUltima || firebaseServices.FieldValue.delete()
              });
              if (AppState.currentUserData) AppState.currentUserData.ultimaSesion = nuevaUltima || null;
              if (typeof window.actualizarUltimaSesionDashboard === 'function') {
                if (!nuevaUltima) {
                  const ultEl = document.getElementById('dashboardUltimaSesionContent');
                  if (ultEl) ultEl.innerHTML = 'Sin sesiones registradas aún.';
                } else {
                  window.actualizarUltimaSesionDashboard();
                }
              }
            }
          } catch (syncErr) {
            console.warn('No se pudo sincronizar "última sesión":', syncErr);
          }
          if (typeof window.actualizarEstaSemanaDashboard === 'function') {
            window.actualizarEstaSemanaDashboard(AppState.currentUserData?.profile?.weight || null);
          }
          if (typeof window.actualizarCargaRecuperacionDashboard === 'function') {
            window.actualizarCargaRecuperacionDashboard();
          }
          if (typeof window.precargarCargaPlan === 'function') {
            window.precargarCargaPlan();
          }
        }
        
        if (window.Gamification && sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          try {
            let distanciaRemovida;
            if (distanciaReal !== null) {
              distanciaRemovida = distanciaReal;
              console.log(`✅ Reviertiendo gamificación con distancia real: ${distanciaRemovida} km`);
            } else {
              distanciaRemovida = sesion.detalle.distanciaEstimada ?? this.calcularMetricasSesion(sesion).distanciaTotal;
              console.warn(`⚠️ No se encontró distancia real, usando estimada: ${distanciaRemovida} km`);
            }
            const metricasRemovidas = {
              distanciaTotal: distanciaRemovida,
              tssTotal: 0,
              zone4Minutes: zone4MinutesRemovidos,
              zone5Minutes: zone5MinutesRemovidos
            };
            await Gamification.removeSession(AppState.currentUserId, sesion, metricasRemovidas, diaIndex, badgesGanadasSesion);
            if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
            if (document.getElementById('subtab-amigos')?.classList.contains('active') && window.Friends) await Friends.cargarListaAmigos(true);
          } catch (e) { console.error('Error revirtiendo gamificación:', e); }
        }
      }
      } catch (bgError) {
        console.error('Error en el trabajo de fondo tras marcar sesión:', bgError);
      }
    } catch (error) {
      console.error('Error marcando sesión:', error);
      Utils.showToast('Error al marcar la sesión', 'error');
    }
  },

  calcularTSSdesdeReal(distanciaKm, duracionMs, sesion, desglose = null) {
    const duracionHoras = duracionMs / (1000 * 60 * 60);
    if (duracionHoras <= 0) return 0;

    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05, 'Z6': 1.15 };
    if (desglose && desglose.partePrincipal && desglose.partePrincipal.min > 0) {
      let tssAcumulado = 0;
      ['calentamiento', 'partePrincipal', 'recuperacion', 'enfriamiento'].forEach(fase => {
        const tramo = desglose[fase];
        if (!tramo || !tramo.min) return;
        const ifTramo = factoresIF[tramo.zona] || 0.7;
        tssAcumulado += tramo.min * ifTramo * ifTramo;
      });
      return Math.round(tssAcumulado);
    }

    const ritmoBase = AppState.lastRitmoBase || 5;
    const distanciaEstimadaPorRitmo = duracionHoras * 60 / ritmoBase;
    const factor = distanciaKm / Math.max(0.1, distanciaEstimadaPorRitmo);
    const tssBase = sesion.duracion || 45;
    return Math.round(tssBase * factor);
  },

  formatearTiempo(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    if (horas > 0) return `${horas}h ${mins}min`;
    else return `${mins} min`;
  },

  // ============================================================
  //  CARGA DE ENTRENAMIENTO: TSS, carga aguda/crónica y ACWR
  // ============================================================
  async calcularCargaEntrenamiento(uid, diasCronica = 28, diasAguda = 7) {
    if (!uid) return null;
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(120)
        .get();

      const ahora = new Date(); ahora.setHours(0, 0, 0, 0);
      const desde = new Date(ahora);
      desde.setDate(desde.getDate() - (diasCronica - 1));

      const tssPorDia = {};
      snap.forEach(doc => {
        const d = doc.data();
        const rawFecha = d.fechaSesion || d.timestamp;
        if (!rawFecha) return;
        const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
        fecha.setHours(0, 0, 0, 0);
        if (fecha < desde || fecha > ahora) return;
        const key = this._dateKey(fecha);
        const tss = (typeof d.tss === 'number' && isFinite(d.tss) && d.tss > 0)
          ? d.tss
          : Math.round((d.duration || 0) * 0.85);
        tssPorDia[key] = (tssPorDia[key] || 0) + tss;
      });

      let sumaAguda = 0, sumaCronica = 0, diasConDatos = 0;
      for (let i = 0; i < diasCronica; i++) {
        const f = new Date(ahora);
        f.setDate(f.getDate() - i);
        const key = this._dateKey(f);
        const tssDia = tssPorDia[key] || 0;
        if (tssPorDia[key] !== undefined) diasConDatos++;
        sumaCronica += tssDia;
        if (i < diasAguda) sumaAguda += tssDia;
      }

      const cargaAguda = sumaAguda / diasAguda;
      const cargaCronica = sumaCronica / diasCronica;
      const datosSuficientes = diasConDatos >= 10;
      const acwr = cargaCronica > 0 ? cargaAguda / cargaCronica : null;

      let clasificacion, color, riesgo;
      if (acwr === null) {
        clasificacion = 'Sin datos suficientes'; color = 'var(--text-secondary)'; riesgo = 'desconocido';
      } else if (acwr < 0.8) {
        clasificacion = 'Baja (posible pérdida de forma)'; color = '#5DADE2'; riesgo = 'bajo';
      } else if (acwr <= 1.3) {
        clasificacion = 'Óptima'; color = '#2ECC71'; riesgo = 'optimo';
      } else if (acwr <= 1.5) {
        clasificacion = 'Elevada — vigila la recuperación'; color = '#F39C12'; riesgo = 'elevado';
      } else {
        clasificacion = 'Alto riesgo de lesión'; color = '#E74C3C'; riesgo = 'alto';
      }

      return { cargaAguda, cargaCronica, acwr, clasificacion, color, riesgo, datosSuficientes, diasConDatos };
    } catch (error) {
      console.error('Error calculando carga de entrenamiento (TSS/ACWR):', error);
      return null;
    }
  },

  // ============================================================
  //  FORMA FÍSICA: CTL / ATL / TSB
  // ============================================================
  async calcularFormaFisica(uid, diasHistorial = 90) {
    if (!uid) return null;
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(200)
        .get();

      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - (diasHistorial - 1));

      const tssPorDia = {};
      let sesionesEnVentana = 0;
      snap.forEach(doc => {
        const d = doc.data();
        const rawFecha = d.fechaSesion || d.timestamp;
        if (!rawFecha) return;
        const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
        fecha.setHours(0, 0, 0, 0);
        if (fecha < desde || fecha > hoy) return;
        const key = this._dateKey(fecha);
        const tss = (typeof d.tss === 'number' && isFinite(d.tss) && d.tss > 0)
          ? d.tss
          : Math.round((d.duration || 0) * 0.85);
        tssPorDia[key] = (tssPorDia[key] || 0) + tss;
        sesionesEnVentana++;
      });

      if (sesionesEnVentana < 14) {
        return { datosSuficientes: false, sesionesEnVentana };
      }

      const dias = [];
      for (let i = diasHistorial - 1; i >= 0; i--) {
        const f = new Date(hoy);
        f.setDate(f.getDate() - i);
        const key = this._dateKey(f);
        dias.push({ fecha: f, key, tss: tssPorDia[key] || 0 });
      }

      const kCTL = 42, kATL = 7;
      let ctl = 0, atl = 0;
      const serie = [];
      dias.forEach(d => {
        const tsb = ctl - atl;
        ctl = ctl + (d.tss - ctl) / kCTL;
        atl = atl + (d.tss - atl) / kATL;
        serie.push({ fecha: d.fecha, key: d.key, tss: d.tss, ctl, atl, tsb });
      });

      const ultimo = serie[serie.length - 1];
      const idxHace21 = Math.max(0, serie.length - 22);
      const ctlHace21 = serie[idxHace21]?.ctl ?? ultimo.ctl;
      const deltaCTL = ultimo.ctl - ctlHace21;
      let tendencia, tendenciaColor, tendenciaTexto;
      if (deltaCTL > 2) {
        tendencia = 'subiendo'; tendenciaColor = '#2ECC71';
        tendenciaTexto = 'Tu forma física lleva semanas construyéndose. Sigue así.';
      } else if (deltaCTL < -2) {
        tendencia = 'bajando'; tendenciaColor = '#E74C3C';
        tendenciaTexto = 'Tu forma física está bajando: llevas un tiempo entrenando menos de lo habitual.';
      } else {
        tendencia = 'estable'; tendenciaColor = 'var(--text-secondary)';
        tendenciaTexto = 'Tu forma física está estable en las últimas semanas.';
      }

      let tsbEstado, tsbColor;
      if (ultimo.tsb > 25) { tsbEstado = 'Muy fresco: puede que estés descansando de más'; tsbColor = '#5DADE2'; }
      else if (ultimo.tsb > 5) { tsbEstado = 'Fresco, buen momento para exigirte'; tsbColor = '#2ECC71'; }
      else if (ultimo.tsb > -10) { tsbEstado = 'Equilibrado'; tsbColor = 'var(--gold)'; }
      else if (ultimo.tsb > -30) { tsbEstado = 'En carga: fatiga controlada'; tsbColor = '#F39C12'; }
      else { tsbEstado = 'Fatiga alta: vigila el descanso'; tsbColor = '#E74C3C'; }

      return {
        datosSuficientes: true,
        serie,
        ctl: ultimo.ctl, atl: ultimo.atl, tsb: ultimo.tsb,
        tendencia, tendenciaColor, tendenciaTexto,
        tsbEstado, tsbColor
      };
    } catch (error) {
      console.error('Error calculando forma física (CTL/ATL/TSB):', error);
      return null;
    }
  },

  async renderizarWidgetCarga() {
    const cont = document.getElementById('cargaEntrenamientoWidget');
    if (!cont || !AppState.currentUserId) return;
    const carga = await this.calcularCargaEntrenamiento(AppState.currentUserId);
    if (!carga) { cont.style.display = 'none'; return; }

    if (!carga.datosSuficientes) {
      cont.style.display = 'block';
      cont.innerHTML = `
        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:10px 14px; margin:10px 0; font-size:12px; color:var(--text-secondary); text-align:center;">
          📊 Carga de entrenamiento (ACWR): registra más sesiones (mínimo ~10 en las últimas 4 semanas) para ver esta métrica.
        </div>`;
      return;
    }

    cont.style.display = 'block';
    const acwrTexto = carga.acwr !== null ? carga.acwr.toFixed(2) : '—';
    cont.innerHTML = `
      <div style="background:var(--bg-secondary); border:1px solid ${carga.color}; border-radius:12px; padding:12px 14px; margin:10px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="font-size:12px; color:var(--text-secondary);">
            ⚡ Carga aguda (7d): <strong style="color:var(--text-primary);">${carga.cargaAguda.toFixed(0)} TSS/día</strong>
            &nbsp;·&nbsp; Crónica (28d): <strong style="color:var(--text-primary);">${carga.cargaCronica.toFixed(0)} TSS/día</strong>
          </div>
          <div style="font-size:13px; font-weight:bold; color:${carga.color};">
            ACWR ${acwrTexto} — ${carga.clasificacion}
          </div>
        </div>
      </div>`;
  },

  calcularRecuperacion(tss, tipo) {
    const factorTipo = { rodaje: 0.9, tempo: 1.0, series: 1.15, largo: 1.05, strength: 1.1 }[tipo] || 1.0;
    const horas = Math.min(72, Math.max(8, Math.round((tss || 0) * 0.5 * factorTipo)));
    return horas;
  },

  calcularEstadoRecuperacionActual() {
    try {
      const ult = AppState.currentUserData?.ultimaSesion || null;
      if (!ult || !ult.tss) return null;
      const tss = ult.tss || 0;
      const tipo = ult.trainingType || 'rodaje';
      const horas = this.calcularRecuperacion(tss, tipo);

      const fechaBase = ult.timestamp?.toDate ? ult.timestamp.toDate() : new Date(ult.timestamp);
      const fechaRecuperado = new Date(fechaBase.getTime() + horas * 3600000);
      const ahora = new Date();
      const msTotal = fechaRecuperado.getTime() - fechaBase.getTime();
      const msTranscurrido = ahora.getTime() - fechaBase.getTime();
      const pct = msTotal > 0 ? Math.min(100, Math.max(0, Math.round((msTranscurrido / msTotal) * 100))) : 100;
      const msRestante = Math.max(0, fechaRecuperado.getTime() - ahora.getTime());
      const horasRestantes = Math.ceil(msRestante / 3600000);

      return { pct, horasRestantes, tss, tipo, horasRecuperacionTotal: horas };
    } catch (e) {
      console.warn('No se pudo calcular el estado de recuperación actual:', e);
      return null;
    }
  },

  async calcularCargaPlanActivo(uid, planId) {
    if (!uid || !planId) return null;
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('planId', '==', planId)
        .get();

      let totalTSS = 0, totalDistancia = 0, totalSesiones = 0;
      const eventos = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.userId !== uid) return;
        const tss = (typeof d.tss === 'number' && isFinite(d.tss)) ? d.tss : 0;
        const rawFecha = d.fechaSesion || d.timestamp;
        if (!rawFecha) return;
        const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
        totalTSS += tss;
        totalDistancia += parseFloat(d.distancia || 0);
        totalSesiones++;
        eventos.push({ fecha, tss, tipo: d.trainingType });
      });
      eventos.sort((a, b) => a.fecha - b.fecha);

      const porSemana = {};
      eventos.forEach(ev => {
        const lunes = new Date(ev.fecha);
        const dow = (lunes.getDay() + 6) % 7;
        lunes.setDate(lunes.getDate() - dow);
        lunes.setHours(0, 0, 0, 0);
        const key = this._dateKey(lunes);
        porSemana[key] = (porSemana[key] || 0) + ev.tss;
      });

      return { totalTSS, totalDistancia, totalSesiones, porSemana, eventos };
    } catch (error) {
      console.error('Error calculando carga del plan activo:', error);
      return null;
    }
  },

  async mostrarUltimoPlanGuardado(silencioso = false) {
    if (!AppState.currentUserId) {
      if (!silencioso) Utils.showToast("> NO HAY USUARIO_", 'error');
      return;
    }
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      const ultimoPlanId = userDoc.data()?.ultimoPlanId;
      if (!ultimoPlanId) {
        if (!silencioso) Utils.showToast("> NO HAY PLAN GUARDADO_", 'error');
        return;
      }
      const planDoc = await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(ultimoPlanId)
        .get();
      if (!planDoc.exists) {
        if (!silencioso) Utils.showToast("> EL PLAN YA NO EXISTE_", 'error');
        return;
      }
      const planCompleto = planDoc.data();
      AppState.planGeneradoActual = planCompleto.params;
      AppState.planActualId = ultimoPlanId;
      AppState.sesionesRealizadas = planCompleto.sesionesRealizadas || {};
      AppState.feedbackSesiones = planCompleto.feedback || {};
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;
      document.getElementById("calendarioEntreno").style.display = "block";
      document.getElementById("cuestionarioEntreno").style.display = "none";
      const resumen = document.getElementById("resumenObjetivo");
      if (resumen) resumen.innerText = planCompleto.resumen || 'Plan cargado';
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planCompleto.nombrePlan || 'Mi plan';
      this.mostrarCalendario(planCompleto.sesiones);

      this.recalcularDistanciasPlanActual(true).catch(e => console.warn('Error en autocorrección de distancias:', e));
    } catch (error) {
      console.error('Error al cargar último plan:', error);
      if (!silencioso) Utils.showToast('Error al cargar el plan', 'error');
    }
  },

  async borrarPlanGuardado() {
    if (!AppState.currentUserId) return;
    if (!AppState.isPremium) {
      Utils.showToast("> SOLO PREMIUM PUEDE ELIMINAR PLANES_", 'error');
      return;
    }
    const confirmed = await Utils.confirm('ELIMINAR PLAN', "> ¿ELIMINAR PLAN GUARDADO?_");
    if (!confirmed) return;
    Utils.showLoading();
    try {
      await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({ ultimoPlanId: null });
      if (AppState.planActualId) {
        await firebaseServices.db
          .collection('users')
          .doc(AppState.currentUserId)
          .collection('planes')
          .doc(AppState.planActualId)
          .delete();
      }
      AppState.limpiarDatosPlan();
      document.getElementById("calendarioEntreno").style.display = "none";
      document.getElementById("cuestionarioEntreno").style.display = "block";
      Utils.showToast("✅ PLAN ELIMINADO", 'success');
      if (window.UI) {
        UI.guardarEstado();
        await UI.cargarHistorialPlanes();
      }
    } catch (error) {
      console.error('Error borrando plan:', error);
      Utils.showToast('Error al eliminar el plan', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  toggleCuestionario() {
    const cuestionario = document.getElementById('cuestionarioEntreno');
    if (cuestionario) {
      const isVisible = cuestionario.style.display !== 'none';
      cuestionario.style.display = isVisible ? 'none' : 'block';
    }
  },

  async analizarFeedbackAdaptativo() {
    if (!AppState.currentUserId || !AppState.planActualId) return { volumen: 1.0, intensidad: 1.0 };
    try {
      const planDoc = await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId)
        .get();
      if (!planDoc.exists) return { volumen: 1.0, intensidad: 1.0 };
      const feedback = planDoc.data().feedback || {};
      const valores = Object.values(feedback);
      if (valores.length === 0) return { volumen: 1.0, intensidad: 1.0 };
      const counts = { 1:0, 2:0, 3:0, 4:0 };
      valores.forEach(v => { if (counts[v] !== undefined) counts[v]++; });
      const total = valores.length;
      const muyDuraRatio = counts[1] / total;
      const excelenteRatio = counts[4] / total;
      let volumen = 1.0;
      let intensidad = 1.0;
      if (muyDuraRatio > 0.3) {
        volumen = 0.9;
        intensidad = 0.9;
        Utils.showToast('⚠️ Se han detectado sesiones muy duras. Reducimos la carga de las próximas semanas.', 'warning');
      } else if (excelenteRatio > 0.5) {
        volumen = 1.05;
        intensidad = 1.05;
        Utils.showToast('🔥 ¡Excelente rendimiento! Aumentamos ligeramente la carga.', 'success');
      }
      return { volumen, intensidad };
    } catch (error) {
      console.error('Error analizando feedback:', error);
      return { volumen: 1.0, intensidad: 1.0 };
    }
  },

  validarOpcionesPlan() {
    const distancia = document.getElementById("distObjetivo")?.value;
    const duracion = parseInt(document.getElementById("duracionPlan")?.value);
    const experiencia = document.getElementById("experienciaDistancia")?.value;
    const nivel = document.getElementById("nivel")?.value;
    const msgDiv = document.getElementById("info-mensaje-distancia");
    if (!msgDiv) return;

    if (distancia === "medio" && duracion === 1) {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MEDIA MARATÓN se recomienda mínimo 3 meses de planificación.";
    } else if (distancia === "maraton" && duracion === 1) {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MARATÓN se recomienda mínimo 3 meses de planificación.";
    } else if (distancia === "maraton" && duracion === 3 && experiencia === "no") {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MARATÓN en 3 meses se necesita experiencia previa. Considera 6 meses.";
    } else if (distancia === "medio" && duracion === 3 && experiencia === "no") {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MEDIA MARATÓN en 3 meses se necesita experiencia previa.";
    } else {
      msgDiv.style.display = "none";
    }
  }
};

// Funciones globales
window.PlanGenerator = PlanGenerator;
window.toggleCuestionario = () => PlanGenerator.toggleCuestionario();
window.generarCalendarioEntreno = () => PlanGenerator.generarCalendarioEntreno();
window.validarOpcionesPlan = () => PlanGenerator.validarOpcionesPlan();
window.mostrarUltimoPlanGuardado = () => PlanGenerator.mostrarUltimoPlanGuardado();
window.borrarPlanGuardado = () => PlanGenerator.borrarPlanGuardado();
window.cambiarTrimestre = async (delta) => { await PlanGenerator.cambiarTrimestre(delta); };

window.cerrarModalSesion = () => {
  const modalSesionEl = document.getElementById("detalleSesion");
  const wrapperEl = document.getElementById("modalColorWrapper");
  if (modalSesionEl) modalSesionEl.scrollTop = 0;
  if (wrapperEl) wrapperEl.scrollTop = 0;
  modalSesionEl?.classList.remove("visible");
  document.getElementById("modalOverlay")?.classList.remove("visible");
  AppState.currentSesionDetalle = null;
};

console.log('✅ PlanGenerator v2.65 - Fix: orden de sesiones por diaGlobal para táctil correcto');