export const LANGS = ["en", "es", "pt"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";
export const LOCALIZED_LANGS = LANGS.filter(
	(lang): lang is Exclude<Lang, typeof DEFAULT_LANG> => lang !== DEFAULT_LANG,
);

const LANG_PREFIX_RE = /^\/(en|es|pt)(?=\/|$)/;

export function isValidLang(value: string | undefined): value is Lang {
	return !!value && LANGS.includes(value as Lang);
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

export function stripLangPrefix(path: string): string {
	const { path: pathname, suffix } = splitUrlPath(normalizePath(path));
	const stripped = pathname.replace(LANG_PREFIX_RE, "") || "/";
	return `${stripped}${suffix}`;
}

export function localizePath(path: string, lang: Lang): string {
	const normalized = stripLangPrefix(path);
	const { path: pathname, suffix } = splitUrlPath(normalized);

	if (lang === DEFAULT_LANG) {
		return `${pathname}${suffix}` || "/";
	}

	const localizedPath = pathname === "/" ? `/${lang}` : `/${lang}${pathname}`;
	return `${localizedPath}${suffix}`;
}

export function rewriteUrl(url: string | undefined, currentLang: Lang): string {
	if (!url || url === "#") return url || "#";
	if (url.startsWith("http")) return url;

	return localizePath(url, currentLang);
}
