import { Passage, Section } from '../types';
import { generateId } from '../utils';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
  'not', 'so', 'than', 'too', 'very', 'just', 'about', 'up', 'down',
  'each', 'every', 'all', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'only', 'same', 'that', 'this', 'these', 'those', 'it',
  'its', 'also', 'which', 'who', 'whom', 'what', 'when', 'where', 'how',
  'if', 'while', 'because', 'although', 'though', 'since', 'whether',
  'there', 'here', 'their', 'they', 'them', 'he', 'she', 'his', 'her',
  'we', 'our', 'us', 'you', 'your', 'one', 'two', 'first', 'second',
  'new', 'used', 'use', 'using', 'said', 'according', 'based', 'include',
  'includes', 'including', 'included', 'example', 'embodiment', 'embodiments',
  'present', 'invention', 'disclosure', 'figure', 'fig', 'step', 'method',
  'system', 'device', 'apparatus',
]);

const BOILERPLATE_PHRASES = [
  'may be implemented in hardware',
  'may be implemented in software',
  'computer-readable medium',
  'computer readable medium',
  'one or more processors',
  'not limited to',
  'in some embodiments',
  'in certain embodiments',
  'in various embodiments',
  'the present disclosure',
  'the present invention',
  'those skilled in the art',
  'it will be appreciated',
  'it should be understood',
  'it is to be understood',
  'without departing from the scope',
  'without departing from the spirit',
  'within the scope of',
  'for illustrative purposes',
  'by way of example',
  'as will be appreciated',
  'as is known in the art',
  'general purpose computer',
  'non-transitory computer',
  'machine-readable',
  'storage medium',
  'operating system',
  'random access memory',
  'read only memory',
];

const BOILERPLATE_WEAK = [
  'for example',
  'such as',
  'in one embodiment',
  'in an embodiment',
  'may include',
  'can include',
  'may be',
];

const NOVELTY_CUES = [
  'technical problem',
  'technical challenge',
  'solves',
  'addresses',
  'overcomes',
  'improves',
  'reduces',
  'increases efficiency',
  'advantage',
  'benefit',
  'unlike conventional',
  'prior approaches',
  'prior art',
  'conventional systems',
  'existing solutions',
  'novel',
  'innovative',
  'unique',
  'improved',
  'enhanced',
  'superior',
  'technical effect',
  'technical improvement',
  'enables',
  'achieves',
  'surprisingly',
  'unexpectedly',
];

export function createPassages(rawText: string, sections: Section[]): Passage[] {
  const passages: Passage[] = [];

  for (const section of sections) {
    // Skip claims section for passages
    if (section.name.toLowerCase().includes('claim')) continue;

    const sectionText = rawText.substring(section.startIdx, section.endIdx);
    const paragraphs = splitIntoParagraphs(sectionText);

    for (const para of paragraphs) {
      if (para.trim().length < 30) continue;

      const chunks = chunkText(para, 800, 1200);
      for (const chunk of chunks) {
        const tokens = tokenize(chunk);
        const keyPhrases = extractKeyPhrases(tokens, chunk);
        const noveltyScore = computeNoveltyScore(chunk);
        const boilerplateScore = computeBoilerplateScore(chunk);

        passages.push({
          id: generateId(),
          sectionId: section.id,
          text: chunk,
          tokens,
          keyPhrases,
          noveltyScore,
          boilerplateScore,
        });
      }
    }
  }

  return passages;
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function chunkText(text: string, minLen: number, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Find a good break point
    let breakAt = maxLen;
    const sentenceEnd = remaining.lastIndexOf('. ', maxLen);
    if (sentenceEnd > minLen) {
      breakAt = sentenceEnd + 1;
    } else {
      const spaceIdx = remaining.lastIndexOf(' ', maxLen);
      if (spaceIdx > minLen / 2) {
        breakAt = spaceIdx;
      }
    }

    chunks.push(remaining.substring(0, breakAt).trim());
    remaining = remaining.substring(breakAt).trim();
  }

  return chunks;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function extractKeyPhrases(tokens: string[], text: string): string[] {
  // Simple frequency-based extraction
  const freq: Record<string, number> = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  // Also extract bigrams
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOPWORDS.has(words[i]) && !STOPWORDS.has(words[i + 1])) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      freq[bigram] = (freq[bigram] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase]) => phrase);
}

function computeBoilerplateScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  let matches = 0;

  for (const phrase of BOILERPLATE_PHRASES) {
    if (lower.includes(phrase)) {
      score += 0.15;
      matches++;
    }
  }

  for (const phrase of BOILERPLATE_WEAK) {
    if (lower.includes(phrase)) {
      score += 0.05;
      matches++;
    }
  }

  // Check for generic computing environment descriptions
  const genericTerms = ['cpu', 'processor', 'memory', 'network', 'bus', 'display', 'input', 'output', 'interface', 'module'];
  let genericCount = 0;
  for (const term of genericTerms) {
    if (lower.includes(term)) genericCount++;
  }
  if (genericCount >= 4) score += 0.2;

  return Math.min(score, 1.0);
}

function computeNoveltyScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  for (const cue of NOVELTY_CUES) {
    if (lower.includes(cue)) {
      score += 0.12;
    }
  }

  // Boost for comparative language
  if (/compared to|in contrast|whereas|however|instead of/i.test(text)) {
    score += 0.1;
  }

  // Boost for specific quantitative claims
  if (/\d+\s*%|\d+x|\d+\s*times/i.test(text)) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}

// Export for use in clustering
export { STOPWORDS };
