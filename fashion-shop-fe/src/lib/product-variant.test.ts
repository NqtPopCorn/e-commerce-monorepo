import { describe, expect, it } from "vitest";
import {
  buildProductVariantUrl,
  ProductVariantLike,
  resolveInitialVariant,
  resolveVariantForColorChange,
  resolveVariantImageIndex,
} from "./product-variant";

const VARIANTS: ProductVariantLike[] = [
  { id: 10, color: "Trắng", size: "S", imageUrl: "img-white.jpg", stock: 5 },
  { id: 11, color: "Trắng", size: "M", imageUrl: "img-white.jpg", stock: 3 },
  { id: 20, color: "Đỏ đô", size: "S", imageUrl: "img-red.jpg", stock: 0 },
  { id: 21, color: "Đỏ đô", size: "M", imageUrl: "img-red.jpg", stock: 8 },
  { id: 30, color: "Xanh dương", size: "L", imageUrl: null, stock: 4 },
  {
    id: 31,
    color: "Xanh dương",
    size: "XL",
    imageUrl: "img-blue.jpg",
    stock: 2,
  },
];

describe("resolveInitialVariant", () => {
  it("prioritizes exact variantId over color and size", () => {
    const res = resolveInitialVariant(VARIANTS, {
      variantId: "21",
      color: "Trắng",
      size: "S",
    });
    expect(res?.id).toBe(21);
  });

  it("falls back to color + size when variantId does not exist", () => {
    const res = resolveInitialVariant(VARIANTS, {
      variantId: "9999",
      color: "đỏ đô",
      size: "m",
    });
    expect(res?.id).toBe(21);
  });

  it("prefers in-stock variant when only color is provided", () => {
    const res = resolveInitialVariant(VARIANTS, {
      color: "Đỏ đô",
    });
    expect(res?.id).toBe(21);
  });

  it("falls back to first in-stock variant when query is empty", () => {
    const res = resolveInitialVariant(VARIANTS, {});
    expect(res?.id).toBe(10);
  });
});

describe("resolveVariantForColorChange", () => {
  it("keeps current size when new color has that size", () => {
    const res = resolveVariantForColorChange(VARIANTS, "Đỏ đô", "M");
    expect(res?.id).toBe(21);
  });

  it("picks first in-stock variant of new color when current size is unavailable", () => {
    const res = resolveVariantForColorChange(VARIANTS, "Xanh dương", "S");
    expect(res?.id).toBe(30);
  });
});

describe("resolveVariantImageIndex", () => {
  const images = [
    "img-default.jpg",
    "img-white.jpg",
    "img-red.jpg",
    "img-blue.jpg",
  ];

  it("returns index of variant imageUrl when present", () => {
    expect(resolveVariantImageIndex(images, VARIANTS[3], VARIANTS)).toBe(2);
  });

  it("falls back to sibling variant image of the same color", () => {
    expect(resolveVariantImageIndex(images, VARIANTS[4], VARIANTS)).toBe(3);
  });

  it("returns 0 when no matching image exists", () => {
    expect(
      resolveVariantImageIndex(images, { color: "Đen", stock: 1 }, VARIANTS),
    ).toBe(0);
  });
});

describe("buildProductVariantUrl", () => {
  it("prioritizes variantId when valid", () => {
    expect(
      buildProductVariantUrl(436, {
        variantId: 21,
        color: "Đỏ đô",
        size: "M",
      }),
    ).toBe("/products/436?variantId=21");
  });

  it("encodes color and size when variantId is absent", () => {
    expect(
      buildProductVariantUrl(436, {
        color: "Đỏ đô",
        size: "M",
      }),
    ).toBe("/products/436?color=%C4%90%E1%BB%8F+%C4%91%C3%B4&size=M");
  });

  it("returns plain product URL when no variant params exist", () => {
    expect(buildProductVariantUrl(436, {})).toBe("/products/436");
  });
});

