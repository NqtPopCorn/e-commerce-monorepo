"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSimulatePayment } from "@/hooks/usePayments";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface VietQRSandboxSimulatorProps {
  orderId: number;
  expectedAmount: number;
  transferContent: string;
  accountNo: string;
  bankName?: string;
  onSimulationSuccess?: () => void;
}

export function VietQRSandboxSimulator({
  orderId,
  expectedAmount,
  transferContent,
  accountNo,
  bankName = "MBBank",
  onSimulationSuccess,
}: VietQRSandboxSimulatorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<
    "SUCCESS" | "UNDERPAID" | "WRONG_MEMO" | "DUPLICATE"
  >("SUCCESS");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const simulateMutation = useSimulatePayment();

  const handleSimulate = async (
    scenario: "SUCCESS" | "UNDERPAID" | "WRONG_MEMO" | "DUPLICATE" = selectedScenario,
  ) => {
    try {
      const res = await simulateMutation.mutateAsync({
        orderId,
        scenario,
      });
      setLastResult(res);

      if (scenario === "SUCCESS") {
        if (res.result?.success) {
          toast.success(
            `[Sandbox] Giả lập chuyển khoản thành công: ${formatCurrency(
              res.simulation?.payload?.transferAmount || expectedAmount,
            )}! Đang đối soát...`,
          );
          if (onSimulationSuccess) {
            onSimulationSuccess();
          }
        } else {
          toast.info(`[Sandbox] Kết quả: ${res.result?.message}`);
        }
      } else if (scenario === "UNDERPAID") {
        toast.warning(
          `[Sandbox] Đã chuyển một phần (${formatCurrency(
            res.simulation?.payload?.transferAmount,
          )} / Cần ${formatCurrency(expectedAmount)}). Đã cập nhật số tiền đã chuyển!`,
        );
        if (onSimulationSuccess) {
          onSimulationSuccess();
        }
      } else if (scenario === "WRONG_MEMO") {
        toast.error(
          `[Sandbox] Đã chuyển tiền sai nội dung (Memo: "${res.simulation?.payload?.content}"). Hệ thống ghi nhận Unmatched Transfer.`,
        );
      } else if (scenario === "DUPLICATE") {
        toast.info(
          `[Sandbox] Gửi lại giao dịch trùng lặp. Hệ thống tự động Idempotency bỏ qua.`,
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể thực hiện giả lập webhook. Vui lòng kiểm tra lại server.",
      );
    }
  };

  const curlCommand = `curl -X POST http://localhost:8080/api/payments/vietqr/webhook \\
  -H "Authorization: Apikey sepay-secret-api-key-123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "SANDBOX_${Date.now()}",
    "gateway": "MBBank",
    "accountNumber": "${accountNo}",
    "transferAmount": ${expectedAmount},
    "content": "${transferContent} chuyen khoan",
    "transferType": "in"
  }'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedSnippet(true);
    toast.success("Đã sao chép lệnh cURL giả lập Sandbox");
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/20 via-background to-purple-950/20 rounded-3xl border border-indigo-500/30 p-5 shadow-lg relative overflow-hidden backdrop-blur-sm transition-all duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                VietQR Sandbox Simulator
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Dev / Demo Mode
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Giả lập biến động số dư ngân hàng & Webhook SePay tức thì
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2 text-muted-foreground hover:text-foreground rounded-lg"
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="pt-4 space-y-4 animate-in fade-in-50 duration-200">
          {/* Quick Scenario Buttons */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Chọn kịch bản kiểm thử:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScenario("SUCCESS")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedScenario === "SUCCESS"
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1. Thành công</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  Chuyển đúng số tiền {formatCurrency(expectedAmount)} và memo
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScenario("UNDERPAID")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedScenario === "UNDERPAID"
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>2. Thiếu tiền</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  Chuyển 50% số tiền, hệ thống cộng dồn & cập nhật phần còn thiếu
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScenario("WRONG_MEMO")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedScenario === "WRONG_MEMO"
                    ? "bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-sm"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <FileCode2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>3. Sai nội dung</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  Không chứa {transferContent}, ghi log Unmatched
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScenario("DUPLICATE")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedScenario === "DUPLICATE"
                    ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-400 shadow-sm"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>4. Trùng lặp</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  Gửi 2 lần cùng Event ID (Ledger Idempotency)
                </p>
              </button>
            </div>
          </div>

          {/* Trigger Action */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <Button
              type="button"
              disabled={simulateMutation.isPending}
              onClick={() => handleSimulate(selectedScenario)}
              className="w-full sm:flex-1 h-10 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 gap-2"
            >
              {simulateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang bắn Webhook giả lập...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kích hoạt kịch bản Sandbox:{" "}
                  {selectedScenario === "SUCCESS"
                    ? "Chuyển tiền thành công"
                    : selectedScenario === "UNDERPAID"
                    ? "Chuyển thiếu tiền"
                    : selectedScenario === "WRONG_MEMO"
                    ? "Sai nội dung Memo"
                    : "Gửi trùng Webhook"}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCurl}
              className="w-full sm:w-auto h-10 text-xs rounded-xl border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5 font-mono"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Đã copy cURL
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  Copy cURL CLI
                </>
              )}
            </Button>
          </div>

          {/* Feedback details */}
          {lastResult && (
            <div className="bg-black/40 rounded-xl p-3 border border-white/10 font-mono text-[11px] space-y-1.5 text-muted-foreground animate-in fade-in-50">
              <div className="flex items-center justify-between text-xs text-foreground">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Phản hồi từ Payments Service:
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lastResult.result?.success
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {lastResult.result?.success ? "HTTP 200 SUCCESS" : "FAILED / IGNORED"}
                </span>
              </div>
              <p className="text-foreground">
                Thông điệp:{" "}
                <span className="text-indigo-300 font-semibold">
                  {lastResult.result?.message}
                </span>
              </p>
              <div className="text-[10px] opacity-80 pt-1 border-t border-white/5 space-y-0.5">
                <p>
                  Payload: Số tiền:{" "}
                  {formatCurrency(lastResult.simulation?.payload?.transferAmount)} |
                  Memo: &quot;{lastResult.simulation?.payload?.content}&quot;
                </p>
                <p>Mã GD Sandbox: {lastResult.simulation?.payload?.id}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
