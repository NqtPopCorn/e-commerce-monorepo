"use client";

import React from "react";
import { AdminPagination } from "./AdminPagination";
import { AdminTableSkeleton } from "./AdminLoadingSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminErrorState } from "./AdminErrorState";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  pageSizeOptions?: number[];
}

interface AdminDataTableProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  skeletonRows?: number;
  skeletonCols?: number;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pagination?: PaginationProps;
  className?: string;
}

export function AdminDataTable({
  children,
  isLoading = false,
  isError = false,
  errorTitle,
  errorDescription,
  onRetry,
  skeletonRows = 6,
  skeletonCols = 5,
  isEmpty = false,
  emptyTitle = "Không tìm thấy dữ liệu",
  emptyDescription = "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.",
  emptyAction,
  pagination,
  className = "",
}: AdminDataTableProps) {
  if (isError) {
    return (
      <div className={`p-2 ${className}`}>
        <AdminErrorState
          title={errorTitle}
          description={errorDescription}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (isLoading) {
    return <AdminTableSkeleton rows={skeletonRows} cols={skeletonCols} />;
  }

  return (
    <div
      className={`bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col ${className}`}
    >
      <div className="overflow-x-auto admin-scrollbar">
        {isEmpty ? (
          <div className="p-8">
            <AdminEmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          </div>
        ) : (
          children
        )}
      </div>

      {pagination && !isEmpty && (
        <AdminPagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
          pageSizeOptions={pagination.pageSizeOptions}
        />
      )}
    </div>
  );
}
