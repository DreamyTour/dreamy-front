import type { Lang } from "@/lib/i18n";

const PLAN_TRIP_SLUGS: Record<Lang, string> = {
	en: "plan-your-trip",
	es: "planea-tu-viaje",
	pt: "planeje-sua-viagem",
};

export function getPlanTripHref(lang: Lang): string {
	const slug = PLAN_TRIP_SLUGS[lang];

	return lang === "en" ? `/${slug}` : `/${lang}/${slug}`;
}
