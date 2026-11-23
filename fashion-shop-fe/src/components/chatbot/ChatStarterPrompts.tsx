"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface ChatStarterPromptsProps {
  prompts: readonly string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const ChatStarterPrompts: React.FC<ChatStarterPromptsProps> = ({
  prompts,
  onSelect,
  disabled,
}) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="pl-[38px] max-w-[92%] flex flex-wrap gap-1.5 pt-0.5 pb-1">
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50/80 hover:bg-rose-100/90 active:scale-95 border border-rose-200/60 rounded-full px-3 py-1.5 transition-all shadow-2xs disabled:opacity-50 disabled:pointer-events-none"
        >
          <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
          <span>{prompt}</span>
        </button>
      ))}
    </div>
  );
};

