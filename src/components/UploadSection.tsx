"use client";

import React, { useRef, useState } from "react";
import { Upload, X, ArrowRight, FileCheck2, Sparkles } from "lucide-react";
import { TeacherIllustration } from "./TeacherIllustration";

import { getFilePageCount } from "@/lib/pdfUtils";

interface UploadedFileInfo {
  file?: File;
  name: string;
  size: string;
  pages: number;
}

interface UploadSectionProps {
  onStartMapping: (qpFile: File | null, asFile: File | null, isDemo: boolean) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onStartMapping }) => {
  const [qpInfo, setQpInfo] = useState<UploadedFileInfo | null>(null);
  const [asInfo, setAsInfo] = useState<UploadedFileInfo | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isDraggingQP, setIsDraggingQP] = useState(false);
  const [isDraggingAS, setIsDraggingAS] = useState(false);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const asInputRef = useRef<HTMLInputElement>(null);

  const handleQPUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsDemo(false);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const pages = await getFilePageCount(file);
      setQpInfo({
        file,
        name: file.name,
        size: `${sizeMB === "0.0" ? "<0.1" : sizeMB}MB`,
        pages,
      });
    }
  };

  const handleASUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsDemo(false);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const pages = await getFilePageCount(file);
      setAsInfo({
        file,
        name: file.name,
        size: `${sizeMB === "0.0" ? "<0.1" : sizeMB}MB`,
        pages,
      });
    }
  };

  const loadSampleFiles = () => {
    setIsDemo(true);
    setQpInfo({
      name: "Class_10_maths_unit_test.pdf",
      size: "2MB",
      pages: 2,
    });
    setAsInfo({
      name: "student_1_answer_sheet.pdf",
      size: "8MB",
      pages: 4,
    });
  };

  const isReady = qpInfo !== null && asInfo !== null;

  const handleStart = () => {
    if (!isReady) return;
    onStartMapping(qpInfo.file || null, asInfo.file || null, isDemo);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* Title with Highlight Banner */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight flex flex-wrap items-center justify-center gap-2.5">
          <span>Upload</span>
          <span className="relative inline-block px-3 py-1 bg-[#ffe5d9] text-[#ff5722] rounded-xl">
            Question Paper &amp; Answer Sheets
          </span>
        </h1>
        <p className="text-slate-600 text-base md:text-lg mt-3 font-normal">
          Upload both files to get started
        </p>
      </div>

      {/* Center Teacher Graphic */}
      <TeacherIllustration />

      {/* Pre-fill Sample Option Pill */}
      {(!qpInfo || !asInfo) && (
        <button
          onClick={loadSampleFiles}
          className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-xs font-semibold text-[#ff5722] transition-all hover:scale-105 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Demo: Load Sample Biology Test Files</span>
        </button>
      )}

      {/* Two Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-2">
        {/* Hidden inputs */}
        <input
          ref={qpInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleQPUpload}
          className="hidden"
        />
        <input
          ref={asInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleASUpload}
          className="hidden"
        />

        {/* Left Dropzone: Question Paper */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingQP(true);
          }}
          onDragLeave={() => setIsDraggingQP(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingQP(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              setIsDemo(false);
              const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
              const pages = await getFilePageCount(file);
              setQpInfo({
                file,
                name: file.name,
                size: `${sizeMB === "0.0" ? "<0.1" : sizeMB}MB`,
                pages,
              });
            }
          }}
          className={`relative h-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 bg-white/70 shadow-xs ${
            isDraggingQP
              ? "border-[#ff5722] bg-orange-50/50 scale-[1.01]"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          {qpInfo ? (
            /* Filled State */
            <div className="flex items-center justify-between w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3.5 overflow-hidden">
                {/* Red PDF Icon */}
                <div className="w-11 h-11 rounded-lg bg-[#ea4335] text-white flex flex-col items-center justify-center font-bold text-[10px] tracking-wider shrink-0 shadow-xs">
                  <span className="leading-tight">PDF</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-slate-800 text-[14.5px] truncate" title={qpInfo.name}>
                    {qpInfo.name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {qpInfo.size} • {qpInfo.pages} Page{qpInfo.pages === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQpInfo(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-900 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs ml-2"
                title="Remove file"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            /* Empty State */
            <div
              onClick={() => qpInputRef.current?.click()}
              className="flex flex-col items-center text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-orange-50 flex items-center justify-center text-slate-600 group-hover:text-[#ff5722] transition-colors mb-3">
                <Upload className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="font-semibold text-slate-800 text-[15.5px]">
                Upload <span className="text-[#ff5722]">Question Paper</span>
              </p>
              <span className="text-xs text-slate-400 mt-1">PDF or Images • Max 20MB</span>
            </div>
          )}
        </div>

        {/* Right Dropzone: Answer Sheet */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingAS(true);
          }}
          onDragLeave={() => setIsDraggingAS(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingAS(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              setIsDemo(false);
              const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
              const pages = await getFilePageCount(file);
              setAsInfo({
                file,
                name: file.name,
                size: `${sizeMB === "0.0" ? "<0.1" : sizeMB}MB`,
                pages,
              });
            }
          }}
          className={`relative h-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 bg-white/70 shadow-xs ${
            isDraggingAS
              ? "border-[#ff5722] bg-orange-50/50 scale-[1.01]"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          {asInfo ? (
            /* Filled State */
            <div className="flex items-center justify-between w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3.5 overflow-hidden">
                {/* Red PDF Icon */}
                <div className="w-11 h-11 rounded-lg bg-[#ea4335] text-white flex flex-col items-center justify-center font-bold text-[10px] tracking-wider shrink-0 shadow-xs">
                  <span className="leading-tight">PDF</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-slate-800 text-[14.5px] truncate" title={asInfo.name}>
                    {asInfo.name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {asInfo.size} • {asInfo.pages} Page{asInfo.pages === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAsInfo(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-900 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs ml-2"
                title="Remove file"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            /* Empty State */
            <div
              onClick={() => asInputRef.current?.click()}
              className="flex flex-col items-center text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-orange-50 flex items-center justify-center text-slate-600 group-hover:text-[#ff5722] transition-colors mb-3">
                <Upload className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="font-semibold text-slate-800 text-[15.5px]">
                Upload <span className="text-[#ff5722]">Answer Sheet</span>
              </p>
              <span className="text-xs text-slate-400 mt-1">PDF or Images • Max 20MB</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="mt-8 flex flex-col items-center text-center">
        <button
          onClick={isReady ? handleStart : undefined}
          disabled={!isReady}
          className={`flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-medium text-[15px] transition-all shadow-md ${
            isReady
              ? "bg-[#28323c] text-white hover:bg-[#1e2730] hover:scale-[1.02] cursor-pointer shadow-slate-900/10"
              : "bg-[#b0b9c2] text-white/90 cursor-not-allowed opacity-80"
          }`}
        >
          <span>Start Mapping</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <p className="text-xs text-slate-500 mt-3.5 font-normal">
          Once both files are uploaded, you&apos;ll be able to map answers with questions
        </p>
      </div>
    </div>
  );
};
