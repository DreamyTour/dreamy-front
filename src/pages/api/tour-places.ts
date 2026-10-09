import { getSecret } from "astro:env/server";
import type { APIRoute } from "astro";
import { mergeSearchPlaces, placeFeatures } from "@/lib/tour-place-search";
import type { RoutePlace } from "@/lib/tour-route-plan";
export const prerender = false;
const cache = new Map<string, { expires: number; places: RoutePlace[] }>();
export const GET: APIRoute = async ({ url, request }) => {
	const query = url.searchParams.get("q")?.trim();
	if (!query || query.length < 3 || query.length > 150)
		return Response.json({ error: "invalid_request" }, { status: 400 });
	const cacheKey = query.toLocaleLowerCase("es");
	const cached = cache.get(cacheKey);
	if (cached && cached.expires > Date.now())
		return Response.json(
			{ places: cached.places },
			{ headers: { "Cache-Control": "public, max-age=3600" } },
		);
	const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
	const key = getSecret("ORS_API_KEY");
	const search = async (source: "ors" | "photon") => {
		const endpoint = new URL(
			source === "ors"
				? "https://api.openrouteservice.org/geocode/search"
				: "https://photon.komoot.io/api/",
		);
		const params: Record<string, string> =
			source === "ors"
				? {
						text: query,
						size: "10",
						lang: "es",
						"focus.point.lon": "-72",
						"focus.point.lat": "-14",
					}
				: { q: query, limit: "10", lon: "-72", lat: "-14" };
		for (const [name, value] of Object.entries(params))
			endpoint.searchParams.set(name, value);
		const headers: Record<string, string> = { Accept: "application/json" };
		if (source === "ors" && key) headers.Authorization = key;
		// The public Photon instance rejects lang=es. Without lang it keeps native names.
		if (source === "photon")
			headers["User-Agent"] = "DreamyTours-CMS/1.0 (+https://dreamy.tours)";
		const response = await fetch(endpoint, { headers, signal });
		if (!response.ok) throw Error("unavailable");
		const data = await response.json();
		return placeFeatures(data.features, source);
	};
	const results = await Promise.allSettled([
		...(key ? [search("ors")] : []),
		search("photon"),
	]);
	const groups = results.flatMap((result) =>
		result.status === "fulfilled" ? [result.value] : [],
	);
	if (!groups.length)
		return Response.json({ error: "unavailable" }, { status: 502 });
	const places = mergeSearchPlaces(query, groups);
	if (places.length) {
		if (cache.size >= 200) {
			const oldest = cache.keys().next().value;
			if (oldest) cache.delete(oldest);
		}
		cache.set(cacheKey, { expires: Date.now() + 3600000, places });
	}
	return Response.json(
		{ places },
		{
			headers: {
				"Cache-Control": places.length ? "public, max-age=3600" : "no-store",
			},
		},
	);
};
