import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Ticket, X, CheckCircle2 } from "lucide-react";

interface VoucherInputProps {
  appliedCode?: string;
  voucherError?: string;
  voucherDiscount?: number;
  onApply: (code: string) => void;
  onRemove: () => void;
}

export function VoucherInput({
  appliedCode = "",
  voucherError,
  voucherDiscount = 0,
  onApply,
  onRemove,
}: VoucherInputProps) {
  const [inputCode, setInputCode] = useState(appliedCode);

  const handleApply = (
    e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent,
  ) => {
    if (e) e.preventDefault();
    if (inputCode.trim()) {
      onApply(inputCode.trim());
    }
  };

  const handleRemove = () => {
    setInputCode("");
    onRemove();
  };

  const isApplied = !!appliedCode && voucherDiscount > 0 && !voucherError;

  return (
    <div className="space-y-2 py-2">
      <Label
        htmlFor="voucherCode"
        className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
      >
        <Ticket className="w-4 h-4 text-purple-600" /> Voucher / mã giảm giá
      </Label>

      {isApplied ? (
        <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <div>
              <span className="font-mono font-bold text-purple-900">
                {appliedCode}
              </span>
              <span className="text-xs text-purple-700 ml-2">
                (-{voucherDiscount.toLocaleString()}đ)
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-7 px-2 text-slate-500 hover:text-rose-600 hover:bg-purple-100"
          >
            <X className="w-4 h-4 mr-1" /> Bỏ chọn
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            id="voucherCode"
            placeholder="Nhập mã voucher..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply(e);
              }
            }}
            className="font-mono uppercase bg-white"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!inputCode.trim()}
            onClick={handleApply}
            className="shrink-0 border-purple-600 text-purple-700 hover:bg-purple-50"
          >
            Áp dụng
          </Button>
        </div>
      )}

      {voucherError && (
        <p className="text-xs text-rose-600 font-medium pl-1">{voucherError}</p>
      )}
    </div>
  );
}
