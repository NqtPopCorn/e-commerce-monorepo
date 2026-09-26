"use client";

import { Package, TrendingUp, BookOpen } from "lucide-react";
import { useGetOverviewStats } from "@/hooks/useStatistics";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StockChart } from "@/components/admin/charts/StockChart";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetOverviewStats();

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải dữ liệu thống kê...
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Thống Kê</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doanh thu */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng doanh thu</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {Number(stats?.revenue || 0).toLocaleString("vi-VN")}đ
            </h3>
          </div>
        </div>

        {/* Đơn hàng */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Số đơn hàng thành công
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {stats?.orders || 0}
            </h3>
          </div>
        </div>

        {/* Sách bán ra */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Tổng sách đã bán
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {stats?.booksSold || 0} cuốn
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
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
