import source from "./purpose/es.json";
import translations from "./purpose/translations.json";
import type { Lang } from "@/lib/i18n";

export const normalizePurposeText = (text: string) =>
	text.replace(/\s+/g, " ").trim();
const ids = new Map(
	Object.entries(source).map(([id, text]) => [normalizePurposeText(text), id]),
);
const entries: Record<string, string[]> = translations;

/** Editorial translations are resolved on the server; no translation code is shipped to the browser. */
export function purposeText(text: string, lang: Lang): string {
	if (lang === "es") return text;
	const key = normalizePurposeText(text);
	const index = lang === "en" ? 0 : 1;
	const id = ids.get(key);
	const exact = id && entries[id]?.[index];
	if (exact) return exact;
	const t = (value: string) => purposeText(value, lang);
	if (key.startsWith("Conoce el tour: "))
		return `${t("Conoce el tour")}: ${t(key.slice(15))}`;
	if (key.startsWith(": ")) return `: ${t(key.slice(2))}`;
	for (const [prefix, en, pt] of [
		["Ampliar fotos de ", "Enlarge photos of ", "Ampliar fotos de "],
		["Fotos de ", "Photos of ", "Fotos de "],
		["Foto anterior de ", "Previous photo of ", "Foto anterior de "],
		["Foto siguiente de ", "Next photo of ", "Próxima foto de "],
	]) {
		if (key.startsWith(prefix))
			return (index === 0 ? en : pt) + t(key.slice(prefix.length));
	}
	let match = key.match(/^Mostrar foto (\d+) de (.+)$/);
	if (match)
		return index === 0
			? `Show photo ${match[1]} of ${t(match[2])}`
			: `Mostrar foto ${match[1]} de ${t(match[2])}`;
	match = key.match(/^Foto (\d+) de (\d+)$/);
	if (match)
		return index === 0
			? `Photo ${match[1]} of ${match[2]}`
			: `Foto ${match[1]} de ${match[2]}`;
	match = key.match(
		/^(.+): recuerdo (\d+) de la campaña navideña de Dreamy Tours$/,
	);
	if (match)
		return index === 0
			? `${t(match[1])}: photo ${match[2]} from the Dreamy Tours Christmas campaign`
			: `${t(match[1])}: lembrança ${match[2]} da campanha de Natal da Dreamy Tours`;
	match = key.match(/^(.+) · (\d{4}|\d+ \/ \d+)$/);
	if (match) return `${t(match[1])} · ${match[2]}`;
	if (key.startsWith("Tour base: "))
		return `${index === 0 ? "Base tour" : "Tour base"}: ${t(key.slice(11))}`;
	if (/^(?:\d+\s*(?:d[ií]as?|noches?|horas?)\s*(?:\/\s*)?)+$/i.test(key)) {
		return key
			.replace(/d[ií]as?/gi, index === 0 ? "days" : "dias")
			.replace(/noches?/gi, index === 0 ? "nights" : "noites")
			.replace(/horas?/gi, index === 0 ? "hours" : "horas");
	}
	if (/^d[ií]a completo$/i.test(key))
		return index === 0 ? "Full day" : "Dia inteiro";
	if (key === "Otro") return index === 0 ? "Other" : "Outro";
	return text;
}
