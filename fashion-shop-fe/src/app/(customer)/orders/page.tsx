"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { useGetMyOrders } from "@/hooks/useOrders";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  XCircle,
  CheckCircle,
  Truck,
  Tag,
  MapPin,
  Phone,
  User,
  Banknote,
  FileText,
  AlertCircle,
} from "lucide-react";
import { OrderProgressPipeline } from "@/components/orders/OrderProgressPipeline";

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { data, isLoading, error } = useGetMyOrders();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const orders: Order[] = Array.isArray(data) ? (data as Order[]) : [];

  const getStatusConfig = (status: OrderStatus | string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          color: "text-amber-700 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
          icon: Clock,
          step: 1,
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          color: "text-blue-700 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
          icon: Package,
          step: 2,
        };
      case "SHIPPING":
        return {
          label: "Đang giao hàng",
          color: "text-indigo-700 dark:text-indigo-400",
          bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50",
          icon: Truck,
          step: 3,
        };
      case "COMPLETED":
        return {
          label: "Hoàn tất",
          color: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50",
          icon: CheckCircle,
          step: 4,
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "text-rose-700 dark:text-rose-400",
          bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50",
          icon: XCircle,
          step: 0,
        };
      default:
        return {
          label: status,
          color: "text-slate-700 dark:text-slate-400",
          bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
          icon: Package,
          step: 1,
        };
    }
  };

  const getPaymentStatusConfig = (status?: PaymentStatus | string) => {
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

  if (!hasHydrated) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Package className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Đăng nhập để xem đơn hàng
        </h2>
        <p className="text-muted-foreground mb-6 text-sm max-w-sm">
          Vui lòng đăng nhập để theo dõi trạng thái giao hàng và lịch sử đơn mua
          của bạn.
        </p>
        <Link href="/login">
          <Button className="font-semibold px-8 h-11 rounded-xl shadow-xs">
            Đăng nhập ngay
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-4 px-4 sm:px-6">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            ĐƠN HÀNG CỦA TÔI
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi tình trạng xử lý, giao nhận và thông tin thanh toán của các
            đơn hàng.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          {orders.length} đơn hàng
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="text-xs text-muted-foreground font-medium">
            Đang tải danh sách đơn hàng...
          </span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng thử lại sau.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl shadow-xs flex flex-col items-center justify-center border border-border text-center">
          <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            Bạn chưa có đơn hàng nào
          </h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-xs">
            Khám phá các sản phẩm thời trang mới nhất và mua sắm ngay hôm nay!
          </p>
          <Link href="/products">
            <Button className="rounded-xl px-6 h-10 font-semibold shadow-xs">
              MUA SẮM NGAY
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrder === order.id;

            // Shipping recipient fallback if not present in legacy orders
            const displayRecipientName =
              order.recipientName ||
              [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.email;
            const displayRecipientPhone =
              order.recipientPhone || user.phone || "Chưa cập nhật";
            const displayShippingAddress =
              order.shippingAddress || "Chưa cập nhật địa chỉ giao hàng";

            return (
              <div
                key={order.id}
                className={`bg-card rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                {/* Order Summary Header */}
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase">
                        Mã đơn hàng
                      </p>
                      <p className="font-mono font-bold text-foreground text-sm">
                        #{order.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase">
                        Ngày đặt
                      </p>
                      <p className="text-foreground text-xs font-medium">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase">
                        Tổng tiền
                      </p>
                      <p className="font-bold text-primary text-sm">
                        {Number(order.total).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      {/* Order Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} ${statusConfig.bg}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${paymentConfig.color}`}
                      >
                        {paymentConfig.label}
                      </span>
                    </div>

                    <div className="text-muted-foreground p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details Expanded */}
                {isExpanded && (
                  <div className="border-t border-border p-5 sm:p-6 bg-muted/20 space-y-6">
                    {/* Order Progress Stepper */}
                    <OrderProgressPipeline status={order.status} />

                    {/* Section 1: Delivery Information & Payment Method (2 Columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Shipping Info */}
                      <div className="bg-card p-4 sm:p-5 rounded-xl border border-border space-y-3">
                        <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>Thông tin nhận hàng</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-muted-foreground mr-1">
                                Người nhận:
                              </span>
                              <span className="font-semibold text-foreground">
                                {displayRecipientName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-muted-foreground mr-1">
                                Số điện thoại:
                              </span>
                              <span className="font-mono font-medium text-foreground">
                                {displayRecipientPhone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-muted-foreground mr-1">
                                Địa chỉ giao:
                              </span>
                              <span className="text-foreground leading-relaxed">
                                {displayShippingAddress}
                              </span>
                            </div>
                          </div>

                          {order.shippingNote && (
                            <div className="flex items-start gap-2 pt-1 border-t border-border/60">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <span className="text-muted-foreground mr-1">
                                  Ghi chú cho shipper:
                                </span>
                                <span className="text-foreground italic">
                                  &ldquo;{order.shippingNote}&rdquo;
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Payment Info */}
                      <div className="bg-card p-4 sm:p-5 rounded-xl border border-border space-y-3 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
                            <Banknote className="w-4 h-4 text-primary" />
                            <span>Phương thức thanh toán</span>
                          </h4>

                          <div className="space-y-2.5 text-xs pt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Hình thức:
                              </span>
                              <span className="font-semibold text-foreground">
                                {order.paymentMethod === "COD" ||
                                !order.paymentMethod
                                  ? "Thanh toán khi nhận hàng (COD)"
                                  : order.paymentMethod}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                Trạng thái thanh toán:
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${paymentConfig.color}`}
                              >
                                {paymentConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground">
                            Lưu ý thanh toán:
                          </p>
                          <p>
                            Quý khách vui lòng chuẩn bị số tiền mặt tương ứng để
                            thanh toán cho nhân viên giao nhận khi kiểm tra và
                            nhận hàng.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Items List */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                        Sản phẩm trong đơn ({order.items?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {order.items?.map((item) => {
                          const origPrice = Number(
                            item.originalUnitPrice || item.unitPrice || 0,
                          );
                          const prodDisc = Number(item.productDiscount || 0);
                          const finalPrice = Number(
                            item.finalUnitPrice || item.unitPrice || 0,
                          );
                          const itemTotal =
                            (finalPrice > 0 ? finalPrice : origPrice) *
                            item.quantity;
                          const productTitle =
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

                          return (
                            <div
                              key={item.id}
                              className="flex gap-4 items-center bg-card p-3.5 rounded-xl border border-border text-xs"
                            >
                              <div className="w-14 h-16 bg-muted rounded-lg border border-border flex shrink-0 items-center justify-center overflow-hidden">
                                {item.variant?.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.variant.imageUrl}
                                    alt={productTitle}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    No Image
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">
                                  {productTitle}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {item.variant?.sku && (
                                    <span className="font-mono">
                                      SKU: {item.variant.sku}{" "}
                                    </span>
                                  )}
                                  {variantInfo && <span>| {variantInfo} </span>}
                                  | SL: <strong>{item.quantity}</strong>
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {prodDisc > 0 && (
                                  <div className="text-[11px] text-muted-foreground line-through">
                                    {(origPrice * item.quantity).toLocaleString(
                                      "vi-VN",
                                    )}{" "}
                                    đ
                                  </div>
                                )}
                                <div className="font-bold text-primary text-xs">
                                  {itemTotal.toLocaleString("vi-VN")} đ
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 3: Promotions Applied */}
                    {order.promotionApplications &&
                      order.promotionApplications.length > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                          <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <Tag className="w-3.5 h-3.5" /> Ưu đãi đã áp dụng
                          </h5>
                          <div className="space-y-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                            {order.promotionApplications.map((app) => (
                              <div
                                key={app.id}
                                className="flex justify-between items-center"
                              >
                                <span>
                                  • <strong>{app.promotionName}</strong>
                                  {app.promotionCode
                                    ? ` (${app.promotionCode})`
                                    : ""}{" "}
                                  <span className="opacity-70">
                                    [{app.scope}]
                                  </span>
                                </span>
                                <span className="font-bold">
                                  -
                                  {Number(app.discountAmount).toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  đ
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 4: Financial Summary */}
                    <div className="bg-card p-4 rounded-xl border border-border space-y-2 text-xs text-muted-foreground max-w-sm ml-auto shadow-xs">
                      <div className="flex justify-between">
                        <span>Tạm tính gốc:</span>
                        <span className="font-medium text-foreground">
                          {Number(order.subtotal || order.total).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          đ
                        </span>
                      </div>
                      {Number(order.productDiscount) > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>Giảm giá sản phẩm:</span>
                          <span>
                            -
                            {Number(order.productDiscount).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </span>
                        </div>
                      )}
                      {Number(order.orderDiscount) > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>Khuyến mãi hóa đơn:</span>
                          <span>
                            -
                            {Number(order.orderDiscount).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </span>
                        </div>
                      )}
                      {Number(order.voucherDiscount) > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>Voucher giảm giá:</span>
                          <span>
                            -
                            {Number(order.voucherDiscount).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-border pt-2.5 text-sm text-foreground">
                        <span>Tổng thanh toán:</span>
                        <span className="text-primary text-base">
                          {Number(order.total).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
