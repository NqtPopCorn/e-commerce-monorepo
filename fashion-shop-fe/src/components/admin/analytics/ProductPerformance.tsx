"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductPerformanceItem } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ProductQuickDrawer } from "./ProductQuickDrawer";

interface ProductPerformanceProps {
  products?: ProductPerformanceItem[];
  isLoading?: boolean;
  dateRange?: { from?: string; to?: string };
}

export function ProductPerformance({
  products = [],
  isLoading = false,
  dateRange,
}: ProductPerformanceProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (productId: number) => {
    setSelectedProductId(productId);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-none rounded-xl h-full">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border border-border shadow-none rounded-xl h-full flex flex-col justify-between">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Hiệu Suất Sản Phẩm (Top Products)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top 5 sản phẩm đóng góp doanh số cao nhất trong kỳ
            </p>
          </div>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <span>Tất cả sản phẩm</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-5 pt-0 flex-1">
          {products.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              Chưa có dữ liệu bán hàng cho các sản phẩm trong kỳ
            </div>
          ) : (
            <div className="border border-border/80 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Sản phẩm</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Doanh thu</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Đã bán</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Đơn</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Chiết khấu</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Xu hướng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className="text-xs cursor-pointer hover:bg-muted/40 transition-colors"
                      title="Bấm để xem nhanh biến thể"
                    >
                      <TableCell className="py-2.5 font-medium">
                        <div className="flex items-center gap-2.5 max-w-[220px]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-8 h-8 rounded object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold shrink-0">
                              FS
                            </div>
                          )}
                          <div className="truncate">
                            <div className="truncate text-foreground font-medium">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {item.categoryName} {item.brandName ? `• ${item.brandName}` : ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(item.revenue)}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatNumber(item.unitsSold)}
                      </TableCell>

                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(item.ordersCount)}
                      </TableCell>

                      <TableCell className="text-right text-muted-foreground">
                        {item.discountAmount > 0
                          ? formatCurrency(item.discountAmount)
                          : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 font-medium ${
                            item.trendPercent > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : item.trendPercent < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {item.trendPercent > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : item.trendPercent < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span>
                            {item.trendPercent > 0
                              ? `+${item.trendPercent}%`
                              : `${item.trendPercent}%`}
                          </span>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductQuickDrawer
        productId={selectedProductId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        dateRange={dateRange}
      />
    </>
  );
}
