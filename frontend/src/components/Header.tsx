"use client";

import React from "react";
import { ArrowLeft, ClipboardList, HelpCircle, Bell, Sparkles } from "lucide-react";

interface HeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  currentStep?: "upload" | "extracting" | "mapping";
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  showBack = true,
  currentStep = "upload",
}) => {
  return (
    <header className="h-16 px-6 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left side: Breadcrumb / Back button */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        <div className="flex items-center gap-2 text-slate-700">
          <ClipboardList className="w-5 h-5 text-slate-500" />
          <span className="font-medium text-[15px] text-slate-800">
            {currentStep === "mapping" ? "Exams / Question - Answer Mapping" : "Exams"}
          </span>
        </div>
      </div>

      {/* Right side: Action icons */}
      <div className="flex items-center gap-2.5">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>

        <button
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[1.8]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff5722] ring-2 ring-white" />
        </button>

        <button
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#ff5722] hover:bg-orange-50 transition-colors"
          title="AI Assistant"
        >
          <Sparkles className="w-5 h-5 fill-orange-100 stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
};
