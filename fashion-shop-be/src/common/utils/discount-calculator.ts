import { DiscountType, Prisma } from "@prisma/client";

/**
 * Tính số tiền giảm giá dựa theo loại giảm giá (PERCENT hoặc FIXED)
 * và trần giảm giá tối đa (nếu có).
 */
export function calculateDiscountAmount(
  baseAmount: number,
  type: DiscountType | null | undefined,
  value: number | Prisma.Decimal | null | undefined,
  maxCap?: number | Prisma.Decimal | null,
): number {
  if (!type || value === undefined || value === null) return 0;
  const numValue = Number(value);
  if (baseAmount <= 0 || numValue <= 0) return 0;

  let discount = 0;
  if (type === DiscountType.PERCENT) {
    discount = Math.floor((baseAmount * numValue) / 100);
    if (maxCap !== undefined && maxCap !== null) {
      const cap = Number(maxCap);
      if (cap > 0) {
        discount = Math.min(discount, cap);
      }
    }
  } else if (type === DiscountType.FIXED) {
    discount = Math.min(baseAmount, numValue);
  }

  return Math.max(0, Math.min(baseAmount, Math.floor(discount)));
}
