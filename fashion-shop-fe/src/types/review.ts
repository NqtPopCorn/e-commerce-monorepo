export type ProductFit = "TIGHT" | "TRUE_TO_SIZE" | "LOOSE";

export type ReviewStatus = "APPROVED" | "HIDDEN";

export type ReviewSortOption = "newest" | "highest" | "lowest" | "most_helpful";

export interface ReviewUser {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface ReviewOrderItemVariant {
  id: number;
  sku: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  imageUrl?: string | null;
}

export interface ReviewOrderItem {
  id: number;
  orderId: number;
  variantId: number;
  variant?: ReviewOrderItemVariant;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  orderId: number;
  orderItemId: number;
  rating: number;
  content?: string | null;
  images: string[];
  fit?: ProductFit | null;
  userHeight?: number | null;
  userWeight?: number | null;
  replyContent?: string | null;
  repliedAt?: string | null;
  repliedBy?: number | null;
  likesCount: number;
  isLiked?: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
  product?: {
    id: number;
    name: string;
    slug: string;
  };
  orderItem?: ReviewOrderItem;
}

export interface ReviewStatistics {
  averageRating: number;
  totalReviews: number;
  starDistribution: Record<number, number>;
  fitDistribution: {
    TIGHT: number;
    TRUE_TO_SIZE: number;
    LOOSE: number;
  };
  withImagesCount: number;
}

export interface ProductReviewsResponse {
  items: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: ReviewStatistics;
}

export interface EligibleOrderItem {
  orderItemId: number;
  orderId: number;
  orderDate: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  isReviewed: boolean;
  isEditable: boolean;
  review?: Review | null;
}

export interface ReviewEligibilityResponse {
  canReview: boolean;
  eligibleItems: EligibleOrderItem[];
}

export interface CreateReviewPayload {
  orderItemId: number;
  rating: number;
  content?: string;
  images?: string[];
  fit?: ProductFit;
  userHeight?: number;
  userWeight?: number;
}

export interface UpdateReviewPayload {
  rating?: number;
  content?: string;
  images?: string[];
  fit?: ProductFit;
  userHeight?: number;
  userWeight?: number;
}

export interface QueryReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
  hasImages?: boolean;
  fit?: ProductFit;
  sort?: ReviewSortOption;
}

export interface AdminQueryReviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  rating?: number;
  status?: ReviewStatus;
  hasReply?: boolean;
}

export interface AdminReviewsResponse {
  items: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalReviews: number;
    averageRating: number;
    unrepliedCount: number;
    hiddenCount: number;
  };
}
