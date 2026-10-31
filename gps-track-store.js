// ==================== gps-track-store.js ====================
// Versión: 1.0 - FASE 3: rutas GPS PRIVADAS.
//
// Antes, los puntos del recorrido (trackPoints/trackZonas) y la imagen del mapa (mapSnapshot) vivían DENTRO de
// cada publicación de 'globalFeed', que puede leer cualquier usuario registrado: el "difuminado" era solo visual.
// Ahora viven en 'globalFeedTracks/{idDeLaPublicación}', que las reglas de Firestore solo dejan leer al dueño, a
// sus amigos y al admin. En el muro queda únicamente 'mapBlur': una miniatura diminuta de la SILUETA de la ruta
// (sin mapa, sin calles, sin coordenadas) que es lo que ve quien no es amigo.
//
//  · hidratar(entradas)  → rellena trackPoints/trackZonas/mapSnapshot de las entradas que el usuario puede ver
//                          (propias y de amigos) que ya no los traen. Las antiguas (con los puntos aún dentro del
//                          muro) no hacen ninguna lectura extra.
//  · guardar / borrar    → escritura/borrado del documento privado (solo el dueño).
//  · crearBlur(puntos)   → genera la miniatura difuminada.
const GPSTrackStore = {
  COL: 'globalFeedTracks',

  // FASE 3A (true): las sesiones nuevas siguen llevando también los puntos dentro del muro, para que las apps de
  // otros usuarios que aún no se hayan actualizado sigan viendo el mapa. FASE 3B: poner en false para que dejen
  // de publicarse en 'globalFeed' (y migrar las antiguas con la herramienta de migración).
  EMBEBER_EN_MURO: true,

  _cache: {},     // idEntrada -> datos privados | null (no existe)
  _enCurso: {},   // idEntrada -> Promise (evita lecturas duplicadas a la vez)
  _fallos: {},    // idEntrada -> instante del último fallo (se reintenta pasado 1 minuto)

  _yo() { return window.AppState && AppState.currentUserId; },
  _amigos() { return (window.AppState && AppState.currentUserData && AppState.currentUserData.friendIds) || []; },
  puedeLeer(entry) {
    return !!entry && (entry.userId === this._yo() || this._amigos().includes(entry.userId));
  },
  _tienePuntos(e) { return Array.isArray(e && e.trackPoints) && e.trackPoints.length >= 2; },

  async guardar(entryId, uid, datos) {
    if (!entryId || !uid || !datos) return false;
    const limpio = {};
    ['trackPoints', 'trackZonas', 'mapSnapshot', 'mapSnapshotV'].forEach(k => {
      if (datos[k] !== undefined && datos[k] !== null) limpio[k] = datos[k];
    });
    try {
      await firebaseServices.db.collection(this.COL).doc(entryId).set(
        { userId: uid, ...limpio, updatedAt: firebaseServices.FieldValue.serverTimestamp() },
        { merge: true }
      );
      this._cache[entryId] = { ...(this._cache[entryId] || {}), userId: uid, ...limpio };
      return true;
    } catch (e) {
      console.warn('GPSTrackStore.guardar:', e && e.message);
      return false;
    }
  },

  async obtener(entryId) {
    if (!entryId) return null;
    if (Object.prototype.hasOwnProperty.call(this._cache, entryId)) return this._cache[entryId];
    if (this._enCurso[entryId]) return this._enCurso[entryId];
    if (this._fallos[entryId] && Date.now() - this._fallos[entryId] < 60000) return null;
    const p = (async () => {
      try {
        const d = await firebaseServices.db.collection(this.COL).doc(entryId).get();
        const v = d.exists ? d.data() : null;
        this._cache[entryId] = v;
        return v;
      } catch (e) {
        this._fallos[entryId] = Date.now();   // sin permiso o sin red: se reintentará pasado 1 minuto
        return null;
      } finally {
        delete this._enCurso[entryId];
      }
    })();
    this._enCurso[entryId] = p;
    return p;
  },

  // Completa IN SITU las entradas (deben llevar 'id') que el usuario puede ver y que ya no traen sus puntos.
  async hidratar(entries) {
    try {
      const lista = (entries || []).filter(e => e && e.id && e.hasGPS && !this._tienePuntos(e) && this.puedeLeer(e));
      if (!lista.length) return entries;
      await Promise.all(lista.map(async e => {
        const d = await this.obtener(e.id);
        if (!d) return;
        if (Array.isArray(d.trackPoints)) e.trackPoints = d.trackPoints;
        if (d.trackZonas) e.trackZonas = d.trackZonas;
        if (d.mapSnapshot) { e.mapSnapshot = d.mapSnapshot; e.mapSnapshotV = d.mapSnapshotV; }
      }));
    } catch (err) { console.warn('GPSTrackStore.hidratar:', err && err.message); }
    return entries;
  },

  async borrar(entryId) {
    if (!entryId) return;
    delete this._cache[entryId];
    try { await firebaseServices.db.collection(this.COL).doc(entryId).delete(); }
    catch (e) { /* no existía o sin permiso: nada que hacer */ }
  },

  // Miniatura 96x40 con SOLO la silueta de la ruta, normalizada al recuadro: se pierde la escala y la posición
  // reales, y el fondo es un patrón genérico. Aun sin difuminar no se puede situar en ningún mapa.
  crearBlur(points) {
    try {
      if (!Array.isArray(points) || points.length < 2) return null;
      const W = 96, H = 40, pad = 8;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#e4e7ec'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#eef0f3';
      ctx.fillRect(0, 12, W, 5); ctx.fillRect(0, 28, W, 4); ctx.fillRect(22, 0, 5, H); ctx.fillRect(64, 0, 4, H);

      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      for (const p of points) {
        if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
        if (p.lat < minLat) minLat = p.lat; if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng; if (p.lng > maxLng) maxLng = p.lng;
      }
      if (!isFinite(minLat) || !isFinite(minLng)) return null;
      const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180) || 1;
      const spanX = Math.max((maxLng - minLng) * k, 1e-6);
      const spanY = Math.max(maxLat - minLat, 1e-6);
      const s = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
      const offX = (W - spanX * s) / 2, offY = (H - spanY * s) / 2;

      ctx.strokeStyle = '#c0a060'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      let primero = true;
      for (const p of points) {
        if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
        const x = offX + (p.lng - minLng) * k * s;
        const y = offY + (maxLat - p.lat) * s;
        if (primero) { ctx.moveTo(x, y); primero = false; } else { ctx.lineTo(x, y); }
      }
      ctx.stroke();
      return c.toDataURL('image/jpeg', 0.6);
    } catch (e) { return null; }
  }
};
window.GPSTrackStore = GPSTrackStore;
console.log('✅ GPSTrackStore v1.0 (rutas GPS privadas)');
