"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDeletePromotion, useGetPromotions } from "@/hooks/usePromotions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Ticket, Zap } from "lucide-react";
import { toast } from "sonner";
import { PromotionKind } from "@/types/promotion";

export default function AdminPromotionsPage() {
  const [selectedKind, setSelectedKind] = useState<PromotionKind | "ALL">("ALL");

  const queryParams = selectedKind !== "ALL" ? { kind: selectedKind } : undefined;
  const { data: promotions, isLoading } = useGetPromotions(queryParams);
  const deleteMutation = useDeletePromotion();

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa chương trình "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Xóa chương trình khuyến mãi thành công"),
        onError: (err: any) =>
          toast.error(err.response?.data?.message || "Xóa thất bại"),
      });
    }
  };

  const getKindBadge = (kind: PromotionKind) => {
    switch (kind) {
      case "VOUCHER":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 flex items-center gap-1 w-fit">
            <Ticket className="w-3 h-3" /> Voucher
          </Badge>
        );
      case "ORDER_AUTO":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 w-fit">
            <Zap className="w-3 h-3" /> Khuyến mãi hóa đơn
          </Badge>
        );
      case "CAMPAIGN":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1 w-fit">
            <Tag className="w-3 h-3" /> Campaign sản phẩm
          </Badge>
        );
      default:
        return <Badge variant="outline">{kind}</Badge>;
    }
  };

  const formatDiscount = (p: any) => {
    if (p.kind === "CAMPAIGN") return <span className="text-muted-foreground italic">Nhiều nhóm</span>;
    if (!p.discountType || !p.discountValue) return "-";
    if (p.discountType === "PERCENT") return `${p.discountValue}%`;
    return `${Number(p.discountValue).toLocaleString()}đ`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý khuyến mãi & Campaign
          </h1>
          <p className="text-muted-foreground text-sm">
            Tạo và thiết lập voucher, ưu đãi tự động hóa đơn, hoặc chiến dịch giảm giá sản phẩm.
          </p>
        </div>
        <Link href="/admin/promotions/create">
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo chương trình mới
          </Button>
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setSelectedKind("ALL")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            selectedKind === "ALL"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Tất cả chương trình
        </button>
        <button
          onClick={() => setSelectedKind("VOUCHER")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            selectedKind === "VOUCHER"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Voucher (Mã giảm giá)
        </button>
        <button
          onClick={() => setSelectedKind("ORDER_AUTO")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            selectedKind === "ORDER_AUTO"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Khuyến mãi hóa đơn tự động
        </button>
        <button
          onClick={() => setSelectedKind("CAMPAIGN")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            selectedKind === "CAMPAIGN"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Campaign sản phẩm
        </button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Tên chương trình</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Mã Voucher</TableHead>
              <TableHead>Mức giảm</TableHead>
              <TableHead className="text-center">Ưu tiên</TableHead>
              <TableHead>Thời gian áp dụng</TableHead>
              <TableHead className="text-center">Lượt dùng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Đang tải danh sách khuyến mãi...
                </TableCell>
              </TableRow>
            ) : !promotions || promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Chưa có chương trình khuyến mãi nào.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                  <TableCell>{getKindBadge(p.kind)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {p.code ? (
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                        {p.code}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatDiscount(p)}</TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {p.kind === "CAMPAIGN" ? (
                      <span className="font-bold text-blue-600">{p.priority}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                    <div>
                      Từ: {new Date(p.startsAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div>
                      {p.endsAt
                        ? `Đến: ${new Date(p.endsAt).toLocaleDateString("vi-VN")}`
                        : "Không thời hạn"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {p.kind === "VOUCHER" ? (
                      <span>
                        <strong>{p.usedCount}</strong>
                        {p.maxUses ? ` / ${p.maxUses}` : ""}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.active ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500">Hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Tắt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/promotions/${p.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDelete(p.id, p.name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
