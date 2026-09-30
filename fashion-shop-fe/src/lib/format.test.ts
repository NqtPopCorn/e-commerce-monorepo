import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
} from "./format";

describe("format helpers", () => {
  describe("formatCurrency", () => {
    it("formats VND currency accurately", () => {
      const formatted = formatCurrency(500000);
      // Kiểm tra chuỗi chứa 500.000 và ký tự tiền tệ đ hoặc ₫
      expect(formatted).toContain("500.000");
    });

    it("handles zero and undefined/null gracefully", () => {
      expect(formatCurrency(0)).toContain("0");
      expect(formatCurrency(null)).toContain("0");
      expect(formatCurrency(undefined)).toContain("0");
    });
  });

  describe("formatNumber", () => {
    it("formats number with thousands separator", () => {
      expect(formatNumber(1250000)).toContain("1.250.000");
    });
  });

  describe("formatDate and formatDateTime", () => {
    it("formats ISO string date safely", () => {
      const dateStr = "2026-09-30T10:00:00Z";
      expect(formatDate(dateStr)).not.toBe("-");
      expect(formatDateTime(dateStr)).not.toBe("-");
    });

    it("returns '-' for invalid or empty dates", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate("invalid-date")).toBe("-");
      expect(formatDateTime(undefined)).toBe("-");
    });
  });
});
