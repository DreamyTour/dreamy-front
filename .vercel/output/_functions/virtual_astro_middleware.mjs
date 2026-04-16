import { a6 as defineMiddleware, af as sequence } from './chunks/sequence_1RXck6KE.mjs';
import 'piccolore';
import 'clsx';

const DEFAULT_LANG = "en";

const onRequest$1 = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;
  const defaultPrefix = `/${DEFAULT_LANG}`;
  const defaultPrefixPattern = new RegExp(`^${defaultPrefix}(?:/|$)`);
  if (defaultPrefixPattern.test(pathname)) {
    const targetPath = pathname.replace(defaultPrefixPattern, "") || "/";
    return context.redirect(`${targetPath}${search}`, 301);
  }
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
