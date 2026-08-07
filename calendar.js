// ==================== calendar.js - VERSIÓN COMPLETA CORREGIDA ====================
// Versión: 2.52 - Semana de descarga real en la generación de planes: el
//                patrón ondulatorio de 4 semanas (ONDULACION_PATRONES)
//                hacía que la semana de "descarga" bajase el volumen un
//                15% pero subiera la intensidad un 15%, cancelando casi
//                por completo la caída de TSS. Ahora la semana 4 de cada
//                bloque baja volumen e intensidad juntos (multiplicador
//                de TSS ≈0.48 frente a ≈1.2 en la semana de pico).
// Versión: 2.51 - Gestión científica de la fatiga: aviso antes de marcar una
//                sesión nueva si el % de recuperación (mismo cálculo que la
//                tarjeta "Carga y recuperación" del dashboard) es < 100%
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

  // Patrón 3:1 real: 3 semanas de progresión + 1 semana de descarga.
  // IMPORTANTE: intensidad y volumen SIEMPRE se mueven en la misma
  // dirección dentro de un mismo índice del patrón. Antes, el índice de
  // la semana de descarga (2) bajaba el volumen un 15% pero SUBÍA la
  // intensidad un 15% -- y como el TSS = duración × intensidad, ambos
  // efectos se cancelaban casi por completo (0.85 × 1.15 ≈ 0.98): la
  // semana de "descarga" no bajaba realmente la carga entrenada. Ahora
  // el índice 2 (semana 4 de cada bloque, ver getOndulatoryFactor) es
  // una descarga real: volumen y factor de intensidad caen juntos, con
  // un multiplicador de TSS de ~0.6 × 0.8 ≈ 0.48 frente al ~1.2 de la
  // semana de pico -- una caída de carga en torno al 55-60%, en línea
  // con la periodización real.
  ONDULACION_PATRONES: [
    { intensidad: 1.00, volumen: 1.05 },  // semana 2 del bloque: construcción
    { intensidad: 1.05, volumen: 1.15 },  // semana 3 del bloque: pico de carga
    { intensidad: 0.80, volumen: 0.60 },  // semana 4 del bloque: DESCARGA REAL
    { intensidad: 0.95, volumen: 0.90 }   // semana 1 del bloque: arranque suave
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
  // Bolsa de barajado: guarda, por cada combinación modalidad+distancia+
  // nivel+tipo, qué sesiones de esa lista quedan por usar en el ciclo
  // actual. Se reparten todas antes de repetir ninguna (en vez del
  // sistema anterior, que solo evitaba repetir la sesión inmediatamente
  // anterior y podía volver a sacar la misma cada pocas semanas).
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

  // AÑADIDO factorIntensidad como parámetro real. ANTES esta función
  // llamaba a calcularMetricasSesion pasando { ..., factorIntensidad: 1.0 }
  // dentro del objeto de sesión -- pero calcularMetricasSesion(sesion,
  // factorIntensidad = 1.0) lee el factor de intensidad como SEGUNDO
  // argumento posicional, no como propiedad del objeto. Como nadie pasaba
  // nunca ese segundo argumento, el TSS y la distancia estimada de TODAS
  // las sesiones generadas se calculaban siempre con factorIntensidad=1.0,
  // sin importar el valor real de esa semana (onda de periodización,
  // ajuste por ACWR o por feedback del usuario). El parámetro viajaba
  // correctamente desde generarCalendarioEntreno -> crearSesionDesdeMatriz
  // -> crearSesionBasica/crearSesionAvanzadaSeries, pero se perdía justo
  // aquí, en el último paso antes de calcular las métricas.
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

  // Fisher-Yates: baraja el array in-place y lo devuelve.
  _barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // Saca una sesión de la "bolsa" de ese tipo+modalidad+distancia+nivel,
  // rellenándola y barajándola de nuevo cuando se vacía. Así se garantiza
  // que se reparten TODAS las variantes disponibles antes de repetir
  // ninguna, en vez de solo evitar la última usada.
  _sacarSesionDeLaBolsa(dbTipo, tipo, modalidad, distancia, nivel) {
    const key = `${modalidad}|${distancia}|${nivel}|${tipo}`;
    let bolsa = this.bolsaPorTipo[key];
    if (!bolsa || bolsa.length === 0) {
      bolsa = this._barajar([...dbTipo]);
      // Si la primera de la bolsa nueva coincide con la última sesión
      // usada, se intercambia de posición para no repetir justo en el
      // empalme entre una vuelta de la bolsa y la siguiente.
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

  async crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null, esRecuperacion = false) {
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
    return this._buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados, {}, factorIntensidad);
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
    return this._buildSesionDetalle('series', fase, datosBasicos, pasosDetallados, metricasExtra, factorIntensidad);
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

  // ANTES: el ciclo de 4 semanas se calculaba con (semanaGlobal-1)%4, es
  // decir, sobre la semana absoluta del plan entero. Eso significa que
  // cuándo caía el pico de la onda (semana "dura" del ciclo) dependía de
  // en qué punto arbitrario del calendario empezaba cada fase, así que en
  // muchas transiciones de fase (p.ej. BASE -> CONSTRUCCION) el salto del
  // multiplicador de fase (volumenBase) coincidía con el pico de la onda,
  // sumando los dos efectos de golpe: saltos de volumen semana-a-semana
  // de hasta +30/+50% en vez de la progresión gradual esperada.
  // AHORA: el ciclo se ancla a semanaEnFase, así que CADA fase empieza
  // siempre en el punto más suave de la onda (semana 1 de fase = punto
  // 0 del ciclo) y la subida de carga se nota de forma gradual dentro de
  // la propia fase, no como un escalón doble justo en la costura.
  // La semana 4 de cada bloque (índice 2 del patrón) es ahora una
  // descarga real -- ver el comentario en ONDULACION_PATRONES -- en vez
  // de una oscilación simétrica de ±15%.
  getOndulatoryFactor(semanaEnFase, fase) {
    if (fase === 'TAPER') return { intensidad: 0.6, volumen: 0.7 };
    // Desfase +2: la semana 1 de cada fase cae en el punto MÁS SUAVE del
    // ciclo (índice 3: intensidad/volumen moderados), no en el punto alto
    // (índice 0). Así la subida de carga al entrar en una fase nueva es
    // progresiva dentro de la propia fase, en vez de sumarse de golpe al
    // escalón de volumenBase de la fase justo en su primera semana.
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
    // Base de avanzado bajada de 480 a 430 min/semana. Con el modelo
    // anterior, avanzado + maratón + competir ya partía de una base tan
    // alta (480 × 1.2 × 1.15 ≈ 662 min ANTES de aplicar siquiera la fase
    // y la onda de carga) que en fases de mayor volumen (CONSTRUCCION,
    // ESPECIFICA) el resultado final superaba con frecuencia los 900 min,
    // muy por encima del techo de seguridad: el recorte lo aplanaba todo
    // a 720 en muchas semanas seguidas, borrando la propia periodización
    // que el algoritmo intentaba crear. 430 deja el margen que faltaba.
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

    // === TAPER MÍNIMO GARANTIZADO ===
    // Antes, si duracionTaper acababa en 0 (algo frecuente en planes cortos
    // con objetivo "competir", porque ese objetivo alarga precisamente
    // ESPECIFICA y PICO), el plan terminaba directamente en la fase más
    // dura (PICO) sin ningún descanso previo a la carrera. Exigimos al
    // menos 1 semana de taper siempre que el plan tenga 5+ semanas (menos
    // que eso ya no da para periodizar nada), y 2 semanas para medio
    // maratón/maratón con objetivo "competir" (el estándar habitual de
    // reducción de carga antes de esas distancias). Las semanas que hacen
    // falta se quitan de PICO primero y, si no bastan, de ESPECIFICA:
    // nunca de BASE ni CONSTRUCCION, que son la parte del plan donde de
    // verdad se construye la forma física.
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

  // Calcula el nivel real de una semana teniendo en cuenta la fase: en
  // TAPER (y siempre que ya se sepa qué fase se está generando) el nivel
  // se CONGELA al que tenía la semana anterior a entrar en taper. Antes
  // calcularNivelSemana solo miraba el número de semana global, así que
  // un principiante podía "subirse" a intermedio justo en la semana de
  // descarga antes de la carrera (o en la última semana de un plan corto
  // sin taper), recibiendo de golpe sesiones de series más complejas
  // (pirámides, series rotas) justo cuando el cuerpo debería estar
  // descansando, no aprendiendo estructuras nuevas.
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

      // Ajuste por ACWR (carga aguda:crónica) sobre la carga REAL ya
      // entrenada, además del ajuste por feedback subjetivo de arriba.
      // Esto es lo que hace que el planificador "tenga en cuenta" el
      // TSS/ACWR real y no solo lo que el usuario ha valorado a mano:
      // si el usuario ha estado acumulando mucha más carga en la última
      // semana que su media de las últimas 4 (ACWR alto = riesgo de
      // lesión por sobrecarga), las próximas semanas se moderan un poco
      // más, aunque el feedback subjetivo no lo hubiera reflejado
      // todavía. Si el ACWR es bajo (se ha entrenado poco últimamente),
      // se permite recuperar algo de volumen en vez de seguir bajando.
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
        // Techo SUAVE en vez de un recorte duro a 720: por debajo de 650
        // no se toca nada; por encima, cada minuto de más solo cuenta un
        // 35%. Antes, cualquier semana que superase 720 se aplanaba
        // exactamente a 720, así que en perfiles de alto volumen (p.ej.
        // avanzado+maratón+competir) varias semanas distintas de la
        // periodización acababan mostrando el mismo número, borrando la
        // diferencia entre ellas justo cuando más debería notarse (fases
        // de construcción/específica vs. pico). El techo duro de
        // seguridad (780) se mantiene como límite absoluto, pero ahora
        // rara vez se llega a tocar.
        const TECHO_SUAVE = 650;
        const TECHO_DURO = 780;
        if (volumenSemana > TECHO_SUAVE) {
          volumenSemana = Math.round(TECHO_SUAVE + (volumenSemana - TECHO_SUAVE) * 0.35);
        }
        // PISO PROPORCIONAL en vez de un mínimo absoluto fijo (antes 180
        // minutos siempre). Un suelo fijo de 180 es invisible para
        // perfiles de volumen alto, pero para perfiles de volumen bajo
        // (p.ej. principiante + 5K + "acabar" + sin experiencia, con una
        // base de ~137 min/semana) queda POR ENCIMA de absolutamente
        // todas las semanas del plan, así que el plan entero sale plano
        // a 180 minutos de la semana 1 a la última: sin progresión, sin
        // pico, sin descarga real -- se pierde toda la periodización
        // justo en los perfiles que empiezan desde más abajo. Ahora el
        // suelo es el 35% del volumen semanal base de ESE perfil (antes
        // de aplicar la onda), con un mínimo absoluto de seguridad de 90
        // minutos para que ninguna semana quede en un volumen irrisorio.
        const pisoMinimo = Math.max(90, Math.round(volumenSemanaPuro * 0.35));
        volumenSemana = Math.min(TECHO_DURO, Math.max(pisoMinimo, volumenSemana));

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
        // Nombre editable del plan (ver editarNombrePlan() en index.html).
        // Por defecto se rellena con la distancia objetivo; el usuario
        // puede cambiarlo por algo suyo, p.ej. "Maratón de Sevilla".
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
    this.renderizarWidgetCarga().catch(err => console.warn('Error mostrando carga de entrenamiento:', err));

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

      const yaRealizada = !!AppState.sesionesRealizadas?.[sesion.diaGlobal];
      // Un día "perdido" es uno de entreno de verdad (no descanso) cuya
      // fecha ya pasó y que nunca se marcó como realizado. Se calcula solo
      // comparando fechas -- no hace falta ningún proceso en segundo plano
      // ni tocar la base de datos, se recalcula solo cada vez que se pinta
      // el calendario.
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
      // Reutiliza sesion.detalle.tssEstimada/distanciaEstimada (ya
      // calculados en la generación del plan con el factor de intensidad
      // real de esa semana) en vez de recalcular aquí con
      // calcularMetricasSesion(sesion), que sin segundo argumento vuelve a
      // caer en factorIntensidad=1.0 -- eso hacía que el TSS mostrado en
      // este modal de detalle no coincidiera con el TSS realmente asignado
      // a la sesión (p.ej. en una semana de descarga, el modal habría
      // mostrado un TSS más alto que el real).
      const metricas = {
        distanciaTotal: sesion.detalle.distanciaEstimada ?? this.calcularMetricasSesion(sesion).distanciaTotal,
        tssTotal: sesion.detalle.tssEstimada ?? this.calcularMetricasSesion(sesion).tssTotal
      };
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
  async marcarSesionRealizada(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null) {
    if (!AppState.currentUserId || !AppState.planActualId) return;

    // ── GESTIÓN CIENTÍFICA DE LA FATIGA ──────────────────────────────
    // Antes de dar por buena una sesión NUEVA (no al desmarcar), se
    // comprueba el % de recuperación respecto a la última sesión
    // registrada (mismo cálculo que la tarjeta "Carga y recuperación"
    // del dashboard: horas de recuperación estimadas a partir del TSS y
    // el tipo de la sesión anterior). Si el usuario todavía no está al
    // 100%, se le avisa del riesgo (fatiga acumulada / mayor riesgo de
    // lesión) y se le deja decidir si quiere continuar de todos modos —
    // no se bloquea la sesión, solo se gestiona con información.
    if (realizada) {
      const estado = this.calcularEstadoRecuperacionActual();
      if (estado && estado.pct < 100) {
        const horasStr = estado.horasRestantes >= 24
          ? `${Math.ceil(estado.horasRestantes / 24)} día(s)`
          : `${estado.horasRestantes} h`;
        const continuar = await Utils.confirm(
          '⚠️ Aún no estás recuperado al 100%',
          `Tu recuperación está al ${estado.pct}% (última sesión: ${estado.tss} TSS, tipo ${estado.tipo}). Faltan ~${horasStr} para la recuperación completa. Entrenar ahora aumenta el riesgo de fatiga acumulada y lesión. ¿Quieres marcar la sesión igualmente?`
        );
        if (!continuar) {
          // Revertir el checkbox visualmente: el evento onchange ya lo
          // había puesto a `checked` antes de llamar a esta función.
          const checkboxRevert = document.getElementById('sesionRealizada');
          if (checkboxRevert) checkboxRevert.checked = false;
          Utils.showToast('Sesión no marcada — sigue recuperándote 💤', 'info');
          return;
        }
        // Se guarda el aviso: se retoma más abajo, cuando ya existe el
        // objeto `entry` de la sesión, para dejar constancia de que se
        // entrenó sin recuperación completa (útil para el detalle del
        // récord/histórico y para futuros ajustes automáticos del plan).
        this._ultimaSesionForzadaSinRecuperar = { pct: estado.pct, tss: estado.tss };
      } else {
        this._ultimaSesionForzadaSinRecuperar = null;
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
          // Si la fecha de esta sesión ya pasó, al desmarcarla vuelve a
          // considerarse "perdida" (naranja) en vez de quedarse en su
          // color de zona normal como si aún estuviera pendiente.
          const sesionCelda = (this._sesionesActuales || [])[diaIndex - 1];
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

      // Aviso YA MISMO: lo que de verdad importa para el usuario (que la
      // sesión ha quedado marcada/desmarcada) ya ha ocurrido. Antes el
      // aviso esperaba al final de toda la función, después de publicar en
      // el muro, sincronizar "última sesión" y revertir/sumar
      // gamificación -- varias llamadas a la nube seguidas -- así que
      // tardaba bastante más en aparecer de lo que hacía falta.
      Utils.showToast(realizada ? '✅ Sesión marcada' : '📝 Sesión desmarcada (actualizada)', 'success');

      try {
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
              tssTotal: this.calcularTSSdesdeReal(realDistance, realDurationMs, sesion),
              // La insignia "GPS activado" (FIRST_GPS) se decide en
              // gamification.js mirando metricas.gpsUsed. Antes este objeto
              // no lo incluía nunca, así que esa insignia jamás se
              // desbloqueaba aunque la sesión sí llevara GPS real (se
              // guardaba correctamente como entry.hasGPS en el muro, pero
              // ese campo nunca llegaba a Gamification.updateAfterSession).
              gpsUsed: true,
              // Velocidad máxima real medida por GPS tramo a tramo (ver
              // gps-tracker.js _calcMaxSpeedKmh). Antes nunca se rellenaba
              // este campo, así que las insignias SPEED_20/SPEED_30 eran
              // literalmente imposibles de conseguir por mucho que se
              // corriera rápido.
              maxSpeed: realMaxSpeedKmh || 0
            };
          } else {
            // Reutiliza el TSS/distancia ya calculados al generar el plan
            // (sesion.detalle.tssEstimada/distanciaEstimada) en vez de
            // recalcularlos aquí con calcularMetricasSesion(sesion) sin
            // segundo argumento. Recalcular aquí volvía a caer en
            // factorIntensidad=1.0 por defecto, así que el TSS "registrado"
            // al marcar la sesión sin GPS podía no coincidir con el TSS
            // "estimado" que el usuario ya había visto en el plan para esa
            // misma sesión (la semana de descarga, por ejemplo, mostraría
            // una estimación baja pero luego registraría un TSS más alto).
            metricas = {
              distanciaTotal: sesion.detalle.distanciaEstimada || 0,
              tssTotal: sesion.detalle.tssEstimada || 0
            };
            distanciaUsada = metricas.distanciaTotal;
            duracionUsadaMs = sesion.duracion * 60 * 1000;
          }

          // Ritmo medio de la sesión (min/km), con o sin GPS: siempre hay
          // distancia y duración, así que siempre se puede calcular. Antes
          // 'metricas.bestPace' nunca se rellenaba desde aquí, así que las
          // insignias PACE_SUB5/PACE_SUB4 eran imposibles de conseguir
          // aunque se corriera a ese ritmo.
          if (distanciaUsada > 0 && duracionUsadaMs > 0) {
            metricas.bestPace = (duracionUsadaMs / 60000) / distanciaUsada;
          }
          // Duración en ms para el cálculo de récords personales por
          // distancia en gamification.js (ver RECORD_DISTANCES).
          metricas.durationMs = duracionUsadaMs;
          
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
            likesLeidos: 0,
            zone: sesion.detalle.zona || '',
            trainingName: sesion.detalle.nombre || ''
          };

          // Constancia de que esta sesión se completó sin estar
          // recuperado al 100% (ver aviso de fatiga más arriba). Solo se
          // añade el campo cuando aplica, para no ensuciar el resto de
          // entradas del muro.
          if (this._ultimaSesionForzadaSinRecuperar) {
            entry.recuperacionPctAlMarcar = this._ultimaSesionForzadaSinRecuperar.pct;
            this._ultimaSesionForzadaSinRecuperar = null;
          }

          if (realDistance !== null && realDurationMs !== null) {
            entry.hasGPS = true;
          } else {
            // Antes se dejaba sin definir (undefined) en vez de false. Con
            // ignoreUndefinedProperties, un campo undefined simplemente no
            // se escribe -- normalmente eso basta porque .update() con un
            // objeto reemplaza el campo entero, pero se deja explícito para
            // que no haya ninguna duda de que esta sesión NO llevaba GPS.
            entry.hasGPS = false;
          }
          
          try {
            const globalRef = await firebaseServices.db.collection('globalFeed').add(entry);
            await planRef.update({ [`wallEntryId.${diaIndex}`]: globalRef.id });
            // Se guarda el propio id del documento de globalFeed dentro de
            // 'ultimaSesion' para poder detectar, si algún día se borra esa
            // publicación concreta desde el perfil, que era justo la que
            // estaba marcada como "última sesión" -- y así poder
            // actualizarla en vez de dejarla apuntando a algo ya borrado.
            entry.entryId = globalRef.id;
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
            // Refresca el widget de "última sesión" en Inicio al instante,
            // por si el usuario ya lo tiene abierto o vuelve sin recargar
            // la app entera.
            if (typeof window.actualizarUltimaSesionDashboard === 'function') {
              window.actualizarUltimaSesionDashboard();
            }
            if (typeof window.actualizarEstaSemanaDashboard === 'function') {
              window.actualizarEstaSemanaDashboard(AppState.currentUserData?.profile?.weight || null);
            }
            // La tarjeta "Carga y recuperación" del dashboard lee el TSS y
            // el tipo de la 'ultimaSesion' que se acaba de actualizar
            // arriba; sin esta llamada se quedaba con el TSS/hora de
            // recuperación de la sesión anterior hasta recargar la app.
            if (typeof window.actualizarCargaRecuperacionDashboard === 'function') {
              window.actualizarCargaRecuperacionDashboard();
            }
          } catch (err) {
            console.error('Error al guardar en muro:', err);
            Utils.showToast('Error al publicar en el muro', 'error');
          }
          
          if (window.Gamification) {
            try {
              const oldData = await Gamification.getData(AppState.currentUserId);
              const oldLevel = oldData.level;
              const gamResult = await Gamification.updateAfterSession(AppState.currentUserId, sesion, metricas);
              // Se guarda qué insignias concedió EXACTAMENTE esta sesión en su
              // propia entrada del muro (si se llegó a crear), para poder
              // revertir solo esas insignias concretas si más tarde se
              // desmarca la sesión (ver más abajo, rama `else`).
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

          // Ofrecer compartir un resumen visual de la sesión. Las sesiones
          // con GPS ya muestran este mismo aviso justo al guardarse (ver
          // gps-tracker.js), así que aquí solo se hace para el marcado
          // manual (checkbox), para no duplicarlo.
          if (realDistance === null && window.ShareCard) {
            ShareCard.mostrarModal({
              username: AppState.currentUserData?.username || '',
              fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
              tipo: sesion.tipo || '',
              nombreSesion: sesion.detalle?.nombre || '',
              zona: sesion.detalle?.zona || '',
              distanciaKm: distanciaUsada,
              duracionMs: duracionUsadaMs
            });
          }
        }
      } else {
        // ---------- DESMARCADO (CORREGIDO) ----------
        const planData = planDoc.data();
        const wallEntryId = planData?.wallEntryId?.[diaIndex];
        let distanciaReal = null;
        let badgesGanadasSesion = [];
        
        // 1. Obtener la distancia real (y las insignias que concedió) del
        //    muro ANTES de eliminarlo
        if (wallEntryId) {
          try {
            const wallDoc = await firebaseServices.db.collection('globalFeed').doc(wallEntryId).get();
            if (wallDoc.exists) {
              distanciaReal = wallDoc.data().distancia;
              badgesGanadasSesion = wallDoc.data().badgesGanadas || [];
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

          // Si la entrada borrada era justo la guardada como "última
          // sesión", hay que actualizarla -- si no, se queda apuntando
          // para siempre a algo ya borrado (mismo fallo que había al
          // borrar desde el perfil).
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
          // Igual que al marcar: la tarjeta "Carga y recuperación" tiene
          // que reflejar YA la 'ultimaSesion' que se acaba de recalcular
          // arriba (o quedar vacía si ya no queda ninguna sesión).
          if (typeof window.actualizarCargaRecuperacionDashboard === 'function') {
            window.actualizarCargaRecuperacionDashboard();
          }
        }
        
        // 3. Revertir gamificación usando la distancia real (si existe) o la estimada
        if (window.Gamification && sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          try {
            let distanciaRemovida;
            if (distanciaReal !== null) {
              distanciaRemovida = distanciaReal;
              console.log(`✅ Reviertiendo gamificación con distancia real: ${distanciaRemovida} km`);
            } else {
              // Reutiliza la distancia ya estimada en el plan en vez de
              // recalcularla aquí sin el factor de intensidad real de esa
              // semana (mismo motivo que en el bloque de arriba).
              distanciaRemovida = sesion.detalle.distanciaEstimada ?? this.calcularMetricasSesion(sesion).distanciaTotal;
              console.warn(`⚠️ No se encontró distancia real, usando estimada: ${distanciaRemovida} km`);
            }
            const metricasRemovidas = { distanciaTotal: distanciaRemovida, tssTotal: 0 };
            await Gamification.removeSession(AppState.currentUserId, sesion, metricasRemovidas, diaIndex, badgesGanadasSesion);
            if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
            if (document.getElementById('subtab-amigos')?.classList.contains('active') && window.Friends) await Friends.cargarListaAmigos(true);
          } catch (e) { console.error('Error revirtiendo gamificación:', e); }
        }
      }
      } catch (bgError) {
        // La sesión YA quedó marcada/desmarcada correctamente (eso ya se
        // avisó arriba); esto solo cubre el trabajo de fondo (publicar en
        // el muro, gamificación...). Un fallo aquí no debe mostrarse como
        // "error al marcar la sesión" porque no lo fue.
        console.error('Error en el trabajo de fondo tras marcar sesión:', bgError);
      }
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

  // ============================================================
  //  CARGA DE ENTRENAMIENTO: TSS, carga aguda/crónica y ACWR
  // ============================================================
  // Se apoya en el `tss` que ya se guarda en cada entrada del muro al
  // marcar una sesión (ver marcarSesionRealizada). Se agrupa por
  // `fechaSesion` (el día REAL de la sesión, no el momento en que se
  // pulsó el check -- importante si el usuario se "pone al día" marcando
  // sesiones de días anteriores).
  //
  // Carga aguda  = media diaria de TSS de los últimos 7 días.
  // Carga crónica = media diaria de TSS de los últimos 28 días.
  // ACWR = carga aguda / carga crónica (estándar en ciencias del deporte
  // para estimar el riesgo de lesión por picos de carga).
  //
  // Nota sobre el índice de Firestore: se reutiliza deliberadamente
  // exactamente la misma consulta (`userId == uid` + `orderBy(timestamp)`)
  // que ya usan otras partes de la app (perfil, muro...) para no depender
  // de un índice compuesto nuevo que aún no exista en el proyecto.
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
          : Math.round((d.duration || 0) * 0.85); // estimación para entradas antiguas sin tss
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
      // Con menos de ~10 días con sesiones en las últimas 4 semanas no hay
      // base suficiente para que el ACWR sea representativo (sería ruido
      // estadístico, no una tendencia real de carga).
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

  // Pinta el widget de carga de entrenamiento en la pantalla del plan.
  // Se llama al abrir/generar un plan; si no hay contenedor en el DOM
  // (pantalla distinta) no hace nada.
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

  // Estimación del tiempo de recuperación tras una sesión, a partir de su
  // TSS y del tipo de sesión (una serie de intervalos deja más fatiga
  // muscular que un rodaje suave con el mismo TSS). Es una aproximación
  // orientativa (no hay pulsómetro/HRV conectado para calcularla de
  // verdad), pensada para dar una referencia rápida en el dashboard, no
  // una prescripción médica.
  calcularRecuperacion(tss, tipo) {
    const factorTipo = { rodaje: 0.9, tempo: 1.0, series: 1.15, largo: 1.05, strength: 1.1 }[tipo] || 1.0;
    const horas = Math.min(72, Math.max(8, Math.round((tss || 0) * 0.5 * factorTipo)));
    return horas;
  },

  // Estado de recuperación EN ESTE MOMENTO respecto a la última sesión
  // registrada (AppState.currentUserData.ultimaSesion). Reutiliza
  // exactamente la misma fórmula que la tarjeta "Carga y recuperación"
  // del dashboard (ver actualizarCargaRecuperacionDashboard en
  // index.html), para que el aviso de fatiga al marcar una sesión nueva
  // sea siempre coherente con lo que el usuario ve ahí. Devuelve null si
  // no hay sesión previa o si ya está recuperado al 100%.
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

  // Carga total (TSS) del plan de entrenamiento activo, con desglose
  // semanal para poder dibujar una gráfica. Se consulta por `planId`
  // (igualdad simple sobre un solo campo, no necesita ningún índice
  // compuesto) en vez de por userId+timestamp.
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
        if (d.userId !== uid) return; // por si otro usuario tuviera (por error) el mismo planId
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

      // Agrupado por semana (lunes de cada semana) para la gráfica: un
      // plan puede durar varios meses, así que un TSS por día sería
      // ilegible en una gráfica de barras.
      const porSemana = {};
      eventos.forEach(ev => {
        const lunes = new Date(ev.fecha);
        const dow = (lunes.getDay() + 6) % 7; // lunes=0 ... domingo=6
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