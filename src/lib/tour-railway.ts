import type { FeatureCollection, LineString } from "geojson";
import type { RouteCoordinate } from "./tour-map-transport";

export interface RailwaySegment {
	id: string;
	coordinates: RouteCoordinate[];
	fromLabel: string;
	toLabel: string;
	day?: string;
}

/** Exact deduplication only: variants remain separate, including partial overlaps. */
export function railwayFeatures(
	segments: RailwaySegment[],
): FeatureCollection<LineString> {
	const features: FeatureCollection<LineString>["features"] = [];
	const seen = new Map<string, number>();
	for (const segment of segments) {
		if (segment.coordinates.length < 2) continue;
		const forward = JSON.stringify(segment.coordinates);
		const backward = JSON.stringify([...segment.coordinates].reverse());
		const key = forward < backward ? forward : backward;
		const existing = seen.get(key);
		if (existing !== undefined) {
			features[existing].properties?.segmentIds.push(segment.id);
			continue;
		}
		seen.set(key, features.length);
		features.push({
			type: "Feature",
			properties: { segmentIds: [segment.id] },
			geometry: { type: "LineString", coordinates: segment.coordinates },
		});
	}
	return { type: "FeatureCollection", features };
}
