import { defineMiddleware } from "astro:middleware";
import { collapseRepeatedBlogPath, DEFAULT_LANG } from "@/lib/i18n";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, search } = context.url;
	const defaultPrefix = `/${DEFAULT_LANG}`;
	const defaultPrefixPattern = new RegExp(`^${defaultPrefix}(?:/|$)`);
	const collapsedPath = collapseRepeatedBlogPath(pathname);

	if (collapsedPath !== pathname) {
		return context.redirect(`${collapsedPath}${search}`, 301);
	}

	if (defaultPrefixPattern.test(pathname)) {
		const targetPath = pathname.replace(defaultPrefixPattern, "") || "/";
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
