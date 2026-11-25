"use client";

import React, { useRef, useEffect } from "react";
import {
  Sparkles,
  RotateCcw,
  X,
  Bot,
  Maximize2,
  Minimize2,
  Bug,
} from "lucide-react";
import {
  DEFAULT_STARTER_PROMPTS,
  useChatbotStore,
} from "@/stores/chatbot.store";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatStarterPrompts } from "./ChatStarterPrompts";
import { ChatInput } from "./ChatInput";
import { ClarificationModeSelector } from "./ClarificationModeSelector";
import { ChatDebugPanel } from "./ChatDebugPanel";

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const {
    messages,
    isLoading,
    isExpanded,
    isDebugOpen,
    toggleExpanded,
    toggleDebugOpen,
    sendMessage,
    submitClarificationForm,
    clearHistory,
  } = useChatbotStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMsgCountRef = useRef(messages.length);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= 80;
  };

  // Auto-scroll when near bottom; instant scroll while streaming tokens
  useEffect(() => {
    const hasNewMessage = messages.length > prevMsgCountRef.current;
    if (hasNewMessage) {
      isNearBottomRef.current = true;
    }

    if (isNearBottomRef.current) {
      const el = scrollContainerRef.current;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.isStreaming && el) {
        el.scrollTop = el.scrollHeight;
      } else if (el && typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    prevMsgCountRef.current = messages.length;
  }, [messages, isLoading]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isSplitDebug = isExpanded && isDebugOpen;

  const windowContent = (
    <div
      role="dialog"
      aria-label="Cửa sổ Stylist AI tư vấn"
      className={
        isExpanded
          ? isSplitDebug
            ? "w-full h-full max-w-8xl max-h-[94vh] bg-slate-50/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            : "w-full h-full max-w-5xl max-h-[92vh] bg-slate-50/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          : "fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[calc(100vh-100px)] bg-slate-50/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
      }
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
            onClick={toggleDebugOpen}
            className={`p-1.5 rounded-lg transition-colors outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
              isDebugOpen
                ? "bg-white/25 text-amber-200 ring-1 ring-amber-300/40"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Bật/tắt Debug Inspector (LangChain runs & state)"
          >
            <Bug className="w-4 h-4" />
          </button>
          <button
            onClick={toggleExpanded}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 transition-colors"
            title={isExpanded ? "Thu nhỏ cửa sổ" : "Mở rộng toàn màn hình"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Optional Mode Selector (for demo and research evaluation) */}
      {process.env.NEXT_PUBLIC_SHOW_MODE_SELECTOR === "true" && (
        <ClarificationModeSelector />
      )}

      {/* Main Body (Split into Chat + Debug when isSplitDebug) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left pane: Messages & Input */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
          {/* Messages List Area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-5 py-3 space-y-1 admin-scrollbar"
          >
            {messages.map((message, index) => {
              if (
                message.role === "assistant" &&
                !message.content &&
                message.isStreaming
              ) {
                return null;
              }

              const isLatestAssistant =
                message.role === "assistant" &&
                index === messages.findLastIndex((m) => m.role === "assistant");

              return (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isLatestAssistantMessage={isLatestAssistant}
                  isExpanded={isExpanded}
                  onClarificationSubmit={submitClarificationForm}
                />
              );
            })}

            {messages.length === 1 &&
              messages[0].role === "assistant" &&
              !isLoading && (
                <ChatStarterPrompts
                  prompts={DEFAULT_STARTER_PROMPTS}
                  onSelect={sendMessage}
                  disabled={isLoading}
                />
              )}

            {/* Loading Indicator (before first token arrives) */}
            {isLoading &&
              (!messages.length ||
                messages[messages.length - 1].role !== "assistant" ||
                !messages[messages.length - 1].content) && (
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
        </div>

        {/* Right pane: ChatDebugPanel (Split view) */}
        {isSplitDebug && (
          <div className="w-[420px] max-w-[45%] h-full shrink-0 border-l border-slate-700/80 hidden sm:flex flex-col">
            <ChatDebugPanel onClose={toggleDebugOpen} />
          </div>
        )}
      </div>

      {/* Safe info footer */}
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400">
        AI Stylist kết nối gợi ý sản phẩm thời trang theo nhu cầu
      </div>
    </div>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 transition-all duration-300">
        {windowContent}
      </div>
    );
  }

  return windowContent;
};
