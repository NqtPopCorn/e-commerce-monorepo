export type OrderStatus =
  "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";

export type PaymentMethod = "COD" | "VIETQR" | "BANK_TRANSFER";

export type PaymentStatus =
  "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderDiscountApplication {
  id: number;
  orderId: number;
  orderItemId: number;
  discountId: number;
  discountName: string;
  discountAmount: number | string;
}

export interface OrderVoucherApplication {
  id: number;
  orderId: number;
  voucherId: number;
  voucherCode: string;
  voucherName: string;
  discountAmount: number | string;
}

export interface OrderPromotionApplication {
  id: number;
  orderId: number;
  orderItemId?: number | null;
  promotionId?: number;
  discountId?: number;
  voucherId?: number;
  scope?: "LINE" | "ORDER" | "VOUCHER" | string;
  promotionName?: string;
  discountName?: string;
  voucherName?: string;
  promotionCode?: string | null;
  voucherCode?: string | null;
  discountAmount: number | string;
}

export interface OrderItemVariantProduct {
  id: number;
  name: string;
  slug?: string;
  thumbnailUrl?: string;
  images?: string[];
}

export interface OrderItemVariant {
  id: number;
  sku: string;
  size?: string | null;
  color?: string | null;
  imageUrl?: string | null;
  product?: OrderItemVariantProduct;
  book?: {
    id: number;
    title: string;
    imageUrl?: string | null;
  };
}

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  quantity: number;
  originalUnitPrice: number | string;
  productDiscount: number | string;
  finalUnitPrice: number | string;
  unitPrice: number | string;
  variant?: OrderItemVariant;
  title?: string;
}

export interface OrderUser {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  recipientName?: string | null;
  recipientPhone?: string | null;
  shippingAddress?: string | null;
  shippingNote?: string | null;
  subtotal: number | string;
  productDiscount: number | string;
  orderDiscount?: number | string;
  voucherDiscount: number | string;
  total: number | string;
  paidAmount?: number;
  remainingAmount?: number;
  isPartialPaid?: boolean;
  transactions?: {
    id: number;
    amount: number | string;
    provider?: string;
    status: string;
    transactionCode?: string | null;
    providerTxnId?: string | null;
    metadata?: any;
    paidAt?: string | null;
    createdAt?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  user?: OrderUser;
  items?: OrderItem[];
  discountApplications?: OrderDiscountApplication[];
  voucherApplications?: OrderVoucherApplication[];
  promotionApplications?: OrderPromotionApplication[];
}

export interface CreateOrderParams {
  items: { variantId: number; quantity: number }[];
  voucherCode?: string;
  paymentMethod?: PaymentMethod;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  shippingNote?: string;
}

export interface UpdateOrderStatusParams {
  id: number;
  status?: OrderStatus | string;
  paymentStatus?: PaymentStatus | string;
}
