"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, UploadCloud, X, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ProductFit, Review } from "@/types/review";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { uploadService } from "@/services/upload.service";

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItemId: number;
  productName: string;
  variantText?: string;
  productImageUrl?: string;
  initialReview?: Review | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng & Tuyệt vời",
};

export function ReviewFormModal({
  isOpen,
  onClose,
  orderItemId,
  productName,
  variantText,
  productImageUrl,
  initialReview,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState<string>("");
  const [fit, setFit] = useState<ProductFit | undefined>("TRUE_TO_SIZE");
  const [userHeight, setUserHeight] = useState<string>("");
  const [userWeight, setUserWeight] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const isEditing = Boolean(initialReview);

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating || 5);
      setContent(initialReview.content || "");
      setFit(initialReview.fit || "TRUE_TO_SIZE");
      setUserHeight(initialReview.userHeight ? String(initialReview.userHeight) : "");
      setUserWeight(initialReview.userWeight ? String(initialReview.userWeight) : "");
      setImages(initialReview.images || []);
    } else {
      setRating(5);
      setContent("");
      setFit("TRUE_TO_SIZE");
      setUserHeight("");
      setUserWeight("");
      setImages([]);
    }
  }, [initialReview, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error("Tối đa chỉ được tải lên 5 hình ảnh feedback");
      return;
    }

    setIsUploading(true);
    try {
      const fileList = Array.from(files);
      const results = await uploadService.uploadMultiple(fileList, "reviews");
      const newUrls = results.map((r) => r.url);
      setImages((prev) => [...prev, ...newUrls].slice(0, 5));
      toast.success(`Đã tải lên ${newUrls.length} ảnh`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải ảnh lên. Vui lòng thử lại.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    const heightNum = userHeight ? parseInt(userHeight, 10) : undefined;
    const weightNum = userWeight ? parseInt(userWeight, 10) : undefined;

    try {
      if (isEditing && initialReview) {
        await updateMutation.mutateAsync({
          id: initialReview.id,
          payload: {
            rating,
            content: content.trim() || undefined,
            fit,
            userHeight: heightNum,
            userWeight: weightNum,
            images,
          },
        });
        toast.success("Cập nhật đánh giá thành công!");
      } else {
        await createMutation.mutateAsync({
          orderItemId,
          rating,
          content: content.trim() || undefined,
          fit,
          userHeight: heightNum,
          userWeight: weightNum,
          images,
        });
        toast.success("Cảm ơn bạn đã gửi đánh giá sản phẩm!");
      }
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.",
      );
    }
  };

  const activeStarCount = hoverRating || rating;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span>{isEditing ? "Chỉnh sửa đánh giá sản phẩm" : "Đánh giá sản phẩm"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Đánh giá của bạn giúp cộng đồng chọn đúng size và giúp shop nâng cao chất lượng phục vụ.
          </DialogDescription>
        </DialogHeader>

        {/* Product mini bar */}
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60">
          <div className="w-12 h-14 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImageUrl}
                alt={productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground line-clamp-1">
              {productName}
            </p>
            {variantText && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Phân loại: {variantText}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Star Rating Section */}
          <div className="space-y-2 text-center py-2 bg-slate-50 dark:bg-muted/30 rounded-xl border border-border/50">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Chất lượng sản phẩm
            </Label>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= activeStarCount
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "text-muted/80 fill-muted/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 min-h-[18px]">
              {RATING_LABELS[activeStarCount] || ""}
            </p>
          </div>

          {/* Fit Selection (Fashion Feature) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              Độ vừa vặn (Form dáng)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "TIGHT" as ProductFit, label: "Hơi chật" },
                { value: "TRUE_TO_SIZE" as ProductFit, label: "Chuẩn size (Vừa vặn)" },
                { value: "LOOSE" as ProductFit, label: "Hơi rộng" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFit(item.value)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                    fit === item.value
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 font-bold shadow-2xs"
                      : "border-border hover:bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body specs (Height / Weight - optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Chiều cao người mặc (cm) <span className="text-muted-foreground font-normal">(tùy chọn)</span>
              </Label>
              <Input
                type="number"
                placeholder="VD: 165"
                min={50}
                max={250}
                value={userHeight}
                onChange={(e) => setUserHeight(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Cân nặng người mặc (kg) <span className="text-muted-foreground font-normal">(tùy chọn)</span>
              </Label>
              <Input
                type="number"
                placeholder="VD: 54"
                min={20}
                max={200}
                value={userWeight}
                onChange={(e) => setUserWeight(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Content review text */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-foreground">
                Nhận xét chi tiết
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {content.length}/1000 ký tự
              </span>
            </div>
            <Textarea
              placeholder="Chia sẻ về chất vải, độ bền màu, đường may, trải nghiệm khi mặc để giúp người khác chọn đồ dễ hơn bạn nhé..."
              rows={4}
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs rounded-xl resize-none"
            />
          </div>

          {/* Image Upload section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-foreground">
                Hình ảnh thực tế <span className="text-muted-foreground font-normal">(Tối đa 5 ảnh)</span>
              </Label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {images.length}/5 ảnh
              </span>
            </div>

            {/* Thumbnail preview list */}
            <div className="flex flex-wrap gap-2.5 items-center">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group bg-muted/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Feedback ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-0.5 rounded-full opacity-90 transition-opacity"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border border-dashed border-border hover:border-primary/60 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Thêm ảnh</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Lưu thay đổi" : "Gửi đánh giá"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
