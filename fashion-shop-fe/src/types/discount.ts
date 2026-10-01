export type DiscountType = "PERCENT" | "FIXED";

export interface DiscountVariant {
  groupId: number;
  variantId: number;
  variant?: {
    id: number;
    sku: string;
    sellingPrice: number | string;
    listPrice?: number | string;
    size?: string | null;
    color?: string | null;
    product?: { id: number; name: string };
  };
}

export interface DiscountGroup {
  id?: number;
  discountId?: number;
  name: string;
  sortOrder: number;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number | null;
  variants?: DiscountVariant[];
  variantIds?: number[];
}

export interface DiscountCampaign {
  id: number;
  name: string;
  description?: string | null;
  budgetLimit?: number | null;
  spentAmount?: number;
  startsAt: string;
  endsAt?: string | null;
}

export interface Discount {
  id: number;
  name: string;
  description?: string | null;
  campaignId?: number | null;
  campaign?: DiscountCampaign | null;
  priority: number;
  budgetLimit?: number | null;
  spentAmount?: number;
  maxUses?: number | null;
  usedCount: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
  groups?: DiscountGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscountGroupDto {
  name: string;
  sortOrder?: number;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  variantIds: number[];
}

export interface CreateDiscountDto {
  name: string;
  description?: string;
  campaignId?: number;
  priority?: number;
  budgetLimit?: number;
  maxUses?: number;
  startsAt: string;
  endsAt?: string;
  active?: boolean;
  groups: DiscountGroupDto[];
}

export interface UpdateDiscountDto extends Partial<CreateDiscountDto> {}

export interface DiscountQuery {
  campaignId?: number;
  active?: boolean;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDiscountsResponse {
  data: Discount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
