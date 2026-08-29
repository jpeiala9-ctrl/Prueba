// ==================== training.js - Módulo de Entrenamiento CORREGIDO ====================
// Versión: 4.1 - Añadido cálculo de zonas con Karvonen (FC reposo opcional)
// ====================

// Colores de zona compartidos por mostrarResultados() y _generarTarjetaImagen()
// (antes estaba el mismo array literal repetido en ambos sitios).
const ZONE_COLORS = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'];

const Training = {
  // === NUEVAS FUNCIONES PARA PERSISTENCIA LOCAL ===
  _saveToLocalStorage(calc) {
    if (!calc) return;
    try {
      localStorage.setItem('ri5_last_calculation', JSON.stringify(calc));
      console.log('✅ Cálculo guardado en localStorage');
    } catch (e) {
      console.warn('Error guardando cálculo en localStorage:', e);
    }
  },

  _loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('ri5_last_calculation');
      if (!raw) return null;
      const calc = JSON.parse(raw);
      // Validar que tenga las propiedades esenciales
      if (calc && calc.zones && calc.pred && calc.ritmoBase) {
        console.log('✅ Cálculo cargado desde localStorage');
        return calc;
      }
      return null;
    } catch (e) {
      console.warn('Error cargando cálculo desde localStorage:', e);
      return null;
    }
  },

  // === FIN NUEVAS FUNCIONES ===

  async startCalc() { 
    UI.validarTodo(); 
    if(document.getElementById("calcBtn").disabled) return; 
    
    if(!await AppState.incrementarCalculo()) return;
    
    const n = AppState.currentUser;
    const a = parseInt(document.getElementById("age").value);
    const t = Utils.parseTime(document.getElementById("time").value);
    
    if(!n || !a || isNaN(t)) { Utils.showToast("> COMPLETA TODOS LOS CAMPOS CORRECTAMENTE_", 'error'); return; }
    
    // --- CÁLCULO DE FC MÁXIMA Y UMBRAL CON FALLBACK (KARVONEN) ---
    // FC máxima estimada con la fórmula de Tanaka (208 - 0,7×edad), en vez
    // de la clásica 220-edad. Tanaka viene de un metaanálisis de más de
    // 350 estudios y reduce el error típico de ±10-12 lpm de 220-edad a
    // unos ±7 lpm. Sigue siendo una ESTIMACIÓN por edad, no una medición
    // real (lo más preciso sería una prueba de esfuerzo), pero es la
    // mejor estimación por fórmula disponible hoy.
    const fc = Math.round(208 - 0.7 * a);

    // Obtener FC en reposo (opcional)
    const fcReposoInput = document.getElementById('fcReposo');
    const fcReposo = fcReposoInput ? parseInt(fcReposoInput.value) : null;

    let ul; // Umbral de lactato (FC a la que se produce el umbral)
    let metodoUsado = '';

    if (fcReposo && fcReposo >= 30 && fcReposo <= 100) {
      // Usar fórmula de Karvonen: umbral = reposo + (FCmáx - reposo) * 0.88
      const fcReserva = fc - fcReposo;
      ul = Math.round(fcReposo + fcReserva * 0.88);
      metodoUsado = 'Karvonen (FC máx. por Tanaka)';
      console.log(`✅ Usando Karvonen: FC reposo=${fcReposo}, FC reserva=${fcReserva}, Umbral=${ul}`);
    } else {
      // Fallback: 92% de la FC máxima estimada por Tanaka
      ul = Math.round(fc * 0.92);
      metodoUsado = 'estándar (Tanaka: 208-0,7×edad)';
      if (fcReposoInput && fcReposoInput.value) {
        console.log(`ℹ️ FC reposo no válida (${fcReposoInput.value}), usando método estándar.`);
      } else {
        console.log('ℹ️ Usando método estándar (sin FC reposo).');
      }
    }
    // --- FIN CÁLCULO ---

    const r = t / 6; // Ritmo base en min/km para 6km

    // Predicciones de ritmo por distancia con la fórmula de Riegel
    // (T2 = T1 × (D2/D1)^1.06), el modelo de predicción de tiempos de
    // carrera más validado y usado en el mundo del running. Antes se
    // usaban porcentajes fijos (2%/5%/12%/20%) que sobrestimaban cuánto
    // te ralentizas en media maratón/maratón e infravaloraban cuánto
    // puedes acelerar en distancias cortas frente al ritmo de 6K.
    const riegel = (dist) => r * Math.pow(dist / 6, 0.06);

    const pred = [
      {dist: 2, color: "var(--accent-blue)", ritmo: riegel(2)},
      {dist: 6, color: "var(--accent-green)", ritmo: r},
      {dist: 10, color: "var(--accent-yellow)", ritmo: riegel(10)},
      {dist: 21, color: "var(--accent-red)", ritmo: riegel(21)},
      {dist: 42, color: "var(--accent-purple)", ritmo: riegel(42)}
    ];
    
    const zones = [
      ["Z1", "RECUPERACIÓN", 0.75, 0.80, 1.35, "z1",
        "<p><strong>🎯 Ritmo:</strong> " + Utils.formatR(r * 1.35) + " min/km</p>" +
        "<p><strong>🔹 PROPÓSITO:</strong> Recuperación activa. Ideal después de sesiones intensas.</p>" +
        "<p><strong>✅ BENEFICIOS:</strong> Mejora circulación, elimina toxinas, acelera recuperación.</p>" +
        "<p><strong>😌 SENSACIÓN:</strong> Muy cómodo. Conversación completa sin esfuerzo.</p>"
      ],
      ["Z2", "BASE", 0.80, 0.90, 1.25, "z2",
        "<p><strong>🎯 Ritmo:</strong> " + Utils.formatR(r * 1.25) + " min/km</p>" +
        "<p><strong>🔹 PROPÓSITO:</strong> Construir la base aeróbica. Es la zona más importante.</p>" +
        "<p><strong>✅ BENEFICIOS:</strong> Quema grasas, fortalece corazón, mejora capilarización.</p>" +
        "<p><strong>😌 SENSACIÓN:</strong> Cómodo y controlado. Puedes mantener una conversación.</p>"
      ],
      ["Z3", "TEMPO", 0.90, 0.95, 1.15, "z3",
        "<p><strong>🎯 Ritmo:</strong> " + Utils.formatR(r * 1.15) + " min/km</p>" +
        "<p><strong>🔹 PROPÓSITO:</strong> Mejorar la eficiencia y el umbral aeróbico.</p>" +
        "<p><strong>✅ BENEFICIOS:</strong> Eleva umbral de lactato, mejora economía de carrera.</p>" +
        "<p><strong>😌 SENSACIÓN:</strong> 'Cómodamente duro'. Solo puedes decir frases cortas.</p>"
      ],
      ["Z4", "UMBRAL", 0.95, 1.02, 1.05, "z4",
        "<p><strong>🎯 Ritmo:</strong> " + Utils.formatR(r * 1.05) + " min/km</p>" +
        "<p><strong>🔹 PROPÓSITO:</strong> Aumentar la capacidad de eliminar lactato.</p>" +
        "<p><strong>✅ BENEFICIOS:</strong> Mejora la capacidad de mantener ritmos exigentes durante más tiempo.</p>" +
        "<p><strong>😌 SENSACIÓN:</strong> Fuerte y controlado. Hablar es incómodo.</p>"
      ],
      ["Z5", "VO₂MÁX", 1.02, 1.06, 0.95, "z5",
        "<p><strong>🎯 Ritmo:</strong> " + Utils.formatR(r * 0.95) + " min/km</p>" +
        "<p><strong>🔹 PROPÓSITO:</strong> Estimular la potencia aeróbica máxima.</p>" +
        "<p><strong>✅ BENEFICIOS:</strong> Aumenta la capacidad cardíaca y el VO₂máx.</p>" +
        "<p><strong>😌 SENSACIÓN:</strong> Muy intenso. Apenas puedes hablar.</p>"
      ],
      ["Z6", "VELOCIDAD", 1.06, 1.12, 0.85, "z6",
        "<p><strong>🎯 Ritmo:</strong> < " + Utils.formatR(r * 0.85) + " min/km (más rápido)</p>" +
        "<p><strong>🔹 PROPÓSITO:</strong> Desarrollar potencia neuromuscular y velocidad.</p>" +
        "<p><strong>✅ BENEFICIOS:</strong> Mejora la zancada, coordinación y potencia explosiva.</p>" +
        "<p><strong>😌 SENSACIÓN:</strong> Esfuerzo máximo. Solo sprints cortos.</p>" +
        "<p><strong>⚠️ NOTA:</strong> Esta zona supera el umbral. No debe mantenerse más de 1-2 minutos.</p>"
      ]
    ];
    
    const calc = { name: n, age: a, fcMax: fc, ul: ul, zones: zones, pred: pred, ritmoBase: r };
    AppState.setLastCalc(calc); 
    this.mostrarResultados(calc); 
    // El footer se ha eliminado (ya no se usa)
    // document.getElementById("footer").innerText = `${n} · ${new Date().toLocaleDateString('es-ES')} · RI5`;
    await this.guardarCalculoAutomatico(calc);
    
    // === GUARDAR EN LOCALSTORAGE ===
    this._saveToLocalStorage(calc);
    
    Utils.showToast("✓ CALCULADO", 'success'); 
    Utils.vibrate(50);
    Utils.playSound('success');
    Utils.launchConfetti();
    Utils.scrollToElement('results', -20);
    AppState.actualizarBotonCalcular();
  },
  
  async guardarCalculoAutomatico(calc) {
    if(!AppState.currentUserId) return;
    if (!navigator.onLine) {
      Utils.showToast('Sin conexión. El cálculo se guardará localmente', 'warning');
      const pendientes = JSON.parse(localStorage.getItem('ri5_calculos_pendientes') || '[]');
      pendientes.push(calc);
      localStorage.setItem('ri5_calculos_pendientes', JSON.stringify(pendientes));
      return;
    }
    const ahora = new Date();
    let zonasResumen = calc.zones.map(z => { 
      if (z[0] === "Z6") {
        const min = Math.round(calc.ul * z[2]);
        return {zona: z[0], min, max: "MÁX"}; 
      } else {
        const min = Math.round(calc.ul * z[2]), max = Math.round(calc.ul * z[3]); 
        return {zona: z[0], min, max}; 
      }
    });
    const data = { 
      date: ahora.toLocaleDateString('es-ES'), 
      hora: ahora.toLocaleTimeString('es-ES'), 
      nombre: calc.name, 
      edad: calc.age, 
      fcMax: calc.fcMax, 
      umbral: calc.ul, 
      ritmo6k: Utils.formatR(calc.ritmoBase), 
      predicciones: calc.pred.map(p => `${p.dist}km:${Utils.formatR(p.ritmo)}`).join(' '), 
      resumen: `${calc.name} · ${calc.age} años · 6km: ${Utils.formatR(calc.ritmoBase)}`, 
      zonasResumen: zonasResumen 
    };
    await Storage.addHistorialEntry(AppState.currentUserId, data);
    await Storage.setUltimoCalculo(AppState.currentUserId, calc);
    if(document.getElementById('historialContent')?.classList.contains('abierto')) {
      AppState.resetHistorialPagination();
      await UI.cargarHistorialCompleto(true);
    }
    await Storage.procesarCalculosPendientes();
  },
  
  mostrarResultados(d) { 
    const results = document.getElementById("results");
    if (!results) return;
    const nombreEscapado = Utils.escapeHTML(d.name);
    let html = `<h2>MÉTRICAS</h2><div style="text-align:center; margin:20px 0;">${nombreEscapado} · ${d.age} años<br>FC MÁX: ${d.fcMax} lpm · UMBRAL: ${d.ul} lpm<br>RITMO 6km: ${Utils.formatR(d.ritmoBase)} min/km</div><h2>PREDICCIONES</h2>`; 
    
    d.pred.forEach(p => {
      html += `<div class="pred-bar" style="border-color:${p.color}; color:${p.color};">${p.dist} km → ${Utils.formatR(p.ritmo)} min/km</div>`;
    });
    
    // Separación visual
    html += `<div style="margin-bottom: 35px;"></div>`;
    
    html += `<h2>ZONAS</h2>`; 
    const colores = ZONE_COLORS;
    d.zones.forEach((z, index) => { 
      const estiloBase = 'font-size:14px;';
      if (index === 5) {
        const min = Math.round(d.ul * z[2]);
        html += `<div class="zone-card" style="border-left: 4px solid ${colores[index]};" onclick="this.classList.toggle('active')">
          <strong>${z[0]} – ${z[1]}</strong><br>
          FC: >${min} lpm (máximo)
          <div class="long">${z[6].replace(/<p>/g, `<p style="margin:12px 0;">`).replace(/<strong>/g, `<strong style="${estiloBase}">`)}</div>
        </div>`;
      } else {
        const min = Math.round(d.ul * z[2]), max = Math.round(d.ul * z[3]); 
        html += `<div class="zone-card" style="border-left: 4px solid ${colores[index]};" onclick="this.classList.toggle('active')">
          <strong>${z[0]} – ${z[1]}</strong><br>
          FC: ${min}-${max} lpm
          <div class="long">${z[6].replace(/<p>/g, `<p style="margin:12px 0;">`).replace(/<strong>/g, `<strong style="${estiloBase}">`)}</div>
        </div>`;
      }
    }); 
    html += `<button class="action-button btn-copy" onclick="window.copyResults()">📋 COPIAR</button>`;
    html += `<button class="action-button btn-share" onclick="window.shareResults()">📱 COMPARTIR</button>`;
    results.innerHTML = html; 
  },
  
  mostrarResultadosGuardados(d) { this.mostrarResultados(d); },
  
  copyResults() {
    if(!AppState.lastName) { Utils.showToast("> CALCULA ZONAS PRIMERO_", 'error'); return; }
    let txt = "🔹 RI5 - ZONAS DE ENTRENO 🔹\n\n";
    txt += `👤 ${AppState.lastName} · ${AppState.lastAge} años\n`;
    txt += `❤️ FC MÁX: ${AppState.lastFC} lpm · UMBRAL: ${AppState.lastUL} lpm\n`;
    txt += `⏱️ RITMO 6km: ${Utils.formatR(AppState.lastRitmoBase)} min/km\n\n`;
    txt += `📊 PREDICCIONES:\n`;
    AppState.lastPred.forEach(p => txt += `   ${p.dist} km → ${Utils.formatR(p.ritmo)} min/km\n`);
    txt += `\n🎯 ZONAS:\n`;
    AppState.lastZones.forEach((z, index) => { 
      if (index === 5) {
        const min = Math.round(AppState.lastUL * z[2]);
        txt += `   ${z[0]} ${z[1]}: >${min} lpm · Ritmo: < ${Utils.formatR(AppState.lastRitmoBase * z[4])} min/km\n`;
      } else {
        const min = Math.round(AppState.lastUL * z[2]), max = Math.round(AppState.lastUL * z[3]); 
        txt += `   ${z[0]} ${z[1]}: ${min}-${max} lpm · Ritmo: ${Utils.formatR(AppState.lastRitmoBase * z[4])} min/km\n`;
      }
    });
    navigator.clipboard.writeText(txt).then(() => { Utils.showToast("✅ RESULTADOS COPIADOS AL PORTAPAPELES", 'success'); }).catch(() => Utils.showToast("> NO SE PUDO COPIAR.", 'error'));
  },
  
  async shareResults() {
    if(!AppState.lastName) { Utils.showToast("> CALCULA ZONAS PRIMERO_", 'error'); return; }
    Utils.vibrate(30);
    try {
      const blob = await this._generarTarjetaImagen();
      const fileName = `ri5-zonas-${AppState.lastName.replace(/\s+/g, '_').toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mis zonas de entrenamiento RI5',
          text: `Mis zonas de entrenamiento RI5 🏃`
        });
      } else {
        // navigator.share() puede no existir, o existir pero sin soportar
        // archivos: en ambos casos se descarga la imagen como respaldo.
        this._descargarImagen(blob, fileName);
        Utils.showToast("✅ IMAGEN DESCARGADA", 'success');
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return; // el usuario canceló el share, no es un error
      console.error('Error generando/compartiendo la tarjeta:', e);
      Utils.showToast("> NO SE PUDO GENERAR LA IMAGEN_", 'error');
    }
  },

  _descargarImagen(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  // Convierte un color hex ('#rrggbb') en "r,g,b" para poder montar rgba().
  _hexToRgb(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r},${g},${b}`;
  },


  // Dibuja una tarjeta con el mismo estilo visual de la app en formato
  // "story" (9:16), pensada para compartirse de verdad como estado de
  // WhatsApp/Instagram, no solo como una captura de datos.
  //
  // Antes el tema (fondo, tarjetas, texto) estaba escrito a fuego en los
  // colores del tema oscuro, así que la imagen salía siempre negra aunque
  // el usuario tuviera el tema claro activado. Ahora se lee el tema real
  // (localStorage 'ri5_theme' / clase 'manual-light' en <body>, igual que
  // hace el resto de la app) y se dibuja con la misma paleta que ve el
  // usuario.
  async _generarTarjetaImagen() {
    const esClaro = document.body.classList.contains('manual-light');

    // Paletas calcadas de las variables CSS de index.html (:root y
    // body.manual-light), para que la tarjeta compartida sea fiel al
    // tema que el usuario tiene puesto de verdad.
    const paleta = esClaro
      ? {
          GOLD: '#a0865a', BG: '#f5f5f5', BG_CARD: '#eaeaea',
          BORDER: '#cccccc', TEXT: '#222222', TEXT_SEC: '#666666',
          gradTop: '#ffffff', gradBottom: '#e8e8e8'
        }
      : {
          GOLD: '#c0a060', BG: '#0f0f0f', BG_CARD: '#1a1a1a',
          BORDER: '#333333', TEXT: '#ffffff', TEXT_SEC: '#b0b0b0',
          gradTop: '#181818', gradBottom: '#0a0a0a'
        };
    const { GOLD, BG, BG_CARD, BORDER, TEXT, TEXT_SEC, gradTop, gradBottom } = paleta;
    const goldRgb = this._hexToRgb(GOLD);

    // Color de nivel + username del usuario actual. Si algo falla (sin
    // conexión, sin datos aún) se sigue con los valores por defecto en
    // vez de romper la generación de la tarjeta.
    let colorNivel = GOLD;
    let usernameTag = null;
    try {
      const uid = AppState.currentUserId;
      if (uid) {
        const [user, gami] = await Promise.all([
          Storage.getUser(uid),
          Storage.getGamificationData(uid)
        ]);
        const nivel = gami?.level || Number(localStorage.getItem('ri5_lastLevel')) || 1;
        colorNivel = (window.Gamification && Gamification.getColorByLevel(nivel)) || GOLD;
        if (user?.username) usernameTag = `@${user.username}`;
      }
    } catch (e) {
      console.warn('No se pudieron cargar nivel/username para la tarjeta:', e);
    }

    return new Promise((resolve, reject) => {
      try {
        const W = 1080;
        const MARGIN = 90;
        const zoneColors = ZONE_COLORS;

        // Dibuja todo el contenido que crece hacia abajo (título, datos,
        // predicciones, zonas y cartel final) y devuelve el punto Y justo
        // debajo de lo último dibujado. Con ctx = null no toca el canvas
        // -- solo recorre los mismos incrementos para MEDIR cuánto ocupa
        // el contenido antes de crear el canvas de verdad. Así el pie de
        // página nunca se coloca en una coordenada fija (H - 60) que
        // antes podía quedar solapada con el cartel "CALCULA LAS TUYAS EN
        // RI5" cuando había muchas predicciones/zonas, o con demasiado
        // hueco de sobra cuando había pocas.
        const dibujarContenido = (ctx) => {
          // Puntitos decorativos de color de zona, arriba del todo, y el
          // logo "RI5" debajo -- sin avatar, con aire limpio desde el
          // borde superior del cartel.
          const dotsY = 150;
          let y = dotsY + 90;

          if (ctx) {
            const dotSpacing = 26;
            const dotsStartX = W / 2 - (zoneColors.length - 1) * dotSpacing / 2;
            zoneColors.forEach((c, i) => {
              ctx.fillStyle = c;
              ctx.beginPath();
              ctx.arc(dotsStartX + i * dotSpacing, dotsY, 7, 0, Math.PI * 2);
              ctx.fill();
            });

            ctx.textAlign = 'center';
            ctx.fillStyle = GOLD;
            ctx.font = '700 92px Arial';
            ctx.fillText('RI5', W / 2, y);
          }
          y += 50;
          if (ctx) {
            ctx.fillStyle = TEXT_SEC;
            ctx.font = '400 30px Arial';
            ctx.fillText('MIS ZONAS DE ENTRENAMIENTO', W / 2, y);
          }
          y += 70;

          if (ctx) {
            ctx.strokeStyle = BORDER;
            ctx.beginPath(); ctx.moveTo(MARGIN, y); ctx.lineTo(W - MARGIN, y); ctx.stroke();
          }
          y += 90;

          // Nombre / edad
          if (ctx) {
            ctx.fillStyle = TEXT;
            ctx.font = '600 50px Arial';
            ctx.fillText(`${AppState.lastName} · ${AppState.lastAge} años`, W / 2, y);
          }
          if (usernameTag) {
            y += 55;
            if (ctx) {
              ctx.fillStyle = colorNivel;
              ctx.font = '600 30px Arial';
              ctx.fillText(usernameTag, W / 2, y);
            }
            y += 65;
          } else {
            y += 90;
          }

          // Fila de estadísticas (FC MÁX / UMBRAL / RITMO 6K)
          const stats = [
            { label: 'FC MÁX', value: `${AppState.lastFC}`, unit: 'lpm' },
            { label: 'UMBRAL', value: `${AppState.lastUL}`, unit: 'lpm' },
            { label: 'RITMO 6K', value: Utils.formatR(AppState.lastRitmoBase), unit: 'min/km' }
          ];
          const statW = (W - MARGIN * 2) / 3;
          if (ctx) {
            stats.forEach((s, i) => {
              const cx = MARGIN + statW * i + statW / 2;
              ctx.fillStyle = BG_CARD;
              this._roundRect(ctx, MARGIN + statW * i + 10, y, statW - 20, 150, 18);
              ctx.fill();
              ctx.strokeStyle = BORDER;
              ctx.lineWidth = 1.5;
              this._roundRect(ctx, MARGIN + statW * i + 10, y, statW - 20, 150, 18);
              ctx.stroke();

              ctx.fillStyle = GOLD;
              ctx.font = '700 46px Arial';
              ctx.fillText(s.value, cx, y + 62);
              ctx.fillStyle = TEXT_SEC;
              ctx.font = '400 22px Arial';
              ctx.fillText(s.unit, cx, y + 94);
              ctx.font = '400 20px Arial';
              ctx.fillStyle = TEXT_SEC;
              ctx.fillText(s.label, cx, y + 128);
            });
          }
          y += 150;

          // Predicciones -- más aire antes y después del título, para que
          // quede centrado en su propio hueco en vez de pegado a la caja
          // de arriba.
          y += 80;
          if (ctx) {
            ctx.textAlign = 'center';
            ctx.fillStyle = TEXT;
            ctx.font = '600 36px Arial';
            ctx.fillText('PREDICCIONES', W / 2, y);
          }
          y += 65;
          const predColors = { 2: '#3498db', 6: '#2ecc71', 10: '#f1c40f', 21: '#e74c3c', 42: '#9b59b6' };
          (AppState.lastPred || []).forEach(p => {
            if (ctx) {
              const color = predColors[p.dist] || GOLD;
              ctx.fillStyle = BG_CARD;
              this._roundRect(ctx, MARGIN, y, W - MARGIN * 2, 72, 14);
              ctx.fill();
              ctx.fillStyle = color;
              this._roundRect(ctx, MARGIN, y, 8, 72, 4);
              ctx.fill();
              ctx.fillStyle = TEXT;
              ctx.font = '500 30px Arial';
              ctx.textAlign = 'left';
              ctx.fillText(`${p.dist} km`, MARGIN + 35, y + 46);
              ctx.textAlign = 'right';
              ctx.fillStyle = color;
              ctx.font = '600 30px Arial';
              ctx.fillText(`${Utils.formatR(p.ritmo)} min/km`, W - MARGIN - 20, y + 46);
            }
            y += 84;
          });

          // Zonas -- mismo criterio de espaciado
          y += 70;
          if (ctx) {
            ctx.textAlign = 'center';
            ctx.fillStyle = TEXT;
            ctx.font = '600 36px Arial';
            ctx.fillText('ZONAS', W / 2, y);
          }
          y += 65;
          (AppState.lastZones || []).forEach((z, index) => {
            if (ctx) {
              const color = zoneColors[index];
              let rango;
              if (index === 5) {
                const min = Math.round(AppState.lastUL * z[2]);
                rango = `>${min} lpm`;
              } else {
                const min = Math.round(AppState.lastUL * z[2]), max = Math.round(AppState.lastUL * z[3]);
                rango = `${min}-${max} lpm`;
              }
              ctx.fillStyle = BG_CARD;
              this._roundRect(ctx, MARGIN, y, W - MARGIN * 2, 60, 12);
              ctx.fill();
              ctx.fillStyle = color;
              this._roundRect(ctx, MARGIN, y, 6, 60, 3);
              ctx.fill();
              ctx.fillStyle = TEXT;
              ctx.font = '600 26px Arial';
              ctx.textAlign = 'left';
              ctx.fillText(`${z[0]} · ${z[1]}`, MARGIN + 30, y + 38);
              ctx.fillStyle = TEXT_SEC;
              ctx.font = '400 24px Arial';
              ctx.textAlign = 'right';
              ctx.fillText(rango, W - MARGIN - 20, y + 38);
            }
            y += 70;
          });

          // Llamada a la acción / marca, para que funcione de verdad como
          // propaganda al compartirla, no solo como una foto de datos.
          y += 60;
          if (ctx) {
            ctx.fillStyle = `rgba(${goldRgb},0.12)`;
            this._roundRect(ctx, MARGIN, y, W - MARGIN * 2, 130, 20);
            ctx.fill();
            ctx.strokeStyle = `rgba(${goldRgb},0.35)`;
            ctx.lineWidth = 1.5;
            this._roundRect(ctx, MARGIN, y, W - MARGIN * 2, 130, 20);
            ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillStyle = GOLD;
            ctx.font = '700 32px Arial';
            ctx.fillText('🏃 CALCULA LAS TUYAS EN RI5', W / 2, y + 55);
            ctx.fillStyle = TEXT_SEC;
            ctx.font = '400 24px Arial';
            ctx.fillText('Entrena por zonas de frecuencia cardíaca', W / 2, y + 95);
          }
          y += 130;

          return y; // punto justo debajo del cartel, antes del pie
        };

        // 1) Pase de medición (sin canvas todavía) para saber la altura
        //    real del contenido.
        const finContenido = dibujarContenido(null);
        // 2) Alto del canvas = contenido + hueco fijo y generoso para el
        //    pie de página, así nunca queda ni pegado ni cortado.
        const H = finContenido + 140;

        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Fondo con degradado, como el resto de la app (con la paleta del
        // tema activo)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, gradTop);
        bgGrad.addColorStop(0.5, BG);
        bgGrad.addColorStop(1, gradBottom);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Resplandor dorado detrás de la cabecera, para que no sea un
        // simple fondo plano -- da un toque de "propaganda" de verdad.
        const glow = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 520);
        glow.addColorStop(0, `rgba(${goldRgb},0.22)`);
        glow.addColorStop(1, `rgba(${goldRgb},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, 700);

        // Marco exterior sutil
        ctx.strokeStyle = `rgba(${goldRgb},0.25)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, W - 40, H - 40);

        // 3) Pase real: dibuja todo el contenido sobre el canvas ya
        //    dimensionado a su medida.
        dibujarContenido(ctx);

        // Pie de página, colocado con un hueco fijo y limpio justo
        // debajo del cartel final -- nunca en una coordenada fija del
        // canvas que pudiera solaparse con él.
        ctx.textAlign = 'center';
        ctx.fillStyle = TEXT_SEC;
        ctx.font = '400 22px Arial';
        ctx.fillText('RI5 | Running LAB', W / 2, finContenido + 60);

        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo generar la imagen'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
};

window.Training = Training;
window.startCalc = Training.startCalc.bind(Training);
window.copyResults = Training.copyResults.bind(Training);
window.shareResults = Training.shareResults.bind(Training);
