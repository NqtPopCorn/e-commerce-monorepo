"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  Users,
  UserCheck,
  Shield,
  RotateCcw,
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
import { useGetAccounts, useUpdateAccountStatus } from "@/hooks/useAccounts";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminDataTable,
  AdminConfirmDialog,
  AdminPageSkeleton,
} from "@/components/admin";
import { useTableParams } from "@/hooks/useTableParams";
import { toast } from "sonner";
import { Account } from "@/types/account";

function AccountsContent() {
  const { params, setParams } = useTableParams({ page: 1, pageSize: 10 });
  const [roleFilter, setRoleFilter] = useState<string>(params.sort || "");
  const [statusFilter, setStatusFilter] = useState<string>(params.status || "");

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

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    variant: "danger" | "warning" | "info" | "success" | "default";
    confirmText?: string;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    description: null,
    variant: "warning",
  });

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetAccounts({
    page: params.page,
    limit: params.pageSize,
    search: params.q || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const updateStatus = useUpdateAccountStatus();

  const users: Account[] = response?.data || [];
  const meta = response?.meta || {
    total: users.length,
    page: params.page,
    limit: params.pageSize,
    totalPages: 1,
  };

  const totalUsers = meta.total || 0;
  const activeCount = users.filter(
    (u) => (u.status || "ACTIVE") === "ACTIVE",
  ).length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const handleToggleStatus = (
    id: number,
    currentStatus: string,
    email: string,
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const isBlocking = newStatus === "BLOCKED";

    setConfirmDialog({
      isOpen: true,
      title: isBlocking
        ? "Xác nhận khóa tài khoản"
        : "Xác nhận mở khóa tài khoản",
      description: isBlocking ? (
        <p>
          Bạn có chắc chắn muốn khóa tài khoản{" "}
          <strong className="text-foreground">{email}</strong>? Người dùng này
          sẽ không thể đăng nhập vào hệ thống.
        </p>
      ) : (
        <p>
          Bạn có chắc chắn muốn mở khóa cho tài khoản{" "}
          <strong className="text-foreground">{email}</strong>?
        </p>
      ),
      variant: isBlocking ? "danger" : "default",
      confirmText: isBlocking ? "Khóa tài khoản" : "Mở khóa",
      onConfirm: async () => {
        try {
          await updateStatus.mutateAsync({ id, status: newStatus });
          toast.success(
            `Đã ${newStatus === "BLOCKED" ? "khóa" : "mở khóa"} tài khoản "${email}" thành công`,
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch {
          toast.error("Không thể cập nhật trạng thái tài khoản. Thử lại sau.");
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setRoleFilter("");
    setStatusFilter("");
    setParams({ q: undefined, page: 1 });
  };

  const hasActiveFilters = Boolean(params.q || roleFilter || statusFilter);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản Lý Tài Khoản"
        description="Quản lý danh sách người dùng hệ thống, phân quyền quản trị và kiểm soát trạng thái hoạt động."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <AdminStatCard
          title="Tổng Tài Khoản"
          value={totalUsers}
          subtitle="Tài khoản trên hệ thống"
          icon={Users}
          color="slate"
        />
        <AdminStatCard
          title="Đang Hoạt Động"
          value={activeCount}
          subtitle="Tài khoản hợp lệ"
          icon={UserCheck}
          color="emerald"
        />
        <AdminStatCard
          title="Quản Trị Viên"
          value={adminCount}
          subtitle="Có quyền quản lý hệ thống"
          icon={Shield}
          color="indigo"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-background border-input text-xs h-9"
            placeholder="Tìm theo email hoặc họ tên..."
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setParams({ page: 1 });
            }}
            aria-label="Lọc theo vai trò"
            className="h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setParams({ page: 1 });
            }}
            aria-label="Lọc theo trạng thái"
            className="h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="BLOCKED">Bị khóa (BLOCKED)</option>
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

      {/* Accounts Data Table */}
      <AdminDataTable
        isLoading={isLoading}
        isError={isError}
        errorTitle="Không thể tải danh sách tài khoản"
        onRetry={() => refetch()}
        isEmpty={users.length === 0}
        emptyTitle="Không tìm thấy tài khoản"
        emptyDescription="Không có người dùng nào khớp với tiêu chí tìm kiếm hiện tại."
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
              <TableHead className="w-[80px] font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                ID
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Người dùng
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Vai trò
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider w-36">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const fullName =
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                user.name ||
                "Người dùng";
              const userStatus = user.status || "ACTIVE";
              const isBlocked = userStatus === "BLOCKED";

              return (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/50 border-b border-border transition-colors"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                    #{user.id}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center border border-primary/20 shrink-0">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {fullName}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {user.email}
                  </TableCell>

                  <TableCell>
                    <AdminStatusBadge status={user.role} size="sm" />
                  </TableCell>

                  <TableCell>
                    <AdminStatusBadge status={userStatus} size="sm" />
                  </TableCell>

                  <TableCell className="text-right">
                    {user.role !== "ADMIN" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          handleToggleStatus(user.id, userStatus, user.email)
                        }
                        className={`h-8 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                          !isBlocked
                            ? "text-destructive hover:bg-destructive/10"
                            : "text-success hover:bg-success/10"
                        }`}
                      >
                        {!isBlocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Khóa
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Mở khóa
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center text-muted-foreground text-xs italic">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                        Quản trị viên
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDataTable>

      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        isLoading={updateStatus.isPending}
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}
