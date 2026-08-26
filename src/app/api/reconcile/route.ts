/**
 * POST /api/reconcile
 * Reconcile questions with answer blocks using deterministic matching
 * This is a thin wrapper around the pure reconcile function
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reconcile } from '@/lib/reconcile';
import { Question, AnswerBlock, ReconcileRequest, ReconcileResponse } from '@/lib/types';

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

const RequestSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
  answerBlocks: z.array(AnswerBlockSchema),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = RequestSchema.parse(body) as ReconcileRequest;

    // Call the pure reconcile function
    const result = reconcile(
      validatedRequest.questions,
      validatedRequest.answerBlocks
    );

    const response: ReconcileResponse = result;

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in /api/reconcile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to reconcile questions and answers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
