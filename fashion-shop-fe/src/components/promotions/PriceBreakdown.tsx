import React from "react";
import { AppliedPromotion, PromotionQuote } from "@/types/promotion";

interface PriceBreakdownProps {
  quote?: PromotionQuote;
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
    orderDiscount,
    voucherDiscount,
    total,
    applied,
  } = quote;
  const finalTotal = total + shippingFee;

  const campaignApps = applied.filter((a) => a.scope === "LINE");
  const autoApps = applied.filter((a) => a.scope === "ORDER");
  const voucherApps = applied.filter((a) => a.scope === "VOUCHER");

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
            <div>Ưu đãi sản phẩm</div>
            {campaignApps.length > 0 && (
              <div className="text-xs text-emerald-700/80 font-normal">
                {Array.from(new Set(campaignApps.map((a) => a.name))).join(
                  ", ",
                )}
              </div>
            )}
          </div>
          <span className="font-semibold">
            - {productDiscount.toLocaleString()}đ
          </span>
        </div>
      )}

      {/* 3. Khuyến mãi hóa đơn tự động */}
      {orderDiscount > 0 && (
        <div className="flex justify-between items-start text-emerald-600">
          <div>
            <div>Khuyến mãi hóa đơn tự động</div>
            {autoApps.length > 0 && (
              <div className="text-xs text-emerald-700/80 font-normal">
                {autoApps.map((a) => a.name).join(", ")}
              </div>
            )}
          </div>
          <span className="font-semibold">
            - {orderDiscount.toLocaleString()}đ
          </span>
        </div>
      )}

      {/* 4. Voucher */}
      {voucherDiscount > 0 && (
        <div className="flex justify-between items-start text-emerald-600">
          <div>
            <div>Voucher</div>
            {voucherApps.length > 0 && (
              <div className="text-xs text-emerald-700/80 font-normal">
                {voucherApps
                  .map((a) => (a.code ? `${a.name} (${a.code})` : a.name))
                  .join(", ")}
              </div>
            )}
          </div>
          <span className="font-semibold">
            - {voucherDiscount.toLocaleString()}đ
          </span>
        </div>
      )}

      {/* 5. Phí vận chuyển */}
      <div className="flex justify-between items-center">
        <span>Phí vận chuyển</span>
        <span className="font-medium text-slate-900">
          {shippingFee > 0 ? `${shippingFee.toLocaleString()}đ` : "Miễn phí"}
        </span>
      </div>

      {/* 6. Tổng cộng */}
      <div className="flex justify-between items-center border-t pt-3 text-base font-bold text-slate-900">
        <span>Tổng cộng</span>
        <span className="text-xl text-blue-600">
          {finalTotal.toLocaleString()}đ
        </span>
      </div>
    </div>
  );
}
