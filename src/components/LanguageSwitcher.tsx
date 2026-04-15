"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { LANGS, type Lang, localizePath, stripLangPrefix } from "@/lib/i18n";

const languageNames: Record<Lang, string> = {
  en: "Ingles",
  es: "Español",
  pt: "Portugues",
};

export function LanguageSwitcher({ currentLang }: { currentLang: Lang }) {
  const [value, setValue] = React.useState(currentLang);

  const handleValueChange = (val: string | null) => {
    if (!val || val === currentLang) return;

    setValue(val as Lang);

    const pathname = window.location.pathname;
    const normalizedPath = stripLangPrefix(pathname);

    // Buscar mapa de slugs para tours localizados
    const tourSlugMapEl = document.getElementById("tour-slug-map");
    if (tourSlugMapEl) {
      try {
        const slugMap: Record<string, string> = JSON.parse(
          tourSlugMapEl.textContent ?? "{}"
        );
        const targetSlug = slugMap[val];
        if (targetSlug) {
          window.location.href = localizePath(`/${targetSlug}`, val as Lang);
          return;
        }
      } catch { }
    }

    // Buscar mapa de slugs para páginas localizadas
    const pageSlugMapEl = document.getElementById("page-slug-map");
    if (pageSlugMapEl) {
      try {
        const slugMap: Record<string, string> = JSON.parse(
          pageSlugMapEl.textContent ?? "{}"
        );
        const targetSlug = slugMap[val];
        if (targetSlug) {
          window.location.href = localizePath(`/${targetSlug}`, val as Lang);
          return;
        }
      } catch { }
    }

    // Buscar mapa de slugs para posts del blog localizados
    const blogSlugMapEl = document.getElementById("blog-slug-map");
    if (blogSlugMapEl) {
      try {
        const slugMap: Record<string, string> = JSON.parse(
          blogSlugMapEl.textContent ?? "{}"
        );
        const targetSlug = slugMap[val];
        if (targetSlug) {
          const blogPath = normalizedPath.replace(
            /\/blog\/[^/]+$/,
            `/blog/${targetSlug}`,
          );
          window.location.href = localizePath(blogPath, val as Lang);
          return;
        }
      } catch { }
    }

    // Fallback: localiza la ruta actual sin asumir prefijo /en
    window.location.href = localizePath(normalizedPath, val as Lang);
  };

  return (
    <div className="w-30">
      <Combobox
        value={value}
        onValueChange={(val) => handleValueChange(val as string)}
        aria-label="Seleccionar idioma"
      >
        <ComboboxInput
          readOnly
          showTrigger
          showClear={false}
          value={languageNames[value as Lang]}
          className="cursor-pointer bg-white border shadow-sm"
          aria-label="Idioma actual"
        />
        <ComboboxContent align="end" sideOffset={4}>
          <ComboboxList>
            {LANGS.map((lang) => (
              <ComboboxItem key={lang} value={lang}>
                {languageNames[lang]}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
