// ==================== app.js - VERSIÓN COMPLETA CON HILOS DE CONVERSACIÓN DE SOPORTE ====================
// VERSIÓN: 4.89 - Nieve en modo claro: copos blancos con contorno azul grisáceo (antes blanco sobre fondo claro, casi invisible), más copos (×0.85) y cielo de nieve con más cuerpo.
// VERSIÓN: 4.89 - Tiempo: la posición se lee SIEMPRE de nuevo al abrir/recargar la app, volver a ella e iniciar sesión (maximumAge 0, sin reutilizar la guardada ni depender de permissions.query); la guardada solo vale si tiene < 30 min (< 10 min para el primer pintado) y el tiempo se vuelve a pedir en cada apertura. Si el GPS falla, ciudad del perfil.
// VERSIÓN: 4.88 - Fondo del tiempo aún más discreto (cielo 0.62→0.40, nubes 0.62→0.42, lluvia/nieve 0.72→0.60, viento y niebla →0.55) y corregida la línea recta que cortaba las nubes por abajo (el sprite de nube medía 110 px y la nube central llegaba a 124).
// VERSIÓN: 4.87 - Fondo del tiempo mucho más discreto (SUAVE): cielo ~38 % más ligero, nubes más tenues/lentas y menos en nublado (7→4), lluvia/nieve/viento un 30-40 % menos densos y niebla más suave; velo del color de la tarjeta más fuerte y largo para dejar limpia la zona del texto.
// VERSIÓN: 4.86 - Línea de lugar y tiempo: «26° · Nublado» es un bloque que no se parte (si no cabe junto al lugar baja entero y desaparece el « · » suelto). Nube gris del icono con más cuerpo.
// VERSIÓN: 4.85 - El GPS se busca solo cada vez que se abre la app, al volver a ella y cada 10 min (antes solo con permiso previo o al tocar el tiempo). Primero se pinta con la última posición conocida y luego se actualiza. Posición reutilizable 2 min (antes 30).
// VERSIÓN: 4.84 - Una sola línea bajo el saludo: «Lugar · 21° · Nublado», donde el lugar es siempre el del tiempo mostrado (tu ubicación real o la ciudad del perfil). Antes: ciudad del perfil + tiempo de otro sitio.
// VERSIÓN: 4.83 - Icono del saludo en colores reales del tiempo (sol amarillo, nubes blancas/grises, gotas azules, rayo amarillo, luna crema) con contorno que se adapta al modo claro/oscuro. Sin 📍 en la ciudad.
// VERSIÓN: 4.82 - Modo claro en todos los climas: nubes de noche con sombra, niebla gris azulada (antes blanca sobre fondo claro) y estrellas con halo.
// VERSIÓN: 4.81 - Modo claro: las nubes del fondo se distinguen mejor (sombra azulada más marcada y algo más de opacidad).
// VERSIÓN: 4.80 - Icono del saludo en modo claro: más color del nivel (72 % en vez de 38 %), igual que el número de nivel.
// VERSIÓN: 4.79 - Icono del saludo sin filtros CSS (en modo claro dibujaban un recuadro blanco): el halo de contraste se dibuja en el propio SVG siguiendo la forma de cada trazo.
// VERSIÓN: 4.78 - Quitados el sol y la luna dibujados en el fondo de la tarjeta de inicio (el icono del saludo ya los indica); el cielo, estrellas, nubes, lluvia, etc. siguen.
// VERSIÓN: 4.77 - Icono del saludo monocolor con el color del nivel (más profundo en claro) y halo de contraste; nube/rayo recortan al sol/luna para que no se fundan; fix: la animación ya no pisa el transform de nube y luna menguante.
// VERSIÓN: 4.76 - WeatherFX.icono(): el saludo del Dashboard usa iconos SVG animados (sol que gira, luna con fase, nubes que flotan, gotas, copos, rayo, niebla en rayas) en vez de emojis; respeta «reducir movimiento».
// VERSIÓN: 4.75 - WeatherFX.emoji(): el icono del saludo del Dashboard (☀️/🌙 con fase lunar/☁️/🌧️…) refleja el tiempo real y la fase de la luna; emite «weatherfx:escena» al cambiar.
// VERSIÓN: 4.74 - Modo claro: cielo con más color (tintado hacia azul en vez de gris sucio), velo lateral más ligero, halo del sol más cálido. Insignia de nivel y zapatilla transparentes como en el oscuro.
// VERSIÓN: 4.73 - Sol/luna colocados midiendo la insignia de nivel y la zapatilla reales (nunca quedan tapados). Admin: el detalle de usuario abierto desde una lista ya no parpadea (sin fundido sobre el modal de detrás).
// VERSIÓN: 4.72 - WeatherFX: «nublado» con nubes de borde más definido, grandes, con sombra inferior y techo gris oscuro arriba, para distinguirlo de la niebla (velo liso) y del parcial.
// VERSIÓN: 4.71 - WeatherFX: sol/luna en el hueco libre (ya no tapan la zapatilla), lluvia en 3 intensidades claras, viento y niebla más visibles, y lluvia/nieve/viento más legibles en modo claro.
// VERSIÓN: 4.70 - WeatherFX: la lluvia/nieve y la nubosidad medidas (precipitation, rain, showers, snowfall, cloud_cover de Open-Meteo) corrigen el weather_code («nublado» con lluvia); refresco cada 10 min; en modo claro el cielo no oscurece la tarjeta.
// VERSIÓN: 4.69 - WeatherFX rediseñado (minimalista, estilo Apple Tiempo): cielo con más cuerpo en modo claro, lluvia fina y lenta, viento, niebla suave, texto «24° · Lluvia» sin emojis.
// VERSIÓN: 4.68 - FIX «sesión recién marcada no aparece en el Muro»: switchTab('comunidad') llama a Wall.init() si la
//                 subpestaña Muro ya está activa (antes solo se llamaba al tocar el botón «Muro», así que la publicación
//                 que llegó con el Muro oculto no se pintaba hasta cambiar a Amigos y volver).
// VERSIÓN: 4.67 - Utils.avatarFallback() ya no puede heredar la clase
//                 .wall-avatar-loading (fundido de entrada de las fotos de
//                 usuario del Muro, ver wall.js v4.20) con opacidad 0 sin
//                 forma de recuperarla -- se quitan esa clase y
//                 .wall-avatar-loaded del emoji de repuesto al crearlo, así
//                 nunca se queda invisible si la foto falla antes de cargar.
// VERSIÓN: 4.66 - DEDUPLICACIÓN DE LECTURAS DE FIRESTORE (sin cambios de
//                 comportamiento): (1) precargarDatos() ya no lanza
//                 Profile.cargarPerfil() sin esperar -- ese perfil se
//                 volvía a cargar por completo justo después, con await,
//                 desde auth.js (_cargarDatosYMostrarApp o
//                 _cargarDatosEnBackground), en TODOS los flujos de login/
//                 restauración de sesión actuales; era una segunda carga
//                 en paralelo totalmente redundante. (2) El listener de
//                 'conversations' (unsubscribeConversations) fusiona
//                 ahora el comportamiento del listener extra que
//                 index.html añadía sobre AppState.iniciarListeners --
//                 mismo collection()+where(), así que cada mensaje/
//                 conversación nueva disparaba Chat.updateUnreadBadge()
//                 (consulta N+1 nada barata) DOS veces. Se conserva el
//                 único efecto propio de aquel listener (refrescar "Mis
//                 amigos" si esa subpestaña está abierta) y se elimina el
//                 listener duplicado.
// VERSIÓN: 4.65 - Se cierra del todo el parpadeo "al entrar se ve cargar":
//                 (1) Wall.precargarMuro(), que este archivo ya llamaba
//                 desde la v4.63, NUNCA había existido en wall.js -- la
//                 comprobación `if (Wall.precargarMuro)` fallaba en
//                 silencio y el muro no se precargaba de verdad. Se añade
//                 la función que faltaba en wall.js v4.18. (2) Nuevo
//                 Admin.precargarEstadisticas() (con caché en memoria,
//                 reutilizada por cargarEstadisticas() salvo que se pida
//                 forzar) y (3) Sponsors.precargarAdminLista() pasa de
//                 dispararse sola al evento 'ri5:appready' a ESPERARSE de
//                 verdad -- ambas añadidas a la misma espera crítica de
//                 precargarDatos(), pero SOLO si this.isAdmin: no le
//                 cuesta ninguna lectura ni ninguna espera extra a los
//                 usuarios normales, solo a la propia cuenta de admin. Así,
//                 tanto Soporte→Admin (estadísticas) como
//                 Administración→Tienda (lista de patrocinadores) salen ya
//                 completas la primera vez que se entra.
// VERSIÓN: 4.64 - Tiempo real de "Mis alumnos"/"Entrenado por" sin
//                 depender de tener la pestaña abierta: los listeners de
//                 alumnosAceptados, invitaciones enviadas rechazadas, y
//                 friendIds ahora refrescan siempre la caché (sessionStorage,
//                 ver friends.js v3.57), no solo cuando la pestaña está
//                 visible en ese momento. Se añade seguimiento de
//                 entrenadoresAceptados (aviso + refresco de "Entrenado
//                 por" cuando un entrenador te retira) y un pre-calentado
//                 de la caché de "Mis alumnos" nada más iniciar sesión
//                 (setCurrentUser) para que ni la primera vez se note
//                 espera.
// VERSIÓN: 4.63 - FIX parpadeo del muro en la primera visita. Causa real:
//                 precargarDatos() se lanzaba SIN await desde
//                 setCurrentUser(), así que _cargarDatosYMostrarApp()
//                 terminaba y mostraba la app ANTES de que el listener
//                 del muro hubiera recibido su primer snapshot. En ese
//                 hueco (300ms-1s), si el usuario tocaba Muro, veía el
//                 contenedor vacío y luego las tarjetas apareciendo de
//                 golpe -- el parpadeo reportado. Fix: (1) setCurrentUser
//                 ahora hace `await this.precargarDatos()`, (2)
//                 precargarDatos es async y hace `await
//                 Wall.precargarMuro()`, (3) se elimina la llamada a
//                 Wall.detenerListener() de switchTab('muro') -- el
//                 listener se mantiene abierto toda la sesión, (4) se
//                 añade Wall.detenerListener() a detenerListeners() para
//                 cerrarlo correctamente en logout. La espera se solapa
//                 con la pantalla de "EN PROCESO" del login, así que no
//                 ralentiza la percepción de arranque.
// VERSIÓN: 4.62 - Precarga del muro en segundo plano (ver Wall.precargarMuro
//                 en wall.js v4.16). En precargarDatos() se añade una
//                 llamada a Wall.precargarMuro(), y en switchTab('muro')
//                 se elimina Wall.detenerListener() -- el listener del
//                 muro ya no se destruye/recrea en cada visita a su
//                 pestaña, con lo que la lista se pinta una sola vez al
//                 iniciar sesión y ya no se ve ningún parpadeo ni recarga
//                 visible al entrar. Además se ahorran lecturas de
//                 Firestore: entrar/salir de la pestaña Muro ya no cuesta
//                 nada.
// VERSIÓN: 4.61 - Nuevo panel "Mis alumnos" (entrenadorAlumnosSection):
//                 solo se muestra a un entrenador que no sea admin --
//                 un entrenador ya no puede enviar sesiones a cualquier
//                 amigo suyo, solo a los que le acepten expresamente
//                 como entrenador (ver friends.js/storage.js/
//                 session-invites.js).
// VERSIÓN: 4.60 - FIX visual: la pestaña "Administración" del perfil de
//                 admin llevaba delante el emoji "🛠️", que se renderiza en
//                 modo color-emoji (más alto que los iconos de texto de sus
//                 3 pestañas vecinas: Perfil/Entreno/Entrenador) y por eso
//                 desalineaba toda la fila. Se quita el emoji y, para que
//                 la pestaña siga distinguiéndose de un vistazo, el texto
//                 "Administración" se pinta con el color de nivel propio
//                 del admin (Gamification.getColorByLevel), en vez de un
//                 icono.
// VERSIÓN: 4.59 - (1) Hacer/quitar entrenador a un usuario ya no recarga
//                 toda la lista de administración (cargarUsuarios(true)):
//                 solo se actualiza en el sitio el botón de esa fila.
//                 (2) La etiqueta de la pestaña de Soporte ya no cambia
//                 para el entrenador (ver index.html: nueva pestaña
//                 "🎯 Entrenador" independiente, y entrenadorTab en
//                 setCurrentUser).
// VERSIÓN: 4.58 - FIX: si el admin mandaba un broadcast a 30 usuarios a la
//                 vez, el panel de Soporte mostraba las 30 conversaciones
//                 de golpe en vez de solo las 10 más recientes (con
//                 "cargar más" para el resto). Causa: _cargarTandaConversaciones
//                 solo usaba el objetivo (10) para decidir si pedir OTRA
//                 tanda a Firestore, pero nunca recortaba la lista final --
//                 si un único lote de 40 mensajes traía 30 conversaciones
//                 distintas (los 30 mensajes del broadcast, con timestamp
//                 casi idéntico), las 30 se colaban. Ahora la lista
//                 siempre se recorta al número exacto que toca mostrar; lo
//                 que sobra se queda en memoria (sin re-leer Firestore)
//                 para cuando se pulse "cargar más".
// VERSIÓN: 4.57 - El panel de Soporte del admin pasa de pedir un número
//                 fijo de MENSAJES (150, v4.56) a pedir por CONVERSACIONES:
//                 se leen tandas pequeñas (40 mensajes) hasta reunir 10
//                 usuarios distintos, en vez de un bloque grande que podía
//                 traer datos de 20-30 conversaciones aunque el admin solo
//                 fuera a abrir un par. "Cargar más" trae 10 conversaciones
//                 más cada vez, con el mismo criterio.
// VERSIÓN: 4.56 - Panel de Soporte del admin: 1) getMensajesSoporteAdmin()
//                 pasa a estar paginado (antes traía la colección entera
//                 sin límite en cada apertura) con botón "cargar
//                 conversaciones más antiguas"; 2) los datos de cada
//                 usuario (nombre/foto) se piden en paralelo y se cachean
//                 por uid, en vez de uno a uno y sin caché. Además,
//                 "ENVIAR MENSAJE A TODOS" pasa a "ENVIAR MENSAJE" con
//                 selector A TODOS / A ELEGIDOS (Admin.abrirSelectorDestinatarios),
//                 reutilizando la caché de usuarios de SessionInvites.
// VERSIÓN: 4.55 - "Eliminar usuario" (panel admin) ahora borra TODO su
//                 rastro en Firestore, no solo lo básico de antes. Antes
//                 solo se borraban: subcolecciones propias (historial,
//                 planes, cálculos, gps_tracks), gamificación,
//                 publicaciones propias del Muro y la estructura antigua
//                 de mensajes -- quedaban huérfanos: la subcolección
//                 `mensajes` (soporte, estilo nuevo), la colección
//                 `soporteMensajes` (copia global que ve el admin),
//                 `friendRequests`, `conversations`, `sessionInvites`,
//                 `sessionGroups` que hubiera creado, su membresía en
//                 grupos ajenos, sus "me gusta" en publicaciones de OTROS
//                 (quedaban como like fantasma de una cuenta inexistente),
//                 su presencia en el `friendIds` de quien le tuviera
//                 añadido como amigo, y su foto de perfil en Storage.
//                 Ahora se purga todo eso también, con avisos concretos
//                 si algún paso falla (no se detiene a la primera). IMPOR-
//                 TANTE: la cuenta de Firebase Authentication NO se borra
//                 desde el cliente (no es posible sin un backend/Cloud
//                 Function) -- el aviso de confirmación y el toast final
//                 recuerdan borrarla a mano en la consola de Firebase.
// VERSIÓN: 4.54 - Ahorro de lecturas de Firestore: los listeners en tiempo
//                 real de "mensajes de soporte propios" y "me gusta
//                 propios" (globalFeed) escuchaban TODO el historial sin
//                 límite. Cada reconexión del listener (móvil
//                 bloqueado/desbloqueado corriendo con GPS, cortes de
//                 cobertura) volvía a facturar una lectura por cada
//                 documento de ese historial completo, aunque no hubiera
//                 cambiado nada -- con pocos usuarios activos pero
//                 sesiones/mensajes acumulados, esto podía consumir gran
//                 parte de la cuota diaria gratis sin tráfico real. Ahora
//                 ambos listeners se acotan (orderBy+limit: últimos 50
//                 mensajes / últimas 30 publicaciones) -- ni el chat de
//                 soporte completo ni las publicaciones antiguas se ven
//                 afectados (se siguen cargando enteros con get() al
//                 abrir esas pantallas), solo el AVISO en vivo de fondo
//                 se limita a lo reciente.
// VERSIÓN: 4.53 - Fix: la tarjeta de soporte del usuario se quedaba en
//                 blanco (sin ningún mensaje) si currentUserId aún no
//                 estaba listo en el momento de entrar en la pestaña
//                 (p.ej. al volver la app de segundo plano) o si algo
//                 fallaba al cargar los datos. cargarSoporteUsuario()
//                 ahora: 1) muestra "Cargando…" y reintenta unas veces
//                 si el usuario todavía no está identificado, 2) envuelve
//                 la carga en try/catch y muestra un mensaje de error
//                 legible en vez de dejar el contenedor vacío.
// ====================

// ==================== CONFIGURACIÓN INICIAL ====================
if(!localStorage.getItem('ri5_initialized')) {
  const keysToRemove = [];
  for(let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if(key && (key.startsWith('ri5') || key.startsWith('historial_') || key.startsWith('ultimoCalculo_') || key.startsWith('ultimoPlan_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.setItem('ri5_initialized', 'true');
}

// ==================== UTILS ====================
const Utils = {
  // 🔥 Insignia de entrenador verificado (la concede el admin).
  // Devuelve la píldora "Entrenador" y, si procede, el sello pulsable.
  // Solo el sello (sin la píldora "Entrenador"): para sitios donde ya se
  // sabe que es entrenador, p.ej. la tarjeta "Entrenado por".
  selloVerificado(u) {
    if (!u || !u.isTrainer || u.trainerVerified !== true) return '';
    return `<span class="badge-verificado" role="button" tabindex="0" aria-label="Entrenador verificado" data-titulo="${this.escapeHTML(u.trainerTitle || '')}" onclick="event.stopPropagation(); Utils.mostrarVerificado(this)">` +
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg></span>';
  },

  pillEntrenador(u) {
    if (!u || !u.isTrainer) return '';
    return ' <span class="badge-entrenador">Entrenador</span>' + this.selloVerificado(u);
  },

  mostrarVerificado(el) {
    const titulo = (el && el.dataset && el.dataset.titulo) || '';
    document.getElementById('verificadoOverlay')?.remove();
    const ov = document.createElement('div');
    ov.id = 'verificadoOverlay';
    ov.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:30000; display:flex; align-items:center; justify-content:center; padding:20px;';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--bg-card); border:1px solid var(--gold); border-radius:16px; padding:24px 20px; max-width:340px; width:100%; text-align:center;';
    box.onclick = (e) => e.stopPropagation();
    const ico = document.createElement('div');
    ico.className = 'badge-verificado';
    ico.style.cssText = 'margin:0 auto 10px; display:block; width:48px; height:48px;';
    ico.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>';
    const h = document.createElement('div');
    h.style.cssText = 'font-size:20px; font-weight:600; color:var(--gold); margin-bottom:8px;';
    h.textContent = 'Entrenador verificado';
    const p = document.createElement('div');
    p.style.cssText = 'font-size:14px; color:var(--text-primary); margin-bottom:6px;';
    p.textContent = titulo ? ('Titulación: ' + titulo) : 'Titulación acreditada';
    const n = document.createElement('div');
    n.style.cssText = 'font-size:12px; color:var(--text-secondary); margin-bottom:16px;';
    n.textContent = 'RI5 ha comprobado la titulación de este entrenador.';
    const b = document.createElement('button');
    b.className = 'action-button';
    b.style.cssText = 'width:100%; margin:0;';
    b.textContent = 'ENTENDIDO';
    b.onclick = () => ov.remove();
    box.append(ico, h, p, n, b);
    ov.appendChild(box);
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  },

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  avatarFallback(imgEl) {
    if (!imgEl || !imgEl.parentNode) return;
    const placeholder = document.createElement('div');
    placeholder.className = imgEl.className;
    // 🔥 v4.67: si la imagen tenía el fundido de entrada de wall.js
    // (.wall-avatar-loading, ver wall.js/index.html) y falla ANTES de
    // llegar a cargar, el emoji de repuesto heredaría esa clase con
    // opacidad 0 -- y como este placeholder nunca recibe el evento onload
    // que añade .wall-avatar-loaded, se quedaría invisible para siempre.
    // Se quitan ambas clases; en cualquier otro avatar del proyecto que no
    // las use, esto no hace nada.
    placeholder.classList.remove('wall-avatar-loading', 'wall-avatar-loaded');
    const h = imgEl.offsetHeight || parseInt(imgEl.style.height) || 40;
    placeholder.style.cssText = imgEl.style.cssText +
      ';display:flex;align-items:center;justify-content:center;' +
      'background:var(--bg-secondary);font-size:' + Math.round(h * 0.5) + 'px;';
    placeholder.textContent = '👤';
    imgEl.replaceWith(placeholder);
  },

  bindTap(el, callback) {
    if (!el) return;
    let startX = 0, startY = 0, moved = false, touchFired = false;
    el.addEventListener('touchstart', (e) => {
      moved = false;
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 10 || dy > 10) moved = true;
      }
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (!moved) {
        touchFired = true;
        e.preventDefault();
        e.stopPropagation();
        callback(e);
        setTimeout(() => { touchFired = false; }, 600);
      }
    }, { passive: false });
    el.addEventListener('click', (e) => {
      if (touchFired) { e.stopPropagation(); return; }
      e.stopPropagation();
      callback(e);
    });
  },

  parseTime(t) {
    if (!t || typeof t !== 'string') return NaN;
    t = t.trim().replace(',', ':').replace('.', ':');

    if (!t.includes(':')) {
      let minutos = parseFloat(t);
      if (isNaN(minutos)) return NaN;
      if (minutos >= 5 && minutos <= 20) {
        return minutos;
      } else {
        return NaN;
      }
    }

    const parts = t.split(':');
    let m = parseInt(parts[0]);
    let s = parts[1] ? parseInt(parts[1]) : 0;
    if (isNaN(m) || isNaN(s) || s > 59 || m > 20 || m < 5) return NaN;
    return m + s/60; 
  },

  // Formatea el tiempo del test de 2 km mientras se escribe.
  // Minutos de 1 cifra (5-9, p. ej. 8:30 -> teclear 8 3 0) o de 2 cifras
  // (10-20, o con cero delante: 0 8 3 0 -> 08:30). Si la primera cifra es
  // 3-9 se entiende un solo dígito de minutos; con 0, 1 o 2, dos dígitos.
  autoFormatearTiempo(e) {
    const input = e.target;
    const inputType = e.inputType || '';
    const borrando = inputType.indexOf('delete') === 0;

    let digitos = input.value.replace(/\D/g, '').slice(0, 4);
    const minLen = (digitos.length && parseInt(digitos[0], 10) >= 3) ? 1 : 2;
    let formateado = digitos;

    if (digitos.length > minLen) {
      formateado = digitos.slice(0, minLen) + ':' + digitos.slice(minLen, minLen + 2);
    } else if (digitos.length === minLen && !borrando) {
      formateado = digitos + ':00';
    }

    input.value = formateado;

    if (digitos.length === minLen && !borrando) {
      input.setSelectionRange(minLen + 1, minLen + 3);
    } else {
      const pos = formateado.length;
      input.setSelectionRange(pos, pos);
    }
  },

  formatR(r) {
    if(!isFinite(r)||r<=0) return "--:--";
    let m = Math.floor(r), s = Math.round((r-m)*60);
    if(s===60){ m++; s=0; }
    return m+":"+(s<10?'0':'')+s;
  },

  formatTime(secondsOrMs, isMs = false) {
    let totalSecs = isMs ? Math.floor(secondsOrMs / 1000) : Math.floor(secondsOrMs);
    if (totalSecs < 0) totalSecs = 0;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },

  _animarTextoDorado(elemento, texto, colorFinal) {
    if (!elemento) return 0;
    const VELOCIDAD_MS = 90;
    const ENTRADA_MS = 320;
    const PAUSA_MS = 200;
    const COLOR_MS = 550;
    const GOLD = '#c0a060';
    const LEVEL_COLORS = ['#9e9e9e', '#7fa1c9', '#6bb3ae', '#7fb37a', '#a9bd6a', '#cbb15f', '#cf9760', '#c97b5f', '#bd6688', '#9270c9'];
    const colorFinalReal = colorFinal || GOLD;

    elemento.innerHTML = '';
    const letras = texto.split('');
    const spans = letras.map((ch, i) => {
      const span = document.createElement('span');
      span.textContent = (ch === ' ') ? '\u00A0' : ch;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateX(-10px)';
      span.style.color = (ch === ' ') ? colorFinalReal : LEVEL_COLORS[i % LEVEL_COLORS.length];
      span.style.transition = `opacity ${ENTRADA_MS}ms ease, transform ${ENTRADA_MS}ms ease, color ${COLOR_MS}ms ease`;
      elemento.appendChild(span);
      return span;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        spans.forEach((span, i) => {
          setTimeout(() => {
            span.style.opacity = '1';
            span.style.transform = 'translateX(0)';
          }, i * VELOCIDAD_MS);
        });
        const finEntrada = (letras.length - 1) * VELOCIDAD_MS + ENTRADA_MS;
        setTimeout(() => {
          spans.forEach(span => { span.style.color = colorFinalReal; });
        }, finEntrada + PAUSA_MS);
      });
    });

    const finEntrada = (letras.length - 1) * VELOCIDAD_MS + ENTRADA_MS;
    return finEntrada + PAUSA_MS + COLOR_MS;
  },

  showLoading(texto) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
    const textoEl = document.getElementById('loadingOverlayText');
    const duracionAnimacion = textoEl ? this._animarTextoDorado(textoEl, (texto || 'EN PROCESO').toUpperCase()) : 0;
    this._loadingToken = (this._loadingToken || 0) + 1;
    this._loadingShownAt = Date.now();
    this._loadingMinDuration = duracionAnimacion + 150;
  },

  hideLoading() {
    const miToken = this._loadingToken;
    const transcurrido = Date.now() - (this._loadingShownAt || 0);
    const restante = (this._loadingMinDuration || 0) - transcurrido;
    return new Promise(resolve => {
      const ocultarYa = () => {
        if (this._loadingToken !== miToken) { resolve(); return; }
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
        if (typeof window._ri5MarcarAppLista === 'function') window._ri5MarcarAppLista();
        resolve();
      };
      if (restante > 0) { setTimeout(ocultarYa, restante); return; }
      ocultarYa();
    });
  },

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    // Los avisos conservan su emoji inicial; se quitan solo restos de estilo terminal ("> ..._")
    toast.textContent = String(message == null ? '' : message)
      .replace(/^>\s*/, '')
      .replace(/_\s*$/, '')
      .trim();
    toast.style.setProperty('--toast-out', Math.max(duration - 200, 800) + 'ms');
    toast.onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  confirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('confirmOverlay');
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const yesBtn = document.getElementById('confirmYes');
      const noBtn = document.getElementById('confirmNo');

      if (!overlay || !modal || !msgEl || !yesBtn || !noBtn) {
        resolve(false);
        return;
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      overlay.classList.add('active');
      modal.classList.add('active');

      const onYes = () => {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
        resolve(true);
      };
      const onNo = () => {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
        resolve(false);
      };

      yesBtn.addEventListener('click', onYes);
      noBtn.addEventListener('click', onNo);
    });
  },

  promptModal(titulo, { label = '', placeholder = '', valorInicial = '', textarea = false, maxLength = 500 } = {}) {
    return new Promise((resolve) => {
      document.getElementById('utilsPromptModal')?.remove();
      document.getElementById('utilsPromptOverlay')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'utilsPromptOverlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
        z-index: 100010; display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.id = 'utilsPromptModal';
      modal.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        max-width: 400px;
        width: 90%;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
      max-height: 90vh; max-height: 90dvh; overflow-y: auto; -webkit-overflow-scrolling: touch; box-sizing: border-box;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;

      const fieldHTML = textarea
        ? `<textarea id="utilsPromptInput" maxlength="${maxLength}" placeholder="${placeholder}" style="width: 100%; min-height: 90px; padding: 10px; border-radius: 14px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); font-family: inherit; resize: vertical;"></textarea>`
        : `<input type="text" id="utilsPromptInput" maxlength="${maxLength}" placeholder="${placeholder}" style="width: 100%; padding: 10px; border-radius: 14px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary);">`;

      modal.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: var(--accent-yellow);">${titulo}</h3>
        <div style="margin-bottom: 24px;">
          ${label ? `<label style="display: block; text-align: left; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${label}</label>` : ''}
          ${fieldHTML}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="utilsPromptCancel" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 24px; border-radius: 14px; cursor: pointer;">CANCELAR</button>
          <button id="utilsPromptConfirm" style="background: var(--accent-blue); border: none; color: var(--bg-primary); padding: 8px 24px; border-radius: 14px; cursor: pointer;">CONFIRMAR</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

      const input = document.getElementById('utilsPromptInput');
      input.value = valorInicial || '';
      input.focus();
      if (!textarea) input.select();

      const cerrar = (valor) => { overlay.remove(); resolve(valor); };

      document.getElementById('utilsPromptConfirm').onclick = () => {
        const val = input.value.trim();
        cerrar(val ? val : null);
      };
      document.getElementById('utilsPromptCancel').onclick = () => cerrar(null);
      overlay.onclick = (e) => { if (e.target === overlay) cerrar(null); };
      if (!textarea) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') document.getElementById('utilsPromptConfirm').click();
        });
      }
    });
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+$/.test(email);
  },

  vibrate(pattern) {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  },

  playSound(type) {
    if (!window.audioEnabled) return;
    if (!window.audioContext) {
      try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    const osc = window.audioContext.createOscillator();
    const gainNode = window.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = type === 'success' ? 800 : 400;
    gainNode.gain.value = 0.1;
    gainNode.gain.exponentialRampToValueAtTime(0.00001, window.audioContext.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(window.audioContext.destination);
    osc.start();
    osc.stop(window.audioContext.currentTime + 0.2);
  },

  scrollToElement(elementId, offset = 0) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  },

  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 5 + 2,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        color: `hsl(${Math.random() * 60 + 300}, 70%, 60%)`
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let still = false;
      for (let p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < canvas.height) still = true;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      if (still) {
        requestAnimationFrame(draw);
      } else {
        canvas.style.display = 'none';
      }
    }
    draw();
  },

  handleFirebaseError(error) {
    console.error('Firebase Error:', error);
    let message = '';

    switch(error.code) {
      case 'auth/email-already-in-use':
        message = 'Este correo ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Correo electrónico no válido';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Usuario o contraseña incorrectos';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Comprueba tu red';
        break;
      case 'auth/requires-recent-login':
        message = 'Esta operación requiere autenticación reciente. Vuelve a iniciar sesión';
        break;
      case 'permission-denied':
        message = 'No tienes permisos para esta acción';
        break;
      case 'unavailable':
        message = 'Servicio no disponible. Intenta más tarde';
        break;
      default:
        message = 'Error inesperado. Inténtalo de nuevo más tarde';
    }

    if (message) {
      this.showToast(message, 'error');
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  capitalizeUsername(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
};

// ==================== ESTADO GLOBAL ====================
const AppState = {
  zonasCalculadas: false,
  lastName: "", lastAge: 0, lastFC: 0, lastUL: 0,
  lastZones: [], lastPred: [], lastRitmoBase: 0, lastVam: 0, lastRitmoVam: 0,
  ultimoPlanParams: null,
  planGeneradoActual: null,
  planActualId: null,
  sesionesRealizadas: {},
  feedbackSesiones: {},
  camposTocados: { name: false, age: false, time: false },
  currentUser: null,
  currentUserId: null,
  currentUserEmail: null,
  currentUserData: null,
  currentSesionDetalle: null,
  deferredPrompt: null,
  mensajesNoLeidos: 0,
  mensajesSoporteAdminNoLeidos: 0,
  isPremium: false,
  emailVerified: false,
  premiumExpiryDate: null,
  calculosMes: 0,
  mesActual: '',
  trimestreActual: 0,
  calendarioMesActual: null,
  unsubscribeMensajes: null,
  isAdmin: false,
  isTrainer: false,

  // 🔥 solicitudesPendientesCount ahora es la SUMA en tiempo real de dos
  // contadores independientes (amistad + entrenador), cada uno alimentado
  // por su propio listener onSnapshot -- ver _recalcularSolicitudesPendientes()
  // e iniciarListeners(). Antes solo existía el de amistad, escribiendo
  // directamente sobre solicitudesPendientesCount.
  solicitudesPendientesCount: 0,
  solicitudesAmistadPendientesCount: 0,
  solicitudesEntrenadorPendientesCount: 0,
  mensajesAmigosNoLeidos: 0,
  likesNuevosCount: 0,
  // 🔥 IDs de las entradas propias (globalFeed) con "me gusta" sin leer,
  // más reciente primero. Antes solo se guardaba el TOTAL (likesNuevosCount);
  // ahora también se guarda QUÉ sesión concreta es, para poder centrarla al
  // tocar la notificación en vez de solo abrir el Muro en general.
  entriesConLikesNuevos: [],

  unsubscribeFriendRequests: null,
  unsubscribeConversations: null,
  unsubscribeMensajesSoporte: null,
  unsubscribeMisDatos: null,
  unsubscribeSolicitudesEnviadas: null,
  // 🔥 Invitaciones de entrenador: mismos dos listeners que ya existían
  // para friendRequests (recibidas para el badge/lista en vivo, enviadas
  // para el toast de "rechazada" y refrescar "Mis alumnos"), pero sobre
  // trainerRequests.
  unsubscribeSolicitudesEntrenadorRecibidas: null,
  unsubscribeSolicitudesEntrenadorEnviadas: null,
  _friendIdsPrevios: [],
  _alumnosAceptadosPrevios: [],

  historialPagination: {
    lastDoc: null,
    hasMore: true,
    loading: false
  },

  setLastCalc(d) {
    if (!d) return;
    this.lastName = d.name || "";
    this.lastAge = d.age || 0;
    this.lastFC = d.fcMax || 0;
    this.lastUL = d.ul || 0;
    this.lastZones = d.zones || [];
    this.lastPred = d.pred || [];
    this.lastRitmoBase = d.ritmoBase || 0;
    this.lastVam = d.vam || 0;
    this.lastRitmoVam = d.ritmoVam || 0;
    this.zonasCalculadas = true;
  },

  clearLastCalc() {
    this.zonasCalculadas = false;
    this.lastName = "";
    this.lastAge = 0;
    this.lastFC = 0;
    this.lastUL = 0;
    this.lastZones = [];
    this.lastPred = [];
    this.lastRitmoBase = 0;
    this.lastVam = 0;
    this.lastRitmoVam = 0;
  },

  _actualizarBadgeComunidad() {
    const badge = document.getElementById('comunidadBadge');
    if (!badge) return;
    const total = (this.solicitudesPendientesCount || 0) + (this.mensajesAmigosNoLeidos || 0) + (this.likesNuevosCount || 0);
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  actualizarBadgePremium() {
    const t = document.getElementById('appLogoText');
    if (!t) return;
    t.classList.remove('premium');
  },

  // 🔥 Muestra/oculta la pestaña "🎯 Entrenador" y la sección "Mis
  // alumnos" según isAdmin/isTrainer. Se llama al hacer login
  // (setCurrentUser) y también en tiempo real desde iniciarListeners()
  // cuando el propio documento de usuario cambia -- así, si un admin
  // asciende a alguien a entrenador con la sesión ya abierta, la pestaña
  // aparece al instante, a la vez que la píldora del perfil, sin
  // necesidad de recargar ni volver a entrar.
  actualizarVisibilidadPestanaEntrenador() {
    const entrenadorTab = document.getElementById('perfilEntrenadorTab');
    if (entrenadorTab) {
      entrenadorTab.style.display = (this.isAdmin || this.isTrainer) ? '' : 'none';
    }
    // "Mis alumnos" (invitar/quitar) es solo para un entrenador que NO es
    // admin: el admin ya puede enviar sesiones a cualquier usuario sin
    // necesitar su aceptación previa, así que este panel no le aporta
    // nada y solo generaría confusión (ver index.html: entrenadorAlumnosSection).
    const alumnosSection = document.getElementById('entrenadorAlumnosSection');
    if (alumnosSection) {
      alumnosSection.style.display = (this.isTrainer && !this.isAdmin) ? '' : 'none';
    }
    // Pre-calentado: si es entrenador (no admin), se pide ya en segundo
    // plano -- sin await, sin bloquear nada -- para que la primera vez que
    // abra la pestaña "Mis alumnos" esté al instante también, en vez de
    // notarse una espera la primera vez. cargarPanelAlumnos() sin
    // forceRefresh ya comprueba sola si hace falta pedir algo (usa
    // sessionStorage si ya había).
    if (this.isTrainer && !this.isAdmin && window.Friends && Friends.cargarPanelAlumnos) {
      Friends.cargarPanelAlumnos();
    }
  },

  async setCurrentUser(uid, email, userData = null) {
    this.currentUserId = uid;
    this.currentUserEmail = email;
    this.currentUserData = userData;
    this.currentUser = userData?.username ? Utils.capitalizeUsername(userData.username) : (email ? email.split('@')[0] : null);

    if (userData && !userData.username_lowercase && userData.username) {
      const newLowercase = userData.username.toLowerCase();
      firebaseServices.db.collection('users').doc(uid).update({
        username_lowercase: newLowercase
      }).catch(e => console.warn('Error actualizando username_lowercase:', e));
      userData.username_lowercase = newLowercase;
      this.currentUserData = userData;
    }

    this.isAdmin = userData?.isAdmin || false;
    // 🔥 Rol de entrenador: lo asigna el admin desde el Panel de control.
    // Un entrenador no es admin (no ve gestión de usuarios ni soporte),
    // pero sí ve el panel de "Generar sesión" para crear y enviar
    // entrenos a otros usuarios, igual que ya puede hacer el admin.
    this.isTrainer = userData?.isTrainer || false;
    // 🔥 Petición del usuario: un entrenador es premium por defecto, sin
    // que haga falta que el campo `premium` esté a true en Firestore.
    // Se calcula DESPUÉS de isTrainer (arriba) para poder usarlo aquí.
    // Ojo: esto NO basta por sí solo -- puedeVerDetalleSesion() exige
    // además premiumExpiryDate, que un entrenador nunca tiene, así que
    // tiene su propio bypass por isTrainer (ver más abajo).
    this.isPremium = (userData?.premium || false) || this.isTrainer;
    this.premiumExpiryDate = userData?.expires ? new Date(userData.expires) : null;
    this.emailVerified = userData?.emailVerified || false;
    this.calculosMes = userData?.calculosMes || 0;
    this.mesActual = userData?.mesActual || '';

    this.limpiarDatosPlan();

    if (uid) {
      localStorage.setItem('ri5_current_user', uid);
      localStorage.setItem('ri5_user_email', email || '');
      if (this.isAdmin) {
        localStorage.setItem('ri5_is_admin', 'true');
      } else {
        localStorage.removeItem('ri5_is_admin');
      }
      if (this.isTrainer) {
        localStorage.setItem('ri5_is_trainer', 'true');
      } else {
        localStorage.removeItem('ri5_is_trainer');
      }
    } else {
      localStorage.removeItem('ri5_current_user');
      localStorage.removeItem('ri5_user_email');
      localStorage.removeItem('ri5_is_admin');
      localStorage.removeItem('ri5_is_trainer');
      if (window.Wall) {
        Wall.detenerListener();
      }
    }

    this.actualizarBadgePremium();

    if (this.currentUser) {
      const nameField = document.getElementById('name');
      if(nameField) nameField.value = this.currentUser;
    }

    const soporteTab = document.getElementById('perfilSoporteTab');
    if (soporteTab) {
      // 🔥 El entrenador ya no cambia la etiqueta de esta pestaña: tiene su
      // propia pestaña "🎯 Entrenador" (ver perfilEntrenadorTab más abajo),
      // así que aquí solo se distingue admin de usuario normal.
      if (this.isAdmin) {
        // 🔥 v4.60: se quita el emoji "🛠️" de delante de "Administración".
        // Ese emoji en concreto se renderiza en modo color-emoji (más alto
        // que el resto de iconos de estas pestañas, que son glifos de texto
        // normales), así que esta pestaña salía más alta que sus 3 vecinas
        // (Perfil/Entreno/Entrenador) y todo la fila de pestañas quedaba
        // desalineada. En su lugar, el texto se pinta con el color de
        // nivel propio del admin (mismo sistema de color por nivel que ya
        // usa el resto de la app: Gamification.getColorByLevel), para que
        // siga siendo distinguible de un vistazo sin depender de un icono.
        const nivelPropio = parseInt(localStorage.getItem('ri5_lastLevel'), 10) || 1;
        const colorAdmin = (window.Gamification && Gamification.getColorByLevel(nivelPropio)) || 'var(--gold)';
        soporteTab.innerHTML = `<span class="tab-ico">🛡️</span><span class="tab-txt" style="color:${colorAdmin};">Administración</span>`;
      } else {
        soporteTab.innerHTML = '<span class="tab-ico">💬</span><span class="tab-txt">Soporte</span>';
      }
    }
    // 🔥 Extraído a su propia función (antes vivía inline aquí) para poder
    // volver a llamarla en tiempo real desde iniciarListeners() cuando un
    // admin cambia el rol de entrenador de alguien con la sesión ya
    // abierta -- antes solo se evaluaba una vez, al hacer login, así que
    // la píldora "Entrenador" del perfil se actualizaba en caliente
    // (userChanged/onSnapshot ya la repintaba) pero la pestaña "🎯
    // Entrenador" (y "Mis alumnos" dentro de ella) se quedaba oculta o
    // visible según el rol ANTIGUO hasta recargar la app.
    this.actualizarVisibilidadPestanaEntrenador();
    if (typeof actualizarBarraSoporteAdmin === 'function') actualizarBarraSoporteAdmin();

    this.actualizarInterfazPremium();
    this.verificarExpiracionPremium();

    this.actualizarBotonCalcular();

    if (uid && userData) {
      localStorage.setItem('ri5_user_data', JSON.stringify(userData));
    } else {
      localStorage.removeItem('ri5_user_data');
    }

    if (uid) {
      this.iniciarListeners();
      // 🔥 v4.63: AWAIT en precargarDatos(). Antes se lanzaba sin esperar y
      // la app se mostraba antes de que el listener del muro hubiera
      // recibido su primer snapshot -- si el usuario tocaba Muro en ese
      // hueco (300ms-1s), veía el contenedor vacío y luego las tarjetas
      // apareciendo de golpe. Ese era el parpadeo reportado. Ahora se
      // espera a que TODO lo que precargarDatos() considera crítico (en
      // la práctica, sobre todo el muro) esté listo antes de devolver el
      // control a _cargarDatosYMostrarApp(), que es quien llama a
      // _mostrarAppYBienvenida() y oculta el splash. La espera se solapa
      // con la pantalla de "EN PROCESO" del login, así que no ralentiza
      // la percepción de arranque.
      await this.precargarDatos();
      if (window.UI) UI.restaurarEstado();

      if (window.Storage) {
        Storage.autoSyncPhotoURL(uid, userData?.profile?.photoURL || null)
          .catch(e => console.warn('Auto-sync de photoURL falló:', e));
      }
    } else {
      this.detenerListeners();
    }
  },

  // 🔥 v4.63: ahora es async y AWAITEA la precarga del muro (ver
  // setCurrentUser). El resto de precargas (perfil, amigos, mensajes...) se
  // siguen lanzando sin await -- van en background, no son visibles al
  // usuario como pantalla vacía si llegan tarde. Solo el muro necesita
  // bloquear, porque es el único que el usuario puede ver "vacío" si entra
  // antes de que el listener reciba su primer snapshot.
  async precargarDatos() {
    if (!this.currentUserId) return;
    console.log('🔄 Precargando datos en segundo plano...');
    // 🔥 FIX lectura duplicada: antes aquí se lanzaba Profile.cargarPerfil()
    // sin esperar, EN PARALELO con la carga de perfil que auth.js ya hace
    // explícitamente (con await) justo después de llamar a
    // setCurrentUser() -- tanto en el login normal
    // (_cargarDatosYMostrarApp) como al restaurar sesión desde caché
    // (_cargarDatosEnBackground). cargarPerfil() hace exactamente las
    // mismas lecturas (users/{uid}, comprobación de amigos huérfanos,
    // gamification/{uid}...) sin importar su parámetro forceRefresh --
    // solo cambia cómo pinta mientras tanto -- así que esta llamada era
    // una segunda carga completa, totalmente redundante con la que
    // siempre viene justo después. Se elimina; auth.js sigue cargando el
    // perfil una sola vez, como corresponde.
    if (window.Friends) {
      Friends.cargarListaAmigos().catch(e => console.warn('Error precargando amigos:', e));
      if (document.getElementById('todosUsuariosList')) {
        Friends.cargarTodosUsuarios(true).catch(e => console.warn('Error precargando explorar:', e));
      }
      if (Friends.precargarPerfilesAmigos) {
        Friends.precargarPerfilesAmigos().catch(e => console.warn('Error precargando perfiles de amigos:', e));
      }
    }
    if (window.UI && UI.cargarSoporteUsuario) {
      UI.cargarSoporteUsuario().catch(e => console.warn('Error precargando mensajes:', e));
    }
    // 🔥 v10.13 (session-invites.js): precarga en segundo plano de "MIS
    // ÚLTIMAS SESIONES CREADAS" (panel de entrenador/admin en "Crear
    // sesión"/"Sesiones enviadas") -- solo para quien puede verlo. Para
    // cuando esa pestaña se abra de verdad, ya está lista sin esqueleto
    // ni espera.
    if (window.SessionInvites && (this.isAdmin || this.isTrainer) && SessionInvites.precargarHistorial) {
      SessionInvites.precargarHistorial().catch(e => console.warn('Error precargando historial de sesiones creadas:', e));
    }
    // 🔥 v4.63: AWAIT en Wall.precargarMuro() -- ver el comentario largo
    // en setCurrentUser. Con este await, cuando _cargarDatosYMostrarApp()
    // ejecute _mostrarAppYBienvenida() (y el usuario vea la app), el muro
    // ya está pintado desde antes, y al tocar la pestaña Muro no se verá
    // ningún hueco vacío ni parpadeo. En la práctica la espera se solapa
    // con el splash de entrada, así que no hay ninguna ralentización
    // perceptible en el arranque.
    // 🔥 Se suma aquí Sponsors.precargarBannerInicio() a esta misma espera
    // crítica, EN PARALELO con el muro (Promise.all, no en serie -- no
    // queremos sumar su tiempo al del muro): así, cuando se oculta el
    // splash, el banner de tienda del Dashboard -- imagen incluida -- ya
    // está completamente cargado, en vez de aparecer a destiempo una vez
    // que el usuario ya está viendo la app (ver sponsors.js).
    const preloadCriticos = [];
    if (window.Wall && Wall.precargarMuro) {
      preloadCriticos.push(Wall.precargarMuro().catch(e => console.warn('Error precargando el muro:', e)));
    }
    if (window.Sponsors && Sponsors.precargarBannerInicio) {
      preloadCriticos.push(Sponsors.precargarBannerInicio().catch(e => console.warn('Error precargando el banner de tienda:', e)));
    }
    // 🔥 Lo siguiente es EXCLUSIVO de la cuenta de admin (this.isAdmin):
    // no le añade ninguna lectura ni ninguna espera a los más de 300
    // usuarios normales. A cambio, cuando el admin entra en Soporte→Admin
    // (estadísticas) o en Administración→Tienda (lista de patrocinadores),
    // ambas salen ya completas desde el primer instante, sin el
    // "Cargando..."/"0" que se veía antes mientras Firestore respondía.
    // Sponsors.precargarAdminLista() ya existía (se lanzaba sola al evento
    // 'ri5:appready', ver sponsors.js), pero SIN esperarse: si el admin
    // navegaba muy rápido hasta esa pantalla, aún podía pillarla a medias.
    // Aquí sí se espera, junto con el muro y el banner de tienda.
    if (this.isAdmin) {
      if (window.Admin && Admin.precargarEstadisticas) {
        preloadCriticos.push(Admin.precargarEstadisticas().catch(e => console.warn('Error precargando estadísticas de admin:', e)));
      }
      if (window.Sponsors && Sponsors.precargarAdminLista) {
        preloadCriticos.push(Sponsors.precargarAdminLista().catch(e => console.warn('Error precargando el panel admin de tiendas:', e)));
      }
    }
    if (preloadCriticos.length) await Promise.all(preloadCriticos);
  },

  limpiarDatosPlan() {
    this.planGeneradoActual = null;
    this.planActualId = null;
    this.sesionesRealizadas = {};
    this.diasDobles = {};
    this.feedbackSesiones = {};
    this.trimestreActual = 0;
  },

  actualizarInterfazPremium() {
    // No se deshabilitan los botones de plan: un <button disabled> no
    // dispara 'onclick' al tocarlo, y en móvil no hay forma de explicar
    // el motivo (no hay hover para el title). Cada acción (toggleCuestionario
    // en calendar.js, generarCalendarioEntreno, borrarPlanGuardado) ya
    // comprueba premium por sí misma y muestra el aviso con el contacto
    // de Instagram si hace falta.

    const counterDiv = document.getElementById('calculoCounter');
    if(counterDiv) {
      counterDiv.style.display = 'block';
      const restantes = this.isPremium ? 'Ilimitado' : (3 - this.calculosMes);
      counterDiv.innerHTML = `Cálculos este mes: ${this.calculosMes} (restan ${restantes} gratis)`;
    }

    // FIX: la píldora PREMIUM/STANDARD del perfil (profile.js) solo se
    // pintaba al cargar la pestaña Perfil -- si isPremium cambiaba con esa
    // pestaña ya abierta (caducidad detectada por verificarExpiracionPremium,
    // o un cambio en tiempo real desde Firestore), la píldora se quedaba
    // con el texto antiguo mientras que Auth.showPremiumBenefits (el modal
    // que abre al pulsarla) ya usaba el valor nuevo -- pudiendo verse la
    // píldora en PREMIUM y el modal decir Standard, o al revés. Si la
    // píldora está en el DOM ahora mismo, se actualiza también aquí.
    const perfilPlanBadge = document.getElementById('perfilPlanBadge');
    if (perfilPlanBadge) perfilPlanBadge.textContent = this.isPremium ? 'PREMIUM' : 'STANDARD';

    this.actualizarBotonCalcular();
  },

  verificarExpiracionPremium() {
    const banner = document.getElementById('premium-expiry-banner');
    const message = document.getElementById('expiry-message');

    // Petición del usuario: un entrenador es premium por defecto y no
    // tiene fecha de caducidad -- sin este guard, un entrenador que en su
    // día tuvo premium de pago (con `expires` ya en el pasado) veía aquí
    // el banner de "premium expirado" y, peor, esta función le ponía
    // isPremium = false, pisando el premium gratuito que le da su rol.
    if (!this.isTrainer && this.premiumExpiryDate) {
      const ahora = new Date();
      const diasRestantes = Math.ceil((this.premiumExpiryDate - ahora) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes <= 7 && diasRestantes > 0) {
        if (banner) {
          banner.style.display = 'block';
          if (message) message.innerText = `Tu premium expira en ${diasRestantes} días`;
        }
      } else if (diasRestantes <= 0) {
        if (banner) {
          banner.style.display = 'block';
          if (message) message.innerText = `⚠️ Tu premium ha expirado`;
        }
        this.isPremium = false;
        this.actualizarInterfazPremium();
      } else {
        if (banner) banner.style.display = 'none';
      }
    }
  },

  puedeVerDetalleSesion() {
    // 🔥 Petición del usuario: un entrenador es premium por defecto. A
    // diferencia del premium de pago (que siempre lleva `expires`, ver
    // Admin.guardarPremium), un entrenador no tiene fecha de caducidad --
    // exigir premiumExpiryDate aquí como para cualquier premium normal
    // hacía que esta función devolviera false SIEMPRE para un entrenador
    // sin premium de pago encima, bloqueándole el propio calendario/plan.
    if (this.isTrainer) return true;
    if (this.isPremium && this.premiumExpiryDate && new Date() <= this.premiumExpiryDate) {
      return true;
    }
    return false;
  },

  async incrementarCalculo() {
    if(!this.currentUserId) return false;

    const ahora = new Date();
    const mesActualKey = `${ahora.getFullYear()}-${ahora.getMonth() + 1}`;

    if(this.mesActual !== mesActualKey) {
      this.calculosMes = 0;
      this.mesActual = mesActualKey;
    }

    const limite = this.isPremium ? Infinity : 3;
    if (this.calculosMes >= limite) {
      Utils.showToast('Límite de 3 cálculos mensuales alcanzado. Actualiza a premium para más.', 'warning');
      return false;
    }

    try {
      await firebaseServices.db.collection('users').doc(this.currentUserId).update({
        calculosMes: firebaseServices.FieldValue.increment(1)
      });
      this.calculosMes++;
    } catch (error) {
      console.error('Error incrementando calculosMes:', error);
      if (error.code === 'permission-denied') {
        Utils.showToast('Has alcanzado el límite de cálculos mensuales. Hazte premium para seguir usando la calculadora.', 'warning');
      } else {
        Utils.showToast('Error al registrar cálculo. Intenta de nuevo.', 'error');
      }
      return false;
    }

    this.actualizarInterfazPremium();
    return true;
  },

  actualizarBotonCalcular() {
    const btn = document.getElementById("calcBtn");
    if (!btn) return;
    const ageValid = document.getElementById('age') && document.getElementById('age').value && !isNaN(parseInt(document.getElementById('age').value));
    const timeValid = document.getElementById('time') && document.getElementById('time').value && !isNaN(Utils.parseTime(document.getElementById('time').value));
    const hayCampos = ageValid && timeValid;
    if (this.isPremium || (this.calculosMes < 3)) {
      btn.disabled = !hayCampos;
      if (!hayCampos) btn.title = "Completa edad y tiempo";
      else btn.title = "";
    } else {
      btn.disabled = true;
      btn.title = "Límite de 3 cálculos mensuales alcanzado. Actualiza a premium.";
    }
  },

  resetHistorialPagination() {
    this.historialPagination = {
      lastDoc: null,
      hasMore: true,
      loading: false
    };
  },

  _panelAmigosActivo(nombre) {
    const comunidadActiva = document.getElementById('tab-comunidad')?.classList.contains('active');
    if (!comunidadActiva) return false;
    const amigosSubtabActiva = document.getElementById('subtab-amigos')?.classList.contains('active');
    if (!amigosSubtabActiva) return false;
    return !!document.getElementById(`amigos-${nombre}`)?.classList.contains('active');
  },

  _solicitudesEnviadasVisibles() {
    if (!this._panelAmigosActivo('solicitudes')) return false;
    return document.querySelector('.solicitudes-tab.active')?.dataset.tab === 'enviadas';
  },

  // 🔥 Misma idea que _solicitudesEnviadasVisibles(), para la subpestaña
  // "🎯 Entrenador" de Solicitudes (invitaciones recibidas).
  _solicitudesEntrenadorVisibles() {
    if (!this._panelAmigosActivo('solicitudes')) return false;
    return document.querySelector('.solicitudes-tab.active')?.dataset.tab === 'entrenador';
  },

  // 🔥 El badge/pestaña de "Solicitudes" combina invitaciones de amistad
  // Y de entrenador; cada listener onSnapshot (ver iniciarListeners)
  // actualiza SOLO su propio contador y llama aquí para recalcular el
  // total y repintar -- así ninguno de los dos pisa el conteo del otro.
  _recalcularSolicitudesPendientes() {
    this.solicitudesPendientesCount =
      (this.solicitudesAmistadPendientesCount || 0) + (this.solicitudesEntrenadorPendientesCount || 0);
    this.actualizarBadgeSolicitudes();
  },

  iniciarListeners() {
    this.detenerListeners();
    if (!this.currentUserId) return;

    this._friendIdsPrevios = [...(this.currentUserData?.friendIds || [])];
    this._alumnosAceptadosPrevios = [...(this.currentUserData?.alumnosAceptados || [])];
    this._entrenadoresAceptadosPrevios = [...(this.currentUserData?.entrenadoresAceptados || [])];
    this.unsubscribeMisDatos = firebaseServices.db
      .collection('users')
      .doc(this.currentUserId)
      .onSnapshot(async (doc) => {
        if (!doc.exists) return;
        const nuevaData = doc.data();
        const friendIdsNuevos = nuevaData.friendIds || [];
        const friendIdsAnteriores = this._friendIdsPrevios || [];

        const nuevosAmigos = friendIdsNuevos.filter(id => !friendIdsAnteriores.includes(id));
        const amigosEliminados = friendIdsAnteriores.filter(id => !friendIdsNuevos.includes(id));

        this.currentUserData = { ...this.currentUserData, ...nuevaData };
        this._friendIdsPrevios = friendIdsNuevos;

        // Premium/gratis en tiempo real: antes AppState.isPremium solo
        // se leía UNA VEZ, al iniciar sesión (setCurrentUser) -- así que
        // si el admin cambiaba el plan de alguien, o el premium caducaba/
        // se renovaba, no se reflejaba en la app hasta cerrar sesión y
        // volver a entrar. Este listener ya escucha CUALQUIER cambio en
        // el documento del usuario (lo usa para friendIds), así que se
        // aprovecha para refrescar también esto en cuanto llega, sin
        // necesitar un listener nuevo.
        const premiumAntes = this.isPremium;
        // Petición del usuario: un entrenador es premium por defecto.
        // trainerAhora usa el valor NUEVO si viene en este snapshot (por
        // si el admin lo asciende/desciende justo ahora), o el actual si
        // este campo en concreto no ha cambiado -- this.isTrainer todavía
        // no se ha reasignado en este punto (eso pasa unas líneas más
        // abajo), así que no se puede leer directamente todavía.
        const trainerAhora = nuevaData.isTrainer !== undefined ? nuevaData.isTrainer : this.isTrainer;
        const nuevoIsPremium = (nuevaData.premium || false) || trainerAhora;
        const nuevoExpiry = nuevaData.expires ? new Date(nuevaData.expires) : null;
        if (nuevoIsPremium !== premiumAntes || String(this.premiumExpiryDate) !== String(nuevoExpiry)) {
          this.isPremium = nuevoIsPremium;
          this.premiumExpiryDate = nuevoExpiry;
          if (nuevaData.calculosMes !== undefined) this.calculosMes = nuevaData.calculosMes;
          if (nuevaData.mesActual !== undefined) this.mesActual = nuevaData.mesActual;
          this.actualizarInterfazPremium();
          if (!premiumAntes && nuevoIsPremium) {
            Utils.showToast('¡Ya eres premium! Todo desbloqueado.', 'success');
          } else if (premiumAntes && !nuevoIsPremium) {
            Utils.showToast('Tu premium ha finalizado. Sigues teniendo acceso gratuito.', 'info');
          }
        }
        // Lo mismo para isAdmin/isTrainer: se actualizan en caliente
        // por si el admin le cambia el rol a alguien con la sesión abierta.
        // FIX: antes solo se actualizaba el valor en AppState (lo que ya
        // bastaba para que la píldora "Entrenador" del perfil se
        // repintara, porque esa vive dentro de currentUserData), pero la
        // pestaña "Entrenador" se calcula una sola vez al hacer login
        // y no se volvía a evaluar -- así que la píldora cambiaba al
        // instante pero la pestaña solo aparecía tras recargar o volver a
        // entrar. Ahora, si cualquiera de los dos roles cambia de verdad,
        // se vuelve a evaluar su visibilidad en el mismo momento.
        const rolAntes = { isAdmin: this.isAdmin, isTrainer: this.isTrainer };
        if (nuevaData.isAdmin !== undefined) this.isAdmin = nuevaData.isAdmin;
        if (nuevaData.isTrainer !== undefined) this.isTrainer = nuevaData.isTrainer;
        if (rolAntes.isAdmin !== this.isAdmin || rolAntes.isTrainer !== this.isTrainer) {
          this.actualizarVisibilidadPestanaEntrenador();
          // Si en ese momento se está viendo la propia subpestaña de
          // Perfil, se repinta también para que la píldora "Entrenador"
          // cambie exactamente a la vez que la pestaña, sin esperar a
          // salir y volver a entrar en Perfil.
          const subtabPerfilDatos = document.getElementById('subtab-perfil-datos');
          if (subtabPerfilDatos && subtabPerfilDatos.classList.contains('active') && window.Profile && Profile.cargarPerfil) {
            Profile.cargarPerfil(true).catch(e => console.warn('Error repintando perfil tras cambio de rol:', e));
          }
        }

        // alumnosAceptados en tiempo real: mismo listener que ya vigila
        // friendIds, aprovechado para detectar cuándo un amigo acepta (o
        // deja de aceptar) tu invitación de entrenador -- incluye el caso
        // de que la aceptación llegue desde OTRO dispositivo con la
        // sesión abierta, no solo la propia acción local.
        const alumnosAntes = this._alumnosAceptadosPrevios || [];
        const alumnosAhora = nuevaData.alumnosAceptados || [];
        const alumnosGanados = alumnosAhora.filter(id => !alumnosAntes.includes(id));
        const alumnosPerdidos = alumnosAntes.filter(id => !alumnosAhora.includes(id));
        this._alumnosAceptadosPrevios = alumnosAhora;

        if (alumnosGanados.length || alumnosPerdidos.length) {
          for (const uidNuevoAlumno of alumnosGanados) {
            try {
              const otroUsuario = await Storage.getUser(uidNuevoAlumno);
              const nombre = Utils.capitalizeUsername(otroUsuario?.username || 'Usuario');
              Utils.showToast(`${nombre} ahora es tu atleta`, 'success');
            } catch (e) { /* nombre opcional, no bloquea el resto */ }
          }
          // Ya no depende de tener la pestaña abierta en ese momento --
          // se refresca la CACHÉ (sessionStorage) igualmente, para que en
          // cuanto se abra la pestaña "Mis alumnos" esté al día al
          // instante, sin ningún salto de carga (ver friends.js v3.57).
          if (this.isTrainer && !this.isAdmin && window.Friends && Friends.cargarPanelAlumnos) {
            Friends.cargarPanelAlumnos(true);
          }
          // Que el nuevo alumno pueda recibir sesiones YA, sin recargar
          // ni reabrir "Generar sesión": invalida la lista cacheada de
          // destinatarios de SessionInvites (ver invalidarCacheUsuarios).
          if (this.isTrainer && !this.isAdmin && window.SessionInvites && SessionInvites.invalidarCacheUsuarios) {
            SessionInvites.invalidarCacheUsuarios();
          }
        }

        // entrenadoresAceptados en tiempo real (lado del alumno): mismo
        // patrón que alumnosAceptados justo arriba, pero para detectar
        // cuándo un entrenador te retira (o cuando tú mismo te aceptas
        // desde otro dispositivo). Alimenta la sección "Entrenado por" del
        // perfil propio (ver Friends.cargarEntrenadoPor).
        const entrenadoresAntes = this._entrenadoresAceptadosPrevios || [];
        const entrenadoresAhora = nuevaData.entrenadoresAceptados || [];
        const entrenadoresGanados = entrenadoresAhora.filter(id => !entrenadoresAntes.includes(id));
        const entrenadoresPerdidos = entrenadoresAntes.filter(id => !entrenadoresAhora.includes(id));
        this._entrenadoresAceptadosPrevios = entrenadoresAhora;

        if (entrenadoresGanados.length || entrenadoresPerdidos.length) {
          for (const uidEntrenadorPerdido of entrenadoresPerdidos) {
            try {
              const otroUsuario = await Storage.getUser(uidEntrenadorPerdido);
              const nombre = Utils.capitalizeUsername(otroUsuario?.username || 'Usuario');
              Utils.showToast(`${nombre} ya no es tu entrenador`, 'info');
            } catch (e) { /* nombre opcional, no bloquea el resto */ }
          }
          if (window.Friends && Friends.cargarEntrenadoPor) Friends.cargarEntrenadoPor();
        }

        if (nuevosAmigos.length === 0 && amigosEliminados.length === 0) return;

        if (this.currentUserId) {
          sessionStorage.removeItem(`amigos_lista_${this.currentUserId}`);
          sessionStorage.removeItem(`explorar_usuarios_${this.currentUserId}`);
        }

        if (window.Friends) {
          for (const uidNuevoAmigo of nuevosAmigos) {
            try {
              const otroUsuario = await Storage.getUser(uidNuevoAmigo);
              const nombre = Utils.capitalizeUsername(otroUsuario?.username || 'Usuario');
              Utils.showToast(`Ahora eres amigo de ${nombre}`, 'success');
            } catch (e) { /* si falla el nombre, seguimos sin bloquear el resto */ }
            if (Friends._modalAmigoUidActual === uidNuevoAmigo) {
              Friends.abrirModalAmigo(uidNuevoAmigo);
            }
          }
          for (const uidEliminado of amigosEliminados) {
            if (Friends._modalAmigoUidActual === uidEliminado) {
              Friends.abrirModalAmigo(uidEliminado);
            }
          }

          if (this._panelAmigosActivo('lista')) {
            Friends.cargarListaAmigos(true);
          }
          if (this._panelAmigosActivo('buscar')) {
            Friends.cargarTodosUsuarios(true);
            const term = document.getElementById('buscarAmigosInput')?.value.trim();
            if (term && term.length >= 2) Friends.buscarUsuarios();
          }
          // Un amigo nuevo puede ser candidato a "invitar como alumno", y
          // uno eliminado debe desaparecer de "Mis alumnos" -- se refresca
          // la caché igual que arriba, aunque la pestaña no esté abierta.
          if (this.isTrainer && !this.isAdmin && Friends.cargarPanelAlumnos) {
            Friends.cargarPanelAlumnos(true);
          }
        }
      }, (error) => {
        console.error('Error en listener de mis datos (friendIds):', error);
      });

    this.unsubscribeSolicitudesEnviadas = firebaseServices.db
      .collection('friendRequests')
      .where('from', '==', this.currentUserId)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type !== 'modified') return;
          const data = change.doc.data();
          if (data.status === 'rejected') {
            const otroUsuario = await Storage.getUser(data.to).catch(() => null);
            const nombre = Utils.capitalizeUsername(otroUsuario?.username || data.toUsername || 'El usuario');
            Utils.showToast(`${nombre} rechazó tu solicitud de amistad`, 'info');
          }
          if (window.Friends) {
            if (this._solicitudesEnviadasVisibles()) Friends.cargarSolicitudesEnviadas();
          }
        });
      }, (error) => {
        console.error('Error en listener de solicitudes enviadas:', error);
      });

    this.unsubscribeFriendRequests = firebaseServices.db
      .collection('friendRequests')
      .where('to', '==', this.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const count = snapshot.size;
        if (this.solicitudesAmistadPendientesCount !== count) {
          this.solicitudesAmistadPendientesCount = count;
          this._recalcularSolicitudesPendientes();
          if (this._panelAmigosActivo('solicitudes')) {
            const solicitudesSubtab = document.querySelector('.solicitudes-tab.active')?.dataset.tab;
            if (!solicitudesSubtab || solicitudesSubtab === 'recibidas') {
              if (window.Friends) Friends.cargarSolicitudesRecibidas();
            }
          }
        }
      }, (error) => {
        console.error('Error en listener de solicitudes:', error);
      });

    // Invitaciones de entrenador RECIBIDAS: mismo patrón exacto que el
    // listener de arriba, sobre trainerRequests en vez de friendRequests.
    // Actualiza el badge en tiempo real (aunque el usuario ni siquiera
    // sea entrenador -- cualquiera puede recibir una) y refresca la lista
    // de la subpestaña "Entrenador" si la tiene abierta ahora mismo.
    this.unsubscribeSolicitudesEntrenadorRecibidas = firebaseServices.db
      .collection('trainerRequests')
      .where('to', '==', this.currentUserId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const count = snapshot.size;
        if (this.solicitudesEntrenadorPendientesCount !== count) {
          this.solicitudesEntrenadorPendientesCount = count;
          this._recalcularSolicitudesPendientes();
          if (this._solicitudesEntrenadorVisibles() && window.Friends) {
            Friends.cargarSolicitudesEntrenador();
          }
        }
      }, (error) => {
        console.error('Error en listener de invitaciones de entrenador recibidas:', error);
      });

    // Invitaciones de entrenador ENVIADAS: mismo patrón que
    // unsubscribeSolicitudesEnviadas (friendRequests) -- avisa con un
    // toast si un alumno rechaza la invitación, y refresca el panel "Mis
    // alumnos" si está abierto (para que ese amigo vuelva a mostrar el
    // botón "INVITAR" en vez de quedarse en "⏳ Pendiente" para siempre).
    this.unsubscribeSolicitudesEntrenadorEnviadas = firebaseServices.db
      .collection('trainerRequests')
      .where('from', '==', this.currentUserId)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type !== 'modified') return;
          const data = change.doc.data();
          if (data.status === 'rejected') {
            const otroUsuario = await Storage.getUser(data.to).catch(() => null);
            const nombre = Utils.capitalizeUsername(otroUsuario?.username || data.toUsername || 'El usuario');
            Utils.showToast(`${nombre} rechazó tu invitación de entrenador`, 'info');
          }
          // Igual que arriba: se refresca la caché aunque la pestaña no
          // esté abierta ahora mismo (ver friends.js v3.57).
          if (this.isTrainer && !this.isAdmin && window.Friends && Friends.cargarPanelAlumnos) {
            Friends.cargarPanelAlumnos(true);
          }
        });
      }, (error) => {
        console.error('Error en listener de invitaciones de entrenador enviadas:', error);
      });

    this.unsubscribeConversations = firebaseServices.db
      .collection('conversations')
      .where('participants', 'array-contains', this.currentUserId)
      .onSnapshot(async () => {
        if (window.Chat) {
          await Chat.updateUnreadBadge();
        }
        this.actualizarBadgeChat();
        // FIX lectura duplicada: index.html tenía un SEGUNDO listener
        // onSnapshot sobre esta misma colección con este mismo filtro
        // (extendiendo AppState.iniciarListeners), así que cada cambio en
        // 'conversations' disparaba Chat.updateUnreadBadge() DOS veces --
        // y esa función no es barata: internamente relee TODAS las
        // conversaciones más sus mensajes no leídos vía
        // Chat.getConversations (implementación N+1, ver DESCARTADOS del
        // informe). Se fusiona aquí el único efecto propio de aquel
        // listener (refrescar la lista de "Mis amigos" si esa subpestaña
        // está abierta ahora mismo) y se elimina el listener duplicado
        // por completo.
        const activeTab = document.querySelector('.tab-button.active')?.textContent.toLowerCase();
        const activeAmigosTab = document.querySelector('.amigos-tab.active')?.textContent.toLowerCase();
        if (activeTab === 'amigos' && activeAmigosTab === 'mis amigos') {
          if (window.Friends) await Friends.cargarListaAmigos();
        }
      }, (error) => {
        console.error('Error en listener de conversaciones:', error);
      });

    // v4.56: se acota a los últimos 50 mensajes (orderBy+limit) en vez
    // de escuchar TODO el historial de soporte del usuario sin límite.
    // Antes, cada vez que el listener se reconectaba (el móvil se
    // bloquea/desbloquea constantemente corriendo con el GPS activo, o
    // hay un corte de cobertura) Firestore volvía a facturar una lectura
    // por CADA mensaje de todo el historial, aunque no hubiera cambiado
    // nada -- con conversaciones largas eso dispara las lecturas sin que
    // haya actividad real. El chat de soporte completo (con TODO el
    // historial) se sigue viendo entero al abrir esa pantalla -- ahí se
    // usa una lectura puntual (get()), no este listener -- solo el
    // contador de "no leídos" en segundo plano se limita a lo reciente,
    // que es donde realmente puede haber algo sin leer.
    this.unsubscribeMensajesSoporte = firebaseServices.db
      .collection('users')
      .doc(this.currentUserId)
      .collection('mensajes')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(async (snapshot) => {
        let noLeidos = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.leido && data.toUid === this.currentUserId) {
            noLeidos++;
          }
        });
        if (this.mensajesNoLeidos !== noLeidos) {
          this.mensajesNoLeidos = noLeidos;
          if (window.UI) UI.actualizarBadgeMensajes();
        }
        const hayNuevosOEliminados = snapshot.docChanges()
          .some(change => change.type === 'added' || change.type === 'removed');
        const soporteTab = document.getElementById('subtab-perfil-soporte');
        if (hayNuevosOEliminados && soporteTab && soporteTab.classList.contains('active')) {
          if (window.UI) {
            if (UI._chatSoporteAbierto && UI._actualizarChatSoporteUsuarioEnVivo) {
              UI._actualizarChatSoporteUsuarioEnVivo();
            } else if (UI.cargarSoporteUsuario) {
              UI.cargarSoporteUsuario();
            }
          }
        }
      }, (error) => {
        console.error('Error en listener de mensajes de soporte:', error);
      });

    if (this.isAdmin) {
      this.unsubscribeSoporteAdmin = firebaseServices.db
        .collection('soporteMensajes')
        .where('toUid', '==', this.currentUserId)
        .where('leido', '==', false)
        .onSnapshot((snapshot) => {
          const count = snapshot.size;
          if (this.mensajesSoporteAdminNoLeidos !== count) {
            this.mensajesSoporteAdminNoLeidos = count;
            this.actualizarBadgeSoporteAdmin();
          }

          // Un usuario nos ha mandado un mensaje nuevo (o uno ha pasado a
          // leído desde otro sitio): la lista de conversaciones cacheada
          // ya no está actualizada. Se invalida para que la próxima vez
          // que se entre en la pestaña de soporte se recargue de verdad
          // (mostrando "CARGANDO") en vez de reutilizar la caché.
          const cambios = snapshot.docChanges();
          const hayCambios = cambios.some(change => change.type === 'added' || change.type === 'removed');
          if (hayCambios && window.Admin) {
            Admin._cacheSoporteVigente = false;
            const soportePanel = document.getElementById('adminSoportePanel');
            if (soportePanel && soportePanel.style.display === 'block') {
              Admin.cargarMensajesUsuarios(true);
            }
          }

          // Si el admin tiene ABIERTA justo la conversación de quien
          // acaba de escribir, antes el mensaje nuevo no aparecía hasta
          // cerrar y volver a abrir esa conversación -- _cargarMensajesConversacion
          // es una lectura puntual (get()), no un listener, así que no se
          // enteraba sola de nada nuevo mientras estaba abierta. Ahora, si
          // el uid de un mensaje añadido coincide con la conversación
          // abierta, se pinta al momento sin tener que cerrarla.
          if (window.Admin && Admin._conversacionAbierta) {
            cambios.forEach(change => {
              if (change.type !== 'added') return;
              const data = change.doc.data();
              if (data.fromUid === Admin._conversacionAbierta.uid) {
                Admin._pintarMensajeSoporteEnVivo(change.doc.id, data);
              }
            });
          }
        }, (error) => {
          console.error('Error en listener de soporte admin:', error);
        });
    }

    // v4.56: mismo motivo que el listener de mensajes de arriba -- se
    // acota a tus últimas 30 publicaciones (orderBy+limit) en vez de
    // escuchar TODO tu historial de sesiones publicadas sin límite, que
    // con meses de uso puede ser un listener bastante pesado y se
    // reconecta (y vuelve a facturar lecturas) cada vez que el móvil se
    // bloquea/desbloquea durante una carrera. Tus publicaciones antiguas
    // se siguen viendo igual en el Perfil/Muro -- solo el AVISO en vivo
    // de "te han dado me gusta" se limita a publicaciones recientes (si
    // alguien le da like a algo de hace meses, el like se cuenta igual,
    // simplemente puede no disparar el aviso instantáneo).
    // NOTA: esta consulta (where + orderBy en campos distintos) necesita
    // un índice compuesto en Firestore -- si no existe, la propia consola
    // del navegador mostrará un error con un enlace para crearlo en un
    // clic (gratis, tarda ~1 minuto en activarse).
    this.unsubscribeLikesPropios = firebaseServices.db
      .collection('globalFeed')
      .where('userId', '==', this.currentUserId)
      .orderBy('timestamp', 'desc')
      .limit(30)
      .onSnapshot((snapshot) => {
        let nuevos = 0;
        // Además del total, guardamos las entradas concretas con "me
        // gusta" sin leer (más reciente primero) -- así, al tocar la
        // notificación, se puede ir directo a esa sesión en el Perfil en
        // vez de solo saber "hay X nuevos" en algún sitio del Muro.
        const conNuevos = [];
        // FIX bug reportado: un "me gusta" sin leer se quedaba
        // contando en la campanita PARA SIEMPRE si la sesión dejaba de
        // ser alcanzable en cualquier sitio -- el Muro solo enseña las
        // últimas 24h, el Perfil solo las últimas 5 ("mis últimos
        // entrenamientos", misma consulta que esta pero con limit(5)) --
        // y el marcador de "leído" solo se actualiza al abrir la lista de
        // "quién le dio like" de esa sesión concreta, así que sin ningún
        // sitio desde el que abrirla, no había forma de quitar el aviso.
        // Ahora, en cuanto una sesión deja de ser alcanzable en los DOS
        // sitios a la vez, se deja de contar -- se autolimpia sola, sin
        // necesidad de haberla visto.
        const limiteMs = Date.now() - 24 * 60 * 60 * 1000;
        let idx = 0;
        snapshot.forEach(doc => {
          const d = doc.data();
          const likeCount = Number(d.likeCount) || 0;
          const likesLeidos = Number(d.likesLeidos) || 0;
          const enUltimas5DelPerfil = idx < 5;
          const enMuro24h = (d.timestamp?.toMillis?.() || 0) >= limiteMs;
          const alcanzable = enUltimas5DelPerfil || enMuro24h;
          if (likeCount > likesLeidos && alcanzable) {
            nuevos += (likeCount - likesLeidos);
            conNuevos.push({ id: doc.id, ts: d.timestamp?.toMillis?.() || 0 });
          }
          idx++;
        });
        conNuevos.sort((a, b) => b.ts - a.ts);
        // FIX: antes se guardaba solo el id (string) de cada entrada.
        // irANotificacionDeLike() (index.html) necesita también el "ts"
        // de cada una para decidir si la tarjeta sigue dentro de las 24h
        // del Muro o si ya solo es alcanzable en Perfil -- con el id
        // suelto, entrada.id daba undefined (un string no tiene esa
        // propiedad) y la función devolvía false siempre, sin navegar a
        // ningún sitio.
        this.entriesConLikesNuevos = conNuevos;
        if (this.likesNuevosCount !== nuevos) {
          this.likesNuevosCount = nuevos;
          this.actualizarBadgeLikes();
        }
      }, (error) => {
        console.error('Error en listener de likes:', error);
      });

    if (window.SessionInvites) SessionInvites.iniciarListener();
  },

  detenerListeners() {
    if (this.unsubscribeFriendRequests) {
      this.unsubscribeFriendRequests();
      this.unsubscribeFriendRequests = null;
    }
    if (this.unsubscribeConversations) {
      this.unsubscribeConversations();
      this.unsubscribeConversations = null;
    }
    if (this.unsubscribeMensajesSoporte) {
      this.unsubscribeMensajesSoporte();
      this.unsubscribeMensajesSoporte = null;
    }
    if (this.unsubscribeSoporteAdmin) {
      this.unsubscribeSoporteAdmin();
      this.unsubscribeSoporteAdmin = null;
    }
    if (this.unsubscribeLikesPropios) {
      this.unsubscribeLikesPropios();
      this.unsubscribeLikesPropios = null;
    }
    if (window.SessionInvites) SessionInvites.detenerListener();
    if (this.unsubscribeMisDatos) {
      this.unsubscribeMisDatos();
      this.unsubscribeMisDatos = null;
    }
    if (this.unsubscribeSolicitudesEnviadas) {
      this.unsubscribeSolicitudesEnviadas();
      this.unsubscribeSolicitudesEnviadas = null;
    }
    if (this.unsubscribeSolicitudesEntrenadorRecibidas) {
      this.unsubscribeSolicitudesEntrenadorRecibidas();
      this.unsubscribeSolicitudesEntrenadorRecibidas = null;
    }
    if (this.unsubscribeSolicitudesEntrenadorEnviadas) {
      this.unsubscribeSolicitudesEntrenadorEnviadas();
      this.unsubscribeSolicitudesEntrenadorEnviadas = null;
    }
    // v3.53 (friends.js): cierra el listener en tiempo real de la
    // página 1 de "Explorar usuarios" -- si no, se queda escuchando
    // cambios (y facturando lecturas) de una sesión que ya ha terminado.
    if (window.Friends && Friends.detenerListenerExplorar) {
      Friends.detenerListenerExplorar();
    }
    // v10.13 (profile.js): mismo motivo -- cierra el listener en tiempo
    // real de "Mis últimos entrenamientos", si no se queda escuchando (y
    // facturando lecturas) tras cerrar sesión.
    if (window.Profile && Profile.detenerListenerMisEntrenamientos) {
      Profile.detenerListenerMisEntrenamientos();
    }
    // v4.63: cierra también el listener del muro. Al logout ya se
    // cerraba (ver setCurrentUser), pero es más limpio tenerlo aquí
    // también, en el mismo sitio donde se cierran el resto de listeners
    // de la sesión, para que quede garantizado aunque el flujo de logout
    // cambie en el futuro.
    if (window.Wall && Wall.detenerListener) {
      Wall.detenerListener();
    }
  },

  actualizarBadgeSoporteAdmin() {
    const badge = document.getElementById('adminSoporteBadge');
    if (!badge) return;
    const count = this.mensajesSoporteAdminNoLeidos || 0;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  actualizarBadgeSolicitudes() {
    const tab = document.querySelector('.tab-button[onclick="switchTab(\'amigos\')"]');
    if (tab) {
      if (this.solicitudesPendientesCount > 0) {
        tab.classList.add('amigos-solicitudes-unread');
        tab.setAttribute('data-count', this.solicitudesPendientesCount);
      } else {
        tab.classList.remove('amigos-solicitudes-unread');
        tab.removeAttribute('data-count');
      }
    }
    const solicitudesTab = document.querySelector('.amigos-tab[onclick*="solicitudes"]');
    if (solicitudesTab) {
      if (this.solicitudesPendientesCount > 0) {
        solicitudesTab.style.color = 'var(--accent-blue)';
        solicitudesTab.style.fontWeight = '500';
      } else {
        solicitudesTab.style.color = '';
        solicitudesTab.style.fontWeight = '';
      }
    }
    this._actualizarBadgeComunidad();
  },

  actualizarBadgeLikes() {
    const badge = document.getElementById('muroBadge');
    const count = this.likesNuevosCount || 0;
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    this._actualizarBadgeComunidad();
  },

  actualizarBadgeChat() {
    const tab = document.querySelector('.tab-button[onclick="switchTab(\'amigos\')"]');
    if (tab) {
      if (this.mensajesAmigosNoLeidos > 0) {
        tab.classList.add('chat-unread');
        tab.setAttribute('data-chat-count', this.mensajesAmigosNoLeidos);
      } else {
        tab.classList.remove('chat-unread');
        tab.removeAttribute('data-chat-count');
      }
    }
    const listaTab = document.querySelector('.amigos-tab[onclick*="lista"]');
    if (listaTab) {
      if (this.mensajesAmigosNoLeidos > 0) {
        listaTab.style.color = 'var(--notification-color)';
        listaTab.style.fontWeight = '600';
      } else {
        listaTab.style.color = '';
        listaTab.style.fontWeight = '';
      }
    }
    this._actualizarBadgeComunidad();
  }
};

// FIX RAÍZ: AppState se declara con `const`, y una declaración `const`
// (o `let`) de nivel superior NO crea una propiedad en `window`, aunque sí
// sea accesible por su nombre desde cualquier otro script de la página
// (por eso `AppState.isPremium` a secas funcionaba en todos lados). Varios
// sitios del código (Auth.showPremiumBenefits en auth.js -- el modal de
// premium --, profile.js, session-invites.js, sponsors.js) usan
// `window.AppState && ...` como comprobación defensiva de que AppState ya
// existe. Como `window.AppState` era SIEMPRE undefined, esa comprobación
// era SIEMPRE falsa: el modal de premium (Auth.showPremiumBenefits) daba
// por hecho que nadie era premium ni entrenador y mostraba "Tu
// suscripción: Standard" pasara lo que pasara, aunque la píldora del
// perfil (que lee `AppState.isPremium` sin el `window.` de más) sí
// mostrara PREMIUM correctamente. Con esta línea, `window.AppState` pasa
// a ser una referencia real al mismo objeto, y todas esas comprobaciones
// funcionan como se pretendía sin tener que tocar cada sitio uno a uno.
window.AppState = AppState;

// ==================== MÓDULO ADMIN ====================
const Admin = {

  // El email ya no está en users/{uid} (lo leía cualquier usuario): vive
  // en usersPrivate/{uid}, solo legible por su dueño y el admin. Estos dos
  // helpers lo recuperan para las pantallas de administración.
  async _emailPrivado(uid) {
    try {
      const doc = await firebaseServices.db.collection('usersPrivate').doc(uid).get();
      return doc.exists ? (doc.data().email || '') : '';
    } catch (e) {
      console.warn('No se pudo leer el email privado:', e);
      return '';
    }
  },

  async _adjuntarEmails(usuarios) {
    const uids = [...new Set((usuarios || []).map(u => u.uid).filter(Boolean))];
    if (!uids.length) return usuarios;
    const mapa = new Map();
    try {
      for (let i = 0; i < uids.length; i += 30) {
        const lote = uids.slice(i, i + 30);
        const snap = await firebaseServices.db.collection('usersPrivate')
          .where(firebaseServices.FieldPath.documentId(), 'in', lote).get();
        snap.forEach(d => mapa.set(d.id, d.data().email || ''));
      }
    } catch (e) {
      console.warn('No se pudieron leer los emails privados:', e);
    }
    usuarios.forEach(u => { if (mapa.has(u.uid)) u.email = mapa.get(u.uid); });
    return usuarios;
  },

  // EJECUTAR UNA SOLA VEZ, como admin, desde la consola: Admin.migrarEmailsAPrivado()
  // Copia el email de cada users/{uid} a usersPrivate/{uid} y lo borra de users.
  // Se puede volver a lanzar sin problema (solo toca los que aún tengan email).
  async migrarEmailsAPrivado() {
    if (!AppState.isAdmin) { console.warn('Solo el admin puede migrar.'); return 0; }
    const db = firebaseServices.db;
    const snap = await db.collection('users').get();
    let migrados = 0, pendientes = 0;
    let batch = db.batch();
    for (const doc of snap.docs) {
      const email = doc.data().email;
      if (!email) continue;
      batch.set(db.collection('usersPrivate').doc(doc.id), { uid: doc.id, email });
      batch.update(doc.ref, { email: firebaseServices.FieldValue.delete() });
      migrados++; pendientes += 2;
      if (pendientes >= 400) { await batch.commit(); batch = db.batch(); pendientes = 0; }
    }
    if (pendientes) await batch.commit();
    console.log(`Emails migrados a usersPrivate: ${migrados}`);
    Utils.showToast(`Emails migrados: ${migrados}`, 'success');
    return migrados;
  },

  // ---- Ver privilegios: filtro (entrenador / premium), de 20 en 20 y plegable ----
  _priv: { filtro: null, lista: [], mostrados: 0, unsub: null },
  PRIV_PAGINA: 20,

  // Deja de escuchar Firestore (al plegar el panel o cambiar de filtro).
  _pararPrivilegios() {
    if (this._priv.unsub) { this._priv.unsub(); this._priv.unsub = null; }
  },

  toggleVerPrivilegios() {
    if (!AppState.isAdmin) return;
    const panel = document.getElementById('adminPrivilegiosPanel');
    const btn = document.getElementById('btnAuditarPrivilegios');
    if (!panel) return;
    const abrir = panel.style.display === 'none';
    panel.style.display = abrir ? 'block' : 'none';
    if (btn) btn.textContent = abrir ? 'PLEGAR PRIVILEGIOS ▴' : 'VER PRIVILEGIOS ▾';
    // Plegado = sin listener (no gasta lecturas); al desplegar se reanuda el filtro que hubiera.
    if (abrir) { if (this._priv.filtro) this.cargarPrivilegios(this._priv.filtro, true); }
    else this._pararPrivilegios();
    // Al desplegar, el panel nace por debajo de la barra inferior y los botones de
    // filtro quedaban cortados: se sube la pantalla hasta dejar el botón de
    // privilegios arriba (con margen para la cabecera fija) y todo el panel a la vista.
    if (abrir && btn) {
      btn.style.scrollMarginTop = '110px';
      requestAnimationFrame(() => btn.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  },

  // Tiempo real: en vez de una lectura puntual (.get()) se deja un listener
  // (.onSnapshot) sobre la consulta. Cualquier cambio -- hacer/quitar entrenador,
  // dar/quitar premium, cambiar un límite o una caducidad, desde este móvil o
  // desde otro -- repinta la lista sola. Al quitarle el rol a alguien, su cuenta
  // sale de la consulta y desaparece de la lista.
  cargarPrivilegios(filtro, conservarPagina = false) {
    if (!AppState.isAdmin) return;
    const cont = document.getElementById('adminPrivilegiosLista');
    if (!cont) return;
    this._pararPrivilegios();
    const cambioFiltro = this._priv.filtro !== filtro;
    this._priv.filtro = filtro;
    if (cambioFiltro || !conservarPagina) { this._priv.lista = []; this._priv.mostrados = 0; }
    [['entrenador', 'privFiltroEntrenador'], ['premium', 'privFiltroPremium']].forEach(([f, id]) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.style.borderColor = f === filtro ? 'var(--gold)' : 'var(--border-color)';
      b.style.fontWeight = f === filtro ? '600' : '400';
    });
    cont.innerHTML = '<div style="font-size:14px; color:var(--text-secondary);">⏳ Cargando...</div>';
    const campo = filtro === 'entrenador' ? 'isTrainer' : 'premium';
    this._priv.unsub = firebaseServices.db.collection('users').where(campo, '==', true).onSnapshot(
      (snap) => {
        if (this._priv.filtro !== filtro) return;
        const arr = snap.docs.map(d => ({ ...d.data(), uid: d.id }));
        arr.sort((a, b) => (a.username || '').localeCompare(b.username || '', 'es', { sensitivity: 'base' }));
        const antesLista = this._priv.lista.length;
        const antesMostrados = this._priv.mostrados;
        this._priv.lista = arr;
        if (antesMostrados === 0) this._priv.mostrados = Math.min(this.PRIV_PAGINA, arr.length);     // primera carga
        else if (antesMostrados >= antesLista) this._priv.mostrados = arr.length;                   // se veían todas: entra también la nueva
        else this._priv.mostrados = Math.min(antesMostrados, arr.length);                           // conserva lo desplegado
        this._renderPrivilegios();
      },
      (e) => {
        console.error('Error escuchando privilegios:', e);
        this._pararPrivilegios();
        cont.textContent = 'Error: ' + (e.message || e);
      }
    );
  },

  masPrivilegios() {
    const { lista, mostrados } = this._priv;
    this._priv.mostrados = Math.min(mostrados + this.PRIV_PAGINA, lista.length);
    this._renderPrivilegios();
  },

  _renderPrivilegios() {
    const cont = document.getElementById('adminPrivilegiosLista');
    if (!cont) return;
    const { filtro, lista, mostrados } = this._priv;
    if (!lista.length) {
      cont.innerHTML = `<div style="font-size:14px; line-height:1.5; color:var(--text-secondary);">No hay ninguna cuenta ${filtro === 'entrenador' ? 'con rol de entrenador' : 'premium'}.</div>`;
      return;
    }
    const fmt = (iso) => { const t = new Date(iso); return isNaN(t) ? '—' : t.toLocaleDateString('es-ES'); };
    const filas = lista.slice(0, mostrados).map((u, i) => {
      let detalle;
      if (filtro === 'entrenador') {
        const n = (u.alumnosAceptados || []).length;
        detalle = `${n} atleta${n === 1 ? '' : 's'} · límite: ${u.maxAlumnos == null ? 'sin límite' : u.maxAlumnos}`;
      } else {
        const largo = u.expires && u.created && (new Date(u.expires) - new Date(u.created)) > 32 * 86400000;
        detalle = `Caduca: ${u.expires ? fmt(u.expires) : 'sin fecha'}${largo ? ' · más de 30 días desde el alta' : ''}`;
      }
      return `<div onclick="Admin.abrirDesdePrivilegios(${i})" style="padding:12px 14px; margin-bottom:8px; border:1px solid var(--border-color); border-radius:14px; cursor:pointer; overflow-wrap:anywhere; text-align:center;">
          <div style="font-weight:600; font-size:16px; line-height:1.3;">${Utils.escapeHTML(u.username || u.uid)}${filtro === 'entrenador' ? Utils.selloVerificado(u) : ''}</div>
          <div style="font-size:12px; line-height:1.4; color:var(--text-secondary); margin-top:4px;">${Utils.escapeHTML(detalle)}</div>
        </div>`;
    }).join('');
    const quedan = lista.length - mostrados;
    cont.innerHTML =
      `<div style="font-size:14px; line-height:1.4; color:var(--text-secondary); margin-bottom:10px;">Mostrando ${mostrados} de ${lista.length}. Toca una cuenta para editarla.</div>`
      + filas
      + (quedan > 0
          ? `<button class="action-button" onclick="Admin.masPrivilegios()" style="height:auto; min-height:48px; line-height:1.3; padding:12px 20px; white-space:normal;">CARGAR ${Math.min(quedan, this.PRIV_PAGINA)} MÁS</button>`
          : '');
  },

  abrirDesdePrivilegios(i) {
    const u = this._priv.lista[i];
    if (!u) return;
    const nombre = u.username || u.uid;
    if (this._priv.filtro === 'entrenador') this.abrirModalEntrenador(u.uid, nombre, true, u.maxAlumnos ?? null);
    else this.abrirModalPremium(u.uid, nombre, true, u.expires || null);
  },

  // Para lanzar UNA VEZ tras subir las reglas nuevas: Admin.auditarPrivilegios()
  // Lista las cuentas con privilegios que un usuario normal nunca debería
  // tener por sí solo, para revisar a mano quién es legítimo y quién no.
  async auditarPrivilegios() {
    if (!AppState.isAdmin) { console.warn('Solo el admin puede auditar.'); return []; }
    const snap = await firebaseServices.db.collection('users').get();
    const DIA = 86400000;
    const filas = [];
    snap.forEach(doc => {
      const d = doc.data();
      const motivos = [];
      if (d.isAdmin === true) motivos.push('isAdmin');
      if (d.isTrainer === true) motivos.push('isTrainer');
      if ((d.alumnosAceptados || []).length) motivos.push(`alumnosAceptados=${d.alumnosAceptados.length}`);
      if (d.maxAlumnos) motivos.push(`maxAlumnos=${d.maxAlumnos}`);
      if (d.premium === true && d.expires && d.created
          && (new Date(d.expires) - new Date(d.created)) > 32 * DIA) motivos.push('premium > 30 días desde el alta');
      if ((d.calculosMes || 0) < 0) motivos.push('calculosMes negativo');
      if (motivos.length) filas.push({ uid: doc.id, username: d.username, creado: d.created, expira: d.expires, motivos: motivos.join(' | ') });
    });
    console.table(filas);
    return filas;
  },
  usersPagination: {
    lastDoc: null,
    hasMore: true,
    loading: false,
    searchTerm: ''
  },
  currentEditUserId: null,
  filtrosActuales: { premium: 'all', from: '', to: '', sort: 'username' },
  
  messagesPagination: {
    lastDoc: null,
    hasMore: true,
    loading: false,
    allMessagesCache: []
  },

  _unsubscribeMensajes: null,
  _unsubscribeSesionesHoy: null,
  _profileCache: {},
  _conversacionAbierta: null,

  _esPremiumReal(user) {
    if (!user || user.premium !== true) return false;
    if (user.expires && new Date(user.expires) < new Date()) return false;
    return true;
  },

  // Caché en memoria de los 3 contadores (total/premium/nuevos 7 días).
  // La rellena precargarEstadisticas() (llamada durante el arranque, solo
  // para la cuenta de admin -- ver AppState.precargarDatos) y la reutiliza
  // cargarEstadisticas() cuando el admin abre de verdad Soporte→Admin, en
  // vez de volver a consultar Firestore y hacerle ver un instante de "0"
  // antes de que lleguen los números reales.
  _statsCache: null,
  _statsPromise: null,

  // Se llama durante el arranque (solo si AppState.isAdmin, ver
  // AppState.precargarDatos: no añade ninguna espera a los usuarios
  // normales, ni les gasta esta lectura). Si ya hay caché o ya hay una
  // precarga en marcha, no repite el trabajo.
  async precargarEstadisticas() {
    if (this._statsCache || this._statsPromise) return this._statsPromise;
    this._statsPromise = (async () => {
      try {
        const [totalUsers, premiumUsers, newUsers] = await Promise.all([
          Storage.contarUsuarios(),
          Storage.contarUsuariosPremium(),
          Storage.contarUsuariosNuevos(7)
        ]);
        this._statsCache = { totalUsers, premiumUsers, newUsers };
      } catch (e) {
        console.warn('Error precargando estadísticas de admin:', e);
      } finally {
        this._statsPromise = null;
      }
    })();
    return this._statsPromise;
  },

  // forzar=true (el botón "🔄 Actualizar" del panel) ignora la caché y
  // vuelve a consultar Firestore de verdad; si no, y ya hay algo
  // precargado, se pinta al instante desde ahí -- sin ese parpadeo de
  // "0 / 0 / 0" mientras responde Firestore que se veía antes al entrar.
  async cargarEstadisticas(forzar = false) {
    try {
      let datos = (!forzar && this._statsCache) ? this._statsCache : null;
      if (!datos) {
        if (!forzar && this._statsPromise) await this._statsPromise;
        datos = (!forzar && this._statsCache) ? this._statsCache : null;
      }
      if (!datos) {
        const [totalUsers, premiumUsers, newUsers] = await Promise.all([
          Storage.contarUsuarios(),
          Storage.contarUsuariosPremium(),
          Storage.contarUsuariosNuevos(7)
        ]);
        datos = { totalUsers, premiumUsers, newUsers };
        this._statsCache = datos;
      }
      const elTotal = document.getElementById('statTotalUsers');
      const elPremium = document.getElementById('statPremiumUsers');
      const elNew = document.getElementById('statNewUsers');
      if (elTotal) elTotal.textContent = datos.totalUsers;
      if (elPremium) elPremium.textContent = datos.premiumUsers;
      if (elNew) elNew.textContent = datos.newUsers;
      this.iniciarEscuchaSesionesHoy();
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    }
  },

  iniciarEscuchaSesionesHoy() {
    if (!AppState.isAdmin) return;
    this.detenerEscuchaSesionesHoy();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    this._unsubscribeSesionesHoy = firebaseServices.db.collection('globalFeed')
      .where('timestamp', '>=', firebaseServices.Timestamp.fromDate(hoy))
      .where('timestamp', '<', firebaseServices.Timestamp.fromDate(manana))
      .onSnapshot(snapshot => {
        const el = document.getElementById('statSessionsToday');
        if (el) el.textContent = snapshot.size;
      }, error => {
        console.warn('Error escuchando sesiones de hoy en tiempo real:', error);
      });
  },

  detenerEscuchaSesionesHoy() {
    if (this._unsubscribeSesionesHoy) {
      this._unsubscribeSesionesHoy();
      this._unsubscribeSesionesHoy = null;
    }
  },

  aplicarFiltros() {
    const premium = document.getElementById('adminFilterPremium')?.value || 'all';
    const from = document.getElementById('adminFilterDateFrom')?.value || '';
    const to = document.getElementById('adminFilterDateTo')?.value || '';
    const sort = document.getElementById('adminSortBy')?.value || 'username';
    this.filtrosActuales = { premium, from, to, sort };
    this.usersPagination.lastDoc = null;
    this.usersPagination.hasMore = true;
    this.cargarUsuarios(true);
  },

  limpiarFiltros() {
    const elPremium = document.getElementById('adminFilterPremium');
    const elFrom = document.getElementById('adminFilterDateFrom');
    const elTo = document.getElementById('adminFilterDateTo');
    const elSort = document.getElementById('adminSortBy');
    const elSearch = document.getElementById('adminUserSearch');
    const elSearch2 = document.getElementById('adminUserSearch2');
    if (elPremium) elPremium.value = 'all';
    if (elFrom) elFrom.value = '';
    if (elTo) elTo.value = '';
    if (elSort) elSort.value = 'username';
    if (elSearch) elSearch.value = '';
    if (elSearch2) elSearch2.value = '';
    this.filtrosActuales = { premium: 'all', from: '', to: '', sort: 'username' };
    this.usersPagination.searchTerm = '';
    this.usersPagination.lastDoc = null;
    this.usersPagination.hasMore = true;
    this.cargarUsuarios(true);
  },

  async cargarUsuarios(reset = false) {
    if (!AppState.isAdmin) return;
    if (this.usersPagination.loading) return;

    const container = document.getElementById('adminUsersList');
    if (!container) {
      this.usersPagination.loading = false;
      return;
    }

    if (reset) {
      container.innerHTML = '<div style="text-align:center; padding:40px; color: var(--text-secondary);">⏳ Cargando usuarios...</div>';
      this.usersPagination.lastDoc = null;
      this.usersPagination.hasMore = true;
      const searchEl = document.getElementById('adminUserSearch');
      const searchEl2 = document.getElementById('adminUserSearch2');
      this.usersPagination.searchTerm = (searchEl ? searchEl.value : '') || (searchEl2 ? searchEl2.value : '');
    }

    this.usersPagination.loading = true;

    try {
      const searchTerm = this.usersPagination.searchTerm;
      let usersData = [];
      let hasMore = false;

      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        let query1 = firebaseServices.db.collection('users')
          .orderBy('username_lowercase')
          .startAt(termLower)
          .endAt(termLower + '\uf8ff')
          .limit(50);
        let query2 = firebaseServices.db.collection('users')
          .orderBy('username')
          .startAt(searchTerm)
          .endAt(searchTerm + '\uf8ff')
          .limit(50);

        const [snapshot1, snapshot2] = await Promise.all([query1.get(), query2.get()]);

        const usersMap = new Map();
        snapshot1.forEach(doc => {
          const user = doc.data();
          usersMap.set(doc.id, { uid: doc.id, ...user });
        });
        snapshot2.forEach(doc => {
          const user = doc.data();
          if (!usersMap.has(doc.id)) {
            usersMap.set(doc.id, { uid: doc.id, ...user });
          }
        });

        usersData = Array.from(usersMap.values());
        usersData.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
        hasMore = false;

        if (usersData.length === 0) {
          container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay usuarios que coincidan con la búsqueda</p>';
          this.usersPagination.loading = false;
          this._actualizarBotonCargarMas();
          return;
        }

      } else {
        let query = firebaseServices.db.collection('users')
          .orderBy('username_lowercase')
          .limit(20);

        if (this.usersPagination.lastDoc && !reset) {
          query = query.startAfter(this.usersPagination.lastDoc);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
          if (reset) {
            container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay usuarios</p>';
          } else {
            this.usersPagination.hasMore = false;
            if (container.innerHTML && !container.innerHTML.includes('No hay más usuarios')) {
              container.innerHTML += '<p style="text-align:center; padding:20px; color: var(--text-secondary);">No hay más usuarios</p>';
            }
          }
          this.usersPagination.loading = false;
          this._actualizarBotonCargarMas();
          return;
        }

        this.usersPagination.lastDoc = snapshot.docs[snapshot.docs.length - 1];
        this.usersPagination.hasMore = snapshot.docs.length === 20;
        hasMore = this.usersPagination.hasMore;

        usersData = snapshot.docs.map(doc => {
          const user = doc.data();
          return { uid: doc.id, ...user };
        });
      }

      await Admin._adjuntarEmails(usersData);

      const usuariosVistos = JSON.parse(localStorage.getItem('admin_usuarios_vistos') || '[]');
      let usersDataProcessed = usersData.map(u => {
        const user = u;
        const uid = u.uid;
        const username = Utils.capitalizeUsername(user.username) || '?';
        const email = Utils.escapeHTML(user.email || '?');
        const premium = this._esPremiumReal(user) ? 'SÍ' : 'NO';
        const expires = user.expires ? new Date(user.expires).toLocaleDateString() : '-';
        const calculos = user.calculosMes || 0;
        const created = user.created ? new Date(user.created).toLocaleDateString() : '-';
        const esNuevo = !usuariosVistos.includes(uid) && 
                       (user.created && new Date(user.created) > new Date(Date.now() - 7*24*60*60*1000));
        return { uid, username, email, premium, expires, calculos, created, esNuevo, user };
      });

      if (this.filtrosActuales.premium !== 'all') {
        const isPremium = this.filtrosActuales.premium === 'true';
        usersDataProcessed = usersDataProcessed.filter(u => this._esPremiumReal(u.user) === isPremium);
      }

      if (this.filtrosActuales.from) {
        const fromDate = new Date(this.filtrosActuales.from);
        fromDate.setHours(0,0,0,0);
        usersDataProcessed = usersDataProcessed.filter(u => {
          if (!u.user.created) return false;
          return new Date(u.user.created) >= fromDate;
        });
      }
      if (this.filtrosActuales.to) {
        const toDate = new Date(this.filtrosActuales.to);
        toDate.setHours(23,59,59,999);
        usersDataProcessed = usersDataProcessed.filter(u => {
          if (!u.user.created) return false;
          return new Date(u.user.created) <= toDate;
        });
      }

      if (this.filtrosActuales.sort === 'created') {
        usersDataProcessed.sort((a, b) => new Date(b.user.created) - new Date(a.user.created));
      } else if (this.filtrosActuales.sort === 'premium') {
        usersDataProcessed.sort((a, b) => (this._esPremiumReal(b.user) ? 1 : 0) - (this._esPremiumReal(a.user) ? 1 : 0));
      } else {
        usersDataProcessed.sort((a, b) => a.username.localeCompare(b.username));
      }

      this.renderUsersList(usersDataProcessed);

      if (searchTerm) {
        this.usersPagination.hasMore = false;
      } else {
        this.usersPagination.hasMore = hasMore;
      }

      if (!reset && !searchTerm) {
        const listContainer = document.getElementById('adminUsersList');
        if (listContainer) {
          listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

    } catch (error) {
      console.error('Error cargando usuarios:', error);
      if (reset) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--zone-5);">Error al cargar usuarios. Revisa la consola.</p>';
      } else {
        if (container.innerHTML && !container.innerHTML.includes('Error al cargar más')) {
          container.innerHTML += '<p style="text-align:center; padding:20px; color: var(--zone-5);">Error al cargar más usuarios.</p>';
        }
      }
    } finally {
      this.usersPagination.loading = false;
      this._actualizarBotonCargarMas();
    }
  },

  _actualizarBotonCargarMas() {
    const loadMoreBtn = document.getElementById('loadMoreUsersBtn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = this.usersPagination.hasMore ? 'block' : 'none';
    }
  },

  renderUsersList(usersData) {
    const container = document.getElementById('adminUsersList');
    if (!container) return;
    
    let html = '';
    for (const u of usersData) {
      const premiumBadge = u.premium === 'SÍ' 
        ? '<span class="usuario-premium-badge">PREMIUM</span>' 
        : '<span class="usuario-premium-badge normal">STANDARD</span>';
      html += `
        <div class="usuario-item ${u.esNuevo ? 'nuevo' : ''}" data-uid="${u.uid}">
          <div class="usuario-header" data-uid="${u.uid}">
            <span class="usuario-nombre">${Utils.escapeHTML(u.username)}</span>
            ${u.esNuevo ? '<span class="usuario-badge">NUEVO</span>' : ''}
          </div>
          <div style="margin:4px 0 6px; display:flex; gap:8px 18px; flex-wrap:wrap; align-items:center; justify-content:center;">
            ${premiumBadge}
            <span style="font-size:12px; color:var(--text-secondary);">📅 ${u.created}</span>
            <span style="font-size:12px; color:var(--text-secondary);">📊 ${u.calculos} calc</span>
          </div>
          <div class="usuario-detalle">
            <div class="usuario-info">
              <div class="info-item"><span class="info-label">Premium</span><span class="info-value">${u.premium}</span></div>
              <div class="info-item"><span class="info-label">Expira</span><span class="info-value">${u.expires}</span></div>
              <div class="info-item"><span class="info-label">Cálculos</span><span class="info-value">${u.calculos}</span></div>
              <div class="info-item"><span class="info-label">Registro</span><span class="info-value">${u.created}</span></div>
            </div>
            <div class="usuario-acciones">
              <button class="ver-perfil-btn" data-uid="${u.uid}">VER</button>
              <button class="mensaje-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}">MENSAJE</button>
              <button class="premium-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}" data-premium="${u.user.premium}" data-expires="${u.user.expires || ''}">PREMIUM</button>
              <button class="entrenador-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}" data-entrenador="${!!u.user.isTrainer}" data-max-alumnos="${u.user.maxAlumnos ?? ''}" style="${u.user.isTrainer ? 'border-color:var(--gold); color:var(--gold);' : ''}">${u.user.isTrainer ? `ENTRENADOR (${(u.user.alumnosAceptados || []).length}${u.user.maxAlumnos != null ? '/' + u.user.maxAlumnos : ''})` : 'HACER ENTRENADOR'}</button>
              <button class="eliminar-usuario-btn" data-uid="${u.uid}" data-username="${Utils.escapeHTML(u.username)}">ELIMINAR</button>
            </div>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('.ver-perfil-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        Admin.verPerfil(uid);
      });
    });
    container.querySelectorAll('.mensaje-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        Admin.abrirMensajeUsuario(uid, username);
      });
    });
    container.querySelectorAll('.premium-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        const esPremium = btn.dataset.premium === 'true';
        const expires = btn.dataset.expires;
        Admin.abrirModalPremium(uid, username, esPremium, expires);
      });
    });
    container.querySelectorAll('.entrenador-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        const esEntrenador = btn.dataset.entrenador === 'true';
        const maxAlumnos = btn.dataset.maxAlumnos;
        Admin.abrirModalEntrenador(uid, username, esEntrenador, maxAlumnos === '' ? null : parseInt(maxAlumnos, 10));
      });
    });
    container.querySelectorAll('.eliminar-usuario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        Admin.eliminarUsuario(uid, username);
      });
    });
    
    container.querySelectorAll('.usuario-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        Admin.toggleUsuario(item, item.dataset.uid);
      });
    });
    
    this._actualizarBotonCargarMas();
  },

  toggleUsuario(element, uid) {
    if (!element) return;
    element.classList.toggle('abierto');

    if (element.classList.contains('nuevo')) {
      const usuariosVistos = JSON.parse(localStorage.getItem('admin_usuarios_vistos') || '[]');
      if (!usuariosVistos.includes(uid)) {
        usuariosVistos.push(uid);
        localStorage.setItem('admin_usuarios_vistos', JSON.stringify(usuariosVistos));
      }
      element.classList.remove('nuevo');
      const badge = element.querySelector('.usuario-badge');
      if (badge) badge.remove();
    }
  },

  cargarMasUsuarios() {
    if (this.usersPagination.hasMore && !this.usersPagination.loading) {
      this.cargarUsuarios(false);
    } else if (!this.usersPagination.hasMore) {
      Utils.showToast('No hay más usuarios para cargar', 'info');
    }
  },

  buscarUsuarios: Utils.debounce(function() { 
    const searchEl = document.getElementById('adminUserSearch2');
    if (searchEl) {
      document.getElementById('adminUserSearch').value = searchEl.value;
    }
    Admin.usersPagination.lastDoc = null;
    Admin.usersPagination.hasMore = true;
    Admin.cargarUsuarios(true); 
  }, 300),

  async verPerfil(uid) {
    if (!AppState.isAdmin || !uid) return;
    try {
      const cacheKey = `profile_${uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30000) {
            this._renderProfile(uid, data.userData, data.gam, data.entrenos);
            return;
          }
        } catch (e) {}
      }

      const [userDoc, gam, entrenosSnapshot] = await Promise.all([
        firebaseServices.db.collection('users').doc(uid).get(),
        Gamification.getData(uid),
        firebaseServices.db.collection('globalFeed')
          .where('userId', '==', uid)
          .orderBy('timestamp', 'desc')
          .limit(5)
          .get()
      ]);

      if (!userDoc.exists) {
        Utils.showToast('Usuario no encontrado', 'error');
        return;
      }

      const userData = userDoc.data();
      userData.email = await Admin._emailPrivado(uid);
      const entrenos = entrenosSnapshot;

      const cacheData = {
        userData,
        gam,
        entrenos: entrenos.docs.map(d => ({ id: d.id, ...d.data() }))
      };
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: cacheData, timestamp: Date.now() }));

      this._renderProfile(uid, userData, gam, entrenos);

    } catch (error) {
      console.error('Error viendo perfil:', error);
      Utils.showToast('Error al cargar perfil', 'error');
    }
  },

  _renderProfile(uid, data, gam, entrenos) {
    const html = `
      <div class="admin-modal-grid">
        <div class="item"><div class="label">Usuario</div><div class="value">${Utils.escapeHTML(data.username)}</div></div>
        <div class="item"><div class="label">Email</div><div class="value" style="font-size:14px;">${Utils.escapeHTML(data.email)}</div></div>
        <div class="item"><div class="label">Premium</div><div class="value">${data.premium ? '✅ Sí' : '❌ No'}</div></div>
        <div class="item"><div class="label">Expira</div><div class="value">${data.expires ? new Date(data.expires).toLocaleDateString() : '-'}</div></div>
        <div class="item"><div class="label">Registro</div><div class="value">${data.created ? new Date(data.created).toLocaleDateString() : '-'}</div></div>
        <div class="item"><div class="label">Último login</div><div class="value">${data.lastLogin ? new Date(data.lastLogin.toDate()).toLocaleString() : '-'}</div></div>
        <div class="item"><div class="label">Nivel</div><div class="value">${gam?.level || 1}</div></div>
        <div class="item"><div class="label">Distancia total</div><div class="value">${gam?.totalDistance?.toFixed(1) || '0'} km</div></div>
      </div>
      <div class="admin-modal-entrenos">
        <h4>📋 Últimos entrenamientos</h4>
        ${entrenos.empty ? '<p style="color:var(--text-secondary);">Sin entrenamientos</p>' : 
          entrenos.docs.map(d => `
            <div class="entreno-item">${d.data().trainingType || 'Sesión'} · ${d.data().distancia?.toFixed(2) || '0'} km · ${d.data().duration || '?'} min</div>
          `).join('')}
      </div>
    `;
    document.getElementById('adminModalContent').innerHTML = html;
    document.getElementById('adminModalTitle').textContent = `👤 ${Utils.capitalizeUsername(data.username)}`;
    const modal = document.getElementById('adminUserModal');
    // 🔧 FIX parpadeo: si se abre encima de una lista (p. ej. «Nuevos»), el fundido de entrada del
    // modal (opacidad 0 -> 1) dejaba ver un instante la lista de detrás. Sobre la lista aparece
    // directo, sin fundido; abierto solo (sin lista debajo) conserva el fundido de siempre.
    const sobreLista = document.getElementById('adminListModal')?.style.display === 'flex';
    modal.style.animation = sobreLista ? 'none' : '';
    modal.style.transition = sobreLista ? 'none' : '';
    modal.classList.add('active');
    modal.style.zIndex = '100002';
    // 🔥 FIX: se reseteaba el scroll de .admin-modal-content (la caja
    // exterior), pero desde el fix del botón CERRAR fijo esa caja ya NO
    // hace scroll -- el que de verdad se desplaza es #adminModalContent
    // (el div interior). Sin este cambio, al reabrir el modal con otro
    // usuario se veía todavía desplazado donde se había dejado la vez
    // anterior.
    const contenido = document.getElementById('adminModalContent');
    if (contenido) contenido.scrollTop = 0;
  },

  cerrarModalUsuario() {
    const modal = document.getElementById('adminUserModal');
    const contenido = document.getElementById('adminModalContent');
    if (contenido) contenido.scrollTop = 0;
    modal?.classList.remove('active');
  },

  async mostrarUsuariosPorFiltro(tipo) {
    const modal = document.getElementById('adminListModal');
    const title = document.getElementById('adminListModalTitle');
    const content = document.getElementById('adminListModalContent');
    if (!modal || !title || !content) return;
    if (this._cargandoLista) return;   // doble toque mientras carga: ignorar
    this._cargandoLista = true;

    let usuarios = [];
    let titulo = '';
    let htmlContent = '';

    Utils.showLoading();

    try {
      switch (tipo) {
        case 'total':
          titulo = '👥 Todos los usuarios';
          const totalSnap = await firebaseServices.db.collection('users')
            .orderBy('username_lowercase')
            .limit(100)
            .get();
          usuarios = totalSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          break;

        case 'premium':
          titulo = '⭐ Usuarios Premium';
          const premiumSnap = await firebaseServices.db.collection('users')
            .where('premium', '==', true)
            .orderBy('username_lowercase')
            .limit(100)
            .get();
          usuarios = premiumSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          break;

        case 'new':
          titulo = '🆕 Usuarios nuevos (últimos 7 días)';
          const fecha = new Date();
          fecha.setDate(fecha.getDate() - 7);
          const fechaStr = fecha.toISOString();
          const newSnap = await firebaseServices.db.collection('users')
            .where('created', '>=', fechaStr)
            .orderBy('created', 'desc')
            .limit(100)
            .get();
          usuarios = newSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          break;

        case 'sessions':
          titulo = '🏃 Usuarios con sesiones hoy';
          const hoy = new Date();
          hoy.setHours(0,0,0,0);
          const manana = new Date(hoy);
          manana.setDate(manana.getDate() + 1);
          // 🔥 FIX: .select() no existe en el SDK cliente de Firebase (solo
          // en el Admin SDK, para Node.js) -- aquí se estaba usando
          // firebase-firestore.js 8.10.1 (ver index.html), así que
          // sessionsSnap.select('userId') lanzaba un TypeError ANTES de
          // llegar siquiera a pedir los datos, y el catch de más abajo lo
          // convertía en "Error al cargar la lista" cada vez que se pulsaba
          // esta tarjeta -- aunque la propia tarjeta mostrara bien el "7"
          // (ese número sale de iniciarEscuchaSesionesHoy, una consulta
          // distinta que nunca usó .select()). Sin field-mask: se piden los
          // documentos completos, igual que en el resto del admin.
          const sessionsSnap = await firebaseServices.db.collection('globalFeed')
            .where('timestamp', '>=', firebaseServices.Timestamp.fromDate(hoy))
            .where('timestamp', '<', firebaseServices.Timestamp.fromDate(manana))
            .get();
          // 🔥 FIX: se descartan valores vacíos/undefined antes de armar el
          // 'in' -- un solo globalFeed sin userId (dato antiguo o corrupto)
          // metía `undefined` en el array y Firestore rechaza esa consulta
          // entera con una excepción, tirando abajo TODA la lista aunque el
          // resto de usuarios sí fueran válidos.
          const userIds = [...new Set(sessionsSnap.docs.map(doc => doc.data().userId).filter(Boolean))];
          if (userIds.length === 0) {
            usuarios = [];
          } else {
            const userPromises = [];
            for (let i = 0; i < userIds.length; i += 10) {
              const batch = userIds.slice(i, i + 10);
              userPromises.push(
                firebaseServices.db.collection('users')
                  // 🔥 FIX: firebaseServices.FieldPath.documentId() en vez
                  // del string suelto '__name__' -- es la forma oficial y
                  // documentada de filtrar/orderar por ID de documento en
                  // el SDK cliente de Firebase (ver firebase-config.js).
                  .where(firebaseServices.FieldPath.documentId(), 'in', batch)
                  .get()
              );
            }
            const userSnaps = await Promise.all(userPromises);
            usuarios = userSnaps.flatMap(snap => snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
          }
          break;

        default:
          Utils.showToast('Filtro no válido', 'error');
          await Utils.hideLoading();
          this._cargandoLista = false;
          return;
      }

      await Admin._adjuntarEmails(usuarios);

      if (usuarios.length === 0) {
        htmlContent = '<p style="text-align:center; padding:20px; color:var(--text-secondary);">No hay usuarios en este grupo</p>';
      } else {
        let html = '<div style="display:flex; flex-direction:column; gap:8px;" onclick="event.stopPropagation();">';
        for (const user of usuarios) {
          const username = Utils.capitalizeUsername(user.username) || 'Usuario';
          const email = Utils.escapeHTML(user.email || '');
          const premium = this._esPremiumReal(user) ? '⭐' : '';
          html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-secondary); border-radius:14px; cursor:pointer; border:1px solid var(--border-color);" onclick="event.stopPropagation(); Admin.verPerfil('${user.uid}')">
              <div>
                <div style="font-weight:500; color:var(--accent-yellow);">${Utils.escapeHTML(username)} ${premium}</div>
                <div style="font-size:12px; color:var(--text-secondary);">${email}</div>
              </div>
              <span style="font-size:12px; color:var(--accent-blue); font-weight:500; background:var(--bg-primary); padding:2px 10px; border-radius:14px; border:1px solid var(--border-color);">VER</span>
            </div>
          `;
        }
        html += '</div>';
        htmlContent = html;
      }

    } catch (error) {
      console.error('Error al cargar lista de usuarios:', error);
      // 🔥 FIX: antes se mostraba siempre el mismo texto genérico
      // ("Error al cargar la lista"), así que cualquier fallo -- fuera cual
      // fuera la causa real -- se veía exactamente igual. Como este modal
      // solo lo ve el admin, no hay problema en enseñar aquí el mensaje de
      // error real (error.message): la próxima vez que algo falle se podrá
      // diagnosticar directamente desde el móvil, sin tener que abrir la
      // consola del navegador.
      htmlContent = `<p style="text-align:center; padding:20px; color:var(--zone-5);">Error al cargar la lista<br><span style="font-size:12px; opacity:0.8;">${Utils.escapeHTML(error.message || String(error))}</span></p>`;
      titulo = titulo || '⚠️ Error';
    }

    await Utils.hideLoading();

    content.innerHTML = htmlContent;
    title.textContent = titulo;
    // 🔧 FIX parpadeo: la pantalla de carga se quita justo antes de abrir este
    // modal, y como el modal entraba con fundido (de transparente a visible)
    // se veía un instante la pantalla de detrás y luego el modal "abriéndose
    // otra vez". Aquí el modal sustituye a la carga en el mismo fotograma, así
    // que aparece directo, sin fundido.
    modal.style.animation = 'none';
    modal.style.transition = 'none';
    modal.style.display = 'flex';
    modal.style.zIndex = '100001';
    content.scrollTop = 0;
    this._cargandoLista = false;
  },

  cerrarListModal() {
    const content = document.getElementById('adminListModalContent');
    if (content) content.scrollTop = 0;
    document.getElementById('adminListModal').style.display = 'none';
  },

  async abrirMensajeUsuario(uid, username) {
    const texto = await Utils.promptModal(`✉️ MENSAJE PARA ${username.toUpperCase()}`, {
      label: 'Mensaje', placeholder: 'Escribe tu mensaje…', textarea: true, maxLength: 1000
    });
    if (texto && texto.trim()) {
      this.enviarMensajeSoporteAdmin(uid, texto.trim());
    }
  },

  // 🔥 v4.55: helpers genéricos para borrar/actualizar muchos documentos
  // en lotes (Firestore permite hasta 500 operaciones por batch; se usa
  // 400 por margen de seguridad). Los usa eliminarUsuario() para purgar
  // TODO rastro del usuario en Firestore, no solo sus propias
  // subcolecciones.
  async _borrarRefsEnLotes(refs) {
    const CHUNK = 400;
    for (let i = 0; i < refs.length; i += CHUNK) {
      const batch = firebaseServices.db.batch();
      refs.slice(i, i + CHUNK).forEach(ref => batch.delete(ref));
      await batch.commit();
    }
  },

  async _actualizarRefsEnLotes(refs, datosPorRef) {
    const CHUNK = 400;
    for (let i = 0; i < refs.length; i += CHUNK) {
      const batch = firebaseServices.db.batch();
      refs.slice(i, i + CHUNK).forEach(ref => batch.update(ref, datosPorRef(ref)));
      await batch.commit();
    }
  },

  async _borrarSubcoleccionUsuario(uid, nombre) {
    const snap = await firebaseServices.db.collection('users').doc(uid).collection(nombre).get();
    await this._borrarRefsEnLotes(snap.docs.map(d => d.ref));
    return snap.size;
  },

  async _borrarColeccionPorCampo(coleccion, campo, valor) {
    const snap = await firebaseServices.db.collection(coleccion).where(campo, '==', valor).get();
    await this._borrarRefsEnLotes(snap.docs.map(d => d.ref));
    return snap.size;
  },

  async eliminarUsuario(uid, username) {
    if (!AppState.isAdmin || !uid) return;
    const confirmado = await Utils.confirm(
      'ELIMINAR USUARIO POR COMPLETO',
      `¿Eliminar PERMANENTEMENTE a "${username}"?\n\nSe borrará todo su rastro en Firestore: perfil, historial, planes, cálculos, entrenamientos GPS, pasaporte, publicaciones (y los "me gusta" que dio en publicaciones de otros), mensajes de soporte, solicitudes de amistad, conversaciones, invitaciones de sesión, grupos que creó, y su foto de perfil. También se le quita de la lista de amigos de quien le tuviera añadido.\n\n⚠️ La cuenta de acceso (Firebase Authentication) NO se borra desde aquí -- hay que borrarla aparte a mano en la consola de Firebase (Authentication > buscar el usuario > eliminar), o mientras exista podría volver a crear su perfil si vuelve a iniciar sesión.\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    Utils.showLoading();
    const db = firebaseServices.db;
    const userRef = db.collection('users').doc(uid);
    const avisos = [];

    try {
      // Subcolecciones propias del usuario
      for (const sub of ['historial', 'planes', 'calculos', 'gps_tracks', 'mensajes']) {
        try { await this._borrarSubcoleccionUsuario(uid, sub); }
        catch (e) { avisos.push(`subcolección ${sub}`); console.warn(`No se pudo borrar ${sub}:`, e); }
      }

      try { await db.collection('gamification').doc(uid).delete(); }
      catch (e) { avisos.push('gamificación'); console.warn('No se pudo borrar gamificación:', e); }

      // Publicaciones propias del Muro
      try { await this._borrarColeccionPorCampo('globalFeed', 'userId', uid); }
      catch (e) { avisos.push('publicaciones'); console.warn('No se pudieron borrar publicaciones:', e); }

      // Mensajes de soporte (colección global para el admin)
      try {
        await this._borrarColeccionPorCampo('soporteMensajes', 'fromUid', uid);
        await this._borrarColeccionPorCampo('soporteMensajes', 'toUid', uid);
      } catch (e) { avisos.push('mensajes de soporte'); console.warn('No se pudieron borrar mensajes de soporte:', e); }

      // Solicitudes de amistad enviadas/recibidas
      try {
        await this._borrarColeccionPorCampo('friendRequests', 'from', uid);
        await this._borrarColeccionPorCampo('friendRequests', 'to', uid);
      } catch (e) { avisos.push('solicitudes de amistad'); console.warn('No se pudieron borrar solicitudes de amistad:', e); }

      // Conversaciones (chat de amigos) donde participaba
      try {
        const convSnap = await db.collection('conversations').where('participants', 'array-contains', uid).get();
        await this._borrarRefsEnLotes(convSnap.docs.map(d => d.ref));
      } catch (e) { avisos.push('conversaciones'); console.warn('No se pudieron borrar conversaciones:', e); }

      // Invitaciones de sesión enviadas/recibidas
      try {
        await this._borrarColeccionPorCampo('sessionInvites', 'fromUid', uid);
        await this._borrarColeccionPorCampo('sessionInvites', 'toUid', uid);
      } catch (e) { avisos.push('invitaciones de sesión'); console.warn('No se pudieron borrar invitaciones de sesión:', e); }

      // Grupos de sesión que creó
      try { await this._borrarColeccionPorCampo('sessionGroups', 'createdBy', uid); }
      catch (e) { avisos.push('grupos creados'); console.warn('No se pudieron borrar grupos creados:', e); }

      // Grupos de sesión ajenos donde era miembro -- se le quita de la
      // lista en vez de borrar el grupo entero (que sigue siendo de otros).
      try {
        const gruposSnap = await db.collection('sessionGroups').where('members', 'array-contains', uid).get();
        await this._actualizarRefsEnLotes(gruposSnap.docs.map(d => d.ref), () => ({
          members: firebaseServices.FieldValue.arrayRemove(uid)
        }));
      } catch (e) { avisos.push('membresía de grupos'); console.warn('No se pudo quitar de grupos ajenos:', e); }

      // "Me gusta" que dio en publicaciones AJENAS -- se le quita del
      // array `likes` y se descuenta el contador, en vez de dejar un like
      // fantasma de una cuenta que ya no existe.
      try {
        const likesSnap = await db.collection('globalFeed').where('likes', 'array-contains', uid).get();
        await this._actualizarRefsEnLotes(likesSnap.docs.map(d => d.ref), () => ({
          likes: firebaseServices.FieldValue.arrayRemove(uid),
          likeCount: firebaseServices.FieldValue.increment(-1)
        }));
      } catch (e) { avisos.push('"me gusta" dados'); console.warn('No se pudieron quitar los "me gusta" dados:', e); }

      // Se le quita de la lista de amigos (friendIds) de quien le tuviera
      // añadido -- antes esto solo se limpiaba solo, más tarde, cuando
      // cada amigo abría su propia lista (_limpiarAmigosHuérfanos en
      // friends.js); ahora se hace ya en el momento de borrar.
      try {
        const amigosSnap = await db.collection('users').where('friendIds', 'array-contains', uid).get();
        await this._actualizarRefsEnLotes(amigosSnap.docs.map(d => d.ref), () => ({
          friendIds: firebaseServices.FieldValue.arrayRemove(uid)
        }));
      } catch (e) { avisos.push('listas de amigos ajenas'); console.warn('No se pudo quitar de amigos ajenos:', e); }

      // Foto de perfil en Storage
      try { await Storage.deleteProfilePicture(uid); }
      catch (e) { avisos.push('foto de perfil'); console.warn('No se pudo borrar la foto de perfil:', e); }

      // Restos de la estructura antigua de mensajes (mensajes/{uid} y
      // mensajes/admin_{uid}), previa a soporteMensajes.
      try { await db.collection('mensajes').doc(uid).delete(); } catch (e) {}
      try { await db.collection('mensajes').doc('admin_' + uid).delete(); } catch (e) {}

      // Documento principal del usuario, el último en borrarse.
      await userRef.delete();

      if (avisos.length > 0) {
        Utils.showToast(`⚠️ Usuario ${username} eliminado, pero hubo problemas con: ${avisos.join(', ')}. Revisa la consola.`, 'warning');
      } else {
        Utils.showToast(`✅ Usuario ${username} eliminado por completo de Firestore. Recuerda borrar también su cuenta en Firebase Authentication.`, 'success');
      }
      this.cargarUsuarios(true);
      this.cargarEstadisticas();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      Utils.showToast('Error al eliminar usuario: ' + error.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  abrirModalPremium(uid, username, esPremium, expires) {
    this.currentEditUserId = uid;
    const userEl = document.getElementById('premiumManageUser');
    if (userEl) userEl.innerText = `Editando premium de: ${username}`;

    const statusEl = document.getElementById('premiumManageStatus');
    if (statusEl) statusEl.value = esPremium ? 'true' : 'false';

    const expiryEl = document.getElementById('premiumManageExpiry');
    if (expiryEl) {
      if (expires && expires !== '-') {
        const d = new Date(expires);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        expiryEl.value = `${year}-${month}-${day}`;
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        expiryEl.value = `${year}-${month}-${day}`;
      }
    }

    const modal = document.getElementById('premiumManageModal');
    const overlay = document.getElementById('premiumManageOverlay');
    if (modal) { modal.style.display = 'block'; modal.scrollTop = 0; }
    if (overlay) overlay.style.display = 'block';
  },

  cerrarModalPremium() {
    const modal = document.getElementById('premiumManageModal');
    const overlay = document.getElementById('premiumManageOverlay');
    if (modal) modal.scrollTop = 0;
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    this.currentEditUserId = null;
  },

  async guardarPremium() {
    if (!this.currentEditUserId) return;

    const statusEl = document.getElementById('premiumManageStatus');
    const expiryEl = document.getElementById('premiumManageExpiry');
    const status = statusEl ? statusEl.value === 'true' : false;
    let expiry = expiryEl ? expiryEl.value : '';

    if (!expiry) {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      expiry = d.toISOString();
    } else {
      expiry = new Date(expiry + 'T23:59:59').toISOString();
    }

    Utils.showLoading();
    try {
      await firebaseServices.db.collection('users').doc(this.currentEditUserId).update({ premium: status, expires: expiry });
      Utils.showToast('✅ Estado premium actualizado', 'success');
      this.cerrarModalPremium();
      this.cargarUsuarios(true);
      this.cargarEstadisticas();
    } catch (error) { 
      console.error('Error actualizando premium:', error); 
      Utils.showToast('Error: ' + error.message, 'error'); 
    } finally { 
      Utils.hideLoading(); 
    }
  },

  // 🔧 Sustituye a la antigua toggleEntrenador (confirm() simple): ahora
  // se abre un modal (mismo patrón que abrirModalPremium) porque hacer
  // entrenador a alguien también implica decidir su límite de atletas
  // (petición del usuario). Sirve igual para editar el límite de un
  // entrenador que ya lo es, sin tener que quitarle y volver a ponerle
  // el rol.
  abrirModalEntrenador(uid, username, esEntrenador, maxAlumnos) {
    this.currentEditUserId = uid;
    const userEl = document.getElementById('entrenadorManageUser');
    if (userEl) userEl.innerText = `Editando entrenador: ${username}`;

    const statusEl = document.getElementById('entrenadorManageStatus');
    if (statusEl) statusEl.value = esEntrenador ? 'true' : 'false';

    const maxEl = document.getElementById('entrenadorManageMax');
    if (maxEl) maxEl.value = (maxAlumnos === null || maxAlumnos === undefined) ? '' : maxAlumnos;

    const verEl = document.getElementById('entrenadorManageVerified');
    const titEl = document.getElementById('entrenadorManageTitle');
    if (verEl) verEl.value = 'false';
    if (titEl) titEl.value = '';
    firebaseServices.db.collection('users').doc(uid).get().then(doc => {
      if (this.currentEditUserId !== uid || !doc.exists) return;
      const d = doc.data();
      if (verEl) verEl.value = d.trainerVerified === true ? 'true' : 'false';
      if (titEl) titEl.value = d.trainerTitle || '';
    }).catch(e => console.warn('No se pudo leer la verificación:', e));

    const modal = document.getElementById('entrenadorManageModal');
    const overlay = document.getElementById('entrenadorManageOverlay');
    if (modal) { modal.style.display = 'block'; modal.scrollTop = 0; }
    if (overlay) overlay.style.display = 'block';
  },

  cerrarModalEntrenador() {
    const modal = document.getElementById('entrenadorManageModal');
    const overlay = document.getElementById('entrenadorManageOverlay');
    if (modal) modal.scrollTop = 0;
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    this.currentEditUserId = null;
  },

  async guardarEntrenador() {
    if (!this.currentEditUserId) return;
    const uid = this.currentEditUserId;

    const statusEl = document.getElementById('entrenadorManageStatus');
    const maxEl = document.getElementById('entrenadorManageMax');
    const nuevoEstado = statusEl ? statusEl.value === 'true' : false;
    const maxRaw = maxEl ? maxEl.value.trim() : '';
    // Campo vacío = sin límite (se guarda null, igual que un entrenador
    // sin límite fijado todavía).
    const maxAlumnos = maxRaw === '' ? null : Math.max(0, parseInt(maxRaw, 10) || 0);

    const verificado = nuevoEstado && document.getElementById('entrenadorManageVerified')?.value === 'true';
    const titulo = (document.getElementById('entrenadorManageTitle')?.value || '').trim().slice(0, 80);
    if (verificado && !titulo) {
      Utils.showToast('Para verificar escribe el título del entrenador', 'error');
      return;
    }

    Utils.showLoading();
    try {
      await firebaseServices.db.collection('users').doc(uid).update({
        isTrainer: nuevoEstado, maxAlumnos,
        trainerVerified: verificado,
        trainerTitle: verificado ? titulo : ''
      });
    } catch (error) {
      console.error('Error actualizando rol de entrenador:', error);
      Utils.showToast('Error: ' + error.message, 'error');
      Utils.hideLoading();
      return;
    }
    Utils.showToast(nuevoEstado ? '✅ Entrenador actualizado' : 'Entrenador desactivado', 'success');
    this.cerrarModalEntrenador();

    // 🔥 A petición del usuario (se mantiene el comportamiento de la
    // antigua toggleEntrenador): no se recarga la lista entera de
    // usuarios -- solo se actualiza en el sitio el botón de esa fila.
    // 🔥 FIX (petición del usuario): el botón ahora también muestra
    // cuántos atletas tiene YA aceptados de ese límite (no solo el
    // límite en sí) -- se relee alumnosAceptados del propio doc en vez
    // de asumirlo, porque cambiar aquí isTrainer/maxAlumnos no lo toca,
    // pero este modal no lo tenía cacheado.
    const btn = document.querySelector(`.entrenador-usuario-btn[data-uid="${uid}"]`);
    if (btn) {
      let alumnosActuales = 0;
      try {
        const freshDoc = await firebaseServices.db.collection('users').doc(uid).get();
        alumnosActuales = (freshDoc.data()?.alumnosAceptados || []).length;
      } catch (e) { /* si falla la relectura, se muestra solo el límite */ }
      btn.dataset.entrenador = nuevoEstado ? 'true' : 'false';
      btn.dataset.maxAlumnos = maxAlumnos === null ? '' : maxAlumnos;
      btn.textContent = nuevoEstado ? `📋 ENTRENADOR (${alumnosActuales}${maxAlumnos != null ? '/' + maxAlumnos : ''})` : 'HACER ENTRENADOR';
      btn.style.borderColor = nuevoEstado ? 'var(--gold)' : '';
      btn.style.color = nuevoEstado ? 'var(--gold)' : '';
    }
    Utils.hideLoading();
  },

  cambiarSubtab(subtab) {
    document.querySelectorAll('.admin-subpanel').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-subtab').forEach(el => el.classList.remove('active'));

    if (subtab === 'control') {
      document.getElementById('adminControlPanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="control"]').classList.add('active');
    } else if (subtab === 'soporte') {
      document.getElementById('adminSoportePanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="soporte"]').classList.add('active');
      // Sin forzar: si la caché sigue vigente se reutiliza al instante;
      // si no, se recarga mostrando la animación "CARGANDO".
      this.cargarMensajesUsuarios();
    } else if (subtab === 'patrocinadores') {
      document.getElementById('adminPatrocinadoresPanel').style.display = 'block';
      document.querySelector('.admin-subtab[data-subtab="patrocinadores"]').classList.add('active');
      if (window.Sponsors) Sponsors.cargarAdminLista();
    }
  },

  // ============================================================
  // NUEVO SISTEMA DE HILOS DE CONVERSACIÓN DE SOPORTE (VERSIÓN CON CARGA ESTÁNDAR)
  // ============================================================

  // Caché en memoria de la lista de conversaciones de soporte del admin.
  // _cacheSoporteVigente se pone a false (desde el listener de arriba, o
  // al forzar recarga) cada vez que hay un mensaje nuevo, uno enviado o
  // uno borrado; mientras siga en true se reutiliza la lista ya calculada
  // y no se vuelve a pedir nada a Firestore ni se muestra "CARGANDO".
  _cacheSoporteUsuarios: null,
  _cacheSoporteVigente: false,
  // 🔥 v4.56: caché de nombre/foto por uid (independiente de forzarRecarga
  // y de _cacheSoporteVigente) -- una vez consultado un usuario, no se
  // vuelve a pedir su documento aunque se recargue la lista de mensajes o
  // se pida "cargar más".
  _cacheSoporteUsuariosPorUid: {},
  _soporteLastDoc: null,
  _soporteHayMas: false,

  async cargarMensajesUsuarios(forzarRecarga = false) {
    if (!AppState.isAdmin) return;
    const container = document.getElementById('adminMessagesList');
    if (!container) return;

    if (!forzarRecarga && this._cacheSoporteVigente && this._cacheSoporteUsuarios) {
      this._renderizarListaSoporte(this._cacheSoporteUsuarios, container);
      return;
    }

    // Misma animación estándar de letras doradas que usa el resto de la
    // app ("EN PROCESO"), aquí con el texto "CARGANDO". _animarTextoDorado
    // devuelve cuánto dura su propia animación (letras entrando + viraje a
    // dorado); antes ese valor se ignoraba, así que si Firestore respondía
    // rápido (p.ej. con caché local) el HTML de los chats sustituía al
    // "CARGANDO" a medio animar, cortándolo. Ahora se guarda el tiempo de
    // inicio y la duración, y justo antes de pintar el resultado (tanto si
    // hay conversaciones como si no) se espera lo que falte para que la
    // animación siempre se vea completa.
    container.innerHTML = '<div style="text-align:center; padding:40px;"><span id="adminSoporteLoadingText" style="font-size:16px; font-weight:600; letter-spacing:1px;"></span></div>';
    const loadingTextEl = document.getElementById('adminSoporteLoadingText');
    const inicioAnimacion = Date.now();
    const duracionAnimacion = loadingTextEl ? Utils._animarTextoDorado(loadingTextEl, 'CARGANDO') : 0;
    const esperarFinAnimacion = async () => {
      const restante = duracionAnimacion - (Date.now() - inicioAnimacion);
      if (restante > 0) await new Promise(resolve => setTimeout(resolve, restante));
    };

    try {
      // 🔥 v4.57: se pide por CONVERSACIONES, no por mensajes en bruto --
      // ver _cargarTandaConversaciones. Antes se pedía un número fijo de
      // mensajes (150), que podían corresponder a 30 conversaciones
      // distintas aunque el admin solo fuera a mirar 2 o 3.
      const { usuarios, lastDoc, hayMas } = await this._cargarTandaConversaciones(10, null, new Map());
      this._soporteLastDoc = lastDoc;
      this._soporteHayMas = hayMas;

      if (!usuarios.length) {
        this._cacheSoporteUsuarios = usuarios;
        this._cacheSoporteVigente = true;
        await esperarFinAnimacion();
        if (document.getElementById('adminSoporteLoadingText')) {
          container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay mensajes de soporte</p>';
        }
        return;
      }

      this._cacheSoporteUsuarios = usuarios;
      this._cacheSoporteVigente = true;

      await esperarFinAnimacion();
      // Si el admin salió del panel de soporte mientras esperábamos, el
      // <span> de "CARGANDO" ya no está en el DOM (container.innerHTML se
      // sobrescribió al cambiar de subpestaña): no pintamos encima de otra
      // pantalla.
      if (document.getElementById('adminSoporteLoadingText')) {
        this._renderizarListaSoporte(usuarios, container);
      }

    } catch (error) {
      console.error('Error cargando mensajes de soporte:', error);
      await esperarFinAnimacion();
      if (document.getElementById('adminSoporteLoadingText')) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--zone-5);">Error al cargar mensajes</p>';
      }
    }
  },

  // 🔥 v4.57: pide mensajes en tandas PEQUEÑAS (LOTE) y va agrupándolos
  // por usuario, parando en cuanto se alcanzan `objetivoMostrar`
  // conversaciones distintas (o se agota la colección). Así, para ver
  // "las últimas 10 conversaciones" no hace falta adivinar cuántos
  // mensajes en bruto hacen falta -- se lee lo justo, ronda a ronda, hasta
  // tener 10 usuarios distintos. MAX_VUELTAS es una salvaguarda: si un
  // único usuario ha mandado cientos de mensajes seguidos (spam, o mucha
  // conversación) y tapa a los demás, no se sigue leyendo sin fin.
  //
  // 🔥 v4.58: FIX del bug reportado -- un broadcast del admin a 30
  // usuarios a la vez genera 30 mensajes con timestamp casi idéntico, que
  // caen dentro del MISMO lote de 40 mensajes leído de una sola vez. Antes
  // ese lote se procesaba entero (los 30 usuarios entraban en el mapa) y
  // el objetivo (10) solo se usaba para decidir si pedir OTRA tanda a
  // Firestore -- nunca se recortaba la lista final, así que las 30
  // conversaciones se mostraban de golpe en vez de solo las 10 más
  // recientes. Ahora `objetivoMostrar` es el TOTAL absoluto de
  // conversaciones a mostrar (no "nuevas"), y el resultado SIEMPRE se
  // recorta a ese número tras ordenar por fecha del último mensaje -- el
  // resto de usuarios que se colaron en el mismo lote no se descartan,
  // se quedan en `mapPrevio` (sin volver a leerse de Firestore) para
  // cuando se pida "cargar más".
  async _cargarTandaConversaciones(objetivoMostrar, startAfterDoc, mapPrevio) {
    const adminUid = AppState.currentUserId;
    const usuariosMap = mapPrevio || new Map();
    const LOTE = 40;
    const MAX_VUELTAS = 10;
    let lastDoc = startAfterDoc;
    let hayMasFirestore = true;
    let vueltas = 0;

    // Si el mapa ya traído de una tanda anterior alcanza o supera el
    // objetivo (p.ej. porque un lote anterior trajo de golpe más
    // conversaciones de las mostradas), no hace falta pedir nada nuevo a
    // Firestore -- se reutiliza lo que ya hay.
    while (usuariosMap.size < objetivoMostrar && hayMasFirestore && vueltas < MAX_VUELTAS) {
      const { mensajes, lastDoc: siguienteLastDoc, hayMas: quedanMas } = await Storage.getMensajesSoporteAdmin(LOTE, lastDoc);
      vueltas++;
      if (!mensajes.length) { hayMasFirestore = false; break; }
      await this._agruparMensajesSoportePorUsuario(mensajes, adminUid, usuariosMap);
      lastDoc = siguienteLastDoc;
      hayMasFirestore = quedanMas;
    }

    const todos = Array.from(usuariosMap.values());
    todos.sort((a, b) => (b.ultimoMensaje?.timestamp?.toMillis?.() || 0) - (a.ultimoMensaje?.timestamp?.toMillis?.() || 0));
    const usuarios = todos.slice(0, objetivoMostrar);
    usuarios._map = usuariosMap; // se conserva COMPLETO (incluido lo que sobró) para "cargar más"
    const hayMas = todos.length > objetivoMostrar || hayMasFirestore;
    return { usuarios, lastDoc, hayMas };
  },

  // Agrupa una tanda de mensajes por usuario (el que no es admin), sobre
  // el Map que se le pase (lo muta en el sitio). Los datos de usuario
  // (nombre/foto) que aún no se conocieran se piden EN PARALELO (antes:
  // uno a uno, en serie, con un await dentro del bucle) y solo para uids
  // que no estén ya en _cacheSoporteUsuariosPorUid -- si ya se consultó a
  // alguien antes en esta sesión de admin (aquí o en una tanda anterior),
  // no se vuelve a leer su documento.
  async _agruparMensajesSoportePorUsuario(mensajes, adminUid, usuariosMap) {
    const uidsNecesarios = new Set();
    for (const msg of mensajes) {
      const uid = msg.fromUid === adminUid ? msg.toUid : msg.fromUid;
      if (uid && uid !== adminUid && !this._cacheSoporteUsuariosPorUid[uid]) uidsNecesarios.add(uid);
    }
    if (uidsNecesarios.size) {
      const uidsArr = [...uidsNecesarios];
      const datos = await Promise.all(uidsArr.map(uid => Storage.getUser(uid).catch(() => null)));
      uidsArr.forEach((uid, i) => {
        const userData = datos[i];
        this._cacheSoporteUsuariosPorUid[uid] = {
          username: userData?.username || 'Usuario',
          photoURL: userData?.profile?.photoURL || null
        };
      });
    }

    for (const msg of mensajes) {
      const uid = msg.fromUid === adminUid ? msg.toUid : msg.fromUid;
      if (!uid || uid === adminUid) continue;

      if (!usuariosMap.has(uid)) {
        const cacheado = this._cacheSoporteUsuariosPorUid[uid] || {};
        usuariosMap.set(uid, {
          uid,
          username: cacheado.username || 'Usuario',
          photoURL: cacheado.photoURL || null,
          mensajes: [],
          ultimoMensaje: null,
          noLeidos: 0
        });
      }
      const entry = usuariosMap.get(uid);
      entry.mensajes.push(msg);
      if (!entry.ultimoMensaje || (msg.timestamp?.toMillis?.() || 0) > (entry.ultimoMensaje.timestamp?.toMillis?.() || 0)) {
        entry.ultimoMensaje = msg;
      }
      if (!msg.leido && msg.toUid === adminUid) {
        entry.noLeidos++;
      }
    }
  },

  // Pide 10 conversaciones más (más antiguas) y las mezcla con las que ya
  // hay en pantalla (mismo patrón "cargar más" que ya usa el Muro).
  async cargarMasMensajesSoporte() {
    if (!this._soporteHayMas) return;
    const btn = document.getElementById('cargarMasSoporteBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'CARGANDO...'; }
    try {
      const mapPrevio = this._cacheSoporteUsuarios?._map || new Map();
      // 🔥 v4.58: objetivoMostrar es ahora un TOTAL absoluto, no "nuevas" --
      // se pide lo que ya había en pantalla + 10 más.
      const objetivoMostrar = (this._cacheSoporteUsuarios?.length || 0) + 10;
      const { usuarios, lastDoc, hayMas } = await this._cargarTandaConversaciones(objetivoMostrar, this._soporteLastDoc, mapPrevio);
      this._soporteLastDoc = lastDoc;
      this._soporteHayMas = hayMas;
      this._cacheSoporteUsuarios = usuarios;
      const container = document.getElementById('adminMessagesList');
      if (container) this._renderizarListaSoporte(usuarios, container);
    } catch (e) {
      console.error('Error cargando más mensajes de soporte:', e);
      Utils.showToast('Error al cargar más mensajes', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'CARGAR MÁS'; }
    }
  },

  // Pinta la lista de conversaciones en el contenedor a partir de un
  // array de usuarios ya calculado (de Firestore o de la caché).
  _renderizarListaSoporte(usuarios, container) {
    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">No hay conversaciones con usuarios.</p>';
      return;
    }

    let html = '';
    for (const user of usuarios) {
      const fecha = user.ultimoMensaje?.timestamp?.toDate ? user.ultimoMensaje.timestamp.toDate().toLocaleString() : '—';
      const textoPreview = user.ultimoMensaje?.texto ? Utils.escapeHTML(user.ultimoMensaje.texto.substring(0, 60)) : '';
      const nombre = Utils.escapeHTML(Utils.capitalizeUsername(user.username));
      const iconoPapelera = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;

      // 🔥 Con notificación (mensajes no leídos): la tarjeta entera se
      // pinta del color de aviso (--notification-color) en vez del fondo
      // normal, y los textos pasan a un tono oscuro para seguir
      // leyéndose bien sobre ese naranja.
      const tieneNoLeidos = user.noLeidos > 0;
      const cardBg = tieneNoLeidos ? 'var(--notification-color)' : 'var(--bg-secondary)';
      const cardBorder = tieneNoLeidos ? 'var(--notification-color)' : 'var(--border-color)';
      const colorNombre = tieneNoLeidos ? '#241505' : 'var(--accent-yellow)';
      const colorSecundario = tieneNoLeidos ? 'rgba(0,0,0,0.65)' : 'var(--text-secondary)';
      const avatarPlaceholderBg = tieneNoLeidos ? 'rgba(0,0,0,0.18)' : 'var(--bg-secondary)';
      const iconoPapeleraColor = tieneNoLeidos ? 'rgba(0,0,0,0.55)' : 'var(--zone-5)';

      const avatar = user.photoURL ? `<img src="${Utils.escapeHTML(user.photoURL)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover;">` : `<div style="width:46px;height:46px;border-radius:50%;background:${avatarPlaceholderBg};display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>`;
      const badgeNoLeidos = tieneNoLeidos ? `<span style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;white-space:nowrap;">${user.noLeidos} nuevo${user.noLeidos > 1 ? 's' : ''}</span>` : '';

      html += `
        <div class="usuario-soporte-item" data-uid="${user.uid}" style="display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto auto auto;column-gap:8px;row-gap:4px;padding:12px;background:${cardBg};border:1px solid ${cardBorder};border-radius:14px;margin-bottom:8px;cursor:pointer;transition:background 0.2s, border-color 0.2s;">
          <div style="grid-column:1;grid-row:1 / 4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">
            ${avatar}
            <span style="font-weight:600;font-size:14px;color:${colorNombre};text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nombre}</span>
          </div>
          <span style="grid-column:3;grid-row:1;font-size:12px;color:${colorSecundario};align-self:start;justify-self:end;white-space:nowrap;">${fecha}</span>
          <div style="grid-column:3;grid-row:2;align-self:center;justify-self:end;">${badgeNoLeidos}</div>
          <div style="grid-column:2;grid-row:3;align-self:end;justify-self:center;font-size:14px;color:${colorSecundario};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;max-width:100%;">${textoPreview}</div>
          <button type="button" class="borrar-conversacion-soporte" data-uid="${user.uid}" title="Eliminar conversación" style="grid-column:3;grid-row:3;justify-self:end;align-self:end;width:28px;height:28px;flex-shrink:0;border:none;background:transparent;color:${iconoPapeleraColor};padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;">${iconoPapelera}</button>
        </div>
      `;
    }

    container.innerHTML = html;

    // 🔥 v4.56: botón "cargar más" al final de la lista si la última
    // tanda pedida a Firestore vino llena (podría haber conversaciones
    // más antiguas sin traer todavía) -- mismo patrón que ya usa el Muro.
    if (this._soporteHayMas) {
      container.innerHTML += `<button id="cargarMasSoporteBtn" class="action-button" style="margin-top:8px; background:transparent; border:1px solid var(--border-color);" onclick="Admin.cargarMasMensajesSoporte()">CARGAR MÁS</button>`;
    }

    // Tarjeta entera pulsable: abre la conversación (misma función que
    // antes hacía el botón "VER").
    container.querySelectorAll('.usuario-soporte-item').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.dataset.uid;
        this.abrirConversacionSoporte(uid);
      });
    });

    // La papelera va por encima: detiene la propagación para no disparar
    // también el click de la tarjeta (que abriría el chat).
    container.querySelectorAll('.borrar-conversacion-soporte').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.eliminarConversacionSoporte(btn.dataset.uid);
      });
    });
  },

  // Borra por completo la conversación de soporte con un usuario, tras
  // confirmación, y refresca la lista (tanto en pantalla como en la caché
  // en memoria) sin necesidad de volver a pedir todo a Firestore.
  async eliminarConversacionSoporte(uid) {
    if (!uid) return;
    const usuario = (this._cacheSoporteUsuarios || []).find(u => u.uid === uid);
    const nombre = usuario ? Utils.capitalizeUsername(usuario.username) : 'este usuario';
    const confirmado = await Utils.confirm(
      'Eliminar conversación',
      `¿Eliminar por completo la conversación con ${nombre}? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    Utils.showLoading('Eliminando');
    try {
      const ok = await Storage.eliminarConversacionSoporte(uid);
      if (ok) {
        if (this._cacheSoporteUsuarios) {
          this._cacheSoporteUsuarios = this._cacheSoporteUsuarios.filter(u => u.uid !== uid);
        }
        const container = document.getElementById('adminMessagesList');
        if (container) this._renderizarListaSoporte(this._cacheSoporteUsuarios || [], container);
        Utils.showToast('✅ Conversación eliminada', 'success');
      } else {
        Utils.showToast('Error al eliminar la conversación', 'error');
      }
    } catch (e) {
      console.error('Error eliminando conversación de soporte:', e);
      Utils.showToast('Error al eliminar la conversación', 'error');
    } finally {
      await Utils.hideLoading();
    }
  },

  async abrirConversacionSoporte(uid) {
    // Mostrar la animación de carga estándar de la app
    Utils.showLoading();

    try {
      // Cargar los mensajes (ahora devuelve los datos)
      const mensajes = await this._cargarMensajesConversacion(uid);

      // Una vez cargados, crear el modal
      this._mostrarModalConversacion(uid, mensajes);
    } catch (error) {
      console.error('Error cargando conversación:', error);
      Utils.showToast('Error al cargar la conversación', 'error');
    } finally {
      // Ocultar la animación de carga
      Utils.hideLoading();
    }
  },

  // Función que carga los mensajes y los devuelve (no modifica el DOM)
  async _cargarMensajesConversacion(uid) {
    const adminUid = AppState.currentUserId;
    
    const snapshot1 = await firebaseServices.db.collection('soporteMensajes')
      .where('fromUid', '==', uid)
      .where('toUid', '==', adminUid)
      .get();
    
    const snapshot2 = await firebaseServices.db.collection('soporteMensajes')
      .where('fromUid', '==', adminUid)
      .where('toUid', '==', uid)
      .get();

    const todos = [...snapshot1.docs, ...snapshot2.docs]
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const tsA = a.timestamp?.toMillis?.() || 0;
        const tsB = b.timestamp?.toMillis?.() || 0;
        return tsA - tsB;
      });

    // Marcar mensajes como leídos
    const noLeidos = todos.filter(msg => !msg.leido && msg.toUid === adminUid);
    for (const msg of noLeidos) {
      try {
        await firebaseServices.db.collection('soporteMensajes').doc(msg.id).update({ leido: true });
      } catch (e) {
        console.warn('Error marcando mensaje como leído:', e);
      }
    }

    if (noLeidos.length > 0) {
      const unreadSnap = await firebaseServices.db.collection('soporteMensajes')
        .where('toUid', '==', adminUid)
        .where('leido', '==', false)
        .get();
      AppState.mensajesSoporteAdminNoLeidos = unreadSnap.size;
      AppState.actualizarBadgeSoporteAdmin();
      this.cargarMensajesUsuarios(true);
    }

    return todos;
  },

  // Función que crea y muestra el modal con los mensajes ya cargados
  _mostrarModalConversacion(uid, mensajes) {
    // Cerrar modal anterior si existe
    document.getElementById('conversacionSoporteModal')?.remove();
    document.getElementById('conversacionSoporteOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'conversacionSoporteOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      z-index:20000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.cerrarConversacionSoporte();
    });

    const modal = document.createElement('div');
    modal.id = 'conversacionSoporteModal';
    modal.style.cssText = `
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:16px; max-width:600px; width:90%;
      height:65vh; max-height:80vh;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:var(--shadow-lg); opacity:0; transition:opacity 0.2s ease;
    `;

    // Cabecera centrada
    const header = document.createElement('div');
    header.style.cssText = `
      display:flex; justify-content:center; align-items:center;
      padding:16px 20px; border-bottom:1px solid var(--border-color);
      background:var(--bg-primary); flex-shrink:0;
      position:relative;
    `;
    // Obtener nombre del usuario
    let nombreUsuario = 'Usuario';
    Storage.getUser(uid).then(userData => {
      if (userData?.username) nombreUsuario = Utils.capitalizeUsername(userData.username);
      const nombreEl = document.getElementById('conversacionNombre');
      if (nombreEl) nombreEl.textContent = nombreUsuario;
    }).catch(() => {});
    header.innerHTML = `
      <span style="font-size:16px; font-weight:600; color:var(--accent-yellow); text-align:center;">
        💬 Soporte con <span id="conversacionNombre">${nombreUsuario}</span>
      </span>
    `;
    modal.appendChild(header);

    // Contenedor de mensajes
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'conversacionMensajes';
    messagesContainer.style.cssText = `
      flex:1; overflow-y:auto; padding:16px;
      display:flex; flex-direction:column; gap:8px;
      background:var(--bg-secondary);
      min-height:0;
    `;

    // Renderizar mensajes
    if (mensajes.length === 0) {
      messagesContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">No hay mensajes en esta conversación</p>';
    } else {
      const adminUid = AppState.currentUserId;
      for (const msg of mensajes) {
        const esAdmin = msg.fromUid === adminUid;
        const div = document.createElement('div');
        div.style.cssText = `
          max-width:75%; padding:8px 12px; border-radius:14px;
          ${esAdmin
            ? 'align-self:flex-end; background:var(--accent-blue); color:var(--bg-primary);'
            : 'align-self:flex-start; background:var(--bg-primary); color:var(--text-primary); border:1px solid var(--border-color);'
          }
          word-wrap:break-word;
        `;
        div.textContent = msg.texto;
        
        const time = document.createElement('div');
        time.style.cssText = `
          font-size:10px; margin-top:4px; text-align:right;
          ${esAdmin ? 'color:rgba(255,255,255,0.7);' : 'color:var(--text-secondary);'}
        `;
        const fecha = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : '';
        time.textContent = fecha;
        div.appendChild(time);
        messagesContainer.appendChild(div);
      }
      // Scroll al final
      setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 50);
    }
    modal.appendChild(messagesContainer);

    // Pie fijo: input + botón enviar
    const footer = document.createElement('div');
    footer.style.cssText = `
      display:flex; gap:8px; padding:12px 16px;
      border-top:1px solid var(--border-color);
      background:var(--bg-primary); flex-shrink:0;
      align-items:center;
    `;
    footer.innerHTML = `
      <input type="text" id="conversacionInput" placeholder="Escribe tu respuesta..." style="
        flex:1; margin:0; padding:0 12px; height:44px;
        border-radius:14px; background:var(--bg-secondary);
        border:1px solid var(--border-color); color:var(--text-primary);
        font-size:16px;
      ">
      <button id="conversacionEnviarBtn" class="action-button" style="
        width:auto; padding:0 24px; margin:0; height:44px; border-radius:14px;
        background:var(--accent-blue); color:var(--bg-primary); border:none;
        font-weight:600; cursor:pointer; font-size:16px;
        display:flex; align-items:center; justify-content:center; line-height:normal;
      ">ENVIAR</button>
    `;
    modal.appendChild(footer);

    // Botón cerrar abajo centrado
    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.style.cssText = `
      padding:12px 16px;
      border-top:1px solid var(--border-color);
      background:var(--bg-primary);
      display:flex; justify-content:center;
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'action-button';
    closeBtn.style.cssText = `
      width:auto; padding:0 24px; margin:0; border-radius:14px;
      background:transparent; border:1px solid var(--border-color-light);
      color:var(--text-primary); cursor:pointer; font-size:16px;
      height:44px; display:flex; align-items:center; justify-content:center;
      line-height:normal;
    `;
    closeBtn.textContent = 'CERRAR';
    closeBtn.onclick = () => this.cerrarConversacionSoporte();
    closeButtonContainer.appendChild(closeBtn);
    modal.appendChild(closeButtonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

    // Eventos de envío
    const input = document.getElementById('conversacionInput');
    const sendBtn = document.getElementById('conversacionEnviarBtn');
    const enviar = () => {
      const texto = input.value.trim();
      if (!texto) return;
      this._enviarMensajeSoporte(uid, texto, messagesContainer);
      input.value = '';
    };
    sendBtn.addEventListener('click', enviar);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviar(); });

    this._conversacionAbierta = { uid, messagesContainer };
  },

  async _enviarMensajeSoporte(uid, texto, container) {
    const ok = await Storage.enviarMensajeSoporte(AppState.currentUserId, uid, texto);
    if (ok) {
      const div = document.createElement('div');
      div.style.cssText = `
        max-width:75%; padding:8px 12px; border-radius:14px;
        align-self:flex-end; background:var(--accent-blue); color:var(--bg-primary);
        word-wrap:break-word;
      `;
      div.textContent = texto;
      const time = document.createElement('div');
      time.style.cssText = 'font-size:10px; color:rgba(255,255,255,0.7); margin-top:4px; text-align:right;';
      time.textContent = new Date().toLocaleString();
      div.appendChild(time);
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      
      this.cargarMensajesUsuarios(true);
      Utils.showToast('✅ Mensaje enviado', 'success');
    } else {
      Utils.showToast('Error al enviar mensaje', 'error');
    }
  },

  // Pinta en el modal ABIERTO un mensaje que acaba de llegar del usuario
  // (ver el listener de soporte admin en iniciarListeners), y lo marca
  // como leído al momento -- el admin lo está viendo en directo, no tiene
  // sentido que se quede pendiente hasta que reabra la conversación.
  _pintarMensajeSoporteEnVivo(mensajeId, data) {
    if (!this._conversacionAbierta) return;
    const container = this._conversacionAbierta.messagesContainer;
    if (!container || !document.body.contains(container)) return;

    // El placeholder de "No hay mensajes en esta conversación" (si la
    // conversación estaba vacía) debe desaparecer con el primer mensaje.
    if (container.children.length === 1 && container.textContent.includes('No hay mensajes')) {
      container.innerHTML = '';
    }

    const div = document.createElement('div');
    div.style.cssText = `
      max-width:75%; padding:8px 12px; border-radius:14px;
      align-self:flex-start; background:var(--bg-primary); color:var(--text-primary);
      border:1px solid var(--border-color); word-wrap:break-word;
    `;
    div.textContent = data.texto || '';
    const time = document.createElement('div');
    time.style.cssText = 'font-size:10px; margin-top:4px; text-align:right; color:var(--text-secondary);';
    time.textContent = data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : new Date().toLocaleString();
    div.appendChild(time);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    if (!data.leido) {
      firebaseServices.db.collection('soporteMensajes').doc(mensajeId).update({ leido: true }).catch(() => {});
    }
  },

  cerrarConversacionSoporte() {
    const overlay = document.getElementById('conversacionSoporteOverlay');
    const modal = document.getElementById('conversacionSoporteModal');
    if (modal) { modal.style.transition = 'none'; modal.style.opacity = '0'; }
    if (overlay) {
      overlay.style.transition = 'none'; overlay.style.pointerEvents = 'none'; overlay.style.opacity = '0';
      setTimeout(() => {
        modal?.remove();
        overlay?.remove();
      }, 200);
    }
    this._conversacionAbierta = null;
  },

  // Funciones existentes de eliminación de mensajes (sin cambios)
  async eliminarMensajeSoporte(mensajeId) {
    if (!AppState.isAdmin || !mensajeId) return;
    
    const confirmado = await Utils.confirm('ELIMINAR PARA LOS 2', '¿Eliminar este mensaje permanentemente? Se borrará tanto de tu panel como de la bandeja de soporte del usuario.');
    if (!confirmado) return;

    Utils.showLoading();
    try {
      const doc = await firebaseServices.db.collection('soporteMensajes').doc(mensajeId).get();
      if (!doc.exists) {
        Utils.showToast('El mensaje ya no existe', 'warning');
        Utils.hideLoading();
        return;
      }
      const data = doc.data();
      const fromUid = data.fromUid;
      const toUid = data.toUid;
      const adminUid = await Storage.getAdminUid();

      await firebaseServices.db.collection('soporteMensajes').doc(mensajeId).delete();

      if (fromUid && fromUid !== adminUid) {
        const snapshot = await firebaseServices.db
          .collection('users')
          .doc(fromUid)
          .collection('mensajes')
          .where('timestamp', '==', data.timestamp)
          .where('texto', '==', data.texto)
          .get();
        const batch = firebaseServices.db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      if (toUid && toUid !== adminUid) {
        const snapshot = await firebaseServices.db
          .collection('users')
          .doc(toUid)
          .collection('mensajes')
          .where('timestamp', '==', data.timestamp)
          .where('texto', '==', data.texto)
          .get();
        const batch = firebaseServices.db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      Utils.showToast('✅ Mensaje eliminado', 'success');
      this.cargarMensajesUsuarios(true);
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      Utils.showToast('Error al eliminar mensaje', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async eliminarMensajeSoloAdmin(mensajeId) {
    if (!AppState.isAdmin || !mensajeId) return;
    const confirmado = await Utils.confirm('BORRAR SOLO DE MI PANEL', 'Este mensaje desaparecerá de tu panel de admin, pero seguirá existiendo en la bandeja de soporte del usuario. ¿Continuar?');
    if (!confirmado) return;
    Utils.showLoading();
    try {
      const ok = await Storage.eliminarMensajeSoporteSoloAdmin(mensajeId);
      Utils.showToast(ok ? '✅ Mensaje borrado de tu panel' : 'Error al borrar', ok ? 'success' : 'error');
      this.cargarMensajesUsuarios(true);
    } finally {
      Utils.hideLoading();
    }
  },

  async eliminarBroadcastSoloAdmin(broadcastId) {
    if (!AppState.isAdmin || !broadcastId) return;
    const confirmado = await Utils.confirm('BORRAR SOLO DE MI PANEL', 'Este mensaje desaparecerá de tu panel de admin, pero seguirá existiendo en la bandeja de cada usuario que lo recibió. ¿Continuar?');
    if (!confirmado) return;
    Utils.showLoading();
    try {
      const ok = await Storage.eliminarBroadcastSoloAdmin(broadcastId);
      Utils.showToast(ok ? '✅ Bloque borrado de tu panel' : 'Error al borrar', ok ? 'success' : 'error');
      this.cargarMensajesUsuarios(true);
    } finally {
      Utils.hideLoading();
    }
  },

  async eliminarBroadcastCompleto(broadcastId) {
    if (!AppState.isAdmin || !broadcastId) return;
    const confirmado = await Utils.confirm('BORRAR PARA TODOS', 'Este mensaje se eliminará también de la bandeja de TODOS los usuarios que lo recibieron. Esta acción no se puede deshacer. ¿Continuar?');
    if (!confirmado) return;
    Utils.showLoading();
    try {
      const ok = await Storage.eliminarBroadcastCompleto(broadcastId);
      Utils.showToast(ok ? '✅ Mensaje borrado para todos' : 'Error al borrar', ok ? 'success' : 'error');
      this.cargarMensajesUsuarios(true);
    } finally {
      Utils.hideLoading();
    }
  },

  async enviarMensajeSoporteAdmin(usuarioUid, texto) {
    if (!AppState.isAdmin || !usuarioUid || !texto) return;
    const ok = await Storage.enviarMensajeSoporte(AppState.currentUserId, usuarioUid, texto);
    if (ok) {
      Utils.showToast('✅ Mensaje enviado', 'success');
      this.cargarMensajesUsuarios(true);
    } else {
      Utils.showToast('Error al enviar mensaje', 'error');
    }
  },

  // 🔥 v4.57: el selector de destinatarios del broadcast pasa a ser el mismo
  // patrón que "Generar sesión" (SessionInvites paso 3): un único botón
  // "ELEGIR USUARIOS" (siempre visible, sin radios) que abre un modal con
  // buscador + grupos, reutilizando la MISMA caché de usuarios y la MISMA
  // colección Firestore 'sessionGroups' (SessionInvites._usuariosTodos /
  // _gruposTodos) -- así los grupos creados aquí son exactamente los mismos
  // que ya existen en "Generar sesión" y viceversa, sin duplicar nada.
  // _destinatariosSeleccionados guarda los uids marcados; si al pulsar
  // ENVIAR está vacío, se envía a todos (comportamiento por defecto).
  _destinatariosSeleccionados: new Set(),

  async abrirSelectorDestinatarios() {
    if (!window.SessionInvites) { Utils.showToast('No disponible', 'error'); return; }
    SessionInvites._asegurarEstiloHistorial(); // inyecta riSkeletonPulse/riFadeInUp si no estaban ya

    const modalId = 'broadcastDest';
    document.getElementById(modalId + 'Modal')?.remove();
    document.getElementById(modalId + 'Overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId + 'Overlay';
    overlay.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:60000; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s ease;`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._cerrarSelectorDestinatarios(); });

    const modal = document.createElement('div');
    modal.id = modalId + 'Modal';
    modal.style.cssText = `background:var(--bg-card); border-radius:16px; width:92%; max-width:700px; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:var(--shadow-lg); border:1px solid var(--border-color); font-family:inherit; opacity:0; transition:opacity 0.2s ease;`;

    const usuariosListos = !!SessionInvites._usuariosTodos;
    const gruposListos = !!SessionInvites._gruposTodos;

    modal.innerHTML = `
      <div style="padding:16px 44px; background:var(--bg-primary); border-bottom:1px solid var(--border-color); text-align:center;">
        <span style="font-size:16px; font-weight:600; letter-spacing:2px; color:var(--accent-blue);">👥 ELIGE USUARIOS</span>
        <div style="margin-top:6px;">
          <span id="broadcastDestContador" style="display:inline-block; font-size:12px; font-weight:600; letter-spacing:0.5px; color:var(--gold); background:rgba(192,160,96,0.12); border:1px solid var(--gold); border-radius:20px; padding:3px 14px;">0 elegidos</span>
        </div>
      </div>
      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div style="margin-bottom:16px;">
          <button onclick="Admin._abrirGestionGruposDestino()" style="display:block; width:100%; background:transparent; border:none; padding:4px 0 12px; margin:0; font-family:inherit; font-size:16px; font-weight:600; letter-spacing:1px; color:var(--text-primary); text-align:center; cursor:pointer;">GESTIONAR GRUPOS</button>
          <div id="broadcastDestGruposList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(88px, 1fr)); gap:10px;">${gruposListos ? '' : SessionInvites._skeletonGrupos()}</div>
        </div>
        <label style="display:block; text-align:center; font-size:12px; color:var(--text-secondary); letter-spacing:1px; margin-bottom:6px;">🔎 BUSCA Y MARCA A QUIÉN ENVIAR</label>
        <input id="broadcastDestBuscar" placeholder="BUSCAR USUARIO" style="width:100%; margin-bottom:12px; text-align:center;">
        <div id="broadcastDestList">${usuariosListos ? '' : SessionInvites._skeletonUsuarios()}</div>
      </div>
      <div style="padding:16px 20px; background:var(--bg-primary); border-top:1px solid var(--border-color); display:flex; justify-content:center;">
        <button onclick="Admin._cerrarSelectorDestinatarios()" class="action-button" style="width:auto; padding:0 32px; margin:0;">LISTO</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

    this._actualizarContadorDestinatarios();

    if (usuariosListos) {
      this._renderizarListaDestinatarios(SessionInvites._usuariosTodos);
    } else {
      SessionInvites._precargarUsuarios().then(() => {
        this._renderizarListaDestinatarios(SessionInvites._usuariosTodos, true);
      });
    }

    if (gruposListos) {
      this._renderizarGruposDestino();
    } else {
      SessionInvites._precargarGrupos().then(() => this._renderizarGruposDestino(true));
    }

    document.getElementById('broadcastDestBuscar')?.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const todos = SessionInvites._usuariosTodos || [];
      const filtrados = !term ? todos : todos.filter(u =>
        (u.username || '').toLowerCase().includes(term)
      );
      this._renderizarListaDestinatarios(filtrados);
    });
  },

  // Mismo diseño de tarjeta (avatar/inicial + nombre + email + check) que
  // usa SessionInvites._renderizarListaUsuarios en "Generar sesión".
  _renderizarListaDestinatarios(usuarios, animar = false) {
    const container = document.getElementById('broadcastDestList');
    if (!container) return;
    if (!usuarios.length) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Sin resultados</p>';
      return;
    }
    container.innerHTML = usuarios.map((u, idx) => {
      const marcado = this._destinatariosSeleccionados.has(u.uid);
      const nombreMostrado = Utils.escapeHTML(Utils.capitalizeUsername ? Utils.capitalizeUsername(u.username) : (u.username || '?'));
      const inicial = Utils.escapeHTML(((u.username || '?').trim().charAt(0) || '?').toUpperCase());
      const photoURL = u.profile?.photoURL || null;
      const avatar = photoURL
        ? `<img src="${Utils.escapeHTML(photoURL)}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; border:2px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};">`
        : `<div style="
            width:34px; height:34px; border-radius:50%; flex-shrink:0;
            background:${marcado ? 'var(--gold)' : 'var(--bg-primary)'};
            border:1px solid ${marcado ? 'var(--gold)' : 'var(--border-color)'};
            color:${marcado ? '#000' : 'var(--text-secondary)'};
            display:flex; align-items:center; justify-content:center;
            font-weight:600; font-size:14px;
          ">${inicial}</div>`;
      const animStyle = animar ? `animation:riFadeInUp 0.3s ease both; animation-delay:${(Math.min(idx, 9) * 0.03).toFixed(2)}s;` : '';
      return `
        <div onclick="Admin._toggleDestinatario('${u.uid}')" style="
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

  _toggleDestinatario(uid) {
    if (this._destinatariosSeleccionados.has(uid)) this._destinatariosSeleccionados.delete(uid);
    else this._destinatariosSeleccionados.add(uid);
    const term = document.getElementById('broadcastDestBuscar')?.value.trim().toLowerCase() || '';
    const todos = SessionInvites._usuariosTodos || [];
    const filtrados = !term ? todos : todos.filter(u =>
      (u.username || '').toLowerCase().includes(term)
    );
    this._renderizarListaDestinatarios(filtrados);
    this._renderizarGruposDestino();
    this._actualizarContadorDestinatarios();
  },

  // Tarjetas de grupo cuadradas, idénticas a SessionInvites._renderizarGrupos,
  // leyendo de SessionInvites._gruposTodos (misma colección 'sessionGroups').
  // Pulsar un grupo marca/desmarca de golpe a todos sus miembros.
  _renderizarGruposDestino(animar = false) {
    const cont = document.getElementById('broadcastDestGruposList');
    if (!cont) return;
    const grupos = SessionInvites._gruposTodos || [];
    const todosUsuarios = SessionInvites._usuariosTodos || [];
    if (grupos.length === 0) {
      cont.innerHTML = '<span style="font-size:12px; color:var(--text-secondary);">Aún no tienes grupos creados. Pulsa "Gestionar" para crear el primero.</span>';
      return;
    }
    cont.innerHTML = grupos.map((g, idx) => {
      const miembrosValidos = (g.members || []).filter(uid => todosUsuarios.some(u => u.uid === uid));
      const todosMarcados = miembrosValidos.length > 0 && miembrosValidos.every(uid => this._destinatariosSeleccionados.has(uid));
      const animStyle = animar ? `animation:riFadeInUp 0.3s ease both; animation-delay:${(idx * 0.05).toFixed(2)}s;` : '';
      return `
        <div onclick="Admin._toggleGrupoDestino('${g.id}')" style="
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

  _toggleGrupoDestino(id) {
    const grupo = (SessionInvites._gruposTodos || []).find(g => g.id === id);
    if (!grupo) return;
    const todosUsuarios = SessionInvites._usuariosTodos || [];
    const miembrosValidos = (grupo.members || []).filter(uid => todosUsuarios.some(u => u.uid === uid));
    const todosMarcados = miembrosValidos.length > 0 && miembrosValidos.every(uid => this._destinatariosSeleccionados.has(uid));
    if (todosMarcados) miembrosValidos.forEach(uid => this._destinatariosSeleccionados.delete(uid));
    else miembrosValidos.forEach(uid => this._destinatariosSeleccionados.add(uid));

    const term = document.getElementById('broadcastDestBuscar')?.value.trim().toLowerCase() || '';
    const filtrados = !term ? todosUsuarios : todosUsuarios.filter(u =>
      (u.username || '').toLowerCase().includes(term)
    );
    this._renderizarListaDestinatarios(filtrados);
    this._renderizarGruposDestino();
    this._actualizarContadorDestinatarios();
  },

  // Abre el MISMO modal de "Gestionar grupos" que usa "Generar sesión"
  // (crear/editar/eliminar sobre 'sessionGroups'): son literalmente los
  // mismos grupos en ambos sitios, no una copia. Un MutationObserver detecta
  // cuándo se cierra ese modal para refrescar aquí la rejilla de grupos con
  // los cambios (SessionInvites solo repinta su propia lista, con otro id).
  _abrirGestionGruposDestino() {
    SessionInvites._abrirGestionGrupos();
    if (this._obsGruposDestino) { try { this._obsGruposDestino.disconnect(); } catch(e) {} }
    this._obsGruposDestino = new MutationObserver(() => {
      if (!document.getElementById('sessGroupsModal')) {
        this._obsGruposDestino.disconnect();
        this._obsGruposDestino = null;
        this._renderizarGruposDestino();
      }
    });
    this._obsGruposDestino.observe(document.body, { childList: true });
  },

  _actualizarContadorDestinatarios() {
    const n = this._destinatariosSeleccionados.size;
    const chip = document.getElementById('broadcastDestContador');
    if (chip) chip.textContent = `${n} elegido${n === 1 ? '' : 's'}`;
    this._actualizarBotonEnvioBroadcast();
  },

  // Refleja la selección actual en el botón "ELEGIR USUARIOS (N)" y cambia
  // "ENVIAR A TODOS" por "ENVIAR A SELECCIONADOS (N)" en cuanto hay alguien
  // marcado; con la selección vacía, vuelve a "ENVIAR A TODOS".
  _actualizarBotonEnvioBroadcast() {
    const n = this._destinatariosSeleccionados.size;
    const countSpan = document.getElementById('broadcastCountElegidos');
    if (countSpan) countSpan.textContent = n;
    const enviarBtn = document.getElementById('broadcastEnviarBtn');
    if (enviarBtn) {
      enviarBtn.textContent = n > 0 ? `📢 ENVIAR A SELECCIONADOS (${n})` : '📢 ENVIAR A TODOS';
    }
  },

  _cerrarSelectorDestinatarios() {
    const modal = document.getElementById('broadcastDestModal');
    const overlay = document.getElementById('broadcastDestOverlay');
    if (modal) { modal.style.transition = 'none'; modal.style.opacity = '0'; }
    if (overlay) {
      overlay.style.transition = 'none'; overlay.style.pointerEvents = 'none'; overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
  },

  async enviarMensajeATodos() {
    if (!AppState.isAdmin) return;
    const broadcastEl = document.getElementById('adminBroadcastText');
    const texto = broadcastEl ? broadcastEl.value.trim() : '';
    if (!texto) { Utils.showToast('Escribe un mensaje', 'warning'); return; }

    // Sin selección -> se envía a todos (comportamiento por defecto).
    let destinatarios = Array.from(this._destinatariosSeleccionados);
    const aElegidos = destinatarios.length > 0;
    const mensajeConfirm = aElegidos
      ? `¿Enviar este mensaje a ${destinatarios.length} usuario(s) elegido(s)?`
      : '¿Enviar este mensaje a TODOS los usuarios? (puede tardar unos segundos)';

    const confirmado = await Utils.confirm(aElegidos ? 'ENVÍO' : 'ENVÍO MASIVO', mensajeConfirm);
    if (!confirmado) return;

    Utils.showLoading();
    try {
      if (!aElegidos) {
        const snapshot = await firebaseServices.db.collection('users').get();
        destinatarios = snapshot.docs.map(doc => doc.id);
      }
      const broadcastId = firebaseServices.utils.createId();
      let enviados = 0, errores = 0;

      for (const uid of destinatarios) {
        try {
          await Storage.enviarMensajeSoporte(AppState.currentUserId, uid, texto, broadcastId);
          enviados++;
        } catch (e) {
          console.error(`Error enviando a ${uid}:`, e);
          errores++;
        }
      }
      Utils.showToast(`✅ Mensajes enviados: ${enviados} correctos, ${errores} errores`, errores === 0 ? 'success' : 'warning');
      if (broadcastEl) broadcastEl.value = '';
      this._destinatariosSeleccionados.clear();
      this._actualizarBotonEnvioBroadcast();
      this.cargarMensajesUsuarios(true);
    } catch (error) { 
      console.error('Error en envío:', error); 
      Utils.showToast('Error al enviar mensajes: ' + error.message, 'error'); 
    } finally { 
      Utils.hideLoading(); 
    }
  }
};

window.Admin = Admin;

// ==================== MÓDULO UI ====================
const UI = {
  consejos: [
    "La constancia vence al talento cuando el talento no entrena.",
    "El descanso no es pérdida de forma, es cuando el cuerpo se reconstruye.",
    "Confía en el proceso, no en la prisa.",
    "La Z2 (aeróbica) construye la base de todo corredor.",
    "Incluye fuerza 2 veces por semana; es el seguro de vida de tus articulaciones.",
    "Aumenta el kilometraje semanal no más de un 10% para evitar lesiones.",
    "El umbral de lactato es el mejor predictor de tu rendimiento en carrera.",
    "Las tiradas largas se hacen a ritmo de conversación, no de competición.",
    "Los días de series, la calidad importa más que la cantidad.",
    "El calentamiento y la vuelta a la calma no son opcionales, son parte del entreno.",
    "Dormir 8 horas es tan importante como la sesión de calidad.",
    "La hidratación empieza días antes de la carrera, no en el avituallamiento.",
    "Escucha a tu cuerpo: el dolor punzante es señal de parar, las agujetas son normales.",
    "Un masaje con rodillo de espuma puede ser tu mejor amigo (o tu peor enemigo, pero útil).",
    "Alterna zapatillas para dar tiempo a que la espuma recupere su forma.",
    "La nutrición post-entreno (ventana metabólica) acelera la recuperación.",
    "Divide la carrera en segmentos pequeños; el cerebro gestiona mejor metas cortas.",
    "Visualiza la carrera antes de correrla; el cerebro no distingue lo imaginado de lo real.",
    "Crea un mantra mental para los momentos duros. Repítelo.",
    "No salgas más rápido de lo planeado; el subidón inicial pasa factura al final.",
    "Cada entrenamiento tiene un propósito. Si no sabes cuál es, pregúntate por qué lo haces.",
    "Compara tu yo de hoy con tu yo de ayer, no con el de los demás.",
    "Los geles no se prueban el día de la carrera; entrena también tu estómago.",
    "El café 45 minutos antes de correr puede mejorar tu rendimiento (si lo toleras).",
    "No experimentes con comidas nuevas la noche antes de una competición.",
    "La cadencia ideal ronda los 180 pasos por minuto; contar durante 30 segundos y multiplicar por dos.",
    "Correr descalzo sobre césped de vez en cuando fortalece la musculatura del pie.",
    "Revisa tu pisada en una tienda especializada; unas zapatillas inadecuadas pueden causar lesiones.",
    "El éxito no se construye con un solo entrenamiento, sino con la suma de todos ellos."
  ],

  consejoIndex: 0,
  dailyInterval: null,
  consejoInterval: null,
  historialCargando: false,

  updateTip(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = '<span>' + this.consejos[this.consejoIndex] + '</span><small>pulsa para otro</small>';
      this.consejoIndex = (this.consejoIndex + 1) % this.consejos.length;
    }
  },

  changeDailyTip() { this.updateTip('dailyTip'); },
  changeConsejo() { this.updateTip('curiosity'); },

  startConsejoAutoChange() {
    if(this.dailyInterval) clearInterval(this.dailyInterval);
    if(this.consejoInterval) clearInterval(this.consejoInterval);
    this.dailyInterval = setInterval(() => { if(document.getElementById("loginPage")?.style.display !== "none") this.updateTip('dailyTip'); }, 8000);
    this.consejoInterval = setInterval(() => { if(document.getElementById("mainContent")?.style.display !== "none") this.updateTip('curiosity'); }, 8000);
  },

  marcarCampoTocado(c) {
    if (!AppState) return;
    AppState.camposTocados[c] = true;
    this.validarCampo(c);
    this.validarTodo();
  },

  validarCampo(c) {
    const el = document.getElementById(c);
    const err = document.getElementById(c + 'Error');
    if (!el || !err) return true;
    if(c === 'name') return true;
    if(!AppState || !AppState.camposTocados[c]) {
      err.classList.remove('visible');
      el.classList.remove('error');
      return true;
    }
    let ok = true;
    if(c === 'age') {
      const a = parseInt(el.value);
      ok = !isNaN(a) && a >= 14 && a <= 85;
    }
    else if(c === 'time') {
      const t = Utils.parseTime(el.value);
      ok = !isNaN(t) && t >= 5 && t <= 20;
    }
    if(!ok) {
      err.innerText = c === 'age' ? 'Edad 14-85' : 'Tiempo de tus 2 km en MM:SS (ej. 08:30)';
      err.classList.add('visible');
      el.classList.add('error');
    }
    else {
      err.classList.remove('visible');
      el.classList.remove('error');
    }
    return ok;
  },

  validarTodo() {
    const a = this.validarCampo('age'), t = this.validarCampo('time');
    const btn = document.getElementById("calcBtn");
    if(btn) btn.disabled = !(a && t);
    AppState.actualizarBotonCalcular();
  },

  async switchTab(tab) {
    if (typeof window.forzarScrollTop === 'function') window.forzarScrollTop();
    else window.scrollTo(0, 0);

    if (window.Chat && window.Chat.closeChat) {
      window.Chat.closeChat();
    }

    // 🔥 v4.63: ya NO se destruye el listener del muro al cambiar de
    // pestaña. Antes había aquí un `if (tab !== 'muro' && window.Wall) {
    // Wall.detenerListener(); }` que forzaba a reabrir el listener cada
    // vez que se volvía a la pestaña Muro -- con lo que Firestore pagaba
    // una lectura inicial de 20 documentos CADA VEZ, y además había que
    // esperar un nuevo snapshot antes de pintar. Ahora el listener se
    // mantiene abierto toda la sesión (se cierra solo en logout, ver
    // setCurrentUser/detenerListeners), y Wall.init() ya sabe si tiene
    // que pintar o no tocar nada.

    if (tab !== 'admin' && tab !== 'perfil' && window.Admin) {
      Admin.detenerEscuchaSesionesHoy();
    }

    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    for(let b of tabs) {
      if(b.textContent.includes(tab === 'entreno' ? 'ENTRENO' : 
                               tab === 'plan' ? 'PLAN' : 
                               tab === 'historial' ? 'HISTORIAL' : 
                               tab === 'soporte' ? 'SOPORTE' : 
                               tab === 'perfil' ? 'PERFIL' : 
                               tab === 'amigos' ? 'AMIGOS' : 
                               tab === 'muro' ? 'MURO' : 'ADMIN')) { 
        b.classList.add('active'); 
        break; 
      }
    }

    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');

    try {
      if(tab === 'historial') {
        if (AppState) AppState.resetHistorialPagination();
        this.cargarHistorialCompleto(true).catch(e => console.warn('Error cargando historial:', e));
      }
      if(tab === 'plan') {
        this.cargarHistorialPlanes().catch(e => console.warn('Error cargando planes:', e));
        if (!AppState.planActualId && window.PlanGenerator) {
          PlanGenerator.mostrarUltimoPlanGuardado(true).catch(e => console.warn('Error auto-cargando último plan:', e));
        }
      }
      if(tab === 'soporte') { 
        this.cargarSoporteUsuario().catch(e => console.warn('Error cargando soporte:', e));
      }
      if(tab === 'perfil') {
        if (window.Profile) {
          Profile.cargarPerfil(false).catch(e => console.warn('Error cargando perfil:', e));
          setTimeout(() => {
            if (Profile._vincularToqueTodasLasEntradas) Profile._vincularToqueTodasLasEntradas();
          }, 50);
        }
        if (AppState.isAdmin) {
          // 🔥 FIX: antes este reset iba dentro de un setTimeout(100ms). Si
          // el admin había dejado abierto "Generar sesión" o "Soporte"
          // dentro de Administración, al volver a pulsar Configuración se
          // veía primero esa subpestaña vieja (porque su estado seguía tal
          // cual en el DOM) y justo después un parpadeo visible saltando a
          // "Panel de control". Al llamarlo aquí mismo, en el mismo tick en
          // que se activa la pestaña Perfil, el navegador solo llega a
          // pintar el estado final: entra siempre directo en Panel de
          // control, sin pasar visualmente por ningún otro subpanel.
          if (document.getElementById('soporte-admin-panel')) {
            Admin.cambiarSubtab('control');
          }
        }
      }
      if(tab === 'amigos') {
        if (window.Friends) {
          Friends.actualizarBadgeSolicitudes().catch(e => console.warn('Error actualizando badge:', e));
          const activeAmigosTab = document.querySelector('.amigos-tab.active');
          if (activeAmigosTab) {
            const tabText = activeAmigosTab.textContent.toLowerCase();
            if (tabText.includes('buscar')) {
              // 🔥 FIX: esto comprobaba Friends.todosUsuariosPagination.lastDoc,
              // que ya no existe desde que Explorar/Buscar usa _usuariosState
              // (friends.js v3.52) -- lanzaba un TypeError cada vez que se
              // volvía a esta pestaña con "Buscar" activa, y el catch de más
              // abajo lo tragaba en silencio. cargarTodosUsuarios(false) ya
              // decide solo si hace falta inicializar de cero (primera vez)
              // o si puede reutilizar el estado/caché que ya había (ver
              // friends.js v3.53: reabrir esta pantalla no cuesta lecturas
              // nuevas de Firestore salvo que de verdad haya cambiado algo).
              Friends.cargarTodosUsuarios(false).catch(e => console.warn('Error cargando usuarios:', e));
            } else if (tabText.includes('solicitudes')) {
              Friends.cargarSolicitudesRecibidas().catch(e => console.warn('Error cargando solicitudes:', e));
            } else if (tabText.includes('mis amigos')) {
              Friends.cargarListaAmigos().catch(e => console.warn('Error cargando amigos:', e));
            }
          } else {
            Friends.cargarTodosUsuarios(true).catch(e => console.warn('Error cargando usuarios:', e));
          }
        }
      }
      // 🔥 v4.68: FIX «la sesión recién marcada no aparece en el Muro hasta cambiar a Amigos y volver». El Muro es una
      // SUBPESTAÑA de Comunidad: si se marca una sesión estando en otra pestaña, el listener en vivo de Wall recibe la
      // publicación pero NO la pinta (el contenedor está oculto) y deja _renderPendiente = true. Wall.init() es quien
      // lo pinta, pero solo se llamaba al tocar el botón de subpestaña «Muro», nunca al entrar en Comunidad con el Muro
      // ya seleccionado. Ahora también se llama aquí (init() es idempotente y no cuesta lecturas).
      if (tab === 'comunidad' && window.Wall && document.getElementById('subtab-muro')?.classList.contains('active')) {
        Wall.init();
      }
      if(tab === 'muro') {
        if (window.Wall) {
          // 🔥 v4.63: ya NO se destruye el listener antes de llamar a
          // init(). init() es idempotente: si el muro ya está pintado (por
          // la precarga al iniciar sesión), no toca el DOM ni pide nada a
          // Firestore; si aún no lo estuviera (precarga falló o tardó más
          // de la cuenta), deja que el listener en vivo pinte la lista.
          Wall.init();
        }
      }
      if(tab === 'admin' && AppState && AppState.isAdmin) {
        Admin.cargarUsuarios(true).catch(e => console.warn('Error cargando usuarios admin:', e));
        Admin.cargarEstadisticas().catch(e => console.warn('Error cargando estadísticas:', e));
      }
    } catch (error) {
      console.error(`Error cargando pestaña ${tab}:`, error);
      Utils.showToast('Error al cargar contenido', 'error');
    }

    this.guardarEstado();
  },

  // ============================================================
  // SOPORTE PARA USUARIO NORMAL: una única tarjeta de conversación con
  // el administrador (mismo diseño visual que usa el admin para cada
  // usuario), que al pulsarla abre el chat completo (mensajes propios y
  // del admin juntos, en orden) en vez de dos listas separadas de
  // "recibidos"/"enviados".
  // ============================================================

  _datosAdminSoporteCache: null,

  async _datosAdminSoporte() {
    if (this._datosAdminSoporteCache) return this._datosAdminSoporteCache;
    try {
      const adminUid = await Storage.getAdminUid();
      const admin = adminUid ? await Storage.getUser(adminUid) : null;
      this._datosAdminSoporteCache = {
        uid: adminUid || null,
        username: admin?.username ? Utils.capitalizeUsername(admin.username) : 'Soporte',
        photoURL: admin?.profile?.photoURL || null
      };
    } catch (e) {
      this._datosAdminSoporteCache = { uid: null, username: 'Soporte', photoURL: null };
    }
    return this._datosAdminSoporteCache;
  },

  async cargarSoporteUsuario(intento = 0) {
    const container = document.getElementById('soporteUsuarioCardContainer');
    if (!container) return;

    // Si la pestaña se abre justo cuando la app todavía está resolviendo
    // el login (p.ej. al volver de segundo plano), currentUserId puede
    // no estar listo todavía. Antes esto dejaba la tarjeta en blanco sin
    // más; ahora se reintenta un par de veces antes de rendirse.
    if (!AppState.currentUserId) {
      if (intento < 5) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-secondary);">Cargando…</p>';
        setTimeout(() => this.cargarSoporteUsuario(intento + 1), 400);
      } else {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--zone-5);">No se pudo identificar tu sesión. Vuelve a entrar en Soporte.</p>';
      }
      return;
    }

    try {
      const [mensajes, adminInfo] = await Promise.all([
        Storage.getMensajesSoporteUsuario(AppState.currentUserId),
        this._datosAdminSoporte()
      ]);

      let ultimoMensaje = null;
      let noLeidos = 0;
      for (const msg of mensajes) {
        if (!ultimoMensaje || (msg.timestamp?.toMillis?.() || 0) > (ultimoMensaje.timestamp?.toMillis?.() || 0)) {
          ultimoMensaje = msg;
        }
        if (!msg.leido && msg.toUid === AppState.currentUserId) noLeidos++;
      }

      this._renderizarTarjetaSoporteUsuario({
        uid: adminInfo.uid,
        username: adminInfo.username,
        photoURL: adminInfo.photoURL,
        ultimoMensaje,
        noLeidos,
        hayConversacion: mensajes.length > 0
      }, container);
    } catch (error) {
      console.error('Error cargando soporte de usuario:', error);
      if (document.getElementById('soporteUsuarioCardContainer')) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--zone-5);">Error al cargar soporte. Sal y vuelve a entrar en esta pestaña.</p>';
      }
    }
  },

  // Misma tarjeta visual que usa Admin._renderizarListaSoporte (foto+
  // nombre centrados verticalmente a la izquierda, preview del último
  // mensaje centrado en la parte baja del bloque central, fecha/aviso a
  // la derecha, tarjeta entera pintada del color de notificación si hay
  // mensajes no leídos) -- aquí para una sola tarjeta fija: la
  // conversación con el administrador.
  //
  // SIN PAPELERA: a diferencia de la lista del admin, esta tarjeta no
  // lleva botón de eliminar. La conversación es con soporte (el admin),
  // así que el usuario nunca debe poder borrarla por su cuenta.
  _renderizarTarjetaSoporteUsuario(datos, container) {
    const fecha = datos.ultimoMensaje?.timestamp?.toDate ? datos.ultimoMensaje.timestamp.toDate().toLocaleString() : '—';
    const textoPreview = datos.hayConversacion
      ? (datos.ultimoMensaje?.texto ? Utils.escapeHTML(datos.ultimoMensaje.texto.substring(0, 60)) : '')
      : 'Toca para escribirnos';
    const nombre = Utils.escapeHTML(datos.username);

    const tieneNoLeidos = datos.noLeidos > 0;
    const cardBg = tieneNoLeidos ? 'var(--notification-color)' : 'var(--bg-secondary)';
    const cardBorder = tieneNoLeidos ? 'var(--notification-color)' : 'var(--border-color)';
    const colorNombre = tieneNoLeidos ? '#241505' : 'var(--accent-yellow)';
    const colorSecundario = tieneNoLeidos ? 'rgba(0,0,0,0.65)' : 'var(--text-secondary)';
    const avatarPlaceholderBg = tieneNoLeidos ? 'rgba(0,0,0,0.18)' : 'var(--bg-secondary)';

    const avatar = datos.photoURL ? `<img src="${Utils.escapeHTML(datos.photoURL)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover;">` : `<div style="width:46px;height:46px;border-radius:50%;background:${avatarPlaceholderBg};display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>`;
    const badgeNoLeidos = tieneNoLeidos ? `<span style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;white-space:nowrap;">${datos.noLeidos} nuevo${datos.noLeidos > 1 ? 's' : ''}</span>` : '';

    container.innerHTML = `
      <div id="tarjetaSoporteUsuario" style="display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto auto auto;column-gap:8px;row-gap:4px;padding:12px;background:${cardBg};border:1px solid ${cardBorder};border-radius:14px;cursor:pointer;transition:background 0.2s, border-color 0.2s;">
        <div style="grid-column:1;grid-row:1 / 4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">
          ${avatar}
          <span style="font-weight:600;font-size:14px;color:${colorNombre};text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nombre}</span>
        </div>
        <span style="grid-column:3;grid-row:1;font-size:12px;color:${colorSecundario};align-self:start;justify-self:end;white-space:nowrap;">${datos.hayConversacion ? fecha : ''}</span>
        <div style="grid-column:3;grid-row:2;align-self:center;justify-self:end;">${badgeNoLeidos}</div>
        <div style="grid-column:2;grid-row:3;align-self:end;justify-self:center;font-size:14px;color:${colorSecundario};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;max-width:100%;font-style:${datos.hayConversacion ? 'normal' : 'italic'};">${textoPreview}</div>
      </div>
    `;

    document.getElementById('tarjetaSoporteUsuario')?.addEventListener('click', () => this.abrirChatSoporteUsuario());
  },

  _chatSoporteAbierto: false,

  async abrirChatSoporteUsuario() {
    if (!AppState.currentUserId) return;
    Utils.showLoading();
    try {
      const adminInfo = await this._datosAdminSoporte();
      const mensajes = (await Storage.getMensajesSoporteUsuario(AppState.currentUserId))
        .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));

      // Marcar como leídos los mensajes que nos mandó el admin
      const noLeidos = mensajes.filter(msg => !msg.leido && msg.toUid === AppState.currentUserId);
      for (const msg of noLeidos) {
        try {
          await firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('mensajes').doc(msg.id).update({ leido: true });
        } catch (e) {
          console.warn('Error marcando mensaje de soporte como leído:', e);
        }
      }

      this._mostrarModalChatSoporteUsuario(mensajes, adminInfo);
      this._chatSoporteAbierto = true;

      if (noLeidos.length > 0) {
        this.actualizarBadgeMensajes();
        this.cargarSoporteUsuario();
      }
    } catch (error) {
      console.error('Error abriendo chat de soporte:', error);
      Utils.showToast('Error al cargar la conversación', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  // Refresca en vivo los mensajes del chat de soporte cuando ya está
  // abierto (p.ej. ha llegado una respuesta nueva del admin mientras el
  // usuario tenía el modal abierto), sin volver a abrir el modal ni
  // mostrar la animación de carga.
  async _actualizarChatSoporteUsuarioEnVivo() {
    if (!this._chatSoporteAbierto || !AppState.currentUserId) return;
    const container = document.getElementById('chatSoporteUsuarioMensajes');
    if (!container) { this._chatSoporteAbierto = false; return; }

    const mensajes = (await Storage.getMensajesSoporteUsuario(AppState.currentUserId))
      .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));

    const noLeidos = mensajes.filter(msg => !msg.leido && msg.toUid === AppState.currentUserId);
    for (const msg of noLeidos) {
      try {
        await firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('mensajes').doc(msg.id).update({ leido: true });
      } catch (e) {
        console.warn('Error marcando mensaje de soporte como leído:', e);
      }
    }

    container.innerHTML = '';
    if (mensajes.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Todavía no hay mensajes. Escríbenos tu consulta aquí abajo.</p>';
    } else {
      for (const msg of mensajes) {
        container.appendChild(this._crearBurbujaChatSoporteUsuario(msg));
      }
      container.scrollTop = container.scrollHeight;
    }

    if (noLeidos.length > 0) {
      this.actualizarBadgeMensajes();
      this.cargarSoporteUsuario();
    }
  },

  _mostrarModalChatSoporteUsuario(mensajes, adminInfo) {
    document.getElementById('chatSoporteUsuarioModal')?.remove();
    document.getElementById('chatSoporteUsuarioOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'chatSoporteUsuarioOverlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      z-index:20000; display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.2s ease;
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.cerrarChatSoporteUsuario(); });

    const modal = document.createElement('div');
    modal.id = 'chatSoporteUsuarioModal';
    modal.style.cssText = `
      background:var(--bg-card); border:1px solid var(--border-color);
      border-radius:16px; max-width:600px; width:90%;
      height:65vh; max-height:80vh;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:var(--shadow-lg); opacity:0; transition:opacity 0.2s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display:flex; justify-content:center; align-items:center;
      padding:16px 20px; border-bottom:1px solid var(--border-color);
      background:var(--bg-primary); flex-shrink:0;
    `;
    header.innerHTML = `<span style="font-size:16px; font-weight:600; color:var(--accent-yellow); text-align:center;">💬 Soporte con ${Utils.escapeHTML(adminInfo.username)}</span>`;
    modal.appendChild(header);

    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'chatSoporteUsuarioMensajes';
    messagesContainer.style.cssText = `
      flex:1; overflow-y:auto; padding:16px;
      display:flex; flex-direction:column; gap:8px;
      background:var(--bg-secondary);
      min-height:0;
    `;

    if (mensajes.length === 0) {
      messagesContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Todavía no hay mensajes. Escríbenos tu consulta aquí abajo.</p>';
    } else {
      for (const msg of mensajes) {
        messagesContainer.appendChild(this._crearBurbujaChatSoporteUsuario(msg));
      }
      setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 50);
    }
    modal.appendChild(messagesContainer);

    const footer = document.createElement('div');
    footer.style.cssText = `
      display:flex; gap:8px; padding:12px 16px;
      border-top:1px solid var(--border-color);
      background:var(--bg-primary); flex-shrink:0;
      align-items:center;
    `;
    footer.innerHTML = `
      <input type="text" id="chatSoporteUsuarioInput" placeholder="Escribe tu mensaje..." style="
        flex:1; margin:0; padding:0 12px; height:44px;
        border-radius:14px; background:var(--bg-secondary);
        border:1px solid var(--border-color); color:var(--text-primary);
        font-size:16px;
      ">
      <button id="chatSoporteUsuarioEnviarBtn" class="action-button" style="
        width:auto; padding:0 24px; margin:0; height:44px; border-radius:14px;
        background:var(--accent-blue); color:var(--bg-primary); border:none;
        font-weight:600; cursor:pointer; font-size:16px;
        display:flex; align-items:center; justify-content:center; line-height:normal;
      ">ENVIAR</button>
    `;
    modal.appendChild(footer);

    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.style.cssText = `
      padding:12px 16px; border-top:1px solid var(--border-color);
      background:var(--bg-primary); display:flex; justify-content:center;
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'action-button';
    closeBtn.style.cssText = `
      width:auto; padding:0 24px; margin:0; border-radius:14px;
      background:transparent; border:1px solid var(--border-color-light);
      color:var(--text-primary); cursor:pointer; font-size:16px;
      height:44px; display:flex; align-items:center; justify-content:center;
      line-height:normal;
    `;
    closeBtn.textContent = 'CERRAR';
    closeBtn.onclick = () => this.cerrarChatSoporteUsuario();
    closeButtonContainer.appendChild(closeBtn);
    modal.appendChild(closeButtonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

    const input = document.getElementById('chatSoporteUsuarioInput');
    const sendBtn = document.getElementById('chatSoporteUsuarioEnviarBtn');
    const enviar = () => {
      const texto = input.value.trim();
      if (!texto || !adminInfo.uid) return;
      this._enviarMensajeChatSoporteUsuario(adminInfo.uid, texto, messagesContainer);
      input.value = '';
    };
    sendBtn.addEventListener('click', enviar);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviar(); });
  },

  _crearBurbujaChatSoporteUsuario(msg) {
    const esMio = msg.fromUid === AppState.currentUserId;
    const div = document.createElement('div');
    div.style.cssText = `
      max-width:75%; padding:8px 12px; border-radius:14px;
      ${esMio
        ? 'align-self:flex-end; background:var(--accent-blue); color:var(--bg-primary);'
        : 'align-self:flex-start; background:var(--bg-primary); color:var(--text-primary); border:1px solid var(--border-color);'
      }
      word-wrap:break-word;
    `;
    div.textContent = msg.texto;
    const time = document.createElement('div');
    time.style.cssText = `
      font-size:10px; margin-top:4px; text-align:right;
      ${esMio ? 'color:rgba(255,255,255,0.7);' : 'color:var(--text-secondary);'}
    `;
    time.textContent = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : (msg.fecha || '');
    div.appendChild(time);
    return div;
  },

  async _enviarMensajeChatSoporteUsuario(adminUid, texto, container) {
    const ok = await Storage.enviarMensajeSoporte(AppState.currentUserId, adminUid, texto);
    if (ok) {
      const bubble = this._crearBurbujaChatSoporteUsuario({ fromUid: AppState.currentUserId, texto, timestamp: null, fecha: new Date().toLocaleString() });
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
      this.cargarSoporteUsuario();
      Utils.showToast('✅ Mensaje enviado', 'success');
    } else {
      Utils.showToast('Error al enviar mensaje', 'error');
    }
  },

  cerrarChatSoporteUsuario() {
    const overlay = document.getElementById('chatSoporteUsuarioOverlay');
    const modal = document.getElementById('chatSoporteUsuarioModal');
    if (modal) { modal.style.transition = 'none'; modal.style.opacity = '0'; }
    if (overlay) {
      overlay.style.transition = 'none'; overlay.style.pointerEvents = 'none'; overlay.style.opacity = '0';
      setTimeout(() => { modal?.remove(); overlay?.remove(); }, 200);
    }
    this._chatSoporteAbierto = false;
  },

  actualizarBadgeMensajes() {
    const badge = document.getElementById('soporteBadge');
    if (badge) {
      const count = AppState.mensajesNoLeidos || 0;
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    const tab = document.querySelector('.subtab-button[data-subtab="perfil-soporte"]');
    if (tab) {
      if (AppState.mensajesNoLeidos > 0) {
        tab.classList.add('soporte-unread');
      } else {
        tab.classList.remove('soporte-unread');
      }
    }
  },

  cerrarPlan() {
    const calendario = document.getElementById("calendarioEntreno");
    const cuestionario = document.getElementById("cuestionarioEntreno");
    if (calendario) calendario.style.display = "none";
    if (cuestionario) cuestionario.style.display = "block";
    if (AppState) AppState.limpiarDatosPlan();
    this.guardarEstado();
  },

  initDiasCheckboxes() {
    const c = document.getElementById('diasSemanaContainer');
    if (!c) return;
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    let h = '';
    for(let i = 0; i < 7; i++) {
      const n = i + 1;
      const checked = (n <= 5) ? 'checked' : '';
      h += `<div class="dia-checkbox"> <input type="checkbox" id="dia${n}" value="${n}" ${checked}> <label for="dia${n}">${dias[i]}</label> </div>`;
    }
    c.innerHTML = h;
  },

  guardarEstado() {
    if (!AppState || !AppState.currentUserId) return;
    const uid = AppState.currentUserId;
    const activeTab = document.querySelector('.bottom-nav-item.active')?.dataset.tab || 'inicio';
    const calendario = document.getElementById('calendarioEntreno');
    const planVisible = calendario ? calendario.style.display === 'block' : false;
    const estado = {
      activeTab: activeTab,
      planVisible: planVisible,
      planId: AppState.planActualId,
      trimestre: AppState.trimestreActual
    };
    sessionStorage.setItem('ri5_estado', JSON.stringify(estado));
    if (planVisible && AppState.planActualId) {
      const estadoPlan = {
        planId: AppState.planActualId,
        trimestre: AppState.trimestreActual,
        visible: true
      };
      localStorage.setItem(`ri5_plan_${uid}`, JSON.stringify(estadoPlan));
    } else {
      localStorage.removeItem(`ri5_plan_${uid}`);
    }
  },

  async restaurarEstado() {
    if (!AppState || !AppState.currentUserId) return;
    const uid = AppState.currentUserId;

    const storedPlan = localStorage.getItem(`ri5_plan_${uid}`);
    if (storedPlan) {
      try {
        const { planId, trimestre, visible } = JSON.parse(storedPlan);
        if (visible && planId) {
          const planExiste = await Storage.getPlanCompleto(uid, planId);
          if (planExiste && planExiste.sesiones && planExiste.sesiones.length > 0) {
            console.log(`🔄 Restaurando plan ${planId} desde localStorage`);
            if (AppState) {
              AppState.planActualId = planId;
              AppState.trimestreActual = trimestre || 0;
              AppState.sesionesRealizadas = planExiste.sesionesRealizadas || {};
              AppState.diasDobles = planExiste.diasDobles || {};
              AppState.feedbackSesiones = planExiste.feedback || {};
              AppState.planGeneradoActual = planExiste.params;
              AppState.planActualTipo = planExiste.tipo || null;
            }
            const calendario = document.getElementById("calendarioEntreno");
            const cuestionario = document.getElementById("cuestionarioEntreno");
            if (calendario) calendario.style.display = "block";
            if (cuestionario) cuestionario.style.display = "none";
            if (window.PlanGenerator) PlanGenerator.mostrarCalendario(planExiste.sesiones);
            const resumen = document.getElementById("resumenObjetivo");
            if (resumen) resumen.innerText = planExiste.resumen || 'Plan cargado';
            const nombrePlanEl = document.getElementById('nombrePlanTexto');
            if (nombrePlanEl) nombrePlanEl.textContent = planExiste.nombrePlan || 'Mi plan';
          }
        }
      } catch (e) {
        console.warn('Error restaurando plan desde localStorage:', e);
      }
    }
  },

  async cargarHistorialCompleto(reset = false) {
    const container = document.getElementById("historialContainer");
    if(!container) return;
    if(!AppState || !AppState.currentUserId) { container.innerHTML = '<p style="text-align:center; padding:20px;">Sin historial</p>'; return; }
    if (!AppState.historialPagination) AppState.historialPagination = { lastDoc: null, hasMore: true, loading: false };
    if (AppState.historialPagination.loading) return;
    AppState.historialPagination.loading = true;
    if (reset) { container.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Cargando…</div>'; AppState.historialPagination.lastDoc = null; AppState.historialPagination.hasMore = true; }
    try {
      const limitSelect = document.getElementById('historialLimit');
      const limit = limitSelect ? parseInt(limitSelect.value) : 10;
      const result = await Storage.getHistorial(AppState.currentUserId, limit, reset ? null : AppState.historialPagination.lastDoc);
      if (reset) container.innerHTML = '';
      if (result.items.length === 0) { if (reset) container.innerHTML = '<p style="text-align:center; padding:20px;">Sin cálculos guardados</p>'; AppState.historialPagination.hasMore = false; AppState.historialPagination.loading = false; return; }
      AppState.historialPagination.lastDoc = result.lastDoc;
      AppState.historialPagination.hasMore = result.items.length === limit;
      let html = container.innerHTML;
      result.items.forEach((it) => {
        let zonas = '';
        if(it.zonasResumen && Array.isArray(it.zonasResumen)) {
          zonas = '<div class="zonas-pastillas">';
          it.zonasResumen.forEach(z => {
            if (z.max === "MÁX") zonas += `<span class="zona-pastilla ${z.zona.toLowerCase()}"><span></span> ${z.zona}: >${z.min}</span>`;
            else zonas += `<span class="zona-pastilla ${z.zona.toLowerCase()}"><span></span> ${z.zona}: ${z.min}-${z.max}</span>`;
          });
          zonas += '</div>';
        }
        const pred = it.predicciones ? `<div class="predicciones">📊 ${Utils.escapeHTML(it.predicciones)}</div>` : '';
        const hora = it.hora ? `<div class="hora-detalle">🕒 ${Utils.escapeHTML(it.hora)}</div>` : '';
        const resumen = it.resumen ? Utils.escapeHTML(it.resumen) : (it.nombre + ' · ' + it.edad + ' años');
        html += `<div class="historial-item" onclick="toggleHistorialDetalle(this)"> <div class="fecha">📅 ${it.date || ''}</div> <div class="resumen">${resumen}</div> <button class="delete-icon" onclick="event.stopPropagation(); borrarEntradaHistorial('${it.id}')">🗑️</button> <div class="detalle">${hora}${pred}${zonas}${it.fcMax ? `<div>❤️ FC Máx: ${it.fcMax} lpm</div>`: ''}${it.umbral ?`<div>⚡ Umbral: ${it.umbral} lpm</div>` : ''}</div> </div>`;
      });
      if (AppState.historialPagination.hasMore) html += `<div style="text-align:center; margin-top:20px;"><button class="action-button" onclick="cargarMasHistorial()" style="width:auto; padding:10px 20px;">CARGAR MÁS</button></div>`;
      container.innerHTML = html;
    } catch (error) { console.error('Error cargando historial:', error); if (reset) container.innerHTML = '<p style="text-align:center; padding:20px;">Error al cargar</p>'; }
    finally { if (AppState && AppState.historialPagination) AppState.historialPagination.loading = false; }
  },

  toggleHistorialDetalle(el) { if(el) el.classList.toggle('abierto'); },

  async borrarEntradaHistorial(entryId) {
    if(!AppState || !AppState.currentUserId || !entryId) return;
    const confirmed = await Utils.confirm('Eliminar entrada', '¿Eliminar esta entrada?');
    if(!confirmed) return;
    try { await Storage.deleteHistorialEntry(AppState.currentUserId, entryId); if (AppState) AppState.resetHistorialPagination(); await this.cargarHistorialCompleto(true); Utils.showToast('✅ Entrada eliminada', 'success'); }
    catch (error) { console.error('Error borrando entrada:', error); Utils.showToast('Error al eliminar', 'error'); }
  },

  async borrarHistorial() {
    if(!AppState || !AppState.currentUserId) return;
    const confirmed = await Utils.confirm('Limpiar historial', '¿Eliminar todo el historial?');
    if(!confirmed) return;
    Utils.showLoading();
    try {
      const snapshot = await firebaseServices.db.collection('users').doc(AppState.currentUserId).collection('historial').get();
      const batch = firebaseServices.db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      if (AppState) AppState.resetHistorialPagination();
      await this.cargarHistorialCompleto(true);
      Utils.showToast('✅ Historial limpio', 'success');
    } catch (error) { console.error('Error borrando historial:', error); Utils.showToast('Error al limpiar', 'error'); }
    finally { Utils.hideLoading(); }
  },

  async cargarHistorialPlanes() {
    const container = document.getElementById('planesHistorialContainer');
    const section = document.getElementById('planesHistorial');
    if (!container || !section) return;
    if (!AppState || !AppState.currentUserId || !AppState.isPremium) { section.style.display = 'none'; return; }
    try {
      const planes = await Storage.getHistorialPlanes(AppState.currentUserId, 5);
      if (!planes || planes.length === 0) { section.style.display = 'none'; return; }
      section.style.display = 'block';
      let html = '';
      planes.forEach((plan) => {
        const fecha = plan.fechaCreacion ? new Date(plan.fechaCreacion).toLocaleDateString() : '';
        const params = plan.params || {};
        const distancia = params.distancia ? (params.distancia === '2k' ? '2K' : params.distancia === '5k' ? '5K' : params.distancia === '10k' ? '10K' : params.distancia === 'medio' ? 'MEDIA' : 'MARATÓN') : '';
        const nombrePlan = plan.nombrePlan || 'Mi plan';
        html += `<div class="plan-card" data-plan-id="${plan.id}" onclick="if(!event.target.closest('button')) cargarPlanDesdeHistorial('${plan.id}')"> <div class="plan-info"> <div class="plan-titulo">${Utils.escapeHTML(nombrePlan)}</div> <div class="plan-fecha">📅 ${Utils.escapeHTML(fecha)}</div> <div class="plan-resumen">${Utils.escapeHTML(distancia)} · ${Utils.escapeHTML(params.diasPorSemana || '?')} días · ${Utils.escapeHTML(params.nivel || '')}</div> </div> <button class="delete-plan" onclick="event.stopPropagation(); eliminarPlanHistorial('${plan.id}')">🗑️</button> </div>`;
      });
      container.innerHTML = html;
    } catch (error) { console.error('Error cargando historial de planes:', error); section.style.display = 'none'; }
  },

  async cargarPlanDesdeHistorial(planId) {
    if (!AppState || !AppState.currentUserId || !planId) return;
    try {
      Utils.showLoading();
      const planCompleto = await Storage.getPlanCompleto(AppState.currentUserId, planId);
      if (!planCompleto) { Utils.hideLoading(); Utils.showToast('El plan ya no existe', 'error'); return; }
      if (!planCompleto.sesiones || planCompleto.sesiones.length === 0) { Utils.hideLoading(); Utils.showToast('El plan está corrupto', 'error'); return; }
      if (AppState) {
        AppState.planGeneradoActual = planCompleto.params;
        AppState.planActualId = planId;
        AppState.planActualTipo = planCompleto.tipo || null;
        AppState.sesionesRealizadas = planCompleto.sesionesRealizadas || {};
        AppState.diasDobles = planCompleto.diasDobles || {};
        AppState.feedbackSesiones = planCompleto.feedback || {};
        AppState.trimestreActual = 0;
      }
      const calendario = document.getElementById("calendarioEntreno");
      const cuestionario = document.getElementById("cuestionarioEntreno");
      if (calendario) calendario.style.display = "block";
      if (cuestionario) cuestionario.style.display = "none";
      if (window.PlanGenerator) PlanGenerator.mostrarCalendario(planCompleto.sesiones);
      const resumen = document.getElementById("resumenObjetivo");
      if (resumen) resumen.innerText = planCompleto.resumen || 'Plan cargado';
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planCompleto.nombrePlan || 'Mi plan';

      if (typeof cargarDashboard === 'function') {
        cargarDashboard();
      }

      await window.switchTab('plan');
      this.guardarEstado();
      Utils.scrollToElement('calendarioEntreno', -20);
      Utils.hideLoading();
    } catch (e) {
      console.error('Error cargando plan:', e);
      Utils.hideLoading();
      Utils.showToast('Error al cargar el plan', 'error');
    }
  },

  async eliminarPlanHistorial(planId) {
    if (!AppState || !AppState.currentUserId || !planId) return;
    const confirmed = await Utils.confirm('Eliminar plan', '¿Eliminar este plan?');
    if (!confirmed) return;
    try { await Storage.deletePlan(AppState.currentUserId, planId); await this.cargarHistorialPlanes(); if (document.getElementById('historialContent')?.classList.contains('abierto')) { if (AppState) AppState.resetHistorialPagination(); await this.cargarHistorialCompleto(true); } Utils.showToast('✅ Plan eliminado', 'success'); }
    catch (error) { console.error('Error eliminando plan:', error); Utils.showToast('Error al eliminar', 'error'); }
  }
};

// ==================== MÓDULO PWA ====================
const PWA = {
  init() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); AppState.deferredPrompt = e; if(localStorage.getItem('pwa_installed') !== 'true') { const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'flex'; } });
    window.addEventListener('appinstalled', () => { const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'none'; AppState.deferredPrompt = null; localStorage.setItem('pwa_installed', 'true'); Utils.showToast('✅ App instalada', 'success'); });
  },

  async instalarPWA() {
    if(!AppState.deferredPrompt) { Utils.showToast('Para instalar: menú del navegador → "Añadir a pantalla de inicio"', 'info'); return; }
    try { AppState.deferredPrompt.prompt(); const choiceResult = await AppState.deferredPrompt.userChoice; if(choiceResult.outcome === 'accepted') { localStorage.setItem('pwa_installed', 'true'); Utils.showToast('✅ Instalando…', 'success'); } AppState.deferredPrompt = null; const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'none'; } catch (error) { console.error('Error instalando PWA:', error); Utils.showToast('Error al instalar', 'error'); }
  },

  cerrarBannerPWA() { const banner = document.getElementById('pwa-banner'); if (banner) banner.style.display = 'none'; localStorage.setItem('pwa_banner_closed', 'true'); },

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const teniaControllerAlRegistrar = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        console.log('✅ Service Worker (sw.js) registrado:', reg.scope);
        const comprobarActualizacion = () => reg.update().catch(() => {});
        comprobarActualizacion(); // 🔥 al abrir, sin esperar a visibilitychange/online/1 h
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') comprobarActualizacion();
        });
        window.addEventListener('online', comprobarActualizacion);
        setInterval(comprobarActualizacion, 60 * 60 * 1000);
      })
      .catch(err => console.warn('Error registrando Service Worker:', err));

    let recargando = false;
    const recargarSiProcede = (version) => {
      if (recargando) return;
      if (!teniaControllerAlRegistrar) {
        console.log('ℹ️ Service Worker instalado por primera vez (sin recarga):', version);
        return;
      }
      if (window.GPSTracker && GPSTracker.isRunning) {
        console.log('⏳ Nueva versión lista, se aplicará al terminar la sesión GPS en curso...');
        setTimeout(() => recargarSiProcede(version), 30000);
        return;
      }
      recargando = true;
      console.log('🔄 Nueva versión detectada, recargando...', version);
      location.reload();
    };
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'RI5_NEW_VERSION') recargarSiProcede(event.data.version);
    });
    // 🔥 Segunda vía: si el mensaje RI5_NEW_VERSION se pierde (la página
    // aún no tenía el listener, iOS lo descarta...), controllerchange se
    // dispara igualmente cuando el SW nuevo toma el control.
    navigator.serviceWorker.addEventListener('controllerchange', () => recargarSiProcede('controllerchange'));
  }
};

// ==================== MÓDULO DE TEMA ====================
window.toggleTheme = function(btn) {
  if (!btn || window._themeTransitioning) return;
  btn.classList.add('ripple');
  setTimeout(() => btn.classList.remove('ripple'), 600);
  Utils.vibrate(30);

  let newTheme;
  if (document.body.classList.contains('manual-light')) {
    newTheme = 'dark';
  } else if (document.body.classList.contains('manual-dark')) {
    newTheme = 'light';
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    newTheme = isDark ? 'light' : 'dark';
  }

  const applyTheme = () => {
    document.body.classList.remove('manual-light', 'manual-dark');
    document.body.classList.add(newTheme === 'light' ? 'manual-light' : 'manual-dark');
    localStorage.setItem('ri5_theme', newTheme);
  };

  applyTheme();
};

window.addEventListener('storage', (e) => {
  if (e.key !== 'ri5_theme') return;
  document.body.classList.remove('manual-light', 'manual-dark');
  if (e.newValue === 'light') document.body.classList.add('manual-light');
  else if (e.newValue === 'dark') document.body.classList.add('manual-dark');
});

window.abrirGuiaModal = function() {
  const overlay = document.getElementById('guiaModalOverlay');
  const frame = document.getElementById('guiaModalFrame');
  if (!overlay || !frame) return;
  if (!frame.dataset.loaded) {
    frame.src = 'guia.html';
    frame.dataset.loaded = '1';
  } else {
    try { frame.contentWindow.scrollTo(0, 0); } catch (e) {}
  }
  overlay.style.display = 'block';
};

window.addEventListener('ri5:appready', function precargarGuia() {
  window.removeEventListener('ri5:appready', precargarGuia);
  const frame = document.getElementById('guiaModalFrame');
  if (frame && !frame.dataset.loaded) {
    frame.src = 'guia.html';
    frame.dataset.loaded = '1';
  }
});

window.cerrarGuiaModal = function() {
  const overlay = document.getElementById('guiaModalOverlay');
  const frame = document.getElementById('guiaModalFrame');
  if (frame && frame.dataset.loaded) {
    try { frame.contentWindow.scrollTo(0, 0); } catch (e) {}
  }
  if (overlay) overlay.style.display = 'none';
};

window.togglePassword = function(inputId, element) {
  let input = null;
  if (inputId) input = document.getElementById(inputId);
  if (!input) { const wrapper = element?.closest('.password-wrapper'); input = wrapper?.querySelector('input'); }
  if (!input) { const form = element?.closest('form, .auth-form, div'); input = form?.querySelector('input[type="password"], input[type="text"]'); }
  if (input) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    element.textContent = isPassword ? 'ocultar' : 'ver';
  } else {
    console.error('No se pudo encontrar el input');
    Utils.showToast('Error al mostrar/ocultar', 'error');
  }
};

window.switchTab = async function(tab) { if (UI && UI.switchTab) await UI.switchTab(tab); };
window.toggleCuestionario = function() { if (window.PlanGenerator) PlanGenerator.toggleCuestionario(); else Utils.showToast('Cargando…', 'info'); };
window.mostrarUltimoPlanGuardado = function() { if (window.PlanGenerator) PlanGenerator.mostrarUltimoPlanGuardado(); else Utils.showToast('Cargando…', 'info'); };
window.borrarPlanGuardado = function() { if (window.PlanGenerator) PlanGenerator.borrarPlanGuardado(); else Utils.showToast('Cargando…', 'info'); };
window.generarCalendarioEntreno = function() { if (window.PlanGenerator) PlanGenerator.generarCalendarioEntreno(); else Utils.showToast('Cargando…', 'info'); };
window.validarOpcionesPlan = function() { if (window.PlanGenerator) PlanGenerator.validarOpcionesPlan(); };
window.cargarHistorial = async function() { if (UI && UI.cargarHistorialCompleto) await UI.cargarHistorialCompleto(true); };
window.cargarMasHistorial = async function() { if (UI && UI.cargarHistorialCompleto) await UI.cargarHistorialCompleto(false); };
window.borrarHistorial = async function() { if (UI && UI.borrarHistorial) await UI.borrarHistorial(); };
window.borrarEntradaHistorial = async function(entryId) { if (UI && UI.borrarEntradaHistorial) await UI.borrarEntradaHistorial(entryId); };
window.toggleHistorialDetalle = function(el) { if (UI && UI.toggleHistorialDetalle) UI.toggleHistorialDetalle(el); };
window.cargarPlanDesdeHistorial = async function(planId) { if (UI && UI.cargarPlanDesdeHistorial) await UI.cargarPlanDesdeHistorial(planId); };
window.eliminarPlanHistorial = async function(planId) { if (UI && UI.eliminarPlanHistorial) await UI.eliminarPlanHistorial(planId); };
window.cerrarPlan = function() { if (UI && UI.cerrarPlan) UI.cerrarPlan(); };
window.cerrarModalPremium = function() {
  const modal = document.getElementById('premiumManageModal');
  const overlay = document.getElementById('premiumManageOverlay');
  if (modal) modal.scrollTop = 0;
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (Admin) Admin.currentEditUserId = null;
};
window.cerrarModalSesion = function() {
  const modalSesionEl = document.getElementById("detalleSesion");
  const wrapperEl = document.getElementById("modalColorWrapper");
  if (modalSesionEl) modalSesionEl.scrollTop = 0;
  if (wrapperEl) wrapperEl.scrollTop = 0;
  modalSesionEl?.classList.remove("visible");
  document.getElementById("modalOverlay")?.classList.remove("visible");
  if (AppState) AppState.currentSesionDetalle = null;
};
window.cambiarAmigosTab = function(tab) {
  const amigosTabs = document.querySelectorAll('.amigos-tab');
  const amigosPanels = document.querySelectorAll('.amigos-panel');
  amigosTabs.forEach(t => t.classList.remove('active'));
  amigosPanels.forEach(p => p.classList.remove('active'));
  const tabMap = { 'buscar': 0, 'solicitudes': 1, 'lista': 2 };
  const idx = tabMap[tab];
  if (idx !== undefined) {
    if (amigosTabs[idx]) amigosTabs[idx].classList.add('active');
    const panel = document.getElementById(`amigos-${tab}`);
    if (panel) panel.classList.add('active');
  }
  if (tab === 'solicitudes' && window.Friends) Friends.cargarSolicitudesRecibidas();
  if (tab === 'lista' && window.Friends) Friends.cargarListaAmigos();
};

const ResetPassword = {
  abrirModal() {
    const overlay = document.getElementById('resetOverlay');
    const modal = document.getElementById('resetModal');
    if (overlay) overlay.style.display = 'block';
    if (modal) { modal.style.display = 'block'; modal.scrollTop = 0; }
    const email = document.getElementById('resetEmail');
    if (email) email.value = '';
    const error = document.getElementById('resetError');
    if (error) error.classList.remove('visible');
  },
  cerrarModal() {
    const overlay = document.getElementById('resetOverlay');
    const modal = document.getElementById('resetModal');
    if (modal) modal.scrollTop = 0;
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
  },
  async enviarEmailRecuperacion() {
    const email = document.getElementById('resetEmail')?.value.trim();
    const errorEl = document.getElementById('resetError');
    if (!email) {
      if (errorEl) { errorEl.textContent = 'Introduce tu correo electrónico'; errorEl.classList.add('visible'); }
      return;
    }
    if (!Utils.isValidEmail(email)) {
      if (errorEl) { errorEl.textContent = 'Correo electrónico no válido'; errorEl.classList.add('visible'); }
      return;
    }
    Utils.showLoading();
    try {
      await firebaseServices.auth.sendPasswordResetEmail(email);
      Utils.hideLoading();
      this.cerrarModal();
      Utils.showToast('📧 Revisa tu correo para restablecer la contraseña', 'success');
    } catch (error) {
      Utils.hideLoading();
      if (error.code === 'auth/user-not-found') {
        Utils.showToast('Si el correo existe, recibirás instrucciones', 'info');
        this.cerrarModal();
      } else {
        Utils.handleFirebaseError(error);
      }
    }
  }
};

// ==================== INICIALIZACIÓN CORRECTA ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log('🚀 Iniciando RI5…');

  setTimeout(() => {
    document.querySelectorAll('.password-toggle').forEach(button => {
      if (!button.getAttribute('onclick')) {
        const wrapper = button.closest('.password-wrapper');
        const input = wrapper?.querySelector('input');
        if (input && input.id) {
          button.setAttribute('onclick', `togglePassword('${input.id}', this)`);
        }
      }
    });
  }, 500);

  if (!window.firebaseServices) {
    console.error('❌ Firebase no está configurado');
    Utils.showToast('Error de configuración', 'error');
    return;
  }

  UI.startConsejoAutoChange();

  const ageInput = document.getElementById("age");
  const timeInput = document.getElementById("time");

  if (ageInput) {
    ageInput.addEventListener("blur", () => UI.marcarCampoTocado('age'));
    ageInput.addEventListener("input", () => {
      if(AppState && AppState.camposTocados.age) UI.validarCampo('age');
      UI.validarTodo();
    });
  }

  if (timeInput) {
    timeInput.addEventListener("input", (e) => Utils.autoFormatearTiempo(e));
    timeInput.addEventListener("blur", () => UI.marcarCampoTocado('time'));
    timeInput.addEventListener("input", () => {
      if(AppState && AppState.camposTocados.time) UI.validarCampo('time');
      UI.validarTodo();
    });
  }

  UI.validarTodo();
  UI.initDiasCheckboxes();

  if(localStorage.getItem('pwa_installed') === 'true' || localStorage.getItem('pwa_banner_closed') === 'true') {
    const pwaBanner = document.getElementById('pwa-banner');
    if (pwaBanner) pwaBanner.style.display = 'none';
  }

  PWA.init();
  PWA.registerServiceWorker();

  setTimeout(() => {
    if(AppState && AppState.deferredPrompt &&
      localStorage.getItem('pwa_installed') !== 'true' &&
      localStorage.getItem('pwa_banner_closed') !== 'true') {
      const pwaBanner = document.getElementById('pwa-banner');
      if (pwaBanner) pwaBanner.style.display = 'flex';
    }
  }, 3000);

  const savedTheme = localStorage.getItem('ri5_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.body.classList.add(`manual-${savedTheme}`);
  }

  document.addEventListener('click', function enableAudio() {
    window.audioEnabled = true;
    document.removeEventListener('click', enableAudio);
  }, { once: true });

  window.addEventListener('online', () => {
    Storage.procesarCalculosPendientes();
  });

  const savedUid = localStorage.getItem('ri5_current_user');
  if (!savedUid) {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainContent").style.display = "none";
    if (typeof window._ri5MarcarAppLista === 'function') window._ri5MarcarAppLista();
  } else {
    Utils.showLoading();
    Auth.checkSavedSession();
    setTimeout(() => {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay && overlay.classList.contains('active')) {
        console.warn('⚠️ El overlay de carga lleva más de 15s activo. Revisa la conexión o el estado de Firebase Auth.');
      }
    }, 15000);
  }

  if (window.Training && Training._loadFromLocalStorage) {
    const savedCalc = Training._loadFromLocalStorage();
    if (savedCalc && AppState && !AppState.zonasCalculadas) {
      AppState.setLastCalc(savedCalc);
      const subtabEntreno = document.getElementById('subtab-perfil-entreno');
      if (subtabEntreno && subtabEntreno.classList.contains('active')) {
        Training.mostrarResultados(savedCalc);
      } else {
        console.log('📦 Cálculo restaurado en segundo plano desde localStorage');
      }
    }
  }

  console.log('✅ RI5 inicializado correctamente');
});

window.toggleUsuario = (element, uid) => Admin.toggleUsuario(element, uid);
window.UI = UI;

window.instalarPWA = () => PWA.instalarPWA();
window.cerrarBannerPWA = () => PWA.cerrarBannerPWA();
window.changeDailyTip = () => UI.changeDailyTip();
window.changeConsejo = () => UI.changeConsejo();
window.cerrarPremiumModal = () => {
  document.getElementById('premiumOverlay')?.classList.remove('active');
  const modal = document.getElementById('premiumModal');
  const scrollBody = modal?.querySelector('.modal-scroll-body');
  if (scrollBody) scrollBody.scrollTop = 0;
  modal?.classList.remove('active');
};
window.contactarAdmin = () => {
  window.open('https://www.instagram.com/joaquinpeinando?igsh=Y2ZzMHpwOWUwOTRx&igsi=Y2ZzMHpwOWUwOTRx&utm_source=qr', '_blank');
};
window.cerrarWelcomeModal = () => {
  document.getElementById('welcomeOverlay')?.classList.remove('active');
  const modal = document.getElementById('welcomeModal');
  const scrollBody = modal?.querySelector('.modal-scroll-body');
  if (scrollBody) scrollBody.scrollTop = 0;
  modal?.classList.remove('active');
};

window.abrirResetModal = () => ResetPassword.abrirModal();
window.cerrarResetModal = () => ResetPassword.cerrarModal();
window.enviarEmailRecuperacion = () => ResetPassword.enviarEmailRecuperacion();

if (typeof PlanGenerator !== 'undefined') {
  window.cambiarTrimestre = async (delta) => { await PlanGenerator.cambiarTrimestre(delta); };
} else {
  window.cambiarTrimestre = async (delta) => {
    console.warn('PlanGenerator no disponible aún');
    Utils.showToast('Cargando planificador...', 'info');
  };
}
// ==================== BLOQUEO DE SCROLL DE FONDO EN MODALES ====================
// Con un modal abierto, arrastrar el dedo sobre él movía la página de detrás (en
// iOS el scroll "se encadena" al fondo cuando el modal no tiene scroll propio o
// ya está en su tope). Este guardián escucha touchmove a nivel de documento:
//  · si el dedo está sobre una capa fija de modal (position:fixed, z-index>=2000),
//    solo deja pasar el gesto si hay dentro un contenedor con scroll real y aún
//    le queda recorrido en esa dirección;
//  · en cualquier otro caso cancela el gesto, así que el fondo no se mueve.
// No toca nada fuera de modales (la página normal sigue haciendo scroll igual).
(function initBloqueoScrollModales() {
  if (window._ri5ScrollGuardInit) return;
  window._ri5ScrollGuardInit = true;

  const EXCLUIR_CAPA = '.landing-container, #ri5Splash, #confetti-canvas, #loadingOverlay';
  const EXCLUIR_TARGET = 'input[type="range"], canvas, .leaflet-container, [data-scroll-free]';
  let capa = null, scroller = null, startY = 0;

  const esScroller = (el) => {
    const oy = getComputedStyle(el).overflowY;
    return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1;
  };

  document.addEventListener('touchstart', (e) => {
    capa = null; scroller = null;
    if (e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    let el = e.target;
    if (!(el instanceof Element) || el.closest(EXCLUIR_TARGET)) return;
    const candidatos = [];
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && (parseInt(cs.zIndex, 10) || 0) >= 2000) {
        if (el.matches(EXCLUIR_CAPA)) return;
        capa = el;
        break;
      }
      candidatos.push(el);
      el = el.parentElement;
    }
    if (!capa) return;
    // la propia capa también puede ser el scroller (modal con overflow-y:auto)
    candidatos.push(capa);
    scroller = candidatos.find(esScroller) || null;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!capa) return;
    if (!scroller) { if (e.cancelable) e.preventDefault(); return; }
    const dy = e.touches[0].clientY - startY;
    const enTope = scroller.scrollTop <= 0;
    const enFondo = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
    if ((dy > 0 && enTope) || (dy < 0 && enFondo)) { if (e.cancelable) e.preventDefault(); }
  }, { passive: false });

  const limpiar = () => { capa = null; scroller = null; };
  document.addEventListener('touchend', limpiar, { passive: true });
  document.addEventListener('touchcancel', limpiar, { passive: true });
})();

// ==================== FUNDIDO DE MODALES (ABRIR Y CERRAR) ====================
// Misma animación que el cambio de pestaña: un fundido rápido de opacidad.
//  · Al abrir: cualquier capa fija (position:fixed inline, z-index >= 2000) que se
//    añada al <body> sin fundido propio entra con opacidad 0 -> 1 (280 ms).
//  · Al cerrar: se cierran directamente, sin animación.
// Las capas que ya gestionan su propio fundido (opacity inline) no se tocan.
// Los modales estáticos de index.html se animan por CSS (ver «FUNDIDO AL ABRIR»).
(function initFundidoModales() {
  if (window._ri5FundidoInit) return;
  window._ri5FundidoInit = true;

  const DUR_IN = 280;
  const EXCLUIR = '#ri5Splash, #confetti-canvas, #loadingOverlay, .landing-container, [data-no-fade]';

  const esCapa = (el) => {
    if (!(el instanceof HTMLElement) || el.parentElement !== document.body) return false;
    if (el.matches(EXCLUIR) || el.style.position !== 'fixed') return false;
    const cs = getComputedStyle(el);
    return (parseInt(cs.zIndex, 10) || 0) >= 2000 && cs.display !== 'none';
  };

  new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (!esCapa(n) || n.style.opacity !== '') continue;
        if (getComputedStyle(n).animationName !== 'none') continue;
        n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR_IN, easing: 'ease' });
      }
    }
  }).observe(document.body, { childList: true });
})();

// ==================== FONDO DE TIEMPO REAL EN LA TARJETA DEL DASHBOARD ====================
// 🔥 FIX permiso ubicación: antes se pedía el permiso del GPS CADA vez que se abría la app,
// cada vez que se volvía a ella (visibilitychange) y cada 10 minutos (setInterval) -- porque
// obtenerPosicion() llamaba siempre a getCurrentPosition() en cuanto pasaban 2 min de la
// última lectura, y en iOS el sistema vuelve a mostrar el aviso cada vez. Ahora se guarda en
// localStorage la decisión del usuario (K_PERMISO: 'ok' | 'no'): solo se le pide la primera
// vez; después se reutiliza la última posición guardada sin tocar el GPS. Solo se vuelve a
// pedir si el propio usuario toca el tiempo para "usar mi ubicación real" (usarMiUbicacion).
const WeatherFX = (() => {
  const TTL = 10 * 60 * 1000;
  const K_GEO = 'ri5_wx_geo_', K_NOW = 'ri5_wx_now2', K_POS = 'ri5_wx_pos', K_PIDIO = 'ri5_wx_gps_pedido', K_LUGAR = 'ri5_wx_lugar_';
  const K_PERMISO = 'ri5_wx_permiso';       // 🔥 FIX permiso: 'ok' | 'no' | (sin valor: aún no decidido)

  let hero, canvas, ctx, cityEl;
  let W = 0, H = 0, dpr = 1, light = false, bgRGB = [26, 26, 26];
  let scene = { kind: 'clear', n: 1, day: true, slant: 0, wind: 0 };
  let drops = [], flakes = [], clouds = [], stars = [], streaks = [], astro = null, tAstro = 0;
  let enPantalla = false, raf = 0, tPrev = 0, t = 0, flash = 0, proxRayo = 3, rayoX = 0, doble = 0;
  let ciudad = '', coords = null, temp = null, iniciado = false, origen = 'reloj', resolviendo = false, pendiente = false, lugar = '';

  const rnd = (a, b) => a + Math.random() * (b - a);
  const reducido = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const leer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  async function pedirJSON(url) {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      return r.ok ? await r.json() : null;
    } catch (_) { return null; } finally { clearTimeout(to); }
  }

  // ---------- datos ----------
  function escenaDe(code, isDay, windKmh, x) {
    x = x || {};
    const v = windKmh || 0;
    const wind = v >= 55 ? 3 : v >= 38 ? 2 : v >= 24 ? 1 : 0;      // 0 calma · 1 ventoso · 2 viento · 3 viento fuerte
    const slant = Math.max(-0.3, Math.min(0.3, v / 110));
    let kind = 'cloudy', n = 1;
    if (code === 0) { kind = 'clear'; }
    else if (code === 1) { kind = 'partly'; n = 1; }
    else if (code === 2) { kind = 'partly'; n = 2; }
    else if (code === 3) { kind = 'cloudy'; }
    else if (code === 45 || code === 48) { kind = 'fog'; }
    else if ([51, 53, 55, 56, 57, 61, 80].includes(code)) { kind = 'rain'; n = 1; }
    else if ([63, 66, 81].includes(code)) { kind = 'rain'; n = 2; }
    else if ([65, 67, 82].includes(code)) { kind = 'rain'; n = 3; }
    else if ([71, 77, 85].includes(code)) { kind = 'snow'; n = 1; }
    else if (code === 73) { kind = 'snow'; n = 2; }
    else if (code === 75 || code === 86) { kind = 'snow'; n = 3; }
    else if (code >= 95) { kind = 'storm'; n = 3; }
    // El weather_code es la foto del modelo para la hora; la precipitación y la nubosidad
    // medidas en el mismo instante la corrigen (si cae agua, es lluvia aunque el código diga «nublado»).
    const nieve = +x.snowfall || 0, agua = Math.max(+x.precipitation || 0, +x.rain || 0, +x.showers || 0);
    const libre = (kind === 'clear' || kind === 'partly' || kind === 'cloudy');
    if (nieve >= 0.05 && (libre || kind === 'rain')) { kind = 'snow'; n = Math.max(n, nieve < 0.3 ? 1 : nieve < 1.5 ? 2 : 3); }
    else if (agua >= 0.1 && libre) { kind = 'rain'; n = agua < 0.5 ? 1 : agua < 2.5 ? 2 : 3; }
    else if (agua >= 0.5 && kind === 'rain') { n = Math.max(n, agua < 2.5 ? 2 : 3); }
    const nub = +x.cloud_cover;
    if (isFinite(nub)) {
      if (kind === 'clear' && nub >= 45) { kind = 'partly'; n = 1; }
      if (kind === 'partly' && n === 1 && nub >= 70) n = 2;
      if (kind === 'partly' && n === 2 && nub >= 92) kind = 'cloudy';
    }
    return { kind, n, day: !!isDay, slant, wind };
  }

  const escenaCur = (c) => escenaDe(c.weather_code, c.is_day, c.wind_speed_10m, c);

  function escenaReloj() {
    const h = new Date().getHours();
    return { kind: 'clear', n: 1, day: h >= 7 && h < 20, slant: 0, wind: 0 };
  }

  // Texto corto de la condición (sin emojis: la tarjeta se queda limpia)
  function etiqueta(s) {
    const k = s.kind, w = s.wind || 0;
    if (w >= 1 && (k === 'clear' || k === 'partly' || k === 'cloudy')) return w >= 3 ? 'Viento fuerte' : (w === 2 ? 'Viento' : 'Ventoso');
    if (k === 'clear') return 'Despejado';
    if (k === 'partly') return s.n === 1 ? 'Poco nuboso' : 'Algo nuboso';
    if (k === 'cloudy') return 'Nublado';
    if (k === 'fog') return 'Niebla';
    if (k === 'rain') return ['', 'Llovizna', 'Lluvia', 'Lluvia fuerte'][s.n] || 'Lluvia';
    if (k === 'snow') return ['', 'Nieve ligera', 'Nieve', 'Nevada fuerte'][s.n] || 'Nieve';
    if (k === 'storm') return 'Tormenta';
    return '';
  }

  function aplicarEscena(s, grados) {
    scene = s;
    temp = (typeof grados === 'number' && isFinite(grados)) ? Math.round(grados) : null;
    generar();
    pintarTexto();
    if (canvas) canvas.classList.add('listo');
    if (reducido()) dibujar(); else arrancar();
    try { window.dispatchEvent(new CustomEvent('weatherfx:escena')); } catch (_) {}
  }

  // ---------- emoji del saludo ----------
  // Fase lunar aproximada (ciclo sinódico de 29,53 días desde la luna nueva del 6-ene-2000).
  function emojiLuna() {
    const dias = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
    const f = ((dias % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853;
    return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.round(f * 8) % 8];
  }

  // ---------- icono animado del saludo (SVG + CSS) ----------
  function faseLuna() {
    const dias = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
    return ((dias % 29.530588853) + 29.530588853) % 29.530588853 / 29.530588853;
  }
  function estilosIcono() {
    if (document.getElementById('wxIconCss')) return;
    const st = document.createElement('style'); st.id = 'wxIconCss';
    st.textContent =
      '.wx-ic{width:20px;height:20px;display:inline-block;vertical-align:-5px;margin-right:6px;overflow:visible;--wxh:rgba(20,28,48,.5)}' +
      'body.manual-light .wx-ic{--wxh:rgba(52,76,122,.62)}' +
      '.wx-ic .h{fill:none;stroke:var(--wxh);stroke-linecap:round;stroke-linejoin:round}' +
      '.wx-ic .hf{stroke:var(--wxh);stroke-width:2.4;stroke-linejoin:round;paint-order:stroke}' +
      '.wx-ic *{transform-box:fill-box}' +
      '.wx-spin{transform-origin:center;animation:wxSpin 16s linear infinite}' +
      '.wx-pulse{transform-origin:center;animation:wxPulse 3.2s ease-in-out infinite}' +
      '.wx-drift{animation:wxDrift 4s ease-in-out infinite}' +
      '.wx-drop{animation:wxDrop 1.1s linear infinite}' +
      '.wx-flake{animation:wxFlake 2.2s linear infinite}' +
      '.wx-bolt{animation:wxBolt 2.6s linear infinite}' +
      '.wx-fogl{animation:wxFogL 4.5s ease-in-out infinite}' +
      '.wx-fogr{animation:wxFogR 4.5s ease-in-out infinite}' +
      '.wx-tw{animation:wxTw 2.4s ease-in-out infinite}' +
      '@keyframes wxSpin{to{transform:rotate(360deg)}}' +
      '@keyframes wxPulse{50%{opacity:.72;transform:scale(1.1)}}' +
      '@keyframes wxDrift{0%,100%{transform:translateX(-1px)}50%{transform:translateX(1.6px)}}' +
      '@keyframes wxDrop{0%{transform:translateY(-2px);opacity:0}25%{opacity:1}100%{transform:translateY(5px);opacity:0}}' +
      '@keyframes wxFlake{0%{transform:translate(-1px,-2px);opacity:0}20%{opacity:1}100%{transform:translate(1.5px,5px);opacity:0}}' +
      '@keyframes wxBolt{0%,55%,100%{opacity:.25}60%,70%{opacity:1}65%{opacity:.4}}' +
      '@keyframes wxFogL{0%,100%{transform:translateX(-1.5px)}50%{transform:translateX(2px)}}' +
      '@keyframes wxFogR{0%,100%{transform:translateX(1.5px)}50%{transform:translateX(-2px)}}' +
      '@keyframes wxTw{50%{opacity:.25}}' +
      '@media (prefers-reduced-motion:reduce){.wx-ic *{animation:none!important}}';
    document.head.appendChild(st);
  }
  const C = { sol: '#FFC21A', rayo: '#FF9A1F', luna: '#F7EAB0', lunaSombra: '#7F8BB0', nube: '#F4F7FC', nubeGris: '#9DB0CE', nubeOscura: '#8393B0', gota: '#3E8EF7', copo: '#FFFFFF', rayoTor: '#FFD02B', niebla: '#C3CCDA' };
  const NUBE = 'M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.2 9.2 4.4 4.4 0 0 0 7 18z';
  // Icono a colores reales del tiempo. La animación va en el <path>/<g> interno y el
  // desplazamiento fijo en un <g> exterior: una animación CSS pisaría el atributo transform.
  // Cada trazo lleva debajo una copia ancha y translúcida (clase h/hf) que hace de halo de contraste.
  const lin = (x1, y1, x2, y2, w, extra) => {
    const col = (extra && extra.col) || '#000';
    const c = extra && extra.cls ? ` class="${extra.cls}"` : '', st = extra && extra.style ? ` style="${extra.style}"` : '', op = extra && extra.op ? ` opacity="${extra.op}"` : '';
    return `<g${c}${st}${op}><line class="h" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w + 2.4}"/>` +
           `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/></g>`;
  };
  function svgSol(cx, cy, r) {
    let rayos = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a);
      rayos += lin((cx + c * (r + 1.8)).toFixed(2), (cy + sn * (r + 1.8)).toFixed(2), (cx + c * (r + 3.6)).toFixed(2), (cy + sn * (r + 3.6)).toFixed(2), 1.7, { col: C.rayo });
    }
    return `<g class="wx-spin">${rayos}</g>` +
           `<circle class="wx-pulse hf" cx="${cx}" cy="${cy}" r="${r}" fill="${C.sol}"/>`;
  }
  function svgLuna(cx, cy, r, f) {
    const cosf = Math.cos(2 * Math.PI * f), rx = Math.abs(cosf) * r;
    const sweep = cosf >= 0 ? 0 : 1;
    const lit = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx.toFixed(2)},${r} 0 0 ${sweep} 0,${-r}Z`;
    const flip = f > 0.5 ? ' scale(-1,1)' : '';
    return `<g transform="translate(${cx},${cy})"><circle class="wx-pulse" r="${r}" fill="${C.lunaSombra}" opacity=".45"/>` +
           `<g transform="${flip.trim()}"><path class="wx-pulse hf" d="${lit}" fill="${C.luna}"/></g></g>`;
  }
  function svgNube(tr, col) {
    return `<g transform="${tr || ''}"><path class="wx-drift hf" d="${NUBE}" fill="${col || C.nube}"/></g>`;
  }
  // Máscara que recorta un hueco alrededor de la nube para que el sol/luna/rayo no se fundan con ella
  function mascaraNube(tr) {
    return `<defs><mask id="wxM" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">` +
           `<rect x="-6" y="-6" width="36" height="36" fill="#fff"/>` +
           `<path d="${NUBE}" transform="${tr}" fill="#000" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/></mask></defs>`;
  }
  function iconoSVG() {
    const s = scene, k = s.kind, f = faseLuna();
    let d;
    if (k === 'storm') {
      const tr = 'translate(0,-3)';
      d = svgNube(tr, C.nubeOscura) + mascaraNube(tr) +
          `<g mask="url(#wxM)"><polygon class="wx-bolt hf" points="12.8,13.5 9.2,19.5 12,19.5 10.8,23.5 15.2,17.5 12.4,17.5 14.2,13.5" fill="${C.rayoTor}"/></g>`;
    } else if (k === 'rain') {
      const dr = [[8.5, 0], [12.5, .35], [16.5, .7]].map(([x, dl]) =>
        lin(x, 17.5, x - .8, 20, 1.9, { cls: 'wx-drop', style: `animation-delay:${dl}s`, col: C.gota })).join('');
      d = svgNube('translate(0,-3)', C.nubeGris) + dr;
    } else if (k === 'snow') {
      const fl = [[8.5, 0], [12.5, .7], [16.5, 1.4]].map(([x, dl]) =>
        `<circle class="wx-flake hf" style="animation-delay:${dl}s" cx="${x}" cy="18.5" r="1.25" fill="${C.copo}"/>`).join('');
      d = svgNube('translate(0,-3)', C.nubeGris) + fl;
    } else if (k === 'fog') {
      d = lin(5, 8, 18, 8, 2.1, { cls: 'wx-fogl', col: C.niebla }) +
          lin(3, 12.5, 20, 12.5, 2.1, { cls: 'wx-fogr', col: C.niebla }) +
          lin(6, 17, 17, 17, 2.1, { cls: 'wx-fogl', op: .8, col: C.niebla });
    } else if (k === 'cloudy') {
      d = svgNube('', C.nubeGris);
    } else if (k === 'partly') {
      const tr = 'translate(4,3.5) scale(.82)';
      const astro = s.day ? svgSol(8.5, 8.5, 3.2) : svgLuna(8.5, 8.5, 4, f);
      d = mascaraNube(tr) + `<g mask="url(#wxM)">${astro}</g>` + svgNube(tr, s.n >= 2 ? C.nubeGris : C.nube);
    } else {
      d = s.day ? svgSol(12, 12, 4.6) : svgLuna(12, 12, 7, f)
        + `<circle class="wx-tw hf" cx="20" cy="4.5" r="1.1" fill="${C.luna}"/>`;
    }
    return `<svg class="wx-ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  }
  function icono() { estilosIcono(); return iconoSVG(); }

  // Icono según el tiempo y si es de día o de noche (versión emoji, de respaldo)
  function emojiActual() {
    const s = scene, k = s.kind;
    if (k === 'storm') return '⛈️';
    if (k === 'rain') return '🌧️';
    if (k === 'snow') return '🌨️';
    if (k === 'fog') return '🌫️';
    if (k === 'cloudy') return '☁️';
    if (k === 'partly') {
      if (s.n >= 2) return s.day ? '⛅' : '☁️';
      return s.day ? '🌤️' : emojiLuna();
    }
    return s.day ? '☀️' : emojiLuna();
  }

  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[,;(]/)[0].trim().toLowerCase();
  function mismoLugar(a, b) { a = norm(a); b = norm(b); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); }

  // Una sola línea bajo el saludo: «Lugar · 21° · Nublado».
  // Lugar = donde estás (GPS) o, si no hay ubicación, la ciudad del perfil: siempre el sitio del tiempo mostrado.
  function pintarTexto() {
    if (!cityEl) return;
    let nom = document.getElementById('dashboardCityName');
    if (!nom) {                                    // sin ciudad en el perfil o marcado antiguo: se crea aquí
      nom = document.createElement('span'); nom.id = 'dashboardCityName';
      const t = cityEl.firstChild;
      if (t && t.nodeType === 3) { nom.dataset.perfil = (t.textContent || '').replace('📍', '').trim(); cityEl.removeChild(t); }
      cityEl.insertBefore(nom, cityEl.firstChild);
    }
    let el = document.getElementById('dashboardWeatherTemp');
    if (!el) { el = document.createElement('span'); el.id = 'dashboardWeatherTemp'; cityEl.appendChild(el); }
    let sep = document.getElementById('dashboardWeatherSep');
    if (!sep) { sep = document.createElement('span'); sep.id = 'dashboardWeatherSep'; sep.textContent = ' · '; cityEl.insertBefore(sep, el); }
    const miCiudad = leerCiudad() || ciudad;
    const nombre = origen === 'gps' ? (lugar || 'Tu ubicación') : miCiudad;
    nom.textContent = nombre || '';
    nom.style.cssText = 'cursor:pointer;';
    // «26° · Nublado» va en un bloque que no se parte: si no cabe junto al lugar, baja entero a la 2.ª línea
    el.style.cssText = 'cursor:pointer; letter-spacing:0.2px; display:inline-block; white-space:nowrap;';
    el.textContent = '';
    sep.style.display = (temp !== null && nombre) ? '' : 'none';
    sep.style.visibility = 'visible';
    if (temp !== null) {
      const g = document.createElement('span');
      g.textContent = temp + '°';
      g.style.cssText = 'font-weight:600; color:var(--text-primary);';
      el.appendChild(g);
      el.appendChild(document.createTextNode(' · ' + etiqueta(scene)));
    }
    // si el tiempo ha saltado de línea, se oculta el « · » que habría quedado suelto al final de la 1.ª
    const ajustar = () => { sep.style.visibility = (el.offsetTop > nom.offsetTop + 4) ? 'hidden' : 'visible'; };
    requestAnimationFrame(ajustar); setTimeout(ajustar, 400);
    const tip = (origen === 'gps' ? 'Tiempo en tu ubicación' : 'Tiempo en tu ciudad (toca para usar tu ubicación real)') + ' · Open-Meteo.com';
    nom.title = tip; el.title = tip;
  }

  // Nombre del lugar donde estás (geocodificación inversa, OpenStreetMap Nominatim).
  // Se guarda por coordenadas redondeadas (~1 km): casi nunca se vuelve a consultar.
  async function nombreDeLugar(c) {
    const key = K_LUGAR + c.lat.toFixed(2) + ',' + c.lon.toFixed(2);
    const g = leer(key);
    if (g && g.n) return g.n;
    const r = await pedirJSON(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${c.lat}&lon=${c.lon}&zoom=10&addressdetails=1&accept-language=es`);
    const a = r && r.address;
    const n = a && (a.city || a.town || a.village || a.municipality || a.county || '');
    const limpio = (n || '').split('/')[0].trim();   // nombres oficiales bilingües: «Alicante/Alacant» -> «Alicante»
    if (limpio) guardar(key, { n: limpio });
    return limpio;
  }

  async function geocodificar(nombre) {
    const norm = nombre.trim().toLowerCase();
    const c = leer(K_GEO + norm);
    if (c && isFinite(c.lat) && isFinite(c.lon)) return c;
    const intentos = [...new Set([nombre.split(/[,;(]/)[0].trim(), nombre.trim()])].filter(Boolean);
    for (const q of intentos) {
      const r = await pedirJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=es&format=json`);
      const g = r && r.results && r.results[0];
      if (g) { const out = { lat: g.latitude, lon: g.longitude }; guardar(K_GEO + norm, out); return out; }
    }
    return null;
  }

  // Posición real. pedir=true permite que el sistema muestre el aviso de permiso.
  function leerGPS() {
    return new Promise((res) => {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => res({ lat: +pos.coords.latitude.toFixed(2), lon: +pos.coords.longitude.toFixed(2) }),
          () => res(null), { maximumAge: 0, timeout: 10000, enableHighAccuracy: false });
      } catch (_) { res(null); }
    });
  }

  // 🔥 FIX permiso: obtención de la posición con memoria de la decisión del usuario.
  //  - Si ya hay una posición guardada MUY reciente (< 2 min), se usa sin tocar el GPS.
  //  - Si ya se resolvió el permiso antes ('ok' o 'no'), NO se vuelve a llamar a
  //    getCurrentPosition automáticamente: en iOS el sistema volvería a mostrar el aviso
  //    en cada arranque / vuelta a la app / cada 10 min. Solo se vuelve a llamar si el
  //    usuario lo pide a propósito (forzar=true, desde usarMiUbicacion()).
  //  - La primera vez (sin K_PERMISO todavía): se llama al GPS, y se guarda 'ok' o 'no'
  //    según el resultado, para no volver a preguntar.
  async function obtenerPosicion(forzar) {
    // v4.89: la posición se lee SIEMPRE de nuevo (al abrir, recargar, volver a la app o iniciar
    // sesión). Ya no se reutiliza la guardada de hace < 2 min ni se confía en 'permissions.query'
    // para decidir si leer: antes, si el navegador no informaba bien del permiso (iOS), se
    // quedaba la última posición (p. ej. Murcia estando ya en Elche).
    if (!navigator.geolocation) return null;
    const c = leer(K_POS);
    const decision = leer(K_PERMISO);
    let estado = 'desconocido';
    try { if (navigator.permissions) estado = (await navigator.permissions.query({ name: 'geolocation' })).state; } catch (_) {}
    if (estado === 'denied') { guardar(K_PERMISO, 'no'); return null; }

    // Solo se evita llamar al GPS si el usuario ya dijo que no y el sistema no confirma el permiso
    // (así no reaparece el aviso). En cualquier otro caso se lee la posición actual.
    const puedeLeer = forzar || estado === 'granted' || decision === 'ok' || !decision;
    if (puedeLeer) {
      const p = await leerGPS();
      if (p) { guardar(K_POS, { ...p, t: Date.now() }); guardar(K_PERMISO, 'ok'); return p; }
      if (forzar || !decision) guardar(K_PERMISO, 'no');   // un fallo puntual con permiso ya concedido no lo revoca
    }
    // Sin lectura nueva: la última posición solo vale si es reciente (< 30 min); si no, ciudad del perfil.
    return (c && isFinite(c.lat) && Date.now() - c.t < 30 * 60 * 1000) ? { lat: c.lat, lon: c.lon } : null;
  }

  async function actualizar(forzar) {
    if (!coords) { aplicarEscena(escenaReloj(), null); return; }
    const key = coords.lat.toFixed(2) + ',' + coords.lon.toFixed(2);
    const c = leer(K_NOW);
    if (!forzar && c && c.key === key && Date.now() - c.t < TTL) {
      aplicarEscena(escenaCur(c.cur), c.cur.temperature_2m);
      return;
    }
    const r = await pedirJSON(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m,precipitation,rain,showers,snowfall,cloud_cover&timezone=auto`);
    if (r && r.current && typeof r.current.weather_code === 'number') {
      guardar(K_NOW, { key, t: Date.now(), cur: r.current });
      aplicarEscena(escenaCur(r.current), r.current.temperature_2m);
    } else if (c && c.key === key) {   // sin red: se queda con el último conocido
      aplicarEscena(escenaCur(c.cur), c.cur.temperature_2m);
    }
  }

  // Cada vez que se abre la app (y al volver a ella, y cada 10 min) se busca el GPS directamente
  // la PRIMERA vez; en adelante se reutiliza la última posición guardada sin volver a molestar
  // con el aviso del permiso (ver obtenerPosicion). Para no esperar a que responda, primero se pinta
  // con la última posición conocida (o la ciudad del perfil) y en cuanto llega la posición actual
  // (o si ya la teníamos) se actualizan lugar y tiempo.
  // 🔥 FIX permiso: el parámetro forzarPermiso que recibe ahora SÍ se usa -- antes se pasaba
  // siempre 'true' a obtenerPosicion(), así que el parámetro no servía para nada y el permiso
  // se pedía en cada arranque / vuelta a la app / cada 10 minutos.
  async function resolverUbicacion(forzarPermiso) {
    if (resolviendo) { pendiente = true; return; }   // v4.89: si llega otra petición (p. ej. login) mientras se resuelve, se repite al acabar
    resolviendo = true;
    try {
      if (!coords) {                                        // primer pintado rápido
        const u = leer(K_POS);
        let c0 = (u && isFinite(u.lat) && Date.now() - u.t < 10 * 60 * 1000) ? { lat: u.lat, lon: u.lon } : null;   // v4.89: solo si es de hace < 10 min (nunca pintar un lugar antiguo)
        if (c0) origen = 'gps';
        else {
          const mc = leerCiudad() || ciudad;
          if (mc) c0 = await geocodificar(mc);
          origen = c0 ? 'ciudad' : 'reloj';
        }
        if (c0) {
          coords = c0;
          lugar = (origen === 'gps') ? (leer(K_LUGAR + c0.lat.toFixed(2) + ',' + c0.lon.toFixed(2)) || {}).n || '' : '';
          await actualizar(false);
        }
      }
      let c = await obtenerPosicion(!!forzarPermiso);       // 🔥 FIX permiso: solo forzar si lo pide el usuario
      origen = c ? 'gps' : 'ciudad';
      const miCiudad = leerCiudad() || ciudad;
      if (!c && miCiudad) c = await geocodificar(miCiudad);
      if (!c) origen = 'reloj';
      coords = c;
      lugar = (origen === 'gps') ? (leer(K_LUGAR + c.lat.toFixed(2) + ',' + c.lon.toFixed(2)) || {}).n || '' : '';
      await actualizar(true);                       // v4.89: el tiempo se vuelve a pedir en cada apertura/recarga/login
      if (origen === 'gps' && !lugar) {            // el nombre llega después, sin retrasar el fondo
        nombreDeLugar(c).then((n) => { if (n && coords === c) { lugar = n; pintarTexto(); } });
      }
    } finally {
      resolviendo = false;
      if (pendiente) { pendiente = false; setTimeout(() => resolverUbicacion(), 0); }
    }
    return origen;
  }

  async function usarMiUbicacion() {
    // 🔥 FIX permiso: al tocar el tiempo, se limpia también la decisión guardada para
    // permitir que el navegador vuelva a preguntar (por si el usuario había dicho "no"
    // antes, o quiere refrescar la posición exacta). Es el único camino que vuelve a
    // pedir el permiso de forma explícita.
    try {
      localStorage.removeItem(K_POS);
      localStorage.removeItem(K_PERMISO);
    } catch (_) {}
    const o = await resolverUbicacion(true);
    if (window.Utils && Utils.showToast) {
      Utils.showToast(o === 'gps' ? '📍 Usando tu ubicación real' : 'No se pudo obtener tu ubicación; se usa la ciudad del perfil', o === 'gps' ? 'success' : 'info');
    }
  }

  function leerCiudad() {
    if (!cityEl) return '';
    const nom = document.getElementById('dashboardCityName');
    if (nom) return (nom.dataset.perfil || '').trim();   // ciudad del perfil (el texto visible puede ser tu ubicación real)
    const n = cityEl.firstChild;
    return ((n && n.nodeType === 3 ? n.textContent : '') || '').replace('📍', '').trim();
  }

  // ---------- escena ----------
  // Estilo minimalista: cielo en degradado suave, nubes difuminadas, pocas partículas
  // finas y lentas. Cada tiempo se distingue por su forma de moverse, no por la cantidad.
  const FACT_LLUVIA = [0, 0.6, 1, 1.35];
  const spriteCache = {};
  function spriteNube(rgb, firme) {
    const kc = rgb + (firme ? 'f' : '');
    if (spriteCache[kc]) return spriteCache[kc];
    const c = document.createElement('canvas'); c.width = 240; c.height = 130;   // 130: la nube central llega a y=124 y con 110 se cortaba en seco (línea recta visible)
    const x = c.getContext('2d');
    const puffs = [[44, 78, 30], [78, 66, 40], [116, 52, 48], [156, 62, 44], [190, 74, 32], [120, 78, 46]];
    for (const [px, py, pr] of puffs) {
      const g = x.createRadialGradient(px, py, 0, px, py, pr);
      if (firme) { g.addColorStop(0, `rgba(${rgb},.9)`); g.addColorStop(.62, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb},0)`); }
      else { g.addColorStop(0, `rgba(${rgb},.5)`); g.addColorStop(.55, `rgba(${rgb},.2)`); g.addColorStop(1, `rgba(${rgb},0)`); }
      x.fillStyle = g; x.beginPath(); x.arc(px, py, pr, 0, 6.2832); x.fill();
    }
    return (spriteCache[kc] = c);
  }

  function colorNube() {
    const k = scene.kind;
    if (!scene.day) return k === 'storm' ? '40,44,72' : '104,116,156';
    return { clear: '240,244,250', partly: '246,248,252', cloudy: '150,160,176', fog: '200,205,212', rain: '98,114,142', storm: '48,54,82', snow: '214,224,238' }[k] || '240,244,250';
  }

  function generar() {
    drops = []; flakes = []; clouds = []; stars = []; streaks = [];
    if (!W || !H) return;
    const k = scene.kind, esc = Math.min(1.5, Math.max(0.7, W / 340));
    const nNubes = { clear: 0, partly: scene.n, cloudy: 4, fog: 0, rain: 3, snow: 3, storm: 4 }[k] || 0;
    for (let i = 0; i < nNubes; i++) {
      const w = (k === 'cloudy' ? rnd(0.7, 1.15) : rnd(0.55, 0.9)) * W;
      clouds.push({ x: (i / Math.max(1, nNubes)) * W * 1.2 - w * 0.4 + rnd(-20, 20), y: (k === 'cloudy' ? rnd(-0.22, 0.28) : rnd(-0.08, 0.34)) * H, w, v: rnd(3, 6.5) * (1 + (scene.wind || 0) * 0.7), a: rnd(0.6, 1) });
    }
    if (!scene.day && (k === 'clear' || k === 'partly')) {
      const nEst = k === 'clear' ? 28 : 12;
      for (let i = 0; i < nEst; i++) stars.push({ x: rnd(0, W), y: rnd(0, H * 0.75), r: rnd(0.4, 1.1), ph: rnd(0, 6.28), sp: rnd(0.5, 1.4) });
    }
    if (k === 'rain' || k === 'storm') {
      const f = FACT_LLUVIA[scene.n] || 1, n = Math.round([0, 16, 40, 78][scene.n] * esc * 0.6);
      for (let i = 0; i < n; i++) {
        const lejos = Math.random() < 0.45;
        drops.push({
          x: rnd(-0.4 * H, W + 20), y: rnd(-H, H),
          v: H * (lejos ? rnd(0.8, 1.1) : rnd(1.2, 1.7)) * f,
          len: H * (lejos ? rnd(0.04, 0.06) : rnd(0.065, 0.09)) * (0.8 + 0.1 * scene.n),
          a: lejos ? rnd(0.12, 0.22) : rnd(0.24, 0.4), w: lejos ? 0.7 : 1
        });
      }
    }
    if (k === 'snow') {
      const n = Math.round([0, 28, 48, 76][scene.n] * esc * (light ? 0.85 : 0.6));
      for (let i = 0; i < n; i++) flakes.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.7, 1.7), v: H * rnd(0.12, 0.26), ph: rnd(0, 6.28), sw: rnd(4, 12), a: rnd(0.55, 0.9) });
    }
    if (scene.wind && (k === 'clear' || k === 'partly' || k === 'cloudy' || k === 'fog')) {
      const n = Math.round([0, 8, 11, 15][scene.wind] * 0.6);
      for (let i = 0; i < n; i++) {
        streaks.push({ x: rnd(-W, W), y: rnd(0.12, 0.88) * H, len: rnd(0.18, 0.4) * W, v: W * rnd(0.35, 0.6) * (0.75 + 0.4 * scene.wind), amp: rnd(2, 6), ph: rnd(0, 6.28), a: rnd(0.6, 1) });
      }
    }
    proxRayo = t + rnd(2, 5); doble = 0;
  }

  function colorFondo() {
    try {
      const m = getComputedStyle(hero).backgroundColor.match(/[\d.]+/g);
      if (m && m.length >= 3) bgRGB = [+m[0], +m[1], +m[2]];
    } catch (_) {}
    light = (0.299 * bgRGB[0] + 0.587 * bgRGB[1] + 0.114 * bgRGB[2]) > 140;
  }

  // [arriba rgb, abajo rgb, alfa arriba, alfa abajo]
  const CIELO = {
    day: {
      clear:  [[88, 160, 236], [150, 202, 246], .30, .12],
      partly: [[110, 160, 216], [160, 192, 222], .26, .12],
      cloudy: [[112, 124, 144], [146, 156, 172], .46, .22],
      fog:    [[168, 174, 182], [186, 190, 197], .36, .22],
      rain:   [[66, 90, 126], [94, 116, 148], .42, .20],
      storm:  [[40, 46, 78], [60, 66, 98], .58, .30],
      snow:   [[168, 190, 216], [200, 214, 232], .34, .18]
    },
    night: {
      clear:  [[12, 20, 56], [30, 34, 86], .60, .30],
      partly: [[18, 26, 60], [34, 38, 80], .56, .28],
      cloudy: [[30, 34, 52], [44, 48, 66], .58, .32],
      fog:    [[52, 56, 68], [64, 68, 80], .46, .26],
      rain:   [[20, 28, 50], [30, 40, 64], .58, .30],
      storm:  [[14, 16, 34], [26, 28, 50], .66, .36],
      snow:   [[36, 48, 80], [56, 70, 104], .50, .26]
    }
  };
  // Intensidad del fondo del tiempo (1 = antiguo, más llamativo). Suave por defecto: el protagonista es el contenido de la tarjeta.
  const SUAVE = { cielo: 0.4, nubes: 0.42, precip: 0.6, viento: 0.55, niebla: 0.55 };
  function cielo() {
    let [c1, c2, a1, a2] = (CIELO[scene.day ? 'day' : 'night'][scene.kind]) || CIELO.day.clear;
    if (light) {
      // modo claro: los grises neutros sobre el fondo claro se ven sucios; se tiñen hacia azul cielo y el
      // cielo luminoso (despejado, parcial, nieve) gana color; el de noche se queda suave para no ensuciar
      const mez = (c, t) => c.map((v, i) => Math.round(v * 0.76 + t[i] * 0.24));
      const t = scene.day ? [132, 184, 244] : [128, 138, 220];
      c1 = mez(c1, t); c2 = mez(c2, t);
    }
    const lum = scene.kind === 'clear' || scene.kind === 'partly' || scene.kind === 'snow';
    const m = light ? (scene.day ? (lum ? 1.75 : 1.3) : 0.6) : 1;
    const cap = light ? (scene.day ? (lum ? 0.64 : 0.52) : 0.32) : 0.85;
    const f = (light && scene.kind === 'snow') ? 0.85 : SUAVE.cielo;   // nieve en claro: el cielo necesita más cuerpo o el copo blanco no se ve
    return [c1, c2, Math.min(cap, a1 * m) * f, Math.min(cap, a2 * m) * f];
  }

  function paso(dt) {
    t += dt;
    for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 10) { c.x = -c.w; c.y = rnd(-0.08, 0.34) * H; } }
    for (const d of drops) {
      d.y += d.v * dt; d.x += d.v * dt * scene.slant;
      if (d.y > H + d.len) { d.y = -d.len; d.x = rnd(-0.4 * H, W + 20); }
    }
    for (const f of flakes) {
      f.y += f.v * dt; f.x += scene.slant * H * 0.8 * dt;
      if (f.y > H + 4) { f.y = -4; f.x = rnd(0, W); }
      if (f.x > W + 10) f.x = -10;
    }
    for (const s of streaks) { s.x += s.v * dt; if (s.x > W + 10) { s.x = -s.len - rnd(0, W * 0.5); s.y = rnd(0.12, 0.88) * H; } }
    if (scene.kind === 'storm') {
      flash = Math.max(0, flash - dt * 2.6);
      if (t > proxRayo) { flash = 1; proxRayo = t + rnd(6, 11); rayoX = rnd(0.3, 0.85) * W; doble = t + 0.2; }
      if (doble && t > doble) { flash = Math.max(flash, 0.65); doble = 0; }
    }
  }

  // Hueco libre de la columna derecha: entre la insignia de nivel (arriba) y la zapatilla (abajo,
  // que puede invadir esa columna). Se mide sobre el DOM real, así sirve en cualquier móvil y con
  // cualquier nombre de zapatilla (más larga = más baja). Sin insignia/zapatilla usa un valor fijo.
  function ubicarAstro() {
    tAstro = t;
    let x = W * 0.87, y = H * 0.55, r = H * 0.10;
    try {
      const hr = hero.getBoundingClientRect();
      const vis = (el) => el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
      const bR = vis(document.getElementById('dashboardLevelBadge'));
      const sR = vis(document.getElementById('dashboardShoe'));
      if (bR && bR.width) {
        const top = bR.bottom - hr.top + 3;
        let bottom = H - 3;
        if (sR && sR.width && sR.right > bR.left - 16) bottom = sR.top - hr.top - 3;
        const gap = bottom - top;
        r = Math.max(5, Math.min(H * 0.10, gap / 2 - 3));
        y = top + gap / 2;
        x = bR.left + bR.width / 2 - hr.left;
      }
    } catch (_) {}
    astro = { x: Math.max(r + 6, Math.min(W - r - 6, x)), y, r };
  }

  function dibujar() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    const k = scene.kind, d = scene.day;
    // cielo
    const [a, b, aa, ab] = cielo();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(${a[0]},${a[1]},${a[2]},${aa})`);
    g.addColorStop(1, `rgba(${b[0]},${b[1]},${b[2]},${ab})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // estrellas
    if (stars.length) {
      ctx.fillStyle = '#e6ebff';
      if (light) { ctx.shadowColor = 'rgba(40,52,120,.8)'; ctx.shadowBlur = 2.5; }
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    // (sol y luna del fondo eliminados: ahora los indica el icono animado del saludo)
    // nubes difuminadas
    if (clouds.length) {
      const cub = k === 'cloudy';
      const sp = spriteNube(colorNube(), cub), sombra = cub ? spriteNube(d ? '84,96,120' : '24,28,46', true) : ((light && k !== 'storm') ? spriteNube(d ? '84,112,164' : '40,50,104') : null);
      const base = (light ? 0.7 : 0.5) * ((k === 'cloudy' || k === 'rain' || k === 'storm') ? 1 : 0.8) * (d ? 1 : 0.85) * (cub ? 1.45 : 1) * ((light && !cub) ? (d ? 1.2 : 1.3) : 1) * SUAVE.nubes;
      for (const c of clouds) {
        const h = c.w * 130 / 240;
        if (sombra) { ctx.globalAlpha = (cub ? (light ? 0.5 : 0.38) : (light ? 0.46 : 0.22)) * c.a * SUAVE.nubes; ctx.drawImage(sombra, c.x, c.y + h * (cub ? 0.18 : (light ? 0.17 : 0.1)), c.w, h); }
        ctx.globalAlpha = Math.min(1, base * c.a); ctx.drawImage(sp, c.x, c.y, c.w, h);
      }
      ctx.globalAlpha = 1;
    }
    if (k === 'cloudy') {
      const tg = ctx.createLinearGradient(0, 0, 0, H * 0.7);
      const tc = d ? (light ? '70,82,104' : '20,24,36') : '10,12,24';
      tg.addColorStop(0, `rgba(${tc},${(light ? .22 : .34) * SUAVE.nubes})`); tg.addColorStop(1, `rgba(${tc},0)`);
      ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);
    }
    // niebla: bandas anchas y suaves a la deriva
    if (k === 'fog') {
      const col = d ? (light ? '112,134,170' : '226,230,236') : (light ? '92,104,152' : '150,156,172'), al = (light ? .5 : .36) * SUAVE.niebla;
      ctx.fillStyle = `rgba(${col},${(light ? .16 : .12) * SUAVE.niebla})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const rx = W * 0.6, span = W * 1.7;
        const cx = ((t * (5 + i * 2.5) + i * span / 3) % span) - W * 0.35, cy = H * (0.28 + i * 0.27);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.26);
        const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        fg.addColorStop(0, `rgba(${col},${al})`); fg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = fg; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
      }
    }
    // viento: hilos finos que cruzan la tarjeta
    if (streaks.length) {
      const wc = d ? (light ? '38,70,130' : '255,255,255') : (light ? '70,84,140' : '200,214,255');
      ctx.lineWidth = light ? 1.4 : 1.2; ctx.lineCap = 'round';
      for (const s of streaks) {
        const x0 = s.x, x1 = s.x + s.len;
        if (x1 < 0 || x0 > W) continue;
        const sg = ctx.createLinearGradient(x0, 0, x1, 0);
        sg.addColorStop(0, `rgba(${wc},0)`); sg.addColorStop(.55, `rgba(${wc},${Math.min(1, s.a * (light ? 1 : .85) * SUAVE.viento)})`); sg.addColorStop(1, `rgba(${wc},0)`);
        ctx.strokeStyle = sg; ctx.beginPath();
        for (let px = 0; px <= s.len; px += 8) {
          const yy = s.y + Math.sin(px * 0.028 + s.ph + t * 1.1) * s.amp;
          px === 0 ? ctx.moveTo(x0 + px, yy) : ctx.lineTo(x0 + px, yy);
        }
        ctx.stroke();
      }
    }
    // lluvia: trazos finos y cortos
    if (drops.length) {
      ctx.lineCap = 'round';
      const rc = light ? '38,70,130' : '190,212,255';
      for (const p of drops) {
        ctx.lineWidth = p.w + (light ? 0.35 : 0); ctx.strokeStyle = `rgba(${rc},${Math.min(.9, p.a * (light ? 1.9 : 1) * SUAVE.precip)})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.len * scene.slant, p.y - p.len); ctx.stroke();
      }
    }
    // nieve
    if (flakes.length) {
      if (light) {
        // modo claro: copo blanco con contorno azul grisáceo (un copo blanco sobre fondo claro no se ve)
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(58,92,150,.7)'; ctx.lineWidth = 1;
        for (const f of flakes) {
          ctx.globalAlpha = Math.min(1, f.a + .25);
          ctx.beginPath(); ctx.arc(f.x + Math.sin(t * 0.7 + f.ph) * f.sw, f.y, f.r * 1.45, 0, 6.2832); ctx.fill(); ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#fff';
        for (const f of flakes) { ctx.globalAlpha = Math.min(1, f.a * (0.5 + 0.5 * SUAVE.precip)); ctx.beginPath(); ctx.arc(f.x + Math.sin(t * 0.7 + f.ph) * f.sw, f.y, f.r, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }
    // tormenta: destello suave (sin rayo dibujado)
    if (k === 'storm' && flash > 0) {
      const R = H * 1.3, fg = ctx.createRadialGradient(rayoX, 0, 0, rayoX, 0, R);
      fg.addColorStop(0, `rgba(225,233,255,${flash * .42})`); fg.addColorStop(1, 'rgba(225,233,255,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(225,233,255,${flash * .08})`; ctx.fillRect(0, 0, W, H);
    }
    // velo del color de la tarjeta a la izquierda: el texto se lee siempre
    const sc = ctx.createLinearGradient(0, 0, W, 0);
    sc.addColorStop(0, `rgba(${bgRGB},${light ? .72 : .68})`); sc.addColorStop(.45, `rgba(${bgRGB},${light ? .64 : .6})`); sc.addColorStop(.75, `rgba(${bgRGB},${light ? .42 : .38})`); sc.addColorStop(1, `rgba(${bgRGB},${light ? .16 : .14})`);
    ctx.fillStyle = sc; ctx.fillRect(0, 0, W, H);
  }

  // ---------- bucle ----------
  function frame(ts) {
    raf = 0;
    if (!enPantalla || document.hidden) return;
    if (ts - tPrev < 33) { raf = requestAnimationFrame(frame); return; }   // ~30 fps
    const dt = Math.min(0.05, (ts - tPrev) / 1000);
    tPrev = ts; paso(dt); dibujar();
    raf = requestAnimationFrame(frame);
  }
  function arrancar() {
    if (reducido()) { dibujar(); return; }
    if (!raf && enPantalla && !document.hidden) { tPrev = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function medir() {
    if (!hero || !canvas) return;
    const w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h || (w === W && h === H)) return;
    W = w; H = h; astro = null; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generar(); dibujar();
  }

  function init() {
    if (iniciado) return;
    hero = document.getElementById('dashboardHero');
    canvas = document.getElementById('dashboardWeatherCanvas');
    cityEl = document.getElementById('dashboardCity');
    if (!hero || !canvas || !canvas.getContext) return;
    iniciado = true;
    ctx = canvas.getContext('2d');
    colorFondo(); medir();

    // primer pintado inmediato: último tiempo guardado (si es de hace < 3 h) o la hora del móvil
    const c = leer(K_NOW);
    if (c && c.cur && Date.now() - c.t < 3 * 3600 * 1000) aplicarEscena(escenaCur(c.cur), c.cur.temperature_2m);
    else aplicarEscena(escenaReloj(), null);

    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(hero);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        enPantalla = es[0].isIntersecting;
        if (enPantalla) { medir(); arrancar(); }
      }).observe(hero);
    } else { enPantalla = true; }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      colorFondo(); resolverUbicacion(); arrancar();     // ← ahora no fuerza el permiso del GPS
    });
    new MutationObserver(() => { colorFondo(); if (reducido() || !raf) dibujar(); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (cityEl) {
      new MutationObserver(() => {
        const nueva = leerCiudad(); pintarTexto();
        if (nueva !== ciudad) { ciudad = nueva; if (origen !== 'gps') resolverUbicacion(); }
      }).observe(cityEl, { childList: true });
      cityEl.addEventListener('click', (e) => {
        if (e.target && e.target.closest && e.target.closest('#dashboardWeatherTemp, #dashboardCityName')) usarMiUbicacion();
      });
    }
    window.addEventListener('resize', () => pintarTexto());
    setInterval(() => { if (!document.hidden) resolverUbicacion(); }, TTL);   // ← ahora no fuerza el permiso
    ciudad = leerCiudad();
    resolverUbicacion();                              // ← ahora no fuerza el permiso
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  function refrescar() { return resolverUbicacion(); }   // v4.89: llamado al iniciar sesión
  return { init, usarMiUbicacion, refrescar, emoji: emojiActual, icono, _t: { aplicarEscena, escenaDe, dibujar, paso, medir, generar } };
})();
window.WeatherFX = WeatherFX;