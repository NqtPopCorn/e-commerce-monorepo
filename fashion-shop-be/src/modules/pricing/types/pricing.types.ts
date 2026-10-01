export type PricingItem = {
  variantId: number;
  quantity: number;
};

export type QuoteLine = {
  variantId: number;
  quantity: number;
  originalUnitPrice: number;
  productDiscount: number;
  finalUnitPrice: number;
  discount?: {
    id: number;
    name: string;
    groupId: number;
  };
};

export type AppliedDiscount = {
  discountId: number;
  discountName: string;
  groupId: number;
  variantId: number;
  discountAmount: number;
};

export type AppliedVoucher = {
  voucherId: number;
  voucherCode: string;
  voucherName: string;
  discountAmount: number;
};

export type OrderQuote = {
  lines: QuoteLine[];
  subtotal: number;
  productDiscount: number;
  voucherDiscount: number;
  total: number;
  appliedDiscounts: AppliedDiscount[];
  appliedVoucher?: AppliedVoucher;
  voucherError?: string;
};
