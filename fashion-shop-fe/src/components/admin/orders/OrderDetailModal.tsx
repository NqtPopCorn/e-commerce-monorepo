"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tag, Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
  SHIPPING: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Truck },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", color: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle },
};

export function OrderDetailModal({
  isOpen,
  onClose,
  order,
}: OrderDetailModalProps) {
  if (!order) return null;

  const items = order.items || [];
  
  const statusInfo = STATUS_MAP[order.status] || {
    label: order.status,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Package
  };
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Chi tiết đơn hàng <span className="text-primary font-bold">#{order.id}</span>
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về khách hàng, sản phẩm và khấu trừ khuyến mãi audit-ready.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-2">
              Thông tin khách hàng
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex justify-between">
                <span className="font-medium text-slate-800">Email:</span>
                <span>{order.user?.email || "Khách vãng lai"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-slate-800">Họ tên:</span>
                <span>
                  {order.user?.firstName && order.user?.lastName
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : order.user?.firstName || order.user?.lastName || "N/A"}
                </span>
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-2">
              Thông tin đơn hàng
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex justify-between items-center">
                <span className="font-medium text-slate-800">Mã đơn:</span>
                <span className="font-medium">#{order.id}</span>
              </p>
              <p className="flex justify-between items-center">
                <span className="font-medium text-slate-800">Ngày đặt:</span>
                <span>{new Date(order.createdAt).toLocaleString("vi-VN", {
                  hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                })}</span>
              </p>
              <div className="flex justify-between items-center pt-1">
                <span className="font-medium text-slate-800">Trạng thái:</span>
                <Badge variant="outline" className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border ${statusInfo.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-slate-800">
            Danh sách sản phẩm (Snapshot giá)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100/80 text-slate-700 font-medium">
                <tr>
                  <th className="px-4 py-3">Sản phẩm / SKU</th>
                  <th className="px-4 py-3 text-center">Số lượng</th>
                  <th className="px-4 py-3 text-right">Giá gốc</th>
                  <th className="px-4 py-3 text-right">Giảm SP</th>
                  <th className="px-4 py-3 text-right">Đơn giá cuối</th>
                  <th className="px-4 py-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any, idx: number) => {
                  const origPrice = Number(item.originalUnitPrice || item.unitPrice || 0);
                  const prodDisc = Number(item.productDiscount || 0);
                  const finalPrice = Number(item.finalUnitPrice || item.unitPrice || 0);
                  const totalLine = (finalPrice > 0 ? finalPrice : origPrice) * item.quantity;
                  const title = item.variant?.book?.title || item.title || "Sản phẩm";
                  const sku = item.variant?.sku || "";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div>{title}</div>
                        {sku && <div className="text-xs text-slate-500 font-mono mt-1">SKU: {sku}</div>}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {origPrice.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {prodDisc > 0 ? `-${prodDisc.toLocaleString("vi-VN")} đ` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {finalPrice.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {totalLine.toLocaleString("vi-VN")} đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Promotion Applications Snapshot */}
          {order.promotionApplications && order.promotionApplications.length > 0 && (
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2 shadow-sm">
              <h4 className="font-semibold text-emerald-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" /> Lịch sử áp dụng khuyến mãi (Audit Log)
              </h4>
              <div className="space-y-1.5 text-xs text-emerald-800">
                {order.promotionApplications.map((app: any) => (
                  <div key={app.id} className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-md">
                    <span>
                      • <strong className="font-semibold">{app.promotionName}</strong>
                      {app.promotionCode ? ` (${app.promotionCode})` : ""} <span className="opacity-75">[{app.scope}]</span>
                    </span>
                    <span className="font-bold text-emerald-700">
                      -{Number(app.discountAmount).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary Snapshot */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-sm text-slate-700 max-w-sm ml-auto shadow-sm">
            <div className="flex justify-between items-center">
              <span>Tạm tính gốc:</span>
              <span className="font-medium">{Number(order.subtotal || order.total).toLocaleString("vi-VN")} đ</span>
            </div>
            {Number(order.productDiscount) > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span>Ưu đãi sản phẩm:</span>
                <span className="font-medium">-{Number(order.productDiscount).toLocaleString("vi-VN")} đ</span>
              </div>
            )}
            {Number(order.orderDiscount) > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span>Khuyến mãi hóa đơn:</span>
                <span className="font-medium">-{Number(order.orderDiscount).toLocaleString("vi-VN")} đ</span>
              </div>
            )}
            {Number(order.voucherDiscount) > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span>Voucher giảm giá:</span>
                <span className="font-medium">-{Number(order.voucherDiscount).toLocaleString("vi-VN")} đ</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold border-t border-slate-200 pt-3 text-base text-slate-900 mt-2">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-primary text-lg">
                {Number(order.total).toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
