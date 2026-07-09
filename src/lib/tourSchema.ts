import type { Lang } from "@/lib/i18n";
import type { Tour } from "@/types/tours";

interface BuildTourSchemasOptions {
	tour: Tour;
	canonicalUrl: string;
	siteUrl: string;
	lang: Lang;
	description?: string;
	imageUrl?: string;
}

const SCHEMA_LANGUAGE_BY_LANG: Record<Lang, string> = {
	en: "en-US",
	es: "es-PE",
	pt: "pt-BR",
};

function cleanText(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const cleanValue = value.replace(/\s+/g, " ").trim();
	return cleanValue || undefined;
}

function toAbsoluteUrl(
	url: string | undefined,
	siteUrl: string,
): string | undefined {
	if (!url) return undefined;
	if (url.startsWith("http")) return url;
	return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function buildTourSchemas({
	tour,
	canonicalUrl,
	siteUrl,
	lang,
	description,
	imageUrl,
}: BuildTourSchemasOptions): Record<string, unknown>[] {
	const name = cleanText(tour.titulo) || "Dreamy Tours";
	const summary = cleanText(description);
	const absoluteImage = toAbsoluteUrl(imageUrl, siteUrl);
	const image = absoluteImage ? [absoluteImage] : undefined;
	const additionalProperty = tour.badge
		?.map((badge) => {
			const propertyName = cleanText(badge.titulo);
			const propertyValue = cleanText(badge.content);

			if (!propertyName || !propertyValue) return null;

			return {
				"@type": "PropertyValue",
				name: propertyName,
				value: propertyValue,
			};
		})
		.filter(Boolean);

	const itineraryItems = tour.tab?.itinerary?.acordeon
		?.map((item, index) => {
			const itemName = cleanText(item.titulo);
			if (!itemName) return null;

			return {
				"@type": "ListItem",
				position: index + 1,
				name: itemName,
			};
		})
		.filter(Boolean);

	const touristTripSchema = {
		"@context": "https://schema.org",
		"@type": "TouristTrip",
		"@id": `${canonicalUrl}#tour`,
		name,
		...(summary ? { description: summary } : {}),
		url: canonicalUrl,
		inLanguage: SCHEMA_LANGUAGE_BY_LANG[lang] || SCHEMA_LANGUAGE_BY_LANG.en,
		...(image ? { image } : {}),
		provider: {
			"@id": `${siteUrl}/#organization`,
		},
		...(additionalProperty?.length ? { additionalProperty } : {}),
		...(itineraryItems?.length
			? {
					itinerary: {
						"@type": "ItemList",
						itemListElement: itineraryItems,
					},
				}
			: {}),
	};

	return [touristTripSchema];
}
