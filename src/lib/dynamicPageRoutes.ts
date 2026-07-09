import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { DEFAULT_LANG, LANGS, type Lang } from "@/lib/i18n";
import type { ManualSEO } from "@/lib/seo";
import { fetchAllStrapi } from "@/lib/strapi";
import { dedupeLocalizedDocuments } from "@/lib/utils";
import type { Page, Category as PageCategory } from "@/types/page";
import type { Tour, Category as TourCategory } from "@/types/tours";

export interface MdxFrontmatter {
	title: string;
	description?: string;
	lang: Lang;
	seo?: ManualSEO;
	heroImage?: string;
	heroImageAlt?: string;
}

export interface DynamicPageProps {
	type: "mdx" | "tour" | "page";
	tour?: Tour;
	page?: Page;
	slugMap?: Record<string, string>;
	pageSlugMap?: Record<string, string>;
	mdxComponent?: { default?: AstroComponentFactory };
	mdxFrontmatter?: MdxFrontmatter;
	isRedirect?: boolean;
	redirectTo?: string;
	toursRelated?: Tour[];
	toursByCategory?: Tour[];
}

type DefaultRoutePath = {
	params: { slug: string };
	props: DynamicPageProps;
};

type LocalizedRoutePath = {
	params: { lang: string; slug: string };
	props: Partial<DynamicPageProps>;
};

async function loadMdxPages() {
	const mdxPages = import.meta.glob("@/content/pages/**/*.mdx");
	const entries: Array<{
		lang: string;
		slug: string;
		mod: { default?: AstroComponentFactory };
		frontmatter: MdxFrontmatter & { slugs?: Record<string, string> };
	}> = [];

	for (const path in mdxPages) {
		const mod = (await mdxPages[path]()) as {
			default?: AstroComponentFactory;
			frontmatter?: MdxFrontmatter & { slugs?: Record<string, string> };
		};
		const frontmatter = mod.frontmatter;
		if (!frontmatter) continue;

		const subpath = path.split("/content/pages/")[1].replace(".mdx", "");
		const [lang, slug] = subpath.split("/");
		entries.push({ lang, slug, mod, frontmatter });
	}

	return entries;
}

async function loadStrapiPagesByLang() {
	const allToursByLang: Record<string, Tour[]> = {};
	const allPagesByLang: Record<string, Page[]> = {};

	for (const lang of LANGS) {
		const tours = await fetchAllStrapi<Tour>({
			endpoint: "tours",
			locale: lang,
			query: {
				populate: "*",
			},
		});

		const pages = await fetchAllStrapi<Page>({
			endpoint: "pages",
			locale: lang,
			query: {
				populate: "*",
			},
		});

		allToursByLang[lang] =
			tours && Array.isArray(tours) ? dedupeLocalizedDocuments(tours) : [];
		allPagesByLang[lang] =
			pages && Array.isArray(pages) ? dedupeLocalizedDocuments(pages) : [];
	}

	return { allToursByLang, allPagesByLang };
}

function buildTourSlugMap(allToursByLang: Record<string, Tour[]>) {
	const slugsByDocId: Record<string, Record<string, string>> = {};

	for (const lang of LANGS) {
		for (const tour of allToursByLang[lang]) {
			slugsByDocId[tour.documentId] ??= {};
			slugsByDocId[tour.documentId][lang] = tour.slug;
		}
	}

	return slugsByDocId;
}

function buildPageSlugMap(allPagesByLang: Record<string, Page[]>) {
	const pageSlugsByDocId: Record<string, Record<string, string>> = {};

	for (const lang of LANGS) {
		for (const page of allPagesByLang[lang]) {
			pageSlugsByDocId[page.documentId] ??= {};
			pageSlugsByDocId[page.documentId][lang] = page.slug;
		}
	}

	return pageSlugsByDocId;
}

function getRelatedTours(tour: Tour, tours: Tour[]) {
	const categorySlug = tour?.categories?.[0]?.slug;
	let related = tours.filter((item) => item.slug !== tour.slug);

	if (categorySlug) {
		related = related.filter((item) =>
			item.categories?.some(
				(category: TourCategory) => category.slug === categorySlug,
			),
		);
	}

	return related.slice(0, 3);
}

function getToursByPageCategory(page: Page, tours: Tour[]) {
	const pageDestinationCategory =
		page?.categories?.find(
			(category: PageCategory) => category.slug !== "peru-tours",
		) ?? (page?.slug ? { slug: page.slug, nombre: page.titulo } : undefined);

	if (!pageDestinationCategory?.slug) return [];

	return tours.filter((tour) =>
		tour.categories?.some(
			(category: TourCategory) =>
				category.slug === pageDestinationCategory.slug,
		),
	);
}

export async function getDefaultLangDynamicPaths(): Promise<
	DefaultRoutePath[]
> {
	const paths: DefaultRoutePath[] = [];
	const mdxPages = await loadMdxPages();

	for (const { lang, slug, mod, frontmatter } of mdxPages) {
		if (lang !== DEFAULT_LANG) continue;

		paths.push({
			params: { slug },
			props: {
				type: "mdx",
				mdxComponent: mod,
				mdxFrontmatter: frontmatter,
				pageSlugMap: frontmatter.slugs || {},
			},
		});
	}

	const { allToursByLang, allPagesByLang } = await loadStrapiPagesByLang();
	const slugsByDocId = buildTourSlugMap(allToursByLang);
	const pageSlugsByDocId = buildPageSlugMap(allPagesByLang);
	const defaultTours = allToursByLang[DEFAULT_LANG] || [];

	for (const tour of defaultTours) {
		paths.push({
			params: { slug: tour.slug },
			props: {
				type: "tour",
				tour,
				slugMap: slugsByDocId[tour.documentId] ?? {},
				toursRelated: getRelatedTours(tour, defaultTours),
			},
		});
	}

	for (const page of allPagesByLang[DEFAULT_LANG] || []) {
		pageSlugsByDocId[page.documentId] ??= {};
		pageSlugsByDocId[page.documentId][DEFAULT_LANG] = page.slug;

		paths.push({
			params: { slug: page.slug },
			props: {
				type: "page",
				page,
				pageSlugMap: pageSlugsByDocId[page.documentId] ?? {},
				toursByCategory: getToursByPageCategory(page, defaultTours),
			},
		});
	}

	return paths;
}

export async function getLocalizedDynamicPaths(): Promise<
	LocalizedRoutePath[]
> {
	const paths: LocalizedRoutePath[] = [];
	const mdxPages = await loadMdxPages();

	for (const { lang, slug, mod, frontmatter } of mdxPages) {
		paths.push({
			params: { lang, slug },
			props: {
				type: "mdx",
				mdxComponent: mod,
				mdxFrontmatter: frontmatter,
				pageSlugMap: frontmatter.slugs || {},
			},
		});
	}

	const { allToursByLang, allPagesByLang } = await loadStrapiPagesByLang();
	const slugsByDocId = buildTourSlugMap(allToursByLang);

	for (const lang of LANGS) {
		const tours = allToursByLang[lang] || [];

		for (const tour of tours) {
			paths.push({
				params: { lang, slug: tour.slug },
				props: {
					type: "tour",
					tour,
					slugMap: slugsByDocId[tour.documentId] ?? {},
					toursRelated: getRelatedTours(tour, tours),
				},
			});
		}
	}

	const pageSlugsByDocId: Record<string, Record<string, string>> = {};

	for (const lang of LANGS) {
		const pages = allPagesByLang[lang] || [];
		const tours = allToursByLang[lang] || [];

		for (const page of pages) {
			pageSlugsByDocId[page.documentId] ??= {};
			pageSlugsByDocId[page.documentId][lang] = page.slug;

			paths.push({
				params: { lang, slug: page.slug },
				props: {
					type: "page",
					page,
					pageSlugMap: pageSlugsByDocId[page.documentId] ?? {},
					toursByCategory: getToursByPageCategory(page, tours),
				},
			});
		}
	}

	for (const [docId, slugMap] of Object.entries(pageSlugsByDocId)) {
		const slugs = Object.entries(slugMap) as [string, string][];

		for (const [langA, slugA] of slugs) {
			for (const [langB, slugB] of slugs) {
				if (langA === langB || slugA === slugB) continue;

				paths.push({
					params: { lang: langA, slug: slugB },
					props: {
						type: "page",
						isRedirect: true,
						redirectTo: `/${langA}/${slugMap[langA]}`,
						page: allPagesByLang[langA]?.find(
							(page: Page) => page.documentId === docId,
						),
						pageSlugMap: slugMap,
					},
				});
			}
		}
	}

	const defaultLangTours = allToursByLang[DEFAULT_LANG] || [];
	const allTourPathsBySlug: Record<string, string[]> = {};

	for (const path of paths) {
		if (path.props?.type !== "tour") continue;
		const slug = path.params.slug;
		allTourPathsBySlug[slug] ??= [];
		allTourPathsBySlug[slug].push(path.params.lang);
	}

	for (const lang of LANGS) {
		if (lang === DEFAULT_LANG) continue;

		const currentLangTours = allToursByLang[lang] || [];
		const currentSlugs = new Set(
			currentLangTours.map((tour: Tour) => tour.slug),
		);

		for (const defaultTour of defaultLangTours) {
			if (currentSlugs.has(defaultTour.slug)) continue;

			const slugLanguages = allTourPathsBySlug[defaultTour.slug] || [];
			if (!slugLanguages.includes(DEFAULT_LANG)) continue;

			paths.push({
				params: { lang, slug: defaultTour.slug },
				props: {
					type: "tour",
					isRedirect: true,
					redirectTo: `/${DEFAULT_LANG}/${defaultTour.slug}`,
					tour: defaultTour,
					slugMap: slugsByDocId[defaultTour.documentId] ?? {},
				},
			});
		}
	}

	return paths;
}
