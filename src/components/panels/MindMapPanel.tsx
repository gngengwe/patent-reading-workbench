'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Circle } from 'lucide-react';
import { PatentDoc, Cluster, Passage } from '@/lib/types';

interface MindMapPanelProps {
  doc: PatentDoc;
  clusters: Cluster[];
  onAddSnippet: (text: string, source: { sectionName?: string; passageId?: string }) => void;
  onHighlight: (ids: string[]) => void;
}

export default function MindMapPanel({ doc, clusters, onAddSnippet, onHighlight }: MindMapPanelProps) {
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [expandedPassages, setExpandedPassages] = useState<Set<string>>(new Set());

  const topClusters = clusters
    .slice()
    .sort((a, b) => {
      const aScore = Math.max(
        ...a.passageIds.map(id => doc.passages.find(p => p.id === id)?.noveltyScore || 0)
      );
      const bScore = Math.max(
        ...b.passageIds.map(id => doc.passages.find(p => p.id === id)?.noveltyScore || 0)
      );
      return bScore - aScore;
    })
    .slice(0, 8);

  const toggleCluster = (id: string) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePassage = (id: string) => {
    setExpandedPassages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getPassage = (id: string) => doc.passages.find(p => p.id === id);
  const getSection = (sId: string) => doc.sections.find(s => s.id === sId);

  // Find claim limitations that reference any passage in a cluster
  const getRelatedLimitations = (cluster: Cluster) => {
    const pIds = new Set(cluster.passageIds);
    const results: { claimNum: number; text: string }[] = [];
    for (const claim of doc.claims) {
      for (const lim of claim.limitations) {
        for (const mp of lim.mappedPassages) {
          if (pIds.has(mp.passageId)) {
            results.push({ claimNum: claim.number, text: lim.text });
            break;
          }
        }
      }
    }
    return results.slice(0, 3);
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h2 className="text-base font-semibold mb-4 text-text-primary">Mind Map</h2>

      {/* Root node */}
      <div className="ml-2">
        <div className="flex items-center gap-2 mb-3">
          <Circle className="w-3 h-3 text-accent-bright fill-accent-bright" />
          <span className="text-sm font-medium text-accent-bright">
            {doc.title || 'Untitled Patent'}
          </span>
        </div>

        {/* Cluster children */}
        <div className="ml-6 border-l border-border pl-4 space-y-1">
          {topClusters.map(cluster => {
            const isExpanded = expandedClusters.has(cluster.id);
            const relatedLims = getRelatedLimitations(cluster);

            return (
              <div key={cluster.id}>
                <button
                  onClick={() => {
                    toggleCluster(cluster.id);
                    onHighlight(cluster.passageIds);
                  }}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-surface-2 transition-colors w-full text-left group"
                >
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  }
                  <Circle className="w-2.5 h-2.5 text-novelty fill-novelty/30 shrink-0" />
                  <span className="text-xs text-text-secondary group-hover:text-text-primary truncate">
                    {cluster.label}
                  </span>
                  <span className="text-[10px] text-text-muted ml-auto shrink-0">
                    {cluster.passageIds.length}p
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-8 border-l border-border/50 pl-3 space-y-0.5 mb-2">
                    {/* Passages */}
                    {cluster.passageIds.slice(0, 5).map(pid => {
                      const passage = getPassage(pid);
                      if (!passage) return null;
                      const section = getSection(passage.sectionId);
                      const pExpanded = expandedPassages.has(pid);

                      return (
                        <div key={pid}>
                          <button
                            onClick={() => {
                              togglePassage(pid);
                              onHighlight([pid]);
                            }}
                            className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-surface-2 transition-colors w-full text-left"
                          >
                            {pExpanded
                              ? <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
                              : <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
                            }
                            <span className="text-[11px] text-text-secondary truncate">
                              {passage.text.substring(0, 60)}...
                            </span>
                            <span className="text-[10px] text-text-muted shrink-0 ml-auto">
                              {section?.name}
                            </span>
                          </button>

                          {pExpanded && (
                            <div className="ml-6 py-2 px-3 bg-surface-2 rounded-md mt-1 mb-1">
                              <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                                {passage.text.substring(0, 300)}
                                {passage.text.length > 300 && '...'}
                              </p>
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
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {cluster.passageIds.length > 5 && (
                      <p className="text-[10px] text-text-muted px-1.5 py-0.5">
                        +{cluster.passageIds.length - 5} more passages
                      </p>
                    )}

                    {/* Related claim limitations */}
                    {relatedLims.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <p className="text-[10px] text-text-muted mb-1">Related Claims:</p>
                        {relatedLims.map((rl, i) => (
                          <div key={i} className="text-[10px] text-text-secondary py-0.5 px-1.5">
                            <span className="text-accent-bright">Claim {rl.claimNum}:</span>{' '}
                            {rl.text.substring(0, 80)}...
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
