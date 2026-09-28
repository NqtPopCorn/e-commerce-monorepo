"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, indeterminate, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    return (
      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <div
          onClick={() => inputRef.current?.click()}
          className={cn(
            "h-4 w-4 shrink-0 rounded border border-slate-300 bg-white shadow-xs transition-all cursor-pointer flex items-center justify-center",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 peer-focus-visible:ring-offset-1",
            "peer-checked:bg-rose-600 peer-checked:border-rose-600 peer-checked:text-white",
            indeterminate && "bg-rose-600 border-rose-600 text-white",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            className,
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3 stroke-[3]" />
          ) : checked ? (
            <Check className="h-3 w-3 stroke-[3]" />
          ) : null}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
