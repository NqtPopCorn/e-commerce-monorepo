import React, { useEffect, useState } from "react";
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

interface VariantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: any) => void;
  initialData?: any;
}

export function VariantFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: VariantFormModalProps) {
  const [formData, setFormData] = useState<any>({
    sku: "",
    barcode: "",
    size: "M",
    color: "Đen",
    colorHex: "#000000",
    listPrice: "",
    sellingPrice: "",
    stock: "",
    weight: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        sku: "",
        barcode: "",
        size: "M",
        color: "Đen",
        colorHex: "#000000",
        listPrice: "",
        sellingPrice: "",
        stock: "",
        weight: "",
        imageUrl: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa phiên bản sản phẩm" : "Thêm biến thể mới"}
          </DialogTitle>
          <DialogDescription>
            Điền kích cỡ (Size), màu sắc (Color), giá bán và tồn kho cho biến thể thời trang này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Mã SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                name="sku"
                placeholder="VD: SHIRT-M-BLK-01"
                value={formData.sku}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mã Barcode</Label>
              <Input
                name="barcode"
                placeholder="VD: 8935244886676"
                value={formData.barcode || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Kích cỡ (Size) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                name="size"
                placeholder="VD: S, M, L, XL, XXL..."
                value={formData.size || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Màu sắc <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  required
                  name="color"
                  placeholder="VD: Đen, Trắng, Xanh navy..."
                  value={formData.color || ""}
                  onChange={handleChange}
                  className="flex-1"
                />
                <input
                  type="color"
                  name="colorHex"
                  value={formData.colorHex || "#000000"}
                  onChange={handleChange}
                  className="w-10 h-10 p-0 border rounded cursor-pointer shrink-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Giá niêm yết (đ) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                type="number"
                min="0"
                step="1000"
                name="listPrice"
                placeholder="VD: 350000"
                value={formData.listPrice}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Giá bán thực tế (đ) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                type="number"
                min="0"
                step="1000"
                name="sellingPrice"
                placeholder="VD: 290000"
                value={formData.sellingPrice}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Tồn kho ban đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                type="number"
                min="0"
                name="stock"
                placeholder="VD: 50"
                value={formData.stock}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Khối lượng (gram)</Label>
              <Input
                type="number"
                min="0"
                name="weight"
                placeholder="VD: 250"
                value={formData.weight || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Ảnh riêng cho biến thể (URL)</Label>
              <Input
                name="imageUrl"
                placeholder="https://..."
                value={formData.imageUrl || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
              {initialData ? "Lưu thay đổi" : "Thêm biến thể"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
