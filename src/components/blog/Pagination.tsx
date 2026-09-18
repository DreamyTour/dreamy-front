import type { ReactNode } from "react";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
} from "@/components/icons/NavigationIcons";
import type { Lang } from "@/lib/i18n";
import { getPaginationHref, getPaginationItems } from "@/lib/pagination";

const copy = {
	es: {
		previous: "Anterior",
		next: "Siguiente",
		page: "Página",
		label: "Paginación del blog",
	},
	en: {
		previous: "Previous",
		next: "Next",
		page: "Page",
		label: "Blog pagination",
	},
	pt: {
		previous: "Anterior",
		next: "Próxima",
		page: "Página",
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
		const className = `group relative inline-flex min-h-11 min-w-8 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium tabular-nums transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transition-none sm:min-w-11 ${direction ? "px-3 " : ""}${active ? "border-primary bg-primary text-primary-foreground shadow-[0_3px_10px_-3px_color-mix(in_oklab,var(--primary)_35%,transparent)] after:absolute after:bottom-1 after:h-0.5 after:w-3 after:rounded-full after:bg-primary-foreground" : disabled ? "cursor-default border-transparent text-muted-foreground/40" : direction ? "border-transparent text-foreground hover:border-primary/15 hover:bg-primary/5 hover:text-primary" : "border-transparent text-muted-foreground hover:border-primary/15 hover:bg-primary/5 hover:text-primary"}`;
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
			className="mt-10 flex min-w-0 flex-col items-center border-t border-border/60 pt-8"
		>
			{totalPages > 1 && (
				<div className="grid max-w-full grid-cols-2 items-center gap-x-2 gap-y-1 rounded-2xl border border-border/80 bg-card p-1.5 shadow-[0_8px_30px_-16px_color-mix(in_oklab,var(--foreground)_22%,transparent)] ring-4 ring-primary/[0.025] sm:flex sm:justify-center">
					<div className="order-2 justify-self-start sm:order-none">
						{control(
							currentPage - 1,
							<>
								<ArrowLeftIcon className="size-4" />
								<span className="sm:sr-only xl:not-sr-only">{t.previous}</span>
							</>,
							t.previous,
							"prev",
						)}
					</div>
					<ul className="order-1 col-span-2 flex min-w-0 items-center justify-center gap-1 border-b border-border/60 pb-1.5 sm:order-none sm:border-x sm:border-b-0 sm:px-2 sm:pb-0">
						{getPaginationItems(currentPage, totalPages).map((item) => (
							<li key={item}>
								{typeof item === "number" ? (
									control(item, item, `${t.page} ${item}`)
								) : (
									<span
										className="inline-flex min-h-11 w-4 items-center justify-center text-muted-foreground/60"
										aria-hidden="true"
									>
										…
									</span>
								)}
							</li>
						))}
					</ul>
					<div className="order-3 justify-self-end sm:order-none">
						{control(
							currentPage + 1,
							<>
								<span className="sm:sr-only xl:not-sr-only">{t.next}</span>
								<ArrowRightIcon className="size-4" />
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
