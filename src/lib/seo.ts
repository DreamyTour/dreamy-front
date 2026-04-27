import type { SEOProps } from "@/components/SEO.astro";
import type { SEO } from "@/interface/common";
import { getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";

export interface ManualSEO {
	metaTitle: string;
	metaDescription: string;
	metaImage?: string | null;
	keywords?: string | null;
}

interface BuildSEOPropsOptions {
	seo?: SEO | ManualSEO | null;
	fallbackTitle: string;
	fallbackDescription?: string;
	fallbackImage?: string;
	type?: SEOProps["type"];
	lang: Lang;
	canonicalUrl?: string;
	publishedTime?: string;
	author?: string;
	slugMap?: Record<string, string>;
}

export function buildSEOProps({
	seo,
	fallbackTitle,
	fallbackDescription = "",
	fallbackImage,
	type = "website",
	lang,
	canonicalUrl,
	publishedTime,
	author,
	slugMap,
}: BuildSEOPropsOptions): SEOProps {
	const seoImage =
		seo?.metaImage && typeof seo.metaImage === "string"
			? seo.metaImage
			: seo?.metaImage
				? getImageUrl(seo.metaImage)
				: fallbackImage;

	return {
		title: seo?.metaTitle?.trim() || fallbackTitle,
		description: seo?.metaDescription?.trim() || fallbackDescription,
		image: seoImage,
		keywords: seo?.keywords?.trim() || undefined,
		type,
		lang,
		canonicalUrl,
		publishedTime,
		author,
		slugMap,
	};
}
