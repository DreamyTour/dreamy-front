interface Props {
	endpoint: string;
	query?: Record<string, any>;
	wrappedByKey?: string;
	wrappedByList?: boolean;
	locale?: string; // 👈 NUEVO
}

// Global cache to avoid redundant requests during Astro builds
const requestCache = new Map<string, any>();

/**
 * Fetches data from the Strapi API
 */
export default async function fetchApi<T>({
	endpoint,
	query,
	wrappedByKey,
	wrappedByList,
	locale,
}: Props): Promise<T> {
	if (endpoint.startsWith("/")) {
		endpoint = endpoint.slice(1);
	}

	const baseUrl = import.meta.env.VITE_STRAPI_URL;

	if (!baseUrl) {
		throw new Error("VITE_STRAPI_URL no está definida");
	}

	const url = new URL(`/api/${endpoint}`, baseUrl);

	// 🔹 Query params - maneja objetos anidados para populate
	if (query) {
		Object.entries(query).forEach(([key, value]) => {
			if (typeof value === "object") {
				url.searchParams.append(key, JSON.stringify(value));
			} else {
				url.searchParams.append(key, String(value));
			}
		});
	}

	// 🔹 Locale (CLAVE)
	if (locale) {
		url.searchParams.set("locale", locale);
	}

	const urlString = url.toString();

	// Check cache
	if (requestCache.has(urlString)) {
		let data = requestCache.get(urlString);
		if (wrappedByKey) data = data[wrappedByKey];
		if (wrappedByList) data = data[0];
		return data as T;
	}

	const res = await fetch(urlString);
	const rawData = await res.json();

	// Store raw data in cache before wrapping
	requestCache.set(urlString, rawData);

	let data = rawData;

	if (wrappedByKey) data = data[wrappedByKey];
	if (wrappedByList) data = data[0];

	return data as T;
}

/**
 * Fetches all pages of data from a Strapi endpoint.
 * Useful for static generation (getStaticPaths) to avoid manual pageSize limits.
 */
export async function fetchAllStrapi<T>({
	endpoint,
	query = {},
	locale,
}: Omit<Props, "wrappedByKey" | "wrappedByList">): Promise<T[]> {
	const pageSize = 100; // Optimal page size for fetching
	const firstPageRes = await fetchApi<{ data: T[]; meta: { pagination: { pageCount: number } } }>({
		endpoint,
		locale,
		query: {
			...query,
			"pagination[page]": 1,
			"pagination[pageSize]": pageSize,
		},
	});

	const allData: T[] = firstPageRes.data && Array.isArray(firstPageRes.data) ? [...firstPageRes.data] : [];
	const pageCount = firstPageRes.meta?.pagination?.pageCount || 1;

	if (pageCount > 1) {
		const CONCURRENCY_LIMIT = 5; // Evita saturar el servidor de Strapi
		for (let i = 2; i <= pageCount; i += CONCURRENCY_LIMIT) {
			const batchPromises: Promise<void>[] = [];
			
			for (let page = i; page < i + CONCURRENCY_LIMIT && page <= pageCount; page++) {
				batchPromises.push(
					fetchApi<{ data: T[] }>({
						endpoint,
						locale,
						query: {
							...query,
							"pagination[page]": page,
							"pagination[pageSize]": pageSize,
						},
					}).then((res) => {
						if (res.data && Array.isArray(res.data)) {
							allData.push(...res.data);
						}
					})
				);
			}

			// Espera a que termine este lote antes de empezar el siguiente
			await Promise.all(batchPromises);
		}
	}

	return allData;
}
