import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountType, PromotionKind } from "@/types/promotion";

interface PromotionDiscountFieldsProps {
  kind: PromotionKind;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxUses?: number;
  onChange: (field: string, value: any) => void;
}

export function PromotionDiscountFields({
  kind,
  code = "",
  discountType = "FIXED",
  discountValue = 0,
  minOrderAmount = 0,
  maxUses = 0,
  onChange,
}: PromotionDiscountFieldsProps) {
  if (kind === "CAMPAIGN") return null;

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
      <h3 className="font-semibold text-lg text-slate-800">
        {kind === "VOUCHER" ? "Cấu hình Voucher" : "Cấu hình Mức giảm giá hóa đơn"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kind === "VOUCHER" && (
          <div className="space-y-2">
            <Label htmlFor="code">Mã voucher (Voucher code) *</Label>
            <Input
              id="code"
              placeholder="VD: MAGIAM50K, WELCOME20"
              value={code}
              onChange={(e) => onChange("code", e.target.value.toUpperCase())}
              className="bg-white font-mono uppercase"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="discountType">Hình thức giảm giá *</Label>
          <Select
            value={discountType}
            onValueChange={(val) => onChange("discountType", val as DiscountType)}
          >
            <SelectTrigger id="discountType" className="bg-white">
              <SelectValue placeholder="Chọn hình thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Theo phần trăm (%)</SelectItem>
              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountValue">
            {discountType === "PERCENT" ? "Phần trăm giảm (%) *" : "Số tiền giảm (VND) *"}
          </Label>
          <Input
            id="discountValue"
            type="number"
            min={1}
            max={discountType === "PERCENT" ? 100 : undefined}
            placeholder={discountType === "PERCENT" ? "15" : "50000"}
            value={discountValue || ""}
            onChange={(e) =>
              onChange("discountValue", parseFloat(e.target.value) || 0)
            }
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minOrderAmount">Giá trị đơn hàng tối thiểu (VND)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            min={0}
            placeholder="0"
            value={minOrderAmount || ""}
            onChange={(e) =>
              onChange("minOrderAmount", parseFloat(e.target.value) || 0)
            }
            className="bg-white"
          />
        </div>

        {kind === "VOUCHER" && (
          <div className="space-y-2">
            <Label htmlFor="maxUses">Giới hạn số lần sử dụng tổng cộng</Label>
            <Input
              id="maxUses"
              type="number"
              min={1}
              placeholder="Để trống nếu không giới hạn"
              value={maxUses || ""}
              onChange={(e) =>
                onChange("maxUses", parseInt(e.target.value) || undefined)
              }
              className="bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
