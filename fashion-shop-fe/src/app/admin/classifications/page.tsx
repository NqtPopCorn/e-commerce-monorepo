"use client";

import React, { useMemo, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FolderTree,
  Tag,
  Plus,
  Search,
  Folder,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminBreadcrumb,
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorState,
  AdminTableSkeleton,
  AdminConfirmDialog,
  AdminDataTable,
} from "@/components/admin";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Category, Brand } from "@/types/product";
import { useGetCategoryTree, useDeleteCategory } from "@/hooks/useCategories";
import { useGetBrands, useDeleteBrand } from "@/hooks/useBrands";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";
import { BrandFormModal } from "@/components/admin/brands/BrandFormModal";

function ClassificationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active tab ("categories" | "brands")
  const currentTab =
    searchParams.get("tab") === "brands" ? "brands" : "categories";

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // --- Categories State & Queries ---
  const {
    data: tree,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useGetCategoryTree();
  const deleteCategory = useDeleteCategory();

  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);
  const [collapsedRoots, setCollapsedRoots] = useState<Record<number, boolean>>(
    {},
  );

  const [categoryDeleteDialog, setCategoryDeleteDialog] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  const categories = tree || [];

  const toggleCollapse = (id: number) => {
    setCollapsedRoots((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.trim().toLowerCase();

    return categories
      .map((root) => {
        const rootMatches = root.name.toLowerCase().includes(q);
        const matchedChildren = (root.children || []).filter((child) =>
          child.name.toLowerCase().includes(q),
        );

        if (rootMatches) {
          return root;
        }
        if (matchedChildren.length > 0) {
          return {
            ...root,
            children: matchedChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as Category[];
  }, [categories, categorySearch]);

  const handleOpenCreateRoot = () => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenCreateChild = (parentRoot: Category) => {
    setEditingCategory(null);
    setDefaultParentId(parentRoot.id);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setDefaultParentId(cat.parentId ?? null);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryDeleteDialog.category) return;
    const cat = categoryDeleteDialog.category;

    try {
      await deleteCategory.mutateAsync(cat.id);
      toast.success(`Đã xóa danh mục "${cat.name}"`);
      setCategoryDeleteDialog({ isOpen: false, category: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể xóa danh mục. Vui lòng kiểm tra lại.";
      toast.error(message);
    }
  };

  // --- Brands State & Queries ---
  const {
    data: brandsList,
    isLoading: isLoadingBrands,
    isError: isBrandsError,
    refetch: refetchBrands,
  } = useGetBrands();
  const deleteBrand = useDeleteBrand();

  const [brandSearch, setBrandSearch] = useState("");
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [brandDeleteDialog, setBrandDeleteDialog] = useState<{
    isOpen: boolean;
    brand: Brand | null;
  }>({
    isOpen: false,
    brand: null,
  });

  const brands = brandsList || [];

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.trim().toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.slug && b.slug.toLowerCase().includes(q)),
    );
  }, [brands, brandSearch]);

  const handleOpenCreateBrand = () => {
    setEditingBrand(null);
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setIsBrandModalOpen(true);
  };

  const handleDeleteBrandConfirm = async () => {
    if (!brandDeleteDialog.brand) return;
    const b = brandDeleteDialog.brand;

    try {
      await deleteBrand.mutateAsync(b.id);
      toast.success(`Đã xóa thương hiệu "${b.name}"`);
      setBrandDeleteDialog({ isOpen: false, brand: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể xóa thương hiệu. Vui lòng kiểm tra lại.";
      toast.error(message);
    }
  };

  const totalLeafCategories = categories.reduce(
    (acc, root) => acc + (root.children?.length || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Phân loại sản phẩm"
        description="Quản lý danh mục 2 cấp và thương hiệu sản phẩm thời trang."
        actions={
          currentTab === "categories" ? (
            <Button
              onClick={handleOpenCreateRoot}
              className="h-9 gap-1.5 font-medium text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục gốc</span>
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreateBrand}
              className="h-9 gap-1.5 font-medium text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm thương hiệu</span>
            </Button>
          )
        }
      />

      {/* Segmented Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-5"
      >
        <TabsList className="bg-muted/80 p-1 border border-border rounded-lg inline-flex h-10">
          <TabsTrigger
            value="categories"
            className="flex items-center gap-2 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-md transition-all"
          >
            <FolderTree className="w-4 h-4 text-primary" />
            <span>Danh mục sản phẩm</span>
          </TabsTrigger>
          <TabsTrigger
            value="brands"
            className="flex items-center gap-2 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-md transition-all"
          >
            <Tag className="w-4 h-4 text-info" />
            <span>Thương hiệu</span>
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: DANH MỤC SẢN PHẨM ================= */}
        <TabsContent
          value="categories"
          className="space-y-4 focus-visible:outline-none"
        >
          {/* Search Toolbar */}
          <div className="border border-border rounded-lg p-3 bg-card flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Tìm kiếm danh mục theo tên..."
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>
            {categorySearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategorySearch("")}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>

          {/* Categories Content State */}
          {isLoadingCategories ? (
            <AdminTableSkeleton rows={5} cols={3} />
          ) : isCategoriesError ? (
            <AdminErrorState
              title="Không tải được danh mục"
              description="Có lỗi khi lấy dữ liệu danh mục từ máy chủ. Vui lòng thử lại."
              onRetry={refetchCategories}
            />
          ) : filteredCategories.length === 0 ? (
            <AdminEmptyState
              icon={FolderTree}
              title={
                categorySearch
                  ? "Không tìm thấy danh mục"
                  : "Chưa có danh mục sản phẩm"
              }
              description={
                categorySearch
                  ? `Không có kết quả nào khớp với từ khóa "${categorySearch}".`
                  : "Bắt đầu tạo danh mục gốc đầu tiên để phân loại sản phẩm thời trang."
              }
              action={
                <Button
                  variant={categorySearch ? "outline" : "default"}
                  size="sm"
                  onClick={
                    categorySearch
                      ? () => setCategorySearch("")
                      : handleOpenCreateRoot
                  }
                  className="gap-1.5 text-xs"
                >
                  {categorySearch ? "Xóa tìm kiếm" : "Tạo danh mục gốc"}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((root) => {
                const isCollapsed = !!collapsedRoots[root.id];
                const children = root.children || [];
                const rootProductCount = children.reduce(
                  (acc, c) => acc + (c._count?.products || 0),
                  0,
                );

                return (
                  <div
                    key={root.id}
                    className="border border-border rounded-lg bg-card overflow-hidden shadow-2xs"
                  >
                    {/* Root Category Row */}
                    <div className="p-3.5 bg-muted/40 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleCollapse(root.id)}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <Folder className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {root.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {children.length} danh mục con • {rootProductCount}{" "}
                            sản phẩm
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCreateChild(root)}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Thêm con
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditCategory(root)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Chỉnh sửa danh mục gốc"
                          aria-label={`Chỉnh sửa ${root.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCategoryDeleteDialog({
                              isOpen: true,
                              category: root,
                            })
                          }
                          className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          title="Xóa danh mục gốc"
                          aria-label={`Xóa ${root.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories (Leaf) List */}
                    {!isCollapsed && (
                      <div className="divide-y divide-border/60">
                        {children.length === 0 ? (
                          <div className="px-5 py-3 text-xs text-muted-foreground italic flex items-center justify-between">
                            <span>
                              Chưa có danh mục con nào trong nhóm này.
                            </span>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleOpenCreateChild(root)}
                              className="text-xs h-auto p-0"
                            >
                              + Thêm ngay
                            </Button>
                          </div>
                        ) : (
                          children.map((child) => {
                            const productCount = child._count?.products || 0;

                            return (
                              <div
                                key={child.id}
                                className="px-5 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                              >
                                <div className="flex items-center gap-3 pl-4 border-l-2 border-primary/30 ml-3">
                                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-xs text-foreground">
                                        {child.name}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      {productCount > 0 ? (
                                        <span className="tabular-nums font-semibold text-foreground">
                                          {productCount}
                                        </span>
                                      ) : (
                                        "0"
                                      )}{" "}
                                      sản phẩm gán vào
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenEditCategory(child)
                                    }
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    title="Chỉnh sửa danh mục con"
                                    aria-label={`Chỉnh sửa ${child.name}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setCategoryDeleteDialog({
                                        isOpen: true,
                                        category: child,
                                      })
                                    }
                                    className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                    title="Xóa danh mục con"
                                    aria-label={`Xóa ${child.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ================= TAB 2: THƯƠNG HIỆU ================= */}
        <TabsContent
          value="brands"
          className="space-y-4 focus-visible:outline-none"
        >
          {/* Search Toolbar */}
          <div className="border border-border rounded-lg p-3 bg-card flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Tìm kiếm thương hiệu theo tên hoặc slug..."
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>
            {brandSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBrandSearch("")}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>

          {/* Brands Content State */}
          {isLoadingBrands ? (
            <AdminTableSkeleton rows={5} cols={4} />
          ) : isBrandsError ? (
            <AdminErrorState
              title="Không tải được thương hiệu"
              description="Có lỗi khi lấy dữ liệu thương hiệu từ máy chủ. Vui lòng thử lại."
              onRetry={refetchBrands}
            />
          ) : filteredBrands.length === 0 ? (
            <AdminEmptyState
              icon={Tag}
              title={
                brandSearch
                  ? "Không tìm thấy thương hiệu"
                  : "Chưa có thương hiệu nào"
              }
              description={
                brandSearch
                  ? `Không có kết quả nào khớp với từ khóa "${brandSearch}".`
                  : "Bắt đầu tạo thương hiệu đầu tiên cho sản phẩm thời trang."
              }
              action={
                <Button
                  variant={brandSearch ? "outline" : "default"}
                  size="sm"
                  onClick={
                    brandSearch
                      ? () => setBrandSearch("")
                      : handleOpenCreateBrand
                  }
                  className="gap-1.5 text-xs"
                >
                  {brandSearch ? "Xóa tìm kiếm" : "Tạo thương hiệu"}
                </Button>
              }
            />
          ) : (
            <AdminDataTable>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">Logo</TableHead>
                    <TableHead>Tên thương hiệu</TableHead>
                    <TableHead>Đường dẫn (Slug)</TableHead>
                    <TableHead className="text-right">Sản phẩm</TableHead>
                    <TableHead className="text-right w-24">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrands.map((b) => {
                    const productCount = b._count?.products || 0;

                    return (
                      <TableRow key={b.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="w-9 h-9 rounded-md bg-muted border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                            {b.logo ? (
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="font-bold text-xs text-muted-foreground">
                                {b.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {b.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                            /{b.slug}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-xs tabular-nums text-foreground">
                            {productCount}
                          </span>{" "}
                          <span className="text-xs text-muted-foreground">
                            sp
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditBrand(b)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Chỉnh sửa thương hiệu"
                              aria-label={`Chỉnh sửa ${b.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setBrandDeleteDialog({ isOpen: true, brand: b })
                              }
                              className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                              title="Xóa thương hiệu"
                              aria-label={`Xóa ${b.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminDataTable>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        initialData={editingCategory}
        defaultParentId={defaultParentId}
        rootCategories={categories}
      />

      {/* Brand Create/Edit Modal */}
      <BrandFormModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        initialData={editingBrand}
      />

      {/* Confirm Delete Category Dialog */}
      <AdminConfirmDialog
        isOpen={categoryDeleteDialog.isOpen}
        onClose={() =>
          setCategoryDeleteDialog({ isOpen: false, category: null })
        }
        onConfirm={handleDeleteCategoryConfirm}
        title="Xác nhận xóa danh mục"
        description={
          categoryDeleteDialog.category ? (
            <span>
              Bạn có chắc muốn xóa danh mục{" "}
              <strong>&quot;{categoryDeleteDialog.category.name}&quot;</strong>?
              Hành động này không thể hoàn tác nếu danh mục đang chứa dữ liệu
              con hoặc sản phẩm.
            </span>
          ) : null
        }
        confirmText="Xóa danh mục"
        variant="danger"
        isLoading={deleteCategory.isPending}
      />

      {/* Confirm Delete Brand Dialog */}
      <AdminConfirmDialog
        isOpen={brandDeleteDialog.isOpen}
        onClose={() => setBrandDeleteDialog({ isOpen: false, brand: null })}
        onConfirm={handleDeleteBrandConfirm}
        title="Xác nhận xóa thương hiệu"
        description={
          brandDeleteDialog.brand ? (
            <span>
              Bạn có chắc muốn xóa thương hiệu{" "}
              <strong>&quot;{brandDeleteDialog.brand.name}&quot;</strong>? Không
              thể xóa nếu thương hiệu vẫn còn sản phẩm liên kết.
            </span>
          ) : null
        }
        confirmText="Xóa thương hiệu"
        variant="danger"
        isLoading={deleteBrand.isPending}
      />
    </div>
  );
}

export default function AdminClassificationsPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton rows={6} cols={3} />}>
      <ClassificationsContent />
    </Suspense>
  );
}
