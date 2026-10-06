"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = "Hỏi stylist về phối đồ, size, ưu đãi...",
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto adjust height (max 90px)
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white border-t border-gray-100 flex items-end gap-2"
    >
      <div className="flex-1 bg-gray-50 border border-gray-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:bg-white rounded-2xl px-3.5 py-2.5 transition-all shadow-2xs">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="w-full resize-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none text-xs md:text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50 max-h-[90px] leading-relaxed p-0"
        />
      </div>

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white flex items-center justify-center shrink-0 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        title="Gửi tin nhắn (Enter)"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
