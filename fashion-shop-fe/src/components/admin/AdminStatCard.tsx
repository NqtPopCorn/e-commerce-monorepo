"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export type StatCardColor = "rose" | "indigo" | "emerald" | "amber" | "sky" | "slate";

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
    iconBg: "bg-rose-50 border-rose-100",
    iconText: "text-rose-600",
    borderAccent: "group-hover:border-rose-200",
  },
  indigo: {
    iconBg: "bg-indigo-50 border-indigo-100",
    iconText: "text-indigo-600",
    borderAccent: "group-hover:border-indigo-200",
  },
  emerald: {
    iconBg: "bg-emerald-50 border-emerald-100",
    iconText: "text-emerald-600",
    borderAccent: "group-hover:border-emerald-200",
  },
  amber: {
    iconBg: "bg-amber-50 border-amber-100",
    iconText: "text-amber-600",
    borderAccent: "group-hover:border-amber-200",
  },
  sky: {
    iconBg: "bg-sky-50 border-sky-100",
    iconText: "text-sky-600",
    borderAccent: "group-hover:border-sky-200",
  },
  slate: {
    iconBg: "bg-slate-100 border-slate-200",
    iconText: "text-slate-700",
    borderAccent: "group-hover:border-slate-300",
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
      className={`group relative bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${
        styles.borderAccent
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {value}
            </h3>
          </div>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              {trend && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                    trend.neutral
                      ? "bg-slate-100 text-slate-600"
                      : trend.isPositive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {trend.neutral ? (
                    <Minus className="w-3 h-3" />
                  ) : trend.isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {trend.value}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-500 truncate">
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
