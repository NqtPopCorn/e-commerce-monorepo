"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  ExternalLink,
  Calendar,
  Menu,
  CheckCircle2,
  AlertCircle,
  Package,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface AdminHeaderBarProps {
  onOpenMobileMenu?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "order" | "stock" | "promo";
}

export function AdminHeaderBar({ onOpenMobileMenu }: AdminHeaderBarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [currentDateStr, setCurrentDateStr] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Đơn hàng mới",
      message: "Khách hàng vừa đặt đơn #ORD-1049 trị giá 590.000₫",
      time: "5 phút trước",
      read: false,
      type: "order",
    },
    {
      id: "2",
      title: "Cảnh báo tồn kho",
      message: "Áo polo phối viền (Size M - Đen) chỉ còn 2 chiếc",
      time: "25 phút trước",
      read: false,
      type: "stock",
    },
    {
      id: "3",
      title: "Khuyến mãi kích hoạt",
      message: "Mã giảm giá SUMMER2026 đã bắt đầu có hiệu lực",
      time: "2 giờ trước",
      read: true,
      type: "promo",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const days = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ];
      const dayName = days[now.getDay()];
      const d = String(now.getDate()).padStart(2, "0");
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const y = now.getFullYear();
      setCurrentDateStr(`${dayName}, ${d}/${m}/${y}`);
    };
    updateDate();
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchModal(false);
    router.push(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
        {/* Left: Mobile Toggle & Quick Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="hidden sm:flex items-center gap-2.5 w-full max-w-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 hover:border-slate-300 transition-all text-xs"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-left truncate">Tìm kiếm nhanh...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Date, Storefront Link, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Datetime (Desktop only) */}
          {currentDateStr && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDateStr}</span>
            </div>
          )}

          {/* Visit Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
            title="Mở giao diện khách hàng ở tab mới"
          >
            <span>Cửa hàng</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Notification Bell Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Menu */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      Thông báo
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 admin-scrollbar">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 ${
                        !item.read ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {item.type === "order" ? (
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                        ) : item.type === "stock" ? (
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {item.time}
                        </span>
                      </div>
                      {!item.read && (
                        <div className="w-2 h-2 rounded-full bg-rose-600 shrink-0 self-center" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-100 text-center">
                  <Link
                    href="/admin/orders"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Xem tất cả đơn hàng
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Mini */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                  "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Quản trị viên
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal Dialog */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-down">
            <form onSubmit={handleSearchSubmit} className="p-3 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, đơn hàng, tài khoản..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            <div className="p-3 bg-slate-50/50">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Truy cập nhanh
              </p>
              <div className="space-y-1">
                {[
                  { name: "Danh sách sản phẩm", link: "/admin/products" },
                  { name: "Quản lý đơn hàng", link: "/admin/orders" },
                  { name: "Nhập kho sản phẩm", link: "/admin/purchase" },
                  { name: "Chương trình khuyến mãi", link: "/admin/promotions" },
                  { name: "Danh sách tài khoản", link: "/admin/accounts" },
                ].map((item) => (
                  <button
                    key={item.link}
                    type="button"
                    onClick={() => {
                      setShowSearchModal(false);
                      router.push(item.link);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:text-rose-600 hover:shadow-2xs transition-all flex items-center justify-between group"
                  >
                    <span>{item.name}</span>
                    <span className="text-slate-400 group-hover:text-rose-500 text-[11px]">
                      Điều hướng →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
