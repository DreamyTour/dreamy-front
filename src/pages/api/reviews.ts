import type { APIRoute } from "astro";

export const prerender = false;

type ReviewSource = "tripadvisor" | "google";

type Review = {
	id: string;
	source: ReviewSource;
	author: string;
	title?: string;
	text: string;
	rating: number;
	date?: string;
	url?: string;
	avatar?: string;
};

type SourceSummary = {
	source: ReviewSource;
	name: string;
	rating?: number;
	reviewCount?: number;
	url?: string;
	configured: boolean;
	error?: string;
};

const TRIPADVISOR_LOCATION_ID =
	import.meta.env.TRIPADVISOR_LOCATION_ID || "17325827";
const TRIPADVISOR_URL =
	import.meta.env.TRIPADVISOR_REVIEW_URL ||
	"https://www.tripadvisor.com.pe/Attraction_Review-g294314-d17325827-Reviews-Dreamy_Tours-Cusco_Cusco_Region.html";
const GOOGLE_MAPS_URL =
	import.meta.env.GOOGLE_MAPS_URL ||
	"https://www.google.com/maps/place/Dreamy+Tours/@-13.524429,-71.9506049,1057m/data=!3m2!1e3!4b1!4m6!3m5!1s0x916dd587b52c49c5:0xdaa973fe4585e28a!8m2!3d-13.5244342!4d-71.94803!16s%2Fg%2F11fkv9g6rk";
const DEFAULT_QUERY = "Dreamy Tours Cusco Peru";

const json = (body: unknown, init?: ResponseInit) =>
	new Response(JSON.stringify(body), {
		...init,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "public, s-maxage=1800, stale-while-revalidate=86400",
			...(init?.headers || {}),
		},
	});

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const temporarySummaries: Record<ReviewSource, SourceSummary> = {
	tripadvisor: {
		source: "tripadvisor",
		name: "Tripadvisor",
		rating: 4.9,
		reviewCount: 12910,
		url: TRIPADVISOR_URL,
		configured: false,
	},
	google: {
		source: "google",
		name: "Google Reviews",
		rating: 4.9,
		reviewCount: 552,
		url: GOOGLE_MAPS_URL,
		configured: false,
	},
};

const temporaryReviews: Review[] = [
	{
		id: "tripadvisor-temp-1",
		source: "tripadvisor",
		author: "Cliente Tripadvisor",
		title: "Experiencia muy gratificante",
		text: "Fue una experiencia única, la atención fue genial, muy amigables y cumplieron con todo, me voy satisfecho.",
		rating: 5,
		date: "2026-04-29",
		url: "https://www.tripadvisor.com.pe/ShowUserReviews-g294314-d28270483-r1058317381-5_day_adventure_Trek_Salkantay_to_Machu_Picchu-Cusco_Cusco_Region.html",
	},
	{
		id: "tripadvisor-temp-2",
		source: "tripadvisor",
		author: "Cliente Tripadvisor",
		title: "Estuvo todo excelente",
		text: "Fue una experiencia increíble. Mucho más de lo q imaginaba. El guía llevó un ritmo acorde para q lleguemos bien ya q el camino es exigente. La comida fue variada y abundante. Todo de 10! La misma empresa me ayudó con el alojamiento y Zaida estuvo siempre pendiente de que yo me encuentre bien. Esperó mi llegada al hotel con regalo. Súper conforme.",
		rating: 5,
		date: "2026-05-04",
		url: "https://www.tripadvisor.com.pe/ShowUserReviews-g294318-d26448780-r1059010011-Inca_Trail_Machu_Picchu_4_Days-Machu_Picchu_Sacred_Valley_Cusco_Region.html",
	},
	{
		id: "tripadvisor-temp-3",
		source: "tripadvisor",
		author: "Cliente Tripadvisor",
		title: "Excelente experiencia visitando Valle Sagrado y Machu Picchu",
		text: "Excelente agencia. Super responsables, puntuales y serviciales.",
		rating: 5,
		date: "2026-05-04",
		url: "https://www.tripadvisor.com.pe/ShowUserReviews-g294314-d23904536-r1059015163-2_Day_Guided_Tour_to_Sacred_Valley_and_Machu_Picchu_by_Train-Cusco_Cusco_Regio.html",
	},
	{
		id: "google-temp-1",
		source: "google",
		author: "Johanna Nava Hayden",
		text: "Contratamos la agencia desde Argentina, y de principio a fin la experiencia fue excelente! Muy buena atención, siempre están en contacto para lo que necesites. Los tours, guías, hospedajes y transportes que brindan son muy buenos, estamos súper contentos y agradecidos.",
		rating: 5,
		date: "2024-06-15",
		url: GOOGLE_MAPS_URL,
	},
	{
		id: "google-temp-2",
		source: "google",
		author: "Victor Jean Pierrr Parimango Alvarez",
		text: "Nuestro viaje familiar a Cusco y Machu Picchu este agosto con Dreamy Tours fue increíble. Éramos cinco, con niños y adolescentes, y la agencia organizó todo perfectamente: traslados puntuales, un guía excelente y recomendaciones geniales que hicieron el viaje inolvidable. ¡Súper recomendados!",
		rating: 5,
		date: "2025-09-15",
		url: GOOGLE_MAPS_URL,
	},
	{
		id: "google-temp-3",
		source: "google",
		author: "Carla Miguez",
		text: "Me gustó mucho el tour ya que pude disfrutar de hermosos paisajes como la laguna de Umayo y las torres, acompañado de un clima agradable, y además ver una gran variedad de artesanías. Excelente guía, su explicación fue muy concisa e interesante sobre el complejo. Me gustó visitar el caserío del pueblo cercano y aprender un poco sobre su forma de vida. Gracias equipo de Dreamy Tours por brindar un excelente servicio y buen manejo de los horarios, los recomiendo.",
		rating: 5,
		date: "2022-06-15",
		url: GOOGLE_MAPS_URL,
	},
];

const getTemporaryReviews = (source: ReviewSource) =>
	takeLatest(temporaryReviews.filter((review) => review.source === source));

const takeLatest = (reviews: Review[]) =>
	reviews
		.filter((review) => review.text)
		.sort((a, b) => {
			const left = a.date ? Date.parse(a.date) : 0;
			const right = b.date ? Date.parse(b.date) : 0;
			return right - left;
		})
		.slice(0, 3);

async function getTripadvisorReviews(lang: string): Promise<{
	summary: SourceSummary;
	reviews: Review[];
}> {
	const apiKey = import.meta.env.TRIPADVISOR_API_KEY;
	const summary: SourceSummary = {
		source: "tripadvisor",
		name: "Tripadvisor",
		url: TRIPADVISOR_URL,
		configured: Boolean(apiKey),
	};

	if (!apiKey) {
		return {
			summary: temporarySummaries.tripadvisor,
			reviews: getTemporaryReviews("tripadvisor"),
		};
	}

	try {
		const detailsUrl = new URL(
			`https://api.content.tripadvisor.com/api/v1/location/${TRIPADVISOR_LOCATION_ID}/details`,
		);
		detailsUrl.searchParams.set("key", apiKey);
		detailsUrl.searchParams.set("language", lang);
		detailsUrl.searchParams.set("currency", "USD");

		const reviewsUrl = new URL(
			`https://api.content.tripadvisor.com/api/v1/location/${TRIPADVISOR_LOCATION_ID}/reviews`,
		);
		reviewsUrl.searchParams.set("key", apiKey);
		reviewsUrl.searchParams.set("language", lang);

		const [detailsResponse, reviewsResponse] = await Promise.all([
			fetch(detailsUrl),
			fetch(reviewsUrl),
		]);

		if (!reviewsResponse.ok) {
			throw new Error(`Tripadvisor respondio ${reviewsResponse.status}`);
		}

		const details = detailsResponse.ok ? await detailsResponse.json() : {};
		const reviewsPayload = await reviewsResponse.json();
		const data = Array.isArray(reviewsPayload?.data) ? reviewsPayload.data : [];

		const reviews: Review[] = data.map(
			(item: Record<string, any>, index: number) => ({
				id: `tripadvisor-${item.id || index}`,
				source: "tripadvisor",
				author:
					item.user?.username || item.user?.name || item.username || "Traveler",
				title: item.title,
				text: item.text || item.review || "",
				rating: toNumber(item.rating) || 5,
				date: item.published_date || item.travel_date || item.created_date,
				url: item.url || details?.web_url || TRIPADVISOR_URL,
				avatar: item.user?.avatar?.thumbnail || item.user?.avatar?.small,
			}),
		);

		return {
			summary: {
				...summary,
				rating: toNumber(details?.rating),
				reviewCount: toNumber(details?.num_reviews),
				url: details?.web_url || TRIPADVISOR_URL,
			},
			reviews: takeLatest(reviews),
		};
	} catch (error) {
		return {
			summary: {
				...temporarySummaries.tripadvisor,
				error: error instanceof Error ? error.message : "Error de Tripadvisor",
			},
			reviews: getTemporaryReviews("tripadvisor"),
		};
	}
}

async function findGooglePlaceId(apiKey: string) {
	const searchUrl = new URL(
		"https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
	);
	searchUrl.searchParams.set("key", apiKey);
	searchUrl.searchParams.set("input", import.meta.env.GOOGLE_PLACE_QUERY || DEFAULT_QUERY);
	searchUrl.searchParams.set("inputtype", "textquery");
	searchUrl.searchParams.set("fields", "place_id");

	const response = await fetch(searchUrl);
	if (!response.ok) return "";
	const payload = await response.json();
	return payload?.candidates?.[0]?.place_id || "";
}

async function getGoogleReviews(lang: string): Promise<{
	summary: SourceSummary;
	reviews: Review[];
}> {
	const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
	const summary: SourceSummary = {
		source: "google",
		name: "Google Reviews",
		url: GOOGLE_MAPS_URL || undefined,
		configured: Boolean(apiKey),
	};

	if (!apiKey) {
		return {
			summary: temporarySummaries.google,
			reviews: getTemporaryReviews("google"),
		};
	}

	try {
		const placeId = import.meta.env.GOOGLE_PLACE_ID || (await findGooglePlaceId(apiKey));

		if (!placeId) {
			throw new Error("No se encontro GOOGLE_PLACE_ID");
		}

		const detailsUrl = new URL(
			"https://maps.googleapis.com/maps/api/place/details/json",
		);
		detailsUrl.searchParams.set("key", apiKey);
		detailsUrl.searchParams.set("place_id", placeId);
		detailsUrl.searchParams.set(
			"fields",
			"name,rating,user_ratings_total,url,reviews",
		);
		detailsUrl.searchParams.set("language", lang);
		detailsUrl.searchParams.set("reviews_sort", "newest");

		const response = await fetch(detailsUrl);
		if (!response.ok) {
			throw new Error(`Google respondio ${response.status}`);
		}

		const payload = await response.json();
		const result = payload?.result || {};
		const data = Array.isArray(result.reviews) ? result.reviews : [];

		const reviews: Review[] = data.map(
			(item: Record<string, any>, index: number) => ({
				id: `google-${item.time || index}`,
				source: "google",
				author: item.author_name || "Google user",
				text: item.text || "",
				rating: toNumber(item.rating) || 5,
				date: item.time
					? new Date(Number(item.time) * 1000).toISOString()
					: undefined,
				url: item.author_url || result.url || GOOGLE_MAPS_URL || undefined,
				avatar: item.profile_photo_url,
			}),
		);

		return {
			summary: {
				...summary,
				rating: toNumber(result.rating),
				reviewCount: toNumber(result.user_ratings_total),
				url: result.url || GOOGLE_MAPS_URL || undefined,
			},
			reviews: takeLatest(reviews),
		};
	} catch (error) {
		return {
			summary: {
				...temporarySummaries.google,
				error: error instanceof Error ? error.message : "Error de Google",
			},
			reviews: getTemporaryReviews("google"),
		};
	}
}

export const GET: APIRoute = async ({ url }) => {
	const lang = url.searchParams.get("lang") || "es";
	const safeLang = ["es", "en", "pt"].includes(lang) ? lang : "es";

	const [tripadvisor, google] = await Promise.all([
		getTripadvisorReviews(safeLang),
		getGoogleReviews(safeLang),
	]);

	return json({
		updatedAt: new Date().toISOString(),
		sources: [tripadvisor.summary, google.summary],
		reviews: [...tripadvisor.reviews, ...google.reviews],
	});
};
