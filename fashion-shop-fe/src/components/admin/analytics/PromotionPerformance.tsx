"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Tag, Layers, Ticket } from "lucide-react";
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
import { PromotionGroupItem, PromotionOverviewStats } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CampaignQuickDrawer } from "./CampaignQuickDrawer";

interface PromotionPerformanceProps {
  stats?: PromotionOverviewStats;
  isLoading?: boolean;
}

export function PromotionPerformance({
  stats,
  isLoading = false,
}: PromotionPerformanceProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<
    PromotionGroupItem | undefined
  >();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (promo: PromotionGroupItem) => {
    if (promo.type === "CAMPAIGN" && promo.subItems && promo.subItems.length > 0) {
      setSelectedCampaign(promo);
      setDrawerOpen(true);
    }
  };

  if (isLoading || !stats) {
    return (
      <Card className="bg-card border border-border shadow-none rounded-xl h-full">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderTypeIcon = (type: PromotionGroupItem["type"]) => {
    switch (type) {
      case "CAMPAIGN":
        return <Layers className="w-3.5 h-3.5 text-primary" />;
      case "VOUCHER":
        return <Ticket className="w-3.5 h-3.5 text-amber-500" />;
      case "DISCOUNT":
      default:
        return <Tag className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <>
      <Card className="bg-card border border-border shadow-none rounded-xl h-full flex flex-col justify-between">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Hiệu Suất Khuyến Mãi (Promotions)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đóng góp doanh số và chi phí chiết khấu theo chương trình
            </p>
          </div>

          <Link
            href="/admin/promotions"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <span>Quản lý KM</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-3.5">
          {/* Summary Row */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground">Doanh thu KM:</span>
              <div className="font-bold text-foreground text-sm mt-0.5 truncate">
                {formatCurrency(stats.discountRevenue + stats.voucherRevenue)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Chi phí chiết khấu:</span>
              <div className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5 truncate">
                {formatCurrency(stats.totalDiscountCost)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Đơn dùng KM:</span>
              <div className="font-bold text-foreground text-sm mt-0.5">
                {formatNumber(stats.promotionOrdersCount)} đơn
              </div>
            </div>
          </div>

          {/* Table */}
          {stats.topPromotions.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">
              Chưa có chương trình khuyến mãi nào phát sinh chiết khấu trong kỳ
            </div>
          ) : (
            <div className="border border-border/80 rounded-lg overflow-hidden flex-1">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Chương trình</TableHead>
                    <TableHead className="text-xs font-semibold">Loại</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Doanh thu</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Chi phí KM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topPromotions.slice(0, 5).map((promo) => {
                    const isClickable =
                      promo.type === "CAMPAIGN" &&
                      promo.subItems &&
                      promo.subItems.length > 0;

                    return (
                      <TableRow
                        key={promo.id}
                        onClick={() => handleRowClick(promo)}
                        className={`text-xs ${
                          isClickable
                            ? "cursor-pointer hover:bg-muted/40 transition-colors"
                            : ""
                        }`}
                        title={isClickable ? "Bấm để xem các chương trình con" : undefined}
                      >
                        <TableCell className="font-medium text-foreground py-2.5">
                          <div className="flex items-center gap-2 max-w-[170px]">
                            {renderTypeIcon(promo.type)}
                            <span className="truncate">{promo.name}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            {promo.type === "CAMPAIGN"
                              ? "Chiến dịch"
                              : promo.type === "VOUCHER"
                                ? "Voucher"
                                : "Giảm giá"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(promo.revenue)}
                        </TableCell>

                        <TableCell className="text-right text-rose-600 dark:text-rose-400 font-medium">
                          {formatCurrency(promo.discountCost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignQuickDrawer
        campaign={selectedCampaign}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
