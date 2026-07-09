import { getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import type { Blog, CategoryBlog } from "@/types/blog";
import type { Pregunta, StrapiBlock, StrapiBlockChild } from "@/types/page";

interface BaseSchemaOptions {
	canonicalUrl: string;
	siteUrl: string;
	lang: Lang;
	title: string;
	description?: string;
	imageUrl?: string;
}

interface BuildStaticPageSchemasOptions extends BaseSchemaOptions {
	pathname: string;
}

interface BuildBlogIndexSchemasOptions extends BaseSchemaOptions {
	posts?: Blog[];
}

interface BuildBlogCategorySchemasOptions extends BaseSchemaOptions {
	category?: CategoryBlog | null;
	posts?: Blog[];
}

interface BuildFaqPageSchemaOptions {
	canonicalUrl: string;
	questions?: Pregunta[] | null;
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

function extractBlockText(blocks: unknown): string | undefined {
	if (typeof blocks === "string") return cleanText(blocks);
	if (!Array.isArray(blocks)) return undefined;

	const text = blocks
		.map((block: StrapiBlock) => {
			if (!Array.isArray(block.children)) return "";

			return block.children
				.map((child: StrapiBlockChild) => {
					if (child.text) return child.text;
					if (Array.isArray(child.children)) {
						return child.children
							.map((nestedChild) => nestedChild.text || "")
							.join(" ");
					}

					return "";
				})
				.join(" ");
		})
		.join(" ");

	return cleanText(text);
}

function inferStaticPageType(pathname: string): string {
	const normalized = pathname.toLowerCase();

	if (
		normalized.includes("about-us") ||
		normalized.includes("sobre-nosotros") ||
		normalized.includes("sobre-nos")
	) {
		return "AboutPage";
	}

	if (
		normalized.includes("plan-your-trip") ||
		normalized.includes("planea-tu-viaje") ||
		normalized.includes("planeje-sua-viagem") ||
		normalized.includes("complaints-book") ||
		normalized.includes("libro-reclamaciones") ||
		normalized.includes("livro-de-reclamacoes")
	) {
		return "ContactPage";
	}

	return "WebPage";
}

function buildItemList({
	posts = [],
	siteUrl,
	lang,
}: {
	posts?: Blog[];
	siteUrl: string;
	lang: Lang;
}) {
	const itemListElement = posts
		.map((post, index) => {
			const postUrl = normalizeUrl(
				siteUrl + localizePath(`/blog/${post.slug}`, lang),
			);
			const image = post.portadaImage
				? getImageUrl(post.portadaImage, "medium")
				: undefined;
			const absoluteImage = toAbsoluteUrl(image, siteUrl);

			return {
				"@type": "ListItem",
				position: index + 1,
				url: postUrl,
				item: {
					"@type": "BlogPosting",
					"@id": `${postUrl}#article`,
					headline: cleanText(post.titulo) || post.slug,
					url: postUrl,
					...(absoluteImage && image !== "/og-default.jpg"
						? { image: absoluteImage }
						: {}),
				},
			};
		})
		.filter(Boolean);

	if (!itemListElement.length) return undefined;

	return {
		"@type": "ItemList",
		itemListElement,
	};
}

export function buildStaticPageSchemas({
	canonicalUrl,
	siteUrl,
	lang,
	title,
	description,
	imageUrl,
	pathname,
}: BuildStaticPageSchemasOptions): Record<string, unknown>[] {
	const pageUrl = normalizeUrl(canonicalUrl);
	const pageType = inferStaticPageType(pathname);
	const absoluteImage = toAbsoluteUrl(imageUrl, siteUrl);

	return [
		{
			"@context": "https://schema.org",
			"@type": pageType,
			"@id": `${pageUrl}#static-page`,
			url: pageUrl,
			name: cleanText(title),
			...(cleanText(description)
				? { description: cleanText(description) }
				: {}),
			inLanguage: SCHEMA_LANGUAGE_BY_LANG[lang] || SCHEMA_LANGUAGE_BY_LANG.en,
			isPartOf: {
				"@id": `${siteUrl}/#website`,
			},
			publisher: {
				"@id": `${siteUrl}/#organization`,
			},
			...(absoluteImage ? { image: absoluteImage } : {}),
		},
	];
}

export function buildBlogIndexSchemas({
	canonicalUrl,
	siteUrl,
	lang,
	title,
	description,
	posts,
}: BuildBlogIndexSchemasOptions): Record<string, unknown>[] {
	const pageUrl = normalizeUrl(canonicalUrl);
	const itemList = buildItemList({ posts, siteUrl, lang });

	return [
		{
			"@context": "https://schema.org",
			"@type": "Blog",
			"@id": `${pageUrl}#blog`,
			url: pageUrl,
			name: cleanText(title),
			...(cleanText(description)
				? { description: cleanText(description) }
				: {}),
			inLanguage: SCHEMA_LANGUAGE_BY_LANG[lang] || SCHEMA_LANGUAGE_BY_LANG.en,
			publisher: {
				"@id": `${siteUrl}/#organization`,
			},
			...(itemList
				? {
						mainEntity: {
							"@type": "ItemList",
							"@id": `${pageUrl}#itemlist`,
							name: cleanText(title),
							itemListElement: itemList.itemListElement,
						},
						blogPost: itemList.itemListElement
							.map((item) => {
								if (
									typeof item !== "object" ||
									item === null ||
									!("item" in item)
								) {
									return null;
								}

								return (item as { item?: unknown }).item;
							})
							.filter(Boolean),
					}
				: {}),
		},
	];
}

export function buildBlogCategorySchemas({
	canonicalUrl,
	siteUrl,
	lang,
	title,
	description,
	imageUrl,
	category,
	posts,
}: BuildBlogCategorySchemasOptions): Record<string, unknown>[] {
	const pageUrl = normalizeUrl(canonicalUrl);
	const itemList = buildItemList({ posts, siteUrl, lang });
	const absoluteImage = toAbsoluteUrl(imageUrl, siteUrl);

	return [
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"@id": `${pageUrl}#blog-category`,
			url: pageUrl,
			name: cleanText(title) || cleanText(category?.nombre),
			...(cleanText(description)
				? { description: cleanText(description) }
				: {}),
			inLanguage: SCHEMA_LANGUAGE_BY_LANG[lang] || SCHEMA_LANGUAGE_BY_LANG.en,
			isPartOf: {
				"@id": `${siteUrl}/#website`,
			},
			publisher: {
				"@id": `${siteUrl}/#organization`,
			},
			...(absoluteImage ? { image: absoluteImage } : {}),
			...(itemList
				? {
						mainEntity: {
							"@type": "ItemList",
							"@id": `${pageUrl}#itemlist`,
							name: cleanText(title) || cleanText(category?.nombre),
							itemListElement: itemList.itemListElement,
						},
					}
				: {}),
		},
	];
}

export function buildFaqPageSchema({
	canonicalUrl,
	questions,
}: BuildFaqPageSchemaOptions): Record<string, unknown> | null {
	const mainEntity = (questions || [])
		.map((question) => {
			const name = cleanText(question.titulo);
			const text = extractBlockText(question.contenido);

			if (!name || !text) return null;

			return {
				"@type": "Question",
				name,
				acceptedAnswer: {
					"@type": "Answer",
					text,
				},
			};
		})
		.filter(Boolean);

	if (!mainEntity.length) return null;

	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"@id": `${normalizeUrl(canonicalUrl)}#faq`,
		mainEntity,
	};
}
