"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { uploadService } from "@/services/upload.service";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string, key?: string) => void;
  folder?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = "general",
  maxSizeMB = 5,
  disabled = false,
  className = "",
  label,
  hint = "Hỗ trợ JPG, PNG, WEBP, GIF, SVG (Tối đa 5MB)",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  const handleFileProcess = async (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        `Định dạng "${file.type}" không hợp lệ. Chỉ chấp nhận file ảnh.`,
      );
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(
        `Dung lượng file (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn ${maxSizeMB}MB.`,
      );
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadService.uploadSingle(file, folder);
      toast.success("Tải ảnh lên thành công");
      onChange?.(result.url, result.key);
    } catch (err: any) {
      console.error("Upload error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải ảnh lên. Vui lòng thử lại.";
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("", "");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 block">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <div className="relative group border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 min-h-[160px] max-h-[220px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded preview"
            className="max-h-[180px] w-auto max-w-full object-contain rounded transition group-hover:opacity-90"
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs bg-white hover:bg-gray-100"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              Thay ảnh
            </Button>

            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-white text-gray-700 rounded-md hover:bg-gray-100"
              title="Xem ảnh gốc"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              title="Xóa ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-rose-500 bg-rose-50/50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50"
          } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3 text-rose-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">
                Đang tải ảnh lên hệ thống...
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500">
                <UploadCloud className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-rose-600 hover:underline">
                  Nhấn để chọn ảnh
                </span>{" "}
                hoặc kéo thả vào đây
              </div>
              {hint && <p className="text-xs text-gray-400">{hint}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
};
