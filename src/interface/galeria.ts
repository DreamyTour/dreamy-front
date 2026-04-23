import type { Imagen } from "./common";

export interface GaleriaItem {
  id: number;
  attributes: {
    alt: string;
    imagen: Imagen[];
  };
}

export interface GaleriaResponse {
  data: {
    id: number;
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