"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductSelectionTable } from "./ProductSelectionTable";
import { DiscountType } from "@/types/promotion";
import { Check, PackagePlus, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  discountType?: DiscountType;
  discountValue?: number;
  selectedVariantIds: number[];
  excludedVariantIds?: number[];
  onConfirm: (ids: number[]) => void;
  currentPromotionId?: number;
}

export function ProductSelectionModal({
  isOpen,
  onClose,
  groupName,
  discountType,
  discountValue,
  selectedVariantIds,
  excludedVariantIds = [],
  onConfirm,
  currentPromotionId,
}: ProductSelectionModalProps) {
  const [tempSelectedIds, setTempSelectedIds] =
    useState<number[]>(selectedVariantIds);

  // Sync with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedVariantIds);
    }
  }, [isOpen, selectedVariantIds]);

  const handleSave = () => {
    onConfirm(tempSelectedIds);
    onClose();
  };

  const discountLabel =
    discountType === "PERCENT"
      ? `Giảm ${discountValue || 0}%`
      : `Giảm -${formatCurrency(Number(discountValue || 0))}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card text-card-foreground">
        {/* Header cố định */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" />
              <DialogTitle className="text-base font-bold text-foreground">
                Chọn sản phẩm cho: {groupName}
              </DialogTitle>
            </div>
            {discountValue && discountValue > 0 && (
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3 text-primary" />
                <span>{discountLabel}</span>
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Chọn các sản phẩm hoặc biến thể áp dụng mức chiết khấu của nhóm này.
            Hệ thống hỗ trợ tính trước giá sau giảm và cảnh báo trùng lặp.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Body cuộn riêng biệt */}
        <DialogBody className="w-full flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <ProductSelectionTable
            selectedVariantIds={tempSelectedIds}
            excludedVariantIds={excludedVariantIds}
            onChange={setTempSelectedIds}
            discountType={discountType}
            discountValue={discountValue}
            currentPromotionId={currentPromotionId}
          />
        </DialogBody>

        {/* Modal Footer cố định ở đáy */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Số lượng đã chọn:</span>
            <span className="font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
              {tempSelectedIds.length} SKU
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold rounded-lg"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={tempSelectedIds.length === 0}
              className="h-9 px-4 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Xác nhận chọn ({tempSelectedIds.length} SKU)</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
