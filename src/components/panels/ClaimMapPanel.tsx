'use client';

import { useState } from 'react';
import { Map, ChevronRight, Plus } from 'lucide-react';
import { PatentDoc, Claim, Limitation } from '@/lib/types';

interface ClaimMapPanelProps {
  doc: PatentDoc;
  onAddSnippet: (text: string, source: { sectionName?: string; passageId?: string; claimId?: string }) => void;
  onHighlight: (ids: string[]) => void;
}

export default function ClaimMapPanel({ doc, onAddSnippet, onHighlight }: ClaimMapPanelProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedLimitationId, setSelectedLimitationId] = useState<string | null>(null);

  const selectedClaim = doc.claims.find(c => c.id === selectedClaimId);

  const getPassage = (id: string) => doc.passages.find(p => p.id === id);
  const getSection = (sId: string) => doc.sections.find(s => s.id === sId);

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.3) return { label: 'High', color: 'bg-success/20 text-success' };
    if (score >= 0.15) return { label: 'Medium', color: 'bg-warning/20 text-warning' };
    return { label: 'Low', color: 'bg-danger/20 text-danger' };
  };

  return (
    <div className="flex h-full">
      {/* Claims list */}
      <div className="w-56 border-r border-border overflow-y-auto p-3 shrink-0">
        <h2 className="text-base font-semibold mb-3 text-text-primary flex items-center gap-2">
          <Map className="w-4 h-4 text-accent-bright" />
          Claims
        </h2>

        {doc.claims.length === 0 ? (
          <p className="text-xs text-text-muted py-4">No claims detected in the document.</p>
        ) : (
          <div className="space-y-1">
            {doc.claims.map(claim => (
              <button
                key={claim.id}
                onClick={() => {
                  setSelectedClaimId(claim.id);
                  setSelectedLimitationId(null);
                }}
                className={`w-full text-left p-2 rounded-md transition-colors text-xs ${
                  selectedClaimId === claim.id
                    ? 'bg-accent/15 text-accent-bright glow-sm'
                    : 'text-text-secondary hover:bg-surface-2'
                }`}
              >
                <span className="font-medium">Claim {claim.number}</span>
                <p className="text-[10px] text-text-muted mt-0.5 truncate">
                  {claim.text.substring(0, 60)}...
                </p>
                <span className="text-[10px] text-text-muted">
                  {claim.limitations.length} limitations
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Claim detail + limitations */}
      {selectedClaim ? (
        <>
          <div className="w-80 border-r border-border overflow-y-auto p-4 shrink-0">
            <h3 className="text-sm font-semibold mb-2 text-text-primary">
              Claim {selectedClaim.number}
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-4 bg-surface-2 p-3 rounded-lg border border-border">
              {selectedClaim.text}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              Limitations ({selectedClaim.limitations.length})
            </p>
            <div className="space-y-1">
              {selectedClaim.limitations.map((lim, idx) => (
                <button
                  key={lim.id}
                  onClick={() => {
                    setSelectedLimitationId(lim.id);
                    const pIds = lim.mappedPassages.map(mp => mp.passageId);
                    onHighlight(pIds);
                  }}
                  className={`w-full text-left p-2.5 rounded-md transition-colors ${
                    selectedLimitationId === lim.id
                      ? 'bg-accent/10 border border-accent/20'
                      : 'bg-surface-2 hover:bg-surface-3 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="text-[10px] text-text-muted">Limitation {idx + 1}</span>
                    {lim.mappedPassages.length > 0 && (
                      <span className="text-[10px] text-accent-bright ml-auto">
                        {lim.mappedPassages.length} matches
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {lim.text.substring(0, 120)}
                    {lim.text.length > 120 && '...'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Mapping results */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedLimitationId ? (
              (() => {
                const lim = selectedClaim.limitations.find(l => l.id === selectedLimitationId);
                if (!lim) return null;

                return (
                  <>
                    <h3 className="text-sm font-semibold mb-1 text-text-primary">Mapping Results</h3>
                    <p className="text-[11px] text-text-secondary mb-4 bg-surface-2 p-2 rounded border border-border">
                      {lim.text}
                    </p>

                    {lim.mappedPassages.length === 0 ? (
                      <p className="text-xs text-text-muted py-4">No matching passages found.</p>
                    ) : (
                      <div className="space-y-3">
                        {lim.mappedPassages.map((mp, idx) => {
                          const passage = getPassage(mp.passageId);
                          if (!passage) return null;
                          const section = getSection(passage.sectionId);
                          const badge = getConfidenceBadge(mp.score);

                          return (
                            <div
                              key={idx}
                              className="bg-surface-2 border border-border rounded-lg p-3 hover:border-border-bright transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-text-muted">
                                  {section?.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>
                                    {badge.label} ({(mp.score * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                                {passage.text.substring(0, 300)}
                                {passage.text.length > 300 && '...'}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-text-muted italic">
                                  {mp.rationale}
                                </span>
                                <button
                                  onClick={() => onAddSnippet(passage.text, {
                                    sectionName: section?.name,
                                    passageId: passage.id,
                                    claimId: selectedClaim.id,
                                  })}
                                  className="flex items-center gap-1 text-[10px] text-accent-bright hover:text-accent transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Snippet
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-text-muted">
                Select a limitation to see passage mappings
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
          {doc.claims.length > 0
            ? 'Select a claim to view its limitations and spec mappings'
            : 'No claims found in the document'
          }
        </div>
      )}
    </div>
  );
}
