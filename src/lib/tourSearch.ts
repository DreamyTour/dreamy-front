import { getImageAlt, getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";
import { fetchAllStrapi } from "@/lib/strapi";
import { dedupeLocalizedDocuments } from "@/lib/utils";
import type { Tour } from "@/types/tours";

export interface TourSearchItem {
	documentId: string;
	title: string;
	slug: string;
	imageUrl: string;
	imageAlt: string;
	duration: string;
}

function normalizeBadgeTitle(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function getTourDuration(tour: Tour) {
	const durationBadge = tour.badge?.find((badge) => {
		const title = normalizeBadgeTitle(badge.titulo ?? "");
		return (
			title.includes("duracion") ||
			title.includes("uracion") ||
			title.includes("duration") ||
			title.includes("duracao")
		);
	});

	return durationBadge?.content ?? tour.badge?.at(-1)?.content ?? "";
}

export async function fetchTourSearchItems(
	lang: Lang,
): Promise<TourSearchItem[]> {
	const tours = await fetchAllStrapi<Tour>({
		endpoint: "tours",
		locale: lang,
		query: {
			populate: "*",
			"sort[0]": "titulo:asc",
		},
	});

	return dedupeLocalizedDocuments(tours).map((tour) => {
		const cardImage = tour.seo?.metaImage ?? tour.imagenDestacada;

		return {
			documentId: tour.documentId,
			title: tour.titulo,
			slug: tour.slug,
			imageUrl: getImageUrl(cardImage, "thumbnail"),
			imageAlt: getImageAlt(cardImage, tour.titulo),
			duration: getTourDuration(tour),
		};
	});
}
