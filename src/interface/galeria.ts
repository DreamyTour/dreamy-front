import type { Imagen } from "./common";

export interface Galeria {
  id: number;
  attributes: {
    imagen: Imagen | null;
    alt: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface GaleriaResponse {
  data: Galeria[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}