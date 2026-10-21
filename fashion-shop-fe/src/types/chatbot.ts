export interface ChatRecommendedProduct {
  id: number;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  discountPercent?: number;
  discount_percent?: number;
  imageUrl?: string;
  image_url?: string;
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
  isStreaming?: boolean;
}

export type ClarificationMode =
  | "IMMEDIATE_ANSWER"
  | "ALWAYS_CLARIFY"
  | "CONDITIONAL_CLARIFICATION";

export interface ChatbotRequest {
  message: string;
  conversationId: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  clarificationMode?: ClarificationMode | null;
  userProfile?: {
    height_cm?: number;
    weight_kg?: number;
    gender?: string;
    fit_preference?: string;
  };
}

export interface ChatbotResponse {
  reply: string;
  conversationId?: string;
  products?: ChatRecommendedProduct[];
  quickReplies?: string[];
}
