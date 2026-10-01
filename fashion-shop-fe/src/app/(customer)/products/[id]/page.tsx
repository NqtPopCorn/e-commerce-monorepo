"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  ChevronRight,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { toast } from "sonner";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const addToCart = useCartStore((state) => state.add);
  const { data: product, isLoading } = useGetProduct(id);

  // Lấy các sizes & colors duy nhất từ variants
  const availableSizes = React.useMemo(() => {
    if (!product?.variants) return [];
    const sizes = product.variants.map((v: any) => v.size).filter(Boolean);
    return Array.from(new Set(sizes)) as string[];
  }, [product]);

  const availableColors = React.useMemo(() => {
    if (!product?.variants) return [];
    const colorMap = new Map<string, string>();
    product.variants.forEach((v: any) => {
      if (v.color) {
        colorMap.set(v.color, v.colorHex || "#000000");
      }
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product]);

  // Set default selection khi tải xong
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0].name);
    }
  }, [availableSizes, availableColors, selectedSize, selectedColor]);

  // Tìm variant khớp với size và color đang chọn
  const currentVariant = React.useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    const match = product.variants.find(
      (v: any) =>
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColor || v.color === selectedColor),
    );
    return match || product.variants[0];
  }, [product, selectedSize, selectedColor]);

  // Tất cả ảnh
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (product?.images && product.images.length > 0) {
      list.push(...product.images.map((img: any) => img.url));
    }
    if (product?.variants) {
      product.variants.forEach((v: any) => {
        if (v.imageUrl && !list.includes(v.imageUrl)) {
          list.push(v.imageUrl);
        }
      });
    }
    if (list.length === 0) {
      list.push(
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
      );
    }
    return list;
  }, [product]);

  const handleAddToCart = () => {
    if (!product || !currentVariant) return;
    if (currentVariant.stock <= 0) {
      toast.error("Biến thể này hiện đang hết hàng!");
      return;
    }
    addToCart({
      variantId: currentVariant.id as number,
      productId: product.id,
      productName: product.name,
      size: currentVariant.size,
      color: currentVariant.color,
      price: Number(currentVariant.sellingPrice),
      stock: currentVariant.stock,
      quantity: quantity,
      imageUrl: currentVariant.imageUrl || allImages[0],
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500 text-xl">
        Sản phẩm không tồn tại hoặc đã bị xóa.
      </div>
    );
  }

  const sellingPrice = Number(currentVariant?.sellingPrice || 0);
  const listPrice = Number(currentVariant?.listPrice || sellingPrice);
  const discountPercent =
    listPrice > sellingPrice
      ? Math.round(((listPrice - sellingPrice) / listPrice) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
        <Link href="/" className="hover:text-rose-600">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/products" className="hover:text-rose-600">
          Sản phẩm
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/products?category=${encodeURIComponent(product.category.name)}`}
              className="hover:text-rose-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium truncate max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main Product Info Container */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Image Gallery */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="aspect-3/4 w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200 relative group">
            <img
              src={allImages[activeImageIndex] || allImages[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? "border-rose-600 scale-105 shadow-sm"
                      : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="md:col-span-7 flex flex-col gap-5">
          <div>
            {product.brand && (
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md mb-2 inline-block">
                {product.brand.name}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Price Box */}
          <div className="bg-slate-50 p-4 rounded-xl flex items-baseline gap-4 border border-slate-100">
            <span className="text-3xl font-black text-rose-600">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(sellingPrice)}
            </span>
            {listPrice > sellingPrice && (
              <span className="text-base text-gray-400 line-through">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(listPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Tiết kiệm {discountPercent}%
              </span>
            )}
          </div>

          {/* Size Selector */}
          {availableSizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                <span>Chọn kích cỡ (Size):</span>
                <span className="text-xs text-rose-600 cursor-pointer hover:underline">
                  Bảng hướng dẫn chọn size
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-12 px-4 py-2 border rounded-lg text-sm font-semibold transition-all ${
                      selectedSize === size
                        ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                        : "border-gray-200 text-gray-800 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 block">
                Chọn màu sắc:{" "}
                <span className="text-gray-900 font-semibold">
                  {selectedColor}
                </span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-lg text-sm transition-all ${
                      selectedColor === color.name
                        ? "border-rose-600 ring-2 ring-rose-600/20 font-semibold text-gray-900 bg-rose-50/50"
                        : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border shadow-xs inline-block"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Info & SKU */}
          <div className="flex items-center gap-4 text-xs text-gray-500 py-1 border-y border-gray-100">
            {currentVariant?.sku && (
              <span>
                Mã SKU:{" "}
                <strong className="font-mono text-gray-700">
                  {currentVariant.sku}
                </strong>
              </span>
            )}
            <span>
              Tình trạng:{" "}
              {currentVariant && currentVariant.stock > 0 ? (
                <strong className="text-emerald-600">
                  Còn hàng ({currentVariant.stock} sản phẩm)
                </strong>
              ) : (
                <strong className="text-rose-600">Hết hàng</strong>
              )}
            </span>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                Số lượng:
              </span>
              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={currentVariant?.stock || 99}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(
                          parseInt(e.target.value) || 1,
                          currentVariant?.stock || 99,
                        ),
                      ),
                    )
                  }
                  className="w-12 text-center text-sm font-semibold outline-none"
                />
                <button
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(currentVariant?.stock || 99, q + 1),
                    )
                  }
                  className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={!currentVariant || currentVariant.stock <= 0}
                variant="outline"
                className="flex-1 py-6 border-2 border-rose-600 text-rose-600 hover:bg-rose-50 font-bold text-base flex items-center justify-center gap-2 rounded-xl transition-all"
              >
                <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ hàng
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={!currentVariant || currentVariant.stock <= 0}
                className="flex-1 py-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base rounded-xl shadow-md transition-all"
              >
                Mua ngay
              </Button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Giao hàng nhanh toàn quốc</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Đổi trả 7 ngày nếu lỗi</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
              <span>100% Chính hãng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-b pb-3">
          Thông tin chi tiết sản phẩm
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          {product.brand && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Thương hiệu</span>
              <span className="font-medium text-gray-800">
                {product.brand.name}
              </span>
            </div>
          )}
          {product.category && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Danh mục</span>
              <span className="font-medium text-gray-800">
                {product.category.name}
              </span>
            </div>
          )}
          {product.material && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Chất liệu</span>
              <span className="font-medium text-gray-800">
                {product.material}
              </span>
            </div>
          )}
          {product.season && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Mùa / Bộ sưu tập</span>
              <span className="font-medium text-gray-800">
                {product.season}
              </span>
            </div>
          )}
          {product.careInstructions && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Bảo quản</span>
              <span className="font-medium text-gray-800">
                {product.careInstructions}
              </span>
            </div>
          )}
          {product.provider && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Xuất xứ / Nhà phân phối</span>
              <span className="font-medium text-gray-800">
                {product.provider}
              </span>
            </div>
          )}
        </div>

        {product.description && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="font-bold text-gray-900">Mô tả sản phẩm</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
