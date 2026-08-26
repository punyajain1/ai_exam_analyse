/**
 * Image cropping utility for extracting answer regions from answer sheets
 */

import { createCanvas, loadImage, Image } from 'canvas';

/**
 * Crop an image using normalized bounding box coordinates
 * 
 * @param imageBase64 - Base64-encoded source image (without data URI prefix)
 * @param box_2d - Bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000 scale
 * @returns Base64-encoded cropped image (without data URI prefix)
 */
export async function cropImage(
  imageBase64: string,
  box_2d: [number, number, number, number]
): Promise<string> {
  try {
    // Remove data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Load the source image
    const buffer = Buffer.from(base64Data, 'base64');
    const image: Image = await loadImage(buffer);
    
    const imgWidth = image.width;
    const imgHeight = image.height;
    
    // Denormalize coordinates from 0-1000 scale to actual pixel values
    const [ymin, xmin, ymax, xmax] = box_2d;
    
    const x = Math.floor((xmin / 1000) * imgWidth);
    const y = Math.floor((ymin / 1000) * imgHeight);
    const width = Math.floor(((xmax - xmin) / 1000) * imgWidth);
    const height = Math.floor(((ymax - ymin) / 1000) * imgHeight);
    
    // Ensure dimensions are positive
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid crop dimensions: width=${width}, height=${height}`);
    }
    
    // Create canvas with cropped dimensions
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped region
    ctx.drawImage(
      image,
      x, y, width, height,  // source rectangle
      0, 0, width, height   // destination rectangle
    );
    
    // Convert to base64 PNG
    const croppedBase64 = canvas.toBuffer('image/png').toString('base64');
    
    return croppedBase64;
  } catch (error) {
    throw new Error(`Failed to crop image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Crop multiple regions from the same image
 * 
 * @param imageBase64 - Base64-encoded source image
 * @param boxes - Array of bounding boxes to crop
 * @returns Array of base64-encoded cropped images
 */
export async function cropMultipleRegions(
  imageBase64: string,
  boxes: Array<[number, number, number, number]>
): Promise<string[]> {
  const crops: string[] = [];
  
  for (const box of boxes) {
    const cropped = await cropImage(imageBase64, box);
    crops.push(cropped);
  }
  
  return crops;
}

/**
 * Configurable thresholds for non-blank / ink density validation
 */
export const MIN_INK_COVERAGE_THRESHOLD = 0.012; // 1.2% minimum ink coverage to be considered non-blank
export const INK_LUMINANCE_THRESHOLD = 200; // Pixels with luminance < 200 are counted as ink/content

export interface BlankCheckResult {
  isBlank: boolean;
  inkCoverage: number; // 0.0 to 1.0 (percentage of pixels with ink)
  totalPixels: number;
  inkPixels: number;
}

/**
 * Check if a bounding box region in an image is likely blank (insufficient ink/handwriting).
 * Standalone pure/deterministic function for non-AI grounding verification.
 * 
 * @param imageInput - Base64-encoded image string or Buffer
 * @param box_2d - [ymin, xmin, ymax, xmax] normalized to 0-1000 scale
 * @param minCoverageThreshold - Minimum ink coverage ratio (defaults to MIN_INK_COVERAGE_THRESHOLD)
 */
export async function isRegionLikelyBlank(
  imageInput: string | Buffer,
  box_2d: [number, number, number, number],
  minCoverageThreshold: number = MIN_INK_COVERAGE_THRESHOLD
): Promise<BlankCheckResult> {
  try {
    let buffer: Buffer;
    if (typeof imageInput === 'string') {
      const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = imageInput;
    }

    const image: Image = await loadImage(buffer);
    const imgWidth = image.width;
    const imgHeight = image.height;

    const [ymin, xmin, ymax, xmax] = box_2d;
    const x = Math.max(0, Math.floor((xmin / 1000) * imgWidth));
    const y = Math.max(0, Math.floor((ymin / 1000) * imgHeight));
    const width = Math.max(1, Math.floor(((xmax - xmin) / 1000) * imgWidth));
    const height = Math.max(1, Math.floor(((ymax - ymin) / 1000) * imgHeight));

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw the cropped region
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const totalPixels = width * height;
    let inkPixels = 0;

    // Scan pixels: compute luminance
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // If pixel is transparent, skip
      if (alpha < 50) continue;

      // Standard grayscale luminance formula
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      if (luminance < INK_LUMINANCE_THRESHOLD) {
        inkPixels++;
      }
    }

    const inkCoverage = totalPixels > 0 ? inkPixels / totalPixels : 0;
    const isBlank = inkCoverage < minCoverageThreshold;

    return {
      isBlank,
      inkCoverage,
      totalPixels,
      inkPixels,
    };
  } catch (error) {
    console.warn('Error during blank region check:', error);
    // If check fails unexpectedly, do not block pipeline but mark as not blank
    return {
      isBlank: false,
      inkCoverage: 1.0,
      totalPixels: 0,
      inkPixels: 0,
    };
  }
}

/**
 * Validate that a bounding box is within valid range
 * 
 * @param box_2d - Bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000 scale
 * @returns true if valid, false otherwise
 */
export function validateBoundingBox(box_2d: [number, number, number, number]): boolean {
  const [ymin, xmin, ymax, xmax] = box_2d;
  
  // Check all values are within 0-1000 range
  if (ymin < 0 || ymin > 1000 || xmin < 0 || xmin > 1000 ||
      ymax < 0 || ymax > 1000 || xmax < 0 || xmax > 1000) {
    return false;
  }
  
  // Check min < max
  if (ymin >= ymax || xmin >= xmax) {
    return false;
  }
  
  return true;
}
