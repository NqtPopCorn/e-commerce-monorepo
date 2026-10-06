"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteVoucher, useGetVouchers } from "@/hooks/useVouchers";
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
  Ticket,
  Search,
  Eye,
  Edit,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Voucher } from "@/types/voucher";
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

function AdminVouchersContent() {
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
  } = useGetVouchers({
    page: params.page,
    limit: params.pageSize,
    search: params.q || undefined,
  });

  const deleteMutation = useDeleteVoucher();
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const vouchers = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa mã voucher");
      setDeleteTarget(null);
    } catch {
      toast.error("Không thể xóa voucher. Vui lòng thử lại.");
    }
  };

  const getTimelineStatus = (voucher: Voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startsAt);
    const endDate = voucher.endsAt ? new Date(voucher.endsAt) : null;

    if (!voucher.active) {
      return { status: "INACTIVE" as const, label: "Tạm dừng" };
    }
    if (now < startDate) {
      return { status: "PENDING" as const, label: "Sắp diễn ra" };
    }
    if (endDate && now > endDate) {
      return { status: "INACTIVE" as const, label: "Hết hạn" };
    }
    return { status: "ACTIVE" as const, label: "Có hiệu lực" };
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Mã giảm giá" }]}
        title="Mã giảm giá (Voucher)"
        description="Quản lý danh sách voucher giảm giá cấp đơn hàng dành cho khách hàng nhập tại giỏ hàng."
        actions={
          <Link href="/admin/vouchers/create">
            <Button
              size="sm"
              className="h-9 px-4 gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo voucher mới
            </Button>
          </Link>
        }
      />

      {/* Toolbar: Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo mã hoặc tên voucher..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        isEmpty={vouchers.length === 0}
        onRetry={refetch}
        emptyTitle="Chưa có mã voucher nào"
        emptyDescription="Tạo mã voucher đầu tiên để khách hàng có thể áp dụng ưu đãi khi thanh toán đơn hàng."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead>Mã Voucher</TableHead>
              <TableHead>Tên hiển thị</TableHead>
              <TableHead>Mức giảm giá</TableHead>
              <TableHead className="text-right">Đơn tối thiểu</TableHead>
              <TableHead className="text-center">Lượt dùng</TableHead>
              <TableHead>Thời hạn</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((voucher, idx) => {
              const timeline = getTimelineStatus(voucher);
              const discountText =
                voucher.discountType === "PERCENT"
                  ? `${voucher.discountValue}%${
                      voucher.maxDiscountValue
                        ? ` (Tối đa ${formatCurrency(Number(voucher.maxDiscountValue))})`
                        : ""
                    }`
                  : formatCurrency(Number(voucher.discountValue));

              return (
                <TableRow
                  key={voucher.id}
                  className="hover:bg-muted/40 text-xs"
                >
                  <TableCell className="text-center text-muted-foreground font-mono">
                    {(params.page - 1) * params.pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/vouchers/${voucher.id}`}
                      className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md hover:bg-primary/20 transition-colors"
                    >
                      <Ticket className="w-3 h-3" />
                      <span>{voucher.code}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/vouchers/${voucher.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {voucher.name}
                      </Link>
                      {voucher.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {voucher.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">
                      {discountText}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {voucher.minOrderAmount
                      ? formatCurrency(Number(voucher.minOrderAmount))
                      : "0 đ"}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <span className="font-semibold">{voucher.usedCount}</span>
                    {voucher.maxUses ? (
                      <span className="text-muted-foreground">
                        /{voucher.maxUses}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1 text-foreground">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{formatDate(voucher.startsAt)}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {voucher.endsAt
                          ? `đến ${formatDate(voucher.endsAt)}`
                          : "Vô thời hạn"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <AdminStatusBadge
                      status={timeline.status}
                      customLabel={timeline.label}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/vouchers/${voucher.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/vouchers/${voucher.id}?mode=edit`}>
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
                        onClick={() => setDeleteTarget(voucher)}
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
        title="Xóa mã voucher"
        description={`Bạn có chắc muốn xóa mã voucher "${deleteTarget?.code}"? Khách hàng sẽ không thể nhập mã này trong đơn hàng nữa.`}
        confirmText="Xóa voucher"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function AdminVouchersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminVouchersContent />
    </Suspense>
  );
}
