// ==================== gamification.js ====================
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
    ZONE_4_60: { id: 'ZONE_4_60', name: '60 min en Z4', description: 'Acumulaste 60 minutos en zona 4', xp: 300, icon: '❤️' },
    ZONE_5_30: { id: 'ZONE_5_30', name: '30 min en Z5', description: 'Acumulaste 30 minutos en zona 5', xp: 500, icon: '💜' },
    ELEVATION_500: { id: 'ELEVATION_500', name: '500 m de desnivel', description: 'Acumulaste 500 m de subida', xp: 200, icon: '⛰️' },
    ELEVATION_1000: { id: 'ELEVATION_1000', name: '1000 m de desnivel', description: 'Subidón', xp: 500, icon: '🏔️' },
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
      if (doc.exists) return doc.data();
      const defaultData = this.getDefaultData();
      await firebaseServices.db.collection('gamification').doc(uid).set(defaultData);
      console.log('✅ Documento de gamificación creado para', uid);
      return defaultData;
    } catch (error) {
      console.error('Error obteniendo datos de gamificación:', error);
      return this.getDefaultData();
    }
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
      totalElevationGain: 0,
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
  // personal). Una sesión cuenta como intento a una distancia si se queda
  // dentro de un margen del 15% de esa distancia (así una tirada de 10.3
  // km sí cuenta como récord de "10 km", pero una de 7 km no cuenta ni
  // para 5 km ni para 10 km).
  RECORD_DISTANCES: [1, 5, 10, 21.1, 42.2],

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
      const oldData = await this.getData(uid);
      const xpGained = this.calculateXP(sesion, metricas);
      const distance = (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) ? metricas.distanciaTotal : 0;
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');

      let streak = (oldData.streakDays || 0);
      if (oldData.lastSessionDate) {
        const lastDate = new Date(oldData.lastSessionDate);
        const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else if (diffDays > 1) streak = 1;
      } else { streak = 1; }

      let bestPace = oldData.bestPace;
      if (metricas && metricas.bestPace && metricas.bestPace > 0)
        if (!bestPace || metricas.bestPace < bestPace) bestPace = metricas.bestPace;

      let maxSpeed = oldData.maxSpeed || 0;
      if (metricas && metricas.maxSpeed && metricas.maxSpeed > maxSpeed) maxSpeed = metricas.maxSpeed;

      let totalZ4 = (oldData.totalZone4Minutes || 0) + (metricas?.zone4Minutes || 0);
      let totalZ5 = (oldData.totalZone5Minutes || 0) + (metricas?.zone5Minutes || 0);
      let totalElev = (oldData.totalElevationGain || 0) + (metricas?.elevationGain || 0);

      let countLong = oldData.countLongRuns || 0;
      let countIntervals = oldData.countIntervals || 0;
      let countStrength = oldData.countStrengthRuns || 0;
      if (sesion.tipo === 'largo') countLong++;
      else if (sesion.tipo === 'series') countIntervals++;
      else if (sesion.tipo === 'strength') countStrength++;

      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      let daysOfWeek = oldData.daysOfWeek || { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
      daysOfWeek[dayOfWeek] = true;
      let earlyBirdCount = oldData.earlyBirdCount || 0;
      if (hour < 6) earlyBirdCount++;

      let maxDistSingle = Math.max(oldData.maxDistanceSingle || 0, distance);

      // Racha máxima histórica (distinta de 'streak', que es la racha
      // ACTUAL y puede bajar a 1 si se rompe). Esta solo puede subir o
      // quedarse igual, nunca bajar al marcar una sesión nueva.
      let bestStreakDays = Math.max(oldData.bestStreakDays || 0, streak);

      // Récord personal por distancia estándar (ver RECORD_DISTANCES):
      // se guarda el mejor (menor) tiempo conseguido en una sesión cuya
      // distancia real quede dentro de un 15% de esa distancia.
      let personalRecords = { ...(oldData.personalRecords || {}) };
      const duracionMs = (metricas && metricas.durationMs) || 0;
      if (distance > 0 && duracionMs > 0) {
        let categoria = null, mejorDif = Infinity;
        this.RECORD_DISTANCES.forEach(d => {
          const dif = Math.abs(distance - d) / d;
          if (dif <= 0.15 && dif < mejorDif) { categoria = d; mejorDif = dif; }
        });
        if (categoria !== null) {
          const key = String(categoria);
          const actual = personalRecords[key];
          if (!actual || duracionMs < actual.durationMs) {
            personalRecords[key] = { durationMs: duracionMs, distanciaKm: distance, fecha: now.toISOString() };
          }
        }
      }

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
        ELEVATION_500: () => totalElev >= 500,
        ELEVATION_1000: () => totalElev >= 1000,
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
        lastSessionDate: todayStr,
        lastUpdate: firebaseServices.Timestamp.now(),
        streakDays: streak,
        bestPace: bestPace,
        maxSpeed: maxSpeed,
        totalZone4Minutes: totalZ4,
        totalZone5Minutes: totalZ5,
        totalElevationGain: totalElev,
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

      await firebaseServices.db.collection('gamification').doc(uid).set(newData, { merge: true });
      await this.addKilometersToShoe(uid, distance);

      if (newLevel > oldData.level) {
        Utils.showToast(`🎉 ¡SUBES AL NIVEL ${newLevel}! (${newTotalDistance.toFixed(1)} km)`, 'success', 4000);
        Utils.launchConfetti();
      }
      const gainedBadges = newBadges.filter(b => !currentBadges.includes(b));
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
      // se recalculan igual que en updateAfterSession, pero mirando SOLO
      // las sesiones que de verdad quedan, para que si borras la sesión
      // que tenía el récord, pase a la siguiente mejor real.
      const personalRecords = {};
      snap.forEach(doc => {
        const d = doc.data();
        const fecha = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
        if (!fecha || isNaN(fecha.getTime())) return;
        const key = fecha.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' en horario local
        if (!porDia[key] || fecha < porDia[key]) porDia[key] = fecha; // más temprana del día, para "madrugador"
        const dist = parseFloat(d.gpsDistanceKm ?? d.distancia) || 0;
        if (dist > maxDistanceSingle) maxDistanceSingle = dist;
        daysOfWeek[fecha.getDay()] = true;
        if (fecha.getHours() < 6) earlyBirdCount++;

        const duracionMs = d.gpsDurationMs || (Number(d.duration) || 0) * 60000;
        if (dist > 0 && duracionMs > 0) {
          let categoria = null, mejorDif = Infinity;
          this.RECORD_DISTANCES.forEach(dr => {
            const dif = Math.abs(dist - dr) / dr;
            if (dif <= 0.15 && dif < mejorDif) { categoria = dr; mejorDif = dif; }
          });
          if (categoria !== null) {
            const rk = String(categoria);
            if (!personalRecords[rk] || duracionMs < personalRecords[rk].durationMs) {
              personalRecords[rk] = { durationMs, distanciaKm: dist, fecha: fecha.toISOString() };
            }
          }
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
        lastUpdate: firebaseServices.Timestamp.now()
      };

      // Racha, "madrugador", días de la semana, racha de meses y
      // distancia máxima: se recalculan desde las sesiones que quedan de
      // verdad (ver _recalcularDerivadosDesdeHistorial). Si por lo que
      // sea la consulta falla, se deja tal cual estaban (null) en vez de
      // arriesgarse a dejarlos a medias.
      const derivados = await this._recalcularDerivadosDesdeHistorial(uid);
      if (derivados) Object.assign(newData, derivados);

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
console.log('✅ gamification.js v5.8 - racha/récords recalculados desde el historial al desmarcar');