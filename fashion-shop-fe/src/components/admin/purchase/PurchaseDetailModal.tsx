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

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
}

export function PurchaseDetailModal({
  isOpen,
  onClose,
  purchase,
}: PurchaseDetailModalProps) {
  if (!purchase) return null;

  // Phiếu nhập (Batch) trong DB hiện tại chỉ map với 1 variant (1 sản phẩm)
  const items = [
    {
      title: purchase.variant?.book?.title || "Sản phẩm không xác định",
      quantity: purchase.quantity || 0,
      // Vì DB không lưu giá nhập (cost), hiển thị 0 hoặc giá trị tượng trưng nếu muốn, ở đây để 0 đ
      price: 0, 
    }
  ];

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết phiếu nhập {purchase.code}</DialogTitle>
          <DialogDescription>
            Thông tin nhà cung cấp và các sản phẩm đã nhập kho.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-4 bg-gray-50 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Mã phiếu:</p>
              <p className="font-medium text-gray-800">{purchase.code}</p>
            </div>
            <div>
              <p className="text-gray-500">Ngày nhập:</p>
              <p className="font-medium text-gray-800">
                {purchase.createdAt
                  ? new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(purchase.createdAt))
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Nhà cung cấp:</p>
              <p className="font-medium text-gray-800">
                {purchase.variant?.book?.provider || "Chưa xác định"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Người tạo:</p>
              <p className="font-medium text-gray-800">Admin</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Danh sách sản phẩm
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Tên sản phẩm</th>
                  <th className="px-4 py-3 text-center">Số lượng</th>
                  <th className="px-4 py-3 text-right">Giá nhập</th>
                  <th className="px-4 py-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {item.price.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold text-gray-800 border-t-2">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right">
                    Tổng cộng
                  </td>
                  <td className="px-4 py-3 text-right text-lg text-blue-600">
                    {total.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2 italic text-right">
            * Giá nhập chưa được lưu trong cơ sở dữ liệu ở phiên bản này.
          </p>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
