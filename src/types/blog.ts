import type { Imagen, SEO } from "./common";
import type { StrapiBlock } from "./page";

export interface CategoryBlog {
	id: number;
	documentId: string;
	nombre: string;
	slug: string;
	descripcion?: string;
	imagenDestacada: Imagen;
	seo?: SEO;
}

export interface Blog {
	id: number;
	documentId: string;
	titulo: string;
	slug: string;
	contenido: string | StrapiBlock[];
	portadaImage: Imagen;
	category_blogs: CategoryBlog[];
	seo?: SEO;
	publishedAt?: string;
	createdAt?: string;
}
