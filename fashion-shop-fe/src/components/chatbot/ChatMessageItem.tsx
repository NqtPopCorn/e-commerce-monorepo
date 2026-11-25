"use client";

import React from "react";
import { Bot, User, AlertCircle, RotateCcw, Bug } from "lucide-react";
import { ChatMessage } from "@/types/chatbot";
import { useChatbotStore } from "@/stores/chatbot.store";
import { ChatProductCard } from "./ChatProductCard";
import { ChatClarificationCard } from "./ChatClarificationCard";

interface ChatMessageItemProps {
  message: ChatMessage;
  onClarificationSubmit?: (
    messageId: string,
    answers: Record<string, string[]>,
    formattedMessage: string,
  ) => void;
  isLatestAssistantMessage?: boolean;
  isExpanded?: boolean;
}

/**
 * Parse text segments for **bold** text and [file.md: Topic] citation badges
 */
function parseInlineContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\[[^\]]+:\s*[^\]]+\]|\[\d+\])/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={pIdx} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("[") && part.endsWith("]") && part.includes(":")) {
      return (
        <span
          key={pIdx}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    if (/^\[\d+\]$/.test(part)) {
      return (
        <span
          key={pIdx}
          className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 font-mono shadow-2xs"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Format markdown text: tables, bullet lists, bold markers, headers, and linebreaks
 */
function formatMessageContent(content: string, isStreaming?: boolean) {
  const sanitized = (content || "").trim();
  const normalized = sanitized
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];

  const flushTable = (keyPrefix: number) => {
    if (tableLines.length === 0) return;

    const rows = tableLines.map((row) =>
      row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim()),
    );

    tableLines = [];
    if (rows.length === 0) return;

    // Filter out separator rows like |---|---|
    const validRows = rows.filter(
      (cols) => !cols.every((c) => c.match(/^[:\-\s]+$/)),
    );
    if (validRows.length === 0) return;

    const headers = validRows[0];
    const dataRows = validRows.slice(1);

    elements.push(
      <div
        key={`table-${keyPrefix}`}
        className="overflow-x-auto my-2 rounded-xl border border-gray-200 shadow-2xs admin-scrollbar"
      >
        <table className="min-w-full text-left text-[11px] md:text-xs">
          <thead className="bg-rose-50/70 text-rose-950 font-semibold border-b border-rose-100">
            <tr>
              {headers.map((h, hIdx) => (
                <th key={hIdx} className="px-2.5 py-1.5 whitespace-nowrap">
                  {parseInlineContent(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {dataRows.map((r, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
              >
                {r.map((c, cIdx) => (
                  <td key={cIdx} className="px-2.5 py-1.5 whitespace-nowrap">
                    {parseInlineContent(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Check if this line is part of a markdown table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableLines.push(trimmed);
      return;
    }

    // Flush any pending table before regular lines
    flushTable(lineIdx);

    // Markdown headers ###, ##, #
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${lineIdx}`}
          className="font-bold text-gray-900 text-xs md:text-sm mt-2.5 mb-1 text-rose-950"
        >
          {parseInlineContent(trimmed.replace(/^###\s+/, ""))}
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h3-${lineIdx}`}
          className="font-bold text-gray-900 text-sm md:text-base mt-3 mb-1.5 text-rose-950"
        >
          {parseInlineContent(trimmed.replace(/^##\s+/, ""))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={`h2-${lineIdx}`}
          className="font-bold text-gray-900 text-base mt-3.5 mb-2 text-rose-950"
        >
          {parseInlineContent(trimmed.replace(/^#\s+/, ""))}
        </h2>,
      );
      return;
    }

    const isBullet =
      trimmed.startsWith("•") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("* ");
    const cleanLine = isBullet
      ? trimmed.replace(/^([•\-\*]\s*)/, "")
      : line;

    if (isBullet) {
      elements.push(
        <div key={`line-${lineIdx}`} className="flex items-start gap-1.5 my-0.5">
          <span className="text-rose-500 font-bold leading-5">•</span>
          <span className="flex-1">{parseInlineContent(cleanLine)}</span>
        </div>,
      );
      return;
    }

    if (trimmed === "") {
      elements.push(<div key={`empty-${lineIdx}`} className="h-1.5" />);
      return;
    }

    elements.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed">
        {parseInlineContent(cleanLine)}
      </p>,
    );
  });

  // Flush any trailing table
  flushTable(lines.length);

  return (
    <>
      {elements}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-rose-500 rounded-xs ml-1 animate-pulse align-middle" />
      )}
    </>
  );
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onClarificationSubmit,
  isLatestAssistantMessage,
  isExpanded = false,
}) => {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const retryLastMessage = useChatbotStore((s) => s.retryLastMessage);
  const isLoading = useChatbotStore((s) => s.isLoading);
  const selectDebugMessage = useChatbotStore((s) => s.selectDebugMessage);

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 my-2.5">
        <div className="max-w-[82%] bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl rounded-br-xs px-4 py-2.5 shadow-xs text-xs md:text-sm">
          <p className="leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
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

      <div className="flex-1 max-w-[92%] space-y-2.5 overflow-hidden">
        {/* Message Bubble */}
        <div
          className={`rounded-2xl rounded-tl-xs px-4 py-3 text-xs md:text-sm ${
            isError
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-white border border-gray-100 text-gray-700 shadow-2xs"
          }`}
        >
          {isError ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Sự cố kết nối</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {message.content}
              </p>
              <button
                type="button"
                onClick={() => retryLastMessage()}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white border border-rose-300 hover:bg-rose-100/50 rounded-lg px-2.5 py-1 transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {formatMessageContent(message.content, message.isStreaming)}
            </div>
          )}
        </div>

        {/* Inline Clarification Form Card */}
        {message.clarificationForm &&
          message.clarificationForm.questions &&
          message.clarificationForm.questions.length > 0 && (
            <ChatClarificationCard
              form={message.clarificationForm}
              submittedAnswers={message.submittedAnswers}
              onSubmit={(answers, formattedMsg) => {
                if (onClarificationSubmit) {
                  onClarificationSubmit(message.id, answers, formattedMsg);
                }
              }}
              disabled={isLoading || !isLatestAssistantMessage}
            />
          )}

        {/* Recommended Products Carousel / Grid */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <span>Sản phẩm gợi ý cho bạn</span>
              <span className="text-rose-500">({message.products.length})</span>
            </p>
            {isExpanded ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                {message.products.map((product) => (
                  <ChatProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
                {message.products.map((product) => (
                  <ChatProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Research Telemetry Badge (for Clarification Strategy & LangChain Runs) */}
        {message.debugMeta && (
          <button
            type="button"
            onClick={() => selectDebugMessage(message.id)}
            className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 border border-gray-200/80 hover:border-rose-300 rounded-md px-2 py-0.5 select-none w-fit transition-all cursor-pointer text-left group"
            title="Nhấn để mở LangChain Debug Inspector chi tiết cho lượt này"
          >
            <span className="font-semibold text-rose-600 flex items-center gap-1">
              <Bug className="w-2.5 h-2.5" />
              Mode: {message.debugMeta.mode || "AUTO"}
            </span>
            <span>•</span>
            <span>Phase: {message.debugMeta.phase || "OPEN"}</span>
            {message.debugMeta.latency_ms !== undefined && (
              <>
                <span>•</span>
                <span className="font-mono">{message.debugMeta.latency_ms}ms</span>
              </>
            )}
            {message.debugMeta.usage_metadata && (
              <>
                <span>•</span>
                <span className="font-mono text-purple-600">
                  {message.debugMeta.usage_metadata.total_tokens}t
                </span>
              </>
            )}
            {message.clarificationAsked && (
              <>
                <span>•</span>
                <span className="text-amber-600 font-medium">Hỏi làm rõ</span>
              </>
            )}
            <span className="text-rose-500 font-medium opacity-0 group-hover:opacity-100 ml-1 transition-opacity">
              Debug ↗
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
