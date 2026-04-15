import { defineMiddleware } from "astro:middleware";
import { DEFAULT_LANG } from "@/lib/i18n";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;
  const defaultPrefix = `/${DEFAULT_LANG}`;
  const defaultPrefixPattern = new RegExp(`^${defaultPrefix}(?:/|$)`);

  if (defaultPrefixPattern.test(pathname)) {
    const targetPath = pathname.replace(defaultPrefixPattern, "") || "/";
    return context.redirect(`${targetPath}${search}`, 301);
  }

  return next();
});
