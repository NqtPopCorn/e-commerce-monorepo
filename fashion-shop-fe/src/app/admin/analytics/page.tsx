"use client";

import React from "react";
import { Package, TrendingUp, Shirt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetOverviewStats } from "@/hooks/useStatistics";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StockChart } from "@/components/admin/charts/StockChart";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatSkeleton,
} from "@/components/admin";

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
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
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
            value={`${Number(stats?.revenue || 0).toLocaleString("vi-VN")}₫`}
            subtitle="Từ tất cả đơn hoàn tất"
            icon={TrendingUp}
            color="emerald"
            trend={{ value: "+14.8%", isPositive: true }}
          />

          <AdminStatCard
            title="Đơn Thành Công"
            value={stats?.orders || 0}
            subtitle="Tỷ lệ giao đạt 96.2%"
            icon={Package}
            color="indigo"
            trend={{ value: "+9.1%", isPositive: true }}
          />

          <AdminStatCard
            title="Sản Phẩm Đã Bán"
            value={`${soldCount} chiếc`}
            subtitle="Tổng lượng hàng xuất kho"
            icon={Shirt}
            color="rose"
            trend={{ value: "+18.3%", isPositive: true }}
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Biểu Đồ Doanh Thu
            </h2>
            <p className="text-xs text-slate-500">
              Xu hướng biến động doanh thu theo thời gian
            </p>
          </div>
          <RevenueChart />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Phân Bổ Tồn Kho
            </h2>
            <p className="text-xs text-slate-500">
              Cơ cấu lượng hàng tồn kho theo danh mục sản phẩm
            </p>
          </div>
          <StockChart />
        </div>
      </div>
    </div>
  );
}
