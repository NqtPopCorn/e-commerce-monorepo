/**
 * Helper định dạng chuẩn cho Fashion Shop Admin
 * Thuần hàm, an toàn với giá trị null/undefined, có thể kiểm thử độc lập bằng Vitest.
 */

export const formatCurrency = (v: number | string | null | undefined): string => {
  const num =
    typeof v === "number"
      ? (isNaN(v) ? 0 : v)
      : typeof v === "string"
      ? (isNaN(Number(v)) ? 0 : Number(v))
      : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (v: number | string | null | undefined): string => {
  const num =
    typeof v === "number"
      ? (isNaN(v) ? 0 : v)
      : typeof v === "string"
      ? (isNaN(Number(v)) ? 0 : Number(v))
      : 0;
  return new Intl.NumberFormat("vi-VN").format(num);
};

export const formatDate = (d: string | Date | null | undefined): string => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
};

export const formatDateTime = (d: string | Date | null | undefined): string => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};
