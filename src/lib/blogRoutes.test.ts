import { afterEach, expect, spyOn, test } from "bun:test";
import { getBlogPostPaths } from "@/lib/blogRoutes";
import { fetchAllStrapi } from "@/lib/strapi";

const originalUrl = process.env.VITE_STRAPI_URL;
const fetchTarget: {
	fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
} = globalThis;
const fetchSpy = spyOn(fetchTarget, "fetch");

afterEach(() => {
	fetchSpy.mockRestore();
	if (originalUrl === undefined) delete process.env.VITE_STRAPI_URL;
	else process.env.VITE_STRAPI_URL = originalUrl;
});

test("generates every localized post route beyond the first API page", async () => {
	process.env.VITE_STRAPI_URL = "https://blog-pagination.test";
	const requests: URL[] = [];
	fetchSpy.mockImplementation(async (input) => {
		const url = new URL(String(input));
		requests.push(url);
		if (url.pathname !== "/api/posts") {
			return Response.json({ data: url.pathname === "/api/global" ? {} : [] });
		}
		const lang = url.searchParams.get("locale");
		const page = Number(url.searchParams.get("pagination[page]") || 1);
		const pageSize = Number(url.searchParams.get("pagination[pageSize]") || 25);
		const posts = Array.from({ length: 205 }, (_, index) => ({
			id: index + 1,
			documentId: `post-${index}`,
			slug: `${lang}-post-${index}`,
			category_blogs: [],
		}));
		return Response.json({
			data: posts.slice((page - 1) * pageSize, page * pageSize),
			meta: { pagination: { pageCount: Math.ceil(posts.length / pageSize) } },
		});
	});

	const paths = await getBlogPostPaths({ localized: true });
	expect(paths).toHaveLength(410);
	for (const lang of ["es", "pt"]) {
		const lastPost = paths.find(
			(path) => path.params.slug === `${lang}-post-204`,
		);
		expect(lastPost?.props.totalPostCount).toBe(205);
		expect(lastPost?.props.slugMap).toEqual({
			en: "en-post-204",
			es: "es-post-204",
			pt: "pt-post-204",
		});
	}
	expect(requests.filter((url) => url.pathname === "/api/posts")).toHaveLength(
		9,
	);
});

test("preserves page order when later API pages respond first", async () => {
	process.env.VITE_STRAPI_URL = "https://blog-order.test";
	const spy = spyOn(fetchTarget, "fetch");
	try {
		spy.mockImplementation(async (input) => {
			const page = Number(
				new URL(String(input)).searchParams.get("pagination[page]"),
			);
			if (page === 2) await new Promise((resolve) => setTimeout(resolve, 20));
			return Response.json({
				data: [page],
				meta: { pagination: { pageCount: 3 } },
			});
		});
		expect(
			await fetchAllStrapi<number>({ endpoint: "posts", locale: "es" }),
		).toEqual([1, 2, 3]);
	} finally {
		spy.mockRestore();
	}
});
