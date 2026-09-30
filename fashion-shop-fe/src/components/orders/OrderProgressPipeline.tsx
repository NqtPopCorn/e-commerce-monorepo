"use client";

import React from "react";
import { OrderStatus } from "@/types/order";
import { Check, XCircle } from "lucide-react";

interface OrderProgressPipelineProps {
  status: OrderStatus | string;
  className?: string;
}

const STEPS = [
  { step: 1, key: "PENDING", label: "Chờ xác nhận" },
  { step: 2, key: "CONFIRMED", label: "Đã xác nhận" },
  { step: 3, key: "SHIPPING", label: "Đang giao hàng" },
  { step: 4, key: "COMPLETED", label: "Hoàn tất" },
];

export function OrderProgressPipeline({
  status,
  className = "",
}: OrderProgressPipelineProps) {
  if (status === "CANCELLED") {
    return (
      <div
        className={`p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium ${className}`}
      >
        <XCircle className="w-4 h-4 shrink-0" />
        <span>Đơn hàng này đã bị hủy.</span>
      </div>
    );
  }

  const getStepNumber = (st: string) => {
    switch (st) {
      case "PENDING":
        return 1;
      case "CONFIRMED":
        return 2;
      case "SHIPPING":
        return 3;
      case "COMPLETED":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStepNumber(status);

  // Width of connecting bar:
  // Starts at center of step 1 (12.5%) and ends at center of step 4 (87.5%).
  // Total span = 75%.
  // Step 1: 0% * 75% = 0%
  // Step 2: (1/3) * 75% = 25%
  // Step 3: (2/3) * 75% = 50%
  // Step 4: (3/3) * 75% = 75%
  const activeLineWidth =
    currentStep === 1
      ? "0%"
      : currentStep === 2
        ? "25%"
        : currentStep === 3
          ? "50%"
          : "75%";

  return (
    <div
      className={`bg-card p-4 sm:p-5 rounded-xl border border-border space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Tiến trình đơn hàng
        </h4>
        <span className="text-[11px] text-muted-foreground font-medium">
          Bước {currentStep}/4
        </span>
      </div>

      <div className="relative pt-1 pb-1">
        {/* Background Track Line connecting step 1 to step 4 */}
        <div
          aria-hidden="true"
          className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 -translate-y-1/2 bg-border z-0"
        />

        {/* Active Fill Line */}
        <div
          aria-hidden="true"
          className="absolute top-5 left-[12.5%] h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-out z-0"
          style={{ width: activeLineWidth }}
        />

        {/* Step Nodes */}
        <div className="grid grid-cols-4 relative z-10">
          {STEPS.map((s) => {
            const isPassed = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const isCompletedOrPassed = currentStep >= s.step;

            return (
              <div
                key={s.step}
                className="flex flex-col items-center text-center group"
              >
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-2 border-primary ring-4 ring-primary/20 shadow-xs"
                      : isPassed
                        ? "bg-primary text-primary-foreground border-2 border-primary"
                        : "bg-card text-muted-foreground border-2 border-border"
                  }`}
                >
                  {isCompletedOrPassed ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span>{s.step}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[11px] mt-2 leading-tight transition-colors ${
                    isCurrent
                      ? "text-foreground font-bold"
                      : isPassed
                        ? "text-foreground font-medium"
                        : "text-muted-foreground font-normal"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
