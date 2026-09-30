"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreatePromotionDto,
  CreateVoucherDto,
  DiscountType,
  Promotion,
  PromotionGroupDto,
  PromotionKind,
} from "@/types/promotion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { PromotionTypeSelector } from "./PromotionTypeSelector";
import { PromotionSummarySidebar } from "./PromotionSummarySidebar";
import { CampaignGroupsEditor } from "./CampaignGroupsEditor";
import {
  Calendar,
  Clock,
  Coins,
  Percent,
  Sparkles,
  Ticket,
  Zap,
  Tag,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromotionFormProps {
  initialData?: Promotion;
  onSubmit: (data: CreatePromotionDto) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function PromotionForm({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}: PromotionFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  // Determine initial kind
  const initialKind: PromotionKind =
    initialData?.kind ||
    (initialData?.applicationType === "VOUCHER"
      ? "VOUCHER"
      : initialData?.campaignId ||
          (initialData?.groups &&
            initialData.groups.length > 0 &&
            initialData.groups[0]?.variants &&
            initialData.groups[0].variants.length > 0)
        ? "CAMPAIGN"
        : "ORDER_AUTO");

  // SECTION 1: Thông tin chương trình
  const [kind, setKind] = useState<PromotionKind>(initialKind);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [active, setActive] = useState<boolean>(
    initialData?.active !== undefined ? initialData.active : true,
  );

  // SECTION 2: Thời gian áp dụng
  const formatIsoForInput = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [startsAt, setStartsAt] = useState<string>(
    formatIsoForInput(initialData?.startsAt) ||
      formatIsoForInput(new Date().toISOString()),
  );
  const [isEndsAtUnlimited, setIsEndsAtUnlimited] = useState<boolean>(
    !initialData?.endsAt,
  );
  const [endsAt, setEndsAt] = useState<string>(
    formatIsoForInput(initialData?.endsAt),
  );

  // SECTION 3: Cấu hình ưu đãi
  const [code, setCode] = useState(
    initialData?.vouchers?.[0]?.code || initialData?.code || "",
  );
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialData?.groups?.[0]?.discountType ||
      initialData?.discountType ||
      "PERCENT",
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.groups?.[0]?.discountValue
      ? Number(initialData.groups[0].discountValue)
      : initialData?.discountValue
        ? Number(initialData.discountValue)
        : 10,
  );

  // Giảm tối đa (nếu PERCENT)
  const [isMaxDiscountUnlimited, setIsMaxDiscountUnlimited] = useState<boolean>(
    !(
      initialData?.groups?.[0]?.maxDiscountValue ||
      initialData?.maxDiscountValue
    ),
  );
  const [maxDiscountValue, setMaxDiscountValue] = useState<number | undefined>(
    initialData?.groups?.[0]?.maxDiscountValue
      ? Number(initialData.groups[0].maxDiscountValue)
      : initialData?.maxDiscountValue
        ? Number(initialData.maxDiscountValue)
        : undefined,
  );

  // Đơn tối thiểu
  const [isMinOrderUnlimited, setIsMinOrderUnlimited] = useState<boolean>(
    !initialData?.minOrderAmount || Number(initialData.minOrderAmount) === 0,
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number>(
    initialData?.minOrderAmount ? Number(initialData.minOrderAmount) : 0,
  );

  // Campaign groups
  const [priority, setPriority] = useState<number>(initialData?.priority || 0);
  const [groups, setGroups] = useState<PromotionGroupDto[]>(() => {
    if (initialData?.groups && initialData.groups.length > 0) {
      return initialData.groups.map((g) => ({
        name: g.name,
        sortOrder: g.sortOrder,
        discountType: g.discountType,
        discountValue: Number(g.discountValue),
        maxDiscountValue: g.maxDiscountValue
          ? Number(g.maxDiscountValue)
          : undefined,
        variantIds: g.variants ? g.variants.map((v) => v.variantId) : [],
      }));
    }
    return [];
  });

  // SECTION 4: Giới hạn & Ngân sách
  const [isBudgetUnlimited, setIsBudgetUnlimited] = useState<boolean>(
    !initialData?.budgetLimit,
  );
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(
    initialData?.budgetLimit ? Number(initialData.budgetLimit) : undefined,
  );

  const [isMaxUsesUnlimited, setIsMaxUsesUnlimited] = useState<boolean>(
    !(initialData?.maxUses || initialData?.vouchers?.[0]?.maxUses),
  );
  const [maxUses, setMaxUses] = useState<number | undefined>(
    initialData?.maxUses
      ? Number(initialData.maxUses)
      : initialData?.vouchers?.[0]?.maxUses
        ? Number(initialData.vouchers[0].maxUses)
        : undefined,
  );

  const [isMaxUsesPerCustomerUnlimited, setIsMaxUsesPerCustomerUnlimited] =
    useState<boolean>(!initialData?.vouchers?.[0]?.maxUsesPerCustomer);
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState<
    number | undefined
  >(
    initialData?.vouchers?.[0]?.maxUsesPerCustomer
      ? Number(initialData.vouchers[0].maxUsesPerCustomer)
      : undefined,
  );

  // Generate random voucher code helper
  const handleGenerateRandomCode = () => {
    const prefixes = ["SALE", "VIP", "DEAL", "FS", "DISC"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    setCode(`${prefix}${randomNum}${suffix}`);
    toast.success("Đã sinh mã voucher ngẫu nhiên");
  };

  // Compute live time status
  const now = new Date();
  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt && !isEndsAtUnlimited ? new Date(endsAt) : null;

  let timeStatusLabel = "Đang hoạt động";
  let timeStatusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let TimeIcon = CheckCircle2;

  if (startDate && startDate > now) {
    timeStatusLabel = "Chưa bắt đầu";
    timeStatusClass = "bg-amber-50 text-amber-700 border-amber-200";
    TimeIcon = Clock;
  } else if (endDate && endDate < now) {
    timeStatusLabel = "Đã kết thúc";
    timeStatusClass = "bg-rose-50 text-rose-700 border-rose-200";
    TimeIcon = AlertCircle;
  }

  // Form submission handler
  const buildPayloadAndSubmit = (overrideActive?: boolean) => {
    // 1. Validation
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên chương trình khuyến mãi");
      return;
    }
    if (!startsAt) {
      toast.error("Vui lòng chọn thời gian bắt đầu");
      return;
    }
    if (
      !isEndsAtUnlimited &&
      endsAt &&
      new Date(startsAt) >= new Date(endsAt)
    ) {
      toast.error("Thời gian bắt đầu phải trước thời gian kết thúc");
      return;
    }

    if (kind === "VOUCHER") {
      if (!code.trim()) {
        toast.error("Chương trình Voucher bắt buộc phải có mã code");
        return;
      }
      if (!discountValue || discountValue <= 0) {
        toast.error("Mức giảm giá phải lớn hơn 0");
        return;
      }
      if (
        discountType === "PERCENT" &&
        (discountValue < 1 || discountValue > 100)
      ) {
        toast.error("Phần trăm giảm giá phải nằm trong khoảng 1% - 100%");
        return;
      }
    } else if (kind === "ORDER_AUTO") {
      if (!discountValue || discountValue <= 0) {
        toast.error("Mức giảm giá phải lớn hơn 0");
        return;
      }
      if (
        discountType === "PERCENT" &&
        (discountValue < 1 || discountValue > 100)
      ) {
        toast.error("Phần trăm giảm giá phải nằm trong khoảng 1% - 100%");
        return;
      }
    } else if (kind === "CAMPAIGN") {
      if (!groups || groups.length === 0) {
        toast.error("Campaign phải chứa ít nhất 1 nhóm sản phẩm");
        return;
      }
      for (const g of groups) {
        if (!g.variantIds || g.variantIds.length === 0) {
          toast.error(`Nhóm "${g.name}" chưa có sản phẩm nào được chọn`);
          return;
        }
      }
    }

    // 2. Prepare groups
    let finalGroups: PromotionGroupDto[] = [];
    if (kind === "CAMPAIGN") {
      finalGroups = groups;
    } else if (kind === "ORDER_AUTO") {
      finalGroups = [
        {
          name: "Chiết khấu hóa đơn tự động",
          sortOrder: 1,
          discountType,
          discountValue,
          maxDiscountValue:
            discountType === "PERCENT" && !isMaxDiscountUnlimited
              ? maxDiscountValue
              : undefined,
          variantIds: [],
        },
      ];
    } else if (kind === "VOUCHER") {
      finalGroups = [
        {
          name: "Chiết khấu Voucher",
          sortOrder: 1,
          discountType,
          discountValue,
          maxDiscountValue:
            discountType === "PERCENT" && !isMaxDiscountUnlimited
              ? maxDiscountValue
              : undefined,
          variantIds: [],
        },
      ];
    }

    // 3. Prepare vouchers payload
    const effectiveActive =
      overrideActive !== undefined ? overrideActive : active;
    const finalVouchers: CreateVoucherDto[] | undefined =
      kind === "VOUCHER"
        ? [
            {
              code: code.trim().toUpperCase(),
              maxUses: !isMaxUsesUnlimited ? maxUses : undefined,
              maxUsesPerCustomer: !isMaxUsesPerCustomerUnlimited
                ? maxUsesPerCustomer
                : undefined,
              startsAt: new Date(startsAt).toISOString(),
              endsAt:
                !isEndsAtUnlimited && endsAt
                  ? new Date(endsAt).toISOString()
                  : undefined,
              active: effectiveActive,
            },
          ]
        : undefined;

    const payload: CreatePromotionDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      applicationType: kind === "VOUCHER" ? "VOUCHER" : "AUTO",
      kind,
      active: effectiveActive,
      priority: kind === "CAMPAIGN" ? priority : 0,
      budgetLimit: !isBudgetUnlimited ? budgetLimit : undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt:
        !isEndsAtUnlimited && endsAt
          ? new Date(endsAt).toISOString()
          : undefined,
      code: kind === "VOUCHER" ? code.trim().toUpperCase() : undefined,
      minOrderAmount:
        kind !== "CAMPAIGN" && !isMinOrderUnlimited
          ? minOrderAmount
          : undefined,
      maxUses: kind === "VOUCHER" && !isMaxUsesUnlimited ? maxUses : undefined,
      groups: finalGroups,
      vouchers: finalVouchers,
    };

    onSubmit(payload);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/admin/promotions");
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* 1. Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <AdminBreadcrumb
            items={[
              { label: "Khuyến mãi", href: "/admin/promotions" },
              {
                label: isEditMode
                  ? "Chỉnh sửa chương trình"
                  : "Tạo chương trình mới",
              },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">
            {isEditMode
              ? `Chỉnh sửa: ${initialData?.name || name}`
              : "Tạo chương trình khuyến mãi"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isEditMode
              ? "Cập nhật các chính sách ưu đãi, hạn mức ngân sách và điều kiện áp dụng."
              : "Thiết lập cấu hình ưu đãi, thời gian hiệu lực và ngân sách cho chương trình khuyến mãi."}
          </p>
        </div>

      </div>

      {/* 2. Main Content 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Sections (70-75%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1 — Thông tin chương trình */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-600" />
                <h2 className="font-semibold text-base text-foreground">
                  1. Thông tin chương trình
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chọn mô hình chiết khấu và thiết lập các thông tin định danh cơ
                bản.
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* Type Selection Horizontal Cards */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Loại chương trình khuyến mãi *
                </Label>
                <PromotionTypeSelector
                  value={kind}
                  onChange={setKind}
                  disabled={isEditMode}
                />
              </div>

              {/* Program Name & Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="promo-name"
                    className="text-xs font-medium text-foreground"
                  >
                    Tên chương trình khuyến mãi *
                  </Label>
                  <Input
                    id="promo-name"
                    placeholder="VD: Giảm 20k đơn từ 200k, Campaign Hè rực rỡ..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background text-sm h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Tên hiển thị nội bộ trong danh sách và quản lý đơn hàng.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Trạng thái kích hoạt *
                  </Label>
                  <div
                    onClick={() => setActive(!active)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all h-9",
                      active
                        ? "bg-emerald-50/60 border-emerald-300 text-emerald-900"
                        : "bg-muted/40 border-border text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          active ? "bg-emerald-600" : "bg-slate-400",
                        )}
                      />
                      <span className="text-xs font-semibold">
                        {active ? "Đang kích hoạt" : "Tạm dừng"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {active ? "Áp dụng khi đến hạn" : "Không áp dụng"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Chương trình chỉ có hiệu lực khi được kích hoạt.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="promo-desc"
                  className="text-xs font-medium text-foreground"
                >
                  Mô tả / Ghi chú chương trình
                </Label>
                <Textarea
                  id="promo-desc"
                  placeholder="Ghi chú nội bộ về mục tiêu kinh doanh, điều kiện áp dụng hoặc phòng ban phụ trách..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background text-xs min-h-[68px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2 — Thời gian áp dụng */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-semibold text-base text-foreground">
                    2. Thời gian áp dụng
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Khung giờ hiệu lực của chương trình chiết khấu trên hệ thống.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                  Múi giờ: GMT+7 (Việt Nam)
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border",
                    timeStatusClass,
                  )}
                >
                  <TimeIcon className="w-3 h-3" />
                  <span>{timeStatusLabel}</span>
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* StartsAt */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="starts-at"
                    className="text-xs font-medium text-foreground"
                  >
                    Thời gian bắt đầu *
                  </Label>
                  <Input
                    id="starts-at"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="bg-background text-xs h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Hệ thống bắt đầu kích hoạt chiết khấu từ thời điểm này.
                  </p>
                </div>

                {/* EndsAt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="ends-at"
                      className="text-xs font-medium text-foreground"
                    >
                      Thời gian kết thúc
                    </Label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                      <Checkbox
                        checked={isEndsAtUnlimited}
                        onChange={(e) => {
                          setIsEndsAtUnlimited(e.target.checked);
                          if (e.target.checked) setEndsAt("");
                        }}
                      />
                      <span>Không giới hạn</span>
                    </label>
                  </div>

                  {!isEndsAtUnlimited ? (
                    <Input
                      id="ends-at"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="bg-background text-xs h-9"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                      Chương trình có hiệu lực vô thời hạn cho tới khi tắt thủ
                      công.
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Tự động hết hạn khi tới thời điểm kết thúc đã định.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 — Cấu hình ưu đãi (Tùy biến theo Kind) */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                {kind === "VOUCHER" && (
                  <Ticket className="w-4 h-4 text-purple-600" />
                )}
                {kind === "ORDER_AUTO" && (
                  <Zap className="w-4 h-4 text-sky-600" />
                )}
                {kind === "CAMPAIGN" && (
                  <Tag className="w-4 h-4 text-rose-600" />
                )}
                <h2 className="font-semibold text-base text-foreground">
                  {kind === "VOUCHER" && "3. Cấu hình chi tiết Voucher"}
                  {kind === "ORDER_AUTO" &&
                    "3. Cấu hình chiết khấu đơn hàng tự động"}
                  {kind === "CAMPAIGN" &&
                    "3. Nhóm sản phẩm & Mức chiết khấu Campaign"}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kind === "VOUCHER" &&
                  "Quy định mã nhập tay, phương thức chiết khấu và điều kiện áp dụng."}
                {kind === "ORDER_AUTO" &&
                  "Chiết khấu tự động kích hoạt khi giá trị giỏ hàng đạt điều kiện tối thiểu."}
                {kind === "CAMPAIGN" &&
                  "Tạo các nhóm sản phẩm, thiết lập tỷ lệ chiết khấu và phân bổ danh sách SKU."}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* KIND 1: VOUCHER FIELDS */}
              {kind === "VOUCHER" && (
                <div className="space-y-4">
                  {/* Voucher code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="voucher-code"
                        className="text-xs font-medium text-foreground"
                      >
                        Mã voucher (Coupon Code) *
                      </Label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>Tạo mã ngẫu nhiên</span>
                      </button>
                    </div>

                    <Input
                      id="voucher-code"
                      placeholder="VD: WELCOME50, HE2026, FREESHIP"
                      value={code}
                      onChange={(e) =>
                        setCode(
                          e.target.value.toUpperCase().replace(/\s+/g, ""),
                        )
                      }
                      className="bg-background font-mono font-bold uppercase text-sm h-9 tracking-wider text-purple-900 border-purple-200 focus-visible:ring-purple-500"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Mã gồm chữ cái và số viết hoa, không chứa khoảng trắng.
                    </p>
                  </div>

                  {/* Discount Type & Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Hình thức giảm giá *
                      </Label>
                      <Select
                        value={discountType}
                        onValueChange={(val) =>
                          setDiscountType(val as DiscountType)
                        }
                      >
                        <SelectTrigger className="bg-background text-xs h-9">
                          <SelectValue placeholder="Chọn hình thức" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">
                            Theo phần trăm (%)
                          </SelectItem>
                          <SelectItem value="FIXED">
                            Số tiền cố định (VND)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="discount-value"
                        className="text-xs font-medium text-foreground"
                      >
                        {discountType === "PERCENT"
                          ? "Phần trăm giảm (%) *"
                          : "Số tiền giảm (VND) *"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="discount-value"
                          type="number"
                          min={1}
                          max={discountType === "PERCENT" ? 100 : undefined}
                          value={discountValue || ""}
                          onChange={(e) =>
                            setDiscountValue(parseFloat(e.target.value) || 0)
                          }
                          className="bg-background text-xs h-9 pr-10 font-semibold"
                          placeholder={
                            discountType === "PERCENT" ? "15" : "50000"
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                          {discountType === "PERCENT" ? "%" : "₫"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Max Discount & Min Order */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Max Discount Value (only if PERCENT) */}
                    {discountType === "PERCENT" ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="max-discount"
                            className="text-xs font-medium text-foreground"
                          >
                            Số tiền giảm tối đa
                          </Label>
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                            <Checkbox
                              checked={isMaxDiscountUnlimited}
                              onChange={(e) => {
                                setIsMaxDiscountUnlimited(e.target.checked);
                                if (e.target.checked)
                                  setMaxDiscountValue(undefined);
                              }}
                            />
                            <span>Không giới hạn</span>
                          </label>
                        </div>

                        {!isMaxDiscountUnlimited ? (
                          <div className="relative">
                            <Input
                              id="max-discount"
                              type="number"
                              min={0}
                              step={5000}
                              value={maxDiscountValue || ""}
                              onChange={(e) =>
                                setMaxDiscountValue(
                                  parseFloat(e.target.value) || undefined,
                                )
                              }
                              className="bg-background text-xs h-9 pr-10 font-medium"
                              placeholder="VD: 50000"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                              ₫
                            </span>
                          </div>
                        ) : (
                          <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                            Giảm toàn bộ theo % không chặn trần số tiền.
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          Hạn mức số tiền tối đa được trừ cho mỗi đơn hàng.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 opacity-60">
                        <Label className="text-xs font-medium text-foreground">
                          Số tiền giảm tối đa
                        </Label>
                        <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                          Áp dụng số tiền cố định, không cần giới hạn trần.
                        </div>
                      </div>
                    )}

                    {/* Min Order Amount */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="min-order"
                          className="text-xs font-medium text-foreground"
                        >
                          Đơn hàng tối thiểu
                        </Label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                          <Checkbox
                            checked={isMinOrderUnlimited}
                            onChange={(e) => {
                              setIsMinOrderUnlimited(e.target.checked);
                              if (e.target.checked) setMinOrderAmount(0);
                            }}
                          />
                          <span>Không yêu cầu</span>
                        </label>
                      </div>

                      {!isMinOrderUnlimited ? (
                        <div className="relative">
                          <Input
                            id="min-order"
                            type="number"
                            min={0}
                            step={10000}
                            value={minOrderAmount || ""}
                            onChange={(e) =>
                              setMinOrderAmount(parseFloat(e.target.value) || 0)
                            }
                            className="bg-background text-xs h-9 pr-10 font-medium"
                            placeholder="VD: 200000"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                            ₫
                          </span>
                        </div>
                      ) : (
                        <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                          Áp dụng cho mọi giá trị đơn hàng (0₫).
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Giá trị đơn hàng tối thiểu để được áp dụng mã.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* KIND 2: ORDER_AUTO FIELDS */}
              {kind === "ORDER_AUTO" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Hình thức giảm giá *
                      </Label>
                      <Select
                        value={discountType}
                        onValueChange={(val) =>
                          setDiscountType(val as DiscountType)
                        }
                      >
                        <SelectTrigger className="bg-background text-xs h-9">
                          <SelectValue placeholder="Chọn hình thức" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">
                            Theo phần trăm (%)
                          </SelectItem>
                          <SelectItem value="FIXED">
                            Số tiền cố định (VND)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="auto-discount-val"
                        className="text-xs font-medium text-foreground"
                      >
                        {discountType === "PERCENT"
                          ? "Phần trăm giảm (%) *"
                          : "Số tiền giảm (VND) *"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="auto-discount-val"
                          type="number"
                          min={1}
                          max={discountType === "PERCENT" ? 100 : undefined}
                          value={discountValue || ""}
                          onChange={(e) =>
                            setDiscountValue(parseFloat(e.target.value) || 0)
                          }
                          className="bg-background text-xs h-9 pr-10 font-semibold"
                          placeholder={
                            discountType === "PERCENT" ? "10" : "30000"
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                          {discountType === "PERCENT" ? "%" : "₫"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {discountType === "PERCENT" ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="auto-max-discount"
                            className="text-xs font-medium text-foreground"
                          >
                            Số tiền giảm tối đa
                          </Label>
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                            <Checkbox
                              checked={isMaxDiscountUnlimited}
                              onChange={(e) => {
                                setIsMaxDiscountUnlimited(e.target.checked);
                                if (e.target.checked)
                                  setMaxDiscountValue(undefined);
                              }}
                            />
                            <span>Không giới hạn</span>
                          </label>
                        </div>

                        {!isMaxDiscountUnlimited ? (
                          <div className="relative">
                            <Input
                              id="auto-max-discount"
                              type="number"
                              min={0}
                              step={5000}
                              value={maxDiscountValue || ""}
                              onChange={(e) =>
                                setMaxDiscountValue(
                                  parseFloat(e.target.value) || undefined,
                                )
                              }
                              className="bg-background text-xs h-9 pr-10 font-medium"
                              placeholder="VD: 50000"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                              ₫
                            </span>
                          </div>
                        ) : (
                          <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                            Giảm toàn bộ theo % không chặn trần số tiền.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 opacity-60">
                        <Label className="text-xs font-medium text-foreground">
                          Số tiền giảm tối đa
                        </Label>
                        <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                          Áp dụng số tiền cố định.
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="auto-min-order"
                          className="text-xs font-medium text-foreground"
                        >
                          Giá trị đơn kích hoạt tối thiểu
                        </Label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                          <Checkbox
                            checked={isMinOrderUnlimited}
                            onChange={(e) => {
                              setIsMinOrderUnlimited(e.target.checked);
                              if (e.target.checked) setMinOrderAmount(0);
                            }}
                          />
                          <span>Mọi đơn hàng (0₫)</span>
                        </label>
                      </div>

                      {!isMinOrderUnlimited ? (
                        <div className="relative">
                          <Input
                            id="auto-min-order"
                            type="number"
                            min={0}
                            step={10000}
                            value={minOrderAmount || ""}
                            onChange={(e) =>
                              setMinOrderAmount(parseFloat(e.target.value) || 0)
                            }
                            className="bg-background text-xs h-9 pr-10 font-medium"
                            placeholder="VD: 250000"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                            ₫
                          </span>
                        </div>
                      ) : (
                        <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                          Tự kích hoạt cho mọi đơn hàng không phụ thuộc giá trị.
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Giá trị đơn sau khi trừ Campaign SP để kích hoạt tầng 2.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* KIND 3: CAMPAIGN FIELDS & GROUPS */}
              {kind === "CAMPAIGN" && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="campaign-priority"
                      className="text-xs font-medium text-foreground"
                    >
                      Độ ưu tiên Campaign (Priority)
                    </Label>
                    <Input
                      id="campaign-priority"
                      type="number"
                      min={0}
                      value={priority}
                      onChange={(e) =>
                        setPriority(parseInt(e.target.value) || 0)
                      }
                      className="bg-background text-xs h-9 max-w-xs font-medium"
                      placeholder="0"
                    />
                    <div className="p-2.5 rounded-lg bg-muted/60 border border-border text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">
                        Quy tắc Rule Engine:
                      </strong>{" "}
                      Khi một SKU sản phẩm nằm trong nhiều Campaign đang chạy
                      đồng thời, hệ thống ưu tiên áp dụng Campaign có{" "}
                      <strong className="text-foreground">
                        Priority cao nhất
                      </strong>
                      . Nếu Priority bằng nhau, mức chiết khấu có giá trị giảm
                      lớn hơn sẽ được chọn.
                    </div>
                  </div>

                  {/* Groups Editor */}
                  <CampaignGroupsEditor
                    groups={groups}
                    onChange={setGroups}
                    currentPromotionId={initialData?.id}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4 — Giới hạn sử dụng & Ngân sách */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-base text-foreground">
                  4. Giới hạn sử dụng & Ngân sách
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kiểm soát rủi ro tài chính và giới hạn số lượt sử dụng ưu đãi.
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Budget Limit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="budget-limit"
                    className="text-xs font-medium text-foreground"
                  >
                    Ngân sách chiết khấu tối đa (VND)
                  </Label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <Checkbox
                      checked={isBudgetUnlimited}
                      onChange={(e) => {
                        setIsBudgetUnlimited(e.target.checked);
                        if (e.target.checked) setBudgetLimit(undefined);
                      }}
                    />
                    <span>Không giới hạn ngân sách</span>
                  </label>
                </div>

                {!isBudgetUnlimited ? (
                  <div className="relative max-w-md">
                    <Input
                      id="budget-limit"
                      type="number"
                      min={0}
                      step={100000}
                      value={budgetLimit || ""}
                      onChange={(e) =>
                        setBudgetLimit(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="bg-background text-xs h-9 pr-14 font-medium"
                      placeholder="VD: 10000000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      VNĐ
                    </span>
                  </div>
                ) : (
                  <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground max-w-md">
                    Chương trình không giới hạn số tiền chiết khấu tối đa.
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Hệ thống tự động ngừng áp dụng chiết khấu khi tổng số tiền
                  giảm giá lũy kế đạt tới hạn mức ngân sách này.
                </p>
              </div>

              {/* Usage limits for Voucher */}
              {kind === "VOUCHER" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                  {/* Total max uses */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="max-uses"
                        className="text-xs font-medium text-foreground"
                      >
                        Giới hạn tổng số lượt dùng
                      </Label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <Checkbox
                          checked={isMaxUsesUnlimited}
                          onChange={(e) => {
                            setIsMaxUsesUnlimited(e.target.checked);
                            if (e.target.checked) setMaxUses(undefined);
                          }}
                        />
                        <span>Không giới hạn</span>
                      </label>
                    </div>

                    {!isMaxUsesUnlimited ? (
                      <Input
                        id="max-uses"
                        type="number"
                        min={1}
                        value={maxUses || ""}
                        onChange={(e) =>
                          setMaxUses(parseInt(e.target.value) || undefined)
                        }
                        className="bg-background text-xs h-9 font-medium"
                        placeholder="VD: 500"
                      />
                    ) : (
                      <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                        Không giới hạn tổng số lượt khách hàng redeem mã.
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Mã voucher sẽ tự động hết hạn khi chạm mốc này.
                    </p>
                  </div>

                  {/* Max uses per customer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="max-per-cust"
                        className="text-xs font-medium text-foreground"
                      >
                        Giới hạn lượt dùng / khách hàng
                      </Label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <Checkbox
                          checked={isMaxUsesPerCustomerUnlimited}
                          onChange={(e) => {
                            setIsMaxUsesPerCustomerUnlimited(e.target.checked);
                            if (e.target.checked)
                              setMaxUsesPerCustomer(undefined);
                          }}
                        />
                        <span>Không giới hạn</span>
                      </label>
                    </div>

                    {!isMaxUsesPerCustomerUnlimited ? (
                      <Input
                        id="max-per-cust"
                        type="number"
                        min={1}
                        value={maxUsesPerCustomer || ""}
                        onChange={(e) =>
                          setMaxUsesPerCustomer(
                            parseInt(e.target.value) || undefined,
                          )
                        }
                        className="bg-background text-xs h-9 font-medium"
                        placeholder="VD: 1"
                      />
                    ) : (
                      <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                        Mỗi tài khoản khách có thể sử dụng nhiều lần.
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Kiểm soát theo User ID của khách hàng khi đăng nhập đặt
                      hàng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Realtime Summary Sidebar (25-30%) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
          <PromotionSummarySidebar
            kind={kind}
            name={name}
            code={code}
            discountType={discountType}
            discountValue={discountValue}
            maxDiscountValue={
              !isMaxDiscountUnlimited ? maxDiscountValue : undefined
            }
            minOrderAmount={!isMinOrderUnlimited ? minOrderAmount : undefined}
            startsAt={startsAt}
            endsAt={!isEndsAtUnlimited ? endsAt : undefined}
            budgetLimit={!isBudgetUnlimited ? budgetLimit : undefined}
            maxUses={!isMaxUsesUnlimited ? maxUses : undefined}
            maxUsesPerCustomer={
              !isMaxUsesPerCustomerUnlimited ? maxUsesPerCustomer : undefined
            }
            groups={groups}
            active={active}
            isLoading={isLoading}
            isEditMode={isEditMode}
            onSubmit={() => buildPayloadAndSubmit()}
            onSaveDraft={
              !isEditMode ? () => buildPayloadAndSubmit(false) : undefined
            }
          />
        </div>
      </div>

    </div>
  );
}
