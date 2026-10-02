"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Campaign,
  CreateCampaignDto,
  UpdateCampaignDto,
} from "@/types/campaign";
import { useCreateCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Calendar,
  DollarSign,
  Megaphone,
  ArrowLeft,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface CampaignFormProps {
  initialData?: Campaign;
  isEdit?: boolean;
}

export function CampaignForm({
  initialData,
  isEdit = false,
}: CampaignFormProps) {
  const router = useRouter();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Vui lòng nhập tên chiến dịch";
    }
    if (!startsAt) {
      errs.startsAt = "Vui lòng chọn thời gian bắt đầu";
    }
    if (endsAt && startsAt && new Date(endsAt) <= new Date(startsAt)) {
      errs.endsAt = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }
    if (budgetLimit !== undefined && budgetLimit < 0) {
      errs.budgetLimit = "Ngân sách không được là số âm";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit && initialData) {
        const payload: UpdateCampaignDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          budgetLimit: budgetLimit !== undefined ? budgetLimit : undefined,
        };
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });
        toast.success("Cập nhật chiến dịch thành công");
        router.push(`/admin/campaigns/${initialData.id}`);
      } else {
        const payload: CreateCampaignDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          budgetLimit: budgetLimit !== undefined ? budgetLimit : undefined,
        };
        const created = await createMutation.mutateAsync(payload);
        toast.success("Tạo chiến dịch thành công");
        router.push(`/admin/campaigns/${created.id}`);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Có lỗi xảy ra trong quá trình lưu chiến dịch";
      toast.error(typeof msg === "string" ? msg : msg[0] || "Lỗi thao tác");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {isEdit
                  ? "Chỉnh sửa chiến dịch"
                  : "Thông tin cơ bản chiến dịch"}
              </CardTitle>
              <CardDescription>
                Chiến dịch đóng vai trò nhóm gom và theo dõi ngân sách cho các
                đợt giảm giá và voucher.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Tên chiến dịch */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name" className="text-sm font-medium">
              Tên chiến dịch <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign-name"
              placeholder="Ví dụ: Chiến dịch Hè Rực Rỡ 2026, Siêu Sale 10.10..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={
                errors.name
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="campaign-desc" className="text-sm font-medium">
              Mô tả chiến dịch
            </Label>
            <Textarea
              id="campaign-desc"
              rows={3}
              placeholder="Mô tả mục tiêu chiến dịch, đối tượng khách hàng hoặc ghi chú nội bộ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Thời gian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="campaign-startsAt"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Thời gian bắt đầu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaign-startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  if (errors.startsAt)
                    setErrors((prev) => ({ ...prev, startsAt: "" }));
                }}
                className={errors.startsAt ? "border-destructive" : ""}
              />
              {errors.startsAt && (
                <p className="text-xs text-destructive">{errors.startsAt}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="campaign-endsAt"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Thời gian kết thúc
              </Label>
              <Input
                id="campaign-endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  if (errors.endsAt)
                    setErrors((prev) => ({ ...prev, endsAt: "" }));
                }}
                className={errors.endsAt ? "border-destructive" : ""}
              />
              {errors.endsAt ? (
                <p className="text-xs text-destructive">{errors.endsAt}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Để trống nếu chiến dịch không có hạn kết thúc cố định.
                </p>
              )}
            </div>
          </div>

          {/* Ngân sách */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label
              htmlFor="campaign-budget"
              className="text-sm font-medium flex items-center gap-1.5"
            >
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              Ngân sách tối đa (VND)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="campaign-budget"
                type="number"
                min={0}
                step={50000}
                placeholder="Ví dụ: 50000000 (để trống nếu không giới hạn)"
                value={budgetLimit ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setBudgetLimit(val === "" ? undefined : Number(val));
                  if (errors.budgetLimit)
                    setErrors((prev) => ({ ...prev, budgetLimit: "" }));
                }}
                className={`max-w-md ${errors.budgetLimit ? "border-destructive" : ""}`}
              />
              {budgetLimit !== undefined && budgetLimit > 0 && (
                <span className="text-sm font-semibold text-primary px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                  {formatCurrency(budgetLimit)}
                </span>
              )}
            </div>
            {errors.budgetLimit ? (
              <p className="text-xs text-destructive">{errors.budgetLimit}</p>
            ) : (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Nếu đặt giới hạn, khi tổng chi phí khuyến mãi (giảm giá sản
                  phẩm + voucher) đạt mức này, hệ thống sẽ tạm dừng cấp ưu đãi
                  thuộc chiến dịch.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            isEdit && initialData
              ? router.push(`/admin/campaigns/${initialData.id}`)
              : router.push("/admin/campaigns")
          }
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Hủy & Quay lại
        </Button>

        <Button
          type="submit"
          disabled={isPending}
          className="gap-2 min-w-[140px]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Cập nhật chiến dịch" : "Tạo chiến dịch"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
