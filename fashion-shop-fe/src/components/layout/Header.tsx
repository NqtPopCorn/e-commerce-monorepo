"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/product";
import {
  Search,
  ShoppingCart,
  Truck,
  UserCircle,
  Grid,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";

export default function Header() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { items } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    }
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

            {/* Search Box */}
            <div className="flex-1 max-w-2xl hidden md:flex">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm áo thun, sơ mi, quần jeans, váy..."
                  className="w-full border border-gray-300 rounded-full py-2 px-5 pr-12 focus:outline-none focus:border-rose-500 text-sm transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-4 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors flex items-center justify-center"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
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

              <Link
                href="/orders"
                className="flex flex-col items-center hover:text-rose-600 transition-colors"
              >
                <Truck className="w-6 h-6" />
                <span className="text-[11px] mt-1 hidden lg:block font-medium">
                  Đơn hàng
                </span>
              </Link>

              <Link
                href={hasHydrated && user ? "/profile" : "/login"}
                className="flex flex-col items-center hover:text-rose-600 transition-colors"
              >
                <UserCircle className="w-6 h-6" />
                <span className="text-[11px] mt-1 hidden lg:block font-medium">
                  {hasHydrated && user
                    ? user.firstName || "Tài khoản"
                    : "Tài khoản"}
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Box */}
          <div className="mt-3 md:hidden">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm quần áo, phụ kiện..."
                className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 focus:outline-none focus:border-rose-500 text-sm"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-rose-600 text-white rounded-full"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
    </>
  );
}
