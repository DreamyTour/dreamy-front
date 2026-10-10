import { afterEach, expect, spyOn, test } from "bun:test";
import { loadPublishedRouteMap } from "./localizedRouteMap";

const originalFetch = globalThis.fetch;
const fetchTarget: {
	fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
} = globalThis;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("catalogue requests only published metadata and walks API pagination", async () => {
	let requests = 0;
	spyOn(fetchTarget, "fetch").mockImplementation(async (input, init) => {
		const url = new URL(String(input));
		expect(url.searchParams.get("status")).toBe("published");
		expect(init?.method ?? "GET").toBe("GET");
		expect(new Headers(init?.headers).has("Authorization")).toBe(false);
		requests++;
		const locale = url.searchParams.get("locale");
		const kind = url.pathname.split("/").at(-1);
		const page = url.searchParams.get("pagination[page]");
		const data = [
			{
				documentId: `${kind}-${page}`,
				locale,
				slug: `${kind}-${locale}-${page}`,
				publishedAt: "2026-10-06T00:00:00Z",
				category_blogs: [],
			},
		];
		return Response.json({
			data,
			meta: { pagination: { pageCount: kind === "posts" ? 2 : 1 } },
		});
	});
	const map = await loadPublishedRouteMap("https://catalogue.test");
	expect(requests).toBe(15);
	expect(Object.keys(map.documents).length).toBe(5);
	expect(
		Object.values(map.documents).flatMap((translations) =>
			Object.values(translations),
		).length,
	).toBe(15);
});

for (const invalid of ["draft", "wrong-locale", "403"]) {
	test(`catalogue rejects ${invalid} instead of producing a partial map`, async () => {
		spyOn(fetchTarget, "fetch").mockImplementation(async () => {
			if (invalid === "403")
				return Response.json({ error: { status: 403 } }, { status: 403 });
			return Response.json({
				data: [
					{
						documentId: "bad",
						locale: invalid === "wrong-locale" ? "pt" : "en",
						slug: "bad",
						publishedAt: invalid === "draft" ? null : "2026-10-06",
					},
				],
			});
		});
		const error = await loadPublishedRouteMap("https://catalogue.test").then(
			() => null,
			(cause) => String(cause),
		);
		expect(error).toContain(
			invalid === "403" ? "HTTP 403" : "Unpublished or wrong-locale",
		);
	});
}

test("catalogue retries a temporary 502 for Portuguese categories", async () => {
	let categoryAttempts = 0;
	spyOn(fetchTarget, "fetch").mockImplementation(async (input, init) => {
		expect(init?.signal).toBeInstanceOf(AbortSignal);
		const url = new URL(String(input));
		if (
			url.pathname === "/api/category-blogs" &&
			url.searchParams.get("locale") === "pt"
		) {
			categoryAttempts++;
			if (categoryAttempts < 3)
				return new Response("Bad Gateway", { status: 502 });
		}
		return Response.json({ data: [], meta: { pagination: { pageCount: 1 } } });
	});
	await loadPublishedRouteMap("https://catalogue.test");
	expect(categoryAttempts).toBe(3);
});

test("catalogue fails after three 502 responses instead of omitting routes", async () => {
	let attempts = 0;
	spyOn(fetchTarget, "fetch").mockImplementation(async () => {
		attempts++;
		return new Response("Bad Gateway", { status: 502 });
	});
	const error = await loadPublishedRouteMap("https://catalogue.test").then(
		() => null,
		(cause) => String(cause),
	);
	expect(error).toContain("HTTP 502 (attempt 3/3)");
	expect(attempts).toBe(3);
});

test("catalogue recovers from a temporary network failure", async () => {
	let attempts = 0;
	spyOn(fetchTarget, "fetch").mockImplementation(async () => {
		attempts++;
		if (attempts === 1) throw new TypeError("fetch failed");
		return Response.json({ data: [] });
	});
	await loadPublishedRouteMap("https://catalogue.test");
	expect(attempts).toBe(13);
});
