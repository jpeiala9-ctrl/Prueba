// ==================== gps-track-viewer.js ====================
// Versión: 2.6 - Ciudad precargada antes de abrir el modal (sin saltos)
// ====================

const GPSTrackViewer = {
  map: null,
  leafletLoaded: false,

  async open(entry) {
    if (!entry || !entry.hasGPS || !entry.trackPoints || entry.trackPoints.length < 2) {
      Utils.showToast('Sin datos GPS disponibles', 'info');
      return;
    }

    // 1. Obtener la ciudad ANTES de mostrar el modal
    let ciudad = '—';
    try {
      const primerPunto = entry.trackPoints[0];
      if (primerPunto && primerPunto.lat && primerPunto.lng) {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${primerPunto.lat}&lon=${primerPunto.lng}&format=json&accept-language=es`;
        const res = await fetch(url, { headers: { 'User-Agent': 'RI5RunningApp/1.0' } });
        const data = await res.json();
        const address = data.address || {};
        ciudad = address.city || address.town || address.village || address.municipality || address.county || address.state || '—';
      }
    } catch (e) {
      console.warn('Error obteniendo ciudad:', e);
    }

    // 2. Crear el modal con la ciudad ya lista
    this._crearModal(entry, ciudad);

    // 3. Cargar Leaflet y el mapa (sin necesidad de volver a pedir la ciudad)
    setTimeout(() => {
      this._loadLeaflet().then(() => {
        this._initMap(entry);
      });
    }, 250);
  },

  _crearModal(entry, ciudad) {
    document.getElementById('gpsViewerModal')?.remove();
    document.getElementById('gpsViewerOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gpsViewerOverlay';
    overlay.style.cssText = `
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:rgba(0,0,0,0.85);
      backdrop-filter:blur(4px);
      z-index:60000;
      display:flex;
      align-items:center;
      justify-content:center;
      opacity:0;
      transition:opacity 0.2s ease;
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });

    const modal = document.createElement('div');
    modal.id = 'gpsViewerModal';
    modal.style.cssText = `
      background:#0f0f0f;
      border-radius:20px;
      width:90%;
      max-width:700px;
      max-height:85vh;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      box-shadow:0 20px 40px rgba(0,0,0,0.5);
      border:1px solid #2a2a2a;
      font-family:'Courier New',monospace;
      transform:scale(0.9);
      opacity:0;
      transition:transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.2s ease;
    `;

    const tipoEmoji = {
      rodaje: '🏃‍♂️',
      tempo: '⚡',
      series: '🔁',
      largo: '📏',
      strength: '💪'
    }[entry.trainingType] || '🏃';
    const nombre = (entry.trainingName || entry.trainingType || 'SESIÓN').toUpperCase();

    modal.innerHTML = `
      <div style="padding:16px 20px; background:#111; border-bottom:1px solid #2a2a2a; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:18px;">${tipoEmoji}</span>
          <span style="font-size:16px; font-weight:bold; letter-spacing:1px; margin-left:8px;">${Utils.escapeHTML(nombre)}</span>
        </div>
        <button id="closeGpsViewerBtn" style="background:#c0392b; border:none; color:white; font-size:18px; width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">✕</button>
      </div>
      <div id="gpsViewerMap" style="height:300px; background:#eaeaea;"></div>
      <div style="padding:16px 20px; background:#0d0d0d; border-top:1px solid #2a2a2a;">
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; text-align:center;">
          <div>
            <div style="font-size:22px; font-weight:bold; color:#c0a060;">${(entry.gpsDistanceKm || entry.distancia || 0).toFixed(2)}</div>
            <div style="font-size:10px; color:#666;">kilómetros</div>
          </div>
          <div>
            <div style="font-size:22px; font-weight:bold; color:#9BB5A0;">${this._fmtTime(entry.gpsDurationMs || entry.duration * 60000 || 0)}</div>
            <div style="font-size:10px; color:#666;">tiempo</div>
          </div>
          <div>
            <div style="font-size:22px; font-weight:bold; color:#aaa;">${this._fmtPace(entry)}</div>
            <div style="font-size:10px; color:#666;">min/km</div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#888; border-top:1px solid #222; padding-top:12px;">
          <span id="gpsViewerTime" style="display:inline-block; min-width:140px;">🕒 ${this._formatDate(entry.timestamp)}</span>
          <span id="gpsViewerCity" style="display:inline-block; min-width:120px; text-align:right;">📍 ${ciudad}</span>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
      modal.style.opacity = '1';
    });

    document.getElementById('closeGpsViewerBtn').addEventListener('click', () => this.close());
  },

  async _initMap(entry) {
    if (!window.L) return;
    const points = entry.trackPoints;
    if (!points || points.length < 2) return;

    const mapContainer = document.getElementById('gpsViewerMap');
    if (!mapContainer) return;

    if (this.map) {
      try { this.map.remove(); } catch(e) {}
      this.map = null;
    }

    try {
      this.map = window.L.map(mapContainer, {
        zoomControl: true,
        attributionControl: false,
        tap: false,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false
      });
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB'
      }).addTo(this.map);

      const latlngs = points.map(p => [p.lat, p.lng]);
      const polyline = window.L.polyline(latlngs, {
        color: '#c0a060',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(this.map);

      // Inicio: círculo blanco hueco
      window.L.marker(latlngs[0], {
        icon: window.L.divIcon({
          html: '<div style="width:24px;height:24px;border-radius:50%;border:3px solid #fff;background:transparent;box-shadow:0 0 0 1px rgba(0,0,0,0.2);"></div>',
          className: '', iconAnchor: [12, 12]
        })
      }).addTo(this.map);

      // Final: bandera
      window.L.marker(latlngs[latlngs.length - 1], {
        icon: window.L.divIcon({
          html: '<div style="font-size:28px; line-height:1; text-shadow:0 0 2px white;">🏁</div>',
          className: '', iconAnchor: [14, 14]
        })
      }).addTo(this.map);

      this.map.fitBounds(polyline.getBounds(), { padding: [30,30], animate: false });
    } catch(e) {
      console.warn('Error en mapa viewer:', e);
    }
  },

  // Eliminamos _mostrarCiudad porque la ciudad ya se obtuvo antes
  // También mantenemos el resto de funciones auxiliares (sin cambios)
  _fmtTime(ms) {
    if (!ms) return '00:00';
    const s = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  },

  _fmtPace(entry) {
    const dist = entry.gpsDistanceKm || entry.distancia || 0;
    const ms = entry.gpsDurationMs || (entry.duration * 60000) || 0;
    if (dist < 0.5 || ms < 1000) return '--:--';
    const paceS = (ms / 1000) / dist;
    const mm = Math.floor(paceS / 60);
    const ss = Math.floor(paceS % 60);
    return `${mm}:${String(ss).padStart(2,'0')}`;
  },

  _formatDate(timestamp) {
    if (!timestamp) return 'Fecha desconocida';
    let date;
    if (timestamp.toDate) date = timestamp.toDate();
    else date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
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

  close() {
    const modal = document.getElementById('gpsViewerModal');
    const overlay = document.getElementById('gpsViewerOverlay');
    if (modal) {
      modal.style.transform = 'scale(0.9)';
      modal.style.opacity = '0';
    }
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        modal?.remove();
        overlay?.remove();
      }, 250);
    }
    if (this.map) {
      try { this.map.remove(); } catch(e) {}
      this.map = null;
    }
  }
};

window.GPSTrackViewer = GPSTrackViewer;
console.log('✅ GPSTrackViewer v2.6 - Ciudad precargada, apertura sin saltos');