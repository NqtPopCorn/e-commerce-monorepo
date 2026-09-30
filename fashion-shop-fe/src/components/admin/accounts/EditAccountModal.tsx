"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAdminAccount } from "@/hooks/useAccounts";
import {
  Account,
  CustomerTierType,
  RoleType,
  UserStatusType,
} from "@/types/account";
import { toast } from "sonner";
import { Edit2, Shield, User, Phone } from "lucide-react";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSuccess?: () => void;
}

export function EditAccountModal({
  isOpen,
  onClose,
  account,
  onSuccess,
}: EditAccountModalProps) {
  const updateAdmin = useUpdateAdminAccount();

  const [role, setRole] = useState<RoleType>("CUSTOMER");
  const [status, setStatus] = useState<UserStatusType>("ACTIVE");
  const [tier, setTier] = useState<CustomerTierType>("STANDARD");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (account) {
      setRole(account.role || "CUSTOMER");
      setStatus(account.status || "ACTIVE");
      setTier(account.tier || "STANDARD");
      setFirstName(account.firstName || "");
      setLastName(account.lastName || "");
      setPhone(account.phone || "");
      setNotes(account.notes || "");
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateAdmin.mutateAsync({
        id: account.id,
        data: {
          role,
          status,
          tier,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      toast.success(`Đã cập nhật thông tin tài khoản "${account.email}"`);
      onClose();
      onSuccess?.();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Không thể cập nhật tài khoản. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Edit2 className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Chỉnh sửa & Phân quyền tài khoản
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-mono">
                  {account.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 py-4">
            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-role" className="text-xs font-medium">
                  Vai trò hệ thống
                </Label>
                <select
                  id="edit-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="w-full h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                  <option value="STAFF">Nhân viên vận hành (STAFF)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-medium">
                  Trạng thái hoạt động
                </Label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatusType)}
                  className="w-full h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="BLOCKED">Bị khóa (BLOCKED)</option>
                </select>
              </div>
            </div>

            {/* Customer Tier */}
            {role === "CUSTOMER" && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-tier" className="text-xs font-medium">
                  Hạng thành viên (Loyalty Tier)
                </Label>
                <select
                  id="edit-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as CustomerTierType)}
                  className="w-full h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="STANDARD">Tiêu chuẩn (STANDARD)</option>
                  <option value="SILVER">Hạng Bạc (SILVER)</option>
                  <option value="GOLD">Hạng Vàng (GOLD)</option>
                  <option value="DIAMOND">Kim Cương (DIAMOND)</option>
                </select>
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-firstName" className="text-xs font-medium">
                  Họ & tên đệm
                </Label>
                <Input
                  id="edit-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lastName" className="text-xs font-medium">
                  Tên
                </Label>
                <Input
                  id="edit-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-xs font-medium">
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-8 text-xs h-9 font-mono"
                  placeholder="0901 234 567"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes" className="text-xs font-medium">
                Ghi chú nội bộ CSKH / Quản trị
              </Label>
              <textarea
                id="edit-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về khách hàng hoặc phân công nhân viên..."
                className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </DialogBody>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs px-3"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateAdmin.isPending}
              className="h-8 text-xs px-3.5"
            >
              {updateAdmin.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
