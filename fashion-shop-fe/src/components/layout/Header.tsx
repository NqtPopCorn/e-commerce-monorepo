"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/product";
import CategorySearchAutocomplete from "@/components/layout/CategorySearchAutocomplete";
import {
  Search,
  ShoppingCart,
  UserCircle,
  Grid,
  ChevronDown,
  Bell,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useNotifications, formatRelativeTime } from "@/hooks/useNotifications";
import { NotificationItem } from "@/types/notification";

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { items } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = (mounted || hasHydrated) && Boolean(user);

  const userDisplayName = useMemo(() => {
    if (!isAuthenticated || !user) return "Tài khoản";
    // 1. Tên gọi riêng firstName
    if (user.firstName?.trim()) return user.firstName.trim();
    // 2. Họ và tên kết hợp nếu có
    const full = [user.lastName, user.firstName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (full) return full;
    // 3. Họ lastName
    if (user.lastName?.trim()) return user.lastName.trim();
    // 4. Tên từ email
    if (user.email) return user.email.split("@")[0];
    return "Tài khoản";
  }, [isAuthenticated, user]);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading: isLoadingNotifs,
  } = useNotifications({ limit: 10 });

  // Đóng dropdown thông báo khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setNotifOpen(false);
    if (item.link) {
      router.push(item.link);
    } else {
      router.push("/profile?tab=orders");
    }
  };

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Lấy dữ liệu thể loại cây
  const { data: treeData } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: categoriesService.getTree,
    staleTime: 5 * 60 * 1000,
  });

  const categories = Array.isArray(treeData) ? treeData : [];

  const handleMouseEnterMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowDropdown(true);
    if (hoveredCategory === null && categories.length > 0) {
      setHoveredCategory(categories[0].id);
    }
  };

  const handleMouseLeaveMenu = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
      setHoveredCategory(null);
    }, 300);
  };

  const activeCategory = categories.find(
    (c: Category) => c.id === hoveredCategory,
  );

  return (
    <>
      <div className="w-full bg-slate-900 text-slate-100 text-center py-2 text-xs md:text-sm font-medium tracking-wide">
        ✨ Ưu đãi thời trang mùa mới — Giảm đến 50% & Miễn phí vận chuyển toàn
        quốc!
      </div>

      <header className="bg-white sticky top-0 z-50 shadow-sm border-b">
        <div className="w-full max-w-[1230px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6 relative">
            {/* Logo & Category */}
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/">
                <div className="text-2xl font-black tracking-tight text-gray-950 flex items-center gap-1">
                  <span>FASHION</span>
                  <span className="text-rose-600">SHOP</span>
                </div>
              </Link>

              <div
                className="hidden md:flex items-center text-gray-700 hover:text-rose-600 cursor-pointer font-medium text-sm gap-1"
                onMouseEnter={handleMouseEnterMenu}
                onMouseLeave={handleMouseLeaveMenu}
              >
                <Grid className="w-5 h-5 text-gray-600" />
                <span>Danh mục</span>
                <ChevronDown className="w-4 h-4" />
              </div>

              {/* Mega Dropdown Menu */}
              {showDropdown && (
                <div
                  ref={dropdownMenuRef}
                  className="absolute top-full left-0 mt-3 w-[720px] bg-white border border-gray-200 shadow-2xl rounded-xl flex z-50 overflow-hidden"
                  onMouseEnter={handleMouseEnterMenu}
                  onMouseLeave={handleMouseLeaveMenu}
                >
                  {/* Left Sidebar (Parent Categories) */}
                  <div className="w-2/5 bg-gray-50 border-r py-3">
                    <ul className="text-sm font-medium text-gray-700 space-y-1">
                      {categories.map((cat: Category) => (
                        <li
                          key={cat.id}
                          className={`px-4 py-2.5 cursor-pointer hover:text-rose-600 transition-colors ${
                            hoveredCategory === cat.id
                              ? "bg-white text-rose-600 font-semibold border-l-4 border-rose-600 shadow-sm"
                              : "border-l-4 border-transparent"
                          }`}
                          onMouseEnter={() => setHoveredCategory(cat.id)}
                        >
                          <Link
                            href={`/products?category=${encodeURIComponent(cat.name)}`}
                            className="block"
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Content (Child Categories) */}
                  <div className="w-3/5 p-6 bg-white">
                    <h3 className="font-bold text-gray-900 mb-4 border-b pb-2 text-sm uppercase tracking-wider">
                      {activeCategory?.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                      {activeCategory?.children &&
                      activeCategory.children.length > 0 ? (
                        activeCategory.children.map((child: Category) => (
                          <Link
                            key={child.id}
                            href={`/products?category=${encodeURIComponent(child.name)}`}
                            className="text-gray-600 hover:text-rose-600 hover:font-medium transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))
                      ) : (
                        <div className="text-gray-400 italic text-xs">
                          Xem tất cả trong nhóm
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Box with Category Autocomplete */}
            <div className="flex-1 max-w-2xl hidden md:flex">
              <CategorySearchAutocomplete categories={categories} />
            </div>

            {/* Icons Group */}
            <div className="flex items-center gap-6 text-gray-700 shrink-0">
              <Link
                href="/cart"
                className="flex flex-col items-center hover:text-rose-600 relative transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 hidden lg:block font-medium">
                  Giỏ hàng
                </span>
              </Link>

              {/* Notification Bell (khi đã đăng nhập) */}
              {isAuthenticated && (
                <div ref={notifRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="flex flex-col items-center hover:text-rose-600 transition-colors relative"
                    title="Thông báo"
                    aria-label="Thông báo"
                  >
                    <div className="relative">
                      <Bell className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow animate-pulse">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] mt-1 hidden lg:block font-medium">
                      Thông báo
                    </span>
                  </button>

                  {/* Notification Popover Dropdown */}
                  {notifOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-200 shadow-2xl rounded-2xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">
                            Thông báo
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                              {unreadCount} mới
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {isLoadingNotifs && notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-gray-400">
                            Đang tải thông báo...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-gray-400">
                            Chưa có thông báo nào
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={`p-3.5 hover:bg-gray-50/80 transition-colors flex gap-3 cursor-pointer ${
                                !item.isRead ? "bg-rose-50/30" : ""
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {item.type === "ORDER" ? (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Package className="w-4 h-4" />
                                  </div>
                                ) : item.type === "INVENTORY" ? (
                                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs ${
                                    !item.isRead
                                      ? "font-bold text-gray-900"
                                      : "font-medium text-gray-700"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                  {item.message}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                  {formatRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              {!item.isRead && (
                                <div className="w-2 h-2 rounded-full bg-rose-600 shrink-0 self-center" />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
                        <Link
                          href="/profile?tab=orders"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors block py-0.5"
                        >
                          Xem tất cả đơn hàng
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Link
                href={isAuthenticated ? "/profile" : "/login"}
                className="flex flex-col items-center hover:text-rose-600 transition-colors max-w-[100px]"
                title={
                  isAuthenticated && user
                    ? `${userDisplayName}${user.email ? ` (${user.email})` : ""}`
                    : "Đăng nhập / Tài khoản"
                }
              >
                <UserCircle className="w-6 h-6 shrink-0" />
                <span className="text-[11px] mt-1 hidden lg:block font-medium truncate max-w-full">
                  {userDisplayName}
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Box with Category Autocomplete */}
          <div className="mt-3 md:hidden">
            <CategorySearchAutocomplete
              categories={categories}
              placeholder="Tìm quần áo, phụ kiện..."
              isMobile
            />
          </div>
        </div>
      </header>
    </>
  );
}
