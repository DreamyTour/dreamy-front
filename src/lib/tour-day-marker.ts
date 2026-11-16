import { normalizeTourRoutePlan, type RoutePlace } from "./tour-route-plan";

/** Presentation only. Never infer a hotel or attraction from editorial text. */
export function dayMarkerPlace(
	value: unknown,
	fallback: RoutePlace,
	inheritedStart?: RoutePlace | null,
): RoutePlace {
	const plan = normalizeTourRoutePlan(value);
	const end = plan?.legs.at(-1)?.destination ?? plan?.start;
	if (!plan || !end) return fallback;
	const start = plan.start ?? inheritedStart;
	// Six decimal coordinates are the public routing precision (~0.11 m),
	// not a tolerance for treating nearby stations/towns as the same place.
	const closed = start?.coordinates.every(
		(n, i) => Math.round(n * 1e6) === Math.round(end.coordinates[i] * 1e6),
	);
	const primary = plan.legs.find(
		(leg) =>
			leg.id === plan.primaryLegId &&
			leg.kind !== "end" &&
			leg.kind !== "waypoint",
	);
	return closed && primary ? primary.destination : end;
}
