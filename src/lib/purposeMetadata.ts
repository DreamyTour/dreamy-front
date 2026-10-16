import type { ContentFrontmatter } from "@/lib/dynamicPageRoutes";
import type { Lang } from "@/lib/i18n";
import { purposeText } from "@/i18n/purpose";
import { purposeSlugs, type PurposePage } from "@/lib/purposeRoutes";
import { purposeSeo } from "@/data/purposeSeo";

const metadata: Record<
	PurposePage,
	Record<
		"en" | "pt",
		{
			title: string;
			heroEyebrow?: string;
			heroImageAlt?: string;
		}
	>
> = {
	inclusive: {
		en: {
			title: "Inclusive tourism in Cusco: experiences for everyone",
		},
		pt: {
			title: "Turismo inclusivo em Cusco: experiências para todos",
		},
	},
	sustainable: {
		en: {
			title: "Sustainable tourism in Peru: nature and experiences",
		},
		pt: {
			title: "Turismo sustentável no Peru: natureza e experiências",
		},
	},
	responsible: {
		en: {
			title: "Responsible tourism in Cusco: experiences with purpose",
		},
		pt: {
			title: "Turismo responsável em Cusco: experiências com propósito",
		},
	},
	social: {
		en: {
			title: "Social Project",
			heroEyebrow: "Travel with purpose",
			heroImageAlt:
				"Dreamy Tours Christmas celebration with families in Saylla, Cusco",
		},
		pt: {
			title: "Projeto Social",
			heroEyebrow: "Turismo com propósito",
			heroImageAlt:
				"Celebração de Natal da Dreamy Tours com as famílias de Saylla, Cusco",
		},
	},
	christmas: {
		en: {
			title: "Christmas Project",
			heroEyebrow: "Sharing brings us together",
			heroImageAlt:
				"Dreamy Tours team and children sharing a Christmas celebration",
		},
		pt: {
			title: "Projeto de Natal",
			heroEyebrow: "Compartilhar nos une",
			heroImageAlt:
				"Equipe da Dreamy Tours e crianças compartilhando uma celebração de Natal",
		},
	},
	school: {
		en: {
			title: "School Supplies Initiative",
			heroEyebrow: "Sharing opportunities",
			heroImageAlt: "Dreamy Tours team sharing school supplies with children",
		},
		pt: {
			title: "Entrega de Materiais Escolares",
			heroEyebrow: "Compartilhando oportunidades",
			heroImageAlt:
				"Equipe da Dreamy Tours compartilhando materiais escolares com crianças",
		},
	},
};

export function localizePurposeFrontmatter(
	original: ContentFrontmatter,
	page: PurposePage,
	lang: Lang,
) {
	if (lang === "es")
		return {
			...original,
			description: purposeSeo[page].es.metaDescription,
			seo: { ...original.seo, ...purposeSeo[page].es },
			slugs: purposeSlugs[page],
		};
	const copy = metadata[page][lang];
	return {
		...original,
		...copy,
		description: purposeSeo[page][lang].metaDescription,
		lang,
		slugs: purposeSlugs[page],
		heroImageAlt:
			copy.heroImageAlt ?? purposeText(original.heroImageAlt ?? "", lang),
		seo: {
			...original.seo,
			...purposeSeo[page][lang],
		},
	};
}
