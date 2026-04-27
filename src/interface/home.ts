/**
 * Interfaces para la página Home (singleType "home" en Strapi).
 */

import type { Imagen, Link, SEO } from "./common";

export interface Category {
	id: number;
	documentId: string;
	nombre: string;
	slug: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	locale: string;
}

/** section.hero — Hero principal de la página de inicio */
export interface Hero {
	id: number;
	titulo: string;
	contenido: string;
	badgeText: string;
	badgeIcon: Imagen | null;
	backgroundVideo: Imagen | null;
	button: Link[];
}
export interface About {
	id: number;
	titulo: string;
	content: string;
	imagen: Imagen | null;
}

export interface Premio {
	id: number;
	description: string;
	logo: Imagen;
}
export interface Certifications {
	id: number;
	premios: Premio[];
}

export interface SectionMapi {
	id: number;
	titulo: string;
	limit: number;
	category: Category;
}
export interface peruPaquetes {
	id: number;
	titulo: string;
	limit: number;
	category: Category;
}
export interface boliviaPaquetes {
	id: number;
	titulo: string;
	description: string;
	limit: number;
	category: Category;
}

export interface sectionCardPost {
	id: number;
	titulo: string;
	description: string;
	limit: number;
	blogs: Category;
}
/** Respuesta del singleType Home */
export interface Home {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	locale: string;
	hero: Hero;
	about: About;
	premios: Certifications;
	sectionMapi: SectionMapi;
	peruPaquetes: peruPaquetes;
	boliviaPaquetes: boliviaPaquetes;
	cardPost: sectionCardPost;
	seo?: SEO;
}
