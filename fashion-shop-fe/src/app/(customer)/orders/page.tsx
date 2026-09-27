"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { useGetMyOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  XCircle,
  CheckCircle,
  Tag,
} from "lucide-react";

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { data, isLoading, error } = useGetMyOrders();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const orders = Array.isArray(data) ? data : [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-200",
          icon: Clock,
        };
      case "CONFIRMED":
      case "SHIPPING":
        return {
          label: status === "CONFIRMED" ? "Đã xác nhận" : "Đang giao hàng",
          color: "text-blue-600",
          bg: "bg-blue-50 border-blue-200",
          icon: Package,
        };
      case "COMPLETED":
        return {
          label: "Hoàn tất",
          color: "text-emerald-600",
          bg: "bg-emerald-50 border-emerald-200",
          icon: CheckCircle,
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "text-rose-600",
          bg: "bg-rose-50 border-rose-200",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          color: "text-gray-600",
          bg: "bg-gray-50 border-gray-200",
          icon: Package,
        };
    }
  };

  if (!hasHydrated) {
    return <div className="py-20 text-center text-gray-500">Đang tải phiên đăng nhập...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img
          src="https://cdn0.fahasa.com/skin/frontend/ma_vanese/fahasa/images/login.png"
          alt="Login"
          className="w-32 mb-6 opacity-50"
        />
        <p className="text-gray-500 mb-6 text-lg">
          Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.
        </p>
        <Link href="/login">
          <Button className="bg-[#c92127] hover:bg-red-700 text-white px-8 h-12 text-lg font-bold">
            ĐĂNG NHẬP
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 uppercase border-b pb-4">
        Đơn hàng của tôi
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c92127]"></div>
        </div>
      ) : error ? (
        <p className="text-center py-10 text-red-500">
          Đã xảy ra lỗi khi tải danh sách đơn hàng.
        </p>
      ) : orders.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm flex flex-col items-center justify-center border border-gray-100">
          <Package className="w-20 h-20 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-6 text-lg">
            Bạn chưa có đơn hàng nào.
          </p>
          <Link href="/">
            <Button className="bg-[#c92127] hover:bg-red-700 text-white px-8 h-12 text-lg font-bold">
              MUA SẮM NGAY
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Summary Header */}
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Mã đơn hàng
                      </p>
                      <p className="font-bold text-gray-800">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Ngày đặt
                      </p>
                      <p className="text-gray-800 font-medium">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Tổng tiền
                      </p>
                      <p className="font-bold text-[#c92127]">
                        {Number(order.total).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} ${statusConfig.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Order Details Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-slate-50/50 space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-sm">
                        Sản phẩm đã mua
                      </h4>
                      <div className="space-y-3">
                        {order.items?.map((item: any) => {
                          const origPrice = Number(item.originalUnitPrice || item.unitPrice || 0);
                          const prodDisc = Number(item.productDiscount || 0);
                          const finalPrice = Number(item.finalUnitPrice || item.unitPrice || 0);
                          const itemTotal = (finalPrice > 0 ? finalPrice : origPrice) * item.quantity;
                          const productTitle = item.variant?.product?.name || item.variant?.book?.title || "Sản phẩm";
                          const variantInfo = [item.variant?.size, item.variant?.color].filter(Boolean).join(" - ");

                          return (
                            <div
                              key={item.id}
                              className="flex gap-4 items-center bg-white p-3 rounded border border-gray-200 text-sm"
                            >
                              <div className="w-14 h-18 bg-gray-100 rounded border flex shrink-0 items-center justify-center overflow-hidden">
                                {item.variant?.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.variant.imageUrl}
                                    alt={productTitle}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] text-gray-400">No Image</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 line-clamp-2">
                                  {productTitle}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  SKU: {item.variant?.sku} {variantInfo ? `| ${variantInfo} ` : ""}| Số lượng: {item.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                {prodDisc > 0 && (
                                  <div className="text-xs text-gray-400 line-through">
                                    {(origPrice * item.quantity).toLocaleString("vi-VN")} đ
                                  </div>
                                )}
                                <div className="font-bold text-[#c92127]">
                                  {itemTotal.toLocaleString("vi-VN")} đ
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Applied Promotions Snapshot */}
                    {order.promotionApplications && order.promotionApplications.length > 0 && (
                      <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-lg space-y-2">
                        <h5 className="font-semibold text-emerald-900 text-xs flex items-center gap-1.5 uppercase">
                          <Tag className="w-3.5 h-3.5" /> Ưu đãi đã áp dụng
                        </h5>
                        <div className="space-y-1.5 text-xs text-emerald-800">
                          {order.promotionApplications.map((app: any) => (
                            <div key={app.id} className="flex justify-between items-center">
                              <span>
                                • <strong>{app.promotionName}</strong>
                                {app.promotionCode ? ` (${app.promotionCode})` : ""} [{app.scope}]
                              </span>
                              <span className="font-bold">
                                -{Number(app.discountAmount).toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="bg-white p-4 rounded-lg border space-y-2 text-sm text-slate-700 max-w-md ml-auto">
                      <div className="flex justify-between">
                        <span>Tạm tính gốc:</span>
                        <span>{Number(order.subtotal || order.total).toLocaleString("vi-VN")} đ</span>
                      </div>
                      {Number(order.productDiscount) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Giảm giá sản phẩm:</span>
                          <span>-{Number(order.productDiscount).toLocaleString("vi-VN")} đ</span>
                        </div>
                      )}
                      {Number(order.orderDiscount) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Khuyến mãi hóa đơn:</span>
                          <span>-{Number(order.orderDiscount).toLocaleString("vi-VN")} đ</span>
                        </div>
                      )}
                      {Number(order.voucherDiscount) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Voucher giảm giá:</span>
                          <span>-{Number(order.voucherDiscount).toLocaleString("vi-VN")} đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-2 text-base text-slate-900">
                        <span>Tổng thanh toán:</span>
                        <span className="text-[#c92127]">
                          {Number(order.total).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
