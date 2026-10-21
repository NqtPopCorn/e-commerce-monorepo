"use client";

import React, { useState } from "react";
import { Zap, MessageSquareQuote, BrainCircuit, Info } from "lucide-react";
import { useChatbotStore } from "@/stores/chatbot.store";
import { ClarificationMode } from "@/types/chatbot";

interface ModeOption {
  id: ClarificationMode;
  keyLabel: string;
  name: string;
  shortLabel: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const MODES: ModeOption[] = [
  {
    id: "IMMEDIATE_ANSWER",
    keyLabel: "A",
    name: "Trả lời ngay",
    shortLabel: "Ngay",
    badge: "⚡ A: Ngay",
    description: "Tìm và gợi ý sản phẩm ngay lập tức, không hỏi làm rõ nhu cầu.",
    icon: Zap,
    accentColor: "text-amber-500",
  },
  {
    id: "ALWAYS_CLARIFY",
    keyLabel: "B",
    name: "Luôn hỏi sâu",
    shortLabel: "Hỏi sâu",
    badge: "💬 B: Hỏi sâu",
    description: "Chặn tìm kiếm ở lượt 1 để phỏng vấn gu/dáng/dịp mặc, mở khóa ở lượt 2.",
    icon: MessageSquareQuote,
    accentColor: "text-blue-500",
  },
  {
    id: "CONDITIONAL_CLARIFICATION",
    keyLabel: "C",
    name: "Tự cân nhắc",
    shortLabel: "Cân nhắc",
    badge: "🧠 C: Cân nhắc",
    description: "Đủ thông tin thì tìm ngay, quá mơ hồ thì hỏi thêm để tối ưu kết quả.",
    icon: BrainCircuit,
    accentColor: "text-rose-500",
  },
];

export const ClarificationModeSelector: React.FC = () => {
  const { clarificationMode, setClarificationMode } = useChatbotStore();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Default to CONDITIONAL_CLARIFICATION for display if null
  const currentMode: ClarificationMode =
    clarificationMode || "CONDITIONAL_CLARIFICATION";

  const activeOption =
    MODES.find((m) => m.id === currentMode) || MODES[2];

  return (
    <div className="bg-slate-100/90 border-b border-gray-200/90 px-3 py-1.5 backdrop-blur-xs flex flex-col gap-1 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3 text-rose-500" />
          Chế độ làm rõ (Demo)
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {activeOption.badge}
        </span>
      </div>

      {/* Segmented Control Bar */}
      <div
        role="radiogroup"
        aria-label="Chọn chế độ làm rõ cho Stylist AI"
        className="grid grid-cols-3 gap-1 bg-white p-0.5 rounded-lg border border-gray-200 shadow-2xs"
      >
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              role="radio"
              aria-checked={isActive}
              type="button"
              onClick={() => setClarificationMode(mode.id)}
              onMouseEnter={() => setShowTooltip(mode.id)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-rose-600 text-white shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title={`${mode.badge} - ${mode.description}`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-white" : mode.accentColor
                }`}
              />
              <span className="truncate">{mode.keyLabel}: {mode.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Helper Description Line */}
      <p className="text-[10px] text-gray-500 leading-tight truncate px-0.5 min-h-[14px]">
        {showTooltip
          ? MODES.find((m) => m.id === showTooltip)?.description
          : activeOption.description}
      </p>
    </div>
  );
};
