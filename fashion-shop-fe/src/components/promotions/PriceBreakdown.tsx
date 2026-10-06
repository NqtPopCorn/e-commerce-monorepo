import React from "react";
import { OrderQuote } from "@/types/pricing";
import { PromotionQuote } from "@/types/promotion";

interface PriceBreakdownProps {
  quote?: OrderQuote | PromotionQuote;
  shippingFee?: number;
  isLoading?: boolean;
}

export function PriceBreakdown({
  quote,
  shippingFee = 0,
  isLoading = false,
}: PriceBreakdownProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2 text-sm text-slate-500 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  if (!quote) return null;

  const {
    subtotal,
    productDiscount,
    voucherDiscount,
    total,
  } = quote;
  const finalTotal = total + shippingFee;

  // Check appliedDiscounts or fallback to legacy applied
  const appliedDiscounts =
    "appliedDiscounts" in quote && Array.isArray(quote.appliedDiscounts)
      ? quote.appliedDiscounts
      : [];

  const appliedVoucher =
    "appliedVoucher" in quote ? quote.appliedVoucher : undefined;

  const discountNames =
    appliedDiscounts.length > 0
      ? Array.from(new Set(appliedDiscounts.map((a) => a.discountName))).join(", ")
      : "";

  const voucherLabel = appliedVoucher
    ? appliedVoucher.voucherCode
      ? `${appliedVoucher.voucherName} (${appliedVoucher.voucherCode})`
      : appliedVoucher.voucherName
    : "";

  return (
    <div className="space-y-3 py-3 border-t text-sm text-slate-700">
      {/* 1. Tạm tính */}
      <div className="flex justify-between items-center">
        <span>Tạm tính</span>
        <span className="font-medium text-slate-900">
          {subtotal.toLocaleString()}đ
        </span>
      </div>

      {/* 2. Ưu đãi sản phẩm */}
      {productDiscount > 0 && (
        <div className="flex justify-between items-start text-emerald-600">
          <div>
            <div>Tổng ưu đãi</div>
            {discountNames && (
              <div className="text-xs text-emerald-700/80 font-normal">
                {discountNames}
              </div>
            )}
          </div>
          <span className="font-semibold">
            - {productDiscount.toLocaleString()}đ
          </span>
        </div>
      )}

      {/* 3. Voucher */}
      {voucherDiscount > 0 && (
        <div className="flex justify-between items-start text-emerald-600">
          <div>
            <div>Voucher giảm giá</div>
            {voucherLabel && (
              <div className="text-xs text-emerald-700/80 font-normal">
                {voucherLabel}
              </div>
            )}
          </div>
          <span className="font-semibold">
            - {voucherDiscount.toLocaleString()}đ
          </span>
        </div>
      )}

      {/* 4. Phí vận chuyển */}
      <div className="flex justify-between items-center">
        <span>Phí vận chuyển</span>
        <span className="font-medium text-slate-900">
          {shippingFee > 0 ? `${shippingFee.toLocaleString()}đ` : "Miễn phí"}
        </span>
      </div>

      {/* 5. Tổng cộng */}
      <div className="flex justify-between items-center border-t pt-3 text-base font-bold text-slate-900">
        <span>Tổng cộng</span>
        <span className="text-xl text-blue-600">
          {finalTotal.toLocaleString()}đ
        </span>
      </div>
    </div>
  );
}
