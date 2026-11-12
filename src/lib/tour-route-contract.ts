/** Shared wire format. Keep identical to dreamy-cms/src/shared/tour-route-contract.ts. */
export const ROUTE_PROTOCOL = 2;
export interface RouteEditorIdentity {
	documentId: string;
	locale: string;
	dayKey: string;
	sessionId: string;
}
export function sameRouteIdentity(
	a: RouteEditorIdentity | null,
	b: RouteEditorIdentity | null,
) {
	return (
		!!a &&
		!!b &&
		["documentId", "locale", "dayKey", "sessionId"].every(
			(key) =>
				a[key as keyof RouteEditorIdentity] ===
				b[key as keyof RouteEditorIdentity],
		)
	);
}
/** Canonical JSON, excluding the transient optimistic-lock token (never persisted). */
export function routeContent(value: unknown): string {
	function canonical(item: unknown): unknown {
		if (Array.isArray(item)) return item.map(canonical);
		if (item && typeof item === "object")
			return Object.fromEntries(
				Object.entries(item)
					.filter(([key, v]) => key !== "_baseRevision" && v !== undefined)
					.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
					.map(([key, v]) => [key, canonical(v)]),
			);
		return item;
	}
	return JSON.stringify(canonical(value ?? null));
}
