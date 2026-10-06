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
import { formatCurrency, formatNumber } from "@/lib/format";
import { PromotionGroupItem } from "@/types/analytics";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface CampaignQuickDrawerProps {
  campaign?: PromotionGroupItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignQuickDrawer({
  campaign,
  open,
  onOpenChange,
}: CampaignQuickDrawerProps) {
  if (!campaign) return null;

  const campaignDbId = campaign.id.startsWith("camp-")
    ? campaign.id.replace("camp-", "")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Chiến dịch
              </Badge>
              <DialogTitle className="text-base font-semibold">
                {campaign.name}
              </DialogTitle>
            </div>

            {campaignDbId && (
              <Link
                href={`/admin/promotions/campaigns/${campaignDbId}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <span>Mở chiến dịch</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <DialogDescription className="text-xs">
            Báo cáo phân rã các chương trình Giảm giá và Voucher cấu thành trong chiến dịch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tóm lược tài chính của Chiến dịch */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
            <div>
              <span className="text-xs text-muted-foreground">Doanh số thúc đẩy:</span>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {formatCurrency(campaign.revenue)}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Tổng chi phí KM:</span>
              <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(campaign.discountCost)}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Đơn có áp dụng:</span>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {formatNumber(campaign.ordersCount)} đơn
              </div>
            </div>
          </div>

          {/* Tiến độ ngân sách nếu có */}
          {campaign.budgetLimit && campaign.budgetLimit > 0 && (
            <div className="p-3 border border-border rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Ngân sách chiến dịch:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(campaign.spentAmount || 0)} / {formatCurrency(campaign.budgetLimit)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((campaign.spentAmount || 0) / campaign.budgetLimit) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Bảng chương trình trực thuộc */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Chương trình / Mã</TableHead>
                  <TableHead className="text-xs font-semibold">Loại</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Đơn</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Chi phí KM</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!campaign.subItems || campaign.subItems.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      Chưa phát sinh giao dịch chiết khấu trong kỳ này
                    </TableCell>
                  </TableRow>
                ) : (
                  campaign.subItems.map((sub, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-medium text-foreground">{sub.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                          {sub.type === "DISCOUNT" ? "Giảm giá SP" : "Voucher đơn"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(sub.ordersCount)}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 dark:text-rose-400 font-medium">
                        {formatCurrency(sub.discountCost)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(sub.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
