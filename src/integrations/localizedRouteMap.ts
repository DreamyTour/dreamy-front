import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import {
	type ContentKind,
	canonicalRoute,
	createRouteMap,
	type PublishedRoute,
	ROUTE_LOCALES,
	type RouteLocale,
	type RouteMap,
	resolveLocalizedRoute,
} from "../lib/localizedRouteResolver";

type Entry = {
	documentId: string;
	locale: RouteLocale;
	slug: string;
	publishedAt: string | null;
	category_blogs?: Array<{ documentId: string }>;
};
const endpoints = {
	post: "posts",
	category: "category-blogs",
	tour: "tours",
	page: "pages",
} as const;

export async function loadPublishedRouteMap(
	baseUrl: string,
): Promise<RouteMap> {
	const records: PublishedRoute[] = [];
	for (const locale of ROUTE_LOCALES) {
		const entries = {} as Record<ContentKind, Entry[]>;
		for (const kind of Object.keys(endpoints) as ContentKind[]) {
			entries[kind] = [];
			let pageCount = 1;
			for (let page = 1; page <= pageCount; page++) {
				const url = new URL(`/api/${endpoints[kind]}`, baseUrl);
				url.search = new URLSearchParams({
					locale,
					status: "published",
					"pagination[page]": String(page),
					"pagination[pageSize]": "100",
					sort: "documentId:asc",
					"fields[0]": "slug",
					"fields[1]": "locale",
					"fields[2]": "publishedAt",
				}).toString();
				if (kind === "post")
					url.searchParams.set("populate[category_blogs][fields][0]", "slug");
				const response = await fetch(url, {
					headers: {
						Accept: "application/json",
						"User-Agent": "Dreamy-Strapi-Editor/1.0",
					},
				});
				if (!response.ok)
					throw new Error(
						`Published route catalogue: ${endpoints[kind]} ${locale} HTTP ${response.status}`,
					);
				const body = (await response.json()) as {
					data: Entry[];
					meta?: { pagination?: { pageCount?: number } };
				};
				if (!Array.isArray(body.data))
					throw new Error(`Invalid catalogue: ${endpoints[kind]} ${locale}`);
				pageCount = body.meta?.pagination?.pageCount ?? 1;
				for (const entry of body.data) {
					if (!entry.publishedAt || entry.locale !== locale)
						throw new Error(
							`Unpublished or wrong-locale catalogue entry: ${entry.documentId}`,
						);
					entries[kind].push(entry);
				}
			}
		}
		for (const kind of Object.keys(endpoints) as ContentKind[]) {
			for (const entry of entries[kind]) {
				const pages =
					kind === "category"
						? Math.max(
								1,
								Math.ceil(
									entries.post.filter((post) =>
										post.category_blogs?.some(
											(category) => category.documentId === entry.documentId,
										),
									).length / 9,
								),
							)
						: 1;
				records.push({
					kind,
					documentId: entry.documentId,
					locale,
					slug: entry.slug,
					pages,
				});
			}
		}
	}
	return createRouteMap(records);
}

export default function localizedRouteMap(): AstroIntegration {
	let mapPromise: Promise<RouteMap> | undefined;
	let clientDir: URL;
	let outputDir: URL;
	let site: string;
	return {
		name: "dreamy-localized-route-map",
		hooks: {
			"astro:config:setup": ({ command, config, updateConfig }) => {
				const root = fileURLToPath(config.root);
				const base =
					process.env.VITE_STRAPI_URL ??
					loadEnv(command === "build" ? "production" : "development", root, "")
						.VITE_STRAPI_URL;
				if (!base)
					throw new Error(
						"VITE_STRAPI_URL is required for the published route catalogue",
					);
				updateConfig({
					vite: {
						plugins: [
							{
								name: "dreamy-localized-route-map",
								resolveId(id) {
									if (id === "virtual:localized-route-map")
										return "\0virtual:localized-route-map";
								},
								async load(id) {
									if (id !== "\0virtual:localized-route-map") return;
									mapPromise ??= loadPublishedRouteMap(base);
									return `export default ${JSON.stringify(await mapPromise)};`;
								},
							},
						],
					},
				});
			},
			"astro:config:done": ({ config }) => {
				clientDir = config.build.client;
				outputDir = config.outDir;
				if (!config.site)
					throw new Error("A canonical site is required for route validation");
				site = config.site;
			},
			"astro:build:done": async ({ logger }) => {
				if (!mapPromise)
					throw new Error("Worker did not include the localized route map");
				const map = await mapPromise;
				const conflicts = new Set<string>();
				let slugs = 0;
				for (const [id, translations] of Object.entries(map.documents)) {
					const kind = id.split(":")[0] as ContentKind;
					for (const [locale, entry] of Object.entries(translations)) {
						slugs++;
						for (let page = 1; page <= entry.pages; page++) {
							const path = canonicalRoute(
								kind,
								locale as RouteLocale,
								entry.slug,
								page,
							);
							const html = await readFile(
								new URL(`.${path}index.html`, clientDir),
								"utf8",
							);
							if (/<meta\b[^>]*http-equiv=["']refresh/i.test(html))
								throw new Error(
									`Redirect alias cannot be a destination: ${path}`,
								);
							const canonical = (html.match(/<link\b[^>]*>/g) ?? [])
								.find((tag) => /\brel=["']canonical["']/.test(tag))
								?.match(/\bhref=["']([^"']+)/)?.[1];
							if (canonical !== new URL(path, site).href)
								throw new Error(
									`Noncanonical map destination: ${path} (${canonical})`,
								);
							if (resolveLocalizedRoute(path, map) !== null)
								throw new Error(
									`Resolver loop at canonical destination: ${path}`,
								);
						}
						for (const requested of ROUTE_LOCALES) {
							const result = resolveLocalizedRoute(
								canonicalRoute(kind, requested, entry.slug),
								map,
							);
							if (result && "ambiguous" in result)
								conflicts.add(`${kind}:${entry.slug}:${requested}`);
						}
					}
				}
				if (conflicts.size)
					throw new Error(
						`Ambiguous localized routes: ${[...conflicts].join(", ")}`,
					);
				const json = JSON.stringify(map);
				await writeFile(new URL("localized-route-map.json", outputDir), json);
				logger.info(
					`Validated ${Object.keys(map.documents).length} documents, ${slugs} localized slugs; map ${Buffer.byteLength(json)} bytes. No redirect rules generated.`,
				);
			},
		},
	};
}
