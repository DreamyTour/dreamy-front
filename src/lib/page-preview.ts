import type { Lang } from "@/lib/i18n";
import type { Page } from "@/types/page";
import fetchApi from "./strapi";

/** Refresh editable sections retained in Astro's development getStaticPaths props. */
export async function refreshLocalPageSections(
	page: Page,
	locale: Lang,
): Promise<Page> {
	const pages = await fetchApi<
		Pick<Page, "tituloPreguntas" | "preguntasAcordeon" | "selectorTours" | "informacionUtil">[]
	>({
		endpoint: "pages",
		locale,
		wrappedByKey: "data",
		query: {
			"filters[documentId][$eq]": page.documentId,
			"pagination[limit]": 1,
			"populate[preguntasAcordeon]": true,
			"populate[selectorTours][populate][recomendaciones][populate][tour][fields][0]": "documentId",
			"populate[selectorTours][populate][recomendaciones][populate][tour][fields][1]": "titulo",
			"populate[selectorTours][populate][recomendaciones][populate][tour][fields][2]": "slug",
			"populate[selectorTours][populate][recomendaciones][populate][tour][fields][3]": "locale",
			"populate[informacionUtil][populate][items]": true,
		},
	});
	const current = pages[0];
	return current
		? {
				...page,
				tituloPreguntas: current.tituloPreguntas,
				preguntasAcordeon: current.preguntasAcordeon,
				selectorTours: current.selectorTours,
				informacionUtil: current.informacionUtil,
			}
		: page;
}
