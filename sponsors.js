// ==================== sponsors.js ====================
// NUEVO MÓDULO. Gestiona las "tiendas patrocinadoras" que aparecen como
// banner en el Dashboard (Inicio) y dentro del aviso de kilometraje de
// zapatillas, a cambio de material/descuentos para los usuarios de RI5.
//
// Versión: 1.12
// - Nuevo precargarBannerInicio(): se llama desde AppState.precargarDatos
//   (app.js), en paralelo con la precarga del muro y AWAITEADA como ella
//   -- antes de que se oculte el splash de entrada. Consulta la tienda
//   activa y fuerza además la descarga de su imagen (_precargarImagen,
//   con new Image() y un timeout de seguridad de 3s) antes de devolver
//   el control. renderBannerInicio() (la que pinta de verdad la tarjeta)
//   consume ese resultado ya listo la primera vez, así que al entrar a
//   la app el banner del Dashboard -- imagen incluida -- ya está
//   completo desde el primer instante, sin ningún parpadeo ni "aparece
//   tarde". Repintados posteriores del Dashboard (cambiar de pestaña y
//   volver) siguen consultando Firestore de verdad, como antes.
// Versión: 1.11
// - Panel de admin: el contador de clics pasa de ir junto a la píldora
//   de descuento a la esquina superior derecha de la tarjeta (posición
//   absoluta), dejando la fila de abajo solo para la píldora de
//   descuento (si la tienda tiene uno configurado).
// Versión: 1.10
// - Panel de admin: la tarjeta pasa a tener el MISMO aspecto que la del
//   Dashboard (_tarjetaHTML) -- imagen grande, etiqueta "🤝 Tienda
//   colaboradora", nombre, descripción y píldora de descuento -- en vez
//   de su propio diseño más reducido. Se mantiene lo propio del admin:
//   la imagen sigue siendo el interruptor activo/inactivo (toca para
//   activar/desactivar) y, cuando está activa, tanto el aro de la
//   imagen como el fondo/borde de toda la tarjeta se tiñen con el color
//   de NIVEL del admin (igual que ya hacía la v1.6). Donde el Dashboard
//   tiene el botón "IR A LA TIENDA", aquí van EDITAR/ELIMINAR a partes
//   iguales, debajo del todo. El contador de clics se mantiene, ahora
//   junto a la píldora de descuento en vez de bajo la foto.
// Versión: 1.9
// - Panel de admin: mismo patrón de precarga+caché que ya usan otras
//   listas de la app (historial de sesiones enviadas, explorar
//   usuarios). Antes, cada vez que se abría la pestaña Administración >
//   Tienda se volvía a pedir la lista entera a Firestore, con un
//   "Cargando..." de por medio. Ahora: `precargarAdminLista()` se lanza
//   sola en segundo plano en cuanto la app está lista (evento
//   'ri5:appready', con red de seguridad por si sponsors.js carga
//   después de que ya haya disparado), deja la lista pintada en su
//   contenedor aunque la pestaña esté oculta -- igual que hace
//   session-invites.js con su historial. `cargarAdminLista()` (la que
//   dispara abrir la pestaña) ya no toca Firestore si eso ya pasó: la
//   lista aparece directa, sin carga. Solo se vuelve a pedir de verdad
//   cuando hay un cambio real -- crear/editar/eliminar una tienda
//   (`guardar()`/`eliminar()`, vía la nueva `_recargarAdminListaDesde
//   Firestore()`) -- activar/desactivar sigue sin consultar nada, como
//   ya hacía desde la v1.6. NOTA: no se ha tocado app.js (no se subió
//   en esta ronda) -- lo suyo sería que `AppState.precargarDatos()`
//   también llamara a esto para ir totalmente en línea con el patrón
//   centralizado del resto de módulos, pero enganchado directamente al
//   evento 'ri5:appready' funciona igual sin necesidad de tocarlo.
// Versión: 1.8
// - Tras ver la v1.7, tres ajustes más: (1) "editar"/"eliminar" se
//   reducen (padding y font-size menores, radio 8px) -- seguían
//   pareciendo grandes. (2) el color de nivel del admin, al ser el
//   borde/fondo de la tarjeta lo único que marca "activa", podía no
//   distinguirse bien en modo oscuro con algunos niveles -- el borde
//   pasa de 1px a 2px cuando está activa y el tinte de fondo sube de
//   ~10% a ~20% de opacidad (de '1A' a '33' en hex-alpha), más
//   contraste sin cambiar de color. (3) quitada la insignia ✓ de la
//   esquina de la foto -- ya era redundante, la tarjeta entera (fondo +
//   borde) deja claro el estado activo/inactivo.
// Versión: 1.7
// - Ajustes menores sobre la v1.6 del panel de admin, a petición del
//   usuario: "editar" y "eliminar" pasan a flex:1 (ocupan el mismo
//   ancho exacto cada uno, ya no depende de si el texto es más largo);
//   el contador de clics pierde el emoji 👆 (queda solo "N clics").
//   Cambios de index.html en la misma ronda (no en este archivo): el
//   título de la sección pasa de "TIENDAS PATROCINADORAS" a "TIENDAS
//   COLABORADORAS"; el modal de alta/edición pierde el botón de texto
//   "Elegir foto de la tienda" (la imagen ya era clicable de por sí,
//   ahora es la ÚNICA forma de cambiarla) y reduce ligeramente sus
//   márgenes para no necesitar scroll.
// Versión: 1.6
// - REVERTIDO el rediseño v1.5 (chips rellenos + píldora de estado
//   separada) a petición del usuario, volviendo a la base v1.4 (foto
//   como interruptor único, sin píldora de estado aparte) y aplicando
//   sobre ESA base los cambios que pidió tras verla:
//   (1) foto/logo más grande (44px -> 64px), con la insignia ✓ de la
//       esquina reducida (16px -> 13px) para no quedar desproporcionada.
//   (2) nombre completo: ya no se trunca con "..." (antes
//       white-space:nowrap+ellipsis), ahora salta de línea si hace falta.
//   (3) el contador de clics baja de la fila de botones a quedar debajo
//       de la foto, en su propia columna.
//   (4) "editar"/"eliminar" vuelven al estilo de botón con borde simple
//       (sin relleno de color) que ya usa el resto de la app, y el de
//       eliminar pierde también su emoji 🗑️ (pasa a texto "ELIMINAR"),
//       igual que se pidió con "editar" en la v1.4.
//   (5) al pulsar activar/desactivar ya NO se recarga la lista entera
//       desde Firestore (eso mostraba "Cargando..." un instante) --
//       toggleActivo() ahora repinta al instante desde los datos que ya
//       tiene en memoria (_pintarListaAdmin), sin ninguna consulta
//       adicional ni parpadeo.
//   (6) si la tienda está activa, la tarjeta (fondo, borde, aro de la
//       foto e insignia ✓) usa el color del NIVEL de gamificación del
//       propio admin (Gamification.getColorByLevel, el mismo que ya
//       colorea su nombre/avatar en el resto de la app) en vez de un
//       verde fijo -- se pide una vez por carga de la pestaña
//       (_obtenerColorNivelAdmin) y se cachea en memoria, así que no
//       añade ninguna consulta extra al activar/desactivar.
// Versión: 1.5
// - REDISEÑO visual (panel de admin, a petición del usuario sobre una
//   captura con anotaciones): la tarjeta gana sombra y radio mayor
//   (16px). Se añade de vuelta un indicador de estado, pero esta vez
//   como una píldora pequeña (punto de color + "ACTIVA"/"INACTIVA") en
//   la esquina superior derecha de la cabecera, en el hueco vacío junto
//   al nombre que el usuario señaló -- sigue llamando a toggleActivo, lo
//   mismo que ya hacía tocar la foto. La insignia de clics gana un
//   circulito de icono con tinte azul. Los botones de acción pasan de
//   contorno plano a "chips" rellenos: EDITAR en dorado (se mantiene sin
//   emoji de lápiz, como se pidió en la v1.4) y eliminar como círculo
//   relleno en tono rosado con su 🗑️.
// Versión: 1.4
// - REDISEÑO (panel de admin, a petición del usuario, sobre una
//   captura con anotaciones): la fila inferior de cada tarjeta se
//   reorganiza en dos grupos. (1) Los clics pasan de texto suelto a una
//   pequeña insignia redondeada (píldora con borde, número en negrita)
//   en vez de ir mezclados con el aviso de "sin enlace todavía" en la
//   misma línea de texto. (2) El botón "editar" pierde el emoji ✏️ (a
//   petición expresa) y pasa a texto "EDITAR"; el botón eliminar
//   conserva su 🗑️, que no se pidió quitar. Ambos siguen llamando
//   exactamente a lo mismo (abrirFormulario / eliminar).
// Versión: 1.3
// - REDISEÑO (panel de admin, a petición del usuario): se elimina del
//   todo el botón "ACTIVA/INACTIVA" -- el nombre de la tienda ahora
//   ocupa ese hueco entero (flex:1 ya lo tenía, simplemente ya no hay
//   nada con lo que competir por sitio). En su lugar, la propia
//   foto/logo del colaborador es el interruptor: un toque sobre ella
//   llama a lo mismo que llamaba el botón (toggleActivo), sin tocar esa
//   función. El estado se lee en dos sitios a la vez -- aro + insignia
//   ✓ en verde (var(--realizado-color), el mismo verde que ya usa la
//   app para "sesión realizada") alrededor de la foto, y un tinte verde
//   sutil en toda la tarjeta -- para que se note aunque la foto sea
//   pequeña o no tenga imagen subida todavía (queda el emoji 🏬 con el
//   mismo aro).
// Versión: 1.2
// - FIX: En el panel de admin, el botón "✅ ACTIVA / ⛔ INACTIVA" (con
//   emoji + palabra larga y max-width:45% del ancho de la fila) podía
//   quedarse con más ancho que el propio nombre de la tienda (flex:1),
//   cortándolo con "...". Se sustituye el emoji por un punto de color de
//   6px y se acortan las etiquetas a "ACTIVA"/"INACTIVA", con menos
//   padding y una fuente algo menor -- el botón ocupa ahora solo lo que
//   necesita su texto, sin un ancho mínimo artificial, dejando mucho más
//   sitio al nombre.
// - MEJORA: la tarjeta del banner del Dashboard usaba el mismo fondo
//   plano (var(--bg-secondary)) que cualquier otra tarjeta de
//   estadísticas del Dashboard, así que un patrocinador que pagara por
//   aparecer ahí se confundía visualmente con "sesiones esta semana" o
//   "calorías". Ahora lleva un tinte dorado sutil (gradiente + borde en
//   rgba(192,160,96,...)) para leerse de un vistazo como contenido
//   patrocinado, sin cambiar su estructura ni sus colores de texto. De
//   paso, la descripción pasa de 1 a 2 líneas en esta versión grande
//   (la del aviso de zapatillas, más pequeña, se queda en 1 línea).
// Versión: 1.1
// - FIX: Se ajusta el diseño de la parte inferior de la tarjeta para
//   evitar que el botón "IR A LA TIENDA" se salga de su contenedor en
//   pantallas estrechas. Antes tenía flex-shrink:0 y white-space:nowrap,
//   lo que forzaba su ancho mínimo y provocaba desbordamiento si el
//   descuento o el propio texto del botón eran largos. Ahora se permite
//   que el botón se encoja (flex-shrink:1, min-width:0) y que su texto
//   pueda partirse en varias líneas (text-align:center, word-break),
//   reduciendo además ligeramente su padding y tamaño de fuente para
//   que quede más compacto y estéticamente dentro de la tarjeta.
// - Colección Firestore 'sponsors': cada documento es una tienda
//   patrocinadora (nombre, descripción, descuento, enlace, imagen, activo,
//   orden, clics). Se permite crear una tienda SIN enlace todavía (queda
//   forzada a activo:false hasta que se rellene un enlace real) para poder
//   montar toda la ficha ahora y activarla en cuanto llegue la URL.
// - Reutiliza el sistema de zapatilla YA EXISTENTE en gamification.js
//   (currentShoe.km, ver Gamification.getCurrentShoe) en vez de duplicar
//   el cálculo de distancia -- así no se toca la lógica delicada de
//   reconciliación de km de gamification.js. El seguimiento de "a qué
//   umbral ya se avisó" vive por completo aquí, en el propio documento
//   'gamification/{uid}' pero en campos NUEVOS y separados
//   (zapatillaAlertaKm / zapatillaAlertaNombre) para no interferir con
//   nada que ya existiera.
// - El contador de clics es un único campo 'clics' por tienda (se
//   incrementa tanto desde el banner del Dashboard como desde el aviso de
//   zapatillas -- son el mismo botón, la misma tienda).
//
// IMPORTANTE (pendiente de configurar fuera de este archivo):
// - Reglas de Firestore: hay que permitir lectura de 'sponsors' a
//   cualquier usuario autenticado y escritura solo a administradores,
//   igual que ya se hace con el resto de datos de admin en tu
//   firestore.rules. Este archivo no puede tocar esas reglas.
// - Reglas de Storage: si se sube una foto de tienda, se guarda en
//   'sponsor_images/{sponsorId}.jpg' -- añade una regla equivalente a la
//   de 'profile_pictures' pero restringiendo la escritura a admin.
// ======================================================================

const Sponsors = {
  COLECCION: 'sponsors',

  // A partir de este kilometraje se considera razonable empezar a pensar
  // en cambiar de zapatillas, y a partir de ahí se recuerda otra vez cada
  // INTERVALO_KM (500, 600, 700...). Son constantes fáciles de ajustar si
  // alguna vez quieres mover el umbral.
  UMBRAL_INICIAL_KM: 500,
  INTERVALO_KM: 100,

  // Caché en memoria (no persistida) de las últimas tiendas cargadas,
  // indexadas por id -- así los botones "Ver oferta" solo necesitan el id
  // (evita tener que escapar la URL entera dentro de un atributo onclick).
  _mapaSponsors: {},
  _ultimaListaAdmin: {},
  _adminListaRenderizada: false,
  _cargandoAdminListaPromise: null,
  _colorNivelAdmin: null,
  _imagenPendiente: null,
  _editandoId: null,

  // Resultado de precargarBannerInicio() (llamada durante el arranque
  // desde AppState.precargarDatos, ver más abajo): la tienda activa que
  // le toca mostrar al Dashboard, con su imagen ya descargada por el
  // navegador. renderBannerInicio() la consume UNA sola vez -- la
  // primera vez que pinta de verdad el Dashboard -- y a partir de ahí
  // vuelve a consultar Firestore en cada llamada, como siempre.
  _sponsorPrecargado: null,
  _bannerYaPrecargado: false,

  // ================== LECTURA / BANNER PÚBLICO ==================

  async getActivos() {
    try {
      const snap = await firebaseServices.db.collection(this.COLECCION)
        .where('activo', '==', true)
        .get();
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Orden en el cliente (no en la query) a propósito: así no hace
      // falta crear ningún índice compuesto en Firestore para esto.
      lista.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      lista.forEach(sp => { this._mapaSponsors[sp.id] = sp; });
      return lista;
    } catch (error) {
      console.error('Error cargando tiendas patrocinadoras:', error);
      return [];
    }
  },

  async getTodos() {
    try {
      const snap = await firebaseServices.db.collection(this.COLECCION).get();
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lista.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      return lista;
    } catch (error) {
      console.error('Error cargando lista completa de tiendas:', error);
      return [];
    }
  },

  // Se llama desde el botón "Ir a la tienda", tanto en el banner del
  // Dashboard como dentro del aviso de zapatillas. Busca la tienda en la
  // caché de la última carga (getActivos ya la rellenó) para no depender
  // de escapar el enlace dentro del HTML.
  abrir(id) {
    const sp = this._mapaSponsors[id];
    if (!sp) return;
    const enlace = (sp.enlace || '').trim();
    if (!/^https?:\/\//i.test(enlace)) {
      Utils.showToast('El enlace de esta tienda todavía no está configurado', 'info');
      return;
    }
    window.open(enlace, '_blank');
    firebaseServices.db.collection(this.COLECCION).doc(sp.id)
      .update({ clics: firebaseServices.FieldValue.increment(1) })
      .catch(err => console.warn('No se pudo registrar el clic:', err));
  },

  // Construye la tarjeta (imagen/emoji + nombre + descuento + botón).
  // 'compacta' se usa dentro del aviso de zapatillas, donde hay menos
  // espacio disponible que en el banner grande del Dashboard.
  _tarjetaHTML(sp, compacta = false) {
    const nombre = Utils.escapeHTML(sp.nombre || 'Tienda colaboradora');
    const descripcion = sp.descripcion ? Utils.escapeHTML(sp.descripcion) : '';
    const descuento = sp.descuento ? Utils.escapeHTML(sp.descuento) : '';
    const imagen = sp.imagenUrl
      ? `<img src="${Utils.escapeHTML(sp.imagenUrl)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='🏬';">`
      : `<span style="font-size:${compacta ? '26px' : '30px'};">🏬</span>`;
    const tamañoImg = compacta ? 56 : 68;

    // FIX: La píldora de descuento ahora puede encogerse (flex-shrink:1,
    // min-width:0) y su texto puede partirse en varias líneas, para no
    // forzar el ancho del contenedor flex en pantallas pequeñas.
    const pillDescuento = descuento
      ? `<div style="display:inline-flex; align-items:center; padding:4px 10px; background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.35); border-radius:20px; font-size:10px; color:var(--gold); white-space:normal; overflow:hidden; text-overflow:ellipsis; max-width:100%; flex-shrink:1; min-width:0; word-break:break-word;">🏷️ ${descuento}</div>`
      : `<span></span>`;

    return `
      <div style="display:flex; align-items:flex-start; gap:${compacta ? '12px' : '14px'};">
        <div style="width:${tamañoImg}px; height:${tamañoImg}px; flex-shrink:0; border-radius:14px; overflow:hidden; background:var(--bg-primary); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center;">
          ${imagen}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:9px; letter-spacing:1px; color:var(--gold); text-transform:uppercase; margin-bottom:3px;">🤝 Tienda colaboradora</div>
          <div style="font-size:${compacta ? '14px' : '15px'}; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${nombre}</div>
          ${descripcion ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:2px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:${compacta ? 1 : 2}; -webkit-box-orient:vertical;">${descripcion}</div>` : ''}
        </div>
      </div>
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; margin-top:14px; width:100%;">
        ${pillDescuento}
        <button onclick="Sponsors.abrir('${sp.id}')" style="flex: 0 1 auto; min-width: 0; box-sizing:border-box; max-width:100%; padding:${compacta ? '8px 12px' : '9px 14px'}; border-radius:10px; background:var(--gold); color:#0a0a0a; font-weight:700; font-size:${compacta ? '10px' : '11px'}; line-height:1.2; letter-spacing:0.3px; border:none; cursor:pointer; text-align:center; word-break:break-word; -webkit-text-size-adjust:100%; text-size-adjust:100%;">IR A LA TIENDA</button>
      </div>
    `;
  },

  // Se llama automáticamente al arrancar la app (ver AppState.precargarDatos
  // en app.js), EN PARALELO con la precarga del muro y AWAITEADA igual que
  // ella: para cuando se oculta el splash y el usuario entra a la app, la
  // tienda patrocinadora ya está consultada Y su imagen ya está descargada
  // por el navegador (ver _precargarImagen más abajo) -- así
  // renderBannerInicio(), la que de verdad pinta la tarjeta, no tiene que
  // esperar a nada y no hay ningún parpadeo ni "aparece tarde" de la
  // imagen. Si algo falla aquí, no pasa nada grave: renderBannerInicio()
  // simplemente hará su propia consulta a Firestore como haría sin esta
  // precarga.
  async precargarBannerInicio() {
    try {
      const activos = await this.getActivos();
      this._sponsorPrecargado = activos[0] || null;
      if (this._sponsorPrecargado?.imagenUrl) {
        await this._precargarImagen(this._sponsorPrecargado.imagenUrl);
      }
      this._bannerYaPrecargado = true;
    } catch (error) {
      console.error('Error precargando el banner de tienda:', error);
      this._sponsorPrecargado = null;
      this._bannerYaPrecargado = false;
    }
  },

  // Fuerza al navegador a descargar y decodificar la imagen antes de
  // devolver el control, para que cuando el HTML de la tarjeta se inserte
  // de verdad en el Dashboard, la imagen salga ya de la caché del propio
  // navegador en vez de pedirse por red en ese momento -- eso era lo que
  // causaba el parpadeo (tarjeta ya visible, hueco de imagen en blanco un
  // instante, foto apareciendo con retraso).
  _precargarImagen(url) {
    return new Promise((resolve) => {
      if (!url) { resolve(); return; }
      const img = new Image();
      let resuelto = false;
      const terminar = () => { if (!resuelto) { resuelto = true; resolve(); } };
      img.onload = terminar;
      img.onerror = terminar;
      img.src = url;
      // Salvaguarda: una imagen que tarde demasiado (red muy lenta) no
      // debe retrasar el arranque de la app para siempre -- además, el
      // splash ya tiene su propio timeout general de seguridad (8s).
      setTimeout(terminar, 3000);
    });
  },

  // Se llama al cargar/refrescar el Dashboard. No bloquea nada del resto
  // de la carga: si falla o no hay tiendas activas, simplemente oculta la
  // tarjeta sin mostrar ningún error al usuario.
  async renderBannerInicio() {
    const container = document.getElementById('dashboardSponsorCard');
    if (!container) return;
    try {
      // Si ya se precargó al arrancar (ver precargarBannerInicio, llamada
      // desde AppState.precargarDatos junto con el muro), se reutiliza esa
      // tienda YA CONSULTADA -- con su imagen ya descargada por el
      // navegador -- en vez de volver a pedirla a Firestore. Así esta
      // llamada, la que de verdad pinta la tarjeta en el Dashboard, es
      // instantánea la primera vez y no hay ningún parpadeo. Solo se
      // consume una vez: cualquier repintado posterior (reabrir la
      // pestaña Dashboard, o tras activar/desactivar/guardar/eliminar
      // desde el panel de admin) vuelve a consultar Firestore de verdad.
      let sp;
      if (this._bannerYaPrecargado) {
        this._bannerYaPrecargado = false;
        sp = this._sponsorPrecargado;
      } else {
        const activos = await this.getActivos();
        sp = activos[0] || null;
      }
      if (!sp) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      container.innerHTML = this._tarjetaHTML(sp, false);
      // Tinte dorado sutil (en vez del mismo fondo plano que el resto de
      // tarjetas del Dashboard) para que se note a simple vista que esto
      // es contenido patrocinado y no una estadística más.
      container.style.background = 'linear-gradient(135deg, rgba(192,160,96,0.10), var(--bg-secondary) 65%)';
      container.style.border = '1px solid rgba(192,160,96,0.35)';
      container.style.display = 'block';
    } catch (error) {
      console.error('Error pintando el banner de tienda:', error);
      container.style.display = 'none';
    }
  },

  // ================== AVISO DE KILOMETRAJE DE ZAPATILLAS ==================

  // Se llama justo después de marcar una sesión como completada (ver
  // calendar.js). No debe interrumpir ni ralentizar ese flujo si algo
  // falla aquí -- por eso quien llama la envuelve en try/catch.
  async comprobarUmbralZapatilla(uid) {
    if (!uid || !window.Gamification) return;
    const shoe = await Gamification.getCurrentShoe(uid);
    if (!shoe || !isFinite(shoe.km)) return;

    const ref = firebaseServices.db.collection('gamification').doc(uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};

    let alertaKmPrevia = data.zapatillaAlertaKm || 0;
    const alertaNombrePrevio = data.zapatillaAlertaNombre || null;

    // Si ha cambiado de zapatilla desde el último aviso (o es la primera
    // vez), el seguimiento se reinicia: los km de la zapatilla nueva
    // empiezan desde 0, así que no tendría sentido conservar el umbral
    // de la anterior.
    if (alertaNombrePrevio !== shoe.name) {
      alertaKmPrevia = 0;
    }

    const umbralCruzado = this._calcularUmbralCruzado(alertaKmPrevia, shoe.km);

    if (umbralCruzado) {
      await ref.set({ zapatillaAlertaKm: umbralCruzado, zapatillaAlertaNombre: shoe.name }, { merge: true });
      await this.mostrarAlertaZapatillas(shoe, umbralCruzado);
    } else if (alertaNombrePrevio !== shoe.name) {
      // Solo hubo cambio de zapatilla, sin llegar todavía a cruzar el
      // primer umbral: se guarda igualmente el reinicio para que la
      // próxima comprobación parta de 0, no del valor de la zapatilla
      // anterior.
      await ref.set({ zapatillaAlertaKm: 0, zapatillaAlertaNombre: shoe.name }, { merge: true });
    }
  },

  // Devuelve el escalón (500, 600, 700...) que se ha cruzado por primera
  // vez entre 'previo' y 'actual', o null si no se ha cruzado ninguno
  // nuevo todavía.
  _calcularUmbralCruzado(previo, actual) {
    if (actual < this.UMBRAL_INICIAL_KM) return null;
    const pasos = Math.floor((actual - this.UMBRAL_INICIAL_KM) / this.INTERVALO_KM);
    const umbralActual = this.UMBRAL_INICIAL_KM + pasos * this.INTERVALO_KM;
    return umbralActual > previo ? umbralActual : null;
  },

  async mostrarAlertaZapatillas(shoe, umbral) {
    const overlay = document.getElementById('zapatillaAlertaOverlay');
    const modal = document.getElementById('zapatillaAlertaModal');
    const contenido = document.getElementById('zapatillaAlertaContenido');
    if (!overlay || !modal || !contenido) return;

    const nombre = Utils.escapeHTML(shoe.name || 'tu zapatilla actual');
    let promoHTML = '';
    try {
      const activos = await this.getActivos();
      if (activos.length) {
        promoHTML = `
          <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--border-color);">
            ${this._tarjetaHTML(activos[0], true)}
          </div>
        `;
      }
    } catch (e) { /* si falla la promo, se muestra igualmente el aviso */ }

    contenido.innerHTML = `
      <div style="text-align:center; font-size:40px; margin-bottom:8px;">👟</div>
      <h3 style="margin:0 0 10px; text-align:center; color:var(--gold);">HORA DE PENSAR EN UNAS ZAPATILLAS NUEVAS</h3>
      <p style="text-align:center; color:var(--text-secondary); font-size:13px; line-height:1.5; margin:0;">
        <strong style="color:var(--text-primary);">${nombre}</strong> ya lleva <strong style="color:var(--gold);">${umbral} km</strong>.
        A partir de aquí la amortiguación empieza a perder efectividad y aumenta el riesgo de lesión.
      </p>
      ${promoHTML}
    `;

    overlay.style.display = 'block';
    modal.style.display = 'block';
  },

  cerrarAlertaZapatillas() {
    const overlay = document.getElementById('zapatillaAlertaOverlay');
    const modal = document.getElementById('zapatillaAlertaModal');
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
  },

  // ================== PANEL DE ADMINISTRACIÓN ==================
  // Mismo patrón ya usado en otras listas de la app (historial de
  // sesiones enviadas, explorar usuarios): se precarga en segundo plano
  // en cuanto la app está lista (evento 'ri5:appready'), y la pestaña
  // solo pide a Firestore de verdad la PRIMERA vez que no hay nada
  // todavía. A partir de ahí, abrir la pestaña es instantáneo -- solo se
  // vuelve a consultar cuando hay un cambio real (crear/editar/eliminar
  // una tienda; activar/desactivar no consulta nada, se repinta desde lo
  // que ya se sabe).

  // Se llama automáticamente al arrancar la app (ver el listener de
  // 'ri5:appready' al final del archivo). Si ya se había precargado o
  // pintado antes en esta sesión, no hace nada.
  async precargarAdminLista() {
    if (!AppState.isAdmin) return;
    if (this._adminListaRenderizada || this._cargandoAdminListaPromise) return;
    this._cargandoAdminListaPromise = this._recargarAdminListaDesdeFirestore()
      .finally(() => { this._cargandoAdminListaPromise = null; });
    return this._cargandoAdminListaPromise;
  },

  // Se llama al abrir de verdad la pestaña Administración > Tienda. Si
  // ya está todo pintado (precarga ya hecha), no toca nada -- aparece
  // directo, sin "Cargando..." ni parpadeo.
  async cargarAdminLista() {
    if (!AppState.isAdmin) return;
    const container = document.getElementById('adminPatrocinadoresList');
    if (!container) return;
    if (this._adminListaRenderizada) return;
    if (this._cargandoAdminListaPromise) { await this._cargandoAdminListaPromise; return; }
    // Solo se llega aquí si la precarga automática todavía no ha
    // terminado (o no llegó a dispararse) -- primera vez de verdad,
    // esqueleto breve mientras se pide a Firestore.
    container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:20px; font-size:13px;">Cargando...</div>';
    await this._recargarAdminListaDesdeFirestore();
  },

  // Única función que de verdad consulta Firestore para esta lista.
  async _recargarAdminListaDesdeFirestore() {
    const lista = await this.getTodos();
    this._ultimaListaAdmin = {};
    lista.forEach(sp => { this._ultimaListaAdmin[sp.id] = sp; });
    // Color de nivel del propio admin (para teñir las tarjetas activas).
    // Se pide UNA vez aquí y se guarda en memoria -- toggleActivo() la
    // reutiliza sin volver a pedir nada, para que activar/desactivar sea
    // instantáneo.
    this._colorNivelAdmin = await this._obtenerColorNivelAdmin();
    this._pintarListaAdmin(lista);
    this._adminListaRenderizada = true;
  },

  // Se puede llamar al cerrar sesión (si algún día se engancha en
  // app.js, junto a los demás Xxx.detenerListenerYyy() de
  // AppState.detenerListeners()) para que un admin distinto que entre
  // después en el mismo navegador no vea la lista de otro cacheada.
  // No es indispensable: como no hay ningún listener en tiempo real
  // abierto (solo caché en memoria), no hay nada que "se quede pegado"
  // salvo recargar la página, que ya limpia toda la memoria de por sí.
  resetCachePanelAdmin() {
    this._adminListaRenderizada = false;
    this._cargandoAdminListaPromise = null;
    this._colorNivelAdmin = null;
  },

  // Color hexadecimal (p.ej. '#c0a060') del nivel de gamificación del
  // propio admin, usando el mismo Gamification.getColorByLevel que ya
  // colorea el nombre/avatar/insignias en el resto de la app. Si algo
  // falla (doc inexistente, módulo no cargado todavía), cae al dorado
  // fijo de la app para no romper nada.
  async _obtenerColorNivelAdmin() {
    try {
      const doc = await firebaseServices.db.collection('gamification').doc(AppState.currentUserId).get();
      const nivel = doc.exists ? (doc.data().level || 1) : 1;
      return (window.Gamification && Gamification.getColorByLevel) ? Gamification.getColorByLevel(nivel) : '#c0a060';
    } catch (error) {
      console.error('Error obteniendo color de nivel del admin:', error);
      return '#c0a060';
    }
  },

  // Pinta la lista completa a partir de datos YA EN MEMORIA (sin tocar
  // Firestore ni mostrar "Cargando..."). La usan tanto cargarAdminLista()
  // tras su única consulta real, como toggleActivo() para refrescar al
  // instante después de activar/desactivar.
  _pintarListaAdmin(lista) {
    const container = document.getElementById('adminPatrocinadoresList');
    if (!container) return;
    if (!lista.length) {
      container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:20px; font-size:13px;">Todavía no has añadido ninguna tienda.</div>';
      return;
    }
    const colorNivelAdmin = this._colorNivelAdmin || '#c0a060';
    container.innerHTML = lista.map(sp => this._tarjetaAdminHTML(sp, colorNivelAdmin)).join('');
  },

  // Mismo aspecto que la tarjeta del Dashboard (_tarjetaHTML): imagen +
  // etiqueta "🤝 Tienda colaboradora" + nombre + descripción + píldora de
  // descuento. Se le añaden dos cosas propias del panel de admin: (1) la
  // imagen sigue siendo el interruptor activo/inactivo (toca para llamar
  // a toggleActivo), con su aro y el fondo/borde de toda la tarjeta
  // tiñéndose con el color de NIVEL del admin cuando está activa -- igual
  // que antes, para que el estado se note de un vistazo; (2) donde el
  // Dashboard tiene el botón "IR A LA TIENDA", aquí van EDITAR/ELIMINAR a
  // partes iguales (flex:1 cada uno).
  _tarjetaAdminHTML(sp, colorNivelAdmin) {
    const nombre = Utils.escapeHTML(sp.nombre || '(sin nombre)');
    const descripcion = sp.descripcion ? Utils.escapeHTML(sp.descripcion) : '';
    const descuento = sp.descuento ? Utils.escapeHTML(sp.descuento) : '';
    const sinEnlace = !/^https?:\/\//i.test(sp.enlace || '');
    const activo = !!sp.activo;
    const imagen = sp.imagenUrl
      ? `<img src="${Utils.escapeHTML(sp.imagenUrl)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='🏬';">`
      : `<span style="font-size:30px;">🏬</span>`;

    const pillDescuento = descuento
      ? `<div style="display:inline-flex; align-items:center; padding:4px 10px; background:rgba(192,160,96,0.12); border:1px solid rgba(192,160,96,0.35); border-radius:20px; font-size:10px; color:var(--gold); white-space:normal; overflow:hidden; text-overflow:ellipsis; max-width:100%; flex-shrink:1; min-width:0; word-break:break-word;">🏷️ ${descuento}</div>`
      : `<span></span>`;

    return `
      <div style="position:relative; background:${activo ? colorNivelAdmin + '33' : 'var(--bg-secondary)'}; border:${activo ? '2px' : '1px'} solid ${activo ? colorNivelAdmin : 'var(--border-color)'}; border-radius:16px; padding:14px; margin-bottom:10px; transition:background 0.2s ease, border-color 0.2s ease;">
        <div style="position:absolute; top:10px; right:12px; font-size:10px; color:var(--text-secondary); white-space:nowrap;">
          <span style="color:var(--text-primary); font-weight:700;">${sp.clics || 0}</span> clics
        </div>
        <div style="display:flex; align-items:flex-start; gap:14px; padding-right:52px;">
          <div onclick="Sponsors.toggleActivo('${sp.id}')" style="width:68px; height:68px; flex-shrink:0; border-radius:14px; overflow:hidden; background:var(--bg-primary); border:2px solid ${activo ? colorNivelAdmin : 'var(--border-color)'}; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            ${imagen}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:9px; letter-spacing:1px; color:var(--gold); text-transform:uppercase; margin-bottom:3px;">🤝 Tienda colaboradora</div>
            <div style="font-size:15px; font-weight:600; color:var(--text-primary); white-space:normal; word-break:break-word; line-height:1.25;">${nombre}</div>
            ${descripcion ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:2px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${descripcion}</div>` : ''}
            ${sinEnlace ? '<div style="font-size:11px; color:#c99ba5; margin-top:4px;">sin enlace todavía</div>' : ''}
          </div>
        </div>
        ${descuento ? `<div style="margin-top:14px;">${pillDescuento}</div>` : ''}
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button onclick="Sponsors.abrirFormulario('${sp.id}')" style="flex:1; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); border-radius:8px; padding:5px 0; font-size:10px; font-weight:700; letter-spacing:0.3px; cursor:pointer; white-space:nowrap; text-align:center;">EDITAR</button>
          <button onclick="Sponsors.eliminar('${sp.id}')" style="flex:1; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); border-radius:8px; padding:5px 0; font-size:10px; font-weight:700; letter-spacing:0.3px; cursor:pointer; white-space:nowrap; text-align:center;">ELIMINAR</button>
        </div>
      </div>
    `;
  },

  async toggleActivo(id) {
    const sp = this._ultimaListaAdmin[id];
    if (!sp) return;
    const nuevoEstado = !sp.activo;
    if (nuevoEstado && !/^https?:\/\//i.test(sp.enlace || '')) {
      Utils.showToast('Añade primero un enlace válido antes de activarla', 'error');
      return;
    }
    try {
      await firebaseServices.db.collection(this.COLECCION).doc(id).update({ activo: nuevoEstado });
      sp.activo = nuevoEstado;
      // Sin recarga ni "Cargando...": se repinta al instante desde los
      // datos que ya están en memoria (_pintarListaAdmin), sin volver a
      // pedir nada a Firestore -- a petición expresa del usuario.
      const lista = Object.values(this._ultimaListaAdmin).sort((a, b) => (a.orden || 0) - (b.orden || 0));
      this._pintarListaAdmin(lista);
      this.renderBannerInicio();
    } catch (error) {
      console.error('Error cambiando estado de la tienda:', error);
      Utils.showToast('Error: ' + error.message, 'error');
    }
  },

  abrirFormulario(id = null) {
    const overlay = document.getElementById('sponsorFormOverlay');
    const modal = document.getElementById('sponsorFormModal');
    if (!overlay || !modal) return;

    this._editandoId = id;
    this._imagenPendiente = null;

    const sp = id ? this._ultimaListaAdmin[id] : null;
    document.getElementById('sponsorFormTitulo').textContent = id ? 'EDITAR TIENDA' : 'NUEVA TIENDA';
    document.getElementById('sponsorFormNombre').value = sp?.nombre || '';
    document.getElementById('sponsorFormDescripcion').value = sp?.descripcion || '';
    document.getElementById('sponsorFormDescuento').value = sp?.descuento || '';
    document.getElementById('sponsorFormEnlace').value = sp?.enlace || '';
    document.getElementById('sponsorFormActivo').checked = !!sp?.activo;
    this._pintarPreviewImagen(sp?.imagenUrl || null);

    overlay.style.display = 'block';
    modal.style.display = 'block';
  },

  cerrarFormulario() {
    const overlay = document.getElementById('sponsorFormOverlay');
    const modal = document.getElementById('sponsorFormModal');
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
    this._editandoId = null;
    this._imagenPendiente = null;
  },

  _pintarPreviewImagen(url) {
    const preview = document.getElementById('sponsorFormImagenPreview');
    if (!preview) return;
    preview.innerHTML = url
      ? `<img src="${Utils.escapeHTML(url)}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`
      : `<span style="font-size:24px;">🏬</span>`;
  },

  seleccionarImagen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const comprimida = (window.Profile && Profile.compressImageToTarget)
          ? await Profile.compressImageToTarget(file, 1200, 1.5 * 1024 * 1024)
          : file;
        this._imagenPendiente = comprimida;
        const urlLocal = URL.createObjectURL(comprimida);
        this._pintarPreviewImagen(urlLocal);
      } catch (error) {
        console.error('Error procesando la imagen de la tienda:', error);
        Utils.showToast('Error al procesar la imagen', 'error');
      }
    };
    input.click();
  },

  async guardar() {
    if (!AppState.isAdmin) return;
    const nombre = document.getElementById('sponsorFormNombre').value.trim();
    if (!nombre) {
      Utils.showToast('Ponle un nombre a la tienda', 'error');
      return;
    }
    const descripcion = document.getElementById('sponsorFormDescripcion').value.trim();
    const descuento = document.getElementById('sponsorFormDescuento').value.trim();
    let enlace = document.getElementById('sponsorFormEnlace').value.trim();
    if (enlace && !/^https?:\/\//i.test(enlace)) enlace = 'https://' + enlace;
    let activo = document.getElementById('sponsorFormActivo').checked;

    if (activo && !enlace) {
      activo = false;
      Utils.showToast('Se guarda como inactiva: todavía no tiene enlace', 'info');
    }

    Utils.showLoading();
    try {
      const ref = this._editandoId
        ? firebaseServices.db.collection(this.COLECCION).doc(this._editandoId)
        : firebaseServices.db.collection(this.COLECCION).doc();

      const datos = {
        nombre, descripcion, descuento, enlace, activo,
        actualizadoEn: firebaseServices.Timestamp.now()
      };
      if (!this._editandoId) {
        datos.orden = 0;
        datos.clics = 0;
        datos.creadoEn = firebaseServices.Timestamp.now();
      }
      await ref.set(datos, { merge: true });

      if (this._imagenPendiente) {
        const storageRef = firebaseServices.storage.ref(`sponsor_images/${ref.id}.jpg`);
        await storageRef.put(this._imagenPendiente);
        const imagenUrl = await storageRef.getDownloadURL();
        await ref.update({ imagenUrl });
      }

      Utils.hideLoading();
      Utils.showToast('✅ Tienda guardada', 'success');
      this.cerrarFormulario();
      // Cambio real de datos: aquí SÍ hay que volver a preguntarle a
      // Firestore de verdad (cargarAdminLista() ya no haría nada, cree
      // que ya está todo pintado).
      this._recargarAdminListaDesdeFirestore();
      this.renderBannerInicio();
    } catch (error) {
      Utils.hideLoading();
      console.error('Error guardando la tienda:', error);
      Utils.showToast('Error: ' + error.message, 'error');
    }
  },

  async eliminar(id) {
    const sp = this._ultimaListaAdmin[id];
    const confirmado = await Utils.confirm(
      'ELIMINAR TIENDA',
      `¿Eliminar "${sp?.nombre || 'esta tienda'}" de forma permanente? Se perderá también su contador de clics.`
    );
    if (!confirmado) return;

    Utils.showLoading();
    try {
      await firebaseServices.db.collection(this.COLECCION).doc(id).delete();
      try { await firebaseServices.storage.ref(`sponsor_images/${id}.jpg`).delete(); } catch (e) { /* puede no tener imagen */ }
      Utils.hideLoading();
      Utils.showToast('Tienda eliminada', 'success');
      this._recargarAdminListaDesdeFirestore();
      this.renderBannerInicio();
    } catch (error) {
      Utils.hideLoading();
      console.error('Error eliminando la tienda:', error);
      Utils.showToast('Error: ' + error.message, 'error');
    }
  }
};

window.Sponsors = Sponsors;

// Precarga automática del panel de admin en cuanto la app está lista
// (mismo disparador que ya usa el splash de arranque). Se comprueba
// primero si el splash YA se ocultó -- si sponsors.js tarda en cargar
// respecto al inline del splash, el evento 'ri5:appready' puede haber
// disparado ya y no volver a verse nunca.
(function() {
  function intentarPrecargarAdmin() {
    if (window.AppState && AppState.isAdmin && window.Sponsors && Sponsors.precargarAdminLista) {
      Sponsors.precargarAdminLista();
    }
  }
  if (document.body && !document.body.classList.contains('ri5-booting')) {
    intentarPrecargarAdmin();
  } else {
    window.addEventListener('ri5:appready', intentarPrecargarAdmin);
  }
})();

console.log('✅ sponsors.js v1.12 - Banner del Dashboard precargado (datos + imagen) durante el arranque, junto al muro, sin parpadeo');