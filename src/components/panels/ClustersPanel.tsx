'use client';

import { useState } from 'react';
import { Layers, Eye, EyeOff, Plus } from 'lucide-react';
import { PatentDoc, Cluster, getBoilerplateLabel } from '@/lib/types';

interface ClustersPanelProps {
  doc: PatentDoc;
  clusters: Cluster[];
  onAddSnippet: (text: string, source: { sectionName?: string; passageId?: string }) => void;
  onHighlight: (ids: string[]) => void;
}

export default function ClustersPanel({ doc, clusters, onAddSnippet, onHighlight }: ClustersPanelProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [hideBoilerplateInCluster, setHideBoilerplateInCluster] = useState(false);

  const selected = clusters.find(c => c.id === selectedCluster);

  const getPassage = (id: string) => doc.passages.find(p => p.id === id);
  const getSection = (sId: string) => doc.sections.find(s => s.id === sId);

  const clusterCharacter = (cluster: Cluster) => {
    const passages = cluster.passageIds.map(id => getPassage(id)).filter(Boolean);
    const avgBoilerplate = passages.reduce((s, p) => s + (p?.boilerplateScore || 0), 0) / (passages.length || 1);
    return avgBoilerplate >= 0.5 ? 'Boilerplate-heavy' : 'Substantive-heavy';
  };

  const clusterPassages = selected
    ? selected.passageIds
        .map(id => getPassage(id))
        .filter(Boolean)
        .filter(p => !hideBoilerplateInCluster || (p && p.boilerplateScore < 0.6))
    : [];

  return (
    <div className="flex h-full">
      {/* Cluster list */}
      <div className="w-72 border-r border-border overflow-y-auto p-3 shrink-0">
        <h2 className="text-base font-semibold mb-3 text-text-primary flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-bright" />
          Clusters
        </h2>

        <div className="space-y-1.5">
          {clusters.map(cluster => {
            const char = clusterCharacter(cluster);
            const isSelected = selectedCluster === cluster.id;

            return (
              <button
                key={cluster.id}
                onClick={() => {
                  setSelectedCluster(cluster.id);
                  onHighlight(cluster.passageIds);
                }}
                className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-accent/15 border border-accent/30 glow-sm'
                    : 'bg-surface-2 border border-transparent hover:bg-surface-3'
                }`}
              >
                <div className="text-xs font-medium text-text-primary truncate mb-1">
                  {cluster.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">
                    {cluster.passageIds.length} passages
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    char === 'Boilerplate-heavy'
                      ? 'bg-boilerplate/20 text-boilerplate'
                      : 'bg-novelty/20 text-novelty'
                  }`}>
                    {char}
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <span>Redundancy:</span>
                    <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${cluster.redundancyScore * 100}%` }}
                      />
                    </div>
                    <span>{(cluster.redundancyScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cluster detail */}
      <div className="flex-1 overflow-y-auto p-4">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">{selected.label}</h3>
              <button
                onClick={() => setHideBoilerplateInCluster(!hideBoilerplateInCluster)}
                className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
              >
                {hideBoilerplateInCluster ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {hideBoilerplateInCluster ? 'Show all' : 'Collapse boilerplate'}
              </button>
            </div>

            {/* Auto-summary */}
            <div className="bg-surface-2 border border-border rounded-lg p-3 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Summary</p>
              <p className="text-xs text-text-secondary leading-relaxed">{selected.summary}</p>
            </div>

            {/* Passages */}
            <div className="space-y-2">
              {clusterPassages.map(passage => {
                if (!passage) return null;
                const section = getSection(passage.sectionId);
                const label = getBoilerplateLabel(passage.boilerplateScore);

                return (
                  <div
                    key={passage.id}
                    className="bg-surface-2 border border-border rounded-lg p-3 hover:border-border-bright transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-text-muted">{section?.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          label === 'Boilerplate'
                            ? 'bg-boilerplate/20 text-boilerplate'
                            : label === 'Substantive'
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                        }`}>
                          {label}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          N:{(passage.noveltyScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                      {passage.text.substring(0, 400)}
                      {passage.text.length > 400 && '...'}
                    </p>
                    <div className="flex items-center gap-2">
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
                      <div className="flex gap-1 flex-wrap">
                        {passage.keyPhrases.slice(0, 4).map(kp => (
                          <span key={kp} className="text-[9px] px-1.5 py-0.5 bg-surface-3 text-text-muted rounded">
                            {kp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-text-muted">
            Select a cluster to view details
          </div>
        )}
      </div>
    </div>
  );
}
