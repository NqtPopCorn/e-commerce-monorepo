"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface TableParamsDefaults {
  page?: number;
  pageSize?: number;
}

export function useTableParams(
  defaults: TableParamsDefaults = { page: 1, pageSize: 10 },
) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const params = {
    page: Number(sp.get("page") ?? defaults.page ?? 1),
    pageSize: Number(sp.get("pageSize") ?? defaults.pageSize ?? 10),
    q: sp.get("q") ?? "",
    sort: sp.get("sort") ?? "",
    status: sp.get("status") ?? "",
    categoryId: sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined,
    brandId: sp.get("brandId") ? Number(sp.get("brandId")) : undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
  };

  const setParams = useCallback(
    (next: Record<string, string | number | undefined | null>) => {
      const usp = new URLSearchParams(sp.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") {
          usp.delete(k);
        } else {
          usp.set(k, String(v));
        }
      });
      // Nếu thay đổi bộ lọc mà không chỉ định rõ trang, tự động về trang 1
      if (!("page" in next)) {
        usp.set("page", "1");
      }
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    },
    [sp, router, pathname],
  );

  return { params, setParams, searchParams: sp };
}
