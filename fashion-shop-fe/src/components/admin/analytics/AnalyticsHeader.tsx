"use client";

import React from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  isFetching?: boolean;
}

export function AnalyticsHeader({
  onRefresh,
  onExport,
  isFetching = false,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-border/60">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Phân Tích Kinh Doanh
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tổng quan hiệu suất bán hàng, chi phí khuyến mãi và sức khỏe vận hành
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-9 gap-1.5 text-xs font-medium border-border hover:bg-muted/50"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Xuất dữ liệu</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-9 gap-1.5 text-xs font-medium border-border hover:bg-muted/50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground ${
              isFetching ? "animate-spin text-primary" : ""
            }`}
          />
          <span>{isFetching ? "Đang cập nhật..." : "Làm mới"}</span>
        </Button>
      </div>
    </div>
  );
}
