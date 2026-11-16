import { describe, expect, test } from "bun:test";
import { dayMarkerPlace } from "./tour-day-marker";
import {
	type RoutePlace,
	routePlanSecondaryStops,
	type TourRoutePlan,
} from "./tour-route-plan";

const start: RoutePlace = { label: "Cusco", coordinates: [-71.98, -13.51] };
const attraction: RoutePlace = {
	label: "Attraction",
	coordinates: [-72.54, -13.16],
};
const end: RoutePlace = {
	label: "Aguas Calientes",
	coordinates: [-72.52, -13.15],
};
describe("day marker presentation, independent of transport and persisted data", () => {
	test("Machu Picchu two-day itinerary marks the overnight stop, then the service endpoint", () => {
		const ollantaytambo: RoutePlace = {
			label: "Ollantaytambo",
			coordinates: [-72.27, -13.26],
		};
		const control: RoutePlace = {
			label: "Machu Picchu Control",
			coordinates: [-72.54, -13.16],
		};
		const day1: TourRoutePlan = {
			version: 1,
			start,
			legs: [
				{
					id: "ollantaytambo",
					mode: "bus",
					destination: ollantaytambo,
					kind: "visit",
				},
				{ id: "overnight", mode: "train", destination: end, kind: "end" },
			],
		};
		const day2: TourRoutePlan = {
			version: 1,
			start: end,
			primaryLegId: "attraction",
			legs: [
				{ id: "control", mode: "bus", destination: control, kind: "waypoint" },
				{
					id: "attraction",
					mode: "walking",
					destination: attraction,
					kind: "visit",
				},
				{ id: "cusco", mode: "train", destination: start, kind: "end" },
			],
		};
		const before = JSON.stringify([day1, day2]);
		expect(dayMarkerPlace(day1, start).label).toBe("Aguas Calientes");
		expect(dayMarkerPlace(day2, end, end).label).toBe("Cusco");
		expect(JSON.stringify([day1, day2])).toBe(before);
	});

	for (const dayCount of [2, 4, 7, 10, 15]) {
		test(`uses each day's destination in a ${dayCount}-day itinerary`, () => {
			const itinerary = Array.from({ length: dayCount }, (_, index) => {
				const destination: RoutePlace = {
					label: `Day ${index + 1}`,
					coordinates: [-72 + index / 100, -13.5 + index / 100],
				};
				const previous: RoutePlace = {
					label: `Start ${index + 1}`,
					coordinates: [-72.5 + index / 100, -13.6 + index / 100],
				};
				return {
					destination,
					plan: {
						version: 1 as const,
						start: previous,
						legs: [
							{
								id: "overnight",
								mode: "train" as const,
								destination,
								kind: "end" as const,
							},
						],
					},
				};
			});
			const original = JSON.stringify(itinerary);

			expect(
				itinerary.map(({ destination, plan }) =>
					dayMarkerPlace(plan, destination),
				),
			).toEqual(itinerary.map(({ destination }) => destination));
			expect(JSON.stringify(itinerary)).toBe(original);
		});
	}

	for (const mode of ["bus", "train", "walking", "boat", "flight"] as const) {
		test(`${mode}: final overnight destination, not the first visit`, () => {
			const plan: TourRoutePlan = {
				version: 1,
				start,
				primaryLegId: "visit",
				legs: [
					{ id: "visit", mode, destination: attraction, kind: "visit" },
					{ id: "end", mode, destination: end, kind: "end" },
				],
			};
			const before = JSON.stringify(plan);
			expect(dayMarkerPlace(plan, start)).toEqual(end);
			expect(JSON.stringify(plan)).toBe(before);
		});
	}
	test("return to Cusco selects Cusco; returning to the tour origin is not a closed individual day", () => {
		const plan = {
			version: 1,
			start: end,
			primaryLegId: "visit",
			legs: [
				{ id: "visit", mode: "bus", destination: attraction, kind: "visit" },
				{ id: "end", mode: "bus", destination: start, kind: "end" },
			],
		};
		expect(dayMarkerPlace(plan, end, end)).toEqual(start);
	});
	test("an explicit daily start takes precedence over a different previous-day endpoint", () => {
		const plan: TourRoutePlan = {
			version: 1,
			start: end,
			primaryLegId: "visit",
			legs: [
				{ id: "visit", mode: "bus", destination: attraction, kind: "visit" },
				{ id: "end", mode: "bus", destination: start, kind: "end" },
			],
		};
		expect(dayMarkerPlace(plan, end, start)).toEqual(start);
	});

	test("closed day uses explicitly selected main attraction; absent selection falls back to end", () => {
		const plan: TourRoutePlan = {
			version: 1,
			start: end,
			primaryLegId: "visit",
			legs: [
				{ id: "visit", mode: "bus", destination: attraction, kind: "visit" },
				{ id: "end", mode: "bus", destination: end, kind: "end" },
			],
		};
		expect(dayMarkerPlace(plan, end, start)).toEqual(attraction);
		expect(dayMarkerPlace({ ...plan, start: null }, end, end)).toEqual(
			attraction,
		);
		expect(
			dayMarkerPlace({ ...plan, primaryLegId: undefined }, end, start),
		).toEqual(end);
	});
	test("nearby towns are not the same place; no text-based hotel inference; legacy fallback", () => {
		const plan = {
			version: 1,
			start,
			primaryLegId: "visit",
			legs: [
				{ id: "visit", mode: "bus", destination: attraction, kind: "visit" },
				{
					id: "end",
					mode: "bus",
					destination: { ...start, coordinates: [-71.981, -13.51] },
					kind: "end",
				},
			],
		};
		expect(dayMarkerPlace(plan, end).coordinates).toEqual([-71.981, -13.51]);
		expect(dayMarkerPlace(null, end)).toEqual(end);
		expect(dayMarkerPlace({ version: 2 }, end)).toEqual(end);
	});

	test("waypoints remain secondary stops while end legs are reserved for the day marker", () => {
		const plan: TourRoutePlan = {
			version: 1,
			start,
			legs: [
				{
					id: "visit",
					mode: "walking",
					destination: attraction,
					kind: "visit",
				},
				{ id: "control", mode: "bus", destination: end, kind: "waypoint" },
				{ id: "end", mode: "train", destination: start, kind: "end" },
			],
		};

		expect(routePlanSecondaryStops(plan).map((leg) => leg.id)).toEqual([
			"visit",
			"control",
		]);
	});
});
