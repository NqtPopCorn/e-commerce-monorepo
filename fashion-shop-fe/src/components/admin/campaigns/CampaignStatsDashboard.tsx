"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Percent,
  Ticket,
  Package,
  Layers,
  Calendar,
  ExternalLink,
  Plus,
  Edit,
  ArrowRight,
} from "lucide-react";
import { CampaignStatsResponse } from "@/types/campaign";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

interface CampaignStatsDashboardProps {
  stats: CampaignStatsResponse;
  onRefresh?: () => void;
}

export function CampaignStatsDashboard({ stats }: CampaignStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "products" | "discounts" | "vouchers"
  >("products");

  const { campaign, summary, topProducts, discounts, vouchers } = stats;

  const budgetProgress =
    campaign.budgetLimit && campaign.budgetLimit > 0
      ? Math.min(
          100,
          Math.round((campaign.spentAmount / campaign.budgetLimit) * 100),
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Campaign Highlights Card */}
      <Card className="border border-border/80 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {campaign.name}
                </h2>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              {campaign.description && (
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {campaign.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Bắt đầu:{" "}
                  <strong className="text-foreground">
                    {formatDate(campaign.startsAt)}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Kết thúc:{" "}
                  <strong className="text-foreground">
                    {campaign.endsAt
                      ? formatDate(campaign.endsAt)
                      : "Không giới hạn"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Sửa chiến dịch
                </Link>
              </Button>
            </div>
          </div>

          {/* Budget progress bar */}
          {campaign.budgetLimit !== null && (
            <div className="mt-5 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">
                  Tiến độ chi ngân sách
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(campaign.spentAmount)} /{" "}
                  {formatCurrency(campaign.budgetLimit)} ({budgetProgress}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    budgetProgress >= 90
                      ? "bg-destructive"
                      : budgetProgress >= 70
                        ? "bg-warning"
                        : "bg-primary"
                  }`}
                  style={{ width: `${budgetProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>
                  Còn lại: {formatCurrency(campaign.remainingBudget || 0)}
                </span>
                <span>Giới hạn: {formatCurrency(campaign.budgetLimit)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Tổng ưu đãi trợ giá"
          value={formatCurrency(summary.totalDiscountAmount)}
          subtitle={
            campaign.budgetLimit
              ? `Chi ${budgetProgress}% ngân sách`
              : "Không giới hạn trần"
          }
          icon={DollarSign}
          color="rose"
        />

        <AdminStatCard
          title="Doanh thu tạo ra"
          value={formatCurrency(summary.totalOrderRevenue)}
          subtitle={`Từ ${summary.totalOrdersImpacted} đơn hàng thành công`}
          icon={TrendingUp}
          color="emerald"
        />

        <AdminStatCard
          title="Lượt áp dụng ưu đãi"
          value={summary.totalApplicationsCount}
          subtitle={`${summary.discountApplicationsCount} giảm SP • ${summary.voucherApplicationsCount} voucher`}
          icon={ShoppingBag}
          color="sky"
        />

        <AdminStatCard
          title="Khách hàng hưởng lợi"
          value={summary.uniqueCustomerCount}
          subtitle={`Phủ ${discounts.length} giảm giá & ${vouchers.length} voucher`}
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border/80 flex items-center justify-between">
        <div className="flex space-x-1 sm:space-x-3">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`py-3 px-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-4 w-4" />
            Top sản phẩm trợ giá
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {topProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("discounts")}
            className={`py-3 px-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "discounts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Percent className="h-4 w-4" />
            Chương trình giảm giá SP
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {discounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vouchers")}
            className={`py-3 px-3.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "vouchers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4" />
            Mã voucher thuộc chiến dịch
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {vouchers.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {activeTab === "discounts" && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
            >
              <Link href={`/admin/discounts/create?campaignId=${campaign.id}`}>
                <Plus className="h-3.5 w-3.5" />
                Thêm giảm giá
              </Link>
            </Button>
          )}
          {activeTab === "vouchers" && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
            >
              <Link href={`/admin/vouchers/create?campaignId=${campaign.id}`}>
                <Plus className="h-3.5 w-3.5" />
                Thêm voucher
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Top Products */}
      {activeTab === "products" && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Sản phẩm & Biến thể được trợ giá nhiều nhất</span>
              <span className="text-xs font-normal text-muted-foreground">
                Xếp theo tổng giá trị tiền ưu đãi
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Chưa có sản phẩm nào được áp dụng giảm giá trong chiến dịch này.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Sản phẩm / Biến thể</TableHead>
                    <TableHead>Mã SKU</TableHead>
                    <TableHead className="text-right">Số lượng bán</TableHead>
                    <TableHead className="text-right">Lượt áp dụng</TableHead>
                    <TableHead className="text-right">
                      Tổng tiền trợ giá
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p, idx) => (
                    <TableRow key={`${p.sku}_${idx}`}>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {p.productName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          {p.sku || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.totalQuantity.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.appliedCount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(p.totalDiscount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Discounts List */}
      {activeTab === "discounts" && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Chương trình giảm giá sản phẩm trực thuộc</span>
              <span className="text-xs font-normal text-muted-foreground">
                {discounts.length} chương trình
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {discounts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-3">
                <p>
                  Chiến dịch này chưa được liên kết với chương trình giảm giá
                  sản phẩm nào.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/admin/discounts/create?campaignId=${campaign.id}`}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Tạo chương trình giảm giá ngay
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên chương trình</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Lượt dùng</TableHead>
                    <TableHead className="text-right">Đã chi</TableHead>
                    <TableHead className="text-right">Ngân sách</TableHead>
                    <TableHead className="w-16 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link
                          href={`/admin/discounts/${d.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {d.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge
                          status={d.active ? "ACTIVE" : "INACTIVE"}
                          customLabel={d.active ? "Đang bật" : "Đã tắt"}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(d.startsAt)} -{" "}
                        {d.endsAt ? formatDate(d.endsAt) : "Vô thời hạn"}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {d.usedCount} {d.maxUses ? `/ ${d.maxUses}` : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(d.spentAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {d.budgetLimit
                          ? formatCurrency(d.budgetLimit)
                          : "Không giới hạn"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Link href={`/admin/discounts/${d.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Vouchers List */}
      {activeTab === "vouchers" && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Mã giảm giá (Voucher) trực thuộc</span>
              <span className="text-xs font-normal text-muted-foreground">
                {vouchers.length} mã
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {vouchers.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-3">
                <p>Chiến dịch này chưa được liên kết với mã voucher nào.</p>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/admin/vouchers/create?campaignId=${campaign.id}`}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Tạo mã voucher ngay
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã voucher</TableHead>
                    <TableHead>Tên hiển thị</TableHead>
                    <TableHead>Mức giảm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Lượt dùng</TableHead>
                    <TableHead className="text-right">Đã chi</TableHead>
                    <TableHead className="w-16 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <code className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded font-mono font-bold">
                          {v.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/vouchers/${v.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {v.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {v.discountType === "PERCENT"
                          ? `Giảm ${v.discountValue}%`
                          : `Giảm ${formatCurrency(v.discountValue)}`}
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge
                          status={v.active ? "ACTIVE" : "INACTIVE"}
                          customLabel={v.active ? "Hoạt động" : "Đã tắt"}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {v.usedCount} {v.maxUses ? `/ ${v.maxUses}` : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(v.spentAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Link href={`/admin/vouchers/${v.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
