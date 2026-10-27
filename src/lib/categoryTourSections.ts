import type { Lang } from "./i18n";
import type { CategoryTourRelation, TourSelector, UsefulInfo } from "../types/page";

function hasBlockText(value: unknown): boolean {
	if (!value || typeof value !== "object") return false;
	if (Array.isArray(value)) return value.some(hasBlockText);
	const node = value as { text?: unknown; children?: unknown };
	return (typeof node.text === "string" && !!node.text.trim()) || hasBlockText(node.children);
}

/** Strapi may save an added component before any of its fields are filled. */
export function getUsefulInfoItems(info?: UsefulInfo | null) {
	return (info?.items || []).filter((item) =>
		!!item && (!!item.titulo?.trim() || hasBlockText(item.contenido)),
	);
}

/** Preserve CMS order, including original positions when invalid relations are omitted. */
export function getValidTourRecommendations(
	selector: TourSelector | null | undefined,
	pageLocale: string | undefined,
	lang: Lang,
	warn: ((message: string) => void) | undefined = import.meta.env?.DEV
		? console.warn
		: undefined,
) {
	return (selector?.recomendaciones || []).flatMap((item, sourceIndex) => {
		const tour = item.tour;
		const reason = !tour?.slug?.trim()
			? "missing tour or slug"
			: !pageLocale || tour.locale !== pageLocale || pageLocale !== lang
				? `locale mismatch (page=${pageLocale}, tour=${tour.locale}, route=${lang})`
				: undefined;
		if (reason) {
			warn?.(`[TourCategoryChooser] Recommendation ${sourceIndex + 1} omitted: ${reason}`);
			return [];
		}
		return [{ ...item, tour: tour as CategoryTourRelation, sourceIndex }];
	});
}
