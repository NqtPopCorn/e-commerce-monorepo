"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Package, TrendingUp, Shirt, ShoppingBag, Plus } from "lucide-react";
import { useGetOverviewStats } from "@/hooks/useStatistics";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatSkeleton,
} from "@/components/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/format";

// Dynamic import with ssr: false for charts as per enterprise admin guidelines
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

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetOverviewStats();

  const soldCount = stats?.productsSold ?? stats?.booksSold ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard Tổng Quan"
        description="Theo dõi hoạt động kinh doanh, biến động doanh thu và lưu chuyển tồn kho thời gian thực."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/orders">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 text-xs font-medium border-border"
              >
                <ShoppingBag className="w-4 h-4 mr-1.5 text-muted-foreground" />
                <span>Xem Đơn Hàng</span>
              </Button>
            </Link>
            <Link href="/admin/products?create=true">
              <Button
                size="sm"
                className="h-9 px-3.5 text-xs font-medium shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Thêm Sản Phẩm</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      {isLoading ? (
        <AdminStatSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AdminStatCard
            title="Tổng Doanh Thu"
            value={formatCurrency(Number(stats?.revenue || 0))}
            subtitle="Từ tất cả đơn hoàn tất"
            icon={TrendingUp}
            color="emerald"
          />

          <AdminStatCard
            title="Đơn Hàng Thành Công"
            value={formatNumber(stats?.orders || 0)}
            subtitle="Đơn đã thanh toán và giao"
            icon={Package}
            color="indigo"
          />

          <AdminStatCard
            title="Sản Phẩm Đã Bán"
            value={`${formatNumber(soldCount)} chiếc`}
            subtitle="Tổng số lượng sản phẩm"
            icon={Shirt}
            color="rose"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <StockChart />
        </div>
      </div>
    </div>
  );
}
