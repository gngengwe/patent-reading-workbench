'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Network, Layers, Sparkles, Map, FileText, X } from 'lucide-react';
import { PanelId, SearchResult } from '@/lib/hooks/usePatentStore';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  setActivePanel: (p: PanelId) => void;
  searchResults: SearchResult[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onHighlight: (ids: string[]) => void;
}

type PanelCommand = { kind: 'panel'; id: PanelId; label: string; icon: React.ReactNode };
type ResultCommand = { kind: 'result'; result: SearchResult };
type CommandItem = PanelCommand | ResultCommand;

const panelCommands: PanelCommand[] = [
  { kind: 'panel', id: 'mindmap', label: 'Go to Mind Map', icon: <Network className="w-4 h-4" /> },
  { kind: 'panel', id: 'clusters', label: 'Go to Clusters', icon: <Layers className="w-4 h-4" /> },
  { kind: 'panel', id: 'novelty', label: 'Go to Novelty', icon: <Sparkles className="w-4 h-4" /> },
  { kind: 'panel', id: 'claimmap', label: 'Go to Claim Map', icon: <Map className="w-4 h-4" /> },
];

export default function CommandPalette({
  open,
  onClose,
  setActivePanel,
  searchResults,
  searchQuery,
  setSearchQuery,
  onHighlight,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [searchQuery]);

  if (!open) return null;

  const filteredPanels = searchQuery
    ? panelCommands.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : panelCommands;

  const allItems: CommandItem[] = [
    ...filteredPanels,
    ...searchResults.map(r => ({ kind: 'result' as const, result: r })),
  ];

  const handleSelect = (idx: number) => {
    const item = allItems[idx];
    if (!item) return;

    if (item.kind === 'panel') {
      setActivePanel(item.id);
    } else {
      const r = item.result;
      onHighlight([r.id]);
      if (r.type === 'passage') setActivePanel('clusters');
      else if (r.type === 'claim') setActivePanel('claimmap');
      else if (r.type === 'cluster') setActivePanel('clusters');
    }
    setSearchQuery('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIdx);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-2 border border-border rounded-xl w-full max-w-lg mx-4 overflow-hidden glow"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to panel..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">No results found</p>
          ) : (
            allItems.map((item, idx) => (
              <button
                key={`${item.kind}-${idx}`}
                onClick={() => handleSelect(idx)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  idx === selectedIdx
                    ? 'bg-accent/15 text-accent-bright'
                    : 'text-text-secondary hover:bg-surface-3'
                }`}
              >
                {item.kind === 'panel' ? (
                  <>
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-text-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-muted capitalize">
                          {item.result.type}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {item.result.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate mt-0.5">
                        {item.result.text}
                      </p>
                    </div>
                  </>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex gap-4 text-[10px] text-text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
