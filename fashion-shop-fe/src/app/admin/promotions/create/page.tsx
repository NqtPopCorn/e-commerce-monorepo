"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { useCreatePromotion } from "@/hooks/usePromotions";
import { CreatePromotionDto } from "@/types/promotion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
          err.response?.data?.message || "Tạo thất bại. Vui lòng kiểm tra lại dữ liệu.",
        );
      },
    });
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
          Tạo Chương trình Khuyến mãi mới
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Thiết lập Voucher, Khuyến mãi tự động hóa đơn, hoặc Campaign giảm giá sản phẩm.
        </p>
      </div>
      <PromotionForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
}
