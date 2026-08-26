import { Router, Request, Response } from 'express';
const router = Router();

/**
 * POST /api/grade
 * Grade matched answers against rubrics using Groq AI with cropped answer images
 */

import { z } from 'zod';

import { callGroqWithJSON } from '../lib/groqClient';
import { GRADE_ANSWERS_PROMPT } from '../lib/prompts';
import { MatchedItem, Rubric, Grade, GradeRequest, GradeResponse } from '../lib/types';

// Zod schema for request validation
const QuestionSchema = z.object({
  id: z.string(),
  rawLabel: z.string(),
  number: z.string(),
  subpart: z.string().optional(),
  text: z.string(),
  marks: z.number().optional(),
  page: z.number().int().min(0),
  orderIndex: z.number().int().min(0),
  expectedAnswerType: z.enum(['text', 'diagram', 'mixed']),
});

const AnswerRegionSchema = z.object({
  page: z.number().int().min(0),
  box_2d: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

const AnswerBlockSchema = z.object({
  blockId: z.string(),
  detectedLabel: z.string().nullable(),
  transcribedText: z.string(),
  regions: z.array(AnswerRegionSchema).min(1),
  confidence: z.enum(['high', 'medium', 'low']),
});

const MatchedItemSchema = z.object({
  question: QuestionSchema,
  answer: AnswerBlockSchema,
  matchConfidence: z.enum(['exact', 'fuzzy']),
});

const RubricCriterionSchema = z.object({
  point: z.string(),
  marks: z.number(),
});

const RubricSchema = z.object({
  questionId: z.string(),
  criteria: z.array(RubricCriterionSchema),
  totalMarks: z.number(),
  acceptableForms: z.string(),
});

const AnswerImageCropSchema = z.object({
  blockId: z.string(),
  imageBase64: z.string(),
});

const RequestSchema = z.object({
  mapped: z.array(MatchedItemSchema).min(1),
  rubrics: z.array(RubricSchema).min(1),
  answerImageCrops: z.array(AnswerImageCropSchema).min(1),
});

// Zod schema for Gemini response validation
const CriterionResultSchema = z.object({
  point: z.string(),
  met: z.boolean(),
});

const GradeResponseSchema = z.object({
  questionId: z.string(),
  criteriaResults: z.array(CriterionResultSchema),
  score: z.number(),
  maxMarks: z.number(),
  verdict: z.enum(['correct', 'partial', 'incorrect']),
  feedback: z.string(),
});

const GeminiResponseSchema = z.object({
  grades: z.array(GradeResponseSchema),
  overallFeedback: z.string(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    // Parse and validate request body
    const body = req.body;
    const validatedRequest = RequestSchema.parse(body) as GradeRequest;

    // Build lookup maps
    const rubricByQuestionId = new Map<string, Rubric>();
    for (const rubric of validatedRequest.rubrics) {
      rubricByQuestionId.set(rubric.questionId, rubric);
    }

    const cropByBlockId = new Map<string, string>();
    for (const crop of validatedRequest.answerImageCrops) {
      cropByBlockId.set(crop.blockId, crop.imageBase64);
    }

    // Build the grading prompt with all matched items
    const warnings: string[] = [];
    const gradingItems: Array<{
      questionId: string;
      questionText: string;
      rubric: Rubric;
      transcribedText: string;
      imageBase64: string;
    }> = [];

    for (const matchedItem of validatedRequest.mapped) {
      const questionId = matchedItem.question.id;
      const rubric = rubricByQuestionId.get(questionId);

      if (!rubric) {
        warnings.push(
          `No rubric found for question "${questionId}" (${matchedItem.question.rawLabel}) - skipping grading`
        );
        continue;
      }

      const cropImage = cropByBlockId.get(matchedItem.answer.blockId);
      if (!cropImage) {
        warnings.push(
          `No image crop found for answer block "${matchedItem.answer.blockId}" - skipping grading`
        );
        continue;
      }

      gradingItems.push({
        questionId,
        questionText: matchedItem.question.text,
        rubric,
        transcribedText: matchedItem.answer.transcribedText,
        imageBase64: cropImage,
      });
    }

    if (gradingItems.length === 0) {
      return res.status(400).json({ error: 'No gradable items found', warnings });
    }

    // Build the full prompt with all grading items
    const itemsText = gradingItems
      .map((item, index) => {
        const criteriaText = item.rubric.criteria
          .map(c => `  - ${c.point} (${c.marks} marks)`)
          .join('\n');

        return `
Item ${index + 1}:
Question ID: ${item.questionId}
Question: ${item.questionText}
Rubric (Total: ${item.rubric.totalMarks} marks):
${criteriaText}
Acceptable Forms: ${item.rubric.acceptableForms}
Transcribed Answer Text: ${item.transcribedText}
(Image of answer region is attached)
`;
      })
      .join('\n---\n');

    const jsonFormatInstructions = `
CRITICAL JSON FORMAT INSTRUCTIONS:
You MUST return a pure JSON object matching this schema:
{
  "grades": [
    {
      "questionId": "STRING matching exact Question ID provided for the item (e.g. \\"1\\")",
      "criteriaResults": [
        {
          "point": "STRING matching rubric criterion point text",
          "met": true // or false
        }
      ],
      "score": 2, // NUMBER score for this question
      "maxMarks": 2, // NUMBER max marks
      "verdict": "correct", // "correct" | "partial" | "incorrect"
      "feedback": "STRING 1-2 sentence specific grading feedback"
    }
  ],
  "overallFeedback": "STRING summarizing student performance"
}
`;

    const fullPrompt = `${jsonFormatInstructions}\n\nITEMS TO GRADE:\n${itemsText}`;

    // Collect all images in order
    const images = gradingItems.map(item => item.imageBase64);

    const groqModel = process.env.GROQ_GRADE_MODEL || 'openai/gpt-oss-120b';
    const modelResponse = await callGroqWithJSON<Record<string, unknown> | unknown[]>(
      fullPrompt,
      images,
      groqModel,
      GRADE_ANSWERS_PROMPT // Pass as system prompt
    );

    // Extract raw grades array from various model response shapes
    let rawGradesList: unknown[] = [];
    let overallFeedback = 'Student answers evaluated against rubrics.';

    if (Array.isArray(modelResponse)) {
      rawGradesList = modelResponse;
    } else if (modelResponse && typeof modelResponse === 'object') {
      const respObj = modelResponse as Record<string, unknown>;
      if (typeof respObj.overallFeedback === 'string') {
        overallFeedback = respObj.overallFeedback;
      } else if (typeof respObj.overall_feedback === 'string') {
        overallFeedback = respObj.overall_feedback;
      }

      if (Array.isArray(respObj.grades)) {
        rawGradesList = respObj.grades;
      } else if (Array.isArray(respObj.results)) {
        rawGradesList = respObj.results;
      } else if (Array.isArray(respObj.evaluations)) {
        rawGradesList = respObj.evaluations;
      } else if (Array.isArray(respObj.items)) {
        rawGradesList = respObj.items;
      } else if (Array.isArray(respObj.questions)) {
        rawGradesList = respObj.questions;
      } else {
        const values = Object.values(respObj).filter(v => v && typeof v === 'object');
        if (values.length > 0) {
          rawGradesList = values;
        }
      }
    }

    // Helper to resolve questionId from model response (exact, fuzzy or index-based)
    const validQuestionIds = new Set(gradingItems.map(item => item.questionId));

    function resolveQuestionId(rawQId: unknown, index: number): string {
      if (typeof rawQId === 'string' || typeof rawQId === 'number') {
        const str = String(rawQId).trim();
        if (validQuestionIds.has(str)) return str;

        const clean = str.toLowerCase().replace(/^(q|question|item)[\s._-]*/i, '').trim();
        for (const validId of validQuestionIds) {
          const validClean = validId.toLowerCase().replace(/^(q|question|item)[\s._-]*/i, '').trim();
          if (validClean === clean || validId.toLowerCase() === str.toLowerCase()) {
            return validId;
          }
        }
      }

      if (index >= 0 && index < gradingItems.length) {
        return gradingItems[index].questionId;
      }

      return gradingItems[0]?.questionId || 'unknown';
    }

    const grades: Grade[] = [];

    for (let idx = 0; idx < rawGradesList.length; idx++) {
      const raw = (rawGradesList[idx] || {}) as Record<string, unknown>;
      const rawQId = raw.questionId ?? raw.question_id ?? raw.id ?? raw.question ?? raw.questionNumber ?? raw.item;
      const questionId = resolveQuestionId(rawQId, idx);

      const rubric = rubricByQuestionId.get(questionId) || gradingItems[idx]?.rubric;
      if (!rubric) {
        warnings.push(`No rubric found for question "${questionId}"`);
        continue;
      }

      // Extract & normalize criteria results
      const rawCriteria = (raw.criteriaResults ?? raw.criteria_results ?? raw.criteria ?? raw.rubric_results ?? raw.criteria_evaluation ?? []) as unknown[];
      const criteriaResults: Array<{ point: string; met: boolean }> = [];

      if (Array.isArray(rawCriteria) && rawCriteria.length > 0) {
        for (const c of rawCriteria) {
          if (c && typeof c === 'object') {
            const cObj = c as Record<string, unknown>;
            const point = String(cObj.point ?? cObj.criterion ?? cObj.description ?? cObj.name ?? cObj.text ?? '');
            const metVal = cObj.met ?? cObj.is_met ?? cObj.passed ?? cObj.achieved ?? false;
            const met = metVal === true || metVal === 'true' || metVal === 1 || metVal === 'yes';
            criteriaResults.push({ point, met });
          }
        }
      }

      if (criteriaResults.length === 0) {
        const rawScore = Number(raw.score ?? raw.marks ?? 0);
        const maxMarks = rubric.totalMarks || 2;
        const ratio = maxMarks > 0 ? rawScore / maxMarks : 0;
        for (const c of rubric.criteria) {
          criteriaResults.push({
            point: c.point,
            met: ratio >= 0.5,
          });
        }
      }

      // Build criteria marks map
      const criteriaByPoint = new Map<string, number>();
      for (const criterion of rubric.criteria) {
        criteriaByPoint.set(criterion.point.trim().toLowerCase(), criterion.marks);
      }

      let criteriaSumScore = 0;
      let hasAnyMetCriteria = false;

      criteriaResults.forEach((result, rIdx) => {
        if (result.met) {
          hasAnyMetCriteria = true;
          const normalizedPoint = result.point.trim().toLowerCase();
          if (criteriaByPoint.has(normalizedPoint)) {
            criteriaSumScore += criteriaByPoint.get(normalizedPoint)!;
          } else if (rIdx < rubric.criteria.length) {
            criteriaSumScore += rubric.criteria[rIdx].marks;
          } else {
            criteriaSumScore += rubric.totalMarks / Math.max(1, criteriaResults.length);
          }
        }
      });

      const maxMarks = Number(raw.maxMarks ?? raw.max_marks ?? raw.totalMarks ?? rubric.totalMarks ?? 2);
      let rawScore = typeof raw.score === 'number' ? raw.score : Number(raw.score);
      let finalScore = 0;

      if (!isNaN(rawScore) && rawScore >= 0) {
        finalScore = Math.min(maxMarks, Math.max(0, rawScore));
      } else if (hasAnyMetCriteria && criteriaSumScore > 0) {
        finalScore = Math.min(maxMarks, Math.max(0, Math.round(criteriaSumScore)));
      } else {
        const rawVerdict = String(raw.verdict ?? '').toLowerCase();
        if (rawVerdict === 'correct' || rawVerdict === 'full') {
          finalScore = maxMarks;
        } else if (rawVerdict === 'partial') {
          finalScore = Math.max(1, Math.round(maxMarks / 2));
        } else {
          finalScore = 0;
        }
      }

      let verdict: 'correct' | 'partial' | 'incorrect' = 'incorrect';
      if (finalScore >= maxMarks && maxMarks > 0) {
        verdict = 'correct';
      } else if (finalScore > 0) {
        verdict = 'partial';
      }

      const feedback = String(raw.feedback ?? raw.comment ?? raw.notes ?? raw.reason ?? 'Evaluated against rubric.');

      grades.push({
        questionId,
        criteriaResults,
        score: finalScore,
        maxMarks,
        verdict,
        feedback,
      });
    }

    // Check if any grading items are missing from the response
    const gradedQuestionIds = new Set(grades.map(g => g.questionId));
    for (const item of gradingItems) {
      if (!gradedQuestionIds.has(item.questionId)) {
        warnings.push(
          `No grade returned for question "${item.questionId}"`
        );
      }
    }

    const response: GradeResponse = {
      grades,
      overallFeedback,
    };

    // Include warnings if any
    if (warnings.length > 0) {
      return res.status(200).json({ ...response, warnings });
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in /api/grade:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }

    return res.status(500).json({ 
        error: 'Failed to grade answers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
  }
});

export default router;
