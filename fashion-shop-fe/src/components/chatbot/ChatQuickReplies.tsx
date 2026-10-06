"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface ChatQuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export const ChatQuickReplies: React.FC<ChatQuickRepliesProps> = ({
  replies,
  onSelect,
  disabled,
}) => {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {replies.map((reply, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50/80 hover:bg-rose-100/90 active:scale-95 border border-rose-200/60 rounded-full px-3 py-1.5 transition-all shadow-2xs disabled:opacity-50 disabled:pointer-events-none"
        >
          <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
          <span>{reply}</span>
        </button>
      ))}
    </div>
  );
};
