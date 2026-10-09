import { useEffect, useState } from "react";
import {
	normalizeRouteGeometry,
	type RouteCoordinate,
	type TransportMode,
} from "@/lib/tour-map-transport";

interface Segment {
	mode: TransportMode | null;
	from: RouteCoordinate;
	to: RouteCoordinate;
	coordinates: RouteCoordinate[] | null;
}
export interface RouteCalculation {
	status: "loading" | "ready" | "failed";
	coordinates?: RouteCoordinate[];
	provider?: "OSRM" | "openrouteservice";
}
const cache = new Map<string, RouteCalculation>();
export const routeCalculationKey = (segment: Segment) =>
	`${segment.mode}:${segment.from.join(",")}:${segment.to.join(",")}`;

export function useCalculatedTourRoutes(segments: Segment[]) {
	const [results, setResults] = useState<Record<string, RouteCalculation>>({});
	useEffect(() => {
		const controller = new AbortController();
		let disposed = false;
		const calculate = async () => {
			for (const segment of segments) {
				if (disposed) break;
				if (
					segment.coordinates ||
					(segment.mode !== "bus" && segment.mode !== "walking")
				)
					continue;
				const key = routeCalculationKey(segment);
				const cached = cache.get(key);
				if (cached) {
					setResults((current) => ({ ...current, [key]: cached }));
					continue;
				}
				setResults((current) => ({ ...current, [key]: { status: "loading" } }));
				try {
					const params = new URLSearchParams({
						mode: segment.mode,
						from: segment.from.join(","),
						to: segment.to.join(","),
					});
					const response = await fetch(`/api/tour-route?${params}`, {
						signal: controller.signal,
					});
					if (!response.ok) throw new Error("Route unavailable");
					const body = await response.json();
					const coordinates = normalizeRouteGeometry(body.coordinates);
					if (
						!coordinates ||
						(body.provider !== "OSRM" && body.provider !== "openrouteservice")
					)
						throw new Error("Invalid route");
					const result: RouteCalculation = {
						status: "ready",
						coordinates,
						provider: body.provider,
					};
					cache.set(key, result);
					if (cache.size > 100) {
						const oldest = cache.keys().next().value;
						if (oldest) cache.delete(oldest);
					}
					if (!disposed)
						setResults((current) => ({ ...current, [key]: result }));
				} catch {
					if (!disposed)
						setResults((current) => ({
							...current,
							[key]: { status: "failed" },
						}));
				}
			}
		};
		void calculate();
		return () => {
			disposed = true;
			controller.abort();
		};
	}, [segments]);
	return results;
}
