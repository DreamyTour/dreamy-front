import type { Imagen } from "./common";

export interface GaleriaItem {
  id: number;
  alt: string;
  imagen: Imagen[];
}

export interface GaleriaResponse {
  data: {
    id: number;
    documentId?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    locale: string;
    galeria: GaleriaItem[];
  }[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
