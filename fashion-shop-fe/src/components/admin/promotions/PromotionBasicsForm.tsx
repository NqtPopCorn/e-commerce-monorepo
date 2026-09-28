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
import { PromotionKind } from "@/types/promotion";

interface PromotionBasicsFormProps {
  name: string;
  kind: PromotionKind;
  active: boolean;
  priority: number;
  startsAt: string;
  endsAt: string;
  onChange: (field: string, value: any) => void;
  isEditMode?: boolean;
}

export function PromotionBasicsForm({
  name,
  kind,
  active,
  priority,
  startsAt,
  endsAt,
  onChange,
  isEditMode = false,
}: PromotionBasicsFormProps) {
  return (
    <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
      <h3 className="font-semibold text-lg text-slate-800">Thông tin cơ bản</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kind">Loại chương trình *</Label>
          <Select
            disabled={isEditMode}
            value={kind}
            onValueChange={(val) => onChange("kind", val as PromotionKind)}
          >
            <SelectTrigger id="kind" className="bg-white">
              <SelectValue placeholder="Chọn loại khuyến mãi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VOUCHER">Voucher (Mã giảm giá)</SelectItem>
              <SelectItem value="ORDER_AUTO">
                Khuyến mãi hóa đơn tự động
              </SelectItem>
              <SelectItem value="CAMPAIGN">Campaign sản phẩm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Tên chương trình *</Label>
          <Input
            id="name"
            placeholder="Ví dụ: Giảm 20k đơn từ 200k, Campaign Hè rực rỡ..."
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            className="bg-white"
          />
        </div>

        {kind === "CAMPAIGN" && (
          <div className="space-y-2">
            <Label htmlFor="priority">Độ ưu tiên Campaign (Priority)</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              placeholder="0"
              value={priority}
              onChange={(e) =>
                onChange("priority", parseInt(e.target.value) || 0)
              }
              className="bg-white"
            />
            <div className="p-2.5 rounded-md bg-indigo-50/70 border border-indigo-200/60 text-[11px] text-indigo-900 leading-relaxed">
              <strong>💡 Quy tắc Rule Engine:</strong> Khi một SKU nằm trong
              nhiều Campaign cùng chạy, hệ thống sẽ ưu tiên áp dụng Campaign có{" "}
              <strong>Priority cao nhất</strong>. Nếu Priority bằng nhau,
              Campaign mang lại số tiền giảm lớn hơn sẽ được chọn.
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="active">Trạng thái kích hoạt</Label>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => onChange("active", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <Label
              htmlFor="active"
              className="cursor-pointer font-normal text-sm"
            >
              {active ? "Đang kích hoạt" : "Tạm dừng"}
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startsAt">Thời gian bắt đầu *</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => onChange("startsAt", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endsAt">Thời gian kết thúc (Tùy chọn)</Label>
          <Input
            id="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => onChange("endsAt", e.target.value)}
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
}
