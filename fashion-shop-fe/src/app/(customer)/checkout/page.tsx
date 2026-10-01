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
  CheckCircle2,
  Banknote,
  QrCode,
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        router.push(`/orders/${createdOrder.id}/payment`);
      } else {
        toast.success("Đặt hàng thành công!");
        router.push("/orders");
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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4 px-4 sm:px-6">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Link
          href="/cart"
          className="hover:text-foreground flex items-center transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại giỏ hàng
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-foreground uppercase border-b border-border pb-4">
        Thanh toán đơn hàng
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form & Address */}
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
                        {isSelected && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đang chọn địa chỉ này</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Inputs */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="recipientName"
                    className="text-xs font-medium"
                  >
                    Họ tên người nhận{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="recipientName"
                      required
                      placeholder="Nguyễn Văn A"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
                        setSelectedAddressId(null);
                      }}
                      className="pl-8 text-xs h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="recipientPhone"
                    className="text-xs font-medium"
                  >
                    Số điện thoại nhận hàng{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="recipientPhone"
                      type="tel"
                      required
                      placeholder="0901 234 567"
                      value={recipientPhone}
                      onChange={(e) => {
                        setRecipientPhone(e.target.value);
                        setSelectedAddressId(null);
                      }}
                      className="pl-8 text-xs h-10 font-mono rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-medium">
                  Địa chỉ giao hàng chi tiết{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="address"
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSelectedAddressId(null);
                  }}
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                  rows={2}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shippingNote" className="text-xs font-medium">
                  Ghi chú cho shipper (Tùy chọn)
                </Label>
                <Input
                  id="shippingNote"
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  placeholder="Ví dụ: Gọi trước khi giao, giao trong giờ hành chính..."
                  className="text-xs h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl shadow-xs border border-border space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              <span>PHƯƠNG THỨC THANH TOÁN</span>
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {/* COD Option */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3.5 border ${
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
                    <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Tiền mặt
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng
                    khi nhận hàng. Quý khách được quyền kiểm tra tình trạng hàng
                    trước khi thanh toán.
                  </p>
                </div>
              </div>

              {/* VietQR Option */}
              <div
                onClick={() => setPaymentMethod("VIETQR")}
                className={`rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3.5 border ${
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
                  <div className="w-14 aspect-[3/4] bg-muted border border-border rounded-lg flex shrink-0 items-center justify-center relative overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        No Image
                      </span>
                    )}
                    <span className="absolute -top-1 -right-1 z-10 bg-foreground text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
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

            <Button
              disabled={submitting || isQuoteLoading || !hasHydrated}
              type="submit"
              className="w-full h-12 text-sm font-bold shadow-md disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl"
            >
              {submitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
