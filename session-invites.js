// ==================== session-invites.js ====================
// Módulo "Generar sesión" del panel de administración.
// VERSIÓN FINAL: flujo encadenado sin saltos visuales, con animación
// de "EN PROCESO" completa antes de mostrar la siguiente invitación.
// Y con la funcionalidad de que los pasos añadidos solo suman tiempo.
//
// v17.1: NUEVO -- abrirGeneradorExtra(): «SESIÓN EXTRA DE HOY» (segundo entreno del mismo día). Usa este compositor en
//   modo propio y, al confirmar, llama a PlanGenerator.abrirOpcionesSesionExtra (GPS o registro manual) en vez de
//   insertar la sesión en el plan.
// v17: añadir, quitar o mover un bloque del Paso 1 ya NO repinta el modal: la fila nueva se inserta (o se quita /
//   se recoloca) directamente en pantalla, así que no se pierde nada de lo escrito ni cambia el scroll
//   (_htmlPaso + _renumerarPasos). Solo cambiar el tipo de sesión repinta, con los datos por defecto del tipo.
// v15.3: editarSesionDelPlan ya NO escribe en el plan al guardar: devuelve la
//   sesión editada y calendar.js la guarda solo al confirmar el modal final
//   (botón EDITAR EN PROFUNDIDAD). Cancelar deja la sesión original intacta.
// v15.2: NUEVO -- editarSesionDelPlan(diaGlobal, sesion): abre este mismo
//   compositor con la sesión del plan ya cargada para EDITARLA antes de
//   marcarla como realizada. Al cancelar, null.
//
// FIX v8.3: los pasos extra (fuerza, estiramientos...) sumaban tiempo a la
// sesión correctamente, pero:
//   - En sesiones normales (rodaje/tempo/largo) ese tiempo extra se colaba
//     también en el cálculo del TSS, inflándolo (el TSS debe reflejar solo
//     la carga de carrera: calentamiento + parte principal + enfriamiento).
//   - En sesiones de series ocurría lo inverso: la duración total
//     (duracionMin) se sobrescribía con solo el tiempo de carrera, así que
//     la sesión guardada perdía los minutos de los pasos extra.
// Ahora ambas funciones usan una duración de carrera aparte solo para el
// TSS, y dejan duracionMin como el tiempo total real (con los extra
// incluidos) en los dos tipos de sesión.
//
// v9: al añadir un paso extra, el admin elige explícitamente su tipo con
// dos botones ("🏃 + CARRERA" / "💪 + FUERZA") en vez de que se deduzca
// solo por el título del paso:
//   - 🏃 Carrera: se inserta justo debajo de "PARTE PRINCIPAL" y corre a la
//     MISMA zona que ella -- suma tiempo Y distancia (y por tanto también
//     TSS), igual que si fuera más parte principal.
//   - 💪 Fuerza: se inserta al final, justo después del enfriamiento, y
//     solo suma al tiempo total de la sesión (como ya hacía v8.3).
// Cada paso lleva ahora un campo p.tipoExtra ('carrera'|'fuerza') que se
// preserva al reconstruir la lista desde el formulario y viaja con la
// sesión guardada; los pasos "clásicos" (CALENTAMIENTO/PARTE PRINCIPAL/
// ENFRIAMIENTO) se siguen reconociendo por título, sin cambios.
//
// v10: cada paso "🏃 carrera" lleva su PROPIA zona (selector p.zona en el
// formulario), independiente de la zona de la parte principal -- ej.
// series en Z4 + un bloque extra de rodaje en Z2. Su distancia/tiempo se
// calculan con el ritmo de SU zona. gps-tracker.js y calendar.js
// actualizados en paralelo para que el rastreo GPS y el desglose al
// marcar la sesión como hecha respeten esa zona propia en vez de
// mezclarla con la de la parte principal.
//
// v11: rediseño puramente visual del generador de sesiones (sin tocar
// cálculos ni lógica) -- cada paso (calentamiento/parte principal/
// enfriamiento/extras) se muestra como una tarjeta con una etiqueta y un
// acento de color propio (reutilizando los mismos colores de zona ya
// usados en el resto de la app: --zone-1/2/3), en vez de un borde plano
// genérico. Los botones "+ CARRERA"/"+ FUERZA" pasan de borde punteado a
// un estilo de chip sólido y con la misma sombra de elevación que el
// resto de tarjetas de la app, para que ambos pesen visualmente igual.
// Extendido también al Paso 2 (calendario: tarjeta contenedora, botones
// de mes a juego, celdas con sombra al marcar, resumen de fechas como
// chip dorado) y al Paso 3 (usuarios: cada fila con avatar circular,
// barra de acento y sombra, igual que el resto de tarjetas nuevas).
//
// v12.6: colores ajustados para modo oscuro: se mantienen los tonos
// pastel que funcionaban en modo claro, pero con luminosidad reducida
// para evitar el efecto neón. Descanso en blanco grisáceo suave.
//
// v15: NUEVO -- PACKS DE SESIONES. En la pestaña Entrenador, junto a
// "NUEVA SESIÓN PARA ENVIAR", hay un botón "📦 NUEVO PACK DE SESIONES": el
// admin/entrenador añade varias sesiones DISTINTAS, cada una con su día
// (ej. lunes 20, martes 21...), y las envía juntas. Al destinatario le
// llega UN solo modal con todas las sesiones del pack (ya personalizadas
// con sus zonas: tiempo, km, TSS, kcal) y las acepta o rechaza de golpe,
// en vez de un modal por sesión.
//   - Modelo de datos: NO cambia. Sigue habiendo una sessionInvite por
//     destinatario y día (mismas reglas de Firestore, sin tocarlas); las
//     de un pack comparten 'packId' (= batchId) y, si se puso, 'packNombre'.
//     El listener las agrupa en UNA entrada de la cola; aceptar/rechazar
//     actualiza todas a la vez y las sesiones se vuelcan al plan
//     personalizado en UNA sola escritura (_volcarSesionesEnPlan).
//   - Un cliente que aún tenga en caché una versión anterior simplemente las
//     ve como invitaciones sueltas (comportamiento de siempre): no se rompe.
//   - Un día solo admite UNA sesión por pack (el plan guarda una por día:
//     una segunda sustituiría a la primera).
//   - El envío ya no mete todo en un único batch (Firestore admite 500
//     operaciones como máximo): se trocea por destinatarios, sin partir
//     nunca el pack de una misma persona entre dos batches.
//   - El historial cuenta un pack POR DESTINATARIO (no por documento).
//   - "REUTILIZAR" también funciona con packs (v15.1): recupera las sesiones
//     del envío y las abre en la lista del pack; si sus días ya han pasado,
//     se mueven solos a la siguiente semana (mismo día de la semana) y hay
//     botones "◀ 1 SEMANA / 1 SEMANA ▶" para mover todo el pack de golpe.
//
// v15.1: FIX -- el tiempo de la PARTE PRINCIPAL ahora se autocompleta.
//   Antes, si la parte principal se definía por KILÓMETROS (o era una sesión
//   de series), la app sí calculaba cuánto tiempo era (km × ritmo de la zona
//   de cada usuario), pero la duración TOTAL de la sesión seguía siendo la
//   suma de los minutos escritos a mano en los pasos: si el bloque "PARTE
//   PRINCIPAL" se dejaba vacío, ese tiempo no se sumaba. Ahora (con las zonas
//   del usuario): duracionMin = total de pasos - minutos escritos en la parte
//   principal + tiempo calculado (_calcularPersonalizacion / ...Series), y el
//   paso "PARTE PRINCIPAL" de la sesión guardada lleva ese tiempo (lo usa el
//   GPS para marcar los tramos). En el compositor, esa casilla queda en
//   automático (deshabilitada, con la estimación "≈N" con TUS zonas como
//   pista); cada atleta recibe SU tiempo según su ritmo.
//
// v14.4: FIX a petición del usuario -- si se añadía un paso "🏃 + CARRERA
// EXTRA" con la sesión configurada como, por ejemplo, series (zona propia
// pensada como complemento de las series) y luego se cambiaba el
// desplegable de tipo a otro (ej. rodaje), ese paso se quedaba tal cual
// en la lista en vez de desaparecer -- _ajustarPasosPorDefectoSegunTipo()
// solo tenía lógica para 'strength' y _leerPasosDelDOM() preserva
// tipoExtra/zona a propósito, así que nada lo quitaba. Ahora, cada vez
// que cambia el tipo (sea cual sea el origen o el destino), se elimina
// cualquier paso "carrera extra" que hubiera -- ya no representa nada
// elegido a propósito para el tipo nuevo -- con un toast informativo si
// se ha quitado alguno. Los pasos "💪 + FUERZA" no se tocan: no dependen
// de la zona de la parte principal, así que siguen teniendo sentido sea
// cual sea el tipo.
//
// v14.3: se elimina el "salto" que hacía la pantalla del Paso 3 al
// cargar los grupos. Antes, los grupos NO se empezaban a pedir a
// Firestore hasta llegar al propio Paso 3 (con un "⏳ Cargando
// grupos..." de una sola línea que, al rellenarse con la rejilla de
// tarjetas, empujaba todo lo de abajo de golpe). Ahora usuarios Y grupos
// se precargan en paralelo nada más entrar en el Paso 2 (mientras el
// admin elige los días en el calendario), y el botón "CONTINUAR →" de
// ese paso no dejará avanzar hasta que las dos hayan terminado -- así, al
// llegar al Paso 3, lo normal es que todo esté ya en caché y la pantalla
// se pinte entera de una vez, ya cargada, sin ningún salto. Si por lo que
// sea alguna de las dos no estuviera lista a tiempo, se muestra un
// esqueleto animado (mismo estilo "riSkeletonPulse" que ya usa "Últimas
// sesiones creadas") en vez del texto suelto, y el contenido real
// aparece con un fundido ("riFadeInUp") en cuanto llega.
//
// v14.2: en el Paso 3, la etiqueta "📁 GRUPOS" y el botón "✏️ GESTIONAR"
// (texto pequeño subrayado en dorado) se sustituyen por un único texto
// "GESTIONAR GRUPOS" centrado, con el mismo estilo de título (Courier
// New, negrita, letter-spacing) que ya usa el resto de la app -- no hacía
// falta la etiqueta de grupos por separado, las propias tarjetas de cada
// grupo ya dejan claro que eso es la lista de grupos. Dentro del modal
// "Gestionar grupos", cada tarjeta pierde el icono de carpeta y su
// nombre pasa a estar centrado (antes iba a la izquierda).
//
// v14.1: rediseño del modal "Gestionar grupos" -- se quita la X de
// cerrar de la cabecera (con títulos largos se solapaba con el propio
// texto "GESTIONAR GRUPOS"); ahora se cierra con un botón "CERRAR" a
// ancho completo, debajo de "CREAR GRUPO". Cada grupo de la lista pasa a
// ser su propia tarjeta con dos filas separadas por una línea: arriba el
// nombre y el nº de miembros, abajo los botones "✏️ EDITAR" / "🗑️
// ELIMINAR" a ancho completo (con texto, no solo el icono suelto) --
// antes esos dos botones eran iconos pequeños pegados al lado del
// nombre, sin una separación clara. Los chips de grupos del Paso 3
// también pasan de una fila de píldoras pegadas a una rejilla de
// tarjetas cuadradas independientes, más separadas entre sí.
//
// v14: NUEVO -- grupos de destinatarios. En el Paso 3 ("elige usuarios")
// aparece ahora una fila de "chips" con los grupos que el admin haya
// creado (ej. "Gimnasio", "Amigos"); pulsar un chip marca de golpe a
// todos sus miembros en la lista de abajo (y volver a pulsarlo, con
// todos ya marcados, los desmarca de golpe). Un botón "✏️ Gestionar"
// abre un modal aparte para crear/editar/eliminar grupos, eligiendo sus
// miembros con el mismo buscador que ya se usaba para elegir
// destinatarios. Los grupos se guardan en la nueva colección Firestore
// 'sessionGroups' (name, members[], createdBy, createdAt), filtrados por
// createdBy == uid del admin actual -- cada admin solo ve y gestiona sus
// propios grupos, nunca los de otro admin. Requiere añadir reglas de
// seguridad para esta colección nueva (ver mensaje de chat).
//
// v13: _colorTipo() ahora es consciente del tema (body.manual-light).
// Los mismos rgba() ajustados para modo oscuro quedaban casi invisibles
// sobre fondo blanco en modo claro -- a simple vista costaba distinguir
// un tipo de sesión de otro en las tarjetas del historial de "Últimas
// sesiones creadas". En modo claro usa un acento más oscuro (mejor
// contraste sobre blanco) y bastante más opacidad de fondo; las tarjetas
// del historial además usan el nuevo parámetro "intenso" para un extra
// de opacidad (el color es su única pista visual de qué tipo es cada
// una), mientras que el detalle a pantalla completa se queda con el
// valor normal para no saturar toda la pantalla.
// ====================

const SessionInvites = {
  unsubscribe: null,
  _shownIds: new Set(),

  // 🔥 v15: modo "pack de sesiones" (ver nota de cabecera). _pack =
  // { items: [{ sesion, fechas: ['YYYY-MM-DD', ...] }], editIdx: null|n, nombre: '' }
  _modoPack: false,
  _pack: null,

  // 🔥 v12.7: inyecta una sola vez los keyframes para la animación de
  // carga del historial (tarjetas "esqueleto" pulsando) y el fade-in de
  // las tarjetas reales al terminar de cargar, en vez de que aparezcan de
  // golpe.
  _asegurarEstiloHistorial() {
    if (document.getElementById('riHistorialAnimStyle')) return;
    const style = document.createElement('style');
    style.id = 'riHistorialAnimStyle';
    style.textContent = `
      @keyframes riSkeletonPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.75; } }
      @keyframes riFadeInUp { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  },
  _colaPendientes: [],
  _modalInviteAbierto: false,
  _dashboardCargado: false,

  _editable: null,
  _mesCalendario: null,
  _fechasSeleccionadas: null,
  _usuariosTodos: null,
  // 🔥 v482: true si la última carga de destinatarios falló del todo. Mientras sea true,
  // _precargarUsuarios() vuelve a intentarlo en vez de dar por buena una lista vacía.
  _usuariosErrorCarga: false,
  _numAlumnosIds: null,
  _usuariosSeleccionados: null,

  // Grupos de usuarios (ej. "Gimnasio", "Amigos") creados por el admin
  // para marcar de golpe a todos sus miembros al elegir destinatarios en
  // el Paso 3, en vez de tener que buscarlos y marcarlos uno a uno cada
  // vez. Colección Firestore 'sessionGroups', filtrada por createdBy ==
  // uid del admin actual (cada admin ve y gestiona solo sus propios
  // grupos). _gruposTodos se cachea igual que _usuariosTodos y se
  // invalida (poniéndolo a null) tras crear/editar/eliminar un grupo.
  _gruposTodos: null,
  _precargaGruposPromise: null,
  _grupoEditandoId: null,
  _grupoMiembrosSeleccionados: null,

  // Factores sobre ritmoBase = 65/75/83/90/100/110 % de VAM (ver Training.startCalc)
  _ZONAS: [
    { codigo: 'Z1', etiqueta: 'RECUPERACIÓN', factorPace: 1.4403 },
    { codigo: 'Z2', etiqueta: 'BASE', factorPace: 1.2483 },
    { codigo: 'Z3', etiqueta: 'TEMPO', factorPace: 1.1280 },
    { codigo: 'Z4', etiqueta: 'UMBRAL', factorPace: 1.0402 },
    { codigo: 'Z5', etiqueta: 'VO₂MÁX', factorPace: 0.9362 },
    { codigo: 'Z6', etiqueta: 'VELOCIDAD', factorPace: 0.8511 }
  ],

  _zonaInfo(codigo) {
    return this._ZONAS.find(z => z.codigo === codigo) || this._ZONAS[1];
  },

  _calcularTSS(duracionMin, zonaCodigo) {
    const factoresIF = { Z1: 0.6, Z2: 0.7, Z3: 0.85, Z4: 0.95, Z5: 1.05, Z6: 1.15 };
    const ifactor = factoresIF[zonaCodigo] || 0.8;
    // 🔥 FIX ESCALA TSS: misma corrección que PlanGenerator.FACTOR_ESCALA_TSS
    // en calendar.js (horas × IF² × 100 → en minutos hay que ×100/60) para
    // que una sesión enviada por el admin dé exactamente el mismo TSS que
    // una equivalente generada por el calendario automático.
    const FACTOR_ESCALA_TSS = 100 / 60;
    return Math.round((duracionMin || 0) * ifactor * ifactor * FACTOR_ESCALA_TSS);
  },

  // ===== AUXILIAR DE COLORES POR TIPO (VERSIÓN AJUSTADA PARA MODO OSCURO) =====
  // Mantiene los tonos pastel que funcionaban en modo claro, pero con
  // luminosidad reducida para evitar el efecto neón en modo oscuro.
  // 🔥 v12.7: mismos colores que usa el calendario real para cada tipo de
  // sesión (ver getColor()/.sesion-<tipo> en index.html: rodaje=zone-1,
  // series=zone-2, tempo=zone-3, largo=zone-4, strength=zone-6), pero en
  // tono MUY tenue (igual que las tarjetas del Paso 1 del generador) --
  // los tonos anteriores, más saturados, se veían "neón" en modo oscuro.
  // Los valores van fijos en hex (no var(--zone-N)) para no depender de
  // cómo esté definida esa variable en cada momento.
  //
  // 🔥 v13: consciente del tema. Los mismos rgba() de arriba, pensados
  // para que no "quemaran" sobre fondo oscuro, quedaban casi invisibles
  // sobre fondo blanco en modo claro (body.manual-light) -- a simple
  // vista costaba distinguir un tipo de sesión de otro. En modo claro se
  // usa un acento más oscuro (mejor contraste sobre blanco) y bastante
  // más cuerpo de opacidad. El parámetro "intenso" (usado en las
  // tarjetas del historial de "Últimas sesiones creadas", donde el color
  // es la única pista visual de qué tipo es cada una) sube aún más la
  // opacidad; el resto de usos (fondo grande del detalle) se queda con
  // el valor normal para no saturar toda la pantalla.
  _colorTipo(tipo, intenso = false) {
    if (tipo === 'descanso') return { accent: 'var(--border-color-light)', bg: 'transparent' };
    if (tipo === 'pack') return { accent: 'var(--gold)', bg: 'rgba(192,160,96,0.10)' };

    const esClaro = document.body.classList.contains('manual-light');
    const base = {
      rodaje:   esClaro ? { rgb: '93,122,143',  accent: '#5D7A8F' } : { rgb: '138,160,176', accent: '#8AA0B0' },
      series:   esClaro ? { rgb: '94,127,101',  accent: '#5E7F65' } : { rgb: '155,181,160', accent: '#9BB5A0' },
      tempo:    esClaro ? { rgb: '161,122,80',  accent: '#A17A50' } : { rgb: '201,167,139', accent: '#C9A78B' },
      largo:    esClaro ? { rgb: '161,95,113',  accent: '#A15F71' } : { rgb: '201,155,165', accent: '#C99BA5' },
      strength: esClaro ? { rgb: '102,102,102', accent: '#666666' } : { rgb: '138,138,138', accent: '#8A8A8A' }
    };
    const c = base[tipo];
    if (!c) return { accent: 'var(--border-color)', bg: 'transparent' };

    const alpha = esClaro ? (intenso ? 0.30 : 0.16) : (intenso ? 0.20 : 0.12);
    return { accent: c.accent, bg: `rgba(${c.rgb},${alpha})` };
  },

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

  // 🔥 MODIFICADO: duracionMin = suma de TODOS los pasos. Distancia solo con pasos de carrera.
  // 🔥 v9: los pasos añadidos con el botón "🏃 + CARRERA" llevan p.tipoExtra
  // ='carrera' y se tratan como una extensión de la parte principal (suman
  // tiempo Y distancia); los de "💪 + FUERZA" llevan p.tipoExtra='fuerza' y
  // solo suman al tiempo total (ya contado en duracionTotalMin). Los pasos
  // "clásicos" (CALENTAMIENTO/PARTE PRINCIPAL/ENFRIAMIENTO por título)
  // siguen igual que antes.
  // 🔥 v10: cada paso "carrera" lleva su PROPIA zona (p.zona), independiente
  // de la zona de la parte principal -- ej. series en Z4 + un bloque extra
  // de rodaje en Z2. Su distancia se calcula con el ritmo de SU zona, no
  // con el de la parte principal.
  _calcularPersonalizacion(zonaCodigo, parteInput, calculo, peso, pasosDetallados) {
    // Sumar minutos de TODOS los pasos (duración total)
    const duracionTotalMin = (pasosDetallados || []).reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    const pasosExtraCarrera = (pasosDetallados || []).filter(p => p.tipoExtra === 'carrera');
    const extraCarreraMin = pasosExtraCarrera.reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    // Separar pasos de carrera "clásicos": aquellos cuyo título contenga
    // CALENTAMIENTO, PARTE PRINCIPAL o ENFRIAMIENTO -- ignorando los que ya
    // llevan un tipoExtra explícito (carrera o fuerza), que se tratan aparte
    const pasosCarrera = (pasosDetallados || []).filter(p => {
      if (p.tipoExtra) return false;
      const tit = (p.titulo || '').toUpperCase();
      return SessionInvites._esCalent(tit) || tit.includes('PARTE PRINCIPAL') || SessionInvites._esEnfria(tit);
    });
    
    let calentamientoMin = 0, enfriamientoMin = 0;
    let pasosPrincipales = [];
    pasosCarrera.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (SessionInvites._esCalent(tit)) calentamientoMin = p.duracionMin || 0;
      else if (SessionInvites._esEnfria(tit)) enfriamientoMin = p.duracionMin || 0;
      else pasosPrincipales.push(p);
    });
    const partePrincipalMin = pasosPrincipales.reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    const resultado = {
      ritmoStr: null, duracionMin: duracionTotalMin, // ← duración total (todos los pasos)
      tss: null, calorias: null,
      calentamiento: calentamientoMin,
      partePrincipal: partePrincipalMin,
      enfriamiento: enfriamientoMin,
      distanciaPartePrincipal: null,
      distanciaCalentamientoKm: null,
      distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };

    // Calcular distancias SOLO con los minutos de carrera
    if (calculo && Array.isArray(calculo.zones) && calculo.zones.length && calculo.ritmoBase) {
      const zona = calculo.zones.find(z => z[0] === zonaCodigo);
      if (zona) {
        const paceDecimal = calculo.ritmoBase * zona[4];
        resultado.ritmoStr = Utils.formatR(paceDecimal);

        // Distancia parte principal: usar partePrincipalMin (solo carrera)
        if (parteInput.modo === 'distancia') {
          resultado.distanciaPartePrincipal = parteInput.valor || 0;
          // Recalcular tiempo de la parte principal con esa distancia
          resultado.partePrincipal = Math.max(1, Math.round(resultado.distanciaPartePrincipal * paceDecimal));
          // 🔥 v15.1: ese tiempo calculado SE SUMA al total. Antes duracionMin
          // seguía siendo la suma de los minutos escritos a mano en los pasos
          // (con la parte principal vacía = 0) y el tiempo de los km se perdía.
          resultado.duracionMin = duracionTotalMin - partePrincipalMin + resultado.partePrincipal;
        } else {
          // 🔥 FIX: ya no hay un campo de tiempo aparte arriba -- la
          // duración de la parte principal en modo tiempo sale
          // directamente del bloque "PARTE PRINCIPAL" de los pasos
          // (partePrincipalMin), igual que ya funciona para fuerza. Antes
          // se limitaba (Math.min) el valor de un campo de arriba a este
          // mismo número, así que si esa fila de abajo no se rellenaba
          // (por defecto 0) el resultado quedaba siempre en 0 pasase lo
          // que pasase arriba.
          resultado.partePrincipal = partePrincipalMin;
          resultado.distanciaPartePrincipal = paceDecimal > 0 ? (resultado.partePrincipal / paceDecimal) : 0;
        }
        // 🔥 v15.1: tiempo de la parte principal SOLO (sin pasos extra); es el que
        // se rellena en el paso "PARTE PRINCIPAL" de la sesión guardada.
        resultado.partePrincipalCalculadaMin = resultado.partePrincipal;

        // Los pasos extra de tipo "carrera" tienen CADA UNO su propia zona
        // (p.zona): se calcula su distancia con el ritmo de esa zona (no
        // con el de la parte principal) y se suma al tiempo y distancia
        // totales, como si fueran más parte principal.
        if (extraCarreraMin > 0) {
          let extraCarreraKm = 0;
          pasosExtraCarrera.forEach(p => {
            const minP = p.duracionMin || 0;
            if (!minP) return;
            const zonaPaso = calculo.zones.find(z => z[0] === p.zona) || zona;
            const pacePaso = calculo.ritmoBase * zonaPaso[4];
            if (pacePaso > 0) extraCarreraKm += minP / pacePaso;
          });
          resultado.partePrincipal += extraCarreraMin;
          resultado.distanciaPartePrincipal += extraCarreraKm;
        }

        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4];
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;

        // TSS basado SOLO en la duración de carrera (calentamiento + parte
        // principal + enfriamiento, incluidos los extra de carrera) -- los
        // pasos extra de FUERZA suman al tiempo total de la sesión pero NO
        // deben inflar la carga de entrenamiento (TSS), ya que no son
        // carrera.
        const duracionCarreraMin = calentamientoMin + resultado.partePrincipal + enfriamientoMin;
        resultado.tss = this._calcularTSS(duracionCarreraMin, zonaCodigo);
      }
    }
    if (peso) {
      const distanciaParaCalorias = resultado.distanciaTotal !== null
        ? resultado.distanciaTotal
        : (parteInput.modo === 'distancia' ? parteInput.valor : 0);
      if (distanciaParaCalorias) resultado.calorias = Math.round(peso * distanciaParaCalorias);
    }
    return resultado;
  },

  _calcularPersonalizacionFuerza(pasosDetallados, peso) {
    // Ya suma todos los pasos
    const duracionMin = (pasosDetallados || []).reduce((s, p) => s + (p.duracionMin || 0), 0);
    let calentamiento = 0, enfriamiento = 0;
    (pasosDetallados || []).forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (SessionInvites._esCalent(tit)) calentamiento = p.duracionMin || 0;
      else if (SessionInvites._esEnfria(tit)) enfriamiento = p.duracionMin || 0;
    });
    return {
      ritmoStr: null, duracionMin, tss: null,
      calorias: peso ? Math.round(peso * duracionMin * 0.0875) : null,
      calentamiento, partePrincipal: Math.max(0, duracionMin - calentamiento - enfriamiento), enfriamiento,
      distanciaPartePrincipal: null, distanciaCalentamientoKm: null, distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };
  },

  // 🔥 MODIFICADO: duracionMin = suma de pasos + duración de series. Distancia solo con pasos de carrera.
  _calcularPersonalizacionSeries(seriesConfig, calculo, peso, pasosDetallados) {
    // Sumar minutos de TODOS los pasos (duración total)
    const duracionPasos = (pasosDetallados || []).reduce((sum, p) => sum + (p.duracionMin || 0), 0);
    const sc = seriesConfig || {};
    const totalReps = Math.max(0, sc.numBloques || 0) * Math.max(0, sc.numSeries || 0);
    const resultado = {
      ritmoStr: null, duracionMin: duracionPasos, // ← duración total (todos los pasos)
      tss: null, calorias: null,
      calentamiento: 0, partePrincipal: 0, enfriamiento: 0,
      distanciaPartePrincipal: null, distanciaCalentamientoKm: null, distanciaEnfriamientoKm: null,
      distanciaTotal: null
    };

    // Pasos extra de carrera: cada uno con su PROPIA zona (p.zona), que
    // puede ser distinta de la zona de esfuerzo de la serie -- ej. series
    // en Z4 + un bloque extra de rodaje en Z2 después.
    const pasosExtraCarrera = (pasosDetallados || []).filter(p => p.tipoExtra === 'carrera');
    const extraCarreraMin = pasosExtraCarrera.reduce((sum, p) => sum + (p.duracionMin || 0), 0);

    // Extraer calentamiento y enfriamiento de los pasos (solo para los de
    // carrera "clásicos" por título, ignorando los que ya llevan tipoExtra)
    const pasosCarrera = (pasosDetallados || []).filter(p => {
      if (p.tipoExtra) return false;
      const tit = (p.titulo || '').toUpperCase();
      return SessionInvites._esCalent(tit) || tit.includes('PARTE PRINCIPAL') || SessionInvites._esEnfria(tit);
    });
    let calentamientoMin = 0, enfriamientoMin = 0;
    pasosCarrera.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (SessionInvites._esCalent(tit)) calentamientoMin = p.duracionMin || 0;
      else if (SessionInvites._esEnfria(tit)) enfriamientoMin = p.duracionMin || 0;
    });
    resultado.calentamiento = calentamientoMin;
    resultado.enfriamiento = enfriamientoMin;

    if (calculo && Array.isArray(calculo.zones) && calculo.zones.length && calculo.ritmoBase && totalReps > 0) {
      const zona = calculo.zones.find(z => z[0] === sc.zonaEsfuerzo);
      if (zona) {
        const paceDecimal = calculo.ritmoBase * zona[4];
        resultado.ritmoStr = Utils.formatR(paceDecimal);

        let tiempoRepMin, distRepKm;
        if (sc.modoRep === 'tiempo') {
          tiempoRepMin = Math.max(0, (sc.tiempoRepSeg || 0) / 60);
          distRepKm = paceDecimal > 0 ? (tiempoRepMin / paceDecimal) : 0;
        } else {
          distRepKm = Math.max(0, (sc.distRepM || 0) / 1000);
          tiempoRepMin = distRepKm * paceDecimal;
        }

        const tiempoEsfuerzoMin = tiempoRepMin * totalReps;
        const distanciaEsfuerzoKm = distRepKm * totalReps;
        const tiempoDescansoMin = ((sc.descansoRepSeg || 0) * Math.max(0, (sc.numSeries || 0) - 1) * (sc.numBloques || 0)) / 60
          + (sc.descansoBloqueMin || 0) * Math.max(0, (sc.numBloques || 0) - 1);

        // Parte principal = tiempo de esfuerzo + descansos (sin contar calentamiento/enfriamiento)
        resultado.partePrincipal = Math.round(tiempoEsfuerzoMin + tiempoDescansoMin);
        // 🔥 v15.1: igual que en las sesiones por distancia -- el tiempo de las
        // series (esfuerzo + descansos) sale de la configuración y se suma al
        // total en lugar de depender de lo que se escribiera en el bloque
        // "PARTE PRINCIPAL" (los pasos extra y el calentamiento/enfriamiento
        // siguen contando como siempre).
        const minPartePrincipalEscrito = (pasosDetallados || [])
          .filter(p => !p.tipoExtra && (p.titulo || '').toUpperCase().includes('PARTE PRINCIPAL'))
          .reduce((sum, p) => sum + (p.duracionMin || 0), 0);
        resultado.duracionMin = duracionPasos - minPartePrincipalEscrito + resultado.partePrincipal;
        resultado.partePrincipalCalculadaMin = resultado.partePrincipal;
        resultado.distanciaPartePrincipal = distanciaEsfuerzoKm;

        // Los pasos extra de tipo "carrera" tienen CADA UNO su propia zona
        // (p.zona), que puede no coincidir con la zona de esfuerzo de la
        // serie: se calcula su distancia con el ritmo de esa zona y se
        // suma al tiempo y distancia totales, como si fueran más parte
        // principal.
        if (extraCarreraMin > 0) {
          let extraCarreraKm = 0;
          pasosExtraCarrera.forEach(p => {
            const minP = p.duracionMin || 0;
            if (!minP) return;
            const zonaPaso = calculo.zones.find(z => z[0] === p.zona) || zona;
            const pacePaso = calculo.ritmoBase * zonaPaso[4];
            if (pacePaso > 0) extraCarreraKm += minP / pacePaso;
          });
          resultado.partePrincipal += extraCarreraMin;
          resultado.distanciaPartePrincipal += extraCarreraKm;
        }

        // Distancias de calentamiento y enfriamiento en Z1
        const zonaZ1 = calculo.zones.find(z => z[0] === 'Z1') || zona;
        const paceZ1 = calculo.ritmoBase * zonaZ1[4];
        resultado.distanciaCalentamientoKm = paceZ1 > 0 ? (calentamientoMin / paceZ1) : 0;
        resultado.distanciaEnfriamientoKm = paceZ1 > 0 ? (enfriamientoMin / paceZ1) : 0;
        resultado.distanciaTotal = resultado.distanciaPartePrincipal + resultado.distanciaCalentamientoKm + resultado.distanciaEnfriamientoKm;

        // TSS basado SOLO en la duración de carrera (series + calentamiento
        // + enfriamiento), sin los pasos extra -- pero la duración TOTAL de
        // la sesión (resultado.duracionMin, ya fijada arriba a duracionPasos,
        // la suma de TODOS los pasos) se deja intacta para que sí incluya
        // esos minutos extra.
        const duracionCarreraMin = resultado.partePrincipal + calentamientoMin + enfriamientoMin;
        resultado.tss = this._calcularTSS(duracionCarreraMin, sc.zonaEsfuerzo);
        resultado.segundosEsfuerzo = Math.round(tiempoEsfuerzoMin * 60);
        // Distancia FIJA planificada del esfuerzo puro (ej. 6x400m = 2.4km),
        // sin contar descansos ni el bloque extra de carrera -- ver uso en
        // calendar.js _desglosarSesion, que la usa tal cual en vez de
        // derivarla proporcionalmente del km real total (eso diluía la
        // distancia de esfuerzo mezclándola con el ritmo, más lento, de los
        // descansos).
        resultado.distanciaEsfuerzoKm = distanciaEsfuerzoKm;
      }
    }
    if (peso) {
      const distanciaParaCalorias = resultado.distanciaTotal !== null ? resultado.distanciaTotal : 0;
      if (distanciaParaCalorias) resultado.calorias = Math.round(peso * distanciaParaCalorias);
    }
    return resultado;
  },

  async _getPlanPersonalizado(uid) {
    try {
      const snapshot = await firebaseServices.db
        .collection('users')
        .doc(uid)
        .collection('planes')
        .where('tipo', '==', 'personalizado')
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, data: doc.data() };
      }
      return null;
    } catch (e) {
      console.warn('Error buscando plan personalizado:', e);
      return null;
    }
  },

  async _crearPlanPersonalizado(uid, fechaInicio) {
    const fechaInicioDate = new Date(fechaInicio);
    const año = fechaInicioDate.getFullYear();
    const fechaFin = new Date(año, 11, 31);

    const planData = {
      nombrePlan: "plan de entrenamiento personalizado",
      tipo: "personalizado",
      params: {
        fechaInicio: fechaInicioDate.toISOString(),
        fechaFin: fechaFin.toISOString(),
        modalidad: 'runner',
        distancia: 'personalizado',
        nivel: 'intermedio',
        diasPorSemana: 0,
        objetivo: 'personalizado',
        ritmoBase: AppState.lastRitmoBase || 5,
        fcMax: AppState.lastFC || 180,
        fcUmbral: AppState.lastUL || 160
      },
      sesiones: [],
      sesionesRealizadas: {},
      feedback: {},
      fechaCreacion: new Date().toISOString(),
      resumen: "Plan personalizado con sesiones del entrenador"
    };

    const planRef = await firebaseServices.db
      .collection('users')
      .doc(uid)
      .collection('planes')
      .add(planData);
    
    return { id: planRef.id, data: planData };
  },

  _desplazarClavesDiaGlobal(obj, diffDays) {
    if (!obj || !diffDays) return obj || {};
    const desplazado = {};
    for (const [clave, valor] of Object.entries(obj)) {
      const nuevaClave = parseInt(clave, 10) + diffDays;
      desplazado[nuevaClave] = valor;
    }
    return desplazado;
  },

  _construirDetalleSesion(sesionData, personalizado) {
    const detalleOriginal = sesionData.detalle || {};
    const relleno = this._conValoresPorDefecto(detalleOriginal, personalizado, sesionData.tipo);
    return {
      ...detalleOriginal,
      ...relleno,
      ritmoObjetivo: personalizado.ritmoStr || '',
      tssEstimada: personalizado.tss || 0,
      caloriasEstimadas: personalizado.calorias || null,
      calentamiento: personalizado.calentamiento || 0,
      partePrincipal: personalizado.partePrincipal || 0,
      enfriamiento: personalizado.enfriamiento || 0,
      segundosEsfuerzo: personalizado.segundosEsfuerzo || 0,
      distanciaEsfuerzoKm: personalizado.distanciaEsfuerzoKm || 0,
      distanciaEstimada: personalizado.distanciaTotal !== null
        ? parseFloat(personalizado.distanciaTotal.toFixed(2))
        : (detalleOriginal.distanciaEstimada || 0)
    };
  },

  // 🔥 Reutiliza el MISMO compositor de "Nueva sesión" (paso 1: tipo +
  // estructura) que ya usa el admin para enviar sesiones a otros, pero en
  // modo "para mí mismo": se salta el paso 2 (elegir fecha, ya viene
  // fijada por el día del calendario en el que se pulsó "+") y el paso 3
  // (elegir destinatarios, no aplica). Al confirmar, la sesión se inserta
  // directamente en el plan activo del propio usuario para ese día y se
  // abre su detalle, desde donde ya puede marcarla como realizada con los
  // datos reales (igual que cualquier otra sesión del calendario).
  abrirGeneradorPropio(diaGlobal) {
    // 🔥 v485: la lista de atletas y los grupos se piden en el MISMO instante en que se pulsa
    // crear sesión / pack (idempotente: si ya están en caché no lee nada), para que al llegar
    // al paso 3 estén ya listos y no se vea ninguna carga.
    this._precargarUsuarios();
    this._precargarGrupos();
    this._modoPack = false;
    this._pack = null;
    this._editable = this._nuevaSesionEditable();
    this._modoSesionExtra = false;
    this._diaGlobalAutoAsignado = diaGlobal;
    this._renderPaso1();
  },

  // 🔥 v17.1: SESIÓN EXTRA DE HOY (segundo entreno del mismo día). Abre este mismo compositor en modo
  // "propio" (sin pasos de fecha ni destinatarios); al confirmar no se inserta nada en el plan, sino que se
  // pasa a PlanGenerator.abrirOpcionesSesionExtra (empezar con GPS o registrarla a mano).
  abrirGeneradorExtra() {
    this._modoPack = false;
    this._pack = null;
    this._editable = this._nuevaSesionEditable();
    this._modoSesionExtra = true;
    this._diaGlobalAutoAsignado = 'extra';
    this._renderPaso1();
  },

  // ==================== MATERIAL ADJUNTO (enlaces y archivos) ====================
  // Se guarda en detalle.adjuntos = [{ tipo:'enlace'|'archivo', url, titulo, nombre?, path?, mime? }].
  // Como viaja dentro de `detalle`, llega solo a la invitación, al pack, al plan del atleta y al calendario.
  _ADJ_MAX: 5,
  _ADJ_MAX_BYTES: 5 * 1024 * 1024,
  _adjSubidos: new Set(),
  _adjSubidosDe: null,

  // Archivos subidos en ESTE editable (para borrarlos de Storage si se quitan o se cancela).
  _adjSet() {
    if (this._adjSubidosDe !== this._editable) { this._adjSubidosDe = this._editable; this._adjSubidos = new Set(); }
    return this._adjSubidos;
  },

  _urlAdjuntoSegura(u) {
    let t = String(u || '').trim();
    if (!t) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = 'https://' + t;
    try {
      const x = new URL(t);
      return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '';
    } catch (e) { return ''; }
  },

  _adjIcono(a) {
    if (a && a.tipo === 'archivo') return (a.mime === 'application/pdf') ? '📄' : '🖼️';
    return '🔗';
  },

  _adjTituloMostrar(a) {
    if (a && a.titulo) return a.titulo;
    if (a && a.nombre) return a.nombre;
    try { return new URL(a.url).hostname.replace(/^www\./, ''); } catch (e) { return 'Enlace'; }
  },

  // Bloque "📎 MATERIAL ADJUNTO" de solo lectura (invitación, pack y calendario). '' si no hay nada.
  _htmlAdjuntos(lista, compacto) {
    const items = (Array.isArray(lista) ? lista : [])
      .map(a => ({ ...(a || {}), url: this._urlAdjuntoSegura(a && a.url) }))
      .filter(a => a.url);
    if (!items.length) return '';
    const filas = items.map(a => `
      <a href="${Utils.escapeHTML(a.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"
         style="display:flex; align-items:center; gap:8px; padding:${compacto ? '6px 8px' : '10px 12px'}; margin-top:6px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:14px; color:var(--text-primary); text-decoration:none; font-size:${compacto ? 11 : 13}px; text-align:left;">
        <span>${this._adjIcono(a)}</span>
        <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${Utils.escapeHTML(this._adjTituloMostrar(a))}</span>
        <span style="color:var(--gold);">↗</span>
      </a>`).join('');
    return `<div style="margin-top:${compacto ? 6 : 12}px; text-align:left;">
      <div style="font-size:10px; font-weight:600; letter-spacing:1px; color:var(--gold);">📎 MATERIAL ADJUNTO</div>${filas}</div>`;
  },

  // Solo entrenadores y administradores pueden adjuntar enlaces o archivos.
  // Además, solo en el generador de ENVÍO («Nueva sesión para enviar», pack o reenviar): nunca al crear una
  // sesión en el propio calendario (día de descanso / «+»), ni la sesión extra de hoy, ni al editar una sesión del plan.
  _puedeAdjuntar() {
    if (!(AppState && (AppState.isAdmin || AppState.isTrainer))) return false;
    if (this._modoSesionExtra || this._modoEdicionSesion) return false;
    return this._diaGlobalAutoAsignado == null;
  },

  // UI del Paso 1 (formulario del entrenador).
  _htmlSeccionAdjuntos() {
    if (!this._puedeAdjuntar()) return '';
    const btn = 'flex:1; height:46px; padding:0 8px; margin:0; background:rgba(154,154,154,0.10); border:1.5px solid var(--border-color-light); color:var(--text-secondary); border-radius:14px; font-size:12px; font-weight:600;';
    return `
        <div id="sgAdjuntosWrap" style="margin-top:18px;">
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:1px;">📎 MATERIAL ADJUNTO (opcional)</label>
          <p style="font-size:10px; color:var(--text-secondary); text-align:center; margin:2px 0 8px; line-height:1.4;">Enlaces (vídeos, rutas, artículos) o archivos PDF / imagen de hasta 5 MB. Máximo ${this._ADJ_MAX}.</p>
          <div id="sgAdjLista"></div>
          <div id="sgAdjBotones" style="display:flex; gap:10px; margin-top:6px;">
            <button type="button" onclick="SessionInvites._adjMostrarFormEnlace()" style="${btn}">+ ENLACE</button>
            <button type="button" onclick="document.getElementById('sgAdjArchivo').click()" style="${btn}">+ ARCHIVO</button>
          </div>
          <input type="file" id="sgAdjArchivo" accept="application/pdf,image/*" style="display:none;" onchange="SessionInvites._adjSubirArchivo(this)">
        </div>`;
  },

  // Repinta solo la lista (sin tocar el resto del formulario).
  _adjPintarLista() {
    const cont = document.getElementById('sgAdjLista');
    if (!cont) return;
    const lista = (this._editable && this._editable.detalle && this._editable.detalle.adjuntos) || [];
    cont.innerHTML = lista.map((a, i) => `
      <div style="display:flex; align-items:center; gap:8px; padding:8px 10px; margin-top:6px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:14px; font-size:12px; text-align:left;">
        <span>${this._adjIcono(a)}</span>
        <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-primary);">${Utils.escapeHTML(this._adjTituloMostrar(a))}</span>
        <button type="button" onclick="SessionInvites._adjQuitar(${i})" aria-label="Quitar adjunto" style="width:32px; height:32px; padding:0; margin:0; flex:none; background:transparent; border:1px solid var(--border-color-light); color:var(--text-secondary); border-radius:14px;">✕</button>
      </div>`).join('');
    const botones = document.getElementById('sgAdjBotones');
    if (botones) botones.style.display = lista.length >= this._ADJ_MAX ? 'none' : 'flex';
  },

  // Ventanita fija en la parte SUPERIOR de la pantalla: en iOS el teclado no encoge la ventana, así que un
  // formulario dentro del scroll del generador queda tapado. Arriba del todo siempre se ve lo que se escribe.
  _adjMostrarFormEnlace() {
    if (!this._puedeAdjuntar()) return;
    document.getElementById('sgAdjDialogOverlay')?.remove();
    const btn = 'flex:1; height:46px; padding:0 8px; margin:0; background:rgba(154,154,154,0.10); border:1.5px solid var(--border-color-light); color:var(--text-secondary); border-radius:14px; font-size:12px; font-weight:600;';
    const ov = document.createElement('div');
    ov.id = 'sgAdjDialogOverlay';
    ov.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:61000; display:flex; justify-content:center; align-items:flex-start; padding-top:calc(env(safe-area-inset-top, 0px) + 70px);';
    ov.innerHTML = `
      <div style="background:var(--bg-card); border-radius:16px; width:92%; max-width:480px; padding:18px; border:1px solid var(--border-color); box-shadow:var(--shadow-lg); font-family:inherit;">
        <div style="text-align:center; font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue); margin-bottom:14px;">🔗 AÑADIR ENLACE</div>
        <input id="sgAdjUrl" type="url" inputmode="url" autocapitalize="none" autocorrect="off" enterkeyhint="next" placeholder="https://..." style="width:100%; margin-bottom:10px; text-align:center;">
        <input id="sgAdjTitulo" enterkeyhint="done" placeholder="Título (opcional)" style="width:100%; margin-bottom:12px; text-align:center;">
        <div style="display:flex; gap:10px;">
          <button type="button" onclick="SessionInvites._adjOcultarFormEnlace()" style="${btn}">CANCELAR</button>
          <button type="button" onclick="SessionInvites._adjAnadirEnlace()" style="${btn} color:var(--gold); border-color:var(--gold);">AÑADIR</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const url = document.getElementById('sgAdjUrl');
    const tit = document.getElementById('sgAdjTitulo');
    url.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tit.focus(); } });
    tit.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this._adjAnadirEnlace(); } });
    url.focus();   // síncrono dentro del toque, para que iOS abra el teclado
  },

  _adjOcultarFormEnlace() {
    document.getElementById('sgAdjDialogOverlay')?.remove();
    this._adjPintarLista();
  },

  _adjScrollA(id, block) {
    const el = document.getElementById(id);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: block || 'center' });
  },

  _adjAnadirEnlace() {
    if (!this._puedeAdjuntar()) return;
    const d = this._editable.detalle;
    d.adjuntos = d.adjuntos || [];
    if (d.adjuntos.length >= this._ADJ_MAX) { Utils.showToast(`Máximo ${this._ADJ_MAX} adjuntos`, 'warning'); return; }
    const url = this._urlAdjuntoSegura(document.getElementById('sgAdjUrl')?.value);
    if (!url) { Utils.showToast('Escribe un enlace válido (https://...)', 'warning'); return; }
    const titulo = (document.getElementById('sgAdjTitulo')?.value || '').trim().slice(0, 80);
    d.adjuntos.push({ tipo: 'enlace', url, titulo });
    this._adjOcultarFormEnlace();
    setTimeout(() => this._adjScrollA('sgAdjuntosWrap'), 50);
  },

  _comprimirImagenAdjunto(file) {
    return new Promise((resolve, reject) => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objUrl);
        c.toBlob(b => b ? resolve(b) : reject(new Error('No se pudo procesar la imagen')), 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('No se pudo leer la imagen')); };
      img.src = objUrl;
    });
  },

  async _adjSubirArchivo(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file || !this._puedeAdjuntar()) return;
    const d = this._editable.detalle;
    d.adjuntos = d.adjuntos || [];
    if (d.adjuntos.length >= this._ADJ_MAX) { Utils.showToast(`Máximo ${this._ADJ_MAX} adjuntos`, 'warning'); return; }
    const esPdf = file.type === 'application/pdf';
    const esImg = /^image\//.test(file.type);
    if (!esPdf && !esImg) { Utils.showToast('Solo se admiten PDF o imágenes', 'warning'); return; }
    if (esPdf && file.size > this._ADJ_MAX_BYTES) { Utils.showToast('El PDF supera los 5 MB', 'warning'); return; }
    const uid = AppState.currentUserId;
    const storage = window.firebaseServices && firebaseServices.storage;
    if (!uid || !storage) { Utils.showToast('No se pueden subir archivos ahora mismo', 'error'); return; }

    const editable = this._editable;
    const wrap = document.getElementById('sgAdjuntosWrap');
    const btnCont = document.getElementById('sgContinuarBtn');
    if (wrap) { wrap.style.opacity = '0.5'; wrap.style.pointerEvents = 'none'; }
    if (btnCont) btnCont.disabled = true;
    Utils.showToast('Subiendo archivo…', 'info');
    try {
      let blob = file, mime = file.type;
      if (esImg) { blob = await this._comprimirImagenAdjunto(file); mime = 'image/jpeg'; }
      if (blob.size > this._ADJ_MAX_BYTES) throw new Error('El archivo supera los 5 MB');
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const path = `session_attachments/${uid}/${id}.${esPdf ? 'pdf' : 'jpg'}`;
      const ref = storage.ref(path);
      await ref.put(blob, { contentType: mime });
      const url = await ref.getDownloadURL();
      if (this._editable !== editable) { ref.delete().catch(() => {}); return; } // se cerró el generador mientras subía
      this._adjSet().add(path);
      const nombre = (file.name || (esPdf ? 'documento.pdf' : 'imagen.jpg')).slice(0, 80);
      d.adjuntos.push({ tipo: 'archivo', url, path, mime, nombre, titulo: nombre.replace(/\.[^.]+$/, '') });
    } catch (e) {
      console.error('Error subiendo adjunto:', e);
      Utils.showToast('No se pudo subir el archivo' + (e && e.code === 'storage/unauthorized' ? ' (sin permiso en Storage)' : ''), 'error');
    } finally {
      const w2 = document.getElementById('sgAdjuntosWrap');
      if (w2) { w2.style.opacity = ''; w2.style.pointerEvents = ''; }
      const b2 = document.getElementById('sgContinuarBtn');
      if (b2) b2.disabled = false;
      this._adjPintarLista();
      setTimeout(() => this._adjScrollA('sgAdjuntosWrap'), 50);
    }
  },

  _adjQuitar(i) {
    const d = this._editable.detalle;
    const a = (d.adjuntos || [])[i];
    if (!a) return;
    d.adjuntos.splice(i, 1);
    if (a.path && this._adjSet().has(a.path)) {   // solo se borra de Storage lo subido en esta edición
      this._adjSet().delete(a.path);
      try { firebaseServices.storage.ref(a.path).delete().catch(() => {}); } catch (e) {}
    }
    this._adjPintarLista();
  },

  // Al cancelar el generador: borra de Storage lo que se subió y no se llegó a enviar.
  _adjLimpiarHuerfanos() {
    try {
      if (this._adjSubidosDe === this._editable) {
        this._adjSubidos.forEach(path => { try { firebaseServices.storage.ref(path).delete().catch(() => {}); } catch (e) {} });
      }
    } catch (e) {}
    this._adjSubidos = new Set();
    this._adjSubidosDe = null;
  },

  _cancelarGenerador() {
    // 🔥 v15: en modo pack, CANCELAR en el compositor de una sesión vuelve
    // a la lista del pack (no cierra todo y pierde las demás sesiones).
    if (this._modoPack && this._pack && !this._diaGlobalAutoAsignado) {
      this._pack.editIdx = null;
      this._fechasSeleccionadas = new Set();
      this._transicionarPaso(() => this._renderPackBuilder());
      return;
    }
    this._adjLimpiarHuerfanos();
    this._diaGlobalAutoAsignado = null;
    this._modoSesionExtra = false;
    this._cerrarModal('sessGen');
  },

  abrirGenerador() {
    this._modoSesionExtra = false;
    // 🔥 v485: la lista de atletas y los grupos se piden en el MISMO instante en que se pulsa
    // crear sesión / pack (idempotente: si ya están en caché no lee nada), para que al llegar
    // al paso 3 estén ya listos y no se vea ninguna carga.
    this._precargarUsuarios();
    this._precargarGrupos();
    this._modoPack = false;
    this._pack = null;
    this._diaGlobalAutoAsignado = null;
    this._editable = this._nuevaSesionEditable();
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechasSeleccionadas = new Set();
    this._usuariosSeleccionados = new Set();
    this._renderPaso1();
  },

  // 🔥 v15: entrada del "pack de sesiones" (botón de la pestaña Entrenador).
  abrirGeneradorPack() {
    this._modoSesionExtra = false;
    this._modoPack = true;
    this._pack = { items: [], editIdx: null, nombre: '' };
    this._diaGlobalAutoAsignado = null;
    this._editable = this._nuevaSesionEditable();
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechasSeleccionadas = new Set();
    this._usuariosSeleccionados = new Set();
    // usuarios y grupos se piden ya, mientras se arma el pack, para que el
    // último paso salga cargado de una vez (mismo criterio que v14.3)
    this._precargarUsuarios();
    this._precargarGrupos();
    this._renderPackBuilder();
  },

  // Sesión en blanco con los valores por defecto del compositor (antes
  // estaba copiada tal cual en abrirGeneradorPropio y en abrirGenerador).
  _nuevaSesionEditable() {
    return {
      tipo: 'rodaje',
      detalle: {
        nombre: '',
        objetivo: '',
        porque: '',
        sensacion: '',
        modoPartePrincipal: 'distancia',
        distanciaEstimada: 5,
        duracionPartePrincipalMin: 30,
        zona: 'Z2',
        seriesConfig: {
          numBloques: 1, numSeries: 6, modoRep: 'distancia',
          distRepM: 400, tiempoRepSeg: 90, zonaEsfuerzo: 'Z5',
          descansoRepSeg: 60, descansoBloqueMin: 3
        },
        pasosDetallados: [
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
          { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0 },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
        ]
      }
    };
  },

  // 🔥 EDITAR SESIÓN (antes de marcarla como realizada, calendar.js): abre el
  // MISMO compositor de "Registrar entreno" con la sesión del plan ya
  // cargada (tipo, zona, pasos, series...). Al guardar, la sesión del plan se
  // DEVUELVE {tipo, duracion, detalle} SIN escribir en el plan (lo guarda
  // calendar.js al confirmar); si se cancela/cierra, resuelve null.
  _prepararEditableDesdeSesion(sesion) {
    const orig = sesion.detalle || {};
    const desescapar = (t) => { const ta = document.createElement('textarea'); ta.innerHTML = t || ''; return ta.value; };
    const det = {
      nombre: desescapar(orig.nombre),
      objetivo: desescapar(orig.objetivo),
      porque: desescapar(orig.porque),
      sensacion: desescapar(orig.sensacion),
      zona: orig.zona ? String(orig.zona).split('-').pop().trim() : 'Z2',
      pasosDetallados: JSON.parse(JSON.stringify(orig.pasosDetallados || []))
    };
    if (orig.seriesConfig) det.seriesConfig = JSON.parse(JSON.stringify(orig.seriesConfig));
    if (Array.isArray(orig.adjuntos) && orig.adjuntos.length) det.adjuntos = JSON.parse(JSON.stringify(orig.adjuntos));
    if (sesion.tipo === 'series' && !det.seriesConfig) {
      det.seriesConfig = {
        numBloques: 1, numSeries: 6, modoRep: 'distancia', distRepM: 400, tiempoRepSeg: 90,
        zonaEsfuerzo: det.zona, descansoRepSeg: 60, descansoBloqueMin: 3
      };
    }
    // Sesiones del planificador: los pasos no llevan minutos -- se rehacen
    // con los minutos de calentamiento / parte principal / enfriamiento.
    const tieneMinutos = det.pasosDetallados.some(p => (p.duracionMin || 0) > 0);
    if (!tieneMinutos && sesion.tipo !== 'strength') {
      det.pasosDetallados = [
        { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: orig.calentamiento || 0 },
        { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: orig.partePrincipal || 0 },
        { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: orig.enfriamiento || 0 }
      ];
    }
    // La distancia guardada es la TOTAL de la sesión (con calentamiento,
    // enfriamiento y extras): el compositor la interpreta como distancia de la
    // parte principal, así que se parte del TIEMPO de la parte principal.
    det.modoPartePrincipal = 'tiempo';
    det.distanciaEstimada = 0;
    return { tipo: sesion.tipo, detalle: det };
  },

  editarSesionDelPlan(diaGlobal, sesion) {
    return new Promise((resolve) => {
      this._modoPack = false;
      this._pack = null;
      this._editable = this._prepararEditableDesdeSesion(sesion);
      this._normalizarEditable();
      this._diaGlobalAutoAsignado = diaGlobal;
      this._modoEdicionSesion = true;
      this._resolverEdicion = resolve;
      this._renderPaso1();
    });
  },

  // 🔥 Petición del usuario: un entrenador que recibe una sesión de un
  // entrenador superior (su plan es 'personalizado', ver calendar.js
  // _puedeVerPlanActual) puede reenviar esa MISMA sesión a sus propios
  // alumnos -- eligiendo día(s) y destinatarios de cero, no solo el día en
  // que la recibió. Reutiliza _prepararEditableDesdeSesion (ya usado por
  // editarSesionDelPlan más arriba) para pasar la sesión del plan al
  // formato del compositor, y desde ahí sigue el MISMO camino paso 1 ->
  // paso 2 (días) -> paso 3 (alumnos) que ya usa _reutilizar() para
  // reenviar algo del propio historial -- así que "a quién se puede
  // enviar" sale de _precargarUsuarios() (alumnosAceptados propios): nunca
  // se puede reenviar a los alumnos del entrenador superior, solo a los
  // suyos. A diferencia de editarSesionDelPlan, aquí NO se fija
  // _diaGlobalAutoAsignado (no es una edición in-situ de este mismo día),
  // así que el compositor pasa por el flujo normal de selección de
  // fecha(s)/destinatarios en vez de la vía rápida de "editar y guardar".
  reenviarSesionDelPlan(sesion) {
    this._modoPack = false;
    this._pack = null;
    this._editable = this._prepararEditableDesdeSesion(sesion);
    this._normalizarEditable();
    this._diaGlobalAutoAsignado = null;
    this._modoEdicionSesion = false;
    this._resolverEdicion = null;
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechasSeleccionadas = new Set();
    this._usuariosSeleccionados = new Set();
    // 🔥 FIX parpadeo/salto: este modal se abre encima del detalle de la
    // sesión, que sigue visible en ese momento (a propósito: calendar.js
    // ya NO lo cierra antes de llamar aquí). _abrirSinFade hace que
    // _renderPaso1() pinte el overlay opaco desde el primer instante, sin
    // los 0.2s de fundido en los que se transparentaba el fondo y se veía
    // un flash del modal de detrás. Con el overlay nuevo ya opaco y
    // tapándolo del todo, cerrar aquí el modal de detalle es inofensivo:
    // no hay ni un frame en el que se vea el cambio.
    this._abrirSinFade = true;
    this._renderPaso1();
    if (window.cerrarModalSesion) window.cerrarModalSesion();
  },

  // Completa lo que le falte a una sesión ya guardada para poder abrirla
  // en el compositor (extraído tal cual de _reutilizar; lo usa también la
  // edición de una sesión del pack).
  _normalizarEditable() {
    const e = this._editable;
    if (!e.detalle) e.detalle = {};
    if (!e.detalle.modoPartePrincipal) e.detalle.modoPartePrincipal = 'distancia';
    if (!e.detalle.seriesConfig) {
      e.detalle.seriesConfig = {
        numBloques: 1, numSeries: 6, modoRep: 'distancia',
        distRepM: 400, tiempoRepSeg: 90, zonaEsfuerzo: e.detalle.zona || 'Z5',
        descansoRepSeg: 60, descansoBloqueMin: 3
      };
    }
    if (!Array.isArray(e.detalle.pasosDetallados) || !e.detalle.pasosDetallados.length) {
      e.detalle.pasosDetallados = [
        { icono: '🔥', titulo: 'CALENTAMIENTO', accion: '', porque: '', duracionMin: 10 },
        { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: '', porque: '', duracionMin: 0 },
        { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: '', porque: '', duracionMin: 5 }
      ];
    }
  },

  _tipoEmoji(tipo) {
    return { rodaje: '🏃‍♂️', tempo: '⚡', series: '🔁', largo: '📏', strength: '💪', descanso: '😴', pack: '📦' }[tipo] || '🏃';
  },

  // 🔥 sinFade=true evita el fundido de entrada (0.2s de opacity 0->1):
  // hace falta cuando este modal se abre ENCIMA de otro que ya está
  // visible (p.ej. el generador sobre el modal de descanso) -- si se deja
  // el fundido normal, durante esos 0.2s se transparenta el fondo negro y
  // se ve un parpadeo del contenido de detrás antes de taparlo del todo.
  _crearOverlayModal(id, sinFade = false) {
    const existente = document.getElementById(id + 'Overlay');
    const modalExistente = document.getElementById(id + 'Modal');
    if (existente && modalExistente) {
      modalExistente.scrollTop = 0;
      return { overlay: existente, modal: modalExistente };
    }
    document.getElementById(id + 'Modal')?.remove();
    document.getElementById(id + 'Overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = id + 'Overlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.8); backdrop-filter:blur(4px);
      z-index:60000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = id + 'Modal';
    modal.style.cssText = `
      background:var(--bg-card); border-radius:16px;
      width:92%; max-width:700px; max-height:88vh; max-height:88dvh;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:var(--shadow-lg);
      border:1px solid var(--border-color);
      font-family:inherit;
      opacity:0; transition:opacity 0.2s ease;
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (sinFade) {
      overlay.style.opacity = '1';
      modal.style.opacity = '1';
    } else {
      requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });
    }
    return { overlay, modal };
  },

  _cerrarModal(id) {
    if (id === 'sessGen') this._modoSesionExtra = false;
    // Si se cierra el compositor sin guardar mientras se estaba EDITANDO una
    // sesión para marcarla como realizada, se resuelve la promesa con null.
    if (id === 'sessGen' && this._resolverEdicion) {
      const r = this._resolverEdicion;
      this._resolverEdicion = null;
      this._modoEdicionSesion = false;
      r(null);
    }
    const modal = document.getElementById(id + 'Modal');
    const overlay = document.getElementById(id + 'Overlay');
    if (modal) { modal.style.transition = 'none'; modal.style.opacity = '0'; }
    if (overlay) {
      overlay.style.transition = 'none'; overlay.style.pointerEvents = 'none'; overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
  },

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

  // 🔥 v11: identidad visual de cada paso según su tipo -- para que el
  // planificador se vea como tarjetas diferenciadas por color en vez de
  // una lista plana, acorde al resto de la app (reutiliza los mismos
  // colores de zona que ya se usan en Dashboard/Muro: --zone-1 azulado
  // para Z1, --zone-2 verdoso, --zone-3 tostado). Los fondos van en rgba
  // porque no se puede aclarar/oscurecer una var() en CSS puro -- son la
  // misma tonalidad que --zone-1/2/3 en el tema oscuro, a muy baja
  // opacidad (mismo criterio que --glow-color, ya usado en la app).
  _infoTipoPaso(p) {
    if (p.tipoExtra === 'carrera') return { accent: 'var(--zone-4)', bg: 'rgba(201,155,165,0.14)', tag: '🏃 EXTRA · CARRERA — suma tiempo y distancia' };
    if (p.tipoExtra === 'fuerza')  return { accent: '#9a9a9a', bg: 'rgba(154,154,154,0.10)', tag: '💪 EXTRA · FUERZA — solo suma tiempo' };
    const tit = (p.titulo || '').toUpperCase();
    if (SessionInvites._esCalent(tit)) return { accent: 'var(--zone-1)', bg: 'rgba(138,160,176,0.12)', tag: '🔥 CALENTAMIENTO' };
    if (SessionInvites._esEnfria(tit)) return { accent: 'var(--zone-3)', bg: 'rgba(201,167,139,0.12)', tag: '🧘 ENFRIAMIENTO' };
    if (tit.includes('PARTE PRINCIPAL')) return { accent: 'var(--zone-2)', bg: 'rgba(155,181,160,0.12)', tag: '⚡ PARTE PRINCIPAL' };
    return { accent: 'var(--border-color-light)', bg: 'transparent', tag: '' };
  },

  // 🔥 v486: el título de los pasos de CALENTAMIENTO y de ENFRIAMIENTO/ESTIRAMIENTOS ya no es texto
  // libre: es un desplegable con nombres coherentes con una sesión real. Así el entrenador no puede
  // escribir un título que la app no reconozca (antes «ESTIRAMIENTOS» a mano acabó tratado como parte
  // principal en el GPS). TODAS las opciones conservan la palabra clave (CALENTAMIENTO / ENFRIAMIENTO /
  // ESTIRAMIENTO) que usan los cálculos de duración, colores y avisos de voz. Si el paso trae un título
  // antiguo que no está en la lista, se mantiene como primera opción para no perderlo.
  // Palabras equivalentes (3 por tipo). Los cálculos, colores y avisos de voz reconocen el bloque por
  // estas funciones, NO por un título exacto, así que cualquier opción vale lo mismo.
  _esCalent(t) { return /CALENTAMIENTO|PREPARACI[ÓO]N|ACTIVACI[ÓO]N/.test(String(t || '').toUpperCase()); },
  _esEnfria(t) { return /ENFRIAMIENTO|ESTIRAMIENTO|VUELTA A LA CALMA/.test(String(t || '').toUpperCase()); },
  _OPCIONES_TITULO_CALENTAMIENTO: ['CALENTAMIENTO', 'PREPARACIÓN', 'ACTIVACIÓN'],
  _OPCIONES_TITULO_ENFRIAMIENTO: ['ENFRIAMIENTO', 'VUELTA A LA CALMA', 'ESTIRAMIENTOS'],

  _opcionesTituloPaso(p) {
    if (p.tipoExtra) return null;
    const t = (p.titulo || '').toUpperCase();
    let lista = null;
    if (SessionInvites._esCalent(t)) lista = this._OPCIONES_TITULO_CALENTAMIENTO;
    else if (this._esEnfria(t)) lista = this._OPCIONES_TITULO_ENFRIAMIENTO;
    if (!lista) return null;
    return lista.includes(t) || !t ? lista : [t, ...lista];
  },

  // 🔥 v17: HTML de UN bloque del Paso 1. Está aparte para poder insertar un bloque nuevo en la pantalla
  // sin repintar el modal (_anadirPaso) y para que _renderPaso1 lo reutilice al pintar la lista.
  _htmlPaso(p, i) {
      const info = this._infoTipoPaso(p);
      // 🔥 v10: selector de zona propio para cada paso "carrera" -- puede
      // ser distinta de la zona de la parte principal (ej. series en Z4 +
      // bloque extra en Z2).
      const selectorZona = p.tipoExtra === 'carrera'
        ? `<select class="sg-paso-zona" data-idx="${i}" style="width:100%; margin-bottom:8px; text-align:center; text-align-last:center; font-size:12px;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}" ${p.zona === z.codigo ? 'selected' : ''}>${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>`
        : '';
      return `
      <div class="sessgen-paso" data-idx="${i}" style="background:${info.bg}; border:1px solid ${info.accent}; border-left:4px solid ${info.accent}; border-radius:14px; padding:12px 12px 10px; margin-bottom:10px; box-shadow:var(--shadow-sm);">
        <div style="display:flex; align-items:center; margin-bottom:6px;">
          <div class="sg-grip" onpointerdown="SessionInvites._arrastrePointerDown(event)" title="Arrastra para cambiar el orden" aria-label="Arrastrar para cambiar el orden" style="width:44px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:grab; touch-action:none; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;">
            <span style="display:block; width:15px; height:22px; background-image:radial-gradient(circle, var(--text-secondary) 1.7px, transparent 2.2px); background-size:7.5px 7.3px; opacity:0.85;"></span>
          </div>
          <div style="flex:1; font-size:10px; font-weight:600; color:${info.accent}; text-align:center; letter-spacing:0.8px; word-break:break-word;">${info.tag || ''}</div>
          <div style="width:44px; flex-shrink:0;"></div>
        </div>
        <!-- 🔥 Una sola fila: icono + título + minutos + eliminar. El
             título va sin negrita, con letra más pequeña y elipsis de
             seguridad para que quepan títulos largos como "PARTE
             PRINCIPAL" sin cortarse; los minutos vuelven a ser una caja
             estrecha (antes, en dos filas, ocupaban todo el ancho para
             un número de 2-3 cifras, que quedaba muy vacío). -->
        <div style="display:flex; gap:6px; margin-bottom:8px; align-items:center;">
          <input class="sg-paso-icono" data-idx="${i}" value="${Utils.escapeHTML(p.icono || '')}" style="width:38px; flex-shrink:0; text-align:center; padding:8px 2px; font-size:16px;" maxlength="4">
          ${(() => {
            const ops = this._opcionesTituloPaso(p);
            const tActual = (p.titulo || '').toUpperCase();
            if (!ops) return `<input class="sg-paso-titulo" data-idx="${i}" value="${Utils.escapeHTML(p.titulo || '')}" placeholder="TÍTULO" style="flex:1; min-width:0; text-align:center; font-size:12px; padding:8px 4px; overflow:hidden; text-overflow:ellipsis;">`;
            return `<select class="sg-paso-titulo" data-idx="${i}" style="flex:1; min-width:0; text-align:center; text-align-last:center; font-size:12px; padding:8px 4px; overflow:hidden; text-overflow:ellipsis;">
              ${ops.map(o => `<option value="${Utils.escapeHTML(o)}" ${o === tActual ? 'selected' : ''}>${Utils.escapeHTML(o)}</option>`).join('')}
            </select>`;
          })()}
          <input class="sg-paso-min" data-idx="${i}" type="number" min="0" value="${p.duracionMin || ''}" placeholder="min" title="Minutos" style="width:46px; flex-shrink:0; text-align:center; padding:8px 2px; font-size:14px;">
          <!-- 🔥 Botón eliminar: centrado y rojo -->
          <button onclick="SessionInvites._quitarPaso(this)" style="
            background:transparent;
            border:1px solid #e74c3c;
            color:#e74c3c;
            border-radius:14px;
            width:34px;
            height:36px;
            cursor:pointer;
            flex-shrink:0;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:16px;
          ">✕</button>
        </div>
        ${selectorZona}
        <input class="sg-paso-accion" data-idx="${i}" value="${Utils.escapeHTML(p.accion || '')}" placeholder="Qué hay que hacer" style="width:100%; margin-bottom:6px; text-align:center;">
        <input class="sg-paso-porque" data-idx="${i}" value="${Utils.escapeHTML(p.porque || '')}" placeholder="Por qué (opcional)" style="width:100%; margin-bottom:0; text-align:center;">
      </div>
    `;
  },

  _renderPaso1() {
    // 🔥 v485: la lista de atletas y los grupos se piden en el MISMO instante en que se pulsa
    // crear sesión / pack (idempotente: si ya están en caché no lee nada), para que al llegar
    // al paso 3 estén ya listos y no se vea ninguna carga.
    this._precargarUsuarios();
    this._precargarGrupos();
    // 🔥 FIX parpadeo/salto al reenviar: mismo motivo y misma solución que
    // ya se aplicó para el generador en modo auto-asignación (ver v3.72/
    // v3.73 en el changelog) -- este modal se abre ENCIMA del detalle de
    // la sesión (reenviarSesionDelPlan), que en ese caso no se cierra
    // antes (para no competir con dos fundidos independientes a la vez).
    // _abrirSinFade es un flag de un solo uso: se consume aquí mismo para
    // que no se quede pegado si luego se abre el generador por otra vía
    // (p.ej. "Nueva sesión" normal, que sí debe fundirse como siempre).
    const sinFade = !!this._diaGlobalAutoAsignado || !!this._abrirSinFade;
    this._abrirSinFade = false;
    const { modal } = this._crearOverlayModal('sessGen', sinFade);
    const d = this._editable.detalle;
    const tipoActual = this._editable.tipo;
    // 🔥 Siempre mostramos el campo de minutos para todos los pasos
    const pasosHTML = d.pasosDetallados.map((p, i) => this._htmlPaso(p, i)).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">${this._tipoEmoji(this._editable.tipo)} ${this._diaGlobalAutoAsignado ? (this._modoEdicionSesion ? 'EDITAR SESIÓN' : (this._modoSesionExtra ? 'SESIÓN EXTRA DE HOY' : 'REGISTRAR ENTRENO')) : (this._modoPack ? this._tituloPasoPack(1) : 'NUEVA SESIÓN · PASO 1/3')}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">TIPO DE SESIÓN</label>
        <select id="sgTipo" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
          <option value="rodaje">🏃‍♂️ Rodaje</option>
          <option value="tempo">⚡ Tempo</option>
          <option value="series">🔁 Series</option>
          <option value="largo">📏 Tirada larga</option>
          <option value="strength">💪 Fuerza</option>
          <option value="descanso">😴 Descanso</option>
        </select>

        <div id="sgDescansoInfo" style="display:none; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; text-align:center; margin-bottom:10px; font-size:12px; color:var(--text-secondary); line-height:1.5;">
          😴 Un día de descanso usa la misma tarjeta que genera el planificador por defecto para
          los días sin entrenar (mismo texto, mismos consejos). No hay nada más que rellenar:
          solo elige a quién enviárselo y para qué día.
        </div>

        <div id="sgCamposComunesWrap">
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">NOMBRE DE LA SESIÓN</label>
          <input id="sgNombre" placeholder="Ej: Rodaje aeróbico suave" style="width:100%; margin-bottom:10px; text-align:center;">
        </div>

        <div id="sgParteContinuaWrap">
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">CÓMO DEFINES LA PARTE PRINCIPAL</label>
          <select id="sgModoParte" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            <option value="distancia">📏 Por distancia (km)</option>
            <option value="tiempo">⏱️ Por tiempo (minutos)</option>
          </select>

          <div id="sgDistanciaWrap">
            <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">DISTANCIA DE LA PARTE PRINCIPAL (km)</label>
            <input id="sgDistancia" type="number" step="0.1" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>

          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">ZONA DE ENTRENAMIENTO (parte principal)</label>
          <select id="sgZona" style="width:100%; margin-bottom:6px; text-align:center; text-align-last:center;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}">${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>
          <p id="sgInfoModoParte" style="font-size:12px; color:var(--text-secondary); text-align:center; margin:0 0 10px; line-height:1.4;"></p>
        </div>

        <div id="sgParteSeriesWrap" style="display:none;">
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">ESTRUCTURA DE LA SERIE</label>
          <div style="display:flex; gap:8px; margin-bottom:10px;">
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">Nº BLOQUES</label>
              <input id="sgSerBloques" type="number" step="1" min="1" style="width:100%; text-align:center;">
            </div>
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">REPETICIONES / BLOQUE</label>
              <input id="sgSerRepeticiones" type="number" step="1" min="1" style="width:100%; text-align:center;">
            </div>
          </div>

          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">CÓMO DEFINES CADA REPETICIÓN</label>
          <select id="sgSerModoRep" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            <option value="distancia">📏 Por distancia (metros)</option>
            <option value="tiempo">⏱️ Por tiempo (segundos)</option>
          </select>
          <div id="sgSerDistWrap">
            <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">DISTANCIA DE CADA REPETICIÓN (m)</label>
            <input id="sgSerDistM" type="number" step="10" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>
          <div id="sgSerTiempoWrap" style="display:none;">
            <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">TIEMPO DE CADA REPETICIÓN (seg)</label>
            <input id="sgSerTiempoSeg" type="number" step="5" min="0" style="width:100%; margin-bottom:10px; text-align:center;">
          </div>

          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">ZONA DE ESFUERZO (cada repetición)</label>
          <select id="sgSerZona" style="width:100%; margin-bottom:10px; text-align:center; text-align-last:center;">
            ${this._ZONAS.map(z => `<option value="${z.codigo}">${z.codigo} · ${z.etiqueta}</option>`).join('')}
          </select>

          <div style="display:flex; gap:8px; margin-bottom:6px;">
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">DESCANSO ENTRE REPETICIONES (seg)</label>
              <input id="sgSerDescansoRep" type="number" step="5" min="0" style="width:100%; text-align:center;">
            </div>
            <div style="flex:1;">
              <label style="display:block; text-align:center; font-size:10px; color:var(--text-secondary);">DESCANSO ENTRE BLOQUES (min)</label>
              <input id="sgSerDescansoBloque" type="number" step="1" min="0" style="width:100%; text-align:center;">
            </div>
          </div>
          <p style="font-size:12px; color:var(--text-secondary); text-align:center; margin:4px 0 10px; line-height:1.4;">
            ℹ️ El ritmo, el tiempo y la distancia real de cada repetición se calculan para cada corredor con SU ritmo en la zona elegida. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se suman aparte.
          </p>
        </div>

        <div id="sgFuerzaInfo" style="display:none; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:12px; text-align:center; margin-bottom:10px; font-size:12px; color:var(--text-secondary); line-height:1.5;">
          💪 Una sesión de fuerza no usa distancia ni ritmo: pon los minutos de cada paso (calentamiento, ejercicios y estiramientos) ahí abajo, en "ESTRUCTURA DE LA SESIÓN", y describe qué hay que hacer en cada uno.
        </div>

        <div id="sgCamposComunesWrap2">
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">SENSACIÓN (opcional)</label>
          <input id="sgSensacion" placeholder="Ej: Cómoda, controlada" style="width:100%; margin-bottom:10px; text-align:center;">

          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">🎯 OBJETIVO PRINCIPAL</label>
          <textarea id="sgObjetivo" style="width:100%; min-height:50px; margin-bottom:10px; text-align:center;"></textarea>

          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">POR QUÉ</label>
          <textarea id="sgPorque" style="width:100%; min-height:50px; margin-bottom:16px; text-align:center;"></textarea>
        </div>

        <div id="sgPasosWrap">
          <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:1px;">🧩 ESTRUCTURA DE LA SESIÓN</label>
          <p id="sgPasosInfoTexto" style="font-size:10px; color:var(--text-secondary); text-align:center; margin:2px 0 10px; line-height:1.4;"></p>
          <div id="sgPasosContainer" style="margin-top:8px;">${pasosHTML}</div>
          <div style="display:flex; gap:10px; margin-top:6px;">
            <button onclick="SessionInvites._anadirPaso('carrera')" style="flex:1; height:44px; padding:0 8px; margin:0; background:rgba(201,155,165,0.14); border:1.5px solid var(--zone-4); color:var(--zone-4); border-radius:14px; cursor:pointer; font-size:12px; font-weight:600; letter-spacing:0.5px; box-shadow:var(--shadow-sm);">+ CARRERA</button>
            <button onclick="SessionInvites._anadirPaso('fuerza')" style="flex:1; height:44px; padding:0 8px; margin:0; background:rgba(154,154,154,0.10); border:1.5px solid var(--border-color-light); color:var(--text-secondary); border-radius:14px; cursor:pointer; font-size:12px; font-weight:600; letter-spacing:0.5px; box-shadow:var(--shadow-sm);">+ FUERZA</button>
          </div>
          <p style="font-size:10px; color:var(--text-secondary); text-align:center; margin:8px 0 0; line-height:1.5;"><span style="color:var(--zone-4);">🏃 Carrera</span> se coloca debajo de la parte principal y suma tiempo y distancia · <span style="color:var(--text-secondary);">💪 Fuerza</span> se coloca al final y solo suma tiempo · Arrastra el asa de puntos de cada bloque para cambiar el orden</p>
        </div>
        ${this._htmlSeccionAdjuntos()}
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cancelarGenerador()" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgContinuarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">${this._diaGlobalAutoAsignado ? (this._modoEdicionSesion ? 'CONTINUAR' : (this._modoSesionExtra ? 'CONTINUAR →' : 'GUARDAR')) : 'CONTINUAR →'}</button>
      </div>
    `;

    document.getElementById('sgTipo').value = this._editable.tipo;
    document.getElementById('sgNombre').value = d.nombre || '';
    document.getElementById('sgModoParte').value = d.modoPartePrincipal || 'distancia';
    document.getElementById('sgDistancia').value = d.distanciaEstimada || '';
    document.getElementById('sgZona').value = (d.zona && d.zona !== null) ? d.zona : 'Z2';
    document.getElementById('sgSensacion').value = d.sensacion || '';
    document.getElementById('sgObjetivo').value = d.objetivo || '';
    document.getElementById('sgPorque').value = d.porque || '';
    this._adjPintarLista();

    const sc = d.seriesConfig || {};
    document.getElementById('sgSerBloques').value = sc.numBloques || 1;
    document.getElementById('sgSerRepeticiones').value = sc.numSeries || 6;
    document.getElementById('sgSerModoRep').value = sc.modoRep || 'distancia';
    document.getElementById('sgSerDistM').value = sc.distRepM || 400;
    document.getElementById('sgSerTiempoSeg').value = sc.tiempoRepSeg || 90;
    document.getElementById('sgSerZona').value = sc.zonaEsfuerzo || 'Z5';
    document.getElementById('sgSerDescansoRep').value = sc.descansoRepSeg || 60;
    document.getElementById('sgSerDescansoBloque').value = sc.descansoBloqueMin || 3;

    this._actualizarModoParte();
    this._actualizarModoRepSerie();
    this._actualizarVisibilidadPorTipo();
    this._autocompletarTiempoPartePrincipal();
    document.getElementById('sgModoParte').addEventListener('change', () => { this._actualizarModoParte(); this._autocompletarTiempoPartePrincipal(); });
    document.getElementById('sgDistancia').addEventListener('input', () => this._autocompletarTiempoPartePrincipal());
    document.getElementById('sgZona').addEventListener('change', () => this._autocompletarTiempoPartePrincipal());
    document.getElementById('sgSerModoRep').addEventListener('change', () => this._actualizarModoRepSerie());
    document.getElementById('sgTipo').addEventListener('change', () => {
      // Cambiar de tipo SÍ repinta (los campos pasan a los valores por defecto del tipo nuevo); solo se
      // conservan los textos generales y los bloques.
      d.nombre = document.getElementById('sgNombre').value;
      d.sensacion = document.getElementById('sgSensacion').value;
      d.objetivo = document.getElementById('sgObjetivo').value;
      d.porque = document.getElementById('sgPorque').value;
      this._leerPasosDelDOM();
      this._editable.tipo = document.getElementById('sgTipo').value;
      this._ajustarPasosPorDefectoSegunTipo();
      this._renderPaso1();
    });

    document.getElementById('sgContinuarBtn').addEventListener('click', () => {
      this._leerPaso1();
      const tipo = this._editable.tipo;
      const det = this._editable.detalle;
      if (tipo !== 'descanso') {
        if (!det.nombre.trim()) {
          Utils.showToast('Ponle un nombre a la sesión', 'warning');
          return;
        }
        if (tipo === 'strength') {
          const totalMin = (det.pasosDetallados || []).reduce((s, p) => s + (p.duracionMin || 0), 0);
          if (!(totalMin > 0)) {
            Utils.showToast('Pon los minutos de cada paso de la sesión de fuerza', 'warning');
            return;
          }
        } else if (tipo === 'series') {
          const sc = det.seriesConfig;
          if (!(sc.numBloques > 0) || !(sc.numSeries > 0)) {
            Utils.showToast('Pon el número de bloques y de repeticiones por bloque', 'warning');
            return;
          }
          if (sc.modoRep === 'distancia' && !(sc.distRepM > 0)) {
            Utils.showToast('Pon la distancia de cada repetición', 'warning');
            return;
          }
          if (sc.modoRep === 'tiempo' && !(sc.tiempoRepSeg > 0)) {
            Utils.showToast('Pon el tiempo de cada repetición', 'warning');
            return;
          }
        } else {
          const modo = det.modoPartePrincipal;
          if (modo === 'distancia' && !(det.distanciaEstimada > 0)) {
            Utils.showToast('Pon la distancia de la parte principal', 'warning');
            return;
          }
          if (modo === 'tiempo') {
            // 🔥 Ya no hay un campo aparte arriba para el tiempo de la
            // parte principal (duplicaba la fila "PARTE PRINCIPAL" de los
            // bloques de abajo, que además la pisaba dejándola a 0 si no
            // se rellenaba también). Ahora la única fuente es esa fila.
            const minPartePrincipal = (det.pasosDetallados || [])
              .filter(p => !p.tipoExtra && (p.titulo || '').toUpperCase().includes('PARTE PRINCIPAL'))
              .reduce((s, p) => s + (p.duracionMin || 0), 0);
            if (!(minPartePrincipal > 0)) {
              Utils.showToast('Pon los minutos del bloque PARTE PRINCIPAL, más abajo', 'warning');
              return;
            }
          }
        }
      }
      if (this._diaGlobalAutoAsignado) {
        this._confirmarAutoAsignacion();
      } else {
        this._transicionarPaso(() => this._renderPaso2Calendario());
      }
    });
  },

  _ajustarPasosPorDefectoSegunTipo() {
    // 🔥 A petición del usuario: el paso "🏃 + CARRERA EXTRA" se añade
    // como complemento a un tipo concreto (ej. rodaje suave aparte de las
    // series), con su propia zona pensada en relación a ESE tipo. Si
    // luego se cambia el tipo de la sesión (p.ej. de series a rodaje), ese
    // paso ya no representa nada elegido a propósito para el tipo nuevo --
    // es solo un resto de la configuración anterior -- así que se quita
    // siempre que el tipo cambia, sea cual sea el tipo de origen o
    // destino. Los pasos de "💪 + FUERZA" no dependen de la zona de la
    // parte principal, así que no se tocan.
    const pasos = this._editable.detalle.pasosDetallados || [];
    const antes = pasos.length;
    this._editable.detalle.pasosDetallados = pasos.filter(p => p.tipoExtra !== 'carrera');
    const eliminados = antes - this._editable.detalle.pasosDetallados.length;
    if (eliminados > 0) {
      Utils.showToast(`🏃 Se ${eliminados === 1 ? 'ha quitado' : 'han quitado'} el paso de carrera extra al cambiar el tipo de sesión`, 'info');
    }

    if (this._editable.tipo !== 'strength') return;
    this._editable.detalle.pasosDetallados.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (tit === 'ENFRIAMIENTO') p.titulo = 'ESTIRAMIENTOS';
      if (tit === 'PARTE PRINCIPAL' && !p.duracionMin) p.duracionMin = 30;
    });
  },

  _actualizarVisibilidadPorTipo() {
    const tipo = document.getElementById('sgTipo')?.value;
    const esDescanso = tipo === 'descanso';
    const esFuerza = tipo === 'strength';
    const esSeries = tipo === 'series';
    const esContinuo = !esDescanso && !esFuerza && !esSeries;

    const idsComunes = ['sgPasosWrap', 'sgCamposComunesWrap', 'sgCamposComunesWrap2', 'sgAdjuntosWrap'];
    idsComunes.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = esDescanso ? 'none' : 'block';
    });
    const descansoInfo = document.getElementById('sgDescansoInfo');
    if (descansoInfo) descansoInfo.style.display = esDescanso ? 'block' : 'none';

    const parteContinua = document.getElementById('sgParteContinuaWrap');
    if (parteContinua) parteContinua.style.display = (esContinuo && !esDescanso) ? 'block' : 'none';

    const parteSeries = document.getElementById('sgParteSeriesWrap');
    if (parteSeries) parteSeries.style.display = esSeries ? 'block' : 'none';

    const fuerzaInfo = document.getElementById('sgFuerzaInfo');
    if (fuerzaInfo) fuerzaInfo.style.display = esFuerza ? 'block' : 'none';

    const pasosInfo = document.getElementById('sgPasosInfoTexto');
    if (pasosInfo) {
      pasosInfo.textContent = esFuerza
        ? 'Pon los minutos de CADA paso (calentamiento, ejercicios, estiramientos): en fuerza no hay distancia que convertir, así que todos los pasos llevan su propio tiempo.'
        : 'Pon los minutos de CADA paso: así, al hacer la sesión con GPS, la app marca esos tramos automáticamente. La duración total será la suma de todos los pasos (en la parte principal por distancia, y en series, su tiempo se calcula solo con el ritmo de cada usuario). Los pasos extra (como fuerza) suman tiempo pero no distancia.';
    }
  },

  _actualizarModoParte() {
    const modo = document.getElementById('sgModoParte')?.value || 'distancia';
    const distWrap = document.getElementById('sgDistanciaWrap');
    const info = document.getElementById('sgInfoModoParte');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (info) {
      info.innerHTML = modo === 'distancia'
        ? 'ℹ️ Esta distancia es SOLO la parte principal. El calentamiento y el enfriamiento (abajo, en minutos) se corren en Z1 y se convierten a km con el ritmo de Z1 de cada usuario, sumándose a la distancia y al tiempo total de la sesión. El tiempo de la parte principal se calcula solo (km × el ritmo de esa zona de cada usuario) y también se suma al total: no hace falta rellenar los minutos del bloque "PARTE PRINCIPAL".'
        : 'ℹ️ Pon la duración de la parte principal en el bloque "PARTE PRINCIPAL" de más abajo (en minutos, igual que el calentamiento y el enfriamiento): la distancia que cubre en ese tiempo se calcula sola, según el ritmo real de cada usuario en esa zona -- así todos entrenan el mismo tiempo a esa intensidad, no la misma distancia.';
    }
  },

  // 🔥 v15.1: la casilla de minutos del bloque "PARTE PRINCIPAL" se deja en
  // AUTOMÁTICO cuando la parte principal se define por kilómetros (o es una
  // sesión de series): su tiempo lo calcula la app para cada atleta con su
  // ritmo en esa zona y se suma solo al total. Se deshabilita y, como pista,
  // se muestra en gris la estimación con LAS ZONAS DEL QUE CREA la sesión
  // (solo visual: no se guarda). En modo tiempo y en fuerza sigue siendo un
  // campo normal.
  _autocompletarTiempoPartePrincipal() {
    const tipo = document.getElementById('sgTipo')?.value;
    if (!tipo || tipo === 'descanso') return;
    const modo = document.getElementById('sgModoParte')?.value || 'distancia';
    const automatico = tipo === 'series' || (tipo !== 'strength' && modo === 'distancia');

    let estimacion = null;
    if (automatico && tipo !== 'series') {
      const km = parseFloat(document.getElementById('sgDistancia')?.value) || 0;
      const zonaCodigo = document.getElementById('sgZona')?.value;
      const zonas = (window.AppState && Array.isArray(AppState.lastZones)) ? AppState.lastZones : null;
      const ritmoBase = window.AppState ? AppState.lastRitmoBase : null;
      const zona = (zonas && ritmoBase) ? zonas.find(z => z[0] === zonaCodigo) : null;
      if (km > 0 && zona) estimacion = Math.max(1, Math.round(km * ritmoBase * zona[4]));
    }

    const pasosActuales = (this._editable && this._editable.detalle && this._editable.detalle.pasosDetallados) || [];
    document.querySelectorAll('#sgPasosContainer .sessgen-paso').forEach(fila => {
      const original = pasosActuales[parseInt(fila.dataset.idx, 10)];
      const titulo = (fila.querySelector('.sg-paso-titulo')?.value || '').toUpperCase();
      if ((original && original.tipoExtra) || !titulo.includes('PARTE PRINCIPAL')) return;
      const casilla = fila.querySelector('.sg-paso-min');
      if (!casilla) return;
      if (automatico) {
        if (casilla.value) casilla.dataset.prev = casilla.value;
        casilla.value = '';
        casilla.disabled = true;
        casilla.placeholder = estimacion ? `≈${estimacion}` : 'auto';
        casilla.title = (estimacion ? `Con tus zonas: ≈${estimacion} min. ` : '') + 'Se calcula solo (km × el ritmo de cada atleta en esa zona) y se suma al total de la sesión.';
        casilla.style.opacity = '0.75';
      } else {
        casilla.disabled = false;
        if (!casilla.value && casilla.dataset.prev) casilla.value = casilla.dataset.prev;
        casilla.placeholder = 'min';
        casilla.title = 'Minutos';
        casilla.style.opacity = '';
      }
    });
  },

  _actualizarModoRepSerie() {
    const modo = document.getElementById('sgSerModoRep')?.value || 'distancia';
    const distWrap = document.getElementById('sgSerDistWrap');
    const tiempoWrap = document.getElementById('sgSerTiempoWrap');
    if (distWrap) distWrap.style.display = modo === 'distancia' ? 'block' : 'none';
    if (tiempoWrap) tiempoWrap.style.display = modo === 'tiempo' ? 'block' : 'none';
  },

  // 🔥 v9: _anadirPaso ahora recibe el tipo elegido ('carrera' o 'fuerza'):
  // - carrera: se inserta justo debajo de "PARTE PRINCIPAL" (suma tiempo y
  //   distancia a la misma zona, como si fuera más parte principal)
  // - fuerza: se inserta al final, justo después del enfriamiento (solo
  //   suma tiempo total, no distancia)
  _anadirPaso(tipoExtra) {
    const cont = document.getElementById('sgPasosContainer');
    if (!cont) return;
    // El estado pasa a ser exactamente lo que hay en pantalla (en su orden). No se repinta nada.
    this._leerPasosDelDOM();
    const pasos = this._editable.detalle.pasosDetallados;

    const esCarrera = tipoExtra === 'carrera';
    // Zona por defecto del nuevo paso "carrera": la misma que la parte
    // principal actual (rodaje/tempo/largo) o la de esfuerzo (series), si
    // hay alguna seleccionada en el formulario; si no, Z2 por defecto. El
    // admin puede cambiarla luego con el selector propio del paso.
    const zonaDefecto = document.getElementById('sgZona')?.value
      || document.getElementById('sgSerZona')?.value
      || 'Z2';
    const nuevoPaso = esCarrera
      ? { icono: '🏃', titulo: 'CARRERA EXTRA', accion: '', porque: '', duracionMin: 10, tipoExtra: 'carrera', zona: zonaDefecto }
      : { icono: '💪', titulo: 'FUERZA', accion: '', porque: '', duracionMin: 10, tipoExtra: 'fuerza' };

    let pos;
    if (esCarrera) {
      // Justo debajo de "PARTE PRINCIPAL" (después se puede arrastrar a donde se quiera)
      const idxPrincipal = pasos.findIndex(p => (p.titulo || '').toUpperCase().includes('PARTE PRINCIPAL'));
      if (idxPrincipal === -1) {
        const idxEnfriamiento = pasos.findIndex(p => SessionInvites._esEnfria((p.titulo || '').toUpperCase()));
        pos = idxEnfriamiento === -1 ? pasos.length : idxEnfriamiento;
      } else {
        pos = idxPrincipal + 1;
      }
    } else {
      // Justo después del enfriamiento -> al final de la lista
      pos = pasos.length;
    }
    pasos.splice(pos, 0, nuevoPaso);

    // Se inserta solo la fila nueva en su sitio; el resto de la pantalla (y lo que se esté escribiendo) no se toca.
    const tmp = document.createElement('div');
    tmp.innerHTML = this._htmlPaso(nuevoPaso, pos).trim();
    const fila = tmp.firstElementChild;
    cont.insertBefore(fila, cont.querySelectorAll('.sessgen-paso')[pos] || null);
    this._renumerarPasos();
  },

  // 🔥 v17: tras insertar, quitar o mover una fila, el índice de cada fila (data-idx) vuelve a coincidir con su
  // posición en pantalla y en la lista de pasos. Hay que llamarlo DESPUÉS de _leerPasosDelDOM, que usa el
  // índice antiguo para recuperar el tipo y la zona originales de cada paso.
  _renumerarPasos() {
    document.querySelectorAll('#sgPasosContainer .sessgen-paso').forEach((fila, i) => {
      fila.dataset.idx = i;
      fila.querySelectorAll('[data-idx]').forEach(el => { el.dataset.idx = i; });
    });
  },

  // 🔥 v16: REORDENAR BLOQUES ARRASTRANDO. Cada bloque tiene un asa de puntos (sin emojis) a la
  // izquierda de su cabecera; al pulsarla y mover el dedo, el bloque se despega y sigue al dedo
  // mientras un hueco punteado marca dónde caerá. Cerca del borde de la pantalla la lista se
  // desplaza sola. Al soltar se reconstruye la lista en el nuevo orden (con _leerPasosDelDOM, que
  // conserva tipo, zona y demás datos de cada paso) y se vuelve a pintar. El orden es libre: sirve
  // para cualquier bloque (calentamiento, parte principal, carrera, fuerza, enfriamiento).
  _arrastrePointerDown(ev) {
    if (ev.button !== undefined && ev.button !== 0) return;
    const grip = ev.currentTarget;
    const fila = grip.closest('.sessgen-paso');
    const cont = document.getElementById('sgPasosContainer');
    if (!fila || !cont) return;
    ev.preventDefault();
    try { grip.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura: sigue por eventos de grip */ }

    // Contenedor que se desplaza (el cuerpo con overflow del modal)
    let scroller = cont.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;

    const rect = fila.getBoundingClientRect();
    const offsetY = ev.clientY - rect.top;
    const estiloPrevio = fila.getAttribute('style') || '';
    const ph = document.createElement('div');
    ph.style.cssText = `height:${rect.height}px; margin-bottom:10px; border:2px dashed var(--border-color-light); border-radius:14px; box-sizing:border-box;`;
    fila.after(ph);
    fila.style.position = 'fixed';
    fila.style.left = rect.left + 'px';
    fila.style.width = rect.width + 'px';
    fila.style.top = rect.top + 'px';
    fila.style.margin = '0';
    fila.style.zIndex = '10000';
    fila.style.boxShadow = '0 10px 28px rgba(0,0,0,0.4)';
    fila.style.opacity = '0.96';
    fila.style.boxSizing = 'border-box';
    // Si algún contenedor del modal tiene transform (animación), «fixed» se mide respecto a él y no a
    // la pantalla: se mide el desfase real y se corrige para que el bloque quede justo bajo el dedo.
    const r2 = fila.getBoundingClientRect();
    const corrX = r2.left - rect.left, corrY = r2.top - rect.top;
    if (corrX) fila.style.left = (rect.left - corrX) + 'px';

    let y = ev.clientY;
    let raf = null;
    const colocar = () => {
      fila.style.top = (y - offsetY - corrY) + 'px';
      // Posición del hueco: delante del primer bloque cuyo centro quede por debajo del dedo
      const otros = [...cont.querySelectorAll('.sessgen-paso')].filter(f => f !== fila);
      let destino = null;
      for (const h of otros) {
        const r = h.getBoundingClientRect();
        if (y < r.top + r.height / 2) { destino = h; break; }
      }
      if (destino) { if (ph.nextElementSibling !== destino) cont.insertBefore(ph, destino); }
      else if (cont.lastElementChild !== ph) cont.appendChild(ph);
    };
    const tick = () => {
      if (scroller) {
        const sr = scroller.getBoundingClientRect();
        const zona = 70;
        if (y < sr.top + zona) scroller.scrollTop -= Math.ceil((sr.top + zona - y) / 5);
        else if (y > sr.bottom - zona) scroller.scrollTop += Math.ceil((y - (sr.bottom - zona)) / 5);
      }
      colocar();
      raf = requestAnimationFrame(tick);
    };
    const mover = (e) => { y = e.clientY; };
    const soltar = () => {
      cancelAnimationFrame(raf);
      grip.removeEventListener('pointermove', mover);
      grip.removeEventListener('pointerup', soltar);
      grip.removeEventListener('pointercancel', soltar);
      try { grip.releasePointerCapture(ev.pointerId); } catch (e) { /* ya liberado */ }
      fila.setAttribute('style', estiloPrevio);
      cont.insertBefore(fila, ph);
      ph.remove();
      // La fila ya está en su nuevo sitio en pantalla: solo se actualiza la lista (sin repintar el modal).
      this._leerPasosDelDOM();
      this._renumerarPasos();
    };
    grip.addEventListener('pointermove', mover);
    grip.addEventListener('pointerup', soltar);
    grip.addEventListener('pointercancel', soltar);
    raf = requestAnimationFrame(tick);
  },

  _quitarPaso(btn) {
    const fila = btn && btn.closest ? btn.closest('.sessgen-paso') : null;
    const cont = document.getElementById('sgPasosContainer');
    if (!fila || !cont) return;
    this._leerPasosDelDOM();
    const pos = [...cont.querySelectorAll('.sessgen-paso')].indexOf(fila);
    if (pos < 0) return;
    this._editable.detalle.pasosDetallados.splice(pos, 1);
    fila.remove();
    this._renumerarPasos();
  },

  // 🔥 v9: se preserva p.tipoExtra (carrera/fuerza) al reconstruir la lista
  // desde el DOM -- antes se perdía en cada _leerPasosDelDOM() porque solo
  // se leían los campos visibles del formulario (icono/título/acción/
  // porqué/minutos), no el marcador interno de tipo de paso.
  // 🔥 v10: además de tipoExtra, se lee/preserva p.zona (el selector propio
  // de zona de los pasos "carrera").
  _leerPasosDelDOM() {
    const filas = document.querySelectorAll('#sgPasosContainer .sessgen-paso');
    const pasosActuales = this._editable.detalle.pasosDetallados || [];
    const pasos = [];
    filas.forEach(fila => {
      const minInput = fila.querySelector('.sg-paso-min');
      const zonaInput = fila.querySelector('.sg-paso-zona');
      const idxOriginal = parseInt(fila.dataset.idx, 10);
      const original = pasosActuales[idxOriginal];
      const paso = {
        icono: fila.querySelector('.sg-paso-icono')?.value || '📌',
        titulo: fila.querySelector('.sg-paso-titulo')?.value || '',
        accion: fila.querySelector('.sg-paso-accion')?.value || '',
        porque: fila.querySelector('.sg-paso-porque')?.value || '',
        duracionMin: minInput ? (parseInt(minInput.value) || 0) : undefined
      };
      if (original && original.tipoExtra) paso.tipoExtra = original.tipoExtra;
      if (zonaInput) paso.zona = zonaInput.value;
      else if (original && original.zona) paso.zona = original.zona;
      pasos.push(paso);
    });
    if (filas.length > 0) this._editable.detalle.pasosDetallados = pasos;
  },

  // 🔥 MODIFICADO: se leen los minutos de todos los pasos
  _leerPaso1() {
    this._editable.tipo = document.getElementById('sgTipo').value;
    const d = this._editable.detalle;

    if (this._editable.tipo === 'descanso') {
      d.nombre = 'Descanso';
      d.sensacion = '';
      d.objetivo = '';
      d.porque = '';
      d.modoPartePrincipal = 'distancia';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      d.zona = null;
      d.pasosDetallados = [];
      return;
    }

    d.nombre = document.getElementById('sgNombre').value.trim();
    d.sensacion = document.getElementById('sgSensacion').value.trim();
    d.objetivo = document.getElementById('sgObjetivo').value.trim();
    d.porque = document.getElementById('sgPorque').value.trim();
    this._leerPasosDelDOM();

    // Extraemos calentamiento y enfriamiento para compatibilidad con otras partes
    d.calentamientoMin = 0;
    d.enfriamientoMin = 0;
    d.pasosDetallados.forEach(p => {
      const tit = (p.titulo || '').toUpperCase();
      if (SessionInvites._esCalent(tit)) d.calentamientoMin = p.duracionMin || 0;
      else if (SessionInvites._esEnfria(tit)) d.enfriamientoMin = p.duracionMin || 0;
    });

    if (this._editable.tipo === 'strength') {
      d.modoPartePrincipal = 'tiempo';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      d.zona = null;
      return;
    }

    if (this._editable.tipo === 'series') {
      d.seriesConfig = {
        numBloques: parseInt(document.getElementById('sgSerBloques').value) || 1,
        numSeries: parseInt(document.getElementById('sgSerRepeticiones').value) || 1,
        modoRep: document.getElementById('sgSerModoRep').value,
        distRepM: parseFloat(document.getElementById('sgSerDistM').value) || 0,
        tiempoRepSeg: parseFloat(document.getElementById('sgSerTiempoSeg').value) || 0,
        zonaEsfuerzo: document.getElementById('sgSerZona').value,
        descansoRepSeg: parseFloat(document.getElementById('sgSerDescansoRep').value) || 0,
        descansoBloqueMin: parseFloat(document.getElementById('sgSerDescansoBloque').value) || 0
      };
      d.zona = d.seriesConfig.zonaEsfuerzo;
      d.modoPartePrincipal = 'distancia';
      d.distanciaEstimada = 0;
      d.duracionPartePrincipalMin = 0;
      return;
    }

    d.modoPartePrincipal = document.getElementById('sgModoParte').value;
    d.distanciaEstimada = parseFloat(document.getElementById('sgDistancia').value) || 0;
    d.zona = document.getElementById('sgZona').value;
  },

  _renderPaso2Calendario() {
    const { modal } = this._crearOverlayModal('sessGen');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">📅 ${this._modoPack ? 'DÍA DE LA SESIÓN · PASO 2/2' : 'ELIGE LOS DÍAS · PASO 2/3'}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:1px;">📅 SELECCIONA LOS DÍAS</label>
        <p style="font-size:12px; color:var(--text-secondary); text-align:center; margin:2px 0 12px; line-height:1.4;">
          ${this._modoPack ? 'Elige el día (o los días) de esta sesión. Los tachados ya tienen otra sesión en el pack.' : 'Puedes elegir varios días para esta misma sesión (toca para marcar/desmarcar cada uno).'}
        </p>
        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; box-shadow:var(--shadow-sm);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <button onclick="SessionInvites._cambiarMes(-1)" style="background:rgba(192,160,96,0.12); border:1.5px solid var(--gold); color:var(--gold); border-radius:14px; width:38px; height:38px; cursor:pointer; font-size:16px; font-weight:600;">‹</button>
            <span id="sgMesLabel" style="font-weight:600; letter-spacing:1px; color:var(--text-primary);"></span>
            <button onclick="SessionInvites._cambiarMes(1)" style="background:rgba(192,160,96,0.12); border:1.5px solid var(--gold); color:var(--gold); border-radius:14px; width:38px; height:38px; cursor:pointer; font-size:16px; font-weight:600;">›</button>
          </div>
          <div id="sgCalendarioGrid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;"></div>
        </div>
        <div id="sgFechaElegidaTxt" style="text-align:center; margin-top:14px; padding:12px; border-radius:14px; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); font-weight:600; font-size:14px; line-height:1.5; min-height:20px; transition:all 0.15s ease;"></div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._renderPaso1())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgContinuarPaso2Btn" class="action-button" style="width:auto; padding:0 32px; margin:0;" disabled>${this._modoPack ? 'AÑADIR AL PACK ✓' : 'CONTINUAR →'}</button>
      </div>
    `;
    this._renderizarMesCalendario();
    this._actualizarTextoFechas();
    // 🔥 v15: al editar una sesión de un pack llegan días ya marcados -- el botón no puede quedarse deshabilitado
    { const btnInicial = document.getElementById('sgContinuarPaso2Btn'); if (btnInicial) btnInicial.disabled = this._fechasSeleccionadas.size === 0; }
    // 🔥 Se lanzan las dos precargas (usuarios Y grupos) nada más entrar en
    // el Paso 2, en paralelo, mientras el admin todavía está eligiendo los
    // días en el calendario -- así, para cuando llegue al Paso 3, lo normal
    // es que las dos ya estén en caché y esa pantalla aparezca ya cargada
    // de una vez, sin ningún salto al ir apareciendo cada cosa por separado.
    this._precargarUsuarios();
    this._precargarGrupos();
    document.getElementById('sgContinuarPaso2Btn').addEventListener('click', async () => {
      if (!this._fechasSeleccionadas.size) return;
      if (this._modoPack) { this._guardarSesionEnPack(); return; }
      const btn = document.getElementById('sgContinuarPaso2Btn');
      if (!this._usuariosTodos || !this._gruposTodos) {
        if (btn) btn.disabled = true;
        await Promise.all([this._precargarUsuarios(), this._precargarGrupos()]);
        if (btn) btn.disabled = false;
      }
      this._transicionarPaso(() => this._renderPaso3Usuarios());
    });
  },

  // 🔥 El admin puede elegir entre TODOS los usuarios, como siempre. Un
  // entrenador (no admin) solo puede enviar sesiones a sus ALUMNOS
  // ACEPTADOS -- ya no basta con ser amigos: cada amigo tiene que haber
  // aceptado expresamente la invitación de "ser su alumno" (ver
  // Friends.cargarPanelAlumnos / Storage.acceptTrainerRequest en
  // friends.js/storage.js). Antes esto partía directamente de friendIds,
  // así que un entrenador podía enviarle sesiones a cualquier amigo suyo
  // sin pedirle permiso, aunque ese amigo solo quisiera ser su amigo en
  // la app y no que le entrenara. Sigue habiendo una capa extra de
  // seguridad real (no solo de UI): las reglas de Firestore no dejan a un
  // no-admin leer usuarios que no sean sus alumnosAceptados, así que una
  // consulta sin filtro a toda la colección 'users' fallaría directamente
  // (permission-denied) para un entrenador. Aquí se parte de la propia
  // lista de alumnosAceptados (que sí puede leer, es su propio documento)
  // y se piden esos usuarios por lotes de hasta 30 (límite de Firestore
  // para el operador 'in').
  _precargarUsuarios() {
    if ((this._usuariosTodos && !this._usuariosErrorCarga) || this._precargaUsuariosPromise) return this._precargaUsuariosPromise;
    this._usuariosErrorCarga = false;

    if (AppState.isAdmin) {
      this._precargaUsuariosPromise = firebaseServices.db.collection('users').orderBy('username_lowercase').get()
        .then(snapshot => {
          this._usuariosTodos = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        })
        .catch(e => {
          console.error('Error cargando usuarios para invitar:', e);
          this._usuariosTodos = [];
          this._usuariosErrorCarga = true;
        })
        .finally(() => { this._precargaUsuariosPromise = null; });
      return this._precargaUsuariosPromise;
    }

    this._precargaUsuariosPromise = (async () => {
      const miUid = AppState.currentUserId;
      const claveCache = 'ri5_destinatarios_' + miUid;
      const esperar = ms => new Promise(r => setTimeout(r, ms));
      // 🔥 v483: la lista de destinatarios NO puede quedarse vacía por un fallo puntual.
      // Cada paso tiene salida alternativa: ids de atletas (servidor -> AppState en
      // tiempo real -> copia local) y datos de cada atleta (servidor con 3 intentos ->
      // caché de Firestore -> copia local del último dato bueno).
      let copiaLocal = {};
      try { copiaLocal = JSON.parse(localStorage.getItem(claveCache) || '{}') || {}; } catch (e) { copiaLocal = {}; }

      let idsAtletas = null;
      try {
        const miDoc = await firebaseServices.db.collection('users').doc(miUid).get();
        if (miDoc.exists) idsAtletas = miDoc.data()?.alumnosAceptados || [];
      } catch (e) { console.warn('Destinatarios: no se pudo leer mi documento, se usa el estado en vivo:', e); }
      if (idsAtletas === null) {
        const enVivo = AppState.currentUserData?.alumnosAceptados || AppState._alumnosAceptadosPrevios;
        idsAtletas = Array.isArray(enVivo) ? enVivo : (copiaLocal.ids || []);
      }
      idsAtletas = [...new Set(idsAtletas.filter(id => id && id !== miUid))];
      this._numAlumnosIds = idsAtletas.length;

      const leerUsuario = async (uid) => {
        for (let intento = 0; intento < 3; intento++) {
          try {
            const d = await firebaseServices.db.collection('users').doc(uid).get();
            return d.exists ? { uid: d.id, ...d.data() } : null;
          } catch (e) {
            if (intento < 2) await esperar(500 * (intento + 1));
            else console.warn('Destinatarios: no se pudo leer', uid, e);
          }
        }
        try {
          const d = await firebaseServices.db.collection('users').doc(uid).get({ source: 'cache' });
          if (d.exists) return { uid: d.id, ...d.data() };
        } catch (e) { /* sin caché de Firestore */ }
        const c = (copiaLocal.usuarios || {})[uid];
        return c ? { uid, ...c } : null;
      };

      const todosIds = [miUid, ...idsAtletas];
      const usuarios = [];
      for (let i = 0; i < todosIds.length; i += 10) {
        const res = await Promise.all(todosIds.slice(i, i + 10).map(leerUsuario));
        res.forEach(u => { if (u) usuarios.push(u); });
      }
      usuarios.sort((a, b) => (a.uid === miUid ? -1 : b.uid === miUid ? 1 : 0)
        || (a.username_lowercase || '').localeCompare(b.username_lowercase || ''));
      this._usuariosTodos = usuarios;
      // Solo es fallo real si había atletas y no se ha podido sacar NINGUNO de ellos.
      if (idsAtletas.length && !usuarios.some(u => u.uid !== miUid)) this._usuariosErrorCarga = true;

      // Copia local del último dato bueno (solo lo necesario para pintar la lista)
      if (usuarios.length) {
        try {
          const mini = {};
          usuarios.forEach(u => { mini[u.uid] = { username: u.username, username_lowercase: u.username_lowercase, profile: { photoURL: u.profile?.photoURL || null } }; });
          localStorage.setItem(claveCache, JSON.stringify({ ids: idsAtletas, usuarios: mini }));
        } catch (e) { /* almacenamiento lleno o bloqueado: no pasa nada */ }
      }
    })().catch(e => {
      console.error('Error cargando alumnos para invitar:', e);
      this._usuariosTodos = this._usuariosTodos || [];
      this._usuariosErrorCarga = true;
    }).finally(() => { this._precargaUsuariosPromise = null; });
    return this._precargaUsuariosPromise;
  },

  // 🔥 Invalida la lista cacheada de "usuarios a los que puedo mandar
  // sesión" (_usuariosTodos) y la vuelve a pedir en segundo plano. Para
  // un entrenador (no admin) esa lista sale de alumnosAceptados (ver
  // _precargarUsuarios más arriba), y una vez cargada se quedaba en
  // memoria hasta cerrar/recargar la app -- así que un alumno recién
  // aceptado no aparecía como destinatario en "Generar sesión" hasta
  // entonces, aunque "Mis alumnos" sí se refrescara. Se llama desde
  // AppState.iniciarListeners() (app.js) justo cuando alumnosAceptados
  // cambia en tiempo real, con el mismo criterio que ya usa
  // Friends.cargarPanelAlumnos(true) ahí (solo aplica a entrenador no
  // admin: el admin ya parte de TODOS los usuarios, sin filtrar por
  // alumnos, así que su lista no necesita invalidarse).
  // 🔥 v487: al cerrar sesión se vacían las listas en memoria (atletas y grupos). Antes seguían
  // en memoria tras cerrar sesión (la app no se recarga), así que al volver a entrar, aunque
  // fuera con otra cuenta, se veía la misma lista de antes -- incluido un fallo ya cacheado.
  limpiarCacheSesion() {
    this._usuariosTodos = null;
    this._gruposTodos = null;
    this._usuariosErrorCarga = false;
    this._numAlumnosIds = null;
    this._precargaUsuariosPromise = null;
    this._precargaGruposPromise = null;
  },

  // 🔥 v484: reintento automático y silencioso (1s, 2s, 3s... tope 5s) hasta que la lista
  // de destinatarios cargue. Se detiene solo si se cierra el paso 3. Nunca hay botón ni error.
  async _autoReintentarUsuarios() {
    if (this._reintentandoUsuarios) return;
    this._reintentandoUsuarios = true;
    try {
      for (let n = 1; this._usuariosErrorCarga; n++) {
        await new Promise(r => setTimeout(r, Math.min(n, 5) * 1000));
        if (!document.getElementById('sgUsuariosList')) break;
        this._usuariosErrorCarga = false;
        this._usuariosTodos = null;
        await this._precargarUsuarios();
        if (!this._usuariosErrorCarga) {
          const term = (document.getElementById('sgUsuariosBuscar')?.value || '').trim().toLowerCase();
          this._renderizarListaUsuarios(!term ? this._usuariosTodos : this._usuariosTodos.filter(u => (u.username || '').toLowerCase().includes(term)), true);
          if (document.getElementById('sgGruposList') && this._gruposTodos) this._renderizarGrupos();
        }
      }
    } finally {
      this._reintentandoUsuarios = false;
    }
  },

  invalidarCacheUsuarios() {
    this._usuariosTodos = null;
    this._precargarUsuarios();
  },

  _precargarGrupos() {
    if (this._gruposTodos || this._precargaGruposPromise) return this._precargaGruposPromise;
    this._precargaGruposPromise = firebaseServices.db.collection('sessionGroups')
      .where('createdBy', '==', AppState.currentUserId)
      .get()
      .then(snapshot => {
        this._gruposTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      })
      .catch(e => {
        console.error('Error cargando grupos:', e);
        this._gruposTodos = [];
      })
      .finally(() => { this._precargaGruposPromise = null; });
    return this._precargaGruposPromise;
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
    let offset = primerDia.getDay() - 1;
    if (offset < 0) offset = 6;
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div style="text-align:center; font-size:10px; color:var(--text-secondary); padding:4px 0;">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) html += '<div style="padding:10px 0; font-size:14px; border:1px solid transparent;" aria-hidden="true"></div>';

    const hoyKey = this._dateKey(new Date());
    const diasOcupados = this._diasOcupadosPack();
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(year, month, dia);
      const key = this._dateKey(fecha);
      const esHoy = key === hoyKey;
      const esSeleccionado = this._fechasSeleccionadas.has(key);
      const ocupado = diasOcupados.has(key);
      html += `
        <div onclick="SessionInvites._elegirDia(${year},${month},${dia})" style="
          text-align:center; padding:10px 0; border-radius:14px; cursor:${ocupado ? 'not-allowed' : 'pointer'}; font-size:14px; opacity:${ocupado ? '0.3' : '1'}; text-decoration:${ocupado ? 'line-through' : 'none'};
          background:${esSeleccionado ? 'var(--gold)' : 'var(--bg-primary)'};
          color:${esSeleccionado ? '#000' : 'var(--text-primary)'};
          border:1px solid ${esSeleccionado ? 'var(--gold)' : (esHoy ? 'var(--gold)' : 'var(--border-color)')};
          box-shadow:${esSeleccionado ? '0 2px 6px rgba(192,160,96,0.35)' : 'none'};
          font-weight:${esHoy || esSeleccionado ? 'bold' : 'normal'};
          transition:all 0.15s ease;
        ">${dia}</div>`;
    }
    // Altura FIJA del calendario: un mes ocupa entre 4 y 6 filas según cómo caiga, y eso
    // hacía que el modal creciera y encogiera al cambiar de mes. Se rellena siempre hasta
    // 42 casillas (6 filas) con huecos invisibles del mismo tamaño que un día.
    const huecoFinal = Math.max(0, 42 - offset - diasEnMes);
    for (let i = 0; i < huecoFinal; i++) {
      html += '<div style="padding:10px 0; font-size:14px; border:1px solid transparent; visibility:hidden;" aria-hidden="true">0</div>';
    }
    grid.innerHTML = html;
  },

  _elegirDia(year, month, dia) {
    const fecha = new Date(year, month, dia);
    const key = this._dateKey(fecha);
    if (this._diasOcupadosPack().has(key)) {
      Utils.showToast('Ese día ya tiene otra sesión en el pack', 'warning');
      return;
    }
    if (this._fechasSeleccionadas.has(key)) this._fechasSeleccionadas.delete(key);
    else this._fechasSeleccionadas.add(key);
    this._renderizarMesCalendario();
    this._actualizarTextoFechas();
    const btn = document.getElementById('sgContinuarPaso2Btn');
    if (btn) btn.disabled = this._fechasSeleccionadas.size === 0;
  },

  _actualizarTextoFechas() {
    const txt = document.getElementById('sgFechaElegidaTxt');
    if (!txt) return;
    const n = this._fechasSeleccionadas.size;
    if (n === 0) {
      txt.style.color = 'var(--text-secondary)';
      txt.style.borderColor = 'var(--border-color)';
      txt.style.background = 'transparent';
      txt.textContent = 'No has marcado ningún día todavía.';
      return;
    }
    const fechasTxt = Array.from(this._fechasSeleccionadas)
      .sort()
      .map(key => new Date(key + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
    const cabecera = n === 1 ? 'Has seleccionado el día:' : `Has seleccionado estos ${n} días:`;
    txt.style.color = 'var(--gold)';
    txt.style.borderColor = 'var(--gold)';
    txt.style.background = 'rgba(192,160,96,0.10)';
    txt.innerHTML = `${cabecera}<br>${fechasTxt.join(' · ')}`;
  },

  async _renderPaso3Usuarios() {
    this._asegurarEstiloHistorial(); // inyecta las keyframes riSkeletonPulse/riFadeInUp si no estaban ya
    const { modal } = this._crearOverlayModal('sessGen');

    // 🔥 Si el Paso 2 ya terminó de precargar usuarios y grupos (lo normal:
    // ese paso espera a las dos precargas antes de dejar continuar), esta
    // pantalla se pinta entera desde el primer fotograma, sin placeholders
    // ni esqueleto -- aparece "ya cargada", sin ningún salto de tamaño. El
    // esqueleto de abajo es solo un remate defensivo para el caso raro en
    // que, aun así, alguna de las dos no esté lista todavía.
    const usuariosListos = !!this._usuariosTodos;
    const gruposListos = !!this._gruposTodos;
    // 🔥 Grupos abiertos también a entrenadores (antes solo admin): cada
    // grupo ya se guarda con su propio 'createdBy' y se filtra por
    // 'createdBy == AppState.currentUserId' en _precargarGrupos() -- así
    // que un entrenador ve y gestiona SOLO los suyos, nunca los de otro
    // entrenador ni los del admin. Sus miembros salen de su propia lista
    // de ALUMNOS ACEPTADOS (ver _precargarUsuarios más arriba), igual que
    // ya pasa al enviar una sesión directamente sin grupo -- si un alumno
    // revoca su aceptación después de haber sido metido en un grupo, el
    // filtro de seguridad de _confirmarEnvio lo descarta igualmente al
    // enviar, aunque siga apareciendo en el grupo hasta que se edite.
    const puedeUsarGrupos = !!(AppState.isAdmin || AppState.isTrainer);

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">👥 ${this._modoPack ? 'ENVIAR PACK · ELIGE USUARIOS' : 'ELIGE USUARIOS · PASO 3/3'}</span>
        <!-- 🔥 Contador de seleccionados: va en la cabecera fija (fuera del
             área con scroll) para que se vea siempre mientras se baja por
             la lista de usuarios, sin tener que mirar el botón de abajo. -->
        <div style="margin-top:6px;">
          <span id="sgContadorSeleccionados" style="display:inline-block; font-size:12px; font-weight:600; letter-spacing:0.5px; color:var(--gold); background:rgba(192,160,96,0.12); border:1px solid var(--gold); border-radius:20px; padding:3px 14px;">0 seleccionados</span>
        </div>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        ${puedeUsarGrupos ? `
          <div style="margin-bottom:16px;">
            <button onclick="SessionInvites._abrirGestionGrupos()" style="display:block; width:100%; background:transparent; border:none; padding:4px 0 12px; margin:0; font-family:inherit; font-size:16px; font-weight:600; letter-spacing:1px; color:var(--text-primary); text-align:center; cursor:pointer;">GESTIONAR GRUPOS</button>
            <div id="sgGruposList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(88px, 1fr)); gap:10px;">${gruposListos ? '' : this._skeletonGrupos()}</div>
          </div>
        ` : ''}
        <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">🔎 BUSCA Y MARCA A QUIÉN ENVIAR</label>
        <input id="sgUsuariosBuscar" placeholder="BUSCAR USUARIO" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="sgUsuariosList">${usuariosListos ? '' : this._skeletonUsuarios()}</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._transicionarPaso(() => SessionInvites._volverDesdeUsuarios())" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent;">← ATRÁS</button>
        <button id="sgEnviarBtn" class="action-button" style="width:auto; padding:0 32px; margin:0;">ENVIAR (<span id="sgCountSeleccionados">0</span>)</button>
      </div>
    `;

    this._actualizarContadorSeleccionados();

    if (usuariosListos) {
      this._renderizarListaUsuarios(this._usuariosTodos);
    } else {
      this._precargarUsuarios().then(() => {
        this._renderizarListaUsuarios(this._usuariosTodos, true);
      });
    }

    if (puedeUsarGrupos) {
      if (gruposListos) {
        this._renderizarGrupos();
      } else {
        this._precargarGrupos().then(() => this._renderizarGrupos(true));
      }
    }

    document.getElementById('sgUsuariosBuscar').addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
        (u.username || '').toLowerCase().includes(term)
      );
      this._renderizarListaUsuarios(filtrados);
    });

    document.getElementById('sgEnviarBtn').addEventListener('click', () => this._confirmarEnvio());
  },

  // Filas grises pulsantes con la altura real de una tarjeta de usuario,
  // para que si hace falta mostrarlas no cambien de tamaño al swapear por
  // las de verdad (mismo patrón que ya usa "Últimas sesiones creadas").
  _skeletonUsuarios() {
    // 🔥 v486: en vez de filas grises, el texto CARGANDO con las letras de colores de nivel
    // (misma paleta que la animación de carga de la app), con un pulso suave.
    const colores = ['#9e9e9e', '#7fa1c9', '#6bb3ae', '#7fb37a', '#a9bd6a', '#cbb15f', '#cf9760', '#c97b5f', '#bd6688'];
    const letras = 'CARGANDO'.split('').map((ch, i) => `<span style="color:${colores[i % colores.length]};">${ch}</span>`).join('');
    return `<div style="text-align:center; padding:36px 0; font-family:inherit; font-size:16px; font-weight:600; letter-spacing:4px; animation:riSkeletonPulse 1.2s ease-in-out infinite;">${letras}</div>`;
  },

  // Igual que arriba pero para las tarjetas cuadradas de grupos.
  _skeletonGrupos(n = 3) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div style="height:74px; border-radius:14px; background:var(--stat-bg); border:1px solid var(--border-color); animation:riSkeletonPulse 1.2s ease-in-out infinite; animation-delay:${(i * 0.15).toFixed(2)}s;"></div>`;
    }
    return html;
  },

  _renderizarListaUsuarios(usuarios, animar = false) {
    const container = document.getElementById('sgUsuariosList');
    if (!container) return;
    // 🔥 v484: nunca se muestra error ni botón: si la carga falló, se ve el esqueleto
    // de carga y se reintenta sola, en silencio, hasta que la lista llegue.
    if (this._usuariosErrorCarga) {
      container.innerHTML = this._skeletonUsuarios();
      this._autoReintentarUsuarios();
      return;
    }
    if (usuarios.length === 0) {
      // 🔥 Si un entrenador (no admin) todavía no tiene ningún alumno
      // aceptado, "Sin resultados" confundía (parecía un fallo de
      // búsqueda). Se distingue ese caso de una búsqueda sin coincidencias.
      // 🔥 v483: solo se dice "no tienes ningún atleta" si de verdad hay 0 ids aceptados
      const sinAlumnosTodavia = !AppState.isAdmin && this._numAlumnosIds === 0;
      container.innerHTML = sinAlumnosTodavia
        ? '<p style="text-align:center; color:var(--text-secondary); padding:20px; line-height:1.5;">Todavía no tienes ningún atleta. Ve a Perfil → 📋 Entrenador → Mis atletas e invita a tus amigos; solo podrás enviarles sesiones cuando acepten.</p>'
        : '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    container.innerHTML = usuarios.map((u, idx) => {
      const marcado = this._usuariosSeleccionados.has(u.uid);
      const nombreMostrado = Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'))
        + (u.uid === AppState.currentUserId ? ' (TÚ)' : '');
      const inicial = Utils.escapeHTML(((u.username || '?').trim().charAt(0) || '?').toUpperCase());
      // 🔥 Avatar = foto de perfil real del usuario (redondel pulsable), y
      // solo si no tiene foto se cae de vuelta a la inicial de su nombre --
      // antes aquí siempre iba la inicial, nunca la foto.
      const photoURL = u.profile?.photoURL || null;
      const avatar = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; cursor:pointer; border:2px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};">`
        : `<div style="
            width:34px; height:34px; border-radius:50%; flex-shrink:0; cursor:pointer;
            background:${marcado ? 'var(--gold)' : 'var(--bg-primary)'};
            border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
            color:${marcado ? '#000' : 'var(--text-secondary)'};
            display:flex; align-items:center; justify-content:center;
            font-weight:600; font-size:14px;
          ">${inicial}</div>`;
      const animStyle = animar ? `animation:riFadeInUp 0.3s ease both; animation-delay:${(Math.min(idx, 9) * 0.03).toFixed(2)}s;` : '';
      return `
        <div onclick="SessionInvites._toggleUsuario('${u.uid}')" style="
          display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:8px;
          background:${marcado ? 'rgba(192,160,96,0.12)' : 'var(--stat-bg)'};
          border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
          border-left:4px solid ${marcado ? 'var(--gold)' : 'var(--border-color-light)'};
          border-radius:14px; cursor:pointer; box-shadow:var(--shadow-sm);
          transition:all 0.15s ease; ${animStyle}
        ">
          ${avatar}
          <div style="flex:1;">
            <div style="font-size:14px; color:var(--text-primary); font-weight:${marcado ? 'bold' : 'normal'};">${nombreMostrado}</div>
          </div>
          <span style="font-size:20px; flex-shrink:0;">${marcado ? '☑️' : '⬜'}</span>
        </div>`;
    }).join('');
  },

  // Mantiene sincronizados los dos contadores de seleccionados: el chip
  // fijo de la cabecera (visible aunque se baje por la lista) y el número
  // dentro del botón ENVIAR del pie.
  _actualizarContadorSeleccionados() {
    const n = this._usuariosSeleccionados.size;
    const chip = document.getElementById('sgContadorSeleccionados');
    if (chip) chip.textContent = `${n} seleccionado${n === 1 ? '' : 's'}`;
    const countEl = document.getElementById('sgCountSeleccionados');
    if (countEl) countEl.textContent = n;
  },

  _toggleUsuario(uid) {
    if (this._usuariosSeleccionados.has(uid)) this._usuariosSeleccionados.delete(uid);
    else this._usuariosSeleccionados.add(uid);
    const term = document.getElementById('sgUsuariosBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term)
    );
    this._renderizarListaUsuarios(filtrados);
    // 🔥 FIX (petición del usuario): marcar/desmarcar un usuario A MANO
    // puede completar o romper el "todos marcados" de un grupo al que
    // pertenezca (p.ej. si ya tenías 4 de 5 miembros de un grupo
    // marcados uno a uno y este era el 5º, o si desmarcas el único que
    // faltaba para que un grupo dejara de estar completo) -- antes esta
    // función nunca volvía a pintar las tarjetas de grupos, así que se
    // quedaban con el color/estado de la última vez que se tocó un
    // grupo directamente, sin reflejar los cambios hechos a mano.
    this._renderizarGrupos();
    this._actualizarContadorSeleccionados();
  },

  // Pinta los grupos del admin como tarjetas cuadradas en una rejilla (no
  // como píldoras en una fila continua), para que cada grupo se vea como
  // su propio bloque bien separado -- más fácil de distinguir de un
  // vistazo que tenerlos todos pegados unos a otros. Una tarjeta se marca
  // en dorado cuando TODOS sus miembros (los que sigan existiendo en
  // _usuariosTodos) ya están seleccionados en la lista de abajo. Pulsarla
  // marca de golpe a todos sus miembros; volver a pulsarla (con todos ya
  // marcados) los desmarca de golpe -- así sirve tanto para añadir el
  // grupo entero como para quitarlo entero sin tener que ir uno a uno.
  _renderizarGrupos(animar = false) {
    const cont = document.getElementById('sgGruposList');
    if (!cont) return;
    const grupos = this._gruposTodos || [];
    if (grupos.length === 0) {
      cont.innerHTML = '<span style="font-size:12px; color:var(--text-secondary);">Aún no tienes grupos creados. Pulsa "Gestionar" para crear el primero.</span>';
      return;
    }
    cont.innerHTML = grupos.map((g, idx) => {
      const miembrosValidos = (g.members || []).filter(uid => this._usuariosTodos.some(u => u.uid === uid));
      const todosMarcados = miembrosValidos.length > 0 && miembrosValidos.every(uid => this._usuariosSeleccionados.has(uid));
      const animStyle = animar ? `animation:riFadeInUp 0.3s ease both; animation-delay:${(idx * 0.05).toFixed(2)}s;` : '';
      return `
        <div onclick="SessionInvites._toggleGrupo('${g.id}')" style="
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
          cursor:pointer; text-align:center; padding:12px 6px;
          background:${todosMarcados ? 'var(--gold)' : 'var(--stat-bg)'};
          color:${todosMarcados ? '#000' : 'var(--text-primary)'};
          border:1px solid ${todosMarcados ? 'var(--gold)' : 'var(--border-color)'};
          border-radius:14px; box-shadow:var(--shadow-sm);
          transition:all 0.15s ease; ${animStyle}
        ">
          <span style="font-size:20px;">📁</span>
          <span style="font-size:12px; font-weight:600; line-height:1.2; word-break:break-word;">${Utils.escapeHTML(g.name)}</span>
          <span style="font-size:10px; opacity:0.8;">${miembrosValidos.length} miembro(s)</span>
        </div>`;
    }).join('');
  },

  _toggleGrupo(id) {
    const grupo = (this._gruposTodos || []).find(g => g.id === id);
    if (!grupo) return;
    const miembrosValidos = (grupo.members || []).filter(uid => this._usuariosTodos.some(u => u.uid === uid));
    const todosMarcados = miembrosValidos.length > 0 && miembrosValidos.every(uid => this._usuariosSeleccionados.has(uid));
    if (todosMarcados) {
      // 🔥 FIX (petición del usuario): antes, desmarcar este grupo
      // quitaba TODOS sus miembros sin más -- si un miembro también
      // pertenecía a otro grupo que tenías marcado por completo, ese
      // otro grupo se quedaba roto (ya no "100% marcado") sin que lo
      // hubieras tocado. Ahora, un miembro solo se quita si NINGÚN otro
      // grupo actualmente completo lo necesita.
      const otrosGrupos = (this._gruposTodos || []).filter(g => g.id !== id);
      miembrosValidos.forEach(uid => {
        const loNecesitaOtroGrupoCompleto = otrosGrupos.some(g => {
          const miembrosOtro = (g.members || []).filter(u2 => this._usuariosTodos.some(u => u.uid === u2));
          return miembrosOtro.length > 0
            && miembrosOtro.includes(uid)
            && miembrosOtro.every(u2 => this._usuariosSeleccionados.has(u2));
        });
        if (!loNecesitaOtroGrupoCompleto) this._usuariosSeleccionados.delete(uid);
      });
    } else {
      miembrosValidos.forEach(uid => this._usuariosSeleccionados.add(uid));
    }

    const term = document.getElementById('sgUsuariosBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term)
    );
    this._renderizarListaUsuarios(filtrados);
    this._renderizarGrupos();
    this._actualizarContadorSeleccionados();
  },

  // ============================================================
  // GESTIÓN DE GRUPOS (crear / editar / eliminar)
  // ============================================================

  _abrirGestionGrupos() {
    const { modal } = this._crearOverlayModal('sessGroups');
    modal.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">📁 GESTIONAR GRUPOS</span>
      </div>
      <div id="sgGruposGestionList" style="padding:16px 20px; overflow-y:auto; flex:1;">⏳ Cargando...</div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; flex-direction:column; gap:10px;">
        <button onclick="SessionInvites._abrirFormularioGrupo()" class="action-button" style="width:100%; margin:0;">CREAR GRUPO</button>
        <button onclick="SessionInvites._cerrarModal('sessGroups')" class="action-button" style="width:100%; margin:0; background:transparent; border:1px solid var(--border-color-light);">CERRAR</button>
      </div>
    `;
    this._renderizarGestionGrupos();
  },

  async _renderizarGestionGrupos() {
    const cont = document.getElementById('sgGruposGestionList');
    if (!cont) return;
    if (!this._gruposTodos) await this._precargarGrupos();
    const grupos = this._gruposTodos || [];
    if (grupos.length === 0) {
      cont.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Aún no tienes ningún grupo creado.</p>';
      return;
    }
    // 🔥 Cada grupo es su propia tarjeta independiente, con dos filas
    // claramente separadas por una línea divisoria: arriba el nombre
    // (centrado, sin icono) y el número de miembros, abajo los dos
    // botones de acción a ancho completo (con texto, no solo el icono
    // suelto) -- así no quedan "flotando" en medio de la tarjeta, cada
    // uno ocupa su propia mitad bien delimitada.
    cont.innerHTML = grupos.map(g => `
      <div style="padding:14px; margin-bottom:12px; background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; box-shadow:var(--shadow-sm);">
        <div style="margin-bottom:12px; text-align:center;">
          <div style="font-size:16px; color:var(--text-primary); font-weight:600;">${Utils.escapeHTML(g.name)}</div>
          <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${(g.members || []).length} miembro(s)</div>
        </div>
        <div style="display:flex; gap:10px; border-top:1px solid var(--border-color); padding-top:10px;">
          <button onclick="SessionInvites._abrirFormularioGrupo('${g.id}')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:transparent; border:1px solid var(--gold); color:var(--gold); border-radius:14px; padding:9px 0; font-size:12px; font-weight:600; letter-spacing:0.3px; cursor:pointer;">EDITAR</button>
          <button onclick="SessionInvites._eliminarGrupo('${g.id}')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:transparent; border:1px solid var(--zone-5); color:var(--zone-5); border-radius:14px; padding:9px 0; font-size:12px; font-weight:600; letter-spacing:0.3px; cursor:pointer;">ELIMINAR</button>
        </div>
      </div>
    `).join('');
  },

  async _abrirFormularioGrupo(groupId = null) {
    const grupo = groupId ? (this._gruposTodos || []).find(g => g.id === groupId) : null;
    this._grupoEditandoId = groupId;
    this._grupoMiembrosSeleccionados = new Set(grupo ? (grupo.members || []) : []);

    const { modal } = this._crearOverlayModal('sessGroupForm');
    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">${grupo ? '✏️ EDITAR GRUPO' : '➕ CREAR GRUPO'}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <label style="display:block; font-size:12px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">NOMBRE DEL GRUPO</label>
        <input id="sgGrupoNombre" placeholder="Ej: Gimnasio" value="${grupo ? Utils.escapeHTML(grupo.name) : ''}" style="width:100%; margin-bottom:16px; text-align:center;">
        <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">🔎 MARCA LOS MIEMBROS</label>
        <input id="sgGrupoBuscar" placeholder="BUSCAR USUARIO" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="sgGrupoMiembrosList">⏳ Cargando usuarios...</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessGroupForm')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgGuardarGrupoBtn" class="action-button" style="width:auto; padding:0 24px; margin:0;">GUARDAR</button>
      </div>
    `;

    if (!this._usuariosTodos) await this._precargarUsuarios();
    this._renderizarMiembrosFormularioGrupo(this._usuariosTodos);

    document.getElementById('sgGrupoBuscar').addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
        (u.username || '').toLowerCase().includes(term)
      );
      this._renderizarMiembrosFormularioGrupo(filtrados);
    });

    document.getElementById('sgGuardarGrupoBtn').addEventListener('click', () => this._guardarGrupo());
  },

  _renderizarMiembrosFormularioGrupo(usuarios) {
    const cont = document.getElementById('sgGrupoMiembrosList');
    if (!cont) return;
    if (!usuarios || usuarios.length === 0) {
      cont.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    cont.innerHTML = usuarios.map(u => {
      const marcado = this._grupoMiembrosSeleccionados.has(u.uid);
      const nombreMostrado = Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'));
      return `
        <div onclick="SessionInvites._toggleMiembroGrupo('${u.uid}')" style="
          display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; margin-bottom:8px;
          background:${marcado ? 'rgba(192,160,96,0.12)' : 'var(--stat-bg)'};
          border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
          border-left:4px solid ${marcado ? 'var(--gold)' : 'var(--border-color-light)'};
          border-radius:14px; cursor:pointer; box-shadow:var(--shadow-sm); transition:all 0.15s ease;
        ">
          <span style="font-size:14px; color:var(--text-primary); font-weight:${marcado ? 'bold' : 'normal'};">${nombreMostrado}</span>
          <span style="font-size:20px; flex-shrink:0;">${marcado ? '☑️' : '⬜'}</span>
        </div>`;
    }).join('');
  },

  _toggleMiembroGrupo(uid) {
    if (this._grupoMiembrosSeleccionados.has(uid)) this._grupoMiembrosSeleccionados.delete(uid);
    else this._grupoMiembrosSeleccionados.add(uid);
    const term = document.getElementById('sgGrupoBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? this._usuariosTodos : this._usuariosTodos.filter(u =>
      (u.username || '').toLowerCase().includes(term)
    );
    this._renderizarMiembrosFormularioGrupo(filtrados);
  },

  async _guardarGrupo() {
    const nombre = document.getElementById('sgGrupoNombre')?.value.trim();
    if (!nombre) { Utils.showToast('Ponle un nombre al grupo', 'warning'); return; }
    if (!this._grupoMiembrosSeleccionados.size) { Utils.showToast('Marca al menos un miembro', 'warning'); return; }

    const btn = document.getElementById('sgGuardarGrupoBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }

    try {
      const members = Array.from(this._grupoMiembrosSeleccionados);
      if (this._grupoEditandoId) {
        await firebaseServices.db.collection('sessionGroups').doc(this._grupoEditandoId).update({ name: nombre, members });
      } else {
        await firebaseServices.db.collection('sessionGroups').add({
          name: nombre,
          members,
          createdBy: AppState.currentUserId,
          createdAt: firebaseServices.Timestamp.now()
        });
      }
      this._gruposTodos = null;
      await this._precargarGrupos();
      this._cerrarModal('sessGroupForm');
      this._renderizarGestionGrupos();
      this._renderizarGrupos();
      Utils.showToast('✅ Grupo guardado', 'success');
    } catch (e) {
      console.error('Error guardando grupo:', e);
      Utils.showToast('Error al guardar el grupo', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '💾 GUARDAR'; }
    }
  },

  async _eliminarGrupo(id) {
    const confirmado = await Utils.confirm('Eliminar grupo', '¿Eliminar este grupo? Esta acción no se puede deshacer.');
    if (!confirmado) return;
    try {
      await firebaseServices.db.collection('sessionGroups').doc(id).delete();
      this._gruposTodos = null;
      await this._precargarGrupos();
      this._renderizarGestionGrupos();
      this._renderizarGrupos();
      Utils.showToast('🗑️ Grupo eliminado', 'success');
    } catch (e) {
      console.error('Error eliminando grupo:', e);
      Utils.showToast('Error al eliminar el grupo', 'error');
    }
  },

  async _confirmarEnvio() {
    if (this._usuariosSeleccionados.size === 0) {
      Utils.showToast('Elige al menos un usuario', 'warning');
      return;
    }
    if (this._modoPack ? !(this._pack && this._pack.items.length) : !this._fechasSeleccionadas.size) {
      Utils.showToast(this._modoPack ? 'Añade al menos una sesión al pack' : 'Elige al menos un día', 'warning');
      return;
    }

    // 🔥 v15: lo que recibe CADA destinatario, como lista de { fecha, sesion }.
    // Envío normal: la misma sesión en cada día elegido (como siempre). Pack:
    // las sesiones de la lista, cada una en sus días. Un día solo admite una
    // sesión (el plan guarda una por día), así que se rechaza un pack con dos
    // en el mismo día en vez de dejar que una pise a la otra.
    let entregas;
    if (this._modoPack) {
      entregas = [];
      const diasVistos = new Set();
      for (const item of this._pack.items) {
        for (const fecha of item.fechas) {
          if (diasVistos.has(fecha)) {
            Utils.showToast(`Hay dos sesiones del pack el mismo día (${this._formatearFechaCorta(fecha)})`, 'warning');
            return;
          }
          diasVistos.add(fecha);
          entregas.push({ fecha, sesion: item.sesion });
        }
      }
      entregas.sort((a, b) => a.fecha.localeCompare(b.fecha));
    } else {
      const sesionParaEnviar = JSON.parse(JSON.stringify(this._editable));
      entregas = Array.from(this._fechasSeleccionadas).map(fecha => ({ fecha, sesion: sesionParaEnviar }));
    }
    // Solo un pack con más de un día se agrupa en un único modal para el
    // destinatario. El envío normal (una sesión en varios días) sigue
    // llegando como siempre: una invitación suelta por día.
    const agrupar = this._modoPack && entregas.length > 1;
    const packNombre = ((this._pack && this._pack.nombre) || '').trim();

    const btn = document.getElementById('sgEnviarBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

    Utils.showLoading();
    // 🔥 Esperar un frame para que la animación de "EN PROCESO" se pinte
    await new Promise(resolve => requestAnimationFrame(resolve));

    let enviados = 0;
    try {
      // 🔥 Doble comprobación de seguridad justo antes de escribir: si
      // quien envía es un entrenador (no admin), se relee su
      // alumnosAceptados fresco de Firestore y se descarta cualquier
      // seleccionado que ya no esté en esa lista (p.ej. un alumno que
      // revocó su aceptación mientras este modal seguía abierto, o un
      // miembro de grupo que dejó de ser alumno). El admin nunca pasa por
      // este filtro: sigue pudiendo enviar a cualquier usuario.
      let destinatarios = Array.from(this._usuariosSeleccionados);
      if (!AppState.isAdmin) {
        const miDocFresco = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
        const alumnosFrescos = new Set([AppState.currentUserId, ...(miDocFresco.data()?.alumnosAceptados || [])]);
        const descartados = destinatarios.filter(uid => !alumnosFrescos.has(uid));
        destinatarios = destinatarios.filter(uid => alumnosFrescos.has(uid));
        if (descartados.length) {
          Utils.showToast(`⚠️ ${descartados.length} destinatario(s) ya no te acepta(n) como entrenador y no recibirán la sesión`, 'warning');
        }
        if (!destinatarios.length) {
          Utils.hideLoading();
          if (btn) { btn.disabled = false; btn.innerHTML = `📤 ENVIAR (<span id="sgCountSeleccionados">${this._usuariosSeleccionados.size}</span>)`; }
          return;
        }
      }

      const fromUsername = AppState.currentUserData?.username || AppState.currentUser || 'Admin';
      const batchId = firebaseServices.utils.createId();
      const createdAt = firebaseServices.Timestamp.now();

      // Un batch de Firestore admite como máximo 500 operaciones: se trocea
      // por destinatarios (nunca partiendo el pack de una misma persona, para
      // que a cada uno le llegue completo y de una vez).
      const porLote = Math.max(1, Math.floor(400 / entregas.length));
      for (let i = 0; i < destinatarios.length; i += porLote) {
        const grupo = destinatarios.slice(i, i + porLote);
        const batch = firebaseServices.db.batch();
        grupo.forEach(uid => {
          const usuario = this._usuariosTodos.find(u => u.uid === uid);
          entregas.forEach(({ fecha, sesion }) => {
            const ref = firebaseServices.db.collection('sessionInvites').doc();
            batch.set(ref, {
              fromUid: AppState.currentUserId,
              fromUsername,
              toUid: uid,
              toUsername: usuario?.username || '',
              status: 'pending',
              fecha,
              sesion,
              batchId,
              createdAt,
              ...(agrupar ? { packId: batchId, ...(packNombre ? { packNombre } : {}) } : {})
            });
          });
        });
        await batch.commit();
        enviados += grupo.length;
      }

      Utils.hideLoading();
      if (agrupar) {
        Utils.showToast(`✅ Pack de ${entregas.length} sesiones enviado a ${destinatarios.length} usuario(s)`, 'success');
      } else {
        const txtDias = entregas.length > 1 ? ` para ${entregas.length} días` : '';
        Utils.showToast(`✅ Sesión enviada a ${destinatarios.length} usuario(s)${txtDias}`, 'success');
      }
      this._cerrarModal('sessGen');
      this._modoPack = false;
      this._pack = null;
      this._refrescarHistorialTrasEnvio();
    } catch (e) {
      console.error('Error enviando sesiones:', e);
      Utils.hideLoading();
      if (enviados > 0) {
        // Envío parcial (solo puede pasar con muchos destinatarios, que van
        // en varios batches): se cierra el generador y se refresca el
        // historial para que se vea a quién llegó -- reintentar con la misma
        // selección duplicaría lo ya enviado.
        Utils.showToast(`⚠️ Solo se envió a ${enviados} usuario(s) antes del error. Revisa "Últimas sesiones creadas" antes de reenviar`, 'error');
        this._cerrarModal('sessGen');
        this._modoPack = false;
        this._pack = null;
        this._refrescarHistorialTrasEnvio();
      } else {
        Utils.showToast('Error al enviar la sesión', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = `📤 ENVIAR (<span id="sgCountSeleccionados">${this._usuariosSeleccionados.size}</span>)`; }
      }
    }
  },

  _refrescarHistorialTrasEnvio() {
    this._historialCache = null;
    this._historialLastDoc = null;
    this._historialHayMas = false;
    this._historialRenderizado = false;
    this.mostrarHistorial();
  },

  // ============================================================
  // 🔥 v15: PACKS DE SESIONES (lado del que envía)
  // ============================================================

  _tituloPasoPack(paso) {
    const editando = this._pack && this._pack.editIdx !== null && this._pack.editIdx !== undefined;
    const cual = editando ? 'EDITAR SESIÓN' : `SESIÓN ${((this._pack && this._pack.items.length) || 0) + 1}`;
    return `PACK · ${cual} · PASO ${paso}/2`;
  },

  // Días que ya ocupan las OTRAS sesiones del pack (la que se está editando
  // no cuenta: puede conservar o cambiar sus propios días).
  _diasOcupadosPack() {
    const ocupados = new Set();
    if (!this._modoPack || !this._pack) return ocupados;
    this._pack.items.forEach((item, i) => {
      if (i !== this._pack.editIdx) item.fechas.forEach(f => ocupados.add(f));
    });
    return ocupados;
  },

  _volverDesdeUsuarios() {
    return this._modoPack ? this._renderPackBuilder() : this._renderPaso2Calendario();
  },

  _fechaPackCorta(key) {
    return new Date(key + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  },

  _renderPackBuilder() {
    // 🔥 v485: la lista de atletas y los grupos se piden en el MISMO instante en que se pulsa
    // crear sesión / pack (idempotente: si ya están en caché no lee nada), para que al llegar
    // al paso 3 estén ya listos y no se vea ninguna carga.
    this._precargarUsuarios();
    this._precargarGrupos();
    const { modal } = this._crearOverlayModal('sessGen');
    const items = this._pack.items;
    const orden = items.map((item, i) => ({ item, i }))
      .sort((a, b) => (a.item.fechas[0] || '').localeCompare(b.item.fechas[0] || ''));

    const filas = orden.map(({ item, i }) => {
      const s = item.sesion || {};
      const c = this._colorTipo(s.tipo, true);
      const nombre = (s.detalle && s.detalle.nombre) || s.tipo || 'Sesión';
      const fechasTxt = item.fechas.map(f => this._fechaPackCorta(f)).join(' · ');
      return `
        <div style="display:flex; align-items:center; gap:8px; background:${c.bg}; border:1px solid ${c.accent}; border-left:4px solid ${c.accent}; border-radius:14px; padding:10px 10px 10px 12px; margin-bottom:8px; box-shadow:var(--shadow-sm);">
          <div style="flex:1; min-width:0; text-align:left;">
            <div style="font-size:10px; font-weight:600; letter-spacing:0.8px; color:var(--gold); text-transform:capitalize;">${fechasTxt}</div>
            <div style="font-size:14px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${this._tipoEmoji(s.tipo)} ${Utils.escapeHTML(nombre)}</div>
          </div>
          <button onclick="SessionInvites._editarSesionPack(${i})" title="Editar" style="width:36px; height:36px; margin:0; padding:0; flex-shrink:0; background:transparent; border:1px solid var(--border-color-light); color:var(--text-primary); border-radius:14px; cursor:pointer; font-size:14px;">✏️</button>
          <button onclick="SessionInvites._quitarSesionPack(${i})" title="Quitar del pack" style="width:36px; height:36px; margin:0; padding:0; flex-shrink:0; background:transparent; border:1px solid #e74c3c; color:#e74c3c; border-radius:14px; cursor:pointer; font-size:16px;">✕</button>
        </div>`;
    }).join('');

    const totalDias = items.reduce((n, item) => n + item.fechas.length, 0);
    const resumen = items.length
      ? `${totalDias} ${totalDias === 1 ? 'sesión' : 'sesiones'} en el pack`
      : 'Aún no has añadido ninguna sesión al pack.';

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">📦 PACK DE SESIONES</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <p style="font-size:12px; color:var(--text-secondary); text-align:center; margin:0 0 12px; line-height:1.5;">
          Añade varias sesiones, cada una en su día. Tu atleta recibirá el pack completo en un solo aviso y lo aceptará de una vez.
        </p>
        <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary);">NOMBRE DEL PACK (opcional)</label>
        <input id="sgPackNombre" maxlength="40" placeholder="Ej: Semana del 20 al 24" value="${Utils.escapeHTML(this._pack.nombre || '')}" style="width:100%; margin-bottom:14px; text-align:center;">
        <div id="sgPackLista">${filas}</div>
        <div style="text-align:center; font-size:12px; color:${items.length ? 'var(--gold)' : 'var(--text-secondary)'}; font-weight:600; margin:${items.length ? '4px' : '16px'} 0 12px;">${resumen}</div>
        <button onclick="SessionInvites._anadirSesionPack()" style="display:block; width:100%; height:44px; margin:0; background:rgba(192,160,96,0.12); border:1.5px solid var(--gold); color:var(--gold); border-radius:14px; cursor:pointer; font-size:14px; font-weight:600; letter-spacing:0.5px; box-shadow:var(--shadow-sm);">AÑADIR SESIÓN</button>
        ${items.length ? `
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button onclick="SessionInvites._moverPack(-7)" style="flex:1; height:36px; margin:0; background:transparent; border:1px solid var(--border-color-light); color:var(--text-primary); border-radius:14px; cursor:pointer; font-size:12px;">◀ 1 SEMANA</button>
          <button onclick="SessionInvites._moverPack(7)" style="flex:1; height:36px; margin:0; background:transparent; border:1px solid var(--border-color-light); color:var(--text-primary); border-radius:14px; cursor:pointer; font-size:12px;">1 SEMANA ▶</button>
        </div>
        <div style="text-align:center; font-size:10px; color:var(--text-secondary); margin-top:4px;">Mueve todas las sesiones del pack a la vez</div>` : ''}
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarPack()" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CANCELAR</button>
        <button id="sgPackContinuarBtn" onclick="SessionInvites._continuarPackAUsuarios()" class="action-button" style="width:auto; padding:0 32px; margin:0;" ${items.length ? '' : 'disabled'}>CONTINUAR →</button>
      </div>
    `;

    document.getElementById('sgPackNombre').addEventListener('input', (e) => {
      this._pack.nombre = e.target.value;
    });
  },

  _anadirSesionPack() {
    this._pack.editIdx = null;
    this._editable = this._nuevaSesionEditable();
    this._fechasSeleccionadas = new Set();
    this._transicionarPaso(() => this._renderPaso1());
  },

  _editarSesionPack(i) {
    const item = this._pack.items[i];
    if (!item) return;
    this._pack.editIdx = i;
    this._editable = JSON.parse(JSON.stringify(item.sesion));
    this._normalizarEditable();
    this._fechasSeleccionadas = new Set(item.fechas);
    this._transicionarPaso(() => this._renderPaso1());
  },

  _quitarSesionPack(i) {
    if (!this._pack.items[i]) return;
    this._pack.items.splice(i, 1);
    this._renderPackBuilder();
  },

  // Paso 2 en modo pack: guarda (o sustituye, si se estaba editando) la
  // sesión con sus días y vuelve a la lista del pack.
  _guardarSesionEnPack() {
    if (!this._fechasSeleccionadas.size) return;
    const item = {
      sesion: JSON.parse(JSON.stringify(this._editable)),
      fechas: Array.from(this._fechasSeleccionadas).sort()
    };
    const { items, editIdx } = this._pack;
    if (editIdx !== null && editIdx !== undefined && items[editIdx]) items[editIdx] = item;
    else items.push(item);
    this._pack.editIdx = null;
    this._fechasSeleccionadas = new Set();
    this._transicionarPaso(() => this._renderPackBuilder());
  },

  async _continuarPackAUsuarios() {
    if (!this._pack.items.length) return;
    const btn = document.getElementById('sgPackContinuarBtn');
    if (!this._usuariosTodos || !this._gruposTodos) {
      if (btn) btn.disabled = true;
      await Promise.all([this._precargarUsuarios(), this._precargarGrupos()]);
    }
    this._transicionarPaso(() => this._renderPaso3Usuarios());
  },

  _desplazarFecha(key, dias) {
    const [y, m, d] = key.split('-').map(Number);
    return this._dateKey(new Date(y, m - 1, d + dias));
  },

  // Mueve TODAS las sesiones del pack (p. ej. ±7 = una semana).
  _moverPack(dias) {
    if (!this._pack) return;
    this._pack.items.forEach(item => {
      item.fechas = item.fechas.map(f => this._desplazarFecha(f, dias));
    });
    this._renderPackBuilder();
  },

  // 🔥 v15.1: "REUTILIZAR" para packs. Se leen de Firestore las invitaciones
  // de UN destinatario del lote (una por día = el pack entero; el historial
  // no guarda las sesiones, solo cuenta), se agrupan por sesión y se abren
  // en la lista del pack. Si el pack ya empezó, se mueve a la siguiente
  // semana con el mismo día de la semana (y se avisa); ◀/▶ mueven a mano.
  async _reutilizarPack(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote || !lote.esPack || !lote.destinatarios || !lote.destinatarios.length) {
      Utils.showToast('No se pudo recuperar este pack', 'error');
      return;
    }
    Utils.showLoading();
    try {
      let docs = [];
      for (const dest of lote.destinatarios.slice(0, 3)) {
        const snap = await firebaseServices.db.collection('sessionInvites')
          .where('fromUid', '==', AppState.currentUserId)
          .where('batchId', '==', lote.clave)
          .where('toUid', '==', dest.uid)
          .get();
        docs = [];
        snap.forEach(doc => docs.push(doc.data()));
        if (docs.length) break;
      }
      docs = docs.filter(d => d.sesion && d.fecha);
      if (!docs.length) throw new Error('El pack ya no existe en Firestore');

      // Una sesión aplicada a varios días se recupera como UNA sola entrada con sus días.
      const porSesion = new Map();
      docs.forEach(d => {
        const clave = JSON.stringify(d.sesion);
        if (!porSesion.has(clave)) porSesion.set(clave, { sesion: d.sesion, fechas: [] });
        porSesion.get(clave).fechas.push(d.fecha);
      });
      const items = Array.from(porSesion.values())
        .map(it => ({ sesion: JSON.parse(JSON.stringify(it.sesion)), fechas: it.fechas.sort() }))
        .sort((a, b) => a.fechas[0].localeCompare(b.fechas[0]));

      // Si el pack ya ha empezado, a la siguiente semana con el mismo día de la semana.
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const [y, m, d] = items[0].fechas[0].split('-').map(Number);
      const primera = new Date(y, m - 1, d);
      let movido = false;
      if (primera < hoy) {
        const semanas = Math.ceil(Math.round((hoy - primera) / 86400000) / 7);
        items.forEach(it => { it.fechas = it.fechas.map(f => this._desplazarFecha(f, semanas * 7)); });
        movido = true;
      }

      this._modoPack = true;
      this._pack = { items, editIdx: null, nombre: lote.packNombre || '' };
      this._diaGlobalAutoAsignado = null;
      this._editable = this._nuevaSesionEditable();
      this._mesCalendario = new Date();
      this._mesCalendario.setDate(1);
      this._fechasSeleccionadas = new Set();
      this._usuariosSeleccionados = new Set();
      this._precargarUsuarios();
      this._precargarGrupos();
      Utils.hideLoading();

      if (movido) {
        Utils.showToast(`📅 Pack movido a la semana del ${this._fechaPackCorta(items[0].fechas[0])} (mismos días de la semana)`, 'info');
      }
      const overlay = document.getElementById('sessHistOverlay');
      const modal = document.getElementById('sessHistModal');
      if (overlay && modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
          overlay.id = 'sessGenOverlay';
          modal.id = 'sessGenModal';
          this._renderPackBuilder();
          requestAnimationFrame(() => { modal.style.opacity = '1'; });
        }, 180);
      } else {
        this._cerrarModal('sessHist');
        this._renderPackBuilder();
      }
    } catch (e) {
      console.error('Error reutilizando el pack:', e);
      Utils.hideLoading();
      Utils.showToast('No se pudo recuperar este pack', 'error');
    }
  },

  async _cerrarPack() {
    if (this._pack && this._pack.items.length && !(await Utils.confirm('DESCARTAR PACK', '¿Descartar este pack? Se perderán las sesiones que has añadido.'))) return;
    this._modoPack = false;
    this._pack = null;
    this._cerrarModal('sessGen');
  },

  // 🔥 Equivalente a la primera mitad de _aceptar() (el cálculo de
  // personalización -- calentamiento/parte principal/enfriamiento, TSS,
  // ritmo -- con los datos del propio usuario en vez de un destinatario),
  // pero sin pasar por sessionInvites ni por el "plan personalizado"
  // aparte que usa ese flujo: la sesión se inserta directamente en el
  // plan que el usuario ya tiene abierto, en el día exacto donde pulsó
  // "+". Así no se crea un plan paralelo ni se cambia el plan activo.
  async _confirmarAutoAsignacion() {
    const diaGlobal = this._diaGlobalAutoAsignado;
    if (!diaGlobal) return;
    if (this._modoSesionExtra && this._editable.tipo === 'descanso') {
      Utils.showToast('Una sesión de descanso no se registra como entreno', 'warning');
      return;
    }
    const btn = document.getElementById('sgContinuarBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'GUARDANDO...'; }
    Utils.showLoading();
    try {
      const uid = AppState.currentUserId;
      const sesionData = JSON.parse(JSON.stringify(this._editable));
      const det = sesionData.detalle || {};
      let personalizado;
      if (sesionData.tipo === 'descanso') {
        personalizado = { ritmoStr: null, duracionMin: 0, tss: null, calorias: null, calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null };
      } else if (sesionData.tipo === 'strength') {
        const peso = await this._obtenerPesoUsuario(uid);
        personalizado = this._calcularPersonalizacionFuerza(det.pasosDetallados, peso);
      } else {
        const [calculo, peso] = await Promise.all([
          this._obtenerCalculoDestinatario(uid),
          this._obtenerPesoUsuario(uid)
        ]);
        if (sesionData.tipo === 'series' && det.seriesConfig) {
          personalizado = this._calcularPersonalizacionSeries(det.seriesConfig, calculo, peso, det.pasosDetallados || []);
        } else {
          const modoParte = det.modoPartePrincipal || 'distancia';
          const parteInput = {
            modo: modoParte,
            valor: modoParte === 'tiempo' ? (det.duracionPartePrincipalMin || 0) : (det.distanciaEstimada || 0)
          };
          personalizado = this._calcularPersonalizacion(det.zona, parteInput, calculo, peso, det.pasosDetallados || []);
        }
      }

      const detalleFinal = this._construirDetalleSesion(sesionData, personalizado);
      // 🔥 v15.1: mismo total que al aceptar una invitación (incluye también los pasos extra de fuerza)
      const duracionTotal = personalizado.duracionMin || ((personalizado.calentamiento || 0) + (personalizado.partePrincipal || 0) + (personalizado.enfriamiento || 0));

      // 🔥 v15.3: al EDITAR una sesión para marcarla como realizada NO se
      // escribe nada en el plan aquí -- se devuelve la sesión editada y es
      // calendar.js quien la guarda solo cuando se confirma el modal final.
      if (this._modoEdicionSesion) {
        Utils.hideLoading();
        const resolverEdicion = this._resolverEdicion;
        this._resolverEdicion = null;
        this._modoEdicionSesion = false;
        this._cerrarModal('sessGen');
        this._diaGlobalAutoAsignado = null;
        if (resolverEdicion) resolverEdicion({ tipo: sesionData.tipo, duracion: duracionTotal, detalle: detalleFinal });
        return;
      }
      // 🔥 v17.1: sesión extra de hoy -> no se inserta en el plan; se ofrece empezarla con GPS o registrarla a mano.
      if (this._modoSesionExtra) {
        Utils.hideLoading();
        this._modoSesionExtra = false;
        this._cerrarModal('sessGen');
        this._diaGlobalAutoAsignado = null;
        PlanGenerator.abrirOpcionesSesionExtra({ tipo: sesionData.tipo, duracion: duracionTotal, detalle: detalleFinal });
        return;
      }
      const nuevaSesion = await PlanGenerator.insertarSesionManualEnPlan(diaGlobal, sesionData.tipo, duracionTotal, detalleFinal);
      Utils.hideLoading();
      this._cerrarModal('sessGen');
      this._diaGlobalAutoAsignado = null;
      // 🔥 Al guardar, se cierra el generador y se queda tal cual en el
      // calendario -- que insertarSesionManualEnPlan() ya deja
      // actualizado con la sesión nueva (renderizarMes incluido). Antes
      // aquí se abría de golpe el detalle de la sesión recién creada,
      // pero eso era otro salto/transición justo después del de crear la
      // sesión -- se guarda y ya está; si luego se quiere marcar como
      // hecha, se toca esa sesión en el calendario como cualquier otra.
      // (Si nuevaSesion viene null, insertarSesionManualEnPlan ya mostró
      // su propio toast de error/aviso -- no hace falta uno más aquí.)
    } catch (e) {
      console.error('Error creando el entreno no programado:', e);
      Utils.hideLoading();
      Utils.showToast('Error al crear el entreno', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'GUARDAR'; }
    }
  },

  // ============================================================
  // HISTORIAL CON COLORES AJUSTADOS PARA MODO OSCURO
  // ============================================================

  // 🔥 v10.13: hace la petición real a Firestore (_cargarTandaHistorial)
  // y deja el resultado en _historialCache, pero SIN tocar el DOM -- así
  // puede llamarse tanto desde mostrarHistorial() (pestaña ya abierta)
  // como desde precargarHistorial() (nada más iniciar sesión, con la
  // pestaña "Crear sesión"/"Sesiones enviadas" ni siquiera montada
  // todavía). Si ya hay una carga en curso (p.ej. la precarga del login
  // aún no ha terminado cuando el usuario abre la pestaña), se reutiliza
  // esa misma promesa en vez de lanzar una segunda consulta en paralelo.
  _cargandoHistorialPromise: null,
  // 🔥 v10.14: en `true` justo después de que mostrarHistorial() haya
  // pintado de verdad las tarjetas. Mientras siga en `true`, entrar y
  // salir de la pestaña no vuelve a tocar el DOM (ver mostrarHistorial).
  // Se pone a `false` explícitamente en los tres sitios que cambian el
  // contenido real del historial: enviar una sesión nueva, cargar más, y
  // eliminar una entrada.
  _historialRenderizado: false,

  async _cargarHistorialSiHaceFalta() {
    if (this._historialCache) return;
    if (this._cargandoHistorialPromise) return this._cargandoHistorialPromise;
    this._cargandoHistorialPromise = (async () => {
      const { lotes, lastDoc, hayMas } = await this._cargarTandaHistorial(10, null, new Map());
      this._historialCache = lotes;
      this._historialLastDoc = lastDoc;
      this._historialHayMas = hayMas;
      // Se sincroniza siempre con la realidad (no solo se activa, se
      // desactiva también si en algún momento se borra TODO el
      // historial) para que el esqueleto deje de salir si vuelve a
      // quedarse a cero.
      const claveTieneHistorial = `ri5_tiene_historial_envios_${AppState.currentUserId}`;
      if (lotes.length) localStorage.setItem(claveTieneHistorial, '1');
      else localStorage.removeItem(claveTieneHistorial);
    })();
    try {
      await this._cargandoHistorialPromise;
    } finally {
      this._cargandoHistorialPromise = null;
    }
  },

  // 🔥 v10.13: a petición del usuario, el historial de "últimas sesiones
  // creadas" (entrenador/admin) ya no espera a que se abra la pestaña
  // "Crear sesión"/"Sesiones enviadas" para pedirse -- se precarga en
  // segundo plano nada más iniciar sesión (ver app.js > precargarDatos),
  // igual que ya se hace con el perfil o la lista de amigos. Así, cuando
  // el entrenador/admin entra de verdad en esa pestaña, las 10 tarjetas
  // ya están listas de antes -- sin esqueleto, sin espera -- y solo se
  // vuelven a pedir a Firestore cuando de verdad cambia algo (se crea una
  // sesión nueva, ver _enviarSesiones, que invalida _historialCache).
  async precargarHistorial() {
    if (!AppState.currentUserId) return;
    if (!(AppState.isAdmin || AppState.isTrainer)) return;
    await this._cargarHistorialSiHaceFalta();
    // 🔥 v10.15: a petición del usuario, no basta con tener el DATO listo
    // en caché -- quiere que la lista esté REALMENTE pintada (sin ninguna
    // animación, ni siquiera la primera vez) para cuando entre de verdad
    // en la pestaña. Como #adminSesionesEnviadasList es un contenedor fijo
    // del HTML (solo oculto por CSS mientras esa subpestaña no está
    // activa, nunca destruido), se puede pintar aquí mismo, en segundo
    // plano, justo después de precargar el dato -- para cuando el usuario
    // abra la pestaña, mostrarHistorial() ya no tiene nada que hacer
    // (_historialRenderizado ya está a `true`) y no toca el DOM en
    // absoluto.
    if (document.getElementById('adminSesionesEnviadasList') && !this._historialRenderizado) {
      this._asegurarEstiloHistorial();
      this._pintarHistorialDesdeCache();
    }
  },

  async mostrarHistorial() {
    const container = document.getElementById('adminSesionesEnviadasList');
    if (!container || !AppState.currentUserId) return;
    this._asegurarEstiloHistorial();

    // 🔥 v10.14: si este mismo historial ya se pintó y nada lo ha
    // invalidado desde entonces, no se vuelve a tocar el DOM. Antes,
    // aunque el DATO ya viniera del caché (sin ningún viaje a Firestore),
    // cada simple cambio de subpestaña reconstruía igualmente las
    // tarjetas -- y el resultado visual era una repintada en CADA visita
    // a la pestaña, aunque no hubiera pasado nada nuevo.
    // `_historialRenderizado` se pone a `false` explícitamente en los
    // tres sitios que sí cambian de verdad el contenido (crear una
    // sesión nueva, cargar más, eliminar del historial) -- fuera de esos
    // casos, entrar y salir de la pestaña ya no repinta nada. Con la
    // precarga (ver precargarHistorial más arriba) esto normalmente ya
    // viene en `true` desde antes de que el usuario abra la pestaña por
    // primera vez.
    if (this._historialCache && this._historialRenderizado) return;

    if (!this._historialCache) {
      // 🔥 v10.13: normalmente, para cuando se llega aquí, precargarHistorial()
      // (llamado al iniciar sesión, ver app.js > precargarDatos) ya ha
      // dejado _historialCache relleno -- así que este bloque, en el caso
      // normal, ni se pinta esqueleto ni se espera nada. Solo entra de
      // verdad aquí si esa precarga aún no ha terminado (justo después de
      // iniciar sesión) o si _historialCache se invalidó a propósito (al
      // crear una sesión nueva, ver _enviarSesiones). En ambos casos se
      // reutiliza la misma carga en curso si ya la había en marcha
      // (_cargarHistorialSiHaceFalta), en vez de lanzar una segunda
      // consulta a Firestore en paralelo.
      //
      // 🔥 FIX (histórico): antes se pintaba SIEMPRE el esqueleto (3
      // tarjetas pulsando), aunque el usuario nunca hubiera creado
      // ninguna sesión -- si el resultado salía vacío, esas tarjetas
      // desaparecían de golpe justo después, dando la sensación de un
      // parpadeo/fallo (típico en un entrenador recién habilitado, sin
      // historial todavía). Ahora se recuerda en localStorage, por
      // usuario, si AL MENOS UNA VEZ hubo algo en el historial -- el
      // esqueleto solo se pinta si ya sabemos que hay algo que esperar;
      // la primera vez (o si nunca ha tenido nada) se espera en
      // silencio y se pasa directo al resultado real, sin ningún
      // parpadeo.
      const claveTieneHistorial = `ri5_tiene_historial_envios_${AppState.currentUserId}`;
      const yaTuvoAlgunaVez = localStorage.getItem(claveTieneHistorial) === '1';
      container.innerHTML = `
        <h4 style="font-size:12px; letter-spacing:1px; color:var(--text-secondary); margin:0 0 10px;">📜 ÚLTIMAS SESIONES CREADAS</h4>
        ${yaTuvoAlgunaVez ? [0, 1, 2].map(i => `
          <div style="height:52px; border-radius:14px; background:var(--stat-bg); border:1px solid var(--border-color); border-left:4px solid var(--border-color-light); margin-bottom:6px; animation:riSkeletonPulse 1.2s ease-in-out infinite; animation-delay:${(i * 0.15).toFixed(2)}s;"></div>
        `).join('') : ''}
      `;
      try {
        await this._cargarHistorialSiHaceFalta();
      } catch (e) {
        console.error('Error cargando historial de sesiones enviadas:', e);
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:12px; padding:12px;">No se pudo cargar el historial.</p>';
        return;
      }
    }

    this._pintarHistorialDesdeCache();
  },

  // 🔥 v10.15: pintado puro a partir de `_historialCache` -- sin ninguna
  // animación (ni siquiera la primera vez, a petición del usuario: quiere
  // ver las tarjetas ya puestas, no aparecer una a una). Extraído de
  // mostrarHistorial() para poder llamarlo también desde
  // precargarHistorial(), con la pestaña todavía sin abrir.
  _pintarHistorialDesdeCache() {
    const container = document.getElementById('adminSesionesEnviadasList');
    if (!container) return;

    if (!this._historialCache.length) {
      // 🔥 FIX: antes esto vaciaba el contenedor entero (innerHTML = '')
      // -- como justo antes SIEMPRE se pintaba el título + 3 tarjetas
      // esqueleto (para no depender de saber de antemano si hay datos),
      // el resultado visual era "aparecen unas tarjetas... y desaparecen
      // de golpe", que parece un fallo aunque sea el comportamiento
      // esperado para alguien sin ninguna sesión creada todavía (típico
      // en un entrenador recién habilitado). Ahora se deja un mensaje
      // breve en su lugar, sin quitar el título.
      container.innerHTML = `
        <h4 style="font-size:12px; letter-spacing:1px; color:var(--text-secondary); margin:0 0 10px;">📜 ÚLTIMAS SESIONES CREADAS</h4>
        <p style="text-align:center; color:var(--text-secondary); font-size:12px; padding:12px 0;">Aún no has creado ninguna sesión.</p>
      `;
      this._historialRenderizado = true;
      return;
    }

    const filas = this._historialCache.map((lote, idx) => {
      const color = this._colorTipo(lote.tipo, true);
      const fechaTxt = lote.esPack ? `${lote.fechas.size} sesiones` : this._resumenFechas(lote.fechas);
      const estadoTxt = lote.total > 1
        ? `${lote.aceptadas}✅ ${lote.rechazadas}❌ ${lote.pendientes}⏳ de ${lote.total}`
        : (lote.aceptadas ? '✅ Aceptada' : lote.rechazadas ? '❌ Rechazada' : '⏳ Pendiente');
      return `
        <div onclick="SessionInvites._abrirDetalleHistorial(${idx})" style="
          display:flex; justify-content:space-between; align-items:center; gap:10px;
          background:${color.bg}; border:1px solid ${color.accent};
          border-left:4px solid ${color.accent}; border-radius:14px; padding:10px 12px; margin-bottom:6px;
          cursor:pointer; transition:all 0.15s ease;
        ">
          <div style="min-width:0;">
            <div style="font-size:14px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">${fechaTxt}${fechaTxt ? ' · ' : ''}${lote.total} envío${lote.total === 1 ? '' : 's'}</div>
          </div>
          <div style="font-size:12px; color:var(--text-secondary); white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:10px;">
            <span>${estadoTxt}</span>
            <button onclick="event.stopPropagation(); SessionInvites._eliminarHistorial(${idx})" title="Eliminar del historial" style="width:auto; height:auto; margin:0; background:transparent; border:none; color:var(--text-secondary); flex-shrink:0; cursor:pointer; font-size:16px; padding:4px;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h4 style="font-size:12px; letter-spacing:1px; color:var(--text-secondary); margin:0 0 10px;">📜 ÚLTIMAS SESIONES CREADAS</h4>
      ${filas}
      ${this._historialHayMas ? `<button id="cargarMasHistorialBtn" class="action-button" style="margin-top:2px; background:transparent; border:1px solid var(--border-color);" onclick="SessionInvites.cargarMasHistorial()">CARGAR MÁS</button>` : ''}
    `;
    this._historialRenderizado = true;
  },

  // 🔥 FIX bug reportado: solo aparecían 3 lotes en vez de 10. Causa real:
  // se leía un único bloque fijo de 60 documentos EN BRUTO de
  // sessionInvites (uno por cada destinatario) y se agrupaban por
  // batchId -- pero si un envío se manda a 20-30 personas a la vez (un
  // broadcast normal en un club), cada envío consume 20-30 de esos 60
  // documentos. Con 2-3 envíos así el límite de 60 ya está agotado, así
  // que los lotes más antiguos ni siquiera llegaban a leerse de
  // Firestore -- el corte final a 10 era irrelevante si solo había 2-3
  // lotes distintos entre esos 60 documentos (mismo patrón que el bug ya
  // arreglado en el panel de Soporte del admin).
  //
  // Ahora se piden bloques de 60 documentos en bruto, uno tras otro,
  // hasta reunir `objetivoMostrar` LOTES distintos (o agotar la
  // colección) -- así un club con envíos grandes también puede ver sus
  // últimas 10 sesiones creadas, no solo las 2-3 que quepan en el primer
  // bloque de documentos.
  async _cargarTandaHistorial(objetivoMostrar, startAfterDoc, mapPrevio) {
    const lotesMap = mapPrevio || new Map();
    const LOTE = 60;
    const MAX_VUELTAS = 10;
    let lastDoc = startAfterDoc;
    let hayMasFirestore = true;
    let vueltas = 0;

    while (lotesMap.size < objetivoMostrar && hayMasFirestore && vueltas < MAX_VUELTAS) {
      let query = firebaseServices.db.collection('sessionInvites')
        .where('fromUid', '==', AppState.currentUserId)
        .orderBy('createdAt', 'desc')
        .limit(LOTE);
      if (lastDoc) query = query.startAfter(lastDoc);
      const snapshot = await query.get();
      vueltas++;
      if (snapshot.empty) { hayMasFirestore = false; break; }

      snapshot.forEach(doc => {
        const d = doc.data();
        const clave = d.batchId || doc.id;
        // 🔥 v15: las invitaciones de un pack (packId) se cuentan POR
        // DESTINATARIO (no por documento): cada persona tiene una por día,
        // pero para quien envía es un único envío con un único estado.
        const esPack = !!d.packId;
        if (!lotesMap.has(clave)) {
          lotesMap.set(clave, {
            clave,
            esPack,
            packNombre: esPack ? (d.packNombre || '') : '',
            nombre: esPack ? (d.packNombre || 'Pack de sesiones') : (d.sesion?.detalle?.nombre || d.sesion?.tipo || 'Sesión'),
            tipo: esPack ? 'pack' : (d.sesion?.tipo || 'rodaje'),
            fechas: new Set(),
            packSesiones: new Map(),
            uidsVistos: new Set(),
            createdAt: d.createdAt,
            sesion: d.sesion || null,
            total: 0, aceptadas: 0, rechazadas: 0, pendientes: 0,
            destinatarios: [],
            docIds: []
          });
        }
        const lote = lotesMap.get(clave);
        lote.docIds.push(doc.id);
        if (d.fecha) lote.fechas.add(d.fecha);
        if (esPack && d.fecha && !lote.packSesiones.has(d.fecha)) {
          lote.packSesiones.set(d.fecha, {
            nombre: d.sesion?.detalle?.nombre || d.sesion?.tipo || 'Sesión',
            tipo: d.sesion?.tipo || 'rodaje'
          });
        }
        if (esPack) {
          if (lote.uidsVistos.has(d.toUid)) return; // este destinatario ya está contado
          lote.uidsVistos.add(d.toUid);
        }
        lote.total++;
        if (d.status === 'accepted') lote.aceptadas++;
        else if (d.status === 'rejected') lote.rechazadas++;
        else lote.pendientes++;
        lote.destinatarios.push({
          uid: d.toUid,
          username: d.toUsername || '(sin nombre)',
          status: d.status || 'pending',
          fecha: d.fecha || ''
        });
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hayMasFirestore = snapshot.docs.length === LOTE;
    }

    const todos = Array.from(lotesMap.values())
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const lotes = todos.slice(0, objetivoMostrar);
    lotes._map = lotesMap; // se conserva COMPLETO (lo que sobró) para "cargar más"
    const hayMas = todos.length > objetivoMostrar || hayMasFirestore;
    return { lotes, lastDoc, hayMas };
  },

  async cargarMasHistorial() {
    if (!this._historialHayMas) return;
    const btn = document.getElementById('cargarMasHistorialBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'CARGANDO...'; }
    try {
      const mapPrevio = this._historialCache?._map || new Map();
      const objetivoMostrar = (this._historialCache?.length || 0) + 10;
      const { lotes, lastDoc, hayMas } = await this._cargarTandaHistorial(objetivoMostrar, this._historialLastDoc, mapPrevio);
      this._historialCache = lotes;
      this._historialLastDoc = lastDoc;
      this._historialHayMas = hayMas;
      this._historialRenderizado = false;
      this.mostrarHistorial();
    } catch (e) {
      console.error('Error cargando más historial de sesiones enviadas:', e);
      if (btn) { btn.disabled = false; btn.textContent = 'CARGAR MÁS'; }
    }
  },

  _resumenFechas(fechasSet) {
    if (!fechasSet || !fechasSet.size) return '';
    if (fechasSet.size === 1) return this._formatearFechaCorta(Array.from(fechasSet)[0]);
    return `${fechasSet.size} días`;
  },

  async _eliminarHistorial(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote || !lote.docIds?.length) return;

    const ok = await Utils.confirm(
      'ELIMINAR DEL HISTORIAL',
      `¿Eliminar "${lote.nombre}" del historial?` +
      (lote.pendientes ? `\n\nOjo: ${lote.pendientes} destinatario(s) todavía no la había(n) aceptado ni rechazado -- se les retirará sin avisarles.` : '')
    );
    if (!ok) return;

    Utils.showLoading();
    try {
      // 🔥 v15: troceado -- un batch de Firestore admite como máximo 500
      // operaciones y un pack grande a muchos atletas se puede pasar.
      for (let i = 0; i < lote.docIds.length; i += 400) {
        const batch = firebaseServices.db.batch();
        lote.docIds.slice(i, i + 400).forEach(docId => {
          batch.delete(firebaseServices.db.collection('sessionInvites').doc(docId));
        });
        await batch.commit();
      }
      this._historialCache.splice(idx, 1);
      // 🔥 FIX bug reportado: el lote borrado se quitaba del array que se
      // ve en pantalla, pero seguía dentro del Map interno (_map) que
      // guarda TODO lo ya leído de Firestore para "cargar más" -- así que
      // al pedir más volvía a aparecer aunque ya estuviera borrado de
      // verdad en la base de datos. Ahora se quita de los dos sitios a la
      // vez: del array visible y del Map que alimenta "cargar más".
      if (this._historialCache._map && lote.clave) {
        this._historialCache._map.delete(lote.clave);
      }
      Utils.hideLoading();
      Utils.showToast('Eliminada del historial', 'success');
      this._historialRenderizado = false;
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

  _abrirDetalleHistorial(idx) {
    const lote = this._historialCache?.[idx];
    if (!lote) return;
    const { modal } = this._crearOverlayModal('sessHist');

    const color = this._colorTipo(lote.tipo);
    // 🔥 el rojo #e74c3c apenas se leía en modo claro (fondo casi blanco):
    // en claro se usa un rojo más oscuro, mismo criterio que ya sigue
    // _colorTipo() más arriba para el resto de acentos.
    const esClaro = document.body.classList.contains('manual-light');
    const colorEliminar = esClaro ? '#B8362A' : '#e74c3c';
    const fechaTxt = this._resumenFechas(lote.fechas) || '—';
    const variosDias = !lote.esPack && lote.fechas && lote.fechas.size > 1;
    // 🔥 v15: qué sesiones lleva el pack (fecha + nombre), para verlo de un vistazo
    const packSesionesHTML = lote.esPack
      ? Array.from(lote.packSesiones.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([fecha, ses]) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:8px 10px; border-bottom:1px solid var(--border-color);">
            <span style="font-size:12px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this._tipoEmoji(ses.tipo)} ${Utils.escapeHTML(ses.nombre)}</span>
            <span style="font-size:12px; color:var(--text-secondary); flex-shrink:0;">${this._formatearFechaCorta(fecha)}</span>
          </div>`).join('')
      : '';
    const filasUsuarios = [...lote.destinatarios]
      .sort((a, b) => a.username.localeCompare(b.username) || a.fecha.localeCompare(b.fecha))
      .map(dest => {
        const info = this._ESTADO_INFO[dest.status] || this._ESTADO_INFO.pending;
        const fechaDest = variosDias && dest.fecha ? `<span style="color:var(--text-secondary); font-size:12px;"> · ${this._formatearFechaCorta(dest.fecha)}</span>` : '';
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border-color);">
            <span style="font-size:14px; color:var(--text-primary);">${Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(dest.username) : dest.username)}${fechaDest}</span>
            <span style="font-size:12px; color:${info.color};">${info.icono} ${info.texto}</span>
          </div>
        `;
      }).join('');

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center; border-left:4px solid ${color.accent};">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">${this._tipoEmoji(lote.tipo)} ${Utils.escapeHTML(lote.nombre)}</span>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1; background:${color.bg};">
        ${lote.esPack ? `
          <div style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:12px;">Pack de ${lote.fechas.size} sesiones · ${lote.total} envío${lote.total === 1 ? '' : 's'}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; overflow:hidden; margin-bottom:14px;">${packSesionesHTML}</div>
        ` : `<div style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:16px;">Para el ${fechaTxt} · ${lote.total} envío${lote.total === 1 ? '' : 's'}</div>`}
        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; overflow:hidden;">
          ${filasUsuarios || '<div style="padding:12px; text-align:center; font-size:12px; color:var(--text-secondary);">Sin destinatarios</div>'}
        </div>
        <div style="display:flex; justify-content:center; margin-top:14px;">
          <button onclick="SessionInvites._eliminarHistorial(${idx}); SessionInvites._cerrarModal('sessHist');" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid ${colorEliminar}; color:${colorEliminar};">ELIMINAR SESIÓN</button>
        </div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:space-between; gap:12px;">
        <button onclick="SessionInvites._cerrarModal('sessHist')" class="action-button" style="width:auto; padding:0 24px; margin:0; background:transparent; border:1px solid var(--border-color-light);">CERRAR</button>
        <button onclick="SessionInvites._reutilizar(${idx})" class="action-button" style="width:auto; padding:0 24px; margin:0;">REUTILIZAR</button>
      </div>
    `;
  },

  _reutilizar(idx) {
    const lote = this._historialCache?.[idx];
    if (lote && lote.esPack) { this._reutilizarPack(idx); return; }
    if (!lote || !lote.sesion) {
      Utils.showToast('No se pudo recuperar esta sesión', 'error');
      return;
    }
    this._modoPack = false;
    this._pack = null;
    this._editable = JSON.parse(JSON.stringify(lote.sesion));
    this._normalizarEditable();
    this._mesCalendario = new Date();
    this._mesCalendario.setDate(1);
    this._fechasSeleccionadas = new Set();
    this._usuariosSeleccionados = new Set();

    const overlay = document.getElementById('sessHistOverlay');
    const modal = document.getElementById('sessHistModal');
    if (overlay && modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        overlay.id = 'sessGenOverlay';
        modal.id = 'sessGenModal';
        this._renderPaso1();
        requestAnimationFrame(() => { modal.style.opacity = '1'; });
      }, 180);
    } else {
      this._cerrarModal('sessHist');
      this._renderPaso1();
    }
  },

  _formatearFechaCorta(fechaKey) {
    const [y, m, d] = fechaKey.split('-').map(Number);
    if (!y || !m || !d) return fechaKey;
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  },

  iniciarListener() {
    if (!AppState.currentUserId || !window.firebaseServices) return;
    this.detenerListener();
    this.unsubscribe = firebaseServices.db.collection('sessionInvites')
      .where('toUid', '==', AppState.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const nuevos = [];
        snapshot.docChanges().forEach(change => {
          if (change.type !== 'added') return;
          const id = change.doc.id;
          if (this._shownIds.has(id)) return;
          this._shownIds.add(id);
          nuevos.push({ id, data: change.doc.data() });
        });
        // 🔥 v15: las invitaciones de un mismo pack (packId) se agrupan en UNA
        // sola entrada de la cola -- un solo modal para todas. Llegan juntas en
        // el mismo snapshot porque se escriben en el mismo batch (atómico).
        const packs = new Map();
        nuevos.forEach(n => {
          if (n.data.packId) {
            if (!packs.has(n.data.packId)) packs.set(n.data.packId, []);
            packs.get(n.data.packId).push(n);
          } else {
            this._encolarInvite({ id: n.id, data: n.data });
          }
        });
        packs.forEach((items, packId) => {
          items.sort((a, b) => (a.data.fecha || '').localeCompare(b.data.fecha || ''));
          this._encolarInvite({ id: 'pack:' + packId, data: items[0].data, pack: { packId, items } });
        });
        if (this._dashboardCargado) this.comprobarPendientes();
      }, (error) => {
        console.error('Error en listener de sessionInvites:', error);
      });
  },

  // Inserta una entrada en la cola por orden de fecha (las de un pack usan la
  // fecha de su primera sesión).
  _encolarInvite(entry) {
    const fecha = entry.data.fecha || '2099-12-31';
    let inserted = false;
    for (let i = 0; i < this._colaPendientes.length; i++) {
      const f = this._colaPendientes[i].data.fecha || '2099-12-31';
      if (fecha < f) {
        this._colaPendientes.splice(i, 0, entry);
        inserted = true;
        break;
      }
    }
    if (!inserted) this._colaPendientes.push(entry);
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

  comprobarPendientes() {
    this._dashboardCargado = true;
    setTimeout(() => this._mostrarSiguienteDeCola(), 1200);
  },

  _mostrarSiguienteDeCola() {
    if (this._modalInviteAbierto) return;
    if (!this._colaPendientes.length) {
      Utils.hideLoading();
      return;
    }
    const novedadesAbierto = document.getElementById('modalNovedades')?.style.display === 'block';
    if (novedadesAbierto) { 
      setTimeout(() => this._mostrarSiguienteDeCola(), 800); 
      return; 
    }
    const siguiente = this._colaPendientes.shift();
    this._modalInviteAbierto = true;
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay || !overlay.classList.contains('active')) {
      Utils.showLoading();
    }
    if (siguiente.pack) this._mostrarModalPack(siguiente);
    else this._mostrarModalInvite(siguiente.id, siguiente.data);
  },

  async _mostrarModalInvite(id, data) {
    const { modal } = this._crearOverlayModal('sessInvite');
    const sesion = data.sesion || {};
    const detalle = sesion.detalle || {};
    const fecha = new Date(data.fecha + 'T00:00:00');
    const fechaTxt = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const nombreAdmin = Utils.capitalizeUsername ? Utils.capitalizeUsername(data.fromUsername) : (data.fromUsername || 'El entrenador');

    if (sesion.tipo === 'descanso') {
      modal.innerHTML = `
        <div style="padding:20px 20px 12px; text-align:center; overflow-y:auto; flex:1; min-height:0; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;">
          <div style="font-size:36px; margin-bottom:8px;">😴</div>
          <div style="font-size:16px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado un día de descanso
          </div>
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; text-align:center; margin-bottom:20px;">
            <div style="font-weight:600; color:var(--gold); margin-bottom:8px;">Día de descanso</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-bottom:4px;">🎯 Recuperación y asimilación del entrenamiento</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px; font-style:italic;">El descanso permite que el cuerpo se recupere y se adapte a las cargas.</div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.8;">
              🧘 Estiramientos suaves &nbsp;·&nbsp; 🌀 Foam roller<br>
              🚶 Paseo activo &nbsp;·&nbsp; 💧 Hidratación adecuada
            </div>
          </div>
          </div>
<div style="padding:12px 20px calc(12px + env(safe-area-inset-bottom, 0px)); background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; gap:12px; flex-shrink:0;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
      `;
      document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id, data));
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, {
        ritmoStr: null, duracionMin: 0, tss: null, calorias: null,
        calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null
      }));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Utils.hideLoading();
        });
      });
      return;
    }

    if (sesion.tipo === 'strength') {
      const peso = await this._obtenerPesoUsuario(AppState.currentUserId);
      const personalizado = this._calcularPersonalizacionFuerza(detalle.pasosDetallados, peso);
      if (!document.body.contains(modal)) return;
      const tiempoTxt = personalizado.duracionMin > 60
        ? `${Math.floor(personalizado.duracionMin/60)}h ${personalizado.duracionMin%60}min` : `${personalizado.duracionMin} min`;
      const pasosTxt = (detalle.pasosDetallados || []).map(p => `
        <div style="text-align:left; margin-bottom:8px;">
          <div style="font-weight:600; color:var(--text-primary); font-size:12px;">${p.icono || '💪'} ${Utils.escapeHTML((p.titulo || '').toUpperCase())}${p.duracionMin ? ` · ${p.duracionMin} min` : ''}</div>
          ${p.accion ? `<div style="font-size:12px; color:var(--text-secondary);">${Utils.escapeHTML(p.accion)}</div>` : ''}
        </div>
      `).join('');
      modal.innerHTML = `
        <div style="padding:20px 20px 12px; text-align:center; overflow-y:auto; flex:1; min-height:0; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;">
          <div style="font-size:36px; margin-bottom:8px;">💪</div>
          <div style="font-size:16px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
          </div>
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; margin-bottom:12px;">
            <div style="font-weight:600; color:var(--gold); margin-bottom:6px; text-align:center;">${Utils.escapeHTML(detalle.nombre || 'Sesión de fuerza')}</div>
            <div style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-bottom:10px;">
              <span>🕒 ${tiempoTxt}</span>
              ${personalizado.calorias !== null ? `<span>🔥 ${personalizado.calorias} kcal</span>` : ''}
            </div>
            ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px; text-align:center;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
             ${this._htmlAdjuntos(detalle.adjuntos)}
            ${pasosTxt}
          </div>
          ${(!peso) ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de esta sesión.</div>` : ''}
          </div>
<div style="padding:12px 20px calc(12px + env(safe-area-inset-bottom, 0px)); background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; gap:12px; flex-shrink:0;">
            <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
            <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
          </div>
      `;
      document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id, data));
      document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, personalizado));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Utils.hideLoading();
        });
      });
      return;
    }

    modal.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">⏳ Calculando tu ritmo, tiempo y calorías para esta sesión...</div>`;

    const [calculo, peso] = await Promise.all([
      this._obtenerCalculoDestinatario(AppState.currentUserId),
      this._obtenerPesoUsuario(AppState.currentUserId)
    ]);

    if (!document.body.contains(modal)) return;

    const zonaInfo = detalle.zona ? this._zonaInfo(detalle.zona) : null;

    // 🔥 FIX RAÍZ (bucle infinito en "Calculando..."): esta comprobación se
    // hace AHORA, aquí, ANTES de intentar personalizar nada -- antes se
    // miraba si `personalizado.duracionMin` salía null para decidir si al
    // destinatario le faltaban zonas, pero ese campo SIEMPRE es un número
    // (la suma de los minutos de los pasos, fijada así en
    // _calcularPersonalizacion/_calcularPersonalizacionSeries incluso sin
    // zonas calculadas), así que esa comprobación nunca se disparaba de
    // verdad. Como consecuencia el código seguía adelante e intentaba
    // personalizar la sesión igualmente -- y para sesiones tipo 'series'
    // (ej. 6x400m) esto disparaba un ReferenceError real más abajo
    // (`modoParte`/`parteInput` solo se declaraban dentro del "else" de
    // sesiones normales, pero se leían también fuera de ese bloque al
    // calcular `distanciaMostrar`): al no capturarse ese error, la
    // ejecución se cortaba justo después de pintar el modal de
    // "Calculando...", que se quedaba así congelado para siempre (el
    // "bucle infinito" reportado). Ahora, si la sesión necesita zona
    // (zonaInfo) y el destinatario no tiene zonas calculadas, se corta
    // aquí mismo sin intentar personalizar nada: se avisa y se rechaza la
    // sesión directamente (ya no se ofrece "ir a calcular zonas y volver",
    // a petición del usuario -- si el destinatario no puede recibirla, se
    // marca como rechazada y el admin tendrá que reenviarla).
    const sinZonasCalculadas = !!zonaInfo && !calculo;

    if (sinZonasCalculadas) {
      modal.innerHTML = `
        <div style="padding:20px 20px 12px; text-align:center; overflow-y:auto; flex:1; min-height:0; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;">
          <div style="font-size:36px; margin-bottom:8px;">🧮</div>
          <div style="font-size:16px; color:var(--text-primary); margin-bottom:4px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
          </div>
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; margin-bottom:16px; font-size:12px; color:var(--text-secondary); line-height:1.6; text-align:left;">
            ⚠️ Todavía no tienes tus zonas de entrenamiento calculadas en este dispositivo, así que no podemos calcular tu ritmo, tiempo ni carga para esta sesión.<br><br>
            No puedes recibir sesiones así -- esta se marcará como <strong style="color:var(--text-primary);">rechazada</strong>. Calcula tus zonas en tu perfil y pide a <strong style="color:var(--text-primary);">${Utils.escapeHTML(nombreAdmin)}</strong> que te la vuelva a enviar.
          </div></div>
<div style="padding:12px 20px calc(12px + env(safe-area-inset-bottom, 0px)); background:var(--bg-primary); border-top:1px solid var(--border-color); display:block; flex-shrink:0;">
          <button id="sessInviteSinZonasBtn" class="action-button" style="width:100%; margin:0;">ENTENDIDO</button>
        </div>
      `;
      document.getElementById('sessInviteSinZonasBtn').addEventListener('click', () => this._rechazar(id, data));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Utils.hideLoading();
        });
      });
      return;
    }

    let modoParte = null, parteInput = null;
    let personalizado;
    if (sesion.tipo === 'series' && detalle.seriesConfig) {
      personalizado = this._calcularPersonalizacionSeries(
        detalle.seriesConfig, calculo, peso,
        detalle.pasosDetallados || []
      );
    } else {
      modoParte = detalle.modoPartePrincipal || 'distancia';
      parteInput = {
        modo: modoParte,
        valor: modoParte === 'tiempo' ? (detalle.duracionPartePrincipalMin || 0) : (detalle.distanciaEstimada || 0)
      };
      personalizado = this._calcularPersonalizacion(
        detalle.zona, parteInput, calculo, peso,
        detalle.pasosDetallados || []
      );
    }

    const tiempoTxt = personalizado.duracionMin !== null
      ? (personalizado.duracionMin > 60 ? `${Math.floor(personalizado.duracionMin/60)}h ${personalizado.duracionMin%60}min` : `${personalizado.duracionMin} min`)
      : '—';
    const distanciaMostrar = personalizado.distanciaTotal !== null
      ? personalizado.distanciaTotal
      : (modoParte === 'distancia' ? parteInput.valor : null);
    const distanciaTxt = distanciaMostrar !== null ? parseFloat(distanciaMostrar.toFixed(2)) : '—';

    modal.innerHTML = `
      <div style="padding:20px 20px 12px; text-align:center; overflow-y:auto; flex:1; min-height:0; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;">
        <div style="font-size:36px; margin-bottom:8px;">${this._tipoEmoji(sesion.tipo)}</div>
        <div style="font-size:16px; color:var(--text-primary); margin-bottom:4px;">
          <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado una sesión
        </div>
        <div style="font-size:14px; color:var(--text-secondary); margin-bottom:16px; text-transform:capitalize;">para el ${fechaTxt}</div>

        <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; text-align:center; margin-bottom:12px;">
          <div style="font-weight:600; color:var(--gold); margin-bottom:6px;">${Utils.escapeHTML(detalle.nombre || sesion.tipo || 'Sesión')}</div>
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
          ${(sesion.tipo === 'series' && detalle.seriesConfig) ? `
            <div style="font-size:10px; color:var(--text-secondary); margin-top:6px; opacity:0.8;">
              ${detalle.seriesConfig.numBloques} bloque${detalle.seriesConfig.numBloques !== 1 ? 's' : ''} × ${detalle.seriesConfig.numSeries} rep.
              ${detalle.seriesConfig.modoRep === 'tiempo' ? `de ${detalle.seriesConfig.tiempoRepSeg}"` : `de ${detalle.seriesConfig.distRepM}m`}
              · desc. ${detalle.seriesConfig.descansoRepSeg}" entre rep.${detalle.seriesConfig.numBloques > 1 ? ` / ${detalle.seriesConfig.descansoBloqueMin}' entre bloques` : ''}
            </div>
          ` : ''}
          ${detalle.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">${Utils.escapeHTML(detalle.objetivo)}</div>` : ''}
           ${this._htmlAdjuntos(detalle.adjuntos)}
        </div>

        ${(!peso && distanciaMostrar) ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de esta sesión.</div>` : ''}

        </div>
<div style="padding:12px 20px calc(12px + env(safe-area-inset-bottom, 0px)); background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; gap:12px; flex-shrink:0;">
          <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
          <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR</button>
        </div>
    `;

    document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazar(id, data));
    document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptar(id, data, personalizado));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Utils.hideLoading();
      });
    });
  },

  async _rechazar(id, data) {
    Utils.showLoading();
    this._cerrarModal('sessInvite');
    try {
      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'rejected' });
      this._modalInviteAbierto = false;
      Utils.showToast('Sesión rechazada', 'info');
      this._mostrarSiguienteDeCola();
    } catch (e) {
      console.error('Error rechazando sesión:', e);
      Utils.hideLoading();
      this._modalInviteAbierto = false;
      Utils.showToast('Error al rechazar la sesión', 'error');
      this._colaPendientes.unshift({ id, data });
      this._mostrarSiguienteDeCola();
    }
  },

  async _aceptar(id, data, personalizado) {
    Utils.showLoading();
    this._cerrarModal('sessInvite');
    try {
      const uid = AppState.currentUserId;

      if (!personalizado) {
        if (data.sesion.tipo === 'descanso') {
          personalizado = {
            ritmoStr: null, duracionMin: 0, tss: null, calorias: null,
            calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null
          };
        } else if (data.sesion.tipo === 'strength') {
          const peso = await this._obtenerPesoUsuario(uid);
          personalizado = this._calcularPersonalizacionFuerza((data.sesion.detalle || {}).pasosDetallados, peso);
        } else {
          const [calculo, peso] = await Promise.all([
            this._obtenerCalculoDestinatario(uid),
            this._obtenerPesoUsuario(uid)
          ]);
          const det = data.sesion.detalle || {};
          if (data.sesion.tipo === 'series' && det.seriesConfig) {
            personalizado = this._calcularPersonalizacionSeries(det.seriesConfig, calculo, peso, det.pasosDetallados || []);
          } else {
            const modoParte = det.modoPartePrincipal || 'distancia';
            const parteInput = {
              modo: modoParte,
              valor: modoParte === 'tiempo' ? (det.duracionPartePrincipalMin || 0) : (det.distanciaEstimada || 0)
            };
            personalizado = this._calcularPersonalizacion(det.zona, parteInput, calculo, peso, det.pasosDetallados || []);
          }
        }
      }

      let planPersonalizado = await this._getPlanPersonalizado(uid);
      let planCreadoAhora = false;
      if (!planPersonalizado) {
        planPersonalizado = await this._crearPlanPersonalizado(uid, data.fecha);
        planCreadoAhora = true;
      }
      const planId = planPersonalizado.id;
      let planData = planPersonalizado.data;

      const fechaInicioActual = new Date(planData.params.fechaInicio);
      const fechaSesion = new Date(data.fecha);
      let diffDays = 0;
      if (!planCreadoAhora && fechaSesion < fechaInicioActual) {
        diffDays = Math.round((fechaInicioActual - fechaSesion) / (1000 * 60 * 60 * 24));
        planData.params.fechaInicio = fechaSesion.toISOString();
        let sesiones = planData.sesiones || [];
        sesiones = sesiones.map(s => {
          if (s.diaGlobal !== undefined) {
            s.diaGlobal += diffDays;
          }
          return s;
        });
        planData.sesiones = sesiones;
      }

      const fechaInicio = new Date(planData.params.fechaInicio);
      const diffTime = fechaSesion - fechaInicio;
      const diaGlobal = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diaGlobal < 1) {
        Utils.hideLoading();
        this._modalInviteAbierto = false;
        Utils.showToast('Error: la fecha de la sesión es anterior al inicio del plan', 'error');
        this._colaPendientes.unshift({ id, data });
        this._mostrarSiguienteDeCola();
        return;
      }

      const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) {
        throw new Error('El plan personalizado no existe');
      }
      const planCompleto = planDoc.data();
      let sesiones = planCompleto.sesiones || [];
      let sesionesRealizadas = planCompleto.sesionesRealizadas || {};
      let feedback = planCompleto.feedback || {};

      if (diffDays > 0) {
        sesiones = planData.sesiones;
        sesionesRealizadas = this._desplazarClavesDiaGlobal(sesionesRealizadas, diffDays);
        feedback = this._desplazarClavesDiaGlobal(feedback, diffDays);
      }

      const detallePersonalizado = this._construirDetalleSesion(data.sesion, personalizado);
      const nuevaSesion = {
        diaGlobal,
        semana: Math.floor((diaGlobal - 1) / 7) + 1,
        diaSemana: ((diaGlobal - 1) % 7) + 1,
        fase: 'PERSONALIZADO',
        nivel: 'intermedio',
        tipo: data.sesion.tipo,
        color: PlanGenerator.getColor(data.sesion.tipo),
        letra: PlanGenerator.getLetra(data.sesion.tipo),
        tieneFuerza: false,
        duracion: personalizado.duracionMin || 0,
        detalle: detallePersonalizado
      };

      const idx = sesiones.findIndex(s => s.diaGlobal === diaGlobal);
      if (idx >= 0) {
        sesiones[idx] = nuevaSesion;
      } else {
        sesiones.push(nuevaSesion);
      }
      sesiones.sort((a, b) => a.diaGlobal - b.diaGlobal);

      const updateData = { sesiones };
      if (diffDays > 0) {
        updateData['params.fechaInicio'] = planData.params.fechaInicio;
        updateData.sesionesRealizadas = sesionesRealizadas;
        updateData.feedback = feedback;
      }
      await planRef.update(updateData);

      AppState.planActualId = planId;
      AppState.planGeneradoActual = planData.params;
      AppState.planActualTipo = planData.tipo || null;
      AppState.sesionesRealizadas = sesionesRealizadas;
      AppState.feedbackSesiones = feedback;

      await firebaseServices.db.collection('users').doc(uid).update({ ultimoPlanId: planId });

      await firebaseServices.db.collection('sessionInvites').doc(id).update({ status: 'accepted' });

      // 🔥 FIX bug real (no solo de toast): a partir de aquí la sesión YA
      // está guardada de verdad en el plan del usuario y el invite ya
      // está marcado como aceptado en Firestore -- lo que sigue
      // (mostrar el calendario, refrescar el dashboard) es solo UI. Antes
      // iba dentro del MISMO try/catch: si CUALQUIERA de esos pasos de UI
      // fallaba (p.ej. un error pintando el calendario), saltaba al catch
      // de más abajo, que no solo mostraba "Error al añadir la sesión"
      // (engañoso, porque SÍ se había guardado) sino que además volvía a
      // meter la sesión en `_colaPendientes` con `unshift` -- es decir,
      // la próxima vuelta la volvía a procesar y la duplicaba en el plan.
      try {
        const hayMas = this._colaPendientes.length > 0;
        if (!hayMas) {
          Utils.hideLoading();
          this._modalInviteAbierto = false;
          Utils.showToast('✅ Sesión añadida a tu plan personalizado', 'success');
          // 🔥 FIX (v351): mostrarCalendario() solo pinta el contenido, el
          // contenedor #calendarioEntreno empieza oculto por defecto --
          // sin esto, al aceptar la primera sesión sin haber visitado
          // antes la pestaña Plan, el calendario se pinta "a ciegas".
          const calendarioEl = document.getElementById('calendarioEntreno');
          const cuestionarioEl = document.getElementById('cuestionarioEntreno');
          if (calendarioEl) calendarioEl.style.display = 'block';
          if (cuestionarioEl) cuestionarioEl.style.display = 'none';
          if (window.PlanGenerator) {
            PlanGenerator.mostrarCalendario(sesiones);
          }
          if (typeof cargarDashboard === 'function') {
            cargarDashboard();
          }
        } else {
          this._modalInviteAbierto = false;
          this._mostrarSiguienteDeCola();
        }
      } catch (uiError) {
        console.error('Error refrescando la UI tras aceptar la sesión (ya guardada):', uiError);
        Utils.hideLoading();
        this._modalInviteAbierto = false;
      }

    } catch (e) {
      console.error('Error aceptando sesión enviada:', e);
      Utils.hideLoading();
      this._modalInviteAbierto = false;
      Utils.showToast('Error al añadir la sesión a tu plan personalizado', 'error');
      this._colaPendientes.unshift({ id, data });
      this._mostrarSiguienteDeCola();
    }
  },

  // ============================================================
  // 🔥 v15: PACKS DE SESIONES (lado del que recibe)
  // ============================================================

  // Misma personalización que hace _aceptar() cuando no le pasan una ya
  // calculada, para cualquier tipo de sesión.
  _personalizarSesion(sesion, calculo, peso) {
    const det = sesion.detalle || {};
    if (sesion.tipo === 'descanso') {
      return { ritmoStr: null, duracionMin: 0, tss: null, calorias: null, calentamiento: 0, partePrincipal: 0, enfriamiento: 0, distanciaTotal: null };
    }
    if (sesion.tipo === 'strength') {
      return this._calcularPersonalizacionFuerza(det.pasosDetallados, peso);
    }
    if (sesion.tipo === 'series' && det.seriesConfig) {
      return this._calcularPersonalizacionSeries(det.seriesConfig, calculo, peso, det.pasosDetallados || []);
    }
    const modoParte = det.modoPartePrincipal || 'distancia';
    const parteInput = {
      modo: modoParte,
      valor: modoParte === 'tiempo' ? (det.duracionPartePrincipalMin || 0) : (det.distanciaEstimada || 0)
    };
    return this._calcularPersonalizacion(det.zona, parteInput, calculo, peso, det.pasosDetallados || []);
  },

  _fmtDuracion(min) {
    return min > 60 ? `${Math.floor(min / 60)}h ${min % 60}min` : `${min} min`;
  },

  _tarjetaSesionPack(data, p) {
    const s = data.sesion || {};
    const det = s.detalle || {};
    const c = this._colorTipo(s.tipo, true);
    const fechaTxt = new Date(data.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const cabecera = `<div style="font-size:10px; font-weight:600; letter-spacing:0.8px; color:var(--gold); text-transform:capitalize;">${fechaTxt}</div>`;
    const caja = (contenido) => `
      <div style="background:${c.bg}; border:1px solid ${c.accent}; border-left:4px solid ${c.accent}; border-radius:14px; padding:10px 12px; margin-bottom:8px; text-align:left;">
        ${cabecera}${contenido}
      </div>`;

    if (s.tipo === 'descanso') {
      return caja(`<div style="font-size:14px; font-weight:600; color:var(--text-primary); margin-top:2px;">😴 Día de descanso</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">Recuperación y asimilación del entrenamiento.</div>`);
    }

    const nombre = Utils.escapeHTML(det.nombre || s.tipo || 'Sesión');
    const zonaInfo = (s.tipo !== 'strength' && det.zona) ? this._zonaInfo(det.zona) : null;
    const km = (p.distanciaTotal !== null && p.distanciaTotal !== undefined) ? parseFloat(p.distanciaTotal.toFixed(2)) : null;
    const sc = det.seriesConfig;
    return caja(`
      <div style="font-size:14px; font-weight:600; color:var(--text-primary); margin:2px 0 4px;">${this._tipoEmoji(s.tipo)} ${nombre}</div>
      <div style="font-size:12px; color:var(--text-secondary); display:flex; gap:12px; flex-wrap:wrap;">
        <span>🕒 ${this._fmtDuracion(p.duracionMin || 0)}</span>
        ${km !== null ? `<span>📏 ${km} km</span>` : ''}
        ${p.tss !== null && p.tss !== undefined ? `<span>⚡ ${p.tss} TSS</span>` : ''}
        ${p.calorias !== null && p.calorias !== undefined ? `<span>🔥 ${p.calorias} kcal</span>` : ''}
      </div>
      ${zonaInfo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">📊 ${zonaInfo.codigo} · ${zonaInfo.etiqueta} · ⏱️ ${p.ritmoStr || 'sin calcular'}</div>` : ''}
      ${(s.tipo === 'series' && sc) ? `<div style="font-size:10px; color:var(--text-secondary); margin-top:3px; opacity:0.85;">${sc.numBloques} bloque${sc.numBloques !== 1 ? 's' : ''} × ${sc.numSeries} rep. ${sc.modoRep === 'tiempo' ? `de ${sc.tiempoRepSeg}"` : `de ${sc.distRepM}m`}</div>` : ''}
      ${det.objetivo ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${Utils.escapeHTML(det.objetivo)}</div>` : ''}
      ${this._htmlAdjuntos(det.adjuntos, true)}
    `);
  },

  async _mostrarModalPack(entry) {
    const { modal } = this._crearOverlayModal('sessInvite');
    const items = entry.pack.items;
    const primera = items[0].data;
    const nombreAdmin = Utils.capitalizeUsername ? Utils.capitalizeUsername(primera.fromUsername) : (primera.fromUsername || 'El entrenador');
    const packNombre = primera.packNombre || '';

    modal.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">⏳ Calculando tu ritmo, tiempo y calorías para este pack...</div>`;

    const [calculo, peso] = await Promise.all([
      this._obtenerCalculoDestinatario(AppState.currentUserId),
      this._obtenerPesoUsuario(AppState.currentUserId)
    ]);

    if (!document.body.contains(modal)) return;

    // Mismo criterio que la invitación suelta: si alguna sesión necesita
    // zonas y el destinatario no las tiene calculadas, no se puede
    // personalizar nada -- se rechaza el pack entero.
    const necesitaZonas = items.some(({ data }) => {
      const s = data.sesion || {};
      return s.tipo !== 'descanso' && s.tipo !== 'strength' && !!(s.detalle && s.detalle.zona);
    });
    if (necesitaZonas && !calculo) {
      modal.innerHTML = `
        <div style="padding:20px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">🧮</div>
          <div style="font-size:16px; color:var(--text-primary); margin-bottom:16px;">
            <strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado un pack de ${items.length} sesiones
          </div>
          <div style="background:var(--stat-bg); border:1px solid var(--border-color); border-radius:14px; padding:14px; margin-bottom:16px; font-size:12px; color:var(--text-secondary); line-height:1.6; text-align:left;">
            ⚠️ Todavía no tienes tus zonas de entrenamiento calculadas en este dispositivo, así que no podemos calcular tu ritmo, tiempo ni carga para estas sesiones.<br><br>
            No puedes recibir sesiones así -- este pack se marcará como <strong style="color:var(--text-primary);">rechazado</strong>. Calcula tus zonas en tu perfil y pide a <strong style="color:var(--text-primary);">${Utils.escapeHTML(nombreAdmin)}</strong> que te lo vuelva a enviar.
          </div>
          <button id="sessInviteSinZonasBtn" class="action-button" style="width:100%; margin:0;">ENTENDIDO</button>
        </div>
      `;
      document.getElementById('sessInviteSinZonasBtn').addEventListener('click', () => this._rechazarPack(entry));
      requestAnimationFrame(() => { requestAnimationFrame(() => { Utils.hideLoading(); }); });
      return;
    }

    const personalizados = items.map(({ data }) => this._personalizarSesion(data.sesion || {}, calculo, peso));
    const totalMin = personalizados.reduce((sum, p) => sum + (p.duracionMin || 0), 0);
    const totalKm = personalizados.reduce((sum, p) => sum + (p.distanciaTotal || 0), 0);
    const hayEntrenos = items.some(({ data }) => (data.sesion || {}).tipo !== 'descanso');
    const resumen = [
      `${items.length} ${items.length === 1 ? 'sesión' : 'sesiones'}`,
      totalMin > 0 ? `🕒 ${this._fmtDuracion(totalMin)}` : null,
      totalKm > 0 ? `📏 ${parseFloat(totalKm.toFixed(1))} km` : null
    ].filter(Boolean).join(' · ');

    modal.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <div style="font-size:30px; margin-bottom:4px;">📦</div>
        <div style="font-size:16px; color:var(--text-primary);"><strong>${Utils.escapeHTML(nombreAdmin)}</strong> te ha enviado un pack de sesiones</div>
        ${packNombre ? `<div style="font-size:14px; font-weight:600; color:var(--gold); margin-top:4px;">${Utils.escapeHTML(packNombre)}</div>` : ''}
        <div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${resumen}</div>
      </div>
      <div style="padding:14px 16px; overflow-y:auto; flex:1;">
        ${items.map(({ data }, i) => this._tarjetaSesionPack(data, personalizados[i])).join('')}
        ${(!peso && hayEntrenos) ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.4;">ℹ️ Añade tu peso en tu perfil para ver las calorías estimadas de estas sesiones.</div>` : ''}
      </div>
      <div style="padding:14px 16px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; gap:12px;">
        <button id="sessInviteRechazarBtn" class="action-button" style="flex:1; margin:0; background:transparent; border:1px solid var(--border-color-light);">RECHAZAR</button>
        <button id="sessInviteAceptarBtn" class="action-button" style="flex:1; margin:0; background:var(--gold); color:#000;">ACEPTAR TODAS</button>
      </div>
    `;

    document.getElementById('sessInviteRechazarBtn').addEventListener('click', () => this._rechazarPack(entry));
    document.getElementById('sessInviteAceptarBtn').addEventListener('click', () => this._aceptarPack(entry, personalizados));

    requestAnimationFrame(() => { requestAnimationFrame(() => { Utils.hideLoading(); }); });
  },

  // Cambia el estado de TODAS las invitaciones del pack en un solo batch
  // (la regla de Firestore deja al destinatario cambiar solo 'status').
  _marcarPack(items, status) {
    const batch = firebaseServices.db.batch();
    items.forEach(({ id }) => {
      batch.update(firebaseServices.db.collection('sessionInvites').doc(id), { status });
    });
    return batch.commit();
  },

  async _rechazarPack(entry) {
    Utils.showLoading();
    this._cerrarModal('sessInvite');
    try {
      await this._marcarPack(entry.pack.items, 'rejected');
      this._modalInviteAbierto = false;
      Utils.showToast('Pack rechazado', 'info');
      this._mostrarSiguienteDeCola();
    } catch (e) {
      console.error('Error rechazando pack:', e);
      Utils.hideLoading();
      this._modalInviteAbierto = false;
      Utils.showToast('Error al rechazar el pack', 'error');
      this._colaPendientes.unshift(entry);
      this._mostrarSiguienteDeCola();
    }
  },

  // Vuelca VARIAS sesiones en el plan personalizado con UNA sola escritura.
  // Es la misma lógica que _aceptar() (crear el plan si no existe, adelantar
  // su inicio desplazando lo ya guardado si alguna fecha es anterior, una
  // sesión por diaGlobal -- la nueva sustituye a la que hubiera ese día),
  // generalizada a una lista. items = [{ fecha, sesion, personalizado }].
  async _volcarSesionesEnPlan(uid, items) {
    const fechaMin = items.reduce((min, it) => (it.fecha < min ? it.fecha : min), items[0].fecha);

    let planPersonalizado = await this._getPlanPersonalizado(uid);
    let planCreadoAhora = false;
    if (!planPersonalizado) {
      planPersonalizado = await this._crearPlanPersonalizado(uid, fechaMin);
      planCreadoAhora = true;
    }
    const planId = planPersonalizado.id;
    const planData = planPersonalizado.data;

    const fechaInicioActual = new Date(planData.params.fechaInicio);
    const fechaMinDate = new Date(fechaMin);
    let diffDays = 0;
    if (!planCreadoAhora && fechaMinDate < fechaInicioActual) {
      diffDays = Math.round((fechaInicioActual - fechaMinDate) / (1000 * 60 * 60 * 24));
      planData.params.fechaInicio = fechaMinDate.toISOString();
      planData.sesiones = (planData.sesiones || []).map(s => {
        if (s.diaGlobal !== undefined) s.diaGlobal += diffDays;
        return s;
      });
    }
    const fechaInicio = new Date(planData.params.fechaInicio);

    const planRef = firebaseServices.db.collection('users').doc(uid).collection('planes').doc(planId);
    const planDoc = await planRef.get();
    if (!planDoc.exists) throw new Error('El plan personalizado no existe');
    const planCompleto = planDoc.data();
    let sesiones = planCompleto.sesiones || [];
    let sesionesRealizadas = planCompleto.sesionesRealizadas || {};
    let feedback = planCompleto.feedback || {};

    if (diffDays > 0) {
      sesiones = planData.sesiones;
      sesionesRealizadas = this._desplazarClavesDiaGlobal(sesionesRealizadas, diffDays);
      feedback = this._desplazarClavesDiaGlobal(feedback, diffDays);
    }

    items.forEach(({ fecha, sesion, personalizado }) => {
      const diaGlobal = Math.floor((new Date(fecha) - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
      if (diaGlobal < 1) throw new Error('La fecha de una sesión es anterior al inicio del plan');
      const nuevaSesion = {
        diaGlobal,
        semana: Math.floor((diaGlobal - 1) / 7) + 1,
        diaSemana: ((diaGlobal - 1) % 7) + 1,
        fase: 'PERSONALIZADO',
        nivel: 'intermedio',
        tipo: sesion.tipo,
        color: PlanGenerator.getColor(sesion.tipo),
        letra: PlanGenerator.getLetra(sesion.tipo),
        tieneFuerza: false,
        duracion: personalizado.duracionMin || 0,
        detalle: this._construirDetalleSesion(sesion, personalizado)
      };
      const idx = sesiones.findIndex(s => s.diaGlobal === diaGlobal);
      if (idx >= 0) sesiones[idx] = nuevaSesion;
      else sesiones.push(nuevaSesion);
    });
    sesiones.sort((a, b) => a.diaGlobal - b.diaGlobal);

    const updateData = { sesiones };
    if (diffDays > 0) {
      updateData['params.fechaInicio'] = planData.params.fechaInicio;
      updateData.sesionesRealizadas = sesionesRealizadas;
      updateData.feedback = feedback;
    }
    await planRef.update(updateData);

    AppState.planActualId = planId;
    AppState.planGeneradoActual = planData.params;
    AppState.planActualTipo = planData.tipo || null;
    AppState.sesionesRealizadas = sesionesRealizadas;
    AppState.feedbackSesiones = feedback;

    await firebaseServices.db.collection('users').doc(uid).update({ ultimoPlanId: planId });
    return { sesiones };
  },

  async _aceptarPack(entry, personalizados) {
    Utils.showLoading();
    this._cerrarModal('sessInvite');
    const items = entry.pack.items;
    try {
      const uid = AppState.currentUserId;
      const { sesiones } = await this._volcarSesionesEnPlan(uid, items.map((it, i) => ({
        fecha: it.data.fecha,
        sesion: it.data.sesion,
        personalizado: personalizados[i]
      })));
      await this._marcarPack(items, 'accepted');

      // Igual que en _aceptar(): a partir de aquí lo guardado ya está
      // guardado y lo que sigue es solo UI -- un fallo pintando NO debe
      // volver a encolar el pack.
      try {
        const hayMas = this._colaPendientes.length > 0;
        if (!hayMas) {
          Utils.hideLoading();
          this._modalInviteAbierto = false;
          Utils.showToast(`✅ ${items.length} sesiones añadidas a tu plan personalizado`, 'success');
          const calendarioEl = document.getElementById('calendarioEntreno');
          const cuestionarioEl = document.getElementById('cuestionarioEntreno');
          if (calendarioEl) calendarioEl.style.display = 'block';
          if (cuestionarioEl) cuestionarioEl.style.display = 'none';
          if (window.PlanGenerator) {
            PlanGenerator.mostrarCalendario(sesiones);
          }
          if (typeof cargarDashboard === 'function') {
            cargarDashboard();
          }
        } else {
          this._modalInviteAbierto = false;
          this._mostrarSiguienteDeCola();
        }
      } catch (uiError) {
        console.error('Error refrescando la UI tras aceptar el pack (ya guardado):', uiError);
        Utils.hideLoading();
        this._modalInviteAbierto = false;
      }
    } catch (e) {
      console.error('Error aceptando el pack:', e);
      Utils.hideLoading();
      this._modalInviteAbierto = false;
      Utils.showToast('Error al añadir el pack a tu plan personalizado', 'error');
      this._colaPendientes.unshift(entry);
      this._mostrarSiguienteDeCola();
    }
  },

  _conValoresPorDefecto(detalleOriginal, personalizado, tipo) {
    const zonaInfo = detalleOriginal.zona ? this._zonaInfo(detalleOriginal.zona) : null;
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

    if (tipo === 'strength') {
      const ACCION_FUERZA = {
        CALENTAMIENTO: 'Movilidad articular y activación progresiva antes de los ejercicios.',
        'PARTE PRINCIPAL': 'Realiza los ejercicios indicados con buena técnica, priorizando la forma sobre la carga.',
        ESTIRAMIENTOS: 'Estiramientos suaves de la musculatura trabajada.'
      };
      const PORQUE_FUERZA = {
        CALENTAMIENTO: 'Prepara músculos y articulaciones para el trabajo de fuerza.',
        'PARTE PRINCIPAL': 'Es el estímulo clave de esta sesión.',
        ESTIRAMIENTOS: 'Facilita la recuperación y mantiene la movilidad.'
      };
      const pasosFuerza = (detalleOriginal.pasosDetallados || []).map(p => {
        const tit = (p.titulo || '').toUpperCase();
        const clave = SessionInvites._esCalent(tit) ? 'CALENTAMIENTO'
          : SessionInvites._esEnfria(tit) ? 'ESTIRAMIENTOS'
          : 'PARTE PRINCIPAL';
        return {
          ...p,
          accion: (p.accion && p.accion.trim()) ? p.accion : ACCION_FUERZA[clave],
          porque: (p.porque && p.porque.trim()) ? p.porque : PORQUE_FUERZA[clave]
        };
      });
      return {
        porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
          ? detalleOriginal.porque
          : 'Sesión de fuerza complementaria, programada por tu entrenador.',
        sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim()) ? detalleOriginal.sensacion : 'Exigente pero controlada',
        pasosDetallados: pasosFuerza,
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

    // 🔥 v15.1: el paso "PARTE PRINCIPAL" lleva el tiempo calculado con las
    // zonas de este usuario (km × su ritmo, o esfuerzo + descansos de las
    // series) aunque el que creó la sesión no escribiera minutos ahí.
    let partePrincipalRellenada = false;
    const pasosCompletos = (detalleOriginal.pasosDetallados || []).map(p => {
      const tit = (p.titulo || '').toUpperCase();
      const clave = SessionInvites._esCalent(tit) ? 'CALENTAMIENTO'
        : SessionInvites._esEnfria(tit) ? 'ENFRIAMIENTO'
        : 'PARTE PRINCIPAL';
      const paso = {
        ...p,
        accion: (p.accion && p.accion.trim()) ? p.accion : ACCION_POR_DEFECTO[clave],
        porque: (p.porque && p.porque.trim()) ? p.porque : PORQUE_POR_DEFECTO[clave]
      };
      if (!partePrincipalRellenada && !p.tipoExtra && clave === 'PARTE PRINCIPAL'
          && personalizado && personalizado.partePrincipalCalculadaMin !== undefined && personalizado.partePrincipalCalculadaMin !== null) {
        paso.duracionMin = personalizado.partePrincipalCalculadaMin;
        partePrincipalRellenada = true;
      }
      return paso;
    });

    return {
      porque: (detalleOriginal.porque && detalleOriginal.porque.trim())
        ? detalleOriginal.porque
        : `Sesión de ${tipo || 'entrenamiento'} en zona ${zonaInfo ? zonaInfo.etiqueta.toLowerCase() : 'objetivo'}, programada por tu entrenador.`,
      sensacion: (detalleOriginal.sensacion && detalleOriginal.sensacion.trim())
        ? detalleOriginal.sensacion
        : (zonaInfo ? (SENSACION_POR_ZONA[zonaInfo.codigo] || 'Controlada') : 'Controlada'),
      pasosDetallados: pasosCompletos,
      tiempoEnZona: personalizado.partePrincipal ? Utils.formatR(personalizado.partePrincipal) : (detalleOriginal.tiempoEnZona || null)
    };
  }
};

window.SessionInvites = SessionInvites;
console.log('✅ SessionInvites v14.4 - Un entrenador (no admin) ya solo puede elegir entre sus alumnos aceptados, no entre todos sus amigos (ver Storage.acceptTrainerRequest); doble comprobación de seguridad justo antes de enviar');