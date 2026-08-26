"use client";

import React, { useState } from "react";
import { QuestionItem } from "@/lib/assessmentData";
import { QuestionCard } from "./QuestionCard";
import { ListFilter, ChevronDown, ChevronUp } from "lucide-react";

interface QuestionListProps {
  questions: QuestionItem[];
  activeQuestionId: string;
  onSelectQuestion: (question: QuestionItem) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  activeQuestionId,
  onSelectQuestion,
}) => {
  // Store expanded state per question ID
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    // Q2 is expanded by default to match screenshot
    q2: true,
  });

  const allExpanded = questions.every((q) => expandedIds[q.id]);

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const all: Record<string, boolean> = {};
      questions.forEach((q) => {
        all[q.id] = true;
      });
      setExpandedIds(all);
    }
  };

  const toggleSingle = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] border-r border-[#e2e8f0]">
      {/* Top Header */}
      <div className="p-4 border-b border-[#e2e8f0] bg-white flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-[14px] text-slate-700 tracking-tight">
            Extracted <span className="underline decoration-slate-400 underline-offset-4 decoration-2">Questions</span> <span className="font-normal">(from question paper)</span>
          </h2>
        </div>

        <button
          onClick={toggleAll}
          className="hidden md:block text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full transition-all border border-slate-200 shadow-xs"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Questions Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {questions.map((question) => {
          const isActive = question.id === activeQuestionId;
          const isExpanded = !!expandedIds[question.id] || isActive;

          return (
            <QuestionCard
              key={question.id}
              question={question}
              isActive={isActive}
              isExpanded={isExpanded}
              onSelect={() => {
                onSelectQuestion(question);
                setExpandedIds((prev) => ({
                  ...prev,
                  [question.id]: true,
                }));
              }}
              onToggleExpand={() => toggleSingle(question.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
