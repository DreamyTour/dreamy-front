export const LANGS = ["en", "es", "pt"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";
export const LOCALIZED_LANGS = LANGS.filter(
	(lang): lang is Exclude<Lang, typeof DEFAULT_LANG> => lang !== DEFAULT_LANG,
);

const LANG_PREFIX_RE = /^\/(en|es|pt)(?=\/|$)/;
const BLOG_SEGMENT_RE =
	/^((?:\/(?:en|es|pt))?)\/blog\/([^/?#]+)(?:\/blog\/\2)+(\/)?$/;

export function isValidLang(value: string | undefined): value is Lang {
	return !!value && LANGS.includes(value as Lang);
}

export function getAvailableLanguages(
	slugMap?: Partial<Record<Lang, string>>,
	currentLang?: Lang,
): readonly Lang[] {
	if (!slugMap || Object.keys(slugMap).length === 0) return LANGS;

	return LANGS.filter((lang) => lang === currentLang || Boolean(slugMap[lang]));
}

function splitUrlPath(url: string): { path: string; suffix: string } {
	const match = url.match(/^([^?#]*)([?#].*)?$/);
	return {
		path: match?.[1] || "/",
		suffix: match?.[2] || "",
	};
}

function normalizePath(path: string): string {
	return path.startsWith("/") ? path : `/${path}`;
}

export function collapseRepeatedBlogPath(path: string): string {
	const { path: pathname, suffix } = splitUrlPath(normalizePath(path));
	const collapsed = pathname.replace(
		BLOG_SEGMENT_RE,
		(_, langPrefix: string, slug: string, trailingSlash: string) =>
			`${langPrefix}/blog/${slug}${trailingSlash || ""}`,
	);

	return `${collapsed}${suffix}`;
}

export function stripLangPrefix(path: string): string {
	const { path: pathname, suffix } = splitUrlPath(
		collapseRepeatedBlogPath(path),
	);
	const stripped = pathname.replace(LANG_PREFIX_RE, "") || "/";
	return `${stripped}${suffix}`;
}

export function stripDefaultLangPrefix(path: string): string {
	const { path: pathname, suffix } = splitUrlPath(normalizePath(path));
	const defaultLangPrefix = new RegExp(`^/${DEFAULT_LANG}(?=/|$)`);
	const stripped = pathname.replace(defaultLangPrefix, "") || "/";
	return `${stripped}${suffix}`;
}

export function localizePath(path: string, lang: Lang): string {
	// These targets are not localized HTML pages.
	if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(path)) return path;
	const originalPath = splitUrlPath(normalizePath(path)).path;
	if (
		/\/[^/]*\.[^/]+\/?$/.test(originalPath) ||
		/^\/(?:api|_astro|_server-islands|cdn-cgi)(?:\/|$)/.test(originalPath)
	)
		return path;

	const normalized = stripLangPrefix(path);
	const { path: pathname, suffix } = splitUrlPath(normalized);
	const localizedPath =
		lang === DEFAULT_LANG ? pathname : `/${lang}${pathname}`;
	// Cloudflare serves prerendered directory pages with a trailing slash.
	return `${localizedPath.replace(/\/+$/, "")}/${suffix}`;
}

export function rewriteUrl(url: string | undefined, currentLang: Lang): string {
	if (!url || url === "#") return url || "#";
	if (url.startsWith("http")) return url;

	return localizePath(url, currentLang);
}

export function translatePathForSlug(
	path: string,
	translatedSlug: string,
): string {
	const normalized = stripLangPrefix(path);
	const { path: pathname, suffix } = splitUrlPath(normalized);

	if (pathname.includes("/blog/")) {
		return `${pathname.replace(
			/\/blog\/[^/]+(?=\/|$)/,
			`/blog/${translatedSlug}`,
		)}${suffix}`;
	}

	return `${pathname.replace(/\/[^/]+(?=\/|$)/, `/${translatedSlug}`)}${suffix}`;
}

// Slugs are joined by documentId by the route loaders, never by their spelling.
export type LocalizedHrefMap = Partial<Record<Lang, string>>;
export type LocalizedPageCounts = Partial<Record<Lang, number>>;

type LanguageUrlOptions = {
	pathname: string;
	slugMap?: Partial<Record<Lang, string>>;
	pageCounts?: LocalizedPageCounts;
};

export function resolveLanguageUrls({
	pathname,
	slugMap,
	pageCounts,
}: LanguageUrlOptions): LocalizedHrefMap {
	const urls: LocalizedHrefMap = {};
	// Inspect only route shape. Destination slugs always come from slugMap.
	const path = stripLangPrefix(pathname).replace(/\/+$/, "") || "/";
	const index = path.match(/^\/blog(?:\/(\d+))?$/);
	const category = path.match(/^\/blog\/[^/]+(?:\/(\d+))?$/);
	const page = Number(index?.[1] || category?.[1] || 1);
	if (!Number.isSafeInteger(page) || page < 1) return urls;
	for (const locale of LANGS) {
		if (index) {
			if (!pageCounts || (pageCounts[locale] ?? 0) < page) continue;
			urls[locale] = localizePath(
				page === 1 ? "/blog" : `/blog/${page}`,
				locale,
			);
		} else if (slugMap !== undefined) {
			const slug = slugMap[locale];
			if (slug === undefined) continue;
			if (!slug.trim() || /[/?#]/.test(slug) || slug !== slug.trim()) {
				console.warn(
					`[i18n] Invalid slug for ${locale}; language link omitted.`,
				);
				continue;
			}
			if (category && pageCounts && (pageCounts[locale] ?? 0) < page) continue;
			if (category?.[1] && !pageCounts) continue;
			const target = category
				? `/blog/${slug}${page > 1 ? `/${page}` : ""}`
				: `/${slug}`;
			urls[locale] = localizePath(target, locale);
		} else if (["/", "/checkout", "/checkout/success"].includes(path)) {
			// Explicit static routes that exist in all three locales.
			urls[locale] = localizePath(path, locale);
		}
	}
	return urls;
}
