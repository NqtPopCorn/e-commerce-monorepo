"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { DiscountType } from "@/types/promotion";
import { useGetPromotions } from "@/hooks/usePromotions";
import {
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  CheckCircle2,
  Package,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";

interface ProductSelectionTableProps {
  selectedVariantIds: number[];
  excludedVariantIds?: number[];
  onChange: (ids: number[]) => void;
  discountType?: DiscountType;
  discountValue?: number;
  currentPromotionId?: number;
}

interface GroupedProduct {
  id: number;
  name: string;
  thumbnail: string;
  categoryName: string;
  brandName: string;
  variants: any[];
  minPrice: number;
  maxPrice: number;
  minFinalPrice: number;
  maxFinalPrice: number;
  totalStock: number;
  hasConflict: boolean;
}

// Checkbox hỗ trợ trạng thái gạch ngang (indeterminate) khi chọn một phần biến thể
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !checked && Boolean(indeterminate);
    }
  }, [checked, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className={
        className ||
        "w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
      }
    />
  );
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
  const [onlySelected, setOnlySelected] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(
    new Set(),
  );

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
            : `-${formatCurrency(Number(group.discountValue))}`;

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

  const hasDiscountConfigured = Boolean(discountValue && discountValue > 0);

  // Gom nhóm sản phẩm và trích xuất danh mục, thương hiệu
  const { groupedProducts, categories, brands, allSelectableVariantIds } =
    useMemo(() => {
      if (!products) {
        return {
          groupedProducts: [],
          categories: [],
          brands: [],
          allSelectableVariantIds: [],
        };
      }

      const catSet = new Set<string>();
      const brandSet = new Set<string>();
      const selectableIds: number[] = [];

      const list: GroupedProduct[] = products.map((product: any) => {
        const prodName = product.name || product.title || "Sản phẩm";
        const catName = product.category?.name || "Chưa phân loại";
        const brandName = product.brand?.name || "Chưa phân loại";

        if (product.category?.name) catSet.add(product.category.name);
        if (product.brand?.name) brandSet.add(product.brand.name);

        const variants = (product.variants || []).map((v: any) => {
          if (!excludedSet.has(v.id)) {
            selectableIds.push(v.id);
          }
          return {
            ...v,
            productName: prodName,
            categoryName: catName,
            brandName: brandName,
          };
        });

        // Tính khoảng giá gốc và giá sau giảm
        const prices = variants.map(
          (v: any) => Number(v.sellingPrice) || Number(v.listPrice) || 0,
        );
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;

        const finalPrices = prices.map((p: number) =>
          Math.max(0, p - calculateDiscount(p)),
        );
        const minFinalPrice = finalPrices.length ? Math.min(...finalPrices) : 0;
        const maxFinalPrice = finalPrices.length ? Math.max(...finalPrices) : 0;

        const totalStock = variants.reduce(
          (sum: number, v: any) => sum + (Number(v.stock) || 0),
          0,
        );

        const hasConflict = variants.some((v: any) => conflictMap.has(v.id));

        const thumbnail =
          product.images?.[0]?.url ||
          variants.find((v: any) => v.imageUrl)?.imageUrl ||
          "";

        return {
          id: product.id,
          name: prodName,
          thumbnail,
          categoryName: catName,
          brandName,
          variants,
          minPrice,
          maxPrice,
          minFinalPrice,
          maxFinalPrice,
          totalStock,
          hasConflict,
        };
      });

      return {
        groupedProducts: list,
        categories: Array.from(catSet),
        brands: Array.from(brandSet),
        allSelectableVariantIds: selectableIds,
      };
    }, [products, excludedSet, discountType, discountValue, conflictMap]);

  // Bộ lọc sản phẩm
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return groupedProducts.filter((product) => {
      // 1. Lọc danh mục
      if (
        selectedCategory !== "ALL" &&
        product.categoryName !== selectedCategory
      ) {
        return false;
      }

      // 2. Lọc thương hiệu
      if (selectedBrand !== "ALL" && product.brandName !== selectedBrand) {
        return false;
      }

      // 3. Lọc chỉ sản phẩm đã chọn
      if (onlySelected) {
        const hasSelected = product.variants.some((v) =>
          selectedVariantIds.includes(v.id),
        );
        if (!hasSelected) return false;
      }

      // 4. Lọc tìm kiếm theo tên sản phẩm, SKU, size, màu
      if (q) {
        const matchName = product.name.toLowerCase().includes(q);
        const matchCategory = product.categoryName.toLowerCase().includes(q);
        const matchBrand = product.brandName.toLowerCase().includes(q);
        const matchVariant = product.variants.some(
          (v) =>
            v.sku?.toLowerCase().includes(q) ||
            v.size?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q),
        );
        return matchName || matchCategory || matchBrand || matchVariant;
      }

      return true;
    });
  }, [
    groupedProducts,
    selectedCategory,
    selectedBrand,
    onlySelected,
    searchTerm,
    selectedVariantIds,
  ]);

  // Tự động mở rộng sản phẩm nếu người dùng tìm kiếm theo SKU hoặc thuộc tính biến thể
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return;

    const matchedIds = new Set<number>();
    filteredProducts.forEach((p) => {
      const matchVariant = p.variants.some(
        (v) =>
          v.sku?.toLowerCase().includes(q) ||
          v.size?.toLowerCase().includes(q) ||
          v.color?.toLowerCase().includes(q),
      );
      if (matchVariant) {
        matchedIds.add(p.id);
      }
    });

    if (matchedIds.size > 0) {
      setExpandedProductIds((prev) => new Set([...prev, ...matchedIds]));
    }
  }, [searchTerm, filteredProducts]);

  // Kiểm tra trạng thái chọn tất cả của các sản phẩm đang hiển thị
  const allFilteredVariantIds = useMemo(() => {
    const ids: number[] = [];
    filteredProducts.forEach((p) => {
      p.variants.forEach((v) => {
        if (!excludedSet.has(v.id)) {
          ids.push(v.id);
        }
      });
    });
    return ids;
  }, [filteredProducts, excludedSet]);

  const isAllFilteredSelected =
    allFilteredVariantIds.length > 0 &&
    allFilteredVariantIds.every((id) => selectedVariantIds.includes(id));

  const isSomeFilteredSelected =
    !isAllFilteredSelected &&
    allFilteredVariantIds.some((id) => selectedVariantIds.includes(id));

  // Chọn / Bỏ chọn tất cả sản phẩm đang lọc
  const handleToggleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      const newSelected = Array.from(
        new Set([...selectedVariantIds, ...allFilteredVariantIds]),
      );
      onChange(newSelected);
    } else {
      const filterSet = new Set(allFilteredVariantIds);
      onChange(selectedVariantIds.filter((id) => !filterSet.has(id)));
    }
  };

  // Chọn / Bỏ chọn toàn bộ biến thể của 1 sản phẩm
  const handleToggleProduct = (product: GroupedProduct, checked: boolean) => {
    const productSelectableIds = product.variants
      .filter((v) => !excludedSet.has(v.id))
      .map((v) => v.id);

    if (productSelectableIds.length === 0) return;

    if (checked) {
      const newSelected = Array.from(
        new Set([...selectedVariantIds, ...productSelectableIds]),
      );
      onChange(newSelected);
    } else {
      const productSet = new Set(productSelectableIds);
      onChange(selectedVariantIds.filter((id) => !productSet.has(id)));
    }
  };

  // Chọn / Bỏ chọn 1 biến thể lẻ
  const handleToggleVariant = (variantId: number, checked: boolean) => {
    if (checked) {
      onChange([...selectedVariantIds, variantId]);
    } else {
      onChange(selectedVariantIds.filter((id) => id !== variantId));
    }
  };

  // Toggle Mở rộng / Thu gọn 1 sản phẩm
  const toggleExpand = (productId: number) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Mở rộng tất cả / Thu gọn tất cả
  const toggleExpandAll = () => {
    if (expandedProductIds.size === filteredProducts.length) {
      setExpandedProductIds(new Set());
    } else {
      setExpandedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // Format khoảng giá
  const renderPriceRange = (min: number, max: number) => {
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  // Thống kê số lượng sản phẩm có ít nhất 1 biến thể được chọn
  const selectedProductCount = useMemo(() => {
    const selectedSet = new Set(selectedVariantIds);
    return groupedProducts.filter((p) =>
      p.variants.some((v) => selectedSet.has(v.id)),
    ).length;
  }, [groupedProducts, selectedVariantIds]);

  return (
    <div className="space-y-3.5">
      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm, mã SKU, màu, size..."
            className="pl-9 h-9 text-xs bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[145px] h-9 text-xs bg-background">
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
            <SelectTrigger className="w-[145px] h-9 text-xs bg-background">
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

          <Button
            type="button"
            variant={onlySelected ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlySelected(!onlySelected)}
            className="h-9 px-3 text-xs gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Đã chọn ({selectedVariantIds.length})</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleExpandAll}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            title={
              expandedProductIds.size === filteredProducts.length
                ? "Thu gọn tất cả"
                : "Mở rộng tất cả"
            }
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {expandedProductIds.size === filteredProducts.length
                ? "Thu gọn"
                : "Mở rộng"}
            </span>
          </Button>
        </div>
      </div>

      {/* Bảng dữ liệu gom nhóm theo Sản phẩm */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
        <div className="max-h-[380px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/60 sticky top-0 z-10 border-b border-border backdrop-blur-xs">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[44px] text-center px-3">
                  <IndeterminateCheckbox
                    checked={isAllFilteredSelected}
                    indeterminate={isSomeFilteredSelected}
                    onChange={(e) =>
                      handleToggleSelectAllFiltered(e.target.checked)
                    }
                  />
                </TableHead>
                <TableHead className="w-[32px] p-0"></TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  Sản phẩm & Biến thể
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground w-[120px]">
                  Danh mục
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground w-[110px]">
                  Thương hiệu
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-foreground w-[100px]">
                  Tồn kho
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-foreground w-[180px] pr-4">
                  {hasDiscountConfigured ? "Giá gốc → Sau giảm" : "Giá bán"}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Đang tải danh sách sản phẩm...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const isExpanded = expandedProductIds.has(product.id);
                  const selectableVariants = product.variants.filter(
                    (v) => !excludedSet.has(v.id),
                  );
                  const selectedVariantsInProduct = product.variants.filter(
                    (v) => selectedVariantIds.includes(v.id),
                  );
                  const selectedCount = selectedVariantsInProduct.length;
                  const totalVariantCount = product.variants.length;
                  const isAllProductSelected =
                    selectableVariants.length > 0 &&
                    selectableVariants.every((v) =>
                      selectedVariantIds.includes(v.id),
                    );
                  const isPartiallySelected =
                    selectedCount > 0 && !isAllProductSelected;

                  return (
                    <React.Fragment key={product.id}>
                      {/* Dòng Sản phẩm cha (Group Header Row) */}
                      <TableRow
                        className={`transition-colors border-b border-border/60 select-none ${
                          isExpanded
                            ? "bg-muted/40 font-medium"
                            : "hover:bg-muted/20"
                        } ${
                          selectedCount > 0
                            ? "bg-primary/5 hover:bg-primary/8"
                            : ""
                        }`}
                      >
                        {/* Checkbox chọn nhanh toàn bộ biến thể của sản phẩm */}
                        <TableCell
                          className="text-center px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IndeterminateCheckbox
                            checked={isAllProductSelected}
                            indeterminate={isPartiallySelected}
                            disabled={selectableVariants.length === 0}
                            onChange={(e) =>
                              handleToggleProduct(product, e.target.checked)
                            }
                          />
                        </TableCell>

                        {/* Nút bấm mở rộng / thu gọn */}
                        <TableCell
                          className="p-0 text-center cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() => toggleExpand(product.id)}
                        >
                          <div className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </TableCell>

                        {/* Thông tin sản phẩm */}
                        <TableCell
                          className="cursor-pointer py-2.5"
                          onClick={() => toggleExpand(product.id)}
                        >
                          <div className="flex items-center gap-3">
                            {product.thumbnail ? (
                              <img
                                src={product.thumbnail}
                                alt={product.name}
                                className="w-9 h-9 rounded-lg object-cover border border-border shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                                <Package className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="font-semibold text-xs text-foreground hover:text-primary transition-colors">
                                  {product.name}
                                </span>

                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                                  {totalVariantCount} biến thể
                                </span>

                                {/* Badge trạng thái đã chọn */}
                                {selectedCount > 0 && (
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                      isAllProductSelected
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                        : "bg-primary/10 text-primary border border-primary/20"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>
                                      Đã chọn {selectedCount}/
                                      {totalVariantCount}
                                    </span>
                                  </span>
                                )}

                                {product.hasConflict && (
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    <span>Có SKU đang chạy KM</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Danh mục */}
                        <TableCell className="text-xs text-muted-foreground">
                          {product.categoryName}
                        </TableCell>

                        {/* Thương hiệu */}
                        <TableCell className="text-xs text-muted-foreground">
                          {product.brandName}
                        </TableCell>

                        {/* Tổng tồn kho */}
                        <TableCell className="text-right text-xs font-medium text-foreground tabular-nums">
                          {formatNumber(product.totalStock)}
                        </TableCell>

                        {/* Khoảng giá */}
                        <TableCell className="text-right pr-4">
                          {hasDiscountConfigured ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                                {renderPriceRange(
                                  product.minPrice,
                                  product.maxPrice,
                                )}
                              </span>
                              <span className="font-bold text-xs text-primary tabular-nums">
                                {renderPriceRange(
                                  product.minFinalPrice,
                                  product.maxFinalPrice,
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-xs text-foreground tabular-nums">
                              {renderPriceRange(
                                product.minPrice,
                                product.maxPrice,
                              )}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Danh sách các biến thể con khi Expand */}
                      {isExpanded &&
                        product.variants.map((variant) => {
                          const isExcluded = excludedSet.has(variant.id);
                          const isSelected = selectedVariantIds.includes(
                            variant.id,
                          );
                          const variantSpecs = [variant.size, variant.color]
                            .filter(Boolean)
                            .join(" - ");
                          const conflict = conflictMap.get(variant.id);
                          const originalPrice =
                            Number(variant.sellingPrice) ||
                            Number(variant.listPrice) ||
                            0;
                          const discountAmt = calculateDiscount(originalPrice);
                          const finalPrice = Math.max(
                            0,
                            originalPrice - discountAmt,
                          );

                          return (
                            <TableRow
                              key={`variant-${variant.id}`}
                              className={`bg-muted/15 hover:bg-muted/30 transition-colors border-b border-border/40 select-none ${
                                isExcluded ? "opacity-45 bg-muted/40" : ""
                              } ${isSelected ? "bg-primary/8" : ""}`}
                              onClick={() => {
                                if (!isExcluded) {
                                  handleToggleVariant(variant.id, !isSelected);
                                }
                              }}
                            >
                              {/* Checkbox chọn biến thể con */}
                              <TableCell
                                className="text-center px-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isExcluded}
                                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer align-middle disabled:cursor-not-allowed"
                                  checked={isSelected}
                                  onChange={(e) =>
                                    handleToggleVariant(
                                      variant.id,
                                      e.target.checked,
                                    )
                                  }
                                />
                              </TableCell>

                              {/* Nhánh nối cây phân cấp */}
                              <TableCell className="p-0 text-center">
                                <span className="text-muted-foreground/50 text-xs select-none">
                                  └
                                </span>
                              </TableCell>

                              {/* SKU & Phân loại size/màu */}
                              <TableCell className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <span className="font-mono text-xs text-foreground font-semibold">
                                      {variant.sku}
                                    </span>

                                    {variantSpecs && (
                                      <span className="text-muted-foreground text-[11px] bg-background border border-border/80 px-2 py-0.5 rounded font-medium flex items-center gap-1.5">
                                        {variant.colorHex && (
                                          <span
                                            className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                                            style={{
                                              backgroundColor: variant.colorHex,
                                            }}
                                          />
                                        )}
                                        <span>{variantSpecs}</span>
                                      </span>
                                    )}

                                    {isExcluded && (
                                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">
                                        Đã thuộc nhóm khác
                                      </span>
                                    )}
                                  </div>

                                  {/* Cảnh báo trùng lặp với Campaign khác */}
                                  {conflict && (
                                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded w-fit">
                                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span>
                                        Đang chạy ở:{" "}
                                        <strong>
                                          {conflict.promotionName}
                                        </strong>{" "}
                                        (Ưu tiên {conflict.priority} ·{" "}
                                        {conflict.discountText})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              {/* Danh mục (trống ở dòng con để gọn) */}
                              <TableCell className="text-xs text-muted-foreground">
                                -
                              </TableCell>

                              {/* Thương hiệu */}
                              <TableCell className="text-xs text-muted-foreground">
                                -
                              </TableCell>

                              {/* Tồn kho biến thể */}
                              <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                                {formatNumber(variant.stock || 0)}
                              </TableCell>

                              {/* Giá của biến thể */}
                              <TableCell className="text-right pr-4">
                                {hasDiscountConfigured ? (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                                        {formatCurrency(originalPrice)}
                                      </span>
                                      <span className="font-bold text-xs text-primary tabular-nums">
                                        {formatCurrency(finalPrice)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded mt-0.5 tabular-nums">
                                      {discountType === "PERCENT"
                                        ? `-${discountValue}%`
                                        : `-${formatCurrency(Number(discountValue))}`}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-medium text-foreground text-xs tabular-nums">
                                    {formatCurrency(originalPrice)}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Thanh trạng thái chân bảng */}
        <div className="bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>
              Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm (
              {allFilteredVariantIds.length} biến thể)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasDiscountConfigured && (
              <span>
                Mức giảm nhóm:{" "}
                <strong className="text-primary font-bold">
                  {discountType === "PERCENT"
                    ? `Giảm ${discountValue}%`
                    : `Giảm -${formatCurrency(Number(discountValue))}`}
                </strong>
              </span>
            )}

            <div className="flex items-center gap-1.5 font-medium">
              <span>Đã chọn:</span>
              <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tabular-nums">
                {selectedProductCount} sản phẩm ({selectedVariantIds.length}{" "}
                SKU)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
