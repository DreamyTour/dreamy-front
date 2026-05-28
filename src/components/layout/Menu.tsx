"use client";

import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { Lang } from "@/lib/i18n";
import { rewriteUrl } from "@/lib/utils";
import type { Link, MenuItem, Menu as MenuType } from "@/types/global";

interface MainMenuProps {
	menu: MenuType;
	logoUrl: string;
	lang: Lang;
}

function MenuLabelWithBadge({
	label,
	badge,
}: {
	label: string;
	badge?: string;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			<span>{label}</span>
			{badge ? (
				<span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold leading-none text-secondary-foreground">
					{badge}
				</span>
			) : null}
		</span>
	);
}

export default function MainMenu({ menu, logoUrl, lang }: MainMenuProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const mobileMenuRef = useRef<HTMLElement>(null);
	const wasMobileOpenRef = useRef(false);

	// Focus trap y gestión del foco al abrir/cerrar menú móvil
	useEffect(() => {
		if (mobileOpen) {
			// Enfocar el primer item del menú cuando se abre
			requestAnimationFrame(() => {
				const first = mobileMenuRef.current?.querySelector<
					HTMLAnchorElement | HTMLButtonElement
				>("a[href], button:not([disabled])");
				first?.focus();
			});
			// Bloquear scroll del body
			document.body.style.overflow = "hidden";
		} else {
			// Restaurar scroll
			document.body.style.overflow = "";
			if (wasMobileOpenRef.current) {
				menuButtonRef.current?.focus();
			}
		}
		wasMobileOpenRef.current = mobileOpen;

		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	// Cerrar menú con Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!mobileOpen) return;

			if (e.key === "Escape") {
				setMobileOpen(false);
				return;
			}

			if (e.key === "Tab" && mobileMenuRef.current) {
				const focusableElements = mobileMenuRef.current.querySelectorAll<
					HTMLAnchorElement | HTMLButtonElement
				>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (!firstElement || !lastElement) return;

				if (e.shiftKey && document.activeElement === firstElement) {
					e.preventDefault();
					lastElement.focus();
				} else if (!e.shiftKey && document.activeElement === lastElement) {
					e.preventDefault();
					firstElement.focus();
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [mobileOpen]);

	return (
		<>
			{/* =======================
          DESKTOP (xl+)
          ======================= */}
			<div className="hidden border-y border-border/70 bg-white shadow-[0_14px_38px_-34px_var(--foreground)] xl:block">
				<NavigationMenu className="w-full max-w-8xl mx-auto px-4 py-3">
					<NavigationMenuList className="w-full justify-center gap-3">
						{menu?.menuItems?.map((menuItem: MenuItem) => {
							const hasChildren =
								Array.isArray(menuItem.item) && menuItem.item.length > 0;

							return (
								<NavigationMenuItem
									key={menuItem.id}
									className="flex justify-center"
								>
									{hasChildren ? (
										<>
											<NavigationMenuTrigger
												onClick={() => {
													if (menuItem.link?.url) {
														window.location.href = rewriteUrl(
															menuItem.link.url,
															lang,
														);
													}
												}}
											>
												<MenuLabelWithBadge
													label={menuItem.link.label}
													badge={menuItem.link.badge}
												/>
											</NavigationMenuTrigger>

											<NavigationMenuContent>
												<ul className="grid w-full grid-cols-3 gap-x-8 gap-y-1.5 p-6">
													{menuItem.item.map((subItem: Link) => (
														<li key={subItem.id}>
															<NavigationMenuLink asChild variant="dropdown">
																<a href={rewriteUrl(subItem.url, lang)}>
																	<ChevronRight
																		size={14}
																		strokeWidth={2.2}
																		className="shrink-0 text-primary/45 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
																		aria-hidden="true"
																		focusable="false"
																	/>
																	<span className="min-w-0 flex-1 whitespace-normal text-balance leading-snug">
																		{subItem.label}
																	</span>
																	{subItem.badge ? (
																		<span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-secondary px-2 py-1 text-[10px] font-bold leading-none text-secondary-foreground">
																			{subItem.badge}
																		</span>
																	) : null}
																</a>
															</NavigationMenuLink>
														</li>
													))}
												</ul>
											</NavigationMenuContent>
										</>
									) : (
										<NavigationMenuLink asChild>
											<a href={rewriteUrl(menuItem.link.url, lang)}>
												<MenuLabelWithBadge
													label={menuItem.link.label}
													badge={menuItem.link.badge}
												/>
											</a>
										</NavigationMenuLink>
									)}
								</NavigationMenuItem>
							);
						})}
					</NavigationMenuList>
				</NavigationMenu>
			</div>

			{/* =======================
          MOBILE (< xl)
          ======================= */}
			<div className="relative xl:hidden">
				{/* Mobile Header: Logo, idioma y menu */}
				<div className="relative z-50 flex items-center gap-4 px-4 py-3 bg-background/95 backdrop-blur-md">
					<div className="flex min-w-0 shrink-0">
						<a href={logoUrl} className="block">
							<img
								src="/logo-dreamytours.svg"
								alt="Logo Dreamy Tours"
								className="h-10 w-auto"
								width="110"
								height="40"
								fetchPriority="high"
							/>
						</a>
					</div>
					<div className="ml-auto flex items-center justify-end gap-2">
						{lang && <LanguageSwitcher currentLang={lang} />}
						<button
							type="button"
							ref={menuButtonRef}
							onClick={() => setMobileOpen(!mobileOpen)}
							className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-all duration-200 hover:bg-primary/5 active:scale-90"
							aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
							aria-expanded={mobileOpen}
							aria-controls="mobile-menu"
						>
							{mobileOpen ? (
								<X size={22} aria-hidden="true" focusable="false" />
							) : (
								<Menu size={22} aria-hidden="true" focusable="false" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile menu dropdown and overlay */}
				{mobileOpen && (
					<>
						{/* Overlay */}
						<div
							className="fixed inset-0 z-40 bg-foreground/12 backdrop-blur-sm"
							onClick={() => setMobileOpen(false)}
							aria-hidden="true"
						/>
						{/* Menu items */}
						<nav
							id="mobile-menu"
							ref={mobileMenuRef}
							className="absolute left-3 right-3 top-full z-50 mt-3 max-h-[calc(100dvh-92px)] overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-[0_24px_70px_-44px_var(--foreground)] animate-in fade-in slide-in-from-top-2 duration-300 ease-out"
							aria-label="Menú principal"
						>
							<ul className="flex flex-col gap-2 px-0.5 pb-1 pt-0.5">
								{menu?.menuItems?.map((menuItem: MenuItem) => {
									const hasChildren =
										Array.isArray(menuItem.item) && menuItem.item.length > 0;

									return (
										<li key={menuItem.id}>
											{hasChildren ? (
												<MobileAccordion
													item={menuItem}
													closeMenu={() => setMobileOpen(false)}
													lang={lang}
												/>
											) : (
												<a
													href={rewriteUrl(menuItem.link.url, lang)}
													className="group relative inline-flex w-full min-w-0 items-center rounded-xl px-3.5 py-3.5 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary/6 hover:text-primary"
													onClick={() => setMobileOpen(false)}
												>
													<span
														aria-hidden="true"
														className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent transition-opacity duration-200 group-hover:via-primary/45"
													/>
													<MenuLabelWithBadge
														label={menuItem.link.label}
														badge={menuItem.link.badge}
													/>
												</a>
											)}
										</li>
									);
								})}
							</ul>
						</nav>
					</>
				)}
			</div>
		</>
	);
}

/* =======================
   MOBILE ACCORDION
   ======================= */
interface MobileAccordionProps {
	item: MenuItem;
	closeMenu: () => void;
	lang: Lang;
}

function MobileAccordion({ item, closeMenu, lang }: MobileAccordionProps) {
	const [open, setOpen] = useState(false);

	return (
		<div>
			{/* TÍTULO = TOGGLE */}
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={`group relative inline-flex w-full items-center rounded-xl px-3.5 py-3.5 text-base font-semibold transition-colors duration-200 ${
					open
						? "text-primary"
						: "text-foreground hover:bg-primary/6 hover:text-primary"
				}`}
				aria-expanded={open}
			>
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent transition-opacity duration-200 group-hover:via-primary/45"
				/>
				<MenuLabelWithBadge label={item.link.label} badge={item.link.badge} />
				<ChevronDown
					size={18}
					className={`ml-auto text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-180 text-primary" : "group-hover:text-primary"}`}
					aria-hidden="true"
					focusable="false"
				/>
			</button>

			{/* Submenu */}
			{open && (
				<ul className="mb-2 mt-1 flex animate-in fade-in slide-in-from-top-1 duration-200 flex-col gap-0.5 px-2">
					{item.item.map((subItem: Link) => (
						<li key={subItem.id}>
							<a
								href={rewriteUrl(subItem.url, lang)}
								className="group relative flex min-w-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:text-primary"
								onClick={closeMenu}
							>
								<ChevronRight
									size={14}
									strokeWidth={2.2}
									aria-hidden="true"
									focusable="false"
									className="shrink-0 text-primary/45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
								/>
								<span className="min-w-0 truncate">{subItem.label}</span>
								{subItem.badge ? (
									<span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold leading-none text-secondary-foreground">
										{subItem.badge}
									</span>
								) : null}
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
