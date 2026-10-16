import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";
import { countries } from "@/data/countries";
import { purposeText } from "@/i18n/purpose";
import { localizePath, stripLangPrefix, type Lang } from "@/lib/i18n";
import {
	purposeSlugs,
	purposeHref,
	type PurposePage,
} from "@/lib/purposeRoutes";
import { fetchAllStrapi } from "@/lib/strapi";

type Node = DefaultTreeAdapterMap["node"];
type TourLink = { documentId: string; slug: string };
const countryCodes = new Map(
	countries.map((country) => [country.nameES, country.iso2]),
);
const textAttrs = new Set([
	"alt",
	"title",
	"aria-label",
	"placeholder",
	"data-title",
	"data-alt",
]);

export async function purposeLinkMap(lang: Lang) {
	if (lang === "es") return new Map<string, string>();
	const [original, localized, pages, localizedPages] = await Promise.all([
		fetchAllStrapi<TourLink>({
			endpoint: "tours",
			locale: "es",
			query: { "fields[0]": "slug" },
		}),
		fetchAllStrapi<TourLink>({
			endpoint: "tours",
			locale: lang,
			query: { "fields[0]": "slug" },
		}),
		fetchAllStrapi<TourLink>({
			endpoint: "pages",
			locale: "es",
			query: { "fields[0]": "slug" },
		}),
		fetchAllStrapi<TourLink>({
			endpoint: "pages",
			locale: lang,
			query: { "fields[0]": "slug" },
		}),
	]);
	const byId = new Map(
		[...localized, ...localizedPages].map((item) => [
			item.documentId,
			item.slug,
		]),
	);
	const result = new Map<string, string>();
	for (const item of [...original, ...pages]) {
		const slug = byId.get(item.documentId);
		if (slug) result.set(`/${item.slug}`, localizePath(`/${slug}`, lang));
	}
	return result;
}

export function localizePurposeHtml(
	html: string,
	lang: Lang,
	links = new Map<string, string>(),
) {
	if (lang === "es") return html;
	const fragment = parseFragment(html, { scriptingEnabled: false });
	const countryNames = new Intl.DisplayNames([lang], { type: "region" });
	function href(value: string) {
		if (
			value ===
			"mailto:info@dreamy.tours?subject=Proyecto%20Social%20Dreamy%20Tours"
		) {
			return `mailto:info@dreamy.tours?subject=${encodeURIComponent(lang === "en" ? "Social Project Dreamy Tours" : "Projeto Social Dreamy Tours")}`;
		}
		if (!value.startsWith("/es/")) return value;
		const pathname = stripLangPrefix(value).replace(/\/$/, "");
		for (const page of Object.keys(purposeSlugs) as PurposePage[]) {
			if (pathname === `/${purposeSlugs[page].es}`)
				return purposeHref(page, lang);
		}
		const staticPages: Record<string, string> = {
			"/planea-tu-viaje":
				lang === "en" ? "/plan-your-trip" : "/planeje-sua-viagem",
			"/politicas-privacidad":
				lang === "en" ? "/privacy-policy" : "/politicas-de-privacidade",
		};
		return (
			links.get(pathname) ??
			localizePath(staticPages[pathname] ?? pathname, lang)
		);
	}
	function visit(node: Node) {
		if ("tagName" in node && ["script", "style", "svg"].includes(node.tagName))
			return;
		if (node.nodeName === "#text" && "value" in node) {
			const original = node.value;
			const code =
				node.parentNode &&
				"tagName" in node.parentNode &&
				node.parentNode.tagName === "option"
					? countryCodes.get(original.trim())
					: undefined;
			const translated = code
				? countryNames.of(code)
				: purposeText(original, lang);
			if (translated && translated !== original) {
				node.value =
					(original.match(/^\s*/)?.[0] ?? "") +
					translated +
					(original.match(/\s*$/)?.[0] ?? "");
			}
		}
		if ("attrs" in node) {
			for (const attr of node.attrs) {
				if (textAttrs.has(attr.name))
					attr.value = purposeText(attr.value, lang);
				if (attr.name === "href") attr.value = href(attr.value);
			}
			if (
				node.tagName === "inclusive-enquiry" ||
				node.tagName === "project-gallery"
			) {
				const existing = node.attrs.find((attr) => attr.name === "data-lang");
				if (existing) existing.value = lang;
				else node.attrs.push({ name: "data-lang", value: lang });
			}
		}
		if ("childNodes" in node) node.childNodes.forEach(visit);
	}
	visit(fragment);
	return serialize(fragment);
}
