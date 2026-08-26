"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { UploadSection } from "@/components/UploadSection";
import { ExtractionLoading } from "@/components/ExtractionLoading";
import { MappingScreen } from "@/components/MappingScreen";
import { AssessmentData } from "@/lib/assessmentData";

type FlowStep = "upload" | "extracting" | "mapping";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<FlowStep>("upload");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("exams");

  // File state
  const [qpFile, setQpFile] = useState<File | null>(null);
  const [asFile, setAsFile] = useState<File | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  // Extracted pipeline state
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [answerSheetPageImages, setAnswerSheetPageImages] = useState<string[]>([]);

  // Transitions
  const handleStartExtraction = (
    uploadedQpFile: File | null,
    uploadedAsFile: File | null,
    demoMode: boolean
  ) => {
    setQpFile(uploadedQpFile);
    setAsFile(uploadedAsFile);
    setIsDemo(demoMode);
    setCurrentStep("extracting");
    setIsSidebarCollapsed(true); // Matches Figma loading state screenshot
  };

  const handleExtractionSuccess = (
    data: AssessmentData,
    pageImages: string[]
  ) => {
    setAssessmentData(data);
    setAnswerSheetPageImages(pageImages);
    setCurrentStep("mapping");
    setIsSidebarCollapsed(true); // Matches Figma mapping screenshot
  };

  const handleBackToUpload = () => {
    setCurrentStep("upload");
    setIsSidebarCollapsed(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eef0f3] p-2 md:p-3">
      {/* Outer Rounded Application Frame Container (Figma App Shell Aesthetic) */}
      <div className="flex h-full w-full rounded-[24px] overflow-hidden bg-white shadow-2xl border border-slate-200/80">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white">
          {/* Header */}
          <Header
            currentStep={currentStep}
            showBack={currentStep !== "upload"}
            onBack={handleBackToUpload}
          />

          {/* Workflow Step Views */}
          <main className="flex-1 flex flex-col overflow-y-auto relative">
            {currentStep === "upload" && (
              <UploadSection onStartMapping={handleStartExtraction} />
            )}

            {currentStep === "extracting" && (
              <ExtractionLoading
                qpFile={qpFile}
                asFile={asFile}
                isDemo={isDemo}
                onSuccess={handleExtractionSuccess}
                onCancel={handleBackToUpload}
              />
            )}

            {currentStep === "mapping" && (
              <MappingScreen
                assessmentData={assessmentData}
                answerSheetPageImages={answerSheetPageImages}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
