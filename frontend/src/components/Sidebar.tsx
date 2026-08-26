"use client";

import React from "react";
import {
  LayoutGrid,
  Tv,
  FileText,
  ClipboardList,
  PieChart,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTab = "exams",
  onSelectTab,
}) => {
  const navItems = [
    { id: "home", label: "Home", icon: LayoutGrid },
    { id: "classroom", label: "My Classroom", icon: Tv },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "exams", label: "Exams", icon: ClipboardList },
    { id: "library", label: "My Library", icon: PieChart },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm"
          onClick={onToggleCollapse}
        />
      )}
      <aside
        className={`absolute md:relative bg-white border-r border-[#e2e8f0] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none z-50 h-full ${
          isCollapsed 
            ? "-translate-x-full md:translate-x-0 md:w-[74px] px-3 py-5" 
            : "translate-x-0 w-[240px] px-4 py-5 shadow-2xl md:shadow-none"
        }`}
      >
      {/* Top section: Logo & Toolkit */}
      <div className="flex flex-col gap-5">
        {/* Brand Logo & Collapse Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Custom VedaAI Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#1e293b] flex items-center justify-center text-white shadow-sm shrink-0 font-bold text-lg tracking-wider">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h4.5l3.5 11 3.5-11H20L13.8 20h-3.6L4 4z" />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-[20px] text-[#0f172a] tracking-tight">
                Veda<span className="text-[#ff5722]">AI</span>
              </span>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* AI Teacher's Toolkit Pill Button */}
        <div className="w-full">
          <button
            className={`w-full flex items-center justify-center gap-2 rounded-full bg-[#1e293b] text-white py-2.5 px-3 transition-all duration-200 shadow-sm border border-orange-500/30 hover:border-orange-500 hover:shadow-orange-500/20 hover:shadow-md group ${
              isCollapsed ? "px-0" : ""
            }`}
            title="AI Teacher's Toolkit"
          >
            <Sparkles className="w-4 h-4 text-[#ff7a45] animate-pulse shrink-0" />
            {!isCollapsed && (
              <span className="text-[13.5px] font-medium tracking-wide whitespace-nowrap text-slate-100">
                AI Teacher&apos;s Toolkit
              </span>
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab?.(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  isActive
                    ? "bg-[#f1f5f9] text-[#0f172a] shadow-xs"
                    : "text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-[#0f172a] stroke-[2.2]" : "text-[#64748b] stroke-[1.8]"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Collapse expand arrow */}
      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
        <button
          onClick={onToggleCollapse}
          className={`flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors w-full`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
    </>
  );
};
