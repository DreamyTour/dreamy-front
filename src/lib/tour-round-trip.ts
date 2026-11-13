import type { FeatureCollection, LineString, Point } from "geojson";
import type { RouteCoordinate, TransportMode } from "./tour-map-transport";

export interface RoundTripCandidate {
	id: string;
	mode: TransportMode | null;
	coordinates: RouteCoordinate[] | null;
	verifiedGpx?: boolean;
	requiresReview?: boolean;
}
export interface RoundTripDirection {
	partnerId: string;
	direction: "outbound" | "return";
	color: string;
}

// 25 cm accommodates coordinate rounding, not parallel tracks/roads or variants.
export const REVERSE_POINT_TOLERANCE_METRES = 0.25;
function distance(a: RouteCoordinate, b: RouteCoordinate) {
	const lat = ((a[1] + b[1]) * Math.PI) / 360;
	return Math.hypot((a[0] - b[0]) * Math.cos(lat), a[1] - b[1]) * 111_195;
}
export function isReverseGeometry(a: RouteCoordinate[], b: RouteCoordinate[]) {
	if (a.length < 2 || a.length !== b.length) return false;
	// Closed circuits have no unambiguous start/end direction in this first version.
	if (distance(a[0], a[a.length - 1]) < 10) return false;
	return a.every(
		(point, i) =>
			distance(point, b[b.length - 1 - i]) <= REVERSE_POINT_TOLERANCE_METRES,
	);
}
export function pairReverseRoutes(segments: RoundTripCandidate[]) {
	const pairs: Record<string, RoundTripDirection> = {};
	for (let i = 0; i < segments.length; i++) {
		const a = segments[i];
		if (
			pairs[a.id] ||
			!a.verifiedGpx ||
			a.requiresReview ||
			!a.coordinates ||
			!a.mode ||
			!["train", "bus", "boat"].includes(a.mode)
		)
			continue;
		for (const b of segments.slice(i + 1)) {
			if (
				pairs[b.id] ||
				!b.verifiedGpx ||
				b.requiresReview ||
				b.mode !== a.mode ||
				!b.coordinates ||
				!isReverseGeometry(a.coordinates, b.coordinates)
			)
				continue;
			// Segment order is itinerary order, independent of camera and visible day.
			pairs[a.id] = {
				partnerId: b.id,
				direction: "outbound",
				color: "#E77A28",
			};
			pairs[b.id] = { partnerId: a.id, direction: "return", color: "#DB5260" };
			break;
		}
	}
	return pairs;
}

export interface DirectionalSegment {
	id: string;
	coordinates: RouteCoordinate[];
	mode: string | null;
	presentation: RoundTripDirection;
}

export function roundTripFeatures(
	segments: DirectionalSegment[],
	markerCoordinates: RouteCoordinate[] = [],
): FeatureCollection<LineString | Point> {
	if (!segments.length) return { type: "FeatureCollection", features: [] };
	return {
		type: "FeatureCollection",
		features: [
			...segments.flatMap((segment) => {
				const offset = segments.some(
					(other) => other.id === segment.presentation.partnerId,
				)
					? 4
					: 0;
				const properties = {
					id: segment.id,
					color: segment.presentation.color,
					direction: segment.presentation.direction,
					mode: segment.mode,
					offset,
					arrowOffset: [0, offset],
				};
				return [
					{
						type: "Feature" as const,
						properties: { ...properties, kind: "route" },
						geometry: {
							type: "LineString" as const,
							coordinates: segment.coordinates,
						},
					},
					...[segment.coordinates[0], segment.coordinates.at(-1)]
						.filter((point): point is RouteCoordinate => Boolean(point))
						.map((point) => ({
							type: "Feature" as const,
							properties: { kind: "station" },
							geometry: { type: "Point" as const, coordinates: point },
						})),
				];
			}),
			...markerCoordinates.map((coordinates) => ({
				type: "Feature" as const,
				properties: { kind: "station" },
				geometry: { type: "Point" as const, coordinates },
			})),
		],
	};
}

export const roundTripLabels = {
	es: {
		outbound: "Ida",
		return: "Regreso",
		detail:
			"Flechas en el sentido del viaje; separación visual, sin cambiar el trazado.",
	},
	en: {
		outbound: "Outbound",
		return: "Return",
		detail:
			"Arrows follow travel direction; visual separation does not change the track.",
	},
	pt: {
		outbound: "Ida",
		return: "Volta",
		detail:
			"Setas no sentido da viagem; separação visual sem alterar o traçado.",
	},
};
