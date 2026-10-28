import exclusions from "../data/sitemapExclusions.json";

const excludedPaths = new Set([
	...exclusions.checkout,
	...exclusions.blogPagination,
]);

export function isExcludedFromSitemap(pathname: string) {
	const normalized = `${pathname.replace(/\/+$/, "")}/`;
	if (excludedPaths.has(normalized)) return true;
	// Blog index pagination grows with published CMS content. Keep category
	// pagination indexable and keep all these pages generated and navigable.
	const page = normalized.match(/^\/(?:(?:es|pt)\/)?blog\/([1-9]\d*)\/$/);
	return page !== null && Number(page[1]) >= 2;
}
