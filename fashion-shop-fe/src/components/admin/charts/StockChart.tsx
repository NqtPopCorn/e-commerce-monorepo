"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useGetStockStats } from "@/hooks/useStatistics";

const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export function StockChart() {
  const { data: stockData, isLoading } = useGetStockStats();

  if (isLoading || !stockData) return <div>Đang tải biểu đồ tồn kho...</div>;
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cơ cấu tồn kho</CardTitle>
        <CardDescription>Số lượng tồn kho theo danh mục</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stockData}
              margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#eee"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #eaeaea",
                }}
              />
              <Bar dataKey="stock" name="Số lượng" radius={[4, 4, 0, 0]}>
                {stockData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
