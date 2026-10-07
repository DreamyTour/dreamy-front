import routeMap from "virtual:localized-route-map";
import { handle } from "@astrojs/cloudflare/handler";
import {
	parseContentRoute,
	resolveLocalizedRoute,
} from "./lib/localizedRouteResolver";

export default {
	async fetch(
		request: Parameters<typeof handle>[0],
		env: Parameters<typeof handle>[1],
		ctx: Parameters<typeof handle>[2],
	) {
		const url = new URL(request.url);
		if (
			(request.method === "GET" || request.method === "HEAD") &&
			parseContentRoute(url.pathname)
		) {
			// Assets-first is also enforced here for preview/dev and as a defensive guard.
			const asset = await env.ASSETS.fetch(request.url, {
				method: request.method,
				headers: Array.from(request.headers),
				redirect: "manual",
			});
			if (asset.status !== 404) return asset;
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
