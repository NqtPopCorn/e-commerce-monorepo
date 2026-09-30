"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { AuditLog } from "@/types/audit-log";
import {
  User,
  Clock,
  Globe,
  Monitor,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileCode,
  Tag,
} from "lucide-react";
import { AdminStatusBadge } from "../AdminStatusBadge";

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

export function AuditLogDetailModal({
  isOpen,
  onClose,
  log,
}: AuditLogDetailModalProps) {
  if (!log) return null;

  const actorName =
    [log.user?.firstName, log.user?.lastName].filter(Boolean).join(" ") ||
    log.userEmail ||
    "Hệ thống";

  const hasOldValue =
    log.oldValue !== null &&
    log.oldValue !== undefined &&
    Object.keys(log.oldValue).length > 0;
  const hasNewValue =
    log.newValue !== null &&
    log.newValue !== undefined &&
    Object.keys(log.newValue).length > 0;

  // Compute changed keys between old and new values
  const changedKeys: string[] = [];
  if (hasOldValue && hasNewValue) {
    const allKeys = Array.from(
      new Set([...Object.keys(log.oldValue), ...Object.keys(log.newValue)]),
    );
    for (const key of allKeys) {
      if (
        JSON.stringify(log.oldValue[key]) !== JSON.stringify(log.newValue[key])
      ) {
        changedKeys.push(key);
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card text-card-foreground">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-6 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  Bản ghi kiểm toán{" "}
                  <span className="font-mono text-primary">#{log.id}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ghi vết chi tiết thay đổi và ngữ cảnh thực thi của thao tác.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted border border-border text-foreground font-mono">
                {log.entityType}
              </span>
              <AdminStatusBadge
                status={log.status === "SUCCESS" ? "COMPLETED" : "CANCELLED"}
                size="sm"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <DialogBody className="space-y-5 px-6 py-5 overflow-y-auto">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Người thực hiện */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Người thao tác</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {log.userEmail?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {actorName}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {log.userEmail || "Hệ thống"}
                </p>
                <div className="pt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Vai trò:</span>
                  <AdminStatusBadge
                    status={log.userRole || log.user?.role || "SYSTEM"}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Phân loại & Thời gian */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Thời gian & Đối tượng</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-medium text-foreground">
                  {formatDateTime(log.createdAt)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Hành động:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {log.action}
                  </span>
                </p>
                {log.entityId && (
                  <p className="text-[11px] text-muted-foreground">
                    Mã thực thể:{" "}
                    <span className="font-mono font-bold text-foreground">
                      #{log.entityId}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Card 3: Mạng & Thiết bị */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>Mạng & Thiết bị</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  IP:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {log.ipAddress || "Không xác định"}
                  </span>
                </p>
                <div className="pt-1">
                  <span className="text-[10px] text-muted-foreground block mb-0.5 flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> User Agent:
                  </span>
                  <p
                    className="text-[10px] text-muted-foreground font-mono bg-background/60 p-1.5 rounded border border-border truncate"
                    title={log.userAgent || undefined}
                  >
                    {log.userAgent || "Không có thông tin"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả hoạt động */}
          {log.description && (
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-primary" /> Mô tả chi tiết
              </span>
              <p className="text-xs font-medium text-foreground leading-relaxed">
                {log.description}
              </p>
            </div>
          )}

          {/* Cảnh báo lỗi nếu có */}
          {log.status === "FAILED" && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Lỗi phát sinh trong thao tác</span>
              </div>
              <p className="text-xs font-mono pl-5">
                {log.errorMessage || "Thao tác không hoàn thành do lỗi hệ thống."}
              </p>
            </div>
          )}

          {/* Visual Diff Section: Dữ liệu thay đổi */}
          {(hasOldValue || hasNewValue) && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  So sánh thay đổi dữ liệu (Data Diff)
                </h4>
                {changedKeys.length > 0 && (
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {changedKeys.length} trường dữ liệu thay đổi
                  </span>
                )}
              </div>

              {/* Bảng so sánh các trường bị thay đổi nếu cả oldValue và newValue đều có */}
              {hasOldValue && hasNewValue && changedKeys.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="px-3.5 py-2.5 w-1/4">Trường dữ liệu</th>
                        <th className="px-3.5 py-2.5 w-3/8 text-amber-700 dark:text-amber-400">
                          Giá trị trước (Before)
                        </th>
                        <th className="px-3.5 py-2.5 w-3/8 text-emerald-700 dark:text-emerald-400">
                          Giá trị sau (After)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-card font-mono text-[11px]">
                      {changedKeys.map((key) => {
                        const oldVal = JSON.stringify(log.oldValue[key], null, 1);
                        const newVal = JSON.stringify(log.newValue[key], null, 1);

                        return (
                          <tr key={key} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3.5 py-2 font-semibold text-foreground">
                              {key}
                            </td>
                            <td className="px-3.5 py-2 text-muted-foreground bg-amber-500/5">
                              {oldVal ?? <span className="italic">null</span>}
                            </td>
                            <td className="px-3.5 py-2 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                              {newVal ?? <span className="italic">null</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Chi tiết JSON side-by-side hoặc full snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {hasOldValue && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Toàn bộ bản ghi trước thay đổi (Before)
                    </span>
                    <pre className="p-3 rounded-xl bg-muted/40 border border-border font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-48 admin-scrollbar">
                      {JSON.stringify(log.oldValue, null, 2)}
                    </pre>
                  </div>
                )}

                {hasNewValue && (
                  <div className={`space-y-1.5 ${!hasOldValue ? "md:col-span-2" : ""}`}>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      {hasOldValue
                        ? "Toàn bộ bản ghi sau thay đổi (After)"
                        : "Dữ liệu bản ghi mới (Payload)"}
                    </span>
                    <pre className="p-3 rounded-xl bg-muted/40 border border-border font-mono text-[11px] text-foreground overflow-x-auto max-h-48 admin-scrollbar">
                      {JSON.stringify(log.newValue, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-4"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
