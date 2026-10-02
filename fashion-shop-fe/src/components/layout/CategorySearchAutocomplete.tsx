"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderTree,
  Folder,
  Tag,
  ChevronRight,
  X,
  CornerDownLeft,
  Sparkles,
} from "lucide-react";
import { Category } from "@/types/product";

interface FlatCategoryItem {
  id: number;
  name: string;
  slug?: string;
  isRoot: boolean;
  parentName?: string | null;
  parentId?: number | null;
  path: string;
  productCount: number;
}

interface CategorySearchAutocompleteProps {
  categories: Category[];
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
  onSearchSubmit?: () => void;
}

/**
 * Helper tách chuỗi để highlight từ khóa tìm kiếm
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(normalizedQuery);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + normalizedQuery.length);
  const after = text.slice(index + normalizedQuery.length);

  return (
    <span>
      {before}
      <span className="font-bold text-rose-600 underline decoration-rose-400 decoration-1 underline-offset-2">
        {match}
      </span>
      {after}
    </span>
  );
}

export default function CategorySearchAutocomplete({
  categories,
  placeholder = "Tìm kiếm áo thun, sơ mi, quần jeans, váy...",
  className = "",
  isMobile = false,
  onSearchSubmit,
}: CategorySearchAutocompleteProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đóng dropdown khi click bên ngoài
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

  // Làm phẳng cây danh mục (2 cấp) để tìm kiếm nhanh
  const flatCategories = useMemo<FlatCategoryItem[]>(() => {
    const items: FlatCategoryItem[] = [];

    for (const root of categories) {
      const rootChildren = root.children || [];
      const rootProductCount = rootChildren.reduce(
        (sum, child) => sum + (child._count?.products || 0),
        0,
      );

      // Thêm danh mục gốc
      items.push({
        id: root.id,
        name: root.name,
        isRoot: true,
        parentName: null,
        parentId: null,
        path: root.name,
        productCount: rootProductCount,
      });

      // Thêm các danh mục con (lá)
      for (const child of rootChildren) {
        items.push({
          id: child.id,
          name: child.name,
          isRoot: false,
          parentName: root.name,
          parentId: root.id,
          path: `${root.name} > ${child.name}`,
          productCount: child._count?.products || 0,
        });
      }
    }

    return items;
  }, [categories]);

  // Lọc kết quả danh mục theo từ khóa
  const matchedCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      // Khi chưa gõ từ khóa: gợi ý danh mục con phổ biến hoặc danh mục nổi bật (tối đa 6)
      const popularChildren = flatCategories
        .filter((c) => !c.isRoot)
        .slice(0, 6);
      if (popularChildren.length > 0) return popularChildren;
      return flatCategories.slice(0, 6);
    }

    // Khi có từ khóa: tìm kiếm theo tên hoặc tên cha
    return flatCategories
      .filter((cat) => {
        const nameMatches = cat.name.toLowerCase().includes(q);
        const parentMatches =
          cat.parentName?.toLowerCase().includes(q) ?? false;
        return nameMatches || parentMatches;
      })
      .sort((a, b) => {
        // Ưu tiên khớp chính xác hoặc bắt đầu bằng từ khóa
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Ưu tiên danh mục con (nút lá) trước danh mục gốc
        if (!a.isRoot && b.isRoot) return -1;
        if (a.isRoot && !b.isRoot) return 1;

        return 0;
      })
      .slice(0, 7);
  }, [flatCategories, searchTerm]);

  // Tổng số mục có thể chọn bằng phím điều hướng:
  // Nếu có searchTerm: item 0 là "Tìm kiếm chung cho '[searchTerm]'", các item sau là danh mục.
  // Nếu searchTerm rỗng: chỉ gồm các danh mục gợi ý.
  const hasKeywordSearchItem = searchTerm.trim().length > 0;
  const totalOptions =
    matchedCategories.length + (hasKeywordSearchItem ? 1 : 0);

  const handleSelectCategory = (cat: FlatCategoryItem) => {
    setIsOpen(false);
    onSearchSubmit?.();
    router.push(`/products?category=${encodeURIComponent(cat.name)}`);
  };

  const handleExecuteKeywordSearch = (queryText: string) => {
    const q = queryText.trim();
    if (q) {
      setIsOpen(false);
      onSearchSubmit?.();
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Nếu đang điều hướng bàn phím tới một item cụ thể
    if (selectedIndex >= 0) {
      if (hasKeywordSearchItem) {
        if (selectedIndex === 0) {
          handleExecuteKeywordSearch(searchTerm);
          return;
        } else {
          const cat = matchedCategories[selectedIndex - 1];
          if (cat) {
            handleSelectCategory(cat);
            return;
          }
        }
      } else {
        const cat = matchedCategories[selectedIndex];
        if (cat) {
          handleSelectCategory(cat);
          return;
        }
      }
    }

    // Mặc định: tìm kiếm sản phẩm theo từ khóa
    handleExecuteKeywordSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Search Form */}
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-full py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-xs bg-white ${
            isMobile ? "px-4 pr-16" : "px-5 pr-20"
          }`}
          autoComplete="off"
        />

        {/* Nút xóa nhanh (khi có text) */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100 ${
              isMobile ? "right-11" : "right-14"
            }`}
            title="Xóa tìm kiếm"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Nút Submit Tìm kiếm */}
        <button
          type="submit"
          className="absolute right-1 top-1 bottom-1 px-4 bg-rose-600 text-white rounded-full hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center shadow-xs"
          title="Tìm kiếm"
          aria-label="Tìm kiếm"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200/90 shadow-2xl rounded-2xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md">
          {/* 1. Header của Popup */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/90 border-b border-gray-100 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-1.5">
              {searchTerm.trim() ? (
                <>
                  <FolderTree className="w-3.5 h-3.5 text-rose-600" />
                  <span>Gợi ý danh mục phù hợp</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Danh mục phổ biến gợi ý cho bạn</span>
                </>
              )}
            </div>
            {searchTerm.trim() && (
              <span className="text-[11px] font-normal text-gray-400">
                {matchedCategories.length} danh mục
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {/* 2. Dòng Tìm kiếm từ khóa chung (khi người dùng gõ từ khóa) */}
            {hasKeywordSearchItem && (
              <div
                onClick={() => handleExecuteKeywordSearch(searchTerm)}
                onMouseEnter={() => setSelectedIndex(0)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between gap-3 text-sm transition-colors ${
                  selectedIndex === 0
                    ? "bg-rose-50 text-rose-700"
                    : "hover:bg-gray-50/80 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedIndex === 0
                        ? "bg-rose-600 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs text-gray-500 block">
                      Tìm tất cả sản phẩm chứa:
                    </span>
                    <span className="font-semibold text-rose-600">
                      &quot;{searchTerm.trim()}&quot;
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                  <span>Nhấn</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-[10px] text-gray-600">
                    Enter ↵
                  </kbd>
                </div>
              </div>
            )}

            {/* 3. Danh sách Danh mục khớp từ khóa */}
            {matchedCategories.length === 0 ? (
              <div className="p-5 text-center text-xs text-gray-400">
                <Folder className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
                <p>
                  Không tìm thấy danh mục nào trùng với &quot;{searchTerm}&quot;
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Nhấn Enter để tìm kiếm từ khóa trong toàn bộ tên sản phẩm
                </p>
              </div>
            ) : (
              matchedCategories.map((cat, idx) => {
                const itemIndex = hasKeywordSearchItem ? idx + 1 : idx;
                const isSelected = selectedIndex === itemIndex;

                return (
                  <div
                    key={`${cat.isRoot ? "root" : "child"}-${cat.id}`}
                    onClick={() => handleSelectCategory(cat)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`px-4 py-2.5 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors ${
                      isSelected
                        ? "bg-rose-50/80 text-rose-900"
                        : "hover:bg-gray-50/80 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-rose-100 text-rose-600"
                            : cat.isRoot
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cat.isRoot ? (
                          <FolderTree className="w-3.5 h-3.5" />
                        ) : (
                          <Tag className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">
                            <HighlightText text={cat.name} query={searchTerm} />
                          </span>

                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md ${
                              cat.isRoot
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cat.isRoot ? "Gốc" : "Danh mục"}
                          </span>
                        </div>

                        {!cat.isRoot && cat.parentName && (
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <span>{cat.parentName}</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-gray-600 font-medium">
                              {cat.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cat.productCount > 0 && (
                        <span className="text-[11px] tabular-nums text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {cat.productCount} sp
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected
                            ? "text-rose-600 translate-x-0.5"
                            : "text-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Footer hướng dẫn bàn phím */}
          <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-white border border-gray-200 text-[10px] font-mono">
                  ↑
                </kbd>
                <kbd className="px-1 py-0.2 rounded bg-white border border-gray-200 text-[10px] font-mono">
                  ↓
                </kbd>
                <span>di chuyển</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 rounded bg-white border border-gray-200 text-[10px] font-mono">
                  Enter
                </kbd>
                <span>chọn</span>
              </span>
            </div>
            <span>Nhấn Esc để đóng</span>
          </div>
        </div>
      )}
    </div>
  );
}
