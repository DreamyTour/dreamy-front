import type { Lang } from "@/lib/i18n";
import fetchApi from "@/lib/strapi";
import { dedupeLocalizedDocuments } from "@/lib/utils";
import type { Tour } from "@/types/tours";

interface CategoryQuery {
  categorySlug?: string;
  lang: Lang;
  limit?: number;
  dedupe?: boolean;
}

export async function fetchToursByCategory({
  categorySlug,
  lang,
  limit = 3,
  dedupe = true,
}: CategoryQuery) {
  if (!categorySlug) return [];

  const tours = await fetchApi<Tour[]>({
    endpoint: "tours",
    wrappedByKey: "data",
    locale: lang,
    query: {
      "filters[categories][slug][$eq]": categorySlug,
      "pagination[limit]": limit,
      populate: "*",
    },
  });

  if (!Array.isArray(tours)) return [];

  return dedupe ? dedupeLocalizedDocuments(tours) : tours;
}
