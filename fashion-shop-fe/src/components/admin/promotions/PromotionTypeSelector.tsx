"use client";

import React from "react";
import { Ticket, Zap, Tag, CheckCircle2 } from "lucide-react";
import { PromotionKind } from "@/types/promotion";
import { cn } from "@/lib/utils";

interface PromotionTypeSelectorProps {
  value: PromotionKind;
  onChange: (kind: PromotionKind) => void;
  disabled?: boolean;
}

interface TypeOption {
  kind: PromotionKind;
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    kind: "VOUCHER",
    title: "Voucher",
    badge: "Mã nhập tay",
    description: "Khách hàng nhập mã code khi thanh toán để nhận ưu đãi.",
    icon: Ticket,
  },
  {
    kind: "ORDER_AUTO",
    title: "Khuyến mãi tự động",
    badge: "Cấp hóa đơn",
    description: "Tự động áp dụng chiết khấu khi đơn hàng đạt đủ điều kiện.",
    icon: Zap,
  },
  {
    kind: "CAMPAIGN",
    title: "Campaign sản phẩm",
    badge: "Theo dòng SKU",
    description: "Chương trình giảm giá áp dụng riêng cho một nhóm sản phẩm.",
    icon: Tag,
  },
];

export function PromotionTypeSelector({
  value,
  onChange,
  disabled = false,
}: PromotionTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {TYPE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.kind;

        return (
          <button
            key={opt.kind}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.kind)}
            className={cn(
              "relative flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer select-none",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1",
              isSelected
                ? "border-rose-500 bg-rose-50/40 text-foreground ring-1 ring-rose-500/30 shadow-xs"
                : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    isSelected
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {opt.badge}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </div>
            </div>

            <div className="font-semibold text-sm text-foreground mb-1">
              {opt.title}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {opt.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
