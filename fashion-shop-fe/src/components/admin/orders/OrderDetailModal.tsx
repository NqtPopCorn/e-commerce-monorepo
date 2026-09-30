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
import { Tag, Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> =
  {
    PENDING: {
      label: "Chờ xử lý",
      color:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: Clock,
    },
    CONFIRMED: {
      label: "Đã xác nhận",
      color:
        "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      icon: Package,
    },
    SHIPPING: {
      label: "Đang giao",
      color:
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
      icon: Truck,
    },
    COMPLETED: {
      label: "Hoàn thành",
      color:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: "Đã hủy",
      color:
        "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      icon: XCircle,
    },
  };

export function OrderDetailModal({
  isOpen,
  onClose,
  order,
}: OrderDetailModalProps) {
  if (!order) return null;

  const items = order.items || [];

  const statusInfo = STATUS_MAP[order.status] || {
    label: order.status,
    color: "bg-muted text-muted-foreground border-border",
    icon: Package,
  };
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card text-card-foreground">
        {/* Header cố định */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Chi tiết đơn hàng{" "}
              <span className="text-primary font-bold">#{order.id}</span>
            </DialogTitle>
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border ${statusInfo.color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Thông tin chi tiết về khách hàng, sản phẩm và khấu trừ khuyến mãi
            audit-ready.
          </DialogDescription>
        </DialogHeader>

        {/* Thân modal cuộn riêng biệt */}
        <DialogBody className="space-y-6 px-6 py-5">
          {/* Thông tin khách hàng & Thông tin đơn hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border/80 rounded-xl p-4 bg-muted/30">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3 border-b border-border/60 pb-2">
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex justify-between">
                  <span className="font-medium text-foreground">Email:</span>
                  <span>{order.user?.email || "Khách vãng lai"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-foreground">Họ tên:</span>
                  <span className="font-medium text-foreground">
                    {order.user?.firstName && order.user?.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : order.user?.firstName || order.user?.lastName || "N/A"}
                  </span>
                </p>
              </div>
            </div>

            <div className="border border-border/80 rounded-xl p-4 bg-muted/30">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3 border-b border-border/60 pb-2">
                Thông tin đơn hàng
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Mã đơn:</span>
                  <span className="font-mono font-medium text-foreground">
                    #{order.id}
                  </span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Ngày đặt:</span>
                  <span className="text-foreground">
                    {order.createdAt ? formatDateTime(order.createdAt) : "N/A"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="space-y-3">
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
              Danh sách sản phẩm (Snapshot giá)
            </h3>
            <div className="border border-border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2.5">Sản phẩm / SKU</th>
                    <th className="px-3.5 py-2.5 text-center">Số lượng</th>
                    <th className="px-3.5 py-2.5 text-right">Giá gốc</th>
                    <th className="px-3.5 py-2.5 text-right">Giảm SP</th>
                    <th className="px-3.5 py-2.5 text-right">Đơn giá cuối</th>
                    <th className="px-3.5 py-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {items.map((item: any, idx: number) => {
                    const origPrice = Number(
                      item.originalUnitPrice || item.unitPrice || 0,
                    );
                    const prodDisc = Number(item.productDiscount || 0);
                    const finalPrice = Number(
                      item.finalUnitPrice || item.unitPrice || 0,
                    );
                    const totalLine =
                      (finalPrice > 0 ? finalPrice : origPrice) * item.quantity;
                    const title =
                      item.variant?.product?.name ||
                      item.variant?.book?.title ||
                      item.title ||
                      "Sản phẩm";
                    const variantInfo = [
                      item.variant?.size,
                      item.variant?.color,
                    ]
                      .filter(Boolean)
                      .join(" - ");
                    const sku = item.variant?.sku || "";

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-3.5 py-2.5 font-medium text-foreground">
                          <div>{title}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            {variantInfo && <span>{variantInfo}</span>}
                            {sku && (
                              <span className="font-mono">SKU: {sku}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold text-foreground tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-muted-foreground tabular-nums">
                          {formatCurrency(origPrice)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                          {prodDisc > 0 ? `-${formatCurrency(prodDisc)}` : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-medium text-foreground tabular-nums">
                          {formatCurrency(finalPrice)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-foreground tabular-nums">
                          {formatCurrency(totalLine)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Promotion Applications Snapshot */}
            {order.promotionApplications &&
              order.promotionApplications.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                  <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" /> Lịch sử áp dụng khuyến mãi
                    (Audit Log)
                  </h4>
                  <div className="space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                    {order.promotionApplications.map((app: any) => (
                      <div
                        key={app.id}
                        className="flex justify-between items-center bg-card/60 px-3 py-2 rounded-md border border-emerald-500/15"
                      >
                        <span>
                          •{" "}
                          <strong className="font-semibold text-foreground">
                            {app.promotionName}
                          </strong>
                          {app.promotionCode ? ` (${app.promotionCode})` : ""}{" "}
                          <span className="opacity-75">[{app.scope}]</span>
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          -{formatCurrency(Number(app.discountAmount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Order Summary Snapshot */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2.5 text-xs text-muted-foreground max-w-sm ml-auto">
              <div className="flex justify-between items-center">
                <span>Tạm tính gốc:</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatCurrency(Number(order.subtotal || order.total))}
                </span>
              </div>
              {Number(order.productDiscount) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span>Ưu đãi sản phẩm:</span>
                  <span className="font-medium tabular-nums">
                    -{formatCurrency(Number(order.productDiscount))}
                  </span>
                </div>
              )}
              {Number(order.orderDiscount) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span>Khuyến mãi hóa đơn:</span>
                  <span className="font-medium tabular-nums">
                    -{formatCurrency(Number(order.orderDiscount))}
                  </span>
                </div>
              )}
              {Number(order.voucherDiscount) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span>Voucher giảm giá:</span>
                  <span className="font-medium tabular-nums">
                    -{formatCurrency(Number(order.voucherDiscount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold border-t border-border pt-2.5 text-sm text-foreground mt-2">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-primary text-base tabular-nums">
                  {formatCurrency(Number(order.total))}
                </span>
              </div>
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
