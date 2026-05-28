import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const apiUrl = `https://calendar.dreamy.tours/v1/tickets${url.search}`;

	try {
		const response = await fetch(apiUrl);
		const body = await response.text();

		return new Response(body, {
			status: response.status,
			headers: {
				"Content-Type": response.headers.get("Content-Type") || "application/json",
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: "Proxy error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
