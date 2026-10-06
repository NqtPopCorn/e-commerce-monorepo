"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin";
import { DiscountForm } from "@/components/admin/discounts/DiscountForm";

export default function CreateDiscountPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Giảm giá sản phẩm", href: "/admin/discounts" },
          { label: "Tạo mới" },
        ]}
        title="Tạo chương trình giảm giá"
        description="Thiết lập chương trình chiết khấu Flash Sale hoặc giảm giá trực tiếp trên giá bán sản phẩm."
      />
      <DiscountForm />
    </div>
  );
}
