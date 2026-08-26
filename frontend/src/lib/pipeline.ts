/**
 * Assessment Pipeline Orchestration
 * Coordinates PDF rasterization, question extraction, rubric generation,
 * answer extraction, deterministic reconciliation, and multimodal grading.
 */

import { convertFileToPageImages, cropAnswerRegionClient, cropMultiRegionAnswerClient } from './pdfUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
import {
  Question,
  Rubric,
  AnswerBlock,
  ExtractQuestionsResponse,
  GenerateRubricsResponse,
  ExtractAnswersResponse,
  ReconcileResponse,
  Grade,
  GradeResponse,
  AnswerImageCrop,
} from './types';
import { AssessmentData, QuestionItem, BoundingBox } from './assessmentData';

export interface PipelineProgress {
  message: string;
  step: number;
  totalSteps: number;
}

export interface PipelineExecutionResult {
  assessmentData: AssessmentData;
  answerSheetPageImages: string[];
}

export async function runAssessmentPipeline(
  qpFile: File,
  asFile: File,
  onProgress?: (progress: PipelineProgress) => void
): Promise<PipelineExecutionResult> {
  const totalSteps = 6;

  // Step 1: Rasterize PDFs to high-res page images
  onProgress?.({
    message: 'Rendering Question Paper & Answer Sheet PDF pages...',
    step: 1,
    totalSteps,
  });

  const [qpPages, asPages] = await Promise.all([
    convertFileToPageImages(qpFile, 1.5),
    convertFileToPageImages(asFile, 1.5),
  ]);

  if (qpPages.length === 0) {
    throw new Error('Question paper has no readable pages.');
  }
  if (asPages.length === 0) {
    throw new Error('Answer sheet has no readable pages.');
  }

  // Step 2: Extract questions from question paper
  onProgress?.({
    message: `Extracting questions from ${qpPages.length} question paper page(s)...`,
    step: 2,
    totalSteps,
  });

  const extractQpRes = await fetch(`${API_URL}/api/extract-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages: qpPages }),
  });

  if (!extractQpRes.ok) {
    const errorData = await extractQpRes.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Failed to extract questions (HTTP ${extractQpRes.status})`
    );
  }

  const { questions } = (await extractQpRes.json()) as ExtractQuestionsResponse;
  if (!questions || questions.length === 0) {
    throw new Error('No questions could be extracted from the question paper.');
  }

  // Step 3: Generate rubrics for extracted questions
  onProgress?.({
    message: `Generating structured grading rubrics for ${questions.length} question(s)...`,
    step: 3,
    totalSteps,
  });

  const rubricsRes = await fetch(`${API_URL}/api/generate-rubrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions }),
  });

  let rubrics: Rubric[] = [];
  if (rubricsRes.ok) {
    const rubricsData = (await rubricsRes.json()) as GenerateRubricsResponse;
    rubrics = rubricsData.rubrics || [];
  } else {
    console.warn('Rubric generation returned non-200, creating fallback rubrics');
    rubrics = questions.map((q) => ({
      questionId: q.id,
      criteria: [{ point: 'Correct answer and accurate explanation', marks: q.marks || 2 }],
      totalMarks: q.marks || 2,
      acceptableForms: 'Prose or diagram',
    }));
  }

  // Step 4: Extract handwritten answers & bounding boxes from answer sheet
  onProgress?.({
    message: `Extracting student handwritten answers & bounding boxes from ${asPages.length} page(s)...`,
    step: 4,
    totalSteps,
  });

  const extractAnsRes = await fetch(`${API_URL}/api/extract-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages: asPages, questions }),
  });

  if (!extractAnsRes.ok) {
    const errorData = await extractAnsRes.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Failed to extract answers (HTTP ${extractAnsRes.status})`
    );
  }

  const { answerBlocks } = (await extractAnsRes.json()) as ExtractAnswersResponse;

  // Step 5: Deterministic reconciliation
  onProgress?.({
    message: 'Reconciling questions with student answers...',
    step: 5,
    totalSteps,
  });

  const reconcileRes = await fetch(`${API_URL}/api/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions, answerBlocks: answerBlocks || [] }),
  });

  if (!reconcileRes.ok) {
    const errorData = await reconcileRes.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Failed to reconcile questions and answers (HTTP ${reconcileRes.status})`
    );
  }

  const reconcileData = (await reconcileRes.json()) as ReconcileResponse;
  const mapped = reconcileData.mapped || [];

  // Step 6: Grade student answers with visual evidence in fast parallel batches
  onProgress?.({
    message: `Grading ${mapped.length} matched answer(s) against rubrics with visual evidence...`,
    step: 6,
    totalSteps,
  });

  // Prepare cropped answer images on client (handles multi-place and multi-page solutions)
  const answerImageCrops: AnswerImageCrop[] = [];
  const cropMap = new Map<string, AnswerImageCrop>();

  for (const item of mapped) {
    if (item.answer.regions && item.answer.regions.length > 0) {
      try {
        const cropDataUrl = await cropMultiRegionAnswerClient(
          asPages,
          item.answer.regions
        );
        const cropObj = {
          blockId: item.answer.blockId,
          imageBase64: cropDataUrl,
        };
        answerImageCrops.push(cropObj);
        cropMap.set(item.answer.blockId, cropObj);
      } catch (cropErr) {
        console.warn(`Failed to crop answer regions for block ${item.answer.blockId}:`, cropErr);
      }
    }
  }

  // Grade in small concurrent batches of 3-4 questions to ensure lightning-fast responses without token truncation
  const BATCH_SIZE = 3;
  const allGrades: Grade[] = [];
  const batches: Array<typeof mapped> = [];

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    batches.push(mapped.slice(i, i + BATCH_SIZE));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchItems = batches[batchIdx];
    const batchCrops = batchItems
      .map((item) => cropMap.get(item.answer.blockId))
      .filter((c): c is AnswerImageCrop => !!c);

    if (batchCrops.length === 0) continue;

    onProgress?.({
      message: `Evaluating answers (Batch ${batchIdx + 1} of ${batches.length})...`,
      step: 6,
      totalSteps,
    });

    let success = false;
    for (let attempt = 0; attempt < 2 && !success; attempt++) {
      try {
        const gradeRes = await fetch(`${API_URL}/api/grade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mapped: batchItems,
            rubrics,
            answerImageCrops: batchCrops,
          }),
        });

        if (gradeRes.ok) {
          const data = (await gradeRes.json()) as GradeResponse;
          if (data.grades) {
            allGrades.push(...data.grades);
          }
          success = true;
        } else {
          const errText = await gradeRes.text().catch(() => '');
          console.warn(`Batch ${batchIdx + 1} grading returned ${gradeRes.status} (attempt ${attempt + 1}):`, errText);
          if (gradeRes.status === 429 || gradeRes.status === 500) {
            await new Promise((r) => setTimeout(r, 4500));
          }
        }
      } catch (batchErr) {
        console.warn(`Batch ${batchIdx + 1} grading error (attempt ${attempt + 1}):`, batchErr);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  // Construct lookup maps
  const gradeMap = new Map(allGrades.map((g) => [g.questionId, g]));
  const rubricMap = new Map(rubrics.map((r) => [r.questionId, r]));
  const mappedMap = new Map(mapped.map((m) => [m.question.id, m]));

  // Assemble QuestionItem[]
  const questionItems: QuestionItem[] = questions.map((q) => {
    const matched = mappedMap.get(q.id);
    const grade = gradeMap.get(q.id);
    const rubric = rubricMap.get(q.id);

    const maxMarks = grade?.maxMarks || q.marks || rubric?.totalMarks || 2;
    let obtainedMarks = grade?.score ?? 0;
    if (obtainedMarks > maxMarks) obtainedMarks = maxMarks;

    let status: 'full' | 'partial' | 'zero' = 'zero';
    if (obtainedMarks >= maxMarks && maxMarks > 0) {
      status = 'full';
    } else if (obtainedMarks > 0) {
      status = 'partial';
    }

    // Bounding box only when answer is actually detected & mapped
    let pageNum = 1;
    let boundingBox: BoundingBox = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      label: 'Unanswered',
    };

    if (matched && matched.answer.regions.length > 0) {
      const region = matched.answer.regions[0];
      pageNum = region.page + 1; // 1-based index
      const [ymin, xmin, ymax, xmax] = region.box_2d;

      // Convert 0-1000 scale to 0-100 percentage
      const x = Math.max(0, Math.min(100, xmin / 10));
      const y = Math.max(0, Math.min(100, ymin / 10));
      const width = Math.max(5, Math.min(100 - x, (xmax - xmin) / 10));
      const height = Math.max(4, Math.min(100 - y, (ymax - ymin) / 10));

      boundingBox = {
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        width: Number(width.toFixed(1)),
        height: Number(height.toFixed(1)),
        label: q.rawLabel || `Q${q.number}`,
      };
    }

    const aiFeedback =
      grade?.feedback ||
      (matched
        ? 'Student response detected and evaluated against rubric.'
        : `Question not attempted. No written answer was found on the answer sheet for question "${q.rawLabel}".`);

    const studentAnswerText = matched?.answer.transcribedText || '[No written response detected / Unanswered]';

    const conceptCovered =
      rubric?.criteria.map((c) => c.point).join(' • ') ||
      (q.expectedAnswerType === 'diagram' ? 'Diagram structure & labelling' : 'Theoretical response');

    const isGroundingUncertain = matched?.answer.groundingUncertain || (matched?.answer.confidence === 'low');

    return {
      id: q.id,
      number: q.number,
      subPart: q.subpart,
      text: q.text,
      maxMarks,
      obtainedMarks,
      status,
      aiFeedback,
      page: pageNum,
      boundingBox,
      studentAnswerText,
      conceptCovered,
      groundingUncertain: isGroundingUncertain,
    };
  });

  const totalMarks = questionItems.reduce((sum, q) => sum + q.maxMarks, 0);
  const obtainedMarks = questionItems.reduce((sum, q) => sum + q.obtainedMarks, 0);

  const cleanTitle = qpFile.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const assessmentData: AssessmentData = {
    title: cleanTitle || 'Assessment & Exam Mapping',
    subject: 'Extracted Assessment',
    grade: 'Evaluation',
    questionPaperName: qpFile.name,
    questionPaperSize: `${(qpFile.size / (1024 * 1024)).toFixed(1)}MB`,
    questionPaperPages: qpPages.length,
    answerSheetName: asFile.name,
    answerSheetSize: `${(asFile.size / (1024 * 1024)).toFixed(1)}MB`,
    answerSheetPages: asPages.length,
    totalPages: asPages.length,
    totalMarks,
    obtainedMarks,
    questions: questionItems,
  };

  const answerSheetPageImages = asPages.map((p) => p.imageBase64);

  return {
    assessmentData,
    answerSheetPageImages,
  };
}
