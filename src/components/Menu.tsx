"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type {
	Link,
	Logo,
	MenuItem,
	Menu as MenuType,
} from "@/interface/global";
import { getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";
import { rewriteUrl } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

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
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const logoUrl = rewriteUrl(logo?.url || "/", lang);

	// Focus trap y gestión del foco al abrir/cerrar menú móvil
	useEffect(() => {
		if (mobileOpen) {
			// Enfocar el botón de cerrar cuando se abre el menú
			closeButtonRef.current?.focus();
			// Bloquear scroll del body
			document.body.style.overflow = "hidden";
		} else {
			// Restaurar scroll
			document.body.style.overflow = "";
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	// Cerrar menú con Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && mobileOpen) {
				setMobileOpen(false);
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
			<div className="lg:hidden">
				{/* Mobile Header: Hamburguesa, Idioma, Logo */}
				<div className="flex items-center justify-between px-4 py-3 bg-background">
					{/* Logo a la derecha */}
					<div className="flex-1 flex">
						<a
							href={logoUrl}
							target={logo?.isExternal ? "_blank" : "_self"}
							rel={logo?.isExternal ? "noopener noreferrer" : undefined}
							className="block"
						>
							<img
								src="/logofinal.svg"
								alt={logo?.label ?? "Logo"}
								className="h-10 w-auto"
							/>
						</a>
					</div>
					{/* Idioma al medio */}
					<div className="flex-1 flex justify-center">
						{lang && <LanguageSwitcher currentLang={lang} />}
					</div>
					{/* Hamburgesa */}
					<div className="flex-1 flex justify-end">
						<button
							onClick={() => setMobileOpen(!mobileOpen)}
							className="p-2 rounded-md -ml-2 text-foreground/70 transition-colors duration-200 hover:text-primary"
							aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
							aria-expanded={mobileOpen}
							aria-controls="mobile-menu"
						>
							{mobileOpen ? <X size={24} /> : <Menu size={24} />}
						</button>
					</div>
				</div>

				{/* Mobile menu dropdown and overlay */}
				{mobileOpen && (
					<>
						{/* Overlay */}
						<div
							className="fixed inset-0 z-40 bg-black/50"
							onClick={() => setMobileOpen(false)}
							aria-hidden="true"
						/>
						{/* Menu items */}
						<div
							id="mobile-menu"
							className="absolute top-[64px] left-0 w-full z-50 bg-background pb-4 rounded-b-lg"
							role="navigation"
							aria-label="Menú principal"
						>
							{/* Botón de cerrar */}
							<div className="flex justify-end px-4 pt-4">
								<button
									ref={closeButtonRef}
									onClick={() => setMobileOpen(false)}
									className="p-2 -mr-2 rounded-md text-muted-foreground transition-colors duration-200 hover:text-primary"
									aria-label="Cerrar menú"
								>
									<X size={24} />
								</button>
							</div>

							<ul className="flex flex-col divide-y divide-border/50 px-4 py-2">
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
													className="inline-flex items-center gap-2 py-3 font-medium text-foreground/80 transition-colors duration-200 hover:text-primary"
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
						</div>
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
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-2 py-3 font-medium text-foreground/80 transition-colors duration-200 hover:text-primary"
				aria-expanded={open}
			>
				<MenuLabelWithBadge label={item.link.label} badge={item.link.badge} />
				<ChevronDown
					size={18}
					className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Submenu */}
			{open && (
				<ul className="ml-4 mt-2 flex flex-col gap-1">
					{item.item.map((subItem: Link) => (
						<li key={subItem.id}>
							<a
								href={rewriteUrl(subItem.url, lang)}
								className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground/60 transition-colors duration-200 hover:text-primary"
								onClick={closeMenu}
							>
								<span className="truncate">{subItem.label}</span>
								{subItem.badge ? (
									<span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold leading-none text-secondary-foreground">
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
