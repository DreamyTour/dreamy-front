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
	locale?: string;
	selectorTours?: TourSelector | null;
	informacionUtil?: UsefulInfo | null;
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

export interface CategoryTourRelation {
	documentId: string;
	titulo: string;
	slug: string;
	locale: string;
}

export interface TourRecommendation {
	etiqueta?: string | null;
	titulo?: string | null;
	descripcion?: string | null;
	/** One profile per line; icons are assigned by the frontend. */
	idealPara?: string | null;
	tour?: CategoryTourRelation | null;
}

export interface TourSelector {
	titulo?: string | null;
	descripcion?: string | null;
	recomendaciones?: TourRecommendation[] | null;
}

export interface UsefulInfoItem {
	etiqueta?: string | null;
	titulo?: string | null;
	contenido?: StrapiBlock[] | null;
}

export interface UsefulInfo {
	titulo?: string | null;
	descripcion?: string | null;
	items?: UsefulInfoItem[] | null;
}
