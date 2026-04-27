import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lang } from "@/lib/i18n";
import { rewriteUrl as rewriteLocalizedUrl } from "@/lib/i18n";
import type { Global, MenuItem, Link } from "@/interface/global";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isPublishedEntry(item: unknown): boolean {
	if (!item || typeof item !== "object") return false;
	const candidate = item as { publishedAt?: unknown; published_at?: unknown };
	return Boolean(candidate.publishedAt ?? candidate.published_at);
}

export function dedupeLocalizedDocuments<T extends { documentId: string }>(
	items: T[],
): T[] {
	const byDocumentId = new Map<string, T>();

	for (const item of items) {
		const current = byDocumentId.get(item.documentId);

		if (!current) {
			byDocumentId.set(item.documentId, item);
			continue;
		}

		if (isPublishedEntry(item) && !isPublishedEntry(current)) {
			byDocumentId.set(item.documentId, item);
		}
	}

	return Array.from(byDocumentId.values());
}

export function rewriteUrl(url: string | undefined, currentLang: Lang): string {
	return rewriteLocalizedUrl(url, currentLang);
}

export function rewriteMenuUrls<T extends Global>(
	data: T,
	currentLang: Lang,
): T {
	const rw = (url: string | undefined) => rewriteUrl(url, currentLang);

	const rewriteLink = (link: Link): Link => ({
		...link,
		url: rw(link.url),
	});

	if (data?.menu?.menuItems) {
		data.menu.menuItems = data.menu.menuItems.map((item: MenuItem) => ({
			...item,
			link: rewriteLink(item.link),
			item: item.item?.map(rewriteLink) || [],
		}));
	}

	if (data?.headerTop?.headerLink) {
		data.headerTop.headerLink = data.headerTop.headerLink.map(rewriteLink);
	}

	if (data?.headerTop?.button) {
		data.headerTop.button = data.headerTop.button.map(rewriteLink);
	}

	if (data?.footer) {
		if (data.footer.destination?.link) {
			data.footer.destination.link =
				data.footer.destination.link.map(rewriteLink);
		}
		if (data.footer.dreamyAbout?.link) {
			data.footer.dreamyAbout.link =
				data.footer.dreamyAbout.link.map(rewriteLink);
		}
		if (data.footer.contact?.link) {
			data.footer.contact.link = data.footer.contact.link.map(rewriteLink);
		}
	}

	return data;
}
