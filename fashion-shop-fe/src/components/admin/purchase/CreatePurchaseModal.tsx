"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, PackagePlus, Minus, Plus, Package } from "lucide-react";
import { useCreatePurchase } from "@/hooks/usePurchases";
import { useGetProducts } from "@/hooks/useProducts";
import { formatCurrency, formatNumber } from "@/lib/format";
import { VariantQuickSearch, FlatVariantItem } from "./VariantQuickSearch";

interface PurchaseItemForm {
  variantId: number;
  productName: string;
  sku: string;
  options: string;
  imageUrl?: string;
  stock: number;
  quantity: number;
  costPrice: number;
}

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePurchaseModal({
  isOpen,
  onClose,
}: CreatePurchaseModalProps) {
  const [supplier, setSupplier] = useState("Fashion Shop Official");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItemForm[]>([]);

  const createPurchase = useCreatePurchase();
  const { data: products } = useGetProducts();

  const handleSelectVariant = (v: FlatVariantItem) => {
    const existingIndex = items.findIndex((it) => it.variantId === v.id);

    if (existingIndex > -1) {
      // Đã có trong danh sách -> tự động tăng số lượng lên 1
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
      toast.success(
        `Đã tăng số lượng "${v.productName} (${[v.size, v.color].filter(Boolean).join(" - ")})" lên ${updated[existingIndex].quantity}`,
      );
    } else {
      // Thêm mới vào danh sách
      setItems([
        ...items,
        {
          variantId: v.id,
          productName: v.productName,
          sku: v.sku,
          options: [v.size, v.color].filter(Boolean).join(" - "),
          imageUrl: v.imageUrl,
          stock: v.stock,
          quantity: 1,
          costPrice: 0,
        },
      ]);
      toast.success(`Đã thêm "${v.productName}" vào phiếu nhập`);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, nextQty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, nextQty);
    setItems(updated);
  };

  const handleCostPriceChange = (index: number, nextPrice: number) => {
    const updated = [...items];
    updated[index].costPrice = Math.max(0, nextPrice);
    setItems(updated);
  };

  const resetForm = () => {
    setSupplier("Fashion Shop Official");
    setNote("");
    setItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập");
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplier: supplier.trim(),
        note: note.trim() || undefined,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: Number(item.quantity),
          costPrice: Number(item.costPrice) || 0,
        })),
      });

      toast.success("Đã tạo phiếu nhập kho");
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Không tạo được phiếu nhập kho. Vui lòng thử lại.",
      );
    }
  };

  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * (Number(item.costPrice) || 0),
    0,
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card text-card-foreground border-border sm:rounded-2xl shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Tạo Phiếu Nhập Hàng
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Quét mã SKU hoặc tìm kiếm sản phẩm nhanh để thêm vào phiếu nhập,
            quản lý số lượng và giá vốn nhập kho.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-purchase-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogBody className="space-y-5 px-6 py-5">
            {/* Thông tin nhà cung cấp & Ghi chú */}
            <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-3">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="supplier"
                    className="text-xs text-foreground font-medium"
                  >
                    Nhà cung cấp / Đối tác *
                  </Label>
                  <Input
                    id="supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Tên nhà cung cấp..."
                    className="bg-background text-xs mt-1 border-input"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="note"
                    className="text-xs text-foreground font-medium"
                  >
                    Ghi chú nhập hàng
                  </Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Nhập hàng đợt 1 mùa hè, hàng mẫu..."
                    className="bg-background text-xs mt-1 border-input"
                  />
                </div>
              </div>
            </div>

            {/* Thanh tìm kiếm nhanh Autocomplete (Combobox) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span>Thêm mặt hàng nhập</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Gõ tên hoặc quét mã SKU để chọn nhanh
                </span>
              </div>

              <VariantQuickSearch
                products={products}
                selectedVariantIds={items.map((it) => it.variantId)}
                onSelectVariant={handleSelectVariant}
              />
            </div>

            {/* Danh sách sản phẩm đã chọn */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  Mặt hàng trong phiếu ({items.length} mặt hàng, {totalQuantity}{" "}
                  chiếc)
                </h3>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/20">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-3">
                    <Package className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Chưa có sản phẩm nào trong phiếu nhập
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Hãy sử dụng thanh tìm kiếm ở trên để quét mã SKU hoặc gõ tên
                    sản phẩm/biến thể cần nhập kho.
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
                  <div className="overflow-x-auto admin-scrollbar">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-3.5 py-2.5">Sản phẩm & Biến thể</th>
                          <th className="px-3.5 py-2.5 text-center">
                            Tồn kho hiện tại
                          </th>
                          <th className="px-3.5 py-2.5 text-center w-36">
                            Số lượng nhập
                          </th>
                          <th className="px-3.5 py-2.5 text-right w-40">
                            Giá nhập (VNĐ)
                          </th>
                          <th className="px-3.5 py-2.5 text-right w-36">
                            Thành tiền
                          </th>
                          <th className="px-3.5 py-2.5 text-center w-12">
                            Xóa
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {items.map((item, index) => {
                          const lineTotal = item.quantity * item.costPrice;

                          return (
                            <tr
                              key={item.variantId}
                              className="hover:bg-muted/40 transition-colors"
                            >
                              {/* Product Info */}
                              <td className="px-3.5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-4 h-4 text-muted-foreground/60" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate max-w-[240px]">
                                      {item.productName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {item.options && (
                                        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.2 rounded border border-border">
                                          {item.options}
                                        </span>
                                      )}
                                      <span className="text-[11px] font-mono text-muted-foreground">
                                        SKU: {item.sku}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Current Stock */}
                              <td className="px-3.5 py-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground tabular-nums">
                                  {item.stock} chiếc
                                </span>
                              </td>

                              {/* Quantity Stepper */}
                              <td className="px-3.5 py-3 text-center">
                                <div className="inline-flex items-center rounded-lg border border-input bg-background shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuantityChange(
                                        index,
                                        item.quantity - 1,
                                      )
                                    }
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-l-lg transition-colors"
                                    title="Giảm 1"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        index,
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                    className="w-12 text-center text-xs font-semibold text-foreground bg-transparent focus:outline-none tabular-nums"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuantityChange(
                                        index,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-r-lg transition-colors"
                                    title="Tăng 1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* Cost Price */}
                              <td className="px-3.5 py-3 text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={item.costPrice || ""}
                                  onChange={(e) =>
                                    handleCostPriceChange(
                                      index,
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="0"
                                  className="h-8 text-xs text-right font-mono tabular-nums bg-background"
                                />
                              </td>

                              {/* Line Total */}
                              <td className="px-3.5 py-3 text-right font-semibold text-foreground font-mono tabular-nums">
                                {formatCurrency(lineTotal)}
                              </td>

                              {/* Action: Trash */}
                              <td className="px-3.5 py-3 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                  onClick={() => handleRemoveItem(index)}
                                  title="Xóa mặt hàng khỏi phiếu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tổng cộng Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-muted/40 rounded-xl border border-border">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Tổng số mặt hàng:{" "}
                    <strong className="text-foreground">{items.length}</strong>{" "}
                    SKU
                  </p>
                  <p>
                    Tổng sản phẩm nhập:{" "}
                    <strong className="text-foreground">
                      {formatNumber(totalQuantity)}
                    </strong>{" "}
                    chiếc
                  </p>
                </div>

                <div className="text-right w-full sm:w-auto">
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Tổng giá trị phiếu nhập:
                  </span>
                  <span className="text-xl font-bold text-primary tabular-nums">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-xs border-border h-9 px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="create-purchase-form"
              className="text-xs font-semibold shadow-xs h-9 px-4"
              disabled={createPurchase.isPending || items.length === 0}
            >
              {createPurchase.isPending
                ? "Đang lưu phiếu..."
                : `Lưu phiếu nhập kho (${items.length} mặt hàng)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
