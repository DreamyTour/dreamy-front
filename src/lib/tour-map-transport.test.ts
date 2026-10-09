import { describe, expect, test } from "bun:test";
import {
	normalizeRouteGeometry,
	normalizeTransportMode,
} from "./tour-map-transport";

describe("CMS transport compatibility", () => {
	test("keeps old stops without a mode compatible and rejects unknown modes", () => {
		expect(normalizeTransportMode(undefined)).toBeNull();
		expect(normalizeTransportMode("car")).toBeNull();
		expect(normalizeTransportMode("walking")).toBe("walking");
		expect(normalizeTransportMode("bus")).toBe("bus");
		expect(normalizeTransportMode("train")).toBe("train");
		expect(normalizeTransportMode("flight")).toBe("flight");
	});
});

describe("reviewed CMS route geometry", () => {
	const coordinates: [number, number][] = [
		[-71.967, -13.532],
		[-72.264, -13.258],
	];
	test("accepts coordinate arrays, GeoJSON lines, and exported features", () => {
		expect(normalizeRouteGeometry(coordinates)).toEqual(coordinates);
		expect(normalizeRouteGeometry({ type: "LineString", coordinates })).toEqual(
			coordinates,
		);
		expect(
			normalizeRouteGeometry({
				type: "Feature",
				geometry: { type: "LineString", coordinates },
			}),
		).toEqual(coordinates);
	});
	test("does not fabricate a bridge across malformed coordinates", () => {
		for (const point of [
			[NaN, 1],
			[Infinity, 2],
			[181, 0],
			[0, -91],
			["-71", -13],
			null,
		]) {
			expect(
				normalizeRouteGeometry([coordinates[0], point, coordinates[1]]),
			).toBeNull();
		}
	});
	test("rejects polygon geometry, missing paths, single points, and excessive payloads", () => {
		expect(normalizeRouteGeometry({ type: "Polygon", coordinates })).toBeNull();
		expect(
			normalizeRouteGeometry({ type: "Feature", geometry: null }),
		).toBeNull();
		expect(normalizeRouteGeometry([coordinates[0]])).toBeNull();
		expect(normalizeRouteGeometry(Array(20_001).fill([0, 0]))).toBeNull();
	});
	test("preserves geographic zero and strips optional altitude", () => {
		expect(
			normalizeRouteGeometry([
				[0, 0, 100],
				[-1, 1, 200],
			]),
		).toEqual([
			[0, 0],
			[-1, 1],
		]);
	});
});
