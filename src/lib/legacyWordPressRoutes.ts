// Only the retired WordPress homepage query routes, never tour/checkout parameters.
export function isLegacyWordPressQuery(url: URL): boolean {
	if (!["/", "/es", "/es/", "/pt", "/pt/"].includes(url.pathname)) {
		return false;
	}
	return (
		url.searchParams.getAll("p").some((id) => /^\d+$/.test(id)) ||
		url.searchParams.has("s")
	);
}

export function legacyWordPressGone(method: string): Response {
	return new Response(
		method === "HEAD" ? null : "This URL is no longer available.",
		{
			status: 410,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Robots-Tag": "noindex, follow",
			},
		},
	);
}
