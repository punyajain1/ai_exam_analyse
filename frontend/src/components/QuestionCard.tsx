"use client";

import React from "react";
import { ChevronDown, ChevronUp, Sparkles, Eye, CheckCircle2 } from "lucide-react";
import { QuestionItem } from "@/lib/assessmentData";

interface QuestionCardProps {
  question: QuestionItem;
  isActive: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isActive,
  isExpanded,
  onSelect,
  onToggleExpand,
}) => {
  // Determine score badge color
  const getScoreBadge = () => {
    const ratio = question.obtainedMarks / question.maxMarks;
    if (ratio === 1) {
      return "md:bg-[#eaf7ee] text-[#168a44] md:border-[#c7ebd2]";
    } else if (ratio >= 0.6) {
      return "md:bg-[#f4faee] text-[#2e7d32] md:border-[#d5edd2]";
    } else if (ratio > 0) {
      return "md:bg-[#fff7eb] text-[#d97706] md:border-[#fde68a]";
    } else {
      return "md:bg-[#fef2f2] text-[#dc2626] md:border-[#fecaca]";
    }
  };

  return (
    <div
      id={`question-card-${question.id}`}
      onClick={onSelect}
      className={`group rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
        isActive
          ? "border md:border-2 border-slate-200 md:border-[#ff5722] bg-white md:shadow-md md:shadow-orange-500/10 md:ring-4 md:ring-orange-500/5 shadow-sm"
          : "border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      {/* Question Header Bar */}
      <div className="p-4 flex items-start gap-3.5">
        {/* Question Number Badge */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors bg-slate-500 text-white`}
          >
            {question.number}
          </div>
          {question.subPart && (
            <span className="font-bold text-sm text-slate-700">
              {question.subPart}
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="flex-1 text-[13.5px] font-medium text-[#1e293b] leading-relaxed">
          {question.text}
        </div>

        {/* Score Badge and Accordion Toggle */}
        <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
          <span
            className={`inline-flex items-center justify-center font-bold text-[14px] md:text-xs px-1 md:px-2.5 py-0.5 rounded-full md:border border-transparent bg-transparent ${getScoreBadge()}`}
          >
            {question.obtainedMarks}/{question.maxMarks}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-slate-100">
          {/* Grounding Uncertainty Warning */}
          {question.groundingUncertain && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-amber-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span className="font-medium">
                Answer location uncertain — bounding box appears blank or unconfirmed. Please verify on page {question.page}.
              </span>
            </div>
          )}

          {/* AI Feedback Card */}
          <div className="rounded-xl bg-[#fafafa] border border-slate-200/80 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="hidden md:block w-3.5 h-3.5 text-[#ff5722]" />
              <span className="font-bold text-[13px] md:text-xs text-[#1e293b] md:uppercase md:tracking-wide">
                AI Feedback
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {question.aiFeedback}
            </p>
          </div>

          {/* Details footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>Page {question.page} of answer sheet</span>
            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {question.conceptCovered || "Standard Rubric"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
