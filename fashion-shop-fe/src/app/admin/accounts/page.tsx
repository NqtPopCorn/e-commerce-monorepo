"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Lock, Unlock, ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useGetAccounts, useUpdateAccountStatus } from "@/hooks/useAccounts";
import { toast } from "sonner";

export default function AccountsPage() {
  const { data: users, isLoading } = useGetAccounts();
  const updateStatus = useUpdateAccountStatus();

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
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h1>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm theo email hoặc tên..."
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-4 text-gray-500"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">#{user.id}</TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {user.status || "ACTIVE"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleStatus(user.id, user.status || "ACTIVE")
                        }
                        className={
                          (user.status || "ACTIVE") === "ACTIVE"
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        }
                      >
                        {(user.status || "ACTIVE") === "ACTIVE" ? (
                          <>
                            <Lock className="w-4 h-4 mr-1" /> Khóa
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-1" /> Mở khóa
                          </>
                        )}
                      </Button>
                    )}
                    {user.role === "ADMIN" && (
                      <span className="text-gray-400 text-sm italic flex justify-end items-center">
                        <ShieldAlert className="w-4 h-4 mr-1" /> Quản trị viên
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
