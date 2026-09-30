"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PurchaseReceipt } from "@/types/purchase";
import { AdminStatusBadge } from "@/components/admin";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseReceipt | null;
}

export function PurchaseDetailModal({
  isOpen,
  onClose,
  purchase,
}: PurchaseDetailModalProps) {
  if (!purchase) return null;

  const items = purchase.items || [];
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card">
        {/* Header cố định */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold text-foreground">
              Chi tiết phiếu nhập: {purchase.code}
            </DialogTitle>
            <AdminStatusBadge
              status={purchase.status || "COMPLETED"}
              customLabel="Đã nhập kho"
              size="sm"
            />
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Thông tin nhà cung cấp, ngày giờ và danh mục các mặt hàng nhập kho.
          </DialogDescription>
        </DialogHeader>

        {/* Nội dung cuộn mượt mà độc lập */}
        <DialogBody className="space-y-4 px-6 py-5">
          {/* Thông tin phiếu nhập */}
          <div className="border border-border/80 rounded-xl p-4 bg-muted/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  Mã phiếu:
                </p>
                <p className="font-mono font-semibold text-foreground">
                  {purchase.code}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  Ngày nhập:
                </p>
                <p className="font-medium text-foreground">
                  {purchase.createdAt
                    ? formatDateTime(purchase.createdAt)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  Nhà cung cấp:
                </p>
                <p className="font-semibold text-foreground">
                  {purchase.supplier || "Fashion Shop Official"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  Người tạo:
                </p>
                <p className="font-medium text-foreground">Admin</p>
              </div>
            </div>
            {purchase.note && (
              <div className="mt-3 pt-3 border-t border-border/60 text-xs">
                <span className="text-muted-foreground font-medium">
                  Ghi chú:{" "}
                </span>
                <span className="text-foreground italic">{purchase.note}</span>
              </div>
            )}
          </div>

          {/* Danh sách mặt hàng */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Danh sách mặt hàng nhập ({items.length} mặt hàng,{" "}
                {formatNumber(totalQuantity)} chiếc)
              </h3>
            </div>
            <div className="border border-border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2.5 w-10 text-center">#</th>
                    <th className="px-3.5 py-2.5">Sản phẩm</th>
                    <th className="px-3.5 py-2.5">Phân loại / SKU</th>
                    <th className="px-3.5 py-2.5 text-center">Số lượng</th>
                    <th className="px-3.5 py-2.5 text-right">Đơn giá nhập</th>
                    <th className="px-3.5 py-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        Không có sản phẩm nào trong phiếu này.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const variant = item.variant;
                      const productName =
                        variant?.product?.name || "Sản phẩm không xác định";
                      const classification = [variant?.color, variant?.size]
                        .filter(Boolean)
                        .join(" - ");
                      const lineTotal = item.quantity * Number(item.costPrice);

                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-3.5 py-2.5 text-center text-muted-foreground font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-foreground">
                            {productName}
                          </td>
                          <td className="px-3.5 py-2.5 text-muted-foreground">
                            {classification && (
                              <span className="font-medium text-foreground">
                                {classification}
                              </span>
                            )}
                            <span className="block text-[11px] font-mono text-muted-foreground">
                              SKU: {variant?.sku || "N/A"}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-semibold text-foreground tabular-nums">
                            {formatNumber(item.quantity)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-muted-foreground tabular-nums">
                            {formatCurrency(Number(item.costPrice))}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-foreground tabular-nums">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-muted/40 font-semibold text-foreground border-t border-border">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3.5 py-3 text-right text-muted-foreground"
                    >
                      Tổng cộng:
                    </td>
                    <td className="px-3.5 py-3 text-center font-bold text-foreground tabular-nums">
                      {formatNumber(totalQuantity)} chiếc
                    </td>
                    <td></td>
                    <td className="px-3.5 py-3 text-right text-sm font-bold text-primary tabular-nums">
                      {formatCurrency(Number(purchase.totalAmount || 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </DialogBody>

        {/* Footer cố định ở đáy */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
