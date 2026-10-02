"use client";

import React, { useState } from "react";
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
import { useCreateAccount } from "@/hooks/useAccounts";
import { RoleType } from "@/types/account";
import { toast } from "sonner";
import { UserPlus, Shield, Mail, Lock, Phone, User } from "lucide-react";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAccountModalProps) {
  const createAccount = useCreateAccount();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleType>("STAFF");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setRole("STAFF");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    try {
      await createAccount.mutateAsync({
        email: email.trim(),
        password: password.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
        notes: notes.trim() || undefined,
      });

      toast.success(
        `Đã tạo tài khoản "${email}" (${role === "STAFF" ? "Nhân viên" : role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}) thành công`,
      );
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Không thể tạo tài khoản. Kiểm tra lại thông tin.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Thêm tài khoản mới
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tạo tài khoản phân quyền quản trị viên, nhân viên vận hành
                  hoặc khách hàng.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 py-4">
            {/* Role Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-medium">
                Vai trò hệ thống <span className="text-destructive">*</span>
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full h-9 px-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="STAFF">Nhân viên vận hành (STAFF)</option>
                <option value="ADMIN">Quản trị viên toàn quyền (ADMIN)</option>
                <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
              </select>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email đăng nhập <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="user@fashionshop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Mật khẩu ban đầu <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium">
                  Họ & tên đệm
                </Label>
                <Input
                  id="firstName"
                  placeholder="Nguyễn Văn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium">
                  Tên
                </Label>
                <Input
                  id="lastName"
                  placeholder="An"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Số điện thoại liên hệ
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901 234 567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-8 text-xs h-9 font-mono"
                />
              </div>
            </div>

            {/* Internal Note */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-medium">
                Ghi chú nội bộ
              </Label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Ghi chú vị trí, nhiệm vụ hoặc lưu ý đặc biệt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              disabled={createAccount.isPending}
              className="h-8 text-xs px-3.5"
            >
              {createAccount.isPending ? "Đang xử lý..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
