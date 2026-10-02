"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, AlertOctagon, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { InventorySignalsResult } from "@/types/analytics";
import { formatNumber } from "@/lib/format";

interface InventorySignalsProps {
  signals?: InventorySignalsResult;
  isLoading?: boolean;
}

export function InventorySignals({
  signals,
  isLoading = false,
}: InventorySignalsProps) {
  if (isLoading || !signals) {
    return (
      <Card className="bg-card border border-border shadow-none rounded-xl h-full">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="h-28 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-none rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Tín Hiệu Sức Khỏe Kho (Inventory)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cảnh báo các biến thể đứt gãy nguồn cung hoặc ứ đọng vốn
          </p>
        </div>

        <Link
          href="/admin/purchase"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <span>Nhập hàng</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-3.5">
        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Hết hàng</span>
            </div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
              {formatNumber(signals.outOfStockCount)} SKU
            </div>
          </div>

          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Sắp hết (≤ 5)</span>
            </div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {formatNumber(signals.lowStockCount)} SKU
            </div>
          </div>

          <div className="p-2.5 bg-muted/60 border border-border/80 rounded-lg">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Chậm luân chuyển</span>
            </div>
            <div className="text-lg font-bold text-foreground mt-0.5">
              {formatNumber(signals.slowMovingCount)} SKU
            </div>
          </div>
        </div>

        {/* Critical SKU Table */}
        {signals.criticalSkus.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">
            Mức tồn kho tất cả các mặt hàng hiện đều ở ngưỡng an toàn
          </div>
        ) : (
          <div className="border border-border/80 rounded-lg overflow-hidden flex-1">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">SKU / Sản phẩm</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Tồn</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Bán kỳ</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Tình trạng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.criticalSkus.slice(0, 4).map((sku) => (
                  <TableRow key={sku.id} className="text-xs">
                    <TableCell className="py-2">
                      <div className="max-w-[150px]">
                        <span className="font-mono font-medium text-foreground">
                          {sku.sku}
                        </span>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {sku.productName} {sku.size ? `(${sku.size})` : ""}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-bold">
                      <span className={sku.stock === 0 ? "text-rose-600 dark:text-rose-400" : ""}>
                        {formatNumber(sku.stock)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(sku.unitsSoldInPeriod)}
                    </TableCell>

                    <TableCell className="text-right">
                      {sku.status === "OUT_OF_STOCK" ? (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          Hết hàng
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-500/40">
                          Sắp hết
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
