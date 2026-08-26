# VedaAI

An intelligent assessment extraction and question-answer mapping platform.

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS
- **Backend**: Express, Node.js
- **AI Models**: Gemini 3.1 Flash Lite, Groq
- **Core**: TypeScript, Zod

## Overview
VedaAI automates scanning, extracting, mapping, and grading printed exam papers and handwritten student answer sheets. It uses an interactive frontend with an AI backend pipeline for structure-aware rubric generation, OCR bounding-box extraction, and image-based grading.

## Getting Started

### Prerequisites
- Node.js (v18.0.0+)
- npm (v9.0.0+)
- Gemini API Key
- Groq API Key

### Installation

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd assignment

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

2. Environment Setup

**Backend** (`backend/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
GROQ_API_KEY=your_groq_api_key_here
GROQ_GRADE_MODEL=qwen/qwen3.8-27b
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. Run Development Servers

**Backend**:
```bash
cd backend
npm run dev
# Runs on http://localhost:8080
```

**Frontend**:
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## API Routes

- `POST /api/extract-questions`: Extracts questions from question paper pages.
- `POST /api/generate-rubrics`: Generates grading criteria for questions.
- `POST /api/extract-answers`: Extracts handwritten student answers and bounding boxes.
- `POST /api/reconcile`: Deterministic matching between questions and answers.
- `POST /api/grade`: Evaluates matched pairs against rubrics using Groq vision models.

## Project Structure

```text
assignment/
├── frontend/
│   ├── src/app/          # Next.js App Router
│   ├── src/components/   # React UI components
│   └── src/lib/          # Frontend utilities
└── backend/
    ├── src/routes/       # Express API routes
    ├── src/lib/          # Shared AI prompts and clients
    └── src/server.ts     # Express server entry point
```

## License
Private project created for the VedaAI assessment.
