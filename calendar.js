// ==================== calendar.js - VERSIÓN COMPLETA CORREGIDA ====================
// Versión: 4.xx - NUEVA modalidad GIMNASIO en «+ NUEVO PLAN»: plan de fuerza por días y músculos (cuerpo completo, empuje/tirón/pierna, torso/pierna), con ejercicios, series, repeticiones, descanso y RIR, bloques de 4 semanas con descarga y accesorios que rotan; sesiones tipo 'strength' (ya soportadas por el calendario). La leyenda de fases de carrera se oculta en estos planes.
// Versión: 2.87 - Los botones CANCELAR de «Datos de la sesión» y de «Sesión extra de hoy» eran solo texto: ahora son botón de acción normal (como el resto de la app).
// Versión: 2.86 - Al publicar un entreno en el Muro se guarda también si el usuario es administrador (isAdmin), para pintar sello y píldora «Administrador» junto al nombre.
// Versión: 2.85 - Al publicar un entreno en el Muro se guarda también si el usuario es entrenador (isTrainer, trainerVerified, trainerTitle), para pintar píldora y sello junto al nombre.
// Versión: 2.84 - El detalle de la sesión muestra «📎 MATERIAL ADJUNTO» (enlaces / PDF / imágenes que añade quien envía la
//                sesión, session-invites.js) entre el objetivo y las zonas.
// Versión: 2.83 - Aviso de fatiga más corto (una frase de dato + una de riesgo).
// Versión: 2.82 - Al guardar una sesión (extra o del plan) se refresca sola la lista «Mis últimos entrenamientos» del Perfil
//                (Profile._actualizarMisEntrenamientos); el Muro se arregla en app.js v4.68 (switchTab → Wall.init).
// Versión: 2.81 - REVISIÓN «marcar/desmarcar lo deja todo como antes»: (1) si al marcar se usó EDITAR EN PROFUNDIDAD, al
//                desmarcar la sesión vuelve a lo que estaba planificado (planOriginal), no se queda la editada;
//                (2) cada entrada guarda 'ritmoMedio' y 'xpGanada' (XP exacto) para poder revertir ritmo y XP al céntimo
//                (ver gamification.js v5.23).
// Versión: 2.80 - Desmarcar una sesión lo deja TODO como antes: se borra la clave de sesionesRealizadas (antes quedaba 'false' y el
//                contador del plan la seguía contando), su calificación (feedback), los datos de ruta del plan y la ruta GPS
//                guardada (limpiarRastroDeEntrada, que también usa el perfil al eliminar un entreno).
// Versión: 2.79 - (1) El calendario del plan tiene altura FIJA: se rellena siempre hasta 42 casillas, así no crece ni encoge
//                al cambiar de mes. (2) revertirDiaDobleDeEntrada(): al eliminar una sesión extra desde el perfil, el día
//                deja de pintarse como doble (si no quedan más extras ese día).
// Versión: 2.78 - DÍAS DOBLES: al guardar una sesión extra, el día del calendario se pinta del color del nivel del
//                atleta (_marcarDiaDoble / _pintarDiaDoble / _aplicarDiasDobles). Se guarda en el plan como
//                diasDobles: { 'AAAA-MM-DD': nivel } y las celdas llevan data-fecha.
// Versión: 2.77 - SESIÓN EXTRA DE HOY: botón «➕ SESIÓN EXTRA DE HOY» bajo el calendario (abrirSesionExtraHoy). Permite
//                registrar un segundo entreno el mismo día (con GPS o a mano) sin tocar la sesión del plan: marcarSesionRealizada
//                (y su versión interna) recibe un 11º parámetro opcional 'extra' = { sesion, fecha }; con él no se usa
//                sesionesRealizadas/wallEntryId del plan y la entrada del muro se guarda con fecha de hoy y sesionIndex null.
// Versión: 2.76 - AUDITORÍA DE INSIGNIAS (ver gamification.js v5.21):
//                marcarSesionRealizada (y su versión interna) recibe un 10º
//                parámetro opcional, 'infoGPS' ({ inicioTs, finTs,
//                velocidadMaxKmh, recordsPorTramo }), que solo envía
//                gps-tracker.js. Con él, la entrada del muro se crea YA con la
//                hora real de inicio y fin de la carrera (inicioRealTs/
//                finRealTs), la velocidad sostenida (velocidadMaxKmh) y los
//                mejores tramos (recordsPorTramo) -- antes recordsPorTramo se
//                escribía después, cuando las insignias ya se habían
//                evaluado. Permite dar insignias de hora del día ("Carrera
//                nocturna", de 00:00 a 06:00...) y de ritmo solo con datos
//                medidos por el GPS, nunca con la hora de pulsar "marcar" ni
//                con tiempos estimados del plan. Las sesiones manuales no
//                llevan estos campos.
// Versión: 2.75 - FIX bug reportado: al marcar una sesión como realizada
//                SIN GPS (ni corrección manual de km/tiempo), el desglose
//                de calentamiento y enfriamiento del Dashboard/Muro
//                siempre mostraba 0.00 km, aunque llevaran minutos de
//                trote. Causa: _desglosarSesion tiene un atajo para
//                cuando lo real coincide con el plan (desviación ≤8% --
//                que en una sesión sin GPS es SIEMPRE 0%, porque su
//                "distancia real" es la propia distanciaEstimada del
//                plan) que fijaba a mano km:0 para esos dos bloques y le
//                regalaba TODOS los km reales a la parte principal. Ahora
//                calentamiento/enfriamiento reciben su km real calculado
//                al ritmo de Z1 (igual que ya hacía el resto de la
//                función más abajo para sesiones con desviación >8%,
//                p.ej. con GPS) y esos km se restan del total en vez de
//                dejárselos enteros a la parte principal.
// Versión: 2.74 - Sobre el FIX de v2.7x (solo se puede marcar como
//                realizada la sesión de HOY): (1) el texto que se veía
//                al bloquearse -- tanto la etiqueta de la casilla como
//                el toast de _marcarSesionRealizadaInterno -- cambia a
//                una redacción más directa y sin emoji de reloj
//                ("Sesión pasada: ya no se puede marcar" / "Sesión
//                futura: todavía no se puede marcar"). (2) El botón
//                "INICIAR SESIÓN CON GPS" no compartía esta restricción:
//                se podía arrancar un GPS en vivo para una sesión de un
//                día que no era hoy, aunque la casilla de "Marcar como
//                realizada" ya estuviera bloqueada para ese mismo día.
//                Ahora se deshabilita con el mismo criterio de fecha
//                (sesionNoEsHoy) en cuanto se abre el detalle de la
//                sesión.
// Versión: 2.73 - OPTIMIZACIÓN LECTURAS FIRESTORE (punto 3 de la ronda
//                de revisión): calcularCargaEntrenamiento (ACWR, ventana
//                de 120 documentos) y calcularFormaFisica (CTL/ATL/TSB,
//                ventana de 200) leían por separado el MISMO histórico
//                de globalFeed para el mismo usuario -- mismo filtro,
//                mismo orden, ventanas solapadas. Como las dos se
//                disparan siempre juntas (al guardar/deshacer sesión, y
//                al entrar a la app), esto eran 2 lecturas (320
//                documentos) donde bastaba con 1 (200). Nuevo
//                PlanGenerator._obtenerHistorialGlobalFeed(uid): lectura
//                única cacheada por uid (con deduplicación de peticiones
//                en vuelo, para el caso -- el habitual -- de que las dos
//                funciones se llamen casi a la vez sin esperarse entre
//                sí), invalidada explícitamente con
//                invalidarHistorialGlobalFeed(uid) justo antes de
//                disparar precargarCargaPlan()/cargarFormaFisicaDashboard
//                en _marcarSesionRealizadaInterno (los dos puntos donde
//                el historial cambia de verdad). calcularCargaEntrenamiento
//                y calcularFormaFisica pasan a consumir esa lectura en
//                vez de hacer cada una su propio .get().
// Versión: 2.72 - OPTIMIZACIÓN LECTURAS FIRESTORE: tras guardar o deshacer
//                una sesión, ahora se fuerza también el recálculo (con
//                caché) de "forma física" y "zonas usadas" del dashboard
//                (ver index.html, cargarFormaFisicaDashboard/
//                cargarZonasUsadasDashboard con forceRefresh=true). Esto
//                permite que esas dos tarjetas dejen de releerse contra
//                Firestore cada vez que se vuelve a la pestaña Inicio
//                (hasta 200 lecturas por visita antes de este cambio) y
//                solo se recalculen en el momento real en que cambian.
// Versión: 2.71 - Al completar una sesión, ya no se piden 2 lecturas
//                extra de Gamification.getData() (antes/después) solo
//                para saber si hubo subida de nivel -- se usa el
//                oldLevel/level que ya devuelve updateAfterSession()
//                (gamification.js v5.15).
// Versión: 2.70 - Se quita el refresco manual de Wall.cargarMuro() tras
//                guardar una sesión: con el listener en tiempo real que
//                ahora usa el Muro (ver wall.js v4.14), la publicación
//                nueva le llega sola sin necesidad de pedirla aparte.
// Versión: 2.69 - FIX GRAVE: _desglosarSesion escalaba el calentamiento y
//                el enfriamiento con "proporcion = totalMin/duracionPlan"
//                -- si la sesión real duraba más de lo programado (p.ej.
//                el corredor añade una carrera suave extra después de las
//                series), esa MISMA proporción inflaba también esos dos
//                bloques (que deberían ser SIEMPRE fijos, sus minutos
//                programados), robándole de rebote km y minutos a la
//                parte principal -- por eso una sesión de 6x400m (2,4 km
//                de esfuerzo real) podía acabar mostrando en el dashboard
//                una parte principal de solo ~1,9 km. Ahora calentamiento
//                y enfriamiento se quedan siempre en su valor programado,
//                y cualquier sobrante de tiempo/distancia respecto a lo
//                planificado para la parte principal (o para la serie) se
//                separa aparte como un tramo extra en zona 2 (nuevo
//                desglose.extras[] con esa entrada), en vez de diluirse
//                proporcionalmente dentro de la zona de esfuerzo real.
// Versión: 2.70 - Un solo modal al marcar sesión realizada (tiempo, km, zona) con
//                CONFIRMAR y EDITAR EN PROFUNDIDAD (adiós al modal previo de dos
//                botones). Editar no escribe nada en el plan hasta confirmar; la
//                sesión original se conserva en planOriginal. Km: el reparto ya
//                no deja a 0 el trote de recuperación ni el extra (se escala
//                todo en proporción), y la distancia sugerida incluye la
//                recuperación de las series (antes no la contaba).
// Versión: 2.69 - (1) FIX "carrera extra con X minutos y 0 km": _desglosarSesion
//                reparte ahora los km de cada bloque (parte principal,
//                recuperación, cada extra y el sobrante) según el ritmo de
//                SU zona, no por tiempo -- los km del extra siempre suman al
//                total de la sesión. (2) Al marcar una sesión como realizada
//                sale primero EDITAR SESIÓN / CONFIRMAR: CONFIRMAR abre el
//                modal de tiempo/distancia/zona (ya sin selector de tipo);
//                EDITAR SESIÓN abre el generador completo con la sesión
//                cargada (SessionInvites.editarSesionDelPlan) y luego ese
//                mismo modal. (3) _estimarDistanciaSesion: si la sesión no
//                trae distancia, se estima sumando cada bloque a su zona.
//                insertarSesionManualEnPlan admite { reemplazar: true }.
// Versión: 2.68 - _desglosarSesion generalizada para pasos extra "🏃 carrera"
//                (session-invites.js v10) con su propia zona, distinta de
//                la parte principal (ej. series en Z4 + bloque extra en
//                Z2): antes todo lo que no fuera calentamiento/enfriamiento
//                se trataba como un único bloque con UNA sola zona
//                detectada por el ritmo medio, mezclando ambas zonas en una
//                intermedia equivocada al marcar la sesión como hecha. Ahora
//                se reparte proporcionalmente entre parte principal y cada
//                extra según su duración planificada, con la zona
//                planificada de cada uno (nuevo desglose.extras[], incluido
//                también en _sumarMinutosPorZona y calcularTSSdesdeReal).
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

// Versión: 2.73 - AUDITORÍA DE FÓRMULAS, 3 fixes:
//                1) CALORÍAS: las sesiones de carrera (rodaje/tempo/series/
//                   largo) nunca guardaban `calorias` al marcarse como
//                   realizadas -- solo la rama 'strength' lo hacía. Se movió
//                   `pesoUsuario` fuera de esa rama y ahora las 3 ramas
//                   (strength / GPS-o-manual / estimada) calculan calorías.
//                2) TSS ESTIMADO vs REAL: calcularMetricasSesion y
//                   _distanciaYTssDesdeParteP multiplicaban TODA la duración
//                   de la sesión por el IF² de la zona principal, sin
//                   descontar que calentamiento/enfriamiento van en Z1 (más
//                   suave) -- inflaba el TSS "planificado" hasta ~20% por
//                   encima del TSS real que calcularTSSdesdeReal() calcula
//                   al completar la sesión (que sí pondera cada tramo por
//                   su zona). Ahora ambas funciones ponderan igual.
//                3) Fallback sin desglose de calcularTSSdesdeReal: aplicaba
//                   el factor de intensidad de forma lineal en vez de al
//                   cuadrado (la fórmula de Coggan es horas×IF²×100).
const PlanGenerator = {
  ENTRENAMIENTOS: window.ENTRENAMIENTOS_DB || {},

  // 🔥 FIX lecturas duplicadas: calcularCargaEntrenamiento (ACWR, ventana
  // de 120 documentos) y calcularFormaFisica (CTL/ATL/TSB, ventana de
  // 200) consultaban por separado el MISMO histórico -- misma colección
  // (globalFeed), mismo filtro (userId) y mismo orden (timestamp desc).
  // La ventana de 200 ya cubre de sobra la de 120, así que con UNA sola
  // lectura de 200 documentos ambas tienen lo que necesitan. Como las
  // dos se disparan siempre juntas (al guardar/deshacer una sesión, ver
  // calendar.js::_marcarSesionRealizadaInterno, y al entrar a la app vía
  // precargarCargaPlan + cargarFormaFisicaDashboard), esto pasa de 2
  // lecturas (320 documentos) a 1 (200) en el caso más habitual.
  //
  // _historialGlobalFeedCache guarda, por uid, la PROMESA de la lectura
  // (no solo el resultado ya resuelto): si las dos funciones se llaman
  // casi a la vez -- que es lo que pasa en la práctica, ninguna de las
  // dos espera a la otra -- la segunda reutiliza la misma petición en
  // vuelo en vez de lanzar la suya. Solo se invalida explícitamente
  // (invalidarHistorialGlobalFeed) cuando de verdad cambia el
  // histórico: guardar o deshacer una sesión.
  _historialGlobalFeedCache: {},

  _obtenerHistorialGlobalFeed(uid) {
    if (!this._historialGlobalFeedCache[uid]) {
      this._historialGlobalFeedCache[uid] = firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(200) // ventana máxima que necesita cualquiera de las dos (antes 120 y 200 por separado)
        .get()
        .then(snap => snap.docs.map(doc => doc.data()))
        .catch(error => {
          // No se memoriza un fallo: la próxima llamada debe poder
          // reintentarlo contra Firestore en vez de quedarse repitiendo
          // el mismo error para siempre.
          delete this._historialGlobalFeedCache[uid];
          throw error;
        });
    }
    return this._historialGlobalFeedCache[uid];
  },

  invalidarHistorialGlobalFeed(uid) {
    if (uid) delete this._historialGlobalFeedCache[uid];
    else this._historialGlobalFeedCache = {};
  },

  // 🔥 FIX ESCALA TSS (todas las fórmulas de TSS de carrera): la fórmula
  // estándar de TSS (Coggan) es horas_sesión × IF² × 100 -- como aquí se
  // trabaja en MINUTOS en vez de horas, hace falta multiplicar por
  // 100/60 (≈1.667) para no perder ese factor. Antes faltaba en los 4
  // sitios que calculan TSS de carrera (calcularMetricasSesion,
  // _distanciaYTssDesdeParteP, calcularTSSdesdeReal aquí, y
  // SessionInvites._calcularTSS), y el TSS salía sistemáticamente ~40%
  // por debajo de lo real -- una sesión de 60' a umbral (IF≈1.0) daba
  // ~60 TSS en vez de los ~100 esperados (misma escala 0-100 que ya usa
  // el TSS de fuerza vía Session-RPE, y que ya asumían los umbrales de
  // color del Dashboard: 70=naranja, 120=rojo). Constante única para que
  // los 4 sitios queden siempre sincronizados si se retoca en el futuro.
  FACTOR_ESCALA_TSS: 100 / 60,

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
    const det = sesion?.detalle;
    const duracionPlan = sesion?.duracion || 0;

    // 🔥 FIX bug reportado: la sesión guardaba (y el modal mostraba) una
    // zona resultante disparatada -- ej. Z1 (recuperación) para un tempo
    // corrido a 5:36/km, que es claramente Z3. Causa real: esta función
    // SIEMPRE recalculaba la zona comparando el ritmo real contra las
    // zonas ACTUALES del usuario (AppState.lastZones/lastRitmoBase) --
    // pero esas zonas pueden haber cambiado desde que el plan se generó
    // (el usuario recalcula sus zonas con una marca mejor o peor, y a
    // partir de ahí TODAS las sesiones ya generadas del plan quedan
    // "descuadradas": una sesión pensada para Z3 con las zonas de cuando
    // se generó el plan podía comparar su ritmo contra unas zonas nuevas
    // y más rápidas, y salir Z1 sin que hubiera pasado nada raro en la
    // sesión en sí).
    //
    // Antes de intentar reconstruir nada por ritmo: si lo corrido de
    // verdad (km y minutos totales) coincide con lo PLANIFICADO dentro de
    // un margen razonable (±8%), la zona resultante es sencillamente la
    // zona PROGRAMADA de la sesión (sesion.detalle.zona, fija desde que
    // se generó el plan, ajena a que luego se recalculen las zonas) -- no
    // hace falta adivinar nada, es la sesión tal cual estaba pensada.
    // Solo cuando de verdad se ha corrido distinto a lo planificado (más
    // lento/rápido, con desnivel, etc.) se sigue estimando la zona real a
    // partir del ritmo de la parte principal, como hasta ahora -- y para
    // esos casos sigue estando la zona MANUAL en el selector, por si el
    // ritmo tampoco refleja bien el esfuerzo real (ej. cuestas).
    //
    // Se deja fuera de este atajo a las series con datos propios y a los
    // pasos extra de "🏃 carrera": esos ya calculan su zona directamente
    // desde lo planificado (zonaPlanEsfuerzo/p.zona), sin pasar por
    // _detectarZonaPorRitmo, así que nunca han tenido este bug.
    const tieneExtrasCarrera = !!(det && Array.isArray(det.pasosDetallados) &&
      det.pasosDetallados.some(p => p.tipoExtra === 'carrera' && (p.duracionMin || 0) > 0));
    const esSerieConDatosPlan = sesion?.tipo === 'series' && det?.segundosEsfuerzo > 0 && duracionPlan > 0;
    const distanciaPlan = det?.distanciaEstimada || 0;

    if (!esSerieConDatosPlan && !tieneExtrasCarrera && det?.zona && distanciaPlan > 0 && duracionPlan > 0 && totalKm > 0 && totalMin > 0) {
      const pacePlan = duracionPlan / distanciaPlan;
      const paceReal = totalMin / totalKm;
      const desviacion = Math.abs(paceReal - pacePlan) / pacePlan;
      if (desviacion <= 0.08) {
        const zonaPlan = det.zona.split('-').pop().trim();
        const calMinPlan = det.calentamiento || 0;
        const enfMinPlan = det.enfriamiento || 0;
        const mainMinReal = Math.max(0, totalMin - calMinPlan - enfMinPlan) || totalMin;

        // 🔥 FIX "0.00 km en calentamiento/enfriamiento": este atajo fijaba
        // km:0 a mano para esos dos bloques y le regalaba TODOS los km
        // reales (totalKm) a la parte principal -- así, una sesión marcada
        // sin GPS (donde totalKm es la distancia estimada del plan, y por
        // tanto desviacion siempre sale 0) mostraba siempre calentamiento y
        // enfriamiento a 0.00 km aunque llevaran minutos de trote. Ahora se
        // les calcula su km real al ritmo de Z1 -- igual que ya hace el
        // resto de esta función más abajo (ver ritmoZ1MinPerKm) -- y esos
        // km se restan del total para la parte principal, en vez de
        // dejárselos enteros.
        const ritmoZ1Plan = this._ritmoToSeg(this.obtenerRitmoParaZona('Z1')) / 60;
        let calKmPlan = 0, enfKmPlan = 0, mainKmReal = totalKm;
        if (ritmoZ1Plan && isFinite(ritmoZ1Plan)) {
          calKmPlan = calMinPlan / ritmoZ1Plan;
          enfKmPlan = enfMinPlan / ritmoZ1Plan;
          mainKmReal = Math.max(0, totalKm - calKmPlan - enfKmPlan);
        }

        return {
          calentamiento: calMinPlan > 0 ? { min: calMinPlan, km: calKmPlan, zona: 'Z1' } : null,
          partePrincipal: { min: mainMinReal, km: mainKmReal, zona: zonaPlan },
          recuperacion: null,
          enfriamiento: enfMinPlan > 0 ? { min: enfMinPlan, km: enfKmPlan, zona: 'Z1' } : null
        };
      }
    }

    const zonaMedia = (totalKm > 0) ? this._detectarZonaPorRitmo(totalMin / totalKm) : null;
    const soloPartePrincipal = {
      calentamiento: null,
      partePrincipal: { min: totalMin, km: totalKm, zona: zonaMedia ? zonaMedia[0] : (sesion?.detalle?.zona || '') },
      recuperacion: null,
      enfriamiento: null
    };

    if (!det || duracionPlan <= 0 || (!det.calentamiento && !det.enfriamiento) || totalMin <= 0 || totalKm <= 0) {
      return soloPartePrincipal;
    }

    // 🔥 FIX: calentamiento y enfriamiento son bloques FIJOS de trote
    // suave (los mismos minutos programados que ya anuncia por voz el
    // propio GPS tracker, nunca recalculados). Antes se escalaban con
    // "proporcion = totalMin / duracionPlan": si la sesión real duraba
    // más de lo programado (p.ej. el corredor añade una carrera suave
    // extra después de las series), esa MISMA proporción inflaba también
    // el calentamiento y el enfriamiento -- comiéndose de rebote km y
    // minutos que en realidad eran de la parte principal, y por eso podía
    // salir una parte principal más corta de lo que de verdad se hizo.
    // Ahora calentamiento y enfriamiento se quedan siempre en su valor
    // planificado, y es la parte principal la que absorbe TODO lo que
    // sobre o falte respecto a lo programado.
    const calMin = det.calentamiento || 0;
    const enfMin = det.enfriamiento || 0;
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

    // 🔥 v11: pasos extra "🏃 carrera" (session-invites.js) con su PROPIA
    // zona (p.zona), que puede ser distinta de la parte principal (o del
    // esfuerzo de una serie) -- ej. series en Z4 + un bloque extra de
    // rodaje en Z2. Sin esto, mainMin/mainKm se trataría como un único
    // bloque y se le intentaría detectar UNA sola zona por el ritmo medio,
    // mezclando Z4 y Z2 en una zona intermedia equivocada. Aquí se reparte
    // proporcionalmente entre cada sub-bloque PLANIFICADO (parte
    // principal / esfuerzo+recuperación de la serie / cada extra) y a
    // cada uno se le asigna directamente su zona planificada, igual que ya
    // se hace con calentamiento/enfriamiento en Z1 (no se reintenta
    // detectar por ritmo).
    const extrasCarrera = (det.pasosDetallados || []).filter(p => p.tipoExtra === 'carrera' && (p.duracionMin || 0) > 0);
    const extrasPlanMin = extrasCarrera.reduce((s, p) => s + (p.duracionMin || 0), 0);
    const distEsfuerzoPlanExtras = det.distanciaEsfuerzoKm > 0 ? det.distanciaEsfuerzoKm : null;

    if (extrasPlanMin > 0) {
      const subBloques = [];
      if (esSerieConDatos) {
        const plannedMainSec = ((det.partePrincipal || 0) - extrasPlanMin) * 60;
        const plannedRecSec = plannedMainSec - det.segundosEsfuerzo;
        if (plannedMainSec > 0 && plannedRecSec > 0) {
          const zonaPlanEsfuerzo = (det.zona || 'Z4-Z5').split('-').pop().trim();
          subBloques.push({ nombre: 'partePrincipal', planMin: det.segundosEsfuerzo / 60, zona: zonaPlanEsfuerzo || 'Z4', distPlan: distEsfuerzoPlanExtras });
          subBloques.push({ nombre: 'recuperacion', planMin: plannedRecSec / 60, zona: this._zonaDescansoSeries(det) });
        }
      } else {
        const principalPlanMin = Math.max(0, (det.partePrincipal || 0) - extrasPlanMin);
        if (principalPlanMin > 0) {
          subBloques.push({ nombre: 'partePrincipal', planMin: principalPlanMin, zona: det.zona || (zonaMedia ? zonaMedia[0] : '') });
        }
      }
      extrasCarrera.forEach((p, i) => {
        subBloques.push({ nombre: `extra${i}`, planMin: p.duracionMin, zona: p.zona || det.zona || '' });
      });

      const totalPlanSub = subBloques.reduce((s, b) => s + b.planMin, 0);
      if (totalPlanSub > 0) {
        const resultado = {
          calentamiento: calMin > 0 ? { min: calMin, km: calKm, zona: 'Z1' } : null,
          partePrincipal: null,
          recuperacion: null,
          enfriamiento: enfMin > 0 ? { min: enfMin, km: enfKm, zona: 'Z1' } : null,
          extras: []
        };
        // 🔥 Si la parte principal real (mainMin) duró más que la SUMA de
        // todo lo planificado para ella (totalPlanSub), el sobrante NO se
        // reparte proporcionalmente entre los sub-bloques planificados
        // (eso diluiría también la distancia de esfuerzo real de la
        // serie) -- se separa aparte y se añade como un tramo extra en
        // zona 2, tal cual se pidió: todo lo de más va como carrera en
        // zona 2, después de lo programado.
        const sobranteMin = Math.max(0, mainMin - totalPlanSub);
        const mainMinProgramado = mainMin - sobranteMin;

        // 🔥 v2.69 FIX "carrera extra con 0 km": antes los km de cada
        // sub-bloque (parte principal / recuperación / cada extra / el
        // sobrante) se repartían proporcionalmente al TIEMPO, sin mirar la
        // zona de cada uno. Con un esfuerzo de distancia fija (series) y un
        // real más corto que lo planificado, lo que quedaba para el resto
        // se acercaba a 0 y el extra salía con X minutos y 0.00 km. Ahora
        // cada bloque recibe sus km según lo que correría a SU ritmo de
        // zona (min / ritmo de la zona), y el total de la parte principal
        // (mainKm, ya con los km reales) se reparte entre ellos en esa
        // proporción -- así los km del extra SIEMPRE suman al total de la
        // sesión y nunca se pierden. El esfuerzo de distancia fija conserva
        // su distancia planificada, dejando al menos el 60% de lo que
        // correrían los demás bloques a su ritmo.
        const paceDeZona = (z) => {
          try {
            const zc = String(z || '').split('-').pop().trim();
            if (!zc) return null;
            const p = this._ritmoToSeg(this.obtenerRitmoParaZona(zc)) / 60;
            return (p && isFinite(p) && p > 0) ? p : null;
          } catch (e) { return null; }
        };
        const bloquesKm = subBloques.map(b => ({
          nombre: b.nombre, zona: b.zona, distPlan: b.distPlan,
          min: mainMinProgramado * (b.planMin / totalPlanSub)
        }));
        if (sobranteMin > 0) bloquesKm.push({ nombre: 'sobrante', zona: 'Z2', distPlan: null, min: sobranteMin });
        const kmIdeal = (b) => { const p = paceDeZona(b.zona); return p ? b.min / p : b.min; };
        // Km "ideales" de cada bloque a su ritmo de zona (el de distancia fija
        // usa su distancia planificada). Si los km reales alcanzan, el bloque
        // fijo conserva su distancia y los demás se reparten el resto por su
        // ritmo; si NO alcanzan (has corrido menos de lo que implican los
        // tiempos), se escalan TODOS en proporción -- ningún bloque con
        // minutos se queda nunca en 0 km.
        const bloqueFijo = bloquesKm.find(b => b.nombre === 'partePrincipal' && b.distPlan !== null && b.distPlan !== undefined);
        bloquesKm.forEach(b => { b.ideal = (b === bloqueFijo) ? b.distPlan : kmIdeal(b); });
        const idealTotal = bloquesKm.reduce((s, b) => s + b.ideal, 0);
        if (bloqueFijo && mainKm >= idealTotal) {
          bloqueFijo.km = bloqueFijo.distPlan;
          const otros = bloquesKm.filter(b => b !== bloqueFijo);
          const idealOtros = otros.reduce((s, b) => s + b.ideal, 0);
          otros.forEach(b => { b.km = idealOtros > 0 ? (mainKm - bloqueFijo.km) * (b.ideal / idealOtros) : 0; });
        } else {
          bloquesKm.forEach(b => { b.km = idealTotal > 0 ? mainKm * (b.ideal / idealTotal) : 0; });
        }
        bloquesKm.forEach(b => {
          const bloque = { min: b.min, km: b.km, zona: b.zona };
          if (b.nombre === 'partePrincipal') resultado.partePrincipal = bloque;
          else if (b.nombre === 'recuperacion') resultado.recuperacion = bloque;
          else resultado.extras.push(bloque);
        });
        return resultado;
      }
    }

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
      const plannedMainMin = plannedMainSec / 60;
      const distEsfuerzoPlan = det.distanciaEsfuerzoKm > 0 ? det.distanciaEsfuerzoKm : null;
      if (plannedMainMin > 0 && plannedRecSec > 0) {
        const zonaPlanEsfuerzo = (det.zona || 'Z4-Z5').split('-').pop().trim();

        // 🔥 Igual que arriba: si la parte principal real (mainMin) duró
        // más que lo programado para la serie (plannedMainMin), el
        // sobrante no se reparte proporcionalmente entre esfuerzo y
        // descanso -- se añade aparte como tramo extra de carrera en
        // zona 2, después de las series.
        const sobranteMin = Math.max(0, mainMin - plannedMainMin);
        if (sobranteMin > 0) {
          const propSobrante = sobranteMin / mainMin;
          const mainMinProgramado = mainMin - sobranteMin;
          const mainKmProgramado = mainKm * (1 - propSobrante);
          const recMinProg = plannedRecSec / 60;
          const proporcionMain = mainMinProgramado / plannedMainMin;
          const recMin = recMinProg * proporcionMain;
          if (recMin > 0 && recMin < mainMinProgramado) {
            const esfuerzoMin = mainMinProgramado - recMin;
            // 🔥 FIX: la distancia de esfuerzo/descanso ya NO se reparte
            // proporcionalmente al TIEMPO (eso diluía la distancia de
            // esfuerzo real, porque el descanso se corre/anda mucho más
            // lento que las series) -- si se conoce la distancia FIJA
            // planificada del esfuerzo (ej. 6x400m = 2.4km), se usa tal
            // cual (topada al km real disponible en esa parte); el resto
            // de esa parte se atribuye al descanso.
            let esfuerzoKm, recKm;
            if (distEsfuerzoPlan !== null) {
              esfuerzoKm = Math.min(distEsfuerzoPlan, mainKmProgramado);
              recKm = mainKmProgramado - esfuerzoKm;
            } else {
              recKm = mainKmProgramado * (recMin / mainMinProgramado);
              esfuerzoKm = mainKmProgramado - recKm;
            }
            resultado.partePrincipal = { min: esfuerzoMin, km: esfuerzoKm, zona: zonaPlanEsfuerzo || 'Z4' };
            resultado.recuperacion = { min: recMin, km: recKm, zona: this._zonaDescansoSeries(det) };
            resultado.extras = [{ min: mainMin * propSobrante, km: mainKm * propSobrante, zona: 'Z2' }];
          }
        } else {
          const proporcionMain = mainMin / plannedMainMin;
          const recMin = (plannedRecSec / 60) * proporcionMain;
          if (recMin > 0 && recMin < mainMin) {
            const esfuerzoMin = mainMin - recMin;
            let esfuerzoKm, recKm;
            if (distEsfuerzoPlan !== null) {
              esfuerzoKm = Math.min(distEsfuerzoPlan, mainKm);
              recKm = mainKm - esfuerzoKm;
            } else {
              recKm = mainKm * (recMin / mainMin);
              esfuerzoKm = mainKm - recKm;
            }
            resultado.partePrincipal = { min: esfuerzoMin, km: esfuerzoKm, zona: zonaPlanEsfuerzo || 'Z4' };
            resultado.recuperacion = { min: recMin, km: recKm, zona: this._zonaDescansoSeries(det) };
          }
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
    // 🔥 v11: bloques extra de carrera (zona propia, ver _desglosarSesion)
    if (Array.isArray(desglose.extras)) {
      desglose.extras.forEach(seg => {
        if (seg && seg.zona === zonaObjetivo && isFinite(seg.min)) minutos += seg.min;
      });
    }
    return minutos;
  },

  // 🔥 v2.69: distancia estimada de una sesión que NO trae distanciaEstimada
  // (p.ej. creada sin zonas calculadas) -- suma cada bloque a su ritmo de
  // zona: calentamiento/enfriamiento en Z1, parte principal en su zona y
  // cada "🏃 carrera extra" en su PROPIA zona. Así los km del extra se
  // suman al general de la sesión en vez de quedarse en 0.
  _estimarDistanciaSesion(sesion) {
    const det = sesion?.detalle;
    if (!det) return 0;
    const paceDe = (z) => {
      try {
        const zc = String(z || '').split('-').pop().trim();
        if (!zc) return null;
        const p = this._ritmoToSeg(this.obtenerRitmoParaZona(zc)) / 60;
        return (p && isFinite(p) && p > 0) ? p : null;
      } catch (e) { return null; }
    };
    const esSerie = sesion.tipo === 'series' && det.segundosEsfuerzo > 0;
    // La distancia guardada de las series NO incluye el trote de
    // recuperación entre repeticiones (solo esfuerzo + extras + cal/enf), así
    // que para ellas se estima siempre por bloques. Para el resto se respeta
    // la distancia del plan si existe.
    if (!esSerie && det.distanciaEstimada > 0) return det.distanciaEstimada;
    const pasos = det.pasosDetallados || [];
    const extras = pasos.filter(p => p.tipoExtra === 'carrera' && (p.duracionMin || 0) > 0);
    const extrasMin = extras.reduce((s, p) => s + p.duracionMin, 0);
    const fuerzaMin = pasos.filter(p => p.tipoExtra === 'fuerza').reduce((s, p) => s + (p.duracionMin || 0), 0);
    const cal = det.calentamiento || 0, enf = det.enfriamiento || 0;
    const principalMin = Math.max(0, (sesion.duracion || 0) - cal - enf - extrasMin - fuerzaMin);
    let km = 0;
    const sumar = (min, z) => { const p = paceDe(z); if (p && min > 0) km += min / p; };
    sumar(cal, 'Z1'); sumar(enf, 'Z1');
    if (esSerie) {
      const esfMin = det.segundosEsfuerzo / 60;
      km += det.distanciaEsfuerzoKm > 0 ? det.distanciaEsfuerzoKm : 0;
      if (!(det.distanciaEsfuerzoKm > 0)) sumar(esfMin, det.zona);
      // Descanso de la serie: trotando en su zona (o Z2 si la sesión no lo indica); parado no suma kilómetros.
      const zr = (det.seriesConfig && typeof det.seriesConfig.descansoZona === 'string') ? det.seriesConfig.descansoZona : undefined;   // undefined = sin dato → como siempre (Z2)
      if (zr === undefined || zr) sumar(Math.max(0, principalMin - esfMin), zr || 'Z2');
    } else {
      sumar(principalMin, det.zona);
    }
    extras.forEach(p => sumar(p.duracionMin, p.zona || det.zona));
    return km;
  },

  // sinFade=true: se usa cuando este modal toma el relevo de otro que acaba de cerrarse (el generador de
  // edición o las opciones de sesión extra). Con el fundido de 0,2 s se veía un instante lo que hay detrás.
  abrirModalDatosReales(sesion, sinFade = false) {
    return new Promise((resolve) => {
      document.getElementById('datosRealesModal')?.remove();
      document.getElementById('datosRealesOverlay')?.remove();

      const distanciaDefecto = this._estimarDistanciaSesion(sesion);
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
        border-radius:16px; max-width:380px; width:90%; padding:20px;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center;
        max-height:90vh; overflow-y:auto; box-sizing:border-box;
        opacity:0; transition:opacity 0.2s ease;
      `;

      const infoTipoOriginal = this._infoTipo(sesion?.tipo);
      const nombreCabecera = sesion?.detalle?.nombre || infoTipoOriginal.label;

      modal.innerHTML = `
        <h3 style="margin:0 0 6px 0; color:var(--accent-yellow);">📝 DATOS DE LA SESIÓN</h3>
        <p style="margin:0 0 14px 0; font-size:12px; color:var(--text-secondary);">Confirma o corrige el tiempo, la distancia y la zona. Si has hecho otra cosa (series, tempo, otros bloques), edítala en profundidad.</p>
        <div id="datosRealesTipoBox" style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:14px; padding:10px 12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span id="datosRealesTipoIcono" style="font-size:16px;">${infoTipoOriginal.icono}</span>
          <strong id="datosRealesTipoTexto" style="font-size:14px; color:var(--text-primary);">${Utils.escapeHTML(nombreCabecera)}</strong>
        </div>
        <p id="datosRealesTipoNota" style="display:none; margin:0 0 14px 0; font-size:12px; color:var(--text-secondary);">Se guardará como <strong id="datosRealesTipoNotaTexto"></strong> en vez de lo planificado.</p>
        <div style="text-align:left; margin-bottom:12px; max-width:200px; margin-left:auto; margin-right:auto;">
          <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">📏 Kilómetros</label>
          <input type="number" id="datosRealesKm" inputmode="decimal" step="0.01" min="0" value="${distanciaDefecto ? distanciaDefecto.toFixed(2) : ''}" style="width:100%; padding:8px; border-radius:14px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
        </div>
        <div style="display:flex; gap:10px; margin-bottom:14px;">
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">⏱️ Minutos</label>
            <input type="number" id="datosRealesMin" inputmode="numeric" min="0" value="${Math.floor(duracionDefecto)}" style="width:100%; padding:8px; border-radius:14px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
          </div>
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">Segundos</label>
            <input type="number" id="datosRealesSeg" inputmode="numeric" min="0" max="59" value="0" style="width:100%; padding:8px; border-radius:14px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
          </div>
        </div>
        <div id="datosRealesZonaBox" style="background:var(--bg-primary); border:1px solid var(--border-color); border-left:4px solid transparent; border-radius:14px; padding:12px; margin-bottom:18px; transition:border-color .2s ease;">
          <div style="font-size:12px; color:var(--text-secondary); margin-bottom:2px;">Ritmo medio</div>
          <div id="datosRealesRitmo" style="font-size:24px; font-weight:600; color:var(--gold);">--:--</div>
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:0.5px; margin:10px 0 6px;">ZONA DE ESFUERZO REAL</label>
          <select id="datosRealesZonaSelect" style="width:100%; text-align:center; text-align-last:center;">
            <option value="Z1">Z1 · RECUPERACIÓN</option>
            <option value="Z2">Z2 · BASE</option>
            <option value="Z3">Z3 · TEMPO</option>
            <option value="Z4">Z4 · UMBRAL</option>
            <option value="Z5">Z5 · VO₂MÁX</option>
            <option value="Z6">Z6 · VELOCIDAD</option>
          </select>
        </div>
        <div style="display:flex; gap:10px; justify-content:center; margin-bottom:10px;">
          <button id="datosRealesEditar" style="flex:1; background:transparent; border:1px solid var(--gold); color:var(--gold); padding:12px 6px; border-radius:14px; cursor:pointer; font-weight:600; font-size:12px; line-height:1.2;">EDITAR EN PROFUNDIDAD</button>
          <button id="datosRealesConfirm" style="flex:1; background:var(--accent-blue); border:none; color:var(--on-accent); padding:12px 6px; border-radius:14px; cursor:pointer; font-weight:600;">CONFIRMAR</button>
        </div>
        <button id="datosRealesCancel" class="action-button" style="width:100%; margin:0; height:48px; border-radius:14px; color:var(--text-primary); font-size:13px; font-weight:600; cursor:pointer;">CANCELAR</button>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      if (sinFade) {
        overlay.style.transition = 'none'; modal.style.transition = 'none';
        overlay.style.opacity = '1'; modal.style.opacity = '1';
      } else {
        requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });
      }

      const kmInput = document.getElementById('datosRealesKm');
      const minInput = document.getElementById('datosRealesMin');
      const segInput = document.getElementById('datosRealesSeg');
      const ritmoEl = document.getElementById('datosRealesRitmo');
      const zonaBoxEl = document.getElementById('datosRealesZonaBox');
      const zonaSelectEl = document.getElementById('datosRealesZonaSelect');

      // null = automática (por ritmo, como antes) -- mientras el usuario
      // no toque el desplegable, se deja pre-seleccionada de verdad la
      // zona que sale calculada (con su color en el borde), sin una
      // opción "AUTO" aparte que haya que leer entre paréntesis. El ritmo
      // medio no distingue un llano de una sesión con desnivel o con el
      // pulso más alto de lo normal -- aquí se puede elegir otra zona
      // ("en realidad esto fue Z3/Z4"), y esa (no la calculada) es la que
      // se usa luego para guardar la sesión y recalcular el TSS.
      //
      // 🔥 Nada de chips ni de popups hechos a mano: se pidió el MISMO
      // control que ya usa "Nueva sesión" (session-invites.js, sgZona) --
      // un <select> nativo normal. Es el propio sistema operativo el que
      // dibuja el desplegable (el "cuadradito" con el check en la opción
      // elegida), sin JS ni CSS propios que mantener.
      let zonaOverride = null;
      if (zonaSelectEl) {
        zonaSelectEl.addEventListener('change', () => {
          zonaOverride = zonaSelectEl.value || null;
          recalcular();
        });
      }

      let tipoSeleccionado = null;
      const tipoBox = document.getElementById('datosRealesTipoBox');
      const tipoIconoEl = document.getElementById('datosRealesTipoIcono');
      const tipoTextoEl = document.getElementById('datosRealesTipoTexto');
      const tipoNotaEl = document.getElementById('datosRealesTipoNota');
      const tipoNotaTextoEl = document.getElementById('datosRealesTipoNotaTexto');

      // 🔥 v2.69: ya no se cambia el TIPO desde aquí -- para eso está el botón
      // "EDITAR SESIÓN" (paso anterior). Este modal solo confirma tiempo,
      // distancia y zona.

      const recalcular = () => {
        const km = parseFloat(kmInput.value) || 0;
        const min = parseFloat(minInput.value) || 0;
        const seg = parseFloat(segInput.value) || 0;
        const totalMin = min + seg / 60;
        if (km > 0 && totalMin > 0) {
          const paceMinPerKm = totalMin / km;
          ritmoEl.textContent = `${Utils.formatR(paceMinPerKm)} /km`;
          const zona = this._detectarZonaParteEfectiva(sesion, totalMin, km);
          // Mientras el usuario no haya corregido nada a mano, el propio
          // select se deja en la zona calculada -- así se ve marcada de
          // verdad (con el check nativo del sistema), no como un texto
          // "AUTO (Z3 · TEMPO)" que hay que leer.
          if (!zonaOverride && zonaSelectEl && zona) zonaSelectEl.value = zona[0];
          const zonaActiva = zonaOverride || (zona ? zona[0] : null);
          zonaBoxEl.style.borderLeftColor = zonaActiva ? `var(--zone-${zonaActiva.replace('Z', '')})` : 'transparent';
        } else {
          ritmoEl.textContent = '--:--';
          zonaBoxEl.style.borderLeftColor = zonaOverride ? `var(--zone-${zonaOverride.replace('Z', '')})` : 'transparent';
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
        cerrar({ accion: 'confirmar', km, ms, tipoCorregido: tipoSeleccionado, zonaOverride });
      };
      document.getElementById('datosRealesEditar').onclick = () => cerrar({ accion: 'editar' });
      document.getElementById('datosRealesCancel').onclick = () => cerrar(null);
      overlay.onclick = (e) => { if (e.target === overlay) cerrar(null); };
    });
  },

  _calcularCalentamientoEnfriamiento(duracion) {
    let calentamiento = Math.round(duracion * 0.15);
    let enfriamiento = Math.round(duracion * 0.1);
    calentamiento = Math.max(10, calentamiento);
    // 🔥 Tope: el calentamiento nunca puede durar más de 10' (antes solo
    // tenía suelo de 10', sin techo -- en sesiones largas el 15% de la
    // duración superaba fácilmente los 10').
    calentamiento = Math.min(10, calentamiento);
    enfriamiento = Math.max(5, enfriamiento);
    let partePrincipal = duracion - calentamiento - enfriamiento;
    if (partePrincipal < 5) {
      calentamiento = Math.min(10, Math.floor(duracion * 0.4));
      enfriamiento = Math.floor(duracion * 0.2);
      partePrincipal = duracion - calentamiento - enfriamiento;
    }
    return { calentamiento, enfriamiento, partePrincipal };
  },

  _pasosBasicos(calentamiento, partePrincipal, enfriamiento, accionPrincipal, porquePrincipal) {
    return [
      { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' de trote suave (Z1) + ejercicios de movilidad`, porque: 'Preparar músculos, articulaciones y sistema cardiovascular.' },
      { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: accionPrincipal, porque: porquePrincipal },
      { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' de trote suave + estiramientos suaves`, porque: 'Bajar poco a poco la frecuencia cardíaca y volver a la calma tras el esfuerzo.' }
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
    largo:  { icono: '📏', label: 'Tirada larga' },
    caminar: { icono: '🚶', label: 'Caminar' }
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
          metricasExtraSeries = { segundosEsfuerzo, distanciaEsfuerzoKm: repSerie * (distSerie / 1000), tiempoEnZona: Utils.formatR(segundosEsfuerzo / 60) };
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

    // 🔥 Tope: el calentamiento nunca puede durar más de 10' (antes tenía
    // un SUELO de 15', que directamente ya incumplía el máximo pedido).
    const calentamiento = Math.min(10, Math.floor(duracion * 0.15));
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
      { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' de trote suave + estiramientos suaves`, porque: 'Bajar poco a poco la frecuencia cardíaca y volver a la calma tras el esfuerzo.' }
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

  // Factores de respaldo sobre ritmoBase (65/75/83/90/100/110 % de VAM, ver
  // Training.startCalc). Solo se usan si el usuario no tiene zonas cargadas.
  _FACTORES_VAM: { 'Z1': 1.4403, 'Z2': 1.2483, 'Z3': 1.1280, 'Z4': 1.0402, 'Z5': 0.9362, 'Z6': 0.8511 },

  // Ritmo (min/km) de una zona LEYENDO las zonas reales del usuario
  // (AppState.lastZones, con sus ajustes manuales y los cálculos
  // guardados), no factores fijos. Si no hay zonas, cae a los factores VAM.
  _ritmoZonaMin(zonaCodigo, ritmoBaseFallback, factorDefecto) {
    const zonas = AppState.lastZones;
    const base = AppState.lastRitmoBase;
    if (Array.isArray(zonas) && zonas.length && base) {
      const z = zonas.find(x => x[0] === zonaCodigo);
      if (z && z[4] > 0) return base * z[4];
    }
    const f = this._FACTORES_VAM[zonaCodigo] || factorDefecto || 1.25;
    return ritmoBaseFallback * f;
  },

  _distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad) {
    const ritmoSuaveSegGen = this._ritmoZonaMin('Z1', ritmoBase) * 60; // Z1 real del usuario
    const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
    const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
    const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
    const zona = detalle.zona?.split('-')[0] || 'Z4';
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05, 'Z6': 1.15 };
    const ifactor = factoresIF[zona] || 0.9;
    // 🔥 FIX ESCALA TSS: fórmula estándar (Coggan) es horas × IF² × 100;
    // al trabajar en minutos hay que multiplicar por 100/60 (≈1.667), si no
    // el TSS sale sistemáticamente ~40% por debajo de lo real (ver
    // PlanGenerator.FACTOR_ESCALA_TSS más abajo, misma constante en los 4
    // sitios donde se calcula TSS de carrera).
    // 🔥 FIX TSS ESTIMADO vs REAL: antes se multiplicaba TODA sesion.duracion
    // (incluidos calentamiento y enfriamiento) por el IF² de la zona
    // principal -- pero calentamiento/enfriamiento van siempre en Z1 (más
    // suave), y calcularTSSdesdeReal() SÍ pondera cada tramo por su propia
    // zona. Eso hacía que el TSS "planificado" saliera por encima (hasta
    // ~20% en sesiones con mucho calentamiento/enfriamiento) del TSS que se
    // registraba de verdad al completarla con GPS, inflando la carga
    // histórica en las sesiones marcadas sin GPS/corrección manual (que usan
    // esta estimación tal cual como TSS real). Ahora se pondera igual que
    // calcularTSSdesdeReal: parte principal con el IF de su zona,
    // calentamiento+enfriamiento con el IF de Z1.
    const calMinTss = detalle.calentamiento || 0;
    const enfMinTss = detalle.enfriamiento || 0;
    const mainMinTss = Math.max(0, (sesion.duracion || 0) - calMinTss - enfMinTss);
    const ifZ1Tss = factoresIF['Z1'];
    const tssTotal = Math.round(
      (mainMinTss * ifactor * ifactor + (calMinTss + enfMinTss) * ifZ1Tss * ifZ1Tss)
      * factorIntensidad * this.FACTOR_ESCALA_TSS
    );
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
    // Factores sobre ritmoBase equivalentes a 65/75/83/90/100/110 % de VAM (ver Training.startCalc)
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05, 'Z6': 1.15 };

    const { calentamiento, enfriamiento, partePrincipal } = this._calcularCalentamientoEnfriamiento(sesion.duracion);
    const ritmoSuaveMin = this._ritmoZonaMin('Z1', ritmoBase);
    const ritmoMin = this._ritmoZonaMin(zona, ritmoBase, 1.25);
    const distanciaCalentamiento = calentamiento / ritmoSuaveMin;
    const distanciaEnfriamiento = enfriamiento / ritmoSuaveMin;
    const distanciaPartePrincipal = partePrincipal / ritmoMin;
    const distanciaTotal = distanciaCalentamiento + distanciaPartePrincipal + distanciaEnfriamiento;

    const ifactor = factoresIF[zona] || 0.7;
    // 🔥 FIX TSS ESTIMADO vs REAL (misma corrección que en
    // _distanciaYTssDesdeParteP): calentamiento y enfriamiento van en Z1,
    // no en la zona principal -- se ponderan por separado para que el TSS
    // "planificado" no salga por encima del TSS real que se registraría
    // haciendo exactamente la sesión programada.
    const ifZ1 = factoresIF['Z1'];
    const tssTotal = Math.round(
      (partePrincipal * ifactor * ifactor + (calentamiento + enfriamiento) * ifZ1 * ifZ1)
      * factorIntensidad * this.FACTOR_ESCALA_TSS
    );
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

  // ¿Se puede registrar un entreno no programado en esta fecha? Depende
  // del tipo de plan:
  // - Plan GENERADO (cerrado, con fechas fijas): desde que empezó el plan
  //   hasta hoy (no tiene sentido registrar un entreno de un día futuro
  //   que aún no ha llegado).
  // - Plan PERSONALIZADO (el que se crea vacío para todo el año en curso
  //   e ir recibiendo sesiones sueltas del entrenador): desde HOY hasta
  //   el 31 de diciembre de ese año -- ampliado al año de la sesión más
  //   lejana que el entrenador ya haya mandado, si cae más adelante.
  _diaElegibleParaNoProgramado(fecha) {
    // 🔥 Se calcula la fecha de inicio directo desde la fuente real
    // (AppState.planGeneradoActual.fechaInicio) en vez de depender de
    // this._fechaInicioPlan -- esa propiedad solo se rellena dentro de
    // mostrarCalendario()/renderizarMes(), así que si algo llama a este
    // método sin haber pasado por ahí en esta misma carga, antes se
    // devolvía "no elegible" sin motivo real.
    const fechaInicioStr = AppState.planGeneradoActual?.fechaInicio;
    if (!fechaInicioStr) return false;
    const fechaInicioPlan = new Date(fechaInicioStr);
    fechaInicioPlan.setHours(0, 0, 0, 0);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (AppState.planActualTipo === 'personalizado') {
      const sesiones = this._sesionesActuales || [];
      let añoLimite = fechaInicioPlan.getFullYear();
      const maxDiaGlobal = sesiones.reduce((max, s) => Math.max(max, s.diaGlobal || 0), 0);
      if (maxDiaGlobal > 0) {
        const fechaUltimaSesion = new Date(fechaInicioPlan);
        fechaUltimaSesion.setDate(fechaUltimaSesion.getDate() + (maxDiaGlobal - 1));
        añoLimite = Math.max(añoLimite, fechaUltimaSesion.getFullYear());
      }
      const finAño = new Date(añoLimite, 11, 31);
      return fecha >= hoy && fecha <= finAño;
    }
    return fecha >= fechaInicioPlan && fecha <= hoy;
  },

  // Botón "+" para registrar un entreno no programado -- mismo diseño se
  // use donde se use (día totalmente vacío, o superpuesto en un "D" de
  // descanso), para que el calendario se vea consistente.
  _botonNoProgramadoHTML(diaGlobal) {
    return `<button class="btn-dia-no-programado" data-dia-vacio="${diaGlobal}" title="Registrar entreno no programado" style="position:absolute; bottom:2px; right:2px; width:16px; height:16px; line-height:14px; padding:0; border-radius:50%; border:1px solid var(--border-color-light); background:var(--stat-bg); color:var(--text-secondary); font-size:12px; font-weight:600; cursor:pointer; z-index:2;">+</button>`;
  },

  getColor(tipo) {
    const colores = {
      rodaje: 'sesion-rodaje',
      tempo: 'sesion-tempo',
      series: 'sesion-series',
      largo: 'sesion-largo',
      descanso: 'sesion-descanso',
      caminar: 'sesion-rodaje',
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
      caminar: 'C',
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
    // Modalidad GIMNASIO: plan de fuerza propio (no necesita zonas de FC ni datos de carrera).
    if (document.getElementById('modalidad')?.value === 'gimnasio') return this.generarPlanGimnasio();
    if (!AppState.zonasCalculadas) {
      Utils.showToast("PRIMERO CALCULA TUS ZONAS", 'error');
      return;
    }
    if (!AppState.isPremium) {
      if (window.showPremiumBenefits) showPremiumBenefits('nuevo-plan');
      else Utils.showToast("SOLO USUARIOS PREMIUM", 'error');
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
        Utils.showToast("NIVEL AVANZADO REQUIERE MÍNIMO 5 DÍAS DE ENTRENO", 'error');
        Utils.hideLoading();
        return;
      }
      if (diasEntreno.length === 0) {
        Utils.showToast("SELECCIONA AL MENOS UN DÍA", 'error');
        Utils.hideLoading();
        return;
      }
      const diasMinimos = this.obtenerDiasMinimos(distancia);
      if (diasEntreno.length < diasMinimos) {
        const etiquetaDistancia = {
          '2k': '2KM', '5k': '5KM', '10k': '10KM',
          'medio': 'MEDIA MARATÓN', 'maraton': 'MARATÓN'
        }[distancia] || distancia.toUpperCase();
        Utils.showToast(`PARA ${etiquetaDistancia} NECESITAS MÍNIMO ${diasMinimos} DÍAS`, 'error');
        Utils.hideLoading();
        return;
      }
      if (meses === 1 && !['2k', '5k', '10k'].includes(distancia)) {
        Utils.showToast("PLAN DE 1 MES SOLO PARA 2KM, 5KM Y 10KM", 'error');
        Utils.hideLoading();
        return;
      }
      if (['medio', 'maraton'].includes(distancia) && meses === 3 && experiencia === 'no') {
        Utils.showToast("PARA MEDIA O MARATÓN EN 3 MESES NECESITAS EXPERIENCIA", 'error');
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

      // 🔥 FIX (petición del usuario): la rampa inicial de la tirada larga
      // (más abajo) no debe aplicarse igual a quien ya viene entrenando
      // con volumen real que a quien empieza de cero -- aquí se saca
      // `carga` (ACWR) al ámbito del bucle de semanas, y se calcula una
      // "confianza de continuidad" (0 = arranca de cero, 1 = ya tiene
      // base sólida) para atenuar la rampa proporcionalmente, no de golpe
      // ni por la mera existencia de un plan anterior en la base de
      // datos -- por forma física real y reciente.
      let carga = null;
      try {
        carga = await this.calcularCargaEntrenamiento(AppState.currentUserId);
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

      // confianzaContinuidad: 0-1 según cuántos días de los últimos 28 hay
      // entreno registrado (satura en 20+ días -- entrenar entre semana sí
      // y semana no ya cuenta como base real). Si el ACWR indica que la
      // carga reciente se ha desplomado frente a la crónica (< 0.8, señal
      // de parón por lesión/enfermedad/vacaciones aunque hubiera base
      // antes), se recorta esa confianza al 40 %: puede que "tenga
      // costumbre" en el papel, pero su cuerpo lleva días sin recibir
      // ese estímulo, así que la rampa debe seguir protegiendo casi entera.
      let confianzaContinuidad = Math.min(1, (carga?.diasConDatos || 0) / 20);
      if (carga && carga.acwr !== null && carga.acwr < 0.8) confianzaContinuidad *= 0.4;

      // 🔥 FIX (petición del usuario, v4): confianzaContinuidad mide "¿ha
      // entrenado en general?", metiendo en el mismo saco de TSS un
      // rodaje corto y una tirada larga -- alguien que solo hace 30' de
      // rodaje suave cada día podía salir con confianza alta sin haber
      // corrido nunca más de 10 km recientemente. Se añade una segunda
      // señal, específica: cuánto duró (y hace cuánto) su ÚLTIMA tirada
      // larga real (trainingType === 'largo'), comparada con el techo de
      // referencia de la semana 1 de este plan. Se combinan con el
      // MÍNIMO de las dos -- ninguna tapa a la otra: haber entrenado en
      // general no basta si nunca ha hecho una tirada larga, y haber
      // hecho una tirada larga puntual hace mucho tampoco basta si el
      // ACWR muestra que lleva parado.
      let confianzaTiradaLarga = 0;
      try {
        const historialParaTiradaLarga = await this._obtenerHistorialGlobalFeed(AppState.currentUserId);
        const minutosReferenciaLargoS1 = this.getMaximosPorTipo('largo', nivel, 'BASE', distancia);
        confianzaTiradaLarga = this._evaluarTiradaLargaReciente(historialParaTiradaLarga, minutosReferenciaLargoS1);
      } catch (e) {
        console.warn('No se pudo evaluar la última tirada larga real (se sigue solo con la confianza general):', e);
      }
      confianzaContinuidad = Math.min(confianzaContinuidad, confianzaTiradaLarga);

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
          // 🔥 FIX (petición del usuario, v3): la rampa (v2, factor
          // proporcional) trataba a todo el mundo igual en la semana 1,
          // fuera su primer plan o el tercero seguido. Ahora se atenúa
          // con confianzaContinuidad (calculada arriba, por ACWR/días con
          // datos reales) -- cuanto más entrenando viene el atleta,
          // menos se suaviza su primera tirada, hasta desaparecer del
          // todo si ya tiene base sólida y reciente. El techo de
          // seguridad hace lo mismo, acercándose al techo normal de la
          // fase (maxLargo) según esa misma confianza.
          const RAMPA_INICIAL_FACTOR = { 1: 0.55, 2: 0.70, 3: 0.85 };
          const RAMPA_INICIAL_TECHO_SEGURIDAD = { 1: 100, 2: 120, 3: 140 };
          const maxLargo = this.getMaximosPorTipo('largo', nivelActual, fase, distancia);
          const factorRampaBase = RAMPA_INICIAL_FACTOR[semanaGlobal];
          if (factorRampaBase != null) {
            const factorRampaInicial = factorRampaBase + (1 - factorRampaBase) * confianzaContinuidad;
            minutosPorTipo.largo = Math.round(minutosPorTipo.largo * factorRampaInicial);
          }
          let largoMinimo = 45;
          if (fase === 'CONSTRUCCION') largoMinimo = 60;
          if (fase === 'ESPECIFICA' || fase === 'PICO') largoMinimo = 90;
          if (minutosPorTipo.largo < largoMinimo) minutosPorTipo.largo = largoMinimo;
          minutosPorTipo.largo = Math.min(minutosPorTipo.largo, maxLargo);
          const techoSeguridadBase = RAMPA_INICIAL_TECHO_SEGURIDAD[semanaGlobal];
          if (techoSeguridadBase != null) {
            const techoSeguridadInicial = Math.round(techoSeguridadBase + (maxLargo - techoSeguridadBase) * confianzaContinuidad);
            minutosPorTipo.largo = Math.min(minutosPorTipo.largo, techoSeguridadInicial);
          }
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
          // 🔥 FIX: _calcularDuracionLargoFinal() puede alargar la tirada
          // para que siga siendo la sesión más larga de la semana (si otra
          // sesión -- que no lleva el factor de rampa, solo la tirada --
          // salió más larga por su cuenta) -- eso podía deshacer el
          // recorte proporcional de arriba. Aquí no se reaplica el factor
          // (ya se aplicó una vez sobre infoLargo.minutos); solo se deja
          // el mismo techo de seguridad como límite duro final, atenuado
          // igual que arriba por confianzaContinuidad (acercándose al
          // techo normal de la fase si el atleta ya viene entrenando).
          const RAMPA_INICIAL_TECHO_SEGURIDAD = { 1: 100, 2: 120, 3: 140 };
          const techoSeguridadBaseFinal = RAMPA_INICIAL_TECHO_SEGURIDAD[semanaGlobal];
          const maxLargoFinal = this.getMaximosPorTipo('largo', nivelActual, fase, distancia);
          const duracionFinalLargoConRampa = techoSeguridadBaseFinal != null
            ? Math.min(duracionFinalLargo, Math.round(techoSeguridadBaseFinal + (maxLargoFinal - techoSeguridadBaseFinal) * confianzaContinuidad))
            : duracionFinalLargo;
          const sesionLargo = await this.crearSesionDesdeMatriz(
            { tipo: 'largo', esSimulacion: infoLargo.esSimulacion || false, esRecuperacion: false },
            true,
            fase,
            semanaEnFase,
            nivelActual,
            { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo },
            ajusteVolumen,
            intensidadTotal,
            duracionFinalLargoConRampa,
            duracionFinalLargoConRampa
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
      AppState.planActualTipo = planParaGuardar.tipo || null;
      AppState.sesionesRealizadas = {};
      AppState.diasDobles = {};
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;

      const nombreDiaLargo = ["", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][diaLargo];
      const nombreDiaInicio = ["", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][diaInicioSemana];
      const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      document.getElementById("resumenObjetivo").innerHTML = `
        <strong>${mapaDist[distancia]}</strong> · ${diasEntreno.length} DÍAS/SEMANA<br>
        <span style="color: var(--text-secondary); font-size: 14px;">
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

  // ==================== PLAN DE GIMNASIO ====================
  // Plan de fuerza "como te lo haría un entrenador", con criterios de la literatura de entrenamiento de fuerza:
  //  - Frecuencia: cada grupo muscular 2 veces/semana o más (reparto según los días elegidos).
  //  - Orden: primero los ejercicios multiarticulares, después los de aislamiento y el core al final.
  //  - Series, repeticiones y descansos según objetivo; descansos largos en los compuestos (2-3 min o más).
  //  - Intensidad por RIR (repeticiones en reserva) y progresión doble: primero repeticiones, luego peso.
  //  - Bloques de 4 semanas (3 de progresión + 1 de descarga) con esquema de repeticiones que cambia cada bloque (periodización ondulante).
  //  - Variedad: los accesorios rotan cada bloque y los ejercicios principales cada 2 bloques (salvo en FUERZA, que los mantiene).
  //  - Niveles (cambian el plan de verdad, no solo las series):
  //      PRINCIPIANTE: máquinas y variantes estables (en casa, versiones más fáciles: lista 'cb'), repeticiones moderadas, RIR holgado (4, 3, 2-3),
  //        una serie menos, 2 semanas de adaptación y, con 5-6 días, torso/pierna/cuerpo completo en vez de empuje/tirón/pierna.
  //      INTERMEDIO: el esquema base (RIR 3, 2, 1-2).
  //      AVANZADO: RIR más exigente (2, 1-2, 1), una serie más en el principal, periodización ondulante (la 2.ª sesión de cada tipo usa otro esquema de
  //        repeticiones), un accesorio extra con 4 días o menos (GYM.EXTRA_AVANZADO), variantes más duras (listas 'ag'/'ac': pausas, lastre, unilaterales)
  //        y técnicas de intensidad (serie descendente, rest-pause) en algunos accesorios de la semana 3 (hipertrofia y definición).
  //  - Equilibrio: el tirón (espalda) iguala o supera al empuje (pecho y hombro) y el glúteo recibe trabajo directo de cadera (hip thrust, sumo) en cada sesión de pierna y en el cuerpo completo.
  //  - Principiantes: el accesorio marcado 'o' en cada plantilla es el que se quita, para conservar todos los músculos en la semana.
  //  - Se adapta como el de running: feedback de las sesiones del plan anterior y carga reciente (ACWR).
  // Las sesiones son de tipo 'strength' (el calendario ya sabía pintarlas, marcarlas, calcular TSS/calorías y publicarlas).
  GYM: {
    "EJERCICIOS": {
      "press_banca_barra": {
        "n": "Press banca con barra",
        "c": "Escápulas atrás y abajo; baja la barra al pecho con control y empuja sin rebotar.",
        "seg": false
      },
      "press_banca_manc": {
        "n": "Press banca con mancuernas",
        "c": "Codos a unos 45° del tronco; baja hasta notar estiramiento en el pecho y sube sin chocar las mancuernas.",
        "seg": false
      },
      "press_pecho_maq": {
        "n": "Press de pecho en máquina",
        "c": "Espalda apoyada en el respaldo y empuje continuo, sin bloquear los codos del todo.",
        "seg": false
      },
      "flexiones": {
        "n": "Flexiones",
        "c": "Cuerpo en línea recta, pecho hacia el suelo y codos a unos 45°. Si cuesta, apoya las rodillas.",
        "seg": false
      },
      "press_inc_manc": {
        "n": "Press inclinado con mancuernas",
        "c": "Banco a 30°; empuja hacia arriba y ligeramente hacia dentro, sin encoger los hombros.",
        "seg": false
      },
      "press_inc_barra": {
        "n": "Press inclinado con barra",
        "c": "Banco a 30°; baja la barra a la parte alta del pecho con los antebrazos verticales.",
        "seg": false
      },
      "flex_pies_elev": {
        "n": "Flexiones con los pies elevados",
        "c": "Pies sobre una silla o banco; mantén el abdomen firme y baja con control.",
        "seg": false
      },
      "aperturas_manc": {
        "n": "Aperturas con mancuernas",
        "c": "Codos ligeramente flexionados; abre hasta notar el estiramiento y cierra como si abrazaras un árbol.",
        "seg": false
      },
      "cruces_polea": {
        "n": "Cruces en polea",
        "c": "Un pie adelantado y tronco estable; junta las manos delante del pecho y aprieta un segundo.",
        "seg": false
      },
      "pec_deck": {
        "n": "Aperturas en máquina (contractora)",
        "c": "Pecho arriba y hombros abajo; cierra sin despegar la espalda del respaldo.",
        "seg": false
      },
      "press_militar_barra": {
        "n": "Press militar con barra",
        "c": "Glúteos y abdomen firmes; empuja la barra en línea recta sobre la cabeza sin arquear la espalda.",
        "seg": false
      },
      "press_hombro_manc": {
        "n": "Press de hombros con mancuernas",
        "c": "Sentado con la espalda apoyada; sube las mancuernas sin chocarlas y baja hasta la altura de las orejas.",
        "seg": false
      },
      "press_hombro_maq": {
        "n": "Press de hombros en máquina",
        "c": "Ajusta el asiento para que las asas queden a la altura de los hombros y empuja sin encoger el cuello.",
        "seg": false
      },
      "pike": {
        "n": "Flexión en pica",
        "c": "Caderas altas formando una V invertida; baja la cabeza hacia el suelo entre las manos.",
        "seg": false
      },
      "elev_lat_manc": {
        "n": "Elevaciones laterales con mancuernas",
        "c": "Sube los codos hasta la altura de los hombros sin balancear el cuerpo; baja despacio.",
        "seg": false
      },
      "elev_lat_polea": {
        "n": "Elevaciones laterales en polea",
        "c": "Tensión constante: sube hasta la altura del hombro y controla la bajada.",
        "seg": false
      },
      "pajaros": {
        "n": "Pájaros con mancuernas",
        "c": "Torso inclinado y espalda recta; abre los brazos llevando los codos hacia atrás.",
        "seg": false
      },
      "face_pull": {
        "n": "Face pull en polea",
        "c": "Tira de la cuerda hacia la cara abriendo los codos; aprieta las escápulas al final.",
        "seg": false
      },
      "pec_deck_inv": {
        "n": "Pájaros en máquina (contractora inversa)",
        "c": "Brazos casi rectos; abre hasta la línea del tronco sin balancear.",
        "seg": false
      },
      "fondos_paralelas": {
        "n": "Fondos en paralelas",
        "c": "Tronco casi vertical para cargar el tríceps; baja hasta unos 90° de codo.",
        "seg": false
      },
      "press_frances_barra": {
        "n": "Press francés con barra EZ",
        "c": "Codos apuntando al techo y quietos; baja la barra hacia la frente y extiende.",
        "seg": false
      },
      "fondos_banco": {
        "n": "Fondos de tríceps en banco",
        "c": "Espalda cerca del banco; baja hasta unos 90° de codo y empuja con los brazos.",
        "seg": false
      },
      "press_frances_manc": {
        "n": "Press francés con mancuerna",
        "c": "Codos quietos apuntando al techo; baja las mancuernas junto a las sienes y extiende.",
        "seg": false
      },
      "ext_triceps_polea": {
        "n": "Extensión de tríceps en polea",
        "c": "Codos pegados al cuerpo; extiende por completo y aprieta el tríceps abajo.",
        "seg": false
      },
      "ext_triceps_cabeza": {
        "n": "Extensión de tríceps sobre la cabeza con mancuerna",
        "c": "Codos cerca de la cabeza; baja la mancuerna por detrás y estira hasta arriba.",
        "seg": false
      },
      "patada_triceps": {
        "n": "Patada de tríceps con mancuerna",
        "c": "Brazo pegado al torso; extiende el codo hacia atrás y mantén un segundo.",
        "seg": false
      },
      "jalon_pecho": {
        "n": "Jalón al pecho",
        "c": "Pecho alto; tira de la barra hacia la clavícula llevando los codos hacia abajo.",
        "seg": false
      },
      "jalon_neutro": {
        "n": "Jalón con agarre neutro",
        "c": "Agarre estrecho con las palmas enfrentadas; tira hacia el pecho sin impulso.",
        "seg": false
      },
      "dominadas": {
        "n": "Dominadas (con goma si hace falta)",
        "c": "Parte con los brazos estirados y sube el pecho hacia la barra sin balancearte.",
        "seg": false
      },
      "pullover_manc": {
        "n": "Pull-over con mancuerna",
        "c": "Brazos casi rectos; baja la mancuerna por detrás de la cabeza y vuelve notando el dorsal.",
        "seg": false
      },
      "remo_barra": {
        "n": "Remo con barra",
        "c": "Torso inclinado y espalda neutra; tira de la barra hacia el ombligo apretando las escápulas.",
        "seg": false
      },
      "remo_manc": {
        "n": "Remo con mancuerna a una mano",
        "c": "Apoya mano y rodilla en el banco; tira del codo hacia la cadera sin girar el tronco.",
        "seg": false
      },
      "remo_polea": {
        "n": "Remo en polea baja",
        "c": "Espalda recta y pecho abierto; lleva las asas al abdomen y aprieta atrás.",
        "seg": false
      },
      "remo_maquina": {
        "n": "Remo en máquina",
        "c": "Pecho apoyado en el pad; tira de los codos hacia atrás sin encoger los hombros.",
        "seg": false
      },
      "remo_invertido": {
        "n": "Remo invertido bajo una mesa o barra baja",
        "c": "Cuerpo recto como una tabla; lleva el pecho hacia la barra apretando las escápulas.",
        "seg": false
      },
      "curl_barra": {
        "n": "Curl con barra",
        "c": "Codos pegados al cuerpo; sube sin balancear la espalda y baja despacio.",
        "seg": false
      },
      "curl_manc": {
        "n": "Curl con mancuernas alterno",
        "c": "Gira la muñeca al subir (palmas arriba) y baja controlando; sin impulso.",
        "seg": false
      },
      "curl_martillo": {
        "n": "Curl martillo",
        "c": "Palmas enfrentadas durante todo el movimiento; codos quietos.",
        "seg": false
      },
      "curl_inclinado": {
        "n": "Curl en banco inclinado con mancuernas",
        "c": "Banco a 60° con los brazos colgando; sube sin adelantar los codos para estirar bien el bíceps.",
        "seg": false
      },
      "curl_polea": {
        "n": "Curl en polea baja",
        "c": "Tensión constante: sube hasta contraer y baja sin soltar el peso.",
        "seg": false
      },
      "sentadilla_barra": {
        "n": "Sentadilla con barra",
        "c": "Pies al ancho de hombros y pecho alto; baja hasta la paralela con las rodillas siguiendo la punta de los pies.",
        "seg": false
      },
      "prensa": {
        "n": "Prensa de piernas",
        "c": "Espalda y glúteos pegados al respaldo; baja hasta unos 90° sin despegar la pelvis.",
        "seg": false
      },
      "sentadilla_goblet": {
        "n": "Sentadilla goblet con mancuerna",
        "c": "Mancuerna pegada al pecho; baja con el torso erguido y empuja el suelo al subir.",
        "seg": false
      },
      "zancadas": {
        "n": "Zancadas con mancuernas",
        "c": "Paso largo y torso erguido; rodilla delantera sobre el pie y la trasera casi al suelo.",
        "seg": false
      },
      "bulgara": {
        "n": "Sentadilla búlgara",
        "c": "Pie trasero sobre un banco; baja con el torso algo inclinado y empuja con el pie delantero.",
        "seg": false
      },
      "sentadilla_corporal": {
        "n": "Sentadilla con peso corporal y pausa",
        "c": "Baja despacio, haz una pausa de 2 segundos abajo y sube con fuerza.",
        "seg": false
      },
      "ext_cuadriceps": {
        "n": "Extensión de cuádriceps en máquina",
        "c": "Ajusta el respaldo; extiende hasta arriba, aprieta un segundo y baja despacio.",
        "seg": false
      },
      "pmr_barra": {
        "n": "Peso muerto rumano con barra",
        "c": "Rodillas semiflexionadas, cadera hacia atrás y barra pegada a las piernas; espalda neutra siempre.",
        "seg": false
      },
      "pmr_manc": {
        "n": "Peso muerto rumano con mancuernas",
        "c": "Lleva la cadera atrás con las mancuernas pegadas a las piernas; nota el estiramiento del femoral.",
        "seg": false
      },
      "hip_thrust": {
        "n": "Hip thrust",
        "c": "Espalda alta apoyada en el banco; sube la cadera apretando los glúteos sin arquear la zona lumbar.",
        "seg": false
      },
      "curl_femoral_tumbado": {
        "n": "Curl femoral tumbado",
        "c": "Caderas pegadas al banco; flexiona las rodillas hasta arriba y baja sin soltar el peso.",
        "seg": false
      },
      "curl_femoral_sentado": {
        "n": "Curl femoral sentado",
        "c": "Ajusta el rodillo sobre los tobillos; tira hacia atrás sin levantar los muslos.",
        "seg": false
      },
      "curl_femoral_toalla": {
        "n": "Curl femoral con toalla deslizante",
        "c": "Tumbado, con los talones sobre una toalla en suelo liso; sube la cadera y arrastra los talones hacia ti.",
        "seg": false
      },
      "puente_gluteo": {
        "n": "Puente de glúteo a una pierna",
        "c": "Talón cerca del glúteo; sube la cadera apretando y mantén un segundo arriba.",
        "seg": false
      },
      "patada_polea": {
        "n": "Patada de glúteo en polea",
        "c": "Cuerpo estable y espalda neutra; empuja el tobillo hacia atrás apretando el glúteo.",
        "seg": false
      },
      "abduccion_maq": {
        "n": "Abducción de cadera en máquina",
        "c": "Espalda apoyada; abre las piernas con control y aguanta un segundo.",
        "seg": false
      },
      "gemelo_pie": {
        "n": "Elevación de talones de pie",
        "c": "Sube hasta ponerte de puntillas, haz una pausa de un segundo y baja estirando bien.",
        "seg": false
      },
      "gemelo_sentado": {
        "n": "Elevación de talones sentado",
        "c": "Rodillas a 90°; recorrido completo y pausa arriba.",
        "seg": false
      },
      "plancha": {
        "n": "Plancha",
        "c": "Cuerpo en línea recta, glúteos y abdomen apretados; no dejes caer la cadera.",
        "seg": true
      },
      "crunch_polea": {
        "n": "Crunch en polea alta",
        "c": "De rodillas, redondea la espalda llevando las costillas hacia la pelvis; no tires con los brazos.",
        "seg": false
      },
      "elev_piernas": {
        "n": "Elevación de piernas tumbado",
        "c": "Lumbar pegada al suelo; baja las piernas despacio sin arquear la espalda.",
        "seg": false
      },
      "dead_bug": {
        "n": "Bicho muerto (dead bug)",
        "c": "Lumbar pegada al suelo; extiende brazo y pierna contrarios sin perder el control.",
        "seg": false
      },
      "pallof": {
        "n": "Press Pallof en polea",
        "c": "De lado a la polea y con los brazos al frente; resiste el giro del tronco.",
        "seg": false
      },
      "press_suelo_manc": {
        "n": "Press de suelo con mancuernas",
        "c": "Tumbado en el suelo; baja hasta que los codos toquen el suelo y empuja sin arquear la espalda.",
        "seg": false
      },
      "press_arnold": {
        "n": "Press Arnold",
        "c": "Parte con las palmas hacia ti y gira las muñecas mientras subes; controla la bajada.",
        "seg": false
      },
      "press_cerrado_barra": {
        "n": "Press banca con agarre cerrado",
        "c": "Manos al ancho de hombros y codos pegados al cuerpo; baja la barra a la parte baja del pecho.",
        "seg": false
      },
      "press_cerrado_manc": {
        "n": "Press con mancuernas y agarre neutro",
        "c": "Palmas enfrentadas y codos cerca del cuerpo; empuja notando el tríceps.",
        "seg": false
      },
      "ext_triceps_cuerda": {
        "n": "Extensión de tríceps con cuerda",
        "c": "Codos pegados al cuerpo; separa los extremos de la cuerda al final del recorrido.",
        "seg": false
      },
      "ext_triceps_cabeza_polea": {
        "n": "Extensión de tríceps sobre la cabeza en polea",
        "c": "De espaldas a la polea y con los codos hacia delante; estira hasta arriba con los brazos pegados a la cabeza.",
        "seg": false
      },
      "dominadas_asistidas": {
        "n": "Dominadas asistidas en máquina",
        "c": "Pecho alto y codos hacia abajo; sube hasta pasar la barbilla de la barra sin balancearte.",
        "seg": false
      },
      "remo_t": {
        "n": "Remo con pecho apoyado",
        "c": "Pecho apoyado en el banco inclinado; tira de los codos hacia atrás y aprieta las escápulas.",
        "seg": false
      },
      "remo_polea_uni": {
        "n": "Remo unilateral en polea",
        "c": "Tronco estable; tira del codo hacia la cadera y deja que el hombro se estire al volver.",
        "seg": false
      },
      "pullover_polea": {
        "n": "Pull-over en polea alta",
        "c": "Brazos casi rectos; lleva la barra hacia los muslos con los dorsales, sin doblar los codos.",
        "seg": false
      },
      "curl_predicador": {
        "n": "Curl predicador",
        "c": "Brazos apoyados en el banco; baja hasta casi estirar el codo y sube sin despegar el brazo.",
        "seg": false
      },
      "curl_concentrado": {
        "n": "Curl concentrado",
        "c": "Codo apoyado en el muslo; sube despacio y aprieta el bíceps arriba.",
        "seg": false
      },
      "sentadilla_frontal": {
        "n": "Sentadilla frontal",
        "c": "Codos altos y torso erguido; baja hasta la paralela manteniendo la barra sobre los hombros.",
        "seg": false
      },
      "hack": {
        "n": "Sentadilla hack en máquina",
        "c": "Espalda apoyada y pies a media altura de la plataforma; baja con control hasta unos 90° o más.",
        "seg": false
      },
      "step_up": {
        "n": "Subidas al banco con mancuernas",
        "c": "Pie completo sobre el banco; sube empujando con la pierna de arriba, sin impulso del pie de atrás.",
        "seg": false
      },
      "trap_bar": {
        "n": "Peso muerto con barra hexagonal",
        "c": "Pecho alto y espalda neutra; empuja el suelo con las piernas y estira cadera y rodillas a la vez.",
        "seg": false
      },
      "hiperextension": {
        "n": "Hiperextensiones en banco romano",
        "c": "Baja con la espalda recta y sube apretando glúteos y femorales hasta quedar en línea con el cuerpo.",
        "seg": false
      },
      "sentadilla_sumo": {
        "n": "Sentadilla sumo con mancuerna",
        "c": "Pies bien abiertos y puntas hacia fuera; baja con el torso erguido y empuja con los glúteos.",
        "seg": false
      },
      "gemelo_prensa": {
        "n": "Elevación de talones en prensa",
        "c": "Solo la parte delantera del pie en la plataforma; recorrido completo con pausa arriba.",
        "seg": false
      },
      "plancha_lateral": {
        "n": "Plancha lateral",
        "c": "Cuerpo en línea recta de la cabeza a los pies; cadera alta y sin rotar el tronco.",
        "seg": true
      },
      "elev_rodillas_colgado": {
        "n": "Elevación de rodillas colgado",
        "c": "Sin balanceo; lleva las rodillas al pecho redondeando la pelvis.",
        "seg": false
      },
      "jalon_banda": {
        "n": "Jalón con banda elástica",
        "c": "Ancla la banda arriba; tira hacia el pecho llevando los codos hacia abajo y aprieta los dorsales.",
        "seg": false
      },
      "crunch_inverso": {
        "n": "Crunch inverso",
        "c": "Tumbado, lleva las rodillas al pecho elevando la pelvis; baja despacio.",
        "seg": false
      },
      "press_banca_smith": {
        "n": "Press banca en máquina Smith",
        "c": "Barra guiada: escápulas atrás y abajo, baja hasta la mitad del pecho y empuja sin rebotar.",
        "seg": false
      },
      "flexiones_inclinadas": {
        "n": "Flexiones con las manos elevadas",
        "c": "Apoya las manos en un banco o mesa firme; cuerpo recto y baja el pecho hacia el borde. Más fácil que en el suelo.",
        "seg": false
      },
      "flexiones_banda": {
        "n": "Flexiones con banda elástica",
        "c": "Pasa la banda por la espalda y sujétala con las manos; cuerpo en línea recta y empuja sin arquear la zona lumbar.",
        "seg": false
      },
      "press_banca_pausa": {
        "n": "Press banca con pausa",
        "c": "Baja la barra al pecho, mantén 1-2 segundos quieto sin relajar y empuja con fuerza.",
        "seg": false
      },
      "flexiones_arquero": {
        "n": "Flexiones arquero",
        "c": "Manos muy abiertas: baja hacia un lado con el otro brazo estirado y alterna lados.",
        "seg": false
      },
      "press_inc_maq": {
        "n": "Press inclinado en máquina",
        "c": "Ajusta el asiento para que las asas queden a la altura del pecho alto; empuja sin despegar la espalda del respaldo.",
        "seg": false
      },
      "press_inc_smith": {
        "n": "Press inclinado en máquina Smith",
        "c": "Banco a 30°; baja la barra a la parte alta del pecho y empuja en línea recta.",
        "seg": false
      },
      "press_inc_neutro": {
        "n": "Press inclinado con mancuernas y agarre neutro",
        "c": "Palmas enfrentadas y codos cerca del cuerpo; empuja hacia arriba sin encoger los hombros.",
        "seg": false
      },
      "aperturas_inc_manc": {
        "n": "Aperturas inclinadas con mancuernas",
        "c": "Banco a 30° y codos algo flexionados; abre hasta notar el estiramiento y cierra hacia arriba.",
        "seg": false
      },
      "cruces_polea_baja": {
        "n": "Cruces en polea baja",
        "c": "Poleas abajo y brazos casi rectos; lleva las manos hacia arriba y al centro apretando el pecho.",
        "seg": false
      },
      "aperturas_banda": {
        "n": "Aperturas con banda elástica",
        "c": "Ancla la banda detrás de ti; con los brazos casi rectos junta las manos delante del pecho y vuelve despacio.",
        "seg": false
      },
      "press_hombro_kb": {
        "n": "Press de hombros con kettlebell",
        "c": "Agarra la kettlebell con la palma hacia dentro; empuja sobre la cabeza con el abdomen firme y sin arquear la espalda.",
        "seg": false
      },
      "press_hombro_smith": {
        "n": "Press de hombros en máquina Smith",
        "c": "Sentado y con la espalda apoyada; baja la barra a la altura de la barbilla y empuja en vertical.",
        "seg": false
      },
      "push_press": {
        "n": "Push press con barra",
        "c": "Flexiona un poco las rodillas y usa el impulso de las piernas para subir la barra sobre la cabeza; baja con control.",
        "seg": false
      },
      "pike_elevado": {
        "n": "Flexión en pica con los pies elevados",
        "c": "Pies sobre un banco y caderas altas; baja la cabeza entre las manos y empuja sin arquear la espalda.",
        "seg": false
      },
      "press_hombro_banda": {
        "n": "Press de hombros con banda elástica",
        "c": "Pisa la banda y sujétala a la altura de los hombros; empuja hacia arriba sin arquear la espalda.",
        "seg": false
      },
      "elev_lat_banda": {
        "n": "Elevaciones laterales con banda elástica",
        "c": "Pisa la banda; sube los brazos hasta la altura de los hombros con los codos ligeramente flexionados.",
        "seg": false
      },
      "elev_lat_maq": {
        "n": "Elevaciones laterales en máquina",
        "c": "Apoya los antebrazos en los pads y sube hasta la altura de los hombros sin encogerlos.",
        "seg": false
      },
      "pajaros_banda": {
        "n": "Pájaros con banda elástica",
        "c": "Sujeta la banda con los brazos casi rectos al frente y ábrelos hacia los lados juntando las escápulas.",
        "seg": false
      },
      "pajaros_polea": {
        "n": "Pájaros en polea cruzada",
        "c": "Cruza las poleas y tira hacia los lados con los brazos casi rectos, sin balancear el torso.",
        "seg": false
      },
      "face_pull_banda": {
        "n": "Face pull con banda elástica",
        "c": "Ancla la banda a la altura de la cara; tira hacia la frente abriendo los codos y aprieta las escápulas.",
        "seg": false
      },
      "fondos_maq": {
        "n": "Fondos asistidos en máquina",
        "c": "Elige una asistencia con la que controles todo el recorrido; baja hasta unos 90° de codo y empuja.",
        "seg": false
      },
      "flexiones_diamante": {
        "n": "Flexiones diamante",
        "c": "Manos juntas bajo el pecho formando un rombo y codos pegados al cuerpo; baja con control.",
        "seg": false
      },
      "fondos_lastrados": {
        "n": "Fondos en paralelas con lastre",
        "c": "Con un cinturón o una mancuerna entre los pies; baja a unos 90° de codo con el tronco algo inclinado y sube sin bloquear.",
        "seg": false
      },
      "ext_triceps_banda": {
        "n": "Extensión de tríceps con banda elástica",
        "c": "Ancla la banda arriba; codos pegados al cuerpo y extiende por completo.",
        "seg": false
      },
      "ext_triceps_maq": {
        "n": "Extensión de tríceps en máquina",
        "c": "Codos apoyados y pegados al cuerpo; extiende por completo y vuelve despacio.",
        "seg": false
      },
      "jalon_unilateral": {
        "n": "Jalón a una mano en polea",
        "c": "Tira del codo hacia la cadera con el pecho abierto y el tronco quieto.",
        "seg": false
      },
      "dominadas_neutras": {
        "n": "Dominadas con agarre neutro",
        "c": "Palmas enfrentadas; parte con los brazos estirados y sube el pecho hacia las asas sin balancearte.",
        "seg": false
      },
      "dominadas_lastradas": {
        "n": "Dominadas con lastre",
        "c": "Con un cinturón o una mancuerna entre los pies; sube hasta pasar la barbilla y baja controlando.",
        "seg": false
      },
      "dominadas_negativas": {
        "n": "Dominadas negativas",
        "c": "Sube con ayuda de un banco y baja lo más despacio posible (4-5 segundos) hasta tener los brazos estirados.",
        "seg": false
      },
      "remo_kb": {
        "n": "Remo con kettlebell a una mano",
        "c": "Apoya la mano libre en un banco, espalda recta y tira del codo hacia la cadera.",
        "seg": false
      },
      "remo_trx": {
        "n": "Remo con TRX",
        "c": "Cuerpo recto e inclinado hacia atrás; tira del pecho hacia las asas apretando las escápulas. Cuanto más vertical, más fácil.",
        "seg": false
      },
      "remo_banda": {
        "n": "Remo con banda elástica",
        "c": "Sentado con la banda en los pies o anclada delante; tira hacia el abdomen con la espalda recta.",
        "seg": false
      },
      "remo_pendlay": {
        "n": "Remo Pendlay",
        "c": "La barra parte del suelo en cada repetición y el torso queda casi paralelo al suelo; tira rápido hacia el abdomen y baja con control.",
        "seg": false
      },
      "remo_invertido_elev": {
        "n": "Remo invertido con los pies elevados",
        "c": "Igual que el remo invertido pero con los pies sobre un banco: más inclinación, más dificultad.",
        "seg": false
      },
      "encogimientos_manc": {
        "n": "Encogimientos de hombros con mancuernas",
        "c": "Sube los hombros hacia las orejas sin girarlos y mantén un segundo arriba.",
        "seg": false
      },
      "superman": {
        "n": "Superman (extensión de espalda tumbado)",
        "c": "Tumbado boca abajo, eleva brazos y piernas a la vez y mantén la posición sin forzar la zona lumbar.",
        "seg": true
      },
      "curl_banda": {
        "n": "Curl con banda elástica",
        "c": "Pisa la banda y sube con los codos pegados al cuerpo, sin balancear.",
        "seg": false
      },
      "curl_spider": {
        "n": "Curl araña (pecho apoyado en banco inclinado)",
        "c": "Pecho apoyado en un banco inclinado y brazos colgando; sube sin balancear.",
        "seg": false
      },
      "curl_maq": {
        "n": "Curl en máquina",
        "c": "Codos apoyados en el pad; sube sin despegarlos y baja controlando.",
        "seg": false
      },
      "curl_trx": {
        "n": "Curl con TRX",
        "c": "Brazos extendidos hacia las asas y cuerpo inclinado hacia atrás; flexiona los codos llevando las manos hacia la frente.",
        "seg": false
      },
      "sentadilla_smith": {
        "n": "Sentadilla en máquina Smith",
        "c": "Pies algo adelantados respecto a la barra; baja hasta paralelo con la espalda recta y sube empujando el suelo.",
        "seg": false
      },
      "sentadilla_caja": {
        "n": "Sentadilla a un banco",
        "c": "Siéntate con control sobre el banco sin relajarte y levántate empujando el suelo. Ideal para aprender la sentadilla.",
        "seg": false
      },
      "sentadilla_pausa": {
        "n": "Sentadilla con pausa",
        "c": "Baja hasta paralelo o algo más, mantén 2 segundos abajo sin relajar y sube con fuerza.",
        "seg": false
      },
      "sentadilla_goblet_kb": {
        "n": "Sentadilla goblet con kettlebell",
        "c": "Sujeta la kettlebell contra el pecho con los codos hacia dentro; baja con el torso erguido y sube empujando el suelo.",
        "seg": false
      },
      "zancada_caminando": {
        "n": "Zancadas caminando",
        "c": "Pasos largos con el torso erguido; baja la rodilla trasera cerca del suelo y empuja con el talón delantero.",
        "seg": false
      },
      "sentadilla_trx": {
        "n": "Sentadilla asistida con TRX",
        "c": "Agárrate a las asas para mantener el equilibrio; baja con el torso erguido y sube empujando el suelo.",
        "seg": false
      },
      "zancada_inversa": {
        "n": "Zancada hacia atrás",
        "c": "Da un paso atrás y baja con control; el peso va en el talón de la pierna delantera. Más amable con las rodillas.",
        "seg": false
      },
      "zancada_lateral": {
        "n": "Zancada lateral",
        "c": "Da un paso grande a un lado flexionando esa rodilla, con la otra pierna estirada; empuja para volver.",
        "seg": false
      },
      "sentadilla_pared": {
        "n": "Sentadilla isométrica en la pared",
        "c": "Espalda apoyada en la pared y muslos paralelos al suelo; aguanta sin dejar caer la cadera.",
        "seg": true
      },
      "pmr_kb": {
        "n": "Peso muerto con kettlebell",
        "c": "Pies a la anchura de la cadera y espalda recta; lleva la cadera atrás y sube empujando el suelo.",
        "seg": false
      },
      "pmr_unilateral": {
        "n": "Peso muerto rumano a una pierna",
        "c": "Cadera atrás con la pierna libre estirada detrás; espalda recta y baja hasta notar el estiramiento del femoral.",
        "seg": false
      },
      "buenos_dias": {
        "n": "Buenos días con barra",
        "c": "Barra baja sobre la espalda y rodillas algo flexionadas; lleva la cadera atrás con la espalda neutra y sube.",
        "seg": false
      },
      "pmr_banda": {
        "n": "Peso muerto con banda elástica",
        "c": "Pisa la banda y sujétala con las manos; lleva la cadera atrás con la espalda recta y sube apretando el glúteo.",
        "seg": false
      },
      "peso_muerto": {
        "n": "Peso muerto con barra",
        "c": "Barra pegada a las piernas y espalda neutra; empuja el suelo con las piernas y extiende la cadera sin tirar con la espalda.",
        "seg": false
      },
      "curl_femoral_banda": {
        "n": "Curl femoral con banda elástica",
        "c": "Tumbado boca abajo con la banda anclada; lleva el talón hacia el glúteo y vuelve despacio.",
        "seg": false
      },
      "curl_femoral_nordico": {
        "n": "Curl nórdico asistido",
        "c": "Rodillas apoyadas y talones sujetos; baja el torso lo más despacio posible y ayúdate con las manos al subir.",
        "seg": false
      },
      "hip_thrust_maq": {
        "n": "Hip thrust en máquina",
        "c": "Espalda alta apoyada y cadera baja; sube hasta alinear tronco y muslos y aprieta el glúteo arriba.",
        "seg": false
      },
      "swing_kb": {
        "n": "Swing con kettlebell",
        "c": "Lleva la cadera atrás y extiéndela con fuerza para lanzar la kettlebell hasta el pecho; los brazos solo la guían.",
        "seg": false
      },
      "hip_thrust_banda": {
        "n": "Hip thrust con banda elástica",
        "c": "Con una banda sobre las rodillas, empuja las rodillas hacia fuera mientras subes la cadera.",
        "seg": false
      },
      "hip_thrust_pausa": {
        "n": "Hip thrust con pausa",
        "c": "Sube la cadera, mantén 2 segundos apretando el glúteo arriba y baja controlando.",
        "seg": false
      },
      "puente_gluteo_2p": {
        "n": "Puente de glúteo",
        "c": "Tumbado con los pies cerca del glúteo; sube la cadera apretando el glúteo y baja sin apoyar del todo.",
        "seg": false
      },
      "patada_banda": {
        "n": "Patada de glúteo con banda elástica",
        "c": "A cuatro apoyos con la banda en los pies; empuja el talón hacia atrás y arriba sin arquear la espalda.",
        "seg": false
      },
      "abduccion_banda": {
        "n": "Abducción de cadera con banda elástica",
        "c": "Con la banda sobre las rodillas, abre las piernas contra la resistencia, de pie o tumbado de lado.",
        "seg": false
      },
      "paso_lateral_banda": {
        "n": "Pasos laterales con banda",
        "c": "Banda sobre las rodillas y rodillas algo flexionadas; da pasos laterales manteniendo la tensión.",
        "seg": false
      },
      "patada_gluteo_maq": {
        "n": "Patada de glúteo en máquina",
        "c": "Apoya el pecho y empuja el pie hacia atrás contra el pad sin arquear la lumbar; aprieta arriba.",
        "seg": false
      },
      "gemelo_unilateral": {
        "n": "Elevación de talones a una pierna",
        "c": "Apoya los dedos en un escalón y sube sobre una pierna; baja hasta estirar bien el gemelo.",
        "seg": false
      },
      "rueda_abdominal": {
        "n": "Rueda abdominal",
        "c": "De rodillas, rueda hacia delante con el abdomen firme y sin hundir la zona lumbar; vuelve con control.",
        "seg": false
      },
      "crunch": {
        "n": "Crunch abdominal",
        "c": "Tumbado con las rodillas flexionadas; sube el pecho hacia las rodillas sin tirar del cuello y baja controlando.",
        "seg": false
      },
      "farmer": {
        "n": "Paseo del granjero",
        "c": "Camina erguido con una mancuerna o kettlebell pesada en cada mano; hombros abajo y abdomen firme.",
        "seg": true
      },
      "plancha_hombros": {
        "n": "Plancha con toque de hombros",
        "c": "En plancha alta, toca el hombro contrario con la mano sin balancear la cadera.",
        "seg": true
      },
      "bird_dog": {
        "n": "Bird dog",
        "c": "A cuatro apoyos, estira el brazo y la pierna contrarios manteniendo la espalda plana; alterna lados.",
        "seg": false
      },
      "elev_piernas_colgado": {
        "n": "Elevación de piernas colgado",
        "c": "Colgado de la barra, sube las piernas estiradas hasta la horizontal sin balancearte.",
        "seg": false
      },
      "pallof_banda": {
        "n": "Press Pallof con banda elástica",
        "c": "De pie y de lado al anclaje; empuja la banda al frente y aguanta sin que el tronco gire.",
        "seg": false
      },
      "hollow": {
        "n": "Posición hueca",
        "c": "Tumbado con la zona lumbar pegada al suelo; eleva hombros y piernas estiradas y aguanta.",
        "seg": true
      }
    },
    "GRUPOS": {
      "PECHO_COMP": {
        "g": [
          "press_banca_barra",
          "press_banca_manc",
          "press_pecho_maq",
          "press_banca_smith"
        ],
        "c": [
          "press_banca_manc",
          "press_suelo_manc",
          "flexiones",
          "flexiones_banda"
        ],
        "b": [
          "press_banca_smith",
          "flexiones_inclinadas",
          "press_pecho_maq",
          "press_banca_manc",
          "press_banca_barra"
        ],
        "cb": [
          "flexiones_inclinadas"
        ],
        "ag": [
          "press_banca_pausa"
        ],
        "ac": [
          "flexiones_arquero"
        ]
      },
      "PECHO_INC": {
        "g": [
          "press_inc_manc",
          "press_inc_barra",
          "press_inc_maq",
          "press_inc_smith",
          "press_inc_neutro"
        ],
        "c": [
          "press_inc_manc",
          "flex_pies_elev",
          "press_inc_neutro"
        ],
        "b": [
          "press_inc_maq",
          "press_inc_manc",
          "press_inc_barra"
        ]
      },
      "PECHO_AISL": {
        "g": [
          "aperturas_manc",
          "cruces_polea",
          "pec_deck",
          "aperturas_inc_manc",
          "cruces_polea_baja"
        ],
        "c": [
          "aperturas_manc",
          "aperturas_inc_manc",
          "aperturas_banda"
        ],
        "b": [
          "pec_deck",
          "cruces_polea",
          "aperturas_manc"
        ],
        "cb": [
          "aperturas_banda"
        ]
      },
      "HOMBRO_COMP": {
        "g": [
          "press_hombro_manc",
          "press_militar_barra",
          "press_arnold",
          "press_hombro_maq",
          "press_hombro_kb",
          "press_hombro_smith"
        ],
        "c": [
          "press_hombro_manc",
          "press_arnold",
          "pike",
          "press_hombro_kb",
          "press_hombro_banda"
        ],
        "b": [
          "press_hombro_smith",
          "press_hombro_maq",
          "press_hombro_manc",
          "press_arnold"
        ],
        "cb": [
          "press_hombro_banda"
        ],
        "ag": [
          "push_press"
        ],
        "ac": [
          "pike_elevado"
        ]
      },
      "HOMBRO_LAT": {
        "g": [
          "elev_lat_polea",
          "elev_lat_manc",
          "elev_lat_maq"
        ],
        "c": [
          "elev_lat_manc",
          "elev_lat_banda"
        ],
        "b": [
          "elev_lat_maq",
          "elev_lat_manc",
          "elev_lat_polea"
        ],
        "cb": [
          "elev_lat_banda"
        ]
      },
      "HOMBRO_POST": {
        "g": [
          "pec_deck_inv",
          "face_pull",
          "pajaros",
          "pajaros_polea"
        ],
        "c": [
          "pajaros",
          "pajaros_banda",
          "face_pull_banda"
        ],
        "b": [
          "pec_deck_inv",
          "face_pull",
          "pajaros"
        ],
        "cb": [
          "pajaros_banda",
          "face_pull_banda"
        ]
      },
      "TRICEPS_COMP": {
        "g": [
          "fondos_paralelas",
          "press_cerrado_barra",
          "press_frances_barra",
          "fondos_maq"
        ],
        "c": [
          "fondos_banco",
          "press_cerrado_manc",
          "press_frances_manc",
          "flexiones_diamante"
        ],
        "b": [
          "fondos_maq",
          "press_cerrado_manc",
          "press_frances_manc",
          "fondos_paralelas"
        ],
        "ag": [
          "fondos_lastrados"
        ]
      },
      "TRICEPS_AISL": {
        "g": [
          "ext_triceps_cabeza_polea",
          "ext_triceps_cabeza",
          "ext_triceps_polea",
          "ext_triceps_cuerda",
          "patada_triceps",
          "ext_triceps_maq"
        ],
        "c": [
          "ext_triceps_cabeza",
          "patada_triceps",
          "ext_triceps_banda"
        ],
        "b": [
          "ext_triceps_maq",
          "ext_triceps_polea",
          "ext_triceps_cuerda",
          "ext_triceps_cabeza"
        ],
        "cb": [
          "ext_triceps_banda"
        ]
      },
      "ESPALDA_VERT": {
        "g": [
          "jalon_pecho",
          "jalon_neutro",
          "dominadas_asistidas",
          "jalon_unilateral"
        ],
        "c": [
          "dominadas",
          "jalon_banda",
          "pullover_manc"
        ],
        "b": [
          "jalon_pecho",
          "jalon_neutro",
          "dominadas_asistidas"
        ],
        "cb": [
          "dominadas_negativas"
        ],
        "ag": [
          "dominadas_neutras",
          "dominadas_lastradas"
        ],
        "ac": [
          "dominadas_neutras"
        ]
      },
      "ESPALDA_HOR": {
        "g": [
          "remo_barra",
          "remo_polea",
          "remo_t",
          "remo_manc",
          "remo_polea_uni",
          "remo_maquina",
          "remo_kb"
        ],
        "c": [
          "remo_manc",
          "remo_t",
          "remo_invertido",
          "remo_kb",
          "remo_trx",
          "remo_banda"
        ],
        "b": [
          "remo_maquina",
          "remo_polea",
          "remo_t",
          "remo_manc"
        ],
        "cb": [
          "remo_trx",
          "remo_banda"
        ],
        "ag": [
          "remo_pendlay",
          "remo_invertido_elev"
        ],
        "ac": [
          "remo_invertido_elev"
        ]
      },
      "ESPALDA_AISL": {
        "g": [
          "pullover_polea",
          "pullover_manc",
          "encogimientos_manc"
        ],
        "c": [
          "pullover_manc",
          "jalon_banda",
          "encogimientos_manc",
          "superman"
        ],
        "b": [
          "pullover_polea",
          "pullover_manc"
        ],
        "cb": [
          "superman"
        ]
      },
      "BICEPS": {
        "g": [
          "curl_inclinado",
          "curl_barra",
          "curl_predicador",
          "curl_martillo",
          "curl_polea",
          "curl_manc",
          "curl_concentrado",
          "curl_spider",
          "curl_maq"
        ],
        "c": [
          "curl_manc",
          "curl_inclinado",
          "curl_martillo",
          "curl_concentrado",
          "curl_banda",
          "curl_trx"
        ],
        "b": [
          "curl_maq",
          "curl_manc",
          "curl_polea",
          "curl_martillo",
          "curl_predicador"
        ],
        "cb": [
          "curl_banda"
        ]
      },
      "CUAD_COMP": {
        "g": [
          "sentadilla_barra",
          "prensa",
          "hack",
          "bulgara",
          "sentadilla_frontal",
          "zancadas",
          "step_up",
          "sentadilla_smith",
          "sentadilla_goblet_kb",
          "zancada_caminando",
          "zancada_inversa"
        ],
        "c": [
          "sentadilla_goblet",
          "zancadas",
          "bulgara",
          "step_up",
          "sentadilla_corporal",
          "sentadilla_goblet_kb",
          "zancada_caminando",
          "zancada_inversa"
        ],
        "b": [
          "sentadilla_smith",
          "sentadilla_caja",
          "zancada_inversa",
          "prensa",
          "sentadilla_goblet",
          "hack",
          "zancadas",
          "step_up"
        ],
        "cb": [
          "sentadilla_caja",
          "sentadilla_trx",
          "zancada_inversa"
        ],
        "ag": [
          "sentadilla_pausa"
        ]
      },
      "CUAD_AISL": {
        "g": [
          "ext_cuadriceps",
          "bulgara",
          "step_up",
          "zancada_lateral"
        ],
        "c": [
          "bulgara",
          "step_up",
          "zancadas",
          "sentadilla_corporal",
          "zancada_lateral",
          "sentadilla_pared"
        ],
        "b": [
          "sentadilla_pared",
          "ext_cuadriceps",
          "step_up",
          "zancadas"
        ],
        "cb": [
          "sentadilla_pared"
        ]
      },
      "FEMORAL_COMP": {
        "g": [
          "pmr_barra",
          "trap_bar",
          "pmr_manc",
          "hiperextension",
          "peso_muerto"
        ],
        "c": [
          "pmr_manc",
          "pmr_kb"
        ],
        "b": [
          "pmr_manc",
          "trap_bar",
          "hiperextension"
        ],
        "cb": [
          "pmr_kb",
          "pmr_banda"
        ],
        "ag": [
          "pmr_unilateral",
          "buenos_dias"
        ],
        "ac": [
          "pmr_unilateral"
        ]
      },
      "FEMORAL_AISL": {
        "g": [
          "curl_femoral_sentado",
          "curl_femoral_tumbado"
        ],
        "c": [
          "curl_femoral_toalla",
          "curl_femoral_banda"
        ],
        "b": [
          "curl_femoral_sentado",
          "curl_femoral_tumbado"
        ],
        "cb": [
          "curl_femoral_banda"
        ],
        "ag": [
          "curl_femoral_nordico"
        ],
        "ac": [
          "curl_femoral_nordico"
        ]
      },
      "GLUTEO_COMP": {
        "g": [
          "hip_thrust",
          "sentadilla_sumo",
          "puente_gluteo",
          "hip_thrust_maq",
          "swing_kb"
        ],
        "c": [
          "puente_gluteo",
          "hip_thrust",
          "sentadilla_sumo",
          "swing_kb",
          "hip_thrust_banda"
        ],
        "b": [
          "hip_thrust_maq",
          "hip_thrust",
          "sentadilla_sumo",
          "puente_gluteo"
        ],
        "cb": [
          "hip_thrust_banda",
          "puente_gluteo_2p"
        ],
        "ag": [
          "hip_thrust_pausa"
        ],
        "ac": [
          "hip_thrust_pausa"
        ]
      },
      "GLUTEO": {
        "g": [
          "patada_polea",
          "abduccion_maq",
          "puente_gluteo",
          "patada_gluteo_maq"
        ],
        "c": [
          "puente_gluteo",
          "hip_thrust",
          "sentadilla_sumo",
          "patada_banda",
          "abduccion_banda",
          "paso_lateral_banda"
        ],
        "b": [
          "paso_lateral_banda",
          "patada_gluteo_maq",
          "abduccion_maq",
          "patada_polea",
          "puente_gluteo"
        ],
        "cb": [
          "patada_banda",
          "abduccion_banda",
          "paso_lateral_banda"
        ]
      },
      "GEMELO": {
        "g": [
          "gemelo_pie",
          "gemelo_sentado",
          "gemelo_prensa"
        ],
        "c": [
          "gemelo_pie",
          "gemelo_unilateral"
        ],
        "b": [
          "gemelo_prensa",
          "gemelo_sentado",
          "gemelo_pie"
        ],
        "cb": [
          "gemelo_unilateral"
        ],
        "ag": [
          "gemelo_unilateral"
        ]
      },
      "CORE": {
        "g": [
          "plancha",
          "crunch_polea",
          "elev_rodillas_colgado",
          "pallof",
          "plancha_lateral",
          "elev_piernas",
          "rueda_abdominal",
          "crunch",
          "farmer",
          "plancha_hombros"
        ],
        "c": [
          "plancha",
          "dead_bug",
          "crunch_inverso",
          "plancha_lateral",
          "elev_piernas",
          "rueda_abdominal",
          "crunch",
          "farmer",
          "plancha_hombros",
          "bird_dog",
          "pallof_banda"
        ],
        "b": [
          "crunch",
          "bird_dog",
          "plancha",
          "dead_bug",
          "pallof",
          "crunch_polea",
          "plancha_lateral"
        ],
        "cb": [
          "crunch",
          "bird_dog",
          "pallof_banda"
        ],
        "ag": [
          "elev_piernas_colgado",
          "hollow"
        ],
        "ac": [
          "elev_piernas_colgado",
          "hollow"
        ]
      }
    },
    "PLANTILLAS": {
      "FULL": [
        [
          [
            "CUAD_COMP",
            "P"
          ],
          [
            "PECHO_COMP",
            "S"
          ],
          [
            "ESPALDA_HOR",
            "S"
          ],
          [
            "GLUTEO_COMP",
            "A"
          ],
          [
            "HOMBRO_LAT",
            "A",
            "o"
          ],
          [
            "BICEPS",
            "A"
          ],
          [
            "CORE",
            "C"
          ]
        ],
        [
          [
            "FEMORAL_COMP",
            "P"
          ],
          [
            "ESPALDA_VERT",
            "S"
          ],
          [
            "HOMBRO_COMP",
            "S"
          ],
          [
            "PECHO_INC",
            "A"
          ],
          [
            "CUAD_AISL",
            "A",
            "o"
          ],
          [
            "TRICEPS_AISL",
            "A"
          ],
          [
            "CORE",
            "C"
          ]
        ],
        [
          [
            "CUAD_COMP",
            "P"
          ],
          [
            "PECHO_COMP",
            "S"
          ],
          [
            "ESPALDA_HOR",
            "S"
          ],
          [
            "FEMORAL_AISL",
            "A"
          ],
          [
            "GLUTEO",
            "A"
          ],
          [
            "HOMBRO_LAT",
            "A"
          ],
          [
            "GEMELO",
            "A",
            "o"
          ]
        ]
      ],
      "FULL2": [
        [
          [
            "CUAD_COMP",
            "P"
          ],
          [
            "PECHO_COMP",
            "S"
          ],
          [
            "ESPALDA_HOR",
            "S"
          ],
          [
            "GLUTEO_COMP",
            "A"
          ],
          [
            "FEMORAL_AISL",
            "A"
          ],
          [
            "HOMBRO_LAT",
            "A",
            "o"
          ],
          [
            "BICEPS",
            "A"
          ],
          [
            "CORE",
            "C"
          ]
        ],
        [
          [
            "FEMORAL_COMP",
            "P"
          ],
          [
            "ESPALDA_VERT",
            "S"
          ],
          [
            "PECHO_INC",
            "S"
          ],
          [
            "CUAD_AISL",
            "A"
          ],
          [
            "GLUTEO",
            "A"
          ],
          [
            "TRICEPS_AISL",
            "A"
          ],
          [
            "GEMELO",
            "A",
            "o"
          ]
        ]
      ],
      "PUSH": [
        [
          [
            "PECHO_COMP",
            "P"
          ],
          [
            "HOMBRO_COMP",
            "S"
          ],
          [
            "PECHO_INC",
            "S"
          ],
          [
            "HOMBRO_LAT",
            "A"
          ],
          [
            "TRICEPS_AISL",
            "A"
          ],
          [
            "TRICEPS_COMP",
            "A"
          ]
        ],
        [
          [
            "HOMBRO_COMP",
            "P"
          ],
          [
            "PECHO_INC",
            "S"
          ],
          [
            "PECHO_COMP",
            "S"
          ],
          [
            "PECHO_AISL",
            "A"
          ],
          [
            "HOMBRO_LAT",
            "A"
          ],
          [
            "TRICEPS_AISL",
            "A"
          ]
        ]
      ],
      "PULL": [
        [
          [
            "ESPALDA_VERT",
            "P"
          ],
          [
            "ESPALDA_HOR",
            "S"
          ],
          [
            "ESPALDA_AISL",
            "A"
          ],
          [
            "HOMBRO_POST",
            "A"
          ],
          [
            "BICEPS",
            "A"
          ],
          [
            "CORE",
            "C"
          ]
        ],
        [
          [
            "ESPALDA_HOR",
            "P"
          ],
          [
            "ESPALDA_VERT",
            "S"
          ],
          [
            "ESPALDA_AISL",
            "A"
          ],
          [
            "HOMBRO_POST",
            "A"
          ],
          [
            "BICEPS",
            "A"
          ],
          [
            "CORE",
            "C"
          ]
        ]
      ],
      "LEGS": [
        [
          [
            "CUAD_COMP",
            "P"
          ],
          [
            "FEMORAL_COMP",
            "S"
          ],
          [
            "GLUTEO_COMP",
            "A"
          ],
          [
            "CUAD_AISL",
            "A"
          ],
          [
            "FEMORAL_AISL",
            "A"
          ],
          [
            "GEMELO",
            "A",
            "o"
          ],
          [
            "CORE",
            "C"
          ]
        ],
        [
          [
            "FEMORAL_COMP",
            "P"
          ],
          [
            "CUAD_COMP",
            "S"
          ],
          [
            "GLUTEO_COMP",
            "A"
          ],
          [
            "FEMORAL_AISL",
            "A"
          ],
          [
            "GLUTEO",
            "A"
          ],
          [
            "GEMELO",
            "A",
            "o"
          ],
          [
            "CORE",
            "C"
          ]
        ]
      ],
      "UPPER": [
        [
          [
            "PECHO_COMP",
            "P"
          ],
          [
            "ESPALDA_HOR",
            "S"
          ],
          [
            "HOMBRO_COMP",
            "S"
          ],
          [
            "ESPALDA_VERT",
            "S"
          ],
          [
            "PECHO_INC",
            "A"
          ],
          [
            "BICEPS",
            "A"
          ],
          [
            "TRICEPS_AISL",
            "A"
          ]
        ],
        [
          [
            "ESPALDA_VERT",
            "P"
          ],
          [
            "PECHO_INC",
            "S"
          ],
          [
            "ESPALDA_HOR",
            "S"
          ],
          [
            "HOMBRO_LAT",
            "A"
          ],
          [
            "PECHO_AISL",
            "A"
          ],
          [
            "TRICEPS_COMP",
            "A"
          ],
          [
            "BICEPS",
            "A"
          ]
        ]
      ]
    },
    "NOMBRES": {
      "CUERPO COMPLETO A": {
        "p": "FULL"
      },
      "CUERPO COMPLETO B": {
        "p": "FULL"
      },
      "CUERPO COMPLETO C": {
        "p": "FULL"
      },
      "EMPUJE": {
        "p": "PUSH"
      },
      "EMPUJE A": {
        "p": "PUSH"
      },
      "EMPUJE B": {
        "p": "PUSH"
      },
      "TIRÓN": {
        "p": "PULL"
      },
      "TIRÓN A": {
        "p": "PULL"
      },
      "TIRÓN B": {
        "p": "PULL"
      },
      "PIERNA": {
        "p": "LEGS"
      },
      "PIERNA A": {
        "p": "LEGS"
      },
      "PIERNA B": {
        "p": "LEGS"
      },
      "TORSO": {
        "p": "UPPER"
      },
      "TORSO A": {
        "p": "UPPER"
      },
      "TORSO B": {
        "p": "UPPER"
      }
    },
    "MUSCULOS": {
      "FULL": "todo el cuerpo",
      "PUSH": "pecho, hombro y tríceps",
      "PULL": "espalda, bíceps y hombro posterior",
      "LEGS": "cuádriceps, femoral, glúteo y gemelo",
      "UPPER": "pecho, espalda, hombro y brazos",
      "FULL2": "todo el cuerpo"
    },
    "OBJETIVOS": {
      "hipertrofia": {
        "n": "Hipertrofia",
        "why": "Series de 6-15 repeticiones cerca del fallo para estimular el crecimiento muscular."
      },
      "fuerza": {
        "n": "Fuerza",
        "why": "Pocas repeticiones con cargas altas y descansos largos para ganar fuerza máxima."
      },
      "definicion": {
        "n": "Definición",
        "why": "Más repeticiones y descansos cortos para mantener el músculo y gastar más energía."
      },
      "salud": {
        "n": "Salud general",
        "why": "Trabajo completo y moderado para ganar fuerza, proteger las articulaciones y mantener el hábito."
      }
    },
    "NIVELES": {
      "principiante": "Principiante",
      "intermedio": "Intermedio",
      "avanzado": "Avanzado"
    },
    "SEMANA": [
      "Semana 1 del bloque: RIR {rir} (te quedarían {rir} repeticiones antes del fallo). Afina la técnica y anota los pesos para superarlos después.",
      "Semana 2 del bloque: RIR {rir}. Si llegaste al tope de repeticiones en todas las series con buena técnica, sube el peso un 2-5%.",
      "Semana 3 del bloque: RIR {rir}, la más exigente del bloque. Intenta superar tus marcas con buena técnica.",
      "Semana 4 del bloque: descarga. Menos series y RIR 4 para recuperar y empezar el siguiente bloque más fuerte."
    ],
    "TXT": {
      "calentamiento": {
        "t": "Calentamiento",
        "a": "8 min: 5 min de cardio suave (bici, cinta o comba) y 2-3 series de aproximación del primer ejercicio (≈50%, 70% y 85% del peso de trabajo).",
        "p": "Sube la temperatura muscular, activa las articulaciones y mejora el rendimiento de tus primeras series de trabajo."
      },
      "estiramientos": {
        "t": "Estiramientos y vuelta a la calma",
        "a": "5 min: estira suavemente los músculos trabajados (20-30 s por postura) y respira hondo.",
        "p": "Ayuda a bajar las pulsaciones y a recuperar el rango de movimiento."
      },
      "cardio": {
        "t": "Cardio final",
        "a": "10 min de cardio suave en cinta, bici o elíptica a un ritmo en el que puedas hablar.",
        "p": "Suma gasto energético sin restar recuperación para el siguiente entrenamiento."
      }
    },
    "SERIES": {
      "hipertrofia": {
        "P": 4,
        "S": 3,
        "A": 3,
        "C": 3
      },
      "fuerza": {
        "P": 5,
        "S": 3,
        "A": 3,
        "C": 3
      },
      "definicion": {
        "P": 3,
        "S": 3,
        "A": 3,
        "C": 3
      },
      "salud": {
        "P": 3,
        "S": 2,
        "A": 2,
        "C": 2
      }
    },
    "REPS": {
      "hipertrofia": [
        {
          "P": "6-8",
          "S": "8-10",
          "A": "10-15",
          "C": "12-15"
        },
        {
          "P": "8-10",
          "S": "10-12",
          "A": "12-20",
          "C": "15-20"
        },
        {
          "P": "5-7",
          "S": "6-10",
          "A": "8-12",
          "C": "10-15"
        }
      ],
      "fuerza": [
        {
          "P": "4-6",
          "S": "6-8",
          "A": "8-12",
          "C": "10-15"
        },
        {
          "P": "3-5",
          "S": "5-8",
          "A": "8-10",
          "C": "10-15"
        },
        {
          "P": "2-4",
          "S": "4-6",
          "A": "6-10",
          "C": "8-12"
        }
      ],
      "definicion": [
        {
          "P": "10-12",
          "S": "10-12",
          "A": "12-15",
          "C": "15-20"
        },
        {
          "P": "8-10",
          "S": "10-12",
          "A": "12-20",
          "C": "15-20"
        },
        {
          "P": "12-15",
          "S": "12-15",
          "A": "15-20",
          "C": "15-20"
        }
      ],
      "salud": [
        {
          "P": "8-12",
          "S": "10-12",
          "A": "10-12",
          "C": "12-15"
        },
        {
          "P": "10-12",
          "S": "10-15",
          "A": "12-15",
          "C": "12-15"
        }
      ]
    },
    "REPS_PRINCIPIANTE": {
      "hipertrofia": [
        {
          "P": "8-12",
          "S": "8-12",
          "A": "10-15",
          "C": "12-15"
        },
        {
          "P": "8-10",
          "S": "10-12",
          "A": "12-15",
          "C": "12-15"
        }
      ],
      "fuerza": [
        {
          "P": "6-8",
          "S": "8-10",
          "A": "8-12",
          "C": "10-15"
        },
        {
          "P": "5-7",
          "S": "6-10",
          "A": "8-12",
          "C": "10-15"
        }
      ],
      "definicion": [
        {
          "P": "10-12",
          "S": "12-15",
          "A": "12-15",
          "C": "15-20"
        }
      ],
      "salud": [
        {
          "P": "10-12",
          "S": "10-12",
          "A": "12-15",
          "C": "12-15"
        }
      ]
    },
    "SEGUNDOS": {
      "hipertrofia": "30-45",
      "fuerza": "20-40",
      "definicion": "40-60",
      "salud": "30-40"
    },
    "DESCANSO": {
      "hipertrofia": {
        "P": "2-3 min",
        "S": "2 min",
        "A": "90 s",
        "C": "60 s"
      },
      "fuerza": {
        "P": "3-4 min",
        "S": "2-3 min",
        "A": "90 s",
        "C": "60 s"
      },
      "definicion": {
        "P": "90 s",
        "S": "60 s",
        "A": "45 s",
        "C": "45 s"
      },
      "salud": {
        "P": "90 s",
        "S": "90 s",
        "A": "60 s",
        "C": "45 s"
      }
    },
    "RIR": {
      "principiante": {
        "normal": [
          "4",
          "3",
          "2-3",
          "4"
        ],
        "suave": [
          "4",
          "4",
          "3",
          "4"
        ]
      },
      "intermedio": {
        "normal": [
          "3",
          "2",
          "1-2",
          "4"
        ],
        "suave": [
          "4",
          "3",
          "2-3",
          "4"
        ]
      },
      "avanzado": {
        "normal": [
          "2",
          "1-2",
          "1",
          "4"
        ],
        "suave": [
          "3",
          "2",
          "1-2",
          "4"
        ]
      }
    },
    "EXTRA_AVANZADO": {
      "FULL": [
        [
          "TRICEPS_AISL",
          "A"
        ],
        [
          "HOMBRO_POST",
          "A"
        ],
        [
          "HOMBRO_POST",
          "A"
        ]
      ],
      "FULL2": [
        [
          "TRICEPS_AISL",
          "A"
        ],
        [
          "BICEPS",
          "A"
        ]
      ],
      "UPPER": [
        [
          "HOMBRO_POST",
          "A"
        ],
        [
          "HOMBRO_POST",
          "A"
        ]
      ],
      "LEGS": [
        [
          "GLUTEO",
          "A"
        ],
        [
          "CUAD_AISL",
          "A"
        ]
      ]
    },
    "NOTA_ADAPTACION": " Estas dos primeras semanas son de adaptación: llevan menos series para que tu cuerpo se acostumbre.",
    "TECNICAS": [
      "última serie: descendente (baja el peso un 20% y sigue hasta casi el fallo)",
      "última serie: rest-pause (al llegar al fallo, descansa 15 s y haz unas repeticiones más)"
    ]
  },

  // Qué sesión toca cada día de entreno de la semana, según los días elegidos.
  _gymReparto(numDias, nivel) {
    const f = (n, v) => ({ nombre: n, plantilla: this.GYM.NOMBRES[n].p, variante: v });
    // Principiante con 5-6 días: en vez de empuje/tirón/pierna (frecuencia alta y sesiones muy centradas) se alternan torso y pierna con cuerpo completo
    // entre medias, que es más suave para empezar y deja más margen de recuperación.
    if (nivel === 'principiante' && numDias === 5) return [f('TORSO A', 0), f('PIERNA A', 0), f('CUERPO COMPLETO C', 2), f('TORSO B', 1), f('PIERNA B', 1)];
    if (nivel === 'principiante' && numDias === 6) return [f('TORSO A', 0), f('PIERNA A', 0), f('CUERPO COMPLETO A', 0), f('TORSO B', 1), f('PIERNA B', 1), f('CUERPO COMPLETO B', 1)];
    if (numDias === 2) return [{ nombre: 'CUERPO COMPLETO A', plantilla: 'FULL2', variante: 0 }, { nombre: 'CUERPO COMPLETO B', plantilla: 'FULL2', variante: 1 }];
    if (numDias === 3) return [f('CUERPO COMPLETO A', 0), f('CUERPO COMPLETO B', 1), f('CUERPO COMPLETO C', 2)];
    if (numDias === 4) return [f('TORSO A', 0), f('PIERNA A', 0), f('TORSO B', 1), f('PIERNA B', 1)];
    if (numDias === 5) return [f('EMPUJE', 0), f('TIRÓN', 0), f('PIERNA A', 0), f('TORSO', 0), f('PIERNA B', 1)];
    return [f('EMPUJE A', 0), f('TIRÓN A', 0), f('PIERNA A', 0), f('EMPUJE B', 1), f('TIRÓN B', 1), f('PIERNA B', 1)];
  },

  // Segundos a partir de "90 s" / "2 min" / "2-3 min" (punto medio del rango); punto medio de "6-8" / "30-45".
  _gymSegundos(txt) {
    const nums = (String(txt).match(/[\d.]+/g) || []).map(Number);
    const n = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 60;
    return /min/.test(txt) ? n * 60 : n;
  },
  _gymMedio(rango) { const p = String(rango).split('-').map(Number); return p.length === 2 ? (p[0] + p[1]) / 2 : p[0]; },

  // ---- Fórmulas compartidas con el generador de sesiones (SessionInvites) ----
  // Tiempo estimado (min) de un bloque de ejercicio: series × (trabajo + descanso) + 30 s de cambio de ejercicio.
  // ej = { series, reps: '6-8', unidad: 'repeticiones'|'segundos', descanso: '2 min' }
  fuerzaMinutosBloque(ej) {
    const series = Math.max(1, parseInt(ej.series, 10) || 1);
    const nums = (String(ej.reps || '10').match(/\d+/g) || ['10']).map(Number);
    const medio = nums.reduce((a, b) => a + b, 0) / nums.length;
    const trabajo = ej.unidad === 'segundos' ? medio : medio * 3; // ~3 s por repetición
    return Math.max(1, Math.ceil((series * (trabajo + this._gymSegundos(ej.descanso || '60 s')) + 30) / 60));
  },
  // RPE (0-10) a partir de las repeticiones en reserva: RPE = 10 - RIR ("1-2" → 8,5).
  fuerzaRpeDeRir(rir) {
    const nums = (String(rir == null ? '' : rir).match(/[\d.]+/g) || []).map(Number);
    return nums.length ? 10 - nums.reduce((a, b) => a + b, 0) / nums.length : null;
  },
  // RPE de sesión (Session-RPE, Foster) = media del RPE de cada bloque ponderada por su tiempo:
  // ejercicios con RIR → 10 - RIR; sin RIR (core) 6; calentamiento 3; estiramientos 2; cardio suave 5.
  // Devuelve null si la sesión no tiene ejercicios estructurados (entonces se mantiene el RPE 6 por defecto).
  fuerzaRpeSesion(pasos) {
    if (!Array.isArray(pasos) || !pasos.some(p => p && p.ejercicio)) return null;
    let suma = 0, total = 0;
    pasos.forEach(p => {
      const min = p.duracionMin || 0;
      if (!(min > 0)) return;
      const tit = String(p.titulo || '').toUpperCase();
      let rpe = 6;
      if (p.ejercicio) { const r = this.fuerzaRpeDeRir(p.ejercicio.rir); rpe = r == null ? 6 : r; }
      else if (/CALENT|PREPARACI|ACTIVACI/.test(tit)) rpe = 3;
      else if (/ESTIRAMIENT|ENFRIAMIENT|VUELTA A LA CALMA/.test(tit)) rpe = 2;
      else if (/CARDIO/.test(tit)) rpe = 5;
      suma += min * rpe; total += min;
    });
    return total > 0 ? Math.max(3, Math.min(9.5, suma / total)) : null;
  },

  // Zona en la que se trota el descanso de una serie creada en el generador de sesiones (seriesConfig.descansoZona):
  // 'Z1'…'Z6' = esa zona; '' (parado) o sin dato (sesiones antiguas y planes automáticos) = 'Z2', como se asumía hasta ahora.
  _zonaDescansoSeries(det) {
    const sc = det && det.seriesConfig;
    return (sc && sc.descansoZona) ? sc.descansoZona : 'Z2';
  },

  // ==================== PESOS DE FUERZA ====================
  // El usuario apunta el peso (kg) que usa en cada ejercicio desde el detalle de la sesión. Se guarda por ejercicio
  // (id de la biblioteca o, si es propio, su nombre), con las últimas 12 anotaciones. Se guarda siempre en el dispositivo
  // (localStorage, por usuario) y, además, en Firestore: users/{uid}/cargas/fuerza (con el plan actual como respaldo si las reglas aún no lo permiten).
  // Sugerencia: si las dos últimas anotaciones fueron con el mismo peso, se propone probar +2,5 kg (progresión doble).
  _cargaClave(paso) {
    const e = paso && paso.ejercicio;
    if (!e) return null;
    if (e.id) return String(e.id);
    return this._propiosClave(paso.titulo);
  },
  _cargaStoreKey() { return 'ri5_cargas_' + (AppState.currentUserId || 'anon'); },
  _cargasLeer() {
    try { const o = JSON.parse(localStorage.getItem(this._cargaStoreKey()) || '{}'); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
  },
  _cargasEscribir(obj) { try { localStorage.setItem(this._cargaStoreKey(), JSON.stringify(obj)); } catch (e) {} },
  _cargaFormato(n) { return String(Math.round(n * 100) / 100).replace('.', ','); },
  // Mezcla cargas de otro origen (Firestore u otro dispositivo) con las locales: gana la anotación más reciente de cada ejercicio.
  _cargasMezclar(remotas) {
    if (!remotas || typeof remotas !== 'object') return;
    const loc = this._cargasLeer();
    let cambio = false;
    Object.keys(remotas).forEach(k => {
      const r = remotas[k];
      if (!r || !(r.kg > 0)) return;
      if (!loc[k] || String(r.fecha || '') > String(loc[k].fecha || '')) { loc[k] = r; cambio = true; }
    });
    if (cambio) this._cargasEscribir(loc);
  },
  // Se llama al cargar un plan: mezcla las cargas que traiga el propio plan (respaldo) y sincroniza con users/{uid}/cargas.
  _cargasFusionar(remotas, propiosRemotos) {
    this._cargasMezclar(remotas);
    this._propiosMezclar(propiosRemotos);
    this._cargasSincronizar();
  },
  _cargasRef() {
    return firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('cargas').doc('fuerza');
  },
  // Guarda en users/{uid}/cargas/fuerza (un solo documento con todos los ejercicios: sobrevive a los cambios de plan y de dispositivo).
  // Si las reglas aún no incluyen «cargas», usa el plan actual como respaldo; y si tampoco, se quedan en este dispositivo.
  async _cargasSubir(cambios) {
    if (!AppState.currentUserId || !cambios || !Object.keys(cambios).length) return;
    try { await this._cargasRef().set(cambios, { merge: true }); return; }
    catch (err) { console.warn('Pesos: no se pudo guardar en users/{uid}/cargas (¿está desplegado reglas.js?); se usa el plan como respaldo:', err); }
    if (!AppState.planActualId) return;
    try {
      const upd = {};
      Object.keys(cambios).forEach(k => { upd[`cargas.${k}`] = cambios[k]; });
      await firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('planes').doc(AppState.planActualId).update(upd);
    } catch (err2) { console.warn('Pesos: tampoco se pudo guardar en el plan; se mantienen en este dispositivo:', err2); }
  },
  // Una vez por sesión y usuario: baja los pesos guardados, los mezcla y sube lo que solo existía en este dispositivo.
  async _cargasSincronizar() {
    const uid = AppState.currentUserId;
    if (!uid || this._cargasSyncUid === uid) return;
    this._cargasSyncUid = uid;
    try {
      const snap = await this._cargasRef().get();
      const remotas = snap.exists ? (snap.data() || {}) : {};
      this._cargasMezclar(remotas);
      const loc = this._cargasLeer();
      const subir = {};
      Object.keys(loc).forEach(k => {
        const r = remotas[k];
        if (!r || String(loc[k].fecha || '') > String(r.fecha || '')) subir[k] = loc[k];
      });
      await this._cargasSubir(subir);
      // Ejercicios propios (documento «propios»): se mezclan por fecha de modificación y se sube lo que solo estaba aquí.
      const snapP = await firebaseServices.db.collection('users').doc(uid).collection('cargas').doc('propios').get();
      const remP = snapP.exists ? (snapP.data() || {}) : {};
      this._propiosMezclar(remP);
      const locP = this._propiosLeer();
      const subirP = {};
      Object.keys(locP).forEach(k => {
        const r = remP[k];
        if (!r || String(locP[k].m || '') > String(r.m || '')) subirP[k] = locP[k];
      });
      await this._propiosSubir(subirP);
    } catch (err) {
      this._cargasSyncUid = null;   // se reintenta en la próxima carga de plan
      console.warn('Pesos y ejercicios propios: no se pudo sincronizar (se usan los de este dispositivo):', err);
    }
  },
  _htmlCargaPaso(paso) {
    const e = paso && paso.ejercicio;
    if (!e || e.unidad === 'segundos') return '';
    const clave = this._cargaClave(paso);
    if (!clave) return '';
    const reg = this._cargasLeer()[clave];
    const ult = reg && reg.kg > 0 ? reg.kg : null;
    const h = reg && Array.isArray(reg.hist) ? reg.hist : [];
    const sugerir = ult && h.length >= 2 && h[h.length - 1].kg === h[h.length - 2].kg && h[h.length - 1].f !== h[h.length - 2].f;
    const hint = ult
      ? (sugerir ? `Último: ${this._cargaFormato(ult)} kg · prueba ${this._cargaFormato(ult + 2.5)} kg` : `Último: ${this._cargaFormato(ult)} kg`)
      : 'Apunta el peso que uses';
    return `
              <div class="paso-carga" style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:8px; padding:8px 10px; border:1px solid var(--border-color); border-radius:14px;">
                <span style="flex:1; min-width:0; font-size:11px; color:var(--text-secondary); line-height:1.3;">${Utils.escapeHTML(hint)}</span>
                <input type="text" inputmode="decimal" class="carga-input" data-clave="${Utils.escapeHTML(clave)}" placeholder="${ult ? this._cargaFormato(ult) : 'kg'}" onchange="PlanGenerator.guardarCarga(this)" style="width:76px; height:40px; margin:0; padding:0 6px; text-align:center; font-size:14px;">
                <span class="carga-ok" style="width:14px; text-align:center; color:var(--gold); font-size:14px;"></span>
              </div>`;
  },
  // ==================== EJERCICIOS PROPIOS (biblioteca personal) ====================
  // Cada usuario puede guardar sus propios ejercicios de fuerza con su grupo muscular y su tipo (Principal = compuesto, Accesorio).
  // Solo los ve y usa él: se guardan en el dispositivo (localStorage por usuario) y en Firestore en users/{uid}/cargas/propios
  // (el plan actual sirve de respaldo si las reglas aún no lo permiten). Aparecen en la biblioteca de sesiones y el generador
  // automático los incluye en la rotación de su grupo. La clave es la misma que usan los pesos (x_nombre), así que su peso se recuerda.
  _PROPIOS_GRUPO: {
    PECHO:   { P: 'PECHO_COMP',   A: 'PECHO_AISL' },
    ESPALDA: { P: 'ESPALDA_HOR',  A: 'ESPALDA_AISL' },
    HOMBRO:  { P: 'HOMBRO_COMP',  A: 'HOMBRO_LAT' },
    BICEPS:  { P: 'BICEPS',       A: 'BICEPS' },
    TRICEPS: { P: 'TRICEPS_COMP', A: 'TRICEPS_AISL' },
    CUAD:    { P: 'CUAD_COMP',    A: 'CUAD_AISL' },
    FEMORAL: { P: 'FEMORAL_COMP', A: 'FEMORAL_AISL' },
    GLUTEO:  { P: 'GLUTEO_COMP',  A: 'GLUTEO' },
    GEMELO:  { P: 'GEMELO',       A: 'GEMELO' },
    CORE:    { P: 'CORE',         A: 'CORE' }
  },
  _propiosClave(nombre) {
    const t = String(nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    return t ? 'x_' + t : null;
  },
  _propiosStoreKey() { return 'ri5_propios_' + (AppState.currentUserId || 'anon'); },
  _propiosLeer() {
    try { const o = JSON.parse(localStorage.getItem(this._propiosStoreKey()) || '{}'); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
  },
  _propiosEscribir(obj) { try { localStorage.setItem(this._propiosStoreKey(), JSON.stringify(obj)); } catch (e) {} },
  // Ejercicios propios vigentes (los borrados quedan marcados con d:1 para que el borrado también viaje entre dispositivos).
  _propiosActivos() {
    const o = this._propiosLeer();
    return Object.keys(o)
      .filter(k => o[k] && o[k].d !== 1 && o[k].n && this._PROPIOS_GRUPO[o[k].g])
      .map(k => ({ k, n: o[k].n, g: o[k].g, t: o[k].t === 'P' ? 'P' : 'A' }))
      .sort((a, b) => a.n.localeCompare(b.n, 'es'));
  },
  // Los propios que le tocan a un grupo del generador (p. ej. «HOMBRO_LAT»), según su grupo y tipo.
  _propiosParaGrupo(grupoKey) {
    return this._propiosActivos().filter(p => this._PROPIOS_GRUPO[p.g][p.t] === grupoKey);
  },
  // Guarda (o actualiza) un ejercicio propio y devuelve su clave; null si el nombre o el grupo no son válidos.
  _propiosGuardar(nombre, grupo, tipo) {
    const n = String(nombre || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const k = this._propiosClave(n);
    if (!k || !this._PROPIOS_GRUPO[grupo]) return null;
    const nom = n.charAt(0).toUpperCase() + n.slice(1);
    const reg = { n: nom, g: grupo, t: tipo === 'P' ? 'P' : 'A', m: new Date().toISOString() };
    const todos = this._propiosLeer();
    todos[k] = reg;
    this._propiosEscribir(todos);
    this._propiosSubir({ [k]: reg });
    return k;
  },
  _propiosBorrar(k) {
    const todos = this._propiosLeer();
    if (!todos[k]) return;
    todos[k] = Object.assign({}, todos[k], { d: 1, m: new Date().toISOString() });
    this._propiosEscribir(todos);
    this._propiosSubir({ [k]: todos[k] });
  },
  _propiosMezclar(remotos) {
    if (!remotos || typeof remotos !== 'object') return;
    const loc = this._propiosLeer();
    let cambio = false;
    Object.keys(remotos).forEach(k => {
      const r = remotos[k];
      if (!r || typeof r !== 'object' || !r.n) return;
      if (!loc[k] || String(r.m || '') > String(loc[k].m || '')) { loc[k] = r; cambio = true; }
    });
    if (cambio) this._propiosEscribir(loc);
  },
  async _propiosSubir(cambios) {
    if (!AppState.currentUserId || !cambios || !Object.keys(cambios).length) return;
    const ref = firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('cargas').doc('propios');
    try { await ref.set(cambios, { merge: true }); return; }
    catch (err) { console.warn('Ejercicios propios: no se pudo guardar en users/{uid}/cargas/propios (¿está desplegado reglas.js?); se usa el plan como respaldo:', err); }
    if (!AppState.planActualId) return;
    try {
      const upd = {};
      Object.keys(cambios).forEach(k => { upd[`propios.${k}`] = cambios[k]; });
      await firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('planes').doc(AppState.planActualId).update(upd);
    } catch (err2) { console.warn('Ejercicios propios: tampoco se pudo guardar en el plan; se mantienen en este dispositivo:', err2); }
  },

  guardarCarga(input) {
    const clave = input && input.dataset ? input.dataset.clave : null;
    if (!clave) return;
    const ok = input.parentElement ? input.parentElement.querySelector('.carga-ok') : null;
    // Solo números positivos (admite coma, punto y un «kg» al final); cualquier otra cosa se descarta. Pasos de 0,25 kg.
    const txt = String(input.value || '').trim().replace(/\s*kg$/i, '').replace(',', '.');
    const kg = /^\d+(\.\d+)?$/.test(txt) ? Math.round(parseFloat(txt) * 4) / 4 : NaN;
    if (!(kg > 0) || kg > 1000) { input.value = ''; if (ok) ok.textContent = ''; return; }
    const d = new Date();
    const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todas = this._cargasLeer();
    const reg = todas[clave] || { kg: 0, fecha: '', hist: [] };
    reg.hist = Array.isArray(reg.hist) ? reg.hist : [];
    const ult = reg.hist[reg.hist.length - 1];
    if (ult && ult.f === f) ult.kg = kg; else reg.hist.push({ f, kg });   // el mismo día se corrige, no se duplica
    reg.hist = reg.hist.slice(-12);
    reg.kg = kg; reg.fecha = f;
    todas[clave] = reg;
    this._cargasEscribir(todas);
    input.value = this._cargaFormato(kg);
    if (ok) ok.textContent = '✓';
    this._cargasSubir({ [clave]: reg });
  },

  _gymConstruirSesion(def, semanaIdx, cfg) {
    const G = this.GYM;
    const bloque = Math.floor(semanaIdx / 4);
    const w = (semanaIdx % 4) + 1; // semana dentro del bloque (4 = descarga)
    const fuerza = cfg.objetivo === 'fuerza';
    const principiante = cfg.nivel === 'principiante';
    const avanzado = cfg.nivel === 'avanzado';
    const rampa = principiante && semanaIdx < 2; // 2 primeras semanas: adaptación anatómica, menos series
    const esquemas = (principiante ? G.REPS_PRINCIPIANTE : G.REPS)[cfg.objetivo];
    // Avanzado: ondulante dentro de la semana. La 2.ª sesión de cada tipo (variante 1) usa el esquema de repeticiones siguiente, así una es más pesada y la
    // otra de más volumen. Principiante e intermedio mantienen el mismo esquema toda la semana.
    const esquema = esquemas[(bloque + (avanzado && def.variante === 1 ? 1 : 0)) % esquemas.length];
    const factorVolumen = cfg.factorVolumen || 1;
    const variantes = G.PLANTILLAS[def.plantilla];
    const slots = variantes[Math.min(def.variante, variantes.length - 1)].slice();
    // Principiante: una sesión algo más corta (se quita el último accesorio, el de menor prioridad)
    // Cada plantilla marca con 'o' el accesorio que menos falta hace al principiante (así conserva bíceps, tríceps y glúteo en la semana);
    // si no hay ninguno marcado, se quita el último accesorio, como siempre.
    if (principiante && slots.length >= 6) {
      let ult = -1;
      slots.forEach((s, k) => { if (s[2] === 'o') ult = k; });
      if (ult < 0) slots.forEach((s, k) => { if (s[1] === 'A') ult = k; });
      if (ult >= 0) slots.splice(ult, 1);
    }

    // Avanzado con 4 días o menos: cada músculo se entrena menos veces por semana, así que se compensa con un accesorio extra por sesión (antes del core).
    if (avanzado && cfg.numDias <= 4) {
      const extras = G.EXTRA_AVANZADO[def.plantilla];
      if (extras && extras.length) {
        const extra = extras[Math.min(def.variante, extras.length - 1)];
        const pos = (slots.length && slots[slots.length - 1][1] === 'C') ? slots.length - 1 : slots.length;
        slots.splice(pos, 0, extra.slice());
      }
    }

    const pasos = [];
    const usados = new Set();
    const tx = G.TXT;
    pasos.push({ icono: '🔥', titulo: tx.calentamiento.t, accion: tx.calentamiento.a, porque: tx.calentamiento.p, duracionMin: 8 });

    const numeros = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    // RIR según nivel: el principiante se acerca menos al fallo y el avanzado más (con 'suavizar' se baja un escalón).
    const tablaRir = G.RIR[cfg.nivel] || G.RIR.intermedio;
    const rir = (cfg.suavizar ? tablaRir.suave : tablaRir.normal)[w - 1];

    slots.forEach(([grupo, tipo], i) => {
      const g = G.GRUPOS[grupo];
      // Lista de ejercicios según material y nivel: el principiante usa máquinas/variantes estables (b) o versiones fáciles en casa (cb); el avanzado suma
      // las variantes más exigentes (ag/ac).
      let base;
      if (cfg.material === 'casa') base = principiante ? (g.cb || g.c) : (avanzado ? g.c.concat(g.ac || []) : g.c);
      else base = principiante ? (g.b || g.g) : (avanzado ? g.g.concat(g.ag || []) : g.g);
      // Ejercicios propios del usuario para este grupo: van delante en la rotación, así que salen en sus planes (solo en los suyos).
      const propios = this._propiosParaGrupo(grupo);
      const cands = propios.length ? propios.map(x => x.k).concat(base) : base;
      // Variedad: accesorios y core rotan cada bloque de 4 semanas; el ejercicio principal cada 2 bloques y el secundario
      // cada bloque (en FUERZA se mantienen para practicar siempre los mismos levantamientos).
      let desplazamiento;
      if (tipo === 'P') desplazamiento = def.variante + (fuerza ? 0 : Math.floor(bloque / 2));
      else if (tipo === 'S') desplazamiento = def.variante + i + (fuerza ? 0 : bloque);
      else desplazamiento = def.variante + bloque + i;
      let id = null;
      for (let k = 0; k < cands.length; k++) {
        const c = cands[(desplazamiento + k) % cands.length];
        if (!usados.has(c)) { id = c; break; }
      }
      if (!id) id = cands[desplazamiento % cands.length];
      usados.add(id);
      const propio = propios.find(x => x.k === id);
      const ej = propio ? { n: propio.n, c: 'Ejercicio de tu biblioteca personal.', seg: false } : G.EJERCICIOS[id];

      let series = G.SERIES[cfg.objetivo][tipo];
      if (principiante && tipo !== 'C') series = Math.max(2, series - 1);
      // Avanzado: +1 serie solo en el principal y no con 6 días (alta frecuencia: ya se acerca al techo de ~20 series/semana por músculo)
      if (cfg.nivel === 'avanzado' && tipo === 'P' && cfg.numDias < 6) series += 1;
      // Semana 3: +1 serie en el principal (y en el secundario si hay pocos días); el avanzado ya suma volumen con el accesorio extra y las técnicas de intensidad
      if (w === 3 && !principiante && (tipo === 'P' || (tipo === 'S' && cfg.numDias < 6 && !avanzado))) series += 1;
      series = Math.max(2, Math.round(series * factorVolumen));
      if (rampa && tipo !== 'C') series = Math.max(2, series - 1);
      if (w === 4) series = Math.max(2, Math.round(series * 0.6));

      const reps = ej.seg ? G.SEGUNDOS[cfg.objetivo] : esquema[tipo];
      const descanso = G.DESCANSO[cfg.objetivo][tipo];
      let accion = `${series} series × ${reps} ${ej.seg ? 'segundos' : 'repeticiones'} · descanso ${descanso}`;
      if (tipo !== 'C') accion += ` · RIR ${rir}`;
      // Avanzado, semana 3 (la más dura), hipertrofia/definición: en un accesorio de cada dos, la última serie lleva una técnica de intensidad.
      if (avanzado && w === 3 && tipo === 'A' && !ej.seg && (cfg.objetivo === 'hipertrofia' || cfg.objetivo === 'definicion') && (i + bloque) % 2 === 0) {
        accion += ` · ${G.TECNICAS[cfg.material === 'casa' ? 1 : ((i + bloque) / 2) % 2]}`;
      }

      // Tiempo estimado de este bloque: series × (trabajo + descanso) + 30 s de cambio de ejercicio/ajuste de máquina.
      // Se guarda en cada bloque (duracionMin) para que al reenviar/editar la sesión cada bloque lleve su tiempo.
      const estructura = { id: propio ? null : id, series, reps, unidad: ej.seg ? 'segundos' : 'repeticiones', descanso, rir: tipo === 'C' ? '' : rir };
      const duracionMin = this.fuerzaMinutosBloque(estructura);
      // `ejercicio` guarda la estructura para poder editarla (series, repeticiones, descanso, RIR) al reenviar/editar la sesión.
      pasos.push({ icono: numeros[i] || '▪️', titulo: ej.n, accion, porque: ej.c, duracionMin, ejercicio: estructura });
    });

    const conCardio = cfg.objetivo === 'definicion';
    if (conCardio) pasos.push({ icono: '🏃', titulo: tx.cardio.t, accion: tx.cardio.a, porque: tx.cardio.p, duracionMin: 10 });
    pasos.push({ icono: '🧘', titulo: tx.estiramientos.t, accion: tx.estiramientos.a, porque: tx.estiramientos.p, duracionMin: 5 });

    // La duración de la sesión es exactamente la suma de los minutos de sus bloques.
    const duracion = pasos.reduce((s, p) => s + p.duracionMin, 0);
    const peso = AppState.currentUserData?.profile?.weight || null;
    const rpeSesion = this.fuerzaRpeSesion(pasos);
    const musculos = G.MUSCULOS[def.plantilla];
    const nombreObj = G.OBJETIVOS[cfg.objetivo];
    // Texto de la semana con el RIR real del nivel; en las 2 primeras semanas del principiante se explica que son de adaptación.
    const semanaTxt = G.SEMANA[w - 1].split('{rir}').join(rir) + (rampa ? G.NOTA_ADAPTACION : '');

    const detalle = {
      nombre: def.nombre,
      descripcion: musculos.charAt(0).toUpperCase() + musculos.slice(1),
      estructura: conCardio
        ? `Calentamiento 8 min + ${slots.length} ejercicios + cardio 10 min + estiramientos 5 min`
        : `Calentamiento 8 min + ${slots.length} ejercicios + estiramientos 5 min`,
      sensacion: '', zona: '', ritmoObjetivo: '', fcObjetivo: '',
      duracion,
      objetivo: `${nombreObj.n}: ${musculos}`,
      porque: `${nombreObj.why} ${semanaTxt}`,
      pasosDetallados: pasos,
      distanciaEstimada: 0,
      rpeEstimado: rpeSesion ? Math.round(rpeSesion * 10) / 10 : null,
      tssEstimada: Math.round((duracion / 60) * (rpeSesion || 6) * 10), // Session-RPE: horas × RPE × 10
      caloriasEstimadas: peso ? Math.round(peso * duracion * 0.0875) : null,
      esGimnasio: true
    };
    return { duracion, detalle };
  },

  async generarPlanGimnasio() {
    if (!AppState.isPremium) {
      if (window.showPremiumBenefits) showPremiumBenefits('nuevo-plan');
      else Utils.showToast('SOLO USUARIOS PREMIUM', 'error');
      return;
    }
    const diasEntreno = this.obtenerDiasSeleccionados();
    if (diasEntreno.length < 2 || diasEntreno.length > 6) {
      Utils.showToast('PARA GIMNASIO ELIGE ENTRE 2 Y 6 DÍAS', 'error');
      return;
    }
    try {
      Utils.showLoading('GENERANDO');
      AppState.feedbackSesiones = {};
      const objetivo = document.getElementById('gymObjetivo').value;
      const nivel = document.getElementById('gymNivel').value;
      const material = document.getElementById('gymMaterial').value;
      const meses = parseInt(document.getElementById('duracionPlan').value);
      const semanasTotales = meses * 4;
      const reparto = this._gymReparto(diasEntreno.length, nivel);

      // Con cuerpo completo los músculos necesitan ~48 h de recuperación entre sesiones: se avisa (sin bloquear) si hay días seguidos.
      if (reparto.some(d => d.plantilla === 'FULL') && diasEntreno.some(d => diasEntreno.includes((d % 7) + 1))) {
        Utils.showToast('Para cuerpo completo conviene dejar un día de descanso entre sesiones (los músculos necesitan 48 h para recuperarse).', 'warning', 4500);
      }

      // Adaptación como en el plan de running: feedback de las sesiones del plan anterior y carga reciente (ACWR).
      let factorVolumen = 1.0;
      let suavizar = false;
      if (AppState.planActualId) {
        const aj = await this.analizarFeedbackAdaptativo();
        factorVolumen = aj.volumen;
        suavizar = aj.intensidad < 1;
      }
      try {
        const carga = await this.calcularCargaEntrenamiento(AppState.currentUserId);
        if (carga && carga.datosSuficientes && carga.acwr !== null) {
          if (carga.acwr > 1.5) {
            factorVolumen *= 0.85;
            suavizar = true;
            Utils.showToast(`⚠️ Carga aguda:crónica alta (ACWR ${carga.acwr.toFixed(2)}) — moderamos las próximas semanas para reducir el riesgo de lesión.`, 'warning', 4500);
          } else if (carga.acwr > 1.3) {
            factorVolumen *= 0.95;
          }
        }
      } catch (e) {
        console.warn('No se pudo calcular el ACWR para ajustar el plan de gimnasio (se sigue solo con el feedback):', e);
      }
      const cfg = { objetivo, nivel, material, factorVolumen, suavizar, numDias: diasEntreno.length };

      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() + 1);
      fechaInicio.setHours(0, 0, 0, 0);
      const diaInicioSemana = ((fechaInicio.getDay() + 6) % 7) + 1;

      const planCompleto = [];
      let diaGlobalCounter = 1;
      for (let semanaIdx = 0; semanaIdx < semanasTotales; semanaIdx++) {
        let sesionIdx = 0;
        for (let i = 0; i < 7; i++) {
          const diaSemana = ((diaInicioSemana - 1 + i) % 7) + 1;
          if (diasEntreno.includes(diaSemana)) {
            const def = reparto[sesionIdx++];
            const s = this._gymConstruirSesion(def, semanaIdx, cfg);
            planCompleto.push({
              diaGlobal: diaGlobalCounter++, semana: semanaIdx + 1, nivel, diaSemana,
              tipo: 'strength', color: this.getColor('strength'), letra: this.getLetra('strength'),
              tieneFuerza: false, duracion: s.duracion, detalle: s.detalle
            });
          } else {
            planCompleto.push(this._diaDescanso(diaGlobalCounter++, semanaIdx + 1, diaSemana, 'GYM', nivel));
          }
        }
      }

      const planId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const objTxt = this.GYM.OBJETIVOS[objetivo].n;
      const planParaGuardar = {
        params: {
          modalidad: 'gimnasio', distancia: 'gimnasio', duracion: meses,
          diasPorSemana: diasEntreno.length, nivel, objetivo, material,
          diasEntreno, planId, fechaInicio: fechaInicio.toISOString()
        },
        sesiones: planCompleto,
        feedback: {},
        ajustes: {},
        nombrePlan: `Gimnasio · ${objTxt}`,
        resumen: `Gimnasio · ${diasEntreno.length} días · ${this.GYM.NIVELES[nivel]} · ${objTxt}`,
        fechaCreacion: new Date().toISOString()
      };

      await this.guardarPlanEnFirebase(planId, planParaGuardar);

      AppState.planGeneradoActual = planParaGuardar.params;
      AppState.planActualId = planId;
      AppState.planActualTipo = null;
      AppState.sesionesRealizadas = {};
      AppState.diasDobles = {};
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;

      const resumenEl = document.getElementById('resumenObjetivo');
      if (resumenEl) resumenEl.innerText = planParaGuardar.resumen;
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planParaGuardar.nombrePlan;
      document.getElementById('calendarioEntreno').style.display = 'block';
      document.getElementById('cuestionarioEntreno').style.display = 'none';

      this.mostrarCalendario(planCompleto);
      Utils.scrollToElement('calendarioEntreno', -20);
      Utils.showToast('✅ PLAN GENERADO', 'success');
    } catch (error) {
      console.error('Error generando plan de gimnasio:', error);
      Utils.showToast(error.message || 'Error al generar plan', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  // Muestra u oculta los campos del formulario según la modalidad (RUNNER/TRAIL o GIMNASIO).
  alternarModalidadPlan() {
    const gym = document.getElementById('modalidad')?.value === 'gimnasio';
    ['camposRunningA', 'camposRunningB'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = gym ? 'none' : '';
    });
    const g = document.getElementById('camposGimnasio');
    if (g) g.style.display = gym ? 'block' : 'none';
    if (gym) {
      const msg = document.getElementById('info-mensaje-distancia');
      if (msg) msg.style.display = 'none';
    } else {
      this.validarOpcionesPlan();
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

  // 🔥 Inserta en el plan ACTIVO del propio usuario (AppState.planActualId
  // -- el mismo que ya se ve en este calendario, sin crear ningún plan
  // paralelo) una sesión nueva en un día que hasta ahora no tenía ninguna
  // asignada. La llama session-invites.js desde su compositor de "Nueva
  // sesión" en modo auto-asignación (el "+" de un día vacío del
  // calendario). Devuelve la sesión insertada (o null si algo falla, o si
  // el día ya tenía una sesión -- por seguridad, nunca se pisa una
  // existente).
  async insertarSesionManualEnPlan(diaGlobal, tipo, duracion, detalle, opciones = {}) {
    if (!AppState.currentUserId || !AppState.planActualId) {
      Utils.showToast('No tienes un plan activo', 'error');
      return null;
    }
    try {
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) throw new Error('El plan no existe');
      const planCompleto = planDoc.data();
      const sesiones = planCompleto.sesiones || [];
      // 🔥 Ahora también se puede pedir "crear sesión" desde un día que ya
      // tiene un "descanso" por defecto (no solo desde un hueco
      // totalmente vacío) -- así que aquí se sustituye ese "descanso" en
      // vez de bloquear la creación. Lo único que sigue sin poder
      // pisarse es una sesión REAL ya asignada (por el planificador o por
      // el entrenador).
      const idxExistente = sesiones.findIndex(s => s.diaGlobal === diaGlobal);
      if (!opciones.reemplazar && idxExistente !== -1 && sesiones[idxExistente].tipo !== 'descanso' && sesiones[idxExistente].detalle) {
        Utils.showToast('Ese día ya tiene una sesión -- ábrela para corregirla', 'warning');
        return null;
      }
      // 🔥 v2.69: con opciones.reemplazar (EDITAR SESIÓN antes de marcarla
      // como realizada) se conserva lo que ya tenía la sesión (semana,
      // fase, noProgramada...) y solo se sustituyen tipo/duración/detalle.
      const previa = (opciones.reemplazar && idxExistente !== -1) ? sesiones[idxExistente] : null;
      const nuevaSesion = {
        ...(previa || {}),
        diaGlobal,
        semana: Math.floor((diaGlobal - 1) / 7) + 1,
        diaSemana: ((diaGlobal - 1) % 7) + 1,
        tipo,
        letra: this.getLetra(tipo),
        color: this.getColor(tipo),
        duracion: Math.round(duracion) || 0,
        noProgramada: previa ? (previa.noProgramada || false) : true, // se creó a mano, no la generó el planificador
        detalle
      };
      // Lo planificado originalmente se conserva aparte al editar una sesión.
      if (previa && opciones.planOriginal && !previa.planOriginal) nuevaSesion.planOriginal = opciones.planOriginal;
      if (idxExistente !== -1) {
        sesiones[idxExistente] = nuevaSesion;
      } else {
        sesiones.push(nuevaSesion);
      }
      await planRef.update({ sesiones });

      this._sesionesActuales = sesiones;
      if (!this._sesionesPorDiaGlobal) this._sesionesPorDiaGlobal = {};
      this._sesionesPorDiaGlobal[diaGlobal] = nuevaSesion;
      if (this._fechaInicioPlan) {
        const f = new Date(this._fechaInicioPlan);
        f.setDate(f.getDate() + (diaGlobal - 1));
        if (!this._sesionesPorFecha) this._sesionesPorFecha = {};
        this._sesionesPorFecha[this._dateKey(f)] = nuevaSesion;
      }
      this.renderizarMes();
      return nuevaSesion;
    } catch (error) {
      console.error('Error insertando entreno no programado en el plan:', error);
      Utils.showToast('Error al crear el entreno', 'error');
      return null;
    }
  },

  // 🔥 FIX (petición del usuario): control de acceso a la pestaña Plan.
  // Antes solo existía una comprobación (en abrirDetalleSesion) y era la
  // equivocada: dejaba pasar SIEMPRE cualquier plan 'personalizado' sin
  // volver a comprobar si el entrenador seguía activo -- un atleta
  // gratuito que dejaba de tener entrenador seguía viendo el calendario
  // que le hizo (y podía seguir añadiéndose sesiones con el botón "+").
  // Tampoco había ninguna comprobación al pintar la rejilla del
  // calendario en sí (mostrarCalendario/mostrarUltimoPlanGuardado), solo
  // al entrar en el detalle de una sesión concreta.
  //
  // Regla acordada:
  //  - Premium vigente -> ve cualquier plan, siempre (propio o
  //    personalizado).
  //  - Plan 'personalizado' sin premium -> solo si tiene AL MENOS UN
  //    entrenador activo ahora mismo (entrenadoresAceptados, ya
  //    mantenido en tiempo real por app.js) -- da igual que sea el mismo
  //    que lo creó: si cambia de entrenador, el nuevo le seguirá
  //    mandando sesiones al mismo plan personalizado.
  //  - Plan autogenerado (el suyo propio) sin premium -> nunca, ni
  //    siquiera si lo generó cuando SÍ era premium y luego le caducó
  //    (mismo fallo, de propina).
  _puedeVerPlanActual(tipo) {
    if (AppState.puedeVerDetalleSesion()) return true;
    if (tipo === 'personalizado') {
      return (AppState.currentUserData?.entrenadoresAceptados || []).length > 0;
    }
    return false;
  },

  // ==================== FUNCIÓN MODIFICADA: mostrarCalendario ====================
  // Asegura que sesiones esté ordenado por diaGlobal para que el índice coincida.
  //
  // 🔥 FIX (petición del usuario): antes, si _puedeVerPlanActual() daba
  // negativo, esta función sustituía TODA la rejilla por una pantalla de
  // "sin acceso" (_renderizarCalendarioSinAcceso, ya eliminada) -- y como
  // el estado premium/entrenador solo se comprobaba en el momento de
  // pintar, si el usuario se hacía premium (o le hacían entrenador) con
  // la sesión abierta, el calendario se quedaba bloqueado hasta recargar
  // la app entera. Ahora la rejilla y las sesiones se pintan SIEMPRE,
  // como antes de esa protección -- el control de acceso queda solo en
  // abrirDetalleSesion() (comprueba en el momento del clic, con el
  // AppState.isPremium más reciente) y en la pestaña Dashboard
  // ("Próxima sesión", index.html), que ya hacían exactamente eso.
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

      // ¿toca mostrar el "+" en este día? (solo cuando ese día no tiene
      // una sesión de verdad asignada -- ni real ni "descanso").
      const diaElegibleParaMas = this._diaElegibleParaNoProgramado(fecha);

      if (!sesion) {
        const dentroDelPlan = this._fechaInicioPlan && this._fechaFinPlan
          && fecha >= this._fechaInicioPlan && fecha <= this._fechaFinPlan;
        const diaGlobalVacio = diaElegibleParaMas ? Math.floor((fecha - this._fechaInicioPlan) / 86400000) + 1 : null;
        const botonMas = diaElegibleParaMas ? this._botonNoProgramadoHTML(diaGlobalVacio) : '';
        html += `<div class="calendario-dia calendario-dia-vacio${dentroDelPlan ? ' sesion-descanso' : ''}${esHoy}" data-fecha="${key}"><div class="dia-numero">${dia}</div>${botonMas}</div>`;
        continue;
      }

      const yaRealizada = !!AppState.sesionesRealizadas?.[sesion.diaGlobal];
      const esPerdida = !yaRealizada && sesion.tipo !== 'descanso' && fecha < hoy;
      const realizada = yaRealizada ? 'realizado' : (esPerdida ? 'perdida' : '');
      let faseColor = '';
      if (sesion.fase && this.FASES[sesion.fase]) faseColor = this.FASES[sesion.fase].color;
      const faseIndicator = faseColor ? ` style="border-top: 4px solid ${faseColor};"` : '';
      let contenidoHtml = `<div class="dia-numero">${dia}</div>`;
      const esDescanso = sesion.tipo === 'descanso' || !sesion.detalle;
      // 🔥 Un día de "descanso" también cuenta como "sin sesión de verdad
      // asignada" -- si ese día es elegible (mismas reglas que un día
      // vacío según el tipo de plan), se le añade el mismo "+" de
      // siempre. Para que la celda no quede recargada, cuando hay "+" se
      // quita el "—" (no aporta nada, era solo relleno) y se deja la "D"
      // sola, centrada, con el "+" en su esquina -- igual de organizado
      // que una celda con sesión real (letra arriba, dato abajo).
      const puedeRegistrarAqui = esDescanso && diaElegibleParaMas;
      if (!esDescanso) {
        const tiempo = sesion.duracion || '?';
        let letra = sesion.letra;
        if (sesion.tieneFuerza) letra += '+F';
        contenidoHtml += `<strong>${Utils.escapeHTML(letra)}</strong><div>${tiempo}'</div>`;
      } else {
        contenidoHtml += `<strong>D</strong>${puedeRegistrarAqui ? '' : '<div>—</div>'}`;
      }
      if (puedeRegistrarAqui) {
        contenidoHtml += this._botonNoProgramadoHTML(sesion.diaGlobal);
      }
      html += `<div class="calendario-dia ${sesion.color} ${realizada}${esHoy}" data-dia-global="${sesion.diaGlobal}" data-fecha="${key}"${faseIndicator}>${contenidoHtml}</div>`;
    }

    // 🔥 v2.79: altura FIJA del calendario. Un mes ocupa entre 4 y 6 filas según cómo caiga, y eso hacía que
    // el calendario creciera y encogiera al cambiar de mes. Se rellena siempre hasta 42 casillas (6 filas) con
    // huecos invisibles del mismo tamaño que un día (misma solución que el calendario del generador de sesiones).
    for (let i = primerDiaSemana + totalDiasMes; i < 42; i++) {
      html += '<div class="calendario-dia calendario-dia-vacio" style="visibility:hidden; pointer-events:none;" aria-hidden="true"></div>';
    }
    grid.innerHTML = html;
    this._aplicarDiasDobles();
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

    document.querySelectorAll('.btn-dia-no-programado').forEach(btnEl => {
      // 🔥 El "+" se comporta distinto según dónde esté: si está en un día
      // TOTALMENTE vacío (sin sesión, sin data-dia-global), abre el
      // compositor directamente -- no hay ningún detalle que mostrar. Si
      // está superpuesto sobre un "descanso" (que sí tiene sesión y su
      // propio clic en la celda), no se le pone listener propio: el clic
      // se deja propagar al de la celda, que siempre abre el modal de
      // descanso -- y desde ahí, si toca, está el botón "CREAR SESIÓN".
      // Así da igual si se toca la "D" o el "+" pequeño: siempre se ve
      // primero la explicación del descanso.
      if (btnEl.closest('.calendario-dia[data-dia-global]')) return;
      btnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const diaGlobal = parseInt(e.currentTarget.dataset.diaVacio);
        if (window.SessionInvites) SessionInvites.abrirGeneradorPropio(diaGlobal);
      });
    });
    this._actualizarBotonSesionExtra();
  },

  // 🔥 v2.77: SESIÓN EXTRA DE HOY. Para dobles sesiones (rodaje por la mañana + gimnasio/otro rodaje por la
  // tarde). El plan guarda UNA sesión por día (todo -sesionesRealizadas, wallEntryId, la rejilla...- va por
  // diaGlobal), así que la sesión extra NO entra en el plan: se compone con el mismo generador, se hace
  // (con GPS o registrándola a mano) y se guarda directamente como un entreno más en el historial (globalFeed),
  // con fecha de hoy, mediante el mismo flujo que marca una sesión como realizada (parámetro 'extra').
  // La sesión del plan de ese día no se toca y puede marcarse como siempre.
  // 🔥 v2.78: DÍAS DOBLES. Al guardar una sesión extra, ese día se guarda en el plan (diasDobles: { 'AAAA-MM-DD': nivel })
  // y la celda del calendario se pinta con el color del nivel que tenía el atleta en ese momento. Va por fecha
  // (no por diaGlobal) porque la sesión extra no pertenece a ningún día del plan.
  _pintarDiaDoble(celda, nivel) {
    if (!celda) return;
    const color = (window.Gamification && Gamification.getColorByLevel)
      ? Gamification.getColorByLevel(parseInt(nivel, 10) || 1)
      : '#d9a441';
    celda.classList.add('doble');
    celda.style.setProperty('--color-doble', color);
    celda.title = 'Día con sesión doble';
  },

  _aplicarDiasDobles() {
    const grid = document.getElementById('calendarioGrid');
    const dobles = AppState.diasDobles;
    if (!grid || !dobles) return;
    Object.keys(dobles).forEach((fecha) => {
      this._pintarDiaDoble(grid.querySelector(`[data-fecha="${fecha}"]`), dobles[fecha]);
    });
  },

  async _marcarDiaDoble(fecha, nivel) {
    try {
      const key = this._dateKey(fecha || new Date());
      const lvl = parseInt(nivel, 10) || parseInt(localStorage.getItem('ri5_lastLevel'), 10) || 1;
      if (!AppState.diasDobles) AppState.diasDobles = {};
      AppState.diasDobles[key] = lvl;
      this._pintarDiaDoble(document.querySelector(`#calendarioGrid [data-fecha="${key}"]`), lvl);
      if (AppState.currentUserId && AppState.planActualId) {
        await firebaseServices.db.collection('users').doc(AppState.currentUserId)
          .collection('planes').doc(AppState.planActualId)
          .set({ diasDobles: { [key]: lvl } }, { merge: true });
      }
    } catch (e) {
      console.warn('No se pudo guardar el día doble en el plan:', e);
    }
  },

  // 🔥 v2.79: al ELIMINAR una sesión extra desde el perfil, el día deja de estar pintado como doble (vuelve a verse
  // como estaba: sesión del plan realizada, o nada). Solo si no queda OTRA sesión extra ese mismo día.
  async revertirDiaDobleDeEntrada(entryData) {
    try {
      if (!entryData || !entryData.sesionExtra) return;
      const ts = entryData.fechaSesion;
      const fecha = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
      if (!fecha || isNaN(fecha.getTime())) return;
      fecha.setHours(0, 0, 0, 0);
      const key = this._dateKey(fecha);
      const uid = AppState.currentUserId;
      if (!uid) return;

      let quedanOtras = false;
      try {
        const snap = await firebaseServices.db.collection('globalFeed')
          .where('userId', '==', uid)
          .where('sesionExtra', '==', true)
          .where('fechaSesion', '==', firebaseServices.Timestamp.fromDate(fecha))
          .limit(1).get();
        quedanOtras = !snap.empty;
      } catch (qErr) {
        console.warn('No se pudo comprobar si quedan más sesiones extra ese día (se quita el color igualmente):', qErr);
      }
      if (quedanOtras) return;

      if (AppState.diasDobles) delete AppState.diasDobles[key];
      const celda = document.querySelector(`#calendarioGrid [data-fecha="${key}"]`);
      if (celda) {
        celda.classList.remove('doble');
        celda.style.removeProperty('--color-doble');
        celda.removeAttribute('title');
      }
      const planId = entryData.planId || AppState.planActualId;
      if (planId) {
        await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId)
          .set({ diasDobles: { [key]: firebaseServices.FieldValue.delete() } }, { merge: true });
      }
    } catch (e) {
      console.warn('No se pudo revertir el día doble:', e);
    }
  },

  // 🔥 v2.81: devuelve la sesión del plan a lo que estaba planificado antes de «EDITAR EN PROFUNDIDAD» (guardado en
  // planOriginal al marcarla). La usan el desmarcado del calendario y «eliminar» desde el perfil.
  async _restaurarSesionOriginal(planId, diaGlobal) {
    try {
      const uid = AppState.currentUserId;
      if (!uid || !planId) return;
      const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) return;
      const sesiones = planDoc.data().sesiones || [];
      const idx = sesiones.findIndex(s => s.diaGlobal === diaGlobal);
      if (idx === -1) return;
      const orig = sesiones[idx].planOriginal;
      if (!orig || !orig.tipo) return;
      const restaurada = {
        ...sesiones[idx],
        tipo: orig.tipo,
        letra: this.getLetra(orig.tipo),
        color: this.getColor(orig.tipo),
        duracion: orig.duracion || 0,
        detalle: orig.detalle || null
      };
      delete restaurada.planOriginal;
      sesiones[idx] = restaurada;
      await planRef.update({ sesiones });
      if (planId === AppState.planActualId) {
        this._sesionesActuales = sesiones;
        if (!this._sesionesPorDiaGlobal) this._sesionesPorDiaGlobal = {};
        this._sesionesPorDiaGlobal[diaGlobal] = restaurada;
        if (this._fechaInicioPlan) {
          const f = new Date(this._fechaInicioPlan);
          f.setDate(f.getDate() + (diaGlobal - 1));
          if (!this._sesionesPorFecha) this._sesionesPorFecha = {};
          this._sesionesPorFecha[this._dateKey(f)] = restaurada;
        }
        this.renderizarMes();
      }
    } catch (e) {
      console.warn('No se pudo restaurar la sesión original del plan:', e);
    }
  },

  // 🔥 v2.80: deja el calendario/feedback sin la calificación marcada tras desmarcar una sesión.
  _reiniciarBotonesFeedback() {
    document.querySelectorAll('#sesionFeedbackContainer .feedback-btn').forEach(btn => {
      btn.style.background = '';
      btn.style.color = '';
    });
  },

  // 🔥 v2.80: lo que una sesión guardó FUERA del muro y del plan, y que al desmarcarla/eliminarla debe desaparecer:
  //  - la ruta GPS completa (users/{uid}/gps_tracks). Las sesiones nuevas guardan su id en la entrada del muro
  //    (gpsTrackDocId); en las antiguas se busca por plan + día.
  //  - la miniatura de la ruta y la caché del perfil guardadas en el navegador.
  // Lo usan tanto el desmarcado del calendario como «eliminar» desde el perfil.
  async limpiarRastroDeEntrada(entryId, entryData, planId, sesionIndex) {
    try {
      const uid = AppState.currentUserId;
      if (!uid) return;
      try {
        if (entryId) localStorage.removeItem(`mapaEstatico_${entryId}`);
        localStorage.removeItem(`perfil_${uid}`);
      } catch (e) {}
      const tracks = firebaseServices.db.collection('users').doc(uid).collection('gps_tracks');
      if (entryData && entryData.gpsTrackDocId) {
        await tracks.doc(entryData.gpsTrackDocId).delete();
      } else if (entryData && entryData.hasGPS && planId && sesionIndex !== null && sesionIndex !== undefined) {
        const snap = await tracks.where('sesionIndex', '==', sesionIndex).where('planId', '==', planId).limit(5).get();
        await Promise.all(snap.docs.map(d => d.ref.delete()));
      }
    } catch (e) {
      console.warn('No se pudo limpiar la ruta GPS guardada (la sesión sí se desmarcó):', e);
    }
  },

  _actualizarBotonSesionExtra() {
    const grid = document.getElementById('calendarioGrid');
    if (!grid) return;
    let btn = document.getElementById('btnSesionExtraHoy');
    const permitido = !!AppState.planActualId && this._puedeVerPlanActual(AppState.planActualTipo);
    if (!permitido) { if (btn) btn.style.display = 'none'; return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btnSesionExtraHoy';
      btn.className = 'action-button';
      btn.style.cssText = 'width:auto; padding:0 24px; margin:14px auto 0; display:block; background:transparent; border:1px solid var(--gold); color:var(--gold);';
      btn.textContent = '➕ SESIÓN EXTRA DE HOY';
      btn.addEventListener('click', () => this.abrirSesionExtraHoy());
      grid.insertAdjacentElement('afterend', btn);
    }
    btn.style.display = 'block';
  },

  abrirSesionExtraHoy() {
    if (!AppState.planActualId || !this._puedeVerPlanActual(AppState.planActualTipo)) return;
    if (window.GPSTracker && GPSTracker.isRunning) { Utils.showToast('Ya hay una sesión en curso', 'warning'); return; }
    if (window.SessionInvites) SessionInvites.abrirGeneradorExtra();
  },

  // Devuelve 'gps', 'manual' o null (cancelado).
  _modalOpcionesSesionExtra(sesion) {
    return new Promise((resolve) => {
      document.getElementById('sesionExtraOverlay')?.remove();
      const info = this._infoTipo(sesion.tipo);
      const nombre = sesion.detalle?.nombre || info.label;
      const permiteGPS = !!window.GPSTracker && sesion.tipo !== 'strength';
      const overlay = document.createElement('div');
      overlay.id = 'sesionExtraOverlay';
      overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(5px);
        z-index:100050; display:flex; align-items:center; justify-content:center;
        box-sizing:border-box; padding:16px; opacity:1;
      `;
      // Sin fundido de entrada: se abre justo cuando el generador se cierra (si se fundiera, se vería lo de detrás).
      const btnBase = 'display:block; width:100%; height:48px; margin:0 0 10px 0; border-radius:14px; cursor:pointer; font-size:14px; font-weight:600; letter-spacing:1px;';
      overlay.innerHTML = `
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:16px; max-width:380px; width:100%; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center; max-height:90vh; max-height:90dvh; overflow-y:auto; -webkit-overflow-scrolling:touch; box-sizing:border-box; box-sizing:border-box;">
          <h3 style="margin:0 0 6px 0; color:var(--accent-yellow);">➕ SESIÓN EXTRA DE HOY</h3>
          <p style="margin:0 0 4px 0; font-size:14px; color:var(--text-primary);">${info.icono} ${Utils.escapeHTML(nombre)}${sesion.duracion ? ` · ${Math.round(sesion.duracion)} min` : ''}</p>
          <p style="margin:0 0 16px 0; font-size:12px; color:var(--text-secondary); line-height:1.4;">Se guarda como un entreno más de hoy, aparte de la sesión de tu plan.</p>
          ${permiteGPS ? `<button id="sesionExtraGps" style="${btnBase} background:linear-gradient(135deg, var(--bg-secondary), var(--bg-primary)); border:2px solid var(--gold); color:var(--gold);">EMPEZAR CON GPS</button>` : ''}
          <button id="sesionExtraManual" style="${btnBase} background:transparent; border:1px solid var(--border-color-light); color:var(--text-primary);">${sesion.tipo === 'strength' ? '✅ REGISTRARLA' : '✅ REGISTRARLA YA (SIN GPS)'}</button>
          <button id="sesionExtraCancelar" class="action-button" style="${btnBase} margin-bottom:0; color:var(--text-primary);">CANCELAR</button>
        </div>`;
      document.body.appendChild(overlay);
      const cerrar = (valor) => {
        overlay.style.transition = 'none'; overlay.style.pointerEvents = 'none'; overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
        resolve(valor);
      };
      overlay.querySelector('#sesionExtraGps')?.addEventListener('click', () => cerrar('gps'));
      overlay.querySelector('#sesionExtraManual').addEventListener('click', () => cerrar('manual'));
      overlay.querySelector('#sesionExtraCancelar').addEventListener('click', () => cerrar(null));
    });
  },

  // La llama session-invites.js al terminar de componer la sesión extra.
  async abrirOpcionesSesionExtra(datos) {
    if (!datos || !datos.detalle || datos.tipo === 'descanso') return;
    const sesion = {
      tipo: datos.tipo,
      letra: this.getLetra(datos.tipo),
      color: this.getColor(datos.tipo),
      duracion: Math.round(datos.duracion) || 0,
      detalle: datos.detalle,
      noProgramada: true,
      sesionExtra: true
    };
    const eleccion = await this._modalOpcionesSesionExtra(sesion);
    if (!eleccion) return;
    if (eleccion === 'gps') {
      if (window.GPSTracker && GPSTracker.isRunning) { Utils.showToast('Ya hay una sesión en curso', 'warning'); return; }
      const continuar = await this.comprobarFatigaAntesDeSesion(sesion.tipo);
      if (!continuar) return;
      GPSTracker.iniciar(sesion, 'extra', true);
      return;
    }
    await this._registrarSesionExtraManual(sesion);
  },

  async _registrarSesionExtraManual(sesion) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    let sesionReal = sesion;
    let datos = null;
    let saltarDatos = sesion.tipo === 'strength'; // fuerza no lleva km
    if (!saltarDatos) {
      while (true) {
        datos = await this.abrirModalDatosReales(sesionReal, true);
        if (!datos) return;
        if (datos.accion !== 'editar') break;
        const ed = window.SessionInvites ? await SessionInvites.editarSesionDelPlan('extra', sesionReal) : null;
        if (!ed) continue; // canceló el generador: vuelve al modal
        if (ed.tipo === 'descanso') {
          Utils.showToast('Una sesión de descanso no se registra como entreno', 'warning');
          continue;
        }
        sesionReal = {
          ...sesionReal,
          tipo: ed.tipo,
          letra: this.getLetra(ed.tipo),
          color: this.getColor(ed.tipo),
          duracion: Math.round(ed.duracion) || 0,
          detalle: ed.detalle
        };
        if (ed.tipo === 'strength') { saltarDatos = true; break; }
      }
    }
    const tipoComprobar = (!saltarDatos && datos && datos.tipoCorregido) || sesionReal.tipo;
    const continuar = await this.comprobarFatigaAntesDeSesion(tipoComprobar);
    if (!continuar) return;
    const ctx = { sesion: sesionReal, fecha: hoy };
    if (saltarDatos) {
      await this.marcarSesionRealizada('extra', true, null, null, null, false, true, null, null, null, ctx);
    } else {
      await this.marcarSesionRealizada('extra', true, datos.km, datos.ms, null, false, true, datos.tipoCorregido, datos.zonaOverride, null, ctx);
    }
  },

  agregarLeyendaFases() {
    const contenedor = document.querySelector('.calendario-navegacion');
    if (!contenedor) return;
    // La leyenda de fases (Base/Build/...) es de carrera: en un plan de gimnasio se oculta.
    const leyendaPrevia = document.getElementById('leyenda-fases');
    if (AppState.planGeneradoActual?.modalidad === 'gimnasio') { if (leyendaPrevia) leyendaPrevia.style.display = 'none'; return; }
    if (leyendaPrevia) { leyendaPrevia.style.display = 'flex'; return; }
    const leyenda = document.createElement('div');
    leyenda.id = 'leyenda-fases';
    leyenda.style.cssText = 'display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 12px; flex-wrap: wrap;';
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
    // 🔥 FIX (petición del usuario): antes miraba solo
    // AppState.planActualTipo === 'personalizado' para dejar pasar
    // siempre, sin comprobar si el entrenador seguía activo. Usa
    // _puedeVerPlanActual (comprobado en el momento del clic, no al
    // pintar la rejilla) con este criterio: si es por falta de
    // entrenador, NO se empuja premium (un simple aviso, sin modal); si
    // es por falta de premium, sí se abre el modal.
    if (!this._puedeVerPlanActual(AppState.planActualTipo)) {
      if (AppState.planActualTipo === 'personalizado') {
        Utils.showToast('🔒 Necesitas un entrenador activo para ver esta sesión', 'warning');
      } else if (window.showPremiumBenefits) {
        showPremiumBenefits('calendario');
      } else {
        Utils.showToast('Función premium', 'warning');
      }
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
      else if (sesion.tipo === 'caminar') icono = "🚶";
      const faseTexto = sesion.fase ? ` · ${this.FASES[sesion.fase]?.nombre || sesion.fase}` : '';
      // En un plan personalizado (o si la sesión la generó una persona) el nombre es texto suyo: no se traduce
      const _nombreDeUsuario = !!(sesion.detalle.userAuthored || AppState.planActualTipo === 'personalizado');
      titulo.innerHTML = `${Utils.escapeHTML(icono)} ${Utils.escapeHTML(sesion.tipo.toUpperCase())}${Utils.escapeHTML(faseTexto)}: ${_nombreDeUsuario ? Utils.noTr(sesion.detalle.nombre) : Utils.escapeHTML(sesion.detalle.nombre)}`;

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
          <p><strong>${(sesion.detalle.userAuthored || AppState.planActualTipo === 'personalizado') ? Utils.userTxt(sesion.detalle.objetivo, 'Sesión de calidad') : Utils.escapeHTML(sesion.detalle.objetivo || 'Sesión de calidad')}</strong></p>
          <p class="porque">${(sesion.detalle.userAuthored || AppState.planActualTipo === 'personalizado') ? Utils.noTr(sesion.detalle.porque || '') : Utils.escapeHTML(sesion.detalle.porque || '')}</p>
        </div>
      `;

      const adjuntosHTML = (typeof SessionInvites !== 'undefined' && SessionInvites._htmlAdjuntos)
        ? SessionInvites._htmlAdjuntos(sesion.detalle.adjuntos) : '';
      // Separación entre el material adjunto y el bloque Ritmo / Sensación / Zona
      const adjuntosBloque = adjuntosHTML ? `<div style="margin-bottom:20px;">${adjuntosHTML}</div>` : '';

      let zonasHTML = '';
      if (sesion.tipo !== 'strength') {
        zonasHTML = `
          <div class="sesion-zonas">
            <div class="zona-item"><span>⏱️ Ritmo</span><strong>${Utils.escapeHTML(sesion.detalle.ritmoObjetivo)}</strong></div>
            <div class="zona-item"><span>😌 Sensación</span><strong>${(sesion.detalle.userAuthored || AppState.planActualTipo === 'personalizado') ? Utils.noTr(sesion.detalle.sensacion) : Utils.escapeHTML(sesion.detalle.sensacion)}</strong></div>
            <div class="zona-item"><span>📊 Zona</span><strong>${Utils.escapeHTML(sesion.detalle.zona)}</strong></div>
            ${(sesion.tipo === 'series' && sesion.detalle.seriesConfig && sesion.detalle.seriesConfig.descansoZona !== undefined)
              ? `<div class="zona-item"><span>🔁 Descanso entre repeticiones</span><strong>${sesion.detalle.seriesConfig.descansoZona ? 'En ' + Utils.escapeHTML(sesion.detalle.seriesConfig.descansoZona) + ' (trotando)' : 'Parado'}</strong></div>`
              : ''}
          </div>
        `;
      }

      let pasosHTML = '<div class="sesion-estructura-detallada">';
      if (sesion.detalle.pasosDetallados && sesion.detalle.pasosDetallados.length > 0) {
        sesion.detalle.pasosDetallados.forEach(paso => {
          pasosHTML += `
            <div class="paso-detalle-sesion">
              <div class="paso-header"><span>${paso.icono}</span><strong>${Utils.escapeHTML(paso.titulo)}</strong></div>
              <p class="paso-accion">${(sesion.detalle.userAuthored || AppState.planActualTipo === 'personalizado') ? Utils.noTr(paso.accion) : Utils.escapeHTML(paso.accion)}</p>
              <p class="paso-porque"><em>${(sesion.detalle.userAuthored || AppState.planActualTipo === 'personalizado') ? Utils.noTr(paso.porque) : Utils.escapeHTML(paso.porque)}</em></p>
              ${this._htmlCargaPaso(paso)}
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
      descripcion.innerHTML = headerHTML + objetivoHTML + adjuntosBloque + zonasHTML + pasosHTML;
      
      if (window.GPSTracker && sesion.tipo !== 'strength') {
        const gpsBtn = document.createElement('button');
        gpsBtn.id = 'gpsStartBtn';
        gpsBtn.style.cssText = [
          'margin-top:18px', 'width:100%', 'height:54px',
          'background:linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
          'border:1px solid var(--gold)', 'color:var(--gold)',
          'font-size:16px', 'font-weight:600', 'letter-spacing:1px',
          'border-radius:14px', 'cursor:pointer',
          'font-family:inherit',
          'display:flex', 'align-items:center',
          'justify-content:center', 'gap:10px'
        ].join(';');
        gpsBtn.innerHTML = 'INICIAR SESIÓN CON GPS';
        // (Sin listeners mouseenter/mouseleave: en el móvil iOS simula un «ratón» sobre el elemento que aparece
        //  bajo el dedo al abrirse el modal, y el botón destellaba en dorado. El efecto al pulsar/pasar el ratón
        //  está en CSS: #gpsStartBtn:active y @media (hover:hover), en index.html.)
        
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
          const continuar = await this.comprobarFatigaAntesDeSesion(sesion.tipo);
          if (!continuar) return;
          GPSTracker.iniciar(sesionLimpia, diaIndex);
        });
        descripcion.appendChild(gpsBtn);
      }

      // 🔥 Petición del usuario: si esta sesión viene de un entrenador
      // superior (mi plan es 'personalizado') y yo también soy
      // entrenador, puedo reenviarla tal cual a mis propios alumnos --
      // eligiendo día(s) y destinatarios nuevos, no solo el día en que
      // me la mandaron a mí. No depende de GPSTracker ni se excluye para
      // 'strength' (a diferencia del botón de arriba): un entrenador
      // puede querer reenviar cualquier tipo de sesión.
      if (window.SessionInvites && (AppState.isAdmin || (AppState.isTrainer && AppState.planActualTipo === 'personalizado'))) {
        const reenviarWrap = document.createElement('div');
        reenviarWrap.style.cssText = 'display:flex; justify-content:center; margin-top:16px;';
        const reenviarBtn = document.createElement('button');
        reenviarBtn.id = 'reenviarSesionBtn';
        reenviarBtn.className = 'action-button';
        reenviarBtn.style.cssText = 'width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--gold); color:var(--gold);';
        reenviarBtn.innerHTML = AppState.isAdmin ? '📤 REENVIAR SESIÓN' : '📤 REENVIAR A MIS ATLETAS';
        reenviarBtn.addEventListener('click', () => {
          SessionInvites.reenviarSesionDelPlan(sesion);
        });
        reenviarWrap.appendChild(reenviarBtn);
        descripcion.appendChild(reenviarWrap);
      }

      checkboxContainer.style.display = 'flex';
      checkbox.checked = AppState.sesionesRealizadas?.[diaIndex] || false;

      // 🔧 FIX (petición del usuario, ampliada): solo se puede marcar como
      // realizada la sesión de HOY -- si el día de esta sesión no es hoy
      // (pasado o futuro) y todavía NO está marcada, se deshabilita el
      // checkbox en vez de dejar que el usuario lo marque y reciba el
      // error después -- _marcarSesionRealizadaInterno (calendar.js) sigue
      // bloqueando el marcado igualmente por si se llega aquí por otra
      // vía, pero así se ve de un vistazo que no se puede. Si YA estaba
      // marcada, se deja habilitado para poder desmarcarla (corregir un
      // marcado por error), sea del día que sea.
      let sesionNoEsHoy = false;
      let sesionEsFutura = false;
      if (this._fechaInicioPlan) {
        const fechaSesionModal = new Date(this._fechaInicioPlan);
        fechaSesionModal.setDate(fechaSesionModal.getDate() + (diaIndex - 1));
        fechaSesionModal.setHours(0, 0, 0, 0);
        const hoyModal = new Date(); hoyModal.setHours(0, 0, 0, 0);
        sesionNoEsHoy = fechaSesionModal.getTime() !== hoyModal.getTime();
        sesionEsFutura = fechaSesionModal > hoyModal;
      }
      const yaEstabaMarcada = checkbox.checked;
      checkbox.disabled = sesionNoEsHoy && !yaEstabaMarcada;
      // 🔧 FIX (petición del usuario): cuando la sesión está bloqueada por
      // fecha (pasada o futura, y no estaba ya marcada), se oculta del
      // todo el cuadrado del checkbox -- no tiene sentido dejar ver un
      // control aunque esté disabled -- y el texto se pinta en rojo para
      // que se entienda a simple vista por qué no se puede marcar.
      checkbox.style.display = checkbox.disabled ? 'none' : '';
      const labelCheckbox = checkboxContainer.querySelector('label');
      if (labelCheckbox) {
        labelCheckbox.textContent = !checkbox.disabled
          ? '✅ Marcar como realizada'
          : (sesionEsFutura ? '🔒 Sesión futura: todavía no se puede marcar' : '🔒 Sesión pasada: ya no se puede marcar');
        labelCheckbox.style.color = checkbox.disabled ? 'var(--st-red)' : '';
      }

      // 🔧 FIX (petición del usuario): el botón "INICIAR SESIÓN CON GPS"
      // no tenía esta misma restricción de fecha -- se podía arrancar un
      // GPS en vivo para la sesión de un día pasado o futuro aunque la
      // casilla de "Marcar como realizada" ya estuviera bloqueada para
      // ese mismo día. GPS es una acción en directo (se sale a correr
      // AHORA), así que no tiene sentido en ningún caso si el día de la
      // sesión no es hoy -- a diferencia de la casilla, aquí no se hace
      // la excepción de "si ya estaba marcada" porque no existe un GPS
      // "ya iniciado" que deba poder deshacerse.
      const gpsBtnEl = document.getElementById('gpsStartBtn');
      if (gpsBtnEl) {
        gpsBtnEl.disabled = sesionNoEsHoy;
        gpsBtnEl.style.opacity = sesionNoEsHoy ? '0.4' : '1';
        gpsBtnEl.style.cursor = sesionNoEsHoy ? 'not-allowed' : 'pointer';
        gpsBtnEl.style.pointerEvents = sesionNoEsHoy ? 'none' : 'auto';
        // 🔥 FIX parpadeo: el modal aparece justo bajo el dedo que tocó el día del calendario y el navegador
        // táctil aplica :active/hover (y el click fantasma) al botón recién creado. Se deja el botón inerte
        // mientras dura el fundido de entrada y se reactiva después.
        if (!sesionNoEsHoy) {
          gpsBtnEl.style.pointerEvents = 'none';
          clearTimeout(this._gpsBtnInertTimer);
          this._gpsBtnInertTimer = setTimeout(() => {
            const b = document.getElementById('gpsStartBtn');
            if (b && !b.disabled) b.style.pointerEvents = 'auto';
          }, 600);
        }
      }

      checkbox.onchange = async (e) => {
        const marcando = e.target.checked;
        if (marcando && sesion && sesion.tipo !== 'descanso' && sesion.tipo !== 'strength') {
          // 🔥 v2.70: un solo modal (tiempo, km, zona) con CONFIRMAR y EDITAR EN
          // PROFUNDIDAD. Editar abre el generador con la sesión cargada y, al
          // guardar, vuelve a este mismo modal. NADA se escribe en el plan
          // hasta que se confirma: si se cancela, la sesión queda intacta.
          let sesionReal = sesion;
          let editada = false;
          let datos = null;
          let saltarDatos = false;
          let primeraVuelta = true;
          while (true) {
            // La 1.ª vez se abre sobre el detalle de la sesión (que sigue visible): fundido normal.
            // Las siguientes toman el relevo del generador recién cerrado: sin fundido.
            datos = await this.abrirModalDatosReales(sesionReal, !primeraVuelta);
            primeraVuelta = false;
            if (!datos) { checkbox.checked = false; return; }
            if (datos.accion !== 'editar') break;
            const ed = window.SessionInvites
              ? await SessionInvites.editarSesionDelPlan(diaIndex, sesionReal)
              : null;
            if (!ed) continue; // canceló el generador: vuelve al modal
            if (ed.tipo === 'descanso') {
              Utils.showToast('Una sesión de descanso no se marca como realizada', 'warning');
              continue;
            }
            sesionReal = {
              ...sesionReal,
              tipo: ed.tipo,
              letra: this.getLetra(ed.tipo),
              color: this.getColor(ed.tipo),
              duracion: Math.round(ed.duracion) || 0,
              detalle: ed.detalle
            };
            editada = true;
            if (ed.tipo === 'strength') { saltarDatos = true; break; } // fuerza no lleva km
          }
          if (editada) {
            const continuar = await this.comprobarFatigaAntesDeSesion(sesionReal.tipo);
            if (!continuar) { checkbox.checked = false; return; }
            const guardada = await this.insertarSesionManualEnPlan(
              diaIndex, sesionReal.tipo, sesionReal.duracion, sesionReal.detalle,
              { reemplazar: true, planOriginal: { tipo: sesion.tipo, duracion: sesion.duracion, detalle: sesion.detalle } }
            );
            if (!guardada) { checkbox.checked = false; return; }
          }
          if (saltarDatos) {
            await this.marcarSesionRealizada(diaIndex, true, null, null, null, false, true);
          } else {
            await this.marcarSesionRealizada(diaIndex, true, datos.km, datos.ms, null, false, editada, datos.tipoCorregido, datos.zonaOverride);
          }
          if (editada) this.abrirDetalleSesion(this._sesionesPorDiaGlobal[diaIndex], diaIndex);
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
      // El mismo día para el que se calcula si toca ofrecer el "+" en el
      // calendario -- aquí, en vez de un icono suelto, se muestra un
      // botón normal de la app (mismo estilo que el resto) debajo de la
      // explicación del descanso.
      // 🔥 FIX: el botón dependía de this._fechaInicioPlan, que solo se
      // rellena dentro de mostrarCalendario()/renderizarMes() -- si el
      // detalle de la sesión se abre sin haber pasado por ahí en esta
      // misma carga (o si esa propiedad se hubiera quedado a null por
      // cualquier motivo), el botón se quedaba sin mostrarse aunque el
      // día SÍ fuera elegible. Ahora se calcula directo desde la fuente
      // real (AppState.planGeneradoActual.fechaInicio, la misma que usa
      // mostrarCalendario), sin depender de ese estado intermedio.
      const fechaInicioStr = AppState.planGeneradoActual?.fechaInicio;
      let fechaDeEsteDia = null;
      if (fechaInicioStr) {
        fechaDeEsteDia = new Date(fechaInicioStr);
        fechaDeEsteDia.setHours(0, 0, 0, 0);
        fechaDeEsteDia.setDate(fechaDeEsteDia.getDate() + (diaIndex - 1));
      }
      const puedeCrearAqui = fechaDeEsteDia && this._diaElegibleParaNoProgramado(fechaDeEsteDia);
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
          ${puedeCrearAqui ? `
            <div style="display:flex; justify-content:center; margin-top:16px;">
              <button onclick="cerrarModalSesion(); SessionInvites.abrirGeneradorPropio(${diaIndex});" class="action-button" style="width:auto; padding:0 24px; margin:0;">CREAR SESIÓN</button>
            </div>
          ` : ''}
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

  // 'tipoProximo': tipo de la sesión que se va a empezar ahora (rodaje/
  // tempo/series/largo/strength). La fuerza y la carrera son GRUPOS
  // independientes -- no recuperado de fuerza no debe impedir salir a
  // correr (ni al revés): solo se avisa si se repite el MISMO grupo que
  // la última sesión registrada.
  _grupoTipo(tipo) {
    return tipo === 'strength' ? 'strength' : 'carrera';
  },

  async comprobarFatigaAntesDeSesion(tipoProximo = null) {
    const estado = this.calcularEstadoRecuperacionActual();
    if (estado && estado.pct < 100 &&
        (!tipoProximo || this._grupoTipo(tipoProximo) === this._grupoTipo(estado.tipo))) {
      const horasStr = estado.horasRestantes >= 24
        ? `${Math.ceil(estado.horasRestantes / 24)} día(s)`
        : `${estado.horasRestantes} h`;
      const continuar = await Utils.confirm(
        '⚠️ Aún no estás recuperado al 100%',
        `Recuperación al ${estado.pct}%. Faltan ~${horasStr} para estar al 100%; entrenar ahora aumenta el riesgo de lesión. ¿Continuar igualmente?`
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

  async marcarSesionRealizada(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null, esGPS = false, saltarComprobacionFatiga = false, tipoCorregido = null, zonaOverride = null, infoGPS = null, extra = null) {
    if (!AppState.currentUserId || !AppState.planActualId) return;

    const enCurso = this._marcandoEnCurso[diaIndex];
    if (enCurso) {
      try { await enCurso; } catch (e) {}
    }
    let resolverEnCurso;
    this._marcandoEnCurso[diaIndex] = new Promise(res => { resolverEnCurso = res; });

    try {
      await this._marcarSesionRealizadaInterno(diaIndex, realizada, realDistance, realDurationMs, realMaxSpeedKmh, esGPS, saltarComprobacionFatiga, tipoCorregido, zonaOverride, infoGPS, extra);
    } finally {
      resolverEnCurso();
      if (this._marcandoEnCurso[diaIndex]) delete this._marcandoEnCurso[diaIndex];
    }
  },

  async _marcarSesionRealizadaInterno(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null, esGPS = false, saltarComprobacionFatiga = false, tipoCorregido = null, zonaOverride = null, infoGPS = null, extra = null) {
    // 🔥 v2.77: 'extra' = { sesion, fecha } cuando se registra una SESIÓN EXTRA DE HOY (segundo entreno del
    // mismo día, ver abrirOpcionesSesionExtra). En ese caso la sesión NO está en el plan: se usa la que
    // viene en 'extra', la fecha es hoy, y no se toca nada del plan (ni sesionesRealizadas, ni wallEntryId).
    // 🔧 FIX (petición del usuario, ampliada): solo se puede marcar como
    // realizada la sesión programada para HOY -- ni una de un día YA
    // PASADO (gente que entraba el viernes y marcaba de golpe miércoles,
    // jueves y viernes) ni una de un día FUTURO (marcar mañana o pasado
    // por adelantado). Solo se comprueba al MARCAR (realizada === true);
    // desmarcar una sesión ya marcada sigue permitido siempre, sea del día
    // que sea, para poder corregir un marcado por error.
    if (realizada && this._fechaInicioPlan && !extra) {
      const fechaSesionCheck = new Date(this._fechaInicioPlan);
      fechaSesionCheck.setDate(fechaSesionCheck.getDate() + (diaIndex - 1));
      fechaSesionCheck.setHours(0, 0, 0, 0);
      const hoyCheck = new Date();
      hoyCheck.setHours(0, 0, 0, 0);
      if (fechaSesionCheck.getTime() !== hoyCheck.getTime()) {
        const mensaje = fechaSesionCheck < hoyCheck
          ? 'Esta sesión ya pasó de fecha y no se puede marcar.'
          : 'Esta sesión es de un día futuro y aún no se puede marcar.';
        Utils.showToast(mensaje, 'error');
        const checkboxPasado = document.getElementById('sesionRealizada');
        if (checkboxPasado) checkboxPasado.checked = false;
        const celdaPasado = document.querySelector(`.calendario-dia[data-dia-global="${diaIndex}"]`);
        if (celdaPasado) celdaPasado.classList.remove('realizado');
        return;
      }
    }

    if (realizada && !saltarComprobacionFatiga) {
      const sesionParaFatiga = extra ? extra.sesion : (this._sesionesPorDiaGlobal ? this._sesionesPorDiaGlobal[diaIndex] : null);
      const continuar = await this.comprobarFatigaAntesDeSesion(tipoCorregido || sesionParaFatiga?.tipo || null);
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
      if (!extra) {
      if (realizada) {
        await planRef.update({ [`sesionesRealizadas.${diaIndex}`]: realizada });
      } else {
        // 🔥 v2.80: desmarcar deja el plan EXACTAMENTE como antes de marcarla: se borra la clave (antes quedaba
        // guardada como 'false', y el contador «X / Y sesiones» del plan seguía contándola) y también su calificación
        // (feedback) y los datos de ruta GPS del plan.
        await planRef.update({
          [`sesionesRealizadas.${diaIndex}`]: firebaseServices.FieldValue.delete(),
          [`feedback.${diaIndex}`]: firebaseServices.FieldValue.delete(),
          [`gpsTrack.${diaIndex}`]: firebaseServices.FieldValue.delete()
        });
      }

      if (!AppState.sesionesRealizadas) AppState.sesionesRealizadas = {};
      if (realizada) {
        AppState.sesionesRealizadas[diaIndex] = realizada;
      } else {
        delete AppState.sesionesRealizadas[diaIndex];
        if (AppState.feedbackSesiones) delete AppState.feedbackSesiones[diaIndex];
        this._reiniciarBotonesFeedback();
      }
      
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

      }

      Utils.showToast(realizada ? '✅ Sesión marcada' : '📝 Sesión desmarcada (actualizada)', 'success');

      try {
      const planDoc = extra ? null : await planRef.get();
      const planCompleto = extra ? {} : planDoc.data();
      // FIX GRAVE: buscar la sesión por su diaGlobal REAL en vez de usar
      // diaIndex-1 como posición de array. Con huecos en la secuencia de
      // diaGlobal (plan personalizado por invitaciones sueltas del admin),
      // el índice de array podía apuntar a OTRA sesión distinta -- al
      // marcar una sesión como hecha se calculaban y publicaban las
      // métricas (distancia/TSS/calorías/zona) de la sesión equivocada.
      const sesion = extra ? extra.sesion : (planCompleto.sesiones || []).find(s => s.diaGlobal === diaIndex);
      
      if (realizada) {
        await this.limpiarMuroGlobal();
        if (sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          let metricas;
          let distanciaUsada;
          let duracionUsadaMs;
          // 🔥 FIX CALORÍAS: antes se declaraba dentro de la rama 'strength'
          // (const pesoUsuario), así que solo esa rama podía usarlo -- las
          // ramas de carrera (GPS/manual y estimada) nunca calculaban
          // calorías y siempre guardaban null. Se sube aquí fuera para que
          // las 3 ramas puedan usarlo igual.
          const pesoUsuario = AppState.currentUserData?.profile?.weight || null;

          if (sesion.tipo === 'strength') {
            duracionUsadaMs = (sesion.duracion || 0) * 60 * 1000;
            distanciaUsada = 0;
            // 🔥 FIX: antes esto iba fijo a tssTotal:0 porque el TSS "clásico"
            // (basado en ritmo/FC) no aplica a gimnasio. Pero un TSS de 0 se
            // trata en el resto de la app como "sin sesión" (ult.tss es
            // falsy): el dashboard mostraba "sin datos todavía" al marcar
            // fuerza como hecha, en vez de la carga/descanso reales, y la
            // sesión tampoco contaba para el ACWR/CTL-ATL.
            //
            // En vez de inventar una tabla propia, se usa el método
            // estándar para cuantificar carga de sesiones sin potencia/
            // ritmo/FC: "TSS por RPE de sesión" (Session-RPE, Foster et al.
            // 2001), el mismo que usa TrainingPeaks para normalizar
            // actividades de fuerza a la misma escala 0-100 que el TSS de
            // carrera/ciclismo:
            //     TSS = horas de sesión × RPE (esfuerzo percibido, 0-10) × 10
            // Se asume un RPE moderado-alto de 6/10 ("duro", pero no al
            // fallo), representativo de un trabajo de fuerza complementario
            // para corredores. Con eso, 30' de gimnasio ≈ 30 TSS y 60' ≈ 60
            // TSS -- comparable a una sesión de rodaje suave/moderada de la
            // misma duración, y calcularRecuperacion() ya tenía su propio
            // factor para 'strength' (1.1) esperando precisamente este dato.
            // Si la sesión trae su RPE estimado (sesiones con ejercicios, RIR incluido) se usa; si no, el 6 de siempre.
            const RPE_FUERZA_ASUMIDO = (sesion.detalle && sesion.detalle.rpeEstimado > 0) ? Math.max(3, Math.min(9.5, sesion.detalle.rpeEstimado)) : 6;
            const horasSesionFuerza = (sesion.duracion || 0) / 60;
            const tssEquivalenteFuerza = Math.round(horasSesionFuerza * RPE_FUERZA_ASUMIDO * 10);
            metricas = {
              distanciaTotal: 0,
              tssTotal: tssEquivalenteFuerza,
              desglose: null,
              calorias: sesion.detalle.caloriasEstimadas
                || (pesoUsuario ? Math.round(pesoUsuario * (sesion.duracion || 0) * 0.0875) : null)
            };
          } else if (realDistance !== null && realDurationMs !== null) {
            distanciaUsada = realDistance;
            duracionUsadaMs = realDurationMs;
            const desgloseReal = this._desglosarSesion(sesion, realDurationMs / 60000, realDistance);
            // 🔥 Corrección manual de zona (pedida por el usuario): el ritmo
            // medio no refleja desnivel ni un pulso más alto de lo normal --
            // si ha corregido la zona en el modal de confirmación, se
            // sustituye la zona detectada por ritmo de la parte principal
            // por la que él indica. El TSS se recalcula DESPUÉS con esta
            // zona ya sustituida (calcularTSSdesdeReal lee desglose.zona),
            // así la corrección no es solo cosmética: una zona más dura
            // sube el TSS/carga de verdad, y una más suave lo baja.
            if (zonaOverride && desgloseReal.partePrincipal) {
              desgloseReal.partePrincipal.zona = zonaOverride;
              desgloseReal.partePrincipalZonaCorregida = true;
            }
            metricas = {
              distanciaTotal: realDistance,
              tssTotal: this.calcularTSSdesdeReal(realDistance, realDurationMs, sesion, desgloseReal),
              gpsUsed: !!esGPS,
              maxSpeed: esGPS ? (realMaxSpeedKmh || 0) : 0,
              desglose: desgloseReal,
              zone4Minutes: this._sumarMinutosPorZona(desgloseReal, 'Z4'),
              zone5Minutes: this._sumarMinutosPorZona(desgloseReal, 'Z5'),
              // 🔥 FIX CALORÍAS: antes esta rama (GPS o km/tiempo corregidos a
              // mano) nunca fijaba `calorias`, así que la sesión de carrera
              // se publicaba siempre con calorías null. Se usa la distancia
              // REAL (no la estimada del plan), con la misma fórmula que ya
              // usa el resto de la app (peso × km ≈ 1 kcal/kg/km).
              calorias: pesoUsuario ? Math.round(sesion.tipo === 'caminar' ? 4.0 * pesoUsuario * (realDurationMs / 3600000) : pesoUsuario * realDistance) : (sesion.detalle.caloriasEstimadas || null)
            };
          } else {
            metricas = {
              distanciaTotal: sesion.detalle.distanciaEstimada || 0,
              tssTotal: sesion.detalle.tssEstimada || 0,
              desglose: this._desglosarSesion(sesion, sesion.duracion, sesion.detalle.distanciaEstimada || 0),
              // 🔥 FIX CALORÍAS: misma fórmula, aplicada a la distancia
              // estimada del plan ya que aquí no hay dato real (sesión
              // marcada sin GPS ni corrección manual de km/tiempo).
              calorias: (sesion.tipo === 'caminar' && sesion.detalle.caloriasEstimadas) ? sesion.detalle.caloriasEstimadas : (pesoUsuario ? Math.round(sesion.tipo === 'caminar' ? 4.0 * pesoUsuario * ((sesion.duracion || 0) / 60) : pesoUsuario * (sesion.detalle.distanciaEstimada || 0)) : (sesion.detalle.caloriasEstimadas || null))
            };
            distanciaUsada = metricas.distanciaTotal;
            duracionUsadaMs = sesion.duracion * 60 * 1000;
          }

          if (distanciaUsada > 0 && duracionUsadaMs > 0) {
            metricas.bestPace = (duracionUsadaMs / 60000) / distanciaUsada;
          }
          metricas.durationMs = duracionUsadaMs;
          const ritmoMedioEntrada = (metricas.bestPace > 0 && isFinite(metricas.bestPace)) ? Math.round(metricas.bestPace * 10000) / 10000 : null;
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
          // Sesión extra: la fecha es siempre HOY (no depende del día del plan).
          if (extra) {
            fechaSesionReal = new Date(extra.fecha || Date.now());
            fechaSesionReal.setHours(0, 0, 0, 0);
          }

          const entry = {
            userId: AppState.currentUserId,
            username: userData.username,
            photoURL: userData.profile?.photoURL || null,
            // v2.85: rol de entrenador copiado a la entrada para pintar la píldora y el sello junto al nombre en el Muro,
            // en los «Me gusta» y en Perfil sin leer el usuario de cada autor (Utils.pillEntrenador(entry)). Los entrenos
            // ya publicados lo reciben con Storage.autoSyncTrainerInfo().
            ...(userData.isAdmin === true ? { isAdmin: true } : {}),
            ...(userData.isTrainer === true ? {
              isTrainer: true,
              trainerVerified: userData.trainerVerified === true,
              trainerTitle: userData.trainerVerified === true ? (userData.trainerTitle || '') : ''
            } : {}),
            trainingType: tipoFinal,
            duration: Math.floor(duracionUsadaMs / 60000),
            distancia: distancia,
            tss: tss,
            timestamp: firebaseServices.Timestamp.now(),
            fechaSesion: fechaSesionReal ? firebaseServices.Timestamp.fromDate(fechaSesionReal) : firebaseServices.Timestamp.now(),
            planId: AppState.planActualId || null,
            // Una sesión extra no ocupa ningún día del plan: sin sesionIndex (así borrarla del perfil no desmarca la del plan).
            sesionIndex: extra ? null : diaIndex,
            ...(extra ? { sesionExtra: true } : {}),
            likes: [],
            likeCount: 0,
            likesLeidos: 0,
            zone: zonaFinal,
            fase: sesion.fase || 'BASE',
            trainingName: nombreFinal,
            desglose: metricas.desglose || null,
            calorias: metricas.calorias || null,
            // 🔥 v2.81: ritmo medio exacto de esta sesión (para recalcular el «mejor ritmo» al desmarcarla/eliminarla)
            ...(ritmoMedioEntrada ? { ritmoMedio: ritmoMedioEntrada } : {})
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
            // 🔥 v2.76: datos REALES de la sesión GPS (solo los envía
            // gps-tracker.js) para insignias de hora del día, ritmo y
            // velocidad. Solo se guardan si son números válidos.
            if (infoGPS) {
              const ini = Number(infoGPS.inicioTs), fin = Number(infoGPS.finTs);
              if (isFinite(ini) && isFinite(fin) && ini > 0 && fin >= ini) {
                entry.inicioRealTs = Math.round(ini);
                entry.finRealTs = Math.round(fin);
              }
              const vmax = Number(infoGPS.velocidadMaxKmh);
              if (isFinite(vmax) && vmax > 0) entry.velocidadMaxKmh = Math.round(vmax * 10) / 10;
              if (infoGPS.recordsPorTramo && Object.keys(infoGPS.recordsPorTramo).length > 0) {
                entry.recordsPorTramo = infoGPS.recordsPorTramo;
              }
            }
          } else {
            entry.hasGPS = false;
          }
          
          try {
            const globalRef = await firebaseServices.db.collection('globalFeed').add(entry);
            if (extra) {
              // gps-tracker.js lo lee de aquí (en una sesión normal lo lee del plan).
              this._ultimoWallEntryIdExtra = globalRef.id;
            } else {
              await planRef.update({ [`wallEntryId.${diaIndex}`]: globalRef.id });
            }
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
            // 🔥 El histórico de globalFeed acaba de cambiar de verdad
            // (esta sesión). Se invalida la caché compartida ANTES de
            // disparar las dos recargas de abajo, para que la primera
            // que llegue haga la lectura fresca (1 sola vez) y la otra
            // reutilice esa misma promesa en vez de servir datos viejos.
            if (window.PlanGenerator && typeof PlanGenerator.invalidarHistorialGlobalFeed === 'function') {
              PlanGenerator.invalidarHistorialGlobalFeed(AppState.currentUserId);
            }
            if (typeof window.precargarCargaPlan === 'function') {
              window.precargarCargaPlan();
            }
            // 🔥 Forma física (CTL/ATL/TSB) y zonas más usadas del dashboard
            // SOLO deben recalcularse cuando de verdad hay un cambio en el
            // historial del usuario -- y este (guardar una sesión) es
            // exactamente ese momento. El true fuerza el recálculo real
            // contra Firestore y actualiza la caché en memoria; el resto
            // de veces que se pinte el dashboard (p.ej. al volver a la
            // pestaña Inicio) se reutiliza esa caché sin volver a leer.
            if (typeof window.cargarFormaFisicaDashboard === 'function') {
              window.cargarFormaFisicaDashboard(true);
            }
            if (typeof window.cargarZonasUsadasDashboard === 'function') {
              window.cargarZonasUsadasDashboard(true);
            }
          } catch (err) {
            console.error('Error al guardar en muro:', err);
            Utils.showToast('Error al publicar en el muro', 'error');
          }
          
          let nivelDoble = null; // nivel del atleta tras guardar (para pintar el día en una sesión extra)
          if (window.Gamification) {
            try {
              // 🔥 v2.71: antes esto pedía Gamification.getData() ANTES y
              // DESPUÉS de updateAfterSession() -- dos lecturas completas
              // del documento 'gamification' del usuario, en una de las
              // acciones más frecuentes de toda la app (cada sesión que se
              // completa). updateAfterSession() ya calcula oldLevel/newLevel
              // internamente (su propia transacción los lee/escribe) y desde
              // gamification.js v5.15 los devuelve directamente -- ya no hace
              // falta volver a preguntarle nada a Firestore para saber si
              // hubo subida de nivel.
              metricas.fechaSesionReal = fechaSesionReal;
              // v2.85: id de la entrada recién publicada, para que Gamification sepa qué insignias gana ESTA sesión.
              metricas.entryId = entry.entryId || null;
              // 🔥 v2.76: hora real de inicio/fin (solo sesiones GPS).
              metricas.inicioRealTs = entry.inicioRealTs;
              metricas.finRealTs = entry.finRealTs;
              const gamResult = await Gamification.updateAfterSession(AppState.currentUserId, sesion, metricas);

              // Aviso de kilometraje de zapatillas (banner de tienda
              // patrocinadora incluido si hay alguna activa). Va en su
              // propio try/catch: si falla, no debe afectar al resto del
              // flujo de guardado de la sesión.
              if (window.Sponsors) {
                Sponsors.comprobarUmbralZapatilla(AppState.currentUserId)
                  .catch(e => console.warn('Error comprobando umbral de zapatillas:', e));
              }

              if (entry.entryId && gamResult) {
                try {
                  // 🔥 v2.81: además de las insignias, se guarda el XP EXACTO que dio la sesión para restarlo igual al desmarcarla.
                  const extraEntrada = {};
                  if (gamResult.gainedBadges?.length) extraEntrada.badgesGanadas = gamResult.gainedBadges;
                  if (Number.isFinite(gamResult.xpGanada)) extraEntrada.xpGanada = gamResult.xpGanada;
                  if (Object.keys(extraEntrada).length) {
                    await firebaseServices.db.collection('globalFeed').doc(entry.entryId).update(extraEntrada);
                  }
                } catch (e) { console.warn('No se pudo guardar badgesGanadas/xpGanada en el muro:', e); }
              }
              const oldLevel = gamResult?.oldLevel;
              const newLevel = gamResult?.level;
              nivelDoble = newLevel;
              if (newLevel !== oldLevel) {
                console.log(`🎉 Nivel cambiado de ${oldLevel} a ${newLevel}. Refrescando UI...`);
                if (Gamification.clearCache) await Gamification.clearCache(AppState.currentUserId);
                if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
                if (document.getElementById('subtab-amigos')?.classList.contains('active') && window.Friends) {
                  await Friends.cargarListaAmigos(true);
                  const activeAmigosTab = document.querySelector('.amigos-tab.active');
                  if (activeAmigosTab && /BUSCAR|SEARCH/i.test(activeAmigosTab.textContent)) await Friends.cargarTodosUsuarios(true);
                }
                // 🔥 v4.14: ya no hace falta refrescar el Muro a mano aquí --
                // desde que Wall usa un listener en tiempo real (onSnapshot,
                // ver wall.js), la propia publicación que se acaba de crear
                // en 'globalFeed' llega sola al Muro (con confirmación local
                // instantánea, sin ni siquiera esperar al servidor). Esta
                // llamada manual solo habría duplicado la lectura.
              }
            } catch (e) { console.error('Error actualizando gamificación:', e); }
          }
          // 🔥 v2.82: la sesión recién guardada (extra o del plan) aparece sola en «Mis últimos entrenamientos» del Perfil.
          // Antes esa lista solo se releía al entrar en la pestaña Perfil, así que si ya estaba pintada no cambiaba hasta
          // salir y volver. Se hace al final (tras gamificación) para que la lectura ya incluya insignias/XP de la entrada.
          if (entry.entryId && window.Profile && typeof Profile._actualizarMisEntrenamientos === 'function') {
            Profile._actualizarMisEntrenamientos().catch(e => console.warn('No se pudo refrescar el Perfil tras guardar la sesión:', e));
          }
          // 🔥 v2.78: al guardar una sesión EXTRA, el día se pinta del color del nivel del atleta.
          if (extra) await this._marcarDiaDoble(fechaSesionReal, nivelDoble);
        }
      } else {
        const planData = planDoc.data();
        const wallEntryId = planData?.wallEntryId?.[diaIndex];
        let distanciaReal = null;
        let badgesGanadasSesion = [];
        let entradaMuroBorrada = null;
        let zone4MinutesRemovidos = 0;
        let zone5MinutesRemovidos = 0;
        let xpGanadaEntrada = null;
        
        if (wallEntryId) {
          try {
            const wallDoc = await firebaseServices.db.collection('globalFeed').doc(wallEntryId).get();
            if (wallDoc.exists) {
              const wallData = wallDoc.data();
              entradaMuroBorrada = wallData;
              distanciaReal = wallData.distancia;
              badgesGanadasSesion = wallData.badgesGanadas || [];
              if (Number.isFinite(wallData.xpGanada)) xpGanadaEntrada = wallData.xpGanada;
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
          // 🔥 v2.80: rastro local y ruta GPS guardada de esa sesión (igual que al eliminarla desde el perfil).
          await this.limpiarRastroDeEntrada(wallEntryId, entradaMuroBorrada, AppState.planActualId, diaIndex);

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
          // 🔥 Mismo motivo que al guardar: el histórico acaba de cambiar
          // (esta vez porque se ha deshecho), así que la caché compartida
          // se invalida antes de disparar las dos recargas de abajo.
          if (window.PlanGenerator && typeof PlanGenerator.invalidarHistorialGlobalFeed === 'function') {
            PlanGenerator.invalidarHistorialGlobalFeed(AppState.currentUserId);
          }
          if (typeof window.precargarCargaPlan === 'function') {
            window.precargarCargaPlan();
          }
          // 🔥 Igual que al guardar: deshacer una sesión también cambia el
          // historial, así que forma física y zonas usadas deben
          // recalcularse de verdad aquí (true), no esperar a la próxima
          // vez que se abra Inicio.
          if (typeof window.cargarFormaFisicaDashboard === 'function') {
            window.cargarFormaFisicaDashboard(true);
          }
          if (typeof window.cargarZonasUsadasDashboard === 'function') {
            window.cargarZonasUsadasDashboard(true);
          }
        }
        
        // 🔥 v2.81: si al marcarla se usó EDITAR EN PROFUNDIDAD, la sesión del plan vuelve a lo planificado originalmente.
        // ('sesion' ya se leyó arriba, así que la gamificación de abajo se revierte con la misma sesión con la que se sumó.)
        if (sesion && sesion.planOriginal) {
          await this._restaurarSesionOriginal(AppState.planActualId, diaIndex);
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
              zone5Minutes: zone5MinutesRemovidos,
              ...(xpGanadaEntrada !== null ? { xpGanada: xpGanadaEntrada } : {})
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
      // 🔥 v11: bloques extra de carrera (zona propia, ver _desglosarSesion)
      if (Array.isArray(desglose.extras)) {
        desglose.extras.forEach(tramo => {
          if (!tramo || !tramo.min) return;
          const ifTramo = factoresIF[tramo.zona] || 0.7;
          tssAcumulado += tramo.min * ifTramo * ifTramo;
        });
      }
      return Math.round(tssAcumulado * this.FACTOR_ESCALA_TSS);
    }

    const ritmoBase = AppState.lastRitmoBase || 5;
    const distanciaEstimadaPorRitmo = duracionHoras * 60 / ritmoBase;
    // "factor" aproxima el Intensity Factor (ritmoBase / ritmo real). La
    // fórmula estándar de TSS es horas × IF² × 100 -- antes se aplicaba
    // "factor" sin elevarlo al cuadrado, así que este fallback (poco usado:
    // solo salta si _desglosarSesion no pudo construir un desglose válido)
    // sobreestimaba el TSS a intensidades bajas (factor<1) y lo
    // subestimaba a intensidades altas (factor>1) frente al resto de
    // fórmulas de TSS de la app.
    const factor = distanciaKm / Math.max(0.1, distanciaEstimadaPorRitmo);
    const tssBase = sesion.duracion || 45;
    return Math.round(tssBase * factor * factor * this.FACTOR_ESCALA_TSS);
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
  // 🔥 Señal específica para la rampa inicial de la tirada larga (ver
  // generarCalendarioEntreno): busca, dentro de una ventana de 90 días
  // (una tirada larga es semanal, no diaria -- los 28 días de la carga
  // crónica se quedarían cortos, solo captarían 3-4 oportunidades),
  // la tirada larga real más reciente (trainingType === 'largo', con
  // duración > 0) y devuelve una confianza 0-1 que combina:
  //  - factorCapacidad: cuánto de cerca estuvo esa tirada del techo de
  //    referencia de la semana 1 de este plan (1.0 si ya lo igualó o
  //    superó).
  //  - factorRecencia: 1.0 si fue hace 14 días o menos, decae de forma
  //    lineal hasta 0 hacia los 60 días (una tirada larga de hace dos
  //    meses ya no dice mucho sobre la forma actual).
  // Sin tiradas largas reales en la ventana -> devuelve 0 (rampa
  // completa), que es lo correcto: no hay nada que demuestre que el
  // cuerpo ya tolera ese tipo de sesión.
  _evaluarTiradaLargaReciente(historial, minutosReferencia) {
    if (!Array.isArray(historial) || !minutosReferencia) return 0;
    const ahora = new Date();
    let masReciente = null; // { duracion, dias }
    historial.forEach(d => {
      if (d.trainingType !== 'largo') return;
      const duracion = d.duration || 0;
      if (duracion <= 0) return;
      const rawFecha = d.fechaSesion || d.timestamp;
      if (!rawFecha) return;
      const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
      const dias = Math.floor((ahora - fecha) / 86400000);
      if (dias < 0 || dias > 90) return;
      if (!masReciente || dias < masReciente.dias) masReciente = { duracion, dias };
    });
    if (!masReciente) return 0;
    const factorRecencia = masReciente.dias <= 14 ? 1 : Math.max(0, 1 - (masReciente.dias - 14) / 46);
    const factorCapacidad = Math.min(1, masReciente.duracion / minutosReferencia);
    return factorCapacidad * factorRecencia;
  },

  async calcularCargaEntrenamiento(uid, diasCronica = 28, diasAguda = 7) {
    if (!uid) return null;
    try {
      // 🔥 FIX lecturas duplicadas: antes hacía aquí su propia consulta
      // con limit(120); ahora reutiliza la lectura compartida con
      // calcularFormaFisica (ver _obtenerHistorialGlobalFeed más arriba).
      // Trae hasta 200 documentos en vez de 120, pero eso no cambia el
      // resultado: el filtro de fecha de abajo (últimos diasCronica días)
      // sigue acotando igual, simplemente puede que ahora lleguen algunos
      // documentos de más que se descartan por estar fuera de ventana.
      const historial = await this._obtenerHistorialGlobalFeed(uid);

      const ahora = new Date(); ahora.setHours(0, 0, 0, 0);
      const desde = new Date(ahora);
      desde.setDate(desde.getDate() - (diasCronica - 1));

      const tssPorDia = {};
      historial.forEach(d => {
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
        clasificacion = 'Baja (posible pérdida de forma)'; color = 'var(--st-blue)'; riesgo = 'bajo';
      } else if (acwr <= 1.3) {
        clasificacion = 'Óptima'; color = 'var(--st-green)'; riesgo = 'optimo';
      } else if (acwr <= 1.5) {
        clasificacion = 'Elevada — vigila la recuperación'; color = 'var(--st-orange)'; riesgo = 'elevado';
      } else {
        clasificacion = 'Alto riesgo de lesión'; color = 'var(--st-red)'; riesgo = 'alto';
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
      // 🔥 FIX lecturas duplicadas: antes hacía aquí su propia consulta
      // con limit(200); ahora reutiliza la lectura compartida con
      // calcularCargaEntrenamiento (ver _obtenerHistorialGlobalFeed,
      // arriba del todo del objeto). Es la ventana más grande de las
      // dos, así que aquí no cambia nada más.
      const historial = await this._obtenerHistorialGlobalFeed(uid);

      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - (diasHistorial - 1));

      const tssPorDia = {};
      let sesionesEnVentana = 0;
      historial.forEach(d => {
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
        tendencia = 'subiendo'; tendenciaColor = 'var(--st-green)';
        tendenciaTexto = 'Tu forma física lleva semanas construyéndose. Sigue así.';
      } else if (deltaCTL < -2) {
        tendencia = 'bajando'; tendenciaColor = 'var(--st-red)';
        tendenciaTexto = 'Tu forma física está bajando: llevas un tiempo entrenando menos de lo habitual.';
      } else {
        tendencia = 'estable'; tendenciaColor = 'var(--text-secondary)';
        tendenciaTexto = 'Tu forma física está estable en las últimas semanas.';
      }

      let tsbEstado, tsbColor;
      if (ultimo.tsb > 25) { tsbEstado = 'Muy fresco: puede que estés descansando de más'; tsbColor = 'var(--st-blue)'; }
      else if (ultimo.tsb > 5) { tsbEstado = 'Fresco, buen momento para exigirte'; tsbColor = 'var(--st-green)'; }
      else if (ultimo.tsb > -10) { tsbEstado = 'Equilibrado'; tsbColor = 'var(--gold)'; }
      else if (ultimo.tsb > -30) { tsbEstado = 'En carga: fatiga controlada'; tsbColor = 'var(--st-orange)'; }
      else { tsbEstado = 'Fatiga alta: vigila el descanso'; tsbColor = 'var(--st-red)'; }

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
        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:14px; padding:10px 14px; margin:10px 0; font-size:12px; color:var(--text-secondary); text-align:center;">
          📊 Carga de entrenamiento (ACWR): registra más sesiones (mínimo ~10 en las últimas 4 semanas) para ver esta métrica.
        </div>`;
      return;
    }

    cont.style.display = 'block';
    const acwrTexto = carga.acwr !== null ? carga.acwr.toFixed(2) : '—';
    cont.innerHTML = `
      <div style="background:var(--bg-secondary); border:1px solid ${carga.color}; border-radius:14px; padding:12px 14px; margin:10px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="font-size:12px; color:var(--text-secondary);">
            ⚡ Carga aguda (7d): <strong style="color:var(--text-primary);">${carga.cargaAguda.toFixed(0)} TSS/día</strong>
            &nbsp;·&nbsp; Crónica (28d): <strong style="color:var(--text-primary);">${carga.cargaCronica.toFixed(0)} TSS/día</strong>
          </div>
          <div style="font-size:14px; font-weight:600; color:${carga.color};">
            ACWR ${acwrTexto} — ${carga.clasificacion}
          </div>
        </div>
      </div>`;
  },

  calcularRecuperacion(tss, tipo) {
    const factorTipo = { rodaje: 0.9, tempo: 1.0, series: 1.15, largo: 1.05, strength: 0.75 }[tipo] || 1.0;
    // La fuerza tiene su propio tope de 24h (como mucho "1 día" para poder
    // repetir fuerza) en vez de compartir el tope de 72h de las sesiones
    // de carrera -- ver comprobarFatigaAntesDeSesion, que además solo
    // avisa si se repite el MISMO grupo (fuerza no bloquea salir a correr).
    const tope = tipo === 'strength' ? 24 : 72;
    const horas = Math.min(tope, Math.max(8, Math.round((tss || 0) * 0.5 * factorTipo)));
    return horas;
  },

  calcularEstadoRecuperacionActual() {
    try {
      const ult = AppState.currentUserData?.ultimaSesion || null;
      if (!ult || ult.tss == null) return null;
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
      if (!silencioso) Utils.showToast("NO HAY USUARIO", 'error');
      return;
    }
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      const ultimoPlanId = userDoc.data()?.ultimoPlanId;
      if (!ultimoPlanId) {
        console.log('ℹ️ mostrarUltimoPlanGuardado: sin ultimoPlanId guardado (normal si nunca ha tenido plan)');
        if (!silencioso) Utils.showToast("NO HAY PLAN GUARDADO", 'error');
        return;
      }
      const planDoc = await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(ultimoPlanId)
        .get();
      if (!planDoc.exists) {
        console.warn('⚠️ ultimoPlanId apunta a un plan que ya no existe:', ultimoPlanId);
        if (!silencioso) Utils.showToast("EL PLAN YA NO EXISTE", 'error');
        return;
      }
      const planCompleto = planDoc.data();
      AppState.planGeneradoActual = planCompleto.params;
      AppState.planActualId = ultimoPlanId;
      AppState.planActualTipo = planCompleto.tipo || null;
      AppState.sesionesRealizadas = planCompleto.sesionesRealizadas || {};
      AppState.diasDobles = planCompleto.diasDobles || {};
      AppState.feedbackSesiones = planCompleto.feedback || {};
      this._cargasFusionar(planCompleto.cargas, planCompleto.propios);
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;
      document.getElementById("calendarioEntreno").style.display = "block";
      document.getElementById("cuestionarioEntreno").style.display = "none";
      // 🔥 FIX (petición del usuario): antes cortaba aquí con "Sin acceso"
      // si _puedeVerPlanActual() daba negativo, sin pintar ni el nombre
      // del plan ni el calendario -- y si el usuario se hacía premium (o
      // le hacían entrenador) con la app abierta, se quedaba así hasta
      // recargar. Ahora el nombre/resumen y el calendario se pintan
      // siempre; el control de acceso vive solo en abrirDetalleSesion()
      // (se comprueba en el momento del clic, con el AppState.isPremium
      // más reciente).
      const resumen = document.getElementById("resumenObjetivo");
      if (resumen) resumen.innerText = planCompleto.resumen || 'Plan cargado';
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = window.nombrePlanVisible ? window.nombrePlanVisible(planCompleto) : (planCompleto.nombrePlan || 'Mi plan');
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
      if (window.showPremiumBenefits) showPremiumBenefits('borrar-plan');
      else Utils.showToast("SOLO PREMIUM PUEDE ELIMINAR PLANES", 'error');
      return;
    }
    const confirmed = await Utils.confirm('ELIMINAR PLAN', "¿ELIMINAR PLAN GUARDADO?");
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
    } catch (error) {
      console.error('Error borrando plan:', error);
      Utils.showToast('Error al eliminar el plan', 'error');
      Utils.hideLoading();
      return;
    }
    // 🔥 FIX toast contradictorio: el plan ya está borrado de verdad en
    // este punto -- lo que sigue (refrescar el historial de planes) es
    // solo housekeeping. Antes iba dentro del mismo try/catch que el
    // borrado: si fallaba (un hipo de red al recargar el historial), se
    // veía "Error al eliminar el plan" encima del éxito, aunque el plan
    // SÍ se hubiera eliminado.
    Utils.showToast("✅ PLAN ELIMINADO", 'success');
    try {
      if (window.UI) {
        UI.guardarEstado();
        await UI.cargarHistorialPlanes();
      }
    } catch (error) {
      console.error('Error refrescando historial tras eliminar el plan:', error);
    } finally {
      Utils.hideLoading();
    }
  },

  toggleCuestionario() {
    const cuestionario = document.getElementById('cuestionarioEntreno');
    if (!cuestionario) return;
    const isVisible = cuestionario.style.display !== 'none';
    // Si el formulario está CERRADO y el usuario no es premium, no se
    // abre -- generar un plan nuevo sigue siendo solo premium. Se
    // muestra directamente el aviso de premium con el contacto de
    // Instagram. "CANCELAR" (que también llama a este método para
    // cerrar el formulario ya abierto) sigue funcionando igual para
    // cualquiera, sin pasar por este check.
    if (!isVisible && !AppState.isPremium) {
      if (window.showPremiumBenefits) showPremiumBenefits('nuevo-plan');
      else Utils.showToast('Premium necesario para generar un plan', 'warning');
      return;
    }
    cuestionario.style.display = isVisible ? 'none' : 'block';
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
    if (document.getElementById("modalidad")?.value === "gimnasio") {
      const m = document.getElementById("info-mensaje-distancia");
      if (m) m.style.display = "none";
      return;
    }
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
window.alternarModalidadPlan = () => PlanGenerator.alternarModalidadPlan();
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

console.log('✅ PlanGenerator v2.70 - Modal único CONFIRMAR / EDITAR EN PROFUNDIDAD + km sin bloques a 0');