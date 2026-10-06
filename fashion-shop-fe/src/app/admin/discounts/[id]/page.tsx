"use client";

import React, { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGetDiscount } from "@/hooks/useDiscounts";
import { DiscountForm } from "@/components/admin/discounts/DiscountForm";
import { DiscountDetailView } from "@/components/admin/discounts/DiscountDetailView";
import {
  AdminPageSkeleton,
  AdminErrorState,
  AdminPageHeader,
} from "@/components/admin";

interface DiscountDetailPageProps {
  params: Promise<{ id: string }>;
}

function DiscountDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("mode") === "edit";

  const { data: discount, isLoading, isError, refetch } = useGetDiscount(id);

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError || !discount) {
    return (
      <AdminErrorState
        title="Không tìm thấy chương trình giảm giá"
        description="Chương trình này có thể đã bị xóa hoặc đường dẫn không chính xác."
        onRetry={refetch}
      />
    );
  }

  if (isEdit) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          breadcrumbs={[
            { label: "Giảm giá sản phẩm", href: "/admin/discounts" },
            { label: discount.name, href: `/admin/discounts/${discount.id}` },
            { label: "Chỉnh sửa" },
          ]}
          title={`Chỉnh sửa: ${discount.name}`}
          description="Cập nhật cấu hình ưu đãi, thời gian áp dụng và danh sách sản phẩm chiết khấu."
        />
        <DiscountForm initialData={discount} isEdit={true} />
      </div>
    );
  }

  return <DiscountDetailView discount={discount} />;
}

export default function DiscountDetailPage({
  params,
}: DiscountDetailPageProps) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <DiscountDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
