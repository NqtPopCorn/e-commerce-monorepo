"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin";
import { VoucherForm } from "@/components/admin/vouchers/VoucherForm";

export default function CreateVoucherPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Mã giảm giá", href: "/admin/vouchers" },
          { label: "Tạo mới" },
        ]}
        title="Tạo mã voucher mới"
        description="Thiết lập mã coupon giảm giá cấp đơn hàng, quy định tỷ lệ giảm hoặc số tiền khấu trừ cố định."
      />
      <VoucherForm />
    </div>
  );
}
