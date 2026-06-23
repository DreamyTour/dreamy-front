"use client";

import {
	ArrowUpRight,
	Check,
	ChevronDown,
	ChevronRight,
	Menu,
	X,
} from "lucide-react";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
	LANGS,
	type Lang,
	localizePath,
	stripLangPrefix,
	translatePathForSlug,
} from "@/lib/i18n";
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

const MEGA_MENU_COLUMN_WIDTH = 340;
const MEGA_MENU_EDGE_PADDING = 16;
const desktopTopLevelItemClass =
	"text-white/88 hover:bg-white/10 hover:text-white focus-visible:ring-offset-[#081711] data-[state=open]:bg-white/10 data-[state=open]:text-white [&_svg]:text-white/62 [&:hover_svg]:text-white/86 [&[data-state=open]_svg]:text-white/86";

type MegaMenuLayout = {
	left: number;
	width: number;
};

function getMegaMenuColumnCount(itemCount: number) {
	if (itemCount <= 6) return 1;
	if (itemCount <= 12) return 2;
	return 3;
}

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

function MobileLanguageSwitcher({ currentLang }: { currentLang: Lang }) {
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const menuId = "language-menu-mobile";

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
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

		for (const id of ["tour-slug-map", "page-slug-map"]) {
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
				type="button"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={menuId}
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
					id={menuId}
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

export default function MainMenu({ menu, logoUrl, lang }: MainMenuProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [desktopMegaMenuLayouts, setDesktopMegaMenuLayouts] = useState<
		Record<string, MegaMenuLayout>
	>({});
	const desktopMenuRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const mobileMenuRef = useRef<HTMLElement>(null);
	const wasMobileOpenRef = useRef(false);

	const measureDesktopMegaMenus = useCallback(() => {
		const desktopMenu = desktopMenuRef.current;
		if (!desktopMenu) return;

		const positioningRoot =
			desktopMenu.querySelector<HTMLElement>('[data-slot="navigation-menu"]') ??
			desktopMenu;
		const positioningBase =
			positioningRoot.querySelector<HTMLElement>(
				'[data-slot="navigation-menu-list"]',
			) ?? positioningRoot;
		const boundsRect = positioningRoot.getBoundingClientRect();
		const baseRect = positioningBase.getBoundingClientRect();
		const maxPanelWidth = Math.max(
			0,
			boundsRect.width - MEGA_MENU_EDGE_PADDING * 2,
		);
		const nextLayouts: Record<string, MegaMenuLayout> = {};

		menu?.menuItems?.forEach((menuItem: MenuItem, index) => {
			const hasChildren =
				Array.isArray(menuItem.item) && menuItem.item.length > 0;
			if (!hasChildren) return;

			const anchor = positioningRoot.querySelector<HTMLElement>(
				`[data-mega-menu-anchor="${index}"]`,
			);
			if (!anchor) return;

			const columns = getMegaMenuColumnCount(menuItem.item.length);
			const panelWidth = Math.min(
				columns * MEGA_MENU_COLUMN_WIDTH,
				maxPanelWidth,
			);
			const anchorRect = anchor.getBoundingClientRect();
			const minLeft = boundsRect.left - baseRect.left + MEGA_MENU_EDGE_PADDING;
			const maxLeft =
				boundsRect.right - baseRect.left - panelWidth - MEGA_MENU_EDGE_PADDING;
			const openRightLeft = anchorRect.left - baseRect.left;
			const openLeftLeft = anchorRect.right - baseRect.left - panelWidth;
			const preferredLeft =
				openRightLeft + panelWidth <=
				boundsRect.right - baseRect.left - MEGA_MENU_EDGE_PADDING
					? openRightLeft
					: openLeftLeft;
			const left = Math.min(
				Math.max(preferredLeft, minLeft),
				Math.max(minLeft, maxLeft),
			);

			nextLayouts[String(menuItem.id)] = {
				left: Math.round(left),
				width: Math.round(panelWidth),
			};
		});

		setDesktopMegaMenuLayouts(nextLayouts);
	}, [menu?.menuItems]);

	useEffect(() => {
		const frameId = window.requestAnimationFrame(measureDesktopMegaMenus);
		const desktopMenu = desktopMenuRef.current;
		const resizeObserver =
			typeof ResizeObserver !== "undefined" && desktopMenu
				? new ResizeObserver(measureDesktopMegaMenus)
				: null;

		if (resizeObserver && desktopMenu) {
			resizeObserver.observe(desktopMenu);
		}
		window.addEventListener("resize", measureDesktopMegaMenus);

		return () => {
			window.cancelAnimationFrame(frameId);
			resizeObserver?.disconnect();
			window.removeEventListener("resize", measureDesktopMegaMenus);
		};
	}, [measureDesktopMegaMenus]);

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
			<div className="relative z-40 isolate hidden border-y border-white/10 bg-[#081711] text-white shadow-[0_16px_38px_-30px_rgba(8,23,17,0.72)] xl:block">
				<div
					className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
					aria-hidden="true"
				>
					<div className="absolute inset-0 bg-[linear-gradient(180deg,_#0b1d15_0%,_#081711_58%,_#050907_100%)]" />
					<div className="absolute inset-0 bg-[url('/fondo.svg')] bg-repeat opacity-15 [background-position:center_top] [background-size:clamp(26rem,38vw,38rem)_clamp(26rem,38vw,38rem)] [filter:invert(1)_sepia(0.2)_saturate(0.45)_contrast(1.08)] [mix-blend-mode:soft-light]" />
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.08),_transparent_38%)]" />
					<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
				</div>
				<div
					ref={desktopMenuRef}
					className="relative z-10 mx-auto w-full max-w-8xl px-4"
				>
					<NavigationMenu
						className="mx-auto w-full max-w-none px-0"
						aria-label="Menú principal"
					>
						<NavigationMenuList className="h-[60px] w-full justify-center gap-0">
							{menu?.menuItems?.map((menuItem: MenuItem, index) => {
								const hasChildren =
									Array.isArray(menuItem.item) && menuItem.item.length > 0;
								const columnCount = hasChildren
									? getMegaMenuColumnCount(menuItem.item.length)
									: 1;
								const rowsPerColumn = hasChildren
									? Math.ceil(menuItem.item.length / columnCount)
									: 1;
								const megaMenuLayout =
									desktopMegaMenuLayouts[String(menuItem.id)];
								const megaMenuStyle = hasChildren
									? ({
											"--mega-menu-left": `${megaMenuLayout?.left ?? MEGA_MENU_EDGE_PADDING}px`,
											"--mega-menu-width": `${megaMenuLayout?.width ?? columnCount * MEGA_MENU_COLUMN_WIDTH}px`,
										} as CSSProperties)
									: undefined;

								return (
									<NavigationMenuItem
										key={menuItem.id}
										className="flex h-full justify-center"
									>
										{hasChildren ? (
											<>
												<NavigationMenuTrigger
													data-mega-menu-anchor={index}
													className={desktopTopLevelItemClass}
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

												<NavigationMenuContent
													className="left-[var(--mega-menu-left)] right-auto mt-2 w-[var(--mega-menu-width)] max-w-[calc(100%-2rem)] rounded-none border-slate-200/90 bg-white shadow-[0_34px_90px_-54px_rgba(8,23,17,0.72)]"
													style={megaMenuStyle}
												>
													<div className="bg-white px-6 pt-6 pb-3">
														<p className="inline-block border-b-2 border-primary pb-0.5 text-[12px] font-bold uppercase leading-none tracking-[0.24em] text-black">
															{menuItem.link.label}
														</p>
													</div>

													<ul
														className="grid w-full grid-flow-col gap-x-4 gap-y-2 px-4 py-4"
														style={
															{
																gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
																gridTemplateRows: `repeat(${rowsPerColumn}, auto)`,
															} as CSSProperties
														}
													>
														{menuItem.item.map((subItem: Link) => (
															<li key={subItem.id} className="min-w-0">
																<NavigationMenuLink asChild variant="dropdown">
																	<a
																		href={rewriteUrl(subItem.url, lang)}
																		className="h-full overflow-hidden min-h-[50px] rounded-sm px-4 py-3 text-[15px] font-medium text-[#0b1511] before:pointer-events-none before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-secondary before:opacity-0 before:transition-opacity before:duration-200 hover:bg-primary/[0.07] hover:text-primary hover:shadow-[0_18px_38px_-30px_rgba(8,23,17,0.62)] group-hover:before:opacity-100 border-b border-dashed border-slate-200 hover:border-primary"
																	>
																		<span className="min-w-0 flex-1 whitespace-normal break-words leading-snug text-wrap-pretty [overflow-wrap:anywhere]">
																			{subItem.label}
																		</span>
																		<ArrowUpRight
																			size={16}
																			strokeWidth={2.2}
																			aria-hidden="true"
																			focusable="false"
																			className="-translate-x-1 ml-auto size-7 shrink-0 translate-y-1 rounded-full border border-secondary/20 bg-white p-1.5 text-secondary opacity-0 shadow-[0_10px_22px_-18px_color-mix(in_oklab,var(--secondary)_72%,transparent)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
																		/>
																		{subItem.badge ? (
																			<span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-sm bg-secondary px-3 py-1.5 text-[10px] font-normal leading-none text-white uppercase">
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
											<NavigationMenuLink
												asChild
												className={desktopTopLevelItemClass}
											>
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
			</div>

			{/* =======================
          MOBILE (< xl)
          ======================= */}
			<section className="relative xl:hidden">
				{/* Mobile Header: Logo, idioma y menu */}
				<nav
					className="relative z-50 bg-background/95 px-4 py-3 backdrop-blur-md"
					aria-label="Controles móviles"
				>
					<ul className="flex list-none items-center gap-4 p-0">
						<li className="min-w-0 shrink-0">
							<a
								href={logoUrl}
								className="block"
								aria-label="Dreamy Tours - inicio"
							>
								<img
									src="/logo-dreamytours.svg"
									alt=""
									className="h-10 w-auto"
									width="110"
									height="40"
									fetchPriority="high"
								/>
							</a>
						</li>
						<li className="ml-auto">
							{lang && <MobileLanguageSwitcher currentLang={lang} />}
						</li>
						<li>
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
						</li>
					</ul>
				</nav>

				{/* Mobile menu dropdown and overlay */}
				{mobileOpen && (
					<div
						className="fixed inset-0 z-40 bg-foreground/12 backdrop-blur-sm"
						onClick={() => setMobileOpen(false)}
						aria-hidden="true"
					/>
				)}
				<nav
					id="mobile-menu"
					ref={mobileMenuRef}
					className="absolute left-3 right-3 top-full z-50 mt-3 max-h-[calc(100dvh-92px)] overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-[0_24px_70px_-44px_var(--foreground)] animate-in fade-in slide-in-from-top-2 duration-300 ease-out"
					aria-label="Menú principal"
					hidden={!mobileOpen}
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
			</section>
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
	const submenuId = `mobile-submenu-${item.id}`;

	return (
		<>
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
				aria-controls={submenuId}
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

			<ul
				id={submenuId}
				className="mb-2 mt-1 flex animate-in fade-in slide-in-from-top-1 duration-200 flex-col gap-0.5 px-2"
				hidden={!open}
			>
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
		</>
	);
}
