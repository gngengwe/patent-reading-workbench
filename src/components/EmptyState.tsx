'use client';

import { useRef } from 'react';
import { Beaker, FileText, Upload, Clipboard } from 'lucide-react';

interface EmptyStateProps {
  onLoadSample: () => void;
  onUploadFile: (file: File) => void;
  onOpenPaste: () => void;
}

export default function EmptyState({ onLoadSample, onUploadFile, onOpenPaste }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center glow">
            <Beaker className="w-8 h-8 text-accent-bright" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Patent Workbench</h2>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          Analyze patent text to discover clusters of repeated ideas, identify novelty signals,
          and map claims to specification passages.
        </p>

        <div className="space-y-3">
          <button
            onClick={onLoadSample}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent/20 text-accent-bright rounded-lg hover:bg-accent/30 transition-colors glow-hover text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Load Sample Patent
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 text-text-secondary rounded-lg text-sm hover:bg-surface-3 hover:text-text-primary transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-text-muted" />
              Upload .txt / .pdf
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 text-text-secondary rounded-lg text-sm hover:bg-surface-3 hover:text-text-primary transition-colors cursor-pointer"
            >
              <Clipboard className="w-4 h-4 text-text-muted" />
              Paste text
            </button>
          </div>
        </div>

        <p className="text-[10px] text-text-muted mt-8">
          Use the header buttons or press <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-text-secondary">Ctrl+K</kbd> for the command palette
        </p>
      </div>
    </div>
  );
}
