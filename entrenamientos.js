// ==================== entrenamientos.js - BIBLIOTECA DE MICROCICLOS + MATRIZ COMPLETA ====================
// Versión: 3.5 - Trail generado dinámicamente a partir de runner
// Contiene 1.344 entrenamientos y microciclos para todas las distancias y niveles
// ============================================================================

const ENTRENAMIENTOS_DB = {
  runner: {
    "2k": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje suave", duracion: 25, unidad: "min", desc: "Sesión muy suave para activación.", estructura: "10' calentamiento + 15' Z2", sensacion: "Muy cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Fondo aeróbico", duracion: 30, unidad: "min", desc: "Mantén ritmo constante aeróbico.", estructura: "5' calentamiento + 20' Z2 + 5' enfriamiento", sensacion: "Cómodo pero constante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 30, unidad: "min", desc: "Últimos 10' aumenta ritmo.", estructura: "10' Z2 suave + 10' Z2 medio + 10' Z2 alto", sensacion: "Acabar con ganas", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 20, unidad: "min", desc: "Sesión muy suave para activar la circulación.", estructura: "20' Z1", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje matinal", duracion: 30, unidad: "min", desc: "Despertar suave.", estructura: "30' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con cambios de ritmo", duracion: 35, unidad: "min", desc: "Introduce 4 cambios de ritmo de 1'", estructura: "10' calentamiento + 4x(1' rápido + 2' suave) + 10' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de base", duracion: 40, unidad: "min", desc: "Fondo aeróbico para construir resistencia.", estructura: "40' Z2 continuo", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje regenerativo", duracion: 25, unidad: "min", desc: "Después de sesión dura.", estructura: "25' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Series 200m", duracion: 35, unidad: "min", desc: "8x200m con recuperación completa.", estructura: "15' calentamiento + 6' series (8x200m) + 10' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 200 },
          { nombre: "Fartlek principiante", duracion: 30, unidad: "min", desc: "Juega con ritmos: 2' rápido + 2' suave.", estructura: "10' calentamiento + 10' fartlek + 10' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 150m", duracion: 30, unidad: "min", desc: "10x150m con recuperación 45''.", estructura: "15' calentamiento + 6' series (10x150m) + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 150 },
          { nombre: "Series 300m", duracion: 35, unidad: "min", desc: "8x300m con recuperación 1'30.", estructura: "15' calentamiento + 10' series (8x300m) + 10' enfriamiento", sensacion: "Velocidad", tipo: "series", zona: "Z5", repeticiones: 8, distanciaSerie: 300 },
          { nombre: "Series 500m", duracion: 40, unidad: "min", desc: "5x500m con recuperación 2'.", estructura: "15' calentamiento + 10' series (5x500m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 500 },
          { nombre: "Series 700m", duracion: 45, unidad: "min", desc: "4x700m con recuperación 2'30.", estructura: "15' calentamiento + 11' series (4x700m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 4, distanciaSerie: 700 },
          { nombre: "Series 1000m", duracion: 50, unidad: "min", desc: "3x1000m con recuperación 3'.", estructura: "15' calentamiento + 12' series (3x1000m) + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 1000 }
        ],
        tempo: [
          { nombre: "Tempo corto", duracion: 30, unidad: "min", desc: "Ritmo constante en tempo.", estructura: "10' calentamiento + 15' Z3 + 5' enfriamiento", sensacion: "Controlado", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 35, unidad: "min", desc: "Aumenta ritmo cada 5'.", estructura: "10' calentamiento + 5' Z3 + 5' Z4 + 5' Z3 + 5' Z4 + 5' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral", duracion: 35, unidad: "min", desc: "20' a ritmo umbral.", estructura: "10' calentamiento + 20' Z4 + 5' enfriamiento", sensacion: "Fuerte", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo largo", duracion: 40, unidad: "min", desc: "25' a ritmo umbral.", estructura: "10' calentamiento + 25' Z4 + 5' enfriamiento", sensacion: "Umbral", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 45, unidad: "min", desc: "Alterna 5' Z3 / 3' Z4.", estructura: "10' calentamiento + 4x(5' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo progresivo largo", duracion: 50, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' calentamiento + 10' Z3 + 10' Z4 + 10' Z3 + 10' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 55, unidad: "min", desc: "35' a ritmo umbral.", estructura: "10' calentamiento + 35' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo base", duracion: 45, unidad: "min", desc: "Primera toma de contacto con volumen.", estructura: "10' calentamiento + 30' Z2 + 5' enfriamiento", sensacion: "Con energía", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con cambios", duracion: 50, unidad: "min", desc: "Últimos 15' a ritmo tempo.", estructura: "25' Z2 + 15' Z3 + 10' enfriamiento", sensacion: "Terminar fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 55, unidad: "min", desc: "Trabajo de fondo.", estructura: "55' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 20'.", estructura: "40' Z2 + 20' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 70, unidad: "min", desc: "Incluye cambios de ritmo.", estructura: "45' Z2 + 4x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 65, unidad: "min", desc: "Fondo largo continuo.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje activo", duracion: 45, unidad: "min", desc: "Ritmo vivo dentro de Z2.", estructura: "10' calentamiento + 30' Z2 vivo + 5' enfriamiento", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje calidad", duracion: 50, unidad: "min", desc: "Ritmo sostenido en Z2 alto.", estructura: "50' Z2 continuo", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje aeróbico", duracion: 55, unidad: "min", desc: "Fondo aeróbico.", estructura: "55' Z2 constante", sensacion: "Fluido", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 40, unidad: "min", desc: "Sesión para mantener forma.", estructura: "40' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 50, unidad: "min", desc: "Introduce 3 cambios de ritmo.", estructura: "10' calentamiento + 3x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación activa", duracion: 35, unidad: "min", desc: "Después de sesión intensa.", estructura: "35' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 60, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "60' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 20' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 400m", duracion: 45, unidad: "min", desc: "6x400m con recuperación 2'.", estructura: "15' calentamiento + 12' series (6x400m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 400 },
          { nombre: "Series 600m", duracion: 50, unidad: "min", desc: "5x600m con recuperación 2'30.", estructura: "15' calentamiento + 14' series (5x600m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 600 },
          { nombre: "Pirámide", duracion: 50, unidad: "min", desc: "200-400-600-400-200m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 800m", duracion: 55, unidad: "min", desc: "4x800m con recuperación 3'.", estructura: "15' calentamiento + 15' series (4x800m) + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z4", repeticiones: 4, distanciaSerie: 800 },
          { nombre: "Series 1000m", duracion: 60, unidad: "min", desc: "3x1000m con recuperación 3'.", estructura: "15' calentamiento + 15' series (3x1000m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 1000 },
          { nombre: "Fartlek avanzado", duracion: 45, unidad: "min", desc: "Juega con ritmos variables.", estructura: "10' calentamiento + 20' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 200m rápidas", duracion: 40, unidad: "min", desc: "10x200m con recuperación 1'.", estructura: "15' calentamiento + 10' series (10x200m) + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 200 }
        ],
        tempo: [
          { nombre: "Tempo sostenido", duracion: 40, unidad: "min", desc: "25' a ritmo de tempo.", estructura: "10' calentamiento + 25' tempo + 5' enfriamiento", sensacion: "Continuo", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral", duracion: 45, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' Z4 + 5' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 45, unidad: "min", desc: "Alterna 5' Z3 / 3' Z4.", estructura: "10' calentamiento + 5x(5' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 50, unidad: "min", desc: "35' a ritmo tempo.", estructura: "10' calentamiento + 35' Z3 + 5' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 50, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' calentamiento + 10' Z3 + 10' Z4 + 10' Z3 + 10' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 55, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 5' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo con cambios", duracion: 45, unidad: "min", desc: "Introduce 4 cambios de ritmo.", estructura: "10' calentamiento + 25' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" }
        ],
        largo: [
          { nombre: "Largo con cambios", duracion: 55, unidad: "min", desc: "Últimos 15' a ritmo tempo.", estructura: "25' Z2 + 15' Z3 + 15' enfriamiento", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo progresivo", duracion: 60, unidad: "min", desc: "De Z2 a Z4 progresivamente.", estructura: "20' Z2 + 20' Z3 + 20' Z4", sensacion: "Simulación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 65, unidad: "min", desc: "Fondo largo.", estructura: "65' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo calidad", duracion: 70, unidad: "min", desc: "Incluye cambios de ritmo.", estructura: "45' Z2 + 5x3' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo específico", duracion: 75, unidad: "min", desc: "Preparación para competición.", estructura: "50' Z2 + 6x3' Z4 + 10' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo resistencia", duracion: 80, unidad: "min", desc: "Fondo largo continuo.", estructura: "80' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con series", duracion: 85, unidad: "min", desc: "Incluye series cortas.", estructura: "55' Z2 + 4x1000m Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje calidad", duracion: 50, unidad: "min", desc: "Ritmo sostenido en Z2 alto.", estructura: "50' Z2 continuo", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje activo", duracion: 55, unidad: "min", desc: "Ritmo vivo exigente.", estructura: "55' Z2 vivo", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje técnico", duracion: 60, unidad: "min", desc: "Enfoque en cadencia.", estructura: "60' Z2 con cadencia alta", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 45, unidad: "min", desc: "Sesión para mantener forma.", estructura: "45' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 55, unidad: "min", desc: "Introduce 4 cambios de ritmo.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 40, unidad: "min", desc: "Después de sesión intensa.", estructura: "40' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 65, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 800m", duracion: 55, unidad: "min", desc: "5x800m con recuperación 3'.", estructura: "15' calentamiento + 18' series (5x800m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 5, distanciaSerie: 800 },
          { nombre: "Series 1000m", duracion: 60, unidad: "min", desc: "4x1000m con recuperación 3'.", estructura: "15' calentamiento + 20' series (4x1000m) + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1000 },
          { nombre: "Series 1200m", duracion: 65, unidad: "min", desc: "3x1200m con recuperación 3'30.", estructura: "15' calentamiento + 18' series (3x1200m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 1200 },
          { nombre: "Series 1600m", duracion: 70, unidad: "min", desc: "3x1600m con recuperación 4'.", estructura: "15' calentamiento + 24' series (3x1600m) + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 1600 },
          { nombre: "Pirámide larga", duracion: 65, unidad: "min", desc: "200-400-800-1200-800-400-200m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Fartlek avanzado", duracion: 55, unidad: "min", desc: "Juega con ritmos intensos.", estructura: "10' calentamiento + 30' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z5" },
          { nombre: "Series 600m", duracion: 60, unidad: "min", desc: "6x600m con recuperación 2'.", estructura: "15' calentamiento + 18' series (6x600m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 6, distanciaSerie: 600 }
        ],
        tempo: [
          { nombre: "Tempo largo", duracion: 50, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' Z4 + 10' enfriamiento", sensacion: "Umbral", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo umbral", duracion: 55, unidad: "min", desc: "35' a ritmo umbral.", estructura: "10' calentamiento + 35' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 55, unidad: "min", desc: "Alterna 3' Z3 / 3' Z4.", estructura: "10' calentamiento + 6x(3' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo competición", duracion: 60, unidad: "min", desc: "40' a ritmo competición.", estructura: "10' calentamiento + 40' Z4 + 10' enfriamiento", sensacion: "Ritmo carrera", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 8'.", estructura: "10' calentamiento + 8' Z3 + 8' Z4 + 8' Z3 + 8' Z4 + 8' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 65, unidad: "min", desc: "45' a ritmo umbral.", estrutura: "10' calentamiento + 45' Z4 + 10' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo con cambios", duracion: 55, unidad: "min", desc: "Introduce 5 cambios de ritmo.", estructura: "10' calentamiento + 35' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo progresivo", duracion: 70, unidad: "min", desc: "De Z2 a Z4 progresivamente.", estructura: "25' Z2 + 25' Z3 + 20' Z4", sensacion: "Simulación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo específico", duracion: 75, unidad: "min", desc: "Incluye cambios de ritmo.", estructura: "45' Z2 + 5x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 80, unidad: "min", desc: "Progresión constante.", estructura: "40' Z2 + 25' Z3 + 15' Z4", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 85, unidad: "min", desc: "Fondo largo continuo.", estructura: "85' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con series", duracion: 90, unidad: "min", desc: "Incluye series largas.", estructura: "55' Z2 + 4x1000m Z4 + 15' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo resistencia", duracion: 95, unidad: "min", desc: "Fondo largo con cambios.", estructura: "70' Z2 + 25' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo ultradistancia", duracion: 100, unidad: "min", desc: "Preparación para maratón.", estructura: "80' Z2 + 20' Z3", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z3" }
        ]
      }
    },
    "5k": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje 5k suave", duracion: 35, unidad: "min", desc: "Rodaje suave para 5k.", estructura: "10' calentamiento + 20' Z2 + 5' enfriamiento", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Fondo 5k", duracion: 40, unidad: "min", desc: "Fondo aeróbico.", estructura: "40' Z2 continuo", sensacion: "Constante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo 5k", duracion: 40, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' calentamiento + 20' progresivo + 10' enfriamiento", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación 5k", duracion: 30, unidad: "min", desc: "Sesión muy suave.", estructura: "30' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje matinal 5k", duracion: 35, unidad: "min", desc: "Despertar suave.", estructura: "35' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con cambios 5k", duracion: 40, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 20' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje base 5k", duracion: 45, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "45' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje regenerativo 5k", duracion: 30, unidad: "min", desc: "Después de sesión dura.", estructura: "30' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Series 300m", duracion: 40, unidad: "min", desc: "8x300m con recuperación.", estructura: "15' calentamiento + 10' series (8x300m) + 10' enfriamiento", sensacion: "Velocidad", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 300 },
          { nombre: "Fartlek 5k", duracion: 35, unidad: "min", desc: "1' rápido + 2' suave.", estructura: "10' calentamiento + 8 repeticiones + 5' enfriamiento", sensacion: "Dinámico", tipo: "series", zona: "Z4" },
          { nombre: "Series 200m", duracion: 35, unidad: "min", desc: "10x200m con recuperación 1'.", estructura: "15' calentamiento + 8' series (10x200m) + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 200 },
          { nombre: "Series 400m", duracion: 40, unidad: "min", desc: "6x400m con recuperación 2'.", estructura: "15' calentamiento + 10' series (6x400m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 400 },
          { nombre: "Series 600m", duracion: 45, unidad: "min", desc: "4x600m con recuperación 2'30.", estructura: "15' calentamiento + 10' series (4x600m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 4, distanciaSerie: 600 },
          { nombre: "Pirámide 5k", duracion: 45, unidad: "min", desc: "200-400-600-400-200m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 800m", duracion: 50, unidad: "min", desc: "3x800m con recuperación 3'.", estructura: "15' calentamiento + 10' series (3x800m) + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 800 }
        ],
        tempo: [
          { nombre: "Tempo 5k", duracion: 35, unidad: "min", desc: "15' a ritmo tempo.", estructura: "10' calentamiento + 15' Z3 + 10' enfriamiento", sensacion: "Constante", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo corto", duracion: 30, unidad: "min", desc: "12' a ritmo tempo.", estructura: "10' calentamiento + 12' Z3 + 8' enfriamiento", sensacion: "Controlado", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 40, unidad: "min", desc: "Aumenta ritmo cada 5'.", estructura: "10' calentamiento + 5' Z2 + 5' Z3 + 5' Z4 + 5' Z3 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z2-Z4" },
          { nombre: "Tempo umbral", duracion: 40, unidad: "min", desc: "20' a ritmo umbral.", estructura: "10' calentamiento + 20' Z4 + 10' enfriamiento", sensacion: "Fuerte", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo largo", duracion: 45, unidad: "min", desc: "25' a ritmo tempo.", estructura: "10' calentamiento + 25' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 40, unidad: "min", desc: "Alterna 3' Z3 / 2' Z4.", estructura: "10' calentamiento + 6x(3' Z3 + 2' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 45, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 25' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" }
        ],
        largo: [
          { nombre: "Largo 5k", duracion: 50, unidad: "min", desc: "Rodaje largo resistencia.", estructura: "50' Z2 continuo", sensacion: "Base", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con cambios", duracion: 55, unidad: "min", desc: "Últimos 15' más rápido.", estructura: "40' Z2 + 15' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 60, unidad: "min", desc: "Fondo largo.", estructura: "60' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "40' Z2 + 15' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 65, unidad: "min", desc: "Incluye cambios.", estructura: "45' Z2 + 4x3' Z4 + 8' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 60, unidad: "min", desc: "Progresión constante.", estructura: "40' Z2 + 20' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 70, unidad: "min", desc: "Fondo largo.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje activo 5k", duracion: 50, unidad: "min", desc: "Ritmo vivo controlado.", estructura: "50' Z2 vivo", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje calidad", duracion: 55, unidad: "min", desc: "Ritmo exigente.", estructura: "55' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje aeróbico", duracion: 60, unidad: "min", desc: "Fondo aeróbico.", estructura: "60' Z2 constante", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 45, unidad: "min", desc: "Sesión para mantener forma.", estructura: "45' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 55, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 40, unidad: "min", desc: "Después de sesión intensa.", estructura: "40' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 65, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 25' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 600m", duracion: 55, unidad: "min", desc: "6x600m con recuperación.", estructura: "15' calentamiento + 16' series (6x600m) + 10' enfriamiento", sensacion: "Intensidad", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 600 },
          { nombre: "Series 800m", duracion: 60, unidad: "min", desc: "5x800m con recuperación 2'30.", estructura: "15' calentamiento + 18' series (5x800m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 800 },
          { nombre: "Pirámide 5k", duracion: 60, unidad: "min", desc: "200-400-600-800-600-400-200m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 1000m", duracion: 65, unidad: "min", desc: "4x1000m con recuperación 3'.", estructura: "15' calentamiento + 20' series (4x1000m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1000 },
          { nombre: "Series 400m", duracion: 55, unidad: "min", desc: "8x400m con recuperación 1'30.", estructura: "15' calentamiento + 15' series (8x400m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 400 },
          { nombre: "Fartlek avanzado", duracion: 55, unidad: "min", desc: "Juega con ritmos.", estructura: "10' calentamiento + 30' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 200m rápidas", duracion: 50, unidad: "min", desc: "12x200m con recuperación 1'.", estructura: "15' calentamiento + 12' series (12x200m) + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5", repeticiones: 12, distanciaSerie: 200 }
        ],
        tempo: [
          { nombre: "Tempo umbral", duracion: 50, unidad: "min", desc: "25' a ritmo umbral.", estructura: "10' calentamiento + 25' umbral + 15' enfriamiento", sensacion: "Sostenido", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo 5k", duracion: 55, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' Z4 + 15' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 55, unidad: "min", desc: "Alterna 5' Z3 / 3' Z4.", estructura: "10' calentamiento + 4x(5' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 60, unidad: "min", desc: "35' a ritmo tempo.", estructura: "10' calentamiento + 35' Z3 + 15' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 60, unidad: "min", desc: "Aumenta cada 8'.", estructura: "10' calentamiento + 8' Z3 + 8' Z4 + 8' Z3 + 8' Z4 + 8' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 55, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 35' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral largo", duracion: 65, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 15' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo calidad", duracion: 75, unidad: "min", desc: "Progresión últimos 20'.", estructura: "55' Z2 + 20' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con cambios", duracion: 80, unidad: "min", desc: "Incluye series cortas.", estructura: "60' Z2 + 5x3' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 85, unidad: "min", desc: "Aumenta ritmo cada 20'.", estructura: "45' Z2 + 25' Z3 + 15' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 90, unidad: "min", desc: "Incluye cambios.", estructura: "60' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 95, unidad: "min", desc: "Fondo largo continuo.", estructura: "95' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 100, unidad: "min", desc: "Fondo largo con cambios.", estructura: "75' Z2 + 25' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 105, unidad: "min", desc: "Incluye series largas.", estructura: "75' Z2 + 5x800m Z4 + 15' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje alto", duracion: 55, unidad: "min", desc: "Ritmo exigente Z2.", estructura: "55' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje activo", duracion: 60, unidad: "min", desc: "Ritmo vivo.", estructura: "60' Z2 vivo", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje técnico", duracion: 65, unidad: "min", desc: "Enfoque en cadencia.", estructura: "65' Z2 cadencia alta", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 50, unidad: "min", desc: "Sesión para mantener forma.", estructura: "50' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Después de sesión intensa.", estructura: "45' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 70, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 1000m", duracion: 60, unidad: "min", desc: "5x1000m con recuperación.", estructura: "15' calentamiento + 25' series (5x1000m) + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5", repeticiones: 5, distanciaSerie: 1000 },
          { nombre: "Series 1200m", duracion: 65, unidad: "min", desc: "4x1200m con recuperación 3'30.", estructura: "15' calentamiento + 24' series (4x1200m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1200 },
          { nombre: "Series 1600m", duracion: 70, unidad: "min", desc: "3x1600m con recuperación 4'.", estructura: "15' calentamiento + 24' series (3x1600m) + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 1600 },
          { nombre: "Series 800m", duracion: 60, unidad: "min", desc: "6x800m con recuperación 2'.", estructura: "15' calentamiento + 24' series (6x800m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 6, distanciaSerie: 800 },
          { nombre: "Pirámide larga", duracion: 70, unidad: "min", desc: "400-800-1200-1600-1200-800-400m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Fartlek avanzado", duracion: 60, unidad: "min", desc: "Juega con ritmos intensos.", estructura: "10' calentamiento + 35' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z5" },
          { nombre: "Series 600m", duracion: 65, unidad: "min", desc: "8x600m con recuperación 1'30.", estructura: "15' calentamiento + 24' series (8x600m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 8, distanciaSerie: 600 }
        ],
        tempo: [
          { nombre: "Tempo competición", duracion: 55, unidad: "min", desc: "35' a ritmo 5k.", estructura: "10' calentamiento + 35' Z4 + 10' enfriamiento", sensacion: "Ritmo carrera", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo umbral", duracion: 60, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna 4' Z3 / 3' Z4.", estructura: "10' calentamiento + 6x(4' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 65, unidad: "min", desc: "45' a ritmo tempo.", estructura: "10' calentamiento + 45' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 65, unidad: "min", desc: "Aumenta cada 7'.", estructura: "10' calentamiento + 7' Z3 + 7' Z4 + 7' Z3 + 7' Z4 + 7' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 70, unidad: "min", desc: "50' a ritmo umbral.", estructura: "10' calentamiento + 50' Z4 + 10' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo específico", duracion: 85, unidad: "min", desc: "Cambios a ritmo 5k.", estructura: "50' Z2 + 5x5' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 90, unidad: "min", desc: "Progresión constante.", estructura: "55' Z2 + 35' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 95, unidad: "min", desc: "Incluye series largas.", estructura: "60' Z2 + 4x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 100, unidad: "min", desc: "Aumenta ritmo cada 25'.", estructura: "50' Z2 + 30' Z3 + 20' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 105, unidad: "min", desc: "Fondo largo continuo.", estructura: "105' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 110, unidad: "min", desc: "Fondo largo con cambios.", estructura: "80' Z2 + 30' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo ultradistancia", duracion: 115, unidad: "min", desc: "Preparación para 5k.", estructura: "85' Z2 + 30' Z3", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z3" }
        ]
      }
    },
    "10k": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje 10k", duracion: 40, unidad: "min", desc: "Rodaje suave 10k.", estructura: "10' calentamiento + 25' Z2 + 5' enfriamiento", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Fondo 10k", duracion: 45, unidad: "min", desc: "Fondo aeróbico.", estructura: "45' Z2 continuo", sensacion: "Constante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 45, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "10' calentamiento + 25' progresivo + 10' enfriamiento", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 35, unidad: "min", desc: "Sesión muy suave.", estructura: "35' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje matinal", duracion: 40, unidad: "min", desc: "Despertar suave.", estructura: "40' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con cambios", duracion: 45, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 25' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje base", duracion: 50, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "50' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje regenerativo", duracion: 35, unidad: "min", desc: "Después de sesión dura.", estructura: "35' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Series 400m", duracion: 40, unidad: "min", desc: "8x400m con recuperación.", estructura: "15' calentamiento + 13' series (8x400m) + 10' enfriamiento", sensacion: "Controladas", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 400 },
          { nombre: "Fartlek 10k", duracion: 40, unidad: "min", desc: "2' rápido + 2' suave.", estructura: "10' calentamiento + 7 repeticiones + 5' enfriamiento", sensacion: "Dinámico", tipo: "series", zona: "Z4" },
          { nombre: "Series 300m", duracion: 35, unidad: "min", desc: "10x300m con recuperación 1'.", estructura: "15' calentamiento + 12' series (10x300m) + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 300 },
          { nombre: "Series 500m", duracion: 45, unidad: "min", desc: "6x500m con recuperación 2'.", estructura: "15' calentamiento + 12' series (6x500m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 500 },
          { nombre: "Series 600m", duracion: 50, unidad: "min", desc: "5x600m con recuperación 2'30.", estructura: "15' calentamiento + 12' series (5x600m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 600 },
          { nombre: "Pirámide 10k", duracion: 45, unidad: "min", desc: "400-600-800-600-400m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 800m", duracion: 55, unidad: "min", desc: "4x800m con recuperación 3'.", estructura: "15' calentamiento + 13' series (4x800m) + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 800 }
        ],
        tempo: [
          { nombre: "Tempo 10k", duracion: 40, unidad: "min", desc: "20' a ritmo tempo.", estructura: "10' calentamiento + 20' Z3 + 10' enfriamiento", sensacion: "Constante", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo corto", duracion: 35, unidad: "min", desc: "15' a ritmo tempo.", estructura: "10' calentamiento + 15' Z3 + 10' enfriamiento", sensacion: "Controlado", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 45, unidad: "min", desc: "Aumenta cada 7'30.", estructura: "10' calentamiento + 7'30 Z3 + 7'30 Z4 + 7'30 Z3 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral", duracion: 45, unidad: "min", desc: "25' a ritmo umbral.", estructura: "10' calentamiento + 25' Z4 + 10' enfriamiento", sensacion: "Fuerte", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo largo", duracion: 50, unidad: "min", desc: "30' a ritmo tempo.", estructura: "10' calentamiento + 30' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 45, unidad: "min", desc: "Alterna 4' Z3 / 2' Z4.", estructura: "10' calentamiento + 5x(4' Z3 + 2' Z4) + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 50, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 30' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" }
        ],
        largo: [
          { nombre: "Largo 10k", duracion: 60, unidad: "min", desc: "Rodaje largo.", estructura: "60' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con cambios", duracion: 65, unidad: "min", desc: "Últimos 20' más rápido.", estructura: "45' Z2 + 20' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 70, unidad: "min", desc: "Fondo largo.", estructura: "70' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 20'.", estructura: "45' Z2 + 20' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 75, unidad: "min", desc: "Incluye cambios.", estructura: "50' Z2 + 4x3' Z4 + 10' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 80, unidad: "min", desc: "Progresión constante.", estructura: "50' Z2 + 30' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 85, unidad: "min", desc: "Fondo largo.", estructura: "85' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje activo 10k", duracion: 45, unidad: "min", desc: "Ritmo vivo Z2.", estructura: "45' Z2 vivo", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje calidad", duracion: 50, unidad: "min", desc: "Ritmo exigente.", estructura: "50' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje aeróbico", duracion: 55, unidad: "min", desc: "Fondo aeróbico.", estructura: "55' Z2 constante", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 40, unidad: "min", desc: "Sesión para mantener forma.", estructura: "40' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 50, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 35, unidad: "min", desc: "Después de sesión intensa.", estructura: "35' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 60, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "60' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 20' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 800m", duracion: 50, unidad: "min", desc: "6x800m con recuperación.", estructura: "15' calentamiento + 19' series (6x800m) + 10' enfriamiento", sensacion: "Intensidad", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 800 },
          { nombre: "Series 1000m", duracion: 55, unidad: "min", desc: "5x1000m con recuperación 2'30.", estructura: "15' calentamiento + 20' series (5x1000m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 1000 },
          { nombre: "Pirámide 10k", duracion: 55, unidad: "min", desc: "400-800-1200-800-400m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 1200m", duracion: 60, unidad: "min", desc: "4x1200m con recuperación 3'.", estructura: "15' calentamiento + 19' series (4x1200m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1200 },
          { nombre: "Series 600m", duracion: 50, unidad: "min", desc: "8x600m con recuperación 1'30.", estructura: "15' calentamiento + 19' series (8x600m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 600 },
          { nombre: "Fartlek avanzado", duracion: 50, unidad: "min", desc: "Juega con ritmos.", estructura: "10' calentamiento + 25' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 400m", duracion: 55, unidad: "min", desc: "10x400m con recuperación 1'30.", estructura: "15' calentamiento + 16' series (10x400m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 10, distanciaSerie: 400 }
        ],
        tempo: [
          { nombre: "Tempo umbral", duracion: 45, unidad: "min", desc: "25' a ritmo umbral.", estructura: "10' calentamiento + 25' umbral + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo 10k", duracion: 50, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' Z4 + 10' enfriamiento", sensacion: "Sostenido", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 50, unidad: "min", desc: "Alterna 6' Z3 / 3' Z4.", estructura: "10' calentamiento + 4x(6' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 55, unidad: "min", desc: "35' a ritmo tempo.", estructura: "10' calentamiento + 35' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 55, unidad: "min", desc: "Aumenta cada 8'.", estructura: "10' calentamiento + 8' Z3 + 8' Z4 + 8' Z3 + 8' Z4 + 8' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 50, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 30' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral largo", duracion: 60, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 10' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo calidad", duracion: 75, unidad: "min", desc: "Progresión últimos 25'.", estructura: "50' Z2 + 25' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con cambios", duracion: 80, unidad: "min", desc: "Incluye series.", estructura: "55' Z2 + 5x3' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 85, unidad: "min", desc: "Aumenta ritmo cada 25'.", estructura: "35' Z2 + 25' Z3 + 25' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 90, unidad: "min", desc: "Incluye cambios.", estructura: "60' Z2 + 6x3' Z4 + 12' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 95, unidad: "min", desc: "Fondo largo continuo.", estructura: "95' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 100, unidad: "min", desc: "Fondo largo con cambios.", estructura: "70' Z2 + 30' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 105, unidad: "min", desc: "Incluye series largas.", estructura: "70' Z2 + 5x800m Z4 + 15' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje alto", duracion: 50, unidad: "min", desc: "Ritmo exigente Z2.", estructura: "50' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje activo", duracion: 55, unidad: "min", desc: "Ritmo vivo.", estructura: "55' Z2 vivo", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje técnico", duracion: 60, unidad: "min", desc: "Enfoque técnico.", estructura: "60' Z2 cadencia alta", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 45, unidad: "min", desc: "Sesión para mantener forma.", estructura: "45' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 55, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 40, unidad: "min", desc: "Después de sesión intensa.", estructura: "40' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 65, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 25' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 1600m", duracion: 55, unidad: "min", desc: "4x1600m con recuperación.", estructura: "15' calentamiento + 26' series (4x1600m) + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1600 },
          { nombre: "Series 2000m", duracion: 60, unidad: "min", desc: "3x2000m con recuperación 4'.", estructura: "15' calentamiento + 24' series (3x2000m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 2000 },
          { nombre: "Series 3000m", duracion: 65, unidad: "min", desc: "2x3000m con recuperación 5'.", estructura: "15' calentamiento + 24' series (2x3000m) + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5", repeticiones: 2, distanciaSerie: 3000 },
          { nombre: "Series 1000m", duracion: 55, unidad: "min", desc: "5x1000m con recuperación 2'.", estructura: "15' calentamiento + 20' series (5x1000m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 5, distanciaSerie: 1000 },
          { nombre: "Pirámide larga", duracion: 65, unidad: "min", desc: "800-1600-2400-1600-800m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Fartlek avanzado", duracion: 55, unidad: "min", desc: "Juega con ritmos intensos.", estructura: "10' calentamiento + 30' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z5" },
          { nombre: "Series 800m", duracion: 60, unidad: "min", desc: "8x800m con recuperación 1'30.", estructura: "15' calentamiento + 26' series (8x800m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 8, distanciaSerie: 800 }
        ],
        tempo: [
          { nombre: "Tempo 10k", duracion: 50, unidad: "min", desc: "35' a ritmo 10k.", estructura: "10' calentamiento + 35' Z4 + 5' enfriamiento", sensacion: "Ritmo carrera", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo umbral", duracion: 55, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 5' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 55, unidad: "min", desc: "Alterna 5' Z3 / 3' Z4.", estructura: "10' calentamiento + 5x(5' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 60, unidad: "min", desc: "45' a ritmo tempo.", estructura: "10' calentamiento + 45' Z3 + 5' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 60, unidad: "min", desc: "Aumenta cada 6'.", estructura: "10' calentamiento + 6' Z3 + 6' Z4 + 6' Z3 + 6' Z4 + 6' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 55, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 35' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 65, unidad: "min", desc: "50' a ritmo umbral.", estructura: "10' calentamiento + 50' Z4 + 5' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo específico", duracion: 85, unidad: "min", desc: "Cambios a ritmo 10k.", estructura: "45' Z2 + 5x5' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 90, unidad: "min", desc: "Progresión constante.", estructura: "50' Z2 + 40' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 95, unidad: "min", desc: "Series largas.", estructura: "55' Z2 + 4x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 100, unidad: "min", desc: "Aumenta ritmo cada 30'.", estructura: "40' Z2 + 30' Z3 + 30' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 105, unidad: "min", desc: "Fondo largo continuo.", estructura: "105' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 110, unidad: "min", desc: "Fondo largo con cambios.", estructura: "70' Z2 + 40' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo ultradistancia", duracion: 115, unidad: "min", desc: "Preparación para 10k.", estructura: "75' Z2 + 40' Z3", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z3" }
        ]
      }
    },
    "medio": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje media", duracion: 45, unidad: "min", desc: "Rodaje suave media.", estructura: "10' calentamiento + 30' Z2 + 5' enfriamiento", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Fondo media", duracion: 50, unidad: "min", desc: "Fondo aeróbico.", estructura: "50' Z2 continuo", sensacion: "Constante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 50, unidad: "min", desc: "Aumenta cada 15'.", estructura: "10' calentamiento + 30' progresivo + 10' enfriamiento", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 40, unidad: "min", desc: "Sesión muy suave.", estructura: "40' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje matinal", duracion: 45, unidad: "min", desc: "Despertar suave.", estructura: "45' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con cambios", duracion: 50, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 30' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje base", duracion: 55, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "55' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje regenerativo", duracion: 40, unidad: "min", desc: "Después de sesión dura.", estructura: "40' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Series 500m", duracion: 45, unidad: "min", desc: "8x500m con recuperación.", estructura: "15' calentamiento + 16' series (8x500m) + 10' enfriamiento", sensacion: "Controladas", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 500 },
          { nombre: "Fartlek media", duracion: 45, unidad: "min", desc: "2' rápido + 2' suave.", estructura: "10' calentamiento + 8 repeticiones + 7' enfriamiento", sensacion: "Dinámico", tipo: "series", zona: "Z4" },
          { nombre: "Series 400m", duracion: 40, unidad: "min", desc: "10x400m con recuperación 1'15.", estructura: "15' calentamiento + 16' series (10x400m) + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 400 },
          { nombre: "Series 600m", duracion: 50, unidad: "min", desc: "6x600m con recuperación 2'.", estructura: "15' calentamiento + 14' series (6x600m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 600 },
          { nombre: "Series 800m", duracion: 55, unidad: "min", desc: "5x800m con recuperación 2'30.", estructura: "15' calentamiento + 16' series (5x800m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 800 },
          { nombre: "Pirámide media", duracion: 50, unidad: "min", desc: "400-600-800-600-400m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 1000m", duracion: 60, unidad: "min", desc: "4x1000m con recuperación 3'.", estructura: "15' calentamiento + 16' series (4x1000m) + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1000 }
        ],
        tempo: [
          { nombre: "Tempo media", duracion: 45, unidad: "min", desc: "25' a ritmo tempo.", estructura: "10' calentamiento + 25' Z3 + 10' enfriamiento", sensacion: "Constante", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 50, unidad: "min", desc: "Aumenta cada 8'.", estructura: "10' calentamiento + 8' Z3 + 8' Z4 + 8' Z3 + 6' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo corto", duracion: 40, unidad: "min", desc: "20' a ritmo tempo.", estructura: "10' calentamiento + 20' Z3 + 10' enfriamiento", sensacion: "Controlado", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral", duracion: 50, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' Z4 + 10' enfriamiento", sensacion: "Fuerte", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo largo", duracion: 55, unidad: "min", desc: "35' a ritmo tempo.", estructura: "10' calentamiento + 35' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 50, unidad: "min", desc: "Alterna 5' Z3 / 2' Z4.", estructura: "10' calentamiento + 5x(5' Z3 + 2' Z4) + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 55, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 35' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" }
        ],
        largo: [
          { nombre: "Largo media", duracion: 75, unidad: "min", desc: "Rodaje largo.", estructura: "75' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con cambios", duracion: 80, unidad: "min", desc: "Últimos 25' más rápido.", estructura: "55' Z2 + 25' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 85, unidad: "min", desc: "Fondo largo.", estructura: "85' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 80, unidad: "min", desc: "Aumenta ritmo cada 20'.", estructura: "60' Z2 + 20' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 90, unidad: "min", desc: "Incluye cambios.", estructura: "60' Z2 + 5x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 95, unidad: "min", desc: "Progresión constante.", estructura: "60' Z2 + 35' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 100, unidad: "min", desc: "Fondo largo.", estructura: "100' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje activo media", duracion: 50, unidad: "min", desc: "Ritmo vivo Z2.", estructura: "50' Z2 vivo", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje calidad", duracion: 55, unidad: "min", desc: "Ritmo exigente.", estructura: "55' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje aeróbico", duracion: 60, unidad: "min", desc: "Fondo aeróbico.", estructura: "60' Z2 constante", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 45, unidad: "min", desc: "Sesión para mantener forma.", estructura: "45' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 55, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 40, unidad: "min", desc: "Después de sesión intensa.", estructura: "40' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 65, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 25' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 1000m", duracion: 55, unidad: "min", desc: "6x1000m con recuperación.", estructura: "15' calentamiento + 24' series (6x1000m) + 10' enfriamiento", sensacion: "Intensidad", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 1000 },
          { nombre: "Series 1200m", duracion: 60, unidad: "min", desc: "5x1200m con recuperación 3'.", estructura: "15' calentamiento + 24' series (5x1200m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 1200 },
          { nombre: "Pirámide media", duracion: 60, unidad: "min", desc: "400-800-1200-1600-1200-800-400m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 800m", duracion: 55, unidad: "min", desc: "8x800m con recuperación 2'.", estructura: "15' calentamiento + 26' series (8x800m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 800 },
          { nombre: "Series 1600m", duracion: 65, unidad: "min", desc: "4x1600m con recuperación 3'30.", estructura: "15' calentamiento + 26' series (4x1600m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 1600 },
          { nombre: "Fartlek avanzado", duracion: 55, unidad: "min", desc: "Juega con ritmos.", estructura: "10' calentamiento + 30' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 600m", duracion: 60, unidad: "min", desc: "10x600m con recuperación 1'30.", estructura: "15' calentamiento + 24' series (10x600m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 10, distanciaSerie: 600 }
        ],
        tempo: [
          { nombre: "Tempo umbral media", duracion: 50, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' umbral + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo media", duracion: 55, unidad: "min", desc: "35' a ritmo umbral.", estructura: "10' calentamiento + 35' Z4 + 10' enfriamiento", sensacion: "Sostenido", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 55, unidad: "min", desc: "Alterna 7' Z3 / 3' Z4.", estructura: "10' calentamiento + 4x(7' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 60, unidad: "min", desc: "40' a ritmo tempo.", estructura: "10' calentamiento + 40' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 60, unidad: "min", desc: "Aumenta cada 7'.", estructura: "10' calentamiento + 7' Z3 + 7' Z4 + 7' Z3 + 7' Z4 + 7' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 55, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 35' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral largo", duracion: 65, unidad: "min", desc: "45' a ritmo umbral.", estructura: "10' calentamiento + 45' Z4 + 10' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo calidad media", duracion: 90, unidad: "min", desc: "Progresión últimos 30'.", estructura: "60' Z2 + 30' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con cambios", duracion: 95, unidad: "min", desc: "Incluye series.", estructura: "65' Z2 + 6x3' Z4 + 12' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 100, unidad: "min", desc: "Aumenta ritmo cada 30'.", estructura: "40' Z2 + 30' Z3 + 30' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 105, unidad: "min", desc: "Incluye cambios.", estructura: "70' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 110, unidad: "min", desc: "Fondo largo continuo.", estructura: "110' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 115, unidad: "min", desc: "Fondo largo con cambios.", estructura: "80' Z2 + 35' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 120, unidad: "min", desc: "Incluye series largas.", estructura: "80' Z2 + 6x800m Z4 + 15' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje alto media", duracion: 55, unidad: "min", desc: "Ritmo exigente Z2.", estructura: "55' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje activo", duracion: 60, unidad: "min", desc: "Ritmo vivo.", estructura: "60' Z2 vivo", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje técnico", duracion: 65, unidad: "min", desc: "Enfoque técnico.", estructura: "65' Z2 cadencia alta", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 50, unidad: "min", desc: "Sesión para mantener forma.", estructura: "50' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Después de sesión intensa.", estructura: "45' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 70, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 2000m", duracion: 60, unidad: "min", desc: "4x2000m con recuperación.", estructura: "15' calentamiento + 32' series (4x2000m) + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 2000 },
          { nombre: "Series 3000m", duracion: 65, unidad: "min", desc: "3x3000m con recuperación 4'30.", estructura: "15' calentamiento + 36' series (3x3000m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 3000 },
          { nombre: "Series 5000m", duracion: 70, unidad: "min", desc: "2x5000m con recuperación 5'.", estructura: "15' calentamiento + 40' series (2x5000m) + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5", repeticiones: 2, distanciaSerie: 5000 },
          { nombre: "Series 1000m", duracion: 60, unidad: "min", desc: "6x1000m con recuperación 2'.", estructura: "15' calentamiento + 24' series (6x1000m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 6, distanciaSerie: 1000 },
          { nombre: "Pirámide larga", duracion: 70, unidad: "min", desc: "1000-2000-3000-2000-1000m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Fartlek avanzado", duracion: 60, unidad: "min", desc: "Juega con ritmos intensos.", estructura: "10' calentamiento + 35' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z5" },
          { nombre: "Series 800m", duracion: 65, unidad: "min", desc: "10x800m con recuperación 1'30.", estructura: "15' calentamiento + 32' series (10x800m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 800 }
        ],
        tempo: [
          { nombre: "Tempo media avanzado", duracion: 55, unidad: "min", desc: "40' a ritmo media.", estructura: "10' calentamiento + 40' Z4 + 5' enfriamiento", sensacion: "Ritmo carrera", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo umbral", duracion: 60, unidad: "min", desc: "45' a ritmo umbral.", estructura: "10' calentamiento + 45' Z4 + 5' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna 6' Z3 / 3' Z4.", estructura: "10' calentamiento + 5x(6' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 65, unidad: "min", desc: "50' a ritmo tempo.", estructura: "10' calentamiento + 50' Z3 + 5' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 65, unidad: "min", desc: "Aumenta cada 5'.", estructura: "10' calentamiento + 5' Z3 + 5' Z4 + 5' Z3 + 5' Z4 + 5' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 70, unidad: "min", desc: "55' a ritmo umbral.", estructura: "10' calentamiento + 55' Z4 + 5' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo específico media", duracion: 105, unidad: "min", desc: "Cambios a ritmo media.", estructura: "60' Z2 + 6x5' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 110, unidad: "min", desc: "Progresión constante.", estructura: "70' Z2 + 40' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 115, unidad: "min", desc: "Series largas.", estructura: "75' Z2 + 5x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 120, unidad: "min", desc: "Aumenta ritmo cada 30'.", estructura: "50' Z2 + 35' Z3 + 35' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 125, unidad: "min", desc: "Fondo largo continuo.", estructura: "125' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 130, unidad: "min", desc: "Fondo largo con cambios.", estructura: "85' Z2 + 45' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo ultradistancia", duracion: 135, unidad: "min", desc: "Preparación para media.", estructura: "90' Z2 + 45' Z3", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z3" }
        ]
      }
    },
    "maraton": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje maratón", duracion: 50, unidad: "min", desc: "Rodaje suave maratón.", estructura: "10' calentamiento + 35' Z2 + 5' enfriamiento", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Fondo maratón", duracion: 55, unidad: "min", desc: "Fondo aeróbico.", estructura: "55' Z2 continuo", sensacion: "Constante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 55, unidad: "min", desc: "Aumenta cada 15'.", estructura: "10' calentamiento + 35' progresivo + 10' enfriamiento", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Sesión muy suave.", estructura: "45' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje matinal", duracion: 50, unidad: "min", desc: "Despertar suave.", estructura: "50' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con cambios", duracion: 55, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 35' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje base", duracion: 60, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "60' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje regenerativo", duracion: 45, unidad: "min", desc: "Después de sesión dura.", estructura: "45' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Series 800m", duracion: 50, unidad: "min", desc: "6x800m con recuperación.", estructura: "15' calentamiento + 19' series (6x800m) + 10' enfriamiento", sensacion: "Controladas", tipo: "series", zona: "Z4", repeticiones: 6, distanciaSerie: 800 },
          { nombre: "Fartlek maratón", duracion: 50, unidad: "min", desc: "3' rápido + 3' suave.", estructura: "10' calentamiento + 6 repeticiones + 8' enfriamiento", sensacion: "Dinámico", tipo: "series", zona: "Z4" },
          { nombre: "Series 1000m", duracion: 55, unidad: "min", desc: "5x1000m con recuperación 2'.", estructura: "15' calentamiento + 20' series (5x1000m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 1000 },
          { nombre: "Series 1200m", duracion: 60, unidad: "min", desc: "4x1200m con recuperación 2'30.", estructura: "15' calentamiento + 19' series (4x1200m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4", repeticiones: 4, distanciaSerie: 1200 },
          { nombre: "Series 1500m", duracion: 65, unidad: "min", desc: "3x1500m con recuperación 3'.", estructura: "15' calentamiento + 18' series (3x1500m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 1500 },
          { nombre: "Pirámide maratón", duracion: 60, unidad: "min", desc: "800-1200-1600-1200-800m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 2000m", duracion: 70, unidad: "min", desc: "3x2000m con recuperación 3'30.", estructura: "15' calentamiento + 24' series (3x2000m) + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 2000 }
        ],
        tempo: [
          { nombre: "Tempo maratón", duracion: 50, unidad: "min", desc: "30' a ritmo tempo.", estructura: "10' calentamiento + 30' Z3 + 10' enfriamiento", sensacion: "Constante", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 55, unidad: "min", desc: "Aumenta cada 10'.", estructura: "10' calentamiento + 10' Z3 + 10' Z4 + 10' Z3 + 15' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 60, unidad: "min", desc: "35' a ritmo tempo.", estructura: "10' calentamiento + 35' Z3 + 15' enfriamiento", sensacion: "Sostenido", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral", duracion: 55, unidad: "min", desc: "30' a ritmo umbral.", estructura: "10' calentamiento + 30' Z4 + 15' enfriamiento", sensacion: "Fuerte", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna 5' Z3 / 3' Z4.", estructura: "10' calentamiento + 5x(5' Z3 + 3' Z4) + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo largo umbral", duracion: 65, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 15' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo maratón", duracion: 90, unidad: "min", desc: "Rodaje largo.", estructura: "90' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con cambios", duracion: 100, unidad: "min", desc: "Últimos 30' más rápido.", estructura: "70' Z2 + 30' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 110, unidad: "min", desc: "Fondo largo.", estructura: "110' Z2 continuo", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 100, unidad: "min", desc: "Aumenta ritmo cada 25'.", estructura: "75' Z2 + 25' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 115, unidad: "min", desc: "Incluye cambios.", estructura: "80' Z2 + 5x3' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 120, unidad: "min", desc: "Progresión constante.", estructura: "80' Z2 + 40' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 125, unidad: "min", desc: "Fondo largo.", estructura: "125' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje activo maratón", duracion: 55, unidad: "min", desc: "Ritmo vivo Z2.", estructura: "55' Z2 vivo", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje calidad", duracion: 60, unidad: "min", desc: "Ritmo exigente.", estructura: "60' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje aeróbico", duracion: 65, unidad: "min", desc: "Fondo aeróbico.", estructura: "65' Z2 constante", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 50, unidad: "min", desc: "Sesión para mantener forma.", estructura: "50' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 60, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Después de sesión intensa.", estructura: "45' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 70, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 1600m", duracion: 60, unidad: "min", desc: "5x1600m con recuperación.", estructura: "15' calentamiento + 32' series (5x1600m) + 10' enfriamiento", sensacion: "Intensidad", tipo: "series", zona: "Z4", repeticiones: 5, distanciaSerie: 1600 },
          { nombre: "Series 2000m", duracion: 65, unidad: "min", desc: "4x2000m con recuperación 3'30.", estructura: "15' calentamiento + 32' series (4x2000m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4", repeticiones: 4, distanciaSerie: 2000 },
          { nombre: "Pirámide maratón", duracion: 70, unidad: "min", desc: "800-1600-2400-3200-2400-1600-800m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 3000m", duracion: 75, unidad: "min", desc: "3x3000m con recuperación 4'.", estructura: "15' calentamiento + 36' series (3x3000m) + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 3000 },
          { nombre: "Series 1000m", duracion: 65, unidad: "min", desc: "8x1000m con recuperación 2'.", estructura: "15' calentamiento + 32' series (8x1000m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 8, distanciaSerie: 1000 },
          { nombre: "Fartlek avanzado", duracion: 60, unidad: "min", desc: "Juega con ritmos.", estructura: "10' calentamiento + 35' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 800m", duracion: 70, unidad: "min", desc: "12x800m con recuperación 1'30.", estructura: "15' calentamiento + 38' series (12x800m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4", repeticiones: 12, distanciaSerie: 800 }
        ],
        tempo: [
          { nombre: "Tempo umbral maratón", duracion: 55, unidad: "min", desc: "35' a ritmo umbral.", estructura: "10' calentamiento + 35' umbral + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo maratón", duracion: 60, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' Z4 + 10' enfriamiento", sensacion: "Sostenido", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna 8' Z3 / 3' Z4.", estructura: "10' calentamiento + 4x(8' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 65, unidad: "min", desc: "45' a ritmo tempo.", estructura: "10' calentamiento + 45' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 65, unidad: "min", desc: "Aumenta cada 6'.", estructura: "10' calentamiento + 6' Z3 + 6' Z4 + 6' Z3 + 6' Z4 + 6' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral largo", duracion: 70, unidad: "min", desc: "50' a ritmo umbral.", estructura: "10' calentamiento + 50' Z4 + 10' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo calidad maratón", duracion: 120, unidad: "min", desc: "Progresión últimos 40'.", estructura: "80' Z2 + 40' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con cambios", duracion: 130, unidad: "min", desc: "Incluye series.", estructura: "90' Z2 + 8x3' Z4 + 16' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 140, unidad: "min", desc: "Aumenta ritmo cada 40'.", estructura: "60' Z2 + 40' Z3 + 40' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 150, unidad: "min", desc: "Incluye cambios.", estructura: "100' Z2 + 8x3' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 160, unidad: "min", desc: "Fondo largo continuo.", estructura: "160' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 170, unidad: "min", desc: "Fondo largo con cambios.", estructura: "120' Z2 + 50' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 180, unidad: "min", desc: "Incluye series largas.", estructura: "120' Z2 + 8x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje alto maratón", duracion: 60, unidad: "min", desc: "Ritmo exigente Z2.", estructura: "60' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje activo", duracion: 65, unidad: "min", desc: "Ritmo vivo.", estructura: "65' Z2 vivo", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje técnico", duracion: 70, unidad: "min", desc: "Enfoque técnico.", estructura: "70' Z2 cadencia alta", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 55, unidad: "min", desc: "Sesión para mantener forma.", estructura: "55' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 65, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 50, unidad: "min", desc: "Después de sesión intensa.", estructura: "50' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 75, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "75' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 70, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 35' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 3000m", duracion: 70, unidad: "min", desc: "4x3000m con recuperación.", estructura: "15' calentamiento + 48' series (4x3000m) + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5", repeticiones: 4, distanciaSerie: 3000 },
          { nombre: "Series 5000m", duracion: 75, unidad: "min", desc: "3x5000m con recuperación 5'.", estructura: "15' calentamiento + 60' series (3x5000m) + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5", repeticiones: 3, distanciaSerie: 5000 },
          { nombre: "Series 10000m", duracion: 80, unidad: "min", desc: "2x10000m con recuperación 6'.", estructura: "15' calentamiento + 80' series (2x10000m) + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5", repeticiones: 2, distanciaSerie: 10000 },
          { nombre: "Series 2000m", duracion: 70, unidad: "min", desc: "6x2000m con recuperación 2'30.", estructura: "15' calentamiento + 48' series (6x2000m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 6, distanciaSerie: 2000 },
          { nombre: "Pirámide larga", duracion: 80, unidad: "min", desc: "2000-3000-5000-3000-2000m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Fartlek avanzado", duracion: 70, unidad: "min", desc: "Juega con ritmos intensos.", estructura: "10' calentamiento + 45' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z5" },
          { nombre: "Series 1600m", duracion: 75, unidad: "min", desc: "10x1600m con recuperación 2'.", estructura: "15' calentamiento + 64' series (10x1600m) + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5", repeticiones: 10, distanciaSerie: 1600 }
        ],
        tempo: [
          { nombre: "Tempo maratón avanzado", duracion: 60, unidad: "min", desc: "45' a ritmo maratón.", estructura: "10' calentamiento + 45' Z4 + 5' enfriamiento", sensacion: "Ritmo carrera", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo umbral", duracion: 65, unidad: "min", desc: "50' a ritmo umbral.", estructura: "10' calentamiento + 50' Z4 + 5' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 65, unidad: "min", desc: "Alterna 7' Z3 / 3' Z4.", estructura: "10' calentamiento + 5x(7' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 70, unidad: "min", desc: "55' a ritmo tempo.", estructura: "10' calentamiento + 55' Z3 + 5' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 70, unidad: "min", desc: "Aumenta cada 5'.", estructura: "10' calentamiento + 5' Z3 + 5' Z4 + 5' Z3 + 5' Z4 + 5' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 65, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 45' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 75, unidad: "min", desc: "60' a ritmo umbral.", estructura: "10' calentamiento + 60' Z4 + 5' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo específico maratón", duracion: 150, unidad: "min", desc: "Cambios a ritmo maratón.", estructura: "90' Z2 + 8x5' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 160, unidad: "min", desc: "Progresión constante.", estructura: "100' Z2 + 60' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 170, unidad: "min", desc: "Series largas.", estructura: "110' Z2 + 6x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 180, unidad: "min", desc: "Aumenta ritmo cada 40'.", estructura: "80' Z2 + 50' Z3 + 50' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 190, unidad: "min", desc: "Fondo largo continuo.", estructura: "190' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 200, unidad: "min", desc: "Fondo largo con cambios.", estructura: "140' Z2 + 60' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo ultradistancia", duracion: 210, unidad: "min", desc: "Preparación para maratón.", estructura: "150' Z2 + 60' Z3", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z3" }
        ]
      }
    }
  },
  trail: {
    "2k": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje sendero", duracion: 30, unidad: "min", desc: "Terreno irregular suave.", estructura: "10' calentamiento + 15' Z2 + 5' enfriamiento", sensacion: "Adaptación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero suave", duracion: 35, unidad: "min", desc: "Terreno variado suave.", estructura: "35' sendero continuo", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero progresivo", duracion: 35, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "10' calentamiento + 20' progresivo + 5' enfriamiento", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero de recuperación", duracion: 25, unidad: "min", desc: "Sesión muy suave en sendero.", estructura: "25' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Sendero matinal", duracion: 30, unidad: "min", desc: "Despertar suave en sendero.", estructura: "30' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero con cambios", duracion: 35, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 20' con cambios + 5' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero base", duracion: 40, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "40' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero regenerativo", duracion: 25, unidad: "min", desc: "Después de sesión dura.", estructura: "25' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Cuestas suaves", duracion: 35, unidad: "min", desc: "4x60m cuesta suave.", estructura: "15' calentamiento + 4 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas cortas", duracion: 30, unidad: "min", desc: "5x50m cuesta suave.", estructura: "15' calentamiento + 5 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas medias", duracion: 40, unidad: "min", desc: "4x80m cuesta media.", estructura: "15' calentamiento + 4 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 45, unidad: "min", desc: "3x100m cuesta media.", estructura: "15' calentamiento + 3 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 40, unidad: "min", desc: "6x50m cuesta suave.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variadas", duracion: 45, unidad: "min", desc: "4x(50m + 70m) cuesta media.", estructura: "15' calentamiento + 4 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 35, unidad: "min", desc: "8x40m cuesta suave.", estructura: "15' calentamiento + 8 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo sendero", duracion: 35, unidad: "min", desc: "Ritmo sostenido sendero.", estructura: "10' calentamiento + 15' Z3 + 10' enfriamiento", sensacion: "Controlado", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo desnivel suave", duracion: 40, unidad: "min", desc: "Con desnivel suave.", estructura: "10' calentamiento + 20' Z3 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 40, unidad: "min", desc: "Aumenta en llano.", estructura: "10' calentamiento + 20' progresivo + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 45, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 25' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 40, unidad: "min", desc: "Alterna llano y cuestas.", estructura: "10' calentamiento + 20' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo con cambios", duracion: 45, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 25' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero umbral", duracion: 50, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 30' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo sendero", duracion: 50, unidad: "min", desc: "Toma contacto trail.", estructura: "50' Z2 sendero", sensacion: "Adaptación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo montaña suave", duracion: 55, unidad: "min", desc: "Sendero continuo.", estructura: "55' sendero", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 60, unidad: "min", desc: "Incluye subidas suaves.", estructura: "60' sendero con desnivel", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "40' Z2 + 15' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 65, unidad: "min", desc: "Incluye cambios.", estructura: "45' Z2 + 4x3' Z4 + 8' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 60, unidad: "min", desc: "Progresión constante.", estructura: "40' Z2 + 20' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 70, unidad: "min", desc: "Fondo largo en sendero.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 45, unidad: "min", desc: "Técnica en sendero.", estructura: "45' Z2 técnico", sensacion: "Coordinación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero técnico", duracion: 50, unidad: "min", desc: "Técnica avanzada.", estructura: "50' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje montaña", duracion: 55, unidad: "min", desc: "Terreno variado.", estructura: "55' sendero variado", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 40, unidad: "min", desc: "Sesión para mantener forma.", estructura: "40' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 50, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 35, unidad: "min", desc: "Después de sesión intensa.", estructura: "35' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 60, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "60' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 20' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas medias", duracion: 45, unidad: "min", desc: "6x80m cuesta media.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 50, unidad: "min", desc: "5x100m cuesta media.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variables", duracion: 50, unidad: "min", desc: "4x(60m + 80m + 100m)", estructura: "15' calentamiento + 4 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 55, unidad: "min", desc: "8x80m cuesta media.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas medias", duracion: 60, unidad: "min", desc: "4x120m cuesta media.", estructura: "15' calentamiento + 4 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas intensas", duracion: 55, unidad: "min", desc: "5x(80m + 100m) cuesta media.", estructura: "15' calentamiento + 5 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 50, unidad: "min", desc: "10x60m cuesta media.", estructura: "15' calentamiento + 10 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo desnivel", duracion: 45, unidad: "min", desc: "Incluye subidas.", estructura: "45' con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo montaña", duracion: 50, unidad: "min", desc: "Ritmo fuerte.", estructura: "50' desnivel continuo", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 50, unidad: "min", desc: "Alterna llano y cuestas.", estructura: "50' con cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 55, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 35' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' calentamiento + 10' Z3 + 10' Z4 + 10' Z3 + 10' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 50, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 30' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 60, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 40' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo montaña", duracion: 75, unidad: "min", desc: "Mixto subidas/bajadas.", estructura: "75' trail", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo técnico", duracion: 80, unidad: "min", desc: "Alta dificultad técnica.", estructura: "80' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 85, unidad: "min", desc: "Acumulación desnivel.", estructura: "85' trail con desnivel", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 80, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "55' Z2 + 25' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 90, unidad: "min", desc: "Incluye cambios.", estructura: "60' Z2 + 5x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 95, unidad: "min", desc: "Progresión constante.", estructura: "65' Z2 + 30' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 100, unidad: "min", desc: "Fondo largo en sendero.", estructura: "100' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje montaña", duracion: 55, unidad: "min", desc: "Alta dificultad técnica.", estructura: "55' Z2 técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero avanzado", duracion: 60, unidad: "min", desc: "Máxima técnica.", estructura: "60' técnico", sensacion: "Dominio", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje desnivel", duracion: 65, unidad: "min", desc: "Acumulación desnivel.", estructura: "65' con desnivel", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 50, unidad: "min", desc: "Sesión para mantener forma.", estructura: "50' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Después de sesión intensa.", estructura: "45' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 70, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas fuertes", duracion: 55, unidad: "min", desc: "8x100m cuesta fuerte.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Máxima potencia", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas muy fuertes", duracion: 60, unidad: "min", desc: "6x120m cuesta fuerte.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas largas fuertes", duracion: 65, unidad: "min", desc: "5x150m cuesta fuerte.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas explosivas", duracion: 60, unidad: "min", desc: "10x80m cuesta fuerte.", estructura: "15' calentamiento + 10 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas fuertes", duracion: 65, unidad: "min", desc: "6x(80m + 100m) cuesta fuerte.", estructura: "15' calentamiento + 6 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas en escalera", duracion: 70, unidad: "min", desc: "4x(60m + 80m + 100m + 120m)", estructura: "15' calentamiento + 4 series + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas máximas", duracion: 75, unidad: "min", desc: "3x200m cuesta fuerte.", estructura: "15' calentamiento + 3 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo montaña", duracion: 55, unidad: "min", desc: "Ritmo fuerte desnivel.", estructura: "55' desnivel continuo", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo fuerte", duracion: 60, unidad: "min", desc: "Máxima intensidad.", estructura: "60' desnivel intenso", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna ritmos.", estructura: "60' cambios de ritmo", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 65, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 45' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' calentamiento + 10' Z3 + 10' Z4 + 10' Z3 + 10' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 70, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 50' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo trail", duracion: 100, unidad: "min", desc: "Simulación competición.", estructura: "100' trail cambios", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo avanzado", duracion: 110, unidad: "min", desc: "Alto volumen técnico.", estructura: "110' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo ultra", duracion: 120, unidad: "min", desc: "Preparación ultra.", estructura: "120' trail", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 105, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "75' Z2 + 30' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 115, unidad: "min", desc: "Incluye cambios.", estructura: "80' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 125, unidad: "min", desc: "Progresión constante.", estructura: "85' Z2 + 40' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 130, unidad: "min", desc: "Fondo largo en sendero.", estructura: "130' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      }
    },
    "5k": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje 5k trail", duracion: 40, unidad: "min", desc: "Terreno irregular.", estructura: "40' Z2 sendero", sensacion: "Adaptación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero 5k", duracion: 45, unidad: "min", desc: "Sendero continuo.", estructura: "45' sendero", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero progresivo", duracion: 45, unidad: "min", desc: "Aumenta ritmo.", estructura: "45' progresivo", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero de recuperación", duracion: 35, unidad: "min", desc: "Sesión muy suave en sendero.", estructura: "35' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Sendero matinal", duracion: 40, unidad: "min", desc: "Despertar suave en sendero.", estructura: "40' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero con cambios", duracion: 45, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 30' con cambios + 5' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero base", duracion: 50, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "50' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero regenerativo", duracion: 35, unidad: "min", desc: "Después de sesión dura.", estructura: "35' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Cuestas 5k", duracion: 45, unidad: "min", desc: "5x80m cuesta suave.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas cortas", duracion: 40, unidad: "min", desc: "6x60m cuesta suave.", estructura: "15' calentamiento + 6 cuestas + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas medias", duracion: 50, unidad: "min", desc: "5x100m cuesta media.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 55, unidad: "min", desc: "4x120m cuesta media.", estructura: "15' calentamiento + 4 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 50, unidad: "min", desc: "8x70m cuesta suave.", estructura: "15' calentamiento + 8 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variadas", duracion: 55, unidad: "min", desc: "5x(60m + 80m) cuesta media.", estructura: "15' calentamiento + 5 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 45, unidad: "min", desc: "10x50m cuesta suave.", estructura: "15' calentamiento + 10 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo sendero", duracion: 45, unidad: "min", desc: "Ritmo sostenido.", estructura: "45' Z3 sendero", sensacion: "Control", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo desnivel", duracion: 50, unidad: "min", desc: "Con desnivel suave.", estructura: "50' Z3 con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 50, unidad: "min", desc: "Aumenta ritmo.", estructura: "50' progresivo", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 55, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 35' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 50, unidad: "min", desc: "Alterna llano y cuestas.", estructura: "10' calentamiento + 30' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo con cambios", duracion: 55, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 35' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero umbral", duracion: 60, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 40' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo sendero", duracion: 65, unidad: "min", desc: "Resistencia sendero.", estructura: "65' Z2 sendero", sensacion: "Base", tipo: "largo", zona: "Z2" },
          { nombre: "Largo montaña suave", duracion: 70, unidad: "min", desc: "Sendero continuo.", estructura: "70' sendero", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 75, unidad: "min", desc: "Incluye desnivel.", estructura: "75' con desnivel", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 70, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "50' Z2 + 20' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 80, unidad: "min", desc: "Incluye cambios.", estructura: "55' Z2 + 5x3' Z4 + 10' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 85, unidad: "min", desc: "Progresión constante.", estructura: "55' Z2 + 30' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 90, unidad: "min", desc: "Fondo largo en sendero.", estructura: "90' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 50, unidad: "min", desc: "Técnica continua.", estructura: "50' técnico", sensacion: "Coordinación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero técnico", duracion: 55, unidad: "min", desc: "Técnica avanzada.", estructura: "55' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje montaña", duracion: 60, unidad: "min", desc: "Terreno variado.", estructura: "60' sendero variado", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 45, unidad: "min", desc: "Sesión para mantener forma.", estructura: "45' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 55, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 40, unidad: "min", desc: "Después de sesión intensa.", estructura: "40' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 65, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 25' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas medias", duracion: 55, unidad: "min", desc: "7x100m cuesta media.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 60, unidad: "min", desc: "6x120m cuesta media.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variables", duracion: 60, unidad: "min", desc: "5x(80m + 100m + 120m)", estructura: "15' calentamiento + 5 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 65, unidad: "min", desc: "10x80m cuesta media.", estructura: "15' calentamiento + 10 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas medias", duracion: 70, unidad: "min", desc: "5x150m cuesta media.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas intensas", duracion: 65, unidad: "min", desc: "6x(80m + 100m) cuesta media.", estructura: "15' calentamiento + 6 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 60, unidad: "min", desc: "12x70m cuesta media.", estructura: "15' calentamiento + 12 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo desnivel", duracion: 55, unidad: "min", desc: "Desnivel continuo.", estructura: "55' con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo montaña", duracion: 60, unidad: "min", desc: "Ritmo fuerte.", estructura: "60' desnivel", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna ritmos.", estructura: "60' cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 65, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 45' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 10'.", estructura: "10' calentamiento + 10' Z3 + 10' Z4 + 10' Z3 + 10' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 70, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 50' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo montaña", duracion: 85, unidad: "min", desc: "Mixto con cambios.", estructura: "85' trail", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo técnico", duracion: 90, unidad: "min", desc: "Alta técnica.", estructura: "90' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 95, unidad: "min", desc: "Acumulación.", estructura: "95' con desnivel", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 90, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "65' Z2 + 25' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 100, unidad: "min", desc: "Incluye cambios.", estructura: "70' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 105, unidad: "min", desc: "Progresión constante.", estructura: "75' Z2 + 30' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 110, unidad: "min", desc: "Fondo largo en sendero.", estructura: "110' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 55, unidad: "min", desc: "Alta técnica.", estructura: "55' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero avanzado", duracion: 60, unidad: "min", desc: "Máxima técnica.", estructura: "60' técnico", sensacion: "Dominio", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje desnivel", duracion: 65, unidad: "min", desc: "Acumulación.", estructura: "65' con desnivel", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 50, unidad: "min", desc: "Sesión para mantener forma.", estructura: "50' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 60, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Después de sesión intensa.", estructura: "45' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 70, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas fuertes", duracion: 60, unidad: "min", desc: "9x120m cuesta fuerte.", estructura: "15' calentamiento + 9 cuestas + 10' enfriamiento", sensacion: "Máxima potencia", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas muy fuertes", duracion: 65, unidad: "min", desc: "7x150m cuesta fuerte.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas largas fuertes", duracion: 70, unidad: "min", desc: "6x180m cuesta fuerte.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas explosivas", duracion: 65, unidad: "min", desc: "12x100m cuesta fuerte.", estructura: "15' calentamiento + 12 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas fuertes", duracion: 70, unidad: "min", desc: "8x(100m + 120m) cuesta fuerte.", estructura: "15' calentamiento + 8 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas en escalera", duracion: 75, unidad: "min", desc: "5x(80m + 100m + 120m + 150m)", estructura: "15' calentamiento + 5 series + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas máximas", duracion: 80, unidad: "min", desc: "4x250m cuesta fuerte.", estructura: "15' calentamiento + 4 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo montaña", duracion: 60, unidad: "min", desc: "Ritmo fuerte.", estructura: "60' desnivel intenso", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo fuerte", duracion: 65, unidad: "min", desc: "Máxima intensidad.", estructura: "65' desnivel intenso", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 65, unidad: "min", desc: "Cambios constantes.", estructura: "65' cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 70, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 50' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 70, unidad: "min", desc: "Aumenta ritmo cada 8'.", estructura: "10' calentamiento + 8' Z3 + 8' Z4 + 8' Z3 + 8' Z4 + 8' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 65, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 45' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 75, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 55' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo trail", duracion: 110, unidad: "min", desc: "Simulación carrera.", estructura: "110' trail", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo avanzado", duracion: 120, unidad: "min", desc: "Alto volumen.", estructura: "120' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo ultra", duracion: 130, unidad: "min", desc: "Preparación ultra.", estructura: "130' trail", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 115, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "85' Z2 + 30' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 125, unidad: "min", desc: "Incluye cambios.", estructura: "90' Z2 + 7x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 135, unidad: "min", desc: "Progresión constante.", estructura: "95' Z2 + 40' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 140, unidad: "min", desc: "Fondo largo en sendero.", estructura: "140' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      }
    },
    "10k": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje 10k trail", duracion: 45, unidad: "min", desc: "Terreno irregular.", estructura: "45' Z2 sendero", sensacion: "Adaptación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero 10k", duracion: 50, unidad: "min", desc: "Sendero continuo.", estructura: "50' sendero", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero progresivo", duracion: 50, unidad: "min", desc: "Aumenta ritmo.", estructura: "50' progresivo", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero de recuperación", duracion: 40, unidad: "min", desc: "Sesión muy suave en sendero.", estructura: "40' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Sendero matinal", duracion: 45, unidad: "min", desc: "Despertar suave en sendero.", estructura: "45' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero con cambios", duracion: 50, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 35' con cambios + 5' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero base", duracion: 55, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "55' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero regenerativo", duracion: 40, unidad: "min", desc: "Después de sesión dura.", estructura: "40' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Cuestas 10k", duracion: 50, unidad: "min", desc: "6x80m cuesta suave.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas cortas", duracion: 45, unidad: "min", desc: "7x60m cuesta suave.", estructura: "15' calentamiento + 7 cuestas + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas medias", duracion: 55, unidad: "min", desc: "6x100m cuesta media.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 60, unidad: "min", desc: "5x120m cuesta media.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 55, unidad: "min", desc: "9x80m cuesta suave.", estructura: "15' calentamiento + 9 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variadas", duracion: 60, unidad: "min", desc: "6x(70m + 90m) cuesta media.", estructura: "15' calentamiento + 6 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 50, unidad: "min", desc: "12x60m cuesta suave.", estructura: "15' calentamiento + 12 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo sendero", duracion: 50, unidad: "min", desc: "Ritmo sostenido.", estructura: "50' Z3 sendero", sensacion: "Control", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo desnivel", duracion: 55, unidad: "min", desc: "Con desnivel suave.", estructura: "55' Z3 con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo.", estructura: "55' progresivo", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 60, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 40' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 55, unidad: "min", desc: "Alterna llano y cuestas.", estructura: "10' calentamiento + 35' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo con cambios", duracion: 60, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 40' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero umbral", duracion: 65, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 45' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo sendero", duracion: 75, unidad: "min", desc: "Resistencia.", estructura: "75' Z2 sendero", sensacion: "Base", tipo: "largo", zona: "Z2" },
          { nombre: "Largo montaña suave", duracion: 80, unidad: "min", desc: "Sendero continuo.", estructura: "80' sendero", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 85, unidad: "min", desc: "Incluye desnivel.", estructura: "85' con desnivel", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 80, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "55' Z2 + 25' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 90, unidad: "min", desc: "Incluye cambios.", estructura: "60' Z2 + 5x3' Z4 + 10' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 95, unidad: "min", desc: "Progresión constante.", estructura: "65' Z2 + 30' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 100, unidad: "min", desc: "Fondo largo en sendero.", estructura: "100' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 55, unidad: "min", desc: "Técnica sendero.", estructura: "55' técnico", sensacion: "Coordinación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero técnico", duracion: 60, unidad: "min", desc: "Técnica avanzada.", estructura: "60' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje montaña", duracion: 65, unidad: "min", desc: "Terreno variado.", estructura: "65' sendero variado", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 50, unidad: "min", desc: "Sesión para mantener forma.", estructura: "50' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 60, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 45, unidad: "min", desc: "Después de sesión intensa.", estructura: "45' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 70, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "70' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 30' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas medias", duracion: 60, unidad: "min", desc: "8x100m cuesta media.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 65, unidad: "min", desc: "7x120m cuesta media.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variables", duracion: 65, unidad: "min", desc: "6x(80m + 100m + 120m)", estructura: "15' calentamiento + 6 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 70, unidad: "min", desc: "12x80m cuesta media.", estructura: "15' calentamiento + 12 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas medias", duracion: 75, unidad: "min", desc: "6x150m cuesta media.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas intensas", duracion: 70, unidad: "min", desc: "7x(90m + 110m) cuesta media.", estructura: "15' calentamiento + 7 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 65, unidad: "min", desc: "14x70m cuesta media.", estructura: "15' calentamiento + 14 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo desnivel", duracion: 60, unidad: "min", desc: "Desnivel continuo.", estructura: "60' con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo montaña", duracion: 65, unidad: "min", desc: "Ritmo fuerte.", estructura: "65' desnivel", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 65, unidad: "min", desc: "Alterna ritmos.", estructura: "65' cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 70, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 50' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 70, unidad: "min", desc: "Aumenta ritmo cada 8'.", estructura: "10' calentamiento + 8' Z3 + 8' Z4 + 8' Z3 + 8' Z4 + 8' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 65, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 45' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 75, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 55' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo montaña", duracion: 100, unidad: "min", desc: "Mixto trail.", estructura: "100' trail técnico", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo técnico", duracion: 105, unidad: "min", desc: "Alta técnica.", estructura: "105' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 110, unidad: "min", desc: "Acumulación.", estructura: "110' con desnivel", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 105, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "75' Z2 + 30' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 115, unidad: "min", desc: "Incluye cambios.", estructura: "80' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 120, unidad: "min", desc: "Progresión constante.", estructura: "85' Z2 + 35' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 125, unidad: "min", desc: "Fondo largo en sendero.", estructura: "125' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 60, unidad: "min", desc: "Máxima técnica.", estructura: "60' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero avanzado", duracion: 65, unidad: "min", desc: "Técnica superior.", estructura: "65' técnico", sensacion: "Dominio", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje desnivel", duracion: 70, unidad: "min", desc: "Acumulación.", estructura: "70' con desnivel", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 55, unidad: "min", desc: "Sesión para mantener forma.", estructura: "55' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 65, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 50, unidad: "min", desc: "Después de sesión intensa.", estructura: "50' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 75, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "75' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 70, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 35' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas fuertes", duracion: 65, unidad: "min", desc: "10x120m cuesta fuerte.", estructura: "15' calentamiento + 10 cuestas + 10' enfriamiento", sensacion: "Máxima potencia", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas muy fuertes", duracion: 70, unidad: "min", desc: "8x150m cuesta fuerte.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas largas fuertes", duracion: 75, unidad: "min", desc: "7x200m cuesta fuerte.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas explosivas", duracion: 70, unidad: "min", desc: "14x100m cuesta fuerte.", estructura: "15' calentamiento + 14 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas fuertes", duracion: 75, unidad: "min", desc: "9x(110m + 130m) cuesta fuerte.", estructura: "15' calentamiento + 9 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas en escalera", duracion: 80, unidad: "min", desc: "6x(100m + 120m + 140m + 160m)", estructura: "15' calentamiento + 6 series + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas máximas", duracion: 85, unidad: "min", desc: "5x300m cuesta fuerte.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo montaña", duracion: 65, unidad: "min", desc: "Ritmo fuerte.", estructura: "65' desnivel intenso", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo fuerte", duracion: 70, unidad: "min", desc: "Máxima intensidad.", estructura: "70' desnivel intenso", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 70, unidad: "min", desc: "Cambios constantes.", estructura: "70' cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 75, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 55' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 75, unidad: "min", desc: "Aumenta ritmo cada 6'.", estructura: "10' calentamiento + 6' Z3 + 6' Z4 + 6' Z3 + 6' Z4 + 6' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 70, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 50' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 80, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 60' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo trail", duracion: 130, unidad: "min", desc: "Simulación.", estructura: "130' trail", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo avanzado", duracion: 140, unidad: "min", desc: "Alto volumen.", estructura: "140' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo ultra", duracion: 150, unidad: "min", desc: "Preparación.", estructura: "150' trail", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 135, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "95' Z2 + 40' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 145, unidad: "min", desc: "Incluye cambios.", estructura: "100' Z2 + 7x3' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 155, unidad: "min", desc: "Progresión constante.", estructura: "105' Z2 + 50' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 160, unidad: "min", desc: "Fondo largo en sendero.", estructura: "160' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      }
    },
    "medio": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje media trail", duracion: 50, unidad: "min", desc: "Terreno irregular.", estructura: "50' Z2 sendero", sensacion: "Adaptación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero media", duracion: 55, unidad: "min", desc: "Sendero continuo.", estructura: "55' sendero", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero progresivo", duracion: 55, unidad: "min", desc: "Aumenta ritmo.", estructura: "55' progresivo", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero de recuperación", duracion: 45, unidad: "min", desc: "Sesión muy suave en sendero.", estructura: "45' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Sendero matinal", duracion: 50, unidad: "min", desc: "Despertar suave en sendero.", estructura: "50' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero con cambios", duracion: 55, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 40' con cambios + 5' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero base", duracion: 60, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "60' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero regenerativo", duracion: 45, unidad: "min", desc: "Después de sesión dura.", estructura: "45' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Cuestas media", duracion: 55, unidad: "min", desc: "7x100m cuesta suave.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas cortas", duracion: 50, unidad: "min", desc: "8x70m cuesta suave.", estructura: "15' calentamiento + 8 cuestas + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas medias", duracion: 60, unidad: "min", desc: "6x120m cuesta media.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 65, unidad: "min", desc: "5x150m cuesta media.", estructura: "15' calentamiento + 5 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 60, unidad: "min", desc: "10x90m cuesta suave.", estructura: "15' calentamiento + 10 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variadas", duracion: 65, unidad: "min", desc: "7x(80m + 100m) cuesta media.", estructura: "15' calentamiento + 7 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 55, unidad: "min", desc: "14x70m cuesta suave.", estructura: "15' calentamiento + 14 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo sendero", duracion: 55, unidad: "min", desc: "Ritmo sostenido.", estructura: "55' Z3 sendero", sensacion: "Control", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo desnivel", duracion: 60, unidad: "min", desc: "Con desnivel suave.", estructura: "60' Z3 con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo.", estructura: "60' progresivo", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 65, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 45' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 60, unidad: "min", desc: "Alterna llano y cuestas.", estructura: "10' calentamiento + 40' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo con cambios", duracion: 65, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 45' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero umbral", duracion: 70, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 50' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo sendero", duracion: 90, unidad: "min", desc: "Resistencia.", estructura: "90' Z2 sendero", sensacion: "Base", tipo: "largo", zona: "Z2" },
          { nombre: "Largo montaña suave", duracion: 95, unidad: "min", desc: "Sendero continuo.", estructura: "95' sendero", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 100, unidad: "min", desc: "Incluye desnivel.", estructura: "100' con desnivel", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 95, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "65' Z2 + 30' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 105, unidad: "min", desc: "Incluye cambios.", estructura: "70' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 110, unidad: "min", desc: "Progresión constante.", estructura: "75' Z2 + 35' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 115, unidad: "min", desc: "Fondo largo en sendero.", estructura: "115' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 60, unidad: "min", desc: "Técnica avanzada.", estructura: "60' técnico", sensacion: "Coordinación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero técnico", duracion: 65, unidad: "min", desc: "Técnica superior.", estructura: "65' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje montaña", duracion: 70, unidad: "min", desc: "Terreno variado.", estructura: "70' sendero variado", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 55, unidad: "min", desc: "Sesión para mantener forma.", estructura: "55' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 65, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 50, unidad: "min", desc: "Después de sesión intensa.", estructura: "50' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 75, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "75' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 70, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 35' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas medias", duracion: 65, unidad: "min", desc: "9x120m cuesta media.", estructura: "15' calentamiento + 9 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 70, unidad: "min", desc: "8x150m cuesta media.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variables", duracion: 70, unidad: "min", desc: "7x(100m + 120m + 150m)", estructura: "15' calentamiento + 7 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 75, unidad: "min", desc: "14x90m cuesta media.", estructura: "15' calentamiento + 14 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas medias", duracion: 80, unidad: "min", desc: "7x180m cuesta media.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas intensas", duracion: 75, unidad: "min", desc: "8x(110m + 130m) cuesta media.", estructura: "15' calentamiento + 8 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 70, unidad: "min", desc: "16x80m cuesta media.", estructura: "15' calentamiento + 16 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo desnivel", duracion: 65, unidad: "min", desc: "Desnivel continuo.", estructura: "65' con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo montaña", duracion: 70, unidad: "min", desc: "Ritmo fuerte.", estructura: "70' desnivel", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 70, unidad: "min", desc: "Alterna ritmos.", estructura: "70' cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 75, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 55' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 75, unidad: "min", desc: "Aumenta ritmo cada 7'.", estructura: "10' calentamiento + 7' Z3 + 7' Z4 + 7' Z3 + 7' Z4 + 7' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 70, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 50' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 80, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 60' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo montaña", duracion: 115, unidad: "min", desc: "Mixto exigente.", estructura: "115' trail técnico", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo técnico", duracion: 120, unidad: "min", desc: "Alta técnica.", estructura: "120' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 125, unidad: "min", desc: "Acumulación.", estructura: "125' con desnivel", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 120, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "85' Z2 + 35' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 130, unidad: "min", desc: "Incluye cambios.", estructura: "90' Z2 + 7x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 135, unidad: "min", desc: "Progresión constante.", estructura: "95' Z2 + 40' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 140, unidad: "min", desc: "Fondo largo en sendero.", estructura: "140' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 65, unidad: "min", desc: "Máxima técnica.", estructura: "65' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero avanzado", duracion: 70, unidad: "min", desc: "Técnica elite.", estructura: "70' técnico", sensacion: "Dominio", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje desnivel", duracion: 75, unidad: "min", desc: "Acumulación.", estructura: "75' con desnivel", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 60, unidad: "min", desc: "Sesión para mantener forma.", estructura: "60' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 70, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 55, unidad: "min", desc: "Después de sesión intensa.", estructura: "55' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 80, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "80' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 75, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 40' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Cuestas fuertes", duracion: 70, unidad: "min", desc: "12x150m cuesta fuerte.", estructura: "15' calentamiento + 12 cuestas + 10' enfriamiento", sensacion: "Máxima potencia", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas muy fuertes", duracion: 75, unidad: "min", desc: "10x200m cuesta fuerte.", estructura: "15' calentamiento + 10 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas largas fuertes", duracion: 80, unidad: "min", desc: "8x250m cuesta fuerte.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas explosivas", duracion: 75, unidad: "min", desc: "16x120m cuesta fuerte.", estructura: "15' calentamiento + 16 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas variadas fuertes", duracion: 80, unidad: "min", desc: "10x(130m + 150m) cuesta fuerte.", estructura: "15' calentamiento + 10 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas en escalera", duracion: 85, unidad: "min", desc: "7x(120m + 150m + 180m + 200m)", estructura: "15' calentamiento + 7 series + 10' enfriamiento", sensacion: "Muy exigente", tipo: "series", zona: "Z5" },
          { nombre: "Cuestas máximas", duracion: 90, unidad: "min", desc: "6x350m cuesta fuerte.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo montaña", duracion: 70, unidad: "min", desc: "Ritmo fuerte.", estructura: "70' desnivel intenso", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo fuerte", duracion: 75, unidad: "min", desc: "Máxima intensidad.", estructura: "75' desnivel intenso", sensacion: "Muy exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 75, unidad: "min", desc: "Cambios constantes.", estructura: "75' cambios", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 80, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 60' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 80, unidad: "min", desc: "Aumenta ritmo cada 5'.", estructura: "10' calentamiento + 5' Z3 + 5' Z4 + 5' Z3 + 5' Z4 + 5' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 75, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 55' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral sendero", duracion: 85, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 65' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo trail", duracion: 145, unidad: "min", desc: "Simulación.", estructura: "145' trail", sensacion: "Preparación", tipo: "largo", zona: "Z2" },
          { nombre: "Largo avanzado", duracion: 155, unidad: "min", desc: "Alto volumen.", estructura: "155' trail técnico", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo ultra", duracion: 165, unidad: "min", desc: "Preparación ultra.", estructura: "165' trail", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 150, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "105' Z2 + 45' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 160, unidad: "min", desc: "Incluye cambios.", estructura: "110' Z2 + 8x3' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 170, unidad: "min", desc: "Progresión constante.", estructura: "115' Z2 + 55' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 175, unidad: "min", desc: "Fondo largo en sendero.", estructura: "175' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      }
    },
    "maraton": {
      principiante: {
        rodaje: [
          { nombre: "Rodaje maratón trail", duracion: 55, unidad: "min", desc: "Terreno irregular.", estructura: "55' Z2 sendero", sensacion: "Adaptación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero maratón", duracion: 60, unidad: "min", desc: "Sendero continuo.", estructura: "60' sendero", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero progresivo", duracion: 60, unidad: "min", desc: "Aumenta ritmo.", estructura: "60' progresivo", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero de recuperación", duracion: 50, unidad: "min", desc: "Sesión muy suave en sendero.", estructura: "50' Z1-Z2", sensacion: "Muy fácil", tipo: "rodaje", zona: "Z1" },
          { nombre: "Sendero matinal", duracion: 55, unidad: "min", desc: "Despertar suave en sendero.", estructura: "55' Z2", sensacion: "Refrescante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero con cambios", duracion: 60, unidad: "min", desc: "Introduce cambios de ritmo.", estructura: "10' calentamiento + 45' con cambios + 5' enfriamiento", sensacion: "Dinámico", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero base", duracion: 65, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "65' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero regenerativo", duracion: 50, unidad: "min", desc: "Después de sesión dura.", estructura: "50' Z1", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" }
        ],
        series: [
          { nombre: "Cuestas maratón", duracion: 60, unidad: "min", desc: "8x100m cuesta suave.", estructura: "15' calentamiento + 8 cuestas + 10' enfriamiento", sensacion: "Potencia", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas cortas", duracion: 55, unidad: "min", desc: "9x80m cuesta suave.", estructura: "15' calentamiento + 9 cuestas + 5' enfriamiento", sensacion: "Rápidas", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas medias", duracion: 65, unidad: "min", desc: "7x120m cuesta media.", estructura: "15' calentamiento + 7 cuestas + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas largas", duracion: 70, unidad: "min", desc: "6x150m cuesta media.", estructura: "15' calentamiento + 6 cuestas + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas repetidas", duracion: 65, unidad: "min", desc: "12x100m cuesta suave.", estructura: "15' calentamiento + 12 cuestas + 5' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas variadas", duracion: 70, unidad: "min", desc: "8x(90m + 110m) cuesta media.", estructura: "15' calentamiento + 8 series + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4" },
          { nombre: "Cuestas explosivas", duracion: 60, unidad: "min", desc: "16x80m cuesta suave.", estructura: "15' calentamiento + 16 cuestas + 5' enfriamiento", sensacion: "Explosivas", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo sendero", duracion: 60, unidad: "min", desc: "Ritmo sostenido.", estructura: "60' Z3 sendero", sensacion: "Control", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo desnivel", duracion: 65, unidad: "min", desc: "Con desnivel suave.", estructura: "65' Z3 con desnivel", sensacion: "Exigente", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 65, unidad: "min", desc: "Aumenta ritmo.", estructura: "65' progresivo", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero largo", duracion: 70, unidad: "min", desc: "Ritmo sostenido en sendero.", estructura: "10' calentamiento + 50' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo variable", duracion: 65, unidad: "min", desc: "Alterna llano y cuestas.", estructura: "10' calentamiento + 45' con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo con cambios", duracion: 70, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 50' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo sendero umbral", duracion: 75, unidad: "min", desc: "Ritmo cerca del umbral.", estructura: "10' calentamiento + 55' Z3-Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z3-Z4" }
        ],
        largo: [
          { nombre: "Largo sendero", duracion: 105, unidad: "min", desc: "Resistencia.", estructura: "105' Z2 sendero", sensacion: "Base", tipo: "largo", zona: "Z2" },
          { nombre: "Largo montaña suave", duracion: 110, unidad: "min", desc: "Sendero continuo.", estructura: "110' sendero", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo con desnivel", duracion: 115, unidad: "min", desc: "Incluye desnivel.", estructura: "115' con desnivel", sensacion: "Exigente", tipo: "largo", zona: "Z2" },
          { nombre: "Largo progresivo", duracion: 110, unidad: "min", desc: "Aumenta ritmo en llano.", estructura: "75' Z2 + 35' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 120, unidad: "min", desc: "Incluye cambios.", estructura: "80' Z2 + 6x3' Z4 + 15' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 125, unidad: "min", desc: "Progresión constante.", estrutura: "85' Z2 + 40' Z3", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo resistencia", duracion: 130, unidad: "min", desc: "Fondo largo en sendero.", estructura: "130' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" }
        ]
      },
      intermedio: {
        rodaje: [
          { nombre: "Rodaje técnico", duracion: 65, unidad: "min", desc: "Técnica avanzada.", estructura: "65' técnico", sensacion: "Coordinación", tipo: "rodaje", zona: "Z2" },
          { nombre: "Sendero técnico", duracion: 70, unidad: "min", desc: "Técnica superior.", estructura: "70' técnico", sensacion: "Maestría", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje montaña", duracion: 75, unidad: "min", desc: "Terreno variado.", estructura: "75' sendero variado", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 60, unidad: "min", desc: "Sesión para mantener forma.", estructura: "60' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 70, unidad: "min", desc: "Introduce 4 cambios.", estructura: "10' calentamiento + 4x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 55, unidad: "min", desc: "Después de sesión intensa.", estructura: "55' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 80, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "80' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 75, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 40' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 1600m", duracion: 70, unidad: "min", desc: "5x1600m con recuperación.", estructura: "15' calentamiento + 5x1600m + 10' enfriamiento", sensacion: "Intensidad", tipo: "series", zona: "Z4" },
          { nombre: "Series 2000m", duracion: 75, unidad: "min", desc: "4x2000m con recuperación 3'30.", estructura: "15' calentamiento + 4x2000m + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z4" },
          { nombre: "Pirámide maratón", duracion: 80, unidad: "min", desc: "800-1600-2400-3200-2400-1600-800m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z4-Z5" },
          { nombre: "Series 3000m", duracion: 85, unidad: "min", desc: "3x3000m con recuperación 4'.", estructura: "15' calentamiento + 3x3000m + 10' enfriamiento", sensacion: "Fuerte", tipo: "series", zona: "Z5" },
          { nombre: "Series 1000m", duracion: 75, unidad: "min", desc: "8x1000m con recuperación 2'.", estructura: "15' calentamiento + 8x1000m + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" },
          { nombre: "Fartlek avanzado", duracion: 70, unidad: "min", desc: "Juega con ritmos.", estructura: "10' calentamiento + 45' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z4" },
          { nombre: "Series 800m", duracion: 80, unidad: "min", desc: "12x800m con recuperación 1'30.", estructura: "15' calentamiento + 12x800m + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z4" }
        ],
        tempo: [
          { nombre: "Tempo umbral maratón", duracion: 65, unidad: "min", desc: "40' a ritmo umbral.", estructura: "10' calentamiento + 40' umbral + 15' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo maratón", duracion: 70, unidad: "min", desc: "45' a ritmo umbral.", estructura: "10' calentamiento + 45' Z4 + 15' enfriamiento", sensacion: "Sostenido", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 70, unidad: "min", desc: "Alterna 8' Z3 / 3' Z4.", estructura: "10' calentamiento + 5x(8' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 75, unidad: "min", desc: "50' a ritmo tempo.", estructura: "10' calentamiento + 50' Z3 + 15' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 75, unidad: "min", desc: "Aumenta cada 6'.", estructura: "10' calentamiento + 6' Z3 + 6' Z4 + 6' Z3 + 6' Z4 + 6' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 70, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 50' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo umbral largo", duracion: 80, unidad: "min", desc: "55' a ritmo umbral.", estructura: "10' calentamiento + 55' Z4 + 15' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo calidad maratón", duracion: 130, unidad: "min", desc: "Progresión últimos 40'.", estructura: "90' Z2 + 40' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con cambios", duracion: 140, unidad: "min", desc: "Incluye series.", estructura: "100' Z2 + 8x3' Z4 + 16' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 150, unidad: "min", desc: "Aumenta ritmo cada 40'.", estructura: "70' Z2 + 40' Z3 + 40' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo específico", duracion: 160, unidad: "min", desc: "Incluye cambios.", estructura: "110' Z2 + 8x3' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo fondo", duracion: 170, unidad: "min", desc: "Fondo largo continuo.", estructura: "170' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 180, unidad: "min", desc: "Fondo largo con cambios.", estructura: "130' Z2 + 50' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 190, unidad: "min", desc: "Incluye series largas.", estructura: "130' Z2 + 8x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" }
        ]
      },
      avanzado: {
        rodaje: [
          { nombre: "Rodaje alto maratón", duracion: 70, unidad: "min", desc: "Ritmo exigente Z2.", estructura: "70' Z2 alto", sensacion: "Exigente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje activo", duracion: 75, unidad: "min", desc: "Ritmo vivo.", estructura: "75' Z2 vivo", sensacion: "Sostenible", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje técnico", duracion: 80, unidad: "min", desc: "Enfoque técnico.", estructura: "80' Z2 cadencia alta", sensacion: "Eficiente", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de mantenimiento", duracion: 65, unidad: "min", desc: "Sesión para mantener forma.", estructura: "65' Z2", sensacion: "Cómodo", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje con estímulos", duracion: 75, unidad: "min", desc: "Introduce 5 cambios.", estructura: "10' calentamiento + 5x(2' rápido + 3' suave) + 10' enfriamiento", sensacion: "Estimulante", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje de recuperación", duracion: 60, unidad: "min", desc: "Después de sesión intensa.", estructura: "60' Z1-Z2", sensacion: "Muy suave", tipo: "rodaje", zona: "Z1" },
          { nombre: "Rodaje de base", duracion: 85, unidad: "min", desc: "Fondo para construir resistencia.", estructura: "85' Z2", sensacion: "Resistencia", tipo: "rodaje", zona: "Z2" },
          { nombre: "Rodaje progresivo", duracion: 80, unidad: "min", desc: "Aumenta ritmo cada 15'.", estructura: "15' Z2 + 20' Z2 medio + 45' Z2 alto", sensacion: "Progresivo", tipo: "rodaje", zona: "Z2" }
        ],
        series: [
          { nombre: "Series 3000m", duracion: 80, unidad: "min", desc: "4x3000m con recuperación.", estructura: "15' calentamiento + 4x3000m + 10' enfriamiento", sensacion: "Muy intenso", tipo: "series", zona: "Z5" },
          { nombre: "Series 5000m", duracion: 85, unidad: "min", desc: "3x5000m con recuperación 5'.", estructura: "15' calentamiento + 3x5000m + 10' enfriamiento", sensacion: "Exigente", tipo: "series", zona: "Z5" },
          { nombre: "Series 10000m", duracion: 90, unidad: "min", desc: "2x10000m con recuperación 6'.", estructura: "15' calentamiento + 2x10000m + 10' enfriamiento", sensacion: "Máximo", tipo: "series", zona: "Z5" },
          { nombre: "Series 2000m", duracion: 80, unidad: "min", desc: "6x2000m con recuperación 2'30.", estructura: "15' calentamiento + 6x2000m + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5" },
          { nombre: "Pirámide larga", duracion: 90, unidad: "min", desc: "2000-3000-5000-3000-2000m.", estructura: "15' calentamiento + pirámide + 10' enfriamiento", sensacion: "Completo", tipo: "series", zona: "Z5" },
          { nombre: "Fartlek avanzado", duracion: 80, unidad: "min", desc: "Juega con ritmos intensos.", estructura: "10' calentamiento + 55' fartlek + 15' enfriamiento", sensacion: "Divertido", tipo: "series", zona: "Z5" },
          { nombre: "Series 1600m", duracion: 85, unidad: "min", desc: "10x1600m con recuperación 2'.", estructura: "15' calentamiento + 10x1600m + 10' enfriamiento", sensacion: "Intenso", tipo: "series", zona: "Z5" }
        ],
        tempo: [
          { nombre: "Tempo maratón avanzado", duracion: 70, unidad: "min", desc: "50' a ritmo maratón.", estructura: "10' calentamiento + 50' Z4 + 10' enfriamiento", sensacion: "Ritmo carrera", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo umbral", duracion: 75, unidad: "min", desc: "55' a ritmo umbral.", estructura: "10' calentamiento + 55' Z4 + 10' enfriamiento", sensacion: "Exigente", tipo: "tempo", zona: "Z4" },
          { nombre: "Tempo variable", duracion: 75, unidad: "min", desc: "Alterna 7' Z3 / 3' Z4.", estructura: "10' calentamiento + 6x(7' Z3 + 3' Z4) + 5' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo largo", duracion: 80, unidad: "min", desc: "60' a ritmo tempo.", estructura: "10' calentamiento + 60' Z3 + 10' enfriamiento", sensacion: "Resistencia", tipo: "tempo", zona: "Z3" },
          { nombre: "Tempo progresivo", duracion: 80, unidad: "min", desc: "Aumenta cada 5'.", estructura: "10' calentamiento + 5' Z3 + 5' Z4 + 5' Z3 + 5' Z4 + 5' enfriamiento", sensacion: "Progresivo", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo con cambios", duracion: 75, unidad: "min", desc: "Introduce 6 cambios.", estructura: "10' calentamiento + 55' tempo con cambios + 10' enfriamiento", sensacion: "Dinámico", tipo: "tempo", zona: "Z3-Z4" },
          { nombre: "Tempo umbral largo", duracion: 85, unidad: "min", desc: "65' a ritmo umbral.", estructura: "10' calentamiento + 65' Z4 + 10' enfriamiento", sensacion: "Muy exigente", tipo: "tempo", zona: "Z4" }
        ],
        largo: [
          { nombre: "Largo específico maratón", duracion: 160, unidad: "min", desc: "Cambios a ritmo maratón.", estructura: "100' Z2 + 8x5' Z4 + 20' enfriamiento", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo calidad", duracion: 170, unidad: "min", desc: "Progresión constante.", estructura: "110' Z2 + 60' Z3", sensacion: "Fuerte", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo con series", duracion: 180, unidad: "min", desc: "Series largas.", estructura: "120' Z2 + 6x1000m Z4 + 20' enfriamiento", sensacion: "Exigente", tipo: "largo", zona: "Z2-Z4" },
          { nombre: "Largo progresivo", duracion: 190, unidad: "min", desc: "Aumenta ritmo cada 40'.", estructura: "90' Z2 + 50' Z3 + 50' Z2", sensacion: "Controlado", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo fondo", duracion: 200, unidad: "min", desc: "Fondo largo continuo.", estructura: "200' Z2", sensacion: "Resistencia", tipo: "largo", zona: "Z2" },
          { nombre: "Largo resistencia", duracion: 210, unidad: "min", desc: "Fondo largo con cambios.", estructura: "150' Z2 + 60' Z3", sensacion: "Resistencia", tipo: "largo", zona: "Z2-Z3" },
          { nombre: "Largo ultradistancia", duracion: 220, unidad: "min", desc: "Preparación para maratón.", estructura: "160' Z2 + 60' Z3", sensacion: "Preparación", tipo: "largo", zona: "Z2-Z3" }
        ]
      }
    }
  }
};

// ============================================
// 2. ESTRUCTURA DE MICROCICLOS PROFESIONALES (runner)
// ============================================
const PLANTILLAS_SEMANALES = { runner: {} };

// ==================== Runner - 2k ====================
PLANTILLAS_SEMANALES.runner["2k"] = {
  principiante: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'series', variante: '200m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'base', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'recuperación', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'descanso' }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.1, 1.2, 0.6],
    progresionSeries: [1.0, 1.1, 1.2, 0.5]
  },
  intermedio: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '400m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'corto', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'progresivo', fromMatrix: true } }, { 1: { tipo: 'descanso' }, 2: { tipo: 'tempo', variante: 'umbral', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 4: { tipo: 'series', variante: '600m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'constante', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.15, 1.3, 0.6],
    progresionSeries: [1.0, 1.1, 1.2, 0.5]
  },
  avanzado: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '800m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'fuerte', fromMatrix: true }, 5: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 6: { tipo: 'series', variante: '400m', fromMatrix: true }, 7: { tipo: 'largo', variante: 'calidad', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.2, 1.4, 0.6],
    progresionSeries: [1.0, 1.15, 1.3, 0.5]
  }
};

// ==================== Runner - 5k ====================
PLANTILLAS_SEMANALES.runner["5k"] = {
  principiante: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'series', variante: '300m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'base', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'descanso' }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.1, 1.2, 0.6],
    progresionSeries: [1.0, 1.1, 1.2, 0.5]
  },
  intermedio: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '800m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'umbral', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'progresivo', fromMatrix: true } }, { 1: { tipo: 'descanso' }, 2: { tipo: 'tempo', variante: 'largo', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 4: { tipo: 'series', variante: '1000m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'constante', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.15, 1.3, 0.6],
    progresionSeries: [1.0, 1.1, 1.25, 0.5]
  },
  avanzado: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '1000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'fuerte', fromMatrix: true }, 5: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 6: { tipo: 'series', variante: '400m', fromMatrix: true }, 7: { tipo: 'largo', variante: 'calidad', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.2, 1.4, 0.6],
    progresionSeries: [1.0, 1.15, 1.3, 0.5]
  }
};

// ==================== Runner - 10k ====================
PLANTILLAS_SEMANALES.runner["10k"] = {
  principiante: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'series', variante: '400m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'base', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'descanso' }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.1, 1.2, 0.6],
    progresionSeries: [1.0, 1.1, 1.2, 0.5]
  },
  intermedio: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '1000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'umbral', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'progresivo', fromMatrix: true } }, { 1: { tipo: 'descanso' }, 2: { tipo: 'tempo', variante: 'largo', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 4: { tipo: 'series', variante: '800m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'constante', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.15, 1.3, 0.6],
    progresionSeries: [1.0, 1.1, 1.25, 0.5]
  },
  avanzado: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '2000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'fuerte', fromMatrix: true }, 5: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 6: { tipo: 'series', variante: '1000m', fromMatrix: true }, 7: { tipo: 'largo', variante: 'calidad', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.2, 1.4, 0.6],
    progresionSeries: [1.0, 1.15, 1.3, 0.5]
  }
};

// ==================== Runner - Medio Maratón ====================
PLANTILLAS_SEMANALES.runner["medio"] = {
  principiante: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'series', variante: '800m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'base', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'descanso' }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.1, 1.2, 0.6],
    progresionSeries: [1.0, 1.1, 1.2, 0.5]
  },
  intermedio: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '2000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'umbral', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'progresivo', fromMatrix: true } }, { 1: { tipo: 'descanso' }, 2: { tipo: 'tempo', variante: 'largo', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 4: { tipo: 'series', variante: '1500m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'constante', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.15, 1.3, 0.6],
    progresionSeries: [1.0, 1.1, 1.25, 0.5]
  },
  avanzado: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '3000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'fuerte', fromMatrix: true }, 5: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 6: { tipo: 'series', variante: '1000m', fromMatrix: true }, 7: { tipo: 'largo', variante: 'calidad', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.2, 1.4, 0.6],
    progresionSeries: [1.0, 1.15, 1.3, 0.5]
  }
};

// ==================== Runner - Maratón ====================
PLANTILLAS_SEMANALES.runner["maraton"] = {
  principiante: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'base', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'descanso' }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.1, 1.2, 0.6]
  },
  intermedio: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '3000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'maraton', fromMatrix: true }, 5: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 6: { tipo: 'tempo', variante: 'corto', fromMatrix: true }, 7: { tipo: 'largo', variante: 'progresivo', fromMatrix: true } }, { 1: { tipo: 'descanso' }, 2: { tipo: 'tempo', variante: 'largo', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 4: { tipo: 'series', variante: '5000m', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'activo', fromMatrix: true }, 7: { tipo: 'largo', variante: 'constante', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.15, 1.3, 0.6]
  },
  avanzado: {
    ciclos: [ { 1: { tipo: 'descanso' }, 2: { tipo: 'series', variante: '5000m', fromMatrix: true }, 3: { tipo: 'rodaje', variante: 'regenerativo', fromMatrix: true }, 4: { tipo: 'tempo', variante: 'maraton', fromMatrix: true }, 5: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 6: { tipo: 'series', variante: '2000m', fromMatrix: true }, 7: { tipo: 'largo', variante: 'calidad', fromMatrix: true } } ],
    cicloDescarga: { 1: { tipo: 'descanso' }, 2: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 3: { tipo: 'descanso' }, 4: { tipo: 'tempo', variante: 'suave', fromMatrix: true }, 5: { tipo: 'descanso' }, 6: { tipo: 'rodaje', variante: 'suave', fromMatrix: true }, 7: { tipo: 'largo', variante: 'suave', fromMatrix: true } },
    progresionLargo: [1.0, 1.2, 1.4, 0.6]
  }
};

// ============================================
// 3. GENERACIÓN DINÁMICA DE MICROCICLOS DE TRAIL
// ============================================
const distanciasTrail = ["2k", "5k", "10k", "medio", "maraton"];
const niveles = ["principiante", "intermedio", "avanzado"];

PLANTILLAS_SEMANALES.trail = {};
distanciasTrail.forEach(dist => {
  PLANTILLAS_SEMANALES.trail[dist] = {};
  niveles.forEach(nivel => {
    const base = JSON.parse(JSON.stringify(PLANTILLAS_SEMANALES.runner[dist]?.[nivel] || {}));
    if (base.ciclos) {
      base.ciclos = base.ciclos.map(ciclo => {
        const nuevoCiclo = {};
        Object.keys(ciclo).forEach(dia => {
          nuevoCiclo[dia] = { ...ciclo[dia] };
          if (nuevoCiclo[dia].tipo === 'series') nuevoCiclo[dia].variante = 'cuestas';
          if (nuevoCiclo[dia].tipo === 'rodaje') nuevoCiclo[dia].variante = 'sendero';
          if (nuevoCiclo[dia].tipo === 'largo') nuevoCiclo[dia].variante = 'trail';
          if (nuevoCiclo[dia].tipo === 'tempo') nuevoCiclo[dia].variante = 'desnivel';
        });
        return nuevoCiclo;
      });
    }
    if (base.cicloDescarga) {
      base.cicloDescarga = { ...base.cicloDescarga };
      Object.keys(base.cicloDescarga).forEach(dia => {
        if (base.cicloDescarga[dia].tipo === 'rodaje') base.cicloDescarga[dia].variante = 'sendero';
      });
    }
    base.progresionDesnivel = [1.0, 1.15, 1.3, 0.6];
    PLANTILLAS_SEMANALES.trail[dist][nivel] = base;
  });
});

// ============================================
// 4. FUNCIÓN AUXILIAR PARA OBTENER SESIÓN DE LA MATRIZ
// ============================================
window.getSesionFromMatrix = function(tipo, modalidad, distancia, nivel, variante) {
  const db = ENTRENAMIENTOS_DB[modalidad]?.[distancia]?.[nivel]?.[tipo];
  if (!db) return null;
  if (variante) {
    const encontrada = db.find(s => s.nombre.toLowerCase().includes(variante.toLowerCase()) || (s.tipo === tipo && s.nombre.includes(variante)));
    if (encontrada) return encontrada;
  }
  return db[Math.floor(Math.random() * db.length)];
};

// ============================================
// 5. EXPORTAR TODO (para uso global)
// ============================================
window.ENTRENAMIENTOS_DB = ENTRENAMIENTOS_DB;
window.PLANTILLAS_SEMANALES = PLANTILLAS_SEMANALES;

console.log('✅ Biblioteca de microciclos profesionales con matriz de 1.344 entrenamientos');
console.log('📊 Total microciclos:', Object.keys(PLANTILLAS_SEMANALES.runner).length * 3 + Object.keys(PLANTILLAS_SEMANALES.trail).length * 3, 'perfiles');