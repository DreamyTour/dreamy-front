import type { Imagen, SEO } from "./common";

// Tipo para bloques de Strapi v5
export interface StrapiBlock {
	type: string;
	version?: number;
	children?: StrapiBlockChild[];
	[key: string]: unknown;
}

export interface StrapiBlockChild {
	type: string;
	text?: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	code?: string;
	url?: string;
	children?: StrapiBlockChild[];
}

export interface Badge {
	titulo: string;
	content: string;
	icono: Imagen;
}

export interface Timeline {
	day: string;
	titulo: string;
	itemsDay: string;
}
export interface Acordeon {
	titulo: string;
	contenido: StrapiBlock[];
}

export interface Overview {
	titulo: string;
	timeline: Timeline[];
}
export interface Itinerary {
	titulo: string;
	acordeon: Acordeon[];
}
export interface Included {
	titulo: string;
	contenido: StrapiBlock[];
}
export interface Information {
	titulo: string;
	acordeon: Acordeon[];
}
export interface Price {
	titulo: string;
	contenido: StrapiBlock[]; // blocks ( Strapi v5)
}

export interface Tab {
	overview: Overview;
	itinerary: Itinerary;
	included: Included;
	information: Information;
	price: Price;
}

export interface Category {
	id: number;
	nombre: string;
	slug: string;
}

export interface Tour {
	id: number;
	documentId: string;
	titulo: string;
	content: string;
	slug: string;
	priceTour?: number;
	imagenDestacada: Imagen[];
	badge: Badge[];
	tab: Tab;
	categories: Category[];
	seo?: SEO;
}
