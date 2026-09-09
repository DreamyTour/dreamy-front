"use client";

import {
	ArrowUpRight,
	ChevronRight,
	Leaf,
	MapPinned,
	Mountain,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getMenuIcons } from "@/components/layout/menu-icons";
import "./desktop-menu.css";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";
import { cn, rewriteUrl } from "@/lib/utils";
import type { Link, MenuItem, Menu as MenuType } from "@/types/global";

interface Props {
	menu: MenuType;
	lang: Lang;
	overlay?: boolean;
}

const SCROLL_DELTA = 8;
const MEGA_MENU_FALLBACK_IMAGE = "/imagenes/circuitos.webp";
const topLevelClass =
	"h-11 rounded-none border-0 px-3 text-[14px] font-normal tracking-normal text-black hover:bg-transparent hover:text-primary focus-visible:ring-primary/40 focus-visible:ring-offset-white before:pointer-events-none before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:bg-secondary data-[state=open]:bg-transparent data-[state=open]:text-primary xl:px-3 2xl:px-4 [&_svg]:text-current";

const megaMenuCopy: Record<
	Lang,
	{
		navigation: string;
		routes: string;
		featured: string;
		viewAll: string;
		viewMore: string;
		trust: [string, string, string, string];
		trustDetails: [string, string, string, string];
	}
> = {
	es: {
		navigation: "Menú principal",
		routes: "RUTAS DESTACADAS",
		featured: "EXPERIENCIA DREAMY",
		viewAll: "Ver todos los tours",
		viewMore: "Ver más",
		trust: [
			"Operador local",
			"Grupos pequeños",
			"Turismo sostenible",
			"Destinos inolvidables",
		],
		trustDetails: [
			"Gente de aquí. Experiencias auténticas.",
			"Un viaje con más significado.",
			"Impacto positivo. Un futuro mejor.",
			"Más que un viaje, una conexión.",
		],
	},
	en: {
		navigation: "Main navigation",
		routes: "FEATURED ROUTES",
		featured: "A DREAMY EXPERIENCE",
		viewAll: "View all tours",
		viewMore: "View more",
		trust: [
			"Trusted local operator",
			"Small groups",
			"Sustainable travel",
			"Unforgettable destinations",
		],
		trustDetails: [
			"Real people. Real Peru.",
			"A more meaningful journey.",
			"Positive impact. Brighter tomorrow.",
			"More than a journey, a connection.",
		],
	},
	pt: {
		navigation: "Navegação principal",
		routes: "ROTEIROS EM DESTAQUE",
		featured: "EXPERIÊNCIA DREAMY",
		viewAll: "Ver todos os tours",
		viewMore: "Ver mais",
		trust: [
			"Operadora local",
			"Grupos pequenos",
			"Turismo sustentável",
			"Destinos inesquecíveis",
		],
		trustDetails: [
			"Gente daqui. Experiências autênticas.",
			"Uma viagem com mais significado.",
			"Impacto positivo. Um futuro melhor.",
			"Mais que uma viagem, uma conexão.",
		],
	},
};

const peruIntroCopy: Record<
	Lang,
	{ title: string; description: string; detail: string }
> = {
	es: {
		title: "Un pa\u00eds, mil formas de sorprenderte.",
		description:
			"De los Andes a la Amazon\u00eda, pasando por ciudades llenas de historia y sabores que se quedan contigo. Encuentra tu pr\u00f3ximo destino y vive Per\u00fa a tu manera.",
		detail: "Costa, sierra y selva. T\u00fa eliges el comienzo.",
	},
	en: {
		title: "One country. A thousand discoveries.",
		description:
			"From the Andes to the Amazon, discover cities rich in history and flavours that stay with you. Find your next destination and experience Peru your way.",
		detail: "Coast, highlands and rainforest. Choose where to begin.",
	},
	pt: {
		title: "Um pa\u00eds, mil formas de surpreender.",
		description:
			"Dos Andes \u00e0 Amaz\u00f4nia, descubra cidades cheias de hist\u00f3ria e sabores inesquec\u00edveis. Encontre seu pr\u00f3ximo destino e viva o Peru do seu jeito.",
		detail: "Litoral, serra e selva. Voc\u00ea escolhe por onde come\u00e7ar.",
	},
};

type NavMode = "static" | "visible" | "hidden";

const generalIntroCopy: Record<Lang, { description: string; detail: string }> =
	{
		es: {
			description:
				"Descubre nuestras propuestas y encuentra la experiencia que va contigo. Nuestro equipo local te acompa\u00f1a en cada paso del viaje.",
			detail: "Explora, elige y viaja a tu manera.",
		},
		en: {
			description:
				"Explore our collection and find the experience that feels right for you. Our local team is with you every step of the journey.",
			detail: "Explore, choose and travel your way.",
		},
		pt: {
			description:
				"Descubra nossas propostas e encontre a experi\u00eancia que combina com voc\u00ea. Nossa equipe local acompanha cada etapa da viagem.",
			detail: "Explore, escolha e viaje do seu jeito.",
		},
	};
function Label({ label, badge }: { label: string; badge?: string }) {
	return (
		<span className="inline-flex items-center gap-2">
			<span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
			{badge ? (
				<span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold leading-none text-secondary-foreground">
					{badge}
				</span>
			) : null}
		</span>
	);
}

function MegaMenuFeatureCard({
	href,
	image,
	eyebrow,
	title,
	viewMore,
	showText = false,
	compact = false,
}: {
	href: string;
	image: string;
	eyebrow: string;
	title: string;
	viewMore: string;
	showText?: boolean;
	compact?: boolean;
}) {
	return (
		<NavigationMenuLink asChild variant="dropdown">
			<a
				href={href}
				aria-label={title}
				className={cn(
					"group relative isolate min-h-[320px] overflow-hidden rounded-[1.15rem] border border-white/20 bg-[#0b281c] text-white shadow-[0_24px_50px_-30px_rgba(4,28,17,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
					compact ? "min-w-0" : "col-start-4 row-start-1 min-w-0",
				)}
			>
				<img
					src={image}
					alt=""
					width={1600}
					height={900}
					loading="lazy"
					fetchPriority="low"
					decoding="async"
					className="absolute inset-0 size-full object-cover object-[62%_center] transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
				/>
				{showText && title ? (
					<>
						<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.04)_5%,rgba(3,14,9,0.16)_38%,rgba(3,14,9,0.94)_100%)]" />
						<div className="absolute inset-x-4 top-4 h-px bg-gradient-to-r from-white/55 via-white/10 to-transparent" />
						<div className="absolute inset-x-0 bottom-0 p-5 text-white 2xl:p-6">
							<p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-[#b9f4cf]">
								{eyebrow}
							</p>
							<div className="mt-2.5 flex items-end gap-3">
								<h3
									className={cn(
										"font-semibold leading-[1.02] tracking-[-0.04em] text-balance",
										compact
											? "text-[1.3125rem] 2xl:text-[1.45rem]"
											: "max-w-[15ch] text-[1.65rem]",
									)}
								>
									{title}
								</h3>
							</div>
							<span className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-secondary/90">
								{viewMore}
								<ArrowUpRight size={17} aria-hidden="true" />
							</span>
						</div>
					</>
				) : null}
			</a>
		</NavigationMenuLink>
	);
}

export default function DesktopMenu({ menu, lang, overlay = false }: Props) {
	const [navMode, setNavMode] = useState<NavMode>("static");
	const shellRef = useRef<HTMLDivElement>(null);
	const navModeRef = useRef<NavMode>("static");
	const lastScrollYRef = useRef(0);
	const copy = megaMenuCopy[lang];
	const peruIntro = peruIntroCopy[lang];
	const isSticky = navMode !== "static";
	const navItemClass = cn(
		topLevelClass,
		"desktop-nav-item",
		isSticky &&
			"text-white hover:text-white focus-visible:ring-white/70 focus-visible:ring-offset-primary before:bg-white/75 data-[state=open]:text-white",
	);

	useEffect(() => {
		let frameId = 0;
		const setMode = (mode: NavMode) => {
			if (navModeRef.current === mode) return;
			navModeRef.current = mode;
			setNavMode(mode);
		};
		const update = () => {
			frameId = 0;
			const shell = shellRef.current;
			if (!shell) return;
			const currentY = Math.max(0, window.scrollY);
			if (currentY <= shell.offsetTop) {
				setMode("static");
				lastScrollYRef.current = currentY;
				return;
			}
			const delta = currentY - lastScrollYRef.current;
			if (Math.abs(delta) < SCROLL_DELTA) return;
			setMode(
				delta < 0 || currentY <= shell.offsetTop + shell.offsetHeight
					? "visible"
					: "hidden",
			);
			lastScrollYRef.current = currentY;
		};
		const requestUpdate = () => {
			if (!frameId) frameId = requestAnimationFrame(update);
		};
		lastScrollYRef.current = window.scrollY;
		update();
		window.addEventListener("scroll", requestUpdate, { passive: true });
		window.addEventListener("resize", requestUpdate);
		return () => {
			if (frameId) cancelAnimationFrame(frameId);
			window.removeEventListener("scroll", requestUpdate);
			window.removeEventListener("resize", requestUpdate);
		};
	}, []);

	return (
		<div
			ref={shellRef}
			className="desktop-nav-shell hidden h-[60px] xl:block"
			data-overlay={overlay}
		>
			<div
				data-mode={navMode}
				className={`desktop-nav-bar z-40 isolate border-t-2 border-primary transition-[transform,box-shadow,background-color] duration-300 ease-out motion-reduce:transition-none ${
					navMode === "static"
						? "relative bg-white text-black"
						: navMode === "visible"
							? "fixed inset-x-0 top-0 translate-y-0 bg-primary text-white shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--primary)_40%,transparent),inset_0_1px_0_rgba(255,255,255,0.16)]"
							: "fixed inset-x-0 top-0 -translate-y-[calc(100%_+_1rem)] bg-primary text-white"
				}`}
			>
				<div className="relative z-10 mx-auto w-full max-w-[var(--max-width-8xl)]">
					<NavigationMenu
						className="mx-auto w-full max-w-none px-0 [&>div]:w-full"
						aria-label={copy.navigation}
					>
						<NavigationMenuList className="h-[58px] w-full justify-between gap-0 px-1">
							{menu?.menuItems?.map((item: MenuItem) => {
								const hasChildren = Boolean(item.item?.length);
								const isPeruTours =
									/^(?:per[u\u00fa] tours|tours (?:en |in |no )?per[u\u00fa])$/i.test(
										item.link.label.trim(),
									);
								const icons = getMenuIcons(item.item);
								const isDense = item.item.length > 12;
								const columns = isDense ? 3 : 2;
								const intro = isPeruTours
									? peruIntro
									: { ...generalIntroCopy[lang], title: item.link.label };
								const isIncaTrail =
									/(?:inca[\s-]*trails?|(?:camino|caminho|trilha)[\s-]*(?:de[\s-]*)?inca)/i.test(
										`${item.link.label} ${item.link.url ?? ""}`,
									);
								const rows = hasChildren
									? Math.ceil(item.item.length / columns)
									: 1;
								const hasCategoryPage =
									Boolean(item.link?.url) && item.link.url.trim() !== "#";
								const categoryHref = hasCategoryPage
									? rewriteUrl(item.link.url, lang)
									: rewriteUrl(item.item[0]?.url ?? "#", lang);
								const primaryFeatureTitle = hasCategoryPage
									? item.link.label
									: (item.item[0]?.label ?? item.link.label);
								return (
									<NavigationMenuItem
										key={item.id}
										className="flex h-full items-center justify-center"
									>
										{hasChildren ? (
											<>
												<NavigationMenuTrigger className={navItemClass}>
													<Label
														label={item.link.label}
														badge={item.link.badge}
													/>
												</NavigationMenuTrigger>
												<NavigationMenuContent className="left-0 right-0 mt-3 max-h-[calc(100dvh-16rem)] w-auto overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.4rem] border-white/80 bg-[#f5f9f6]/[0.98] shadow-[0_36px_100px_-44px_rgba(2,18,10,0.78),0_12px_30px_-22px_rgba(2,18,10,0.42)] backdrop-blur-xl [scrollbar-gutter:stable]">
													<div
														className={cn(
															"relative grid min-h-[340px] grid-rows-[1fr_auto] gap-3.5 p-3.5 before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent",
															"grid-cols-4",
														)}
													>
														<section className="col-span-3 col-start-1 row-start-1 flex min-w-0 flex-col rounded-[1.15rem] border border-primary/[0.09] bg-white px-5 py-5 shadow-[0_18px_45px_-38px_rgba(5,37,23,0.7)] 2xl:px-6">
															<div className="flex items-center justify-between gap-5 border-b border-primary/10 px-2 pb-4">
																<div>
																	<p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-primary/55">
																		{copy.routes}
																	</p>
																	<h2 className="mt-1.5 text-[1.4rem] font-semibold tracking-[-0.035em] text-black text-balance">
																		{item.link.label}
																	</h2>
																</div>
																{hasCategoryPage ? (
																	<NavigationMenuLink
																		asChild
																		variant="dropdown"
																	>
																		<a
																			href={categoryHref}
																			className="group/all shrink-0 rounded-full border border-primary bg-primary px-3.5 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary/90 hover:text-white focus:text-white focus-visible:ring-2 focus-visible:ring-primary/40"
																		>
																			{copy.viewAll}
																			<ArrowUpRight
																				size={14}
																				aria-hidden="true"
																				className="transition-transform duration-200 group-hover/all:-translate-y-0.5 group-hover/all:translate-x-0.5"
																			/>
																		</a>
																	</NavigationMenuLink>
																) : (
																	<span
																		className="hidden size-2 rounded-full bg-secondary shadow-[0_0_12px_rgba(204,54,42,0.7)] 2xl:block"
																		aria-hidden="true"
																	/>
																)}
															</div>
															<div
																className={cn(
																	"mt-4 grid flex-1 grid-cols-3 gap-4",
																)}
															>
																{!isDense ? (
																	<div className="flex min-w-0 flex-col items-start border-r border-primary/10 py-2 pl-2 pr-5">
																		<span className="mb-4 grid size-10 place-items-center rounded-2xl bg-primary/[0.07] text-primary">
																			<MapPinned size={20} aria-hidden="true" />
																		</span>
																		<h3 className="max-w-[16ch] text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.035em] text-primary text-balance">
																			{intro.title}
																		</h3>
																		<p className="mt-3 text-[0.8125rem] leading-relaxed text-foreground/70">
																			{intro.description}
																		</p>
																		<p className="mt-5 border-l-2 border-secondary pl-3 text-[0.6875rem] font-medium leading-relaxed text-foreground/80">
																			{intro.detail}
																		</p>
																	</div>
																) : null}
																<ul
																	className={cn(
																		"grid w-full grid-flow-col content-start gap-x-3 gap-y-3 px-1",
																		isDense ? "col-span-3" : "col-span-2",
																	)}
																	style={{
																		gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
																		gridTemplateRows: `repeat(${rows}, auto)`,
																	}}
																>
																	{item.item.map((subItem: Link, subIndex) => {
																		const Icon = icons[subIndex];
																		const columnIndex = Math.floor(
																			subIndex / rows,
																		);
																		return (
																			<li
																				key={subItem.id}
																				className={cn(
																					"min-w-0",
																					columnIndex > 0 &&
																						"border-l border-dashed border-primary/15 pl-3",
																				)}
																			>
																				<NavigationMenuLink
																					asChild
																					variant="dropdown"
																				>
																					<a
																						href={rewriteUrl(subItem.url, lang)}
																						className="desktop-submenu-link group/tour h-full min-h-[3.25rem] overflow-hidden rounded-xl border border-black/[0.035] bg-white px-3 py-3 text-[0.8125rem] font-semibold text-black shadow-[0_3px_14px_-5px_rgba(15,23,42,0.14)] transition-[color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:text-primary hover:shadow-[0_8px_22px_-8px_color-mix(in_oklab,var(--primary)_28%,transparent),0_0_0_1px_color-mix(in_oklab,var(--primary)_12%,transparent)] focus-visible:text-primary focus-visible:shadow-[0_8px_22px_-8px_color-mix(in_oklab,var(--primary)_28%,transparent),0_0_0_1px_color-mix(in_oklab,var(--primary)_12%,transparent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
																					>
																						<Icon
																							size={23}
																							strokeWidth={1.6}
																							aria-hidden="true"
																							className="shrink-0 text-slate-700 group-hover/tour:text-primary"
																						/>
																						<span className="min-w-0 flex-1 whitespace-normal break-words leading-snug [overflow-wrap:anywhere]">
																							{subItem.label}
																						</span>
																						<ChevronRight
																							size={15}
																							aria-hidden="true"
																							className="ml-auto size-5 shrink-0 p-0.5 text-current opacity-60 transition-[opacity,transform] duration-200 group-hover/tour:translate-x-0 group-hover/tour:opacity-100 group-focus-visible/tour:translate-x-0 group-focus-visible/tour:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
																						/>
																						{subItem.badge ? (
																							<span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-[9px] font-bold uppercase text-white">
																								{subItem.badge}
																							</span>
																						) : null}
																					</a>
																				</NavigationMenuLink>
																			</li>
																		);
																	})}
																</ul>
															</div>
														</section>

														<ul className="col-span-4 row-start-2 grid grid-cols-4 items-center py-4 text-slate-700">
															{[ShieldCheck, Users, Leaf, Mountain].map(
																(TrustIcon, index) => (
																	<li
																		key={copy.trust[index]}
																		className="flex min-w-0 items-center justify-center gap-3 px-4 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-slate-300/70"
																	>
																		<TrustIcon
																			size={29}
																			strokeWidth={1.65}
																			aria-hidden="true"
																			className="shrink-0"
																		/>
																		<div className="min-w-0">
																			<p className="text-[0.625rem] font-bold uppercase leading-relaxed tracking-[0.13em]">
																				{copy.trust[index]}
																			</p>
																			<p className="mt-1 text-[0.75rem] leading-relaxed text-slate-500">
																				{copy.trustDetails[index]}
																			</p>
																		</div>
																	</li>
																),
															)}
														</ul>

														<MegaMenuFeatureCard
															showText={isIncaTrail}
															viewMore={copy.viewMore}
															href={categoryHref}
															image={
																item.imagen?.url
																	? getImageUrl(item.imagen, "medium")
																	: MEGA_MENU_FALLBACK_IMAGE
															}
															eyebrow={copy.featured}
															title={primaryFeatureTitle}
														/>
													</div>
												</NavigationMenuContent>
											</>
										) : (
											<NavigationMenuLink asChild className={navItemClass}>
												<a href={rewriteUrl(item.link.url, lang)}>
													<Label
														label={item.link.label}
														badge={item.link.badge}
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
		</div>
	);
}
