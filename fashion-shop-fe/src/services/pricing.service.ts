import { api } from "@/lib/api";
import { OrderQuote, QuoteRequest } from "@/types/pricing";

export const pricingService = {
  quote: async (payload: QuoteRequest): Promise<OrderQuote> => {
    const res = await api.post("/pricing/quote", payload);
    return res.data;
  },
};
