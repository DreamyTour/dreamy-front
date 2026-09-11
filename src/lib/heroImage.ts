import type { Imagen } from "@/types/common";
import { getImageAlt, getImageSrcSet, getImageUrl } from "./helpers";

/** One descriptor for both the head preload and the rendered hero. */
export function getHeroImage(
	media: Imagen | Imagen[] | null | undefined,
	fallbackAlt = "",
) {
	// Tours display the last usable featured image; preserve that selection.
	const images = Array.isArray(media) ? media : [media];
	const image = images.filter((item) => item?.url).at(-1);
	const formats = Object.entries(image?.formats || {})
		.filter(
			([key, value]) =>
				key !== "thumbnail" &&
				Number.isInteger(value.width) &&
				(value.width ?? 0) > 0,
		)
		.map(([key]) => key);

	return {
		src: image ? getImageUrl(image) : "/dreamy-tours-web-og.jpg",
		srcset:
			getImageSrcSet(image, formats, { includeOriginal: true }) || undefined,
		sizes: "100vw",
		width: image ? image.width : 1260,
		height: image ? image.height : 600,
		alt: getImageAlt(image, fallbackAlt),
	};
}

export type HeroImageData = ReturnType<typeof getHeroImage>;
