"use client";

import React, { use, Suspense } from "react";
import {
  AdminPageHeader,
  AdminPageSkeleton,
  AdminErrorState,
} from "@/components/admin";
import { useGetCampaign } from "@/hooks/useCampaigns";
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

function EditCampaignContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { data: campaign, isLoading, isError, refetch } = useGetCampaign(id);

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError || !campaign) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          breadcrumbs={[
            { label: "Chiến dịch", href: "/admin/campaigns" },
            { label: "Chỉnh sửa" },
          ]}
          title="Không tìm thấy chiến dịch"
        />
        <AdminErrorState
          title="Không thể tải dữ liệu chiến dịch"
          description="Chiến dịch có thể đã bị xóa hoặc không tồn tại trên hệ thống."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Chiến dịch", href: "/admin/campaigns" },
          { label: campaign.name, href: `/admin/campaigns/${campaign.id}` },
          { label: "Chỉnh sửa" },
        ]}
        title={`Chỉnh sửa: ${campaign.name}`}
        description="Cập nhật thông tin, thời gian diễn ra hoặc giới hạn ngân sách chiến dịch."
      />

      <CampaignForm initialData={campaign} isEdit={true} />
    </div>
  );
}

export default function EditCampaignPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <EditCampaignContent params={params} />
    </Suspense>
  );
}
