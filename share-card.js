// ==================== share-card.js ====================
// Versión: 3.0 - Rediseño: composición centrada en un "medallón" circular
// (la ruta GPS dentro si existe, o el nivel del corredor si no la hay),
// para que la tarjeta quede siempre equilibrada haya o no mapa. Pensada
// para no parecerse a las tarjetas rectangulares típicas de otras apps.
// ====================

const ShareCard = {

  // URL pública real de la app (confirmada), usada para el QR y el
  // enlace de "únete" en la tarjeta compartida.
  APP_URL: 'https://jpeiala9-ctrl.github.io/RI5-Zaragoza/index.html',

  // Añade el parámetro ?r=1 correctamente. La URL real termina en
  // "index.html" (un archivo, no una carpeta), así que NO hay que meter
  // una barra "/" antes del "?" — eso rompería la ruta.
  _urlUnirse() {
    const sep = this.APP_URL.includes('?') ? '&' : '?';
    return `${this.APP_URL}${sep}r=1`;
  },

  // Versión corta y legible para mostrar como texto bajo el QR (la URL
  // completa con "index.html" queda fea en una imagen; el QR sí lleva
  // la URL real completa, esto es solo lo que se lee).
  _urlParaMostrar() {
    return this.APP_URL.replace('https://', '').replace(/\/index\.html$/i, '');
  },

  // ---------- Utilidades de formato ----------
  _fmtTiempo(ms) {
    if (!ms) return '0:00';
    const totalSeg = Math.floor(ms / 1000);
    const h = Math.floor(totalSeg / 3600);
    const m = Math.floor((totalSeg % 3600) / 60);
    const s = totalSeg % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  _fmtRitmo(distanciaKm, ms) {
    if (!distanciaKm || distanciaKm < 0.1 || !ms) return '--:--';
    const segPorKm = (ms / 1000) / distanciaKm;
    const m = Math.floor(segPorKm / 60);
    const s = Math.round(segPorKm % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  _tipoEmoji(tipo) {
    return { rodaje: '🏃‍♂️', tempo: '⚡', series: '🔁', largo: '📏', strength: '💪' }[tipo] || '🏃';
  },

  _cargarLogo() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = './icon-192.png';
    });
  },

  _qrLibCargada: false,
  _cargarQRLib() {
    return new Promise(resolve => {
      if (window.qrcode && this._qrLibCargada) { resolve(); return; }
      if (window.qrcode) { this._qrLibCargada = true; resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.0.3/qrcode.min.js';
      s.onload = () => { this._qrLibCargada = true; resolve(); };
      s.onerror = () => resolve(); // si falla, simplemente no se dibuja el QR
      document.head.appendChild(s);
    });
  },

  // Dibuja el QR con fondo blanco (el contraste alto es imprescindible
  // para que cualquier cámara lo escanee bien; el dorado de la marca no
  // sirve aquí, así que solo se usa como marco decorativo alrededor).
  async _dibujarQR(ctx, url, x, y, size) {
    await this._cargarQRLib();
    if (!window.qrcode) return false;
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      const count = qr.getModuleCount();
      const pad = 18;
      const inner = size - pad * 2;
      const cell = inner / count;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, size, size, 16); else ctx.rect(x, y, size, size);
      ctx.fill();

      ctx.fillStyle = '#0a0a0a';
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(x + pad + col * cell, y + pad + row * cell, cell + 0.5, cell + 0.5);
          }
        }
      }

      ctx.strokeStyle = '#c0a060';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, size, size, 16); else ctx.rect(x, y, size, size);
      ctx.stroke();

      return true;
    } catch (e) {
      console.warn('No se pudo generar el QR:', e);
      return false;
    }
  },

  // Ubicación actual del móvil, solo para el caso sin GPS (mostrar "dónde
  // entrenas" aunque esa sesión en concreto no se rastreara). Tiempo
  // límite corto: si el usuario ignora el permiso, no se bloquea nada.
  _obtenerCiudadActual() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      let resuelto = false;
      const acabar = (valor) => { if (!resuelto) { resuelto = true; resolve(valor); } };
      const limite = setTimeout(() => acabar(null), 5000);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`;
            const res = await fetch(url, { headers: { 'User-Agent': 'RI5RunningApp/1.0' } });
            const data = await res.json();
            const address = data.address || {};
            const nombreCiudad = address.city || address.town || address.village || address.municipality || address.county || null;
            const region = address.state || address.province || null;
            clearTimeout(limite);
            acabar(nombreCiudad ? { ciudad: nombreCiudad, region } : null);
          } catch (e) {
            console.warn('No se pudo geocodificar la ubicación para la tarjeta:', e);
            clearTimeout(limite);
            acabar(null);
          }
        },
        () => { clearTimeout(limite); acabar(null); }, // permiso denegado u otro error
        { timeout: 4500, maximumAge: 600000 }
      );
    });
  },


  async _recopilarDatos() {
    const ult = AppState.currentUserData?.ultimaSesion;
    if (!ult) return null;

    const uid = AppState.currentUserId;
    const peso = AppState.currentUserData?.profile?.weight || null;

    let trackPoints = null;
    let gpsDistanciaKm = null;
    let gpsDuracionMs = null;
    if (ult.hasGPS && ult.entryId) {
      try {
        const doc = await firebaseServices.db.collection('globalFeed').doc(ult.entryId).get();
        if (doc.exists) {
          const d = doc.data();
          if (Array.isArray(d.trackPoints) && d.trackPoints.length >= 2) trackPoints = d.trackPoints;
          if (d.gpsDistanceKm) gpsDistanciaKm = d.gpsDistanceKm;
          if (d.gpsDurationMs) gpsDuracionMs = d.gpsDurationMs;
        }
      } catch (e) { console.warn('No se pudo recuperar la ruta GPS para compartir:', e); }
    }

    const distanciaKm = gpsDistanciaKm || parseFloat(ult.distancia || 0);
    const duracionMs = gpsDuracionMs || (ult.duration ? ult.duration * 60000 : 0);

    // Si la sesión no llevaba GPS, se intenta averiguar la ciudad actual
    // del móvil (con permiso y con un tiempo límite corto, para no dejar
    // colgado el "Compartir" si el usuario ignora el permiso). Si no hay
    // permiso, falla, o tarda demasiado, simplemente no se muestra.
    let ciudad = null;
    if (!trackPoints) {
      ciudad = await this._obtenerCiudadActual();
    }

    let zapatilla = null;
    let nivel = 1;
    let colorNivel = '#c0a060';
    try {
      if (window.Gamification && uid) {
        const data = await Gamification.getData(uid);
        if (data.currentShoe && data.currentShoe.name && data.currentShoe.name !== 'Zapatilla actual') {
          zapatilla = data.currentShoe;
        }
        nivel = data.level || Gamification.getLevelByDistance(data.totalDistance || 0) || 1;
        colorNivel = Gamification.getColorByLevel(nivel) || '#c0a060';
      }
    } catch (e) { console.warn('No se pudo recuperar nivel/zapatilla para compartir:', e); }

    let kmPorDia = [0, 0, 0, 0, 0, 0, 0];
    try {
      const desde = new Date();
      desde.setDate(desde.getDate() - 6);
      desde.setHours(0, 0, 0, 0);
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .get();
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      snap.forEach(doc => {
        const d = doc.data();
        const fecha = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
        const fechaDia = new Date(fecha); fechaDia.setHours(0, 0, 0, 0);
        if (fechaDia >= desde && fechaDia <= hoy) {
          const idx = Math.round((fechaDia - desde) / 86400000);
          if (idx >= 0 && idx < 7) kmPorDia[idx] += parseFloat(d.gpsDistanceKm || d.distancia || 0);
        }
      });
    } catch (e) { console.warn('No se pudo recuperar el histórico de km para la gráfica:', e); }

    const pesoEstim = peso || 70;
    const calorias = Math.round(distanciaKm * pesoEstim * 1.036);

    return {
      username: AppState.currentUserData?.username || 'Runner',
      fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      tipo: ult.trainingType || 'rodaje',
      nombreSesion: ult.trainingName || ult.trainingType || 'Sesión',
      zona: ult.zone || '',
      distanciaKm,
      duracionMs,
      calorias,
      trackPoints,
      zapatilla,
      nivel,
      colorNivel,
      ciudad,
      kmPorDia
    };
  },

  // ---------- Ruta GPS proyectada y recortada dentro de un círculo ----------
  // Escribe texto SIEMPRE centrado y SIEMPRE dentro de maxWidth: si no
  // cabe al tamaño pedido, reduce el tamaño progresivamente, y si aun al
  // tamaño mínimo sigue sin caber, trunca con "…". Así ningún nombre de
  // sesión, usuario o zapatilla puede salirse nunca de la tarjeta.
  _fillTextAjustado(ctx, text, cx, y, maxWidth, weight, family, baseSize, minSize = 15) {
    let size = baseSize;
    ctx.font = `${weight} ${size}px ${family}`;
    while (ctx.measureText(text).width > maxWidth && size > minSize) {
      size -= 2;
      ctx.font = `${weight} ${size}px ${family}`;
    }
    let out = text;
    if (ctx.measureText(out).width > maxWidth) {
      while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) {
        out = out.slice(0, -1);
      }
      out += '…';
    }
    ctx.fillText(out, cx, y);
    return size;
  },

  // ---------- Ruta GPS ajustada dentro del panel rectangular ----------
  _dibujarRutaEnPanel(ctx, trackPoints, x, y, w, h) {
    const lats = trackPoints.map(p => p.lat);
    const lngs = trackPoints.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const avgLat = (minLat + maxLat) / 2;
    const corrLng = Math.cos(avgLat * Math.PI / 180);

    const cx = x + w / 2, cy = y + h / 2;
    const padding = 48;
    const rangoLat = (maxLat - minLat) || 0.0005;
    const rangoLng = ((maxLng - minLng) * corrLng) || 0.0005;
    const escala = Math.min((w - padding * 2) / rangoLng, (h - padding * 2) / rangoLat);

    const proyectar = (p) => {
      const px = cx + ((p.lng - (minLng + maxLng) / 2) * corrLng) * escala;
      const py = cy - (p.lat - (minLat + maxLat) / 2) * escala;
      return [px, py];
    };
    const puntos = trackPoints.map(proyectar);

    ctx.shadowColor = 'rgba(192,160,96,0.8)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#c0a060';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    puntos.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.stroke();
    ctx.shadowBlur = 0;

    const [sx, sy] = puntos[0];
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    const [ex, ey] = puntos[puntos.length - 1];
    ctx.beginPath();
    ctx.arc(ex, ey, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#c0a060';
    ctx.fill();
  },

  // ---------- Ciudad actual (sesiones sin GPS, con ubicación disponible) ----------
  // Textura de fondo sutil tipo "mapa" (rejilla de puntos), para que el
  // panel nunca se vea como una caja vacía, sea cual sea su contenido.
  // Textura de "líneas de nivel" tipo mapa topográfico/curvas de
  // desnivel — mucho más reconocible como "algo de terreno/ruta" que una
  // simple rejilla de puntos, y encaja con el mundo del running/trail.
  _dibujarTexturaPanel(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 28); else ctx.rect(x, y, w, h);
    ctx.clip();

    const centros = [
      { cx: x + w * 0.22, cy: y + h * 0.28 },
      { cx: x + w * 0.78, cy: y + h * 0.75 }
    ];
    centros.forEach((c, ci) => {
      for (let r = 60; r < Math.max(w, h); r += 70) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.08) {
          // Perturbación suave para que no sean círculos perfectos —
          // más orgánico, como curvas de nivel reales
          const ruido = Math.sin(a * 3 + ci * 2) * 10 + Math.cos(a * 5) * 6;
          const px = c.cx + Math.cos(a) * (r + ruido);
          const py = c.cy + Math.sin(a) * (r + ruido);
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(192,160,96,0.09)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
    ctx.restore();
  },

  _dibujarCiudadEnPanel(ctx, ciudad, x, y, w, h) {
    const cx = x + w / 2, cy = y + h / 2 - 20;
    ctx.save();
    ctx.textAlign = 'center';

    // Anillos tipo "radar" detrás del pin, para dar sensación de
    // ubicación localizada en vez de un icono suelto en el vacío
    [128, 92, 58].forEach((radio, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radio, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(192,160,96,${0.12 + i * 0.06})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.font = '92px sans-serif';
    ctx.fillText('📍', cx, cy + 24);

    ctx.fillStyle = '#ffffff';
    this._fillTextAjustado(ctx, ciudad.ciudad, cx, cy + 118, w - 90, '700', '"Courier New", monospace', 46);

    if (ciudad.region && ciudad.region !== ciudad.ciudad) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      this._fillTextAjustado(ctx, ciudad.region, cx, cy + 160, w - 90, '400', '"Courier New", monospace', 26);
    }
    ctx.restore();
  },

  // ---------- Relleno decorativo cuando no hay ni ruta ni ciudad ----------
  _dibujarFallbackEnPanel(ctx, tipo, x, y, w, h) {
    const cx = x + w / 2, cy = y + h / 2;
    ctx.save();
    ctx.textAlign = 'center';

    [140, 100, 64].forEach((radio, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy - 8, radio, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(192,160,96,${0.1 + i * 0.05})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.globalAlpha = 0.9;
    ctx.font = '120px sans-serif';
    ctx.fillText(this._tipoEmoji(tipo), cx, cy + 8);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 24px "Courier New", monospace';
    ctx.fillText('SESIÓN SIN GPS', cx, cy + 74);
    ctx.restore();
  },

  // ---------- Panel central completo: fondo + contenido + doble borde ----------
  _dibujarPanelCentral(ctx, datos, x, y, w, h) {
    const radio = 28;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, radio); else ctx.rect(x, y, w, h);
    ctx.clip();

    // Fondo con calidez real (antes era un tinte casi imperceptible que
    // se veía como una simple caja negra). Degradado radial ámbar/bronce,
    // más intenso hacia el centro, como un resplandor cálido.
    const bg = ctx.createRadialGradient(x + w / 2, y + h * 0.42, w * 0.08, x + w / 2, y + h / 2, w * 0.72);
    bg.addColorStop(0, 'rgba(150,105,45,0.55)');
    bg.addColorStop(0.5, 'rgba(90,62,28,0.42)');
    bg.addColorStop(1, 'rgba(30,22,14,0.55)');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    this._dibujarTexturaPanel(ctx, x, y, w, h);

    if (datos.trackPoints) {
      this._dibujarRutaEnPanel(ctx, datos.trackPoints, x, y, w, h);
    } else if (datos.ciudad) {
      this._dibujarCiudadEnPanel(ctx, datos.ciudad, x, y, w, h);
    } else {
      this._dibujarFallbackEnPanel(ctx, datos.tipo, x, y, w, h);
    }
    ctx.restore();

    // Doble borde simétrico: fino dorado exterior + interior del color
    // de nivel del corredor, igual de "cuadrado" en las cuatro esquinas
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, radio); else ctx.rect(x, y, w, h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c0a060';
    ctx.stroke();

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 9, y + 9, w - 18, h - 18, radio - 8); else ctx.rect(x + 9, y + 9, w - 18, h - 18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = datos.colorNivel || '#c0a060';
    ctx.stroke();
  },

  // ---------- Fila de "chips" de estadísticas, centrada como grupo ----------
  _dibujarChips(ctx, W, y, metrics) {
    const chipW = 228, chipH = 148, gap = 16;
    const totalW = metrics.length * chipW + (metrics.length - 1) * gap;
    let x = (W - totalW) / 2;

    metrics.forEach(m => {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, chipW, chipH, 18); else ctx.rect(x, y, chipW, chipH);
      ctx.fill();
      ctx.strokeStyle = 'rgba(192,160,96,0.25)';
      ctx.lineWidth = 1.5;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, chipW, chipH, 18); ctx.stroke(); }

      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(m.emoji, x + chipW / 2, y + 46);

      ctx.fillStyle = '#ffffff';
      this._fillTextAjustado(ctx, m.value, x + chipW / 2, y + 96, chipW - 24, '700', '"Courier New", monospace', 40, 22);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this._fillTextAjustado(ctx, m.label, x + chipW / 2, y + 126, chipW - 16, '400', '"Courier New", monospace', 19, 13);

      x += chipW + gap;
    });
    ctx.textAlign = 'center';
  },

  // ---------- Mini gráfica de los últimos 7 días, centrada ----------
  _dibujarGraficaSemana(ctx, kmPorDia, cx, y, w, h) {
    const x = cx - w / 2;
    const max = Math.max(...kmPorDia, 1);
    const n = kmPorDia.length;
    const gap = 12;
    const barW = (w - gap * (n - 1)) / n;
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const hoyIdx = n - 1;

    kmPorDia.forEach((km, i) => {
      const barH = Math.max(5, (km / max) * (h - 26));
      const bx = x + i * (barW + gap);
      const by = y + (h - 26) - barH;
      ctx.fillStyle = i === hoyIdx ? '#c0a060' : 'rgba(192,160,96,0.32)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, barW, barH, 5); else ctx.rect(bx, by, barW, barH);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '400 19px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dias[i], bx + barW / 2, y + h - 4);
    });
    ctx.textAlign = 'center';
  },

  // ---------- Generar el canvas completo ----------
  async _generarCanvas(datos) {
    const W = 1080, H = 2040;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const cx = W / 2;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#151515');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(192,160,96,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';

    // Cabecera con jerarquía clara: la marca RI5 pequeña y discreta
    // arriba del todo, y el nombre del corredor como protagonista real
    // (antes ambos competían al mismo tamaño y quedaba todo apelmazado).
    const logo = await this._cargarLogo();
    let y = 104;
    if (logo) ctx.drawImage(logo, cx - 26, y - 38, 52, 52);
    ctx.fillStyle = 'rgba(192,160,96,0.8)';
    ctx.font = '600 19px "Courier New", monospace';
    ctx.fillText('RI5 · RUNNING INTELLIGENCE', cx, y + 36);

    y += 36 + 58;
    ctx.fillStyle = '#ffffff';
    this._fillTextAjustado(ctx, datos.username, cx, y, W - 140, '700', '"Courier New", monospace', 38, 24);

    y += 38;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '400 23px "Courier New", monospace';
    ctx.fillText(datos.fecha, cx, y);

    // Panel central: ruta GPS, ciudad actual, o relleno decorativo — el
    // mismo tamaño siempre, así la composición queda igual de centrada y
    // llena en cualquiera de los tres casos
    const panelW = 900, panelH = 560;
    const panelX = cx - panelW / 2;
    const panelY = y + 58;
    this._dibujarPanelCentral(ctx, datos, panelX, panelY, panelW, panelH);

    // Título de la sesión + zona, centrados bajo el panel — con ancho
    // protegido, nunca se sale aunque el nombre de la sesión sea largo
    y = panelY + panelH + 84;
    ctx.fillStyle = '#c0a060';
    const titulo = `${this._tipoEmoji(datos.tipo)} ${(datos.nombreSesion || datos.tipo).toUpperCase()}`;
    this._fillTextAjustado(ctx, titulo, cx, y, W - 120, '700', '"Courier New", monospace', 46, 26);
    if (datos.zona) {
      y += 46;
      ctx.fillStyle = '#9BB5A0';
      this._fillTextAjustado(ctx, datos.zona, cx, y, W - 140, '600', '"Courier New", monospace', 25, 18);
    }

    // Chips de estadísticas, centrados como grupo
    y += 64;
    const metrics = [
      { emoji: '📏', label: 'DISTANCIA', value: `${(datos.distanciaKm || 0).toFixed(2)}km` },
      { emoji: '⏱️', label: 'TIEMPO', value: this._fmtTiempo(datos.duracionMs) },
      { emoji: '⚡', label: 'RITMO', value: `${this._fmtRitmo(datos.distanciaKm, datos.duracionMs)}` },
      { emoji: '🔥', label: 'CALORÍAS', value: `${(datos.calorias || 0).toLocaleString('es-ES')}` }
    ];
    this._dibujarChips(ctx, W, y, metrics);
    y += 148 + 60;

    // Separador centrado (no a sangre completa, más "diseñado")
    ctx.strokeStyle = 'rgba(192,160,96,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 160, y);
    ctx.lineTo(cx + 160, y);
    ctx.stroke();
    y += 60;

    // Nivel + zapatilla, en una línea centrada — con ancho protegido: si
    // el nombre de la zapatilla es largo, esta línea se reduce o se
    // trunca antes de salirse de la tarjeta
    ctx.fillStyle = datos.colorNivel || '#c0a060';
    let linea = `🎖 NIVEL ${datos.nivel}`;
    if (datos.zapatilla) linea += `   ·   👟 ${datos.zapatilla.name} (${(datos.zapatilla.km||0).toFixed(0)}km)`;
    this._fillTextAjustado(ctx, linea, cx, y, W - 100, '600', '"Courier New", monospace', 27, 17);
    y += 70;

    // Mini gráfica de los últimos 7 días, centrada
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 23px "Courier New", monospace';
    ctx.fillText('ÚLTIMOS 7 DÍAS', cx, y);
    this._dibujarGraficaSemana(ctx, datos.kmPorDia, cx, y + 20, 780, 136);
    y += 20 + 136 + 76;

    // QR + enlace: la forma real de que alguien pase de "ver la imagen" a
    // "abrir la app", ya que una imagen compartida no admite enlaces
    // pulsables. El texto de la URL sirve de respaldo para quien prefiera
    // escribirla a mano.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 24px "Courier New", monospace';
    ctx.fillText('ESCANEA Y ÚNETE GRATIS', cx, y);
    y += 28;
    const qrSize = 190;
    await this._dibujarQR(ctx, this._urlUnirse(), cx - qrSize / 2, y, qrSize);
    y += qrSize + 46;
    ctx.fillStyle = '#c0a060';
    this._fillTextAjustado(ctx, this._urlParaMostrar(), cx, y, W - 100, '600', '"Courier New", monospace', 26, 16);
    y += 52;

    // Pie / reclamo, centrado
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '400 22px "Courier New", monospace';
    ctx.fillText('Entrenado con RI5 — entrena gratis con tu móvil', cx, H - 50);

    ctx.textAlign = 'left';
    return canvas;
  },

  // ---------- Modal de vista previa + compartir ----------
  async mostrarModal(datos) {
    let canvas;
    try {
      if (typeof Utils !== 'undefined' && Utils.showLoading) Utils.showLoading();
      canvas = await this._generarCanvas(datos || {});
    } finally {
      if (typeof Utils !== 'undefined' && Utils.hideLoading) Utils.hideLoading();
    }

    document.getElementById('shareCardOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'shareCardOverlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      z-index:70000; display:flex; align-items:center; justify-content:center; padding:20px;
      box-sizing:border-box; overflow:auto;
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // El ajuste por CSS (width:100% + min-width:0) seguía sin encogerse
    // en algún dispositivo real, así que aquí se calcula el ancho EXACTO
    // en píxeles con JavaScript, sin dejarle a ningún navegador margen
    // para interpretar mal un porcentaje dentro de flexbox.
    const anchoDisponible = Math.min(420, window.innerWidth - 40); // 40 = padding del overlay
    const anchoModal = Math.max(260, anchoDisponible);
    const anchoImagen = anchoModal - 36; // 36 = padding interior del modal (18px * 2)

    const modal = document.createElement('div');
    modal.style.cssText = `
      background:#0f0f0f; border-radius:20px; padding:18px;
      width:${anchoModal}px; max-width:${anchoModal}px; box-sizing:border-box;
      border:1px solid #2a2a2a; display:flex; flex-direction:column; gap:16px;
      max-height:85vh; overflow-y:auto; overflow-x:hidden; font-family:'Courier New', monospace;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
    header.innerHTML = `
      <span style="font-weight:600; letter-spacing:1px; color:#c0a060; font-size:13px;">📸 RESUMEN DE LA SESIÓN</span>
      <button id="closeShareCardBtn" style="background:#c0392b; border:none; color:white; width:30px; height:30px; min-width:30px; min-height:30px; border-radius:50%; cursor:pointer; font-size:15px; line-height:1; padding:0; display:flex; align-items:center; justify-content:center; flex-shrink:0;">✕</button>
    `;

    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    // Ancho fijo en píxeles, calculado arriba — nada de porcentajes.
    img.style.cssText = `width:${anchoImagen}px; height:auto; border-radius:12px; display:block; border:1px solid #2a2a2a;`;

    const botones = document.createElement('div');
    botones.style.cssText = 'display:flex; gap:10px;';
    botones.innerHTML = `
      <button id="shareCardBtn" style="flex:1; background:#c0a060; border:none; color:#000; font-weight:700; padding:13px; border-radius:12px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">📤 Compartir</button>
      <button id="downloadCardBtn" style="flex:1; background:transparent; border:1px solid #2a2a2a; color:#ccc; font-weight:600; padding:13px; border-radius:12px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">⬇️ Guardar</button>
    `;

    const skipBtn = document.createElement('button');
    skipBtn.id = 'skipShareCardBtn';
    skipBtn.textContent = 'Ahora no';
    skipBtn.style.cssText = 'background:none; border:none; color:#888; font-size:12px; cursor:pointer; padding:4px; align-self:center;';

    modal.appendChild(header);
    modal.appendChild(img);
    modal.appendChild(botones);
    modal.appendChild(skipBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cerrar = () => overlay.remove();
    document.getElementById('closeShareCardBtn').addEventListener('click', cerrar);
    document.getElementById('skipShareCardBtn').addEventListener('click', cerrar);

    document.getElementById('shareCardBtn').addEventListener('click', async () => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `ri5-sesion-${Date.now()}.png`, { type: 'image/png' });
        const texto = `${this._tipoEmoji(datos.tipo)} ${(datos.nombreSesion || datos.tipo).toUpperCase()} · ${(datos.distanciaKm||0).toFixed(2)} km en ${this._fmtTiempo(datos.duracionMs)} 🏃 Entrenado con RI5 — la app gratuita de entrenamiento inteligente. Únete: ${this._urlUnirse()}`;
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Mi sesión en RI5', text: texto });
          } else if (navigator.share) {
            await navigator.share({ title: 'Mi sesión en RI5', text: texto });
            if (typeof Utils !== 'undefined') Utils.showToast('Tu navegador no admite compartir la imagen: descárgala y adjúntala a mano', 'info', 5000);
          } else {
            this._descargar(canvas);
            if (typeof Utils !== 'undefined') Utils.showToast('Tu navegador no admite compartir directo: se ha descargado la imagen', 'info', 5000);
          }
        } catch (err) {
          if (err?.name !== 'AbortError') {
            console.error('Error al compartir:', err);
            if (typeof Utils !== 'undefined') Utils.showToast('No se pudo abrir el panel de compartir', 'error');
          }
        }
      }, 'image/png');
    });

    document.getElementById('downloadCardBtn').addEventListener('click', () => this._descargar(canvas));
  },

  _descargar(canvas) {
    const a = document.createElement('a');
    a.download = `ri5-sesion-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  },

  // ---------- Punto de entrada desde la tarjeta de Inicio ----------
  async compartirUltimaSesion() {
    if (!AppState.currentUserData?.ultimaSesion) {
      if (typeof Utils !== 'undefined') Utils.showToast('Todavía no tienes ninguna sesión registrada', 'info');
      return;
    }
    try {
      if (typeof Utils !== 'undefined' && Utils.showLoading) Utils.showLoading();
      const datos = await this._recopilarDatos();
      if (typeof Utils !== 'undefined' && Utils.hideLoading) Utils.hideLoading();
      if (!datos) return;
      await this.mostrarModal(datos);
    } catch (e) {
      if (typeof Utils !== 'undefined' && Utils.hideLoading) Utils.hideLoading();
      console.error('Error preparando el resumen para compartir:', e);
      if (typeof Utils !== 'undefined') Utils.showToast('No se pudo preparar el resumen', 'error');
    }
  }
};

window.ShareCard = ShareCard;
console.log('✅ ShareCard v3.0 - Medallón central (ruta o nivel), composición centrada');
