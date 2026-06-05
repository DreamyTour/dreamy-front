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
