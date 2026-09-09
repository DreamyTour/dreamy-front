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
	"group relative inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent bg-transparent px-4 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#16241d] transition-[background-color,color,border-color,box-shadow] duration-200 hover:border-primary/10 hover:bg-primary/[0.055] hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[state=open]:border-primary/10 data-[state=open]:bg-primary/[0.07] data-[state=open]:text-primary xl:px-5",
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
				className="ml-0.5 size-3.5 text-current opacity-55 transition-all duration-200 group-hover:translate-y-0.5 group-hover:opacity-90 group-data-[state=open]:rotate-180 group-data-[state=open]:opacity-90"
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
	"absolute left-0 right-0 top-full z-50 w-full overflow-hidden rounded-2xl border border-[#dce8df] bg-white p-0 shadow-[0_28px_76px_-54px_rgba(8,23,17,0.85)]";

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
	"text-[#16241d] transition-colors duration-200 focus:outline-none",
	{
		variants: {
			variant: {
				default:
					"relative inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-transparent px-4 text-[11px] font-semibold uppercase tracking-[0.13em] transition-[background-color,color,border-color,box-shadow] duration-200 hover:border-primary/10 hover:bg-primary/[0.055] hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white xl:px-5",
				dropdown:
					"group relative flex min-w-0 items-center justify-start gap-2 rounded-xl px-0 py-0 text-sm font-medium text-[#24362d]/72 transition-[background-color,color,transform] duration-200 hover:text-[#081711] focus:text-[#081711]",
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
