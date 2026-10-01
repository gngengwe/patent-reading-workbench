import { Section } from '../types';
import { generateId } from '../utils';

const KNOWN_HEADINGS = [
  'abstract',
  'background',
  'background of the invention',
  'field of the invention',
  'summary',
  'summary of the invention',
  'brief description of the drawings',
  'brief description of the figures',
  'detailed description',
  'detailed description of the invention',
  'detailed description of the preferred embodiments',
  'description of the preferred embodiments',
  'claims',
  'what is claimed is',
];

export function detectSections(rawText: string): Section[] {
  const lines = rawText.split('\n');
  const sections: Section[] = [];
  let currentCharIdx = 0;

  const headingIndices: { name: string; lineIdx: number; charIdx: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase().replace(/[:\-—]/g, '').trim();

    for (const heading of KNOWN_HEADINGS) {
      if (lineLower === heading || lineLower === heading.toUpperCase().toLowerCase()) {
        headingIndices.push({
          name: formatHeadingName(lineLower),
          lineIdx: i,
          charIdx: currentCharIdx,
        });
        break;
      }
    }
    currentCharIdx += lines[i].length + 1; // +1 for \n
  }

  if (headingIndices.length === 0) {
    return createFallbackSections(rawText);
  }

  for (let i = 0; i < headingIndices.length; i++) {
    const start = headingIndices[i].charIdx;
    const end = i + 1 < headingIndices.length
      ? headingIndices[i + 1].charIdx
      : rawText.length;

    sections.push({
      id: generateId(),
      name: headingIndices[i].name,
      startIdx: start,
      endIdx: end,
    });
  }

  // If text before the first heading, add as "Preamble"
  if (headingIndices[0].charIdx > 0) {
    const preambleText = rawText.substring(0, headingIndices[0].charIdx).trim();
    if (preambleText.length > 50) {
      sections.unshift({
        id: generateId(),
        name: 'Preamble',
        startIdx: 0,
        endIdx: headingIndices[0].charIdx,
      });
    }
  }

  return sections;
}

function formatHeadingName(heading: string): string {
  return heading
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function createFallbackSections(rawText: string): Section[] {
  const CHUNK_SIZE = 3000;
  const sections: Section[] = [];
  let idx = 0;
  let sectionNum = 1;

  while (idx < rawText.length) {
    let end = Math.min(idx + CHUNK_SIZE, rawText.length);
    // Try to break at a paragraph boundary
    if (end < rawText.length) {
      const nextParagraph = rawText.indexOf('\n\n', end - 200);
      if (nextParagraph !== -1 && nextParagraph < end + 500) {
        end = nextParagraph;
      }
    }

    sections.push({
      id: generateId(),
      name: `Section ${sectionNum}`,
      startIdx: idx,
      endIdx: end,
    });

    idx = end;
    sectionNum++;
  }

  return sections;
}

export function extractTitle(rawText: string): string | undefined {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  // Often the first non-empty line is the title, or look for common patterns
  for (const line of lines.slice(0, 10)) {
    if (line.length > 10 && line.length < 200 && !line.toLowerCase().startsWith('abstract')) {
      // Check it's not a patent number pattern
      if (!/^(us|ep|wo|cn)\s?\d/i.test(line) && !/^\d{1,3}\.\s/.test(line)) {
        return line;
      }
    }
  }
  return undefined;
}
