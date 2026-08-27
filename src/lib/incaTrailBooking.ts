export interface IncaTrailBookingConfig {
	road: string;
	durationDays: number;
	permitStartOffsetDays: number;
	isPrimaryAvailabilityTour: boolean;
}

function mapSlugsToConfig(
	slugs: string[],
	config: IncaTrailBookingConfig,
): Record<string, IncaTrailBookingConfig> {
	return Object.fromEntries(slugs.map((slug) => [slug, config]));
}

const INCA_TRAIL_BOOKING_CONFIGS: Record<string, IncaTrailBookingConfig> = {
	...mapSlugsToConfig(
		[
			"trilha-inca-2-dias",
			"short-inca-trail-2-days",
			"camino-inca-corto-2-dias",
		],
		{
			road: "5",
			durationDays: 2,
			permitStartOffsetDays: 0,
			isPrimaryAvailabilityTour: true,
		},
	),
	...mapSlugsToConfig(
		["camino-inca-4-dias", "inca-trail-4-days", "trilha-inca-4-dias"],
		{
			road: "1",
			durationDays: 4,
			permitStartOffsetDays: 0,
			isPrimaryAvailabilityTour: true,
		},
	),
	...mapSlugsToConfig(
		[
			"camino-inca-full-day-privado",
			"private-full-day-inca-trail",
			"trilha-inca-full-day-privado",
		],
		{
			road: "5",
			durationDays: 1,
			permitStartOffsetDays: 0,
			isPrimaryAvailabilityTour: false,
		},
	),
	...mapSlugsToConfig(
		[
			"lares-trek-camino-inca-corto-4-dias",
			"lares-trek-short-inca-trail-4-days",
			"lares-trek-caminho-inca-curto-4-dias",
		],
		{
			road: "5",
			durationDays: 4,
			permitStartOffsetDays: 2,
			isPrimaryAvailabilityTour: false,
		},
	),
	...mapSlugsToConfig(
		[
			"salkantay-camino-inca-6-dias",
			"salkantay-inca-trail-to-6-days",
			"salkantay-caminho-inca-6-dias",
		],
		{
			road: "1",
			durationDays: 6,
			permitStartOffsetDays: 2,
			isPrimaryAvailabilityTour: false,
		},
	),
};

export function getIncaTrailBookingConfig(
	slug?: string,
): IncaTrailBookingConfig | null {
	if (!slug) return null;

	return INCA_TRAIL_BOOKING_CONFIGS[slug.replace(/^\/|\/$/g, "")] ?? null;
}
