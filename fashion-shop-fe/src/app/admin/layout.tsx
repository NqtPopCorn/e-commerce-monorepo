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
  Ticket,
  X,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  History,
  Megaphone,
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
    items: [{ name: "Dashboard", link: "/admin", icon: LayoutDashboard }],
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
      { name: "Chiến dịch", link: "/admin/campaigns", icon: Megaphone },
      { name: "Giảm giá SP", link: "/admin/discounts", icon: Percent },
      { name: "Voucher", link: "/admin/vouchers", icon: Ticket },
      { name: "Nhật ký hoạt động", link: "/admin/audit-logs", icon: History },
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
      if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        router.push("/admin/login");
      } else if (
        user.role === "STAFF" &&
        (pathname.startsWith("/admin/accounts") ||
          pathname.startsWith("/admin/analytics") ||
          pathname.startsWith("/admin/audit-logs"))
      ) {
        router.push("/admin");
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

  const isAllowed = user && (user.role === "ADMIN" || user.role === "STAFF");

  if (!mounted || !hasHydrated || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-50 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 h-full bg-card border-r border-border text-card-foreground flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          mobileOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              F
            </div>
            {!isCollapsed && (
              <span className="font-bold text-foreground text-base tracking-tight truncate">
                Fashion Admin
              </span>
            )}
          </Link>

          {/* Toggle button on desktop */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
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
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 admin-scrollbar">
          {(user?.role === "STAFF"
            ? navGroups.filter((g) => g.label !== "QUẢN TRỊ")
            : navGroups
          ).map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              {isCollapsed && <div className="h-px bg-border mb-2 mx-2" />}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.link === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.link ||
                        pathname.startsWith(item.link + "/");

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.link}
                        title={isCollapsed ? item.name : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "bg-muted text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        } ${isCollapsed ? "justify-center px-2" : ""}`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
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
          className="mt-auto border-t border-border bg-card p-3 shrink-0 relative"
        >
          {/* User Popover Menu */}
          {userMenuOpen && (
            <div
              className={`absolute bottom-full mb-2 ${
                isCollapsed ? "left-2 w-44" : "right-3 w-44"
              } bg-popover text-popover-foreground rounded-xl shadow-lg border border-border p-1 z-50 animate-fade-in`}
            >
              <Link
                href="/"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
                <span>Về trang chủ</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4 text-destructive" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* User Info Bar */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div
              onClick={() => isCollapsed && setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20 cursor-pointer"
              title={isCollapsed ? "Tùy chọn tài khoản" : undefined}
            >
              {user.email?.charAt(0).toUpperCase() || "A"}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "Quản trị viên"}
                </p>
                <p
                  className="text-[11px] text-muted-foreground truncate"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Tùy chọn tài khoản"
                aria-label="Tùy chọn tài khoản"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-muted/20">
        <AdminHeaderBar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 admin-scrollbar">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
