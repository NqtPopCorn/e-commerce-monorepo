"use client";

import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ArrowUpDown,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetProductReviews,
  useGetReviewEligibility,
  useToggleReviewLike,
} from "@/hooks/useReviews";
import {
  ProductFit,
  Review,
  ReviewSortOption,
  QueryReviewsParams,
  EligibleOrderItem,
} from "@/types/review";
import { ReviewFormModal } from "./ReviewFormModal";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface ProductReviewsSectionProps {
  productId: number;
  productName: string;
  productImageUrl?: string;
}

export function ProductReviewsSection({
  productId,
  productName,
  productImageUrl,
}: ProductReviewsSectionProps) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // Filter & sort states
  const [page, setPage] = useState<number>(1);
  const [selectedRating, setSelectedRating] = useState<number | undefined>();
  const [hasImagesOnly, setHasImagesOnly] = useState<boolean>(false);
  const [selectedFit, setSelectedFit] = useState<ProductFit | undefined>();
  const [sort, setSort] = useState<ReviewSortOption>("newest");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] =
    useState<EligibleOrderItem | null>(null);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const queryParams: QueryReviewsParams = {
    page,
    limit: 8,
    rating: selectedRating,
    hasImages: hasImagesOnly ? true : undefined,
    fit: selectedFit,
    sort,
  };

  const { data, isLoading } = useGetProductReviews(productId, queryParams);
  const { data: eligibility } = useGetReviewEligibility(productId);
  const toggleLikeMutation = useToggleReviewLike();

  const reviews = data?.items || [];
  const statistics = data?.statistics;
  const pagination = data?.pagination;

  const handleOpenCreateModal = (item?: EligibleOrderItem) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để đánh giá sản phẩm");
      return;
    }
    if (item) {
      setSelectedOrderItem(item);
    } else if (eligibility?.eligibleItems && eligibility.eligibleItems.length > 0) {
      // Pick the first unreviewed item
      const unreviewed =
        eligibility.eligibleItems.find((i) => !i.isReviewed) ||
        eligibility.eligibleItems[0];
      setSelectedOrderItem(unreviewed);
    }
    setModalOpen(true);
  };

  const handleToggleLike = async (reviewId: number) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để thích đánh giá này");
      return;
    }
    try {
      await toggleLikeMutation.mutateAsync(reviewId);
    } catch {
      toast.error("Không thể thao tác. Vui lòng thử lại.");
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  // Helper mask name: e.g. "Nguyễn Văn Tuấn" -> "N***n"
  const maskUserName = (name?: string | null) => {
    if (!name || !name.trim()) return "Khách hàng";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      const p = parts[0];
      return p.length > 2 ? `${p[0]}***${p[p.length - 1]}` : `${p[0]}*`;
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first[0]}***${last}`;
  };

  const getFitLabel = (fit?: ProductFit | null) => {
    switch (fit) {
      case "TIGHT":
        return "Hơi chật";
      case "TRUE_TO_SIZE":
        return "Chuẩn size";
      case "LOOSE":
        return "Hơi rộng";
      default:
        return null;
    }
  };

  const averageRating = statistics?.averageRating || 0;
  const totalReviews = statistics?.totalReviews || 0;
  const starDist = statistics?.starDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const fitDist = statistics?.fitDistribution || { TIGHT: 0, TRUE_TO_SIZE: 0, LOOSE: 0 };
  const withImagesCount = statistics?.withImagesCount || 0;

  // Calculate percentage of true to size
  const totalFitRated = fitDist.TIGHT + fitDist.TRUE_TO_SIZE + fitDist.LOOSE;
  const trueToSizePercent =
    totalFitRated > 0 ? Math.round((fitDist.TRUE_TO_SIZE / totalFitRated) * 100) : 0;

  return (
    <section className="bg-white dark:bg-card p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 dark:border-border space-y-8 mt-8">
      {/* 1. Header Overview & Summary Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
            <span>Đánh giá từ khách hàng</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({totalReviews} nhận xét)
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Chỉ những khách hàng đã mua sản phẩm mới có thể để lại đánh giá.
          </p>
        </div>

        {/* Call to action if eligible */}
        {eligibility?.canReview && (
          <Button
            onClick={() => handleOpenCreateModal()}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Viết đánh giá của bạn
          </Button>
        )}
      </div>

      {/* 2. Rating Breakdown Box */}
      <div className="bg-slate-50 dark:bg-muted/30 p-6 rounded-2xl border border-slate-100 dark:border-border/60 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Overall Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border/70 pb-4 md:pb-0 md:pr-4">
          <div className="text-5xl font-black text-rose-600 dark:text-rose-500 tracking-tight">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30 fill-muted/20"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Dựa trên {totalReviews} đánh giá thực tế
          </p>
          {totalFitRated > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{trueToSizePercent}% nhận xét chuẩn kích cỡ</span>
            </div>
          )}
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = starDist[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-medium text-foreground flex items-center gap-1 shrink-0">
                  {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground font-mono text-[11px] shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filter Tags & Sorters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedRating(undefined);
              setHasImagesOnly(false);
              setSelectedFit(undefined);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              selectedRating === undefined && !hasImagesOnly && selectedFit === undefined
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-background border-border text-foreground hover:bg-muted"
            }`}
          >
            Tất cả ({totalReviews})
          </button>

          <button
            type="button"
            onClick={() => {
              setHasImagesOnly(!hasImagesOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              hasImagesOnly
                ? "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 shadow-xs"
                : "bg-background border-border text-foreground hover:bg-muted"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Có hình ảnh ({withImagesCount})
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSelectedRating(selectedRating === s ? undefined : s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                selectedRating === s
                  ? "bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 shadow-xs"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>({starDist[s] || 0})</span>
            </button>
          ))}

          {fitDist.TRUE_TO_SIZE > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedFit(selectedFit === "TRUE_TO_SIZE" ? undefined : "TRUE_TO_SIZE");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedFit === "TRUE_TO_SIZE"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 shadow-xs"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              Chuẩn size ({fitDist.TRUE_TO_SIZE})
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as ReviewSortOption);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-hidden cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="most_helpful">Hữu ích nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      {/* 4. Review List */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
            Đang tải danh sách đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-14 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              Chưa có đánh giá nào phù hợp với bộ lọc
            </p>
            <p className="text-xs text-muted-foreground">
              Hãy chọn bộ lọc khác hoặc là người đầu tiên chia sẻ cảm nhận về sản phẩm này!
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const fitLabel = getFitLabel(review.fit);
            const variant = review.orderItem?.variant;
            const variantDetails = [variant?.color, variant?.size ? `Size ${variant.size}` : ""]
              .filter(Boolean)
              .join(" - ");

            const isMyReview = user?.id === review.userId;
            const canEdit =
              isMyReview &&
              Date.now() - new Date(review.createdAt).getTime() <=
                30 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={review.id}
                className="p-5 rounded-2xl border border-border bg-card space-y-3.5 transition-all hover:border-border/80 shadow-2xs"
              >
                {/* Review Header: User info + verified purchase badge */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-muted text-foreground font-bold flex items-center justify-center uppercase text-sm shrink-0 overflow-hidden border">
                      {review.user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.user.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        review.user?.firstName?.[0] || "U"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {maskUserName(
                            review.user?.firstName && review.user?.lastName
                              ? `${review.user.firstName} ${review.user.lastName}`
                              : review.user?.firstName || "Khách hàng",
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã mua hàng
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30 fill-muted/20"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit button if owner and within 30 days */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderItem({
                          orderItemId: review.orderItemId,
                          orderId: review.orderId,
                          orderDate: review.createdAt,
                          size: variant?.size,
                          color: variant?.color,
                          sku: variant?.sku,
                          imageUrl: variant?.imageUrl,
                          isReviewed: true,
                          isEditable: true,
                          review,
                        });
                        setModalOpen(true);
                      }}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                  )}
                </div>

                {/* Fashion Attributes Line */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground bg-slate-50 dark:bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40">
                  {variantDetails && (
                    <span>
                      Phân loại: <strong>{variantDetails}</strong>
                    </span>
                  )}
                  {fitLabel && (
                    <>
                      <span>•</span>
                      <span>
                        Form dáng:{" "}
                        <strong className="text-foreground">{fitLabel}</strong>
                      </span>
                    </>
                  )}
                  {(review.userHeight || review.userWeight) && (
                    <>
                      <span>•</span>
                      <span>
                        Vóc dáng:{" "}
                        <strong>
                          {[
                            review.userHeight ? `${review.userHeight}cm` : "",
                            review.userWeight ? `${review.userWeight}kg` : "",
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </strong>
                      </span>
                    </>
                  )}
                </div>

                {/* Review Text Content */}
                {review.content && (
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {review.content}
                  </p>
                )}

                {/* Review Feedback Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                    {review.images.map((imgUrl, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        onClick={() => openLightbox(review.images, imgIdx)}
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-border hover:opacity-90 hover:scale-105 transition-all shrink-0 cursor-pointer group bg-muted/40 shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Ảnh feedback ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Seller / Shop Response Box */}
                {review.replyContent && (
                  <div className="bg-slate-50 dark:bg-muted/50 p-3.5 rounded-xl border border-border/70 space-y-1 mt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Phản hồi từ Fashion Shop
                      </span>
                      {review.repliedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(review.repliedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-5">
                      {review.replyContent}
                    </p>
                  </div>
                )}

                {/* Footer Interaction Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(review.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                      review.isLiked
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 font-bold"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        review.isLiked ? "fill-rose-600 text-rose-600" : ""
                      }`}
                    />
                    <span>Hữu ích ({review.likesCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl text-xs"
          >
            Trang trước
          </Button>
          <span className="text-xs font-semibold text-muted-foreground px-2">
            Trang {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="rounded-xl text-xs"
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Review Modal */}
      {modalOpen && (
        <ReviewFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedOrderItem(null);
          }}
          orderItemId={selectedOrderItem?.orderItemId || 0}
          productName={productName}
          variantText={
            [selectedOrderItem?.color, selectedOrderItem?.size ? `Size ${selectedOrderItem.size}` : ""]
              .filter(Boolean)
              .join(" - ") || undefined
          }
          productImageUrl={selectedOrderItem?.imageUrl || productImageUrl}
          initialReview={selectedOrderItem?.review || null}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((idx) =>
                  idx > 0 ? idx - 1 : lightboxImages.length - 1,
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="max-w-3xl max-h-[85vh] flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Feedback zoom ${lightboxIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <span className="text-white text-xs mt-3 font-medium">
              Ảnh {lightboxIndex + 1} / {lightboxImages.length}
            </span>
          </div>

          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((idx) =>
                  idx < lightboxImages.length - 1 ? idx + 1 : 0,
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
