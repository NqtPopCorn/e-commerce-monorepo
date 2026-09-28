"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  FolderSync,
  X,
  ChevronLeft,
  ChevronRight,
  Rows3,
  Rows4,
  RotateCcw,
} from "lucide-react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { ProductStatCards } from "@/components/admin/products/ProductStatCards";
import {
  AdminPageHeader,
  AdminPagination,
} from "@/components/admin";
import {
  useDeleteProduct,
  useGetPaginatedProducts,
  useGetProductStats,
} from "@/hooks/useProducts";
import { useGetCategories } from "@/hooks/useCategories";
import { useGetBrands } from "@/hooks/useBrands";
import { toast } from "sonner";
import { Product } from "@/types/product";

export default function AdminProductsPage() {
  const [view, setView] = useState<"LIST" | "FORM">("LIST");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Density: comfortable vs compact
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Filter states
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [brandId, setBrandId] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Queries
  const { data: paginatedData, isLoading } = useGetPaginatedProducts({
    search: search.trim() ? search.trim() : undefined,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    page,
    limit,
  });

  const { data: stats, isLoading: isLoadingStats } = useGetProductStats();
  const { data: categories } = useGetCategories();
  const { data: brands } = useGetBrands();

  const deleteProduct = useDeleteProduct();

  const products = paginatedData?.data || [];
  const meta = paginatedData?.meta || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Check if any filters are active
  const hasActiveFilters =
    search.trim() !== "" ||
    categoryId !== undefined ||
    brandId !== undefined ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  const handleResetFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setBrandId(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPage(1);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProduct.mutate(id, {
        onSuccess: () => {
          toast.success("Đã xóa sản phẩm thành công");
          setSelectedIds((prev) => prev.filter((item) => item !== id));
        },
        onError: () => toast.error("Có lỗi xảy ra khi xóa"),
      });
    }
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`,
      )
    ) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await deleteProduct.mutateAsync(id);
      }
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm thành công`);
      setSelectedIds([]);
    } catch {
      toast.error("Có lỗi xảy ra khi thực hiện xóa hàng loạt");
    }
  };

  // Export selected products to CSV
  const handleExportCSV = () => {
    const itemsToExport =
      selectedIds.length > 0
        ? products.filter((p) => selectedIds.includes(p.id))
        : products;

    if (itemsToExport.length === 0) {
      toast.error("Không có sản phẩm nào để xuất file");
      return;
    }

    const headers = [
      "ID",
      "Tên sản phẩm",
      "Thương hiệu",
      "Danh mục",
      "Giá thấp nhất",
      "Giá cao nhất",
      "Số biến thể",
    ];

    const rows = itemsToExport.map((p) => {
      const minP = Math.min(
        ...(p.variants?.map((v) => Number(v.sellingPrice)) || [0]),
      );
      const maxP = Math.max(
        ...(p.variants?.map((v) => Number(v.sellingPrice)) || [0]),
      );
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand?.name || ""}"`,
        `"${p.category?.name || ""}"`,
        minP,
        maxP,
        p.variants?.length || 0,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `danh_sach_san_pham_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Đã xuất ${itemsToExport.length} sản phẩm ra file CSV`);
  };

  // Batch toggle all on current page
  const isAllCurrentPageSelected =
    products.length > 0 &&
    products.every((p) => selectedIds.includes(p.id));

  const isSomeSelected =
    selectedIds.length > 0 && !isAllCurrentPageSelected;

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageProductIds = new Set(products.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !pageProductIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...products.map((p) => p.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
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

  if (view === "FORM") {
    return <ProductForm onClose={handleCloseForm} product={selectedProduct} />;
  }

  const fromRecord = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const toRecord = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Breadcrumb */}
      <AdminPageHeader
        title="Quản Lý Sản Phẩm"
        description="Quản lý danh mục mẫu, giá bán, biến thể và lượng tồn kho toàn hệ thống."
        actions={
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs rounded-lg px-4 py-2 font-medium shrink-0 self-start sm:self-auto text-xs"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm mới
          </Button>
        }
      />

      {/* 2. Stat Cards */}
      <ProductStatCards stats={stats} isLoading={isLoadingStats} />

      {/* 3. Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên sản phẩm..."
              className="pl-9 h-9 text-sm rounded-lg border-slate-200 focus:border-rose-500"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setCategoryId(val);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="">Tất cả Danh mục</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="md:col-span-3">
            <select
              value={brandId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setBrandId(val);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="">Tất cả Thương hiệu</option>
              {brands?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Density & Actions Toggle */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))
              }
              title={`Chuyển sang chế độ xem ${density === "comfortable" ? "thu gọn (Compact)" : "thoải mái (Comfortable)"}`}
              className="h-9 px-3 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              {density === "comfortable" ? (
                <>
                  <Rows3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Compact</span>
                </>
              ) : (
                <>
                  <Rows4 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Comfortable</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Price Range Filter Row & Clear Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Khoảng giá (đ):
            </span>
            <input
              type="number"
              value={minPrice ?? ""}
              onChange={(e) => {
                setMinPrice(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              placeholder="Từ..."
              className="w-28 h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              value={maxPrice ?? ""}
              onChange={(e) => {
                setMaxPrice(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              placeholder="Đến..."
              className="w-28 h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 hover:bg-rose-50 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Xóa bộ lọc
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Data Table & Batch Floating Action Bar */}
      <div className="relative bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Floating Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {selectedIds.length}
              </span>
              <span>sản phẩm đã được chọn</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa ({selectedIds.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 text-xs rounded-lg bg-slate-800 border-slate-700 text-white hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Xuất file
              </Button>

              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox
                    checked={isAllCurrentPageSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Chọn tất cả trên trang hiện tại"
                  />
                </th>
                <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Thương hiệu
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Khoảng giá
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Số biến thể
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Đang tải danh sách sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <p className="text-sm font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-rose-600 hover:underline mt-1 font-medium"
                      >
                        Đặt lại các bộ lọc tìm kiếm
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((product: Product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const minPriceVal = Math.min(
                    ...(product.variants?.map((v) => Number(v.sellingPrice)) || [0]),
                  );
                  const maxPriceVal = Math.max(
                    ...(product.variants?.map((v) => Number(v.sellingPrice)) || [0]),
                  );
                  const thumb =
                    product.images?.[0]?.url || product.variants?.[0]?.imageUrl;

                  const rowPaddingClass =
                    density === "comfortable" ? "py-4" : "py-2.5";

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className={`px-4 ${rowPaddingClass} whitespace-nowrap`}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(product.id)}
                          aria-label={`Chọn sản phẩm ${product.name}`}
                        />
                      </td>

                      <td
                        className={`px-4 ${rowPaddingClass} whitespace-nowrap text-xs font-mono text-slate-500`}
                      >
                        #{product.id}
                      </td>

                      <td className={`px-4 ${rowPaddingClass} whitespace-nowrap`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium">
                                N/A
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p
                              className="text-sm font-semibold text-slate-900 truncate hover:text-rose-600 cursor-pointer"
                              onClick={() => handleEdit(product)}
                              title={product.name}
                            >
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {product.slug || product.material || "Thời trang"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td
                        className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm text-slate-600`}
                      >
                        {product.brand?.name || "-"}
                      </td>

                      <td
                        className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm text-slate-600`}
                      >
                        {product.category?.name || "-"}
                      </td>

                      {/* Đổi màu giá tiền sang màu trung tính đậm (slate-900 / navy) */}
                      <td
                        className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm font-semibold text-slate-900`}
                      >
                        {minPriceVal === maxPriceVal
                          ? `${minPriceVal.toLocaleString("vi-VN")} đ`
                          : `${minPriceVal.toLocaleString("vi-VN")} - ${maxPriceVal.toLocaleString("vi-VN")} đ`}
                      </td>

                      <td
                        className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm text-center`}
                      >
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {product.variants?.length || 0} biến thể
                        </span>
                      </td>

                      {/* Hành động: Tăng padding để không bị sát viền phải */}
                      <td
                        className={`px-6 ${rowPaddingClass} whitespace-nowrap text-right text-sm font-medium`}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 mr-1 rounded-lg"
                          onClick={() => handleEdit(product)}
                          title="Sửa sản phẩm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Giữ màu đỏ riêng biệt cho hành động Xóa */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          onClick={() => handleDelete(product.id)}
                          title="Xóa sản phẩm"
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

        {/* 5. Pagination */}
        <AdminPagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
