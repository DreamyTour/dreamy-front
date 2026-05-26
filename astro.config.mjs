// @ts-check

import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
// SSG + SSR for API routes
export default defineConfig({
	site: "https://dreamy.tours",

	adapter: process.env.NODE_ENV === "production" ? cloudflare() : undefined,

	fonts: [
		{
			name: "Outfit",
			cssVariable: "--font-outfit",
			provider: fontProviders.fontsource(),
		},
	],

	server: {
		allowedHosts: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [
		react(),
		mdx(),
		sitemap({
			changefreq: "weekly",
			priority: 0.7,
			lastmod: new Date(),
			filter: (page) => !page.includes("/404"),
		}),
	],
});
