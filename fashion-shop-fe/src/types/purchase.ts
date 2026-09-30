import { PaginationMeta } from "./product";

export interface PurchaseReceiptItem {
  id: number;
  receiptId: number;
  variantId: number;
  quantity: number;
  costPrice: number;
  variant?: {
    id: number;
    sku: string;
    size?: string | null;
    color?: string | null;
    product?: {
      name: string;
      provider?: string | null;
    };
  };
}

export interface PurchaseReceipt {
  id: number;
  code: string;
  supplier: string;
  note?: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseReceiptItem[];
}

export interface CreatePurchaseItemDto {
  variantId: number;
  quantity: number;
  costPrice: number;
}

export interface CreatePurchaseDto {
  code?: string;
  supplier?: string;
  note?: string;
  items: CreatePurchaseItemDto[];
}

export interface PurchasesQuery {
  page?: number;
  limit?: number;
  search?: string;
  supplier?: string;
}

export interface PaginatedPurchases {
  data: PurchaseReceipt[];
  meta: PaginationMeta;
}

export interface PurchaseStats {
  totalPurchases: number;
  totalSpending: number;
  totalQuantity: number;
}
