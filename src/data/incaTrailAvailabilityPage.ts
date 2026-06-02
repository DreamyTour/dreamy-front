import type { SEOProps } from "@/components/layout/SEO.astro";
import type { Lang } from "@/lib/i18n";

export const incaTrailAvailabilitySlugMap: Record<Lang, string> = {
	en: "inca-trail-availability",
	es: "disponibilidad-camino-inca",
	pt: "disponibilidade-trilha-inca",
};

export const incaTrailAvailabilitySeoByLang: Record<Lang, SEOProps> = {
	en: {
		title: "Inca Trail Availability 2026 | Official Permits",
		description:
			"Check Inca Trail availability for 2026, official permit rules, advance booking requirements, related tours and reservation payment conditions.",
		type: "website",
		lang: "en",
		slugMap: incaTrailAvailabilitySlugMap,
	},
	es: {
		title: "Disponibilidad Camino Inca 2026 | Permisos Oficiales",
		description:
			"Consulta la disponibilidad del Camino Inca 2026, reglas de permisos oficiales, requisitos de reserva, tours relacionados y condiciones del pago de reserva.",
		type: "website",
		lang: "es",
		slugMap: incaTrailAvailabilitySlugMap,
	},
	pt: {
		title: "Disponibilidade Trilha Inca 2026 | Permissoes Oficiais",
		description:
			"Consulte a disponibilidade da Trilha Inca 2026, regras de permissoes oficiais, requisitos de reserva, tours relacionados e condicoes de pagamento.",
		type: "website",
		lang: "pt",
		slugMap: incaTrailAvailabilitySlugMap,
	},
};
