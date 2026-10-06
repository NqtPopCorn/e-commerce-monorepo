"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPromotionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/discounts");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-muted-foreground">Đang chuyển hướng sang Quản lý Giảm giá SP...</p>
    </div>
  );
}
