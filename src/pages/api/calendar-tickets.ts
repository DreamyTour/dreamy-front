import type { APIRoute } from "astro";
import {
	fetchCalendarResponse,
	isCalendarQueryValid,
} from "@/lib/calendarAvailability";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const params = {
		place: Number(url.searchParams.get("place")),
		road: url.searchParams.get("road") || "",
		year: Number(url.searchParams.get("year")),
		month: Number(url.searchParams.get("month")),
	};
	if (!isCalendarQueryValid(params))
		return Response.json({ error: "Invalid calendar query" }, { status: 400 });
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10_000);

	try {
		const response = await fetchCalendarResponse({
			...params,
			signal: controller.signal,
		});
		const body = await response.text();

		return new Response(body, {
			status: response.status,
			headers: {
				"Content-Type":
					response.headers.get("Content-Type") || "application/json",
				"Cache-Control": "no-store",
			},
		});
	} catch {
		return new Response(
			JSON.stringify({ error: "Calendar service unavailable" }),
			{
				status: 502,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store",
				},
			},
		);
	} finally {
		clearTimeout(timeout);
	}
};
