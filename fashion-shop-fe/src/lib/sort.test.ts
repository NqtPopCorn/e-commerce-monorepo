import { describe, it, expect } from "vitest";
import { sortData } from "./sort";

describe("sortData utility", () => {
  it("should return the same array if sortBy is null or empty", () => {
    const list = [{ id: 2 }, { id: 1 }];
    expect(sortData(list, null)).toEqual(list);
    expect(sortData(list, "")).toEqual(list);
  });

  it("should sort numbers ascending and descending", () => {
    const list = [{ val: 50 }, { val: 10 }, { val: 100 }, { val: 20 }];
    const asc = sortData(list, "val", "asc");
    expect(asc.map((i) => i.val)).toEqual([10, 20, 50, 100]);

    const desc = sortData(list, "val", "desc");
    expect(desc.map((i) => i.val)).toEqual([100, 50, 20, 10]);
  });

  it("should sort Vietnamese localized strings properly", () => {
    const list = [
      { name: "Đầm dạ hội" },
      { name: "Áo sơ mi" },
      { name: "Quần jean" },
      { name: "Balo da" },
      { name: "Áo thun" },
    ];
    const asc = sortData(list, "name", "asc");
    expect(asc.map((i) => i.name)).toEqual([
      "Áo sơ mi",
      "Áo thun",
      "Balo da",
      "Đầm dạ hội",
      "Quần jean",
    ]);

    const desc = sortData(list, "name", "desc");
    expect(desc.map((i) => i.name)).toEqual([
      "Quần jean",
      "Đầm dạ hội",
      "Balo da",
      "Áo thun",
      "Áo sơ mi",
    ]);
  });

  it("should sort date strings and Date objects", () => {
    const list = [
      { date: "2026-05-10T12:00:00Z" },
      { date: "2026-01-01T08:00:00Z" },
      { date: "2026-10-01T00:00:00Z" },
    ];
    const asc = sortData(list, "date", "asc");
    expect(asc.map((i) => i.date)).toEqual([
      "2026-01-01T08:00:00Z",
      "2026-05-10T12:00:00Z",
      "2026-10-01T00:00:00Z",
    ]);

    const desc = sortData(list, "date", "desc");
    expect(desc.map((i) => i.date)).toEqual([
      "2026-10-01T00:00:00Z",
      "2026-05-10T12:00:00Z",
      "2026-01-01T08:00:00Z",
    ]);
  });

  it("should sort nested properties", () => {
    const list = [
      { id: 1, user: { profile: { name: "Chiến" } } },
      { id: 2, user: { profile: { name: "An" } } },
      { id: 3, user: { profile: { name: "Bình" } } },
    ];
    const asc = sortData(list, "user.profile.name", "asc");
    expect(asc.map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("should handle custom getters", () => {
    const list = [
      { id: 1, prices: [100, 200] },
      { id: 2, prices: [50, 60] },
      { id: 3, prices: [300] },
    ];
    const asc = sortData(list, "minPrice", "asc", {
      minPrice: (item) => Math.min(...item.prices),
    });
    expect(asc.map((i) => i.id)).toEqual([2, 1, 3]);
  });

  it("should place null or undefined values at the end", () => {
    const list = [
      { id: 1, score: 80 },
      { id: 2, score: null },
      { id: 3, score: 95 },
      { id: 4, score: undefined },
      { id: 5, score: 70 },
    ];
    const asc = sortData(list, "score", "asc");
    expect(asc.map((i) => i.id)).toEqual([5, 1, 3, 2, 4]);

    const desc = sortData(list, "score", "desc");
    expect(desc.map((i) => i.id)).toEqual([3, 1, 5, 2, 4]);
  });
});
