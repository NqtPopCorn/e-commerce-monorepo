"use client";

import React, { useState } from "react";
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
import {
  Tag,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
  Banknote,
  FileText,
  Check,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useConfirmVietQRAdmin } from "@/hooks/usePayments";
import { toast } from "sonner";
import { OrderProgressPipeline } from "@/components/orders/OrderProgressPipeline";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | any;
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

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  UNPAID: {
    label: "Chưa thanh toán",
    color:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  PAID: {
    label: "Đã thanh toán",
    color:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    color:
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
};

export function OrderDetailModal({
  isOpen,
  onClose,
  order,
}: OrderDetailModalProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const confirmVietQRMutation = useConfirmVietQRAdmin();
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!order) return null;

  const items = order.items || [];

  const statusInfo = STATUS_MAP[order.status] || {
    label: order.status,
    color: "bg-muted text-muted-foreground border-border",
    icon: Package,
  };
  const StatusIcon = statusInfo.icon;

  const paymentStatus = order.paymentStatus || "UNPAID";
  const paymentInfo = PAYMENT_STATUS_MAP[paymentStatus] || {
    label: paymentStatus,
    color: "bg-muted text-muted-foreground border-border",
  };

  const recipientName =
    order.recipientName ||
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
    "Theo tài khoản";
  const recipientPhone =
    order.recipientPhone || order.user?.phone || "Chưa cập nhật";
  const shippingAddress =
    order.shippingAddress || "Chưa cập nhật địa chỉ chi tiết";

  const handleConfirmVietQR = async () => {
    setIsUpdatingPayment(true);
    try {
      await confirmVietQRMutation.mutateAsync(order.id);
      order.paymentStatus = "PAID";
      order.status = "CONFIRMED";
      toast.success(
        "Đã xác nhận thanh toán VietQR thành công! Đơn hàng đã được chuyển sang Đã xác nhận.",
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Không thể xác nhận thanh toán VietQR",
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleTogglePaymentStatus = async (newStatus: PaymentStatus) => {
    setIsUpdatingPayment(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        paymentStatus: newStatus,
      });
      toast.success(
        newStatus === "PAID"
          ? "Đã đánh dấu đơn hàng đã thanh toán"
          : "Đã cập nhật trạng thái thanh toán",
      );
      // Update local object reference if possible
      order.paymentStatus = newStatus;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Không thể cập nhật trạng thái thanh toán",
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        status: newStatus,
      });
      order.status = newStatus;
      if (
        newStatus === "COMPLETED" &&
        (order.paymentMethod === "COD" || !order.paymentMethod)
      ) {
        order.paymentStatus = "PAID";
      }
      toast.success(
        `Đã chuyển trạng thái đơn hàng sang: ${
          STATUS_MAP[newStatus]?.label || newStatus
        }`,
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card text-card-foreground">
        {/* Header cố định */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-6 flex-wrap gap-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Chi tiết đơn hàng{" "}
              <span className="text-primary font-bold">#{order.id}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border ${statusInfo.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </Badge>
              <Badge
                variant="outline"
                className={`px-2.5 py-1 text-xs border ${paymentInfo.color}`}
              >
                {paymentInfo.label}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Thông tin chi tiết về người nhận, địa chỉ giao hàng, thanh toán COD
            và khấu trừ khuyến mãi.
          </DialogDescription>
        </DialogHeader>

        {/* Thân modal cuộn riêng biệt */}
        <DialogBody className="space-y-6 px-6 py-5">
          {/* Tiến trình đơn hàng (Pipeline) */}
          <OrderProgressPipeline status={order.status} />

          {/* Thông tin 3 khối: Nhận hàng, Thanh toán, và Tài khoản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Khối 1: Thông tin nhận hàng (Shipping) */}
            <div className="border border-border/80 rounded-xl p-4 bg-muted/30 space-y-2.5 text-xs">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border/60 pb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Người nhận & Giao hàng</span>
              </h3>
              <div className="space-y-1.5 text-muted-foreground">
                <p className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">
                    Người nhận:
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {recipientName}
                  </span>
                </p>
                <p className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">SĐT nhận:</span>
                  <span className="font-mono font-medium text-foreground text-right">
                    {recipientPhone}
                  </span>
                </p>
                <div className="pt-1">
                  <span className="font-medium text-foreground block mb-0.5">
                    Địa chỉ giao:
                  </span>
                  <p className="text-foreground leading-relaxed bg-background/60 p-2 rounded-lg border border-border/40">
                    {shippingAddress}
                  </p>
                </div>
                {order.shippingNote && (
                  <p className="pt-1 text-[11px] italic text-muted-foreground">
                    <span className="font-medium not-italic text-foreground">
                      Ghi chú:{" "}
                    </span>
                    &ldquo;{order.shippingNote}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Khối 2: Thanh toán & Vận hành (Payment) */}
            <div className="border border-border/80 rounded-xl p-4 bg-muted/30 space-y-2.5 text-xs flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border/60 pb-2 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-primary" />
                  <span>Phương thức thanh toán</span>
                </h3>
                <div className="space-y-2 text-muted-foreground pt-1">
                  <p className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      Hình thức:
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {order.paymentMethod === "VIETQR" ? (
                        <>
                          <QrCode className="w-3.5 h-3.5 text-primary" />
                          <span>Chuyển khoản VietQR</span>
                        </>
                      ) : order.paymentMethod === "COD" ||
                        !order.paymentMethod ? (
                        "COD (Tiền mặt)"
                      ) : (
                        order.paymentMethod
                      )}
                    </span>
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      Trạng thái:
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 border ${paymentInfo.color}`}
                    >
                      {paymentInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Nút thao tác nhanh VietQR dành riêng cho đơn chuyển khoản */}
              {order.paymentMethod === "VIETQR" && paymentStatus !== "PAID" && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-[11px]">
                    <span className="text-muted-foreground block font-medium">
                      Cú pháp đối soát ngân hàng:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-foreground">
                        DH{order.id}
                      </span>
                      <span className="font-bold text-xs text-primary">
                        {formatCurrency(Number(order.total))}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isUpdatingPayment}
                    onClick={handleConfirmVietQR}
                    className="w-full h-8 text-xs font-semibold gap-1.5 rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Xác nhận nhận tiền VietQR
                  </Button>
                </div>
              )}

              {/* Nút thao tác chuyển trạng thái thanh toán thủ công khác */}
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <span className="text-[10px] text-muted-foreground block">
                  Thao tác trạng thái thanh toán:
                </span>
                {paymentStatus !== "PAID" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingPayment}
                    onClick={() => handleTogglePaymentStatus("PAID")}
                    className="w-full h-7 text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Đánh dấu đã thu tiền
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingPayment}
                    onClick={() => handleTogglePaymentStatus("UNPAID")}
                    className="w-full h-7 text-xs border-amber-500/40 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Chuyển về Chưa thanh toán
                  </Button>
                )}
              </div>
            </div>

            {/* Khối 3: Thông tin tài khoản & Thời gian */}
            <div className="border border-border/80 rounded-xl p-4 bg-muted/30 space-y-2.5 text-xs">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border/60 pb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Tài khoản đặt hàng</span>
              </h3>
              <div className="space-y-1.5 text-muted-foreground">
                <p className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Email:</span>
                  <span className="font-mono text-foreground">
                    {order.user?.email || "Khách vãng lai"}
                  </span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Họ tên:</span>
                  <span className="text-foreground">
                    {order.user?.firstName && order.user?.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : order.user?.firstName || order.user?.lastName || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Ngày tạo:</span>
                  <span className="text-foreground">
                    {order.createdAt ? formatDateTime(order.createdAt) : "N/A"}
                  </span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Mã đơn:</span>
                  <span className="font-mono font-semibold text-foreground">
                    #{order.id}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="space-y-3">
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
              Danh sách sản phẩm ({items.length} mặt hàng)
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

        {/* Footer cố định ở đáy với các hành động chuyển trạng thái */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between flex-wrap gap-2">
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {order.status === "PENDING" && (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus("CONFIRMED")}
                  className="text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
                >
                  <Package className="w-3.5 h-3.5" />
                  Xác nhận đơn
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  className="text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Hủy đơn
                </Button>
              </>
            )}

            {order.status === "CONFIRMED" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus("SHIPPING")}
                  className="text-xs h-8 px-3 gap-1.5 font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Bắt đầu giao hàng
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  className="text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Hủy đơn
                </Button>
              </>
            )}

            {order.status === "SHIPPING" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  className="text-xs h-8 px-3 gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Xác nhận hoàn tất
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  className="text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Hủy đơn
                </Button>
              </>
            )}

            {order.status === "COMPLETED" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Đơn hàng đã hoàn thành trọn vẹn
              </span>
            )}

            {order.status === "CANCELLED" && (
              <span className="text-xs text-destructive font-medium flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Đơn hàng đã hủy
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-4"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
