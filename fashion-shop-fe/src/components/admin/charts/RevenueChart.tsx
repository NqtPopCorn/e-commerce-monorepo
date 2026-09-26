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
import { useGetRevenueStats } from "@/hooks/useStatistics";

export function RevenueChart() {
  const [filter, setFilter] = useState("month");
  const { data: dataByMonth, isLoading } = useGetRevenueStats();

  if (isLoading || !dataByMonth)
    return <div>Đang tải biểu đồ doanh thu...</div>;

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
            className="border border-gray-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
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
                stroke="#eee"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `${Number(value || 0).toLocaleString("vi-VN")} đ`,
                  "",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #eaeaea",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Lợi nhuận"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
