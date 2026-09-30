import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CreatePromotionDto,
  DiscountType,
  Promotion,
  PromotionGroupDto,
  PromotionKind,
} from "@/types/promotion";
import { PromotionBasicsForm } from "./PromotionBasicsForm";
import { PromotionDiscountFields } from "./PromotionDiscountFields";
import { CampaignGroupsEditor } from "./CampaignGroupsEditor";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PromotionFormProps {
  initialData?: Promotion;
  onSubmit: (data: CreatePromotionDto) => void;
  isLoading?: boolean;
}

export function PromotionForm({
  initialData,
  onSubmit,
  isLoading = false,
}: PromotionFormProps) {
  const isEditMode = !!initialData;

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

  const [kind, setKind] = useState<PromotionKind>(initialKind);
  const [name, setName] = useState(initialData?.name || "");
  const [code, setCode] = useState(
    initialData?.vouchers?.[0]?.code || initialData?.code || "",
  );
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialData?.groups?.[0]?.discountType ||
      initialData?.discountType ||
      "FIXED",
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.groups?.[0]?.discountValue
      ? Number(initialData.groups[0].discountValue)
      : initialData?.discountValue
        ? Number(initialData.discountValue)
        : 0,
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number>(
    initialData?.minOrderAmount ? Number(initialData.minOrderAmount) : 0,
  );
  const [maxDiscountValue, setMaxDiscountValue] = useState<number | undefined>(
    initialData?.groups?.[0]?.maxDiscountValue
      ? Number(initialData.groups[0].maxDiscountValue)
      : initialData?.maxDiscountValue
        ? Number(initialData.maxDiscountValue)
        : undefined,
  );
  const [priority, setPriority] = useState<number>(initialData?.priority || 0);
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(
    initialData?.budgetLimit ? Number(initialData.budgetLimit) : undefined,
  );
  const [maxUses, setMaxUses] = useState<number | undefined>(
    initialData?.maxUses
      ? Number(initialData.maxUses)
      : initialData?.vouchers?.[0]?.maxUses
        ? Number(initialData.vouchers[0].maxUses)
        : undefined,
  );
  const [active, setActive] = useState<boolean>(
    initialData?.active !== undefined ? initialData.active : true,
  );

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
  const [endsAt, setEndsAt] = useState<string>(
    formatIsoForInput(initialData?.endsAt),
  );

  const [groups, setGroups] = useState<PromotionGroupDto[]>(() => {
    if (initialData?.groups && initialData.groups.length > 0) {
      return initialData.groups.map((g) => ({
        name: g.name,
        sortOrder: g.sortOrder,
        discountType: g.discountType,
        discountValue: Number(g.discountValue),
        variantIds: g.variants ? g.variants.map((v) => v.variantId) : [],
      }));
    }
    return [];
  });

  const handleBasicsChange = (field: string, value: any) => {
    if (field === "kind") setKind(value as PromotionKind);
    if (field === "name") setName(value);
    if (field === "active") setActive(value);
    if (field === "priority") setPriority(value);
    if (field === "budgetLimit") setBudgetLimit(value);
    if (field === "startsAt") setStartsAt(value);
    if (field === "endsAt") setEndsAt(value);
  };

  const handleDiscountChange = (field: string, value: any) => {
    if (field === "code") setCode(value);
    if (field === "discountType") setDiscountType(value);
    if (field === "discountValue") setDiscountValue(value);
    if (field === "maxDiscountValue") setMaxDiscountValue(value);
    if (field === "minOrderAmount") setMinOrderAmount(value);
    if (field === "maxUses") setMaxUses(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên chương trình");
      return;
    }
    if (!startsAt) {
      toast.error("Vui lòng chọn thời gian bắt đầu");
      return;
    }
    if (endsAt && new Date(startsAt) >= new Date(endsAt)) {
      toast.error("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
      return;
    }

    if (kind === "VOUCHER") {
      if (!code.trim()) {
        toast.error("Voucher bắt buộc phải có mã code");
        return;
      }
      if (!discountValue || discountValue <= 0) {
        toast.error("Vui lòng nhập mức giảm giá lớn hơn 0");
        return;
      }
      if (
        discountType === "PERCENT" &&
        (discountValue < 1 || discountValue > 100)
      ) {
        toast.error("Phần trăm giảm giá phải từ 1 đến 100");
        return;
      }
    } else if (kind === "ORDER_AUTO") {
      if (!discountValue || discountValue <= 0) {
        toast.error("Vui lòng nhập mức giảm giá lớn hơn 0");
        return;
      }
      if (
        discountType === "PERCENT" &&
        (discountValue < 1 || discountValue > 100)
      ) {
        toast.error("Phần trăm giảm giá phải từ 1 đến 100");
        return;
      }
    } else if (kind === "CAMPAIGN") {
      if (!groups || groups.length === 0) {
        toast.error("Campaign phải chứa ít nhất 1 nhóm sản phẩm");
        return;
      }
      for (const g of groups) {
        if (!g.variantIds || g.variantIds.length === 0) {
          toast.error(`Nhóm "${g.name}" chưa được chọn sản phẩm nào`);
          return;
        }
      }
    }

    let finalGroups: PromotionGroupDto[] = [];
    if (kind === "CAMPAIGN") {
      finalGroups = groups;
    } else if (kind === "ORDER_AUTO") {
      finalGroups = [
        {
          name: "Chiết khấu hóa đơn",
          sortOrder: 1,
          discountType,
          discountValue,
          maxDiscountValue:
            discountType === "PERCENT" ? maxDiscountValue : undefined,
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
            discountType === "PERCENT" ? maxDiscountValue : undefined,
          variantIds: [],
        },
      ];
    }

    const payload: CreatePromotionDto = {
      name,
      applicationType: kind === "VOUCHER" ? "VOUCHER" : "AUTO",
      kind,
      active,
      priority: kind === "CAMPAIGN" ? priority : 0,
      budgetLimit,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      code: kind === "VOUCHER" ? code.trim().toUpperCase() : undefined,
      minOrderAmount: kind !== "CAMPAIGN" ? minOrderAmount : undefined,
      maxUses: kind === "VOUCHER" ? maxUses : undefined,
      groups: finalGroups,
      vouchers:
        kind === "VOUCHER"
          ? [
              {
                code: code.trim().toUpperCase(),
                maxUses,
                active: true,
              },
            ]
          : undefined,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <PromotionBasicsForm
        name={name}
        kind={kind}
        active={active}
        priority={priority}
        budgetLimit={budgetLimit}
        startsAt={startsAt}
        endsAt={endsAt}
        onChange={handleBasicsChange}
        isEditMode={isEditMode}
      />

      <PromotionDiscountFields
        kind={kind}
        code={code}
        discountType={discountType}
        discountValue={discountValue}
        maxDiscountValue={maxDiscountValue}
        minOrderAmount={minOrderAmount}
        maxUses={maxUses}
        onChange={handleDiscountChange}
      />

      {kind === "CAMPAIGN" && (
        <CampaignGroupsEditor
          groups={groups}
          onChange={setGroups}
          currentPromotionId={initialData?.id}
        />
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? "Lưu thay đổi" : "Tạo chương trình"}
        </Button>
      </div>
    </form>
  );
}
