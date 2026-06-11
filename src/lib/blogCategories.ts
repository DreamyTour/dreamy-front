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

export function getCategoryIcon(slug: string) {
	const s = (slug || "").toLowerCase();
	
	if (s.includes("machu") || s.includes("picchu") || s.includes("monta") || s.includes("mountain")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
	}
	if (s.includes("trail") || s.includes("camino") || s.includes("trilha") || s.includes("trek") || s.includes("hike") || s.includes("walk")) {
		// Walker / hiking stick SVG matching the walker icon in the mockup
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 8v5"/><path d="m14 13-1-3-2-1-3 1"/><path d="m12 18-2-5 2 5"/><path d="m10 21 2-3 2 3"/><path d="M17 10v12"/></svg>`;
	}
	if (s.includes("cusco") || s.includes("pin") || s.includes("destino") || s.includes("destination") || s.includes("ubica") || s.includes("location")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
	}
	if (s.includes("weather") || s.includes("clima") || s.includes("tiempo") || s.includes("cloud") || s.includes("nube")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A6 6 0 0 0 3 12c0 3.31 2.69 6 6 6h8.5Z"/></svg>`;
	}
	if (s.includes("lake") || s.includes("lago") || s.includes("titicaca") || s.includes("water") || s.includes("waves")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
	}
	if (s.includes("amazon") || s.includes("selva") || s.includes("jungle") || s.includes("tree") || s.includes("arbol") || s.includes("forest") || s.includes("floresta")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 13-7 4h14l-7-4z"/><path d="m12 9-6 4h12l-6-4z"/><path d="m12 5-5 4h10l-5-4z"/><path d="M12 17v4"/></svg>`;
	}
	if (s.includes("itinerar") || s.includes("map") || s.includes("plan") || s.includes("guia") || s.includes("guide") || s.includes("ruta") || s.includes("route")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
	}
	if (s.includes("peru") || s.includes("travel") || s.includes("viaje") || s.includes("turis") || s.includes("tour") || s.includes("viag")) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
	}
	
	// Default icon: compass
	return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
}

