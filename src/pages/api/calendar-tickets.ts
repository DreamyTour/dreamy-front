import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const apiUrl = `https://calendar.dreamy.tours/v1/tickets${url.search}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10_000);

	try {
		const response = await fetch(apiUrl, { signal: controller.signal });
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
