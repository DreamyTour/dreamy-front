"use client";

import { ArrowUpRight } from "lucide-react";
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
import type { Lang } from "@/lib/i18n";
import { rewriteUrl } from "@/lib/utils";
import type { Link, MenuItem, Menu as MenuType } from "@/types/global";

interface Props {
	menu: MenuType;
	lang: Lang;
}

const COLUMN_WIDTH = 340;
const EDGE_PADDING = 16;
const SCROLL_DELTA = 8;
const topLevelClass =
	"text-white/88 hover:bg-white/10 hover:text-white focus-visible:ring-offset-[#081711] data-[state=open]:bg-white/10 data-[state=open]:text-white [&_svg]:text-white/62 [&:hover_svg]:text-white/86 [&[data-state=open]_svg]:text-white/86";

type NavMode = "static" | "visible" | "hidden";
type MegaMenuLayout = { left: number; width: number };

function columnCount(itemCount: number) {
	if (itemCount <= 6) return 1;
	if (itemCount <= 12) return 2;
	return 3;
}

function Label({ label, badge }: { label: string; badge?: string }) {
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

export default function DesktopMenu({ menu, lang }: Props) {
	const [layouts, setLayouts] = useState<Record<string, MegaMenuLayout>>({});
	const [navMode, setNavMode] = useState<NavMode>("static");
	const shellRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const navModeRef = useRef<NavMode>("static");
	const lastScrollYRef = useRef(0);

	const measure = useCallback(() => {
		const desktopMenu = menuRef.current;
		if (!desktopMenu) return;
		const root =
			desktopMenu.querySelector<HTMLElement>('[data-slot="navigation-menu"]') ??
			desktopMenu;
		const base =
			root.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]') ??
			root;
		const bounds = root.getBoundingClientRect();
		const baseRect = base.getBoundingClientRect();
		const maxWidth = Math.max(0, bounds.width - EDGE_PADDING * 2);
		const next: Record<string, MegaMenuLayout> = {};

		menu?.menuItems?.forEach((item: MenuItem, index) => {
			if (!item.item?.length) return;
			const anchor = root.querySelector<HTMLElement>(
				`[data-mega-menu-anchor="${index}"]`,
			);
			if (!anchor) return;
			const width = Math.min(
				columnCount(item.item.length) * COLUMN_WIDTH,
				maxWidth,
			);
			const anchorRect = anchor.getBoundingClientRect();
			const minLeft = bounds.left - baseRect.left + EDGE_PADDING;
			const maxLeft = bounds.right - baseRect.left - width - EDGE_PADDING;
			const right = anchorRect.left - baseRect.left;
			const left = anchorRect.right - baseRect.left - width;
			const preferred =
				right + width <= bounds.right - baseRect.left - EDGE_PADDING
					? right
					: left;
			next[String(item.id)] = {
				left: Math.round(
					Math.min(Math.max(preferred, minLeft), Math.max(minLeft, maxLeft)),
				),
				width: Math.round(width),
			};
		});
		setLayouts(next);
	}, [menu?.menuItems]);

	useEffect(() => {
		const frameId = requestAnimationFrame(measure);
		const observer = menuRef.current ? new ResizeObserver(measure) : null;
		if (observer && menuRef.current) observer.observe(menuRef.current);
		window.addEventListener("resize", measure);
		return () => {
			cancelAnimationFrame(frameId);
			observer?.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [measure]);

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
		<div ref={shellRef} className="hidden h-[62px] xl:block">
			<div
				className={`z-40 isolate border-y border-white/10 bg-[#081711] text-white shadow-[0_16px_38px_-30px_rgba(8,23,17,0.72)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
					navMode === "static"
						? "relative"
						: navMode === "visible"
							? "fixed inset-x-0 top-0 translate-y-0"
							: "fixed inset-x-0 top-0 -translate-y-full"
				}`}
			>
				<div
					className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
					aria-hidden="true"
				>
					<div className="absolute inset-0 bg-[linear-gradient(180deg,_#0b1d15_0%,_#081711_58%,_#050907_100%)]" />
					<div className="absolute inset-0 bg-[url('/fondo.svg')] bg-repeat opacity-15 [background-position:center_top] [background-size:clamp(26rem,38vw,38rem)_clamp(26rem,38vw,38rem)] [filter:invert(1)_sepia(0.2)_saturate(0.45)_contrast(1.08)] [mix-blend-mode:soft-light]" />
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.08),_transparent_38%)]" />
				</div>
				<div
					ref={menuRef}
					className="relative z-10 mx-auto w-full max-w-8xl px-4"
				>
					<NavigationMenu
						className="mx-auto w-full max-w-none px-0"
						aria-label="Menú principal"
					>
						<NavigationMenuList className="h-[60px] w-full justify-center gap-0">
							{menu?.menuItems?.map((item: MenuItem, index) => {
								const hasChildren = Boolean(item.item?.length);
								const columns = hasChildren ? columnCount(item.item.length) : 1;
								const rows = hasChildren
									? Math.ceil(item.item.length / columns)
									: 1;
								const layout = layouts[String(item.id)];
								const style = hasChildren
									? ({
											"--mega-menu-left": `${layout?.left ?? EDGE_PADDING}px`,
											"--mega-menu-width": `${layout?.width ?? columns * COLUMN_WIDTH}px`,
										} as CSSProperties)
									: undefined;
								return (
									<NavigationMenuItem
										key={item.id}
										className="flex h-full justify-center"
									>
										{hasChildren ? (
											<>
												<NavigationMenuTrigger
													data-mega-menu-anchor={index}
													className={topLevelClass}
													onClick={() => {
														if (item.link?.url)
															window.location.href = rewriteUrl(
																item.link.url,
																lang,
															);
													}}
												>
													<Label
														label={item.link.label}
														badge={item.link.badge}
													/>
												</NavigationMenuTrigger>
												<NavigationMenuContent
													className="left-[var(--mega-menu-left)] right-auto mt-2 w-[var(--mega-menu-width)] max-w-[calc(100%-2rem)] rounded-none border-slate-200/90 bg-white shadow-[0_34px_90px_-54px_rgba(8,23,17,0.72)]"
													style={style}
												>
													<div className="bg-white px-6 pt-6 pb-3">
														<p className="inline-block border-b-2 border-primary pb-0.5 text-[12px] font-bold uppercase leading-none tracking-[0.24em] text-black">
															{item.link.label}
														</p>
													</div>
													<ul
														className="grid w-full grid-flow-col gap-x-4 gap-y-2 px-4 py-4"
														style={{
															gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
															gridTemplateRows: `repeat(${rows}, auto)`,
														}}
													>
														{item.item.map((subItem: Link) => (
															<li key={subItem.id} className="min-w-0">
																<NavigationMenuLink asChild variant="dropdown">
																	<a
																		href={rewriteUrl(subItem.url, lang)}
																		className="h-full overflow-hidden min-h-[50px] rounded-sm px-4 py-3 text-[15px] font-medium text-[#0b1511] before:pointer-events-none before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-secondary before:opacity-0 before:transition-opacity hover:bg-primary/[0.07] hover:text-primary group-hover:before:opacity-100 border-b border-dashed border-slate-200 hover:border-primary"
																	>
																		<span className="min-w-0 flex-1 whitespace-normal break-words leading-snug [overflow-wrap:anywhere]">
																			{subItem.label}
																		</span>
																		<ArrowUpRight
																			size={16}
																			aria-hidden="true"
																			className="ml-auto size-7 shrink-0 rounded-full border border-secondary/20 bg-white p-1.5 text-secondary opacity-0 transition-all group-hover:opacity-100"
																		/>
																		{subItem.badge ? (
																			<span className="shrink-0 rounded-sm bg-secondary px-3 py-1.5 text-[10px] text-white uppercase">
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
											<NavigationMenuLink asChild className={topLevelClass}>
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
