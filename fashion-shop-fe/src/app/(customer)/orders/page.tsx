"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile?tab=orders");
  }, [router]);

  return (
    <div className="py-24 text-center text-muted-foreground text-sm">
      Đang chuyển đến trang đơn hàng của bạn...
    </div>
  );
}
