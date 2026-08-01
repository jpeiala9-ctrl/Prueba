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

  // ---------- Recopilar los datos de la última sesión ----------
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
      kmPorDia
    };
  },

  // ---------- Ruta GPS proyectada y recortada dentro de un círculo ----------
  _dibujarRutaEnCirculo(ctx, trackPoints, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Fondo del medallón
    const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    bg.addColorStop(0, 'rgba(192,160,96,0.16)');
    bg.addColorStop(1, 'rgba(192,160,96,0.02)');
    ctx.fillStyle = bg;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    const lats = trackPoints.map(p => p.lat);
    const lngs = trackPoints.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const avgLat = (minLat + maxLat) / 2;
    const corrLng = Math.cos(avgLat * Math.PI / 180);

    const padding = r * 0.32;
    const rangoLat = (maxLat - minLat) || 0.0005;
    const rangoLng = ((maxLng - minLng) * corrLng) || 0.0005;
    const escala = Math.min((r * 2 - padding * 2) / rangoLng, (r * 2 - padding * 2) / rangoLat);

    const proyectar = (p) => {
      const px = cx + ((p.lng - (minLng + maxLng) / 2) * corrLng) * escala;
      const py = cy - (p.lat - (minLat + maxLat) / 2) * escala;
      return [px, py];
    };
    const puntos = trackPoints.map(proyectar);

    ctx.shadowColor = 'rgba(192,160,96,0.8)';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#c0a060';
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    puntos.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.stroke();
    ctx.shadowBlur = 0;

    const [sx, sy] = puntos[0];
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    const [ex, ey] = puntos[puntos.length - 1];
    ctx.beginPath();
    ctx.arc(ex, ey, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#c0a060';
    ctx.fill();

    ctx.restore();
  },

  // ---------- Nivel dentro del círculo (cuando no hay ruta GPS) ----------
  _dibujarNivelEnCirculo(ctx, nivel, colorNivel, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    bg.addColorStop(0, this._hexConAlpha(colorNivel, 0.22));
    bg.addColorStop(1, this._hexConAlpha(colorNivel, 0.03));
    ctx.fillStyle = bg;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 26px "Courier New", monospace';
    ctx.fillText('NIVEL', cx, cy - 46);

    ctx.fillStyle = colorNivel;
    ctx.font = '700 170px "Courier New", monospace';
    ctx.fillText(String(nivel), cx, cy + 60);

    ctx.font = '40px sans-serif';
    ctx.fillText('🏃', cx, cy + 118);
    ctx.restore();
  },

  _hexConAlpha(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) || 192;
    const g = parseInt(h.substring(2, 4), 16) || 160;
    const b = parseInt(h.substring(4, 6), 16) || 96;
    return `rgba(${r},${g},${b},${alpha})`;
  },

  // ---------- El medallón completo: anillos + "alas" decorativas ----------
  _dibujarMedallon(ctx, datos, cx, cy, r) {
    // Contenido interior (ruta o nivel), recortado al círculo
    if (datos.trackPoints) {
      this._dibujarRutaEnCirculo(ctx, datos.trackPoints, cx, cy, r);
    } else {
      this._dibujarNivelEnCirculo(ctx, datos.nivel, datos.colorNivel, cx, cy, r);
    }

    // Doble anillo estilo medalla: fino dorado exterior + interior del
    // color del nivel del corredor
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c0a060';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = datos.colorNivel || '#c0a060';
    ctx.stroke();

    // "Alas" decorativas a ambos lados, eco del logo de RI5 (líneas de
    // velocidad), para que el medallón no parezca un simple círculo
    ctx.save();
    ctx.strokeStyle = 'rgba(192,160,96,0.55)';
    ctx.lineCap = 'round';
    [-1, 1].forEach(dir => {
      for (let i = 0; i < 3; i++) {
        const largo = 46 - i * 12;
        const y0 = cy - 18 + i * 20;
        const x0 = cx + dir * (r + 14);
        ctx.lineWidth = 4 - i;
        ctx.globalAlpha = 1 - i * 0.28;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + dir * largo, y0 - 10);
        ctx.stroke();
      }
    });
    ctx.restore();
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

      ctx.font = '700 40px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(m.value, x + chipW / 2, y + 96);

      ctx.font = '400 19px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(m.label, x + chipW / 2, y + 126);

      x += chipW + gap;
    });
    ctx.textAlign = 'left';
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
    ctx.textAlign = 'left';
  },

  // ---------- Generar el canvas completo ----------
  async _generarCanvas(datos) {
    const W = 1080, H = 1920;
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

    // Cabecera, centrada
    const logo = await this._cargarLogo();
    let y = 118;
    if (logo) ctx.drawImage(logo, cx - 36, y - 64, 72, 72);
    ctx.fillStyle = '#c0a060';
    ctx.font = '600 30px "Courier New", monospace';
    ctx.fillText('RI5 · RUNNING INTELLIGENCE', cx, y + 32);
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '400 26px "Courier New", monospace';
    ctx.fillText(`${datos.username} · ${datos.fecha}`, cx, y + 68);

    // Medallón central: ruta GPS o nivel, siempre el mismo tamaño, así la
    // composición queda igual de centrada y llena haya o no mapa
    const rMedallon = 258;
    const cyMedallon = y + 68 + 74 + rMedallon;
    this._dibujarMedallon(ctx, datos, cx, cyMedallon, rMedallon);

    // Título de la sesión + zona, centrados bajo el medallón
    y = cyMedallon + rMedallon + 72;
    ctx.fillStyle = '#c0a060';
    ctx.font = '700 46px "Courier New", monospace';
    const titulo = `${this._tipoEmoji(datos.tipo)} ${(datos.nombreSesion || datos.tipo).toUpperCase()}`;
    ctx.fillText(titulo, cx, y);
    if (datos.zona) {
      y += 42;
      ctx.font = '600 25px "Courier New", monospace';
      ctx.fillStyle = '#9BB5A0';
      ctx.fillText(datos.zona, cx, y);
    }

    // Chips de estadísticas, centrados como grupo
    y += 54;
    const metrics = [
      { emoji: '📏', label: 'DISTANCIA', value: `${(datos.distanciaKm || 0).toFixed(2)}km` },
      { emoji: '⏱️', label: 'TIEMPO', value: this._fmtTiempo(datos.duracionMs) },
      { emoji: '⚡', label: 'RITMO', value: `${this._fmtRitmo(datos.distanciaKm, datos.duracionMs)}` },
      { emoji: '🔥', label: 'CALORÍAS', value: `${(datos.calorias || 0).toLocaleString('es-ES')}` }
    ];
    this._dibujarChips(ctx, W, y, metrics);
    y += 148 + 50;

    // Separador centrado (no a sangre completa, más "diseñado")
    ctx.strokeStyle = 'rgba(192,160,96,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 160, y);
    ctx.lineTo(cx + 160, y);
    ctx.stroke();
    y += 54;

    // Nivel + zapatilla, en una línea centrada
    ctx.font = '600 27px "Courier New", monospace';
    ctx.fillStyle = datos.colorNivel || '#c0a060';
    let linea = `🎖 NIVEL ${datos.nivel}`;
    if (datos.zapatilla) linea += `   ·   👟 ${datos.zapatilla.name} (${(datos.zapatilla.km||0).toFixed(0)}km)`;
    ctx.fillText(linea, cx, y);
    y += 62;

    // Mini gráfica de los últimos 7 días, centrada
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 23px "Courier New", monospace';
    ctx.fillText('ÚLTIMOS 7 DÍAS', cx, y);
    this._dibujarGraficaSemana(ctx, datos.kmPorDia, cx, y + 18, 780, 136);
    y += 18 + 136 + 66;

    // QR + enlace: la forma real de que alguien pase de "ver la imagen" a
    // "abrir la app", ya que una imagen compartida no admite enlaces
    // pulsables. El texto de la URL sirve de respaldo para quien prefiera
    // escribirla a mano.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 24px "Courier New", monospace';
    ctx.fillText('ESCANEA Y ÚNETE GRATIS', cx, y);
    y += 26;
    const qrSize = 190;
    await this._dibujarQR(ctx, this._urlUnirse(), cx - qrSize / 2, y, qrSize);
    y += qrSize + 40;
    ctx.fillStyle = '#c0a060';
    ctx.font = '600 26px "Courier New", monospace';
    ctx.fillText(this._urlParaMostrar(), cx, y);
    y += 48;

    // Pie / reclamo, centrado
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '400 22px "Courier New", monospace';
    ctx.fillText('Entrenado con RI5 — entrena gratis con tu móvil', cx, H - 46);

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
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const modal = document.createElement('div');
    modal.style.cssText = `
      background:#0f0f0f; border-radius:20px; padding:16px; max-width:420px; width:100%;
      border:1px solid #2a2a2a; display:flex; flex-direction:column; gap:14px;
      max-height:90vh; overflow:auto; font-family:'Courier New', monospace;
    `;

    const imgDataUrl = canvas.toDataURL('image/png');
    modal.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; letter-spacing:1px; color:#c0a060; font-size:13px;">📸 RESUMEN DE LA SESIÓN</span>
        <button id="closeShareCardBtn" style="background:#c0392b; border:none; color:white; width:30px; height:30px; min-width:30px; min-height:30px; border-radius:50%; cursor:pointer; font-size:15px; line-height:1; padding:0; display:flex; align-items:center; justify-content:center; flex-shrink:0;">✕</button>
      </div>
      <img src="${imgDataUrl}" style="width:100%; border-radius:12px; display:block; border:1px solid #2a2a2a;">
      <div style="display:flex; gap:10px;">
        <button id="shareCardBtn" style="flex:1; background:#c0a060; border:none; color:#000; font-weight:700; padding:12px; border-radius:12px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">📤 Compartir</button>
        <button id="downloadCardBtn" style="flex:1; background:transparent; border:1px solid #2a2a2a; color:#ccc; font-weight:600; padding:12px; border-radius:12px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">⬇️ Guardar</button>
      </div>
      <button id="skipShareCardBtn" style="background:none; border:none; color:#888; font-size:12px; cursor:pointer; padding:4px;">Ahora no</button>
    `;

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
