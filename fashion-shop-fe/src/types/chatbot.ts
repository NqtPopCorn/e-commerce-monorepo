export interface ChatRecommendedProduct {
  id: number;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  products?: ChatRecommendedProduct[];
  quickReplies?: string[];
  status?: "sending" | "sent" | "error";
}

export interface ChatbotRequest {
  message: string;
  conversationId: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface ChatbotResponse {
  reply: string;
  conversationId?: string;
  products?: ChatRecommendedProduct[];
  quickReplies?: string[];
}
