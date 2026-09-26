"use client";
import React from "react";
import Link from "next/link";
import { useGetBooks } from "@/hooks/useBooks";
import { Book } from "@/types/book";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BooksPage() {
  const { data: books, isLoading } = useGetBooks();

  return (
    <div className="flex gap-6">
      {/* Sidebar Filter */}
      <aside className="w-64 bg-white p-4 rounded-lg shadow-sm h-fit hidden md:block">
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">
          Lọc theo thể loại
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="hover:text-[#c92127] cursor-pointer">Văn học (15)</li>
          <li className="hover:text-[#c92127] cursor-pointer">Kinh tế (8)</li>
          <li className="hover:text-[#c92127] cursor-pointer">Tâm lý (12)</li>
          <li className="hover:text-[#c92127] cursor-pointer">Sách IT (5)</li>
        </ul>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Tất cả sách</h2>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm outline-none text-gray-600">
            <option>Bán chạy nhất</option>
            <option>Giá thấp đến cao</option>
            <option>Giá cao đến thấp</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 animate-pulse rounded-lg"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books?.map((book: Book) => {
              const minPrice = Math.min(...(book.variants?.map((v) => v.sellingPrice) || [0]));
              const maxOriginalPrice = Math.max(...(book.variants?.map((v) => v.listPrice || 0) || [0]));
              return (
              <div
                key={book.id}
                className="group relative bg-white border border-transparent hover:border-[#c92127] hover:shadow-md rounded-lg p-3 transition-all cursor-pointer"
              >
                <Link href={`/books/${book.id}`}>
                  <div className="h-48 bg-gray-100 flex items-center justify-center rounded-md mb-3">
                    <span className="text-gray-400 text-sm">Chưa có ảnh</span>
                  </div>
                  <h3 className="text-sm text-gray-800 font-medium line-clamp-2 group-hover:text-[#c92127]">
                    {book.title}
                  </h3>
                  <div className="text-[12px] text-gray-500 mt-1">
                    {book.authors?.[0] || "-"}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#c92127] font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(minPrice || 0)}
                    </span>
                    {maxOriginalPrice > minPrice && (
                      <span className="text-gray-400 text-xs line-through">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(maxOriginalPrice)}
                      </span>
                    )}
                  </div>
                </Link>
                <Button
                  className="w-full mt-3 bg-white text-[#c92127] border border-[#c92127] hover:bg-[#c92127] hover:text-white transition-colors"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Thêm vào giỏ
                </Button>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
