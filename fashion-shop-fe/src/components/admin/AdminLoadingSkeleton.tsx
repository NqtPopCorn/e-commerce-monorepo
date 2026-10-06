"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableRowSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className="h-4 w-full max-w-[80%]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminTableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="h-11 bg-muted/50 border-b border-border flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3.5"
            style={{ width: `${Math.floor(100 / cols)}%` }}
          />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-14 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-4"
                style={{ width: `${Math.floor(80 / cols)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats skeleton */}
      <AdminStatSkeleton count={3} />

      {/* Table skeleton */}
      <AdminTableSkeleton rows={6} cols={5} />
    </div>
  );
}
