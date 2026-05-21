import type { Imagen, SEO } from "./common";
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
export interface Category {
	id: number;
	documentId: string;
	nombre: string;
	slug: string;
}

export interface Video {
	id: number;
	videoUrl: string;
	thumbnail: Imagen;
}
export interface Pregunta {
	titulo: string;
	contenido: StrapiBlock[];
}

export interface Page {
	documentId: string;
	titulo: string;
	video: Video;
	content: string;
	slug: string;
	categories: Category[];
	seo?: SEO;
	tituloPreguntas: string;
	preguntasAcordeon: Pregunta[];
}
