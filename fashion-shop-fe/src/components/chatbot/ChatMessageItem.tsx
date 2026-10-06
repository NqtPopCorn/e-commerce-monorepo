"use client";

import React from "react";
import { Bot, User, AlertCircle } from "lucide-react";
import { ChatMessage } from "@/types/chatbot";
import { ChatProductCard } from "./ChatProductCard";
import { ChatQuickReplies } from "./ChatQuickReplies";

interface ChatMessageItemProps {
  message: ChatMessage;
  onQuickReplySelect?: (reply: string) => void;
  isLatestAssistantMessage?: boolean;
}

/**
 * Format markdown-like text (bold **text**, bullet lists, linebreaks)
 */
function formatMessageContent(content: string) {
  const lines = content.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
    const cleanLine = isBullet ? trimmed.replace(/^([•\-]\s*)/, "") : line;

    // Parse **bold** markers
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const parsedText = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
          <span className="text-rose-500 font-bold leading-5">•</span>
          <span className="flex-1">{parsedText}</span>
        </div>
      );
    }

    if (trimmed === "") {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return (
      <p key={lineIdx} className="leading-relaxed">
        {parsedText}
      </p>
    );
  });
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onQuickReplySelect,
  isLatestAssistantMessage,
}) => {
  const isUser = message.role === "user";
  const isError = message.status === "error";

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 my-2.5">
        <div className="max-w-[82%] bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl rounded-br-xs px-4 py-2.5 shadow-xs text-xs md:text-sm">
          <p className="leading-relaxed break-words">{message.content}</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mb-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // Assistant / System message
  return (
    <div className="flex items-start gap-2.5 my-3">
      {/* Bot Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-[88%] space-y-2.5 overflow-hidden">
        {/* Message Bubble */}
        <div
          className={`rounded-2xl rounded-tl-xs px-4 py-3 text-xs md:text-sm ${
            isError
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-white border border-gray-100 text-gray-700 shadow-2xs"
          }`}
        >
          {isError && (
            <div className="flex items-center gap-1.5 font-semibold text-rose-700 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>Lỗi kết nối</span>
            </div>
          )}
          <div className="space-y-1">{formatMessageContent(message.content)}</div>
        </div>

        {/* Recommended Products Carousel / Strip */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <span>Sản phẩm gợi ý cho bạn</span>
              <span className="text-rose-500">({message.products.length})</span>
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
              {message.products.map((product) => (
                <ChatProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Replies (only show for the latest message) */}
        {isLatestAssistantMessage &&
          message.quickReplies &&
          message.quickReplies.length > 0 &&
          onQuickReplySelect && (
            <ChatQuickReplies
              replies={message.quickReplies}
              onSelect={onQuickReplySelect}
            />
          )}
      </div>
    </div>
  );
};
