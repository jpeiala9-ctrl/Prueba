// ==================== session-invites.js ====================
// Módulo "Generar sesión" del panel de administración.
//
// Permite a un admin crear una sesión de entrenamiento completa
// (misma info que el modal de detalle de sesión del calendario, sin
// GPS/marcar/feedback), elegir un día del calendario y enviársela a
// los usuarios que quiera. El usuario la recibe como un modal de
// aceptar/rechazar; si acepta, se sobreescribe la sesión de ese día
// en su plan actual.
//
// Colección Firestore: sessionInvites/{inviteId}
//   { fromUid, fromUsername, toUid, toUsername, status,
//     fecha: 'YYYY-MM-DD', sesion: {tipo, duracion, detalle{...}},
//     createdAt }
// ====================

const SessionInvites = {
  unsubscribe: null,
  _shownIds: new Set(),
  _colaPendientes: [],
  _modalInviteAbierto: false,
  _dashboardCargado: false,

  _editable: null,
  _mesCalendario: null,
  _fechaSeleccionada: null,
  _usuariosTodos: null,
  _usuariosSeleccionados: null,

  // Mismas zonas que training.js (Z1..Z6): [código, etiqueta, factorPace]
  // factorPace es el mismo multiplicador que usa obtenerRitmoParaZona()
  // en calendar.js (ritmoBase × factorPace = ritmo objetivo de esa zona).
  _ZONAS: [
    { codigo: 'Z1', etiqueta: 'RECUPERACIÓN', factorPace: 1.35 },
    { codigo: 'Z2', etiqueta: 'BASE', factorPace: 1.25 },
    { codigo: 'Z3', etiqueta: 'TEMPO', factorPace: 1.15 },
    { codigo: 'Z4', etiqueta: 'UMBRAL', factorPace: 1.05 },
    { codigo: 'Z5', etiqueta: 'VO₂MÁX', factorPace: 0.95 },
    { codigo: 'Z6', etiqueta: 'VELOCIDAD', factorPace: 0.85 }
  ],

  _zonaInfo(codigo) {
    return this._ZONAS.find(z => z.codigo === codigo) || this._ZONAS[1];
  },

  // Misma fórmula de TSS que calcularMetricasSesion() en calendar.js
  // (duración en minutos × factor de intensidad de la zona al cuadrado).
  // No depende del usuario, solo de la duración y la zona elegidas por
  // el admin, así que se calcula una vez y es igual para todos.
  _calcularTSS(duracionMin, zonaCodigo) {
    const factoresIF = { Z1: 0.6, Z2: 0.7, Z3: 0.85, Z4: 0.95, Z5: 1.05, Z6: 1.15 };
    const ifactor = factoresIF[zonaCodigo] || 0.8;
    return Math.round((duracionMin || 0) * ifactor * ifactor);
  },

  // BUG CORREGIDO: antes esto dependía SOLO de Storage.getUltimoCalculo(),
  // que lee el cálculo desde Firestore (users/{uid}/calculos/{id}). Ese
  // documento se guarda con `zones` como un array de arrays, y Cloud
  // Firestore NO permite arrays anidados dentro de un array -- el guardado
  // fallaba en silencio (solo un console.error) y por eso `ultimoCalculoId`
  // nunca llegaba a fijarse: para CUALQUIER usuario, aunque sí tuviera sus
  // zonas calculadas, esta consulta devolvía null. Por eso salía "no
  // tienes zonas calculadas" siendo falso.
  //
  // La fuente fiable es AppState.lastZones / AppState.lastRitmoBase: se
  // cargan en memoria al abrir la app (desde localStorage) o justo al
  // calcular, y es exactamente lo que usa el resto de la app (p. ej.
  // obtenerRitmoParaZona en calendar.js) para pintar el ritmo de cada
  // zona. Se usa como fuente principal; Storage.getUltimoCalculo() queda
  // solo como último recurso por si acaso.
  async _obtenerCalculoDestinatario(uid) {
    if (uid === AppState.currentUserId && window.AppState && Array.isArray(AppState.lastZones) && AppState.lastZones.length && AppState.lastRitmoBase) {
      return { zones: AppState.lastZones, ritmoBase: AppState.lastRitmoBase };
    }
    try {
      if (window.Storage && typeof Storage.getUltimoCalculo === 'function') {
        const calc = await Storage.getUltimoCalculo(uid);
        if (calc && Array.isArray(calc.zones) && calc.zones.length && calc.ritmoBase) return calc;
      }
    } catch (e) {
      console.warn('Error obteniendo el cálculo de zonas del destinatario:', e);
    }
    return null;
  },

  async _obtenerPesoUsuario(uid) {
    try {
      const doc = await firebaseServices.db.collection('users').doc(uid).get();
      return doc.exists ? (doc.data()?.profile?.weight || null) : null;
    } catch (e) {
      console.warn('Error obteniendo el peso del destinatario:', e);
      return null;
    }
  },

  // Calcula TODO lo que depende del usuario a partir de lo único que fija
  // el admin (tipo + zona + PARTE PRINCIPAL, definida por distancia O por
  // tiempo + minutos de calentamiento/enfriamiento): ritmo objetivo (según
  // su ritmo base real), lo que falte de la parte principal (si el admin
  // puso tiempo, se calcula la distancia; si puso distancia, se calcula
  // el tiempo), tiempo total de la sesión (calentamiento + parte
  // principal + enfriamiento), TSS y calorías. Devuelve también
  // calentamiento/partePrincipal/enfriamiento en minutos con los mismos
  // nombres de campo que espera gps-tracker.js (_buildSteps), para que al
  // hacer la sesión con GPS marque esos tramos automáticamente. Si al
  // usuario le faltan datos (zonas sin calcular / peso sin rellenar en el
  // perfil), esos campos quedan a null.
  //
  // parteInput = { modo: 'distancia'|'tiempo', valor: number }
  //   modo 'distancia': valor son los km de la parte principal (se
  //     calcula el tiempo que le lleva a SU ritmo en la zona elegida).
  //   modo 'tiempo': valor son los minutos de la parte principal (se
  //     calcula la distancia que cubre a SU ritmo en la zona elegida) --
  //     así, la misma sesión enviada a corredores con paces distintos
  //     entrena a todos el mismo TIEMPO en esa intensidad, en vez de
  //     obligar al más lento a tardar mucho más que al rápido en cubrir
  //     unos km fijos.
  //
  // El calentamiento y el enfriamiento, en cambio, siempre se definen en
  // minutos (se corren en Z1/recuperación, no en la zona de la parte
  // principal): esos minutos se convierten a km con el ritmo de Z1 real
  // de cada usuario, y esos km se SUMAN a la parte principal para dar la
  // distancia TOTAL real de la sesión (p.ej. 8 km de parte principal + 2
  // km de calentamiento a 5:00/km en 10' + 1 km de enfriamiento a
  // 5:00/km en 5' = 11 km en total).
  _calcularPersonalizacion(zonaCodigo, parteInput, calculo, peso, calentamientoMin = 0, enfriamientoMin = 0) {
    const resultado = {
      ritmoStr: null, duracionMin: null, tss: null, calorias: null,
      calentamiento: calentamientoMin, partePrincipal: null, enfriamiento: enfriamientoMin,
      distanciaPartePrincipal: null, distanciaCalentamientoKm: null, distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };
    if (calculo && Array.isArray(calculo.zones) && calculo.zones.length && calculo.ritmoBase) {
      const zona = calculo.zones.find(z => z[0] === zonaCodigo);
      if (zona) {
        const paceDecimal = calculo.ritmoBase * zona[4]; // minutos/km, en decimal
        resultado.ritmoStr = Utils.formatR(paceDecimal);

        if (parteInput.modo === 'tiempo') {
          resultado.partePrincipal = Math.max(1, Math.round(parteInput.valor || 0));
          resultado.distanciaPartePrincipal = paceDecimal > 0 ? (resultado.partePrincipal / paceDecimal) : 0;
        } else {
          resultado.distanciaPartePrincipal = parteInput.valor || 0;
          resultado.partePrincipal = Math.max(1, Math.round(resultado.distanciaPartePrincipal * paceDecimal));
        }

        // Calentamiento y enfriamiento van a ritmo de Z1 (recuperación)
        // del propio usuario, no al ritmo de la zona de la parte
        // principal. Si por lo que sea no tiene Z1 en sus zonas, se usa
        // la zona de la parte principal como respaldo (mejor eso que
        // dividir por cero o dejarlo sin calcular).
        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4]; // min/km
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;

        resultado.duracionMin = resultado.partePrincipal + calentamientoMin + enfriamientoMin;
        resultado.tss = this._calcularTSS(resultado.duracionMin, zonaCodigo);
      }
    }
    // Las calorías se calculan sobre la distancia TOTAL (incluyendo
    // calentamiento y enfriamiento) siempre que se haya podido calcular;
    // si no hay zonas disponibles pero el admin fijó km directamente
    // (modo 'distancia'), como respaldo se usan esos km para no dejar
    // las calorías a 0. En modo 'tiempo' sin zonas no hay forma de saber
    // los km, así que las calorías se quedan sin calcular.
    if (peso) {
      const distanciaParaCalorias = resultado.distanciaTotal !== null
        ? resultado.distanciaTotal
        : (parteInput.modo === 'distancia' ? parteInput.valor : 0);
      if (distanciaParaCalorias) resultado.calorias = Math.round(peso * distanciaParaCalorias);
    }
    return resultado;
  },

  // ==================================================================
  //  ADMIN: GENERADOR DE SESIÓN (paso 1: tarjeta editable)
  // ==================================================================

  abrirGenerador() {
    this._editable = {
      tipo: 'rodaje',
      detalle: {
        nombre: '',
        objetivo: '',
        porque: '',
        sensacion: '',
        // Todo lo demás (ritmo, duración/tiempo, TSS, calorías) se
        // calcula SOLO para cada usuario en el momento en que le llega
        // la sesión, a partir de esta distancia/tiempo + su ritmo base +
        // su peso -- no se guarda un valor fijo aquí.
        //
        // La parte principal se puede definir por distancia (km) o por
        // tiempo (minutos) -- ver modoPartePrincipal. Solo el campo que
        // corresponda al modo activo se usa de verdad; el otro se ignora.
        modoPartePrincipal: 'distancia',
        distanciaEstimada: 5,
        duracionPartePrincipalMin: 30,
        zona: 'Z2',
        pasosDetallados: [
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
          { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '' },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
        ]
      }
    };
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechaSeleccionada = null;
    this._usuariosSeleccionados = new Set();
    this._renderPaso1();
  },

  _tipoEmoji(tipo) {
    return { rodaje: '🏃‍♂️', tempo: '⚡', series: '🔁', largo: '📏', strength: '💪', descanso: '😴' }[tipo] || '🏃';
  },

  _crearOverlayModal(id) {
    // Si ya existe (venimos de otro paso del mismo asistente), se
    // reutiliza en vez de destruirlo y recrearlo: eso era lo que
    // provocaba el parpadeo al pulsar "Continuar" (el overlay entero
    // desaparecía y volvía a aparecer con fundido en cada paso).
    const existente = document.getElementById(id + 'Overlay');
    const modalExistente = document.getElementById(id + 'Modal');
    if (existente && modalExistente) {
      return { overlay: existente, modal: modalExistente };
    }
    document.getElementById(id + 'Modal')?.remove();
    document.getElementById(id + 'Overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = id + 'Overlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      z-index:60000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = id + 'Modal';
    modal.style.cssText = `
      background:var(--bg-secondary); border-radius:20px;
      width:92%; max-width:700px; max-height:88vh;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:0 20px 40px rgba(0,0,0,0.5);
      border:1px solid var(--border-color);
      font-family:'Courier New',monospace;
      opacity:0; transition:opacity 0.2s ease;
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });
    return { overlay, modal };
  },

  _cerrarModal(id) {
    const modal = document.getElementById(id + 'Modal');
    const overlay = document.getElementById(id + 'Overlay');
    if (modal) modal.style.opacity = '0';
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
  },

  // BUG CORREGIDO: al pulsar "Continuar"/"Atrás" entre los 3 pasos del
  // asistente, el overlay ya se reutilizaba (ver _crearOverlayModal),
  // pero el contenido se reemplazaba de golpe con innerHTML. Como el
  // overlay centra el modal verticalmente (align-items:center) y cada
  // paso tiene una altura muy distinta (paso 1 es un formulario largo,
  // paso 2 es un calendario corto, paso 3 es una lista de usuarios), al
  // cambiar el contenido en el mismo instante el cuadro se recolocaba de
  // golpe en su nueva posición vertical -- eso es lo que se veía como un
  // "salto" o como si un modal desapareciera y otro apareciera rápido
  // encima. Ahora se desvanece el modal, se cambia el contenido (y con
  // él su altura/posición) mientras está invisible, y se vuelve a
  // desvanecer hacia dentro ya asentado en su sitio definitivo.
  _transicionarPaso(renderFn) {
    const modal = document.getElementById('sessGenModal');
    if (!modal) { renderFn(); return; }
    modal.style.opacity = '0';
    setTimeout(() => {
      renderFn();
      requestAnimationFrame(() => {
        const modalNuevo = document.getElementById('sessGenModal');
        if (modalNuevo) modalNuevo.style.opacity = '1';
      });
    }, 180);
  },

  _renderPaso1() {
    const { modal } = this._crearOverlayModal('sessGen');
    const d = this._editable.detalle;
    const pasosHTML = d.pasosDetallados.map((p, i) => {
      const tit = (p.titulo || '').toUpperCase();
      const esExtremo = tit.includes('CALENTAMIENTO') || tit.includes('ENFRIAMIENTO');
      return `
      <div class="sessgen-paso" data-idx="${i}" style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
          <input class="sg-paso-icono" data-idx="${i}" value="${Utils.escapeHTML(p.icono || '')}" style="width:44px; text-align:center; padding:8px 4px;" maxlength="4">
          <input class="sg-paso-titulo" data-idx="${i}" value="${Utils.escapeHTML(p.titulo || '')}" placeholder="TÍTULO DEL PASO" style="flex:1; text-align:center;">
          ${esExtremo ? `<input class="sg-paso-min" data-idx="${i}" type="number" min="0" value="${p.duracionMin || ''}" placeholder="min" title="Minutos" style="width:56px; text-align:center; padding:8px 2px;">` : ''}
          <button onclick="SessionInvites._quitarPaso(${i})" style="background:transparent; border:1px solid var(--border-color); color:var(--text-secondary); border-radius:8px; width:36px; height:38px; cursor:pointer; flex-shrink:0;">✕</button>
        </div>
        <input class="sg-paso-accion" data-idx="${i}" value="${Utils.escapeHTML(p.accion || '')}" placeholder="Qué hay que hacer" style="width:100%; margin-bottom:6px; text-align:center;">
        <input class="sg-paso-porque" data-idx="${i}" value="${Utils.escapeHTML(p.porque || '')}" placeholder="Por qué (opcional)" style="width:100%; text-align:center;">
      </div>
    `;
    }).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(this._editable.tipo)} NUEVA SESIÓN · PASO 1/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">TIPO DE SESIÓN</label>
        <select id="sgTipo" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
          <option value="rodaje">🏃‍♂️ Rodaje</option>
          <option value="tempo">⚡ Tempo</option>
          <option value="series">🔁 Series</option>
          <option value="largo">📏 Tirada larga</option>
          <option value="strength">💪 Fuerza</option>
          <option value="descanso">😴 Descanso</option>
        </select>

        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">NOMBRE DE LA SESIÓN</label>
        <input id="sgNombre" placeholder="Ej: Rodaje aeróbico suave" style="width:100%; margin-bottom:10px; text-align:center;">

        <div id="sgParteWrap">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">CÓMO DEFINES LA PARTE PRINCIPAL</label>
          <select id="sgModoParte" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            <option value="distancia">📏 Por distancia (km)</option>
            <option value="tiempo">⏱️ Por tiempo (minutos)</option>
          </select>

          <div id="sgDistanciaWrap">
            <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">DISTANCIA DE LA PARTE PRINCIPAL (km)</label>
            <input id="sgDistancia" type="number" step="0.1" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>
          <div id="sgTiempoWrap" style="display:none;">
            <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">DURACIÓN DE LA PARTE PRINCIPAL (min)</label>
            <input id="sgDuracionParte" type="number" step="1" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>

          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">ZONA DE ENTRENAMIENTO (parte principal)</label>
          <select id="sgZona" style="width:100%; margin-bottom:6px; text-align:center; text-align-last:center;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}">${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>
          <p id="sgInfoModoParte" style="font-size:11px; color:var(--text-secondary); text-align:center; margin:0 0 10px; line-height:1.4;"></p>
        </div>

        <div id="sgDescansoInfo" style="display:none; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:12px; text-align:center; margin-bottom:10px; font-size:12px; color:var(--text-secondary);">
          😴 Día de descanso: sin distancia, ritmo ni TSS. Solo se envía el nombre y, si quieres, alguna nota
          (por ejemplo, sobre estiramientos, hidratación o cómo recuperar bien).
        </div>

        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">SENSACIÓN (opcional)</label>
        <input id="sgSensacion" placeholder="Ej: Cómoda, controlada" style="width:100%; margin-bottom:10px; text-align:center;">

        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">🎯 OBJETIVO PRINCIPAL</label>
        <textarea id="sgObjetivo" style="width:100%; min-height:50px; margin-bottom:10px; text-align:center;"></textarea>

        <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">POR QUÉ</label>
        <textarea id="sgPorque" style="width:100%; min-height:50px; margin-bottom:16px; text-align:center;"></textarea>

        <div id="sgPasosWrap">
          <label style="display:block; text-align:center; font-size:11px; color:var(--text-secondary);">ESTRUCTURA DE LA SESIÓN (pasos)</label>
          <p style="font-size:10px; color:var(--text-secondary); text-align:center; margin:2px 0 8px; line-height:1.4;">
            Pon los minutos de CALENTAMIENTO y ENFRIAMIENTO: así, al hacer la sesión con GPS,
            la app marca esos tramos automáticamente igual que en el resto de sesiones.
          </p>
          <div id="sgPasosContainer" style="margin-top:8px;">${pasosHTML}</div>
          <button onclick="SessionInvites._anadirPaso()" style="width:100%; padding:10px; background:transparent; border:1px dashed var(--border-color-light); color:var(--text-secondary); border-radius:10px; cursor:pointer; margin-top:4px;">➕ AÑADIR PASO</button>
        </div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessGen')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgContinuarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">CONTINUAR →</button>
      </div>
    `;

    // Rellenar campos con lo que ya hubiera en this._editable (por si se
    // vuelve del paso 2/3 hacia atrás)
    document.getElementById('sgTipo').value = this._editable.tipo;
    document.getElementById('sgNombre').value = d.nombre || '';
    document.getElementById('sgModoParte').value = d.modoPartePrincipal || 'distancia';
    document.getElementById('sgDistancia').value = d.distanciaEstimada || '';
    document.getElementById('sgDuracionParte').value = d.duracionPartePrincipalMin || '';
    document.getElementById('sgZona').value = d.zona || 'Z2';
    document.getElementById('sgSensacion').value = d.sensacion || '';
    document.getElementById('sgObjetivo').value = d.objetivo || '';
    document.getElementById('sgPorque').value = d.porque || '';

    this._actualizarModoParte();
    this._actualizarVisibilidadPorTipo();
    document.getElementById('sgModoParte').addEventListener('change', () => this._actualizarModoParte());
    document.getElementById('sgTipo').addEventListener('change', () => this._actualizarVisibilidadPorTipo());

    document.getElementById('sgContinuarBtn').addEventListener('click', () => {
      this._leerPaso1();
      if (!this._editable.detalle.nombre.trim()) {
        Utils.showToast('Ponle un nombre a la sesión', 'warning');
        return;
      }
      if (this._editable.tipo !== 'descanso') {
        const modo = this._editable.detalle.modoPartePrincipal;
        if (modo === 'distancia' && !(this._editable.detalle.distanciaEstimada > 0)) {
          Utils.showToast('Pon la distancia de la parte principal', 'warning');
          return;
        }
        if (modo === 'tiempo' && !(this._editable.detalle.duracionPartePrincipalMin > 0)) {
          Utils.showToast('Pon la duración de la parte principal', 'warning');
          return;
        }
      }
      this._transicionarPaso(() => this._renderPaso2Calendario());
    });
  },

  // Muestra/oculta la parte principal, la zona y la estructura de pasos
  // según si el tipo elegido es "descanso" o una sesión de verdad. Un
  // día de descanso no tiene distancia, ritmo, TSS ni tramos que marcar
  // con GPS, así que esos bloques del formulario no tienen sentido y se
  // ocultan (los valores que pudieran tener no se usan al leer el paso).
  _actualizarVisibilidadPorTipo() {
    const tipo = document.getElementById('sgTipo')?.value;
    const esDescanso = tipo === 'descanso';
    const parteWrap = document.getElementById('sgParteWrap');
    const pasosWrap = document.getElementById('sgPasosWrap');
    const descansoInfo = document.getElementById('sgDescansoInfo');
    if (parteWrap) parteWrap.style.display = esDescanso ? 'none' : 'block';
    if (pasosWrap) pasosWrap.style.display = esDescanso ? 'none' : 'block';
    if (descansoInfo) descansoInfo.style.display = esDescanso ? 'block' : 'none';
    // Si el nombre está vacío (sesión nueva o venía de otro tipo sin
    // tocar el nombre), se sugiere "Descanso" para no dejarlo en blanco
    // -- pero nunca se pisa un nombre que el admin ya haya escrito.
    const nombreInput = document.getElementById('sgNombre');
    if (esDescanso && nombreInput && !nombreInput.value.trim()) nombreInput.value = 'Descanso';
  },

  // Muestra el campo de km o el de minutos según el modo elegido para la
  // parte principal, y actualiza el texto informativo de debajo.
  _actualizarModoParte() {
    const modo = document.getElementById('sgModoParte')?.value || 'distancia';
    const distWrap = document.getElementById('sgDistanciaWrap');
    const tiempoWrap = document.getElementById('sgTiempoWrap');
    const info = document.getElementById('sgInfoModoParte');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (tiempoWrap) tiempoWrap.style.display = modo === 'tiempo' ? 'block' : 'none';
    if (info) {
      info.innerHTML = modo === 'distancia'
        ? 'ℹ️ Esta distancia es SOLO la parte principal. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se convierten a km con el ritmo de Z1 de cada usuario, sumándose a la distancia y al tiempo total de la sesión.'
        : 'ℹ️ Esta duración es SOLO la parte principal, en la zona elegida: la distancia que cubre en ese tiempo se calcula sola, según el ritmo real de cada usuario en esa zona -- así todos entrenan el mismo tiempo a esa intensidad, no la misma distancia. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se suman aparte, en tiempo y en km.';
    }
  },

  _anadirPaso() {
    this._leerPasosDelDOM();
    this._editable.detalle.pasosDetallados.push({ icono: '📌', titulo: '', accion: '', porque: '' });
    this._renderPaso1();
  },

  _quitarPaso(idx) {
    this._leerPasosDelDOM();
    this._editable.detalle.pasosDetallados.splice(idx, 1);
    this._renderPaso1();
  },

  _leerPasosDelDOM() {
    const filas = document.querySelectorAll('#sgPasosContainer .sessgen-paso');
    const pasos = [];
    filas.forEach(fila => {
      const minInput = fila.querySelector('.sg-paso-min');
      pasos.push({
        icono: fila.querySelector('.sg-paso-icono')?.value || '📌',
        titulo: fila.querySelector('.sg-paso-titulo')?.value || '',
        accion: fila.querySelector('.sg-paso-accion')?.value || '',
        porque: fila.querySelector('.sg-paso-porque')?.value || '',
        duracionMin: minInput ? (parseInt(minInput.value) || 0) : undefined
      });
    });
    if (filas.length > 0) this._editable.detalle.pasosDetallados = pasos;
  },

  _leerPaso1() {
    this._editable.tipo = document.getElementById('sgTipo').value;
    const d = this._editable.detalle;
    d.nombre = document.getElementById('sgNombre').value.trim();
    d.sensacion = document.getElementById('sgSensacion').value.trim();
    d.objetivo = document.getElementById('sgObjetivo').value.trim();
    d.porque = document.getElementById('sgPorque').value.trim();

    if (this._editable.tipo === 'descanso') {
      // Un día de descanso no tiene parte principal, zona ni tramos que
      // marcar con GPS -- se deja todo eso a 0/vacío explícitamente
      // (aunque el formulario tuviera valores de cuando era otro tipo)
      // para que no se cuele ningún resto de una sesión anterior.
      d.modoPartePrincipal = 'distancia';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      d.zona = null;
      d.calentamientoMin = 0;
      d.enfriamientoMin = 0;
      d.pasosDetallados = [];
      return;
    }

    d.modoPartePrincipal = document.getElementById('sgModoParte').value;
    d.distanciaEstimada = parseFloat(document.getElementById('sgDistancia').value) || 0;
    d.duracionPartePrincipalMin = parseFloat(document.getElementById('sgDuracionParte').value) || 0;
    d.zona = document.getElementById('sgZona').value;
    // duración, ritmo, TSS y calorías NO se guardan aquí: se calculan
    // para cada destinatario a partir de esta distancia/tiempo+zona (ver
    // _calcularPersonalizacion), justo antes de mostrarle/aceptarle la
    // sesión, usando su propio ritmo base y su peso.
    this._leerPasosDelDOM();

    // El calentamiento y el enfriamiento SÍ son minutos fijos (iguales
    // para todos): se sacan de los pasos que llevan ese título. La parte
    // principal, en cambio, se calcula para cada usuario como el tiempo
    // total que le lleve la distancia a SU ritmo, menos estos dos.
    d.calentamientoMin = 0;
    d.enfriamientoMin = 0;
    d.pasosDetallados.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit.includes('CALENTAMIENTO')) d.calentamientoMin = p.duracionMin || 0;
      else if (tit.includes('ENFRIAMIENTO')) d.enfriamientoMin = p.duracionMin || 0;
    });
  },

  // ==================================================================
  //  ADMIN: PASO 2 — ELEGIR DÍA EN EL CALENDARIO
  // ==================================================================

  _renderPaso2Calendario() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">📅 ELIGE EL DÍA · PASO 2/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <button onclick="SessionInvites._cambiarMes(-1)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; width:36px; height:36px; cursor:pointer;">‹</button>
          <span id="sgMesLabel" style="font-weight:bold; letter-spacing:1px;"></span>
          <button onclick="SessionInvites._cambiarMes(1)" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; width:36px; height:36px; cursor:pointer;">›</button>
        </div>
        <div id="sgCalendarioGrid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;"></div>
        <div id="sgFechaElegidaTxt" style="text-align:center; margin-top:16px; color:var(--gold); font-weight:bold;"></div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso1())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgContinuarPaso2Btn" class="action-button" style="width:auto; padding:0 32px; margin:0;" disabled>CONTINUAR →</button>
      </div>
    `;
    this._renderizarMesCalendario();
    // BUG CORREGIDO: antes, al pulsar "Continuar" hacia el paso 3, se
    // transicionaba directamente a _renderPaso3Usuarios(), que es quien
    // pedía la lista de usuarios a Firestore -- mientras esa petición
    // tardaba, el modal mostraba brevemente "⏳ Cargando usuarios..." en
    // medio de la transición, lo que se veía como un modal de por medio
    // saltando entre el paso 2 y el paso 3. Ahora la lista se empieza a
    // precargar en segundo plano en cuanto se entra en este paso (sin
    // bloquear nada), y si por lo que sea no ha terminado a tiempo, el
    // botón "Continuar" espera a que termine ANTES de iniciar la
    // transición -- así el paso 3 aparece siempre con la lista ya lista,
    // sin ningún estado intermedio visible.
    this._precargarUsuarios();
    document.getElementById('sgContinuarPaso2Btn').addEventListener('click', async () => {
      if (!this._fechaSeleccionada) return;
      const btn = document.getElementById('sgContinuarPaso2Btn');
      if (!this._usuariosTodos) {
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Cargando...'; }
        await this._precargarUsuarios();
        if (btn) { btn.disabled = false; btn.textContent = 'CONTINUAR →'; }
      }
      this._transicionarPaso(() => this._renderPaso3Usuarios());
    });
  },

  // Pide la lista de usuarios a Firestore una sola vez y la deja
  // cacheada en this._usuariosTodos. Si ya está cargada (o cargándose),
  // no repite la petición.
  _precargarUsuarios() {
    if (this._usuariosTodos || this._precargaUsuariosPromise) return this._precargaUsuariosPromise;
    this._precargaUsuariosPromise = firebaseServices.db.collection('users').orderBy('username_lowercase').get()
      .then(snapshot => {
        this._usuariosTodos = snapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() }))
          .filter(u => u.uid !== AppState.currentUserId);
      })
      .catch(e => {
        console.error('Error cargando usuarios para invitar:', e);
        this._usuariosTodos = [];
      })
      .finally(() => { this._precargaUsuariosPromise = null; });
    return this._precargaUsuariosPromise;
  },

  _cambiarMes(delta) {
    this._mesCalendario.setMonth(this._mesCalendario.getMonth() + delta);
    this._renderizarMesCalendario();
  },

  _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _renderizarMesCalendario() {
    const grid = document.getElementById('sgCalendarioGrid');
    const label = document.getElementById('sgMesLabel');
    if (!grid || !label) return;

    const year = this._mesCalendario.getFullYear();
    const month = this._mesCalendario.getMonth();
    label.textContent = this._mesCalendario.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    const primerDia = new Date(year, month, 1);
    let offset = primerDia.getDay() - 1; // lunes = 0
    if (offset < 0) offset = 6;
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div style="text-align:center; font-size:10px; color:var(--text-secondary); padding:4px 0;">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) html += '<div></div>';

    const hoyKey = this._dateKey(new Date());
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(year, month, dia);
      const key = this._dateKey(fecha);
      const esHoy = key === hoyKey;
      const esSeleccionado = this._fechaSeleccionada && this._dateKey(this._fechaSeleccionada) === key;
      html += `
        <div onclick="SessionInvites._elegirDia(${year},${month},${dia})" style="
          text-align:center; padding:10px 0; border-radius:8px; cursor:pointer; font-size:13px;
          background:${esSeleccionado ? 'var(--gold)' : 'var(--stat-bg)'};
          color:${esSeleccionado ? '#000' : 'var(--text-primary)'};
          border:1px solid ${esHoy && !esSeleccionado ? 'var(--gold)' : 'var(--border-color)'};
          font-weight:${esHoy ? 'bold' : 'normal'};
        ">${dia}</div>`;
    }
    grid.innerHTML = html;
  },

  _elegirDia(year, month, dia) {
    this._fechaSeleccionada = new Date(year, month, dia);
    this._renderizarMesCalendario();
    const txt = document.getElementById('sgFechaElegidaTxt');
    if (txt) txt.textContent = `Sesión para el ${this._fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    const btn = document.getElementById('sgContinuarPaso2Btn');
    if (btn) btn.disabled = false;
  },

  // ==================================================================
  //  ADMIN: PASO 3 — ELEGIR USUARIOS Y ENVIAR
  // ==================================================================

  async _renderPaso3Usuarios() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">👥 ELIGE USUARIOS · PASO 3/3</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <input id="sgUsuariosBuscar" placeholder="> BUSCAR USUARIO_" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="sgUsuariosList">⏳ Cargando usuarios...</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso2Calendario())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgEnviarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">📤 ENVIAR (<span id="sgCountSeleccionados">0</span>)</button>
      </div>
    `;

    // En el flujo normal (viene del botón "Continuar" del paso 2) los
    // usuarios ya están precargados por _precargarUsuarios() y esto no
    // hace ninguna petición ni muestra el placeholder de carga. Se deja
    // como red de seguridad por si este paso se llega a abrir sin haber
    // pasado por ahí.
    if (!this._usuariosTodos) {
      document.getElementById('sgUsuariosList').innerHTML = '⏳ Cargando usuarios...';
      await this._precargarUsuarios();
    }

    this._renderizarListaUsuarios(this._usuariosTodos);

    document.getElementById('sgUsuariosBuscar').addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
        (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
      );
      this._renderizarListaUsuarios(filtrados);
    });

    document.getElementById('sgEnviarBtn').addEventListener('click', () => this._confirmarEnvio());
  },

  _renderizarListaUsuarios(usuarios) {
    const container = document.getElementById('sgUsuariosList');
    if (!container) return;
    if (usuarios.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    container.innerHTML = usuarios.map(u => {
      const marcado = this._usuariosSeleccionados.has(u.uid);
      return `
        <div onclick="SessionInvites._toggleUsuario('${u.uid}')" style="
          display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:6px;
          background:${marcado ? 'rgba(192,160,96,0.12)' : 'var(--stat-bg)'};
          border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
          border-radius:10px; cursor:pointer;
        ">
          <span style="font-size:18px;">${marcado ? '☑️' : '⬜'}</span>
          <div style="flex:1;">
            <div style="font-size:14px; color:var(--text-primary);">${Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'))}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${Utils.escapeHTML(u.email || '')}</div>
          </div>
        </div>`;
    }).join('');
  },

  _toggleUsuario(uid) {
    if (this._usuariosSeleccionados.has(uid)) this._usuariosSeleccionados.delete(uid);
    else this._usuariosSeleccionados.add(uid);
    const term = document.getElementById('sgUsuariosBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    );
    this._renderizarListaUsuarios(filtrados);
    const countEl = document.getElementById('sgCountSeleccionados');
    if (countEl) countEl.textContent = this._usuariosSeleccionados.size;
  },

  async _confirmarEnvio() {
    if (this._usuariosSeleccionados.size === 0) {
      Utils.showToast('Elige al menos un usuario', 'warning');
      return;
    }

    // NOTA: aquí antes se pedía confirmación con Utils.confirm(), pero ese
    // modal usa z-index 45000/45001 y el modal de "Generar sesión" usa
    // 60000 -- el diálogo de confirmación se quedaba renderizado DETRÁS,
    // invisible y sin poder pulsarse, así que al pulsar "ENVIAR" no
    // pasaba nada en apariencia. Como elegir usuarios y pulsar ENVIAR ya
    // es una acción explícita de por sí, se envía directamente.
    const btn = document.getElementById('sgEnviarBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

    Utils.showLoading();
    try {
      const fromUsername = AppState.currentUserData?.username || AppState.currentUser || 'Admin';
      const fechaKey = this._dateKey(this._fechaSeleccionada);
      const batch = firebaseServices.db.batch();
      const sesionParaEnviar = JSON.parse(JSON.stringify(this._editable));
      // Un mismo 'lote' (esta sesión enviada a varios usuarios a la vez)
      // comparte batchId y createdAt en TODOS sus documentos -- antes
      // cada documento llevaba su propio Timestamp.now() (instantes
      // ligeramente distintos), lo que hacía imposible agrupar de forma
      // fiable "esto se envió de una vez" para el historial de abajo.
      const batchId = firebaseServices.utils.createId();
      const createdAt = firebaseServices.Timestamp.now();

      this._usuariosSeleccionados.forEach(uid => {
        const usuario = this._usuariosTodos.find(u => u.uid === uid);
        const ref = firebaseServices.db.collection('sessionInvites').doc();
        batch.set(ref, {
          fromUid: AppState.currentUserId,
          fromUsername,
          toUid: uid,
          toUsername: usuario?.username || '',
          status: 'pending',
          fecha: fechaKey,
          sesion: sesionParaEnviar,
          batchId,
          createdAt
        });
      });

      await batch.commit();
      Utils.hideLoading();
      Utils.showToast(`✅ Sesión enviada a ${this._usuariosSeleccionados.size} usuario(s)`, 'success');
      this._cerrarModal('sessGen');
      this._historialCache = null; // fuerza a releer el historial con el envío recién hecho
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error enviando sesiones:', e);
      Utils.hideLoading();
      Utils.showToast('Error al enviar la sesión', 'error');
      if (btn) { btn.disabled = false; btn.textContent = `📤 ENVIAR (${this._usuariosSeleccionados.size})`; }
    }
  },

  // ==================================================================
  //  ADMIN: HISTORIAL DE LAS ÚLTIMAS SESIONES CREADAS
  // ==================================================================
  //
  // Se pinta debajo del botón "➕ NUEVA SESIÓN PARA ENVIAR"
  // (#adminSesionesEnviadasList, ya reservado en index.html). Cada envío
  // a varios usuarios a la vez cuenta como UNA entrada del historial
  // (agrupada por batchId), mostrando a cuántos se envió y cuántos ya la
  // han aceptado/rechazado. Al pulsar una entrada se abre un modal con el
  // desglose por usuario y un botón para reutilizar esa sesión.
  async mostrarHistorial() {
    const container = document.getElementById('adminSesionesEnviadasList');
    if (!container || !AppState.currentUserId) return;

    if (!this._historialCache) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:12px; padding:12px;">⏳ Cargando historial...</p>';
      try {
        // Se piden más de 10 documentos porque cada "sesión creada" son
        // varios documentos (uno por destinatario) -- de aquí se agrupan
        // por batchId y se quedan solo los últimos 10 lotes distintos.
        const snapshot = await firebaseServices.db.collection('sessionInvites')
          .where('fromUid', '==', AppState.currentUserId)
          .orderBy('createdAt', 'desc')
          .limit(60)
          .get();

        const lotes = new Map();
        snapshot.forEach(doc => {
          const d = doc.data();
          const clave = d.batchId || doc.id; // documentos antiguos sin batchId: cada uno es su propio lote
          if (!lotes.has(clave)) {
            lotes.set(clave, {
              nombre: d.sesion?.detalle?.nombre || d.sesion?.tipo || 'Sesión',
              tipo: d.sesion?.tipo || 'rodaje',
              fecha: d.fecha || '',
              createdAt: d.createdAt,
              sesion: d.sesion || null, // para "Reutilizar"
              total: 0, aceptadas: 0, rechazadas: 0, pendientes: 0,
              destinatarios: [],
              docIds: [] // para poder borrar todos los documentos de este lote
            });
          }
          const lote = lotes.get(clave);
          lote.total++;
          lote.docIds.push(doc.id);
          if (d.status === 'accepted') lote.aceptadas++;
          else if (d.status === 'rejected') lote.rechazadas++;
          else lote.pendientes++;
          lote.destinatarios.push({
            uid: d.toUid,
            username: d.toUsername || '(sin nombre)',
            status: d.status || 'pending'
          });
        });

        this._historialCache = Array.from(lotes.values())
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
          .slice(0, 10);
      } catch (e) {
        console.error('Error cargando historial de sesiones enviadas:', e);
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:12px; padding:12px;">No se pudo cargar el historial.</p>';
        return;
      }
    }

    if (!this._historialCache.length) {
      container.innerHTML = '';
      return;
    }

    const filas = this._historialCache.map((lote, idx) => {
      const fechaTxt = lote.fecha ? this._formatearFechaCorta(lote.fecha) : '';
      const estadoTxt = lote.total > 1
        ? `${lote.aceptadas}✅ ${lote.rechazadas}❌ ${lote.pendientes}⏳ de ${lote.total}`
        : (lote.aceptadas ? '✅ Aceptada' : lote.rechazadas ? '❌ Rechazada' : '⏳ Pendiente');
      return `
        <div onclick="SessionInvites._abrirDetalleHistorial(${idx})" style="display:flex; justify-content:space-between; align-items:center; gap:10px; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; margin-bottom:6px; cursor:pointer;">
          <div style="min-width:0;">
            <div style="font-size:13px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${fechaTxt}${fechaTxt ? ' · ' : ''}${lote.total} destinatario${lote.total === 1 ? '' : 's'}</div>
          </div>
          <div style="font-size:11px; color:var(--text-secondary); white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:10px;">
            <span>${estadoTxt}</span>
            <button onclick="event.stopPropagation(); SessionInvites._eliminarHistorial(${idx})" title="Eliminar del historial" style="background:transparent; border:1px solid var(--border-color); color:var(--text-secondary); border-radius:8px; width:30px; height:30px; flex-shrink:0; cursor:pointer; font-size:13px;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h4 style="font-size:12px; letter-spacing:1px; color:var(--text-secondary); margin:0 0 10px;">📜 ÚLTIMAS SESIONES CREADAS</h4>
      ${filas}
    `;
  },

  // Borra del historial (y de Firestore) TODOS los documentos de ese
  // lote. Si algún destinatario todavía no había aceptado/rechazado, al
  // borrar el documento la invitación desaparece de su Dashboard sin
  // que le llegue nada -- es la forma de "retirar" una sesión enviada
  // por error. Las que ya fueron aceptadas NO se tocan en el plan del
  // usuario (solo desaparece el registro de la invitación, no la sesión
  // que ya quedó guardada en su calendario).
  async _eliminarHistorial(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote || !lote.docIds?.length) return;

    const ok = window.confirm(
      `¿Eliminar "${lote.nombre}" del historial?` +
      (lote.pendientes ? `\n\nOjo: ${lote.pendientes} destinatario(s) todavía no la había(n) aceptado ni rechazado -- se les retirará sin avisarles.` : '')
    );
    if (!ok) return;

    Utils.showLoading();
    try {
      const batch = firebaseServices.db.batch();
      lote.docIds.forEach(docId => {
        batch.delete(firebaseServices.db.collection('sessionInvites').doc(docId));
      });
      await batch.commit();
      this._historialCache.splice(idx, 1);
      Utils.hideLoading();
      Utils.showToast('Eliminada del historial', 'success');
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error eliminando lote del historial:', e);
      Utils.hideLoading();
      Utils.showToast('Error al eliminar', 'error');
    }
  },

  _ESTADO_INFO: {
    accepted: { icono: '✅', texto: 'Aceptada', color: '#7CB88A' },
    rejected: { icono: '❌', texto: 'Rechazada', color: '#c07a7a' },
    pending: { icono: '⏳', texto: 'Pendiente', color: 'var(--text-secondary)' }
  },

  // Modal de detalle de una entrada del historial: a quién se envió, quién
  // ha aceptado/rechazado/sigue pendiente, y un botón para reutilizarla.
  _abrirDetalleHistorial(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote) return;
    const { modal } = this._crearOverlayModal('sessHist');

    const fechaTxt = lote.fecha ? this._formatearFechaCorta(lote.fecha) : '—';
    const filasUsuarios = [...lote.destinatarios]
      .sort((a, b) => a.username.localeCompare(b.username))
      .map(dest => {
        const info = this._ESTADO_INFO[dest.status] || this._ESTADO_INFO.pending;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border-color);">
            <span style="font-size:13px; color:var(--text-primary);">${Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(dest.username) : dest.username)}</span>
            <span style="font-size:12px; color:${info.color};">${info.icono} ${info.texto}</span>
          </div>
        `;
      }).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--text-primary);">${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Para el ${fechaTxt} · ${lote.total} destinatario${lote.total === 1 ? '' : 's'}</div>
        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
          ${filasUsuarios || '<div style="padding:12px; text-align:center; font-size:12px; color:var(--text-secondary);">Sin destinatarios</div>'}
        </div>
        <div style="text-align:center; margin-top:14px;">
          <button onclick="SessionInvites._eliminarHistorial(${idx}); SessionInvites._cerrarModal('sessHist');" style="background:transparent; border:none; color:var(--text-secondary); font-size:12px; text-decoration:underline; cursor:pointer; padding:4px;">🗑️ Eliminar esta sesión del historial</button>
        </div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessHist')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CERRAR</button>
        <button onclick="SessionInvites._reutilizar(${idx})" class="action-button" style="width:auto; padding:0 24px; margin:0;">🔁 REUTILIZAR</button>
      </div>
    `;
  },

  // Reabre el asistente en el paso 1, precargado con los mismos datos de
  // esta sesión del historial (tipo, nombre, zona, distancia/tiempo,
  // pasos, objetivo, etc.), lista para enviarla de nuevo tal cual o
  // modificarla antes de reenviar. No se reutilizan destinatarios ni
  // fecha: hay que volver a elegirlos, por si la sesión es para gente
  // distinta o un día distinto.
  _reutilizar(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote || !lote.sesion) {
      Utils.showToast('No se pudo recuperar esta sesión', 'error');
      return;
    }
    this._editable = JSON.parse(JSON.stringify(lote.sesion));
    // Compatibilidad con sesiones antiguas del historial creadas antes de
    // añadir el modo distancia/tiempo: si no tienen el campo, se asume
    // 'distancia' (el modo que existía por defecto entonces).
    if (!this._editable.detalle) this._editable.detalle = {};
    if (!this._editable.detalle.modoPartePrincipal) this._editable.detalle.modoPartePrincipal = 'distancia';
    if (!Array.isArray(this._editable.detalle.pasosDetallados) || !this._editable.detalle.pasosDetallados.length) {
      this._editable.detalle.pasosDetallados = [
        { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
        { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '' },
        { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
      ];
    }
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechaSeleccionada = null;
    this._usuariosSeleccionados = new Set();

    this._cerrarModal('sessHist');
    // Se espera a que termine la animación de cierre del modal de
    // historial (200ms, ver _cerrarModal) antes de abrir el asistente, o
    // se pisarían las dos transiciones de opacidad a la vez.
    setTimeout(() => this._renderPaso1(), 220);
  },

  _formatearFechaCorta(fechaKey) {
    // fechaKey viene como 'YYYY-MM-DD'
    const [y, m, d] = fechaKey.split('-').map(Number);
    if (!y || !m || !d) return fechaKey;
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  },

  // ==================================================================
  //  DESTINATARIO: ESCUCHAR SESIONES PENDIENTES Y MOSTRAR MODAL
  // ==================================================================

  // El modal ya NO se muestra al instante en cuanto llega el evento de
  // Firestore (podía saltar mientras el usuario todavía estaba en la
  // pantalla de login/carga, antes de ver el Dashboard). Ahora se
  // encola, y solo se muestra cuando el Dashboard ya está montado --
  // exactamente igual que el modal de "Novedades de esta versión", con
  // el mismo pequeño retraso, y se llama desde el mismo sitio
  // (cargarDashboard(), en index.html).
  iniciarListener() {
    if (!AppState.currentUserId || !window.firebaseServices) return;
    this.detenerListener();
    this.unsubscribe = firebaseServices.db.collection('sessionInvites')
      .where('toUid', '==', AppState.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type !== 'added') return;
          const id = change.doc.id;
          if (this._shownIds.has(id)) return;
          this._shownIds.add(id);
          this._colaPendientes.push({ id, data: change.doc.data() });
        });
        // Si el Dashboard ya estaba montado (p. ej. llega una invitación
        // nueva mientras el usuario ya está usando la app), la mostramos
        // ya sin esperar a que se vuelva a montar el Dashboard.
        if (this._dashboardCargado) this.comprobarPendientes();
      }, (error) => {
        console.error('Error en listener de sessionInvites:', error);
      });
  },

  detenerListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this._shownIds.clear();
    this._colaPendientes = [];
    this._modalInviteAbierto = false;
    this._dashboardCargado = false;
  },

  // Llamado desde cargarDashboard() en index.html, justo donde ya se
  // llama a mostrarModalNovedadesSiProcede() -- mismo patrón, mismo
  // retraso (1200ms) para que no aparezca de golpe encima de la propia
  // carga del Dashboard.
  comprobarPendientes() {
    this._dashboardCargado = true;
    setTimeout(() => this._mostrarSiguienteDeCola(), 1200);
  },

  _mostrarSiguienteDeCola() {
    if (this._modalInviteAbierto) return;
    if (!this._colaPendientes.length) return;
    // No lo mostramos encima del modal de novedades si ese todavía
    // sigue abierto (aparecería uno sobre otro).
    const novedadesAbierto = document.getElementById('modalNovedades')?.style.display === 'block';
    if (novedadesAbierto) { setTimeout(() => this._mostrarSiguienteDeCola(), 800); return; }
    const siguiente = this._colaPendientes.shift();
    this._modalInviteAbierto = true;
    this._mostrarModalInvite(siguiente.id, siguiente.data);
  },

  async _mostrarModalInvite(id, data) {
    const { modal } = this._crearOverlayModal('sessInvite');
    const sesion = data.sesion || {};
    const detalle = sesion.detalle || {};
    const fecha = new Date(data.fecha + 'T00:00:00');
    const fechaTxt = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const nombreAdmin = Utils.capitalizeUsername ? Utils.capitalizeUsername(data.fromUsername) : (data.fromUsername || 'El entrenador');

    // Un día de descanso no necesita ritmo/tiempo/TSS/calorías de nadie:
    // se muestra directo, sin la consulta de zonas/peso ni la posible
    // pantalla de "calcula tus zonas primero" (no aplica aquí).
    if (sesion.tipo === 'descanso') {
      modal.innerHTML = `
        <div style="padding:20px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">😴</div>
          <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado un día de descanso
          </div>
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; text-align:center; margin-bottom:20px;">
            <div style="font-weight:bold; color:var(--gold); margin-bottom:6px;">${Utils.escapeHTML(detalle.nombre || 'Descanso')}</div>
            ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
            ${detalle.porque ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${Utils.escapeHTML(detalle.porque)}</div>` : ''}
          </div>
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
        </div>
      `;
      document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id));
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, {
        ritmoStr: null, duracionMin: 0, tss: null, calorias: null,
        calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null
      }));
      return;
    }

    modal.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">⏳ Calculando tu ritmo, tiempo y calorías para esta sesión...</div>`;

    // TODO lo que depende de la persona (ritmo, tiempo que le llevará,
    // TSS y calorías) se calcula aquí con SUS propios datos, no con nada
    // que haya puesto el admin.
    const [calculo, peso] = await Promise.all([
      this._obtenerCalculoDestinatario(AppState.currentUserId),
      this._obtenerPesoUsuario(AppState.currentUserId)
    ]);
    // 'distanciaEstimada'/'duracionPartePrincipalMin' en la sesión tal y
    // como la creó el admin son SOLO la parte principal, en el modo que
    // haya elegido (ver _calcularPersonalizacion): el total real, sumando
    // lo que cubre el calentamiento/enfriamiento a ritmo de Z1, se
    // calcula aquí para CADA usuario.
    const modoParte = detalle.modoPartePrincipal || 'distancia';
    const parteInput = {
      modo: modoParte,
      valor: modoParte === 'tiempo' ? (detalle.duracionPartePrincipalMin || 0) : (detalle.distanciaEstimada || 0)
    };
    const personalizado = this._calcularPersonalizacion(
      detalle.zona, parteInput, calculo, peso,
      detalle.calentamientoMin || 0, detalle.enfriamientoMin || 0
    );
    const zonaInfo = detalle.zona ? this._zonaInfo(detalle.zona) : null;

    // Si el modal ya se cerró/reemplazó mientras esperábamos la consulta
    // (p.ej. llegó otra invitación), no seguimos pintando sobre un modal
    // que ya no es este.
    if (!document.body.contains(modal)) return;

    const sinZonasCalculadas = zonaInfo && personalizado.duracionMin === null;
    const tiempoTxt = personalizado.duracionMin !== null
      ? (personalizado.duracionMin > 60 ? `${Math.floor(personalizado.duracionMin/60)}h ${personalizado.duracionMin%60}min` : `${personalizado.duracionMin} min`)
      : '—';
    // Se muestra la distancia TOTAL (parte principal + calentamiento +
    // enfriamiento convertidos a km); si no se pudo calcular (sin zonas),
    // solo hay un valor de km fiable que mostrar cuando el modo era
    // 'distancia' (lo que puso el admin) -- en modo 'tiempo' sin zonas no
    // hay forma de saber los km, así que se deja en blanco.
    const distanciaMostrar = personalizado.distanciaTotal !== null
      ? personalizado.distanciaTotal
      : (modoParte === 'distancia' ? parteInput.valor : null);
    const distanciaTxt = distanciaMostrar !== null ? parseFloat(distanciaMostrar.toFixed(2)) : '—';

    modal.innerHTML = `
      <div style="padding:20px; text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">${this._tipoEmoji(sesion.tipo)}</div>
        <div style="font-size:15px; color:var(--text-primary); margin-bottom:4px;">
          <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
        </div>
        <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>

        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; text-align:center; margin-bottom:12px;">
          <div style="font-weight:bold; color:var(--gold); margin-bottom:6px;">${Utils.escapeHTML(detalle.nombre || sesion.tipo || 'Sesión')}</div>
          <div style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-bottom:6px;">
            <span>🕒 ${tiempoTxt}</span>
            <span>📏 ${distanciaTxt} km</span>
            ${personalizado.tss !== null ? `<span>⚡ ${personalizado.tss} TSS</span>` : ''}
            ${personalizado.calorias !== null ? `<span>🔥 ${personalizado.calorias} kcal</span>` : ''}
          </div>
          ${zonaInfo ? `
            <div style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
              <span>📊 ${zonaInfo.codigo} · ${zonaInfo.etiqueta}</span>
              <span>⏱️ ${personalizado.ritmoStr || 'sin calcular'}</span>
            </div>
          ` : ''}
          ${(personalizado.distanciaTotal !== null && (detalle.calentamientoMin || detalle.enfriamientoMin)) ? `
            <div style="font-size:10px; color:var(--text-secondary); margin-top:6px; opacity:0.8;">
              ${parseFloat(personalizado.distanciaPartePrincipal.toFixed(2))} km parte principal
              ${detalle.calentamientoMin ? ` + ${parseFloat(personalizado.distanciaCalentamientoKm.toFixed(2))} km calent.` : ''}
              ${detalle.enfriamientoMin ? ` + ${parseFloat(personalizado.distanciaEnfriamientoKm.toFixed(2))} km enfr.` : ''}
            </div>
          ` : ''}
          ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
        </div>

        ${sinZonasCalculadas ? `<div style="font-size:11px; color:var(--gold); margin-bottom:12px; line-height:1.4;">⚠️ Todavía no tienes tus zonas de entrenamiento a mano en este dispositivo, así que no podemos calcular tu ritmo/tiempo/TSS. Calcúlalas y podrás volver a esta sesión para aceptarla.</div>` : ''}
        ${(!peso && distanciaMostrar) ? `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de esta sesión.</div>` : ''}

        ${sinZonasCalculadas ? `
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteCalcularBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">🧮 CALCULAR ZONAS</button>
          </div>
        ` : `
          <div style="display:flex; gap:12px;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
        `}
      </div>
    `;

    document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id));
    if (sinZonasCalculadas) {
      document.getElementById('sessInviteCalcularBtn').addEventListener('click', () => this._irACalcularZonas(id, data));
    } else {
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, personalizado));
    }
  },

  // El usuario no tiene sus zonas a mano: en vez de obligarle a rechazar
  // la sesión, le llevamos a calcularlas y la dejamos en cola para
  // volver a mostrársela en cuanto vuelva al Dashboard (mismo mecanismo
  // que usa una invitación nueva que llega mientras no está en el
  // Dashboard -- ver comprobarPendientes()).
  _irACalcularZonas(id, data) {
    this._cerrarModal('sessInvite');
    this._modalInviteAbierto = false;
    this._colaPendientes.unshift({ id, data });
    try {
      if (typeof switchPerfilSubtab === 'function') switchPerfilSubtab('perfil-entreno');
      if (typeof switchTabFromDashboard === 'function') switchTabFromDashboard('perfil');
      else if (typeof switchTab === 'function') switchTab('perfil');
    } catch (e) {
      console.warn('No se pudo navegar a la calculadora de zonas:', e);
    }
    Utils.showToast('Calcula tus zonas y vuelve al Inicio para retomar la sesión', 'info');
  },

  async _rechazar(id) {
    Utils.showLoading();
    try {
      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'rejected' });
      Utils.hideLoading();
      this._cerrarModal('sessInvite');
      this._modalInviteAbierto = false;
      Utils.showToast('Sesión rechazada', 'info');
      setTimeout(() => this._mostrarSiguienteDeCola(), 400);
    } catch (e) {
      console.error('Error rechazando sesión:', e);
      Utils.hideLoading();
      Utils.showToast('Error al rechazar la sesión', 'error');
    }
  },

  // Rellena con valores por defecto sensatos cualquier campo que el admin
  // haya dejado en blanco al crear la sesión, para que la tarjeta que ve
  // el usuario en su calendario esté SIEMPRE completa -- igual que una
  // sesión generada automáticamente por el planificador, que nunca deja
  // huecos vacíos. Lo que el admin SÍ haya escrito se respeta siempre:
  // esto solo rellena lo que él dejó en blanco, nunca lo sobreescribe.
  _conValoresPorDefecto(detalleOriginal, personalizado, tipo) {
    const zonaInfo = detalleOriginal.zona ? this._zonaInfo(detalleOriginal.zona) : null;

    // Un día de descanso no tiene zona ni pasos: valores por defecto
    // propios, sin mencionar ritmo/zona (no aplican).
    if (tipo === 'descanso') {
      return {
        porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
          ? detalleOriginal.porque
          : 'Día de descanso programado por tu entrenador. La recuperación es tan importante como el entrenamiento.',
        sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim()) ? detalleOriginal.sensacion : '',
        pasosDetallados: [],
        tiempoEnZona: null
      };
    }

    const SENSACION_POR_ZONA = {
      Z1: 'Suave y relajada', Z2: 'Cómoda, controlada', Z3: 'Exigente pero sostenible',
      Z4: 'Dura, al límite de lo controlable', Z5: 'Máximo esfuerzo, muy intensa', Z6: 'Explosiva, al límite'
    };
    const ACCION_POR_DEFECTO = {
      CALENTAMIENTO: 'Trote suave y progresivo, subiendo el ritmo poco a poco.',
      'PARTE PRINCIPAL': 'Mantén el ritmo objetivo de forma constante durante todo el tramo.',
      ENFRIAMIENTO: 'Trote muy suave para bajar pulsaciones progresivamente.'
    };
    const PORQUE_POR_DEFECTO = {
      CALENTAMIENTO: 'Prepara músculos y sistema cardiovascular para el esfuerzo principal.',
      'PARTE PRINCIPAL': 'Es el estímulo clave de esta sesión.',
      ENFRIAMIENTO: 'Facilita la recuperación activa y baja la frecuencia cardíaca poco a poco.'
    };

    const pasosCompletos = (detalleOriginal.pasosDetallados || []).map(p => {
      const tit = (p.titulo || '').toUpperCase();
      const clave = tit.includes('CALENTAMIENTO') ? 'CALENTAMIENTO'
        : tit.includes('ENFRIAMIENTO') ? 'ENFRIAMIENTO'
        : 'PARTE PRINCIPAL';
      return {
        ...p,
        accion: (p.accion && p.accion.trim()) ? p.accion : ACCION_POR_DEFECTO[clave],
        porque: (p.porque && p.porque.trim()) ? p.porque : PORQUE_POR_DEFECTO[clave]
      };
    });

    return {
      porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
        ? detalleOriginal.porque
        : `Sesión de ${tipo || 'entrenamiento'} en zona ${zonaInfo ? zonaInfo.etiqueta.toLowerCase() : 'objetivo'}, programada por tu entrenador.`,
      sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim())
        ? detalleOriginal.sensacion
        : (zonaInfo ? (SENSACION_POR_ZONA[zonaInfo.codigo] || 'Controlada') : 'Controlada'),
      pasosDetallados: pasosCompletos,
      // 'tiempoEnZona' es el único campo que NUNCA rellenaba el generador
      // de sesiones del admin (no tiene ni siquiera un input para él en
      // el formulario): se calcula aquí como el tiempo de la parte
      // principal a SU ritmo, con el mismo formato "M:SS" que usa el
      // resto de la app (Utils.formatR) para este campo.
      tiempoEnZona: personalizado.partePrincipal ? Utils.formatR(personalizado.partePrincipal) : (detalleOriginal.tiempoEnZona || null)
    };
  },

  async _aceptar(id, data, personalizado) {
    Utils.showLoading();
    try {
      const uid = AppState.currentUserId;

      // Si por lo que sea llegamos aquí sin los valores ya calculados
      // (p.ej. se llama fuera del flujo normal del modal), los calculamos
      // ahora mismo con los datos del propio usuario antes de guardar nada.
      if (!personalizado) {
        if (data.sesion.tipo === 'descanso') {
          personalizado = {
            ritmoStr: null, duracionMin: 0, tss: null, calorias: null,
            calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null
          };
        } else {
          const [calculo, peso] = await Promise.all([
            this._obtenerCalculoDestinatario(uid),
            this._obtenerPesoUsuario(uid)
          ]);
          const det = data.sesion.detalle || {};
          const modoParte = det.modoPartePrincipal || 'distancia';
          const parteInput = {
            modo: modoParte,
            valor: modoParte === 'tiempo' ? (det.duracionPartePrincipalMin || 0) : (det.distanciaEstimada || 0)
          };
          personalizado = this._calcularPersonalizacion(det.zona, parteInput, calculo, peso, det.calentamientoMin || 0, det.enfriamientoMin || 0);
        }
      }
      if (personalizado.duracionMin === null) {
        Utils.hideLoading();
        Utils.showToast('Calcula tus zonas de entrenamiento antes de aceptar esta sesión', 'error');
        return;
      }

      // BUG CORREGIDO: antes esto usaba SIEMPRE el campo `ultimoPlanId`
      // guardado en el documento del usuario en Firestore. Pero cuando la
      // app restaura el estado al abrir (restaurarEstado() en app.js),
      // AppState.planActualId se rellena desde localStorage con el plan
      // que el usuario tiene realmente cargado y viendo en el calendario
      // -- sin volver a escribir el campo `ultimoPlanId` en Firestore. Si
      // ese campo se quedó desincronizado (apuntando a un plan antiguo, o
      // vacío), esta comprobación decía "tu plan ya no existe" siendo
      // mentira: el plan sí existía, solo que no era al que apuntaba ese
      // campo. Ahora se usa primero el plan que la app ya tiene en
      // memoria (comprobando que existe de verdad), y el campo de
      // Firestore queda solo como último recurso si no hay nada en
      // memoria (p.ej. se acepta la sesión nada más entrar, en frío).
      let planId = (uid === AppState.currentUserId && AppState.planActualId) ? AppState.planActualId : null;
      let planDoc = null;
      if (planId) {
        planDoc = await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).get();
        if (!planDoc.exists) { planId = null; planDoc = null; }
      }
      if (!planId) {
        const userDoc = await firebaseServices.db.collection('users').doc(uid).get();
        planId = userDoc.data()?.ultimoPlanId;
        if (!planId) {
          Utils.hideLoading();
          Utils.showToast('No tienes ningún plan generado todavía, no se puede añadir la sesión', 'error');
          return;
        }
        planDoc = await firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId).get();
        if (!planDoc.exists) {
          Utils.hideLoading();
          Utils.showToast('Tu plan actual ya no existe, no se puede añadir la sesión', 'error');
          return;
        }
      }

      const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
      const plan = planDoc.data();
      const fechaInicioPlan = plan.params?.fechaInicio ? new Date(plan.params.fechaInicio) : null;
      if (!fechaInicioPlan) {
        Utils.hideLoading();
        Utils.showToast('Tu plan no tiene fecha de inicio válida', 'error');
        return;
      }
      fechaInicioPlan.setHours(0, 0, 0, 0);

      const fechaSesion = new Date(data.fecha + 'T00:00:00');
      const diaGlobal = Math.round((fechaSesion - fechaInicioPlan) / 86400000) + 1;
      if (diaGlobal < 1) {
        Utils.hideLoading();
        Utils.showToast('Esa fecha es anterior al inicio de tu plan actual', 'error');
        return;
      }

      let sesiones = Array.isArray(plan.sesiones) ? [...plan.sesiones] : [];
      const idxExistente = sesiones.findIndex(s => s && s.diaGlobal === diaGlobal);
      const faseRef = idxExistente >= 0 ? sesiones[idxExistente].fase
        : (sesiones[sesiones.length - 1]?.fase || 'BASE');
      const nivelRef = idxExistente >= 0 ? sesiones[idxExistente].nivel
        : (sesiones[sesiones.length - 1]?.nivel || 'intermedio');

      // BUG CORREGIDO: la tarjeta que ve el usuario al abrir la sesión en
      // su calendario (calendar.js -> abrirDetalleSesion) muestra varios
      // campos que el admin puede dejar en blanco al crear la sesión
      // (porqué, sensación, la descripción de cada paso) y, sobre todo,
      // 'tiempoEnZona' -- un campo que el generador de sesiones NUNCA
      // rellenaba, así que ese hueco de la tarjeta salía siempre vacío
      // ("—"), aunque el admin hubiera escrito todo lo demás. Ahora se
      // completa TODO lo que el admin haya dejado vacío con un valor por
      // defecto sensato (lo que él SÍ escribió se respeta siempre, esto
      // solo rellena huecos), para que la tarjeta quede tan completa como
      // una sesión generada automáticamente por el planificador.
      const detalleOriginal = data.sesion.detalle || {};
      const relleno = this._conValoresPorDefecto(detalleOriginal, personalizado, data.sesion.tipo);
      const detallePersonalizado = {
        ...detalleOriginal,
        ...relleno,
        ritmoObjetivo: personalizado.ritmoStr || '',
        tssEstimada: personalizado.tss || 0,
        caloriasEstimadas: personalizado.calorias || null,
        calentamiento: personalizado.calentamiento || 0,
        partePrincipal: personalizado.partePrincipal || 0,
        enfriamiento: personalizado.enfriamiento || 0,
        distanciaEstimada: personalizado.distanciaTotal !== null
          ? parseFloat(personalizado.distanciaTotal.toFixed(2))
          : (detalleOriginal.distanciaEstimada || 0)
      };

      const nuevaEntrada = {
        diaGlobal,
        semana: Math.floor((diaGlobal - 1) / 7) + 1,
        diaSemana: ((diaGlobal - 1) % 7) + 1,
        fase: faseRef,
        nivel: nivelRef,
        tipo: data.sesion.tipo,
        color: (window.PlanGenerator ? PlanGenerator.getColor(data.sesion.tipo) : 'sesion-rodaje'),
        letra: (window.PlanGenerator ? PlanGenerator.getLetra(data.sesion.tipo) : '?'),
        tieneFuerza: false,
        duracion: personalizado.duracionMin,
        detalle: detallePersonalizado
      };

      if (idxExistente >= 0) {
        sesiones[idxExistente] = nuevaEntrada;
      } else {
        // Rellena con descanso los días que falten hasta llegar a la
        // fecha elegida, para no dejar huecos en el array del plan.
        const maxDiaGlobal = sesiones.length ? Math.max(...sesiones.map(s => s.diaGlobal || 0)) : 0;
        for (let g = maxDiaGlobal + 1; g < diaGlobal; g++) {
          sesiones.push({
            diaGlobal: g,
            semana: Math.floor((g - 1) / 7) + 1,
            diaSemana: ((g - 1) % 7) + 1,
            fase: faseRef,
            nivel: nivelRef,
            tipo: 'descanso',
            color: (window.PlanGenerator ? PlanGenerator.getColor('descanso') : 'sesion-descanso'),
            letra: (window.PlanGenerator ? PlanGenerator.getLetra('descanso') : 'D'),
            detalle: null,
            tieneFuerza: false
          });
        }
        sesiones.push(nuevaEntrada);
        sesiones.sort((a, b) => a.diaGlobal - b.diaGlobal);
      }

      await planRef.update({ sesiones });
      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'accepted' });

      // Si el usuario tiene el plan cargado en memoria y está viendo esa
      // pestaña, refrescamos el calendario al instante.
      if (window.AppState && AppState.planActualId === planId) {
        AppState.planGeneradoActual = plan.params;
        if (window.PlanGenerator && typeof PlanGenerator.mostrarCalendario === 'function') {
          PlanGenerator.mostrarCalendario(sesiones);
        }
      }

      Utils.hideLoading();
      this._cerrarModal('sessInvite');
      this._modalInviteAbierto = false;
      Utils.showToast('✅ Sesión añadida a tu plan', 'success');
      setTimeout(() => this._mostrarSiguienteDeCola(), 400);
    } catch (e) {
      console.error('Error aceptando sesión enviada:', e);
      Utils.hideLoading();
      Utils.showToast('Error al añadir la sesión a tu plan', 'error');
    }
  }
};

window.SessionInvites = SessionInvites;
console.log('✅ SessionInvites listo (Generar sesión / invitaciones de sesión)');
