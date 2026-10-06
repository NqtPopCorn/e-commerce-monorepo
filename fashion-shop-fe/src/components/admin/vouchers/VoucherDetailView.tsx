"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminConfirmDialog,
} from "@/components/admin";
import { Voucher } from "@/types/voucher";
import { useDeleteVoucher } from "@/hooks/useVouchers";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Ticket,
  Percent,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

interface VoucherDetailViewProps {
  voucher: Voucher;
}

export function VoucherDetailView({ voucher }: VoucherDetailViewProps) {
  const router = useRouter();
  const deleteMutation = useDeleteVoucher();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(voucher.id);
      toast.success("Đã xóa mã voucher");
      router.push("/admin/vouchers");
    } catch {
      toast.error("Không thể xóa voucher. Vui lòng thử lại.");
    }
  };

  const now = new Date();
  const startDate = new Date(voucher.startsAt);
  const endDate = voucher.endsAt ? new Date(voucher.endsAt) : null;

  let timelineStatus: "ACTIVE" | "UPCOMING" | "EXPIRED" = "ACTIVE";
  let timelineLabel = "Đang có hiệu lực";
  if (!voucher.active) {
    timelineStatus = "EXPIRED";
    timelineLabel = "Đã tạm dừng";
  } else if (now < startDate) {
    timelineStatus = "UPCOMING";
    timelineLabel = "Sắp diễn ra";
  } else if (endDate && now > endDate) {
    timelineStatus = "EXPIRED";
    timelineLabel = "Đã hết hạn";
  }

  const discountBadgeLabel =
    voucher.discountType === "PERCENT"
      ? `Giảm ${voucher.discountValue}%${
          voucher.maxDiscountValue
            ? ` (Tối đa ${formatCurrency(Number(voucher.maxDiscountValue))})`
            : ""
        }`
      : `Giảm ${formatCurrency(Number(voucher.discountValue))}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Mã giảm giá", href: "/admin/vouchers" },
          { label: voucher.code },
        ]}
        title={voucher.name}
        badge={
          <span className="font-mono bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md text-xs tracking-wider font-bold">
            {voucher.code}
          </span>
        }
        description={`Mã giảm giá cấp đơn hàng #${voucher.id} • Tạo ngày ${formatDateTime(voucher.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/vouchers")}
              className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Danh sách
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa
            </Button>
            <Link href={`/admin/vouchers/${voucher.id}?mode=edit`}>
              <Button
                size="sm"
                className="h-9 px-4 gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                Chỉnh sửa
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Trạng thái
            </span>
            <div className="flex items-center gap-2 pt-1">
              <AdminStatusBadge
                status={
                  timelineStatus === "ACTIVE"
                    ? "ACTIVE"
                    : timelineStatus === "UPCOMING"
                      ? "PENDING"
                      : "INACTIVE"
                }
                customLabel={timelineLabel}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mức giảm */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-xs">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-primary" />
              Mức giảm giá
            </span>
            <p className="font-bold text-foreground text-sm pt-1 text-primary">
              {discountBadgeLabel}
            </p>
            <p className="text-muted-foreground">
              Đơn tối thiểu:{" "}
              {voucher.minOrderAmount
                ? formatCurrency(Number(voucher.minOrderAmount))
                : "0 đ"}
            </p>
          </CardContent>
        </Card>

        {/* Lượt dùng */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-xs">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Lượt đã sử dụng
            </span>
            <p className="text-lg font-bold text-foreground tabular-nums pt-0.5">
              {voucher.usedCount.toLocaleString()}
              {voucher.maxUses ? (
                <span className="text-xs text-muted-foreground font-normal">
                  {" "}
                  / {voucher.maxUses.toLocaleString()} lượt
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal">
                  {" "}
                  lượt
                </span>
              )}
            </p>
            {voucher.maxUsesPerCustomer && (
              <p className="text-muted-foreground">
                Tối đa {voucher.maxUsesPerCustomer} lượt/khách
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ngân sách */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-xs">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              Ngân sách đã chi
            </span>
            <p className="text-lg font-bold text-foreground tabular-nums pt-0.5">
              {formatCurrency(Number(voucher.spentAmount || 0))}
            </p>
            {voucher.budgetLimit && (
              <p className="text-xs text-muted-foreground">
                Hạn mức: {formatCurrency(Number(voucher.budgetLimit))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              Chi tiết quy tắc Voucher
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Mã áp dụng:</span>
              <span className="font-mono font-bold text-foreground">
                {voucher.code}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Tên hiển thị:</span>
              <span className="font-medium text-foreground">
                {voucher.name}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Hình thức giảm giá:</span>
              <span className="font-semibold text-foreground">
                {voucher.discountType === "PERCENT"
                  ? "Theo phần trăm (%)"
                  : "Số tiền cố định"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Giá trị giảm:</span>
              <span className="font-semibold text-primary">
                {voucher.discountType === "PERCENT"
                  ? `${voucher.discountValue}%`
                  : formatCurrency(Number(voucher.discountValue))}
              </span>
            </div>
            {voucher.discountType === "PERCENT" && (
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Mức giảm tối đa:</span>
                <span className="font-mono text-foreground">
                  {voucher.maxDiscountValue
                    ? formatCurrency(Number(voucher.maxDiscountValue))
                    : "Không giới hạn"}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Đơn hàng tối thiểu:</span>
              <span className="font-mono text-foreground">
                {voucher.minOrderAmount
                  ? formatCurrency(Number(voucher.minOrderAmount))
                  : "0 đ (Áp dụng mọi đơn)"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Thời gian & Giới hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Thời gian bắt đầu:</span>
              <span className="text-foreground">
                {formatDateTime(voucher.startsAt)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Thời gian kết thúc:</span>
              <span className="text-foreground">
                {voucher.endsAt
                  ? formatDateTime(voucher.endsAt)
                  : "Vô thời hạn"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">
                Giới hạn toàn hệ thống:
              </span>
              <span className="font-mono text-foreground">
                {voucher.maxUses
                  ? `${voucher.maxUses.toLocaleString()} lượt`
                  : "Không giới hạn"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">
                Giới hạn mỗi khách hàng:
              </span>
              <span className="font-mono text-foreground">
                {voucher.maxUsesPerCustomer
                  ? `${voucher.maxUsesPerCustomer} lượt`
                  : "Không giới hạn"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Ngân sách tối đa:</span>
              <span className="font-mono text-foreground">
                {voucher.budgetLimit
                  ? formatCurrency(Number(voucher.budgetLimit))
                  : "Không giới hạn"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {voucher.description && (
        <Card className="border-border">
          <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Mô tả điều kiện:</strong>{" "}
            {voucher.description}
          </CardContent>
        </Card>
      )}

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Xóa mã voucher"
        description={`Bạn có chắc muốn xóa mã voucher "${voucher.code}" (${voucher.name})? Khách hàng sẽ không thể nhập mã này trong đơn hàng nữa.`}
        confirmText="Xóa voucher"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
