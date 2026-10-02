"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesTimelinePoint } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";

interface SalesPerformanceChartProps {
  data?: SalesTimelinePoint[];
  isLoading?: boolean;
  hasComparison?: boolean;
  onPointClick?: (point: SalesTimelinePoint) => void;
}

type MetricMode = "revenue" | "orders" | "units";

export function SalesPerformanceChart({
  data = [],
  isLoading = false,
  hasComparison = true,
  onPointClick,
}: SalesPerformanceChartProps) {
  const [metric, setMetric] = useState<MetricMode>("revenue");

  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-none rounded-xl">
        <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-44 rounded-md" />
        </CardHeader>
        <CardContent className="p-5">
          <Skeleton className="h-[340px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Cấu hình metric đang chọn
  const getMetricKey = () => {
    switch (metric) {
      case "revenue":
        return { current: "revenue", prev: "prevRevenue", label: "Doanh thu" };
      case "orders":
        return { current: "orders", prev: "prevOrders", label: "Đơn hàng" };
      case "units":
        return { current: "units", prev: "prevUnits", label: "Sản phẩm bán" };
    }
  };

  const currentConfig = getMetricKey();

  const formatYAxis = (val: number) => {
    if (metric === "revenue") {
      if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
      return String(val);
    }
    return formatNumber(val);
  };

  const formatTooltipValue = (val: number) => {
    if (metric === "revenue") return formatCurrency(val);
    return `${formatNumber(val)} ${metric === "orders" ? "đơn" : "sp"}`;
  };

  return (
    <Card className="bg-card border border-border shadow-none rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="p-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Hiệu Suất Bán Hàng (Sales Performance)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Biểu đồ diễn biến theo thời gian và đối soát với chu kỳ trước
          </p>
        </div>

        {/* Tab chuyển đổi chỉ số */}
        <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric("revenue")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              metric === "revenue"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Doanh thu
          </button>
          <button
            type="button"
            onClick={() => setMetric("orders")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              metric === "orders"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đơn hàng
          </button>
          <button
            type="button"
            onClick={() => setMetric("units")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              metric === "units"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sản phẩm
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
        {data.length === 0 ? (
          <div className="h-[340px] flex flex-col items-center justify-center text-sm text-muted-foreground">
            <p>Không có dữ liệu bán hàng trong khoảng thời gian đã chọn</p>
          </div>
        ) : (
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onPointClick?.(e.activePayload[0].payload as SalesTimelinePoint);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorCurrentMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(val: string) => {
                    // "2026-09-15" -> "15/09"
                    const parts = val.split("-");
                    return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={formatYAxis}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const currentVal = Number(payload[0]?.value || 0);
                      const prevVal = Number(payload[1]?.value || 0);
                      const delta =
                        prevVal > 0
                          ? (((currentVal - prevVal) / prevVal) * 100).toFixed(1)
                          : null;

                      return (
                        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-xs space-y-1.5 min-w-[170px]">
                          <div className="font-semibold text-popover-foreground border-b border-border/60 pb-1">
                            Ngày: {label}
                          </div>
                          <div className="flex justify-between items-center text-foreground">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              Kỳ này:
                            </span>
                            <span className="font-bold">
                              {formatTooltipValue(currentVal)}
                            </span>
                          </div>

                          {hasComparison && payload[1] && (
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 border border-dashed border-muted-foreground" />
                                Kỳ trước:
                              </span>
                              <span>{formatTooltipValue(prevVal)}</span>
                            </div>
                          )}

                          {hasComparison && delta !== null && (
                            <div className="text-[11px] pt-1 border-t border-border/40 text-right">
                              <span
                                className={`font-semibold ${
                                  Number(delta) >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {Number(delta) >= 0 ? `+${delta}%` : `${delta}%`} vs kỳ trước
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Đường biểu diễn chu kỳ trước (nét đứt) */}
                {hasComparison && (
                  <Line
                    type="monotone"
                    dataKey={currentConfig.prev}
                    name="Kỳ trước"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}

                {/* Đường và vùng diện tích chu kỳ hiện tại (nét liền) */}
                <Area
                  type="monotone"
                  dataKey={currentConfig.current}
                  name="Kỳ này"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCurrentMetric)"
                  dot={{ r: 2, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  height={25}
                  iconSize={10}
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
