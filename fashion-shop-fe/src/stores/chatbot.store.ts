import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "@/types/chatbot";
import { chatbotService } from "@/services/chatbot.service";

function generateId(): string {
  return "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
}

function generateConversationId(): string {
  return "conv-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Xin chào! 👋 Mình là Stylist AI của Fashion Shop. Mình có thể giúp bạn tìm kiếm trang phục, gợi ý phối đồ theo dịp hoặc tư vấn chọn size chuẩn xác. Bạn đang quan tâm đến phong cách nào hôm nay?",
  createdAt: new Date().toISOString(),
  quickReplies: [
    "Gợi ý đồ đi tiệc cuối tuần 🥂",
    "Tìm áo sơ mi công sở 👔",
    "Săn sale hot giảm 50% 🔥",
    "Bảng tư vấn size 📏",
  ],
};

export interface ChatbotState {
  isOpen: boolean;
  hasUnread: boolean;
  conversationId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  dismissUnread: () => void;
  sendMessage: (content: string) => Promise<void>;
  sendQuickReply: (content: string) => Promise<void>;
  clearHistory: () => void;
}

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      hasUnread: false,
      conversationId: generateConversationId(),
      messages: [INITIAL_MESSAGE],
      isLoading: false,
      error: null,

      toggleOpen: () => {
        const nextState = !get().isOpen;
        set({ isOpen: nextState, hasUnread: nextState ? false : get().hasUnread });
      },

      setOpen: (isOpen: boolean) => {
        set({ isOpen, hasUnread: isOpen ? false : get().hasUnread });
      },

      dismissUnread: () => {
        set({ hasUnread: false });
      },

      sendMessage: async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed || get().isLoading) return;

        const userMsg: ChatMessage = {
          id: generateId(),
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
          status: "sent",
        };

        const state = get();
        const updatedMessages = [...state.messages, userMsg];

        set({
          messages: updatedMessages,
          isLoading: true,
          error: null,
        });

        try {
          const history = updatedMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-6)
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));

          const response = await chatbotService.sendMessage({
            message: trimmed,
            conversationId: state.conversationId,
            history,
          });

          const botMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: response.reply,
            createdAt: new Date().toISOString(),
            products: response.products,
            quickReplies: response.quickReplies,
            status: "sent",
          };

          set((s) => ({
            messages: [...s.messages, botMsg],
            isLoading: false,
            hasUnread: !s.isOpen,
          }));
        } catch (err: any) {
          const errorMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content:
              "Rất tiếc, đã có sự cố kết nối với hệ thống tư vấn AI. Bạn vui lòng thử lại sau giây lát nhé!",
            createdAt: new Date().toISOString(),
            status: "error",
          };

          set((s) => ({
            messages: [...s.messages, errorMsg],
            isLoading: false,
            error: err?.message || "Có lỗi xảy ra",
          }));
        }
      },

      sendQuickReply: async (reply: string) => {
        await get().sendMessage(reply);
      },

      clearHistory: () => {
        set({
          conversationId: generateConversationId(),
          messages: [INITIAL_MESSAGE],
          isLoading: false,
          error: null,
          hasUnread: false,
        });
      },
    }),
    {
      name: "fashion-shop-chatbot-storage",
      partialize: (state) => ({
        conversationId: state.conversationId,
        messages: state.messages,
      }),
    },
  ),
);
