import {
	normalizeTransportMode,
	type TransportMode,
} from "./tour-map-transport";
import { normalizeTourRoutePlan } from "./tour-route-plan";

/** Presentation only: active legs, first occurrence order; never infer from prose. */
export function dayCardTransportModes(
	value: unknown,
	legacyMode?: unknown,
): TransportMode[] {
	const plan = normalizeTourRoutePlan(value);
	if (plan) return [...new Set(plan.legs.map((leg) => leg.mode))];
	const mode = normalizeTransportMode(legacyMode);
	return mode ? [mode] : [];
}
