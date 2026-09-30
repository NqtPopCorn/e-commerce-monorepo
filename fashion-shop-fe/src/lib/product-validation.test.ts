import { describe, it, expect } from "vitest";
import {
  productFormSchema,
  productVariantSchema,
  findDuplicateSkus,
} from "./product-validation";

describe("Product Validation Schema & Helpers", () => {
  const validVariant = {
    sku: "SHIRT-M-BLK",
    listPrice: 350000,
    sellingPrice: 290000,
    stock: 50,
    size: "M",
    color: "Đen",
    colorHex: "#000000",
  };

  it("should validate a correct product form payload", () => {
    const validData = {
      name: "Áo polo cotton piqué",
      description: "Form regular fit thoáng mát",
      provider: "Fashion Shop Official",
      images: ["https://example.com/img1.jpg"],
      variants: [validVariant],
    };

    const result = productFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail when product name is empty", () => {
    const data = {
      name: "   ",
      variants: [validVariant],
    };

    const result = productFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nhập tên sản phẩm");
    }
  });

  it("should fail when there are no variants", () => {
    const data = {
      name: "Áo polo",
      variants: [],
    };

    const result = productFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Thêm ít nhất một biến thể");
    }
  });

  it("should fail when selling price is higher than list price", () => {
    const variantData = {
      ...validVariant,
      listPrice: 200000,
      sellingPrice: 300000,
    };

    const result = productVariantSchema.safeParse(variantData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Giá bán không được cao hơn giá niêm yết",
      );
    }
  });

  it("should detect duplicate SKUs across variants", () => {
    const data = {
      name: "Áo sơ mi",
      variants: [
        { ...validVariant, sku: "SKU-01" },
        { ...validVariant, sku: "sku-01", size: "L" },
      ],
    };

    const result = productFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const skuIssue = result.error.issues.find(
        (issue) => issue.message === "SKU bị trùng trong danh sách",
      );
      expect(skuIssue).toBeDefined();
    }

    const duplicates = findDuplicateSkus(data.variants);
    expect(duplicates.has("sku-01")).toBe(true);
  });

  it("should detect duplicate (color, size) combinations", () => {
    const data = {
      name: "Quần jean",
      variants: [
        { ...validVariant, sku: "JEAN-30-BLK-1", size: "30", color: "Đen" },
        { ...validVariant, sku: "JEAN-30-BLK-2", size: "30", color: "Đen" },
      ],
    };

    const result = productFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const comboIssue = result.error.issues.find(
        (issue) => issue.message === "Biến thể cùng màu và kích cỡ đã tồn tại",
      );
      expect(comboIssue).toBeDefined();
    }
  });

  it("should reject negative stock or non-integer stock", () => {
    const negativeStock = {
      ...validVariant,
      stock: -5,
    };
    const resultNeg = productVariantSchema.safeParse(negativeStock);
    expect(resultNeg.success).toBe(false);

    const floatStock = {
      ...validVariant,
      stock: 3.5,
    };
    const resultFloat = productVariantSchema.safeParse(floatStock);
    expect(resultFloat.success).toBe(false);
  });
});
