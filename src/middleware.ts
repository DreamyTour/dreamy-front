import { defineMiddleware } from "astro:middleware";
import {
	collapseRepeatedBlogPath,
	stripDefaultLangPrefix,
} from "@/lib/i18n";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, search } = context.url;
	const collapsedPath = collapseRepeatedBlogPath(pathname);

	if (collapsedPath !== pathname) {
		return context.redirect(`${collapsedPath}${search}`, 301);
	}

	const targetPath = stripDefaultLangPrefix(pathname);
	if (targetPath !== pathname) {
		return context.redirect(`${targetPath}${search}`, 301);
	}

	const response = await next();
	const headers = response.headers;

	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("X-Frame-Options", "SAMEORIGIN");
	headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=()",
	);

	return response;
});
