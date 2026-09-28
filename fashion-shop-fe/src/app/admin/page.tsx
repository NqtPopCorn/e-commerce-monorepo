"use client";

import Link from "next/link";
import { Package, TrendingUp, Shirt, ShoppingBag, Plus } from "lucide-react";
import { useGetOverviewStats } from "@/hooks/useStatistics";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StockChart } from "@/components/admin/charts/StockChart";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatSkeleton,
} from "@/components/admin";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetOverviewStats();

  const soldCount = stats?.productsSold ?? stats?.booksSold ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard Tổng Quan"
        description="Theo dõi hoạt động kinh doanh, biến động doanh thu và lưu chuyển tồn kho thời gian thực."
        actions={
          <>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              <span>Xem Đơn Hàng</span>
            </Link>
            <Link
              href="/admin/products?create=true"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm</span>
            </Link>
          </>
        }
      />

      {/* KPI Stats */}
      {isLoading ? (
        <AdminStatSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AdminStatCard
            title="Tổng Doanh Thu"
            value={`${Number(stats?.revenue || 0).toLocaleString("vi-VN")}₫`}
            subtitle="Từ tất cả đơn hoàn tất"
            icon={TrendingUp}
            color="emerald"
            trend={{ value: "+12.5%", isPositive: true, label: "so với tháng trước" }}
          />

          <AdminStatCard
            title="Đơn Hàng Thành Công"
            value={stats?.orders || 0}
            subtitle="Đơn đã thanh toán và giao"
            icon={Package}
            color="indigo"
            trend={{ value: "+8.2%", isPositive: true }}
          />

          <AdminStatCard
            title="Sản Phẩm Đã Bán"
            value={`${soldCount} chiếc`}
            subtitle="Tổng số lượng sản phẩm"
            icon={Shirt}
            color="rose"
            trend={{ value: "+15.4%", isPositive: true }}
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
