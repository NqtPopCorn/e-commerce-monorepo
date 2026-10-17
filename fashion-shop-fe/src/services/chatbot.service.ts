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
      const token = useAuthStore.getState().token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return headers;
}

// Fallback catalog of products if API is offline
const FALLBACK_PRODUCTS: ChatRecommendedProduct[] = [
  {
    id: 1,
    name: "Áo Sơ Mi Nam Oxford Regular Fit",
    slug: "ao-so-mi-nam-oxford-regular-fit",
    price: 389000,
    originalPrice: 489000,
    discountPercent: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    category: "Áo sơ mi",
    brand: "Fashion Shop Men",
  },
  {
    id: 2,
    name: "Áo Polo Nam Pique Cotton Cao Cấp",
    slug: "ao-polo-nam-pique-cotton",
    price: 299000,
    originalPrice: 399000,
    discountPercent: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
    category: "Áo polo",
    brand: "Urban Classic",
  },
  {
    id: 3,
    name: "Quần Jeans Slimfit Co Giãn 4 Chiều",
    slug: "quan-jeans-slimfit-co-gian",
    price: 499000,
    originalPrice: 650000,
    discountPercent: 23,
    imageUrl:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    category: "Quần jeans",
    brand: "Denim Co.",
  },
  {
    id: 4,
    name: "Váy Liền Thân Xòe Hoa Nhí Dịu Dàng",
    slug: "vay-lien-than-xoe-hoa-nhi",
    price: 450000,
    originalPrice: 590000,
    discountPercent: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
    category: "Váy liền",
    brand: "Chic Lady",
  },
];

/**
 * Intelligent mock response generator when FastAPI agent server is offline or in development
 */
function generateMockResponse(
  request: ChatbotRequest,
  liveProducts?: any[],
): ChatbotResponse {
  const query = request.message.toLowerCase();

  // Map real live products if available, otherwise use FALLBACK_PRODUCTS
  let catalog: ChatRecommendedProduct[] = FALLBACK_PRODUCTS;
  if (Array.isArray(liveProducts) && liveProducts.length > 0) {
    catalog = liveProducts.slice(0, 8).map((p: any) => {
      const minPrice =
        p.variants?.length > 0
          ? Math.min(
              ...p.variants.map((v: any) =>
                v.discountedPrice !== undefined
                  ? Number(v.discountedPrice)
                  : Number(v.sellingPrice),
              ),
            )
          : 350000;
      const maxPrice =
        p.variants?.length > 0
          ? Math.max(
              ...p.variants.map((v: any) =>
                Math.max(Number(v.listPrice || 0), Number(v.sellingPrice || 0)),
              ),
            )
          : minPrice;
      const discount =
        maxPrice > minPrice
          ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
          : 0;

      return {
        id: p.id,
        name: p.name || p.title || "Sản phẩm thời trang",
        slug: p.slug,
        price: minPrice,
        originalPrice: maxPrice > minPrice ? maxPrice : undefined,
        discountPercent: discount > 0 ? discount : undefined,
        imageUrl:
          p.images?.[0]?.url ||
          p.variants?.[0]?.imageUrl ||
          FALLBACK_PRODUCTS[0].imageUrl,
        category: p.category?.name || "Thời trang",
        brand: p.brand?.name || "Fashion Shop",
      };
    });
  }

  // 1. Phối đồ đi tiệc / dạ hội
  if (
    query.includes("tiệc") ||
    query.includes("party") ||
    query.includes("dạ hội")
  ) {
    return {
      reply:
        "Dịp tiệc tùng cần sự sang trọng và nổi bật! Stylist gợi ý cho bạn set trang phục thanh lịch, tôn dáng với các thiết kế đang rất được ưa chuộng:",
      conversationId: request.conversationId,
      products: catalog.filter(
        (p) =>
          p.category?.toLowerCase().includes("váy") ||
          p.category?.toLowerCase().includes("sơ mi") ||
          p.id % 2 === 0,
      ).slice(0, 3),
      quickReplies: [
        "Cách chọn phụ kiện đi kèm",
        "Có mẫu nào màu đen huyền bí?",
        "Xem toàn bộ đầm tiệc",
      ],
    };
  }

  // 2. Sơ mi / Công sở
  if (
    query.includes("sơ mi") ||
    query.includes("công sở") ||
    query.includes("đi làm")
  ) {
    return {
      reply:
        "Để đi làm thanh lịch và thoải mái suốt ngày dài, các dòng sơ mi chất liệu sợi tre và Oxford chống nhăn là lựa chọn hàng đầu. Dưới đây là những gợi ý phù hợp nhất:",
      conversationId: request.conversationId,
      products: catalog.filter((p) =>
        p.name.toLowerCase().includes("sơ mi"),
      ).concat(catalog.slice(0, 1)).slice(0, 3),
      quickReplies: [
        "Tư vấn chọn size sơ mi",
        "Có màu trắng và xanh pastel?",
        "Gợi ý quần âu phối cùng",
      ],
    };
  }

  // 3. Polo / Năng động
  if (
    query.includes("polo") ||
    query.includes("áo thun") ||
    query.includes("thể thao")
  ) {
    return {
      reply:
        "Áo Polo và áo thun Cotton đem lại phong cách trẻ trung, năng động nhưng vẫn giữ được nét chỉn chu cần có:",
      conversationId: request.conversationId,
      products: catalog.filter(
        (p) =>
          p.name.toLowerCase().includes("polo") ||
          p.name.toLowerCase().includes("thun"),
      ).concat(catalog.slice(1, 3)).slice(0, 3),
      quickReplies: [
        "Chất liệu có thấm hút mồ hôi tốt không?",
        "Tư vấn bảng size polo",
        "Các mẫu quần jeans phối cùng",
      ],
    };
  }

  // 4. Tư vấn chọn size
  if (
    query.includes("size") ||
    query.includes("cân nặng") ||
    query.includes("chiều cao")
  ) {
    return {
      reply:
        "Bảng quy đổi size chuẩn tại Fashion Shop:\n\n• **Size S**: 45 - 53 kg | 1m50 - 1m60\n• **Size M**: 54 - 62 kg | 1m60 - 1m68\n• **Size L**: 63 - 72 kg | 1m68 - 1m75\n• **Size XL**: 73 - 82 kg | 1m75 - 1m82\n\nBạn có thể nhắn cho mình **chiều cao & cân nặng cụ thể** để mình gợi ý size chuẩn nhất nhé!",
      conversationId: request.conversationId,
      quickReplies: [
        "Tôi cao 1m70, nặng 65kg",
        "Nếu không vừa có được đổi size không?",
        "Xem sản phẩm hot",
      ],
    };
  }

  // 5. Khuyến mãi / Sale / Giảm giá
  if (
    query.includes("sale") ||
    query.includes("giảm giá") ||
    query.includes("ưu đãi") ||
    query.includes("khuyến mãi")
  ) {
    return {
      reply:
        "Hiện tại Fashion Shop đang có chương trình **Ưu đãi mùa lễ hội - Giảm đến 50%** cùng mã freeship cho đơn từ 400.000đ. Đừng bỏ lỡ các siêu phẩm giá tốt sau:",
      conversationId: request.conversationId,
      products: catalog.slice(0, 3),
      quickReplies: [
        "Xem voucher giảm giá thêm",
        "Chính sách bảo hành đổi trả",
        "Xem thêm sản phẩm hot",
      ],
    };
  }

  // Mặc định: Trả lời thân thiện kèm gợi ý sản phẩm
  return {
    reply: `Chào bạn! Cảm ơn bạn đã trò chuyện cùng Stylist AI. Mình đã tổng hợp một số gợi ý trang phục bán chạy và được yêu thích nhất tuần này dành cho bạn:`,
    conversationId: request.conversationId,
    products: catalog.slice(0, 3),
    quickReplies: [
      "Gợi ý đồ đi tiệc cuối tuần 🥂",
      "Tìm áo sơ mi công sở 👔",
      "Săn sale hot giảm 50% 🔥",
      "Bảng tư vấn size 📏",
    ],
  };
}

export const chatbotService = {
  /**
   * Send message to FastAPI agent backend (blocking request)
   */
  async sendMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
    const fastApiUrl = `${FASTAPI_BASE_URL.replace(/\/+$/, "")}/api/v1/chat`;

    try {
      const response = await axios.post<any>(
        fastApiUrl,
        {
          message: request.message,
          session_id: request.conversationId,
          conversation_id: request.conversationId,
          history: request.history || [],
          user_profile: request.userProfile,
          clarification_mode:
            request.clarificationMode || "MINIMAL_CLARIFICATION",
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
        products: data.products || [],
        quickReplies: data.quick_replies || data.quickReplies || [],
      };
    } catch {
      // Fallback mock intelligence when FastAPI backend is offline
      let liveProducts: any[] = [];
      try {
        const shopRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/products`,
          { params: { limit: 6 }, timeout: 3000 },
        );
        liveProducts = shopRes.data?.data || shopRes.data || [];
      } catch {
        // Shop BE may also be offline, FALLBACK_PRODUCTS will be used
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockResponse(request, liveProducts);
    }
  },

  /**
   * Stream message token-by-token from FastAPI SSE endpoint with typewriter effect
   */
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
          clarification_mode:
            request.clarificationMode || "MINIMAL_CLARIFICATION",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "token" || parsed.type === "clarification") {
              const text = String(parsed.content || "");
              accumulatedReply += text;
              onToken(text);
            } else if (parsed.type === "done") {
              finalResult = {
                reply: parsed.reply || accumulatedReply,
                conversationId: parsed.session_id || request.conversationId,
                products: parsed.products || [],
                quickReplies: parsed.quick_replies || [],
              };
            } else if (parsed.type === "error") {
              throw new Error(parsed.content || "Lỗi tạo câu trả lời");
            }
          } catch (e: any) {
            if (e?.message !== "Lỗi tạo câu trả lời") {
              // Non-fatal parse warning
            } else {
              throw e;
            }
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
          quickReplies: [],
        });
      }
    } catch {
      // Fallback: Use mock response with typewriter effect
      try {
        let liveProducts: any[] = [];
        try {
          const shopRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/products`,
            { params: { limit: 6 }, timeout: 2000 },
          );
          liveProducts = shopRes.data?.data || shopRes.data || [];
        } catch {
          // Shop BE offline, FALLBACK_PRODUCTS used
        }

        const mock = generateMockResponse(request, liveProducts);
        // Simulate progressive typing for smooth UX even in fallback mode
        const words = mock.reply.split(" ");
        for (let i = 0; i < words.length; i++) {
          const word = (i === 0 ? "" : " ") + words[i];
          onToken(word);
          await new Promise((r) => setTimeout(r, 20));
        }
        onDone(mock);
      } catch (err: any) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  },
};
