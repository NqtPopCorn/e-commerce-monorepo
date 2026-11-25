"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useGetOrder } from "@/hooks/useOrders";
import {
  useGetVietQRInfo,
  useGetOrderPaymentStatus,
} from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building,
  User,
  CreditCard,
  Download,
  ArrowRight,
  Package,
  MapPin,
  Phone,
  HelpCircle,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { VietQRSandboxSimulator } from "@/components/payments/VietQRSandboxSimulator";

export default function OrderPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins countdown
  const [isSuccessState, setIsSuccessState] = useState(false);

  // Load Order Details
  const { data: order, isLoading: isLoadingOrder } = useGetOrder(orderId);

  // Load VietQR Details
  const {
    data: qrInfo,
    isLoading: isLoadingQR,
    isError: isQRError,
    refetch: refetchQR,
  } = useGetVietQRInfo(orderId, !!orderId);

  // Real-time Polling Payment Status
  const {
    data: paymentStatus,
    refetch: refetchStatus,
    isFetching: isCheckingStatus,
  } = useGetOrderPaymentStatus(orderId, {
    enabled: !!orderId && !isSuccessState,
    refetchInterval: isSuccessState ? false : 3000,
  });

  // Partial Payment tracking values
  const totalAmount = Number(
    paymentStatus?.total || qrInfo?.totalOrderAmount || order?.total || 0,
  );
  const paidAmount = Number(
    paymentStatus?.paidAmount ?? qrInfo?.paidAmount ?? 0,
  );
  const remainingAmount = Number(
    paymentStatus?.remainingAmount ??
      qrInfo?.remainingAmount ??
      Math.max(0, totalAmount - paidAmount),
  );
  const isPartialPaid = paidAmount > 0 && remainingAmount > 0;
  const currentChargeAmount = isPartialPaid
    ? remainingAmount
    : Number(qrInfo?.amount || totalAmount);

  // When paymentStatus updates with partial payment, refetch QR to reflect remaining amount
  useEffect(() => {
    if (paymentStatus?.paidAmount !== undefined && paymentStatus.paidAmount > 0) {
      refetchQR();
    }
  }, [paymentStatus?.paidAmount, paymentStatus?.remainingAmount, refetchQR]);

  // Countdown timer
  useEffect(() => {
    if (isSuccessState) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccessState]);

  // Payment Status check
  useEffect(() => {
    if (
      (paymentStatus?.paymentStatus === "PAID" ||
        order?.paymentStatus === "PAID") &&
      !isSuccessState
    ) {
      setIsSuccessState(true);
      toast.success(
        "Thanh toán thành công! Đơn hàng của bạn đã được chuyển sang trạng thái đã xác nhận.",
        { duration: 6000 },
      );
    }
  }, [paymentStatus, order, isSuccessState]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldName ? null : curr));
    }, 2000);
  };

  const handleManualCheck = async () => {
    const res = await refetchStatus();
    if (res.data?.paymentStatus === "PAID") {
      setIsSuccessState(true);
      toast.success("Thanh toán thành công!");
    } else {
      toast.info(
        "Hệ thống đang kiểm tra giao dịch với ngân hàng. Nếu bạn vừa chuyển tiền, vui lòng đợi 10 - 30 giây để ngân hàng xử lý giao dịch.",
      );
    }
  };

  const handleDownloadQR = () => {
    if (!qrInfo?.qrUrl) return;
    const link = document.createElement("a");
    link.href = qrInfo.qrUrl;
    link.download = `VietQR_DH${orderId}.png`;
    link.target = "_blank";
    link.click();
    toast.success("Đang mở mã QR để tải về");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!hasHydrated || isLoadingOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          Đang tải thông tin thanh toán đơn hàng #{orderId}...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Không tìm thấy đơn hàng #{orderId}
        </h1>
        <p className="text-xs text-muted-foreground">
          Đơn hàng không tồn tại hoặc bạn không có quyền truy cập vào thông tin
          này.
        </p>
        <Link href="/profile?tab=orders">
          <Button variant="outline" className="rounded-xl mt-2">
            Quay lại danh sách đơn hàng
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Breadcrumb / Top Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
        <Link
          href="/profile?tab=orders"
          className="hover:text-foreground flex items-center transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách đơn mua
        </Link>
        <div className="flex items-center gap-2">
          <span>Mã đơn:</span>
          <span className="font-mono font-bold text-foreground">
            #{order.id}
          </span>
        </div>
      </div>

      {isSuccessState ? (
        /* SUCCESS CELEBRATION VIEW */
        <div className="bg-card rounded-3xl border border-border p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 shadow-lg">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              Thanh toán thành công
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Đơn hàng #{order.id} đã được xác nhận!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Cảm ơn quý khách đã mua sắm tại Fashion Shop. Hệ thống đã tự động
              ghi nhận thanh toán và chuyển đơn hàng sang trạng thái đóng gói.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="bg-muted/30 rounded-2xl border border-border p-4 text-xs space-y-2.5 text-left max-w-md mx-auto">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">
                Số tiền đã thanh toán:
              </span>
              <span className="font-bold text-sm text-primary font-mono">
                {formatCurrency(Number(order.total))}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Phương thức:</span>
              <span className="font-semibold text-foreground">
                Chuyển khoản VietQR NAPAS 24/7
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Người nhận hàng:</span>
              <span className="font-semibold text-foreground">
                {order.recipientName} ({order.recipientPhone})
              </span>
            </div>
            <div className="flex justify-between items-start py-1">
              <span className="text-muted-foreground shrink-0">
                Địa chỉ giao:
              </span>
              <span className="font-medium text-foreground text-right pl-3">
                {order.shippingAddress}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/profile?tab=orders" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-xl px-8 h-11 font-bold shadow-md gap-2">
                <Package className="w-4 h-4" />
                Xem đơn hàng của tôi
              </Button>
            </Link>
            <Link href="/products" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-xl px-8 h-11 font-medium"
              >
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* MAIN PAYMENT WORKSPACE VIEW */
        <div className="space-y-6">
          <VietQRSandboxSimulator
            orderId={order.id}
            expectedAmount={currentChargeAmount}
            transferContent={qrInfo?.transferContent || `DH${order.id}`}
            accountNo={qrInfo?.accountNo || "0987654321"}
            bankName={qrInfo?.bankName}
            onSimulationSuccess={() => {
              refetchStatus();
              refetchQR();
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: QR Code Hero Presentation */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-lg relative overflow-hidden flex flex-col items-center text-center space-y-5">
              {/* Header Badge */}
              <div className="flex items-center justify-between w-full border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Cổng thanh toán VietQR
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                      Chuẩn NAPAS 24/7 Liên ngân hàng
                    </p>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-mono font-bold text-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* QR Image Box */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border w-full flex flex-col items-center justify-center relative">
                {isLoadingQR ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-medium">
                      Đang tạo mã QR...
                    </span>
                  </div>
                ) : isQRError ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="w-8 h-8" />
                    <span className="text-xs font-medium max-w-xs">
                      Không thể hiển thị ảnh QR. Vui lòng chuyển khoản thủ công
                      theo số tài khoản ở khung bên cạnh.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrInfo?.qrUrl}
                        alt="VietQR NAPAS Payment Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                      />
                    </div>

                    {isPartialPaid && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>
                          Mã QR đã nạp số tiền còn lại:{" "}
                          {formatCurrency(remainingAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQR}
                        className="h-8 text-[11px] font-semibold rounded-xl gap-1.5 border-border hover:bg-muted"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Lưu ảnh mã QR
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleManualCheck}
                        disabled={isCheckingStatus}
                        className="h-8 text-[11px] font-semibold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isCheckingStatus ? "animate-spin" : ""
                          }`}
                        />
                        Kiểm tra thanh toán
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 w-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="font-medium text-foreground">
                  {isCheckingStatus
                    ? "Đang đối soát giao dịch..."
                    : "Đang chờ ngân hàng xác nhận giao dịch..."}
                </span>
              </div>

              {/* Security Seal */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Hỗ trợ tất cả ứng dụng Ngân hàng (MB, VCB, TCB, VPB...) & Ví
                  điện tử
                </span>
              </div>
            </div>

            {/* Quick 3-step Guide */}
            <div className="bg-card rounded-2xl border border-border p-5 text-xs space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>3 Bước thanh toán đơn giản</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground pt-1">
                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-1">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      1
                    </span>
                    Quét mã
                  </span>
                  <p className="text-[11px]">
                    Mở app ngân hàng, chọn tính năng quét QR
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-1">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      2
                    </span>
                    Kiểm tra
                  </span>
                  <p className="text-[11px]">
                    Xác nhận số tiền và nội dung chuyển khoản
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-1">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      3
                    </span>
                    Hoàn tất
                  </span>
                  <p className="text-[11px]">
                    Hệ thống tự động kích hoạt đơn hàng sau 10s
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Details & Order Summary */}
          <div className="lg:col-span-6 space-y-5">
            {/* Account Details Box */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-4">
              <div className="border-b border-border pb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  <span>Thông tin chuyển khoản thụ hưởng</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Partial Payment Progress Banner */}
                {isPartialPaid && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Đã thanh toán một phần
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {Math.round((paidAmount / totalAmount) * 100)}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (paidAmount / totalAmount) * 100,
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-amber-500/20">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Đã chuyển (đã nhận):
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(paidAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[10px]">
                          Còn thiếu cần nộp:
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                          {formatCurrency(remainingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Name */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Ngân hàng
                  </span>
                  <span className="font-bold text-foreground text-right">
                    {qrInfo?.bankName || "MBBank (Ngân hàng Quân Đội)"}
                  </span>
                </div>

                {/* Account Holder */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Chủ tài khoản
                  </span>
                  <span className="font-bold uppercase text-foreground text-right tracking-wide">
                    {qrInfo?.accountName || "FASHION SHOP OFFICIAL"}
                  </span>
                </div>

                {/* Account Number */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Số tài khoản
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-foreground">
                      {qrInfo?.accountNo}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                      onClick={() =>
                        handleCopy(qrInfo?.accountNo || "", "số tài khoản")
                      }
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Transfer Amount */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span>
                        {isPartialPaid
                          ? "Số tiền còn thiếu cần chuyển"
                          : "Số tiền cần chuyển"}
                      </span>
                    </span>
                    {isPartialPaid && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
                        (Đã trừ {formatCurrency(paidAmount)} đã nhận)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-primary font-mono">
                      {formatCurrency(currentChargeAmount)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                      onClick={() =>
                        handleCopy(
                          String(currentChargeAmount),
                          "số tiền",
                        )
                      }
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Transfer Content / Memo */}
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">
                      NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):
                    </span>
                    <span className="font-mono font-black text-base text-foreground tracking-wider block">
                      {qrInfo?.transferContent || `DH${order.id}`}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
                    onClick={() =>
                      handleCopy(
                        qrInfo?.transferContent || `DH${order.id}`,
                        "nội dung chuyển khoản",
                      )
                    }
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép
                  </Button>
                </div>
              </div>

              {/* Critical Alert */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Chú ý:</strong> Quý khách vui lòng giữ{" "}
                  <span className="underline font-bold">chính xác</span> nội
                  dung chuyển khoản{" "}
                  <span className="font-mono font-bold">
                    {qrInfo?.transferContent || `DH${order.id}`}
                  </span>{" "}
                  để hệ thống tự động nhận diện và kích hoạt đơn hàng trong vài
                  giây.
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span>
                  Sản phẩm trong đơn hàng ({order.items?.length || 0})
                </span>
              </h3>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {order.items?.map((item) => {
                  const productTitle =
                    item.variant?.product?.name || item.title || "Sản phẩm";
                  const variantInfo = [item.variant?.size, item.variant?.color]
                    .filter(Boolean)
                    .join(" - ");

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 bg-muted/20 rounded-xl border border-border/50 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 aspect-[3/4] bg-muted rounded-lg border border-border flex shrink-0 items-center justify-center overflow-hidden">
                          {item.variant?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.variant.imageUrl}
                              alt={productTitle}
                              className="absolute inset-0 w-full h-full object-cover object-center"
                            />
                          ) : (
                            <span className="text-[9px] text-muted-foreground">
                              No Pic
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {productTitle}
                          </p>
                          {variantInfo && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {variantInfo}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-muted-foreground block">
                          x{item.quantity}
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {formatCurrency(
                            Number(item.finalUnitPrice || item.unitPrice),
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery info summary */}
              <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    Người nhận:{" "}
                    <strong className="text-foreground">
                      {order.recipientName} ({order.recipientPhone})
                    </strong>
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{order.shippingAddress}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
