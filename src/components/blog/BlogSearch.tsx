import { createPortal } from "react-dom";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import type { BlogSearchItem } from "@/lib/blogSearch";
import type { Lang } from "@/lib/i18n";

interface Props {
	items: BlogSearchItem[];
	lang: Lang;
	targetId: string;
	defaultContentId: string;
	resultGridClassName?: string;
}

type FormSubmitEvent = Parameters<
	NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

const copy = {
	es: {
		label: "Buscar en el blog",
		placeholder: "Destino, guía o consejo",
		button: "Buscar",
		required: "Escribe algo para buscar.",
		results: "Resultados de búsqueda",
		resultFor: "Resultados para",
		result: "resultado",
		resultsPlural: "resultados",
		noResults: "No encontramos artículos con esa búsqueda.",
		clear: "Limpiar búsqueda",
		readMore: "Leer artículo",
		readingTime: "min de lectura",
	},
	en: {
		label: "Search the blog",
		placeholder: "Destination, guide or tip",
		button: "Search",
		required: "Write something to search for.",
		results: "Search results",
		resultFor: "Results for",
		result: "result",
		resultsPlural: "results",
		noResults: "We could not find articles for that search.",
		clear: "Clear search",
		readMore: "Read article",
		readingTime: "min read",
	},
	pt: {
		label: "Pesquisar no blog",
		placeholder: "Destino, guia ou dica",
		button: "Pesquisar",
		required: "Escreva algo para pesquisar.",
		results: "Resultados da pesquisa",
		resultFor: "Resultados para",
		result: "resultado",
		resultsPlural: "resultados",
		noResults: "Não encontramos artigos para essa pesquisa.",
		clear: "Limpar pesquisa",
		readMore: "Ler artigo",
		readingTime: "min de leitura",
	},
} satisfies Record<Lang, Record<string, string>>;

function normalizeSearchText(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase();
}

function formatDate(value: string | undefined, lang: Lang) {
	if (!value) return null;

	return new Date(value).toLocaleDateString(
		lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US",
		{ day: "numeric", month: "short", year: "numeric" },
	);
}

function BlogSearchCard({ item, lang }: { item: BlogSearchItem; lang: Lang }) {
	const t = copy[lang];
	const category = item.categories[0];
	const publishedDate = formatDate(item.publishedAt, lang);

	return (
		<article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[color-mix(in_oklab,var(--primary)_10%,var(--border))] bg-card text-foreground shadow-[0_2px_5px_color-mix(in_oklab,var(--foreground)_4%,transparent),0_16px_36px_-28px_color-mix(in_oklab,var(--foreground)_30%,transparent)] transition-[transform_.3s_cubic-bezier(.2,_0,_0,_1),box-shadow_.3s,border-color_.3s] hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_4px_10px_color-mix(in_oklab,var(--primary)_5%,transparent),0_24px_54px_-30px_color-mix(in_oklab,var(--primary)_32%,transparent)] motion-reduce:transform-none motion-reduce:transition-none">
			<a
				href={item.href}
				aria-label={`${t.readMore}: ${item.title}`}
				className="relative block aspect-[16/10] shrink-0 overflow-hidden bg-muted focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/40"
			>
				{item.imageUrl ? (
					<img
						src={item.imageUrl}
						alt={item.imageAlt}
						width={640}
						height={400}
						className="h-full w-full object-cover transition-transform duration-[1300ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.025] motion-reduce:transform-none"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<div className="grid h-full place-items-center bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_13%,white),color-mix(in_oklab,var(--secondary)_12%,white))]">
						<span className="text-xs font-semibold lowercase tracking-[0.05em] text-primary/70">
							dreamy tours
						</span>
					</div>
				)}
			</a>

			<div className="flex flex-1 flex-col p-5 sm:p-6">
				<div className="flex min-w-0 items-center justify-between gap-4">
					{category ? (
						<span className="max-w-[52%] truncate rounded-md bg-primary px-2.5 py-1 text-[0.7rem] font-semibold lowercase tracking-[0.02em] text-primary-foreground">
							{category}
						</span>
					) : (
						<span className="text-[0.72rem] font-medium lowercase text-primary/70">
							journal
						</span>
					)}

					<span className="inline-flex shrink-0 items-center gap-1.5 text-[0.7rem] font-medium lowercase text-muted-foreground">
						<svg
							className="size-3.5 text-secondary"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="9" />
							<path d="M12 7v5l3 2" />
						</svg>
						{item.readingMinutes} {t.readingTime}
					</span>
				</div>

				<h3 className="mt-4 line-clamp-3 text-[1.2rem] font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.35rem]">
					<a
						href={item.href}
						className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
					>
						{item.title}
					</a>
				</h3>

				{item.excerpt && (
					<p className="mt-3 line-clamp-3 text-sm leading-5 text-muted-foreground">
						{item.excerpt}
					</p>
				)}

				<div className="mt-auto flex items-center justify-between gap-3 border-t border-[color-mix(in_oklab,var(--primary)_9%,var(--border))] pt-4">
					{publishedDate ? (
						<time
							dateTime={item.publishedAt}
							className="text-[0.7rem] font-medium lowercase text-muted-foreground"
						>
							{publishedDate}
						</time>
					) : (
						<span />
					)}
					<a
						href={item.href}
						className="inline-flex shrink-0 items-center gap-2 rounded-sm text-[0.82rem] font-semibold lowercase text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
					>
						<span className="decoration-primary decoration-1 underline-offset-4 group-hover:underline">
							{t.readMore}
						</span>
						<svg
							className="size-4 transition-transform duration-300 ease-[cubic-bezier(.2,0,0,1)] group-hover:translate-x-0.5 motion-reduce:transform-none"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M5 12h14" />
							<path d="m13 6 6 6-6 6" />
						</svg>
					</a>
				</div>
			</div>
		</article>
	);
}

export default function BlogSearch({
	items,
	lang,
	targetId,
	defaultContentId,
	resultGridClassName = "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3",
}: Props) {
	const t = copy[lang];
	const inputId = `${targetId}-input`;
	const errorId = `${targetId}-error`;
	const inputRef = useRef<HTMLInputElement>(null);
	const [target, setTarget] = useState<HTMLElement | null>(null);
	const [query, setQuery] = useState("");
	const [error, setError] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	const [results, setResults] = useState<BlogSearchItem[]>([]);

	useEffect(() => {
		setTarget(document.getElementById(targetId));
	}, [targetId]);

	useEffect(() => {
		const defaultContent = document.getElementById(defaultContentId);
		if (!defaultContent) return;

		defaultContent.hidden = hasSearched;

		return () => {
			defaultContent.hidden = false;
		};
	}, [defaultContentId, hasSearched]);

	function clearFieldError() {
		inputRef.current?.setCustomValidity("");
		setError("");
	}

	function handleInvalid() {
		inputRef.current?.setCustomValidity(t.required);
		setError(t.required);
	}

	function handleSubmit(event: FormSubmitEvent) {
		event.preventDefault();
		const cleanQuery = query.trim();

		if (!cleanQuery) {
			inputRef.current?.setCustomValidity(t.required);
			setError(t.required);
			inputRef.current?.focus();
			return;
		}

		clearFieldError();
		const searchTerms = normalizeSearchText(cleanQuery)
			.split(/\s+/)
			.filter(Boolean);
		const matches = items.filter((item) => {
			const searchable = normalizeSearchText(
				[item.title, item.excerpt, item.searchText, ...item.categories].join(
					" ",
				),
			);

			return searchTerms.every((term) => searchable.includes(term));
		});

		setResults(matches);
		setHasSearched(true);
	}

	function clearSearch() {
		setQuery("");
		setResults([]);
		setHasSearched(false);
		clearFieldError();
		inputRef.current?.focus();
	}

	const resultPanel = hasSearched ? (
		<section aria-labelledby={`${targetId}-title`} className="pb-2">
			<div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
						{t.results}
					</p>
					<h2
						id={`${targetId}-title`}
						className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl"
					>
						{t.resultFor} “{query.trim()}”
					</h2>
					<p className="mt-2 text-sm text-muted-foreground" role="status">
						{results.length} {results.length === 1 ? t.result : t.resultsPlural}
					</p>
				</div>
				<button
					type="button"
					onClick={clearSearch}
					className="inline-flex min-h-11 items-center justify-center rounded-sm border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
				>
					{t.clear}
				</button>
			</div>

			{results.length > 0 ? (
				<div className={resultGridClassName} aria-live="polite">
					{results.map((item) => (
						<BlogSearchCard key={item.id} item={item} lang={lang} />
					))}
				</div>
			) : (
				<p className="rounded-xl border border-border bg-card px-6 py-12 text-center text-muted-foreground">
					{t.noResults}
				</p>
			)}
		</section>
	) : null;

	return (
		<>
			<section
				className="rounded-xl border border-border bg-card p-4 shadow-[0_18px_55px_var(--blog-card-shadow)]"
				aria-labelledby={`${targetId}-label`}
			>
				<h2
					id={`${targetId}-label`}
					className="mb-3 text-xs font-semibold lowercase tracking-[0.06em] text-primary"
				>
					{t.label}
				</h2>

				<form onSubmit={handleSubmit} noValidate aria-controls={targetId}>
					<label htmlFor={inputId} className="sr-only">
						{t.label}
					</label>
					<div className="flex gap-2">
						<input
							ref={inputRef}
							id={inputId}
							name="blog-search"
							type="search"
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								clearFieldError();
							}}
							onInvalid={handleInvalid}
							required
							placeholder={t.placeholder}
							enterKeyHint="search"
							aria-invalid={error ? true : undefined}
							aria-describedby={error ? errorId : undefined}
							className="min-w-0 flex-1 rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
						/>
						<button
							type="submit"
							className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
						>
							<svg
								className="size-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="7" />
								<path d="m20 20-4-4" />
							</svg>
							<span className="sr-only sm:not-sr-only sm:ml-2">{t.button}</span>
						</button>
					</div>
					<p
						id={errorId}
						role={error ? "alert" : undefined}
						className="mt-2 min-h-5 text-sm text-destructive"
					>
						{error}
					</p>
				</form>
			</section>

			{target ? createPortal(resultPanel, target) : null}
		</>
	);
}
