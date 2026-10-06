import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber } from "@/lib/format";

describe("Analytics Workspace Utility & Logic", () => {
  it("formats KPI values properly", () => {
    expect(formatCurrency(485200000)).toContain("485.200.000");
    expect(formatNumber(1420)).toContain("1.420");
  });

  it("calculates trend delta correctly", () => {
    const calcDelta = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Number((((current - prev) / prev) * 100).toFixed(1));
    };

    expect(calcDelta(120, 100)).toBe(20);
    expect(calcDelta(84, 100)).toBe(-16);
    expect(calcDelta(50, 0)).toBe(100);
    expect(calcDelta(0, 0)).toBe(0);
  });

  it("formats CSV lines accurately with quotes and escaping", () => {
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const productName = 'Áo Thun "Graphic Summer" 2026';
    expect(escapeCsv(productName)).toBe('"Áo Thun ""Graphic Summer"" 2026"');
  });
});
