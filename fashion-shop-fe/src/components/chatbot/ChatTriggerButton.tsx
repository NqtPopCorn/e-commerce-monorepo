"use client";

import React, { useState } from "react";
import { Sparkles, Bot, X } from "lucide-react";

interface ChatTriggerButtonProps {
  isOpen: boolean;
  hasUnread: boolean;
  onClick: () => void;
}

export const ChatTriggerButton: React.FC<ChatTriggerButtonProps> = ({
  isOpen,
  hasUnread,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(true);

  const handleClick = () => {
    setShowTooltip(false);
    onClick();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Welcome Speech Bubble Tooltip */}
      {!isOpen && showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white text-gray-800 text-xs font-medium px-3.5 py-2 rounded-2xl shadow-lg border border-rose-100 animate-in fade-in slide-in-from-right-4 duration-300">
          <Sparkles className="w-4 h-4 text-rose-500 shrink-0 animate-spin [animation-duration:4s]" />
          <span>Cần tư vấn phối đồ? Chat ngay với AI!</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
            title="Đóng gợi ý"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={handleClick}
        aria-label={isOpen ? "Đóng chatbox tư vấn" : "Mở chatbox tư vấn thời trang AI"}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 group ${
          isOpen
            ? "bg-gray-800 hover:bg-gray-900 shadow-gray-800/30 rotate-90"
            : "bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 hover:from-rose-700 hover:to-pink-600 shadow-rose-500/35 hover:scale-105"
        }`}
      >
        {/* Subtle breathing animation ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25 pointer-events-none" />
        )}

        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
        )}

        {/* Unread indicator */}
        {!isOpen && hasUnread && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>
          </span>
        )}
      </button>
    </div>
  );
};
