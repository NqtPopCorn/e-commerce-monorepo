"use client";

import React, { useMemo, useState } from "react";
import {
  FolderTree,
  Plus,
  Search,
  Folder,
  Tag,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminBreadcrumb,
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorState,
  AdminTableSkeleton,
  AdminConfirmDialog,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types/product";
import { useGetCategoryTree, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";

export default function AdminCategoriesPage() {
  const { data: tree, isLoading, isError, refetch } = useGetCategoryTree();
  const deleteCategory = useDeleteCategory();

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);

  // Expanded root categories state (default all expanded)
  const [collapsedRoots, setCollapsedRoots] = useState<Record<number, boolean>>(
    {},
  );

  // Confirm delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  const categories = tree || [];

  // Toggle expand/collapse
  const toggleCollapse = (id: number) => {
    setCollapsedRoots((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.trim().toLowerCase();

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
  }, [categories, searchTerm]);

  // Statistics
  const totalRoots = categories.length;
  const totalLeaves = categories.reduce(
    (acc, root) => acc + (root.children?.length || 0),
    0,
  );
  const totalProducts = categories.reduce((acc, root) => {
    const rootCount = root._count?.products || 0;
    const childrenCount = (root.children || []).reduce(
      (cAcc, child) => cAcc + (child._count?.products || 0),
      0,
    );
    return acc + rootCount + childrenCount;
  }, 0);

  // Actions
  const handleOpenCreateRoot = () => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setIsModalOpen(true);
  };

  const handleOpenCreateChild = (parentRoot: Category) => {
    setEditingCategory(null);
    setDefaultParentId(parentRoot.id);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDefaultParentId(cat.parentId ?? null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.category) return;
    const cat = deleteDialog.category;

    try {
      await deleteCategory.mutateAsync(cat.id);
      toast.success(`Đã xóa danh mục "${cat.name}"`);
      setDeleteDialog({ isOpen: false, category: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể xóa danh mục. Vui lòng kiểm tra lại.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Danh mục sản phẩm"
        description="Quản lý cây danh mục 2 cấp. Chỉ danh mục lá (Cấp 2) mới được gán vào sản phẩm."
        actions={
          <Button onClick={handleOpenCreateRoot} className="h-9 gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục</span>
          </Button>
        }
      />

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              Danh mục gốc (Cấp 1)
            </div>
            <div className="text-xl font-bold tracking-tight">{totalRoots}</div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-info/10 text-info">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              Danh mục lá (Cấp 2)
            </div>
            <div className="text-xl font-bold tracking-tight">
              {totalLeaves}
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-success/10 text-success">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              Sản phẩm đã phân loại
            </div>
            <div className="text-xl font-bold tracking-tight tabular-nums">
              {totalProducts}
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Content States */}
      {isLoading ? (
        <AdminTableSkeleton rows={6} cols={3} />
      ) : isError ? (
        <AdminErrorState
          title="Không tải được danh mục"
          description="Có lỗi khi lấy dữ liệu danh mục từ máy chủ. Vui lòng kiểm tra lại."
          onRetry={refetch}
        />
      ) : filteredCategories.length === 0 ? (
        <AdminEmptyState
          icon={FolderTree}
          title={
            searchTerm ? "Không tìm thấy danh mục" : "Chưa có danh mục sản phẩm"
          }
          description={
            searchTerm
              ? `Không có kết quả nào khớp với từ khóa "${searchTerm}".`
              : "Bắt đầu tạo danh mục gốc đầu tiên để phân loại sản phẩm thời trang."
          }
          action={
            <Button
              variant={searchTerm ? "outline" : "default"}
              onClick={
                searchTerm ? () => setSearchTerm("") : handleOpenCreateRoot
              }
              className="gap-1.5"
            >
              {searchTerm ? "Xóa tìm kiếm" : "Tạo danh mục gốc"}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
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
                className="border border-border rounded-lg bg-card overflow-hidden shadow-xs"
              >
                {/* Root Category Header Row */}
                <div className="p-4 bg-muted/40 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(root.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Folder className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-foreground">
                          {root.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5"
                        >
                          Cấp 1 (Gốc)
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {children.length} danh mục con • {rootProductCount} sản
                        phẩm
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCreateChild(root)}
                      className="h-8 text-xs gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm danh mục con
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(root)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Chỉnh sửa danh mục gốc"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteDialog({ isOpen: true, category: root })
                      }
                      className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                      title="Xóa danh mục gốc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories List */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/60">
                    {children.length === 0 ? (
                      <div className="px-6 py-4 text-xs text-muted-foreground italic flex items-center justify-between">
                        <span>Chưa có danh mục con nào trong nhóm này.</span>
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
                            className="px-6 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 pl-4 border-l-2 border-primary/30 ml-2">
                              <Tag className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-foreground">
                                    {child.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="bg-info/10 text-info border-info/20 text-[11px] px-1.5 py-0"
                                  >
                                    Cấp 2 (Lá)
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {productCount > 0 ? (
                                    <span className="tabular-nums font-medium text-foreground">
                                      {productCount}
                                    </span>
                                  ) : (
                                    "Chưa có"
                                  )}{" "}
                                  sản phẩm gán vào
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(child)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Chỉnh sửa danh mục con"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDeleteDialog({
                                    isOpen: true,
                                    category: child,
                                  })
                                }
                                className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                title="Xóa danh mục con"
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

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingCategory}
        defaultParentId={defaultParentId}
        rootCategories={categories}
      />

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, category: null })}
        onConfirm={handleDeleteConfirm}
        title={`Xóa danh mục "${deleteDialog.category?.name}"?`}
        description={
          deleteDialog.category?.parentId === null ? (
            <div>
              <p>
                Bạn đang chuẩn bị xóa danh mục gốc{" "}
                <strong>&quot;{deleteDialog.category?.name}&quot;</strong>.
              </p>
              {(deleteDialog.category?.children?.length ?? 0) > 0 && (
                <p className="mt-2 text-destructive font-semibold">
                  Cảnh báo: Danh mục này đang có{" "}
                  {deleteDialog.category?.children?.length} danh mục con. Bạn
                  phải xóa hoặc chuyển các danh mục con trước khi có thể xóa
                  danh mục này.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p>
                Bạn đang chuẩn bị xóa danh mục lá{" "}
                <strong>&quot;{deleteDialog.category?.name}&quot;</strong>.
              </p>
              {(deleteDialog.category?._count?.products ?? 0) > 0 && (
                <p className="mt-2 text-destructive font-semibold">
                  Cảnh báo: Danh mục này đang có{" "}
                  {deleteDialog.category?._count?.products} sản phẩm liên kết.
                  Bạn phải gỡ hoặc chuyển sản phẩm sang danh mục khác trước khi
                  xóa.
                </p>
              )}
            </div>
          )
        }
        confirmText="Xóa danh mục"
        variant="danger"
      />
    </div>
  );
}
