/**
 * POST /api/generate-rubrics
 * Generate grading rubrics for extracted questions using Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getModel, callGeminiWithJSON } from '@/lib/client';
import { GENERATE_RUBRICS_PROMPT } from '@/lib/prompts';
import { Question, Rubric, GenerateRubricsRequest, GenerateRubricsResponse } from '@/lib/types';

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

const RequestSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

// Zod schema for Gemini response validation
const RubricCriterionSchema = z.object({
  point: z.string(),
  marks: z.number(),
});

const RubricResponseSchema = z.object({
  questionId: z.string(),
  criteria: z.array(RubricCriterionSchema),
  totalMarks: z.number(),
  acceptableForms: z.string(),
});

const GeminiResponseSchema = z.array(RubricResponseSchema);

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = RequestSchema.parse(body) as GenerateRubricsRequest;
    const questions = validatedRequest.questions;

    const model = getModel();
    const responseSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string' },
          criteria: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                point: { type: 'string' },
                marks: { type: 'number' },
              },
              required: ['point', 'marks'],
            },
          },
          totalMarks: { type: 'number' },
          acceptableForms: { type: 'string' },
        },
        required: ['questionId', 'criteria', 'totalMarks', 'acceptableForms'],
      },
    };

    // Batch questions into chunks of 6 to prevent model token limits and malformed outputs
    const BATCH_SIZE = 6;
    const questionBatches: Question[][] = [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      questionBatches.push(questions.slice(i, i + BATCH_SIZE));
    }

    const warnings: string[] = [];
    const validQuestionMap = new Map(questions.map((q) => [q.id, q]));
    const rubricsMap = new Map<string, Rubric>();

    // Process batches in parallel
    const batchPromises = questionBatches.map(async (batchQuestions, batchIdx) => {
      const questionsText = batchQuestions
        .map((q) => {
          const marksText = q.marks !== undefined ? `[${q.marks} marks]` : '[2 marks]';
          const subpartText = q.subpart ? ` (${q.subpart})` : '';
          return `Question ID: ${q.id}\nLabel: ${q.rawLabel}\nQuestion: ${q.text} ${marksText}\nExpected Answer Type: ${q.expectedAnswerType}`;
        })
        .join('\n\n');

      const fullPrompt = `${GENERATE_RUBRICS_PROMPT}\n\nQuestions:\n${questionsText}`;

      try {
        const geminiResponse = await callGeminiWithJSON<unknown[]>(
          model,
          fullPrompt,
          undefined,
          responseSchema,
          true
        );

        if (Array.isArray(geminiResponse)) {
          for (const rawItem of geminiResponse) {
            const parsed = RubricResponseSchema.safeParse(rawItem);
            if (parsed.success) {
              const rubric = parsed.data;
              if (validQuestionMap.has(rubric.questionId)) {
                // Validate criteria sum
                const criteriaSum = rubric.criteria.reduce((sum, c) => sum + c.marks, 0);
                if (Math.abs(criteriaSum - rubric.totalMarks) > 0.01) {
                  rubric.totalMarks = criteriaSum > 0 ? criteriaSum : (validQuestionMap.get(rubric.questionId)?.marks || 2);
                }
                rubricsMap.set(rubric.questionId, rubric);
              }
            }
          }
        }
      } catch (batchErr) {
        console.warn(`Error generating rubrics for batch ${batchIdx + 1}:`, batchErr);
      }
    });

    await Promise.all(batchPromises);

    // Provide robust fallback rubrics for any question that did not get a valid rubric
    const rubrics: Rubric[] = [];
    for (const question of questions) {
      if (rubricsMap.has(question.id)) {
        rubrics.push(rubricsMap.get(question.id)!);
      } else {
        warnings.push(`Fallback rubric created for question "${question.id}" (${question.rawLabel})`);
        const fallbackMarks = question.marks || 2;
        rubrics.push({
          questionId: question.id,
          criteria: [
            {
              point: question.expectedAnswerType === 'diagram'
                ? 'Correct diagram structure and accurate labelling'
                : 'Accurate concept explanation and complete answer',
              marks: fallbackMarks,
            },
          ],
          totalMarks: fallbackMarks,
          acceptableForms: question.expectedAnswerType === 'diagram'
            ? 'Diagram with labels required'
            : 'Prose, bullets, or diagram are valid',
        });
      }
    }

    const response: GenerateRubricsResponse = {
      rubrics,
      warnings,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in /api/generate-rubrics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate rubrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
