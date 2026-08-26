/**
 * Pure deterministic function for matching questions to answers
 */

import { Question, AnswerBlock, MatchedItem, ReconcileResult } from './types';

/**
 * Normalized label representation
 */
interface NormalizedLabel {
  number: string;
  subpart?: string;
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalize a question label to extract number and optional subpart
 * 
 * Handles formats like:
 * - "11(b)", "11 (b)" -> { number: "11", subpart: "b" }
 * - "Q11.b", "Q.11 b)" -> { number: "11", subpart: "b" }
 * - "11b" -> { number: "11", subpart: "b" }
 * - "Question 11 part b" -> { number: "11", subpart: "b" }
 * - "11" -> { number: "11" }
 * - "" -> null
 * - "garbage text" -> null
 * 
 * @param raw - Raw label string
 * @returns Normalized label or null if unparseable
 */
export function normalizeLabel(raw: string): NormalizedLabel | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  // Strip common prefixes and clean up
  let cleaned = raw
    .toLowerCase()
    .trim();
  
  // Remove section headers like "Section-A ", "Section B: "
  cleaned = cleaned.replace(/^section[\s\-_:]*[a-z0-9]*\s+/i, '');

  // Remove "Question " or "question " prefix
  if (cleaned.startsWith('question ')) {
    cleaned = cleaned.substring(9);
  }
  // Remove "Ans.", "Ans:", "Ans " prefix
  if (cleaned.startsWith('ans.') || cleaned.startsWith('ans:')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('ans ')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('ans') && cleaned.length > 3 && /\d/.test(cleaned[3])) {
    cleaned = cleaned.substring(3);
  }
  // Remove "Q." or "q." prefix
  if (cleaned.startsWith('q.')) {
    cleaned = cleaned.substring(2);
  }
  // Remove "Q" or "q" prefix if followed by a digit
  if (cleaned.startsWith('q') && cleaned.length > 1 && /\d/.test(cleaned[1])) {
    cleaned = cleaned.substring(1);
  }
  
  cleaned = cleaned.trim();
  
  // Remove "part" keyword but preserve the letter after it
  cleaned = cleaned.replace(/\s+part\s+/i, ' ');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Replace parens and dots with spaces
  cleaned = cleaned.replace(/[)(]/g, ' ').replace(/\./g, ' ');
  
  cleaned = cleaned.trim();

  // Extract leading number
  const numberMatch = cleaned.match(/^(\d+)/);
  if (!numberMatch) {
    return null;
  }

  const number = numberMatch[1];

  // Look for trailing single letter (a-z) as subpart
  const remaining = cleaned.substring(number.length).trim();
  const subpartMatch = remaining.match(/^[.\s\-_:]*([a-z])(?:\s|$)/);

  if (subpartMatch) {
    return { number, subpart: subpartMatch[1] };
  }

  return { number };
}

/**
 * Create a lookup key from normalized label
 */
function makeLookupKey(normalized: NormalizedLabel): string {
  return normalized.subpart
    ? `${normalized.number}-${normalized.subpart}`
    : normalized.number;
}

/**
 * Reconcile questions with answer blocks using deterministic matching
 * 
 * @param questions - List of extracted questions
 * @param answers - List of extracted answer blocks
 * @returns ReconcileResult with mapped, unanswered, and unmatched items
 */
export function reconcile(
  questions: Question[],
  answers: AnswerBlock[]
): ReconcileResult {
  const warnings: string[] = [];
  const mapped: MatchedItem[] = [];
  const unmatchedAnswers: AnswerBlock[] = [];

  // Build lookup: normalized "number-subpart" -> Question
  const questionLookup = new Map<string, Question>();
  const questionByNumber = new Map<string, Question>();

  for (const question of questions) {
    const normalized = normalizeLabel(question.rawLabel);
    if (normalized) {
      const key = makeLookupKey(normalized);
      questionLookup.set(key, question);
    }
    questionByNumber.set(question.number.trim(), question);
  }

  // Track which questions have been matched (to aggregate multi-place / multi-page answers)
  const questionMatches = new Map<string, {
    question: Question;
    answerBlocks: AnswerBlock[];
    confidences: Array<'high' | 'medium' | 'low'>;
    matchTypes: Array<'exact' | 'fuzzy'>;
  }>();

  const matchedAnswerIndices = new Set<number>();

  // Pass 1: Exact label matches
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    if (!answer.detectedLabel) continue;

    const normalized = normalizeLabel(answer.detectedLabel);
    if (!normalized) continue;

    const key = makeLookupKey(normalized);
    const matchedQuestion = questionLookup.get(key) || questionByNumber.get(normalized.number);

    if (matchedQuestion) {
      matchedAnswerIndices.add(i);
      const questionId = matchedQuestion.id;

      if (questionMatches.has(questionId)) {
        const existing = questionMatches.get(questionId)!;
        existing.answerBlocks.push(answer);
        existing.confidences.push(answer.confidence);
        existing.matchTypes.push('exact');
      } else {
        questionMatches.set(questionId, {
          question: matchedQuestion,
          answerBlocks: [answer],
          confidences: [answer.confidence],
          matchTypes: ['exact'],
        });
      }
    }
  }

  // Pass 2: Fuzzy & Sequence matching for remaining unmapped answers with labels
  for (let i = 0; i < answers.length; i++) {
    if (matchedAnswerIndices.has(i)) continue;
    const answer = answers[i];
    if (!answer.detectedLabel) {
      unmatchedAnswers.push(answer);
      continue;
    }

    const answerLabelLower = answer.detectedLabel.toLowerCase().trim();
    let bestMatch: { question: Question; distance: number } | null = null;
    let secondBestDistance = Infinity;

    // Prioritize currently unanswered questions
    const unmatchedQuestions = questions.filter(q => !questionMatches.has(q.id));
    const candidateList = unmatchedQuestions.length > 0 ? unmatchedQuestions : questions;

    for (const question of candidateList) {
      const questionLabelLower = question.rawLabel.toLowerCase().trim();
      const distance = levenshteinDistance(answerLabelLower, questionLabelLower);

      if (distance <= 2) {
        if (!bestMatch || distance < bestMatch.distance) {
          secondBestDistance = bestMatch?.distance ?? Infinity;
          bestMatch = { question, distance };
        } else if (distance < secondBestDistance) {
          secondBestDistance = distance;
        }
      }
    }

    if (bestMatch && (secondBestDistance - bestMatch.distance >= 1 || candidateList.length === 1)) {
      matchedAnswerIndices.add(i);
      const matchedQuestion = bestMatch.question;
      const questionId = matchedQuestion.id;

      warnings.push(
        `Fuzzy match: answer "${answer.detectedLabel}" matched to question "${matchedQuestion.rawLabel}"`
      );

      if (questionMatches.has(questionId)) {
        const existing = questionMatches.get(questionId)!;
        existing.answerBlocks.push(answer);
        existing.confidences.push(answer.confidence);
        existing.matchTypes.push('fuzzy');
      } else {
        questionMatches.set(questionId, {
          question: matchedQuestion,
          answerBlocks: [answer],
          confidences: [answer.confidence],
          matchTypes: ['fuzzy'],
        });
      }
    } else {
      unmatchedAnswers.push(answer);
    }
  }

  // Build final mapped items, cleanly combining multi-region and multi-place answers
  for (const [, match] of questionMatches.entries()) {
    if (match.answerBlocks.length === 1) {
      mapped.push({
        question: match.question,
        answer: match.answerBlocks[0],
        matchConfidence: match.matchTypes[0],
      });
    } else {
      // Sort answer blocks by page and top position
      const sortedBlocks = [...match.answerBlocks].sort((a, b) => {
        const pageA = a.regions[0]?.page ?? 0;
        const pageB = b.regions[0]?.page ?? 0;
        if (pageA !== pageB) return pageA - pageB;
        const yA = a.regions[0]?.box_2d[0] ?? 0;
        const yB = b.regions[0]?.box_2d[0] ?? 0;
        return yA - yB;
      });

      const mergedRegions = sortedBlocks.flatMap(block => block.regions);
      const mergedText = sortedBlocks
        .map((block, idx) => {
          const pageNum = (block.regions[0]?.page ?? 0) + 1;
          return `[Attempt / Work on Page ${pageNum}]:\n${block.transcribedText}`;
        })
        .join('\n\n---\n\n');

      const lowestConfidence = match.confidences.includes('low')
        ? 'low'
        : match.confidences.includes('medium')
        ? 'medium'
        : 'high';

      const finalMatchConfidence = match.matchTypes.includes('fuzzy') ? 'fuzzy' : 'exact';

      const mergedAnswer: AnswerBlock = {
        blockId: sortedBlocks[0].blockId,
        detectedLabel: sortedBlocks[0].detectedLabel,
        transcribedText: mergedText,
        regions: mergedRegions,
        confidence: lowestConfidence,
      };

      mapped.push({
        question: match.question,
        answer: mergedAnswer,
        matchConfidence: finalMatchConfidence,
      });

      warnings.push(
        `Multi-part answer merged for question "${match.question.rawLabel}": combined ${sortedBlocks.length} parts across page(s) ${mergedRegions.map(r => r.page + 1).join(', ')}`
      );
    }
  }

  // Find truly unanswered questions
  const matchedQuestionIds = new Set(questionMatches.keys());
  const unanswered = questions.filter(q => !matchedQuestionIds.has(q.id));

  // Check for numbering gaps in questions
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

  return {
    mapped,
    unanswered,
    unmatchedAnswers,
    warnings,
  };
}
