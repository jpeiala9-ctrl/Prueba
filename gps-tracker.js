// ==================== gps-tracker.js ====================
// Versión: 5.24 - Permiso de ubicación: antes de empezar se consulta su estado (Permissions API); si está BLOQUEADO se explica
//                cómo activarlo en vez de fallar en silencio. (La app no puede concederse el permiso a sí misma: que se
//                pida solo una vez depende del ajuste de ubicación del móvil/navegador en «Permitir».)
// Versión: 5.23 - Volumen de todos los pitidos un poco más bajo (0,5/0,4 -> 0,32/0,26).
// Versión: 5.22 - TODOS los pitidos al mismo volumen (el de cambio de bloque/fin): cuenta atrás, pausa/reanudar y avisos pasan por
//                _pitidoFuerte(dur, frecuencia) -- mismo timbre de dos tonos y mismo nivel; solo cambia la frecuencia.
// Versión: 5.21 - Término medio en la pantalla previa: texto en un dorado más intenso (mezcla de dorado y texto principal), peso
//                medio y fondo más suave (antes, texto principal en negrita y muy oscuro). Pitidos de cambio de bloque y
//                fin de sesión a aproximadamente la mitad de volumen (siguen siendo agudos y distinguibles).
// Versión: 5.20 - Avisos sin voz ajustados: al EMPEZAR la sesión solo suena la cuenta atrás (el primer bloque ya se entiende,
//                ya no se repiten pitidos); el cambio de bloque pasa de 5 a 2 pitidos agudos; el fin de sesión, de un pitido
//                de 1,2 s a uno de 0,5 s.
// Versión: 5.19 - (1) Pantalla previa legible: el aviso «no bloquees ni salgas de RI5» y el texto del interruptor pasan al
//                color de texto principal, en negrita y sobre fondo con borde dorado (antes dorado claro sobre fondo casi
//                transparente: apenas se leía). (2) Avisos sin voz mucho más audibles con música: cambio de bloque =
//                5 pitidos muy agudos seguidos (2400 + 3100 Hz a la vez, onda cuadrada, volumen máximo) y fin de sesión =
//                1 pitido agudo LARGO (1,2 s), ambos con vibración.
// Versión: 5.18 - VOZ GUÍA O MÚSICA, CON AVISOS QUE SE NOTAN. (1) El interruptor se llama «VOZ GUÍA» y dice claro que con
//                voz guía SÍ la música se pausa en cada bloque (no es compatible) y con NO la música sigue sonando;
//                por defecto es NO (música). (2) Con VOZ GUÍA NO, el cambio de bloque suena como 3 pitidos fuertes
//                (onda cuadrada de 1300 Hz, que corta por encima de la música) + vibración larga, y el fin de sesión
//                como 4. (3) Los pitidos en general pasan a onda cuadrada y volumen más alto (cuenta atrás, pausa).
//                Desde la web no se puede bajar el volumen de Spotify: lo que se hace es sonar más fuerte y distinto.
// Versión: 5.17 - EL MAPA YA NO «SALTA» AL CAMBIAR DE BLOQUE. Al cambiar de bloque cambiaban el título y la descripción
//                (de 0 a 2 líneas), la barra superior variaba de alto hasta ~36 px y, como el mapa ocupa el resto de la
//                pantalla, su contenedor se encogía/estiraba sin avisar a Leaflet: la bandera se movía y el siguiente
//                recentrado salía desplazado. Ahora (1) la barra del bloque tiene alto FIJO (título en una línea con «…»,
//                descripción en 2 líneas fijas) y (2) un ResizeObserver avisa a Leaflet (invalidateSize) y recentra si
//                el contenedor llegara a cambiar de tamaño por cualquier otro motivo.
// Versión: 5.16 - LA VOZ YA NO DEJA LA MÚSICA PAUSADA. Causa probable: el AudioContext (pitidos) quedaba «running» para
//                siempre tras el primer pitido y mantenía activa la sesión de audio del sistema, así que, al interrumpir
//                la voz a Spotify, el sistema no lo reanudaba al terminar. Ahora: (1) tras cada pitido y tras cada aviso
//                de voz el AudioContext se SUSPENDE (_liberarAudio) y la sesión de audio vuelve a 'auto', para que el
//                sistema devuelva el foco y la música se reanude sola; (2) la voz pide la sesión 'transient' (sonido
//                corto que no se queda con el foco); (3) interruptor VOZ SÍ/NO en la pantalla previa (se recuerda):
//                con VOZ NO los cambios de bloque avisan con pitido doble + vibración y la música nunca se interrumpe.
// Versión: 5.15 - MÚSICA + GPS EN SINTONÍA (revisión completa del uso con música de fondo):
//                (1) PAUSA: el tiempo en pausa ya se descuenta también del contador del bloque (antes, 60 s
//                parado en un semáforo acortaban el bloque 60 s y el aviso de voz llegaba antes de tiempo).
//                (2) SALIR DE LA APP (bloquear el móvil, cambiar de app): al volver, RI5 lo detecta (visibilitychange),
//                reinicia el GPS, se pone al día en el bloque que toca (anunciando solo el actual, sin soltar todos
//                los avisos de golpe), limpia el buffer de lecturas antiguas y marca el primer punto nuevo con
//                `corte:true`. gamification.js (5.24) no deja que ningún tramo récord cruce un corte, así que un
//                salto a Spotify ya no puede generar récords imposibles.
//                (3) El cambio automático de bloque sigue el horario exacto (no acumula el retraso de cada tick).
//                (4) Al volver a la app YA NO se reanuda el AudioContext (podía reclamar el foco de audio y pausar la
//                música al regresar de Spotify): solo se reanuda cuando va a sonar un pitido.
//                (5) Aviso en pantalla: no bloquear ni salir de RI5; la música se controla desde el Centro de control,
//                el panel de notificaciones o los auriculares.
// Versión: 5.14 - PANTALLA SIEMPRE ENCENDIDA SIN TOCAR LA MÚSICA. Revisión del anti-bloqueo tras quitar el
//                oscilador de 1 Hz en v5.13 (que dejó la pantalla a merced solo del Wake Lock, que falla en
//                iOS < 18.4 dentro de la app instalada y se pierde al cambiar de app). Ahora: (1) Wake Lock
//                con bandera de "lo quiero": ya no se re-pide solo tras terminar la sesión (antes el listener
//                'release' lo volvía a activar 1 s después de soltarlo y la pantalla no se apagaba nunca) y se
//                renueva al volver a la app (visibilitychange/pageshow); (2) vídeo mudo diminuto en bucle
//                (técnica NoSleep) como respaldo para iOS/navegadores sin Wake Lock: un vídeo SIN audio no
//                reclama el foco de audio, así que Spotify/Apple Music siguen sonando; (3) el sonido de 1 Hz
//                queda desactivado (interruptor _ANTIBLOQUEO_AUDIO_1HZ = false; poner true solo si se
//                prefiere mantener el JS vivo con la pantalla bloqueada a costa de pausar la música).
// Versión: 5.13 - MÚSICA COMPARTIDA (fix real de "Spotify se pausa al iniciar GPS"). Se desactiva
//                la llamada a _startKeepAliveAudio() dentro de _startPreventSleep(): era el oscilador
//                silencioso a 1 Hz el que reclamaba el foco de audio del sistema al arrancar la
//                sesión, pausando Spotify/Apple Music/etc. La API navigator.audioSession (v5.12)
//                no servía para esto porque el contexto ya había reclamado el foco antes de que se
//                pudiera etiquetar como 'ambient'. Ahora la protección contra suspensión depende
//                solo del Wake Lock API (que SÍ respeta la música del sistema). En iOS < 16.4 y en
//                navegadores sin wakeLock, la pantalla podría apagarse a los 30-60s si el usuario
//                no la toca -- compensación aceptada a cambio de no cortar la música. Los avisos
//                de voz (_speak) siguen sonando y pausan la música ~2s durante la frase, pero
//                vuelve sola después (eso es del sistema, no se puede evitar desde JS).
// Versión: 5.12 - Audio 'ambient' antes de cada _speak/_beep y al crear el AudioContext (solo útil
//                en navegadores con navigator.audioSession, iOS 16.4+). No resolvió el problema del
//                todo porque el AudioContext del keep-alive ya había reclamado el foco.
// Versión: 5.11 - La entrada del muro guarda gpsTrackDocId (id de la ruta en users/{uid}/gps_tracks) para poder borrarla al
//                desmarcar o eliminar la sesión.
// Versión: 5.10 - SESIÓN EXTRA DE HOY: iniciar(sesion, diaIndex, esExtra). Con esExtra=true la sesión se guarda como un
//                entreno más de hoy (sin sesionIndex ni metadatos en el plan) y el track/mapa se asocian a la entrada del muro
//                que devuelve PlanGenerator (calendar.js v2.77).
// Versión: 5.6 - AUDITORÍA DE INSIGNIAS (ver gamification.js v5.21):
//                (1) _guardarYPublicar pasa ahora a marcarSesionRealizada la
//                información REAL de la sesión GPS (hora de inicio y de fin
//                reales, velocidad sostenida y mejores tramos por distancia):
//                es lo único que permite dar insignias de hora del día
//                ("Carrera nocturna" = de 00:00 a 06:00...) y de ritmo con
//                datos medidos de verdad, no con la hora a la que se pulsa
//                "marcar". (2) _calcMaxSpeedKmh pasa de "el salto más rápido
//                entre dos puntos GPS consecutivos" (un solo punto con ruido
//                bastaba para dar 20 km/h) a VELOCIDAD SOSTENIDA: la mejor
//                media sobre ventanas de >= 10 s seguidos.
// Versión: 5.5 - FIX RÉCORDS IMPOSIBLES: los récords por tramo (y la
//                velocidad máxima) se calculaban sobre el track YA
//                SIMPLIFICADO por Douglas-Peucker (this._finalTrackPoints),
//                cuyos huecos de tiempo entre puntos consecutivos ya no
//                corresponden a paradas reales (pueden ser solo un tramo
//                recto corrido sin parar) -- y gamification.js capaba esos
//                huecos a 8s creyendo que eran una parada, dando récords
//                absurdamente rápidos (p.ej. un 1km "en 2:40"). Ahora se
//                usa this.trackPoints (el track SIN simplificar) para este
//                cálculo, tal y como ya indicaba la intención original de
//                la v5.1 ("el track completo con timestamps ANTES de
//                decimarlo"); _finalTrackPoints sigue usándose solo para
//                lo que no depende del tiempo entre puntos: guardar y
//                dibujar el trazado.
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
  esExtra:       false,   // true = sesión extra de hoy (no pertenece a ningún día del plan)
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
  _wakeLockQuiere: false,
  _noSleepVideo: null,
  _noSleepVisHandler: null,
  _gapVisHandler: null,
  _vozActiva: (function(){ try { return localStorage.getItem('ri5_gps_voz') === '1'; } catch(_) { return false; } })(),
  _ocultoDesde: null,
  _hayCorte: false,
  // false = NO se usa el sonido silencioso a 1 Hz (reclama el foco de audio y pausa Spotify).
  // true  = se vuelve a usar (mantiene el JS vivo con la pantalla bloqueada, pero pausa la música).
  _ANTIBLOQUEO_AUDIO_1HZ: false,
  // Vídeo mudo de 2 s (64x64, sin pista de audio) para la técnica NoSleep.
  _NOSLEEP_MP4: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAANMbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAnZ0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAEAAAABAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAHubWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAUABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABmW1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAVlzdGJsAAAAuXN0c2QAAAAAAAAAAQAAAKlhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAEAAQABIAAAASAAAAAAAAAABFUxhdmM2MC4zMS4xMDIgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAAL2F2Y0MBQsAe/+EAF2dCwB7ZBCbARAAAAwAEAAADACg8WLkgAQAFaMuDyyAAAAAQcGFzcAAAAAEAAAABAAAAFGJ0cnQAAAAAAAALqAAAC6gAAAAYc3R0cwAAAAAAAAABAAAACgAACAAAAAAUc3RzcwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAACgAAAAEAAAA8c3RzegAAAAAAAAAAAAAACgAAAo8AAAAKAAAACwAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAUc3RjbwAAAAAAAAABAAADfAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNjAuMTYuMTAwAAAACGZyZWUAAALybWRhdAAAAnAGBf//bNxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNjQgcjMxMDggMzFlMTlmOSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMjMgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz0xIGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAXZYiEBHyYoAA2IycnJ1111111111114AAAAAGQZo4CPhGAAAAB0GaVAI+EYAAAAAGQZpgEfCMAAAABkGagBHwjAAAAAZBmqAR8IwAAAAGQZrAEfCMAAAABkGa4BHwjAAAAAZBmwAQ8IwAAAAGQZsgP8Iw',

  // ===== Último punto bueno =====
  _lastGoodPoint: null,

  // ===== Track final procesado (Douglas-Peucker + ajuste a calles) =====
  _finalTrackPoints: null,
  _autoFilledDistanceKm: null,

  // 🔥 v5.12: pide al navegador que el audio de esta pestaña se MEZCLE
  // con lo que ya esté sonando (Spotify, Apple Music, un podcast...), en
  // vez de interrumpirlo. La API navigator.audioSession solo existe en
  // iOS 16.4+ (Safari/Chrome) y algunos Android modernos; en el resto,
  // esta función no hace nada. Sigue aplicándose a los beeps y a los
  // avisos de voz, que sí pueden aprovecharla -- el problema del arranque
  // de la sesión se resuelve por otra vía (ver v5.13 en _startPreventSleep).
  _pedirAudioCompartido() {
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = 'ambient';
      }
    } catch (e) {
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'transient';
      } catch (_) {}
    }
  },

  // v5.16: suelta el foco de audio. Suspende el AudioContext (un contexto «running» mantiene activa la sesión de
  // audio aunque no suene nada y la música no se reanuda) y devuelve la sesión a 'auto'.
  _liberarAudio() {
    try {
      if (window.speechSynthesis && window.speechSynthesis.speaking) return; // aún hablando: ya se liberará al acabar
      const ctx = this._audioCtx;
      if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      if (navigator.audioSession) navigator.audioSession.type = 'auto';
    } catch (_) {}
  },

  _liberarAudioTras(ms) {
    if (this._liberarTimer) clearTimeout(this._liberarTimer);
    this._liberarTimer = setTimeout(() => { this._liberarTimer = null; this._liberarAudio(); }, ms);
  },

  // ===== ANTI-BLOQUEO =====
  _startKeepAliveAudio() {
    if (!this._audioCtx) return;
    if (this._keepAliveOsc) return;
    try {
      this._pedirAudioCompartido();
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
    if (!this._wakeLockQuiere) return false;
    if (!navigator.wakeLock) return false;
    try {
      if (this._wakeLock && !this._wakeLock.released) return true;
      const lock = await navigator.wakeLock.request('screen');
      // La sesión pudo terminar mientras se concedía el bloqueo: se suelta al instante.
      if (!this._wakeLockQuiere) { try { lock.release(); } catch (_) {} return false; }
      this._wakeLock = lock;
      lock.addEventListener('release', () => {
        if (this._wakeLock === lock) this._wakeLock = null;
        // Solo se renueva si la sesión sigue activa y la app está a la vista; si no,
        // lo hace _alVolverALaApp cuando el usuario regrese.
        if (this._wakeLockQuiere && document.visibilityState === 'visible') {
          setTimeout(() => this._requestWakeLock(), 500);
        }
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock falló', err);
      return false;
    }
  },

  _releaseWakeLock() {
    this._wakeLockQuiere = false;
    const lock = this._wakeLock;
    this._wakeLock = null;
    if (lock && !lock.released) {
      try { lock.release(); } catch (_) {}
    }
  },

  // ===== Respaldo NoSleep: vídeo mudo en bucle =====
  // Un vídeo sin pista de audio no reclama el foco de audio, así que la música del móvil
  // no se pausa. Mantiene la pantalla encendida en iOS (donde el Wake Lock no siempre
  // funciona en la app instalada) y en navegadores sin Wake Lock.
  _startNoSleepVideo() {
    try {
      if (!this._noSleepVideo) {
        const v = document.createElement('video');
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        v.setAttribute('muted', '');
        v.setAttribute('aria-hidden', 'true');
        v.muted = true;
        v.defaultMuted = true;
        v.loop = true;
        v.controls = false;
        v.tabIndex = -1;
        v.style.cssText = 'position:fixed;right:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1;';
        v.src = this._NOSLEEP_MP4;
        document.body.appendChild(v);
        this._noSleepVideo = v;
      }
      const p = this._noSleepVideo.play();
      if (p && typeof p.catch === 'function') p.catch(e => console.warn('Vídeo anti-bloqueo no arrancó', e));
    } catch (e) {
      console.warn('No se pudo iniciar el vídeo anti-bloqueo', e);
    }
  },

  _stopNoSleepVideo() {
    const v = this._noSleepVideo;
    this._noSleepVideo = null;
    if (!v) return;
    try { v.pause(); } catch (_) {}
    try { v.removeAttribute('src'); v.load(); } catch (_) {}
    try { v.remove(); } catch (_) {}
  },

  // Al volver a la app (desbloquear, cambiar de app y regresar) el sistema suelta el Wake Lock
  // y pausa el vídeo: se renuevan los dos.
  _alVolverALaApp() {
    if (!this._wakeLockQuiere) return;
    if (document.visibilityState && document.visibilityState !== 'visible') return;
    this._requestWakeLock();
    if (this._noSleepVideo && this._noSleepVideo.paused) {
      const p = this._noSleepVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    // v5.15: NO se reanuda el AudioContext aquí. Reanudarlo al volver de Spotify podía reclamar el foco de
    // audio y pausar la música; _beep() ya lo reanuda justo antes de que suene un pitido.
  },

  // ===== v5.15: control de salidas de la app durante la sesión =====
  _arrancarWatchGPS() {
    if (this.watchId !== null) { try { navigator.geolocation.clearWatch(this.watchId); } catch (_) {} }
    this.watchId = navigator.geolocation.watchPosition(
      pos => this._onPosition(pos),
      err => this._onGPSError(err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  },

  _onVisibilidadSesion() {
    if (!this.isRunning) { this._ocultoDesde = null; return; }
    if (document.visibilityState === 'hidden') {
      if (!this._ocultoDesde) this._ocultoDesde = Date.now();
      return;
    }
    const desde = this._ocultoDesde;
    this._ocultoDesde = null;
    if (!desde || (Date.now() - desde) < 8000) return;
    // Salió de la app más de 8 s: el GPS y los temporizadores estuvieron suspendidos.
    this._hayCorte = true;
    this._rawBuffer = [];
    this._lastAccepted = null;
    this._arrancarWatchGPS();
    this._resincronizarBloques();
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast('Saliste de RI5 unos segundos: ese tramo no se grabó. Mantén la app abierta para no perder el recorrido.', 'info', 6000);
    }
  },

  // Tras una suspensión, avanza al bloque que toca según el reloj y anuncia solo ese.
  _resincronizarBloques() {
    if (!this.isRunning || this.isPaused || !this.steps || !this.steps.length) return;
    let avanzado = false;
    while (this.stepIndex < this.steps.length - 1) {
      const durMs = (this.steps[this.stepIndex].duracionMin || 0) * 60000;
      if (this._getStepElapsed() < durMs) break;
      this.stepStartTime += durMs;
      this.stepIndex++;
      avanzado = true;
    }
    if (avanzado) {
      this._renderStepInfo();
      this._announceStep(this.steps[this.stepIndex]);
      if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate(60);
    }
  },

  _startPreventSleep() {
    this._wakeLockQuiere = true;
    this._requestWakeLock();
    // Respaldo: vídeo mudo (se llama dentro del clic de COMENZAR, que es el gesto que
    // iOS exige para reproducir). No toca el audio, así que Spotify sigue sonando.
    this._startNoSleepVideo();
    // v5.13: el oscilador silencioso a 1 Hz sigue desactivado por defecto porque reclamaba
    // el foco de audio y pausaba Spotify/Apple Music. Se puede reactivar con el interruptor.
    if (this._ANTIBLOQUEO_AUDIO_1HZ) this._startKeepAliveAudio();

    if (!this._noSleepVisHandler) {
      this._noSleepVisHandler = () => this._alVolverALaApp();
      document.addEventListener('visibilitychange', this._noSleepVisHandler);
      window.addEventListener('pageshow', this._noSleepVisHandler);
      window.addEventListener('focus', this._noSleepVisHandler);
    }

    if (!this._gapVisHandler) {
      this._gapVisHandler = () => this._onVisibilidadSesion();
      document.addEventListener('visibilitychange', this._gapVisHandler);
    }

    if (this._keepAliveInterval) clearInterval(this._keepAliveInterval);
    this._keepAliveInterval = setInterval(() => {
      // También durante la pausa: la pantalla debe seguir encendida hasta terminar o cancelar.
      this._alVolverALaApp();
    }, 15000);
  },

  _stopPreventSleep() {
    this._releaseWakeLock();
    this._stopNoSleepVideo();
    this._stopKeepAliveAudio();
    if (this._noSleepVisHandler) {
      document.removeEventListener('visibilitychange', this._noSleepVisHandler);
      window.removeEventListener('pageshow', this._noSleepVisHandler);
      window.removeEventListener('focus', this._noSleepVisHandler);
      this._noSleepVisHandler = null;
    }
    if (this._gapVisHandler) {
      document.removeEventListener('visibilitychange', this._gapVisHandler);
      this._gapVisHandler = null;
    }
    this._ocultoDesde = null;
    this._hayCorte = false;
    if (this._keepAliveInterval) {
      clearInterval(this._keepAliveInterval);
      this._keepAliveInterval = null;
    }
  },

  async _initAudioContext() {
    this._pedirAudioCompartido();
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

  async _beep(frequency, duration, volume = 0.5, tipo = 'square') {
    try {
      this._pedirAudioCompartido();
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
      oscillator.type = tipo;
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.setValueAtTime(volume, now + Math.max(0.02, duration / 1000 - 0.03));
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
      oscillator.start();
      oscillator.stop(now + duration / 1000);
      this._liberarAudioTras(duration + 400);
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
    if (!preload && !this._vozActiva) return;
    try { if (!preload && navigator.audioSession) navigator.audioSession.type = 'transient'; else this._pedirAudioCompartido(); } catch (_) {}
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
    // v5.16: al terminar (o fallar) se suelta el foco para que la música se reanude sola.
    utterance.onend = utterance.onerror = () => this._liberarAudioTras(500);
    window.speechSynthesis.speak(utterance);
  },

  // v5.19: pitido que corta por encima de la música: dos tonos agudos a la vez (2400 y 3100 Hz), onda cuadrada, volumen máximo.
  _pitidoFuerte(dur, f = 2400) {
    this._beep(f, dur, 0.32, 'square');
    this._beep(Math.round(f * 1.29), dur, 0.26, 'square');
  },

  // Cambio de bloque sin voz: pi-pi (2 pitidos agudos) + vibración.
  _senalBloque(n = 2) {
    for (let i = 0; i < n; i++) setTimeout(() => this._pitidoFuerte(150), i * 260);
    if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate(Array.from({ length: n * 2 - 1 }, (_, i) => i % 2 === 0 ? 150 : 110));
  },

  // Fin de sesión sin voz: un único pitido agudo de medio segundo.
  _senalFin() {
    this._pitidoFuerte(500);
    if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate([500]);
  },

  _announceStep(step, sinPitidoAlEmpezar = false) {
    if (!step) return;
    if (!this._vozActiva) { if (!sinPitidoAlEmpezar) this._senalBloque(2); return; }
    const mensaje = step.mensajeVoz || `${step.titulo}, ${step.duracionMin} minutos, ${step.zona}`;
    this._speak(mensaje);
  },

  _announceSesionTerminada() {
    if (this._endingSession) return;
    this._endingSession = true;
    if (!this._vozActiva) { this._senalFin(); return; }
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

    // 🔥 v5.6: CLASIFICACIÓN DE PASOS por tipo (no solo por un título exacto). El entrenador puede
    // poner cualquier título (p.ej. «ESTIRAMIENTOS» en vez de «ENFRIAMIENTO») y antes un título
    // desconocido se trataba como «parte principal»: repartía su duración, usaba la zona de esfuerzo
    // y recibía el aviso de series. Ahora cada paso es de UNO de estos tipos:
    //   calentamiento · enfriamiento · carrera (extra) · principal · otro
    // y solo «principal» puede recibir el aviso de series.
    const RE_CALENT = /CALENTAMIENTO|CALENTAR|PREPARACI[ÓO]N|ACTIVACI[ÓO]N|WARM/;
    const RE_ENFRIA = /ENFRIAMIENTO|ENFRIAR|VUELTA A LA CALMA|COOL/;
    const RE_ESTIRA = /ESTIRAMIENT|ESTIRAR|STRETCH|MOVILIDAD/;
    const RE_PRINCIPAL = /PARTE PRINCIPAL|SERIES|CUESTAS|SIMULACI|TEMPO|UMBRAL|FARTLEK|RODAJE|CARRERA/;
    const tipoDePaso = (p) => {
      if (p.tipoExtra === 'carrera') return 'carrera';
      const t = (p.titulo || '').toUpperCase();
      if (RE_CALENT.test(t)) return 'calentamiento';
      if (RE_ENFRIA.test(t)) return 'enfriamiento';
      if (RE_ESTIRA.test(t)) return 'otro';
      if (RE_PRINCIPAL.test(t)) return 'principal';
      return 'desconocido';
    };
    let tipos = pasos.map(tipoDePaso);
    // Si ningún paso se reconoce como principal, el principal es el primero «desconocido»
    // (compatibilidad con sesiones antiguas); los demás desconocidos pasan a «otro».
    if (!tipos.includes('principal')) {
      const k = tipos.indexOf('desconocido');
      if (k >= 0) tipos[k] = 'principal';
    }
    tipos = tipos.map(t => t === 'desconocido' ? 'otro' : t);

    // La parte principal "clásica" se queda con lo que sobra de d.partePrincipal tras restar los
    // pasos extra de carrera, que ya llevan su propio tiempo (puesto por el admin, no repartido).
    const sumaExtrasCarreraMin = pasos
      .filter(p => p.tipoExtra === 'carrera')
      .reduce((s, p) => s + (p.duracionMin || 0), 0);
    const partePrincipalBaseMin = Math.max(0, (d.partePrincipal || 25) - sumaExtrasCarreraMin);
    const nMain = Math.max(1, tipos.filter(t => t === 'principal').length);

    return pasos.map((p, idx) => {
      const tit = (p.titulo || '').toUpperCase();
      const tipo = tipos[idx];

      // Paso extra de carrera: duración y zona propias, sin repartir nada
      if (tipo === 'carrera') {
        const zonaCarrera = p.zona ? `zona ${String(p.zona).replace(/[^0-9]/g, '')}` : this._extractZoneFromAction(p.accion);
        return {
          icono: '',
          titulo: tit,
          duracionMin: p.duracionMin || 0,
          accion: p.accion || '',
          zona: zonaCarrera
        };
      }

      // Calentamiento y enfriamiento SIEMPRE zona 1 (bloques fijos de trote suave)
      if (tipo === 'calentamiento') {
        return { icono: '', titulo: tit, duracionMin: d.calentamiento || 10, accion: p.accion || '', zona: 'zona 1' };
      }
      if (tipo === 'enfriamiento') {
        return { icono: '', titulo: tit, duracionMin: d.enfriamiento || 5, accion: p.accion || '', zona: 'zona 1' };
      }

      // Cualquier otro bloque (estiramientos, movilidad, un título libre del entrenador...):
      // usa SU PROPIA duración (si no la trae, la del enfriamiento) y se anuncia con su título,
      // sin tocar el reparto de la parte principal ni recibir el aviso de series. Estiramientos y
      // movilidad son siempre zona 1; si no, la zona de su descripción (o zona 1).
      if (tipo === 'otro') {
        const esSuave = RE_ESTIRA.test(tit);
        return {
          icono: '',
          titulo: tit,
          duracionMin: p.duracionMin || d.enfriamiento || 5,
          accion: p.accion || '',
          zona: esSuave ? 'zona 1' : this._extractZoneFromAction(p.accion)
        };
      }

      // PRINCIPAL: la zona real de esfuerzo es la del selector dedicado (d.zona -- para series es
      // seriesConfig.zonaEsfuerzo), NO la que se «adivine» del texto libre de «accion», que puede
      // mencionar también la zona de descanso.
      const durMin = Math.round(partePrincipalBaseMin / nMain);
      const zonaEsfuerzo = d.zona
        ? `zona ${String(d.zona).replace(/[^0-9]/g, '')}`
        : this._extractZoneFromAction(p.accion);

      // Solo el bloque de esfuerzo de una sesión de series diferencia esfuerzo y descanso
      // (el descanso entre repeticiones en esta app siempre es zona 2).
      let mensajeVoz = null;
      if (sesion.tipo === 'series' && d.seriesConfig) {
        // v5.9: el aviso incluye el detalle real de las series configuradas en el generador: nº de
        // series (y bloques), distancia o tiempo de cada una, su zona y el descanso (zona 2).
        const sc = d.seriesConfig;
        const txtTiempo = (seg) => {
          seg = parseInt(seg, 10) || 0;
          const m = Math.floor(seg / 60), r = seg % 60;
          if (m && r) return `${m} ${m === 1 ? 'minuto' : 'minutos'} ${r} segundos`;
          if (m) return `${m} ${m === 1 ? 'minuto' : 'minutos'}`;
          return `${seg} segundos`;
        };
        const reps = parseInt(sc.numSeries, 10) || 0;
        const bloques = parseInt(sc.numBloques, 10) || 1;
        const porRep = sc.modoRep === 'tiempo'
          ? txtTiempo(sc.tiempoRepSeg)
          : `${parseInt(sc.distRepM, 10) || 0} metros`;
        let msg = reps > 0
          ? `${tit}: ${bloques > 1 ? `${bloques} bloques de ${reps} series` : `${reps} series`} de ${porRep} en ${zonaEsfuerzo}`
          : `${tit}: series en ${zonaEsfuerzo}`;
        msg += (sc.descansoRepSeg > 0)
          ? ` con descanso de ${txtTiempo(sc.descansoRepSeg)} en zona 2`
          : ' con descanso en zona 2';
        if (bloques > 1 && sc.descansoBloqueMin > 0) msg += ` y ${sc.descansoBloqueMin} ${sc.descansoBloqueMin === 1 ? 'minuto' : 'minutos'} entre bloques`;
        mensajeVoz = msg;
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
      // 🔥 FIX: CartoDB ('basemaps.cartocdn.com') empezó a exigir una
      // clave de API para sus mosaicos -- sin ella, el mapa se veía pero
      // tapado por una marca de agua enorme "API KEY REQUIRED". Se pasa a
      // los mosaicos estándar de OpenStreetMap, gratis y sin necesidad de
      // cuenta ni clave.
      // 🔥 v3: vuelta a OpenStreetMap (a petición del usuario, prefiere su
      // estilo al de Esri Light Gray pese a ser más recargado). La cajita
      // de atribución "Leaflet | OSM" no se ve porque el mapa ya tiene
      // attributionControl:false puesto (más arriba, en L.map()) -- eso
      // ya estaba así de antes, no es nuevo de este cambio.
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

      // v5.17: si el contenedor del mapa cambia de tamaño por cualquier motivo, Leaflet se entera y se recentra.
      try {
        const cont = document.getElementById('gpsMap');
        if (cont && window.ResizeObserver) {
          let pend = false;
          this._mapResizeObs = new ResizeObserver(() => {
            if (pend || !this.map) return;
            pend = true;
            requestAnimationFrame(() => {
              pend = false;
              if (!this.map) return;
              try {
                this.map.invalidateSize({ animate: false });
                const pos = this.currentMarker ? this.currentMarker.getLatLng() : this._lastGoodPoint;
                if (pos && !this._userMovedMap) this._centerOnFlag(pos.lat, pos.lng);
              } catch (_) {}
            });
          });
          this._mapResizeObs.observe(cont);
        }
      } catch (_) {}

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
    if (this._mapResizeObs) { try { this._mapResizeObs.disconnect(); } catch (_) {} this._mapResizeObs = null; }
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
        <div style="margin-top: 24px; font-size: 14px; font-weight: 700; color: var(--gold); color: color-mix(in srgb, var(--gold) 55%, var(--text-primary)); background: rgba(192,160,96,0.16); border: 1px solid rgba(192,160,96,0.6); padding: 10px 16px; border-radius: var(--radius-lg); letter-spacing: 1px;">
          ⚠️ NO BLOQUEES EL MÓVIL NI SALGAS DE RI5<br><span style="font-weight:500;font-size:12px;letter-spacing:0;color:var(--gold);color:color-mix(in srgb, var(--gold) 40%, var(--text-primary));">Pon tu música antes de empezar y cambia de canción desde el Centro de control o los auriculares</span>
        </div>
        <button id="gpsVozToggle" style="margin-top:14px;padding:8px 18px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:var(--radius-lg);font-size:13px;font-weight:bold;letter-spacing:1px;cursor:pointer;font-family:inherit;"></button>
        <div id="gpsVozInfo" style="margin-top:8px;font-size:13px;font-weight:500;color:var(--gold);color:color-mix(in srgb, var(--gold) 40%, var(--text-primary));max-width:280px;line-height:1.4;"></div>
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
            <div><span id="gpsStepTitle" style="display:inline-block;max-width:58vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom;font-size:13px;font-weight:bold;letter-spacing:1px;color:var(--text-primary);"></span></div>
            <div style="text-align:right;">
              <div id="gpsStepCountdown" style="font-size:22px;font-weight:bold;color:var(--gold);font-variant-numeric:tabular-nums;">--:--</div>
              <div style="font-size:9px;color:var(--text-secondary);letter-spacing:1px;">RESTANTE</div>
            </div>
          </div>
          <div id="gpsStepDots" style="display:flex;gap:5px;margin-top:4px;"></div>
          <div id="gpsStepDesc" style="font-size:11px;color:var(--text-secondary);margin-top:6px;line-height:1.4;height:31px;overflow:hidden;"></div>
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
            <div style="text-align:center;background:var(--stat-bg);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:10px 6px;">
              <div id="gpsDistance" style="font-size:28px;font-weight:bold;color:var(--gold);font-variant-numeric:tabular-nums;">0.00</div>
              <div style="font-size:9px;color:var(--text-secondary);letter-spacing:2px;">KM</div>
            </div>
            <div style="text-align:center;background:var(--stat-bg);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:10px 6px;">
              <div id="gpsPace" style="font-size:28px;font-weight:bold;color:#9BB5A0;font-variant-numeric:tabular-nums;">--:--</div>
              <div style="font-size:9px;color:var(--text-secondary);letter-spacing:2px;">MIN/KM</div>
            </div>
          </div>

          <div id="gpsButtonsContainer">
            <div id="gpsButtonsLocked" style="display:flex; gap:10px; opacity:0.5;">
              <button disabled style="flex:1;height:50px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:var(--radius-md);font-size:14px;font-weight:bold;letter-spacing:1px;">PAUSA</button>
              <button disabled style="flex:1;height:50px;border:1px solid #9BB5A0;background:#9BB5A0;color:#0a0a0a;border-radius:var(--radius-md);font-size:14px;font-weight:bold;letter-spacing:1px;">SIGUIENTE</button>
            </div>
            <div id="gpsButtonsUnlocked" style="display:none; gap:10px;">
              <button id="gpsPauseBtn" onclick="GPSTracker.togglePause()" style="flex:1;height:50px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:var(--radius-md);font-size:14px;font-weight:bold;cursor:pointer;letter-spacing:1px;">PAUSA</button>
              <button id="gpsNextBtn"  onclick="GPSTracker.nextStep()"   style="flex:1;height:50px;border:1px solid #9BB5A0;background:#9BB5A0;color:#0a0a0a;border-radius:var(--radius-md);font-size:14px;font-weight:bold;cursor:pointer;letter-spacing:1px;">SIGUIENTE</button>
            </div>
          </div>

          <div style="display:flex; justify-content:center; margin-top:12px;">
            <button id="gpsUnlockBtn" style="display:flex; align-items:center; justify-content:center; background:var(--stat-bg); border:1px solid var(--gold); color:var(--gold); border-radius:var(--radius-md); padding:12px 24px; font-size:14px; font-weight:bold; letter-spacing:2px; cursor:pointer; text-align:center;">🔓 DESBLOQUEAR</button>
          </div>

          <div id="gpsPauseBanner" style="display:none;text-align:center;margin-top:10px;color:var(--gold);font-size:12px;letter-spacing:2px;">EN PAUSA</div>
        </div>
      </div>

      <div id="gpsConfirm" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-primary);z-index:3000;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;">
        <div style="font-size:14px;letter-spacing:2px;color:var(--gold);margin-bottom:20px;">FINALIZAR SESION</div>
        <div id="gpsConfirmStats" style="font-size:22px;font-weight:bold;margin-bottom:30px;color:var(--text-primary);line-height:1.7;"></div>
        <div style="margin: 10px 0 14px 0;">
          <label style="font-size:var(--label-size); color:var(--text-secondary); letter-spacing:var(--label-spacing); font-weight:var(--label-weight); text-transform:uppercase;">Editar distancia (km):</label>
          <input type="number" id="gpsEditDistance" step="0.01" style="width:100%;max-width:180px;margin:8px auto;padding:8px 12px;background:var(--stat-bg);border:1px solid var(--gold);border-radius:var(--radius-md);color:var(--text-primary);text-align:center;font-family:monospace;display:block;">
        </div>
        <div id="gpsZonaBox" style="background:var(--stat-bg); border:1px solid var(--border-color); border-left:4px solid transparent; border-radius:var(--radius-md); padding:12px; margin:0 0 20px 0; width:100%; max-width:280px; transition:border-color .2s ease;">
          <label style="display:block; text-align:center; font-size:var(--label-size); color:var(--text-secondary); letter-spacing:var(--label-spacing); margin-bottom:6px; font-weight:var(--label-weight); text-transform:uppercase;">ZONA DE ESFUERZO REAL</label>
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
          <button id="gpsConfirmYes" style="height:54px;background:#c0392b;border:none;color:#fff;border-radius:var(--radius-md);font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:1px;">GUARDAR Y SALIR</button>
          <button id="gpsConfirmNo"  style="height:48px;background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:var(--radius-md);font-size:14px;cursor:pointer;letter-spacing:1px;">CONTINUAR</button>
          <button id="gpsConfirmAbort" style="height:48px;background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:var(--radius-md);font-size:14px;cursor:pointer;letter-spacing:1px;">SALIR SIN GUARDAR</button>
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

  async iniciar(sesion, diaIndex, esExtra = false) {
    if (this.isRunning) { Utils.showToast('Ya hay una sesión en curso', 'warning'); return; }
    if (!navigator.geolocation) { Utils.showToast('GPS no disponible', 'error'); return; }
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const st = await navigator.permissions.query({ name: 'geolocation' });
        if (st.state === 'denied') {
          Utils.showToast('La ubicación está bloqueada. Actívala en los ajustes del móvil (Ubicación de RI5 o de tu navegador) y vuelve a intentarlo.', 'error', 8000);
          return;
        }
      }
    } catch (_) {}

    this.sesion      = sesion;
    this.diaIndex    = diaIndex;
    this.esExtra     = !!esExtra;
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

    const vozBtn = document.getElementById('gpsVozToggle');
    const vozInfo = document.getElementById('gpsVozInfo');
    const pintarVoz = () => {
      if (vozBtn) vozBtn.textContent = this._vozActiva ? '🔊 VOZ GUÍA: SÍ' : '🔇 VOZ GUÍA: NO';
      if (vozInfo) vozInfo.innerHTML = this._vozActiva
        ? 'Con voz guía <b>no puedes escuchar música</b>: se pausa en cada cambio de bloque.'
        : 'Tu <b>música sigue sonando</b>. Cada cambio de bloque suena con 2 pitidos muy agudos y vibración; el final, con un pitido de medio segundo.';
    };
    pintarVoz();
    if (vozBtn) vozBtn.onclick = () => {
      this._vozActiva = !this._vozActiva;
      try { localStorage.setItem('ri5_gps_voz', this._vozActiva ? '1' : '0'); } catch (_) {}
      pintarVoz();
    };

    this._initAudioContext().then(() => {
      if (this._vozActiva && this.steps && this.steps.length) {
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
            // Primero el anti-bloqueo: el vídeo de respaldo debe arrancar dentro del gesto del toque.
            this._startPreventSleep();
            await this._initAudioContext();
            await this._resumeAudioContext();
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
        this._pitidoFuerte(200);
        count--;
      } else {
        clearInterval(beepInterval);
        this._pitidoFuerte(450, 2800);
        setTimeout(() => this._iniciarGrabacion(), 500);
      }
    }, 1000);
  },

  _iniciarGrabacion() {
    const { lat, lng, acc } = this._pendingStart;
    this.isRunning = true;
    this.startTime = Date.now();
    this.stepStartTime = Date.now();

    this._arrancarWatchGPS();

    this.timerInterval = setInterval(() => this._tick(), 1000);
    const primerBloque = this.steps[0];
    if (primerBloque) this._announceStep(primerBloque, true); // sin voz: tras la cuenta atrás no se repiten pitidos
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
        if (this._hayCorte) { puntoSuave.corte = true; this._hayCorte = false; }
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
      const enPausaMs = Date.now() - this.pauseStart;
      this.pausedTime += enPausaMs;
      this.stepStartTime += enPausaMs; // v5.15: el tiempo en pausa tampoco cuenta para el bloque
      this.pauseStart = null;
      this.isPaused = false;
      if (btn) { btn.innerHTML = 'PAUSA'; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'var(--gold)'; }
      if (banner) banner.style.display = 'none';
      if (typeof Utils !== 'undefined' && Utils.vibrate) Utils.vibrate(50);
      this._pitidoFuerte(150, 2000);
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
      this._pitidoFuerte(200, 1600);
    }
  },

  nextStep(isAuto = false) {
    if (!this.isRunning) return;
    const esUltimo = this.stepIndex >= this.steps.length - 1;
    if (esUltimo) {
      if (this._endingSession) return;
      this._announceSesionTerminada();
      this._mostrarConfirm();
      if (this._vozActiva) this._pitidoFuerte(300, 2200);
    } else {
      const durPrevMs = (this.steps[this.stepIndex].duracionMin || 0) * 60000;
      const inicioTeorico = this.stepStartTime + durPrevMs;
      this.stepIndex++;
      // v5.15: en el cambio automático se sigue el horario exacto (sin acumular el retraso de cada tick);
      // si el retraso es grande (app suspendida) o el cambio es manual, se parte de ahora.
      this.stepStartTime = (isAuto && (Date.now() - inicioTeorico) < 3000) ? inicioTeorico : Date.now();
      const nextBtn = document.getElementById('gpsNextBtn');
      if (nextBtn) nextBtn.style.animation = '';
      this._renderStepInfo();
      const nuevoBloque = this.steps[this.stepIndex];
      if (nuevoBloque) {
        if (this._vozActiva) this._pitidoFuerte(100, 1800);
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
    // 🔥 v5.6: VELOCIDAD SOSTENIDA, no un salto suelto. Antes se tomaba el
    // tramo más rápido entre DOS puntos consecutivos: con puntos a ~1 s
    // basta un error de GPS de 5-6 m para "correr" a 20 km/h un instante.
    // Ahora se mide la velocidad media (en línea recta) sobre ventanas de al
    // menos 10 s y se toma la mejor: un error puntual de GPS de 8 m solo
    // sumaría ~3 km/h a una ventana de 10 s. Se descartan las ventanas de
    // más de 20 s (contienen una parada o un corte de señal) y las que dan
    // más de 40 km/h (salto de GPS, no una carrera).
    const VENTANA_MS = 10000, MAX_VENTANA_MS = 20000;
    let max = 0;
    let j = 1;
    for (let i = 0; i < points.length - 1; i++) {
      if (j <= i) j = i + 1;
      while (j < points.length - 1 && (points[j].ts - points[i].ts) < VENTANA_MS) j++;
      const dtMs = points[j].ts - points[i].ts;
      if (dtMs < VENTANA_MS) break;      // ya no caben más ventanas completas
      if (dtMs > MAX_VENTANA_MS) continue;
      const dist = this._haversine(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      const speedKmh = (dist / (dtMs / 1000)) * 3.6;
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
    // 🔥 v5.5 FIX RÉCORDS IMPOSIBLES: 'ptsFull' (a pesar del nombre) es el
    // track YA SIMPLIFICADO por Douglas-Peucker (this._finalTrackPoints,
    // ver _procesarTrackFinal) -- perfecto para dibujar/guardar el trazado
    // con pocos puntos, pero sus timestamps ya NO sirven para medir ritmo:
    // al quitar puntos redundantes de un tramo recto, dos puntos que
    // quedan consecutivos pueden estar a decenas de segundos de distancia
    // real aunque no hubiera ninguna parada -- y _mejorTramo (gamification.
    // js) trata cualquier hueco grande entre dos puntos consecutivos como
    // si fuera una parada real (semáforo/túnel), capándolo a un máximo de
    // 8s. Resultado: un tramo recto corrido sin parar durante, por
    // ejemplo, 90s solo computaba 8s de tiempo con la distancia real
    // completa, dando récords absurdamente rápidos (p.ej. un 1km "en
    // 2:40"). Los récords y la velocidad máxima (mismo problema) ahora se
    // calculan con 'this.trackPoints' -- el track SIN simplificar, con un
    // punto real por cada posición del GPS y sin huecos de tiempo
    // artificiales -- que es justo lo que ya decía la intención original
    // de la v5.1 ("el track completo con timestamps ANTES de decimarlo").
    // 'ptsFull' se sigue usando solo para lo que de verdad no depende del
    // tiempo entre puntos: el trazado que se guarda y se dibuja.
    const trackPointsParaRitmo = this.trackPoints;
    const ptsFull = this._finalTrackPoints || this.trackPoints;
    const maxSpeedKmh = this._calcMaxSpeedKmh(trackPointsParaRitmo);
    // 🔥 v5.7: 500 puntos (antes 80). Con 80, un tramo del track cubría 1/80 de la sesión (125 m en
    // 10 km) y los cambios de ritmo cortos (series, cuestas) se perdían o se emborronaban.
    const ptsWall = this._decimarPuntos(ptsFull, 500);
    const trackZonas = this._zonasPorTramo(ptsWall, trackPointsParaRitmo);
    const trackData = {
      points: ptsFull.map(p => ({ lat: p.lat, lng: p.lng })),
      distanceKm: parseFloat(distKm.toFixed(3)),
      durationMs: elapsedMs,
      recordedAt: new Date().toISOString(),
      sesionIndex: this.esExtra ? null : this.diaIndex,
      planId
    };
    let gpsTrackDocId = null;
    try {
      const trackRef = await firebaseServices.db.collection('users').doc(uid).collection('gps_tracks').add(trackData);
      gpsTrackDocId = trackRef.id;
    } catch(e) { console.warn('gps_tracks sin permiso:', e.message); }
    // Récords por tramo (mejor 1km, 5km, 10km... dentro de este mismo
    // recorrido): se calcula AQUÍ, con trackPointsParaRitmo (el track SIN
    // simplificar) todavía en memoria y con su marca de tiempo (ts) real
    // por punto -- los puntos que se guardan en Firestore (arriba, en
    // gps_tracks/globalFeed) van sin ts para no pesar tanto, así que este
    // es el único momento en que se puede hacer este análisis con
    // precisión real. tramosSesion (el mejor tramo de ESTA sesión para
    // cada distancia, la haya batido récord o no) se guarda además en la
    // propia entrada del muro (ver más abajo, recordsPorTramo): así, si
    // más adelante se desmarca OTRA sesión distinta, gamification.js
    // puede recalcular el récord global tomando el mínimo real entre
    // todas las sesiones con GPS que queden, sin depender de estimaciones
    // ni de guardar el track completo con marcas de tiempo en Firestore.
    let tramosSesion = {};
    if (window.Gamification) {
      try {
        const resultadoRecords = await Gamification.actualizarRecordsPorTramos(uid, trackPointsParaRitmo);
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
      if (!this.esExtra) await planRef.update({ [`gpsTrack.${this.diaIndex}`]: { distanceKm: trackData.distanceKm, durationMs: trackData.durationMs, recordedAt: trackData.recordedAt } });
    } catch(e) { console.warn('No se pudo guardar metadata GPS en el plan:', e.message); }
    // El 7º parámetro (saltarComprobacionFatiga=true) evita que se vuelva
    // a preguntar aquí por la recuperación: ya se preguntó ANTES de
    // iniciar el GPS (ver el botón "INICIAR SESIÓN CON GPS" en
    // calendar.js). Preguntarlo aquí, con la pantalla de carga de arriba
    // ya activa, dejaba el aviso tapado sin forma de responderlo y la
    // sesión se quedaba "guardando" para siempre.
    // 🔥 v5.6: datos REALES de esta sesión GPS para las insignias (ver
    // gamification.js v5.21). Inicio = this.startTime (cuando empezó la
    // grabación); fin = inicio + pausas ya cumplidas + tiempo activo, que es
    // justo el instante en que se terminó de correr (si se finaliza estando
    // en pausa, el de la pausa).
    const inicioTs = this.startTime || null;
    const finTs = inicioTs ? inicioTs + (this.pausedTime || 0) + elapsedMs : null;
    const infoGPS = { inicioTs, finTs, velocidadMaxKmh: maxSpeedKmh, recordsPorTramo: tramosSesion };
    // Sesión extra de hoy: se pasa la propia sesión (no está en el plan) y la fecha de hoy.
    const hoyExtra = new Date(); hoyExtra.setHours(0, 0, 0, 0);
    const ctxExtra = this.esExtra ? { sesion: this.sesion, fecha: hoyExtra } : null;
    PlanGenerator._ultimoWallEntryIdExtra = null;
    await PlanGenerator.marcarSesionRealizada(this.diaIndex, true, distKm, elapsedMs, maxSpeedKmh, true, true, null, zonaOverride, infoGPS, ctxExtra);
    let wallEntryId;
    if (this.esExtra) {
      wallEntryId = PlanGenerator._ultimoWallEntryIdExtra;
    } else {
      const planDoc = await planRef.get();
      wallEntryId = planDoc.data()?.wallEntryId?.[this.diaIndex];
    }
    if (wallEntryId) {
      await firebaseServices.db.collection('globalFeed').doc(wallEntryId).update({
        hasGPS: true,
        // Para poder borrar la ruta guardada si más adelante se desmarca o elimina la sesión.
        ...(gpsTrackDocId ? { gpsTrackDocId } : {}),
        trackPoints: ptsWall.map(p => ({ lat: p.lat, lng: p.lng })),
        // Zona de cada tramo (un dígito 1-6 por tramo) para pintar el track por colores
        ...(trackZonas ? { trackZonas } : {}),
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
        const svgRuta = this.renderTrackSVG(ptsWall, 400, 130, trackZonas);
        if (svgRuta) localStorage.setItem(`mapaEstatico_${wallEntryId}`, svgRuta);
      } catch (e) {
        console.warn('No se pudo generar la miniatura de la ruta:', e);
      }
    }
  },

  // 🔥 v5.30: TRACK POR ZONAS. Cada tramo del recorrido guardado se pinta del color de la zona
  // a la que se corrió. La zona de cada tramo se calcula AQUÍ, al terminar la sesión, con el
  // track SIN simplificar (con marcas de tiempo) y las zonas del propio usuario, y se guarda como
  // una cadena de dígitos (1-6), uno por tramo (= nº de puntos guardados - 1), en 'trackZonas'.
  // Así cualquiera que vea la sesión (Muro, Perfil, visor) ve las zonas de QUIEN la corrió.
  _zonasPorTramo(ptsGuardados, puntosRaw) {
    try {
      if (!ptsGuardados || ptsGuardados.length < 2 || !puntosRaw || puntosRaw.length < 2) return null;
      if (typeof PlanGenerator === 'undefined' || !PlanGenerator._detectarZonaPorRitmo) return null;
      if (!AppState.lastZones || !AppState.lastZones.length || !AppState.lastRitmoBase) return null;

      // Distancia y tiempo ACTIVO acumulados (los huecos de >20 s son pausas/cortes y no cuentan)
      const cumD = [0], cumT = [0];
      for (let i = 1; i < puntosRaw.length; i++) {
        const a = puntosRaw[i - 1], b = puntosRaw[i];
        const dt = b.ts - a.ts;
        cumD.push(cumD[i - 1] + this._haversine(a.lat, a.lng, b.lat, b.lng));
        cumT.push(cumT[i - 1] + ((dt > 0 && dt <= 20000) ? dt : 0));
      }
      const idxPorTs = new Map();
      puntosRaw.forEach((p, i) => { if (!idxPorTs.has(p.ts)) idxPorTs.set(p.ts, i); });
      const idx = ptsGuardados.map(p => idxPorTs.get(p.ts));
      if (idx.some(i => i === undefined)) return null;

      const n = ptsGuardados.length - 1;
      // 🔥 v5.7: el ritmo de cada tramo se mide con una VENTANA DE TIEMPO centrada en él (mínimo 12 s en total) sobre el track sin simplificar. Antes se usaba la distancia entre puntos
      // guardados vecinos: con tramos de pocos metros el GPS «bailaba» y el ritmo (y la zona) de
      // un tramo a otro era ruido. 24 s sigue siendo lo bastante corto para ver una repetición
      // de series de 1 min, y lo bastante largo para que un salto de GPS no cambie el color.
      const VENT = 6000; // semiventana mínima: 12 s en total
      const primerIdxDesde = (t) => {
        let lo = 0, hi = cumT.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (cumT[mid] < t) lo = mid + 1; else hi = mid; }
        return lo;
      };
      const zonas = [];
      for (let k = 0; k < n; k++) {
        const tMid = (cumT[idx[k]] + cumT[idx[k + 1]]) / 2;
        // Si el tramo ya dura ≥12 s se usa su propio ritmo (sin mezclar con los vecinos: así un
        // esfuerzo de 100 m no se diluye); si es más corto, se amplía hasta 12 s para quitar ruido.
        const semi = Math.max(VENT, (cumT[idx[k + 1]] - cumT[idx[k]]) / 2);
        const i0 = Math.min(primerIdxDesde(tMid - semi), idx[k]);
        const i1 = Math.max(primerIdxDesde(tMid + semi), idx[k + 1]);
        const d = cumD[i1] - cumD[i0];
        const t = cumT[i1] - cumT[i0];
        let zona = null;
        if (d >= 12 && t >= 8000) {
          const pace = (t / 60000) / (d / 1000); // min/km
          const z = PlanGenerator._detectarZonaPorRitmo(pace);
          const num = z ? parseInt(String(z[0]).replace(/\D/g, ''), 10) : NaN;
          if (num >= 1 && num <= 6) zona = num;
        }
        zonas.push(zona);
      }
      // Tramos sin dato (parada, señal) heredan la zona del anterior (o del siguiente conocido)
      let ultima = zonas.find(z => z !== null);
      if (!ultima) return null;
      const rellenas = zonas.map(z => { if (z !== null) ultima = z; return ultima; });
      return this._limpiarZonas(rellenas.join(''));
    } catch (e) {
      console.warn('No se pudieron calcular las zonas del track:', e);
      return null;
    }
  },

  colorZona(num) {
    const paleta = (typeof ZONE_COLORS !== 'undefined' && Array.isArray(ZONE_COLORS))
      ? ZONE_COLORS : ['#6A9FC8', '#7FB88A', '#D6BC62', '#D49A5C', '#C9706B', '#9C80B8'];
    return paleta[(parseInt(num, 10) || 1) - 1] || '#c0a060';
  },

  // 🔥 v5.31: TRACK CON DEGRADADO. En vez de cortes directos de color entre zonas, el color cambia
  // de forma progresiva: la zona de cada punto se suaviza con sus vecinos (±2 puntos) y el color se
  // interpola entre los de las zonas (pasar de Z1 a Z3 atraviesa el color de Z2). Cada tramo se
  // trocea en 'sub' piezas para que el cambio sea fluido. Devuelve null si 'zonas' no encaja con los
  // puntos (entonces se pinta el track dorado de siempre). [{ latlngs:[[lat,lng],[lat,lng]], color }]
  _mezclarHex(c1, c2, t) {
    const rgb = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const a = rgb(c1), b = rgb(c2);
    const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return '#' + m.map(v => v.toString(16).padStart(2, '0')).join('');
  },

  colorEnPosicion(zf) {
    const z = Math.min(6, Math.max(1, zf));
    const a = Math.floor(z), b = Math.min(6, a + 1);
    return this._mezclarHex(this.colorZona(a), this.colorZona(b), z - a);
  },

  // Quita los tramos AISLADOS de otra zona (un salto de GPS de un solo tramo): filtro de mediana de
  // ventana 3, con tratamiento propio de los extremos. Un esfuerzo real, aunque corto (2 o más
  // tramos seguidos, ≈70-100 m en una salida de 10 km), se conserva intacto. Se aplica al guardar Y
  // al dibujar (así también se limpian las sesiones ya guardadas con un salto suelto).
  _limpiarZonas(str) {
    if (typeof str !== 'string' || str.length < 3) return str;
    const a = str.split('').map(Number);
    const r = a.map((z, k) => {
      if (k === 0) return (a[0] !== a[1] && a[1] === a[2]) ? a[1] : a[0];
      if (k === a.length - 1) return (a[k] !== a[k - 1] && a[k - 1] === a[k - 2]) ? a[k - 1] : a[k];
      return [a[k - 1], a[k], a[k + 1]].sort((x, y) => x - y)[1];
    });
    return r.join('');
  },

  // 🔥 v5.8: TRACK DE COLORES POR ZONA CON TRANSICIÓN SUAVE. Cada tramo se pinta del color PURO de
  // su zona; solo las piezas extremas de cada tramo se mezclan a medias con la zona vecina para que
  // el cambio no sea un corte seco. No se pasa por zonas intermedias (Z2→Z5 NO pinta Z3 ni Z4), así
  // que los únicos colores del track son los de las zonas reales y la LEYENDA (zonasVisibles) coincide
  // exactamente con lo dibujado, sin importar lo corto que sea el esfuerzo (100 m también cuenta).
  // Devuelve null si 'zonas' no encaja con los puntos (entonces track dorado).
  // [{ latlngs:[[lat,lng],[lat,lng]], color }] con la propiedad .zonasVisibles = [zonas dibujadas]
  tramosDegradado(points, zonas, sub = 3) {
    if (!Array.isArray(points) || typeof zonas !== 'string' || zonas.length !== points.length - 1 || !/^[1-6]+$/.test(zonas)) return null;
    const zs = this._limpiarZonas(zonas).split('').map(Number);
    const n = zs.length;
    const col = z => this.colorZona(z);
    const piezas = [];
    for (let k = 0; k < n; k++) {
      const A = points[k], B = points[k + 1];
      for (let s = 0; s < sub; s++) {
        const t0 = s / sub, t1 = (s + 1) / sub;
        let color = col(zs[k]);
        if (sub >= 3) {
          if (s === 0 && k > 0 && zs[k - 1] !== zs[k]) color = this._mezclarHex(col(zs[k - 1]), col(zs[k]), 0.5);
          else if (s === sub - 1 && k < n - 1 && zs[k + 1] !== zs[k]) color = this._mezclarHex(col(zs[k]), col(zs[k + 1]), 0.5);
        }
        piezas.push({
          latlngs: [
            [A.lat + (B.lat - A.lat) * t0, A.lng + (B.lng - A.lng) * t0],
            [A.lat + (B.lat - A.lat) * t1, A.lng + (B.lng - A.lng) * t1]
          ],
          color
        });
      }
    }
    piezas.zonasVisibles = [...new Set(zs)].sort((x, y) => x - y);
    return piezas;
  },

  // Agrupa tramos consecutivos de la misma zona. Devuelve [{ zona, latlngs:[[lat,lng],...] }]
  // (cada grupo arranca en el último punto del anterior, así la línea no tiene huecos).
  // Devuelve null si 'zonas' no encaja con los puntos (entonces se pinta el track dorado de siempre).
  agruparTramosPorZona(points, zonas) {
    if (!Array.isArray(points) || typeof zonas !== 'string' || zonas.length !== points.length - 1 || !/^[1-6]+$/.test(zonas)) return null;
    const grupos = [];
    for (let k = 0; k < zonas.length; k++) {
      const z = parseInt(zonas[k], 10);
      const ult = grupos[grupos.length - 1];
      if (ult && ult.zona === z) {
        ult.latlngs.push([points[k + 1].lat, points[k + 1].lng]);
      } else {
        grupos.push({ zona: z, latlngs: [[points[k].lat, points[k].lng], [points[k + 1].lat, points[k + 1].lng]] });
      }
    }
    return grupos;
  },

  _decimarPuntos(pts, max) {
    if (pts.length <= max) return pts;
    const step = Math.ceil(pts.length / max);
    const res = [];
    for (let i = 0; i < pts.length; i += step) res.push(pts[i]);
    if (res[res.length-1] !== pts[pts.length-1]) res.push(pts[pts.length-1]);
    return res;
  },

  renderTrackSVG(points, width = 320, height = 130, zonas = '') {
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
    // 🔥 v5.30: si hay zonas por tramo, un trazo por grupo de zona con su color; si no, dorado
    const piezas = this.tramosDegradado(points, zonas, 2);
    const trazos = piezas
      ? piezas.map(pz => `<path d="M ${pz.latlngs.map(ll => toXY({ lat: ll[0], lng: ll[1] })).join(' L ')}" fill="none" stroke="${pz.color}" stroke-width="3" stroke-linecap="round"/>`).join('')
      : `<path d="${pathD}" fill="none" stroke="#c0a060" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
        style="border-radius:var(--radius-md); background:#eaeaea; display:block; width:100%; max-width:${width}px;"
        xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#eaeaea" rx="8" ry="8"/>
      ${trazos}
      <circle cx="${s[0]}" cy="${s[1]}" r="7" fill="none" stroke="#fff" stroke-width="2"/>
      <text x="${e[0]}" y="${e[1]}" font-size="18" text-anchor="middle" dominant-baseline="central">🏁</text>
    </svg>`;
  }
};

window.GPSTracker = GPSTracker;
console.log('✅ GPS Tracker v5.14 - Pantalla siempre encendida: Wake Lock robusto + vídeo mudo de respaldo (no pausa la música); 1 Hz desactivado · v5.13 - El oscilador silencioso ya no se arranca: Spotify deja de pausarse al iniciar la sesión GPS · v5.12 - Audio ambient antes de beeps y voz · v5.11 - gpsTrackDocId en la entrada del muro · v5.9 - El aviso de series dice cuántas, de cuánto, en qué zona y con qué descanso · v5.8 - Colores puros por zona con transición local y leyenda exacta · v5.7 - Track con 300 puntos y zonas por ventana de tiempo (más detalle)');