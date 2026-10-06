"use client";

import React, { useState } from "react";
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
import { ProductSelectionModal } from "./ProductSelectionModal";
import { DiscountType, PromotionGroupDto } from "@/types/promotion";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Tag,
  PackagePlus,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface CampaignGroupsEditorProps {
  groups: PromotionGroupDto[];
  onChange: (groups: PromotionGroupDto[]) => void;
  currentPromotionId?: number;
}

export function CampaignGroupsEditor({
  groups,
  onChange,
  currentPromotionId,
}: CampaignGroupsEditorProps) {
  const [activeModalGroupIndex, setActiveModalGroupIndex] = useState<
    number | null
  >(null);

  const handleAddGroup = () => {
    const newGroupIndex = groups.length;
    const newGroup: PromotionGroupDto = {
      name: `Nhóm sản phẩm ${newGroupIndex + 1}`,
      sortOrder: newGroupIndex + 1,
      discountType: "PERCENT",
      discountValue: 10,
      variantIds: [],
    };
    onChange([...groups, newGroup]);
    // Automatically open modal to select products for newly created group
    setActiveModalGroupIndex(newGroupIndex);
  };

  const handleRemoveGroup = (index: number) => {
    const nextGroups = groups
      .filter((_, i) => i !== index)
      .map((g, i) => ({ ...g, sortOrder: i + 1 }));
    onChange(nextGroups);
    if (activeModalGroupIndex === index) {
      setActiveModalGroupIndex(null);
    }
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

  const activeModalGroup =
    activeModalGroupIndex !== null ? groups[activeModalGroupIndex] : null;

  return (
    <div className="space-y-4 border p-4 rounded-xl bg-slate-50/60 shadow-2xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-base text-slate-900">
              Nhóm sản phẩm Campaign ({groups.length} nhóm)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi nhóm có mức chiết khấu và danh sách SKU riêng biệt. Bấm
            &quot;Chọn sản phẩm&quot; để mở popup chọn SKU.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleAddGroup}
          className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 text-xs font-semibold h-8.5 px-3.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nhóm sản phẩm</span>
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed rounded-xl text-amber-700 bg-amber-50/40">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500 opacity-90" />
          <p className="font-semibold text-sm">
            Campaign phải có ít nhất 1 nhóm sản phẩm
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Bấm nút &quot;Thêm nhóm sản phẩm&quot; phía trên để cấu hình mức
            chiết khấu và chọn sản phẩm qua modal popup.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {groups.map((group, index) => {
            const hasVariants = group.variantIds && group.variantIds.length > 0;
            const discountDisplay =
              group.discountType === "PERCENT"
                ? `Giảm ${group.discountValue}%`
                : `Giảm -${Number(group.discountValue).toLocaleString("vi-VN")}₫`;

            return (
              <div
                key={index}
                className="border bg-white rounded-xl shadow-xs overflow-hidden transition-all"
              >
                {/* Group Card Header */}
                <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 border-b bg-white">
                  <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
                    <span className="bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      #{index + 1}
                    </span>

                    <Input
                      value={group.name}
                      onChange={(e) =>
                        handleGroupChange(index, "name", e.target.value)
                      }
                      placeholder="Tên nhóm sản phẩm"
                      className="font-semibold max-w-xs h-8 text-xs bg-white"
                    />

                    {/* Summary badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md">
                        {discountDisplay}
                      </span>
                      {hasVariants ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{group.variantIds.length} SKU</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Chưa chọn SKU</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => handleMoveGroup(index, "UP")}
                      className="h-7 w-7 text-slate-500 hover:text-slate-900"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === groups.length - 1}
                      onClick={() => handleMoveGroup(index, "DOWN")}
                      className="h-7 w-7 text-slate-500 hover:text-slate-900"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGroup(index)}
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Xóa nhóm này"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Xóa nhóm</span>
                    </Button>
                  </div>
                </div>

                {/* Group Body: Compact Discount Fields & Modal Trigger */}
                <div className="p-3.5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Hình thức giảm giá nhóm
                      </Label>
                      <Select
                        value={group.discountType}
                        onValueChange={(val) =>
                          handleGroupChange(
                            index,
                            "discountType",
                            val as DiscountType,
                          )
                        }
                      >
                        <SelectTrigger className="bg-white text-xs h-8.5">
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

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
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
                        className="bg-white text-xs h-8.5 font-medium"
                        placeholder={
                          group.discountType === "PERCENT" ? "10" : "50000"
                        }
                      />
                    </div>
                  </div>

                  {/* Product Selection Modal Trigger Banner */}
                  <div className="pt-1">
                    {!hasVariants ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs text-slate-600">
                            Nhóm này chưa có SKU nào. Bấm nút bên cạnh để mở
                            popup chọn sản phẩm.
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setActiveModalGroupIndex(index)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-3.5 shadow-2xs shrink-0"
                        >
                          <PackagePlus className="w-3.5 h-3.5 mr-1.5" />
                          <span>Chọn sản phẩm ngay</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/40">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold text-slate-900">
                              Đã chọn {group.variantIds.length} SKU biến thể
                            </span>
                            <span className="text-slate-500 ml-1.5">
                              (Được giảm{" "}
                              {group.discountType === "PERCENT"
                                ? `${group.discountValue}%`
                                : `${Number(group.discountValue).toLocaleString("vi-VN")}₫`}
                              )
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveModalGroupIndex(index)}
                            className="text-xs h-7.5 px-3 bg-white border-slate-300 hover:border-rose-300 hover:text-rose-600 text-slate-700 font-medium"
                          >
                            <Layers className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                            <span>Quản lý / Thay đổi SKU</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleGroupChange(index, "variantIds", [])
                            }
                            className="text-xs h-7.5 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Bỏ chọn tất cả sản phẩm trong nhóm"
                          >
                            Xóa trắng
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Selection Modal Popup */}
      {activeModalGroup && (
        <ProductSelectionModal
          isOpen={activeModalGroupIndex !== null}
          onClose={() => setActiveModalGroupIndex(null)}
          groupName={activeModalGroup.name}
          discountType={activeModalGroup.discountType}
          discountValue={activeModalGroup.discountValue}
          selectedVariantIds={activeModalGroup.variantIds}
          excludedVariantIds={groups
            .filter((_, i) => i !== activeModalGroupIndex)
            .flatMap((g) => g.variantIds || [])}
          onConfirm={(ids) => {
            if (activeModalGroupIndex !== null) {
              handleGroupChange(activeModalGroupIndex, "variantIds", ids);
            }
          }}
          currentPromotionId={currentPromotionId}
        />
      )}
    </div>
  );
}
