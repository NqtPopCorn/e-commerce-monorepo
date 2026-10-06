"use client";

import React from "react";
import { KPICard } from "./KPICard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { AnalyticsOverviewResponse } from "@/types/analytics";

interface KPIGridProps {
  kpis?: AnalyticsOverviewResponse["kpis"];
  isLoading?: boolean;
  hasComparison?: boolean;
}

export function KPIGrid({
  kpis,
  isLoading = false,
  hasComparison = true,
}: KPIGridProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border border-border shadow-none rounded-xl">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Doanh thu thuần (Net Sales)"
        value={formatCurrency(kpis.netSales.value)}
        deltaPercent={kpis.netSales.deltaPercent}
        isPositive={kpis.netSales.isPositive}
        sparkline={kpis.netSales.sparkline}
        hasComparison={hasComparison}
      />

      <KPICard
        title="Đơn hàng hoàn tất (Orders)"
        value={formatNumber(kpis.orders.value)}
        deltaPercent={kpis.orders.deltaPercent}
        isPositive={kpis.orders.isPositive}
        sparkline={kpis.orders.sparkline}
        hasComparison={hasComparison}
      />

      <KPICard
        title="Sản phẩm đã bán (Units Sold)"
        value={formatNumber(kpis.unitsSold.value)}
        deltaPercent={kpis.unitsSold.deltaPercent}
        isPositive={kpis.unitsSold.isPositive}
        sparkline={kpis.unitsSold.sparkline}
        hasComparison={hasComparison}
      />

      <KPICard
        title="Giá trị trung bình đơn (AOV)"
        value={formatCurrency(kpis.aov.value)}
        deltaPercent={kpis.aov.deltaPercent}
        isPositive={kpis.aov.isPositive}
        sparkline={kpis.aov.sparkline}
        hasComparison={hasComparison}
      />
    </div>
  );
}
