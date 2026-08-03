import { generateDescription, getImageAlt, getImageUrl } from "@/lib/helpers";
import { rewriteUrl } from "@/lib/utils";
import type { Blog } from "@/types/blog";
import type { Lang } from "@/lib/i18n";

export type BlogSearchItem = {
	id: string;
	title: string;
	href: string;
	excerpt: string;
	searchText: string;
	categories: string[];
	imageUrl?: string;
	imageAlt: string;
	publishedAt?: string;
	readingMinutes: number;
};

function getReadingMinutes(content: Blog["contenido"]) {
	const text = generateDescription(content, 10000);
	const wordCount = text.split(/\s+/).filter(Boolean).length;

	return Math.max(1, Math.ceil(wordCount / 210));
}

export function buildBlogSearchItems(
	blogs: Blog[],
	lang: Lang,
): BlogSearchItem[] {
	return blogs.map((blog) => {
		const excerpt = generateDescription(blog.contenido, 180);
		const searchText = generateDescription(blog.contenido, 1400);
		const categories = (blog.category_blogs || [])
			.map((category) => category.nombre)
			.filter(Boolean);
		const imageUrl = getImageUrl(blog.portadaImage, "medium");

		return {
			id: blog.documentId || String(blog.id),
			title: blog.titulo,
			href: rewriteUrl(`/blog/${blog.slug}`, lang),
			excerpt,
			searchText,
			categories,
			imageUrl: imageUrl === "/og-default.jpg" ? undefined : imageUrl,
			imageAlt: getImageAlt(blog.portadaImage, blog.titulo),
			publishedAt: blog.publishedAt || blog.createdAt,
			readingMinutes: getReadingMinutes(blog.contenido),
		};
	});
}
