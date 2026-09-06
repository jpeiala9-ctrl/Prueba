// ==================== gps-tracker.js ====================
// Versión: 5.4 - FIX: el anuncio de voz de cada bloque ya no "adivina" la
//                zona leyendo con una expresión regular el texto libre
//                que el admin escribió en "accion" (campo pensado para
//                describirle al corredor qué hacer, no para que el GPS lo
//                parseara). CALENTAMIENTO y ENFRIAMIENTO ahora anuncian
//                SIEMPRE "zona 1" (son bloques fijos de trote suave, 10'
//                y 5' por defecto). La PARTE PRINCIPAL usa la zona real
//                que el admin eligió en el selector dedicado (d.zona --
//                para "series" es la zonaEsfuerzo de seriesConfig), y en
//                sesiones de tipo "series" el mensaje pasa a diferenciar
//                zona de esfuerzo y zona de descanso ("series en zona 5
//                con descanso en zona 2") en vez de anunciar una sola
//                zona suelta -- que antes, si el texto libre mencionaba
//                antes la zona de descanso, podía ser la equivocada.
// Versión: 5.3 - _buildSteps: los pasos extra "🏃 carrera" (añadidos en el
//                generador de sesiones) llevan su propia duración y su
//                propia zona en vez de repartirse el tiempo de la parte
//                principal a partes iguales; los pasos "💪 fuerza" se
//                excluyen del rastreo GPS de forma explícita (tipoExtra),
//                no solo por coincidencia de título.
// Versión: 5.2 - Además de actualizar el récord global si se bate, ahora
//                se guarda 'recordsPorTramo' (mejor tramo de ESTA sesión
//                por distancia) en la propia entrada del muro, para que
//                gamification.js pueda recalcular el récord global de
//                forma 100% fiable (solo con sesiones GPS reales que
//                sigan existiendo) si más adelante se desmarca/borra otra
//                sesión distinta -- ver gamification.js v5.12.
// Versión: 5.1 - Al guardar una sesión con GPS, calcula récords por
//                tramo (mejor 1/5/10/21.1/42.2 km dentro del recorrido)
//                con Gamification.actualizarRecordsPorTramos, usando el
//                track completo con timestamps antes de decimarlo
// Versión: 5.0 - FIX RAÍZ: seguimiento de bandera a prueba de fallos (dragstart en vez de movestart/moveend)
//                + Douglas-Peucker y ajuste a calles (OSRM) para línea/km exactos
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

  _pendingStart: null,
  _firstPointTime: null,
  _staticWarningShown: false,

  // ===== RE-CENTRADO OBLIGATORIO =====
  _userMovedMap: false,
  _autoCenterTimer: null,
  _lastUserInteraction: 0, // timestamp de la última interacción
  _autoCentering: false,

  _unlockTimeout: null,
  _isUnlocked: false,

  _audioCtx: null,

  _keepAliveOsc: null,
  _keepAliveGain: null,
  _keepAliveInterval: null,
  _wakeLock: null,

  // ===== Último punto bueno =====
  _lastGoodPoint: null,

  // ===== Track final procesado (Douglas-Peucker + ajuste a calles) =====
  _finalTrackPoints: null,
  _autoFilledDistanceKm: null,

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

  _vozSeleccionada: null,
  _vozBuscada: false,

  // El navegador suele tener varias voces en español instaladas, y no
  // todas suenan igual de robóticas. Antes se usaba la que el navegador
  // decidiera por defecto (a menudo la más sintética); esto busca entre
  // las disponibles y prioriza las que suelen sonar más naturales
  // (marcadas como "mejorada"/"enhanced"/"neural"/"natural" por el
  // fabricante, o voces online de Google que son mejores que las
  // locales). Si el dispositivo no tiene ninguna especialmente buena,
  // simplemente coge la mejor española disponible.
  _elegirMejorVoz() {
    if (!window.speechSynthesis) return null;
    const voces = window.speechSynthesis.getVoices();
    if (!voces.length) return null;

    const esp = voces.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (!esp.length) return null;

    const puntuar = (v) => {
      const n = v.name.toLowerCase();
      let p = 0;
      if (v.lang.toLowerCase() === 'es-es') p += 3; // España, coincide con el acento de la app
      if (n.includes('enhanced') || n.includes('mejorada') || n.includes('premium') || n.includes('neural') || n.includes('natural')) p += 5;
      if (n.includes('google')) p += 2; // las voces "Google español" online suelen ser más naturales que las del sistema
      if (!v.localService) p += 1; // las voces online (no on-device) suelen tener más calidad
      return p;
    };

    esp.sort((a, b) => puntuar(b) - puntuar(a));
    return esp[0];
  },

  _obtenerVoz() {
    if (this._vozSeleccionada) return this._vozSeleccionada;
    const voz = this._elegirMejorVoz();
    if (voz) { this._vozSeleccionada = voz; this._vozBuscada = true; }
    return voz;
  },

  _speak(text, preload = false) {
    if (!window.speechSynthesis) return;
    // Las voces a veces se cargan de forma asíncrona la primera vez
    // (evento 'voiceschanged'); si aún no hay ninguna, se reintenta en
    // cuanto estén listas en vez de quedarnos con la voz por defecto.
    if (!this._vozBuscada && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => { this._obtenerVoz(); }, { once: true });
    }
    const voz = this._obtenerVoz();

    if (preload) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      if (voz) utterance.voice = voz;
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    if (voz) utterance.voice = voz;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  },

  _announceStep(step) {
    if (!step) return;
    const mensaje = step.mensajeVoz || `${step.titulo}, ${step.duracionMin} minutos, ${step.zona}`;
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

  // ============================================================
  //  CENTRADO DE MAPA A PRUEBA DE FALLOS
  // ============================================================
  // Centra el mapa marcando explícitamente que este movimiento lo hace LA
  // APP (no el usuario), para que los listeners de interacción real
  // (dragstart/zoomstart) nunca lo confundan con un gesto manual. Incluye
  // una red de seguridad (setTimeout) por si 'moveend' no llega a
  // disparar -- por ejemplo cuando el mapa ya está exactamente en esa
  // posición y Leaflet decide que no hay nada que animar.
  _centerOnFlag(lat, lng) {
    if (!this.map) return;
    this._autoCentering = true;
    const clear = () => { this._autoCentering = false; };
    this.map.once('moveend', clear);
    this.map.setView([lat, lng], this.map.getZoom(), { animate: true });
    setTimeout(clear, 600);
  },

  // ============================================================
  //  SIMPLIFICACIÓN DOUGLAS-PEUCKER (reduce ruido/zigzag GPS)
  // ============================================================
  // Aproximación plana local en metros (válida para distancias cortas
  // como una sesión de running; no se usa para tramos de cientos de km).
  _perpendicularDistanceMeters(pt, lineStart, lineEnd) {
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(lineStart.lat * Math.PI / 180);
    const x = (pt.lng - lineStart.lng) * mPerDegLng;
    const y = (pt.lat - lineStart.lat) * mPerDegLat;
    const ex = (lineEnd.lng - lineStart.lng) * mPerDegLng;
    const ey = (lineEnd.lat - lineStart.lat) * mPerDegLat;
    const lenSq = ex * ex + ey * ey;
    if (lenSq === 0) return Math.sqrt(x * x + y * y);
    let t = (x * ex + y * ey) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const dx = x - t * ex, dy = y - t * ey;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Elimina puntos que no aportan forma real al recorrido (dentro de
  // epsilonM metros de la línea recta entre sus vecinos conservados).
  // Esto "endereza" el zigzag de ruido GPS sin necesidad de red.
  _douglasPeucker(points, epsilonM) {
    if (points.length < 3) return points.slice();
    let maxDist = 0, index = 0;
    const start = points[0], end = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
      const d = this._perpendicularDistanceMeters(points[i], start, end);
      if (d > maxDist) { maxDist = d; index = i; }
    }
    if (maxDist > epsilonM) {
      const left = this._douglasPeucker(points.slice(0, index + 1), epsilonM);
      const right = this._douglasPeucker(points.slice(index), epsilonM);
      return left.slice(0, -1).concat(right);
    }
    return [start, end];
  },

  // 🔥 Se elimina por completo el "ajuste a calles" (OSRM Map Matching)
  // que había aquí: aunque solo se usaba como mejora visual del dibujo
  // del mapa (la distancia ya no dependía de él, ver versión anterior),
  // el usuario pidió expresamente que el track sea SIEMPRE el que grabó
  // el GPS, sin que ningún servicio externo lo reinterprete -- por
  // ejemplo, al correr por campo, podía "pegar" la ruta a un camino
  // cercano que en realidad no se había pisado.

  // ===== FILTRO GPS ESTRICTO (sin extrapolación, solo precisión ≤ 15m) =====
  _filterGPS(lat, lng, accuracy, timestamp) {
    // Si la precisión es > 15m, descartamos el punto (no se añade al track ni suma distancia)
    // Excepción: los primeros 3 puntos para tener una posición inicial
    if (this.trackPoints.length > 3 && accuracy > 15) {
      // No descartamos el punto, pero no lo añadimos al track; solo actualizamos la bandera si es necesario
      if (this._lastGoodPoint) {
        // La bandera se queda en el último punto bueno
        return null;
      }
      // Si no hay punto bueno, lo usamos como provisional
    }

    this._rawBuffer.push({ lat, lng, acc: Math.max(1, accuracy), ts: timestamp });
    if (this._rawBuffer.length > 8) this._rawBuffer.shift();
    if (this._rawBuffer.length < 2) return null;

    // Mediana para suavizar
    const lats = this._rawBuffer.map(p => p.lat).sort((a,b)=>a-b);
    const lngs = this._rawBuffer.map(p => p.lng).sort((a,b)=>a-b);
    const medianLat = lats[Math.floor(lats.length/2)];
    const medianLng = lngs[Math.floor(lngs.length/2)];

    let punto = { lat: medianLat, lng: medianLng, ts: timestamp, acc: Math.round(accuracy) };

    // NO EXTRAPOLACIÓN: nunca inventamos puntos.

    // Filtro de velocidad (18 km/h máximo para evitar saltos)
    const maxSpeed = 5.0; // 5 m/s = 18 km/h
    if (this._lastAccepted) {
      const dt = Math.max(0.5, (timestamp - this._lastAccepted.ts) / 1000);
      const dist = this._haversine(this._lastAccepted.lat, this._lastAccepted.lng, punto.lat, punto.lng);
      const speed = dist / dt;
      if (speed > maxSpeed && dist > 10) {
        // Si la velocidad es > 18 km/h y la distancia > 10m, es un salto, descartamos
        return null;
      }
    }

    if (this._lastAccepted) {
      const distToLast = this._haversine(this._lastAccepted.lat, this._lastAccepted.lng, punto.lat, punto.lng);
      if (distToLast < 1.5) return null; // muy cerca, lo descartamos
    }

    // Guardamos el punto como aceptado
    this._lastAccepted = punto;

    // Solo consideramos "bueno" si la precisión es ≤ 15m
    if (accuracy <= 15) {
      this._lastGoodPoint = punto;
    } else if (!this._lastGoodPoint) {
      this._lastGoodPoint = punto;
    }

    return punto;
  },

  // 🔥 A petición expresa del usuario: se elimina por completo
  // _smoothAndSimplify. Lo que hacía, además de una media móvil de 5
  // muestras, era FUNDIR puntos consecutivos en uno solo cuando el
  // cambio de dirección entre ellos era pequeño (<10°) -- pensado para
  // "enderezar" el zigzag de ruido GPS. El problema: en un tramo con
  // curvas reales suaves (una carretera que serpentea, un camino de
  // parque, cualquier trazado que no sea una línea perfectamente recta,
  // que es la inmensa mayoría de las carreras reales) esto iba
  // sustituyendo puntos en vez de añadirlos, punto a punto, mientras la
  // desviación acumulada desde la última referencia se mantuviera por
  // debajo de ese umbral -- y esa referencia se quedaba cada vez más
  // atrás según se iban fundiendo puntos, así que una curva suave y
  // sostenida podía "acortarse" (cuerda en vez de arco) durante un buen
  // tramo antes de que la desviación por fin superara los 10° y se
  // añadiera un punto nuevo de verdad. Sumado a lo largo de una sesión
  // entera, esto podía recortar el kilometraje real de forma muy
  // notable (una carrera de 10,5 km grabada como ~7 km) -- exactamente
  // lo contrario de lo que se pidió: "si hago diez kilómetros, diez
  // kilómetros". _filterGPS ya se encarga de lo que de verdad hace
  // falta descartar (precisión mala, saltos físicamente imposibles,
  // puntos a menos de 1,5m que no aportan nada): con eso basta para un
  // track fiel. El track puede verse algo más "en zigzag" que antes en
  // el mapa -- es el precio de que el kilometraje sea el real, y es
  // justo lo que se pidió.

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

  // 🔥 v10: los pasos de tipo "carrera" (tipoExtra='carrera', añadidos con
  // el botón "🏃 + CARRERA" del generador de sesiones) llevan su PROPIA
  // duración (p.duracionMin, puesta por el admin) y su PROPIA zona
  // (p.zona, elegida por el admin) -- antes se repartía el tiempo de la
  // parte principal a partes iguales entre "PARTE PRINCIPAL" y estos
  // pasos extra, dando duraciones incorrectas a ambos. El orden en el
  // array ya los deja justo después de "PARTE PRINCIPAL" y antes del
  // enfriamiento (así se construyó en session-invites.js), así que el GPS
  // pasa automáticamente a ellos al terminar la parte principal, y de ahí
  // sigue al enfriamiento como siguiente paso.
  // Los pasos de tipo "fuerza" (tipoExtra='fuerza', o legado por título
  // "FUERZA") nunca se rastrean por GPS -- solo suman tiempo total a la
  // sesión, no son carrera.
  _buildSteps(sesion) {
    const d = sesion.detalle;
    if (!d) return [{ icono:'', titulo:'SESION', duracionMin: sesion.duracion || 45, accion:'', zona:'zona 1' }];
    let pasos = (d.pasosDetallados || []).filter(p => {
      if (p.tipoExtra === 'fuerza') return false;
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

    // La parte principal "clásica" (paso PARTE PRINCIPAL) se queda con lo
    // que sobra de d.partePrincipal tras restar los pasos extra de
    // carrera, que ya llevan su propio tiempo aparte (puesto por el admin,
    // no repartido).
    const sumaExtrasCarreraMin = pasos
      .filter(p => p.tipoExtra === 'carrera')
      .reduce((s, p) => s + (p.duracionMin || 0), 0);
    const partePrincipalBaseMin = Math.max(0, (d.partePrincipal || 25) - sumaExtrasCarreraMin);

    return pasos.map(p => {
      const tit = (p.titulo || '').toUpperCase();

      // Paso extra de carrera: duración y zona propias, sin repartir nada
      if (p.tipoExtra === 'carrera') {
        return {
          icono: '',
          titulo: tit,
          duracionMin: p.duracionMin || 0,
          accion: p.accion || '',
          zona: p.zona ? `zona ${String(p.zona).replace(/[^0-9]/g, '')}` : this._extractZoneFromAction(p.accion)
        };
      }

      const esCalentamiento = tit.includes('CALENTAMIENTO');
      const esEnfriamiento  = tit.includes('ENFRIAMIENTO');

      let durMin;
      if (esCalentamiento)      durMin = d.calentamiento  || 10;
      else if (esEnfriamiento)  durMin = d.enfriamiento    || 5;
      else {
        const nMain = pasos.filter(x => {
          if (x.tipoExtra) return false;
          const t = (x.titulo||'').toUpperCase();
          return !t.includes('CALENTAMIENTO') && !t.includes('ENFRIAMIENTO');
        }).length;
        durMin = Math.round(partePrincipalBaseMin / Math.max(1, nMain));
      }

      // 🔥 FIX: calentamiento y enfriamiento SIEMPRE son zona 1 -- son
      // bloques fijos de trote suave (10' y 5' por defecto), nunca
      // dependen de lo que el admin haya escrito en el campo de texto
      // libre "accion" de ese paso. Antes la zona de CUALQUIER paso
      // (incluidos estos dos) se sacaba con una expresión regular sobre
      // ese texto libre, y si por lo que fuera mencionaba otra zona, el
      // calentamiento podía anunciar "zona cinco" en vez de "zona uno".
      if (esCalentamiento || esEnfriamiento) {
        return { icono: '', titulo: tit, duracionMin: durMin, accion: p.accion || '', zona: 'zona 1' };
      }

      // Paso principal (ni calentamiento, ni enfriamiento, ni carrera
      // extra): la zona real de esfuerzo es la que el admin eligió en el
      // selector dedicado (d.zona -- que para "series" es justo
      // seriesConfig.zonaEsfuerzo), NO la que se pueda "adivinar" leyendo
      // el texto libre de "accion". Ese texto puede mencionar también la
      // zona de descanso (p.ej. "...descanso trote suave Z2"), y antes el
      // regex se quedaba con la PRIMERA zona que encontraba ahí -- que
      // podía ser la de descanso, no la de esfuerzo. Con series esto era
      // grave: el GPS anunciaba "zona 2" en vez de la Z4/Z5 que es el
      // objetivo real de la sesión.
      const zonaEsfuerzo = d.zona
        ? `zona ${String(d.zona).replace(/[^0-9]/g, '')}`
        : this._extractZoneFromAction(p.accion);

      // Para sesiones de "series", el mensaje de voz de la parte
      // principal tiene que diferenciar la zona de esfuerzo (las
      // repeticiones en sí -- lo que de verdad importa) de la zona de
      // descanso entre repeticiones -- que en esta app siempre es zona 2
      // -- en vez de anunciar solo una zona suelta y sin contexto.
      let mensajeVoz = null;
      if (sesion.tipo === 'series' && d.seriesConfig) {
        mensajeVoz = `${tit}: series en ${zonaEsfuerzo} con descanso en zona 2`;
      }

      return { icono: '', titulo: tit, duracionMin: durMin, accion: p.accion || '', zona: zonaEsfuerzo, mensajeVoz };
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
  //  MAPA: CENTRADO OBLIGATORIO EN 3 SEGUNDOS
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

      // ===== RE-CENTRADO OBLIGATORIO CADA 3 SEGUNDOS =====
      // FIX RAÍZ: antes se usaban 'movestart'/'moveend'/'zoomend' para
      // detectar "el usuario tocó el mapa". El problema es que esos mismos
      // eventos TAMBIÉN se disparan cuando la propia app mueve el mapa
      // (seguimiento de la bandera y recentrado obligatorio). Por eso cada
      // centrado automático se confundía con una interacción del usuario,
      // rompiendo el seguimiento justo después de centrar una vez.
      // Ahora usamos 'dragstart', que en Leaflet SOLO se dispara cuando el
      // usuario arrastra el mapa con el dedo/ratón, nunca por setView()
      // programático. Además, todo centrado propio pasa por
      // _centerOnFlag(), que marca _autoCentering mientras dura el
      // movimiento, como protección adicional.
      const forceCenter = () => {
        if (this._autoCenterTimer) clearTimeout(this._autoCenterTimer);
        this._autoCenterTimer = null;
        const now = Date.now();
        if (now - this._lastUserInteraction > 3000) {
          // Se centra siempre sobre la posición REAL de la bandera en el
          // mapa (currentMarker.getLatLng()), no sobre _lastGoodPoint por
          // separado. _lastGoodPoint es una pieza de estado distinta que
          // se actualiza en más de un sitio (_filterGPS y _onPosition); si
          // alguna vez quedaba un instante desincronizada de dónde estaba
          // dibujada la bandera de verdad, el mapa centraba ahí en vez de
          // sobre la bandera -- parecía un punto "aleatorio" del mapa.
          // Centrando sobre el propio marcador, es imposible que difieran.
          const pos = this.currentMarker ? this.currentMarker.getLatLng() : this._lastGoodPoint;
          if (pos) this._centerOnFlag(pos.lat, pos.lng);
        }
        // Programar el próximo centrado en 3 segundos (si el mapa sigue
        // existiendo). ANTES se comprobaba 'this.isRunning' aquí, pero esa
        // bandera no se pone a true hasta que termina la cuenta atrás
        // "3, 2, 1" (_startCountdown, unos 4.5s después de crear el mapa
        // en _prepararSesion) -- mientras que este bucle arrancaba su
        // primer ciclo a los 3s de crear el mapa, es decir ANTES de que
        // isRunning pasara a true. Esa carrera hacía que la primera
        // ejecución de forceCenter encontrara isRunning todavía en false
        // y no se reprogramara a sí misma: el bucle moría nada más
        // empezar la sesión, sin que el usuario hubiera tenido tiempo ni
        // de tocar el mapa. Por eso el recentrado automático parecía no
        // funcionar nunca... hasta que algo (como rotar la pantalla, ver
        // onOrientationOrResize más abajo) volvía a llamar a forceCenter
        // manualmente en un momento en que isRunning ya sí era true, y
        // ahí el bucle se reenganchaba y seguía funcionando el resto de
        // la sesión. Usar 'this.map' en vez de 'this.isRunning' arregla
        // la carrera: el mapa existe desde el instante en que se crea
        // (_initMap) hasta que la sesión termina de verdad (_limpiarMapaYListeners
        // o el reseteo final lo ponen a null), así que el bucle sigue vivo
        // durante toda la cuenta atrás y la sesión, sin depender de en qué
        // momento exacto cae su primer ciclo.
        if (this.map && !this.isPaused) {
          this._autoCenterTimer = setTimeout(forceCenter, 3000);
        }
      };

      // Eventos de interacción REAL del usuario (jamás disparados por la app)
      this.map.on('dragstart', () => {
        if (this._autoCentering) return;
        this._userMovedMap = true;
        this._lastUserInteraction = Date.now();
      });
      this.map.on('zoomstart', () => {
        if (this._autoCentering) return;
        this._userMovedMap = true;
        this._lastUserInteraction = Date.now();
      });

      // Se guarda la referencia a la función para poder relanzar la cadena
      // de recentrados después de una pausa (ver togglePause). Antes,
      // cuando forceCenter se ejecutaba con isPaused=true, no se
      // reprogramaba a sí misma y la cadena moría para siempre: al
      // reanudar la carrera, el recentrado automático periódico ya no
      // volvía a funcionar en lo que quedaba de sesión.
      this._forceCenterFn = forceCenter;

      // FALLO REAL: al rotar el móvil, el <div> del mapa cambia de tamaño
      // (ancho y alto se intercambian), pero Leaflet no se entera solo --
      // se queda con las medidas de ANTES de rotar guardadas por dentro, y
      // todos los cálculos de centrado a partir de ahí salen mal (la
      // bandera "se pierde" del centro y no vuelve a quedar bien aunque se
      // gire otra vez a vertical). El arreglo es decirle a Leaflet que
      // recalcule su tamaño (invalidateSize) en cuanto cambie la
      // orientación o el tamaño de la ventana, y forzar un recentrado justo
      // después.
      const onOrientationOrResize = () => {
        if (!this.map) return;
        const doRecenter = () => {
          try {
            this.map.invalidateSize();
            if (typeof this._forceCenterFn === 'function') {
              this._lastUserInteraction = 0; // fuerza que el próximo recentrado no se salte por "interacción reciente"
              this._forceCenterFn();
            }
          } catch (e) { console.warn('Error reajustando el mapa tras rotar:', e); }
        };
        // Algunos dispositivos (sobre todo Android de gama baja) tardan más
        // de 250ms en terminar la animación del sistema al girar la
        // pantalla; si se mide el tamaño del contenedor demasiado pronto,
        // invalidateSize() se queda con una medida intermedia y el
        // recentrado sale mal. Por eso se repite una segunda vez a los
        // 600ms: si el primer intento ya fue correcto, este segundo no
        // hace ningún cambio visible (vuelve a centrar sobre el mismo
        // punto), así que no tiene coste real.
        setTimeout(doRecenter, 250);
        setTimeout(doRecenter, 600);
      };
      window.addEventListener('orientationchange', onOrientationOrResize);
      window.addEventListener('resize', onOrientationOrResize);
      // window.orientationchange no se dispara de forma fiable en todos
      // los navegadores (algunos Android). La Screen Orientation API es
      // más consistente donde está disponible, así que se añade como
      // segunda vía -- ambas llaman a la misma función y no hay problema
      // en que las dos disparen para el mismo giro.
      if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
        window.screen.orientation.addEventListener('change', onOrientationOrResize);
      }
      this._onOrientationOrResize = onOrientationOrResize;

      // Iniciar el temporizador de centrado
      this._autoCenterTimer = setTimeout(forceCenter, 3000);

    } catch(e) { console.warn('Map init error', e); }
  },

  // ============================================================
  //  ACTUALIZACIÓN DEL MAPA (bandera siempre al centro)
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

      // Centrar el mapa en la bandera SOLO si:
      // - El usuario no ha interactuado en los últimos 3 segundos
      // - O si está en modo auto-centrado (para evitar conflictos)
      const now = Date.now();
      if (!this._userMovedMap || (now - this._lastUserInteraction > 3000) || this._autoCentering) {
        this._centerOnFlag(targetLat, targetLng);
        this._userMovedMap = false;
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

  _limpiarMapaYListeners() {
    if (this._onOrientationOrResize) {
      window.removeEventListener('orientationchange', this._onOrientationOrResize);
      window.removeEventListener('resize', this._onOrientationOrResize);
      if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener) {
        window.screen.orientation.removeEventListener('change', this._onOrientationOrResize);
      }
      this._onOrientationOrResize = null;
    }
    if (this._autoCenterTimer) { clearTimeout(this._autoCenterTimer); this._autoCenterTimer = null; }
    if (this.map) {
      try { this.map.remove(); } catch(e) {}
      this.map = null;
    }
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
      background:var(--bg-primary);
      z-index:999999;
      display:flex;
      flex-direction:column;
      font-family:"Courier New",monospace;
      color:var(--text-primary);
      user-select:none;
      -webkit-user-select:none;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.28s ease;
    `;

    ov.innerHTML = `
      <div id="gpsPreLock" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;background:var(--bg-primary);">
        <div style="font-size:28px;font-weight:300;letter-spacing:4px;margin-bottom:20px;color:var(--text-primary);">RI5</div>
        <div style="font-size:12px;letter-spacing:3px;color:var(--gold);margin-bottom:8px;">ADQUIRIENDO GPS</div>
        <div style="width:200px;height:4px;background:var(--border-color);border-radius:2px;overflow:hidden;margin:20px auto 8px;">
          <div id="preLockBar" style="height:100%;width:0%;background:var(--gold);transition:width 0.3s;"></div>
        </div>
        <div id="preLockStatus" style="font-size:11px;color:var(--text-secondary);letter-spacing:1px;margin-top:8px;">buscando satélites...</div>
        <div style="display:flex;gap:16px;margin-top:32px;">
          <button onclick="GPSTracker.cancelar()" style="padding:10px 24px;border:1px solid var(--border-color);background:transparent;color:var(--text-secondary);border-radius:0;font-size:14px;cursor:pointer;font-family:inherit;letter-spacing:2px;">CANCELAR</button>
          <button id="preLockStartBtn" style="display:none;padding:10px 24px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:0;font-size:14px;cursor:pointer;font-family:inherit;letter-spacing:2px;">COMENZAR</button>
        </div>
        <div style="margin-top: 24px; font-size: 14px; font-weight: bold; color: var(--gold); background: rgba(192,160,96,0.1); padding: 8px 16px; border-radius: 20px; letter-spacing: 1px;">
          ⚠️ NO BLOQUEES EL MÓVIL DURANTE LA SESIÓN
        </div>
      </div>

      <div id="gpsSessionScreen" style="flex:1;display:none;flex-direction:column;">
        <div style="padding: max(10px, env(safe-area-inset-top)) 16px 10px 16px; background:var(--bg-secondary); border-bottom:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
          <div>
            <div style="font-size:10px;color:var(--text-secondary);letter-spacing:2px;">SESION EN CURSO</div>
            <div id="gpsSesionNombre" style="font-size:13px;color:var(--gold);font-weight:bold;letter-spacing:1px;margin-top:1px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div id="gpsSignalBars" style="display:flex;gap:3px;">
              <div style="width:4px;height:6px;background:var(--border-color);"></div>
              <div style="width:4px;height:10px;background:var(--border-color);"></div>
              <div style="width:4px;height:14px;background:var(--border-color);"></div>
              <div style="width:4px;height:18px;background:var(--border-color);"></div>
            </div>
            <span id="gpsSignalText" style="font-size:9px;color:var(--text-secondary);letter-spacing:1px;">—</span>
          </div>
        </div>

        <div id="gpsStepBar" style="padding:10px 16px;background:var(--bg-secondary);border-bottom:1px solid var(--border-color);flex-shrink:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div><span id="gpsStepTitle" style="font-size:13px;font-weight:bold;letter-spacing:1px;color:var(--text-primary);"></span></div>
            <div style="text-align:right;">
              <div id="gpsStepCountdown" style="font-size:22px;font-weight:bold;color:var(--gold);font-variant-numeric:tabular-nums;">--:--</div>
              <div style="font-size:9px;color:var(--text-secondary);letter-spacing:1px;">RESTANTE</div>
            </div>
          </div>
          <div id="gpsStepDots" style="display:flex;gap:5px;margin-top:4px;"></div>
          <div id="gpsStepDesc" style="font-size:11px;color:var(--text-secondary);margin-top:6px;line-height:1.4;max-height:36px;overflow:hidden;"></div>
        </div>

        <div style="flex:1;min-height:0;position:relative;background:var(--bg-primary);">
          <div id="gpsMap" style="width:100%;height:100%;"></div>
          <div id="gpsNoGPS" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-primary);color:var(--text-secondary);font-size:12px;letter-spacing:2px;text-align:center;pointer-events:none;">
            <div>Esperando posición</div>
          </div>
        </div>

        <div style="background:var(--bg-secondary);border-top:1px solid var(--border-color);padding:14px 16px 20px;flex-shrink:0;">
          <div style="text-align:center;margin-bottom:12px;">
            <div id="gpsTimer" style="font-size:52px;font-weight:bold;letter-spacing:4px;color:var(--text-primary);line-height:1;font-variant-numeric:tabular-nums;">00:00</div>
            <div style="font-size:9px;color:var(--text-secondary);letter-spacing:3px;margin-top:2px;">TIEMPO TOTAL</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div style="text-align:center;background:var(--stat-bg);border:1px solid var(--border-color);border-radius:12px;padding:10px 6px;">
              <div id="gpsDistance" style="font-size:28px;font-weight:bold;color:var(--gold);font-variant-numeric:tabular-nums;">0.00</div>
              <div style="font-size:9px;color:var(--text-secondary);letter-spacing:2px;">KM</div>
            </div>
            <div style="text-align:center;background:var(--stat-bg);border:1px solid var(--border-color);border-radius:12px;padding:10px 6px;">
              <div id="gpsPace" style="font-size:28px;font-weight:bold;color:#9BB5A0;font-variant-numeric:tabular-nums;">--:--</div>
              <div style="font-size:9px;color:var(--text-secondary);letter-spacing:2px;">MIN/KM</div>
            </div>
          </div>

          <div id="gpsButtonsContainer">
            <div id="gpsButtonsLocked" style="display:flex; gap:10px; opacity:0.5;">
              <button disabled style="flex:1;height:50px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:12px;font-size:14px;font-weight:bold;letter-spacing:1px;">PAUSA</button>
              <button disabled style="flex:1;height:50px;border:1px solid #9BB5A0;background:#9BB5A0;color:#0a0a0a;border-radius:12px;font-size:14px;font-weight:bold;letter-spacing:1px;">SIGUIENTE</button>
            </div>
            <div id="gpsButtonsUnlocked" style="display:none; gap:10px;">
              <button id="gpsPauseBtn" onclick="GPSTracker.togglePause()" style="flex:1;height:50px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:12px;font-size:14px;font-weight:bold;cursor:pointer;letter-spacing:1px;">PAUSA</button>
              <button id="gpsNextBtn"  onclick="GPSTracker.nextStep()"   style="flex:1;height:50px;border:1px solid #9BB5A0;background:#9BB5A0;color:#0a0a0a;border-radius:12px;font-size:14px;font-weight:bold;cursor:pointer;letter-spacing:1px;">SIGUIENTE</button>
            </div>
          </div>

          <div style="display:flex; justify-content:center; margin-top:12px;">
            <button id="gpsUnlockBtn" style="display:flex; align-items:center; justify-content:center; background:var(--stat-bg); border:1px solid var(--gold); color:var(--gold); border-radius:14px; padding:12px 24px; font-size:14px; font-weight:bold; letter-spacing:2px; cursor:pointer; text-align:center;">🔓 DESBLOQUEAR</button>
          </div>

          <div id="gpsPauseBanner" style="display:none;text-align:center;margin-top:10px;color:var(--gold);font-size:12px;letter-spacing:2px;">EN PAUSA</div>
        </div>
      </div>

      <div id="gpsConfirm" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-primary);z-index:3000;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;">
        <div style="font-size:14px;letter-spacing:2px;color:var(--gold);margin-bottom:20px;">FINALIZAR SESION</div>
        <div id="gpsConfirmStats" style="font-size:22px;font-weight:bold;margin-bottom:30px;color:var(--text-primary);line-height:1.7;"></div>
        <div style="margin: 10px 0 14px 0;">
          <label style="font-size:12px; color:var(--text-secondary); letter-spacing:1px;">Editar distancia (km):</label>
          <input type="number" id="gpsEditDistance" step="0.01" style="width:100%;max-width:180px;margin:8px auto;padding:8px 12px;background:var(--stat-bg);border:1px solid var(--gold);border-radius:10px;color:var(--text-primary);text-align:center;font-family:monospace;display:block;">
        </div>
        <div id="gpsZonaBox" style="background:var(--stat-bg); border:1px solid var(--border-color); border-left:4px solid transparent; border-radius:12px; padding:12px; margin:0 0 20px 0; width:100%; max-width:280px; transition:border-color .2s ease;">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary); letter-spacing:0.5px; margin-bottom:6px;">ZONA DE ESFUERZO REAL</label>
          <select id="gpsZonaSelect" style="width:100%; text-align:center; text-align-last:center;">
            <option value="Z1">Z1 · RECUPERACIÓN</option>
            <option value="Z2">Z2 · BASE</option>
            <option value="Z3">Z3 · TEMPO</option>
            <option value="Z4">Z4 · UMBRAL</option>
            <option value="Z5">Z5 · VO₂MÁX</option>
            <option value="Z6">Z6 · VELOCIDAD</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;">
          <button id="gpsConfirmYes" style="height:54px;background:#c0392b;border:none;color:#fff;border-radius:14px;font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:1px;">GUARDAR Y SALIR</button>
          <button id="gpsConfirmNo"  style="height:48px;background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:14px;font-size:14px;cursor:pointer;letter-spacing:1px;">CONTINUAR</button>
          <button id="gpsConfirmAbort" style="height:48px;background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:14px;font-size:14px;cursor:pointer;letter-spacing:1px;">SALIR SIN GUARDAR</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    requestAnimationFrame(() => { ov.style.opacity = '1'; });

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
      const bg       = done ? '#9BB5A0' : active ? 'var(--gold)' : 'var(--border-color)';
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
    this.isPaused    = false;
    this.pausedTime  = 0;
    this.pauseStart  = null;
    this.map         = null;
    this.polyline    = null;
    this.currentMarker = null;
    this.startMarker = null;
    this._userMovedMap = false;
    this._lastUserInteraction = 0;
    if (this._autoCenterTimer) clearTimeout(this._autoCenterTimer);
    this._isUnlocked = false;
    if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
    this._autoNextPending = false;
    this._endingSession = false;

    this.steps     = this._buildSteps(sesion);
    this.stepIndex = 0;

    const modalSesionEl = document.getElementById('detalleSesion');
    if (modalSesionEl) modalSesionEl.scrollTop = 0;
    modalSesionEl?.classList.remove('visible');
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
          const mensaje = step.mensajeVoz || `${step.titulo}, ${step.duracionMin} minutos, ${step.zona}`;
          this._speak(mensaje, true);
        }
      }
    }).catch(e => console.warn('Precarga falló', e));

    this.watchId = navigator.geolocation.watchPosition(pos => {
      const acc = pos.coords.accuracy;
      if (bar) {
        const pct = Math.min(100, Math.max(0, (1 - acc / 60) * 100));
        bar.style.width = pct + '%';
        bar.style.background = acc < 10 ? '#6bd46b' : acc < 20 ? '#f1c40f' : 'var(--gold)';
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

    const primerPunto = { lat, lng, ts: Date.now(), acc: Math.round(acc) };
    this.trackPoints.push(primerPunto);
    this._lastAccepted = primerPunto;
    this._lastGoodPoint = primerPunto;
    this._updateMap(lat, lng);
    this._updatePolyline();
    this._addStartMarker(lat, lng);

    this._pendingStart = { lat, lng, acc };
    this._firstPointTime = Date.now();
    this._staticWarningShown = false;
    this._finalTrackPoints = null;
    this._autoFilledDistanceKm = null;
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
    this.watchId = null;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    clearInterval(this.stepInterval);
    this.stepInterval = null;
    document.getElementById('gpsTrackerOverlay')?.remove();
    this._limpiarMapaYListeners();
    Utils.showToast('Sesión cancelada sin guardar', 'info');
  },

  // Cancela desde la pantalla de "ADQUIRIENDO GPS" (antes de que
  // isRunning llegue a ponerse a true en _iniciarGrabacion). Se deja
  // igual de completo que _abortarSesion y _confirmarFinalizar -- antes
  // no reseteaba isRunning/watchId/intervalos, así que si algún día se
  // reutiliza este botón en otro punto del flujo (o el usuario logra
  // cancelar justo cuando isRunning ya estuviera a true), la app se
  // quedaba "colgada" pensando que había una sesión en curso ("Ya hay una
  // sesión en curso" al intentar iniciar otra) sin ninguna forma de
  // desbloquearla salvo recargar.
  cancelar() {
    this.isRunning = false;
    this._stopPreventSleep();
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    clearInterval(this.stepInterval);
    this.stepInterval = null;
    document.getElementById('gpsTrackerOverlay')?.remove();
    this._limpiarMapaYListeners();
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
      bars.forEach((bar, idx) => { bar.style.background = idx < level ? 'var(--gold)' : 'var(--border-color)'; });
    }
    const txt = document.getElementById('gpsSignalText');
    if (txt) txt.textContent = `±${Math.round(accuracy)}m`;

    if (this.isPaused) return;

    const puntoFiltrado = this._filterGPS(lat, lng, accuracy, Date.now());
    if (!puntoFiltrado) return;
    // 🔥 Antes pasaba por _smoothAndSimplify (eliminado, ver más arriba) --
    // ahora el punto que ya validó/limpió _filterGPS (mediana de las
    // últimas 8 lecturas, sin saltos imposibles, sin duplicados a <1,5m)
    // se usa tal cual, sin ningún redondeo/fusión adicional que pudiera
    // recortar distancia real.
    const puntoSuave = { lat: puntoFiltrado.lat, lng: puntoFiltrado.lng, ts: puntoFiltrado.ts };
    if (puntoSuave) {
      // Solo añadir al track si la precisión es buena (≤ 15m)
      // y si hay movimiento significativo (ya lo gestiona _filterGPS)
      const lastPoint = this.trackPoints[this.trackPoints.length - 1];
      if (!lastPoint ||
          Math.abs(lastPoint.lat - puntoSuave.lat) > 1e-8 ||
          Math.abs(lastPoint.lng - puntoSuave.lng) > 1e-8) {
        this.trackPoints.push(puntoSuave);
      }
      // Actualizar el último punto bueno
      if (accuracy <= 15) {
        this._lastGoodPoint = puntoSuave;
      } else if (!this._lastGoodPoint) {
        this._lastGoodPoint = puntoSuave;
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
        cdEl.style.color = restante === 0 ? '#e74c3c' : 'var(--gold)';
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
      if (btn) { btn.innerHTML = 'PAUSA'; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'var(--gold)'; }
      if (banner) banner.style.display = 'none';
      if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate(50);
      this._beep(660, 150);
      if (this._isUnlocked) {
        if (this._unlockTimeout) clearTimeout(this._unlockTimeout);
        setTimeout(() => { if (this._isUnlocked) this._startAutoLockTimer(); }, 0);
      }
      // Relanzar la cadena de recentrados automáticos: se había parado al
      // pausar y, sin esto, no volvía a arrancar nunca más en la sesión.
      if (this._autoCenterTimer) { clearTimeout(this._autoCenterTimer); }
      this._userMovedMap = false;
      this._lastUserInteraction = 0;
      if (typeof this._forceCenterFn === 'function') {
        this._autoCenterTimer = setTimeout(this._forceCenterFn, 3000);
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
    const distKmRaw = (this._calcTotalDistance() / 1000).toFixed(2);
    const elapsed = this._fmtTime(this._getElapsed());
    const statsEl = document.getElementById('gpsConfirmStats');
    if (statsEl) statsEl.innerHTML = `${distKmRaw} km · ${elapsed}`;
    const confirmDiv = document.getElementById('gpsConfirm');
    if (!confirmDiv) return;
    const editInput = document.getElementById('gpsEditDistance');
    if (editInput) editInput.value = distKmRaw;
    this._autoFilledDistanceKm = distKmRaw;

    // 🔥 Corrección manual de zona: mientras el usuario no toque el
    // desplegable, se deja pre-seleccionada de verdad la zona que saldría
    // calculada por ritmo/km/tiempo (con su color en el borde) -- ya no
    // hay una opción "AUTO" aparte que haya que interpretar, es la propia
    // zona la que aparece marcada. El ritmo no distingue un llano de un
    // recorrido con desnivel, ni si has ido más de pulso de lo normal --
    // aquí se puede elegir otra zona antes de guardar, y esa es la zona
    // (y el TSS recalculado con ella) que se guarda de verdad.
    //
    // 🔥 Nada de chips ni de popups hechos a mano: se pidió el MISMO
    // control que ya usa "Nueva sesión" (session-invites.js, sgZona) --
    // un <select> nativo normal, el que dibuja el propio sistema
    // operativo (el "cuadradito" con el check en la opción elegida).
    this._zonaOverrideSeleccionada = null;
    const zonaBoxEl = document.getElementById('gpsZonaBox');
    const zonaSelectEl = document.getElementById('gpsZonaSelect');

    // Recalcula y deja pre-seleccionada la zona (por ritmo, o la elegida a
    // mano si el usuario ya tocó el desplegable) a partir del km actual
    // del input de distancia y del tiempo real transcurrido -- el mismo
    // criterio que usará marcarSesionRealizada al guardar si no hay
    // corrección manual.
    const actualizarZonaAuto = () => {
      const km = parseFloat(editInput?.value) || 0;
      const totalMin = this._getElapsed() / 60000;
      let zona = null;
      if (km > 0 && totalMin > 0 && typeof PlanGenerator !== 'undefined') {
        zona = PlanGenerator._detectarZonaParteEfectiva(this.sesion, totalMin, km);
      }
      // Solo se pisa el valor del select mientras el usuario NO haya
      // elegido nada a mano -- si ya corrigió la zona, cambiar el km no
      // debe borrarle su corrección.
      if (!this._zonaOverrideSeleccionada && zonaSelectEl && zona) {
        zonaSelectEl.value = zona[0];
      }
      const zonaActiva = this._zonaOverrideSeleccionada || (zona ? zona[0] : null);
      if (zonaBoxEl) {
        zonaBoxEl.style.borderLeftColor = zonaActiva ? `var(--zone-${zonaActiva.replace('Z', '')})` : 'transparent';
      }
    };
    this._actualizarZonaAutoGPS = actualizarZonaAuto;
    if (editInput) editInput.oninput = actualizarZonaAuto;
    if (zonaSelectEl) {
      zonaSelectEl.onchange = () => {
        this._zonaOverrideSeleccionada = zonaSelectEl.value || null;
        actualizarZonaAuto();
      };
    }
    actualizarZonaAuto();

    Object.assign(confirmDiv.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
      background: 'var(--bg-primary)', zIndex: '3000', padding: '30px',
      textAlign: 'center', pointerEvents: 'all'
    });

    // ===== SIMPLIFICACIÓN EN SEGUNDO PLANO (no bloquea la pantalla) =====
    // Douglas-Peucker con un margen de 2m: quita puntos redundantes que
    // están a menos de 2m de la línea entre sus vecinos (para no guardar
    // miles de puntos casi idénticos), sin desviar el trazado más de eso.
    // El track resultante es el mismo que grabó el GPS, solo con menos
    // puntos -- no se usa ningún servicio externo (como el ajuste a
    // calles que había antes) que pudiera dibujar algo distinto a lo que
    // el usuario corrió de verdad.
    // En ningún caso se sobrescribe el número si el usuario ya lo ha
    // editado a mano mientras esto se calculaba.
    this._procesarTrackFinal(statsEl, editInput);
  },


  // 🔥 Se elimina _matchEsFiable: ya no tiene sentido validar un ajuste a
  // calles que directamente se ha quitado (ver _procesarTrackFinal, más
  // abajo) -- el track ahora es siempre el grabado por el GPS.

  async _procesarTrackFinal(statsEl, editInput) {
    try {
      // 🔥 A petición del usuario: el track del mapa tiene que ser
      // EXACTAMENTE el que grabó el GPS, sin que nada lo reinterprete ni
      // lo "corrija" -- ni quitar ni poner. Se elimina por completo el
      // ajuste a calles (OSRM _mapMatchTrack): aunque ya no tocaba el
      // kilometraje (ver versión anterior), seguía pudiendo dibujar un
      // trazado distinto al real (p.ej. pegándolo a un camino que no se
      // ha pisado, si se corre por campo). Lo único que se aplica es
      // Douglas-Peucker con un margen de 2m (el error máximo pedido) para
      // no guardar miles de puntos casi idénticos -- reduce el TAMAÑO del
      // track, nunca su FORMA más allá de esos 2m. Los saltos imposibles
      // (ej. "20m en 1 segundo") ya se descartan en directo mientras se
      // corre, en _filterGPS (tope de 18 km/h), así que no deberían ni
      // llegar a grabarse.
      const simplificado = this._douglasPeucker(this.trackPoints, 2);
      let distFinalM = 0;
      for (let i = 1; i < simplificado.length; i++) {
        distFinalM += this._haversine(simplificado[i-1].lat, simplificado[i-1].lng, simplificado[i].lat, simplificado[i].lng);
      }
      this._finalTrackPoints = simplificado;

      const distFinalKm = (distFinalM / 1000).toFixed(2);

      // Solo actualizamos el número en pantalla si el usuario no lo ha
      // tocado desde que lo prellenamos (para no pisar una edición manual).
      if (editInput && editInput.value === this._autoFilledDistanceKm) {
        editInput.value = distFinalKm;
        this._autoFilledDistanceKm = distFinalKm;
        if (statsEl) {
          const elapsed = this._fmtTime(this._getElapsed());
          statsEl.innerHTML = `${distFinalKm} km · ${elapsed}`;
        }
        // El input no dispara su propio evento 'input' al cambiarse por
        // código, así que sin esto la zona automática se quedaría con el
        // valor (o el vacío) de antes de que el track terminara de
        // procesarse en segundo plano.
        if (typeof this._actualizarZonaAutoGPS === 'function') this._actualizarZonaAutoGPS();
      }
    } catch (e) {
      console.warn('Error procesando track final, se usará el track GPS sin simplificar:', e);
    }
  },

  _cancelarConfirm() {
    const conf = document.getElementById('gpsConfirm');
    if (conf) conf.style.display = 'none';
    // Bug real: al pulsar "CONTINUAR" solo se ocultaba este cuadro, pero
    // '_endingSession' (puesta a true en _announceSesionTerminada al
    // llegar al final del último bloque) nunca se volvía a poner a false.
    // Como el contador del último bloque ya estaba a 00:00, el disparo
    // automático en _tick() (que exige '!this._endingSession') y también
    // el botón "FINALIZAR" manual (que llama a nextStep(), bloqueado por
    // el mismo 'if (this._endingSession) return;') se quedaban inutilizados
    // para siempre: la sesión no había forma de volver a finalizarla salvo
    // recargando la app entera.
    this._endingSession = false;
    // Se le da al último bloque un tramo de tiempo nuevo desde ya (en vez
    // de dejarlo en 00:00, que habría vuelto a disparar el aviso de fin en
    // el siguiente tick, un segundo después, como si "continuar" no
    // hubiera hecho nada) para que el usuario pueda seguir corriendo un
    // rato de verdad antes de que se le vuelva a preguntar, o finalizar
    // cuando quiera pulsando "FINALIZAR".
    this.stepStartTime = Date.now();
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
    this._limpiarMapaYListeners();

    Utils.showLoading();
    try {
      await this._guardarYPublicar(distKm, elapsedMs, this._zonaOverrideSeleccionada);
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

  // Velocidad máxima real durante la sesión (para las insignias SPEED_20 /
  // SPEED_30 de gamification.js, que hasta ahora nunca recibían este dato
  // y por eso eran imposibles de conseguir). Se calcula tramo a tramo con
  // el mismo _haversine que usa el resto del tracker; se descartan tramos
  // muy cortos en tiempo/distancia (ruido de GPS parado) y saltos poco
  // realistas por encima de 40 km/h (glitch de GPS, no una velocidad real
  // de carrera) para no inflar el máximo con basura.
  _calcMaxSpeedKmh(points) {
    if (!points || points.length < 2) return 0;
    let max = 0;
    for (let i = 1; i < points.length; i++) {
      const dist = this._haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
      const dt = (points[i].ts - points[i - 1].ts) / 1000;
      if (dt < 1 || dist < 3) continue;
      const speedKmh = (dist / dt) * 3.6;
      if (speedKmh > 40) continue;
      if (speedKmh > max) max = speedKmh;
    }
    return max;
  },

  async _guardarYPublicar(distKm, elapsedMs, zonaOverride = null) {
    const uid = AppState?.currentUserId;
    if (!uid || !AppState?.planActualId) throw new Error('Sin usuario o plan activo');
    const planId = AppState.planActualId;
    const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
    const ptsFull = this._finalTrackPoints || this.trackPoints;
    const maxSpeedKmh = this._calcMaxSpeedKmh(ptsFull);
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
    // Récords por tramo (mejor 1km, 5km, 10km... dentro de este mismo
    // recorrido): se calcula AQUÍ, con ptsFull todavía en memoria y con
    // su marca de tiempo (ts) por punto -- los puntos que se guardan en
    // Firestore (arriba, en gps_tracks/globalFeed) van sin ts para no
    // pesar tanto, así que este es el único momento en que se puede hacer
    // este análisis con precisión real. tramosSesion (el mejor tramo de
    // ESTA sesión para cada distancia, la haya batido récord o no) se
    // guarda además en la propia entrada del muro (ver más abajo,
    // recordsPorTramo): así, si más adelante se desmarca OTRA sesión
    // distinta, gamification.js puede recalcular el récord global
    // tomando el mínimo real entre todas las sesiones con GPS que
    // queden, sin depender de estimaciones ni de guardar el track
    // completo con marcas de tiempo en Firestore.
    let tramosSesion = {};
    if (window.Gamification) {
      try {
        const resultadoRecords = await Gamification.actualizarRecordsPorTramos(uid, ptsFull);
        tramosSesion = resultadoRecords.tramosSesion || {};
        const recordsBatidos = resultadoRecords.mejorados || [];
        if (recordsBatidos.length > 0) {
          const nombres = { 1: '1 km', 5: '5 km', 10: '10 km', 21.1: 'media maratón', 42.2: 'maratón' };
          recordsBatidos.forEach((d, idx) => {
            setTimeout(() => {
              Utils.showToast(`🏆 ¡Nuevo récord de ${nombres[d] || d + ' km'}!`, 'success', 4000);
            }, idx * 600);
          });
        }
      } catch(e) { console.warn('No se pudieron actualizar los récords por tramos:', e); }
    }
    try {
      await planRef.update({ [`gpsTrack.${this.diaIndex}`]: { distanceKm: trackData.distanceKm, durationMs: trackData.durationMs, recordedAt: trackData.recordedAt } });
    } catch(e) { console.warn('No se pudo guardar metadata GPS en el plan:', e.message); }
    // El 7º parámetro (saltarComprobacionFatiga=true) evita que se vuelva
    // a preguntar aquí por la recuperación: ya se preguntó ANTES de
    // iniciar el GPS (ver el botón "INICIAR SESIÓN CON GPS" en
    // calendar.js). Preguntarlo aquí, con la pantalla de carga de arriba
    // ya activa, dejaba el aviso tapado sin forma de responderlo y la
    // sesión se quedaba "guardando" para siempre.
    await PlanGenerator.marcarSesionRealizada(this.diaIndex, true, distKm, elapsedMs, maxSpeedKmh, true, true, null, zonaOverride);
    const planDoc = await planRef.get();
    const wallEntryId = planDoc.data()?.wallEntryId?.[this.diaIndex];
    if (wallEntryId) {
      await firebaseServices.db.collection('globalFeed').doc(wallEntryId).update({
        hasGPS: true,
        trackPoints: ptsWall.map(p => ({ lat: p.lat, lng: p.lng })),
        gpsDistanceKm: parseFloat(distKm.toFixed(3)),
        gpsDurationMs: elapsedMs,
        distancia: parseFloat(distKm.toFixed(3)),
        duration: Math.floor(elapsedMs / 60000),
        // Mejor tramo de ESTA sesión por cada distancia estándar que
        // llegó a cubrir (ver Gamification.calcularTramosSesion). Es la
        // pieza clave para que los récords "solo con GPS" se puedan
        // recalcular de forma fiable si más adelante se desmarca/borra
        // otra sesión: sin este campo no habría forma de reconstruir el
        // récord real sin volver a guardar el track completo con marcas
        // de tiempo.
        recordsPorTramo: tramosSesion
      });

      // Se genera y se guarda en caché AQUÍ, una sola vez, la miniatura del
      // recorrido (un SVG con la silueta de la ruta, sin mapa de fondo
      // real ni dependencia de red/Leaflet). El perfil, al mostrar "Mis
      // últimos entrenamientos", simplemente LEE esta cadena de
      // localStorage e la inyecta tal cual: no hay ninguna carga ni
      // inicialización que pueda fallar por timing, visibilidad de la
      // pestaña, o que la librería de mapas tarde en cargar. Se queda tal
      // cual hasta que la propia entrada salga del top-5 (momento en el
      // que profile.js borra esta clave).
      try {
        const svgRuta = this.renderTrackSVG(ptsWall, 400, 130);
        if (svgRuta) localStorage.setItem(`mapaEstatico_${wallEntryId}`, svgRuta);
      } catch (e) {
        console.warn('No se pudo generar la miniatura de la ruta:', e);
      }
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
console.log('✅ GPS Tracker v5.4 - Anuncio de voz por bloques: calentamiento/enfriamiento siempre zona 1, parte principal con la zona real (no adivinada del texto libre) y esfuerzo+descanso diferenciados en series');