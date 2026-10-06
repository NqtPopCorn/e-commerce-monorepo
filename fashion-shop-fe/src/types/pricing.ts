export interface CartItemInput {
  variantId: number;
  quantity: number;
}

export interface QuoteRequest {
  items: CartItemInput[];
  voucherCode?: string;
}

export interface QuoteLine {
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
}

export interface AppliedDiscount {
  discountId: number;
  discountName: string;
  groupId: number;
  variantId: number;
  discountAmount: number;
}

export interface AppliedVoucher {
  voucherId: number;
  voucherCode: string;
  voucherName: string;
  discountAmount: number;
}

export interface OrderQuote {
  lines: QuoteLine[];
  subtotal: number;
  productDiscount: number;
  voucherDiscount: number;
  total: number;
  appliedDiscounts: AppliedDiscount[];
  appliedVoucher?: AppliedVoucher;
  voucherError?: string;
}
