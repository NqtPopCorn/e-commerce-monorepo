"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteCampaign, useGetCampaigns } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Megaphone,
  Search,
  Eye,
  Edit,
  Calendar,
  Layers,
  Percent,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { Campaign, CampaignStatus } from "@/types/campaign";
import {
  AdminPageHeader,
  AdminDataTable,
  AdminConfirmDialog,
  AdminPageSkeleton,
  AdminPagination,
} from "@/components/admin";
import { CampaignStatusBadge } from "@/components/admin/campaigns/CampaignStatusBadge";
import { useTableParams } from "@/hooks/useTableParams";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_FILTERS: Array<{ label: string; value?: CampaignStatus }> = [
  { label: "Tất cả" },
  { label: "Đang diễn ra", value: "ACTIVE" },
  { label: "Sắp diễn ra", value: "SCHEDULED" },
  { label: "Đã kết thúc", value: "ENDED" },
];

function AdminCampaignsContent() {
  const router = useRouter();
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });
  const [searchInput, setSearchInput] = useState(params.q);
  const [selectedStatus, setSelectedStatus] = useState<
    CampaignStatus | undefined
  >(undefined);

  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== params.q) {
        setParams({ q: searchInput.trim() || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, params.q, setParams]);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetCampaigns({
    page: params.page,
    limit: params.pageSize,
    search: params.q || undefined,
    status: selectedStatus,
  });

  const deleteMutation = useDeleteCampaign();
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const campaigns = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa chiến dịch thành công");
      setDeleteTarget(null);
    } catch {
      toast.error("Không thể xóa chiến dịch. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Chiến dịch" }]}
        title="Chiến dịch khuyến mãi"
        description="Gom nhóm các đợt giảm giá sản phẩm và voucher, theo dõi ngân sách tổng và hiệu quả chuyển đổi."
        actions={
          <Link href="/admin/campaigns/create">
            <Button
              size="sm"
              className="h-9 px-4 gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo chiến dịch mới
            </Button>
          </Link>
        }
      />

      {/* Toolbar: Search input & Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên chiến dịch..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/50 self-start sm:self-auto overflow-x-auto">
          {STATUS_FILTERS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.value);
                  setParams({ page: 1 });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        isEmpty={campaigns.length === 0}
        onRetry={refetch}
        emptyTitle="Chưa có chiến dịch nào"
        emptyDescription="Tạo chiến dịch đầu tiên để bắt đầu phân loại và theo dõi các đợt ưu đãi bán hàng."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead>Chiến dịch</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian diễn ra</TableHead>
              <TableHead>Thành phần</TableHead>
              <TableHead>Ngân sách & Đã chi</TableHead>
              <TableHead className="w-[120px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((camp, index) => {
              const budgetLimit =
                camp.budgetLimit !== null && camp.budgetLimit !== undefined
                  ? Number(camp.budgetLimit)
                  : null;
              const spent = Number(camp.spentAmount) || 0;
              const percent =
                budgetLimit && budgetLimit > 0
                  ? Math.min(100, Math.round((spent / budgetLimit) * 100))
                  : null;

              return (
                <TableRow
                  key={camp.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {(params.page - 1) * params.pageSize + index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/campaigns/${camp.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors text-sm line-clamp-1"
                      >
                        {camp.name}
                      </Link>
                      {camp.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {camp.description}
                        </p>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 italic">
                          Chưa có mô tả
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <CampaignStatusBadge status={camp.status} size="sm" />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{formatDate(camp.startsAt)}</span>
                      <span>—</span>
                      <span>
                        {camp.endsAt
                          ? formatDate(camp.endsAt)
                          : "Không giới hạn"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className="flex items-center gap-1 font-medium text-foreground"
                        title="Số chương trình giảm giá sản phẩm"
                      >
                        <Percent className="h-3 w-3 text-primary" />
                        {camp._count?.discounts || 0}
                      </span>
                      <span
                        className="flex items-center gap-1 font-medium text-foreground"
                        title="Số mã voucher trực thuộc"
                      >
                        <Ticket className="h-3 w-3 text-info" />
                        {camp._count?.vouchers || 0}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 max-w-[170px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">
                          {formatCurrency(spent)}
                        </span>
                        {budgetLimit ? (
                          <span className="text-muted-foreground text-[11px]">
                            / {formatCurrency(budgetLimit)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            (Trần: ∞)
                          </span>
                        )}
                      </div>
                      {budgetLimit && percent !== null && (
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 90
                                ? "bg-destructive"
                                : percent >= 70
                                  ? "bg-warning"
                                  : "bg-primary"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Xem thống kê chi tiết"
                      >
                        <Link href={`/admin/campaigns/${camp.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Chỉnh sửa chiến dịch"
                      >
                        <Link href={`/admin/campaigns/${camp.id}/edit`}>
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Xóa chiến dịch"
                        onClick={() => setDeleteTarget(camp)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDataTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          page={params.page}
          limit={params.pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(page) => setParams({ page })}
          onLimitChange={(pageSize) => setParams({ pageSize, page: 1 })}
        />
      )}

      {/* Delete confirmation dialog */}
      <AdminConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa chiến dịch khuyến mãi"
        description={`Bạn có chắc muốn xóa chiến dịch "${deleteTarget?.name}"? Các chương trình giảm giá và voucher thuộc chiến dịch này sẽ không bị xóa mà chỉ được bỏ liên kết chiến dịch.`}
        confirmText="Xóa chiến dịch"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function AdminCampaignsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminCampaignsContent />
    </Suspense>
  );
}
