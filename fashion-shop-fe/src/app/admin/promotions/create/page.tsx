"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { useCreatePromotion } from "@/hooks/usePromotions";
import { CreatePromotionDto } from "@/types/promotion";
import { toast } from "sonner";

export default function CreatePromotionPage() {
  const router = useRouter();
  const createMutation = useCreatePromotion();

  const handleSubmit = (data: CreatePromotionDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Tạo chương trình khuyến mãi thành công");
        router.push("/admin/promotions");
      },
      onError: (err: any) => {
        toast.error(
          err.response?.data?.message ||
            "Tạo thất bại. Vui lòng kiểm tra lại dữ liệu.",
        );
      },
    });
  };

  return (
    <PromotionForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      onCancel={() => router.push("/admin/promotions")}
    />
  );
}
