"use client";

import React from "react";
import { ArrowLeft, ClipboardList, HelpCircle, Bell, Sparkles, Menu } from "lucide-react";

interface HeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  currentStep?: "upload" | "extracting" | "mapping";
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  showBack = true,
  currentStep = "upload",
  onToggleSidebar,
}) => {
  return (
    <header className="h-16 px-4 md:px-6 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left side: Mobile Brand / Desktop Breadcrumb / Back button */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Mobile Brand Logo */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1e293b] flex items-center justify-center text-white shadow-sm shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4h4.5l3.5 11 3.5-11H20L13.8 20h-3.6L4 4z" />
            </svg>
          </div>
          <span className="font-bold text-[18px] text-[#0f172a] tracking-tight">
            Veda<span className="text-[#ff5722]">AI</span>
          </span>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-slate-700">
          <ClipboardList className="w-5 h-5 text-slate-500" />
          <span className="font-medium text-[15px] text-slate-800">
            {currentStep === "mapping" ? "Exams / Question - Answer Mapping" : "Exams"}
          </span>
        </div>
      </div>

      {/* Right side: Action icons */}
      <div className="flex items-center gap-2 md:gap-2.5">
        <button
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>

        <button
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-[#ff5722]" />
        </button>

        <button
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-[#ff5722] hover:bg-orange-50 transition-colors"
          title="AI Assistant"
        >
          <Sparkles className="w-5 h-5 fill-orange-100 stroke-[1.8]" />
        </button>

        {/* User Avatar (Mobile) */}
        <div className="md:hidden w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 ml-1">
          <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>

        {/* Hamburger Menu (Mobile) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 ml-1"
            title="Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}
      </div>
    </header>
  );
};
