// ==================== training.js - Módulo de Entrenamiento CORREGIDO ====================
// Versión: 4.1 - Añadido cálculo de zonas con Karvonen (FC reposo opcional)
// ====================

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

  _clearLocalStorage() {
    localStorage.removeItem('ri5_last_calculation');
    console.log('🗑️ Cálculo eliminado de localStorage');
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
    const fc = 220 - a; // FC máxima estimada (220 - edad)

    // Obtener FC en reposo (opcional)
    const fcReposoInput = document.getElementById('fcReposo');
    const fcReposo = fcReposoInput ? parseInt(fcReposoInput.value) : null;

    let ul; // Umbral de lactato (FC a la que se produce el umbral)
    let metodoUsado = '';

    if (fcReposo && fcReposo >= 30 && fcReposo <= 100) {
      // Usar fórmula de Karvonen: umbral = reposo + (FCmáx - reposo) * 0.88
      const fcReserva = fc - fcReposo;
      ul = Math.round(fcReposo + fcReserva * 0.88);
      metodoUsado = 'Karvonen';
      console.log(`✅ Usando Karvonen: FC reposo=${fcReposo}, FC reserva=${fcReserva}, Umbral=${ul}`);
    } else {
      // Fallback al método antiguo (92% de FC máxima)
      ul = Math.round(fc * 0.92);
      metodoUsado = 'estándar (220-edad)';
      if (fcReposoInput && fcReposoInput.value) {
        console.log(`ℹ️ FC reposo no válida (${fcReposoInput.value}), usando método estándar.`);
      } else {
        console.log('ℹ️ Usando método estándar (sin FC reposo).');
      }
    }
    // --- FIN CÁLCULO ---

    const r = t / 6; // Ritmo base en min/km para 6km
    
    const pred = [
      {dist: 2, color: "var(--accent-blue)", ritmo: r * 0.98},
      {dist: 6, color: "var(--accent-green)", ritmo: r},
      {dist: 10, color: "var(--accent-yellow)", ritmo: r * 1.05},
      {dist: 21, color: "var(--accent-red)", ritmo: r * 1.12},
      {dist: 42, color: "var(--accent-purple)", ritmo: r * 1.20}
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
    if(document.getElementById('tab-historial')?.classList.contains('active')) {
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
    const colores = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'];
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
  
  shareResults() {
    if(!AppState.lastName) { Utils.showToast("> CALCULA ZONAS PRIMERO_", 'error'); return; }
    let txt = "🏃‍♂️ MIS ZONAS DE ENTRENAMIENTO RI5 🏃‍♀️\n\n";
    txt += `👤 ${AppState.lastName} · ${AppState.lastAge} años\n`;
    txt += `❤️ FC MÁX: ${AppState.lastFC} lpm · UMBRAL: ${AppState.lastUL} lpm\n`;
    txt += `⏱️ RITMO 6km: ${Utils.formatR(AppState.lastRitmoBase)} min/km\n\n`;
    txt += `📊 PREDICCIONES:\n`;
    AppState.lastPred.forEach(p => txt += `   ${p.dist} km → ${Utils.formatR(p.ritmo)} min/km\n`);
    if (navigator.share) {
      navigator.share({ title: 'Mis zonas de entrenamiento RI5', text: txt, url: window.location.href }).catch(() => { navigator.clipboard.writeText(txt).then(() => { Utils.showToast("✅ RESULTADOS COPIADOS", 'success'); }); });
    } else {
      navigator.clipboard.writeText(txt).then(() => { Utils.showToast("✅ RESULTADOS COPIADOS", 'success'); });
    }
    Utils.vibrate(30);
  }
};

window.Training = Training;
window.startCalc = Training.startCalc.bind(Training);
window.copyResults = Training.copyResults.bind(Training);
window.shareResults = Training.shareResults.bind(Training);