"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Control,
  FieldErrors,
  UseFormRegister,
  useFieldArray,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormVariant, ProductFormValues } from "@/lib/product-validation";

interface ProductVariantTableProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  availableImages: string[];
  onRequestDelete: (index: number, variant: FormVariant) => void;
  disabled?: boolean;
}

export function ProductVariantTable({
  control,
  register,
  setValue,
  watch,
  errors,
  availableImages,
  onRequestDelete,
  disabled = false,
}: ProductVariantTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const newlyAddedIndexRef = useRef<number | null>(null);
  const colorInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const watchedVariants = watch("variants") || [];

  // Focus ô màu của dòng mới tạo sau khi append
  useEffect(() => {
    if (newlyAddedIndexRef.current !== null) {
      const idx = newlyAddedIndexRef.current;
      colorInputRefs.current[idx]?.focus();
      newlyAddedIndexRef.current = null;
    }
  }, [fields.length]);

  const handleAddVariant = () => {
    newlyAddedIndexRef.current = fields.length;
    append({
      sku: "",
      barcode: "",
      size: "",
      color: "",
      colorHex: "#000000",
      listPrice: 0,
      sellingPrice: 0,
      stock: 0,
      weight: undefined,
      imageUrl: "",
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const variantErrors = errors.variants;
  const hasGlobalVariantError = typeof variantErrors?.message === "string";

  // Đếm số biến thể có lỗi
  const errorCount = Array.isArray(variantErrors)
    ? variantErrors.filter(Boolean).length
    : 0;

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              Biến thể <span className="text-destructive">*</span>
            </h2>
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorCount} biến thể có lỗi
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Sản phẩm cần ít nhất một biến thể với mã SKU và giá bán.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0 self-start sm:self-auto"
          onClick={handleAddVariant}
          disabled={disabled}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Thêm biến thể
        </Button>
      </div>

      {hasGlobalVariantError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{variantErrors.message}</span>
        </div>
      )}

      {/* Empty State */}
      {fields.length === 0 ? (
        <div className="py-10 border rounded-lg bg-muted/10 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="p-3 bg-muted rounded-full text-muted-foreground">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Chưa có biến thể nào
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Sản phẩm cần ít nhất một biến thể với SKU, giá bán và tồn kho ban
              đầu.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariant}
            disabled={disabled}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm biến thể đầu tiên
          </Button>
        </div>
      ) : (
        /* Table of Variants */
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th scope="col" className="py-2.5 px-3 w-[180px]">
                    Màu
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-[100px]">
                    Size
                  </th>
                  <th scope="col" className="py-2.5 px-3 min-w-[150px]">
                    SKU <span className="text-destructive">*</span>
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-[140px] text-right">
                    Giá niêm yết (₫) <span className="text-destructive">*</span>
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-[140px] text-right">
                    Giá bán (₫) <span className="text-destructive">*</span>
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-[100px] text-right">
                    Tồn kho <span className="text-destructive">*</span>
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-[90px] text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fields.map((field, idx) => {
                  const isExpanded = expandedRows[idx];
                  const rowErrors = Array.isArray(variantErrors)
                    ? variantErrors[idx]
                    : undefined;
                  const currentVar = watchedVariants[idx] || {};

                  return (
                    <React.Fragment key={field.id}>
                      <tr className="hover:bg-muted/30 transition-colors group">
                        {/* Màu */}
                        <td className="py-2 px-3 align-top">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              {...register(`variants.${idx}.colorHex`)}
                              className="w-7 h-7 p-0 border border-input rounded cursor-pointer shrink-0 bg-transparent"
                              title="Chọn mã màu"
                            />
                            <Input
                              {...register(`variants.${idx}.color`)}
                              ref={(el) => {
                                register(`variants.${idx}.color`).ref(el);
                                colorInputRefs.current[idx] = el;
                              }}
                              placeholder="VD: Đen"
                              className="h-8 text-xs bg-background"
                            />
                          </div>
                        </td>

                        {/* Size */}
                        <td className="py-2 px-3 align-top">
                          <Input
                            {...register(`variants.${idx}.size`)}
                            placeholder="S, M..."
                            aria-invalid={!!rowErrors?.size}
                            className={`h-8 text-xs bg-background ${
                              rowErrors?.size
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                          />
                          {rowErrors?.size && (
                            <p className="text-[11px] text-destructive mt-1">
                              {rowErrors.size.message}
                            </p>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="py-2 px-3 align-top">
                          <Input
                            {...register(`variants.${idx}.sku`)}
                            placeholder="SHIRT-M-BLK"
                            aria-invalid={!!rowErrors?.sku}
                            className={`h-8 text-xs font-mono bg-background ${
                              rowErrors?.sku
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                          />
                          {rowErrors?.sku && (
                            <p className="text-[11px] text-destructive mt-1 font-sans">
                              {rowErrors.sku.message}
                            </p>
                          )}
                        </td>

                        {/* Giá niêm yết */}
                        <td className="py-2 px-3 align-top text-right">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            {...register(`variants.${idx}.listPrice`, {
                              valueAsNumber: true,
                            })}
                            className={`h-8 text-xs text-right tabular-nums bg-background ${
                              rowErrors?.listPrice
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                          />
                          {rowErrors?.listPrice && (
                            <p className="text-[11px] text-destructive mt-1 text-right">
                              {rowErrors.listPrice.message}
                            </p>
                          )}
                        </td>

                        {/* Giá bán */}
                        <td className="py-2 px-3 align-top text-right">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            {...register(`variants.${idx}.sellingPrice`, {
                              valueAsNumber: true,
                            })}
                            className={`h-8 text-xs text-right tabular-nums bg-background ${
                              rowErrors?.sellingPrice
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                          />
                          {rowErrors?.sellingPrice && (
                            <p className="text-[11px] text-destructive mt-1 text-right">
                              {rowErrors.sellingPrice.message}
                            </p>
                          )}
                        </td>

                        {/* Tồn kho */}
                        <td className="py-2 px-3 align-top text-right">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            {...register(`variants.${idx}.stock`, {
                              valueAsNumber: true,
                            })}
                            className={`h-8 text-xs text-right tabular-nums bg-background ${
                              rowErrors?.stock
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                          />
                          {rowErrors?.stock && (
                            <p className="text-[11px] text-destructive mt-1 text-right">
                              {rowErrors.stock.message}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 align-top text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 text-muted-foreground hover:text-foreground ${
                                isExpanded ? "bg-muted text-foreground" : ""
                              }`}
                              onClick={() => toggleExpand(idx)}
                              aria-expanded={isExpanded}
                              title="Thêm thông tin biến thể"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </Button>

                            <button
                              type="button"
                              aria-label="Xóa biến thể"
                              onClick={() => {
                                const targetVar =
                                  watchedVariants[idx] || (field as any);
                                if (targetVar.id) {
                                  onRequestDelete(idx, targetVar);
                                } else {
                                  remove(idx);
                                }
                              }}
                              disabled={disabled}
                              className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                              title="Xóa biến thể"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row: Barcode, Cân nặng, Ảnh biến thể */}
                      {isExpanded && (
                        <tr className="bg-muted/20 border-b">
                          <td colSpan={7} className="p-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Barcode */}
                              <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">
                                  Mã vạch (Barcode)
                                </Label>
                                <Input
                                  {...register(`variants.${idx}.barcode`)}
                                  placeholder="8935244886676"
                                  className="h-8 text-xs bg-background"
                                />
                              </div>

                              {/* Cân nặng */}
                              <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">
                                  Cân nặng (g)
                                </Label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  placeholder="250"
                                  {...register(`variants.${idx}.weight`, {
                                    setValueAs: (v) =>
                                      v === "" || v === null || isNaN(Number(v))
                                        ? undefined
                                        : Number(v),
                                  })}
                                  className="h-8 text-xs bg-background"
                                />
                              </div>

                              {/* Ảnh biến thể */}
                              <div className="space-y-1 sm:col-span-1">
                                <Label className="text-[11px] text-muted-foreground">
                                  Ảnh riêng cho biến thể
                                </Label>
                                <div className="flex gap-2 items-center">
                                  {currentVar.imageUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={currentVar.imageUrl}
                                      alt="Ảnh biến thể"
                                      className="w-8 h-8 rounded object-cover border shrink-0 bg-background"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded border border-dashed flex items-center justify-center text-[10px] text-muted-foreground shrink-0 bg-background">
                                      Trống
                                    </div>
                                  )}
                                  <Input
                                    {...register(`variants.${idx}.imageUrl`)}
                                    placeholder="https://..."
                                    className="h-8 text-xs bg-background flex-1"
                                  />
                                </div>

                                {/* Chọn nhanh từ ảnh sản phẩm đã có */}
                                {availableImages.length > 0 && (
                                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      Chọn nhanh:
                                    </span>
                                    {availableImages.map((imgUrl, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() =>
                                          setValue(
                                            `variants.${idx}.imageUrl`,
                                            imgUrl,
                                            {
                                              shouldDirty: true,
                                            },
                                          )
                                        }
                                        className={`w-6 h-6 rounded border overflow-hidden shrink-0 hover:ring-1 hover:ring-primary ${
                                          currentVar.imageUrl === imgUrl
                                            ? "ring-2 ring-primary"
                                            : ""
                                        }`}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={imgUrl}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
