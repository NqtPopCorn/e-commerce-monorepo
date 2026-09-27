"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import {
  Shirt,
  ShoppingBag,
  Truck,
  BarChart,
  User,
  Percent,
  Menu,
  LogOut,
  Home,
} from "lucide-react";

const allNavs = [
  {
    name: "Products",
    link: "/admin/products",
    icon: <Shirt className="w-5 h-5 mr-3" />,
  },
  {
    name: "Orders",
    link: "/admin/orders",
    icon: <ShoppingBag className="w-5 h-5 mr-3" />,
  },
  {
    name: "Purchase",
    link: "/admin/purchase",
    icon: <Truck className="w-5 h-5 mr-3" />,
  },
  {
    name: "Analytics",
    link: "/admin/analytics",
    icon: <BarChart className="w-5 h-5 mr-3" />,
  },
  {
    name: "Accounts",
    link: "/admin/accounts",
    icon: <User className="w-5 h-5 mr-3" />,
  },
  {
    name: "Promotions",
    link: "/admin/promotions",
    icon: <Percent className="w-5 h-5 mr-3" />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && hasHydrated) {
      if (!user || user.role !== "ADMIN") {
        router.push("/login");
      }
    }
  }, [mounted, hasHydrated, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!mounted || !hasHydrated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <span
              className="font-medium line-clamp-1 max-w-[120px]"
              title={user.email}
            >
              {user.email}
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {allNavs.map((nav) => (
              <li key={nav.name}>
                <Link
                  href={nav.link}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors"
                >
                  {nav.icon}
                  <span className="font-medium">{nav.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t space-y-2">
          <Link
            href="/"
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Go to Home</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
