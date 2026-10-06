"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/types/product";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";

const categorySchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên danh mục"),
    level: z.enum(["ROOT", "LEAF"]),
    parentId: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.level === "LEAF" && (!data.parentId || data.parentId <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Vui lòng chọn danh mục cha cho danh mục con",
      path: ["parentId"],
    },
  );

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
  defaultParentId?: number | null;
  rootCategories: Category[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  initialData,
  defaultParentId,
  rootCategories,
}: CategoryFormModalProps) {
  const isEdit = !!initialData;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  // If category has children, it cannot become a leaf/subcategory
  const hasChildren = (initialData?.children?.length ?? 0) > 0;
  // If category has products, it cannot become a root category
  const hasProducts = (initialData?._count?.products ?? 0) > 0;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      level: defaultParentId ? "LEAF" : "ROOT",
      parentId: defaultParentId ?? null,
    },
  });

  const watchedLevel = watch("level");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const isLeaf =
          initialData.parentId !== null && initialData.parentId !== undefined;
        reset({
          name: initialData.name,
          level: isLeaf ? "LEAF" : "ROOT",
          parentId: initialData.parentId ?? null,
        });
      } else {
        reset({
          name: "",
          level: defaultParentId ? "LEAF" : "ROOT",
          parentId: defaultParentId ?? rootCategories[0]?.id ?? null,
        });
      }
    }
  }, [isOpen, initialData, defaultParentId, reset, rootCategories]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const parentId =
        values.level === "ROOT" ? null : (values.parentId ?? null);
      if (isEdit && initialData) {
        await updateCategory.mutateAsync({
          id: initialData.id,
          data: {
            name: values.name.trim(),
            parentId,
          },
        });
        toast.success(`Đã cập nhật danh mục "${values.name.trim()}"`);
      } else {
        await createCategory.mutateAsync({
          name: values.name.trim(),
          parentId,
        });
        toast.success(`Đã tạo danh mục "${values.name.trim()}"`);
      }
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể lưu danh mục. Vui lòng kiểm tra lại.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin và phân cấp của danh mục."
              : "Tạo danh mục gốc (Cấp 1) hoặc danh mục con (Cấp 2)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Tên danh mục */}
          <div className="space-y-1.5">
            <Label htmlFor="category-name" className="text-sm font-medium">
              Tên danh mục <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              {...register("name")}
              placeholder="Ví dụ: Áo sơ mi, Quần jeans..."
              className={errors.name ? "border-destructive" : ""}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Phân loại cấp */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Phân cấp danh mục</Label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-start p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                  watchedLevel === "ROOT"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                } ${hasProducts ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="ROOT"
                    disabled={hasProducts}
                    {...register("level")}
                    onChange={(e) => {
                      setValue("level", "ROOT");
                      setValue("parentId", null);
                    }}
                    className="accent-primary"
                  />
                  <span className="font-semibold text-foreground">
                    Cấp 1 (Gốc)
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  Nhóm danh mục cha, không gán sản phẩm
                </span>
              </label>

              <label
                className={`flex flex-col items-start p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                  watchedLevel === "LEAF"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                } ${hasChildren ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="LEAF"
                    disabled={hasChildren}
                    {...register("level")}
                    onChange={(e) => {
                      setValue("level", "LEAF");
                      if (!watch("parentId") && rootCategories.length > 0) {
                        setValue("parentId", rootCategories[0].id);
                      }
                    }}
                    className="accent-primary"
                  />
                  <span className="font-semibold text-foreground">
                    Cấp 2 (Con / Lá)
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  Danh mục lá, được gán vào sản phẩm
                </span>
              </label>
            </div>

            {hasChildren && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Danh mục này đang có danh mục con, không thể chuyển thành danh
                mục cấp 2.
              </p>
            )}

            {hasProducts && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Danh mục này đang có {initialData?._count?.products} sản phẩm
                liên kết, không thể chuyển thành danh mục gốc.
              </p>
            )}
          </div>

          {/* Chọn danh mục cha nếu là Cấp 2 */}
          {watchedLevel === "LEAF" && (
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="parent-category" className="text-sm font-medium">
                Thuộc danh mục gốc <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) =>
                      field.onChange(val ? Number(val) : null)
                    }
                  >
                    <SelectTrigger id="parent-category" className="h-9">
                      <SelectValue placeholder="Chọn danh mục gốc cha" />
                    </SelectTrigger>
                    <SelectContent>
                      {rootCategories
                        .filter(
                          (cat) => !initialData || cat.id !== initialData.id,
                        )
                        .map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.parentId && (
                <p className="text-xs text-destructive">
                  {errors.parentId.message}
                </p>
              )}
            </div>
          )}

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
                  : "Tạo danh mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
