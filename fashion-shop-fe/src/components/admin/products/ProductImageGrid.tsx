"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Plus,
  Trash2,
  Image as ImageIcon,
  Star,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadService } from "@/services/upload.service";

interface ProductImageGridProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

export function ProductImageGrid({
  images,
  onChange,
  disabled = false,
}: ProductImageGridProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  const handleUploadFile = async (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        `Định dạng "${file.type}" không hợp lệ. Chỉ chấp nhận file ảnh.`,
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `Dung lượng file (${(file.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn 5 MB.`,
      );
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadService.uploadSingle(file, "products");
      onChange([...images, res.url]);
      toast.success("Đã tải ảnh lên");
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải ảnh lên. Kiểm tra kết nối rồi thử lại.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const f of files) {
      await handleUploadFile(f);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files || []);
    for (const f of files) {
      await handleUploadFile(f);
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Nhập đường dẫn URL ảnh");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setUrlError("Đường dẫn URL không hợp lệ");
      return;
    }

    setUrlError("");
    onChange([...images, trimmed]);
    setUrlInput("");
    setShowUrlInput(false);
    toast.success("Đã thêm liên kết ảnh");
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([item, ...rest]);
    setFailedImages({});
    toast.success("Đã đặt làm ảnh chính");
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    const nextFailed = { ...failedImages };
    delete nextFailed[index];
    setFailedImages(nextFailed);
  };

  const handleImageError = (index: number) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Ảnh sản phẩm</h2>
          <p className="text-sm text-muted-foreground">
            Ảnh đầu tiên là ảnh chính.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setShowUrlInput(!showUrlInput);
            setUrlError("");
          }}
          disabled={disabled || isUploading}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Thêm từ liên kết
        </Button>
      </div>

      {/* Inline URL Input */}
      {showUrlInput && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
          <form onSubmit={handleAddUrl} className="flex gap-2 items-center">
            <Input
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (urlError) setUrlError("");
              }}
              placeholder="https://example.com/photo.jpg"
              className="h-9 text-sm bg-background flex-1"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs shrink-0"
              disabled={disabled || isUploading}
            >
              Thêm
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput("");
                setUrlError("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </form>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(",")}
        onChange={handleFilesSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Grid of Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {/* Dropzone Tile */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) fileInputRef.current?.click();
          }}
          className={`aspect-square border-2 border-dashed rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/40 bg-muted/10 hover:bg-muted/30"
          } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[11px] font-medium">Đang tải...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <UploadCloud className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                Chọn ảnh hoặc kéo thả vào đây
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                JPG, PNG, WEBP, GIF. Tối đa 5 MB mỗi ảnh
              </span>
            </div>
          )}
        </div>

        {/* Uploaded Thumbnails */}
        {images.map((url, idx) => {
          const isPrimary = idx === 0;
          const isFailed = failedImages[idx];

          return (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square rounded-lg border border-border bg-muted/20 overflow-hidden flex items-center justify-center"
            >
              {isFailed ? (
                <div className="flex flex-col items-center gap-1 p-2 text-center text-muted-foreground">
                  <ImageIcon className="w-6 h-6 opacity-40" />
                  <span className="text-[10px] truncate max-w-full">
                    Lỗi tải ảnh
                  </span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={url}
                  alt={`Ảnh ${idx + 1}`}
                  onError={() => handleImageError(idx)}
                  className="w-full h-full object-cover transition group-hover:scale-105 duration-200"
                />
              )}

              {/* Badge Ảnh chính */}
              {isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 z-10">
                  <Star className="w-3 h-3 fill-current" />
                  Ảnh chính
                </div>
              )}

              {/* Action Overlays */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                {!isPrimary && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] px-2 bg-background/90 hover:bg-background text-foreground shadow-xs"
                    onClick={() => handleSetPrimary(idx)}
                    title="Đặt làm ảnh chính"
                  >
                    Đặt ảnh chính
                  </Button>
                )}

                <button
                  type="button"
                  aria-label="Xóa ảnh"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition shadow-xs"
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
