import * as React from "react";
import { ChevronIcon } from "@/components/icons/NavigationIcons";
import {
	IncludedIcon,
	InformationIcon,
	ItineraryIcon,
	MapIcon,
	OverviewIcon,
	PriceIcon,
} from "@/components/icons/TourIcons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lang } from "@/lib/i18n";
import type { MapStop, Tour } from "@/types/tours";
import IncludedTab from "./IncludedTab";
import InformationTab from "./InformationTab";
import ItineraryTab from "./ItineraryTab";
import OverviewTab from "./OverviewTab";
import PriceTab from "./PriceTab";

function DeferredMapTab({
	lang,
	active,
	mapStops,
}: {
	lang: Lang;
	active: boolean;
	mapStops: MapStop[];
}) {
	const [Comp, setComp] = React.useState<React.ComponentType<{
		lang: Lang;
		mapStops: MapStop[];
	}> | null>(null);

	React.useEffect(() => {
		if (active && !Comp) {
			import("./MapTab").then((mod) => setComp(() => mod.default));
		}
	}, [active, Comp]);

	if (!active) return null;

	if (!Comp) {
		return <div className="min-h-[520px]" aria-hidden="true" />;
	}

	return <Comp lang={lang} mapStops={mapStops} />;
}
interface Props {
	tour: Tour;
	lang: Lang;
	children?: React.ReactNode;
}

export default function TourTabs({ tour, lang, children }: Props) {
	const tab = tour?.tab;

	const hasOverview = Boolean(
		tab?.overview?.titulo &&
			Array.isArray(tab.overview.timeline) &&
			tab.overview.timeline.length > 0,
	);
	const hasItinerary = Boolean(
		tab?.itinerary?.titulo &&
			Array.isArray(tab.itinerary.acordeon) &&
			tab.itinerary.acordeon.length > 0,
	);
	const hasIncluded = Boolean(tab?.included?.titulo);
	const hasInformation = Boolean(
		tab?.information?.titulo &&
			Array.isArray(tab.information.acordeon) &&
			tab.information.acordeon.length > 0,
	);
	const hasPrice = Boolean(
		tab?.price && (tab.price.titulo || tab.price.contenido),
	);
	const mapStops = Array.isArray(tab?.maps?.mapstops)
		? tab.maps.mapstops
		: [];
	const hasMaps = mapStops.length > 0;
	const mapsTitle = "Maps";
	const visibleTabs = React.useMemo(
		() =>
			[
				hasOverview && "overview",
				hasItinerary && "itinerary",
				hasIncluded && "included",
				hasInformation && "information",
				hasPrice && "price",
				hasMaps && "maps",
			].filter(Boolean) as string[],
		[hasOverview, hasItinerary, hasIncluded, hasInformation, hasPrice, hasMaps],
	);
	const defaultActiveTab = visibleTabs[0] ?? "overview";
	const [activeTab, setActiveTab] = React.useState(defaultActiveTab);
	const [isMapOpenMobile, setIsMapOpenMobile] = React.useState(false);
	const [isStuck, setIsStuck] = React.useState(false);

	const tabsRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!visibleTabs.includes(activeTab)) {
			setActiveTab(defaultActiveTab);
		}
	}, [activeTab, defaultActiveTab, visibleTabs]);

	React.useEffect(() => {
		let ticking = false;
		let lastScrollY = window.scrollY;

		const handleScroll = () => {
			if (!ticking && tabsRef.current) {
				ticking = true;
				requestAnimationFrame(() => {
					if (tabsRef.current) {
						const rect = tabsRef.current.getBoundingClientRect();
						const currentScrollY = window.scrollY;

						// Solo cambiar si hay una diferencia significativa de scroll
						const scrollDelta = Math.abs(currentScrollY - lastScrollY);

						// Usar threshold para evitar parpadeo en el límite
						const shouldBeStuck = rect.top <= -10;

						// Solo actualizar si hay scroll significativo o cambio de estado
						if (scrollDelta > 1 || isStuck !== shouldBeStuck) {
							setIsStuck(shouldBeStuck);
						}

						lastScrollY = currentScrollY;
					}
					ticking = false;
				});
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("resize", handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleScroll);
		};
	}, [isStuck]);

	if (!tab) {
		return null;
	}

	const handleTabChange = (value: string) => {
		setActiveTab(value);

		// Usar setTimeout para que se ejecute DESPUÉS del render del tab
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (tabsRef.current) {
					tabsRef.current.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				}
			});
		});
	};

	// Iconos simples para las pestañas
	const renderIcon = (type: string) => {
		const iconClass =
			"size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 md:size-6";

		switch (type) {
			case "overview":
				return <OverviewIcon className={iconClass} />;
			case "itinerary":
				return <ItineraryIcon className={iconClass} />;
			case "included":
				return <IncludedIcon className={iconClass} />;
			case "information":
				return <InformationIcon className={iconClass} />;
			case "price":
				return <PriceIcon className={iconClass} />;
			case "maps":
				return <MapIcon className={iconClass} />;
			default:
				return null;
		}
	};

	const tabTriggerClass =
		"tour-tab-trigger group relative flex-1 flex flex-col items-center justify-center gap-2 rounded-sm bg-transparent px-4 pb-5 pt-4 text-[0.65rem] md:text-sm font-bold uppercase tracking-[0.12em] text-[#333] transition-colors duration-300 whitespace-nowrap outline-none border-none !shadow-none ring-0 focus-visible:ring-0";
	const mobileAccordionClass =
		"group overflow-hidden rounded-sm border border-border/80 bg-background shadow-[0_22px_50px_-38px_color-mix(in_oklab,var(--foreground)_24%,transparent)]";
	const mobileSummaryClass =
		"flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 transition-colors duration-200 hover:bg-primary/[0.03] [&::-webkit-details-marker]:hidden";
	const mobileIconClass =
		"flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-primary/10 bg-primary/[0.06] text-primary";
	const mobileContentClass =
		"border-t border-primary/10 px-4 py-4 bg-background";
	const tabPanelTitleClass = "sr-only";

	return (
		<div className="w-full" ref={tabsRef}>
			<style>{`
        .tour-tabs-list .tour-tab-trigger::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 0.4rem;
          width: 0;
          height: 2px;
          border-radius: 999px;
          background: var(--secondary);
          opacity: 0;
          transform: translateX(-50%);
          transition:
            width 220ms ease,
            opacity 220ms ease;
        }

        .tour-tabs-list .tour-tab-trigger:hover {
          background: var(--background);
          color: var(--foreground);
        }

        .tour-tabs-list .tour-tab-trigger:hover::after {
          width: min(3.5rem, calc(100% - 2rem));
          opacity: 1;
        }

        .tour-tabs-list .tour-tab-trigger[data-state="active"] {
          background: transparent !important;
          color: var(--secondary) !important;
        }

        .tour-tabs-list .tour-tab-trigger[data-state="active"]::after {
          width: min(4rem, calc(100% - 2rem));
          opacity: 1;
        }

        .tour-tabs-list .tour-tab-trigger[data-state="active"]:hover {
          background: transparent !important;
          color: var(--secondary) !important;
        }
      `}</style>
			<div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,30%)] lg:gap-8">
				{/* Desktop Layout */}
				<div className="hidden lg:contents">
					<Tabs
						value={activeTab}
						onValueChange={handleTabChange}
						className="contents"
					>
						{/* Sticky container - Full Bleed */}
						<div
							className={`sticky top-0 z-30 w-full relative transition-shadow duration-300 bg-[#f8f9fa] lg:col-span-2 ${isStuck ? "shadow-md" : ""}`}
						>
							<div className="w-full">
								<TabsList className="tour-tabs-list flex !h-auto w-full items-stretch justify-between gap-1 rounded-sm bg-muted/70 p-1.5 outline-none ring-0">
									{hasOverview && tab.overview.titulo && (
										<TabsTrigger value="overview" className={tabTriggerClass}>
											{renderIcon("overview")}
											{tab.overview.titulo}
										</TabsTrigger>
									)}
									{hasItinerary && tab.itinerary.titulo && (
										<TabsTrigger value="itinerary" className={tabTriggerClass}>
											{renderIcon("itinerary")}
											{tab.itinerary.titulo}
										</TabsTrigger>
									)}
									{hasIncluded && tab.included.titulo && (
										<TabsTrigger value="included" className={tabTriggerClass}>
											{renderIcon("included")}
											{tab.included.titulo}
										</TabsTrigger>
									)}
									{hasInformation && tab.information.titulo && (
										<TabsTrigger
											value="information"
											className={tabTriggerClass}
										>
											{renderIcon("information")}
											{tab.information.titulo}
										</TabsTrigger>
									)}
									{hasPrice && tab.price.titulo && (
										<TabsTrigger value="price" className={tabTriggerClass}>
											{renderIcon("price")}
											{tab.price.titulo}
										</TabsTrigger>
									)}
									{hasMaps && (
										<TabsTrigger value="maps" className={tabTriggerClass}>
											{renderIcon("maps")}
											{mapsTitle}
										</TabsTrigger>
									)}
								</TabsList>
							</div>
						</div>

						<div className="mt-8 min-w-0 lg:mt-12">
							{hasOverview && (
								<TabsContent
									value="overview"
									className="outline-none animate-fade-in"
								>
									<section aria-labelledby="tour-overview-title">
										<h2 id="tour-overview-title" className={tabPanelTitleClass}>
											{tab.overview.titulo}
										</h2>
										<OverviewTab timeline={tab.overview.timeline} />
									</section>
								</TabsContent>
							)}

							{hasItinerary && (
								<TabsContent
									value="itinerary"
									className="outline-none animate-fade-in"
								>
									<section aria-labelledby="tour-itinerary-title">
										<h2
											id="tour-itinerary-title"
											className={tabPanelTitleClass}
										>
											{tab.itinerary.titulo}
										</h2>
										<ItineraryTab items={tab.itinerary.acordeon} lang={lang} />
									</section>
								</TabsContent>
							)}

							{hasInformation && (
								<TabsContent
									value="information"
									className="outline-none animate-fade-in"
								>
									<section aria-labelledby="tour-information-title">
										<h2
											id="tour-information-title"
											className={tabPanelTitleClass}
										>
											{tab.information.titulo}
										</h2>
										<InformationTab items={tab.information.acordeon} />
									</section>
								</TabsContent>
							)}

							{hasIncluded && (
								<TabsContent
									value="included"
									className="outline-none animate-fade-in"
								>
									<section aria-labelledby="tour-included-title">
										<h2 id="tour-included-title" className={tabPanelTitleClass}>
											{tab.included.titulo}
										</h2>
										<div className="not-prose">
											<IncludedTab contenido={tab.included.contenido} />
										</div>
									</section>
								</TabsContent>
							)}

							{hasPrice && (
								<TabsContent
									value="price"
									className="outline-none animate-fade-in"
								>
									<section aria-labelledby="tour-price-title">
										<h2 id="tour-price-title" className={tabPanelTitleClass}>
											{tab.price.titulo}
										</h2>
										<div className="not-prose">
											<PriceTab contenido={tab.price.contenido} />
										</div>
									</section>
								</TabsContent>
							)}

							{hasMaps && (
								<TabsContent
									value="maps"
									className="outline-none animate-fade-in"
								>
									<section aria-labelledby="tour-maps-title">
										<h2 id="tour-maps-title" className={tabPanelTitleClass}>
											{mapsTitle}
										</h2>
										<DeferredMapTab
											lang={lang}
											active={activeTab === "maps"}
											mapStops={mapStops}
										/>
									</section>
								</TabsContent>
							)}
						</div>
					</Tabs>
				</div>

				{/* Mobile Layout */}
				<div className="space-y-4 lg:hidden">
					{/* Summary */}
					{hasOverview && tab.overview.titulo && (
						<details open className={mobileAccordionClass}>
							<summary className={mobileSummaryClass}>
								<span className="text-left text-sm font-semibold text-foreground">
									{tab.overview.titulo}
								</span>
								<span className={mobileIconClass}>
									<ChevronIcon className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<div className={mobileContentClass}>
								<h2 className={tabPanelTitleClass}>{tab.overview.titulo}</h2>
								<OverviewTab timeline={tab.overview.timeline} />
							</div>
						</details>
					)}

					{/* Itinerary */}
					{hasItinerary && tab.itinerary.titulo && (
						<details open={!hasOverview} className={mobileAccordionClass}>
							<summary className={mobileSummaryClass}>
								<span className="text-left text-sm font-semibold text-foreground">
									{tab.itinerary.titulo}
								</span>
								<span className={mobileIconClass}>
									<ChevronIcon className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<div className={mobileContentClass}>
								<h2 className={tabPanelTitleClass}>{tab.itinerary.titulo}</h2>
								<ItineraryTab items={tab.itinerary.acordeon} lang={lang} />
							</div>
						</details>
					)}

					{/* Included */}
					{hasIncluded && tab.included.titulo && (
						<details className={mobileAccordionClass}>
							<summary className={mobileSummaryClass}>
								<span className="text-left text-sm font-semibold text-foreground">
									{tab.included.titulo}
								</span>
								<span className={mobileIconClass}>
									<ChevronIcon className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<div className={mobileContentClass}>
								<h2 className={tabPanelTitleClass}>{tab.included.titulo}</h2>
								<IncludedTab contenido={tab.included.contenido} />
							</div>
						</details>
					)}

					{/* Information */}
					{hasInformation && tab.information.titulo && (
						<details className={mobileAccordionClass}>
							<summary className={mobileSummaryClass}>
								<span className="text-left text-sm font-semibold text-foreground">
									{tab.information.titulo}
								</span>
								<span className={mobileIconClass}>
									<ChevronIcon className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<div className={mobileContentClass}>
								<h2 className={tabPanelTitleClass}>{tab.information.titulo}</h2>
								<InformationTab items={tab.information.acordeon} />
							</div>
						</details>
					)}

					{/* Price */}
					{hasPrice && tab.price.titulo && (
						<details className={mobileAccordionClass}>
							<summary className={mobileSummaryClass}>
								<span className="text-left text-sm font-semibold text-foreground">
									{tab.price.titulo}
								</span>
								<span className={mobileIconClass}>
									<ChevronIcon className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<div className={mobileContentClass}>
								<h2 className={tabPanelTitleClass}>{tab.price.titulo}</h2>
								<PriceTab contenido={tab.price.contenido} />
							</div>
						</details>
					)}

					{hasMaps && (
						<details
							className={mobileAccordionClass}
							onToggle={(event) => setIsMapOpenMobile(event.currentTarget.open)}
						>
							<summary className={mobileSummaryClass}>
								<span className="text-left text-sm font-semibold text-foreground">
									{mapsTitle}
								</span>
								<span className={mobileIconClass}>
									<ChevronIcon className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
								</span>
							</summary>
							<div className={mobileContentClass}>
								<h2 className={tabPanelTitleClass}>{mapsTitle}</h2>
								<DeferredMapTab
									lang={lang}
									active={isMapOpenMobile}
									mapStops={mapStops}
								/>
							</div>
						</details>
					)}
				</div>

				{/* Booking / Contact Form */}
				{children && (
					<aside
						id="tour-contact-form"
						aria-label="Reserva y contacto"
						className="mt-8 min-w-0 scroll-mt-28 lg:mt-12 lg:self-start"
					>
						{children}
					</aside>
				)}
			</div>
		</div>
	);
}
