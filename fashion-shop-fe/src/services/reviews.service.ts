import { api } from "@/lib/api";
import {
  AdminQueryReviewsParams,
  AdminReviewsResponse,
  CreateReviewPayload,
  ProductReviewsResponse,
  QueryReviewsParams,
  Review,
  ReviewEligibilityResponse,
  ReviewStatus,
  UpdateReviewPayload,
} from "@/types/review";

export const reviewsService = {
  getProductReviews: async (
    productId: number,
    params?: QueryReviewsParams,
  ): Promise<ProductReviewsResponse> => {
    const res = await api.get(`/products/${productId}/reviews`, { params });
    return res.data;
  },

  checkEligibility: async (
    productId: number,
  ): Promise<ReviewEligibilityResponse> => {
    const res = await api.get(`/products/${productId}/review-eligibility`);
    return res.data;
  },

  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    const res = await api.post("/reviews", payload);
    return res.data;
  },

  updateReview: async (
    id: number,
    payload: UpdateReviewPayload,
  ): Promise<Review> => {
    const res = await api.put(`/reviews/${id}`, payload);
    return res.data;
  },

  toggleLike: async (
    id: number,
  ): Promise<{ liked: boolean; likesCount: number }> => {
    const res = await api.post(`/reviews/${id}/like`);
    return res.data;
  },

  adminGetReviews: async (
    params?: AdminQueryReviewsParams,
  ): Promise<AdminReviewsResponse> => {
    const res = await api.get("/admin/reviews", { params });
    return res.data;
  },

  adminReply: async (id: number, replyContent: string): Promise<Review> => {
    const res = await api.post(`/admin/reviews/${id}/reply`, { replyContent });
    return res.data;
  },

  adminUpdateStatus: async (
    id: number,
    status: ReviewStatus,
  ): Promise<Review> => {
    const res = await api.patch(`/admin/reviews/${id}/status`, { status });
    return res.data;
  },
};
