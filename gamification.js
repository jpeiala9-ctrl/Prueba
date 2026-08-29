// ==================== gamification.js ====================
// Versión: 5.14 - AUDITORÍA DE INSIGNIAS:
//   1) FIX "Madrugador" colándose en sesiones de tarde: en
//      _recalcularDerivadosDesdeHistorial (se ejecuta al desmarcar
//      CUALQUIER sesión) el conteo usaba la hora de 'fechaSesion' --
//      heredada arbitrariamente de cuándo se generó el plan, no la hora
//      real -- en vez de la hora de 'timestamp' (momento real de marcar).
//      Eso podía inflar earlyBirdCount sin motivo real y hacer que una
//      sesión de tarde posterior recibiera igualmente la insignia.
//   2) ZONE_4_60/ZONE_5_30 pasan a alimentarse de datos reales
//      (metricas.zone4Minutes/zone5Minutes, calculados en calendar.js a
//      partir del desglose real de la sesión) en vez de quedarse siempre a
//      0; además ahora se restan correctamente en removeSession al
//      desmarcar, igual que el resto de contadores.
//   3) Se retiran ELEVATION_500/ELEVATION_1000: no hay ningún cálculo de
//      desnivel real en toda la app (ni se guarda altitud del GPS), así
//      que eran insignias permanentemente imposibles de conseguir.
// Versión: 5.13 - FIX ZONA HORARIA en el cálculo de la racha al marcar una
//                sesión (updateAfterSession): 'new Date(lastSessionDate)'
//                interpretaba esa fecha (guardada como "YYYY-MM-DD") como
//                medianoche UTC, mientras que 'now' es hora local -- el
//                desfase (España UTC+1/+2) podía hacer que entrenar de
//                madrugada no sumara racha, o que se rompiera una racha
//                real sin motivo. Ahora se comparan días de calendario
//                completos forzando medianoche LOCAL en ambas fechas,
//                igual que ya hacía _recalcularDerivadosDesdeHistorial.
//                De paso, se blinda el marcado de sesiones fuera de orden
//                (poniéndose al día con sesiones atrasadas): ya no se
//                retrocede lastSessionDate por error, lo que podía
//                desajustar el próximo cálculo de racha en caliente.
// Versión: 5.12 - RÉCORDS SOLO CON GPS REAL: se elimina por completo la
//                creación de récords extrapolados (sin GPS), tanto al
//                marcar una sesión a mano (updateAfterSession) como al
//                recalcular desde el historial al desmarcar
//                (_recalcularDerivadosDesdeHistorial). Un récord ahora
//                SOLO puede salir de un tramo medido de verdad por el
//                motor de GPS de la app (gps:true), y solo se conserva
//                mientras la sesión con GPS que lo puso siga existiendo:
//                cada sesión con GPS guarda su propio mejor tramo por
//                distancia en 'recordsPorTramo' (ver
//                calcularTramosSesion/gps-tracker.js), y el recálculo al
//                desmarcar/borrar toma el mínimo real entre las sesiones
//                con GPS que quedan -- sin estimaciones. Se añade además
//                autolimpieza (_limpiarRecordsNoGPS, en getData): cualquier
//                récord antiguo sin gps:true se elimina solo la primera
//                vez que se leen los datos de cada usuario. De paso,
//                removeSession reintenta una vez el recálculo si falla
//                (antes se rendía en silencio y dejaba racha/récords
//                desactualizados sin avisar).
// Versión: 5.10 - FIX RAÍZ de la racha: se calculaba con la fecha del
//                instante de marcar ('timestamp'/'new Date()'), no con
//                el día real de la sesión ('fechaSesion'/
//                metricas.fechaSesionReal). Ahora usa el día real tanto
//                al marcar (updateAfterSession) como al recalcular al
//                desmarcar (_recalcularDerivadosDesdeHistorial). De paso
//                se protegen los récords por tramo GPS (gps:true) para
//                que ese recálculo ya no los borre.
// Versión: 5.9 - Récords por tramo GPS: además del récord por sesión
//                completa, ahora busca dentro de cualquier carrera con
//                GPS el mejor tramo de 1/5/10/21.1/42.2 km, aunque sea
//                parte de una carrera más larga (ver actualizarRecordsPorTramos)
// Versión: 5.8 - Recalculo de racha/récords desde el historial real al desmarcar/borrar una sesión (antes se quedaban "pegados" arriba para siempre)
// ====================

const Gamification = {
  // ========== INSIGNIAS ==========
  BADGES: {
    FIRST_SESSION: { id: 'FIRST_SESSION', name: 'Primer entrenamiento', description: 'Completaste tu primera sesión', xp: 50, icon: '🏁' },
    FIRST_WEEK: { id: 'FIRST_WEEK', name: 'Primera semana', description: 'Completaste tu primera semana', xp: 100, icon: '📅' },
    FIRST_MONTH: { id: 'FIRST_MONTH', name: 'Primer mes', description: 'Completaste tu primer mes', xp: 300, icon: '🏅' },
    DISTANCE_100: { id: 'DISTANCE_100', name: '100 km', description: 'Acumulaste 100 km', xp: 200, icon: '📏' },
    DISTANCE_500: { id: 'DISTANCE_500', name: '500 km', description: 'Acumulaste 500 km', xp: 800, icon: '🌟' },
    DISTANCE_1000: { id: 'DISTANCE_1000', name: '1000 km', description: 'Acumulaste 1000 km', xp: 1500, icon: '🏆' },
    SESSIONS_10: { id: 'SESSIONS_10', name: '10 entrenamientos', description: 'Completaste 10 sesiones', xp: 150, icon: '🎯' },
    SESSIONS_50: { id: 'SESSIONS_50', name: '50 entrenamientos', description: 'Completaste 50 sesiones', xp: 600, icon: '🏆' },
    SESSIONS_100: { id: 'SESSIONS_100', name: '100 entrenamientos', description: 'Completaste 100 sesiones', xp: 1200, icon: '🎖️' },
    STREAK_7: { id: 'STREAK_7', name: 'Racha de 7 días', description: 'Entrenaste una semana seguida', xp: 70, icon: '🔥' },
    STREAK_30: { id: 'STREAK_30', name: 'Racha de 30 días', description: 'Un mes entero entrenando', xp: 300, icon: '💪' },
    STREAK_100: { id: 'STREAK_100', name: 'Racha de 100 días', description: '100 días seguidos', xp: 1200, icon: '🏆' },
    PACE_SUB5: { id: 'PACE_SUB5', name: 'Ritmo < 5:00/km', description: 'Bajaste de 5:00/km', xp: 100, icon: '⚡' },
    PACE_SUB4: { id: 'PACE_SUB4', name: 'Ritmo < 4:00/km', description: 'Bajaste de 4:00/km', xp: 200, icon: '🚀' },
    SPEED_20: { id: 'SPEED_20', name: '20 km/h', description: 'Alcanzaste 20 km/h', xp: 60, icon: '💨' },
    SPEED_30: { id: 'SPEED_30', name: '30 km/h', description: 'Velocidad de sprint', xp: 250, icon: '🦅' },
    // ELEVATION_500/ELEVATION_1000 ELIMINADAS (auditoría de insignias):
    // ningún punto del código mide el desnivel real (ni gps-tracker.js
    // guarda altitud de los puntos GPS, ni existe otro cálculo de metros
    // de subida), así que 'totalElevationGain' se quedaba siempre a 0 y
    // estas dos insignias eran matemáticamente imposibles de conseguir.
    // Implementarlas "bien" exigiría fiarse de la altitud del GPS del
    // móvil, que es mucho más ruidosa que la posición (errores típicos de
    // ±10-50 m), con alto riesgo de dar insignias de desnivel por puro
    // ruido del sensor -- el mismo problema de fondo que se está
    // corrigiendo en esta auditoría (insignias por el motivo equivocado),
    // así que se retiran en vez de arriesgarse a eso.
    ZONE_4_60: { id: 'ZONE_4_60', name: '60 min en Z4', description: 'Acumulaste 60 minutos en zona 4', xp: 300, icon: '❤️' },
    ZONE_5_30: { id: 'ZONE_5_30', name: '30 min en Z5', description: 'Acumulaste 30 minutos en zona 5', xp: 500, icon: '💜' },
    LONG_RUN_10: { id: 'LONG_RUN_10', name: '10 tiradas largas', description: '10 sesiones largas', xp: 200, icon: '🚶‍♂️' },
    INTERVALS_10: { id: 'INTERVALS_10', name: '10 series', description: '10 sesiones de series', xp: 250, icon: '⚡' },
    STRENGTH_10: { id: 'STRENGTH_10', name: '10 fuerza', description: '10 sesiones de fuerza', xp: 100, icon: '💪' },
    SUNDAY_RUNNER: { id: 'SUNDAY_RUNNER', name: 'Dominguero', description: 'Entrenaste un domingo', xp: 20, icon: '☀️' },
    EARLY_BIRD: { id: 'EARLY_BIRD', name: 'Madrugador', description: 'Entrenaste antes de las 6:00', xp: 30, icon: '🌅' },
    TEN_K: { id: 'TEN_K', name: '10 km', description: 'Corriste 10 km en una sesión', xp: 100, icon: '🏃‍♀️' },
    MARATHON: { id: 'MARATHON', name: 'Maratón', description: 'Completaste 42.2 km', xp: 500, icon: '🏅' },
    MONTH_STREAK_6: { id: 'MONTH_STREAK_6', name: '6 meses seguidos', description: 'Medio año entrenando cada mes', xp: 400, icon: '📆' },
    FIRST_GPS: { id: 'FIRST_GPS', name: 'GPS activado', description: 'Usaste el GPS por primera vez', xp: 25, icon: '📍' }
  },

  LEVELS_KM: [
    { level: 1, kmNeeded: 0 },
    { level: 2, kmNeeded: 50 },
    { level: 3, kmNeeded: 120 },
    { level: 4, kmNeeded: 250 },
    { level: 5, kmNeeded: 500 },
    { level: 6, kmNeeded: 700 },
    { level: 7, kmNeeded: 850 },
    { level: 8, kmNeeded: 950 },
    { level: 9, kmNeeded: 990 },
    { level: 10, kmNeeded: 1050 }
  ],

  // Escala de 10 colores, del 1 (gris) al 10 (morado), pasando por azul,
  // verde, amarillo, naranja y rojo — tonos suaves, no muy intensos.
  getColorByLevel(level) {
    const colors = {
      1: '#9e9e9e', 2: '#7fa1c9', 3: '#6bb3ae', 4: '#7fb37a',
      5: '#a9bd6a', 6: '#cbb15f', 7: '#cf9760', 8: '#c97b5f',
      9: '#bd6688', 10: '#9270c9'
    };
    if (level > 10) return colors[10];
    return colors[level] || colors[1];
  },

  // Aplica el color del nivel a la variable CSS global --notification-color,
  // de la que cuelgan todas las notificaciones de la app (badges de no
  // leídos, insignias "NUEVO", nombres de chat sin leer, etc). Así cada
  // usuario ve las notificaciones en el color de SU propio nivel en vez
  // del naranja fijo de antes. Se guarda también en localStorage para
  // poder pintarlo al instante en la pantalla de login, antes de que
  // Firestore responda con el nivel real.
  applyNotificationColor(level) {
    try {
      const color = this.getColorByLevel(level || 1);
      document.documentElement.style.setProperty('--notification-color', color);
      localStorage.setItem('ri5_lastLevel', level || 1);
    } catch (e) {}
  },

  async clearCache(uid) {
    if (!uid) return;
    try {
      sessionStorage.removeItem(`gamification_${uid}`);
      localStorage.removeItem(`gamification_${uid}`);
      console.log('🗑️ Caché de gamificación limpiada para', uid);
    } catch (e) { console.warn(e); }
  },

  // Lectura SÍNCRONA de los datos de gamificación ya en caché (sessionStorage),
  // sin ir a Firestore. Se usa para pintar de golpe, sin parpadeo de
  // "Cargando…", pantallas que solo necesitan una foto rápida de los datos
  // (p.ej. el modal de récords de Profile.abrirModalRecords). Si no hay
  // nada en caché o está corrupto, devuelve null y quien llama debe caer
  // de vuelta a getData(uid).
  getCached(uid) {
    if (!uid) return null;
    try {
      const raw = sessionStorage.getItem(`gamification_${uid}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  calculateXP(sesion, metricas) {
    let xp = 0;
    if (sesion.duracion) xp += sesion.duracion;
    if (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) {
      xp += metricas.distanciaTotal * 10;
    }
    const tipo = sesion.tipo;
    if (tipo === 'series') xp += 25;
    else if (tipo === 'tempo') xp += 20;
    else if (tipo === 'largo') xp += 30;
    else if (tipo === 'strength') xp += 15;
    else if (tipo === 'rodaje') xp += 10;
    return Math.floor(xp);
  },

  async getData(uid) {
    if (!uid) return this.getDefaultData();
    try {
      const doc = await firebaseServices.db.collection('gamification').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        return await this._limpiarRecordsNoGPS(uid, data);
      }
      const defaultData = this.getDefaultData();
      await firebaseServices.db.collection('gamification').doc(uid).set(defaultData);
      console.log('✅ Documento de gamificación creado para', uid);
      return defaultData;
    } catch (error) {
      console.error('Error obteniendo datos de gamificación:', error);
      return this.getDefaultData();
    }
  },

  // Autolimpieza de récords antiguos NO válidos: antes del cambio a
  // "récords solo con GPS", personalRecords podía contener marcas
  // extrapoladas (sin r.gps === true) creadas al marcar una sesión a mano
  // o al recalcular desde el historial con el método antiguo. Cada vez
  // que se leen los datos de gamificación de alguien, se filtran esas
  // marcas inválidas; si de verdad había alguna, se persiste la versión
  // limpia una sola vez (las siguientes lecturas ya no encontrarán nada
  // que limpiar). No hace falta ninguna migración manual: se autocorrige
  // sola la primera vez que cada usuario abre la app tras la actualización.
  async _limpiarRecordsNoGPS(uid, data) {
    const records = data.personalRecords || {};
    const claves = Object.keys(records);
    const limpios = {};
    let huboLimpieza = false;
    claves.forEach(key => {
      if (records[key] && records[key].gps === true) {
        limpios[key] = records[key];
      } else {
        huboLimpieza = true;
      }
    });
    if (!huboLimpieza) return data;
    try {
      await firebaseServices.db.collection('gamification').doc(uid).set({ personalRecords: limpios }, { merge: true });
      console.log('🧹 Récords antiguos sin GPS eliminados para', uid);
    } catch (e) {
      console.warn('No se pudieron limpiar los récords antiguos sin GPS:', e);
    }
    return { ...data, personalRecords: limpios };
  },

  getDefaultData() {
    return {
      totalXP: 0,
      level: 1,
      badges: [],
      totalDistance: 0,
      totalSessions: 0,
      lastSessionDate: null,
      lastUpdate: firebaseServices.Timestamp.now(),
      currentShoe: { name: 'Zapatilla actual', km: 0 },
      shoeHistory: [],
      streakDays: 0,
      bestPace: null,
      maxSpeed: 0,
      totalZone4Minutes: 0,
      totalZone5Minutes: 0,
      countLongRuns: 0,
      countIntervals: 0,
      countStrengthRuns: 0,
      daysOfWeek: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
      earlyBirdCount: 0,
      maxDistanceSingle: 0,
      monthStreak: 0,
      lastMonth: null,
      firstGPSEver: false,
      bestStreakDays: 0,
      personalRecords: {}
    };
  },

  // Distancias estándar para las que se guarda "mejor marca" (récord
  // personal). Dos vías las alimentan:
  //  1) Sesiones SIN GPS (o con distancia corregida a mano): cuenta si la
  //     distancia total llega al menos a la distancia estándar (sin
  //     margen), y el tiempo del récord se extrapola por ritmo medio a
  //     esa distancia exacta -- no se usa el tiempo total de la sesión
  //     completa si corriste más de lo necesario (ver updateAfterSession).
  //  2) Sesiones CON GPS: se analiza el recorrido entero y se busca, DENTRO
  //     de él, el tramo más rápido que mida exactamente cada distancia
  //     estándar -- igual que hace Strava con los "mejores esfuerzos". Por
  //     ejemplo, una carrera de 10 km con GPS puede batir a la vez el
  //     récord de 1 km, el de 5 km y el de 10 km, cada uno con su propio
  //     tramo dentro de esa misma carrera (ver actualizarRecordsPorTramos).
  RECORD_DISTANCES: [1, 5, 10, 21.1, 42.2],

  // Haversine en metros (duplicado a propósito del que ya existe en
  // GPSTracker._haversine: se evita depender de que gps-tracker.js esté
  // cargado para poder usar esta función desde cualquier sitio).
  _haversineM(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  // Busca, dentro de un recorrido GPS completo (trackPoints con {lat,lng,ts}
  // en orden cronológico), el tramo más rápido que mida exactamente
  // distanciaKm. Recorre el track una sola vez con dos punteros (el track
  // ya viene ordenado por distancia acumulada creciente), e interpola el
  // instante exacto en el que se completa esa distancia entre los dos
  // puntos GPS que la rodean, para no depender de que un punto caiga
  // justo en el kilómetro exacto. Devuelve null si el recorrido no llega
  // a esa distancia.
  _mejorTramo(trackPoints, distanciaKm) {
    const n = trackPoints.length;
    if (n < 2) return null;
    const distObjetivoM = distanciaKm * 1000;

    // Distancia acumulada (metros) hasta cada punto, empezando en 0.
    const cum = new Array(n).fill(0);
    for (let k = 1; k < n; k++) {
      cum[k] = cum[k - 1] + this._haversineM(
        trackPoints[k - 1].lat, trackPoints[k - 1].lng,
        trackPoints[k].lat, trackPoints[k].lng
      );
    }
    if (cum[n - 1] < distObjetivoM) return null; // el recorrido no llega a esa distancia

    let mejorMs = Infinity;
    let mejorInicio = null;
    let j = 0;
    for (let i = 0; i < n; i++) {
      if (j < i) j = i;
      while (j < n - 1 && (cum[j] - cum[i]) < distObjetivoM) j++;
      if ((cum[j] - cum[i]) < distObjetivoM) break; // ya no caben más tramos completos desde aquí
      let tFin;
      if (j === i) {
        continue; // distancia 0, no aplica
      } else if ((cum[j - 1] - cum[i]) >= distObjetivoM) {
        tFin = trackPoints[j - 1].ts;
      } else {
        const distAntes = cum[j - 1] - cum[i];
        const distDespues = cum[j] - cum[i];
        const frac = (distObjetivoM - distAntes) / ((distDespues - distAntes) || 1);
        tFin = trackPoints[j - 1].ts + frac * (trackPoints[j].ts - trackPoints[j - 1].ts);
      }
      const duracionMs = tFin - trackPoints[i].ts;
      if (duracionMs > 0 && duracionMs < mejorMs) {
        mejorMs = duracionMs;
        mejorInicio = trackPoints[i].ts;
      }
    }
    if (!isFinite(mejorMs)) return null;
    return { durationMs: Math.round(mejorMs), inicioTs: mejorInicio };
  },

  // Calcula, para TODAS las distancias estándar que un recorrido GPS
  // llegue a cubrir, el mejor tramo dentro de ese recorrido (independiente
  // de si bate o no el récord ya guardado). Es una función PURA (no toca
  // Firestore): se usa tanto para decidir si se bate un récord como para
  // guardar, junto a la propia sesión en el muro, "lo que esta sesión
  // concreta demostró" -- así, más adelante, si se desmarca/borra otra
  // sesión distinta, se puede recalcular el récord global de verdad sin
  // tener que volver a guardar el track completo con marcas de tiempo (que
  // no se persisten en Firestore por peso). Devuelve un mapa
  // { "1": {durationMs}, "5": {durationMs}, ... } solo con las distancias
  // que el recorrido llega a cubrir.
  calcularTramosSesion(trackPoints) {
    const tramos = {};
    if (!trackPoints || trackPoints.length < 2) return tramos;
    if (!trackPoints[0] || typeof trackPoints[0].ts !== 'number') return tramos;
    this.RECORD_DISTANCES.forEach(d => {
      const tramo = this._mejorTramo(trackPoints, d);
      if (tramo) tramos[String(d)] = { durationMs: tramo.durationMs };
    });
    return tramos;
  },

  // Se llama justo al finalizar y guardar una sesión CON GPS (ver
  // gps-tracker.js _guardarYPublicar), con el recorrido completo en
  // memoria (con ts por punto, antes de decimar/guardar en Firestore).
  // Calcula el mejor tramo de cada distancia estándar que el recorrido
  // llegue a cubrir y, si bate el récord ya guardado, lo actualiza -- pero
  // SOLO si esta sesión fue realizada de verdad con el motor de GPS (se
  // exige un track con marcas de tiempo reales por punto, ver
  // calcularTramosSesion). No toca los récords que no mejora. Devuelve
  // { mejorados, tramosSesion }: la lista de distancias en las que se ha
  // batido récord (para avisar al usuario) y el mapa completo de tramos de
  // ESTA sesión (para que gps-tracker.js lo guarde junto a la entrada del
  // muro y así, si más adelante se desmarca otra sesión distinta, el
  // récord global se pueda recalcular de forma 100% fiable a partir de
  // sesiones con GPS real, sin depender de estimaciones).
  async actualizarRecordsPorTramos(uid, trackPoints) {
    const tramosSesion = this.calcularTramosSesion(trackPoints);
    if (uid !== AppState.currentUserId && !AppState.isAdmin) return { mejorados: [], tramosSesion };
    if (Object.keys(tramosSesion).length === 0) return { mejorados: [], tramosSesion };
    try {
      const oldData = await this.getData(uid);
      const personalRecords = { ...(oldData.personalRecords || {}) };
      const mejorados = [];
      const ahoraISO = new Date().toISOString();

      Object.entries(tramosSesion).forEach(([key, tramo]) => {
        const actual = personalRecords[key];
        if (!actual || tramo.durationMs < actual.durationMs) {
          personalRecords[key] = {
            durationMs: tramo.durationMs,
            distanciaKm: parseFloat(key),
            fecha: ahoraISO,
            gps: true
          };
          mejorados.push(parseFloat(key));
        }
      });

      if (mejorados.length > 0) {
        await firebaseServices.db.collection('gamification').doc(uid).set({ personalRecords }, { merge: true });
      }
      return { mejorados, tramosSesion };
    } catch (e) {
      console.warn('No se pudieron actualizar los récords por tramos GPS:', e);
      return { mejorados: [], tramosSesion };
    }
  },

  getLevelByDistance(distance) {
    let level = 1;
    for (let i = this.LEVELS_KM.length - 1; i >= 0; i--) {
      if (distance >= this.LEVELS_KM[i].kmNeeded) {
        level = this.LEVELS_KM[i].level;
        break;
      }
    }
    return level;
  },

  getProgressToNextLevel(distance) {
    const currentLevel = this.getLevelByDistance(distance);
    const nextLevel = this.LEVELS_KM.find(l => l.level === currentLevel + 1);
    if (!nextLevel) return 100;
    const currentLevelMinKM = this.LEVELS_KM.find(l => l.level === currentLevel).kmNeeded;
    const kmInLevel = distance - currentLevelMinKM;
    const kmNeeded = nextLevel.kmNeeded - currentLevelMinKM;
    return Math.min(100, Math.floor((kmInLevel / kmNeeded) * 100));
  },

  async getCurrentShoe(uid) {
    const data = await this.getData(uid);
    return data.currentShoe;
  },

  async getShoeHistory(uid) {
    const data = await this.getData(uid);
    return data.shoeHistory || [];
  },

  async setCurrentShoe(uid, newShoeName) {
    if (!uid || !newShoeName) return false;
    try {
      const data = await this.getData(uid);
      const oldShoe = data.currentShoe || { name: 'Zapatilla actual', km: 0 };
      if (oldShoe.name !== 'Zapatilla actual' || oldShoe.km > 0) {
        const historyEntry = {
          name: oldShoe.name,
          km: oldShoe.km,
          changedAt: new Date().toISOString()
        };
        const newHistory = [...(data.shoeHistory || []), historyEntry];
        if (newHistory.length > 15) newHistory.shift();
        await firebaseServices.db.collection('gamification').doc(uid).update({
          currentShoe: { name: newShoeName, km: 0 },
          shoeHistory: newHistory
        });
      } else {
        await firebaseServices.db.collection('gamification').doc(uid).update({
          currentShoe: { name: newShoeName, km: 0 }
        });
      }
      return true;
    } catch (error) {
      console.error('Error al cambiar zapatilla:', error);
      return false;
    }
  },

  async addKilometersToShoe(uid, km) {
    if (!uid || !km || km <= 0) return;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      await docRef.update({ 'currentShoe.km': firebaseServices.FieldValue.increment(km) });
    } catch (error) {
      console.error('Error sumando km a la zapatilla:', error);
    }
  },

  async removeKilometersFromShoe(uid, km) {
    if (!uid || !km || km <= 0) return;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      await docRef.update({ 'currentShoe.km': firebaseServices.FieldValue.increment(-km) });
    } catch (error) {
      console.error('Error restando km a la zapatilla:', error);
    }
  },

  async updateAfterSession(uid, sesion, metricas) {
    if (uid !== AppState.currentUserId && !AppState.isAdmin) {
      console.warn('Intento de modificar gamificación ajena bloqueado');
      return null;
    }
    if (!uid) return null;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      const xpGained = this.calculateXP(sesion, metricas);
      const distance = (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) ? metricas.distanciaTotal : 0;

      // BUG CORREGIDO (encontrado simulando marcados concurrentes): antes
      // se leía oldData, se calculaba todo en memoria y se escribía al
      // final por separado -- si el mismo usuario marcaba dos sesiones
      // completadas casi a la vez (dos pestañas, o muy rápido seguido), la
      // segunda escritura podía pisar a la primera con datos ya
      // desactualizados, perdiendo en silencio el XP/racha/insignias de la
      // primera. runTransaction es la herramienta de Firestore para esto
      // exacto: si el documento cambia entre la lectura y la escritura,
      // repite automáticamente todo este cálculo con los datos frescos, en
      // vez de dejar que la segunda escritura gane a ciegas. Los efectos
      // secundarios (sumar km a la zapatilla, mostrar el toast de subida
      // de nivel, el confeti) se hacen DESPUÉS de que la transacción
      // termine, nunca dentro: si se reintentase, esas acciones se
      // repetirían tantas veces como reintentos hubiera.
      const resultado = await firebaseServices.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const oldData = doc.exists ? doc.data() : this.getDefaultData();
        // Fecha que cuenta para la racha/día de la semana/mes: el día REAL
        // de la sesión (metricas.fechaSesionReal, el día del plan), no el
        // instante en que se pulsa el check. Antes se usaba siempre 'new
        // Date()' (el momento de marcar): si te ponías al día marcando hoy
        // una sesión de hace unos días, esa sesión contaba como si hubiera
        // sido "hoy" para la racha, rompiéndola o inflándola según el
        // orden en que se fueran marcando. Con fecha real, un hueco sigue
        // siendo un hueco y una racha real sigue contando como tal, se
        // marque en el orden que se marque.
        const now = (metricas && metricas.fechaSesionReal instanceof Date && !isNaN(metricas.fechaSesionReal))
          ? metricas.fechaSesionReal
          : new Date();
        const todayStr = now.toLocaleDateString('en-CA');

        let streak = (oldData.streakDays || 0);
        // lastSessionDateFinal es lo que se acaba guardando en Firestore.
        // Por defecto avanza a la fecha de esta sesión, salvo en el caso de
        // marcado fuera de orden (ver más abajo), donde se mantiene la
        // fecha más reciente que ya había.
        let lastSessionDateFinal = todayStr;
        if (oldData.lastSessionDate) {
          // FIX ZONA HORARIA: comparamos DÍAS DE CALENDARIO, no milisegundos
          // en crudo. Antes 'new Date(oldData.lastSessionDate)' -- una
          // cadena tipo "2026-08-14" sin hora -- se interpretaba como
          // medianoche UTC, mientras que 'now' es hora LOCAL (España,
          // UTC+1/+2). Ese desfase de 1-2h podía hacer que entrenar de
          // madrugada saliera con diffDays=0 en vez de 1 (la racha no
          // subía aunque fuera un día consecutivo real), o que se rompiera
          // una racha real por el motivo contrario. Forzamos medianoche
          // LOCAL en ambas fechas con 'T00:00:00', igual que ya hace
          // _recalcularDerivadosDesdeHistorial más abajo en este mismo
          // archivo, para que el cálculo sea consistente en los dos sitios.
          const lastDateLocal = new Date(oldData.lastSessionDate + 'T00:00:00');
          const todayLocal = new Date(todayStr + 'T00:00:00');
          const diffDays = Math.round((todayLocal - lastDateLocal) / 86400000);

          if (diffDays === 1) {
            streak++;
          } else if (diffDays > 1) {
            streak = 1;
          } else if (diffDays < 0) {
            // Se está marcando una sesión con fecha ANTERIOR a la última ya
            // registrada (p.ej. te pones al día marcando sesiones atrasadas
            // fuera de orden). Con un solo dato (lastSessionDate) no se
            // puede recalcular la racha de forma fiable aquí -- se deja tal
            // cual estaba y, sobre todo, NO se retrocede lastSessionDate:
            // si se sobreescribiera con esta fecha más antigua, el próximo
            // check en tiempo real compararía contra la fecha equivocada y
            // podría romper o inflar la racha sin motivo real. Si el orden
            // de marcado deja la racha desajustada del todo, se corrige
            // sola en cuanto se desmarque cualquier sesión (ver
            // _recalcularDerivadosDesdeHistorial, que sí mira el historial
            // completo).
            lastSessionDateFinal = oldData.lastSessionDate;
          }
          // diffDays === 0: segunda sesión el mismo día real -- la racha no cambia.
        } else {
          streak = 1;
        }

        let bestPace = oldData.bestPace;
        if (metricas && metricas.bestPace && metricas.bestPace > 0)
          if (!bestPace || metricas.bestPace < bestPace) bestPace = metricas.bestPace;

        let maxSpeed = oldData.maxSpeed || 0;
        if (metricas && metricas.maxSpeed && metricas.maxSpeed > maxSpeed) maxSpeed = metricas.maxSpeed;

        let totalZ4 = (oldData.totalZone4Minutes || 0) + (metricas?.zone4Minutes || 0);
        let totalZ5 = (oldData.totalZone5Minutes || 0) + (metricas?.zone5Minutes || 0);

        let countLong = oldData.countLongRuns || 0;
        let countIntervals = oldData.countIntervals || 0;
        let countStrength = oldData.countStrengthRuns || 0;
        if (sesion.tipo === 'largo') countLong++;
        else if (sesion.tipo === 'series') countIntervals++;
        else if (sesion.tipo === 'strength') countStrength++;

        const dayOfWeek = now.getDay();
        // BUG CORREGIDO: la hora para "Madrugador" (EARLY_BIRD) se leía de
        // 'now' -- que aquí es 'fechaSesionReal', el DÍA del plan (fecha de
        // inicio del plan + días transcurridos), NO el momento real en que
        // se entrenó. Esa fecha se construye sumando días enteros a la hora
        // en que se generó el plan (calendar.js), así que su componente de
        // HORA es un resto arbitrario de cuando se creó el plan -- puede
        // caer por debajo de las 6:00 sin que eso tenga nada que ver con la
        // hora real de ningún entrenamiento futuro. Resultado: cualquier
        // plan generado de madrugada (o cuya hora heredada cayera <6:00)
        // podía dar la insignia "Madrugador" a la primera sesión que se
        // marcase, se hiciera a la hora que se hiciera (a un usuario le
        // saltó marcando una sesión de fuerza a las 2 de la tarde). El día
        // de la semana (arriba, dayOfWeek) SÍ tiene sentido sacarlo de
        // fechaSesionReal -- es una propiedad real del día en que tocaba
        // esa sesión. La HORA no: no hay ninguna hora real registrada para
        // sesiones marcadas a mano, así que se usa el momento real en que
        // se pulsa "marcar" (el mejor dato real disponible: para sesiones
        // con GPS coincide con el final de la propia carrera; para
        // sesiones marcadas a mano, es cuando el usuario dice "esto ya lo
        // hice", no una fecha de hace días reinterpretada como si fuese
        // ahora mismo).
        const horaReal = new Date().getHours();
        let daysOfWeek = oldData.daysOfWeek || { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
        daysOfWeek[dayOfWeek] = true;
        let earlyBirdCount = oldData.earlyBirdCount || 0;
        if (horaReal < 6) earlyBirdCount++;

        let maxDistSingle = Math.max(oldData.maxDistanceSingle || 0, distance);

        // Racha máxima histórica (distinta de 'streak', que es la racha
        // ACTUAL y puede bajar a 1 si se rompe). Esta solo puede subir o
        // quedarse igual, nunca bajar al marcar una sesión nueva.
        let bestStreakDays = Math.max(oldData.bestStreakDays || 0, streak);

        // Récord personal por distancia estándar (ver RECORD_DISTANCES):
        // ANTES esta sesión (con o sin GPS) podía "inventar" un récord
        // extrapolando el tiempo por ritmo medio. Eso ya no se hace aquí:
        // para que un récord sea válido, la sesión tiene que haberse hecho
        // de verdad con el motor de GPS de la app, y el tiempo tiene que ser
        // el medido tramo a tramo por el propio GPS (ver
        // actualizarRecordsPorTramos / gps-tracker.js), nunca una estimación.
        // Este marcado manual (con o sin corrección de km/tiempo a mano) NO
        // toca personalRecords en absoluto -- solo actualiza XP, distancia,
        // nivel, insignias y racha, que sí tiene sentido contar aunque no
        // haya GPS.
        let personalRecords = { ...(oldData.personalRecords || {}) };

        const currentMonth = now.toISOString().slice(0, 7);
        let monthStreak = oldData.monthStreak || 0;
        let lastMonth = oldData.lastMonth;
        if (!lastMonth) {
          monthStreak = 1;
          lastMonth = currentMonth;
        } else if (lastMonth !== currentMonth) {
          const lastMonthDate = new Date(lastMonth + '-01');
          const currentMonthDate = new Date(currentMonth + '-01');
          const diffMonths = (currentMonthDate.getFullYear() - lastMonthDate.getFullYear()) * 12 + (currentMonthDate.getMonth() - lastMonthDate.getMonth());
          if (diffMonths === 1) monthStreak++;
          else if (diffMonths > 1) monthStreak = 1;
          lastMonth = currentMonth;
        }

        let firstGPS = oldData.firstGPSEver;
        if (!firstGPS && metricas?.gpsUsed) firstGPS = true;

        const newTotalDistance = (oldData.totalDistance || 0) + distance;
        const newLevel = this.getLevelByDistance(newTotalDistance);
        const newTotalSessions = (oldData.totalSessions || 0) + 1;

        const currentBadges = oldData.badges || [];
        const newBadges = [...currentBadges];

        const badgeChecks = {
          FIRST_SESSION: () => newTotalSessions >= 1,
          FIRST_WEEK: () => newTotalSessions >= 7,
          FIRST_MONTH: () => newTotalSessions >= 30,
          DISTANCE_100: () => newTotalDistance >= 100,
          DISTANCE_500: () => newTotalDistance >= 500,
          DISTANCE_1000: () => newTotalDistance >= 1000,
          SESSIONS_10: () => newTotalSessions >= 10,
          SESSIONS_50: () => newTotalSessions >= 50,
          SESSIONS_100: () => newTotalSessions >= 100,
          STREAK_7: () => streak >= 7,
          STREAK_30: () => streak >= 30,
          STREAK_100: () => streak >= 100,
          PACE_SUB5: () => bestPace !== null && bestPace < 5,
          PACE_SUB4: () => bestPace !== null && bestPace < 4,
          SPEED_20: () => maxSpeed >= 20,
          SPEED_30: () => maxSpeed >= 30,
          ZONE_4_60: () => totalZ4 >= 60,
          ZONE_5_30: () => totalZ5 >= 30,
          LONG_RUN_10: () => countLong >= 10,
          INTERVALS_10: () => countIntervals >= 10,
          STRENGTH_10: () => countStrength >= 10,
          SUNDAY_RUNNER: () => daysOfWeek[0],
          EARLY_BIRD: () => earlyBirdCount >= 1,
          TEN_K: () => maxDistSingle >= 10,
          MARATHON: () => maxDistSingle >= 42.2,
          MONTH_STREAK_6: () => monthStreak >= 6,
          FIRST_GPS: () => firstGPS === true
        };

        // El XP de cada insignia (badge.xp) se suma SOLO en el momento en
        // que esa insignia se desbloquea por primera vez -- de ahora en
        // adelante. Antes se definía el valor (y se prometía en el
        // tooltip: "+25 XP") pero nunca llegaba a sumarse a totalXP. No se
        // aplica en retroactivo a insignias ya conseguidas: eso cambiaría
        // de golpe el XP de todo el mundo, así que se deja tal cual quedó.
        let bonusXPInsignias = 0;
        for (const [badgeId, condition] of Object.entries(badgeChecks)) {
          if (!currentBadges.includes(badgeId) && condition()) {
            newBadges.push(badgeId);
            bonusXPInsignias += this.BADGES[badgeId]?.xp || 0;
          }
        }

        const newTotalXP = (oldData.totalXP || 0) + xpGained + bonusXPInsignias;

        const newData = {
          totalXP: newTotalXP,
          level: newLevel,
          badges: newBadges,
          totalDistance: newTotalDistance,
          totalSessions: newTotalSessions,
          lastSessionDate: lastSessionDateFinal,
          lastUpdate: firebaseServices.Timestamp.now(),
          streakDays: streak,
          bestPace: bestPace,
          maxSpeed: maxSpeed,
          totalZone4Minutes: totalZ4,
          totalZone5Minutes: totalZ5,
          countLongRuns: countLong,
          countIntervals: countIntervals,
          countStrengthRuns: countStrength,
          daysOfWeek: daysOfWeek,
          earlyBirdCount: earlyBirdCount,
          maxDistanceSingle: maxDistSingle,
          monthStreak: monthStreak,
          lastMonth: lastMonth,
          firstGPSEver: firstGPS,
          bestStreakDays: bestStreakDays,
          personalRecords: personalRecords
        };

        transaction.set(docRef, newData, { merge: true });
        return { newData, oldLevel: oldData.level, currentBadges };
      });

      const { newData, oldLevel, currentBadges } = resultado;

      await this.addKilometersToShoe(uid, distance);

      if (newData.level > oldLevel) {
        Utils.showToast(`🎉 ¡SUBES AL NIVEL ${newData.level}! (${newData.totalDistance.toFixed(1)} km)`, 'success', 4000);
        Utils.launchConfetti();
      }
      const gainedBadges = newData.badges.filter(b => !currentBadges.includes(b));
      gainedBadges.forEach(badgeId => {
        const badgeInfo = this.BADGES[badgeId];
        if (badgeInfo) Utils.showToast(`🏅 ¡Insignia desbloqueada: ${badgeInfo.name}!`, 'success', 4000);
      });

      // gainedBadges se devuelve (sin persistir como campo aparte) para que
      // quien llama pueda guardar, junto a la sesión/publicación del muro,
      // exactamente qué insignias concedió ESTA sesión. Así, si la sesión
      // se desmarca más tarde, Gamification.removeSession() puede revertir
      // solo esas insignias concretas (y su XP) en vez de no tocarlas.
      return { ...newData, gainedBadges };
    } catch (error) {
      console.error('Error actualizando gamificación:', error);
      return null;
    }
  },

  // Reparación puntual para sesiones GPS ya guardadas ANTES de que
  // 'metricas' incluyera el campo gpsUsed (ver calendar.js): esas
  // sesiones sí llevaban GPS real (entry.hasGPS quedó bien guardado en
  // el muro) pero la insignia FIRST_GPS nunca llegó a evaluarse porque
  // metricas.gpsUsed nunca llegaba a Gamification.updateAfterSession.
  // Esta función NO recalcula XP/distancia/sesiones (eso ya se contó
  // correctamente en su momento): solo concede la insignia si detecta
  // que el usuario tiene al menos una sesión con GPS en el muro y aún
  // no la tiene.
  async repararBadgeGPS(uid) {
    if (!uid) return false;
    try {
      const data = await this.getData(uid);
      if (data.firstGPSEver || (data.badges || []).includes('FIRST_GPS')) return false;

      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .where('hasGPS', '==', true)
        .limit(1)
        .get();
      if (snap.empty) return false;

      const badges = [...(data.badges || []), 'FIRST_GPS'];
      await firebaseServices.db.collection('gamification').doc(uid).set({
        badges,
        firstGPSEver: true
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('No se pudo comprobar/reparar la insignia GPS:', e);
      return false;
    }
  },

  // badgesGanadas: insignias que ESTA sesión concreta concedió cuando se
  // marcó (guardadas en su momento en la entrada del muro, ver
  // calendar.js). Solo esas se revierten -- así, si otra sesión distinta
  // ya había ganado esa insignia antes, no se toca por error.
  // Racha de días, racha de meses, "madrugador", días de la semana
  // entrenados y "distancia máxima en una sola sesión" NO se pueden
  // arreglar simplemente restando cuando se desmarca/borra una sesión:
  // son máximos o rachas que dependen del HISTORIAL COMPLETO, no solo de
  // la sesión que se acaba de quitar. Por eso, en vez de tocar esos
  // campos a mano, se recalculan desde cero a partir de las sesiones que
  // de verdad quedan en globalFeed (ordenadas por fecha real de
  // 'timestamp', que es el mismo campo con el que se calcularon la
  // primera vez en updateAfterSession). Así, si borras la sesión que
  // puso el récord de distancia o que sostenía la racha, esos valores
  // vuelven a lo que le corresponde de verdad, no se quedan "pegados"
  // arriba para siempre.
  async _recalcularDerivadosDesdeHistorial(uid) {
    const vacio = {
      streakDays: 0, lastSessionDate: null, daysOfWeek: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
      earlyBirdCount: 0, maxDistanceSingle: 0, monthStreak: 0, lastMonth: null,
      bestStreakDays: 0, personalRecords: {}
    };
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .get();
      if (snap.empty) return vacio;

      // Una sesión por día (si hay varias el mismo día, cuenta solo una
      // vez para la racha), ordenadas cronológicamente.
      const porDia = {};
      let maxDistanceSingle = 0;
      let earlyBirdCount = 0;
      const daysOfWeek = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
      // Récords personales por distancia estándar (ver RECORD_DISTANCES):
      // se recalculan mirando SOLO las sesiones que de verdad quedan Y que
      // se hicieron con GPS real (d.hasGPS === true), tomando el mejor
      // tramo que cada una tenía guardado en 'recordsPorTramo' (calculado
      // una única vez, al terminar esa sesión, con el track completo y sus
      // marcas de tiempo reales -- ver Gamification.calcularTramosSesion /
      // gps-tracker.js). Así, si borras la sesión que tenía el récord,
      // pasa a la siguiente mejor sesión con GPS real que quede; y una
      // sesión sin GPS (marcada a mano) nunca puede poner ni conservar un
      // récord, por mucha distancia/tiempo que se le corrija a mano.
      // Las entradas antiguas de antes de este cambio no tienen
      // 'recordsPorTramo' guardado: simplemente no aportan ningún récord
      // (no hay forma fiable de reconstruirlo a posteriori sin el track
      // con marcas de tiempo, que nunca se guardó en Firestore).
      const personalRecords = {};
      snap.forEach(doc => {
        const d = doc.data();
        // Se usa 'fechaSesion' (el día REAL de la sesión, el día del
        // plan) y NO 'timestamp' (el instante en que se pulsó el check).
        // Antes se usaba 'timestamp': si alguna vez te pusiste al día
        // marcando varias sesiones atrasadas el mismo rato, todas caían
        // en la misma fecha real (el momento de marcarlas), así que la
        // racha se recalculaba mal en cuanto se desmarcaba cualquier
        // sesión. 'fechaSesion' existe en toda entrada creada desde que
        // se introdujo (ver calendar.js); para entradas antiguas de
        // antes de eso, se cae a 'timestamp' como aproximación.
        const fechaRaw = d.fechaSesion ?? d.timestamp;
        const fecha = fechaRaw?.toDate ? fechaRaw.toDate() : new Date(fechaRaw);
        if (!fecha || isNaN(fecha.getTime())) return;
        const key = fecha.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' en horario local
        if (!porDia[key] || fecha < porDia[key]) porDia[key] = fecha; // más temprana del día, para "madrugador"
        const dist = parseFloat(d.gpsDistanceKm ?? d.distancia) || 0;
        if (dist > maxDistanceSingle) maxDistanceSingle = dist;
        daysOfWeek[fecha.getDay()] = true;
        // BUG CORREGIDO (mismo motivo que en updateAfterSession, v5.13):
        // 'fecha' aquí sale de 'fechaSesion' -- el DÍA real de la sesión,
        // pero con una HORA heredada arbitrariamente de cuando se generó
        // el plan, que nada tiene que ver con la hora real a la que se
        // entrenó o se marcó la sesión. Antes esta función usaba
        // 'fecha.getHours()' para "madrugador", así que una sesión con esa
        // hora heredada por debajo de las 6:00 se contaba como "madrugador"
        // aunque el usuario la hubiera corrido o marcado a mediodía. Esto
        // se ejecuta cada vez que se DESMARCA cualquier sesión (no hace
        // falta que sea la sesión "madrugadora"): si inflaba
        // earlyBirdCount por error, el usuario podía acabar recibiendo la
        // insignia "Madrugador" al marcar una sesión completamente
        // distinta, hecha por la tarde -- exactamente el caso que se quería
        // evitar. 'timestamp' sí es siempre el momento REAL en que se
        // pulsó "marcar" (con o sin GPS), así que es la fuente correcta
        // para la hora; 'fechaSesion' sigue siendo correcta para el DÍA
        // (agrupación por racha/día de la semana), que no depende de la hora.
        const horaRealRaw = d.timestamp;
        const horaReal = horaRealRaw?.toDate ? horaRealRaw.toDate() : (horaRealRaw ? new Date(horaRealRaw) : fecha);
        if (!isNaN(horaReal.getTime()) && horaReal.getHours() < 6) earlyBirdCount++;

        if (d.hasGPS === true && d.recordsPorTramo) {
          Object.entries(d.recordsPorTramo).forEach(([rk, tramo]) => {
            if (!tramo || !isFinite(tramo.durationMs)) return;
            if (!personalRecords[rk] || tramo.durationMs < personalRecords[rk].durationMs) {
              personalRecords[rk] = {
                durationMs: tramo.durationMs,
                distanciaKm: parseFloat(rk),
                fecha: fecha.toISOString(),
                gps: true,
                entryId: doc.id
              };
            }
          });
        }
      });

      const dias = Object.keys(porDia).sort(); // 'YYYY-MM-DD' ordena bien como texto
      if (dias.length === 0) return { ...vacio, personalRecords };

      // Racha de días consecutivos que termina en el día más reciente con
      // sesión (no necesariamente "hoy": si la última sesión fue ayer, la
      // racha sigue contando hasta ayer, igual que hacía el código
      // original al sumar). Y, a la vez, la racha MÁXIMA histórica: la más
      // larga que haya habido en cualquier tramo, no solo la que llega
      // hasta el final.
      let streakDays = 1;
      let bestStreakDays = 1;
      let rachaActual = 1;
      for (let i = 1; i < dias.length; i++) {
        const actual = new Date(dias[i] + 'T00:00:00');
        const anterior = new Date(dias[i - 1] + 'T00:00:00');
        const diffDias = Math.round((actual - anterior) / 86400000);
        if (diffDias === 1) rachaActual++;
        else rachaActual = 1;
        if (rachaActual > bestStreakDays) bestStreakDays = rachaActual;
      }
      // La racha "actual" (streakDays) es la que termina en el último día
      // con sesión: se recalcula igual que antes, yendo hacia atrás desde
      // el final.
      for (let i = dias.length - 1; i > 0; i--) {
        const actual = new Date(dias[i] + 'T00:00:00');
        const anterior = new Date(dias[i - 1] + 'T00:00:00');
        const diffDias = Math.round((actual - anterior) / 86400000);
        if (diffDias === 1) streakDays++;
        else break;
      }

      // Racha de meses consecutivos con al menos una sesión, terminando
      // en el mes de la sesión más reciente.
      const meses = [...new Set(dias.map(k => k.slice(0, 7)))].sort();
      let monthStreak = 1;
      for (let i = meses.length - 1; i > 0; i--) {
        const [ya, ma] = meses[i].split('-').map(Number);
        const [yp, mp] = meses[i - 1].split('-').map(Number);
        const diffMeses = (ya - yp) * 12 + (ma - mp);
        if (diffMeses === 1) monthStreak++;
        else break;
      }

      const lastSessionDate = dias[dias.length - 1];
      const lastMonth = meses[meses.length - 1];

      return { streakDays, lastSessionDate, daysOfWeek, earlyBirdCount, maxDistanceSingle, monthStreak, lastMonth, bestStreakDays, personalRecords };
    } catch (e) {
      console.warn('No se pudieron recalcular racha/récords desde el historial:', e);
      return null; // null = "no tocar estos campos", mejor dejarlos como estaban que corromperlos
    }
  },

  async removeSession(uid, sesion, metricas, diaIndex, badgesGanadas = []) {
    if (uid !== AppState.currentUserId && !AppState.isAdmin) {
      console.warn('Intento de revertir gamificación ajena bloqueado');
      return null;
    }
    if (!uid) return null;
    try {
      const oldData = await this.getData(uid);
      const distanceRemoved = (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) ? metricas.distanciaTotal : 0;

      // Insignias a revertir: las que esta sesión concedió Y que el
      // usuario aún conserva (por si acaso ya no estuvieran, no se resta
      // su XP dos veces).
      const badgesActuales = oldData.badges || [];
      const aQuitar = (badgesGanadas || []).filter(b => badgesActuales.includes(b));
      const newBadges = badgesActuales.filter(b => !aQuitar.includes(b));
      const xpInsigniasRevertido = aQuitar.reduce((sum, b) => sum + (this.BADGES[b]?.xp || 0), 0);

      const xpSesion = this.calculateXP(sesion, metricas);
      const xpRemoved = xpSesion + xpInsigniasRevertido;

      const newTotalXP = Math.max(0, (oldData.totalXP || 0) - xpRemoved);
      const newTotalDistance = Math.max(0, (oldData.totalDistance || 0) - distanceRemoved);
      const newLevel = this.getLevelByDistance(newTotalDistance);
      const newTotalSessions = Math.max(0, (oldData.totalSessions || 0) - 1);

      // Revertir también los contadores por tipo de sesión (igual que se
      // incrementan en updateAfterSession), para que insignias como
      // LONG_RUN_10 / INTERVALS_10 / STRENGTH_10 puedan volver a evaluarse
      // correctamente en la próxima sesión.
      let countLong = oldData.countLongRuns || 0;
      let countIntervals = oldData.countIntervals || 0;
      let countStrength = oldData.countStrengthRuns || 0;
      if (sesion?.tipo === 'largo') countLong = Math.max(0, countLong - 1);
      else if (sesion?.tipo === 'series') countIntervals = Math.max(0, countIntervals - 1);
      else if (sesion?.tipo === 'strength') countStrength = Math.max(0, countStrength - 1);

      // Restar también los minutos en Z4/Z5 que esta sesión concreta había
      // aportado (ver ZONE_4_60/ZONE_5_30 y metricas.zone4Minutes/
      // zone5Minutes en calendar.js), igual que ya se hace con las
      // distancias/contadores de arriba -- si no, desmarcar una sesión de
      // series intensa dejaría esos minutos "pegados" para siempre aunque
      // la sesión que los puso ya no exista.
      const totalZ4 = Math.max(0, (oldData.totalZone4Minutes || 0) - (metricas?.zone4Minutes || 0));
      const totalZ5 = Math.max(0, (oldData.totalZone5Minutes || 0) - (metricas?.zone5Minutes || 0));

      await this.removeKilometersToShoeSafe(uid, distanceRemoved);

      const newData = {
        totalXP: newTotalXP,
        level: newLevel,
        badges: newBadges,
        totalDistance: newTotalDistance,
        totalSessions: newTotalSessions,
        countLongRuns: countLong,
        countIntervals: countIntervals,
        countStrengthRuns: countStrength,
        totalZone4Minutes: totalZ4,
        totalZone5Minutes: totalZ5,
        lastUpdate: firebaseServices.Timestamp.now()
      };

      // Racha, "madrugador", días de la semana, racha de meses y
      // distancia máxima: se recalculan desde las sesiones que quedan de
      // verdad (ver _recalcularDerivadosDesdeHistorial). Si por lo que
      // sea la consulta falla, se deja tal cual estaban (null) en vez de
      // arriesgarse a dejarlos a medias.
      // _recalcularDerivadosDesdeHistorial ahora reconstruye
      // personalRecords SOLO a partir de sesiones que de verdad quedan en
      // globalFeed Y que se hicieron con GPS real (ver esa función): es
      // la fuente de la verdad completa, no hace falta "proteger" nada
      // aparte -- si la sesión que se está desmarcando tenía el récord de
      // alguna distancia, el recálculo ya lo sustituye por el siguiente
      // mejor tramo GPS real que quede (o lo quita del todo si no queda
      // ninguno).
      //
      // Reintento: esta llamada depende de una consulta a Firestore
      // (globalFeed) que puede fallar puntualmente por red -- si falla y
      // no se reintenta, la sesión se resta en XP/distancia/nivel pero la
      // racha y los récords se quedan "pegados" con el valor antiguo, sin
      // avisar. Se reintenta una vez antes de rendirse.
      let derivados = await this._recalcularDerivadosDesdeHistorial(uid);
      if (!derivados) {
        console.warn('Recálculo de racha/récords falló, reintentando...');
        derivados = await this._recalcularDerivadosDesdeHistorial(uid);
      }
      if (derivados) {
        Object.assign(newData, derivados);
      } else {
        Utils.showToast('⚠️ La sesión se desmarcó, pero no se pudo recalcular tu racha/récords. Vuelve a intentarlo o revisa tu conexión.', 'warning', 5000);
      }

      await firebaseServices.db.collection('gamification').doc(uid).set(newData, { merge: true });

      if (newLevel < oldData.level) {
        Utils.showToast(`📉 Bajas al nivel ${newLevel} (${newTotalDistance.toFixed(1)} km)`, 'info', 3000);
      }
      aQuitar.forEach(badgeId => {
        const badgeInfo = this.BADGES[badgeId];
        if (badgeInfo) Utils.showToast(`↩️ Insignia retirada: ${badgeInfo.name} (sesión desmarcada)`, 'info', 3500);
      });
      return newData;
    } catch (error) {
      console.error('Error revirtiendo gamificación:', error);
      return null;
    }
  },

  // Pequeño envoltorio a prueba de fallos: si removeKilometersFromShoe no
  // existiera por algún motivo, no debe tirar abajo toda la reversión de
  // la sesión (distancia/XP/insignias) por un error ajeno a eso.
  async removeKilometersToShoeSafe(uid, km) {
    try { await this.removeKilometersFromShoe(uid, km); }
    catch (e) { console.warn('No se pudo restar km a la zapatilla al desmarcar sesión:', e); }
  },

  async repairMyProfile() {
    const uid = AppState.currentUserId;
    if (!uid) return;
    Utils.showLoading();
    try {
      const defaultData = this.getDefaultData();
      await firebaseServices.db.collection('gamification').doc(uid).set(defaultData);
      Utils.showToast('✅ Pasaporte activado. Recargando...', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      Utils.showToast('Error: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }
};

window.Gamification = Gamification;
console.log('✅ gamification.js v5.14 - Auditoría de insignias: fix Madrugador al desmarcar, Z4/Z5 con datos reales, insignias de desnivel retiradas');