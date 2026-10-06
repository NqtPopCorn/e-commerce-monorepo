"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryPerformanceItem } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";

interface CategoryPerformanceProps {
  categories?: CategoryPerformanceItem[];
  isLoading?: boolean;
  onSelectCategory?: (categoryName: string) => void;
}

export function CategoryPerformance({
  categories = [],
  isLoading = false,
  onSelectCategory,
}: CategoryPerformanceProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-none rounded-xl h-full">
        <CardHeader className="p-5 pb-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-52 mt-1" />
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-none rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Cơ Cấu Doanh Số Theo Danh Mục
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tỷ trọng đóng góp doanh thu của các nhóm ngành hàng thời trang
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
        {categories.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
            Chưa có số liệu danh mục trong kỳ
          </div>
        ) : (
          <div className="space-y-3.5">
            {categories.slice(0, 5).map((cat) => (
              <div
                key={cat.name}
                onClick={() => onSelectCategory?.(cat.name)}
                className="group cursor-pointer text-xs space-y-1"
                title={`Bấm để lọc theo ${cat.name}`}
              >
                <div className="flex items-center justify-between text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-medium text-foreground">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(cat.revenue)}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground/80">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all group-hover:opacity-90"
                    style={{ width: `${Math.max(4, cat.percentage)}%` }}
                  />
                </div>

                <div className="text-[11px] text-muted-foreground/70 text-right">
                  Đã bán {formatNumber(cat.unitsSold)} sản phẩm
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
