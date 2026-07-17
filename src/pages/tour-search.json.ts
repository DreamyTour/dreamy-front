import type { APIRoute } from "astro";
import { DEFAULT_LANG } from "@/lib/i18n";
import { fetchTourSearchItems } from "@/lib/tourSearch";

export const GET: APIRoute = async () => {
	const tours = await fetchTourSearchItems(DEFAULT_LANG);

	return new Response(JSON.stringify(tours), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
};
