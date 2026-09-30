"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  RotateCcw,
  Rows3,
  Rows4,
} from "lucide-react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { ProductStatCards } from "@/components/admin/products/ProductStatCards";
import {
  AdminPageHeader,
  AdminDataTable,
  AdminConfirmDialog,
  AdminPageSkeleton,
  AdminSortHeader,
  ConfirmDialogVariant,
} from "@/components/admin";
import { useSortableTable } from "@/hooks/useSortableTable";
import {
  useDeleteProduct,
  useGetPaginatedProducts,
  useGetProductStats,
} from "@/hooks/useProducts";
import { useGetCategories } from "@/hooks/useCategories";
import { useGetBrands } from "@/hooks/useBrands";
import { useTableParams } from "@/hooks/useTableParams";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Product } from "@/types/product";

function AdminProductsContent() {
  const [view, setView] = useState<"LIST" | "FORM">("LIST");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // URL-driven table parameters
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });

  // Density: comfortable vs compact
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );

  // Local debounced search input
  const [searchInput, setSearchInput] = useState(params.q);

  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== params.q) {
        setParams({ q: searchInput.trim() || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, params.q, setParams]);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    variant: ConfirmDialogVariant;
    confirmText?: string;
    cancelText?: string;
    alertOnly?: boolean;
    isLoading?: boolean;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    description: null,
    variant: "danger",
    alertOnly: false,
    isLoading: false,
  });

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Queries
  const {
    data: paginatedData,
    isLoading,
    isError,
    refetch,
  } = useGetPaginatedProducts({
    search: params.q || undefined,
    categoryId: params.categoryId,
    brandId: params.brandId,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    page: params.page,
    limit: params.pageSize,
  });

  const { data: stats, isLoading: isLoadingStats } = useGetProductStats();
  const { data: categories } = useGetCategories();
  const { data: brands } = useGetBrands();

  const deleteProduct = useDeleteProduct();

  const products = paginatedData?.data || [];
  const meta = paginatedData?.meta || {
    total: 0,
    page: params.page,
    limit: params.pageSize,
    totalPages: 1,
  };

  const {
    sortedItems: sortedProducts,
    sortField,
    sortOrder,
    handleSort,
  } = useSortableTable(products, {
    defaultField: "id",
    defaultOrder: "desc",
    customGetters: {
      id: (p: Product) => Number(p.id) || 0,
      name: (p: Product) => p.name || "",
      brand: (p: Product) => p.brand?.name || "",
      category: (p: Product) => p.category?.name || "",
      price: (p: Product) =>
        Math.min(
          ...(p.variants?.map((v: any) => Number(v.sellingPrice)) || [0]),
        ),
      variants: (p: Product) => p.variants?.length || 0,
    },
  });

  const hasActiveFilters =
    Boolean(params.q) ||
    params.categoryId !== undefined ||
    params.brandId !== undefined ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined;

  const handleResetFilters = () => {
    setSearchInput("");
    setParams({
      q: undefined,
      categoryId: undefined,
      brandId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      page: 1,
    });
  };

  const handleDelete = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const totalStock =
      product.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) ||
      0;

    if (totalStock > 0) {
      setConfirmDialog({
        isOpen: true,
        title: "Không thể xóa sản phẩm còn tồn kho",
        description: (
          <div className="space-y-3">
            <p>
              Sản phẩm{" "}
              <strong className="text-foreground">{product.name}</strong> hiện
              vẫn còn tổng cộng{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                {totalStock} sản phẩm
              </span>{" "}
              trong kho ({product.variants?.length || 0} biến thể).
            </p>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning leading-relaxed">
              <strong>Lưu ý:</strong> Để đảm bảo tính chính xác cho số liệu kế
              toán và kho bãi, hệ thống không cho phép xóa sản phẩm khi vẫn còn
              tồn kho.
            </div>
            <p className="text-xs text-muted-foreground">
              Vui lòng điều chỉnh số lượng tồn kho của các biến thể về 0 trước
              khi thực hiện xóa.
            </p>
          </div>
        ),
        variant: "warning",
        alertOnly: true,
        confirmText: "Đã hiểu",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa sản phẩm",
      description: (
        <div className="space-y-2">
          <p>
            Bạn có chắc chắn muốn xóa sản phẩm{" "}
            <strong className="text-foreground">{product.name}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">
            Thao tác này sẽ xóa sản phẩm cùng tất cả ảnh và biến thể liên quan.
            Hành động này không thể hoàn tác.
          </p>
        </div>
      ),
      variant: "danger",
      alertOnly: false,
      confirmText: "Xóa sản phẩm",
      cancelText: "Hủy",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteProduct.mutateAsync(id);
          toast.success(`Đã xóa sản phẩm "${product.name}"`);
          setSelectedIds((prev) => prev.filter((item) => item !== id));
          closeConfirmDialog();
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            "Không thể xóa sản phẩm. Kiểm tra kết nối rồi thử lại.";
          toast.error(message);
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;

    const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
    const productsWithStock = selectedProducts.filter((p) => {
      const stock =
        p.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;
      return stock > 0;
    });

    if (productsWithStock.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: "Có sản phẩm đang còn tồn kho",
        description: (
          <div className="space-y-3">
            <p>
              Trong số {selectedIds.length} sản phẩm được chọn, có{" "}
              <strong className="text-destructive">
                {productsWithStock.length} sản phẩm
              </strong>{" "}
              vẫn còn tồn kho:
            </p>
            <ul className="list-disc pl-5 text-xs text-foreground max-h-32 overflow-y-auto space-y-1 bg-muted/50 p-2.5 rounded-lg border border-border">
              {productsWithStock.map((p) => {
                const s =
                  p.variants?.reduce(
                    (sum, v) => sum + (Number(v.stock) || 0),
                    0,
                  ) || 0;
                return (
                  <li key={p.id}>
                    <span className="font-medium">{p.name}</span> (Tồn kho:{" "}
                    <span className="text-destructive font-semibold">{s}</span>)
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              Hệ thống không cho phép xóa sản phẩm còn tồn kho. Vui lòng bỏ chọn
              các sản phẩm trên trước khi xóa.
            </p>
          </div>
        ),
        variant: "warning",
        alertOnly: true,
        confirmText: "Đã hiểu",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa hàng loạt",
      description: (
        <div className="space-y-2">
          <p>
            Bạn có chắc chắn muốn xóa{" "}
            <strong className="text-destructive">
              {selectedIds.length} sản phẩm
            </strong>{" "}
            đã chọn không?
          </p>
          <p className="text-xs text-muted-foreground">
            Hành động này sẽ xóa vĩnh viễn các sản phẩm đã chọn và không thể
            hoàn tác.
          </p>
        </div>
      ),
      variant: "danger",
      alertOnly: false,
      confirmText: `Xóa (${selectedIds.length}) sản phẩm`,
      cancelText: "Hủy",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          for (const id of selectedIds) {
            await deleteProduct.mutateAsync(id);
          }
          toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
          setSelectedIds([]);
          closeConfirmDialog();
        } catch {
          toast.error(
            "Không thể xóa các sản phẩm đã chọn. Kiểm tra kết nối rồi thử lại.",
          );
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

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

  const isAllCurrentPageSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  const isSomeSelected = selectedIds.length > 0 && !isAllCurrentPageSelected;

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Actions (Single Primary Button) */}
      <AdminPageHeader
        title="Quản Lý Sản Phẩm"
        description="Quản lý danh mục mẫu, giá bán, biến thể và lượng tồn kho toàn hệ thống."
        actions={
          <Button
            className="shadow-xs rounded-lg px-4 py-2 font-medium shrink-0 self-start sm:self-auto text-xs"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm mới
          </Button>
        }
      />

      {/* 2. Stat Cards */}
      <ProductStatCards stats={stats} isLoading={isLoadingStats} />

      {/* 3. Toolbar & Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input (Debounced) */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="pl-9 h-9 text-sm rounded-lg border-input bg-background"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={params.categoryId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setParams({ categoryId: val, page: 1 });
              }}
              aria-label="Lọc theo danh mục"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              value={params.brandId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setParams({ brandId: val, page: 1 });
              }}
              aria-label="Lọc theo thương hiệu"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Tất cả Thương hiệu</option>
              {brands?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Density Toggle */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDensity((d) =>
                  d === "comfortable" ? "compact" : "comfortable",
                )
              }
              title={`Chuyển sang chế độ xem ${density === "comfortable" ? "thu gọn (Compact)" : "thoải mái (Comfortable)"}`}
              className="h-9 px-3 text-xs rounded-lg border-border text-foreground hover:bg-muted flex items-center gap-1.5"
            >
              {density === "comfortable" ? (
                <>
                  <Rows3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Compact</span>
                </>
              ) : (
                <>
                  <Rows4 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Comfortable</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Price Range Filter Row & Clear Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted-foreground" /> Khoảng giá
              (đ):
            </span>
            <input
              type="number"
              value={params.minPrice ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setParams({ minPrice: val, page: 1 });
              }}
              placeholder="Từ..."
              aria-label="Giá từ"
              className="w-28 h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span>-</span>
            <input
              type="number"
              value={params.maxPrice ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setParams({ maxPrice: val, page: 1 });
              }}
              placeholder="Đến..."
              aria-label="Giá đến"
              className="w-28 h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium px-2 py-1 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Xóa bộ lọc
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs rounded-lg border-border text-foreground hover:bg-muted flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Xuất CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Batch Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-card text-card-foreground border border-border px-4 py-3 rounded-xl shadow-md flex items-center justify-between transition-all">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
              {selectedIds.length}
            </span>
            <span>sản phẩm đã được chọn</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              className="h-8 text-xs rounded-lg flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa ({selectedIds.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs rounded-lg border-border hover:bg-muted flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" /> Xuất
              file
            </Button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* 5. Standard Data Table with 4 States */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        errorTitle="Không thể tải danh sách sản phẩm"
        onRetry={() => refetch()}
        isEmpty={products.length === 0}
        emptyTitle="Không tìm thấy sản phẩm nào"
        emptyDescription={
          hasActiveFilters
            ? "Thử thay đổi hoặc đặt lại các bộ lọc tìm kiếm."
            : "Chưa có sản phẩm nào trong hệ thống."
        }
        emptyAction={
          hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại bộ lọc
            </Button>
          ) : undefined
        }
        pagination={{
          page: meta.page,
          limit: meta.limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: (newPage) => setParams({ page: newPage }),
          onLimitChange: (newLimit) =>
            setParams({ pageSize: newLimit, page: 1 }),
        }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/50 border-b border-border text-muted-foreground text-xs font-semibold">
            <tr>
              <th scope="col" className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={isAllCurrentPageSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleToggleSelectAll}
                  aria-label="Chọn tất cả trên trang hiện tại"
                />
              </th>
              <th scope="col" className="w-16 px-4 py-3 text-left">
                <AdminSortHeader
                  title="ID"
                  field="id"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="desc"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <AdminSortHeader
                  title="Sản phẩm"
                  field="name"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <AdminSortHeader
                  title="Thương hiệu"
                  field="brand"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <AdminSortHeader
                  title="Danh mục"
                  field="category"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <AdminSortHeader
                  title="Khoảng giá"
                  field="price"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                  align="right"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                <AdminSortHeader
                  title="Biến thể"
                  field="variants"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="desc"
                  align="center"
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right uppercase tracking-wider w-28"
              >
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sortedProducts.map((product: Product) => {
              const isSelected = selectedIds.includes(product.id);
              const minPriceVal = Math.min(
                ...(product.variants?.map((v) => Number(v.sellingPrice)) || [
                  0,
                ]),
              );
              const maxPriceVal = Math.max(
                ...(product.variants?.map((v) => Number(v.sellingPrice)) || [
                  0,
                ]),
              );
              const thumb =
                product.images?.[0]?.url || product.variants?.[0]?.imageUrl;

              const rowPaddingClass =
                density === "comfortable" ? "py-3.5" : "py-2";

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-muted/50 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
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
                    className={`px-4 ${rowPaddingClass} whitespace-nowrap text-xs font-mono text-muted-foreground tabular-nums`}
                  >
                    #{product.id}
                  </td>

                  <td className={`px-4 ${rowPaddingClass}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <p
                          className="text-sm font-medium text-foreground truncate hover:text-primary cursor-pointer"
                          onClick={() => handleEdit(product)}
                          title={product.name}
                        >
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.slug || product.material || "Thời trang"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td
                    className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm text-muted-foreground`}
                  >
                    {product.brand?.name || "-"}
                  </td>

                  <td
                    className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm text-muted-foreground`}
                  >
                    {product.category?.name || "-"}
                  </td>

                  {/* Giá tiền căn phải + tabular-nums */}
                  <td
                    className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm font-semibold text-foreground text-right tabular-nums`}
                  >
                    {minPriceVal === maxPriceVal
                      ? formatCurrency(minPriceVal)
                      : `${formatCurrency(minPriceVal)} - ${formatCurrency(maxPriceVal)}`}
                  </td>

                  {/* Số biến thể căn giữa */}
                  <td
                    className={`px-4 ${rowPaddingClass} whitespace-nowrap text-sm text-center`}
                  >
                    <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums">
                      {product.variants?.length || 0} biến thể
                    </span>
                  </td>

                  {/* Hành động */}
                  <td
                    className={`px-6 ${rowPaddingClass} whitespace-nowrap text-right text-sm font-medium`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        onClick={() => handleEdit(product)}
                        title="Sửa sản phẩm"
                        aria-label={`Sửa sản phẩm ${product.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => handleDelete(product.id)}
                        title="Xóa sản phẩm"
                        aria-label={`Xóa sản phẩm ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminDataTable>

      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        alertOnly={confirmDialog.alertOnly}
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminProductsContent />
    </Suspense>
  );
}
