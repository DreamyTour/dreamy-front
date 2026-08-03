import type { Blog } from "@/types/blog";

export function getCategoryPostCounts(blogs: Blog[]): Record<string, number> {
	const counts: Record<string, number> = {};

	for (const blog of blogs) {
		for (const category of blog.category_blogs || []) {
			if (!category.slug) continue;
			counts[category.slug] = (counts[category.slug] ?? 0) + 1;
		}
	}

	return counts;
}

export type BlogCategoryIconName =
	| "mountain"
	| "hiking"
	| "location"
	| "weather"
	| "waves"
	| "forest"
	| "itinerary"
	| "city"
	| "landmark"
	| "bird"
	| "plane"
	| "compass";

export function getCategoryIconName(slug: string): BlogCategoryIconName {
	const s = (slug || "").toLowerCase();

	// CMS categories for regional destinations.
	if (s.includes("bolivia")) return "landmark";
	if (s.includes("chile")) return "mountain";
	if (s.includes("lima")) return "city";
	if (s.includes("arequipa") || s.includes("colca")) return "bird";
	if (s.includes("ica") || s.includes("paracas") || s.includes("nazca")) {
		return "plane";
	}

	if (
		s.includes("machu") ||
		s.includes("picchu") ||
		s.includes("monta") ||
		s.includes("mountain")
	) {
		return "mountain";
	}
	if (
		s.includes("trail") ||
		s.includes("camino") ||
		s.includes("trilha") ||
		s.includes("trek") ||
		s.includes("hike") ||
		s.includes("walk")
	) {
		return "hiking";
	}
	if (
		s.includes("cusco") ||
		s.includes("pin") ||
		s.includes("destino") ||
		s.includes("destination") ||
		s.includes("ubica") ||
		s.includes("location")
	) {
		return "location";
	}
	if (
		s.includes("weather") ||
		s.includes("clima") ||
		s.includes("tiempo") ||
		s.includes("cloud") ||
		s.includes("nube")
	) {
		return "weather";
	}
	if (
		s.includes("lake") ||
		s.includes("lago") ||
		s.includes("titicaca") ||
		s.includes("water") ||
		s.includes("waves")
	) {
		return "waves";
	}
	if (
		s.includes("amazon") ||
		s.includes("selva") ||
		s.includes("jungle") ||
		s.includes("tree") ||
		s.includes("arbol") ||
		s.includes("forest") ||
		s.includes("floresta")
	) {
		return "forest";
	}
	if (
		s.includes("itinerar") ||
		s.includes("map") ||
		s.includes("plan") ||
		s.includes("guia") ||
		s.includes("guide") ||
		s.includes("ruta") ||
		s.includes("route")
	) {
		return "itinerary";
	}
	if (
		s.includes("peru") ||
		s.includes("travel") ||
		s.includes("viaje") ||
		s.includes("turis") ||
		s.includes("tour") ||
		s.includes("viag")
	) {
		return "compass";
	}

	return "compass";
}

const categoryIconSvg: Record<BlogCategoryIconName, string> = {
	mountain:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
	hiking:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 8v5"/><path d="m14 13-1-3-2-1-3 1"/><path d="m12 18-2-5 2 5"/><path d="m10 21 2-3 2 3"/><path d="M17 10v12"/></svg>',
	location:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
	weather:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A6 6 0 0 0 3 12c0 3.31 2.69 6 6 6h8.5Z"/></svg>',
	waves:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
	forest:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 13-7 4h14l-7-4z"/><path d="m12 9-6 4h12l-6-4z"/><path d="m12 5-5 4h10l-5-4z"/><path d="M12 17v4"/></svg>',
	itinerary:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
	city:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>',
	landmark:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/></svg>',
	bird:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>',
	plane:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
	compass:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
};

export function getCategoryIcon(slug: string) {
	return categoryIconSvg[getCategoryIconName(slug)];
}
