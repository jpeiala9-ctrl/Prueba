// ==================== gps-tracker.js ====================
// Versión: 4.1 - Bandera SIEMPRE centrada + re-centrado automático (5s)
// ====================

const GPSTracker = {

  // ===== ESTADO =====
  sesion:        null,
  diaIndex:      null,
  trackPoints:   [],
  watchId:       null,
  timerInterval: null,
  stepInterval:  null,
  startTime:     null,
  pausedTime:    0,
  pauseStart:    null,
  isPaused:      false,
  isRunning:     false,
  map:           null,
  polyline:      null,
  currentMarker: null,
  startMarker:   null,
  leafletLoaded: false,

  steps:         [],
  stepIndex:     0,
  stepStartTime: null,
  _autoNextPending: false,
  _endingSession: false,

  _rawBuffer:    [],
  _lastAccepted: null,
  _velocities:   [],

  _smoothBuffer:      [],
  _lastSmoothPoint:   null,
  _minDistance:       3.0,
  _minSpeed:          0.3,
  _minAngleChange:    10,
  _smoothWindow:      5,

  _pendingStart: null,
  _firstPointTime: null,
  _staticWarningShown: false,

  _userMovedMap: false,
  _autoCenterTimer: null,
  _autoCentering: false,

  _unlockTimeout: null,
  _isUnlocked: false,

  _audioCtx: null,

  _keepAliveOsc: null,
  _keepAliveGain: null,
  _keepAliveInterval: null,
  _wakeLock: null,

  // ===== Último punto bueno para la bandera =====
  _lastGoodPoint: null,

  // ===== ANTI-BLOQUEO =====
  _startKeepAliveAudio() {
    if (!this._audioCtx) return;
    if (this._keepAliveOsc) return;
    try {
      const ctx = this._audioCtx;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.frequency.value = 1;
      osc.connect(gain);
      osc.start();
      this._keepAliveOsc = osc;
      this._keepAliveGain = gain;
    } catch(e) {
      console.warn('No se pudo iniciar audio silencioso', e);
    }
  },

  _stopKeepAliveAudio() {
    if (this._keepAliveOsc) {
      try {
        this._keepAliveOsc.stop();
        this._keepAliveOsc = null;
      } catch(e) {}
    }
    this._keepAliveGain = null;
  },

  async _requestWakeLock() {
    if (!navigator.wakeLock) return false;
    try {
      if (this._wakeLock && !this._wakeLock.released) return true;
      this._wakeLock = await navigator.wakeLock.request('screen');
      this._wakeLock.addEventListener('release', () => {
        console.log('Wake Lock liberado, intentando renovar...');
        setTimeout(() => this._requestWakeLock(), 1000);
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock falló', err);
      return false;
    }
  },

  _releaseWakeLock() {
    if (this._wakeLock && !this._wakeLock.released) {
      this._wakeLock.release();
      this._wakeLock = null;
    }
  },

  _startPreventSleep() {
    this._requestWakeLock();
    this._startKeepAliveAudio();
    if (this._keepAliveInterval) clearInterval(this._keepAliveInterval);
    this._keepAliveInterval = setInterval(() => {
      if (this.isRunning && !this.isPaused) {
        this._requestWakeLock();
        if (this._audioCtx && this._audioCtx.state === 'suspended') {
          this._audioCtx.resume();
        }
      }
    }, 30000);
  },

  _stopPreventSleep() {
    this._releaseWakeLock();
    this._stopKeepAliveAudio();
    if (this._keepAliveInterval) {
      clearInterval(this._keepAliveInterval);
      this._keepAliveInterval = null;
    }
  },

  async _initAudioContext() {
    if (this._audioCtx && this._audioCtx.state !== 'closed') return this._audioCtx;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      this._audioCtx = new AudioCtor();
      return this._audioCtx;
    } catch(e) {
      console.warn('Error creando AudioContext', e);
      return null;
    }
  },

  async _resumeAudioContext() {
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      await this._audioCtx.resume();
    }
  },

  async _beep(frequency, duration, volume = 0.2) {
    try {
      let ctx = this._audioCtx;
      if (!ctx || ctx.state === 'closed') {
        ctx = await this._initAudioContext();
        if (!ctx) return;
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
      oscillator.start();
      oscillator.stop(now + duration / 1000);
    } catch (e) { console.warn('Beep error:', e); }
  },

  _speak(text, preload = false) {
    if (!window.speechSynthesis) return;
    if (preload) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  },

  _announceStep(step) {
    if (!step) return;
    let mensaje = `${step.titulo}, ${step.duracionMin} minutos, ${step.zona}`;
    this._speak(mensaje);
  },

  _announceSesionTerminada() {
    if (this._endingSession) return;
    this._endingSession = true;
    this._speak('Sesión terminada');
  },

  _extractZoneFromAction(accion) {
    if (!accion) return 'zona 1';
    const match = accion.match(/zona?\s*(\d+)/i) || accion.match(/Z(\d+)/i);
    if (match) return `zona ${match[1]}`;
    return 'zona 1';
  },

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  _calcTotalDistance() {
    let d = 0;
    for (let i = 1; i < this.trackPoints.length; i++)
      d += this._haversine(this.trackPoints[i-1].lat, this.trackPoints[i-1].lng,
                           this.trackPoints[i].lat,   this.trackPoints[i].lng);
    return d;
  },

  _filterGPS(lat, lng, accuracy, timestamp) {
    this._rawBuffer.push({ lat, lng, acc: Math.max(1, accuracy), ts: timestamp });
    if (this._rawBuffer.length > 8) this._rawBuffer.shift();
    if (this._rawBuffer.length < 2) return null;

    const maxAccuracy = this.trackPoints.length < 3 ? 50 : 30;
    if (accuracy > maxAccuracy && this.trackPoints.length > 3) return null;

    const lats = this._rawBuffer.map(p => p.lat).sort((a,b)=>a-b);
    const lngs = this._rawBuffer.map(p => p.lng).sort((a,b)=>a-b);
    const medianLat = lats[Math.floor(lats.length/2)];
    const medianLng = lngs[Math.floor(lngs.length/2)];

    let punto = { lat: medianLat, lng: medianLng, ts: timestamp, acc: Math.round(accuracy) };

    if (this._lastAccepted && this.trackPoints.length >= 2 && !punto.extrapolated) {
      const lastTwo = this.trackPoints.slice(-2);
      const dtLast = (lastTwo[1].ts - lastTwo[0].ts) / 1000;
      if (dtLast > 0.1) {
        const distLast = this._haversine(lastTwo[0].lat, lastTwo[0].lng, lastTwo[1].lat, lastTwo[1].lng);
        const speed = distLast / dtLast;
        if (speed > 1.0) {
          const vx = (lastTwo[1].lng - lastTwo[0].lng) / dtLast;
          const vy = (lastTwo[1].lat - lastTwo[0].lat) / dtLast;
          const dtNew = (timestamp - lastTwo[1].ts) / 1000;
          const extrapolatedLng = lastTwo[1].lng + vx * dtNew;
          const extrapolatedLat = lastTwo[1].lat + vy * dtNew;
          punto = { lat: extrapolatedLat, lng: extrapolatedLng, ts: timestamp, acc: Math.round(accuracy), extrapolated: true };
        }
      }
    }

    let maxSpeed = 8.0;
    if (this._velocities.length > 3) {
      const sorted = [...this._velocities].sort((a,b)=>a-b);
      const idx = Math.floor(sorted.length * 0.95);
      maxSpeed = Math.max(8.0, sorted[idx] + 1.0);
    }

    if (this._lastAccepted && !punto.extrapolated) {
      const dt = Math.max(0.5, (timestamp - this._lastAccepted.ts) / 1000);
      const dist = this._haversine(this._lastAccepted.lat, this._lastAccepted.lng, punto.lat, punto.lng);
      const speed = dist / dt;
      if (speed > maxSpeed && dist > 15) return null;
      this._velocities.push(speed);
      if (this._velocities.length > 20) this._velocities.shift();
    }

    if (this._lastAccepted) {
      const distToLast = this._haversine(this._lastAccepted.lat, this._lastAccepted.lng, punto.lat, punto.lng);
      if (distToLast < 1.5) return null;
    }

    this._lastAccepted = punto;
    return punto;
  },

  _smoothAndSimplify(lat, lng, timestamp) {
    this._smoothBuffer.push({ lat, lng, ts: timestamp });
    if (this._smoothBuffer.length > this._smoothWindow) this._smoothBuffer.shift();

    let sumLat = 0, sumLng = 0;
    for (let p of this._smoothBuffer) {
      sumLat += p.lat;
      sumLng += p.lng;
    }
    const smoothLat = sumLat / this._smoothBuffer.length;
    const smoothLng = sumLng / this._smoothBuffer.length;

    if (this.trackPoints.length === 0) {
      this._lastSmoothPoint = { lat: smoothLat, lng: smoothLng, ts: timestamp };
      return this._lastSmoothPoint;
    }

    const dist = this._haversine(this._lastSmoothPoint.lat, this._lastSmoothPoint.lng, smoothLat, smoothLng);
    const dt = (timestamp - this._lastSmoothPoint.ts) / 1000;
    const speed = dt > 0 ? dist / dt : 0;

    if (dist < this._minDistance && speed < this._minSpeed) return null;

    if (this.trackPoints.length >= 2 && dist < 5 && speed < 1.5) {
      const prev = this.trackPoints[this.trackPoints.length - 2];
      const last = this.trackPoints[this.trackPoints.length - 1];
      const anglePrev = Math.atan2(last.lng - prev.lng, last.lat - prev.lat) * 180 / Math.PI;
      const angleCurr = Math.atan2(smoothLng - last.lng, smoothLat - last.lat) * 180 / Math.PI;
      let delta = Math.abs(angleCurr - anglePrev);
      if (delta > 180) delta = 360 - delta;
      if (delta < this._minAngleChange) {
        this.trackPoints[this.trackPoints.length - 1] = { lat: smoothLat, lng: smoothLng, ts: timestamp };
        this._lastSmoothPoint = { lat: smoothLat, lng: smoothLng, ts: timestamp };
        return this._lastSmoothPoint;
      }
    }

    const nuevoPunto = { lat: smoothLat, lng: smoothLng, ts: timestamp };
    this._lastSmoothPoint = nuevoPunto;
    return nuevoPunto;
  },

  _fmtTime(ms) {
    const s = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  },

  _fmtPace(distM, ms) {
    if (distM < 30 || ms < 5000) return '--:--';
    const paceS = (ms / 1000) / (distM / 1000);
    const mm = Math.floor(paceS / 60), ss = Math.floor(paceS % 60);
    return `${mm}:${String(ss).padStart(2,'0')}`;
  },

  _buildSteps(sesion) {
    const d = sesion.detalle;
    if (!d) return [{ icono:'', titulo:'SESION', duracionMin: sesion.duracion || 45, accion:'', zona:'zona 1' }];
    let pasos = (d.pasosDetallados || []).filter(p => {
      const titulo = (p.titulo || '').toUpperCase();
      return !titulo.includes('FUERZA');
    });
    if (pasos.length === 0) {
      return [
        { icono:'', titulo:'CALENTAMIENTO',   duracionMin: d.calentamiento  || 10, accion: `${d.calentamiento||10}' trote suave Z1`, zona: 'zona 1' },
        { icono:'', titulo:'PARTE PRINCIPAL', duracionMin: d.partePrincipal || 25, accion: d.estructura || '', zona: this._extractZoneFromAction(d.estructura) },
        { icono:'', titulo:'ENFRIAMIENTO',    duracionMin: d.enfriamiento   || 5,  accion: `${d.enfriamiento||5}' trote suave`, zona: 'zona 1' }
      ];
    }
    return pasos.map(p => {
      const tit = (p.titulo || '').toUpperCase();
      let durMin = d.partePrincipal || 25;
      if (tit.includes('CALENTAMIENTO'))  durMin = d.calentamiento  || 10;
      else if (tit.includes('ENFRIAMIENTO')) durMin = d.enfriamiento || 5;
      else {
        const nMain = pasos.filter(x => {
          const t = (x.titulo||'').toUpperCase();
          return !t.includes('CALENTAMIENTO') && !t.includes('ENFRIAMIENTO');
        }).length;
        durMin = Math.round((d.partePrincipal || 25) / Math.max(1, nMain));
      }
      return {
        icono: '',
        titulo: tit,
        duracionMin: durMin,
        accion: p.accion || '',
        zona: this._extractZoneFromAction(p.accion)
      };
    });
  },

  _loadLeaflet() {
    return new Promise(resolve => {
      if (window.L && this.leafletLoaded) { resolve(); return; }
      if (window.L) { this.leafletLoaded = true; resolve(); return; }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => { this.leafletLoaded = true; resolve(); };
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  },

  // ============================================================
  //  INICIALIZACIÓN DEL MAPA (bandera centrada)
  // ============================================================
  _initMap(lat, lng) {
    if (this.map || !window.L) return;
    try {
      document.getElementById('gpsNoGPS')?.remove();
      this.map = window.L.map('gpsMap', {
        zoomControl: false,
        attributionControl: false,
        tap: false,
        center: [lat, lng],
        zoom: 16
      });
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB'
      }).addTo(this.map);

      this.polyline = window.L.polyline([], {
        color: '#c0a060',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(this.map);

      // Bandera siempre centrada
      const flagIcon = window.L.divIcon({
        html: `<div style="font-size:28px; line-height:1; text-shadow:0 0 2px white;">🏁</div>`,
        className: '',
        iconAnchor: [14, 14]
      });
      this.currentMarker = window.L.marker([lat, lng], { icon: flagIcon }).addTo(this.map);

      // ===== GESTIÓN DE RE-CENTRADO AUTOMÁTICO =====
      const resetAutoCenterTimer = () => {
        if (this._autoCenterTimer) clearTimeout(this._autoCenterTimer);
        this._userMovedMap = true;
        this._autoCenterTimer = setTimeout(() => {
          // Si hay un punto bueno, centrar el mapa en él
          if (this._lastGoodPoint) {
            this._autoCentering = true;
            this.map.setView([this._lastGoodPoint.lat, this._lastGoodPoint.lng], this.map.getZoom(), { animate: true });
            this._userMovedMap = false;
            setTimeout(() => { this._autoCentering = false; }, 500);
          } else if (this.currentMarker) {
            const pos = this.currentMarker.getLatLng();
            this._autoCentering = true;
            this.map.setView(pos, this.map.getZoom(), { animate: true });
            this._userMovedMap = false;
            setTimeout(() => { this._autoCentering = false; }, 500);
          }
          this._autoCenterTimer = null;
        }, 5000);
      };

      // Eventos de interacción del usuario
      this.map.on('movestart', () => {
        if (this._autoCenterTimer) clearTimeout(this._autoCenterTimer);
        this._userMovedMap = true;
      });
      this.map.on('moveend', () => {
        if (this._userMovedMap && !this._autoCentering) {
          resetAutoCenterTimer();
        }
      });
      this.map.on('zoomstart', () => {
        if (this._autoCenterTimer) clearTimeout(this._autoCenterTimer);
        this._userMovedMap = true;
      });
      this.map.on('zoomend', () => {
        if (this._userMovedMap && !this._autoCentering) {
          resetAutoCenterTimer();
        }
      });

      // Guardar el timer para poder limpiarlo
      this._autoCenterTimer = null;

    } catch(e) { console.warn('Map init error', e); }
  },

  // ============================================================
  //  ACTUALIZACIÓN DEL MAPA (bandera al centro y centrado)
  // ============================================================
  _updateMap(lat, lng) {
    if (!window.L) return;
    if (!this.map) { this._initMap(lat, lng); return; }
    try {
      // Actualizar la bandera con el punto bueno (o el punto actual)
      let targetLat = lat, targetLng = lng;
      if (this._lastGoodPoint) {
        targetLat = this._lastGoodPoint.lat;
        targetLng = this._lastGoodPoint.lng;
      }

      // Mover la bandera
      if (this.currentMarker) {
        this.currentMarker.setLatLng([targetLat, targetLng]);
        if (this.currentMarker.bringToFront) this.currentMarker.bringToFront();
      } else {
        const flagIcon = window.L.divIcon({
          html: `<div style="font-size:28px; line-height:1; text-shadow:0 0 2px white;">🏁</div>`,
          className: '', iconAnchor: [14, 14]
        });
        this.currentMarker = window.L.marker([targetLat, targetLng], { icon: flagIcon }).addTo(this.map);
      }

      // Actualizar la línea del track
      this._updatePolyline();

      // Centrar el mapa en la bandera SOLO si el usuario no lo ha movido
      if (!this._userMovedMap && !this._autoCentering) {
        this.map.setView([targetLat, targetLng], this.map.getZoom(), { animate: true });
      }
    } catch(e) { console.warn('Error en _updateMap', e); }
  },

  _updatePolyline() {
    if (!this.map || !this.polyline) return;
    const latlngs = this.trackPoints.map(p => [p.lat, p.lng]);
    this.polyline.setLatLngs(latlngs);
  },

  _addStartMarker(lat, lng) {
    if (!this.map || !window.L) return;
    if (this.startMarker) this.startMarker.remove();
    const startIcon = window.L.divIcon({
      html: `<div style="width:24px;height:24px;border-radius:50%;border:3px solid #fff;background:transparent;box-shadow:0 0 0 1px rgba(0,0,0,0.2);"></div>`,
      className: '', iconAnchor: [12, 12]
    });
    this.startMarker = window.L.marker([lat, lng], { icon: startIcon }).addTo(this.map);
  },

  _crearPantalla() {
    document.getElementById('gpsTrackerOverlay')?.remove();
    const ov = document.createElement('div');
    ov.id = 'gpsTrackerOverlay';
    ov.style.cssText = `
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:#0a0a0a;
      z-index:999999;
      display:flex;
      flex-direction:column;
      font-family:"Courier New",monospace;
      color:#fff;
      user-select:none;
      -webkit-user-select:none;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
      box-sizing: border-box;
    `;

    ov.innerHTML = `
      <div id="gpsPreLock" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;background:#0a0a0a;">
        <div style="font-size:28px;font-weight:300;letter-spacing:4px;margin-bottom:20px;">RI5</div>
        <div style="font-size:12px;letter-spacing:3px;color:#c0a060;margin-bottom:8px;">ADQUIRIENDO GPS</div>
        <div style="width:200px;height:4px;background:#222;border-radius:2px;overflow:hidden;margin:20px auto 8px;">
          <div id="preLockBar" style="height:100%;width:0%;background:#c0a060;transition:width 0.3s;"></div>
        </div>
        <div id="preLockStatus" style="font-size:11px;color:#555;letter-spacing:1px;margin-top:8px;">buscando satélites...</div>
        <div style="display:flex;gap:16px;margin-top:32px;">
          <button id="preLockStartBtn" style="display:none;padding:10px 24px;border:1px solid #c0a060;background:transparent;color:#c0a060;border-radius:0;font-size:14px;cursor:pointer;font-family:inherit;letter-spacing:2px;">COMENZAR</button>
          <button onclick="GPSTracker.cancelar()" style="padding:10px 24px;border:1px solid #666;background:transparent;color:#888;border-radius:0;font-size:14px;cursor:pointer;font-family:inherit;letter-spacing:2px;">CANCELAR</button>
        </div>
        <div style="margin-top: 24px; font-size: 14px; font-weight: bold; color: #c0a060; background: rgba(192,160,96,0.1); padding: 8px 16px; border-radius: 20px; letter-spacing: 1px;">
          ⚠️ NO BLOQUEES EL MÓVIL DURANTE LA SESIÓN
        </div>
      </div>

      <div id="gpsSessionScreen" style="flex:1;display:none;flex-direction:column;">
        <div style="padding: max(10px, env(safe-area-inset-top)) 16px 10px 16px; background:#111; border-bottom:1px solid #222; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
          <div>
            <div style="font-size:10px;color:#555;letter-spacing:2px;">SESION EN CURSO</div>
            <div id="gpsSesionNombre" style="font-size:13px;color:#c0a060;font-weight:bold;letter-spacing:1px;margin-top:1px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div id="gpsSignalBars" style="display:flex;gap:3px;">
              <div style="width:4px;height:6px;background:#444;"></div>
              <div style="width:4px;height:10px;background:#444;"></div>
              <div style="width:4px;height:14px;background:#444;"></div>
              <div style="width:4px;height:18px;background:#444;"></div>
            </div>
            <span id="gpsSignalText" style="font-size:9px;color:#555;letter-spacing:1px;">—</span>
          </div>
        </div>

        <div id="gpsStepBar" style="padding:10px 16px;background:#141414;border-bottom:1px solid #1e1e1e;flex-shrink:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div><span id="gpsStepTitle" style="font-size:13px;font-weight:bold;letter-spacing:1px;color:#fff;"></span></div>
            <div style="text-align:right;">
              <div id="gpsStepCountdown" style="font-size:22px;font-weight:bold;color:#c0a060;font-variant-numeric:tabular-nums;">--:--</div>
              <div style="font-size:9px;color:#444;letter-spacing:1px;">RESTANTE</div>
            </div>
          </div>
          <div id="gpsStepDots" style="display:flex;gap:5px;margin-top:4px;"></div>
          <div id="gpsStepDesc" style="font-size:11px;color:#555;margin-top:6px;line-height:1.4;max-height:36px;overflow:hidden;"></div>
        </div>

        <div style="flex:1;min-height:0;position:relative;background:#0f0f0f;">
          <div id="gpsMap" style="width:100%;height:100%;"></div>
          <div id="gpsNoGPS" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f0f0f;color:#555;font-size:12px;letter-spacing:2px;text-align:center;pointer-events:none;">
            <div>Esperando posición</div>
          </div>
        </div>

        <div style="background:#111;border-top:1px solid #222;padding:14px 16px 20px;flex-shrink:0;">
          <div style="text-align:center;margin-bottom:12px;">
            <div id="gpsTimer" style="font-size:52px;font-weight:bold;letter-spacing:4px;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">00:00</div>
            <div style="font-size:9px;color:#333;letter-spacing:3px;margin-top:2px;">TIEMPO TOTAL</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div style="text-align:center;background:#1a1a1a;border:1px solid #222;border-radius:12px;padding:10px 6px;">
              <div id="gpsDistance" style="font-size:28px;font-weight:bold;color:#c0a060;font-variant-numeric:tabular-nums;">0.00</div>
              <div style="font-size:9px;color:#444;letter-spacing:2px;">KM</div>
            </div>
            <div style="text-align:center;background:#1a1a1a;border:1px solid #222;border-radius:12px;padding:10px 6px;">
              <div id="gpsPace" style="font-size:28px;font-weight:bold;color:#9BB5A0;font-variant-numeric:tabular-nums;">--:--</div>
              <div style="font-size:9px;color:#444;letter-spacing:2px;">MIN/KM</div>
            </div>
          </div>

          <div id="gpsButtonsContainer">
            <div id="gpsButtonsLocked" style="display:flex; gap:10px; opacity:0.5;">
              <button disabled style="flex:1;height:50px;border:1px solid #c0a060;background:transparent;color:#c0a060;border-radius:12px;font-size:14px;font-weight:bold;letter-spacing:1px;">PAUSA</button>
              <button disabled style="flex:1;height:50px;border:1px solid #9BB5A0;background:#9BB5A0;color:#0a0a0a;border-radius:12px;font-size:14px;font-weight:bold;letter-spacing:1px;">SIGUIENTE</button>
            </div>
            <div id="gpsButtonsUnlocked" style="display:none; gap:10px;">
              <button id="gpsPauseBtn" onclick="GPSTracker.togglePause()" style="flex:1;height:50px;border:1px solid #c0a060;background:transparent;color:#c0a060;border-radius:12px;font-size:14px;font-weight:bold;cursor:pointer;letter-spacing:1px;">PAUSA</button>
              <button id="gpsNextBtn"  onclick="GPSTracker.nextStep()"   style="flex:1;height:50px;border:1px solid #9BB5A0;background:#9BB5A0;color:#0a0a0a;border-radius:12px;font-size:14px;font-weight:bold;cursor:pointer;letter-spacing:1px;">SIGUIENTE</button>
            </div>
          </div>

          <div style="display:flex; justify-content:center; margin-top:12px;">
            <button id="gpsUnlockBtn" style="display:flex; align-items:center; justify-content:center; background:#2a2a2a; border:1px solid #c0a060; color:#c0a060; border-radius:30px; padding:12px 24px; font-size:14px; font-weight:bold; letter-spacing:2px; cursor:pointer; text-align:center;">🔓 DESBLOQUEAR</button>
          </div>

          <div id="gpsPauseBanner" style="display:none;text-align:center;margin-top:10px;color:#c0a060;font-size:12px;letter-spacing:2px;">EN PAUSA</div>
        </div>
      </div>

      <div id="gpsConfirm" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(10,10,10,.97);z-index:3000;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;">
        <div style="font-size:14px;letter-spacing:2px;color:#c0a060;margin-bottom:20px;">FINALIZAR SESION</div>
        <div id="gpsConfirmStats" style="font-size:22px;font-weight:bold;margin-bottom:30px;color:#fff;line-height:1.7;"></div>
        <div style="margin: 10px 0 20px 0;">
          <label style="font-size:12px; color:#aaa; letter-spacing:1px;">Editar distancia (km):</label>
          <input type="number" id="gpsEditDistance" step="0.01" style="width:100%;max-width:180px;margin:8px auto;padding:8px 12px;background:#222;border:1px solid #c0a060;border-radius:10px;color:#fff;text-align:center;font-family:monospace;display:block;">
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;">
          <button id="gpsConfirmYes" style="height:54px;background:#c0392b;border:none;color:#fff;border-radius:14px;font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:1px;">GUARDAR Y SALIR</button>
          <button id="gpsConfirmNo"  style="height:48px;background:transparent;border:1px solid #666;color:#aaa;border-radius:14px;font-size:14px;cursor:pointer;letter-spacing:1px;">CONTINUAR</button>
          <button id="gpsConfirmAbort" style="height:48px;background:transparent;border:1px solid #555;color:#888;border-radius:14px;font-size:14px;cursor:pointer;letter-spacing:1px;">SALIR SIN GUARDAR</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    const unlockBtn = document.getElementById('gpsUnlockBtn');
    const buttonsLocked = document.getElementById('gpsButtonsLocked');
    const buttonsUnlocked = document.getElementById('gpsButtonsUnlocked');

    const resetLock = () => {
      if (buttonsUnlocked && buttonsLocked) {
        buttonsUnlocked.style.display = 'none';
        buttonsLocked.style.display = 'flex';
      }
      if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
      this._isUnlocked = false;
      if (unlockBtn) {
        unlockBtn.innerHTML = '🔓 DESBLOQUEAR';
        unlockBtn.style.display = 'flex';
      }
    };

    const startAutoLockTimer = () => {
      if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
      this._unlockTimeout = setTimeout(() => {
        if (this._isUnlocked) resetLock();
      }, 5000);
    };

    const toggleLock = () => {
      if (!this._isUnlocked) {
        if (buttonsLocked && buttonsUnlocked) {
          buttonsLocked.style.display = 'none';
          buttonsUnlocked.style.display = 'flex';
          this._isUnlocked = true;
          startAutoLockTimer();
          if (unlockBtn) unlockBtn.innerHTML = '🔒 BLOQUEAR';
        }
      } else {
        resetLock();
      }
    };

    if (unlockBtn) unlockBtn.addEventListener('click', toggleLock);

    const pauseBtn = document.getElementById('gpsPauseBtn');
    const nextBtn = document.getElementById('gpsNextBtn');
    const resetTimerOnButtonPress = () => {
      if (this._isUnlocked) {
        if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
        startAutoLockTimer();
      }
    };
    if (pauseBtn) pauseBtn.addEventListener('click', resetTimerOnButtonPress);
    if (nextBtn) nextBtn.addEventListener('click', resetTimerOnButtonPress);

    const _yes = document.getElementById('gpsConfirmYes');
    const _no  = document.getElementById('gpsConfirmNo');
    const _abort = document.getElementById('gpsConfirmAbort');
    if (_yes) _yes.addEventListener('click', () => GPSTracker._confirmarFinalizar());
    if (_no)  _no.addEventListener('click',  () => GPSTracker._cancelarConfirm());
    if (_abort) _abort.addEventListener('click', () => GPSTracker._abortarSesion());
  },

  _renderStepDots() {
    const container = document.getElementById('gpsStepDots');
    if (!container) return;
    container.innerHTML = this.steps.map((s, i) => {
      const active   = i === this.stepIndex;
      const done     = i < this.stepIndex;
      const bg       = done ? '#9BB5A0' : active ? '#c0a060' : '#2a2a2a';
      return `<div style="height:4px;flex:1;border-radius:2px;background:${bg};transition:background .3s;" title="${s.titulo}"></div>`;
    }).join('');
  },

  _renderStepInfo() {
    const s = this.steps[this.stepIndex];
    if (!s) return;
    const titEl   = document.getElementById('gpsStepTitle');
    const descEl  = document.getElementById('gpsStepDesc');
    const nextBtn = document.getElementById('gpsNextBtn');
    if (titEl)   titEl.textContent   = s.titulo;
    if (descEl)  descEl.textContent  = s.accion;
    if (nextBtn) {
      const esUltimo = this.stepIndex >= this.steps.length - 1;
      if (esUltimo) {
        nextBtn.textContent = 'FINALIZAR';
        nextBtn.style.background = '#c0392b';
        nextBtn.style.borderColor = '#c0392b';
        nextBtn.style.color = '#fff';
      } else {
        nextBtn.textContent = 'SIGUIENTE';
        nextBtn.style.background = '#9BB5A0';
        nextBtn.style.borderColor = '#9BB5A0';
        nextBtn.style.color = '#0a0a0a';
      }
    }
    this._renderStepDots();
  },

  async iniciar(sesion, diaIndex) {
    if (this.isRunning) { Utils.showToast('Ya hay una sesión en curso', 'warning'); return; }
    if (!navigator.geolocation) { Utils.showToast('GPS no disponible', 'error'); return; }

    this.sesion      = sesion;
    this.diaIndex    = diaIndex;
    this.trackPoints = [];
    this._rawBuffer  = [];
    this._lastAccepted = null;
    this._lastGoodPoint = null;
    this._velocities = [];
    this._smoothBuffer = [];
    this._lastSmoothPoint = null;
    this.isPaused    = false;
    this.pausedTime  = 0;
    this.pauseStart  = null;
    this.map         = null;
    this.polyline    = null;
    this.currentMarker = null;
    this.startMarker = null;
    this._userMovedMap = false;
    if (this._autoCenterTimer) clearTimeout(this._autoCenterTimer);
    this._isUnlocked = false;
    if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
    this._autoNextPending = false;
    this._endingSession = false;

    this.steps     = this._buildSteps(sesion);
    this.stepIndex = 0;

    document.getElementById('detalleSesion')?.classList.remove('visible');
    document.getElementById('modalOverlay')?.classList.remove('visible');

    this._crearPantalla();

    const nombreEl = document.getElementById('gpsSesionNombre');
    if (nombreEl) nombreEl.textContent = (sesion.detalle?.nombre || sesion.tipo || 'SESION').toUpperCase();

    this._loadLeaflet();
    this._iniciarPreLock();
  },

  _iniciarPreLock() {
    const startBtn = document.getElementById('preLockStartBtn');
    const bar = document.getElementById('preLockBar');
    const status = document.getElementById('preLockStatus');

    if (startBtn) startBtn.style.display = 'none';

    this._initAudioContext().then(() => {
      if (this.steps && this.steps.length) {
        for (let step of this.steps) {
          const mensaje = `${step.titulo}, ${step.duracionMin} minutos, ${step.zona}`;
          this._speak(mensaje, true);
        }
      }
    }).catch(e => console.warn('Precarga falló', e));

    this.watchId = navigator.geolocation.watchPosition(pos => {
      const acc = pos.coords.accuracy;
      if (bar) {
        const pct = Math.min(100, Math.max(0, (1 - acc / 60) * 100));
        bar.style.width = pct + '%';
        bar.style.background = acc < 10 ? '#6bd46b' : acc < 20 ? '#f1c40f' : '#c0a060';
      }
      if (status) {
        if (acc <= 5) status.textContent = 'GPS listo';
        else if (acc <= 15) status.textContent = 'señal buena';
        else status.textContent = 'buscando satélites...';
      }

      if (acc <= 5) {
        if (startBtn && startBtn.style.display !== 'block') {
          startBtn.style.display = 'block';
          startBtn.onclick = async () => {
            await this._initAudioContext();
            await this._resumeAudioContext();
            this._startPreventSleep();
            this._prepararSesion(pos.coords.latitude, pos.coords.longitude, acc);
            this._startCountdown();
          };
        }
      } else {
        if (startBtn) startBtn.style.display = 'none';
      }
    }, err => {
      if (status) status.textContent = err.code === 1 ? 'permiso denegado' : 'sin señal GPS';
      if (startBtn) startBtn.style.display = 'none';
    }, { enableHighAccuracy: true, maximumAge: 500, timeout: 15000 });
  },

  _prepararSesion(lat, lng, acc) {
    const preLock = document.getElementById('gpsPreLock');
    const session = document.getElementById('gpsSessionScreen');
    if (preLock) preLock.style.display = 'none';
    if (session) session.style.display = 'flex';

    this._renderStepInfo();
    this._initMap(lat, lng);
    this._rawBuffer = [];
    this._lastAccepted = null;
    this._lastGoodPoint = null;
    this._velocities = [];
    this._smoothBuffer = [];
    this._lastSmoothPoint = null;

    const primerPunto = { lat, lng, ts: Date.now(), acc: Math.round(acc) };
    this.trackPoints.push(primerPunto);
    this._lastAccepted = primerPunto;
    this._lastGoodPoint = primerPunto; // <-- guardar como punto bueno
    this._lastSmoothPoint = primerPunto;
    this._smoothBuffer.push(primerPunto);
    this._updateMap(lat, lng);
    this._updatePolyline();
    this._addStartMarker(lat, lng);

    this._pendingStart = { lat, lng, acc };
    this._firstPointTime = Date.now();
    this._staticWarningShown = false;
  },

  _startCountdown() {
    let count = 3;
    const beepInterval = setInterval(() => {
      if (count > 0) {
        this._beep(440, 200);
        count--;
      } else {
        clearInterval(beepInterval);
        this._beep(880, 400);
        setTimeout(() => this._iniciarGrabacion(), 500);
      }
    }, 1000);
  },

  _iniciarGrabacion() {
    const { lat, lng, acc } = this._pendingStart;
    this.isRunning = true;
    this.startTime = Date.now();
    this.stepStartTime = Date.now();

    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = navigator.geolocation.watchPosition(
      pos => this._onPosition(pos),
      err => this._onGPSError(err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    this.timerInterval = setInterval(() => this._tick(), 1000);
    const primerBloque = this.steps[0];
    if (primerBloque) this._announceStep(primerBloque);
    if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate([50, 50, 100]);
  },

  _abortarSesion() {
    if (!this.isRunning && !this.watchId) return;
    this.isRunning = false;
    this._stopPreventSleep();
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    clearInterval(this.timerInterval);
    clearInterval(this.stepInterval);
    document.getElementById('gpsTrackerOverlay')?.remove();
    Utils.showToast('Sesión cancelada sin guardar', 'info');
  },

  cancelar() {
    this._stopPreventSleep();
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    clearInterval(this.timerInterval);
    clearInterval(this.stepInterval);
    document.getElementById('gpsTrackerOverlay')?.remove();
  },

  // ============================================================
  //  PROCESAMIENTO DE NUEVA POSICIÓN GPS
  // ============================================================
  _onPosition(pos) {
    const { latitude:lat, longitude:lng, accuracy } = pos.coords;
    const bars = document.querySelectorAll('#gpsSignalBars div');
    if (bars.length) {
      let level = 0;
      if (accuracy < 15) level = 4;
      else if (accuracy < 30) level = 3;
      else if (accuracy < 50) level = 2;
      else level = 1;
      bars.forEach((bar, idx) => { bar.style.background = idx < level ? '#c0a060' : '#333'; });
    }
    const txt = document.getElementById('gpsSignalText');
    if (txt) txt.textContent = `±${Math.round(accuracy)}m`;

    if (this.isPaused) return;

    const puntoFiltrado = this._filterGPS(lat, lng, accuracy, Date.now());
    if (!puntoFiltrado) return;
    const puntoSuave = this._smoothAndSimplify(puntoFiltrado.lat, puntoFiltrado.lng, puntoFiltrado.ts);
    if (puntoSuave) {
      // Actualizar el último punto bueno si la precisión es buena (≤ 20m)
      if (accuracy <= 20) {
        this._lastGoodPoint = puntoSuave;
      } else if (!this._lastGoodPoint) {
        // Si no hay punto bueno, usamos este aunque la precisión sea mala
        this._lastGoodPoint = puntoSuave;
      }
      // Añadir al track solo si es diferente al último
      const lastPoint = this.trackPoints[this.trackPoints.length - 1];
      if (!lastPoint ||
          Math.abs(lastPoint.lat - puntoSuave.lat) > 1e-8 ||
          Math.abs(lastPoint.lng - puntoSuave.lng) > 1e-8) {
        this.trackPoints.push(puntoSuave);
      }
      this._updateMap(puntoSuave.lat, puntoSuave.lng);
      this._lastAccepted = puntoSuave;
    }
    this._updateStats();
  },

  _onGPSError(err) {
    const txt = document.getElementById('gpsSignalText');
    if (txt) txt.textContent = err.code === 1 ? 'DENEGADO' : 'ERROR';
  },

  _getElapsed() {
    if (!this.startTime) return 0;
    if (this.isPaused) return (this.pauseStart - this.startTime) - this.pausedTime;
    return (Date.now() - this.startTime) - this.pausedTime;
  },

  _getStepElapsed() {
    if (!this.stepStartTime) return 0;
    if (this.isPaused) return (this.pauseStart - this.stepStartTime);
    return Date.now() - this.stepStartTime;
  },

  _tick() {
    if (!this.isRunning) return;
    const timerEl = document.getElementById('gpsTimer');
    if (timerEl) timerEl.textContent = this._fmtTime(this._getElapsed());

    const step = this.steps[this.stepIndex];
    if (step) {
      const durMs = step.duracionMin * 60 * 1000;
      const restante = Math.max(0, durMs - this._getStepElapsed());
      const cdEl = document.getElementById('gpsStepCountdown');
      if (cdEl) {
        cdEl.textContent = this._fmtTime(restante);
        cdEl.style.color = restante === 0 ? '#e74c3c' : '#c0a060';
      }
      if (restante === 0 && !this.isPaused && !this._autoNextPending && this.isRunning && !this._endingSession) {
        this._autoNextPending = true;
        this.nextStep(true);
        setTimeout(() => { this._autoNextPending = false; }, 1000);
      }
    }
  },

  _updateStats() {
    const distM = this._calcTotalDistance();
    const elapsed = this._getElapsed();
    const distEl = document.getElementById('gpsDistance');
    const paceEl = document.getElementById('gpsPace');
    if (distEl) distEl.textContent = (distM / 1000).toFixed(2);
    if (paceEl) paceEl.textContent = this._fmtPace(distM, elapsed);
  },

  togglePause() {
    if (!this.isRunning) return;
    const btn = document.getElementById('gpsPauseBtn');
    const banner = document.getElementById('gpsPauseBanner');
    if (this.isPaused) {
      this.pausedTime += Date.now() - this.pauseStart;
      this.pauseStart = null;
      this.isPaused = false;
      if (btn) { btn.innerHTML = 'PAUSA'; btn.style.color = '#c0a060'; btn.style.borderColor = '#c0a060'; }
      if (banner) banner.style.display = 'none';
      if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate(50);
      this._beep(660, 150);
      if (this._isUnlocked) {
        if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
        setTimeout(() => { if (this._isUnlocked) this._startAutoLockTimer(); }, 0);
      }
    } else {
      this.pauseStart = Date.now();
      this.isPaused = true;
      if (btn) { btn.innerHTML = 'REANUDAR'; btn.style.color = '#9BB5A0'; btn.style.borderColor = '#9BB5A0'; }
      if (banner) banner.style.display = 'block';
      if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate([50,50]);
      this._beep(440, 200);
    }
  },

  nextStep(isAuto = false) {
    if (!this.isRunning) return;
    const esUltimo = this.stepIndex >= this.steps.length - 1;
    if (esUltimo) {
      if (this._endingSession) return;
      this._announceSesionTerminada();
      this._mostrarConfirm();
      this._beep(880, 300);
    } else {
      this.stepIndex++;
      this.stepStartTime = Date.now();
      const nextBtn = document.getElementById('gpsNextBtn');
      if (nextBtn) nextBtn.style.animation = '';
      this._renderStepInfo();
      const nuevoBloque = this.steps[this.stepIndex];
      if (nuevoBloque) {
        this._beep(660, 100);
        this._announceStep(nuevoBloque);
      }
      if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate(60);
    }
    if (this._isUnlocked) {
      if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
      setTimeout(() => { if (this._isUnlocked) this._startAutoLockTimer(); }, 0);
    }
  },

  _startAutoLockTimer() {
    if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
    this._unlockTimeout = setTimeout(() => {
      if (this._isUnlocked) {
        const buttonsUnlocked = document.getElementById('gpsButtonsUnlocked');
        const buttonsLocked = document.getElementById('gpsButtonsLocked');
        if (buttonsUnlocked && buttonsLocked) {
          buttonsUnlocked.style.display = 'none';
          buttonsLocked.style.display = 'flex';
        }
        this._isUnlocked = false;
        const unlockBtn = document.getElementById('gpsUnlockBtn');
        if (unlockBtn) {
          unlockBtn.innerHTML = '🔓 DESBLOQUEAR';
          unlockBtn.style.display = 'flex';
        }
      }
    }, 5000);
  },

  _mostrarConfirm() {
    const distKm = (this._calcTotalDistance() / 1000).toFixed(2);
    const elapsed = this._fmtTime(this._getElapsed());
    const statsEl = document.getElementById('gpsConfirmStats');
    if (statsEl) statsEl.innerHTML = `${distKm} km · ${elapsed}`;
    const confirmDiv = document.getElementById('gpsConfirm');
    if (!confirmDiv) return;
    const editInput = document.getElementById('gpsEditDistance');
    if (editInput) editInput.value = distKm;
    Object.assign(confirmDiv.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(10,10,10,0.97)', zIndex: '3000', padding: '30px',
      textAlign: 'center', pointerEvents: 'all'
    });
  },

  _cancelarConfirm() {
    const conf = document.getElementById('gpsConfirm');
    if (conf) conf.style.display = 'none';
  },

  async _confirmarFinalizar() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this._stopPreventSleep();
    clearInterval(this.timerInterval);
    if (this.watchId !== null) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }

    let distKm = this._calcTotalDistance() / 1000;
    const editInput = document.getElementById('gpsEditDistance');
    if (editInput) {
      const newDist = parseFloat(editInput.value);
      if (!isNaN(newDist) && newDist > 0) distKm = newDist;
    }
    const elapsedMs = this._getElapsed();
    document.getElementById('gpsTrackerOverlay')?.remove();

    Utils.showLoading();
    try {
      await this._guardarYPublicar(distKm, elapsedMs);
      Utils.hideLoading();
      Utils.showToast(`Sesión guardada · ${distKm.toFixed(2)} km · ${this._fmtTime(elapsedMs)}`, 'success', 5000);
      if (typeof Utils.launchConfetti === 'function') Utils.launchConfetti();
      if (typeof Utils.vibrate === 'function') Utils.vibrate([100,50,100,50,200]);
      if (typeof Utils.playSound === 'function') Utils.playSound('success');
    } catch(err) {
      console.error('Error guardando sesión GPS:', err);
      Utils.hideLoading();
      Utils.showToast(`Error GPS: ${err?.message || 'Error desconocido'}`, 'error', 6000);
    }
  },

  async _guardarYPublicar(distKm, elapsedMs) {
    const uid = AppState?.currentUserId;
    if (!uid || !AppState?.planActualId) throw new Error('Sin usuario o plan activo');
    const planId = AppState.planActualId;
    const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
    const ptsFull = this.trackPoints;
    const ptsWall = this._decimarPuntos(ptsFull, 80);
    const trackData = {
      points: ptsFull.map(p => ({ lat: p.lat, lng: p.lng })),
      distanceKm: parseFloat(distKm.toFixed(3)),
      durationMs: elapsedMs,
      recordedAt: new Date().toISOString(),
      sesionIndex: this.diaIndex,
      planId
    };
    try {
      await firebaseServices.db.collection('users').doc(uid).collection('gps_tracks').add(trackData);
    } catch(e) { console.warn('gps_tracks sin permiso:', e.message); }
    try {
      await planRef.update({ [`gpsTrack.${this.diaIndex}`]: { distanceKm: trackData.distanceKm, durationMs: trackData.durationMs, recordedAt: trackData.recordedAt } });
    } catch(e) { console.warn('No se pudo guardar metadata GPS en el plan:', e.message); }
    await PlanGenerator.marcarSesionRealizada(this.diaIndex, true, distKm, elapsedMs);
    const planDoc = await planRef.get();
    const wallEntryId = planDoc.data()?.wallEntryId?.[this.diaIndex];
    if (wallEntryId) {
      await firebaseServices.db.collection('globalFeed').doc(wallEntryId).update({
        hasGPS: true,
        trackPoints: ptsWall.map(p => ({ lat: p.lat, lng: p.lng })),
        gpsDistanceKm: parseFloat(distKm.toFixed(3)),
        gpsDurationMs: elapsedMs,
        distancia: parseFloat(distKm.toFixed(3)),
        duration: Math.floor(elapsedMs / 60000)
      });
    }
  },

  _decimarPuntos(pts, max) {
    if (pts.length <= max) return pts;
    const step = Math.ceil(pts.length / max);
    const res = [];
    for (let i = 0; i < pts.length; i += step) res.push(pts[i]);
    if (res[res.length-1] !== pts[pts.length-1]) res.push(pts[pts.length-1]);
    return res;
  },

  renderTrackSVG(points, width = 320, height = 130) {
    if (!points || points.length < 2) return '';
    const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const rangeLng = maxLng - minLng || 0.0001, rangeLat = maxLat - minLat || 0.0001;
    const pad = 14, W = width - pad*2, H = height - pad*2;
    const scale = Math.min(W/rangeLng, H/rangeLat);
    const offX = pad + (W - rangeLng*scale)/2, offY = pad + (H - rangeLat*scale)/2;
    const toXY = p => `${(offX+(p.lng-minLng)*scale).toFixed(1)},${(offY+(maxLat-p.lat)*scale).toFixed(1)}`;
    const pathD = 'M '+points.map(toXY).join(' L ');
    const s = toXY(points[0]).split(','), e = toXY(points[points.length-1]).split(',');
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
        style="border-radius:10px; background:#eaeaea; display:block; width:100%; max-width:${width}px;"
        xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#eaeaea" rx="8" ry="8"/>
      <path d="${pathD}" fill="none" stroke="#c0a060" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <circle cx="${s[0]}" cy="${s[1]}" r="7" fill="none" stroke="#fff" stroke-width="2"/>
      <text x="${e[0]}" y="${e[1]}" font-size="18" text-anchor="middle" dominant-baseline="central">🏁</text>
    </svg>`;
  }
};

window.GPSTracker = GPSTracker;
console.log('✅ GPS Tracker v4.1 - Bandera siempre centrada + re-centrado automático 5s');