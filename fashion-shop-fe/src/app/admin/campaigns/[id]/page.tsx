"use client";

import React, { use, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminPageHeader,
  AdminPageSkeleton,
  AdminErrorState,
  AdminConfirmDialog,
} from "@/components/admin";
import { useGetCampaignStats, useDeleteCampaign } from "@/hooks/useCampaigns";
import { CampaignStatsDashboard } from "@/components/admin/campaigns/CampaignStatsDashboard";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

function CampaignDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const { data: stats, isLoading, isError, refetch } = useGetCampaignStats(id);
  const deleteMutation = useDeleteCampaign();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Đã xóa chiến dịch thành công");
      router.push("/admin/campaigns");
    } catch {
      toast.error("Không thể xóa chiến dịch. Vui lòng thử lại.");
    }
  };

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError || !stats) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          breadcrumbs={[
            { label: "Chiến dịch", href: "/admin/campaigns" },
            { label: "Chi tiết" },
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
          { label: stats.campaign.name },
        ]}
        title={stats.campaign.name}
        description="Báo cáo thống kê hiệu quả, phân bổ ngân sách và các ưu đãi thành phần."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/campaigns")}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Danh sách
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href={`/admin/campaigns/${id}/edit`}>
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </Button>
          </div>
        }
      />

      <CampaignStatsDashboard stats={stats} onRefresh={refetch} />

      <AdminConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Xóa chiến dịch khuyến mãi"
        description={`Bạn có chắc muốn xóa chiến dịch "${stats.campaign.name}"? Các chương trình giảm giá và voucher thuộc chiến dịch này sẽ không bị xóa mà chỉ được bỏ liên kết chiến dịch.`}
        confirmText="Xóa chiến dịch"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function CampaignDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <CampaignDetailContent params={params} />
    </Suspense>
  );
}
