"use client";

import React, { useState } from "react";
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
  Edit,
  Trash2,
  Tag,
  Ticket,
  Zap,
  Percent,
  Search,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Promotion, PromotionKind } from "@/types/promotion";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminDataTable,
} from "@/components/admin";

export default function AdminPromotionsPage() {
  const [selectedKind, setSelectedKind] = useState<PromotionKind | "ALL">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryParams = {
    ...(selectedKind !== "ALL" ? { kind: selectedKind } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    page,
    limit,
  };

  const { data: response, isLoading } = useGetPromotions(queryParams);
  const deleteMutation = useDeletePromotion();

  const promotions: Promotion[] = response?.data || [];
  const meta = response?.meta || {
    total: promotions.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const totalCount = meta.total || 0;
  const activeCount = promotions.filter((p) => p.active).length;
  const voucherCount = promotions.filter((p) => p.kind === "VOUCHER").length;

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa chương trình "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () =>
          toast.success("Xóa chương trình khuyến mãi thành công"),
        onError: (err: any) =>
          toast.error(err.response?.data?.message || "Xóa thất bại"),
      });
    }
  };

  const getKindBadge = (kind: PromotionKind) => {
    switch (kind) {
      case "VOUCHER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/80">
            <Ticket className="w-3 h-3 text-purple-600" />
            <span>Voucher</span>
          </span>
        );
      case "ORDER_AUTO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/80">
            <Zap className="w-3 h-3 text-sky-600" />
            <span>Tự động đơn hàng</span>
          </span>
        );
      case "CAMPAIGN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Tag className="w-3 h-3 text-indigo-600" />
            <span>Campaign sản phẩm</span>
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
          <span className="text-slate-400 italic text-xs">
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
            ? `Giảm ${minF.toLocaleString("vi-VN")}₫`
            : `Giảm ${minF.toLocaleString("vi-VN")}₫ - ${maxF.toLocaleString("vi-VN")}₫`;
      } else {
        discountText = "Nhiều mức giảm";
      }

      return (
        <div className="flex flex-col">
          <span className="font-semibold text-rose-600 text-xs">
            {discountText}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {groups.length} nhóm · {totalVariants} SKU
          </span>
        </div>
      );
    }

    if (!p.discountType || !p.discountValue) return "-";
    if (p.discountType === "PERCENT") return `Giảm ${p.discountValue}% ${p.maxDiscountValue ? `(Max ${Number(p.maxDiscountValue).toLocaleString("vi-VN")}₫)` : ""}`;
    return `Giảm ${Number(p.discountValue).toLocaleString("vi-VN")}₫`;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Khuyến Mãi & Campaign"
        description="Quản lý chiến dịch ưu đãi, mã giảm giá voucher và chính sách chiết khấu tự động toàn sàn."
        actions={
          <Link href="/admin/promotions/create">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-xs text-xs font-semibold h-9 px-4">
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
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs Filter */}
        <Tabs
          value={selectedKind}
          onValueChange={(val) => {
            setSelectedKind(val as any);
            setPage(1);
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-slate-100 p-1 rounded-lg">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc mã code..."
            className="pl-9 h-9 text-xs bg-slate-50/70 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Promotions Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isEmpty={promotions.length === 0}
        emptyTitle="Chưa có chương trình khuyến mãi nào"
        emptyDescription="Tạo chiến dịch hoặc voucher đầu tiên để kích cầu mua sắm cho cửa hàng."
        emptyAction={
          <Link href="/admin/promotions/create">
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tạo chương trình ngay
            </Button>
          </Link>
        }
        pagination={{
          page: meta.page,
          limit: meta.limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: (newPage) => setPage(newPage),
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
      >
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-semibold text-slate-500 text-xs">
                Tên chương trình
              </TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">
                Phân loại
              </TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">
                Mã Voucher
              </TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">
                Mức giảm
              </TableHead>
              <TableHead className="text-center font-semibold text-slate-500 text-xs">
                Ưu tiên
              </TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">
                Thời gian áp dụng
              </TableHead>
              <TableHead className="text-center font-semibold text-slate-500 text-xs">
                Lượt dùng
              </TableHead>
              <TableHead className="text-center font-semibold text-slate-500 text-xs">
                Trạng thái
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-500 text-xs">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((p) => (
              <TableRow
                key={p.id}
                className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
              >
                <TableCell className="font-semibold text-slate-900 text-xs max-w-xs truncate">
                  {p.name}
                </TableCell>

                <TableCell>{getKindBadge(p.kind)}</TableCell>

                <TableCell className="font-mono text-xs">
                  {p.code ? (
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold border border-slate-200/80">
                      {p.code}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>

                <TableCell className="font-semibold text-xs text-rose-600">
                  {formatDiscount(p)}
                </TableCell>

                <TableCell className="text-center font-mono text-xs font-semibold text-slate-600">
                  {p.kind === "CAMPAIGN" ? (
                    <span className="text-indigo-600 font-bold">
                      {p.priority}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                  <div>
                    Từ: {new Date(p.startsAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {p.endsAt
                      ? `Đến: ${new Date(p.endsAt).toLocaleDateString("vi-VN")}`
                      : "Vô thời hạn"}
                  </div>
                </TableCell>

                <TableCell className="text-center text-xs font-mono">
                  {p.kind === "VOUCHER" ? (
                    <span>
                      <strong className="text-slate-900">{p.usedCount}</strong>
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
                        className="h-7 px-2.5 text-xs text-slate-700 hover:text-rose-600 hover:border-rose-200"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Chi tiết
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(p.id, p.name)}
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
    </div>
  );
}
