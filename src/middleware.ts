import { defineMiddleware } from "astro:middleware";
import { hasCmsEditorSession, isCmsProtectedPath } from "@/lib/cms-editor-auth";
import { collapseRepeatedBlogPath } from "@/lib/i18n";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, search } = context.url;
	if (
		isCmsProtectedPath(pathname) &&
		!(await hasCmsEditorSession(context.session))
	) {
		return new Response("Abre el editor desde una sesión iniciada en el CMS.", {
			status: 401,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Robots-Tag": "noindex, nofollow",
			},
		});
	}
	const collapsedPath = collapseRepeatedBlogPath(pathname);

	if (collapsedPath !== pathname) {
		return context.redirect(`${collapsedPath}${search}`, 301);
	}

	// The Worker handles /en/ before Astro, preserving historical backlinks first.

	const response = await next();
	const headers = response.headers;
	if (isCmsProtectedPath(pathname)) {
		headers.set("Cache-Control", "no-store");
		headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	// The editor has an explicit CSP frame-ancestors allowlist for Strapi.
	if (!pathname.startsWith("/cms/"))
		headers.set("X-Frame-Options", "SAMEORIGIN");
	headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=()",
	);

	return response;
});
