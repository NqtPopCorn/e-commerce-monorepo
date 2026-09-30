"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Package, TrendingUp, Shirt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetOverviewStats } from "@/hooks/useStatistics";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatSkeleton,
} from "@/components/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/charts/RevenueChart").then(
      (mod) => mod.RevenueChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card border border-border rounded-xl p-6 h-[460px] flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </div>
    ),
  },
);

const StockChart = dynamic(
  () =>
    import("@/components/admin/charts/StockChart").then(
      (mod) => mod.StockChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card border border-border rounded-xl p-6 h-[410px] flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    ),
  },
);

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading } = useGetOverviewStats();

  const soldCount = stats?.productsSold ?? stats?.booksSold ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Phân Tích & Báo Cáo"
        description="Báo cáo chuyên sâu về tăng trưởng doanh thu, đơn hàng thành công và phân bổ tỷ trọng hàng tồn kho."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs border-border"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>Xuất Báo Cáo</span>
          </Button>
        }
      />

      {/* KPI Stats */}
      {isLoading ? (
        <AdminStatSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <AdminStatCard
            title="Tổng Doanh Thu"
            value={formatCurrency(Number(stats?.revenue || 0))}
            subtitle="Từ tất cả đơn hoàn tất"
            icon={TrendingUp}
            color="emerald"
            trend={{ value: "+14.8%", isPositive: true }}
          />

          <AdminStatCard
            title="Đơn Thành Công"
            value={formatNumber(stats?.orders || 0)}
            subtitle="Tỷ lệ giao đạt 96.2%"
            icon={Package}
            color="indigo"
            trend={{ value: "+9.1%", isPositive: true }}
          />

          <AdminStatCard
            title="Sản Phẩm Đã Bán"
            value={`${formatNumber(soldCount)} chiếc`}
            subtitle="Tổng lượng hàng xuất kho"
            icon={Shirt}
            color="rose"
            trend={{ value: "+18.3%", isPositive: true }}
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <RevenueChart />
        <StockChart />
      </div>
    </div>
  );
}
