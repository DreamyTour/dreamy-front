import type { Lang } from "@/lib/i18n";
import type { ManualSEO } from "@/lib/seo";
import type { PurposePage } from "@/data/purposeSlugs";

export const purposeSeo = {
	inclusive: {
		es: {
			metaTitle: "Turismo inclusivo y accesible en Cusco | Dreamy Tours",
			metaDescription:
				"Planea tu viaje a Cusco a tu ritmo. Consulta opciones para adultos mayores, movilidad reducida y visitas a Machu Picchu con atención personalizada.",
		},
		en: {
			metaTitle: "Inclusive & Accessible Tourism in Cusco | Dreamy Tours",
			metaDescription:
				"Visit Cusco at your own pace. Ask about travel options for older adults, reduced mobility and Machu Picchu visits, with support to plan your trip.",
		},
		pt: {
			metaTitle: "Turismo inclusivo e acessível em Cusco | Dreamy Tours",
			metaDescription:
				"Conheça Cusco no seu ritmo. Consulte opções para pessoas idosas, mobilidade reduzida e visitas a Machu Picchu com atendimento personalizado.",
		},
	},
	sustainable: {
		es: {
			metaTitle: "Turismo sostenible en Perú: Andes y Amazonía | Dreamy Tours",
			metaDescription:
				"Descubre rutas de naturaleza en Cusco, los Andes y Tambopata. Conoce nuestros tours y consejos para viajar por Perú cuidando sus paisajes y comunidades.",
		},
		en: {
			metaTitle: "Sustainable Tourism in Peru: Andes & Amazon | Dreamy Tours",
			metaDescription:
				"Explore nature tours in Cusco, the Andes and Tambopata. Find itineraries and practical tips for visiting Peru with care for its landscapes and communities.",
		},
		pt: {
			metaTitle: "Turismo sustentável no Peru: Andes e Amazônia | Dreamy Tours",
			metaDescription:
				"Explore roteiros de natureza em Cusco, nos Andes e em Tambopata. Conheça nossos tours e dicas para viajar pelo Peru cuidando das paisagens e comunidades.",
		},
	},
	responsible: {
		es: {
			metaTitle: "Turismo responsable y vivencial en Cusco | Dreamy Tours",
			metaDescription:
				"Conoce Misminay y la cultura del Valle Sagrado con tours vivenciales en Cusco. Descubre tradiciones andinas, artesanías locales y formas de viajar con respeto.",
		},
		en: {
			metaTitle: "Responsible & Community Tourism in Cusco | Dreamy Tours",
			metaDescription:
				"Discover Misminay and Sacred Valley culture on community tours in Cusco. Learn about Andean traditions, local crafts and respectful ways to travel.",
		},
		pt: {
			metaTitle: "Turismo responsável e vivencial em Cusco | Dreamy Tours",
			metaDescription:
				"Conheça Misminay e a cultura do Vale Sagrado com tours vivenciais em Cusco. Descubra tradições andinas, artesanatos locais e formas de viajar com respeito.",
		},
	},
	social: {
		es: {
			metaTitle: "Proyecto social en Cusco y Valle Sagrado | Dreamy Tours",
			metaDescription:
				"Conoce el proyecto social de Dreamy Tours en Cusco y el Valle Sagrado: campañas navideñas, entrega de útiles escolares y cuidado del entorno.",
		},
		en: {
			metaTitle: "Social Projects in Cusco & the Sacred Valley | Dreamy Tours",
			metaDescription:
				"Learn about Dreamy Tours' social projects in Cusco and the Sacred Valley, including Christmas campaigns, school supplies and care for the environment.",
		},
		pt: {
			metaTitle: "Projeto social em Cusco e no Vale Sagrado | Dreamy Tours",
			metaDescription:
				"Conheça o projeto social da Dreamy Tours em Cusco e no Vale Sagrado: campanhas de Natal, entrega de materiais escolares e cuidado com o ambiente.",
		},
	},
	christmas: {
		es: {
			metaTitle: "Campañas navideñas en comunidades de Cusco | Dreamy Tours",
			metaDescription:
				"Desde 2020 compartimos juguetes, chocolatadas y encuentros navideños con comunidades de Cusco. Conoce nuestras jornadas en Saylla, Patacolca y Huilloq.",
		},
		en: {
			metaTitle: "Christmas Community Campaigns in Cusco | Dreamy Tours",
			metaDescription:
				"Since 2020, we have shared toys, hot chocolate and Christmas gatherings with Cusco communities. Explore our visits to Saylla, Patacolca and Huilloq.",
		},
		pt: {
			metaTitle: "Campanhas de Natal nas comunidades de Cusco | Dreamy Tours",
			metaDescription:
				"Desde 2020, compartilhamos brinquedos, chocolate quente e encontros de Natal com comunidades de Cusco. Conheça as visitas a Saylla, Patacolca e Huilloq.",
		},
	},
	school: {
		es: {
			metaTitle: "Entrega de útiles escolares en Cusco | Dreamy Tours",
			metaDescription:
				"Conoce nuestra entrega de mochilas, cuadernos y materiales escolares a niños de comunidades de Cusco, una iniciativa de Dreamy Tours para apoyar su educación.",
		},
		en: {
			metaTitle: "School Supplies for Children in Cusco | Dreamy Tours",
			metaDescription:
				"See how Dreamy Tours supports children's education in Cusco communities by sharing backpacks, notebooks and school supplies. Meet the people taking part.",
		},
		pt: {
			metaTitle: "Entrega de materiais escolares em Cusco | Dreamy Tours",
			metaDescription:
				"Conheça nossa entrega de mochilas, cadernos e materiais escolares às crianças de comunidades de Cusco, uma iniciativa da Dreamy Tours de apoio à educação.",
		},
	},
} satisfies Record<PurposePage, Record<Lang, ManualSEO>>;
