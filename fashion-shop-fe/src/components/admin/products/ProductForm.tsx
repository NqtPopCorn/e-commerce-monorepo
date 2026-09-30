"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminConfirmDialog,
  ConfirmDialogVariant,
  AdminPageHeader,
} from "@/components/admin";

import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useGetBrands } from "@/hooks/useBrands";
import { useGetCategories } from "@/hooks/useCategories";

import {
  productFormSchema,
  ProductFormValues,
  FormVariant,
} from "@/lib/product-validation";
import { ProductImageGrid } from "./ProductImageGrid";
import { ProductVariantTable } from "./ProductVariantTable";

interface ProductFormProps {
  onClose: () => void;
  product?: any;
}

export function ProductForm({ onClose, product }: ProductFormProps) {
  const isEdit = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const { data: brands = [] } = useGetBrands();
  const { data: categories = [] } = useGetCategories();

  // Convert initial product values
  const defaultValues: ProductFormValues = {
    name: product?.name || "",
    description: product?.description || "",
    brandId: product?.brandId ? Number(product.brandId) : undefined,
    categoryId: product?.categoryId ? Number(product.categoryId) : undefined,
    material: product?.material || "",
    careInstructions: product?.careInstructions || "",
    season: product?.season || "",
    provider: product?.provider || "Fashion Shop Official",
    images: product?.images?.map((img: any) => img.url) || [],
    variants: product?.variants?.length
      ? product.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku || "",
          barcode: v.barcode || "",
          size: v.size || "",
          color: v.color || "",
          colorHex: v.colorHex || "#000000",
          imageUrl: v.imageUrl || "",
          listPrice: Number(v.listPrice) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          stock: Number(v.stock) || 0,
          weight: v.weight ? Number(v.weight) : undefined,
        }))
      : [
          {
            sku: "",
            barcode: "",
            size: "",
            color: "",
            colorHex: "#000000",
            imageUrl: "",
            listPrice: 0,
            sellingPrice: 0,
            stock: 0,
            weight: undefined,
          },
        ],
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues,
    mode: "onTouched",
  });

  const watchedImages = watch("images") || [];

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    variant: ConfirmDialogVariant;
    confirmText?: string;
    cancelText?: string;
    alertOnly?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: null,
    variant: "danger",
    alertOnly: false,
  });

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Cảnh báo beforeunload khi có dữ liệu chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Xử lý nút Hủy
  const handleRequestClose = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: "Bỏ thay đổi?",
        description: "Các thay đổi chưa lưu sẽ mất.",
        variant: "danger",
        confirmText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        onConfirm: () => {
          closeConfirmDialog();
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // Xử lý xóa biến thể đã có trong DB
  const handleRequestDeleteExistingVariant = (
    index: number,
    variant: FormVariant,
  ) => {
    const currentVariants = watch("variants") || [];
    if (currentVariants.length <= 1) {
      setConfirmDialog({
        isOpen: true,
        title: "Không thể xóa biến thể",
        description: "Sản phẩm cần ít nhất một biến thể.",
        variant: "warning",
        alertOnly: true,
        confirmText: "Đã hiểu",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xóa biến thể?",
      description: (
        <div className="space-y-1">
          <p>
            Biến thể <strong className="font-mono">{variant.sku}</strong> sẽ bị
            gỡ bỏ khỏi sản phẩm khi bạn lưu thay đổi.
          </p>
          {Number(variant.stock) > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Lưu ý: Biến thể đang có {variant.stock} sản phẩm tồn kho. Backend
              có thể từ chối nếu biến thể còn tồn kho hoặc đã có đơn hàng.
            </p>
          )}
        </div>
      ),
      variant: "danger",
      confirmText: "Xóa biến thể",
      cancelText: "Hủy",
      onConfirm: () => {
        const next = currentVariants.filter((_, i) => i !== index);
        setValue("variants", next, { shouldDirty: true, shouldValidate: true });
        closeConfirmDialog();
        toast.success(`Đã gỡ biến thể ${variant.sku}`);
      },
    });
  };

  // Submit Handler
  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  const onSubmit = (values: ProductFormValues) => {
    const formattedVariants = values.variants.map((v) => ({
      sku: v.sku.trim(),
      barcode: v.barcode ? v.barcode.trim() : undefined,
      size: v.size ? v.size.trim() : undefined,
      color: v.color ? v.color.trim() : undefined,
      colorHex: v.colorHex ? v.colorHex.trim() : undefined,
      imageUrl: v.imageUrl ? v.imageUrl.trim() : undefined,
      listPrice: Number(v.listPrice),
      sellingPrice: Number(v.sellingPrice),
      stock: Number(v.stock),
      weight: v.weight !== undefined ? Number(v.weight) : undefined,
    }));

    const validImages = values.images
      .filter((url) => url.trim().length > 0)
      .map((url, idx) => ({
        url: url.trim(),
        altText: `${values.name} - Ảnh ${idx + 1}`,
        sortOrder: idx,
      }));

    const payload: any = {
      name: values.name.trim(),
      description: values.description ? values.description.trim() : undefined,
      brandId: values.brandId ? Number(values.brandId) : undefined,
      categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      material: values.material ? values.material.trim() : undefined,
      careInstructions: values.careInstructions
        ? values.careInstructions.trim()
        : undefined,
      season: values.season ? values.season.trim() : undefined,
      provider: values.provider
        ? values.provider.trim()
        : "Fashion Shop Official",
      variants: formattedVariants,
      images: validImages,
    };

    if (isEdit) {
      updateProduct.mutate(
        { id: product.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Đã lưu sản phẩm");
            onClose();
          },
          onError: (err: any) => {
            const msg =
              err?.response?.data?.message ||
              "Không lưu được sản phẩm. Kiểm tra kết nối rồi thử lại.";
            toast.error(msg);
          },
        },
      );
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Đã tạo sản phẩm");
          onClose();
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            "Không tạo được sản phẩm. Kiểm tra kết nối rồi thử lại.";
          toast.error(msg);
        },
      });
    }
  };

  const onError = (formErrors: any) => {
    // Tự động focus vào ô lỗi đầu tiên
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      const el = document.querySelector(
        `[name="${firstErrorKey}"], [aria-invalid="true"]`,
      ) as HTMLElement | null;
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header: Breadcrumb & Title (Outside Card) */}
      <AdminPageHeader
        breadcrumbs={[
          { label: "Sản phẩm", onClick: handleRequestClose },
          { label: isEdit ? product?.name || "Sửa sản phẩm" : "Thêm sản phẩm" },
        ]}
        title={isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      />

      {/* Main Form Form Body */}
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        {/* Desktop 2-column Grid, Single column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          {/* Section 1: Thông tin chung (DOM 1, Desktop Row 1 Col 1) */}
          <div className="border border-border rounded-lg p-6 bg-card space-y-4 lg:col-start-1 lg:row-start-1">
            <div>
              <h2 className="text-base font-semibold">Thông tin chung</h2>
            </div>

            <div className="space-y-4">
              {/* Tên sản phẩm */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Tên sản phẩm <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Áo polo cotton piqué"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={`h-9 text-sm ${
                    errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {errors.name && (
                  <p id="name-error" className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Mô tả */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...register("description")}
                  placeholder="Form dáng, chất vải, cách phối đồ"
                  className="text-sm resize-y"
                />
              </div>

              {/* Chất liệu & Hướng dẫn bảo quản (2 cột) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="material" className="text-sm font-medium">
                    Chất liệu
                  </Label>
                  <Input
                    id="material"
                    {...register("material")}
                    placeholder="100% cotton"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="careInstructions"
                    className="text-sm font-medium"
                  >
                    Hướng dẫn bảo quản
                  </Label>
                  <Input
                    id="careInstructions"
                    {...register("careInstructions")}
                    placeholder="Giặt máy ở nước mát"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Phân loại (DOM 2, Desktop Row 1 Col 2) */}
          <div className="border border-border rounded-lg p-6 bg-card space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div>
              <h2 className="text-base font-semibold">Phân loại</h2>
            </div>

            <div className="space-y-4">
              {/* Thương hiệu */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Thương hiệu</Label>
                <Controller
                  name="brandId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) =>
                        field.onChange(val ? Number(val) : undefined)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Chọn thương hiệu" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b: any) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Danh mục */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Danh mục</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) =>
                        field.onChange(val ? Number(val) : undefined)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Mùa / bộ sưu tập */}
              <div className="space-y-1.5">
                <Label htmlFor="season" className="text-sm font-medium">
                  Mùa / bộ sưu tập
                </Label>
                <Input
                  id="season"
                  {...register("season")}
                  placeholder="Xuân hè 2026"
                  className="h-9 text-sm"
                />
              </div>

              {/* Nhà cung cấp */}
              <div className="space-y-1.5">
                <Label htmlFor="provider" className="text-sm font-medium">
                  Nhà cung cấp
                </Label>
                <Input
                  id="provider"
                  {...register("provider")}
                  placeholder="Fashion Shop Official"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ảnh sản phẩm (DOM 3, Desktop Row 2 Col 1) */}
          <div className="border border-border rounded-lg p-6 bg-card space-y-4 lg:col-start-1 lg:row-start-2">
            <ProductImageGrid
              images={watchedImages}
              onChange={(nextImages) =>
                setValue("images", nextImages, { shouldDirty: true })
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Section 4: Biến thể (DOM 4, Desktop Full Width lg:col-span-2) */}
          <div className="border border-border rounded-lg p-6 bg-card space-y-4 lg:col-span-2">
            <ProductVariantTable
              control={control}
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              availableImages={watchedImages}
              onRequestDelete={handleRequestDeleteExistingVariant}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* 5. Sticky Bottom Action Bar */}
        <div className="sticky bottom-4 z-10 bg-card/95 backdrop-blur-xs border border-border rounded-xl px-5 py-3 shadow-md mt-6 flex items-center justify-between gap-4">
          <div>
            {isDirty ? (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {isEdit ? "Chế độ chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="h-9 text-xs font-medium"
            >
              Hủy
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 text-xs font-medium min-w-[110px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>{isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}</span>
                </>
              ) : (
                <span>{isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}</span>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm || closeConfirmDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        alertOnly={confirmDialog.alertOnly}
      />
    </div>
  );
}
