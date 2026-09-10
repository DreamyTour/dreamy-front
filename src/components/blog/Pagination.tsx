import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { getPaginationHref, getPaginationItems } from "@/lib/pagination";

const copy = {
	es: {
		previous: "Anterior",
		next: "Siguiente",
		page: "Página",
		of: "de",
		label: "Paginación del blog",
	},
	en: {
		previous: "Previous",
		next: "Next",
		page: "Page",
		of: "of",
		label: "Blog pagination",
	},
	pt: {
		previous: "Anterior",
		next: "Próxima",
		page: "Página",
		of: "de",
		label: "Paginação do blog",
	},
};

type Props = {
	currentPage: number;
	totalPages: number;
	lang: Lang;
} & (
	| { pathname: string; onPageChange?: never }
	| { pathname?: never; onPageChange: (page: number) => void }
);

export default function Pagination({
	currentPage,
	totalPages,
	lang,
	pathname,
	onPageChange,
}: Props) {
	const t = copy[lang];
	if (totalPages <= 1) return null;
	const control = (
		page: number,
		children: ReactNode,
		label: string,
		direction?: "prev" | "next",
	) => {
		const active = !direction && page === currentPage;
		const disabled = page < 1 || page > totalPages;
		const className = `inline-flex min-h-11 min-w-9 sm:min-w-11 items-center justify-center gap-2 rounded-md border px-2 sm:px-3 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none ${active ? "border-primary bg-primary text-primary-foreground" : disabled ? "border-transparent text-muted-foreground/50" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"}`;
		if (disabled)
			return (
				<span className={className} aria-disabled="true">
					{children}
				</span>
			);
		if (onPageChange)
			return (
				<button
					type="button"
					className={className}
					aria-label={label}
					aria-current={active ? "page" : undefined}
					onClick={() => onPageChange(page)}
				>
					{children}
				</button>
			);
		return (
			<a
				href={getPaginationHref(pathname ?? "/blog/", currentPage, page)}
				rel={direction}
				className={className}
				aria-label={label}
				aria-current={active ? "page" : undefined}
			>
				{children}
			</a>
		);
	};
	return (
		<nav
			aria-label={t.label}
			className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-6"
		>
			<p
				className="text-sm tabular-nums text-muted-foreground"
				aria-live={onPageChange ? "polite" : undefined}
			>
				{t.page}{" "}
				<strong className="font-semibold text-foreground">{currentPage}</strong>{" "}
				{t.of} {totalPages}
			</p>
			{totalPages > 1 && (
				<div className="flex w-full flex-wrap items-center justify-center gap-2">
					<div className="order-2 mr-auto sm:order-none sm:mr-1">
						{control(
							currentPage - 1,
							<>
								<span aria-hidden="true">←</span>
								<span>{t.previous}</span>
							</>,
							t.previous,
							"prev",
						)}
					</div>
					<ul className="order-1 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">
						{getPaginationItems(currentPage, totalPages).map((item) => (
							<li key={item}>
								{typeof item === "number" ? (
									control(item, item, `${t.page} ${item}`)
								) : (
									<span
										className="inline-flex min-h-11 w-5 items-center justify-center text-muted-foreground"
										aria-hidden="true"
									>
										…
									</span>
								)}
							</li>
						))}
					</ul>
					<div className="order-3 ml-auto sm:order-none sm:ml-1">
						{control(
							currentPage + 1,
							<>
								<span>{t.next}</span>
								<span aria-hidden="true">→</span>
							</>,
							t.next,
							"next",
						)}
					</div>
				</div>
			)}
		</nav>
	);
}
