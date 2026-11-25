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

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: "single" | "multiple";
  options: string[];
  allow_custom?: boolean;
  custom_placeholder?: string;
}

export interface ClarificationForm {
  title: string;
  submit_label: string;
  questions: ClarificationQuestion[];
}

export interface LangChainUsageMetadata {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_token_details?: Record<string, any>;
  output_token_details?: Record<string, any>;
}

export interface LangChainToolCall {
  id?: string;
  name: string;
  args: Record<string, any>;
  type?: "tool_call";
}

export interface LangChainMessageDump {
  type: string;
  content: string | any[];
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  usage_metadata?: Record<string, any>;
  response_metadata?: Record<string, any>;
}

export interface LangChainRunTrace {
  run_id: string;
  parent_run_id?: string | null;
  name: string;
  run_type: "chat_model" | "llm" | "tool" | "chain";
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  metadata?: Record<string, any>;
  usage_metadata?: LangChainUsageMetadata | null;
  latency_ms: number;
  error?: string | null;
}

export interface StateSnapshotDebug {
  clarify_phase: string;
  gated_turns: number;
  tools_available: string[];
  gate_search: boolean;
  active_profile?: Record<string, any> | null;
  detected_slots: Record<string, any>;
  context_messages_count: number;
}

export interface ChatbotDebugMeta {
  mode?: string;
  phase?: string;
  gated_turns?: number;
  tools_available?: string[];
  latency_ms?: number;
  usage_metadata?: LangChainUsageMetadata | null;
  runs?: LangChainRunTrace[];
  state_snapshot?: StateSnapshotDebug | null;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  products?: ChatRecommendedProduct[];
  clarificationForm?: ClarificationForm;
  clarificationAsked?: boolean;
  submittedAnswers?: Record<string, string[]>;
  debugMeta?: ChatbotDebugMeta;
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
  clarificationForm?: ClarificationForm;
  clarificationAsked?: boolean;
  debugMeta?: ChatbotDebugMeta;
}
