/**
 * Gemini AI client configuration and utilities
 */

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

const defaultSafetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

/**
 * Get or initialize the GoogleGenerativeAI client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.'
      );
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Get a configured Gemini model instance
 * @param modelName - defaults to gemini-3.1-flash-lite per specification
 */
export function getModel(
  modelName: string = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  systemInstruction?: string
): GenerativeModel {
  const genAI = getGenAI();
  const config: any = {
    model: modelName,
    safetySettings: defaultSafetySettings,
  };
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  return genAI.getGenerativeModel(config);
}

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry helper for Gemini API calls with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param retries - Number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000)
 * @returns The result of the function call
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      const errStr = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      
      // Check if it's a retriable error (rate limits, quotas, transient server errors)
      const isRetriable = 
        errStr.includes('network') || 
        errStr.includes('429') ||
        errStr.includes('rate limit') ||
        errStr.includes('quota') ||
        errStr.includes('resource_exhausted') ||
        errStr.includes('tokens per minute') ||
        errStr.includes('tpm') ||
        errStr.includes('rpm') ||
        errStr.includes('500') || 
        errStr.includes('502') ||
        errStr.includes('503') ||
        errStr.includes('504') ||
        errStr.includes('overloaded') ||
        errStr.includes('fetch failed');

      // If we've exhausted retries or it's not a retriable error, throw
      if (attempt === retries || !isRetriable) {
        throw error;
      }

      // If rate limited, wait at least 4-5s to clear the token bucket
      let delay = baseDelay * Math.pow(2, attempt);
      if (errStr.includes('429') || errStr.includes('rate limit') || errStr.includes('quota') || errStr.includes('tokens per minute')) {
        delay = Math.max(delay, 5000);
      }

      console.warn(`[Retry Helper] Attempt ${attempt + 1}/${retries} pausing for ${(delay / 1000).toFixed(1)}s due to retriable error:`, error instanceof Error ? error.message : error);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Call Gemini with structured JSON response
 * 
 * @param model - The Gemini model instance
 * @param prompt - The text prompt
 * @param images - Optional array of base64-encoded images
 * @param responseSchema - Optional JSON schema for structured output
 * @param retryOnInvalidJson - Whether to retry once with an added instruction on JSON validation failure
 * @returns The parsed JSON response
 */
export async function callGeminiWithJSON<T>(
  model: GenerativeModel,
  prompt: string,
  images?: string[],
  responseSchema?: object,
  retryOnInvalidJson: boolean = true
): Promise<T> {
  const attempt = async (isRetry: boolean = false): Promise<T> => {
    // Build content parts: images first (in order), then the prompt
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    if (images && images.length > 0) {
      for (const imageBase64 of images) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
    }

    // Add prompt, with additional instruction if this is a retry
    const finalPrompt = isRetry
      ? `${prompt}\n\nIMPORTANT: To avoid recitation or formatting issues, summarize and paraphrase question text concisely into structured JSON. Return ONLY valid JSON matching the schema. No markdown, no prose, no verbatim textbook reproduction.`
      : prompt;

    parts.push({ text: finalPrompt });

    // Configure generation with JSON response
    const generationConfig: Record<string, unknown> = {
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    // Add JSON schema if provided
    if (responseSchema) {
      generationConfig.responseSchema = responseSchema;
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
      safetySettings: defaultSafetySettings,
    });

    const response = result.response;
    let text = '';

    try {
      text = response.text();
    } catch (textErr) {
      const errMsg = textErr instanceof Error ? textErr.message : '';
      if (errMsg.includes('RECITATION') || errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
        // Attempt to harvest partial candidate parts if present
        const candidate = response.candidates?.[0];
        const partialText = candidate?.content?.parts?.map(p => ('text' in p ? p.text : '')).join('') || '';
        if (partialText) {
          try {
            return parseAndRepairJson<T>(partialText);
          } catch {
            // Fall through to retry
          }
        }
        if (!isRetry) {
          console.warn('Recitation/Safety filter encountered, retrying with paraphrasing instruction...');
          return attempt(true);
        }
      }
      throw textErr;
    }

    // Parse and auto-repair JSON response
    try {
      return parseAndRepairJson<T>(text);
    } catch (parseError) {
      if (retryOnInvalidJson && !isRetry) {
        console.warn('Invalid JSON response, retrying with additional instruction...');
        return attempt(true);
      }
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}\nResponse: ${text.substring(0, 500)}`);
    }
  };

  // Use the retry wrapper for network/5xx errors
  return withRetry(() => attempt());
}

/**
 * Sanitize, repair and extract pure JSON from AI text responses
 */
export function parseAndRepairJson<T>(rawText: string): T {
  let text = rawText.trim();

  // 1. Remove markdown code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '');
    text = text.replace(/\s*```$/, '').trim();
  }

  // 2. Fast path: direct valid JSON
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue to repair
  }

  // 3. Strip any preamble before the first '[' or '{'
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');
  let startIdx = -1;
  let isArray = false;

  if (firstBracket !== -1 && firstBrace !== -1) {
    if (firstBracket < firstBrace) {
      startIdx = firstBracket;
      isArray = true;
    } else {
      startIdx = firstBrace;
      isArray = false;
    }
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    isArray = false;
  }

  if (startIdx > 0) {
    text = text.slice(startIdx).trim();
  }

  // Try parsing after removing preamble
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue to structural repair
  }

  // 4. Structural repair for truncated arrays
  if (isArray) {
    // Find the last complete top-level item closing brace '}'
    const lastValidCloseBrace = text.lastIndexOf('}');
    if (lastValidCloseBrace !== -1) {
      const repairedArray = text.slice(0, lastValidCloseBrace + 1) + ']';
      try {
        return JSON.parse(repairedArray) as T;
      } catch {
        // Continue
      }
    }
  } else {
    // Structural repair for truncated objects
    const openCount = (text.match(/{/g) || []).length;
    const closeCount = (text.match(/}/g) || []).length;
    if (openCount > closeCount) {
      const repairedObj = text + '}'.repeat(openCount - closeCount);
      try {
        return JSON.parse(repairedObj) as T;
      } catch {
        // Continue
      }
    }
  }

  // 5. Fallback: extract all individual valid JSON objects
  if (isArray) {
    const items: unknown[] = [];
    const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let match;
    while ((match = objRegex.exec(text)) !== null) {
      try {
        items.push(JSON.parse(match[0]));
      } catch {
        // Ignore unparseable snippet
      }
    }
    if (items.length > 0) {
      return items as unknown as T;
    }
  }

  // 6. Fallback for grade objects { "grades": [ ... ] }
  if (text.includes('"questionId"')) {
    const gradeItems: unknown[] = [];
    const qidPattern = /\{\s*"questionId"\s*:\s*"[^"]+"/g;
    let match;
    while ((match = qidPattern.exec(text)) !== null) {
      const start = match.index;
      let depth = 0;
      let end = -1;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end !== -1) {
        try {
          gradeItems.push(JSON.parse(text.slice(start, end + 1)));
        } catch {
          // Skip
        }
      }
    }
    if (gradeItems.length > 0) {
      return { grades: gradeItems, overallFeedback: 'Graded' } as unknown as T;
    }
  }

  throw new Error(`Invalid JSON syntax in model response: ${text.substring(0, 300)}`);
}

/**
 * Validate that the Gemini API key is configured
 */
export function validateApiKey(): void {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }
}
