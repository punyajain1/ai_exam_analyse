"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sparkles, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { runAssessmentPipeline } from "@/lib/pipeline";
import { sampleAssessment, AssessmentData } from "@/lib/assessmentData";

interface ExtractionLoadingProps {
  qpFile: File | null;
  asFile: File | null;
  isDemo: boolean;
  onSuccess: (data: AssessmentData, answerSheetPages: string[]) => void;
  onCancel: () => void;
}

export const ExtractionLoading: React.FC<ExtractionLoadingProps> = ({
  qpFile,
  asFile,
  isDemo,
  onSuccess,
  onCancel,
}) => {
  const [currentMessage, setCurrentMessage] = useState("Initializing AI assessment pipeline...");
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [totalSteps, setTotalSteps] = useState(6);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const hasStartedRef = useRef(false);

  const runPipeline = async () => {
    setErrorMessage(null);
    setIsRetrying(false);

    if (isDemo || !qpFile || !asFile) {
      // Demo mode fallback with realistic progressive steps
      const demoSteps = [
        "Analyzing question paper layout...",
        "Extracting questions & generating rubrics...",
        "OCR handwritten student answers...",
        "Mapping questions to student responses...",
        "Generating AI feedback & grading...",
      ];

      for (let i = 0; i < demoSteps.length; i++) {
        setCurrentMessage(demoSteps[i]);
        setCurrentStepIndex(i + 1);
        setTotalSteps(demoSteps.length);
        await new Promise((r) => setTimeout(r, 600));
      }

      onSuccess(sampleAssessment, []);
      return;
    }

    try {
      const result = await runAssessmentPipeline(qpFile, asFile, (progress) => {
        setCurrentMessage(progress.message);
        setCurrentStepIndex(progress.step);
        setTotalSteps(progress.totalSteps);
      });

      onSuccess(result.assessmentData, result.answerSheetPageImages);
    } catch (err) {
      console.error("Pipeline extraction error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during extraction.";
      setErrorMessage(msg);
    }
  };

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      runPipeline();
    }
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    runPipeline();
  };

  const progressPercent = Math.min(100, Math.round((currentStepIndex / totalSteps) * 100));

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[520px] w-full px-4 py-12 animate-in fade-in duration-300">
      {errorMessage ? (
        /* Error Card State */
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 stroke-[2]" />
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">Extraction Failed</h3>
          <p className="text-sm text-slate-600 mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3 text-left font-mono text-xs overflow-auto max-h-36">
            {errorMessage}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </button>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ff5722] hover:bg-[#f44336] text-white text-sm font-semibold shadow-md transition-all hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry Extraction</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Glowing Loading State */
        <div className="flex flex-col items-center max-w-lg w-full text-center">
          {/* Glowing AI Sparkle Cluster */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-2xl animate-pulse" />

            <div className="relative animate-ai-sparkle">
              <svg
                width="110"
                height="110"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_10px_20px_rgba(255,87,34,0.35)]"
              >
                <defs>
                  <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF7A45" />
                    <stop offset="50%" stopColor="#FF5722" />
                    <stop offset="100%" stopColor="#EA4335" />
                  </linearGradient>
                </defs>
                <path
                  d="M66 22 C66 40 76 50 94 50 C76 50 66 60 66 78 C66 60 56 50 38 50 C56 50 66 40 66 22 Z"
                  fill="url(#sparkleGrad)"
                />
                <path
                  d="M44 64 C44 74 49 80 59 80 C49 80 44 86 44 96 C44 86 39 80 29 80 C39 80 44 74 44 64 Z"
                  fill="url(#sparkleGrad)"
                />
                <circle cx="28" cy="46" r="4.5" fill="#FF7A45" />
                <path
                  d="M84 76 C84 80 86 82 90 82 C86 82 84 84 84 88 C84 84 82 82 78 82 C82 82 84 80 84 76 Z"
                  fill="#FF7A45"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold md:font-extrabold text-[#1a1a1a] md:text-[#1e293b] tracking-tight mb-2">
            <span className="md:hidden">Extracting...</span>
            <span className="hidden md:inline">Extracting &amp; Mapping Assessment...</span>
          </h2>
          <p className="text-[#a3a3a3] md:text-slate-500 text-[15px] md:text-base font-medium md:font-normal mb-5">
            <span className="md:hidden">This may take a while</span>
            <span className="hidden md:inline">Processing files with Gemini 3.1 Flash Lite Vision</span>
          </p>

          {/* Progress Bar (Desktop only) */}
          <div className="hidden md:block w-full max-w-md bg-slate-200/80 rounded-full h-2.5 overflow-hidden mb-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-orange-400 to-[#ff5722] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Pill (Desktop only) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200/60 text-xs text-[#ff5722] font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>
              Step {currentStepIndex}/{totalSteps}: {currentMessage}
            </span>
          </div>

          {/* Quick skip for demo */}
          {isDemo && (
            <button
              onClick={() => onSuccess(sampleAssessment, [])}
              className="mt-6 text-xs text-slate-400 hover:text-slate-700 underline font-medium transition-colors"
            >
              Skip demo animation &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
};
