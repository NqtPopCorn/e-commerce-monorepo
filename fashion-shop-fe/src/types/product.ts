export interface ProductVariant {
  id?: number;
  productId?: number;
  sku?: string;
  barcode?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  imageUrl?: string;
  listPrice: number;
  sellingPrice: number;
  stock: number;
  weight?: number;
}

export interface ProductImage {
  id: number;
  productId?: number;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  _count?: {
    products?: number;
  };
}

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: Category | null;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  brandId?: number | null;
  brand?: Brand | null;
  categoryId?: number | null;
  category?: Category | null;
  material?: string | null;
  careInstructions?: string | null;
  season?: string | null;
  provider?: string | null;
  variants?: ProductVariant[];
  images?: ProductImage[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  title?: string;
}

export interface CreateProductVariantDto {
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  imageUrl?: string;
  listPrice: number;
  sellingPrice: number;
  stock?: number;
  weight?: number;
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string;
  brandId?: number;
  categoryId?: number;
  material?: string;
  careInstructions?: string;
  season?: string;
  provider?: string;
  variants?: CreateProductVariantDto[];
  images?: { url: string; altText?: string; sortOrder?: number }[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProductsResponse {
  data: Product[];
  meta: PaginationMeta;
}

export interface GetProductsParams {
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductStats {
  totalProducts: number;
  outOfStock: number;
  newThisWeek: number;
  totalStockValue: number;
}

