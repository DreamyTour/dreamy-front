import { purposeSeo } from "@/data/purposeSeo";
import { purposeSlugs } from "@/lib/purposeRoutes";
import fetchApi from "@/lib/strapi";
import { getHeroImage } from "@/lib/heroImage";
import { responsibleTourism } from "@/data/responsibleTourism";
import type { Tour } from "@/types/tours";

export async function getResponsibleTours() {
	const query: Record<string, string> = { populate: "*" };
	responsibleTourism.tours.forEach((copy, index) => {
		query[`filters[slug][$in][${index}]`] = copy.slug;
	});
	const products = await fetchApi<Tour[]>({
		endpoint: "tours",
		locale: "es",
		wrappedByKey: "data",
		query,
	});
	return responsibleTourism.tours.map((copy) => {
		const tour = products.find((product) => product.slug === copy.slug);
		if (!tour)
			throw new Error(`Missing responsible tourism experience: ${copy.slug}`);
		const duration = tour.badge
			?.find((badge) => /duraci[oó]n/i.test(badge.titulo))
			?.content?.trim();
		if (!duration) throw new Error(`Missing catalogue duration: ${copy.slug}`);
		return { tour, copy, duration };
	});
}

export function getResponsibleHero(tour: Tour) {
	// The original catalogue photo is 1200 × 900; shallow SEO media omit dimensions.
	const image = tour.seo?.metaImage;
	if (!image?.url) throw new Error("Missing Misminay catalogue photograph");
	const hero = getHeroImage({
		...image,
		width: image.width || 1200,
		height: image.height || 900,
	});
	return {
		...hero,
		alt: "Anfitriones de Misminay y viajeros junto a textiles y productos locales",
	};
}

export async function getResponsibleFrontmatter() {
	const tours = await getResponsibleTours();
	const hero = getResponsibleHero(tours[0].tour);
	return {
		title: "Turismo responsable en Cusco: experiencias con propósito",
		description: purposeSeo.responsible.es.metaDescription,
		lang: "es" as const,
		layout: "landing" as const,
		heroImage: hero.src,
		heroImageAlt: hero.alt,
		seo: purposeSeo.responsible.es,
		slugs: purposeSlugs.responsible,
	};
}
