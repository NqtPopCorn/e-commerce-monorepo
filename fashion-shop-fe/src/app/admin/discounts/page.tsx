"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteDiscount, useGetDiscounts } from "@/hooks/useDiscounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Percent,
  Search,
  Eye,
  Edit,
  Tag,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Discount } from "@/types/discount";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminDataTable,
  AdminConfirmDialog,
  AdminPageSkeleton,
  AdminPagination,
} from "@/components/admin";
import { useTableParams } from "@/hooks/useTableParams";
import { formatCurrency, formatDate } from "@/lib/format";

function AdminDiscountsContent() {
  const router = useRouter();
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });
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

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetDiscounts({
    page: params.page,
    limit: params.pageSize,
    search: params.q || undefined,
  });

  const deleteMutation = useDeleteDiscount();
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  const discounts = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa chương trình giảm giá");
      setDeleteTarget(null);
    } catch {
      toast.error("Không thể xóa chương trình giảm giá. Vui lòng thử lại.");
    }
  };

  const getTimelineStatus = (discount: Discount) => {
    const now = new Date();
    const startDate = new Date(discount.startsAt);
    const endDate = discount.endsAt ? new Date(discount.endsAt) : null;

    if (!discount.active) {
      return { status: "INACTIVE" as const, label: "Tạm dừng" };
    }
    if (now < startDate) {
      return { status: "PENDING" as const, label: "Sắp diễn ra" };
    }
    if (endDate && now > endDate) {
      return { status: "INACTIVE" as const, label: "Hết hạn" };
    }
    return { status: "ACTIVE" as const, label: "Đang áp dụng" };
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Giảm giá sản phẩm" }]}
        title="Giảm giá sản phẩm"
        description="Quản lý các chương trình Flash Sale và chiết khấu theo nhóm sản phẩm hoặc biến thể."
        actions={
          <Link href="/admin/discounts/create">
            <Button
              size="sm"
              className="h-9 px-4 gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo giảm giá mới
            </Button>
          </Link>
        }
      />

      {/* Toolbar: Search input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên chương trình..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        isEmpty={discounts.length === 0}
        onRetry={refetch}
        emptyTitle="Chưa có chương trình giảm giá nào"
        emptyDescription="Tạo chương trình giảm giá đầu tiên để áp dụng chiết khấu cho các mặt hàng thời trang."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead>Chương trình giảm giá</TableHead>
              <TableHead>Nhóm / Mức giảm</TableHead>
              <TableHead className="text-center">Ưu tiên</TableHead>
              <TableHead>Thời gian áp dụng</TableHead>
              <TableHead className="text-center">Lượt dùng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount, idx) => {
              const timeline = getTimelineStatus(discount);
              const groupCount = discount.groups?.length || 0;
              const totalVariants =
                discount.groups?.reduce(
                  (sum, g) =>
                    sum + (g.variants?.length || g.variantIds?.length || 0),
                  0,
                ) || 0;

              return (
                <TableRow
                  key={discount.id}
                  className="hover:bg-muted/40 text-xs"
                >
                  <TableCell className="text-center text-muted-foreground font-mono">
                    {(params.page - 1) * params.pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/discounts/${discount.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {discount.name}
                      </Link>
                      {discount.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {discount.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {discount.groups?.slice(0, 2).map((g, gIdx) => (
                          <span
                            key={g.id || gIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-medium"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {g.discountType === "PERCENT"
                              ? `${g.discountValue}%`
                              : `${formatCurrency(Number(g.discountValue))}`}
                          </span>
                        ))}
                        {groupCount > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{groupCount - 2} nhóm
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {groupCount} nhóm • {totalVariants} biến thể
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono font-medium">
                    {discount.priority}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1 text-foreground">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{formatDate(discount.startsAt)}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {discount.endsAt
                          ? `đến ${formatDate(discount.endsAt)}`
                          : "Không thời hạn"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <span className="font-semibold">{discount.usedCount}</span>
                    {discount.maxUses ? (
                      <span className="text-muted-foreground">
                        /{discount.maxUses}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center">
                    <AdminStatusBadge
                      status={timeline.status}
                      customLabel={timeline.label}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/discounts/${discount.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/discounts/${discount.id}?mode=edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(discount)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Xóa"
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

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <AdminPagination
          page={params.page}
          limit={params.pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(page: number) => setParams({ page })}
          onLimitChange={(limit: number) =>
            setParams({ pageSize: limit, page: 1 })
          }
        />
      )}

      {/* Delete confirmation dialog */}
      <AdminConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa chương trình giảm giá"
        description={`Bạn có chắc muốn xóa chương trình "${deleteTarget?.name}"? Các sản phẩm trong chương trình này sẽ trở về giá bán thông thường.`}
        confirmText="Xóa chương trình"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function AdminDiscountsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminDiscountsContent />
    </Suspense>
  );
}
