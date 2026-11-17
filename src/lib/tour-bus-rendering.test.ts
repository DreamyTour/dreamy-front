import { expect, test } from "bun:test";
import { singleBusTracks } from "./tour-bus-rendering";
import type { RoundTripCandidate } from "./tour-round-trip";

const up: RoundTripCandidate = {
	id: "up",
	mode: "bus",
	verifiedGpx: true,
	coordinates: [
		[-72.52, -13.15],
		[-72.53, -13.16],
		[-72.54, -13.17],
	],
};
const down: RoundTripCandidate = {
	...up,
	id: "down",
	coordinates: [...(up.coordinates ?? [])].reverse(),
};
test("exact inverse buses share one visual track without mutating their data", () => {
	const input = [up, down],
		before = JSON.stringify(input);
	expect(singleBusTracks(input).segments).toEqual([up]);
	expect([...singleBusTracks(input).matchedIds]).toEqual(["up", "down"]);
	expect(JSON.stringify(input)).toBe(before);
	expect(singleBusTracks([down]).segments).toEqual([down]);
});
test("variants, unverified data, review tracks and other modes are preserved", () => {
	const variants: RoundTripCandidate[] = [
		{
			...down,
			coordinates: [
				[-72.54, -13.17],
				[-72.530001, -13.16],
				[-72.52, -13.15],
			],
		},
		{ ...down, verifiedGpx: false },
		{ ...down, requiresReview: true },
		{ ...down, mode: "train" as const },
		{ ...down, mode: "boat" as const },
	];
	for (const variant of variants)
		expect(singleBusTracks([up, variant]).segments).toHaveLength(2);
});
