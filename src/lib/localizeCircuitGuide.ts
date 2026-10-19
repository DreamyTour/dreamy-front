import { type DefaultTreeAdapterMap, parseFragment, serialize } from "parse5";
import {
	circuitOverviewPath,
	localizedRoutePath,
	translatedCircuits,
	translatedRoutes,
} from "@/data/circuitGuideTranslations";
import { circuitGuides, circuitRouteGuides } from "@/data/machuPicchuGuide";
import { circuitGuideUi } from "@/i18n/circuitGuideUi";
import type { Lang } from "./i18n";

const normalize = (value: string) => value.replace(/\s+/gi, " ").trim();
const dictionaries = new Map<Lang, Map<string, string>>();
function dictionary(lang: "en" | "pt") {
	const cached = dictionaries.get(lang);
	if (cached) return cached;
	const result = new Map(
		Object.entries(circuitGuideUi).map(([key, values]) => [
			normalize(key),
			values[lang === "en" ? 0 : 1],
		]),
	);
	const add = (
		source: Record<string, unknown>,
		target: Record<string, unknown>,
	) => {
		for (const [key, value] of Object.entries(target)) {
			const original = source[key];
			if (typeof value === "string" && typeof original === "string")
				result.set(normalize(original), value);
			if (Array.isArray(value) && Array.isArray(original))
				value.forEach((text, index) => {
					result.set(normalize(original[index]), text);
				});
		}
	};
	circuitGuides.forEach((item, index) => {
		add(item, translatedCircuits[lang][index]);
		const source = `Mapa general del circuito ${item.number}: ${item.name}`;
		const target = `${lang === "en" ? "Overview map of circuit" : "Mapa geral do circuito"} ${item.number}: ${translatedCircuits[lang][index].name}`;
		result.set(source, target);
		result.set(
			`Ampliar ${source.toLowerCase()}`,
			`${lang === "en" ? "Enlarge" : "Ampliar"} ${target}`,
		);
	});
	circuitRouteGuides.forEach((item, index) => {
		add(
			item as unknown as Record<string, unknown>,
			translatedRoutes[lang][index],
		);
		const source = `Mapa de la ruta ${item.code}: ${item.name}`;
		const target = `${lang === "en" ? "Map of route" : "Mapa da rota"} ${item.code}: ${translatedRoutes[lang][index].name}`;
		result.set(source, target);
		result.set(
			`Ampliar ${source.toLowerCase()}`,
			`${lang === "en" ? "Enlarge" : "Ampliar"} ${target}`,
		);
	});
	dictionaries.set(lang, result);
	return result;
}

export function circuitText(value: string, lang: Lang): string {
	if (lang === "es") return value;
	const text = normalize(value);
	if (!text) return value;
	const map = dictionary(lang);
	const direct = map.get(text);
	if (direct) return direct;
	// Dynamic titles and accessible names contain a stable route code or number.
	let translated = text;
	for (const [source, target] of [...map]
		.filter(([source]) => source.length > 4)
		.sort((a, b) => b[0].length - a[0].length)) {
		translated = translated.replace(
			new RegExp(source.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&"), "gi"),
			() => target,
		);
	}
	const terms: [RegExp, string][] =
		lang === "en"
			? [
					[
						/Las 10 rutas de los circuitos de Machu Picchu/gi,
						"The 10 routes of the Machu Picchu circuits",
					],
					[/Mapa general del circuito/gi, "Overview map of circuit"],
					[/Mapa general · Circuito/gi, "Overview map · Circuit"],
					[/Mapa de la ruta/gi, "Map of route"],
					[/Mapa individual · Ruta/gi, "Individual map · Route"],
					[/Rutas del circuito/gi, "Routes in circuit"],
					[/Otras rutas del circuito/gi, "Other routes in circuit"],
					[/Ampliar /gi, "Enlarge "],
					[/Ruta /gi, "Route "],
					[/Circuito /gi, "Circuit "],
				]
			: [
					[
						/Las 10 rutas de los circuitos de Machu Picchu/gi,
						"As 10 rotas dos circuitos de Machu Picchu",
					],
					[/Mapa general del circuito/gi, "Mapa geral do circuito"],
					[/Mapa general · Circuito/gi, "Mapa geral · Circuito"],
					[/Mapa de la ruta/gi, "Mapa da rota"],
					[/Mapa individual · Ruta/gi, "Mapa individual · Rota"],
					[/Rutas del circuito/gi, "Rotas do circuito"],
					[/Otras rutas del circuito/gi, "Outras rotas do circuito"],
					[/Ruta /gi, "Rota "],
				];
	for (const [pattern, replacement] of terms.sort(
		(a, b) => b[0].source.length - a[0].source.length,
	))
		translated = translated.replace(pattern, replacement);
	return translated;
}

export function circuitHref(value: string, lang: Lang) {
	if (lang === "es" || !value.startsWith("/es/")) return value;
	if (value === "/es/") return lang === "en" ? "/" : "/pt/";
	if (value === "/es/planea-tu-viaje/")
		return lang === "en" ? "/plan-your-trip/" : "/pt/planeje-sua-viagem/";
	const match = value.match(
		/^\/es\/circuitos-machupicchu\/(ruta-[123]-[abcd])\/$/,
	);
	if (match) return localizedRoutePath(match[1], lang);
	return value.replace("/es/circuitos-machupicchu/", circuitOverviewPath[lang]);
}

export function localizeCircuitGuideHtml(html: string, lang: Lang) {
	if (lang === "es") return html;
	const fragment = parseFragment(html);
	type Node = DefaultTreeAdapterMap["node"];
	function visit(node: Node) {
		if ("tagName" in node && ["script", "style", "svg"].includes(node.tagName))
			return;
		if (node.nodeName === "#text" && "value" in node) {
			const original = node.value;
			const text = circuitText(original, lang);
			node.value =
				(original.match(/^\s*/)?.[0] ?? "") +
				text +
				(original.match(/\s*$/)?.[0] ?? "");
		}
		if ("attrs" in node)
			for (const attr of node.attrs) {
				if (["aria-label", "alt", "title"].includes(attr.name))
					attr.value = circuitText(attr.value, lang);
				if (attr.name === "href") attr.value = circuitHref(attr.value, lang);
			}
		if ("childNodes" in node) node.childNodes.forEach(visit);
	}
	visit(fragment);
	return serialize(fragment);
}
