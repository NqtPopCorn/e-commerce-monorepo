"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateVoucherDto, UpdateVoucherDto, Voucher } from "@/types/voucher";
import { DiscountType } from "@/types/discount";
import { useCreateVoucher, useUpdateVoucher } from "@/hooks/useVouchers";
import { useGetCampaigns } from "@/hooks/useCampaigns";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Ticket,
  Calendar,
  Sparkles,
  Percent,
  Coins,
  Shuffle,
  Sliders,
  Megaphone,
} from "lucide-react";

interface VoucherFormProps {
  initialData?: Voucher;
  isEdit?: boolean;
}

export function VoucherForm({ initialData, isEdit = false }: VoucherFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCampaignId = searchParams.get("campaignId");
  const createMutation = useCreateVoucher();
  const updateMutation = useUpdateVoucher();
  const { data: campaignsData } = useGetCampaigns({ limit: 100 });
  const campaignsList = campaignsData?.data || [];

  const [campaignId, setCampaignId] = useState<number | undefined>(
    initialData?.campaignId ||
      (queryCampaignId ? Number(queryCampaignId) : undefined),
  );
  const [code, setCode] = useState(initialData?.code || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialData?.discountType || "PERCENT",
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.discountValue ? Number(initialData.discountValue) : 10,
  );
  const [maxDiscountValue, setMaxDiscountValue] = useState<number | undefined>(
    initialData?.maxDiscountValue
      ? Number(initialData.maxDiscountValue)
      : undefined,
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number | undefined>(
    initialData?.minOrderAmount
      ? Number(initialData.minOrderAmount)
      : undefined,
  );
  const [maxUses, setMaxUses] = useState<number | undefined>(
    initialData?.maxUses ? Number(initialData.maxUses) : undefined,
  );
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState<
    number | undefined
  >(
    initialData?.maxUsesPerCustomer
      ? Number(initialData.maxUsesPerCustomer)
      : undefined,
  );
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(
    initialData?.budgetLimit ? Number(initialData.budgetLimit) : undefined,
  );
  const [startsAt, setStartsAt] = useState<string>(
    initialData?.startsAt
      ? new Date(initialData.startsAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [endsAt, setEndsAt] = useState<string>(
    initialData?.endsAt
      ? new Date(initialData.endsAt).toISOString().slice(0, 16)
      : "",
  );
  const [active, setActive] = useState<boolean>(initialData?.active ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Quick Random Code Generator
  const generateRandomCode = () => {
    const prefixes = ["SALE", "VIP", "FASHION", "DISC", "HOT"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCode(`${prefix}${randomNum}`);
    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      errs.code = "Vui lòng nhập mã voucher";
    } else if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      errs.code = "Mã chỉ gồm chữ in hoa, số, dấu _ hoặc -";
    }

    if (!name.trim()) {
      errs.name = "Vui lòng nhập tên hiển thị voucher";
    }

    if (discountValue <= 0) {
      errs.discountValue = "Mức giảm phải lớn hơn 0";
    } else if (discountType === "PERCENT" && discountValue > 100) {
      errs.discountValue = "Giảm tối đa 100%";
    }

    if (!startsAt) {
      errs.startsAt = "Vui lòng chọn thời gian bắt đầu";
    }

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      errs.endsAt = "Thời gian kết thúc phải sau bắt đầu";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin bị lỗi");
      return;
    }

    const payload: CreateVoucherDto = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      campaignId: campaignId ? Number(campaignId) : undefined,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountValue:
        discountType === "PERCENT" && maxDiscountValue
          ? Number(maxDiscountValue)
          : undefined,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      maxUsesPerCustomer: maxUsesPerCustomer
        ? Number(maxUsesPerCustomer)
        : undefined,
      budgetLimit: budgetLimit ? Number(budgetLimit) : undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      active,
    };

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: payload as UpdateVoucherDto,
        });
        toast.success("Đã cập nhật mã voucher");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo mã voucher mới");
      }
      router.push("/admin/vouchers");
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      toast.error(errorMsg || "Không thể lưu voucher. Vui lòng thử lại.");
    }
  };

  // Preview badge text
  const previewRuleText =
    discountType === "PERCENT"
      ? `Giảm ${discountValue}%${
          maxDiscountValue
            ? ` (Tối đa ${formatCurrency(Number(maxDiscountValue))})`
            : ""
        }`
      : `Giảm ${formatCurrency(Number(discountValue))}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      {/* Main 2-Column Balanced Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Voucher Code, Name & Discount Rule */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                Mã voucher & Luật giảm giá
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              {/* Code + Generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="voucher-code"
                    className="text-xs font-semibold text-foreground"
                  >
                    Mã Voucher (Code){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateRandomCode}
                    className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1"
                  >
                    <Shuffle className="w-3 h-3" /> Tạo mã ngẫu nhiên
                  </Button>
                </div>
                <Input
                  id="voucher-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errors.code)
                      setErrors((prev) => ({ ...prev, code: "" }));
                  }}
                  placeholder="Ví dụ: SUMMER2026..."
                  className={`h-8 text-xs font-mono font-bold uppercase tracking-wider ${
                    errors.code
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {errors.code && (
                  <p className="text-[11px] text-destructive">{errors.code}</p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <Label
                  htmlFor="voucher-name"
                  className="text-xs font-semibold text-foreground"
                >
                  Tên hiển thị <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="voucher-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Ví dụ: Giảm 10% cho đơn hàng từ 300k..."
                  className={`h-8 text-xs ${
                    errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Campaign Selector */}
              <div className="space-y-1">
                <Label
                  htmlFor="voucher-campaign"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5 text-primary" />
                  Chiến dịch trực thuộc (tùy chọn)
                </Label>
                <select
                  id="voucher-campaign"
                  value={campaignId ?? ""}
                  onChange={(e) =>
                    setCampaignId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="h-8 text-xs w-full rounded-md border border-input bg-card px-2.5 py-1 text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">-- Không liên kết chiến dịch --</option>
                  {campaignsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (
                      {c.status === "ACTIVE"
                        ? "Đang chạy"
                        : c.status === "SCHEDULED"
                          ? "Sắp chạy"
                          : "Đã xong"}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Type Selector (Segmented buttons) */}
              <div className="space-y-1 pt-1 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground">
                  Hình thức giảm giá
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENT")}
                    className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      discountType === "PERCENT"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/60 border-border"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Phần trăm (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("FIXED")}
                    className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      discountType === "FIXED"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/60 border-border"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Số tiền cố định (đ)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value + Max Discount Value */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="discountValue"
                    className="text-xs font-medium text-foreground"
                  >
                    {discountType === "PERCENT"
                      ? "Mức giảm (%) *"
                      : "Số tiền giảm (đ) *"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min={0}
                    max={discountType === "PERCENT" ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(Number(e.target.value) || 0);
                      if (errors.discountValue)
                        setErrors((prev) => ({ ...prev, discountValue: "" }));
                    }}
                    className={`h-8 text-xs tabular-nums ${
                      errors.discountValue ? "border-destructive" : ""
                    }`}
                  />
                  {errors.discountValue && (
                    <p className="text-[11px] text-destructive">
                      {errors.discountValue}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="maxDiscountValue"
                    className="text-xs font-medium text-foreground"
                  >
                    {discountType === "PERCENT"
                      ? "Giảm tối đa (đ)"
                      : "Không áp dụng"}
                  </Label>
                  <Input
                    id="maxDiscountValue"
                    type="number"
                    min={0}
                    disabled={discountType === "FIXED"}
                    value={maxDiscountValue || ""}
                    onChange={(e) =>
                      setMaxDiscountValue(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder={
                      discountType === "PERCENT" ? "Không giới hạn" : "N/A"
                    }
                    className="h-8 text-xs tabular-nums"
                  />
                </div>
              </div>

              {/* Min Order Amount */}
              <div className="space-y-1">
                <Label
                  htmlFor="minOrderAmount"
                  className="text-xs font-medium text-foreground"
                >
                  Đơn hàng tối thiểu (đ)
                </Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min={0}
                  value={minOrderAmount || ""}
                  onChange={(e) =>
                    setMinOrderAmount(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="0 đ (Áp dụng mọi đơn)"
                  className="h-8 text-xs tabular-nums"
                />
              </div>

              {/* Description */}
              <div className="space-y-1 pt-1 border-t border-border/50">
                <Label
                  htmlFor="voucher-desc"
                  className="text-xs font-medium text-foreground"
                >
                  Ghi chú điều kiện (tùy chọn)
                </Label>
                <Textarea
                  id="voucher-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Điều kiện áp dụng voucher..."
                  className="text-xs min-h-[50px] resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline, Status & Limits */}
        <div className="space-y-4">
          {/* Card: Thời gian & Trạng thái */}
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Thời gian & Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/20">
                <div>
                  <Label
                    htmlFor="voucher-active"
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Kích hoạt voucher
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Cho phép khách hàng nhập mã này khi thanh toán
                  </p>
                </div>
                <input
                  id="voucher-active"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="startsAt"
                    className="text-xs font-medium text-foreground"
                  >
                    Bắt đầu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => {
                      setStartsAt(e.target.value);
                      if (errors.startsAt)
                        setErrors((prev) => ({ ...prev, startsAt: "" }));
                    }}
                    className={`h-8 text-xs ${errors.startsAt ? "border-destructive" : ""}`}
                  />
                  {errors.startsAt && (
                    <p className="text-[10px] text-destructive">
                      {errors.startsAt}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="endsAt"
                    className="text-xs font-medium text-foreground"
                  >
                    Kết thúc (tùy chọn)
                  </Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => {
                      setEndsAt(e.target.value);
                      if (errors.endsAt)
                        setErrors((prev) => ({ ...prev, endsAt: "" }));
                    }}
                    className={`h-8 text-xs ${errors.endsAt ? "border-destructive" : ""}`}
                  />
                  {errors.endsAt && (
                    <p className="text-[10px] text-destructive">
                      {errors.endsAt}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Giới hạn & Ngân sách */}
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Giới hạn sử dụng & Ngân sách
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="maxUses"
                    className="text-xs font-medium text-foreground"
                  >
                    Tổng lượt dùng
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min={0}
                    value={maxUses || ""}
                    onChange={(e) =>
                      setMaxUses(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="Không giới hạn"
                    className="h-8 text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="maxUsesPerCustomer"
                    className="text-xs font-medium text-foreground"
                  >
                    Lượt / mỗi khách
                  </Label>
                  <Input
                    id="maxUsesPerCustomer"
                    type="number"
                    min={0}
                    value={maxUsesPerCustomer || ""}
                    onChange={(e) =>
                      setMaxUsesPerCustomer(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="Không giới hạn"
                    className="h-8 text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="budgetLimit"
                  className="text-xs font-medium text-foreground"
                >
                  Ngân sách tối đa của voucher (đ)
                </Label>
                <Input
                  id="budgetLimit"
                  type="number"
                  min={0}
                  value={budgetLimit || ""}
                  onChange={(e) =>
                    setBudgetLimit(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="Không giới hạn ngân sách"
                  className="h-8 text-xs tabular-nums"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-card/95 backdrop-blur-md border-t border-border px-6 py-2.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono font-bold text-foreground">
              {code || "MÃ VOUCHER"}
            </span>
          </div>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {previewRuleText}
          </span>
          {minOrderAmount && minOrderAmount > 0 ? (
            <>
              <span className="text-muted-foreground text-xs hidden sm:inline">
                •
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Đơn từ {formatCurrency(Number(minOrderAmount))}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                isEdit && initialData?.id
                  ? `/admin/vouchers/${initialData.id}`
                  : "/admin/vouchers",
              )
            }
            className="h-8 px-4 text-xs font-semibold rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-8 px-5 text-xs font-semibold gap-2 rounded-lg shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEdit ? "Cập nhật voucher" : "Tạo voucher"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
