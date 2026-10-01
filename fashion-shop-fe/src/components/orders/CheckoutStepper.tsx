"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  MapPin,
  CheckCircle2,
  CreditCard,
  Check,
} from "lucide-react";

export type CheckoutStepKey =
  "cart" | "checkout" | "confirm" | "payment" | "completed";

interface CheckoutStepperProps {
  currentStep: CheckoutStepKey;
  className?: string;
}

interface StepItem {
  id: number;
  key: CheckoutStepKey;
  label: string;
  subLabel: string;
  icon: React.ElementType;
  href?: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    key: "cart",
    label: "Giỏ hàng",
    subLabel: "Xem & chọn sản phẩm",
    icon: ShoppingCart,
    href: "/cart",
  },
  {
    id: 2,
    key: "checkout",
    label: "Thông tin đặt hàng",
    subLabel: "Địa chỉ & thanh toán",
    icon: MapPin,
    href: "/checkout",
  },
  {
    id: 3,
    key: "confirm",
    label: "Xác nhận đơn hàng",
    subLabel: "Kiểm tra chi tiết",
    icon: CheckCircle2,
  },
  {
    id: 4,
    key: "completed",
    label: "Hoàn tất / Thanh toán",
    subLabel: "VietQR hoặc nhận hàng",
    icon: CreditCard,
  },
];

export function CheckoutStepper({
  currentStep,
  className = "",
}: CheckoutStepperProps) {
  const getStepIndex = (step: CheckoutStepKey): number => {
    switch (step) {
      case "cart":
        return 1;
      case "checkout":
        return 2;
      case "confirm":
        return 3;
      case "payment":
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  const currentIdx = getStepIndex(currentStep);

  return (
    <div
      className={`w-full bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs ${className}`}
    >
      {/* Mobile Stepper View */}
      <div className="flex sm:hidden items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
            {currentIdx}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              {STEPS[currentIdx - 1]?.label}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Bước {currentIdx} / 4 - {STEPS[currentIdx - 1]?.subLabel}
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <div className="w-20 bg-muted rounded-full h-2 overflow-hidden border border-border">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentIdx / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper View */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-4 relative">
          {/* Background Track Line */}
          <div
            aria-hidden="true"
            className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 -translate-y-1/2 bg-border z-0"
          />

          {/* Active Fill Line */}
          <div
            aria-hidden="true"
            className="absolute top-5 left-[12.5%] h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-out z-0"
            style={{
              width:
                currentIdx === 1
                  ? "0%"
                  : currentIdx === 2
                    ? "25%"
                    : currentIdx === 3
                      ? "50%"
                      : "75%",
            }}
          />

          {STEPS.map((s) => {
            const isCompleted = currentIdx > s.id;
            const isCurrent = currentIdx === s.id;
            const Icon = s.icon;

            const content = (
              <div className="flex flex-col items-center text-center group cursor-default">
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-xs relative z-10 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-md"
                        : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Label & Subtitle */}
                <div className="mt-2.5 space-y-0.5 max-w-[130px]">
                  <p
                    className={`text-xs font-bold transition-colors ${
                      isCurrent
                        ? "text-primary font-black"
                        : isCompleted
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground font-medium"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                    {s.subLabel}
                  </p>
                </div>
              </div>
            );

            // Allow clicking back to cart or checkout if already passed
            if (isCompleted && s.href) {
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className="hover:opacity-85 transition-opacity"
                  title={`Quay lại ${s.label}`}
                >
                  {content}
                </Link>
              );
            }

            return <div key={s.id}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
