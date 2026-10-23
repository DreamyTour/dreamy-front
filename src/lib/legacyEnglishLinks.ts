// Render-time corrections for three verified links embedded in the CMS article
// "lima-explore". This table does not create any HTTP redirect or change CMS data.
const currentTargets: Record<string, string> = {
	"/en/lima/gastronomic-tour-in-lima": "/lima-culinary-tour/",
	"/en/lima/magic-water-tour-full-day": "/magic-water-circuit-tour-lima/",
	"/en/lima": "/lima/",
};

export function currentEnglishCmsHref(href: string): string {
	try {
		const url = new URL(href, "https://dreamy.tours");
		if (url.origin !== "https://dreamy.tours") return href;
		const target = currentTargets[url.pathname.replace(/\/+$/, "")];
		if (!target) return href;
		url.pathname = target;
		return href.startsWith("/") && !href.startsWith("//")
			? `${url.pathname}${url.search}${url.hash}`
			: url.href;
	} catch {
		return href;
	}
}
