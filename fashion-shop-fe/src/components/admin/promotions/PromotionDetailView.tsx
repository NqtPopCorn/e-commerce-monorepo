"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DiscountType,
  Promotion,
  PromotionGroup,
  PromotionKind,
} from "@/types/promotion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
} from "@/components/admin";
import {
  Edit,
  Trash2,
  Ticket,
  Zap,
  Tag,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent,
  Coins,
  ShieldCheck,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface PromotionDetailViewProps {
  promotion: Promotion;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function PromotionDetailView({
  promotion,
  onEdit,
  onDelete,
  isDeleting = false,
}: PromotionDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const handleCopyCode = () => {
    if (promotion.code) {
      navigator.clipboard.writeText(promotion.code);
      setCopied(true);
      toast.success(`Đã sao chép mã: ${promotion.code}`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const calculateDiscount = (
    basePrice: number,
    type?: DiscountType | null,
    val?: number | string | null,
  ) => {
    if (!type || !val || Number(val) <= 0 || basePrice <= 0) return 0;
    const num = Number(val);
    if (type === "PERCENT") {
      return Math.floor((basePrice * num) / 100);
    }
    return Math.min(basePrice, num);
  };

  const getKindBadge = (kind: PromotionKind) => {
    switch (kind) {
      case "VOUCHER":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Ticket className="w-3.5 h-3.5 text-purple-600" />
            <span>Voucher (Mã nhập tay)</span>
          </span>
        );
      case "ORDER_AUTO":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>Tự động đơn hàng</span>
          </span>
        );
      case "CAMPAIGN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Campaign theo dòng sản phẩm</span>
          </span>
        );
    }
  };

  const groups = promotion.groups || [];
  const totalCampaignSKUs = groups.reduce(
    (sum, g) => sum + (g.variants?.length || 0),
    0,
  );
  const activeGroup: PromotionGroup | undefined =
    groups[activeGroupIndex] || groups[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <AdminPageHeader
        title={promotion.name}
        description={`Mã ID: #${promotion.id} · Tạo lúc ${new Date(
          promotion.createdAt,
        ).toLocaleDateString("vi-VN")}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={onEdit}
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 h-9 px-4 text-xs font-semibold shadow-xs"
            >
              <Edit className="w-4 h-4" />
              <span>Chỉnh sửa chương trình</span>
            </Button>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={onDelete}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-9 px-3 text-xs"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              <span>Xóa</span>
            </Button>
          </div>
        }
      />

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Loại chương trình"
          value={
            promotion.kind === "VOUCHER"
              ? "Voucher"
              : promotion.kind === "ORDER_AUTO"
                ? "Tự động đơn"
                : "Campaign SP"
          }
          subtitle={
            promotion.kind === "CAMPAIGN"
              ? "Áp dụng từng dòng (LINE)"
              : promotion.kind === "ORDER_AUTO"
                ? "Áp dụng cấp đơn (ORDER)"
                : "Áp dụng mã giảm (VOUCHER)"
          }
          icon={Layers}
          color="indigo"
        />

        <AdminStatCard
          title="Mức ưu đãi chính"
          value={
            promotion.kind === "CAMPAIGN"
              ? `${groups.length} nhóm SKU`
              : promotion.discountType === "PERCENT"
                ? `Giảm ${promotion.discountValue}%`
                : `Giảm ${Number(promotion.discountValue || 0).toLocaleString("vi-VN")}₫`
          }
          subtitle={
            promotion.kind === "CAMPAIGN"
              ? `Tổng cộng ${totalCampaignSKUs} SKU tham gia`
              : promotion.minOrderAmount
                ? `Đơn tối thiểu ${Number(promotion.minOrderAmount).toLocaleString("vi-VN")}₫`
                : "Không yêu cầu đơn tối thiểu"
          }
          icon={Percent}
          color="rose"
        />

        <AdminStatCard
          title="Độ ưu tiên & Lượt dùng"
          value={
            promotion.kind === "CAMPAIGN"
              ? `Ưu tiên: ${promotion.priority}`
              : promotion.kind === "VOUCHER"
                ? `${promotion.usedCount} / ${promotion.maxUses || "∞"}`
                : "Tự động áp dụng"
          }
          subtitle={
            promotion.kind === "CAMPAIGN"
              ? "Càng cao càng ưu tiên áp dụng"
              : promotion.kind === "VOUCHER"
                ? "Lượt khách đã dùng mã"
                : "Kích hoạt khi đạt điều kiện"
          }
          icon={TrendingDown}
          color="amber"
        />

        <AdminStatCard
          title="Trạng thái hệ thống"
          value={promotion.active ? "Đang chạy" : "Tạm dừng"}
          subtitle={
            promotion.endsAt
              ? `Hết hạn: ${new Date(promotion.endsAt).toLocaleDateString("vi-VN")}`
              : "Hiệu lực vô thời hạn"
          }
          icon={ShieldCheck}
          color={promotion.active ? "emerald" : "slate"}
        />
      </div>

      {/* Waterfall Rule Engine Explanation Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-slate-700/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
                Rule Engine Waterfall
              </span>
              <h3 className="font-bold text-base text-slate-100">
                Cơ chế thực thi khuyến mãi trong giỏ hàng
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Hệ thống áp dụng chính sách chiết khấu 3 tầng nối tiếp nhau. Mỗi
              chương trình hoạt động ở một tầng riêng biệt:
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {getKindBadge(promotion.kind)}
            <AdminStatusBadge
              status={promotion.active ? "ACTIVE" : "INACTIVE"}
              customLabel={promotion.active ? "Đang bật" : "Đã tắt"}
              size="sm"
            />
          </div>
        </div>

        {/* 3 Steps Waterfall Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {/* Step 1: CAMPAIGN */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              promotion.kind === "CAMPAIGN"
                ? "bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-400/30"
                : "bg-slate-800/40 border-slate-700/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-indigo-300">TẦNG 1: CAMPAIGN SP</span>
              {promotion.kind === "CAMPAIGN" && (
                <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-semibold">
                  Chương trình này
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Trừ trực tiếp trên từng đơn vị sản phẩm. Nếu 1 SKU thuộc nhiều
              Campaign, hệ thống chọn Campaign có{" "}
              <strong>Priority cao nhất</strong>.
            </p>
          </div>

          {/* Step 2: ORDER_AUTO */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              promotion.kind === "ORDER_AUTO"
                ? "bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/30"
                : "bg-slate-800/40 border-slate-700/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-sky-300">TẦNG 2: TỰ ĐỘNG ĐƠN</span>
              {promotion.kind === "ORDER_AUTO" && (
                <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.2 rounded font-semibold">
                  Chương trình này
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tính trên tổng giá trị đơn sau khi đã trừ Tầng 1. Tự kích hoạt khi
              đạt giá trị tối thiểu, chọn chương trình có mức giảm cao nhất.
            </p>
          </div>

          {/* Step 3: VOUCHER */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              promotion.kind === "VOUCHER"
                ? "bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/30"
                : "bg-slate-800/40 border-slate-700/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-purple-300">TẦNG 3: VOUCHER CODE</span>
              {promotion.kind === "VOUCHER" && (
                <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.2 rounded font-semibold">
                  Chương trình này
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Áp dụng sau cùng dựa trên số tiền còn lại sau Tầng 1 & 2. Khách
              hàng nhập mã code hợp lệ để nhận chiết khấu bổ sung.
            </p>
          </div>
        </div>
      </div>

      {/* Main Details Configuration Content */}
      {promotion.kind === "VOUCHER" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-600" />
            <span>Chi tiết cấu hình Voucher</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Mã Voucher (Code):
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-mono font-bold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                  {promotion.code}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-purple-700"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1" />
                  )}
                  {copied ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Hình thức giảm giá:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {promotion.discountType === "PERCENT"
                  ? `Giảm ${promotion.discountValue}% trên tổng đơn`
                  : `Giảm ${Number(promotion.discountValue || 0).toLocaleString("vi-VN")}₫`}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Đơn hàng tối thiểu:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {promotion.minOrderAmount
                  ? `${Number(promotion.minOrderAmount).toLocaleString("vi-VN")}₫`
                  : "0₫ (Không giới hạn)"}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Giới hạn số lượt dùng:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {promotion.maxUses
                  ? `${promotion.usedCount} / ${promotion.maxUses} lượt`
                  : `${promotion.usedCount} lượt (Không giới hạn)`}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Thời gian bắt đầu:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {new Date(promotion.startsAt).toLocaleString("vi-VN")}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Thời gian kết thúc:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {promotion.endsAt
                  ? new Date(promotion.endsAt).toLocaleString("vi-VN")
                  : "Vô thời hạn"}
              </div>
            </div>
          </div>
        </div>
      )}

      {promotion.kind === "ORDER_AUTO" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-600" />
            <span>Chi tiết cấu hình Khuyến mãi Tự động Đơn hàng</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Hình thức giảm giá:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {promotion.discountType === "PERCENT"
                  ? `Giảm ${promotion.discountValue}%`
                  : `Giảm ${Number(promotion.discountValue || 0).toLocaleString("vi-VN")}₫`}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Giá trị đơn kích hoạt tối thiểu:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {promotion.minOrderAmount
                  ? `${Number(promotion.minOrderAmount).toLocaleString("vi-VN")}₫`
                  : "0₫ (Mọi đơn hàng)"}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium">
                Thời gian áp dụng:
              </span>
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                Từ {new Date(promotion.startsAt).toLocaleDateString("vi-VN")}{" "}
                {promotion.endsAt
                  ? `đến ${new Date(promotion.endsAt).toLocaleDateString("vi-VN")}`
                  : "(Vô thời hạn)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {promotion.kind === "CAMPAIGN" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>
                  Nhóm Sản Phẩm & Biến Thể Khuyến Mãi ({groups.length} nhóm)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem chi tiết các SKU, giá niêm yết và giá bán thực tế sau khi áp
                dụng chiết khấu nhóm.
              </p>
            </div>
            <div className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-lg font-semibold">
              Độ ưu tiên: <strong>{promotion.priority}</strong>
            </div>
          </div>

          {/* Group Tabs */}
          {groups.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Campaign này chưa có nhóm sản phẩm nào.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
                {groups.map((group, idx) => {
                  const isSelected = idx === activeGroupIndex;
                  return (
                    <button
                      key={group.id || idx}
                      onClick={() => setActiveGroupIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>
                        #{idx + 1}. {group.name}
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                          isSelected
                            ? "bg-rose-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {group.discountType === "PERCENT"
                          ? `-${group.discountValue}%`
                          : `-${Number(group.discountValue).toLocaleString("vi-VN")}₫`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Group Details */}
              {activeGroup && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-800">
                        {activeGroup.name}
                      </span>
                      <span className="text-xs bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded">
                        Mức giảm:{" "}
                        {activeGroup.discountType === "PERCENT"
                          ? `${activeGroup.discountValue}%`
                          : `${Number(activeGroup.discountValue).toLocaleString("vi-VN")}₫`}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Tổng số:{" "}
                      <strong>{activeGroup.variants?.length || 0}</strong> SKU
                      trong nhóm này
                    </span>
                  </div>

                  {/* SKU Variants Table */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-200">
                          <TableHead className="w-[120px] text-xs font-semibold text-slate-600">
                            SKU
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600">
                            Sản phẩm & Biến thể
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            Giá niêm yết
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            Số tiền giảm
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            Giá sau giảm
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!activeGroup.variants ||
                        activeGroup.variants.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="h-20 text-center text-xs text-slate-400"
                            >
                              Chưa có SKU nào trong nhóm này.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeGroup.variants.map((pv, vIdx) => {
                            const originalPrice = Number(
                              pv.variant?.sellingPrice || 0,
                            );
                            const discountAmount = calculateDiscount(
                              originalPrice,
                              activeGroup.discountType,
                              activeGroup.discountValue,
                            );
                            const finalPrice = Math.max(
                              0,
                              originalPrice - discountAmount,
                            );
                            const prodName =
                              pv.variant?.product?.name || "Sản phẩm";
                            const sku =
                              pv.variant?.sku || `SKU-#${pv.variantId}`;

                            return (
                              <TableRow
                                key={pv.variantId || vIdx}
                                className="hover:bg-slate-50/70 border-b border-slate-100"
                              >
                                <TableCell className="font-mono text-xs text-slate-600 font-medium">
                                  {sku}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-xs text-slate-900">
                                      {prodName}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      Variant ID: #{pv.variantId}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-xs text-slate-400 line-through">
                                  {originalPrice.toLocaleString("vi-VN")}₫
                                </TableCell>
                                <TableCell className="text-right text-xs text-emerald-600 font-semibold">
                                  -{discountAmount.toLocaleString("vi-VN")}₫
                                </TableCell>
                                <TableCell className="text-right font-bold text-xs text-rose-600">
                                  {finalPrice.toLocaleString("vi-VN")}₫
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
