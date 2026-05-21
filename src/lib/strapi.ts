type QueryValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| Record<string, unknown>
	| unknown[];

interface Props {
	endpoint: string;
	query?: Record<string, QueryValue>;
	wrappedByKey?: string;
	wrappedByList?: boolean;
	locale?: string;
}

type StrapiListResponse<T> = {
	data: T[];
	meta?: {
		pagination?: {
			pageCount?: number;
		};
	};
};

const requestCache = new Map<string, unknown>();

function buildStrapiUrl({ endpoint, query, locale }: Props) {
	const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
	const baseUrl = import.meta.env.VITE_STRAPI_URL;

	if (!baseUrl) {
		throw new Error("VITE_STRAPI_URL no esta definida");
	}

	const url = new URL(`/api/${normalizedEndpoint}`, baseUrl);

	if (query) {
		Object.entries(query).forEach(([key, value]) => {
			if (value === undefined || value === null) return;

			if (typeof value === "object") {
				url.searchParams.append(key, JSON.stringify(value));
			} else {
				url.searchParams.append(key, String(value));
			}
		});
	}

	if (locale) {
		url.searchParams.set("locale", locale);
	}

	return url;
}

function unwrapData<T>(data: unknown, wrappedByKey?: string, wrappedByList?: boolean) {
	let result = data;

	if (wrappedByKey && result && typeof result === "object") {
		result = (result as Record<string, unknown>)[wrappedByKey];
	}
	if (wrappedByList && Array.isArray(result)) result = result[0];

	return result as T;
}

async function readJsonResponse<T>(res: Response, url: string): Promise<T> {
	if (!res.ok) {
		throw new Error(`Strapi request failed (${res.status}) for ${url}`);
	}

	return res.json() as Promise<T>;
}

/**
 * Fetches data from the Strapi API.
 */
export default async function fetchApi<T>({
	endpoint,
	query,
	wrappedByKey,
	wrappedByList,
	locale,
}: Props): Promise<T> {
	const url = buildStrapiUrl({ endpoint, query, locale });
	const urlString = url.toString();

	if (requestCache.has(urlString)) {
		return unwrapData<T>(requestCache.get(urlString), wrappedByKey, wrappedByList);
	}

	const res = await fetch(urlString);
	const rawData = await readJsonResponse<unknown>(res, urlString);

	requestCache.set(urlString, rawData);

	return unwrapData<T>(rawData, wrappedByKey, wrappedByList);
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
	const pageSize = 100;
	const firstPageRes = await fetchApi<StrapiListResponse<T>>({
		endpoint,
		locale,
		query: {
			...query,
			"pagination[page]": 1,
			"pagination[pageSize]": pageSize,
		},
	});

	const allData = Array.isArray(firstPageRes.data) ? [...firstPageRes.data] : [];
	const pageCount = firstPageRes.meta?.pagination?.pageCount || 1;

	if (pageCount > 1) {
		const concurrencyLimit = 5;

		for (let i = 2; i <= pageCount; i += concurrencyLimit) {
			const batchPromises: Promise<void>[] = [];

			for (let page = i; page < i + concurrencyLimit && page <= pageCount; page++) {
				batchPromises.push(
					fetchApi<StrapiListResponse<T>>({
						endpoint,
						locale,
						query: {
							...query,
							"pagination[page]": page,
							"pagination[pageSize]": pageSize,
						},
					}).then((res) => {
						if (Array.isArray(res.data)) {
							allData.push(...res.data);
						}
					}),
				);
			}

			await Promise.all(batchPromises);
		}
	}

	return allData;
}
