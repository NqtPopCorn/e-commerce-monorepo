"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetRevenueStats } from "@/hooks/useStatistics";
import { formatCurrency } from "@/lib/format";

export function RevenueChart() {
  const [filter, setFilter] = useState("month");
  const { data: dataByMonth, isLoading, isError } = useGetRevenueStats();

  if (isLoading || !dataByMonth) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full mt-4 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardContent className="h-[350px] flex items-center justify-center text-sm text-muted-foreground">
          Không thể tải dữ liệu biểu đồ doanh thu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Doanh thu & Lợi nhuận</CardTitle>
            <CardDescription>
              Thống kê theo các tháng trong năm nay
            </CardDescription>
          </div>
          <select
            className="border border-input bg-background text-foreground rounded-lg text-xs p-1.5 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Lọc biểu đồ theo khoảng thời gian"
          >
            <option value="month">Theo tháng trong năm</option>
            <option value="year">Theo các năm</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dataByMonth}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: any) => [
                  formatCurrency(Number(value || 0)),
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Lợi nhuận"
                stroke="hsl(var(--success))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--success))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
