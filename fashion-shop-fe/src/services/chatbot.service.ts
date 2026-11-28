import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";
import {
  ChatbotRequest,
  ChatbotResponse,
  ChatRecommendedProduct,
} from "@/types/chatbot";

const FASTAPI_BASE_URL =
  process.env.NEXT_PUBLIC_AI_CHATBOT_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    try {
      const token =
        useAuthStore.getState().token ||
        localStorage.getItem("accessToken") ||
        null;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return headers;
}

export function normalizeProduct(raw: any): ChatRecommendedProduct {
  const minPrice =
    raw.price !== undefined
      ? Number(raw.price)
      : raw.variants?.length > 0
        ? Math.min(
            ...raw.variants.map((v: any) =>
              v.final_price !== undefined
                ? Number(v.final_price)
                : v.discountedPrice !== undefined
                  ? Number(v.discountedPrice)
                  : Number(v.sellingPrice || v.selling_price || 0),
            ),
          )
        : 0;

  const originalPrice =
    raw.originalPrice !== undefined
      ? Number(raw.originalPrice)
      : raw.original_price !== undefined
        ? Number(raw.original_price)
        : raw.variants?.length > 0
          ? Math.max(
              ...raw.variants.map((v: any) =>
                Number(v.listPrice || v.list_price || 0),
              ),
            )
          : undefined;

  const discountPercent =
    raw.discountPercent !== undefined
      ? Number(raw.discountPercent)
      : raw.discount_percent !== undefined
        ? Number(raw.discount_percent)
        : originalPrice && originalPrice > minPrice
          ? Math.round(((originalPrice - minPrice) / originalPrice) * 100)
          : undefined;

  const imageUrl =
    raw.imageUrl ||
    raw.image_url ||
    raw.images?.[0]?.url ||
    raw.variants?.[0]?.imageUrl ||
    raw.variants?.[0]?.image_url ||
    undefined;

  const rawVariantId = raw.variantId ?? raw.variant_id;
  const parsedVariantId =
    rawVariantId !== undefined && rawVariantId !== null
      ? Number(rawVariantId)
      : undefined;
  const variantId =
    parsedVariantId !== undefined &&
    Number.isInteger(parsedVariantId) &&
    parsedVariantId > 0
      ? parsedVariantId
      : undefined;

  return {
    id: Number(raw.id),
    name: raw.name || raw.title || "Sản phẩm thời trang",
    slug: raw.slug || undefined,
    price: minPrice,
    originalPrice:
      originalPrice && originalPrice > minPrice ? originalPrice : undefined,
    original_price:
      originalPrice && originalPrice > minPrice ? originalPrice : undefined,
    discountPercent:
      discountPercent && discountPercent > 0 ? discountPercent : undefined,
    discount_percent:
      discountPercent && discountPercent > 0 ? discountPercent : undefined,
    imageUrl,
    image_url: imageUrl,
    category:
      typeof raw.category === "string"
        ? raw.category
        : raw.category?.name || undefined,
    brand:
      typeof raw.brand === "string" ? raw.brand : raw.brand?.name || undefined,
    variantId,
    variant_id: variantId,
    color: raw.color || undefined,
    size: raw.size || undefined,
  };
}

export const chatbotService = {
  async sendMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
    const fastApiUrl = `${FASTAPI_BASE_URL.replace(/\/+$/, "")}/api/v1/chat`;

    const response = await axios.post<any>(
      fastApiUrl,
      {
        message: request.message,
        session_id: request.conversationId,
        conversation_id: request.conversationId,
        history: request.history || [],
        user_profile: request.userProfile,
        clarification_mode: request.clarificationMode || undefined,
      },
      {
        headers: getAuthHeaders(),
        timeout: 45000,
      },
    );

    const data = response.data;
    return {
      reply: data.reply,
      conversationId: data.session_id || request.conversationId,
      products: (data.products || []).map(normalizeProduct),
      clarificationForm: data.clarification_form,
      clarificationAsked: data.clarification_asked,
      debugMeta: data.debug_meta,
    };
  },

  async streamMessage(
    request: ChatbotRequest,
    onToken: (token: string) => void,
    onDone: (result: ChatbotResponse) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const streamUrl = `${FASTAPI_BASE_URL.replace(/\/+$/, "")}/api/v1/chat/stream`;

    try {
      const response = await fetch(streamUrl, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: request.message,
          session_id: request.conversationId,
          conversation_id: request.conversationId,
          history: request.history || [],
          user_profile: request.userProfile,
          clarification_mode: request.clarificationMode || undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI Chatbot HTTP error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedReply = "";
      let finalResult: ChatbotResponse | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "token" || parsed.type === "clarification") {
            const text = String(parsed.content || "");
            accumulatedReply += text;
            onToken(text);
          } else if (parsed.type === "done") {
            finalResult = {
              reply: parsed.reply || accumulatedReply,
              conversationId: parsed.session_id || request.conversationId,
              products: (parsed.products || []).map(normalizeProduct),
              clarificationForm: parsed.clarification_form,
              clarificationAsked: parsed.clarification_asked,
              debugMeta: parsed.debug_meta,
            };
          } else if (parsed.type === "error") {
            throw new Error(parsed.content || "Lỗi tạo câu trả lời từ AI");
          }
        }
      }

      if (finalResult) {
        onDone(finalResult);
      } else {
        onDone({
          reply: accumulatedReply || "Đã hoàn thành phản hồi.",
          conversationId: request.conversationId,
          products: [],
        });
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  },
};