import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/common/ImageUpload";

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card text-card-foreground">
        {/* Header cố định */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-bold">
            {initialData ? "Chỉnh sửa phiên bản sản phẩm" : "Thêm biến thể mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Điền kích cỡ (Size), màu sắc (Color), giá bán và tồn kho cho biến
            thể thời trang này.
          </DialogDescription>
        </DialogHeader>

        {/* Form với Body cuộn riêng biệt */}
        <form
          id="variant-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogBody className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Mã SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  name="sku"
                  placeholder="VD: SHIRT-M-BLK-01"
                  value={formData.sku}
                  onChange={handleChange}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mã Barcode</Label>
                <Input
                  name="barcode"
                  placeholder="VD: 8935244886676"
                  value={formData.barcode || ""}
                  onChange={handleChange}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Kích cỡ (Size) <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  name="size"
                  placeholder="VD: S, M, L, XL, XXL..."
                  value={formData.size || ""}
                  onChange={handleChange}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Màu sắc <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    required
                    name="color"
                    placeholder="VD: Đen, Trắng, Xanh navy..."
                    value={formData.color || ""}
                    onChange={handleChange}
                    className="flex-1 text-xs h-9"
                  />
                  <input
                    type="color"
                    name="colorHex"
                    value={formData.colorHex || "#000000"}
                    onChange={handleChange}
                    className="w-9 h-9 p-0 border border-border rounded-lg cursor-pointer shrink-0 bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Giá niêm yết (đ) <span className="text-destructive">*</span>
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
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Giá bán thực tế (đ){" "}
                  <span className="text-destructive">*</span>
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
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Tồn kho ban đầu <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  min="0"
                  name="stock"
                  placeholder="VD: 50"
                  value={formData.stock}
                  onChange={handleChange}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Khối lượng (gram)</Label>
                <Input
                  type="number"
                  min="0"
                  name="weight"
                  placeholder="VD: 250"
                  value={formData.weight || ""}
                  onChange={handleChange}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-2 md:col-span-2 border-t pt-3">
                <Label className="text-xs font-medium">
                  Ảnh riêng cho biến thể
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <ImageUpload
                    folder="products"
                    value={formData.imageUrl || ""}
                    onChange={(url) => {
                      setFormData((prev: any) => ({ ...prev, imageUrl: url }));
                    }}
                    hint="Tải ảnh riêng cho màu/mẫu biến thể này"
                  />
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Hoặc nhập liên kết ảnh trực tiếp:
                    </Label>
                    <Input
                      name="imageUrl"
                      placeholder="https://..."
                      value={formData.imageUrl || ""}
                      onChange={handleChange}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogBody>

          {/* Footer cố định ở đáy */}
          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="variant-form"
              className="text-xs h-9 px-4 font-semibold shadow-xs"
            >
              {initialData ? "Lưu thay đổi" : "Thêm biến thể"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
