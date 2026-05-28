import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* ROOT                                                                       */
/* -------------------------------------------------------------------------- */

function NavigationMenu({
	className,
	children,
	viewport = false, // 👈 DESACTIVADO por defecto
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
	viewport?: boolean;
}) {
	return (
		<NavigationMenuPrimitive.Root
			data-slot="navigation-menu"
			data-viewport={viewport}
			className={cn(navigationMenuRootStyle, className)}
			{...props}
		>
			{children}
		</NavigationMenuPrimitive.Root>
	);
}

const navigationMenuRootStyle =
	"relative flex max-w-max flex-1 items-center justify-center";

/* -------------------------------------------------------------------------- */
/* LIST                                                                       */
/* -------------------------------------------------------------------------- */

function NavigationMenuList({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
	return (
		<NavigationMenuPrimitive.List
			data-slot="navigation-menu-list"
			className={cn(navigationMenuListStyle, className)}
			{...props}
		/>
	);
}

const navigationMenuListStyle = "flex list-none items-center gap-1";

/* -------------------------------------------------------------------------- */
/* ITEM                                                                       */
/* -------------------------------------------------------------------------- */

function NavigationMenuItem({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
	return (
		<NavigationMenuPrimitive.Item
			data-slot="navigation-menu-item"
			className={cn(navigationMenuItemStyle, className)}
			{...props}
		/>
	);
}

const navigationMenuItemStyle = "static";

/* -------------------------------------------------------------------------- */
/* TRIGGER                                                                    */
/* -------------------------------------------------------------------------- */

const navigationMenuTriggerStyle = cva(
	"group relative inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap bg-background px-3.5 pb-3 pt-2 text-sm font-semibold text-foreground/82 transition-colors duration-200 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-linear-to-r after:from-transparent after:via-primary after:to-transparent after:transition-transform after:duration-300 hover:text-primary hover:after:scale-x-100 focus:text-primary focus:outline-none data-[state=open]:text-primary data-[state=open]:after:scale-x-100 xl:px-4",
);

function NavigationMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
	return (
		<NavigationMenuPrimitive.Trigger
			data-slot="navigation-menu-trigger"
			className={cn(navigationMenuTriggerStyle(), className)}
			{...props}
		>
			{children}
			<ChevronDownIcon
				className="ml-1 size-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
				aria-hidden="true"
			/>
		</NavigationMenuPrimitive.Trigger>
	);
}

/* -------------------------------------------------------------------------- */
/* CONTENT (DROPDOWN)                                                         */
/* -------------------------------------------------------------------------- */

function NavigationMenuContent({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
	return (
		<NavigationMenuPrimitive.Content
			data-slot="navigation-menu-content"
			className={cn(
				navigationMenuContentStyle,

				// Animaciones suaves
				"data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out",
				"data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out",
				"data-[motion=from-start]:slide-in-from-left-2",
				"data-[motion=from-end]:slide-in-from-right-2",

				className,
			)}
			{...props}
		/>
	);
}

const navigationMenuContentStyle =
	"absolute left-0 right-0 top-full z-50 mt-3 w-full overflow-hidden rounded-2xl border border-border/80 bg-white p-0 shadow-[0_30px_90px_-56px_var(--foreground)]";

/* -------------------------------------------------------------------------- */
/* LINK                                                                       */
/* -------------------------------------------------------------------------- */

function NavigationMenuLink({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link> & {
	variant?: "default" | "dropdown";
}) {
	return (
		<NavigationMenuPrimitive.Link
			data-slot="navigation-menu-link"
			className={cn(navigationMenuLinkStyle({ variant }), className)}
			{...props}
		/>
	);
}

const navigationMenuLinkStyle = cva(
	"text-foreground/80 transition-colors duration-200 hover:text-primary focus:text-primary focus:outline-none",
	{
		variants: {
			variant: {
				default:
					"relative inline-flex h-11 items-center gap-2 whitespace-nowrap px-3.5 pb-3 pt-2 text-sm font-semibold after:pointer-events-none after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-linear-to-r after:from-transparent after:via-primary after:to-transparent after:transition-transform after:duration-300 hover:after:scale-x-100 xl:px-4",
				dropdown:
					"group relative flex min-w-0 items-start justify-between gap-3 rounded-none px-4 py-4 text-sm font-semibold text-foreground/78 transition-colors duration-200 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-border after:to-transparent hover:text-primary focus:text-primary",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuContentStyle,
	navigationMenuItemStyle,
	navigationMenuLinkStyle,
	navigationMenuListStyle,
	navigationMenuRootStyle,
	navigationMenuTriggerStyle,
};
