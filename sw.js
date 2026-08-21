// ==================== sw.js - Service Worker RI5 ====================
// Versión: 2.71 - Bump de caché (v181 -> v182): calendar.js (quitado el
//                botón manual "🔄 ACTUALIZAR KM DEL PLAN": ahora la propia
//                app comprueba y corrige sola, en silencio, las distancias
//                de un plan que se generó antes del fix de v181, cada vez
//                que se carga la pestaña PLAN -- recalcularDistanciasPlanActual
//                ya no toca el TSS, solo la distancia, para no pisar el
//                TSS periodizado real de sesiones ya generadas bien),
//                index.html (botón eliminado de la interfaz).
// Versión: 2.70 - Bump de caché (v180 -> v181): calendar.js (FIX GRAVE de
//                origen: al GENERAR el calendario, el ritmo objetivo de
//                cada sesión se dividía entre factorIntensidad -- en
//                semanas suaves de la periodización (recuperación,
//                descarga, TAPER hasta 0.6) eso volvía el ritmo
//                artificialmente más lento y, con la misma duración, la
//                distancia estimada salía mucho más baja de la real. Por
//                eso "ACTUALIZAR KM DEL PLAN" -- que siempre recalcula con
//                factorIntensidad=1.0 -- arreglaba los números y la
//                generación inicial no. Quitada esa división: el ritmo
//                objetivo de una zona ya no depende de la semana, factor
//                que solo debe (y sigue) afectando al TSS. Generar el
//                calendario y pulsar "actualizar km" dan ahora siempre el
//                mismo resultado).
// Versión: 2.69 - Bump de caché (v179 -> v180): calendar.js (nuevo
//                _desglosarSesionReal: cada sesión completada guarda
//                ahora el desglose real calentamiento/parte principal/
//                enfriamiento -- minutos, km y zona de cada tramo -- en
//                vez de solo una zona predominante; el TSS real
//                (calcularTSSdesdeReal) se calcula ahora sumando el TSS
//                de cada tramo por su propia intensidad, más preciso que
//                la media de toda la sesión -- beneficia también a la
//                carga aguda/crónica y al tiempo de recuperación
//                estimado, que dependen del TSS), index.html (nueva
//                función compartida construirSesionObjDesdeEntry; el
//                detalle de sesión ahora muestra los 3 tramos reales
//                cuando están disponibles; la gráfica "zonas usadas" del
//                Dashboard reparte minutos/km EXACTOS por tramo en vez de
//                la aproximación a partes iguales, cuando hay desglose),
//                wall.js y profile.js (tocar la caja de estadísticas de
//                una sesión en Muro/Perfil abre ahora el mismo detalle
//                con los 3 tramos, sin afectar al tap para ver "me
//                gusta" en el resto de la tarjeta).
// Versión: 2.68 - Bump de caché (v178 -> v179): calendar.js (FIX GRAVE:
//                la zona real de una sesión -- tanto en el modal de
//                "datos reales" como al registrar la sesión, con o sin
//                GPS -- se calculaba con el ritmo medio de TODA la
//                sesión, incluyendo calentamiento y enfriamiento a Z1;
//                eso diluía la media y hacía salir Z1 en sesiones
//                hechas en Z3 real. Ahora se descuentan calentamiento/
//                enfriamiento antes de detectar la zona).
// Versión: 2.67 - Bump de caché (v177 -> v178): session-invites.js
//                (historial de sesiones enviadas del admin ahora con
//                listener en tiempo real: el estado pendiente/aceptada/
//                rechazada se actualiza solo, sin recargar), app.js
//                (AppState.isPremium/premiumExpiryDate ahora se
//                sincronizan en tiempo real al cambiar premium/gratis
//                desde el admin, con efecto inmediato en el detalle de
//                sesión del calendario y el perfil).
// Versión: 2.66 - Bump de caché (v155 -> v156): calendar.js v2.60,
//                index.html. Nueva tarjeta "Forma física" en el
//                Dashboard: CTL/ATL/TSB (modelo de Banister) a partir del
//                mismo TSS por sesión que ya alimenta el ACWR, para decir
//                si la carga y el descanso de las últimas semanas están
//                mejorando la forma física o no, con gráfica de
//                tendencia (Chart.js).
// Versión: 2.65 - Bump de caché (v154 -> v155): gamification.js v5.13.
//                FIX ZONA HORARIA en el cálculo de la racha al marcar una
//                sesión: se comparaban milisegundos entre una fecha
//                guardada como texto (interpretada como medianoche UTC) y
//                'now' (hora local), lo que en España podía hacer que
//                entrenar de madrugada no sumara racha o que se rompiera
//                una racha real sin motivo. Ahora se comparan días de
//                calendario forzando medianoche local en ambas fechas. De
//                paso, se blinda el marcado de sesiones fuera de orden
//                para que ya no retroceda lastSessionDate por error.
// Versión: 2.64 - Bump de caché (v153 -> v154): gamification.js v5.12,
//                gps-tracker.js v5.2, profile.js v10.10, calendar.js.
//                RÉCORDS SOLO CON GPS REAL: se elimina la creación de
//                récords extrapolados (sin GPS), tanto al marcar una
//                sesión a mano como al recalcular desde el historial al
//                desmarcar. Cada sesión con GPS guarda su propio mejor
//                tramo por distancia (recordsPorTramo); el recálculo al
//                desmarcar toma el mínimo real entre las sesiones GPS que
//                queden. Autolimpieza de récords antiguos sin GPS al leer
//                los datos de cada usuario. Además: reintento del
//                recálculo de racha/récords si falla al desmarcar (antes
//                fallaba en silencio) y bloqueo para que marcar/desmarcar
//                rápido la misma sesión no se solape entre sí.
// Versión: 2.63 - Bump de caché (v152 -> v153): gamification.js v5.11 y
//                profile.js v10.9. Récords sin GPS: quitado el margen
//                del 15% (una sesión de 8.5 km ya no cuenta como récord
//                de "10 km"); ahora hace falta llegar AL MENOS a la
//                distancia exacta, y el tiempo se extrapola por ritmo
//                medio a esa distancia (no el tiempo total si corriste
//                de más).
// Versión: 2.62 - Bump de caché (v151 -> v152): FIX RAÍZ de la racha
//                (calendar.js, gamification.js). La causa real: la
//                racha/día de la semana/mes se calculaban con la fecha
//                del INSTANTE en que se pulsa el check ('timestamp'),
//                no con el día real de la sesión ('fechaSesion', el día
//                del plan). Si te ponías al día marcando una sesión de
//                hace unos días, contaba como si fuera "hoy" -- tanto al
//                marcar (updateAfterSession usaba 'new Date()' siempre)
//                como al desmarcar (_recalcularDerivadosDesdeHistorial
//                leía 'timestamp' de globalFeed en vez de
//                'fechaSesion'). Ahora ambos caminos usan el día real de
//                la sesión. De paso, se protegen los récords por tramo
//                GPS (gps:true) para que desmarcar una sesión cualquiera
//                ya no los borre al recalcular.
// Versión: 2.61 - Bump de caché (v150 -> v151): nuevo sistema de récords
//                por tramo GPS (gamification.js v5.9, gps-tracker.js
//                v5.1, profile.js v10.8): al terminar una carrera con
//                GPS, se busca dentro de todo el recorrido el mejor
//                tramo de 1/5/10/21.1/42.2 km y, si bate el récord
//                guardado, se actualiza automáticamente (con aviso al
//                usuario), aunque solo sea parte de una carrera más
//                larga.
// Versión: 2.60 - Bump de caché (v149 -> v150): calendar.js. Arreglada
//                la causa real de que "racha más larga" y los récords
//                personales no cuadraran al marcar/desmarcar sesiones:
//                gamification.js los recalcula leyendo globalFeed, pero
//                limpiarMuroGlobal() borraba de ahí todo lo de más de 90
//                días -- así que cualquier racha o récord de hace más de
//                3 meses se perdía en cuanto se desmarcaba cualquier
//                sesión, aunque no tuviera nada que ver. Ahora
//                limpiarMuroGlobal() ya no borra nada; el muro visible
//                sigue mostrando solo hoy/ayer igual que antes (eso lo
//                controla un filtro de fecha aparte), así que no cambia
//                nada a la vista, pero los datos ya no se pierden.
// Versión: 2.59 - Bump de caché (v148 -> v149): index.html (modal de
//                chat con un amigo: quitada la X de arriba a la derecha,
//                nombre del amigo centrado en la cabecera, y añadido un
//                botón CANCELAR estándar abajo para cerrar el modal,
//                igual que el resto de la app) y calendar.js (modal
//                "DATOS DE LA SESIÓN": CANCELAR pasa a la izquierda y
//                ACEPTAR a la derecha, para que coincida con el orden
//                del resto de modales de la app).
// Versión: 2.58 - Bump de caché (v147 -> v148): index.html (quitado el
//                cuadrado/borde alrededor del icono de papelera en el
//                historial de planes, pestaña PLAN → "ÚLTIMOS PLANES";
//                queda igual que en el historial de cálculos, solo el
//                icono sin recuadro).
// Versión: 2.57 - Bump de caché (v146 -> v147): manifest.json (nombre de
//                la app corregido de "RI5 - Running Intelligence" a "RI5
//                - Running Lab") e index.html (título de compartirApp()
//                corregido igual).
// Versión: 2.56 - Bump de caché (v145 -> v146): calendar.js.
//                Aviso de "días mínimos" al generar plan: el mensaje de
//                error solo distinguía "maratón" de "todo lo demás"
//                (que etiquetaba siempre como MEDIA), así que al elegir
//                2KM o 10KM con menos días de los necesarios, el aviso
//                decía igualmente "PARA MEDIA NECESITAS MÍNIMO X DÍAS"
//                en vez de nombrar la distancia realmente elegida. Ahora
//                el mensaje usa la etiqueta correcta (2KM, 5KM, 10KM,
//                MEDIA MARATÓN o MARATÓN) según la distancia que se haya
//                seleccionado. El número mínimo de días en sí ya era
//                correcto por distancia (obtenerDiasMinimos) -- solo
//                estaba mal el texto.
// Versión: 2.55 - Bump de caché (v144 -> v145): app.js, index.html.
//                Campo "6km · última marca" (calculadora de zonas,
//                pestaña Perfil > Entreno): antes era el único de los 3
//                campos (edad, FC reposo, 6km) que no abría el teclado
//                numérico del móvil -- le faltaba inputmode="numeric".
//                Además, como el teclado numérico no tiene tecla de ":",
//                ahora se autoformatea mientras se escribe: en cuanto se
//                completan los 2 primeros dígitos (los minutos) se añade
//                automáticamente ":00" con esos dos ceros seleccionados,
//                así que si se sigue escribiendo (los segundos) se
//                sobreescriben directamente sin tener que borrar nada, y
//                si no se escribe nada más se queda tal cual en :00.
// Versión: 2.54 - Bump de caché (v143 -> v144): gps-tracker.js.
//                BUG GRAVE: el recentrado automático del mapa durante una
//                sesión GPS dejaba de funcionar para siempre nada más
//                empezar, salvo que el usuario rotara la pantalla en
//                algún momento (lo que lo "arreglaba" sin querer). Causa
//                raíz: el bucle de recentrado (cada 3s) se reprogramaba a
//                sí mismo solo si 'isRunning' ya era true, pero esa
//                bandera no se pone a true hasta que termina la cuenta
//                atrás "3, 2, 1" (~4.5s después de crear el mapa),
//                mientras que el primer ciclo del bucle caía a los 3s --
//                antes de que isRunning pasara a true. El bucle moría en
//                ese primer ciclo, antes incluso de que el usuario
//                pudiera tocar el mapa. Ahora el bucle se reprograma
//                mientras el mapa siga existiendo (deja de depender de
//                isRunning), así que el recentrado automático funciona
//                desde el primer segundo de cualquier sesión, sin
//                necesidad de rotar el móvil.
// Versión: 2.53 - Bump de caché (v142 -> v143): app.js, index.html,
//                session-invites.js.
//                1) Botones CANCELAR/CONFIRMAR del modal de mensaje del
//                   admin: estaban invertidos (Confirmar a la izquierda,
//                   Cancelar a la derecha); ahora Cancelar va a la
//                   izquierda como en el resto de modales de la app.
//                2) Modal de datos de usuario del admin: ya no se abre
//                   con un "Cargando..." que luego se rellena (parpadeo);
//                   los datos se cargan primero y el modal se muestra
//                   directamente con todo pintado.
//                3) Historial de sesiones creadas (admin): el botón de la
//                   papelera se salía de la tarjeta por una regla CSS
//                   global de <button> (width:100%, height:52px,
//                   margin-bottom:16px) que su estilo inline no pisaba;
//                   ahora queda encajado a la derecha del estado
//                   (aceptada/rechazada/pendiente), dentro de la tarjeta.
//                4) "Reutilizar sesión" desde el historial: ya no cierra
//                   un modal y abre otro nuevo tras un timeout (dejaba un
//                   hueco y un parpadeo); ahora reutiliza el mismo
//                   overlay y hace un fundido directo al paso 1/3.
//                5) Historial de planes: cada tarjeta muestra ahora el
//                   nombre del plan, no solo fecha y resumen.
//                6) Título de la página: "RI5 · EDITION" -> "RI5 ·
//                   Running Lab" (es lo que WhatsApp y otras apps usan
//                   para la vista previa del enlace al compartir desde
//                   Comunidad).
//                7) Actualización automática de la app: además de
//                   avisar/recargar cuando ya hay una versión nueva
//                   activa, ahora se le pide al navegador que compruebe
//                   sw.js de forma proactiva (al volver la app a primer
//                   plano, al recuperar conexión, y cada 60 minutos),
//                   en vez de depender solo de sus comprobaciones
//                   automáticas por defecto (poco frecuentes si la app
//                   se queda abierta mucho tiempo sin recargar).
// Versión: 2.52 - Bump de caché (v135 -> v136): session-invites.js.
//                Al pulsar una entrada del historial "📜 ÚLTIMAS
//                SESIONES CREADAS" se abre un modal con el desglose por
//                usuario (quién la ha aceptado/rechazado/tiene
//                pendiente) y un botón "🔁 REUTILIZAR" que reabre el
//                asistente de "Generar sesión" en el paso 1, precargado
//                con los mismos datos (tipo, nombre, zona,
//                distancia/tiempo, pasos, objetivo...), listo para
//                enviarla de nuevo tal cual o modificarla antes de
//                reenviar. Destinatarios y fecha NO se reutilizan a
//                propósito: hay que volver a elegirlos, por si la
//                sesión es para otra gente o para otro día.
// Versión: 2.51 - Bump de caché (v134 -> v135): session-invites.js,
//                app.js.
//                1) Las sesiones creadas por el admin ya no dejaban
//                   apartados vacíos al abrirlas en el calendario del
//                   usuario: ahora se rellena con un valor por defecto
//                   sensato cualquier campo que el admin dejara en
//                   blanco (porqué, sensación, descripción de cada paso)
//                   -- lo que él SÍ escriba se respeta siempre, esto solo
//                   completa huecos. Se añade también 'tiempoEnZona', un
//                   campo que el generador de sesiones del admin nunca
//                   rellenaba (no tenía ni siquiera un input para él) y
//                   que por eso salía siempre en blanco.
//                2) Arreglado el salto/modal de por medio entre el paso 2
//                   (elegir día) y el paso 3 (elegir usuarios) del
//                   asistente "Generar sesión": la lista de usuarios
//                   ahora se precarga en segundo plano en cuanto se entra
//                   en el paso 2, así el paso 3 aparece siempre con la
//                   lista ya lista, sin el placeholder "Cargando
//                   usuarios..." apareciendo de por medio en la
//                   transición.
//                3) Nuevo historial "📜 ÚLTIMAS SESIONES CREADAS" debajo
//                   del botón "➕ NUEVA SESIÓN PARA ENVIAR", con las
//                   últimas 10 sesiones enviadas (agrupadas aunque se
//                   manden a varios usuarios a la vez) y cuántos
//                   destinatarios las han aceptado/rechazado/tienen
//                   pendiente. Requiere un índice compuesto en Firestore
//                   (fromUid ASC + createdAt DESC en sessionInvites) --
//                   Firestore lo pide solo la primera vez, con un enlace
//                   directo para crearlo en un clic desde el error de
//                   consola.
// Versión: 2.50 - Bump de caché (v133 -> v134): session-invites.js.
//                1) Arreglados los saltos/parpadeo entre los 3 pasos del
//                   asistente "Generar sesión" del admin: el modal se
//                   desvanece, cambia de contenido mientras está
//                   invisible (evita el salto de posición al recentrarse
//                   verticalmente con una altura distinta) y se vuelve a
//                   mostrar ya asentado.
//                2) Arreglado el falso "Tu plan actual ya no existe" al
//                   aceptar una sesión enviada: ahora se usa primero el
//                   plan que la app ya tiene cargado en memoria
//                   (AppState.planActualId, restaurado desde localStorage
//                   y verificado que existe) en vez de fiarse solo del
//                   campo ultimoPlanId del documento de Firestore, que
//                   podía quedar desincronizado.
//                3) La distancia de la parte principal ya NO se trataba
//                   como si fuera el total de la sesión: ahora el
//                   calentamiento y el enfriamiento (minutos, a ritmo de
//                   Z1 real del usuario) se convierten a km y se suman a
//                   la parte principal para dar la distancia TOTAL real.
//                4) Nuevo selector "por distancia (km) / por tiempo
//                   (min)" para definir la parte principal: en modo
//                   tiempo, la distancia se calcula sola a partir del
//                   ritmo real de cada usuario en la zona elegida -- así
//                   la misma sesión entrena a todos el mismo tiempo a esa
//                   intensidad, en vez de obligar a los más lentos a
//                   tardar mucho más en cubrir unos km fijos.
// Versión: 2.49 - Bump de caché (v132 -> v133): calendar.js - ajuste de
//                espaciado en el popup de selección de tipo de sesión
//                (más separación entre icono y texto, y más padding en
//                los botones).
// Versión: 2.48 - Bump de caché (v131 -> v132): training.js v4.2 -- nuevo
//                TimePicker (selector tipo reloj con ruedas de minutos y
//                segundos) para el tiempo de 6km en la pestaña de zonas
//                de entreno, en vez de un campo de texto libre. index.html
//                -- HTML/CSS del nuevo selector. app.js -- se inicializa
//                TimePicker junto con el resto de la pestaña de entreno.
// Versión: 2.47 - Bump de caché (v130 -> v131): calendar.js v2.55/v2.56 --
//                el selector de tipo del modal de "datos de la sesión"
//                ahora muestra siempre los 4 tipos que el planificador
//                puede generar (antes solo los que aparecían en el plan
//                actual), y al pulsar el título se abre un popup pequeño
//                y centrado con las 4 opciones a la vez en cuadrícula
//                (sin scroll) en vez de desplegar la lista dentro del
//                propio modal; quitado también el texto "cambiar".
// Versión: 2.46 - Bump de caché (v129 -> v130): calendar.js v2.54 -- modal
//                de "datos de la sesión" al marcar como realizada: sin
//                icono de lápiz, ya no crece hacia la cámara frontal,
//                campo de kilómetros más compacto y centrado, caja de
//                ritmo/zona coloreada según la zona real. index.html --
//                arreglado el título duplicado tipo "RODAJE: Rodaje" en el
//                modal de detalle de sesión.
// Versión: 2.45 - Bump de caché (v119 -> v120): profile.js -- arreglado
//                el minimapa Leaflet real de "Mis últimos
//                entrenamientos" (v2.44), que podía salir partido / medio
//                en blanco. Causa: si cargarPerfil() se disparaba dos
//                veces seguidas, dos llamadas concurrentes podían montar
//                DOS mapas Leaflet sobre el mismo contenedor a la vez,
//                corrompiendo el tamaño interno de Leaflet. Añadida una
//                reserva síncrona que bloquea la segunda llamada desde el
//                primer instante.
// Versión: 2.44 - Bump de caché (v118 -> v119): profile.js -- el
//                minimapa de "Mis últimos entrenamientos" vuelve a ser un
//                mapa Leaflet real (con teselas de calle, igual que el
//                muro), no solo el trazo del track sobre fondo gris. El
//                SVG instantáneo se sigue pintando primero (para que la
//                tarjeta no se vea vacía mientras Leaflet carga), y el
//                mapa real lo sustituye en cuanto está listo. Una vez
//                creado, el mapa de cada entrada queda cacheado en
//                memoria (Profile._mapasEntradas) y NO se vuelve a
//                recargar al entrar y salir de la pestaña Perfil -- solo
//                se destruye cuando esa entrada sale del top-5 (la
//                desplazan 5 sesiones más nuevas).
// Versión: 2.43 - Bump de caché (v117 -> v118): wall.js -- pulsar sobre el
//                avatar o el nombre de usuario de una publicación del
//                muro ahora abre el perfil de esa persona (Friends.
//                abrirModalAmigo: perfil completo si es amigo, o con
//                opción de agregar como amigo si no lo es), en vez del
//                modal de "me gusta". Pulsar en cualquier otra parte de
//                la tarjeta (fuera del minimapa, el botón ❤️ y ahora
//                también fuera del avatar/nombre) sigue abriendo el modal
//                de "me gusta" como antes.
// Versión: 2.42 - Bump de caché (v116 -> v117): arreglado el minimapa GPS
//                de "Mis últimos entrenamientos" (profile.js), que al
//                pulsarlo hacía un encogimiento y rebote raro antes de
//                abrir el visor de ruta (en el muro -- wall.js -- ya
//                funcionaba bien; wall.js se tocó también por si acaso,
//                sin cambio de comportamiento real ahí). La capa de toque
//                sobre el minimapa usaba Utils.bindTap, que en su
//                touchend llama a e.preventDefault(); en móvil eso deja
//                "pegado" el estado :active de la tarjeta (transform:
//                scale(0.96)) justo antes de abrir el modal. Cambiado a
//                un 'click' normal + stopPropagation(), igual que el
//                resto de la tarjeta (like, borrar): el minimapa ahora
//                abre directo, sin encogimiento ni rebote.
// Versión: 2.41 - Bump de caché (v115 -> v116): últimas 3 píldoras de la
//                app pasadas a radio 14px, tras confirmar con el usuario
//                que quería uniformidad total (no solo en modales):
//                chips "👟 Cambiar" / "📜 Historial" de zapatilla
//                (profile.js), botones ❤️ like y 🗑️ borrar del muro
//                (profile.js y wall.js) y el botón verde "Compartir RI5"
//                por WhatsApp (index.html). Con esto, NINGÚN botón de la
//                app queda con radio de píldora (>=18px) -- comprobado
//                con barrido completo sobre todos los archivos.
// Versión: 2.40 - Bump de caché (v114 -> v115): consistencia visual de
//                botones/modales + arreglos en el visor de rutas GPS.
//                1) Botones "píldora" (radio 30px/50px) unificados al
//                   radio rectangular de .action-button (14px), que ya
//                   era el estándar de facto en la mayoría de la app:
//                   .refresh-users-btn del panel de admin (Aplicar /
//                   Limpiar / Recargar -- el sitio donde más se notaba),
//                   CONFIRMAR/CANCELAR del prompt genérico (app.js),
//                   CERRAR de insignias e historial de zapatillas,
//                   CAMBIAR/CANCELAR de cambio de zapatilla (profile.js),
//                   DESBLOQUEAR de GPS premium (gps-tracker.js) y CERRAR
//                   del visor de rutas GPS (gps-track-viewer.js, ahora
//                   con la clase .action-button en vez de estilo propio).
//                   Se han dejado sin tocar, a propósito, los chips
//                   pequeños "Cambiar/Historial" de zapatilla (son
//                   etiquetas de alternancia, no CTAs de modal) y el
//                   botón verde de compartir por WhatsApp (marca propia
//                   de WhatsApp) -- avisar si también se quieren
//                   unificar.
//                2) profile.js: quitada la píldora "🗺 VER RECORRIDO"
//                   superpuesta sobre la miniatura del track en "Mis
//                   últimos entrenamientos". La capa de toque ya cubría
//                   toda la ventana del mapa (abre GPSTrackViewer al
//                   tocar en cualquier punto); la píldora era puramente
//                   decorativa y sobraba.
//                3) gps-track-viewer.js: arreglado el parpadeo raro al
//                   abrir el modal. Tenía dos causas: (a) la animación de
//                   apertura usaba un cubic-bezier con rebote (pasaba de
//                   escala 1 a más de 1 y volvía), que se percibía como
//                   un "salto"; ahora es una transición simple sin
//                   rebote. (b) el contenedor del mapa tenía un fondo
//                   gris claro fijo (#eaeaea) mientras cargaban las
//                   teselas, que en tema oscuro se veía como un flash
//                   blanco; ahora usa var(--stat-bg), coherente con el
//                   tema activo.
// Versión: 2.39 - Bump de caché (v113 -> v114): tarjeta de compartir
//                zonas/métricas (training.js) -- se quita el avatar
//                circular (foto de perfil / emoji 👤 por defecto) y todo
//                lo relacionado (fetch de photoURL, _cargarImagen(),
//                anillo de color de nivel alrededor del círculo). El
//                resto se mantiene: tema claro/oscuro real, @username en
//                el color de nivel, altura de canvas dinámica y pie de
//                página "RI5 | Running LAB".
// Versión: 2.38 - Bump de caché (v112 -> v113): tarjeta de compartir
//                zonas/métricas (training.js). 1) Pie de página cambiado
//                de "RI5 · Running Intelligence" a "RI5 | Running LAB".
//                2) Diagnóstico añadido en _cargarImagen(): si la foto de
//                perfil no se puede dibujar en el canvas (típicamente por
//                falta de configuración CORS en el bucket de Storage), se
//                deja un console.warn explícito en vez de fallar en
//                silencio -- así se puede distinguir "sin foto subida" de
//                "foto bloqueada por CORS" desde las DevTools. El arreglo
//                real de ese bloqueo es de infraestructura (gsutil cors
//                set sobre el bucket), no de este archivo.
// Versión: 2.37 - Bump de caché (v111 -> v112): tarjeta de compartir
//                zonas/métricas (training.js), dos arreglos de
//                maquetación. 1) Había solo ~10px entre el borde del
//                avatar y el logo "RI5" (quedaba todo pegado) -- ahora
//                90px de aire tanto tras el avatar como tras los
//                puntitos decorativos. 2) El pie de página ("RI5 ·
//                Running Intelligence") se dibujaba en una coordenada
//                fija sobre un canvas de alto fijo (2100px): con
//                bastantes predicciones/zonas se solapaba con el cartel
//                "CALCULA LAS TUYAS EN RI5". Ahora el alto del canvas se
//                calcula a partir del contenido real (pase de medición
//                antes de crear el canvas) y el pie se coloca siempre a
//                una distancia fija y limpia del final del contenido.
// Versión: 2.36 - Bump de caché (v110 -> v111): la tarjeta de compartir
//                zonas/métricas (training.js) añade el @username del
//                usuario bajo su nombre/edad, en el color de su nivel
//                (mismo criterio que el resto de la app). No se añade
//                QR: se descarta a propósito por ahora.
// Versión: 2.35 - Bump de caché (v109 -> v110): 1) tarjeta de "compartir
//                zonas/métricas" (training.js): ya no usa colores del
//                tema oscuro escritos a fuego -- ahora lee el tema real
//                del usuario (claro/oscuro) y dibuja su foto de perfil
//                con el anillo del color de su nivel. Antes salía siempre
//                negra sin importar el tema activo. 2) eliminada la
//                referencia muerta a 'share-card.js' en index.html y de
//                este precache: ese archivo ya no existe (su lógica vive
//                dentro de training.js), así que cargarlo solo producía
//                un 404 silencioso en cada arranque.
// NOTA: este bump NO toca el modal de "novedades de esta versión"
//       (RI5_VERSION_NOVEDADES en index.html) -- ese identificador es
//       independiente del CACHE_NAME y se deja tal cual a propósito, así
//       que el popup no vuelve a aparecer con esta subida.
// Versión: 2.34 - Bump de caché (v108 -> v109): dos arreglos más en la
//                generación de planes (calendar.js). 1) Espaciado de
//                sesiones de calidad (series/tempo): con 3 o más días
//                duros seguidos en la semana (más probable en niveles
//                altos con muchos días de entreno), el algoritmo que los
//                separa podía perder la cuenta a partir del tercer día y
//                dejar dos sesiones duras seguidas sin corregir --
//                reescrito para recalcular el estado real en cada pasada
//                en vez de arrastrar una lista que se quedaba
//                desactualizada; probado con 5 casos, incluido uno que
//                un primer intento de arreglo dejaba peor que antes.
//                2) Estructura de pirámide de series: en sesiones largas
//                de verdad (avanzado + maratón en fase específica, hasta
//                120' de serie) la pirámide entera se repetía tantas
//                veces como cupiera sin ningún límite -- hasta 7 veces
//                seguidas, 49 intervalos en una sola sesión. Ahora el
//                tope es 3 pirámides completas.
// Versión: 2.33 - Bump de caché (v107 -> v108): varios modales se abrían
//                mostrando un "Cargando…"/"Calculando…" que desaparecía
//                casi al instante al llegar los datos reales -- el modal
//                de récords del perfil y el de "carga y recuperación" del
//                dashboard (calculan varias lecturas de Firestore) los
//                recalculaban SIEMPRE de cero cada vez que se abrían, sin
//                usar ninguna caché. Ahora ambos: 1) se pintan al
//                instante con los últimos datos en caché (sessionStorage)
//                si ya existen -- sin placeholder de carga -- y 2) esa
//                caché se precarga sola al entrar en la app (login,
//                sesión guardada) y se refresca en segundo plano cada vez
//                que se marca o desmarca una sesión, así que casi nunca
//                se abren "en blanco". Solo se ve un breve "Cargando…" la
//                primerísima vez que se abre un modal tras instalar la
//                app, antes de que exista ninguna caché todavía. La
//                caché de gamificación (récords, nivel, insignias) ya
//                existía a medias -- se escribía en sessionStorage desde
//                hace tiempo pero nada la leía nunca -- así que aquí
//                también se ha conectado esa lectura que faltaba.
// Versión: 2.32 - Bump de caché (v106 -> v107): dos correcciones más en el
//                mismo área (calendar.js). 1) La pantalla de detalle de
//                sesión y el registro de una sesión marcada SIN GPS
//                recalculaban el TSS/distancia llamando a
//                calcularMetricasSesion(sesion) sin el segundo argumento,
//                así que -- igual que el bug de la v106 -- volvían a
//                caer en factorIntensidad=1.0 y podían mostrar/guardar un
//                TSS distinto del que el plan había estimado para esa
//                misma sesión (p.ej. en una semana de descarga). Ahora
//                ambos sitios reutilizan sesion.detalle.tssEstimada /
//                distanciaEstimada, ya calculados correctamente al
//                generar el plan. 2) Verificada la base de datos de
//                869 sesiones (entrenamientos.js): 434 sesiones runner +
//                435 trail revisadas una a una (nombre, duración, zona
//                válida) sin errores.
// Versión: 2.31 - Bump de caché (v105 -> v106): corregido un segundo bug
//                más serio en el mismo área. El factor de intensidad de
//                cada semana (onda de periodización + ajuste por ACWR +
//                ajuste por feedback del usuario) viajaba correctamente
//                por toda la cadena de funciones
//                (generarCalendarioEntreno -> crearSesionDesdeMatriz ->
//                crearSesionBasica/crearSesionAvanzadaSeries) pero se
//                perdía en el último paso: _buildSesionDetalle llamaba a
//                calcularMetricasSesion(sesion, factorIntensidad = 1.0)
//                metiendo el factor DENTRO del objeto de sesión en vez de
//                pasarlo como segundo argumento (que es donde la función
//                realmente lo lee), así que TODAS las sesiones generadas
//                -- de cualquier semana, dura o de descarga -- calculaban
//                su TSS y distancia estimada como si factorIntensidad
//                fuera siempre 1.0. Esto también significaba que el aviso
//                "moderamos la intensidad" al detectar ACWR alto no tenía
//                ningún efecto real en el TSS calculado. Ahora el factor
//                de intensidad de cada semana sí se aplica de verdad.
// Versión: 2.30 - Bump de caché (v104 -> v105): corregida la generación de
//                planes de entrenamiento (calendar.js / PlanGenerator).
//                La "semana de descarga" del patrón ondulatorio de 4
//                semanas (ONDULACION_PATRONES) reducía el volumen
//                (duración) un 15% pero al mismo tiempo SUBÍA el factor
//                de intensidad un 15%, y como el TSS = duración × factor
//                de intensidad, los dos efectos se cancelaban casi del
//                todo (0.85 × 1.15 ≈ 0.98): la semana de "descarga" no
//                bajaba realmente la carga entrenada, solo tenía menos
//                minutos en el papel. Ahora la semana 4 de cada bloque de
//                4 semanas es una descarga real: intensidad y volumen
//                bajan juntos (no se compensan), con un patrón 3:1
//                clásico de periodización (3 semanas de progresión +
//                1 semana de descarga con caída real de TSS).
// Versión: 2.29 - Bump de caché (v103 -> v104): estilo de modal unificado.
//                El modal de récords personales del perfil (profile.js)
//                y el visor de rutas GPS (gps-track-viewer.js) usaban un
//                botón circular "✕" en la esquina superior derecha para
//                cerrar; el resto de modales (insignias, historial) usan
//                un botón "CERRAR" centrado debajo del contenido. Ahora
//                los cuatro siguen el mismo patrón visual. También se
//                elimina el texto "Ver detalle ›" de la tarjeta de
//                récords del perfil (la tarjeta entera ya era clicable
//                para abrir el modal, así que el texto era redundante).
// Versión: 2.28 - Bump de caché (v102 -> v103): reescrito por completo el
//                modal de récords personales del perfil (profile.js:
//                abrirModalRecords/cerrarModalRecords). Se veía en negro
//                sin modal visible porque el código anterior insertaba el
//                modal dentro del overlay (overlay.appendChild(modal)) y
//                LUEGO otra vez directamente en <body>
//                (document.body.appendChild(modal)) -- un nodo solo puede
//                tener un padre, así que ese segundo appendChild sacaba el
//                modal de dentro del overlay y lo dejaba como hijo suelto
//                de <body>, sin position:fixed ni z-index propios, pintado
//                por detrás del overlay a pantalla completa. Ahora solo
//                hay un único árbol (modal -> overlay -> body) y además se
//                añaden animación de apertura/cierre (fade + scale, mismo
//                patrón que el visor de mapas GPS) y un botón ✕ en la
//                cabecera en vez del botón "CERRAR" de ancho completo.
// Versión: 2.27 - Bump de caché (v101 -> v102): corregido el modal de
//                récords del perfil, que se veía completamente negro (el
//                contenido se movía por error fuera del overlay y quedaba
//                detrás de él); y corregido el "salto"/recarga automática
//                al entrar en la app: antes se recargaba la página también
//                en la primerísima instalación del Service Worker (no solo
//                en actualizaciones reales), lo que reiniciaba de golpe la
//                animación del splash "RI5 | Running LAB" a medio hacer.
// Versión: 2.26 - Bump de caché (v100 -> v101): 1) tarjeta de récords del
//                perfil ahora muestra solo la marca más reciente, y toda
//                la tarjeta abre un modal con el desglose completo por
//                distancia; 2) gestión científica de la fatiga: al marcar
//                una sesión nueva se avisa si el % de recuperación
//                (mismo cálculo que la tarjeta "Carga y recuperación" del
//                dashboard) es menor del 100%, dejando decidir al usuario
//                si quiere entrenar igualmente; 3) nuevo modal de
//                "novedades de esta versión" que se muestra una única vez
//                al entrar al Dashboard tras actualizar (se recuerda con
//                localStorage 'ri5_novedades_vistas').
// Versión: 2.25 - Bump de caché (v99 -> v100): la píldora "Ver perfil" de
//                las dos modales de "me gusta" se reduce aproximadamente a
//                la mitad (padding y letra más pequeños) y ahora vive
//                dentro de una casilla de ancho fijo con
//                justify-content:center, así queda centrada en su columna
//                en vez de pegada a un lado. Además el modal (y cada fila)
//                llevan overflow-x:hidden y box-sizing:border-box, para
//                que nunca haya desplazamiento lateral aunque haya muchos
//                "me gusta" -- solo desplazamiento vertical si hace falta.
// Versión: 2.24 - Bump de caché (v98 -> v99): el botón "Ver perfil" de
//                las dos modales de "me gusta" (muro y perfil) era
//                demasiado grande y provocaba desplazamiento horizontal en
//                la tarjeta en pantallas estrechas. Se reduce su padding y
//                tamaño de letra, y se recorta un poco el gap entre
//                avatar/nombre/botón para dejar más margen.
// Versión: 2.23 - Bump de caché (v97 -> v98): en el splash, "RI5" (y el
//                separador "|") se pintan siempre en dorado desde que
//                entran -- ya no cogen color de nivel. Solo las 10 letras
//                de "Running LAB" (sin contar el espacio) usan la escala
//                de niveles 1-10 mientras entran, de izquierda a derecha,
//                y viran a dorado al final junto con el resto.
// Versión: 2.22 - Bump de caché (v96 -> v97): el borde de la foto de
//                perfil pasa a ser del color de nivel de cada usuario en
//                TODOS los sitios donde aparece (amigos, solicitudes,
//                buscador, explorar usuarios, muro global -- con el nivel
//                de cada autor, no el de quien mira --, "mis últimos
//                entrenamientos" en Perfil, listas de "me gusta" del muro
//                y de Perfil, y lista de chats). De paso se corrigen dos
//                fallos en las listas de "me gusta": la foto salía ovalada
//                (el avatar, al ser hijo de un contenedor flex sin
//                flex-shrink:0, se comprimía en horizontal cuando el
//                nombre de usuario era largo) y el botón "Ver perfil"
//                cambiaba de tamaño según lo largo del nombre por el mismo
//                motivo -- ahora avatar y botón llevan flex-shrink:0 y el
//                nombre usa ellipsis en vez de forzar overflow.
// Versión: 2.21 - Bump de caché (v95 -> v96) por fallos en la animación
//                del splash de index.html: 1) se quita del todo el cursor
//                parpadeante (::after) que sobraba de la antigua animación
//                de "escribir letra a letra" y que ahora se veía como una
//                barra vertical suelta a la derecha; 2) se corrige que la
//                primera letra (a veces varias) apareciera de golpe sin
//                transición -- se programaba con setTimeout(fn, 0), que
//                podía ejecutarse antes de que el navegador pintara el
//                estado inicial (opacity:0), dejándolo sin "punto de
//                partida" del que animar; ahora se fuerza un doble
//                requestAnimationFrame antes de arrancar la secuencia;
//                3) se ralentiza el ritmo de entrada de las letras.
// Versión: 2.20 - Bump de caché (v94 -> v95) por cambios en index.html
//                (animación del splash "RI5 | Running LAB": entrada letra
//                a letra de izquierda a derecha con los colores de nivel
//                1-10, virando a dorado al terminar; borde del avatar del
//                dashboard con el color de nivel del usuario) y en
//                auth.js (checkSavedSession ahora espera -- await -- a que
//                termine de cargar TODO el dashboard antes de llamar a
//                Utils.hideLoading(), para que no se vea rellenarse de
//                datos delante del usuario al recargar con sesión en
//                caché).
// Estrategia:
//   - App shell (HTML + JS propios) → Cache First
//   - Firebase / APIs externas → Network First (nunca se cachean)
//   - Leaflet, fuentes, iconos → Cache First
// =====================================================================
//
// v173: scroll siempre al top al cambiar de pestaña/subpestaña y al abrir
//       cualquier modal reutilizado (perfil, amigo, privacidad, premium,
//       reset de contraseña, guía, novedades, detalle de zonas, carga del
//       plan, detalle de sesión, asistente de sesiones admin) -- antes
//       conservaban el scroll de la vez anterior. Transición de fundido
//       (ri5ScreenReveal, misma familia que el apagado del splash de
//       entrada) aplicada a las 8 pestañas principales y a esos mismos
//       modales, que antes aparecían de golpe sin ninguna animación.
//       Guía: se precarga en segundo plano en cuanto la app está lista
//       (en vez de solo al pulsar el botón), así la fuente y el layout ya
//       están listos de antemano y la primera apertura deja de dar el
//       salto brusco que sí tenía antes (las siguientes ya eran suaves).

// v174: el reset de scroll de v173 no funcionaba en la mayoría de sitios
//       porque se aplicaba ANTES de que el modal pasara a estar visible
//       (display:block) -- un elemento oculto no tiene caja de scroll
//       real, así que esa asignación no hacía nada, y al mostrarse
//       después conservaba la posición de scroll de la vez anterior.
//       Corregido el orden en los 12 modales afectados (detalle de
//       sesión del calendario, editar perfil, amigo, privacidad, premium,
//       reset de contraseña, novedades, detalle de zonas, carga del
//       plan, admin): ahora el modal se muestra primero y el scrollTop=0
//       se aplica justo después, en el mismo turno síncrono.

// v175: encontrado el bug real de v174 -- varias funciones (sobre todo
//       cerrarModalSesion) estaban DUPLICADAS en dos archivos distintos
//       (calendar.js y app.js); como app.js se carga después, su versión
//       -sin el arreglo de scroll- ganaba siempre en tiempo de ejecución
//       y dejaba muerta la de calendar.js que sí llevaba la corrección.
//       Además, siguiendo la idea del usuario, el reset de scroll ahora
//       se hace también AL CERRAR cada modal (mientras aún es visible,
//       momento en el que la asignación sí surte efecto de verdad), no
//       solo al abrir -- doble seguro. Aplicado en los 12 modales más el
//       modal de listas del admin y un tercer punto de cierre suelto en
//       gps-tracker.js que también se había escapado.

// v176: repaso a fondo de "todos los modales tienen que tener la misma
//       transición":
//       - Quitado el resaltado táctil por defecto del navegador
//         (-webkit-tap-highlight-color) en TODOS los <button> de la app:
//         se veía "marcado" a través del blur de un modal recién abierto,
//         sobre todo en modo claro.
//       - Botones del modal de cambiar zapatilla reordenados (Cancelar
//         izquierda, Cambiar derecha).
//       - El resumen de días marcados en el paso 2 del generador de
//         sesiones ahora reserva su altura desde el principio (con texto
//         "No has marcado ningún día todavía"), así el modal ya no da un
//         salto al marcar el primer día.
//       - Encontrados y arreglados 8 modales más sin ninguna transición:
//         el modal "Ver" de usuario en el admin (CSS), y 7 modales que la
//         app crea directamente por JavaScript y que se abrían totalmente
//         de golpe -- promptModal de Utils, datos reales de una sesión +
//         su selector de tipo (calendar.js), me gusta/insignias/zapatilla
//         /historial de zapatillas (profile.js), me gusta del muro
//         (wall.js) y la pantalla de seguimiento GPS. Todos usan ya el
//         mismo fundido de opacidad que ya tenían el modal de récords y
//         el visor de mapas GPS.
//       - Auditoría completa de los modales definidos por CSS: añadida la
//         misma animación (ri5ScreenReveal) a infoDiasModal, premiumModal
//         (comprar premium), confirmModal (usado en toda la app),
//         welcomeModal y adminListModal, que se habían quedado sin ella.

const CACHE_NAME = 'ri5-v188';

// Archivos del app shell que se precargan al instalar el SW
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
  './firebase-config.js'
];

// Dominios que NUNCA se cachean (siempre red)
const NETWORK_ONLY_DOMAINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseio.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'nominatim.openstreetmap.org'
];

// ── INSTALL: precarga el app shell ──────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando', CACHE_NAME, '...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        // Si algún archivo falla no bloqueamos la instalación
        console.warn('[SW] Algunos archivos no se pudieron precargar:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpia caches antiguas ────────────────────────────────
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
      // Avisa a todas las pestañas/clientes abiertos de que se acaba de
      // activar una versión nueva. app.js escucha este mensaje
      // (navigator.serviceWorker.addEventListener('message', ...)) para
      // recargar la pestaña automáticamente; el modal de "novedades de
      // esta versión" en sí NO depende de este mensaje (se controla por
      // separado con localStorage en index.html, ver
      // mostrarModalNovedadesSiProcede), así que se muestra igual aunque
      // la recarga automática tarde o no llegue a producirse.
      return self.clients.matchAll({ type: 'window' }).then(clientsList => {
        clientsList.forEach(client => {
          client.postMessage({ type: 'RI5_NEW_VERSION', version: CACHE_NAME });
        });
      });
    })
  );
});

// ── FETCH: lógica de red ─────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Peticiones POST/non-GET → siempre red
  if (event.request.method !== 'GET') return;

  // 2. Firebase y APIs externas sensibles → siempre red
  if (NETWORK_ONLY_DOMAINS.some(domain => url.hostname.includes(domain))) return;

  // 3. Chrome extensions → ignorar
  if (url.protocol === 'chrome-extension:') return;

  // 4. Todo lo demás → Cache First con fallback a red
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Solo cachear respuestas válidas de nuestro origen o CDNs conocidas
        if (
          response.ok &&
          (url.origin === self.location.origin ||
           url.hostname.includes('unpkg.com') ||
           url.hostname.includes('googleapis.com') ||  // solo fuentes/maps, no firebase
           url.hostname.includes('cdnjs.cloudflare.com') ||
           url.hostname.includes('basemaps.cartocdn.com'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: devolver página offline si es navegación HTML
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── PUSH NOTIFICATIONS (preparado para el futuro) ───────────────────
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

console.log('[SW] sw.js cargado correctamente');