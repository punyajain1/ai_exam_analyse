"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize2 } from "lucide-react";
import { QuestionItem } from "@/lib/assessmentData";
import { HandwrittenCanvasPage } from "./HandwrittenCanvasPage";

interface AnswerSheetViewerProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  questions: QuestionItem[];
  activeQuestionId: string;
  onSelectQuestion: (question: QuestionItem) => void;
  pageImages?: string[];
}

export const AnswerSheetViewer: React.FC<AnswerSheetViewerProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  questions,
  activeQuestionId,
  onSelectQuestion,
  pageImages,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevActiveQuestionIdRef = useRef<string>(activeQuestionId);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 160));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 70));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  // ONLY switch page when the user explicitly clicks a different active question
  useEffect(() => {
    if (prevActiveQuestionIdRef.current !== activeQuestionId) {
      prevActiveQuestionIdRef.current = activeQuestionId;
      const activeQ = questions.find((q) => q.id === activeQuestionId);
      if (activeQ && activeQ.page && activeQ.page <= totalPages && activeQ.page !== currentPage) {
        onPageChange(activeQ.page);
      }
    }
  }, [activeQuestionId, questions, currentPage, onPageChange, totalPages]);

  // Keyboard navigation for page flipping (ArrowLeft, ArrowRight, PageUp, PageDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentPage > 1) {
          e.preventDefault();
          onPageChange(currentPage - 1);
        }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (currentPage < totalPages) {
          e.preventDefault();
          onPageChange(currentPage + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  const currentPageImage =
    pageImages && pageImages.length > 0 && pageImages[currentPage - 1]
      ? pageImages[currentPage - 1]
      : undefined;

  // Compute question counts per page for pill indicators
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-[#343e48] relative overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 px-4 sm:px-5 bg-[#28323c] border-b border-slate-700/50 flex items-center justify-between z-20 shrink-0 text-white">
        {/* Left: Title & Quick Page Selector Pills */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[14.5px] tracking-wide text-slate-100 hidden sm:inline">
            Student Answer Sheet
          </span>

          {/* Quick Page Jump Pills */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-[#1e2730] p-1 rounded-lg border border-slate-600/40">
              {pageNumbers.map((pg) => {
                const isCurrent = pg === currentPage;
                const hasActiveQ = questions.some((q) => q.id === activeQuestionId && q.page === pg);
                return (
                  <button
                    key={pg}
                    onClick={() => onPageChange(pg)}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-green-600 text-white shadow-xs"
                        : hasActiveQ
                        ? "bg-slate-700 text-green-300 hover:bg-slate-600 hover:text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                    title={`Go to Page ${pg}`}
                  >
                    P{pg}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Controls (Zoom & Page Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center bg-[#1e2730] rounded-lg px-2 py-1 border border-slate-600/50 shadow-inner">
            <button
              onClick={handleZoomOut}
              className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span
              onClick={handleResetZoom}
              className="px-2 text-xs font-mono text-slate-200 cursor-pointer hover:text-white"
              title="Reset zoom to 100%"
            >
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center bg-[#1e2730] rounded-lg px-2 py-1 border border-slate-600/50 shadow-inner">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                currentPage <= 1
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50 cursor-pointer"
              }`}
              title="Previous page (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Page dropdown or text */}
            <select
              value={currentPage}
              onChange={(e) => onPageChange(Number(e.target.value))}
              className="bg-transparent text-xs font-medium text-slate-200 mx-1 cursor-pointer focus:outline-none focus:ring-0"
              title="Select page"
            >
              {pageNumbers.map((pg) => (
                <option key={pg} value={pg} className="bg-[#1e2730] text-white">
                  Page {pg} of {totalPages || 1}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                currentPage >= totalPages
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50 cursor-pointer"
              }`}
              title="Next page (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Answer Sheet Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-[#343e48]"
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full flex flex-col items-center py-2"
        >
          <HandwrittenCanvasPage
            pageNumber={currentPage}
            questions={questions}
            activeQuestionId={activeQuestionId}
            onSelectQuestion={onSelectQuestion}
            pageImage={currentPageImage}
          />
        </div>
      </div>

      {/* Bottom Floating Page Indicator Bar */}
      {totalPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1e2730]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-600/60 shadow-lg flex items-center gap-3 text-white z-30">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className={`p-1 rounded-full hover:bg-slate-700 transition-colors ${
              currentPage <= 1 ? "text-slate-600 cursor-not-allowed" : "text-slate-200 cursor-pointer"
            }`}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className={`p-1 rounded-full hover:bg-slate-700 transition-colors ${
              currentPage >= totalPages ? "text-slate-600 cursor-not-allowed" : "text-slate-200 cursor-pointer"
            }`}
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
