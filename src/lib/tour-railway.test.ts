import { describe, expect, test } from "bun:test";
import type { RouteCoordinate } from "./tour-map-transport";
import { type RailwaySegment, railwayFeatures } from "./tour-railway";

const points: RouteCoordinate[] = [
	[-72.26, -13.25],
	[-72.3, -13.21],
	[-72.52, -13.15],
];
const route = (id: string, coordinates = points): RailwaySegment => ({
	id,
	coordinates,
	fromLabel: "A",
	toLabel: "B",
});
describe("railway presentation only", () => {
	test("draws exact inverse or identical paths once and retains both journey ids", () => {
		const segments = [
			route("out"),
			route("back", [...points].reverse()),
			route("repeat"),
		];
		const before = JSON.stringify(segments);
		const data = railwayFeatures(segments);
		expect(data.features).toHaveLength(1);
		expect(data.features[0].properties?.segmentIds).toEqual([
			"out",
			"back",
			"repeat",
		]);
		expect(data.features[0].geometry.coordinates).toEqual(points);
		expect(JSON.stringify(segments)).toBe(before);
	});
	test("keeps variants, partial overlaps and differently sampled routes", () => {
		expect(
			railwayFeatures([
				route("a"),
				route("variant", [points[0], [-72.31, -13.21], points[2]]),
				route("partial", points.slice(1)),
				route(
					"parallel",
					points.map(([x, y]) => [x + 0.0000001, y]),
				),
			]).features,
		).toHaveLength(4);
	});
	test("day 2 keeps its own complete reversed coordinates without an offset", () => {
		const reverse = [...points].reverse();
		expect(
			railwayFeatures([route("back", reverse)]).features[0].geometry
				.coordinates,
		).toEqual(reverse);
		expect(railwayFeatures([]).features).toEqual([]);
		expect(railwayFeatures([route("invalid", [])]).features).toEqual([]);
	});
});
