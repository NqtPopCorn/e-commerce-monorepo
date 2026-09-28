"use client";

import React from "react";

export function AdminStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="w-10 h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-7 bg-slate-200 rounded w-28" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      ))}
    </div>
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
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs animate-pulse">
      {/* Table Header */}
      <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-200 rounded"
            style={{ width: `${Math.floor(100 / cols)}%` }}
          />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-16 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-slate-100 rounded"
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
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-32" />
        <div className="h-8 bg-slate-200 rounded w-48" />
      </div>

      {/* Stats skeleton */}
      <AdminStatSkeleton count={4} />

      {/* Table skeleton */}
      <AdminTableSkeleton rows={6} cols={5} />
    </div>
  );
}
