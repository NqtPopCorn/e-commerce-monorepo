"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { useCreateBatch } from "@/hooks/useBatches";
import { useGetBooks } from "@/hooks/useBooks";

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePurchaseModal({
  isOpen,
  onClose,
}: CreatePurchaseModalProps) {
  const [items, setItems] = useState([{ bookId: "", quantity: 1, price: 0 }]);
  const createBatch = useCreateBatch();
  const { data: books } = useGetBooks();

  const handleAddItem = () => {
    setItems([...items, { bookId: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = "PN" + Date.now();
    try {
      await Promise.all(
        items.map((item) =>
          createBatch.mutateAsync({
            code: code,
            bookId: Number(item.bookId),
            quantity: Number(item.quantity),
          }),
        ),
      );
      toast.success("Tạo phiếu nhập thành công");
      onClose();
    } catch (e) {
      toast.error("Có lỗi xảy ra khi nhập kho");
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Phiếu Nhập Mới</DialogTitle>
          <DialogDescription>
            Điền thông tin các sách cần nhập kho và giá nhập.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Nhà cung cấp</Label>
              <Input
                id="provider"
                placeholder="Nhập tên nhà cung cấp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Ngày nhập</Label>
              <Input
                id="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Chi tiết sản phẩm</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm dòng
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white p-3 rounded-md border"
                >
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 mb-1">
                      Tên sách
                    </Label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none"
                      value={item.bookId}
                      onChange={(e) =>
                        handleChange(index, "bookId", e.target.value)
                      }
                      required
                    >
                      <option value="">Chọn sách...</option>
                      {books?.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs text-gray-500 mb-1">
                      Số lượng
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(
                          index,
                          "quantity",
                          parseInt(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs text-gray-500 mb-1">
                      Giá nhập
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) =>
                        handleChange(index, "price", parseInt(e.target.value))
                      }
                      required
                    />
                  </div>
                  <div className="w-32 text-right">
                    <Label className="text-xs text-gray-500 mb-1">
                      Thành tiền
                    </Label>
                    <div className="font-medium mt-2 text-sm">
                      {(item.quantity * item.price).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div className="w-10 flex justify-end mt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500">Tổng cộng</p>
                <p className="text-xl font-bold text-blue-600">
                  {totalAmount.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={createBatch.isPending}>
              {createBatch.isPending ? "Đang tạo..." : "Lưu Phiếu Nhập"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
