export const machupicchuCircuitsContent = {
  es: {
    ctaHref: "/es/planea-tu-viaje",
    ui: {
      circuit: "Circuito",
      routes: "rutas",
      mapsLabel: "Circuitos de Machu Picchu",
      mapsTitle: "Mapas de los 3 circuitos oficiales",
      mapsDescription:
        "Haz clic en cualquier circuito para ver el mapa completo.",
      viewFullMap: "Ver mapa completo",
      viewCircuitMap: "Ver mapa del circuito",
      viewRouteMap: "Ver mapa de ruta",
      routesAria: "Rutas del Circuito",
      navLabel: "Navegación por circuitos",
      idealTitle: "¿Para quién es ideal?",
      compareTitle: "Comparativa rápida",
      compareCaption:
        "Diferencias principales entre los circuitos oficiales de Machu Picchu.",
      detailHeader: "Detalle",
      bookingTitle: "Recomendaciones de reserva",
      closeMap: "Cerrar mapa",
      officialMap: "Mapa oficial",
      map: "Mapa",
      replaceImage: "Reemplazar con imagen oficial",
      decree:
        "A partir del 01 de junio de 2024, mediante Resolución Ministerial 528-2023-MC del Ministerio de Cultura del Perú, entraron en vigencia 3 nuevos circuitos que agrupan 10 rutas oficiales dentro del Santuario Histórico de Machu Picchu.",
    },
    circuits: [
      {
        id: "circuito1",
        dialogId: "mapCircuito1",
        tone: "c1",
        number: "1",
        name: "Panorámico",
        summary:
          "Vistas elevadas y conexión con la naturaleza · 4 rutas disponibles",
        alt: "Mapa oficial del Circuito 1 Panorámico de Machu Picchu",
        routes: [
          "1-A Montaña Machupicchu",
          "1-B Terraza Superior",
          "1-C Intipunku",
          "1-D Puente Inka",
        ],
      },
      {
        id: "circuito2",
        dialogId: "mapCircuito2",
        tone: "c2",
        number: "2",
        name: "Machupicchu Clásico",
        summary:
          "La ruta recomendada para primera visita · 2 rutas disponibles",
        alt: "Mapa oficial del Circuito 2 Clásico de Machu Picchu",
        routes: ["2-A Circuito Clásico Completo", "2-B Terraza Inferior"],
      },
      {
        id: "circuito3",
        dialogId: "mapCircuito3",
        tone: "c3",
        number: "3",
        name: "Machupicchu Realeza",
        summary:
          "Sectores bajos, zonas ceremoniales y montañas · 4 rutas disponibles",
        alt: "Mapa oficial del Circuito 3 Realeza de Machu Picchu",
        routes: [
          "3-A Waynapicchu",
          "3-B Realeza Diseñada",
          "3-C Gran Caverna",
          "3-D Huchuypicchu",
        ],
      },
    ],
    routes: [
      {
        id: "ruta-1a",
        circuitId: "circuito1",
        modalId: "mapModal1A",
        tone: "c1",
        title: "Ruta 1-A: Montaña Machupicchu",
        intro:
          "Combina la exploración de la ciudadela inca con una caminata hacia la Montaña Machupicchu (≈3,082 m s. n. m.), ofreciendo vistas panorámicas únicas. Ideal para quienes buscan aventura y arqueología en una sola jornada.",
        details: [
          ["Duración", "4-6 horas (ciudadela + ascenso)"],
          [
            "Dificultad",
            "Moderada-Alta · escaleras de piedra con desnivel considerable",
          ],
          ["Altitud máxima", "3,082 m s. n. m. en la cima de la montaña"],
          ["Disponibilidad", "Todo el año · boleto adicional obligatorio"],
          [
            "Atractivos",
            "Templo del Sol, Plaza Principal, Casa del Guardián y vistas altas",
          ],
          [
            "Equipo recomendado",
            "Calzado de trekking, agua, bloqueador y bastones permitidos",
          ],
        ],
        ideal: [
          [
            "Trekkers y viajeros activos",
            "Ascenso exigente con recompensa panorámica.",
          ],
          [
            "Fotógrafos",
            "Vistas amplias del santuario y del valle del Urubamba.",
          ],
          [
            "Segunda visita",
            "Buena opción si ya conoces el recorrido clásico.",
          ],
        ],
      },
      {
        id: "ruta-1b",
        circuitId: "circuito1",
        modalId: "mapModal1B",
        tone: "c1",
        title: "Ruta 1-B: Terraza Superior",
        intro:
          "Es el recorrido más corto y accesible del Circuito 1. Permite llegar a las terrazas superiores y obtener la foto postal desde el sector de la Casa del Guardián.",
        details: [
          ["Duración", "2-3 horas"],
          ["Dificultad", "Baja"],
          [
            "Destacados",
            "Casa del Guardián, terrazas agrícolas y vista postal clásica",
          ],
          ["Disponibilidad", "Todo el año"],
        ],
        ideal: [
          ["Familias", "Menor exigencia física y recorrido más directo."],
          [
            "Viajeros con poco tiempo",
            "Prioriza la vista panorámica principal.",
          ],
          [
            "Fotógrafos",
            "Acceso a los ángulos más reconocibles de Machu Picchu.",
          ],
        ],
      },
      {
        id: "ruta-1c",
        circuitId: "circuito1",
        modalId: "mapModal1C",
        tone: "gold",
        title: "Ruta 1-C: Portada Intipunku",
        seasonal: "Solo temporada alta · abril-octubre",
        intro:
          "Caminata hacia Intipunku, la Puerta del Sol y antiguo ingreso del Camino Inca. Requiere condición física moderada por senderos empedrados y escaleras.",
        details: [
          ["Duración", "3-4 horas"],
          ["Caminata", "1-1.5 horas adicionales"],
          ["Dificultad", "Moderada"],
          ["Disponibilidad", "Temporada alta únicamente"],
        ],
        ideal: [
          [
            "Caminantes",
            "Una ruta histórica con vistas progresivas del santuario.",
          ],
          [
            "Amantes del Camino Inca",
            "Conecta con el ingreso ceremonial original.",
          ],
          [
            "Fotografía de paisaje",
            "Perspectivas distintas desde la parte alta.",
          ],
        ],
      },
      {
        id: "ruta-1d",
        circuitId: "circuito1",
        modalId: "mapModal1D",
        tone: "gold",
        title: "Ruta 1-D: Puente Inka",
        seasonal: "Solo temporada alta · abril-octubre",
        intro:
          "Ruta hacia el antiguo Puente Inka, con sendero estrecho cercano a acantilados. Es atractiva para exploradores, pero requiere precaución, especialmente con lluvia o neblina.",
        details: [
          ["Duración", "3-4 horas"],
          ["Caminata", "1-1.5 horas adicionales"],
          ["Dificultad", "Moderada"],
          ["Nota", "Evitar con lluvia intensa o vértigo"],
        ],
        ideal: [
          [
            "Exploradores",
            "Recorrido menos convencional dentro del santuario.",
          ],
          [
            "Historia inca",
            "Muestra soluciones defensivas y de control territorial.",
          ],
          ["Viajeros cuidadosos", "Requiere atención en tramos estrechos."],
        ],
      },
      {
        id: "ruta-2a",
        circuitId: "circuito2",
        modalId: "mapModal2A",
        tone: "c2",
        title: "Ruta 2-A: Circuito Clásico Completo",
        intro:
          "Es el recorrido más extenso y detallado. Integra zonas agrícolas, urbanas y religiosas, y ofrece la experiencia arqueológica más completa para una primera visita.",
        details: [
          ["Duración", "2.5-3.5 horas"],
          ["Dificultad", "Moderada"],
          [
            "Incluye",
            "Foto clásica, plazas, templos y sectores urbanos principales",
          ],
          ["Recomendado para", "Primera visita a Machu Picchu"],
        ],
        ideal: [
          [
            "Primer viaje",
            "La opción más equilibrada para conocer la ciudadela.",
          ],
          ["Viajeros culturales", "Permite una lectura arqueológica integral."],
          ["Familias activas", "Recorrido completo con exigencia moderada."],
        ],
      },
      {
        id: "ruta-2b",
        circuitId: "circuito2",
        modalId: "mapModal2B",
        tone: "c2",
        title: "Ruta 2-B: Terraza Inferior",
        intro:
          "Variante del clásico que recorre terrazas agrícolas inferiores y zonas ceremoniales principales. Es menos extensa que la 2-A, pero conserva una experiencia amplia.",
        details: [
          ["Duración", "2-3 horas"],
          ["Dificultad", "Moderada"],
          ["Recorrido", "Zonas urbanas, agrícolas y ceremoniales"],
          ["Ideal", "Historia y fotografía con un ritmo más compacto"],
        ],
        ideal: [
          [
            "Viajeros de primera visita",
            "Buena alternativa si la Ruta 2-A no está disponible.",
          ],
          ["Fotografía", "Mantiene vistas amplias y sectores representativos."],
          ["Ritmo moderado", "Menos extensa, sin perder contexto histórico."],
        ],
      },
      {
        id: "ruta-3a",
        circuitId: "circuito3",
        modalId: "mapModal3A",
        tone: "c3",
        title: "Ruta 3-A: Montaña Waynapicchu",
        intro:
          "El ascenso más famoso y desafiante. Waynapicchu alcanza unos 2,693 m s. n. m. y ofrece una de las vistas más icónicas del santuario. No se recomienda para vértigo o movilidad limitada.",
        details: [
          ["Duración", "4-6 horas"],
          ["Ascenso", "1-1.5 horas"],
          ["Dificultad", "Alta"],
          ["Cupos", "400 visitantes por día en turnos de mañana"],
        ],
        ideal: [
          ["Aventura intensa", "Ascenso empinado y muy demandado."],
          ["Viajeros sin vértigo", "Hay tramos estrechos y expuestos."],
          ["Reservas anticipadas", "Los cupos suelen agotarse rápido."],
        ],
      },
      {
        id: "ruta-3b",
        circuitId: "circuito3",
        modalId: "mapModal3B",
        tone: "c3",
        title: "Ruta 3-B: Realeza Diseñada",
        intro:
          "Recorre áreas ceremoniales y residenciales sin ascenso de montaña. Es una alternativa más tranquila dentro del Circuito 3, con enfoque en arquitectura y espiritualidad.",
        details: [
          ["Duración", "2.5-3.5 horas"],
          ["Dificultad", "Moderada"],
          ["Enfoque", "Arquitectura, ritualidad y residencia inca"],
          ["Ideal", "Familias y viajeros culturales"],
        ],
        ideal: [
          ["Cultura inca", "Prioriza sectores ceremoniales y residenciales."],
          ["Familias", "Menos exigente que las rutas de montaña."],
          [
            "Viajeros contemplativos",
            "Un recorrido más pausado por zonas bajas.",
          ],
        ],
      },
      {
        id: "ruta-3c",
        circuitId: "circuito3",
        modalId: "mapModal3C",
        tone: "gold",
        title: "Ruta 3-C: Gran Caverna",
        seasonal: "Solo temporada alta · abril-octubre",
        intro:
          "Ruta hacia un sitio de culto vinculado a la tierra y las montañas. Es menos concurrida, con senderos de vegetación, tramos estrechos y una atmósfera más exploratoria.",
        details: [
          ["Duración", "4-5 horas"],
          ["Caminata", "1.5-2 horas adicionales"],
          ["Dificultad", "Moderada"],
          ["Disponibilidad", "Temporada alta únicamente"],
        ],
        ideal: [
          ["Aventureros", "Descubre lugares menos conocidos del santuario."],
          [
            "Espiritualidad inca",
            "Sitio de culto relacionado con la tierra y las montañas.",
          ],
          ["Fotógrafos", "Imágenes únicas y menos repetidas."],
        ],
      },
      {
        id: "ruta-3d",
        circuitId: "circuito3",
        modalId: "mapModal3D",
        tone: "gold",
        title: "Ruta 3-D: Huchuypicchu",
        seasonal: "Solo temporada alta · abril-octubre",
        intro:
          "Combina la ciudadela con el ascenso a Huchuypicchu, la montaña pequeña de 2,497 m s. n. m. Es menos exigente que Waynapicchu y tiene cupo limitado.",
        details: [
          ["Duración", "3-4 horas"],
          ["Ascenso", "1-1.5 horas"],
          ["Dificultad", "Moderada"],
          ["Cupos", "200 visitantes por día"],
        ],
        ideal: [
          ["Alternativa a Waynapicchu", "Caminata más breve y tranquila."],
          ["Fotógrafos", "Vistas únicas sin tanta demanda."],
          [
            "Viajeros activos",
            "Buen balance entre caminata y zonas arqueológicas.",
          ],
        ],
      },
    ],
    compareRows: [
      [
        "Foto postal clásica",
        "Sí, desde vista alta",
        "Sí, la más tradicional",
        "No desde ángulo clásico",
      ],
      ["Templo del Sol", "No", "Sí", "Sí"],
      ["Intihuatana", "No", "Sí", "No"],
      ["Casa del Inca", "No", "No", "Sí"],
      ["Esfuerzo físico", "Variable", "Moderado", "Bajo a alto"],
      [
        "Mejor para",
        "Fotos y vistas",
        "Primera visita",
        "Zonas bajas y montañas",
      ],
    ],
    booking: [
      {
        title: "Reserva con anticipación",
        text: "Circuito 2, Waynapicchu y Huchuypicchu suelen agotarse rápido en temporada alta.",
      },
      {
        title: "Elige por experiencia",
        text: "El boleto define qué sectores verás. Dentro del santuario no podrás cambiar de circuito.",
      },
      {
        title: "No hay reingreso",
        text: "Una vez que sales del circuito asignado, no puedes volver a ingresar.",
      },
    ],
    cta: {
      title: "¿No sabes qué boleto comprar?",
      text: "En Dreamy Tours revisamos disponibilidad, horarios de tren, buses, caminatas y tipo de viajero para recomendarte el circuito correcto.",
      label: "Pedir asesoría para Machu Picchu",
    },
  },
  en: {
    ctaHref: "/en/plan-your-trip",
    ui: {
      circuit: "Circuit",
      routes: "routes",
      mapsLabel: "Machu Picchu Circuits",
      mapsTitle: "Maps of the 3 official circuits",
      mapsDescription: "Click any circuit to view the full map.",
      viewFullMap: "View full map",
      viewCircuitMap: "View circuit map",
      viewRouteMap: "View route map",
      routesAria: "Routes for Circuit",
      navLabel: "Circuit navigation",
      idealTitle: "Who is it ideal for?",
      compareTitle: "Quick comparison",
      compareCaption:
        "Main differences between the official Machu Picchu circuits.",
      detailHeader: "Detail",
      bookingTitle: "Booking recommendations",
      closeMap: "Close map",
      officialMap: "Official map",
      map: "Map",
      replaceImage: "Replace with official image",
      decree:
        "As of June 1, 2024, through Ministerial Resolution 528-2023-MC from Peru's Ministry of Culture, 3 new circuits came into effect, grouping 10 official routes inside the Historic Sanctuary of Machu Picchu.",
    },
    circuits: [
      {
        id: "circuito1",
        dialogId: "mapCircuito1",
        tone: "c1",
        number: "1",
        name: "Panoramic",
        summary:
          "High viewpoints and connection with nature · 4 available routes",
        alt: "Official map of Machu Picchu Circuit 1 Panoramic",
        routes: [
          "1-A Machupicchu Mountain",
          "1-B Upper Terrace",
          "1-C Intipunku",
          "1-D Inka Bridge",
        ],
      },
      {
        id: "circuito2",
        dialogId: "mapCircuito2",
        tone: "c2",
        number: "2",
        name: "Classic Machupicchu",
        summary:
          "The recommended route for first-time visitors · 2 available routes",
        alt: "Official map of Machu Picchu Circuit 2 Classic",
        routes: ["2-A Complete Classic Circuit", "2-B Lower Terrace"],
      },
      {
        id: "circuito3",
        dialogId: "mapCircuito3",
        tone: "c3",
        number: "3",
        name: "Royal Machupicchu",
        summary:
          "Lower sectors, ceremonial areas and mountains · 4 available routes",
        alt: "Official map of Machu Picchu Circuit 3 Royal",
        routes: [
          "3-A Waynapicchu",
          "3-B Designed Royalty",
          "3-C Great Cavern",
          "3-D Huchuypicchu",
        ],
      },
    ],
    routes: [
      {
        id: "ruta-1a",
        circuitId: "circuito1",
        modalId: "mapModal1A",
        tone: "c1",
        title: "Route 1-A: Machupicchu Mountain",
        intro:
          "Combines exploration of the Inca citadel with a hike to Machupicchu Mountain (about 3,082 m / 10,112 ft), offering unique panoramic views. Ideal for travelers who want adventure and archaeology in one day.",
        details: [
          ["Duration", "4-6 hours (citadel + ascent)"],
          [
            "Difficulty",
            "Moderate-High · stone stairs with significant elevation gain",
          ],
          ["Maximum altitude", "3,082 m / 10,112 ft at the summit"],
          ["Availability", "Year-round · additional ticket required"],
          [
            "Highlights",
            "Temple of the Sun, Main Plaza, Guardhouse and high viewpoints",
          ],
          [
            "Recommended gear",
            "Trekking shoes, water, sunscreen and permitted poles",
          ],
        ],
        ideal: [
          [
            "Trekkers and active travelers",
            "A demanding climb with panoramic reward.",
          ],
          [
            "Photographers",
            "Wide views of the sanctuary and the Urubamba Valley.",
          ],
          [
            "Second-time visitors",
            "A strong option if you already know the classic route.",
          ],
        ],
      },
      {
        id: "ruta-1b",
        circuitId: "circuito1",
        modalId: "mapModal1B",
        tone: "c1",
        title: "Route 1-B: Upper Terrace",
        intro:
          "The shortest and most accessible route in Circuit 1. It reaches the upper terraces and gives you the postcard photo from the Guardhouse sector.",
        details: [
          ["Duration", "2-3 hours"],
          ["Difficulty", "Low"],
          [
            "Highlights",
            "Guardhouse, agricultural terraces and classic postcard view",
          ],
          ["Availability", "Year-round"],
        ],
        ideal: [
          ["Families", "Lower physical demand and a more direct route."],
          [
            "Travelers with limited time",
            "Prioritizes the main panoramic view.",
          ],
          [
            "Photographers",
            "Access to Machu Picchu's most recognizable angles.",
          ],
        ],
      },
      {
        id: "ruta-1c",
        circuitId: "circuito1",
        modalId: "mapModal1C",
        tone: "gold",
        title: "Route 1-C: Intipunku Gate",
        seasonal: "High season only · April-October",
        intro:
          "A hike to Intipunku, the Sun Gate and former entrance of the Inca Trail. It requires moderate fitness due to stone paths and stairs.",
        details: [
          ["Duration", "3-4 hours"],
          ["Hike", "1-1.5 additional hours"],
          ["Difficulty", "Moderate"],
          ["Availability", "High season only"],
        ],
        ideal: [
          [
            "Hikers",
            "A historic route with progressive views of the sanctuary.",
          ],
          [
            "Inca Trail enthusiasts",
            "Connects with the original ceremonial entrance.",
          ],
          [
            "Landscape photography",
            "Different perspectives from the upper sector.",
          ],
        ],
      },
      {
        id: "ruta-1d",
        circuitId: "circuito1",
        modalId: "mapModal1D",
        tone: "gold",
        title: "Route 1-D: Inka Bridge",
        seasonal: "High season only · April-October",
        intro:
          "Route to the ancient Inka Bridge, with a narrow trail near cliffs. It is attractive for explorers but requires caution, especially with rain or fog.",
        details: [
          ["Duration", "3-4 hours"],
          ["Hike", "1-1.5 additional hours"],
          ["Difficulty", "Moderate"],
          ["Note", "Avoid during heavy rain or if you have vertigo"],
        ],
        ideal: [
          ["Explorers", "A less conventional route inside the sanctuary."],
          [
            "Inca history",
            "Shows defensive and territorial control solutions.",
          ],
          ["Careful travelers", "Requires attention on narrow sections."],
        ],
      },
      {
        id: "ruta-2a",
        circuitId: "circuito2",
        modalId: "mapModal2A",
        tone: "c2",
        title: "Route 2-A: Complete Classic Circuit",
        intro:
          "The most extensive and detailed route. It combines agricultural, urban and religious areas, offering the most complete archaeological experience for a first visit.",
        details: [
          ["Duration", "2.5-3.5 hours"],
          ["Difficulty", "Moderate"],
          ["Includes", "Classic photo, plazas, temples and main urban sectors"],
          ["Recommended for", "First visit to Machu Picchu"],
        ],
        ideal: [
          [
            "First trip",
            "The most balanced option for discovering the citadel.",
          ],
          [
            "Culture-focused travelers",
            "Allows a complete archaeological reading.",
          ],
          ["Active families", "A complete route with moderate effort."],
        ],
      },
      {
        id: "ruta-2b",
        circuitId: "circuito2",
        modalId: "mapModal2B",
        tone: "c2",
        title: "Route 2-B: Lower Terrace",
        intro:
          "A classic variant that crosses lower agricultural terraces and main ceremonial areas. It is less extensive than 2-A but still offers a broad experience.",
        details: [
          ["Duration", "2-3 hours"],
          ["Difficulty", "Moderate"],
          ["Route", "Urban, agricultural and ceremonial areas"],
          ["Ideal", "History and photography at a more compact pace"],
        ],
        ideal: [
          [
            "First-time visitors",
            "A good alternative if Route 2-A is unavailable.",
          ],
          ["Photography", "Keeps broad views and representative sectors."],
          [
            "Moderate pace",
            "Less extensive without losing historical context.",
          ],
        ],
      },
      {
        id: "ruta-3a",
        circuitId: "circuito3",
        modalId: "mapModal3A",
        tone: "c3",
        title: "Route 3-A: Waynapicchu Mountain",
        intro:
          "The most famous and challenging ascent. Waynapicchu reaches about 2,693 m / 8,835 ft and offers one of the sanctuary's most iconic views. Not recommended for vertigo or limited mobility.",
        details: [
          ["Duration", "4-6 hours"],
          ["Ascent", "1-1.5 hours"],
          ["Difficulty", "High"],
          ["Capacity", "400 visitors per day in morning entry times"],
        ],
        ideal: [
          ["Intense adventure", "A steep and highly demanded ascent."],
          [
            "Travelers without vertigo",
            "There are narrow and exposed sections.",
          ],
          ["Advance bookings", "Tickets usually sell out quickly."],
        ],
      },
      {
        id: "ruta-3b",
        circuitId: "circuito3",
        modalId: "mapModal3B",
        tone: "c3",
        title: "Route 3-B: Designed Royalty",
        intro:
          "Visits ceremonial and residential areas without a mountain ascent. It is a quieter alternative within Circuit 3, focused on architecture and spirituality.",
        details: [
          ["Duration", "2.5-3.5 hours"],
          ["Difficulty", "Moderate"],
          ["Focus", "Architecture, rituality and Inca residence"],
          ["Ideal", "Families and culture-focused travelers"],
        ],
        ideal: [
          ["Inca culture", "Prioritizes ceremonial and residential sectors."],
          ["Families", "Less demanding than the mountain routes."],
          ["Contemplative travelers", "A calmer route through lower sectors."],
        ],
      },
      {
        id: "ruta-3c",
        circuitId: "circuito3",
        modalId: "mapModal3C",
        tone: "gold",
        title: "Route 3-C: Great Cavern",
        seasonal: "High season only · April-October",
        intro:
          "Route to a place of worship linked to the earth and mountains. It is less crowded, with vegetation trails, narrow sections and a more exploratory feel.",
        details: [
          ["Duration", "4-5 hours"],
          ["Hike", "1.5-2 additional hours"],
          ["Difficulty", "Moderate"],
          ["Availability", "High season only"],
        ],
        ideal: [
          ["Adventurers", "Discover lesser-known places in the sanctuary."],
          [
            "Inca spirituality",
            "A worship site related to the earth and mountains.",
          ],
          ["Photographers", "Unique and less repeated images."],
        ],
      },
      {
        id: "ruta-3d",
        circuitId: "circuito3",
        modalId: "mapModal3D",
        tone: "gold",
        title: "Route 3-D: Huchuypicchu",
        seasonal: "High season only · April-October",
        intro:
          "Combines the citadel with the ascent to Huchuypicchu, the small mountain at 2,497 m / 8,192 ft. It is less demanding than Waynapicchu and has limited capacity.",
        details: [
          ["Duration", "3-4 hours"],
          ["Ascent", "1-1.5 hours"],
          ["Difficulty", "Moderate"],
          ["Capacity", "200 visitors per day"],
        ],
        ideal: [
          ["Alternative to Waynapicchu", "A shorter and calmer hike."],
          ["Photographers", "Unique views without such high demand."],
          [
            "Active travelers",
            "A good balance between hiking and archaeological areas.",
          ],
        ],
      },
    ],
    compareRows: [
      [
        "Classic postcard photo",
        "Yes, from upper viewpoint",
        "Yes, the most traditional",
        "Not from the classic angle",
      ],
      ["Temple of the Sun", "No", "Yes", "Yes"],
      ["Intihuatana", "No", "Yes", "No"],
      ["House of the Inca", "No", "No", "Yes"],
      ["Physical effort", "Variable", "Moderate", "Low to high"],
      [
        "Best for",
        "Photos and views",
        "First visit",
        "Lower sectors and mountains",
      ],
    ],
    booking: [
      {
        title: "Book in advance",
        text: "Circuit 2, Waynapicchu and Huchuypicchu often sell out quickly during high season.",
      },
      {
        title: "Choose by experience",
        text: "Your ticket defines which sectors you will visit. Inside the sanctuary, you cannot switch circuits.",
      },
      {
        title: "No re-entry",
        text: "Once you leave your assigned circuit, you cannot enter again.",
      },
    ],
    cta: {
      title: "Not sure which ticket to buy?",
      text: "At Dreamy Tours, we review availability, train schedules, buses, hikes and traveler profile to recommend the right circuit.",
      label: "Request Machu Picchu advice",
    },
  },
  pt: {
    ctaHref: "/pt/planeje-sua-viagem",
    ui: {
      circuit: "Circuito",
      routes: "rotas",
      mapsLabel: "Circuitos de Machu Picchu",
      mapsTitle: "Mapas dos 3 circuitos oficiais",
      mapsDescription: "Clique em qualquer circuito para ver o mapa completo.",
      viewFullMap: "Ver mapa completo",
      viewCircuitMap: "Ver mapa do circuito",
      viewRouteMap: "Ver mapa da rota",
      routesAria: "Rotas do Circuito",
      navLabel: "Navegação por circuitos",
      idealTitle: "Para quem é ideal?",
      compareTitle: "Comparação rápida",
      compareCaption:
        "Principais diferenças entre os circuitos oficiais de Machu Picchu.",
      detailHeader: "Detalhe",
      bookingTitle: "Recomendações de reserva",
      closeMap: "Fechar mapa",
      officialMap: "Mapa oficial",
      map: "Mapa",
      replaceImage: "Substituir por imagem oficial",
      decree:
        "A partir de 1º de junho de 2024, por meio da Resolução Ministerial 528-2023-MC do Ministério da Cultura do Peru, entraram em vigor 3 novos circuitos que agrupam 10 rotas oficiais dentro do Santuário Histórico de Machu Picchu.",
    },
    circuits: [
      {
        id: "circuito1",
        dialogId: "mapCircuito1",
        tone: "c1",
        number: "1",
        name: "Panorâmico",
        summary:
          "Vistas elevadas e conexão com a natureza · 4 rotas disponíveis",
        alt: "Mapa oficial do Circuito 1 Panorâmico de Machu Picchu",
        routes: [
          "1-A Montanha Machupicchu",
          "1-B Terraço Superior",
          "1-C Intipunku",
          "1-D Ponte Inka",
        ],
      },
      {
        id: "circuito2",
        dialogId: "mapCircuito2",
        tone: "c2",
        number: "2",
        name: "Machupicchu Clássico",
        summary:
          "A rota recomendada para primeira visita · 2 rotas disponíveis",
        alt: "Mapa oficial do Circuito 2 Clássico de Machu Picchu",
        routes: ["2-A Circuito Clássico Completo", "2-B Terraço Inferior"],
      },
      {
        id: "circuito3",
        dialogId: "mapCircuito3",
        tone: "c3",
        number: "3",
        name: "Machupicchu Realeza",
        summary:
          "Setores baixos, áreas cerimoniais e montanhas · 4 rotas disponíveis",
        alt: "Mapa oficial do Circuito 3 Realeza de Machu Picchu",
        routes: [
          "3-A Waynapicchu",
          "3-B Realeza Desenhada",
          "3-C Grande Caverna",
          "3-D Huchuypicchu",
        ],
      },
    ],
    routes: [
      {
        id: "ruta-1a",
        circuitId: "circuito1",
        modalId: "mapModal1A",
        tone: "c1",
        title: "Rota 1-A: Montanha Machupicchu",
        intro:
          "Combina a exploração da cidadela inca com uma caminhada até a Montanha Machupicchu (cerca de 3.082 m), oferecendo vistas panorâmicas únicas. Ideal para quem busca aventura e arqueologia em uma só jornada.",
        details: [
          ["Duração", "4-6 horas (cidadela + subida)"],
          [
            "Dificuldade",
            "Moderada-Alta · escadas de pedra com desnível considerável",
          ],
          ["Altitude máxima", "3.082 m no topo da montanha"],
          ["Disponibilidade", "Todo o ano · ingresso adicional obrigatório"],
          [
            "Atrações",
            "Templo do Sol, Praça Principal, Casa do Guardião e vistas altas",
          ],
          [
            "Equipamento recomendado",
            "Calçado de trekking, água, protetor solar e bastões permitidos",
          ],
        ],
        ideal: [
          [
            "Trilheiros e viajantes ativos",
            "Subida exigente com recompensa panorâmica.",
          ],
          ["Fotógrafos", "Vistas amplas do santuário e do Vale do Urubamba."],
          ["Segunda visita", "Boa opção se você já conhece a rota clássica."],
        ],
      },
      {
        id: "ruta-1b",
        circuitId: "circuito1",
        modalId: "mapModal1B",
        tone: "c1",
        title: "Rota 1-B: Terraço Superior",
        intro:
          "É a rota mais curta e acessível do Circuito 1. Permite chegar aos terraços superiores e obter a foto de cartão-postal a partir do setor da Casa do Guardião.",
        details: [
          ["Duração", "2-3 horas"],
          ["Dificuldade", "Baixa"],
          [
            "Destaques",
            "Casa do Guardião, terraços agrícolas e vista clássica",
          ],
          ["Disponibilidade", "Todo o ano"],
        ],
        ideal: [
          ["Famílias", "Menor exigência física e percurso mais direto."],
          [
            "Viajantes com pouco tempo",
            "Prioriza a principal vista panorâmica.",
          ],
          [
            "Fotógrafos",
            "Acesso aos ângulos mais reconhecíveis de Machu Picchu.",
          ],
        ],
      },
      {
        id: "ruta-1c",
        circuitId: "circuito1",
        modalId: "mapModal1C",
        tone: "gold",
        title: "Rota 1-C: Portada Intipunku",
        seasonal: "Somente temporada alta · abril-outubro",
        intro:
          "Caminhada até Intipunku, a Porta do Sol e antigo ingresso da Trilha Inca. Requer condição física moderada por trilhas de pedra e escadas.",
        details: [
          ["Duração", "3-4 horas"],
          ["Caminhada", "1-1,5 horas adicionais"],
          ["Dificuldade", "Moderada"],
          ["Disponibilidade", "Somente temporada alta"],
        ],
        ideal: [
          [
            "Caminhantes",
            "Uma rota histórica com vistas progressivas do santuário.",
          ],
          [
            "Amantes da Trilha Inca",
            "Conecta com a entrada cerimonial original.",
          ],
          [
            "Fotografia de paisagem",
            "Perspectivas diferentes a partir da parte alta.",
          ],
        ],
      },
      {
        id: "ruta-1d",
        circuitId: "circuito1",
        modalId: "mapModal1D",
        tone: "gold",
        title: "Rota 1-D: Ponte Inka",
        seasonal: "Somente temporada alta · abril-outubro",
        intro:
          "Rota até a antiga Ponte Inka, com trilha estreita próxima a penhascos. É atraente para exploradores, mas exige cuidado, especialmente com chuva ou neblina.",
        details: [
          ["Duração", "3-4 horas"],
          ["Caminhada", "1-1,5 horas adicionais"],
          ["Dificuldade", "Moderada"],
          ["Nota", "Evitar com chuva forte ou vertigem"],
        ],
        ideal: [
          ["Exploradores", "Percurso menos convencional dentro do santuário."],
          [
            "História inca",
            "Mostra soluções defensivas e de controle territorial.",
          ],
          ["Viajantes cuidadosos", "Exige atenção em trechos estreitos."],
        ],
      },
      {
        id: "ruta-2a",
        circuitId: "circuito2",
        modalId: "mapModal2A",
        tone: "c2",
        title: "Rota 2-A: Circuito Clássico Completo",
        intro:
          "É a rota mais extensa e detalhada. Integra áreas agrícolas, urbanas e religiosas, oferecendo a experiência arqueológica mais completa para uma primeira visita.",
        details: [
          ["Duração", "2,5-3,5 horas"],
          ["Dificuldade", "Moderada"],
          [
            "Inclui",
            "Foto clássica, praças, templos e principais setores urbanos",
          ],
          ["Recomendado para", "Primeira visita a Machu Picchu"],
        ],
        ideal: [
          [
            "Primeira viagem",
            "A opção mais equilibrada para conhecer a cidadela.",
          ],
          ["Viajantes culturais", "Permite uma leitura arqueológica integral."],
          ["Famílias ativas", "Percurso completo com exigência moderada."],
        ],
      },
      {
        id: "ruta-2b",
        circuitId: "circuito2",
        modalId: "mapModal2B",
        tone: "c2",
        title: "Rota 2-B: Terraço Inferior",
        intro:
          "Variante do clássico que percorre terraços agrícolas inferiores e principais áreas cerimoniais. É menos extensa que a 2-A, mas mantém uma experiência ampla.",
        details: [
          ["Duração", "2-3 horas"],
          ["Dificuldade", "Moderada"],
          ["Percurso", "Áreas urbanas, agrícolas e cerimoniais"],
          ["Ideal", "História e fotografia em ritmo mais compacto"],
        ],
        ideal: [
          [
            "Viajantes de primeira visita",
            "Boa alternativa se a Rota 2-A não estiver disponível.",
          ],
          ["Fotografia", "Mantém vistas amplas e setores representativos."],
          ["Ritmo moderado", "Menos extensa, sem perder contexto histórico."],
        ],
      },
      {
        id: "ruta-3a",
        circuitId: "circuito3",
        modalId: "mapModal3A",
        tone: "c3",
        title: "Rota 3-A: Montanha Waynapicchu",
        intro:
          "A subida mais famosa e desafiadora. Waynapicchu alcança cerca de 2.693 m e oferece uma das vistas mais icônicas do santuário. Não é recomendada para vertigem ou mobilidade limitada.",
        details: [
          ["Duração", "4-6 horas"],
          ["Subida", "1-1,5 horas"],
          ["Dificuldade", "Alta"],
          ["Vagas", "400 visitantes por dia em horários da manhã"],
        ],
        ideal: [
          ["Aventura intensa", "Subida íngreme e muito procurada."],
          ["Viajantes sem vertigem", "Há trechos estreitos e expostos."],
          [
            "Reservas antecipadas",
            "Os ingressos costumam esgotar rapidamente.",
          ],
        ],
      },
      {
        id: "ruta-3b",
        circuitId: "circuito3",
        modalId: "mapModal3B",
        tone: "c3",
        title: "Rota 3-B: Realeza Desenhada",
        intro:
          "Percorre áreas cerimoniais e residenciais sem subida de montanha. É uma alternativa mais tranquila dentro do Circuito 3, com foco em arquitetura e espiritualidade.",
        details: [
          ["Duração", "2,5-3,5 horas"],
          ["Dificuldade", "Moderada"],
          ["Foco", "Arquitetura, ritualidade e residência inca"],
          ["Ideal", "Famílias e viajantes culturais"],
        ],
        ideal: [
          ["Cultura inca", "Prioriza setores cerimoniais e residenciais."],
          ["Famílias", "Menos exigente que as rotas de montanha."],
          [
            "Viajantes contemplativos",
            "Um percurso mais calmo por setores baixos.",
          ],
        ],
      },
      {
        id: "ruta-3c",
        circuitId: "circuito3",
        modalId: "mapModal3C",
        tone: "gold",
        title: "Rota 3-C: Grande Caverna",
        seasonal: "Somente temporada alta · abril-outubro",
        intro:
          "Rota até um local de culto ligado à terra e às montanhas. É menos concorrida, com trilhas de vegetação, trechos estreitos e atmosfera mais exploratória.",
        details: [
          ["Duração", "4-5 horas"],
          ["Caminhada", "1,5-2 horas adicionais"],
          ["Dificuldade", "Moderada"],
          ["Disponibilidade", "Somente temporada alta"],
        ],
        ideal: [
          ["Aventureiros", "Descubra lugares menos conhecidos do santuário."],
          [
            "Espiritualidade inca",
            "Local de culto relacionado à terra e às montanhas.",
          ],
          ["Fotógrafos", "Imagens únicas e menos repetidas."],
        ],
      },
      {
        id: "ruta-3d",
        circuitId: "circuito3",
        modalId: "mapModal3D",
        tone: "gold",
        title: "Rota 3-D: Huchuypicchu",
        seasonal: "Somente temporada alta · abril-outubro",
        intro:
          "Combina a cidadela com a subida a Huchuypicchu, a montanha pequena de 2.497 m. É menos exigente que Waynapicchu e tem vagas limitadas.",
        details: [
          ["Duração", "3-4 horas"],
          ["Subida", "1-1,5 horas"],
          ["Dificuldade", "Moderada"],
          ["Vagas", "200 visitantes por dia"],
        ],
        ideal: [
          ["Alternativa a Waynapicchu", "Caminhada mais breve e tranquila."],
          ["Fotógrafos", "Vistas únicas sem tanta demanda."],
          [
            "Viajantes ativos",
            "Bom equilíbrio entre caminhada e áreas arqueológicas.",
          ],
        ],
      },
    ],
    compareRows: [
      [
        "Foto clássica de cartão-postal",
        "Sim, desde vista alta",
        "Sim, a mais tradicional",
        "Não desde o ângulo clássico",
      ],
      ["Templo do Sol", "Não", "Sim", "Sim"],
      ["Intihuatana", "Não", "Sim", "Não"],
      ["Casa do Inca", "Não", "Não", "Sim"],
      ["Esforço físico", "Variável", "Moderado", "Baixo a alto"],
      [
        "Melhor para",
        "Fotos e vistas",
        "Primeira visita",
        "Setores baixos e montanhas",
      ],
    ],
    booking: [
      {
        title: "Reserve com antecedência",
        text: "Circuito 2, Waynapicchu e Huchuypicchu costumam esgotar rapidamente na temporada alta.",
      },
      {
        title: "Escolha pela experiência",
        text: "O ingresso define quais setores você verá. Dentro do santuário, não será possível mudar de circuito.",
      },
      {
        title: "Não há reentrada",
        text: "Depois de sair do circuito designado, você não poderá entrar novamente.",
      },
    ],
    cta: {
      title: "Não sabe qual ingresso comprar?",
      text: "Na Dreamy Tours revisamos disponibilidade, horários de trem, ônibus, caminhadas e perfil do viajante para recomendar o circuito correto.",
      label: "Pedir assessoria para Machu Picchu",
    },
  },
} as const;

export type MachupicchuCircuitsLang = keyof typeof machupicchuCircuitsContent;
