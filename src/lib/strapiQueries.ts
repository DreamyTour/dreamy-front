import type { Lang } from "@/lib/i18n";
import fetchApi from "@/lib/strapi";
import { dedupeLocalizedDocuments, sortToursByOrder } from "@/lib/utils";
import type { Tour } from "@/types/tours";

interface CategoryQuery {
	categorySlug?: string;
	lang: Lang;
	limit?: number;
	dedupe?: boolean;
}

export async function fetchToursByCategory({
	categorySlug,
	lang,
	limit = 3,
	dedupe = true,
}: CategoryQuery) {
	if (!categorySlug) return [];

	const tours = await fetchApi<Tour[]>({
		endpoint: "tours",
		wrappedByKey: "data",
		locale: lang,
		query: {
			"filters[categories][slug][$eq]": categorySlug,
			"pagination[limit]": limit,
			"sort[0]": "orden:asc",
			"sort[1]": "titulo:asc",
			populate: "*",
		},
	});

	if (!Array.isArray(tours)) return [];

	return sortToursByOrder(dedupe ? dedupeLocalizedDocuments(tours) : tours);
}
