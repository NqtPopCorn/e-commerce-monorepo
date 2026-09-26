"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGetBooks } from "@/hooks/useBooks";

const banners = [
  "/images/banner1.png",
  "/images/book26_v1.jpg",
  "/images/book26_v2.jpg",
];

const categories = [
  { name: "Văn học", img: "/images/boardgame.png" },
  { name: "Tâm lí-Kĩ năng sống", img: "/images/anh1.webp" },
  { name: "Kinh tế", img: "/images/vanhoc.png" },
  { name: "Sách thiếu nhi", img: "/images/thieunhi.png" },
  { name: "FICTION", img: "/images/ngoaivan.png" },
];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { data: books, isLoading } = useGetBooks();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Main Banner Slider */}
      <div className="relative w-full overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentBanner * 100}%)` }}
        >
          {banners.map((banner, idx) => (
            <div key={idx} className="w-full flex-shrink-0">
              <img
                src={banner}
                alt={`Banner ${idx + 1}`}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          ))}
        </div>
        {/* Slider Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors ${
                currentBanner === idx ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentBanner(idx)}
            />
          ))}
        </div>
      </div>

      {/* Small Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <img
          src="/images/banner2.png"
          alt="Promo 1"
          className="w-full rounded-lg hover:shadow-md transition-shadow"
        />
        <img
          src="/images/banner3.png"
          alt="Promo 2"
          className="w-full rounded-lg hover:shadow-md transition-shadow"
        />
        <img
          src="/images/banner4.png"
          alt="Promo 3"
          className="w-full rounded-lg hover:shadow-md transition-shadow"
        />
      </div>

      {/* Categories */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-gray-800">
          Danh mục sản phẩm
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center text-center gap-3 hover:text-red-600 transition-colors group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Shopping Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-gray-800">
          Xu hướng mua sắm
        </h3>

        {isLoading ? (
          <div className="py-10 text-center text-gray-500">
            Đang tải sản phẩm...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {books?.slice(0, 8).map((book: any) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="group flex flex-col gap-2 p-3 hover:shadow-lg rounded-lg border border-transparent hover:border-gray-100 transition-all"
              >
                <div className="aspect-[3/4] w-full bg-gray-50 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Chưa có ảnh
                  </div>
                  {/* Note: Update this to actual book image when backend supports it */}
                </div>
                <div className="flex-1 mt-2">
                  <h4 className="font-medium text-sm text-gray-800 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {book.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-red-600 font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(book.sellingPrice || 0)}
                    </span>
                    {book.listPrice && book.listPrice > book.sellingPrice && (
                      <span className="text-gray-400 text-xs line-through">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(book.listPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/shopping-trends"
            className="inline-block px-8 py-2 border-2 border-red-600 text-red-600 font-semibold rounded-md hover:bg-red-600 hover:text-white transition-colors"
          >
            Xem thêm
          </Link>
        </div>
      </div>
    </div>
  );
}
