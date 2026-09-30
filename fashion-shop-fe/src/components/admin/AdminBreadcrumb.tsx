"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const defaultLabels: Record<string, string> = {
  admin: "Dashboard",
  products: "Sản phẩm",
  orders: "Đơn hàng",
  purchase: "Nhập kho",
  analytics: "Phân tích",
  accounts: "Tài khoản",
  promotions: "Khuyến mãi",
  "audit-logs": "Nhật ký hoạt động",
};

export function AdminBreadcrumb({
  items,
  className = "",
}: AdminBreadcrumbProps) {
  const pathname = usePathname();

  // If explicit items provided
  if (items && items.length > 0) {
    return (
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1.5 text-xs text-muted-foreground font-medium ${className}`}
      >
        <Link
          href="/admin"
          className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Admin</span>
        </Link>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground font-semibold" : ""}>
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  }

  // Auto detect segments from pathname
  const segments = pathname.split("/").filter(Boolean); // e.g. ["admin", "products"]

  if (segments.length <= 1) {
    return (
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1.5 text-xs text-foreground font-semibold ${className}`}
      >
        <Home className="w-3.5 h-3.5 text-primary" />
        <span>Dashboard</span>
      </nav>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [];
  let cumulative = "";

  segments.forEach((seg, idx) => {
    cumulative += `/${seg}`;
    const label = defaultLabels[seg] || decodeURIComponent(seg);
    breadcrumbItems.push({
      label,
      href: idx < segments.length - 1 ? cumulative : undefined,
    });
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-muted-foreground font-medium ${className}`}
    >
      <Link
        href="/admin"
        className="text-muted-foreground/70 hover:text-foreground transition-colors p-0.5"
        title="Admin Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1;

        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-semibold" : ""}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
