# VedaAI — AI Assessment Extraction & Answer Mapping

<div align="center">
  <h3>An intelligent, diagram-aware assessment extraction and question-answer mapping platform for modern educators.</h3>

  <p>
    <b>Next.js 16 (App Router)</b> • 
    <b>TypeScript</b> • 
    <b>Tailwind CSS</b> • 
    <b>Gemini 2.5 Flash</b> • 
    <b>Zod</b> • 
    <b>HTML5 Canvas</b>
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

5. POST /api/grade              ──> Gemini 2.5 Flash + Cropped Image Evidence ──> Grade[]
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
- **Diagram-Aware & Format-Fair Grading**: Grades diagram and mixed questions using **actual cropped images** of the answer sheet rather than unreliable text transcriptions alone.
- **Client-Side Question Paper Caching**: SHA-256 hashed cache stored in `localStorage["qp:<hash>"]` prevents redundant AI calls when grading multiple students against the same exam paper.
- **Multi-Page / Multi-Region Merging**: Student answers spanning across pages are merged into a single `MatchedItem` with multiple bounding box regions.
- **Fail Loudly & Score Integrity**: Server-side cross-checks verify that the sum of criteria marks matches the total question score; discrepancies and numbering gaps are surfaced as actionable warnings.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Gemini API Key**: Free tier API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd assignment
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Add your Gemini API Key in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

---

## 📡 API Route Specifications

All endpoints are stateless, independently callable, and accept/return JSON.

### 1. `POST /api/extract-questions`
Extracts structured questions and sub-parts from question paper page images.

* **Request Body**:
```json
{
  "pages": [
    { "page": 0, "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA..." }
  ]
}
```
* **Response (200 OK)**:
```json
{
  "questions": [
    {
      "id": "11-b",
      "rawLabel": "11 (b)",
      "number": "11",
      "subpart": "b",
      "text": "Suggest one practical measure to help Plant B recover.",
      "marks": 3,
      "page": 0,
      "orderIndex": 11,
      "expectedAnswerType": "text"
    }
  ],
  "warnings": []
}
```

---

### 2. `POST /api/generate-rubrics`
Generates consistent, structure-aware grading criteria for each question.

* **Request Body**:
```json
{
  "questions": [ /* Question[] from Step 2a */ ]
}
```
* **Response (200 OK)**:
```json
{
  "rubrics": [
    {
      "questionId": "11-b",
      "criteria": [
        { "point": "Suggests gradual light acclimatization", "marks": 2 },
        { "point": "Mentions proper hydration and stem pruning", "marks": 1 }
      ],
      "totalMarks": 3,
      "acceptableForms": "Prose, bullet points, or diagram annotations are equally valid"
    }
  ],
  "warnings": []
}
```

---

### 3. `POST /api/extract-answers`
Extracts handwritten student answers, transcriptions, and normalized 0–1000 bounding boxes.

* **Request Body**:
```json
{
  "pages": [
    { "page": 0, "imageBase64": "..." }
  ],
  "questions": [ /* Question[] for label context */ ]
}
```
* **Response (200 OK)**:
```json
{
  "answerBlocks": [
    {
      "blockId": "ans-1",
      "detectedLabel": "Q2.",
      "transcribedText": "The process mainly occurs in the chloroplast of the plant cell...",
      "regions": [
        {
          "page": 0,
          "box_2d": [435, 45, 580, 955]
        }
      ],
      "confidence": "high"
    }
  ]
}
```

---

### 4. `POST /api/reconcile`
Pure-function deterministic matching between extracted questions and student answers.

* **Request Body**:
```json
{
  "questions": [ /* Question[] */ ],
  "answerBlocks": [ /* AnswerBlock[] */ ]
}
```
* **Response (200 OK)**:
```json
{
  "mapped": [
    {
      "question": { "id": "2", "rawLabel": "2", "number": "2", "text": "..." },
      "answer": { "blockId": "ans-1", "detectedLabel": "Q2.", "regions": [ ... ] },
      "matchConfidence": "exact"
    }
  ],
  "unanswered": [],
  "unmatchedAnswers": [],
  "warnings": []
}
```

---

### 5. `POST /api/grade`
Evaluates matched pairs against rubrics using cropped visual evidence and handwritten text.

* **Request Body**:
```json
{
  "mapped": [ /* MatchedItem[] from reconcile */ ],
  "rubrics": [ /* Rubric[] */ ],
  "answerImageCrops": [
    { "blockId": "ans-1", "imageBase64": "..." }
  ]
}
```
* **Response (200 OK)**:
```json
{
  "grades": [
    {
      "questionId": "2",
      "criteriaResults": [
        { "point": "Identifies chloroplast as organelle", "met": true },
        { "point": "Mentions light and dark reaction stages", "met": true }
      ],
      "score": 2,
      "maxMarks": 2,
      "verdict": "correct",
      "feedback": "Excellent work! Correctly identified the chloroplast and described both reaction stages."
    }
  ],
  "overallFeedback": "Strong grasp of photosynthetic biology and organelle functions."
}
```

---

## 📂 Project Structure

```
assignment/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── extract-questions/route.ts   # Step 2a: Question paper extraction
│   │   │   ├── generate-rubrics/route.ts    # Step 2b: Structure-aware rubrics
│   │   │   ├── extract-answers/route.ts      # Step 3: Student answer extraction & box_2d
│   │   │   ├── reconcile/route.ts            # Step 4: Deterministic matching endpoint
│   │   │   └── grade/route.ts                # Step 5: Visual evidence-based grading
│   │   ├── globals.css                       # Design tokens, notebook paper, animations
│   │   ├── layout.tsx                        # Root layout & Google typography
│   │   └── page.tsx                          # App shell coordinating upload, extract, mapping
│   ├── components/
│   │   ├── AnswerSheetViewer.tsx             # Document viewer with zoom & page controls
│   │   ├── ExtractionLoading.tsx             # Glowing AI sparkle loading state
│   │   ├── HandwrittenCanvasPage.tsx         # Notebook canvas with diagrams & bounding boxes
│   │   ├── Header.tsx                        # Breadcrumbs & action icons
│   │   ├── MappingScreen.tsx                 # Two-pane split view coordinator
│   │   ├── QuestionCard.tsx                  # Question card with score badge & AI feedback
│   │   ├── QuestionList.tsx                  # Extracted questions accordion panel
│   │   ├── Sidebar.tsx                       # Collapsible navigation & AI toolkit
│   │   ├── TeacherIllustration.tsx           # Orbiting illustration graphic
│   │   └── UploadSection.tsx                 # Dual dropzone upload screen
│   └── lib/
│       ├── assessmentData.ts                 # Full Class 10 Biology assessment dataset
│       ├── client.ts                         # Gemini SDK client with retry backoff
│       ├── crop.ts                           # Canvas-based bounding box image cropping
│       ├── prompts.ts                        # Centralized prompt templates
│       ├── reconcile.ts                      # Pure deterministic reconciliation logic
│       └── types.ts                          # Comprehensive shared TypeScript interfaces
├── public/                                   # Static assets
├── .env.example                              # Environment configuration template
├── package.json                              # Project dependencies & scripts
├── tsconfig.json                             # TypeScript compiler configuration
└── README.md                                 # Complete documentation
```

---

## 🛡️ License

Private project created for the VedaAI assessment. All rights reserved.
