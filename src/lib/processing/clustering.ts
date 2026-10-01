import { Cluster, Passage } from '../types';
import { generateId } from '../utils';
import { STOPWORDS } from './passages';

interface TfIdfVector {
  [term: string]: number;
}

export function clusterPassages(passages: Passage[], similarityThreshold: number = 0.4): Cluster[] {
  if (passages.length === 0) return [];

  // Build document frequencies
  const df: Record<string, number> = {};
  const totalDocs = passages.length;

  for (const p of passages) {
    const uniqueTokens = new Set(p.tokens);
    for (const t of uniqueTokens) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  // Build TF-IDF vectors
  const vectors: TfIdfVector[] = passages.map(p => {
    const tf: Record<string, number> = {};
    for (const t of p.tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }
    const vec: TfIdfVector = {};
    for (const [term, count] of Object.entries(tf)) {
      const idf = Math.log(totalDocs / (1 + (df[term] || 0)));
      vec[term] = (count / p.tokens.length) * idf;
    }
    return vec;
  });

  // Greedy clustering
  const clusters: Cluster[] = [];
  const assigned = new Set<number>();

  // Sort by novelty descending, then by length
  const indices = passages
    .map((_, i) => i)
    .sort((a, b) => {
      const scoreDiff = passages[b].noveltyScore - passages[a].noveltyScore;
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
      return passages[b].text.length - passages[a].text.length;
    });

  for (const idx of indices) {
    if (assigned.has(idx)) continue;

    const cluster: number[] = [idx];
    assigned.add(idx);

    for (let j = 0; j < passages.length; j++) {
      if (assigned.has(j)) continue;

      const sim = cosineSimilarity(vectors[idx], vectors[j]);
      if (sim >= similarityThreshold) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    if (cluster.length > 0) {
      const clusterPassagesList = cluster.map(i => passages[i]);
      const label = generateClusterLabel(clusterPassagesList);
      const summary = generateSummary(clusterPassagesList);
      const redundancyScore = computeRedundancyScore(cluster, vectors);

      clusters.push({
        id: generateId(),
        label,
        passageIds: cluster.map(i => passages[i].id),
        summary,
        redundancyScore,
      });
    }
  }

  return clusters.sort((a, b) => b.passageIds.length - a.passageIds.length);
}

function cosineSimilarity(a: TfIdfVector, b: TfIdfVector): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const allTerms = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const term of allTerms) {
    const va = a[term] || 0;
    const vb = b[term] || 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function generateClusterLabel(passages: Passage[]): string {
  // Aggregate key phrases
  const phraseFreq: Record<string, number> = {};
  for (const p of passages) {
    for (const kp of p.keyPhrases) {
      if (!STOPWORDS.has(kp)) {
        phraseFreq[kp] = (phraseFreq[kp] || 0) + 1;
      }
    }
  }

  const topPhrases = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([phrase]) => phrase);

  if (topPhrases.length === 0) return 'General';
  return topPhrases.join(', ');
}

function generateSummary(passages: Passage[]): string {
  // Pick the passage with highest novelty, then take first 2-3 sentences
  const best = [...passages].sort((a, b) => b.noveltyScore - a.noveltyScore)[0];
  const sentences = best.text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 3).join(' ');
}

function computeRedundancyScore(indices: number[], vectors: TfIdfVector[]): number {
  if (indices.length <= 1) return 0;

  let totalSim = 0;
  let pairs = 0;

  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      totalSim += cosineSimilarity(vectors[indices[i]], vectors[indices[j]]);
      pairs++;
    }
  }

  const avgSim = pairs > 0 ? totalSim / pairs : 0;
  // Scale by cluster size
  const sizeBoost = Math.min(indices.length / 5, 1);
  return Math.min(avgSim * 0.7 + sizeBoost * 0.3, 1.0);
}

// Export for claim mapping
export { cosineSimilarity, type TfIdfVector };
