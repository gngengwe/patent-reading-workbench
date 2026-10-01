import { Claim, Passage, Section } from '../types';
import { tokenize, STOPWORDS } from './passages';

export function mapClaimsToPassages(
  claims: Claim[],
  passages: Passage[],
  sections: Section[]
): Claim[] {
  if (claims.length === 0 || passages.length === 0) return claims;

  // Build passage vectors
  const df: Record<string, number> = {};
  const totalDocs = passages.length;

  for (const p of passages) {
    const uniq = new Set(p.tokens);
    for (const t of uniq) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  const passageVectors = passages.map(p => {
    const tf: Record<string, number> = {};
    for (const t of p.tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }
    const vec: Record<string, number> = {};
    for (const [term, count] of Object.entries(tf)) {
      const idf = Math.log(totalDocs / (1 + (df[term] || 0)));
      vec[term] = (count / p.tokens.length) * idf;
    }
    return vec;
  });

  // Map each limitation to top passages
  return claims.map(claim => ({
    ...claim,
    limitations: claim.limitations.map(lim => {
      const limTokens = tokenize(lim.text);
      const limTf: Record<string, number> = {};
      for (const t of limTokens) {
        limTf[t] = (limTf[t] || 0) + 1;
      }
      const limVec: Record<string, number> = {};
      for (const [term, count] of Object.entries(limTf)) {
        const idf = Math.log(totalDocs / (1 + (df[term] || 0)));
        limVec[term] = (count / limTokens.length) * idf;
      }

      // Score against each passage
      const scored = passages.map((p, idx) => {
        const sim = cosine(limVec, passageVectors[idx]);

        // Find shared non-trivial terms
        const sharedTerms = limTokens.filter(
          t => !STOPWORDS.has(t) && p.tokens.includes(t)
        );
        const uniqueShared = [...new Set(sharedTerms)];

        const section = sections.find(s => s.id === p.sectionId);
        const rationale = uniqueShared.length > 0
          ? `Shared phrases: ${uniqueShared.slice(0, 5).join(', ')}`
          : 'Weak semantic overlap';

        return {
          passageId: p.id,
          score: sim,
          rationale,
          sectionName: section?.name || 'Unknown',
        };
      });

      // Top 3 mappings
      const top = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .filter(m => m.score > 0.05);

      return {
        ...lim,
        mappedPassages: top.map(({ passageId, score, rationale }) => ({
          passageId,
          score,
          rationale,
        })),
      };
    }),
  }));
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of allKeys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
