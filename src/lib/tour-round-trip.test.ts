import { describe, expect, test } from "bun:test";
import type { RouteCoordinate } from "./tour-map-transport";
import {
	isReverseGeometry,
	pairReverseRoutes,
	type RoundTripCandidate,
	roundTripFeatures,
} from "./tour-round-trip";

const forward: RouteCoordinate[] = [
	[-72.27, -13.26],
	[-72.35, -13.22],
	[-72.51, -13.18],
];
const backward = [...forward].reverse();
const segment = (id: string, coordinates = forward): RoundTripCandidate => ({
	id,
	coordinates,
	mode: "train",
	verifiedGpx: true,
});

describe("inverse GPX presentation without data changes", () => {
	test("pairs the full inverse path in itinerary order, without mutation", () => {
		const segments = [segment("day1"), segment("day2", backward)];
		const before = JSON.stringify(segments);
		const pairs = pairReverseRoutes(segments);
		expect(pairs.day1).toEqual({
			partnerId: "day2",
			direction: "outbound",
			color: "#E77A28",
		});
		expect(pairs.day2).toEqual({
			partnerId: "day1",
			direction: "return",
			color: "#DB5260",
		});
		expect(JSON.stringify(segments)).toBe(before);
	});
	test("accepts coordinate rounding under 25 cm, rejects a nearby parallel track", () => {
		const rounded = backward.map(
			([x, y]) => [x + 0.0000001, y] as RouteCoordinate,
		);
		expect(isReverseGeometry(forward, rounded)).toBe(true);
		expect(
			isReverseGeometry(
				forward,
				backward.map(([x, y]) => [x + 0.00003, y]),
			),
		).toBe(false);
	});
	test("does not pair same direction, variants, partial overlap, closed loops or different sampling", () => {
		expect(isReverseGeometry(forward, forward)).toBe(false);
		expect(
			isReverseGeometry(forward, [backward[0], [-72.36, -13.22], backward[2]]),
		).toBe(false);
		expect(isReverseGeometry(forward, backward.slice(1))).toBe(false);
		expect(
			isReverseGeometry(
				[forward[0], forward[1], forward[0]],
				[forward[0], forward[1], forward[0]],
			),
		).toBe(false);
	});
	test("only matches saved current GPX of the same supported mode", () => {
		for (const mode of ["train", "bus", "boat"] as const) {
			expect(
				Object.keys(
					pairReverseRoutes([
						{ ...segment("a"), mode },
						{ ...segment("b", backward), mode },
					]),
				),
			).toHaveLength(2);
		}
		for (const invalid of [
			{ verifiedGpx: false },
			{ requiresReview: true },
			{ mode: "walking" as const },
			{ mode: "flight" as const },
			{ coordinates: null },
		])
			expect(
				pairReverseRoutes([
					segment("a"),
					{ ...segment("b", backward), ...invalid },
				]),
			).toEqual({});
	});
	test("pairs repeated trips once each and does not discard unrelated routes", () => {
		const pairs = pairReverseRoutes([
			segment("a"),
			segment("b", backward),
			segment("c"),
			segment("d", backward),
			segment("other"),
		]);
		expect(Object.keys(pairs)).toHaveLength(4);
		expect(pairs.other).toBeUndefined();
	});
});

describe("native presentation data", () => {
	test("keeps exact vertices and offsets only simultaneously visible partners", () => {
		const candidates = [segment("a"), segment("b", backward)];
		const pairs = pairReverseRoutes(candidates);
		const segments = candidates.map((s) => ({
			id: s.id,
			coordinates: s.coordinates ?? [],
			mode: s.mode,
			presentation: pairs[s.id],
		}));
		const before = JSON.stringify(segments);
		const routes = roundTripFeatures(segments).features.filter(
			(f) => f.geometry.type === "LineString",
		);
		expect(routes).toHaveLength(2);
		expect(routes.map((f) => f.geometry.coordinates)).toEqual([
			forward,
			backward,
		]);
		expect(routes.map((f) => f.properties?.offset)).toEqual([4, 4]);
		expect(routes.map((f) => f.properties?.arrowOffset)).toEqual([
			[0, 4],
			[0, 4],
		]);
		for (const segment of segments) {
			const route = roundTripFeatures([segment]).features[0];
			expect(route.geometry.coordinates).toEqual(segment.coordinates);
			expect(route.properties?.offset).toBe(0);
			expect(route.properties?.arrowOffset).toEqual([0, 0]);
		}
		expect(JSON.stringify(segments)).toBe(before);
	});
	test("reserves station collision boxes without adding connector geometry", () => {
		const pair = pairReverseRoutes([segment("a"), segment("b", backward)]);
		const features = roundTripFeatures([
			{ id: "a", mode: "train", coordinates: forward, presentation: pair.a },
		]).features;
		expect(features).toHaveLength(3);
		expect(features.slice(1).map((f) => f.geometry.coordinates)).toEqual([
			forward[0],
			forward[forward.length - 1],
		]);
		expect(roundTripFeatures([]).features).toEqual([]);
		expect(roundTripFeatures([], forward).features).toEqual([]);
		expect(
			roundTripFeatures(
				[
					{
						id: "a",
						mode: "train",
						coordinates: forward,
						presentation: pair.a,
					},
				],
				[forward[1]],
			).features.at(-1)?.geometry.coordinates,
		).toEqual(forward[1]);
	});
});
