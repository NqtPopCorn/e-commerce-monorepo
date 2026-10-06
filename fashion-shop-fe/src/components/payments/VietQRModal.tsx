"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useGetVietQRInfo,
  useGetOrderPaymentStatus,
  useSimulatePayment,
} from "@/hooks/usePayments";
import { toast } from "sonner";
import {
  Copy,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building,
  User,
  CreditCard,
  ExternalLink,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onSuccess?: () => void;
}

export function VietQRModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: VietQRModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [isSuccessState, setIsSuccessState] = useState(false);

  // Load QR Details
  const {
    data: qrInfo,
    isLoading: isLoadingQR,
    isError: isQRError,
    refetch: refetchQR,
  } = useGetVietQRInfo(orderId, isOpen && !!orderId);

  // Real-time status polling every 3s
  const {
    data: paymentStatus,
    refetch: refetchStatus,
    isFetching: isCheckingStatus,
  } = useGetOrderPaymentStatus(orderId, {
    enabled: isOpen && !!orderId && !isSuccessState,
    refetchInterval: isOpen && !isSuccessState ? 3000 : false,
  });

  // Partial Payment tracking values
  const totalAmount = Number(
    paymentStatus?.total || qrInfo?.totalOrderAmount || qrInfo?.amount || 0,
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

  // Refetch QR when partial payment arrives
  useEffect(() => {
    if (paymentStatus?.paidAmount !== undefined && paymentStatus.paidAmount > 0) {
      refetchQR();
    }
  }, [paymentStatus?.paidAmount, paymentStatus?.remainingAmount, refetchQR]);

  const simulateMutation = useSimulatePayment();

  const handleSimulateWebhook = async () => {
    if (!orderId) return;
    try {
      const res = await simulateMutation.mutateAsync({
        orderId,
        scenario: "SUCCESS",
      });
      if (res.result?.success) {
        toast.success(
          "[Sandbox] Đã giả lập thanh toán thành công! Đang đối soát...",
        );
        refetchStatus();
        refetchQR();
      } else {
        toast.info(res.result?.message || "[Sandbox] Đã gửi webhook");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Lỗi khi bắn webhook giả lập",
      );
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccessState) return;

    setTimeLeft(15 * 60);
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
  }, [isOpen, isSuccessState]);

  // Payment Status check
  useEffect(() => {
    if (paymentStatus?.paymentStatus === "PAID" && !isSuccessState) {
      setIsSuccessState(true);
      toast.success(
        "Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.",
        {
          duration: 5000,
        },
      );

      if (onSuccess) {
        onSuccess();
      }
    }
  }, [paymentStatus, isSuccessState, onSuccess]);

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsSuccessState(false);
      setCopiedField(null);
    }
  }, [isOpen]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
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
        "Hệ thống đang kiểm tra với ngân hàng. Nếu bạn vừa chuyển tiền, vui lòng đợi 10 - 30 giây.",
      );
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden rounded-3xl border border-border">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  Thanh toán VietQR NAPAS 24/7
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground">
                  Đơn hàng #{orderId} - Quét mã để xác nhận tức thì
                </DialogDescription>
              </div>
            </div>

            {/* Timer */}
            {!isSuccessState && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-mono font-bold text-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {isSuccessState ? (
            /* Success State */
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Thanh toán thành công!
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Cảm ơn bạn! Đơn hàng #{orderId} đã được chuyển sang trạng thái
                  đã xác nhận và đang được chuẩn bị đóng gói.
                </p>
              </div>
              <Button
                onClick={onClose}
                className="rounded-xl px-6 font-semibold shadow-xs"
              >
                Đóng cửa sổ
              </Button>
            </div>
          ) : (
            /* Active QR & Instructions */
            <>
              {/* QR Image Box */}
              <div className="p-3 bg-muted/30 rounded-2xl border border-border flex flex-col items-center justify-center relative">
                {isLoadingQR ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-medium">
                      Đang tạo mã VietQR...
                    </span>
                  </div>
                ) : isQRError ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="w-8 h-8" />
                    <span className="text-xs font-medium text-center">
                      Không thể tải mã QR. Vui lòng chuyển khoản theo thông tin
                      bên dưới.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrInfo?.qrUrl}
                        alt="VietQR NAPAS Payment Code"
                        className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status beacon indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>
                  {isCheckingStatus
                    ? "Đang đối soát giao dịch..."
                    : "Hệ thống tự động kích hoạt sau khi nhận được tiền"}
                </span>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isCheckingStatus}
                  className="ml-1 text-primary hover:underline font-semibold"
                >
                  Kiểm tra ngay
                </button>
              </div>

              {/* Beneficiary Details */}
              <div className="space-y-2 bg-card rounded-xl border border-border p-3.5 text-xs">
                {/* Partial Payment Banner if any */}
                {isPartialPaid && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs mb-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Đã thanh toán một phần
                      </span>
                      <span className="font-mono text-foreground text-[11px]">
                        {Math.round((paidAmount / totalAmount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (paidAmount / totalAmount) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Đã nhận: {formatCurrency(paidAmount)}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        Còn thiếu: {formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    Ngân hàng
                  </span>
                  <span className="font-semibold text-foreground">
                    {qrInfo?.bankName || "MBBank"}
                  </span>
                </div>

                {/* Account Name */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Chủ tài khoản
                  </span>
                  <span className="font-semibold uppercase text-foreground">
                    {qrInfo?.accountName || "FASHION SHOP"}
                  </span>
                </div>

                {/* Account Number */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Số tài khoản
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground">
                      {qrInfo?.accountNo}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary"
                      onClick={() =>
                        handleCopy(qrInfo?.accountNo || "", "số tài khoản")
                      }
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block">
                      {isPartialPaid ? "Còn thiếu cần chuyển" : "Số tiền"}
                    </span>
                    {isPartialPaid && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
                        (Đã trừ {formatCurrency(paidAmount)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-primary font-mono text-sm">
                      {formatCurrency(currentChargeAmount)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary"
                      onClick={() =>
                        handleCopy(String(currentChargeAmount), "số tiền")
                      }
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Memo */}
                <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[10px] font-bold text-primary block uppercase">
                      Nội dung chuyển khoản (bắt buộc):
                    </span>
                    <span className="font-mono font-black text-sm text-foreground">
                      {qrInfo?.transferContent || `DH${orderId}`}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-semibold gap-1 border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
                    onClick={() =>
                      handleCopy(
                        qrInfo?.transferContent || `DH${orderId}`,
                        "nội dung chuyển khoản",
                      )
                    }
                  >
                    <Copy className="w-3 h-3" />
                    Sao chép
                  </Button>
                </div>
              </div>

              {/* Alert */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Lưu ý quan trọng:</strong> Quý khách vui lòng giữ{" "}
                  <span className="underline font-bold">chính xác</span> nội
                  dung chuyển khoản{" "}
                  <span className="font-mono font-bold">
                    {qrInfo?.transferContent || `DH${orderId}`}
                  </span>{" "}
                  để hệ thống tự động nhận diện và xác nhận đơn hàng ngay lập
                  tức.
                </div>
              </div>

              {/* Sandbox Quick Trigger */}
              <div className="p-3 bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-foreground block">
                      Sandbox Simulator
                    </span>
                    <span className="text-muted-foreground block text-[10px]">
                      Test đối soát Webhook ngân hàng
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={simulateMutation.isPending}
                  onClick={handleSimulateWebhook}
                  className="h-8 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm"
                >
                  {simulateMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Giả lập chuyển khoản
                </Button>
              </div>

              {/* Link to dedicated payment page if preferred */}
              {orderId && (
                <div className="text-center pt-1">
                  <Link
                    href={`/orders/${orderId}/payment`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở trang thanh toán toàn màn hình (Sandbox đầy đủ)
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
