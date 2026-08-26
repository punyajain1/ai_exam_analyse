"use client";

import React, { useState, useEffect } from "react";
import { sampleAssessment, AssessmentData, QuestionItem } from "@/lib/assessmentData";
import { QuestionList } from "./QuestionList";
import { AnswerSheetViewer } from "./AnswerSheetViewer";

interface MappingScreenProps {
  assessmentData?: AssessmentData | null;
  answerSheetPageImages?: string[];
}

export const MappingScreen: React.FC<MappingScreenProps> = ({
  assessmentData,
  answerSheetPageImages = [],
}) => {
  const effectiveData = assessmentData || sampleAssessment;
  const [questions, setQuestions] = useState<QuestionItem[]>(effectiveData.questions);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    effectiveData.questions[0]?.id || "q1"
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<"questions" | "answersheet">("questions");

  useEffect(() => {
    if (assessmentData) {
      setQuestions(assessmentData.questions);
      if (assessmentData.questions.length > 0) {
        setActiveQuestionId(assessmentData.questions[0].id);
        if (assessmentData.questions[0].page) {
          setCurrentPage(assessmentData.questions[0].page);
        }
      }
    }
  }, [assessmentData]);

  const totalPages = Math.max(
    answerSheetPageImages.length,
    effectiveData.totalPages || 1,
    ...questions.map((q) => q.page || 1),
    1
  );

  const handleSelectQuestion = (question: QuestionItem) => {
    setActiveQuestionId(question.id);
    if (question.page && question.page !== currentPage && question.page <= totalPages) {
      setCurrentPage(question.page);
    }

    // On desktop, scroll corresponding question card into view
    setTimeout(() => {
      const cardEl = document.getElementById(`question-card-${question.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Mobile Tab Segmented Switch (Visible on small screens) */}
      <div className="md:hidden flex items-center justify-center p-3 bg-white border-b border-slate-200 shadow-sm relative z-10">
        <div className="flex bg-slate-100/80 p-1.5 rounded-full w-[95%] max-w-sm">
          <button
            onClick={() => setMobileTab("questions")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
              mobileTab === "questions"
                ? "bg-[#2b2b2b] text-white shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setMobileTab("answersheet")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
              mobileTab === "answersheet"
                ? "bg-[#2b2b2b] text-white shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Answer Sheet
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left Column: Extracted Questions */}
        <div
          className={`w-full md:w-[48%] lg:w-[46%] h-full shrink-0 ${
            mobileTab === "questions" ? "block" : "hidden md:block"
          }`}
        >
          <QuestionList
            questions={questions}
            activeQuestionId={activeQuestionId}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>

        {/* Right Column: Answer Sheet Canvas */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === "answersheet" ? "block" : "hidden md:block"
          }`}
        >
          <AnswerSheetViewer
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            questions={questions}
            activeQuestionId={activeQuestionId}
            onSelectQuestion={handleSelectQuestion}
            pageImages={answerSheetPageImages}
          />
        </div>
      </div>
    </div>
  );
};
