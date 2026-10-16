export const purposeSlugs = {
	inclusive: {
		es: "turismo-inclusivo-cusco",
		en: "inclusive-tourism-cusco",
		pt: "turismo-inclusivo-cusco",
	},
	sustainable: {
		es: "turismo-sostenible-peru",
		en: "sustainable-tourism-peru",
		pt: "turismo-sustentavel-peru",
	},
	responsible: {
		es: "turismo-responsable-cusco",
		en: "responsible-tourism-cusco",
		pt: "turismo-responsavel-cusco",
	},
	social: { es: "proyecto-social", en: "social-project", pt: "projeto-social" },
	christmas: {
		es: "proyecto-social/proyecto-navideno",
		en: "social-project/christmas-project",
		pt: "projeto-social/projeto-de-natal",
	},
	school: {
		es: "proyecto-social/entrega-de-utiles-escolares",
		en: "social-project/school-supplies",
		pt: "projeto-social/materiais-escolares",
	},
} as const;
export type PurposePage = keyof typeof purposeSlugs;
