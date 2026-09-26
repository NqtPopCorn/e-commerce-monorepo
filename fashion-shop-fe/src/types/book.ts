export interface BookVariant {
  id?: number;
  sku?: string;
  isbn?: string;
  format: string;
  imageUrl?: string;
  listPrice: number;
  sellingPrice: number;
  stock: number;
  weight?: number;
  dimensions?: string;
  pages?: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  description?: string;
  authors?: string[];
  translators?: string[];
  publisher?: string | null;
  provider?: string | null;
  publishYear?: number | null;
  language?: string | null;
  variants?: BookVariant[];
  categories?: Category[];
  images?: { id: number; url: string }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateBookDto {
  title: string;
  description?: string;
  authors?: string[];
  translators?: string[];
  publisher?: string | null;
  provider?: string | null;
  publishYear?: number | null;
  language?: string | null;
  variants?: BookVariant[];
  categoryIds?: number[];
  imageUrls?: string[];
}

export interface UpdateBookDto extends Partial<CreateBookDto> {}
