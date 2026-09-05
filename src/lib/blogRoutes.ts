import { getCategoryPostCounts } from "@/lib/blogCategories";
import { DEFAULT_LANG, LANGS, type Lang, LOCALIZED_LANGS } from "@/lib/i18n";
import fetchApi, { fetchAllStrapi } from "@/lib/strapi";
import type { Blog, CategoryBlog } from "@/types/blog";
import type { Logo } from "@/types/common";

export type GlobalData = {
	footer?: { socialLogo?: Logo[] };
	socialLogo?: Logo[];
};

export type PaginatedBlogPage = {
	data: Blog[];
	currentPage: number;
	lastPage: number;
	url: { prev?: string | null; next?: string | null };
};

export type Paginate = (
	data: Blog[],
	options: {
		params?: Record<string, string>;
		pageSize: number;
		props?: Record<string, unknown>;
	},
) => unknown[];

export type BlogListProps = {
	page: PaginatedBlogPage;
	lang: Lang;
	searchBlogs: Blog[];
	allCategories: CategoryBlog[];
	socialLogos: Logo[];
	categoryPostCounts: Record<string, number>;
	totalPostCount: number;
};

export type BlogPostProps = {
	blog: Blog;
	lang: Lang;
	searchBlogs: Blog[];
	allCategories: CategoryBlog[];
	slugMap: Record<string, string>;
	globalData: GlobalData;
	relatedBlogs: Blog[];
	categoryPostCounts: Record<string, number>;
	totalPostCount: number;
};

export type BlogCategoryProps = {
	page: PaginatedBlogPage;
	lang: Lang;
	searchBlogs: Blog[];
	allCategories: CategoryBlog[];
	currentCategory: CategoryBlog;
	categorySlug: string;
	socialLogos: Logo[];
	slugMap: Record<string, string>;
	categoryPostCounts: Record<string, number>;
	totalPostCount: number;
};

async function fetchBlogs(lang: string) {
	const blogs = await fetchAllStrapi<Blog>({
		endpoint: "posts",
		locale: lang,
		query: { sort: "publishedAt:desc,id:desc" },
	});

	return blogs && Array.isArray(blogs) ? blogs : [];
}

async function fetchCategories(lang: string) {
	const categories = await fetchAllStrapi<CategoryBlog>({
		endpoint: "category-blogs",
		locale: lang,
		query: { sort: "id:asc" },
	});

	return categories && Array.isArray(categories) ? categories : [];
}

async function fetchGlobalData(lang: string) {
	return await fetchApi<GlobalData>({
		endpoint: "global",
		wrappedByKey: "data",
		locale: lang,
	});
}

function getSocialLogos(globalData?: GlobalData) {
	return globalData?.footer?.socialLogo || globalData?.socialLogo || [];
}

async function loadBlogDataByLang() {
	const blogsByLang: Record<string, Blog[]> = {};
	const categoriesByLang: Record<string, CategoryBlog[]> = {};
	const globalDataByLang: Record<string, GlobalData> = {};

	for (const lang of LANGS) {
		blogsByLang[lang] = await fetchBlogs(lang);
		categoriesByLang[lang] = await fetchCategories(lang);
		globalDataByLang[lang] = await fetchGlobalData(lang);
	}

	return { blogsByLang, categoriesByLang, globalDataByLang };
}

function buildPostSlugMap(blogsByLang: Record<string, Blog[]>) {
	const slugsByDocId: Record<string, Record<string, string>> = {};

	for (const lang of LANGS) {
		for (const blog of blogsByLang[lang] || []) {
			slugsByDocId[blog.documentId] ??= {};
			slugsByDocId[blog.documentId][lang] = blog.slug;
		}
	}

	return slugsByDocId;
}

function buildCategorySlugMap(
	categoriesByLang: Record<string, CategoryBlog[]>,
) {
	const slugsByDocId: Record<string, Record<string, string>> = {};

	for (const lang of LANGS) {
		for (const category of categoriesByLang[lang] || []) {
			slugsByDocId[category.documentId] ??= {};
			slugsByDocId[category.documentId][lang] = category.slug;
		}
	}

	return slugsByDocId;
}

function getRelatedBlogs(blog: Blog, blogs: Blog[]) {
	const categories = blog.category_blogs || [];

	return blogs
		.filter(
			(item) =>
				item.documentId !== blog.documentId &&
				item.category_blogs?.some((category: CategoryBlog) =>
					categories.some(
						(current: CategoryBlog) =>
							current.documentId === category.documentId,
					),
				),
		)
		.slice(0, 3);
}

export async function getBlogIndexPaths({
	paginate,
	localized,
}: {
	paginate: Paginate;
	localized: boolean;
}) {
	const allPaths: unknown[] = [];
	const langs = localized ? LOCALIZED_LANGS : [DEFAULT_LANG];

	for (const lang of langs) {
		const blogsList = await fetchBlogs(lang);
		const allCategories = await fetchCategories(lang);
		const globalData = await fetchGlobalData(lang);

		allPaths.push(
			...paginate(blogsList, {
				params: localized ? { lang } : undefined,
				pageSize: 12,
				props: {
					lang,
					searchBlogs: blogsList,
					allCategories,
					socialLogos: getSocialLogos(globalData),
					categoryPostCounts: getCategoryPostCounts(blogsList),
					totalPostCount: blogsList.length,
				},
			}),
		);
	}

	return allPaths;
}

export async function getBlogPostPaths({ localized }: { localized: boolean }) {
	const paths: Array<{
		params: { lang?: string; slug: string };
		props: Partial<BlogPostProps>;
	}> = [];
	const { blogsByLang, categoriesByLang, globalDataByLang } =
		await loadBlogDataByLang();
	const slugsByDocId = buildPostSlugMap(blogsByLang);
	const langs = localized ? LOCALIZED_LANGS : [DEFAULT_LANG];

	for (const lang of langs) {
		const blogsList = blogsByLang[lang] || [];
		const categoryPostCounts = getCategoryPostCounts(blogsList);
		const totalPostCount = blogsList.length;

		for (const blog of blogsList) {
			paths.push({
				params: localized ? { lang, slug: blog.slug } : { slug: blog.slug },
				props: {
					blog,
					lang: lang as Lang,
					searchBlogs: blogsList,
					allCategories: categoriesByLang[lang] || [],
					slugMap: slugsByDocId[blog.documentId] ?? {},
					globalData: globalDataByLang[lang],
					relatedBlogs: getRelatedBlogs(blog, blogsList),
					categoryPostCounts,
					totalPostCount,
				},
			});
		}
	}

	return paths;
}

export async function getBlogCategoryPaths({
	paginate,
	localized,
}: {
	paginate: Paginate;
	localized: boolean;
}) {
	const allPaths: unknown[] = [];
	const { blogsByLang, categoriesByLang, globalDataByLang } =
		await loadBlogDataByLang();
	const categorySlugsByDocId = buildCategorySlugMap(categoriesByLang);
	const langs = localized ? LOCALIZED_LANGS : [DEFAULT_LANG];

	for (const lang of langs) {
		const blogsList = blogsByLang[lang] || [];
		const allCategories = categoriesByLang[lang] || [];
		const categoryPostCounts = getCategoryPostCounts(blogsList);
		const totalPostCount = blogsList.length;
		const socialLogos = getSocialLogos(globalDataByLang[lang]);

		for (const category of allCategories) {
			const categorySlug = category.slug;
			const filteredBlogs = blogsList.filter((blog: Blog) =>
				blog.category_blogs?.some(
					(item: CategoryBlog) => item.slug === categorySlug,
				),
			);
			const sharedProps = {
				lang,
				searchBlogs: blogsList,
				allCategories,
				currentCategory: category,
				categorySlug,
				socialLogos,
				slugMap: categorySlugsByDocId[category.documentId] ?? {},
				categoryPostCounts,
				totalPostCount,
			};

			if (filteredBlogs.length > 0) {
				allPaths.push(
					...paginate(filteredBlogs, {
						params: localized
							? { lang, category: categorySlug }
							: { category: categorySlug },
						pageSize: 9,
						props: sharedProps,
					}),
				);
				continue;
			}

			allPaths.push({
				params: localized
					? { lang, category: categorySlug }
					: { category: categorySlug },
				props: {
					...sharedProps,
					page: {
						data: [],
						currentPage: 1,
						lastPage: 1,
						url: { prev: null, next: null },
					},
				},
			});
		}
	}

	return allPaths;
}
