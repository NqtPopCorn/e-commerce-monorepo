"use client";
import React, { useMemo, useState } from "react";
import { useGetProducts } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountType, PromotionKind } from "@/types/promotion";
import { useGetPromotions } from "@/hooks/usePromotions";
import { AlertTriangle, Info, Search } from "lucide-react";

interface ProductSelectionTableProps {
  selectedVariantIds: number[];
  excludedVariantIds?: number[];
  onChange: (ids: number[]) => void;
  discountType?: DiscountType;
  discountValue?: number;
  currentPromotionId?: number;
}

export function ProductSelectionTable({
  selectedVariantIds,
  excludedVariantIds = [],
  onChange,
  discountType,
  discountValue,
  currentPromotionId,
}: ProductSelectionTableProps) {
  const { data: products, isLoading } = useGetProducts();
  const { data: activePromosResponse } = useGetPromotions({
    active: true,
    kind: "CAMPAIGN",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");

  const excludedSet = useMemo(
    () => new Set(excludedVariantIds),
    [excludedVariantIds],
  );

  // Map of variantId -> active campaign conflict
  const conflictMap = useMemo(() => {
    const map = new Map<
      number,
      {
        promotionId: number;
        promotionName: string;
        priority: number;
        discountText: string;
      }
    >();
    const promos = activePromosResponse?.data || [];
    for (const promo of promos) {
      if (currentPromotionId && promo.id === currentPromotionId) continue;
      if (!promo.groups) continue;
      for (const group of promo.groups) {
        if (!group.variants) continue;
        const discountText =
          group.discountType === "PERCENT"
            ? `-${group.discountValue}%`
            : `-${Number(group.discountValue).toLocaleString("vi-VN")}₫`;

        for (const pv of group.variants) {
          if (!map.has(pv.variantId)) {
            map.set(pv.variantId, {
              promotionId: promo.id,
              promotionName: promo.name,
              priority: promo.priority || 0,
              discountText,
            });
          }
        }
      }
    }
    return map;
  }, [activePromosResponse, currentPromotionId]);

  const calculateDiscount = (price: number) => {
    if (!discountType || !discountValue || discountValue <= 0 || price <= 0)
      return 0;
    if (discountType === "PERCENT") {
      return Math.floor((price * discountValue) / 100);
    }
    return Math.min(price, discountValue);
  };

  const { variants, categories, brands } = useMemo(() => {
    if (!products) return { variants: [], categories: [], brands: [] };

    const flatVariants: any[] = [];
    const catSet = new Set<string>();
    const brandSet = new Set<string>();

    products.forEach((product: any) => {
      const prodName = product.name || product.title || "Sản phẩm";
      if (product.category?.name) catSet.add(product.category.name);
      if (product.brand?.name) brandSet.add(product.brand.name);

      product.variants?.forEach((variant: any) => {
        flatVariants.push({
          ...variant,
          productName: prodName,
          categoryName: product.category?.name || "Khác",
          brandName: product.brand?.name || "Khác",
        });
      });
    });

    return {
      variants: flatVariants,
      categories: Array.from(catSet),
      brands: Array.from(brandSet),
    };
  }, [products]);

  const filteredVariants = useMemo(() => {
    return variants.filter((v: any) => {
      const matchSearch =
        v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        selectedCategory === "ALL" || v.categoryName === selectedCategory;
      const matchBrand =
        selectedBrand === "ALL" || v.brandName === selectedBrand;
      return matchSearch && matchCat && matchBrand;
    });
  }, [variants, searchTerm, selectedCategory, selectedBrand]);

  const allFilteredSelected = useMemo(() => {
    const selectable = filteredVariants.filter((v) => !excludedSet.has(v.id));
    if (selectable.length === 0) return false;
    return selectable.every((v) => selectedVariantIds.includes(v.id));
  }, [filteredVariants, selectedVariantIds, excludedSet]);

  const handleSelectAllFiltered = (checked: boolean) => {
    const selectableIds = filteredVariants
      .filter((v) => !excludedSet.has(v.id))
      .map((v) => v.id);

    if (checked) {
      const newSelected = Array.from(
        new Set([...selectedVariantIds, ...selectableIds]),
      );
      onChange(newSelected);
    } else {
      const selectableSet = new Set(selectableIds);
      onChange(selectedVariantIds.filter((id) => !selectableSet.has(id)));
    }
  };

  const handleToggleSingle = (id: number, checked: boolean) => {
    if (checked) {
      onChange([...selectedVariantIds, id]);
    } else {
      onChange(selectedVariantIds.filter((item) => item !== id));
    }
  };

  const hasDiscountConfigured = Boolean(discountValue && discountValue > 0);

  return (
    <div className="space-y-4">
      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Thương hiệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả thương hiệu</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Data */}
      <div className="border rounded-md overflow-hidden bg-white shadow-xs">
        <div className="max-h-[360px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-slate-50/90 sticky top-0 z-10">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-[45px] text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer align-middle"
                    checked={allFilteredSelected}
                    onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600">
                  SKU
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">
                  Sản phẩm & Biến thể
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">
                  Danh mục
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">
                  Thương hiệu
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  {hasDiscountConfigured
                    ? "Giá gốc → Sau giảm"
                    : "Giá niêm yết"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-xs text-muted-foreground"
                  >
                    Đang tải dữ liệu sản phẩm...
                  </TableCell>
                </TableRow>
              ) : filteredVariants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-xs text-muted-foreground"
                  >
                    Không tìm thấy sản phẩm nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariants.map((variant) => {
                  const isExcluded = excludedSet.has(variant.id);
                  const isSelected = selectedVariantIds.includes(variant.id);
                  const variantSpecs = [variant.size, variant.color]
                    .filter(Boolean)
                    .join(" - ");
                  const conflict = conflictMap.get(variant.id);
                  const originalPrice = Number(variant.sellingPrice) || 0;
                  const discountAmt = calculateDiscount(originalPrice);
                  const finalPrice = Math.max(0, originalPrice - discountAmt);

                  return (
                    <TableRow
                      key={variant.id}
                      className={`hover:bg-slate-50/80 cursor-pointer select-none border-b border-slate-100 ${
                        isExcluded ? "opacity-40 bg-slate-50/60" : ""
                      }`}
                      onClick={() => {
                        if (!isExcluded) {
                          handleToggleSingle(variant.id, !isSelected);
                        }
                      }}
                    >
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          disabled={isExcluded}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer align-middle disabled:cursor-not-allowed"
                          checked={isSelected}
                          onChange={(e) =>
                            handleToggleSingle(variant.id, e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 font-medium">
                        {variant.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-semibold text-xs text-slate-900">
                              {variant.productName}
                            </span>
                            {variantSpecs && (
                              <span className="text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {variantSpecs}
                              </span>
                            )}
                            {isExcluded && (
                              <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                Đã thuộc nhóm khác
                              </span>
                            )}
                          </div>

                          {/* Conflict warning if variant is in another active campaign */}
                          {conflict && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded w-fit">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>
                                Đang chạy ở:{" "}
                                <strong>{conflict.promotionName}</strong> (Ưu
                                tiên {conflict.priority} ·{" "}
                                {conflict.discountText})
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {variant.categoryName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {variant.brandName}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasDiscountConfigured ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 line-through">
                                {originalPrice.toLocaleString("vi-VN")}₫
                              </span>
                              <span className="font-bold text-xs text-rose-600">
                                {finalPrice.toLocaleString("vi-VN")}₫
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-1 rounded mt-0.5">
                              {discountType === "PERCENT"
                                ? `Giảm ${discountValue}%`
                                : `Giảm -${Number(discountValue).toLocaleString("vi-VN")}₫`}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-700 text-xs">
                            {originalPrice.toLocaleString("vi-VN")}₫
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-slate-50/90 px-3 py-2 text-xs text-slate-500 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span>Đang hiển thị {filteredVariants.length} kết quả</span>
          <div className="flex items-center gap-3">
            {hasDiscountConfigured && (
              <span className="text-slate-600">
                Mức giảm nhóm:{" "}
                <strong className="text-rose-600 font-bold">
                  {discountType === "PERCENT"
                    ? `${discountValue}%`
                    : `${Number(discountValue).toLocaleString("vi-VN")}₫`}
                </strong>
              </span>
            )}
            <span>
              Đã chọn{" "}
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {selectedVariantIds.length}
              </span>{" "}
              biến thể
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
