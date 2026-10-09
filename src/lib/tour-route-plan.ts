import {
	normalizeRouteGeometry,
	normalizeTransportMode,
	type RouteCoordinate,
	type TransportMode,
} from "./tour-map-transport";

export interface RoutePlace {
	label: string;
	coordinates: RouteCoordinate;
}
export interface RouteLeg {
	id: string;
	destination: RoutePlace;
	mode: TransportMode;
	geometry?: RouteCoordinate[];
	provider?: string;
	kind?: "visit" | "waypoint" | "end";
}
export interface TourRoutePlan {
	version: 1;
	start: RoutePlace | null;
	legs: RouteLeg[];
	primaryLegId?: string;
}

export function normalizeRoutePlace(value: unknown): RoutePlace | null {
	if (!value || typeof value !== "object") return null;
	const item = value as Partial<RoutePlace>;
	const point = normalizeRouteGeometry([item.coordinates, item.coordinates]);
	if (!point || typeof item.label !== "string" || !item.label.trim())
		return null;
	return { label: item.label.trim().slice(0, 250), coordinates: point[0] };
}
export function normalizeTourRoutePlan(value: unknown): TourRoutePlan | null {
	if (!value || typeof value !== "object") return null;
	const plan = value as Partial<TourRoutePlan>;
	if (plan.version !== 1 || !Array.isArray(plan.legs) || plan.legs.length > 50)
		return null;
	const legs: RouteLeg[] = [];
	for (const item of plan.legs) {
		if (!item || typeof item !== "object") return null;
		const destination = normalizeRoutePlace(item.destination);
		const mode = normalizeTransportMode(item.mode);
		if (
			!destination ||
			!mode ||
			typeof item.id !== "string" ||
			!item.id ||
			legs.some((leg) => leg.id === item.id)
		)
			return null;
		legs.push({
			id: item.id.slice(0, 100),
			destination,
			kind:
				item.kind === "visit" || item.kind === "waypoint" || item.kind === "end"
					? item.kind
					: undefined,
			mode,
			geometry: normalizeRouteGeometry(item.geometry) ?? undefined,
			provider:
				typeof item.provider === "string"
					? item.provider.slice(0, 100)
					: undefined,
		});
	}
	return {
		version: 1,
		start: normalizeRoutePlace(plan.start),
		legs,
		primaryLegId: legs.some(
			(leg) =>
				leg.id === plan.primaryLegId &&
				leg.kind !== "end" &&
				leg.kind !== "waypoint",
		)
			? plan.primaryLegId
			: undefined,
	};
}
export function routePlanVisits(value: unknown): RouteLeg[] {
	return (
		normalizeTourRoutePlan(value)?.legs.filter(
			(leg) => leg.kind !== "end" && leg.kind !== "waypoint",
		) ?? []
	);
}
export function routePlanHighlight(value: unknown): RoutePlace | null {
	const plan = normalizeTourRoutePlan(value);
	const visits = routePlanVisits(plan);
	return (
		(visits.find((leg) => leg.id === plan?.primaryLegId) ?? visits[0])
			?.destination ?? routePlanDestination(plan)
	);
}
export function routePlanDestination(value: unknown): RoutePlace | null {
	const plan = normalizeTourRoutePlan(value);
	return plan?.legs.at(-1)?.destination ?? plan?.start ?? null;
}
export function geometryMatchesEndpoints(
	geometry: RouteCoordinate[],
	from: RouteCoordinate,
	to: RouteCoordinate,
	mode: TransportMode,
) {
	const tolerance = mode === "walking" ? 0.01 : 0.05;
	return [from, to].every((point, index) => {
		const actual = index === 0 ? geometry[0] : geometry[geometry.length - 1];
		return Math.hypot(point[0] - actual[0], point[1] - actual[1]) <= tolerance;
	});
}
export function routePlanSegments(
	plan: TourRoutePlan,
	inheritedStart: RoutePlace | null,
) {
	let previous = inheritedStart ?? plan.start;
	const segments = [];
	for (const leg of plan.legs) {
		if (previous)
			segments.push({
				id: leg.id,
				label: leg.destination.label,
				from: previous.coordinates,
				to: leg.destination.coordinates,
				mode: leg.mode,
				coordinates:
					leg.geometry &&
					geometryMatchesEndpoints(
						leg.geometry,
						previous.coordinates,
						leg.destination.coordinates,
						leg.mode,
					)
						? leg.geometry
						: null,
				provider: leg.provider,
			});
		previous = leg.destination;
	}
	return segments;
}
