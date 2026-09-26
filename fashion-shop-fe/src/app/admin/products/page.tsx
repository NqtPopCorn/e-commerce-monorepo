"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { useDeleteBook, useGetBooks } from "@/hooks/useBooks";
import { toast } from "sonner";
import { Book } from "@/types/book";

export default function AdminProductsPage() {
  const [view, setView] = useState<"LIST" | "FORM">("LIST");
  const [selectedProduct, setSelectedProduct] = useState<Book | null>(null);
  const deleteBook = useDeleteBook();

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sách này?")) {
      deleteBook.mutate(id, {
        onSuccess: () => toast.success("Đã xóa sách"),
        onError: () => toast.error("Có lỗi xảy ra khi xóa"),
      });
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setView("FORM");
  };

  const handleEdit = (product: Book) => {
    setSelectedProduct(product);
    setView("FORM");
  };

  const handleCloseForm = () => {
    setView("LIST");
    setSelectedProduct(null);
  };

  const { data: books, isLoading } = useGetBooks();

  if (view === "FORM") {
    return <ProductForm onClose={handleCloseForm} product={selectedProduct} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm sách mới
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên sách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tác giả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá (Bán)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số phiên bản
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : books?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Chưa có sản phẩm nào.
                </td>
              </tr>
            ) : (
              books?.map((book: Book) => {
                const minPrice = Math.min(
                  ...(book.variants?.map((v) => v.sellingPrice) || [0]),
                );
                const maxPrice = Math.max(
                  ...(book.variants?.map((v) => v.sellingPrice) || [0]),
                );

                let priceDisplay = new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(minPrice);
                if (minPrice !== maxPrice && maxPrice > 0) {
                  priceDisplay += ` - ${new Intl.NumberFormat("vi-VN").format(maxPrice)} đ`;
                }

                return (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{book.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 line-clamp-1 max-w-[300px]">
                      {book.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.authors?.[0] || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.variants?.length ? priceDisplay : "Đang cập nhật"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.variants?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={() => handleEdit(book)}
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(book.id)}
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
