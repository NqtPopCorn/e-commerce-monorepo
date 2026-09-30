"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export type StatCardColor =
  "rose" | "indigo" | "emerald" | "amber" | "sky" | "slate";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    neutral?: boolean;
    label?: string;
  };
  color?: StatCardColor;
  className?: string;
  onClick?: () => void;
}

const colorStyles: Record<
  StatCardColor,
  {
    iconBg: string;
    iconText: string;
    borderAccent: string;
  }
> = {
  rose: {
    iconBg: "bg-primary/10 border-primary/20",
    iconText: "text-primary",
    borderAccent: "group-hover:border-primary/40",
  },
  indigo: {
    iconBg: "bg-info/10 border-info/20",
    iconText: "text-info",
    borderAccent: "group-hover:border-info/40",
  },
  emerald: {
    iconBg: "bg-success/10 border-success/20",
    iconText: "text-success",
    borderAccent: "group-hover:border-success/40",
  },
  amber: {
    iconBg: "bg-warning/10 border-warning/20",
    iconText: "text-warning",
    borderAccent: "group-hover:border-warning/40",
  },
  sky: {
    iconBg: "bg-info/10 border-info/20",
    iconText: "text-info",
    borderAccent: "group-hover:border-info/40",
  },
  slate: {
    iconBg: "bg-muted border-border",
    iconText: "text-muted-foreground",
    borderAccent: "group-hover:border-border",
  },
};

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "rose",
  className = "",
  onClick,
}: AdminStatCardProps) {
  const styles = colorStyles[color] || colorStyles.rose;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-card border border-border rounded-xl p-5 shadow-xs transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${
        styles.borderAccent
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {value}
            </h3>
          </div>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              {trend && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
                    trend.neutral
                      ? "bg-muted text-muted-foreground border-border"
                      : trend.isPositive
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {trend.neutral ? (
                    <Minus className="w-3 h-3" />
                  ) : trend.isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  <span>{trend.value}</span>
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${styles.iconBg}`}
        >
          <Icon className={`w-5 h-5 ${styles.iconText}`} />
        </div>
      </div>
    </div>
  );
}
