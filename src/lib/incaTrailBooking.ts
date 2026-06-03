export interface IncaTrailBookingConfig {
	road: string;
	durationDays: number;
}

const INCA_TRAIL_BOOKING_CONFIGS: Record<string, IncaTrailBookingConfig> = {
	"trilha-inca-2-dias": {
		road: "5",
		durationDays: 2,
	},
	"short-inca-trail-2-days": {
		road: "5",
		durationDays: 2,
	},
	"camino-inca-corto-2-dias": {
		road: "5",
		durationDays: 2,
	},
	"camino-inca-4-dias": {
		road: "1",
		durationDays: 4,
	},
	"inca-trail-4-days": {
		road: "1",
		durationDays: 4,
	},
	"trilha-inca-4-dias": {
		road: "1",
		durationDays: 4,
	},
};

export function getIncaTrailBookingConfig(
	slug?: string,
): IncaTrailBookingConfig | null {
	if (!slug) return null;

	return INCA_TRAIL_BOOKING_CONFIGS[slug.replace(/^\/|\/$/g, "")] ?? null;
}
