import type { APIRoute, GetStaticPaths } from "astro";
import { LOCALIZED_LANGS, isValidLang, type Lang } from "@/lib/i18n";
import { fetchTourSearchItems } from "@/lib/tourSearch";

export const getStaticPaths = (() =>
	LOCALIZED_LANGS.map((lang) => ({
		params: { lang },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
	const lang: Lang = isValidLang(params.lang) ? params.lang : "en";
	const tours = await fetchTourSearchItems(lang);

	return new Response(JSON.stringify(tours), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
};
