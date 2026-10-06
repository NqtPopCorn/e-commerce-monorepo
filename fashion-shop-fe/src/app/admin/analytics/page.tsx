"use client";

import React, { useState, useMemo } from "react";
import { useAnalyticsOverview } from "@/hooks/useAnalytics";
import { AnalyticsQueryParams } from "@/types/analytics";
import { AnalyticsHeader } from "@/components/admin/analytics/AnalyticsHeader";
import {
  DateRangePicker,
  DateRangePreset,
} from "@/components/admin/analytics/DateRangePicker";
import { AnalyticsFilters } from "@/components/admin/analytics/AnalyticsFilters";
import { KPIGrid } from "@/components/admin/analytics/KPIGrid";
import { SalesPerformanceChart } from "@/components/admin/analytics/SalesPerformanceChart";
import { BusinessInsights } from "@/components/admin/analytics/BusinessInsights";
import { ProductPerformance } from "@/components/admin/analytics/ProductPerformance";
import { PromotionPerformance } from "@/components/admin/analytics/PromotionPerformance";
import { CategoryPerformance } from "@/components/admin/analytics/CategoryPerformance";
import { InventorySignals } from "@/components/admin/analytics/InventorySignals";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminAnalyticsWorkspacePage() {
  const [preset, setPreset] = useState<DateRangePreset>("last30days");
  const [compare, setCompare] = useState<boolean>(true);
  const [customRange, setCustomRange] = useState<{ from?: string; to?: string }>({});
  const [filters, setFilters] = useState<{
    categoryId?: number;
    brandId?: number;
    campaignId?: number;
  }>({});

  // Tính toán thời gian ISO dựa trên Preset
  const queryParams = useMemo<AnalyticsQueryParams>(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = now;

    if (preset === "custom" && customRange.from && customRange.to) {
      fromDate = new Date(customRange.from);
      toDate = new Date(customRange.to);
      toDate.setHours(23, 59, 59, 999);
    } else if (preset === "last7days") {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === "thisMonth") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === "lastMonth") {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      // Mặc định last30days
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      compare,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      campaignId: filters.campaignId,
    };
  }, [preset, compare, customRange, filters]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAnalyticsOverview(queryParams);

  // Xử lý bộ lọc
  const handleFilterChange = (
    key: "categoryId" | "brandId" | "campaignId",
    value?: number,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  // Xuất dữ liệu CSV
  const handleExportCsv = () => {
    if (!data) {
      toast.error("Chưa có dữ liệu để xuất");
      return;
    }

    try {
      const csvRows = [
        ["BAO CAO KINH DOANH - FASHION SHOP"],
        [`Chu ky: ${data.period.from} den ${data.period.to}`],
        [""],
        ["CHI SO COT LOI", "GIA TRI", "SO VOI KY TRUOC (%)"],
        ["Doanh thu thuan", data.kpis.netSales.value, `${data.kpis.netSales.deltaPercent}%`],
        ["Don hang", data.kpis.orders.value, `${data.kpis.orders.deltaPercent}%`],
        ["San pham da ban", data.kpis.unitsSold.value, `${data.kpis.unitsSold.deltaPercent}%`],
        ["Gia tri trung binh don (AOV)", data.kpis.aov.value, `${data.kpis.aov.deltaPercent}%`],
        [""],
        ["TOP SAN PHAM", "DOANH THU", "DA BAN", "DON HANG", "XU HUONG (%)"],
        ...data.productPerformance.map((p) => [
          `"${p.name.replace(/"/g, '""')}"`,
          p.revenue,
          p.unitsSold,
          p.ordersCount,
          `${p.trendPercent}%`,
        ]),
      ];

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        csvRows.map((e) => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `fashion_shop_analytics_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đã xuất báo cáo CSV thành công");
    } catch (err) {
      toast.error("Không thể xuất file CSV");
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader
          onRefresh={() => refetch()}
          onExport={handleExportCsv}
          isFetching={isFetching}
        />

        <div className="h-[400px] flex flex-col items-center justify-center border border-border rounded-xl bg-card p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Không thể tải dữ liệu phân tích kinh doanh
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Hệ thống không thể tải báo cáo từ máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <AnalyticsHeader
        onRefresh={() => {
          refetch();
          toast.success("Đang làm mới dữ liệu...");
        }}
        onExport={handleExportCsv}
        isFetching={isFetching}
      />

      {/* 2. Control & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-none">
        <DateRangePicker
          preset={preset}
          compare={compare}
          startDate={customRange.from}
          endDate={customRange.to}
          onPresetChange={setPreset}
          onCompareChange={setCompare}
          onCustomDateChange={(from, to) => setCustomRange({ from, to })}
        />

        <AnalyticsFilters
          categoryId={filters.categoryId}
          brandId={filters.brandId}
          campaignId={filters.campaignId}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* 3. KPI Cards Grid (4 Cards) */}
      <KPIGrid
        kpis={data?.kpis}
        isLoading={isLoading}
        hasComparison={compare}
      />

      {/* 4. Row 1: Sales Performance (8 cols) + Business Insights (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <SalesPerformanceChart
            data={data?.salesTrend}
            isLoading={isLoading}
            hasComparison={compare}
          />
        </div>
        <div className="lg:col-span-4">
          <BusinessInsights
            insights={data?.insights}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 5. Row 2: Product Performance (7 cols) + Promotion Performance (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <ProductPerformance
            products={data?.productPerformance}
            isLoading={isLoading}
            dateRange={{ from: queryParams.from, to: queryParams.to }}
          />
        </div>
        <div className="lg:col-span-5">
          <PromotionPerformance
            stats={data?.promotionPerformance}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 6. Row 3: Category Performance (6 cols) + Inventory Signals (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <CategoryPerformance
            categories={data?.categoryPerformance}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-6">
          <InventorySignals
            signals={data?.inventorySignals}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
