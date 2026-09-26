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
    format: "",
    sku: "",
    listPrice: "",
    sellingPrice: "",
    stock: "",
    weight: "",
    dimensions: "",
    pages: "",
    imageUrl: "",
    isbn: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        format: "",
        sku: "",
        listPrice: "",
        sellingPrice: "",
        stock: "",
        weight: "",
        dimensions: "",
        pages: "",
        imageUrl: "",
        isbn: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa phiên bản" : "Thêm phiên bản mới"}
          </DialogTitle>
          <DialogDescription>
            Điền các thông số vật lý và giá bán cho phiên bản sách này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>
                Mã SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                name="sku"
                placeholder="Mã hàng hóa (VD: 8935244886676)"
                value={formData.sku}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>
                Hình thức (Bìa) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                name="format"
                placeholder="Bìa mềm, Bìa cứng..."
                value={formData.format}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Giá gốc (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                type="number"
                name="listPrice"
                placeholder="Giá niêm yết"
                value={formData.listPrice}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Giá bán (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                type="number"
                name="sellingPrice"
                placeholder="Giá thực bán"
                value={formData.sellingPrice}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Tồn kho <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                type="number"
                name="stock"
                placeholder="Số lượng"
                value={formData.stock}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Mã ISBN</Label>
              <Input
                name="isbn"
                placeholder="Mã ISBN"
                value={formData.isbn || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Trọng lượng (gr)</Label>
              <Input
                type="number"
                name="weight"
                placeholder="Ví dụ: 300"
                value={formData.weight || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Kích thước</Label>
              <Input
                name="dimensions"
                placeholder="14 x 20 cm"
                value={formData.dimensions || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Số trang</Label>
              <Input
                type="number"
                name="pages"
                placeholder="Ví dụ: 250"
                value={formData.pages || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 lg:col-span-4">
              <Label>Link ảnh sản phẩm</Label>
              <Input
                name="imageUrl"
                placeholder="https://..."
                value={formData.imageUrl || ""}
                onChange={handleChange}
              />
              {formData.imageUrl && (
                <div className="mt-4 border rounded-lg p-2 w-32 h-40 flex items-center justify-center bg-gray-50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button type="submit">Xác nhận</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
