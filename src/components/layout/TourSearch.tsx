import { Clock3, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { rewriteUrl } from "@/lib/utils";
import type { TourSearchItem } from "@/lib/tourSearch";

interface TourSearchProps {
	lang: Lang;
}

const copyByLang: Record<
	Lang,
	{
		label: string;
		placeholder: string;
		searching: string;
		noResults: string;
		results: (count: number) => string;
	}
> = {
	en: {
		label: "Search tours",
		placeholder: "Search tours...",
		searching: "Searching...",
		noResults: "No tours found",
		results: (count) =>
			`${count} ${count === 1 ? "tour found" : "tours found"}`,
	},
	es: {
		label: "Buscar tours",
		placeholder: "Buscar tours...",
		searching: "Buscando...",
		noResults: "No encontramos tours",
		results: (count) =>
			`${count} ${count === 1 ? "tour encontrado" : "tours encontrados"}`,
	},
	pt: {
		label: "Buscar passeios",
		placeholder: "Buscar passeios...",
		searching: "Buscando...",
		noResults: "Nenhum passeio encontrado",
		results: (count) =>
			`${count} ${count === 1 ? "passeio encontrado" : "passeios encontrados"}`,
	},
};

function normalizeSearchValue(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase()
		.trim();
}

export default function TourSearch({ lang }: TourSearchProps) {
	const copy = copyByLang[lang] ?? copyByLang.en;
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const hasRequestedTours = useRef(false);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [tours, setTours] = useState<TourSearchItem[] | null>(null);

	const loadTours = useCallback(() => {
		if (hasRequestedTours.current) return;

		hasRequestedTours.current = true;
		fetch(rewriteUrl("/tour-search.json", lang))
			.then((response) => {
				if (!response.ok) throw new Error(`Tour search: ${response.status}`);
				return response.json() as Promise<TourSearchItem[]>;
			})
			.then((items) => setTours(Array.isArray(items) ? items : []))
			.catch(() => setTours([]));
	}, [lang]);

	useEffect(() => {
		if (!query.trim()) {
			setDebouncedQuery("");
			return;
		}

		const timer = window.setTimeout(() => {
			setDebouncedQuery(query);
		}, 400);

		return () => window.clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		if (!isOpen) return;

		const closeOnOutsideClick = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};

		document.addEventListener("pointerdown", closeOnOutsideClick);
		document.addEventListener("keydown", closeOnEscape);

		return () => {
			document.removeEventListener("pointerdown", closeOnOutsideClick);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [isOpen]);

	const normalizedQuery = normalizeSearchValue(query);
	const normalizedDebouncedQuery = normalizeSearchValue(debouncedQuery);
	const isWaiting =
		normalizedQuery.length > 0 && normalizedQuery !== normalizedDebouncedQuery;
	const results = useMemo(() => {
		if (!normalizedDebouncedQuery || !tours) return [];

		return tours.filter((tour) =>
			normalizeSearchValue(tour.title).includes(normalizedDebouncedQuery),
		);
	}, [normalizedDebouncedQuery, tours]);
	const showPanel = isOpen && normalizedQuery.length > 0;
	const isLoadingTours = tours === null;
	const resultsLabel =
		!isWaiting && !isLoadingTours && normalizedDebouncedQuery
			? copy.results(results.length)
			: "";

	return (
		<div ref={wrapperRef} className="relative z-50 shrink-0">
			<search className="relative block">
				<label htmlFor="header-tour-search" className="sr-only">
					{copy.label}
				</label>
				<Search
					aria-hidden="true"
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/60"
					strokeWidth={2}
				/>
				<input
					id="header-tour-search"
					type="search"
					value={query}
					onChange={(event) => {
						loadTours();
						setQuery(event.target.value);
						setIsOpen(Boolean(event.target.value.trim()));
					}}
					onFocus={() => {
						loadTours();
						setIsOpen(Boolean(query.trim()));
					}}
					placeholder={copy.placeholder}
					autoComplete="off"
					aria-controls="header-tour-search-results"
					className="h-9 w-[clamp(13rem,17vw,16rem)] rounded-full border border-border bg-white py-2 pl-9 pr-3 text-xs font-medium text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-foreground/45 hover:border-primary/30 focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
				/>
			</search>

			<p className="sr-only" aria-live="polite" aria-atomic="true">
				{resultsLabel}
			</p>

			{showPanel ? (
				<div
					id="header-tour-search-results"
					className="absolute right-0 top-[calc(100%+0.6rem)] w-[27rem] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_28px_70px_-32px_rgba(8,23,17,0.55)]"
				>
					{isWaiting || isLoadingTours ? (
						<p className="px-5 py-6 text-center text-sm font-medium text-foreground/55">
							{copy.searching}
						</p>
					) : results.length > 0 ? (
						<>
							<p className="border-b border-slate-100 px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-foreground/45">
								{resultsLabel}
							</p>
							<ul className="max-h-[min(31rem,65vh)] list-none overflow-y-auto p-1.5">
								{results.map((tour) => (
									<li key={tour.documentId}>
										<a
											href={rewriteUrl(`/${tour.slug}`, lang)}
											className="group flex min-h-[5.25rem] items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-primary/[0.055] focus-visible:bg-primary/[0.055] focus-visible:outline-2 focus-visible:outline-primary/45"
										>
											<span className="h-[4.25rem] w-[5.75rem] shrink-0 overflow-hidden rounded-md bg-slate-100">
												{tour.imageUrl &&
												tour.imageUrl !== "/og-default.jpg" ? (
													<img
														src={tour.imageUrl}
														alt={tour.imageAlt}
														width={92}
														height={68}
														loading="lazy"
														decoding="async"
														className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.035] motion-reduce:transition-none"
													/>
												) : null}
											</span>
											<span className="min-w-0 flex-1">
												<span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary">
													{tour.title}
												</span>
												{tour.duration ? (
													<span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-[0.68rem] font-semibold leading-none text-secondary">
														<Clock3
															aria-hidden="true"
															className="size-3"
															strokeWidth={2.2}
														/>
														{tour.duration}
													</span>
												) : null}
											</span>
										</a>
									</li>
								))}
							</ul>
						</>
					) : (
						<p className="px-5 py-6 text-center text-sm font-medium text-foreground/55">
							{copy.noResults}
						</p>
					)}
				</div>
			) : null}
		</div>
	);
}
