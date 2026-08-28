// ==================== calendar.js - VERSIÓN COMPLETA CORREGIDA ====================
// Versión: 2.63 - DISTRIBUCION_TIPOS: la cuota de la tirada larga pasa de
//                un 10% fijo (en todos los niveles y fases) a una cuota
//                que crece con el nivel y la fase (14-32% según el caso),
//                tomada sobre todo de rodaje. Con el 10% fijo, la
//                garantía de que la tirada larga sea la más larga (v2.62)
//                tenía que alargarla constantemente muy por encima de lo
//                planificado por la periodización -- hasta +51' en
//                semanas de maratón avanzado, y en 19 de 24 semanas de
//                ese mismo plan. Con la cuota nueva: maratón avanzado no
//                necesita alargarse en ninguna semana de las 24 (antes
//                19); en el resto de escenarios probados, cuando aún
//                hace falta alargar (sobre todo en semanas de descarga,
//                donde el suelo mínimo por sesión no baja igual de rápido
//                para todos los tipos) la diferencia es de pocos minutos,
//                no de decenas.
// Versión: 2.62 - Arreglada de raíz la lógica de la tirada larga (sustituye
//                al intento de la v2.61, que no llegaba a resolverlo):
//                1) Consolidados en UNO los tres puntos que antes recortaban
//                   tempo/series/rodaje por separado. Ahora, en vez de
//                   recortar, es la tirada larga la que se alarga para
//                   seguir siendo siempre la más larga -- y se crea la
//                   última en la semana, con su detalle/estructura/pasos
//                   generados ya con la duración final (no se parchea
//                   después, que es lo que dejaba textos desactualizados).
//                2) getMaximosPorTipo: para 2K, tempo y rodaje no tenían
//                   tope propio y podían salir más largos que el tope de
//                   la propia tirada larga (65-90' de tope real contra
//                   60' de la tirada larga) -- causa de fondo de tener que
//                   recortar algo sí o sí. Ahora los 4 tipos comparten
//                   techo para esa distancia.
//                3) crearSesionBasica/crearSesionAvanzadaSeries: el suelo
//                   mínimo de duración por nivel podía empujar la sesión
//                   por encima de su propio máximo (el suelo se aplicaba
//                   DESPUÉS del tope, sin volver a comprobarlo). Ahora el
//                   tope manda siempre, incluso tras aplicar el suelo.
//                4) crearSesionAvanzadaSeries (rotas/pirámide): las ramas
//                   que ajustaban la estructura al tiempo disponible solo
//                   lo intentaban UNA vez si sobraba o faltaba presupuesto,
//                   sin comprobar el resultado real -- podían acabar muy
//                   por encima o por debajo de lo que decía la cabecera de
//                   la sesión (bug real reportado: cabecera "32 min" con
//                   un desglose de texto que sumaba 55). Ahora ambas
//                   iteran contrastando el resultado real contra el
//                   presupuesto, y la duración final que ve el usuario se
//                   deriva SIEMPRE de la estructura real generada, nunca
//                   al revés. Probado con 480 combinaciones (5 distancias
//                   x 3 niveles x duraciones de plan): 0 semanas con la
//                   tirada larga por detrás de otra sesión, 0 desajustes
//                   reales entre cabecera y desglose de texto.
// Versión: 2.60 - Nueva función calcularFormaFisica (CTL/ATL/TSB, modelo
//                de Banister / Performance Management Chart) para la
//                tarjeta "Forma física" del Dashboard: a diferencia del
//                ACWR (riesgo inmediato de un pico de carga), esto dice
//                si la carga y el descanso de las últimas semanas están
//                construyendo forma física de verdad o no, con media
//                móvil EXPONENCIAL de 42/7 días sobre el mismo `tss` por
//                sesión que ya usa calcularCargaEntrenamiento. Ver
//                index.html para la tarjeta y la gráfica.
// Versión: 2.59 - Tres arreglos: 1) botones del modal "DATOS DE LA
//                SESIÓN" reordenados (CANCELAR izquierda, ACEPTAR
//                derecha, igual que el resto de modales de la app); 2)
//                limpiarMuroGlobal() ya no borra nada de globalFeed (esa
//                limpieza a 90 días le quitaba sin querer a
//                gamification.js el histórico que necesita para
//                recalcular racha/récords al desmarcar sesiones); 3) se
//                pasa metricas.fechaSesionReal a
//                Gamification.updateAfterSession, para que la racha se
//                calcule con el día real de la sesión y no con el
//                instante en que se pulsa el check.
// Versión: 2.56 - Selector de tipo del modal de datos de la sesión: en vez
//                de desplegar la lista dentro del propio modal (con
//                scroll), pulsar el título abre un popup pequeño y
//                centrado con las 4 opciones a la vez en cuadrícula, sin
//                scroll. Quitado también el texto "cambiar" del título.
// Versión: 2.55 - El selector de "cambiar tipo" del modal de datos de la
//                sesión ahora muestra siempre los 4 tipos que el
//                planificador es capaz de generar (Rodaje, Tempo, Series,
//                Tirada larga), no solo los que aparecían en el plan
//                actual del usuario.
// Versión: 2.54 - Modal de "datos de la sesión" (marcar como realizada sin
//                GPS): quitado el icono de lápiz junto al título, el modal
//                ya no crece hacia la zona de la cámara frontal al desplegar
//                la lista de tipos (overlay anclado arriba + scroll interno),
//                recuadro de kilómetros más compacto y con el texto centrado
//                (igual que minutos y segundos), y la caja de ritmo/zona se
//                pinta ahora con el color real de la zona detectada.
// Versión: 2.53 - Al marcar como realizada una sesión SIN GPS, se pide
//                confirmar/corregir km y tiempo reales en un modal (con
//                ritmo y zona calculados al vuelo) en vez de usar siempre
//                la estimación del plan, que podía no coincidir con el
//                ritmo objetivo mostrado en la descripción de la sesión.
// Versión: 2.52 - Semana de descarga real en la generación de planes: el
//                patrón ondulatorio de 4 semanas (ONDULACION_PATRONES)
//                hacía que la semana de "descarga" bajase el volumen un
//                15% pero subiera la intensidad un 15%, cancelando casi
//                por completo la caída de TSS. Ahora la semana 4 de cada
//                bloque baja volumen e intensidad juntos (multiplicador
//                de TSS ≈0.48 frente a ≈1.2 en la semana de pico).
// Versión: 2.51 - Gestión científica de la fatiga: aviso antes de marcar una
//                sesión nueva si el % de recuperación (mismo cálculo que la
//                tarjeta "Carga y recuperación" del dashboard) es < 100%
// ============================================================================

const PlanGenerator = {
  ENTRENAMIENTOS: window.ENTRENAMIENTOS_DB || {},

  FASES: {
    BASE: { nombre: 'Base', color: '#8AA0B0', intensidad: 0.7, volumenBase: 1.0 },
    CONSTRUCCION: { nombre: 'Construcción', color: '#9BB5A0', intensidad: 0.85, volumenBase: 1.15 },
    ESPECIFICA: { nombre: 'Específica', color: '#C9A78B', intensidad: 0.95, volumenBase: 1.2 },
    PICO: { nombre: 'Pico', color: '#C99BA5', intensidad: 1.0, volumenBase: 1.1 },
    TAPER: { nombre: 'Taper', color: '#9AA5A5', intensidad: 0.6, volumenBase: 0.7 }
  },

  // Patrón 3:1 real: 3 semanas de progresión + 1 semana de descarga.
  // IMPORTANTE: intensidad y volumen SIEMPRE se mueven en la misma
  // dirección dentro de un mismo índice del patrón. Antes, el índice de
  // la semana de descarga (2) bajaba el volumen un 15% pero SUBÍA la
  // intensidad un 15% -- y como el TSS = duración × intensidad, ambos
  // efectos se cancelaban casi por completo (0.85 × 1.15 ≈ 0.98): la
  // semana de "descarga" no bajaba realmente la carga entrenada. Ahora
  // el índice 2 (semana 4 de cada bloque, ver getOndulatoryFactor) es
  // una descarga real: volumen y factor de intensidad caen juntos, con
  // un multiplicador de TSS de ~0.6 × 0.8 ≈ 0.48 frente al ~1.2 de la
  // semana de pico -- una caída de carga en torno al 55-60%, en línea
  // con la periodización real.
  ONDULACION_PATRONES: [
    { intensidad: 1.00, volumen: 1.05 },  // semana 2 del bloque: construcción
    { intensidad: 1.05, volumen: 1.15 },  // semana 3 del bloque: pico de carga
    { intensidad: 0.80, volumen: 0.60 },  // semana 4 del bloque: DESCARGA REAL
    { intensidad: 0.95, volumen: 0.90 }   // semana 1 del bloque: arranque suave
  ],

  // El reparto de "largo" pasa de un 10% fijo (en TODOS los niveles y
  // fases) a una cuota que crece con el nivel y con la fase. Con el 10%
  // fijo, la tirada larga (un solo día) salía casi siempre más corta que
  // un día de rodaje/tempo/series (que también se concentran en pocos
  // días, pero con más porcentaje) -- así que la garantía de que la
  // tirada larga sea la sesión más larga de la semana (ver
  // _calcularDuracionLargoFinal) tenía que alargarla constantemente muy
  // por encima de lo planificado (hasta +51' en semanas de maratón
  // avanzado) para cumplirse. El extra se resta sobre todo de rodaje, que
  // al repartirse entre 2-4 días pierde poco por día por cada punto que
  // cede; series/tempo, que sí son días únicos, casi no se tocan porque
  // ahí está el trabajo de calidad que de verdad marca la fase.
  DISTRIBUCION_TIPOS: {
    principiante: {
      base: { rodaje: 0.72, tempo: 0.1, series: 0.0, largo: 0.18 },
      construccion: { rodaje: 0.62, tempo: 0.15, series: 0.05, largo: 0.18 },
      especifica: { rodaje: 0.52, tempo: 0.2, series: 0.1, largo: 0.18 },
      pico: { rodaje: 0.42, tempo: 0.25, series: 0.15, largo: 0.18 },
      taper: { rodaje: 0.76, tempo: 0.1, series: 0.0, largo: 0.14 }
    },
    intermedio: {
      base: { rodaje: 0.61, tempo: 0.15, series: 0.05, largo: 0.19 },
      construccion: { rodaje: 0.49, tempo: 0.2, series: 0.1, largo: 0.21 },
      especifica: { rodaje: 0.37, tempo: 0.2, series: 0.2, largo: 0.23 },
      pico: { rodaje: 0.25, tempo: 0.25, series: 0.25, largo: 0.25 },
      taper: { rodaje: 0.65, tempo: 0.15, series: 0.05, largo: 0.15 }
    },
    avanzado: {
      base: { rodaje: 0.51, tempo: 0.2, series: 0.1, largo: 0.19 },
      construccion: { rodaje: 0.39, tempo: 0.2, series: 0.2, largo: 0.21 },
      especifica: { rodaje: 0.24, tempo: 0.19, series: 0.29, largo: 0.28 },
      pico: { rodaje: 0.13, tempo: 0.22, series: 0.33, largo: 0.32 },
      taper: { rodaje: 0.56, tempo: 0.2, series: 0.1, largo: 0.14 }
    }
  },

  PROGRESION_NIVEL: {
    principiante: { intermedio: 8, avanzado: 16 },
    intermedio: { avanzado: 12 }
  },

  DURACION_FUERZA: 40,
  DESCRIPCIONES_FUERZA: [
    { nombre: "Fuerza funcional", ejercicios: "sentadillas, zancadas, plancha, puente de glúteos, trabajo de core", objetivo: "Mejorar estabilidad y potencia en carrera." },
    { nombre: "Fuerza explosiva", ejercicios: "saltos al cajón, skipping, multisaltos, sentadillas con salto", objetivo: "Aumentar la reactividad y la capacidad de aceleración." },
    { nombre: "Fuerza de resistencia", ejercicios: "circuito de 8 ejercicios: sentadillas, zancadas, burpees, plancha, escaladores, etc.", objetivo: "Mejorar la capacidad de mantener la fuerza durante largos periodos." },
    { nombre: "Fuerza preventiva", ejercicios: "ejercicios de propiocepción, trabajo de tobillos, rotadores externos de cadera, fortalecimiento de isquiotibiales", objetivo: "Reducir riesgo de lesiones típicas del corredor." },
    { nombre: "Fuerza en el tren inferior", ejercicios: "peso muerto, sentadilla búlgara, máquina de prensa, curl femoral", objetivo: "Potenciar la musculatura principal del running." }
  ],

  ultimaSesionPorTipo: {},
  // Bolsa de barajado: guarda, por cada combinación modalidad+distancia+
  // nivel+tipo, qué sesiones de esa lista quedan por usar en el ciclo
  // actual. Se reparten todas antes de repetir ninguna (en vez del
  // sistema anterior, que solo evitaba repetir la sesión inmediatamente
  // anterior y podía volver a sacar la misma cada pocas semanas).
  bolsaPorTipo: {},

  _redondearDistancia(distanciaMetros) {
    if (distanciaMetros < 50) return 50;
    const redondeado = Math.round(distanciaMetros / 50) * 50;
    return Math.min(redondeado, 2000);
  },

  _redondearTiempo(segundos) {
    if (segundos < 10) return 10;
    let redondeado = Math.round(segundos / 5) * 5;
    if (segundos > 60) redondeado = Math.round(segundos / 15) * 15;
    return redondeado;
  },

  _redondearDuracionPartePrincipal(segundos) {
    return Math.round(segundos / 15) * 15;
  },

  _ritmoToSeg(ritmoStr) {
    const [min, seg] = ritmoStr.split(':').map(Number);
    return min * 60 + (seg || 0);
  },

  obtenerRitmoParaZona(zonaNombre) {
    const zonas = AppState.lastZones;
    if (!zonas || zonas.length === 0) {
      console.warn('Zonas no disponibles, usando ritmo base como fallback');
      const ritmoBase = AppState.lastRitmoBase || 5;
      return Utils.formatR(ritmoBase);
    }
    const zona = zonas.find(z => z[0] === zonaNombre);
    if (!zona) {
      console.warn(`Zona ${zonaNombre} no encontrada, usando ritmo base`);
      const ritmoBase = AppState.lastRitmoBase || 5;
      return Utils.formatR(ritmoBase);
    }
    const factorPace = zona[4];
    const ritmoBase = AppState.lastRitmoBase;
    if (!ritmoBase) return '--:--';
    const pace = ritmoBase * factorPace;
    return Utils.formatR(pace);
  },

  // Dado un ritmo real (min/km), busca la zona cuyo ritmo objetivo
  // (ritmoBase × factorPace, el mismo cálculo que obtenerRitmoParaZona) es
  // más cercano. Se usa en el modal de "datos reales" al marcar una
  // sesión sin GPS, para decirle al usuario en qué zona ha entrenado de
  // verdad según los km/tiempo que acaba de introducir.
  _detectarZonaPorRitmo(paceMinPerKm) {
    const zonas = AppState.lastZones;
    const ritmoBase = AppState.lastRitmoBase;
    if (!zonas || !zonas.length || !ritmoBase || !paceMinPerKm || !isFinite(paceMinPerKm)) return null;
    let mejor = null, mejorDiff = Infinity;
    zonas.forEach(z => {
      const paceZona = ritmoBase * z[4];
      const diff = Math.abs(paceZona - paceMinPerKm);
      if (diff < mejorDiff) { mejorDiff = diff; mejor = z; }
    });
    return mejor; // [nombre, etiqueta, fcMinPct, fcMaxPct, factorPace, cssClass, htmlDesc]
  },

  // Estima el ritmo de la PARTE PRINCIPAL de la sesión a partir del tiempo
  // y la distancia TOTALES que el usuario ha introducido (calentamiento +
  // parte principal + enfriamiento), en vez de usar sin más el ritmo medio
  // de toda la sesión para detectar la zona. El calentamiento y el
  // enfriamiento se corren siempre suaves (Z1, ver _pasosBasicos), así que
  // diluían la media general hacia zonas más bajas: una sesión de tempo
  // hecha perfectamente en Z3 pero con 10' de calentamiento + 5' de
  // enfriamiento a Z1 podía salir calculada como Z1 de media, aunque la
  // parte principal fuera Z3 real.
  //
  // Se asume que calentamiento/enfriamiento se corrieron al ritmo Z1 del
  // usuario; se escala su duración PLANIFICADA a la duración TOTAL real
  // introducida (proporcionalmente, por si el usuario tardó más o menos
  // que lo previsto) para estimar cuánto tiempo/distancia se llevó cada
  // tramo, y se obtiene el ritmo real de la parte principal por
  // diferencia. Devuelve solo el ritmo (para detectar zona); el ritmo
  // medio real de toda la sesión (el que se muestra y se guarda como
  // "ritmo medio"/bestPace) no se toca, sigue siendo el real.
  // Si la sesión no tiene calentamiento/enfriamiento definidos, o el
  // resultado no es coherente (tiempo/distancia negativos), cae de vuelta
  // al ritmo medio de toda la sesión, igual que antes.
  _estimarRitmoParteEfectiva(sesion, totalMin, totalKm) {
    const desglose = this._desglosarSesion(sesion, totalMin, totalKm);
    const pp = desglose.partePrincipal;
    if (pp && pp.km > 0) return pp.min / pp.km;
    return (totalKm > 0) ? totalMin / totalKm : NaN;
  },

  // Igual que _estimarRitmoParteEfectiva, pero para cuando lo que hace
  // falta es la ZONA (no el ritmo) del tramo principal -- usado en el
  // preview en vivo del modal "datos reales" (abrirModalDatosReales). NO
  // hace lo mismo que "sacar el ritmo y volver a detectar la zona por ese
  // ritmo": en series/cuestas, _desglosarSesion ya deja la zona del tramo
  // principal tomada directamente del PLAN (no re-derivada por ritmo, que
  // con desnivel de por medio no es fiable -- ver _desglosarSesion), así
  // que aquí se respeta esa zona tal cual, buscándola por nombre en la
  // tabla de zonas del usuario. Si se re-detectara por ritmo (como hacía
  // antes este modal, usando _estimarRitmoParteEfectiva +
  // _detectarZonaPorRitmo) se deshacía el arreglo: el ritmo del tramo de
  // esfuerzo en series se calcula con un reparto de km proporcional al
  // TIEMPO, no al ritmo real del esfuerzo, así que NO es un ritmo válido
  // para volver a buscar zona por él.
  _detectarZonaParteEfectiva(sesion, totalMin, totalKm) {
    const desglose = this._desglosarSesion(sesion, totalMin, totalKm);
    const pp = desglose.partePrincipal;
    if (pp && pp.zona) {
      const zonaDirecta = (AppState.lastZones || []).find(z => z[0] === pp.zona);
      if (zonaDirecta) return zonaDirecta;
    }
    const pace = (pp && pp.km > 0) ? pp.min / pp.km : ((totalKm > 0) ? totalMin / totalKm : NaN);
    return this._detectarZonaPorRitmo(pace);
  },

  // Descompone una sesión (con distancia y tiempo TOTALES ya conocidos,
  // reales o planificados) en sus tramos -- calentamiento, parte principal
  // (esfuerzo), recuperación y enfriamiento -- devolviendo minutos, km y
  // zona de cada uno. Es la base tanto de la detección de zona real al
  // marcar una sesión como del desglose que se guarda en cada entrada del
  // muro/perfil/dashboard para que las tarjetas puedan mostrarlo (ver
  // _marcarSesionRealizadaInterno). El calentamiento y el enfriamiento se
  // asumen siempre a ritmo Z1 (igual que en el resto de la app), escalando
  // proporcionalmente su duración PLANIFICADA a la duración TOTAL real (por
  // si se tardó más o menos de lo previsto); lo que queda tras descontarlos
  // es la parte principal real.
  // Para sesiones de series -- tanto las avanzadas (pirámide/rotas/
  // fartlek/cuestas, ver crearSesionAvanzadaSeries) como las "básicas" de
  // nivel principiante en fase BASE (ver crearSesionBasica) -- esa parte
  // principal NO es un tramo uniforme: son repeticiones rápidas con
  // recuperaciones (más lentas o incluso paradas) intercaladas. Si no se
  // separan, la media de todo el tramo se diluye y una sesión corrida de
  // verdad en Z4-Z5 puede acabar registrada como Z1. Por eso, cuando la
  // sesión tiene detalle.segundosEsfuerzo (tiempo planificado corrido al
  // ritmo objetivo, sin recuperaciones -- calculado exacto cuando hay
  // repeticiones/distancia estructuradas, o estimado por proporciones
  // típicas cuando no las hay), se separa también la recuperación
  // (asumida a ritmo Z2, con la misma técnica de escalado proporcional) y
  // la zona final se detecta sobre el esfuerzo real, no sobre la media.
  // Si la sesión no tiene calentamiento/enfriamiento definidos, o algún
  // resultado no sale coherente (tiempo/distancia negativos, o un tramo
  // "más lento" de lo que debería), se cae de vuelta a un tramo único con
  // el ritmo medio real -- igual que se hacía antes de tener este desglose.
  _desglosarSesion(sesion, totalMin, totalKm) {
    const zonaMedia = (totalKm > 0) ? this._detectarZonaPorRitmo(totalMin / totalKm) : null;
    const soloPartePrincipal = {
      calentamiento: null,
      partePrincipal: { min: totalMin, km: totalKm, zona: zonaMedia ? zonaMedia[0] : (sesion?.detalle?.zona || '') },
      recuperacion: null,
      enfriamiento: null
    };

    const det = sesion?.detalle;
    const duracionPlan = sesion?.duracion || 0;
    if (!det || duracionPlan <= 0 || (!det.calentamiento && !det.enfriamiento) || totalMin <= 0 || totalKm <= 0) {
      return soloPartePrincipal;
    }

    const proporcion = totalMin / duracionPlan;
    const calMin = (det.calentamiento || 0) * proporcion;
    const enfMin = (det.enfriamiento || 0) * proporcion;
    const mainMin = totalMin - calMin - enfMin;
    if (mainMin <= 0) return soloPartePrincipal;

    const ritmoZ1MinPerKm = this._ritmoToSeg(this.obtenerRitmoParaZona('Z1')) / 60;
    if (!ritmoZ1MinPerKm || !isFinite(ritmoZ1MinPerKm)) return soloPartePrincipal;

    const calKm = calMin / ritmoZ1MinPerKm;
    const enfKm = enfMin / ritmoZ1MinPerKm;
    const mainKm = totalKm - calKm - enfKm;
    if (mainKm <= 0) return soloPartePrincipal;

    // Comprobación de coherencia física: si calentamiento/enfriamiento son
    // de verdad los tramos SUAVES, la parte principal (lo que queda) nunca
    // puede salir con un ritmo más LENTO que la media de TODA la sesión --
    // sería como decir que se corrió más despacio en el esfuerzo "fuerte"
    // que en el trote de calentamiento. Si esto ocurre, significa que el
    // ritmo Z1 asumido aquí (obtenerRitmoParaZona('Z1')) es MÁS RÁPIDO que
    // el ritmo medio real introducido -- p.ej. porque el plan de esta
    // sesión se generó con una distancia estimada desactualizada, o porque
    // la calibración de zonas del usuario no encaja con el ritmo real de
    // esta sesión concreta. En ese caso no se muestra un desglose
    // engañoso (parte principal "peor" que el calentamiento): se trata
    // toda la sesión como un único tramo, con su ritmo/zona medios reales.
    // Comprobación de coherencia física (paceMain vs paceMedia): tiene
    // sentido para sesiones "normales" (rodaje/tempo/largo), donde
    // calentamiento/parte principal/enfriamiento se corren todos en
    // llano/terreno similar. Para sesiones de SERIES con datos de
    // segundosEsfuerzo (ver más abajo) NO se aplica: en cuestas, por
    // ejemplo, subir a tope YA da de por sí un ritmo (min/km) peor que
    // trotar en llano -- y si además se mezclan recuperaciones lentas,
    // la media de toda "la parte principal" puede salir perfectamente
    // más lenta que el calentamiento sin que eso signifique nada raro.
    // Aplicar aquí ese filtro haría descartar el desglose precisamente en
    // los casos (series con desnivel) donde más falta hace.
    const paceMain = mainMin / mainKm;
    const paceMedia = totalMin / totalKm;
    const esSerieConDatos = sesion?.tipo === 'series' && det.segundosEsfuerzo > 0 && duracionPlan > 0;
    if (!esSerieConDatos && paceMain > paceMedia * 1.001) return soloPartePrincipal;

    const zonaPrincipal = this._detectarZonaPorRitmo(paceMain);
    const resultado = {
      calentamiento: calMin > 0 ? { min: calMin, km: calKm, zona: 'Z1' } : null,
      partePrincipal: { min: mainMin, km: mainKm, zona: zonaPrincipal ? zonaPrincipal[0] : (sesion?.detalle?.zona || '') },
      recuperacion: null,
      enfriamiento: enfMin > 0 ? { min: enfMin, km: enfKm, zona: 'Z1' } : null
    };

    // Series/fartlek/cuestas/pirámide: la "parte principal" NO es un
    // tramo uniforme -- son repeticiones rápidas (Z4-Z5) intercaladas con
    // recuperaciones (Z2), y hasta ahora se trataba como un único bloque
    // con el ritmo MEDIO de todo eso junto. Como las recuperaciones son
    // varios minutos a ritmo lento (a veces incluso paradas), esa media
    // se diluía muy por debajo del esfuerzo real -- una sesión de series
    // en Z4-Z5 de verdad podía acabar registrada como Z1/Z2 de media.
    // sesion.detalle.segundosEsfuerzo es el tiempo PLANIFICADO que de
    // verdad se corre al ritmo objetivo, sin contar las recuperaciones
    // (ver crearSesionAvanzadaSeries/crearSesionBasica).
    if (esSerieConDatos) {
      const plannedMainSec = (det.partePrincipal || 0) * 60;
      const plannedRecSec = plannedMainSec - det.segundosEsfuerzo;
      if (plannedMainSec > 0 && plannedRecSec > 0) {
        // Tiempo: se escala la duración PLANIFICADA de la recuperación a
        // la duración REAL de la parte principal (misma técnica que ya
        // se usa para calentamiento/enfriamiento), por si se tardó más o
        // menos de lo previsto.
        const proporcionMain = mainMin / (plannedMainSec / 60);
        const recMin = (plannedRecSec / 60) * proporcionMain;
        if (recMin > 0 && recMin < mainMin) {
          const esfuerzoMin = mainMin - recMin;
          // Distancia: NO se intenta "adivinar" cuánta distancia
          // corresponde a cada tramo por ritmo asumido (en cuestas, con
          // desnivel de por medio, el ritmo no es un indicador fiable y
          // puede dar restas absurdas o negativas) -- se reparte la
          // distancia real de la parte principal proporcionalmente al
          // TIEMPO de cada tramo, que es un dato mucho más robusto.
          const recKm = mainKm * (recMin / mainMin);
          const esfuerzoKm = mainKm - recKm;
          // Zona: tampoco se detecta por ritmo -- por el mismo motivo
          // (desnivel/ritmo no comparable a tablas en llano) -- sino que
          // se toma directamente la zona PLANIFICADA para las
          // repeticiones de esta sesión (det.zona, p.ej. "Z4-Z5" ->
          // se usa la más exigente, Z5), confiando en que si el usuario
          // marca la sesión como hecha es porque completó las
          // repeticiones tal y como estaban planteadas.
          const zonaPlanEsfuerzo = (det.zona || 'Z4-Z5').split('-').pop().trim();
          resultado.partePrincipal = { min: esfuerzoMin, km: esfuerzoKm, zona: zonaPlanEsfuerzo || 'Z4' };
          resultado.recuperacion = { min: recMin, km: recKm, zona: 'Z2' };
        }
      }
    }

    return resultado;
  },

  // Modal que pide los km y el tiempo REALES de una sesión SIN GPS antes
  // de marcarla como hecha. El ritmo se calcula solo y se compara con las
  // zonas del usuario para mostrar en qué zona ha entrenado de verdad.
  // Antes se usaba siempre la estimación del plan (distanciaEstimada +
  // duracion), que podía no coincidir con lo que el usuario realmente
  // hizo -- de ahí sesiones donde la descripción decía "Z2, ritmo 5'44""
  // pero el ritmo medio registrado salía muy distinto (8' y pico): ese
  // ritmo salía de la ESTIMACIÓN del plan, no de la sesión real. Ahora el
  // usuario confirma o corrige los datos reales, y esos son los que se
  // guardan. También permite corregir el TIPO de sesión (pulsando sobre
  // el título) si lo que se hizo de verdad fue distinto a lo planificado
  // (p.ej. tocaba series y se hizo un rodaje suave); eso determina qué
  // sensación/nombre se guarda luego (la zona real se calcula del ritmo,
  // no depende del tipo). Devuelve {km, ms, tipoCorregido} o null si se
  // cancela; tipoCorregido es null si no se ha tocado el tipo.
  abrirModalDatosReales(sesion) {
    return new Promise((resolve) => {
      document.getElementById('datosRealesModal')?.remove();
      document.getElementById('datosRealesOverlay')?.remove();

      const distanciaDefecto = sesion?.detalle?.distanciaEstimada || 0;
      const duracionDefecto = sesion?.duracion || 0; // minutos, tal cual venía planificada

      const overlay = document.createElement('div');
      overlay.id = 'datosRealesOverlay';
      overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(5px);
        z-index:100050; display:flex; align-items:flex-start; justify-content:center;
        overflow-y:auto; box-sizing:border-box;
        padding:max(24px, env(safe-area-inset-top) + 16px) 16px 24px;
        opacity:0; transition:opacity 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.id = 'datosRealesModal';
      modal.style.cssText = `
        background:var(--bg-card); border:1px solid var(--border-color);
        border-radius:20px; max-width:380px; width:90%; padding:20px;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center;
        max-height:90vh; overflow-y:auto; box-sizing:border-box;
        opacity:0; transition:opacity 0.2s ease;
      `;

      const infoTipoOriginal = this._infoTipo(sesion?.tipo);
      const nombreCabecera = sesion?.detalle?.nombre || infoTipoOriginal.label;
      const opcionesTipo = this._tiposDisponiblesEnPlan();

      modal.innerHTML = `
        <h3 style="margin:0 0 6px 0; color:var(--accent-yellow);">📝 DATOS DE LA SESIÓN</h3>
        <p style="margin:0 0 14px 0; font-size:12px; color:var(--text-secondary);">Confirma o corrige lo que has hecho de verdad. Si has entrenado distinto a lo planificado, actualízalo aquí.</p>
        <div id="datosRealesTipoBox" style="cursor:pointer; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:12px; padding:10px 12px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span id="datosRealesTipoIcono" style="font-size:16px;">${infoTipoOriginal.icono}</span>
          <strong id="datosRealesTipoTexto" style="font-size:14px; color:var(--text-primary);">${Utils.escapeHTML(nombreCabecera)}</strong>
        </div>
        <p id="datosRealesTipoNota" style="display:none; margin:0 0 14px 0; font-size:11px; color:var(--text-secondary);">Se guardará como <strong id="datosRealesTipoNotaTexto"></strong> en vez de lo planificado.</p>
        <div style="text-align:left; margin-bottom:12px; max-width:200px; margin-left:auto; margin-right:auto;">
          <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">📏 Kilómetros</label>
          <input type="number" id="datosRealesKm" inputmode="decimal" step="0.01" min="0" value="${distanciaDefecto ? distanciaDefecto.toFixed(2) : ''}" style="width:100%; padding:8px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
        </div>
        <div style="display:flex; gap:10px; margin-bottom:14px;">
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">⏱️ Minutos</label>
            <input type="number" id="datosRealesMin" inputmode="numeric" min="0" value="${Math.floor(duracionDefecto)}" style="width:100%; padding:8px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
          </div>
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:var(--text-secondary); margin-bottom:4px; text-align:center;">Segundos</label>
            <input type="number" id="datosRealesSeg" inputmode="numeric" min="0" max="59" value="0" style="width:100%; padding:8px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); font-size:16px; text-align:center; box-sizing:border-box;">
          </div>
        </div>
        <div id="datosRealesZonaBox" style="background:var(--bg-primary); border:1px solid var(--border-color); border-left:4px solid transparent; border-radius:12px; padding:12px; margin-bottom:18px; transition:border-color .2s ease;">
          <div style="font-size:12px; color:var(--text-secondary); margin-bottom:2px;">Ritmo medio</div>
          <div id="datosRealesRitmo" style="font-size:22px; font-weight:bold; color:var(--gold);">--:--</div>
          <div id="datosRealesZona" style="font-size:12px; color:var(--text-secondary); margin-top:4px;">&nbsp;</div>
        </div>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="datosRealesCancel" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); padding:10px 24px; border-radius:14px; cursor:pointer;">CANCELAR</button>
          <button id="datosRealesConfirm" style="background:var(--accent-blue); border:none; color:var(--bg-primary); padding:10px 24px; border-radius:14px; cursor:pointer; font-weight:bold;">ACEPTAR</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.opacity = '1'; });

      const kmInput = document.getElementById('datosRealesKm');
      const minInput = document.getElementById('datosRealesMin');
      const segInput = document.getElementById('datosRealesSeg');
      const ritmoEl = document.getElementById('datosRealesRitmo');
      const zonaEl = document.getElementById('datosRealesZona');
      const zonaBoxEl = document.getElementById('datosRealesZonaBox');

      // Selector de tipo: permite decir "hice otra cosa distinta a lo
      // planificado" (p.ej. la sesión era de series pero al final salió a
      // rodar suave). null mientras no se toque = se mantiene el tipo
      // planificado, igual que hasta ahora.
      let tipoSeleccionado = null;
      const tipoBox = document.getElementById('datosRealesTipoBox');
      const tipoIconoEl = document.getElementById('datosRealesTipoIcono');
      const tipoTextoEl = document.getElementById('datosRealesTipoTexto');
      const tipoNotaEl = document.getElementById('datosRealesTipoNota');
      const tipoNotaTextoEl = document.getElementById('datosRealesTipoNotaTexto');

      // Popup independiente (por encima del modal principal) con TODAS las
      // opciones de tipo a la vez, en cuadrícula, sin scroll -- antes la
      // lista se desplegaba dentro del propio modal y, al ser ya 4
      // opciones, necesitaba scroll interno para verlas todas.
      const abrirSelectorTipo = () => {
        document.getElementById('datosRealesTipoPopupOverlay')?.remove();
        const popupOverlay = document.createElement('div');
        popupOverlay.id = 'datosRealesTipoPopupOverlay';
        popupOverlay.style.cssText = `
          position:fixed; top:0; left:0; width:100%; height:100%;
          background:rgba(0,0,0,0.55); z-index:100060; display:flex;
          align-items:center; justify-content:center; padding:20px; box-sizing:border-box;
          opacity:0; transition:opacity 0.2s ease;
        `;
        const popup = document.createElement('div');
        popup.style.cssText = `
          background:var(--bg-card); border:1px solid var(--border-color);
          border-radius:16px; padding:16px; max-width:300px; width:100%;
          box-shadow:0 10px 30px rgba(0,0,0,0.4);
          opacity:0; transition:opacity 0.2s ease;
        `;
        popup.innerHTML = `
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; text-align:center;">¿Qué tipo de sesión hiciste?</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${opcionesTipo.map(o => `
              <button type="button" class="datos-reales-tipo-opcion" data-tipo="${o.tipo}" style="background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); padding:16px 12px; border-radius:12px; cursor:pointer; font-size:13px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <span style="font-size:20px;">${o.icono}</span>
                <span>${o.label}</span>
              </button>
            `).join('')}
          </div>
        `;
        popupOverlay.appendChild(popup);
        document.body.appendChild(popupOverlay);
        requestAnimationFrame(() => { popupOverlay.style.opacity = '1'; popup.style.opacity = '1'; });
        popupOverlay.onclick = (e) => { if (e.target === popupOverlay) popupOverlay.remove(); };
        popup.querySelectorAll('.datos-reales-tipo-opcion').forEach(btn => {
          btn.addEventListener('click', () => {
            const nuevoTipo = btn.getAttribute('data-tipo');
            const info = this._infoTipo(nuevoTipo);
            tipoIconoEl.textContent = info.icono;
            tipoTextoEl.textContent = info.label;
            popupOverlay.remove();
            if (nuevoTipo === sesion?.tipo) {
              tipoSeleccionado = null;
              tipoNotaEl.style.display = 'none';
            } else {
              tipoSeleccionado = nuevoTipo;
              tipoNotaTextoEl.textContent = info.label;
              tipoNotaEl.style.display = 'block';
            }
          });
        });
      };
      tipoBox.addEventListener('click', abrirSelectorTipo);

      const recalcular = () => {
        const km = parseFloat(kmInput.value) || 0;
        const min = parseFloat(minInput.value) || 0;
        const seg = parseFloat(segInput.value) || 0;
        const totalMin = min + seg / 60;
        if (km > 0 && totalMin > 0) {
          const paceMinPerKm = totalMin / km;
          ritmoEl.textContent = `${Utils.formatR(paceMinPerKm)} /km`;
          // La ZONA se detecta con la zona real del tramo principal, no
          // con el ritmo medio de toda la sesión -- ver
          // _detectarZonaParteEfectiva (en series/cuestas es la zona
          // PLANIFICADA, no una re-detección por ritmo, que con desnivel
          // de por medio no es fiable). El "ritmo medio" de arriba sigue
          // mostrando el real, sin tocar.
          const zona = this._detectarZonaParteEfectiva(sesion, totalMin, km);
          if (zona) {
            zonaEl.innerHTML = `Zona de trabajo: <strong>${Utils.escapeHTML(zona[0])}</strong> · ${Utils.escapeHTML(zona[1])}`;
            // zona[5] es la clase css de la zona ("z1".."z6"); se traduce
            // al número para usar la misma variable --zone-N que ya pinta
            // el resto de la app (pastillas de zona, gráfico de predicción...).
            const numZona = (zona[5] || '').replace('z', '');
            zonaBoxEl.style.borderLeftColor = numZona ? `var(--zone-${numZona})` : 'transparent';
          } else {
            zonaEl.innerHTML = '&nbsp;';
            zonaBoxEl.style.borderLeftColor = 'transparent';
          }
        } else {
          ritmoEl.textContent = '--:--';
          zonaEl.innerHTML = '&nbsp;';
          zonaBoxEl.style.borderLeftColor = 'transparent';
        }
      };
      [kmInput, minInput, segInput].forEach(inp => inp.addEventListener('input', recalcular));
      recalcular();
      // Antes se enfocaba y seleccionaba el campo de kilómetros nada más
      // abrir el modal -- eso hacía saltar el teclado del móvil de
      // inmediato, tapando media pantalla, aunque el usuario solo quisiera
      // revisar/confirmar los datos sin tocar nada. Ahora el modal se abre
      // sin ningún campo enfocado: el teclado solo aparece si el usuario
      // toca expresamente un campo para corregirlo.

      const cerrar = (valor) => { document.getElementById('datosRealesTipoPopupOverlay')?.remove(); overlay.remove(); resolve(valor); };

      document.getElementById('datosRealesConfirm').onclick = () => {
        const km = parseFloat(kmInput.value);
        const min = parseFloat(minInput.value) || 0;
        const seg = parseFloat(segInput.value) || 0;
        const ms = (min * 60 + seg) * 1000;
        if (!km || km <= 0 || ms <= 0) {
          Utils.showToast('Introduce kilómetros y tiempo válidos', 'error');
          return;
        }
        cerrar({ km, ms, tipoCorregido: tipoSeleccionado });
      };
      document.getElementById('datosRealesCancel').onclick = () => cerrar(null);
      overlay.onclick = (e) => { if (e.target === overlay) cerrar(null); };
    });
  },

  _calcularCalentamientoEnfriamiento(duracion) {
    let calentamiento = Math.round(duracion * 0.15);
    let enfriamiento = Math.round(duracion * 0.1);
    calentamiento = Math.max(10, calentamiento);
    enfriamiento = Math.max(5, enfriamiento);
    let partePrincipal = duracion - calentamiento - enfriamiento;
    if (partePrincipal < 5) {
      calentamiento = Math.floor(duracion * 0.4);
      enfriamiento = Math.floor(duracion * 0.2);
      partePrincipal = duracion - calentamiento - enfriamiento;
    }
    return { calentamiento, enfriamiento, partePrincipal };
  },

  _pasosBasicos(calentamiento, partePrincipal, enfriamiento, accionPrincipal, porquePrincipal) {
    return [
      { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' de trote suave (Z1) + ejercicios de movilidad`, porque: 'Preparar músculos, articulaciones y sistema cardiovascular.' },
      { icono: '💪', titulo: 'PARTE PRINCIPAL', accion: accionPrincipal, porque: porquePrincipal },
      { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' de trote suave + estiramientos suaves`, porque: 'Reducir frecuencia cardíaca, eliminar lactato y acelerar recuperación.' }
    ];
  },

  // AÑADIDO factorIntensidad como parámetro real. ANTES esta función
  // llamaba a calcularMetricasSesion pasando { ..., factorIntensidad: 1.0 }
  // dentro del objeto de sesión -- pero calcularMetricasSesion(sesion,
  // factorIntensidad = 1.0) lee el factor de intensidad como SEGUNDO
  // argumento posicional, no como propiedad del objeto. Como nadie pasaba
  // nunca ese segundo argumento, el TSS y la distancia estimada de TODAS
  // las sesiones generadas se calculaban siempre con factorIntensidad=1.0,
  // sin importar el valor real de esa semana (onda de periodización,
  // ajuste por ACWR o por feedback del usuario). El parámetro viajaba
  // correctamente desde generarCalendarioEntreno -> crearSesionDesdeMatriz
  // -> crearSesionBasica/crearSesionAvanzadaSeries, pero se perdía justo
  // aquí, en el último paso antes de calcular las métricas.
  _buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados, metricasExtra = {}, factorIntensidad = 1.0) {
    const { calentamiento, partePrincipal, enfriamiento, ritmoObjetivo, fcObjetivo, duracion, zonaPrincipal, sensacion, objetivo, porque, nombre, descripcion, estructura } = datosBasicos;
    const detalle = {
      nombre: Utils.escapeHTML(nombre),
      descripcion: Utils.escapeHTML(descripcion),
      estructura: Utils.escapeHTML(estructura),
      sensacion: Utils.escapeHTML(sensacion),
      zona: zonaPrincipal,
      duracion,
      ritmoObjetivo,
      fcObjetivo,
      calentamiento,
      partePrincipal,
      enfriamiento,
      objetivo: Utils.escapeHTML(objetivo),
      porque: Utils.escapeHTML(porque),
      pasosDetallados,
      ...metricasExtra
    };
    const metricas = this.calcularMetricasSesion({ tipo, duracion, detalle }, factorIntensidad);
    detalle.distanciaEstimada = metricas.distanciaTotal;
    detalle.tssEstimada = metricas.tssTotal;
    return { tipo, duracion, detalle };
  },

  obtenerObjetivoTexto(tipo, fase) {
    const objetivos = {
      rodaje: {
        BASE: 'Construir base aeróbica',
        CONSTRUCCION: 'Mantener volumen con calidad',
        ESPECIFICA: 'Preparar para ritmos de competición',
        PICO: 'Mantener forma sin fatiga',
        TAPER: 'Recuperación activa'
      },
      tempo: {
        BASE: 'Introducir ritmos sostenidos',
        CONSTRUCCION: 'Mejorar umbral de lactato',
        ESPECIFICA: 'Simular ritmos de competición',
        PICO: 'Ajustar ritmos objetivo',
        TAPER: 'Mantener agilidad'
      },
      series: {
        BASE: 'Desarrollar velocidad básica',
        CONSTRUCCION: 'Aumentar tolerancia al lactato',
        ESPECIFICA: 'Estimular VO2max',
        PICO: 'Afinar velocidad específica',
        TAPER: 'Mantener explosividad'
      },
      largo: {
        BASE: 'Aumentar capacidad aeróbica',
        CONSTRUCCION: 'Mejorar resistencia específica',
        ESPECIFICA: 'Simular condiciones de carrera',
        PICO: 'Mantener confianza',
        TAPER: 'Cargar glucógeno'
      }
    };
    return objetivos[tipo]?.[fase] || `Sesión de ${tipo}`;
  },

  obtenerPorque(tipo, fase) {
    const porqueMap = {
      rodaje: {
        BASE: 'Construir la base aeróbica, fundamental para soportar volúmenes mayores.',
        CONSTRUCCION: 'Mantener el volumen mientras se introduce calidad.',
        ESPECIFICA: 'Preparar el cuerpo para los ritmos de competición.',
        PICO: 'Mantener la forma sin generar fatiga adicional.',
        TAPER: 'Activar la circulación y mantener la frescura muscular.'
      },
      tempo: {
        BASE: 'Introducir el cuerpo a ritmos sostenidos por encima del aeróbico.',
        CONSTRUCCION: 'Elevar el umbral de lactato para poder mantener ritmos más rápidos.',
        ESPECIFICA: 'Simular los ritmos de carrera y acostumbrar al cuerpo a la fatiga.',
        PICO: 'Ajustar el ritmo objetivo y ganar confianza.',
        TAPER: 'Mantener la agilidad sin acumular ácido láctico.'
      },
      series: {
        BASE: 'Desarrollar velocidad básica y eficiencia neuromuscular.',
        CONSTRUCCION: 'Aumentar la tolerancia al lactato y la capacidad de eliminar desechos.',
        ESPECIFICA: 'Estimular el VO2máx y mejorar la potencia aeróbica.',
        PICO: 'Afinar la velocidad específica para la distancia objetivo.',
        TAPER: 'Mantener la explosividad sin fatiga.'
      },
      largo: {
        BASE: 'Aumentar la capacidad aeróbica y la resistencia general.',
        CONSTRUCCION: 'Mejorar la resistencia específica para la distancia objetivo.',
        ESPECIFICA: 'Simular las condiciones de carrera (ritmo, nutrición, hidratación).',
        PICO: 'Mantener la confianza y la resistencia sin llegar al agotamiento.',
        TAPER: 'Cargar los depósitos de glucógeno y mantener la motivación.'
      }
    };
    return porqueMap[tipo]?.[fase] || 'Sesión clave para el desarrollo del plan.';
  },

  obtenerSensacion(tipo, fase) {
    const sensaciones = {
      rodaje: { BASE: 'Cómodo', CONSTRUCCION: 'Controlado', ESPECIFICA: 'Activo', PICO: 'Exigente', TAPER: 'Muy suave' },
      tempo: { BASE: 'Fuerte', CONSTRUCCION: 'Exigente', ESPECIFICA: 'Muy exigente', PICO: 'Límite', TAPER: 'Suave' },
      series: { BASE: 'Rápidas', CONSTRUCCION: 'Intensas', ESPECIFICA: 'Muy intensas', PICO: 'Máximas', TAPER: 'Suaves' },
      largo: { BASE: 'Resistencia', CONSTRUCCION: 'Fondo', ESPECIFICA: 'Calidad', PICO: 'Simulación', TAPER: 'Ligero' }
    };
    return sensaciones[tipo]?.[fase] || 'Controlado';
  },

  // Icono y etiqueta genéricos de cada tipo de sesión "de calidad" (no
  // incluye descanso/strength, que no tienen ritmo/zona propios). Se usan
  // en el selector de "¿qué tipo de sesión hiciste de verdad?" del modal
  // de datos reales, y también para nombrar la sesión cuando el usuario
  // corrige el tipo (ya no tiene sentido usar el nombre del catálogo
  // planificado, p.ej. "Series 200m", si al final hizo un rodaje).
  TIPOS_INFO: {
    rodaje: { icono: '🏃‍♂️', label: 'Rodaje' },
    tempo:  { icono: '⚡', label: 'Tempo' },
    series: { icono: '🔁', label: 'Series' },
    largo:  { icono: '📏', label: 'Tirada larga' }
  },

  _infoTipo(tipo) {
    return this.TIPOS_INFO[tipo] || { icono: '🏃', label: (tipo || 'Sesión').toUpperCase() };
  },

  // Todos los tipos de sesión (con datos de km/tiempo/ritmo) que el
  // planificador es capaz de generar. Antes esta lista se limitaba a los
  // tipos que aparecían en las sesiones YA generadas del plan actual
  // (this._sesionesActuales), así que si el plan concreto del usuario no
  // incluía, por ejemplo, ninguna sesión de "series", esa opción
  // desaparecía del selector aunque el planificador sí sea capaz de
  // generarlas -- no se podía corregir una sesión a un tipo que el plan
  // simplemente no había usado todavía. 'strength' (fuerza) se queda
  // fuera a propósito: no tiene km/ritmo, así que no encaja en este modal
  // de datos reales.
  _tiposDisponiblesEnPlan() {
    return Object.keys(this.TIPOS_INFO).map(tipo => ({ tipo, ...this._infoTipo(tipo) }));
  },

  // Fisher-Yates: baraja el array in-place y lo devuelve.
  _barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // Saca una sesión de la "bolsa" de ese tipo+modalidad+distancia+nivel,
  // rellenándola y barajándola de nuevo cuando se vacía. Así se garantiza
  // que se reparten TODAS las variantes disponibles antes de repetir
  // ninguna, en vez de solo evitar la última usada.
  _sacarSesionDeLaBolsa(dbTipo, tipo, modalidad, distancia, nivel) {
    const key = `${modalidad}|${distancia}|${nivel}|${tipo}`;
    let bolsa = this.bolsaPorTipo[key];
    if (!bolsa || bolsa.length === 0) {
      bolsa = this._barajar([...dbTipo]);
      // Si la primera de la bolsa nueva coincide con la última sesión
      // usada, se intercambia de posición para no repetir justo en el
      // empalme entre una vuelta de la bolsa y la siguiente.
      const ultima = this.ultimaSesionPorTipo[tipo];
      if (ultima && bolsa.length > 1 && bolsa[0].nombre === ultima) {
        [bolsa[0], bolsa[1]] = [bolsa[1], bolsa[0]];
      }
      this.bolsaPorTipo[key] = bolsa;
    }
    const sesion = bolsa.shift();
    this.ultimaSesionPorTipo[tipo] = sesion.nombre;
    return sesion;
  },

  // Suelo mínimo de duración de sesión (minutos), variable por nivel. Un
  // suelo pensado para alguien que empieza de cero (45') se queda corto
  // para un corredor intermedio o avanzado, ya habituado a correr, incluso
  // en fase BASE. Descarga/taper restan 10' sobre el normal de cada nivel,
  // la misma proporción que ya existía antes solo para principiante
  // (45 -> 35).
  _minimoDuracionSesion(nivel, esDescargaOTaper) {
    const normal = { principiante: 45, intermedio: 50, avanzado: 55 }[nivel] || 45;
    return esDescargaOTaper ? normal - 10 : normal;
  },

  async crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null, esRecuperacion = false, maximoForzado = null) {
    const { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo } = datos;
    const dbTipo = this.ENTRENAMIENTOS[modalidad]?.[distancia]?.[nivel]?.[tipo];
    let sesionMatriz = null;
    if (dbTipo?.length) {
      sesionMatriz = this._sacarSesionDeLaBolsa(dbTipo, tipo, modalidad, distancia, nivel);
    }
    if (!sesionMatriz) {
      let nombreBase = '', duracionBase = 45;
      switch(tipo) {
        case 'rodaje': nombreBase = 'Rodaje aeróbico'; duracionBase = 45; break;
        case 'tempo': nombreBase = 'Entrenamiento de tempo'; duracionBase = 45; break;
        case 'series': nombreBase = 'Trabajo de series'; duracionBase = 50; break;
        case 'largo': nombreBase = 'Tirada larga'; duracionBase = 60; break;
      }
      sesionMatriz = { nombre: nombreBase, desc: '', duracion: duracionBase };
    }
    let duracion;
    if (duracionExacta !== null) {
      duracion = duracionExacta;
      const max = maximoForzado != null ? maximoForzado : this.getMaximosPorTipo(tipo, nivel, fase, distancia);
      if (max) duracion = Math.min(duracion, max);
      const min = this._minimoDuracionSesion(nivel, semanaEnFase % 4 === 0 || fase === 'TAPER');
      if (duracion < min) {
        duracion = min + Math.floor(Math.random() * 12);
        if (max) duracion = Math.min(duracion, max);
      }
    } else {
      duracion = sesionMatriz.duracion || 45;
      duracion = Math.round(duracion * factorVolumen);
      const max = maximoForzado != null ? maximoForzado : this.getMaximosPorTipo(tipo, nivel, fase, distancia);
      if (max) duracion = Math.min(duracion, max);
      const min = this._minimoDuracionSesion(nivel, semanaEnFase % 4 === 0 || fase === 'TAPER');
      if (duracion < min) {
        duracion = min + Math.floor(Math.random() * 12);
        if (max) duracion = Math.min(duracion, max);
      }
    }

    if (esRecuperacion && tipo === 'rodaje') {
      duracion = 25;
    }

    const { calentamiento, enfriamiento, partePrincipal } = this._calcularCalentamientoEnfriamiento(duracion);
    let accionPrincipal = '', porquePrincipal = '';
    const incluirRitmoObjetivo = (tipo === 'largo' && (fase === 'ESPECIFICA' || fase === 'PICO') && (datos.distancia === 'medio' || datos.distancia === 'maraton') && semanaEnFase > 2 && partePrincipal >= 30);
    if (incluirRitmoObjetivo) {
      const bloqueRitmo = Math.min(Math.round(partePrincipal * 0.4), 45);
      const parteZ2 = partePrincipal - bloqueRitmo;
      accionPrincipal = `${parteZ2}' Z2 + ${bloqueRitmo}' a ritmo objetivo (Z4)`;
      porquePrincipal = 'Simular las exigencias de la carrera y ganar confianza en el ritmo objetivo.';
    } else {
      switch(tipo) {
        case 'rodaje':
          if (esRecuperacion) {
            accionPrincipal = `${partePrincipal}' rodaje muy suave Z1-Z2`;
            porquePrincipal = 'Recuperación activa después de la tirada larga.';
          } else {
            accionPrincipal = `${partePrincipal}' rodaje continuo Z2`;
            porquePrincipal = 'Desarrollar base aeróbica, mejorar eficiencia y quemar grasas.';
          }
          break;
        case 'tempo':
          accionPrincipal = `${partePrincipal}' tempo Z3-Z4`;
          porquePrincipal = 'Elevar umbral de lactato, mejorar resistencia a ritmos exigentes.';
          break;
        case 'largo':
          accionPrincipal = `${partePrincipal}' tirada larga Z2`;
          porquePrincipal = 'Aumentar capacidad aeróbica, resistencia específica y confianza.';
          break;
        default:
          accionPrincipal = `${partePrincipal}' trabajo principal`;
          porquePrincipal = 'Mejorar condición física general y adaptaciones específicas.';
      }
    }
    const pasosDetallados = this._pasosBasicos(calentamiento, partePrincipal, enfriamiento, accionPrincipal, porquePrincipal);
    const estructuraDetallada = `${calentamiento}' calentamiento Z1 + ${accionPrincipal} + ${enfriamiento}' enfriamiento Z1`;
    let zonaPrincipal = 'Z2';
    const zonaMatch = accionPrincipal.match(/Z([1-6])/);
    if (zonaMatch) zonaPrincipal = `Z${zonaMatch[1]}`;
    else if (tipo === 'tempo') zonaPrincipal = 'Z3';
    else if (tipo === 'series') zonaPrincipal = 'Z4';
    else if (esRecuperacion) zonaPrincipal = 'Z1';

    let ritmoObjetivo = '';
    if (tipo === 'rodaje') ritmoObjetivo = this.obtenerRitmoParaZona(esRecuperacion ? 'Z1' : 'Z2');
    else if (tipo === 'tempo') ritmoObjetivo = this.obtenerRitmoParaZona('Z3');
    else if (tipo === 'series') ritmoObjetivo = this.obtenerRitmoParaZona('Z5');
    else if (tipo === 'largo') ritmoObjetivo = this.obtenerRitmoParaZona('Z2');

    let fcObjetivo = '';

    // Para sesiones de series "básicas" (nivel principiante en fase BASE,
    // sacadas directamente de ENTRENAMIENTOS_DB) también se calcula
    // segundosEsfuerzo -- el tiempo real corrido al ritmo objetivo, sin
    // recuperaciones -- para que _desglosarSesion pueda separar esfuerzo
    // de descanso igual que ya hace con las series avanzadas (pirámide/
    // rotas/fartlek/cuestas, ver crearSesionAvanzadaSeries). Antes estas
    // sesiones no llevaban este dato y su zona real seguía saliendo
    // diluida por los descansos al marcarlas como hechas.
    let metricasExtraSeries = {};
    if (tipo === 'series') {
      const repSerie = sesionMatriz?.repeticiones;
      const distSerie = sesionMatriz?.distanciaSerie;
      if (repSerie > 0 && distSerie > 0) {
        // Cálculo exacto: la matriz trae repeticiones y distancia de cada
        // serie, así que el tiempo de esfuerzo es repeticiones x distancia
        // al ritmo de la zona indicada (si viene compuesta, p.ej.
        // "Z4-Z5", se usa la más exigente -- Z5 -- ya que las repeticiones
        // en sí se corren al ritmo fuerte, no al ritmo medio del rango).
        const zonaSerieDb = (sesionMatriz.zona || 'Z4').split('-').pop().trim();
        const ritmoSerieSeg = this._ritmoToSeg(this.obtenerRitmoParaZona(zonaSerieDb));
        if (ritmoSerieSeg && isFinite(ritmoSerieSeg)) {
          const segundosEsfuerzo = repSerie * (distSerie / 1000) * ritmoSerieSeg;
          metricasExtraSeries = { segundosEsfuerzo, tiempoEnZona: Utils.formatR(segundosEsfuerzo / 60) };
        }
      } else {
        // Sin repeticiones/distancia estructuradas (Fartlek, Pirámide y
        // Cuestas de nivel principiante en la matriz): se estima la
        // fracción de la parte principal que es esfuerzo real frente a
        // recuperación con las mismas proporciones típicas que usa
        // crearSesionAvanzadaSeries para estas estructuras (cuestas/
        // fartlek ~60"+90" -> 40% esfuerzo; pirámide, con recuperaciones
        // más cortas relativas, ~65%). Es una ESTIMACIÓN razonable, no un
        // cálculo exacto -- pero sigue siendo muchísimo más fiel que
        // tratar toda la parte principal como esfuerzo continuo.
        const nombreLower = ((sesionMatriz && sesionMatriz.nombre) || '').toLowerCase();
        let fraccionEsfuerzo = 0.55;
        if (nombreLower.includes('cuesta')) fraccionEsfuerzo = 0.4;
        else if (nombreLower.includes('fartlek')) fraccionEsfuerzo = 0.4;
        else if (nombreLower.includes('pirámide') || nombreLower.includes('piramide')) fraccionEsfuerzo = 0.65;
        const segundosEsfuerzo = partePrincipal * 60 * fraccionEsfuerzo;
        metricasExtraSeries = { segundosEsfuerzo, tiempoEnZona: Utils.formatR(segundosEsfuerzo / 60) };
      }
    }

    const sensacion = this.obtenerSensacion(tipo, fase);
    const objetivoTexto = this.obtenerObjetivoTexto(tipo, fase);
    const porqueTexto = this.obtenerPorque(tipo, fase);
    const datosBasicos = {
      nombre: (sesionMatriz ? sesionMatriz.nombre : `${tipo}: ${fase.toLowerCase()}`) || `${tipo}: ${fase.toLowerCase()}`,
      descripcion: (sesionMatriz ? sesionMatriz.desc : `Sesión de ${tipo} en fase ${fase}`) || `Sesión de ${tipo} en fase ${fase}`,
      estructura: estructuraDetallada,
      sensacion: sensacion,
      zonaPrincipal: zonaPrincipal,
      duracion: duracion,
      ritmoObjetivo: ritmoObjetivo,
      fcObjetivo: fcObjetivo,
      calentamiento, partePrincipal, enfriamiento,
      objetivo: objetivoTexto,
      porque: porqueTexto
    };
    return this._buildSesionDetalle(tipo, fase, datosBasicos, pasosDetallados, metricasExtraSeries, factorIntensidad);
  },

  async crearSesionAvanzadaSeries(estructura, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta) {
    const { modalidad, distancia, ritmoBase, fcUmbral } = datos;
    let duracion = duracionExacta || 50;
    const maxSeries = this.getMaximosPorTipo('series', nivel, fase, distancia);
    duracion = Math.min(duracion, maxSeries);
    const minSeries = this._minimoDuracionSesion(nivel, fase === 'TAPER');
    if (duracion < minSeries) {
      duracion = minSeries + Math.floor(Math.random() * 12);
      duracion = Math.min(duracion, maxSeries);
    }
    const { calentamiento, enfriamiento } = this._calcularCalentamientoEnfriamiento(duracion);
    let partePrincipalSeg = Math.max(20, duracion - calentamiento - enfriamiento) * 60;

    const ritmoRapidoSeg = this._ritmoToSeg(this.obtenerRitmoParaZona('Z5'));
    const ritmoModeradoSeg = this._ritmoToSeg(this.obtenerRitmoParaZona('Z2'));

    let nombre = '', descripcion = '', accion = '', porque = '', zona = 'Z4-Z5';
    let pasosDetallados = [];
    let metricasExtra = {};

    switch(estructura) {
      case 'piramide': {
        nombre = 'Pirámide de series';
        descripcion = 'Estructura en pirámide ascendente y descendente, adaptada al tiempo disponible.';
        const baseDistancias = [200, 400, 600, 800, 600, 400, 200];
        const calcularTotalPiramide = (dists) => {
          let tSeries = 0, tRec = 0;
          dists.forEach((d, idx) => {
            tSeries += (d / 1000) * ritmoRapidoSeg;
            if (idx < dists.length - 1) tRec += Math.min(120, Math.max(40, d / 10));
          });
          return tSeries + tRec;
        };
        const totalBase1x = calcularTotalPiramide(baseDistancias);
        const factor = partePrincipalSeg / totalBase1x;

        let distancias;
        if (factor < 0.55) distancias = [200, 400, 200];
        else if (factor < 0.75) distancias = [200, 400, 400, 200];
        else if (factor < 1.3) distancias = [...baseDistancias];
        else {
          // Sobra presupuesto para más de una pirámide completa: se van
          // añadiendo pirámides ENTERAS una a una, comprobando cada vez el
          // total REAL, y parando en cuanto la siguiente ya no quepa (mismo
          // margen de tolerancia que el resto de estructuras). Antes se
          // calculaba cuántas "deberían" caber con Math.floor(factor) --
          // sobre un total lineal aproximado -- sin verificar el resultado
          // real después, así que en presupuestos grandes podía generar
          // más pirámides de las que de verdad cabían, y la duración final
          // de la sesión (derivada de esa estructura real) acababa muy por
          // encima del máximo del tipo para ese nivel/fase/distancia.
          distancias = [...baseDistancias];
          while (true) {
            const candidato = [...distancias, ...baseDistancias];
            if (calcularTotalPiramide(candidato) > partePrincipalSeg * 1.2) break;
            distancias = candidato;
          }
        }
        distancias = distancias.map(d => this._redondearDistancia(d));
        const recuperaciones = distancias.map((d, i) => {
          if (i === distancias.length - 1) return 0;
          let rec = Math.min(120, Math.max(40, d / 10));
          return this._redondearTiempo(rec);
        });
        let tiempoSeries = 0, tiempoRec = 0;
        distancias.forEach((d, idx) => {
          tiempoSeries += (d / 1000) * ritmoRapidoSeg;
          if (idx < distancias.length - 1) tiempoRec += recuperaciones[idx];
        });
        let totalPartePrincipal = tiempoSeries + tiempoRec;
        totalPartePrincipal = this._redondearDuracionPartePrincipal(totalPartePrincipal);
        partePrincipalSeg = totalPartePrincipal;
        let textoDistancias = '';
        distancias.forEach((d, i) => {
          textoDistancias += `${d}m`;
          if (i < distancias.length - 1) textoDistancias += ` (rec ${Math.round(recuperaciones[i])}") `;
        });
        accion = `Parte principal: ${Math.floor(totalPartePrincipal / 60)}:${Math.round(totalPartePrincipal % 60).toString().padStart(2,'0')} minutos. Pirámide: ${textoDistancias}. Realiza cada repetición a ritmo rápido – Z4-Z5 – recuperando caminando o trotando suave – Z2.`;
        porque = 'Mejora la capacidad de cambiar de ritmo, la potencia aeróbica y la tolerancia al lactato.';
        pasosDetallados = this._pasosBasicos(calentamiento, Math.floor(totalPartePrincipal / 60), enfriamiento, accion, porque);
        metricasExtra = { tipoEstructura: 'piramide', distancias, ritmoSerie: this.obtenerRitmoParaZona('Z5'), ritmoRecuperacion: this.obtenerRitmoParaZona('Z2'), recuperaciones, tiempoEnZona: Utils.formatR(tiempoSeries / 60), segundosEsfuerzo: tiempoSeries };
        break;
      }
      case 'rotas': {
        nombre = 'Series rotas (broken sets)';
        descripcion = 'Bloques de series con recuperación parcial entre bloques. Adaptado a la duración disponible.';
        let distanciaSerie = distancia === '2k' || distancia === '5k' ? 400 : (distancia === '10k' ? 800 : 1000);
        let recIntra = distanciaSerie <= 400 ? 60 : (distanciaSerie <= 800 ? 90 : 120);
        const recEntreBloques = 180;
        let repPorBloque = 4;
        let bloques = 2;

        const calcularTotal = () => {
          const tiempoPorSerie = (distanciaSerie / 1000) * ritmoRapidoSeg;
          const tSeries = repPorBloque * bloques * tiempoPorSerie;
          const tRecIntra = (repPorBloque - 1) * recIntra * bloques;
          const tRecEntre = recEntreBloques * (bloques - 1);
          return tSeries + tRecIntra + tRecEntre;
        };

        let total = calcularTotal();
        let factor = partePrincipalSeg / total;

        if (factor > 1.2) {
          while (bloques < 4) {
            const bloquesPrueba = bloques + 1;
            const tiempoPorSerie = (distanciaSerie / 1000) * ritmoRapidoSeg;
            const totalPrueba = repPorBloque * bloquesPrueba * tiempoPorSerie
              + (repPorBloque - 1) * recIntra * bloquesPrueba
              + recEntreBloques * (bloquesPrueba - 1);
            if (totalPrueba > partePrincipalSeg * 1.2) break;
            bloques = bloquesPrueba;
          }
          total = calcularTotal();
          factor = partePrincipalSeg / total;
        }

        // Antes esto se intentaba UNA sola vez (reducir distancia y, como
        // mucho, una repetición) y si con eso no bastaba para encajar en
        // partePrincipalSeg, la sesión se quedaba tal cual -- pudiendo
        // acabar con una estructura que sumaba muchos más minutos de los
        // que la sesión decía tener en su cabecera (ver bug real: 32 min
        // de cabecera con un desglose de calentamiento+parte principal+
        // enfriamiento que sumaba 55). Ahora se sigue recortando --
        // primero distancia, luego repeticiones por bloque, luego número
        // de bloques -- hasta encajar o hasta llegar al suelo de cada
        // parámetro (1 bloque de 2x200m, la estructura mínima posible).
        let intentos = 0;
        while (factor < 0.8 && intentos < 10) {
          if (distanciaSerie > 200) {
            distanciaSerie = Math.max(200, distanciaSerie - 200);
            recIntra = distanciaSerie <= 400 ? 60 : (distanciaSerie <= 800 ? 90 : 120);
          } else if (repPorBloque > 2) {
            repPorBloque -= 1;
          } else if (bloques > 1) {
            bloques -= 1;
          } else {
            break;
          }
          total = calcularTotal();
          factor = partePrincipalSeg / total;
          intentos++;
        }

        distanciaSerie = this._redondearDistancia(distanciaSerie);
        recIntra = this._redondearTiempo(recIntra);
        let totalPartePrincipalReal = this._redondearDuracionPartePrincipal(calcularTotal());
        partePrincipalSeg = totalPartePrincipalReal;

        const minutosPP = Math.floor(totalPartePrincipalReal / 60);
        const segundosPP = Math.round(totalPartePrincipalReal % 60);
        const duracionPartePrincipalR = `${minutosPP}:${segundosPP.toString().padStart(2, '0')}`;
        const tiempoPorSerieReal = (distanciaSerie / 1000) * ritmoRapidoSeg;
        const tiempoSeriesReal = repPorBloque * bloques * tiempoPorSerieReal;

        accion = `Parte principal (${duracionPartePrincipalR} minutos): ${bloques} bloques de ${repPorBloque}x${distanciaSerie}m a ritmo rápido – Z4-Z5 – con recuperación de ${recIntra}" entre series y ${Math.floor(recEntreBloques/60)}' entre bloques (recuperación activa Z2).`;
        porque = 'Aumenta la capacidad de mantener el ritmo rápido bajo fatiga.';
        pasosDetallados = this._pasosBasicos(calentamiento, minutosPP, enfriamiento, accion, porque);
        metricasExtra = {
          tipoEstructura: 'rotas', distanciaSerie, repeticionesPorBloque: repPorBloque, bloques, recIntra, recEntreBloques,
          ritmoSerie: this.obtenerRitmoParaZona('Z5'), ritmoRecuperacion: this.obtenerRitmoParaZona('Z2'),
          tiempoEnZona: Utils.formatR(tiempoSeriesReal / 60), segundosEsfuerzo: tiempoSeriesReal
        };
        break;
      }
      case 'fartlek': {
        nombre = 'Fartlek estructurado';
        descripcion = 'Cambios de ritmo sin parar. Adaptado al tiempo disponible.';
        let tiempoFuerte = 60;
        let tiempoSuave = 90;
        let repeticiones = Math.floor(partePrincipalSeg / (tiempoFuerte + tiempoSuave));
        let sobrante = partePrincipalSeg - repeticiones * (tiempoFuerte + tiempoSuave);
        if (repeticiones < 2) {
          tiempoFuerte = Math.floor(partePrincipalSeg * 0.4);
          tiempoSuave = partePrincipalSeg - tiempoFuerte;
          repeticiones = 1;
          sobrante = 0;
        }
        tiempoFuerte = this._redondearTiempo(tiempoFuerte);
        tiempoSuave = this._redondearTiempo(tiempoSuave);
        const segundosFuertes = repeticiones * tiempoFuerte;
        const segundosSuaves = repeticiones * tiempoSuave + sobrante;
        const totalSegundos = segundosFuertes + segundosSuaves;
        partePrincipalSeg = totalSegundos;
        const minutosPP = Math.floor(totalSegundos / 60);
        accion = `Parte principal: ${minutosPP}:${(totalSegundos % 60).toString().padStart(2,'0')} minutos. ${repeticiones} ciclos de ${tiempoFuerte}" fuerte + ${tiempoSuave}" suave${sobrante ? ` + ${sobrante}" suave final` : ''}. Realiza el fuerte a ritmo rápido – Z4-Z5 – y el suave a ritmo aeróbico – Z2. El cambio de ritmo debe ser continuo, sin detenerte.`;
        porque = 'Mejora la capacidad de cambiar de ritmo, la economía de carrera y la resistencia a ritmos variables.';
        pasosDetallados = this._pasosBasicos(calentamiento, minutosPP, enfriamiento, accion, porque);
        metricasExtra = {
          tipoEstructura: 'fartlek', segundosFuertes, segundosSuaves,
          ritmoFuerte: this.obtenerRitmoParaZona('Z5'), ritmoSuave: this.obtenerRitmoParaZona('Z2'),
          tiempoEnZona: Utils.formatR(segundosFuertes / 60), segundosEsfuerzo: segundosFuertes
        };
        break;
      }
      case 'cuestas': {
        nombre = 'Repeticiones en cuesta';
        descripcion = 'Trabajo de potencia en pendiente. Adaptado al tiempo disponible.';
        let duracionCuesta = 60;
        let recCuesta = 90;
        let numCuestas = Math.floor(partePrincipalSeg / (duracionCuesta + recCuesta));
        if (numCuestas < 3) {
          duracionCuesta = Math.min(45, Math.floor(partePrincipalSeg * 0.6));
          recCuesta = partePrincipalSeg - duracionCuesta;
          numCuestas = 1;
        }
        duracionCuesta = this._redondearTiempo(duracionCuesta);
        recCuesta = this._redondearTiempo(recCuesta);
        const totalSegundos = numCuestas * (duracionCuesta + recCuesta);
        partePrincipalSeg = totalSegundos;
        const minutosPP = Math.floor(totalSegundos / 60);
        accion = `Parte principal: ${minutosPP}:${(totalSegundos % 60).toString().padStart(2,'0')} minutos. ${numCuestas} repeticiones de ${duracionCuesta}" en cuesta con desnivel moderado, recuperando trotando suave ${recCuesta}" – Z2. Esfuerzo máximo (Z5) en la subida.`;
        porque = 'Desarrolla fuerza específica, potencia y mejora la técnica de carrera.';
        pasosDetallados = [
          { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' trote suave + ejercicios de movilidad + 2 progresiones en cuesta`, porque: 'Preparar el cuerpo.' },
          { icono: '⛰️', titulo: 'CUESTAS', accion: accion, porque: porque },
          { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' trote suave + estiramientos`, porque: 'Recuperación.' }
        ];
        metricasExtra = {
          tipoEstructura: 'cuestas', numRepeticiones: numCuestas, duracionRepeticion: duracionCuesta,
          ritmoRepeticion: this.obtenerRitmoParaZona('Z5'), tiempoEnZona: Utils.formatR((numCuestas * duracionCuesta) / 60), segundosEsfuerzo: numCuestas * duracionCuesta
        };
        break;
      }
      default:
        return this.crearSesionBasica('series', fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta);
    }

    // GARANTÍA DE COHERENCIA: cada estructura de arriba (rotas/fartlek/
    // cuestas/pirámide) calcula su propio encaje discreto -- repeticiones,
    // distancias, recuperaciones -- para intentar llenar partePrincipalSeg,
    // pero un encaje discreto no siempre da exacto. Antes cada caso influía
    // en el "duracion" final apoyándose en el valor de entrada sin
    // reconciliarlo con lo que de verdad se acabó generando, así que la
    // cabecera de la sesión (duracion) y el desglose de texto (calentamiento
    // + parte principal + enfriamiento) podían no sumar lo mismo -- caso
    // real visto: cabecera "32 min", desglose sumando 55. Ahora la duración
    // final se calcula SIEMPRE a partir de la estructura real ya generada,
    // así que cabecera y desglose son, por construcción, la misma suma.
    // Un único redondeo compartido: antes duracionReal usaba Math.round y
    // el campo partePrincipal del detalle usaba Math.floor, así que en
    // sesiones donde partePrincipalSeg caía en un .5+ minuto (p.ej.
    // 67:30) la cabecera y la suma de calentamiento+partePrincipal+
    // enfriamiento podían diferir en 1 minuto entre sí. Con el mismo
    // valor en los dos sitios, ya no pueden desincronizarse.
    // Floor, no round: las 4 estructuras muestran su parte principal como
    // MM:SS (minutos enteros + segundos restantes exactos), que solo es
    // internamente consistente con floor -- redondear los minutos por
    // separado ("19:45" -> 20 min) contradice al propio MM:SS mostrado.
    // Usar el mismo floor aquí asegura que el número que ve el usuario en
    // la cabecera es siempre el mismo que el que suma calentamiento +
    // parte principal + enfriamiento en el desglose de texto.
    const partePrincipalFinal = Math.floor(partePrincipalSeg / 60);
    const duracionReal = calentamiento + partePrincipalFinal + enfriamiento;
    const estructuraDetallada = `${calentamiento}' calentamiento + ${accion} + ${enfriamiento}' enfriamiento`;
    const datosBasicos = {
      nombre, descripcion, estructura: estructuraDetallada, sensacion: 'Muy intenso', zonaPrincipal: zona, duracion: duracionReal,
      ritmoObjetivo: this.obtenerRitmoParaZona('Z5'), fcObjetivo: '',
      calentamiento, partePrincipal: partePrincipalFinal, enfriamiento, objetivo: nombre, porque
    };
    return this._buildSesionDetalle('series', fase, datosBasicos, pasosDetallados, metricasExtra, factorIntensidad);
  },

  async crearSesionDesdeMatriz(sesionBase, esActivo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta = null, maximoForzado = null) {
    const { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo } = datos;
    const tipo = sesionBase.tipo;
    const esSimulacion = sesionBase.esSimulacion || false;
    const esRecuperacion = sesionBase.esRecuperacion || false;

    if (esSimulacion && tipo === 'largo' && (fase === 'ESPECIFICA' || fase === 'PICO')) {
      return this.crearSesionSimulacion(fase, semanaEnFase, nivel, datos, duracionExacta, maximoForzado);
    }

    if (tipo === 'series' && (nivel !== 'principiante' || fase !== 'BASE')) {
      const estructuras = ['piramide', 'rotas', 'fartlek', 'cuestas'];
      let estructura = estructuras[Math.floor(Math.random() * estructuras.length)];
      if (modalidad === 'trail' && Math.random() < 0.5) estructura = 'cuestas';
      return this.crearSesionAvanzadaSeries(estructura, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta);
    }

    return this.crearSesionBasica(tipo, fase, semanaEnFase, nivel, datos, factorVolumen, factorIntensidad, duracionExacta, esRecuperacion, maximoForzado);
  },

  // maximoForzado: cuando se pasa (solo lo usa la tirada larga al
  // alargarse para seguir siendo la sesión más larga de la semana, ver
  // _calcularDuracionLargoFinal), sustituye al máximo "normal" de
  // getMaximosPorTipo para esta sesión en concreto -- si no, esta misma
  // función volvería a recortar la duración ya calculada de vuelta al
  // techo de siempre, deshaciendo el alargamiento antes de que sirva de
  // nada.
  crearSesionSimulacion(fase, semanaEnFase, nivel, datos, duracionExacta, maximoForzado = null) {
    const { distancia, ritmoBase, fcUmbral, modalidad } = datos;
    let duracion = duracionExacta || 90;
    const maxLargo = maximoForzado != null ? maximoForzado : this.getMaximosPorTipo('largo', nivel, fase, distancia);
    duracion = Math.min(duracion, maxLargo);

    const calentamiento = Math.max(15, Math.floor(duracion * 0.15));
    const enfriamiento = Math.max(10, Math.floor(duracion * 0.1));
    let partePrincipal = duracion - calentamiento - enfriamiento;

    const bloqueRitmo = Math.min(20, Math.max(10, Math.floor(partePrincipal / 3)));
    const numBloques = Math.floor(partePrincipal / bloqueRitmo);
    const recuperacion = Math.min(5, Math.floor(bloqueRitmo * 0.3));
    let accionBloques = '';
    if (numBloques >= 2) {
      accionBloques = `${numBloques} repeticiones de ${bloqueRitmo}' a ritmo de competición (Z4), con ${recuperacion}' de recuperación activa entre series.`;
    } else {
      accionBloques = `${partePrincipal}' continuos a ritmo de competición (Z4).`;
    }

    const estructuraDetallada = `${calentamiento}' calentamiento Z1 + ${accionBloques} + ${enfriamiento}' enfriamiento Z1`;

    const pasosDetallados = [
      { icono: '🔥', titulo: 'CALENTAMIENTO', accion: `${calentamiento}' de trote suave (Z1) + ejercicios de movilidad + 3 progresiones a ritmo objetivo`, porque: 'Preparar el cuerpo para el esfuerzo específico y activar el sistema neuromuscular.' },
      { icono: '🏁', titulo: 'SIMULACIÓN DE COMPETICIÓN', accion: accionBloques, porque: `Aclimatar al cuerpo al ritmo de carrera, practicar la estrategia de nutrición e hidratación, y ganar confianza.` },
      { icono: '🍽️', titulo: 'NUTRICIÓN E HIDRATACIÓN', accion: `Realizar una toma de gel o bebida isotónica cada 30 minutos. Probar la estrategia que usarás el día de la carrera.`, porque: 'Entrenar el estómago y evitar sorpresas el día de la competición.' },
      { icono: '🧘', titulo: 'ENFRIAMIENTO', accion: `${enfriamiento}' de trote suave + estiramientos suaves`, porque: 'Reducir frecuencia cardíaca, eliminar lactato y acelerar recuperación.' }
    ];

    const detalle = {
      nombre: `Simulación de ${distancia === '10k' ? '10K' : distancia === 'medio' ? 'Media Maratón' : 'Maratón'}`,
      descripcion: `Sesión que replica las condiciones de la carrera: ritmo, nutrición y estrategia.`,
      estructura: estructuraDetallada,
      sensacion: 'Exigente pero controlado',
      zona: 'Z4 (ritmo de carrera)',
      duracion: duracion,
      ritmoObjetivo: this.obtenerRitmoParaZona('Z4'),
      fcObjetivo: '',
      calentamiento: calentamiento,
      partePrincipal: partePrincipal,
      enfriamiento: enfriamiento,
      objetivo: `Simular la competición de ${distancia === '10k' ? '10 km' : distancia === 'medio' ? '21 km' : '42 km'}`,
      porque: 'Ensaya el ritmo, la estrategia y la nutrición para maximizar el rendimiento el día de la carrera.',
      pasosDetallados: pasosDetallados
    };

    // NOTA: factorIntensidad se pasa como SEGUNDO argumento posicional
    // (no como propiedad dentro del objeto de sesión) -- calcularMetricasSesion(sesion,
    // factorIntensidad = 1.0) lo lee así; pasarlo dentro del objeto (como
    // se hacía antes) lo ignora en silencio y siempre cae al valor por
    // defecto (ver el mismo fallo, ya corregido, en _buildSesionDetalle).
    // Aquí no cambiaba el resultado porque el valor por defecto YA es 1.0,
    // pero queda corregido para que sea coherente y no sea una trampa si
    // algún día esta función necesita pasar un factor distinto de 1.0.
    const metricas = this.calcularMetricasSesion({ tipo: 'largo', duracion, detalle }, 1.0);
    detalle.distanciaEstimada = metricas.distanciaTotal;
    detalle.tssEstimada = metricas.tssTotal;

    return { tipo: 'largo', duracion, detalle };
  },

  // Distancia total y TSS a partir de la distancia YA calculada de la
  // parte principal (fartlek/pirámide/rotas/cuestas calculan esa
  // distancia cada uno a su manera; todo lo que viene después --sumar
  // calentamiento/enfriamiento a ritmo Z1 y calcular el TSS-- era
  // idéntico letra por letra en los 4 sitios, así que queda aquí una
  // sola vez).
  _distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad) {
    // Z1 (factor 1.35), no Z2 (1.25): el calentamiento/enfriamiento de
    // CUALQUIER tipo de sesión (incluidas series/fartlek/cuestas) se
    // describe siempre como trote suave Z1 en el resto de la app (ver
    // _pasosBasicos, gps-tracker.js), así que su ritmo estimado aquí debe
    // ser coherente con eso.
    const ritmoSuaveSegGen = ritmoBase * 1.35 * 60;
    const distanciaCalentamiento = (detalle.calentamiento * 60) / ritmoSuaveSegGen;
    const distanciaEnfriamiento = (detalle.enfriamiento * 60) / ritmoSuaveSegGen;
    const distanciaTotal = distanciaPartePrincipal + distanciaCalentamiento + distanciaEnfriamiento;
    const zona = detalle.zona?.split('-')[0] || 'Z4';
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
    const ifactor = factoresIF[zona] || 0.9;
    const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
    return { distanciaTotal, tssTotal };
  },

  calcularMetricasSesion(sesion, factorIntensidad = 1.0) {
    if (!sesion.detalle) return { distanciaTotal: 0, tssTotal: 0 };

    const ritmoBase = AppState.planGeneradoActual?.ritmoBase || AppState.lastRitmoBase;
    const fcUmbral = AppState.planGeneradoActual?.fcUmbral || AppState.lastUL;
    if (!ritmoBase || !fcUmbral) return { distanciaTotal: 0, tssTotal: 0 };
    if (sesion.tipo === 'strength') return { distanciaTotal: 0, tssTotal: 0 };

    const detalle = sesion.detalle;

    if (detalle.tipoEstructura === 'fartlek' && detalle.segundosFuertes !== undefined && detalle.segundosSuaves !== undefined) {
      const ritmoFuerteSeg = this._ritmoToSeg(detalle.ritmoFuerte);
      const ritmoSuaveSeg = this._ritmoToSeg(detalle.ritmoSuave);
      const distanciaFuerte = (detalle.segundosFuertes / ritmoFuerteSeg);
      const distanciaSuave = (detalle.segundosSuaves / ritmoSuaveSeg);
      const distanciaPartePrincipal = distanciaFuerte + distanciaSuave;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }
    
    if (detalle.tipoEstructura === 'piramide' && detalle.distancias && detalle.ritmoSerie) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoSerie);
      let distanciaSeries = 0;
      detalle.distancias.forEach(d => distanciaSeries += d / 1000);
      const distanciaPartePrincipal = distanciaSeries;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }

    if (detalle.tipoEstructura === 'rotas' && detalle.distanciaSerie && detalle.repeticionesPorBloque && detalle.bloques) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoSerie);
      const distanciaPorSerie = detalle.distanciaSerie / 1000;
      const totalSeries = detalle.repeticionesPorBloque * detalle.bloques;
      const distanciaPartePrincipal = distanciaPorSerie * totalSeries;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }

    if (detalle.tipoEstructura === 'cuestas' && detalle.numRepeticiones) {
      const ritmoSerieSeg = this._ritmoToSeg(detalle.ritmoRepeticion);
      const tiempoTotalCuestas = detalle.numRepeticiones * detalle.duracionRepeticion;
      const distanciaPartePrincipal = tiempoTotalCuestas / ritmoSerieSeg;
      return this._distanciaYTssDesdeParteP(distanciaPartePrincipal, detalle, ritmoBase, sesion, factorIntensidad);
    }

    const zona = detalle.zona?.split('-')[0] || 'Z2';
    const factoresRitmo = { 'Z1': 1.35, 'Z2': 1.25, 'Z3': 1.15, 'Z4': 1.05, 'Z5': 0.95 };
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05 };
    const factorRitmo = factoresRitmo[zona] || 1.25;

    // La distancia YA NO se calcula aplicando el ritmo de la zona de la
    // sesión (p.ej. Z2) a los minutos TOTALES (calentamiento + parte
    // principal + enfriamiento). Antes se hacía así, y eso asumía --sin
    // decirlo-- que el calentamiento y el enfriamiento se corrían al MISMO
    // ritmo que la parte principal, cuando en realidad siempre se describen
    // como trote suave Z1 (ver _pasosBasicos/_calcularCalentamientoEnfriamiento
    // y gps-tracker.js). Eso hacía que la distancia estimada del plan fuera
    // internamente inconsistente con su propio desglose: si luego se
    // separaban los minutos de calentamiento/enfriamiento (a ritmo Z1) del
    // resto, la parte principal salía con MENOS km de los que le
    // correspondían a su zona real (p.ej. una sesión de rodaje Z2 podía
    // "perder" ritmo y salir su parte principal como si fuera Z1).
    // Ahora se separan los 3 tramos con su propio ritmo antes de sumar
    // la distancia total, igual que ya hacían fartlek/pirámide/series
    // rotas/cuestas más arriba.
    // El ritmo (y por tanto la distancia estimada) YA NO se divide por
    // factorIntensidad. ANTES sí se dividía -- ritmoBase*factor/factorIntensidad
    // -- así que en semanas de menor intensidad (recuperación, descarga,
    // TAPER con intensidad hasta 0.6) el ritmo "objetivo" se volvía
    // artificialmente MÁS LENTO, y con la misma duración eso daba una
    // distancia estimada mucho más baja de la real -- justo lo que hacía
    // que "generar calendario" sumara mal los km de golpe, mientras que
    // "ACTUALIZAR KM DEL PLAN" (recalcularDistanciasPlanActual, que
    // siempre llama a esta función con factorIntensidad=1.0) los dejaba
    // bien. El ritmo objetivo de una zona es el mismo siempre que estés en
    // esa zona -- lo que cambia entre una semana dura y una suave es EL
    // VOLUMEN (factorVolumen, ya aplicado antes de llegar aquí) y la carga
    // relativa (TSS, que sigue multiplicando por factorIntensidad más
    // abajo) -- no el ritmo en sí. Con este cambio, generar el calendario
    // y pulsar "actualizar km" dan siempre el mismo resultado de km.
    const { calentamiento, enfriamiento, partePrincipal } = this._calcularCalentamientoEnfriamiento(sesion.duracion);
    const ritmoSuaveMin = ritmoBase * factoresRitmo['Z1'];
    const ritmoMin = ritmoBase * factorRitmo;
    const distanciaCalentamiento = calentamiento / ritmoSuaveMin;
    const distanciaEnfriamiento = enfriamiento / ritmoSuaveMin;
    const distanciaPartePrincipal = partePrincipal / ritmoMin;
    const distanciaTotal = distanciaCalentamiento + distanciaPartePrincipal + distanciaEnfriamiento;

    const ifactor = factoresIF[zona] || 0.7;
    const tssTotal = Math.round(sesion.duracion * ifactor * ifactor * factorIntensidad);
    return { distanciaTotal, tssTotal };
  },

  // ANTES: el ciclo de 4 semanas se calculaba con (semanaGlobal-1)%4, es
  // decir, sobre la semana absoluta del plan entero. Eso significa que
  // cuándo caía el pico de la onda (semana "dura" del ciclo) dependía de
  // en qué punto arbitrario del calendario empezaba cada fase, así que en
  // muchas transiciones de fase (p.ej. BASE -> CONSTRUCCION) el salto del
  // multiplicador de fase (volumenBase) coincidía con el pico de la onda,
  // sumando los dos efectos de golpe: saltos de volumen semana-a-semana
  // de hasta +30/+50% en vez de la progresión gradual esperada.
  // AHORA: el ciclo se ancla a semanaEnFase, así que CADA fase empieza
  // siempre en el punto más suave de la onda (semana 1 de fase = punto
  // 0 del ciclo) y la subida de carga se nota de forma gradual dentro de
  // la propia fase, no como un escalón doble justo en la costura.
  // La semana 4 de cada bloque (índice 2 del patrón) es ahora una
  // descarga real -- ver el comentario en ONDULACION_PATRONES -- en vez
  // de una oscilación simétrica de ±15%.
  getOndulatoryFactor(semanaEnFase, fase) {
    if (fase === 'TAPER') return { intensidad: 0.6, volumen: 0.7 };
    // Desfase +2: la semana 1 de cada fase cae en el punto MÁS SUAVE del
    // ciclo (índice 3: intensidad/volumen moderados), no en el punto alto
    // (índice 0). Así la subida de carga al entrar en una fase nueva es
    // progresiva dentro de la propia fase, en vez de sumarse de golpe al
    // escalón de volumenBase de la fase justo en su primera semana.
    const ciclo = (semanaEnFase + 2) % 4;
    const patron = this.ONDULACION_PATRONES[ciclo] || { intensidad: 1.0, volumen: 1.0 };
    const factorFase = this.FASES[fase];
    return {
      intensidad: patron.intensidad * factorFase.intensidad,
      volumen: patron.volumen * factorFase.volumenBase
    };
  },

  getMaximosPorTipo(tipo, nivel, fase, distancia) {
    const maxBase = {
      rodaje: { principiante: 60, intermedio: 75, avanzado: 90 },
      tempo: 75,
      // BUG CORREGIDO (reportado con evidencia real: series de 130' y
      // tiradas largas de 150' en un plan de media maratón, nivel
      // avanzado): 120' de tope para una sesión de series es excesivo
      // para cualquier distancia -- ni corriendo un maratón hace falta
      // una sesión de calidad de 2 horas; el propio cuerpo no rinde bien
      // con series de esa duración, se acumula fatiga sin beneficio real.
      // Se baja el tope universal, y aparte se ajusta más fino por
      // distancia más abajo.
      series: 90,
      largo: 210
    };
    const factorFase = {
      BASE: 0.8,
      CONSTRUCCION: 0.9,
      ESPECIFICA: 1.0,
      PICO: 1.0,
      TAPER: 0.7
    };
    let max;
    if (tipo === 'rodaje') {
      max = maxBase.rodaje[nivel] || 75;
    } else {
      max = maxBase[tipo] || 90;
    }
    max = Math.round(max * factorFase[fase]);
    // Los topes por distancia deben ser coherentes ENTRE tipos: nada puede
    // tener, por diseño, un máximo por encima del máximo de la tirada larga
    // de esa misma distancia. Antes solo se topaban largo y series para 2K:
    // el tempo podía llegar a 75' (más que las 60' de la propia tirada
    // larga) y el rodaje de nivel avanzado a 90' -- una sesión "fácil" o de
    // tempo más larga que "la tirada larga" de la semana. Ese hueco en la
    // propia tabla de máximos era la causa real de tener que recortar
    // sesiones después (ver _calcularDuracionLargoFinal): ahora, para 2K,
    // ningún tipo puede superar el techo de la tirada larga.
    if (distancia === '2k') {
      if (tipo === 'largo') max = Math.min(max, 60);
      if (tipo === 'series') max = Math.min(max, 60);
      if (tipo === 'tempo') max = Math.min(max, 60);
      if (tipo === 'rodaje') max = Math.min(max, 60);
    } else if (distancia === '5k') {
      if (tipo === 'largo') max = Math.min(max, 90);
      if (tipo === 'series') max = Math.min(max, 75);
    } else if (distancia === '10k') {
      if (tipo === 'largo') max = Math.min(max, 120);
      if (tipo === 'series') max = Math.min(max, 90);
    } else if (distancia === 'medio') {
      // BUG CORREGIDO: 150' de tirada larga y 120' de series para una
      // media maratón no es realista -- son duraciones propias de
      // entrenamiento de maratón, no de media. 130' de tirada larga
      // (~24-26km a ritmo suave para un corredor avanzado) ya es un techo
      // generoso para esta distancia; 80' de series es más que suficiente
      // para una sesión de calidad exigente sin pasarse.
      if (tipo === 'largo') max = Math.min(max, 130);
      if (tipo === 'series') max = Math.min(max, 80);
    } else {
      if (tipo === 'largo') max = Math.min(max, 210);
      if (tipo === 'series') max = Math.min(max, 120);
    }
    return max;
  },

  ajustarDistribucionPorDistancia(baseDistribucion, distancia) {
    const nueva = JSON.parse(JSON.stringify(baseDistribucion));
    const factorSeries = distancia === '2k' || distancia === '5k' ? 1.5 : (distancia === '10k' ? 1.2 : (distancia === 'medio' ? 1.1 : 1.05));
    const factorTempo = distancia === '10k' ? 1.3 : (distancia === 'medio' ? 1.2 : (distancia === 'maraton' ? 1.15 : 1.0));
    const factorLargo = distancia === 'medio' || distancia === 'maraton' ? 1.4 : 1.0;
    const factorRodaje = distancia === 'maraton' ? 0.85 : 1.0;
    for (let nivel in nueva) {
      for (let fase in nueva[nivel]) {
        let d = nueva[nivel][fase];
        let sum = d.rodaje + d.tempo + d.series + d.largo;
        d.rodaje = (d.rodaje * factorRodaje) / sum;
        d.tempo = (d.tempo * factorTempo) / sum;
        d.series = (d.series * factorSeries) / sum;
        d.largo = (d.largo * factorLargo) / sum;
        sum = d.rodaje + d.tempo + d.series + d.largo;
        d.rodaje /= sum;
        d.tempo /= sum;
        d.series /= sum;
        d.largo /= sum;
      }
    }
    return nueva;
  },

  calcularVolumenSemanal(nivel, experiencia, objetivo, distancia) {
    // Base de avanzado bajada de 480 a 430 min/semana. Con el modelo
    // anterior, avanzado + maratón + competir ya partía de una base tan
    // alta (480 × 1.2 × 1.15 ≈ 662 min ANTES de aplicar siquiera la fase
    // y la onda de carga) que en fases de mayor volumen (CONSTRUCCION,
    // ESPECIFICA) el resultado final superaba con frecuencia los 900 min,
    // muy por encima del techo de seguridad: el recorte lo aplanaba todo
    // a 720 en muchas semanas seguidas, borrando la propia periodización
    // que el algoritmo intentaba crear. 430 deja el margen que faltaba.
    const base = { principiante: 210, intermedio: 360, avanzado: 430 };
    let volumen = base[nivel] || 300;
    if (distancia === '2k') volumen = Math.round(volumen * 0.7);
    else if (distancia === '5k') volumen = Math.round(volumen * 0.85);
    if (objetivo === 'acabar') volumen = Math.round(volumen * 0.85);
    if (objetivo === 'competir') volumen = Math.round(volumen * 1.15);
    if (distancia === 'medio') volumen = Math.round(volumen * 1.1);
    if (distancia === 'maraton') volumen = Math.round(volumen * 1.2);
    if (experiencia === 'no') volumen = Math.round(volumen * 0.9);
    return Math.min(720, Math.max(120, volumen));
  },

  obtenerDiasSeleccionados() {
    const dias = [];
    for (let i = 1; i <= 7; i++) {
      const cb = document.getElementById(`dia${i}`);
      if (cb?.checked) dias.push(i);
    }
    return dias;
  },

  obtenerDiasMinimos(distancia) {
    if (distancia === 'maraton') return 4;
    if (distancia === 'medio') return 3;
    return 2;
  },

  elegirDiaLargoOptimo(diasEntreno) {
    if (diasEntreno.includes(6)) return 6;
    if (diasEntreno.includes(7)) return 7;
    return Math.max(...diasEntreno);
  },

  getColor(tipo) {
    const colores = {
      rodaje: 'sesion-rodaje',
      tempo: 'sesion-tempo',
      series: 'sesion-series',
      largo: 'sesion-largo',
      descanso: 'sesion-descanso',
      strength: 'sesion-strength'
    };
    return colores[tipo] || 'sesion-descanso';
  },

  getLetra(tipo) {
    const letras = {
      rodaje: 'R',
      tempo: 'T',
      series: 'S',
      largo: 'L',
      descanso: 'D',
      strength: 'F'
    };
    return letras[tipo] || '?';
  },

  generarFases(semanasTotales, objetivo, distancia) {
    const fases = [];
    let semanaInicio = 1;
    let duracionBase = Math.round(semanasTotales * 0.4);
    let duracionConstruccion = Math.round(semanasTotales * 0.3);
    let duracionEspecifica = Math.round(semanasTotales * 0.2);
    let duracionPico = Math.round(semanasTotales * 0.05);
    let duracionTaper = semanasTotales - duracionBase - duracionConstruccion - duracionEspecifica - duracionPico;
    if (objetivo === 'acabar') {
      duracionBase += 2;
      duracionEspecifica -= 2;
    }
    if (objetivo === 'competir') {
      duracionBase -= 2;
      duracionEspecifica += 1;
      duracionPico += 1;
    }
    const suma = duracionBase + duracionConstruccion + duracionEspecifica + duracionPico + duracionTaper;
    if (suma > semanasTotales) duracionTaper -= (suma - semanasTotales);
    else if (suma < semanasTotales) duracionEspecifica += (semanasTotales - suma);

    // === TAPER MÍNIMO GARANTIZADO ===
    // Antes, si duracionTaper acababa en 0 (algo frecuente en planes cortos
    // con objetivo "competir", porque ese objetivo alarga precisamente
    // ESPECIFICA y PICO), el plan terminaba directamente en la fase más
    // dura (PICO) sin ningún descanso previo a la carrera. Exigimos al
    // menos 1 semana de taper siempre que el plan tenga 5+ semanas (menos
    // que eso ya no da para periodizar nada), y 2 semanas para medio
    // maratón/maratón con objetivo "competir" (el estándar habitual de
    // reducción de carga antes de esas distancias). Las semanas que hacen
    // falta se quitan de PICO primero y, si no bastan, de ESPECIFICA:
    // nunca de BASE ni CONSTRUCCION, que son la parte del plan donde de
    // verdad se construye la forma física.
    if (semanasTotales >= 5) {
      const taperMinimo = (objetivo === 'competir' && (distancia === 'medio' || distancia === 'maraton')) ? 2 : 1;
      let faltan = taperMinimo - duracionTaper;
      if (faltan > 0) {
        const dePico = Math.min(faltan, duracionPico);
        duracionPico -= dePico;
        faltan -= dePico;
        if (faltan > 0) {
          const deEspecifica = Math.min(faltan, Math.max(0, duracionEspecifica - 1));
          duracionEspecifica -= deEspecifica;
          faltan -= deEspecifica;
        }
        duracionTaper = taperMinimo - faltan;
      }
    }

    if (duracionBase > 0) fases.push({ nombre: 'BASE', inicio: semanaInicio, duracion: duracionBase });
    semanaInicio += duracionBase;
    if (duracionConstruccion > 0) fases.push({ nombre: 'CONSTRUCCION', inicio: semanaInicio, duracion: duracionConstruccion });
    semanaInicio += duracionConstruccion;
    if (duracionEspecifica > 0) fases.push({ nombre: 'ESPECIFICA', inicio: semanaInicio, duracion: duracionEspecifica });
    semanaInicio += duracionEspecifica;
    if (duracionPico > 0) fases.push({ nombre: 'PICO', inicio: semanaInicio, duracion: duracionPico });
    semanaInicio += duracionPico;
    if (duracionTaper > 0) fases.push({ nombre: 'TAPER', inicio: semanaInicio, duracion: duracionTaper });
    return fases;
  },

  obtenerFaseSemana(fases, semanaGlobal) {
    for (const fase of fases) {
      if (semanaGlobal >= fase.inicio && semanaGlobal < fase.inicio + fase.duracion) {
        return { fase: fase.nombre, semanaEnFase: semanaGlobal - fase.inicio + 1, duracionFase: fase.duracion };
      }
    }
    const ultimaFase = fases[fases.length - 1];
    return { fase: ultimaFase?.nombre || 'BASE', semanaEnFase: 1, duracionFase: ultimaFase?.duracion || 1 };
  },

  calcularNivelSemana(semanaGlobal, nivelInicial, semanasTotales) {
    if (nivelInicial === 'principiante') {
      if (semanaGlobal >= this.PROGRESION_NIVEL.principiante.avanzado) return 'avanzado';
      if (semanaGlobal >= this.PROGRESION_NIVEL.principiante.intermedio) return 'intermedio';
      return 'principiante';
    }
    if (nivelInicial === 'intermedio') {
      if (semanaGlobal >= this.PROGRESION_NIVEL.intermedio.avanzado) return 'avanzado';
      return 'intermedio';
    }
    return 'avanzado';
  },

  // Calcula el nivel real de una semana teniendo en cuenta la fase: en
  // TAPER (y siempre que ya se sepa qué fase se está generando) el nivel
  // se CONGELA al que tenía la semana anterior a entrar en taper. Antes
  // calcularNivelSemana solo miraba el número de semana global, así que
  // un principiante podía "subirse" a intermedio justo en la semana de
  // descarga antes de la carrera (o en la última semana de un plan corto
  // sin taper), recibiendo de golpe sesiones de series más complejas
  // (pirámides, series rotas) justo cuando el cuerpo debería estar
  // descansando, no aprendiendo estructuras nuevas.
  calcularNivelSemanaConFase(semanaGlobal, nivelInicial, semanasTotales, fase, nivelCongelado) {
    if (fase === 'TAPER' && nivelCongelado) return nivelCongelado;
    return this.calcularNivelSemana(semanaGlobal, nivelInicial, semanasTotales);
  },

  debeHacerSimulacion(fase, semanaGlobal, semanasTotales, distancia, nivel, objetivo) {
    if (fase !== 'ESPECIFICA' && fase !== 'PICO') return false;
    if (!['10k', 'medio', 'maraton'].includes(distancia)) return false;
    if (nivel === 'principiante') return false;
    const semanaEnFase = semanaGlobal - this.obtenerInicioFase(fase, distancia, semanasTotales, objetivo);
    return semanaEnFase % 3 === 0 && semanaEnFase >= 2 && semanaEnFase <= (fase === 'ESPECIFICA' ? 6 : 4);
  },

  obtenerInicioFase(fase, distancia, semanasTotales, objetivo) {
    const fases = this.generarFases(semanasTotales, objetivo, distancia);
    for (let f of fases) {
      if (f.nombre === fase) return f.inicio;
    }
    return 1;
  },

  seleccionarDiasFuerza(tiposPorDia, diaLargo) {
    const candidatos = [];
    for (let dia = 1; dia <= 7; dia++) {
      const sesion = tiposPorDia[dia];
      if (sesion && sesion.tipo === 'rodaje' && dia !== diaLargo) candidatos.push(dia);
    }
    if (candidatos.length < 2) {
      for (let dia = 1; dia <= 7; dia++) {
        const sesion = tiposPorDia[dia];
        if (sesion && (sesion.tipo === 'tempo' || sesion.tipo === 'series') && dia !== diaLargo) {
          if (!candidatos.includes(dia)) candidatos.push(dia);
        }
      }
    }
    if (candidatos.length < 2) {
      for (let dia = 1; dia <= 7; dia++) {
        const sesion = tiposPorDia[dia];
        if (sesion && sesion.tipo !== 'largo' && dia !== diaLargo) {
          if (!candidatos.includes(dia)) candidatos.push(dia);
        }
      }
    }
    return candidatos.slice(0, 2);
  },

  agregarFuerzaASesion(sesion) {
    if (!sesion.detalle) return;
    const fuerzaMinutos = this.DURACION_FUERZA;
    const descripcion = this.DESCRIPCIONES_FUERZA[Math.floor(Math.random() * this.DESCRIPCIONES_FUERZA.length)];
    sesion.detalle.estructura += ` + ${fuerzaMinutos}' fuerza complementaria (${descripcion.nombre})`;
    const pasoFuerza = {
      icono: '🏋️',
      titulo: `FUERZA COMPLEMENTARIA: ${descripcion.nombre}`,
      accion: `${fuerzaMinutos}' de ejercicios de fuerza: ${descripcion.ejercicios}`,
      porque: descripcion.objetivo
    };
    sesion.detalle.pasosDetallados.push(pasoFuerza);
    sesion.tieneFuerza = true;
  },

  _ajustarDiaPostLargo(tiposPorDia, diaLargo, diasEntreno) {
    const diaSiguiente = diaLargo === 7 ? 1 : diaLargo + 1;
    if (diasEntreno.includes(diaSiguiente) && tiposPorDia[diaSiguiente]) {
      const sesion = tiposPorDia[diaSiguiente];
      if (sesion.tipo !== 'descanso') {
        sesion.tipo = 'rodaje';
        sesion.minutos = 25;
        sesion.esRecuperacion = true;
      }
    }
  },

  // Sustituye a la antigua _garantizarLargoMaximo (que recortaba el
  // rodaje) y a la "GARANTÍA FINAL" que había al final de
  // generarCalendarioEntreno (que recortaba tempo/series/rodaje después de
  // crear las sesiones, dejando a veces el texto de estructura/pasos
  // desactualizado respecto a la duración final -- ver bug real: cabecera
  // "32 min" con un desglose que sumaba 55). Ahora hay un único punto que
  // decide la duración de la tirada larga: en vez de recortar la sesión
  // que se pasa de largo, es la tirada larga la que se alarga lo
  // necesario para seguir siendo, siempre, la más larga de la semana. Se
  // llama DESPUÉS de crear el resto de sesiones de la semana (con sus
  // duraciones reales, ya con los suelos mínimos por nivel aplicados), y
  // ANTES de crear la sesión de la tirada larga -- así su detalle/
  // estructura/pasos se genera ya con la duración final correcta, no se
  // parchea después.
  _calcularDuracionLargoFinal(minutosPlanificados, duracionesOtrasSesiones, nivel, fase, distancia) {
    const maxOtras = duracionesOtrasSesiones.length ? Math.max(...duracionesOtrasSesiones) : 0;
    let duracion = Math.max(minutosPlanificados, maxOtras > 0 ? maxOtras + 5 : 0);
    // Techo de seguridad: aunque se alargue, no dejamos que se dispare muy
    // por encima de su máximo normal para ese nivel/fase/distancia (cubre
    // el caso extremo, ya poco probable tras el arreglo de getMaximosPorTipo
    // para 2K, de que varias sesiones toquen a la vez su propio máximo).
    const maxLargoNormal = this.getMaximosPorTipo('largo', nivel, fase, distancia);
    const techoSeguridad = Math.round(maxLargoNormal * 1.15);
    return Math.min(duracion, techoSeguridad);
  },

  _mejorarDistribucionCalidad(tiposPorDia, diasEntreno, diaLargo) {
    const diasCalidad = [];
    for (let dia of diasEntreno) {
      const sesion = tiposPorDia[dia];
      if (sesion && (sesion.tipo === 'tempo' || sesion.tipo === 'series')) {
        diasCalidad.push({ dia, tipo: sesion.tipo, minutos: sesion.minutos });
      }
    }
    
    for (let i = 0; i < diasCalidad.length - 1; i++) {
      const actual = diasCalidad[i].dia;
      const siguiente = diasCalidad[i+1].dia;
      if (siguiente === actual + 1 || (actual === 7 && siguiente === 1)) {
        let nuevoDia = null;
        for (let d = actual + 1; d <= diaLargo; d++) {
          if (!tiposPorDia[d] && diasEntreno.includes(d)) {
            nuevoDia = d;
            break;
          }
        }
        if (nuevoDia) {
          tiposPorDia[nuevoDia] = tiposPorDia[siguiente];
          delete tiposPorDia[siguiente];
        } else {
          tiposPorDia[siguiente].tipo = 'rodaje';
          tiposPorDia[siguiente].minutos = 30;
        }
      }
    }
    
    for (let diaCalidad of diasCalidad) {
      if (diaCalidad.dia > diaLargo) {
        let nuevoDia = null;
        for (let d = 1; d < diaLargo; d++) {
          if (!tiposPorDia[d] && diasEntreno.includes(d)) {
            nuevoDia = d;
            break;
          }
        }
        if (nuevoDia) {
          tiposPorDia[nuevoDia] = tiposPorDia[diaCalidad.dia];
          delete tiposPorDia[diaCalidad.dia];
        }
      }
    }
  },

  // Objeto de "día de descanso" del calendario -- estaba construido igual,
  // propiedad por propiedad, en los dos sitios de generarCalendarioEntreno()
  // donde un día no tiene sesión (día fuera de diasEntreno, o día dentro de
  // diasEntreno sin ninguna sesión asignada).
  _diaDescanso(diaGlobal, semanaGlobal, diaSemana, fase, nivel) {
    return {
      diaGlobal, semana: semanaGlobal, diaSemana, fase, nivel,
      tipo: 'descanso',
      color: this.getColor('descanso'),
      letra: this.getLetra('descanso'),
      detalle: null,
      tieneFuerza: false
    };
  },

  // ============================================================
  //  DURACIÓN NATIVA POR DISTANCIA (rediseño del reparto de largo/
  //  tempo/series)
  // ============================================================
  // ANTES: largo/tempo/series se calculaban como un % FIJO del volumen
  // semanal total (DISTRIBUCION_TIPOS). El problema de fondo: el volumen
  // semanal total depende del NIVEL y del OBJETIVO del corredor (puede
  // llegar a 650-780 min/semana en avanzado+competir), pero la duración
  // SENSATA de una tirada larga o de una sesión de series depende sobre
  // todo de la DISTANCIA que se está entrenando -- una tirada larga de
  // media maratón no necesita ser más larga solo porque esa semana el
  // volumen total sea alto; necesita ser larga porque la distancia es
  // media maratón. Con el % fijo, un avanzado de alto volumen podía
  // sacar series de 120'+ o tiradas de 150'+ para MEDIA MARATÓN --
  // duraciones propias de entrenamiento de maratón, no de esa distancia.
  //
  // AHORA: cada tipo tiene una duración de REFERENCIA propia de la
  // distancia (a nivel intermedio, en una semana "típica" de fase PICO),
  // que luego se ajusta por nivel del corredor y por la MISMA onda de
  // carga (volumenOnd) que ya hace progresar/descansar el volumen total
  // -- así la tirada larga y las sesiones de calidad también tienen su
  // propia progresión y sus semanas de descarga dentro de una fase, no
  // solo el rodaje. La onda se aplica AMORTIGUADA al 50% (no al 100%):
  // aplicar la onda completa a un solo número de minutos es demasiado
  // agresivo -- el rodaje puede permitirse variar más porque se reparte
  // entre 2-4 días, pero una tirada larga es un único día.
  DURACION_NATIVA_REFERENCIA: {
    largo:  { '2k': 40, '5k': 60, '10k': 80, medio: 95, maraton: 140 },
    tempo:  { '2k': 30, '5k': 40, '10k': 48, medio: 52, maraton: 60 },
    series: { '2k': 32, '5k': 42, '10k': 48, medio: 52, maraton: 58 }
  },
  DURACION_NATIVA_FACTOR_NIVEL: {
    principiante: 0.78,
    intermedio: 1.00,
    avanzado: 1.18
  },

  _duracionNativaPorDistancia(tipo, nivel, distancia, volumenOnd) {
    const tabla = this.DURACION_NATIVA_REFERENCIA[tipo];
    const base = tabla[distancia] ?? tabla.medio;
    const factorNivel = this.DURACION_NATIVA_FACTOR_NIVEL[nivel] ?? 1;
    // Onda amortiguada al 50%, con un clamp de seguridad adicional para
    // que ninguna combinación extrema (fase de mayor volumenBase +
    // semana de pico del ciclo 3:1) dispare el resultado muy por encima
    // de lo previsto -- el tope real por tipo (getMaximosPorTipo) sigue
    // siendo la última palabra, esto es solo para que el valor de
    // partida ya sea sensato en la inmensa mayoría de los casos.
    let ondaAmortiguada = 1 + (volumenOnd - 1) * 0.5;
    ondaAmortiguada = Math.max(0.65, Math.min(1.3, ondaAmortiguada));
    return Math.round(base * factorNivel * ondaAmortiguada);
  },

  async generarCalendarioEntreno() {
    if (!AppState.zonasCalculadas) {
      Utils.showToast("> PRIMERO CALCULA TUS ZONAS_", 'error');
      return;
    }
    // GENERAR un plan nuevo sí requiere premium (solo se puede tener uno
    // "activo" generado a la vez, y esa generación es la función de pago).
    // Ver el calendario de un plan que YA existía (p.ej. generado cuando
    // el usuario aún era premium) es otra cosa y no pasa por aquí: eso lo
    // gestiona mostrarUltimoPlanGuardado()/mostrarCalendario(), que nunca
    // comprueban premium. El botón "+ NUEVO PLAN"/"GENERAR PLAN" además
    // ya viene deshabilitado en la UI si no eres premium (ver
    // actualizarInterfazPremium en app.js); este check es el cinturón de
    // seguridad por si se llega a llamar igualmente.
    if (!AppState.isPremium) {
      Utils.showToast("> SOLO USUARIOS PREMIUM_", 'error');
      return;
    }
    try {
      Utils.showLoading();
      AppState.feedbackSesiones = {};

      const modalidad = document.getElementById("modalidad").value;
      const distancia = document.getElementById("distObjetivo").value;
      const meses = parseInt(document.getElementById("duracionPlan").value);
      let nivel = document.getElementById("nivel").value;
      const experiencia = document.getElementById("experienciaDistancia").value;
      const objetivo = document.getElementById("objetivoPrincipal").value;

      const diasEntreno = this.obtenerDiasSeleccionados();
      let diaLargo = parseInt(document.getElementById("diaLargo").value);
      if (isNaN(diaLargo) || document.getElementById("diaLargo").value === 'auto') {
        diaLargo = this.elegirDiaLargoOptimo(diasEntreno);
      }
      if (!diasEntreno.includes(diaLargo)) {
        Utils.showToast(`⚠️ El día de tirada larga (${["", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"][diaLargo]}) no está marcado como día de entrenamiento.`, 'error');
        Utils.hideLoading();
        return;
      }
      if (nivel === 'avanzado' && diasEntreno.length < 5) {
        Utils.showToast("> NIVEL AVANZADO REQUIERE MÍNIMO 5 DÍAS DE ENTRENO_", 'error');
        Utils.hideLoading();
        return;
      }
      if (diasEntreno.length === 0) {
        Utils.showToast("> SELECCIONA AL MENOS UN DÍA_", 'error');
        Utils.hideLoading();
        return;
      }
      const diasMinimos = this.obtenerDiasMinimos(distancia);
      if (diasEntreno.length < diasMinimos) {
        const etiquetaDistancia = {
          '2k': '2KM', '5k': '5KM', '10k': '10KM',
          'medio': 'MEDIA MARATÓN', 'maraton': 'MARATÓN'
        }[distancia] || distancia.toUpperCase();
        Utils.showToast(`> PARA ${etiquetaDistancia} NECESITAS MÍNIMO ${diasMinimos} DÍAS_`, 'error');
        Utils.hideLoading();
        return;
      }
      if (meses === 1 && !['2k', '5k', '10k'].includes(distancia)) {
        Utils.showToast("> PLAN DE 1 MES SOLO PARA 2KM, 5KM Y 10KM_", 'error');
        Utils.hideLoading();
        return;
      }
      if (['medio', 'maraton'].includes(distancia) && meses === 3 && experiencia === 'no') {
        Utils.showToast("> PARA MEDIA O MARATÓN EN 3 MESES NECESITAS EXPERIENCIA_", 'error');
        Utils.hideLoading();
        return;
      }

      const semanasTotales = meses * 4;
      const fases = this.generarFases(semanasTotales, objetivo, distancia);
      const ritmoBase = AppState.lastRitmoBase;
      const fcUmbral = AppState.lastUL;

      const ahora = new Date();
      // El plan empieza mañana (día siguiente a hoy), no el próximo lunes.
      // diaInicioSemana guarda qué día real de la semana (1=lunes...
      // 7=domingo) es ese "mañana": hace falta más abajo, porque cada
      // semana del plan se recorre por día real (para que diasEntreno/
      // diaLargo, elegidos por día real, caigan siempre en su día
      // correcto) y antes esa vuelta siempre empezaba en lunes porque
      // fechaInicio siempre ERA un lunes. Ahora que puede ser cualquier
      // día, hay que arrancar esa vuelta semanal por el día real que
      // corresponda cada vez, no fijo en lunes.
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() + 1);
      fechaInicio.setHours(0, 0, 0, 0);
      const diaInicioSemana = ((fechaInicio.getDay() + 6) % 7) + 1;

      const distribucionPersonalizada = this.ajustarDistribucionPorDistancia(this.DISTRIBUCION_TIPOS, distancia);

      const planCompleto = [];
      let diaGlobalCounter = 1;

      let ajusteVolumen = 1.0;
      let ajusteIntensidad = 1.0;
      if (AppState.planActualId) {
        const ajustes = await this.analizarFeedbackAdaptativo();
        ajusteVolumen = ajustes.volumen;
        ajusteIntensidad = ajustes.intensidad;
      }

      // Ajuste por ACWR (carga aguda:crónica) sobre la carga REAL ya
      // entrenada, además del ajuste por feedback subjetivo de arriba.
      // Esto es lo que hace que el planificador "tenga en cuenta" el
      // TSS/ACWR real y no solo lo que el usuario ha valorado a mano:
      // si el usuario ha estado acumulando mucha más carga en la última
      // semana que su media de las últimas 4 (ACWR alto = riesgo de
      // lesión por sobrecarga), las próximas semanas se moderan un poco
      // más, aunque el feedback subjetivo no lo hubiera reflejado
      // todavía. Si el ACWR es bajo (se ha entrenado poco últimamente),
      // se permite recuperar algo de volumen en vez de seguir bajando.
      try {
        const carga = await this.calcularCargaEntrenamiento(AppState.currentUserId);
        if (carga && carga.datosSuficientes && carga.acwr !== null) {
          if (carga.acwr > 1.5) {
            ajusteVolumen *= 0.85;
            ajusteIntensidad *= 0.9;
            Utils.showToast(`⚠️ Carga aguda:crónica alta (ACWR ${carga.acwr.toFixed(2)}) — moderamos las próximas semanas para reducir el riesgo de lesión.`, 'warning', 4500);
          } else if (carga.acwr > 1.3) {
            ajusteVolumen *= 0.95;
            ajusteIntensidad *= 0.97;
          } else if (carga.acwr < 0.8) {
            ajusteVolumen *= 1.05;
          }
        }
      } catch (e) {
        console.warn('No se pudo calcular ACWR para ajustar el plan (se sigue solo con el feedback):', e);
      }

      this.ultimaSesionPorTipo = {};
      this.bolsaPorTipo = {};
      let nivelAntesDeTaper = null;

      for (let semanaGlobal = 1; semanaGlobal <= semanasTotales; semanaGlobal++) {
        const faseInfo = this.obtenerFaseSemana(fases, semanaGlobal);
        const { fase, semanaEnFase, duracionFase } = faseInfo;
        const nivelActual = this.calcularNivelSemanaConFase(semanaGlobal, nivel, semanasTotales, fase, nivelAntesDeTaper);
        if (fase !== 'TAPER') nivelAntesDeTaper = nivelActual;

        const { intensidad: intensidadOnd, volumen: volumenOnd } = this.getOndulatoryFactor(semanaEnFase, fase);
        const volumenSemanaPuro = this.calcularVolumenSemanal(nivelActual, experiencia, objetivo, distancia);
        let volumenSemanaBase = Math.round(volumenSemanaPuro * volumenOnd * ajusteVolumen);
        let volumenSemana = Math.round(volumenSemanaBase);
        // Techo SUAVE en vez de un recorte duro a 720: por debajo de 650
        // no se toca nada; por encima, cada minuto de más solo cuenta un
        // 35%. Antes, cualquier semana que superase 720 se aplanaba
        // exactamente a 720, así que en perfiles de alto volumen (p.ej.
        // avanzado+maratón+competir) varias semanas distintas de la
        // periodización acababan mostrando el mismo número, borrando la
        // diferencia entre ellas justo cuando más debería notarse (fases
        // de construcción/específica vs. pico). El techo duro de
        // seguridad (780) se mantiene como límite absoluto, pero ahora
        // rara vez se llega a tocar.
        const TECHO_SUAVE = 650;
        const TECHO_DURO = 780;
        if (volumenSemana > TECHO_SUAVE) {
          volumenSemana = Math.round(TECHO_SUAVE + (volumenSemana - TECHO_SUAVE) * 0.35);
        }
        // PISO PROPORCIONAL en vez de un mínimo absoluto fijo (antes 180
        // minutos siempre). Un suelo fijo de 180 es invisible para
        // perfiles de volumen alto, pero para perfiles de volumen bajo
        // (p.ej. principiante + 5K + "acabar" + sin experiencia, con una
        // base de ~137 min/semana) queda POR ENCIMA de absolutamente
        // todas las semanas del plan, así que el plan entero sale plano
        // a 180 minutos de la semana 1 a la última: sin progresión, sin
        // pico, sin descarga real -- se pierde toda la periodización
        // justo en los perfiles que empiezan desde más abajo. Ahora el
        // suelo es el 35% del volumen semanal base de ESE perfil (antes
        // de aplicar la onda), con un mínimo absoluto de seguridad de 90
        // minutos para que ninguna semana quede en un volumen irrisorio.
        const pisoMinimo = Math.max(90, Math.round(volumenSemanaPuro * 0.35));
        volumenSemana = Math.min(TECHO_DURO, Math.max(pisoMinimo, volumenSemana));

        const intensidadTotal = ajusteIntensidad * intensidadOnd;

        const distribucion = distribucionPersonalizada[nivelActual][fase.toLowerCase()];
        // El % de DISTRIBUCION_TIPOS ya NO fija la duración de largo/tempo/
        // series (ver _duracionNativaPorDistancia) -- se sigue usando solo
        // como PUERTA: si esa fase/nivel tiene un 0% para un tipo (p.ej.
        // principiante no hace series en BASE), ese tipo sigue sin
        // programarse esa semana; si tiene >0%, se programa con su
        // duración nativa de la distancia, no con ese porcentaje.
        let minutosPorTipo = {
          rodaje: 0,
          tempo: distribucion.tempo > 0 ? this._duracionNativaPorDistancia('tempo', nivelActual, distancia, volumenOnd) : 0,
          series: distribucion.series > 0 ? this._duracionNativaPorDistancia('series', nivelActual, distancia, volumenOnd) : 0,
          largo: distribucion.largo > 0 ? this._duracionNativaPorDistancia('largo', nivelActual, distancia, volumenOnd) : 0
        };
        // Si entre largo+tempo+series se comen casi todo (o más) del
        // volumen semanal total de ESE perfil -- típico en volúmenes bajos,
        // p.ej. principiante empezando -- se reduce el conjunto de forma
        // proporcional para dejar siempre al menos un 25% para rodaje,
        // igual que un entrenador real recortaría antes el volumen total
        // que se propone que la duración nativa de una tirada larga.
        const presupuestoCalidadYLargo = Math.round(volumenSemana * 0.75);
        const sumaCalidadYLargo = minutosPorTipo.tempo + minutosPorTipo.series + minutosPorTipo.largo;
        if (sumaCalidadYLargo > presupuestoCalidadYLargo && sumaCalidadYLargo > 0) {
          const factorAjuste = presupuestoCalidadYLargo / sumaCalidadYLargo;
          minutosPorTipo.tempo = Math.round(minutosPorTipo.tempo * factorAjuste);
          minutosPorTipo.series = Math.round(minutosPorTipo.series * factorAjuste);
          minutosPorTipo.largo = Math.round(minutosPorTipo.largo * factorAjuste);
        }

        // REGLA 80/20 (Seiler): la parte "dura" de la semana (tempo+series,
        // zonas de umbral/alta intensidad) no debería superar ~el 20-22%
        // del volumen semanal total; el resto (rodaje+tirada larga,
        // mayoritariamente Z1-Z2) debe ser el ~78-80% restante. Sin esta
        // regla, el reparto por duración nativa podía dejar el bloque duro
        // en 30-45% del volumen -- coherente sesión a sesión, pero no como
        // conjunto semanal, que es donde de verdad se juega el riesgo de
        // sobreentrenamiento según ese modelo. El suelo mínimo por nivel
        // (_minimoDuracionSesion) tiene SIEMPRE la última palabra sobre el
        // porcentaje: una sesión de tempo de 30' no cumple su función
        // fisiológica (no da tiempo real en zona de umbral tras el
        // calentamiento), así que se prioriza que la sesión tenga sentido
        // antes que el porcentaje sea exacto -- en ese caso la semana se
        // queda ligeramente por encima del 20-22%, no se fuerza el recorte.
        const LIMITE_DURO_8020 = 0.22;
        const presupuestoDuro = Math.round(volumenSemana * LIMITE_DURO_8020);
        const sumaDura = minutosPorTipo.tempo + minutosPorTipo.series;
        if (sumaDura > presupuestoDuro && sumaDura > 0) {
          const minSesionCalidad = this._minimoDuracionSesion(nivelActual, fase === 'TAPER');
          const factor8020 = presupuestoDuro / sumaDura;
          if (minutosPorTipo.tempo > 0) {
            minutosPorTipo.tempo = Math.max(minSesionCalidad, Math.round(minutosPorTipo.tempo * factor8020));
          }
          if (minutosPorTipo.series > 0) {
            minutosPorTipo.series = Math.max(minSesionCalidad, Math.round(minutosPorTipo.series * factor8020));
          }
        }

        minutosPorTipo.rodaje = Math.max(0, volumenSemana - minutosPorTipo.tempo - minutosPorTipo.series - minutosPorTipo.largo);

        let suma = minutosPorTipo.rodaje + minutosPorTipo.tempo + minutosPorTipo.series + minutosPorTipo.largo;
        if (suma !== volumenSemana) {
          const diff = volumenSemana - suma;
          minutosPorTipo.rodaje = Math.max(0, minutosPorTipo.rodaje + diff);
        }

        const minSeries = this._minimoDuracionSesion(nivelActual, fase === 'TAPER');
        if (minutosPorTipo.series < minSeries && minutosPorTipo.series > 0) {
          const deficit = minSeries - minutosPorTipo.series;
          minutosPorTipo.series = minSeries;
          minutosPorTipo.rodaje = Math.max(0, minutosPorTipo.rodaje - deficit);
        }

        const tiposPorDia = {};
        const diasDisponibles = [...diasEntreno];
        
        if (minutosPorTipo.largo > 0) {
          let largoMinimo = 45;
          if (fase === 'CONSTRUCCION') largoMinimo = 60;
          if (fase === 'ESPECIFICA' || fase === 'PICO') largoMinimo = 90;
          if (minutosPorTipo.largo < largoMinimo) minutosPorTipo.largo = largoMinimo;
          const maxLargo = this.getMaximosPorTipo('largo', nivelActual, fase, distancia);
          minutosPorTipo.largo = Math.min(minutosPorTipo.largo, maxLargo);
          const esSimulacion = this.debeHacerSimulacion(fase, semanaGlobal, semanasTotales, distancia, nivelActual, objetivo);
          tiposPorDia[diaLargo] = { tipo: 'largo', minutos: minutosPorTipo.largo, esSimulacion };
          const index = diasDisponibles.indexOf(diaLargo);
          if (index > -1) diasDisponibles.splice(index, 1);
        }

        // MEJORA (ajustada a por-FASE, no por-semana): antes tempo iba
        // siempre primero y series siempre segundo, toda la duración del
        // plan -- eso, combinado con que diasLibres nunca cambiaba de
        // orden, hacía que el mismo día de la semana recibiera siempre el
        // mismo tipo de calidad (p.ej. "martes tempo, miércoles series")
        // fijo de la semana 1 a la última, sin ni una sola excepción en
        // todo el plan. Pero variarlo semana a semana tampoco es lo
        // correcto: un entrenador real mantiene el esqueleto semanal
        // ESTABLE dentro de un mismo bloque de entrenamiento (rutina real,
        // adaptación consistente) y solo lo reorganiza al cambiar de fase
        // (BASE/CONSTRUCCIÓN/ESPECÍFICA/PICO/TAPER) -- es literalmente lo
        // que documenta Runna de su propio motor: mantienen el horario
        // consistente y solo lo ajustan en las transiciones de fase. Por
        // eso la rotación se calcula a partir de la FASE, no de
        // semanaGlobal: constante mientras se esté en la misma fase,
        // cambia solo al entrar en la siguiente.
        const FASES_ORDEN = { BASE: 0, CONSTRUCCION: 1, ESPECIFICA: 2, PICO: 3, TAPER: 4 };
        const indiceFase = FASES_ORDEN[fase] ?? 0;
        const alternarOrdenCalidad = indiceFase % 2 === 1;
        const tiposCalidad = [];
        if (alternarOrdenCalidad) {
          if (minutosPorTipo.series > 0) tiposCalidad.push({ tipo: 'series', minutos: minutosPorTipo.series });
          if (minutosPorTipo.tempo > 0) tiposCalidad.push({ tipo: 'tempo', minutos: minutosPorTipo.tempo });
        } else {
          if (minutosPorTipo.tempo > 0) tiposCalidad.push({ tipo: 'tempo', minutos: minutosPorTipo.tempo });
          if (minutosPorTipo.series > 0) tiposCalidad.push({ tipo: 'series', minutos: minutosPorTipo.series });
        }
        
        let diasLibres = [...diasDisponibles];
        let ajusteJitterCalidad = 0;
        // MEJORA (ajustada a por-FASE): rotación de diasLibres a partir de
        // la fase, no de la semana. diasDisponibles (los días de entreno
        // menos el de la tirada larga) es el MISMO conjunto de días
        // durante todo el plan, así que sin esto la selección de índices
        // de más abajo -- que es determinista dado un mismo diasLibres --
        // acababa eligiendo siempre exactamente los mismos días de la
        // semana para calidad, plan entero, sin variar ni una sola vez.
        // Rotando el ORDEN del array según la fase actual (constante
        // dentro del bloque, cambia solo al pasar a la siguiente fase, en
        // vez de aleatorio o semanal) cambia qué días concretos les tocan
        // en cada bloque de entrenamiento sin tocar ni una línea de la
        // lógica de selección/colisión que ya hay más abajo -- esa lógica
        // solo trabaja con índices, así que le da igual en qué orden
        // vengan los días.
        if (diasLibres.length > 1) {
          const offsetFase = indiceFase % diasLibres.length;
          diasLibres = [...diasLibres.slice(offsetFase), ...diasLibres.slice(0, offsetFase)];
        }
        if (tiposCalidad.length > 0 && diasLibres.length > 0) {
          // Si hay MENOS días libres que tipos de calidad por colocar (p.ej.
          // solo queda 1 día libre pero la semana pide tempo Y series --
          // posible con solo 2 días/semana, el mínimo permitido para 2K/5K/
          // 10K), antes se producía una colisión silenciosa: el índice del
          // segundo tipo caía en el MISMO día que el primero (mismo cálculo
          // de "idx" para ambos), así que lo SOBRESCRIBÍA en tiposPorDia --
          // y como sus minutos ya se habían restado de tiposCalidad[i].minutos
          // antes de la sobreescritura, ese tipo de sesión entero
          // desaparecía de la semana sin dejar rastro (ni como sesión de
          // calidad propia ni sumando al rodaje). Ahora solo se colocan
          // tantos tipos de calidad como días libres haya sitio (con índices
          // siempre distintos); el/los que no caben se quedan con sus
          // minutos SIN restar, y el bloque de más abajo
          // (minutosRodajeTotal) ya los pliega sobre el rodaje de la semana
          // en vez de perderlos.
          const numCalidad = Math.min(tiposCalidad.length, diasLibres.length);
          let step = Math.floor(diasLibres.length / numCalidad);
          if (step < 1) step = 1;
          let indicesAsignados = [];
          for (let i = 0; i < numCalidad; i++) {
            let idx = Math.min(i * step, diasLibres.length - 1);
            if (i > 0 && idx === indicesAsignados[i-1] + 1 && diasLibres.length > numCalidad) {
              idx = Math.min(idx + 1, diasLibres.length - 1);
            }
            indicesAsignados.push(idx);
          }
          indicesAsignados.sort((a,b) => a - b);
          // MEJORA (punto 3): variación controlada de ±8% en la duración de
          // tempo/series, con el mismo espíritu que ya existía para el
          // rodaje (línea de 'variacion' más abajo, en el bloque de
          // rodaje). Sin esto, en semanas de poco volumen tempo y series
          // podían salir con exactamente los mismos minutos entre sí y con
          // el rodaje, porque los tres topaban con el mismo suelo mínimo
          // por sesión -- justo lo que se notaba "todo igual" en la primera
          // semana de un plan. El ajuste (que puede ser positivo o
          // negativo) se registra en ajusteJitterCalidad y se resta del
          // total de rodaje más abajo, para que el volumen semanal total
          // no cambie ni un minuto por esto: solo se redistribuye entre
          // sesiones.
          for (let i = 0; i < numCalidad; i++) {
            const dia = diasLibres[indicesAsignados[i]];
            const calidad = tiposCalidad[i];
            const max = this.getMaximosPorTipo(calidad.tipo, nivelActual, fase, distancia);
            const minutosBase = Math.min(calidad.minutos, max);
            const variacionCalidad = 0.92 + Math.random() * 0.16;
            let minutosDia = Math.round(minutosBase * variacionCalidad);
            // Mismo arreglo que en el reparto de rodaje (ver más abajo,
            // 'clampRodaje'): cuando minutosBase ya viene igualada al tope
            // (calidad.minutos >= max, típico en niveles altos donde la
            // duración "nativa" de tempo/series supera el tope de la fase),
            // la variación de arriba empuja por encima del tope la mitad
            // de las veces, y el Math.min de recorte devolvía siempre el
            // mismo número exacto -- incoherente semana a semana dentro
            // del mismo bloque. Igual que en rodaje, si toca recortar se
            // recorta a un punto variable (93%-100% del tope), no siempre
            // al tope exacto.
            minutosDia = (minutosDia > max)
              ? Math.round(max * (0.93 + Math.random() * 0.07))
              : Math.max(20, minutosDia);
            tiposPorDia[dia] = { tipo: calidad.tipo, minutos: minutosDia };
            ajusteJitterCalidad += (minutosDia - minutosBase);
            calidad.minutos -= minutosBase;
          }
          diasLibres = diasLibres.filter((_, idx) => !indicesAsignados.includes(idx));
        }

        let minutosRodajeTotal = minutosPorTipo.rodaje - ajusteJitterCalidad;
        tiposCalidad.forEach(q => { if (q.minutos > 0) minutosRodajeTotal += q.minutos; });
        const numDiasRodaje = diasLibres.length;
        if (numDiasRodaje > 0 && minutosRodajeTotal > 0) {
          const maxRodaje = this.getMaximosPorTipo('rodaje', nivelActual, fase, distancia);
          const minRodaje = 35;
          // BUG CORREGIDO (reportado con evidencia real: rodajes idénticos,
          // sesión tras sesión, semana tras semana, dentro del mismo bloque
          // -- p.ej. "81, 81, 81, 81" en avanzado/CONSTRUCCION, "60, 60,
          // 60, 60" en intermedio/BASE). La causa de fondo: con pocos días
          // de rodaje por semana (2-3) y volumen alto, la demanda total
          // supera con frecuencia numDiasRodaje × maxRodaje -- es
          // matemáticamente imposible repartirla sin tocar el tope en
          // varios días. Un primer intento (recortar a un punto variable
          //93%-100% del tope en vez de al tope exacto) no bastaba: el
          // paso de reequilibrado de más abajo, al intentar cuadrar el
          // total exacto de la semana, volvía a empujar cada día saturado
          // hasta el MISMO tope compartido, y como todos comparten ese
          // único techo, acababan clonados igualmente.
          // Arreglo de fondo: cada día tiene su propio techo INDIVIDUAL,
          // sorteado una sola vez antes de repartir nada (93%-100% del
          // tope del tipo/fase). Tanto el reparto inicial como el
          // reequilibrado posterior respetan el techo de CADA día, no un
          // techo compartido -- así que, aunque varios días acaben
          // saturados por la demanda excesiva, se saturan cada uno en su
          // propio número (p.ej. 57 y 60, no 60 y 60), y nunca convergen
          // todos al mismo valor por mucho que se repita la generación.
          const numDias = diasLibres.length;
          const techosSuaves = Array.from({ length: numDias }, () => Math.round(maxRodaje * (0.93 + Math.random() * 0.07)));
          let valores = [];
          let sumaValores = 0;
          let valorBase = minutosRodajeTotal / numDias;
          for (let i = 0; i < numDias; i++) {
            let variacion = 0.9 + Math.random() * 0.2;
            let valor = Math.round(valorBase * variacion);
            valor = Math.max(minRodaje, Math.min(techosSuaves[i], valor));
            valores.push(valor);
            sumaValores += valor;
          }
          if (sumaValores !== minutosRodajeTotal) {
            const diff = minutosRodajeTotal - sumaValores;
            const signo = Math.sign(diff);
            // Si tocaría subir un día que ya está en SU techo individual,
            // se salta ese día en vez de forzarlo por encima -- y si
            // NINGÚN día tiene ya margen bajo su propio techo, se acepta
            // que el total de la semana quede un poco por debajo del
            // volumen teórico: un entrenador real prioriza no pasarse del
            // tope de una sesión antes que cuadrar el minuto exacto de la
            // semana.
            for (let i = 0; i < Math.abs(diff); i++) {
              let idx = i % valores.length;
              const nuevoValor = valores[idx] + signo;
              if (signo > 0 && nuevoValor > techosSuaves[idx]) continue;
              valores[idx] = Math.max(minRodaje, Math.min(techosSuaves[idx], nuevoValor));
            }
          }
          for (let i = 0; i < numDias; i++) {
            const dia = diasLibres[i];
            tiposPorDia[dia] = { tipo: 'rodaje', minutos: valores[i] };
          }
        } else {
          for (let i = 0; i < numDiasRodaje; i++) {
            const dia = diasLibres[i];
            tiposPorDia[dia] = { tipo: 'rodaje', minutos: 35 };
          }
        }

        for (let dia of diasLibres) {
          if (!tiposPorDia[dia]) {
            tiposPorDia[dia] = { tipo: 'rodaje', minutos: 35 };
          }
        }

        this._ajustarDiaPostLargo(tiposPorDia, diaLargo, diasEntreno);
        this._mejorarDistribucionCalidad(tiposPorDia, diasEntreno, diaLargo);

        const diasFuerza = this.seleccionarDiasFuerza(tiposPorDia, diaLargo);

        // Se crea primero todo el resto de sesiones de la semana (con su
        // duración real ya definitiva, suelo mínimo por nivel incluido), y
        // la tirada larga se crea la ÚLTIMA, mirando esas duraciones reales
        // -- así, en vez de recortar después la sesión que se pase de
        // larga, es la tirada larga la que se alarga lo necesario para
        // seguir siendo siempre la más larga, y se genera ya con su
        // duración definitiva (ver _calcularDuracionLargoFinal más arriba).
        const sesionesPorDia = {};
        for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
          if (diaSemana === diaLargo) continue; // se crea después
          if (!diasEntreno.includes(diaSemana) || !tiposPorDia[diaSemana]) {
            sesionesPorDia[diaSemana] = { esDescanso: true };
            continue;
          }
          const { tipo, minutos, esSimulacion, esRecuperacion } = tiposPorDia[diaSemana];
          const sesion = await this.crearSesionDesdeMatriz(
            { tipo, esSimulacion: esSimulacion || false, esRecuperacion: esRecuperacion || false },
            true,
            fase,
            semanaEnFase,
            nivelActual,
            { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo },
            ajusteVolumen,
            intensidadTotal,
            minutos
          );
          sesionesPorDia[diaSemana] = {
            diaSemana, fase, tipo,
            color: this.getColor(tipo),
            letra: this.getLetra(tipo),
            tieneFuerza: false,
            ...sesion
          };
        }

        const infoLargo = tiposPorDia[diaLargo];
        if (infoLargo) {
          const duracionesOtrasSesiones = Object.values(sesionesPorDia)
            .filter(s => !s.esDescanso && s.duracion)
            .map(s => s.duracion);
          const duracionFinalLargo = this._calcularDuracionLargoFinal(
            infoLargo.minutos, duracionesOtrasSesiones, nivelActual, fase, distancia
          );
          const sesionLargo = await this.crearSesionDesdeMatriz(
            { tipo: 'largo', esSimulacion: infoLargo.esSimulacion || false, esRecuperacion: false },
            true,
            fase,
            semanaEnFase,
            nivelActual,
            { modalidad, distancia, ritmoBase, fcUmbral, semanasTotales, semanaGlobal, objetivo },
            ajusteVolumen,
            intensidadTotal,
            duracionFinalLargo,
            duracionFinalLargo // maximoForzado: ya viene topado por _calcularDuracionLargoFinal; no se vuelve a recortar al máximo "normal" del tipo.
          );
          sesionesPorDia[diaLargo] = {
            diaSemana: diaLargo, fase, tipo: 'largo',
            color: this.getColor('largo'),
            letra: this.getLetra('largo'),
            tieneFuerza: false,
            ...sesionLargo
          };
        } else {
          sesionesPorDia[diaLargo] = { esDescanso: true };
        }

        // diaGlobal se numera en el orden real del calendario (día 1 =
        // fechaInicio, día 2 = fechaInicio+1, ...), no siempre lunes-
        // domingo: se recorre a partir de diaInicioSemana (el día real en
        // el que cae fechaInicio) y se da la vuelta al llegar a domingo,
        // para que cada día de sesionesPorDia (indexado por día real)
        // caiga en su fecha real correcta.
        const semana = [];
        for (let i = 0; i < 7; i++) {
          const diaSemana = ((diaInicioSemana - 1 + i) % 7) + 1;
          const s = sesionesPorDia[diaSemana];
          if (s.esDescanso) {
            semana.push(this._diaDescanso(diaGlobalCounter++, semanaGlobal, diaSemana, fase, nivelActual));
          } else {
            semana.push({ diaGlobal: diaGlobalCounter++, semana: semanaGlobal, nivel: nivelActual, ...s });
          }
        }

        for (const dia of diasFuerza) {
          const sesion = semana.find(s => s.diaSemana === dia && s.tipo !== 'descanso');
          if (sesion && sesion.detalle) {
            this.agregarFuerzaASesion(sesion);
          }
        }

        planCompleto.push(...semana);
      }

      const planId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const mapaDist = { "2k": "2 km", "5k": "5 km", "10k": "10 km", "medio": "MEDIA", "maraton": "MARATÓN" };

      const planParaGuardar = {
        params: {
          modalidad, distancia, duracion: meses,
          diasPorSemana: diasEntreno.length,
          nivel, experiencia, objetivo, diaLargo,
          diasEntreno, planId,
          ritmoBase: AppState.lastRitmoBase,
          fcMax: AppState.lastFC,
          fcUmbral: AppState.lastUL,
          fechaInicio: fechaInicio.toISOString()
        },
        sesiones: planCompleto,
        feedback: {},
        ajustes: {},
        // Nombre editable del plan (ver editarNombrePlan() en index.html).
        // Por defecto se rellena con la distancia objetivo; el usuario
        // puede cambiarlo por algo suyo, p.ej. "Maratón de Sevilla".
        nombrePlan: mapaDist[distancia] || 'Mi plan',
        resumen: `${mapaDist[distancia] || distancia} · ${diasEntreno.length} días · Nivel ${nivel}`,
        fechaCreacion: new Date().toISOString()
      };

      await this.guardarPlanEnFirebase(planId, planParaGuardar);

      AppState.planGeneradoActual = planParaGuardar.params;
      AppState.planActualId = planId;
      AppState.sesionesRealizadas = {};
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;

      const nombreDiaLargo = ["", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][diaLargo];
      const nombreDiaInicio = ["", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][diaInicioSemana];
      const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      document.getElementById("resumenObjetivo").innerHTML = `
        <strong>${mapaDist[distancia]}</strong> · ${diasEntreno.length} DÍAS/SEMANA<br>
        <span style="color: var(--text-secondary); font-size: 13px;">
          ${nivel.toUpperCase()} · OBJ: ${objetivo.toUpperCase()} · 
          🏆 TIRADA LARGA: <strong>${nombreDiaLargo}</strong>
        </span>
        <div style="margin-top: 8px; font-size: 12px; color: var(--accent-yellow);">
          📅 El plan comienza el <strong>${fechaInicioFormateada}</strong> (${nombreDiaInicio})
        </div>
      `;
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planParaGuardar.nombrePlan;

      document.getElementById("calendarioEntreno").style.display = "block";
      document.getElementById("cuestionarioEntreno").style.display = "none";

      this.mostrarCalendario(planCompleto);
      Utils.scrollToElement('calendarioEntreno', -20);
      Utils.showToast('✅ PLAN GENERADO', 'success');

    } catch (error) {
      console.error('Error:', error);
      Utils.showToast(error.message || 'Error al generar plan', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async guardarPlanEnFirebase(planId, planData) {
    if (!AppState.currentUserId) return;
    try {
      const dataToSave = { ...planData, sesionesRealizadas: {} };
      await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(planId)
        .set(dataToSave);
      await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .update({ ultimoPlanId: planId });
    } catch (error) {
      console.error('Error guardando plan:', error);
      Utils.showToast('Error al guardar el plan', 'error');
    }
  },

  // Recalcula SOLO detalle.distanciaEstimada de cada sesión del plan
  // ACTUAL del usuario, con la fórmula corregida de calcularMetricasSesion
  // (calentamiento/parte principal/enfriamiento con su propio ritmo, y ese
  // ritmo ya sin dividir por factorIntensidad -- ver los comentarios en
  // calcularMetricasSesion). No toca nada más de cada sesión (nombre,
  // estructura, pasos, zona, fechas, TSS...) ni las sesiones que YA estén
  // marcadas como realizadas: esas guardan su resultado real en
  // globalFeed/sesionesRealizadas por separado, y no se ven afectadas.
  //
  // Con el ritmo ya independiente de factorIntensidad, calcularMetricasSesion
  // da SIEMPRE la misma distancia sin importar qué factorIntensidad se le
  // pase -- por eso aquí es seguro usar 1.0 para cualquier sesión, antigua
  // o recién generada. El TSS SÍ depende legítimamente de factorIntensidad
  // (una semana suave debe pesar menos en la carga), y como aquí no se
  // conoce el factor real de periodización de cada sesión, TSS no se
  // toca -- así no se pisa el TSS periodizado correcto de sesiones ya
  // generadas con el fix.
  //
  // ANTES esto era un botón visible ("🔄 ACTUALIZAR KM DEL PLAN") que el
  // usuario tenía que pulsar a mano tras el fix del ritmo/factorIntensidad
  // en la generación. Ya no hace falta: esta función se llama ahora sola,
  // en silencio, cada vez que se carga el plan (ver mostrarUltimoPlanGuardado)
  // -- así cualquier plan generado ANTES del fix se pone al día él solo, sin
  // pedirle nada al usuario, y los planes generados DESPUÉS del fix (que ya
  // salen bien) no notan ningún cambio porque esta función es un no-op
  // cuando todo ya coincide.
  async recalcularDistanciasPlanActual(silencioso = false) {
    if (!AppState.currentUserId || !AppState.planActualId) {
      if (!silencioso) Utils.showToast('No hay un plan activo que recalcular', 'info');
      return;
    }
    try {
      if (!silencioso) Utils.showLoading('Comprobando distancias del plan...');
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      const planDoc = await planRef.get();
      if (!planDoc.exists) { if (!silencioso) Utils.hideLoading(); return; }

      const planData = planDoc.data();
      const sesiones = planData.sesiones || [];
      let cambios = 0;
      sesiones.forEach(s => {
        if (!s || s.tipo === 'descanso' || !s.detalle) return;
        const metricas = this.calcularMetricasSesion({ tipo: s.tipo, duracion: s.duracion, detalle: s.detalle }, 1.0);
        const distNueva = Math.round((metricas.distanciaTotal || 0) * 100) / 100;
        if (Math.abs(distNueva - (s.detalle.distanciaEstimada || 0)) > 0.005) {
          s.detalle.distanciaEstimada = distNueva;
          cambios++;
        }
      });

      if (cambios > 0) await planRef.update({ sesiones });
      if (!silencioso) {
        Utils.hideLoading();
        Utils.showToast(cambios > 0 ? `✅ ${cambios} sesiones actualizadas` : 'Tu plan ya estaba al día', 'success');
      }

      // Refresca la vista del calendario ya abierta (si lo está) para ver
      // los km nuevos sin tener que salir y volver a entrar a la pestaña
      // PLAN. En modo silencioso solo si de verdad hubo cambios, para no
      // repintar el calendario en cada carga sin necesidad.
      if (cambios > 0 && typeof this.mostrarCalendario === 'function') {
        this.mostrarCalendario(sesiones);
      }
    } catch (error) {
      console.error('Error recalculando distancias del plan:', error);
      if (!silencioso) {
        Utils.hideLoading();
        Utils.showToast('Error al recalcular el plan', 'error');
      }
    }
  },

  mostrarCalendario(sesiones) {
    const grid = document.getElementById("calendarioGrid");
    const navegacion = document.getElementById("calendarioNavegacion");
    if (!grid) return;

    // Fecha real de inicio del plan (ya se genera y se guarda al crear el
    // plan). A partir de aquí, cada sesión tiene una fecha real de
    // calendario: fechaInicio + (diaGlobal - 1) días.
    const fechaInicioStr = AppState.planGeneradoActual?.fechaInicio;
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    this._fechaInicioPlan = fechaInicio;
    this._sesionesActuales = sesiones;

    this._sesionesPorFecha = {};
    let ultimoDiaGlobal = 0;
    sesiones.forEach(s => {
      if (!s || !s.diaGlobal) return;
      const f = new Date(fechaInicio);
      f.setDate(f.getDate() + (s.diaGlobal - 1));
      this._sesionesPorFecha[this._dateKey(f)] = s;
      if (s.diaGlobal > ultimoDiaGlobal) ultimoDiaGlobal = s.diaGlobal;
    });
    const fechaFinPlan = new Date(fechaInicio);
    fechaFinPlan.setDate(fechaFinPlan.getDate() + Math.max(ultimoDiaGlobal - 1, 0));
    this._fechaFinPlan = fechaFinPlan;

    // Mes a mostrar: si hoy cae dentro del plan, el mes de hoy; si no, el
    // primer mes del plan. Solo se decide una vez por apertura de plan.
    if (!AppState.calendarioMesActual) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const dentroDelPlan = hoy >= fechaInicio && hoy <= fechaFinPlan;
      const base = dentroDelPlan ? hoy : fechaInicio;
      AppState.calendarioMesActual = new Date(base.getFullYear(), base.getMonth(), 1).toISOString();
    }

    navegacion.style.display = 'flex';
    this.renderizarMes();
    this.renderizarWidgetCarga().catch(err => console.warn('Error mostrando carga de entrenamiento:', err));

    // Antes aquí se insertaba un aviso ("puedes ver detalles de las
    // primeras/próximas 2 semanas...") debajo de la nota del plan cuando
    // el usuario no era premium. Se elimina por completo: no es cierto
    // (con el plan gratis no se puede ver el detalle de NINGUNA sesión,
    // ni de las primeras semanas ni de ninguna otra) y ya queda claro al
    // pulsar un día, que abre directamente el modal de HAZTE PREMIUM
    // (ver abrirDetalleSesion más abajo).
    const msgAnterior = document.querySelector('.premium-expired-message');
    if (msgAnterior) msgAnterior.remove();
  },

  _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  renderizarMes() {
    const grid = document.getElementById("calendarioGrid");
    if (!grid || !AppState.calendarioMesActual) return;
    const mes = new Date(AppState.calendarioMesActual);
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    // Lunes=0 ... Domingo=6 (getDay() da Domingo=0)
    const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7;
    const totalDiasMes = ultimoDiaMes.getDate();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const sesiones = this._sesionesActuales || [];

    let html = '';
    for (let i = 0; i < primerDiaSemana; i++) {
      html += '<div class="calendario-dia calendario-dia-vacio"></div>';
    }
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const fecha = new Date(year, month, dia);
      const key = this._dateKey(fecha);
      const sesion = this._sesionesPorFecha[key];
      const esHoy = fecha.getTime() === hoy.getTime() ? ' hoy' : '';

      if (!sesion) {
        const dentroDelPlan = this._fechaInicioPlan && this._fechaFinPlan
          && fecha >= this._fechaInicioPlan && fecha <= this._fechaFinPlan;
        html += `<div class="calendario-dia calendario-dia-vacio${dentroDelPlan ? ' sesion-descanso' : ''}${esHoy}"><div class="dia-numero">${dia}</div></div>`;
        continue;
      }

      const yaRealizada = !!AppState.sesionesRealizadas?.[sesion.diaGlobal];
      // Un día "perdido" es uno de entreno de verdad (no descanso) cuya
      // fecha ya pasó y que nunca se marcó como realizado. Se calcula solo
      // comparando fechas -- no hace falta ningún proceso en segundo plano
      // ni tocar la base de datos, se recalcula solo cada vez que se pinta
      // el calendario.
      const esPerdida = !yaRealizada && sesion.tipo !== 'descanso' && fecha < hoy;
      const realizada = yaRealizada ? 'realizado' : (esPerdida ? 'perdida' : '');
      let faseColor = '';
      if (sesion.fase && this.FASES[sesion.fase]) faseColor = this.FASES[sesion.fase].color;
      const faseIndicator = faseColor ? ` style="border-top: 4px solid ${faseColor};"` : '';
      let contenidoHtml = `<div class="dia-numero">${dia}</div>`;
      if (sesion.tipo !== 'descanso' && sesion.detalle) {
        const tiempo = sesion.duracion || '?';
        let letra = sesion.letra;
        if (sesion.tieneFuerza) letra += '+F';
        contenidoHtml += `<strong>${Utils.escapeHTML(letra)}</strong><div>${tiempo}'</div>`;
      } else {
        contenidoHtml += `<strong>D</strong><div>—</div>`;
      }
      html += `<div class="calendario-dia ${sesion.color} ${realizada}${esHoy}" data-dia-global="${sesion.diaGlobal}"${faseIndicator}>${contenidoHtml}</div>`;
    }

    grid.innerHTML = html;
    this.agregarLeyendaFases();

    const tituloEl = document.getElementById('calendarioMesTitulo');
    if (tituloEl) {
      const nombreMes = mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      tituloEl.textContent = nombreMes.toUpperCase();
    }
    const anteriorBtn = document.getElementById('calendarioAnterior');
    const siguienteBtn = document.getElementById('calendarioSiguiente');
    const paginaSpan = document.getElementById('calendarioPagina');
    if (paginaSpan) paginaSpan.style.display = 'none';
    // Límites de navegación: no dejar ir a meses fuera del rango del plan.
    if (anteriorBtn && this._fechaInicioPlan) {
      const limiteAnterior = new Date(this._fechaInicioPlan.getFullYear(), this._fechaInicioPlan.getMonth(), 1);
      anteriorBtn.disabled = primerDiaMes <= limiteAnterior;
    }
    if (siguienteBtn && this._fechaFinPlan) {
      const limiteSiguiente = new Date(this._fechaFinPlan.getFullYear(), this._fechaFinPlan.getMonth(), 1);
      siguienteBtn.disabled = primerDiaMes >= limiteSiguiente;
    }

    document.querySelectorAll('.calendario-dia[data-dia-global]').forEach(diaEl => {
      diaEl.addEventListener('click', (e) => {
        const diaGlobal = parseInt(e.currentTarget.dataset.diaGlobal);
        const sesion = sesiones[diaGlobal - 1];
        if (sesion) this.abrirDetalleSesion(sesion, diaGlobal);
        else console.warn('No se encontró sesión para el día', diaGlobal);
      });
    });
  },

  agregarLeyendaFases() {
    const contenedor = document.querySelector('.calendario-navegacion');
    if (!contenedor) return;
    if (document.getElementById('leyenda-fases')) return;
    const leyenda = document.createElement('div');
    leyenda.id = 'leyenda-fases';
    leyenda.style.cssText = 'display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 11px; flex-wrap: wrap;';
    for (const [fase, datos] of Object.entries(this.FASES)) {
      const item = document.createElement('span');
      item.innerHTML = `<span style="display:inline-block; width:12px; height:12px; background-color:${datos.color}; margin-right:4px;"></span> ${datos.nombre}`;
      leyenda.appendChild(item);
    }
    contenedor.parentNode.insertBefore(leyenda, contenedor.nextSibling);
  },

  async cambiarTrimestre(delta) {
    // Se mantiene el nombre "cambiarTrimestre" para no tener que tocar el
    // onclick del HTML, pero ahora navega por MESES reales del calendario
    // en vez de páginas de 12 semanas.
    if (!AppState.calendarioMesActual) return;
    const actual = new Date(AppState.calendarioMesActual);
    const nuevo = new Date(actual.getFullYear(), actual.getMonth() + delta, 1);
    AppState.calendarioMesActual = nuevo.toISOString();
    this.renderizarMes();
    if (window.UI) UI.guardarEstado();
  },

  abrirDetalleSesion(sesion, diaIndex) {
    console.log('abrirDetalleSesion llamado', sesion, diaIndex);
    if (!sesion) {
      console.error('Sesión no encontrada para índice', diaIndex);
      return;
    }
    if (!AppState.puedeVerDetalleSesion()) {
      // Usuario gratis: puede ver el calendario del plan, pero al pulsar
      // sobre cualquier día se le muestra el modal de beneficios premium
      // (con el enlace a Instagram) en vez del detalle de la sesión.
      if (window.showPremiumBenefits) showPremiumBenefits();
      else Utils.showToast('⭐ Premium necesario para ver detalles de sesiones', 'warning');
      return;
    }
    AppState.currentSesionDetalle = { sesion, diaIndex, planId: AppState.planActualId };
    const modal = document.getElementById("detalleSesion");
    const overlay = document.getElementById("modalOverlay");
    const wrapper = document.getElementById("modalColorWrapper");
    const titulo = document.getElementById("tituloSesion");
    const descripcion = document.getElementById("descripcionSesion");
    const checkboxContainer = document.getElementById("sesionCheckboxContainer");
    const checkbox = document.getElementById("sesionRealizada");
    const feedbackContainer = document.getElementById("sesionFeedbackContainer");
    // Reset de scroll al abrir: #detalleSesion y su wrapper interno
    // (#modalColorWrapper, el que realmente hace scroll -- ver CSS
    // "#detalleSesion .modal-content") son DOS contenedores con scroll
    // propio y el modal es HTML fijo que nunca se destruye, solo se
    // oculta/muestra con la clase "visible". Sin este reset, reabrir el
    // mismo día (o cualquier otro) después de haber bajado el scroll lo
    // dejaba exactamente donde se quedó la última vez, en vez de arriba.
    if (modal) modal.scrollTop = 0;
    if (wrapper) wrapper.scrollTop = 0;
    wrapper.className = "modal-content";
    if (sesion.tipo !== 'descanso' && sesion.detalle) {
      wrapper.classList.add(sesion.color);
      let icono = "";
      if (sesion.tipo === 'rodaje') icono = "🏃‍♂️";
      else if (sesion.tipo === 'tempo') icono = "⚡";
      else if (sesion.tipo === 'series') icono = "🔁";
      else if (sesion.tipo === 'largo') icono = "📏";
      const faseTexto = sesion.fase ? ` · ${this.FASES[sesion.fase]?.nombre || sesion.fase}` : '';
      titulo.innerText = `${icono} ${sesion.tipo.toUpperCase()}${faseTexto}: ${sesion.detalle.nombre}`;
      // Reutiliza sesion.detalle.tssEstimada/distanciaEstimada (ya
      // calculados en la generación del plan con el factor de intensidad
      // real de esa semana) en vez de recalcular aquí con
      // calcularMetricasSesion(sesion), que sin segundo argumento vuelve a
      // caer en factorIntensidad=1.0 -- eso hacía que el TSS mostrado en
      // este modal de detalle no coincidiera con el TSS realmente asignado
      // a la sesión (p.ej. en una semana de descarga, el modal habría
      // mostrado un TSS más alto que el real).
      const metricas = {
        distanciaTotal: sesion.detalle.distanciaEstimada ?? this.calcularMetricasSesion(sesion).distanciaTotal,
        tssTotal: sesion.detalle.tssEstimada ?? this.calcularMetricasSesion(sesion).tssTotal
      };
      const tiempoTotal = this.formatearTiempo(sesion.duracion);
      
      const zonaMostrada = sesion.detalle.zona || '—';
      const tiempoEnZonaMostrado = sesion.detalle.tiempoEnZona ? `${sesion.detalle.tiempoEnZona} min` : '—';
      
      const headerHTML = `
        <div class="sesion-resumen-horizontal">
          <div class="resumen-item"><span>🕒</span> ${tiempoTotal}</div>
          <div class="resumen-item"><span>📏</span> ${metricas.distanciaTotal.toFixed(2)} km</div>
          <div class="resumen-item"><span>⚡</span> ${metricas.tssTotal} TSS</div>
          <div class="resumen-item"><span>🔥 ${zonaMostrada}</span> ${tiempoEnZonaMostrado}</div>
        </div>
      `;
      const objetivoHTML = `
        <div class="sesion-objetivo-principal">
          <h4>🎯 OBJETIVO PRINCIPAL</h4>
          <p><strong>${Utils.escapeHTML(sesion.detalle.objetivo || 'Sesión de calidad')}</strong></p>
          <p class="porque">${Utils.escapeHTML(sesion.detalle.porque || '')}</p>
        </div>
      `;
      const zonasHTML = `
        <div class="sesion-zonas">
          <div class="zona-item"><span>⏱️ Ritmo</span><strong>${Utils.escapeHTML(sesion.detalle.ritmoObjetivo)}</strong></div>
          <div class="zona-item"><span>😌 Sensación</span><strong>${Utils.escapeHTML(sesion.detalle.sensacion)}</strong></div>
          <div class="zona-item"><span>📊 Zona</span><strong>${Utils.escapeHTML(sesion.detalle.zona)}</strong></div>
        </div>
      `;
      let pasosHTML = '<div class="sesion-estructura-detallada">';
      if (sesion.detalle.pasosDetallados && sesion.detalle.pasosDetallados.length > 0) {
        sesion.detalle.pasosDetallados.forEach(paso => {
          pasosHTML += `
            <div class="paso-detalle-sesion">
              <div class="paso-header"><span>${paso.icono}</span><strong>${Utils.escapeHTML(paso.titulo)}</strong></div>
              <p class="paso-accion">${Utils.escapeHTML(paso.accion)}</p>
              <p class="paso-porque"><em>${Utils.escapeHTML(paso.porque)}</em></p>
            </div>
          `;
        });
      } else if (sesion.detalle.estructura) {
        const partes = sesion.detalle.estructura.split('+').map(p => p.trim());
        partes.forEach((parte, index) => {
          let iconoPaso = '', tituloPaso = '';
          if (parte.toLowerCase().includes('calentamiento')) {
            iconoPaso = '🔥';
            tituloPaso = 'CALENTAMIENTO';
          } else if (parte.toLowerCase().includes('enfriamiento')) {
            iconoPaso = '🧘';
            tituloPaso = 'ENFRIAMIENTO';
          } else {
            iconoPaso = '💪';
            tituloPaso = 'PARTE PRINCIPAL';
          }
          pasosHTML += `
            <div class="paso-detalle-sesion">
              <div class="paso-header"><span>${iconoPaso}</span><strong>${tituloPaso}</strong></div>
              <p class="paso-accion">${Utils.escapeHTML(parte)}</p>
            </div>
          `;
        });
      }
      pasosHTML += '</div>';
      descripcion.innerHTML = headerHTML + objetivoHTML + zonasHTML + pasosHTML;
      
      if (window.GPSTracker) {
        const gpsBtn = document.createElement('button');
        gpsBtn.id = 'gpsStartBtn';
        gpsBtn.style.cssText = [
          'margin-top:18px', 'width:100%', 'height:54px',
          'background:linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
          'border:2px solid var(--gold)', 'color:var(--gold)',
          'font-size:15px', 'font-weight:bold', 'letter-spacing:1px',
          'border-radius:14px', 'cursor:pointer',
          "font-family:'Courier New',monospace",
          'display:flex', 'align-items:center',
          'justify-content:center', 'gap:10px',
          'transition:all 0.2s ease'
        ].join(';');
        gpsBtn.innerHTML = '📍 INICIAR SESIÓN CON GPS';
        gpsBtn.addEventListener('mouseenter', () => {
          gpsBtn.style.background = 'var(--gold)';
          gpsBtn.style.color = '#0a0a0a';
        });
        gpsBtn.addEventListener('mouseleave', () => {
          gpsBtn.style.background = 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))';
          gpsBtn.style.color = 'var(--gold)';
        });
        
        let sesionLimpia = { ...sesion };
        if (sesion.tieneFuerza && sesion.detalle && sesion.detalle.pasosDetallados) {
          sesionLimpia.detalle = {
            ...sesion.detalle,
            pasosDetallados: sesion.detalle.pasosDetallados.filter(p => {
              const tit = (p.titulo || '').toUpperCase();
              return !tit.includes('FUERZA') && p.icono !== '🏋️';
            })
          };
          const duracionSinFuerza = (sesionLimpia.detalle.calentamiento || 0) +
                                     (sesionLimpia.detalle.partePrincipal || 0) +
                                     (sesionLimpia.detalle.enfriamiento || 0);
          sesionLimpia.duracion = duracionSinFuerza;
        }
        
        gpsBtn.addEventListener('click', async () => {
          // Gestión de fatiga ANTES de salir a correr, no al terminar: así
          // el usuario decide con tiempo, no después de haber hecho ya la
          // sesión. Si decide no continuar, ni siquiera se llega a activar
          // el GPS.
          const continuar = await this.comprobarFatigaAntesDeSesion();
          if (!continuar) return;
          GPSTracker.iniciar(sesionLimpia, diaIndex);
        });
        descripcion.appendChild(gpsBtn);
      }
      
      checkboxContainer.style.display = 'flex';
      checkbox.checked = AppState.sesionesRealizadas?.[diaIndex] || false;
      checkbox.onchange = async (e) => {
        const marcando = e.target.checked;
        if (marcando && sesion && sesion.tipo !== 'descanso' && sesion.tipo !== 'strength') {
          // Al marcar (no al desmarcar) una sesión SIN GPS, se piden los
          // km y el tiempo reales antes de guardar nada -- así el ritmo
          // medio que se registra sale siempre de lo que de verdad se ha
          // hecho, no de la estimación del plan (ver abrirModalDatosReales
          // para el porqué). Las sesiones iniciadas con GPS no pasan por
          // aquí: van directas por gps-tracker.js con sus propios datos
          // reales medidos por el track.
          const datos = await this.abrirModalDatosReales(sesion);
          if (!datos) {
            checkbox.checked = false;
            return;
          }
          await this.marcarSesionRealizada(diaIndex, true, datos.km, datos.ms, null, false, false, datos.tipoCorregido);
        } else {
          await this.marcarSesionRealizada(diaIndex, marcando);
        }
      };
      feedbackContainer.style.display = 'block';
      this.mostrarFeedbackExistente(diaIndex);
      const feedbackButtons = feedbackContainer.querySelectorAll('.feedback-btn');
      feedbackButtons.forEach(btn => {
        btn.onclick = async (e) => {
          const valor = e.target.getAttribute('data-value');
          await this.guardarFeedback(diaIndex, valor);
        };
      });
    } else {
      wrapper.classList.add('sesion-descanso');
      titulo.innerText = "😴 DESCANSO";
      const objetivoDescanso = this.obtenerObjetivoDescanso(sesion);
      const porqueDescanso = this.obtenerPorqueDescanso(sesion);
      descripcion.innerHTML = `
        <div class="descanso-container">
          <div class="descanso-icono">😴</div>
          <p class="descanso-texto">Día de descanso</p>
          <div class="descanso-objetivo">
            <h4>🎯 OBJETIVO</h4>
            <p>${Utils.escapeHTML(objetivoDescanso)}</p>
            <p class="porque">${Utils.escapeHTML(porqueDescanso)}</p>
          </div>
          <ul class="descanso-recomendaciones">
            <li>🧘 Estiramientos suaves</li>
            <li>🌀 Foam roller</li>
            <li>🚶 Paseo activo</li>
            <li>💧 Hidratación adecuada</li>
          </ul>
        </div>
      `;
      checkboxContainer.style.display = 'none';
      feedbackContainer.style.display = 'none';
    }
    modal.classList.add("visible");
    overlay.classList.add("visible");
  },

  async guardarFeedback(diaIndex, valor) {
    if (!AppState.currentUserId || !AppState.planActualId) return;
    try {
      if (!AppState.feedbackSesiones) AppState.feedbackSesiones = {};
      AppState.feedbackSesiones[diaIndex] = valor;
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      await planRef.update({ [`feedback.${diaIndex}`]: valor });
      const feedbackContainer = document.getElementById("sesionFeedbackContainer");
      if (feedbackContainer) {
        const buttons = feedbackContainer.querySelectorAll('.feedback-btn');
        buttons.forEach(btn => {
          if (btn.getAttribute('data-value') === valor) {
            btn.style.background = 'var(--accent-blue)';
            btn.style.color = 'var(--bg-primary)';
          } else {
            btn.style.background = '';
            btn.style.color = '';
          }
        });
      }
      Utils.showToast('✅ Feedback guardado', 'success');
    } catch (error) {
      console.error('Error guardando feedback:', error);
      Utils.showToast('Error al guardar feedback', 'error');
    }
  },

  mostrarFeedbackExistente(diaIndex) {
    const feedbackContainer = document.getElementById("sesionFeedbackContainer");
    if (!feedbackContainer) return;
    const valor = AppState.feedbackSesiones?.[diaIndex];
    if (!valor) return;
    const buttons = feedbackContainer.querySelectorAll('.feedback-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-value') === valor) {
        btn.style.background = 'var(--accent-blue)';
        btn.style.color = 'var(--bg-primary)';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    });
  },

  obtenerObjetivoDescanso(sesion) {
    const fase = sesion.fase || 'BASE';
    const objetivosDescanso = {
      BASE: 'Recuperación activa tras el volumen de base',
      CONSTRUCCION: 'Asimilar las cargas de construcción',
      ESPECIFICA: 'Prepararse para las sesiones específicas',
      PICO: 'Descargar antes del pico de forma',
      TAPER: 'Máxima recuperación antes de la competición'
    };
    return objetivosDescanso[fase] || 'Recuperación y asimilación del entrenamiento';
  },

  obtenerPorqueDescanso(sesion) {
    const fase = sesion.fase || 'BASE';
    const porqueDescanso = {
      BASE: 'El descanso permite que el sistema cardiovascular se adapte al volumen.',
      CONSTRUCCION: 'Los días de descanso evitan la acumulación de fatiga y previenen lesiones.',
      ESPECIFICA: 'Las sesiones de calidad requieren días de descanso para llegar en óptimas condiciones.',
      PICO: 'El descanso es clave para alcanzar el pico de forma.',
      TAPER: 'Durante el taper, el descanso permite la supercompensación.'
    };
    return porqueDescanso[fase] || 'El descanso es parte fundamental del entrenamiento.';
  },

  async limpiarMuroGlobal() {
    // ANTES esta función borraba de globalFeed todo lo de más de 90 días.
    // El problema (encontrado al revisar por qué "racha más larga" no
    // cuadraba al marcar/desmarcar sesiones): gamification.js reconstruye
    // la racha máxima histórica y los récords personales (ver
    // Gamification._recalcularDerivadosDesdeHistorial) leyendo
    // directamente de globalFeed cada vez que se desmarca o borra UNA
    // sesión cualquiera. Si esta limpieza ya se había cargado sesiones de
    // hace más de 90 días, esos datos dejaban de existir para el
    // recálculo, y la racha/récord "más larga" se recortaba a lo que
    // quedara de los últimos 90 días -- aunque la sesión desmarcada no
    // tuviera nada que ver con ese récord. Es decir: la limpieza rutinaria
    // del muro, sin querer, borraba silenciosamente logros permanentes del
    // usuario.
    //
    // Mientras la racha/récords dependan de globalFeed como única fuente,
    // esta colección no se puede seguir purgando por antigüedad: se deja
    // de borrar por completo (deja de haber límite de retención). El
    // propio muro visible ya solo pinta hoy/ayer (filtro de fecha en
    // Wall.cargarMuro), así que esto NO afecta a lo que se ve en la
    // comunidad -- solo a que la base de datos ya no se "poda". A cambio,
    // los datos de sesiones nunca se pierden, así que rachas y récords
    // vuelven a ser fiables a largo plazo. Se deja la función (no se
    // borra la llamada desde donde se invocaba) para no tener que tocar
    // esos puntos de la app, simplemente ya no hace nada.
    return;
  },

  // ── GESTIÓN CIENTÍFICA DE LA FATIGA ──────────────────────────────
  // Comprueba el % de recuperación respecto a la última sesión registrada
  // (mismo cálculo que la tarjeta "Carga y recuperación" del dashboard) y,
  // si el usuario aún no está al 100%, le avisa del riesgo y le deja
  // decidir si quiere continuar de todos modos — no se bloquea la sesión,
  // solo se gestiona con información. Devuelve `true` si se puede
  // continuar (recuperado al 100%, o confirmó que quiere seguir de todos
  // modos) y `false` si el usuario ha decidido no continuar.
  //
  // Extraída a su propia función para poder llamarse en DOS momentos
  // distintos según cómo se registre la sesión:
  //  - Sesión con GPS: se pregunta ANTES de iniciar el GPS (al pulsar
  //    "INICIAR SESIÓN CON GPS"), para que el usuario decida antes de
  //    salir a correr, no al terminar. Antes se preguntaba aquí mismo, en
  //    marcarSesionRealizada, que para el flujo GPS se llama DESPUÉS de
  //    que gps-tracker.js ya ha mostrado su propia pantalla de carga
  //    (Utils.showLoading, por encima de todo lo demás en z-index): el
  //    aviso de fatiga quedaba tapado por esa pantalla de carga, sin
  //    forma de pulsar nada, y la sesión se quedaba "cargando" para
  //    siempre sin llegar a guardarse nunca.
  //  - Sesión sin GPS (checkbox manual): se sigue preguntando al marcar la
  //    casilla, que es el único momento en que interviene el usuario.
  async comprobarFatigaAntesDeSesion() {
    const estado = this.calcularEstadoRecuperacionActual();
    if (estado && estado.pct < 100) {
      const horasStr = estado.horasRestantes >= 24
        ? `${Math.ceil(estado.horasRestantes / 24)} día(s)`
        : `${estado.horasRestantes} h`;
      const continuar = await Utils.confirm(
        '⚠️ Aún no estás recuperado al 100%',
        `Tu recuperación está al ${estado.pct}% (última sesión: ${estado.tss} TSS, tipo ${estado.tipo}). Faltan ~${horasStr} para la recuperación completa. Entrenar ahora aumenta el riesgo de fatiga acumulada y lesión. ¿Quieres continuar igualmente?`
      );
      if (!continuar) {
        Utils.showToast('Sesión no iniciada — sigue recuperándote 💤', 'info');
        return false;
      }
      // Se guarda el aviso: se retoma en marcarSesionRealizada, cuando ya
      // existe el objeto `entry` de la sesión, para dejar constancia de
      // que se entrenó sin recuperación completa (útil para el detalle
      // del récord/histórico y para futuros ajustes automáticos del plan).
      this._ultimaSesionForzadaSinRecuperar = { pct: estado.pct, tss: estado.tss };
      return true;
    }
    this._ultimaSesionForzadaSinRecuperar = null;
    return true;
  },

  // ==================== FUNCIÓN MARCAR SESIÓN REALIZADA (CORREGIDA) ====================
  // `saltarComprobacionFatiga`: true cuando la comprobación ya se hizo
  // ANTES (sesión GPS, ver comprobarFatigaAntesDeSesion llamada al pulsar
  // "INICIAR SESIÓN CON GPS"), para no volver a preguntar aquí -- y sobre
  // todo para no arriesgarse a mostrar el modal de confirmación DESPUÉS de
  // que gps-tracker.js ya haya activado su pantalla de carga a pantalla
  // completa, que lo taparía por completo.
  // Marcar/desmarcar en curso por día: evita que dos pulsaciones seguidas
  // sobre la MISMA sesión (p. ej. marcar y desmarcar rápido para probar)
  // se solapen en la nube. Sin esto, la segunda llamada podía empezar a
  // leer el plan/la gamificación ANTES de que la primera hubiera terminado
  // de escribir sus cambios, así que la racha/récords/nº de sesiones
  // podían quedar calculados sobre datos a medio actualizar -- exactamente
  // el tipo de fallo intermitente que solo se nota "a veces" al probar
  // marcar y desmarcar deprisa. Ahora, si ya hay una operación en curso
  // para ese mismo día, la nueva pulsación espera a que termine la
  // anterior antes de empezar la suya (en vez de dispararse en paralelo).
  _marcandoEnCurso: {},

  async marcarSesionRealizada(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null, esGPS = false, saltarComprobacionFatiga = false, tipoCorregido = null) {
    if (!AppState.currentUserId || !AppState.planActualId) return;

    const enCurso = this._marcandoEnCurso[diaIndex];
    if (enCurso) {
      try { await enCurso; } catch (e) {}
    }
    let resolverEnCurso;
    this._marcandoEnCurso[diaIndex] = new Promise(res => { resolverEnCurso = res; });

    try {
      await this._marcarSesionRealizadaInterno(diaIndex, realizada, realDistance, realDurationMs, realMaxSpeedKmh, esGPS, saltarComprobacionFatiga, tipoCorregido);
    } finally {
      resolverEnCurso();
      if (this._marcandoEnCurso[diaIndex]) delete this._marcandoEnCurso[diaIndex];
    }
  },

  async _marcarSesionRealizadaInterno(diaIndex, realizada, realDistance = null, realDurationMs = null, realMaxSpeedKmh = null, esGPS = false, saltarComprobacionFatiga = false, tipoCorregido = null) {
    if (realizada && !saltarComprobacionFatiga) {
      const continuar = await this.comprobarFatigaAntesDeSesion();
      if (!continuar) {
        // Revertir el checkbox visualmente: el evento onchange ya lo
        // había puesto a `checked` antes de llamar a esta función.
        const checkboxRevert = document.getElementById('sesionRealizada');
        if (checkboxRevert) checkboxRevert.checked = false;
        return;
      }
    }

    try {
      const planRef = firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId);
      await planRef.update({ [`sesionesRealizadas.${diaIndex}`]: realizada });
      
      if (!AppState.sesionesRealizadas) AppState.sesionesRealizadas = {};
      AppState.sesionesRealizadas[diaIndex] = realizada;
      
      const celda = document.querySelector(`.calendario-dia[data-dia-global="${diaIndex}"]`);
      if (celda) {
        if (realizada) {
          celda.classList.add('realizado');
          celda.classList.remove('perdida');
        } else {
          celda.classList.remove('realizado');
          // Si la fecha de esta sesión ya pasó, al desmarcarla vuelve a
          // considerarse "perdida" (naranja) en vez de quedarse en su
          // color de zona normal como si aún estuviera pendiente.
          const sesionCelda = (this._sesionesActuales || [])[diaIndex - 1];
          if (sesionCelda && this._fechaInicioPlan && sesionCelda.tipo !== 'descanso') {
            const fechaSesionCelda = new Date(this._fechaInicioPlan);
            fechaSesionCelda.setDate(fechaSesionCelda.getDate() + (diaIndex - 1));
            const hoyCelda = new Date(); hoyCelda.setHours(0, 0, 0, 0);
            if (fechaSesionCelda < hoyCelda) celda.classList.add('perdida');
            else celda.classList.remove('perdida');
          } else {
            celda.classList.remove('perdida');
          }
        }
      }

      // Aviso YA MISMO: lo que de verdad importa para el usuario (que la
      // sesión ha quedado marcada/desmarcada) ya ha ocurrido. Antes el
      // aviso esperaba al final de toda la función, después de publicar en
      // el muro, sincronizar "última sesión" y revertir/sumar
      // gamificación -- varias llamadas a la nube seguidas -- así que
      // tardaba bastante más en aparecer de lo que hacía falta.
      Utils.showToast(realizada ? '✅ Sesión marcada' : '📝 Sesión desmarcada (actualizada)', 'success');

      try {
      const planDoc = await planRef.get();
      const planCompleto = planDoc.data();
      const sesion = planCompleto.sesiones[diaIndex - 1];
      
      if (realizada) {
        // ---------- MARCADO ----------
        await this.limpiarMuroGlobal();
        if (sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          let metricas;
          let distanciaUsada;
          let duracionUsadaMs;
          
          if (realDistance !== null && realDurationMs !== null) {
            distanciaUsada = realDistance;
            duracionUsadaMs = realDurationMs;
            // Desglose real en calentamiento/parte principal/recuperación/
            // enfriamiento (min/km/zona de cada tramo, ver _desglosarSesion,
            // 'recuperacion' solo presente en series con descansos) a partir de
            // los km/tiempo TOTALES reales de la sesión (con o sin GPS).
            // Se calcula aquí, antes del TSS, para poder usarlo también en
            // calcularTSSdesdeReal.
            const desgloseReal = this._desglosarSesion(sesion, realDurationMs / 60000, realDistance);
            metricas = {
              distanciaTotal: realDistance,
              tssTotal: this.calcularTSSdesdeReal(realDistance, realDurationMs, sesion, desgloseReal),
              // La insignia "GPS activado" (FIRST_GPS) y la velocidad
              // máxima solo aplican cuando de verdad hubo un track GPS
              // real (esGPS=true). Si estos km/tiempo vienen de la
              // corrección manual del usuario al marcar la sesión (sin
              // GPS), no hay pista que dibujar ni velocidad máxima real
              // medida, así que no deben contar para esas insignias.
              gpsUsed: !!esGPS,
              // Velocidad máxima real medida por GPS tramo a tramo (ver
              // gps-tracker.js _calcMaxSpeedKmh). Antes nunca se rellenaba
              // este campo, así que las insignias SPEED_20/SPEED_30 eran
              // literalmente imposibles de conseguir por mucho que se
              // corriera rápido.
              maxSpeed: esGPS ? (realMaxSpeedKmh || 0) : 0,
              desglose: desgloseReal
            };
          } else {
            // Reutiliza el TSS/distancia ya calculados al generar el plan
            // (sesion.detalle.tssEstimada/distanciaEstimada) en vez de
            // recalcularlos aquí con calcularMetricasSesion(sesion) sin
            // segundo argumento. Recalcular aquí volvía a caer en
            // factorIntensidad=1.0 por defecto, así que el TSS "registrado"
            // al marcar la sesión sin GPS podía no coincidir con el TSS
            // "estimado" que el usuario ya había visto en el plan para esa
            // misma sesión (la semana de descarga, por ejemplo, mostraría
            // una estimación baja pero luego registraría un TSS más alto).
            // El desglose aquí se calcula sobre los datos PLANIFICADOS
            // (proporción 1:1, ver _desglosarSesion), para que la tarjeta de
            // esta sesión también pueda mostrar calentamiento/parte
            // principal/enfriamiento aunque no se hayan introducido datos
            // reales.
            metricas = {
              distanciaTotal: sesion.detalle.distanciaEstimada || 0,
              tssTotal: sesion.detalle.tssEstimada || 0,
              desglose: this._desglosarSesion(sesion, sesion.duracion, sesion.detalle.distanciaEstimada || 0)
            };
            distanciaUsada = metricas.distanciaTotal;
            duracionUsadaMs = sesion.duracion * 60 * 1000;
          }

          // Ritmo medio de la sesión (min/km), con o sin GPS: siempre hay
          // distancia y duración, así que siempre se puede calcular. Antes
          // 'metricas.bestPace' nunca se rellenaba desde aquí, así que las
          // insignias PACE_SUB5/PACE_SUB4 eran imposibles de conseguir
          // aunque se corriera a ese ritmo.
          if (distanciaUsada > 0 && duracionUsadaMs > 0) {
            metricas.bestPace = (duracionUsadaMs / 60000) / distanciaUsada;
          }
          // Duración en ms para el cálculo de récords personales por
          // distancia en gamification.js (ver RECORD_DISTANCES).
          metricas.durationMs = duracionUsadaMs;
          const userData = AppState.currentUserData;
          const distancia = isFinite(distanciaUsada) ? distanciaUsada : 0;
          const tss = isFinite(metricas.tssTotal) ? metricas.tssTotal : 0;

          // Zona REAL entrenada, calculada a partir del ritmo de la PARTE
          // PRINCIPAL de la sesión, no del ritmo medio de toda ella (ver
          // _estimarRitmoParteEfectiva): el ritmo medio (metricas.bestPace,
          // usado tal cual para el resto de métricas: TSS, récords,
          // insignias PACE_SUB5/PACE_SUB4...) se queda igual, pero para
          // decidir EN QUÉ ZONA se entrenó de verdad hay que descontar el
          // calentamiento y el enfriamiento (siempre a Z1), que si no
          // arrastraban la media hacia zonas más bajas -- una sesión de
          // tempo hecha en Z3 con su calentamiento/enfriamiento en Z1
          // podía salir registrada como Z1, no como Z3. Antes aquí se
          // guardaba directamente sesion.detalle.zona -- la zona
          // PLANIFICADA -- así que si el usuario corregía los km/tiempo a
          // mano (o el track GPS salía más lento/rápido de lo previsto) y
          // el ritmo real caía en otra zona distinta, "última sesión"
          // seguía mostrando la zona del plan en vez de la zona en la que
          // de verdad se entrenó.
          const zonaFinal = metricas.desglose?.partePrincipal?.zona || sesion.detalle.zona || '';

          // Tipo y nombre REALES: si el usuario ha corregido el tipo en el
          // modal de datos reales (porque hizo algo distinto a lo
          // planificado), se usan esos en vez de los planificados. La
          // "sensación" de última sesión NO se guarda como texto fijo aquí
          // -- se recalcula en el dashboard a partir de trainingType/fase
          // (ver actualizarUltimaSesionDashboard en index.html), así que
          // basta con guardar el tipo y la fase correctos para que la
          // sensación mostrada sea también la correcta.
          const tipoFinal = tipoCorregido || sesion.tipo;
          const nombreFinal = tipoCorregido
            ? this._infoTipo(tipoCorregido).label
            : (sesion.detalle.nombre || '');

          // Fecha REAL programada de la sesión (fechaInicio + diaGlobal-1),
          // distinta del "timestamp" (que es el momento exacto en que se
          // pulsa el check). Si marcas hoy una sesión de hace unos días
          // (poniéndote al día), 'timestamp' sería "ahora" y "última sesión"
          // mostraría "Hoy" aunque esa sesión fuera de otro día.
          const fechaInicioPlan = AppState.planGeneradoActual?.fechaInicio
            ? new Date(AppState.planGeneradoActual.fechaInicio)
            : null;
          let fechaSesionReal = null;
          if (fechaInicioPlan) {
            fechaSesionReal = new Date(fechaInicioPlan);
            fechaSesionReal.setDate(fechaSesionReal.getDate() + (diaIndex - 1));
          }

          const entry = {
            userId: AppState.currentUserId,
            username: userData.username,
            photoURL: userData.profile?.photoURL || null,
            trainingType: tipoFinal,
            duration: Math.floor(duracionUsadaMs / 60000),
            distancia: distancia,
            tss: tss,
            timestamp: firebaseServices.Timestamp.now(),
            fechaSesion: fechaSesionReal ? firebaseServices.Timestamp.fromDate(fechaSesionReal) : firebaseServices.Timestamp.now(),
            planId: AppState.planActualId,
            sesionIndex: diaIndex,
            likes: [],
            likeCount: 0,
            likesLeidos: 0,
            zone: zonaFinal,
            fase: sesion.fase || 'BASE',
            trainingName: nombreFinal,
            // Desglose real de la sesión en calentamiento/parte principal/
            // recuperación/enfriamiento (min/km/zona de cada tramo, ver
            // _desglosarSesion), para que las tarjetas de Dashboard, Muro y
            // Perfil puedan mostrar el detalle real de lo entrenado (no solo
            // la media diluida por el calentamiento/enfriamiento) al
            // pulsarlas. null si la sesión no tenía tramos definidos.
            desglose: metricas.desglose || null
          };

          // Constancia de que esta sesión se completó sin estar
          // recuperado al 100% (ver aviso de fatiga más arriba). Solo se
          // añade el campo cuando aplica, para no ensuciar el resto de
          // entradas del muro.
          if (this._ultimaSesionForzadaSinRecuperar) {
            entry.recuperacionPctAlMarcar = this._ultimaSesionForzadaSinRecuperar.pct;
            this._ultimaSesionForzadaSinRecuperar = null;
          }

          if (realDistance !== null && realDurationMs !== null && esGPS) {
            entry.hasGPS = true;
          } else {
            // Antes se dejaba sin definir (undefined) en vez de false. Con
            // ignoreUndefinedProperties, un campo undefined simplemente no
            // se escribe -- normalmente eso basta porque .update() con un
            // objeto reemplaza el campo entero, pero se deja explícito para
            // que no haya ninguna duda de que esta sesión NO llevaba GPS.
            // Esto también cubre ahora el caso de "datos reales corregidos
            // a mano" (sin pista GPS real que dibujar): aunque
            // realDistance/realDurationMs no sean null, esGPS=false deja
            // claro que no hay trackPoints y el muro no debe intentar
            // pintar un mini-mapa para esta entrada.
            entry.hasGPS = false;
          }
          
          try {
            const globalRef = await firebaseServices.db.collection('globalFeed').add(entry);
            await planRef.update({ [`wallEntryId.${diaIndex}`]: globalRef.id });
            // Se guarda el propio id del documento de globalFeed dentro de
            // 'ultimaSesion' para poder detectar, si algún día se borra esa
            // publicación concreta desde el perfil, que era justo la que
            // estaba marcada como "última sesión" -- y así poder
            // actualizarla en vez de dejarla apuntando a algo ya borrado.
            entry.entryId = globalRef.id;
            // 'última sesión' (en Inicio) se lee de este campo, NO de
            // globalFeed: globalFeed tiene una limpieza a largo plazo (90
            // días) y el muro solo muestra hoy/ayer, así que si "última
            // sesión" dependiera de ahí, se "resetearía" en cuanto esa
            // sesión dejara de estar en el rango visible (por ejemplo, cada
            // lunes). Aquí se guarda de forma permanente en el propio
            // usuario, para que "la última es la última" sin caducar nunca.
            await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
              ultimaSesion: entry
            });
            if (AppState.currentUserData) {
              AppState.currentUserData.ultimaSesion = entry;
            }
            // Refresca el widget de "última sesión" en Inicio al instante,
            // por si el usuario ya lo tiene abierto o vuelve sin recargar
            // la app entera.
            if (typeof window.actualizarUltimaSesionDashboard === 'function') {
              window.actualizarUltimaSesionDashboard();
            }
            if (typeof window.actualizarEstaSemanaDashboard === 'function') {
              window.actualizarEstaSemanaDashboard(AppState.currentUserData?.profile?.weight || null);
            }
            // La tarjeta "Carga y recuperación" del dashboard lee el TSS y
            // el tipo de la 'ultimaSesion' que se acaba de actualizar
            // arriba; sin esta llamada se quedaba con el TSS/hora de
            // recuperación de la sesión anterior hasta recargar la app.
            if (typeof window.actualizarCargaRecuperacionDashboard === 'function') {
              window.actualizarCargaRecuperacionDashboard();
            }
            // Recalcula también la caché del MODAL de "Carga y recuperación"
            // (TSS total, ACWR, gráfica por semana): sin esto, el modal se
            // quedaba con los datos de antes de marcar esta sesión hasta la
            // siguiente apertura, o incluso hasta recargar la app.
            if (typeof window.precargarCargaPlan === 'function') {
              window.precargarCargaPlan();
            }
          } catch (err) {
            console.error('Error al guardar en muro:', err);
            Utils.showToast('Error al publicar en el muro', 'error');
          }
          
          if (window.Gamification) {
            try {
              const oldData = await Gamification.getData(AppState.currentUserId);
              const oldLevel = oldData.level;
              // Se pasa la fecha REAL de la sesión (día del plan), no el
              // momento en que se pulsa el check: si te pones al día y
              // marcas hoy una sesión de hace unos días, la racha debe
              // contarse por el día que tocaba, no por "hoy" -- si no, al
              // marcar/desmarcar sesiones atrasadas la racha deja de
              // cuadrar (ver Gamification.updateAfterSession).
              metricas.fechaSesionReal = fechaSesionReal;
              const gamResult = await Gamification.updateAfterSession(AppState.currentUserId, sesion, metricas);
              // Se guarda qué insignias concedió EXACTAMENTE esta sesión en su
              // propia entrada del muro (si se llegó a crear), para poder
              // revertir solo esas insignias concretas si más tarde se
              // desmarca la sesión (ver más abajo, rama `else`).
              if (entry.entryId && gamResult?.gainedBadges?.length) {
                try {
                  await firebaseServices.db.collection('globalFeed').doc(entry.entryId).update({
                    badgesGanadas: gamResult.gainedBadges
                  });
                } catch (e) { console.warn('No se pudo guardar badgesGanadas en el muro:', e); }
              }
              const newData = await Gamification.getData(AppState.currentUserId);
              const newLevel = newData.level;
              if (newLevel !== oldLevel) {
                console.log(`🎉 Nivel cambiado de ${oldLevel} a ${newLevel}. Refrescando UI...`);
                if (Gamification.clearCache) await Gamification.clearCache(AppState.currentUserId);
                if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
                if (document.getElementById('subtab-amigos')?.classList.contains('active') && window.Friends) {
                  await Friends.cargarListaAmigos(true);
                  const activeAmigosTab = document.querySelector('.amigos-tab.active');
                  if (activeAmigosTab && activeAmigosTab.textContent.includes('BUSCAR')) await Friends.cargarTodosUsuarios(true);
                }
                if (document.getElementById('subtab-muro')?.classList.contains('active') && window.Wall) Wall.cargarMuro();
              }
            } catch (e) { console.error('Error actualizando gamificación:', e); }
          }
        }
      } else {
        // ---------- DESMARCADO (CORREGIDO) ----------
        const planData = planDoc.data();
        const wallEntryId = planData?.wallEntryId?.[diaIndex];
        let distanciaReal = null;
        let badgesGanadasSesion = [];
        
        // 1. Obtener la distancia real (y las insignias que concedió) del
        //    muro ANTES de eliminarlo
        if (wallEntryId) {
          try {
            const wallDoc = await firebaseServices.db.collection('globalFeed').doc(wallEntryId).get();
            if (wallDoc.exists) {
              distanciaReal = wallDoc.data().distancia;
              badgesGanadasSesion = wallDoc.data().badgesGanadas || [];
              console.log(`📖 Distancia real obtenida del muro: ${distanciaReal} km`);
            }
          } catch (err) { console.warn('Error leyendo entrada del muro:', err); }
        }
        
        // 2. Eliminar la entrada del muro
        if (wallEntryId) {
          try {
            await firebaseServices.db.collection('globalFeed').doc(wallEntryId).delete();
            await planRef.update({ [`wallEntryId.${diaIndex}`]: firebaseServices.FieldValue.delete() });
          } catch (err) { console.error('Error al eliminar del muro:', err); }

          // Si la entrada borrada era justo la guardada como "última
          // sesión", hay que actualizarla -- si no, se queda apuntando
          // para siempre a algo ya borrado (mismo fallo que había al
          // borrar desde el perfil).
          try {
            if (AppState.currentUserData?.ultimaSesion?.entryId === wallEntryId) {
              let nuevaUltima = null;
              try {
                let siguienteSnap;
                try {
                  siguienteSnap = await firebaseServices.db
                    .collection('globalFeed')
                    .where('userId', '==', AppState.currentUserId)
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .get();
                } catch (indexErr) {
                  const fallbackSnap = await firebaseServices.db
                    .collection('globalFeed')
                    .where('userId', '==', AppState.currentUserId)
                    .limit(20)
                    .get();
                  let masReciente = null, fechaMasReciente = null;
                  fallbackSnap.forEach(doc => {
                    const d = doc.data();
                    const fecha = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
                    if (!fechaMasReciente || fecha > fechaMasReciente) { fechaMasReciente = fecha; masReciente = doc; }
                  });
                  siguienteSnap = { empty: !masReciente, docs: masReciente ? [masReciente] : [] };
                }
                if (!siguienteSnap.empty) {
                  const doc = siguienteSnap.docs[0];
                  nuevaUltima = { ...doc.data(), entryId: doc.id };
                }
              } catch (queryErr) {
                console.warn('No se pudo buscar la sesión anterior para "última sesión":', queryErr);
              }
              await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({
                ultimaSesion: nuevaUltima || firebaseServices.FieldValue.delete()
              });
              if (AppState.currentUserData) AppState.currentUserData.ultimaSesion = nuevaUltima || null;
              if (typeof window.actualizarUltimaSesionDashboard === 'function') {
                if (!nuevaUltima) {
                  const ultEl = document.getElementById('dashboardUltimaSesionContent');
                  if (ultEl) ultEl.innerHTML = 'Sin sesiones registradas aún.';
                } else {
                  window.actualizarUltimaSesionDashboard();
                }
              }
            }
          } catch (syncErr) {
            console.warn('No se pudo sincronizar "última sesión":', syncErr);
          }
          if (typeof window.actualizarEstaSemanaDashboard === 'function') {
            window.actualizarEstaSemanaDashboard(AppState.currentUserData?.profile?.weight || null);
          }
          // Igual que al marcar: la tarjeta "Carga y recuperación" tiene
          // que reflejar YA la 'ultimaSesion' que se acaba de recalcular
          // arriba (o quedar vacía si ya no queda ninguna sesión).
          if (typeof window.actualizarCargaRecuperacionDashboard === 'function') {
            window.actualizarCargaRecuperacionDashboard();
          }
          // Misma razón que al marcar: refresca la caché del modal de
          // "Carga y recuperación" para que refleje el desmarcado.
          if (typeof window.precargarCargaPlan === 'function') {
            window.precargarCargaPlan();
          }
        }
        
        // 3. Revertir gamificación usando la distancia real (si existe) o la estimada
        if (window.Gamification && sesion && sesion.detalle && sesion.tipo !== 'descanso') {
          try {
            let distanciaRemovida;
            if (distanciaReal !== null) {
              distanciaRemovida = distanciaReal;
              console.log(`✅ Reviertiendo gamificación con distancia real: ${distanciaRemovida} km`);
            } else {
              // Reutiliza la distancia ya estimada en el plan en vez de
              // recalcularla aquí sin el factor de intensidad real de esa
              // semana (mismo motivo que en el bloque de arriba).
              distanciaRemovida = sesion.detalle.distanciaEstimada ?? this.calcularMetricasSesion(sesion).distanciaTotal;
              console.warn(`⚠️ No se encontró distancia real, usando estimada: ${distanciaRemovida} km`);
            }
            const metricasRemovidas = { distanciaTotal: distanciaRemovida, tssTotal: 0 };
            await Gamification.removeSession(AppState.currentUserId, sesion, metricasRemovidas, diaIndex, badgesGanadasSesion);
            if (document.getElementById('tab-perfil').classList.contains('active') && window.Profile) await Profile.cargarPerfil(true);
            if (document.getElementById('subtab-amigos')?.classList.contains('active') && window.Friends) await Friends.cargarListaAmigos(true);
          } catch (e) { console.error('Error revirtiendo gamificación:', e); }
        }
      }
      } catch (bgError) {
        // La sesión YA quedó marcada/desmarcada correctamente (eso ya se
        // avisó arriba); esto solo cubre el trabajo de fondo (publicar en
        // el muro, gamificación...). Un fallo aquí no debe mostrarse como
        // "error al marcar la sesión" porque no lo fue.
        console.error('Error en el trabajo de fondo tras marcar sesión:', bgError);
      }
    } catch (error) {
      console.error('Error marcando sesión:', error);
      Utils.showToast('Error al marcar la sesión', 'error');
    }
  },

  // Función auxiliar para calcular TSS a partir de distancia y duración reales
  calcularTSSdesdeReal(distanciaKm, duracionMs, sesion, desglose = null) {
    const duracionHoras = duracionMs / (1000 * 60 * 60);
    if (duracionHoras <= 0) return 0;

    // Con desglose real (calentamiento/parte principal/enfriamiento, ver
    // _desglosarSesion) el TSS se calcula ponderando cada tramo por su
    // propia intensidad (IF² × minutos de ESE tramo, igual que el modelo
    // de carga de Coggan/TrainingPeaks integra la intensidad variable a lo
    // largo de la sesión), en vez de una única intensidad media para toda
    // la sesión. Antes, un rodaje de calidad en Z3 con su calentamiento y
    // enfriamiento en Z1 diluía el ritmo medio hacia zonas más bajas y
    // registraba MENOS carga real de la que la parte principal merecía;
    // ahora el calentamiento/enfriamiento suave sigue sumando su propia
    // carga (pequeña) sin diluir ni inflar la de la parte principal.
    const factoresIF = { 'Z1': 0.6, 'Z2': 0.7, 'Z3': 0.85, 'Z4': 0.95, 'Z5': 1.05, 'Z6': 1.15 };
    if (desglose && desglose.partePrincipal && desglose.partePrincipal.min > 0) {
      let tssAcumulado = 0;
      ['calentamiento', 'partePrincipal', 'recuperacion', 'enfriamiento'].forEach(fase => {
        const tramo = desglose[fase];
        if (!tramo || !tramo.min) return;
        const ifTramo = factoresIF[tramo.zona] || 0.7;
        tssAcumulado += tramo.min * ifTramo * ifTramo;
      });
      return Math.round(tssAcumulado);
    }

    // Fallback (sin desglose disponible): método anterior, con una única
    // intensidad media para toda la sesión.
    const ritmoBase = AppState.lastRitmoBase || 5;
    const distanciaEstimadaPorRitmo = duracionHoras * 60 / ritmoBase;
    const factor = distanciaKm / Math.max(0.1, distanciaEstimadaPorRitmo);
    const tssBase = sesion.duracion || 45;
    return Math.round(tssBase * factor);
  },

  formatearTiempo(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    if (horas > 0) return `${horas}h ${mins}min`;
    else return `${mins} min`;
  },

  // ============================================================
  //  CARGA DE ENTRENAMIENTO: TSS, carga aguda/crónica y ACWR
  // ============================================================
  // Se apoya en el `tss` que ya se guarda en cada entrada del muro al
  // marcar una sesión (ver marcarSesionRealizada). Se agrupa por
  // `fechaSesion` (el día REAL de la sesión, no el momento en que se
  // pulsó el check -- importante si el usuario se "pone al día" marcando
  // sesiones de días anteriores).
  //
  // Carga aguda  = media diaria de TSS de los últimos 7 días.
  // Carga crónica = media diaria de TSS de los últimos 28 días.
  // ACWR = carga aguda / carga crónica (estándar en ciencias del deporte
  // para estimar el riesgo de lesión por picos de carga).
  //
  // Nota sobre el índice de Firestore: se reutiliza deliberadamente
  // exactamente la misma consulta (`userId == uid` + `orderBy(timestamp)`)
  // que ya usan otras partes de la app (perfil, muro...) para no depender
  // de un índice compuesto nuevo que aún no exista en el proyecto.
  async calcularCargaEntrenamiento(uid, diasCronica = 28, diasAguda = 7) {
    if (!uid) return null;
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(120)
        .get();

      const ahora = new Date(); ahora.setHours(0, 0, 0, 0);
      const desde = new Date(ahora);
      desde.setDate(desde.getDate() - (diasCronica - 1));

      const tssPorDia = {};
      snap.forEach(doc => {
        const d = doc.data();
        const rawFecha = d.fechaSesion || d.timestamp;
        if (!rawFecha) return;
        const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
        fecha.setHours(0, 0, 0, 0);
        if (fecha < desde || fecha > ahora) return;
        const key = this._dateKey(fecha);
        const tss = (typeof d.tss === 'number' && isFinite(d.tss) && d.tss > 0)
          ? d.tss
          : Math.round((d.duration || 0) * 0.85); // estimación para entradas antiguas sin tss
        tssPorDia[key] = (tssPorDia[key] || 0) + tss;
      });

      let sumaAguda = 0, sumaCronica = 0, diasConDatos = 0;
      for (let i = 0; i < diasCronica; i++) {
        const f = new Date(ahora);
        f.setDate(f.getDate() - i);
        const key = this._dateKey(f);
        const tssDia = tssPorDia[key] || 0;
        if (tssPorDia[key] !== undefined) diasConDatos++;
        sumaCronica += tssDia;
        if (i < diasAguda) sumaAguda += tssDia;
      }

      const cargaAguda = sumaAguda / diasAguda;
      const cargaCronica = sumaCronica / diasCronica;
      // Con menos de ~10 días con sesiones en las últimas 4 semanas no hay
      // base suficiente para que el ACWR sea representativo (sería ruido
      // estadístico, no una tendencia real de carga).
      const datosSuficientes = diasConDatos >= 10;
      const acwr = cargaCronica > 0 ? cargaAguda / cargaCronica : null;

      let clasificacion, color, riesgo;
      if (acwr === null) {
        clasificacion = 'Sin datos suficientes'; color = 'var(--text-secondary)'; riesgo = 'desconocido';
      } else if (acwr < 0.8) {
        clasificacion = 'Baja (posible pérdida de forma)'; color = '#5DADE2'; riesgo = 'bajo';
      } else if (acwr <= 1.3) {
        clasificacion = 'Óptima'; color = '#2ECC71'; riesgo = 'optimo';
      } else if (acwr <= 1.5) {
        clasificacion = 'Elevada — vigila la recuperación'; color = '#F39C12'; riesgo = 'elevado';
      } else {
        clasificacion = 'Alto riesgo de lesión'; color = '#E74C3C'; riesgo = 'alto';
      }

      return { cargaAguda, cargaCronica, acwr, clasificacion, color, riesgo, datosSuficientes, diasConDatos };
    } catch (error) {
      console.error('Error calculando carga de entrenamiento (TSS/ACWR):', error);
      return null;
    }
  },

  // ============================================================
  //  FORMA FÍSICA: CTL / ATL / TSB (Performance Management Chart)
  // ============================================================
  // El ACWR de arriba avisa del riesgo INMEDIATO de un pico de carga.
  // Esto responde a una pregunta distinta: "con la carga y los descansos
  // que llevo, ¿mi forma física está mejorando, empeorando o estancada?".
  // Es el mismo modelo que usan TrainingPeaks/Strava (basado en el
  // modelo de Banister), con tres números que se recalculan cada día a
  // partir del mismo `tss` por sesión que ya usa calcularCargaEntrenamiento:
  //
  //  CTL ("Forma"): media móvil EXPONENCIAL del TSS a 42 días. Sube
  //    despacio con entrenamiento constante -- es la huella de las
  //    últimas 6 semanas. Si crece semana a semana, se está construyendo
  //    forma física de verdad; si baja, se está perdiendo.
  //  ATL ("Fatiga"): igual pero a 7 días. Sube y baja rápido -- es el
  //    cansancio de la semana actual.
  //  TSB ("Frescura") = CTL - ATL del día anterior a cada sesión.
  //    Positivo y alto durante mucho tiempo = se está descansando de más
  //    y perdiendo forma; muy negativo durante mucho tiempo = riesgo de
  //    sobreentrenamiento; ligeramente negativo es normal en bloques de
  //    carga.
  //
  // A diferencia del ACWR (media PLANA de 7/28 días, donde un día pesa
  // igual que cualquier otro dentro de la ventana y desaparece de golpe
  // al salir de ella), aquí se usa media EXPONENCIAL: cada día pesa según
  // lo reciente que es, así la curva es suave y no da saltos bruscos
  // cuando un día con mucho TSS entra o sale de la ventana.
  async calcularFormaFisica(uid, diasHistorial = 90) {
    if (!uid) return null;
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(200)
        .get();

      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - (diasHistorial - 1));

      const tssPorDia = {};
      let sesionesEnVentana = 0;
      snap.forEach(doc => {
        const d = doc.data();
        const rawFecha = d.fechaSesion || d.timestamp;
        if (!rawFecha) return;
        const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
        fecha.setHours(0, 0, 0, 0);
        if (fecha < desde || fecha > hoy) return;
        const key = this._dateKey(fecha);
        const tss = (typeof d.tss === 'number' && isFinite(d.tss) && d.tss > 0)
          ? d.tss
          : Math.round((d.duration || 0) * 0.85); // estimación para entradas antiguas sin tss
        tssPorDia[key] = (tssPorDia[key] || 0) + tss;
        sesionesEnVentana++;
      });

      // Con menos de ~14 sesiones en los últimos 90 días, la EWMA de 42
      // días no tiene tiempo suficiente para "asentarse" y sería más
      // ruido que señal real -- mejor no mostrar una tendencia falsa.
      if (sesionesEnVentana < 14) {
        return { datosSuficientes: false, sesionesEnVentana };
      }

      const dias = [];
      for (let i = diasHistorial - 1; i >= 0; i--) {
        const f = new Date(hoy);
        f.setDate(f.getDate() - i);
        const key = this._dateKey(f);
        dias.push({ fecha: f, key, tss: tssPorDia[key] || 0 });
      }

      const kCTL = 42, kATL = 7;
      let ctl = 0, atl = 0;
      const serie = [];
      dias.forEach(d => {
        // El TSB del día se calcula con la forma/fatiga que había ANTES
        // de la sesión de ese día -- así un día muy duro se refleja
        // primero como más fatiga y menos frescura, no al revés.
        const tsb = ctl - atl;
        ctl = ctl + (d.tss - ctl) / kCTL;
        atl = atl + (d.tss - atl) / kATL;
        serie.push({ fecha: d.fecha, key: d.key, tss: d.tss, ctl, atl, tsb });
      });

      const ultimo = serie[serie.length - 1];
      // Tendencia: comparamos el CTL de hoy con el de hace 21 días (3
      // semanas), un margen que evita que un solo día bueno o malo
      // cambie la conclusión.
      const idxHace21 = Math.max(0, serie.length - 22);
      const ctlHace21 = serie[idxHace21]?.ctl ?? ultimo.ctl;
      const deltaCTL = ultimo.ctl - ctlHace21;
      let tendencia, tendenciaColor, tendenciaTexto;
      if (deltaCTL > 2) {
        tendencia = 'subiendo'; tendenciaColor = '#2ECC71';
        tendenciaTexto = 'Tu forma física lleva semanas construyéndose. Sigue así.';
      } else if (deltaCTL < -2) {
        tendencia = 'bajando'; tendenciaColor = '#E74C3C';
        tendenciaTexto = 'Tu forma física está bajando: llevas un tiempo entrenando menos de lo habitual.';
      } else {
        tendencia = 'estable'; tendenciaColor = 'var(--text-secondary)';
        tendenciaTexto = 'Tu forma física está estable en las últimas semanas.';
      }

      let tsbEstado, tsbColor;
      if (ultimo.tsb > 25) { tsbEstado = 'Muy fresco: puede que estés descansando de más'; tsbColor = '#5DADE2'; }
      else if (ultimo.tsb > 5) { tsbEstado = 'Fresco, buen momento para exigirte'; tsbColor = '#2ECC71'; }
      else if (ultimo.tsb > -10) { tsbEstado = 'Equilibrado'; tsbColor = 'var(--gold)'; }
      else if (ultimo.tsb > -30) { tsbEstado = 'En carga: fatiga controlada'; tsbColor = '#F39C12'; }
      else { tsbEstado = 'Fatiga alta: vigila el descanso'; tsbColor = '#E74C3C'; }

      return {
        datosSuficientes: true,
        serie,
        ctl: ultimo.ctl, atl: ultimo.atl, tsb: ultimo.tsb,
        tendencia, tendenciaColor, tendenciaTexto,
        tsbEstado, tsbColor
      };
    } catch (error) {
      console.error('Error calculando forma física (CTL/ATL/TSB):', error);
      return null;
    }
  },

  // Pinta el widget de carga de entrenamiento en la pantalla del plan.
  // Se llama al abrir/generar un plan; si no hay contenedor en el DOM
  // (pantalla distinta) no hace nada.
  async renderizarWidgetCarga() {
    const cont = document.getElementById('cargaEntrenamientoWidget');
    if (!cont || !AppState.currentUserId) return;
    const carga = await this.calcularCargaEntrenamiento(AppState.currentUserId);
    if (!carga) { cont.style.display = 'none'; return; }

    if (!carga.datosSuficientes) {
      cont.style.display = 'block';
      cont.innerHTML = `
        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:10px 14px; margin:10px 0; font-size:12px; color:var(--text-secondary); text-align:center;">
          📊 Carga de entrenamiento (ACWR): registra más sesiones (mínimo ~10 en las últimas 4 semanas) para ver esta métrica.
        </div>`;
      return;
    }

    cont.style.display = 'block';
    const acwrTexto = carga.acwr !== null ? carga.acwr.toFixed(2) : '—';
    cont.innerHTML = `
      <div style="background:var(--bg-secondary); border:1px solid ${carga.color}; border-radius:12px; padding:12px 14px; margin:10px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="font-size:12px; color:var(--text-secondary);">
            ⚡ Carga aguda (7d): <strong style="color:var(--text-primary);">${carga.cargaAguda.toFixed(0)} TSS/día</strong>
            &nbsp;·&nbsp; Crónica (28d): <strong style="color:var(--text-primary);">${carga.cargaCronica.toFixed(0)} TSS/día</strong>
          </div>
          <div style="font-size:13px; font-weight:bold; color:${carga.color};">
            ACWR ${acwrTexto} — ${carga.clasificacion}
          </div>
        </div>
      </div>`;
  },

  // Estimación del tiempo de recuperación tras una sesión, a partir de su
  // TSS y del tipo de sesión (una serie de intervalos deja más fatiga
  // muscular que un rodaje suave con el mismo TSS). Es una aproximación
  // orientativa (no hay pulsómetro/HRV conectado para calcularla de
  // verdad), pensada para dar una referencia rápida en el dashboard, no
  // una prescripción médica.
  calcularRecuperacion(tss, tipo) {
    const factorTipo = { rodaje: 0.9, tempo: 1.0, series: 1.15, largo: 1.05, strength: 1.1 }[tipo] || 1.0;
    const horas = Math.min(72, Math.max(8, Math.round((tss || 0) * 0.5 * factorTipo)));
    return horas;
  },

  // Estado de recuperación EN ESTE MOMENTO respecto a la última sesión
  // registrada (AppState.currentUserData.ultimaSesion). Reutiliza
  // exactamente la misma fórmula que la tarjeta "Carga y recuperación"
  // del dashboard (ver actualizarCargaRecuperacionDashboard en
  // index.html), para que el aviso de fatiga al marcar una sesión nueva
  // sea siempre coherente con lo que el usuario ve ahí. Devuelve null si
  // no hay sesión previa o si ya está recuperado al 100%.
  calcularEstadoRecuperacionActual() {
    try {
      const ult = AppState.currentUserData?.ultimaSesion || null;
      if (!ult || !ult.tss) return null;
      const tss = ult.tss || 0;
      const tipo = ult.trainingType || 'rodaje';
      const horas = this.calcularRecuperacion(tss, tipo);

      const fechaBase = ult.timestamp?.toDate ? ult.timestamp.toDate() : new Date(ult.timestamp);
      const fechaRecuperado = new Date(fechaBase.getTime() + horas * 3600000);
      const ahora = new Date();
      const msTotal = fechaRecuperado.getTime() - fechaBase.getTime();
      const msTranscurrido = ahora.getTime() - fechaBase.getTime();
      const pct = msTotal > 0 ? Math.min(100, Math.max(0, Math.round((msTranscurrido / msTotal) * 100))) : 100;
      const msRestante = Math.max(0, fechaRecuperado.getTime() - ahora.getTime());
      const horasRestantes = Math.ceil(msRestante / 3600000);

      return { pct, horasRestantes, tss, tipo, horasRecuperacionTotal: horas };
    } catch (e) {
      console.warn('No se pudo calcular el estado de recuperación actual:', e);
      return null;
    }
  },

  // Carga total (TSS) del plan de entrenamiento activo, con desglose
  // semanal para poder dibujar una gráfica. Se consulta por `planId`
  // (igualdad simple sobre un solo campo, no necesita ningún índice
  // compuesto) en vez de por userId+timestamp.
  async calcularCargaPlanActivo(uid, planId) {
    if (!uid || !planId) return null;
    try {
      const snap = await firebaseServices.db.collection('globalFeed')
        .where('planId', '==', planId)
        .get();

      let totalTSS = 0, totalDistancia = 0, totalSesiones = 0;
      const eventos = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.userId !== uid) return; // por si otro usuario tuviera (por error) el mismo planId
        const tss = (typeof d.tss === 'number' && isFinite(d.tss)) ? d.tss : 0;
        const rawFecha = d.fechaSesion || d.timestamp;
        if (!rawFecha) return;
        const fecha = rawFecha.toDate ? rawFecha.toDate() : new Date(rawFecha);
        totalTSS += tss;
        totalDistancia += parseFloat(d.distancia || 0);
        totalSesiones++;
        eventos.push({ fecha, tss, tipo: d.trainingType });
      });
      eventos.sort((a, b) => a.fecha - b.fecha);

      // Agrupado por semana (lunes de cada semana) para la gráfica: un
      // plan puede durar varios meses, así que un TSS por día sería
      // ilegible en una gráfica de barras.
      const porSemana = {};
      eventos.forEach(ev => {
        const lunes = new Date(ev.fecha);
        const dow = (lunes.getDay() + 6) % 7; // lunes=0 ... domingo=6
        lunes.setDate(lunes.getDate() - dow);
        lunes.setHours(0, 0, 0, 0);
        const key = this._dateKey(lunes);
        porSemana[key] = (porSemana[key] || 0) + ev.tss;
      });

      return { totalTSS, totalDistancia, totalSesiones, porSemana, eventos };
    } catch (error) {
      console.error('Error calculando carga del plan activo:', error);
      return null;
    }
  },

  // Carga el último plan guardado del usuario desde Firestore (por
  // ultimoPlanId) y pinta su calendario. No depende de si el usuario es
  // premium o no: un plan generado mientras se era premium sigue
  // perteneciendo al usuario aunque el premium caduque después, así que
  // debe poder seguir viéndolo (con el detalle de sesiones bloqueado,
  // ver abrirDetalleSesion). silencioso=true evita los toasts de error
  // cuando simplemente no hay ningún plan guardado (uso automático al
  // entrar en la pestaña Plan, ver UI.switchTab en app.js).
  async mostrarUltimoPlanGuardado(silencioso = false) {
    if (!AppState.currentUserId) {
      if (!silencioso) Utils.showToast("> NO HAY USUARIO_", 'error');
      return;
    }
    try {
      const userDoc = await firebaseServices.db.collection('users').doc(AppState.currentUserId).get();
      const ultimoPlanId = userDoc.data()?.ultimoPlanId;
      if (!ultimoPlanId) {
        if (!silencioso) Utils.showToast("> NO HAY PLAN GUARDADO_", 'error');
        return;
      }
      const planDoc = await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(ultimoPlanId)
        .get();
      if (!planDoc.exists) {
        if (!silencioso) Utils.showToast("> EL PLAN YA NO EXISTE_", 'error');
        return;
      }
      const planCompleto = planDoc.data();
      AppState.planGeneradoActual = planCompleto.params;
      AppState.planActualId = ultimoPlanId;
      AppState.sesionesRealizadas = planCompleto.sesionesRealizadas || {};
      AppState.feedbackSesiones = planCompleto.feedback || {};
      AppState.trimestreActual = 0;
      AppState.calendarioMesActual = null;
      document.getElementById("calendarioEntreno").style.display = "block";
      document.getElementById("cuestionarioEntreno").style.display = "none";
      const resumen = document.getElementById("resumenObjetivo");
      if (resumen) resumen.innerText = planCompleto.resumen || 'Plan cargado';
      const nombrePlanEl = document.getElementById('nombrePlanTexto');
      if (nombrePlanEl) nombrePlanEl.textContent = planCompleto.nombrePlan || 'Mi plan';
      this.mostrarCalendario(planCompleto.sesiones);

      // Autocorrección silenciosa: pone al día detalle.distanciaEstimada
      // de cualquier sesión que se generó ANTES del fix del ritmo/
      // factorIntensidad (ver comentario grande en
      // recalcularDistanciasPlanActual), sin pedirle nada al usuario ni
      // mostrar ningún aviso. En planes ya generados con el fix es un
      // no-op inmediato. No se espera (fire-and-forget): no debe retrasar
      // la carga de la pestaña PLAN.
      this.recalcularDistanciasPlanActual(true).catch(e => console.warn('Error en autocorrección de distancias:', e));
    } catch (error) {
      console.error('Error al cargar último plan:', error);
      if (!silencioso) Utils.showToast('Error al cargar el plan', 'error');
    }
  },

  async borrarPlanGuardado() {
    if (!AppState.currentUserId) return;
    if (!AppState.isPremium) {
      Utils.showToast("> SOLO PREMIUM PUEDE ELIMINAR PLANES_", 'error');
      return;
    }
    const confirmed = await Utils.confirm('ELIMINAR PLAN', "> ¿ELIMINAR PLAN GUARDADO?_");
    if (!confirmed) return;
    Utils.showLoading();
    try {
      await firebaseServices.db.collection('users').doc(AppState.currentUserId).update({ ultimoPlanId: null });
      if (AppState.planActualId) {
        await firebaseServices.db
          .collection('users')
          .doc(AppState.currentUserId)
          .collection('planes')
          .doc(AppState.planActualId)
          .delete();
      }
      AppState.limpiarDatosPlan();
      document.getElementById("calendarioEntreno").style.display = "none";
      document.getElementById("cuestionarioEntreno").style.display = "block";
      Utils.showToast("✅ PLAN ELIMINADO", 'success');
      if (window.UI) {
        UI.guardarEstado();
        await UI.cargarHistorialPlanes();
      }
    } catch (error) {
      console.error('Error borrando plan:', error);
      Utils.showToast('Error al eliminar el plan', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  toggleCuestionario() {
    const cuestionario = document.getElementById('cuestionarioEntreno');
    if (cuestionario) {
      const isVisible = cuestionario.style.display !== 'none';
      cuestionario.style.display = isVisible ? 'none' : 'block';
    }
  },

  async analizarFeedbackAdaptativo() {
    if (!AppState.currentUserId || !AppState.planActualId) return { volumen: 1.0, intensidad: 1.0 };
    try {
      const planDoc = await firebaseServices.db
        .collection('users')
        .doc(AppState.currentUserId)
        .collection('planes')
        .doc(AppState.planActualId)
        .get();
      if (!planDoc.exists) return { volumen: 1.0, intensidad: 1.0 };
      const feedback = planDoc.data().feedback || {};
      const valores = Object.values(feedback);
      if (valores.length === 0) return { volumen: 1.0, intensidad: 1.0 };
      const counts = { 1:0, 2:0, 3:0, 4:0 };
      valores.forEach(v => { if (counts[v] !== undefined) counts[v]++; });
      const total = valores.length;
      const muyDuraRatio = counts[1] / total;
      const excelenteRatio = counts[4] / total;
      let volumen = 1.0;
      let intensidad = 1.0;
      if (muyDuraRatio > 0.3) {
        volumen = 0.9;
        intensidad = 0.9;
        Utils.showToast('⚠️ Se han detectado sesiones muy duras. Reducimos la carga de las próximas semanas.', 'warning');
      } else if (excelenteRatio > 0.5) {
        volumen = 1.05;
        intensidad = 1.05;
        Utils.showToast('🔥 ¡Excelente rendimiento! Aumentamos ligeramente la carga.', 'success');
      }
      return { volumen, intensidad };
    } catch (error) {
      console.error('Error analizando feedback:', error);
      return { volumen: 1.0, intensidad: 1.0 };
    }
  },

  validarOpcionesPlan() {
    const distancia = document.getElementById("distObjetivo")?.value;
    const duracion = parseInt(document.getElementById("duracionPlan")?.value);
    const experiencia = document.getElementById("experienciaDistancia")?.value;
    const nivel = document.getElementById("nivel")?.value;
    const msgDiv = document.getElementById("info-mensaje-distancia");
    if (!msgDiv) return;

    if (distancia === "medio" && duracion === 1) {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MEDIA MARATÓN se recomienda mínimo 3 meses de planificación.";
    } else if (distancia === "maraton" && duracion === 1) {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MARATÓN se recomienda mínimo 3 meses de planificación.";
    } else if (distancia === "maraton" && duracion === 3 && experiencia === "no") {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MARATÓN en 3 meses se necesita experiencia previa. Considera 6 meses.";
    } else if (distancia === "medio" && duracion === 3 && experiencia === "no") {
      msgDiv.style.display = "block";
      msgDiv.innerHTML = "⚠️ Para MEDIA MARATÓN en 3 meses se necesita experiencia previa.";
    } else {
      msgDiv.style.display = "none";
    }
  }
};

setTimeout(() => {
  if (AppState.currentUserId && firebaseServices.db) {
    PlanGenerator.limpiarMuroGlobal().catch(console.error);
  }
}, 2000);

window.PlanGenerator = PlanGenerator;
window.toggleCuestionario = () => PlanGenerator.toggleCuestionario();
window.generarCalendarioEntreno = () => PlanGenerator.generarCalendarioEntreno();
window.validarOpcionesPlan = () => PlanGenerator.validarOpcionesPlan();
window.mostrarUltimoPlanGuardado = () => PlanGenerator.mostrarUltimoPlanGuardado();
window.borrarPlanGuardado = () => PlanGenerator.borrarPlanGuardado();
window.cambiarTrimestre = async (delta) => { await PlanGenerator.cambiarTrimestre(delta); };
window.cerrarModalSesion = () => {
  // Reset de scroll al cerrar (mientras el modal aún es visible, para que
  // el navegador sí lo aplique) -- así la próxima apertura ya nace arriba
  // del todo, sin depender de que el reset al abrir llegue a tiempo.
  // (Nota: app.js redefine esta misma función y es la que gana en tiempo
  // de ejecución; se mantiene igual aquí por consistencia.)
  const modalSesionEl = document.getElementById("detalleSesion");
  const wrapperEl = document.getElementById("modalColorWrapper");
  if (modalSesionEl) modalSesionEl.scrollTop = 0;
  if (wrapperEl) wrapperEl.scrollTop = 0;
  modalSesionEl?.classList.remove("visible");
  document.getElementById("modalOverlay")?.classList.remove("visible");
  AppState.currentSesionDetalle = null;
};

console.log('✅ PlanGenerator v2.63 - Cuota de la tirada larga escalada por nivel/fase (antes 10% fijo); ya casi nunca hace falta alargarla por encima de lo planificado');