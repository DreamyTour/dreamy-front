/**
 * Interfaces reutilizables que mapean a componentes shared de Strapi.
 * Importar desde aquí en cualquier interfaz de página.
 */

/** shared.media — imagen / video genérico de Strapi */
export interface Imagen {
	id: number;
	name: string;
	alternativeText: string | null;
	url: string;
	width?: number;
	height?: number;
	formats?: Record<
		string,
		{
			url: string;
			width?: number;
			height?: number;
		}
	>;
}

/** shared.link — link reutilizable con opciones de botón */
export interface Link {
	id: number;
	label: string;
	url: string;
	isButton: boolean;
	isExternal: boolean;
	type?: "PRIMARY" | "SECONDARY";
	badge?: string;
}

/** shared.logo-link — logo con imagen y link */
export interface Logo {
	id: number;
	label: string;
	url: string;
	isExternal: boolean;
	imagen: Imagen;
}

/** shared.seo — metadatos SEO reutilizables de Strapi */
export interface SEO {
	metaTitle: string;
	metaDescription: string;
	metaImage?: Imagen | null;
	keywords?: string | null;
}

/** Wrapper genérico de respuesta de la API de Strapi */
export interface StrapiResponse<T> {
	data: T;
	meta: {
		pagination?: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
}
