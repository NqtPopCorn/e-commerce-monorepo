"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { useGetPromotion, useUpdatePromotion } from "@/hooks/usePromotions";
import { CreatePromotionDto } from "@/types/promotion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditPromotionPage() {
  const { id } = useParams();
  const router = useRouter();
  const promotionId = Number(id);

  const { data: promotion, isLoading, isError } = useGetPromotion(id as string);
  const updateMutation = useUpdatePromotion();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Đang tải dữ liệu chương trình khuyến mãi...
      </div>
    );
  }

  if (isError || !promotion) {
    return (
      <div className="p-8 text-center text-red-500">
        Không tìm thấy chương trình khuyến mãi này.
      </div>
    );
  }

  const handleSubmit = (data: CreatePromotionDto) => {
    updateMutation.mutate(
      { id: promotionId, data },
      {
        onSuccess: () => {
          toast.success("Cập nhật chương trình khuyến mãi thành công");
          router.push("/admin/promotions");
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.message || "Cập nhật thất bại. Vui lòng kiểm tra lại.",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/promotions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Chỉnh sửa: {promotion.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cập nhật thông tin chi tiết cho chương trình {promotion.kind}.
        </p>
      </div>
      <PromotionForm
        initialData={promotion}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
