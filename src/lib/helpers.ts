import type { Imagen } from "@/types/common";
import type { StrapiBlock, StrapiBlockChild } from "@/types/page";
import type { Lang } from "./i18n";
import { rewriteUrl as rewriteLocalizedUrl } from "./i18n";

const strapiUrl =
	import.meta.env.VITE_STRAPI_URL?.replace(/\/$/, "") ||
	"http://localhost:1337";

const formatFallbacks: Record<string, string[]> = {
	thumbnail: ["thumbnail", "small", "medium", "large"],
	small: ["small", "thumbnail", "medium", "large"],
	medium: ["medium", "small", "large", "thumbnail"],
	large: ["large", "medium", "small", "thumbnail"],
};

function normalizeImage(image: unknown): Imagen | null {
	if (!image) return null;

	const imgObj = Array.isArray(image) ? image[0] : image;
	if (!imgObj || typeof imgObj !== "object") return null;

	return imgObj as Imagen;
}

function resolveImageUrl(url: string, baseUrl = strapiUrl): string {
	return url.startsWith("http") ? url : `${baseUrl}${url}`;
}

function getFormatUrl(
	imgObj: Imagen,
	format: string | undefined,
): string | undefined {
	if (!format || !imgObj.formats) return undefined;

	for (const key of formatFallbacks[format] || [format]) {
		const url = imgObj.formats[key]?.url;
		if (url) return url;
	}

	return undefined;
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
	const url = getFormatUrl(imgObj, format) || imgObj.url;

	if (!url) return "/og-default.jpg";

	return resolveImageUrl(url, resolvedBaseUrl);
}

export function getImageAlt(image: unknown, fallback = ""): string {
	return normalizeImage(image)?.alternativeText || fallback;
}

export function getImageSrcSet(image: unknown, formats?: string[]): string {
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
			return `${resolveImageUrl(format.url)} ${format.width}w`;
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
		if (match?.[1]) return match[1];
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
			const maybeBlock = block as Partial<StrapiBlock>;
			if (Array.isArray(maybeBlock.children)) {
				return maybeBlock.children
					.map((child: StrapiBlockChild) => child.text || "")
					.join("");
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
	return `${plainText.substring(0, maxLength).trim()}...`;
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
		const [y, m, d] = dateString.split("-").map(Number);
		const date = new Date(y, m - 1, d);
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
