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
import {
  useGetAccountDetail,
  useUpdateAdminAccount,
} from "@/hooks/useAccounts";
import { AdminStatusBadge } from "../AdminStatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  ShoppingBag,
  CreditCard,
  Edit3,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: number | null;
  onToggleStatus?: (id: number, currentStatus: string, email: string) => void;
}

export function AccountDetailModal({
  isOpen,
  onClose,
  accountId,
  onToggleStatus,
}: AccountDetailModalProps) {
  const {
    data: user,
    isLoading,
    refetch,
  } = useGetAccountDetail(accountId || undefined);
  const updateAdmin = useUpdateAdminAccount();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  React.useEffect(() => {
    if (user) {
      setNotesInput(user.notes || "");
      setIsEditingNotes(false);
    }
  }, [user]);

  if (!accountId) return null;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Người dùng";

  const handleSaveNotes = async () => {
    if (!user) return;
    try {
      await updateAdmin.mutateAsync({
        id: user.id,
        data: { notes: notesInput },
      });
      toast.success("Đã cập nhật ghi chú nội bộ");
      setIsEditingNotes(false);
      refetch();
    } catch {
      toast.error("Không thể lưu ghi chú. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center border border-primary/20 shrink-0">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span>{fullName}</span>
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    #{user?.id}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user?.email}</span>
                </DialogDescription>
              </div>
            </div>

            {user && (
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <AdminStatusBadge status={user.role} size="sm" />
                  <AdminStatusBadge status={user.status} size="sm" />
                </div>
                {user.role === "CUSTOMER" && user.tier && (
                  <AdminStatusBadge status={user.tier} size="sm" />
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogBody className="space-y-6 py-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Đang tải thông tin chi tiết...</p>
            </div>
          ) : !user ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Không tìm thấy thông tin tài khoản.
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Tổng chi tiêu
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                    {formatCurrency(user.totalSpent || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Đơn hàng
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                    {user.ordersCount || 0} đơn
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Ngày đăng ký
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-1 tabular-nums">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Đăng nhập cuối
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-1 tabular-nums">
                    {user.lastLoginAt
                      ? formatDateTime(user.lastLoginAt)
                      : "Chưa đăng nhập"}
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Thông tin liên hệ & cá nhân</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-3 rounded-lg border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Số điện thoại
                    </span>
                    <span className="font-medium text-foreground mt-0.5 inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {user.phone || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Giới tính
                    </span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {user.gender === "MALE"
                        ? "Nam"
                        : user.gender === "FEMALE"
                          ? "Nữ"
                          : user.gender === "OTHER"
                            ? "Khác"
                            : "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Ngày sinh
                    </span>
                    <span className="font-medium text-foreground mt-0.5 inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {user.dateOfBirth
                        ? formatDate(user.dateOfBirth)
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Internal Admin / CSKH Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Ghi chú nội bộ CSKH & Quản trị</span>
                  </h4>
                  {!isEditingNotes && (
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Sửa ghi chú
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Nhập ghi chú khách hàng (ví dụ: Khách VIP, hay chọn size M, boom hàng...)"
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNotesInput(user.notes || "");
                          setIsEditingNotes(false);
                        }}
                        className="h-7 text-xs px-2.5"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateAdmin.isPending}
                        onClick={handleSaveNotes}
                        className="h-7 text-xs px-2.5 gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Lưu ghi chú
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs text-foreground italic min-h-[44px]">
                    {user.notes || "Chưa có ghi chú nội bộ cho tài khoản này."}
                  </div>
                )}
              </div>

              {/* Address Book */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Sổ địa chỉ giao hàng ({user.addresses?.length || 0})
                  </span>
                </h4>
                {user.addresses && user.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 rounded-lg border border-border bg-card text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {addr.recipientName}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              ({addr.phone})
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground">
                            {[addr.street, addr.ward, addr.district, addr.city]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-2 bg-muted/20 rounded-lg border border-border">
                    Tài khoản chưa có địa chỉ giao hàng nào được lưu.
                  </p>
                )}
              </div>

              {/* Recent Orders */}
              {user.orders && user.orders.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                    <span>Đơn hàng gần đây</span>
                  </h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3 text-left font-medium">
                            Mã đơn
                          </th>
                          <th className="py-2 px-3 text-left font-medium">
                            Ngày đặt
                          </th>
                          <th className="py-2 px-3 text-left font-medium">
                            Trạng thái
                          </th>
                          <th className="py-2 px-3 text-right font-medium">
                            Tổng tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {user.orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-muted/30">
                            <td className="py-2 px-3 font-mono font-medium">
                              #{ord.id}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                              {formatDate(ord.createdAt)}
                            </td>
                            <td className="py-2 px-3">
                              <AdminStatusBadge status={ord.status} size="sm" />
                            </td>
                            <td className="py-2 px-3 text-right font-semibold tabular-nums text-foreground">
                              {formatCurrency(ord.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-border pt-3 flex items-center justify-between sm:justify-between">
          <div>
            {user && user.role !== "ADMIN" && onToggleStatus && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(user.id, user.status, user.email)}
                className={`h-8 text-xs font-medium rounded-lg ${
                  user.status === "ACTIVE"
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-success hover:bg-success/10"
                }`}
              >
                {user.status === "ACTIVE" ? (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Khóa tài khoản
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 mr-1" />
                    Mở khóa tài khoản
                  </>
                )}
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs px-4"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
