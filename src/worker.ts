import routeMap from "virtual:localized-route-map";
import { handle } from "@astrojs/cloudflare/handler";
import historicalRedirects from "../public/_redirects?raw";
import {
	isLegacyWordPressQuery,
	legacyWordPressGone,
} from "./lib/legacyWordPressRoutes";
import {
	isLegacyEnglishPath,
	legacyEnglishGone,
	protectedEnglishRedirectSources,
} from "./lib/legacyEnglishRoutes";
import {
	parseContentRoute,
	resolveLocalizedRoute,
} from "./lib/localizedRouteResolver";

const protectedEnglishSources =
	protectedEnglishRedirectSources(historicalRedirects);

export default {
	async fetch(
		request: Parameters<typeof handle>[0],
		env: Parameters<typeof handle>[1],
		ctx: Parameters<typeof handle>[2],
	) {
		const url = new URL(request.url);
		if (
			(request.method === "GET" || request.method === "HEAD") &&
			isLegacyWordPressQuery(url)
		) {
			return legacyWordPressGone(request.method);
		}
		if (isLegacyEnglishPath(url.pathname)) {
			// Priority 1: let the original _redirects rules produce their response.
			// Do not treat automatic asset slash redirects as backlink exceptions.
			if (protectedEnglishSources.has(url.pathname)) {
				return env.ASSETS.fetch(request.url, {
					method: request.method,
					headers: Array.from(request.headers),
					redirect: "manual",
				});
			}
			// Priority 2: no assets, locale resolution or generic redirects for /en/.
			return legacyEnglishGone(request.method);
		}
		if (
			(request.method === "GET" || request.method === "HEAD") &&
			(parseContentRoute(url.pathname) ||
				["/", "/es", "/es/", "/pt", "/pt/"].includes(url.pathname))
		) {
			// Assets-first is also enforced here for preview/dev and as a defensive guard.
			const asset = await env.ASSETS.fetch(request.url, {
				method: request.method,
				headers: Array.from(request.headers),
				redirect: "manual",
			});
			if (asset.status !== 404) return asset;
			if (!parseContentRoute(url.pathname)) return handle(request, env, ctx);
			const result = resolveLocalizedRoute(url.pathname, routeMap);
			if (result && "ambiguous" in result) {
				console.warn(
					JSON.stringify({
						event: "localized-route-ambiguity",
						pathname: url.pathname,
					}),
				);
				return handle(request, env, ctx);
			}
			if (result) {
				url.pathname = result.pathname;
				return Response.redirect(url.toString(), result.status);
			}
		}
		return handle(request, env, ctx);
	},
};
