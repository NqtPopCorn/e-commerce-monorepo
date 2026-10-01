"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { usePromotionQuote } from "@/hooks/usePromotions";
import { useCreateOrder } from "@/hooks/useOrders";
import { useGetMyAddresses, useGetMe } from "@/hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  MapPin,
  Phone,
  User,
  Banknote,
  QrCode,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { VoucherInput } from "@/components/promotions/VoucherInput";
import { PriceBreakdown } from "@/components/promotions/PriceBreakdown";
import { PaymentMethod } from "@/types/order";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const { data: me } = useGetMe();
  const { data: addresses } = useGetMyAddresses();

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  // Pre-fill from default address or user profile
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
      setRecipientName(defaultAddr.recipientName);
      setRecipientPhone(defaultAddr.phone);
      setAddress(
        [
          defaultAddr.street,
          defaultAddr.ward,
          defaultAddr.district,
          defaultAddr.city,
        ]
          .filter(Boolean)
          .join(", "),
      );
    } else if (me) {
      const fullName = [me.firstName, me.lastName].filter(Boolean).join(" ");
      if (fullName) setRecipientName(fullName);
      if (me.phone) setRecipientPhone(me.phone);
    }
  }, [addresses, me]);

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setRecipientName(addr.recipientName);
    setRecipientPhone(addr.phone);
    setAddress(
      [addr.street, addr.ward, addr.district, addr.city]
        .filter(Boolean)
        .join(", "),
    );
  };

  const cartInputs = items.map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
  }));

  const {
    data: quote,
    isLoading: isQuoteLoading,
    refetch: refetchQuote,
  } = usePromotionQuote(cartInputs, voucherCode);

  const createOrderMutation = useCreateOrder();

  const handleApplyVoucher = (code: string) => {
    setVoucherCode(code);
  };

  const handleRemoveVoucher = () => {
    setVoucherCode("");
  };

  // Direct 1-step checkout submission
  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return toast.error("Giỏ hàng đang trống.");
    if (!hasHydrated) return;

    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt hàng.");
      router.push("/login");
      return;
    }

    if (!recipientName.trim()) {
      return toast.error("Vui lòng nhập họ tên người nhận hàng");
    }
    if (!recipientPhone.trim()) {
      return toast.error("Vui lòng nhập số điện thoại người nhận hàng");
    }
    if (!address.trim()) {
      return toast.error("Vui lòng nhập địa chỉ giao hàng");
    }

    setSubmitting(true);
    try {
      const createdOrder = await createOrderMutation.mutateAsync({
        items: cartInputs,
        voucherCode: voucherCode || undefined,
        paymentMethod: paymentMethod,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        shippingAddress: address.trim(),
        shippingNote: shippingNote.trim() || undefined,
      });

      clear();

      if (paymentMethod === "VIETQR") {
        toast.success(
          "Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán VietQR...",
        );
        router.push(`/orders/${createdOrder.id}/payment`);
      } else {
        toast.success("Đặt hàng thành công! Đơn hàng COD đã được ghi nhận.");
        router.push(`/orders/${createdOrder.id}`);
      }
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        "Không thể tạo đơn hàng. Vui lòng kiểm tra lại.";
      toast.error(msg);
      refetchQuote();
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Thanh toán</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Giỏ hàng của bạn đang trống.
        </p>
        <Link href="/cart">
          <Button variant="outline">Quay lại giỏ hàng</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Link
          href="/cart"
          className="hover:text-foreground flex items-center transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại giỏ hàng
        </Link>
      </div>

      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
          Thông tin đặt hàng
        </h1>
        <span className="text-xs text-muted-foreground">
          Điền địa chỉ giao hàng và lựa chọn phương thức thanh toán
        </span>
      </div>

      {/* Direct Checkout Form */}
      <form
        onSubmit={handlePlaceOrder}
        className="flex flex-col lg:flex-row gap-6"
      >
        {/* Left Column: Form & Address & Payment */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-card p-6 rounded-2xl shadow-xs border border-border space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>THÔNG TIN GIAO HÀNG</span>
              </h2>
              {addresses && addresses.length > 0 && (
                <Link
                  href="/profile"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Quản lý sổ địa chỉ
                </Link>
              )}
            </div>

            {/* Saved Addresses Quick Selection */}
            {addresses && addresses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Chọn từ sổ địa chỉ đã lưu:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border hover:border-muted-foreground/30 bg-muted/20"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {addr.recipientName}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.2 rounded-full">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {addr.phone}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 mt-1">
                            {[addr.street, addr.ward, addr.district, addr.city]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="recipientName"
                  className="text-xs font-semibold"
                >
                  Họ và tên người nhận{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="recipientName"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="pl-9 h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="recipientPhone"
                  className="text-xs font-semibold"
                >
                  Số điện thoại người nhận{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="recipientPhone"
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="pl-9 h-11 text-xs font-mono rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold">
                Địa chỉ chi tiết (Số nhà, tên đường, phường/xã, quận/huyện,
                tỉnh/thành) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  className="pl-9 h-11 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shippingNote" className="text-xs font-semibold">
                Ghi chú giao hàng (Không bắt buộc)
              </Label>
              <Input
                id="shippingNote"
                value={shippingNote}
                onChange={(e) => setShippingNote(e.target.value)}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                className="h-11 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-card p-6 rounded-2xl shadow-xs border border-border space-y-4">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <span>PHƯƠNG THỨC THANH TOÁN</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                Chọn phương thức phù hợp
              </span>
            </div>

            <div className="space-y-3">
              {/* Method 1: COD */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === "COD"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border hover:border-muted-foreground/30 bg-muted/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentMethod === "COD"
                      ? "border-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {paymentMethod === "COD" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-primary" />
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng
                    khi nhận và kiểm tra kiện hàng.
                  </p>
                </div>
              </div>

              {/* Method 2: VietQR */}
              <div
                onClick={() => setPaymentMethod("VIETQR")}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === "VIETQR"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border hover:border-muted-foreground/30 bg-muted/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentMethod === "VIETQR"
                      ? "border-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {paymentMethod === "VIETQR" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      Chuyển khoản VietQR (Ngân hàng 24/7)
                    </span>
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Khuyên dùng - Nhanh chóng
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử bất kỳ.
                    Hệ thống tự động xác nhận đơn hàng ngay khi tiền về tài
                    khoản.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-card p-6 rounded-2xl shadow-xs border border-border sticky top-24 space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase border-b border-border pb-2">
              Đơn hàng của bạn ({items.length} sản phẩm)
            </h2>

            {/* Items Summary */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="w-14 h-18 bg-muted border border-border rounded-lg flex shrink-0 items-center justify-center relative overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        No Image
                      </span>
                    )}
                    <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      {item.productName || item.title}
                    </p>
                    {(item.size || item.color) && (
                      <p className="text-[11px] text-muted-foreground">
                        {[item.size, item.color].filter(Boolean).join(" - ")}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-primary">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="border-t border-border pt-2">
              <VoucherInput
                appliedCode={voucherCode}
                voucherError={quote?.voucherError}
                voucherDiscount={quote?.voucherDiscount}
                onApply={handleApplyVoucher}
                onRemove={handleRemoveVoucher}
              />
            </div>

            {/* Price Breakdown */}
            <PriceBreakdown quote={quote} isLoading={isQuoteLoading} />

            {/* Direct Submit Button */}
            <Button
              disabled={isQuoteLoading || !hasHydrated || submitting}
              type="submit"
              className="w-full h-12 text-sm font-bold shadow-md disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý đơn hàng...</span>
                </div>
              ) : paymentMethod === "VIETQR" ? (
                <>
                  <span>TIẾP TỤC THANH TOÁN VIETQR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>ĐẶT HÀNG NGAY (COD)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bảo mật thông tin đơn hàng 100%</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
