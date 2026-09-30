"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useDeletePromotion, useGetPromotions } from "@/hooks/usePromotions";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Tag,
  Ticket,
  Zap,
  Percent,
  Search,
  CheckCircle2,
  Eye,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Promotion, PromotionKind } from "@/types/promotion";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminDataTable,
  AdminConfirmDialog,
  AdminPageSkeleton,
} from "@/components/admin";
import { useTableParams } from "@/hooks/useTableParams";
import { formatCurrency, formatDate } from "@/lib/format";

function AdminPromotionsContent() {
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });
  const selectedKind = (params.status || "ALL") as PromotionKind | "ALL";

  // Debounced search
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
    isLoading: boolean;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    description: null,
    isLoading: false,
  });

  const queryParams = {
    ...(selectedKind !== "ALL" ? { kind: selectedKind } : {}),
    ...(params.q ? { search: params.q } : {}),
    page: params.page,
    limit: params.pageSize,
  };

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetPromotions(queryParams);
  const deleteMutation = useDeletePromotion();

  const promotions: Promotion[] = response?.data || [];
  const meta = response?.meta || {
    total: promotions.length,
    page: params.page,
    limit: params.pageSize,
    totalPages: 1,
  };

  const totalCount = meta.total || 0;
  const activeCount = promotions.filter((p) => p.active).length;
  const voucherCount = promotions.filter((p) => p.kind === "VOUCHER").length;

  const handleDelete = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa chương trình",
      description: (
        <div className="space-y-2">
          <p>
            Bạn có chắc chắn muốn xóa chương trình khuyến mãi{" "}
            <strong className="text-foreground">{name}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">
            Hành động này sẽ vô hiệu hóa tất cả các mã hoặc chiết khấu liên
            quan. Thao tác này không thể hoàn tác.
          </p>
        </div>
      ),
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteMutation.mutateAsync(id);
          toast.success(`Đã xóa chương trình "${name}"`);
          setConfirmDialog((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              "Không thể xóa chương trình. Thử lại sau.",
          );
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const getKindBadge = (kind: PromotionKind) => {
    switch (kind) {
      case "VOUCHER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Ticket className="w-3 h-3" />
            <span>Voucher</span>
          </span>
        );
      case "ORDER_AUTO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info border border-info/20">
            <Zap className="w-3 h-3" />
            <span>Tự động đơn hàng</span>
          </span>
        );
      case "CAMPAIGN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
            <Tag className="w-3 h-3" />
            <span>Campaign SP</span>
          </span>
        );
      default:
        return <span>{kind}</span>;
    }
  };

  const formatDiscount = (p: Promotion) => {
    if (p.kind === "CAMPAIGN") {
      const groups = p.groups || [];
      const totalVariants = groups.reduce(
        (sum, g) => sum + (g.variants?.length || 0),
        0,
      );

      if (groups.length === 0) {
        return (
          <span className="text-muted-foreground italic text-xs">
            Chưa có nhóm SKU
          </span>
        );
      }

      const percentDiscounts = groups
        .filter((g) => g.discountType === "PERCENT")
        .map((g) => Number(g.discountValue));
      const fixedDiscounts = groups
        .filter((g) => g.discountType === "FIXED")
        .map((g) => Number(g.discountValue));

      let discountText = "";
      if (percentDiscounts.length > 0 && fixedDiscounts.length === 0) {
        const minP = Math.min(...percentDiscounts);
        const maxP = Math.max(...percentDiscounts);
        discountText =
          minP === maxP ? `Giảm ${minP}%` : `Giảm ${minP}% - ${maxP}%`;
      } else if (fixedDiscounts.length > 0 && percentDiscounts.length === 0) {
        const minF = Math.min(...fixedDiscounts);
        const maxF = Math.max(...fixedDiscounts);
        discountText =
          minF === maxF
            ? `Giảm ${formatCurrency(minF)}`
            : `Giảm ${formatCurrency(minF)} - ${formatCurrency(maxF)}`;
      } else {
        discountText = "Nhiều mức giảm";
      }

      return (
        <div className="flex flex-col">
          <span className="font-semibold text-primary text-xs">
            {discountText}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {groups.length} nhóm · {totalVariants} SKU
          </span>
        </div>
      );
    }

    if (!p.discountType || !p.discountValue) return "-";
    if (p.discountType === "PERCENT") {
      return `Giảm ${p.discountValue}% ${p.maxDiscountValue ? `(Tối đa ${formatCurrency(Number(p.maxDiscountValue))})` : ""}`;
    }
    return `Giảm ${formatCurrency(Number(p.discountValue))}`;
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setParams({ status: undefined, q: undefined, page: 1 });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Khuyến Mãi & Campaign"
        description="Quản lý chiến dịch ưu đãi, mã giảm giá voucher và chính sách chiết khấu tự động toàn sàn."
        actions={
          <Link href="/admin/promotions/create">
            <Button className="flex items-center gap-2 shadow-xs text-xs font-semibold h-9 px-4">
              <Plus className="w-4 h-4" />
              <span>Tạo chương trình mới</span>
            </Button>
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <AdminStatCard
          title="Tổng Chương Trình"
          value={totalCount}
          subtitle="Tất cả khuyến mãi"
          icon={Percent}
          color="rose"
        />
        <AdminStatCard
          title="Đang Hiệu Lực"
          value={activeCount}
          subtitle="Đang áp dụng trong hệ thống"
          icon={CheckCircle2}
          color="emerald"
        />
        <AdminStatCard
          title="Mã Voucher"
          value={voucherCount}
          subtitle="Yêu cầu nhập code khi mua"
          icon={Ticket}
          color="indigo"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs Filter */}
        <Tabs
          value={selectedKind}
          onValueChange={(val) => {
            setParams({ status: val === "ALL" ? undefined : val, page: 1 });
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="ALL" className="text-xs">
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="VOUCHER" className="text-xs">
              Voucher
            </TabsTrigger>
            <TabsTrigger value="ORDER_AUTO" className="text-xs">
              Đơn hàng
            </TabsTrigger>
            <TabsTrigger value="CAMPAIGN" className="text-xs">
              Campaign SP
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên hoặc mã code..."
            className="pl-9 h-9 text-xs bg-background border-input"
          />
        </div>
      </div>

      {/* Promotions Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        errorTitle="Không thể tải danh sách khuyến mãi"
        onRetry={() => refetch()}
        isEmpty={promotions.length === 0}
        emptyTitle="Chưa có chương trình khuyến mãi nào"
        emptyDescription="Tạo chiến dịch hoặc voucher đầu tiên để kích cầu mua sắm cho cửa hàng."
        emptyAction={
          selectedKind !== "ALL" || params.q ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại bộ lọc
            </Button>
          ) : (
            <Link href="/admin/promotions/create">
              <Button size="sm" className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tạo chương trình ngay
              </Button>
            </Link>
          )
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
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Tên chương trình
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Phân loại
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Mã Voucher
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                Mức giảm
              </TableHead>
              <TableHead className="text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Ưu tiên
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Thời gian áp dụng
              </TableHead>
              <TableHead className="text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Lượt dùng
              </TableHead>
              <TableHead className="text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider w-32">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((p) => (
              <TableRow
                key={p.id}
                className="hover:bg-muted/50 border-b border-border transition-colors"
              >
                <TableCell className="font-medium text-foreground text-xs max-w-xs truncate">
                  {p.name}
                </TableCell>

                <TableCell>{getKindBadge(p.kind)}</TableCell>

                <TableCell className="font-mono text-xs">
                  {p.code ? (
                    <span className="bg-muted text-foreground px-2 py-0.5 rounded font-bold border border-border">
                      {p.code}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Mức giảm căn phải */}
                <TableCell className="font-semibold text-xs text-primary text-right tabular-nums">
                  {formatDiscount(p)}
                </TableCell>

                <TableCell className="text-center font-mono text-xs font-semibold text-muted-foreground">
                  {p.kind === "CAMPAIGN" ? (
                    <span className="text-foreground font-bold">
                      {p.priority}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div>Từ: {formatDate(p.startsAt)}</div>
                  <div className="text-[11px] text-muted-foreground/70">
                    {p.endsAt ? `Đến: ${formatDate(p.endsAt)}` : "Vô thời hạn"}
                  </div>
                </TableCell>

                <TableCell className="text-center text-xs font-mono tabular-nums">
                  {p.kind === "VOUCHER" ? (
                    <span>
                      <strong className="text-foreground">{p.usedCount}</strong>
                      {p.maxUses ? ` / ${p.maxUses}` : ""}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="text-center">
                  <AdminStatusBadge
                    status={p.active ? "ACTIVE" : "INACTIVE"}
                    customLabel={p.active ? "Đang chạy" : "Tạm dừng"}
                    size="sm"
                  />
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/admin/promotions/${p.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs border-border text-foreground hover:bg-muted"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Chi tiết
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(p.id, p.name)}
                      aria-label={`Xóa chương trình ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDataTable>

      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="danger"
        confirmText="Xóa chương trình"
        cancelText="Hủy"
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

export default function AdminPromotionsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminPromotionsContent />
    </Suspense>
  );
}
