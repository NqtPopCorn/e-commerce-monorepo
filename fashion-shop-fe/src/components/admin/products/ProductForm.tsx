"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCreateBook, useUpdateBook } from "@/hooks/useBooks";
import { Trash2, Plus, Edit, ArrowLeft } from "lucide-react";
import { VariantFormModal } from "./VariantFormModal";

interface ProductFormProps {
  onClose: () => void;
  product?: any;
}

export function ProductForm({ onClose, product }: ProductFormProps) {
  const isEdit = !!product;
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const [variants, setVariants] = useState<any[]>(
    product?.variants?.length ? product.variants : [],
  );

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );

  const handleOpenAddVariant = () => {
    setEditingVariantIndex(null);
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (index: number) => {
    setEditingVariantIndex(index);
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = (variantData: any) => {
    if (editingVariantIndex !== null) {
      const newVariants = [...variants];
      newVariants[editingVariantIndex] = variantData;
      setVariants(newVariants);
    } else {
      setVariants([...variants, variantData]);
    }
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length === 1) {
      toast.error("Phải có ít nhất 1 phiên bản sách");
      return;
    }
    if (confirm("Bạn có chắc muốn xóa phiên bản này?")) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (variants.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 phiên bản sách");
      return;
    }

    const formattedVariants = variants.map((v) => ({
      sku: String(v.sku).trim(),
      isbn: v.isbn ? String(v.isbn).trim() : undefined,
      format: String(v.format).trim(),
      imageUrl: v.imageUrl ? String(v.imageUrl).trim() : undefined,
      listPrice: Number(v.listPrice),
      sellingPrice: Number(v.sellingPrice),
      stock: Number(v.stock),
      weight: v.weight ? Number(v.weight) : undefined,
      dimensions: v.dimensions ? String(v.dimensions).trim() : undefined,
      pages: v.pages ? Number(v.pages) : undefined,
    }));

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      authors: formData.get("author")
        ? [(formData.get("author") as string).trim()]
        : [],
      translators: formData.get("translator")
        ? [(formData.get("translator") as string).trim()]
        : [],
      publisher: formData.get("publisher")
        ? (formData.get("publisher") as string).trim()
        : null,
      provider: formData.get("provider")
        ? (formData.get("provider") as string).trim()
        : null,
      publishYear: formData.get("publishYear")
        ? Number(formData.get("publishYear"))
        : null,
      language: formData.get("language")
        ? (formData.get("language") as string).trim()
        : null,
      variants: formattedVariants,
    };

    if (isEdit) {
      updateBook.mutate(
        { id: product.id, data },
        {
          onSuccess: () => {
            toast.success("Cập nhật sản phẩm thành công");
            onClose();
          },
          onError: () => toast.error("Có lỗi xảy ra khi cập nhật"),
        },
      );
    } else {
      createBook.mutate(data, {
        onSuccess: () => {
          toast.success("Thêm sản phẩm thành công");
          onClose();
        },
        onError: () => toast.error("Có lỗi xảy ra khi thêm"),
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Chỉnh sửa Sách" : "Thêm Sách Mới"}
          </h2>
          <p className="text-sm text-gray-500">
            Điền thông tin chung của sách và cấu hình các phiên bản (variants).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Thông tin chung */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-800 border-l-4 border-blue-600 pl-3">
            Thông tin chung
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="title">
                Tên sách <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={product?.title || ""}
                placeholder="Nhập tên sách"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Tác giả</Label>
              <Input
                id="author"
                name="author"
                defaultValue={product?.authors?.[0] || ""}
                placeholder="Tên tác giả"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translator">Người dịch</Label>
              <Input
                id="translator"
                name="translator"
                defaultValue={product?.translators?.[0] || ""}
                placeholder="Tên người dịch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Input
                id="language"
                name="language"
                defaultValue={product?.language || ""}
                placeholder="VD: Tiếng Việt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Nhà xuất bản</Label>
              <Input
                id="publisher"
                name="publisher"
                defaultValue={product?.publisher || ""}
                placeholder="Nhà xuất bản"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Nhà cung cấp</Label>
              <Input
                id="provider"
                name="provider"
                defaultValue={product?.provider || ""}
                placeholder="Nhà cung cấp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishYear">Năm xuất bản</Label>
              <Input
                id="publishYear"
                name="publishYear"
                type="number"
                defaultValue={product?.publishYear || ""}
                placeholder="VD: 2024"
              />
            </div>

            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={product?.description || ""}
                className="w-full min-h-[120px] border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập mô tả chi tiết về cuốn sách..."
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-800 border-l-4 border-blue-600 pl-3">
              Phiên bản sách (Variants)
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAddVariant}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" /> Thêm phiên bản
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
              Chưa có phiên bản nào. Vui lòng thêm ít nhất 1 phiên bản.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3 relative hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-gray-100 rounded border flex items-center justify-center overflow-hidden shrink-0">
                        {variant.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={variant.imageUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400">Ảnh</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {variant.format || "Chưa đặt tên"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          SKU: {variant.sku}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-2 pt-2 border-t border-dashed">
                    <div>
                      <span className="text-gray-500">Giá bán: </span>
                      <span className="font-semibold text-[#c92127]">
                        {Number(variant.sellingPrice).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tồn kho: </span>
                      <span className="font-medium text-gray-900">
                        {variant.stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-blue-600"
                      onClick={() => handleOpenEditVariant(index)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveVariant(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            className="px-8 bg-blue-600 hover:bg-blue-700"
            disabled={createBook.isPending || updateBook.isPending}
          >
            {createBook.isPending || updateBook.isPending
              ? "Đang lưu..."
              : "Lưu Sản Phẩm"}
          </Button>
        </div>
      </form>

      <VariantFormModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        onSave={handleSaveVariant}
        initialData={
          editingVariantIndex !== null ? variants[editingVariantIndex] : null
        }
      />
    </div>
  );
}
