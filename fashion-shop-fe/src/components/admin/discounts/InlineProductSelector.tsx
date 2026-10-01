"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useGetProducts } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountType } from "@/types/discount";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  Plus,
  Trash2,
  Package,
  Layers,
  Check,
  X,
  Filter,
  AlertCircle,
  FolderPlus,
} from "lucide-react";

interface InlineProductSelectorProps {
  selectedVariantIds: number[];
  excludedVariantIds?: number[];
  onChange: (ids: number[]) => void;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountValue?: number;
}

export function InlineProductSelector({
  selectedVariantIds,
  excludedVariantIds = [],
  onChange,
  discountType = "PERCENT",
  discountValue = 0,
  maxDiscountValue,
}: InlineProductSelectorProps) {
  const { data: products = [], isLoading } = useGetProducts();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedVariantIds),
    [selectedVariantIds],
  );
  const excludedSet = useMemo(
    () => new Set(excludedVariantIds),
    [excludedVariantIds],
  );

  // Flatten all variants across products
  const { allVariants, categories, brands, variantsById } = useMemo(() => {
    const list: Array<{
      variantId: number;
      productId: number;
      productName: string;
      thumbnail: string;
      sku: string;
      size?: string;
      color?: string;
      sellingPrice: number;
      categoryName: string;
      brandName: string;
    }> = [];

    const catMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    const byId = new Map<number, (typeof list)[0]>();

    for (const p of products) {
      const prodName = p.name || p.title || "Sản phẩm";
      const catName = p.category?.name || "Chưa phân loại";
      const brandName = p.brand?.name || "Chưa phân loại";
      const thumbnail =
        p.images?.[0]?.url ||
        p.variants?.find((v: { imageUrl?: string }) => v.imageUrl)?.imageUrl ||
        "";

      catMap.set(catName, (catMap.get(catName) || 0) + 1);
      brandMap.set(brandName, (brandMap.get(brandName) || 0) + 1);

      for (const v of p.variants || []) {
        if (!v.id) continue;
        const item = {
          variantId: v.id,
          productId: p.id,
          productName: prodName,
          thumbnail: v.imageUrl || thumbnail,
          sku: v.sku || `VAR-${v.id}`,
          size: v.size,
          color: v.color,
          sellingPrice: Number(v.sellingPrice) || 0,
          categoryName: catName,
          brandName: brandName,
        };
        list.push(item);
        byId.set(v.id, item);
      }
    }

    return {
      allVariants: list,
      categories: Array.from(catMap.keys()),
      brands: Array.from(brandMap.keys()),
      variantsById: byId,
    };
  }, [products]);

  // Search results (max 10)
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return allVariants
      .filter((v) => {
        const matchName = v.productName.toLowerCase().includes(term);
        const matchSku = v.sku.toLowerCase().includes(term);
        const matchColor = v.color?.toLowerCase().includes(term);
        const matchSize = v.size?.toLowerCase().includes(term);
        return matchName || matchSku || matchColor || matchSize;
      })
      .slice(0, 10);
  }, [allVariants, searchTerm]);

  // Calculate final discounted price for preview
  const getDiscountedPrice = (original: number) => {
    if (!discountValue || discountValue <= 0 || original <= 0) return original;
    let disc = 0;
    if (discountType === "PERCENT") {
      disc = Math.round((original * discountValue) / 100);
      if (maxDiscountValue && disc > maxDiscountValue) {
        disc = maxDiscountValue;
      }
    } else {
      disc = discountValue;
    }
    return Math.max(0, original - disc);
  };

  // Add a single variant
  const handleAddVariant = (id: number) => {
    if (selectedSet.has(id) || excludedSet.has(id)) return;
    onChange([...selectedVariantIds, id]);
  };

  // Remove a single variant
  const handleRemoveVariant = (id: number) => {
    onChange(selectedVariantIds.filter((vId) => vId !== id));
  };

  // Batch add variants by category
  const handleAddByCategory = () => {
    if (selectedCategory === "ALL") return;
    const toAdd = allVariants
      .filter(
        (v) =>
          v.categoryName === selectedCategory &&
          !selectedSet.has(v.variantId) &&
          !excludedSet.has(v.variantId),
      )
      .map((v) => v.variantId);

    if (toAdd.length > 0) {
      onChange([...selectedVariantIds, ...toAdd]);
    }
  };

  // Batch add variants by brand
  const handleAddByBrand = () => {
    if (selectedBrand === "ALL") return;
    const toAdd = allVariants
      .filter(
        (v) =>
          v.brandName === selectedBrand &&
          !selectedSet.has(v.variantId) &&
          !excludedSet.has(v.variantId),
      )
      .map((v) => v.variantId);

    if (toAdd.length > 0) {
      onChange([...selectedVariantIds, ...toAdd]);
    }
  };

  // Clear all
  const handleClearAll = () => {
    onChange([]);
  };

  // Selected items list
  const selectedItems = useMemo(() => {
    return selectedVariantIds
      .map((id) => variantsById.get(id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
  }, [selectedVariantIds, variantsById]);

  return (
    <div className="space-y-3">
      {/* 1. Quick Action & Search Bar */}
      <div className="space-y-2.5 bg-muted/30 p-2.5 rounded-lg border border-border/70">
        {/* Row A: Search autocomplete */}
        <div ref={searchContainerRef} className="relative w-full">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Gõ tên sản phẩm, mã SKU, màu hoặc size để thêm nhanh..."
              className="pl-8 pr-8 h-8 text-xs bg-background"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchTerm.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-border/60">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Không tìm thấy sản phẩm nào khớp với &quot;{searchTerm}&quot;
                </div>
              ) : (
                searchResults.map((item) => {
                  const isSelected = selectedSet.has(item.variantId);
                  const isExcluded = excludedSet.has(item.variantId);

                  return (
                    <div
                      key={item.variantId}
                      onClick={() => {
                        if (!isSelected && !isExcluded) {
                          handleAddVariant(item.variantId);
                        }
                      }}
                      className={`p-2 flex items-center justify-between gap-3 text-xs transition-colors ${
                        isSelected || isExcluded
                          ? "bg-muted/40 opacity-60 cursor-not-allowed"
                          : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded border border-border overflow-hidden shrink-0 bg-muted/30 flex items-center justify-center">
                          {item.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {item.productName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {item.sku}
                            {item.size || item.color
                              ? ` • ${[item.size, item.color].filter(Boolean).join(" / ")}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-foreground tabular-nums">
                          {formatCurrency(item.sellingPrice)}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                            <Check className="w-3 h-3" /> Đã chọn
                          </span>
                        ) : isExcluded ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-semibold">
                            Nhóm khác
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 px-2 text-[10px] font-semibold gap-1"
                          >
                            <Plus className="w-3 h-3" /> Thêm
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Row B: Batch Selection by Category and Brand */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground shrink-0">
              Danh mục:
            </span>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-7 text-xs w-36 bg-background">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">-- Tất cả danh mục --</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedCategory === "ALL"}
              onClick={handleAddByCategory}
              className="h-7 px-2 text-[11px] font-semibold gap-1"
            >
              <FolderPlus className="w-3 h-3" /> Thêm cả danh mục
            </Button>
          </div>

          {/* Brand Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground shrink-0">
              Thương hiệu:
            </span>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-7 text-xs w-36 bg-background">
                <SelectValue placeholder="Chọn thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">-- Tất cả thương hiệu --</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedBrand === "ALL"}
              onClick={handleAddByBrand}
              className="h-7 px-2 text-[11px] font-semibold gap-1"
            >
              <FolderPlus className="w-3 h-3" /> Thêm cả thương hiệu
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Selected Items Header & Table */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              Sản phẩm áp dụng trong nhóm này
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              {selectedVariantIds.length} SKU
            </span>
          </div>

          {selectedVariantIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        {selectedVariantIds.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-border/80 bg-muted/10 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Chưa có sản phẩm nào</p>
            <p className="text-[11px]">
              Sử dụng ô tìm kiếm phía trên hoặc chọn nhanh theo danh mục/thương
              hiệu để gán sản phẩm vào nhóm này.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10 border-b border-border">
                <tr>
                  <th className="px-3 py-1.5 font-medium">
                    Sản phẩm / Biến thể
                  </th>
                  <th className="px-3 py-1.5 font-medium">SKU</th>
                  <th className="px-3 py-1.5 font-medium text-right">
                    Giá gốc
                  </th>
                  <th className="px-3 py-1.5 font-medium text-right">
                    Giá sau giảm
                  </th>
                  <th className="w-8 px-2 py-1.5 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-card">
                {selectedItems.map((item) => {
                  const finalPrice = getDiscountedPrice(item.sellingPrice);
                  return (
                    <tr key={item.variantId} className="hover:bg-muted/20">
                      <td className="px-3 py-1.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded border border-border/60 overflow-hidden shrink-0 bg-muted/20 flex items-center justify-center">
                            {item.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="truncate block font-medium">
                              {item.productName}
                            </span>
                            {(item.size || item.color) && (
                              <span className="text-[10px] text-muted-foreground">
                                {[item.size, item.color]
                                  .filter(Boolean)
                                  .join(" - ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted-foreground tabular-nums">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(finalPrice)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(item.variantId)}
                          className="w-5 h-5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                          title="Xóa biến thể khỏi nhóm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
