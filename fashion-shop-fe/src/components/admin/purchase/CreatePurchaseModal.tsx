"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { useCreateBatch } from "@/hooks/useBatches";
import { useGetProducts } from "@/hooks/useProducts";

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePurchaseModal({
  isOpen,
  onClose,
}: CreatePurchaseModalProps) {
  const [items, setItems] = useState([{ variantId: "", quantity: 1, price: 0 }]);
  const createBatch = useCreateBatch();
  const { data: products } = useGetProducts();

  // Tạo danh sách tất cả các biến thể để chọn
  const variantOptions = React.useMemo(() => {
    if (!products) return [];
    const list: { id: number; label: string; sku: string }[] = [];
    products.forEach((prod: any) => {
      const prodName = prod.name || prod.title || "Sản phẩm";
      if (prod.variants && prod.variants.length > 0) {
        prod.variants.forEach((v: any) => {
          const optDetails = [v.size, v.color].filter(Boolean).join(" - ");
          list.push({
            id: v.id,
            label: `${prodName} ${optDetails ? `(${optDetails})` : ""} - SKU: ${v.sku}`,
            sku: v.sku,
          });
        });
      }
    });
    return list;
  }, [products]);

  const handleAddItem = () => {
    setItems([...items, { variantId: "", quantity: 1, price: 0 }]);
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
            code: `${code}-${item.variantId}`,
            variantId: Number(item.variantId),
            quantity: Number(item.quantity),
          }),
        ),
      );
      toast.success("Tạo phiếu nhập kho thành công");
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
          <DialogTitle>Tạo phiếu nhập hàng</DialogTitle>
          <DialogDescription>
            Nhập thông tin nhà cung cấp và danh sách biến thể sản phẩm nhập kho.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-800 mb-3">
              Thông tin nhà cung cấp
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider" className="text-sm">
                  Nhà cung cấp / Đối tác
                </Label>
                <Input
                  id="provider"
                  defaultValue="Fashion Shop Official"
                  placeholder="Tên nhà cung cấp..."
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-sm">
                  Ngày nhập
                </Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">
                Danh sách sản phẩm nhập
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                <Plus size={16} /> Thêm sản phẩm
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
                      Biến thể sản phẩm
                    </Label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none"
                      value={item.variantId}
                      onChange={(e) =>
                        handleChange(index, "variantId", e.target.value)
                      }
                      required
                    >
                      <option value="">Chọn biến thể sản phẩm...</option>
                      {variantOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
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
                          parseInt(e.target.value) || 1,
                        )
                      }
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs text-gray-500 mb-1">
                      Giá nhập (đ)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.price}
                      onChange={(e) =>
                        handleChange(
                          index,
                          "price",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="w-32 text-right">
                    <Label className="text-xs text-gray-500 mb-1 block">
                      Thành tiền
                    </Label>
                    <span className="font-semibold text-sm">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.quantity * item.price)}
                    </span>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600 mt-5"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-right">
                <span className="text-gray-600 mr-2">Tổng tiền:</span>
                <span className="text-xl font-bold text-red-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={createBatch.isPending}
            >
              {createBatch.isPending ? "Đang xử lý..." : "Lưu phiếu nhập"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
