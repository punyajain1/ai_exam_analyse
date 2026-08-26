/**
 * Groq AI client configuration and multimodal utilities
 */

import { parseAndRepairJson, withRetry } from './client';

export interface GroqMessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

function isGroqVisionModel(model: string): boolean {
  const m = model.toLowerCase();
  return m.includes('vision') || m.includes('vl') || m.includes('llava');
}

/**
 * Call Groq API with structured JSON output and optional multimodal image support
 * 
 * @param prompt - Text prompt
 * @param images - Array of base64-encoded images
 * @param modelName - Groq model (e.g. 'openai/gpt-oss-120b', 'llama-3.2-90b-vision-preview', 'llama-3.3-70b-versatile')
 */
export async function callGroqWithJSON<T>(
  prompt: string,
  images?: string[],
  modelName: string = process.env.GROQ_GRADE_MODEL || 'openai/gpt-oss-120b'
): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }

  const attempt = async (): Promise<T> => {
    const supportsVision = isGroqVisionModel(modelName);
    let userContent: string | GroqMessageContentPart[] = prompt;

    if (supportsVision && images && images.length > 0) {
      const contentParts: GroqMessageContentPart[] = [];

      contentParts.push({
        type: 'text',
        text: `${prompt}\n\nIMPORTANT: Respond with valid, pure JSON only matching the requested schema. No markdown formatting, no commentary outside the JSON object.`,
      });

      for (const imgBase64 of images) {
        const cleanBase64 = imgBase64.startsWith('data:')
          ? imgBase64
          : `data:image/png;base64,${imgBase64}`;

        contentParts.push({
          type: 'image_url',
          image_url: {
            url: cleanBase64,
          },
        });
      }
      userContent = contentParts;
    } else {
      userContent = `${prompt}\n\nIMPORTANT: Respond with valid, pure JSON only matching the requested schema. No markdown formatting, no commentary outside the JSON object.`;
    }

    const payload = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');

      if (response.status === 429) {
        let waitMs = 5000;
        const retryHeader = response.headers.get('retry-after');
        if (retryHeader) {
          waitMs = Math.ceil(parseFloat(retryHeader) * 1000) + 500;
        } else {
          const match = errBody.match(/try again in ([\d.]+)s/i);
          if (match) {
            waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 600;
          }
        }
        console.warn(`[Groq Rate Limit] 429 Tokens/Requests limit reached. Waiting ${(waitMs / 1000).toFixed(1)}s before retry...`);
        await new Promise(r => setTimeout(r, waitMs));
      }

      throw new Error(`Groq API Error (${response.status} ${response.statusText}): ${errBody}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';

    if (!rawText) {
      throw new Error('Groq returned an empty response.');
    }

    return parseAndRepairJson<T>(rawText);
  };

  return withRetry(() => attempt(), 4, 1500);
}
