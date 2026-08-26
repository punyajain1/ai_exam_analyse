/**
 * Client-side PDF and Image utilities for rendering and cropping pages
 */

import { PageImage } from './types';

/**
 * Configure PDF.js worker dynamically in browser
 */
async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '3.11.174'}/build/pdf.worker.min.js`;
  }
  return pdfjs;
}

/**
 * Convert an uploaded File (PDF or Image) into an array of base64 PNG PageImages
 */
export async function convertFileToPageImages(
  file: File,
  scale: number = 1.5
): Promise<PageImage[]> {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

  if (isImage) {
    const dataUrl = await readFileAsDataUrl(file);
    return [{ page: 0, imageBase64: dataUrl }];
  }

  // Treat as PDF
  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pageImages: PageImage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to create canvas 2D context for PDF rendering');
      }

      // Render white background first (in case PDF has transparent background)
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/png', 0.92);

      pageImages.push({
        page: pageNum - 1, // 0-based index
        imageBase64: dataUrl,
      });
    }

    return pageImages;
  } catch (error) {
    console.error('Error rendering PDF with PDF.js:', error);
    throw new Error(
      `Failed to process PDF "${file.name}": ${error instanceof Error ? error.message : 'Unknown rendering error'}`
    );
  }
}

/**
 * Get total page count of a File
 */
export async function getFilePageCount(file: File): Promise<number> {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
  if (isImage) return 1;

  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    return pdfDoc.numPages;
  } catch {
    return 1;
  }
}

/**
 * Read a File object as base64 data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Crop an answer region from a page base64 image on the client
 * @param pageBase64 - Base64 image data URL of the page
 * @param box_2d - [ymin, xmin, ymax, xmax] in 0-1000 scale
 */
export function cropAnswerRegionClient(
  pageBase64: string,
  box_2d: [number, number, number, number]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const [ymin, xmin, ymax, xmax] = box_2d;
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        // Calculate pixel coordinates with padding
        const padX = (xmax - xmin) * 0.03;
        const padY = (ymax - ymin) * 0.03;

        const safeXmin = Math.max(0, xmin - padX);
        const safeYmin = Math.max(0, ymin - padY);
        const safeXmax = Math.min(1000, xmax + padX);
        const safeYmax = Math.min(1000, ymax + padY);

        const x = Math.floor((safeXmin / 1000) * imgWidth);
        const y = Math.floor((safeYmin / 1000) * imgHeight);
        const w = Math.max(10, Math.floor(((safeXmax - safeXmin) / 1000) * imgWidth));
        const h = Math.max(10, Math.floor(((safeYmax - safeYmin) / 1000) * imgHeight));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to create 2D context for crop');
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

        const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(croppedDataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = pageBase64;
  });
}

/**
 * Crop multiple answer regions across pages and composite them vertically
 */
export async function cropMultiRegionAnswerClient(
  pages: Array<{ page: number; imageBase64: string }>,
  regions: Array<{ page: number; box_2d: [number, number, number, number] }>
): Promise<string> {
  if (!regions || regions.length === 0) throw new Error('No regions to crop');
  if (regions.length === 1) {
    const pageObj = pages.find((p) => p.page === regions[0].page) || pages[regions[0].page];
    if (!pageObj) throw new Error('Page not found');
    return cropAnswerRegionClient(pageObj.imageBase64, regions[0].box_2d);
  }

  // Crop all regions
  const cropDataUrls: string[] = [];
  for (const r of regions) {
    const pageObj = pages.find((p) => p.page === r.page) || pages[r.page];
    if (pageObj) {
      try {
        const crop = await cropAnswerRegionClient(pageObj.imageBase64, r.box_2d);
        cropDataUrls.push(crop);
      } catch (err) {
        console.warn('Failed to crop region on page', r.page, err);
      }
    }
  }

  if (cropDataUrls.length === 0) throw new Error('Failed to crop any regions');
  if (cropDataUrls.length === 1) return cropDataUrls[0];

  // Composite them vertically on canvas
  const loadedImages: HTMLImageElement[] = await Promise.all(
    cropDataUrls.map(
      (src) =>
        new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = src;
        })
    )
  );

  const maxWidth = Math.max(...loadedImages.map((img) => img.width));
  const totalHeight = loadedImages.reduce((sum, img) => sum + img.height + 20, 0);

  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return cropDataUrls[cropDataUrls.length - 1]; // Fallback to final solution crop
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, maxWidth, totalHeight);

  let currentY = 0;
  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    ctx.drawImage(img, 0, currentY);
    currentY += img.height;

    if (i < loadedImages.length - 1) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, currentY + 10);
      ctx.lineTo(maxWidth, currentY + 10);
      ctx.stroke();
      currentY += 20;
    }
  }

  return canvas.toDataURL('image/png', 0.95);
}

