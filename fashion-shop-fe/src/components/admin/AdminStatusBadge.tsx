"use client";

import React from "react";

export type StatusType =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED"
  | "ACTIVE"
  | "INACTIVE"
  | "BLOCKED"
  | "ADMIN"
  | "CUSTOMER"
  | "VOUCHER"
  | "CAMPAIGN"
  | "ORDER_AUTO"
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | string;

type SemanticVariant =
  "success" | "warning" | "info" | "danger" | "neutral" | "primary";

interface StatusConfig {
  label: string;
  variant: SemanticVariant;
}

const VARIANT_STYLES: Record<
  SemanticVariant,
  {
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotColor: string;
  }
> = {
  success: {
    bgClass: "bg-success/10",
    textClass: "text-success",
    borderClass: "border-success/20",
    dotColor: "bg-success",
  },
  warning: {
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    borderClass: "border-warning/20",
    dotColor: "bg-warning",
  },
  info: {
    bgClass: "bg-info/10",
    textClass: "text-info",
    borderClass: "border-info/20",
    dotColor: "bg-info",
  },
  danger: {
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/20",
    dotColor: "bg-destructive",
  },
  primary: {
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    borderClass: "border-primary/20",
    dotColor: "bg-primary",
  },
  neutral: {
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    dotColor: "bg-muted-foreground",
  },
};

const statusMap: Record<string, StatusConfig> = {
  // Orders
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "info" },
  SHIPPING: { label: "Đang giao", variant: "info" },
  COMPLETED: { label: "Hoàn tất", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "danger" },

  // Accounts
  ACTIVE: { label: "Hoạt động", variant: "success" },
  INACTIVE: { label: "Ngừng hoạt động", variant: "neutral" },
  BLOCKED: { label: "Bị khóa", variant: "danger" },
  ADMIN: { label: "Quản trị viên", variant: "primary" },
  CUSTOMER: { label: "Khách hàng", variant: "neutral" },

  // Promotions
  VOUCHER: { label: "Mã giảm giá", variant: "primary" },
  CAMPAIGN: { label: "Chiến dịch", variant: "info" },
  ORDER_AUTO: { label: "Tự động đơn hàng", variant: "info" },

  // Stock
  IN_STOCK: { label: "Còn hàng", variant: "success" },
  LOW_STOCK: { label: "Sắp hết hàng", variant: "warning" },
  OUT_OF_STOCK: { label: "Hết hàng", variant: "danger" },
};

interface AdminStatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function AdminStatusBadge({
  status,
  customLabel,
  showDot = true,
  size = "md",
  className = "",
}: AdminStatusBadgeProps) {
  const normalizedKey = status ? String(status).toUpperCase() : "";
  const config = statusMap[normalizedKey] || {
    label: customLabel || status,
    variant: "neutral" as SemanticVariant,
  };

  const style = VARIANT_STYLES[config.variant] || VARIANT_STYLES.neutral;
  const label = customLabel || config.label;
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${sizeClasses} ${style.bgClass} ${style.textClass} ${style.borderClass} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotColor}`}
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}
