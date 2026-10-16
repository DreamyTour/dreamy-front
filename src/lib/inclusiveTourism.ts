import { purposeSeo } from "@/data/purposeSeo";
import { purposeSlugs } from "@/lib/purposeRoutes";
import fetchApi from "@/lib/strapi";
import type { HeroImageData } from "@/lib/heroImage";
import { inclusiveTourism } from "@/data/inclusiveTourism";
import type { Tour } from "@/types/tours";

export const inclusiveHero: HeroImageData = {
	src: "/imagenes/turismo-inclusivo-cusco.webp",
	srcset: undefined,
	sizes: "100vw",
	width: 1400,
	height: 630,
	alt: "Grupo de viajeros en las terrazas y senderos del Valle Sagrado, Cusco",
};

export async function getInclusiveTours() {
	const query: Record<string, string> = { populate: "*" };
	inclusiveTourism.tours.forEach((tour, index) => {
		query[`filters[slug][$in][${index}]`] = tour.slug;
	});
	const products = await fetchApi<Tour[]>({
		endpoint: "tours",
		locale: "es",
		wrappedByKey: "data",
		query,
	});
	return inclusiveTourism.tours.map((copy) => {
		const tour = products.find((product) => product.slug === copy.slug);
		if (!tour)
			throw new Error(
				`Missing inclusive tourism base experience: ${copy.slug}`,
			);
		const duration = tour.badge?.find((badge) =>
			/duraci[oó]n/i.test(badge.titulo),
		)?.content;
		if (!duration)
			throw new Error(`Missing base itinerary duration: ${copy.slug}`);
		return { tour, copy, duration };
	});
}

export async function getInclusiveFrontmatter() {
	const hero = inclusiveHero;
	return {
		title: "Turismo inclusivo en Cusco: experiencias para todos",
		description: purposeSeo.inclusive.es.metaDescription,
		lang: "es" as const,
		layout: "landing" as const,
		heroImage: hero.src,
		heroImageAlt: hero.alt,
		seo: purposeSeo.inclusive.es,
		slugs: purposeSlugs.inclusive,
	};
}

// No records are populated until an actual itinerary assessment is documented.
export type AccessibilityStatus =
	| "Verificado"
	| "Disponible previa coordinación"
	| "No disponible"
	| "Pendiente de confirmar";
export const accessibilityTopics = [
	"Caminatas y distancias",
	"Escaleras, pendientes y superficies",
	"Accesibilidad del transporte",
	"Baños e instalaciones",
	"Recursos de comunicación y asistencia",
	"Ritmo del recorrido y descansos",
] as const;
export interface AccessibilityAssessment {
	tourDocumentId: string;
	reviewedAt: string;
	source: string;
	conditions: Array<{
		topic: (typeof accessibilityTopics)[number];
		status: AccessibilityStatus;
		details: string;
	}>;
}
export const accessibilityAssessments: AccessibilityAssessment[] = [];
