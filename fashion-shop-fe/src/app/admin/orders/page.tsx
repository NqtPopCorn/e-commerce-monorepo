"use client";

import { toast } from "sonner";
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
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ORDER_STATUSES = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
  SHIPPING: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Truck },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", color: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

export default function AdminOrdersPage() {
  const { data: allOrders = [], isLoading } = useGetAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for filtering and pagination
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
        (order.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, activeTab, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi, cập nhật trạng thái và quản lý tất cả đơn hàng.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tổng Đơn Hàng</CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Đơn hàng trong hệ thống</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tổng Doanh Thu</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-full">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metrics.totalRevenue.toLocaleString("vi-VN")} đ
            </div>
            <p className="text-xs text-muted-foreground mt-1">Từ các đơn hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Chờ Xử Lý</CardTitle>
            <div className="p-2 bg-amber-50 rounded-full">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Đơn hàng cần xác nhận ngay</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Tabs defaultValue="ALL" value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          setCurrentPage(1); // Reset page on tab change
        }}>
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-slate-100/80 p-1">
              {ORDER_STATUSES.map((status) => (
                <TabsTrigger
                  key={status.value}
                  value={status.value}
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4"
                >
                  {status.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã đơn, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="m-0 border-0 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] font-semibold text-slate-700">Mã Đơn</TableHead>
                    <TableHead className="font-semibold text-slate-700">Khách Hàng</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ngày Đặt</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tổng Tiền</TableHead>
                    <TableHead className="font-semibold text-slate-700">Trạng Thái</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="h-8 w-8 text-slate-300" />
                          <p>Không tìm thấy đơn hàng nào phù hợp.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order: any) => {
                      const statusInfo = STATUS_MAP[order.status] || {
                        label: order.status,
                        color: "bg-slate-100 text-slate-800 border-slate-200",
                        icon: Package
                      };
                      const StatusIcon = statusInfo.icon;

                      return (
                        <TableRow
                          key={order.id}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                          onClick={() => handleViewOrder(order)}
                        >
                          <TableCell className="font-medium">
                            <span className="text-primary group-hover:underline">#{order.id}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900">{order.user?.email || "Khách vãng lai"}</span>
                              <span className="text-xs text-muted-foreground">{order.user?.name || ""}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {new Date(order.createdAt).toLocaleString("vi-VN", {
                              hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            {Number(order.total).toLocaleString("vi-VN")} đ
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2.5 py-1 text-xs border ${statusInfo.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-end gap-2">
                              {order.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                    onClick={() => updateStatus.mutate({ id: order.id, status: "CONFIRMED" })}
                                  >
                                    Xác nhận
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => updateStatus.mutate({ id: order.id, status: "CANCELLED" })}
                                  >
                                    Hủy
                                  </Button>
                                </>
                              )}
                              {order.status === "CONFIRMED" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 bg-indigo-600 hover:bg-indigo-700"
                                  onClick={() => updateStatus.mutate({ id: order.id, status: "SHIPPING" })}
                                >
                                  Giao hàng
                                </Button>
                              )}
                              {order.status === "SHIPPING" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => updateStatus.mutate({ id: order.id, status: "COMPLETED" })}
                                >
                                  Hoàn thành
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <div className="text-sm text-muted-foreground">
                  Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> trong <span className="font-medium text-slate-900">{filteredOrders.length}</span> đơn hàng
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium w-12 text-center">
                    {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
