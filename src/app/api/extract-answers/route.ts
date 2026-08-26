/**
 * POST /api/extract-answers
 * Extract answer blocks from student answer sheets using Gemini AI with Two-Stage Reasoning & Non-Blank Grounding Verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getModel, callGeminiWithJSON } from '@/lib/client';
import { EXTRACT_ANSWERS_PROMPT } from '@/lib/prompts';
import { Question, AnswerBlock, ExtractAnswersRequest, ExtractAnswersResponse, AnswerRegion } from '@/lib/types';
import { isRegionLikelyBlank } from '@/lib/crop';

// Zod schema for request validation
const PageImageSchema = z.object({
  page: z.number().int().min(0),
  imageBase64: z.string().min(1),
});

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
  pages: z.array(PageImageSchema).min(1),
  questions: z.array(QuestionSchema).min(1),
});

// Zod schema for Stage A visual inventory block
const InventoryBlockSchema = z.object({
  blockIndex: z.number().optional(),
  visibleLabel: z.string().nullable().optional(),
  rawText: z.string().default(''),
  box_2d: z.array(z.number()).min(4).optional(),
});

// Zod schema for Stage B assigned answer item
const AssignedAnswerItemSchema = z.object({
  detectedLabel: z.string().nullable().optional(),
  transcribedText: z.string().default(''),
  box_2d: z.array(z.number()).min(4).optional(),
  assignedFromBlockIndices: z.array(z.number()).optional(),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
  reasoning: z.string().optional(),
  regions: z
    .array(
      z.object({
        page: z.number().optional(),
        box_2d: z.array(z.number()).min(4),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = RequestSchema.parse(body) as ExtractAnswersRequest;

    const sortedPages = [...validatedRequest.pages].sort((a, b) => a.page - b.page);

    // Build question labels and details string for context
    const questionsContext = validatedRequest.questions
      .map(q => `[Label: "${q.rawLabel}", Number: "${q.number}", Text: "${q.text.substring(0, 90)}..."]`)
      .join('\n');

    const model = getModel();

    // Prepare JSON schema for Two-Stage Gemini response
    const responseSchema = {
      type: 'object',
      properties: {
        inventory: {
          type: 'array',
          description: 'Stage A: Inventory of ALL visual handwritten blocks, paragraphs, and scratch-work on this page',
          items: {
            type: 'object',
            properties: {
              blockIndex: { type: 'number' },
              visibleLabel: { type: 'string', nullable: true },
              rawText: { type: 'string' },
              box_2d: {
                type: 'array',
                items: { type: 'number' },
                description: '[ymin, xmin, ymax, xmax] coordinates normalized to 0-1000 scale',
              },
            },
            required: ['rawText', 'box_2d'],
          },
        },
        answers: {
          type: 'array',
          description: 'Stage B: Assigned questions mapped from inventory blocks with reasoning',
          items: {
            type: 'object',
            properties: {
              detectedLabel: { type: 'string', nullable: true },
              transcribedText: { type: 'string' },
              box_2d: {
                type: 'array',
                items: { type: 'number' },
                description: '[ymin, xmin, ymax, xmax] coordinates normalized to 0-1000 scale',
              },
              assignedFromBlockIndices: {
                type: 'array',
                items: { type: 'number' },
              },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              reasoning: { type: 'string' },
            },
            required: ['transcribedText', 'box_2d', 'confidence'],
          },
        },
      },
      required: ['inventory', 'answers'],
    };

    // Process each page individually in parallel to keep payload sizes small and prevent 502 Bad Gateway
    const pagePromises = sortedPages.map(async (pageObj) => {
      const pagePrompt = `${EXTRACT_ANSWERS_PROMPT}\n\nYou are examining Page ${pageObj.page + 1} of the answer sheet.\nQuestions from the question paper:\n${questionsContext}`;

      try {
        const geminiResponse = await callGeminiWithJSON<Record<string, unknown> | unknown[]>(
          model,
          pagePrompt,
          [pageObj.imageBase64],
          responseSchema,
          true // retry on invalid JSON
        );

        const extractedBlocks: AnswerBlock[] = [];

        // Extract inventory and answers lists from structured object or array
        let rawInventory: unknown[] = [];
        let rawAnswers: unknown[] = [];

        if (geminiResponse && typeof geminiResponse === 'object') {
          if ('answers' in geminiResponse && Array.isArray(geminiResponse.answers)) {
            rawAnswers = geminiResponse.answers;
          }
          if ('inventory' in geminiResponse && Array.isArray(geminiResponse.inventory)) {
            rawInventory = geminiResponse.inventory;
          }
          if (Array.isArray(geminiResponse)) {
            rawAnswers = geminiResponse;
          }
        }

        // Server-side logging of Stage A Inventory for inspectability & debugging
        // Map inventory blocks by index for quick lookup
        const invMap = new Map<number, { text: string; box_2d?: number[] }>();
        for (let i = 0; i < rawInventory.length; i++) {
          const parsedInv = InventoryBlockSchema.safeParse(rawInventory[i]);
          if (parsedInv.success) {
            const inv = parsedInv.data;
            const idx = inv.blockIndex ?? i;
            invMap.set(idx, { text: inv.rawText, box_2d: inv.box_2d });
            console.log(
              `  - Block #${idx}: label="${inv.visibleLabel ?? 'unlabeled'}", text="${inv.rawText.substring(0, 50).replace(/\n/g, ' ')}", box=[${inv.box_2d?.join(', ')}]`
            );
          }
        }

        // Process Stage B Answers with Non-Blank Grounding Verification
        for (const rawItem of rawAnswers) {
          const parsed = AssignedAnswerItemSchema.safeParse(rawItem);
          if (!parsed.success) continue;

          const data = parsed.data;
          let box_2d: [number, number, number, number] = [100, 50, 900, 950];
          let combinedText = data.transcribedText || '';

          // If assignedFromBlockIndices provided, union the bounding boxes across all assigned blocks
          if (data.assignedFromBlockIndices && data.assignedFromBlockIndices.length > 0) {
            const assignedBoxes: [number, number, number, number][] = [];
            const assignedTexts: string[] = [];

            for (const idx of data.assignedFromBlockIndices) {
              const invBlock = invMap.get(idx);
              if (invBlock) {
                if (invBlock.box_2d && invBlock.box_2d.length >= 4) {
                  const [y0, x0, y1, x1] = invBlock.box_2d;
                  assignedBoxes.push([y0, x0, y1, x1]);
                }
                if (invBlock.text) {
                  assignedTexts.push(invBlock.text);
                }
              }
            }

            if (assignedBoxes.length > 0) {
              const minY = Math.min(...assignedBoxes.map(b => Math.min(b[0], b[2])));
              const minX = Math.min(...assignedBoxes.map(b => Math.min(b[1], b[3])));
              const maxY = Math.max(...assignedBoxes.map(b => Math.max(b[0], b[2])));
              const maxX = Math.max(...assignedBoxes.map(b => Math.max(b[1], b[3])));
              box_2d = [
                Math.max(0, Math.min(1000, minY)),
                Math.max(0, Math.min(1000, minX)),
                Math.max(0, Math.min(1000, Math.max(minY + 10, maxY))),
                Math.max(0, Math.min(1000, Math.max(minX + 10, maxX))),
              ];
            }

            if (assignedTexts.length > 1 && combinedText.length < 30) {
              combinedText = assignedTexts.join('\n');
            }
          } else if (data.box_2d && data.box_2d.length >= 4) {
            const [y0, x0, y1, x1] = data.box_2d;
            const ymin = Math.max(0, Math.min(1000, Math.min(y0, y1)));
            const ymax = Math.max(0, Math.min(1000, Math.max(y0, y1)));
            const xmin = Math.max(0, Math.min(1000, Math.min(x0, x1)));
            const xmax = Math.max(0, Math.min(1000, Math.max(x0, x1)));
            box_2d = [ymin, xmin, Math.max(ymin + 10, ymax), Math.max(xmin + 10, xmax)];
          } else if (data.regions && data.regions.length > 0 && data.regions[0].box_2d?.length >= 4) {
            const [y0, x0, y1, x1] = data.regions[0].box_2d;
            const ymin = Math.max(0, Math.min(1000, Math.min(y0, y1)));
            const ymax = Math.max(0, Math.min(1000, Math.max(y0, y1)));
            const xmin = Math.max(0, Math.min(1000, Math.min(x0, x1)));
            const xmax = Math.max(0, Math.min(1000, Math.max(x0, x1)));
            box_2d = [ymin, xmin, Math.max(ymin + 10, ymax), Math.max(xmin + 10, xmax)];
          }

          // Deterministic Non-Blank Validation (Bug 2 fix)
          const blankCheck = await isRegionLikelyBlank(pageObj.imageBase64, box_2d);
          let finalConfidence = data.confidence;
          let isGroundingUncertain = false;

          if (blankCheck.isBlank) {
            console.warn(
              `[Grounding Warning - Page ${pageObj.page + 1}] Bounding box for answer "${data.detectedLabel || 'unlabeled'}" has near-zero ink coverage (${(blankCheck.inkCoverage * 100).toFixed(2)}%). Marking confidence='low', groundingUncertain=true.`
            );
            finalConfidence = 'low';
            isGroundingUncertain = true;
          }

          const regions: AnswerRegion[] = [
            {
              page: pageObj.page,
              box_2d,
            },
          ];

          extractedBlocks.push({
            blockId: '', // Assigned sequentially later
            detectedLabel: data.detectedLabel || null,
            transcribedText: combinedText,
            regions,
            confidence: finalConfidence,
            groundingUncertain: isGroundingUncertain,
          });
        }

        return extractedBlocks;
      } catch (pageErr) {
        console.warn(`Error extracting answers from page ${pageObj.page + 1}:`, pageErr);
        return [];
      }
    });

    const pageResults = await Promise.all(pagePromises);

    // Flatten results and assign sequential block IDs
    const answerBlocks: AnswerBlock[] = [];
    let blockIndex = 0;

    for (const blocks of pageResults) {
      for (const block of blocks) {
        answerBlocks.push({
          ...block,
          blockId: `ans-${blockIndex++}`,
        });
      }
    }

    const response: ExtractAnswersResponse = {
      answerBlocks,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in /api/extract-answers:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to extract answers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
