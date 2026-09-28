"use client";

import React, { useState, useMemo } from "react";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

const ORDER_STATUSES = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export default function AdminOrdersPage() {
  const { data: allOrders = [], isLoading } = useGetAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for filtering and pagination
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Computed metrics
  const metrics = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter((o: any) => o.status === "COMPLETED")
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);
    const pendingOrders = allOrders.filter((o: any) => o.status === "PENDING").length;

    return { totalOrders, totalRevenue, pendingOrders };
  }, [allOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      const matchesStatus = activeTab === "ALL" || order.status === activeTab;
      const matchesSearch =
        order.id.toString().includes(searchQuery) ||
        (order.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        ([order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, activeTab, searchQuery]);

  // Pagination
  const total = filteredOrders.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setActiveTab("ALL");
    setSearchQuery("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

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
          value={`${metrics.totalRevenue.toLocaleString("vi-VN")}₫`}
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
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setCurrentPage(1);
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-slate-100 p-1 rounded-lg">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo mã đơn, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs bg-slate-50/70 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Data Table */}
      <AdminDataTable
        isEmpty={paginatedOrders.length === 0}
        emptyTitle="Không tìm thấy đơn hàng nào"
        emptyDescription="Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
        emptyAction={
          (activeTab !== "ALL" || searchQuery) ? (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
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
          onPageChange: (p) => setCurrentPage(p),
          onLimitChange: (l) => {
            setLimit(l);
            setCurrentPage(1);
          },
        }}
      >
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="w-[110px] font-semibold text-slate-500 text-xs">Mã Đơn</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Khách Hàng</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Ngày Đặt</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Tổng Tiền</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Trạng Thái</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 text-xs">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order: any) => {
              const customerName =
                [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
                order.user?.name ||
                "Khách vãng lai";

              return (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50/70 cursor-pointer border-b border-slate-100 transition-colors group"
                  onClick={() => handleViewOrder(order)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                    #{order.id}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900">
                        {customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {order.user?.email || "N/A"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600">
                    {new Date(order.createdAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell className="font-semibold text-xs text-slate-900 font-mono">
                    {Number(order.total).toLocaleString("vi-VN")}₫
                  </TableCell>

                  <TableCell>
                    <AdminStatusBadge status={order.status} size="sm" />
                  </TableCell>

                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1.5">
                      {order.status === "PENDING" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() =>
                              updateStatus.mutate({ id: order.id, status: "CONFIRMED" })
                            }
                          >
                            Xác nhận
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={() =>
                              updateStatus.mutate({ id: order.id, status: "CANCELLED" })
                            }
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                      {order.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() =>
                            updateStatus.mutate({ id: order.id, status: "SHIPPING" })
                          }
                        >
                          Giao hàng
                        </Button>
                      )}
                      {order.status === "SHIPPING" && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() =>
                            updateStatus.mutate({ id: order.id, status: "COMPLETED" })
                          }
                        >
                          Hoàn thành
                        </Button>
                      )}
                      {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900"
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
