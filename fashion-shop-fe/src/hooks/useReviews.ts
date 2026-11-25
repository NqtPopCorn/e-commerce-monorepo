import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsService } from "@/services/reviews.service";
import { useAuthStore } from "@/stores/auth.store";
import {
  AdminQueryReviewsParams,
  CreateReviewPayload,
  QueryReviewsParams,
  ReviewStatus,
  UpdateReviewPayload,
} from "@/types/review";

export const useGetProductReviews = (
  productId?: number | null,
  params?: QueryReviewsParams,
) => {
  return useQuery({
    queryKey: ["product-reviews", productId, params],
    queryFn: () => reviewsService.getProductReviews(productId!, params),
    enabled: !!productId,
  });
};

export const useGetReviewEligibility = (productId?: number | null) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["review-eligibility", productId],
    queryFn: () => reviewsService.checkEligibility(productId!),
    enabled: !!token && !!productId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      reviewsService.createReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateReviewPayload;
    }) => reviewsService.updateReview(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });
};

export const useToggleReviewLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewsService.toggleLike(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
};

export const useGetAdminReviews = (params?: AdminQueryReviewsParams) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["admin-reviews", params],
    queryFn: () => reviewsService.adminGetReviews(params),
    enabled: !!token && (user?.role === "ADMIN" || user?.role === "STAFF"),
  });
};

export const useAdminReplyReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      replyContent,
    }: {
      id: number;
      replyContent: string;
    }) => reviewsService.adminReply(id, replyContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
  });
};

export const useAdminUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: ReviewStatus;
    }) => reviewsService.adminUpdateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};
