import { getImageUrl } from "@/lib/helpers";
import { type Lang, localizePath } from "@/lib/i18n";
import type { Page } from "@/types/page";
import type { Tour } from "@/types/tours";

interface BuildCollectionSchemasOptions {
	page: Page;
	tours: Tour[];
	canonicalUrl: string;
	siteUrl: string;
	lang: Lang;
	description?: string;
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

function normalizeUrl(url: string): string {
	return url.endsWith("/") ? url : `${url}/`;
}

function toAbsoluteUrl(
	url: string | undefined,
	siteUrl: string,
): string | undefined {
	if (!url) return undefined;
	if (url.startsWith("http")) return url;
	return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function buildCollectionSchemas({
	page,
	tours,
	canonicalUrl,
	siteUrl,
	lang,
	description,
}: BuildCollectionSchemasOptions): Record<string, unknown>[] {
	const name = cleanText(page.seo?.metaTitle) || cleanText(page.titulo);
	const summary =
		cleanText(page.seo?.metaDescription) || cleanText(description);
	const pageUrl = normalizeUrl(canonicalUrl);
	const itemListElement = tours.map((tour, index) => {
		const tourUrl = normalizeUrl(siteUrl + localizePath(`/${tour.slug}`, lang));
		const image = tour.imagenDestacada
			? getImageUrl(tour.imagenDestacada, "large")
			: undefined;
		const absoluteImage = toAbsoluteUrl(image, siteUrl);

		return {
			"@type": "ListItem",
			position: index + 1,
			url: tourUrl,
			item: {
				"@type": "TouristTrip",
				"@id": `${tourUrl}#tour`,
				name: cleanText(tour.titulo) || tour.slug,
				url: tourUrl,
				...(absoluteImage ? { image: [absoluteImage] } : {}),
				provider: {
					"@id": `${siteUrl}/#organization`,
				},
			},
		};
	});

	const collectionPageSchema = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"@id": `${pageUrl}#collection`,
		name,
		...(summary ? { description: summary } : {}),
		url: pageUrl,
		inLanguage: SCHEMA_LANGUAGE_BY_LANG[lang] || SCHEMA_LANGUAGE_BY_LANG.en,
		isPartOf: {
			"@id": `${siteUrl}/#website`,
		},
		publisher: {
			"@id": `${siteUrl}/#organization`,
		},
		...(itemListElement.length
			? {
					mainEntity: {
						"@type": "ItemList",
						"@id": `${pageUrl}#itemlist`,
						name,
						itemListElement,
					},
				}
			: {}),
	};

	return [collectionPageSchema];
}
