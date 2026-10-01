'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { usePatentStore } from '@/lib/hooks/usePatentStore';
import { loadSamplePatent } from '@/lib/sample/loadSample';
import { extractTextFromPdf } from '@/lib/processing/pdf';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SnippetRail from '@/components/SnippetRail';
import CommandPalette from '@/components/CommandPalette';
import EmptyState from '@/components/EmptyState';
import MindMapPanel from '@/components/panels/MindMapPanel';
import ClustersPanel from '@/components/panels/ClustersPanel';
import NoveltyPanel from '@/components/panels/NoveltyPanel';
import ClaimMapPanel from '@/components/panels/ClaimMapPanel';

export default function Home() {
  const store = usePatentStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }

      if (mod && e.key === 'f') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('aside input[type="text"]');
        input?.focus();
      }

      if (mod && e.key === 'Enter') {
        e.preventDefault();
        const selection = window.getSelection()?.toString();
        if (selection && selection.trim()) {
          store.addSnippet(selection.trim(), {});
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store.addSnippet]);

  const handleLoadSample = useCallback(async () => {
    try {
      const text = await loadSamplePatent();
      store.ingestText(text);
    } catch (e) {
      console.error('Failed to load sample:', e);
    }
  }, [store.ingestText]);

  const handleUploadFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setLoadingFile(true);
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const text = await extractTextFromPdf(file);
        store.ingestText(text);
      } else {
        const text = await file.text();
        if (text.trim()) {
          store.ingestText(text);
        } else {
          setErrorMsg('The file appears to be empty.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read file.';
      setErrorMsg(msg);
      console.error('File upload error:', err);
    } finally {
      setLoadingFile(false);
    }
  }, [store.ingestText]);

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim()) {
      store.ingestText(pasteText.trim());
      setPasteText('');
      setShowPasteModal(false);
    }
  }, [pasteText, store.ingestText]);

  // Passage counts per section
  const passageCounts = useMemo(() => {
    if (!store.doc) return {};
    const counts: Record<string, number> = {};
    for (const p of store.filteredPassages) {
      counts[p.sectionId] = (counts[p.sectionId] || 0) + 1;
    }
    return counts;
  }, [store.doc, store.filteredPassages]);

  const renderPanel = () => {
    if (!store.doc) {
      return (
        <EmptyState
          onLoadSample={handleLoadSample}
          onUploadFile={handleUploadFile}
          onOpenPaste={() => setShowPasteModal(true)}
        />
      );
    }

    switch (store.activePanel) {
      case 'mindmap':
        return (
          <MindMapPanel
            doc={store.doc}
            clusters={store.clusters}
            onAddSnippet={store.addSnippet}
            onHighlight={store.highlightPassages}
          />
        );
      case 'clusters':
        return (
          <ClustersPanel
            doc={store.doc}
            clusters={store.clusters}
            onAddSnippet={store.addSnippet}
            onHighlight={store.highlightPassages}
          />
        );
      case 'novelty':
        return (
          <NoveltyPanel
            doc={store.doc}
            onAddSnippet={store.addSnippet}
            onHighlight={store.highlightPassages}
          />
        );
      case 'claimmap':
        return (
          <ClaimMapPanel
            doc={store.doc}
            onAddSnippet={store.addSnippet}
            onHighlight={store.highlightPassages}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <Header
        onIngest={store.ingestText}
        onUploadFile={handleUploadFile}
        onOpenPaste={() => setShowPasteModal(true)}
        snippets={store.snippets}
        docTitle={store.doc?.title}
        isProcessing={store.isProcessing}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          doc={store.doc}
          activePanel={store.activePanel}
          setActivePanel={store.setActivePanel}
          searchQuery={store.searchQuery}
          setSearchQuery={store.setSearchQuery}
          hideBoilerplate={store.hideBoilerplate}
          setHideBoilerplate={store.setHideBoilerplate}
          showOnlyNovelty={store.showOnlyNovelty}
          setShowOnlyNovelty={store.setShowOnlyNovelty}
          similarityThreshold={store.similarityThreshold}
          setSimilarityThreshold={store.setSimilarityThreshold}
          recompute={store.recompute}
          passageCounts={passageCounts}
        />

        <main className="flex-1 overflow-hidden bg-background">
          {renderPanel()}
        </main>

        <SnippetRail
          snippets={store.snippets}
          onRemove={store.removeSnippet}
          onTogglePin={store.togglePinSnippet}
          onAddTag={store.addTagToSnippet}
          onRemoveTag={store.removeTagFromSnippet}
          docTitle={store.doc?.title}
        />
      </div>

      {/* Processing overlay */}
      {store.isProcessing && (
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface-2 border border-border rounded-xl p-8 flex flex-col items-center gap-4 glow">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent-bright animate-spin" />
              <Loader2 className="w-6 h-6 text-accent-bright absolute top-3 left-3 animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">Analyzing Patent</p>
              <p className="text-xs text-text-secondary mt-1">Detecting sections, extracting claims, clustering passages...</p>
            </div>
          </div>
        </div>
      )}

      {/* Paste modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-border rounded-xl p-6 w-full max-w-2xl mx-4 glow">
            <h2 className="text-lg font-semibold mb-3">Paste Patent Text</h2>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste the full patent text here..."
              className="w-full h-64 bg-surface border border-border rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowPasteModal(false); setPasteText(''); }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed glow-hover"
              >
                Process Patent
              </button>
            </div>
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        setActivePanel={store.setActivePanel}
        searchResults={store.searchResults}
        searchQuery={store.searchQuery}
        setSearchQuery={store.setSearchQuery}
        onHighlight={store.highlightPassages}
      />
    </div>
  );
}
