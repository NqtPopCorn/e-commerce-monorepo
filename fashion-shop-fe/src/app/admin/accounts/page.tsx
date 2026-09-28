"use client";

import React, { useState } from "react";
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
} from "@/components/admin";
import { toast } from "sonner";
import { Account } from "@/types/account";

export default function AccountsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: response, isLoading } = useGetAccounts({
    page,
    limit,
    search: search.trim() || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const updateStatus = useUpdateAccountStatus();

  const users: Account[] = response?.data || [];
  const meta = response?.meta || {
    total: users.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const totalUsers = meta.total || 0;
  const activeCount = users.filter((u) => (u.status || "ACTIVE") === "ACTIVE").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const toggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            `Đã ${newStatus === "BLOCKED" ? "khóa" : "mở khóa"} tài khoản`,
          );
        },
        onError: () => {
          toast.error("Không thể cập nhật trạng thái tài khoản");
        },
      },
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

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
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-50/70 border-slate-200 focus:bg-white text-xs h-9"
            placeholder="Tìm theo email hoặc họ tên..."
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
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
              setPage(1);
            }}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
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
              className="h-9 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-dashed"
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
          onPageChange: (newPage) => setPage(newPage),
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
      >
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="w-[80px] font-semibold text-slate-500 text-xs">ID</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Người dùng</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Email</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Vai trò</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs">Trạng thái</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 text-xs">Thao tác</TableHead>
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
                  className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-slate-500">
                    #{user.id}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {fullName}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 font-mono">
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
                        onClick={() => toggleStatus(user.id, userStatus)}
                        className={`h-8 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                          !isBlocked
                            ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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
                      <span className="inline-flex items-center text-slate-400 text-xs italic">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-400" />
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
    </div>
  );
}
