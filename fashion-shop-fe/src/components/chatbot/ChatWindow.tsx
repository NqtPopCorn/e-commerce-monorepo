"use client";

import React, { useRef, useEffect } from "react";
import {
  Sparkles,
  RotateCcw,
  X,
  Bot,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useChatbotStore } from "@/stores/chatbot.store";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const {
    messages,
    isLoading,
    sendMessage,
    sendQuickReply,
    clearHistory,
  } = useChatbotStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      role="dialog"
      aria-label="Cửa sổ Stylist AI tư vấn"
      className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[calc(100vh-100px)] bg-slate-50/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            {/* Online status indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-rose-600 rounded-full">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
            </span>
          </div>

          <div>
            <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5 text-white">
              Stylist AI Fashionista
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </h3>
            <p className="text-[11px] text-rose-100 leading-tight mt-0.5">
              Tư vấn phối đồ & chọn size thông minh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 transition-colors"
            title="Làm mới hội thoại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 transition-colors"
            title="Thu nhỏ / Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-1 admin-scrollbar">
        {messages.map((message, index) => {
          const isLatestAssistant =
            message.role === "assistant" &&
            index === messages.findLastIndex((m) => m.role === "assistant");

          return (
            <ChatMessageItem
              key={message.id}
              message={message}
              isLatestAssistantMessage={isLatestAssistant}
              onQuickReplySelect={sendQuickReply}
            />
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 my-3 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium mr-1">
                  Stylist đang tìm kiếm
                </span>
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />

      {/* Safe info footer */}
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400">
        AI Stylist kết nối gợi ý sản phẩm thời trang theo nhu cầu
      </div>
    </div>
  );
};
