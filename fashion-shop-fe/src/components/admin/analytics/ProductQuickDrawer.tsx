"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductAnalyticsDetail } from "@/hooks/useAnalytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ProductQuickDrawerProps {
  productId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange?: { from?: string; to?: string };
}

export function ProductQuickDrawer({
  productId,
  open,
  onOpenChange,
  dateRange,
}: ProductQuickDrawerProps) {
  const { data, isLoading } = useProductAnalyticsDetail(productId, dateRange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-semibold">
              {isLoading ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                data?.productName || "Chi tiết sản phẩm"
              )}
            </DialogTitle>

            {productId && (
              <Link
                href={`/admin/products/${productId}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <span>Mở trang sản phẩm</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <DialogDescription className="text-xs">
            Phân bổ doanh thu, số lượng bán và tồn kho theo từng biến thể (Size / Màu)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
              <div>
                <span className="text-xs text-muted-foreground">Tổng doanh thu kỳ:</span>
                <div className="text-base font-bold text-foreground mt-0.5">
                  {formatCurrency(data?.totalRevenue || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tổng sản phẩm đã bán:</span>
                <div className="text-base font-bold text-foreground mt-0.5">
                  {formatNumber(data?.totalUnits || 0)} sp
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">SKU</TableHead>
                    <TableHead className="text-xs font-semibold">Phân loại</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tồn kho</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Đã bán</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!data?.variants || data.variants.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                        Chưa có dữ liệu giao dịch cho các biến thể này
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.variants.map((v) => (
                      <TableRow key={v.id} className="text-xs">
                        <TableCell className="font-mono font-medium">{v.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {v.size && <Badge variant="outline" className="text-[10px] px-1 py-0">{v.size}</Badge>}
                            {v.color && <span className="text-muted-foreground">{v.color}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={v.stock === 0 ? "font-bold text-rose-600 dark:text-rose-400" : ""}>
                            {formatNumber(v.stock)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(v.unitsSold)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(v.revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
