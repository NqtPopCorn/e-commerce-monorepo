"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { useGetMyOrders } from "@/hooks/useOrders";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Package,
  Clock,
  XCircle,
  CheckCircle,
  Truck,
  Store,
  RotateCcw,
  Headphones,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CustomerOrdersList() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const addToCart = useCartStore((state) => state.add);
  const { data, isLoading, error, refetch } = useGetMyOrders();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Return dialog state
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState<string>(
    "Sản phẩm không vừa size / muốn đổi mẫu",
  );
  const [returnNote, setReturnNote] = useState<string>("");

  // Contact support dialog state
  const [contactOrderId, setContactOrderId] = useState<number | null>(null);

  const orders: Order[] = Array.isArray(data) ? (data as Order[]) : [];

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "ALL") return true;
    return order.status === statusFilter;
  });

  const getStatusConfig = (status: OrderStatus | string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          color: "text-amber-700 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
          icon: Clock,
          displayLabel: "Chờ xác nhận",
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          color: "text-blue-700 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
          icon: Package,
          displayLabel: "Đã xác nhận",
        };
      case "SHIPPING":
        return {
          label: "Đang giao hàng",
          color: "text-indigo-700 dark:text-indigo-400",
          bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50",
          icon: Truck,
          displayLabel: "Đang giao hàng",
        };
      case "COMPLETED":
        return {
          label: "Hoàn tất",
          color: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50",
          icon: CheckCircle,
          displayLabel: "Giao thành công",
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "text-rose-700 dark:text-rose-400",
          bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50",
          icon: XCircle,
          displayLabel: "Đã hủy",
        };
      default:
        return {
          label: status,
          color: "text-slate-700 dark:text-slate-400",
          bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
          icon: Package,
          displayLabel: status,
        };
    }
  };

  const getPaymentStatusConfig = (
    status?: PaymentStatus | string,
    isPartial?: boolean,
  ) => {
    if (isPartial || status === "PENDING") {
      return {
        label: "Thanh toán một phần",
        color:
          "text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800",
      };
    }
    switch (status) {
      case "PAID":
        return {
          label: "Đã thanh toán",
          color:
            "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50",
        };
      case "REFUNDED":
        return {
          label: "Đã hoàn tiền",
          color:
            "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50",
        };
      case "UNPAID":
      default:
        return {
          label: "Chưa thanh toán",
          color:
            "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/50",
        };
    }
  };

  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error("Đơn hàng này không có sản phẩm để mua lại");
      return;
    }

    order.items.forEach((item) => {
      addToCart({
        variantId: item.variantId || item.id,
        productId: item.variant?.product?.id ?? item.variant?.book?.id ?? 0,
        productName:
          item.variant?.product?.name ||
          item.variant?.book?.title ||
          item.title ||
          "Sản phẩm",
        size: item.variant?.size || undefined,
        color: item.variant?.color || undefined,
        price: Number(item.finalUnitPrice || item.unitPrice || 0),
        quantity: item.quantity,
        stock: 999,
        imageUrl: item.variant?.imageUrl || undefined,
      });
    });

    toast.success(
      `Đã thêm ${order.items.length} sản phẩm từ đơn hàng #${order.id} vào giỏ hàng!`,
    );
    router.push("/cart");
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId) return;
    toast.success(
      `Yêu cầu đổi trả cho đơn hàng #${returnOrderId} đã được gửi. Đội ngũ CSKH sẽ liên hệ với bạn trong 24h!`,
    );
    setReturnOrderId(null);
    setReturnNote("");
  };

  const FILTER_TABS = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "COMPLETED", label: "Hoàn tất" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? orders.length
              : orders.filter((o) => o.status === tab.key).length;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">
            Đang tải lịch sử đơn hàng...
          </span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng thử lại sau.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="rounded-xl text-xs mt-2"
          >
            Tải lại
          </Button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-10 rounded-2xl bg-muted/20 border border-border text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {statusFilter === "ALL"
                ? "Bạn chưa có đơn hàng nào"
                : `Không có đơn hàng nào ở trạng thái "${
                    FILTER_TABS.find((t) => t.key === statusFilter)?.label
                  }"`}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              Các đơn hàng bạn đã đặt sẽ hiển thị đầy đủ chi tiết tại đây.
            </p>
          </div>
          <Link href="/products">
            <Button size="sm" className="rounded-xl px-5 text-xs font-semibold">
              Khám phá sản phẩm
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {filteredOrders.map((order) => {
            const isPartialPaid =
              order.isPartialPaid ||
              (Number(order.paidAmount || 0) > 0 && order.paymentStatus !== "PAID");
            const statusConfig = getStatusConfig(order.status);
            const paymentConfig = getPaymentStatusConfig(
              order.paymentStatus,
              isPartialPaid,
            );

            return (
              <div
                key={order.id}
                className="w-full bg-card rounded-2xl border border-border shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden"
              >
                {/* 1. Header: Mã đơn hàng + Ngày đặt + Link đến trang riêng /orders/[id] */}
                <div className="p-4 sm:p-5 pb-3 flex items-start sm:items-center justify-between gap-3 border-b border-border/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Mã đơn hàng:
                      </span>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-bold text-foreground text-sm sm:text-base font-mono hover:text-primary transition-colors"
                      >
                        #{order.id}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Ngày đặt: {formatDateTime(order.createdAt)}</span>
                    </p>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    className="text-xs sm:text-sm font-medium text-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer select-none shrink-0 pt-0.5 sm:pt-0"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>

                {/* 3. Status Line (Bỏ thời gian giao hàng) */}
                <div className="px-4 sm:px-5 pt-3 pb-1 flex items-center justify-between text-xs">
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${paymentConfig.color}`}
                    >
                      {paymentConfig.label}
                    </span>
                  </div>

                  <div
                    className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${statusConfig.color}`}
                  >
                    <span>{statusConfig.displayLabel}</span>
                  </div>
                </div>

                {/* 4. Products Row (Horizontal Thumbnail Strip - Click chuyển đến trang riêng) */}
                <div className="px-4 sm:px-5 py-2.5">
                  <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                    {order.items?.map((item) => {
                      const productTitle =
                        item.variant?.product?.name ||
                        item.variant?.book?.title ||
                        item.title ||
                        "Sản phẩm";
                      return (
                        <Link
                          key={item.id}
                          href={`/orders/${order.id}`}
                          className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-border/80 bg-white dark:bg-muted/40 p-1 flex items-center justify-center overflow-hidden group shadow-2xs hover:border-primary/50 transition-colors cursor-pointer"
                          title={`${productTitle} (SL: ${item.quantity})`}
                        >
                          {item.variant?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.variant.imageUrl}
                              alt={productTitle}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground/60" />
                          )}
                          {item.quantity > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none shadow-xs">
                              x{item.quantity}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Total Price Row */}
                <div className="px-4 sm:px-5 py-2.5 text-right text-xs sm:text-sm text-foreground space-y-1">
                  <div>
                    <span className="text-muted-foreground">Tổng đơn hàng: </span>
                    <span className="font-bold text-sm sm:text-base text-foreground font-mono">
                      {formatCurrency(Number(order.total))}
                    </span>
                  </div>
                  {Number(order.paidAmount || 0) > 0 && order.paymentStatus !== "PAID" && (
                    <div className="text-xs flex items-center justify-end gap-3 pt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Đã chuyển: {formatCurrency(Number(order.paidAmount))}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">
                        Còn thiếu: {formatCurrency(Number(order.remainingAmount ?? order.total))}
                      </span>
                    </div>
                  )}
                </div>

                {/* 6. Bottom Action Bar (3-column layout) */}
                <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
                  <button
                    type="button"
                    onClick={() => setReturnOrderId(order.id)}
                    className="py-3 px-2 text-center text-xs sm:text-sm font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer select-none"
                  >
                    Yêu cầu đổi trả
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactOrderId(order.id)}
                    className="py-3 px-2 text-center text-xs sm:text-sm font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer select-none"
                  >
                    Liên hệ
                  </button>
                  {order.paymentMethod === "VIETQR" &&
                  order.paymentStatus !== "PAID" &&
                  order.status !== "CANCELLED" ? (
                    <Link
                      href={`/orders/${order.id}/payment`}
                      className="py-3 px-2 text-center text-xs sm:text-sm font-bold text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1 cursor-pointer select-none"
                    >
                      {isPartialPaid
                        ? `Thanh toán nốt`
                        : "Thanh toán VietQR"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="py-3 px-2 text-center text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer select-none"
                    >
                      Mua lại
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
      <Dialog
        open={returnOrderId !== null}
        onOpenChange={(open) => !open && setReturnOrderId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              <span>Yêu cầu đổi trả đơn hàng #{returnOrderId}</span>
            </DialogTitle>
            <DialogDescription>
              Vui lòng chọn lý do và để lại ghi chú. Chúng tôi hỗ trợ đổi trả
              trong vòng 15 ngày kể từ ngày nhận hàng.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <DialogBody className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Lý do đổi trả
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Sản phẩm không vừa size / muốn đổi mẫu">
                    Sản phẩm không vừa size / muốn đổi size
                  </option>
                  <option value="Sản phẩm bị lỗi sản xuất hoặc rách/hỏng">
                    Sản phẩm bị lỗi sản xuất hoặc rách/hỏng
                  </option>
                  <option value="Giao sai mẫu / sai màu sắc với mô tả">
                    Giao sai mẫu / sai màu sắc với mô tả
                  </option>
                  <option value="Đóng gói hư hỏng trong quá trình vận chuyển">
                    Đóng gói hư hỏng trong quá trình vận chuyển
                  </option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Mô tả chi tiết / Số điện thoại liên hệ
                </label>
                <Textarea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="Mô tả cụ thể vấn đề bạn gặp phải để nhân viên hỗ trợ nhanh nhất..."
                  className="text-xs rounded-xl min-h-[90px]"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReturnOrderId(null)}
                className="rounded-xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-semibold"
              >
                Gửi yêu cầu đổi trả
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Support Modal */}
      <Dialog
        open={contactOrderId !== null}
        onOpenChange={(open) => !open && setContactOrderId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              <span>Hỗ trợ đơn hàng #{contactOrderId}</span>
            </DialogTitle>
            <DialogDescription>
              Kênh liên hệ chăm sóc khách hàng chính thức của Fashion Shop.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5 text-xs">
            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">
                    Tổng đài Hotline CSKH
                  </p>
                  <a
                    href="tel:19008198"
                    className="text-primary font-mono font-semibold hover:underline"
                  >
                    1900 8198 (Miễn phí, 8h00 - 21h30 hàng ngày)
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Hộp thư hỗ trợ</p>
                  <a
                    href="mailto:support@fashionshop.vn"
                    className="text-primary font-semibold hover:underline"
                  >
                    support@fashionshop.vn
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">
                    Trung tâm tiếp nhận
                  </p>
                  <p className="text-muted-foreground">
                    115B1 Trần Đình Xu, P. Nguyễn Cư Trinh, Q.1, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setContactOrderId(null)}
              className="w-full rounded-xl text-xs font-semibold"
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
