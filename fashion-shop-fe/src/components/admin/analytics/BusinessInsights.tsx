"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Info,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessInsightItem } from "@/types/analytics";

interface BusinessInsightsProps {
  insights?: BusinessInsightItem[];
  isLoading?: boolean;
}

export function BusinessInsights({
  insights = [],
  isLoading = false,
}: BusinessInsightsProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-none rounded-xl h-full">
        <CardHeader className="p-5 pb-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const renderIcon = (severity: BusinessInsightItem["severity"]) => {
    switch (severity) {
      case "alert":
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case "positive":
        return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = (severity: BusinessInsightItem["severity"]) => {
    switch (severity) {
      case "alert":
        return "border-rose-500/30 bg-rose-500/5";
      case "warning":
        return "border-amber-500/30 bg-amber-500/5";
      case "positive":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "info":
      default:
        return "border-sky-500/30 bg-sky-500/5";
    }
  };

  return (
    <Card className="bg-card border border-border shadow-none rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base font-semibold text-foreground">
            Thông Điệp Vận Hành (Insights)
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tín hiệu cảnh báo và cơ hội phát hiện qua luật quy tắc
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-2 flex-1 flex flex-col justify-between">
        {insights.length === 0 ? (
          <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-lg">
            <Sparkles className="w-6 h-6 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">
              Không có bất thường vận hành
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
              Tất cả các chỉ số doanh số, tồn kho và ngân sách đều nằm trong biên độ an toàn.
            </p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {insights.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg border text-xs transition-all ${getBorderColor(
                  item.severity,
                )}`}
              >
                <div className="flex items-start gap-2">
                  {renderIcon(item.severity)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    {item.evidence && item.evidence.length > 0 && (
                      <div className="mt-2 pl-2 border-l-2 border-border/80 space-y-0.5 text-[11px] text-muted-foreground font-mono">
                        {item.evidence.map((ev, idx) => (
                          <div key={idx}>{ev}</div>
                        ))}
                      </div>
                    )}

                    {item.ctaText && item.ctaLink && (
                      <div className="mt-2.5">
                        <Link
                          href={item.ctaLink}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-[11px]"
                        >
                          <span>{item.ctaText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
