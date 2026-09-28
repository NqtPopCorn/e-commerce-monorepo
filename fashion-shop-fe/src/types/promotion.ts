export type PromotionKind = "VOUCHER" | "ORDER_AUTO" | "CAMPAIGN";
export type DiscountType = "PERCENT" | "FIXED";
export type PromotionApplicationScope = "LINE" | "ORDER" | "VOUCHER";

export interface PromotionVariant {
  groupId: number;
  variantId: number;
  variant?: {
    id: number;
    sku: string;
    sellingPrice: number;
    product?: { id: number; name: string };
  };
}

export interface PromotionGroup {
  id?: number;
  promotionId?: number;
  name: string;
  sortOrder: number;
  discountType: DiscountType;
  discountValue: number;
  variants?: PromotionVariant[];
  variantIds?: number[];
}

export interface Promotion {
  id: number;
  name: string;
  kind: PromotionKind;
  code?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  minOrderAmount?: number | null;
  priority: number;
  maxUses?: number | null;
  usedCount: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
  groups?: PromotionGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface PromotionGroupDto {
  name: string;
  sortOrder: number;
  discountType: DiscountType;
  discountValue: number;
  variantIds: number[];
}

export interface CreatePromotionDto {
  name: string;
  kind: PromotionKind;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  priority?: number;
  maxUses?: number;
  startsAt: string;
  endsAt?: string;
  active?: boolean;
  groups?: PromotionGroupDto[];
}

export interface UpdatePromotionDto extends Partial<CreatePromotionDto> {}

import { PaginationMeta } from "./product";

export interface PromotionQuery {
  kind?: PromotionKind;
  active?: boolean;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPromotionsResponse {
  data: Promotion[];
  meta: PaginationMeta;
}

export interface CartInput {
  variantId: number;
  quantity: number;
}

export interface QuoteRequest {
  items: CartInput[];
  voucherCode?: string;
}

export interface QuoteLine {
  variantId: number;
  quantity: number;
  originalUnitPrice: number;
  productDiscount: number;
  finalUnitPrice: number;
  campaign?: { id: number; name: string; groupId: number };
}

export interface AppliedPromotion {
  id: number;
  name: string;
  code?: string;
  scope: PromotionApplicationScope;
  discountAmount: number;
}

export interface PromotionQuote {
  lines: QuoteLine[];
  subtotal: number;
  productDiscount: number;
  orderDiscount: number;
  voucherDiscount: number;
  total: number;
  applied: AppliedPromotion[];
  voucherError?: string;
}

export interface PromotionApplication {
  id: number;
  orderId: number;
  orderItemId?: number | null;
  promotionId: number;
  scope: PromotionApplicationScope;
  promotionName: string;
  promotionCode?: string | null;
  discountAmount: number;
}
