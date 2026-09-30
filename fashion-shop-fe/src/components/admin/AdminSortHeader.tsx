"use client";

import React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortOrder } from "@/lib/sort";

export interface AdminSortHeaderProps {
  title?: string;
  children?: React.ReactNode;
  field: string;
  currentField: string | null;
  currentOrder: SortOrder;
  onSort: (field: string, preferredDefaultOrder?: SortOrder) => void;
  defaultOrder?: SortOrder;
  align?: "left" | "center" | "right";
  className?: string;
}

export function AdminSortHeader({
  title,
  children,
  field,
  currentField,
  currentOrder,
  onSort,
  defaultOrder = "asc",
  align = "left",
  className,
}: AdminSortHeaderProps) {
  const isActive = currentField === field;

  const ariaSort = isActive
    ? currentOrder === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const alignClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right ml-auto",
  }[align];

  return (
    <button
      type="button"
      onClick={() => onSort(field, defaultOrder)}
      aria-sort={ariaSort}
      className={cn(
        "group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors select-none",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm py-0.5",
        isActive
          ? "text-foreground font-bold"
          : "text-muted-foreground hover:text-foreground",
        alignClasses,
        className,
      )}
    >
      <span>{children ?? title}</span>
      <span className="shrink-0 inline-flex items-center">
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
          )
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 transition-opacity" />
        )}
      </span>
    </button>
  );
}
