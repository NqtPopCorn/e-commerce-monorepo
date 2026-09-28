"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import {
  LayoutDashboard,
  Shirt,
  ShoppingBag,
  Truck,
  BarChart3,
  Users,
  Percent,
  X,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { AdminHeaderBar } from "@/components/admin";

interface NavItem {
  name: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { name: "Dashboard", link: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "VẬN HÀNH",
    items: [
      { name: "Sản phẩm", link: "/admin/products", icon: Shirt },
      { name: "Đơn hàng", link: "/admin/orders", icon: ShoppingBag },
      { name: "Nhập kho", link: "/admin/purchase", icon: Truck },
    ],
  },
  {
    label: "QUẢN TRỊ",
    items: [
      { name: "Phân tích", link: "/admin/analytics", icon: BarChart3 },
      { name: "Tài khoản", link: "/admin/accounts", icon: Users },
      { name: "Khuyến mãi", link: "/admin/promotions", icon: Percent },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (mounted && hasHydrated) {
      if (!user || user.role !== "ADMIN") {
        router.push("/admin/login");
      }
    }
  }, [mounted, hasHydrated, user, router, pathname]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  // Login page has its own standalone layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted || !hasHydrated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-50/60 text-slate-900 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-50 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 h-full bg-white border-r border-slate-200/80 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              F
            </div>
            {!isCollapsed && (
              <span className="font-bold text-slate-900 text-base tracking-tight truncate">
                Fashion Admin
              </span>
            )}
          </Link>

          {/* Toggle button on desktop */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 admin-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              {isCollapsed && (
                <div className="h-px bg-slate-100 mb-2 mx-2" />
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.link === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.link || pathname.startsWith(item.link + "/");

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.link}
                        title={isCollapsed ? item.name : undefined}
                        className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "bg-rose-50/80 text-rose-600 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        } ${isCollapsed ? "justify-center px-2" : ""}`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-rose-600 rounded-r" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-rose-600"
                              : "text-slate-400 group-hover:text-slate-700"
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sticky Bottom: User Profile & Actions */}
        <div
          ref={userMenuRef}
          className="mt-auto border-t border-slate-200/80 bg-white p-3 shrink-0 relative"
        >
          {/* User Popover Menu */}
          {userMenuOpen && (
            <div
              className={`absolute bottom-full mb-2 ${
                isCollapsed ? "left-2 w-44" : "right-3 w-44"
              } bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-50 animate-fade-in`}
            >
              <Link
                href="/"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Về trang chủ</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* User Info Bar */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div
              onClick={() => isCollapsed && setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-200 cursor-pointer"
              title={isCollapsed ? "Tùy chọn tài khoản" : undefined}
            >
              {user.email?.charAt(0).toUpperCase() || "A"}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "Quản trị viên"}
                </p>
                <p className="text-[11px] text-slate-500 truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Tùy chọn tài khoản"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <AdminHeaderBar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 admin-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
