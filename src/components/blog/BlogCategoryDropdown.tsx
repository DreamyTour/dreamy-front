import {
  ChevronDownIcon,
  CircleSlash2Icon,
  ClipboardListIcon,
  CloudSunIcon,
  CompassIcon,
  FootprintsIcon,
  MapPinIcon,
  MountainIcon,
  TreesIcon,
  WavesIcon,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface BlogCategoryOption {
  slug: string;
  label: string;
  href: string;
  count: number;
  active: boolean;
}

interface Props {
  label: string;
  currentLabel: string;
  options: BlogCategoryOption[];
}

function getOptionIcon(slug: string): LucideIcon {
  const normalizedSlug = slug.toLowerCase();

  if (!normalizedSlug) return CircleSlash2Icon;
  if (/machu|picchu|monta|mountain/.test(normalizedSlug)) return MountainIcon;
  if (/trail|camino|trilha|trek|hike|walk/.test(normalizedSlug)) {
    return FootprintsIcon;
  }
  if (/cusco|pin|destino|destination|ubica|location/.test(normalizedSlug)) {
    return MapPinIcon;
  }
  if (/weather|clima|tiempo|cloud|nube/.test(normalizedSlug)) {
    return CloudSunIcon;
  }
  if (/lake|lago|titicaca|water|waves/.test(normalizedSlug)) return WavesIcon;
  if (/amazon|selva|jungle|tree|arbol|forest|floresta/.test(normalizedSlug)) {
    return TreesIcon;
  }
  if (/itinerar|map|plan|guia|guide|ruta|route/.test(normalizedSlug)) {
    return ClipboardListIcon;
  }

  return CompassIcon;
}

export default function BlogCategoryDropdown({
  label,
  currentLabel,
  options,
}: Props) {
  const currentOption = options.find((option) => option.active) ?? options[0];
  const CurrentIcon = getOptionIcon(currentOption?.slug ?? "");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group flex w-full items-center justify-between gap-3 rounded-xl border border-secondary/55 bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-[0_10px_26px_-18px_color-mix(in_oklab,var(--foreground)_45%,transparent)] outline-none transition duration-200 hover:border-secondary hover:bg-card hover:shadow-[0_14px_30px_-18px_color-mix(in_oklab,var(--secondary)_55%,transparent)] focus-visible:outline-none! focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--secondary)_32%,transparent)]! data-[state=open]:border-secondary data-[state=open]:bg-secondary/8 [&_svg]:size-4">
        <span className="flex min-w-0 items-center gap-2">
          <CurrentIcon aria-hidden="true" className="text-primary" />
          <span className="truncate">{currentLabel}</span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-(--radix-dropdown-menu-trigger-width) max-w-[calc(100vw-2rem)] border-0 bg-card p-2 shadow-xl [scrollbar-width:none] focus-visible:shadow-xl! focus-visible:outline-none! [&::-webkit-scrollbar]:hidden"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </DropdownMenuLabel>
          {options.map((option) => {
            const OptionIcon = getOptionIcon(option.slug);

            return (
              <DropdownMenuItem
                key={option.href}
                asChild
                className={cn(
                  "group my-0.5 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-secondary/8 hover:text-foreground focus:bg-secondary/8 focus:text-foreground focus-visible:outline-none! focus-visible:shadow-none! data-[highlighted]:bg-secondary/8 data-[highlighted]:text-foreground",
                  option.active
                    ? "bg-secondary font-semibold text-secondary-foreground shadow-[0_8px_20px_-12px_color-mix(in_oklab,var(--secondary)_70%,transparent)] hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground focus-visible:bg-secondary! focus-visible:text-secondary-foreground! data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground"
                    : "text-foreground/70 focus-visible:bg-secondary/8!",
                )}
              >
                <a
                  href={option.href}
                  aria-current={option.active ? "page" : undefined}
                >
                  <OptionIcon
                    aria-hidden="true"
                    className={cn(
                      "transition-colors",
                      option.active
                        ? "text-secondary-foreground"
                        : "text-primary group-hover:text-secondary group-focus:text-secondary group-data-[highlighted]:text-secondary",
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  <DropdownMenuShortcut
                    className={cn(
                      option.active && "text-secondary-foreground/75",
                    )}
                  >
                    {option.count}
                  </DropdownMenuShortcut>
                </a>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
