'use client';

import { useRef } from 'react';
import { Upload, FileText, Clipboard, Download, Loader2, Beaker } from 'lucide-react';
import { loadSamplePatent } from '@/lib/sample/loadSample';
import { exportSnippetsToMarkdown } from '@/lib/storage/snippets';
import { Snippet } from '@/lib/types';

interface HeaderProps {
  onIngest: (text: string) => void;
  onUploadFile: (file: File) => void;
  onOpenPaste: () => void;
  snippets: Snippet[];
  docTitle?: string;
  isProcessing: boolean;
}

export default function Header({ onIngest, onUploadFile, onOpenPaste, snippets, docTitle, isProcessing }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSample = async () => {
    try {
      const text = await loadSamplePatent();
      onIngest(text);
    } catch (e) {
      console.error('Failed to load sample:', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
    e.target.value = '';
  };

  const handleExportSnippets = () => {
    const md = exportSnippetsToMarkdown(snippets, docTitle);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patent-snippets.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center px-4 gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <Beaker className="w-5 h-5 text-accent-bright" />
        <h1 className="text-sm font-semibold text-text-primary tracking-wide">Patent Workbench</h1>
      </div>

      {docTitle && (
        <span className="text-xs text-text-secondary truncate max-w-64 ml-2 border-l border-border pl-3">
          {docTitle}
        </span>
      )}

      <div className="flex-1" />

      {isProcessing && (
        <div className="flex items-center gap-1.5 text-xs text-accent-bright">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Processing...
        </div>
      )}

      <button
        onClick={handleLoadSample}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/20 text-accent-bright rounded-md hover:bg-accent/30 transition-colors glow-hover"
      >
        <FileText className="w-3.5 h-3.5" />
        Load Sample
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded-md hover:bg-surface-3 transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={onOpenPaste}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded-md hover:bg-surface-3 transition-colors"
      >
        <Clipboard className="w-3.5 h-3.5" />
        Paste
      </button>

      {snippets.length > 0 && (
        <button
          onClick={handleExportSnippets}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 text-text-secondary rounded-md hover:bg-surface-3 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      )}
    </header>
  );
}
