import { getSecret } from "astro:env/server";
import type { APIRoute } from "astro";
import {
	calculateTourRoute,
	parseTourRoutingRequest,
	TourRoutingError,
} from "@/lib/tour-routing";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	try {
		const route = parseTourRoutingRequest(new URL(request.url).searchParams);
		const result = await calculateTourRoute(route, {
			apiKey: getSecret("ORS_API_KEY"),
			allowDemo: import.meta.env.DEV,
			signal: request.signal,
		});
		return Response.json(result, {
			headers: {
				"Cache-Control": "public, max-age=86400",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error) {
		const failure =
			error instanceof TourRoutingError
				? error
				: new TourRoutingError("unavailable", 502);
		return Response.json(
			{ error: failure.code },
			{ status: failure.status, headers: { "Cache-Control": "no-store" } },
		);
	}
};
