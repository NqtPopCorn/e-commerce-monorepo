"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface AdminPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function AdminPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50],
  className = "",
}: AdminPaginationProps) {
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push("...");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 bg-card border-t border-border text-xs text-muted-foreground ${className}`}
    >
      {/* Items count & page size */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="font-medium">
          Hiển thị{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {startItem}
          </span>{" "}
          -{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {endItem}
          </span>{" "}
          trên{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {total}
          </span>{" "}
          mục
        </p>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-muted-foreground">/ trang:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Số dòng trên mỗi trang"
              className="h-7 px-2 bg-background border border-border rounded-md text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang đầu"
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang trước"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Number buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-muted-foreground text-xs"
                >
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(Number(p))}
                aria-current={isCurrent ? "page" : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "border border-border text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang tiếp"
          aria-label="Trang tiếp"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang cuối"
          aria-label="Trang cuối"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
