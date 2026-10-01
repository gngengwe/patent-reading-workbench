'use client';

import { useState } from 'react';
import { Pin, PinOff, Copy, Trash2, Tag, X, Search, Download, ClipboardList } from 'lucide-react';
import { Snippet } from '@/lib/types';
import { exportSnippetsToMarkdown } from '@/lib/storage/snippets';

interface SnippetRailProps {
  snippets: Snippet[];
  onRemove: (id: string) => void;
  onTogglePin: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  docTitle?: string;
}

export default function SnippetRail({
  snippets,
  onRemove,
  onTogglePin,
  onAddTag,
  onRemoveTag,
  docTitle,
}: SnippetRailProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [taggingId, setTaggingId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // All unique tags
  const allTags = [...new Set(snippets.flatMap(s => s.tags))];

  // Filter snippets
  let filtered = snippets;
  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    filtered = filtered.filter(
      s => s.text.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (tagFilter) {
    filtered = filtered.filter(s => s.tags.includes(tagFilter));
  }

  // Sort: pinned first, then by createdAt
  filtered = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* fallback */ }
  };

  const handleCopyAll = async () => {
    const md = exportSnippetsToMarkdown(snippets, docTitle);
    try {
      await navigator.clipboard.writeText(md);
      showToast('All snippets copied as Markdown');
    } catch { /* fallback */ }
  };

  const handleDownload = () => {
    const md = exportSnippetsToMarkdown(snippets, docTitle);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patent-snippets.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloading snippets.md');
  };

  const handleAddTag = (id: string) => {
    if (newTag.trim()) {
      onAddTag(id, newTag.trim());
      setNewTag('');
      setTaggingId(null);
    }
  };

  return (
    <aside className="w-72 bg-surface border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-accent-bright" />
            Snippets
            <span className="text-text-muted font-normal">({snippets.length})</span>
          </h3>
          {snippets.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={handleCopyAll}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                title="Copy all as Markdown"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={handleDownload}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                title="Download .md"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Search + tag filter */}
        {snippets.length > 0 && (
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search snippets..."
                className="w-full pl-7 pr-2 py-1 text-[10px] bg-surface-2 border border-border rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tagFilter && (
                  <button
                    onClick={() => setTagFilter('')}
                    className="text-[9px] px-1.5 py-0.5 bg-accent/20 text-accent-bright rounded flex items-center gap-0.5"
                  >
                    {tagFilter} <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {allTags.filter(t => t !== tagFilter).slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tag)}
                    className="text-[9px] px-1.5 py-0.5 bg-surface-3 text-text-muted rounded hover:text-text-secondary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Snippet cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
            <p className="text-[11px] text-text-muted">
              {snippets.length === 0
                ? 'No snippets yet. Select text and press Ctrl+Enter or use "Add to Snippets" buttons.'
                : 'No snippets match your filter.'}
            </p>
          </div>
        ) : (
          filtered.map(snippet => (
            <div
              key={snippet.id}
              className={`bg-surface-2 border rounded-lg p-2.5 group transition-colors ${
                snippet.pinned
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-border hover:border-border-bright'
              }`}
            >
              <p className="text-[11px] text-text-secondary leading-relaxed mb-2 line-clamp-4">
                {snippet.text}
              </p>

              {/* Source + Tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {snippet.source.sectionName && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-surface-3 text-text-muted rounded">
                    {snippet.source.sectionName}
                  </span>
                )}
                {snippet.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 bg-accent/15 text-accent-bright rounded flex items-center gap-0.5 cursor-pointer"
                    onClick={() => onRemoveTag(snippet.id, tag)}
                    title="Click to remove tag"
                  >
                    {tag} <X className="w-2 h-2" />
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(snippet.text, snippet.id)}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onTogglePin(snippet.id)}
                  className="p-1 text-text-muted hover:text-accent-bright transition-colors"
                  title={snippet.pinned ? 'Unpin' : 'Pin'}
                >
                  {snippet.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => {
                    setTaggingId(taggingId === snippet.id ? null : snippet.id);
                    setNewTag('');
                  }}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Add tag"
                >
                  <Tag className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemove(snippet.id)}
                  className="p-1 text-text-muted hover:text-danger transition-colors ml-auto"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Tag input */}
              {taggingId === snippet.id && (
                <div className="mt-2 flex gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag(snippet.id)}
                    placeholder="Tag name..."
                    className="flex-1 px-2 py-1 text-[10px] bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddTag(snippet.id)}
                    className="px-2 py-1 text-[10px] bg-accent/20 text-accent-bright rounded hover:bg-accent/30"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="absolute bottom-4 right-4 px-3 py-2 bg-surface-3 border border-accent/30 rounded-lg text-xs text-accent-bright glow-sm animate-pulse">
          {toastMsg}
        </div>
      )}
    </aside>
  );
}
