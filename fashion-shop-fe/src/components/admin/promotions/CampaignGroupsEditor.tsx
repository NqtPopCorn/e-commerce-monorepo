import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSelectionTable } from "./ProductSelectionTable";
import { DiscountType, PromotionGroupDto } from "@/types/promotion";
import { Plus, Trash2, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";

interface CampaignGroupsEditorProps {
  groups: PromotionGroupDto[];
  onChange: (groups: PromotionGroupDto[]) => void;
}

export function CampaignGroupsEditor({
  groups,
  onChange,
}: CampaignGroupsEditorProps) {
  const handleAddGroup = () => {
    const newGroup: PromotionGroupDto = {
      name: `Nhóm sản phẩm ${groups.length + 1}`,
      sortOrder: groups.length + 1,
      discountType: "PERCENT",
      discountValue: 10,
      variantIds: [],
    };
    onChange([...groups, newGroup]);
  };

  const handleRemoveGroup = (index: number) => {
    const nextGroups = groups
      .filter((_, i) => i !== index)
      .map((g, i) => ({ ...g, sortOrder: i + 1 }));
    onChange(nextGroups);
  };

  const handleMoveGroup = (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;

    const nextGroups = [...groups];
    const temp = nextGroups[index];
    nextGroups[index] = nextGroups[targetIndex];
    nextGroups[targetIndex] = temp;

    const reordered = nextGroups.map((g, i) => ({ ...g, sortOrder: i + 1 }));
    onChange(reordered);
  };

  const handleGroupChange = (
    index: number,
    field: keyof PromotionGroupDto,
    value: any,
  ) => {
    const nextGroups = [...groups];
    nextGroups[index] = { ...nextGroups[index], [field]: value };
    onChange(nextGroups);
  };

  return (
    <div className="space-y-6 border p-4 rounded-lg bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-slate-800">
            Nhóm sản phẩm Campaign ({groups.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Mỗi nhóm sản phẩm có mức giảm giá riêng và danh sách SKU áp dụng riêng.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddGroup}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm nhóm sản phẩm
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed rounded-lg text-amber-600 bg-amber-50/50">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <p className="font-medium text-sm">
            Campaign phải có ít nhất 1 nhóm sản phẩm. Hãy bấm nút "Thêm nhóm sản phẩm" để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, index) => {
            const otherVariantIds = groups
              .filter((_, i) => i !== index)
              .flatMap((g) => g.variantIds || []);

            return (
              <div
                key={index}
                className="border bg-white rounded-lg p-4 space-y-4 shadow-sm relative"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <Input
                      value={group.name}
                      onChange={(e) =>
                        handleGroupChange(index, "name", e.target.value)
                      }
                      placeholder="Tên nhóm sản phẩm"
                      className="font-medium max-w-xs text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => handleMoveGroup(index, "UP")}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === groups.length - 1}
                      onClick={() => handleMoveGroup(index, "DOWN")}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveGroup(index)}
                      className="ml-2 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa nhóm
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Hình thức giảm giá nhóm</Label>
                    <Select
                      value={group.discountType}
                      onValueChange={(val) =>
                        handleGroupChange(index, "discountType", val as DiscountType)
                      }
                    >
                      <SelectTrigger className="bg-white text-sm">
                        <SelectValue placeholder="Chọn hình thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Theo phần trăm (%)</SelectItem>
                        <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">
                      {group.discountType === "PERCENT"
                        ? "Phần trăm giảm (%)"
                        : "Số tiền giảm (VND)"}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={group.discountType === "PERCENT" ? 100 : undefined}
                      value={group.discountValue || ""}
                      onChange={(e) =>
                        handleGroupChange(
                          index,
                          "discountValue",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700">
                      Danh sách SKU thuộc nhóm
                    </Label>
                    {group.variantIds.length === 0 ? (
                      <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Chưa chọn sản phẩm nào cho nhóm này
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold">
                        ✔ Đã chọn {group.variantIds.length} sản phẩm
                      </span>
                    )}
                  </div>

                  <ProductSelectionTable
                    selectedVariantIds={group.variantIds}
                    excludedVariantIds={otherVariantIds}
                    onChange={(ids) =>
                      handleGroupChange(index, "variantIds", ids)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
