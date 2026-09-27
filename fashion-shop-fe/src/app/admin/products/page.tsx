"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { useDeleteProduct, useGetProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Product } from "@/types/product";

export default function AdminProductsPage() {
  const [view, setView] = useState<"LIST" | "FORM">("LIST");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProduct.mutate(id, {
        onSuccess: () => toast.success("Đã xóa sản phẩm thành công"),
        onError: () => toast.error("Có lỗi xảy ra khi xóa"),
      });
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setView("FORM");
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setView("FORM");
  };

  const handleCloseForm = () => {
    setView("LIST");
    setSelectedProduct(null);
  };

  const { data: products, isLoading } = useGetProducts();

  if (view === "FORM") {
    return <ProductForm onClose={handleCloseForm} product={selectedProduct} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm Thời trang</h1>
        <Button
          className="bg-rose-600 hover:bg-rose-700 text-white"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm mới
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
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thương hiệu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khoảng giá
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số biến thể
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Đang tải danh sách sản phẩm...
                </td>
              </tr>
            ) : products?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Chưa có sản phẩm nào.
                </td>
              </tr>
            ) : (
              products?.map((product: Product) => {
                const minPrice = Math.min(
                  ...(product.variants?.map((v) => Number(v.sellingPrice)) || [0]),
                );
                const maxPrice = Math.max(
                  ...(product.variants?.map((v) => Number(v.sellingPrice)) || [0]),
                );
                const thumb = product.images?.[0]?.url || product.variants?.[0]?.imageUrl;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{product.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.brand?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-rose-600">
                      {minPrice === maxPrice
                        ? `${minPrice.toLocaleString("vi-VN")} đ`
                        : `${minPrice.toLocaleString("vi-VN")} - ${maxPrice.toLocaleString("vi-VN")} đ`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                        {product.variants?.length || 0} biến thể
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
