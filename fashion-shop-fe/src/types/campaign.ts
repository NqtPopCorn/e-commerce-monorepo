export type CampaignStatus = "SCHEDULED" | "ACTIVE" | "ENDED";

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  budgetLimit?: number | null;
  spentAmount: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    discounts: number;
    vouchers: number;
  };
  discounts?: any[];
  vouchers?: any[];
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  budgetLimit?: number;
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {}

export interface CampaignQuery {
  search?: string;
  status?: CampaignStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startsAt" | "endsAt" | "name" | "spentAmount";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCampaignsResponse {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopProductStat {
  productId?: number;
  productName: string;
  sku: string;
  appliedCount: number;
  totalDiscount: number;
  totalQuantity: number;
}

export interface CampaignStatsSummary {
  totalDiscounts: number;
  activeDiscounts: number;
  totalVouchers: number;
  activeVouchers: number;
  discountApplicationsCount: number;
  voucherApplicationsCount: number;
  totalApplicationsCount: number;
  totalDiscountAmount: number;
  totalOrdersImpacted: number;
  uniqueCustomerCount: number;
  totalOrderRevenue: number;
}

export interface CampaignStatsResponse {
  campaign: {
    id: number;
    name: string;
    description?: string | null;
    startsAt: string;
    endsAt?: string | null;
    budgetLimit: number | null;
    spentAmount: number;
    remainingBudget: number | null;
    percentSpent: number | null;
    status: CampaignStatus;
  };
  summary: CampaignStatsSummary;
  topProducts: TopProductStat[];
  discounts: Array<{
    id: number;
    name: string;
    active: boolean;
    spentAmount: number;
    budgetLimit: number | null;
    usedCount: number;
    maxUses: number | null;
    startsAt: string;
    endsAt: string | null;
    groups?: any[];
  }>;
  vouchers: Array<{
    id: number;
    code: string;
    name: string;
    active: boolean;
    discountType: string;
    discountValue: number;
    maxDiscountValue: number | null;
    spentAmount: number;
    budgetLimit: number | null;
    usedCount: number;
    maxUses: number | null;
    startsAt: string;
    endsAt: string | null;
  }>;
}
