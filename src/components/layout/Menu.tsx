"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Languages,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

function MobileLanguageSwitcher({ currentLang }: { currentLang: Lang }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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
        aria-label="Cambiar idioma"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 min-w-[116px] items-center justify-between gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
      >
        <span className="inline-flex items-center gap-2">
          <Languages className="size-4 text-slate-600" aria-hidden="true" />
          <span>{languageNames[currentLang]}</span>
        </span>
        <ChevronDown
          className={`size-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[150px] overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg"
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
                <span>{languageNames[lang]}</span>
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const wasMobileOpenRef = useRef(false);

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
      <div className="hidden border-y border-border/70 bg-white shadow-[0_14px_38px_-34px_var(--foreground)] xl:block">
        <NavigationMenu className="w-full max-w-8xl mx-auto px-4 py-3">
          <NavigationMenuList className="w-full justify-center gap-3">
            {menu?.menuItems?.map((menuItem: MenuItem) => {
              const hasChildren =
                Array.isArray(menuItem.item) && menuItem.item.length > 0;

              return (
                <NavigationMenuItem
                  key={menuItem.id}
                  className="flex justify-center"
                >
                  {hasChildren ? (
                    <>
                      <NavigationMenuTrigger
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

                      <NavigationMenuContent>
                        <div className="px-6 pb-3 pt-5">
                          <p className="border-b border-border pb-3 text-base font-medium uppercase text-foreground/72">
                            <span className="inline-block border-b-2 border-secondary pb-3">
                              {menuItem.link.label}
                            </span>
                          </p>
                        </div>

                        <ul className="grid w-full grid-flow-col grid-rows-6 gap-x-8 px-6 pb-3">
                          {menuItem.item.map((subItem: Link) => (
                            <li key={subItem.id} className="border-b border-border">
                              <NavigationMenuLink asChild variant="dropdown">
                                <a
                                  href={rewriteUrl(subItem.url, lang)}
                                  className="py-3 pl-5 text-[15px]"
                                >
                                  <ChevronRight
                                    size={14}
                                    strokeWidth={2.2}
                                    className="pointer-events-none absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 opacity-0 text-primary transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus:translate-x-0 group-focus:opacity-100"
                                    aria-hidden="true"
                                    focusable="false"
                                  />
                                  <span className="min-w-0 whitespace-normal leading-snug">
                                    {subItem.label}
                                  </span>
                                  {subItem.badge ? (
                                    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-sm border border-secondary/20 bg-secondary px-2 py-0.5 text-[10px] font-semibold leading-none text-secondary-foreground">
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
                    <NavigationMenuLink asChild>
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

      {/* =======================
          MOBILE (< xl)
          ======================= */}
      <div className="relative xl:hidden">
        {/* Mobile Header: Logo, idioma y menu */}
        <div className="relative z-50 flex items-center gap-4 px-4 py-3 bg-background/95 backdrop-blur-md">
          <div className="flex min-w-0 shrink-0">
            <a href={logoUrl} className="block">
              <img
                src="/logo-dreamytours.svg"
                alt="Logo Dreamy Tours"
                className="h-10 w-auto"
                width="110"
                height="40"
                fetchPriority="high"
              />
            </a>
          </div>
          <div className="ml-auto flex items-center justify-end gap-2">
            {lang && <MobileLanguageSwitcher currentLang={lang} />}
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
          </div>
        </div>

        {/* Mobile menu dropdown and overlay */}
        {mobileOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-foreground/12 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            {/* Menu items */}
            <nav
              id="mobile-menu"
              ref={mobileMenuRef}
              className="absolute left-3 right-3 top-full z-50 mt-3 max-h-[calc(100dvh-92px)] overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-[0_24px_70px_-44px_var(--foreground)] animate-in fade-in slide-in-from-top-2 duration-300 ease-out"
              aria-label="Menú principal"
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
          </>
        )}
      </div>
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

  return (
    <div>
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

      {/* Submenu */}
      {open && (
        <ul className="mb-2 mt-1 flex animate-in fade-in slide-in-from-top-1 duration-200 flex-col gap-0.5 px-2">
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
      )}
    </div>
  );
}
