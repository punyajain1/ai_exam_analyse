/**
 * Shared types for the Question-Answer Mapping backend pipeline
 */

export type AnswerType = 'text' | 'diagram' | 'mixed';

export interface Question {
  id: string;                // stable id, e.g. "11-b" (derived from number+subpart)
  rawLabel: string;          // exact printed text, e.g. "11 (b)"
  number: string;            // "11"
  subpart?: string;          // "b" — absent if no sub-part
  text: string;              // question text as printed
  marks?: number;            // if visible on the paper
  page: number;              // page index (0-based) in the question paper
  orderIndex: number;        // printed order, 0-based, strictly increasing
  expectedAnswerType: AnswerType;
}

export interface RubricCriterion {
  point: string;             // e.g. "Names both light and dark reactions"
                             // for diagram/mixed: e.g. "Correct labels: Bowman's capsule, glomerulus, tubules"
  marks: number;
}

export interface Rubric {
  questionId: string;
  criteria: RubricCriterion[];
  totalMarks: number;
  acceptableForms: string;   // free-text note, e.g. "May be shown as prose, bullets, or a labelled diagram"
}

export interface AnswerRegion {
  page: number;              // page index (0-based) in the answer sheet
  box_2d: [number, number, number, number]; // [ymin,xmin,ymax,xmax] normalized 0-1000, per Gemini convention
}

export interface AnswerBlock {
  blockId: string;                    // generated, e.g. "ans-0", "ans-1"
  detectedLabel: string | null;       // whatever label text Gemini found near/in the answer, verbatim, or null
  transcribedText: string;
  regions: AnswerRegion[];            // >1 region = spans multiple pages/areas
  confidence: 'high' | 'medium' | 'low';
  groundingUncertain?: boolean;       // true if bounding box crop failed blank/ink density check
}

export interface MatchedItem {
  question: Question;
  answer: AnswerBlock;
  matchConfidence: 'exact' | 'fuzzy';
}

export interface CriterionResult {
  point: string;
  met: boolean;
}

export interface Grade {
  questionId: string;
  criteriaResults: CriterionResult[];
  score: number;
  maxMarks: number;
  verdict: 'correct' | 'partial' | 'incorrect';
  feedback: string;
}

export interface ReconcileResult {
  mapped: MatchedItem[];
  unanswered: Question[];             // questions with no matched answer block
  unmatchedAnswers: AnswerBlock[];    // answer blocks that matched nothing
  warnings: string[];                 // e.g. "question numbering skips from 9 to 11"
}

export interface PipelineResult {
  questions: Question[];
  rubrics: Rubric[];
  answerBlocks: AnswerBlock[];
  reconciliation: ReconcileResult;
  grades: Grade[];
  overallFeedback: string;
}

// API request/response types

export interface PageImage {
  page: number;
  imageBase64: string;
}

export interface ExtractQuestionsRequest {
  pages: PageImage[];
}

export interface ExtractQuestionsResponse {
  questions: Question[];
  warnings: string[];
}

export interface GenerateRubricsRequest {
  questions: Question[];
}

export interface GenerateRubricsResponse {
  rubrics: Rubric[];
  warnings: string[];
}

export interface ExtractAnswersRequest {
  pages: PageImage[];
  questions: Question[];
}

export interface ExtractAnswersResponse {
  answerBlocks: AnswerBlock[];
}

export interface ReconcileRequest {
  questions: Question[];
  answerBlocks: AnswerBlock[];
}

export interface ReconcileResponse extends ReconcileResult {}

export interface AnswerImageCrop {
  blockId: string;
  imageBase64: string;
}

export interface GradeRequest {
  mapped: MatchedItem[];
  rubrics: Rubric[];
  answerImageCrops: AnswerImageCrop[];
}

export interface GradeResponse {
  grades: Grade[];
  overallFeedback: string;
}
