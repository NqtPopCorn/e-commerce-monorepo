"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatePromotionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/discounts/create");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-muted-foreground">Đang chuyển hướng sang Tạo giảm giá SP...</p>
    </div>
  );
}
