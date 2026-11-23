"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { ClarificationForm } from "@/types/chatbot";

interface ChatClarificationCardProps {
  form: ClarificationForm;
  submittedAnswers?: Record<string, string[]>;
  onSubmit: (answers: Record<string, string[]>, formattedMessage: string) => void;
  disabled?: boolean;
}

export const ChatClarificationCard: React.FC<ChatClarificationCardProps> = ({
  form,
  submittedAnswers,
  onSubmit,
  disabled = false,
}) => {
  const isSubmitted = Boolean(submittedAnswers && Object.keys(submittedAnswers).length > 0);

  // Initialize selections with submittedAnswers if available, or empty
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    if (submittedAnswers) return submittedAnswers;
    const initial: Record<string, string[]> = {};
    form.questions.forEach((q) => {
      // Pre-select first option for single type to improve convenience, if desired
      initial[q.id] = [];
    });
    return initial;
  });

  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleToggleOption = (questionId: string, option: string, isMultiple: boolean) => {
    if (isSubmitted || disabled) return;

    setSelected((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        const next = current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current, option];
        return { ...prev, [questionId]: next };
      } else {
        // Single selection
        return { ...prev, [questionId]: [option] };
      }
    });
  };

  const handleCustomInputChange = (questionId: string, value: string) => {
    if (isSubmitted || disabled) return;
    setCustomInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitted || disabled) return;

    // Check if at least one question has an answer or custom input
    const answersToSubmit: Record<string, string[]> = {};
    const summaryLines: string[] = [];

    form.questions.forEach((q, idx) => {
      const chosen = [...(selected[q.id] || [])];
      const customVal = customInputs[q.id]?.trim();
      if (customVal && !chosen.includes(customVal)) {
        chosen.push(customVal);
      }
      if (chosen.length > 0) {
        answersToSubmit[q.id] = chosen;
        summaryLines.push(`${idx + 1}. ${chosen.join(", ")}`);
      }
    });

    if (summaryLines.length === 0) return;

    const formattedMessage = `Mình chọn:\n${summaryLines.join("\n")}`;
    onSubmit(answersToSubmit, formattedMessage);
  };

  const hasAnySelection =
    Object.values(selected).some((arr) => arr.length > 0) ||
    Object.values(customInputs).some((txt) => txt.trim().length > 0);

  return (
    <div className="w-full my-2.5 animate-in fade-in duration-300">
      {/* Title */}
      {form.title && (
        <h4 className="text-xs md:text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{form.title}</span>
        </h4>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden divide-y divide-gray-100">
        {form.questions.map((q, qIdx) => {
          const currentChosen = isSubmitted
            ? submittedAnswers?.[q.id] || []
            : selected[q.id] || [];
          const isMultiple = q.type === "multiple";

          return (
            <div key={q.id || qIdx} className="p-3.5 space-y-2.5">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs md:text-sm text-gray-900 leading-snug">
                  {q.question}
                </span>
                {isMultiple && (
                  <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200/60 font-medium px-1.5 py-0.5 rounded shrink-0">
                    Chọn nhiều
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-1.5 pt-0.5">
                {q.options.map((option, optIdx) => {
                  const isChecked = currentChosen.includes(option);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted || disabled}
                      onClick={() => handleToggleOption(q.id, option, isMultiple)}
                      className={`w-full text-left p-2 rounded-xl text-xs md:text-sm flex items-start gap-2.5 transition-all ${
                        isSubmitted
                          ? isChecked
                            ? "bg-rose-50/70 text-rose-950 font-medium"
                            : "text-gray-400 opacity-60"
                          : isChecked
                            ? "bg-rose-50/80 text-rose-950 font-medium border border-rose-300/80 shadow-2xs"
                            : "hover:bg-gray-50 text-gray-700 border border-transparent"
                      }`}
                    >
                      {/* Checkbox or Radio Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isMultiple ? (
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked
                                ? "bg-rose-600 border-rose-600 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isChecked
                                ? "border-rose-600 bg-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <div className="w-2 h-2 rounded-full bg-rose-600" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Option text */}
                      <span className="flex-1 leading-relaxed select-none">{option}</span>
                    </button>
                  );
                })}

                {/* Optional Custom Input (for body measurements or custom budget) */}
                {q.allow_custom && (
                  <div className="pt-1">
                    <input
                      type="text"
                      disabled={isSubmitted || disabled}
                      value={isSubmitted ? "" : customInputs[q.id] || ""}
                      onChange={(e) => handleCustomInputChange(q.id, e.target.value)}
                      placeholder={
                        q.custom_placeholder || "Khác / Nhập thông tin cụ thể..."
                      }
                      className="w-full text-xs px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 placeholder-gray-400 text-gray-800 outline-none focus:border-rose-500 focus:bg-white transition-all disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer Submit Bar */}
        <div className="p-3 bg-slate-50/70 border-t border-gray-100 flex items-center justify-between">
          {isSubmitted ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 w-full justify-center py-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã xác nhận lựa chọn</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasAnySelection || disabled}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs md:text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white shadow-xs hover:shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{form.submit_label || "Xác nhận và xem gợi ý"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

