"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useGetBrands } from "@/hooks/useBrands";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { Trash2, Plus, Edit, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { VariantFormModal } from "./VariantFormModal";

interface ProductFormProps {
  onClose: () => void;
  product?: any;
}

export function ProductForm({ onClose, product }: ProductFormProps) {
  const isEdit = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const { data: brands } = useGetBrands();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
  });

  const [variants, setVariants] = useState<any[]>(
    product?.variants?.length ? product.variants : [],
  );

  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.length
      ? product.images.map((img: any) => img.url)
      : [""]
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
      toast.error("Phải có ít nhất 1 biến thể sản phẩm");
      return;
    }
    if (confirm("Bạn có chắc muốn xóa biến thể này?")) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const handleRemoveImageUrl = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const handleImageUrlChange = (idx: number, val: string) => {
    const list = [...imageUrls];
    list[idx] = val;
    setImageUrls(list);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (variants.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 biến thể sản phẩm");
      return;
    }

    const formattedVariants = variants.map((v) => ({
      sku: String(v.sku).trim(),
      barcode: v.barcode ? String(v.barcode).trim() : undefined,
      size: v.size ? String(v.size).trim() : undefined,
      color: v.color ? String(v.color).trim() : undefined,
      colorHex: v.colorHex ? String(v.colorHex).trim() : undefined,
      imageUrl: v.imageUrl ? String(v.imageUrl).trim() : undefined,
      listPrice: Number(v.listPrice),
      sellingPrice: Number(v.sellingPrice),
      stock: Number(v.stock),
      weight: v.weight ? Number(v.weight) : undefined,
    }));

    const validImages = imageUrls
      .filter((url) => url.trim().length > 0)
      .map((url, idx) => ({
        url: url.trim(),
        altText: `${formData.get("name")} - Ảnh ${idx + 1}`,
        sortOrder: idx,
      }));

    const data: any = {
      name: (formData.get("name") as string).trim(),
      description: formData.get("description") as string,
      brandId: formData.get("brandId") ? Number(formData.get("brandId")) : undefined,
      categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : undefined,
      material: formData.get("material") ? (formData.get("material") as string).trim() : undefined,
      careInstructions: formData.get("careInstructions") ? (formData.get("careInstructions") as string).trim() : undefined,
      season: formData.get("season") ? (formData.get("season") as string).trim() : undefined,
      provider: formData.get("provider") ? (formData.get("provider") as string).trim() : "Fashion Shop Official",
      variants: formattedVariants,
      images: validImages,
    };

    if (isEdit) {
      updateProduct.mutate(
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
      createProduct.mutate(data, {
        onSuccess: () => {
          toast.success("Thêm sản phẩm thành công");
          onClose();
        },
        onError: () => toast.error("Có lỗi xảy ra khi tạo sản phẩm"),
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Chỉnh sửa sản phẩm thời trang" : "Thêm mới sản phẩm thời trang"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="border rounded-lg p-5 bg-gray-50/50 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 border-b pb-2">
            1. Thông tin chung
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">
                Tên sản phẩm thời trang <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={product?.name || product?.title || ""}
                placeholder="VD: Áo Polo Cotton Pique Cao Cấp..."
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brandId">Thương hiệu</Label>
              <select
                id="brandId"
                name="brandId"
                defaultValue={product?.brandId || ""}
                className="w-full border border-gray-300 rounded-md p-2 bg-white text-sm outline-none focus:border-rose-500"
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Nhóm danh mục</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId || ""}
                className="w-full border border-gray-300 rounded-md p-2 bg-white text-sm outline-none focus:border-rose-500"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} → ` : ""}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="material">Chất liệu vải</Label>
              <Input
                id="material"
                name="material"
                defaultValue={product?.material || ""}
                placeholder="VD: 100% Cotton, Denim, Linen..."
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="season">Mùa / Bộ sưu tập</Label>
              <Input
                id="season"
                name="season"
                defaultValue={product?.season || ""}
                placeholder="VD: Xuân Hè 2026, Thu Đông..."
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="careInstructions">Hướng dẫn bảo quản</Label>
              <Input
                id="careInstructions"
                name="careInstructions"
                defaultValue={product?.careInstructions || ""}
                placeholder="VD: Giặt máy nước mát, không ủi nhiệt cao..."
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider">Nhà cung cấp / Đối tác</Label>
              <Input
                id="provider"
                name="provider"
                defaultValue={product?.provider || "Fashion Shop Official"}
                placeholder="Tên nhà cung cấp..."
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Mô tả chi tiết sản phẩm</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={product?.description || ""}
                placeholder="Mô tả form dáng, tính năng, phong cách phối đồ..."
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="border rounded-lg p-5 bg-gray-50/50 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-600" /> 2. Ảnh sản phẩm
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddImageUrl}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm link ảnh
            </Button>
          </div>

          <div className="space-y-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={url}
                  onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                  placeholder={`Link ảnh ${idx + 1} (https://...)`}
                  className="bg-white text-sm"
                />
                {imageUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImageUrl(idx)}
                    className="text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Variants Section */}
        <div className="border rounded-lg p-5 bg-gray-50/50 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                3. Danh sách biến thể (Size & Màu) <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-gray-500">
                Mỗi sản phẩm phải có ít nhất 1 biến thể với Size, Màu, SKU và Giá bán.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenAddVariant}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1"
            >
              <Plus size={16} /> Thêm biến thể
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed rounded-lg">
              Chưa có biến thể nào. Hãy bấm "Thêm biến thể" ở trên.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Kích cỡ (Size)</th>
                    <th className="py-2.5 px-3">Màu sắc</th>
                    <th className="py-2.5 px-3 text-right">Giá niêm yết</th>
                    <th className="py-2.5 px-3 text-right">Giá bán</th>
                    <th className="py-2.5 px-3 text-right">Tồn kho</th>
                    <th className="py-2.5 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold">
                        {v.sku}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {v.size || "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {v.colorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border shadow-xs inline-block"
                              style={{ backgroundColor: v.colorHex }}
                            />
                          )}
                          <span>{v.color || "-"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500">
                        {Number(v.listPrice).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-rose-600">
                        {Number(v.sellingPrice).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        {v.stock}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleOpenEditVariant(i)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleRemoveVariant(i)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white"
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            {createProduct.isPending || updateProduct.isPending
              ? "Đang lưu..."
              : isEdit
                ? "Lưu cập nhật"
                : "Tạo sản phẩm"}
          </Button>
        </div>
      </form>

      <VariantFormModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        onSave={handleSaveVariant}
        initialData={
          editingVariantIndex !== null ? variants[editingVariantIndex] : undefined
        }
      />
    </div>
  );
}
