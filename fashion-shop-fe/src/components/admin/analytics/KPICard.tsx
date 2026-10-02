"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparklinePoint } from "@/types/analytics";

interface KPICardProps {
  title: string;
  value: string;
  deltaPercent: number;
  isPositive: boolean;
  sparkline: SparklinePoint[];
  subtitle?: string;
  hasComparison?: boolean;
}

export function KPICard({
  title,
  value,
  deltaPercent,
  isPositive,
  sparkline = [],
  subtitle = "vs kỳ trước",
  hasComparison = true,
}: KPICardProps) {
  // Sinh đường dẫn SVG cho sparkline
  const renderSparklineSvg = () => {
    if (!sparkline || sparkline.length < 2) {
      return (
        <div className="h-9 w-full flex items-center justify-center text-[11px] text-muted-foreground/60 italic">
          Chưa đủ dữ liệu biểu đồ
        </div>
      );
    }

    const width = 200;
    const height = 40;
    const padding = 3;

    const values = sparkline.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((val, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y =
        height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(" L ")}`;
    const strokeColor =
      deltaPercent > 0
        ? "var(--success, #16a34a)"
        : deltaPercent < 0
          ? "var(--destructive, #dc2626)"
          : "var(--muted-foreground, #64748b)";

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-9 overflow-visible"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <Card className="bg-card border border-border shadow-none rounded-xl">
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {value}
          </div>

          {hasComparison && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                  deltaPercent > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : deltaPercent < 0
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {deltaPercent > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : deltaPercent < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>
                  {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-2 border-t border-border/40">
          {renderSparklineSvg()}
        </div>
      </CardContent>
    </Card>
  );
}
