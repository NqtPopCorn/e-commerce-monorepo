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
  UserPlus,
  Eye,
  Edit2,
  Phone,
  Briefcase,
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
  useGetAccounts,
  useGetAccountSummary,
  useUpdateAccountStatus,
} from "@/hooks/useAccounts";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminDataTable,
  AdminConfirmDialog,
  AdminPageSkeleton,
  AdminSortHeader,
} from "@/components/admin";
import { useSortableTable } from "@/hooks/useSortableTable";
import { AccountDetailModal } from "@/components/admin/accounts/AccountDetailModal";
import { CreateAccountModal } from "@/components/admin/accounts/CreateAccountModal";
import { EditAccountModal } from "@/components/admin/accounts/EditAccountModal";
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

  // Modals state
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Confirm dialog state
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

  const { data: summary } = useGetAccountSummary();
  const updateStatus = useUpdateAccountStatus();

  const users: Account[] = response?.data || [];
  const meta = response?.meta || {
    total: users.length,
    page: params.page,
    limit: params.pageSize,
    totalPages: 1,
  };

  const {
    sortedItems: sortedUsers,
    sortField,
    sortOrder,
    handleSort,
  } = useSortableTable(users, {
    defaultField: "id",
    defaultOrder: "desc",
    customGetters: {
      id: (u: Account) => Number(u.id) || 0,
      name: (u: Account) => {
        const full =
          [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || "";
        return full.toLowerCase();
      },
      email: (u: Account) => (u.email || "").toLowerCase(),
      role: (u: Account) => u.role || "",
      tier: (u: Account) => u.tier || "",
      status: (u: Account) => u.status || "",
    },
  });

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
          sẽ bị chặn truy cập và không thể đăng nhập vào hệ thống.
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
        actions={
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </Button>
        }
      />

      {/* KPI Stats (Accurate counts from API) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Tổng Tài Khoản"
          value={summary?.total ?? meta.total}
          subtitle="Tài khoản trên toàn hệ thống"
          icon={Users}
          color="slate"
        />
        <AdminStatCard
          title="Đang Hoạt Động"
          value={summary?.active ?? 0}
          subtitle="Tài khoản có quyền đăng nhập"
          icon={UserCheck}
          color="emerald"
        />
        <AdminStatCard
          title="Nhân Viên"
          value={summary?.staffs ?? 0}
          subtitle="Vận hành kho & đơn hàng"
          icon={Briefcase}
          color="sky"
        />
        <AdminStatCard
          title="Quản Trị Viên"
          value={summary?.admins ?? 0}
          subtitle="Quản trị toàn quyền"
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
            placeholder="Tìm theo email, họ tên hoặc số điện thoại..."
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
            <option value="ADMIN">ADMIN (Quản trị viên)</option>
            <option value="STAFF">STAFF (Nhân viên)</option>
            <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
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
                  title="Người dùng"
                  field="name"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Email"
                  field="email"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Vai trò"
                  field="role"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
              </TableHead>
              <TableHead>
                <AdminSortHeader
                  title="Hạng thành viên"
                  field="tier"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  defaultOrder="asc"
                />
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
              <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider w-44">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => {
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
                        {user.phone ? (
                          <span className="text-[11px] text-muted-foreground font-mono inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Chưa có SĐT
                          </span>
                        )}
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
                    {user.role === "CUSTOMER" && user.tier ? (
                      <AdminStatusBadge status={user.tier} size="sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <AdminStatusBadge status={userStatus} size="sm" />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Details */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Xem chi tiết 360°"
                        onClick={() => {
                          setSelectedAccountId(user.id);
                          setIsDetailOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Edit Role / Info */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Chỉnh sửa & Phân quyền"
                        onClick={() => setEditingAccount(user)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      {/* Lock / Unlock */}
                      {user.role !== "ADMIN" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updateStatus.isPending}
                          title={!isBlocked ? "Khóa tài khoản" : "Mở khóa"}
                          onClick={() =>
                            handleToggleStatus(user.id, userStatus, user.email)
                          }
                          className={`h-8 w-8 p-0 ${
                            !isBlocked
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-success hover:bg-success/10"
                          }`}
                        >
                          {!isBlocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      ) : (
                        <span
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground"
                          title="Quản trị viên tối cao"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDataTable>

      {/* Account Detail 360 Modal */}
      <AccountDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAccountId(null);
        }}
        accountId={selectedAccountId}
        onToggleStatus={handleToggleStatus}
      />

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        account={editingAccount}
        onSuccess={() => refetch()}
      />

      {/* Confirm Lock/Unlock Dialog */}
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
