"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  Filter,
  Eye,
  EyeOff,
  MessageSquare,
  Reply,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Package,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetAdminReviews,
  useAdminReplyReview,
  useAdminUpdateReviewStatus,
} from "@/hooks/useReviews";
import {
  AdminQueryReviewsParams,
  ProductFit,
  Review,
  ReviewStatus,
} from "@/types/review";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [replyFilter, setReplyFilter] = useState<string>("ALL");

  // Reply Dialog state
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");

  // Lightbox state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const queryParams: AdminQueryReviewsParams = {
    page,
    limit: 15,
    search: search.trim() || undefined,
    rating: ratingFilter !== "ALL" ? Number(ratingFilter) : undefined,
    status: statusFilter !== "ALL" ? (statusFilter as ReviewStatus) : undefined,
    hasReply:
      replyFilter === "REPLIED"
        ? true
        : replyFilter === "UNREPLIED"
          ? false
          : undefined,
  };

  const { data, isLoading, refetch } = useGetAdminReviews(queryParams);
  const replyMutation = useAdminReplyReview();
  const updateStatusMutation = useAdminUpdateReviewStatus();

  const reviews = data?.items || [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  const handleOpenReply = (review: Review) => {
    setReplyReview(review);
    setReplyContent(review.replyContent || "");
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReview) return;
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      await replyMutation.mutateAsync({
        id: replyReview.id,
        replyContent: replyContent.trim(),
      });
      toast.success("Đã gửi phản hồi thành công!");
      setReplyReview(null);
      setReplyContent("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể gửi phản hồi. Vui lòng thử lại.",
      );
    }
  };

  const handleToggleStatus = async (review: Review) => {
    const nextStatus: ReviewStatus =
      review.status === "APPROVED" ? "HIDDEN" : "APPROVED";
    try {
      await updateStatusMutation.mutateAsync({
        id: review.id,
        status: nextStatus,
      });
      toast.success(
        nextStatus === "APPROVED"
          ? "Đã hiển thị lại đánh giá này công khai"
          : "Đã ẩn đánh giá này khỏi trang sản phẩm",
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật trạng thái.",
      );
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setRatingFilter("ALL");
    setStatusFilter("ALL");
    setReplyFilter("ALL");
    setPage(1);
  };

  const getFitBadge = (fit?: ProductFit | null) => {
    switch (fit) {
      case "TIGHT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
            Hơi chật
          </span>
        );
      case "TRUE_TO_SIZE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
            Chuẩn size
          </span>
        );
      case "LOOSE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
            Hơi rộng
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý Đánh giá sản phẩm
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi điểm đánh giá, phản hồi ý kiến khách hàng và kiểm duyệt nội dung vi phạm.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Điểm TB toàn sàn
            </span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-foreground">
            {stats?.averageRating ? stats.averageRating.toFixed(2) : "0.00"}
            <span className="text-sm font-normal text-muted-foreground"> / 5.0</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tính trên các đánh giá đang công khai
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Tổng lượt đánh giá
            </span>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-foreground">
            {stats?.totalReviews || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tất cả đánh giá từ người mua hàng
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Chưa phản hồi
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats?.unrepliedCount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cần shop phản hồi chăm sóc khách hàng
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Đánh giá bị ẩn
            </span>
            <EyeOff className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-foreground">
            {stats?.hiddenCount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Bị ẩn do vi phạm hoặc yêu cầu kiểm duyệt
          </p>
        </div>
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo nội dung, tên khách, email, mã đơn..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          {/* Rating filter */}
          <div className="lg:col-span-2">
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">5 Sao ★★★★★</option>
              <option value="4">4 Sao ★★★★</option>
              <option value="3">3 Sao ★★★</option>
              <option value="2">2 Sao ★★</option>
              <option value="1">1 Sao ★</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đang hiển thị (APPROVED)</option>
              <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
            </select>
          </div>

          {/* Reply filter */}
          <div className="lg:col-span-2">
            <select
              value={replyFilter}
              onChange={(e) => {
                setReplyFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả phản hồi</option>
              <option value="UNREPLIED">Chưa phản hồi</option>
              <option value="REPLIED">Đã phản hồi</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="lg:col-span-1 flex items-center">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleResetFilters}
              className="w-full h-10 rounded-xl text-xs gap-1"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Reviews Data Table */}
      <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Đánh giá</th>
                <th className="py-3 px-4 min-w-[260px]">Nội dung & Feedback</th>
                <th className="py-3 px-4 min-w-[200px]">Phản hồi từ Shop</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Đang tải dữ liệu đánh giá...</span>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-semibold text-foreground">Không tìm thấy đánh giá nào</p>
                    <p className="text-xs">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const variant = review.orderItem?.variant;
                  const variantText = [variant?.color, variant?.size ? `Size ${variant.size}` : ""]
                    .filter(Boolean)
                    .join(" - ");

                  return (
                    <tr
                      key={review.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Product */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <Link
                            href={`/products/${review.productId}`}
                            target="_blank"
                            className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1 group line-clamp-1"
                            title={review.product?.name}
                          >
                            <span>{review.product?.name || `SP #${review.productId}`}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                          {variantText && (
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {variantText}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/80 font-mono">
                            Đơn hàng #{review.orderId}
                          </p>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {review.user?.firstName && review.user?.lastName
                              ? `${review.user.firstName} ${review.user.lastName}`
                              : review.user?.firstName || "Khách hàng"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {review.user?.email}
                          </p>
                          {(review.userHeight || review.userWeight) && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {[
                                review.userHeight ? `${review.userHeight}cm` : "",
                                review.userWeight ? `${review.userWeight}kg` : "",
                              ]
                                .filter(Boolean)
                                .join(" / ")}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Rating & Fit */}
                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted/40 fill-muted/20"
                              }`}
                            />
                          ))}
                        </div>
                        <div>{getFitBadge(review.fit)}</div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </td>

                      {/* Content & Feedback images */}
                      <td className="py-3.5 px-4 align-top space-y-2">
                        {review.content ? (
                          <p className="text-xs text-foreground/90 whitespace-pre-line line-clamp-3">
                            {review.content}
                          </p>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            (Không có nhận xét viết)
                          </span>
                        )}

                        {review.images && review.images.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                            {review.images.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPreviewImage(img)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0 hover:scale-105 transition-all cursor-pointer group bg-muted/40"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img}
                                  alt={`Thumb ${idx}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Shop Reply */}
                      <td className="py-3.5 px-4 align-top">
                        {review.replyContent ? (
                          <div className="space-y-1">
                            <p className="text-xs text-foreground line-clamp-3">
                              {review.replyContent}
                            </p>
                            {review.repliedAt && (
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(review.repliedAt).toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-md">
                            Chưa phản hồi
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {review.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <EyeOff className="w-3 h-3 text-rose-600" />
                            Đã ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReply(review)}
                            className="h-8 px-2.5 text-xs rounded-xl gap-1 text-primary hover:bg-primary/10"
                            title="Phản hồi khách hàng"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>{review.replyContent ? "Sửa trả lời" : "Trả lời"}</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(review)}
                            className={`h-8 w-8 p-0 rounded-xl ${
                              review.status === "APPROVED"
                                ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            }`}
                            title={
                              review.status === "APPROVED"
                                ? "Ẩn đánh giá này"
                                : "Hiện đánh giá này"
                            }
                          >
                            {review.status === "APPROVED" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Hiển thị {(page - 1) * 15 + 1} -{" "}
              {Math.min(page * 15, pagination.total)} trên tổng số{" "}
              {pagination.total} đánh giá
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl text-xs"
              >
                Trang trước
              </Button>
              <span className="font-semibold text-muted-foreground px-2">
                {page} / {pagination.totalPages}
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
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      {replyReview && (
        <Dialog
          open={Boolean(replyReview)}
          onOpenChange={(open) => !open && setReplyReview(null)}
        >
          <DialogContent className="sm:max-w-lg rounded-2xl p-6">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Reply className="w-4 h-4 text-primary" />
                <span>Phản hồi đánh giá của {replyReview.user?.firstName || "khách hàng"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Câu trả lời sẽ được hiển thị công khai ngay dưới đánh giá của khách trên trang sản phẩm.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitReply} className="space-y-4 pt-2">
              {/* Review summary preview */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {replyReview.product?.name}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= replyReview.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {replyReview.content && (
                  <p className="text-muted-foreground line-clamp-2 italic">
                    "{replyReview.content}"
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nội dung phản hồi từ thương hiệu
                </label>
                <Textarea
                  placeholder="Nhập lời cảm ơn hoặc thông tin giải đáp/hỗ trợ đổi trả cho khách hàng..."
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="text-xs rounded-xl resize-none"
                  maxLength={1000}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyReview(null)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={replyMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs gap-1.5"
                >
                  {replyMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Gửi phản hồi</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Feedback zoom"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
