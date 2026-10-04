// ==================== sw.js - Service Worker RI5 ====================
// Versión: 5.03 - Bump de caché (v535 -> v536): WeatherFX -- al usar la posición real muestra «24° en Alicante» si el lugar no coincide con la ciudad del perfil
//                (geocodificación inversa Nominatim, cacheada por coordenadas); bloque del tiempo en su propia línea.
// Versión: 5.02 - Bump de caché (v534 -> v535): WeatherFX usa la posición real (permiso pedido una sola vez, ~1 km, precisión baja) con la ciudad del perfil de respaldo.
// Versión: 5.01 - Bump de caché (v533 -> v534): WeatherFX -- fondo animado (sol, noche, nubes, niebla, lluvia, nieve, tormenta) en #dashboardHero
//                con el tiempo real de la ciudad del perfil (Open-Meteo). Cualquier otro host sigue pasando por el fetch genérico sin cachearse.
// Versión: 5.00 - Bump de caché (v532 -> v533): app.js -- el modal de lista de usuarios del admin aparece directo al quitarse la pantalla de carga
//                (antes entraba con fundido y dejaba ver la pantalla de detrás); además se ignora el doble toque mientras carga.
// Versión: 4.99 - Bump de caché (v531 -> v532): cierre directo de todos los modales (sin fundido de salida); el fundido de entrada se mantiene.
// Versión: 4.98 - Bump de caché (v530 -> v531): cierre unificado de todos los modales: fundido a transparente de caja y fondo a la vez, 0.15 s.
// Versión: 4.97 - Bump de caché (v529 -> v530): cierre de modales -- la caja se desvanece en 0.1 s (poco texto de detrás visible) y el fondo
//                en 0.2 s sin retraso (sin tramo de pantalla negra).
// Versión: 4.96 - Bump de caché (v528 -> v529): cierre de modales sincronizado (0.2 s caja y fondo); el fondo oscuro se desvanece por
//                background-color + backdrop-filter en vez de opacity, para no ver de golpe lo de detrás ni un negro intermedio.
// Versión: 4.95 - Bump de caché (v527 -> v528): cierre de modales en dos tiempos (caja 0.12 s, fondo 0.2 s con 0.1 s de retraso).
// Versión: 4.94 - Bump de caché (v526 -> v527): fundido unificado (0.28 s al abrir, 0.2 s al cerrar) en modales estáticos (CSS),
//                modales creados por JS (app.js) y subpestañas; quitado el zoom de insignias/récords y el desplazamiento de riFadeInUp.
// Versión: 4.93 - Bump de caché (v525 -> v526): index.html/app.js -- eliminado transform:none en :active y la clase .ri5-no-press,
//                que anulaban translate(-50%,-50%) y dejaban el modal descentrado (abajo a la derecha).
// Versión: 4.92 - Bump de caché (v524 -> v525): index.html -- eliminado el scale() de las reglas :active (tarjetas, botones, zonas, navegación).
// Versión: 4.91 - Bump de caché (v523 -> v524): la caja de los modales ya no hace scale(0.96) al pulsar (regla :active por
//                atributo style* de index.html casaba con el modal); fix global en index.html + app.js.
// Versión: 4.90 - Bump de caché (v522 -> v523): app.js -- guardián de touchmove que impide que el scroll de la página de detrás
//                se mueva mientras hay un modal abierto (cambiar zapatilla, perfil de amigo, etc.).
// Versión: 4.89 - Bump de caché (v521 -> v522): modales con max-height 90dvh + overflow-y:auto (index.html, profile.js, app.js,
//                training.js, friends.js, calendar.js) para que los botones nunca queden fuera de pantalla.
// Versión: 4.88 - Bump de caché (v520 -> v521): session-invites.js -- el modal de invitación de sesión (normal, fuerza, descanso y
//                «sin zonas») tiene cuerpo con scroll y pie fijo con ACEPTAR/RECHAZAR, así una sesión larga ya no los tapa.
// Versión: 4.87 - Bump de caché (v517 -> v518): index.html -- Solicitudes (Recibidas/Enviadas/Entrenador) con el mismo estilo que el resto de
//                pestañas de la app: texto sin caja, el activo en color principal con raya dorada debajo.
// Versión: 4.86 - Bump de caché (v516 -> v517): index.html, wall.js -- al tocar la notificación de «me gusta» (icono Comunidad o pestaña Muro),
//                tras llegar a la publicación (Muro o Perfil) se abre directamente la lista de quién le dio me gusta, y el aviso se apaga.
// Versión: 4.85 - Bump de caché (v515 -> v516): index.html -- en Comunidad > Solicitudes, el botón activo (Recibidas / Enviadas /
//                Entrenador) se pinta en dorado con borde y tinte; y al volver a entrar se marca «Recibidas», que es la lista que se muestra.
// Versión: 4.84 - Bump de caché (v514 -> v515): calendar.js, gamification.js, profile.js -- desmarcar/eliminar una sesión lo deja TODO
//                como antes: la sesión editada en profundidad vuelve a lo planificado, se revierte el XP exacto, el mejor ritmo
//                y la insignia/flag «GPS activado», y se limpia la caché de gamificación.
// Versión: 4.83 - Bump de caché (v513 -> v514): index.html, guia.html -- el modal de novedades suma «Tu ruta, pintada por zonas»
//                (RI5_VERSION_NOVEDADES -> 'ri5-v514', en línea con la caché) y la guía lo recoge en «Grabar con GPS».
// Versión: 4.82 - Bump de caché (v512 -> v513): calendar.js, gps-tracker.js, profile.js -- desmarcar una sesión (del plan o extra) lo
//                deja TODO como antes: se borra la clave de sesionesRealizadas (antes 'false', y el contador del plan la
//                contaba), la calificación, los datos de ruta del plan y la ruta GPS guardada (gpsTrackDocId); tanto al
//                desmarcar desde el calendario como al eliminar desde el perfil.
// Versión: 4.81 - Bump de caché (v511 -> v512): calendar.js, profile.js -- (1) el calendario del plan ya no crece ni encoge al
//                cambiar de mes (altura fija de 6 filas). (2) Eliminar un entreno desde el perfil lo deja todo como antes:
//                si era una sesión extra el día deja de pintarse como doble; si era del plan se quitan también su
//                calificación y su ruta GPS; se recalculan forma física y zonas usadas y se revierten los minutos Z4/Z5.
// Versión: 4.80 - Bump de caché (v510 -> v511): guia.html -- en el índice de la guía, "RI5 Premium" pasa al final
//                (último tema, solo en su fila y centrado).
// Versión: 4.79 - Bump de caché (v509 -> v510): calendar.js, app.js, index.html, guia.html -- al guardar una sesión extra, el día del
//                calendario se pinta del color del nivel del atleta (diasDobles en el plan); modal de novedades nuevo
//                (RI5_VERSION_NOVEDADES -> 'ri5-v510') y guía actualizada (sesión extra, días dobles, editar bloques).
// Versión: 4.78 - Bump de caché (v508 -> v509): calendar.js, gps-tracker.js, session-invites.js -- botón «➕ SESIÓN EXTRA DE HOY»
//                bajo el calendario: permite registrar un segundo entreno el mismo día (con GPS o a mano) sin tocar la
//                sesión del plan; se guarda como un entreno más (muro, historial, carga y gamificación) con fecha de hoy.
// Versión: 4.77 - Bump de caché (v507 -> v508): session-invites.js -- añadir, quitar o mover un bloque del generador de sesiones
//                ya no repinta el modal: la fila se inserta/quita/recoloca directamente en pantalla (nada de lo escrito se
//                pierde y el scroll no se mueve). Solo cambiar el tipo de sesión repinta, con los datos por defecto.
// Versión: 4.76 - Bump de caché (v506 -> v507): session-invites.js -- al añadir, quitar o mover un bloque (o cambiar el tipo)
//                el generador de sesiones ya no pierde lo escrito en el Paso 1 ni vuelve arriba del todo: guarda el
//                formulario completo y conserva la posición del scroll.
// Versión: 4.75 - Bump de caché (v505 -> v506): gps-tracker.js -- el aviso de la parte principal de una sesión de series dice
//                cuántas series, de cuántos metros o minutos, en qué zona y con qué descanso (ej. «6 series de 400 metros en
//                zona 5 con descanso de 1 minuto en zona 2»).
// Versión: 4.74 - Bump de caché (v504 -> v505): session-invites.js -- los bloques del generador de sesiones se pueden REORDENAR
//                arrastrando (asa de puntos en cada bloque, sin emojis); por ejemplo, en una sesión de series se puede
//                añadir una carrera y ponerla la primera. gps-tracker.js vuelve a su versión v5.8 (sin pasos «Series» extra).
// Versión: 4.73 - Bump de caché (v503 -> v504): gps-tracker.js -- los esfuerzos cortos (3 series de 100-200 m en 10 km) ya no se
//                diluyen: 500 puntos, cada tramo se pinta del color puro de su zona (sin pasar por zonas intermedias), un filtro
//                solo quita saltos de un único tramo, y la leyenda lista exactamente las zonas dibujadas (sin umbral de %).
// Versión: 4.72 - Bump de caché (v502 -> v503): gps-tracker.js, gps-track-viewer.js -- la leyenda lista solo las zonas que
//                realmente se ven en el track dibujado (exactamente los colores dibujados), no las que quedan diluidas por el suavizado.
// Versión: 4.71 - Bump de caché (v501 -> v502): gps-tracker.js -- el track guardado pasa de 80 a 300 puntos y la zona de cada
//                tramo se calcula con el ritmo de una ventana de 24 s (no entre puntos vecinos): más detalle y menos ruido.
// Versión: 4.70 - Bump de caché (v500 -> v501): session-invites.js, gps-tracker.js -- el desplegable ofrece 3 palabras equivalentes:
//                Calentamiento / Preparación / Activación y Enfriamiento / Vuelta a la calma / Estiramientos. Los cálculos
//                reconocen el bloque con _esCalent/_esEnfria (varias palabras), ya no con una palabra clave exacta.
// Versión: 4.69 - Bump de caché (v499 -> v500): session-invites.js -- el título de los pasos de calentamiento y de
//                enfriamiento/estiramientos pasa a ser un desplegable con opciones coherentes (todas conservan la palabra clave
//                que usan los cálculos y el GPS), para que el entrenador no escriba títulos que la app no reconozca.
// Versión: 4.68 - Bump de caché (v498 -> v499): gps-tracker.js -- cada paso se clasifica por tipo (calentamiento, enfriamiento,
//                principal, otro). Un título libre del entrenador («Estiramientos»...) ya no cuenta como parte principal.
// Versión: 4.67 - Bump de caché (v497 -> v498): gps-tracker.js -- el aviso de voz «series en zona X con descanso en zona 2» solo
//                se da en la parte principal; calentamiento/enfriamiento se detectan también con otros títulos.
// Versión: 4.66 - Bump de caché (v496 -> v497): index.html, profile.js, friends.js -- el nombre de la zapatilla ya no se sale
//                del recuadro (Dashboard, pasaporte del Perfil y ficha de amigos): pasa a 2 líneas sin recortar el nombre.
// Versión: 4.65 - Bump de caché (v495 -> v496): session-invites.js -- el calendario del Paso 2 siempre ocupa 6 filas, así
//                el modal ya no cambia de tamaño al pasar de un mes a otro.
// Versión: 4.64 - Bump de caché (v494 -> v495): sponsors.js -- etiqueta "Tienda colaboradora" y texto de la píldora de
//                descuento con color de texto del tema (buen contraste en fondo oscuro y claro) cuando la tienda tiene color.
// Versión: 4.63 - Bump de caché (v493 -> v494): training.js (el color de nivel queda solo en la fecha y el @usuario; RI5 y el
//                resto vuelven al dorado), sponsors.js + index.html (color de cada tienda elegido por el admin).
// Versión: 4.62 - Bump de caché (v492 -> v493): training.js -- la tarjeta que se comparte desde Entreno lleva el color
//                de nivel del usuario (título, cifras, resplandor, marco, líneas, cartel) y la fecha.
// Versión: 4.61 - Bump de caché (v491 -> v492): sponsors.js -- banner de tienda del Dashboard teñido con el color de
//                nivel del usuario, con brillo animado y halo suave.
// Versión: 4.60 - Bump de caché (v490 -> v491): wall.js -- FIX línea negra horizontal en la miniatura cacheada del
//                mapa: rendija sin pintar entre filas de teselas (JPEG convierte lo transparente en negro). Ahora se
//                pinta un fondo y las teselas se solapan; mapSnapshotV 5 regenera las miniaturas.
// Versión: 4.59 - Bump de caché (v489 -> v490): gps-tracker.js, gps-track-viewer.js, wall.js, profile.js --
//                (1) el track por zonas cambia de color de forma progresiva (degradado) en vez de cortes directos;
//                (2) miniatura del Perfil = mismo mini-mapa del Muro (zoom 16 centrado en la llegada) en vez del
//                dibujo esquemático gris; (3) imagen cacheada del mini-mapa al doble de resolución (mapSnapshotV 4).
// Versión: 4.58 - Bump de caché (v488 -> v489): wall.js, profile.js, gps-track-viewer.js -- (1) miniatura del muro/perfil
//                sin track: mapa a zoom 16 centrado en la llegada con la bandera; las imágenes cacheadas antiguas
//                (mapSnapshot sin mapSnapshotV 3) se regeneran; (2) visor: si el track entero obliga a un zoom
//                menor de 15, se usa zoom 15 centrado en la llegada en vez de un mapa borroso.
// Versión: 4.57 - Bump de caché (v487 -> v488): gps-tracker.js, gps-track-viewer.js, wall.js, profile.js --
//                el track de las sesiones con GPS se pinta por tramos, cada uno del color de la zona a la que
//                se corrió (zona por tramo calculada al guardar con las zonas del usuario; campo trackZonas en
//                globalFeed). Visor con leyenda de zonas; sesiones antiguas siguen en dorado.
// Versión: 4.56 - Bump de caché (v486 -> v487): session-invites.js, auth.js -- al cerrar sesión se vacían las
//                listas de atletas y grupos en memoria; antes sobrevivían al logout y se repetía el mismo resultado.
// Versión: 4.55 - Bump de caché (v485 -> v486): session-invites.js -- la carga de la lista de usuarios
//                muestra CARGANDO con letras de colores de nivel en lugar del esqueleto de filas grises.
// Versión: 4.54 - Bump de caché (v484 -> v485): session-invites.js -- precarga de atletas y grupos nada más
//                pulsar crear sesión / pack de sesiones; quitados los textos "Cargando..." de los botones.
// Versión: 4.53 - Bump de caché (v483 -> v484): session-invites.js -- quitado el botón REINTENTAR y el mensaje de
//                error del paso 3: si la carga falla se ve el esqueleto y se reintenta sola hasta cargar.
// Versión: 4.52 - Bump de caché (v482 -> v483): session-invites.js -- la lista de destinatarios del paso 3
//                tiene respaldos en cada paso (ids: servidor -> estado en vivo -> copia local; datos: 3 intentos
//                -> caché Firestore -> copia local) y el aviso "Todavía no tienes ningún atleta" solo sale con 0
//                atletas aceptados confirmados.
// Versión: 4.51 - Bump de caché (v481 -> v482): session-invites.js -- FIX "Todavía no tienes ningún
//                atleta" en el paso 3 de Generar sesión aunque el entrenador sí tuviera atletas
//                aceptados: un fallo de carga quedaba guardado como lista vacía hasta recargar.
//                Ahora se lee documento a documento, no se cachea el fallo y hay botón REINTENTAR.
// Versión: 4.50 - Bump de caché (v478 -> v479): gamification.js, gps-tracker.js, calendar.js, guia.html --
//                auditoría de insignias: 50 insignias, todas conseguibles (ritmo, velocidad y hora del
//                día solo con GPS real; sin insignias de desnivel), 11 niveles nuevos (50/150/300/500/
//                1000/1500/2000/3000/5000/6000 km) y guía actualizada.
// Versión: 4.49 - Bump de caché (v477 -> v478): app.js, friends.js, session-invites.js --
//                (1) el sello de entrenador verificado también sale en la tarjeta
//                "Entrenado por" del perfil (nuevo Utils.selloVerificado); (2) al editar
//                una sesión, el botón "GUARDAR Y CONTINUAR" se cortaba en "GUARDAR Y":
//                ahora pone "CONTINUAR" (el guardado real se confirma en el modal siguiente).
// Versión: 4.48 - Bump de caché (v476 -> v477): training.js -- ZONE_COLORS (calcular zonas,
//                dashboard y zonas de los últimos 30 días) pasa a tonos suavizados: mismos
//                colores (azul, verde, amarillo, naranja, rojo, morado) menos intensos.
//                Las barras de predicción de carrera usan ahora esa misma paleta.
// Versión: 4.47 - Bump de caché (v475 -> v476): index.html -- el modal "Zonas · últimos
//                30 días" (puntos de color de cada zona) usa ZONE_COLORS, igual que el
//                resto del dashboard.
// Versión: 4.46 - Bump de caché (v474 -> v475): index.html, guia.html --
//                el dashboard (tarjeta de zonas y gráfico de zonas usadas) usa ahora
//                ZONE_COLORS, los mismos colores que las zonas calculadas, en vez de
//                los grises de Z5/Z6; guía con el tema "Entrenador verificado" y el
//                último botón del índice centrado.
// Versión: 4.45 - Bump de caché (v473 -> v474): app.js, index.html, friends.js, profile.js --
//                insignia de entrenador verificado (la concede el admin con título;
//                sello junto a "Entrenador", al pulsarlo muestra el título) y buscador
//                inteligente de usuarios (filtra por cualquier parte del nombre).
// Versión: 4.44 - Bump de caché (v446 -> v447): session-invites.js, calendar.js --
//                FIX parpadeo/salto al pulsar "📤 REENVIAR A MIS ALUMNOS": mismo
//                motivo ya conocido de otros fixes (v3.72/v3.73 más abajo en este
//                changelog) -- el botón cerraba el modal de detalle de la sesión
//                (con su propio fundido de salida) en el mismo instante en que se
//                abría el generador (con su propio fundido de entrada), dos
//                animaciones independientes solapándose. Ahora calendar.js ya no
//                cierra el detalle antes de llamar a reenviarSesionDelPlan();
//                session-invites.js marca un flag de un solo uso (_abrirSinFade)
//                que hace que _renderPaso1() pinte el generador opaco desde el
//                primer instante (sin los 0.2s de fundido de _crearOverlayModal) y,
//                con el overlay nuevo ya tapándolo del todo, cierra entonces sí el
//                detalle de la sesión -- sin ningún frame en el que se vea el
//                cambio.
// Versión: 4.43 - Bump de caché (v445 -> v446): session-invites.js, calendar.js --
//                petición del usuario: un entrenador que recibe una sesión de su
//                propio entrenador (plan 'personalizado') puede ahora reenviarla tal
//                cual a sus propios alumnos. Nuevo botón "📤 REENVIAR A MIS ALUMNOS"
//                en el detalle de sesión del calendario (calendar.js,
//                abrirDetalleSesion; visible solo si AppState.isTrainer y el plan
//                actual es 'personalizado'), que llama a la nueva
//                SessionInvites.reenviarSesionDelPlan(sesion): reutiliza
//                _prepararEditableDesdeSesion (la misma conversión que ya usa
//                editarSesionDelPlan) y entra al compositor por el flujo normal --
//                elegir día(s) nuevos y destinatarios de cero, de la propia lista de
//                alumnosAceptados (nunca los del entrenador superior) -- en vez de
//                quedarse fijado al día en que la recibió.
// Versión: 4.42 - Bump de caché (v444 -> v445): guia.html -- "Marcar sesiones" explica el
//                modal único CONFIRMAR / EDITAR EN PROFUNDIDAD y cómo cuentan los km de
//                las carreras extra.
// Versión: 4.41 - Bump de caché (v443 -> v444): calendar.js v2.70, session-invites.js v15.3 --
//                modal único CONFIRMAR / EDITAR EN PROFUNDIDAD; el reparto de km ya no
//                deja recuperación/extra a 0 y la distancia sugerida cuenta la recuperación.
// Versión: 4.40 - Bump de caché (v442 -> v443): calendar.js, session-invites.js --
//                al marcar una sesión como realizada sale EDITAR SESIÓN / CONFIRMAR;
//                los km de la carrera extra ya no salen a 0 (reparto por ritmo de zona).
// Versión: 4.39 - Bump de caché (v438 -> v439): auth.js, calendar.js,
//                profile.js, index.html -- petición del usuario, en tres
//                partes. (1) Se quita el ✨ del modal de premium y, de paso,
//                el resto de emojis decorativos de ese modal (🔒, 📋 y los
//                iconos de cada fila): tono más serio. (2) Auth.
//                showPremiumBenefits(origen) deja de ser un texto genérico
//                y explica según desde dónde se abre: 'perfil' -- Standard:
//                "tu suscripción actual es Standard", lo que incluye y "si
//                actualizas a Premium ganarás..."; Premium: "eres Premium y
//                con ello tienes...", con nota si es por ser entrenador y
//                sin contacto de Instagram --; 'calendario' (pulsar una
//                sesión), 'proxima-sesion' (tarjeta del Dashboard),
//                'nuevo-plan' (+ NUEVO PLAN y generar plan) y 'borrar-plan'
//                tienen cada uno su texto y destacan primero la función
//                que se acaba de intentar usar. Un usuario que ya es
//                premium ve siempre la versión "eres Premium", vengas de
//                donde vengas. La píldora del perfil lee ahora
//                AppState.isPremium (no userData.premium) para no
//                contradecirse con el modal que abre. (3) Modal de
//                novedades actualizado de septiembre a octubre (contenido
//                sacado de los cambios reales desde v413) y su
//                identificador RI5_VERSION_NOVEDADES sube a 'ri5-v439' para
//                que vuelva a mostrarse a quien ya vio el de septiembre.
//                Además, la precarga del SW (install) pide ahora cada archivo con
//                cache:'reload' en vez de cache.addAll(), para que la caché nueva
//                nunca se llene con copias viejas de la caché HTTP del hosting.
// Versión: 4.38 - Bump de caché (v437 -> v438): auth.js, profile.js --
//                petición del usuario: el modal de Auth.showPremiumBenefits
//                decía siempre "🔒 Esta es una función premium. Hazte
//                premium..." arriba del todo, aunque se abriera desde la
//                píldora STANDARD/PREMIUM del perfil -- y ahí no tiene
//                sentido, porque consultar tu plan no es chocar con
//                ninguna función bloqueada. Ahora la función acepta un
//                origen ('muro', por defecto, o 'perfil') y solo dice
//                "esto es una función premium" cuando se abre de verdad
//                desde un muro (día de calendario, "+ NUEVO PLAN",
//                tarjeta "Próxima sesión"); desde el perfil dice "📋 Esta
//                es la diferencia entre los dos planes de RI5" (o, si ya
//                eres premium, "✨ Este es tu plan: Premium. Esto es lo
//                que incluye:"). La comparativa Standard/Premium de
//                debajo y el CTA de contacto (oculto si ya eres premium)
//                se mantienen igual, solo cambia el aviso de arriba.
// Versión: 4.37 - Bump de caché (v436 -> v437): calendar.js, auth.js,
//                index.html, profile.js -- dos peticiones seguidas del
//                usuario sobre la pantalla "NECESITAS PREMIUM" del
//                calendario (con su ⭐ dentro de un círculo rojo en la
//                captura) que quedaron sin su propio bump de caché hasta
//                ahora: (1) mostrarCalendario() y
//                mostrarUltimoPlanGuardado() ya NO sustituyen la rejilla
//                entera por una pantalla de "sin acceso" cuando
//                _puedeVerPlanActual() da negativo -- eso se ha
//                eliminado (_renderizarCalendarioSinAcceso ya no
//                existe), junto con el ⭐ que llevaba dentro. El
//                calendario y las sesiones se ven siempre, como antes de
//                esa protección; el control de acceso queda solo en
//                abrirDetalleSesion() (comprobado en el momento del
//                clic, con el AppState.isPremium más reciente -- así que
//                si el usuario se hace premium o le hacen entrenador con
//                la app abierta, no hace falta recargar nada, el
//                calendario ya se pintaba entero). (2) El modal premium
//                (Auth.showPremiumBenefits) ya no es un texto fijo de
//                venta: genera su título y su contenido según
//                AppState.isPremium, con una comparativa real de qué
//                incluye STANDARD y qué añade PREMIUM (calculadora de
//                zonas 3/mes vs ilimitada, generar planes propios,
//                historial de planes, soporte prioritario...) y sin el
//                aviso "hazte premium" ni el contacto de Instagram
//                cuando el usuario ya es premium o entrenador -- no
//                tenía sentido venderle premium a quien ya lo tiene. La
//                píldora "STANDARD/PREMIUM" del perfil (profile.js) abre
//                ahora este modal en los dos estados, no solo en
//                STANDARD. De paso, se quita el ⭐ de los dos avisos de
//                respaldo que se mostraban si Auth.showPremiumBenefits
//                no estuviera disponible.
// Versión: 4.36 - Bump de caché (v435 -> v436): app.js, profile.js,
//                index.html -- petición del usuario: (1) un entrenador
//                es premium por defecto, sin necesitar el campo
//                `premium` a true en Firestore. AppState.isPremium
//                ahora es (userData.premium || isTrainer), tanto al
//                iniciar sesión (setCurrentUser) como en tiempo real (si
//                el admin asciende a alguien mientras tiene la sesión
//                abierta). puedeVerDetalleSesion() y
//                verificarExpiracionPremium() tienen su propio bypass
//                por isTrainer, porque exigían además premiumExpiryDate
//                (fecha de caducidad), que un entrenador nunca tiene --
//                sin ese bypass seguía sin poder ver su propio
//                calendario/plan pese a isPremium=true. La píldora
//                "PREMIUM/STANDARD" del perfil (profile.js) refleja lo
//                mismo. (2) La tarjeta "Próxima sesión" del Dashboard,
//                que desde el v4.35 se quedaba muda (sin onclick) para
//                un usuario estándar bloqueado, ahora abre el modal
//                premium al pulsarla cuando el motivo del bloqueo es
//                premium (si es "sin entrenador activo" sigue sin abrir
//                nada, igual que en el resto de la app). (3) El propio
//                modal premium (compartido por todos los puntos de
//                entrada: un día del calendario, "+ NUEVO PLAN", la
//                píldora del perfil y ahora también esta tarjeta) no
//                decía en ningún sitio que haciéndose premium la
//                función bloqueada pasaría a funcionar -- se añade el
//                aviso "🔒 Esta es una función premium. Hazte premium y
//                podrás usarla al instante." antes de la lista de
//                beneficios.
// Versión: 4.35 - Bump de caché (v429 -> v430): index.html, calendar.js --
//                petición del usuario, dos fugas que se saltaban por
//                completo el control de acceso de la pestaña Plan: (1) la
//                tarjeta "Próxima sesión" del Dashboard leía el plan
//                directamente de Firestore y pintaba nombre/fecha/
//                duración sin pasar por ningún control -- un usuario
//                estándar sin entrenador (o con premium caducado) seguía
//                viendo ahí el detalle de un plan al que ya no debía
//                tener acceso, y al tocar la tarjeta se abría el modal
//                completo (abrirModalDetalleSesion) saltándose el
//                bloqueo de la pestaña Plan por completo. Ahora reutiliza
//                PlanGenerator._puedeVerPlanActual y muestra "🔒
//                Necesitas un entrenador activo" o "🔒 Función premium"
//                según el motivo, sin tarjeta clicable. La ficha de
//                progreso del plan tampoco se pinta ya en ese caso. (2)
//                El aviso al pulsar una sesión (abrirDetalleSesion) abría
//                siempre el modal genérico de premium, incluso cuando el
//                motivo era "sin entrenador" -- inconsistente con la
//                pantalla del calendario, que ya no empuja premium en ese
//                caso. Ahora usa el mismo criterio en los dos sitios.
// Versión: 4.34 - Bump de caché (v428 -> v429): calendar.js -- petición
//                del usuario: la pantalla "sin acceso" (v4.33) ofrecía el
//                botón de premium también en el caso "sin entrenador
//                activo", donde no es el camino natural para recuperar
//                el acceso (lo natural, y gratis, es conseguir otro
//                entrenador) -- sonaba a venderle premium donde no
//                tocaba. Ahora ese botón solo aparece cuando el motivo
//                real es premium; para "sin entrenador" solo queda el
//                texto explicando cómo se recupera el acceso.
// Versión: 4.33 - Bump de caché (v427 -> v428): calendar.js -- petición
//                del usuario, control de acceso a la pestaña Plan: un
//                atleta gratuito con un plan 'personalizado' (asignado
//                por un entrenador) seguía viéndolo y pudiendo añadirse
//                sesiones con el botón "+" aunque hubiera dejado de tener
//                entrenador -- la única comprobación que existía
//                (abrirDetalleSesion) miraba solo si el plan estaba
//                marcado 'personalizado', nunca si el entrenador seguía
//                activo, y la rejilla del calendario en sí
//                (mostrarCalendario/mostrarUltimoPlanGuardado) no tenía
//                ninguna comprobación. Se añade _puedeVerPlanActual()
//                central: premium vigente -> siempre; personalizado sin
//                premium -> solo con al menos un entrenador activo ahora
//                mismo (entrenadoresAceptados, da igual cuál, puede
//                haber cambiado de entrenador); autogenerado sin premium
//                -> nunca (de paso, arregla el mismo fallo para quien
//                generó su plan siendo premium y luego le caducó). Se
//                aplica en mostrarCalendario() (con red de seguridad para
//                cualquier llamador futuro), mostrarUltimoPlanGuardado()
//                y abrirDetalleSesion(), con una pantalla de "sin acceso"
//                dentro del propio calendario en vez de dejarlo vacío sin
//                explicación.
// Versión: 4.32 - Bump de caché (v426 -> v427): calendar.js -- petición
//                del usuario: confianzaContinuidad (v4.31) medía "¿ha
//                entrenado en general?", mezclando en el mismo TSS un
//                rodaje corto y una tirada larga -- alguien con solo
//                rodajes suaves de 30' podía salir con confianza alta sin
//                haber corrido nunca más de 10 km recientemente. Se añade
//                _evaluarTiradaLargaReciente(): busca en los últimos 90
//                días (una tirada larga es semanal, 28 días se quedaban
//                cortos) la última sesión real con trainingType==='largo',
//                y da una confianza según cuánto duró frente al techo de
//                la semana 1 de este plan y cuánto hace de eso (decae de
//                1.0 a los 14 días hasta 0 a los 60). Se combina con la
//                confianza general por el MÍNIMO de las dos -- ninguna
//                tapa a la otra.
// Versión: 4.31 - Bump de caché (v425 -> v426): calendar.js -- petición
//                del usuario: la rampa de las 3 primeras semanas (v4.30)
//                se aplicaba igual a todo el mundo en la semana 1, fuera
//                su primer plan o el cuarto seguido. Se añade
//                "confianzaContinuidad" (0-1), calculada con datos que la
//                app ya obtiene para el ajuste por ACWR (carga aguda:
//                crónica de los últimos 28 días, reutilizando la misma
//                lectura, sin consultas nuevas): cuantos más días con
//                entreno real registrado recientemente (satura en 20 de
//                28), menos se suaviza la primera tirada, hasta
//                desaparecer del todo si ya tiene base sólida -- y si el
//                ACWR muestra que la carga reciente se ha desplomado
//                frente a la crónica (< 0.8, señal de parón aunque
//                hubiera base antes), esa confianza se recorta al 40%:
//                la rampa sigue protegiendo casi entera. No mira si
//                existe un plan anterior en la base de datos, sino la
//                forma física real y reciente del atleta.
// Versión: 4.30 - Bump de caché (v424 -> v425): calendar.js -- petición
//                del usuario, ajuste a la rampa del bump anterior (v4.29):
//                aquella versión ponía un TOPE FIJO en minutos (75'/95'/
//                115') para las 3 primeras semanas del plan. El usuario
//                señaló, con razón, que un tope fijo aplana la variación
//                real: si el cálculo natural de varias semanas o de
//                planes distintos (principiante vs avanzado, poco vs
//                mucho volumen) ya superaba ese número, todas acababan
//                exactamente en el mismo tope. Se sustituye por un FACTOR
//                proporcional sobre lo ya calculado (55%/70%/85% de lo
//                natural para semana 1/2/3), y se deja un techo de
//                seguridad más generoso (100'/120'/140') aparte, solo
//                como red para casos extremos, no como objetivo.
// Versión: 4.29 - Bump de caché (v423 -> v424): calendar.js -- petición
//                del usuario: el techo de la tirada larga (getMaximosPorTipo)
//                solo dependía de la FASE del plan (BASE/CONSTRUCCIÓN/...),
//                no de la semana GLOBAL -- la semana 1 de BASE tenía el
//                mismo techo que la última semana de BASE. Para maratón +
//                avanzado eso permitía una primera tirada larga de
//                ~150-165' (30+ km) a los pocos días de empezar el plan.
//                Se añade una rampa real por semana global (independiente
//                del nivel/fase): semana 1 → máx 75', semana 2 → máx 95',
//                semana 3 → máx 115'; desde la semana 4 ya manda solo el
//                techo normal de la fase. Se aplica en los dos sitios
//                donde se podía superar: al calcular minutosPorTipo.largo
//                y otra vez al final, porque _calcularDuracionLargoFinal()
//                podía alargarla para que siguiera siendo la sesión más
//                larga de la semana.
// Versión: 4.28 - Bump de caché (v422 -> v423): index.html, profile.js --
//                petición del usuario: marcha atrás del lápiz añadido en
//                el bump anterior -- se quita de los dos sitios (botón
//                "Cambiar" de Perfil y badge de zapatilla del Dashboard).
//                El click para cambiar de zapatilla sigue funcionando
//                igual en ambos, solo cambia el icono visible.
// Versión: 4.27 - Bump de caché (v421 -> v422): profile.js -- petición
//                del usuario: el botón "👟 Cambiar" del modal de
//                zapatilla en Perfil no tenía el lápiz que sí se añadió
//                al tocable del Dashboard. Ahora dice "👟 Cambiar ✏️",
//                igual en los dos sitios.
// Versión: 4.26 - Bump de caché (v420 -> v421): index.html -- petición
//                del usuario: en el Dashboard, la foto de perfil y la
//                zapatilla actual ahora son tocables y abren su cambio
//                directamente desde ahí (antes solo se podía desde
//                Perfil). La foto abre el mismo selector de imagen que
//                el botón "Cambiar foto" de Perfil
//                (Profile.seleccionarFoto), con un distintivo de cámara
//                en la esquina para que se note que es tocable -- se
//                añade también dentro del bloque que repinta el avatar
//                con la <img> real (avatarEl.innerHTML), que si no lo
//                borraría en cuanto cargase la foto. La zapatilla abre
//                el mismo modal "CAMBIAR ZAPATILLA" de Perfil
//                (Profile._mostrarModalCambiarZapatilla), con un lápiz
//                pequeño junto al nombre.
// Versión: 4.25 - Bump de caché (v419 -> v420): session-invites.js --
//                petición del usuario, Paso 3 (elegir destinatarios) al
//                enviar sesiones/packs: dos fixes en la selección por
//                grupos + individual. (1) _toggleUsuario() (marcar/
//                desmarcar a mano) nunca volvía a pintar las tarjetas de
//                grupos -- si ese usuario pertenecía a un grupo, la
//                tarjeta se quedaba con el color de la última vez que se
//                tocó un grupo directamente, sin reflejar los cambios
//                hechos a mano. Esto es lo que se sentía como "pulso el
//                grupo varias veces y no desmarca": el grupo parecía
//                seguir marcado (dorado a la vista) pero por dentro ya
//                no estaba "100% marcado" de verdad, así que un click
//                volvía a seleccionar en vez de deseleccionar. Ahora
//                _toggleUsuario() también llama a _renderizarGrupos().
//                (2) Si dos grupos comparten algún miembro y ambos
//                acaban marcados por completo, desmarcar UNO de los dos
//                quitaba también a los miembros compartidos, rompiendo
//                el otro grupo sin haberlo tocado. Ahora, al desmarcar
//                un grupo, un miembro compartido solo se quita si NINGÚN
//                otro grupo actualmente completo lo necesita.
// Versión: 4.24 - Bump de caché (v418 -> v419): app.js -- petición del
//                usuario, panel admin: el botón de cada entrenador solo
//                mostraba el límite de atletas (maxAlumnos), nunca
//                cuántos tenía YA aceptados de ese límite. Ahora muestra
//                "actuales/límite" (p.ej. "🎯 ENTRENADOR (3/5)"), tanto
//                en el listado como al guardar cambios desde el modal de
//                gestión de entrenador.
// Versión: 4.23 - Bump de caché (v417 -> v418): index.html, app.js,
//                profile.js, wall.js -- notificación de "me gusta" en
//                Comunidad, ronda de fixes: (1) index.html ya trae
//                irANotificacionDeLike() (decide Muro si la tarjeta sigue
//                en sus 24h, o Perfil si no), pero dependía de que
//                AppState.entriesConLikesNuevos[0] fuera un objeto
//                {id, ts} -- app.js seguía guardando solo el id (string),
//                así que entrada.id daba undefined y la función no
//                navegaba nunca. Ahora app.js guarda el objeto completo.
//                (2) El puntito rojo de "me gusta sin leer"
//                (.like-new-dot) solo se pintaba en las tarjetas del
//                Muro -- profile.js, en "Mis últimos entrenamientos",
//                nunca lo calculaba ni lo mostraba. Se añade el mismo
//                cálculo y marcado (creación + actualización en vivo).
//                (3) wall.js pasa de querySelector a querySelectorAll al
//                quitar ese punto al marcar como leído -- si la misma
//                entrada está montada a la vez en Muro y Perfil, antes
//                solo se limpiaba la primera que encontraba.
// Versión: 4.22 - Bump de caché (v416 -> v417): app.js, session-invites.js --
//                petición del usuario: dos actualizaciones de rol/vínculo
//                que se quedaban a medias sin recargar la app.
//                (1) Cuando un atleta acepta la invitación de un
//                entrenador, "Mis alumnos" ya se refrescaba solo en
//                tiempo real, pero la lista de destinatarios de "Generar
//                sesión" (SessionInvites._usuariosTodos) se quedaba
//                cacheada desde la primera vez que se abría -- el nuevo
//                alumno no aparecía ahí hasta recargar. Nuevo método
//                SessionInvites.invalidarCacheUsuarios(), enganchado al
//                mismo listener de alumnosAceptados que ya refresca "Mis
//                alumnos" (app.js::iniciarListeners).
//                (2) Cuando un admin hace entrenador a alguien con la
//                sesión ya abierta, la píldora "Entrenador" del perfil
//                cambiaba, pero la pestaña "🎯 Entrenador" (calculada una
//                sola vez al hacer login) se quedaba oculta hasta
//                recargar o volver a entrar. Esa lógica se extrae a
//                AppState.actualizarVisibilidadPestanaEntrenador() y se
//                vuelve a evaluar en caliente en cuanto isAdmin/isTrainer
//                cambian de verdad en el propio documento -- repintando
//                también el perfil si esa subpestaña está abierta en ese
//                momento, para que píldora y pestaña cambien a la vez.
// Versión: 4.21 - Bump de caché (v415 -> v416): index.html, friends.js,
//                storage.js -- petición del usuario: se quita el botón
//                "Entrenadores" (filtro dedicado) de Amigos → Buscar, tras
//                borrarse el índice compuesto de Firestore que lo
//                sustentaba (isTrainer + username). Ya no hace falta: la
//                píldora "Entrenador" junto al nombre (ver v4.17) permite
//                identificarlos directamente en la lista normal al
//                buscar por nombre. Se retira también el código que solo
//                existía para ese modo -- Storage.getAllTrainers (ya sin
//                ningún llamante, y apuntaba al índice borrado),
//                Friends.toggleFiltroEntrenadores, la rama 'entrenadores'
//                en _cargarPaginaUsuarios/_aplicarModoBusqueda/
//                _renderExplorarUsuarios, y el CSS .filtro-entrenadores-
//                btn -- para no dejar código muerto apuntando a un
//                índice que ya no existe.
// Versión: 4.20 - Bump de caché (v414 -> v415): friends.js -- FIX real
//                del bug reportado ("no aparecen los entrenadores" tras
//                crear el índice): no era el índice, era que
//                _renderExplorarUsuarios oculta a los amigos a propósito
//                (para el modo "explorar" normal, donde el objetivo es
//                encontrar gente nueva). En modo "entrenadores" ese
//                filtro descartaba de la lista a cualquier entrenador
//                con el que ya se fuera amigo -- el caso más probable en
//                una unidad pequeña. Ahora en modo "entrenadores" no se
//                ocultan los amigos, y si ya lo eres se ofrece
//                "💬 CONTACTAR" en vez de "➕ Agregar".
// Versión: 4.19 - Bump de caché (v413 -> v414): index.html, friends.js --
//                petición del usuario: el filtro "solo entrenadores" de
//                Amigos → Buscar deja de ser un checkbox+label; ahora es
//                un botón entero ("Entrenadores") que se pulsa como tal y
//                queda encendido en dorado (clase .filtro-entrenadores-
//                btn.active) mientras el filtro está activo.
// Versión: 4.18 - Bump de caché (v412 -> v413): index.html -- petición
//                del usuario: contenido del modal "Novedades de esta
//                versión" renovado por completo (llevaba desde ri5-v326
//                sin tocarse, anunciando cosas ya antiguas). Ahora
//                anuncia: permiso del atleta para tener entrenador,
//                envío a grupos de atletas, buscador de entrenadores en
//                la app + botón de contacto, récords reales por
//                distancia, tienda colaboradora, y el bloqueo de marcar
//                sesiones de otro día. RI5_VERSION_NOVEDADES actualizado
//                a 'ri5-v413' para que vuelva a salir aunque ya se
//                hubiera visto la versión anterior del modal.
// Versión: 4.17 - Bump de caché (v411 -> v412): storage.js, friends.js,
//                index.html, profile.js -- petición del usuario: ahora
//                se puede buscar entrenadores dentro de la app. Nueva
//                píldora "Entrenador" (clase .badge-entrenador) junto al
//                nombre de usuario en: perfil propio y de otros (modal de
//                amigo), Buscar/Explorar usuarios, Mis Amigos, y
//                Solicitudes de amistad. En Amigos → Buscar hay un nuevo
//                checkbox "Ver solo entrenadores" que pagina con la
//                nueva Storage.getAllTrainers (where isTrainer==true +
//                orderBy username -- puede pedir crear un índice
//                compuesto en Firestore la primera vez, con mensaje claro
//                en pantalla si pasa). Además, al abrir el perfil de un
//                entrenador con el que ya eres amigo, aparece un botón
//                "💬 CONTACTAR" (reutiliza el chat ya existente entre
//                amigos) para poder pedirle que te entrene. No se tocó
//                el Muro (wall.js): los posts guardan una foto fija del
//                autor en el momento de publicarse y no incluyen
//                isTrainer, así que mostrarlo ahí requeriría el mismo
//                mecanismo de nivel en vivo que ya usa el Muro para el
//                nivel (_obtenerNivelesConCache) -- pendiente si se
//                quiere en el futuro.
// Versión: 4.16 - Bump de caché (v410 -> v411): guia.html -- se reescribe
//                la frase de la tarjeta "🔢 Límite de atletas" (v4.15)
//                para dejar claro que el límite corresponde a paquetes de
//                pago concretos: desde 10€, para 5, 10, 20 o 50 atletas.
// Versión: 4.15 - Bump de caché (v409 -> v410): guia.html -- se añade a
//                "Modo entrenador" la tarjeta "🔢 Límite de atletas",
//                explicando el límite máximo que un admin puede poner a
//                un entrenador (ver changelog v4.13): el recuento "X / Y
//                atletas", que el botón "Invitar" desaparece al llegar al
//                límite y el aviso "🔒 Límite alcanzado" que lo sustituye.
// Versión: 4.14 - Bump de caché (v408 -> v409): app.js, profile.js,
//                guia.html -- petición del usuario: renombrado de cara al
//                usuario el plan "GRATIS" a "STANDARD" (badge del panel
//                admin en app.js, "Plan" del perfil en profile.js, y las
//                2 menciones de la guía en guia.html). Solo texto/UI: el
//                campo interno sigue siendo el booleano `premium` de
//                siempre, no cambia ninguna lógica ni nombre de campo.
// Versión: 4.13 - Bump de caché (v407 -> v408): app.js, friends.js,
//                storage.js, index.html -- petición del usuario: límite
//                de atletas por entrenador. El admin, al hacer entrenador
//                a alguien (o editar uno que ya lo es) desde un nuevo
//                modal "ENTRENADOR" (mismo patrón que el de PREMIUM),
//                puede fijar cuántos atletas puede tener aceptados como
//                máximo (campo maxAlumnos en su doc de usuario; vacío =
//                sin límite). Al llegar a ese número de atletas YA
//                ACEPTADOS: en el panel "Mis alumnos" del entrenador se
//                ve el recuento "X / Y atletas" (en rojo si está al
//                límite) y el botón "INVITAR" de los amigos restantes se
//                sustituye por un aviso "🔒 Límite alcanzado" -- ya no se
//                puede enviar ninguna invitación más. Comprobación
//                también en friends.js (invitarAlumno, por si la caché
//                del panel estuviera desactualizada) y en
//                storage.js/sendTrainerRequest (por si se llega hasta ahí
//                por otra vía), igual que el resto de límites de la app.
// Versión: 4.12 - Bump de caché (v406 -> v407): calendar.js -- FIX pedido
//                por el usuario sobre el aviso de sesión bloqueada por
//                fecha (v4.11): el cuadrado del checkbox "Marcar como
//                realizada" ya no se muestra (disabled) cuando la sesión
//                es de un día pasado o futuro -- se oculta por completo
//                (checkbox.style.display = 'none'), quedando solo visible
//                el texto de aviso. Ese texto ("🔒 Sesión futura: todavía
//                no se puede marcar" / "🔒 Sesión pasada: ya no se puede
//                marcar") se pinta ahora en rojo (#e74c3c) para que se
//                entienda a simple vista por qué está bloqueada. Cuando la
//                sesión sí se puede marcar (es hoy, o ya estaba marcada y
//                se permite desmarcar), el checkbox vuelve a mostrarse y
//                el texto recupera su color normal.
// Versión: 4.11 - Bump de caché (v405 -> v406): calendar.js v2.74 --
//                nueva redacción (sin emoji de reloj, más directa) para
//                el aviso de sesión bloqueada por fecha, y el botón
//                "INICIAR SESIÓN CON GPS" pasa a desactivarse con el
//                mismo criterio que la casilla "Marcar como realizada"
//                (día distinto de hoy). Ver calendar.js v2.74.
// Versión: 4.10 - Bump de caché (v404 -> v405): calendar.js -- se amplía
//                el FIX de v4.09: ya no basta con que la sesión no sea de
//                un día PASADO, tampoco puede ser de un día FUTURO. Solo
//                se puede marcar como realizada la sesión programada para
//                HOY. Mismo criterio en los dos sitios ya tocados en v4.09
//                (_marcarSesionRealizadaInterno y el checkbox del modal de
//                abrirDetalleSesion), con su mensaje/etiqueta adaptados
//                según sea un día anterior o uno futuro. Desmarcar sigue
//                permitido siempre, sea del día que sea.
// Versión: 4.09 - Bump de caché (v403 -> v404): calendar.js -- FIX pedido
//                por el usuario: ya no se puede marcar como realizada una
//                sesión de un día YA PASADO (se estaba viendo gente que
//                entraba el viernes y marcaba de golpe las sesiones del
//                miércoles, jueves y viernes). Bloqueado en dos sitios:
//                (1) _marcarSesionRealizadaInterno() rechaza el marcado en
//                el propio backend/Firestore si la fecha de la sesión es
//                anterior a hoy (desmarcar una sesión pasada SÍ sigue
//                permitido, para poder corregir un marcado por error).
//                (2) abrirDetalleSesion() deshabilita el checkbox "Marcar
//                como realizada" en el modal cuando el día ya pasó y aún
//                no estaba marcada, con una etiqueta explicativa, para que
//                no haga falta llegar a intentarlo para enterarse.
// Versión: 4.08 - Bump de caché (-> v401): segunda ronda de revisión de
//                lecturas duplicadas a Firestore, cinco archivos.
//                (1) profile.js v10.13: cargarPerfil() ya no relee
//                gamification vía Gamification.getCurrentShoe() (reutiliza
//                gamificationData.currentShoe, ya leído antes) ni repite
//                el chequeo de amigos huérfanos con su propio bucle
//                (delega en Friends._limpiarAmigosHuérfanos). (2) friends.js
//                v3.60: _limpiarAmigosHuérfanos() deduplica la promesa en
//                vuelo por uid, para cuando profile.js y este módulo la
//                piden casi a la vez. (3) app.js v4.66: precargarDatos()
//                ya no lanza una segunda carga completa de perfil en
//                paralelo con la que auth.js ya hace justo después en
//                todo login/restauración de sesión; y el listener de
//                'conversations' fusiona el comportamiento que index.html
//                duplicaba, evitando disparar Chat.updateUnreadBadge()
//                (consulta N+1) dos veces por cada mensaje. (4) index.html:
//                eliminado ese listener duplicado de 'conversations' (ver
//                app.js v4.66) y el dashboard ya no relee gamification vía
//                Gamification.getCurrentShoe() (reutiliza gam.currentShoe,
//                ya leído antes). (5) sponsors.js v1.14:
//                comprobarUmbralZapatilla() ya no relee el documento de
//                gamification dos veces (una vía getCurrentShoe, otra con
//                un ref.get() suelto). Ningún cambio de comportamiento
//                visible; solo menos lecturas por login, por sesión
//                marcada y por mensaje de chat. Ver profile.js v10.13,
//                friends.js v3.60, app.js v4.66, sponsors.js v1.14 e
//                index.html.
// Versión: 4.07 - Bump de caché (-> v400): ronda de revisión de lecturas
//                duplicadas a Firestore, tres archivos. (1) friends.js
//                v3.59: cargarListaAmigos()/cargarPanelAlumnos() dejan
//                de leer cada amigo dos veces (una en
//                _limpiarAmigosHuérfanos, descartada, y otra después) --
//                ahora se reutiliza el documento que ya se había traído.
//                (2) storage.js v3.32: getAdminUid() se cachea en
//                memoria -- antes se repetía en cada mensaje de soporte
//                y una vez por destinatario dentro de un mismo broadcast.
//                (3) calendar.js v2.73: calcularCargaEntrenamiento
//                (ventana 120) y calcularFormaFisica (ventana 200) ya
//                no leen por separado el mismo histórico de globalFeed
//                (se disparan siempre juntas al guardar/deshacer una
//                sesión) -- ahora comparten una única lectura cacheada
//                (PlanGenerator._obtenerHistorialGlobalFeed), invalidada
//                justo cuando el historial cambia de verdad. Ver
//                friends.js v3.59, storage.js v3.32, calendar.js v2.73.
// Versión: 4.06 - Bump de caché (-> v396): sponsors.js v1.9 -- panel de
//                admin de tiendas: mismo patrón de precarga+caché que ya
//                usan otras listas de la app (historial de sesiones
//                enviadas, explorar usuarios). Antes, abrir Administración
//                > Tienda volvía a pedir la lista entera a Firestore cada
//                vez, con un "Cargando..." de por medio. Ahora se
//                precarga sola en segundo plano en cuanto la app está
//                lista (evento 'ri5:appready') y, si eso ya pasó, la
//                pestaña aparece directa sin carga -- solo se vuelve a
//                pedir a Firestore de verdad cuando hay un cambio real
//                (crear/editar/eliminar una tienda). Ver sponsors.js v1.9.
// Versión: 4.05 - Bump de caché (-> v395): sponsors.js v1.8 -- botones
//                EDITAR/ELIMINAR más pequeños, más contraste en el
//                borde/fondo de la tarjeta activa (mejor visibilidad en
//                modo oscuro) y quitada la insignia ✓ de la esquina de
//                la foto (redundante, la tarjeta entera ya marca el
//                estado). Ver sponsors.js v1.8.
// Versión: 4.04 - Bump de caché (-> v394): sponsors.js v1.7 -- editar y
//                eliminar pasan a flex:1 (mismo ancho exacto cada uno,
//                antes dependía de la longitud del texto) y el contador
//                de clics pierde el emoji 👆. En index.html: sección
//                renombrada de "TIENDAS PATROCINADORAS" a "TIENDAS
//                COLABORADORAS"; en el modal de alta/edición se quita el
//                botón de texto "Elegir foto de la tienda" (la imagen ya
//                era clicable, ahora es la única forma de cambiarla) y
//                se reducen ligeramente los márgenes para que quepa sin
//                scroll. Ver sponsors.js v1.7 e index.html.
// Versión: 4.03 - Bump de caché (-> v393): sponsors.js v1.6 -- revertido
//                el rediseño v1.5 del panel de admin (chips + píldora de
//                estado separada) a la base anterior v1.4, con los
//                cambios pedidos sobre esa base: foto más grande (64px),
//                insignia ✓ más pequeña, nombre completo sin truncar,
//                clics debajo de la foto, editar/eliminar como botones
//                de borde simple sin emoji, toggle activar/desactivar
//                instantáneo (sin recarga ni "Cargando..."), y color de
//                nivel de gamificación del propio admin para la tarjeta
//                activa en vez de verde fijo. Ver sponsors.js v1.6.
// Versión: 4.02 - Bump de caché (-> v392): sponsors.js v1.5 -- rediseño
//                visual de la tarjeta de tienda en el panel de admin, a
//                petición del usuario sobre una captura con anotaciones:
//                más sombra/radio, píldora de estado (punto + texto) de
//                vuelta en la esquina superior derecha de la cabecera,
//                insignia de clics con icono en circulito, y botones de
//                acción como chips rellenos (EDITAR dorado sin emoji,
//                eliminar en círculo rosado con 🗑️). Ver sponsors.js v1.5.
// Versión: 4.01 - Bump de caché (-> v391): sponsors.js v1.4 -- en el
//                panel de admin de patrocinadores, los clics pasan a
//                mostrarse como una pequeña insignia redondeada en vez
//                de texto suelto, y el botón "editar" pierde el emoji
//                de lápiz (pasa a texto "EDITAR"). Ver sponsors.js v1.4.
// Versión: 4.00 - Bump de caché (-> v390): sponsors.js v1.3 -- en el
//                panel de admin de patrocinadores se quita el botón
//                "ACTIVA/INACTIVA" (el nombre de la tienda pasa a ocupar
//                todo ese hueco) y la propia foto del colaborador se
//                convierte en el interruptor: un toque sobre ella activa
//                o desactiva la tienda, con un aro + insignia ✓ verde
//                alrededor de la foto y un tinte verde en toda la
//                tarjeta mientras está activa. Ver sponsors.js v1.3.
// Versión: 3.99 - Bump de caché (-> v389): sponsors.js v1.2 -- (1) el
//                botón "✅ ACTIVA / ⛔ INACTIVA" del panel de admin de
//                patrocinadores se sustituye por un punto de color +
//                texto corto ("ACTIVA"/"INACTIVA", sin emoji), con menos
//                padding y font-size, porque con max-width:45% y el
//                emoji podía quedarse con más ancho que el propio nombre
//                de la tienda (flex:1) y cortarlo con "...". (2) la
//                tarjeta del banner del Dashboard lleva ahora un tinte
//                dorado sutil (fondo en gradiente + borde en
//                rgba(192,160,96,...)) para distinguirse del resto de
//                tarjetas de estadísticas del Dashboard, y su
//                descripción pasa de 1 a 2 líneas visibles. Ver
//                sponsors.js v1.2.
// Versión: 3.98 - Bump de caché (-> v388): sponsors.js -- FIX de
//                desbordamiento visual del botón "IR A LA TIENDA" en la
//                tarjeta de tienda patrocinadora del Dashboard. El botón
//                se salía de su contenedor en pantallas estrechas porque
//                tenía flex-shrink:0 y white-space:nowrap, forzando un
//                ancho mínimo excesivo. Ahora se permite que se encoja
//                (flex:0 1 auto; min-width:0) y que su texto se parta en
//                varias líneas (text-align:center; word-break:break-word),
//                además de reducir ligeramente su padding y font-size
//                para que quede más compacto. También se ha ajustado la
//                píldora de descuento y el contenedor flex para que el
//                botón pase a la línea siguiente si no cabe junto al
//                descuento. Ver sponsors.js v1.1.
// Versión: 3.97 - Bump de caché (-> v387): index.html/sponsors.js -- FIX
//                de desbordamiento visual: el botón "IR A LA TIENDA" del
//                banner de tienda en el Dashboard y el toggle "✅ ACTIVA"
//                del panel de administración de tiendas patrocinadoras se
//                salían de su tarjeta en iOS Safari. Causa: ese texto se
//                inyecta por innerHTML (Sponsors._tarjetaHTML /
//                Sponsors.cargarAdminLista) y el proyecto no tenía
//                `-webkit-text-size-adjust:100%` global -- Safari infla
//                automáticamente el tamaño de letra de textos cortos en
//                mayúsculas/negrita que considera "poco legibles",
//                especialmente cuando se insertan dinámicamente, sin
//                respetar el font-size indicado. Fix: regla añadida en
//                html,body de index.html + refuerzo puntual (max-width,
//                box-sizing:border-box, -webkit-text-size-adjust:100%) en
//                los dos botones de sponsors.js. De paso, se añade
//                sponsors.js a PRECACHE_URLS: faltaba en la lista de
//                caché offline desde que se creó el módulo.
// Versión: 3.96 - Bump de caché (-> v381): gamification.js v5.18 -- FIX
//                DE RAÍZ definitivo del tema de la insignia de zona: los
//                7 contadores acumulados (zona 4/5, distancia, sesiones,
//                tipos) ahora se recalculan desde la verdad del
//                historial TAMBIÉN al marcar una sesión (v5.17 solo lo
//                hacía al desmarcar) -- ya no dependen de ningún valor
//                guardado que se pudiera haber desviado. Ver cabecera de
//                gamification.js.
// Versión: 3.95 - Bump de caché (-> v380): gamification.js v5.17 -- FIX
//                de fondo: totalZone4Minutes/totalZone5Minutes (y
//                totalDistance/totalSessions/contadores por tipo) ahora
//                se recalculan desde la verdad del historial completo al
//                desmarcar cualquier sesión, en vez de solo sumar/restar
//                sesión a sesión -- corrige desviaciones acumuladas que
//                antes no tenían forma de autocorregirse. Ver cabecera de
//                gamification.js.
// Versión: 3.94 - Bump de caché (-> v379): index.html -- FIX de fondo
//                reportado por el usuario ("me sale la insignia 60 min en
//                Z4 con el dashboard mostrando solo 40"): el widget
//                "Zonas · últimos 30 días" no contaba los bloques
//                `desglose.extras` (las "🏃 carrera extra" de sesiones de
//                series/tempo, cada una con su propia zona), mientras que
//                calendar.js::_sumarMinutosPorZona (lo que alimenta el
//                acumulado de por vida de las insignias ZONE_4_60/
//                ZONE_5_30) SÍ los contaba desde siempre -- de ahí el
//                desajuste entre lo que se veía en el dashboard y lo que
//                de verdad llevaba acumulado. Ver detalle completo en
//                index.html, dentro de cargarZonasUsadasDashboard().
// Versión: 3.93 - Bump de caché (-> v378): gamification.js v5.16 -- se
//                aclara el texto de las insignias ZONE_4_60/ZONE_5_30
//                (son acumuladas de por vida entre TODAS las sesiones, no
//                de una sola sesión -- ver cabecera de gamification.js).
// Versión: 3.92 - Bump de caché (-> v377): a petición del usuario, ya no
//                se ven los números de portal/vivienda en ningún mapa
//                (mini-mapas del Muro, visor de sesión) -- se limita el
//                zoom automático del encuadre a 16 (ese callejero de
//                OpenStreetMap solo pinta números a partir de cierto
//                zoom). Los nombres de las calles se siguen viendo
//                normal. Ver wall.js v4.17 y gps-track-viewer.js v2.10.
// Versión: 3.91 - Bump de caché (-> v376): wall.js v4.16 -- (1) mini-mapa
//                de las tarjetas pasa de CartoDB (exigía API key, se veía
//                tapado por la marca de agua "API KEY REQUIRED") al mismo
//                OpenStreetMap que ya usan la pantalla de resumen y el
//                visor de sesión; (2) FIX parpadeo al entrar en el Muro
//                (init() ya no tira el listener activo sin condición). Ver
//                cabecera de wall.js para el detalle completo.
// Versión: 3.90 - Bump de caché (-> v375): MARCHA ATRÁS a petición
//                expresa del usuario. Se descarta por completo el intento
//                de que el mapa GPS aparezca solo, sin recargar, en el
//                Muro y en Perfil (v4.17/v4.18 de wall.js, v10.14 de
//                profile.js): cada arreglo de ese intento traía un fallo
//                nuevo (mapa que no aparecía, luego medio mapa pintado,
//                parpadeo...) y el usuario ha pedido volver al
//                comportamiento de antes, que funcionaba bien. wall.js
//                vuelve a v4.15 y profile.js a la versión sin listener en
//                tiempo real para "Mis últimos entrenamientos" (usa un
//                .get() normal cada vez que se abre la pestaña Perfil).
//                Con esto, el mapa de una carrera recién terminada vuelve
//                a necesitar salir y volver a entrar en el Muro/Perfil (o
//                recargar) para verse -- es la limitación que ya existía
//                antes de tocar nada de esto, asumida a propósito.
// Versión: 3.89 - Bump de caché (-> v374): wall.js v4.18 -- FIX "medio
//                mapa sin pintar / parpadeo" que introdujo el propio fix
//                anterior (v4.17): forzar un render() completo en cuanto
//                aparecía el GPS de una sesión destruye y reinicializa
//                TODOS los mini-mapas Leaflet visibles a la vez, y varios
//                mapas midiendo su contenedor a la vez en pleno reflow es
//                lo que causaba que alguno se quedara a medio pintar
//                (se arreglaba solo al girar el móvil porque eso fuerza
//                un resize real). Ahora solo se sustituye el <div> de la
//                tarjeta concreta que acaba de recibir su mapa -- el
//                resto de la lista, y sus mapas ya inicializados, no se
//                tocan. Ver wall.js:_actualizarEntradaConMapaNuevo.
// Versión: 3.88 - Bump de caché (-> v373): wall.js v4.17 y profile.js
//                v10.14 -- FIX "el mapa GPS de una carrera no aparece en
//                el Muro ni en Perfil hasta recargar la página a mano".
//                Al terminar una sesión con GPS, la tarjeta se publica
//                primero SIN datos de GPS y gps-tracker.js le añade
//                hasGPS/trackPoints un instante después con un segundo
//                update() sobre el mismo documento -- los filtros anti-
//                parpadeo de wall.js (v4.16) y profile.js (v10.13) solo
//                comparaban id/likes, así que ese segundo cambio se
//                consideraba "nada que repintar" y el mapa se quedaba sin
//                mostrarse para siempre en esa visita. Ver
//                wall.js:_sonIgualesEntradas y
//                profile.js:_reconciliarMisEntrenamientos.
// Versión: 3.87 - Bump de caché (v369 -> v370): friends.js -- FIX
//                "Explorar usuarios se queda en CARGANDO para siempre":
//                si el canal en tiempo real de Firestore está bloqueado
//                por la red, el listener de la página 1 de "Explorar" no
//                llamaba nunca ni a éxito ni a error, dejando la
//                animación de carga pegada sin fin y sin ningún aviso.
//                Ahora, a los 9s sin respuesta del listener, se hace un
//                .get() de una sola vez como red de seguridad (no
//                depende del canal de streaming). Ver friends.js v3.56,
//                _esperarPrimeraExplorar().
// Versión: 3.86 - Bump de caché (v368 -> v369): storage.js, friends.js,
//                app.js -- (1) FIX de verdad del "no se pudo enviar la
//                invitación" al reinvitar a un alumno tras quitarlo/
//                rechazar/cancelar: sendTrainerRequest y sendFriendRequest
//                ya no reescriben el documento entero con set() (Firestore
//                lo trataba como "update" y la regla solo deja tocar
//                'status' ahí), ahora solo actualizan 'status' cuando el
//                documento ya existe. (2) Panel "Mis alumnos": ya no se ve
//                el texto fijo "Cargando..." ni el parpadeo de aparecer
//                todo de golpe -- ahora usa la misma animación de letras
//                de colores que "Explorar usuarios", con caché en memoria
//                (se repinta al instante si no ha cambiado nada real desde
//                la última vez). Sin este bump, los que ya tuvieran la app
//                instalada seguirían viendo el sw.js viejo serviendo estos
//                3 archivos desde caché y el fallo parecería no arreglado.
// Versión: 3.85 - Bump de caché (v366 -> v367): wall.js, app.js -- el
//                Muro deja de recargarse entero cada vez que se entra en
//                su pestaña. Ahora el listener onSnapshot se abre UNA
//                sola vez por sesión (idempotente, ya no se destruye y
//                reabre en cada visita) y el HTML se pinta en segundo
//                plano nada más iniciar sesión (Wall.precargarMuro(),
//                llamado desde AppState.precargarDatos en app.js) -- así,
//                al abrir la pestaña Muro, la lista ya está puesta desde
//                antes, sin ningún parpadeo ni espera. Además, cada
//                snapshot compara las entradas nuevas con las que ya
//                estaban en pantalla (por id, likeCount y likes.length) y
//                solo repinta el DOM si algo cambió de verdad: una simple
//                reconexión del listener (móvil bloqueado/desbloqueado,
//                cambio de cobertura...) ya no reconstruye el HTML con
//                las mismas tarjetas. El listener se sigue cerrando solo
//                en logout (AppState.detenerListeners en app.js).
//                IMPORTANTE: en app.js hay que (1) quitar la llamada a
//                Wall.detenerListener() de switchTab('muro'), y (2) añadir
//                Wall.precargarMuro() a AppState.precargarDatos(). Si no,
//                este bump por sí solo no arregla el parpadeo.
// Versión: 3.84 - Bump de caché (v365 -> v366): session-invites.js -- el
//                usuario precisó que NO quiere ninguna animación en
//                cascada en "ÚLTIMAS SESIONES CREADAS", NI SIQUIERA la
//                primera vez que se ve en la sesión -- quiere que, al
//                recargar la app o iniciar sesión, la lista quede
//                generada del todo, y que al entrar en la pestaña ya esté
//                puesta sin más. Dos cambios: (1) se quita del todo el
//                `animation:riFadeInUp` con `animation-delay` por fila de
//                las tarjetas del historial (antes solo se evitaba
//                REPETIR la cascada en visitas siguientes, v365, pero la
//                primera seguía animándose). (2) el pintado real del HTML
//                se extrae a `_pintarHistorialDesdeCache()`, y
//                `precargarHistorial()` (llamado al iniciar sesión) ya no
//                se limita a dejar el DATO listo en `_historialCache` --
//                también pinta el contenedor (#adminSesionesEnviadasList
//                es un div fijo del HTML, solo oculto por CSS mientras
//                esa subpestaña no está activa, así que se puede rellenar
//                aunque no se vea todavía). Así, para cuando el usuario
//                abre de verdad la pestaña, mostrarHistorial() no tiene
//                nada que pintar (_historialRenderizado ya está a
//                `true`) -- ni dato que pedir, ni DOM que tocar, ni
//                ninguna animación que reproducir.
// Versión: 3.83 - Bump de caché (v364 -> v365): session-invites.js -- el
//                usuario reportó que, aun con la precarga de v364, el
//                historial de "ÚLTIMAS SESIONES CREADAS" seguía
//                apareciendo en cascada de arriba a abajo cada vez que se
//                entraba en la pestaña. Causa real: la precarga (v364) sí
//                evitaba la consulta repetida a Firestore, pero
//                mostrarHistorial() se seguía llamando (y REPINTANDO
//                entero el DOM, con la animación riFadeInUp con
//                animation-delay por fila) cada vez que se abría la
//                subpestaña "perfil-entrenador" -- el dato ya estaba en
//                caché, pero la cascada visual se repetía igual en cada
//                visita. Fix: nuevo flag `_historialRenderizado`; si el
//                historial ya se pintó una vez y nada lo ha invalidado de
//                verdad desde entonces, mostrarHistorial() no vuelve a
//                tocar el DOM al reabrir la pestaña. El flag se resetea
//                explícitamente solo en los tres sitios que sí cambian el
//                contenido real: enviar una sesión nueva, "cargar más" y
//                eliminar una entrada del historial -- ahí sí se vuelve a
//                pintar (con su cascada, ahora sí justificada porque el
//                contenido ha cambiado de verdad).
// Versión: 3.82 - Bump de caché (v363 -> v364): session-invites.js/app.js
//                -- corrección de rumbo: el pedido original de precarga +
//                caché "como Explorar usuarios" era para el historial de
//                "ÚLTIMAS SESIONES CREADAS" del entrenador/admin (pestaña
//                Crear sesión/Sesiones enviadas), no para "Mis últimos
//                entrenamientos" de profile.js (v3.81, se deja tal cual,
//                sigue siendo una mejora válida por su cuenta). Ese
//                historial ya tenía caché en memoria (_historialCache,
//                v354-355) pero se rellenaba de forma perezosa, la
//                primera vez que se abría la pestaña -- con su esqueleto
//                de tarjetas pulsando si ya había tenido historial antes.
//                Ahora `SessionInvites.precargarHistorial()` se llama en
//                segundo plano nada más iniciar sesión (app.js >
//                precargarDatos, solo para admin/entrenador), así que
//                para cuando de verdad se abre la pestaña las 10 tarjetas
//                ya están listas -- sin esqueleto, sin espera. Se sigue
//                recargando solo cuando de verdad se crea una sesión
//                nueva (_enviarSesiones invalida _historialCache, como ya
//                hacía). Refactor interno: la petición a Firestore se
//                extrae a _cargarHistorialSiHaceFalta() (con deduplicación
//                de la promesa en curso), reutilizada tanto por la
//                precarga como por mostrarHistorial().
// Versión: 3.81 - Bump de caché (v362 -> v363): profile.js/app.js -- "MIS
//                ÚLTIMOS ENTRENAMIENTOS" (pestaña Perfil) dejaba de
//                pedirse con un .get() suelto a Firestore CADA vez que se
//                entraba en la pestaña -- de ahí las tarjetas vacías
//                pintándose y rellenándose un instante después, en cada
//                visita, como ya pasaba con el historial de sesiones
//                creadas del entrenador (v354) antes de arreglarse.
//                Fix, mismo patrón ya usado en "Explorar usuarios"
//                (friends.js v3.53, listener onSnapshot abierto una sola
//                vez por sesión): profile.js ahora abre
//                _iniciarListenerMisEntrenamientos() la primera vez que
//                hace falta (idempotente) y sirve las siguientes visitas
//                al instante desde ese caché en memoria, sin tocar
//                Firestore ni ver ningún parpadeo; en cuanto se completa
//                o borra una sesión de verdad, el propio listener manda
//                el dato nuevo y repinta solo. app.js cierra ese listener
//                en detenerListeners() (logout), igual que ya hacía con
//                el de "Explorar".
// Versión: 3.80 - Bump de caché (v355 -> v356): gps-tracker.js -- FIX
//                RÉCORDS IMPOSIBLES: los récords por tramo (1km/5km/...) 
//                y la velocidad máxima se calculaban sobre el track ya
//                simplificado (Douglas-Peucker) en vez de sobre el track
//                GPS sin decimar, así que huecos de tiempo entre puntos
//                de un tramo recto corrido sin parar se capaban a 8s como
//                si fueran una parada real -- dando récords absurdamente
//                rápidos (ej. un 1km "en 2:40"). Ver gps-tracker.js v5.5.
//                NOTA: el número de "vNNN" de este changelog (v337->v338
//                en la entrada anterior) llevaba tiempo desincronizado
//                del valor real de CACHE_NAME en el código (que ya estaba
//                en v355) -- este bump usa el valor real, no el que
//                seguía el historial de comentarios.
// Versión: 3.79 - Bump de caché (v337 -> v338): guia.html -- en un móvil
//                real, la portada solo ocupaba la mitad de la pantalla
//                (el resto quedaba en blanco). Causa: la unidad 100dvh no
//                se calculaba bien en ese navegador/WebView. Se sustituye
//                por una variable CSS (--guia-100vh) rellenada con
//                window.innerHeight por JS, mucho más fiable, con 100dvh
//                solo como último recurso si JS no llegara a ejecutarse.
// Versión: 3.78 - Bump de caché (v336 -> v337): guia.html -- la portada
//                (índice de 14 temas) ahora ocupa 100dvh sin scroll: todo
//                se reparte con flexbox + tamaños en dvh para caber de un
//                vistazo en cualquier móvil. Las páginas de detalle
//                siguen con scroll normal, sin cambios. Incluye fix: la
//                cuadrícula estaba definida a 7 filas en vez de 8 (RI5
//                Premium y Comunidad ocupan cada una toda su fila en
//                solitario), lo que dejaba el botón "Comunidad" más
//                pequeño que el resto. También se quitó el subtítulo
//                "GUÍA DE LA APP" bajo el logo y se le dio más aire al
//                hueco entre "Comunidad" y "CERRAR".
// Versión: 3.77 - Bump de caché (v335 -> v336): app.js, index.html --
//                (1) hacer/quitar entrenador a un usuario ya no recarga
//                toda la lista de administración, solo la etiqueta de su
//                fila; (2) el entrenador tiene ahora su propia subpestaña
//                "🎯 Entrenador" (independiente de Soporte/Administración)
//                en vez de compartir la pestaña de Soporte con una etiqueta
//                distinta.
// Versión: 3.76 - Bump de caché (v334 -> v335): session-invites.js --
//                un entrenador (no admin) ahora solo puede enviar
//                sesiones a sus propios amigos. Cambios:
//                - reglas.js (Firestore, hay que subirlas a mano en la
//                  consola de Firebase): nueva función isTrainer(); la
//                  regla de creación de sessionInvites exige, para un
//                  entrenador, que el destinatario sea su amigo
//                  (isFriendOf) -- no es solo un filtro de la app, si
//                  alguien manipulara el cliente Firestore lo rechazaría
//                  igual. Entrenador también puede actualizar/borrar solo
//                  las invitaciones que él mismo envió.
//                - session-invites.js: _precargarUsuarios() ya no lee
//                  toda la colección 'users' para un entrenador (esa
//                  consulta habría fallado directamente contra las reglas
//                  nuevas) -- en su lugar parte de su propia lista de
//                  amigos (friendIds) y pide esos usuarios por lotes. La
//                  "Gestión de grupos" (listas guardadas tipo "Gimnasio")
//                  sigue siendo solo de admin -- se oculta para el
//                  entrenador, que elige siempre uno a uno entre sus
//                  amigos.
// Versión: 3.75 - Bump de caché (v333 -> v334): index.html, app.js,
//                auth.js -- NUEVO rol "entrenador" (AppState.isTrainer,
//                campo isTrainer en el doc del usuario). El admin lo
//                asigna/quita desde el Panel de control con un botón
//                nuevo por usuario ("HACER ENTRENADOR" / "🎯 ENTRENADOR"),
//                sin necesidad de tocar Firestore a mano. El panel de
//                "Generar sesión" (crear y enviar sesiones) se saca del
//                bloque exclusivo de admin a su propia sección
//                independiente, visible para el admin o para cualquier
//                entrenador -- sin darle el resto de herramientas de
//                administración (gestión de usuarios, bandeja de
//                soporte). Un entrenador sigue viendo también su propia
//                tarjeta de soporte normal (no es admin).
//
//                ⚠️ IMPORTANTE, no incluido en este cambio: las REGLAS DE
//                SEGURIDAD de Firestore. Si esas reglas exigen isAdmin ==
//                true para crear documentos en sessionInvites o para
//                actualizar el plan/ultimoPlanId de otro usuario, un
//                entrenador vería el botón pero la escritura fallaría en
//                Firestore. Hay que revisar y ampliar esas reglas (isAdmin
//                == true OR isTrainer == true) desde la consola de
//                Firebase -- ese archivo no está entre los que edito aquí.
// Versión: 3.74 - Bump de caché (v332 -> v333): app.js -- FIX: el aviso
//                de "me gusta" en la campanita de Comunidad se quedaba
//                pegado para siempre si la sesión que lo recibió dejaba
//                de ser alcanzable -- el Muro solo enseña las últimas
//                24h, el Perfil solo las últimas 5, y el marcador de
//                "leído" solo se actualiza al abrir la lista de "quién le
//                dio like" de esa sesión concreta -- sin ningún sitio
//                desde el que abrirla, no había forma de quitar el
//                aviso. Ahora, en cuanto una sesión con like sin leer
//                deja de ser alcanzable en los DOS sitios a la vez, deja
//                de contar en la campanita -- se autolimpia sola, sin
//                necesidad de haberla visto (a costa de que, si pasa
//                eso, no llegarás a enterarte de ese like en concreto).
// Versión: 3.73 - Bump de caché (v328 -> v329): session-invites.js -- el
//                fix anterior del parpadeo (quitar el cerrarModalSesion()
//                antes de abrir el generador) no era suficiente: el
//                propio overlay del generador nace en opacity:0 y se
//                funde a 1 en 0.2s -- durante ese fundido se transparenta
//                el fondo negro y se sigue viendo un flash del modal de
//                detrás. _crearOverlayModal() admite ahora un segundo
//                parámetro sinFade: cuando se abre el generador en modo
//                auto-asignación (encima de otro modal ya visible, como
//                el de descanso) se salta el fundido -- aparece opaco
//                desde el primer instante, sin flash. Además, al guardar
//                ya no se abre de golpe el detalle de la sesión recién
//                creada (era otro salto de por medio): se cierra el
//                generador y se queda tal cual en el calendario, ya
//                actualizado con la sesión nueva.
// Versión: 3.72 - Bump de caché (v327 -> v328): calendar.js -- dos fixes
//                del "+"/entrenos no programados: (1) en un día
//                totalmente vacío, antes solo el botoncito "+" abría el
//                generador -- ahora la celda ENTERA es pulsable (el "+"
//                se queda solo como pista visual). (2) el botón "➕ CREAR
//                SESIÓN" del modal de descanso cerraba ese modal antes de
//                abrir el generador, y como son dos overlays
//                independientes con sus propias animaciones de
//                fundido, se veía un parpadeo feo entre uno y otro. Ya no
//                se cierra el modal de descanso primero: el generador
//                tiene un z-index más alto (60000 vs 10000) y se apila
//                encima sin más: al terminar, el detalle de la sesión
//                recién creada reutiliza el mismo modal que ya estaba
//                abierto (misma transición limpia que ya arreglamos para
//                que no reencolara/duplicara sesiones).
// Versión: 3.71 - Bump de caché (v326 -> v327): index.html, calendar.js
//                -- (1) landing page (#landingContainer) actualizada: se
//                añaden 4 tarjetas nuevas a "Más que una calculadora"
//                (GPS en tiempo real, récords y progreso, entrenador
//                personal, carga y recuperación) y se amplía la
//                descripción de "Comunidad activa" para mencionar el
//                chat y la duración de 24h del muro -- el resto de la
//                landing (hero, 6 zonas, sección para marcas) se deja
//                igual. (2) FIX: el botón "➕ CREAR SESIÓN" del modal de
//                descanso podía no aparecer aunque el día fuera
//                elegible -- dependía de this._fechaInicioPlan, una
//                propiedad que solo se rellena dentro de
//                mostrarCalendario()/renderizarMes(); si el detalle se
//                abría sin haber pasado por ahí en esa misma carga, se
//                perdía sin motivo real. _diaElegibleParaNoProgramado()
//                y el cálculo de la fecha del día en abrirDetalleSesion()
//                ahora derivan la fecha de inicio directo de la fuente
//                real (AppState.planGeneradoActual.fechaInicio), sin
//                depender de ese estado intermedio.
// Versión: 3.70 - Bump de caché (v325 -> v326): index.html, guia.html --
//                modal "NOVEDADES DE ESTA VERSIÓN" actualizado con el
//                título "ACTUALIZACIÓN DE SEPTIEMBRE" (para poder ir
//                cambiando solo la palabra del mes cada vez que se
//                anuncien novedades) y 4 puntos: registrar entrenos no
//                programados, corregir la zona real de una sesión, el
//                muro dura 24h exactas, y una nota genérica de
//                "optimización de procesos" para los arreglos internos
//                sin entrar en detalle. RI5_VERSION_NOVEDADES actualizado
//                a 'ri5-v326' para que vuelva a mostrarse a todo el
//                mundo. guia.html ampliada con los mismos temas: dos
//                tarjetas nuevas en "Marcar sesiones" (corregir zona +
//                entrenos no programados) y una nota en "Comunidad" sobre
//                la duración de 24h del muro.
// Versión: 3.69 - Bump de caché (v324 -> v325): calendar.js -- dos fixes
//                del "+" superpuesto en días de descanso: (1) tocar el
//                "+" pequeño abría el compositor directamente, saltándose
//                el modal de descanso -- ahora ese "+" no tiene su propio
//                clic cuando está sobre un día con sesión (descanso): el
//                toque se propaga al de la celda, que siempre abre el
//                modal de descanso primero (con "CREAR SESIÓN" dentro, si
//                toca). El "+" de un día TOTALMENTE vacío sigue abriendo
//                el compositor directamente, ahí no hay nada que mostrar
//                antes. (2) el botón "➕ CREAR SESIÓN" del modal de
//                descanso no se centraba, mismo motivo que el botón
//                "ELIMINAR SESIÓN" de hace unas versiones: .action-button
//                es display:block y con width:auto un bloque se estira a
//                ocupar todo el ancho -- el contenedor pasa a ser flex
//                con justify-content:center en vez de text-align:center.
// Versión: 3.68 - Bump de caché (v323 -> v324): calendar.js -- al abrir
//                el detalle de un día de "descanso" (con la explicación y
//                el objetivo del descanso), si ese día es elegible para
//                registrar un entreno no programado (mismas reglas que el
//                "+" del calendario, según tipo de plan), aparece debajo
//                de la explicación un botón normal de la app ("➕ CREAR
//                SESIÓN") que abre el mismo compositor de siempre. De
//                paso: la regla de elegibilidad del "+" se factoriza en
//                _diaElegibleParaNoProgramado() para no tener la misma
//                lógica duplicada en dos sitios, e insertarSesionManualEnPlan
//                ahora sustituye un "descanso" existente en vez de
//                bloquear la creación (solo se sigue sin poder pisar una
//                sesión REAL ya asignada).
// Versión: 3.67 - Bump de caché (v322 -> v323): calendar.js -- dos
//                cambios acordados tras revisar lo del generador (se
//                descarta tocarlo, demasiado riesgo para lo que aporta):
//                (1) el "+" ahora también se superpone en los días de
//                "descanso" (no solo en huecos totalmente vacíos) de
//                CUALQUIER tipo de plan, no solo el personalizado -- las
//                reglas de qué días son elegibles (por tipo de plan) no
//                cambian, factorizadas en el helper
//                _botonNoProgramadoHTML() para que el botón se vea igual
//                en los dos casos. Cuando hay "+", se quita el "—" de la
//                "D" (no aportaba nada) para que la celda quede
//                organizada: "D" centrada arriba, "+" en su esquina. (2)
//                el rango del "+" en el plan personalizado (hoy -> 31 de
//                diciembre del año en que se creó) se amplía solo al año
//                de la sesión más lejana que el entrenador ya haya
//                mandado, si esa sesión cae después de ese 31 de
//                diciembre.
// Versión: 3.66 - Bump de caché (v321 -> v322): calendar.js, app.js,
//                session-invites.js -- el "+" no salía porque, aunque un
//                día no tuviera sesión "de verdad", el plan lo rellenaba
//                con un "descanso" por defecto (D) -- y el "+" solo se
//                ponía en días TOTALMENTE vacíos, que casi nunca existen.
//                Ahora el comportamiento se distingue por tipo de plan:
//                - Plan GENERADO (cerrado, con fechas fijas): igual que
//                  antes, sin cambios.
//                - Plan PERSONALIZADO (el que se crea vacío para todo el
//                  año en curso e ir recibiendo sesiones sueltas del
//                  entrenador): TODOS los días desde HOY hasta el 31 de
//                  diciembre de ese año que no tengan una sesión de
//                  verdad asignada por el entrenador muestran el "+" --
//                  esto incluye tanto los días vacíos como los que están
//                  en "descanso" por defecto (el "+" se superpone al
//                  "D"). En cuanto el entrenador asigna una sesión a ese
//                  día, la sesión sustituye al "+". Para poder distinguir
//                  el tipo de plan se añade AppState.planActualTipo,
//                  guardado en los cuatro sitios donde se carga un plan
//                  como activo (nuevo plan generado, último guardado,
//                  historial de planes, restaurado de localStorage, y al
//                  aceptar una sesión enviada).
// Versión: 3.65 - Bump de caché (v320 -> v321): calendar.js -- FIX: el
//                "+" para registrar un entreno no programado no salía en
//                el plan personalizado. Causa real: _fechaFinPlan no es
//                "hasta cuándo dura el plan", sino "hasta la fecha de la
//                ÚLTIMA sesión que ya existe" en el array -- en el plan
//                generado no se nota porque todos los días tienen sesión
//                (aunque sea "descanso"), pero en el personalizado, que
//                solo tiene las sesiones sueltas que manda el admin, esa
//                fecha se quedaba corta y cualquier día de hoy en
//                adelante quedaba fuera de rango. El "+" ya no depende de
//                ese límite -- solo de que el día sea desde que empezó el
//                plan hasta hoy.
// Versión: 3.64 - Bump de caché (v319 -> v320): calendar.js,
//                session-invites.js -- NUEVO: registrar un entreno no
//                programado. Los días del calendario que siguen sin
//                sesión asignada (dentro del rango del plan, hoy o en el
//                pasado) muestran un "+" pequeño. Al tocarlo se abre el
//                MISMO compositor de "Nueva sesión" que ya usa el admin
//                para enviar sesiones (tipo + estructura), pero en modo
//                "para mí mismo": sin paso de fecha (ya es el día
//                pulsado) ni de destinatarios. Al confirmar, se calcula
//                la personalización con los propios datos del usuario
//                (igual que al aceptar un envío del admin) y la sesión se
//                inserta directamente en el plan que ya tiene abierto
//                (sin crear ningún plan paralelo ni cambiar el activo),
//                y se abre su detalle -- desde ahí, marcarla como
//                realizada con los datos reales es el mismo camino que ya
//                usa cualquier otra sesión del calendario.
// Versión: 3.63 - Bump de caché (v318 -> v319): calendar.js, profile.js,
//                session-invites.js -- barrido completo del mismo patrón
//                de toasts contradictorios arreglado en friends.js (v3.62),
//                encontrados 4 casos más:
//                - calendar.js: eliminar un plan guardado -- un fallo
//                  refrescando el historial de planes después de borrar
//                  mostraba "Error al eliminar el plan" aunque SÍ se
//                  hubiera borrado.
//                - profile.js: actualizar foto de perfil -- un fallo
//                  refrescando perfil/amigos/badge después de subir la
//                  foto mostraba "Error al procesar la imagen" aunque la
//                  foto SÍ se hubiera subido y guardado.
//                - profile.js: guardar datos del perfil -- mismo caso con
//                  "Error al guardar perfil" tras un fallo solo en el
//                  refresco posterior.
//                - session-invites.js: aceptar una sesión enviada -- este
//                  no era solo un toast engañoso: si fallaba algo pintando
//                  el calendario o el dashboard DESPUÉS de guardar la
//                  sesión en el plan (ya comprometido en Firestore), el
//                  catch no solo mostraba error sino que además reencolaba
//                  la sesión con unshift -- la siguiente vuelta la volvía
//                  a procesar y la DUPLICABA en el plan. Ahora, en los
//                  cuatro casos, la acción que de verdad importa (guardar/
//                  subir/borrar) y su refresco de UI posterior van en
//                  tries separados, igual que en friends.js.
// Versión: 3.62 - Bump de caché (v317 -> v318): friends.js -- FIX toasts
//                contradictorios (verde de éxito seguido de rojo de error
//                de golpe), reportado al aceptar solicitudes de amistad
//                pero presente en 5 sitios con el mismo patrón:
//                enviarSolicitud, aceptarSolicitud, rechazarSolicitud,
//                cancelarSolicitud y eliminarAmigo. Causa real: en las
//                cinco, el toast de éxito se lanzaba a mitad del try, y
//                justo después seguían varias llamadas de refresco
//                (recargar listas de amigos/solicitudes, actualizar
//                contadores, crear la conversación de chat al aceptar)
//                dentro del MISMO try/catch que la acción principal -- si
//                cualquiera de esos refrescos fallaba (un hipo de red),
//                saltaba el catch y se veía "Error al ..." encima del
//                éxito, aunque la acción en sí (aceptar/enviar/rechazar/
//                cancelar/eliminar) SÍ se hubiera hecho bien de verdad.
//                Ahora la acción principal y su refresco posterior van en
//                tries separados: solo un fallo real de la acción
//                muestra el rojo; si falla solo el refresco, se queda en
//                consola y las listas se autocorrigen en el siguiente
//                refresco, sin toast contradictorio.
// Versión: 3.61 - Bump de caché (v316 -> v317): session-invites.js -- FIX:
//                un lote eliminado del historial de "sesiones enviadas"
//                volvía a aparecer al pulsar "CARGAR MÁS". Los documentos
//                SÍ se borraban de verdad en Firestore, pero el lote solo
//                se quitaba del array que se ve en pantalla -- seguía
//                dentro del Map interno que guarda todo lo ya leído para
//                alimentar "cargar más", así que reaparecía desde ahí sin
//                volver a leer Firestore. Ahora se quita de los dos
//                sitios a la vez al eliminar.
// Versión: 3.60 - Bump de caché (v315 -> v316): session-invites.js -- dos
//                fixes en el botón "🗑️ ELIMINAR SESIÓN" del detalle del
//                historial: (1) no se centraba porque .action-button es
//                display:block y con width:auto un bloque se estira a
//                ocupar todo el ancho -- el text-align:center del
//                contenedor no tiene efecto sobre eso. Ahora el
//                contenedor es un flex con justify-content:center (mismo
//                patrón que ya usan CERRAR/REUTILIZAR), así el botón sí
//                se encoge a su contenido y queda centrado de verdad.
//                (2) el rojo #e74c3c apenas se leía en modo claro (fondo
//                casi blanco) -- en claro se usa un rojo más oscuro
//                (#B8362A), mismo criterio que ya sigue _colorTipo() para
//                el resto de acentos de esta pantalla.
// Versión: 3.59 - Bump de caché (v314 -> v315): session-invites.js -- el
//                borde/color del botón "🗑️ ELIMINAR SESIÓN" (detalle del
//                historial) pasa de var(--zone-5) (gris, no se veía como
//                un aviso de "borrar") al rojo real #e74c3c que ya usa
//                este mismo archivo para el botón de quitar un paso.
// Versión: 3.58 - Bump de caché (v313 -> v314): session-invites.js -- en
//                el detalle de una sesión del historial, el enlace de
//                texto subrayado "🗑️ Eliminar esta sesión del historial"
//                pasa a ser un botón normal (class="action-button", igual
//                que el resto de la app), con el mismo estilo/color de
//                "eliminar" que ya usa el botón de grupos favoritos, y el
//                texto se acorta a "🗑️ ELIMINAR SESIÓN".
// Versión: 3.57 - Bump de caché (v312 -> v313): session-invites.js --
//                el botón "CARGAR 10 MÁS ANTIGUAS" del historial de
//                sesiones enviadas pasa a decir simplemente "CARGAR MÁS".
// Versión: 3.56 - Bump de caché (v311 -> v312): session-invites.js -- FIX:
//                el historial de "ÚLTIMAS SESIONES CREADAS" solo mostraba
//                2-3 lotes en vez de 10. Causa real (mismo patrón que el
//                bug ya arreglado en Soporte): se leía un único bloque
//                fijo de 60 documentos EN BRUTO de sessionInvites (uno
//                por destinatario) y se agrupaban por batchId -- pero un
//                envío a 20-30 personas de golpe consume 20-30 de esos 60
//                documentos, así que con 2-3 envíos así el límite ya
//                estaba agotado y los lotes más antiguos ni se leían de
//                Firestore. Ahora se piden bloques de 60 documentos uno
//                tras otro hasta reunir 10 LOTES distintos (o agotar la
//                colección), con "CARGAR 10 MÁS ANTIGUAS" para seguir
//                viendo el resto.
// Versión: 3.55 - Bump de caché (v310 -> v311): calendar.js, gps-tracker.js
//                -- se quita la opción "AUTO (Z3 · TEMPO)" del select de
//                zona en los dos modales de fin de sesión (el de marcado
//                manual y el de fin de GPS). Ahora, mientras el usuario
//                no toque el desplegable, es la propia opción calculada
//                (ej. "Z3 · TEMPO") la que aparece marcada de verdad en
//                el select nativo del sistema (con el check del picker de
//                iOS/Android) y con su color en el borde de la caja --
//                nada de un texto "AUTO (...)" aparte que haya que leer.
//                Si el usuario elige otra zona distinta, esa pasa a ser
//                la corrección manual que se guarda; si no toca nada, se
//                guarda la que ya salía marcada.
// Versión: 3.54 - Bump de caché (v309 -> v310): calendar.js -- FIX GRAVE:
//                al marcar una sesión como hecha, la zona "resultante"
//                (tanto la que se guardaba de verdad como la que se
//                mostraba en AUTO en el selector) podía salir disparatada
//                -- ej. Z1 (recuperación) para un tempo corrido a 5:36/km,
//                claramente Z3. Causa real: _desglosarSesion comparaba
//                SIEMPRE el ritmo real contra las zonas ACTUALES del
//                usuario (AppState.lastZones/lastRitmoBase) -- si el
//                usuario recalcula sus zonas (con una marca mejor o peor)
//                después de que el plan ya estuviera generado, TODAS las
//                sesiones ya generadas del plan quedan "descuadradas": una
//                sesión pensada para Z3 con las zonas de cuando se generó
//                el plan podía compararse contra unas zonas nuevas y más
//                rápidas, y salir Z1 sin que hubiera pasado nada raro en
//                la sesión en sí. Ahora, si lo corrido de verdad (km y
//                minutos) coincide con lo planificado dentro de un margen
//                razonable (±8%), la zona resultante es directamente la
//                zona PROGRAMADA de la sesión (fija, ajena a que luego se
//                recalculen las zonas) -- solo si de verdad se corre
//                distinto a lo planificado se sigue estimando por ritmo
//                como hasta ahora, y ahí sigue disponible la corrección
//                manual del selector para cuando ni el ritmo refleja bien
//                el esfuerzo real (cuestas, pulso alto). Afecta tanto al
//                modal de "DATOS DE LA SESIÓN" (marcado manual) como al
//                de fin de sesión GPS, que comparten la misma función.
// Versión: 3.53 - Bump de caché (v308 -> v309): calendar.js, gps-tracker.js
//                -- la v3.52 abría un cuadradito emergente hecho a mano
//                (mismo estilo que el popup de "tipo de sesión") para
//                corregir la zona real, pero lo que en realidad se pedía
//                era más simple: usar el propio <select> nativo del
//                sistema, igual que "ZONA DE ENTRENAMIENTO" en el
//                composer de "Nueva sesión" (session-invites.js, sgZona).
//                Se elimina todo el JS de popup propio: ahora es un
//                <select> normal con las 6 zonas + AUTO (que muestra en
//                vivo qué zona saldría calculada por ritmo/km/tiempo), y
//                es el sistema operativo el que dibuja el desplegable.
// Versión: 3.52 - Bump de caché (v307 -> v308): calendar.js, gps-tracker.js
//                -- la v3.51 sustituyó los 7 botones siempre visibles por
//                un botón + panel desplegable, pero el panel se abría
//                DENTRO de la propia tarjeta de zona: seguía ocupando el
//                mismo espacio en pantalla, solo que metido dentro en vez
//                de debajo. Ahora, al tocar la zona, se abre el mismo
//                cuadradito emergente y centrado que ya se usaba aquí
//                mismo para elegir el tipo de sesión (abrirSelectorTipo)
//                -- una ventanita flotando encima de todo, que no empuja
//                el resto de la tarjeta ni de la pantalla.
// Versión: 3.51 - Bump de caché (v306 -> v307): calendar.js, gps-tracker.js
//                -- en el modal "Datos de la sesión" (marcar sesión hecha
//                a mano) y en el de fin de sesión con GPS, la fila fija de
//                7 botones siempre visibles (AUTO + Z1..Z6) para corregir
//                la zona real de esfuerzo se sustituye por un solo botón:
//                muestra la zona automática (la misma que se calculaba
//                antes por ritmo/km/tiempo, ahora también en vivo en el
//                modal de GPS) y, al tocarlo, despliega el selector para
//                elegir la zona real; al elegir una, el selector se
//                recoge solo. Sin cambios en el cálculo de zona ni en el
//                guardado -- solo en cómo se elige.
// Versión: 3.50 - Bump de caché (v304 -> v305): app.js -- FIX del panel
//                de Soporte del admin: un broadcast a 30 usuarios a la vez
//                mostraba las 30 conversaciones de golpe en vez de solo
//                las 10 más recientes (la lista final nunca se recortaba
//                al objetivo, solo se usaba para decidir si pedir más a
//                Firestore). wall.js -- las publicaciones del muro pasan
//                de durar "hoy y ayer" (día natural) a 24h exactas desde
//                que se publicaron, con purga local periódica; además fix
//                de un listener de 'visibilitychange' que se duplicaba
//                cada vez que se entraba en la pestaña Muro.
// Versión: 3.49 - Bump de caché (v303 -> v304): gps-tracker.js -- FIX
//                GRAVE de fidelidad del GPS: una carrera real de 10,5 km
//                se guardaba con ~7 km. Causa: _smoothAndSimplify (además
//                de una media móvil) FUNDÍA puntos consecutivos en uno
//                solo cuando el cambio de dirección entre ellos era
//                pequeño (<10°), para "enderezar" el zigzag de ruido GPS.
//                En cualquier tramo con curvas reales SUAVES (una calle
//                que serpentea, un camino de parque -- la inmensa mayoría
//                de recorridos reales, no solo líneas rectas) esto iba
//                sustituyendo puntos en vez de añadirlos mientras la
//                desviación acumulada se mantuviera por debajo del
//                umbral -- y esa referencia se quedaba cada vez más atrás
//                según se fundían puntos, así que una curva sostenida
//                podía recortarse (cuerda en vez de arco) durante un buen
//                tramo. Sumado a lo largo de una sesión entera, esto
//                podía recortar el kilometraje real de forma muy notable.
//                A petición expresa del usuario ("si hago diez
//                kilómetros, diez kilómetros"), se elimina por completo
//                _smoothAndSimplify: el punto que ya limpia _filterGPS
//                (precisión ≤15m, sin saltos físicamente imposibles, sin
//                duplicados a <1,5m) se usa tal cual, sin ningún redondeo
//                ni fusión adicional. El track puede verse algo más "en
//                zigzag" en el mapa que antes -- es el precio de que el
//                kilometraje sea el real, que es justo lo que se pidió.
//                De paso se corrige el console.log final de este archivo,
//                que llevaba varias versiones sin actualizarse (indicaba
//                v292 aunque CACHE_NAME ya iba por delante).
// Versión: 3.48 - Bump de caché (v291 -> v292): guia.html -- el fix de la
//                v3.47 (min-height:60px calculado a ojo) se quedaba corto:
//                un botón de dos líneas de verdad crece por encima de un
//                min-height si su texto lo pide, así que "RI5 Premium"
//                (una sola línea) seguía viéndose más bajo que esos.
//                Ahora es height FIJO (68px, sitio de sobra para dos
//                líneas a 12px) para TODOS los botones del índice -- ya
//                no depende de estimar cuánto ocupa cada texto, todos
//                miden exactamente lo mismo siempre.
// Versión: 3.47 - Bump de caché (v290 -> v291): guia.html -- FIX: el
//                botón "RI5 Premium" del índice de temas se veía más
//                pequeño (más bajo) que el resto. Causa: al ser el
//                último de un número impar de botones, queda solo en su
//                propia fila del grid -- los botones EMPAREJADOS ya se
//                igualan de alto entre sí solos (comportamiento por
//                defecto de CSS Grid dentro de una misma fila), pero al
//                no tener con quién igualarse, se quedaba con su altura
//                mínima natural (su texto es corto y cabe en una sola
//                línea, a diferencia de varios de los demás). Se añade
//                una altura mínima compartida por todos los botones del
//                índice para que esto no vuelva a pasar, y de paso, a
//                petición del usuario, un toque de color dorado (el
//                color de marca de la app, --gold) para distinguir este
//                tema como especial.
// Versión: 3.46 - Bump de caché (v289 -> v290): training.js, guia.html --
//                a petición del usuario, el enlace de texto subrayado
//                "Editar esta zona a mano" (añadido en la v3.45) se
//                sustituye por un botón pequeño y centrado ("EDITAR
//                ZONA") en el mismo sitio, al final del detalle
//                expandido de cada tarjeta de zona -- misma acción de
//                siempre (Training.abrirEdicionZona), solo cambia cómo
//                se ve: ya no es texto subrayado pegado a la izquierda,
//                ahora es un botón con borde, centrado. La guía se
//                actualiza para reflejarlo.
// Versión: 3.45 - Bump de caché (v288 -> v289): training.js, guia.html --
//                a petición del usuario, el botón EDITAR de cada tarjeta
//                de zona (flotante, con borde, siempre visible incluso
//                colapsada) tenía demasiado protagonismo para una acción
//                poco frecuente -- competía visualmente con el propio
//                título de la zona. Se sustituye por un enlace de texto
//                discreto ("Editar esta zona a mano") al final del
//                detalle EXPANDIDO de la tarjeta: solo aparece cuando el
//                usuario ya la ha tocado para ver más, que es cuando
//                tiene sentido ofrecérselo. La guía se actualiza para
//                reflejarlo.
// Versión: 3.44 - Bump de caché (v287 -> v288): index.html -- se
//                actualiza el contenido del modal "Novedades de esta
//                versión" (llevaba desde ri5-v133 sin tocarse, con
//                novedades ya viejas: colores por nivel, gestión de
//                carga, planes con TSS...). Ahora anuncia lo más
//                relevante de verdad para un usuario que abre la app hoy:
//                recibir sesiones de un admin/entrenador, la edición
//                manual de zonas, la mayor precisión de los récords por
//                tramo GPS, el visor de recorridos y la guía actualizada.
//                RI5_VERSION_NOVEDADES sube a 'ri5-v288' en línea con el
//                CACHE_NAME de este mismo bump, para que el modal vuelva
//                a aparecer aunque el usuario ya hubiera visto (y
//                cerrado) la versión antigua.
// Versión: 3.43 - Bump de caché (v286 -> v287): guia.html, training.js,
//                storage.js -- dos cambios:
//                1) guia.html: el botón "RI5 Premium" del índice (13º
//                   botón, número impar en una rejilla de 2 columnas)
//                   quedaba solo en su fila, pegado a la columna
//                   izquierda ("de pico"). Se añade la clase .item-solo
//                   (ocupa la fila entera pero limita su ancho al de un
//                   botón normal y lo centra con margin:auto) y se aplica
//                   a ese botón.
//                2) Se implementa de verdad la edición manual de zonas
//                   que la guía ya describía (la nota se añadió antes de
//                   que existiera la función -- ahora existe). Cada
//                   tarjeta de zona en "Calcular tus zonas" tiene un
//                   botón EDITAR (texto, sin emoticono de lápiz) que abre
//                   un formulario para ajustar a mano su FC (mínima/
//                   máxima) y su ritmo. Al guardar, esos valores se
//                   convierten al % de FC (sobre el umbral) y factor de
//                   ritmo (sobre el ritmo base) equivalentes y se
//                   sobrescriben en la propia zona -- así ningún otro
//                   sitio de la app (planes, sesiones GPS, invitaciones
//                   de admin) necesita cambiar nada, todos siguen leyendo
//                   la zona exactamente igual que antes. La zona editada
//                   se marca como "PERSONALIZADA" (8º elemento de la
//                   tupla, ahora también guardado/reconstruido en
//                   storage.js al leer/escribir en Firestore). Volver a
//                   pulsar CALCULAR regenera las zonas desde cero y borra
//                   cualquier ajuste manual, tal y como ya avisaba la
//                   guía.
// Versión: 3.42 - Bump de caché (v285 -> v286): guia.html -- se añade la
//                página que faltaba, "Sesiones enviadas" (invitaciones de
//                un admin/entrenador, cómo aceptarlas/rechazarlas, y que
//                hacen falta las zonas calculadas o se rechazan solas);
//                se añade una nota en "Calcular tus zonas" sobre el nuevo
//                botón ✏️ de edición manual de zona; y se corrige la
//                explicación de "Récords personales", que describía un
//                mecanismo antiguo (sesión entera dentro de un 15% de la
//                distancia estándar) que ya no es como funciona de verdad
//                desde el fix de récords por tramo GPS -- ahora explica
//                que busca el tramo continuo más rápido de esa distancia
//                DENTRO de cualquier sesión GPS, y que las paradas no
//                cuentan. guia.html no estaba en PRECACHE_URLS pero sí se
//                cachea igualmente al visitarla (fetch handler genérico),
//                así que sin este bump de versión los que ya la hubieran
//                abierto seguirían viendo la versión vieja.
// Versión: 3.41 - Bump de caché (v284 -> v285): app.js -- "Eliminar
//                usuario" (panel admin) ahora borra TODO su rastro en
//                Firestore: además de lo que ya borraba (subcolecciones
//                propias, gamificación, publicaciones), ahora también
//                purga mensajes de soporte (subcolección + colección
//                global del admin), solicitudes de amistad,
//                conversaciones, invitaciones de sesión, grupos creados
//                y membresía en grupos ajenos, sus "me gusta" en
//                publicaciones de otros usuarios, su presencia en la
//                lista de amigos de quien le tuviera añadido, y su foto
//                de perfil en Storage. La cuenta de Firebase
//                Authentication sigue sin poder borrarse desde el
//                cliente -- hay que borrarla a mano en la consola de
//                Firebase (Authentication > usuario > eliminar) o montar
//                una Cloud Function para automatizarlo.
// Versión: 3.40 - Bump de caché (v283 -> v284): app.js -- ahorro de
//                lecturas de Firestore. Los listeners en tiempo real de
//                "mensajes de soporte propios" y "me gusta propios"
//                (globalFeed) escuchaban TODO el historial del usuario
//                sin límite; cada reconexión (móvil bloqueado/desblo-
//                queado corriendo con GPS, cortes de cobertura) volvía a
//                facturar una lectura por cada documento de ese
//                histórico completo aunque no hubiera cambiado nada --
//                con pocos usuarios activos pero historial acumulado,
//                esto podía comerse gran parte de la cuota diaria
//                gratis sin tráfico real. Ahora ambos listeners se
//                acotan con orderBy+limit (últimos 50 mensajes / últimas
//                30 publicaciones); el chat de soporte completo y las
//                publicaciones antiguas se siguen viendo enteros al
//                abrir esas pantallas (usan una lectura puntual, no
//                estos listeners) -- solo se acota el aviso en vivo de
//                fondo. IMPORTANTE: la consulta de "me gusta propios"
//                combina un where con un orderBy en otro campo, así que
//                Firestore puede pedir crear un índice compuesto la
//                primera vez (aparece como error en la consola del
//                navegador con un enlace para crearlo en un clic, gratis
//                y en ~1 minuto).
// Versión: 3.39 - Bump de caché (v282 -> v283): gps-track-viewer.js -- FIX
//                del "latido" incómodo al abrir el modal del track GPS
//                desde el Muro o el Perfil. Causa: al crear el mapa, tras
//                el primer encuadre (fitBounds) había una segunda llamada
//                fija a los 300ms "por si acaso" el layout no estuviera
//                asentado -- pero esa llamada se disparaba SIEMPRE, en
//                cada apertura, aunque el contenedor no hubiera cambiado
//                de tamaño ni un píxel desde el primer encuadre; ese
//                segundo fitBounds sobre el mismo mapa (aunque con
//                animate:false) se notaba como un pequeño salto/latido
//                justo después de abrirse. Se sustituye por un
//                ResizeObserver que solo reencuadra si el contenedor
//                cambia de tamaño de verdad (layout tardío, rotación,
//                resize de ventana) -- en la apertura normal ya no hay
//                doble salto, y el mapa sigue totalmente interactivo
//                (se puede mover y hacer zoom con normalidad).
// Versión: 3.38 - Bump de caché (v281 -> v282): gamification.js -- FIX de
//                un caso límite real del fix de récords de la v3.36: capar
//                a 8s el tiempo de CUALQUIER hueco entre dos puntos GPS
//                (_MAX_GAP_MS) arreglaba las paradas/pausas, pero si
//                durante ese mismo hueco se cubría una distancia real
//                considerable -- ej. un corte de señal GPS de 40s dentro
//                de un túnel o entre edificios altos, sin dejar de correr
//                -- capar el tiempo dejando la distancia completa producía
//                un ritmo implícito imposible que "ganaría" con toda
//                seguridad la búsqueda del tramo más rápido: un récord
//                falso, esta vez demasiado RÁPIDO en vez de demasiado
//                lento (el problema contrario al de la v3.36). Ahora
//                _mejorTramo() distingue "parada de verdad" (poca o
//                ninguna distancia real en el hueco -- se sigue capando el
//                tiempo, como ya hacía) de "hueco no fiable" (mucho tiempo
//                Y mucha distancia real a la vez -- no hay forma de saber
//                el ritmo real ahí dentro, así que cualquier tramo
//                candidato que lo cruce se descarta directamente en vez de
//                adivinar). Con esto, cualquier récord (1/5/10/21.1/42.2
//                km) que se registre puede confiarse: o sale de un tramo
//                GPS completo y fiable de principio a fin, o no se
//                registra ningún récord para esa sesión.
// Versión: 3.37 - Bump de caché (v280 -> v281): index.html, app.js -- FIX
//                modales de admin (Detalle de usuario, y las 4 tarjetas
//                de listas: Total/Premium/Nuevos/Sesiones hoy): el botón
//                CERRAR se desplazaba con el scroll de la lista en vez de
//                quedarse fijo abajo -- había que bajar del todo para
//                llegar a él. Causa: .admin-modal-content (la caja que
//                envuelve cabecera+contenido+pie) tenía el overflow-y:auto
//                puesto a ELLA, así que los tres bloques hacían scroll
//                juntos como uno solo. Ahora .admin-modal-content es un
//                contenedor flex en columna que ya no hace scroll (over-
//                flow:hidden); cabecera y pie quedan fijos (flex-shrink:0)
//                y solo el div de contenido interior (#adminModalContent /
//                #adminListModalContent) crece y hace scroll -- el botón
//                CERRAR queda siempre visible sin importar cuántos
//                usuarios haya en la lista. De paso, en app.js, el reseteo
//                de scroll al abrir/cerrar el modal de detalle de usuario
//                apuntaba a la caja exterior (que ya no se mueve); ahora
//                apunta al div interior correcto, así que cada vez que se
//                abre con otro usuario aparece desde arriba, no por donde
//                se dejó la vez anterior. También había una regla CSS
//                duplicada específica de #adminListModal que volvía a
//                poner overflow-y:auto en toda la caja, deshaciendo el fix
//                solo para esa tarjeta -- se elimina.
// Versión: 3.36 - Bump de caché (v279 -> v280): gamification.js,
//                session-invites.js -- dos fixes:
//                1) gamification.js: FIX récord por km más lento que la
//                   propia media de la sesión (ej. sesión a 6:20/km de
//                   media, "nuevo récord" mostrado a 7:xx/km -- matemáti-
//                   camente imposible si de verdad es el tramo más
//                   rápido). Causa: _mejorTramo() calculaba la duración de
//                   cada tramo candidato como la diferencia bruta de
//                   marca de tiempo (reloj real) entre sus dos puntos GPS,
//                   sin descontar ninguna parada -- ni las del botón
//                   PAUSA (que sí se descuentan para la media de la
//                   sesión, ver _getElapsed() en gps-tracker.js), ni las
//                   paradas "silenciosas" sin pulsar pausa (semáforo,
//                   corte de señal bajo techo/entre edificios), que
//                   tampoco añaden puntos al track pero sí dejan pasar
//                   tiempo real. Si el tramo más rápido cruzaba uno de
//                   estos huecos, salía con una duración inflada. Ahora
//                   se usa un "tiempo activo" que tapa cualquier hueco
//                   entre dos puntos GPS consecutivos a un máximo de 8s
//                   antes de sumarlo (ver _MAX_GAP_MS), igual de estricto
//                   con una sesión corrida sin parar (los huecos normales
//                   entre puntos GPS son de pocos segundos) pero ya no
//                   penaliza un tramo por cruzar una parada larga.
//                2) session-invites.js: FIX bucle infinito en la pantalla
//                   "⏳ Calculando tu ritmo, tiempo y calorías..." al
//                   recibir una sesión enviada por un admin. Causa: un
//                   ReferenceError real (variables `modoParte`/
//                   `parteInput` usadas fuera del bloque donde se
//                   declaraban, para sesiones tipo 'series') que se
//                   disparaba en cuanto la comprobación de "sin zonas
//                   calculadas" no cortaba antes -- y esa comprobación
//                   nunca se disparaba de verdad porque miraba un campo
//                   que nunca llegaba a valer null. Al no capturarse el
//                   error, la ejecución se cortaba justo tras pintar el
//                   modal de "Calculando...", que quedaba así congelado
//                   para siempre. Ahora la comprobación de "sin zonas" se
//                   hace de forma fiable ANTES de intentar personalizar
//                   nada (mirando directamente si el destinatario tiene
//                   cálculo de zonas guardado): si no lo tiene, se avisa
//                   y la sesión se rechaza automáticamente en el momento
//                   (ya no se ofrece "ir a calcular zonas y volver más
//                   tarde" -- a petición del usuario, el admin tendrá que
//                   reenviarla cuando el destinatario tenga sus zonas).
// Versión: 3.35 - Bump de caché (v278 -> v279): gps-tracker.js -- a
//                petición del usuario, se ELIMINA POR COMPLETO el ajuste
//                a calles (OSRM _mapMatchTrack/_matchEsFiable): el track
//                del mapa debe ser exactamente el grabado por el GPS,
//                sin que ningún servicio externo lo reinterprete (podía
//                "pegar" la ruta a un camino no pisado si se corría por
//                campo). El único procesado que queda es Douglas-Peucker,
//                con el margen bajado de 4m a 2m (el error máximo pedido)
//                -- solo reduce el número de puntos guardados, nunca
//                desvía el trazado más de esos 2m. Los saltos GPS
//                imposibles (ej. "20m en 1s") ya se descartaban en
//                directo desde antes (_filterGPS, tope 18 km/h).
// =====================================================================

const CACHE_NAME = 'ri5-v536'; // El tiempo indica el lugar real si no coincide con la ciudad del perfil (app.js, index.html) · anterior: Fondo de tiempo con la posición real (GPS) y la ciudad como respaldo (app.js, index.html) · anterior: Fondo animado con el tiempo real en la tarjeta del Dashboard (index.html, app.js) · anterior: Panel admin: la lista de usuarios (total/premium/nuevos/sesiones) ya no parpadea al abrirse (app.js) · anterior: Los modales se cierran directamente, sin animación; solo se mantiene el fundido al abrir (index.html, app.js, friends.js, profile.js, calendar.js, session-invites.js) · anterior: Cierre de modales: una sola animación para todos, caja y fondo transparentes a la vez en 0.15 s (index.html, app.js) · anterior: Cierre de modales: caja 0.1 s y fondo 0.2 s empezando a la vez, sin esperas (index.html, app.js) · anterior: Cierre de modales: caja y fondo se desvanecen a la vez, el fondo por color/desenfoque y no por opacidad (index.html, app.js) · anterior: Cierre de modales sin ver lo de detrás: la caja se desvanece antes que el fondo (index.html, app.js) · anterior: Modales, subpestañas y tarjetas: mismo fundido rápido al abrir y cerrar (index.html, app.js, friends.js, profile.js, session-invites.js) · anterior: Fix: modales centrados (translate) se descolocaban al tocarlos; quitado transform de :active y .ri5-no-press (index.html, app.js) · anterior: Sin efecto de encogerse al pulsar en tarjetas, botones y navegación (index.html) · anterior: Modales: ya no se encogen al pulsar dentro (index.html + app.js) · anterior: Modales: el fondo ya no se mueve al arrastrar sobre un modal (guardián de scroll en app.js) · anterior: Resto de modales (editar perfil, perfil de amigo, cambiar zapatilla, editar zona, prompt, insignia, sesión extra): altura máxima con scroll para que ningún botón quede fuera de pantalla · anterior: Invitación de sesión larga: contenido con scroll y botones ACEPTAR/RECHAZAR siempre visibles (session-invites.js) · anterior: Avisos más cortos: eliminar entrenamiento con el modal de la app y aviso de fatiga (profile.js, calendar.js) · anterior: La sesión recién marcada aparece sola en el Muro y en el Perfil (app.js, calendar.js) · anterior: Solicitudes con estilo de pestañas de la app (index.html) · anterior: Notificación de me gusta abre el modal de likes (index.html, wall.js) · anterior: Solicitudes: botón activo pintado (index.html) · anterior: Desmarcar/eliminar lo deja todo como antes: sesión editada, XP, ritmo, GPS (calendar.js, gamification.js, profile.js) · anterior: Novedades: ruta pintada por zonas (index.html, guia.html) · anterior: Desmarcar/eliminar lo revierte todo: calificación, ruta GPS, contador (calendar.js, gps-tracker.js, profile.js) · anterior: Calendario de altura fija + borrar desde el perfil lo revierte todo (calendar.js, profile.js) · anterior: Guía: RI5 Premium al final y centrado (guia.html) · anterior: Días dobles pintados + novedades y guía (calendar.js, app.js, index.html, guia.html) · anterior: Sesión extra de hoy (calendar.js, gps-tracker.js, session-invites.js) · anterior: Generador: añadir/quitar/mover bloque sin repintar el modal (session-invites.js) · anterior: Generador: añadir/quitar/mover bloque sin perder lo escrito ni subir arriba (session-invites.js) · anterior: Aviso de voz de series con detalle (gps-tracker.js) · anterior: Generador: bloques reordenables arrastrando (session-invites.js) · anterior: Esfuerzos cortos (100-200 m) visibles en el track y la leyenda (gps-tracker.js) · anterior: La leyenda de zonas solo muestra los colores que se ven en el track (gps-tracker.js, gps-track-viewer.js) · anterior: Track por zonas más detallado: 300 puntos y ritmo por ventana de tiempo (gps-tracker.js) · anterior: Desplegable de 3 palabras equivalentes para calentamiento y enfriamiento (session-invites.js, gps-tracker.js) · anterior: Título de calentamiento/enfriamiento como desplegable de opciones (session-invites.js) · anterior: Pasos GPS clasificados por tipo, «Estiramientos» ya no repite el aviso de series (gps-tracker.js) · anterior: Aviso de voz: el enfriamiento ya no repite el de series (gps-tracker.js) · anterior: Nombres largos de zapatilla dentro del recuadro (index.html, profile.js, friends.js) · anterior: Calendario de enviar sesiones con altura fija (session-invites.js) · anterior: Contraste del texto en la tarjeta de tienda (sponsors.js) · anterior: Tarjeta de zonas: nivel solo en fecha y @usuario; color de tienda elegido por el admin (training.js, sponsors.js, index.html) · anterior: Tarjeta compartida de zonas con color de nivel y fecha (training.js) · anterior: Banner de tienda con color de nivel y brillo animado (sponsors.js) · anterior: Fix línea negra en el mini-mapa cacheado (wall.js, mapSnapshotV 5) · anterior: Track por zonas con degradado de color, miniatura del Perfil con mapa real y mini-mapa cacheado a doble resolución (gps-tracker.js, gps-track-viewer.js, wall.js, profile.js) · anterior: Miniatura del muro sin track (zoom 16 centrado en la llegada con bandera) y visor con zoom mínimo 15 centrado en la llegada si el track es muy grande (wall.js, profile.js, gps-track-viewer.js) · anterior: Track GPS por zonas: cada tramo del color de su zona (gps-tracker.js, gps-track-viewer.js, wall.js, profile.js) · anterior: Cerrar sesión vacía la lista de atletas y grupos en memoria (session-invites.js, auth.js) · anterior: Listas de destinatarios: texto CARGANDO con letras de colores en vez de filas grises (session-invites.js) · anterior: Crear sesión / pack: la lista de atletas y los grupos se cargan al pulsar el botón, sin textos de carga después (session-invites.js) · anterior: Generar sesión (paso 3): sin botón ni mensaje de error, la lista de atletas se reintenta sola en silencio hasta cargar (session-invites.js) · anterior: Generar sesión (paso 3): la lista de atletas ya no puede quedar vacía (3 intentos por atleta, estado en vivo y copia local como respaldo; "sin atletas" solo con 0 aceptados) (session-invites.js) · anterior: v482 lista de atletas documento a documento + reintento (session-invites.js) · anterior: Visor GPS: el modal ya no se encoge al tocar/mover el mapa (gps-track-viewer.js) · anterior: Sello de verificado en la lista de entrenadores de Permisos especiales (app.js) · Nivel 11 exige 6000 km Y todas las insignias, con barra de progreso y guía actualizadas (gamification.js, profile.js, friends.js, guia.html) · anterior: Auditoría de insignias: 50 insignias conseguibles, hora/ritmo/velocidad solo con GPS, 11 niveles nuevos (gamification.js, gps-tracker.js, calendar.js, guia.html) · anterior: Sello de verificado en "Entrenado por" (app.js, friends.js) · botón de editar sesión "CONTINUAR" sin texto cortado (session-invites.js) · anterior: Colores de zonas suavizados, paleta única (training.js) · anterior: Detalle "Zonas · últimos 30 días" con los colores de las zonas calculadas (index.html) · anterior: Dashboard: zonas con los mismos colores que las zonas calculadas (index.html) · Guía: tema Entrenador verificado y último botón centrado (guia.html) · anterior: Insignia de entrenador verificado (app.js, index.html, friends.js, profile.js) · Buscador inteligente de usuarios (friends.js) · anterior: Lista de privilegios: "atletas" en vez de "alumnos" (app.js) · anterior: Tarjeta de invitación de entrenador más grande y con más aire (index.html, friends.js) · anterior: Revertido el intento de mapa retina en wall.js (más peso, rótulos minúsculos y volvían los números de portal): wall.js como antes · anterior: Auto-reparación del email privado al iniciar sesión (auth.js) · anterior: Privilegios en tiempo real (onSnapshot) y quitado el botón Ocultar correos (index.html, app.js) · anterior: Más separación entre premium, fecha y cálculos en las tarjetas de usuarios (app.js) · anterior: Fila de datos (premium, fecha, cálculos) centrada en las tarjetas de usuarios (app.js) · anterior: Nombres centrados en las tarjetas de usuarios y en la lista de privilegios (index.html, app.js) · anterior: Buscador del admin: el texto de ayuda ya no menciona email, busca solo por usuario (index.html) · anterior: Quitado el correo/"?" de la cabecera de las tarjetas de usuario del admin (app.js) · anterior: Panel Seguridad: botones sin texto montado, privilegios con filtro entrenador/premium, de 20 en 20 y plegable (index.html, app.js) · anterior: 🔒 Botones Seguridad en el panel de admin (migrar correos / revisar privilegios) (index.html, app.js) · anterior: 🔥 Actualización forzada: archivos propios red primero (sw.js) + controllerchange y comprobación inmediata (app.js) · anterior: Quitado el distintivo 📷 recortado sobre la foto del Dashboard (index.html) · anterior: 🔒 Seguridad: el email ya no está en users/{uid} sino en usersPrivate (solo dueño y admin), reglas de creación de usuario cerradas (isTrainer/alumnosAceptados/etc.), Admin.migrarEmailsAPrivado/auditarPrivilegios (reglas.js, auth.js, app.js, profile.js, session-invites.js) · anterior: 🔥 Entrenador puede enviarse sesiones a sí mismo (session-invites.js + reglas), confirmación siempre por encima de los modales (index.html) · anterior: 🔥 Botón "DESVINCULAR" más pequeño en Entrenado por (friends.js) · anterior: 🔥 Plan con zonas reales (VAM/editadas), tarjeta y texto con VAM, campo nombre de usuario en Editar perfil, "Entrenado por" vuelve a pintarse al abrir el perfil (calendar.js, training.js, profile.js, index.html)

/* Versión: 4.42 - Bump de caché (v441 -> v442): app.js -- fallo de raíz
   de los dos bumps anteriores (v440, v441), que arreglaban síntomas sin
   dar con la causa real. AppState se declara con `const` en app.js; una
   declaración `const` (o `let`) de nivel superior es visible por su
   nombre desde cualquier otro script de la página (por eso `AppState.x`
   a secas funciona en todos lados) pero NO crea una propiedad en
   `window` -- eso solo pasa con `var` o con una asignación explícita.
   Varios sitios usaban `window.AppState && ...` como comprobación
   defensiva de que AppState ya existe: Auth.showPremiumBenefits (el
   modal de premium, auth.js) para esPremium/esEntrenador, profile.js
   (actualizarBotonCalcular), session-invites.js (dos sitios, cálculo de
   zonas del destinatario) y sponsors.js (precarga admin). Como
   `window.AppState` era SIEMPRE undefined, esas comprobaciones eran
   SIEMPRE falsas -- el modal de premium daba por hecho que nadie era
   premium ni entrenador y mostraba "Tu suscripción: Standard" sin
   importar el estado real, mientras que la píldora del perfil (que lee
   `AppState.isPremium` sin el `window.` de más) sí mostraba PREMIUM
   correctamente: de ahí la contradicción entre la píldora y el modal.
   Se añade `window.AppState = AppState;` justo después de definir
   AppState, así que ahora es una referencia real y todas esas
   comprobaciones -- en los cuatro archivos, sin tocar cada una por
   separado -- funcionan como se pretendía desde el principio. */

/* Versión: 4.41 - Bump de caché (v440 -> v441): profile.js -- el v440
   hacía que actualizarInterfazPremium() (app.js) refrescara la píldora
   cuando isPremium cambiaba DESPUÉS de tener Perfil ya abierto, pero
   quedaba un hueco: Profile.cargarPerfil() guarda el HTML entero de la
   pantalla en localStorage durante 60s para pintar rápido la próxima vez
   que se entra a Perfil, y ese HTML cacheado lleva la píldora ya
   "cocinada" con el valor de AppState.isPremium de cuando se guardó. Si
   se volvía a Perfil dentro de esos 60s, se pintaba esa píldora vieja al
   instante mientras de fondo se recalculaban los datos frescos -- y si
   se pulsaba la píldora antes de que ese recálculo terminara (o si
   fallaba en silencio, cosa que el catch ya evitaba mostrar como error
   por haber caché de refresco), la píldora se quedaba en PREMIUM aunque
   el modal (que lee AppState.isPremium en vivo en el momento del clic)
   ya dijera Standard. Ahora, tanto al pintar esa caché rápida como si el
   recálculo de fondo falla, la píldora se corrige al instante con el
   valor real de AppState.isPremium, sin esperar a nada más. */

/* Versión: 4.40 - Bump de caché (v439 -> v440): app.js, profile.js --
   petición del usuario: la píldora "PREMIUM/STANDARD" del perfil solo se
   pintaba al cargar la pestaña Perfil, leyendo AppState.isPremium en ese
   instante. Si ese valor cambiaba DESPUÉS con la pestaña ya abierta --
   verificarExpiracionPremium() detectando que la caducidad ya pasó, o un
   cambio en tiempo real desde Firestore (el admin te quita/pone premium)
   -- la píldora se quedaba con el texto viejo en pantalla, mientras que
   Auth.showPremiumBenefits (el modal que abre al pulsarla) sí usa el
   valor en el momento del clic. Resultado: la píldora podía decir
   PREMIUM y el modal, al pulsarla, decir que la suscripción es Standard
   (o al revés). Ahora actualizarInterfazPremium() (que ya se llama en
   los tres sitios donde isPremium puede cambiar: login, la propia
   verificarExpiracionPremium y el listener en tiempo real) también
   refresca el texto de la píldora (nuevo id perfilPlanBadge en
   profile.js) si está en el DOM, así que la píldora y el modal ya no
   pueden desincronizarse mientras la pestaña Perfil sigue abierta. */

const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './auth.js',
  './storage.js',
  './training.js',
  './entrenamientos.js',
  './calendar.js',
  './friends.js',
  './wall.js',
  './profile.js',
  './gamification.js',
  './gps-tracker.js',
  './gps-track-viewer.js',
  './session-invites.js',
  './sponsors.js',
  './firebase-config.js'
];

const NETWORK_ONLY_DOMAINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseio.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'nominatim.openstreetmap.org'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando', CACHE_NAME, '...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 🔥 cache.addAll() pedía los archivos con la caché HTTP normal: si
      // el hosting manda Cache-Control (Firebase Hosting: 1 h por
      // defecto), la caché nueva podía guardarse una copia VIEJA de
      // app.js/index.html y quedarse con ella hasta el siguiente bump.
      // Con cache:'reload' cada archivo se pide siempre a la red. Se
      // guarda archivo a archivo para que uno que falle no tire la
      // precarga de todos (addAll es todo o nada).
      return Promise.all(PRECACHE_URLS.map(url =>
        fetch(new Request(url, { cache: 'reload' }))
          .then(resp => { if (resp.ok) return cache.put(url, resp); })
          .catch(err => console.warn('[SW] No se pudo precargar', url, err))
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando cache antigua:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
    .then(() => {
      return self.clients.matchAll({ type: 'window' }).then(clientsList => {
        clientsList.forEach(client => {
          client.postMessage({ type: 'RI5_NEW_VERSION', version: CACHE_NAME });
        });
      });
    })
  );
});

// 🔥 FIX (actualización forzada): antes TODO iba cache-first, así que la
// app abría siempre con la copia guardada (vieja) y la versión nueva solo
// llegaba si el navegador detectaba el sw.js nuevo, lo instalaba y
// conseguía recargar la página. Si cualquiera de esos pasos fallaba
// (iOS no lanza la comprobación, se pierde el mensaje, etc.) te quedabas
// con la versión vieja hasta el siguiente bump. Ahora los archivos
// PROPIOS (index.html, .js, manifest, guia.html...) van red primero, y
// siempre revalidando (cache:'no-cache': ignora los 3600 s de
// Cache-Control de Firebase Hosting): abrir la app con conexión
// descarga la versión real. Si no hay red (o tarda más de 4 s, p. ej.
// corriendo sin cobertura) se sirve la copia guardada, así que la app
// sigue funcionando offline. Los recursos de terceros (unpkg, tiles,
// fuentes) siguen cache-first porque casi nunca cambian.
const TIMEOUT_RED_MS = 4000;

function fetchRevalidando(url) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), TIMEOUT_RED_MS);
    fetch(url, { cache: 'no-cache', credentials: 'same-origin' }).then(
      resp => { clearTimeout(t); resolve(resp); },
      err => { clearTimeout(t); reject(err); }
    );
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (NETWORK_ONLY_DOMAINS.some(domain => url.hostname.includes(domain))) return;
  if (url.protocol === 'chrome-extension:') return;

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetchRevalidando(event.request.url).then(response => {
        if (response.ok && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (
          response.ok &&
          (url.hostname.includes('unpkg.com') ||
           url.hostname.includes('googleapis.com') ||
           url.hostname.includes('cdnjs.cloudflare.com') ||
           // 🔥 v3: vuelta a tile.openstreetmap.org (de arcgisonline.com,
           // que a su vez había sustituido a basemaps.cartocdn.com).
           url.hostname.includes('tile.openstreetmap.org'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'RI5', {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] sw.js cargado correctamente (' + CACHE_NAME + ')');