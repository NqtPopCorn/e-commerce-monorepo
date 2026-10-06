"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGetProducts } from "@/hooks/useProducts";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Star,
  Sparkles,
  Folder,
  FolderTree,
  Tag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { brandsService } from "@/services/brands.service";
import { Product, Category, Brand } from "@/types/product";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const searchQuery = searchParams.get("q");

  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts();

  // State mở/đóng các nhánh danh mục gốc
  const [expandedRoots, setExpandedRoots] = useState<Record<number, boolean>>(
    {},
  );

  const toggleRoot = (id: number) => {
    setExpandedRoots((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Fetch categories tree & brands for sidebar
  const { data: treeData } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: categoriesService.getTree,
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const categoryTree = Array.isArray(treeData) ? treeData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  // Lọc sản phẩm
  let filteredProducts = Array.isArray(productsData) ? productsData : [];

  if (categoryParam) {
    const categoryParamLower = categoryParam.toLowerCase();

    // 1. Tìm xem categoryParam có phải là danh mục cha (gốc) không
    const matchingRoot = categoryTree.find(
      (root: Category) =>
        root.name.toLowerCase() === categoryParamLower ||
        String(root.id) === categoryParam,
    );

    // 2. Danh sách tên danh mục hợp lệ (nếu là cha thì gồm tên cha + tất cả tên con của nó)
    const validNames = matchingRoot
      ? [
          matchingRoot.name.toLowerCase(),
          ...(matchingRoot.children || []).map((c) => c.name.toLowerCase()),
        ]
      : [categoryParamLower];

    // Danh sách id danh mục hợp lệ
    const validIds = matchingRoot
      ? [matchingRoot.id, ...(matchingRoot.children || []).map((c) => c.id)]
      : !isNaN(Number(categoryParam))
        ? [Number(categoryParam)]
        : [];

    filteredProducts = filteredProducts.filter((prod: Product) => {
      const catName = prod.category?.name?.toLowerCase();
      const parentName = prod.category?.parent?.name?.toLowerCase();

      // Khớp theo tên danh mục sản phẩm hoặc tên danh mục cha
      if (catName && validNames.includes(catName)) return true;
      if (parentName && validNames.includes(parentName)) return true;

      // Khớp theo ID danh mục sản phẩm hoặc ID cha
      if (prod.categoryId && validIds.includes(prod.categoryId)) return true;
      if (
        prod.category?.parentId &&
        validIds.includes(prod.category.parentId)
      ) {
        return true;
      }

      return false;
    });
  }

  if (brandParam) {
    filteredProducts = filteredProducts.filter(
      (prod: Product) =>
        prod.brand?.name?.toLowerCase() === brandParam.toLowerCase(),
    );
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter((prod: Product) => {
      const nameMatch = prod.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const brandMatch = prod.brand?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matMatch = prod.material
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      return nameMatch || brandMatch || matMatch;
    });
  }

  // Tìm danh mục đang chọn để render Breadcrumb phân cấp
  const activeRoot = categoryTree.find(
    (root: Category) =>
      root.name.toLowerCase() === categoryParam?.toLowerCase() ||
      String(root.id) === categoryParam,
  );

  const activeChild =
    !activeRoot && categoryParam
      ? categoryTree
          .flatMap((r: Category) =>
            (r.children || []).map((c: Category) => ({
              ...c,
              parentName: r.name,
              parentId: r.id,
            })),
          )
          .find(
            (c) =>
              c.name.toLowerCase() === categoryParam.toLowerCase() ||
              String(c.id) === categoryParam,
          )
      : null;

  // Phân trang sản phẩm
  const [pageSize, setPageSize] = useState<number>(6);
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);

  const startItem = totalProducts > 0 ? (validPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(validPage * pageSize, totalProducts);

  const paginatedProducts = filteredProducts.slice(
    (validPage - 1) * pageSize,
    validPage * pageSize,
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", String(newPage));
    } else {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (validPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, validPage - 1);
      const end = Math.min(totalPages - 1, validPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (validPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center flex-wrap gap-2 bg-white p-3.5 rounded-xl shadow-xs border border-gray-100">
        <Link href="/" className="hover:text-rose-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link
          href="/products"
          className="hover:text-rose-600 transition-colors"
        >
          Thời trang
        </Link>

        {activeChild ? (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link
              href={`/products?category=${encodeURIComponent(activeChild.parentName)}`}
              className="hover:text-rose-600 transition-colors"
            >
              {activeChild.parentName}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold">
              {activeChild.name}
            </span>
          </>
        ) : activeRoot ? (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold">
              {activeRoot.name}
            </span>
          </>
        ) : categoryParam || brandParam || searchQuery ? (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold">
              {categoryParam
                ? `Danh mục: ${categoryParam}`
                : brandParam
                  ? `Thương hiệu: ${brandParam}`
                  : `Tìm kiếm: "${searchQuery}"`}
            </span>
          </>
        ) : null}
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4 shrink-0">
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden sticky top-24 divide-y divide-gray-100">
            <div className="p-4 bg-slate-50 flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider text-xs">
              <Filter className="w-4 h-4 text-rose-600" /> Bộ lọc thời trang
            </div>

            {/* Category Tree List */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Danh mục
                </h3>
                {categoryParam && (
                  <Link
                    href="/products"
                    className="text-[11px] font-medium text-rose-600 hover:underline"
                  >
                    Xóa lọc
                  </Link>
                )}
              </div>

              <div className="space-y-1 text-sm">
                {/* Tất cả sản phẩm */}
                <Link
                  href="/products"
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-sm transition-colors ${
                    !categoryParam && !brandParam
                      ? "font-bold text-rose-600 bg-rose-50"
                      : "text-gray-700 hover:text-rose-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span>Tất cả sản phẩm</span>
                  </div>
                </Link>

                {/* Tree Branches */}
                <div className="space-y-2 pt-1.5">
                  {categoryTree.map((root: Category) => {
                    const children = root.children || [];
                    const isRootActive =
                      categoryParam?.toLowerCase() ===
                        root.name.toLowerCase() ||
                      categoryParam === String(root.id);
                    const isChildActive = children.some(
                      (c) =>
                        c.name.toLowerCase() === categoryParam?.toLowerCase() ||
                        String(c.id) === categoryParam,
                    );
                    const isOpen =
                      expandedRoots[root.id] !== undefined
                        ? expandedRoots[root.id]
                        : true;

                    return (
                      <div key={root.id} className="space-y-1">
                        {/* Root Category Row */}
                        <div
                          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
                            isRootActive
                              ? "bg-rose-50 text-rose-600 font-bold"
                              : "text-gray-800 hover:bg-gray-50 font-medium"
                          }`}
                        >
                          <Link
                            href={`/products?category=${encodeURIComponent(root.name)}`}
                            className="flex items-center justify-between flex-1 min-w-0 pr-1 group"
                            title={`Lọc tất cả sản phẩm thuộc ${root.name}`}
                          >
                            <span className="truncate text-sm">
                              {root.name}
                            </span>
                          </Link>

                          {children.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleRoot(root.id);
                              }}
                              className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors ml-1"
                              aria-label={isOpen ? "Thu gọn" : "Mở rộng"}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isOpen ? "" : "-rotate-90"
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Children / Leaf Categories (with visual tree connector lines) */}
                        {isOpen && children.length > 0 && (
                          <div className="ml-3 pl-3.5 border-l-2 border-slate-200 space-y-0.5 py-0.5">
                            {children.map((child: Category) => {
                              const isLeafActive =
                                categoryParam?.toLowerCase() ===
                                  child.name.toLowerCase() ||
                                categoryParam === String(child.id);

                              return (
                                <div
                                  key={child.id}
                                  className="relative flex items-center"
                                >
                                  {/* Horizontal branch tick */}
                                  <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-px bg-slate-200" />

                                  <Link
                                    href={`/products?category=${encodeURIComponent(child.name)}`}
                                    className={`flex items-center justify-between w-full py-1 px-2.5 rounded-md text-xs transition-colors truncate ${
                                      isLeafActive
                                        ? "font-bold text-rose-600 bg-rose-50 shadow-2xs"
                                        : "text-gray-600 hover:text-rose-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {child.name}
                                    </span>
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
              {categoryParam ||
                brandParam ||
                (searchQuery
                  ? `Kết quả: "${searchQuery}"`
                  : "Bộ sưu tập thời trang")}
            </h1>
            <div className="text-sm text-gray-500 font-medium">
              Trang <span className="text-gray-900 font-bold">{validPage}</span>{" "}
              / {totalPages} • {totalProducts} sản phẩm
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
              {paginatedProducts.map((prod: Product) => {
                const minFinalPrice = Math.min(
                  ...(prod.variants?.map((v) =>
                    v.discountedPrice !== undefined
                      ? Number(v.discountedPrice)
                      : Number(v.sellingPrice),
                  ) || [0]),
                );
                const maxOriginalPrice = Math.max(
                  ...(prod.variants?.map((v) =>
                    Math.max(
                      Number(v.listPrice || 0),
                      Number(v.sellingPrice || 0),
                    ),
                  ) || [0]),
                );
                const discount =
                  maxOriginalPrice > minFinalPrice
                    ? Math.round(
                        ((maxOriginalPrice - minFinalPrice) /
                          maxOriginalPrice) *
                          100,
                      )
                    : 0;
                const imageUrl =
                  prod.images?.[0]?.url ||
                  prod.variants?.[0]?.imageUrl ||
                  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80";

                // Unique sizes
                const sizes = Array.from(
                  new Set(prod.variants?.map((v) => v.size).filter(Boolean)),
                );

                return (
                  <Link key={prod.id} href={`/products/${prod.id}`}>
                    <div className="bg-white rounded-xl shadow-xs border border-gray-100 hover:shadow-lg transition-all h-full flex flex-col overflow-hidden group">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={prod.name}
                          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow">
                            -{discount}%
                          </span>
                        )}
                        {prod.brand && (
                          <span className="absolute bottom-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
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
                              <span className="text-[10px] text-slate-400">
                                +{sizes.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-auto flex items-baseline gap-2">
                          <span className="font-bold text-rose-600 text-base">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(minFinalPrice || 0)}
                          </span>
                          {maxOriginalPrice > minFinalPrice && (
                            <span className="text-gray-400 text-xs line-through">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(maxOriginalPrice)}
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

          {/* Phân trang khách hàng */}
          {totalProducts > 0 && (
            <div className="mt-8 bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <div>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {startItem}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {endItem}
                  </span>{" "}
                  trên{" "}
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {totalProducts}
                  </span>{" "}
                  sản phẩm
                </div>

                <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                  <span className="text-gray-400">Hiển thị:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      handlePageChange(1);
                    }}
                    aria-label="Số sản phẩm trên mỗi trang"
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value={6}>6 / trang</option>
                    <option value={12}>12 / trang</option>
                    <option value={24}>24 / trang</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* Về trang đầu */}
                <button
                  type="button"
                  disabled={validPage <= 1}
                  onClick={() => handlePageChange(1)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Trang đầu"
                  aria-label="Trang đầu"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Trang trước */}
                <button
                  type="button"
                  disabled={validPage <= 1}
                  onClick={() => handlePageChange(validPage - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Các số trang */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-gray-400 text-xs font-medium select-none"
                        >
                          ...
                        </span>
                      );
                    }
                    const isCurrent = p === validPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(Number(p))}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`min-w-[36px] h-9 px-2.5 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                          isCurrent
                            ? "bg-rose-600 text-white shadow-xs"
                            : "border border-gray-200 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Trang sau */}
                <button
                  type="button"
                  disabled={validPage >= totalPages}
                  onClick={() => handlePageChange(validPage + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Đến trang cuối */}
                <button
                  type="button"
                  disabled={validPage >= totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Trang cuối"
                  aria-label="Trang cuối"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-20">Đang tải danh sách...</div>}
    >
      <ProductsContent />
    </Suspense>
  );
}
