import { describe, expect, test } from "bun:test";
import { getImageSrcSet } from "@/lib/helpers";
import type { Imagen } from "@/types/common";

const image = {
	id: 1,
	name: "hero.jpg",
	alternativeText: "Blog hero",
	url: "https://cdn.example.com/hero.jpg",
	width: 2400,
	height: 1350,
	formats: {
		small: {
			url: "https://cdn.example.com/small_hero.jpg",
			width: 500,
			height: 281,
		},
		large: {
			url: "https://cdn.example.com/large_hero.jpg",
			width: 1000,
			height: 563,
		},
	},
} satisfies Imagen;

describe("getImageSrcSet", () => {
	test("includes the original image as the highest-resolution candidate when requested", () => {
		expect(
			getImageSrcSet(image, ["small", "large"], {
				includeOriginal: true,
			}),
		).toBe(
			"https://cdn.example.com/small_hero.jpg 500w, https://cdn.example.com/large_hero.jpg 1000w, https://cdn.example.com/hero.jpg 2400w",
		);
	});

	test("keeps the original image out of ordinary responsive sets by default", () => {
		expect(getImageSrcSet(image, ["small", "large"])).toBe(
			"https://cdn.example.com/small_hero.jpg 500w, https://cdn.example.com/large_hero.jpg 1000w",
		);
	});
});
