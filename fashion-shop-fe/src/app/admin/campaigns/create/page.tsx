"use client";

import React, { Suspense } from "react";
import { AdminPageHeader, AdminPageSkeleton } from "@/components/admin";
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm";

function CreateCampaignContent() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Chiến dịch", href: "/admin/campaigns" },
          { label: "Tạo mới" },
        ]}
        title="Tạo chiến dịch mới"
        description="Khởi tạo chiến dịch khuyến mãi để gom nhóm các đợt giảm giá sản phẩm và voucher."
      />

      <CampaignForm />
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <CreateCampaignContent />
    </Suspense>
  );
}
