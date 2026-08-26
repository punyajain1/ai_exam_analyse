# VedaAI — AI Assessment Extraction & Answer Mapping

<div align="center">
  <h3>An intelligent, diagram-aware assessment extraction and question-answer mapping platform for modern educators.</h3>

  <p>
    <b>Next.js 16 (Frontend)</b> • 
    <b>Express & Node.js (Backend)</b> • 
    <b>TypeScript</b> • 
    <b>Tailwind CSS</b> • 
    <b>Gemini 2.5 Flash</b> • 
    <b>Groq</b> • 
    <b>Zod</b>
  </p>
</div>

---

## 📖 Overview

**VedaAI** automates the labor-intensive workflow of scanning, extracting, mapping, and grading printed exam papers and handwritten student answer sheets. It pairs a **pixel-perfect split-screen interactive frontend** with a **deterministic AI backend pipeline** that performs structure-aware rubric generation, OCR bounding-box extraction, pure-function reconciliation, and image-based grading.

```
0. Client checks localStorage cache (SHA-256 hash of Question Paper)
   └─ Hit  ──> Skip to Step 3 for any new student answer sheet
   └─ Miss ──> Run Step 2 (Extract Questions & Generate Rubrics), then cache

1. Client prepares rasterized page images (PNG base64)

2. POST /api/extract-questions  ──> Gemini 2.5 Flash ──> Validated Question[]
   POST /api/generate-rubrics   ──> Gemini 2.5 Flash ──> Structure-Aware Rubric[]

3. POST /api/extract-answers    ──> Gemini 2.5 Flash ──> AnswerBlock[] with box_2d

4. reconcile()                   ──> Pure Function (No AI) ──> ReconcileResult
   (Exact + Fuzzy matching, Multi-region merging, Unanswered/Unmatched tracking)

5. POST /api/grade              ──> Groq + Cropped Image Evidence ──> Grade[]
```

---

## ✨ Key Features

### 🖥️ 1. Modern Interactive UI (Figma Aligned)
- **Dual Dropzone Upload Screen**: Supports drag-and-drop or 1-click **Quick Demo** sample test loading (`Class_10_maths_unit_test.pdf` and `student_1_answer_sheet.pdf`).
- **AI Extraction State**: Multi-star glowing orange AI sparkle animation with progressive step status indicators.
- **Split-Screen Question-Answer Mapping**:
  - **Left Pane (Extracted Questions)**: Interactive question cards, score pills (`2/2`, `4/5`, `0/2`), sub-part badges (`11 a.`, `11 b.`), and collapsible **AI Feedback** cards.
  - **Right Pane (Handwritten Canvas Viewer)**: Realistic ruled notebook paper texture, fountain pen handwriting, balanced chemical formulas (`6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂`), biology diagrams, and interactive AI bounding boxes (`Q1`, `Q2`, `Q3`, etc.).
  - **Bi-directional Sync**: Clicking any question card scrolls the answer sheet and highlights its bounding box; clicking bounding boxes on the sheet selects and expands the corresponding question.
  - **Document Controls**: Multi-page navigation (`Page 1 of 4`), zoom controls (`− 100% +`), and responsive mobile mode with segmented tabs.

### ⚙️ 2. Robust Backend Pipeline
- **Zero Hallucination Matching**: Reconciliation uses a pure mathematical and string-normalization algorithm (`normalizeLabel`, Levenshtein distance, disambiguation thresholds). AI is never used for reconciliation.
- **Diagram-Aware & Format-Fair Grading**: Grades diagram and mixed questions using **actual cropped images** of the answer sheet via Groq vision models rather than unreliable text transcriptions alone.
- **Client-Side Question Paper Caching**: SHA-256 hashed cache stored in `localStorage["qp:<hash>"]` prevents redundant AI calls when grading multiple students against the same exam paper.
- **Multi-Page / Multi-Region Merging**: Student answers spanning across pages are merged into a single `MatchedItem` with multiple bounding box regions.
- **Fail Loudly & Score Integrity**: Server-side cross-checks verify that the sum of criteria marks matches the total question score; discrepancies and numbering gaps are surfaced as actionable warnings.

---

## 🚀 Getting Started

The project is separated into a Next.js `frontend` and an Express `backend`.

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Gemini API Key**: Free tier API key from [Google AI Studio](https://aistudio.google.com/)
- **Groq API Key**: Free tier API key from [Groq Console](https://console.groq.com/)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd assignment

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
# Gemini API Key (Extraction & Rubrics)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Groq API Key (Grading)
GROQ_API_KEY=your_groq_api_key_here
GROQ_GRADE_MODEL=qwen/qwen3.8-27b
```

**Frontend** (`frontend/.env.local`):
```env
# Point to your local Express backend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Run Development Servers

You will need two terminal tabs.

**Tab 1: Backend**
```bash
cd backend
npm run dev
# Server runs on http://localhost:8080
```

**Tab 2: Frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

---

## 📡 API Route Specifications

All backend endpoints are stateless, independently callable, and accept/return JSON.

### 1. `POST /api/extract-questions`
Extracts structured questions and sub-parts from question paper page images using Gemini.

### 2. `POST /api/generate-rubrics`
Generates consistent, structure-aware grading criteria for each question using Gemini.

### 3. `POST /api/extract-answers`
Extracts handwritten student answers, transcriptions, and normalized 0–1000 bounding boxes using Gemini.

### 4. `POST /api/reconcile`
Pure-function deterministic matching between extracted questions and student answers.

### 5. `POST /api/grade`
Evaluates matched pairs against rubrics using cropped visual evidence and handwritten text using Groq.

---

## 📂 Project Structure

```
assignment/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router (UI & Layouts)
│   │   ├── components/             # React UI components (Upload, Mapping, Viewers)
│   │   └── lib/                    # Frontend utilities (pipeline, pdf processing)
│   ├── public/                     # Static assets
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/                 # Express API routes (extract, grade, etc.)
│   │   ├── lib/                    # Shared AI prompts, Gemini/Groq clients, logic
│   │   └── server.ts               # Express server entry point
│   └── package.json
│
└── README.md
```

---

## 🛡️ License

Private project created for the VedaAI assessment. All rights reserved.
