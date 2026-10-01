'use client';

import { Network, Layers, Sparkles, Map, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { PatentDoc, getBoilerplateLabel } from '@/lib/types';
import { PanelId } from '@/lib/hooks/usePatentStore';
import { useState } from 'react';

interface SidebarProps {
  doc: PatentDoc | null;
  activePanel: PanelId;
  setActivePanel: (p: PanelId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  hideBoilerplate: boolean;
  setHideBoilerplate: (v: boolean) => void;
  showOnlyNovelty: boolean;
  setShowOnlyNovelty: (v: boolean) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (v: number) => void;
  recompute: () => void;
  passageCounts: Record<string, number>;
}

const panels: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: 'mindmap', label: 'Mind Map', icon: <Network className="w-4 h-4" /> },
  { id: 'clusters', label: 'Clusters', icon: <Layers className="w-4 h-4" /> },
  { id: 'novelty', label: 'Novelty', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'claimmap', label: 'Claim Map', icon: <Map className="w-4 h-4" /> },
];

export default function Sidebar({
  doc,
  activePanel,
  setActivePanel,
  searchQuery,
  setSearchQuery,
  hideBoilerplate,
  setHideBoilerplate,
  showOnlyNovelty,
  setShowOnlyNovelty,
  similarityThreshold,
  setSimilarityThreshold,
  recompute,
  passageCounts,
}: SidebarProps) {
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [thresholdDirty, setThresholdDirty] = useState(false);

  return (
    <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0 overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search... (Ctrl+F)"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-2 border border-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2 border-b border-border">
        <p className="text-[10px] uppercase tracking-wider text-text-muted px-2 mb-1.5">Panels</p>
        {panels.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              activePanel === p.id
                ? 'bg-accent/20 text-accent-bright glow-sm'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </nav>

      {/* Document Outline */}
      {doc && (
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setOutlineOpen(!outlineOpen)}
            className="w-full flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted hover:text-text-secondary"
          >
            {outlineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Document Outline
          </button>
          {outlineOpen && (
            <div className="mt-1 space-y-0.5">
              {doc.sections.map(section => (
                <div
                  key={section.id}
                  className="flex items-center justify-between px-2.5 py-1 rounded text-xs text-text-secondary hover:bg-surface-2 cursor-default"
                >
                  <span className="truncate">{section.name}</span>
                  <span className="text-[10px] text-text-muted ml-1">
                    {passageCounts[section.id] || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="p-3 border-t border-border space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-text-muted">Filters</p>

        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={hideBoilerplate}
            onChange={e => setHideBoilerplate(e.target.checked)}
            className="accent-accent w-3.5 h-3.5"
          />
          Hide Boilerplate
        </label>

        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyNovelty}
            onChange={e => setShowOnlyNovelty(e.target.checked)}
            className="accent-accent w-3.5 h-3.5"
          />
          Show Only Novelty
        </label>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">Similarity</span>
            <span className="text-[10px] text-text-muted">{similarityThreshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="0.8"
            step="0.05"
            value={similarityThreshold}
            onChange={e => {
              setSimilarityThreshold(parseFloat(e.target.value));
              setThresholdDirty(true);
            }}
            className="w-full accent-accent h-1"
          />
          {thresholdDirty && (
            <button
              onClick={() => { recompute(); setThresholdDirty(false); }}
              className="mt-1.5 w-full px-2 py-1 text-[10px] bg-accent/20 text-accent-bright rounded hover:bg-accent/30 transition-colors"
            >
              Recompute Clusters
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
