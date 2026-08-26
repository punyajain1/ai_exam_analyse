"use client";

import React from "react";
import { Clock, CloudUpload, Settings, FileText } from "lucide-react";

export const TeacherIllustration: React.FC = () => {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center select-none my-2">
      {/* Outer concentric pulsing rings */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-200/40 via-orange-100/30 to-amber-100/40 animate-pulse" />
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-orange-200/60 to-orange-100/40 border border-orange-200/50" />
      <div className="absolute inset-6 rounded-full bg-[#fde9df] shadow-inner" />

      {/* Floating Orbiting Badges */}
      {/* Top right - Clock badge */}
      <div className="absolute top-2 right-8 w-6 h-6 rounded-full bg-[#ff7a45] text-white flex items-center justify-center shadow-md shadow-orange-500/20 transform hover:scale-110 transition-transform">
        <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* Left - Document badge */}
      <div className="absolute top-12 left-4 w-6 h-6 rounded-full bg-[#ff7a45] text-white flex items-center justify-center shadow-md shadow-orange-500/20 transform hover:scale-110 transition-transform">
        <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* Right - Cloud badge */}
      <div className="absolute bottom-10 right-4 w-6 h-6 rounded-full bg-[#ff7a45] text-white flex items-center justify-center shadow-md shadow-orange-500/20 transform hover:scale-110 transition-transform">
        <CloudUpload className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* Bottom - Gear badge */}
      <div className="absolute bottom-3 left-10 w-6 h-6 rounded-full bg-[#ff7a45] text-white flex items-center justify-center shadow-md shadow-orange-500/20 transform hover:scale-110 transition-transform">
        <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* Center 3D-Style Illustrated Teacher Avatar */}
      <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gradient-to-b from-slate-100 to-amber-50 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Background backdrop */}
          <circle cx="60" cy="60" r="58" fill="#FFF7ED" />
          
          {/* Hair back */}
          <path d="M30 65 C25 40 38 18 60 18 C82 18 95 40 90 65 C85 80 82 92 82 92 L38 92 C38 92 35 80 30 65 Z" fill="#1E293B" />
          
          {/* Body / Suit */}
          <path d="M32 105 C34 85 45 80 60 80 C75 80 86 85 88 105 Z" fill="#0F172A" />
          {/* White shirt inner collar */}
          <path d="M50 80 L60 92 L70 80 Z" fill="#FFFFFF" />
          
          {/* Neck */}
          <rect x="53" y="66" width="14" height="18" rx="4" fill="#FBBF24" opacity="0.4" />
          
          {/* Head */}
          <ellipse cx="60" cy="54" rx="20" ry="24" fill="#FED7AA" />
          
          {/* Hair front / bangs */}
          <path d="M38 46 C45 32 60 30 78 36 C82 42 82 50 82 50 C80 40 70 36 60 36 C48 36 42 42 38 46 Z" fill="#0F172A" />
          
          {/* Glasses */}
          <rect x="44" y="48" width="13" height="9" rx="3" fill="none" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="63" y="48" width="13" height="9" rx="3" fill="none" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="57" y1="52" x2="63" y2="52" stroke="#0F172A" strokeWidth="2" />
          
          {/* Eyes */}
          <circle cx="50.5" cy="52.5" r="2" fill="#0F172A" />
          <circle cx="69.5" cy="52.5" r="2" fill="#0F172A" />
          
          {/* Smile */}
          <path d="M54 65 Q60 70 66 65" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
          
          {/* Tablet / Folder in hands */}
          <path d="M46 92 L74 92 L72 108 L48 108 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="52" y1="97" x2="68" y2="97" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="52" y1="102" x2="64" y2="102" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
