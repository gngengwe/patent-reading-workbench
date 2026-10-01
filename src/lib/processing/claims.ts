import { Claim, Limitation, Section } from '../types';
import { generateId } from '../utils';

export function extractClaims(rawText: string, sections: Section[]): Claim[] {
  // Find claims section
  const claimsSection = sections.find(
    s => s.name.toLowerCase().includes('claim') || s.name.toLowerCase().includes('what is claimed')
  );

  let claimsText: string;
  if (claimsSection) {
    claimsText = rawText.substring(claimsSection.startIdx, claimsSection.endIdx);
  } else {
    // Try to find claims in the raw text
    const claimsMatch = rawText.match(/(?:CLAIMS|What is claimed is)[:\s]*([\s\S]*?)$/i);
    if (!claimsMatch) return [];
    claimsText = claimsMatch[1];
  }

  const claims: Claim[] = [];
  // Match claim numbering: "1.", "1:", "1 )", "1)"
  const claimPattern = /(?:^|\n)\s*(\d+)\s*[.):]\s*([\s\S]*?)(?=(?:\n\s*\d+\s*[.):])|\s*$)/g;

  let match;
  while ((match = claimPattern.exec(claimsText)) !== null) {
    const number = parseInt(match[1], 10);
    const text = match[2].trim().replace(/\s+/g, ' ');

    if (text.length < 10) continue;

    const limitations = parseLimitations(text);

    claims.push({
      id: generateId(),
      number,
      text,
      limitations,
    });
  }

  // If regex didn't catch anything, try a simpler split approach
  if (claims.length === 0) {
    const lines = claimsText.split('\n');
    let currentClaimNum = 0;
    let currentClaimText = '';

    for (const line of lines) {
      const numMatch = line.trim().match(/^(\d+)\s*[.):]?\s*(.*)/);
      if (numMatch) {
        if (currentClaimNum > 0 && currentClaimText.trim().length > 10) {
          claims.push({
            id: generateId(),
            number: currentClaimNum,
            text: currentClaimText.trim(),
            limitations: parseLimitations(currentClaimText.trim()),
          });
        }
        currentClaimNum = parseInt(numMatch[1], 10);
        currentClaimText = numMatch[2] || '';
      } else {
        currentClaimText += ' ' + line.trim();
      }
    }
    // Push last claim
    if (currentClaimNum > 0 && currentClaimText.trim().length > 10) {
      claims.push({
        id: generateId(),
        number: currentClaimNum,
        text: currentClaimText.trim(),
        limitations: parseLimitations(currentClaimText.trim()),
      });
    }
  }

  return claims;
}

function parseLimitations(claimText: string): Limitation[] {
  // Split on semicolons, "wherein", "whereby", and major clause boundaries
  const parts = claimText
    .split(/;\s*|(?:\s+wherein\s+)|(?:\s+whereby\s+)|(?:\s+comprising\s*:\s*)/i)
    .map(p => p.trim())
    .filter(p => p.length > 10);

  return parts.map(text => ({
    id: generateId(),
    text,
    mappedPassages: [],
  }));
}
