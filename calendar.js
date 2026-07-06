// ==================== calendar.js - VERSIÓN COMPLETA CORREGIDA ====================
// Versión: 2.50 - Corregido: al desmarcar sesión GPS, resta distancia real (no la estimada)
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
    { intensidad: 0.8, volumen: 1.2 },
    { intensidad: 1.0, volumen: 1.0 },
    { intensidad: 1.2, volumen: 0.8 },
    { intensidad: 0.9, volumen: 0.9 }
  ],

  DISTRIBUCION_TIPOS: {
    principiante: {
      base: { rodaje: 0.8, tempo: 0.1, series: 0.0, largo: 0.1 },
      construccion: { rodaje: 0.7, tempo: 0.15, series: 0.05, largo: 0.1 },
      especifica: { rodaje: 0.6, tempo: 0.2, series: 0.1, largo: 0.1 },
      pico: { rodaje: 0.5, tempo: 0.25, series: 0.15, largo: 0.1 },
      taper: { rodaje: 0.8, tempo: 0.1, series: 0.0, largo: 0.1 }
    },
    intermedio: {
      base: { rodaje: 0.7, tempo: 0.15, series: 0.05, largo: 0.1 },
      construccion: { rodaje: 0.6, tempo: 0.2, series: 0.1, largo: 0.1 },
      especifica: { rodaje: 0.5, tempo: 0.2, series: 0.2, largo: 0.1 },
      pico: { rodaje: 0.4, tempo: 0.25, series: 0.25, largo: 0.1 },
      taper: { rodaje: 0.7, tempo: 0.15, series: 0.05, largo: 0.1 }
    },
    avanzado: {
      base: { rodaje: 0.6, tempo: 0.2, series: 0.1, largo: 0.1 },
      construccion: { rodaje: 0.5, tempo: 0.2, series: 0.2, largo: 0.1 },
      especifica: { rodaje: 0.4, tempo: 0.2, series: 0.3, largo: 0.1 },
      pico: { rodaje: 0.3, tempo: 0.25, series: 0.35, largo: 0.1 },
      taper: { rodaje: 0.6, tempo: 0.2, series: 0.1, largo: 0.1 }
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

  _buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados, metricasExtra = {}) {
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
    const metricas = this.calcularMetricasSesion({ tipo, duracion, detalle, factorIntensidad: 1.0 });
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

  async crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null, esRecuperacion = false) {
    const { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo } = datos;
    const dbTipo = this.ENTRENAMIENTOS[modalidad]?.[distancia]?.[nivel]?.[tipo];
    let sesionMatriz = null;
    if (dbTipo?.length) {
      const ultima = this.ultimaSesionPorTipo[tipo];
      let candidatas = dbTipo;
      if (ultima) candidatas = dbTipo.filter(s => s.nombre !== ultima);
      if (candidatas.length === 0) candidatas = dbTipo;
      sesionMatriz = candidatas[Math.floor(Math.random() * candidatas.length)];
      this.ultimaSesionPorTipo[tipo] = sesionMatriz.nombre;
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
      const max = this.getMaximosPorTipo(tipo, nivel, fase, distancia);
      if (max) duracion = Math.min(duracion, max);
      const min = (semanaEnFase % 4 === 0 || fase === 'TAPER') ? 35 : 45;
      duracion = Math.max(duracion, min);
    } else {
      duracion = sesionMatriz.duracion || 45;
      duracion = Math.round(duracion * factorVolumen);
      const max = this.getMaximosPorTipo(tipo, nivel, fase, distancia);
      if (max) duracion = Math.min(duracion, max);
      const min = (semanaEnFase % 4 === 0 || fase === 'TAPER') ? 35 : 45;
      duracion = Math.max(duracion, min);
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
    return this._buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados);
  },

  async crearSesionAvanzadaSeries(estructura, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta) {
    const { modalidad, distancia, ritmoBase, fcUmbral } = datos;
    let duracion = duracionExacta || 50;
    const maxSeries = this.getMaximosPorTipo('series', nivel, fase, distancia);
    duracion = Math.min(duracion, maxSeries);
    const minSeries = (fase === 'TAPER') ? 35 : 45;
    duracion = Math.max(duracion, minSeries);
    const { calentamiento, enfriamiento, partePrincipal: partePrincipalMin } = this._calcularCalentamientoEnfriamiento(duracion);
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
        const tiempoSeriesBase = baseDistancias.reduce((acc, d) => acc + (d / 1000) * ritmoRapidoSeg, 0);
        let factor = partePrincipalSeg / tiempoSeriesBase;
        let distancias = [];
        if (factor >= 0.8 && factor <= 1.2) {
          distancias = [...baseDistancias];
        } else if (factor < 0.8) {
          if (factor < 0.5) distancias = [200, 400, 200];
          else if (factor < 0.7) distancias = [200, 400, 400, 200];
          else distancias = [200, 400, 600, 400, 200];
        } else {
          const repeticiones = Math.floor(factor);
          if (repeticiones >= 2) {
            distancias = [];
            for (let r = 0; r < repeticiones; r++) distancias.push(...baseDistancias);
          } else {
            distancias = baseDistancias.map(d => Math.round(d * factor));
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
        metricasExtra = { tipoEstructura: 'piramide', distancias, ritmoSerie: this.obtenerRitmoParaZona('Z5'), ritmoRecuperacion: this.obtenerRitmoParaZona('Z2'), recuperaciones, tiempoEnZona: Utils.formatR(tiempoSeries / 60) };
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

        const tiempoPorSerie = (distanciaSerie / 1000) * ritmoRapidoSeg;
        let tiempoSeriesBase = repPorBloque * bloques * tiempoPorSerie;
        let tiempoRecIntraBase = (repPorBloque - 1) * recIntra * bloques;
        let tiempoRecEntreBase = recEntreBloques * (bloques - 1);
        let totalBase = tiempoSeriesBase + tiempoRecIntraBase + tiempoRecEntreBase;
        let factor = partePrincipalSeg / totalBase;

        if (factor > 1.2) {
          bloques = Math.min(4, Math.floor(bloques * factor));
          if (bloques < 2) bloques = 2;
          tiempoSeriesBase = repPorBloque * bloques * tiempoPorSerie;
          tiempoRecIntraBase = (repPorBloque - 1) * recIntra * bloques;
          tiempoRecEntreBase = recEntreBloques * (bloques - 1);
          totalBase = tiempoSeriesBase + tiempoRecIntraBase + tiempoRecEntreBase;
          factor = partePrincipalSeg / totalBase;
        }

        if (factor < 0.8) {
          if (distanciaSerie > 200) distanciaSerie = Math.max(200, distanciaSerie - 200);
          distanciaSerie = this._redondearDistancia(distanciaSerie);
          recIntra = distanciaSerie <= 400 ? 60 : (distanciaSerie <= 800 ? 90 : 120);
          recIntra = this._redondearTiempo(recIntra);
          const tiempoPorSerieAjustado = (distanciaSerie / 1000) * ritmoRapidoSeg;
          let tiempoSeries = repPorBloque * bloques * tiempoPorSerieAjustado;
          let tiempoRecIntra = (repPorBloque - 1) * recIntra * bloques;
          let tiempoRecEntre = recEntreBloques * (bloques - 1);
          let total = tiempoSeries + tiempoRecIntra + tiempoRecEntre;
          let nuevoFactor = partePrincipalSeg / total;
          if (nuevoFactor < 0.8) {
            repPorBloque = Math.max(2, repPorBloque - 1);
            tiempoSeries = repPorBloque * bloques * tiempoPorSerieAjustado;
            tiempoRecIntra = (repPorBloque - 1) * recIntra * bloques;
            total = tiempoSeries + tiempoRecIntra + tiempoRecEntre;
            nuevoFactor = partePrincipalSeg / total;
          }
          totalBase = total;
          factor = nuevoFactor;
        }

        distanciaSerie = this._redondearDistancia(distanciaSerie);
        recIntra = this._redondearTiempo(recIntra);
        const tiempoPorSerieReal = (distanciaSerie / 1000) * ritmoRapidoSeg;
        const tiempoSeriesReal = repPorBloque * bloques * tiempoPorSerieReal;
        const tiempoRecIntraReal = (repPorBloque - 1) * recIntra * bloques;
        const tiempoRecEntreReal = recEntreBloques * (bloques - 1);
        let totalPartePrincipalReal = tiempoSeriesReal + tiempoRecIntraReal + tiempoRecEntreReal;
        totalPartePrincipalReal = this._redondearDuracionPartePrincipal(totalPartePrincipalReal);
        partePrincipalSeg = totalPartePrincipalReal;

        const minutosPP = Math.floor(totalPartePrincipalReal / 60);
        const segundosPP = Math.round(totalPartePrincipalReal % 60);
        const duracionPartePrincipalR = `${minutosPP}:${segundosPP.toString().padStart(2, '0')}`;

        accion = `Parte principal (${duracionPartePrincipalR} minutos): ${bloques} bloques de ${repPorBloque}x${distanciaSerie}m a ritmo rápido – Z4-Z5 – con recuperación de ${recIntra}" entre series y ${Math.floor(recEntreBloques/60)}' entre bloques (recuperación activa Z2).`;
        porque = 'Aumenta la capacidad de mantener el ritmo rápido bajo fatiga.';
        pasosDetallados = this._pasosBasicos(calentamiento, minutosPP, enfriamiento, accion, porque);
        metricasExtra = {
          tipoEstructura: 'rotas', distanciaSerie, repeticionesPorBloque: repPorBloque, bloques, recIntra, recEntreBloques,
          ritmoSerie: this.obtenerRitmoParaZona('Z5'), ritmoRecuperacion: this.obtenerRitmoParaZona('Z2'),
          tiempoEnZona: Utils.formatR(tiempoSeriesReal / 60)
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
          tiempoEnZona: Utils.formatR(segundosFuertes / 60)
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
          ritmoRepeticion: this.obtenerRitmoParaZona('Z5'), tiempoEnZona: Utils.formatR(partePrincipalSeg / 60)
        };
        break;
      }
      default:
        return this.crearSesionBasica('series', fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta);
    }

    const estructuraDetallada = `${calentamiento}' calentamiento + ${accion} + ${enfriamiento}' enfriamiento`;
    const datosBasicos = {
      nombre, descripcion, estructura: estructuraDetallada, sensacion: 'Muy intenso', zonaPrincipal: zona, duracion,
      ritmoObjetivo: this.obtenerRitmoParaZona('Z5'), fcObjetivo: '',
      calentamiento, partePrincipal: Math.floor(partePrincipalSeg / 60), enfriamiento, objetivo: nombre, porque
    };
    return this._buildSesionDetalle('series', fase, datosBasicos, pasosDetallados, metricasExtra);
  },

  async crearSesionDesdeMatriz(sesionBase, esActivo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null) {
    const { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo } = datos;
    const tipo = sesionBase.tipo;
    const esSimulacion = sesionBase.esSimulacion || false;
    const esRecuperacion = sesionBase.esRecuperacion || false;

    if (esSimulacion && tipo === 'largo' && (fase === 'ESPECIFICA' || fase === 'PICO')) {
      return this.crearSesionSimulacion(fase, semanaEnFase, nivel, datos, duracionExacta);
    }

    if (tipo === 'series' && (nivel !== 'principiante' || fase !== 'BASE')) {
      const estructuras = ['piramide', 'rotas', 'fartlek', 'cuestas'];
      let estructura = estructuras[Math.floor(Math.random() * estructuras.length)];
      if (modalidad === 'trail' && Math.random() < 0.5) estructura = 'cuestas';
      return this.crearSesionAvanzadaSeries(estructura, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta);
    }

    return this.crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta, esRecuperacion);
  },

  crearSesionSimulacion(fase, semanaEnFase, nivel, datos, duracionExacta) {
    const { distancia, ritmoBase, fcUmbral, modalidad } = datos;
    let duracion = duracionExacta || 90;
    const maxLargo = this.getMaximosPorTipo('largo', nivel, fase, distancia);
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

    const metricas = this.calcularMetricasSesion({ tipo: 'largo', duracion, detalle, factorIntensidad: 1.0 });
    detalle.distanciaEstimada = metricas.distanciaTotal;
    detalle.tssEstimada = metricas.tssTotal;

    return { tipo: 'largo', duracion, detalle };
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
      const ritmoSuaveSegGen = ritmoBase * 1.25 / factorIntensidad * 60;
      const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
      const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
      const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
      const zona = detalle.zona?.split('-')[0] || 'Z4';
      const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
      const ifactor = factoresIF[zona] || 0.9;
      const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
      return { distanciaTotal, tssTotal };
    }
    
    if (detalle.tipoEstructura === 'piramide' && detalle.distancias && detalle.ritmoSerie) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoSerie);
      let distanciaSeries = 0;
      detalle.distancias.forEach(d => distanciaSeries += d / 1000);
      const distanciaPartePrincipal = distanciaSeries;
      const ritmoSuaveSegGen = ritmoBase * 1.25 / factorIntensidad * 60;
      const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
      const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
      const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
      const zona = detalle.zona?.split('-')[0] || 'Z4';
      const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
      const ifactor = factoresIF[zona] || 0.9;
      const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
      return { distanciaTotal, tssTotal };
    }

    if (detalle.tipoEstructura === 'rotas' && detalle.distanciaSerie && detalle.repeticionesPorBloque && detalle.bloques) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoSerie);
      const distanciaPorSerie = detalle.distanciaSerie / 1000;
      const totalSeries = detalle.repeticionesPorBloque * detalle.bloques;
      const distanciaPartePrincipal = distanciaPorSerie * totalSeries;
      const ritmoSuaveSegGen = ritmoBase * 1.25 / factorIntensidad * 60;
      const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
      const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
      const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
      const zona = detalle.zona?.split('-')[0] || 'Z4';
      const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
      const ifactor = factoresIF[zona] || 0.9;
      const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
      return { distanciaTotal, tssTotal };
    }

    if (detalle.tipoEstructura === 'cuestas' && detalle.numRepeticiones) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoRepeticion);
      const tiempoTotalCuestas = detalle.numRepeticiones * detalle.duracionRepeticion;
      const distanciaPartePrincipal = tiempoTotalCuestas / ritmoSerieSeg;
      const ritmoSuaveSegGen = ritmoBase * 1.25 / factorIntensidad * 60;
      const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
      const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
      const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
      const zona = detalle.zona?.split('-')[0] || 'Z4';
      const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
      const ifactor = factoresIF[zona] || 0.9;
      const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
      return { distanciaTotal, tssTotal };
    }

    const zona = detalle.zona?.split('-')[0] || 'Z2';
    const factoresRitmo = { 'Z1': 1.35, 'Z2': 1.25, 'Z3': 1.15, 'Z4': 1.05, 'Z5': 0.95 };
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
    const factorRitmo = factoresRitmo[zona] || 1.25;
    const ritmoMin = ritmoBase * factorRitmo / factorIntensidad;
    const distanciaTotal = sesion.duracion / ritmoMin;
    const ifactor = factoresIF[zona] || 0.7;
    const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
    return { distanciaTotal, tssTotal };
  },

  getOndulatoryFactor(semanaGlobal, semanasTotales, fase) {
    if (fase === 'TAPER') return { intensidad: 0.6, volumen: 0.7 };
    const ciclo = (semanaGlobal - 1) % 4;
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
      series: 120,
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
    } else if (distancia === '5k') {
      if (tipo === 'largo') max = Math.min(max, 90);
      if (tipo === 'series') max = Math.min(max, 75);
    } else if (distancia === '10k') {
      if (tipo === 'largo') max = Math.min(max, 120);
      if (tipo === 'series') max = Math.min(max, 90);
    } else if (distancia === 'medio') {
      if (tipo === 'largo') max = Math.min(max, 150);
      if (tipo === 'series') max = Math.min(max, 120);
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
    const base = { principiante: 210, intermedio: 360, avanzado: 480 };
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

  _garantizarLargoMaximo(tiposPorDia, diaLargo) {
    const largoMinutos = tiposPorDia[diaLargo].minutos;
    for (let dia in tiposPorDia) {
      const sesion = tiposPorDia[dia];
      if (sesion.tipo === 'rodaje' && sesion.minutos > largoMinutos) {
        sesion.minutos = Math.min(sesion.minutos, Math.floor(largoMinutos * 0.8));
        sesion.minutos = Math.max(20, sesion.minutos);
      }
    }
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
      Utils.showLoading();
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
        Utils.showToast(`> PARA ${distancia === 'maraton' ? 'MARATÓN' : 'MEDIA'} NECESITAS MÍNIMO ${diasMinimos} DÍAS_`, 'error');
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
      const diaSemana = ahora.getDay();
      let diasHastaLunes = (diaSemana === 0 ? 1 : 8 - diaSemana) % 7;
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() + diasHastaLunes);
      fechaInicio.setHours(0, 0, 0, 0);

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

      this.ultimaSesionPorTipo = {};

      for (let semanaGlobal = 1; semanaGlobal <= semanasTotales; semanaGlobal++) {
        const faseInfo = this.obtenerFaseSemana(fases, semanaGlobal);
        const { fase, semanaEnFase, duracionFase } = faseInfo;
        const nivelActual = this.calcularNivelSemana(semanaGlobal, nivel, semanasTotales);

        const { intensidad: intensidadOnd, volumen: volumenOnd } = this.getOndulatoryFactor(semanaGlobal, semanasTotales, fase);
        let volumenSemanaBase = this.calcularVolumenSemanal(nivelActual, experiencia, objetivo, distancia);
        volumenSemanaBase = Math.round(volumenSemanaBase * volumenOnd * ajusteVolumen);
        let volumenSemana = Math.round(volumenSemanaBase);
        volumenSemana = Math.min(720, Math.max(180, volumenSemana));

        const intensidadTotal = ajusteIntensidad * intensidadOnd;

        const distribucion = distribucionPersonalizada[nivelActual][fase.toLowerCase()];
        let minutosPorTipo = {
          rodaje: Math.round(volumenSemana * distribucion.rodaje),
          tempo: Math.round(volumenSemana * distribucion.tempo),
          series: Math.round(volumenSemana * distribucion.series),
          largo: Math.round(volumenSemana * distribucion.largo)
        };
        let suma = minutosPorTipo.rodaje + minutosPorTipo.tempo + minutosPorTipo.series + minutosPorTipo.largo;
        if (suma !== volumenSemana) {
          const diff = volumenSemana - suma;
          minutosPorTipo.rodaje += diff;
        }

        const minSeries = (fase === 'TAPER') ? 35 : 45;
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

        const tiposCalidad = [];
        if (minutosPorTipo.tempo > 0) tiposCalidad.push({ tipo: 'tempo', minutos: minutosPorTipo.tempo });
        if (minutosPorTipo.series > 0) tiposCalidad.push({ tipo: 'series', minutos: minutosPorTipo.series });
        
        let diasLibres = [...diasDisponibles];
        if (tiposCalidad.length > 0 && diasLibres.length > 0) {
          const numCalidad = tiposCalidad.length;
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
          for (let i = 0; i < tiposCalidad.length; i++) {
            const dia = diasLibres[indicesAsignados[i]];
            const calidad = tiposCalidad[i];
            const max = this.getMaximosPorTipo(calidad.tipo, nivelActual, fase, distancia);
            const minutosDia = Math.min(calidad.minutos, max);
            tiposPorDia[dia] = { tipo: calidad.tipo, minutos: minutosDia };
            calidad.minutos -= minutosDia;
          }
          diasLibres = diasLibres.filter((_, idx) => !indicesAsignados.includes(idx));
        }

        let minutosRodajeTotal = minutosPorTipo.rodaje;
        tiposCalidad.forEach(q => { if (q.minutos > 0) minutosRodajeTotal += q.minutos; });
        const numDiasRodaje = diasLibres.length;
        if (numDiasRodaje > 0 && minutosRodajeTotal > 0) {
          const maxRodaje = this.getMaximosPorTipo('rodaje', nivelActual, fase, distancia);
          const minRodaje = 35;
          let valores = [];
          let sumaValores = 0;
          let valorBase = minutosRodajeTotal / numDiasRodaje;
          for (let i = 0; i < numDiasRodaje; i++) {
            let variacion = 0.9 + Math.random() * 0.2;
            let valor = Math.round(valorBase * variacion);
            valor = Math.min(maxRodaje, Math.max(minRodaje, valor));
            valores.push(valor);
            sumaValores += valor;
          }
          if (sumaValores !== minutosRodajeTotal) {
            const diff = minutosRodajeTotal - sumaValores;
            for (let i = 0; i < Math.abs(diff); i++) {
              let idx = i % valores.length;
              valores[idx] += Math.sign(diff);
              valores[idx] = Math.min(maxRodaje, Math.max(minRodaje, valores[idx]));
            }
          }
          for (let i = 0; i < numDiasRodaje; i++) {
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

        if (tiposPorDia[diaLargo]) {
          const largoMinutos = tiposPorDia[diaLargo].minutos;
          for (let dia in tiposPorDia) {
            const sesion = tiposPorDia[dia];
            if ((sesion.tipo === 'tempo' || sesion.tipo === 'series') && sesion.minutos > largoMinutos) {
              let nuevoMinutos = Math.max(20, largoMinutos - 5);
              if (nuevoMinutos >= largoMinutos) nuevoMinutos = largoMinutos - 1;
              console.warn(`⚠️ Ajustando ${sesion.tipo} de ${sesion.minutos}' a ${nuevoMinutos}' porque superaba la tirada larga (${largoMinutos}')`);
              sesion.minutos = nuevoMinutos;
            }
          }
        }

        this._ajustarDiaPostLargo(tiposPorDia, diaLargo, diasEntreno);
        this._garantizarLargoMaximo(tiposPorDia, diaLargo);
        this._mejorarDistribucionCalidad(tiposPorDia, diasEntreno, diaLargo);

        const diasFuerza = this.seleccionarDiasFuerza(tiposPorDia, diaLargo);

        const semana = [];
        for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
          if (!diasEntreno.includes(diaSemana)) {
            semana.push({
              diaGlobal: diaGlobalCounter++,
              semana: semanaGlobal,
              diaSemana,
              fase,
              nivel: nivelActual,
              tipo: 'descanso',
              color: this.getColor('descanso'),
              letra: this.getLetra('descanso'),
              detalle: null,
              tieneFuerza: false
            });
          } else {
            const info = tiposPorDia[diaSemana];
            if (!info) {
              semana.push({
                diaGlobal: diaGlobalCounter++,
                semana: semanaGlobal,
                diaSemana,
                fase,
                nivel: nivelActual,
                tipo: 'descanso',
                color: this.getColor('descanso'),
                letra: this.getLetra('descanso'),
                detalle: null,
                tieneFuerza: false
              });
              continue;
            }
            const { tipo, minutos, esSimulacion, esRecuperacion } = info;
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
            semana.push({
              diaGlobal: diaGlobalCounter++,
              semana: semanaGlobal,
              diaSemana,
              fase,
              nivel: nivelActual,
              tipo,
              color: this.getColor(tipo),
              letra: this.getLetra(tipo),
              tieneFuerza: false,
              ...sesion
            });
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
      const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      document.getElementById("resumenObjetivo").innerHTML = `
        <strong>${mapaDist[distancia]}</strong> · ${diasEntreno.length} DÍAS/SEMANA<br>
        <span style="color: var(--text-secondary); font-size: 13px;">
          ${nivel.toUpperCase()} · OBJ: ${objetivo.toUpperCase()} · 
          🏆 TIRADA LARGA: <strong>${nombreDiaLargo}</strong>
        </span>
        <div style="margin-top: 8px; font-size: 12px; color: var(--accent-yellow);">
          📅 El plan comienza el <strong>${fechaInicioFormateada}</strong> (LUNES)
        </div>
      `;

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

  mostrarCalendario(sesiones) {
    const grid = document.getElementById("calendarioGrid");
    const navegacion = document.getElementById("calendarioNavegacion");
    if (!grid) return;

    // Fecha real de inicio del plan (ya se genera y se guarda al crear el
    // plan). A partir de aquí, cada sesión tiene una fecha real de
    // calendario: fechaInicio + (diaGlobal - 1) días.
    const fechaInicioStr = AppState.planGeneradoActual?.fechaInicio;
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    this._fechaInicioPlan = fechaInicio;
    this._sesionesActuales = sesiones;

    this._sesionesPorFecha = {};
    let ultimoDiaGlobal = 0;
    sesiones.forEach(s => {
      if (!s || !s.diaGlobal) return;
      const f = new Date(fechaInicio);
      f.setDate(f.getDate() + (s.diaGlobal - 1));
      this._sesionesPorFecha[this._dateKey(f)] = s;
      if (s.diaGlobal > ultimoDiaGlobal) ultimoDiaGlobal = s.diaGlobal;
    });
    const fechaFinPlan = new Date(fechaInicio);
    fechaFinPlan.setDate(fechaFinPlan.getDate() + Math.max(ultimoDiaGlobal - 1, 0));
    this._fechaFinPlan = fechaFinPlan;

    // Mes a mostrar: si hoy cae dentro del plan, el mes de hoy; si no, el
    // primer mes del plan. Solo se decide una vez por apertura de plan.
    if (!AppState.calendarioMesActual) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const dentroDelPlan = hoy >= fechaInicio && hoy <= fechaFinPlan;
      const base = dentroDelPlan ? hoy : fechaInicio;
      AppState.calendarioMesActual = new Date(base.getFullYear(), base.getMonth(), 1).toISOString();
    }

    navegacion.style.display = 'flex';
    this.renderizarMes();

    const puedeVerDetalle = AppState.puedeVerDetalleSesion();
    if (!puedeVerDetalle) {
      const notaPlan = document.querySelector('.nota-plan');
      if (notaPlan) {
        const msgAnterior = document.querySelector('.premium-expired-message');
        if (msgAnterior) msgAnterior.remove();
        const msgExpirado = document.createElement('div');
        msgExpirado.className = 'premium-expired-message';
        msgExpirado.innerHTML = '⚠️ Versión gratuita: puedes ver detalles de las primeras 2 semanas. <button onclick="showPremiumBenefits()">HAZTE PREMIUM</button>';
        notaPlan.parentNode.insertBefore(msgExpirado, notaPlan.nextSibling);
      }
    }
  },

  _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  renderizarMes() {
    const grid = document.getElementById("calendarioGrid");
    if (!grid || !AppState.calendarioMesActual) return;
    const mes = new Date(AppState.calendarioMesActual);
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    // Lunes=0 ... Domingo=6 (getDay() da Domingo=0)
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

      const realizada = AppState.sesionesRealizadas?.[sesion.diaGlobal] ? 'realizado' : '';
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
    // Límites de navegación: no dejar ir a meses fuera del rango del plan.
    if (anteriorBtn && this._fechaInicioPlan) {
      const limiteAnterior = new Date(this._fechaInicioPlan.getFullYear(), this._fechaInicioPlan.getMonth(), 1);
      anteriorBtn.disabled = primerDiaMes <= limiteAnterior;
    }
    if (siguienteBtn && this._fechaFinPlan) {
      const limiteSiguiente = new Date(this._fechaFinPlan.getFullYear(), this._fechaFinPlan.getMonth(), 1);
      siguienteBtn.disabled = primerDiaMes >= limiteSiguiente;
    }

    document.querySelectorAll('.calendario-dia[data-dia-global]').forEach(diaEl => {
      diaEl.addEventListener('click', (e) => {
        const diaGlobal = parseInt(e.currentTarget.dataset.diaGlobal);
        const sesion = sesiones[diaGlobal - 1];
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

  actualizarNavegacionTrimestral(totalPaginas) {
    // Mantenido solo por compatibilidad con llamadas antiguas; la
    // navegación real ahora la gestiona renderizarMes().
    this.renderizarMes();
  },

  async cambiarTrimestre(delta) {
    // Se mantiene el nombre "cambiarTrimestre" para no tener que tocar el
    // onclick del HTML, pero ahora navega por MESES reales del calendario
    // en vez de páginas de 12 semanas.
    if (!AppState.calendarioMesActual) return;
    const actual = new Date(AppState.calendarioMesActual);
    const nuevo = new Date(actual.getFullYear(), actual.getMonth() + delta, 1);
    AppState.calendarioMesActual = nuevo.toISOString();
    this.renderizarMes();
    if (window.UI) UI.guardarEstado();
  },

  abrirDetalleSesion(sesion, diaIndex) {
    console.log('abrirDetalleSesion llamado', sesion, diaIndex);
    if (!sesion) {
      console.error('Sesión no encontrada para índice', diaIndex);
      return;
    }
    if (!AppState.puedeVerDetalleSesion()) {
      Utils.showToast('⭐ Premium necesario para ver detalles de sesiones', 'warning');
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
    wrapper.className = "modal-content";
    if (sesion.tipo !== 'descanso' && sesion.detalle) {
      wrapper.classList.add(sesion.color);
      let icono = "";
      if (sesion.tipo === 'rodaje') icono = "🏃‍♂️";
      else if (sesion.tipo === 'tempo') icono = "⚡";
      else if (sesion.tipo === 'series') icono = "🔁";
      else if (sesion.tipo === 'largo') icono = "📏";
      const faseTexto = sesion.fase ? ` · ${this.FASES[sesion.fase]?.nombre || sesion.fase}` : '';
      titulo.innerText = `${icono} ${sesion.tipo.toUpperCase()}${faseTexto}: ${sesion.detalle.nombre}`;
      const metricas = this.calcularMetricasSesion(sesion);
      const tiempoTotal = this.formatearTiempo(sesion.duracion);
      
      const zonaMostrada = sesion.detalle.zona || '—';
      const tiempoEnZonaMostrado = sesion.detalle.tiempoEnZona ? `${sesion.detalle.tiempoEnZona} min` : '—';
      
      const headerHTML = `
        <div class="sesion-resumen-horizontal">
          <div class="resumen-item"><span>🕒</span> ${tiempoTotal}</div>
          <div class="resumen-item"><span>📏</span> ${metricas.distanciaTotal.toFixed(2)} km</div>
          <div class="resumen-item"><span>⚡</span> ${metricas.tssTotal} TSS</div>
          <div class="resumen-item"><span>🔥 ${zonaMostrada}</span> ${tiempoEnZonaMostrado}</div>
        </div>
      `;
      const objetivoHTML = `
        <div class="sesion-objetivo-principal">
          <h4>🎯 OBJETIVO PRINCIPAL</h4>
          <p><strong>${Utils.escapeHTML(sesion.detalle.objetivo || 'Sesión de calidad')}</strong></p>
          <p class="porque">${Utils.escapeHTML(sesion.detalle.porque || '')}</p>
        </div>
      `;
      const zonasHTML = `
        <div class="sesion-zonas">
          <div class="zona-item"><span>⏱️ Ritmo</span><strong>${Utils.escapeHTML(sesion.detalle.ritmoObjetivo)}</strong></div>
          <div class="zona-item"><span>😌 Sensación</span><strong>${Utils.escapeHTML(sesion.detalle.sensacion)}</strong></div>
          <div class="zona-item"><span>📊 Zona</span><strong>${Utils.escapeHTML(sesion.detalle.zona)}</strong></div>
        </div>
      `;
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
      
      if (window.GPSTracker) {
        const gpsBtn = document.createElement('button');
        gpsBtn.id = 'gpsStartBtn';
        gpsBtn.style.cssText = [
          'margin-top:18px', 'width:100%', 'height:54px',
          'background:linear-gradient(135deg,#181818,#222)',
          'border:2px solid #c0a060', 'color:#c0a060',
          'font-size:15px', 'font-weight:bold', 'letter-spacing:1px',
          'border-radius:14px', 'cursor:pointer',
          "font-family:'Courier New',monospace",
          'display:flex', 'align-items:center',
          'justify-content:center', 'gap:10px',
          'transition:all 0.2s ease'
        ].join(';');
        gpsBtn.innerHTML = '📍 INICIAR SESIÓN CON GPS';
        gpsBtn.addEventListener('mouseenter', () => {
          gpsBtn.style.background = '#c0a060';
          gpsBtn.style.color = '#0a0a0a';
        });
        gpsBtn.addEventListener('mouseleave', () => {
          gpsBtn.style.background = 'linear-gradient(135deg,#181818,#222)';
          gpsBtn.style.color = '#c0a060';
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
        
        gpsBtn.addEventListener('click', () => GPSTracker.iniciar(sesionLimpia, diaIndex));
        descripcion.appendChild(gpsBtn);
      }
      
      checkboxContainer.style.display = 'flex';
      checkbox.checked = AppState.sesionesRealizadas?.[diaIndex] || false;
      checkbox.onchange = async (e) => { await this.marcarSesionRealizada(diaIndex, e.target.checked); };
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
    if (!firebaseServices.db) return;
    try {
      // Esta limpieza YA NO controla qué se ve en el muro (eso ahora lo
      // hace un filtro de fecha en Wall.cargarMuro, que solo pide hoy y
      // ayer) ni afecta a las estadísticas semanales del dashboard. Es
      // solo higiene de la base de datos a largo plazo: se borra lo
      // realmente antiguo (90 días) para que la colección no crezca sin
      // límite, con margen de sobra para que nada que se esté usando se
      // borre por error.
      const limiteRetencion = new Date();
      limiteRetencion.setDate(limiteRetencion.getDate() - 90);
      limiteRetencion.setHours(0, 0, 0, 0);
      const limiteTimestamp = firebaseServices.Timestamp.fromDate(limiteRetencion);
      
      const antiguas = await firebaseServices.db
        .collection('globalFeed')
        .where('timestamp', '<', limiteTimestamp)
        .get();
      
      const batch = firebaseServices.db.batch();
      antiguas.forEach(doc => {
        batch.delete(doc.ref);
      });
      if (antiguas.size > 0) {
        await batch.commit();
        console.log(`🗑️ Muro limpiado: se eliminaron ${antiguas.size} entradas de más de 90 días.`);
      }
    } catch (error) {
      console.error('Error limpiando muro global:', error);
    }
  },

  // ==================== FUNCIÓN MARCAR SESIÓN REALIZADA (CORREGIDA) ====================
  async marcarSesionRealizada(diaIndex, realizada, realDistance = null, realDurationMs = null) {
    if (!AppState.currentUserId || !AppState.planActualId) return;
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
        if (realizada) celda.classList.add('realizado');
        else celda.classList.remove('realizado');
      }
      
      const planDoc = await planRef.get();
      const planCompleto = planDoc.data();
      const sesion = planCompleto.sesiones[diaIndex - 1];
      
      if (realizada) {
        // ---------- MARCADO ----------
        await this.limpiarMuroGlobal();
        if (sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          let metricas;
          let distanciaUsada;
          let duracionUsadaMs;
          
          if (realDistance !== null && realDurationMs !== null) {
            distanciaUsada = realDistance;
            duracionUsadaMs = realDurationMs;
            metricas = {
              distanciaTotal: realDistance,
              tssTotal: this.calcularTSSdesdeReal(realDistance, realDurationMs, sesion)
            };
          } else {
            metricas = this.calcularMetricasSesion(sesion);
            distanciaUsada = metricas.distanciaTotal;
            duracionUsadaMs = sesion.duracion * 60 * 1000;
          }
          
          const userData = AppState.currentUserData;
          const distancia = isFinite(distanciaUsada) ? distanciaUsada : 0;
          const tss = isFinite(metricas.tssTotal) ? metricas.tssTotal : 0;

          // Fecha REAL programada de la sesión (fechaInicio + diaGlobal-1),
          // distinta del "timestamp" (que es el momento exacto en que se
          // pulsa el check). Si marcas hoy una sesión de hace unos días
          // (poniéndote al día), 'timestamp' sería "ahora" y "última sesión"
          // mostraría "Hoy" aunque esa sesión fuera de otro día.
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
            trainingType: sesion.tipo,
            duration: Math.floor(duracionUsadaMs / 60000),
            distancia: distancia,
            tss: tss,
            timestamp: firebaseServices.Timestamp.now(),
            fechaSesion: fechaSesionReal ? firebaseServices.Timestamp.fromDate(fechaSesionReal) : firebaseServices.Timestamp.now(),
            planId: AppState.planActualId,
            sesionIndex: diaIndex,
            likes: [],
            likeCount: 0,
            zone: sesion.detalle.zona || '',
            trainingName: sesion.detalle.nombre || ''
          };
          
          if (realDistance !== null && realDurationMs !== null) {
            entry.hasGPS = true;
          }
          
          try {
            const globalRef = await firebaseServices.db.collection('globalFeed').add(entry);
            await planRef.update({ [`wallEntryId.${diaIndex}`]: globalRef.id });
            // 'última sesión' (en Inicio) se lee de este campo, NO de
            // globalFeed: globalFeed tiene una limpieza a largo plazo (90
            // días) y el muro solo muestra hoy/ayer, así que si "última
            // sesión" dependiera de ahí, se "resetearía" en cuanto esa
            // sesión dejara de estar en el rango visible (por ejemplo, cada
            // lunes). Aquí se guarda de forma permanente en el propio
            // usuario, para que "la última es la última" sin caducar nunca.
            await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
              ultimaSesion: entry
            });
            if (AppState.currentUserData) {
              AppState.currentUserData.ultimaSesion = entry;
            }
          } catch (err) {
            console.error('Error al guardar en muro:', err);
            Utils.showToast('Error al publicar en el muro', 'error');
          }
          
          if (window.Gamification) {
            try {
              const oldData = await Gamification.getData(AppState.currentUserId);
              const oldLevel = oldData.level;
              await Gamification.updateAfterSession(AppState.currentUserId, sesion, metricas);
              const newData = await Gamification.getData(AppState.currentUserId);
              const newLevel = newData.level;
              if (newLevel !== oldLevel) {
                console.log(`🎉 Nivel cambiado de ${oldLevel} a ${newLevel}. Refrescando UI...`);
                if (Gamification.clearCache) await Gamification.clearCache(AppState.currentUserId);
                if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
                if (document.getElementById('tab-amigos').classList.contains('active') && window.Friends) {
                  await Friends.cargarListaAmigos(true);
                  const activeAmigosTab = document.querySelector('.amigos-tab.active');
                  if (activeAmigosTab && activeAmigosTab.textContent.includes('BUSCAR')) await Friends.cargarTodosUsuarios(true);
                }
                if (document.getElementById('tab-muro').classList.contains('active') && window.Wall) Wall.cargarMuro();
              }
            } catch (e) { console.error('Error actualizando gamificación:', e); }
          }
        }
      } else {
        // ---------- DESMARCADO (CORREGIDO) ----------
        const planData = planDoc.data();
        const wallEntryId = planData?.wallEntryId?.[diaIndex];
        let distanciaReal = null;
        
        // 1. Obtener la distancia real del muro ANTES de eliminarlo
        if (wallEntryId) {
          try {
            const wallDoc = await firebaseServices.db.collection('globalFeed').doc(wallEntryId).get();
            if (wallDoc.exists) {
              distanciaReal = wallDoc.data().distancia;
              console.log(`📖 Distancia real obtenida del muro: ${distanciaReal} km`);
            }
          } catch (err) { console.warn('Error leyendo entrada del muro:', err); }
        }
        
        // 2. Eliminar la entrada del muro
        if (wallEntryId) {
          try {
            await firebaseServices.db.collection('globalFeed').doc(wallEntryId).delete();
            await planRef.update({ [`wallEntryId.${diaIndex}`]: firebaseServices.FieldValue.delete() });
          } catch (err) { console.error('Error al eliminar del muro:', err); }
        }
        
        // 3. Revertir gamificación usando la distancia real (si existe) o la estimada
        if (window.Gamification && sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          try {
            let distanciaRemovida;
            if (distanciaReal !== null) {
              distanciaRemovida = distanciaReal;
              console.log(`✅ Reviertiendo gamificación con distancia real: ${distanciaRemovida} km`);
            } else {
              const metricas = this.calcularMetricasSesion(sesion);
              distanciaRemovida = metricas.distanciaTotal;
              console.warn(`⚠️ No se encontró distancia real, usando estimada: ${distanciaRemovida} km`);
            }
            const metricasRemovidas = { distanciaTotal: distanciaRemovida, tssTotal: 0 };
            await Gamification.removeSession(AppState.currentUserId, sesion, metricasRemovidas, diaIndex);
            if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
            if (document.getElementById('tab-amigos').classList.contains('active') && window.Friends) await Friends.cargarListaAmigos(true);
          } catch (e) { console.error('Error revirtiendo gamificación:', e); }
        }
      }
      
      Utils.showToast(realizada ? '✅ Sesión marcada' : '📝 Sesión desmarcada (actualizada)', 'success');
    } catch (error) {
      console.error('Error marcando sesión:', error);
      Utils.showToast('Error al marcar la sesión', 'error');
    }
  },

  // Función auxiliar para calcular TSS a partir de distancia y duración reales
  calcularTSSdesdeReal(distanciaKm, duracionMs, sesion) {
    const duracionHoras = duracionMs / (1000 * 60 * 60);
    if (duracionHoras <= 0) return 0;
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

  async mostrarUltimoPlanGuardado() {
    if (!AppState.currentUserId) {
      Utils.showToast("> NO HAY USUARIO_", 'error');
      return;
    }
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      const ultimoPlanId = userDoc.data()?.ultimoPlanId;
      if (!ultimoPlanId) {
        Utils.showToast("> NO HAY PLAN GUARDADO_", 'error');
        return;
      }
      const planDoc = await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(ultimoPlanId)
        .get();
      if (!planDoc.exists) {
        Utils.showToast("> EL PLAN YA NO EXISTE_", 'error');
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
      this.mostrarCalendario(planCompleto.sesiones);
    } catch (error) {
      console.error('Error al cargar último plan:', error);
      Utils.showToast('Error al cargar el plan', 'error');
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

setTimeout(() => {
  if (AppState.currentUserId && firebaseServices.db) {
    PlanGenerator.limpiarMuroGlobal().catch(console.error);
  }
}, 2000);

window.PlanGenerator = PlanGenerator;
window.toggleCuestionario = () => PlanGenerator.toggleCuestionario();
window.generarCalendarioEntreno = () => PlanGenerator.generarCalendarioEntreno();
window.validarOpcionesPlan = () => PlanGenerator.validarOpcionesPlan();
window.mostrarUltimoPlanGuardado = () => PlanGenerator.mostrarUltimoPlanGuardado();
window.borrarPlanGuardado = () => PlanGenerator.borrarPlanGuardado();
window.cambiarTrimestre = async (delta) => { await PlanGenerator.cambiarTrimestre(delta); };
window.cerrarModalSesion = () => {
  document.getElementById("detalleSesion")?.classList.remove("visible");
  document.getElementById("modalOverlay")?.classList.remove("visible");
  AppState.currentSesionDetalle = null;
};

console.log('✅ PlanGenerator v2.50 - Corregido: al desmarcar sesión GPS, resta distancia real');