import { describe, expect, test } from "bun:test";
import { getIncaTrailBookingConfig } from "@/lib/incaTrailBooking";

const bookingTours = [
	{
		slugs: [
			"trilha-inca-2-dias",
			"short-inca-trail-2-days",
			"camino-inca-corto-2-dias",
		],
		road: "5",
		durationDays: 2,
		permitStartOffsetDays: 0,
		isPrimaryAvailabilityTour: true,
	},
	{
		slugs: ["camino-inca-4-dias", "inca-trail-4-days", "trilha-inca-4-dias"],
		road: "1",
		durationDays: 4,
		permitStartOffsetDays: 0,
		isPrimaryAvailabilityTour: true,
	},
	{
		slugs: [
			"camino-inca-full-day-privado",
			"private-full-day-inca-trail",
			"trilha-inca-full-day-privado",
		],
		road: "5",
		durationDays: 1,
		permitStartOffsetDays: 0,
		isPrimaryAvailabilityTour: false,
	},
	{
		slugs: [
			"lares-trek-camino-inca-corto-4-dias",
			"lares-trek-short-inca-trail-4-days",
			"lares-trek-caminho-inca-curto-4-dias",
		],
		road: "5",
		durationDays: 4,
		permitStartOffsetDays: 2,
		isPrimaryAvailabilityTour: false,
	},
	{
		slugs: [
			"salkantay-camino-inca-6-dias",
			"salkantay-inca-trail-to-6-days",
			"salkantay-caminho-inca-6-dias",
		],
		road: "1",
		durationDays: 6,
		permitStartOffsetDays: 2,
		isPrimaryAvailabilityTour: false,
	},
] as const;

describe("Inca Trail booking configuration", () => {
	for (const tour of bookingTours) {
		for (const slug of tour.slugs) {
			test(`maps ${slug} to its permit route and itinerary`, () => {
				expect(getIncaTrailBookingConfig(slug)).toEqual({
					road: tour.road,
					durationDays: tour.durationDays,
					permitStartOffsetDays: tour.permitStartOffsetDays,
					isPrimaryAvailabilityTour: tour.isPrimaryAvailabilityTour,
				});
			});
		}
	}

	test("normalizes a surrounding slash", () => {
		expect(getIncaTrailBookingConfig("/camino-inca-full-day-privado/")).toEqual(
			getIncaTrailBookingConfig("camino-inca-full-day-privado"),
		);
	});

	test("does not activate an unrelated tour", () => {
		expect(getIncaTrailBookingConfig("inca-jungle-4-dias")).toBeNull();
	});
});
