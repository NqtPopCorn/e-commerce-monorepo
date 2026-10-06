import { describe, expect, it, vi, beforeEach } from "vitest";
import { useChatbotStore } from "./chatbot.store";
import { chatbotService } from "@/services/chatbot.service";

describe("chatbot store", () => {
  beforeEach(() => {
    useChatbotStore.getState().clearHistory();
    useChatbotStore.getState().setOpen(false);
  });

  it("initializes with closed state and default welcome message", () => {
    const state = useChatbotStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].role).toBe("assistant");
    expect(state.messages[0].content).toContain("Stylist AI");
  });

  it("toggles open state and dismisses unread indicator", () => {
    useChatbotStore.setState({ hasUnread: true });
    expect(useChatbotStore.getState().isOpen).toBe(false);

    useChatbotStore.getState().toggleOpen();
    expect(useChatbotStore.getState().isOpen).toBe(true);
    expect(useChatbotStore.getState().hasUnread).toBe(false);

    useChatbotStore.getState().toggleOpen();
    expect(useChatbotStore.getState().isOpen).toBe(false);
  });

  it("clears chat history and creates fresh state", () => {
    const prevConvId = useChatbotStore.getState().conversationId;
    useChatbotStore.setState({
      messages: [
        {
          id: "m1",
          role: "user",
          content: "Hello",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    useChatbotStore.getState().clearHistory();

    const state = useChatbotStore.getState();
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].role).toBe("assistant");
    expect(state.conversationId).not.toBe(prevConvId);
  });

  it("sends message and appends user and bot response", async () => {
    const mockReply = "Chào bạn! Đây là gợi ý sơ mi cho bạn.";
    vi.spyOn(chatbotService, "sendMessage").mockResolvedValueOnce({
      reply: mockReply,
      conversationId: "test-conv",
      products: [
        {
          id: 101,
          name: "Áo Sơ Mi Nam",
          price: 250000,
        },
      ],
      quickReplies: ["Xem thêm", "Bảng size"],
    });

    await useChatbotStore.getState().sendMessage("Tôi muốn mua sơ mi");

    const state = useChatbotStore.getState();
    expect(state.messages.length).toBe(3); // Welcome + User + Assistant
    expect(state.messages[1].role).toBe("user");
    expect(state.messages[1].content).toBe("Tôi muốn mua sơ mi");
    expect(state.messages[2].role).toBe("assistant");
    expect(state.messages[2].content).toBe(mockReply);
    expect(state.messages[2].products?.length).toBe(1);
    expect(state.isLoading).toBe(false);
  });
});
