"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DiscountType,
  PromotionGroupDto,
  PromotionKind,
} from "@/types/promotion";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Ticket,
  Zap,
  Tag,
  Calendar,
  Coins,
  Percent,
  Layers,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionSummarySidebarProps {
  kind: PromotionKind;
  name: string;
  code?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  minOrderAmount?: number;
  startsAt: string;
  endsAt?: string;
  budgetLimit?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  groups?: PromotionGroupDto[];
  active: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
  onSubmit: () => void;
  onSaveDraft?: () => void;
}

export function PromotionSummarySidebar({
  kind,
  name,
  code,
  discountType,
  discountValue,
  maxDiscountValue,
  minOrderAmount,
  startsAt,
  endsAt,
  budgetLimit,
  maxUses,
  maxUsesPerCustomer,
  groups = [],
  active,
  isLoading = false,
  isEditMode = false,
  onSubmit,
  onSaveDraft,
}: PromotionSummarySidebarProps) {
  // Compute timeline status
  const now = new Date();
  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt ? new Date(endsAt) : null;

  let timeStatus: { label: string; color: string; icon: React.ElementType } = {
    label: "Đang hoạt động",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  };

  if (startDate && startDate > now) {
    timeStatus = {
      label: "Chưa bắt đầu",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    };
  } else if (endDate && endDate < now) {
    timeStatus = {
      label: "Đã kết thúc",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: AlertTriangle,
    };
  }

  // Discount text
  let discountText = "-";
  if (kind === "CAMPAIGN") {
    const totalVariants = groups.reduce(
      (sum, g) => sum + (g.variantIds?.length || 0),
      0,
    );
    discountText = `${groups.length} nhóm SKU (${totalVariants} SKU)`;
  } else if (discountType === "PERCENT") {
    discountText = `Giảm ${discountValue || 0}%`;
    if (maxDiscountValue && maxDiscountValue > 0) {
      discountText += ` (Tối đa ${formatCurrency(maxDiscountValue)})`;
    }
  } else {
    discountText = `Giảm ${formatCurrency(discountValue || 0)}`;
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden w-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tóm tắt cấu hình
          </div>
          <div className="text-sm font-bold text-foreground mt-0.5 truncate max-w-[180px]">
            {name.trim() || "(Chưa nhập tên)"}
          </div>
        </div>

        {/* Kind badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
            kind === "VOUCHER" &&
              "bg-purple-50 text-purple-700 border-purple-200",
            kind === "ORDER_AUTO" && "bg-sky-50 text-sky-700 border-sky-200",
            kind === "CAMPAIGN" &&
              "bg-indigo-50 text-indigo-700 border-indigo-200",
          )}
        >
          {kind === "VOUCHER" && <Ticket className="w-3 h-3 text-purple-600" />}
          {kind === "ORDER_AUTO" && <Zap className="w-3 h-3 text-sky-600" />}
          {kind === "CAMPAIGN" && <Tag className="w-3 h-3 text-indigo-600" />}
          <span>
            {kind === "VOUCHER"
              ? "Voucher"
              : kind === "ORDER_AUTO"
                ? "Tự động đơn"
                : "Campaign SP"}
          </span>
        </span>
      </div>

      {/* Body details */}
      <div className="p-4 space-y-3.5 text-xs">
        {/* Voucher code if applicable */}
        {kind === "VOUCHER" && (
          <div className="flex items-center justify-between py-1.5 border-b border-border/60">
            <span className="text-muted-foreground font-medium">
              Mã Voucher
            </span>
            <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
              {code?.trim() || "(Chưa có mã)"}
            </span>
          </div>
        )}

        {/* Mức ưu đãi */}
        <div className="flex items-start justify-between py-1.5 border-b border-border/60 gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium shrink-0">
            <Percent className="w-3.5 h-3.5 text-rose-500" />
            <span>Mức ưu đãi</span>
          </div>
          <span className="font-semibold text-foreground text-right">
            {discountText}
          </span>
        </div>

        {/* Đơn tối thiểu */}
        {kind !== "CAMPAIGN" && (
          <div className="flex items-center justify-between py-1.5 border-b border-border/60">
            <span className="text-muted-foreground font-medium">
              Đơn tối thiểu
            </span>
            <span className="font-semibold text-foreground">
              {minOrderAmount && minOrderAmount > 0
                ? formatCurrency(minOrderAmount)
                : "Không yêu cầu"}
            </span>
          </div>
        )}

        {/* Ngân sách */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Ngân sách</span>
          </div>
          <span className="font-semibold text-foreground">
            {budgetLimit && budgetLimit > 0
              ? formatCurrency(budgetLimit)
              : "Không giới hạn"}
          </span>
        </div>

        {/* Lượt dùng (Voucher) */}
        {kind === "VOUCHER" && (
          <>
            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground font-medium">
                Tổng lượt dùng
              </span>
              <span className="font-semibold text-foreground">
                {maxUses && maxUses > 0 ? `${maxUses} lượt` : "Không giới hạn"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground font-medium">
                Mỗi khách hàng
              </span>
              <span className="font-semibold text-foreground">
                {maxUsesPerCustomer && maxUsesPerCustomer > 0
                  ? `${maxUsesPerCustomer} lượt/khách`
                  : "Không giới hạn"}
              </span>
            </div>
          </>
        )}

        {/* Thời gian */}
        <div className="space-y-1.5 py-1.5 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Thời gian</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                timeStatus.color,
              )}
            >
              <timeStatus.icon className="w-3 h-3" />
              <span>{timeStatus.label}</span>
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground pl-5 space-y-0.5">
            <div>Từ: {startsAt ? formatDateTime(startsAt) : "-"}</div>
            <div>Đến: {endsAt ? formatDateTime(endsAt) : "Không giới hạn"}</div>
          </div>
        </div>

        {/* Trạng thái kích hoạt */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-muted-foreground font-medium">
            Trạng thái kích hoạt
          </span>
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                active ? "bg-emerald-500" : "bg-slate-400",
              )}
            />
            <span className={active ? "text-emerald-700" : "text-slate-500"}>
              {active ? "Đang kích hoạt" : "Tạm dừng"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons inside Sidebar */}
      <div className="p-4 pt-2 border-t border-border bg-muted/15 space-y-2">
        <Button
          type="button"
          disabled={isLoading}
          onClick={onSubmit}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9 shadow-xs"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          {isEditMode ? "Lưu thay đổi" : "Tạo chương trình"}
        </Button>

        {!isEditMode && onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onSaveDraft}
            className="w-full text-xs h-8 border-border text-foreground hover:bg-muted"
          >
            Lưu nháp (Tắt kích hoạt)
          </Button>
        )}
      </div>
    </div>
  );
}
