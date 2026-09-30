"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function AdminErrorState({
  title = "Không thể tải dữ liệu",
  description = "Đã xảy ra lỗi trong quá trình kết nối với máy chủ. Vui lòng kiểm tra đường truyền và thử lại.",
  onRetry,
  className = "",
}: AdminErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-card border border-destructive/20 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-1.5 border-border hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}
    </div>
  );
}
