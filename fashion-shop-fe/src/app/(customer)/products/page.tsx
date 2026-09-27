"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGetProducts } from "@/hooks/useProducts";
import { ChevronRight, Filter, Star, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { brandsService } from "@/services/brands.service";
import { Product, Category, Brand } from "@/types/product";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const searchQuery = searchParams.get("q");

  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts();

  // Fetch categories & brands for sidebar
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  // Lọc sản phẩm
  let filteredProducts = Array.isArray(productsData) ? productsData : [];

  if (categoryParam) {
    filteredProducts = filteredProducts.filter((prod: Product) => {
      if (prod.category?.name === categoryParam) return true;
      if (prod.category?.parent?.name === categoryParam) return true;
      return false;
    });
  }

  if (brandParam) {
    filteredProducts = filteredProducts.filter(
      (prod: Product) => prod.brand?.name?.toLowerCase() === brandParam.toLowerCase()
    );
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter((prod: Product) => {
      const nameMatch = prod.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const brandMatch = prod.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matMatch = prod.material?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || brandMatch || matMatch;
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 bg-white p-3.5 rounded-xl shadow-xs border border-gray-100">
        <Link href="/" className="hover:text-rose-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/products" className="hover:text-rose-600 transition-colors">
          Thời trang
        </Link>
        {(categoryParam || brandParam || searchQuery) && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-semibold">
              {categoryParam
                ? `Danh mục: ${categoryParam}`
                : brandParam
                  ? `Thương hiệu: ${brandParam}`
                  : `Tìm kiếm: "${searchQuery}"`}
            </span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4 shrink-0">
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden sticky top-24 divide-y divide-gray-100">
            <div className="p-4 bg-slate-50 flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider text-xs">
              <Filter className="w-4 h-4 text-rose-600" /> Bộ lọc thời trang
            </div>

            {/* Category List */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">
                Danh mục
              </h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link
                    href="/products"
                    className={`block py-1 hover:text-rose-600 transition-colors ${
                      !categoryParam && !brandParam ? "font-bold text-rose-600" : "text-gray-600"
                    }`}
                  >
                    Tất cả sản phẩm
                  </Link>
                </li>
                {categories.map((cat: Category) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat.name)}`}
                      className={`block py-1 hover:text-rose-600 transition-colors ${
                        categoryParam === cat.name ? "font-bold text-rose-600" : "text-gray-600"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brand List */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">
                Thương hiệu
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {brands.map((b: Brand) => (
                  <Link
                    key={b.id}
                    href={`/products?brand=${encodeURIComponent(b.name)}`}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      brandParam?.toLowerCase() === b.name.toLowerCase()
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="w-full md:w-3/4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 mb-6 flex justify-between items-center">
            <h1 className="font-bold text-gray-900 text-lg">
              {categoryParam || brandParam || (searchQuery ? `Kết quả: "${searchQuery}"` : "Bộ sưu tập thời trang")}
            </h1>
            <div className="text-sm text-gray-500">
              {filteredProducts.length} sản phẩm
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="flex justify-center items-center py-24 bg-white rounded-xl shadow-xs">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-xs text-center border border-gray-100">
              <p className="text-gray-500 text-base">
                Không tìm thấy sản phẩm thời trang nào phù hợp.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block text-sm font-semibold text-rose-600 hover:underline"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {filteredProducts.map((prod: Product) => {
                const minPrice = Math.min(...(prod.variants?.map((v) => Number(v.sellingPrice)) || [0]));
                const maxListPrice = Math.max(...(prod.variants?.map((v) => Number(v.listPrice || 0)) || [0]));
                const discount = maxListPrice > minPrice ? Math.round(((maxListPrice - minPrice) / maxListPrice) * 100) : 0;
                const imageUrl = prod.images?.[0]?.url || prod.variants?.[0]?.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80";

                // Unique sizes
                const sizes = Array.from(new Set(prod.variants?.map((v) => v.size).filter(Boolean)));

                return (
                  <Link key={prod.id} href={`/products/${prod.id}`}>
                    <div className="bg-white rounded-xl shadow-xs border border-gray-100 hover:shadow-lg transition-all h-full flex flex-col overflow-hidden group">
                      <div className="aspect-3/4 bg-gray-50 overflow-hidden relative">
                        <img
                          src={imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow">
                            -{discount}%
                          </span>
                        )}
                        {prod.brand && (
                          <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                            {prod.brand.name}
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1.5 group-hover:text-rose-600 transition-colors">
                          {prod.name}
                        </h3>

                        {/* Sizes tags */}
                        {sizes.length > 0 && (
                          <div className="flex gap-1 mb-3 flex-wrap">
                            {sizes.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {s}
                              </span>
                            ))}
                            {sizes.length > 4 && (
                              <span className="text-[10px] text-slate-400">+{sizes.length - 4}</span>
                            )}
                          </div>
                        )}

                        <div className="mt-auto flex items-baseline gap-2">
                          <span className="font-bold text-rose-600 text-base">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Đang tải danh sách...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
