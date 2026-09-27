export interface CreateBatchDto {
  code: string;
  variantId: number;
  quantity: number;
}

export interface Batch {
  id: number;
  code: string;
  quantity: number;
  variantId: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  variant?: {
    sku: string;
    product?: {
      name: string;
    };
  };
}
