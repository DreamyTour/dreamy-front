import { describe, expect, test } from "bun:test";
import type { Imagen } from "@/types/common";
import { getHeroImage } from "./heroImage";

const media: Imagen = {
	id: 1,
	name: "hero.webp",
	alternativeText: "Mountain",
	url: "https://cdn.dreamy.tours/4/hero.webp",
	width: 2000,
	height: 900,
	formats: {
		thumbnail: { url: "https://cdn.dreamy.tours/thumb.webp", width: 245 },
		small: { url: "https://cdn.dreamy.tours/small.webp", width: 500 },
		large: { url: "https://cdn.dreamy.tours/large.webp", width: 1000 },
	},
};

describe("hero image candidates", () => {
	test("retains the original for desktop preloads, with actual dimensions", () => {
		const hero = getHeroImage(media);
		expect(hero.srcset).toBe(
			"https://cdn.dreamy.tours/small.webp 500w, https://cdn.dreamy.tours/large.webp 1000w, https://cdn.dreamy.tours/4/hero.webp 2000w",
		);
		expect([hero.width, hero.height]).toEqual([2000, 900]);
	});

	test("selects the last usable tour image even when the last entry has no URL", () => {
		expect(getHeroImage([media, { ...media, url: "" }]).src).toBe(media.url);
	});

	test("accepts real custom breakpoints, rejects invalid widths, and deduplicates originals", () => {
		const hero = getHeroImage({
			...media,
			formats: {
				tablet: { url: "https://cdn.dreamy.tours/tablet.webp", width: 768 },
				desktop: { url: "https://cdn.dreamy.tours/desktop.webp", width: 1280 },
				full: { url: media.url, width: 2000 },
				invalid: { url: "https://cdn.dreamy.tours/invalid.webp", width: -1 },
			},
		});
		expect(hero.srcset?.split(", ")).toHaveLength(3);
		expect(hero.srcset).toContain("tablet.webp 768w");
		expect(hero.srcset).toContain("desktop.webp 1280w");
		expect(hero.srcset).not.toContain("invalid");
	});

	test("does not invent variants when Strapi has only an original", () => {
		expect(getHeroImage({ ...media, formats: undefined }).srcset).toBe(
			`${media.url} 2000w`,
		);
		expect(
			getHeroImage({ ...media, formats: undefined, width: undefined }).srcset,
		).toBeUndefined();
	});

	test("uses an existing local fallback and preserves alternative text", async () => {
		const hero = getHeroImage(undefined, "Tour");
		expect(await Bun.file(`public${hero.src}`).exists()).toBe(true);
		expect(hero.srcset).toBeUndefined();
		expect(hero.alt).toBe("Tour");
		expect(getHeroImage(media, "Tour").alt).toBe("Mountain");
	});
});
