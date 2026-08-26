"use client";

import React from "react";
import { QuestionItem } from "@/lib/assessmentData";

interface HandwrittenCanvasPageProps {
  pageNumber: number;
  questions: QuestionItem[];
  activeQuestionId: string;
  onSelectQuestion: (question: QuestionItem) => void;
  pageImage?: string;
}

export const HandwrittenCanvasPage: React.FC<HandwrittenCanvasPageProps> = ({
  pageNumber,
  questions,
  activeQuestionId,
  onSelectQuestion,
  pageImage,
}) => {
  const pageQuestions = questions.filter((q) => q.page === pageNumber);

  return (
    <div className="relative w-full max-w-[760px] min-h-[980px] bg-[#fbfbf8] rounded-xl shadow-lg border border-slate-300/80 overflow-hidden font-handwriting text-[#162044] select-none text-lg">
      {pageImage ? (
        /* Real Uploaded Document Image View */
        <div className="relative w-full h-full flex flex-col items-center justify-start bg-white">
          <img
            src={pageImage}
            alt={`Answer Sheet Page ${pageNumber}`}
            className="w-full h-auto object-contain block pointer-events-none select-none"
          />
        </div>
      ) : (
        /* Fallback Demo Mode (Notebook Ruled Paper with SVG Drawings) */
        <>
          {/* Notebook Ruled Background Layer */}
          <div className="absolute inset-0 notebook-paper pointer-events-none opacity-90" />

          {/* SVG Background Diagrams & Handwritten Artwork */}
          <div className="relative z-10 p-8 pl-18 space-y-6">
            {pageNumber === 1 && (
              <div className="space-y-6">
                {/* Q1 Response */}
                <div className="relative">
                  <p className="text-[21px] leading-[32px] text-[#1a2550] font-bold">
                    <span className="text-[#0f172a] mr-2">Q1.</span>
                    Photosynthesis is the process used by green plants and some other organisms to convert light energy into chemical energy.
                  </p>

                  {/* Chemical Equation Box */}
                  <div className="my-3 border-2 border-[#1a2550] rounded-md p-2 text-center text-[22px] font-bold tracking-wide w-fit mx-auto px-6 bg-white/40">
                    <span>6CO₂ + 6H₂O</span>
                    <span className="mx-3 inline-flex flex-col items-center justify-center text-sm font-normal -translate-y-1">
                      <span>Light</span>
                      <span className="w-16 h-[1.5px] bg-[#1a2550]"></span>
                      <span>Chlorophyll</span>
                    </span>
                    <span>C₆H₁₂O₆ + 6O₂</span>
                  </div>

                  {/* Plant Diagram Sketch */}
                  <div className="my-2 flex items-center justify-center">
                    <svg viewBox="0 0 340 180" className="w-[300px] h-[160px] stroke-[#1a2550] fill-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="170" cy="24" r="12" fill="#FEF08A" stroke="#1a2550" />
                      <path d="M170 6 L170 0 M170 42 L170 48 M152 24 L146 24 M188 24 L194 24 M157 11 L151 5 M183 37 L189 43 M157 37 L151 43 M183 11 L189 5" />
                      <text x="192" y="28" stroke="none" fill="#1a2550" className="font-handwriting text-base font-bold">Sunlight</text>
                      <path d="M170 50 Q168 95 170 140" strokeWidth="2.5" />
                      <path d="M170 85 C140 70 125 90 140 105 C155 120 170 95 170 95 Z" fill="#DCFCE7" />
                      <path d="M140 105 Q155 95 170 85" strokeWidth="1.2" />
                      <path d="M170 75 C200 60 215 80 200 95 C185 110 170 85 170 85 Z" fill="#DCFCE7" />
                      <path d="M200 95 Q185 85 170 75" strokeWidth="1.2" />
                      <path d="M170 140 Q155 160 145 175 M170 140 Q175 165 170 180 M170 140 Q185 160 195 175 M160 150 Q150 160 140 165 M180 150 Q190 160 200 165" />
                      <line x1="120" y1="140" x2="220" y2="140" strokeDasharray="3 3" />
                      <text x="205" y="165" stroke="none" fill="#1a2550" className="font-handwriting text-sm">Water</text>
                      <path d="M110 95 L135 95" />
                      <text x="50" y="90" stroke="none" fill="#1a2550" className="font-handwriting text-sm font-bold">Carbon dioxide</text>
                      <path d="M205 85 L235 85" />
                      <text x="242" y="88" stroke="none" fill="#1a2550" className="font-handwriting text-sm font-bold">Oxygen</text>
                    </svg>
                  </div>
                </div>

                {/* Q2 Response */}
                <div className="relative pt-2">
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q2.</span>
                    The process mainly occurs in the <span className="font-bold underline decoration-green-600/40">chloroplast</span> of the plant cell. It has two main stages:
                  </p>
                  <div className="pl-6 space-y-1 text-[20px] text-[#1a2550] leading-[32px]">
                    <p>1. Light reaction – Captures light energy.</p>
                    <p>2. Dark reaction – Uses energy to make glucose.</p>
                  </div>
                </div>

                {/* Q4 Response */}
                <div className="relative pt-4">
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q4.</span>
                    Flow of blood: Blood enters Right Atrium from Vena Cava, moves into Right Ventricle, then goes to lungs through Pulmonary Artery. Oxygenated blood enters Left Atrium, then Left Ventricle and pumped into Aorta.
                  </p>
                </div>
              </div>
            )}

            {pageNumber === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q5.</span>
                    Labelled diagram of Alveolus showing capillary gas exchange:
                  </p>
                  <div className="my-3 flex items-center justify-center">
                    <svg viewBox="0 0 320 160" className="w-[300px] h-[150px] stroke-[#1a2550] fill-none" strokeWidth="1.8">
                      <circle cx="120" cy="80" r="45" fill="#FFE4E6" />
                      <text x="80" y="85" stroke="none" fill="#1a2550" className="font-handwriting text-sm font-bold">Alveolar Sac</text>
                      <path d="M50 40 C90 20 150 20 190 40 C210 60 210 100 190 120 C150 140 90 140 50 120" stroke="#DC2626" strokeWidth="3" fill="none" />
                      <text x="200" y="70" stroke="none" fill="#DC2626" className="font-handwriting text-sm font-bold">Capillary</text>
                      <path d="M130 60 L160 45" stroke="#2563EB" strokeWidth="2" />
                      <text x="140" y="40" stroke="none" fill="#2563EB" className="font-handwriting text-xs">O₂ in</text>
                      <path d="M160 115 L130 100" stroke="#DC2626" strokeWidth="2" />
                      <text x="140" y="125" stroke="none" fill="#DC2626" className="font-handwriting text-xs">CO₂ out</text>
                    </svg>
                  </div>
                </div>

                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q6.</span>
                    Human Digestive System Diagram:
                  </p>
                  <div className="my-2 pl-4 space-y-1 text-[19px] leading-[30px]">
                    <p>• Stomach: Stores food and secretes HCl + Pepsin.</p>
                    <p>• Liver: Secretes bile to emulsify fats.</p>
                    <p>• Pancreas: Produces pancreatic juice (Trypsin, Amylase, Lipase).</p>
                    <p>• <span className="font-bold underline decoration-orange-500">Small Intestine</span>: Site of maximum absorption via villi.</p>
                    <p>• Large Intestine: Absorbs residual water from unabsorbed food.</p>
                  </div>
                </div>
              </div>
            )}

            {pageNumber === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q7.</span>
                    Nephron Structure:
                  </p>
                  <div className="my-2 pl-4 text-[19px] leading-[30px]">
                    <p>1. <span className="font-bold">Bowman&apos;s capsule &amp; Glomerulus</span>: Ultrafiltration of nitrogenous waste.</p>
                    <p>2. <span className="font-bold">PCT</span>: Selective reabsorption of glucose, amino acids, and salts.</p>
                    <p>3. <span className="font-bold">Loop of Henle</span>: Water reabsorption and urine concentration.</p>
                    <p>4. <span className="font-bold">Collecting Duct</span>: Final urine collection leading to ureter.</p>
                  </div>
                </div>

                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q8.</span>
                    Palisade cells are elongated and tightly packed with abundant chloroplasts on the upper surface for maximum sunlight capture. Spongy mesophyll cells are loosely arranged with large intercellular air spaces for efficient gas exchange.
                  </p>
                </div>

                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q9.</span>
                    Transpiration is the evaporative loss of water from the stomata of plant leaves. It creates suction pull for xylem sap ascent and helps in thermal regulation. Factors increasing rate: High temperature and strong wind.
                  </p>
                </div>
              </div>
            )}

            {pageNumber === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q10.</span>
                    Xylem vessels are made of dead cells with thick, lignified walls. Lignin provides immense mechanical support and prevents vessel collapse under negative hydrostatic pressure during transpiration pull.
                  </p>
                </div>

                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q11 a.</span>
                    Plant B underwent etiolation due to light deprivation. In the dark, elongation hormones cause elongated stems while chlorophyll synthesis is suppressed.
                  </p>
                  <p className="text-[21px] leading-[32px] text-[#1a2550] mt-2">
                    <span className="text-[#0f172a] font-bold mr-2">Q11 b.</span>
                    Gradually reintroduce Plant B to moderate indirect sunlight, avoid sudden sunburn, and ensure adequate watering.
                  </p>
                </div>

                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q12.</span>
                    Total Pulmonary Ventilation = Tidal Volume × Respiratory Rate
                    <br />
                    = 0.5 L × 12 breaths/min = <span className="font-bold underline">6.0 L / minute</span>
                  </p>
                </div>

                <div>
                  <p className="text-[21px] leading-[32px] text-[#1a2550]">
                    <span className="text-[#0f172a] font-bold mr-2">Q13.</span>
                    Alveolar Ventilation = (Tidal Volume − Dead Space) × Respiratory Rate
                    <br />
                    = (0.50 L − 0.15 L) × 12 = 0.35 L × 12 = <span className="font-bold underline">4.2 L / minute</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Interactive AI Bounding Box Overlays */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {pageQuestions.map((q) => {
          const isActive = q.id === activeQuestionId;
          const isUncertain = q.groundingUncertain;
          const box = q.boundingBox;
          if (!box || box.width <= 0 || box.height <= 0) return null;

          return (
            <div
              key={q.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectQuestion(q);
              }}
              style={{
                top: `${box.y}%`,
                left: `${box.x}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
              className={`absolute rounded-xl transition-all duration-200 pointer-events-auto cursor-pointer flex flex-col justify-start ${
                isUncertain
                  ? isActive
                    ? "border-2 border-dashed border-amber-500 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-sm"
                    : "border-2 border-dashed border-amber-500/80 bg-amber-500/10 hover:border-amber-500 hover:bg-amber-500/15"
                  : isActive
                  ? "border-2 border-[#16a34a] bg-green-500/15 ring-2 ring-green-400/40 shadow-sm"
                  : "border border-green-500/40 hover:border-green-500 hover:bg-green-500/10 bg-transparent"
              }`}
            >
              {/* Question Tag Label Badge (e.g. Q1, Q2) */}
              <div className="absolute -top-3.5 left-2.5 flex items-center gap-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide transition-all shadow-xs ${
                    isUncertain
                      ? "bg-amber-600 text-white ring-1 ring-white"
                      : isActive
                      ? "bg-[#16a34a] text-white ring-2 ring-white scale-105"
                      : "bg-slate-700/80 text-white hover:bg-[#16a34a]"
                  }`}
                >
                  {box.label || `Q${q.number}`}
                  {isUncertain && " • Location uncertain"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
