import { purposeSeo } from "@/data/purposeSeo";
import { purposeSlugs } from "@/lib/purposeRoutes";
import fetchApi from "@/lib/strapi";
import { getHeroImage } from "@/lib/heroImage";
import { sustainableTourism } from "@/data/sustainableTourism";
import type { Tour } from "@/types/tours";

export async function getSustainableTours() {
	const query: Record<string, string | number> = { populate: "*" };
	sustainableTourism.tours.forEach((tour, index) => {
		query[`filters[slug][$in][${index}]`] = tour.slug;
	});
	const tours = await fetchApi<Tour[]>({
		endpoint: "tours",
		locale: "es",
		wrappedByKey: "data",
		query,
	});
	// Fail the build if a referenced product disappears instead of publishing broken cards.
	return sustainableTourism.tours.map((copy) => {
		const tour = tours.find((item) => item.slug === copy.slug);
		if (!tour)
			throw new Error(`Missing sustainable tourism experience: ${copy.slug}`);
		return { tour, copy };
	});
}

export async function getSustainableFrontmatter() {
	const tours = await getSustainableTours();
	const hero = getHeroImage(
		tours[2].tour.imagenDestacada,
		"Caminantes y arrieros entre las montañas de la ruta de Lares, Cusco",
	);
	return {
		title: "Turismo sostenible en Perú: naturaleza y experiencias",
		description: purposeSeo.sustainable.es.metaDescription,
		lang: "es" as const,
		layout: "landing" as const,
		heroImage: hero.src,
		heroImageAlt: hero.alt,
		seo: purposeSeo.sustainable.es,
		slugs: purposeSlugs.sustainable,
	};
}
