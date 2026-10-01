"use client";

import React, { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGetVoucher } from "@/hooks/useVouchers";
import { VoucherForm } from "@/components/admin/vouchers/VoucherForm";
import { VoucherDetailView } from "@/components/admin/vouchers/VoucherDetailView";
import {
  AdminPageSkeleton,
  AdminErrorState,
  AdminPageHeader,
} from "@/components/admin";

interface VoucherDetailPageProps {
  params: Promise<{ id: string }>;
}

function VoucherDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("mode") === "edit";

  const { data: voucher, isLoading, isError, refetch } = useGetVoucher(id);

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError || !voucher) {
    return (
      <AdminErrorState
        title="Không tìm thấy mã voucher"
        description="Mã voucher này có thể đã bị xóa hoặc đường dẫn không chính xác."
        onRetry={refetch}
      />
    );
  }

  if (isEdit) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          breadcrumbs={[
            { label: "Mã giảm giá", href: "/admin/vouchers" },
            { label: voucher.code, href: `/admin/vouchers/${voucher.id}` },
            { label: "Chỉnh sửa" },
          ]}
          title={`Chỉnh sửa voucher: ${voucher.code}`}
          description="Cập nhật điều kiện áp dụng, tỷ lệ giảm giá và giới hạn sử dụng voucher."
        />
        <VoucherForm initialData={voucher} isEdit={true} />
      </div>
    );
  }

  return <VoucherDetailView voucher={voucher} />;
}

export default function VoucherDetailPage({ params }: VoucherDetailPageProps) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <VoucherDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
