"use client";

import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, MapPin, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hasHydrated) {
    return <div className="py-20 text-center text-gray-500">Đang tải phiên đăng nhập...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Tài khoản</h1>
        <p className="text-gray-500 mb-6">
          Vui lòng đăng nhập để xem thông tin tài khoản.
        </p>
        <Link href="/login">
          <Button className="bg-[#c92127] hover:bg-red-700 text-white px-8 h-12 font-bold">
            ĐĂNG NHẬP
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
      {/* Sidebar */}
      <div className="w-full md:w-1/4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-red-50/50 border-b flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <UserCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-800">Khách hàng</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="flex flex-col">
            <Link
              href="/profile"
              className="px-6 py-4 border-l-4 border-[#c92127] bg-gray-50 text-[#c92127] font-semibold text-sm"
            >
              Thông tin tài khoản
            </Link>
            <Link
              href="/orders"
              className="px-6 py-4 border-l-4 border-transparent hover:bg-gray-50 text-gray-600 hover:text-[#c92127] font-medium text-sm transition-colors"
            >
              Đơn hàng của tôi
            </Link>
            <button
              onClick={handleLogout}
              className="px-6 py-4 border-l-4 border-transparent hover:bg-gray-50 text-left text-gray-600 hover:text-[#c92127] font-medium text-sm transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-3/4">
        <h1 className="text-2xl font-bold text-gray-800 uppercase mb-6">
          Thông tin tài khoản
        </h1>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
            HỒ SƠ CÁ NHÂN
          </h2>

          <div className="grid grid-cols-1 gap-y-6 gap-x-8 max-w-2xl">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </label>
              <div className="font-semibold text-gray-800 bg-gray-50 px-4 py-2 rounded border border-gray-100">
                {user.email}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Số điện thoại
              </label>
              <div className="font-semibold text-gray-800 bg-gray-50 px-4 py-2 rounded border border-gray-100">
                Chưa cập nhật
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button className="bg-[#c92127] hover:bg-red-700 text-white">
              Lưu Thay Đổi
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Đổi mật khẩu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
