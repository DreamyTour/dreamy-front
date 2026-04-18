import { DEFAULT_LANG } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export const ui = {
  es: {
    "tour.verItinerario": "Ver Itinerario",
    "blog.leerMas": "Leer más",
    "section.verMas": "Ver más",
    "section.verMasPaquetes": "Ver más Paquetes",
    "section.verTodoArticulos": "Ver todos los artículos",
    "aria.leerArticulo": "Leer artículo",
    "aria.verMasSeccion": "Ver más en esta sección",
    "section.premiosCertificaciones": "Premios y Certificaciones",
    "section.weArePartOf": "Somos Parte De",
    "section.sinTours": "Próximamente agregaremos tours en esta sección.",
  },
  en: {
    "tour.verItinerario": "View Itinerary",
    "blog.leerMas": "Read more",
    "section.verMas": "View more",
    "section.verMasPaquetes": "View more Packages",
    "section.verTodoArticulos": "View all Articles",
    "aria.leerArticulo": "Read article",
    "aria.verMasSeccion": "View more in this section",
    "section.premiosCertificaciones": "Awards and Certifications",
    "section.weArePartOf": "We Are Part Of",
    "section.sinTours": "Tours coming soon to this section.",
  },
  pt: {
    "tour.verItinerario": "Ver Itinerário",
    "blog.leerMas": "Leia mais",
    "section.verMas": "Ver mais",
    "section.verMasPaquetes": "Ver mais Pacotes",
    "section.verTodoArticulos": "Ver todos os Artigos",
    "aria.leerArticulo": "Ler artigo",
    "aria.verMasSeccion": "Ver mais nesta seção",
    "section.premiosCertificaciones": "Prêmios e Certificações",
    "section.weArePartOf": "Fazemos Parte De",
    "section.sinTours": "Em breve adicionaremos tours nesta seção.",
  },
} as const;

export function useTranslations(lang: Lang) {
  return function t(key: keyof typeof ui[typeof DEFAULT_LANG]) {
    return ui[lang][key] || ui[DEFAULT_LANG][key];
  };
}
