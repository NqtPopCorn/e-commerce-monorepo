"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export type ConfirmDialogVariant =
  "danger" | "warning" | "info" | "success" | "default";

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  alertOnly?: boolean;
}

export function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
  isLoading = false,
  alertOnly = false,
}: AdminConfirmDialogProps) {
  const getIconAndColors = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-5 h-5 text-destructive shrink-0" />,
          confirmButtonClass:
            "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xs focus-visible:ring-destructive",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
          confirmButtonClass:
            "bg-warning hover:bg-warning/90 text-white shadow-xs focus-visible:ring-warning",
        };
      case "info":
        return {
          icon: <Info className="w-5 h-5 text-info shrink-0" />,
          confirmButtonClass:
            "bg-info hover:bg-info/90 text-white shadow-xs focus-visible:ring-info",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
          confirmButtonClass:
            "bg-success hover:bg-success/90 text-white shadow-xs focus-visible:ring-success",
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-foreground shrink-0" />,
          confirmButtonClass:
            "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs",
        };
    }
  };

  const { icon, confirmButtonClass } = getIconAndColors();

  const handleConfirm = async () => {
    if (alertOnly) {
      onClose();
      return;
    }
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && onClose()}
    >
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl bg-card border border-border text-card-foreground shadow-xl overflow-hidden sm:max-w-[460px]">
        <div className="p-6 pb-5">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
              {icon}
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground leading-relaxed font-normal mt-1.5 space-y-2">
                {description}
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5 sm:gap-2.5">
          {!alertOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border-border font-medium px-4 text-xs h-9"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-lg font-medium px-4 text-xs h-9 transition-colors ${confirmButtonClass}`}
          >
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            )}
            {alertOnly ? confirmText || "Đã hiểu" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
