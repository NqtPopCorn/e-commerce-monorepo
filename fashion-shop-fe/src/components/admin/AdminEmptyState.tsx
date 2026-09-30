"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

interface AdminEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className = "",
}: AdminEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-card border border-border ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
