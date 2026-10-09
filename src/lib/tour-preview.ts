import type { Tour } from "@/types/tours";
import fetchApi from "./strapi";
/** Astro retains getStaticPaths props in development; reload the open tour only. */
export async function refreshLocalTour(
	tour: Tour,
	locale: string,
): Promise<Tour> {
	const tours = await fetchApi<Tour[]>({
		endpoint: "tours",
		locale,
		wrappedByKey: "data",
		query: {
			"filters[documentId][$eq]": tour.documentId,
			populate: "*",
			"populate[tab][populate][maps][populate][mapstops][populate][imagen]": true,
		},
	});
	return tours[0] ?? tour;
}
