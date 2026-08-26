import { Router, Request, Response } from 'express';
const router = Router();

/**
 * POST /api/extract-questions
 * Extract questions from question paper pages using Gemini AI
 */

import { z } from 'zod';
import { getModel, callGeminiWithJSON } from '../lib/client';
import { EXTRACT_QUESTIONS_PROMPT } from '../lib/prompts';
import { Question, ExtractQuestionsRequest, ExtractQuestionsResponse } from '../lib/types';

// Zod schema for request validation
const PageImageSchema = z.object({
  page: z.number().int().min(0),
  imageBase64: z.string().min(1),
});

const RequestSchema = z.object({
  pages: z.array(PageImageSchema).min(1),
});

// Zod schema for Gemini response validation
const QuestionResponseSchema = z.object({
  rawLabel: z.string(),
  number: z.string(),
  subpart: z.string().optional(),
  text: z.string(),
  marks: z.number().optional(),
  page: z.number().int().min(0),
  expectedAnswerType: z.enum(['text', 'diagram', 'mixed']),
});

const GeminiResponseSchema = z.array(QuestionResponseSchema);

/**
 * Slugify a string for use as an ID
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a unique question ID from number and subpart
 */
function generateQuestionId(
  number: string,
  subpart: string | undefined,
  existingIds: Set<string>
): string {
  let baseId = subpart ? `${number}-${subpart}` : number;
  baseId = slugify(baseId);

  // Handle collisions
  let id = baseId;
  let counter = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  existingIds.add(id);
  return id;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    // Parse and validate request body
    const body = req.body;
    const validatedRequest = RequestSchema.parse(body) as ExtractQuestionsRequest;

    // Extract images from request
    const images = validatedRequest.pages
      .sort((a, b) => a.page - b.page)
      .map(p => p.imageBase64);

    // Call Gemini AI
    const model = getModel();
    
    // Prepare JSON schema for Gemini (simplified for API compatibility)
    const responseSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rawLabel: { type: 'string' },
          number: { type: 'string' },
          subpart: { type: 'string' },
          text: { type: 'string' },
          marks: { type: 'number' },
          page: { type: 'number' },
          expectedAnswerType: { type: 'string', enum: ['text', 'diagram', 'mixed'] },
        },
        required: ['rawLabel', 'number', 'text', 'page', 'expectedAnswerType'],
      },
    };

    const geminiResponse = await callGeminiWithJSON<unknown[]>(
      model,
      EXTRACT_QUESTIONS_PROMPT,
      images,
      responseSchema,
      true // retry on invalid JSON
    );

    // Validate Gemini response items with Zod safeParse
    const validatedQuestions: Array<z.infer<typeof QuestionResponseSchema>> = [];
    if (Array.isArray(geminiResponse)) {
      for (const rawItem of geminiResponse) {
        const parsed = QuestionResponseSchema.safeParse(rawItem);
        if (parsed.success) {
          validatedQuestions.push(parsed.data);
        }
      }
    }

    if (validatedQuestions.length === 0) {
      throw new Error('No questions could be parsed from the model response.');
    }

    // Post-processing: assign IDs and orderIndex
    const warnings: string[] = [];
    const existingIds = new Set<string>();
    const questions: Question[] = validatedQuestions.map((q, index) => {
      const id = generateQuestionId(q.number, q.subpart, existingIds);

      // Track ID collisions
      if (id.endsWith('-2') || id.endsWith('-3')) {
        warnings.push(`ID collision detected for question "${q.rawLabel}", assigned ID: "${id}"`);
      }

      return {
        id,
        rawLabel: q.rawLabel,
        number: q.number,
        subpart: q.subpart,
        text: q.text,
        marks: q.marks,
        page: q.page,
        orderIndex: index,
        expectedAnswerType: q.expectedAnswerType,
      };
    });

    // Sanity check: detect numbering gaps
    const questionNumbers = questions
      .map(q => parseInt(q.number, 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    for (let i = 1; i < questionNumbers.length; i++) {
      const gap = questionNumbers[i] - questionNumbers[i - 1];
      if (gap > 1) {
        warnings.push(
          `Question numbering gap: skips from ${questionNumbers[i - 1]} to ${questionNumbers[i]}`
        );
      }
    }

    const response: ExtractQuestionsResponse = {
      questions,
      warnings,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in /api/extract-questions:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }

    return res.status(500).json({ 
        error: 'Failed to extract questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
  }
});

export default router;
