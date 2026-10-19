import type { Lang } from "@/lib/i18n";
import type { circuitRouteGuides } from "./machuPicchuGuide";

type RouteCopy = Pick<
	(typeof circuitRouteGuides)[number],
	| "name"
	| "summary"
	| "maxStay"
	| "effort"
	| "paragraphs"
	| "includes"
	| "excludes"
	| "advice"
>;
type CircuitCopy = Record<
	"name" | "tagline" | "intro" | "ideal" | "limit",
	string
>;

export const translatedCircuits: Record<"en" | "pt", CircuitCopy[]> = {
	en: [
		{
			name: "Panoramic",
			tagline: "Machu Picchu from above",
			intro:
				"View the Inka city from the upper terraces. Choose a visit focused on the views or a route with a hike to Machupicchu Mountain, Intipunku or the Inka Bridge.",
			ideal: "Panoramic views, photography and hiking, depending on the route.",
			limit:
				"Does not include a walk through the urban sector of the Inka city.",
		},
		{
			name: "Classic Machupicchu",
			tagline: "Views and Inka architecture in one visit",
			intro:
				"Combine a panoramic perspective with a walk through archaeological sectors of the Inka city. Its two variants let you explore Machu Picchu from within, following a defined itinerary.",
			ideal: "A first visit combining scenery and history.",
			limit:
				"Does not include the climb to Waynapicchu or Machupicchu Mountain.",
		},
		{
			name: "Machupicchu Royalty",
			tagline: "The lower city and its mountain trails",
			intro:
				"Explore the lower sector of Machu Picchu. Choose the designed route to focus on architecture, or a variant to Waynapicchu, the Great Cavern or Huchuypicchu.",
			ideal:
				"Architecture in the lower sector and adventure, depending on the route.",
			limit: "Does not include the upper terraces of the Panoramic circuit.",
		},
	],
	pt: [
		{
			name: "Panorâmico",
			tagline: "Machu Picchu visto do alto",
			intro:
				"Contemple a cidade inka a partir dos terraços superiores. Escolha uma visita voltada às vistas ou uma rota com caminhada até a montanha Machupicchu, Intipunku ou a Ponte Inka.",
			ideal:
				"Vistas panorâmicas, fotografia e caminhadas conforme a rota escolhida.",
			limit: "Não inclui o percurso pelo setor urbano da cidade inka.",
		},
		{
			name: "Machupicchu Clássico",
			tagline: "Vistas e arquitetura inka em uma visita",
			intro:
				"Combine uma perspectiva panorâmica com o percurso por setores arqueológicos da cidade inka. Suas duas variantes permitem conhecer Machu Picchu por dentro, seguindo um itinerário definido.",
			ideal: "Uma primeira visita que combine paisagem e história.",
			limit: "Não inclui a subida a Waynapicchu nem à montanha Machupicchu.",
		},
		{
			name: "Machupicchu Realeza",
			tagline: "A cidade baixa e suas trilhas de montanha",
			intro:
				"Explore o setor baixo de Machu Picchu. Escolha a rota desenhada para focar na arquitetura ou uma variante até Waynapicchu, a Grande Caverna ou Huchuypicchu.",
			ideal: "Arquitetura do setor baixo e aventura conforme a rota escolhida.",
			limit: "Não inclui os terraços superiores do circuito Panorâmico.",
		},
	],
};

export const translatedRoutes: Record<"en" | "pt", RouteCopy[]> = {
	en: [
		{
			name: "Machupicchu Mountain",
			summary: "Panoramic terraces and the climb to Machupicchu Mountain.",
			maxStay: "7 hours",
			effort: "Demanding: a sustained climb with many steps.",
			paragraphs: [
				"This route combines the panoramic sector of circuit 1 with the trail to Machupicchu Mountain. It focuses on scenery and the climb; it does not include a walk through the streets and squares of the urban sector.",
				"Machupicchu Mountain and Waynapicchu are different mountains visited on different routes. If your goal is Waynapicchu, check route 3-A before choosing your ticket.",
			],
			includes: [
				"Terraces in the panoramic sector shown on the map.",
				"The ascent and descent trail to Machupicchu Mountain.",
				"Views of the archaeological site and surrounding landscape.",
			],
			excludes: [
				"The urban walk of circuits 2 and 3.",
				"Waynapicchu, Intipunku and the Inka Bridge.",
			],
			advice:
				"Choose this route if the climb is a priority. Consider your pace on steps and allow time for the return before arranging your transport.",
		},
		{
			name: "Upper Terrace",
			summary: "Panoramic views from the terraces, without a mountain climb.",
			maxStay: "2 hours and 30 minutes",
			effort:
				"Less demanding than the mountain routes, with steps up to the terraces.",
			paragraphs: [
				"Route 1-B focuses on the upper terraces and the broad view of the Inka city. It is an option for spending your visit observing the site and taking photographs from the panoramic sector.",
				"The route does not descend into the urban sector or include a mountain. Although there is no long climb, reaching the terraces involves changes in elevation and steps; this is not a level walk.",
			],
			includes: [
				"Access to the upper terrace sector marked on the map.",
				"A panoramic perspective of Machu Picchu.",
				"Observation and explanation areas of circuit 1.",
			],
			excludes: [
				"Streets, squares and buildings in the urban sector.",
				"Machupicchu Mountain, Waynapicchu, Intipunku and the Inka Bridge.",
			],
			advice:
				"If you want to walk through archaeological sectors as well as enjoy the view, compare routes 2-A and 2-B before booking.",
		},
		{
			name: "Intipunku Gateway",
			summary: "A hike from the panoramic sector to the Sun Gate.",
			maxStay: "4 hours",
			effort: "A walk with elevation changes and sections of steps.",
			paragraphs: [
				"This variant of the Panoramic circuit follows the trail to Intipunku, known as the Sun Gate. Its appeal lies in the walk, its connection to the Inka Trail entrance and the landscape views.",
				"Visiting Intipunku on route 1-C is not the same as booking the Inka Trail. The ticket covers the itinerary shown on this route's map and does not include the urban walk through Machu Picchu.",
			],
			includes: [
				"The panoramic sector of circuit 1.",
				"The return hike to the Intipunku Gateway.",
			],
			excludes: [
				"A walk through the urban sector.",
				"The Inka Trail trek and mountain climbs.",
			],
			advice:
				"This is a seasonal route. Confirm that it is open on your travel date before arranging the rest of your itinerary.",
		},
		{
			name: "Inka Bridge",
			summary: "Panoramic terraces and the trail towards the old Inka Bridge.",
			maxStay: "3 hours",
			effort:
				"A trail with elevation changes and narrow sections along the hillside.",
			paragraphs: [
				"Route 1-D combines the perspective from the terraces of circuit 1 with the trail towards the Inka Bridge. It shows another connection between the archaeological site and the surrounding slopes.",
				"The visit follows the authorised trail towards the bridge; it should not be taken as permission to cross the structure. It also does not include a walk through buildings in the urban sector.",
			],
			includes: [
				"The panoramic sector of Machu Picchu.",
				"The authorised trail towards the Inka Bridge.",
			],
			excludes: [
				"The urban walk and crossing the bridge.",
				"Intipunku and mountain climbs.",
			],
			advice:
				"Consider the narrow sections when choosing this route. Check whether it is open on your date: the Ministry classifies it as a high-season route.",
		},
		{
			name: "Designed Route",
			summary: "Views of the site and a walk through sectors of the Inka city.",
			maxStay: "2 hours and 30 minutes",
			effort:
				"An archaeological walk with steps, uphill and downhill sections.",
			paragraphs: [
				"The designed route of circuit 2 combines views of the site with a walk through archaeological sectors of Machu Picchu. It is a balanced option for a first visit if you want scenery and a closer look inside part of the city.",
				"The mapped trail passes areas such as the Temple of the Sun viewpoint, the Temple Square and the Sacred Rock. Seeing a building from the route does not mean you may enter it: always follow the marked access points.",
			],
			includes: [
				"A panoramic perspective from the route 2-A trail.",
				"Archaeological sectors, squares and paths shown on the map.",
				"Passage through the Sacred Rock area and the eastern sectors of the route.",
			],
			excludes: [
				"Machupicchu Mountain and Waynapicchu.",
				"Intipunku, the Inka Bridge, the Great Cavern and Huchuypicchu.",
			],
			advice:
				"Compare the trail with route 2-B: both belong to the Classic circuit. Route 2-A is not a ticket with unrestricted access to every building.",
		},
		{
			name: "Lower Terrace",
			summary: "The Classic circuit variant that includes the lower terrace.",
			maxStay: "2 hours and 30 minutes",
			effort:
				"An archaeological walk with changes in elevation and stone steps.",
			paragraphs: [
				"Route 2-B includes the lower terrace within the Classic Machupicchu circuit and continues through sectors of the Inka city. It combines a view of the site with an archaeological visit along the authorised trail.",
				"The lower terrace is not the lower sector of circuit 3. This route still belongs to circuit 2 and has its own viewpoint and itinerary. Compare its trail with route 2-A without assuming either offers access to the entire city.",
			],
			includes: [
				"The lower terrace shown on route 2-B.",
				"A panoramic view from that sector.",
				"A walk through archaeological sectors of the Classic circuit.",
			],
			excludes: [
				"Climbs to Machupicchu Mountain or Waynapicchu.",
				"The Intipunku, Inka Bridge, Great Cavern and Huchuypicchu routes.",
			],
			advice:
				"This is another option for combining photography and history on a first visit. Check the map differences with route 2-A and the available entry times for your date.",
		},
		{
			name: "Waynapicchu Mountain",
			summary: "The lower city sector and the climb to Waynapicchu.",
			maxStay: "6 hours",
			effort: "Demanding: steep steps and narrow sections.",
			paragraphs: [
				"Route 3-A combines the lower-sector walk with the climb to Waynapicchu, also known as Huayna Picchu. The mountain belongs to this specific route: it is not automatically included in every Machu Picchu ticket.",
				"The perspective from Waynapicchu differs from the photograph taken on the upper terraces. This ticket does not include the panoramic sector of circuit 1 or the climb to Machupicchu Mountain.",
			],
			includes: [
				"The lower-sector section shown on the route 3-A map.",
				"Ascent and descent along the authorised Waynapicchu trail.",
			],
			excludes: [
				"The upper terraces and Classic circuit.",
				"Machupicchu Mountain and the Great Cavern route.",
			],
			advice:
				"Consider how comfortable you are on steep steps and exposed sections. Check the age conditions and specific mountain access time when booking.",
		},
		{
			name: "Designed Route",
			summary: "Architecture in the lower sector, without a mountain climb.",
			maxStay: "2 hours and 30 minutes",
			effort:
				"No mountain climb; there are still elevation changes and uneven surfaces.",
			paragraphs: [
				"The designed route of the Royalty circuit focuses on the lower part of the Inka city. It brings you closer to its architecture without the mountain climb featured in other circuit 3 variants.",
				"It is important to distinguish it from route 3-A: route 3-B does not include Waynapicchu. It also does not reach the upper terraces offering the panoramic perspective of circuit 1.",
			],
			includes: [
				"The lower-sector walk shown on the map.",
				"Views of architectural groups in the Royalty circuit.",
			],
			excludes: [
				"Waynapicchu, Huchuypicchu and the Great Cavern.",
				"The upper terraces and Classic circuit walk.",
			],
			advice:
				"This may suit you if architecture is your priority and you want to avoid a mountain climb. If you need adapted access, check the specific conditions before buying.",
		},
		{
			name: "Great Cavern",
			summary: "A hike to the Great Cavern from the Royalty circuit.",
			maxStay: "7 hours",
			effort: "Demanding: a long walk with a descent and an uphill return.",
			paragraphs: [
				"This route adds the trail to the Great Cavern to the circuit 3 itinerary. Its interest lies in the mountain surroundings and the archaeological complex associated with the cavern.",
				"This is not the same itinerary as the climb to the summit of Waynapicchu. Allow for both the descent and the uphill return, with enough time to complete the visit within the authorised limit.",
			],
			includes: [
				"The lower sector and route 3-C trail shown on the map.",
				"A visit to the Great Cavern complex.",
			],
			excludes: [
				"The climb to the summit of Waynapicchu.",
				"The upper terraces, Machupicchu Mountain and Classic circuit.",
			],
			advice:
				"Confirm that the route is operating on your date. Its high-season classification does not guarantee daily opening: conservation or maintenance measures may apply.",
		},
		{
			name: "Huchuypicchu",
			summary: "The lower sector and the climb to Huchuypicchu Mountain.",
			maxStay: "3 hours and 30 minutes",
			effort: "A climb with steps, shorter than Waynapicchu.",
			paragraphs: [
				"Route 3-D combines the lower sector of Machu Picchu with the ascent to Huchuypicchu. This mountain has its own itinerary and should not be confused with Waynapicchu, accessed on route 3-A.",
				"Although shorter than Waynapicchu, the climb still involves elevation changes and steps. The view from Huchuypicchu also does not replace the perspective from the upper terraces of circuit 1.",
			],
			includes: [
				"The Royalty circuit section marked on route 3-D.",
				"Ascent and descent along the Huchuypicchu trail.",
			],
			excludes: [
				"The Waynapicchu climb and Great Cavern visit.",
				"The upper terraces and Machupicchu Mountain.",
			],
			advice:
				"Check seasonal opening and age conditions on the official ticket platform before booking. Do not assume it has the same conditions as route 3-B.",
		},
	],
	pt: [
		{
			name: "Montanha Machupicchu",
			summary: "Terraços panorâmicos e subida à montanha Machupicchu.",
			maxStay: "7 horas",
			effort: "Exigente: subida prolongada e muitos degraus.",
			paragraphs: [
				"Esta rota combina o setor panorâmico do circuito 1 com a trilha até a montanha Machupicchu. A experiência é voltada à paisagem e à subida; não inclui um passeio pelas ruas e praças do setor urbano.",
				"A montanha Machupicchu e Waynapicchu são montanhas diferentes, visitadas por rotas distintas. Se seu objetivo é Waynapicchu, confira a rota 3-A antes de escolher o ingresso.",
			],
			includes: [
				"Terraços do setor panorâmico indicados no mapa.",
				"Trilha de subida e descida da montanha Machupicchu.",
				"Vistas do conjunto arqueológico e da paisagem ao redor.",
			],
			excludes: [
				"Percurso urbano dos circuitos 2 e 3.",
				"Waynapicchu, Intipunku e Ponte Inka.",
			],
			advice:
				"Escolha esta rota se a subida for uma prioridade. Considere seu ritmo nas escadas e reserve tempo para o retorno antes de organizar o transporte.",
		},
		{
			name: "Terraço Superior",
			summary: "Vista panorâmica dos terraços, sem subida a uma montanha.",
			maxStay: "2 horas e 30 minutos",
			effort:
				"Menor que nas rotas de montanha, com escadas de acesso aos terraços.",
			paragraphs: [
				"A rota 1-B se concentra nos terraços superiores e na vista ampla da cidade inka. É uma opção para dedicar a visita à contemplação do conjunto e às fotografias a partir do setor panorâmico.",
				"O percurso não desce ao setor urbano nem inclui uma montanha. Embora dispense uma subida longa, o acesso aos terraços tem desníveis e escadas; não é um passeio plano.",
			],
			includes: [
				"Acesso ao setor dos terraços superiores marcado no mapa.",
				"Perspectiva panorâmica de Machu Picchu.",
				"Áreas de observação e explicação do circuito 1.",
			],
			excludes: [
				"Ruas, praças e construções do setor urbano.",
				"Montanha Machupicchu, Waynapicchu, Intipunku e Ponte Inka.",
			],
			advice:
				"Se além da vista você quer caminhar pelos setores arqueológicos da cidade, compare as rotas 2-A e 2-B antes de reservar.",
		},
		{
			name: "Portal Intipunku",
			summary: "Uma caminhada do setor panorâmico até a Porta do Sol.",
			maxStay: "4 horas",
			effort: "Caminhada com desníveis e trechos de escadas.",
			paragraphs: [
				"Esta variante do circuito Panorâmico segue o caminho até Intipunku, conhecido como a Porta do Sol. O interesse está no trajeto, na ligação com a entrada da Trilha Inka e nas perspectivas da paisagem.",
				"Visitar Intipunku pela rota 1-C não equivale a contratar a Trilha Inka. O ingresso corresponde ao itinerário indicado no mapa desta rota e não inclui o percurso urbano de Machu Picchu.",
			],
			includes: [
				"Setor panorâmico do circuito 1.",
				"Caminhada de ida e volta até o Portal Intipunku.",
			],
			excludes: [
				"Percurso pelo setor urbano.",
				"Trekking da Trilha Inka e subidas às montanhas.",
			],
			advice:
				"É uma rota sazonal. Confirme a abertura para sua data de viagem antes de organizar o restante do itinerário.",
		},
		{
			name: "Ponte Inka",
			summary: "Terraços panorâmicos e trilha até a antiga Ponte Inka.",
			maxStay: "3 horas",
			effort: "Trilha com desníveis e trechos estreitos junto à encosta.",
			paragraphs: [
				"A rota 1-D combina a perspectiva dos terraços do circuito 1 com a trilha até a Ponte Inka. Permite observar outra ligação do conjunto arqueológico com as encostas ao redor.",
				"A visita segue o caminho autorizado até a ponte; não deve ser entendida como permissão para atravessar a estrutura. Também não inclui o percurso pelas construções do setor urbano.",
			],
			includes: [
				"Setor panorâmico de Machu Picchu.",
				"Trilha autorizada até a Ponte Inka.",
			],
			excludes: [
				"Percurso urbano e travessia da ponte.",
				"Intipunku e subidas às montanhas.",
			],
			advice:
				"Considere os trechos estreitos ao escolher esta rota. Confira a abertura para sua data: o Ministério a classifica como rota de alta temporada.",
		},
		{
			name: "Rota desenhada",
			summary: "Vista do conjunto e percurso por setores da cidade inka.",
			maxStay: "2 horas e 30 minutos",
			effort: "Percurso arqueológico com escadas, subidas e descidas.",
			paragraphs: [
				"A rota desenhada do circuito 2 combina a observação do conjunto com a passagem por setores arqueológicos de Machu Picchu. É uma opção equilibrada para uma primeira visita com paisagem e conhecimento de parte da cidade por dentro.",
				"O traçado do mapa passa por áreas como o mirante do Templo do Sol, a Praça dos Templos e a Rocha Sagrada. Ver uma construção a partir do percurso não significa poder entrar nela: siga sempre os acessos sinalizados.",
			],
			includes: [
				"Perspectiva panorâmica a partir do traçado da rota 2-A.",
				"Setores arqueológicos, praças e caminhos indicados no mapa.",
				"Passagem pela área da Rocha Sagrada e pelos setores orientais do percurso.",
			],
			excludes: [
				"Montanha Machupicchu e Waynapicchu.",
				"Intipunku, Ponte Inka, Grande Caverna e Huchuypicchu.",
			],
			advice:
				"Compare o traçado com o da rota 2-B: ambas pertencem ao circuito Clássico. A 2-A não é um ingresso com acesso livre a todas as construções.",
		},
		{
			name: "Terraço Inferior",
			summary: "A variante do Clássico que inclui o terraço inferior.",
			maxStay: "2 horas e 30 minutos",
			effort: "Percurso arqueológico com desníveis e degraus de pedra.",
			paragraphs: [
				"A rota 2-B inclui o terraço inferior no circuito Machupicchu Clássico e continua por setores da cidade inka. Combina a vista do conjunto com uma visita arqueológica seguindo o traçado autorizado.",
				"O terraço inferior não é o setor baixo do circuito 3. Esta rota continua no circuito 2 e tem seu próprio ponto de observação e percurso. Compare seu traçado com a 2-A sem presumir que alguma delas permita visitar toda a cidade.",
			],
			includes: [
				"Terraço inferior indicado na rota 2-B.",
				"Vista panorâmica a partir desse setor.",
				"Percurso por setores arqueológicos do circuito Clássico.",
			],
			excludes: [
				"Subidas à montanha Machupicchu ou a Waynapicchu.",
				"Rotas de Intipunku, Ponte Inka, Grande Caverna e Huchuypicchu.",
			],
			advice:
				"É outra opção para combinar fotografia e história na primeira visita. Confira as diferenças do mapa em relação à rota 2-A e os horários disponíveis para sua data.",
		},
		{
			name: "Montanha Waynapicchu",
			summary: "Setor baixo da cidade e subida a Waynapicchu.",
			maxStay: "6 horas",
			effort: "Exigente: escadas íngremes e trechos estreitos.",
			paragraphs: [
				"A rota 3-A combina o percurso do setor baixo com a subida a Waynapicchu, também conhecido como Huayna Picchu. A montanha faz parte desta rota específica: não é incluída automaticamente em qualquer ingresso de Machu Picchu.",
				"A perspectiva de Waynapicchu é diferente da fotografia feita nos terraços superiores. Este ingresso não inclui o setor panorâmico do circuito 1 nem a subida à montanha Machupicchu.",
			],
			includes: [
				"Trecho do setor baixo indicado no mapa da rota 3-A.",
				"Subida e descida pela trilha autorizada de Waynapicchu.",
			],
			excludes: [
				"Terraços superiores e circuito Clássico.",
				"Montanha Machupicchu e rota da Grande Caverna.",
			],
			advice:
				"Avalie seu conforto em escadas íngremes e trechos expostos. Confira as condições de idade e o horário específico de acesso à montanha ao reservar.",
		},
		{
			name: "Rota desenhada",
			summary: "Arquitetura do setor baixo, sem subida a uma montanha.",
			maxStay: "2 horas e 30 minutos",
			effort:
				"Sem subida de montanha; ainda há desníveis e superfícies irregulares.",
			paragraphs: [
				"A rota desenhada do circuito Realeza se concentra na parte baixa da cidade inka. Permite conhecer sua arquitetura por um percurso sem a subida de montanha presente em outras variantes do circuito 3.",
				"É importante diferenciá-la da 3-A: a rota 3-B não inclui Waynapicchu. Também não chega aos terraços superiores que oferecem a perspectiva panorâmica do circuito 1.",
			],
			includes: [
				"Percurso pelo setor baixo indicado no mapa.",
				"Observação dos conjuntos arquitetônicos do circuito Realeza.",
			],
			excludes: [
				"Waynapicchu, Huchuypicchu e Grande Caverna.",
				"Terraços superiores e percurso do circuito Clássico.",
			],
			advice:
				"Pode ser interessante se você prioriza a arquitetura e quer evitar uma subida de montanha. Se precisa de acesso adaptado, consulte as condições específicas antes de comprar.",
		},
		{
			name: "Grande Caverna",
			summary: "Uma caminhada até a Grande Caverna pelo circuito Realeza.",
			maxStay: "7 horas",
			effort: "Exigente: caminhada longa com descida e subida no retorno.",
			paragraphs: [
				"Esta rota acrescenta a trilha até a Grande Caverna ao itinerário do circuito 3. O interesse está no ambiente da montanha e no conjunto arqueológico associado à caverna.",
				"Não é o mesmo itinerário da subida ao cume de Waynapicchu. Considere tanto a descida quanto a subida de retorno e reserve tempo para concluir a visita dentro do limite autorizado.",
			],
			includes: [
				"Setor baixo e trilha da rota 3-C indicados no mapa.",
				"Visita ao conjunto da Grande Caverna.",
			],
			excludes: [
				"Subida ao cume de Waynapicchu.",
				"Terraços superiores, montanha Machupicchu e circuito Clássico.",
			],
			advice:
				"Confirme a operação da rota para sua data. A classificação de alta temporada não garante abertura diária: podem existir medidas de conservação ou manutenção.",
		},
		{
			name: "Huchuypicchu",
			summary: "Setor baixo e subida à montanha Huchuypicchu.",
			maxStay: "3 horas e 30 minutos",
			effort: "Subida com escadas, mais curta que a de Waynapicchu.",
			paragraphs: [
				"A rota 3-D combina o setor baixo de Machu Picchu com a subida a Huchuypicchu. Esta montanha tem um itinerário próprio e não deve ser confundida com Waynapicchu, cujo acesso corresponde à rota 3-A.",
				"Embora mais curta que a de Waynapicchu, a subida ainda exige uma caminhada com desníveis e degraus. A vista de Huchuypicchu também não substitui a perspectiva dos terraços superiores do circuito 1.",
			],
			includes: [
				"Trecho do circuito Realeza marcado na rota 3-D.",
				"Subida e descida pela trilha de Huchuypicchu.",
			],
			excludes: [
				"Subida a Waynapicchu e visita à Grande Caverna.",
				"Terraços superiores e montanha Machupicchu.",
			],
			advice:
				"Confira a abertura sazonal e as condições de idade na venda oficial antes de reservar. Não presuma que sejam as mesmas condições da rota 3-B.",
		},
	],
};

export const circuitOverviewPath: Record<Lang, string> = {
	es: "/es/circuitos-machupicchu/",
	en: "/machupicchu-circuits/",
	pt: "/pt/circuitos-machupicchu/",
};
export function localizedRoutePath(slug: string, lang: Lang) {
	return (
		circuitOverviewPath[lang] +
		slug.replace(
			/^ruta-/,
			lang === "en" ? "route-" : lang === "pt" ? "rota-" : "ruta-",
		) +
		"/"
	);
}
export function circuitRouteSlugMap(slug: string) {
	return Object.fromEntries(
		(["es", "en", "pt"] as const).map((lang) => [
			lang,
			localizedRoutePath(slug, lang)
				.replace(/^\/(?:es|pt)\//, "/")
				.replace(/^\/|\/$/g, ""),
		]),
	);
}
