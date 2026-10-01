import { PatentDoc, Cluster } from '../types';
import { generateId } from '../utils';
import { detectSections, extractTitle } from './sectioning';
import { extractClaims } from './claims';
import { createPassages } from './passages';
import { clusterPassages } from './clustering';
import { mapClaimsToPassages } from './mapping';

export interface ProcessingResult {
  doc: PatentDoc;
  clusters: Cluster[];
}

export function processPatentText(rawText: string, similarityThreshold: number = 0.4): ProcessingResult {
  const title = extractTitle(rawText);
  const sections = detectSections(rawText);
  const passages = createPassages(rawText, sections);
  let claims = extractClaims(rawText, sections);
  claims = mapClaimsToPassages(claims, passages, sections);
  const clusters = clusterPassages(passages, similarityThreshold);

  const doc: PatentDoc = {
    id: generateId(),
    title,
    rawText,
    sections,
    claims,
    passages,
  };

  return { doc, clusters };
}
