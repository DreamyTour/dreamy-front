"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import {
	LANGS,
	type Lang,
	localizePath,
	stripLangPrefix,
	translatePathForSlug,
} from "@/lib/i18n";

const languageNames: Record<Lang, string> = {
	en: "English",
	es: "Español",
	pt: "Português",
};

const languageFlags: Record<Lang, string> = {
	en: "/imagenes/flag/um.svg",
	es: "/imagenes/flag/es.svg",
	pt: "/imagenes/flag/br.svg",
};

function FlagIcon({ lang }: { lang: Lang }) {
	return (
		<span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.12)]">
			<img
				src={languageFlags[lang]}
				alt=""
				aria-hidden="true"
				className="h-full w-full object-cover"
				loading="eager"
			/>
		</span>
	);
}

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
					const blogPath = translatePathForSlug(normalizedPath, targetSlug);
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
				className="inline-flex h-9 min-w-[124px] items-center justify-between gap-2 rounded-md border border-border bg-white px-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
			>
				<span className="inline-flex items-center gap-2">
					<FlagIcon lang={currentLang} />
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
					className="absolute right-0 z-50 mt-2 min-w-[170px] overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg"
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
								className={`flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none ${
									selected
										? "bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/15 hover:bg-primary/12 focus-visible:bg-primary/12"
										: "text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100"
								}`}
							>
								<span className="inline-flex items-center gap-2.5">
									<FlagIcon lang={lang} />
									<span>{languageNames[lang]}</span>
								</span>
								{selected && (
									<Check className="size-4 text-primary" aria-hidden="true" />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
