import { Tooltip } from "radix-ui";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useMap } from "@/components/ui/map";
import "./tour-marker-tooltip.css";

/** Scoped to tour markers: no change to itinerary popups or generic map tooltips. */
export default function TourMarkerTooltip({
	children,
	label,
	disabled = false,
}: {
	children: ReactElement;
	label: string;
	disabled?: boolean;
}) {
	const { map } = useMap();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const cancelExit = () => clearTimeout(exitTimer.current);
	const scheduleExit = () => {
		cancelExit();
		// A single fast pointer jump can leave Radix's pointer grace area pending.
		// Allow transit onto the text, then close unless hover or keyboard focus remains.
		exitTimer.current = setTimeout(() => {
			if (
				!triggerRef.current?.matches(":hover, :focus-visible") &&
				!contentRef.current?.matches(":hover")
			)
				setOpen(false);
		}, 200);
	};
	useEffect(() => () => clearTimeout(exitTimer.current), []);
	useEffect(() => {
		if (disabled) setOpen(false);
	}, [disabled]);
	useEffect(() => {
		if (!map || !open) return;
		const close = () => setOpen(false);
		map.on("movestart", close);
		return () => {
			map.off("movestart", close);
		};
	}, [map, open]);
	return (
		<Tooltip.Provider delayDuration={150} skipDelayDuration={100}>
			<Tooltip.Root
				open={open && !disabled}
				onOpenChange={(value) => setOpen(!disabled && value)}
			>
				<Tooltip.Trigger
					asChild
					ref={triggerRef}
					onPointerEnter={cancelExit}
					onPointerLeave={scheduleExit}
				>
					{children}
				</Tooltip.Trigger>
				<Tooltip.Portal container={map?.getContainer()}>
					<Tooltip.Content
						ref={contentRef}
						onPointerEnter={cancelExit}
						onPointerLeave={scheduleExit}
						data-tour-marker-tooltip
						className="tour-marker-tooltip"
						side="top"
						sideOffset={8}
						collisionBoundary={map?.getContainer()}
						collisionPadding={12}
						avoidCollisions
						hideWhenDetached
					>
						{label}
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
}
