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
import { Search } from "lucide-react";

interface ProductSelectionTableProps {
  selectedVariantIds: number[];
  excludedVariantIds?: number[];
  onChange: (ids: number[]) => void;
}

export function ProductSelectionTable({
  selectedVariantIds,
  excludedVariantIds = [],
  onChange,
}: ProductSelectionTableProps) {
  const { data: products, isLoading } = useGetProducts();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");

  const excludedSet = useMemo(() => new Set(excludedVariantIds), [excludedVariantIds]);

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
        new Set([...selectedVariantIds, ...selectableIds])
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

  return (
    <div className="space-y-4">
      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[160px]">
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
      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <div className="max-h-[350px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer align-middle"
                    checked={allFilteredSelected}
                    onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="w-[120px]">SKU</TableHead>
                <TableHead>Sản phẩm & Biến thể</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Đang tải dữ liệu sản phẩm...
                  </TableCell>
                </TableRow>
              ) : filteredVariants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy sản phẩm nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariants.map((variant) => {
                  const isExcluded = excludedSet.has(variant.id);
                  const isSelected = selectedVariantIds.includes(variant.id);
                  const variantSpecs = [variant.size, variant.color].filter(Boolean).join(" - ");

                  return (
                    <TableRow
                      key={variant.id}
                      className={`hover:bg-slate-50 cursor-pointer select-none ${
                        isExcluded ? "opacity-40 bg-slate-50" : ""
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
                      <TableCell className="font-mono text-xs">
                        {variant.sku}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{variant.productName}</span>
                        {variantSpecs && (
                          <span className="text-muted-foreground ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {variantSpecs}
                          </span>
                        )}
                        {isExcluded && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">
                            (Đã chọn ở nhóm khác)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{variant.categoryName}</TableCell>
                      <TableCell className="text-sm text-slate-600">{variant.brandName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(variant.sellingPrice).toLocaleString()}đ
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-slate-50 p-2 text-sm text-muted-foreground border-t flex justify-between">
          <span>Đang hiển thị {filteredVariants.length} kết quả</span>
          <span>
            Đã chọn{" "}
            <span className="font-semibold text-rose-600">
              {selectedVariantIds.length}
            </span>{" "}
            biến thể
          </span>
        </div>
      </div>
    </div>
  );
}
