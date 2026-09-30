"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCircle,
  Mail,
  MapPin,
  KeyRound,
  LogOut,
  Phone,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  Home,
  Save,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetMe,
  useUpdateMe,
  useChangePassword,
  useGetMyAddresses,
  useCreateMyAddress,
  useDeleteMyAddress,
  useSetDefaultMyAddress,
} from "@/hooks/useAccounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { GenderType } from "@/types/account";

export default function ProfilePage() {
  const { user: authUser, logout } = useAuthStore();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "profile" | "addresses" | "password"
  >("profile");

  // Profile data
  const { data: me, isLoading: isMeLoading } = useGetMe();
  const updateMeMutation = useUpdateMe();

  // Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderType>("OTHER");
  const [dateOfBirth, setDateOfBirth] = useState("");

  useEffect(() => {
    if (me) {
      setFirstName(me.firstName || "");
      setLastName(me.lastName || "");
      setPhone(me.phone || "");
      setGender(me.gender || "OTHER");
      setDateOfBirth(
        me.dateOfBirth
          ? new Date(me.dateOfBirth).toISOString().split("T")[0]
          : "",
      );
    }
  }, [me]);

  // Address data & state
  const { data: addresses, isLoading: isAddressesLoading } =
    useGetMyAddresses();
  const createAddressMutation = useCreateMyAddress();
  const deleteAddressMutation = useDeleteMyAddress();
  const setDefaultAddressMutation = useSetDefaultMyAddress();

  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newWard, setNewWard] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);

  // Password state
  const changePasswordMutation = useChangePassword();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMeMutation.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth || undefined,
      });
      toast.success("Cập nhật thông tin cá nhân thành công");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newRecipientName.trim() ||
      !newPhone.trim() ||
      !newStreet.trim() ||
      !newCity.trim()
    ) {
      toast.error("Vui lòng điền các trường bắt buộc");
      return;
    }

    try {
      await createAddressMutation.mutateAsync({
        recipientName: newRecipientName.trim(),
        phone: newPhone.trim(),
        street: newStreet.trim(),
        ward: newWard.trim() || undefined,
        district: newDistrict.trim() || undefined,
        city: newCity.trim(),
        isDefault: newIsDefault,
      });

      toast.success("Đã thêm địa chỉ giao hàng mới");
      setIsAddAddressOpen(false);
      setNewRecipientName("");
      setNewPhone("");
      setNewStreet("");
      setNewWard("");
      setNewDistrict("");
      setNewCity("");
      setNewIsDefault(false);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Không thể thêm địa chỉ. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await deleteAddressMutation.mutateAsync(id);
      toast.success("Đã xóa địa chỉ");
    } catch {
      toast.error("Không thể xóa địa chỉ");
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await setDefaultAddressMutation.mutateAsync(id);
      toast.success("Đã đặt làm địa chỉ mặc định");
    } catch {
      toast.error("Không thể đặt làm địa chỉ mặc định");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Mật khẩu hiện tại không chính xác";
      toast.error(msg);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-3">Tài khoản</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Vui lòng đăng nhập để xem và quản lý thông tin tài khoản.
        </p>
        <Link href="/login">
          <Button className="px-8 h-11 font-semibold">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  const userDisplayName =
    [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
    [authUser.firstName, authUser.lastName].filter(Boolean).join(" ") ||
    "Khách hàng";

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto py-4 px-4 sm:px-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-1/4">
        <div className="bg-card rounded-2xl shadow-xs border border-border overflow-hidden">
          <div className="p-6 bg-muted/40 border-b border-border flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary font-bold text-xl rounded-full flex items-center justify-center mb-3 border border-primary/20">
              {authUser.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <h3 className="font-semibold text-foreground text-sm truncate max-w-full">
              {userDisplayName}
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-full mt-0.5">
              {authUser.email}
            </p>
            {me?.tier && (
              <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                <span>Hạng {me.tier}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col p-2 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center gap-2.5 ${
                activeTab === "profile"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Thông tin tài khoản</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center gap-2.5 ${
                activeTab === "addresses"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Sổ địa chỉ nhận hàng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center gap-2.5 ${
                activeTab === "password"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Đổi mật khẩu</span>
            </button>

            <Link
              href="/orders"
              className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Đơn hàng của tôi</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2.5 pt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full md:w-3/4">
        {/* Tab 1: Profile Information */}
        {activeTab === "profile" && (
          <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-xs border border-border space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-bold text-foreground">
                Hồ Sơ Cá Nhân
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cập nhật thông tin liên hệ và sở thích thời trang của bạn để
                nhận ưu đãi phù hợp.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Email đăng ký (Cố định)
                </Label>
                <div className="font-mono text-xs text-foreground bg-muted/50 px-3.5 py-2.5 rounded-xl border border-input">
                  {authUser.email}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium">
                    Họ & tên đệm
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nguyễn Văn"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium">
                    Tên
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="An"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">
                  Số điện thoại nhận hàng
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className="pl-9 h-10 text-xs font-mono rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-medium">
                    Giới tính
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderType)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="text-xs font-medium">
                    Ngày sinh (Nhận quà sinh nhật)
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={updateMeMutation.isPending}
                  className="h-10 px-6 text-xs font-semibold rounded-xl gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {updateMeMutation.isPending
                      ? "Đang lưu..."
                      : "Lưu thay đổi"}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Address Book */}
        {activeTab === "addresses" && (
          <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-xs border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Sổ Địa Chỉ Giao Hàng
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quản lý các địa chỉ nhận hàng để thanh toán nhanh hơn.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddAddressOpen(true)}
                className="h-9 px-3.5 text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm địa chỉ</span>
              </Button>
            </div>

            {isAddressesLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Đang tải danh sách địa chỉ...
              </div>
            ) : !addresses || addresses.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Bạn chưa lưu địa chỉ giao hàng nào. Bấm "Thêm địa chỉ" để bắt
                đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      addr.isDefault
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {addr.recipientName}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          • {addr.phone}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[addr.street, addr.ward, addr.district, addr.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!addr.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={setDefaultAddressMutation.isPending}
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="h-8 text-[11px] px-2.5 rounded-lg border-border"
                        >
                          Đặt mặc định
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleteAddressMutation.isPending}
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="h-8 text-[11px] px-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Change Password */}
        {activeTab === "password" && (
          <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-xs border border-border space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-bold text-foreground">
                Đổi Mật Khẩu
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Để bảo vệ tài khoản, vui lòng không chia sẻ mật khẩu cho người
                khác.
              </p>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="space-y-4 max-w-md"
            >
              <div className="space-y-1.5">
                <Label htmlFor="oldPass" className="text-xs font-medium">
                  Mật khẩu hiện tại <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="oldPass"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPass" className="text-xs font-medium">
                  Mật khẩu mới <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPass"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPass" className="text-xs font-medium">
                  Xác nhận mật khẩu mới{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPass"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="h-10 px-6 text-xs font-semibold rounded-xl shadow-xs"
                >
                  {changePasswordMutation.isPending
                    ? "Đang xử lý..."
                    : "Cập nhật mật khẩu"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Add Address Modal Dialog */}
      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateAddress}>
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-base font-semibold text-foreground">
                Thêm địa chỉ nhận hàng
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Điền thông tin người nhận và địa chỉ chi tiết để shipper giao
                hàng.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-3.5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="addrName" className="text-xs font-medium">
                    Họ tên người nhận{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="addrName"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addrPhone" className="text-xs font-medium">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="addrPhone"
                    type="tel"
                    required
                    placeholder="0901 234 567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-9 text-xs font-mono rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="addrStreet" className="text-xs font-medium">
                  Địa chỉ cụ thể (Số nhà, tên đường){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addrStreet"
                  required
                  placeholder="Ví dụ: 123 Lê Lợi"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="addrWard" className="text-[11px] font-medium">
                    Phường / Xã
                  </Label>
                  <Input
                    id="addrWard"
                    placeholder="Phường Bến Nghé"
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="addrDistrict"
                    className="text-[11px] font-medium"
                  >
                    Quận / Huyện
                  </Label>
                  <Input
                    id="addrDistrict"
                    placeholder="Quận 1"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addrCity" className="text-[11px] font-medium">
                    Tỉnh / TP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="addrCity"
                    required
                    placeholder="Hồ Chí Minh"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefault"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                />
                <Label
                  htmlFor="addrDefault"
                  className="text-xs cursor-pointer font-normal"
                >
                  Đặt làm địa chỉ nhận hàng mặc định
                </Label>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddAddressOpen(false)}
                className="h-8 text-xs px-3"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createAddressMutation.isPending}
                className="h-8 text-xs px-3.5"
              >
                {createAddressMutation.isPending
                  ? "Đang lưu..."
                  : "Lưu địa chỉ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
