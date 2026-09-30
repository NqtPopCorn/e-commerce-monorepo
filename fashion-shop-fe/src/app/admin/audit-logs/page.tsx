"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import {
  Search,
  RotateCcw,
  Eye,
  History,
  Clock,
  AlertTriangle,
  Users,
  Shield,
  Monitor,
  Globe,
} from "lucide-react";
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
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminDataTable,
  AdminPageSkeleton,
  AdminSortHeader,
} from "@/components/admin";
import { useTableParams } from "@/hooks/useTableParams";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useGetAuditLogs, useGetAuditLogSummary } from "@/hooks/useAuditLogs";
import { AuditLog } from "@/types/audit-log";
import { formatDateTime } from "@/lib/format";
import { AuditLogDetailModal } from "@/components/admin/audit-logs/AuditLogDetailModal";

const ENTITY_OPTIONS = [
  { value: "", label: "Tất cả thực thể" },
  { value: "ORDER", label: "Đơn hàng (ORDER)" },
  { value: "ACCOUNT", label: "Tài khoản (ACCOUNT)" },
  { value: "PROMOTION", label: "Khuyến mãi (PROMOTION)" },
  { value: "PURCHASE", label: "Nhập kho (PURCHASE)" },
  { value: "AUTH", label: "Xác thực (AUTH)" },
  { value: "SYSTEM", label: "Hệ thống (SYSTEM)" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "SUCCESS", label: "Thành công (SUCCESS)" },
  { value: "FAILED", label: "Thất bại (FAILED)" },
];

const DATE_OPTIONS = [
  { value: "", label: "Tất cả thời gian" },
  { value: "TODAY", label: "Hôm nay" },
  { value: "7DAYS", label: "7 ngày qua" },
  { value: "30DAYS", label: "30 ngày qua" },
];

function AuditLogsContent() {
  const { params, setParams } = useTableParams({ page: 1, pageSize: 15 });

  const [entityFilter, setEntityFilter] = useState<string>(params.status || "");
  const [statusFilter, setStatusFilter] = useState<string>(params.sort || "");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Debounced search
  const [searchInput, setSearchInput] = useState(params.q);

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

  // Compute startDate based on dateFilter
  const startDate = useMemo(() => {
    const now = new Date();
    if (dateFilter === "TODAY") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return today.toISOString();
    }
    if (dateFilter === "7DAYS") {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    if (dateFilter === "30DAYS") {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    return undefined;
  }, [dateFilter]);

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetAuditLogs({
    page: params.page,
    limit: params.pageSize,
    search: params.q || undefined,
    entityType: entityFilter || undefined,
    status: statusFilter || undefined,
    startDate,
  });

  const { data: summary } = useGetAuditLogSummary();

  const logs: AuditLog[] = response?.data || [];
  const meta = response?.meta || {
    total: logs.length,
    page: params.page,
    limit: params.pageSize,
    totalPages: 1,
  };

  const {
    sortedItems: sortedLogs,
    sortField,
    sortOrder,
    handleSort,
  } = useSortableTable(logs, {
    defaultField: "createdAt",
    defaultOrder: "desc",
    customGetters: {
      id: (l: AuditLog) => Number(l.id) || 0,
      createdAt: (l: AuditLog) => new Date(l.createdAt).getTime(),
      userEmail: (l: AuditLog) => (l.userEmail || "Hệ thống").toLowerCase(),
      action: (l: AuditLog) =>
        `${l.entityType || ""} ${l.action || ""}`.toLowerCase(),
      status: (l: AuditLog) => l.status || "",
    },
  });

  const handleResetFilters = () => {
    setSearchInput("");
    setEntityFilter("");
    setStatusFilter("");
    setDateFilter("");
    setParams({ q: undefined, page: 1 });
  };

  const hasActiveFilters = Boolean(
    params.q || entityFilter || statusFilter || dateFilter,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nhật Ký Hoạt Động"
        description="Theo dõi toàn bộ lịch sử thao tác hệ thống, thay đổi dữ liệu và nhật ký truy cập của người dùng."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Tổng Thao Tác"
          value={summary?.total ?? meta.total}
          subtitle="Bản ghi lưu vết toàn hệ thống"
          icon={History}
          color="slate"
        />
        <AdminStatCard
          title="Thao Tác Hôm Nay"
          value={summary?.todayCount ?? 0}
          subtitle="Ghi nhận trong ngày hiện tại"
          icon={Clock}
          color="sky"
        />
        <AdminStatCard
          title="Cảnh Báo / Thất Bại"
          value={summary?.failedCount ?? 0}
          subtitle="Thao tác lỗi hoặc bị từ chối"
          icon={AlertTriangle}
          color="rose"
        />
        <AdminStatCard
          title="Nhân Sự Thao Tác"
          value={summary?.activeUsersCount ?? 0}
          subtitle="Quản trị viên & nhân viên 7 ngày"
          icon={Users}
          color="emerald"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-background border-input text-xs h-9"
            placeholder="Tìm theo mô tả, email người thao tác, mã đối tượng..."
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setParams({ page: 1 });
            }}
            aria-label="Lọc theo phân loại thực thể"
            className="h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setParams({ page: 1 });
            }}
            aria-label="Lọc theo trạng thái thao tác"
            className="h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setParams({ page: 1 });
            }}
            aria-label="Lọc theo khoảng thời gian"
            className="h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {DATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs border-border"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Audit Logs Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        errorTitle="Không thể tải nhật ký hoạt động"
        onRetry={() => refetch()}
        isEmpty={logs.length === 0}
        emptyTitle="Không có bản ghi nhật ký nào"
        emptyDescription="Không tìm thấy bản ghi kiểm toán nào khớp với bộ lọc hiện tại."
        emptyAction={
          hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Xóa bộ lọc tìm kiếm
            </Button>
          ) : undefined
        }
        pagination={{
          page: meta.page,
          limit: meta.limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: (newPage) => setParams({ page: newPage }),
          onLimitChange: (newLimit) =>
            setParams({ pageSize: newLimit, page: 1 }),
        }}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-b border-border">
              <TableHead className="w-[70px]">
                <AdminSortHeader
                  title="ID"
                  field="id"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="desc"
                />
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Thời gian"
                  field="createdAt"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="desc"
                />
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Người thực hiện"
                  field="userEmail"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Phân loại & Hành động"
                  field="action"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Mô tả chi tiết
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Mạng & IP
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Trạng thái"
                  field="status"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider w-20">
                Chi tiết
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.map((log) => {
              const actorEmail = log.userEmail || "Hệ thống";
              const actorRole = log.userRole || log.user?.role || "SYSTEM";
              const isSuccess = log.status === "SUCCESS";

              return (
                <TableRow
                  key={log.id}
                  className="hover:bg-muted/50 border-b border-border transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLog(log);
                    setIsDetailOpen(true);
                  }}
                >
                  {/* ID */}
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                    #{log.id}
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="text-xs whitespace-nowrap">
                    <p className="font-medium text-foreground">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </TableCell>

                  {/* Actor */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-[11px] flex items-center justify-center border border-primary/20 shrink-0">
                        {actorEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 max-w-[150px]">
                        <p
                          className="text-xs font-semibold text-foreground truncate"
                          title={actorEmail}
                        >
                          {actorEmail}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {actorRole}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Entity & Action */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted border border-border text-foreground font-mono">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-[11px] font-mono font-medium text-muted-foreground">
                            #{log.entityId}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] font-mono text-muted-foreground truncate max-w-[160px]"
                        title={log.action}
                      >
                        {log.action}
                      </p>
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="max-w-[280px]">
                    <p
                      className="text-xs text-foreground truncate leading-relaxed"
                      title={log.description || undefined}
                    >
                      {log.description || "-"}
                    </p>
                    {log.status === "FAILED" && log.errorMessage && (
                      <p
                        className="text-[10px] text-destructive truncate font-mono mt-0.5"
                        title={log.errorMessage}
                      >
                        Lỗi: {log.errorMessage}
                      </p>
                    )}
                  </TableCell>

                  {/* IP & Device */}
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono text-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        {log.ipAddress || "-"}
                      </p>
                      {log.userAgent && (
                        <p
                          className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]"
                          title={log.userAgent}
                        >
                          {log.userAgent}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <AdminStatusBadge
                      status={isSuccess ? "COMPLETED" : "CANCELLED"}
                      size="sm"
                    />
                  </TableCell>

                  {/* View Action */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Xem chi tiết thao tác"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                        setIsDetailOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDataTable>

      {/* Detail Modal */}
      <AuditLogDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AuditLogsContent />
    </Suspense>
  );
}
