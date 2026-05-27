"use client";

import { ChevronDown, Menu, X } from "lucide-react";
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
import type { Link, Logo, MenuItem, Menu as MenuType } from "@/types/global";

interface MainMenuProps {
	menu: MenuType;
	logo: Logo;
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

export default function MainMenu({ menu, logo, lang }: MainMenuProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const mobileMenuRef = useRef<HTMLElement>(null);
	const wasMobileOpenRef = useRef(false);

	const logoUrl = rewriteUrl(logo?.url || "/", lang);

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
          DESKTOP (lg+)
          ======================= */}
			<NavigationMenu className="hidden lg:flex w-full max-w-8xl mx-auto py-3">
				<NavigationMenuList className="w-full justify-between gap-4">
					{menu?.menuItems?.map((menuItem: MenuItem) => {
						const hasChildren =
							Array.isArray(menuItem.item) && menuItem.item.length > 0;

						return (
							<NavigationMenuItem key={menuItem.id}>
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
											<ul className="grid w-full gap-x-3 gap-y-1 mt-1 p-1 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
												{menuItem.item.map((subItem: Link) => (
													<li key={subItem.id}>
														<NavigationMenuLink asChild variant="dropdown">
															<a href={rewriteUrl(subItem.url, lang)}>
																<span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-primary transition-colors flex-shrink-0"></span>
																<span className="truncate text-foreground">
																	{subItem.label}
																</span>
																{subItem.badge ? (
																	<span className="inline-flex items-center whitespace-nowrap rounded-sm bg-secondary px-2 py-2 text-[10px] font-bold leading-none text-secondary-foreground">
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

			{/* =======================
          MOBILE (< lg)
          ======================= */}
			<div className="relative lg:hidden">
				{/* Mobile Header: Logo, idioma y menu */}
				<div className="relative z-50 flex items-center gap-4 px-4 py-3 bg-background/95 backdrop-blur-md">
					<div className="flex min-w-0 shrink-0">
						<a
							href={logoUrl}
							target={logo?.isExternal ? "_blank" : "_self"}
							rel={logo?.isExternal ? "noopener noreferrer" : undefined}
							className="block"
						>
							<img
								src="/logo-dreamytours.svg"
								alt={logo?.label ?? "Logo"}
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
							className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-md"
							onClick={() => setMobileOpen(false)}
							aria-hidden="true"
						/>
						{/* Menu items */}
						<nav
							id="mobile-menu"
							ref={mobileMenuRef}
							className="absolute left-0 right-0 top-full z-50 mt-1 border-x border-b border-border/40 bg-background p-2 shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-300 ease-out max-h-[calc(100dvh-80px)] overflow-y-auto"
							aria-label="Menú principal"
						>
							<ul className="flex flex-col gap-1.5 px-1 pb-2 pt-0.5">
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
													className="group inline-flex w-full min-w-0 items-center rounded-lg border border-primary/15 px-4 py-3.5 text-base font-medium text-foreground/70 transition-all duration-200 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
													onClick={() => setMobileOpen(false)}
												>
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
				className={`group flex w-full items-center rounded-lg border border-primary/15 px-4 py-3.5 text-base font-medium transition-all duration-200 ${
					open
						? "border-primary/25 bg-primary/10 text-primary"
						: "text-foreground/70 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
				}`}
				aria-expanded={open}
			>
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
				<ul className="mx-3 mb-2 mt-0.5 flex animate-in fade-in slide-in-from-top-1 duration-200 flex-col gap-0.5 rounded-xl bg-muted/50 p-1.5">
					{item.item.map((subItem: Link) => (
						<li key={subItem.id}>
							<a
								href={rewriteUrl(subItem.url, lang)}
								className="flex min-w-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-sm text-foreground/60 transition-all duration-200 hover:bg-background hover:text-primary"
								onClick={closeMenu}
							>
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
