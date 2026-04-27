import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const seoSchema = z.object({
	metaTitle: z.string(),
	metaDescription: z.string(),
	metaImage: z.string().nullable().optional(),
	keywords: z.string().nullable().optional(),
});

const pages = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/pages" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		lang: z.enum(["es", "en", "pt"]),
		seo: seoSchema.optional(),
	}),
});

export const collections = { pages };
