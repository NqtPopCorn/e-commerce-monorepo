"use client";

import React from "react";
import { Package, AlertCircle, Sparkles, DollarSign } from "lucide-react";
import { ProductStats } from "@/types/product";
import { AdminStatCard, AdminStatSkeleton } from "@/components/admin";

interface ProductStatCardsProps {
  stats?: ProductStats;
  isLoading?: boolean;
}

export function ProductStatCards({ stats, isLoading }: ProductStatCardsProps) {
  if (isLoading) {
    return <AdminStatSkeleton count={4} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatCard
        title="Tổng Sản Phẩm"
        value={stats?.totalProducts?.toLocaleString("vi-VN") ?? "0"}
        subtitle="Tổng số mẫu trong kho"
        icon={Package}
        color="indigo"
      />
      <AdminStatCard
        title="Hết Hàng"
        value={stats?.outOfStock?.toLocaleString("vi-VN") ?? "0"}
        subtitle="Cần nhập thêm đợt mới"
        icon={AlertCircle}
        color="amber"
      />
      <AdminStatCard
        title="Sản Phẩm Mới"
        value={stats?.newThisWeek?.toLocaleString("vi-VN") ?? "0"}
        subtitle="Tạo trong 7 ngày qua"
        icon={Sparkles}
        color="rose"
      />
      <AdminStatCard
        title="Giá Trị Tồn Kho"
        value={
          stats?.totalStockValue
            ? `${stats.totalStockValue.toLocaleString("vi-VN")}₫`
            : "0₫"
        }
        subtitle="Theo giá bán niêm yết"
        icon={DollarSign}
        color="emerald"
      />
    </div>
  );
}
