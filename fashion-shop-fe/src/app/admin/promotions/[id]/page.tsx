"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { PromotionDetailView } from "@/components/admin/promotions/PromotionDetailView";
import {
  useGetPromotion,
  useUpdatePromotion,
  useDeletePromotion,
} from "@/hooks/usePromotions";
import { CreatePromotionDto } from "@/types/promotion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PromotionDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const promotionId = Number(id);

  const [isEditing, setIsEditing] = useState(
    searchParams.get("edit") === "true",
  );

  const { data: promotion, isLoading, isError } = useGetPromotion(id as string);
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
        <span className="text-xs text-slate-500">
          Đang tải dữ liệu chương trình khuyến mãi...
        </span>
      </div>
    );
  }

  if (isError || !promotion) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600">
          Không tìm thấy chương trình khuyến mãi này.
        </p>
        <Link href="/admin/promotions">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (data: CreatePromotionDto) => {
    updateMutation.mutate(
      { id: promotionId, data },
      {
        onSuccess: () => {
          toast.success("Cập nhật chương trình khuyến mãi thành công");
          setIsEditing(false);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.message ||
              "Cập nhật thất bại. Vui lòng kiểm tra lại.",
          );
        },
      },
    );
  };

  const handleDelete = () => {
    if (
      confirm(`Bạn có chắc chắn muốn xóa chương trình "${promotion.name}"?`)
    ) {
      deleteMutation.mutate(promotionId, {
        onSuccess: () => {
          toast.success("Đã xóa chương trình khuyến mãi thành công");
          router.push("/admin/promotions");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Xóa thất bại");
        },
      });
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <PromotionDetailView
          promotion={promotion}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Hủy & Quay lại xem chi tiết
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            Chỉnh sửa: {promotion.name}
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs">
            Cập nhật các thông số chiết khấu và cấu hình nhóm sản phẩm.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(false)}
          className="text-xs h-8 border-slate-300"
        >
          Thoát chế độ sửa
        </Button>
      </div>

      <PromotionForm
        initialData={promotion}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
