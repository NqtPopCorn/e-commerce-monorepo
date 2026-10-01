"use client";

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
import { InlineProductSelector } from "./InlineProductSelector";
import { DiscountGroupDto, DiscountType } from "@/types/discount";
import { Plus, Trash2, ArrowUp, ArrowDown, Tag, Layers } from "lucide-react";

interface DiscountGroupsEditorProps {
  groups: DiscountGroupDto[];
  onChange: (groups: DiscountGroupDto[]) => void;
  currentDiscountId?: number;
}

export function DiscountGroupsEditor({
  groups,
  onChange,
}: DiscountGroupsEditorProps) {
  const handleAddGroup = () => {
    const newGroupIndex = groups.length;
    const newGroup: DiscountGroupDto = {
      name: `Nhóm sản phẩm ${newGroupIndex + 1}`,
      sortOrder: newGroupIndex + 1,
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
    field: keyof DiscountGroupDto,
    value: unknown,
  ) => {
    const nextGroups = [...groups];
    nextGroups[index] = { ...nextGroups[index], [field]: value };
    onChange(nextGroups);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-primary" />
            Nhóm chiết khấu & Sản phẩm áp dụng
          </h3>
          <p className="text-xs text-muted-foreground">
            Cấu hình mức giảm và chọn trực tiếp các biến thể sản phẩm áp dụng.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAddGroup}
          className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm nhóm</span>
        </Button>
      </div>

      {/* Empty State */}
      {groups.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/10 space-y-2">
          <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">
            Chưa có nhóm chiết khấu nào
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Một chương trình cần ít nhất 1 nhóm giảm giá và các sản phẩm áp
            dụng.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddGroup}
            className="h-8 text-xs font-semibold mt-1"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tạo nhóm đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => {
            const otherGroupVariantIds = groups
              .filter((_, i) => i !== index)
              .flatMap((g) => g.variantIds);

            return (
              <div
                key={index}
                className="border border-border rounded-xl p-3.5 bg-card space-y-3 shadow-xs transition-colors hover:border-primary/30"
              >
                {/* Header row: Group Title + Sort Buttons + Remove */}
                <div className="flex items-center justify-between gap-2.5 border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <Input
                      value={group.name}
                      onChange={(e) =>
                        handleGroupChange(index, "name", e.target.value)
                      }
                      placeholder="Tên nhóm chiết khấu..."
                      className="h-7 text-xs font-semibold max-w-xs bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => handleMoveGroup(index, "UP")}
                      aria-label="Di chuyển nhóm lên"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === groups.length - 1}
                      onClick={() => handleMoveGroup(index, "DOWN")}
                      aria-label="Di chuyển nhóm xuống"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    {groups.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGroup(index)}
                        aria-label="Xóa nhóm chiết khấu"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Controls Grid: Type, Value, Max Value */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Hình thức giảm
                    </Label>
                    <Select
                      value={group.discountType}
                      onValueChange={(val: DiscountType) =>
                        handleGroupChange(index, "discountType", val)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                        <SelectItem value="FIXED">
                          Số tiền cố định (đ)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {group.discountType === "PERCENT"
                        ? "Mức giảm (%) *"
                        : "Số tiền giảm (đ) *"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={group.discountType === "PERCENT" ? 100 : undefined}
                      value={group.discountValue}
                      onChange={(e) =>
                        handleGroupChange(
                          index,
                          "discountValue",
                          Number(e.target.value) || 0,
                        )
                      }
                      className="h-8 text-xs tabular-nums bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {group.discountType === "PERCENT"
                        ? "Giảm tối đa (đ - tùy chọn)"
                        : "Không áp dụng"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={group.discountType === "FIXED"}
                      value={group.maxDiscountValue || ""}
                      onChange={(e) =>
                        handleGroupChange(
                          index,
                          "maxDiscountValue",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder={
                        group.discountType === "PERCENT"
                          ? "Không giới hạn"
                          : "N/A"
                      }
                      className="h-8 text-xs tabular-nums bg-background"
                    />
                  </div>
                </div>

                {/* Embedded Inline Product Selector */}
                <div className="pt-2 border-t border-border/50">
                  <InlineProductSelector
                    selectedVariantIds={group.variantIds}
                    excludedVariantIds={otherGroupVariantIds}
                    onChange={(newVariantIds) =>
                      handleGroupChange(index, "variantIds", newVariantIds)
                    }
                    discountType={group.discountType}
                    discountValue={group.discountValue}
                    maxDiscountValue={group.maxDiscountValue}
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
