import React from "react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { CampaignStatus } from "@/types/campaign";

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  SCHEDULED: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
};

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  size?: "sm" | "md";
  className?: string;
}

export function CampaignStatusBadge({
  status,
  size = "md",
  className,
}: CampaignStatusBadgeProps) {
  return (
    <AdminStatusBadge
      status={status}
      customLabel={CAMPAIGN_STATUS_LABELS[status] || status}
      size={size}
      className={className}
    />
  );
}
