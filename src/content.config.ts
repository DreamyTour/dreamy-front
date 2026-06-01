import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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
		lang: z.enum(["es", "en", "pt"]),/*  */
		heroImage: z.string().optional(),
		heroImageAlt: z.string().optional(),
		slugs: z.record(z.string(), z.string()).optional(),
		seo: seoSchema.optional(),
	}),
});

export const collections = { pages };
