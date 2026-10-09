import { describe, expect, test } from "bun:test";
import { isValidTourMapStop } from "./tour-map";
import {
	normalizeTourRoutePlan,
	routePlanDestination,
	routePlanHighlight,
	routePlanSegments,
	routePlanVisits,
} from "./tour-route-plan";

const start = { label: "Cusco", coordinates: [-71.98, -13.52] as [number, number] };
const destination = {
	label: "Ollantaytambo",
	coordinates: [-72.26, -13.26] as [number, number],
};
describe("CMS day route plans", () => {
	test("a day returning to Cusco keeps its attraction marker and inherits Cusco next day", () => {
		const plan = normalizeTourRoutePlan({
			version: 1,
			start,
			primaryLegId: "humantay",
			legs: [
				{ id: "access", mode: "bus", kind: "waypoint", destination },
				{
					id: "humantay",
					mode: "walking",
					kind: "visit",
					destination: {
						label: "Laguna Humantay",
						coordinates: [-72.62, -13.41],
					},
				},
				{ id: "return", mode: "bus", kind: "end", destination: start },
			],
		})!;
		expect(routePlanHighlight(plan)?.label).toBe("Laguna Humantay");
		expect(routePlanDestination(plan)?.label).toBe("Cusco");
		expect(routePlanVisits(plan).map((leg) => leg.id)).toEqual(["humantay"]);
		const next = normalizeTourRoutePlan({
			version: 1,
			start: null,
			legs: [{ id: "next", mode: "bus", destination }],
		})!;
		expect(routePlanSegments(next, routePlanDestination(plan))[0].from).toEqual(
			start.coordinates,
		);
	});
	test("falls back to the first visit when a chosen attraction is deleted or becomes lodging", () => {
		const plan = {
			version: 1,
			start,
			primaryLegId: "removed",
			legs: [
				{ id: "a", kind: "visit", mode: "bus", destination },
				{ id: "end", kind: "end", mode: "bus", destination: start },
			],
		};
		expect(routePlanHighlight(plan)?.label).toBe("Ollantaytambo");
		expect(
			normalizeTourRoutePlan({ ...plan, primaryLegId: "end" })?.primaryLegId,
		).toBeUndefined();
		expect(routePlanDestination(plan)?.label).toBe("Cusco");
	});
	test("keeps an unfinished start and rejects malformed places and duplicate legs", () => {
		expect(
			normalizeTourRoutePlan({ version: 1, start, legs: [] }),
		).not.toBeNull();
		expect(
			normalizeTourRoutePlan({
				version: 1,
				start,
				legs: [
					{
						id: "a",
						mode: "bus",
						destination: { label: "x", coordinates: [999, 0] },
					},
				],
			}),
		).toBeNull();
		const leg = { id: "a", mode: "bus", destination };
		expect(
			normalizeTourRoutePlan({ version: 1, start, legs: [leg, leg] }),
		).toBeNull();
	});
	test("connects mixed transports within one day and inherits the previous day", () => {
		const plan = normalizeTourRoutePlan({
			version: 1,
			start,
			legs: [
				{ id: "a", mode: "bus", destination },
				{
					id: "b",
					mode: "train",
					destination: {
						label: "Aguas Calientes",
						coordinates: [-72.52, -13.15],
					},
				},
				{
					id: "c",
					mode: "boat",
					destination: { label: "Puerto", coordinates: [-72.5, -13.1] },
				},
			],
		})!;
		const previous = {
			label: "Hotel",
			coordinates: [-71.97, -13.51] as [number, number],
		};
		const segments = routePlanSegments(plan, previous);
		expect(segments).toHaveLength(3);
		expect(segments[0].from).toEqual(previous.coordinates);
		expect(segments[1].from).toEqual(destination.coordinates);
		expect(routePlanDestination(plan)?.label).toBe("Puerto");
	});
	test("discards stale saved geometries when inherited origin changes", () => {
		const plan = normalizeTourRoutePlan({
			version: 1,
			start,
			legs: [
				{
					id: "a",
					mode: "bus",
					destination,
					geometry: [start.coordinates, destination.coordinates],
				},
			],
		})!;
		expect(routePlanSegments(plan, null)[0].coordinates).not.toBeNull();
		expect(
			routePlanSegments(plan, { label: "Lima", coordinates: [-77, -12] })[0]
				.coordinates,
		).toBeNull();
	});
	test("new day coordinates come from the last destination, legacy days still work", () => {
		expect(
			isValidTourMapStop({
				id: 1,
				order: 1,
				title: "Viaje",
				routePlan: {
					version: 1,
					start,
					legs: [{ id: "a", mode: "bus", destination }],
				},
			}),
		).toBe(true);
		expect(
			isValidTourMapStop({
				id: 1,
				order: 1,
				title: "Viaje",
				latitude: -13,
				longitude: -72,
			}),
		).toBe(true);
	});
});
