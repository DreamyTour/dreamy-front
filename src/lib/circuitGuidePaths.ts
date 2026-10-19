// Only these known editorial paths are allowed as nested language slugs.
// Kept independent of page data to avoid cycles in the shared i18n helpers.
export function isCircuitGuideSlug(slug: string) {
	return /^(?:circuitos-machupicchu\/(?:ruta|rota)|machupicchu-circuits\/route)-(?:1-[abcd]|2-[ab]|3-[abcd])$/.test(
		slug,
	);
}
