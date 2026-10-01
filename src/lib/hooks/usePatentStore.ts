'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { PatentDoc, Cluster, Snippet, Section, Passage, Claim } from '../types';
import { processPatentText, ProcessingResult } from '../processing';
import { loadSnippets, saveSnippets } from '../storage/snippets';
import { generateId } from '../utils';

export type PanelId = 'mindmap' | 'clusters' | 'novelty' | 'claimmap';

export interface PatentStore {
  // Data
  doc: PatentDoc | null;
  clusters: Cluster[];
  snippets: Snippet[];
  // UI State
  activePanel: PanelId;
  searchQuery: string;
  hideBoilerplate: boolean;
  showOnlyNovelty: boolean;
  similarityThreshold: number;
  isProcessing: boolean;
  highlightedPassageIds: string[];
  // Actions
  ingestText: (text: string) => void;
  setActivePanel: (panel: PanelId) => void;
  setSearchQuery: (q: string) => void;
  setHideBoilerplate: (v: boolean) => void;
  setShowOnlyNovelty: (v: boolean) => void;
  setSimilarityThreshold: (v: number) => void;
  recompute: () => void;
  addSnippet: (text: string, source: Snippet['source']) => void;
  removeSnippet: (id: string) => void;
  togglePinSnippet: (id: string) => void;
  addTagToSnippet: (id: string, tag: string) => void;
  removeTagFromSnippet: (id: string, tag: string) => void;
  highlightPassages: (ids: string[]) => void;
  // Derived
  filteredPassages: Passage[];
  searchResults: SearchResult[];
}

export interface SearchResult {
  type: 'passage' | 'claim' | 'cluster';
  id: string;
  text: string;
  label: string;
}

export function usePatentStore(): PatentStore {
  const [doc, setDoc] = useState<PatentDoc | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activePanel, setActivePanel] = useState<PanelId>('mindmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideBoilerplate, setHideBoilerplate] = useState(false);
  const [showOnlyNovelty, setShowOnlyNovelty] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [highlightedPassageIds, setHighlightedPassageIds] = useState<string[]>([]);

  // Load snippets from localStorage on mount
  useEffect(() => {
    setSnippets(loadSnippets());
  }, []);

  // Save snippets to localStorage whenever they change
  useEffect(() => {
    saveSnippets(snippets);
  }, [snippets]);

  const ingestText = useCallback((text: string) => {
    setIsProcessing(true);
    setRawText(text);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const result: ProcessingResult = processPatentText(text, similarityThreshold);
        setDoc(result.doc);
        setClusters(result.clusters);
      } catch (e) {
        console.error('Processing error:', e);
      }
      setIsProcessing(false);
    }, 50);
  }, [similarityThreshold]);

  const recompute = useCallback(() => {
    if (!rawText) return;
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = processPatentText(rawText, similarityThreshold);
        setDoc(result.doc);
        setClusters(result.clusters);
      } catch (e) {
        console.error('Recompute error:', e);
      }
      setIsProcessing(false);
    }, 50);
  }, [rawText, similarityThreshold]);

  const addSnippet = useCallback((text: string, source: Snippet['source']) => {
    setSnippets(prev => [
      ...prev,
      {
        id: generateId(),
        text,
        source,
        tags: [],
        pinned: false,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const removeSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
  }, []);

  const togglePinSnippet = useCallback((id: string) => {
    setSnippets(prev =>
      prev.map(s => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }, []);

  const addTagToSnippet = useCallback((id: string, tag: string) => {
    setSnippets(prev =>
      prev.map(s =>
        s.id === id && !s.tags.includes(tag)
          ? { ...s, tags: [...s.tags, tag] }
          : s
      )
    );
  }, []);

  const removeTagFromSnippet = useCallback((id: string, tag: string) => {
    setSnippets(prev =>
      prev.map(s =>
        s.id === id ? { ...s, tags: s.tags.filter(t => t !== tag) } : s
      )
    );
  }, []);

  const highlightPassages = useCallback((ids: string[]) => {
    setHighlightedPassageIds(ids);
  }, []);

  const filteredPassages = useMemo(() => {
    if (!doc) return [];
    let passages = doc.passages;
    if (hideBoilerplate) {
      passages = passages.filter(p => p.boilerplateScore < 0.6);
    }
    if (showOnlyNovelty) {
      passages = passages.filter(p => p.noveltyScore > 0.1);
    }
    return passages;
  }, [doc, hideBoilerplate, showOnlyNovelty]);

  const searchResults = useMemo((): SearchResult[] => {
    if (!doc || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    for (const p of doc.passages) {
      if (p.text.toLowerCase().includes(q)) {
        const section = doc.sections.find(s => s.id === p.sectionId);
        results.push({
          type: 'passage',
          id: p.id,
          text: p.text.substring(0, 150) + '...',
          label: section?.name || 'Unknown Section',
        });
      }
    }

    for (const c of doc.claims) {
      if (c.text.toLowerCase().includes(q)) {
        results.push({
          type: 'claim',
          id: c.id,
          text: c.text.substring(0, 150) + '...',
          label: `Claim ${c.number}`,
        });
      }
    }

    for (const cl of clusters) {
      if (cl.label.toLowerCase().includes(q) || cl.summary.toLowerCase().includes(q)) {
        results.push({
          type: 'cluster',
          id: cl.id,
          text: cl.summary.substring(0, 150) + '...',
          label: cl.label,
        });
      }
    }

    return results.slice(0, 20);
  }, [doc, clusters, searchQuery]);

  return {
    doc,
    clusters,
    snippets,
    activePanel,
    searchQuery,
    hideBoilerplate,
    showOnlyNovelty,
    similarityThreshold,
    isProcessing,
    highlightedPassageIds,
    ingestText,
    setActivePanel,
    setSearchQuery,
    setHideBoilerplate,
    setShowOnlyNovelty,
    setSimilarityThreshold,
    recompute,
    addSnippet,
    removeSnippet,
    togglePinSnippet,
    addTagToSnippet,
    removeTagFromSnippet,
    highlightPassages,
    filteredPassages,
    searchResults,
  };
}
