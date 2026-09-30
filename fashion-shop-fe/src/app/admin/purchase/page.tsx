"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  Search,
  FileDown,
  Truck,
  Package,
  CircleDollarSign,
  RotateCcw,
} from "lucide-react";
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
import { useGetPurchases, useGetPurchaseStats } from "@/hooks/usePurchases";
import { PurchaseReceipt } from "@/types/purchase";
import { Input } from "@/components/ui/input";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminDataTable,
  AdminStatusBadge,
  AdminPageSkeleton,
} from "@/components/admin";
import { useTableParams } from "@/hooks/useTableParams";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/format";

function PurchaseContent() {
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseReceipt | null>(null);

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

  // Fetch paginated purchases from backend
  const {
    data: purchasesData,
    isLoading,
    isError,
    refetch,
  } = useGetPurchases({
    page: params.page,
    limit: params.pageSize,
    search: params.q || undefined,
  });

  // Fetch warehouse purchase stats from backend
  const { data: statsData } = useGetPurchaseStats();

  const handleView = (purchase: PurchaseReceipt) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  const purchases = purchasesData?.data || [];
  const meta = purchasesData?.meta || {
    total: 0,
    page: params.page,
    limit: params.pageSize,
    totalPages: 1,
  };

  const totalPurchases = statsData?.totalPurchases ?? 0;
  const totalSpending = statsData?.totalSpending ?? 0;
  const totalQuantity = statsData?.totalQuantity ?? 0;

  const handleResetFilters = () => {
    setSearchInput("");
    setParams({ q: undefined, page: 1 });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản Lý Nhập Kho"
        description="Theo dõi lịch sử các đợt nhập hàng, đối tác cung ứng, giá vốn và lưu vết tồn kho theo từng phiếu nhập."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs border-border"
            >
              <FileDown className="w-4 h-4 text-muted-foreground" />
              <span>Xuất Excel</span>
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Phiếu Nhập</span>
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <AdminStatCard
          title="Tổng Phiếu Nhập"
          value={formatNumber(totalPurchases)}
          subtitle="Đợt nhập hàng đã tạo"
          icon={Truck}
          color="rose"
        />
        <AdminStatCard
          title="Tổng Vốn Nhập Kho"
          value={formatCurrency(totalSpending)}
          subtitle="Tổng giá trị hàng nhập kho"
          icon={CircleDollarSign}
          color="emerald"
        />
        <AdminStatCard
          title="Tổng Số Lượng Nhập"
          value={`${formatNumber(totalQuantity)} chiếc`}
          subtitle="Sản phẩm đã nhập vào kho"
          icon={Package}
          color="indigo"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã phiếu, nhà cung cấp..."
            className="pl-9 bg-background border-input text-xs h-9 w-full"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {params.q && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs border-border"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại
            </Button>
          )}
          <span className="text-xs text-muted-foreground font-medium">
            Tìm thấy{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {meta.total}
            </span>{" "}
            phiếu nhập
          </span>
        </div>
      </div>

      {/* Purchases Data Table with Server-side Pagination */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        errorTitle="Không thể tải danh sách phiếu nhập"
        onRetry={() => refetch()}
        isEmpty={purchases.length === 0}
        emptyTitle="Không tìm thấy phiếu nhập nào"
        emptyDescription="Thử tìm kiếm với từ khóa khác hoặc tạo phiếu nhập hàng mới."
        emptyAction={
          params.q ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Xóa tìm kiếm
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tạo phiếu nhập mới
            </Button>
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
              <TableHead className="w-[130px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Mã phiếu
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[130px]">
                Ngày nhập
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[150px]">
                Nhà cung cấp
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[200px]">
                Mặt hàng nhập
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Số lượng
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Tổng tiền
              </TableHead>
              <TableHead className="text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider w-24">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((p) => {
              const items = p.items || [];
              const receiptQty = items.reduce(
                (sum, it) => sum + it.quantity,
                0,
              );
              const firstItem = items[0];
              const firstItemName =
                firstItem?.variant?.product?.name || "Mặt hàng";
              const extraItemsCount = items.length - 1;

              return (
                <TableRow
                  key={p.id}
                  className="hover:bg-muted/50 border-b border-border transition-colors group"
                >
                  <TableCell className="font-mono text-xs font-semibold text-foreground tabular-nums">
                    {p.code}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(p.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {p.supplier || "Fashion Shop Official"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-xs text-foreground line-clamp-1 max-w-[180px]">
                        {firstItemName}
                      </span>
                      {extraItemsCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground tabular-nums">
                          +{extraItemsCount} SP
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {/* Số lượng căn phải */}
                  <TableCell className="text-right tabular-nums">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-semibold tabular-nums">
                      {formatNumber(receiptQty)} chiếc
                    </span>
                  </TableCell>
                  {/* Tổng tiền căn phải */}
                  <TableCell className="text-right font-semibold text-xs text-foreground tabular-nums">
                    {formatCurrency(Number(p.totalAmount || 0))}
                  </TableCell>
                  <TableCell className="text-center">
                    <AdminStatusBadge
                      status={p.status || "COMPLETED"}
                      customLabel="Đã nhập kho"
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(p)}
                      className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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

export default function PurchasePage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <PurchaseContent />
    </Suspense>
  );
}
