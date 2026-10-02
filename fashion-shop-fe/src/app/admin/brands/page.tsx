"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Search, Tag, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AdminBreadcrumb,
  AdminPageHeader,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/types/product";
import { useGetBrands, useDeleteBrand } from "@/hooks/useBrands";
import { BrandFormModal } from "@/components/admin/brands/BrandFormModal";

export default function AdminBrandsPage() {
  const { data: brandsList, isLoading, isError, refetch } = useGetBrands();
  const deleteBrand = useDeleteBrand();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    brand: Brand | null;
  }>({
    isOpen: false,
    brand: null,
  });

  const brands = brandsList || [];

  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return brands;
    const q = searchTerm.trim().toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.slug && b.slug.toLowerCase().includes(q)),
    );
  }, [brands, searchTerm]);

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.brand) return;
    const brand = deleteDialog.brand;

    try {
      await deleteBrand.mutateAsync(brand.id);
      toast.success(`Đã xóa thương hiệu "${brand.name}"`);
      setDeleteDialog({ isOpen: false, brand: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể xóa thương hiệu. Vui lòng kiểm tra lại.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb
        items={[
          { label: "Vận hành", href: "/admin/products" },
          { label: "Thương hiệu", href: "/admin/brands" },
        ]}
      />

      {/* Header */}
      <AdminPageHeader
        title="Thương hiệu"
        description="Quản lý danh sách thương hiệu và nhãn hàng thời trang."
        actions={
          <Button onClick={handleOpenCreate} className="h-9 gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Thêm thương hiệu</span>
          </Button>
        }
      />

      {/* Filter / Search Toolbar */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thương hiệu theo tên hoặc slug..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        isEmpty={filteredBrands.length === 0}
        onRetry={refetch}
        emptyTitle={
          searchTerm ? "Không tìm thấy thương hiệu" : "Chưa có thương hiệu nào"
        }
        emptyDescription={
          searchTerm
            ? `Không có kết quả nào khớp với từ khóa "${searchTerm}".`
            : "Thêm thương hiệu đầu tiên để gán cho các sản phẩm thời trang."
        }
        emptyAction={
          <Button
            variant={searchTerm ? "outline" : "default"}
            onClick={searchTerm ? () => setSearchTerm("") : handleOpenCreate}
            className="gap-1.5"
          >
            {searchTerm ? "Xóa tìm kiếm" : "Thêm thương hiệu"}
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16 text-center">Logo</TableHead>
              <TableHead>Tên thương hiệu</TableHead>
              <TableHead>Đường dẫn (Slug)</TableHead>
              <TableHead className="text-right">Số sản phẩm</TableHead>
              <TableHead className="w-28 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.map((brand) => {
              const productCount = brand._count?.products || 0;

              return (
                <TableRow key={brand.id} className="hover:bg-muted/30">
                  <TableCell className="text-center py-3">
                    <div className="flex items-center justify-center">
                      {brand.logo ? (
                        <div className="relative w-9 h-9 rounded-md overflow-hidden border border-border bg-muted/40">
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            fill
                            sizes="36px"
                            className="object-contain p-0.5"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/20">
                          {brand.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground">
                    {brand.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-normal text-muted-foreground bg-muted/40"
                    >
                      {brand.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-sm">
                    {productCount > 0 ? (
                      productCount
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(brand)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Chỉnh sửa thương hiệu"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ isOpen: true, brand })}
                        className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        title="Xóa thương hiệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDataTable>

      {/* Create / Edit Modal */}
      <BrandFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingBrand}
      />

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, brand: null })}
        onConfirm={handleDeleteConfirm}
        title={`Xóa thương hiệu "${deleteDialog.brand?.name}"?`}
        description={
          <div>
            <p>
              Bạn đang chuẩn bị xóa thương hiệu{" "}
              <strong>&quot;{deleteDialog.brand?.name}&quot;</strong>.
            </p>
            {(deleteDialog.brand?._count?.products ?? 0) > 0 && (
              <p className="mt-2 text-destructive font-semibold">
                Cảnh báo: Thương hiệu này đang có{" "}
                {deleteDialog.brand?._count?.products} sản phẩm liên kết. Bạn
                phải gỡ thương hiệu khỏi các sản phẩm trước khi có thể xóa.
              </p>
            )}
          </div>
        }
        confirmText="Xóa thương hiệu"
        variant="danger"
      />
    </div>
  );
}
