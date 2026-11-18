import { expect, test } from "bun:test";
import { dayCardTransportModes } from "./tour-day-card";

const plan = (modes: string[]) => ({
	version: 1,
	start: null,
	legs: modes.map((mode, i) => ({
		id: `leg-${i}`,
		mode,
		destination: { label: `Place ${i}`, coordinates: [i, 0] },
	})),
});

test("active day modes are unique and retain first itinerary occurrence", () => {
	const value = plan(["walking", "bus", "walking", "train", "bus"]);
	const before = JSON.stringify(value);
	expect(dayCardTransportModes(value)).toEqual(["walking", "bus", "train"]);
	expect(JSON.stringify(value)).toBe(before);
});

test("archived legs and geometry review metadata do not invent or override active modes", () => {
	const value = {
		...plan(["train"]),
		legs: plan(["train"]).legs.map((leg) => ({
			...leg,
			geometryMeta: { mode: "bus", status: "review" },
		})),
		archivedLegs: plan(["boat"]).legs,
	};
	expect(dayCardTransportModes(value, "flight")).toEqual(["train"]);
});

test("all five modes and final arrival legs are supported", () => {
	expect(
		dayCardTransportModes(plan(["flight", "boat", "bus", "walking", "train"])),
	).toEqual(["flight", "boat", "bus", "walking", "train"]);
	const value = plan(["walking", "bus"]);
	expect(
		dayCardTransportModes({
			...value,
			legs: value.legs.map((l) => ({ ...l, kind: "end" })),
		}),
	).toEqual(["walking", "bus"]);
});

test("legacy fallback only uses an explicit structured mode, never editorial text", () => {
	expect(dayCardTransportModes(null, "bus")).toEqual(["bus"]);
	expect(dayCardTransportModes(null, "Tren y caminata")).toEqual([]);
	expect(dayCardTransportModes({ routeText: "bus train flight" })).toEqual([]);
	expect(dayCardTransportModes(plan([]), "bus")).toEqual([]);
});
