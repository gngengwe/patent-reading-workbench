export interface PatentDoc {
  id: string;
  title?: string;
  rawText: string;
  sections: Section[];
  claims: Claim[];
  passages: Passage[];
}

export interface Section {
  id: string;
  name: string;
  startIdx: number;
  endIdx: number;
}

export interface Passage {
  id: string;
  sectionId: string;
  text: string;
  tokens: string[];
  keyPhrases: string[];
  noveltyScore: number;
  boilerplateScore: number;
}

export interface Cluster {
  id: string;
  label: string;
  passageIds: string[];
  summary: string;
  redundancyScore: number;
}

export interface Claim {
  id: string;
  number: number;
  text: string;
  limitations: Limitation[];
}

export interface Limitation {
  id: string;
  text: string;
  mappedPassages: {
    passageId: string;
    score: number;
    rationale: string;
  }[];
}

export interface Snippet {
  id: string;
  text: string;
  source: {
    sectionName?: string;
    passageId?: string;
    claimId?: string;
  };
  tags: string[];
  pinned: boolean;
  createdAt: number;
}

export type BoilerplateLabel = 'Boilerplate' | 'Mixed' | 'Substantive';

export function getBoilerplateLabel(score: number): BoilerplateLabel {
  if (score >= 0.6) return 'Boilerplate';
  if (score >= 0.3) return 'Mixed';
  return 'Substantive';
}
