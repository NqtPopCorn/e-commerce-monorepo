"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { usePromotionQuote } from "@/hooks/usePromotions";
import { useCreateOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin } from "lucide-react";
import { VoucherInput } from "@/components/promotions/VoucherInput";
import { PriceBreakdown } from "@/components/promotions/PriceBreakdown";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

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
    if (!hasHydrated) {
      return;
    }
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt hàng.");
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      await createOrderMutation.mutateAsync({
        items: cartInputs,
        voucherCode: voucherCode || undefined,
      });

      clear();
      toast.success("Đặt hàng thành công!");
      router.push("/orders");
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        "Không thể tạo đơn hàng. Vui lòng kiểm tra lại.";
      toast.error(msg);
      // Re-quote price without clearing cart
      refetchQuote();
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Thanh toán</h1>
        <p className="text-gray-500 mb-6">Giỏ hàng đang trống.</p>
        <Link href="/cart">
          <Button
            variant="outline"
            className="text-[#c92127] border-[#c92127] hover:bg-red-50"
          >
            Quay lại giỏ hàng
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Link
          href="/cart"
          className="hover:text-[#c92127] flex items-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại giỏ hàng
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 uppercase border-b pb-4">
        Thanh toán
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form & Address */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#c92127]" /> ĐỊA CHỈ GIAO HÀNG
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:border-[#c92127] focus:ring-1 focus:ring-[#c92127] transition-shadow"
                  rows={3}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              PHƯƠNG THỨC THANH TOÁN
            </h2>
            <div className="border border-[#c92127] rounded-md p-4 bg-red-50 relative flex items-center gap-3">
              <div className="absolute -left-1 w-2 h-full bg-[#c92127] top-0 rounded-l-md"></div>
              <div className="w-5 h-5 rounded-full border-4 border-[#c92127] bg-white flex shrink-0"></div>
              <span className="font-medium text-gray-800">
                Thanh toán bằng tiền mặt khi nhận hàng (COD)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 uppercase border-b pb-2">
              Đơn hàng của bạn
            </h2>

            {/* Items Summary */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="w-14 h-18 bg-gray-100 border rounded flex shrink-0 items-center justify-center relative overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400">No Image</span>
                    )}
                    <span className="absolute -top-1 -right-1 bg-slate-700 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-sm font-bold text-[#c92127]">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="border-t pt-2">
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
              className="w-full bg-[#c92127] hover:bg-red-700 text-white h-14 text-xl font-bold shadow-md disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
