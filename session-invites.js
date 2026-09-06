// ==================== session-invites.js ====================
// Módulo "Generar sesión" del panel de administración.
// VERSIÓN FINAL: flujo encadenado sin saltos visuales, con animación
// de "EN PROCESO" completa antes de mostrar la siguiente invitación.
// Y con la funcionalidad de que los pasos añadidos solo suman tiempo.
//
// FIX v8.3: los pasos extra (fuerza, estiramientos...) sumaban tiempo a la
// sesión correctamente, pero:
//   - En sesiones normales (rodaje/tempo/largo) ese tiempo extra se colaba
//     también en el cálculo del TSS, inflándolo (el TSS debe reflejar solo
//     la carga de carrera: calentamiento + parte principal + enfriamiento).
//   - En sesiones de series ocurría lo inverso: la duración total
//     (duracionMin) se sobrescribía con solo el tiempo de carrera, así que
//     la sesión guardada perdía los minutos de los pasos extra.
// Ahora ambas funciones usan una duración de carrera aparte solo para el
// TSS, y dejan duracionMin como el tiempo total real (con los extra
// incluidos) en los dos tipos de sesión.
//
// v9: al añadir un paso extra, el admin elige explícitamente su tipo con
// dos botones ("🏃 + CARRERA" / "💪 + FUERZA") en vez de que se deduzca
// solo por el título del paso:
//   - 🏃 Carrera: se inserta justo debajo de "PARTE PRINCIPAL" y corre a la
//     MISMA zona que ella -- suma tiempo Y distancia (y por tanto también
//     TSS), igual que si fuera más parte principal.
//   - 💪 Fuerza: se inserta al final, justo después del enfriamiento, y
//     solo suma al tiempo total de la sesión (como ya hacía v8.3).
// Cada paso lleva ahora un campo p.tipoExtra ('carrera'|'fuerza') que se
// preserva al reconstruir la lista desde el formulario y viaja con la
// sesión guardada; los pasos "clásicos" (CALENTAMIENTO/PARTE PRINCIPAL/
// ENFRIAMIENTO) se siguen reconociendo por título, sin cambios.
//
// v10: cada paso "🏃 carrera" lleva su PROPIA zona (selector p.zona en el
// formulario), independiente de la zona de la parte principal -- ej.
// series en Z4 + un bloque extra de rodaje en Z2. Su distancia/tiempo se
// calculan con el ritmo de SU zona. gps-tracker.js y calendar.js
// actualizados en paralelo para que el rastreo GPS y el desglose al
// marcar la sesión como hecha respeten esa zona propia en vez de
// mezclarla con la de la parte principal.
//
// v11: rediseño puramente visual del generador de sesiones (sin tocar
// cálculos ni lógica) -- cada paso (calentamiento/parte principal/
// enfriamiento/extras) se muestra como una tarjeta con una etiqueta y un
// acento de color propio (reutilizando los mismos colores de zona ya
// usados en el resto de la app: --zone-1/2/3), en vez de un borde plano
// genérico. Los botones "+ CARRERA"/"+ FUERZA" pasan de borde punteado a
// un estilo de chip sólido y con la misma sombra de elevación que el
// resto de tarjetas de la app, para que ambos pesen visualmente igual.
// Extendido también al Paso 2 (calendario: tarjeta contenedora, botones
// de mes a juego, celdas con sombra al marcar, resumen de fechas como
// chip dorado) y al Paso 3 (usuarios: cada fila con avatar circular,
// barra de acento y sombra, igual que el resto de tarjetas nuevas).
//
// v12.6: colores ajustados para modo oscuro: se mantienen los tonos
// pastel que funcionaban en modo claro, pero con luminosidad reducida
// para evitar el efecto neón. Descanso en blanco grisáceo suave.
//
// v14.3: se elimina el "salto" que hacía la pantalla del Paso 3 al
// cargar los grupos. Antes, los grupos NO se empezaban a pedir a
// Firestore hasta llegar al propio Paso 3 (con un "⏳ Cargando
// grupos..." de una sola línea que, al rellenarse con la rejilla de
// tarjetas, empujaba todo lo de abajo de golpe). Ahora usuarios Y grupos
// se precargan en paralelo nada más entrar en el Paso 2 (mientras el
// admin elige los días en el calendario), y el botón "CONTINUAR →" de
// ese paso no dejará avanzar hasta que las dos hayan terminado -- así, al
// llegar al Paso 3, lo normal es que todo esté ya en caché y la pantalla
// se pinte entera de una vez, ya cargada, sin ningún salto. Si por lo que
// sea alguna de las dos no estuviera lista a tiempo, se muestra un
// esqueleto animado (mismo estilo "riSkeletonPulse" que ya usa "Últimas
// sesiones creadas") en vez del texto suelto, y el contenido real
// aparece con un fundido ("riFadeInUp") en cuanto llega.
//
// v14.2: en el Paso 3, la etiqueta "📁 GRUPOS" y el botón "✏️ GESTIONAR"
// (texto pequeño subrayado en dorado) se sustituyen por un único texto
// "GESTIONAR GRUPOS" centrado, con el mismo estilo de título (Courier
// New, negrita, letter-spacing) que ya usa el resto de la app -- no hacía
// falta la etiqueta de grupos por separado, las propias tarjetas de cada
// grupo ya dejan claro que eso es la lista de grupos. Dentro del modal
// "Gestionar grupos", cada tarjeta pierde el icono de carpeta y su
// nombre pasa a estar centrado (antes iba a la izquierda).
//
// v14.1: rediseño del modal "Gestionar grupos" -- se quita la X de
// cerrar de la cabecera (con títulos largos se solapaba con el propio
// texto "GESTIONAR GRUPOS"); ahora se cierra con un botón "CERRAR" a
// ancho completo, debajo de "CREAR GRUPO". Cada grupo de la lista pasa a
// ser su propia tarjeta con dos filas separadas por una línea: arriba el
// nombre y el nº de miembros, abajo los botones "✏️ EDITAR" / "🗑️
// ELIMINAR" a ancho completo (con texto, no solo el icono suelto) --
// antes esos dos botones eran iconos pequeños pegados al lado del
// nombre, sin una separación clara. Los chips de grupos del Paso 3
// también pasan de una fila de píldoras pegadas a una rejilla de
// tarjetas cuadradas independientes, más separadas entre sí.
//
// v14: NUEVO -- grupos de destinatarios. En el Paso 3 ("elige usuarios")
// aparece ahora una fila de "chips" con los grupos que el admin haya
// creado (ej. "Gimnasio", "Amigos"); pulsar un chip marca de golpe a
// todos sus miembros en la lista de abajo (y volver a pulsarlo, con
// todos ya marcados, los desmarca de golpe). Un botón "✏️ Gestionar"
// abre un modal aparte para crear/editar/eliminar grupos, eligiendo sus
// miembros con el mismo buscador que ya se usaba para elegir
// destinatarios. Los grupos se guardan en la nueva colección Firestore
// 'sessionGroups' (name, members[], createdBy, createdAt), filtrados por
// createdBy == uid del admin actual -- cada admin solo ve y gestiona sus
// propios grupos, nunca los de otro admin. Requiere añadir reglas de
// seguridad para esta colección nueva (ver mensaje de chat).
//
// v13: _colorTipo() ahora es consciente del tema (body.manual-light).
// Los mismos rgba() ajustados para modo oscuro quedaban casi invisibles
// sobre fondo blanco en modo claro -- a simple vista costaba distinguir
// un tipo de sesión de otro en las tarjetas del historial de "Últimas
// sesiones creadas". En modo claro usa un acento más oscuro (mejor
// contraste sobre blanco) y bastante más opacidad de fondo; las tarjetas
// del historial además usan el nuevo parámetro "intenso" para un extra
// de opacidad (el color es su única pista visual de qué tipo es cada
// una), mientras que el detalle a pantalla completa se queda con el
// valor normal para no saturar toda la pantalla.
// ====================

const SessionInvites = {
  unsubscribe: null,
  _shownIds: new Set(),

  // 🔥 v12.7: inyecta una sola vez los keyframes para la animación de
  // carga del historial (tarjetas "esqueleto" pulsando) y el fade-in de
  // las tarjetas reales al terminar de cargar, en vez de que aparezcan de
  // golpe.
  _asegurarEstiloHistorial() {
    if (document.getElementById('riHistorialAnimStyle')) return;
    const style = document.createElement('style');
    style.id = 'riHistorialAnimStyle';
    style.textContent = `
      @keyframes riSkeletonPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.75; } }
      @keyframes riFadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
  },
  _colaPendientes: [],
  _modalInviteAbierto: false,
  _dashboardCargado: false,

  _editable: null,
  _mesCalendario: null,
  _fechasSeleccionadas: null,
  _usuariosTodos: null,
  _usuariosSeleccionados: null,

  // Grupos de usuarios (ej. "Gimnasio", "Amigos") creados por el admin
  // para marcar de golpe a todos sus miembros al elegir destinatarios en
  // el Paso 3, en vez de tener que buscarlos y marcarlos uno a uno cada
  // vez. Colección Firestore 'sessionGroups', filtrada por createdBy ==
  // uid del admin actual (cada admin ve y gestiona solo sus propios
  // grupos). _gruposTodos se cachea igual que _usuariosTodos y se
  // invalida (poniéndolo a null) tras crear/editar/eliminar un grupo.
  _gruposTodos: null,
  _precargaGruposPromise: null,
  _grupoEditandoId: null,
  _grupoMiembrosSeleccionados: null,

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
    // 🔥 FIX ESCALA TSS: misma corrección que PlanGenerator.FACTOR_ESCALA_TSS
    // en calendar.js (horas × IF² × 100 → en minutos hay que ×100/60) para
    // que una sesión enviada por el admin dé exactamente el mismo TSS que
    // una equivalente generada por el calendario automático.
    const FACTOR_ESCALA_TSS = 100 / 60;
    return Math.round((duracionMin || 0) * ifactor * ifactor * FACTOR_ESCALA_TSS);
  },

  // ===== AUXILIAR DE COLORES POR TIPO (VERSIÓN AJUSTADA PARA MODO OSCURO) =====
  // Mantiene los tonos pastel que funcionaban en modo claro, pero con
  // luminosidad reducida para evitar el efecto neón en modo oscuro.
  // 🔥 v12.7: mismos colores que usa el calendario real para cada tipo de
  // sesión (ver getColor()/.sesion-<tipo> en index.html: rodaje=zone-1,
  // series=zone-2, tempo=zone-3, largo=zone-4, strength=zone-6), pero en
  // tono MUY tenue (igual que las tarjetas del Paso 1 del generador) --
  // los tonos anteriores, más saturados, se veían "neón" en modo oscuro.
  // Los valores van fijos en hex (no var(--zone-N)) para no depender de
  // cómo esté definida esa variable en cada momento.
  //
  // 🔥 v13: consciente del tema. Los mismos rgba() de arriba, pensados
  // para que no "quemaran" sobre fondo oscuro, quedaban casi invisibles
  // sobre fondo blanco en modo claro (body.manual-light) -- a simple
  // vista costaba distinguir un tipo de sesión de otro. En modo claro se
  // usa un acento más oscuro (mejor contraste sobre blanco) y bastante
  // más cuerpo de opacidad. El parámetro "intenso" (usado en las
  // tarjetas del historial de "Últimas sesiones creadas", donde el color
  // es la única pista visual de qué tipo es cada una) sube aún más la
  // opacidad; el resto de usos (fondo grande del detalle) se queda con
  // el valor normal para no saturar toda la pantalla.
  _colorTipo(tipo, intenso = false) {
    if (tipo === 'descanso') return { accent: 'var(--border-color-light)', bg: 'transparent' };

    const esClaro = document.body.classList.contains('manual-light');
    const base = {
      rodaje:   esClaro ? { rgb: '93,122,143',  accent: '#5D7A8F' } : { rgb: '138,160,176', accent: '#8AA0B0' },
      series:   esClaro ? { rgb: '94,127,101',  accent: '#5E7F65' } : { rgb: '155,181,160', accent: '#9BB5A0' },
      tempo:    esClaro ? { rgb: '161,122,80',  accent: '#A17A50' } : { rgb: '201,167,139', accent: '#C9A78B' },
      largo:    esClaro ? { rgb: '161,95,113',  accent: '#A15F71' } : { rgb: '201,155,165', accent: '#C99BA5' },
      strength: esClaro ? { rgb: '102,102,102', accent: '#666666' } : { rgb: '138,138,138', accent: '#8A8A8A' }
    };
    const c = base[tipo];
    if (!c) return { accent: 'var(--border-color)', bg: 'transparent' };

    const alpha = esClaro ? (intenso ? 0.30 : 0.16) : (intenso ? 0.20 : 0.12);
    return { accent: c.accent, bg: `rgba(${c.rgb},${alpha})` };
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

  // 🔥 MODIFICADO: duracionMin = suma de TODOS los pasos. Distancia solo con pasos de carrera.
  // 🔥 v9: los pasos añadidos con el botón "🏃 + CARRERA" llevan p.tipoExtra
  // ='carrera' y se tratan como una extensión de la parte principal (suman
  // tiempo Y distancia); los de "💪 + FUERZA" llevan p.tipoExtra='fuerza' y
  // solo suman al tiempo total (ya contado en duracionTotalMin). Los pasos
  // "clásicos" (CALENTAMIENTO/PARTE PRINCIPAL/ENFRIAMIENTO por título)
  // siguen igual que antes.
  // 🔥 v10: cada paso "carrera" lleva su PROPIA zona (p.zona), independiente
  // de la zona de la parte principal -- ej. series en Z4 + un bloque extra
  // de rodaje en Z2. Su distancia se calcula con el ritmo de SU zona, no
  // con el de la parte principal.
  _calcularPersonalizacion(zonaCodigo, parteInput, calculo, peso, pasosDetallados) {
    // Sumar minutos de TODOS los pasos (duración total)
    const duracionTotalMin = (pasosDetallados || []).reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    const pasosExtraCarrera = (pasosDetallados || []).filter(p => p.tipoExtra === 'carrera');
    const extraCarreraMin = pasosExtraCarrera.reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    // Separar pasos de carrera "clásicos": aquellos cuyo título contenga
    // CALENTAMIENTO, PARTE PRINCIPAL o ENFRIAMIENTO -- ignorando los que ya
    // llevan un tipoExtra explícito (carrera o fuerza), que se tratan aparte
    const pasosCarrera = (pasosDetallados || []).filter(p => {
      if (p.tipoExtra) return false;
      const tit = (p.titulo || '').toUpperCase();
      return tit.includes('CALENTAMIENTO') || tit.includes('PARTE PRINCIPAL') || tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO');
    });
    
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
      ritmoStr: null, duracionMin: duracionTotalMin, // ← duración total (todos los pasos)
      tss: null, calorias: null,
      calentamiento: calentamientoMin,
      partePrincipal: partePrincipalMin,
      enfriamiento: enfriamientoMin,
      distanciaPartePrincipal: null,
      distanciaCalentamientoKm: null,
      distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };

    // Calcular distancias SOLO con los minutos de carrera
    if (calculo && Array.isArray(calculo.zones) && calculo.zones.length && calculo.ritmoBase) {
      const zona = calculo.zones.find(z => z[0] === zonaCodigo);
      if (zona) {
        const paceDecimal = calculo.ritmoBase * zona[4];
        resultado.ritmoStr = Utils.formatR(paceDecimal);

        // Distancia parte principal: usar partePrincipalMin (solo carrera)
        if (parteInput.modo === 'distancia') {
          resultado.distanciaPartePrincipal = parteInput.valor || 0;
          // Recalcular tiempo de la parte principal con esa distancia
          resultado.partePrincipal = Math.max(1, Math.round(resultado.distanciaPartePrincipal * paceDecimal));
        } else {
          // 🔥 FIX: ya no hay un campo de tiempo aparte arriba -- la
          // duración de la parte principal en modo tiempo sale
          // directamente del bloque "PARTE PRINCIPAL" de los pasos
          // (partePrincipalMin), igual que ya funciona para fuerza. Antes
          // se limitaba (Math.min) el valor de un campo de arriba a este
          // mismo número, así que si esa fila de abajo no se rellenaba
          // (por defecto 0) el resultado quedaba siempre en 0 pasase lo
          // que pasase arriba.
          resultado.partePrincipal = partePrincipalMin;
          resultado.distanciaPartePrincipal = paceDecimal > 0 ? (resultado.partePrincipal / paceDecimal) : 0;
        }

        // Los pasos extra de tipo "carrera" tienen CADA UNO su propia zona
        // (p.zona): se calcula su distancia con el ritmo de esa zona (no
        // con el de la parte principal) y se suma al tiempo y distancia
        // totales, como si fueran más parte principal.
        if (extraCarreraMin > 0) {
          let extraCarreraKm = 0;
          pasosExtraCarrera.forEach(p => {
            const minP = p.duracionMin || 0;
            if (!minP) return;
            const zonaPaso = calculo.zones.find(z => z[0] === p.zona) || zona;
            const pacePaso = calculo.ritmoBase * zonaPaso[4];
            if (pacePaso > 0) extraCarreraKm += minP / pacePaso;
          });
          resultado.partePrincipal += extraCarreraMin;
          resultado.distanciaPartePrincipal += extraCarreraKm;
        }

        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4];
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;

        // TSS basado SOLO en la duración de carrera (calentamiento + parte
        // principal + enfriamiento, incluidos los extra de carrera) -- los
        // pasos extra de FUERZA suman al tiempo total de la sesión pero NO
        // deben inflar la carga de entrenamiento (TSS), ya que no son
        // carrera.
        const duracionCarreraMin = calentamientoMin + resultado.partePrincipal + enfriamientoMin;
        resultado.tss = this._calcularTSS(duracionCarreraMin, zonaCodigo);
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
    // Ya suma todos los pasos
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

  // 🔥 MODIFICADO: duracionMin = suma de pasos + duración de series. Distancia solo con pasos de carrera.
  _calcularPersonalizacionSeries(seriesConfig, calculo, peso, pasosDetallados) {
    // Sumar minutos de TODOS los pasos (duración total)
    const duracionPasos = (pasosDetallados || []).reduce((sum, p) => sum + (p.duracionMin || 0), 0);
    const sc = seriesConfig || {};
    const totalReps = Math.max(0, sc.numBloques || 0) * Math.max(0, sc.numSeries || 0);
    const resultado = {
      ritmoStr: null, duracionMin: duracionPasos, // ← duración total (todos los pasos)
      tss: null, calorias: null,
      calentamiento: 0, partePrincipal: 0, enfriamiento: 0,
      distanciaPartePrincipal: null, distanciaCalentamientoKm: null, distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };

    // Pasos extra de carrera: cada uno con su PROPIA zona (p.zona), que
    // puede ser distinta de la zona de esfuerzo de la serie -- ej. series
    // en Z4 + un bloque extra de rodaje en Z2 después.
    const pasosExtraCarrera = (pasosDetallados || []).filter(p => p.tipoExtra === 'carrera');
    const extraCarreraMin = pasosExtraCarrera.reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    // Extraer calentamiento y enfriamiento de los pasos (solo para los de
    // carrera "clásicos" por título, ignorando los que ya llevan tipoExtra)
    const pasosCarrera = (pasosDetallados || []).filter(p => {
      if (p.tipoExtra) return false;
      const tit = (p.titulo || '').toUpperCase();
      return tit.includes('CALENTAMIENTO') || tit.includes('PARTE PRINCIPAL') || tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO');
    });
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

        // Parte principal = tiempo de esfuerzo + descansos (sin contar calentamiento/enfriamiento)
        resultado.partePrincipal = Math.round(tiempoEsfuerzoMin + tiempoDescansoMin);
        resultado.distanciaPartePrincipal = distanciaEsfuerzoKm;

        // Los pasos extra de tipo "carrera" tienen CADA UNO su propia zona
        // (p.zona), que puede no coincidir con la zona de esfuerzo de la
        // serie: se calcula su distancia con el ritmo de esa zona y se
        // suma al tiempo y distancia totales, como si fueran más parte
        // principal.
        if (extraCarreraMin > 0) {
          let extraCarreraKm = 0;
          pasosExtraCarrera.forEach(p => {
            const minP = p.duracionMin || 0;
            if (!minP) return;
            const zonaPaso = calculo.zones.find(z => z[0] === p.zona) || zona;
            const pacePaso = calculo.ritmoBase * zonaPaso[4];
            if (pacePaso > 0) extraCarreraKm += minP / pacePaso;
          });
          resultado.partePrincipal += extraCarreraMin;
          resultado.distanciaPartePrincipal += extraCarreraKm;
        }

        // Distancias de calentamiento y enfriamiento en Z1
        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4];
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;

        // TSS basado SOLO en la duración de carrera (series + calentamiento
        // + enfriamiento), sin los pasos extra -- pero la duración TOTAL de
        // la sesión (resultado.duracionMin, ya fijada arriba a duracionPasos,
        // la suma de TODOS los pasos) se deja intacta para que sí incluya
        // esos minutos extra.
        const duracionCarreraMin = resultado.partePrincipal + calentamientoMin + enfriamientoMin;
        resultado.tss = this._calcularTSS(duracionCarreraMin, sc.zonaEsfuerzo);
        resultado.segundosEsfuerzo = Math.round(tiempoEsfuerzoMin * 60);
        // Distancia FIJA planificada del esfuerzo puro (ej. 6x400m = 2.4km),
        // sin contar descansos ni el bloque extra de carrera -- ver uso en
        // calendar.js _desglosarSesion, que la usa tal cual en vez de
        // derivarla proporcionalmente del km real total (eso diluía la
        // distancia de esfuerzo mezclándola con el ritmo, más lento, de los
        // descansos).
        resultado.distanciaEsfuerzoKm = distanciaEsfuerzoKm;
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
      distanciaEsfuerzoKm: personalizado.distanciaEsfuerzoKm || 0,
      distanciaEstimada: personalizado.distanciaTotal !== null
        ? parseFloat(personalizado.distanciaTotal.toFixed(2))
        : (detalleOriginal.distanciaEstimada || 0)
    };
  },

  // 🔥 Reutiliza el MISMO compositor de "Nueva sesión" (paso 1: tipo +
  // estructura) que ya usa el admin para enviar sesiones a otros, pero en
  // modo "para mí mismo": se salta el paso 2 (elegir fecha, ya viene
  // fijada por el día del calendario en el que se pulsó "+") y el paso 3
  // (elegir destinatarios, no aplica). Al confirmar, la sesión se inserta
  // directamente en el plan activo del propio usuario para ese día y se
  // abre su detalle, desde donde ya puede marcarla como realizada con los
  // datos reales (igual que cualquier otra sesión del calendario).
  abrirGeneradorPropio(diaGlobal) {
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
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
          { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0 },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
        ]
      }
    };
    this._diaGlobalAutoAsignado = diaGlobal;
    this._renderPaso1();
  },

  _cancelarGenerador() {
    this._diaGlobalAutoAsignado = null;
    this._cerrarModal('sessGen');
  },

  abrirGenerador() {
    this._diaGlobalAutoAsignado = null;
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
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
          { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0 },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
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

  // 🔥 v11: identidad visual de cada paso según su tipo -- para que el
  // planificador se vea como tarjetas diferenciadas por color en vez de
  // una lista plana, acorde al resto de la app (reutiliza los mismos
  // colores de zona que ya se usan en Dashboard/Muro: --zone-1 azulado
  // para Z1, --zone-2 verdoso, --zone-3 tostado). Los fondos van en rgba
  // porque no se puede aclarar/oscurecer una var() en CSS puro -- son la
  // misma tonalidad que --zone-1/2/3 en el tema oscuro, a muy baja
  // opacidad (mismo criterio que --glow-color, ya usado en la app).
  _infoTipoPaso(p) {
    if (p.tipoExtra === 'carrera') return { accent: 'var(--zone-4)', bg: 'rgba(201,155,165,0.14)', tag: '🏃 EXTRA · CARRERA — suma tiempo y distancia' };
    if (p.tipoExtra === 'fuerza')  return { accent: '#9a9a9a', bg: 'rgba(154,154,154,0.10)', tag: '💪 EXTRA · FUERZA — solo suma tiempo' };
    const tit = (p.titulo || '').toUpperCase();
    if (tit.includes('CALENTAMIENTO')) return { accent: 'var(--zone-1)', bg: 'rgba(138,160,176,0.12)', tag: '🔥 CALENTAMIENTO' };
    if (tit.includes('ENFRIAMIENTO') || tit.includes('ESTIRAMIENTO')) return { accent: 'var(--zone-3)', bg: 'rgba(201,167,139,0.12)', tag: '🧘 ENFRIAMIENTO' };
    if (tit.includes('PARTE PRINCIPAL')) return { accent: 'var(--zone-2)', bg: 'rgba(155,181,160,0.12)', tag: '⚡ PARTE PRINCIPAL' };
    return { accent: 'var(--border-color-light)', bg: 'transparent', tag: '' };
  },

  _renderPaso1() {
    const { modal } = this._crearOverlayModal('sessGen');
    const d = this._editable.detalle;
    const tipoActual = this._editable.tipo;
    // 🔥 Siempre mostramos el campo de minutos para todos los pasos
    const pasosHTML = d.pasosDetallados.map((p, i) => {
      const info = this._infoTipoPaso(p);
      // 🔥 v10: selector de zona propio para cada paso "carrera" -- puede
      // ser distinta de la zona de la parte principal (ej. series en Z4 +
      // bloque extra en Z2).
      const selectorZona = p.tipoExtra === 'carrera'
        ? `<select class="sg-paso-zona" data-idx="${i}" style="width:100%; margin-bottom:8px; text-align:center; text-align-last:center; font-size:12px;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}" ${p.zona === z.codigo ? 'selected' : ''}>${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>`
        : '';
      return `
      <div class="sessgen-paso" data-idx="${i}" style="background:${info.bg}; border:1px solid ${info.accent}; border-left:4px solid ${info.accent}; border-radius:12px; padding:12px 12px 10px; margin-bottom:10px; box-shadow:var(--shadow-sm);">
        ${info.tag ? `<div style="font-size:9px; font-weight:bold; color:${info.accent}; text-align:center; margin-bottom:8px; letter-spacing:0.8px; word-break:break-word;">${info.tag}</div>` : ''}
        <!-- 🔥 Una sola fila: icono + título + minutos + eliminar. El
             título va sin negrita, con letra más pequeña y elipsis de
             seguridad para que quepan títulos largos como "PARTE
             PRINCIPAL" sin cortarse; los minutos vuelven a ser una caja
             estrecha (antes, en dos filas, ocupaban todo el ancho para
             un número de 2-3 cifras, que quedaba muy vacío). -->
        <div style="display:flex; gap:6px; margin-bottom:8px; align-items:center;">
          <input class="sg-paso-icono" data-idx="${i}" value="${Utils.escapeHTML(p.icono || '')}" style="width:38px; flex-shrink:0; text-align:center; padding:8px 2px; font-size:15px;" maxlength="4">
          <input class="sg-paso-titulo" data-idx="${i}" value="${Utils.escapeHTML(p.titulo || '')}" placeholder="TÍTULO" style="flex:1; min-width:0; text-align:center; font-size:11.5px; padding:8px 4px; overflow:hidden; text-overflow:ellipsis;">
          <input class="sg-paso-min" data-idx="${i}" type="number" min="0" value="${p.duracionMin || ''}" placeholder="min" title="Minutos" style="width:46px; flex-shrink:0; text-align:center; padding:8px 2px; font-size:13px;">
          <!-- 🔥 Botón eliminar: centrado y rojo -->
          <button onclick="SessionInvites._quitarPaso(${i})" style="
            background:transparent;
            border:1px solid #e74c3c;
            color:#e74c3c;
            border-radius:8px;
            width:34px;
            height:38px;
            cursor:pointer;
            flex-shrink:0;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:16px;
          ">✕</button>
        </div>
        ${selectorZona}
        <input class="sg-paso-accion" data-idx="${i}" value="${Utils.escapeHTML(p.accion || '')}" placeholder="Qué hay que hacer" style="width:100%; margin-bottom:6px; text-align:center;">
        <input class="sg-paso-porque" data-idx="${i}" value="${Utils.escapeHTML(p.porque || '')}" placeholder="Por qué (opcional)" style="width:100%; margin-bottom:0; text-align:center;">
      </div>
    `;
    }).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(this._editable.tipo)} ${this._diaGlobalAutoAsignado ? 'REGISTRAR ENTRENO' : 'NUEVA SESIÓN · PASO 1/3'}</span>
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
          💪 Una sesión de fuerza no usa distancia ni ritmo: pon los minutos de cada paso (calentamiento, ejercicios y estiramientos) ahí abajo, en "ESTRUCTURA DE LA SESIÓN", y describe qué hay que hacer en cada uno.
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
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary); letter-spacing:1px;">🧩 ESTRUCTURA DE LA SESIÓN</label>
          <p id="sgPasosInfoTexto" style="font-size:10px; color:var(--text-secondary); text-align:center; margin:2px 0 10px; line-height:1.4;"></p>
          <div id="sgPasosContainer" style="margin-top:8px;">${pasosHTML}</div>
          <div style="display:flex; gap:10px; margin-top:6px;">
            <button onclick="SessionInvites._anadirPaso('carrera')" style="flex:1; height:46px; padding:0 8px; margin:0; background:rgba(201,155,165,0.14); border:1.5px solid var(--zone-4); color:var(--zone-4); border-radius:12px; cursor:pointer; font-size:12px; font-weight:bold; letter-spacing:0.5px; box-shadow:var(--shadow-sm);">🏃 + CARRERA</button>
            <button onclick="SessionInvites._anadirPaso('fuerza')" style="flex:1; height:46px; padding:0 8px; margin:0; background:rgba(154,154,154,0.10); border:1.5px solid var(--border-color-light); color:var(--text-secondary); border-radius:12px; cursor:pointer; font-size:12px; font-weight:bold; letter-spacing:0.5px; box-shadow:var(--shadow-sm);">💪 + FUERZA</button>
          </div>
          <p style="font-size:10px; color:var(--text-secondary); text-align:center; margin:8px 0 0; line-height:1.5;"><span style="color:var(--zone-4);">🏃 Carrera</span> se coloca debajo de la parte principal y suma tiempo y distancia · <span style="color:var(--text-secondary);">💪 Fuerza</span> se coloca al final y solo suma tiempo</p>
        </div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cancelarGenerador()" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgContinuarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">${this._diaGlobalAutoAsignado ? 'GUARDAR' : 'CONTINUAR →'}</button>
      </div>
    `;

    document.getElementById('sgTipo').value = this._editable.tipo;
    document.getElementById('sgNombre').value = d.nombre || '';
    document.getElementById('sgModoParte').value = d.modoPartePrincipal || 'distancia';
    document.getElementById('sgDistancia').value = d.distanciaEstimada || '';
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
          if (modo === 'tiempo') {
            // 🔥 Ya no hay un campo aparte arriba para el tiempo de la
            // parte principal (duplicaba la fila "PARTE PRINCIPAL" de los
            // bloques de abajo, que además la pisaba dejándola a 0 si no
            // se rellenaba también). Ahora la única fuente es esa fila.
            const minPartePrincipal = (det.pasosDetallados || [])
              .filter(p => !p.tipoExtra && (p.titulo || '').toUpperCase().includes('PARTE PRINCIPAL'))
              .reduce((s, p) => s + (p.duracionMin || 0), 0);
            if (!(minPartePrincipal > 0)) {
              Utils.showToast('Pon los minutos del bloque PARTE PRINCIPAL, más abajo', 'warning');
              return;
            }
          }
        }
      }
      if (this._diaGlobalAutoAsignado) {
        this._confirmarAutoAsignacion();
      } else {
        this._transicionarPaso(() => this._renderPaso2Calendario());
      }
    });
  },

  _ajustarPasosPorDefectoSegunTipo() {
    if (this._editable.tipo !== 'strength') return;
    (this._editable.detalle.pasosDetallados || []).forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit === 'ENFRIAMIENTO') p.titulo = 'ESTIRAMIENTOS';
      if (tit === 'PARTE PRINCIPAL' && !p.duracionMin) p.duracionMin = 30;
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
        ? 'Pon los minutos de CADA paso (calentamiento, ejercicios, estiramientos): en fuerza no hay distancia que convertir, así que todos los pasos llevan su propio tiempo.'
        : 'Pon los minutos de CADA paso: así, al hacer la sesión con GPS, la app marca esos tramos automáticamente. La duración total será la suma de todos los pasos. Los pasos extra (como fuerza) suman tiempo pero no distancia.';
    }
  },

  _actualizarModoParte() {
    const modo = document.getElementById('sgModoParte')?.value || 'distancia';
    const distWrap = document.getElementById('sgDistanciaWrap');
    const info = document.getElementById('sgInfoModoParte');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (info) {
      info.innerHTML = modo === 'distancia'
        ? 'ℹ️ Esta distancia es SOLO la parte principal. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se convierten a km con el ritmo de Z1 de cada usuario, sumándose a la distancia y al tiempo total de la sesión.'
        : 'ℹ️ Pon la duración de la parte principal en el bloque "PARTE PRINCIPAL" de más abajo (en minutos, igual que el calentamiento y el enfriamiento): la distancia que cubre en ese tiempo se calcula sola, según el ritmo real de cada usuario en esa zona -- así todos entrenan el mismo tiempo a esa intensidad, no la misma distancia.';
    }
  },

  _actualizarModoRepSerie() {
    const modo = document.getElementById('sgSerModoRep')?.value || 'distancia';
    const distWrap = document.getElementById('sgSerDistWrap');
    const tiempoWrap = document.getElementById('sgSerTiempoWrap');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (tiempoWrap) tiempoWrap.style.display = modo === 'tiempo' ? 'block' : 'none';
  },

  // 🔥 v9: _anadirPaso ahora recibe el tipo elegido ('carrera' o 'fuerza'):
  // - carrera: se inserta justo debajo de "PARTE PRINCIPAL" (suma tiempo y
  //   distancia a la misma zona, como si fuera más parte principal)
  // - fuerza: se inserta al final, justo después del enfriamiento (solo
  //   suma tiempo total, no distancia)
  _anadirPaso(tipoExtra) {
    this._leerPasosDelDOM();
    const pasos = this._editable.detalle.pasosDetallados;

    const esCarrera = tipoExtra === 'carrera';
    // Zona por defecto del nuevo paso "carrera": la misma que la parte
    // principal actual (rodaje/tempo/largo) o la de esfuerzo (series), si
    // hay alguna seleccionada en el formulario; si no, Z2 por defecto. El
    // admin puede cambiarla luego con el selector propio del paso.
    const zonaDefecto = document.getElementById('sgZona')?.value
      || document.getElementById('sgSerZona')?.value
      || 'Z2';
    const nuevoPaso = esCarrera
      ? { icono: '🏃', titulo: 'CARRERA EXTRA', accion: '', porque: '', duracionMin: 10, tipoExtra: 'carrera', zona: zonaDefecto }
      : { icono: '💪', titulo: 'FUERZA', accion: '', porque: '', duracionMin: 10, tipoExtra: 'fuerza' };

    if (esCarrera) {
      // Justo debajo de "PARTE PRINCIPAL"
      let idxPrincipal = pasos.findIndex(p => (p.titulo || '').toUpperCase().includes('PARTE PRINCIPAL'));
      if (idxPrincipal === -1) {
        // Sin paso "parte principal" (p.ej. lo quitaron): lo ponemos antes
        // del enfriamiento si existe, o al final
        let idxEnfriamiento = pasos.findIndex(p => {
          const t = (p.titulo || '').toUpperCase();
          return t.includes('ENFRIAMIENTO') || t.includes('ESTIRAMIENTO');
        });
        pasos.splice(idxEnfriamiento === -1 ? pasos.length : idxEnfriamiento, 0, nuevoPaso);
      } else {
        pasos.splice(idxPrincipal + 1, 0, nuevoPaso);
      }
    } else {
      // Justo después del enfriamiento -> al final de la lista
      pasos.push(nuevoPaso);
    }

    this._renderPaso1();
  },

  _quitarPaso(idx) {
    this._leerPasosDelDOM();
    this._editable.detalle.pasosDetallados.splice(idx, 1);
    this._renderPaso1();
  },

  // 🔥 v9: se preserva p.tipoExtra (carrera/fuerza) al reconstruir la lista
  // desde el DOM -- antes se perdía en cada _leerPasosDelDOM() porque solo
  // se leían los campos visibles del formulario (icono/título/acción/
  // porqué/minutos), no el marcador interno de tipo de paso.
  // 🔥 v10: además de tipoExtra, se lee/preserva p.zona (el selector propio
  // de zona de los pasos "carrera").
  _leerPasosDelDOM() {
    const filas = document.querySelectorAll('#sgPasosContainer .sessgen-paso');
    const pasosActuales = this._editable.detalle.pasosDetallados || [];
    const pasos = [];
    filas.forEach(fila => {
      const minInput = fila.querySelector('.sg-paso-min');
      const zonaInput = fila.querySelector('.sg-paso-zona');
      const idxOriginal = parseInt(fila.dataset.idx, 10);
      const original = pasosActuales[idxOriginal];
      const paso = {
        icono: fila.querySelector('.sg-paso-icono')?.value || '📌',
        titulo: fila.querySelector('.sg-paso-titulo')?.value || '',
        accion: fila.querySelector('.sg-paso-accion')?.value || '',
        porque: fila.querySelector('.sg-paso-porque')?.value || '',
        duracionMin: minInput ? (parseInt(minInput.value) || 0) : undefined
      };
      if (original && original.tipoExtra) paso.tipoExtra = original.tipoExtra;
      if (zonaInput) paso.zona = zonaInput.value;
      else if (original && original.zona) paso.zona = original.zona;
      pasos.push(paso);
    });
    if (filas.length > 0) this._editable.detalle.pasosDetallados = pasos;
  },

  // 🔥 MODIFICADO: se leen los minutos de todos los pasos
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

    // Extraemos calentamiento y enfriamiento para compatibilidad con otras partes
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
    d.zona = document.getElementById('sgZona').value;
  },

  _renderPaso2Calendario() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">📅 ELIGE LOS DÍAS · PASO 2/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary); letter-spacing:1px;">📅 SELECCIONA LOS DÍAS</label>
        <p style="font-size:11px; color:var(--text-secondary); text-align:center; margin:2px 0 12px; line-height:1.4;">
          Puedes elegir varios días para esta misma sesión (toca para marcar/desmarcar cada uno).
        </p>
        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; box-shadow:var(--shadow-sm);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <button onclick="SessionInvites._cambiarMes(-1)" style="background:rgba(192,160,96,0.12); border:1.5px solid var(--gold); color:var(--gold); border-radius:10px; width:38px; height:38px; cursor:pointer; font-size:16px; font-weight:bold;">‹</button>
            <span id="sgMesLabel" style="font-weight:bold; letter-spacing:1px; color:var(--text-primary);"></span>
            <button onclick="SessionInvites._cambiarMes(1)" style="background:rgba(192,160,96,0.12); border:1.5px solid var(--gold); color:var(--gold); border-radius:10px; width:38px; height:38px; cursor:pointer; font-size:16px; font-weight:bold;">›</button>
          </div>
          <div id="sgCalendarioGrid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;"></div>
        </div>
        <div id="sgFechaElegidaTxt" style="text-align:center; margin-top:14px; padding:12px; border-radius:12px; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); font-weight:bold; font-size:13px; line-height:1.5; min-height:20px; transition:all 0.15s ease;"></div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso1())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgContinuarPaso2Btn" class="action-button" style="width:auto; padding:0 32px; margin:0;" disabled>CONTINUAR →</button>
      </div>
    `;
    this._renderizarMesCalendario();
    this._actualizarTextoFechas();
    // 🔥 Se lanzan las dos precargas (usuarios Y grupos) nada más entrar en
    // el Paso 2, en paralelo, mientras el admin todavía está eligiendo los
    // días en el calendario -- así, para cuando llegue al Paso 3, lo normal
    // es que las dos ya estén en caché y esa pantalla aparezca ya cargada
    // de una vez, sin ningún salto al ir apareciendo cada cosa por separado.
    this._precargarUsuarios();
    this._precargarGrupos();
    document.getElementById('sgContinuarPaso2Btn').addEventListener('click', async () => {
      if (!this._fechasSeleccionadas.size) return;
      const btn = document.getElementById('sgContinuarPaso2Btn');
      if (!this._usuariosTodos || !this._gruposTodos) {
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Cargando...'; }
        await Promise.all([this._precargarUsuarios(), this._precargarGrupos()]);
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

  _precargarGrupos() {
    if (this._gruposTodos || this._precargaGruposPromise) return this._precargaGruposPromise;
    this._precargaGruposPromise = firebaseServices.db.collection('sessionGroups')
      .where('createdBy', '==', AppState.currentUserId)
      .get()
      .then(snapshot => {
        this._gruposTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      })
      .catch(e => {
        console.error('Error cargando grupos:', e);
        this._gruposTodos = [];
      })
      .finally(() => { this._precargaGruposPromise = null; });
    return this._precargaGruposPromise;
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
          text-align:center; padding:10px 0; border-radius:10px; cursor:pointer; font-size:13px;
          background:${esSeleccionado ? 'var(--gold)' : 'var(--bg-primary)'};
          color:${esSeleccionado ? '#000' : 'var(--text-primary)'};
          border:1px solid ${esSeleccionado ? 'var(--gold)' : (esHoy ? 'var(--gold)' : 'var(--border-color)')};
          box-shadow:${esSeleccionado ? '0 2px 6px rgba(192,160,96,0.35)' : 'none'};
          font-weight:${esHoy || esSeleccionado ? 'bold' : 'normal'};
          transition:all 0.15s ease;
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
      txt.style.borderColor = 'var(--border-color)';
      txt.style.background = 'transparent';
      txt.textContent = 'No has marcado ningún día todavía.';
      return;
    }
    const fechasTxt = Array.from(this._fechasSeleccionadas)
      .sort()
      .map(key => new Date(key + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
    const cabecera = n === 1 ? 'Has seleccionado el día:' : `Has seleccionado estos ${n} días:`;
    txt.style.color = 'var(--gold)';
    txt.style.borderColor = 'var(--gold)';
    txt.style.background = 'rgba(192,160,96,0.10)';
    txt.innerHTML = `${cabecera}<br>${fechasTxt.join(' · ')}`;
  },

  async _renderPaso3Usuarios() {
    this._asegurarEstiloHistorial(); // inyecta las keyframes riSkeletonPulse/riFadeInUp si no estaban ya
    const { modal } = this._crearOverlayModal('sessGen');

    // 🔥 Si el Paso 2 ya terminó de precargar usuarios y grupos (lo normal:
    // ese paso espera a las dos precargas antes de dejar continuar), esta
    // pantalla se pinta entera desde el primer fotograma, sin placeholders
    // ni esqueleto -- aparece "ya cargada", sin ningún salto de tamaño. El
    // esqueleto de abajo es solo un remate defensivo para el caso raro en
    // que, aun así, alguna de las dos no esté lista todavía.
    const usuariosListos = !!this._usuariosTodos;
    const gruposListos = !!this._gruposTodos;

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">👥 ELIGE USUARIOS · PASO 3/3</span>
        <!-- 🔥 Contador de seleccionados: va en la cabecera fija (fuera del
             área con scroll) para que se vea siempre mientras se baja por
             la lista de usuarios, sin tener que mirar el botón de abajo. -->
        <div style="margin-top:6px;">
          <span id="sgContadorSeleccionados" style="display:inline-block; font-size:11px; font-weight:bold; letter-spacing:0.5px; color:var(--gold); background:rgba(192,160,96,0.12); border:1px solid var(--gold); border-radius:20px; padding:3px 14px;">0 seleccionados</span>
        </div>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div style="margin-bottom:16px;">
          <button onclick="SessionInvites._abrirGestionGrupos()" style="display:block; width:100%; background:transparent; border:none; padding:4px 0 12px; margin:0; font-family:'Courier New',monospace; font-size:15px; font-weight:bold; letter-spacing:1px; color:var(--text-primary); text-align:center; cursor:pointer;">GESTIONAR GRUPOS</button>
          <div id="sgGruposList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(88px, 1fr)); gap:10px;">${gruposListos ? '' : this._skeletonGrupos()}</div>
        </div>
        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">🔎 BUSCA Y MARCA A QUIÉN ENVIAR</label>
        <input id="sgUsuariosBuscar" placeholder="> BUSCAR USUARIO_" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="sgUsuariosList">${usuariosListos ? '' : this._skeletonUsuarios()}</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso2Calendario())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgEnviarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">📤 ENVIAR (<span id="sgCountSeleccionados">0</span>)</button>
      </div>
    `;

    this._actualizarContadorSeleccionados();

    if (usuariosListos) {
      this._renderizarListaUsuarios(this._usuariosTodos);
    } else {
      this._precargarUsuarios().then(() => {
        this._renderizarListaUsuarios(this._usuariosTodos, true);
      });
    }

    if (gruposListos) {
      this._renderizarGrupos();
    } else {
      this._precargarGrupos().then(() => this._renderizarGrupos(true));
    }

    document.getElementById('sgUsuariosBuscar').addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
        (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
      );
      this._renderizarListaUsuarios(filtrados);
    });

    document.getElementById('sgEnviarBtn').addEventListener('click', () => this._confirmarEnvio());
  },

  // Filas grises pulsantes con la altura real de una tarjeta de usuario,
  // para que si hace falta mostrarlas no cambien de tamaño al swapear por
  // las de verdad (mismo patrón que ya usa "Últimas sesiones creadas").
  _skeletonUsuarios(n = 5) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div style="height:52px; border-radius:10px; background:var(--stat-bg); border:1px solid var(--border-color); border-left:4px solid var(--border-color-light); margin-bottom:8px; animation:riSkeletonPulse 1.2s ease-in-out infinite; animation-delay:${(i * 0.15).toFixed(2)}s;"></div>`;
    }
    return html;
  },

  // Igual que arriba pero para las tarjetas cuadradas de grupos.
  _skeletonGrupos(n = 3) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div style="height:74px; border-radius:14px; background:var(--stat-bg); border:1px solid var(--border-color); animation:riSkeletonPulse 1.2s ease-in-out infinite; animation-delay:${(i * 0.15).toFixed(2)}s;"></div>`;
    }
    return html;
  },

  _renderizarListaUsuarios(usuarios, animar = false) {
    const container = document.getElementById('sgUsuariosList');
    if (!container) return;
    if (usuarios.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    container.innerHTML = usuarios.map((u, idx) => {
      const marcado = this._usuariosSeleccionados.has(u.uid);
      const nombreMostrado = Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'));
      const inicial = Utils.escapeHTML(((u.username || '?').trim().charAt(0) || '?').toUpperCase());
      // 🔥 Avatar = foto de perfil real del usuario (redondel pulsable), y
      // solo si no tiene foto se cae de vuelta a la inicial de su nombre --
      // antes aquí siempre iba la inicial, nunca la foto.
      const photoURL = u.profile?.photoURL || null;
      const avatar = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; cursor:pointer; border:2px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};">`
        : `<div style="
            width:34px; height:34px; border-radius:50%; flex-shrink:0; cursor:pointer;
            background:${marcado ? 'var(--gold)' : 'var(--bg-primary)'};
            border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
            color:${marcado ? '#000' : 'var(--text-secondary)'};
            display:flex; align-items:center; justify-content:center;
            font-weight:bold; font-size:14px;
          ">${inicial}</div>`;
      const animStyle = animar ? `animation:riFadeInUp 0.3s ease both; animation-delay:${(Math.min(idx, 9) * 0.03).toFixed(2)}s;` : '';
      return `
        <div onclick="SessionInvites._toggleUsuario('${u.uid}')" style="
          display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:8px;
          background:${marcado ? 'rgba(192,160,96,0.12)' : 'var(--stat-bg)'};
          border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
          border-left:4px solid ${marcado ? 'var(--gold)' : 'var(--border-color-light)'};
          border-radius:12px; cursor:pointer; box-shadow:var(--shadow-sm);
          transition:all 0.15s ease; ${animStyle}
        ">
          ${avatar}
          <div style="flex:1;">
            <div style="font-size:14px; color:var(--text-primary); font-weight:${marcado ? 'bold' : 'normal'};">${nombreMostrado}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${Utils.escapeHTML(u.email || '')}</div>
          </div>
          <span style="font-size:18px; flex-shrink:0;">${marcado ? '☑️' : '⬜'}</span>
        </div>`;
    }).join('');
  },

  // Mantiene sincronizados los dos contadores de seleccionados: el chip
  // fijo de la cabecera (visible aunque se baje por la lista) y el número
  // dentro del botón ENVIAR del pie.
  _actualizarContadorSeleccionados() {
    const n = this._usuariosSeleccionados.size;
    const chip = document.getElementById('sgContadorSeleccionados');
    if (chip) chip.textContent = `${n} seleccionado${n === 1 ? '' : 's'}`;
    const countEl = document.getElementById('sgCountSeleccionados');
    if (countEl) countEl.textContent = n;
  },

  _toggleUsuario(uid) {
    if (this._usuariosSeleccionados.has(uid)) this._usuariosSeleccionados.delete(uid);
    else this._usuariosSeleccionados.add(uid);
    const term = document.getElementById('sgUsuariosBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    );
    this._renderizarListaUsuarios(filtrados);
    this._actualizarContadorSeleccionados();
  },

  // Pinta los grupos del admin como tarjetas cuadradas en una rejilla (no
  // como píldoras en una fila continua), para que cada grupo se vea como
  // su propio bloque bien separado -- más fácil de distinguir de un
  // vistazo que tenerlos todos pegados unos a otros. Una tarjeta se marca
  // en dorado cuando TODOS sus miembros (los que sigan existiendo en
  // _usuariosTodos) ya están seleccionados en la lista de abajo. Pulsarla
  // marca de golpe a todos sus miembros; volver a pulsarla (con todos ya
  // marcados) los desmarca de golpe -- así sirve tanto para añadir el
  // grupo entero como para quitarlo entero sin tener que ir uno a uno.
  _renderizarGrupos(animar = false) {
    const cont = document.getElementById('sgGruposList');
    if (!cont) return;
    const grupos = this._gruposTodos || [];
    if (grupos.length === 0) {
      cont.innerHTML = '<span style="font-size:12px; color:var(--text-secondary);">Aún no tienes grupos creados. Pulsa "Gestionar" para crear el primero.</span>';
      return;
    }
    cont.innerHTML = grupos.map((g, idx) => {
      const miembrosValidos = (g.members || []).filter(uid => this._usuariosTodos.some(u => u.uid === uid));
      const todosMarcados = miembrosValidos.length > 0 && miembrosValidos.every(uid => this._usuariosSeleccionados.has(uid));
      const animStyle = animar ? `animation:riFadeInUp 0.3s ease both; animation-delay:${(idx * 0.05).toFixed(2)}s;` : '';
      return `
        <div onclick="SessionInvites._toggleGrupo('${g.id}')" style="
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
          cursor:pointer; text-align:center; padding:12px 6px;
          background:${todosMarcados ? 'var(--gold)' : 'var(--stat-bg)'};
          color:${todosMarcados ? '#000' : 'var(--text-primary)'};
          border:1px solid ${todosMarcados ? 'var(--gold)' : 'var(--border-color)'};
          border-radius:14px; box-shadow:var(--shadow-sm);
          transition:all 0.15s ease; ${animStyle}
        ">
          <span style="font-size:20px;">📁</span>
          <span style="font-size:12px; font-weight:bold; line-height:1.2; word-break:break-word;">${Utils.escapeHTML(g.name)}</span>
          <span style="font-size:10px; opacity:0.8;">${miembrosValidos.length} miembro(s)</span>
        </div>`;
    }).join('');
  },

  _toggleGrupo(id) {
    const grupo = (this._gruposTodos || []).find(g => g.id === id);
    if (!grupo) return;
    const miembrosValidos = (grupo.members || []).filter(uid => this._usuariosTodos.some(u => u.uid === uid));
    const todosMarcados = miembrosValidos.length > 0 && miembrosValidos.every(uid => this._usuariosSeleccionados.has(uid));
    if (todosMarcados) miembrosValidos.forEach(uid => this._usuariosSeleccionados.delete(uid));
    else miembrosValidos.forEach(uid => this._usuariosSeleccionados.add(uid));

    const term = document.getElementById('sgUsuariosBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    );
    this._renderizarListaUsuarios(filtrados);
    this._renderizarGrupos();
    this._actualizarContadorSeleccionados();
  },

  // ============================================================
  // GESTIÓN DE GRUPOS (crear / editar / eliminar)
  // ============================================================

  _abrirGestionGrupos() {
    const { modal } = this._crearOverlayModal('sessGroups');
    modal.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">📁 GESTIONAR GRUPOS</span>
      </div>
      <div id="sgGruposGestionList" style="padding:16px 20px; overflow-y:auto; flex:1;">⏳ Cargando...</div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; flex-direction:column; gap:10px;">
        <button onclick="SessionInvites._abrirFormularioGrupo()" class="action-button" style="width:100%; margin:0;">➕ CREAR GRUPO</button>
        <button onclick="SessionInvites._cerrarModal('sessGroups')" class="action-button" style="width:100%; margin:0; background:transparent; border:1px solid var(--border-color-light);">CERRAR</button>
      </div>
    `;
    this._renderizarGestionGrupos();
  },

  async _renderizarGestionGrupos() {
    const cont = document.getElementById('sgGruposGestionList');
    if (!cont) return;
    if (!this._gruposTodos) await this._precargarGrupos();
    const grupos = this._gruposTodos || [];
    if (grupos.length === 0) {
      cont.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Aún no tienes ningún grupo creado.</p>';
      return;
    }
    // 🔥 Cada grupo es su propia tarjeta independiente, con dos filas
    // claramente separadas por una línea divisoria: arriba el nombre
    // (centrado, sin icono) y el número de miembros, abajo los dos
    // botones de acción a ancho completo (con texto, no solo el icono
    // suelto) -- así no quedan "flotando" en medio de la tarjeta, cada
    // uno ocupa su propia mitad bien delimitada.
    cont.innerHTML = grupos.map(g => `
      <div style="padding:14px; margin-bottom:12px; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; box-shadow:var(--shadow-sm);">
        <div style="margin-bottom:12px; text-align:center;">
          <div style="font-size:15px; color:var(--text-primary); font-weight:bold;">${Utils.escapeHTML(g.name)}</div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">${(g.members || []).length} miembro(s)</div>
        </div>
        <div style="display:flex; gap:10px; border-top:1px solid var(--border-color); padding-top:10px;">
          <button onclick="SessionInvites._abrirFormularioGrupo('${g.id}')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:transparent; border:1px solid var(--gold); color:var(--gold); border-radius:10px; padding:9px 0; font-size:12px; font-weight:bold; letter-spacing:0.3px; cursor:pointer;">✏️ EDITAR</button>
          <button onclick="SessionInvites._eliminarGrupo('${g.id}')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:transparent; border:1px solid var(--zone-5); color:var(--zone-5); border-radius:10px; padding:9px 0; font-size:12px; font-weight:bold; letter-spacing:0.3px; cursor:pointer;">🗑️ ELIMINAR</button>
        </div>
      </div>
    `).join('');
  },

  async _abrirFormularioGrupo(groupId = null) {
    const grupo = groupId ? (this._gruposTodos || []).find(g => g.id === groupId) : null;
    this._grupoEditandoId = groupId;
    this._grupoMiembrosSeleccionados = new Set(grupo ? (grupo.members || []) : []);

    const { modal } = this._crearOverlayModal('sessGroupForm');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${grupo ? '✏️ EDITAR GRUPO' : '➕ CREAR GRUPO'}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; font-size:11px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">NOMBRE DEL GRUPO</label>
        <input id="sgGrupoNombre" placeholder="Ej: Gimnasio" value="${grupo ? Utils.escapeHTML(grupo.name) : ''}" style="width:100%; margin-bottom:16px; text-align:center;">
        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">🔎 MARCA LOS MIEMBROS</label>
        <input id="sgGrupoBuscar" placeholder="> BUSCAR USUARIO_" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="sgGrupoMiembrosList">⏳ Cargando usuarios...</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessGroupForm')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgGuardarGrupoBtn" class="action-button" style="width:auto; padding:0 24px; margin:0;">💾 GUARDAR</button>
      </div>
    `;

    if (!this._usuariosTodos) await this._precargarUsuarios();
    this._renderizarMiembrosFormularioGrupo(this._usuariosTodos);

    document.getElementById('sgGrupoBuscar').addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
        (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
      );
      this._renderizarMiembrosFormularioGrupo(filtrados);
    });

    document.getElementById('sgGuardarGrupoBtn').addEventListener('click', () => this._guardarGrupo());
  },

  _renderizarMiembrosFormularioGrupo(usuarios) {
    const cont = document.getElementById('sgGrupoMiembrosList');
    if (!cont) return;
    if (!usuarios || usuarios.length === 0) {
      cont.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    cont.innerHTML = usuarios.map(u => {
      const marcado = this._grupoMiembrosSeleccionados.has(u.uid);
      const nombreMostrado = Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'));
      return `
        <div onclick="SessionInvites._toggleMiembroGrupo('${u.uid}')" style="
          display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; margin-bottom:8px;
          background:${marcado ? 'rgba(192,160,96,0.12)' : 'var(--stat-bg)'};
          border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
          border-left:4px solid ${marcado ? 'var(--gold)' : 'var(--border-color-light)'};
          border-radius:12px; cursor:pointer; box-shadow:var(--shadow-sm); transition:all 0.15s ease;
        ">
          <span style="font-size:14px; color:var(--text-primary); font-weight:${marcado ? 'bold' : 'normal'};">${nombreMostrado}</span>
          <span style="font-size:18px; flex-shrink:0;">${marcado ? '☑️' : '⬜'}</span>
        </div>`;
    }).join('');
  },

  _toggleMiembroGrupo(uid) {
    if (this._grupoMiembrosSeleccionados.has(uid)) this._grupoMiembrosSeleccionados.delete(uid);
    else this._grupoMiembrosSeleccionados.add(uid);
    const term = document.getElementById('sgGrupoBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    );
    this._renderizarMiembrosFormularioGrupo(filtrados);
  },

  async _guardarGrupo() {
    const nombre = document.getElementById('sgGrupoNombre')?.value.trim();
    if (!nombre) { Utils.showToast('Ponle un nombre al grupo', 'warning'); return; }
    if (!this._grupoMiembrosSeleccionados.size) { Utils.showToast('Marca al menos un miembro', 'warning'); return; }

    const btn = document.getElementById('sgGuardarGrupoBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }

    try {
      const members = Array.from(this._grupoMiembrosSeleccionados);
      if (this._grupoEditandoId) {
        await firebaseServices.db.collection('sessionGroups').doc(this._grupoEditandoId).update({ name: nombre, members });
      } else {
        await firebaseServices.db.collection('sessionGroups').add({
          name: nombre,
          members,
          createdBy: AppState.currentUserId,
          createdAt: firebaseServices.Timestamp.now()
        });
      }
      this._gruposTodos = null;
      await this._precargarGrupos();
      this._cerrarModal('sessGroupForm');
      this._renderizarGestionGrupos();
      this._renderizarGrupos();
      Utils.showToast('✅ Grupo guardado', 'success');
    } catch (e) {
      console.error('Error guardando grupo:', e);
      Utils.showToast('Error al guardar el grupo', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '💾 GUARDAR'; }
    }
  },

  async _eliminarGrupo(id) {
    const confirmado = await Utils.confirm('Eliminar grupo', '¿Eliminar este grupo? Esta acción no se puede deshacer.');
    if (!confirmado) return;
    try {
      await firebaseServices.db.collection('sessionGroups').doc(id).delete();
      this._gruposTodos = null;
      await this._precargarGrupos();
      this._renderizarGestionGrupos();
      this._renderizarGrupos();
      Utils.showToast('🗑️ Grupo eliminado', 'success');
    } catch (e) {
      console.error('Error eliminando grupo:', e);
      Utils.showToast('Error al eliminar el grupo', 'error');
    }
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
    // 🔥 Esperar un frame para que la animación de "EN PROCESO" se pinte
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
      this._historialLastDoc = null;
      this._historialHayMas = false;
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error enviando sesiones:', e);
      Utils.hideLoading();
      Utils.showToast('Error al enviar la sesión', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `📤 ENVIAR (<span id="sgCountSeleccionados">${this._usuariosSeleccionados.size}</span>)`; }
    }
  },

  // 🔥 Equivalente a la primera mitad de _aceptar() (el cálculo de
  // personalización -- calentamiento/parte principal/enfriamiento, TSS,
  // ritmo -- con los datos del propio usuario en vez de un destinatario),
  // pero sin pasar por sessionInvites ni por el "plan personalizado"
  // aparte que usa ese flujo: la sesión se inserta directamente en el
  // plan que el usuario ya tiene abierto, en el día exacto donde pulsó
  // "+". Así no se crea un plan paralelo ni se cambia el plan activo.
  async _confirmarAutoAsignacion() {
    const diaGlobal = this._diaGlobalAutoAsignado;
    if (!diaGlobal) return;
    const btn = document.getElementById('sgContinuarBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'GUARDANDO...'; }
    Utils.showLoading();
    try {
      const uid = AppState.currentUserId;
      const sesionData = JSON.parse(JSON.stringify(this._editable));
      const det = sesionData.detalle || {};
      let personalizado;
      if (sesionData.tipo === 'descanso') {
        personalizado = { ritmoStr: null, duracionMin: 0, tss: null, calorias: null, calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null };
      } else if (sesionData.tipo === 'strength') {
        const peso = await this._obtenerPesoUsuario(uid);
        personalizado = this._calcularPersonalizacionFuerza(det.pasosDetallados, peso);
      } else {
        const [calculo, peso] = await Promise.all([
          this._obtenerCalculoDestinatario(uid),
          this._obtenerPesoUsuario(uid)
        ]);
        if (sesionData.tipo === 'series' && det.seriesConfig) {
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

      const detalleFinal = this._construirDetalleSesion(sesionData, personalizado);
      const duracionTotal = (personalizado.calentamiento || 0) + (personalizado.partePrincipal || 0) + (personalizado.enfriamiento || 0);

      const nuevaSesion = await PlanGenerator.insertarSesionManualEnPlan(diaGlobal, sesionData.tipo, duracionTotal, detalleFinal);
      Utils.hideLoading();
      this._cerrarModal('sessGen');
      this._diaGlobalAutoAsignado = null;
      // La sesión ya está guardada en el plan en este punto -- abrir su
      // detalle es solo UI, así que un fallo ahí no debe decir "Error al
      // crear el entreno" (mismo criterio que el resto de fixes de toasts
      // contradictorios de esta sesión de cambios).
      if (nuevaSesion) {
        try {
          PlanGenerator.abrirDetalleSesion(nuevaSesion, diaGlobal);
        } catch (uiError) {
          console.error('Error abriendo el detalle del entreno recién creado:', uiError);
        }
      }
    } catch (e) {
      console.error('Error creando el entreno no programado:', e);
      Utils.hideLoading();
      Utils.showToast('Error al crear el entreno', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'GUARDAR'; }
    }
  },

  // ============================================================
  // HISTORIAL CON COLORES AJUSTADOS PARA MODO OSCURO
  // ============================================================

  async mostrarHistorial() {
    const container = document.getElementById('adminSesionesEnviadasList');
    if (!container || !AppState.currentUserId) return;
    this._asegurarEstiloHistorial();

    if (!this._historialCache) {
      // 🔥 v12.7: tarjetas "esqueleto" pulsando (mismo alto que las
      // tarjetas reales, para que no haya salto al sustituirlas) en vez
      // de un texto fijo sin animación.
      container.innerHTML = `
        <h4 style="font-size:12px; letter-spacing:1px; color:var(--text-secondary); margin:0 0 10px;">📜 ÚLTIMAS SESIONES CREADAS</h4>
        ${[0, 1, 2].map(i => `
          <div style="height:52px; border-radius:10px; background:var(--stat-bg); border:1px solid var(--border-color); border-left:4px solid var(--border-color-light); margin-bottom:6px; animation:riSkeletonPulse 1.2s ease-in-out infinite; animation-delay:${(i * 0.15).toFixed(2)}s;"></div>
        `).join('')}
      `;
      try {
        const { lotes, lastDoc, hayMas } = await this._cargarTandaHistorial(10, null, new Map());
        this._historialCache = lotes;
        this._historialLastDoc = lastDoc;
        this._historialHayMas = hayMas;
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
      const color = this._colorTipo(lote.tipo, true);
      const fechaTxt = this._resumenFechas(lote.fechas);
      const estadoTxt = lote.total > 1
        ? `${lote.aceptadas}✅ ${lote.rechazadas}❌ ${lote.pendientes}⏳ de ${lote.total}`
        : (lote.aceptadas ? '✅ Aceptada' : lote.rechazadas ? '❌ Rechazada' : '⏳ Pendiente');
      return `
        <div onclick="SessionInvites._abrirDetalleHistorial(${idx})" style="
          display:flex; justify-content:space-between; align-items:center; gap:10px;
          background:${color.bg}; border:1px solid ${color.accent};
          border-left:4px solid ${color.accent}; border-radius:10px; padding:10px 12px; margin-bottom:6px;
          cursor:pointer; transition:all 0.15s ease;
          animation:riFadeInUp 0.3s ease both; animation-delay:${(Math.min(idx, 9) * 0.04).toFixed(2)}s;
        ">
          <div style="min-width:0;">
            <div style="font-size:13px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}
            </div>
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
      ${this._historialHayMas ? `<button id="cargarMasHistorialBtn" class="action-button" style="margin-top:2px; background:transparent; border:1px solid var(--border-color);" onclick="SessionInvites.cargarMasHistorial()">CARGAR MÁS</button>` : ''}
    `;
  },

  // 🔥 FIX bug reportado: solo aparecían 3 lotes en vez de 10. Causa real:
  // se leía un único bloque fijo de 60 documentos EN BRUTO de
  // sessionInvites (uno por cada destinatario) y se agrupaban por
  // batchId -- pero si un envío se manda a 20-30 personas a la vez (un
  // broadcast normal en un club), cada envío consume 20-30 de esos 60
  // documentos. Con 2-3 envíos así el límite de 60 ya está agotado, así
  // que los lotes más antiguos ni siquiera llegaban a leerse de
  // Firestore -- el corte final a 10 era irrelevante si solo había 2-3
  // lotes distintos entre esos 60 documentos (mismo patrón que el bug ya
  // arreglado en el panel de Soporte del admin).
  //
  // Ahora se piden bloques de 60 documentos en bruto, uno tras otro,
  // hasta reunir `objetivoMostrar` LOTES distintos (o agotar la
  // colección) -- así un club con envíos grandes también puede ver sus
  // últimas 10 sesiones creadas, no solo las 2-3 que quepan en el primer
  // bloque de documentos.
  async _cargarTandaHistorial(objetivoMostrar, startAfterDoc, mapPrevio) {
    const lotesMap = mapPrevio || new Map();
    const LOTE = 60;
    const MAX_VUELTAS = 10;
    let lastDoc = startAfterDoc;
    let hayMasFirestore = true;
    let vueltas = 0;

    while (lotesMap.size < objetivoMostrar && hayMasFirestore && vueltas < MAX_VUELTAS) {
      let query = firebaseServices.db.collection('sessionInvites')
        .where('fromUid', '==', AppState.currentUserId)
        .orderBy('createdAt', 'desc')
        .limit(LOTE);
      if (lastDoc) query = query.startAfter(lastDoc);
      const snapshot = await query.get();
      vueltas++;
      if (snapshot.empty) { hayMasFirestore = false; break; }

      snapshot.forEach(doc => {
        const d = doc.data();
        const clave = d.batchId || doc.id;
        if (!lotesMap.has(clave)) {
          lotesMap.set(clave, {
            clave,
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
        const lote = lotesMap.get(clave);
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

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hayMasFirestore = snapshot.docs.length === LOTE;
    }

    const todos = Array.from(lotesMap.values())
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const lotes = todos.slice(0, objetivoMostrar);
    lotes._map = lotesMap; // se conserva COMPLETO (lo que sobró) para "cargar más"
    const hayMas = todos.length > objetivoMostrar || hayMasFirestore;
    return { lotes, lastDoc, hayMas };
  },

  async cargarMasHistorial() {
    if (!this._historialHayMas) return;
    const btn = document.getElementById('cargarMasHistorialBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'CARGANDO...'; }
    try {
      const mapPrevio = this._historialCache?._map || new Map();
      const objetivoMostrar = (this._historialCache?.length || 0) + 10;
      const { lotes, lastDoc, hayMas } = await this._cargarTandaHistorial(objetivoMostrar, this._historialLastDoc, mapPrevio);
      this._historialCache = lotes;
      this._historialLastDoc = lastDoc;
      this._historialHayMas = hayMas;
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error cargando más historial de sesiones enviadas:', e);
      if (btn) { btn.disabled = false; btn.textContent = 'CARGAR MÁS'; }
    }
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
      // 🔥 FIX bug reportado: el lote borrado se quitaba del array que se
      // ve en pantalla, pero seguía dentro del Map interno (_map) que
      // guarda TODO lo ya leído de Firestore para "cargar más" -- así que
      // al pedir más volvía a aparecer aunque ya estuviera borrado de
      // verdad en la base de datos. Ahora se quita de los dos sitios a la
      // vez: del array visible y del Map que alimenta "cargar más".
      if (this._historialCache._map && lote.clave) {
        this._historialCache._map.delete(lote.clave);
      }
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

    const color = this._colorTipo(lote.tipo);
    // 🔥 el rojo #e74c3c apenas se leía en modo claro (fondo casi blanco):
    // en claro se usa un rojo más oscuro, mismo criterio que ya sigue
    // _colorTipo() más arriba para el resto de acentos.
    const esClaro = document.body.classList.contains('manual-light');
    const colorEliminar = esClaro ? '#B8362A' : '#e74c3c';
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
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center; border-left:4px solid ${color.accent};">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1; background:${color.bg};">
        <div style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Para el ${fechaTxt} · ${lote.total} envío${lote.total === 1 ? '' : 's'}</div>
        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
          ${filasUsuarios || '<div style="padding:12px; text-align:center; font-size:12px; color:var(--text-secondary);">Sin destinatarios</div>'}
        </div>
        <div style="display:flex; justify-content:center; margin-top:14px;">
          <button onclick="SessionInvites._eliminarHistorial(${idx}); SessionInvites._cerrarModal('sessHist');" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid ${colorEliminar}; color:${colorEliminar};">🗑️ ELIMINAR SESIÓN</button>
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
        { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
        { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0 },
        { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
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

    if (!document.body.contains(modal)) return;

    const zonaInfo = detalle.zona ? this._zonaInfo(detalle.zona) : null;

    // 🔥 FIX RAÍZ (bucle infinito en "Calculando..."): esta comprobación se
    // hace AHORA, aquí, ANTES de intentar personalizar nada -- antes se
    // miraba si `personalizado.duracionMin` salía null para decidir si al
    // destinatario le faltaban zonas, pero ese campo SIEMPRE es un número
    // (la suma de los minutos de los pasos, fijada así en
    // _calcularPersonalizacion/_calcularPersonalizacionSeries incluso sin
    // zonas calculadas), así que esa comprobación nunca se disparaba de
    // verdad. Como consecuencia el código seguía adelante e intentaba
    // personalizar la sesión igualmente -- y para sesiones tipo 'series'
    // (ej. 6x400m) esto disparaba un ReferenceError real más abajo
    // (`modoParte`/`parteInput` solo se declaraban dentro del "else" de
    // sesiones normales, pero se leían también fuera de ese bloque al
    // calcular `distanciaMostrar`): al no capturarse ese error, la
    // ejecución se cortaba justo después de pintar el modal de
    // "Calculando...", que se quedaba así congelado para siempre (el
    // "bucle infinito" reportado). Ahora, si la sesión necesita zona
    // (zonaInfo) y el destinatario no tiene zonas calculadas, se corta
    // aquí mismo sin intentar personalizar nada: se avisa y se rechaza la
    // sesión directamente (ya no se ofrece "ir a calcular zonas y volver",
    // a petición del usuario -- si el destinatario no puede recibirla, se
    // marca como rechazada y el admin tendrá que reenviarla).
    const sinZonasCalculadas = !!zonaInfo && !calculo;

    if (sinZonasCalculadas) {
      modal.innerHTML = `
        <div style="padding:20px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">🧮</div>
          <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
          </div>
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; margin-bottom:16px; font-size:12px; color:var(--text-secondary); line-height:1.6; text-align:left;">
            ⚠️ Todavía no tienes tus zonas de entrenamiento calculadas en este dispositivo, así que no podemos calcular tu ritmo, tiempo ni carga para esta sesión.<br><br>
            No puedes recibir sesiones así -- esta se marcará como <strong style="color:var(--text-primary);">rechazada</strong>. Calcula tus zonas en tu perfil y pide a <strong style="color:var(--text-primary);">${Utils.escapeHTML(nombreAdmin)}</strong> que te la vuelva a enviar.
          </div>
          <button id="sessInviteSinZonasBtn" class="action-button" style="width:100%; margin:0;">ENTENDIDO</button>
        </div>
      `;
      document.getElementById('sessInviteSinZonasBtn').addEventListener('click', () => this._rechazar(id, data));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Utils.hideLoading();
        });
      });
      return;
    }

    let modoParte = null, parteInput = null;
    let personalizado;
    if (sesion.tipo === 'series' && detalle.seriesConfig) {
      personalizado = this._calcularPersonalizacionSeries(
        detalle.seriesConfig, calculo, peso,
        detalle.pasosDetallados || []
      );
    } else {
      modoParte = detalle.modoPartePrincipal || 'distancia';
      parteInput = {
        modo: modoParte,
        valor: modoParte === 'tiempo' ? (detalle.duracionPartePrincipalMin || 0) : (detalle.distanciaEstimada || 0)
      };
      personalizado = this._calcularPersonalizacion(
        detalle.zona, parteInput, calculo, peso,
        detalle.pasosDetallados || []
      );
    }

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

        ${(!peso && distanciaMostrar) ? `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de esta sesión.</div>` : ''}

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
  },

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

      // 🔥 FIX bug real (no solo de toast): a partir de aquí la sesión YA
      // está guardada de verdad en el plan del usuario y el invite ya
      // está marcado como aceptado en Firestore -- lo que sigue
      // (mostrar el calendario, refrescar el dashboard) es solo UI. Antes
      // iba dentro del MISMO try/catch: si CUALQUIERA de esos pasos de UI
      // fallaba (p.ej. un error pintando el calendario), saltaba al catch
      // de más abajo, que no solo mostraba "Error al añadir la sesión"
      // (engañoso, porque SÍ se había guardado) sino que además volvía a
      // meter la sesión en `_colaPendientes` con `unshift` -- es decir,
      // la próxima vuelta la volvía a procesar y la duplicaba en el plan.
      try {
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
      } catch (uiError) {
        console.error('Error refrescando la UI tras aceptar la sesión (ya guardada):', uiError);
        Utils.hideLoading();
        this._modalInviteAbierto = false;
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
console.log('✅ SessionInvites v14.3 - Grupos: usuarios y grupos se precargan en paralelo desde el Paso 2, así el Paso 3 aparece ya cargado sin saltos (con esqueleto animado como red de seguridad)');