import { describe, expect, it, vi, beforeEach } from "vitest";
import { useChatbotStore } from "./chatbot.store";
import { chatbotService } from "@/services/chatbot.service";

describe("chatbot store", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it("handles streaming message tokens progressively", async () => {
    vi.spyOn(chatbotService, "streamMessage").mockImplementationOnce(
      async (_req, onToken, onDone) => {
        onToken("Chào ");
        onToken("bạn!");
        onDone({
          reply: "Chào bạn!",
          conversationId: "stream-conv",
          products: [],
          quickReplies: ["Tư vấn size"],
        });
      },
    );

    await useChatbotStore.getState().sendMessage("Xin chào stylist");

    const state = useChatbotStore.getState();
    expect(state.messages.length).toBe(3);
    expect(state.messages[1].content).toBe("Xin chào stylist");
    expect(state.messages[2].content).toBe("Chào bạn!");
    expect(state.messages[2].quickReplies).toEqual(["Tư vấn size"]);
    expect(state.messages[2].isStreaming).toBe(false);
  });

  it("retries last user message on failure", async () => {
    useChatbotStore.setState({
      messages: [
        {
          id: "m-user-1",
          role: "user",
          content: "Áo polo size M còn không?",
          createdAt: new Date().toISOString(),
          status: "sent",
        },
        {
          id: "m-bot-err",
          role: "assistant",
          content: "Lỗi kết nối",
          createdAt: new Date().toISOString(),
          status: "error",
        },
      ],
    });

    vi.spyOn(chatbotService, "streamMessage").mockImplementationOnce(
      async (_req, _onToken, onDone) => {
        onDone({
          reply: "Áo polo size M hiện còn 15 chiếc ạ!",
          conversationId: "retry-conv",
          products: [],
          quickReplies: [],
        });
      },
    );

    await useChatbotStore.getState().retryLastMessage();

    const state = useChatbotStore.getState();
    const assistantMsgs = state.messages.filter((m) => m.role === "assistant");
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    expect(lastAssistant.content).toBe("Áo polo size M hiện còn 15 chiếc ạ!");
    expect(lastAssistant.status).toBe("sent");
  });

  it("updates clarificationMode via setClarificationMode and passes to service", async () => {
    useChatbotStore.getState().setClarificationMode("ALWAYS_CLARIFY");
    expect(useChatbotStore.getState().clarificationMode).toBe("ALWAYS_CLARIFY");

    let capturedReq: any = null;
    vi.spyOn(chatbotService, "sendMessage").mockImplementationOnce(
      async (req) => {
        capturedReq = req;
        return {
          reply: "Bạn muốn tìm trang phục phong cách nào?",
          conversationId: "test-conv",
          products: [],
          quickReplies: [],
        };
      },
    );

    await useChatbotStore.getState().sendMessage("Tìm đầm dạ hội");
    expect(capturedReq?.clarificationMode).toBe("ALWAYS_CLARIFY");
  });
});

