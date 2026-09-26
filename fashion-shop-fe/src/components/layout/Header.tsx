"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/book";
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { items } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Lấy dữ liệu thể loại
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const mainCategories = Array.isArray(categoriesData) ? categoriesData : [];

  const handleMouseEnterMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowDropdown(true);
    if (hoveredCategory === null && mainCategories.length > 0) {
      setHoveredCategory(mainCategories[0].id);
    }
  };

  const handleMouseLeaveMenu = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
      setHoveredCategory(null);
    }, 300);
  };

  return (
    <>
      <div className="w-full bg-[#c92127] text-white text-center py-2 text-sm font-semibold tracking-wide">
        Mừng đại lễ - Ưu đãi giảm giá cực sốc!
      </div>

      <header className="bg-white sticky top-0 z-50 shadow-sm border-b">
        <div className="w-full max-w-[1230px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6 relative">
            {/* Logo & Category */}
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/">
                <div className="text-3xl font-bold text-[#c92127]">FAHASA</div>
              </Link>

              <div
                className="hidden md:flex items-center text-gray-600 hover:text-[#c92127] cursor-pointer"
                onMouseEnter={handleMouseEnterMenu}
                onMouseLeave={handleMouseLeaveMenu}
              >
                <Grid className="w-6 h-6 mr-1" />
                <ChevronDown className="w-4 h-4" />
              </div>

              {/* Mega Dropdown Menu */}
              {showDropdown && (
                <div
                  ref={dropdownMenuRef}
                  className="absolute top-full left-0 mt-3 w-[800px] bg-white border border-gray-200 shadow-xl rounded-b-md flex z-50 overflow-hidden"
                  onMouseEnter={handleMouseEnterMenu}
                  onMouseLeave={handleMouseLeaveMenu}
                >
                  {/* Left Sidebar (Main Categories) */}
                  <div className="w-1/3 bg-gray-50 border-r py-2">
                    <ul className="text-sm font-medium text-gray-700">
                      {mainCategories.map((cat: Category) => (
                        <li
                          key={cat.id}
                          className={`px-4 py-3 cursor-pointer hover:text-[#c92127] hover:bg-white transition-colors ${hoveredCategory === cat.id ? "bg-white text-[#c92127] border-l-4 border-[#c92127]" : "border-l-4 border-transparent"}`}
                          onMouseEnter={() => setHoveredCategory(cat.id)}
                        >
                          <Link
                            href={`/products?category=${encodeURIComponent(cat.name)}`}
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Content (Sub Categories) */}
                  <div className="w-2/3 p-6 bg-white">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
                      {
                        mainCategories.find(
                          (c: Category) => c.id === hoveredCategory,
                        )?.name
                      }
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-600">
                      <div className="text-gray-400 italic">
                        Đang cập nhật...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="flex-1 max-w-2xl hidden md:flex">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full border border-gray-300 rounded-md py-2.5 px-4 focus:outline-none focus:border-[#c92127] text-sm"
                />
                <button className="absolute right-0 top-0 h-full px-5 bg-[#c92127] text-white rounded-r-md hover:bg-red-700 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Icons Group */}
            <div className="flex items-center gap-6 text-gray-600 shrink-0">
              <Link
                href="/cart"
                className="flex flex-col items-center hover:text-[#c92127] relative"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
                className="flex flex-col items-center hover:text-[#c92127]"
              >
                <Truck className="w-6 h-6" />
                <span className="text-[11px] mt-1 hidden lg:block font-medium">
                  Đơn hàng
                </span>
              </Link>

              <Link
                href={hasHydrated && user ? "/profile" : "/login"}
                className="flex flex-col items-center hover:text-[#c92127]"
              >
                <UserCircle className="w-6 h-6" />
                <span className="text-[11px] mt-1 hidden lg:block font-medium">
                  Tài khoản
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Box */}
          <div className="mt-3 md:hidden">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full border border-gray-300 rounded-md py-2.5 px-4 focus:outline-none focus:border-[#c92127] text-sm"
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-[#c92127] text-white rounded-r-md">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
