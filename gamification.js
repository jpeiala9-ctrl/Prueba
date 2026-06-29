// ==================== gamification.js ====================
// Versión: 5.7 - Creación automática del documento de gamificación si no existe
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

  getColorByLevel(level) {
    const colors = {
      1: '#6c757d', 2: '#adb5bd', 3: '#cd7f32', 4: '#b87333',
      5: '#c0c0c0', 6: '#e5e4e2', 7: '#ffd700', 8: '#ffc107',
      9: '#e0b0ff'
    };
    if (level >= 10) return '#b9f2ff';
    return colors[level] || '#6c757d';
  },

  async clearCache(uid) {
    if (!uid) return;
    try {
      sessionStorage.removeItem(`gamification_${uid}`);
      localStorage.removeItem(`gamification_${uid}`);
      console.log('🗑️ Caché de gamificación limpiada para', uid);
    } catch (e) { console.warn(e); }
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
      firstGPSEver: false
    };
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

      const newTotalXP = (oldData.totalXP || 0) + xpGained;
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

      for (const [badgeId, condition] of Object.entries(badgeChecks)) {
        if (!currentBadges.includes(badgeId) && condition()) {
          newBadges.push(badgeId);
        }
      }

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
        firstGPSEver: firstGPS
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

      return newData;
    } catch (error) {
      console.error('Error actualizando gamificación:', error);
      return null;
    }
  },

  async removeSession(uid, sesion, metricas, diaIndex) {
    if (uid !== AppState.currentUserId && !AppState.isAdmin) {
      console.warn('Intento de revertir gamificación ajena bloqueado');
      return null;
    }
    if (!uid) return null;
    try {
      const oldData = await this.getData(uid);
      const xpRemoved = this.calculateXP(sesion, metricas);
      const distanceRemoved = (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) ? metricas.distanciaTotal : 0;

      const newTotalXP = Math.max(0, (oldData.totalXP || 0) - xpRemoved);
      const newTotalDistance = Math.max(0, (oldData.totalDistance || 0) - distanceRemoved);
      const newLevel = this.getLevelByDistance(newTotalDistance);
      const newTotalSessions = Math.max(0, (oldData.totalSessions || 0) - 1);

      await this.removeKilometersFromShoe(uid, distanceRemoved);

      const newData = {
        totalXP: newTotalXP,
        level: newLevel,
        totalDistance: newTotalDistance,
        totalSessions: newTotalSessions,
        lastUpdate: firebaseServices.Timestamp.now()
      };
      await firebaseServices.db.collection('gamification').doc(uid).set(newData, { merge: true });

      if (newLevel < oldData.level) {
        Utils.showToast(`📉 Bajas al nivel ${newLevel} (${newTotalDistance.toFixed(1)} km)`, 'info', 3000);
      }
      return newData;
    } catch (error) {
      console.error('Error revirtiendo gamificación:', error);
      return null;
    }
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
console.log('✅ gamification.js v5.7 - creación automática del documento de gamificación');