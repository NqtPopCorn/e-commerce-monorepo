"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useGetProducts } from "@/hooks/useProducts";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

const heroBanners = [
  {
    title: "BỘ SƯU TẬP XUÂN HÈ 2026",
    subtitle: "Khám phá phong cách thanh lịch & hiện đại với chất liệu cao cấp",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
    buttonText: "Khám phá ngay",
    link: "/products",
  },
  {
    title: "ƯU ĐÃI THỜI TRANG ĐẾN 50%",
    subtitle: "Hàng trăm mẫu áo polo, sơ mi & quần jeans chính hãng",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80",
    buttonText: "Mua ngay",
    link: "/products",
  },
];

const categories = [
  {
    name: "Áo thun",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80",
  },
  {
    name: "Áo polo",
    img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&q=80",
  },
  {
    name: "Áo sơ mi",
    img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80",
  },
  {
    name: "Quần jeans",
    img: "https://images.unsplash.com/photo-1542272604-780c96856592?w=300&q=80",
  },
  {
    name: "Váy liền",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80",
  },
];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { data: products, isLoading } = useGetProducts();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Hero Banner Slider */}
      <div className="relative w-full h-[320px] md:h-[460px] overflow-hidden rounded-2xl shadow-sm">
        {heroBanners.map((banner, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              currentBanner === idx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
              <div className="max-w-xl px-8 md:px-14 text-white space-y-4">
                <span className="inline-block text-xs uppercase tracking-widest font-semibold bg-rose-600 px-3 py-1 rounded-full text-white">
                  Trending Now
                </span>
                <h2 className="text-2xl md:text-5xl font-black leading-tight tracking-tight">
                  {banner.title}
                </h2>
                <p className="text-sm md:text-base text-gray-200 line-clamp-2">
                  {banner.subtitle}
                </p>
                <Link
                  href={banner.link}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-full hover:bg-rose-600 hover:text-white transition-all shadow-lg text-sm"
                >
                  {banner.buttonText} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroBanners.map((_, idx) => (
            <button
              key={idx}
              className={`h-2 rounded-full transition-all ${
                currentBanner === idx ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
              onClick={() => setCurrentBanner(idx)}
            />
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3.5 px-4 py-2">
          <Truck className="w-8 h-8 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">
              Giao hàng miễn phí
            </h4>
            <p className="text-xs text-gray-500">Đơn hàng từ 400.000đ</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 px-4 py-2 border-y md:border-y-0 md:border-x border-gray-100">
          <RotateCcw className="w-8 h-8 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Đổi trả dễ dàng</h4>
            <p className="text-xs text-gray-500">
              Hỗ trợ đổi size trong 7 ngày
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 px-4 py-2">
          <ShieldCheck className="w-8 h-8 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Chính hãng 100%</h4>
            <p className="text-xs text-gray-500">
              Cam kết chất lượng tuyệt đối
            </p>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Danh mục thời trang hot
          </h3>
          <Link
            href="/products"
            className="text-sm font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            Tất cả danh mục <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center text-center p-3 rounded-xl border border-gray-100 hover:border-rose-300 hover:shadow-md transition-all group"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 bg-gray-50 group-hover:scale-105 transition-transform">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-rose-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" /> Xu hướng thời trang
              mới nhất
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Những thiết kế thịnh hành nhất được người dùng yêu thích tuần này
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto mb-2"></div>
            Đang tải sản phẩm thời trang...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products?.slice(0, 8).map((product: any) => {
              const minPrice = Math.min(
                ...(product.variants?.map((v: any) =>
                  Number(v.sellingPrice),
                ) || [0]),
              );
              const maxListPrice = Math.max(
                ...(product.variants?.map((v: any) =>
                  Number(v.listPrice || 0),
                ) || [0]),
              );
              const discount =
                maxListPrice > minPrice
                  ? Math.round(((maxListPrice - minPrice) / maxListPrice) * 100)
                  : 0;
              const imgUrl =
                product.images?.[0]?.url ||
                product.variants?.[0]?.imageUrl ||
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80";

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex flex-col rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all bg-white"
                >
                  <div className="aspect-3/4 w-full bg-gray-50 overflow-hidden relative">
                    <img
                      src={imgUrl}
                      alt={product.name || product.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {discount > 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                        -{discount}%
                      </span>
                    )}
                    {product.brand && (
                      <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {product.brand.name}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {product.name || product.title}
                    </h4>
                    <div className="mt-auto pt-2 flex items-baseline gap-2">
                      <span className="text-rose-600 font-bold text-base">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(minPrice || 0)}
                      </span>
                      {maxListPrice > minPrice && (
                        <span className="text-gray-400 text-xs line-through">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(maxListPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
