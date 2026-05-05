import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Tour } from "@/interface/tours";
import OverviewTab from "./OverviewTab";
import ItineraryTab from "./ItineraryTab";
import IncludedTab from "./IncludedTab";
import InformationTab from "./InformationTab";
import PriceTab from "./PriceTab";
import { OverviewIcon, ItineraryIcon, IncludedIcon, InformationIcon, PriceIcon } from "@/components/icons/TourIcons";
import { ChevronIcon } from "@/components/icons/NavigationIcons";

interface Props {
	tour: Tour;
	children?: React.ReactNode;
}

export default function TourTabs({ tour, children }: Props) {
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
	const visibleTabs = React.useMemo(
		() =>
			[
				hasOverview && "overview",
				hasItinerary && "itinerary",
				hasIncluded && "included",
				hasInformation && "information",
				hasPrice && "price",
			].filter(Boolean) as string[],
		[hasOverview, hasItinerary, hasIncluded, hasInformation, hasPrice],
	);
	const defaultActiveTab = visibleTabs[0] ?? "overview";
	const [activeTab, setActiveTab] = React.useState(defaultActiveTab);
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
		switch (type) {
			case "overview":
				return <OverviewIcon className="size-6 mb-2 transition-transform duration-300 group-hover:-translate-y-1" />;
			case "itinerary":
				return <ItineraryIcon className="size-6 mb-2 transition-transform duration-300 group-hover:-translate-y-1" />;
			case "included":
				return <IncludedIcon className="size-6 mb-2 transition-transform duration-300 group-hover:-translate-y-1" />;
			case "information":
				return <InformationIcon className="size-6 mb-2 transition-transform duration-300 group-hover:-translate-y-1" />;
			case "price":
				return <PriceIcon className="size-6 mb-2 transition-transform duration-300 group-hover:-translate-y-1" />;
			default:
				return null;
		}
	};

	const tabTriggerClass =
		"group relative flex-1 flex flex-col items-center justify-center py-6 md:py-4 text-[0.65rem] md:text-base font-bold uppercase tracking-widest text-[#333] hover:text-black hover:bg-white transition-colors duration-300 !rounded-none data-[state=active]:text-secondary data-[state=active]:!bg-white !bg-transparent whitespace-nowrap outline-none border-none !shadow-none ring-0 focus-visible:ring-0";

	return (
		<div className="w-full" ref={tabsRef}>
			{/* Desktop Layout */}
			<div className="hidden lg:flex flex-col">
				<div className="w-full">
					<Tabs
						value={activeTab}
						onValueChange={handleTabChange}
						className="w-full"
					>
						{/* Sticky container - Full Bleed */}
						<div
							className={`sticky top-0 z-30 w-full relative transition-shadow duration-300 bg-[#f8f9fa] border-y border-gray-200/60 ${isStuck ? "shadow-md" : ""}`}
						>
							<div className="w-full">
								<TabsList className="flex w-full justify-between items-stretch !p-0 !bg-transparent !rounded-none divide-x divide-gray-200/50 !h-auto gap-0 !border-0 outline-none ring-0">
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
								</TabsList>
							</div>
						</div>

						<div className="flex gap-8 mt-8 lg:mt-12">
							<div className="flex-1 w-full lg:w-[70%]">
								{hasOverview && (
									<TabsContent
										value="overview"
										className="outline-none animate-fade-in"
									>
										<section>
											<OverviewTab timeline={tab.overview.timeline} />
										</section>
									</TabsContent>
								)}

								{hasItinerary && (
									<TabsContent
										value="itinerary"
										className="outline-none animate-fade-in"
									>
										<section>
											<ItineraryTab items={tab.itinerary.acordeon} />
										</section>
									</TabsContent>
								)}

								{hasInformation && (
									<TabsContent
										value="information"
										className="outline-none animate-fade-in"
									>
										<section>
											<InformationTab items={tab.information.acordeon} />
										</section>
									</TabsContent>
								)}

								{hasIncluded && (
									<TabsContent
										value="included"
										className="outline-none animate-fade-in"
									>
										<section>
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
										<section>
											<div className="not-prose">
												<PriceTab contenido={tab.price.contenido} />
											</div>
										</section>
									</TabsContent>
								)}
							</div>

							{/* Aside: Booking / Contact Form */}
							{children && (
								<div
									id="tour-contact-form"
									className="hidden lg:block lg:w-[30%] shrink-0"
								>
									{children}
								</div>
							)}
						</div>
					</Tabs>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="lg:hidden space-y-4">
				{/* Summary */}
				{hasOverview && tab.overview.titulo && (
					<details
						open
						className="border border-gray-200 rounded-sm overflow-hidden group"
					>
						<summary className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer list-none">
							<span className="font-semibold text-gray-800">
								{tab.overview.titulo}
							</span>
							<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
								<ChevronIcon className="w-5 h-5" />
							</span>
						</summary>
						<div className="px-4 pt-4 pb-4 bg-white">
							<OverviewTab timeline={tab.overview.timeline} />
						</div>
					</details>
				)}

				{/* Itinerary */}
				{hasItinerary && tab.itinerary.titulo && (
					<details
						open={!hasOverview}
						className="border border-gray-200 rounded-sm overflow-hidden group"
					>
						<summary className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer list-none">
							<span className="font-semibold text-gray-800">
								{tab.itinerary.titulo}
							</span>
							<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
								<ChevronIcon className="w-5 h-5" />
							</span>
						</summary>
						<div className="px-4 pt-4 pb-4 bg-white">
							<ItineraryTab items={tab.itinerary.acordeon} />
						</div>
					</details>
				)}

				{/* Included */}
				{hasIncluded && tab.included.titulo && (
					<details className="border border-gray-200 rounded-sm overflow-hidden group">
						<summary className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer list-none">
							<span className="font-semibold text-gray-800">
								{tab.included.titulo}
							</span>
							<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
								<ChevronIcon className="w-5 h-5" />
							</span>
						</summary>
						<div className="px-4 pt-4 pb-4 bg-white">
							<IncludedTab contenido={tab.included.contenido} />
						</div>
					</details>
				)}

				{/* Information */}
				{hasInformation && tab.information.titulo && (
					<details className="border border-gray-200 rounded-sm overflow-hidden group">
						<summary className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer list-none">
							<span className="font-semibold text-gray-800">
								{tab.information.titulo}
							</span>
							<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
								<ChevronIcon className="w-5 h-5" />
							</span>
						</summary>
						<div className="px-4 pt-4 pb-4 bg-white">
							<InformationTab items={tab.information.acordeon} />
						</div>
					</details>
				)}

				{/* Price */}
				{hasPrice && tab.price.titulo && (
					<details className="border border-gray-200 rounded-sm overflow-hidden group">
						<summary className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer list-none">
							<span className="font-semibold text-gray-800">
								{tab.price.titulo}
							</span>
							<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
								<ChevronIcon className="w-5 h-5" />
							</span>
						</summary>
						<div className="px-4 pt-4 pb-4 bg-white">
							<PriceTab contenido={tab.price.contenido} />
						</div>
					</details>
				)}

				{/* Mobile Booking / Contact */}
				{children && (
					<div id="tour-contact-form-mobile" className="mt-8">
						{children}
					</div>
				)}
			</div>
		</div>
	);
}
