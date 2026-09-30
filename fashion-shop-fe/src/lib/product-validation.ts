import { z } from "zod";

export const productVariantSchema = z
  .object({
    id: z.number().optional(),
    sku: z.string().trim().min(1, "Nhập SKU"),
    barcode: z.string().trim().optional(),
    size: z.string().trim().optional(),
    color: z.string().trim().optional(),
    colorHex: z.string().trim().optional(),
    imageUrl: z.string().trim().optional(),
    listPrice: z.number().min(0, "Giá niêm yết phải từ 0"),
    sellingPrice: z.number().min(0, "Giá bán phải từ 0"),
    stock: z
      .number()
      .int("Tồn kho phải là số nguyên từ 0")
      .min(0, "Tồn kho phải là số nguyên từ 0"),
    weight: z.number().int().min(0).optional(),
  })
  .refine((data) => data.sellingPrice <= data.listPrice, {
    message: "Giá bán không được cao hơn giá niêm yết",
    path: ["sellingPrice"],
  });

export type FormVariant = z.infer<typeof productVariantSchema>;

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Nhập tên sản phẩm"),
    description: z.string().optional(),
    brandId: z.number().optional(),
    categoryId: z.number().optional(),
    material: z.string().trim().optional(),
    careInstructions: z.string().trim().optional(),
    season: z.string().trim().optional(),
    provider: z.string().trim().default("Fashion Shop Official"),
    images: z.array(z.string().trim()).default([]),
    variants: z.array(productVariantSchema).min(1, "Thêm ít nhất một biến thể"),
  })
  .superRefine((data, ctx) => {
    // 1. Kiểm tra SKU trùng lặp trong bảng
    const seenSkus = new Map<string, number>();
    data.variants?.forEach((v, index) => {
      const normalizedSku = (v.sku || "").trim().toLowerCase();
      if (!normalizedSku) return;

      if (seenSkus.has(normalizedSku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SKU bị trùng trong danh sách",
          path: ["variants", index, "sku"],
        });
      } else {
        seenSkus.set(normalizedSku, index);
      }
    });

    // 2. Kiểm tra trùng cặp (màu, size) nếu cả hai đều có giá trị
    const seenCombos = new Map<string, number>();
    data.variants?.forEach((v, index) => {
      const color = v.color?.trim().toLowerCase();
      const size = v.size?.trim().toLowerCase();
      if (color && size) {
        const comboKey = `${color}__${size}`;
        if (seenCombos.has(comboKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Biến thể cùng màu và kích cỡ đã tồn tại",
            path: ["variants", index, "size"],
          });
        } else {
          seenCombos.set(comboKey, index);
        }
      }
    });
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Kiểm tra các SKU bị trùng trong mảng variants
 */
export function findDuplicateSkus(
  variants: Array<{ sku: string }>,
): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const v of variants) {
    const sku = (v.sku || "").trim().toLowerCase();
    if (!sku) continue;
    if (seen.has(sku)) {
      duplicates.add(sku);
    } else {
      seen.add(sku);
    }
  }

  return duplicates;
}
