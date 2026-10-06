import { useState, useMemo, useCallback } from "react";
import { sortData, SortOrder, CustomGetters } from "@/lib/sort";

export interface UseSortableTableOptions<T> {
  defaultField?: string;
  defaultOrder?: SortOrder;
  customGetters?: CustomGetters<T>;
}

export function useSortableTable<T>(
  items: T[],
  options: UseSortableTableOptions<T> = {},
) {
  const [sortField, setSortField] = useState<string | null>(
    options.defaultField ?? null,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    options.defaultOrder ?? "asc",
  );

  const handleSort = useCallback(
    (field: string, preferredDefaultOrder: SortOrder = "asc") => {
      if (sortField !== field) {
        setSortField(field);
        setSortOrder(preferredDefaultOrder);
      } else if (sortOrder === preferredDefaultOrder) {
        setSortOrder(preferredDefaultOrder === "asc" ? "desc" : "asc");
      } else {
        // Reset to original data order
        setSortField(null);
        setSortOrder("asc");
      }
    },
    [sortField, sortOrder],
  );

  const resetSort = useCallback(() => {
    setSortField(options.defaultField ?? null);
    setSortOrder(options.defaultOrder ?? "asc");
  }, [options.defaultField, options.defaultOrder]);

  const sortedItems = useMemo(() => {
    return sortData(items, sortField, sortOrder, options.customGetters);
  }, [items, sortField, sortOrder, options.customGetters]);

  return {
    sortedItems,
    sortField,
    sortOrder,
    handleSort,
    resetSort,
  };
}
