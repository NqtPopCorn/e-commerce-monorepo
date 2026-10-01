"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { useGetOrder } from "@/hooks/useOrders";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
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
  QrCode,
  Store,
  RotateCcw,
  Headphones,
  Mail,
} from "lucide-react";
import { OrderProgressPipeline } from "@/components/orders/OrderProgressPipeline";
import { VietQRModal } from "@/components/payments/VietQRModal";
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
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const user = useAuthStore((state) => state.user);
  const addToCart = useCartStore((state) => state.add);

  const { data: order, isLoading, error, refetch } = useGetOrder(orderId);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<string>(
    "Sản phẩm không vừa size / muốn đổi mẫu",
  );
  const [returnNote, setReturnNote] = useState<string>("");

  const getStatusConfig = (status?: OrderStatus | string) => {
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
          label: status || "N/A",
          color: "text-slate-700 dark:text-slate-400",
          bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
          icon: Package,
          displayLabel: status || "N/A",
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

  const handleReorder = () => {
    if (!order?.items || order.items.length === 0) {
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
    toast.success(
      `Yêu cầu đổi trả cho đơn hàng #${orderId} đã được gửi. Đội ngũ CSKH sẽ liên hệ với bạn trong 24h!`,
    );
    setReturnModalOpen(false);
    setReturnNote("");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground font-medium">
          Đang tải chi tiết đơn hàng #{orderId}...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-4">
        <Link
          href="/profile?tab=orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </Link>
        <div className="p-12 text-center bg-card rounded-2xl border border-destructive/20 space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="font-bold text-base text-foreground">
            Không tìm thấy thông tin đơn hàng #{orderId}
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Đơn hàng không tồn tại hoặc bạn không có quyền truy cập đơn hàng
            này.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl text-xs"
            >
              Thử lại
            </Button>
            <Link href="/profile?tab=orders">
              <Button size="sm" className="rounded-xl text-xs">
                Xem tất cả đơn hàng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
  const StatusIcon = statusConfig.icon;

  const displayRecipientName =
    order.recipientName ||
    (user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "") ||
    user?.email ||
    "Khách hàng";
  const displayRecipientPhone =
    order.recipientPhone || user?.phone || "Chưa cập nhật";
  const displayShippingAddress =
    order.shippingAddress || "Chưa cập nhật địa chỉ giao hàng";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* 1. Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/profile?tab=orders"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 px-3.5 rounded-xl bg-card border border-border hover:bg-muted shadow-2xs w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReturnModalOpen(true)}
            className="rounded-xl text-xs h-9"
          >
            Yêu cầu đổi trả
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setContactModalOpen(true)}
            className="rounded-xl text-xs h-9"
          >
            Liên hệ CSKH
          </Button>
        </div>
      </div>

      {/* 2. Order Header Card */}
      <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Chi tiết đơn hàng
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-mono mt-0.5">
            #{order.id}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Ngày đặt: {formatDateTime(order.createdAt)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} ${statusConfig.bg}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.displayLabel}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${paymentConfig.color}`}
          >
            {paymentConfig.label}
          </span>
        </div>
      </div>

      {/* 3. Section: TIẾN TRÌNH ĐƠN HÀNG */}
      <div className="w-full">
        <OrderProgressPipeline status={order.status} />
      </div>

      {/* 4. Section: THÔNG TIN NHẬN HÀNG & HÌNH THỨC THANH TOÁN (2-COL GRID) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thông tin nhận hàng */}
        <div className="w-full bg-card p-5 rounded-2xl border border-border space-y-3 shadow-xs">
          <h2 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Thông tin nhận hàng</span>
          </h2>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-foreground shrink-0" />
              <span className="font-semibold text-foreground text-sm">
                {displayRecipientName}
              </span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-foreground shrink-0" />
              <span className="font-mono text-foreground">
                {displayRecipientPhone}
              </span>
            </p>
            <p className="flex items-start gap-2.5 pt-0.5">
              <MapPin className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <span className="text-foreground leading-relaxed">
                {displayShippingAddress}
              </span>
            </p>
            {order.shippingNote && (
              <div className="text-xs italic bg-muted/40 p-2.5 rounded-xl border border-border/60 text-foreground mt-2">
                Ghi chú: {order.shippingNote}
              </div>
            )}
          </div>
        </div>

        {/* Hình thức thanh toán */}
        <div className="w-full bg-card p-5 rounded-2xl border border-border space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-2.5">
            <h2 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
              <Banknote className="w-4 h-4 text-primary" />
              <span>Hình thức thanh toán</span>
            </h2>
            <div className="flex justify-between items-center text-xs py-0.5">
              <span className="text-muted-foreground">Phương thức:</span>
              <span className="font-semibold text-foreground">
                {order.paymentMethod === "VIETQR"
                  ? "Chuyển khoản ngân hàng (VietQR)"
                  : order.paymentMethod === "COD" || !order.paymentMethod
                    ? "Thanh toán khi nhận hàng (COD)"
                    : order.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs py-0.5">
              <span className="text-muted-foreground">
                Trạng thái thanh toán:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${paymentConfig.color}`}
              >
                {paymentConfig.label}
              </span>
            </div>

            {order.paymentMethod === "VIETQR" &&
              order.paymentStatus === "UNPAID" &&
              order.status !== "CANCELLED" && (
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/orders/${order.id}/payment`}
                    className="flex-1 inline-flex items-center justify-center text-xs font-semibold gap-1.5 rounded-xl py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Trang thanh toán VietQR
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setIsQRModalOpen(true)}
                    className="text-xs font-semibold gap-1 rounded-xl py-2 px-3 border-border hover:bg-muted"
                  >
                    Mã QR nhanh
                  </Button>
                </div>
              )}
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground mt-3">
            {order.paymentMethod === "VIETQR" && order.paymentStatus === "PAID"
              ? "Đơn hàng đã được thanh toán thành công qua chuyển khoản ngân hàng VietQR."
              : order.paymentMethod === "VIETQR"
                ? `Vui lòng quét mã QR chuyển khoản với cú pháp DH${order.id}. Hệ thống tự động xác nhận sau 10 giây.`
                : "Quý khách vui lòng chuẩn bị số tiền tương ứng để thanh toán cho shipper khi nhận và kiểm hàng."}
          </div>
        </div>
      </div>

      {/* 5. Section: CHI TIẾT SẢN PHẨM */}
      <div className="w-full space-y-3">
        <h2 className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-wider">
          Chi tiết sản phẩm ({order.items?.length || 0})
        </h2>
        <div className="w-full space-y-2.5">
          {order.items?.map((item) => {
            const origPrice = Number(
              item.originalUnitPrice || item.unitPrice || 0,
            );
            const prodDisc = Number(item.productDiscount || 0);
            const finalPrice = Number(
              item.finalUnitPrice || item.unitPrice || 0,
            );
            const itemTotal =
              (finalPrice > 0 ? finalPrice : origPrice) * item.quantity;
            const productTitle =
              item.variant?.product?.name ||
              item.variant?.book?.title ||
              item.title ||
              "Sản phẩm";
            const variantInfo = [item.variant?.size, item.variant?.color]
              .filter(Boolean)
              .join(" - ");

            return (
              <div
                key={item.id}
                className="w-full flex gap-4 items-center bg-card p-4 rounded-2xl border border-border text-xs shadow-xs"
              >
                <div className="relative w-14 sm:w-16 aspect-[3/4] bg-muted/40 rounded-xl border border-border flex shrink-0 items-center justify-center overflow-hidden">
                  {item.variant?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.variant.imageUrl}
                      alt={productTitle}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {productTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.variant?.sku && (
                      <span className="font-mono">
                        SKU: {item.variant.sku}{" "}
                      </span>
                    )}
                    {variantInfo && <span>| {variantInfo} </span>}| Số lượng:{" "}
                    <strong>{item.quantity}</strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {prodDisc > 0 && (
                    <div className="text-xs text-muted-foreground line-through">
                      {formatCurrency(origPrice * item.quantity)}
                    </div>
                  )}
                  <div className="font-bold text-primary text-sm sm:text-base font-mono">
                    {formatCurrency(itemTotal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Section: Ưu đãi áp dụng (nếu có) */}
      {((order.discountApplications && order.discountApplications.length > 0) ||
        (order.voucherApplications && order.voucherApplications.length > 0) ||
        (order.promotionApplications && order.promotionApplications.length > 0)) && (
        <div className="w-full bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2 shadow-xs">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" /> Ưu đãi áp dụng
          </h3>
          <div className="space-y-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            {order.discountApplications?.map((app) => (
              <div key={`discount-${app.id}`} className="flex justify-between items-center">
                <span>Ưu đãi sản phẩm: {app.discountName}</span>
                <span className="font-semibold font-mono">
                  -{formatCurrency(Number(app.discountAmount))}
                </span>
              </div>
            ))}
            {order.voucherApplications?.map((app) => (
              <div key={`voucher-${app.id}`} className="flex justify-between items-center">
                <span>Voucher: {app.voucherCode} ({app.voucherName})</span>
                <span className="font-semibold font-mono">
                  -{formatCurrency(Number(app.discountAmount))}
                </span>
              </div>
            ))}
            {order.promotionApplications?.map((app) => (
              <div key={`promo-${app.id}`} className="flex justify-between items-center">
                <span>{app.promotionName || "Khuyến mãi"}</span>
                <span className="font-semibold font-mono">
                  -{formatCurrency(Number(app.discountAmount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Section: GHI CHÚ THANH TOÁN & BẢNG TÍNH TIỀN */}
      <div className="w-full bg-card p-5 sm:p-6 rounded-2xl border border-border text-xs shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2 text-muted-foreground border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Ghi chú thanh toán</span>
            </div>
            <p className="text-xs leading-relaxed">
              {order.paymentMethod === "VIETQR"
                ? "Đơn hàng thanh toán chuyển khoản VietQR tự động khớp giao dịch qua tài khoản ngân hàng."
                : "Đơn hàng thanh toán khi nhận hàng (COD). Vui lòng chuẩn bị tiền mặt khi bưu tá giao tới."}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Miễn phí vận chuyển toàn quốc cho đơn hàng thời trang.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Tạm tính hàng hóa:</span>
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(Number(order.subtotal))}
              </span>
            </div>
            {Number(order.productDiscount) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                <span>Giảm giá sản phẩm:</span>
                <span className="font-mono">
                  -{formatCurrency(Number(order.productDiscount))}
                </span>
              </div>
            )}
            {Number(order.voucherDiscount) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                <span>Voucher giảm giá:</span>
                <span className="font-mono">
                  -{formatCurrency(Number(order.voucherDiscount))}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-border pt-3 text-sm sm:text-base text-foreground">
              <span>Tổng thanh toán:</span>
              <span className="text-primary font-mono text-lg">
                {formatCurrency(Number(order.total))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Bottom Action Buttons Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link href="/profile?tab=orders">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Danh sách đơn hàng</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReturnModalOpen(true)}
            className="rounded-xl text-xs"
          >
            Yêu cầu đổi trả
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setContactModalOpen(true)}
            className="rounded-xl text-xs"
          >
            Liên hệ CSKH
          </Button>
          {order.paymentStatus === "UNPAID" &&
          order.paymentMethod === "VIETQR" &&
          order.status !== "CANCELLED" ? (
            <Link href={`/orders/${order.id}/payment`}>
              <Button
                size="sm"
                className="rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                Thanh toán VietQR ngay
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={handleReorder}
              className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Mua lại đơn này
            </Button>
          )}
        </div>
      </div>

      {/* Quick VietQR Modal popup */}
      <VietQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        orderId={order.id}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Return Request Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              <span>Yêu cầu đổi trả đơn hàng #{order.id}</span>
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
                onClick={() => setReturnModalOpen(false)}
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
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              <span>Hỗ trợ đơn hàng #{order.id}</span>
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
              onClick={() => setContactModalOpen(false)}
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
