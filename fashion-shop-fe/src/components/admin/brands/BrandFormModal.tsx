"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { ImageUpload } from "@/components/common/ImageUpload";
import { Brand } from "@/types/product";
import { useCreateBrand, useUpdateBrand } from "@/hooks/useBrands";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const brandSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên thương hiệu"),
  slug: z.string().trim().optional(),
  logo: z.string().trim().optional(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Brand | null;
}

export function BrandFormModal({
  isOpen,
  onClose,
  initialData,
}: BrandFormModalProps) {
  const isEdit = !!initialData;
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isManualSlug, setIsManualSlug] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          slug: initialData.slug,
          logo: initialData.logo || "",
        });
        setLogoUrl(initialData.logo || "");
        setIsManualSlug(true);
      } else {
        reset({
          name: "",
          slug: "",
          logo: "",
        });
        setLogoUrl("");
        setIsManualSlug(false);
      }
    }
  }, [isOpen, initialData, reset]);

  // Auto-generate slug when name changes (unless user manually modified slug)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val, { shouldValidate: true });
    if (!isManualSlug) {
      setValue("slug", slugify(val));
    }
  };

  const onSubmit = async (values: BrandFormValues) => {
    try {
      const finalSlug = values.slug
        ? slugify(values.slug)
        : slugify(values.name);
      const payload = {
        name: values.name.trim(),
        slug: finalSlug,
        logo: logoUrl || undefined,
      };

      if (isEdit && initialData) {
        await updateBrand.mutateAsync({
          id: initialData.id,
          data: payload,
        });
        toast.success(`Đã cập nhật thương hiệu "${values.name.trim()}"`);
      } else {
        await createBrand.mutateAsync(payload);
        toast.success(`Đã tạo thương hiệu "${values.name.trim()}"`);
      }
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể lưu thương hiệu. Vui lòng kiểm tra lại.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin nhận diện thương hiệu."
              : "Thêm thương hiệu thời trang mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Tên thương hiệu */}
          <div className="space-y-1.5">
            <Label htmlFor="brand-name" className="text-sm font-medium">
              Tên thương hiệu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brand-name"
              {...register("name")}
              onChange={handleNameChange}
              placeholder="Ví dụ: Nike, Zara, Uniqlo..."
              className={errors.name ? "border-destructive" : ""}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Đường dẫn Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="brand-slug" className="text-sm font-medium">
                Đường dẫn tĩnh (Slug)
              </Label>
              <span className="text-xs text-muted-foreground">
                Tự động tạo từ tên
              </span>
            </div>
            <Input
              id="brand-slug"
              {...register("slug")}
              onChange={(e) => {
                setIsManualSlug(true);
                setValue("slug", e.target.value);
              }}
              placeholder="nike, zara, uniqlo..."
              className="text-xs font-mono"
            />
          </div>

          {/* Logo thương hiệu */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo thương hiệu</Label>
            <div className="space-y-3">
              <ImageUpload
                value={logoUrl}
                onChange={(url) => {
                  setLogoUrl(url || "");
                  setValue("logo", url || "");
                }}
                folder="brands"
              />

              {/* Hoặc nhập link ảnh trực tiếp */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Hoặc nhập trực tiếp URL hình ảnh logo:
                </span>
                <Input
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setValue("logo", e.target.value);
                  }}
                  placeholder="https://example.com/logo.png"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting
                ? "Đang lưu..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo thương hiệu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
