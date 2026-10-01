import { Snippet } from '../types';

const STORAGE_KEY = 'patent-workbench-snippets';

export function loadSnippets(): Snippet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSnippets(snippets: Snippet[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  } catch {
    // Storage full or unavailable
  }
}

export function exportSnippetsToMarkdown(snippets: Snippet[], title?: string): string {
  const pinned = snippets.filter(s => s.pinned);
  const unpinned = snippets.filter(s => !s.pinned);

  let md = `# ${title || 'Patent Workbench'} — Snippets\n\n`;
  md += `*Exported ${new Date().toLocaleDateString()}*\n\n`;

  if (pinned.length > 0) {
    md += `## Pinned\n\n`;
    for (const s of pinned) {
      md += formatSnippetMd(s);
    }
  }

  if (unpinned.length > 0) {
    md += `## Snippets\n\n`;
    for (const s of unpinned) {
      md += formatSnippetMd(s);
    }
  }

  return md;
}

function formatSnippetMd(s: Snippet): string {
  let md = `> ${s.text}\n\n`;
  const sources: string[] = [];
  if (s.source.sectionName) sources.push(`Section: ${s.source.sectionName}`);
  if (s.source.claimId) sources.push(`Claim`);
  if (s.tags.length > 0) sources.push(`Tags: ${s.tags.join(', ')}`);
  if (sources.length > 0) md += `*${sources.join(' | ')}*\n\n`;
  md += `---\n\n`;
  return md;
}
