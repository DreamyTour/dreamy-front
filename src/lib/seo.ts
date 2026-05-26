import type { SEOProps } from "@/components/layout/SEO.astro";
import { getImageAlt, getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";
import type { SEO } from "@/types/common";

export const DEFAULT_SEO_IMAGE = "/dreamy-tours-web-og.jpg";

export interface ManualSEO {
  metaTitle: string;
  metaDescription: string;
  metaImage?: string | null;
  keywords?: string | null;
}

interface BuildSEOPropsOptions {
  seo?: SEO | ManualSEO | null;
  fallbackTitle: string;
  fallbackDescription?: string;
  fallbackImage?: string;
  fallbackImageAlt?: string;
  type?: SEOProps["type"];
  lang: Lang;
  canonicalUrl?: string;
  publishedTime?: string;
  author?: string;
  slugMap?: Record<string, string>;
}

export function buildSEOProps({
  seo,
  fallbackTitle,
  fallbackDescription = "",
  fallbackImage,
  fallbackImageAlt,
  type = "website",
  lang,
  canonicalUrl,
  publishedTime,
  author,
  slugMap,
}: BuildSEOPropsOptions): SEOProps {
  const seoImage =
    seo?.metaImage && typeof seo.metaImage === "string"
      ? seo.metaImage
      : seo?.metaImage
        ? getImageUrl(seo.metaImage)
        : fallbackImage;
  const seoImageAlt =
    seo?.metaImage && typeof seo.metaImage !== "string"
      ? getImageAlt(seo.metaImage, fallbackImageAlt || fallbackTitle)
      : fallbackImageAlt || fallbackTitle;

  return {
    title: seo?.metaTitle?.trim() || fallbackTitle,
    description: seo?.metaDescription?.trim() || fallbackDescription,
    image: seoImage,
    imageAlt: seoImage ? seoImageAlt : undefined,
    keywords: seo?.keywords?.trim() || undefined,
    type,
    lang,
    canonicalUrl,
    publishedTime,
    author,
    slugMap,
  };
}
