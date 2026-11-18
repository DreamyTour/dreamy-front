import type { Lang } from "./i18n";

const dayPrefixes: Record<Lang, string> = { es: "Día", en: "Day", pt: "Dia" };

/** Published editorial title first; geographic name only when the title is empty. */
export function dayMarkerTooltipLabel(
	day: string,
	title: string | undefined,
	location: string | undefined,
	lang: Lang,
) {
	const number = day.split(":").at(-1)?.trim() || day;
	const name = title?.trim() || location?.trim();
	const prefix = `${dayPrefixes[lang]} ${number}`;
	return name ? `${prefix}: ${name}` : prefix;
}
