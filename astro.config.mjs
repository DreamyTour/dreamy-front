// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import { isExcludedFromSitemap } from "./src/lib/sitemapPolicy";
import localizedRouteMap from "./src/integrations/localizedRouteMap";

const devEnv = loadEnv("development", process.cwd(), "");
const cmsOrigin = new URL(
	process.env.VITE_STRAPI_URL ||
		devEnv.VITE_STRAPI_URL ||
		process.env.STRAPI_URL ||
		devEnv.STRAPI_URL ||
		"http://localhost:1337",
).origin;

// https://astro.build/config
// SSG + SSR for API routes
export default defineConfig({
	site: "https://dreamy.tours",

	adapter: cloudflare(),
	session: {
		cookie: { name: "dreamy-cms-session", sameSite: "lax", path: "/" },
		ttl: 300,
	},

	fonts: [
		{
			name: "Bricolage Grotesque",
			cssVariable: "--font-heading",
			provider: fontProviders.fontsource(),
		},
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
		server: {
			cors: { origin: cmsOrigin, credentials: true },
			proxy: {
				"/api/calendar-tickets": {
					target: "https://calendar.dreamy.tours",
					changeOrigin: true,
					rewrite: (path) =>
						path.replace(/^\/api\/calendar-tickets/, "/v1/tickets"),
				},
			},
		},
	},

	integrations: [
		localizedRouteMap(),
		react(),
		sitemap({
			changefreq: "weekly",
			priority: 0.7,
			lastmod: new Date(),
			filter: (page) => {
				const { pathname } = new URL(page);
				return (
					!isExcludedFromSitemap(pathname) &&
					!page.includes("/404") &&
					pathname !== "/dev" &&
					!pathname.startsWith("/dev/") &&
					pathname !== "/cms" &&
					!pathname.startsWith("/cms/") &&
					pathname !== "/en" &&
					!pathname.startsWith("/en/")
				);
			},
		}),
	],
});
