import { localizePath, type Lang } from "@/lib/i18n";

import { purposeSlugs, type PurposePage } from "@/data/purposeSlugs";
export { purposeSlugs, type PurposePage } from "@/data/purposeSlugs";
export function purposeHref(page: PurposePage, lang: Lang) {
	return localizePath(`/${purposeSlugs[page][lang]}`, lang);
}
export function purposeLanguage(pathname: string): Lang {
	return pathname.startsWith("/es/")
		? "es"
		: pathname.startsWith("/pt/")
			? "pt"
			: "en";
}
