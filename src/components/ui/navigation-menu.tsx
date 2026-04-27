import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";

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
	"group inline-flex h-9 items-center justify-center gap-2 rounded-md bg-background px-4 py-2 text-md font-medium text-foreground transition-colors duration-200 hover:text-primary focus:text-primary focus:outline-none",
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
	"absolute left-0 right-0 top-full z-50 mt-2 w-full rounded-md bg-white p-4 shadow-lg";

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
					"inline-flex items-center gap-2 px-4 py-2 text-base font-medium",
				dropdown:
					"group flex min-w-0 items-center gap-3 rounded-sm border border-transparent px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/10 hover:bg-primary/5 hover:text-primary hover:shadow-sm",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuTrigger,
	NavigationMenuContent,
	NavigationMenuLink,
	navigationMenuRootStyle,
	navigationMenuListStyle,
	navigationMenuItemStyle,
	navigationMenuContentStyle,
	navigationMenuTriggerStyle,
	navigationMenuLinkStyle,
};
