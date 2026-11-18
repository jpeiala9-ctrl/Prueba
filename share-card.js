// ============================================================
// share-card.js - Tarjeta compartible de un entrenamiento
// ============================================================
// Versión: 1.1 - Imagen al DOBLE de resolución (2160×2700) y más contraste; el pie solo lleva «HECHO CON RI5» centrado (sin la dirección de la app);
//                «RITMO MEDIO» es el de toda la sesión; bajo la ZONA se muestra el ritmo de la PARTE PRINCIPAL (de entry.desglose).
// Versión: 1.0 - Genera una imagen (PNG 1080x1350) de un entrenamiento hecho, con el estilo de la app (gris metálico y dorado):
//                logo, nombre, fecha, tipo de sesión, la ruta dibujada si tiene GPS (sin mapa de fondo), los números
//                grandes (distancia, tiempo, ritmo, TSS, zona, energía) y el pie «Hecho con RI5» con la dirección de
//                la app. Se abre una vista previa con COMPARTIR (menú de compartir del móvil, con la imagen), GUARDAR
//                IMAGEN y un interruptor RECORRIDO para no enseñar la ruta si no se quiere (privacidad).
//                Se usa desde: detalle del último entrenamiento (Dashboard), tarjetas propias del Muro y «Mis últimos
//                entrenamientos» del Perfil. Todo se dibuja en el propio dispositivo (canvas): no sube nada a ningún servidor.
// ============================================================

const ShareCard = {
  W: 1080,
  H: 1350,
  P: 72,
  FONT: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  ESCALA: 2,   // resolución real = 2160×2700 (todo se dibuja en coordenadas de 1080×1350 y se amplía)
  ORO: '#e6c98a',
  ORO_CLARO: '#f2e4be',
  TEXTO: '#f8f7f3',
  TEXTO2: '#dadde5',

  _entradas: {},   // id -> entrada (se rellena al pintar las tarjetas del Muro y del Perfil)
  _logo: null,
  _blob: null,
  _urlBlob: null,
  _estado: null,

  // ---------- registro y apertura ----------
  registrar(id, entry) {
    if (id && entry) this._entradas[id] = entry;
  },

  abrirPorId(id) {
    const e = this._entradas[id];
    if (!e) { Utils.showToast('No se pudo preparar la tarjeta', 'error'); return; }
    this.abrir(e);
  },

  async abrir(entry) {
    if (!entry) return;
    this.cerrar();
    const tieneRuta = this._puntosRuta(entry).length >= 2;
    this._estado = { entry, mostrarRuta: tieneRuta, tieneRuta };
    const ok = await this._renderizar();
    if (!ok) { Utils.showToast('No se pudo crear la imagen', 'error'); return; }
    this._montarModal();
  },

  cerrar() {
    document.getElementById('shareCardOverlay')?.remove();
    document.getElementById('shareCardModal')?.remove();
    if (this._urlBlob) { try { URL.revokeObjectURL(this._urlBlob); } catch (e) {} }
    this._urlBlob = null;
    this._blob = null;
  },

  // ---------- modal de vista previa ----------
  _montarModal() {
    const st = this._estado;
    const overlay = document.createElement('div');
    overlay.id = 'shareCardOverlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:30000;';
    overlay.onclick = () => this.cerrar();
    const modal = document.createElement('div');
    modal.id = 'shareCardModal';
    modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-card); border:1px solid var(--border-color); border-radius:16px; padding:16px; z-index:30001; width:92%; max-width:400px; max-height:92vh; max-height:92dvh; overflow-y:auto; box-sizing:border-box; box-shadow:var(--shadow-lg);';
    modal.innerHTML = `
      <h3 style="margin:0 0 12px 0; text-align:center; color:var(--accent-blue); font-size:17px; letter-spacing:1px; font-weight:400;">COMPARTIR ENTRENAMIENTO</h3>
      <img id="shareCardImg" alt="Tarjeta del entrenamiento" src="${this._urlBlob}" style="display:block; width:100%; height:auto; border-radius:12px; border:1px solid var(--border-color);">
      ${st.tieneRuta ? `<button type="button" id="shareCardRuta" class="action-button" style="width:100%; max-width:none; margin:14px 0 0 0;"></button>
      <div style="margin-top:6px; font-size:11px; color:var(--text-secondary); text-align:center;">El recorrido se dibuja sin mapa ni calles.</div>` : ''}
      <button type="button" id="shareCardCompartir" class="action-button button-main" style="width:100%; max-width:none; margin:14px 0 0 0;">COMPARTIR</button>
      <button type="button" id="shareCardGuardar" class="action-button" style="width:100%; max-width:none; margin:10px 0 0 0;">GUARDAR IMAGEN</button>
      <button type="button" id="shareCardCerrar" class="action-button" style="width:100%; max-width:none; margin:10px 0 0 0;">CERRAR</button>`;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.getElementById('shareCardCompartir').onclick = () => this._compartir();
    document.getElementById('shareCardGuardar').onclick = () => this._guardar();
    document.getElementById('shareCardCerrar').onclick = () => this.cerrar();
    const btnRuta = document.getElementById('shareCardRuta');
    if (btnRuta) {
      const pintar = () => { btnRuta.textContent = this._estado.mostrarRuta ? 'RECORRIDO: SÍ' : 'RECORRIDO: NO'; };
      pintar();
      btnRuta.onclick = async () => {
        this._estado.mostrarRuta = !this._estado.mostrarRuta;
        pintar();
        const ok = await this._renderizar();
        if (ok) document.getElementById('shareCardImg').src = this._urlBlob;
      };
    }
  },

  // ---------- compartir / guardar ----------
  _urlApp() {
    const ruta = location.pathname.replace(/[^/]*$/, '').replace(/\/$/, '');
    return location.host + ruta;
  },

  async _compartir() {
    if (!this._blob) return;
    const archivo = new File([this._blob], 'ri5-entrenamiento.png', { type: 'image/png' });
    let url = 'https://' + this._urlApp();
    const miCodigo = (window.Referidos && Referidos._miCodigo) || '';
    if (miCodigo) url += '/?ref=' + encodeURIComponent(miCodigo);
    const texto = 'Mi entrenamiento en RI5 · Running LAB\n' + url;
    try {
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: 'RI5 · Running LAB', text: texto });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return; // el usuario cerró el menú de compartir
    }
    // Sin menú de compartir con archivos (ordenador, navegadores antiguos): se guarda la imagen.
    this._guardar();
  },

  _guardar() {
    if (!this._urlBlob) return;
    const f = this._estado && this._estado.fecha ? this._estado.fecha : new Date();
    const nombre = 'ri5-' + f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0') + '.png';
    const a = document.createElement('a');
    a.href = this._urlBlob;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    Utils.showToast('Imagen guardada', 'success');
  },

  // ---------- datos ----------
  _puntosRuta(entry) {
    if (!entry || !entry.hasGPS || !Array.isArray(entry.trackPoints)) return [];
    return entry.trackPoints.filter(p => p && isFinite(p.lat) && isFinite(p.lng));
  },

  _datos(entry) {
    const esFuerza = entry.trainingType === 'strength';
    const km = parseFloat(entry.gpsDistanceKm || entry.distancia || 0) || 0;
    const durMs = Number(entry.gpsDurationMs) || (entry.duration ? Number(entry.duration) * 60000 : 0);
    const min = durMs / 60000;
    let fecha = new Date();
    try { if (entry.timestamp) fecha = entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp); } catch (e) {}
    if (isNaN(fecha.getTime())) fecha = new Date();

    const pad = (n) => String(n).padStart(2, '0');
    let ritmo = null;
    if (!esFuerza && km > 0 && min > 0) {
      const p = min / km;
      let m = Math.floor(p), s = Math.round((p - m) * 60);
      if (s === 60) { m += 1; s = 0; }
      ritmo = m + ':' + pad(s);
    }
    let tiempo = null;
    if (min > 0) {
      if (min >= 60) tiempo = { v: Math.floor(min / 60) + ':' + pad(Math.round(min % 60) % 60), u: 'h' };
      else tiempo = { v: String(Math.max(1, Math.round(min))), u: 'min' };
    }
    const nombreBase = entry.username || 'Usuario';
    const nombre = (window.Utils && Utils.capitalizeUsername) ? Utils.capitalizeUsername(nombreBase) : nombreBase;
    const tipoCrudo = String(entry.trainingName || entry.trainingType || 'Entreno').trim();
    const tipo = ({ strength: 'Fuerza', caminar: 'Caminar' })[tipoCrudo.toLowerCase()] || tipoCrudo;
    const tss = Number(entry.tss) || 0;
    const kcal = Number(entry.calorias) || 0;
    const zona = esFuerza ? '' : String(entry.zone || '').split('-')[0].trim();

    // Ritmo de la ZONA = ritmo de la parte principal de la sesión (sin calentamiento ni enfriamiento), de entry.desglose.
    let ritmoZona = null;
    const pp = entry.desglose && entry.desglose.partePrincipal;
    if (!esFuerza && pp && Number(pp.km) > 0 && Number(pp.min) > 0) {
      const p = Number(pp.min) / Number(pp.km);
      if (isFinite(p) && p > 1 && p < 30) {
        let m = Math.floor(p), s2 = Math.round((p - m) * 60);
        if (s2 === 60) { m += 1; s2 = 0; }
        ritmoZona = m + ':' + pad(s2) + ' /km';
      }
    }

    // Números grandes: (etiqueta, valor, unidad). Primera fila: lo principal; segunda: lo complementario.
    const fila1 = [], fila2 = [];
    if (esFuerza) {
      if (tiempo) fila1.push({ l: 'TIEMPO', v: tiempo.v, u: tiempo.u });
      if (kcal > 0) fila1.push({ l: 'ENERGÍA', v: String(kcal), u: 'kcal' });
    } else {
      if (km > 0) fila1.push({ l: 'DISTANCIA', v: km.toFixed(2).replace('.', ','), u: 'km' });
      if (tiempo) fila1.push({ l: 'TIEMPO', v: tiempo.v, u: tiempo.u });
      if (ritmo) fila1.push({ l: 'RITMO MEDIO', v: ritmo, u: '/km' });
      if (tss > 0) fila2.push({ l: 'CARGA', v: String(tss), u: 'TSS' });
      if (zona) fila2.push({ l: 'ZONA', v: zona, u: '', ...(ritmoZona ? { sub: ritmoZona, cap: 'PARTE PRINCIPAL' } : {}) });
      if (kcal > 0) fila2.push({ l: 'ENERGÍA', v: String(kcal), u: 'kcal' });
    }
    if (!fila1.length && fila2.length) fila1.push(...fila2.splice(0));
    return { nombre, tipo: tipo.toUpperCase(), fecha, fila1, fila2, haySub: fila2.some(i => i.sub) };
  },

  // ---------- dibujo ----------
  _cargarLogo() {
    if (this._logo) return Promise.resolve(this._logo);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this._logo = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = 'icon-512.png';
    });
  },

  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // Texto con separación entre letras. align: left | center | right
  _t(ctx, str, x, y, o) {
    const size = o.size || 30, peso = o.weight || 400, sp = o.spacing || 0;
    ctx.save();
    ctx.font = peso + ' ' + size + 'px ' + this.FONT;
    ctx.fillStyle = o.color || this.TEXTO;
    ctx.textBaseline = 'alphabetic';
    if (o.sombra) { // sombra suave detrás de los textos grandes: separa el texto del fondo y mejora el contraste
      ctx.shadowColor = 'rgba(0,0,0,0.38)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
    }
    if (!sp) {
      ctx.textAlign = o.align || 'left';
      ctx.fillText(str, x, y);
      const w = ctx.measureText(str).width;
      ctx.restore();
      return w;
    }
    const letras = Array.from(str);
    const anchos = letras.map(c => ctx.measureText(c).width);
    const total = anchos.reduce((a, b) => a + b, 0) + sp * (letras.length - 1);
    let cx = o.align === 'center' ? x - total / 2 : (o.align === 'right' ? x - total : x);
    ctx.textAlign = 'left';
    letras.forEach((c, i) => { ctx.fillText(c, cx, y); cx += anchos[i] + sp; });
    ctx.restore();
    return total;
  },

  _anchoTexto(ctx, str, size, peso, sp) {
    ctx.font = peso + ' ' + size + 'px ' + this.FONT;
    const letras = Array.from(str);
    return letras.reduce((a, c) => a + ctx.measureText(c).width, 0) + (sp || 0) * Math.max(0, letras.length - 1);
  },

  // Valor grande + unidad pequeña, centrados en cx. Reduce el tamaño si no cabe en la columna.
  _valorUnidad(ctx, valor, unidad, cx, base, size, colW) {
    let s = size;
    const hueco = unidad ? 12 : 0;
    const medir = (t) => this._anchoTexto(ctx, valor, t, 600, 0) + (unidad ? hueco + this._anchoTexto(ctx, unidad, Math.round(t * 0.36), 400, 0) : 0);
    while (s > 40 && medir(s) > colW - 24) s -= 4;
    const total = medir(s);
    const x0 = cx - total / 2;
    const wv = this._t(ctx, valor, x0, base, { size: s, weight: 600, color: this.TEXTO, sombra: true });
    if (unidad) this._t(ctx, unidad, x0 + wv + hueco, base, { size: Math.round(s * 0.36), weight: 500, color: this.TEXTO2 });
  },

  _dibujarFila(ctx, items, yEtiqueta, size) {
    if (!items.length) return;
    const P = this.P, ancho = this.W - 2 * P;
    const n = items.length;
    const colW = ancho / n;
    items.forEach((it, i) => {
      const cx = P + colW * (i + 0.5);
      this._t(ctx, it.l, cx, yEtiqueta, { size: 26, weight: 600, color: this.TEXTO2, spacing: 4, align: 'center' });
      const base = yEtiqueta + Math.round(size * 0.98);
      this._valorUnidad(ctx, it.v, it.u, cx, base, size, colW);
      // Línea pequeña bajo el valor (p. ej. el ritmo de la zona bajo «Z1»)
      if (it.sub) {
        const ySub = base + Math.round(size * 0.46);
        this._t(ctx, it.sub, cx, ySub, { size: Math.round(size * 0.36), weight: 600, color: this.ORO_CLARO, align: 'center', sombra: true });
        if (it.cap) this._t(ctx, it.cap, cx, ySub + 34, { size: 22, weight: 600, color: this.TEXTO2, spacing: 3, align: 'center' });
      }
    });
  },

  _dibujarRuta(ctx, puntos, x, y, w, h) {
    // Panel
    ctx.save();
    this._rr(ctx, x, y, w, h, 34);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.stroke();
    ctx.clip();
    // Cuadrícula muy tenue
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let gx = x + 60; gx < x + w; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
    for (let gy = y + 60; gy < y + h; gy += 60) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }

    // Proyección (la longitud se corrige con el coseno de la latitud para no deformar la forma)
    const paso = Math.max(1, Math.floor(puntos.length / 700));
    const pts = puntos.filter((_, i) => i % paso === 0 || i === puntos.length - 1);
    const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const rx = (maxLng - minLng) * kx || 0.00001, ry = (maxLat - minLat) || 0.00001;
    const pad = 64;
    const escala = Math.min((w - 2 * pad) / rx, (h - 2 * pad) / ry);
    const ox = x + (w - rx * escala) / 2, oy = y + (h - ry * escala) / 2;
    const proy = (p) => [ox + (p.lng - minLng) * kx * escala, oy + (maxLat - p.lat) * escala];

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Resplandor + trazo dorado
    ctx.shadowColor = 'rgba(217,189,128,0.55)';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = this.ORO;
    ctx.lineWidth = 10;
    ctx.beginPath();
    pts.forEach((p, i) => { const [px, py] = proy(p); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f3e7c6';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // Salida (aro) y meta (punto)
    const [sx, sy] = proy(pts[0]);
    const [ex, ey] = proy(pts[pts.length - 1]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = this.ORO;
    ctx.beginPath(); ctx.arc(ex, ey, 17, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3a3c43';
    ctx.beginPath(); ctx.arc(ex, ey, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  },

  async _dibujar() {
    const { entry, mostrarRuta } = this._estado;
    const d = this._datos(entry);
    this._estado.fecha = d.fecha;
    const W = this.W, H = this.H, P = this.P;
    const c = document.createElement('canvas');
    const E = this.ESCALA || 1;
    c.width = W * E; c.height = H * E;
    const ctx = c.getContext('2d');
    ctx.scale(E, E);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const logo = await this._cargarLogo();

    // Fondo metálico con el rayado vertical fino de la app
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#5d606a'); g.addColorStop(0.5, '#454851'); g.addColorStop(1, '#2f3137');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.018)';
    for (let x = 0; x < W; x += 4) ctx.fillRect(x, 0, 1, H);
    // Marca de agua con el logo cuando no hay ruta
    const ruta = mostrarRuta ? this._puntosRuta(entry) : [];
    const conRuta = ruta.length >= 2;
    if (!conRuta && logo) {
      ctx.save(); ctx.globalAlpha = 0.05;
      ctx.drawImage(logo, W / 2 - 320, 835 - 320, 640, 640);
      ctx.restore();
    }
    // Filete dorado
    this._rr(ctx, 20, 20, W - 40, H - 40, 46);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(230,201,138,0.65)';
    ctx.stroke();

    // Cabecera: logo, marca y fecha
    if (logo) {
      ctx.save();
      this._rr(ctx, P, P, 112, 112, 26);
      ctx.clip();
      ctx.drawImage(logo, P, P, 112, 112);
      ctx.restore();
      this._rr(ctx, P, P, 112, 112, 26);
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(217,189,128,0.6)'; ctx.stroke();
    }
    const xt = P + (logo ? 112 + 30 : 0);
    this._t(ctx, 'RI5 · RUNNING LAB', xt, P + 50, { size: 34, weight: 500, color: this.ORO, spacing: 5 });
    const fechaTxt = d.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    this._t(ctx, fechaTxt, xt, P + 100, { size: 27, weight: 400, color: this.TEXTO2, spacing: 3 });
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(P, P + 112 + 36, W - 2 * P, 2);

    // Nombre y tipo de sesión
    this._t(ctx, d.nombre, P, 318, { size: 44, weight: 500, color: '#e8eaef', spacing: 1, sombra: true });
    let tam = 76;
    while (tam > 48 && this._anchoTexto(ctx, d.tipo, tam, 600, 4) > W - 2 * P) tam -= 4;
    let tipoTxt = d.tipo;
    while (tipoTxt.length > 3 && this._anchoTexto(ctx, tipoTxt, tam, 600, 4) > W - 2 * P) {
      tipoTxt = tipoTxt.slice(0, -2).trimEnd() + '\u2026'; // nombre muy largo: se recorta con puntos suspensivos
    }
    this._t(ctx, tipoTxt, P, 318 + 20 + tam, { size: tam, weight: 600, color: this.ORO_CLARO, spacing: 4, sombra: true });

    // Ruta + números
    if (conRuta) {
      this._dibujarRuta(ctx, ruta, P, 450, W - 2 * P, 390);
      this._dibujarFila(ctx, d.fila1, 905, 88);
      this._dibujarFila(ctx, d.fila2, 1045, 88);
    } else {
      // Sin ruta: el bloque de números se centra en el hueco entre el título y el pie
      const filas = d.fila2.length ? 2 : 1;
      const alto = (filas === 2 ? 340 : 140) + (d.haySub ? 80 : 0);
      const y0 = 835 - alto / 2 + 24;
      this._dibujarFila(ctx, d.fila1, y0, 118);
      this._dibujarFila(ctx, d.fila2, y0 + 225, 118);
    }

    // Pie
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(P, H - 118, W - 2 * P, 2);
    this._t(ctx, 'HECHO CON RI5', W / 2, H - 62, { size: 36, weight: 600, color: this.ORO, spacing: 6, align: 'center' });
    return c;
  },

  async _renderizar() {
    try {
      const canvas = await this._dibujar();
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) return false;
      if (this._urlBlob) { try { URL.revokeObjectURL(this._urlBlob); } catch (e) {} }
      this._blob = blob;
      this._urlBlob = URL.createObjectURL(blob);
      return true;
    } catch (e) {
      console.warn('ShareCard: no se pudo dibujar la tarjeta', e);
      return false;
    }
  }
};

window.ShareCard = ShareCard;
