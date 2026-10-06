"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useNotifications, formatRelativeTime } from "@/hooks/useNotifications";
import { NotificationItem } from "@/types/notification";

interface AdminHeaderBarProps {
  onOpenMobileMenu?: () => void;
}

export function AdminHeaderBar({ onOpenMobileMenu }: AdminHeaderBarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading: isLoadingNotifs,
  } = useNotifications({ limit: 15 });

  useEffect(() => {
    setMounted(true);
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

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setNotificationsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchModal(false);
    router.push(`/admin/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const toggleTheme = () => {
    const isDark = (resolvedTheme || theme) === "dark";
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <>
      <header className="h-16 shrink-0 bg-card/95 border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs backdrop-blur-md">
        {/* Left: Mobile Toggle & Quick Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="hidden sm:flex items-center gap-2.5 w-full max-w-xs px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-all text-xs"
            aria-label="Tìm kiếm nhanh toàn hệ thống"
          >
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-left truncate">Tìm kiếm nhanh...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-card border border-border rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Date, Theme Switcher, Storefront Link, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Datetime (Desktop only) */}
          {currentDateStr && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-2 py-1 rounded-md bg-muted/50 border border-border">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{currentDateStr}</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={
                (resolvedTheme || theme) === "dark"
                  ? "Chuyển sang giao diện sáng"
                  : "Chuyển sang giao diện tối"
              }
              aria-label="Đổi giao diện Sáng / Tối"
            >
              {(resolvedTheme || theme) === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Visit Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg border border-border transition-colors"
            title="Mở giao diện khách hàng ở tab mới"
          >
            <span>Cửa hàng</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>

          {/* Notification Bell Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Thông báo"
              aria-label="Xem thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Menu */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-2 z-50 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      Thông báo
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border admin-scrollbar">
                  {isLoadingNotifs && notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Đang tải thông báo...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Chưa có thông báo nào
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3.5 hover:bg-muted/50 transition-colors flex gap-3 cursor-pointer ${
                          !item.isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {item.type === "ORDER" ? (
                            <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center">
                              <Package className="w-4 h-4" />
                            </div>
                          ) : item.type === "INVENTORY" ? (
                            <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs ${
                              !item.isRead
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {item.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        {!item.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-border text-center">
                  <Link
                    href="/admin/orders"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Xem tất cả đơn hàng
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Mini */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                  "Admin"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {user?.role === "STAFF"
                  ? "Nhân viên vận hành"
                  : "Quản trị viên"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal Dialog */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden animate-slide-down">
            <form
              onSubmit={handleSearchSubmit}
              className="p-3 border-b border-border flex items-center gap-2"
            >
              <Search className="w-5 h-5 text-muted-foreground shrink-0 ml-1" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, đơn hàng, tài khoản..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                aria-label="Đóng tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            <div className="p-3 bg-muted/30">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Truy cập nhanh
              </p>
              <div className="space-y-1">
                {[
                  { name: "Danh sách sản phẩm", link: "/admin/products" },
                  { name: "Quản lý đơn hàng", link: "/admin/orders" },
                  { name: "Nhập kho sản phẩm", link: "/admin/purchase" },
                  {
                    name: "Chương trình khuyến mãi",
                    link: "/admin/promotions",
                  },
                  { name: "Danh sách tài khoản", link: "/admin/accounts" },
                ].map((item) => (
                  <button
                    key={item.link}
                    type="button"
                    onClick={() => {
                      setShowSearchModal(false);
                      router.push(item.link);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-card hover:text-primary hover:shadow-2xs transition-all flex items-center justify-between group"
                  >
                    <span>{item.name}</span>
                    <span className="text-muted-foreground group-hover:text-primary text-[11px]">
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
