"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart.store";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePromotionQuote } from "@/hooks/usePromotions";
import { PriceBreakdown } from "@/components/promotions/PriceBreakdown";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.remove);
  const setQuantity = useCartStore((state) => state.setQuantity);

  const cartInputs = items.map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
  }));

  const { data: quote, isLoading: isQuoteLoading } = usePromotionQuote(cartInputs);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const quoteLineMap = new Map(
    quote?.lines.map((l) => [l.variantId, l]) || [],
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800 uppercase">
        Giỏ hàng ({totalItems} sản phẩm)
      </h1>

      {items.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm flex flex-col items-center justify-center">
          <img
            src="https://cdn0.fahasa.com/skin//frontend/ma_vanese/fahasa/images/checkout_cart/ico_emptycart.svg"
            alt="Empty Cart"
            className="w-40 mb-4"
          />
          <p className="text-gray-500 mb-6 text-lg">
            Chưa có sản phẩm trong giỏ hàng của bạn.
          </p>
          <Link href="/">
            <Button className="bg-[#c92127] hover:bg-red-700 text-white px-8 h-12 text-lg font-bold">
              MUA SẮM NGAY
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Cart Items */}
          <div className="w-full lg:w-2/3 space-y-4">
            {/* Header row */}
            <div className="bg-white p-4 rounded-lg shadow-sm hidden md:flex items-center text-gray-500 font-medium">
              <div className="w-1/2">Sản phẩm</div>
              <div className="w-1/6 text-center">Đơn giá</div>
              <div className="w-1/6 text-center">Số lượng</div>
              <div className="w-1/6 text-center">Thành tiền</div>
              <div className="w-12"></div>
            </div>

            {/* Cart Items List */}
            {items.map((item) => {
              const qLine = quoteLineMap.get(item.variantId);
              const originalUnitPrice = qLine ? qLine.originalUnitPrice : item.price;
              const hasDiscount = qLine && qLine.productDiscount > 0;
              const finalLineTotal = qLine
                ? (qLine.originalUnitPrice * qLine.quantity) - qLine.productDiscount
                : item.price * item.quantity;

              return (
                <div
                  key={item.variantId}
                  className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 relative"
                >
                  {/* Product Info */}
                  <div className="w-full md:w-1/2 flex items-center gap-4">
                    <div className="w-20 h-28 bg-gray-100 rounded border flex shrink-0 items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <Link
                        href={`/products/${item.productId || item.bookId}`}
                        className="font-medium text-gray-800 hover:text-rose-600 line-clamp-2"
                      >
                        {item.productName || item.title}
                      </Link>
                      {(item.size || item.color) && (
                        <span className="text-xs text-gray-500 mt-0.5">
                          Phân loại: {[item.size, item.color].filter(Boolean).join(" - ")}
                        </span>
                      )}
                      {qLine?.campaign && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1">
                          {qLine.campaign.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="w-full md:w-1/6 flex md:justify-center items-center justify-between">
                    <span className="md:hidden text-gray-500">Đơn giá:</span>
                    <span className="font-bold text-gray-800">
                      {originalUnitPrice.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-1/6 flex md:justify-center items-center justify-between">
                    <span className="md:hidden text-gray-500">Số lượng:</span>
                    <div className="flex items-center border rounded-md">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.variantId, item.quantity - 1)
                        }
                        className="px-3 py-1.5 hover:bg-gray-100 text-gray-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={item.quantity}
                        className="w-10 text-center py-1.5 font-medium text-gray-800 border-x text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.variantId, item.quantity + 1)
                        }
                        className="px-3 py-1.5 hover:bg-gray-100 text-gray-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Total Line Price */}
                  <div className="w-full md:w-1/6 flex md:justify-center items-center justify-between">
                    <span className="md:hidden text-gray-500">Thành tiền:</span>
                    <div className="text-right">
                      {hasDiscount && (
                        <div className="text-xs text-gray-400 line-through">
                          {(originalUnitPrice * item.quantity).toLocaleString("vi-VN")} đ
                        </div>
                      )}
                      <div className="font-bold text-[#c92127]">
                        {finalLineTotal.toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => remove(item.variantId)}
                    className="absolute top-4 right-4 md:static md:w-12 flex justify-end text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24 space-y-4">
              <h2 className="font-bold text-lg text-slate-900 border-b pb-2 uppercase">
                Tóm tắt đơn hàng
              </h2>

              <PriceBreakdown quote={quote} isLoading={isQuoteLoading} />

              <Link href="/checkout" className="block pt-2">
                <Button className="w-full bg-[#c92127] hover:bg-red-700 text-white h-14 text-xl font-bold shadow-md flex items-center justify-center gap-2">
                  THANH TOÁN <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
