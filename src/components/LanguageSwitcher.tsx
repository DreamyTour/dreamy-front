"use client";

import * as React from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { LANGS, type Lang, localizePath, stripLangPrefix } from "@/lib/i18n";

const languageNames: Record<Lang, string> = {
	en: "English",
	es: "Español",
	pt: "Português",
};

export function LanguageSwitcher({ currentLang }: { currentLang: Lang }) {
	const [open, setOpen] = React.useState(false);
	const wrapperRef = React.useRef<HTMLDivElement | null>(null);
	const buttonRef = React.useRef<HTMLButtonElement | null>(null);

	React.useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
				buttonRef.current?.focus();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	const resolveLocalizedPath = (nextLang: Lang) => {
		const pathname = window.location.pathname;
		const normalizedPath = stripLangPrefix(pathname);

		const slugMapIds = ["tour-slug-map", "page-slug-map"];
		for (const id of slugMapIds) {
			const slugMapEl = document.getElementById(id);
			if (!slugMapEl) continue;

			try {
				const slugMap: Record<string, string> = JSON.parse(
					slugMapEl.textContent ?? "{}",
				);
				const targetSlug = slugMap[nextLang];
				if (targetSlug) return localizePath(`/${targetSlug}`, nextLang);
			} catch {}
		}

		const blogSlugMapEl = document.getElementById("blog-slug-map");
		if (blogSlugMapEl) {
			try {
				const slugMap: Record<string, string> = JSON.parse(
					blogSlugMapEl.textContent ?? "{}",
				);
				const targetSlug = slugMap[nextLang];
				if (targetSlug) {
					const blogPath = normalizedPath.replace(
						/\/blog\/[^/]+$/,
						`/blog/${targetSlug}`,
					);
					return localizePath(blogPath, nextLang);
				}
			} catch {}
		}

		return localizePath(normalizedPath, nextLang);
	};

	const handleSelect = (nextLang: Lang) => {
		if (nextLang === currentLang) {
			setOpen(false);
			return;
		}

		window.location.href = resolveLocalizedPath(nextLang);
	};

	return (
		<div ref={wrapperRef} className="relative">
			<button
				ref={buttonRef}
				type="button"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="Cambiar idioma"
				onClick={() => setOpen((value) => !value)}
				className="inline-flex h-9 min-w-[116px] items-center justify-between gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
			>
				<span className="inline-flex items-center gap-2">
					<Languages className="size-4 text-slate-600" aria-hidden="true" />
					<span>{languageNames[currentLang]}</span>
				</span>
				<ChevronDown
					className={`size-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
					aria-hidden="true"
				/>
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 z-50 mt-2 min-w-[150px] overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg"
				>
					{LANGS.map((lang) => {
						const selected = lang === currentLang;

						return (
							<button
								key={lang}
								type="button"
								role="menuitemradio"
								aria-checked={selected}
								onClick={() => handleSelect(lang)}
								className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
							>
								<span>{languageNames[lang]}</span>
								{selected && (
									<Check className="size-4 text-[#07592f]" aria-hidden="true" />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
