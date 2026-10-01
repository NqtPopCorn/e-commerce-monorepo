"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscountGroupsEditor } from "./DiscountGroupsEditor";
import {
  CreateDiscountDto,
  Discount,
  DiscountGroupDto,
  UpdateDiscountDto,
} from "@/types/discount";
import { useCreateDiscount, useUpdateDiscount } from "@/hooks/useDiscounts";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
} from "lucide-react";

interface DiscountFormProps {
  initialData?: Discount;
  isEdit?: boolean;
}

export function DiscountForm({
  initialData,
  isEdit = false,
}: DiscountFormProps) {
  const router = useRouter();
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [priority, setPriority] = useState<number>(initialData?.priority ?? 0);
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(
    initialData?.budgetLimit ? Number(initialData.budgetLimit) : undefined,
  );
  const [maxUses, setMaxUses] = useState<number | undefined>(
    initialData?.maxUses ? Number(initialData.maxUses) : undefined,
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

  // Groups
  const initialGroups: DiscountGroupDto[] = initialData?.groups
    ? initialData.groups.map((g, idx) => ({
        name: g.name,
        sortOrder: g.sortOrder ?? idx + 1,
        discountType: g.discountType,
        discountValue: Number(g.discountValue),
        maxDiscountValue: g.maxDiscountValue
          ? Number(g.maxDiscountValue)
          : undefined,
        variantIds:
          g.variantIds ||
          (g.variants ? g.variants.map((v) => v.variantId) : []),
      }))
    : [
        {
          name: "Nhóm sản phẩm 1",
          sortOrder: 1,
          discountType: "PERCENT",
          discountValue: 10,
          variantIds: [],
        },
      ];

  const [groups, setGroups] = useState<DiscountGroupDto[]>(initialGroups);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Vui lòng nhập tên chương trình giảm giá";
    }
    if (!startsAt) {
      errs.startsAt = "Vui lòng chọn thời gian bắt đầu";
    }
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      errs.endsAt = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }
    if (groups.length === 0) {
      errs.groups = "Chương trình cần có ít nhất một nhóm chiết khấu sản phẩm";
    } else {
      const emptyGroup = groups.find((g) => g.variantIds.length === 0);
      if (emptyGroup) {
        errs.groups = `Nhóm "${emptyGroup.name}" chưa chọn sản phẩm nào`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const totalSelectedVariants = groups.reduce(
    (sum, g) => sum + g.variantIds.length,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin bị lỗi");
      return;
    }

    const payload: CreateDiscountDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      priority: Number(priority) || 0,
      budgetLimit: budgetLimit ? Number(budgetLimit) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      active,
      groups: groups.map((g, idx) => ({
        name: g.name.trim(),
        sortOrder: idx + 1,
        discountType: g.discountType,
        discountValue: Number(g.discountValue),
        maxDiscountValue: g.maxDiscountValue
          ? Number(g.maxDiscountValue)
          : undefined,
        variantIds: g.variantIds,
      })),
    };

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: payload as UpdateDiscountDto,
        });
        toast.success("Đã cập nhật chương trình giảm giá");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo chương trình giảm giá mới");
      }
      router.push("/admin/discounts");
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      toast.error(
        errorMsg || "Không thể lưu chương trình giảm giá. Vui lòng thử lại.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      {/* Main 2-Column Balanced Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5/12): Campaign Details & Conditions */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Thông tin chương trình
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor="discount-name"
                  className="text-xs font-semibold text-foreground"
                >
                  Tên chương trình giảm giá{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discount-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Ví dụ: Flash Sale 20% BST Áo Hè..."
                  className={`h-8 text-xs ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="discount-description"
                  className="text-xs font-medium text-foreground"
                >
                  Mô tả tóm tắt (tùy chọn)
                </Label>
                <Textarea
                  id="discount-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục đích hoặc điều kiện áp dụng..."
                  className="text-xs min-h-[64px] resize-y"
                />
              </div>

              {/* Status & Priority Row */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-border/50">
                <div className="space-y-1">
                  <Label
                    htmlFor="discount-priority"
                    className="text-[11px] font-medium text-foreground"
                  >
                    Độ ưu tiên (Priority)
                  </Label>
                  <Input
                    id="discount-priority"
                    type="number"
                    min={0}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 0)}
                    className="h-8 text-xs tabular-nums"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Số lớn hơn ưu tiên trước
                  </p>
                </div>

                <div className="flex flex-col justify-center rounded-lg border border-border/70 p-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="discount-active"
                      className="text-xs font-semibold cursor-pointer"
                    >
                      Kích hoạt ngay
                    </Label>
                    <input
                      id="discount-active"
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {active ? "Đang bật" : "Tạm dừng"}
                  </span>
                </div>
              </div>

              {/* Start & End Dates Row */}
              <div className="space-y-2 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Thời gian hiệu lực</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="startsAt"
                      className="text-[11px] text-muted-foreground"
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

                  <div className="space-y-0.5">
                    <Label
                      htmlFor="endsAt"
                      className="text-[11px] text-muted-foreground"
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
              </div>

              {/* Limits Row */}
              <div className="space-y-2 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  <span>Hạn mức ngân sách & Lượt dùng</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="budgetLimit"
                      className="text-[11px] text-muted-foreground"
                    >
                      Ngân sách tối đa (đ)
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
                      placeholder="Không giới hạn"
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <Label
                      htmlFor="maxUses"
                      className="text-[11px] text-muted-foreground"
                    >
                      Lượt dùng tối đa
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7/12): Groups & Inline Product Selector */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <DiscountGroupsEditor
                groups={groups}
                onChange={(newGroups) => {
                  setGroups(newGroups);
                  if (errors.groups)
                    setErrors((prev) => ({ ...prev, groups: "" }));
                }}
                currentDiscountId={initialData?.id}
              />
              {errors.groups && (
                <p className="text-xs text-destructive mt-2">{errors.groups}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-card/95 backdrop-blur-md border-t border-border px-6 py-2.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-foreground">
              {name || "Chương trình mới"}
            </span>
          </div>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {totalSelectedVariants} SKU đã chọn
          </span>
          <span className="text-muted-foreground text-xs hidden sm:inline">
            •
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {groups.length} nhóm
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                isEdit && initialData?.id
                  ? `/admin/discounts/${initialData.id}`
                  : "/admin/discounts",
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
                <span>{isEdit ? "Cập nhật giảm giá" : "Tạo giảm giá"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
