"use client";

import React from "react";
import { X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGetCategories } from "@/hooks/useCategories";
import { useGetBrands } from "@/hooks/useBrands";
import { useGetCampaigns } from "@/hooks/useCampaigns";

interface AnalyticsFiltersProps {
  categoryId?: number;
  brandId?: number;
  campaignId?: number;
  onFilterChange: (key: "categoryId" | "brandId" | "campaignId", value?: number) => void;
  onResetFilters: () => void;
}

export function AnalyticsFilters({
  categoryId,
  brandId,
  campaignId,
  onFilterChange,
  onResetFilters,
}: AnalyticsFiltersProps) {
  const { data: categories = [] } = useGetCategories();
  const { data: brands = [] } = useGetBrands();
  const { data: campaignsData } = useGetCampaigns();

  const campaignList = Array.isArray(campaignsData)
    ? campaignsData
    : campaignsData?.data || [];

  const hasActiveFilters = !!categoryId || !!brandId || !!campaignId;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span className="font-medium">Lọc:</span>
      </div>

      {/* Category Filter */}
      <div className="w-[160px]">
        <Select
          value={categoryId ? String(categoryId) : "all"}
          onValueChange={(val) =>
            onFilterChange("categoryId", val === "all" ? undefined : Number(val))
          }
        >
          <SelectTrigger className="h-9 text-xs bg-background border-border">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Tất cả danh mục
            </SelectItem>
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand Filter */}
      <div className="w-[160px]">
        <Select
          value={brandId ? String(brandId) : "all"}
          onValueChange={(val) =>
            onFilterChange("brandId", val === "all" ? undefined : Number(val))
          }
        >
          <SelectTrigger className="h-9 text-xs bg-background border-border">
            <SelectValue placeholder="Tất cả thương hiệu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Tất cả thương hiệu
            </SelectItem>
            {brands.map((b: any) => (
              <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Filter */}
      <div className="w-[180px]">
        <Select
          value={campaignId ? String(campaignId) : "all"}
          onValueChange={(val) =>
            onFilterChange("campaignId", val === "all" ? undefined : Number(val))
          }
        >
          <SelectTrigger className="h-9 text-xs bg-background border-border truncate">
            <SelectValue placeholder="Tất cả chiến dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Tất cả chiến dịch
            </SelectItem>
            {campaignList.map((camp: any) => (
              <SelectItem key={camp.id} value={String(camp.id)} className="text-xs">
                {camp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          <span>Xóa lọc</span>
        </Button>
      )}
    </div>
  );
}
