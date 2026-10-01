'use client';

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Use local worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageLines: string[] = [];

    for (const item of content.items) {
      if ('str' in item && typeof item.str === 'string') {
        pageLines.push(item.str);
      }
    }

    pageTexts.push(pageLines.join(' '));
  }

  const fullText = pageTexts.join('\n\n').trim();

  if (!fullText) {
    throw new Error('No text could be extracted from this PDF. It may be a scanned/image-based document.');
  }

  return fullText;
}
