"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type DateRangePreset =
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

interface DateRangePickerProps {
  preset: DateRangePreset;
  compare: boolean;
  startDate?: string;
  endDate?: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onCompareChange: (compare: boolean) => void;
  onCustomDateChange: (from: string, to: string) => void;
}

export function DateRangePicker({
  preset,
  compare,
  startDate,
  endDate,
  onPresetChange,
  onCompareChange,
  onCustomDateChange,
}: DateRangePickerProps) {
  const [customFrom, setCustomFrom] = useState(startDate || "");
  const [customTo, setCustomTo] = useState(endDate || "");

  const handleFromBlur = () => {
    if (customFrom && customTo) {
      onCustomDateChange(customFrom, customTo);
    }
  };

  const handleToBlur = () => {
    if (customFrom && customTo) {
      onCustomDateChange(customFrom, customTo);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset Dropdown */}
      <div className="w-[180px]">
        <Select
          value={preset}
          onValueChange={(val) => onPresetChange(val as DateRangePreset)}
        >
          <SelectTrigger className="h-9 text-xs font-medium bg-background border-border">
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7days" className="text-xs">
              7 ngày qua
            </SelectItem>
            <SelectItem value="last30days" className="text-xs">
              30 ngày qua (mặc định)
            </SelectItem>
            <SelectItem value="thisMonth" className="text-xs">
              Tháng này
            </SelectItem>
            <SelectItem value="lastMonth" className="text-xs">
              Tháng trước
            </SelectItem>
            <SelectItem value="custom" className="text-xs">
              Khoảng tùy chọn...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Inputs if Custom is selected */}
      {preset === "custom" && (
        <div className="flex items-center gap-1.5 text-xs">
          <Input
            type="date"
            className="h-9 w-36 text-xs bg-background border-border"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            onBlur={handleFromBlur}
          />
          <span className="text-muted-foreground">đến</span>
          <Input
            type="date"
            className="h-9 w-36 text-xs bg-background border-border"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            onBlur={handleToBlur}
          />
        </div>
      )}

      {/* Compare Toggle */}
      <div className="flex items-center gap-2 pl-1 border-l border-border/70 ml-1">
        <Checkbox
          id="compare-period"
          checked={compare}
          onChange={(e) => onCompareChange(e.target.checked)}
          className="cursor-pointer"
        />
        <label
          htmlFor="compare-period"
          className="text-xs font-medium text-foreground cursor-pointer select-none"
        >
          So sánh với kỳ trước
        </label>
      </div>
    </div>
  );
}
