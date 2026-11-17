import type { RoundTripCandidate } from "./tour-round-trip";

/** Exact inverse verified bus tracks share one visual stroke; source data is untouched. */
export function singleBusTracks<T extends RoundTripCandidate>(segments: T[]) {
	const forward = new Map<string, T[]>();
	const matchedIds = new Set<string>();
	for (const segment of segments) {
		if (
			segment.mode !== "bus" ||
			!segment.verifiedGpx ||
			segment.requiresReview ||
			!segment.coordinates ||
			segment.coordinates.length < 2
		)
			continue;
		const key = JSON.stringify(segment.coordinates);
		const reverse = JSON.stringify([...segment.coordinates].reverse());
		// A palindromic track has no unambiguous opposite direction.
		if (key === reverse) continue;
		for (const partner of forward.get(reverse) ?? []) {
			matchedIds.add(partner.id);
			matchedIds.add(segment.id);
		}
		forward.set(key, [...(forward.get(key) ?? []), segment]);
	}
	const seen = new Set<string>();
	return {
		matchedIds,
		segments: segments.filter((segment) => {
			if (!matchedIds.has(segment.id) || !segment.coordinates) return true;
			const key = JSON.stringify(segment.coordinates);
			const reverse = JSON.stringify([...segment.coordinates].reverse());
			const canonical = key < reverse ? key : reverse;
			if (seen.has(canonical)) return false;
			seen.add(canonical);
			return true;
		}),
	};
}
