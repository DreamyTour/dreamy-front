import type { Lang } from "./i18n";
import { rewriteUrl as rewriteLocalizedUrl } from "./i18n";
import type { Imagen } from "@/interface/common";

const strapiUrl =
	import.meta.env.VITE_STRAPI_URL?.replace(/\/$/, "") ||
	"http://localhost:1337";

type ImageLike = Imagen | Imagen[] | null | undefined;

function normalizeImage(image: unknown): Imagen | null {
	if (!image) return null;

	const imgObj = Array.isArray(image) ? image[0] : image;
	if (!imgObj || typeof imgObj !== "object") return null;

	return imgObj as Imagen;
}

/**
 * Get image URL from Strapi image object
 */
export function getImageUrl(
	image: unknown,
	formatOrBaseUrl?: string,
	baseUrl?: string,
): string {
	const imgObj = normalizeImage(image);
	if (!imgObj) return "/og-default.jpg";

	const isFormatKey =
		!!formatOrBaseUrl &&
		!formatOrBaseUrl.startsWith("http") &&
		!formatOrBaseUrl.startsWith("/");
	const format = isFormatKey ? formatOrBaseUrl : undefined;
	const resolvedBaseUrl =
		(isFormatKey ? baseUrl : formatOrBaseUrl) || strapiUrl;
	const url =
		(format ? imgObj.formats?.[format]?.url : undefined) || imgObj.url;

	if (!url) return "/og-default.jpg";

	return url.startsWith("http") ? url : `${resolvedBaseUrl}${url}`;
}

export function getImageAlt(image: ImageLike, fallback = ""): string {
	return normalizeImage(image)?.alternativeText || fallback;
}

export function getImageSrcSet(image: ImageLike, formats?: string[]): string {
	const imgObj = normalizeImage(image);
	if (!imgObj?.formats) return "";

	const candidates = Object.entries(imgObj.formats)
		.filter(([key, format]) => {
			if (!format?.url || !format?.width) return false;
			return formats ? formats.includes(key) : true;
		})
		.sort(([, a], [, b]) => (a.width || 0) - (b.width || 0));

	return candidates
		.map(([, format]) => {
			const url = format.url.startsWith("http")
				? format.url
				: `${strapiUrl}${format.url}`;
			return `${url} ${format.width}w`;
		})
		.join(", ");
}

/**
 * Get thumbnail URL for videos
 */
export function getThumbnailUrl(thumbnail: unknown): string | null {
	if (!thumbnail) return null;

	const thumbObj = normalizeImage(thumbnail);
	if (!thumbObj || typeof thumbObj !== "object") return null;

	const url = thumbObj.url;
	if (!url) return null;

	return url.startsWith("http") ? url : `${strapiUrl}${url}`;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(
	url: string | null | undefined,
): string | null {
	if (!url) return null;

	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\s?]+)/,
		/^([a-zA-Z0-9_-]{11})$/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) return match[1];
	}

	return null;
}

/**
 * Extract plain text from Strapi blocks
 */
export function extractTextFromBlocks(blocks: unknown): string {
	if (!Array.isArray(blocks)) return typeof blocks === "string" ? blocks : "";
	return blocks
		.map((block) => {
			if (block?.children && Array.isArray(block.children)) {
				return block.children.map((child: any) => child.text || "").join("");
			}
			return "";
		})
		.filter(Boolean)
		.join(" ");
}

/**
 * Generate meta description from content
 */
export function generateDescription(content: unknown, maxLength = 160): string {
	if (!content) return "";

	let plainText = "";
	if (Array.isArray(content)) {
		plainText = extractTextFromBlocks(content);
	} else {
		const contentStr =
			typeof content === "string" ? content : JSON.stringify(content);
		plainText = contentStr
			.replace(/<[^>]*>/g, "")
			.replace(/&[^;]+;/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	if (plainText.length <= maxLength) return plainText;
	return plainText.substring(0, maxLength).trim() + "...";
}

/**
 * Format date for SEO
 */
export function formatDate(
	dateString: string | null | undefined,
	locale: Lang = "es",
): string {
	if (!dateString) return "";

	try {
		const date = new Date(dateString);
		return date.toLocaleDateString(locale === "pt" ? "pt-BR" : locale, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	} catch {
		return dateString;
	}
}

/**
 * Rewrite URL based on current language
 */
export function rewriteUrl(url: string | undefined, currentLang: Lang): string {
	return rewriteLocalizedUrl(url, currentLang);
}

/**
 * Get Strapi URL
 */
export function getStrapiUrl(): string {
	return strapiUrl;
}
