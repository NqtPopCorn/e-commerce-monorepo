import { DiscountType } from "./discount";

export interface VoucherCampaign {
  id: number;
  name: string;
  description?: string | null;
  budgetLimit?: number | null;
  spentAmount?: number;
  startsAt: string;
  endsAt?: string | null;
}

export interface Voucher {
  id: number;
  campaignId?: number | null;
  campaign?: VoucherCampaign | null;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  maxUsesPerCustomer?: number | null;
  budgetLimit?: number | null;
  spentAmount?: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherDto {
  code: string;
  name: string;
  description?: string;
  campaignId?: number;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  budgetLimit?: number;
  startsAt: string;
  endsAt?: string;
  active?: boolean;
}

export interface UpdateVoucherDto extends Partial<CreateVoucherDto> {}

export interface VoucherQuery {
  campaignId?: number;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedVouchersResponse {
  data: Voucher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoucherCheckResponse {
  valid: boolean;
  voucher: {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountValue?: number | null;
    minOrderAmount?: number | null;
    campaignId?: number | null;
    campaignName?: string | null;
  };
}
