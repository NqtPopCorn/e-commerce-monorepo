"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Search, FileDown, Truck, Package, Calendar } from "lucide-react";
import { CreatePurchaseModal } from "@/components/admin/purchase/CreatePurchaseModal";
import { PurchaseDetailModal } from "@/components/admin/purchase/PurchaseDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetBatches } from "@/hooks/useBatches";
import { Input } from "@/components/ui/input";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminDataTable,
  AdminStatusBadge,
} from "@/components/admin";

export default function PurchasePage() {
  const { data: batches, isLoading } = useGetBatches();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleView = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  const filteredBatches = (batches || []).filter((b: any) =>
    b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.variant?.product?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    (b.variant?.sku || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculation
  const total = filteredBatches.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedBatches = filteredBatches.slice((page - 1) * limit, page * limit);

  // Stats calculation
  const totalQuantity = (batches || []).reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);
  const totalBatches = batches?.length || 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản Lý Nhập Kho"
        description="Theo dõi lịch sử nhập hàng theo lô, quản lý nguồn cung và lưu vết tồn kho theo từng đợt nhập."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              <span>Xuất Excel</span>
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Phiếu Nhập</span>
            </Button>
          </>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <AdminStatCard
          title="Tổng Phiếu Nhập"
          value={totalBatches}
          subtitle="Lô hàng đã tạo"
          icon={Truck}
          color="rose"
        />
        <AdminStatCard
          title="Tổng Số Lượng Nhập"
          value={`${totalQuantity.toLocaleString("vi-VN")} chiếc`}
          subtitle="Sản phẩm đã nhập vào kho"
          icon={Package}
          color="indigo"
        />
        <AdminStatCard
          title="Đợt Nhập Gần Nhất"
          value={batches && batches.length > 0 ? new Date(batches[0].createdAt).toLocaleDateString("vi-VN") : "--"}
          subtitle="Thời điểm nhập kho mới nhất"
          icon={Calendar}
          color="emerald"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm theo mã phiếu, tên sản phẩm hoặc SKU..."
            className="pl-9 bg-slate-50/70 border-slate-200 focus:bg-white text-xs h-9 w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tìm thấy <span className="font-semibold text-slate-900">{total}</span> phiếu nhập
        </div>
      </div>

      {/* Batches Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isEmpty={paginatedBatches.length === 0}
        emptyTitle="Không tìm thấy phiếu nhập nào"
        emptyDescription="Thử tìm kiếm với từ khóa khác hoặc tạo phiếu nhập hàng mới."
        emptyAction={
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tạo phiếu nhập mới
          </Button>
        }
        pagination={{
          page,
          limit,
          total,
          totalPages,
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
              <TableHead className="w-[130px] font-semibold text-slate-500 text-xs">Mã phiếu</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs min-w-[140px]">Ngày nhập</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs min-w-[220px]">Sản phẩm</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Người tạo</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 text-xs">Số lượng</TableHead>
              <TableHead className="text-center font-semibold text-slate-500 text-xs">Trạng thái</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBatches.map((p: any) => (
              <TableRow
                key={p.id}
                className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors group"
              >
                <TableCell className="font-mono text-xs font-semibold text-slate-900">
                  {p.code}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {new Intl.DateTimeFormat("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(p.createdAt))}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-xs text-slate-900 line-clamp-1">
                    {p.variant?.product?.name || "Sản phẩm không xác định"}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    SKU: {p.variant?.sku || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                      A
                    </div>
                    <span className="text-xs text-slate-700">Admin</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                    {p.quantity} chiếc
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <AdminStatusBadge status="COMPLETED" customLabel="Đã nhập kho" size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(p)}
                    className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDataTable>

      <CreatePurchaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <PurchaseDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
}
