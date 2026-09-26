"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGetBooks } from "@/hooks/useBooks";
import { ChevronRight, Filter, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { Book, Category } from "@/types/book";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("q");

  const { data: booksData, isLoading: isLoadingBooks } = useGetBooks();

  // Fetch categories for sidebar
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const mainCategories = Array.isArray(categoriesData) ? categoriesData : [];

  // Lọc sản phẩm
  let filteredBooks = Array.isArray(booksData) ? booksData : [];
  if (categoryParam) {
    filteredBooks = filteredBooks.filter(
      (book: Book) =>
        book.categories?.some((c) => c.name === categoryParam)
    );
  }
  if (searchQuery) {
    filteredBooks = filteredBooks.filter(
      (book: Book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors?.some((a: string) =>
          a.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 mb-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <Link href="/" className="hover:text-[#c92127]">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">
          {categoryParam
            ? `Thể loại: ${categoryParam}`
            : searchQuery
              ? `Tìm kiếm: ${searchQuery}`
              : "Tất cả sản phẩm"}
        </span>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <div className="p-4 bg-gray-50 border-b flex items-center gap-2 font-bold text-gray-800 uppercase">
              <Filter className="w-5 h-5" /> Tùy chọn lọc
            </div>

            {/* Category List */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800 mb-3">
                Nhóm sản phẩm
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link
                    href="/products"
                    className={`hover:text-[#c92127] ${!categoryParam ? "font-bold text-[#c92127]" : ""}`}
                  >
                    Tất cả sản phẩm
                  </Link>
                </li>
                {mainCategories.map((cat: Category) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat.name)}`}
                      className={`hover:text-[#c92127] ${categoryParam === cat.name ? "font-bold text-[#c92127]" : ""}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Filter (Fake UI) */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Giá</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2 cursor-pointer hover:text-[#c92127]">
                  <input type="checkbox" className="rounded" /> Dưới 50.000đ
                </li>
                <li className="flex items-center gap-2 cursor-pointer hover:text-[#c92127]">
                  <input type="checkbox" className="rounded" /> 50.000đ -
                  100.000đ
                </li>
                <li className="flex items-center gap-2 cursor-pointer hover:text-[#c92127]">
                  <input type="checkbox" className="rounded" /> 100.000đ -
                  200.000đ
                </li>
                <li className="flex items-center gap-2 cursor-pointer hover:text-[#c92127]">
                  <input type="checkbox" className="rounded" /> Trên 200.000đ
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="w-full md:w-3/4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
            <h1 className="font-bold text-gray-800 text-lg">
              {categoryParam || searchQuery || "Tất cả sản phẩm"}
            </h1>
            <div className="text-sm text-gray-500">
              Hiển thị {filteredBooks.length} sản phẩm
            </div>
          </div>

          {isLoadingBooks ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c92127]"></div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white p-10 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 text-lg">
                Không tìm thấy sản phẩm nào phù hợp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map((book: Book) => {
                const minPrice = Math.min(...(book.variants?.map((v) => v.sellingPrice) || [0]));
                const maxOriginalPrice = Math.max(...(book.variants?.map((v) => v.listPrice || 0) || [0]));
                return (
                <Link key={book.id} href={`/books/${book.id}`}>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="aspect-[3/4] bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                      <span className="text-xs text-gray-400">No Image</span>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2 min-h-[40px] hover:text-[#c92127]">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400 ml-1">(0)</span>
                    </div>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="font-bold text-[#c92127] text-lg">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(minPrice || 0)}
                      </span>
                      {maxOriginalPrice > minPrice && (
                        <span className="text-gray-400 text-sm line-through">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(maxOriginalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Đang tải...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
