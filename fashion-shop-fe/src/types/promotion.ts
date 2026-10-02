import { Campaign } from "./campaign";

export type PromotionApplicationType = "AUTO" | "VOUCHER";
export type PromotionKind = "VOUCHER" | "ORDER_AUTO" | "CAMPAIGN" | "AUTO";
export type DiscountType = "PERCENT" | "FIXED";
export type PromotionApplicationScope = "LINE" | "ORDER" | "VOUCHER";

export * from "./campaign";

export interface Voucher {
  id: number;
  promotionId: number;
  code: string;
  maxUses?: number | null;
  usedCount: number;
  maxUsesPerCustomer?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  maxDiscountValue?: number | null;
  variants?: PromotionVariant[];
  variantIds?: number[];
}

export interface Promotion {
  id: number;
  name: string;
  applicationType: PromotionApplicationType;
  kind?: PromotionKind;
  campaignId?: number | null;
  campaign?: Campaign | null;
  description?: string | null;
  code?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  maxDiscountValue?: number | null;
  minOrderAmount?: number | null;
  priority: number;
  budgetLimit?: number | null;
  spentAmount?: number;
  maxUses?: number | null;
  usedCount: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
  groups?: PromotionGroup[];
  vouchers?: Voucher[];
  createdAt: string;
  updatedAt: string;
}

export interface PromotionGroupDto {
  name: string;
  sortOrder: number;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  variantIds: number[];
}

export interface CreateVoucherDto {
  code: string;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
}

export interface CreatePromotionDto {
  name: string;
  applicationType?: PromotionApplicationType;
  kind?: PromotionKind;
  campaignId?: number;
  description?: string;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountValue?: number;
  minOrderAmount?: number;
  priority?: number;
  budgetLimit?: number;
  maxUses?: number;
  startsAt: string;
  endsAt?: string;
  active?: boolean;
  groups?: PromotionGroupDto[];
  vouchers?: CreateVoucherDto[];
}

export interface UpdatePromotionDto extends Partial<CreatePromotionDto> {}

import { PaginationMeta } from "./product";

export interface PromotionQuery {
  applicationType?: PromotionApplicationType;
  kind?: PromotionKind;
  campaignId?: number;
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

import { AppliedDiscount, AppliedVoucher } from "./pricing";

export * from "./discount";
export * from "./voucher";
export * from "./pricing";

export interface PromotionQuote {
  lines: QuoteLine[];
  subtotal: number;
  productDiscount: number;
  orderDiscount?: number;
  voucherDiscount: number;
  total: number;
  applied?: AppliedPromotion[];
  appliedDiscounts?: AppliedDiscount[];
  appliedVoucher?: AppliedVoucher;
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
