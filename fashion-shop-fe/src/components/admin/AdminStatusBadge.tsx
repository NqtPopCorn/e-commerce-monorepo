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

interface StatusConfig {
  label: string;
  dotColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const statusMap: Record<string, StatusConfig> = {
  // Orders
  PENDING: {
    label: "Chờ xác nhận",
    dotColor: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200/80",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    dotColor: "bg-blue-500",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200/80",
  },
  SHIPPING: {
    label: "Đang giao",
    dotColor: "bg-indigo-500",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-200/80",
  },
  COMPLETED: {
    label: "Hoàn tất",
    dotColor: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200/80",
  },
  CANCELLED: {
    label: "Đã hủy",
    dotColor: "bg-rose-500",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200/80",
  },

  // Accounts
  ACTIVE: {
    label: "Hoạt động",
    dotColor: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200/80",
  },
  INACTIVE: {
    label: "Ngừng hoạt động",
    dotColor: "bg-slate-400",
    bgClass: "bg-slate-100",
    textClass: "text-slate-600",
    borderClass: "border-slate-200",
  },
  BLOCKED: {
    label: "Bị khóa",
    dotColor: "bg-rose-500",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200/80",
  },
  ADMIN: {
    label: "Quản trị viên",
    dotColor: "bg-purple-500",
    bgClass: "bg-purple-50",
    textClass: "text-purple-700",
    borderClass: "border-purple-200/80",
  },
  CUSTOMER: {
    label: "Khách hàng",
    dotColor: "bg-slate-500",
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-200/80",
  },

  // Promotions
  VOUCHER: {
    label: "Mã giảm giá",
    dotColor: "bg-rose-500",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200/80",
  },
  CAMPAIGN: {
    label: "Chiến dịch",
    dotColor: "bg-indigo-500",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-200/80",
  },
  ORDER_AUTO: {
    label: "Tự động đơn hàng",
    dotColor: "bg-sky-500",
    bgClass: "bg-sky-50",
    textClass: "text-sky-700",
    borderClass: "border-sky-200/80",
  },

  // Stock
  IN_STOCK: {
    label: "Còn hàng",
    dotColor: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200/80",
  },
  LOW_STOCK: {
    label: "Sắp hết hàng",
    dotColor: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200/80",
  },
  OUT_OF_STOCK: {
    label: "Hết hàng",
    dotColor: "bg-rose-500",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200/80",
  },
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
    dotColor: "bg-slate-400",
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  };

  const label = customLabel || config.label;
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${sizeClasses} ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`}
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}
