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
import { Discount } from "@/types/discount";
import { useDeleteDiscount } from "@/hooks/useDiscounts";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Layers,
  Tag,
  Package,
} from "lucide-react";

interface DiscountDetailViewProps {
  discount: Discount;
}

export function DiscountDetailView({ discount }: DiscountDetailViewProps) {
  const router = useRouter();
  const deleteMutation = useDeleteDiscount();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(discount.id);
      toast.success("Đã xóa chương trình giảm giá");
      router.push("/admin/discounts");
    } catch {
      toast.error("Không thể xóa chương trình giảm giá. Vui lòng thử lại.");
    }
  };

  const now = new Date();
  const startDate = new Date(discount.startsAt);
  const endDate = discount.endsAt ? new Date(discount.endsAt) : null;

  let timelineStatus: "ACTIVE" | "UPCOMING" | "EXPIRED" = "ACTIVE";
  let timelineLabel = "Đang áp dụng";
  if (!discount.active) {
    timelineStatus = "EXPIRED";
    timelineLabel = "Đã tạm dừng";
  } else if (now < startDate) {
    timelineStatus = "UPCOMING";
    timelineLabel = "Sắp diễn ra";
  } else if (endDate && now > endDate) {
    timelineStatus = "EXPIRED";
    timelineLabel = "Đã kết thúc";
  }

  const totalVariants =
    discount.groups?.reduce(
      (sum, g) => sum + (g.variants?.length || g.variantIds?.length || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Giảm giá sản phẩm", href: "/admin/discounts" },
          { label: discount.name },
        ]}
        title={discount.name}
        description={`Chương trình giảm giá sản phẩm #${discount.id} • Tạo ngày ${formatDateTime(discount.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/discounts")}
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
            <Link href={`/admin/discounts/${discount.id}?mode=edit`}>
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
              <span className="text-xs text-muted-foreground">
                Ưu tiên: <strong>{discount.priority}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Thời gian */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-xs">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Thời gian áp dụng
            </span>
            <p className="font-semibold text-foreground pt-1">
              {formatDateTime(discount.startsAt)}
            </p>
            <p className="text-muted-foreground">
              {discount.endsAt
                ? `đến ${formatDateTime(discount.endsAt)}`
                : "Không thời hạn"}
            </p>
          </CardContent>
        </Card>

        {/* Lượt dùng */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1 text-xs">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Lượt đã áp dụng
            </span>
            <p className="text-lg font-bold text-foreground tabular-nums pt-0.5">
              {discount.usedCount.toLocaleString()}
              {discount.maxUses ? (
                <span className="text-xs text-muted-foreground font-normal">
                  {" "}
                  / {discount.maxUses.toLocaleString()} lượt
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal">
                  {" "}
                  lượt
                </span>
              )}
            </p>
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
              {formatCurrency(Number(discount.spentAmount || 0))}
            </p>
            {discount.budgetLimit && (
              <p className="text-xs text-muted-foreground">
                Hạn mức: {formatCurrency(Number(discount.budgetLimit))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description if present */}
      {discount.description && (
        <Card className="border-border">
          <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Mô tả:</strong>{" "}
            {discount.description}
          </CardContent>
        </Card>
      )}

      {/* Groups & Applied Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Nhóm chiết khấu & Sản phẩm áp dụng ({discount.groups?.length ||
              0}{" "}
            nhóm, {totalVariants} SKU)
          </h2>
        </div>

        <div className="space-y-4">
          {discount.groups?.map((group, gIdx) => {
            const groupVariants = group.variants || [];
            return (
              <Card
                key={group.id || gIdx}
                className="border-border overflow-hidden"
              >
                <CardHeader className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {gIdx + 1}
                      </span>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {group.name}
                      </CardTitle>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                      <Tag className="w-3 h-3" />
                      {group.discountType === "PERCENT"
                        ? `Giảm ${group.discountValue}%${group.maxDiscountValue ? ` (Tối đa ${formatCurrency(Number(group.maxDiscountValue))})` : ""}`
                        : `Giảm ${formatCurrency(Number(group.discountValue))}`}
                    </span>
                    <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">
                      {groupVariants.length} biến thể
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {groupVariants.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Không có sản phẩm nào trong nhóm này
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">
                              Sản phẩm
                            </th>
                            <th className="px-4 py-2.5 font-medium">SKU</th>
                            <th className="px-4 py-2.5 font-medium text-right">
                              Giá gốc
                            </th>
                            <th className="px-4 py-2.5 font-medium text-right">
                              Mức giảm
                            </th>
                            <th className="px-4 py-2.5 font-medium text-right">
                              Giá sau giảm
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {groupVariants.map((item, vIdx) => {
                            const originalPrice =
                              Number(item.variant?.sellingPrice) || 0;
                            const discountValue =
                              Number(group.discountValue) || 0;
                            const maxDiscountValue = group.maxDiscountValue
                              ? Number(group.maxDiscountValue)
                              : undefined;

                            let discountAmount = 0;
                            if (group.discountType === "PERCENT") {
                              discountAmount = Math.round(
                                (originalPrice * discountValue) / 100,
                              );
                              if (
                                maxDiscountValue &&
                                discountAmount > maxDiscountValue
                              ) {
                                discountAmount = maxDiscountValue;
                              }
                            } else {
                              discountAmount = discountValue;
                            }
                            const finalPrice = Math.max(
                              0,
                              originalPrice - discountAmount,
                            );

                            const variantAttrs = [
                              item.variant?.size,
                              item.variant?.color,
                            ]
                              .filter(Boolean)
                              .join(" - ");

                            return (
                              <tr key={vIdx} className="hover:bg-muted/20">
                                <td className="px-4 py-2.5 font-medium text-foreground">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span>
                                      {item.variant?.product?.name ||
                                        `Biến thể #${item.variantId}`}
                                    </span>
                                    {variantAttrs && (
                                      <span className="text-[11px] text-muted-foreground font-normal shrink-0">
                                        ({variantAttrs})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                                  {item.variant?.sku || `ID: ${item.variantId}`}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                                  {formatCurrency(originalPrice)}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-rose-600 dark:text-rose-400">
                                  {group.discountType === "PERCENT"
                                    ? `-${discountValue}% (-${formatCurrency(discountAmount)})`
                                    : `-${formatCurrency(discountAmount)}`}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(finalPrice)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Xóa chương trình giảm giá"
        description={`Bạn có chắc chắn muốn xóa chương trình giảm giá "${discount.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa chương trình"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
