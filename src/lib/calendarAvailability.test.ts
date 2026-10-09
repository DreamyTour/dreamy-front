import { expect, test } from "bun:test";
import {
	isCalendarQueryValid,
	MACHU_PICCHU_ROUTES,
	normalizeTickets,
} from "./calendarAvailability";

test("maps every Machu Picchu route to its upstream road", () => {
	expect(MACHU_PICCHU_ROUTES.map(({ code, road }) => [code, road])).toEqual([
		["1A", "7"],
		["1B", "8"],
		["1C", "9"],
		["1D", "10"],
		["2A", "11"],
		["2B", "12"],
		["3A", "13"],
		["3B", "14"],
		["3C", "15"],
		["3D", "16"],
	]);
});
test("normalizes hourly availability and sums only published dates", () => {
	const result = normalizeTickets({
		"06:00 AM": { "2026-11-01": 15 },
		"01:00 PM": { "2026-11-01": 3, "2026-11-02": 0 },
	});
	expect(result.dates).toEqual({ "2026-11-01": 18, "2026-11-02": 0 });
	expect(result.times["13:00"]["2026-11-01"]).toBe(3);
	expect(result.dates["2026-11-03"]).toBeUndefined();
});
test("preserves Camino Inca daily response", () => {
	expect(normalizeTickets({ "2026-11-01": 100 })).toEqual({
		dates: { "2026-11-01": 100 },
		times: {},
	});
});
test("rejects malformed data and routes belonging to another place", () => {
	expect(() => normalizeTickets({ "2026-11-01": -1 })).toThrow();
	expect(() => normalizeTickets(undefined)).toThrow();
	expect(
		isCalendarQueryValid({ place: 1, road: "1", year: 2026, month: 11 }),
	).toBe(false);
	expect(
		isCalendarQueryValid({ place: 2, road: "1", year: 2026, month: 11 }),
	).toBe(true);
});
