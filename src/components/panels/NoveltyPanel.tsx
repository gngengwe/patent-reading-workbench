'use client';

import { Sparkles, Copy, Plus, ExternalLink } from 'lucide-react';
import { PatentDoc } from '@/lib/types';
import { useState } from 'react';

const NOVELTY_CUES_DISPLAY: Record<string, string> = {
  'technical problem': 'Identifies technical problem',
  'solves': 'Solving language',
  'addresses': 'Addressing a challenge',
  'overcomes': 'Overcoming limitation',
  'improves': 'Improvement claim',
  'reduces': 'Reduction/efficiency',
  'increases efficiency': 'Efficiency gain',
  'advantage': 'States advantage',
  'benefit': 'States benefit',
  'unlike conventional': 'Distinguishes from prior art',
  'prior approaches': 'References prior approaches',
  'prior art': 'References prior art',
  'novel': 'Novelty language',
  'innovative': 'Innovation language',
  'unique': 'Uniqueness claim',
  'improved': 'Improvement claim',
  'enhanced': 'Enhancement claim',
  'superior': 'Superiority claim',
  'technical effect': 'Technical effect',
  'technical improvement': 'Technical improvement',
  'enables': 'Enablement language',
  'achieves': 'Achievement language',
  'surprisingly': 'Unexpected result',
  'unexpectedly': 'Unexpected result',
};

interface NoveltyPanelProps {
  doc: PatentDoc;
  onAddSnippet: (text: string, source: { sectionName?: string; passageId?: string }) => void;
  onHighlight: (ids: string[]) => void;
}

export default function NoveltyPanel({ doc, onAddSnippet, onHighlight }: NoveltyPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get top passages by novelty score
  const noveltyCards = doc.passages
    .filter(p => p.noveltyScore > 0.05)
    .sort((a, b) => b.noveltyScore - a.noveltyScore)
    .slice(0, 20);

  const getSection = (sId: string) => doc.sections.find(s => s.id === sId);

  const detectCues = (text: string): string[] => {
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const [cue, label] of Object.entries(NOVELTY_CUES_DISPLAY)) {
      if (lower.includes(cue)) {
        found.push(label);
      }
    }
    return [...new Set(found)];
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleAddAllPassages = (passageIds: string[]) => {
    for (const pid of passageIds) {
      const p = doc.passages.find(x => x.id === pid);
      if (p) {
        const section = getSection(p.sectionId);
        onAddSnippet(p.text, { sectionName: section?.name, passageId: p.id });
      }
    }
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h2 className="text-base font-semibold mb-1 text-text-primary flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-novelty" />
        Novelty Signals
      </h2>
      <p className="text-xs text-text-muted mb-4">
        Passages ranked by novelty indicators — language that suggests inventive contribution.
      </p>

      {noveltyCards.length === 0 ? (
        <div className="text-sm text-text-muted text-center py-12">
          No strong novelty signals detected. Try loading a patent with inventive claims.
        </div>
      ) : (
        <div className="grid gap-3">
          {noveltyCards.map(passage => {
            const section = getSection(passage.sectionId);
            const cues = detectCues(passage.text);
            const headline = passage.keyPhrases[0] || 'Signal';

            return (
              <div
                key={passage.id}
                className="bg-surface-2 border border-border rounded-lg p-4 hover:border-novelty/40 transition-colors group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary capitalize mb-0.5">
                      {headline}
                    </h3>
                    <span className="text-[10px] text-text-muted">{section?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-novelty/20 text-novelty font-medium">
                      {(passage.noveltyScore * 100).toFixed(0)}% novel
                    </span>
                  </div>
                </div>

                {/* Cues */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {cues.map(cue => (
                    <span
                      key={cue}
                      className="text-[9px] px-1.5 py-0.5 bg-novelty/10 text-novelty/80 rounded border border-novelty/20"
                    >
                      {cue}
                    </span>
                  ))}
                </div>

                {/* Text */}
                <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                  {passage.text.substring(0, 350)}
                  {passage.text.length > 350 && '...'}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(passage.text, passage.id)}
                    className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedId === passage.id ? 'Copied!' : 'Copy card'}
                  </button>
                  <button
                    onClick={() => onAddSnippet(passage.text, {
                      sectionName: section?.name,
                      passageId: passage.id,
                    })}
                    className="flex items-center gap-1 text-[10px] text-accent-bright hover:text-accent transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add to Snippets
                  </button>
                  <button
                    onClick={() => onHighlight([passage.id])}
                    className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Highlight
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
