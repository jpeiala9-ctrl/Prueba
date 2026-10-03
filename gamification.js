// ==================== gamification.js ====================
// Versión: 5.21 - AUDITORÍA COMPLETA DE INSIGNIAS + 50 INSIGNIAS + NIVELES NUEVOS.
//   1) Cada insignia ahora tiene su condición escrita en UN solo sitio
//      (CONDICIONES, justo debajo de BADGES) y todas se calculan sobre las
//      estadísticas reconstruidas desde el historial real (globalFeed), no
//      sobre contadores que se pueden desviar. Hay exactamente 50 y cada
//      una depende SOLO de datos que la app mide de verdad.
//   2) Las insignias de RITMO, VELOCIDAD y HORA DEL DÍA solo se conceden con
//      sesiones grabadas con el GPS de la app (hasGPS). Antes PACE_SUB5/
//      PACE_SUB4 salían del ritmo medio de CUALQUIER sesión marcada, también
//      de las marcadas sin correr (distancia y tiempo estimados del plan), y
//      EARLY_BIRD usaba la hora a la que se pulsaba "marcar", no la hora a
//      la que se había corrido. Ahora la hora sale del inicio y del final
//      reales de la sesión GPS (inicioRealTs/finRealTs, ver calendar.js y
//      gps-tracker.js) y la sesión ENTERA tiene que caber dentro de la
//      franja (ej. "Carrera nocturna": de 00:00 a 06:00), mínimo 1 km.
//   3) Ritmo = mejor kilómetro con GPS (el mismo cálculo de los récords por
//      tramo); 5 km < 30:00 y 10 km < 60:00 = mejor tramo de esa distancia.
//      Se ignoran tramos más rápidos que un récord mundial (ruido de GPS).
//   4) SPEED_30 se retira: el filtro anti-saltos del GPS (18 km/h) descarta
//      los puntos de una carrera a esa velocidad en cuanto hay un hueco de
//      más de ~1,8 s entre dos lecturas, así que no se podía garantizar. Se
//      añade SPEED_15. La velocidad es ahora SOSTENIDA (>= 10 s seguidos), no
//      un único salto de GPS entre dos puntos (ver gps-tracker.js).
//      Siguen fuera ELEVATION_500/1000 (la app no mide desnivel).
//   5) NIVELES: 11 niveles con la nueva escala (0, 50, 150, 300, 500, 1000,
//      1500, 2000, 3000, 5000 y 6000 km). v5.22: el 11 exige además TODAS las
//      insignias (si no, el máximo es el 10). getData() corrige solo el nivel
//      guardado si no coincide con los km (sin escribir en documentos ajenos).
//   6) removeSession: el nivel se calcula ya con la distancia recalculada
//      desde el historial, no con la resta puntual (podían diferir).
//   7) Si una sesión desbloquea muchas insignias a la vez (p.ej. la primera
//      tras esta actualización, que evalúa las nuevas contra el historial),
//      se avisa de las 3 primeras y un resumen del resto.
// Versión: 5.20 - El usuario pidió revertir el botón manual "🔧 Recalcular
//                km" de la tarjeta de zapatilla (Perfil vuelve a quedar
//                exactamente como estaba) y que, en su lugar, la
//                reparación de v5.19 sea automática: la primera vez que un
//                usuario entra a la pestaña Perfil, se recalculan solos
//                TODOS los derivados de gamificación afectados por la
//                misma desviación histórica (distancia total, nivel,
//                sesiones, minutos en Z4/Z5, contadores por tipo, racha,
//                "madrugador", récords y los km de la zapatilla actual),
//                sin ningún botón ni aviso -- ver
//                Gamification.repararTodoDesdeHistorialSiHaceFalta,
//                llamada desde Profile.cargarPerfil. Solo se ejecuta una
//                vez por usuario (se marca 'historialRecalculadoV519' en
//                el documento al terminar, igual que ya hace
//                _limpiarRecordsNoGPS con los récords antiguos): las
//                siguientes veces que se abra Perfil no vuelve a
//                consultar el historial completo de nuevo.
// Versión: 5.19 - FIX: "el nivel ya se corrigió pero la zapatilla se
//                quedó con los km viejos". El usuario reportó, tras el fix
//                de v5.17/5.18, que su nivel bajó de 6 a 3 (la distancia
//                real de verdad era mucho menor que la que llevaba
//                acumulada por desviación) pero currentShoe.km se quedó
//                igual, con los mismos 700 y pico km de antes -- una
//                inconsistencia visible entre dos datos que deberían
//                contar la misma historia. Causa: a diferencia de
//                totalDistance (que _recalcularDerivadosDesdeHistorial ya
//                reconstruye entero desde globalFeed desde v5.17/5.18),
//                currentShoe.km seguía gestionándose con
//                FieldValue.increment/decrement puntual, sesión a sesión
//                (addKilometersToShoe/removeKilometersFromShoe) -- el
//                mismo patrón frágil que causaba la desviación de
//                totalDistance antes de v5.17, sin ninguna forma de
//                autocorregirse. _recalcularDerivadosDesdeHistorial ahora
//                también recalcula currentShoeKm desde la verdad (sumando
//                la distancia real de las sesiones que de verdad existen
//                en globalFeed desde que la zapatilla actual es la
//                actual, usando el 'changedAt' de shoeHistory como corte),
//                y tanto updateAfterSession (al marcar) como removeSession
//                (al desmarcar) fijan ese valor con _fijarKmZapatilla en
//                vez de sumar/restar a ciegas -- igual de a prueba de
//                desviaciones que ya lo está el nivel. Se añade además
//                Gamification.repararKmZapatilla(uid) para poder corregir
//                YA la zapatilla de quien ya estuviera desviado (pensada
//                para un botón manual en Perfil), sin tener que esperar a
//                la próxima sesión marcada o desmarcada.
// Versión: 5.18 - FIX DE RAÍZ definitivo (el usuario confirmó que el
//                fallo seguía pasando incluso después de v5.17): v5.17
//                solo recalculaba totalZone4Minutes/totalZone5Minutes/
//                totalDistance/totalSessions/countLongRuns/
//                countIntervals/countStrengthRuns desde la verdad al
//                DESMARCAR una sesión -- pero updateAfterSession() (lo
//                que corre al MARCAR, la operación que se hace el 99% de
//                las veces) seguía sumando estos 7 campos de forma
//                incremental sobre lo que ya hubiera guardado, así que
//                cualquier desviación ya existente en el documento nunca
//                llegaba a corregirse mientras el usuario solo marcara
//                sesiones nuevas (que es justo lo que pasó: la insignia
//                volvió a saltar mal en la siguiente sesión marcada, no
//                desmarcada). Ahora updateAfterSession() TAMBIÉN llama a
//                _recalcularDerivadosDesdeHistorial() antes de la
//                transacción y usa esos 7 valores directamente (ya
//                incluyen la sesión recién marcada, porque
//                calendar.js escribe en globalFeed ANTES de llamar
//                aquí) -- en vez de sumarle nada más encima. Con esto,
//                estos 7 campos quedan recalculados desde la verdad en
//                CUALQUIER operación (marcar o desmarcar), no solo en una
//                de las dos. Coste: una consulta a globalFeed más por
//                sesión marcada -- aceptado explícitamente por el usuario
//                a cambio de que la insignia no vuelva a desviarse nunca.
// Versión: 5.17 - FIX de fondo (reportado por el usuario con pruebas
//                concretas: el dashboard le decía 40 min acumulados de Z4
//                pero le saltó igualmente la insignia "60 min en Z4" al
//                completar una sesión de Z2 sin nada de Z4 -- imposible
//                si de verdad solo hubiera 40). Causa real:
//                totalZone4Minutes/totalZone5Minutes (y totalDistance/
//                totalSessions/countLongRuns/countIntervals/
//                countStrengthRuns) nunca se recalculaban desde la
//                verdad -- solo se sumaban al marcar y se restaban al
//                desmarcar, sesión a sesión, así que un desajuste puntual
//                entre un marcado y su desmarcado correspondiente se
//                quedaba pegado para siempre sin ninguna forma de
//                autocorregirse. _recalcularDerivadosDesdeHistorial()
//                (que ya se ejecutaba en cada desmarcado para la racha y
//                los récords) ahora también reconstruye estos 7 campos
//                desde CERO sumando el desglose real de TODAS las
//                sesiones que de verdad existen en globalFeed -- la
//                fuente de la verdad, no un contador que se puede
//                desviar. Efecto práctico para el usuario ya afectado:
//                desmarcar y volver a marcar CUALQUIER sesión (no hace
//                falta que sea la de la insignia) fuerza este recálculo y
//                sirve como "reinicio" inmediato de estos acumulados.
// Versión: 5.16 - Aclaración de texto (a raíz de un aviso del usuario: le
//                salió la insignia "60 min en Z4" justo al completar una
//                sesión de Z2, y pensó que era un fallo). No lo es: ZONE_4_60
//                y ZONE_5_30 son insignias ACUMULADAS de por vida
//                (totalZone4Minutes/totalZone5Minutes, sumados entre TODAS
//                las sesiones, ver updateAfterSession), no "hiciste 60 min
//                de Z4 en una sola sesión" -- se desbloquean la primera vez
//                que el acumulado cruza el umbral, en la sesión que sea que
//                se esté completando en ese momento (que puede perfectamente
//                ser una de recuperación en Z2, si las anteriores en Z4/Z5
//                ya sumaban lo suficiente). Se aclara la descripción para
//                que no se lea como si fuera de una sola sesión.
// Versión: 5.15 - updateAfterSession() ahora devuelve también `oldLevel`
//                (ya se leía dentro de su propia transacción) para que
//                quien la llama (calendar.js, al completar una sesión) no
//                tenga que volver a pedir el documento completo a
//                Firestore antes y después solo para comparar el nivel --
//                dos lecturas menos en una de las acciones más frecuentes
//                de toda la app.
// Versión: 5.14 - AUDITORÍA DE INSIGNIAS:
//   1) FIX "Madrugador" colándose en sesiones de tarde: en
//      _recalcularDerivadosDesdeHistorial (se ejecuta al desmarcar
//      CUALQUIER sesión) el conteo usaba la hora de 'fechaSesion' --
//      heredada arbitrariamente de cuándo se generó el plan, no la hora
//      real -- en vez de la hora de 'timestamp' (momento real de marcar).
//      Eso podía inflar earlyBirdCount sin motivo real y hacer que una
//      sesión de tarde posterior recibiera igualmente la insignia.
//   2) ZONE_4_60/ZONE_5_30 pasan a alimentarse de datos reales
//      (metricas.zone4Minutes/zone5Minutes, calculados en calendar.js a
//      partir del desglose real de la sesión) en vez de quedarse siempre a
//      0; además ahora se restan correctamente en removeSession al
//      desmarcar, igual que el resto de contadores.
//   3) Se retiran ELEVATION_500/ELEVATION_1000: no hay ningún cálculo de
//      desnivel real en toda la app (ni se guarda altitud del GPS), así
//      que eran insignias permanentemente imposibles de conseguir.
// Versión: 5.13 - FIX ZONA HORARIA en el cálculo de la racha al marcar una
//                sesión (updateAfterSession): 'new Date(lastSessionDate)'
//                interpretaba esa fecha (guardada como "YYYY-MM-DD") como
//                medianoche UTC, mientras que 'now' es hora local -- el
//                desfase (España UTC+1/+2) podía hacer que entrenar de
//                madrugada no sumara racha, o que se rompiera una racha
//                real sin motivo. Ahora se comparan días de calendario
//                completos forzando medianoche LOCAL en ambas fechas,
//                igual que ya hacía _recalcularDerivadosDesdeHistorial.
//                De paso, se blinda el marcado de sesiones fuera de orden
//                (poniéndose al día con sesiones atrasadas): ya no se
//                retrocede lastSessionDate por error, lo que podía
//                desajustar el próximo cálculo de racha en caliente.
// Versión: 5.12 - RÉCORDS SOLO CON GPS REAL: se elimina por completo la
//                creación de récords extrapolados (sin GPS), tanto al
//                marcar una sesión a mano (updateAfterSession) como al
//                recalcular desde el historial al desmarcar
//                (_recalcularDerivadosDesdeHistorial). Un récord ahora
//                SOLO puede salir de un tramo medido de verdad por el
//                motor de GPS de la app (gps:true), y solo se conserva
//                mientras la sesión con GPS que lo puso siga existiendo:
//                cada sesión con GPS guarda su propio mejor tramo por
//                distancia en 'recordsPorTramo' (ver
//                calcularTramosSesion/gps-tracker.js), y el recálculo al
//                desmarcar/borrar toma el mínimo real entre las sesiones
//                con GPS que quedan -- sin estimaciones. Se añade además
//                autolimpieza (_limpiarRecordsNoGPS, en getData): cualquier
//                récord antiguo sin gps:true se elimina solo la primera
//                vez que se leen los datos de cada usuario. De paso,
//                removeSession reintenta una vez el recálculo si falla
//                (antes se rendía en silencio y dejaba racha/récords
//                desactualizados sin avisar).
// Versión: 5.10 - FIX RAÍZ de la racha: se calculaba con la fecha del
//                instante de marcar ('timestamp'/'new Date()'), no con
//                el día real de la sesión ('fechaSesion'/
//                metricas.fechaSesionReal). Ahora usa el día real tanto
//                al marcar (updateAfterSession) como al recalcular al
//                desmarcar (_recalcularDerivadosDesdeHistorial). De paso
//                se protegen los récords por tramo GPS (gps:true) para
//                que ese recálculo ya no los borre.
// Versión: 5.9 - Récords por tramo GPS: además del récord por sesión
//                completa, ahora busca dentro de cualquier carrera con
//                GPS el mejor tramo de 1/5/10/21.1/42.2 km, aunque sea
//                parte de una carrera más larga (ver actualizarRecordsPorTramos)
// Versión: 5.8 - Recalculo de racha/récords desde el historial real al desmarcar/borrar una sesión (antes se quedaban "pegados" arriba para siempre)
// ====================

const Gamification = {
  // ========== INSIGNIAS ==========
  // 50 insignias, TODAS conseguibles con datos que la app mide de verdad.
  // La condición de cada una vive en CONDICIONES (más abajo, mismo orden de
  // grupos). Reglas de la casa:
  //  - Sin GPS de la app NO se puede ganar ninguna de ritmo, velocidad ni hora
  //    del día (solo el GPS mide el ritmo real y a qué hora se corrió).
  //  - Nada de desnivel: la app no lo mide (ver nota v5.14/v5.21).
  //  - Los textos dicen exactamente lo que se exige, para que quien las vea
  //    bloqueadas en el pasaporte sepa qué tiene que hacer.
  BADGES: {
    // ---- Número de sesiones ----
    FIRST_SESSION: { id: 'FIRST_SESSION', name: 'Primer entrenamiento', description: 'Completaste tu primera sesión', xp: 50, icon: '🏁' },
    FIRST_WEEK: { id: 'FIRST_WEEK', name: 'Primera semana', description: 'Completaste 7 sesiones', xp: 100, icon: '📅' },
    SESSIONS_10: { id: 'SESSIONS_10', name: '10 entrenamientos', description: 'Completaste 10 sesiones', xp: 150, icon: '🎯' },
    FIRST_MONTH: { id: 'FIRST_MONTH', name: 'Primer mes', description: 'Completaste 30 sesiones', xp: 300, icon: '🏅' },
    SESSIONS_50: { id: 'SESSIONS_50', name: '50 entrenamientos', description: 'Completaste 50 sesiones', xp: 600, icon: '🏆' },
    SESSIONS_100: { id: 'SESSIONS_100', name: '100 entrenamientos', description: 'Completaste 100 sesiones', xp: 1200, icon: '🎖️' },
    SESSIONS_250: { id: 'SESSIONS_250', name: '250 entrenamientos', description: 'Completaste 250 sesiones', xp: 2000, icon: '🎗️' },
    // ---- Distancia acumulada ----
    DISTANCE_50: { id: 'DISTANCE_50', name: '50 km', description: 'Acumulaste 50 km', xp: 100, icon: '👟' },
    DISTANCE_100: { id: 'DISTANCE_100', name: '100 km', description: 'Acumulaste 100 km', xp: 200, icon: '📏' },
    DISTANCE_250: { id: 'DISTANCE_250', name: '250 km', description: 'Acumulaste 250 km', xp: 450, icon: '🧭' },
    DISTANCE_500: { id: 'DISTANCE_500', name: '500 km', description: 'Acumulaste 500 km', xp: 800, icon: '🌟' },
    DISTANCE_1000: { id: 'DISTANCE_1000', name: '1000 km', description: 'Acumulaste 1000 km', xp: 1500, icon: '🏆' },
    DISTANCE_2500: { id: 'DISTANCE_2500', name: '2500 km', description: 'Acumulaste 2500 km', xp: 3000, icon: '🌍' },
    // ---- Distancia en UNA sola sesión ----
    FIVE_K: { id: 'FIVE_K', name: '5 km', description: 'Corriste 5 km en una sesión', xp: 50, icon: '🏃' },
    TEN_K: { id: 'TEN_K', name: '10 km', description: 'Corriste 10 km en una sesión', xp: 100, icon: '🏃‍♀️' },
    HALF_MARATHON: { id: 'HALF_MARATHON', name: 'Media maratón', description: 'Completaste 21,1 km en una sesión', xp: 300, icon: '🥈' },
    MARATHON: { id: 'MARATHON', name: 'Maratón', description: 'Completaste 42,2 km en una sesión', xp: 500, icon: '🥇' },
    // ---- Rachas ----
    STREAK_7: { id: 'STREAK_7', name: 'Racha de 7 días', description: 'Entrenaste una semana seguida', xp: 70, icon: '🔥' },
    STREAK_14: { id: 'STREAK_14', name: 'Racha de 14 días', description: 'Entrenaste dos semanas seguidas', xp: 150, icon: '📈' },
    STREAK_30: { id: 'STREAK_30', name: 'Racha de 30 días', description: 'Un mes entero entrenando', xp: 300, icon: '🦾' },
    STREAK_100: { id: 'STREAK_100', name: 'Racha de 100 días', description: '100 días seguidos', xp: 1200, icon: '🏆' },
    MONTH_STREAK_3: { id: 'MONTH_STREAK_3', name: '3 meses seguidos', description: 'Entrenaste tres meses naturales seguidos', xp: 200, icon: '🗓️' },
    MONTH_STREAK_6: { id: 'MONTH_STREAK_6', name: '6 meses seguidos', description: 'Medio año entrenando cada mes', xp: 400, icon: '📆' },
    // ---- Tiempo en zonas (acumulado de por vida, sumando todas las sesiones) ----
    ZONE_2_600: { id: 'ZONE_2_600', name: 'Base aeróbica', description: 'Acumulaste 10 horas (600 min) en total en zona 2, sumando todas tus sesiones', xp: 300, icon: '💚' },
    ZONE_4_60: { id: 'ZONE_4_60', name: '60 min en Z4', description: 'Acumulaste 60 minutos en total en zona 4, sumando todas tus sesiones', xp: 300, icon: '❤️' },
    ZONE_5_30: { id: 'ZONE_5_30', name: '30 min en Z5', description: 'Acumulaste 30 minutos en total en zona 5, sumando todas tus sesiones', xp: 500, icon: '💜' },
    ZONE_5_120: { id: 'ZONE_5_120', name: '120 min en Z5', description: 'Acumulaste 120 minutos en total en zona 5, sumando todas tus sesiones', xp: 900, icon: '🌋' },
    // ---- Tipos de sesión ----
    LONG_RUN_10: { id: 'LONG_RUN_10', name: '10 tiradas largas', description: '10 sesiones largas', xp: 200, icon: '🚶‍♂️' },
    INTERVALS_10: { id: 'INTERVALS_10', name: '10 series', description: '10 sesiones de series', xp: 250, icon: '⚡' },
    TEMPO_10: { id: 'TEMPO_10', name: '10 tempos', description: '10 sesiones de tempo', xp: 200, icon: '⏱️' },
    STRENGTH_10: { id: 'STRENGTH_10', name: '10 fuerza', description: '10 sesiones de fuerza', xp: 100, icon: '💪' },
    // ---- Días de la semana y volumen ----
    SUNDAY_RUNNER: { id: 'SUNDAY_RUNNER', name: 'Dominguero', description: 'Entrenaste un domingo', xp: 20, icon: '☀️' },
    WEEKEND_WARRIOR: { id: 'WEEKEND_WARRIOR', name: 'Finde de guerrero', description: 'Entrenaste el sábado y el domingo del mismo fin de semana', xp: 80, icon: '🛡️' },
    ALL_WEEK: { id: 'ALL_WEEK', name: 'Los siete días', description: 'Entrenaste al menos una vez en cada día de la semana (de lunes a domingo)', xp: 150, icon: '🌈' },
    WEEK_5: { id: 'WEEK_5', name: 'Semana intensa', description: '5 sesiones en una misma semana (de lunes a domingo)', xp: 120, icon: '📊' },
    MONTH_20: { id: 'MONTH_20', name: 'Mes constante', description: '20 sesiones en un mismo mes natural', xp: 300, icon: '🗒️' },
    MONTH_100KM: { id: 'MONTH_100KM', name: 'Mes de 100 km', description: 'Sumaste 100 km en un mismo mes natural', xp: 400, icon: '🛣️' },
    // ---- Hora del día (SOLO sesiones grabadas con el GPS de la app: la sesión ENTERA,
    //      de principio a fin, tiene que caber dentro de la franja, y mínimo 1 km) ----
    NIGHT_RUN: { id: 'NIGHT_RUN', name: 'Carrera nocturna', description: 'Corriste con el GPS de la app, de principio a fin, entre las 00:00 y las 06:00 (mínimo 1 km)', xp: 60, icon: '🌙' },
    EARLY_BIRD: { id: 'EARLY_BIRD', name: 'Madrugador', description: 'Corriste con el GPS de la app, de principio a fin, entre las 06:00 y las 08:00 (mínimo 1 km)', xp: 30, icon: '🌅' },
    MIDDAY_RUN: { id: 'MIDDAY_RUN', name: 'Sol de mediodía', description: 'Corriste con el GPS de la app, de principio a fin, entre las 12:00 y las 15:00 (mínimo 1 km)', xp: 30, icon: '🌞' },
    EVENING_RUN: { id: 'EVENING_RUN', name: 'Atardecer', description: 'Corriste con el GPS de la app, de principio a fin, entre las 18:00 y las 21:00 (mínimo 1 km)', xp: 30, icon: '🌇' },
    // ---- Ritmo y velocidad (SOLO con el GPS de la app) ----
    PACE_SUB6: { id: 'PACE_SUB6', name: 'Ritmo < 6:00/km', description: 'Corriste un kilómetro por debajo de 6:00 (medido con el GPS de la app)', xp: 60, icon: '👣' },
    PACE_SUB5: { id: 'PACE_SUB5', name: 'Ritmo < 5:00/km', description: 'Corriste un kilómetro por debajo de 5:00 (medido con el GPS de la app)', xp: 100, icon: '🔆' },
    PACE_SUB4: { id: 'PACE_SUB4', name: 'Ritmo < 4:00/km', description: 'Corriste un kilómetro por debajo de 4:00 (medido con el GPS de la app)', xp: 200, icon: '🚀' },
    SPEED_15: { id: 'SPEED_15', name: '15 km/h', description: 'Mantuviste 15 km/h durante al menos 10 segundos seguidos (medido con el GPS de la app)', xp: 40, icon: '🐇' },
    SPEED_20: { id: 'SPEED_20', name: '20 km/h', description: 'Mantuviste 20 km/h durante al menos 10 segundos seguidos (medido con el GPS de la app)', xp: 60, icon: '💨' },
    FIVEK_SUB30: { id: 'FIVEK_SUB30', name: '5 km en menos de 30:00', description: 'Corriste un tramo de 5 km en menos de 30 minutos (medido con el GPS de la app)', xp: 200, icon: '⏲️' },
    TENK_SUB60: { id: 'TENK_SUB60', name: '10 km en menos de 60:00', description: 'Corriste un tramo de 10 km en menos de 60 minutos (medido con el GPS de la app)', xp: 300, icon: '🎽' },
    // ---- Uso del GPS ----
    FIRST_GPS: { id: 'FIRST_GPS', name: 'GPS activado', description: 'Usaste el GPS por primera vez', xp: 25, icon: '📍' },
    GPS_10: { id: 'GPS_10', name: '10 sesiones con GPS', description: 'Grabaste 10 sesiones con el GPS de la app', xp: 100, icon: '🛰️' }
  },

  // Margen para comparar kilómetros acumulados en coma flotante (sumar
  // 0,1 + 0,2 + ... puede dar 99,99999999 en vez de 100).
  _EPS: 1e-6,

  // Condición de cada insignia, en función de las estadísticas (ver
  // _calcularEstadisticas). Una por insignia: si BADGES y CONDICIONES no
  // tienen exactamente las mismas claves, falta una condición o sobra una.
  CONDICIONES: {
    FIRST_SESSION: s => s.totalSessions >= 1,
    FIRST_WEEK: s => s.totalSessions >= 7,
    SESSIONS_10: s => s.totalSessions >= 10,
    FIRST_MONTH: s => s.totalSessions >= 30,
    SESSIONS_50: s => s.totalSessions >= 50,
    SESSIONS_100: s => s.totalSessions >= 100,
    SESSIONS_250: s => s.totalSessions >= 250,

    DISTANCE_50: s => s.totalDistance >= 50 - 1e-6,
    DISTANCE_100: s => s.totalDistance >= 100 - 1e-6,
    DISTANCE_250: s => s.totalDistance >= 250 - 1e-6,
    DISTANCE_500: s => s.totalDistance >= 500 - 1e-6,
    DISTANCE_1000: s => s.totalDistance >= 1000 - 1e-6,
    DISTANCE_2500: s => s.totalDistance >= 2500 - 1e-6,

    FIVE_K: s => s.maxDistanceSingle >= 5 - 1e-6,
    TEN_K: s => s.maxDistanceSingle >= 10 - 1e-6,
    HALF_MARATHON: s => s.maxDistanceSingle >= 21.1 - 1e-6,
    MARATHON: s => s.maxDistanceSingle >= 42.2 - 1e-6,

    STREAK_7: s => s.bestStreakDays >= 7,
    STREAK_14: s => s.bestStreakDays >= 14,
    STREAK_30: s => s.bestStreakDays >= 30,
    STREAK_100: s => s.bestStreakDays >= 100,
    MONTH_STREAK_3: s => s.monthStreak >= 3,
    MONTH_STREAK_6: s => s.monthStreak >= 6,

    ZONE_2_600: s => s.totalZone2Minutes >= 600 - 1e-6,
    ZONE_4_60: s => s.totalZone4Minutes >= 60 - 1e-6,
    ZONE_5_30: s => s.totalZone5Minutes >= 30 - 1e-6,
    ZONE_5_120: s => s.totalZone5Minutes >= 120 - 1e-6,

    LONG_RUN_10: s => s.countLongRuns >= 10,
    INTERVALS_10: s => s.countIntervals >= 10,
    TEMPO_10: s => s.countTempoRuns >= 10,
    STRENGTH_10: s => s.countStrengthRuns >= 10,

    SUNDAY_RUNNER: s => !!(s.daysOfWeek && s.daysOfWeek[0]),
    WEEKEND_WARRIOR: s => s.weekendWarrior === true,
    ALL_WEEK: s => !!s.daysOfWeek && [0, 1, 2, 3, 4, 5, 6].every(d => s.daysOfWeek[d] === true),
    WEEK_5: s => s.maxSessionsInWeek >= 5,
    MONTH_20: s => s.maxSessionsInMonth >= 20,
    MONTH_100KM: s => s.maxDistanceInMonth >= 100 - 1e-6,

    NIGHT_RUN: s => s.nightRunCount >= 1,
    EARLY_BIRD: s => s.earlyBirdCount >= 1,
    MIDDAY_RUN: s => s.middayRunCount >= 1,
    EVENING_RUN: s => s.eveningRunCount >= 1,

    PACE_SUB6: s => s.bestKmMs !== null && s.bestKmMs < 360000,
    PACE_SUB5: s => s.bestKmMs !== null && s.bestKmMs < 300000,
    PACE_SUB4: s => s.bestKmMs !== null && s.bestKmMs < 240000,
    SPEED_15: s => s.maxSpeedGPS >= 15,
    SPEED_20: s => s.maxSpeedGPS >= 20,
    FIVEK_SUB30: s => s.best5kMs !== null && s.best5kMs < 1800000,
    TENK_SUB60: s => s.best10kMs !== null && s.best10kMs < 3600000,

    FIRST_GPS: s => s.gpsSessions >= 1 || s.firstGPS === true,
    GPS_10: s => s.gpsSessions >= 10
  },

  // Franjas horarias de las insignias de hora del día. 'campo' es el
  // contador (en las estadísticas y en el documento) de sesiones GPS que
  // caben ENTERAS en la franja: hora de inicio >= desde Y hora de fin < hasta,
  // el mismo día natural.
  VENTANAS_HORARIAS: [
    { campo: 'nightRunCount', desde: 0, hasta: 6 },
    { campo: 'earlyBirdCount', desde: 6, hasta: 8 },
    { campo: 'middayRunCount', desde: 12, hasta: 15 },
    { campo: 'eveningRunCount', desde: 18, hasta: 21 }
  ],
  // Kilómetros mínimos para que una sesión GPS cuente en una franja horaria
  // (evita "carreras" de 20 metros para cobrar la insignia).
  VENTANA_MIN_KM: 1,

  // Tramos GPS que alimentan las insignias de ritmo, y el tiempo MÍNIMO
  // creíble de cada uno (≈ récord mundial): por debajo es ruido del GPS, no
  // una marca real, y no se cuenta.
  TRAMOS_INSIGNIA: {
    '1': { campo: 'bestKmMs', minMs: 125000 },
    '5': { campo: 'best5kMs', minMs: 750000 },
    '10': { campo: 'best10kMs', minMs: 1560000 }
  },

  // Escala de niveles por km acumulados (11 niveles). Los 5 primeros son
  // fáciles; a partir del 6 cada nivel exige mucho más.
  LEVELS_KM: [
    { level: 1, kmNeeded: 0 },
    { level: 2, kmNeeded: 50 },
    { level: 3, kmNeeded: 150 },
    { level: 4, kmNeeded: 300 },
    { level: 5, kmNeeded: 500 },
    { level: 6, kmNeeded: 1000 },
    { level: 7, kmNeeded: 1500 },
    { level: 8, kmNeeded: 2000 },
    { level: 9, kmNeeded: 3000 },
    { level: 10, kmNeeded: 5000 },
    { level: 11, kmNeeded: 6000, requiereTodasInsignias: true }
  ],

  // 🔥 v5.22: el nivel 11 (máximo) exige los 6000 km Y todas las insignias
  // (todas las de this.BADGES). Con los km pero sin todas las insignias, el
  // nivel se queda en el 10. Si algún día se añade una insignia nueva, quien
  // estuviera en el 11 baja al 10 hasta conseguirla (se corrige solo).
  tieneTodasLasInsignias(badges) {
    if (!Array.isArray(badges)) return false;
    return Object.keys(this.BADGES).every(id => badges.includes(id));
  },

  // Escala de 11 colores, del 1 (gris) al 10 (morado), pasando por azul,
  // verde, amarillo, naranja y rojo — tonos suaves, no muy intensos. El 11
  // (nivel máximo) es dorado.
  getColorByLevel(level) {
    const colors = {
      1: '#9e9e9e', 2: '#7fa1c9', 3: '#6bb3ae', 4: '#7fb37a',
      5: '#a9bd6a', 6: '#cbb15f', 7: '#cf9760', 8: '#c97b5f',
      9: '#bd6688', 10: '#9270c9', 11: '#d9a441'
    };
    if (level > 11) return colors[11];
    return colors[level] || colors[1];
  },

  // Aplica el color del nivel a la variable CSS global --notification-color,
  // de la que cuelgan todas las notificaciones de la app (badges de no
  // leídos, insignias "NUEVO", nombres de chat sin leer, etc). Así cada
  // usuario ve las notificaciones en el color de SU propio nivel en vez
  // del naranja fijo de antes. Se guarda también en localStorage para
  // poder pintarlo al instante en la pantalla de login, antes de que
  // Firestore responda con el nivel real.
  applyNotificationColor(level) {
    try {
      const color = this.getColorByLevel(level || 1);
      document.documentElement.style.setProperty('--notification-color', color);
      localStorage.setItem('ri5_lastLevel', level || 1);
    } catch (e) {}
  },

  async clearCache(uid) {
    if (!uid) return;
    try {
      sessionStorage.removeItem(`gamification_${uid}`);
      localStorage.removeItem(`gamification_${uid}`);
      console.log('🗑️ Caché de gamificación limpiada para', uid);
    } catch (e) { console.warn(e); }
  },

  // Lectura SÍNCRONA de los datos de gamificación ya en caché (sessionStorage),
  // sin ir a Firestore. Se usa para pintar de golpe, sin parpadeo de
  // "Cargando…", pantallas que solo necesitan una foto rápida de los datos
  // (p.ej. el modal de récords de Profile.abrirModalRecords). Si no hay
  // nada en caché o está corrupto, devuelve null y quien llama debe caer
  // de vuelta a getData(uid).
  getCached(uid) {
    if (!uid) return null;
    try {
      const raw = sessionStorage.getItem(`gamification_${uid}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  calculateXP(sesion, metricas) {
    let xp = 0;
    if (sesion.duracion) xp += sesion.duracion;
    if (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) {
      xp += metricas.distanciaTotal * 10;
    }
    const tipo = sesion.tipo;
    if (tipo === 'series') xp += 25;
    else if (tipo === 'tempo') xp += 20;
    else if (tipo === 'largo') xp += 30;
    else if (tipo === 'strength') xp += 15;
    else if (tipo === 'rodaje') xp += 10;
    return Math.floor(xp);
  },

  async getData(uid) {
    if (!uid) return this.getDefaultData();
    try {
      const doc = await firebaseServices.db.collection('gamification').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        const limpio = await this._limpiarRecordsNoGPS(uid, data);
        return await this._ajustarNivelSiHaceFalta(uid, limpio);
      }
      const defaultData = this.getDefaultData();
      await firebaseServices.db.collection('gamification').doc(uid).set(defaultData);
      console.log('✅ Documento de gamificación creado para', uid);
      return defaultData;
    } catch (error) {
      console.error('Error obteniendo datos de gamificación:', error);
      return this.getDefaultData();
    }
  },

  // Autolimpieza de récords antiguos NO válidos: antes del cambio a
  // "récords solo con GPS", personalRecords podía contener marcas
  // extrapoladas (sin r.gps === true) creadas al marcar una sesión a mano
  // o al recalcular desde el historial con el método antiguo. Cada vez
  // que se leen los datos de gamificación de alguien, se filtran esas
  // marcas inválidas; si de verdad había alguna, se persiste la versión
  // limpia una sola vez (las siguientes lecturas ya no encontrarán nada
  // que limpiar). No hace falta ninguna migración manual: se autocorrige
  // sola la primera vez que cada usuario abre la app tras la actualización.
  async _limpiarRecordsNoGPS(uid, data) {
    const records = data.personalRecords || {};
    const claves = Object.keys(records);
    const limpios = {};
    let huboLimpieza = false;
    claves.forEach(key => {
      if (records[key] && records[key].gps === true) {
        limpios[key] = records[key];
      } else {
        huboLimpieza = true;
      }
    });
    if (!huboLimpieza) return data;
    try {
      await firebaseServices.db.collection('gamification').doc(uid).set({ personalRecords: limpios }, { merge: true });
      console.log('🧹 Récords antiguos sin GPS eliminados para', uid);
    } catch (e) {
      console.warn('No se pudieron limpiar los récords antiguos sin GPS:', e);
    }
    return { ...data, personalRecords: limpios };
  },

  getDefaultData() {
    return {
      totalXP: 0,
      level: 1,
      badges: [],
      totalDistance: 0,
      totalSessions: 0,
      lastSessionDate: null,
      lastUpdate: firebaseServices.Timestamp.now(),
      currentShoe: { name: 'Zapatilla actual', km: 0 },
      shoeHistory: [],
      streakDays: 0,
      bestPace: null,
      maxSpeed: 0,
      totalZone4Minutes: 0,
      totalZone5Minutes: 0,
      countLongRuns: 0,
      countIntervals: 0,
      countStrengthRuns: 0,
      daysOfWeek: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
      earlyBirdCount: 0,
      maxDistanceSingle: 0,
      monthStreak: 0,
      lastMonth: null,
      firstGPSEver: false,
      bestStreakDays: 0,
      personalRecords: {},
      // 🔥 v5.21: contadores de las insignias nuevas
      totalZone2Minutes: 0,
      countTempoRuns: 0,
      weekendWarrior: false,
      maxSessionsInWeek: 0,
      maxSessionsInMonth: 0,
      maxDistanceInMonth: 0,
      nightRunCount: 0,
      middayRunCount: 0,
      eveningRunCount: 0,
      bestKmMs: null,
      best5kMs: null,
      best10kMs: null,
      maxSpeedGPS: 0,
      gpsSessions: 0
    };
  },

  // Distancias estándar para las que se guarda "mejor marca" (récord
  // personal). Dos vías las alimentan:
  //  1) Sesiones SIN GPS (o con distancia corregida a mano): cuenta si la
  //     distancia total llega al menos a la distancia estándar (sin
  //     margen), y el tiempo del récord se extrapola por ritmo medio a
  //     esa distancia exacta -- no se usa el tiempo total de la sesión
  //     completa si corriste más de lo necesario (ver updateAfterSession).
  //  2) Sesiones CON GPS: se analiza el recorrido entero y se busca, DENTRO
  //     de él, el tramo más rápido que mida exactamente cada distancia
  //     estándar -- igual que hace Strava con los "mejores esfuerzos". Por
  //     ejemplo, una carrera de 10 km con GPS puede batir a la vez el
  //     récord de 1 km, el de 5 km y el de 10 km, cada uno con su propio
  //     tramo dentro de esa misma carrera (ver actualizarRecordsPorTramos).
  RECORD_DISTANCES: [1, 5, 10, 21.1, 42.2],

  // Haversine en metros (duplicado a propósito del que ya existe en
  // GPSTracker._haversine: se evita depender de que gps-tracker.js esté
  // cargado para poder usar esta función desde cualquier sitio).
  _haversineM(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  // Busca, dentro de un recorrido GPS completo (trackPoints con {lat,lng,ts}
  // en orden cronológico), el tramo más rápido que mida exactamente
  // distanciaKm. Recorre el track una sola vez con dos punteros (el track
  // ya viene ordenado por distancia acumulada creciente), e interpola el
  // instante exacto en el que se completa esa distancia entre los dos
  // puntos GPS que la rodean, para no depender de que un punto caiga
  // justo en el kilómetro exacto. Devuelve null si el recorrido no llega
  // a esa distancia.
  // Tope de "hueco" entre dos puntos GPS consecutivos que se cuenta como
  // tiempo corriendo real. Con el filtro de puntos ya existente en
  // gps-tracker.js (se descarta un punto si no hay al menos ~1.5m de
  // movimiento real, ver _filterGPS) un tramo corrido sin parar nunca
  // debería generar un hueco así de grande entre dos puntos consecutivos;
  // solo se llega a este tope en un semáforo/parada, un corte de señal
  // (túnel, entre edificios) o al usar el botón de PAUSA del tracker. Por
  // encima de este tope, el EXCESO no cuenta como tiempo de carrera.
  _MAX_GAP_MS: 8000,

  // Busca, dentro de un recorrido GPS completo (trackPoints con {lat,lng,ts}
  // en orden cronológico), el tramo más rápido que mida exactamente
  // distanciaKm. Recorre el track una sola vez con dos punteros (el track
  // ya viene ordenado por distancia acumulada creciente), e interpola el
  // instante exacto en el que se completa esa distancia entre los dos
  // puntos GPS que la rodean, para no depender de que un punto caiga
  // justo en el kilómetro exacto. Devuelve null si el recorrido no llega
  // a esa distancia.
  //
  // 🔥 FIX: un récord podía salir MÁS LENTO que la propia media de la
  // sesión (ej. sesión a 6:20/km de media, "récord" del km a 7:xx/km) --
  // matemáticamente imposible si de verdad es el tramo más rápido del
  // recorrido. La causa: la duración de cada tramo candidato se calculaba
  // como la diferencia bruta de `ts` (reloj real) entre sus dos puntos
  // GPS, sin descontar ninguna parada -- ni las del botón PAUSA (que sí se
  // descuentan para la media de la sesión, ver _getElapsed() en
  // gps-tracker.js, que resta `pausedTime`), ni las paradas "silenciosas"
  // sin pulsar pausa (semáforo, corte de señal bajo techo/entre
  // edificios), que tampoco añaden puntos al track pero SÍ dejan pasar
  // tiempo real entre el último punto de antes y el primero de después.
  // Si el tramo "más rápido" encontrado cruzaba por casualidad uno de
  // estos huecos, su duración salía inflada con todo ese tiempo parado,
  // pudiendo acabar más lento que la media real. Ahora se usa un "tiempo
  // activo" (array `act`, paralelo a `cum`) que tapa cada hueco entre dos
  // puntos consecutivos a un máximo de _MAX_GAP_MS antes de sumarlo: en
  // una sesión corrida sin parar esto no cambia nada (los huecos normales
  // entre puntos GPS son de pocos segundos, muy por debajo del tope), pero
  // neutraliza cualquier parada larga para que dos puntos que la cruzan no
  // salgan penalizados por ella.
  _mejorTramo(trackPoints, distanciaKm) {
    const n = trackPoints.length;
    if (n < 2) return null;
    const distObjetivoM = distanciaKm * 1000;

    // Distancia acumulada (metros) hasta cada punto, empezando en 0.
    const cum = new Array(n).fill(0);
    // Tiempo ACTIVO acumulado (ms) hasta cada punto: como cum, pero
    // capando cada salto entre puntos consecutivos a _MAX_GAP_MS para no
    // contar paradas/pausas/cortes de señal como si fueran carrera.
    const act = new Array(n).fill(0);
    for (let k = 1; k < n; k++) {
      cum[k] = cum[k - 1] + this._haversineM(
        trackPoints[k - 1].lat, trackPoints[k - 1].lng,
        trackPoints[k].lat, trackPoints[k].lng
      );
      const delta = trackPoints[k].ts - trackPoints[k - 1].ts;
      act[k] = act[k - 1] + Math.min(Math.max(delta, 0), this._MAX_GAP_MS);
    }
    if (cum[n - 1] < distObjetivoM) return null; // el recorrido no llega a esa distancia

    let mejorMs = Infinity;
    let mejorInicio = null;
    let j = 0;
    for (let i = 0; i < n; i++) {
      if (j < i) j = i;
      while (j < n - 1 && (cum[j] - cum[i]) < distObjetivoM) j++;
      if ((cum[j] - cum[i]) < distObjetivoM) break; // ya no caben más tramos completos desde aquí
      let tFin;
      if (j === i) {
        continue; // distancia 0, no aplica
      } else if ((cum[j - 1] - cum[i]) >= distObjetivoM) {
        tFin = act[j - 1];
      } else {
        const distAntes = cum[j - 1] - cum[i];
        const distDespues = cum[j] - cum[i];
        const frac = (distObjetivoM - distAntes) / ((distDespues - distAntes) || 1);
        tFin = act[j - 1] + frac * (act[j] - act[j - 1]);
      }
      const duracionMs = tFin - act[i];
      if (duracionMs > 0 && duracionMs < mejorMs) {
        mejorMs = duracionMs;
        mejorInicio = trackPoints[i].ts;
      }
    }
    if (!isFinite(mejorMs)) return null;
    return { durationMs: Math.round(mejorMs), inicioTs: mejorInicio };
  },

  // Calcula, para TODAS las distancias estándar que un recorrido GPS
  // llegue a cubrir, el mejor tramo dentro de ese recorrido (independiente
  // de si bate o no el récord ya guardado). Es una función PURA (no toca
  // Firestore): se usa tanto para decidir si se bate un récord como para
  // guardar, junto a la propia sesión en el muro, "lo que esta sesión
  // concreta demostró" -- así, más adelante, si se desmarca/borra otra
  // sesión distinta, se puede recalcular el récord global de verdad sin
  // tener que volver a guardar el track completo con marcas de tiempo (que
  // no se persisten en Firestore por peso). Devuelve un mapa
  // { "1": {durationMs}, "5": {durationMs}, ... } solo con las distancias
  // que el recorrido llega a cubrir.
  calcularTramosSesion(trackPoints) {
    const tramos = {};
    if (!trackPoints || trackPoints.length < 2) return tramos;
    if (!trackPoints[0] || typeof trackPoints[0].ts !== 'number') return tramos;
    this.RECORD_DISTANCES.forEach(d => {
      const tramo = this._mejorTramo(trackPoints, d);
      if (tramo) tramos[String(d)] = { durationMs: tramo.durationMs };
    });
    return tramos;
  },

  // Se llama justo al finalizar y guardar una sesión CON GPS (ver
  // gps-tracker.js _guardarYPublicar), con el recorrido completo en
  // memoria (con ts por punto, antes de decimar/guardar en Firestore).
  // Calcula el mejor tramo de cada distancia estándar que el recorrido
  // llegue a cubrir y, si bate el récord ya guardado, lo actualiza -- pero
  // SOLO si esta sesión fue realizada de verdad con el motor de GPS (se
  // exige un track con marcas de tiempo reales por punto, ver
  // calcularTramosSesion). No toca los récords que no mejora. Devuelve
  // { mejorados, tramosSesion }: la lista de distancias en las que se ha
  // batido récord (para avisar al usuario) y el mapa completo de tramos de
  // ESTA sesión (para que gps-tracker.js lo guarde junto a la entrada del
  // muro y así, si más adelante se desmarca otra sesión distinta, el
  // récord global se pueda recalcular de forma 100% fiable a partir de
  // sesiones con GPS real, sin depender de estimaciones).
  async actualizarRecordsPorTramos(uid, trackPoints) {
    const tramosSesion = this.calcularTramosSesion(trackPoints);
    if (uid !== AppState.currentUserId && !AppState.isAdmin) return { mejorados: [], tramosSesion };
    if (Object.keys(tramosSesion).length === 0) return { mejorados: [], tramosSesion };
    try {
      const oldData = await this.getData(uid);
      const personalRecords = { ...(oldData.personalRecords || {}) };
      const mejorados = [];
      const ahoraISO = new Date().toISOString();

      Object.entries(tramosSesion).forEach(([key, tramo]) => {
        const actual = personalRecords[key];
        if (!actual || tramo.durationMs < actual.durationMs) {
          personalRecords[key] = {
            durationMs: tramo.durationMs,
            distanciaKm: parseFloat(key),
            fecha: ahoraISO,
            gps: true
          };
          mejorados.push(parseFloat(key));
        }
      });

      if (mejorados.length > 0) {
        await firebaseServices.db.collection('gamification').doc(uid).set({ personalRecords }, { merge: true });
      }
      return { mejorados, tramosSesion };
    } catch (e) {
      console.warn('No se pudieron actualizar los récords por tramos GPS:', e);
      return { mejorados: [], tramosSesion };
    }
  },

  // 🔥 v5.21: el nivel guardado en el documento debe coincidir SIEMPRE con
  // los km (totalDistance). Al cambiar la escala de niveles, el 'level'
  // guardado de cada usuario queda desfasado hasta su próxima sesión: aquí
  // se corrige solo, la primera vez que se leen sus datos. Solo se ESCRIBE en
  // el documento propio (las reglas no dejan tocar el de otro); si se están
  // leyendo los datos de un amigo, se devuelve el nivel ya corregido en
  // memoria sin guardar nada.
  async _ajustarNivelSiHaceFalta(uid, data) {
    if (!data || typeof data.totalDistance !== 'number' || !isFinite(data.totalDistance)) return data;
    const nivelReal = this.getLevelByDistance(data.totalDistance, data.badges);
    if (data.level === nivelReal) return data;
    if (uid === AppState.currentUserId) {
      try {
        await firebaseServices.db.collection('gamification').doc(uid).set({ level: nivelReal }, { merge: true });
        console.log(`🔧 Nivel de ${uid} corregido: ${data.level} → ${nivelReal} (${data.totalDistance.toFixed(1)} km)`);
      } catch (e) {
        console.warn('No se pudo corregir el nivel guardado:', e);
      }
    }
    return { ...data, level: nivelReal };
  },

  // Lista de ids de insignia cuya condición cumplen estas estadísticas.
  _insigniasCumplidas(stats) {
    return Object.keys(this.BADGES).filter(id => {
      const cond = this.CONDICIONES[id];
      if (!cond) return false;
      try { return !!cond(stats); } catch (e) { return false; }
    });
  },

  // Minutos acumulados en una zona (Z1..Z5) según el desglose de una sesión.
  // Misma lógica que PlanGenerator._sumarMinutosPorZona (calendar.js), pero
  // duplicada a propósito para no depender del orden de carga de scripts.
  _sumarMinutosZona(desglose, zona) {
    if (!desglose) return 0;
    let minutos = 0;
    ['calentamiento', 'partePrincipal', 'recuperacion', 'enfriamiento'].forEach(tramo => {
      const seg = desglose[tramo];
      if (seg && seg.zona === zona && isFinite(seg.min)) minutos += seg.min;
    });
    if (Array.isArray(desglose.extras)) {
      desglose.extras.forEach(seg => {
        if (seg && seg.zona === zona && isFinite(seg.min)) minutos += seg.min;
      });
    }
    return minutos;
  },

  // Lunes de la semana (hora local) de una fecha, como 'YYYY-MM-DD'.
  _claveSemana(fecha) {
    const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toLocaleDateString('en-CA');
  },

  // Campos (de VENTANAS_HORARIAS) de las franjas horarias en las que cabe
  // ENTERA esta sesión. Solo cuentan sesiones grabadas con el GPS de la app
  // (hasGPS), con hora real de inicio y fin (inicioRealTs/finRealTs, en ms,
  // que guarda calendar.js), de al menos VENTANA_MIN_KM, empezadas y
  // terminadas el mismo día. Una sesión marcada a mano NUNCA cuenta: la
  // única hora que hay es la de pulsar "marcar", no la de correr.
  _ventanasHorariasDeEntrada(d) {
    if (!d || d.hasGPS !== true) return [];
    const ini = Number(d.inicioRealTs), fin = Number(d.finRealTs);
    if (!isFinite(ini) || !isFinite(fin) || ini <= 0 || fin < ini) return [];
    const km = parseFloat(d.gpsDistanceKm ?? d.distancia) || 0;
    if (km < this.VENTANA_MIN_KM) return [];
    const fi = new Date(ini), ff = new Date(fin);
    if (fi.toLocaleDateString('en-CA') !== ff.toLocaleDateString('en-CA')) return [];
    const hI = fi.getHours() + fi.getMinutes() / 60 + fi.getSeconds() / 3600;
    const hF = ff.getHours() + ff.getMinutes() / 60 + ff.getSeconds() / 3600;
    return this.VENTANAS_HORARIAS.filter(v => hI >= v.desde && hF < v.hasta).map(v => v.campo);
  },

  _estadisticasVacias() {
    return {
      streakDays: 0, lastSessionDate: null,
      daysOfWeek: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
      earlyBirdCount: 0, nightRunCount: 0, middayRunCount: 0, eveningRunCount: 0,
      maxDistanceSingle: 0, monthStreak: 0, lastMonth: null,
      bestStreakDays: 0, personalRecords: {},
      totalDistance: 0, totalSessions: 0,
      totalZone2Minutes: 0, totalZone4Minutes: 0, totalZone5Minutes: 0,
      countLongRuns: 0, countIntervals: 0, countStrengthRuns: 0, countTempoRuns: 0,
      currentShoeKm: 0,
      weekendWarrior: false, maxSessionsInWeek: 0, maxSessionsInMonth: 0, maxDistanceInMonth: 0,
      bestKmMs: null, best5kMs: null, best10kMs: null, maxSpeedGPS: 0, gpsSessions: 0
    };
  },

  // FUNCIÓN PURA (no toca Firestore): reconstruye desde CERO todo lo que
  // alimenta insignias, racha y nivel, a partir de las entradas de globalFeed
  // que de verdad existen (cada una con los campos que guarda calendar.js).
  // La usa _recalcularDerivadosDesdeHistorial (que solo se encarga de leer
  // Firestore) y las pruebas. 'cutoffDate' = desde cuándo es "actual" la
  // zapatilla (para currentShoeKm); null = desde el principio.
  _calcularEstadisticas(entradas, cutoffDate = null) {
    const r = this._estadisticasVacias();
    if (!entradas || entradas.length === 0) return r;

    const porDia = {};          // una sesión por día cuenta una vez para la racha
    const semanas = {};         // sesiones por semana (lunes-domingo)
    const meses = {};           // { 'YYYY-MM': { n, km } }
    const personalRecords = {};

    entradas.forEach(d => {
      // Día REAL de la sesión ('fechaSesion', el día del plan) y no el
      // instante de pulsar el check -- ver v5.10. Entradas antiguas sin
      // fechaSesion: se cae a 'timestamp'.
      const fechaRaw = d.fechaSesion ?? d.timestamp;
      const fecha = fechaRaw?.toDate ? fechaRaw.toDate() : new Date(fechaRaw);
      if (!fecha || isNaN(fecha.getTime())) return;
      const key = fecha.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' en horario local
      if (!porDia[key] || fecha < porDia[key]) porDia[key] = fecha;

      const dist = parseFloat(d.gpsDistanceKm ?? d.distancia) || 0;
      if (dist > r.maxDistanceSingle) r.maxDistanceSingle = dist;
      r.daysOfWeek[fecha.getDay()] = true;

      r.totalSessions++;
      r.totalDistance += dist;
      if (!cutoffDate || fecha >= cutoffDate) r.currentShoeKm += dist;

      const tipo = d.trainingType;
      if (tipo === 'largo') r.countLongRuns++;
      else if (tipo === 'series') r.countIntervals++;
      else if (tipo === 'strength') r.countStrengthRuns++;
      else if (tipo === 'tempo') r.countTempoRuns++;

      if (d.desglose) {
        r.totalZone2Minutes += this._sumarMinutosZona(d.desglose, 'Z2');
        r.totalZone4Minutes += this._sumarMinutosZona(d.desglose, 'Z4');
        r.totalZone5Minutes += this._sumarMinutosZona(d.desglose, 'Z5');
      }

      const claveSemana = this._claveSemana(fecha);
      semanas[claveSemana] = (semanas[claveSemana] || 0) + 1;
      const claveMes = key.slice(0, 7);
      if (!meses[claveMes]) meses[claveMes] = { n: 0, km: 0 };
      meses[claveMes].n++;
      meses[claveMes].km += dist;

      // Todo lo que sigue SOLO sale de sesiones con el GPS de la app.
      if (d.hasGPS === true) {
        r.gpsSessions++;

        const v = parseFloat(d.velocidadMaxKmh);
        if (isFinite(v) && v <= 40 && v > r.maxSpeedGPS) r.maxSpeedGPS = v;

        if (d.recordsPorTramo) {
          Object.entries(this.TRAMOS_INSIGNIA).forEach(([km, cfg]) => {
            const ms = d.recordsPorTramo[km]?.durationMs;
            if (typeof ms === 'number' && isFinite(ms) && ms >= cfg.minMs && (r[cfg.campo] === null || ms < r[cfg.campo])) {
              r[cfg.campo] = ms;
            }
          });
          // Récords personales (solo tramos medidos por el GPS real).
          Object.entries(d.recordsPorTramo).forEach(([rk, tramo]) => {
            if (!tramo || !isFinite(tramo.durationMs)) return;
            if (!personalRecords[rk] || tramo.durationMs < personalRecords[rk].durationMs) {
              personalRecords[rk] = {
                durationMs: tramo.durationMs,
                distanciaKm: parseFloat(rk),
                fecha: fecha.toISOString(),
                gps: true,
                entryId: d._docId
              };
            }
          });
        }

        this._ventanasHorariasDeEntrada(d).forEach(campo => { r[campo]++; });
      }
    });

    r.personalRecords = personalRecords;

    const dias = Object.keys(porDia).sort(); // 'YYYY-MM-DD' ordena bien como texto
    if (dias.length === 0) return r;

    // Racha de días consecutivos que termina en el día más reciente con
    // sesión, y racha MÁXIMA histórica (la más larga en cualquier tramo).
    let streakDays = 1, bestStreakDays = 1, rachaActual = 1;
    for (let i = 1; i < dias.length; i++) {
      const actual = new Date(dias[i] + 'T00:00:00');
      const anterior = new Date(dias[i - 1] + 'T00:00:00');
      const diffDias = Math.round((actual - anterior) / 86400000);
      if (diffDias === 1) rachaActual++;
      else rachaActual = 1;
      if (rachaActual > bestStreakDays) bestStreakDays = rachaActual;
    }
    for (let i = dias.length - 1; i > 0; i--) {
      const actual = new Date(dias[i] + 'T00:00:00');
      const anterior = new Date(dias[i - 1] + 'T00:00:00');
      const diffDias = Math.round((actual - anterior) / 86400000);
      if (diffDias === 1) streakDays++;
      else break;
    }

    // Racha de meses consecutivos con al menos una sesión, terminando en el
    // mes de la sesión más reciente.
    const listaMeses = [...new Set(dias.map(k => k.slice(0, 7)))].sort();
    let monthStreak = 1;
    for (let i = listaMeses.length - 1; i > 0; i--) {
      const [ya, ma] = listaMeses[i].split('-').map(Number);
      const [yp, mp] = listaMeses[i - 1].split('-').map(Number);
      if ((ya - yp) * 12 + (ma - mp) === 1) monthStreak++;
      else break;
    }

    // Sábado + domingo del mismo fin de semana.
    const setDias = new Set(dias);
    r.weekendWarrior = dias.some(k => {
      const d = new Date(k + 'T00:00:00');
      if (d.getDay() !== 6) return false;
      const dom = new Date(d);
      dom.setDate(dom.getDate() + 1);
      return setDias.has(dom.toLocaleDateString('en-CA'));
    });

    r.maxSessionsInWeek = Math.max(0, ...Object.values(semanas));
    Object.values(meses).forEach(m => {
      if (m.n > r.maxSessionsInMonth) r.maxSessionsInMonth = m.n;
      if (m.km > r.maxDistanceInMonth) r.maxDistanceInMonth = m.km;
    });

    r.streakDays = streakDays;
    r.bestStreakDays = bestStreakDays;
    r.monthStreak = monthStreak;
    r.lastSessionDate = dias[dias.length - 1];
    r.lastMonth = listaMeses[listaMeses.length - 1];
    return r;
  },

  // 'badges' = lista de ids de insignias del usuario. Hace falta para el
  // nivel 11; sin ella (o incompleta) el nivel máximo que se devuelve es 10.
  getLevelByDistance(distance, badges = null) {
    let level = 1;
    for (let i = this.LEVELS_KM.length - 1; i >= 0; i--) {
      const tramo = this.LEVELS_KM[i];
      if (distance >= tramo.kmNeeded) {
        if (tramo.requiereTodasInsignias && !this.tieneTodasLasInsignias(badges)) continue;
        level = tramo.level;
        break;
      }
    }
    return level;
  },

  getProgressToNextLevel(distance, badges = null) {
    const currentLevel = this.getLevelByDistance(distance, badges);
    const nextLevel = this.LEVELS_KM.find(l => l.level === currentLevel + 1);
    if (!nextLevel) return 100;
    const currentLevelMinKM = this.LEVELS_KM.find(l => l.level === currentLevel).kmNeeded;
    const kmInLevel = distance - currentLevelMinKM;
    const kmNeeded = nextLevel.kmNeeded - currentLevelMinKM;
    const pct = Math.floor((kmInLevel / kmNeeded) * 100);
    // Con los km del nivel 11 pero faltando insignias, la barra no marca 100%.
    return Math.min(nextLevel.requiereTodasInsignias ? 99 : 100, pct);
  },

  async getCurrentShoe(uid) {
    const data = await this.getData(uid);
    return data.currentShoe;
  },

  async getShoeHistory(uid) {
    const data = await this.getData(uid);
    return data.shoeHistory || [];
  },

  async setCurrentShoe(uid, newShoeName) {
    if (!uid || !newShoeName) return false;
    try {
      const data = await this.getData(uid);
      const oldShoe = data.currentShoe || { name: 'Zapatilla actual', km: 0 };
      if (oldShoe.name !== 'Zapatilla actual' || oldShoe.km > 0) {
        const historyEntry = {
          name: oldShoe.name,
          km: oldShoe.km,
          changedAt: new Date().toISOString()
        };
        const newHistory = [...(data.shoeHistory || []), historyEntry];
        if (newHistory.length > 15) newHistory.shift();
        await firebaseServices.db.collection('gamification').doc(uid).update({
          currentShoe: { name: newShoeName, km: 0 },
          shoeHistory: newHistory
        });
      } else {
        await firebaseServices.db.collection('gamification').doc(uid).update({
          currentShoe: { name: newShoeName, km: 0 }
        });
      }
      return true;
    } catch (error) {
      console.error('Error al cambiar zapatilla:', error);
      return false;
    }
  },

  async addKilometersToShoe(uid, km) {
    if (!uid || !km || km <= 0) return;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      await docRef.update({ 'currentShoe.km': firebaseServices.FieldValue.increment(km) });
    } catch (error) {
      console.error('Error sumando km a la zapatilla:', error);
    }
  },

  async removeKilometersFromShoe(uid, km) {
    if (!uid || !km || km <= 0) return;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      await docRef.update({ 'currentShoe.km': firebaseServices.FieldValue.increment(-km) });
    } catch (error) {
      console.error('Error restando km a la zapatilla:', error);
    }
  },

  // 🔥 v5.20: reparación puntual (UNA sola vez por usuario, no cada vez
  // que se abre Perfil) de TODOS los derivados de gamificación afectados
  // por el mismo patrón de fondo que ya arregló totalDistance en v5.17/
  // v5.18 -- no solo la distancia/nivel, también racha, "madrugador",
  // récords, contadores por tipo de sesión y, sobre todo, los km de la
  // zapatilla actual (ver _recalcularDerivadosDesdeHistorial más abajo,
  // que ya calcula currentShoeKm desde la verdad). Se llama desde
  // Profile.cargarPerfil la primera vez que el usuario entra a la pestaña
  // Perfil tras esta actualización; queda marcada con
  // 'historialRecalculadoV519' en el documento para no repetirse en
  // adelante -- el mismo patrón que ya usa _limpiarRecordsNoGPS con los
  // récords antiguos sin GPS. No toca badges ni totalXP: las insignias ya
  // concedidas no se retiran en retroactivo, solo se ponen al día los
  // contadores que las alimentan para que las que aún falten se evalúen
  // bien de ahora en adelante.
  async repararTodoDesdeHistorialSiHaceFalta(uid, gamificationDataYaLeida = null) {
    if (!uid) return null;
    try {
      const data = gamificationDataYaLeida || await this.getData(uid);
      if (!data || data.historialRecalculadoV519) return null;

      // Cuenta nueva o sin ninguna sesión aún: no hay nada real que
      // recalcular, se marca directamente sin gastar una consulta a
      // globalFeed (evita 2 lecturas/escrituras extra en cada alta nueva).
      if (!data.totalSessions && !data.totalDistance) {
        await firebaseServices.db.collection('gamification').doc(uid).set({ historialRecalculadoV519: true }, { merge: true });
        return null;
      }

      const derivados = await this._recalcularDerivadosDesdeHistorial(uid);
      if (!derivados) return null;

      const { currentShoeKm, ...derivadosSinZapatilla } = derivados;
      const newLevel = this.getLevelByDistance(derivados.totalDistance, data.badges);

      await firebaseServices.db.collection('gamification').doc(uid).set({
        ...derivadosSinZapatilla,
        level: newLevel,
        historialRecalculadoV519: true,
        lastUpdate: firebaseServices.Timestamp.now()
      }, { merge: true });
      await this._fijarKmZapatilla(uid, currentShoeKm);

      return true;
    } catch (error) {
      console.error('Error en la reparación automática de gamificación desde el historial:', error);
      return null;
    }
  },

  // 🔥 v5.19: fija el km de la zapatilla actual al valor YA recalculado
  // desde la verdad (derivadosVerdad.currentShoeKm, ver
  // _recalcularDerivadosDesdeHistorial), en vez de sumarle/restarle nada
  // de forma incremental -- así currentShoe.km queda tan a prueba de
  // desviaciones como ya lo está totalDistance desde v5.17/5.18. Se usa
  // tanto al marcar como al desmarcar cualquier sesión; si el recálculo no
  // está disponible (sin conexión, etc.) quien llama cae al
  // incremento/decremento de siempre en vez de dejar la zapatilla sin
  // actualizar.
  async _fijarKmZapatilla(uid, km) {
    if (!uid || !isFinite(km)) return;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      await docRef.update({ 'currentShoe.km': Math.max(0, km) });
    } catch (error) {
      console.error('Error fijando km real de la zapatilla:', error);
    }
  },

  async updateAfterSession(uid, sesion, metricas) {
    if (uid !== AppState.currentUserId && !AppState.isAdmin) {
      console.warn('Intento de modificar gamificación ajena bloqueado');
      return null;
    }
    if (!uid) return null;
    try {
      const docRef = firebaseServices.db.collection('gamification').doc(uid);
      const xpGained = this.calculateXP(sesion, metricas);
      const distance = (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) ? metricas.distanciaTotal : 0;

      // 🔥 v5.18: FIX DE RAÍZ (el usuario reportó que el problema seguía
      // pasando incluso después del recálculo-al-desmarcar de v5.17): ESTA
      // función (updateAfterSession, la que corre al MARCAR, no al
      // desmarcar) seguía calculando totalZone4Minutes/totalZone5Minutes/
      // totalDistance/totalSessions/countLongRuns/countIntervals/
      // countStrengthRuns por SUMA INCREMENTAL sobre oldData -- v5.17 solo
      // blindaba estos campos cuando se DESMARCABA una sesión, así que
      // cualquier desviación que ya existiera en el documento (de antes de
      // v5.17, o de cualquier otro desajuste puntual) se seguía arrastrando
      // sin corregirse mientras el usuario solo marcara sesiones nuevas --
      // que es lo que pasa el 99% de las veces. Para que la insignia sea
      // SIEMPRE fiel a los datos reales (no solo tras un desmarcado
      // manual), estos 7 campos se recalculan aquí TAMBIÉN, desde cero,
      // ANTES de la transacción -- reutilizando la misma función de la
      // verdad (_recalcularDerivadosDesdeHistorial) que ya usa
      // removeSession(). Como la sesión que se acaba de completar YA se
      // escribió en globalFeed antes de llamar a esta función (ver
      // calendar.js: `globalFeed.add(entry)` sucede ANTES de
      // `Gamification.updateAfterSession`), este recálculo YA incluye la
      // sesión actual -- no hay que sumarle nada más encima, ni aquí ni
      // dentro de la transacción.
      // Coste: una consulta a `globalFeed` por sesión marcada (antes solo
      // se pagaba al desmarcar) -- el usuario prefirió esto, explícitamente,
      // a arriesgarse a que la insignia vuelva a desviarse.
      const derivadosVerdad = await this._recalcularDerivadosDesdeHistorial(uid);

      // BUG CORREGIDO (encontrado simulando marcados concurrentes): antes
      // se leía oldData, se calculaba todo en memoria y se escribía al
      // final por separado -- si el mismo usuario marcaba dos sesiones
      // completadas casi a la vez (dos pestañas, o muy rápido seguido), la
      // segunda escritura podía pisar a la primera con datos ya
      // desactualizados, perdiendo en silencio el XP/racha/insignias de la
      // primera. runTransaction es la herramienta de Firestore para esto
      // exacto: si el documento cambia entre la lectura y la escritura,
      // repite automáticamente todo este cálculo con los datos frescos, en
      // vez de dejar que la segunda escritura gane a ciegas. Los efectos
      // secundarios (sumar km a la zapatilla, mostrar el toast de subida
      // de nivel, el confeti) se hacen DESPUÉS de que la transacción
      // termine, nunca dentro: si se reintentase, esas acciones se
      // repetirían tantas veces como reintentos hubiera.
      const resultado = await firebaseServices.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const oldData = doc.exists ? doc.data() : this.getDefaultData();
        // Fecha que cuenta para la racha/día de la semana/mes: el día REAL
        // de la sesión (metricas.fechaSesionReal, el día del plan), no el
        // instante en que se pulsa el check. Antes se usaba siempre 'new
        // Date()' (el momento de marcar): si te ponías al día marcando hoy
        // una sesión de hace unos días, esa sesión contaba como si hubiera
        // sido "hoy" para la racha, rompiéndola o inflándola según el
        // orden en que se fueran marcando. Con fecha real, un hueco sigue
        // siendo un hueco y una racha real sigue contando como tal, se
        // marque en el orden que se marque.
        const now = (metricas && metricas.fechaSesionReal instanceof Date && !isNaN(metricas.fechaSesionReal))
          ? metricas.fechaSesionReal
          : new Date();
        const todayStr = now.toLocaleDateString('en-CA');

        let streak = (oldData.streakDays || 0);
        // lastSessionDateFinal es lo que se acaba guardando en Firestore.
        // Por defecto avanza a la fecha de esta sesión, salvo en el caso de
        // marcado fuera de orden (ver más abajo), donde se mantiene la
        // fecha más reciente que ya había.
        let lastSessionDateFinal = todayStr;
        if (oldData.lastSessionDate) {
          // FIX ZONA HORARIA: comparamos DÍAS DE CALENDARIO, no milisegundos
          // en crudo. Antes 'new Date(oldData.lastSessionDate)' -- una
          // cadena tipo "2026-08-14" sin hora -- se interpretaba como
          // medianoche UTC, mientras que 'now' es hora LOCAL (España,
          // UTC+1/+2). Ese desfase de 1-2h podía hacer que entrenar de
          // madrugada saliera con diffDays=0 en vez de 1 (la racha no
          // subía aunque fuera un día consecutivo real), o que se rompiera
          // una racha real por el motivo contrario. Forzamos medianoche
          // LOCAL en ambas fechas con 'T00:00:00', igual que ya hace
          // _recalcularDerivadosDesdeHistorial más abajo en este mismo
          // archivo, para que el cálculo sea consistente en los dos sitios.
          const lastDateLocal = new Date(oldData.lastSessionDate + 'T00:00:00');
          const todayLocal = new Date(todayStr + 'T00:00:00');
          const diffDays = Math.round((todayLocal - lastDateLocal) / 86400000);

          if (diffDays === 1) {
            streak++;
          } else if (diffDays > 1) {
            streak = 1;
          } else if (diffDays < 0) {
            // Se está marcando una sesión con fecha ANTERIOR a la última ya
            // registrada (p.ej. te pones al día marcando sesiones atrasadas
            // fuera de orden). Con un solo dato (lastSessionDate) no se
            // puede recalcular la racha de forma fiable aquí -- se deja tal
            // cual estaba y, sobre todo, NO se retrocede lastSessionDate:
            // si se sobreescribiera con esta fecha más antigua, el próximo
            // check en tiempo real compararía contra la fecha equivocada y
            // podría romper o inflar la racha sin motivo real. Si el orden
            // de marcado deja la racha desajustada del todo, se corrige
            // sola en cuanto se desmarque cualquier sesión (ver
            // _recalcularDerivadosDesdeHistorial, que sí mira el historial
            // completo).
            lastSessionDateFinal = oldData.lastSessionDate;
          }
          // diffDays === 0: segunda sesión el mismo día real -- la racha no cambia.
        } else {
          streak = 1;
        }

        let bestPace = oldData.bestPace;
        if (metricas && metricas.bestPace && metricas.bestPace > 0)
          if (!bestPace || metricas.bestPace < bestPace) bestPace = metricas.bestPace;

        let maxSpeed = oldData.maxSpeed || 0;
        if (metricas && metricas.maxSpeed && metricas.maxSpeed > maxSpeed) maxSpeed = metricas.maxSpeed;

        let totalZ4 = derivadosVerdad ? derivadosVerdad.totalZone4Minutes : (oldData.totalZone4Minutes || 0) + (metricas?.zone4Minutes || 0);
        let totalZ5 = derivadosVerdad ? derivadosVerdad.totalZone5Minutes : (oldData.totalZone5Minutes || 0) + (metricas?.zone5Minutes || 0);

        let countLong = derivadosVerdad ? derivadosVerdad.countLongRuns : (oldData.countLongRuns || 0);
        let countIntervals = derivadosVerdad ? derivadosVerdad.countIntervals : (oldData.countIntervals || 0);
        let countStrength = derivadosVerdad ? derivadosVerdad.countStrengthRuns : (oldData.countStrengthRuns || 0);
        // Si por lo que sea el recálculo de la verdad falló (sin conexión,
        // etc.), derivadosVerdad es null y se cae al incremento de siempre
        // sobre oldData -- mejor eso que dejar la sesión sin marcar del
        // todo. Si SÍ hubo recálculo, estos contadores por tipo ya vienen
        // hechos desde el historial real (incluida esta sesión), así que
        // no hace falta seguir sumando 1 aquí encima.
        if (!derivadosVerdad) {
          if (sesion.tipo === 'largo') countLong++;
          else if (sesion.tipo === 'series') countIntervals++;
          else if (sesion.tipo === 'strength') countStrength++;
        }

        const dayOfWeek = now.getDay();
        // 🔥 v5.21: el día de la semana sale del día REAL de la sesión
        // (fechaSesionReal, el día del plan). La HORA ya NO se mira aquí: las
        // insignias de hora del día (Carrera nocturna, Madrugador...) solo
        // valen para sesiones GPS y usan el inicio/fin reales de la carrera
        // (ver _ventanasHorariasDeEntrada), no la hora a la que se pulsa
        // "marcar" -- que en una sesión manual no dice nada de cuándo se
        // corrió. Con el historial recalculado (derivadosVerdad) los
        // contadores vienen ya hechos; este incremento solo es la red de
        // seguridad si ese recálculo falla.
        let daysOfWeek = oldData.daysOfWeek || { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
        daysOfWeek[dayOfWeek] = true;
        const ventanasSesion = this._ventanasHorariasDeEntrada({
          hasGPS: !!(metricas && metricas.gpsUsed),
          inicioRealTs: metricas?.inicioRealTs,
          finRealTs: metricas?.finRealTs,
          gpsDistanceKm: distance
        });
        const contadoresHora = {};
        this.VENTANAS_HORARIAS.forEach(v => {
          contadoresHora[v.campo] = derivadosVerdad
            ? derivadosVerdad[v.campo]
            : (oldData[v.campo] || 0) + (ventanasSesion.includes(v.campo) ? 1 : 0);
        });
        let earlyBirdCount = contadoresHora.earlyBirdCount;

        let maxDistSingle = Math.max(oldData.maxDistanceSingle || 0, distance);

        // Racha máxima histórica (distinta de 'streak', que es la racha
        // ACTUAL y puede bajar a 1 si se rompe). Esta solo puede subir o
        // quedarse igual, nunca bajar al marcar una sesión nueva.
        let bestStreakDays = Math.max(oldData.bestStreakDays || 0, streak);

        // Récord personal por distancia estándar (ver RECORD_DISTANCES):
        // ANTES esta sesión (con o sin GPS) podía "inventar" un récord
        // extrapolando el tiempo por ritmo medio. Eso ya no se hace aquí:
        // para que un récord sea válido, la sesión tiene que haberse hecho
        // de verdad con el motor de GPS de la app, y el tiempo tiene que ser
        // el medido tramo a tramo por el propio GPS (ver
        // actualizarRecordsPorTramos / gps-tracker.js), nunca una estimación.
        // Este marcado manual (con o sin corrección de km/tiempo a mano) NO
        // toca personalRecords en absoluto -- solo actualiza XP, distancia,
        // nivel, insignias y racha, que sí tiene sentido contar aunque no
        // haya GPS.
        let personalRecords = { ...(oldData.personalRecords || {}) };

        const currentMonth = now.toISOString().slice(0, 7);
        let monthStreak = oldData.monthStreak || 0;
        let lastMonth = oldData.lastMonth;
        if (!lastMonth) {
          monthStreak = 1;
          lastMonth = currentMonth;
        } else if (lastMonth !== currentMonth) {
          const lastMonthDate = new Date(lastMonth + '-01');
          const currentMonthDate = new Date(currentMonth + '-01');
          const diffMonths = (currentMonthDate.getFullYear() - lastMonthDate.getFullYear()) * 12 + (currentMonthDate.getMonth() - lastMonthDate.getMonth());
          if (diffMonths === 1) monthStreak++;
          else if (diffMonths > 1) monthStreak = 1;
          lastMonth = currentMonth;
        }

        let firstGPS = oldData.firstGPSEver;
        if (!firstGPS && metricas?.gpsUsed) firstGPS = true;

        const newTotalDistance = derivadosVerdad ? derivadosVerdad.totalDistance : (oldData.totalDistance || 0) + distance;
        let newLevel = this.getLevelByDistance(newTotalDistance, oldData.badges);
        const newTotalSessions = derivadosVerdad ? derivadosVerdad.totalSessions : (oldData.totalSessions || 0) + 1;

        // 🔥 v5.21: con el historial real recalculado (derivadosVerdad), TODO
        // lo que alimenta las insignias sale de ahí -- también la racha, los
        // días de la semana y la distancia máxima, que antes se sumaban
        // incrementalmente sobre el documento. Una sola fuente de la verdad.
        // Si el recálculo falló (derivadosVerdad = null), se evalúa con lo
        // que ya había en el documento (las insignias nuevas no avanzan en
        // ese caso, pero tampoco se concede nada de más).
        const sv = derivadosVerdad;
        if (sv) {
          streak = sv.streakDays;
          bestStreakDays = sv.bestStreakDays;
          if (sv.lastSessionDate) lastSessionDateFinal = sv.lastSessionDate;
          daysOfWeek = sv.daysOfWeek;
          maxDistSingle = sv.maxDistanceSingle;
          monthStreak = sv.monthStreak;
          if (sv.lastMonth) lastMonth = sv.lastMonth;
        }
        const countTempo = sv ? sv.countTempoRuns : (oldData.countTempoRuns || 0) + (sesion.tipo === 'tempo' ? 1 : 0);

        const stats = {
          totalSessions: newTotalSessions,
          totalDistance: newTotalDistance,
          maxDistanceSingle: maxDistSingle,
          bestStreakDays: Math.max(bestStreakDays, streak),
          monthStreak: monthStreak,
          totalZone2Minutes: sv ? sv.totalZone2Minutes : (oldData.totalZone2Minutes || 0),
          totalZone4Minutes: totalZ4,
          totalZone5Minutes: totalZ5,
          countLongRuns: countLong,
          countIntervals: countIntervals,
          countStrengthRuns: countStrength,
          countTempoRuns: countTempo,
          daysOfWeek: daysOfWeek,
          weekendWarrior: sv ? sv.weekendWarrior : (oldData.weekendWarrior === true),
          maxSessionsInWeek: sv ? sv.maxSessionsInWeek : (oldData.maxSessionsInWeek || 0),
          maxSessionsInMonth: sv ? sv.maxSessionsInMonth : (oldData.maxSessionsInMonth || 0),
          maxDistanceInMonth: sv ? sv.maxDistanceInMonth : (oldData.maxDistanceInMonth || 0),
          nightRunCount: contadoresHora.nightRunCount,
          earlyBirdCount: earlyBirdCount,
          middayRunCount: contadoresHora.middayRunCount,
          eveningRunCount: contadoresHora.eveningRunCount,
          bestKmMs: sv ? sv.bestKmMs : (oldData.bestKmMs ?? null),
          best5kMs: sv ? sv.best5kMs : (oldData.best5kMs ?? null),
          best10kMs: sv ? sv.best10kMs : (oldData.best10kMs ?? null),
          maxSpeedGPS: sv ? sv.maxSpeedGPS : (oldData.maxSpeedGPS || 0),
          gpsSessions: sv ? sv.gpsSessions : (oldData.gpsSessions || 0) + (metricas?.gpsUsed ? 1 : 0),
          firstGPS: firstGPS === true
        };

        const currentBadges = oldData.badges || [];
        const newBadges = [...currentBadges];
        const cumplidas = this._insigniasCumplidas(stats);

        // El XP de cada insignia (badge.xp) se suma SOLO en el momento en
        // que esa insignia se desbloquea por primera vez -- de ahora en
        // adelante. Antes se definía el valor (y se prometía en el
        // tooltip: "+25 XP") pero nunca llegaba a sumarse a totalXP. No se
        // aplica en retroactivo a insignias ya conseguidas: eso cambiaría
        // de golpe el XP de todo el mundo, así que se deja tal cual quedó.
        let bonusXPInsignias = 0;
        for (const badgeId of cumplidas) {
          if (!currentBadges.includes(badgeId)) {
            newBadges.push(badgeId);
            bonusXPInsignias += this.BADGES[badgeId]?.xp || 0;
          }
        }

        // 🔥 v5.22: el nivel 11 depende de las insignias, así que se recalcula
        // ya con las recién concedidas (la última insignia puede ser la que lo abre).
        newLevel = this.getLevelByDistance(newTotalDistance, newBadges);

        const newTotalXP = (oldData.totalXP || 0) + xpGained + bonusXPInsignias;

        const newData = {
          totalXP: newTotalXP,
          level: newLevel,
          badges: newBadges,
          totalDistance: newTotalDistance,
          totalSessions: newTotalSessions,
          lastSessionDate: lastSessionDateFinal,
          lastUpdate: firebaseServices.Timestamp.now(),
          streakDays: streak,
          bestPace: bestPace,
          maxSpeed: maxSpeed,
          totalZone4Minutes: totalZ4,
          totalZone5Minutes: totalZ5,
          countLongRuns: countLong,
          countIntervals: countIntervals,
          countStrengthRuns: countStrength,
          daysOfWeek: daysOfWeek,
          earlyBirdCount: earlyBirdCount,
          maxDistanceSingle: maxDistSingle,
          monthStreak: monthStreak,
          lastMonth: lastMonth,
          firstGPSEver: firstGPS,
          bestStreakDays: bestStreakDays,
          personalRecords: personalRecords,
          // 🔥 v5.21: contadores de las insignias nuevas (misma fuente que
          // las condiciones, para que el documento y las insignias cuenten
          // la misma historia)
          totalZone2Minutes: stats.totalZone2Minutes,
          countTempoRuns: stats.countTempoRuns,
          weekendWarrior: stats.weekendWarrior,
          maxSessionsInWeek: stats.maxSessionsInWeek,
          maxSessionsInMonth: stats.maxSessionsInMonth,
          maxDistanceInMonth: stats.maxDistanceInMonth,
          nightRunCount: stats.nightRunCount,
          middayRunCount: stats.middayRunCount,
          eveningRunCount: stats.eveningRunCount,
          bestKmMs: stats.bestKmMs,
          best5kMs: stats.best5kMs,
          best10kMs: stats.best10kMs,
          maxSpeedGPS: stats.maxSpeedGPS,
          gpsSessions: stats.gpsSessions
        };

        transaction.set(docRef, newData, { merge: true });
        return { newData, oldLevel: oldData.level, currentBadges };
      });

      const { newData, oldLevel, currentBadges } = resultado;

      // 🔥 v5.19: si el recálculo desde el historial funcionó, se fija el
      // km REAL de la zapatilla (inmune a desviaciones acumuladas), igual
      // que ya se hace con totalDistance más arriba. Si por lo que sea
      // falló (sin conexión, etc.), se cae al incremento de siempre para
      // no dejar la zapatilla sin actualizar.
      if (derivadosVerdad && isFinite(derivadosVerdad.currentShoeKm)) {
        await this._fijarKmZapatilla(uid, derivadosVerdad.currentShoeKm);
      } else {
        await this.addKilometersToShoe(uid, distance);
      }

      if (newData.level > oldLevel) {
        Utils.showToast(`🎉 ¡SUBES AL NIVEL ${newData.level}! (${newData.totalDistance.toFixed(1)} km)`, 'success', 4000);
        Utils.launchConfetti();
      }
      const gainedBadges = newData.badges.filter(b => !currentBadges.includes(b));
      // 🔥 v5.21: si se desbloquean muchas de golpe (la primera sesión tras
      // esta actualización evalúa las insignias nuevas contra todo el
      // historial), se avisa de las 3 primeras y un resumen del resto, en
      // vez de una cascada de avisos.
      gainedBadges.slice(0, 3).forEach(badgeId => {
        const badgeInfo = this.BADGES[badgeId];
        if (badgeInfo) Utils.showToast(`🏅 ¡Insignia desbloqueada: ${badgeInfo.name}!`, 'success', 4000);
      });
      if (gainedBadges.length > 3) {
        Utils.showToast(`🏅 ...y ${gainedBadges.length - 3} insignias más. Míralas en tu pasaporte.`, 'success', 4500);
      }

      // gainedBadges se devuelve (sin persistir como campo aparte) para que
      // quien llama pueda guardar, junto a la sesión/publicación del muro,
      // exactamente qué insignias concedió ESTA sesión. Así, si la sesión
      // se desmarca más tarde, Gamification.removeSession() puede revertir
      // solo esas insignias concretas (y su XP) en vez de no tocarlas.
      // 🔥 v5.15: también se devuelve `oldLevel` -- quien llama (p.ej.
      // calendar.js al completar una sesión) necesitaba saber si el nivel
      // cambió, y antes lo hacía con DOS lecturas extra a Firestore
      // (getData() antes y después de esta misma llamada) para comparar.
      // Ya lo sabíamos aquí dentro desde el principio (oldData.level, leído
      // por la propia transacción); con devolverlo, quien llama no necesita
      // volver a leer nada.
      return { ...newData, gainedBadges, oldLevel };
    } catch (error) {
      console.error('Error actualizando gamificación:', error);
      return null;
    }
  },

  // Reparación puntual para sesiones GPS ya guardadas ANTES de que
  // 'metricas' incluyera el campo gpsUsed (ver calendar.js): esas
  // sesiones sí llevaban GPS real (entry.hasGPS quedó bien guardado en
  // el muro) pero la insignia FIRST_GPS nunca llegó a evaluarse porque
  // metricas.gpsUsed nunca llegaba a Gamification.updateAfterSession.
  // Esta función NO recalcula XP/distancia/sesiones (eso ya se contó
  // correctamente en su momento): solo concede la insignia si detecta
  // que el usuario tiene al menos una sesión con GPS en el muro y aún
  // no la tiene.
  async repararBadgeGPS(uid) {
    if (!uid) return false;
    try {
      const data = await this.getData(uid);
      if (data.firstGPSEver || (data.badges || []).includes('FIRST_GPS')) return false;

      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .where('hasGPS', '==', true)
        .limit(1)
        .get();
      if (snap.empty) return false;

      const badges = [...(data.badges || []), 'FIRST_GPS'];
      await firebaseServices.db.collection('gamification').doc(uid).set({
        badges,
        firstGPSEver: true
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('No se pudo comprobar/reparar la insignia GPS:', e);
      return false;
    }
  },

  // badgesGanadas: insignias que ESTA sesión concreta concedió cuando se
  // marcó (guardadas en su momento en la entrada del muro, ver
  // calendar.js). Solo esas se revierten -- así, si otra sesión distinta
  // ya había ganado esa insignia antes, no se toca por error.
  // Racha de días, racha de meses, "madrugador", días de la semana
  // entrenados y "distancia máxima en una sola sesión" NO se pueden
  // arreglar simplemente restando cuando se desmarca/borra una sesión:
  // son máximos o rachas que dependen del HISTORIAL COMPLETO, no solo de
  // la sesión que se acaba de quitar. Por eso, en vez de tocar esos
  // campos a mano, se recalculan desde cero a partir de las sesiones que
  // de verdad quedan en globalFeed (ordenadas por fecha real de
  // 'timestamp', que es el mismo campo con el que se calcularon la
  // primera vez en updateAfterSession). Así, si borras la sesión que
  // puso el récord de distancia o que sostenía la racha, esos valores
  // vuelven a lo que le corresponde de verdad, no se quedan "pegados"
  // arriba para siempre.
  async _recalcularDerivadosDesdeHistorial(uid) {
    try {
      // 🔥 v5.19: los km de la zapatilla actual también se recalculan desde
      // la verdad: se suman las sesiones posteriores al 'changedAt' de la
      // última entrada de shoeHistory (si nunca se ha cambiado de zapatilla,
      // cuenta todo, igual que totalDistance).
      let shoeHistory = [];
      try {
        const gamDoc = await firebaseServices.db.collection('gamification').doc(uid).get();
        if (gamDoc.exists) shoeHistory = gamDoc.data().shoeHistory || [];
      } catch (e) {
        console.warn('No se pudo leer shoeHistory para recalcular km de zapatilla, se asume sin historial:', e);
      }
      const cutoffISO = shoeHistory.length ? shoeHistory[shoeHistory.length - 1].changedAt : null;
      const cutoffDate = cutoffISO ? new Date(cutoffISO) : null;

      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .get();
      if (snap.empty) return this._estadisticasVacias();

      const entradas = [];
      snap.forEach(doc => entradas.push(Object.assign({}, doc.data(), { _docId: doc.id })));
      // 🔥 v5.21: el cálculo vive ahora en una función pura
      // (_calcularEstadisticas) para poder comprobarlo sin Firestore; aquí
      // solo se leen los datos.
      return this._calcularEstadisticas(entradas, cutoffDate);
    } catch (e) {
      console.warn('No se pudieron recalcular racha/récords desde el historial:', e);
      return null; // null = "no tocar estos campos", mejor dejarlos como estaban que corromperlos
    }
  },

  async removeSession(uid, sesion, metricas, diaIndex, badgesGanadas = []) {
    if (uid !== AppState.currentUserId && !AppState.isAdmin) {
      console.warn('Intento de revertir gamificación ajena bloqueado');
      return null;
    }
    if (!uid) return null;
    try {
      const oldData = await this.getData(uid);
      const distanceRemoved = (metricas && metricas.distanciaTotal && isFinite(metricas.distanciaTotal)) ? metricas.distanciaTotal : 0;

      // Insignias a revertir: las que esta sesión concedió Y que el
      // usuario aún conserva (por si acaso ya no estuvieran, no se resta
      // su XP dos veces).
      const badgesActuales = oldData.badges || [];
      const aQuitar = (badgesGanadas || []).filter(b => badgesActuales.includes(b));
      const newBadges = badgesActuales.filter(b => !aQuitar.includes(b));
      const xpInsigniasRevertido = aQuitar.reduce((sum, b) => sum + (this.BADGES[b]?.xp || 0), 0);

      const xpSesion = this.calculateXP(sesion, metricas);
      const xpRemoved = xpSesion + xpInsigniasRevertido;

      const newTotalXP = Math.max(0, (oldData.totalXP || 0) - xpRemoved);
      const newTotalDistance = Math.max(0, (oldData.totalDistance || 0) - distanceRemoved);
      let newLevel = this.getLevelByDistance(newTotalDistance, newBadges);
      const newTotalSessions = Math.max(0, (oldData.totalSessions || 0) - 1);

      // Revertir también los contadores por tipo de sesión (igual que se
      // incrementan en updateAfterSession), para que insignias como
      // LONG_RUN_10 / INTERVALS_10 / STRENGTH_10 puedan volver a evaluarse
      // correctamente en la próxima sesión.
      let countLong = oldData.countLongRuns || 0;
      let countIntervals = oldData.countIntervals || 0;
      let countStrength = oldData.countStrengthRuns || 0;
      if (sesion?.tipo === 'largo') countLong = Math.max(0, countLong - 1);
      else if (sesion?.tipo === 'series') countIntervals = Math.max(0, countIntervals - 1);
      else if (sesion?.tipo === 'strength') countStrength = Math.max(0, countStrength - 1);

      // Restar también los minutos en Z4/Z5 que esta sesión concreta había
      // aportado (ver ZONE_4_60/ZONE_5_30 y metricas.zone4Minutes/
      // zone5Minutes en calendar.js), igual que ya se hace con las
      // distancias/contadores de arriba -- si no, desmarcar una sesión de
      // series intensa dejaría esos minutos "pegados" para siempre aunque
      // la sesión que los puso ya no exista.
      const totalZ4 = Math.max(0, (oldData.totalZone4Minutes || 0) - (metricas?.zone4Minutes || 0));
      const totalZ5 = Math.max(0, (oldData.totalZone5Minutes || 0) - (metricas?.zone5Minutes || 0));

      // 🔥 v5.19: el ajuste de la zapatilla se hace más abajo, DESPUÉS de
      // calcular 'derivados' (a partir del valor recalculado desde la
      // verdad, no de un decremento puntual) -- ver ese bloque para el
      // motivo. Solo si ese recálculo falla se usa aquí abajo el
      // decremento de siempre como red de seguridad.

      const newData = {
        totalXP: newTotalXP,
        level: newLevel,
        badges: newBadges,
        totalDistance: newTotalDistance,
        totalSessions: newTotalSessions,
        countLongRuns: countLong,
        countIntervals: countIntervals,
        countStrengthRuns: countStrength,
        totalZone4Minutes: totalZ4,
        totalZone5Minutes: totalZ5,
        lastUpdate: firebaseServices.Timestamp.now()
      };

      // Racha, "madrugador", días de la semana, racha de meses y
      // distancia máxima: se recalculan desde las sesiones que quedan de
      // verdad (ver _recalcularDerivadosDesdeHistorial). Si por lo que
      // sea la consulta falla, se deja tal cual estaban (null) en vez de
      // arriesgarse a dejarlos a medias.
      // _recalcularDerivadosDesdeHistorial ahora reconstruye
      // personalRecords SOLO a partir de sesiones que de verdad quedan en
      // globalFeed Y que se hicieron con GPS real (ver esa función): es
      // la fuente de la verdad completa, no hace falta "proteger" nada
      // aparte -- si la sesión que se está desmarcando tenía el récord de
      // alguna distancia, el recálculo ya lo sustituye por el siguiente
      // mejor tramo GPS real que quede (o lo quita del todo si no queda
      // ninguno).
      //
      // Reintento: esta llamada depende de una consulta a Firestore
      // (globalFeed) que puede fallar puntualmente por red -- si falla y
      // no se reintenta, la sesión se resta en XP/distancia/nivel pero la
      // racha y los récords se quedan "pegados" con el valor antiguo, sin
      // avisar. Se reintenta una vez antes de rendirse.
      let derivados = await this._recalcularDerivadosDesdeHistorial(uid);
      if (!derivados) {
        console.warn('Recálculo de racha/récords falló, reintentando...');
        derivados = await this._recalcularDerivadosDesdeHistorial(uid);
      }
      if (derivados) {
        // 🔥 v5.19: currentShoeKm viaja dentro de 'derivados' pero NO es un
        // campo de primer nivel del documento (vive en 'currentShoe.km',
        // un objeto anidado) -- se saca aparte para no escribirlo como
        // campo suelto 'currentShoeKm' por error, y se aplica con
        // _fijarKmZapatilla (que sí sabe escribir la ruta anidada
        // correcta), en vez del decremento de siempre.
        const { currentShoeKm, ...derivadosSinZapatilla } = derivados;
        Object.assign(newData, derivadosSinZapatilla);
        // 🔥 v5.21: totalDistance ya es el recalculado desde el historial;
        // el nivel se calcula con ESE valor (antes salía de la resta puntual
        // y podía no coincidir con los km guardados).
        if (isFinite(derivadosSinZapatilla.totalDistance)) {
          newLevel = this.getLevelByDistance(derivadosSinZapatilla.totalDistance, newBadges);
          newData.level = newLevel;
        }
        await this._fijarKmZapatilla(uid, currentShoeKm);
      } else {
        Utils.showToast('⚠️ La sesión se desmarcó, pero no se pudo recalcular tu racha/récords. Vuelve a intentarlo o revisa tu conexión.', 'warning', 5000);
        // Sin recálculo fiable disponible, se cae al decremento puntual de
        // siempre para que al menos la zapatilla no se quede sin tocar.
        await this.removeKilometersToShoeSafe(uid, distanceRemoved);
      }

      await firebaseServices.db.collection('gamification').doc(uid).set(newData, { merge: true });

      if (newLevel < oldData.level) {
        Utils.showToast(`📉 Bajas al nivel ${newLevel} (${newTotalDistance.toFixed(1)} km)`, 'info', 3000);
      }
      aQuitar.forEach(badgeId => {
        const badgeInfo = this.BADGES[badgeId];
        if (badgeInfo) Utils.showToast(`↩️ Insignia retirada: ${badgeInfo.name} (sesión desmarcada)`, 'info', 3500);
      });
      return newData;
    } catch (error) {
      console.error('Error revirtiendo gamificación:', error);
      return null;
    }
  },

  // Pequeño envoltorio a prueba de fallos: si removeKilometersFromShoe no
  // existiera por algún motivo, no debe tirar abajo toda la reversión de
  // la sesión (distancia/XP/insignias) por un error ajeno a eso.
  async removeKilometersToShoeSafe(uid, km) {
    try { await this.removeKilometersFromShoe(uid, km); }
    catch (e) { console.warn('No se pudo restar km a la zapatilla al desmarcar sesión:', e); }
  },

  async repairMyProfile() {
    const uid = AppState.currentUserId;
    if (!uid) return;
    Utils.showLoading();
    try {
      const defaultData = this.getDefaultData();
      await firebaseServices.db.collection('gamification').doc(uid).set(defaultData);
      Utils.showToast('✅ Pasaporte activado. Recargando...', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      Utils.showToast('Error: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }
};

window.Gamification = Gamification;
console.log('✅ gamification.js v5.21 - 50 insignias auditadas (ritmo/velocidad/hora solo con GPS), 11 niveles nuevos');