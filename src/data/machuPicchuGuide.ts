// Shared by the overview and the ten route guides. Keep editorial advice apart
// from official limits; link every published limit to its original map.
export const guideSources = {
	checkedOn: "2026-10-19",
	circuits: "https://www.machupicchu.gob.pe/circuitos-y-rutas-de-visita/",
	hours: "https://www.machupicchu.gob.pe/horarios-de-visita/",
	tickets: "https://tuboleto.cultura.pe/llaqta_machupicchu",
};

export const circuitGuides = [
	{
		id: "circuito1",
		number: 1,
		name: "Panorámico",
		theme: "panoramic",
		tagline: "Machu Picchu desde las alturas",
		intro:
			"Contempla la ciudad inka desde las terrazas superiores. Puedes elegir una visita centrada en las vistas o una ruta con caminata hacia la montaña Machupicchu, Intipunku o el Puente Inka.",
		ideal: "Vistas panorámicas, fotografía y caminatas según la ruta elegida.",
		limit: "No incluye el recorrido por el sector urbano de la ciudad inka.",
		map: "/imagenes/circuitos/mapa-del-circuito-uno-machupicchu.webp",
	},
	{
		id: "circuito2",
		number: 2,
		name: "Machupicchu Clásico",
		theme: "classic",
		tagline: "Vistas y arquitectura inka en una visita",
		intro:
			"Combina una perspectiva panorámica con el recorrido por sectores arqueológicos de la ciudad inka. Sus dos variantes permiten conocer Machu Picchu desde dentro, siguiendo un itinerario definido.",
		ideal: "Una primera visita que combine paisaje e historia.",
		limit: "No incluye el ascenso a Waynapicchu ni a la montaña Machupicchu.",
		map: "/imagenes/circuitos/mapa-circuito-dos-machupicchu.webp",
	},
	{
		id: "circuito3",
		number: 3,
		name: "Machupicchu Realeza",
		theme: "royal",
		tagline: "La ciudad baja y sus caminos de montaña",
		intro:
			"Explora el sector bajo de Machu Picchu. Elige la ruta diseñada para centrarte en la arquitectura, o una variante hacia Waynapicchu, la Gran Caverna o Huchuypicchu.",
		ideal: "Arquitectura del sector bajo y aventura según la ruta elegida.",
		limit: "No incluye las terrazas superiores del circuito Panorámico.",
		map: "/imagenes/circuitos/mapa-circuito-tres-machupicchu.webp",
	},
] as const;

export interface CircuitRouteGuide {
	slug: string;
	code: string;
	circuit: 1 | 2 | 3;
	name: string;
	summary: string;
	seasonal: boolean;
	maxStay: string;
	mapDocument: string;
	effort: string;
	paragraphs: string[];
	includes: string[];
	excludes: string[];
	advice: string;
}

export const circuitRouteGuides: CircuitRouteGuide[] = [
	{
		slug: "ruta-1-a",
		code: "1-A",
		circuit: 1,
		name: "Montaña Machupicchu",
		summary: "Terrazas panorámicas y ascenso a la montaña Machupicchu.",
		seasonal: false,
		maxStay: "7 horas",
		mapDocument: "2024/05/C1-R1AP.pdf",
		effort: "Exigente: ascenso prolongado y numerosos escalones.",
		paragraphs: [
			"Esta ruta combina el sector panorámico del circuito 1 con el camino a la montaña Machupicchu. Es una experiencia centrada en el paisaje y en el ascenso; no incorpora un paseo por las calles y plazas del sector urbano.",
			"La montaña Machupicchu y Waynapicchu son dos montañas distintas y se visitan con rutas diferentes. Si tu objetivo es Waynapicchu, revisa la ruta 3-A antes de elegir el boleto.",
		],
		includes: [
			"Terrazas del sector panorámico indicadas en el mapa.",
			"Sendero de subida y bajada a la montaña Machupicchu.",
			"Vistas del conjunto arqueológico y del paisaje circundante.",
		],
		excludes: [
			"Recorrido urbano de los circuitos 2 y 3.",
			"Waynapicchu, Intipunku y Puente Inka.",
		],
		advice:
			"Elige esta ruta si el ascenso es una prioridad para ti. Considera tu ritmo en escaleras y deja margen para el regreso antes de coordinar tu transporte.",
	},
	{
		slug: "ruta-1-b",
		code: "1-B",
		circuit: 1,
		name: "Terraza Superior",
		summary:
			"La vista panorámica desde las terrazas, sin ascenso a una montaña.",
		seasonal: false,
		maxStay: "2 horas y 30 minutos",
		mapDocument: "2024/05/C1-R1B.pdf",
		effort:
			"Menor que las rutas de montaña, con escaleras de acceso a las terrazas.",
		paragraphs: [
			"La ruta 1-B se concentra en las terrazas superiores y en la vista amplia de la ciudad inka. Es una opción para dedicar la visita a contemplar el conjunto y tomar fotografías desde el sector panorámico.",
			"El recorrido no baja al sector urbano ni incluye una montaña. Aunque prescinde de un ascenso largo, el acceso a las terrazas tiene desniveles y escaleras; no equivale a un recorrido llano.",
		],
		includes: [
			"Acceso al sector de terrazas superiores marcado en el mapa.",
			"Perspectiva panorámica de Machu Picchu.",
			"Espacios de observación y explicación del circuito 1.",
		],
		excludes: [
			"Calles, plazas y recintos del sector urbano.",
			"Montaña Machupicchu, Waynapicchu, Intipunku y Puente Inka.",
		],
		advice:
			"Si además de la vista quieres caminar por sectores arqueológicos de la ciudad, compara las rutas 2-A y 2-B antes de reservar.",
	},
	{
		slug: "ruta-1-c",
		code: "1-C",
		circuit: 1,
		name: "Portada Intipunku",
		summary: "Una caminata desde el sector panorámico hacia la Puerta del Sol.",
		seasonal: true,
		maxStay: "4 horas",
		mapDocument: "2024/05/C1-R1CP.pdf",
		effort: "Caminata con desnivel y tramos de escaleras.",
		paragraphs: [
			"Esta variante del circuito Panorámico sigue el camino hacia Intipunku, conocido como la Puerta del Sol. El interés está en el trayecto, su relación con el acceso del Camino Inka y las perspectivas del paisaje.",
			"Visitar Intipunku mediante la ruta 1-C no equivale a contratar el Camino Inka. El boleto corresponde al itinerario señalado en el mapa de esta ruta y no incluye el recorrido urbano de Machu Picchu.",
		],
		includes: [
			"Sector panorámico del circuito 1.",
			"Caminata de ida y vuelta hacia la Portada Intipunku.",
		],
		excludes: [
			"Recorrido por el sector urbano.",
			"Trekking del Camino Inka y ascensos a las montañas.",
		],
		advice:
			"Es una ruta de temporada. Confirma que esté habilitada para tu fecha de viaje antes de organizar el resto del itinerario.",
	},
	{
		slug: "ruta-1-d",
		code: "1-D",
		circuit: 1,
		name: "Puente Inka",
		summary: "Terrazas panorámicas y sendero hacia el antiguo Puente Inka.",
		seasonal: true,
		maxStay: "3 horas",
		mapDocument: "2024/05/C1-R1DP.pdf",
		effort: "Sendero con desnivel y sectores estrechos junto a la ladera.",
		paragraphs: [
			"La ruta 1-D combina la perspectiva de las terrazas del circuito 1 con el sendero hacia el Puente Inka. Permite observar otra conexión del conjunto arqueológico con las laderas que lo rodean.",
			"La visita sigue el trayecto autorizado hacia el puente; no debe interpretarse como permiso para cruzar la estructura. Tampoco incluye el recorrido por los recintos del sector urbano.",
		],
		includes: [
			"Sector panorámico de Machu Picchu.",
			"Sendero autorizado hacia el Puente Inka.",
		],
		excludes: [
			"Recorrido urbano y cruce del puente.",
			"Intipunku y ascensos a las montañas.",
		],
		advice:
			"Considera los tramos estrechos al elegirla. Consulta su habilitación para tu fecha: el Ministerio la clasifica como ruta de temporada alta.",
	},
	{
		slug: "ruta-2-a",
		code: "2-A",
		circuit: 2,
		name: "Ruta diseñada",
		summary: "Vista del conjunto y recorrido por sectores de la ciudad inka.",
		seasonal: false,
		maxStay: "2 horas y 30 minutos",
		mapDocument: "2024/06/C2-R2A.pdf",
		effort: "Recorrido arqueológico con escaleras, subidas y bajadas.",
		paragraphs: [
			"La ruta diseñada del circuito 2 combina la observación del conjunto con el paso por sectores arqueológicos de Machu Picchu. Es una alternativa equilibrada si en tu primera visita quieres apreciar el paisaje y conocer parte de la ciudad por dentro.",
			"El trazado del mapa pasa por zonas como el mirador del Templo del Sol, la Plaza de los Templos y la Roca Sagrada. Ver un recinto desde el recorrido no significa que se pueda entrar en él: sigue siempre los accesos señalizados.",
		],
		includes: [
			"Perspectiva panorámica desde el trazado de la ruta 2-A.",
			"Sectores arqueológicos, plazas y senderos indicados en el mapa.",
			"Paso por la zona de la Roca Sagrada y los sectores orientales del recorrido.",
		],
		excludes: [
			"Montaña Machupicchu y Waynapicchu.",
			"Intipunku, Puente Inka, Gran Caverna y Huchuypicchu.",
		],
		advice:
			"Compara el trazado con el de la ruta 2-B: ambas pertenecen al circuito Clásico. La 2-A no es una entrada con acceso libre a todos los recintos.",
	},
	{
		slug: "ruta-2-b",
		code: "2-B",
		circuit: 2,
		name: "Terraza Inferior",
		summary: "La variante del Clásico que incorpora la terraza inferior.",
		seasonal: false,
		maxStay: "2 horas y 30 minutos",
		mapDocument: "2024/06/6-C2-R2B.pdf",
		effort: "Recorrido arqueológico con desniveles y escalones de piedra.",
		paragraphs: [
			"La ruta 2-B incorpora la terraza inferior dentro del circuito Machupicchu Clásico y continúa por sectores de la ciudad inka. Combina la vista del conjunto con una visita arqueológica siguiendo el trazado autorizado.",
			"La terraza inferior no es el sector bajo del circuito 3. Esta ruta sigue perteneciendo al circuito 2 y tiene su propio punto de observación y recorrido. Compárala con la 2-A por su trazado, sin asumir que una permite visitar toda la ciudad.",
		],
		includes: [
			"Terraza inferior señalada en la ruta 2-B.",
			"Vista panorámica desde ese sector.",
			"Recorrido por sectores arqueológicos del circuito Clásico.",
		],
		excludes: [
			"Ascensos a la montaña Machupicchu o a Waynapicchu.",
			"Rutas de Intipunku, Puente Inka, Gran Caverna y Huchuypicchu.",
		],
		advice:
			"Es otra opción para combinar fotografía e historia en una primera visita. Revisa las diferencias del mapa con la ruta 2-A y los horarios disponibles para tu fecha.",
	},
	{
		slug: "ruta-3-a",
		code: "3-A",
		circuit: 3,
		name: "Montaña Waynapicchu",
		summary: "Sector bajo de la ciudad y ascenso a Waynapicchu.",
		seasonal: false,
		maxStay: "6 horas",
		mapDocument: "2024/05/C3-R3AP.pdf",
		effort: "Exigente: escaleras empinadas y tramos estrechos.",
		paragraphs: [
			"La ruta 3-A combina el recorrido del sector bajo con el ascenso a Waynapicchu, también conocido como Huayna Picchu. La montaña forma parte de esta ruta específica: no se añade automáticamente a cualquier entrada de Machu Picchu.",
			"La perspectiva desde Waynapicchu es distinta de la fotografía desde las terrazas superiores. Esta entrada no incluye el sector panorámico del circuito 1 ni el ascenso a la montaña Machupicchu.",
		],
		includes: [
			"Tramo del sector bajo indicado en el mapa de la ruta 3-A.",
			"Ascenso y descenso por el sendero autorizado a Waynapicchu.",
		],
		excludes: [
			"Terrazas superiores y circuito Clásico.",
			"Montaña Machupicchu y ruta de la Gran Caverna.",
		],
		advice:
			"Valora tu comodidad en escaleras empinadas y tramos expuestos. Comprueba las condiciones de edad y el horario específico de acceso a la montaña al reservar.",
	},
	{
		slug: "ruta-3-b",
		code: "3-B",
		circuit: 3,
		name: "Ruta diseñada",
		summary: "Arquitectura del sector bajo, sin ascenso a una montaña.",
		seasonal: false,
		maxStay: "2 horas y 30 minutos",
		mapDocument: "2024/05/C3-R3B.pdf",
		effort:
			"Sin ascenso de montaña; conserva desniveles y superficies irregulares.",
		paragraphs: [
			"La ruta diseñada del circuito Realeza se centra en la parte baja de la ciudad inka. Permite acercarse a su arquitectura mediante un recorrido sin el ascenso de montaña que caracteriza a otras variantes del circuito 3.",
			"Es importante distinguirla de la 3-A: la ruta 3-B no incluye Waynapicchu. Tampoco llega a las terrazas superiores desde las que se obtiene la perspectiva panorámica del circuito 1.",
		],
		includes: [
			"Recorrido por el sector bajo señalado en el mapa.",
			"Observación de conjuntos arquitectónicos del circuito Realeza.",
		],
		excludes: [
			"Waynapicchu, Huchuypicchu y Gran Caverna.",
			"Terrazas superiores y recorrido del circuito Clásico.",
		],
		advice:
			"Puede interesarte si priorizas la arquitectura y quieres evitar una subida de montaña. Si necesitas un acceso adaptado, consulta las condiciones concretas antes de comprar.",
	},
	{
		slug: "ruta-3-c",
		code: "3-C",
		circuit: 3,
		name: "Gran Caverna",
		summary: "Una caminata hacia la Gran Caverna desde el circuito Realeza.",
		seasonal: true,
		maxStay: "7 horas",
		mapDocument: "2024/05/C3-R3CP.pdf",
		effort: "Exigente: caminata prolongada con descenso y subida de regreso.",
		paragraphs: [
			"Esta ruta incorpora el sendero hacia la Gran Caverna al itinerario del circuito 3. Su interés está en el entorno de la montaña y en el conjunto arqueológico asociado a la caverna.",
			"No es el mismo itinerario que el ascenso a la cima de Waynapicchu. El recorrido exige considerar tanto la bajada como la subida del retorno y reservar margen para completar la visita dentro del tiempo autorizado.",
		],
		includes: [
			"Sector bajo y sendero de la ruta 3-C indicados en el mapa.",
			"Visita al conjunto de la Gran Caverna.",
		],
		excludes: [
			"Ascenso a la cima de Waynapicchu.",
			"Terrazas superiores, montaña Machupicchu y circuito Clásico.",
		],
		advice:
			"Confirma que la ruta esté operativa para tu fecha. Su clasificación de temporada alta no garantiza apertura diaria: puede haber disposiciones de conservación o mantenimiento.",
	},
	{
		slug: "ruta-3-d",
		code: "3-D",
		circuit: 3,
		name: "Huchuypicchu",
		summary: "Sector bajo y ascenso a la montaña Huchuypicchu.",
		seasonal: true,
		maxStay: "3 horas y 30 minutos",
		mapDocument: "2024/05/C3-R3DP.pdf",
		effort: "Ascenso con escaleras; más breve que el de Waynapicchu.",
		paragraphs: [
			"La ruta 3-D combina el sector bajo de Machu Picchu con la subida a Huchuypicchu. Esta montaña tiene un itinerario propio y no debe confundirse con Waynapicchu, cuyo acceso corresponde a la ruta 3-A.",
			"Aunque la subida es más breve que la de Waynapicchu, sigue siendo una caminata con desnivel y escalones. La vista desde Huchuypicchu tampoco sustituye la perspectiva de las terrazas superiores del circuito 1.",
		],
		includes: [
			"Tramo del circuito Realeza marcado en la ruta 3-D.",
			"Ascenso y descenso por el sendero de Huchuypicchu.",
		],
		excludes: [
			"Ascenso a Waynapicchu y visita a la Gran Caverna.",
			"Terrazas superiores y montaña Machupicchu.",
		],
		advice:
			"Revisa su habilitación estacional y las condiciones de edad en la venta oficial antes de reservar. No asumas que admite las mismas condiciones que la ruta 3-B.",
	},
];

export const routeGuideHref = (route: Pick<CircuitRouteGuide, "slug">) =>
	`/es/circuitos-machupicchu/${route.slug}/`;
export const routeMapImage = (route: Pick<CircuitRouteGuide, "slug">) =>
	`/imagenes/circuitos/${route.slug}.webp`;
export const routeMapSource = (route: Pick<CircuitRouteGuide, "mapDocument">) =>
	`https://www.machupicchu.gob.pe/wp-content/uploads/${route.mapDocument}`;
