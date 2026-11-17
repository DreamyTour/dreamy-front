import { expect, test } from "bun:test";
import {
	groupSecondaryStops,
	secondaryStopsForDays,
} from "./tour-secondary-stops";

const plan = () => ({
	version: 1,
	start: { label: "Inicio", coordinates: [0, 0] },
	legs: [
		{
			id: "up",
			destination: { label: "Control", coordinates: [1, 1] },
			mode: "bus",
		},
		{
			id: "return",
			destination: { label: "Control", coordinates: [1, 1] },
			mode: "walking",
		},
		{
			id: "end",
			destination: { label: "Pernocte", coordinates: [2, 2] },
			mode: "train",
		},
	],
});
test("secondary visits keep repeated places, day identity and arrival mode without mutating plans", () => {
	const days = [1, 2].map((i) => ({
		id: `${i}`,
		day: `DAY ${i}`,
		routePlan: plan(),
	}));
	const before = JSON.stringify(days),
		stops = secondaryStopsForDays(days);
	expect(stops).toHaveLength(4);
	expect(stops.map((s) => s.id)).toEqual([
		"1:up",
		"1:return",
		"2:up",
		"2:return",
	]);
	expect(stops.map((s) => s.mode)).toEqual([
		"bus",
		"walking",
		"bus",
		"walking",
	]);
	expect(stops.every((s) => s.label === "Control")).toBe(true);
	expect(JSON.stringify(days)).toBe(before);
});
test("closed excursions reserve the main attraction; other real visits are retained", () => {
	const route = { ...plan(), primaryLegId: "up" };
	route.legs[2].destination.coordinates = [0, 0];
	expect(
		secondaryStopsForDays([{ id: "d", day: "01", routePlan: route }]).map(
			(s) => s.id,
		),
	).toEqual(["d:return", "d:end"]);
});
test("inherited starts use the same circular-day rule as main markers", () => {
	const route = { ...plan(), start: null, primaryLegId: "up" };
	route.legs[2].destination.coordinates = [2, 2];
	const days = [
		{ id: "previous", day: "01", routePlan: plan() },
		{ id: "d", day: "02", routePlan: route },
	];
	expect(
		secondaryStopsForDays(days)
			.filter((s) => s.dayId === "d")
			.map((s) => s.id),
	).toEqual(["d:return", "d:end"]);
});
test("end legs, archived visits and malformed or legacy plans create no phantom secondary points", () => {
	const route = plan();
	const withEnd = {
		...route,
		legs: route.legs.map((l) => ({ ...l, kind: "end" })),
		archivedLegs: route.legs,
	};
	expect(
		secondaryStopsForDays([{ id: "d", day: "01", routePlan: withEnd }]),
	).toEqual([]);
	for (const value of [
		null,
		{},
		{ version: 1, start: null, legs: [{ id: "bad" }] },
	])
		expect(
			secondaryStopsForDays([{ id: "d", day: "01", routePlan: value }]),
		).toEqual([]);
});
test("screen grouping retains every repeated visit and splits nearby places at closer zoom", () => {
	const stops = secondaryStopsForDays([
		{ id: "d", day: "01", routePlan: plan() },
	]);
	const before = JSON.stringify(stops);
	const grouped = groupSecondaryStops(
		stops,
		() => ({ x: 100, y: 100 }),
		72,
		320,
		430,
	);
	expect(grouped).toHaveLength(1);
	expect(grouped[0].items.map((s) => s.id)).toEqual(["d:up", "d:return"]);
	expect(grouped[0].coordinates).toBe(stops[0].coordinates);
	const spaced = [
		...stops,
		{ ...stops[0], id: "other", coordinates: [1.2, 1] as [number, number] },
	];
	expect(
		groupSecondaryStops(
			spaced,
			(p) => ({ x: p[0] * 200, y: 100 }),
			72,
			500,
			430,
		),
	).toHaveLength(1);
	expect(
		groupSecondaryStops(
			spaced,
			(p) => ({ x: (p[0] - 1) * 500, y: 100 }),
			56,
			500,
			430,
		),
	).toHaveLength(2);
	expect(JSON.stringify(stops)).toBe(before);
});
