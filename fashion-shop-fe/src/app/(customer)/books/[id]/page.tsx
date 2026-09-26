"use client";
import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useGetBook } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  ChevronRight,
  Star,
  Truck,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { toast } from "sonner";
import clsx from "clsx";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null | undefined>(
    null,
  );
  const addToCart = useCartStore((state) => state.add);

  const { data: book, isLoading } = useGetBook(id);

  useEffect(() => {
    if (book?.variants && book.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(book.variants[0].id);
    }
  }, [book, selectedVariantId]);

  const selectedVariant =
    book?.variants?.find((v: any) => v.id === selectedVariantId) ||
    book?.variants?.[0];

  const handleAddToCart = () => {
    if (!book || !selectedVariant) return;
    addToCart({
      variantId: selectedVariant.id as number,
      bookId: book.id,
      title: `${book.title} - ${selectedVariant.format}`,
      price: Number(selectedVariant.sellingPrice),
      stock: selectedVariant.stock,
      quantity: quantity,
      imageUrl: selectedVariant.imageUrl,
    });
    toast.success("Đã thêm vào giỏ hàng!");
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c92127]"></div>
      </div>
    );

  if (!book) {
    return (
      <div className="text-center py-20 text-gray-500 text-xl">
        Sản phẩm không tồn tại hoặc đã bị xóa.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 mb-2">
        <Link href="/" className="hover:text-[#c92127]">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href={`/products?category=${book?.categories?.[0]?.name || ""}`}
          className="hover:text-[#c92127]"
        >
          {book?.categories?.[0]?.name || "Danh mục"}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium truncate max-w-xs">
          {book.title}
        </span>
      </nav>

      {/* Main Info Box */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Image and Actions (Left Column) */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col items-center">
            <div className="aspect-[3/4] w-full max-w-[300px] bg-gray-100 rounded-lg flex items-center justify-center border relative overflow-hidden mb-6">
              {selectedVariant?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedVariant.imageUrl}
                  alt={book.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400">Chưa có ảnh</span>
              )}
            </div>

            <div className="w-full max-w-[300px] flex flex-col gap-3">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="flex-1 bg-white border-2 border-[#c92127] text-[#c92127] hover:bg-red-50 hover:text-[#c92127] h-12 text-sm font-bold shadow-sm px-2 disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5 mr-1" /> Thêm vào giỏ hàng
                </Button>
                <Button
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  className="flex-1 bg-[#c92127] hover:bg-red-700 text-white h-12 text-sm font-bold shadow-sm px-2 disabled:opacity-50"
                >
                  Mua ngay
                </Button>
              </div>
              <button className="text-gray-500 hover:text-[#c92127] flex items-center justify-center text-sm font-medium transition-colors mt-2">
                <Heart className="w-4 h-4 mr-1" /> Thêm vào yêu thích
              </button>
            </div>
          </div>

          {/* Product Info (Right Column) */}
          <div className="w-full md:w-3/5 lg:w-2/3 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-4">
                {book.title}
              </h1>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 text-sm text-gray-600 mb-6">
                <p>
                  Nhà cung cấp:{" "}
                  <span className="font-semibold text-blue-600">
                    {book?.provider || "FAHASA"}
                  </span>
                </p>
                <p>
                  Tác giả:{" "}
                  <span className="font-semibold text-gray-800">
                    {book?.authors?.join(", ") || "Đang cập nhật"}
                  </span>
                </p>
                <p>
                  Nhà xuất bản:{" "}
                  <span className="font-semibold text-gray-800">
                    {book?.publisher || "Đang cập nhật"}
                  </span>
                </p>
                <p>
                  Hình thức bìa:{" "}
                  <span className="font-semibold text-gray-800">
                    {selectedVariant?.format || "Đang cập nhật"}
                  </span>
                </p>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-center gap-4 py-2">
              <div className="text-3xl font-bold text-[#c92127]">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(selectedVariant?.sellingPrice || 0)}
              </div>
              {selectedVariant?.listPrice &&
                selectedVariant.listPrice > selectedVariant.sellingPrice && (
                  <>
                    <div className="text-base text-gray-400 line-through">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(selectedVariant.listPrice)}
                    </div>
                    <div className="bg-[#c92127] text-white text-xs font-bold px-2 py-1 rounded">
                      -
                      {Math.round(
                        (1 -
                          selectedVariant.sellingPrice /
                            selectedVariant.listPrice) *
                          100,
                      )}
                      %
                    </div>
                  </>
                )}
            </div>

            {/* Variant Selector */}
            {book?.variants && book.variants.length > 0 && (
              <div className="py-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Chọn Phiên Bản:
                </p>
                <div className="flex flex-wrap gap-3">
                  {book.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={clsx(
                        "px-4 py-2 border rounded-md text-sm font-medium transition-colors",
                        selectedVariantId === v.id
                          ? "border-[#c92127] text-[#c92127] bg-red-50"
                          : "border-gray-300 text-gray-700 hover:border-gray-400",
                      )}
                    >
                      {v.format} -{" "}
                      {new Intl.NumberFormat("vi-VN").format(v.sellingPrice)} đ
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm text-gray-600 py-4 border-t border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-500" />
                Thời gian giao hàng:{" "}
                <span className="font-semibold text-gray-800">2-3 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-gray-500" />
                Chính sách đổi trả:{" "}
                <span className="font-semibold text-gray-800">30 ngày</span>
              </div>
            </div>

            {/* Quantity */}
            <div className="pt-2">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-semibold w-24">
                  Số lượng:
                </span>
                <div className="flex items-center border border-gray-300 rounded bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-10 text-center py-1.5 focus:outline-none font-semibold text-gray-800 border-x border-gray-300"
                  />
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(quantity + 1, selectedVariant?.stock || 1),
                      )
                    }
                    className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  ({selectedVariant?.stock || 0} sản phẩm có sẵn)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase mb-4">
          Thông tin chi tiết
        </h2>
        <table className="w-full text-sm text-gray-600 border-collapse max-w-4xl">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium w-48 text-gray-500">
                Mã hàng
              </td>
              <td className="py-3 text-gray-900">
                {selectedVariant?.sku || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">
                Nhà cung cấp
              </td>
              <td className="py-3 text-blue-600">
                {book.provider || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">Tác giả</td>
              <td className="py-3 text-gray-900">
                {book.authors?.join(", ") || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">
                Người dịch
              </td>
              <td className="py-3 text-gray-900">
                {book.translators?.join(", ") || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">
                Nhà xuất bản
              </td>
              <td className="py-3 text-gray-900">
                {book.publisher || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">
                Năm xuất bản
              </td>
              <td className="py-3 text-gray-900">
                {book.publishYear || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">
                Trọng lượng (gr)
              </td>
              <td className="py-3 text-gray-900">
                {selectedVariant?.weight || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">
                Kích thước
              </td>
              <td className="py-3 text-gray-900">
                {selectedVariant?.dimensions || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">Số trang</td>
              <td className="py-3 text-gray-900">
                {selectedVariant?.pages || "Đang cập nhật"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-500">Hình thức</td>
              <td className="py-3 text-gray-900">
                {selectedVariant?.format || "Đang cập nhật"}
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-gray-500">Ngôn ngữ</td>
              <td className="py-3 text-gray-900">
                {book.language || "Đang cập nhật"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mô tả sản phẩm */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase mb-4">
          Mô tả sản phẩm
        </h2>
        <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
          {book.description ||
            "Nhà xuất bản chưa cung cấp thông tin chi tiết cho cuốn sách này."}
        </div>
      </div>
    </div>
  );
}
