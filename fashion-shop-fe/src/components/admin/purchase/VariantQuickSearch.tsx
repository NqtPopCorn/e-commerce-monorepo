"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Package, Check } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/format";

export interface FlatVariantItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  sellingPrice: number;
  imageUrl?: string;
  categoryName?: string;
}

interface VariantQuickSearchProps {
  products?: Product[];
  selectedVariantIds: number[];
  onSelectVariant: (variant: FlatVariantItem) => void;
  disabled?: boolean;
}

export function VariantQuickSearch({
  products = [],
  selectedVariantIds = [],
  onSelectVariant,
  disabled = false,
}: VariantQuickSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Flatten all variants from products
  const flatVariants = useMemo<FlatVariantItem[]>(() => {
    if (!products || products.length === 0) return [];
    const list: FlatVariantItem[] = [];

    products.forEach((prod) => {
      const prodName = prod.name || prod.title || "Sản phẩm";
      const catName = prod.category?.name || "";
      const defaultImg = prod.images?.[0]?.url;

      prod.variants?.forEach((v) => {
        if (v.id) {
          list.push({
            id: v.id,
            productId: prod.id,
            productName: prodName,
            sku: v.sku || `SKU-${v.id}`,
            size: v.size || undefined,
            color: v.color || undefined,
            stock: v.stock ?? 0,
            sellingPrice: Number(v.sellingPrice || 0),
            imageUrl: v.imageUrl || defaultImg,
            categoryName: catName,
          });
        }
      });
    });

    return list;
  }, [products]);

  // Filter based on search query
  const filteredVariants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Khi chưa gõ gì thì hiển thị 8 sản phẩm đầu tiên làm gợi ý
      return flatVariants.slice(0, 8);
    }

    return flatVariants
      .filter((item) => {
        const matchName = item.productName.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchColor = item.color?.toLowerCase().includes(q) || false;
        const matchSize = item.size?.toLowerCase().includes(q) || false;
        const matchCat = item.categoryName?.toLowerCase().includes(q) || false;
        return matchName || matchSku || matchColor || matchSize || matchCat;
      })
      .slice(0, 15); // Tối đa 15 kết quả để cuộn mượt
  }, [flatVariants, query]);

  // Reset highlight index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredVariants]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (variant: FlatVariantItem) => {
    onSelectVariant(variant);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredVariants.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredVariants.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredVariants[highlightedIndex]) {
        handleSelect(filteredVariants[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Quét mã SKU hoặc gõ tên sản phẩm, size, màu để thêm nhanh..."
          aria-label="Tìm kiếm biến thể nhập kho"
          className="w-full h-11 pl-10 pr-9 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Popover Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 max-h-[340px] flex flex-col">
          <div className="p-2 border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground flex justify-between items-center">
            <span>
              {query
                ? `Kết quả tìm kiếm (${filteredVariants.length})`
                : "Gợi ý sản phẩm gần đây"}
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Dùng phím ↑ ↓ để di chuyển, Enter để chọn
            </span>
          </div>

          <div className="overflow-y-auto admin-scrollbar divide-y divide-border/60">
            {filteredVariants.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <Package className="w-6 h-6 text-muted-foreground/60" />
                <span>
                  Không tìm thấy biến thể nào khớp với từ khóa "{query}"
                </span>
              </div>
            ) : (
              filteredVariants.map((item, index) => {
                const isSelected = selectedVariantIds.includes(item.id);
                const isHighlighted = index === highlightedIndex;
                const optionTag = [item.size, item.color]
                  .filter(Boolean)
                  .join(" - ");

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(item)}
                    className={`p-2.5 px-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isHighlighted ? "bg-muted" : "hover:bg-muted/50"
                    } ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    {/* Left: Image & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.productName}
                          </p>
                          {optionTag && (
                            <span className="text-[10px] font-medium bg-muted text-muted-foreground border border-border px-1.5 py-0.2 rounded shrink-0">
                              {optionTag}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span className="font-mono text-xs text-foreground/80">
                            SKU: {item.sku}
                          </span>
                          <span>•</span>
                          <span
                            className={`font-medium ${
                              item.stock === 0
                                ? "text-destructive font-semibold"
                                : item.stock < 10
                                  ? "text-warning font-semibold"
                                  : "text-muted-foreground"
                            }`}
                          >
                            Tồn kho: {item.stock} chiếc
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Status */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground tabular-nums">
                        {formatCurrency(item.sellingPrice)}
                      </p>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                          <Check className="w-3 h-3" /> Đã có trong phiếu (+1)
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary">
                          Nhấn để thêm ↵
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
