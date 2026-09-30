"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useGetAdminOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderDetailModal } from "@/components/admin/orders/OrderDetailModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  DollarSign,
  Clock,
  RotateCcw,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminDataTable,
  AdminPageSkeleton,
} from "@/components/admin";
import { useTableParams } from "@/hooks/useTableParams";
import { formatCurrency, formatDateTime } from "@/lib/format";

const ORDER_STATUSES = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

function AdminOrdersContent() {
  const {
    data: allOrders = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // URL-driven table parameters
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });
  const activeTab = params.status || "ALL";

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

  // Computed metrics
  const metrics = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter((o: any) => o.status === "COMPLETED")
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);
    const pendingOrders = allOrders.filter(
      (o: any) => o.status === "PENDING",
    ).length;

    return { totalOrders, totalRevenue, pendingOrders };
  }, [allOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      const matchesStatus = activeTab === "ALL" || order.status === activeTab;
      const q = params.q.toLowerCase();
      const matchesSearch =
        !q ||
        order.id.toString().includes(q) ||
        (order.user?.email || "").toLowerCase().includes(q) ||
        (
          [order.user?.firstName, order.user?.lastName]
            .filter(Boolean)
            .join(" ") || ""
        )
          .toLowerCase()
          .includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, activeTab, params.q]);

  // Pagination
  const total = filteredOrders.length;
  const limit = params.pageSize;
  const currentPage = params.page;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setParams({ status: undefined, q: undefined, page: 1 });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản Lý Đơn Hàng"
        description="Theo dõi luồng xử lý đơn hàng từ lúc đặt đến khi hoàn thành hoặc hủy bỏ."
      />

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        <AdminStatCard
          title="Tổng Đơn Hàng"
          value={metrics.totalOrders}
          subtitle="Tất cả đơn trong hệ thống"
          icon={ShoppingCart}
          color="slate"
        />

        <AdminStatCard
          title="Tổng Doanh Thu"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="Từ các đơn hoàn thành"
          icon={DollarSign}
          color="emerald"
        />

        <AdminStatCard
          title="Chờ Xử Lý"
          value={metrics.pendingOrders}
          subtitle="Đơn cần duyệt ngay"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Tabs Filter & Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setParams({ status: val === "ALL" ? undefined : val, page: 1 });
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-muted p-1 rounded-lg">
            {ORDER_STATUSES.map((status) => (
              <TabsTrigger
                key={status.value}
                value={status.value}
                className="text-xs px-3"
              >
                {status.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đơn, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-9 text-xs bg-background border-input"
          />
        </div>
      </div>

      {/* Orders Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        errorTitle="Không thể tải danh sách đơn hàng"
        onRetry={() => refetch()}
        isEmpty={paginatedOrders.length === 0}
        emptyTitle="Không tìm thấy đơn hàng nào"
        emptyDescription="Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
        emptyAction={
          activeTab !== "ALL" || params.q ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs border-border"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại bộ lọc
            </Button>
          ) : undefined
        }
        pagination={{
          page: currentPage,
          limit,
          total,
          totalPages,
          onPageChange: (p) => setParams({ page: p }),
          onLimitChange: (l) => setParams({ pageSize: l, page: 1 }),
        }}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-b border-border">
              <TableHead className="w-[110px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Mã Đơn
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Khách Hàng
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Ngày Đặt
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                Tổng Tiền
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">
                Trạng Thái
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">
                Thanh Toán
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider w-36">
                Thao Tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order: any) => {
              const accountName =
                [order.user?.firstName, order.user?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                order.user?.name ||
                "Khách vãng lai";
              const displayName = order.recipientName || accountName;
              const displayContact =
                order.recipientPhone || order.user?.email || "N/A";

              return (
                <TableRow
                  key={order.id}
                  className="hover:bg-muted/50 cursor-pointer border-b border-border transition-colors group"
                  onClick={() => handleViewOrder(order)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors tabular-nums">
                    #{order.id}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {displayContact}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(order.createdAt)}
                  </TableCell>

                  {/* Căn phải + tabular-nums */}
                  <TableCell className="font-semibold text-xs text-foreground font-mono text-right tabular-nums">
                    {formatCurrency(Number(order.total))}
                  </TableCell>

                  <TableCell className="text-center">
                    <AdminStatusBadge status={order.status} size="sm" />
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-medium text-foreground">
                        {order.paymentMethod === "COD" || !order.paymentMethod
                          ? "COD"
                          : order.paymentMethod}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : order.paymentStatus === "REFUNDED"
                              ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {order.paymentStatus === "PAID"
                          ? "Đã TT"
                          : order.paymentStatus === "REFUNDED"
                            ? "Hoàn tiền"
                            : "Chưa TT"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1.5">
                      {order.status === "PENDING" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={() =>
                              updateStatus.mutate({
                                id: order.id,
                                status: "CONFIRMED",
                              })
                            }
                          >
                            Xác nhận
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={() =>
                              updateStatus.mutate({
                                id: order.id,
                                status: "CANCELLED",
                              })
                            }
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                      {order.status === "CONFIRMED" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          onClick={() =>
                            updateStatus.mutate({
                              id: order.id,
                              status: "SHIPPING",
                            })
                          }
                        >
                          Giao hàng
                        </Button>
                      )}
                      {order.status === "SHIPPING" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-success hover:bg-success/90 text-white"
                          onClick={() =>
                            updateStatus.mutate({
                              id: order.id,
                              status: "COMPLETED",
                            })
                          }
                        >
                          Hoàn thành
                        </Button>
                      )}
                      {(order.status === "COMPLETED" ||
                        order.status === "CANCELLED") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleViewOrder(order)}
                        >
                          Xem chi tiết
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDataTable>

      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminOrdersContent />
    </Suspense>
  );
}
