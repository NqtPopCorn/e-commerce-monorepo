"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Cpu,
  Layers,
  Code2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  User,
  Wrench,
  Sparkles,
} from "lucide-react";
import { useChatbotStore } from "@/stores/chatbot.store";
import {
  ChatMessage,
  LangChainRunTrace,
  SystemPromptSectionDebug,
} from "@/types/chatbot";

interface ChatDebugPanelProps {
  onClose?: () => void;
}

type TabType = "runs" | "state" | "json";

const SECTION_BADGE_MAP: Record<
  string,
  { short: string; badgeClass: string; chipClass: string }
> = {
  base: {
    short: "BASE",
    badgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-800/70",
    chipClass: "bg-indigo-950/70 text-indigo-200 border-indigo-700/70",
  },
  profile: {
    short: "PROFILE",
    badgeClass: "bg-violet-950/80 text-violet-300 border-violet-800/70",
    chipClass: "bg-violet-950/70 text-violet-200 border-violet-700/70",
  },
  policy: {
    short: "POLICY",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-800/70",
    chipClass: "bg-amber-950/70 text-amber-200 border-amber-700/70",
  },
  product_rules: {
    short: "PRODUCT",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-800/70",
    chipClass: "bg-emerald-950/70 text-emerald-200 border-emerald-700/70",
  },
  support_rules: {
    short: "SUPPORT",
    badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-800/70",
    chipClass: "bg-cyan-950/70 text-cyan-200 border-cyan-700/70",
  },
  slot_summary: {
    short: "SLOTS",
    badgeClass: "bg-sky-950/80 text-sky-300 border-sky-800/70",
    chipClass: "bg-sky-950/70 text-sky-200 border-sky-700/70",
  },
};

function getSectionStyle(section: SystemPromptSectionDebug) {
  return (
    SECTION_BADGE_MAP[section.id] || {
      short: section.id.toUpperCase(),
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      chipClass: "bg-slate-800 text-slate-200 border-slate-700",
    }
  );
}

export const ChatDebugPanel: React.FC<ChatDebugPanelProps> = ({ onClose }) => {
  const { messages, selectedDebugMessageId, selectDebugMessage } =
    useChatbotStore();
  const [activeTab, setActiveTab] = useState<TabType>("runs");
  const [expandedRunIds, setExpandedRunIds] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedPromptSections, setExpandedPromptSections] = useState<
    Record<string, boolean>
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter messages that have debug telemetry or are assistant replies
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const currentMsg: ChatMessage | undefined =
    messages.find((m) => m.id === selectedDebugMessageId) ||
    [...assistantMessages].reverse().find((m) => m.debugMeta) ||
    assistantMessages[assistantMessages.length - 1];

  const debugMeta = currentMsg?.debugMeta;
  const runs: LangChainRunTrace[] = debugMeta?.runs || [];
  const stateSnapshot = debugMeta?.state_snapshot;

  const toggleRun = (runId: string) => {
    setExpandedRunIds((prev) => ({
      ...prev,
      [runId]: !prev[runId],
    }));
  };

  const togglePromptSection = (sectionKey: string) => {
    setExpandedPromptSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const allExpanded =
    runs.length > 0 && runs.every((r) => !!expandedRunIds[r.run_id]);

  const handleToggleExpandAll = () => {
    if (allExpanded) {
      setExpandedRunIds({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const r of runs) {
      next[r.run_id] = true;
    }
    setExpandedRunIds(next);
  };

  const copyToClipboard = async (key: string, payload: unknown) => {
    const text =
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard write errors in restricted environments
    }
  };

  const handleCopyRunsTree = () => {
    copyToClipboard("runs-tree", {
      messageId: currentMsg?.id,
      mode: debugMeta?.mode,
      phase: debugMeta?.phase,
      gated_turns: debugMeta?.gated_turns,
      latency_ms: debugMeta?.latency_ms,
      usage_metadata: debugMeta?.usage_metadata,
      runs,
    });
  };

  const handleCopyJson = () => {
    const dataToCopy = {
      messageId: currentMsg?.id,
      content: currentMsg?.content,
      clarificationAsked: currentMsg?.clarificationAsked,
      clarificationForm: currentMsg?.clarificationForm,
      products: currentMsg?.products,
      debugMeta: currentMsg?.debugMeta,
    };
    copyToClipboard("raw-json", dataToCopy);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 text-xs border-l border-slate-700/80 shadow-2xl overflow-hidden select-text">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-100 text-xs truncate flex items-center gap-1.5">
              <span>LangChain Inspector</span>
              {debugMeta?.latency_ms !== undefined && (
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1 rounded">
                  {debugMeta.latency_ms}ms
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400 truncate">
              Theo dõi LLM call, runs tree & state machine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Turn selector dropdown */}
          {assistantMessages.length > 1 && (
            <select
              value={currentMsg?.id || ""}
              onChange={(e) => selectDebugMessage(e.target.value)}
              className="bg-slate-950 text-slate-300 text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none focus:border-rose-500 max-w-[120px] truncate"
            >
              {assistantMessages.map((m, idx) => (
                <option key={m.id} value={m.id}>
                  Lượt {idx + 1}: {m.content.slice(0, 16)}...
                </option>
              ))}
            </select>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
              title="Đóng inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/70 px-2 shrink-0">
        <button
          onClick={() => setActiveTab("runs")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors text-[11px] ${
            activeTab === "runs"
              ? "border-rose-500 text-rose-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Runs Tree ({runs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("state")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors text-[11px] ${
            activeTab === "state"
              ? "border-rose-500 text-rose-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="w-3 h-3" />
          <span>State & Context</span>
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors text-[11px] ${
            activeTab === "json"
              ? "border-rose-500 text-rose-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Raw JSON</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* TAB 1: RUNS TREE */}
        {activeTab === "runs" && (
          <div className="space-y-2.5">
            {/* Run summary strip */}
            <div className="grid grid-cols-3 gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/60 text-[10px]">
              <div>
                <span className="text-slate-400 block">Total Latency</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {debugMeta?.latency_ms ?? 0} ms
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tokens In/Out</span>
                <span className="font-semibold text-sky-400 font-mono">
                  {debugMeta?.usage_metadata?.input_tokens ?? 0} /{" "}
                  {debugMeta?.usage_metadata?.output_tokens ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Tokens</span>
                <span className="font-semibold text-purple-400 font-mono">
                  {debugMeta?.usage_metadata?.total_tokens ?? 0}
                </span>
              </div>
            </div>

            {/* Run traces list */}
            {runs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <Layers className="w-6 h-6 mx-auto opacity-50" />
                <p>Chưa có LangChain run trace cho lượt này.</p>
                <p className="text-[10px]">
                  Bật DEBUG_CHAT_META=True trong backend config.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Runs Tree toolbar */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 transition-colors"
                  >
                    {allExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyRunsTree}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] text-slate-200 transition-colors"
                    title="Copy toàn bộ Runs Tree dưới dạng JSON"
                  >
                    {copiedKey === "runs-tree" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Đã copy Run Tree!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Run Tree</span>
                      </>
                    )}
                  </button>
                </div>

                {runs.map((r, idx) => {
                  const runKey = r.run_id || `run-${idx}`;
                  const isExp = !!expandedRunIds[r.run_id];
                  const isChatModel = r.run_type === "chat_model";
                  const isTool = r.run_type === "tool";

                  return (
                    <div
                      key={runKey}
                      className="bg-slate-800/80 rounded-lg border border-slate-700/70 overflow-hidden"
                    >
                      <div className="flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleRun(r.run_id)}
                          className="flex-1 min-w-0 text-left p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isExp ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 ${
                                isChatModel
                                  ? "bg-violet-950/80 text-violet-300 border border-violet-800/60"
                                  : isTool
                                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                                    : "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                              }`}
                            >
                              {r.run_type}
                            </span>
                            <div className="min-w-0">
                              <span className="font-mono text-slate-200 truncate block">
                                {r.name}
                              </span>
                              {r.system_prompt?.formula && (
                                <span className="font-mono text-[9px] text-indigo-300/90 truncate block">
                                  {r.system_prompt.formula}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                            {r.usage_metadata && (
                              <span className="font-mono text-purple-300 flex items-center gap-0.5">
                                <Coins className="w-2.5 h-2.5" />
                                {r.usage_metadata.total_tokens}t
                              </span>
                            )}
                            <span className="font-mono text-emerald-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {r.latency_ms}ms
                            </span>
                            {r.error ? (
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`run:${runKey}`, r);
                          }}
                          className="mr-2 p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-600/60 transition-colors shrink-0"
                          title="Copy run này (JSON)"
                        >
                          {copiedKey === `run:${runKey}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Expanded run details */}
                      {isExp && (
                        <div className="p-2.5 bg-slate-950/80 border-t border-slate-700/60 space-y-2 font-mono text-[10px]">
                          {r.error && (
                            <div className="p-2 rounded bg-rose-950/60 border border-rose-800/70 text-rose-300">
                              <span className="font-bold">Error:</span> {r.error}
                            </div>
                          )}

                          {/* System Message Structure */}
                          {r.system_prompt && (
                            <div className="rounded-md border border-indigo-800/60 bg-slate-900/90 p-2 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-indigo-300 font-semibold font-sans text-[10px]">
                                    System Message Structure
                                  </span>
                                  <span className="px-1 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/70 text-[9px] text-indigo-300">
                                    {r.system_prompt.version}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {r.system_prompt.total_chars} chars
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sysMsg = (
                                      r.inputs?.messages as
                                        | Array<{ type?: string; content?: unknown }>
                                        | undefined
                                    )?.find((m) => m.type === "system");
                                    const fullText =
                                      typeof sysMsg?.content === "string"
                                        ? sysMsg.content
                                        : r.system_prompt!.sections
                                            .filter((s) => s.included)
                                            .map((s) => s.content)
                                            .join("\n\n");
                                    copyToClipboard(`sys-full:${runKey}`, fullText);
                                  }}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[9px] text-slate-300 transition-colors shrink-0"
                                  title="Copy toàn bộ System Message (plain text)"
                                >
                                  {copiedKey === `sys-full:${runKey}` ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                                      <span className="text-emerald-400">
                                        Đã copy
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-2.5 h-2.5" />
                                      <span>Copy Full</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Formula chips */}
                              <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                                {r.system_prompt.sections
                                  .filter((s) => s.included)
                                  .map((sec, sIdx) => {
                                    const st = getSectionStyle(sec);
                                    return (
                                      <React.Fragment key={sec.id}>
                                        {sIdx > 0 && (
                                          <span className="text-slate-500 font-bold">
                                            +
                                          </span>
                                        )}
                                        <span
                                          className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${st.chipClass}`}
                                        >
                                          {sec.name}
                                        </span>
                                      </React.Fragment>
                                    );
                                  })}
                                {r.system_prompt.sections
                                  .filter((s) => !s.included)
                                  .map((sec) => (
                                    <span
                                      key={sec.id}
                                      className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/60 text-[9px] text-slate-500"
                                      title="Không được đưa vào lượt này"
                                    >
                                      {sec.name} (empty)
                                    </span>
                                  ))}
                              </div>

                              {/* Individual collapsible sections */}
                              <div className="space-y-1">
                                {r.system_prompt.sections
                                  .filter((s) => s.included)
                                  .map((sec) => {
                                    const secKey = `${runKey}:${sec.id}`;
                                    const isSecExp = !!expandedPromptSections[secKey];
                                    const st = getSectionStyle(sec);
                                    return (
                                      <div
                                        key={sec.id}
                                        className="rounded border border-slate-800 bg-slate-950/70 overflow-hidden"
                                      >
                                        <div className="flex items-center justify-between px-2 py-1 hover:bg-slate-800/40 transition-colors">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              togglePromptSection(secKey)
                                            }
                                            className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                                          >
                                            {isSecExp ? (
                                              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                            )}
                                            <span
                                              className={`px-1 py-0.5 rounded border text-[8px] font-bold shrink-0 ${st.badgeClass}`}
                                            >
                                              {st.short}
                                            </span>
                                            <span className="text-slate-200 truncate">
                                              {sec.name}
                                            </span>
                                            <span className="text-slate-500 text-[9px] shrink-0">
                                              ({sec.char_count} chars)
                                            </span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyToClipboard(
                                                `sec:${secKey}`,
                                                sec.content,
                                              )
                                            }
                                            className="p-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
                                            title={`Copy ${sec.name}`}
                                          >
                                            {copiedKey === `sec:${secKey}` ? (
                                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-2.5 h-2.5" />
                                            )}
                                          </button>
                                        </div>
                                        {isSecExp && (
                                          <pre className="p-2 border-t border-slate-800/80 bg-slate-950 text-slate-200 font-sans text-[11px] leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                                            {sec.content}
                                          </pre>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Inputs */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-400 font-semibold">
                                Inputs:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(`inputs:${runKey}`, r.inputs)
                                }
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[9px] text-slate-300 transition-colors"
                                title="Copy Inputs"
                              >
                                {copiedKey === `inputs:${runKey}` ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span className="text-emerald-400">Đã copy</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto text-slate-300 max-h-48 whitespace-pre-wrap break-words">
                              {JSON.stringify(r.inputs, null, 2)}
                            </pre>
                          </div>

                          {/* Outputs */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-400 font-semibold">
                                Outputs:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(`outputs:${runKey}`, r.outputs)
                                }
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[9px] text-slate-300 transition-colors"
                                title="Copy Outputs"
                              >
                                {copiedKey === `outputs:${runKey}` ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span className="text-emerald-400">Đã copy</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto text-emerald-300 max-h-48 whitespace-pre-wrap break-words">
                              {JSON.stringify(r.outputs, null, 2)}
                            </pre>
                          </div>

                          {/* Metadata */}
                          {r.metadata && Object.keys(r.metadata).length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-slate-400 font-semibold">
                                  Metadata:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      `metadata:${runKey}`,
                                      r.metadata,
                                    )
                                  }
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[9px] text-slate-300 transition-colors"
                                  title="Copy Metadata"
                                >
                                  {copiedKey === `metadata:${runKey}` ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                                      <span className="text-emerald-400">Đã copy</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-2.5 h-2.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto text-slate-400 max-h-32 whitespace-pre-wrap break-words">
                                {JSON.stringify(r.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STATE & CONTEXT */}
        {activeTab === "state" && (
          <div className="space-y-3">
            {/* Clarification State Machine */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/70 space-y-2">
              <h5 className="font-semibold text-rose-400 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clarification State Machine</span>
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Mode</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {debugMeta?.mode || "CONDITIONAL"}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Current Phase</span>
                  <span
                    className={`font-mono font-semibold ${
                      debugMeta?.phase === "INTERVIEW"
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {debugMeta?.phase || "OPEN"}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Gated Turns</span>
                  <span className="font-mono text-slate-200">
                    {debugMeta?.gated_turns ?? 0}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block">Gate Search Status</span>
                  <span
                    className={`font-mono font-semibold ${
                      stateSnapshot?.gate_search
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {stateSnapshot?.gate_search ? "LOCKED (Gate=1)" : "UNLOCKED (Open)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Detected Inquiry Slots */}
            {stateSnapshot?.detected_slots && (
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/70 space-y-2">
                <h5 className="font-semibold text-sky-400 flex items-center gap-1.5 text-[11px]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Detected Inquiry Slots</span>
                </h5>
                <pre className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-[10px] text-sky-200 overflow-x-auto font-mono">
                  {JSON.stringify(stateSnapshot.detected_slots, null, 2)}
                </pre>
              </div>
            )}

            {/* Active User Profile */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/70 space-y-2">
              <h5 className="font-semibold text-violet-400 flex items-center gap-1.5 text-[11px]">
                <User className="w-3.5 h-3.5" />
                <span>Active Customer Profile</span>
              </h5>
              {stateSnapshot?.active_profile ? (
                <pre className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-[10px] text-violet-200 overflow-x-auto font-mono">
                  {JSON.stringify(stateSnapshot.active_profile, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-500 text-[10px]">
                  Chưa có số đo cơ thể trong session hiện tại.
                </p>
              )}
            </div>

            {/* Available Tools */}
            {debugMeta?.tools_available && (
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/70 space-y-2">
                <h5 className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Active Tools ({debugMeta.tools_available.length})</span>
                </h5>
                <div className="flex flex-wrap gap-1">
                  {debugMeta.tools_available.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[9px] text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RAW JSON */}
        {activeTab === "json" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Payload JSON đầy đủ của lượt hội thoại:
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] text-slate-200 transition-colors"
              >
                {copiedKey === "raw-json" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã copy!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-[460px]">
              {JSON.stringify(
                {
                  messageId: currentMsg?.id,
                  content: currentMsg?.content,
                  clarificationAsked: currentMsg?.clarificationAsked,
                  clarificationForm: currentMsg?.clarificationForm,
                  products: currentMsg?.products,
                  debugMeta: currentMsg?.debugMeta,
                },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

