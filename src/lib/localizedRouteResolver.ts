export const ROUTE_LOCALES = ["en", "es", "pt"] as const;
export type RouteLocale = (typeof ROUTE_LOCALES)[number];
export type ContentKind = "post" | "category" | "tour" | "page";
export type PublishedRoute = {
	kind: ContentKind;
	documentId: string;
	locale: RouteLocale;
	slug: string;
	pages?: number;
};
export type RouteMap = {
	documents: Record<
		string,
		Partial<Record<RouteLocale, { slug: string; pages: number }>>
	>;
	slugIndex: Record<string, Array<[string, RouteLocale]>>;
};
export type Resolution =
	| { status: 301 | 302; pathname: string }
	| { ambiguous: true }
	| null;

export function canonicalRoute(
	kind: ContentKind,
	locale: RouteLocale,
	slug: string,
	page = 1,
) {
	return `${locale === "en" ? "" : `/${locale}`}${kind === "post" || kind === "category" ? "/blog" : ""}/${slug}/${page > 1 ? `${page}/` : ""}`;
}

export function createRouteMap(records: PublishedRoute[]): RouteMap {
	const map: RouteMap = {
		documents: Object.create(null),
		slugIndex: Object.create(null),
	};
	const occupied = new Map<string, string>();
	for (const record of records) {
		if (
			!record.documentId ||
			!/^[\p{L}\p{N}_-]+$/u.test(record.slug) ||
			!ROUTE_LOCALES.includes(record.locale)
		) {
			throw new Error(
				`Invalid published route metadata: ${record.kind}:${record.documentId}`,
			);
		}
		const key = `${record.kind}:${record.documentId}`;
		const pages = record.kind === "category" ? (record.pages ?? 1) : 1;
		if (!Number.isSafeInteger(pages) || pages < 1)
			throw new Error(`Invalid pagination: ${key}`);
		const existing = map.documents[key]?.[record.locale];
		if (existing && (existing.slug !== record.slug || existing.pages !== pages))
			throw new Error(`Conflicting document locale: ${key}:${record.locale}`);
		const path = canonicalRoute(record.kind, record.locale, record.slug);
		if (!parseContentRoute(path)?.kinds.includes(record.kind)) {
			throw new Error(`Reserved or unsupported content route: ${path}`);
		}
		if (occupied.has(path) && occupied.get(path) !== key)
			throw new Error(`Canonical collision: ${path}`);
		occupied.set(path, key);
		map.documents[key] ??= {};
		map.documents[key][record.locale] = { slug: record.slug, pages };
		const index = `${record.kind}:${record.slug}`;
		map.slugIndex[index] ??= [];
		if (
			!map.slugIndex[index].some(
				([id, locale]) => id === key && locale === record.locale,
			)
		)
			map.slugIndex[index].push([key, record.locale]);
	}
	return map;
}

export function parseContentRoute(pathname: string) {
	// Do not broaden this into API, file, nested tour, or arbitrary pathname matching.
	if (/%(?:2f|5c)/i.test(pathname)) return null;
	try {
		pathname = decodeURIComponent(pathname);
	} catch {
		return null;
	}
	const match = pathname.match(
		/^\/(?:(es|pt)\/)?(?:(blog)\/)?([\p{L}\p{N}_-]+)(?:\/([1-9]\d*))?\/?$/u,
	);
	if (!match) return null;
	const locale = (match[1] ?? "en") as RouteLocale;
	const blog = !!match[2];
	const slug = match[3];
	if (blog && /^\d+$/.test(slug)) return null;
	if (
		(!blog && match[4]) ||
		["api", "blog", "es", "pt", "en", "cms", "dev", "404", "_astro"].includes(
			slug,
		)
	)
		return null;
	const page = match[4] ? Number(match[4]) : 1;
	if (!Number.isSafeInteger(page)) return null;
	return {
		locale,
		slug,
		page,
		kinds: (blog
			? match[4]
				? ["category"]
				: ["post", "category"]
			: ["tour", "page"]) as ContentKind[],
	};
}

export function resolveLocalizedRoute(
	pathname: string,
	map: RouteMap,
): Resolution {
	const route = parseContentRoute(pathname);
	if (!route) return null;
	const refs = route.kinds.flatMap(
		(kind) => map.slugIndex[`${kind}:${route.slug}`] ?? [],
	);
	// A real route always wins, even if another document uses this slug elsewhere.
	if (
		refs.some(([id]) => {
			const translated = map.documents[id]?.[route.locale];
			return translated?.slug === route.slug && translated.pages >= route.page;
		})
	)
		return null;
	const ids = [...new Set(refs.map(([id]) => id))];
	if (ids.length === 0) return null;
	if (ids.length !== 1) return { ambiguous: true };
	const id = ids[0];
	const kind = id.split(":")[0] as ContentKind;
	const translation = map.documents[id][route.locale];
	// Existing translation with insufficient pagination must remain 404.
	if (translation && translation.pages < route.page) return null;
	const source = refs.find(
		([key, locale]) =>
			key === id && (map.documents[id][locale]?.pages ?? 0) >= route.page,
	);
	if (!translation && !source) return null;
	const targetLocale = translation ? route.locale : source?.[1];
	if (!targetLocale) return null;
	const target = map.documents[id][targetLocale];
	if (!target) return null;
	const destination = canonicalRoute(
		kind,
		targetLocale,
		target.slug,
		route.page,
	);
	if (destination === pathname) return null;
	return { status: translation ? 301 : 302, pathname: destination };
}
